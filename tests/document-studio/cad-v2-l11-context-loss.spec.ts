import { expect, test, type Locator, type Page } from "@playwright/test";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { CAD_V2_COMPILER_REVISION } from "../../src/lib/cad-v2/version";
import { cleanupUploadedCadFixtures, signInAdmin, uploadRealCadBinaryFixture } from "./cad-test-helpers";
import { encodeWebGlRgbaBase64ToPng } from "./cad-v2-l11-raster-metrics";

const SOURCE_PATH = "eklediklerim/ornek_dosyalar/kiris_acilimlari_tum_katlar.dwg";
const SOURCE_SHA256 = "9a59ff9e5496e2a3c62b378f062e5f0f3cfa707b9bd4b5a0bf6749cd8bf52459";
type WebGlRasterEvidence = { pixelSha256: string; width: number; height: number; foregroundPixels: number; rgbaBase64?: string };

async function armRenderedCanvasRasterCapture(page: Page, includePixels = false): Promise<() => Promise<WebGlRasterEvidence>> {
  const capturePromise = page.evaluate(async (capturePixels): Promise<WebGlRasterEvidence> => {
    type PendingCapture = {
      canvas: HTMLCanvasElement;
      gl: WebGL2RenderingContext;
      resolve: (capture: WebGlRasterEvidence) => void;
      reject: (error: Error) => void;
      timer: number;
      includePixels: boolean;
    };
    const state = (window as unknown as { __l11ContextRaster?: { pending: PendingCapture | null } }).__l11ContextRaster;
    if (!state) throw new Error("L11 context raster instrumentation was not installed before page load.");
    if (state.pending) throw new Error("L11 already has a pending WebGL2 raster capture.");
    const canvas = document.querySelector<HTMLCanvasElement>("#document-studio-shell canvas");
    if (!canvas) throw new Error("L11 R002 viewer canvas is not connected.");
    const gl = canvas.getContext("webgl2");
    if (!gl) throw new Error("L11 R002 viewer canvas has no WebGL2 context.");

    return await new Promise<WebGlRasterEvidence>((resolve, reject) => {
      const request: PendingCapture = { canvas, gl, resolve, reject, timer: 0, includePixels: capturePixels };
      request.timer = window.setTimeout(() => {
        if (state.pending === request) state.pending = null;
        reject(new Error("No rendered R002 WebGL2 viewer frame reached the raster readback hook."));
      }, 15_000);
      state.pending = request;
    });
  }, includePixels);
  return async () => capturePromise;
}

test.afterEach(async ({ page }) => cleanupUploadedCadFixtures(page));

test("L11 gerçek WEBGL_lose_context kayıp ve kurtarma 20 kez çizimi eksiksiz korur", async ({ page }, testInfo) => {
  test.setTimeout(12 * 60_000);
  const sourcePath = path.resolve(process.cwd(), SOURCE_PATH);
  const sourceBytes = readFileSync(sourcePath);
  const sourceSha256 = createHash("sha256").update(sourceBytes).digest("hex");
  expect(sourceSha256, "context-loss kabulü gerçek R002 kaynağını kullanmalı").toBe(SOURCE_SHA256);

  await signInAdmin(page);
  await page.addInitScript(() => {
    type RasterEvidence = { pixelSha256: string; width: number; height: number; foregroundPixels: number; rgbaBase64?: string };
    type PendingCapture = {
      canvas: HTMLCanvasElement;
      gl: WebGL2RenderingContext;
      resolve: (capture: RasterEvidence) => void;
      reject: (error: Error) => void;
      timer: number;
      includePixels: boolean;
    };
    const state = { pending: null as PendingCapture | null };
    Object.defineProperty(window, "__l11ContextRaster", { value: state, configurable: false });
    let viewerDrawOccurredInRaf = false;
    const isViewerCanvas = (context: { canvas?: HTMLCanvasElement | OffscreenCanvas }) =>
      context.canvas instanceof HTMLCanvasElement && Boolean(context.canvas.closest("#document-studio-shell"));
    const nativeRequestAnimationFrame = window.requestAnimationFrame.bind(window);
    window.requestAnimationFrame = (callback: FrameRequestCallback) => nativeRequestAnimationFrame((timestamp) => {
      viewerDrawOccurredInRaf = false;
      callback.call(window, timestamp);
      const capture = state.pending;
      if (!capture || !viewerDrawOccurredInRaf || !capture.canvas.isConnected || capture.gl.isContextLost()) return;
      try {
        const width = capture.gl.drawingBufferWidth;
        const height = capture.gl.drawingBufferHeight;
        const pixels = new Uint8Array(width * height * 4);
        capture.gl.readPixels(0, 0, width, height, capture.gl.RGBA, capture.gl.UNSIGNED_BYTE, pixels);
        const readbackError = capture.gl.getError();
        if (readbackError !== capture.gl.NO_ERROR) {
          throw new Error(`R002 WebGL2 pixel readback failed with error ${readbackError}.`);
        }
        const cornerOffsets = [0, (width - 1) * 4, ((height - 1) * width) * 4, (height * width - 1) * 4];
        const backgrounds = cornerOffsets.map((offset) => [pixels[offset]!, pixels[offset + 1]!, pixels[offset + 2]!]);
        let foregroundPixels = 0;
        for (let offset = 0; offset < pixels.length; offset += 4) {
          const color = [pixels[offset]!, pixels[offset + 1]!, pixels[offset + 2]!];
          const differsFromEveryCorner = backgrounds.every((background) =>
            Math.max(Math.abs(color[0]! - background[0]!), Math.abs(color[1]! - background[1]!), Math.abs(color[2]! - background[2]!)) >= 16);
          if (pixels[offset + 3]! >= 250 && differsFromEveryCorner) foregroundPixels += 1;
        }
        let rgbaBase64: string | undefined;
        if (capture.includePixels) {
          let binary = "";
          const chunkSize = 0x8000;
          for (let offset = 0; offset < pixels.length; offset += chunkSize) {
            binary += String.fromCharCode(...pixels.subarray(offset, Math.min(offset + chunkSize, pixels.length)));
          }
          rgbaBase64 = btoa(binary);
        }
        const digestPromise = crypto.subtle.digest("SHA-256", pixels);
        state.pending = null;
        window.clearTimeout(capture.timer);
        void digestPromise.then((digest) => {
          const pixelSha256 = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
          capture.resolve({ pixelSha256, width, height, foregroundPixels, rgbaBase64 });
        }, (error: unknown) => capture.reject(error instanceof Error ? error : new Error(String(error))));
      } catch (error) {
        state.pending = null;
        window.clearTimeout(capture.timer);
        capture.reject(error instanceof Error ? error : new Error(String(error)));
      }
    });

    const constructors = [window.WebGLRenderingContext, window.WebGL2RenderingContext]
      .filter(Boolean) as Array<{ prototype: Record<string, unknown> }>;
    const drawMethods = ["drawArrays", "drawElements", "drawArraysInstanced", "drawElementsInstanced"];
    for (const constructor of constructors) {
      const prototype = constructor.prototype;
      const nativeGetExtension = prototype.getExtension as ((name: string) => unknown) | undefined;
      if (nativeGetExtension && Object.prototype.hasOwnProperty.call(prototype, "getExtension")) {
        prototype.getExtension = function (this: WebGLRenderingContext, name: string) {
          const extension = nativeGetExtension.call(this, name);
          if (name !== "WEBGL_multi_draw" || !extension || !isViewerCanvas(this)) return extension;
          const context = this;
          return new Proxy(extension as object, {
            get(target, property, receiver) {
              const value = Reflect.get(target, property, receiver) as unknown;
              if (typeof value !== "function" || typeof property !== "string" || !property.startsWith("multiDraw")) return value;
              return (...args: unknown[]) => {
                viewerDrawOccurredInRaf = true;
                return Reflect.apply(value, target, args);
              };
            },
          });
        };
      }
      for (const method of drawMethods) {
        if (!Object.prototype.hasOwnProperty.call(prototype, method)) continue;
        const nativeDraw = prototype[method] as ((...args: unknown[]) => unknown) | undefined;
        if (!nativeDraw) continue;
        prototype[method] = function (this: WebGLRenderingContext, ...args: unknown[]) {
          if (isViewerCanvas(this)) viewerDrawOccurredInRaf = true;
          return Reflect.apply(nativeDraw, this, args);
        };
      }
    }
  });
  const failedRequests: Array<{ method: string; url: string; status: number }> = [];
  const pageErrors: string[] = [];
  const sessionDeletes: Array<{ url: string; status: number }> = [];
  let prepareRequestCount = 0;
  let chunkResponseCount = 0;
  page.on("request", (request) => {
    if (request.method() === "POST" && request.url().includes("/api/dokumantasyon/cad-v2/prepare")) prepareRequestCount += 1;
  });
  page.on("response", (response) => {
    const url = response.url();
    if (requestChunkUrl(url)) chunkResponseCount += 1;
    if (url.includes("/api/dokumantasyon/cad-v2/view-sessions/") && response.request().method() === "DELETE") {
      sessionDeletes.push({ url, status: response.status() });
    }
    if (url.includes("/api/dokumantasyon/cad-v2/") && response.status() >= 400) {
      failedRequests.push({ method: response.request().method(), url, status: response.status() });
    }
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));

  const fileId = await uploadRealCadBinaryFixture(page, sourcePath, path.basename(sourcePath));
  await page.goto(`/dokumantasyon/dosya/${fileId}?cadEngine=v2`, { waitUntil: "domcontentloaded", timeout: 60_000 });
  const phase = page.locator("[data-v2-phase]");
  await expect(phase).toHaveAttribute("data-v2-phase", /^(ready|degraded)$/, { timeout: 600_000 });
  const initialPhase = await phase.getAttribute("data-v2-phase");
  if (initialPhase !== "ready" && initialPhase !== "degraded") {
    throw new Error(`R002 reached an unexpected terminal viewer phase: ${String(initialPhase)}`);
  }
  await expect.poll(() => phase.getAttribute("data-cad-v2-progress").then((progress) => {
    const value = progress ?? "";
    const downloaded = value.match(/İndirilen\s+(\d+)\/(\d+)/);
    const verified = value.match(/Doğrulanan\s+(\d+)\/(\d+)/);
    const visible = value.match(/Görünür\s+(\d+)\/(\d+)/);
    const drawn = value.match(/Çizilen\s+(\d+)\/(\d+)/);
    if (!downloaded || !verified || !visible || !drawn) return false;
    const visibleCount = Number(visible[1]);
    return visibleCount > 0 && Number(visible[2]) === visibleCount &&
      Number(downloaded[1]) >= visibleCount && Number(verified[1]) >= visibleCount && Number(drawn[1]) >= visibleCount;
  }), {
    timeout: 600_000,
    intervals: [500, 1_000, 2_000],
    message: "R002 must finish downloading, verifying, and drawing every visible chunk before context recovery is tested",
  }).toBe(true);
  const initialProgress = await phase.getAttribute("data-cad-v2-progress") ?? "";
  const downloadedCount = initialProgress.match(/İndirilen\s+(\d+)\/(\d+)/);
  const verifiedCount = initialProgress.match(/Doğrulanan\s+(\d+)\/(\d+)/);
  const visibleCount = initialProgress.match(/Görünür\s+(\d+)\/(\d+)/);
  const drawnCount = initialProgress.match(/Çizilen\s+(\d+)\/(\d+)/);
  for (const [name, match] of [["downloaded", downloadedCount], ["verified", verifiedCount], ["visible", visibleCount], ["drawn", drawnCount]] as const) {
    if (!match) throw new Error(`R002 terminal progress is missing the ${name} chunk count: ${initialProgress}`);
  }
  const visibleChunks = Number(visibleCount![1]);
  expect(visibleChunks, "R002 must have at least one visible chunk before testing context recovery").toBeGreaterThan(0);
  expect(Number(visibleCount![1]), "all visible R002 chunks must be accounted for").toBe(Number(visibleCount![2]));
  expect(Number(downloadedCount![1]), "every visible R002 chunk must be downloaded").toBeGreaterThanOrEqual(visibleChunks);
  expect(Number(verifiedCount![1]), "every visible R002 chunk must be verified").toBeGreaterThanOrEqual(visibleChunks);
  expect(Number(drawnCount![1]), "every visible R002 chunk must be drawn before context loss").toBeGreaterThanOrEqual(visibleChunks);
  if (initialPhase === "degraded") {
    await expect(
      page.getByRole("alert").filter({ hasText: /Büyük çizim nedeniyle bazı eğriler/ }),
      "a degraded scene must keep its user-visible quality warning",
    ).toBeVisible();
  }
  const canvas = page.locator("#document-studio-shell canvas").first();
  await expect(canvas).toBeVisible({ timeout: 60_000 });

  const context = await canvas.evaluate((element) => {
    const target = element as HTMLCanvasElement;
    const gl = target.getContext("webgl2") ?? target.getContext("webgl");
    if (!gl) throw new Error("R002 canvas has no live WebGL context.");
    const lossExtension = gl.getExtension("WEBGL_lose_context");
    if (!lossExtension) throw new Error("Active Chrome GPU context does not expose WEBGL_lose_context.");
    const events: string[] = [];
    target.addEventListener("webglcontextlost", () => events.push("lost"));
    target.addEventListener("webglcontextrestored", () => events.push("restored"));
    (window as Window & { __l11ContextLoss?: unknown }).__l11ContextLoss = { gl, lossExtension, events };
    return {
      version: gl.getParameter(gl.VERSION) as string,
      renderer: gl.getParameter(gl.RENDERER) as string,
      extension: true,
      initiallyLost: gl.isContextLost(),
    };
  });
  expect(context.extension).toBe(true);
  expect(context.initiallyLost).toBe(false);
  await page.getByRole("button", { name: /Çizimi Sığdır/ }).click();
  await page.waitForTimeout(900);
  const initialCapture = await armRenderedCanvasRasterCapture(page, true);
  await page.getByRole("button", { name: /Çizimi Sığdır/ }).click();
  const initialRaster = await initialCapture();
  expect(initialRaster.foregroundPixels, "R002 canvas must contain rasterized drawing before context loss").toBeGreaterThan(0);
  if (!initialRaster.rgbaBase64) throw new Error("Initial R002 WebGL raster bytes were not retained for parity diagnosis.");
  await testInfo.attach("l11-r002-context-initial-webgl-raster.png", {
    body: encodeWebGlRgbaBase64ToPng(initialRaster.rgbaBase64, initialRaster.width, initialRaster.height),
    contentType: "image/png",
  });
  const restoredRasters: WebGlRasterEvidence[] = [];

  for (let cycle = 1; cycle <= 20; cycle += 1) {
    await canvas.evaluate(() => {
      const state = (window as Window & { __l11ContextLoss?: { lossExtension: { loseContext(): void } } }).__l11ContextLoss;
      if (!state) throw new Error("WEBGL_lose_context state was not retained.");
      state.lossExtension.loseContext();
    });
    await expect.poll(() => canvas.evaluate(() => {
      const state = (window as Window & { __l11ContextLoss?: { gl: WebGLRenderingContext; events: string[] } }).__l11ContextLoss;
      return state?.events.filter((event) => event === "lost").length ?? 0;
    }), { timeout: 10_000, message: `real WebGL context lost event ${cycle}/20` }).toBe(cycle);
    await expect(phase, `host enters context-lost state on cycle ${cycle}`).toHaveAttribute("data-v2-phase", "context-lost", { timeout: 10_000 });
    expect(await canvas.evaluate(() => {
      const state = (window as Window & { __l11ContextLoss?: { gl: WebGLRenderingContext } }).__l11ContextLoss;
      return state?.gl.isContextLost() ?? false;
    }), `GPU context is actually lost on cycle ${cycle}`).toBe(true);

    const restoredCapture = await armRenderedCanvasRasterCapture(page, cycle === 1);
    await canvas.evaluate(() => {
      const state = (window as Window & { __l11ContextLoss?: { lossExtension: { restoreContext(): void } } }).__l11ContextLoss;
      if (!state) throw new Error("WEBGL_lose_context state was not retained.");
      state.lossExtension.restoreContext();
    });
    await expect.poll(() => canvas.evaluate(() => {
      const state = (window as Window & { __l11ContextLoss?: { gl: WebGLRenderingContext; events: string[] } }).__l11ContextLoss;
      return state?.events.filter((event) => event === "restored").length ?? 0;
    }), { timeout: 20_000, message: `real WebGL context restored event ${cycle}/20` }).toBe(cycle);
    await expect(phase, `host returns to its original ${initialPhase} phase after context restoration ${cycle}/20`).toHaveAttribute("data-v2-phase", initialPhase, { timeout: 30_000 });
    expect(await canvas.evaluate(() => {
      const state = (window as Window & { __l11ContextLoss?: { gl: WebGLRenderingContext } }).__l11ContextLoss;
      return state ? state.gl.isContextLost() : true;
    }), `GPU context is live after restoration ${cycle}/20`).toBe(false);
    const restoredRaster = await restoredCapture();
    expect(restoredRaster.foregroundPixels, `R002 drawing pixels survive context restoration ${cycle}/20`).toBeGreaterThan(0);
    if (cycle === 1) {
      if (!restoredRaster.rgbaBase64) throw new Error("First restored R002 WebGL raster bytes were not retained for parity diagnosis.");
      await testInfo.attach("l11-r002-context-restored-webgl-raster.png", {
        body: encodeWebGlRgbaBase64ToPng(restoredRaster.rgbaBase64, restoredRaster.width, restoredRaster.height),
        contentType: "image/png",
      });
    }
    expect(restoredRaster.pixelSha256, `R002 canvas pixels are unchanged after context restoration ${cycle}/20`).toBe(initialRaster.pixelSha256);
    restoredRasters.push(restoredRaster);
  }

  expect(prepareRequestCount, "context recovery reuses the current scene session without recompiling the source").toBe(1);
  expect(chunkResponseCount, "R002 chunks were fetched from the isolated local scene during the run").toBeGreaterThan(0);
  expect(failedRequests, "context recovery must not leave failed CAD API requests").toEqual([]);
  expect(pageErrors, "context recovery must not create uncaught page exceptions").toEqual([]);

  await page.locator('button[title="Geri Dön"]').click();
  await expect.poll(() => new URL(page.url()).pathname, { timeout: 15_000, message: "R002 host unmounts through the real Document Studio back navigation" })
    .toBe("/dokumantasyon");
  await expect.poll(() => sessionDeletes.length, { timeout: 10_000, message: "view session DELETE after R002 host unmount" }).toBeGreaterThan(0);
  expect(sessionDeletes.every((entry) => entry.status >= 200 && entry.status < 300), "session teardown is accepted by the isolated local API").toBe(true);

  await testInfo.attach("l11-r002-webgl-context-loss-evidence.json", {
    body: JSON.stringify({
      source: { path: SOURCE_PATH, bytes: sourceBytes.byteLength, sha256: sourceSha256 },
      compilerRevision: CAD_V2_COMPILER_REVISION,
      buildId: readFileSync(path.resolve(process.cwd(), process.env.NEXT_DIST_DIR ?? ".next", "BUILD_ID"), "utf8").trim(),
      gpuContext: context,
      viewerPhase: initialPhase,
      viewerProgress: initialProgress,
      cycles: 20,
      lostEvents: 20,
      restoredEvents: 20,
      prepareRequestCount,
      chunkResponseCount,
      sessionDeletes,
      initialRaster: { ...initialRaster, rgbaBase64: undefined },
      restoredRasters: restoredRasters.map((raster) => ({ ...raster, rgbaBase64: undefined })),
      failedRequests,
      pageErrors,
    }, null, 2),
    contentType: "application/json",
  });
});

function requestChunkUrl(url: string): boolean {
  return /\/api\/dokumantasyon\/cad-v2\/scenes\/[^/]+\/chunks\/[^/]+(?:\?|$)/.test(url);
}
