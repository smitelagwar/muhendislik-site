import fs from "node:fs";
import path from "node:path";
import { expect, type CDPSession, type Page } from "@playwright/test";

/** Test sözleşmesi (DEĞİŞMEZ — Plan 03 yeni motoru da bu nitelikleri yayar):
 *  data-testid="pdf-scroll-viewport"   kaydırma kabı
 *  [data-page=N] / data-page-number    sayfa sarmalayıcı (gerçek getBoundingClientRect döndürür)
 *  data-page-state                     "empty"|"backdrop"|"rendered"  (v3: "rendering"|"rendered")
 *  canvas[data-layer="backdrop"|"sharp"]  v4'te; v3'te nitelik yok → keskin sayılır
 *  [data-pdf-viewer-state]             "idle"|"loading"|"rendering"
 *  html/root [data-zooming]            jest sürerken
 */
export const SCROLL = '[data-testid="pdf-scroll-viewport"]';
const V4_DIR = path.resolve(process.cwd(), ".test-data/pdf-v4-fixtures");
const REPO_DIR = path.resolve(process.cwd(), "tests/fixtures/pdf");

export type Fixture =
  | "a0-vektor" | "karisik-60" | "metin-1000" | "tarama-a3" | "linkli-300" // v4 (üretilir)
  | "tr-metin" | "karisik-boyut" | "uzun-300" | "dondurulmus-90" | "taranmis-metinsiz" | "linkli"; // repo

export function fixturePath(name: Fixture): string {
  for (const dir of [V4_DIR, REPO_DIR]) {
    const p = path.join(dir, `${name}.pdf`);
    if (fs.existsSync(p)) return p;
  }
  throw new Error(`Fixture yok: ${name}.pdf — önce \`node scripts/generate-pdf-fixtures-v4.mjs\` ve \`npm run generate:pdf-fixtures\` çalıştır.`);
}

export async function signIn(page: Page): Promise<void> {
  await page.goto("/dokumantasyon");
  const username = page.locator("input#username");
  const title = page.locator("h1:has-text('Dokümantasyon Modülü')");
  await expect.poll(async () => ((await username.isVisible()) ? "login" : (await title.isVisible()) ? "ws" : "pending"), { timeout: 20_000 }).not.toBe("pending");
  if (await username.isVisible()) {
    await username.fill("admin");
    await page.locator("input#password").fill("admin");
    await page.getByRole("button", { name: "Giriş Yap" }).click();
    await expect(username).toBeHidden({ timeout: 15_000 });
  }
}

const uploaded = new Map<string, string>();
export async function uploadPdf(page: Page, name: Fixture): Promise<string> {
  const cached = uploaded.get(name);
  if (cached) return cached;
  const b64 = fs.readFileSync(fixturePath(name)).toString("base64");
  const id = await page.evaluate(
    async ({ n, content }) => {
      const bytes = Uint8Array.from(atob(content), (c) => c.charCodeAt(0));
      const fd = new FormData();
      fd.append("file", new File([bytes], `${n}.pdf`, { type: "application/pdf" }));
      fd.append("pathname", `dok_storage/v4-${n}-${Date.now()}.pdf`);
      const r = await fetch("/api/dokumantasyon/upload/local", { method: "POST", body: fd });
      const j = await r.json();
      if (!r.ok || !j.file?.id) throw new Error(`upload failed: ${JSON.stringify(j)}`);
      return j.file.id as string;
    },
    { n: name, content: b64 }
  );
  uploaded.set(name, id);
  return id;
}

/** Giriş yapar, yükler, belgeyi açar, ilk sayfa çizilene kadar bekler. */
export async function openPdf(page: Page, name: Fixture): Promise<{ fileId: string; ttfrMs: number }> {
  await signIn(page);
  const fileId = await uploadPdf(page, name);
  const t0 = Date.now();
  await page.goto(`/dokumantasyon/dosya/${fileId}`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector(`${SCROLL} [data-page-state="rendered"]`, { timeout: 90_000 });
  return { fileId, ttfrMs: Date.now() - t0 };
}

export interface ViewInfo {
  scrollTop: number; scrollLeft: number; scrollHeight: number; clientWidth: number; clientHeight: number;
  visible: number[]; widths: Record<number, number>; mountedPages: number; renderedPages: number; domNodes: number;
}
export async function viewInfo(page: Page): Promise<ViewInfo> {
  return page.evaluate((SEL) => {
    const sc = document.querySelector(SEL) as HTMLElement | null;
    if (!sc) throw new Error("scroll viewport yok");
    const vr = sc.getBoundingClientRect();
    const pages = [...sc.querySelectorAll<HTMLElement>("[data-page]")];
    const visible = pages
      .filter((e) => { const r = e.getBoundingClientRect(); return Math.min(r.bottom, vr.bottom) - Math.max(r.top, vr.top) > 40; })
      .map((e) => Number(e.dataset.page));
    const widths: Record<number, number> = {};
    for (const e of pages) if (visible.includes(Number(e.dataset.page))) widths[Number(e.dataset.page)] = e.getBoundingClientRect().width;
    return {
      scrollTop: Math.round(sc.scrollTop * 10) / 10, scrollLeft: Math.round(sc.scrollLeft * 10) / 10,
      scrollHeight: sc.scrollHeight, clientWidth: sc.clientWidth, clientHeight: sc.clientHeight,
      visible, widths,
      mountedPages: pages.filter((e) => e.querySelector("canvas, .textLayer")).length,
      renderedPages: pages.filter((e) => e.getAttribute("data-page-state") === "rendered").length,
      domNodes: document.getElementsByTagName("*").length,
    };
  }, SCROLL);
}

/** Ekran noktasının sayfa-uzayı çıpası. */
export interface Anchor { page: number; fx: number; fy: number }
export async function anchorAt(page: Page, x: number, y: number): Promise<Anchor> {
  const a = await page.evaluate(([px, py]) => {
    for (const p of document.querySelectorAll<HTMLElement>("[data-page]")) {
      const r = p.getBoundingClientRect();
      if (px >= r.left && px <= r.right && py >= r.top && py <= r.bottom)
        return { page: Number(p.dataset.page), fx: (px - r.left) / r.width, fy: (py - r.top) / r.height };
    }
    return null;
  }, [x, y] as [number, number]);
  if (!a) throw new Error(`(${x},${y}) noktasında sayfa yok; çıpa alınamadı`);
  return a;
}
export async function anchorDrift(page: Page, a: Anchor, x: number, y: number): Promise<number> {
  const s = await page.evaluate((an) => {
    const p = document.querySelector<HTMLElement>(`[data-page="${an.page}"]`);
    if (!p) return null;
    const r = p.getBoundingClientRect();
    return { x: r.left + an.fx * r.width, y: r.top + an.fy * r.height };
  }, a);
  if (!s) return Number.POSITIVE_INFINITY; // çıpa sayfası DOM'dan kaybolmuş = kayma sonsuz
  return Math.round(Math.hypot(s.x - x, s.y - y) * 100) / 100;
}

/** Görünür sayfalar "rendered" ve görünür keskin canvas'lar ≥ 0.95·min(DPR,2) px/CSS-px olana dek ms. Zaman aşımı → 99999. */
export async function waitSharp(page: Page, timeoutMs = 10_000): Promise<number> {
  return page.evaluate(
    ({ timeoutMs: limit, SEL }) =>
      new Promise<number>((resolve) => {
        const t0 = performance.now();
        const min = 0.95 * Math.min(window.devicePixelRatio || 1, 2);
        const step = () => {
          const sc = document.querySelector(SEL);
          if (sc) {
            const vr = sc.getBoundingClientRect();
            let ok = true, any = false;
            outer: for (const p of sc.querySelectorAll<HTMLElement>("[data-page]")) {
              const r = p.getBoundingClientRect();
              if (Math.min(r.bottom, vr.bottom) - Math.max(r.top, vr.top) <= 40) continue;
              any = true;
              if (p.getAttribute("data-page-state") !== "rendered") { ok = false; break; }
              for (const c of p.querySelectorAll<HTMLCanvasElement>('canvas:not([data-layer="backdrop"])')) {
                const cr = c.getBoundingClientRect();
                if (cr.width < 1 || cr.bottom < vr.top || cr.top > vr.bottom || cr.right < vr.left || cr.left > vr.right) continue;
                if (c.width / cr.width < min) { ok = false; break outer; }
              }
            }
            if (any && ok) return resolve(Math.round(performance.now() - t0));
          }
          if (performance.now() - t0 > limit) return resolve(99_999);
          requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      }),
    { timeoutMs, SEL: SCROLL }
  );
}

/** Görünür keskin canvas'ların en kötü oranı ÷ min(DPR,2). 1.0 = tam çözünürlük. */
export async function sharpRatio(page: Page): Promise<number> {
  return page.evaluate((SEL) => {
    const sc = document.querySelector(SEL)!;
    const vr = sc.getBoundingClientRect();
    let worst = Number.POSITIVE_INFINITY;
    for (const c of sc.querySelectorAll<HTMLCanvasElement>('canvas:not([data-layer="backdrop"])')) {
      const r = c.getBoundingClientRect();
      if (r.width < 1 || r.bottom < vr.top || r.top > vr.bottom || r.right < vr.left || r.left > vr.right) continue;
      worst = Math.min(worst, c.width / r.width);
    }
    return Number.isFinite(worst) ? Math.round((worst / Math.min(window.devicePixelRatio || 1, 2)) * 1000) / 1000 : 0;
  }, SCROLL);
}

export async function canvasStats(page: Page): Promise<{ count: number; bytesMB: number; maxMP: number }> {
  return page.evaluate(() => {
    let bytes = 0, maxMP = 0, count = 0;
    for (const c of document.querySelectorAll("canvas")) {
      const px = c.width * c.height;
      count++; bytes += px * 4; maxMP = Math.max(maxMP, px / 1e6);
    }
    return { count, bytesMB: Math.round((bytes / 1048576) * 10) / 10, maxMP: Math.round(maxMP * 10) / 10 };
  });
}

export async function heapMB(cdp: CDPSession): Promise<number> {
  await cdp.send("HeapProfiler.collectGarbage");
  await cdp.send("Performance.enable");
  const { metrics } = await cdp.send("Performance.getMetrics");
  return Math.round(((metrics.find((m) => m.name === "JSHeapUsedSize")?.value ?? 0) / 1048576) * 10) / 10;
}

/** Araç çubuğundaki yüzde (ör. "125%"). */
export async function readZoomPercent(page: Page): Promise<number> {
  const t = await page.locator('[data-testid="pdf-viewer-toolbar"]').getByText(/^\d{1,4}%$/).first().innerText();
  return Number.parseInt(t, 10);
}

export async function browserZoom(page: Page): Promise<number> {
  return page.evaluate(() => window.visualViewport?.scale ?? 1);
}

/** Gezinti başından beri biriken uzun görevler (ms). `buffered` ile sonradan okunur. */
export async function longTasksSinceNavigation(page: Page): Promise<number[]> {
  return page.evaluate(
    () =>
      new Promise<number[]>((resolve) => {
        const out: number[] = [];
        const po = new PerformanceObserver((l) => { for (const e of l.getEntries()) out.push(e.duration); });
        try { po.observe({ type: "longtask", buffered: true }); } catch { return resolve([]); }
        setTimeout(() => { po.disconnect(); resolve(out); }, 60);
      })
  );
}

/** Kaydırma kabını belgenin f oranına (0..1) götürür. */
export async function scrollToFraction(page: Page, f: number): Promise<void> {
  await page.evaluate(([SEL, frac]) => {
    const sc = document.querySelector(SEL as string) as HTMLElement;
    sc.scrollTop = (sc.scrollHeight - sc.clientHeight) * (frac as number);
  }, [SCROLL, f] as const);
  await page.waitForTimeout(300);
}

/** Görünür hiçbir sayfa boş olmayana dek ms. Zaman aşımı → 99999. */
export async function waitNoBlank(page: Page, timeoutMs = 5000): Promise<number> {
  return page.evaluate(
    ({ limit, SEL }) =>
      new Promise<number>((resolve) => {
        const t0 = performance.now();
        const step = () => {
          const sc = document.querySelector(SEL)!;
          const vr = sc.getBoundingClientRect();
          let blank = false;
          for (const p of sc.querySelectorAll<HTMLElement>("[data-page]")) {
            const r = p.getBoundingClientRect();
            if (Math.min(r.bottom, vr.bottom) - Math.max(r.top, vr.top) <= 40) continue;
            const s = p.getAttribute("data-page-state");
            if (s === "empty" || s === "rendering" || s == null) { blank = true; break; }
          }
          if (!blank) return resolve(Math.round(performance.now() - t0));
          if (performance.now() - t0 > limit) return resolve(99_999);
          requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      }),
    { limit: timeoutMs, SEL: SCROLL }
  );
}

/** Sayfadaki en büyük canvas'ta koyu piksel sayısı (metin gerçekten çizildi mi?). Beyaz-ama-"rendered" hatasını yakalar. */
export async function inkPixels(page: Page, pageNo = 1): Promise<number> {
  return page.evaluate((n) => {
    const cs = [...document.querySelectorAll<HTMLCanvasElement>(`[data-page="${n}"] canvas`)];
    cs.sort((a, b) => b.width * b.height - a.width * a.height);
    const c = cs[0];
    if (!c || c.width === 0) return 0;
    try {
      const d = c.getContext("2d")!.getImageData(0, 0, c.width, c.height).data;
      let ink = 0;
      for (let i = 0; i < d.length; i += 4) if (d[i + 3] > 0 && d[i] < 100 && d[i + 1] < 100 && d[i + 2] < 100) ink++;
      return ink;
    } catch {
      return 0;
    }
  }, pageNo);
}

/** Zoom/animasyon bitene dek: [data-zooming] yok VE ilk görünür sayfanın genişliği quietMs boyunca sabit. Zaman aşımı → 99999. */
export async function waitZoomSettled(page: Page, quietMs = 300, timeoutMs = 15_000): Promise<number> {
  return page.evaluate(
    ({ quiet, limit, SEL }) =>
      new Promise<number>((resolve) => {
        const t0 = performance.now();
        let lastW = -1, lastChange = performance.now();
        const step = () => {
          const sc = document.querySelector(SEL);
          const now = performance.now();
          if (sc) {
            const vr = sc.getBoundingClientRect();
            const first = [...sc.querySelectorAll<HTMLElement>("[data-page]")].find((e) => {
              const r = e.getBoundingClientRect();
              return Math.min(r.bottom, vr.bottom) - Math.max(r.top, vr.top) > 40;
            });
            const w = first ? first.getBoundingClientRect().width : -1;
            if (Math.abs(w - lastW) > 0.01 || document.querySelector("[data-zooming]")) { lastW = w; lastChange = now; }
            if (now - lastChange >= quiet) return resolve(Math.round(now - t0 - quiet));
          }
          if (now - t0 > limit) return resolve(99_999);
          requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      }),
    { quiet: quietMs, limit: timeoutMs, SEL: SCROLL }
  );
}
