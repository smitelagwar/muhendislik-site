import fs from "node:fs";
import path from "node:path";
import type { BrowserContext, Page } from "@playwright/test";
import { test, expect } from "./helpers/test";
import { COMPAT_PRELUDE } from "./helpers/compat";
import { fixturePath } from "./helpers/viewer";

/**
 * S10b — Test düzeneğinin kendi kendini doğrulaması.
 *  1) NEGATİF KONTROL: node_modules içindeki MODERN pdf.js, "eski tarayıcı" simülasyonunda ÇÖKMELİ.
 *     Çökmüyorsa S10 hiçbir şeyi yakalamıyor demektir.
 *  2) POZİTİF KONTROL: LEGACY pdf.js + scripts/pdfjs-compat-polyfills.mjs (üretimdeki yapı:
 *     worker-entry + polyfill) aynı simülasyonda PDF'i ÇİZMELİ.
 * Sanal origin kullanır; uygulama sunucusu gerekmez.
 */
const ROOT = path.resolve(process.cwd(), "node_modules/pdfjs-dist");
const DIRS = { modern: "build", legacy: "legacy/build" } as const;
type Kind = keyof typeof DIRS;
const ORIGIN = "http://pdfjs-selftest.test";

// NOT: Playwright TS'yi CJS'e çevirir; tarayıcıya giden dinamik import() BİR STRING olmalı.
const RUN = (kind: Kind) => `(async () => {
  try {
    ${kind === "legacy" ? "await import('/legacy/compat-polyfills.mjs');" : ""}
    const lib = await import('/${kind}/pdf.min.mjs');
    lib.GlobalWorkerOptions.workerSrc = '/${kind}/worker-entry.mjs';
    const doc = await lib.getDocument({ url: '/doc.pdf' }).promise;
    const pg = await doc.getPage(1);
    const vp = pg.getViewport({ scale: 1 });
    const c = document.getElementById('c');
    c.width = Math.ceil(vp.width); c.height = Math.ceil(vp.height);
    const ctx = c.getContext('2d');
    await pg.render({ canvasContext: ctx, viewport: vp }).promise;
    const text = await pg.getTextContent();
    const d = ctx.getImageData(0, 0, c.width, c.height).data;
    let dark = 0;
    for (let i = 0; i < d.length; i += 4) if (d[i] < 128 && d[i + 3] > 0) dark++;
    return { ok: dark > 50 && text.items.length > 0, dark, items: text.items.length, error: null };
  } catch (e) { return { ok: false, dark: 0, items: 0, error: String((e && e.message) || e) }; }
})()`;

async function run(context: BrowserContext, page: Page, kind: Kind) {
  await context.addInitScript(COMPAT_PRELUDE); // ana iş parçacığı
  await context.route(`${ORIGIN}/**`, async (route) => {
    const u = new URL(route.request().url());
    const js = (body: string) => route.fulfill({ contentType: "text/javascript", body });
    if (u.pathname === "/") return route.fulfill({ contentType: "text/html", body: "<!doctype html><title>selftest</title><canvas id=c></canvas>" });
    if (u.pathname === "/doc.pdf") return route.fulfill({ contentType: "application/pdf", body: fs.readFileSync(fixturePath("tr-metin")) });
    if (u.pathname === "/__compat-prelude.mjs") return js(COMPAT_PRELUDE);
    if (u.pathname === "/legacy/compat-polyfills.mjs") return js(fs.readFileSync(path.resolve(process.cwd(), "scripts/pdfjs-compat-polyfills.mjs"), "utf8"));
    // Worker girişi: önce silme (simülasyon), sonra (yalnız legacy'de) polyfill, sonra gerçek worker.
    const entry = u.pathname.match(/^\/(modern|legacy)\/worker-entry\.mjs$/);
    if (entry) {
      return js(
        `import "/__compat-prelude.mjs";\n` +
          (entry[1] === "legacy" ? `import "./compat-polyfills.mjs";\n` : "") +
          `import "./pdf.worker.min.mjs";\n`
      );
    }
    const m = u.pathname.match(/^\/(modern|legacy)\/(pdf(?:\.worker)?\.min\.mjs)$/);
    if (m) return js(fs.readFileSync(path.join(ROOT, DIRS[m[1] as Kind], m[2]), "utf8"));
    return route.fulfill({ status: 404, body: "" });
  });
  await page.goto(`${ORIGIN}/`);
  return page.evaluate(RUN(kind)) as Promise<{ ok: boolean; dark: number; items: number; error: string | null }>;
}

test("S10b negatif kontrol: modern build silinmiş API'lerle çöker", async ({ page, context }) => {
  const r = await run(context, page, "modern");
  expect(r.ok, `modern build ÇİZMEMELİYDİ ama çizdi (düzenek yakalayıcı değil): ${JSON.stringify(r)}`).toBe(false);
  expect(r.error ?? "").toMatch(/not a function|not defined|undefined/i);
});

test("S10b pozitif kontrol: legacy + polyfill aynı koşulda çizer", async ({ page, context }) => {
  const r = await run(context, page, "legacy");
  expect(r.error, JSON.stringify(r)).toBeNull();
  expect(r.ok, JSON.stringify(r)).toBe(true);
});
