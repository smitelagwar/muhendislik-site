import type { Page } from "@playwright/test";

/**
 * Tarayıcı içinde her karede çalışan örnekleyici. `addInitScript` ile sayfaya
 * enjekte edilir, `samplerStart/Stop` ile açılıp kapanır.
 *
 * KARE "BOŞ" SAYILIR eğer görünür (>40px) bir sayfanın data-page-state değeri
 * "empty" | "rendering" ise. "rendered" ve "backdrop" boş değildir.
 * (v3 motoru "rendering"/"rendered" yayar; v4 motoru "empty"/"backdrop"/"rendered".)
 */
export const SAMPLER_INIT = String.raw`
(() => {
  if (window.__pdfSampler) return;
  const S = (window.__pdfSampler = {
    active: false, t0: 0, last: 0, frames: 0, blankFrames: 0,
    blankPages: {}, gaps: [], longTasks: [], states: [],
  });
  const SCROLL = '[data-testid="pdf-scroll-viewport"]';
  const isBlank = (s) => s === 'empty' || s === 'rendering' || s == null;
  function loop(t) {
    if (S.active) {
      const root = document.querySelector('[data-pdf-viewer-state]');
      const vs = root ? root.getAttribute('data-pdf-viewer-state') : null;
      if (!S.states.length || S.states[S.states.length - 1].s !== vs) S.states.push({ t: Math.round(t - S.t0), s: vs });
      if (S.last && S.gaps.length < 60000) S.gaps.push(t - S.last);
      const sc = document.querySelector(SCROLL);
      if (sc) {
        S.frames++;
        const vr = sc.getBoundingClientRect();
        let blank = false;
        for (const p of sc.querySelectorAll('[data-page]')) {
          const r = p.getBoundingClientRect();
          const vis = Math.min(r.bottom, vr.bottom) - Math.max(r.top, vr.top);
          if (vis > 40 && r.width > 0 && isBlank(p.getAttribute('data-page-state'))) {
            blank = true;
            const k = p.getAttribute('data-page');
            S.blankPages[k] = (S.blankPages[k] || 0) + 1;
          }
        }
        if (blank) S.blankFrames++;
      }
      S.last = t;
    } else {
      S.last = 0;
    }
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
  try {
    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) if (S.active) S.longTasks.push(e.duration);
    }).observe({ entryTypes: ['longtask'] });
  } catch (_) {}
})();
`;

export interface SamplerResult {
  frames: number;
  blankFrames: number;
  blankPages: Record<string, number>;
  gapP50Ms: number;
  gapP95Ms: number;
  gapMaxMs: number;
  jank50: number; // 50 ms'den uzun kare aralığı sayısı
  longTaskCount: number;
  longTaskMs: number; // en uzun görev
  viewerStates: { t: number; s: string | null }[];
  /** İlk "idle"den sonra "loading"e dönüş sayısı = belgenin yeniden yüklenmesi */
  reloads: number;
}

export async function samplerStart(page: Page): Promise<void> {
  await page.evaluate(() => {
    const S = (window as any).__pdfSampler;
    if (!S) throw new Error("Sampler enjekte edilmemiş: testte `test` fixture'ını helpers/test.ts'den import et.");
    Object.assign(S, { active: true, t0: performance.now(), last: 0, frames: 0, blankFrames: 0, blankPages: {}, gaps: [], longTasks: [], states: [] });
  });
}

export async function samplerStop(page: Page): Promise<SamplerResult> {
  const raw = await page.evaluate(() => {
    const S = (window as any).__pdfSampler;
    S.active = false;
    return { frames: S.frames, blankFrames: S.blankFrames, blankPages: S.blankPages, gaps: S.gaps as number[], longTasks: S.longTasks as number[], states: S.states as { t: number; s: string | null }[] };
  });
  const sorted = [...raw.gaps].sort((a, b) => a - b);
  const q = (p: number) => (sorted.length ? sorted[Math.min(sorted.length - 1, Math.floor(p * sorted.length))] : 0);
  let seenIdle = false;
  let reloads = 0;
  for (const st of raw.states) {
    if (st.s === "idle" || st.s === "rendering") seenIdle = true;
    else if (st.s === "loading" && seenIdle) { reloads++; seenIdle = false; }
  }
  return {
    frames: raw.frames,
    blankFrames: raw.blankFrames,
    blankPages: raw.blankPages,
    gapP50Ms: round1(q(0.5)),
    gapP95Ms: round1(q(0.95)),
    gapMaxMs: round1(sorted.length ? sorted[sorted.length - 1] : 0),
    jank50: raw.gaps.filter((g) => g > 50).length,
    longTaskCount: raw.longTasks.length,
    longTaskMs: round1(Math.max(0, ...raw.longTasks)),
    viewerStates: raw.states,
    reloads,
  };
}

const round1 = (n: number) => Math.round(n * 10) / 10;
