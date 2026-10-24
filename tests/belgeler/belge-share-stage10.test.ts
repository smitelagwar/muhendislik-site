import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getShareViewerLayout, formatShareViewerExpiry, SHARE_VIEWER_MAX_PIXELS } from "../../src/lib/belge-paylasim/viewer-geometry";
import { ShareViewerSession, ShareViewerLoadError, type ShareViewerDependencies } from "../../src/lib/belge-paylasim/viewer-session";
import type { BrowserPdfJs } from "../../src/lib/pdfjs-client";

const tick = () => new Promise((resolve) => setTimeout(resolve, 1));
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}
function fixture() {
  const stats = { active: 0, maximum: 0, renders: 0, tasks: 0, cleanup: 0, destroyed: 0, workerDestroyed: 0 };
  let failRender = false;
  let pageGate: Promise<unknown> | null = null;
  const document = {
    numPages: 2,
    async cleanup() { assert.equal(stats.active, 0); stats.cleanup += 1; },
    async getPage(number: number) {
      if (pageGate) { const gate = pageGate; pageGate = null; await gate; }
      return {
        getViewport: ({ scale }: { scale: number }) => ({ width: (number === 1 ? 400 : 800) * scale, height: (number === 1 ? 600 : 400) * scale }),
        cleanup() { assert.equal(stats.active, 0); },
        render() {
          stats.renders += 1;
          stats.active += 1;
          stats.maximum = Math.max(stats.maximum, stats.active);
          let cancelled = false;
          return {
            cancel() { cancelled = true; },
            promise: new Promise<void>((resolve, reject) => setTimeout(() => {
              stats.active -= 1;
              if (cancelled) reject(Object.assign(new Error("cancelled"), { name: "RenderingCancelledException" }));
              else if (failRender) { failRender = false; reject(new Error("injected render failure")); }
              else resolve();
            }, 5)),
          };
        },
      };
    },
  };
  const worker = { destroy() { stats.workerDestroyed += 1; } };
  const dependencies: ShareViewerDependencies = {
    fetch: async () => new Response(new Uint8Array([1])),
    loadPdfJs: async () => ({
      getDocument() {
        stats.tasks += 1;
        return { promise: Promise.resolve(document), async destroy() { stats.tasks -= 1; stats.destroyed += 1; } };
      },
    }) as unknown as BrowserPdfJs,
    getWorker: async () => worker,
  };
  const canvas = { width: 0, height: 0, style: { width: "", height: "" }, getContext: () => ({}) } as unknown as HTMLCanvasElement;
  return { stats, dependencies, canvas, document, failNextRender: () => { failRender = true; }, gateNextPage: (gate: Promise<unknown>) => { pageGate = gate; } };
}

describe("ASAMA_10: gerçek sayfa geometrisi ve sahipli PDF oturumu", () => {
  it("320/390/768/1366 ve DPR1/2/3'te portrait/landscape fit doğru kalır", () => {
    for (const width of [320, 390, 768, 1366]) for (const dpr of [1, 2, 3]) {
      for (const page of [{ width: 400, height: 600 }, { width: 800, height: 400 }]) {
        const full = getShareViewerLayout(page, { width, height: 560 }, "page", 1, dpr);
        assert.ok(full.width <= width - 32 + 0.001);
        assert.ok(full.height <= 528 + 0.001);
        assert.ok(full.pixels <= SHARE_VIEWER_MAX_PIXELS);
        const fitted = getShareViewerLayout(page, { width, height: 560 }, "width", 1, dpr);
        assert.ok(Math.abs(fitted.width - (width - 32)) < 0.001);
        assert.equal(fitted.width / page.width, fitted.scale);
      }
    }
  });
  it("yüksek zoom'da CSS boyutunu korur; backing 8M piksel/32MB sınırını aşmaz", () => {
    const layout = getShareViewerLayout({ width: 2000, height: 3000 }, { width: 390, height: 700 }, "manual", 4, 3);
    assert.equal(layout.width, 8000);
    assert.equal(layout.height, 12000);
    assert.ok(layout.pixels * 4 <= 32_000_000);
    assert.ok(layout.backingHeight <= 8192);
  });
  it("fit manuel minimumun altına inebilir; geçersiz geometri reddedilir", () => {
    assert.ok(getShareViewerLayout({ width: 10_000, height: 10_000 }, { width: 320, height: 200 }, "page", 1, 2).scale < 0.05);
    assert.throws(() => getShareViewerLayout({ width: 0, height: 1 }, { width: 320, height: 200 }, "width", 1, 1));
  });
  it("gerçek expiry tarihini İstanbul saatinde gösterir; eksik/bozuk tarihi uydurmaz", () => {
    assert.match(formatShareViewerExpiry("2026-10-30T12:00:00Z") ?? "", /30 Ekim 2026.*15:00/);
    assert.equal(formatShareViewerExpiry(), null);
    assert.equal(formatShareViewerExpiry("invalid"), null);
  });
  it("20 hızlı zoom/sayfa isteğinde iptal promise'i settle olmadan aynı canvas'a render başlatmaz", async () => {
    const f = fixture();
    const session = new ShareViewerSession(f.dependencies);
    await session.open("http://local/test");
    const renders = [session.render(f.canvas, 1, { width: 390, height: 500 }, "width", 1, 3)];
    await tick();
    for (let i = 0; i < 20; i += 1) renders.push(session.render(f.canvas, i % 2 + 1, { width: 390, height: 500 }, "manual", 1 + i / 10, 3));
    const result = await Promise.all(renders);
    assert.ok(result.at(-1));
    assert.equal(f.stats.maximum, 1);
    assert.equal(f.stats.active, 0);
    await session.dispose();
    assert.equal(f.canvas.width, 0);
    assert.equal(f.stats.tasks, 0);
    assert.equal(f.stats.workerDestroyed, 0);
  });
  it("async getPage sonrası eski generation çizmez", async () => {
    const f = fixture();
    const gate = deferred<void>();
    f.gateNextPage(gate.promise);
    const session = new ShareViewerSession(f.dependencies);
    await session.open("http://local/test");
    const stale = session.render(f.canvas, 1, { width: 390, height: 500 }, "width", 1, 1);
    await tick();
    const current = session.render(f.canvas, 2, { width: 390, height: 500 }, "width", 1, 1);
    gate.resolve();
    assert.equal(await stale, null);
    assert.equal((await current)?.height, 179);
    assert.equal(f.stats.renders, 1);
    await session.dispose();
  });
  it("unmount fetch'i abort eder ve PDF task başlatmaz", async () => {
    const f = fixture();
    let aborted = false;
    f.dependencies.fetch = async (_url, init) => new Promise((_resolve, reject) => {
      init?.signal?.addEventListener("abort", () => { aborted = true; reject(new DOMException("aborted", "AbortError")); });
    });
    const session = new ShareViewerSession(f.dependencies);
    const opening = session.open("http://local/slow");
    const rejection = assert.rejects(opening, { name: "AbortError" });
    await session.dispose();
    await rejection;
    assert.equal(aborted, true);
    assert.equal(f.stats.tasks, 0);
  });
  it("pending loadingTask destroy edilir; geç yükleme sonucu oturuma geri yazılmaz", async () => {
    const f = fixture();
    const gate = deferred<unknown>();
    let destroyed = 0;
    f.dependencies.loadPdfJs = async () => ({ getDocument() { return { promise: gate.promise, async destroy() { destroyed += 1; gate.reject(new Error("loading aborted")); } }; } }) as unknown as BrowserPdfJs;
    const session = new ShareViewerSession(f.dependencies);
    const opening = session.open("http://local/slow");
    const rejection = assert.rejects(opening);
    await tick();
    await session.dispose();
    await rejection;
    assert.equal(destroyed, 1);
    await session.dispose();
    assert.equal(destroyed, 1);
  });
  it("render hatası görünür retry için dışarı çıkar; aynı document ile retry başarılı olur", async () => {
    const f = fixture();
    const session = new ShareViewerSession(f.dependencies);
    await session.open("http://local/test");
    f.failNextRender();
    await assert.rejects(session.render(f.canvas, 1, { width: 390, height: 500 }, "width", 1, 1));
    assert.ok(await session.render(f.canvas, 1, { width: 390, height: 500 }, "width", 1, 1));
    await session.dispose();
    assert.equal(f.stats.cleanup, 1);
  });
  it("30 mount/unmount sonrası task/render kalmaz ve paylaşılan worker kapanmaz", async () => {
    const f = fixture();
    for (let i = 0; i < 30; i += 1) {
      const session = new ShareViewerSession(f.dependencies);
      await session.open("http://local/test");
      await session.render(f.canvas, 1, { width: 390, height: 500 }, "width", 1, 2);
      await session.dispose();
      assert.equal(f.stats.tasks, 0);
      assert.equal(f.stats.active, 0);
    }
    assert.equal(f.stats.destroyed, 30);
    assert.equal(f.stats.workerDestroyed, 0);
  });
  it("HTTP hata sınıflaması yapılandırılmış kod kullanır ve raw URL/secret göstermez", async () => {
    for (const [status, code, expected] of [[410, "LINK_REVOKED", "revoked"], [410, "LINK_EXPIRED", "expired"], [404, "", "not_found"], [503, "", "error"]] as const) {
      const f = fixture();
      f.dependencies.fetch = async () => new Response(JSON.stringify({ code, message: "private-secret" }), { status });
      const session = new ShareViewerSession(f.dependencies);
      await assert.rejects(session.open("http://local/test"), (error: unknown) => error instanceof ShareViewerLoadError && error.status === expected && !error.message.includes("private-secret"));
      await session.dispose();
    }
  });
});
