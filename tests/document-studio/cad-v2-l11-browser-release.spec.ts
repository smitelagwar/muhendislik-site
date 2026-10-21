import { expect, test, type Locator, type Page, type Request } from "@playwright/test";
import { createHash } from "node:crypto";
import { appendFileSync, existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { performance } from "node:perf_hooks";
import path from "node:path";
import { CAD_V2_COMPILER_REVISION } from "../../src/lib/cad-v2/version";
import { CAD_V2_OVERVIEW_MAX_ZOOM_FACTOR } from "../../src/lib/cad-v2/worker/overview-linework-compaction";
import { acceptsL11ProductionRelease } from "./l11-release-acceptance";
import { encodeWebGlRgbaBase64ToPng, measureRaster, readRasterPixel } from "./cad-v2-l11-raster-metrics";
import { cleanupUploadedCadFixtures, signInAdmin, uploadRealCadBinaryFixture } from "./cad-test-helpers";

const sourceCorpus = {
  R002: { path: "eklediklerim/ornek_dosyalar/kiris_acilimlari_tum_katlar.dwg", sha256: "9a59ff9e5496e2a3c62b378f062e5f0f3cfa707b9bd4b5a0bf6749cd8bf52459" },
  R003: { path: "eklediklerim/ornek_dosyalar/MUSTAFA SELVİ 1.KISIM STATİK.dwg", sha256: "8ff5680fa4f9d570fed738def92bc6ca8149fde1b5aed9e0a495dd2baaf521e6" },
  R004: { path: "eklediklerim/ornek_dosyalar/SÜHEYLA KARA STATİK (HAFİF).dxf", sha256: "36f87f826fe4dd9a8f03f8c83bafeeddfc84f1e0efada5c0fded8014a2ef7cf1" },
} as const;

type ReleaseSourceId = keyof typeof sourceCorpus;

type ResourceEvent = {
  type: "chunk-load-start" | "chunk-load-outcome" | "chunk-evicted" | "viewport-snapshot";
  chunkId?: string;
  loadId?: number;
  reason?: string;
  status?: "accepted" | "rejected" | "stale-visibility";
  rejectionResources?: string[];
  cpuResidentBytes?: number;
  cpuBudgetBytes?: number;
  candidateCpuBytes?: number;
  rendererCpuResidentBytes?: number;
  retainedRefinementSourceBytes?: number;
  additionalRetainedRendererCpuBytes?: number;
  gpuBufferBytesEstimate?: number;
  gpuBudgetBytes?: number;
  candidateGpuBufferBytes?: number;
  geometryCpuBytesAdded?: number;
  incomingUnpackedCpuBytes?: number;
  sharedRendererSourceBytes?: number;
  retainedRefinementSourceBytesIfAccepted?: number;
  chunkVertexCount?: number;
  overviewLod?: {
    unitsPerCssPixel: number;
    collapsedSegmentCount: number;
    retainedSegmentCount: number;
    representativePointCount: number;
    maxCenterlineDeviationCssPixels: number;
  };
  releasedUnusedPathDistanceBytes?: number;
  positionCodecErrorWorld?: number;
  positionCodecErrorCssPixels?: number;
  visibleSetRevision?: number;
  recordedAtMs?: number;
};

type BrowserRun = {
  label: "cold" | "warm";
  chunkIds: string[];
  pendingChunkResponses: number;
  chunkFetchDurationsMs: number[];
  chunkResponseBytes: number[];
  hostPipelineDurationsMs: number[];
  prepareDurationsMs: number[];
  prepareResponseStatus?: number;
  prepareJobStatus?: string;
  sceneId?: string;
  apiCallDiagnostics: Array<{
    kind: "prepare" | "heartbeat" | "session-delete";
    elapsedMs: number | null;
    method: string;
    fileId?: string;
    clientRequestId?: string;
    expectedSourceVersionKey?: string;
    responseStatus?: number | null;
    responseState?: string | null;
    responseCode?: string | null;
    hasSceneId?: boolean;
    hasJobId?: boolean;
    hasViewSessionId?: boolean;
  }>;
  hostLifecycleMessages: string[];
  failedChunkRequestCount: number;
  firstNonemptyRasterMs?: number;
  firstNonemptyRaster?: ReturnType<typeof measureRaster>;
  firstSubstantiveRasterMs?: number;
  firstSubstantiveRaster?: ReturnType<typeof measureRaster>;
  firstUsefulRasterMs?: number;
  firstUsefulRaster?: ReturnType<typeof measureRaster>;
  firstUsefulCanvasSha256?: string;
  rasterSamples?: Array<{ elapsedMs: number; raster: ReturnType<typeof measureRaster>; sha256: string }>;
  firstWebglDrawMs?: number;
};

type PageMetrics = {
  frameIntervalsMs: number[];
  frameCallbackDurationsMs: number[];
  inputToDrawMs: number[];
  longTasksMs: number[];
  hostEvents: ResourceEvent[];
};

type BrowserPairState = {
  activeRun: BrowserRun | null;
  requestByObject: WeakMap<object, { run: BrowserRun; kind: "chunk" | "prepare"; startedAt: number }>;
  diagnosticByRequest: WeakMap<object, BrowserRun["apiCallDiagnostics"][number]>;
  runStartedAtMs: number | null;
  rendererIssues: string[];
  browserErrors: string[];
  sceneId: string | null;
};

type WebGlRasterCapture = {
  width: number;
  height: number;
  base64: string;
};

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      timeout = setTimeout(() => reject(new Error(`${label} did not finish within ${timeoutMs} ms.`)), timeoutMs);
    }),
  ]).finally(() => { if (timeout) clearTimeout(timeout); });
}

function percentile(values: number[], quantile: number): number | null {
  const sorted = values.filter(Number.isFinite).sort((left, right) => left - right);
  return sorted.length === 0 ? null : sorted[Math.min(sorted.length - 1, Math.ceil(quantile * sorted.length) - 1)]!;
}

function positiveIntegerFromEnv(name: string, fallback: number): number {
  const value = Number(process.env[name] ?? fallback);
  if (!Number.isSafeInteger(value) || value < 1) throw new Error(`${name} must be a positive integer in milliseconds.`);
  return value;
}

function sha256(value: Buffer | string): string {
  return createHash("sha256").update(value).digest("hex");
}

async function armCanvasWebGlReadback(page: Page, canvas: Locator): Promise<() => Promise<Buffer>> {
  const targetIsCanvas = await withTimeout(
    canvas.evaluate((target) => target instanceof HTMLCanvasElement),
    20_000,
    "L11 canvas locator evaluation",
  );
  if (!targetIsCanvas) throw new Error("L11 raster capture target is not an HTML canvas.");

  const capturePromise = withTimeout(page.evaluate(async (): Promise<WebGlRasterCapture> => {
    type PendingCapture = {
      canvas: HTMLCanvasElement;
      gl: WebGL2RenderingContext;
      resolve: (capture: WebGlRasterCapture) => void;
      reject: (error: Error) => void;
      timer: number;
    };
    const state = (window as unknown as {
      __cadL11?: { pendingRasterCapture?: PendingCapture | null };
    }).__cadL11;
    if (!state) throw new Error("L11 browser metrics were not installed before canvas capture.");
    if (state.pendingRasterCapture) throw new Error("L11 already has a pending WebGL raster readback.");
    const target = document.querySelector<HTMLCanvasElement>("#document-studio-shell canvas");
    if (!target) throw new Error("L11 viewer canvas disappeared before raster readback.");
    const gl = target.getContext("webgl2");
    if (!gl) throw new Error("L11 viewer canvas has no WebGL2 context for raster readback.");

    return await new Promise<WebGlRasterCapture>((resolve, reject) => {
      const request: PendingCapture = {
        canvas: target,
        gl,
        resolve,
        reject,
        timer: 0,
      };
      request.timer = window.setTimeout(() => {
        if (state.pendingRasterCapture === request) state.pendingRasterCapture = null;
        reject(new Error("No subsequent rendered viewer frame reached the WebGL raster readback hook."));
      }, 15_000);
      state.pendingRasterCapture = request;
    });
  }), 20_000, "L11 WebGL canvas readback");
  return async () => {
    const capture = await capturePromise;
    return encodeWebGlRgbaBase64ToPng(capture.base64, capture.width, capture.height);
  };
}

async function captureCanvasWithoutUiOverlays(page: Page, canvas: Locator): Promise<Buffer> {
  const readback = await armCanvasWebGlReadback(page, canvas);
  return readback();
}
async function assertCanvasCaptureExcludesUiOverlay(page: Page, canvas: Locator): Promise<Buffer> {
  const siblingMarker = "rgb(3, 252, 7)";
  const portalMarker = "rgb(252, 3, 244)";
  await page.evaluate((color) => {
    const overlay = document.createElement("div");
    overlay.dataset.cadL11CaptureProbe = "sibling";
    Object.assign(overlay.style, {
      position: "fixed",
      inset: "0",
      zIndex: "2147483647",
      background: color,
      pointerEvents: "none",
    });
    document.body.appendChild(overlay);
    const portal = document.createElement("nextjs-portal");
    portal.dataset.cadL11CaptureProbe = "portal";
    Object.assign((portal as HTMLElement).style, {
      position: "fixed",
      inset: "0",
      zIndex: "2147483648",
      background: "rgb(252, 3, 244)",
      pointerEvents: "none",
    });
    document.body.appendChild(portal);
  }, siblingMarker);
  try {
    const screenshot = await captureCanvasWithoutUiOverlays(page, canvas);
    const pixel = await page.evaluate(() => {
      const target = document.querySelector<HTMLCanvasElement>("#document-studio-shell canvas");
      if (!target) throw new Error("L11 canvas capture probe lost its canvas.");
      const rect = target.getBoundingClientRect();
      return {
        x: Math.floor(rect.width / 2 / Math.max(1, rect.width) * target.width),
        y: Math.floor(rect.height / 2 / Math.max(1, rect.height) * target.height),
      };
    });
    const capturedPixel = readRasterPixel(screenshot, pixel.x, pixel.y);
    expect(capturedPixel, "canvas-only capture must omit a synthetic sibling UI layer").not.toEqual([3, 252, 7, 255]);
    expect(capturedPixel, "canvas-only capture must omit a synthetic Next portal layer").not.toEqual([252, 3, 244, 255]);
    expect(measureRaster(screenshot).width).toBeGreaterThan(0);
    return screenshot;
  } finally {
    await page.locator('[data-cad-l11-capture-probe]').evaluateAll((elements) => elements.forEach((element) => element.remove()));
  }
}

async function installMetrics(page: Page) {
  await page.addInitScript(() => {
    const state = {
      measureDrawFrames: false,
      measureInteractionDraws: false,
      firstViewerDrawEpochMs: null as number | null,
      previousDrawFrameAt: null as number | null,
      drawOccurredDuringMeasuredRaf: false,
      frameIntervalsMs: [] as number[],
      frameCallbackDurationsMs: [] as number[],
      drawCalls: 0,
      drawCallsByMethod: {} as Record<string, number>,
      multiDrawCalls: 0,
      multiDrawExtensionQueries: 0,
      viewerMultiDrawExtensionQueries: 0,
      viewerMultiDrawExtensionQueriesByContext: {} as Record<string, number>,
      viewerMultiDrawExtensionAvailable: 0,
      viewerMultiDrawExtensionMissing: 0,
      multiDrawSupportedExtensionListQueries: 0,
      viewerMultiDrawSupportedExtensionListQueries: 0,
      viewerMultiDrawSupportedExtensionListQueriesByContext: {} as Record<string, number>,
      viewerMultiDrawExtensionAdvertised: 0,
      viewerMultiDrawExtensionKeys: [] as string[][],
      multiDrawPropertyReads: [] as string[],
      multiDrawMethodNames: [] as string[],
      patchedDrawMethods: [] as string[],
      inputMarkers: [] as Array<{ at: number; drawCount: number; kind: string; drawnAt?: number }>,
      inputToDrawMs: [] as number[],
      inputKinds: [] as string[],
      longTasksMs: [] as number[],
      batchDiagnostics: [] as Array<Record<string, unknown>>,
      painterPageDiagnostics: [] as Array<Record<string, unknown>>,
      painterPromotionDiagnostics: [] as Array<Record<string, unknown>>,
      pendingRasterCapture: null as null | {
        canvas: HTMLCanvasElement;
        gl: WebGL2RenderingContext;
        resolve: (capture: WebGlRasterCapture) => void;
        reject: (error: Error) => void;
        timer: number;
      },
      rendererSortModes: [] as Array<{
        sortObjects: boolean;
        depthBufferAvailable: boolean;
        loadedChunkCount: number;
        nonPainterDepthChunkCount: number;
        hasAuxiliaryObjects: boolean;
      }>,
      hostEvents: [] as ResourceEvent[],
    };
    Object.defineProperty(window, "__cadL11", { value: state, configurable: true });
    Object.defineProperty(window, "__cadV2ResourceDiagnostics", {
      value: (event: ResourceEvent) => state.hostEvents.push({ ...event, recordedAtMs: window.performance.now() }), configurable: true,
    });
    Object.defineProperty(window, "__cadV2BatchDiagnostics", {
      value: (event: Record<string, unknown>) => state.batchDiagnostics.push(event), configurable: true,
    });
    Object.defineProperty(window, "__cadV2PainterPageDiagnostics", {
      value: (event: Record<string, unknown>) => state.painterPageDiagnostics.push(event), configurable: true,
    });
    Object.defineProperty(window, "__cadV2PainterPromotionDiagnostics", {
      value: (event: Record<string, unknown>) => state.painterPromotionDiagnostics.push(event), configurable: true,
    });
    Object.defineProperty(window, "__cadV2RendererSortDiagnostics", {
      value: (event: {
        sortObjects: boolean;
        depthBufferAvailable: boolean;
        loadedChunkCount: number;
        nonPainterDepthChunkCount: number;
        hasAuxiliaryObjects: boolean;
      }) => state.rendererSortModes.push({ ...event }), configurable: true,
    });
    let viewerDrawOccurredInRaf = false;
    const nativeRequestAnimationFrame = window.requestAnimationFrame.bind(window);
    window.requestAnimationFrame = (callback: FrameRequestCallback) => nativeRequestAnimationFrame((timestamp) => {
      viewerDrawOccurredInRaf = false;
      const measuring = state.measureDrawFrames;
      const callbackStartedAt = measuring ? window.performance.now() : null;
      if (measuring) state.drawOccurredDuringMeasuredRaf = false;
      callback.call(window, timestamp);
      const capture = state.pendingRasterCapture;
      if (capture && viewerDrawOccurredInRaf && capture.canvas.isConnected && !capture.gl.isContextLost()) {
        try {
          const { width, height } = capture.canvas;
          const pixels = new Uint8Array(width * height * 4);
          capture.gl.readPixels(0, 0, width, height, capture.gl.RGBA, capture.gl.UNSIGNED_BYTE, pixels);
          const binaryChunks: string[] = [];
          for (let offset = 0; offset < pixels.length; offset += 0x8000) {
            binaryChunks.push(String.fromCharCode(...pixels.subarray(offset, offset + 0x8000)));
          }
          state.pendingRasterCapture = null;
          window.clearTimeout(capture.timer);
          capture.resolve({ width, height, base64: window.btoa(binaryChunks.join("")) });
        } catch (error) {
          state.pendingRasterCapture = null;
          window.clearTimeout(capture.timer);
          capture.reject(error instanceof Error ? error : new Error(String(error)));
        }
      }
      if (!measuring || !state.drawOccurredDuringMeasuredRaf) return;
      if (state.previousDrawFrameAt !== null && state.previousDrawFrameAt !== timestamp) {
        state.frameIntervalsMs.push(timestamp - state.previousDrawFrameAt);
      }
      state.previousDrawFrameAt = timestamp;
      if (callbackStartedAt !== null) state.frameCallbackDurationsMs.push(window.performance.now() - callbackStartedAt);
    });
    const viewerCanvasCache = new WeakMap<HTMLCanvasElement, boolean>();
    const viewerContextIds = new WeakMap<object, string>();
    let nextViewerContextId = 1;
    const isViewerCanvas = (gl: { canvas?: HTMLCanvasElement | OffscreenCanvas }) => {
      const canvas = gl.canvas;
      if (!(canvas instanceof HTMLCanvasElement)) return false;
      const cached = viewerCanvasCache.get(canvas);
      if (cached === true) return true;
      const isViewer = canvas.dataset.cadL11Target === "true" || Boolean(canvas.closest("#document-studio-shell"));
      if (isViewer) viewerCanvasCache.set(canvas, true);
      return isViewer;
    };
    const getViewerContextId = (gl: object) => {
      let contextId = viewerContextIds.get(gl);
      if (!contextId) {
        contextId = `viewer-context-${nextViewerContextId++}`;
        viewerContextIds.set(gl, contextId);
      }
      return contextId;
    };
    const recordDraw = (
      gl: { canvas?: HTMLCanvasElement | OffscreenCanvas },
      isMultiDraw = false,
      methodName?: string,
    ) => {
      if (!isViewerCanvas(gl)) return;
      viewerDrawOccurredInRaf = true;
      if (state.firstViewerDrawEpochMs === null) {
        state.firstViewerDrawEpochMs = window.performance.timeOrigin + window.performance.now();
      }
      if (!state.measureDrawFrames && !state.measureInteractionDraws) return;
      if (isMultiDraw) state.multiDrawCalls++;
      if (state.measureDrawFrames) {
        state.drawOccurredDuringMeasuredRaf = true;
        return;
      }
      const nextInput = state.inputMarkers.find((marker) =>
        marker.drawnAt === undefined && marker.drawCount === state.drawCalls);
      if (nextInput) {
        nextInput.drawnAt = window.performance.now();
        state.inputToDrawMs.push(nextInput.drawnAt - nextInput.at);
        state.inputKinds.push(nextInput.kind);
      }
      state.drawCalls++;
      if (methodName) state.drawCallsByMethod[methodName] = (state.drawCallsByMethod[methodName] ?? 0) + 1;
    };
    const constructors = [
      (window as unknown as { WebGLRenderingContext?: { prototype: Record<string, unknown> } }).WebGLRenderingContext,
      (window as unknown as { WebGL2RenderingContext?: { prototype: Record<string, unknown> } }).WebGL2RenderingContext,
    ].filter(Boolean) as Array<{ prototype: Record<string, unknown> }>;
    const drawMethods = ["drawArrays", "drawElements", "drawArraysInstanced", "drawElementsInstanced"];
    for (const constructor of constructors) {
      const prototype = constructor.prototype;
      const nativeGetSupportedExtensions = prototype.getSupportedExtensions as (() => string[] | null) | undefined;
      if (nativeGetSupportedExtensions && Object.prototype.hasOwnProperty.call(prototype, "getSupportedExtensions")) {
        prototype.getSupportedExtensions = function (this: WebGLRenderingContext) {
          const extensions = nativeGetSupportedExtensions.call(this);
          if (extensions?.includes("WEBGL_multi_draw")) {
            state.multiDrawSupportedExtensionListQueries++;
            if (isViewerCanvas(this)) {
              state.viewerMultiDrawSupportedExtensionListQueries++;
              const contextId = getViewerContextId(this);
              state.viewerMultiDrawSupportedExtensionListQueriesByContext[contextId] =
                (state.viewerMultiDrawSupportedExtensionListQueriesByContext[contextId] ?? 0) + 1;
              state.viewerMultiDrawExtensionAdvertised++;
            }
          }
          return extensions;
        };
      }
      const nativeGetExtension = prototype.getExtension as ((name: string) => unknown) | undefined;
      // WebGL2RenderingContext can inherit getExtension from WebGLRenderingContext.
      // Wrapping the inherited method on both prototypes layers the instrumentation
      // and counts one real driver query twice for the same context.
      if (nativeGetExtension && Object.prototype.hasOwnProperty.call(prototype, "getExtension")) {
        prototype.getExtension = function (this: WebGLRenderingContext, name: string) {
          if (name === "WEBGL_multi_draw") {
            state.multiDrawExtensionQueries++;
            if (isViewerCanvas(this)) {
              state.viewerMultiDrawExtensionQueries++;
              const contextId = getViewerContextId(this);
              state.viewerMultiDrawExtensionQueriesByContext[contextId] =
                (state.viewerMultiDrawExtensionQueriesByContext[contextId] ?? 0) + 1;
            }
          }
          const extension = nativeGetExtension.call(this, name);
          if (name === "WEBGL_multi_draw" && isViewerCanvas(this)) {
            if (extension) {
              state.viewerMultiDrawExtensionAvailable++;
              if (state.viewerMultiDrawExtensionKeys.length < 3) {
                state.viewerMultiDrawExtensionKeys.push(Reflect.ownKeys(extension as object).map(String));
              }
            } else {
              state.viewerMultiDrawExtensionMissing++;
            }
          }
          if (name !== "WEBGL_multi_draw" || !extension) return extension;
          const gl = this;
          const wrappedMethods = new Map<PropertyKey, (...args: unknown[]) => unknown>();
          return new Proxy(extension as object, {
            get(target, property, receiver) {
              const value = Reflect.get(target, property, receiver) as unknown;
              const measuring = state.measureDrawFrames || state.measureInteractionDraws;
              if (measuring && state.multiDrawPropertyReads.length < 50) {
                const propertyName = String(property);
                if (!state.multiDrawPropertyReads.includes(propertyName)) state.multiDrawPropertyReads.push(propertyName);
              }
              if (typeof value !== "function" || typeof property !== "string" || !property.startsWith("multiDraw")) {
                return value;
              }
              let wrapped = wrappedMethods.get(property);
              if (!wrapped) {
                wrapped = (...args: unknown[]) => {
                  if (isViewerCanvas(gl)) viewerDrawOccurredInRaf = true;
                  if (state.measureDrawFrames) {
                    // A frame needs only a boolean "CAD drew" marker. Avoid routing every
                    // multi-draw call through canvas/WeakMap diagnostics during p95 sampling.
                    if (!state.drawOccurredDuringMeasuredRaf && isViewerCanvas(gl)) {
                      state.drawOccurredDuringMeasuredRaf = true;
                    }
                  } else if (state.measureInteractionDraws) {
                    if (state.multiDrawMethodNames.length < 50 && !state.multiDrawMethodNames.includes(property)) {
                      state.multiDrawMethodNames.push(property);
                    }
                    recordDraw(gl, true, property);
                  }
                  return Reflect.apply(value, target, args);
                };
                wrappedMethods.set(property, wrapped);
              }
              return wrapped;
            },
          });
        };
      }
      for (const method of drawMethods) {
        const original = prototype[method] as ((...args: unknown[]) => unknown) | undefined;
        if (!original || !Object.prototype.hasOwnProperty.call(prototype, method)) continue;
        state.patchedDrawMethods.push(method);
        prototype[method] = function (this: { canvas?: HTMLCanvasElement }, ...args: unknown[]) {
          const viewerCanvas = isViewerCanvas(this);
          if (viewerCanvas) viewerDrawOccurredInRaf = true;
          if (state.measureDrawFrames) {
            // Record only the first target draw in each RAF callback; instrumenting every
            // geometry submission here distorts the frame interval being measured.
            if (!state.drawOccurredDuringMeasuredRaf && viewerCanvas) {
              state.drawOccurredDuringMeasuredRaf = true;
            }
          } else if (state.measureInteractionDraws || state.firstViewerDrawEpochMs === null) {
            recordDraw(this, false, method);
          }
          return original.apply(this, args);
        };
      }
    }
    const markViewerCanvas = () => document.querySelectorAll<HTMLCanvasElement>("#document-studio-shell canvas")
      .forEach((canvas) => { canvas.dataset.cadL11Target = "true"; });
    if (document.documentElement) {
      new MutationObserver(markViewerCanvas).observe(document.documentElement, { childList: true, subtree: true });
      markViewerCanvas();
    }
    try {
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (state.longTasksMs.length < 200) state.longTasksMs.push(entry.duration);
        }
      }).observe({ type: "longtask", buffered: true });
    } catch {
      // Unsupported long-task observation remains visible in empty samples.
    }
  });
}

test.describe("CAD V2 L11 browser release — R002/R003/R004", () => {
  const selectedSourceId = process.env.CAD_V2_L11_BROWSER_SOURCE_ID?.toUpperCase();
  test.skip(!selectedSourceId, "Set CAD_V2_L11_BROWSER_SOURCE_ID=R002, R003, or R004 for an isolated release run.");

  test("R003 bounded main-thread CPU profile", async ({ page, browser }, testInfo) => {
    test.skip(process.env.CAD_V2_L11_CPU_PROFILE_ONLY !== "true", "Optional diagnostic profile run.");
    const sourceId = selectedSourceId as ReleaseSourceId;
    if (sourceId !== "R003") throw new Error("The bounded CPU profile is calibrated for the R003 large scene.");
    const source = sourceCorpus.R003;
    const sourcePath = path.resolve(process.cwd(), source.path);
    const sourceSha256 = sha256(readFileSync(sourcePath));
    expect(sourceSha256, "R003 CPU profile must use the checked source corpus revision").toBe(source.sha256);
    let fileId = process.env.CAD_V2_L11_PREUPLOADED_FILE_ID?.trim() || null;
    const expectedAcceptedChunks = Number(process.env.CAD_V2_L11_PROFILE_EXPECTED_ACCEPTED_CHUNKS);
    if (!Number.isSafeInteger(expectedAcceptedChunks) || expectedAcceptedChunks < 1) {
      throw new Error("CPU profiling requires the accepted R003 chunk count from a completed browser run.");
    }
    test.setTimeout(900_000);
    await installMetrics(page);
    await signInAdmin(page);
    await page.setViewportSize({ width: 1440, height: 900 });
    if (!fileId) {
      fileId = await uploadRealCadBinaryFixture(page, sourcePath, path.basename(sourcePath), "application/acad");
    }
    let observedSceneId: string | null = null;
    page.on("request", (request) => {
      try {
        const match = /^\/api\/dokumantasyon\/cad-v2\/scenes\/([^/]+)\/chunks\//.exec(new URL(request.url()).pathname);
        if (match) observedSceneId = decodeURIComponent(match[1]!);
      } catch {
        // Non-HTTP request URLs are outside the CAD scene profile.
      }
    });
    await page.goto(`/dokumantasyon/dosya/${fileId}?cadEngine=v2`, { waitUntil: "domcontentloaded" });
    const canvas = page.locator("#document-studio-shell canvas");
    await expect(canvas).toBeVisible({ timeout: 30_000 });

    let previousEventCount = -1;
    let stableSamples = 0;
    let settled: { started: number; outcomes: number; accepted: number; rejected: number } | null = null;
    const settleDeadline = Date.now() + 600_000;
    let settlePollCount = 0;
    while (Date.now() < settleDeadline && stableSamples < 5) {
      settlePollCount++;
      settled = await page.evaluate(() => {
        const events = (window as any).__cadL11.hostEvents as ResourceEvent[];
        const started = events.filter((event) => event.type === "chunk-load-start").length;
        const outcomes = events.filter((event) => event.type === "chunk-load-outcome");
        return {
          started,
          outcomes: outcomes.length,
          accepted: new Set(outcomes.filter((event) => event.status === "accepted").map((event) => event.chunkId)).size,
          rejected: outcomes.filter((event) => event.status === "rejected").length,
        };
      });
      const eventCount = settled.started + settled.outcomes;
      if (settled.started === settled.outcomes && settled.accepted === expectedAcceptedChunks && settled.rejected === 0 && eventCount === previousEventCount) {
        stableSamples++;
      } else {
        stableSamples = 0;
      }
      previousEventCount = eventCount;
      if (settlePollCount % 60 === 0) console.log(`[L11_R003_CPU_PROFILE_PROGRESS] ${JSON.stringify({ ...settled, stableSamples })}`);
      await page.waitForTimeout(500);
    }
    expect(stableSamples, "R003 profiling requires the complete, stable accepted chunk set").toBe(5);
    expect(settled).toMatchObject({ accepted: expectedAcceptedChunks, rejected: 0 });
    expect(observedSceneId, "R003 profile must identify the scene whose chunks were fetched").toBeTruthy();
    await expect.poll(() => page.evaluate(() => (window as any).__cadL11.firstViewerDrawEpochMs as number | null), {
      timeout: 600_000,
      message: "R003 must issue a real WebGL draw before profiling",
    }).not.toBeNull();

    const cdp = await page.context().newCDPSession(page);
    let profilerStarted = false;
    let cpuProfile: Awaited<ReturnType<typeof cdp.send>> | null = null;
    try {
      await cdp.send("Profiler.enable");
      await cdp.send("Profiler.setSamplingInterval", { interval: 1_000 });
      await cdp.send("Profiler.start");
      profilerStarted = true;
      const interactionMetrics = await page.evaluate(async () => {
        const metrics = (window as any).__cadL11;
        metrics.measureDrawFrames = true;
        metrics.previousDrawFrameAt = null;
        metrics.frameIntervalsMs.length = 0;
        metrics.frameCallbackDurationsMs.length = 0;
        metrics.longTasksMs.length = 0;
        const surface = document.querySelector('[aria-label="CAD V2 Çizim Etkileşim Alanı"]');
        if (!surface) throw new Error("R003 CPU profile cannot find the CAD interaction surface.");
        const rect = surface.getBoundingClientRect();
        try {
          for (let index = 0; index < 60; index++) {
            surface.dispatchEvent(new WheelEvent("wheel", {
              deltaY: index % 2 === 0 ? 120 : -120,
              clientX: rect.left + rect.width / 2,
              clientY: rect.top + rect.height / 2,
              bubbles: true,
              cancelable: true,
            }));
            await new Promise((resolve) => window.setTimeout(resolve, 8));
          }
          await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
        } finally {
          metrics.measureDrawFrames = false;
        }
        return {
          frameIntervalsMs: [...metrics.frameIntervalsMs] as number[],
          callbackDurationsMs: [...metrics.frameCallbackDurationsMs] as number[],
          longTasksMs: [...metrics.longTasksMs] as number[],
          viewerMultiDrawExtensionAvailable: metrics.viewerMultiDrawExtensionAvailable as number,
          viewerMultiDrawExtensionMissing: metrics.viewerMultiDrawExtensionMissing as number,
          viewerMultiDrawExtensionAdvertised: metrics.viewerMultiDrawExtensionAdvertised as number,
          multiDrawCalls: metrics.multiDrawCalls as number,
          multiDrawMethodNames: [...metrics.multiDrawMethodNames] as string[],
        };
      });
      cpuProfile = await cdp.send("Profiler.stop");
      profilerStarted = false;

      const drawCallDiagnostics = await page.evaluate(async () => {
        const metrics = (window as any).__cadL11;
        metrics.measureInteractionDraws = true;
        metrics.drawCalls = 0;
        metrics.drawCallsByMethod = {};
        metrics.multiDrawCalls = 0;
        metrics.multiDrawMethodNames.length = 0;
        const surface = document.querySelector('[aria-label="CAD V2 Çizim Etkileşim Alanı"]');
        if (!surface) throw new Error("R003 draw-call diagnostic cannot find the CAD interaction surface.");
        const rect = surface.getBoundingClientRect();
        try {
          for (let index = 0; index < 5; index++) {
            surface.dispatchEvent(new WheelEvent("wheel", {
              deltaY: index % 2 === 0 ? 120 : -120,
              clientX: rect.left + rect.width / 2,
              clientY: rect.top + rect.height / 2,
              bubbles: true,
              cancelable: true,
            }));
            await new Promise((resolve) => window.setTimeout(resolve, 16));
          }
          await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
        } finally {
          metrics.measureInteractionDraws = false;
        }
        return {
          drawCalls: metrics.drawCalls as number,
          drawCallsByMethod: { ...metrics.drawCallsByMethod } as Record<string, number>,
          multiDrawCalls: metrics.multiDrawCalls as number,
          multiDrawMethodNames: [...metrics.multiDrawMethodNames] as string[],
        };
      });

      const profile = (cpuProfile as { profile?: {
        nodes?: Array<{ id: number; callFrame: { functionName?: string; url?: string; lineNumber?: number; columnNumber?: number } }>;
        samples?: number[];
        timeDeltas?: number[];
      } } | null)?.profile;
      const nodeById = new Map((profile?.nodes ?? []).map((node) => [node.id, node]));
      const aggregate = new Map<string, { functionName: string; url: string; lineNumber: number; selfTimeMs: number; samples: number }>();
      for (let index = 0; index < (profile?.samples?.length ?? 0); index++) {
        const node = nodeById.get(profile!.samples![index]!);
        if (!node) continue;
        const frame = node.callFrame;
        const functionName = frame.functionName || "(anonymous)";
        const url = frame.url || "(runtime)";
        const lineNumber = frame.lineNumber ?? -1;
        const key = `${url}\n${lineNumber}\n${functionName}`;
        const item = aggregate.get(key) ?? { functionName, url, lineNumber, selfTimeMs: 0, samples: 0 };
        item.selfTimeMs += (profile?.timeDeltas?.[index] ?? 0) / 1_000;
        item.samples++;
        aggregate.set(key, item);
      }
      const profileSummary = {
        compilerRevision: CAD_V2_COMPILER_REVISION,
        sourceId,
        sourceSha256: sourceCorpus.R003.sha256,
        sceneId: observedSceneId,
        acceptedChunks: settled!.accepted,
        rejectedChunks: settled!.rejected,
        sampledCpuMs: [...aggregate.values()].reduce((total, item) => total + item.selfTimeMs, 0),
        profileSampleCount: profile?.samples?.length ?? 0,
        frameIntervalCount: interactionMetrics.frameIntervalsMs.length,
        frameIntervalP95Ms: percentile(interactionMetrics.frameIntervalsMs, 0.95),
        drawCallbackP95Ms: percentile(interactionMetrics.callbackDurationsMs, 0.95),
        maxLongTaskMs: interactionMetrics.longTasksMs.length ? Math.max(...interactionMetrics.longTasksMs) : null,
        viewerMultiDrawExtensionAvailable: interactionMetrics.viewerMultiDrawExtensionAvailable,
        viewerMultiDrawExtensionMissing: interactionMetrics.viewerMultiDrawExtensionMissing,
        viewerMultiDrawExtensionAdvertised: interactionMetrics.viewerMultiDrawExtensionAdvertised,
        drawCallDiagnostics,
        topSelfTime: [...aggregate.values()].sort((left, right) => right.selfTimeMs - left.selfTimeMs).slice(0, 100),
      };
      const rendererDiagnostics = await page.evaluate(() => {
        const canvas = document.querySelector<HTMLCanvasElement>("#document-studio-shell canvas");
        const gl = canvas?.getContext("webgl2");
        const pages = ((window as any).__cadL11.painterPageDiagnostics ?? []) as Array<{
          kind?: string;
          pageMeshCount?: number;
          pageStyleCount?: number;
          pageChunkCount?: number;
          cameraRelativeChunkCount?: number;
        }>;
        const batches = ((window as any).__cadL11.batchDiagnostics ?? []) as Array<{
          painterDepthBatch?: boolean;
          painterDepthFallbackReasons?: string[];
          instanceCount?: number;
        }>;
        const fallbackReasons: Record<string, number> = {};
        for (const batch of batches) {
          for (const reason of batch.painterDepthFallbackReasons ?? []) {
            fallbackReasons[reason] = (fallbackReasons[reason] ?? 0) + 1;
          }
        }
        return {
          maxTextureSize: gl?.getParameter(gl.MAX_TEXTURE_SIZE) ?? null,
          painterPageCount: pages.length,
          cameraRelativeChunkCount: pages.at(-1)?.cameraRelativeChunkCount ?? null,
          batchDiagnosticCount: batches.length,
          painterDepthBatchCount: batches.filter((batch) => batch.painterDepthBatch === true).length,
          painterDepthFallbackCount: batches.filter((batch) => batch.painterDepthBatch === false).length,
          painterDepthFallbackReasons: fallbackReasons,
          maxBatchInstanceCount: Math.max(0, ...batches.map((batch) => batch.instanceCount ?? 0)),
          pageStyleCounts: pages.reduce<Record<string, number>>((counts, page) => {
            const key = String(page.pageStyleCount ?? "unknown");
            counts[key] = (counts[key] ?? 0) + 1;
            return counts;
          }, {}),
          pageKinds: pages.reduce<Record<string, number>>((counts, page) => {
            const key = page.kind ?? "unknown";
            counts[key] = (counts[key] ?? 0) + 1;
            return counts;
          }, {}),
          maxPageChunks: Math.max(0, ...pages.map((page) => page.pageChunkCount ?? 0)),
        };
      });
      expect(profileSummary.profileSampleCount, "Chrome CPU profiler must capture main-thread samples").toBeGreaterThan(0);
      await testInfo.attach("l11-r003-main-thread-cpu-profile.json", {
        body: Buffer.from(JSON.stringify({ ...profileSummary, rendererDiagnostics }, null, 2)),
        contentType: "application/json",
      });
      console.log(`[L11_R003_CPU_PROFILE] ${JSON.stringify({
        compilerRevision: profileSummary.compilerRevision,
        acceptedChunks: profileSummary.acceptedChunks,
        frameIntervalP95Ms: profileSummary.frameIntervalP95Ms,
        drawCallbackP95Ms: profileSummary.drawCallbackP95Ms,
        maxLongTaskMs: profileSummary.maxLongTaskMs,
        rendererDiagnostics,
        topSelfTime: profileSummary.topSelfTime.slice(0, 20),
      })}`);
    } finally {
      if (profilerStarted) await cdp.send("Profiler.stop").catch(() => undefined);
      await cdp.send("Profiler.disable").catch(() => undefined);
      await cdp.detach();
    }
  });

  test("cold host open + warm host reopen, 30 interactions and settled raster", async ({ page: fixturePage, browser }, testInfo) => {
    test.skip(process.env.CAD_V2_L11_CPU_PROFILE_ONLY === "true", "CPU-profile mode skips the release benchmark pair.");
    const sourceId = selectedSourceId as ReleaseSourceId;
    if (!(sourceId in sourceCorpus)) throw new Error(`Unsupported L11 source ID: ${sourceId}`);
    const source = sourceCorpus[sourceId];
    const sourcePath = path.resolve(process.cwd(), source.path);
    if (!existsSync(sourcePath)) throw new Error(`L11 source is unavailable: ${source.path}`);
    const sourceBytes = statSync(sourcePath).size;
    const sourceSha256 = sha256(readFileSync(sourcePath));
    expect(sourceSha256, `${sourceId} current source SHA must match its prior cold-release record`).toBe(source.sha256);
    const executionMode = process.env.CAD_V2_L11_RUN_MODE ?? "production-release";
    if (executionMode !== "production-release" && executionMode !== "production-diagnostic") {
      throw new Error(`Unsupported L11 browser run mode: ${executionMode}`);
    }
    const minimumRepeatCount = executionMode === "production-release" ? 30 : 1;
    const repeatCount = Number(process.env.CAD_V2_L11_BROWSER_RELEASE_REPEAT_COUNT ?? minimumRepeatCount);
    expect(Number.isInteger(repeatCount) && repeatCount >= minimumRepeatCount,
      executionMode === "production-release"
        ? "L11 release requires at least 30 complete repeats per condition"
        : "L11 production diagnostic requires at least one complete repeat per condition",
    ).toBe(true);    const firstUsefulRasterTimeoutMs = positiveIntegerFromEnv("CAD_V2_L11_FIRST_RASTER_TIMEOUT_MS", 600_000);
    const settledHostTimeoutMs = positiveIntegerFromEnv("CAD_V2_L11_SETTLED_TIMEOUT_MS", 600_000);
    test.setTimeout(positiveIntegerFromEnv("CAD_V2_L11_BROWSER_TEST_TIMEOUT_MS", 21_600_000));

    let fileId: string | null = null;
    let sourceUploadMs = 0;
    const preuploadedFileId = process.env.CAD_V2_L11_PREUPLOADED_FILE_ID?.trim() || null;
    try {
      await signInAdmin(fixturePage);
      const gpuCdp = await browser.newBrowserCDPSession();
      try {
        const { gpu } = await gpuCdp.send("SystemInfo.getInfo");
        console.log(`[L11_GPU_${sourceId}] ${JSON.stringify({ renderer: gpu.auxAttributes?.glRenderer ?? null, driver: gpu.devices.find((device) => (device as typeof device & { active?: boolean }).active)?.driverVersion ?? null })}`);
      } finally {
        await gpuCdp.detach();
      }
      await fixturePage.setViewportSize({ width: 1440, height: 900 });
      if (preuploadedFileId) {
        fileId = preuploadedFileId;
      } else {
        const fileName = path.basename(sourcePath);
        const sourceUploadStartedAt = performance.now();
        fileId = await uploadRealCadBinaryFixture(fixturePage, sourcePath, fileName,
          sourcePath.toLowerCase().endsWith(".dxf") ? "application/dxf" : "application/acad");
        sourceUploadMs = performance.now() - sourceUploadStartedAt;
      }
      const rendererIssuePattern = /THREE\.WebGLProgram: Shader Error|position\s*:\s*redefinition|gl_FragColor.{0,80}undeclared|computeBoundingSphere\(\): Computed radius is NaN|\[CadRenderer\] Frame çizimi başarısız/i;
      const browserBaseURL = `http://127.0.0.1:${process.env.PLAYWRIGHT_PORT ?? "3238"}`;
      let canvasCaptureOverlayProbePassed = false;
      const fileUrl = `/dokumantasyon/dosya/${fileId}?cadEngine=v2`;
      const attachRequestMetrics = (page: Page, state: BrowserPairState) => {
        page.on("request", (request) => {
          const run = state.activeRun;
          if (!run) return;
          let url: URL;
          try { url = new URL(request.url()); } catch { return; }
          if (url.pathname === "/api/dokumantasyon/cad-v2/prepare" && request.method() === "POST") {
            let requestBody: Record<string, unknown> = {};
            try {
              const parsed = JSON.parse(request.postData() ?? "{}") as Record<string, unknown>;
              requestBody = parsed && typeof parsed === "object" ? parsed : {};
            } catch {
              // Keep malformed bodies visible through the response status without copying raw payloads.
            }
            const apiEvent: BrowserRun["apiCallDiagnostics"][number] = {
              kind: "prepare",
              elapsedMs: state.runStartedAtMs === null ? null : performance.now() - state.runStartedAtMs,
              method: request.method(),
              ...(typeof requestBody.fileId === "string" ? { fileId: requestBody.fileId } : {}),
              ...(typeof requestBody.clientRequestId === "string" ? { clientRequestId: requestBody.clientRequestId } : {}),
              ...(typeof requestBody.expectedSourceVersionKey === "string"
                ? { expectedSourceVersionKey: requestBody.expectedSourceVersionKey }
                : {}),
            };
            run.apiCallDiagnostics.push(apiEvent);
            state.diagnosticByRequest.set(request, apiEvent);
            state.requestByObject.set(request, { run, kind: "prepare", startedAt: performance.now() });
            return;
          }
          const heartbeatMatch = /^\/api\/dokumantasyon\/cad-v2\/view-sessions\/[^/]+\/heartbeat$/.test(url.pathname);
          const sessionDeleteMatch = /^\/api\/dokumantasyon\/cad-v2\/view-sessions\/[^/]+$/.test(url.pathname) && request.method() === "DELETE";
          if ((heartbeatMatch && request.method() === "POST") || sessionDeleteMatch) {
            const apiEvent: BrowserRun["apiCallDiagnostics"][number] = {
              kind: heartbeatMatch ? "heartbeat" : "session-delete",
              elapsedMs: state.runStartedAtMs === null ? null : performance.now() - state.runStartedAtMs,
              method: request.method(),
            };
            run.apiCallDiagnostics.push(apiEvent);
            state.diagnosticByRequest.set(request, apiEvent);
          }
          const match = /^\/api\/dokumantasyon\/cad-v2\/scenes\/([^/]+)\/chunks\/([^/]+)$/.exec(url.pathname);
          if (!match) return;
          state.sceneId = decodeURIComponent(match[1]!);
          run.sceneId = state.sceneId;
          run.chunkIds.push(decodeURIComponent(match[2]!));
          run.pendingChunkResponses++;
          state.requestByObject.set(request, { run, kind: "chunk", startedAt: performance.now() });
        });
        const finishRequest = async (request: Request) => {
          const apiDiagnostic = state.diagnosticByRequest.get(request);
          if (apiDiagnostic) {
            state.diagnosticByRequest.delete(request);
            try {
              const response = await request.response();
              apiDiagnostic.responseStatus = response?.status() ?? null;
              if (apiDiagnostic.kind === "prepare" && response?.ok()) {
                const payload = await response.json().catch(() => null) as Record<string, unknown> | null;
                if (payload) {
                  apiDiagnostic.responseState = typeof payload.status === "string" ? payload.status : null;
                  apiDiagnostic.responseCode = typeof payload.code === "string" ? payload.code : null;
                  apiDiagnostic.hasSceneId = typeof payload.sceneId === "string";
                  apiDiagnostic.hasJobId = typeof payload.jobId === "string";
                  apiDiagnostic.hasViewSessionId = typeof payload.viewSessionId === "string";
                }
              }
            } catch {
              apiDiagnostic.responseStatus = null;
            }
          }
          const measurement = state.requestByObject.get(request);
          if (!measurement) return;
          state.requestByObject.delete(request);
          const durationMs = performance.now() - measurement.startedAt;
          if (measurement.kind === "prepare") {
            measurement.run.prepareDurationsMs.push(durationMs);
            return;
          }
          try {
            const [response, sizes] = await Promise.all([request.response(), request.sizes()]);
            if (!response || !response.ok()) measurement.run.failedChunkRequestCount++;
            measurement.run.chunkResponseBytes.push(sizes.responseBodySize);
          } catch {
            measurement.run.failedChunkRequestCount++;
          } finally {
            measurement.run.pendingChunkResponses = Math.max(0, measurement.run.pendingChunkResponses - 1);
            measurement.run.chunkFetchDurationsMs.push(durationMs);
          }
        };
        page.on("requestfinished", (request) => { void finishRequest(request); });
        page.on("requestfailed", (request) => { void finishRequest(request); });
      };

      const sampleOpen = async (page: Page, state: BrowserPairState, label: "cold" | "warm", reopen: boolean, repeat: number) => {
        const run: BrowserRun = {
          label,
          chunkIds: [],
          pendingChunkResponses: 0,
          chunkFetchDurationsMs: [],
          chunkResponseBytes: [],
          hostPipelineDurationsMs: [],
          prepareDurationsMs: [],
          apiCallDiagnostics: [],
          hostLifecycleMessages: [],
          failedChunkRequestCount: 0,
        };
        state.activeRun = run;
        state.runStartedAtMs = performance.now();
        const rendererIssueStart = state.rendererIssues.length;
        const startedAt = performance.now();
        const startedAtEpochMs = Date.now();
        const logSeedStage = (stage: string, detail: Record<string, unknown> = {}) => {
          if (repeat !== 0 && process.env.CAD_V2_L11_PROGRESS_ALL_REPEATS !== "true") return;
          const event = {
            timestamp: new Date().toISOString(),
            sourceId,
            label,
            repeat,
            stage,
            elapsedMs: Math.round(performance.now() - startedAt),
            ...detail,
          };
          const progressLog = process.env.CAD_V2_L11_PROGRESS_LOG;
          if (progressLog) {
            mkdirSync(path.dirname(progressLog), { recursive: true });
            appendFileSync(progressLog, `${JSON.stringify(event)}\n`, "utf8");
          }
          console.log(`[L11_STAGE_${sourceId}_${label}] ${JSON.stringify(event)}`);
        };
        logSeedStage("sample-start", { reopen, fileUrl });
        const rasterSamples: Array<{
          elapsedMs: number;
          raster: ReturnType<typeof measureRaster>;
          sha256: string;
        }> = [];
        let canvasOverlayProbeRaster: Buffer | null = null;
        if (label === "cold") {
          logSeedStage("clear-browser-cache-start");
          const cacheSession = await page.context().newCDPSession(page);
          try {
            await cacheSession.send("Network.clearBrowserCache");
          } finally {
            await cacheSession.detach();
          }
          logSeedStage("clear-browser-cache-complete");
        }
        const prepareResponsePromise = page.waitForResponse((response) => {
          if (response.request().method() !== "POST") return false;
          try { return new URL(response.url()).pathname === "/api/dokumantasyon/cad-v2/prepare"; } catch { return false; }
        }, { timeout: settledHostTimeoutMs });
        logSeedStage(reopen ? "page-reload-start" : "page-navigation-start", { fileUrl });
        if (reopen) await page.reload({ waitUntil: "domcontentloaded", timeout: 60_000 });
        else await page.goto(fileUrl, { waitUntil: "domcontentloaded", timeout: 60_000 });
        logSeedStage("page-domcontentloaded");
        const prepareResponse = await prepareResponsePromise;
        logSeedStage("prepare-response", { status: prepareResponse.status() });
        run.prepareResponseStatus = prepareResponse.status();
        const prepareBody = await prepareResponse.json() as { status?: unknown; sceneId?: unknown };
        run.prepareJobStatus = typeof prepareBody.status === "string" ? prepareBody.status : "unknown";
        expect(prepareResponse.ok(), `${sourceId} ${label} ${repeat} actual prepare API must succeed`).toBe(true);
        expect(run.prepareJobStatus, `${sourceId} ${label} ${repeat} prepare must report a known service state`)
          .toMatch(/^(ready|preparing)$/);
        if (typeof prepareBody.sceneId === "string") {
          run.sceneId = prepareBody.sceneId;
          state.sceneId = prepareBody.sceneId;
        }
        await expect.poll(() => run.prepareDurationsMs.length, { timeout: 10_000 }).toBe(1);
        logSeedStage("prepare-duration-recorded", { prepareStatus: run.prepareJobStatus });
        const input = page.getByLabel("CAD V2 Çizim Etkileşim Alanı");
        await expect(input).toBeVisible({ timeout: 60_000 });
        logSeedStage("interaction-surface-visible");
        const canvas = page.locator("#document-studio-shell canvas").first();
        await expect(canvas).toBeVisible({ timeout: 60_000 });
        logSeedStage("canvas-visible");
        if (!canvasCaptureOverlayProbePassed) {
          logSeedStage("overlay-probe-start");
          canvasOverlayProbeRaster = await assertCanvasCaptureExcludesUiOverlay(page, canvas);
          canvasCaptureOverlayProbePassed = true;
          logSeedStage("overlay-probe-complete", { raster: measureRaster(canvasOverlayProbeRaster) });
        }
        const captureRasterSample = async () => {
          let screenshot: Buffer;
          try {
            screenshot = await captureCanvasWithoutUiOverlays(page, canvas);
          } catch (error) {
            const diagnostic = await withTimeout(page.evaluate(() => {
              const metrics = (window as any).__cadL11;
              const outcomes = (metrics?.hostEvents ?? []).filter((event: ResourceEvent) => event.type === "chunk-load-outcome");
              const canvas = document.querySelector<HTMLCanvasElement>("#document-studio-shell canvas");
              return {
                firstViewerDrawEpochMs: metrics?.firstViewerDrawEpochMs ?? null,
                drawCalls: metrics?.drawCalls ?? null,
                outcomes: outcomes.length,
                acceptedChunkCount: outcomes.filter((event: ResourceEvent) => event.status === "accepted").length,
                rejectedChunkCount: outcomes.filter((event: ResourceEvent) => event.status === "rejected").length,
                progress: document.querySelector('[data-testid="cad-v2-streaming-progress"]')?.textContent ??
                  document.querySelector('[data-testid="cad-v2-blocking-loading-overlay"]')?.textContent ?? null,
                canvas: canvas ? { width: canvas.width, height: canvas.height } : null,
              };
            }), 5_000, "L11 WebGL capture-stall diagnostics").catch((diagnosticError) => ({
              diagnosticsError: diagnosticError instanceof Error ? diagnosticError.message : String(diagnosticError),
            }));
            const detail = { sourceId, label, repeat, diagnostic, captureError: error instanceof Error ? error.message : String(error) };
            await testInfo.attach(`l11-webgl-capture-stall-${sourceId}-${label}-${repeat}.json`, {
              body: Buffer.from(JSON.stringify(detail, null, 2)),
              contentType: "application/json",
            });
            throw new Error(`${sourceId} ${label} ${repeat} WebGL raster capture stalled: ${JSON.stringify(detail)}`);
          }
          const raster = measureRaster(screenshot);
          const sample = {
            elapsedMs: performance.now() - startedAt,
            raster,
            sha256: sha256(screenshot),
          };
          rasterSamples.push(sample);
          if (raster.foregroundPixelCount > 0 && raster.occupiedCellCount > 0 && run.firstNonemptyRasterMs === undefined) {
            run.firstNonemptyRasterMs = sample.elapsedMs;
            run.firstNonemptyRaster = raster;
            if (repeat === 0 || repeat === 1) {
              const sampleName = repeat === 0 ? "seed" : "repeat-1";
              await testInfo.attach(`l11-first-nonempty-raster-${sourceId}-${sampleName}-${label}.png`, {
                body: screenshot,
                contentType: "image/png",
              });
            }
          }
          if (raster.hasSubstantiveContent && run.firstSubstantiveRasterMs === undefined) {
            run.firstSubstantiveRasterMs = sample.elapsedMs;
            run.firstSubstantiveRaster = raster;
            if (repeat === 0 || repeat === 1) {
              const sampleName = repeat === 0 ? "seed" : "repeat-1";
              await testInfo.attach(`l11-first-substantive-raster-${sourceId}-${sampleName}-${label}.png`, {
                body: screenshot,
                contentType: "image/png",
              });
            }
          }
          return sample;
        };
        if (canvasOverlayProbeRaster) {
          const raster = measureRaster(canvasOverlayProbeRaster);
          const sample = { elapsedMs: performance.now() - startedAt, raster, sha256: sha256(canvasOverlayProbeRaster) };
          rasterSamples.push(sample);
          if (raster.foregroundPixelCount > 0 && raster.occupiedCellCount > 0) {
            run.firstNonemptyRasterMs = sample.elapsedMs;
            run.firstNonemptyRaster = raster;
          }
          if (raster.hasSubstantiveContent) {
            run.firstSubstantiveRasterMs = sample.elapsedMs;
            run.firstSubstantiveRaster = raster;
          }
          if (repeat === 0) {
            await testInfo.attach(`l11-capture-probe-raster-${sourceId}-${label}.png`, {
              body: canvasOverlayProbeRaster,
              contentType: "image/png",
            });
          }
          logSeedStage("probe-raster-recorded", { ...raster });
        }
        const firstRasterDeadline = Date.now() + firstUsefulRasterTimeoutMs;
        logSeedStage("first-substantive-raster-wait-start", { timeoutMs: firstUsefulRasterTimeoutMs });
        while (Date.now() < firstRasterDeadline && run.firstSubstantiveRasterMs === undefined) {
          const drawState = await page.evaluate(() => {
            const metrics = (window as any).__cadL11;
            return {
              firstViewerDrawEpochMs: metrics.firstViewerDrawEpochMs as number | null,
            };
          });
          if (drawState.firstViewerDrawEpochMs !== null && run.firstWebglDrawMs === undefined) {
            run.firstWebglDrawMs = drawState.firstViewerDrawEpochMs - startedAtEpochMs;
          }
          await page.waitForTimeout(250);
          const sample = await captureRasterSample();
          if (rasterSamples.length % 20 === 0) {
            logSeedStage("first-raster-poll", { sampleCount: rasterSamples.length, raster: sample.raster });
          }
          if (rasterSamples.length % 120 === 0) {
            const progress = await page.locator('[data-testid="cad-v2-streaming-progress"], [data-testid="cad-v2-blocking-loading-overlay"]')
              .first().textContent().catch(() => null);
            console.log(`[L11_RASTER_PROGRESS_${sourceId}] ${JSON.stringify({ label, repeat, elapsedMs: Math.round(sample.elapsedMs), raster: sample.raster, progress })}`);
          }
        }
        if (run.firstSubstantiveRasterMs === undefined || !run.firstSubstantiveRaster) {
          const browserDiagnostic = await page.evaluate(() => {
            const metrics = (window as any).__cadL11;
            const events = metrics.hostEvents as ResourceEvent[];
            const starts = events.filter((event) => event.type === "chunk-load-start" && typeof event.loadId === "number");
            const outcomes = events.filter((event) => event.type === "chunk-load-outcome");
            const completedLoadIds = new Set(outcomes
              .filter((event) => typeof event.loadId === "number")
              .map((event) => event.loadId!));
            const pendingLoads = starts.filter((event) => !completedLoadIds.has(event.loadId!));
            const rejected = outcomes.filter((event) => event.status === "rejected");
            const rejectionReasons = rejected.flatMap((event) => event.rejectionResources ?? [])
              .reduce<Record<string, number>>((counts, reason) => {
                counts[reason] = (counts[reason] ?? 0) + 1;
                return counts;
              }, {});
            const canvas = document.querySelector<HTMLCanvasElement>("#document-studio-shell canvas");
            return {
              firstViewerDrawEpochMs: metrics.firstViewerDrawEpochMs,
              drawCalls: metrics.drawCalls,
              progress: document.querySelector('[data-testid="cad-v2-blocking-loading-overlay"]')?.textContent ?? null,
              canvas: canvas ? { width: canvas.width, height: canvas.height, dataset: { ...canvas.dataset } } : null,
              hostEventCount: events.length,
              chunkLoadStartCount: starts.length,
              chunkLoadOutcomeCount: outcomes.length,
              acceptedChunkCount: outcomes.filter((event) => event.status === "accepted").length,
              rejectedChunkCount: rejected.length,
              staleVisibilityCount: outcomes.filter((event) => event.status === "stale-visibility").length,
              pendingHostLoadCount: pendingLoads.length,
              pendingHostLoadIds: pendingLoads.slice(0, 20).map((event) => ({ loadId: event.loadId, chunkId: event.chunkId })),
              rejectedChunkIds: rejected.slice(0, 20).map((event) => event.chunkId),
              rejectionReasons,
              recentHostEvents: events.slice(-20),
            };
          });
          const diagnostic = {
            ...browserDiagnostic,
            elapsedMs: performance.now() - startedAt,
            firstNonemptyRaster: run.firstNonemptyRaster ?? null,
            latestRaster: rasterSamples.at(-1)?.raster ?? null,
            pendingChunkResponses: run.pendingChunkResponses,
            failedChunkRequestCount: run.failedChunkRequestCount,
            recentApiCalls: run.apiCallDiagnostics.slice(-20),
            rendererIssues: state.rendererIssues.slice(rendererIssueStart),
            browserErrors: state.browserErrors.slice(-40),
          };
          await testInfo.attach(`l11-first-raster-timeout-${sourceId}-${label}-${repeat}.json`, {
            body: JSON.stringify(diagnostic, null, 2),
            contentType: "application/json",
          });
          throw new Error(`${sourceId} ${label} ${repeat} produced no substantive canvas raster within ${firstUsefulRasterTimeoutMs} ms: ${JSON.stringify(diagnostic)}`);
        }
        logSeedStage("first-substantive-raster", { elapsedMs: Math.round(run.firstSubstantiveRasterMs) });
        const footer = page.locator("footer").filter({ hasText: "MOTOR V2" });
        logSeedStage("footer-wait-start");
        try {
          await expect(footer).toBeVisible({ timeout: settledHostTimeoutMs });
        } catch (footerError) {
          const liveHost = await page.evaluate(() => {
            const metrics = (window as any).__cadL11;
            const events = (metrics?.hostEvents ?? []) as ResourceEvent[];
            const starts = events.filter((event) => event.type === "chunk-load-start");
            const outcomes = events.filter((event) => event.type === "chunk-load-outcome");
            const rejected = outcomes.filter((event) => event.status === "rejected");
            const rejectionReasons = rejected.flatMap((event) => event.rejectionResources ?? [])
              .reduce<Record<string, number>>((counts, reason) => {
                counts[reason] = (counts[reason] ?? 0) + 1;
                return counts;
              }, {});
            return {
              phase: document.querySelector<HTMLElement>("[data-v2-phase]")?.dataset.v2Phase ?? null,
              progress: document.querySelector('[data-testid="cad-v2-streaming-progress"]')?.textContent ??
                document.querySelector('[data-testid="cad-v2-blocking-loading-overlay"]')?.textContent ?? null,
              hostEventCount: events.length,
              chunkLoadStartCount: starts.length,
              chunkLoadOutcomeCount: outcomes.length,
              acceptedChunkCount: outcomes.filter((event) => event.status === "accepted").length,
              rejectedChunkCount: rejected.length,
              staleVisibilityCount: outcomes.filter((event) => event.status === "stale-visibility").length,
              rejectionReasons,
              recentHostEvents: events.slice(-40),
              footerVisible: Array.from(document.querySelectorAll("footer"))
                .some((element) => element.textContent?.includes("MOTOR V2") && element.getClientRects().length > 0),
            };
          });
          const diagnostic = {
            sourceId,
            label,
            repeat,
            sceneId: run.sceneId ?? null,
            elapsedMs: performance.now() - startedAt,
            firstUsefulRasterMs: run.firstUsefulRasterMs ?? null,
            firstUsefulRaster: run.firstUsefulRaster ?? null,
            chunkRequests: run.chunkIds.length,
            uniqueRequestedChunkCount: new Set(run.chunkIds).size,
            duplicateChunkRequestCount: run.chunkIds.length - new Set(run.chunkIds).size,
            chunkRequestRatePerSecond: run.chunkIds.length / Math.max(0.001, (performance.now() - startedAt) / 1000),
            chunkFetchDurationMs: {
              count: run.chunkFetchDurationsMs.length,
              p50: percentile(run.chunkFetchDurationsMs, 0.5),
              p95: percentile(run.chunkFetchDurationsMs, 0.95),
              max: Math.max(0, ...run.chunkFetchDurationsMs),
            },
            chunkResponseBytes: run.chunkResponseBytes.reduce((total, bytes) => total + bytes, 0),
            pendingChunkResponses: run.pendingChunkResponses,
            failedChunkRequestCount: run.failedChunkRequestCount,
            prepareApi: run.apiCallDiagnostics.filter((call) => call.kind === "prepare"),
            acceptedChunks: liveHost.acceptedChunkCount,
            rejectedChunks: liveHost.rejectedChunkCount,
            liveHost,
            rendererIssues: state.rendererIssues.slice(rendererIssueStart),
            browserErrors: state.browserErrors.slice(-40),
          };
          await testInfo.attach(`l11-footer-timeout-${sourceId}-${label}-${repeat}.json`, {
            body: Buffer.from(JSON.stringify(diagnostic, null, 2)),
            contentType: "application/json",
          });
          console.log(`[L11_FOOTER_TIMEOUT_${sourceId}] ${JSON.stringify(diagnostic)}`);
          throw footerError;
        }
        logSeedStage("footer-visible");
        await expect(page.locator('button[title="Yakınlaştır (+)"]')).toBeVisible({ timeout: 60_000 });

        let previousCount = -1;
        let stableSamples = 0;
        let settledPolls = 0;
        const settledDeadline = Date.now() + settledHostTimeoutMs;
        logSeedStage("host-settled-wait-start", { timeoutMs: settledHostTimeoutMs });
        while (Date.now() < settledDeadline && stableSamples < 5) {
          settledPolls++;
          const host = await page.evaluate(() => {
            const events = (window as unknown as { __cadL11: { hostEvents: ResourceEvent[] } }).__cadL11.hostEvents;
            const started = new Set(events.filter((event) => event.type === "chunk-load-start" && typeof event.loadId === "number")
              .map((event) => event.loadId!));
            const completed = new Set(events.filter((event) => event.type === "chunk-load-outcome" && typeof event.loadId === "number")
              .map((event) => event.loadId!));
            return { pending: Array.from(started).filter((loadId) => !completed.has(loadId)).length };
          });
        if (run.chunkIds.length === previousCount && run.pendingChunkResponses === 0 && host.pending === 0) stableSamples++;
          else stableSamples = 0;
          previousCount = run.chunkIds.length;
          if (repeat === 0 && settledPolls % 100 === 0) {
            logSeedStage("host-settled-poll", { stableSamples, chunkRequests: run.chunkIds.length, pendingChunkResponses: run.pendingChunkResponses, pendingHostLoads: host.pending });
          }
          await page.waitForTimeout(100);
        }
        if (stableSamples !== 5) {
          const diagnostic = await page.evaluate(() => {
            const events = (window as unknown as { __cadL11: { hostEvents: ResourceEvent[] } }).__cadL11.hostEvents;
            const starts = new Set(events.filter((event) => event.type === "chunk-load-start" && typeof event.loadId === "number")
              .map((event) => event.loadId!));
            const completed = new Set(events.filter((event) => event.type === "chunk-load-outcome" && typeof event.loadId === "number")
              .map((event) => event.loadId!));
            return { pendingHostLoads: Array.from(starts).filter((loadId) => !completed.has(loadId)).length, eventCount: events.length };
          });
          throw new Error(`${sourceId} ${label} ${repeat} host chunks did not settle within ${settledHostTimeoutMs} ms: ${JSON.stringify(diagnostic)}`);
        }
        logSeedStage("host-settled", { chunkRequests: run.chunkIds.length });
        logSeedStage("host-event-read-start");
        const events = await withTimeout(
          page.evaluate(() => (window as unknown as { __cadL11: { hostEvents: ResourceEvent[] } }).__cadL11.hostEvents),
          15_000,
          "L11 settled host-event read",
        );
        logSeedStage("host-event-read-complete", { eventCount: events.length });
        const starts = events.filter((event) => event.type === "chunk-load-start");
        const outcomes = events.filter((event) => event.type === "chunk-load-outcome");
        expect(run.chunkIds.length, `${sourceId} ${label} ${repeat} must fetch source chunks`).toBeGreaterThan(0);
        expect(run.failedChunkRequestCount,
          `${sourceId} ${label} ${repeat} actual chunk API requests must all succeed`).toBe(0);
        if (run.prepareDurationsMs.length !== 1) {
          const diagnostic = {
            sourceId,
            label,
            repeat,
            prepareDurationsMs: run.prepareDurationsMs,
            apiCalls: run.apiCallDiagnostics,
            hostLifecycleMessages: run.hostLifecycleMessages,
            sceneId: run.sceneId ?? null,
            fetchedChunkCount: run.chunkIds.length,
            failedChunkRequestCount: run.failedChunkRequestCount,
            pendingChunkResponses: run.pendingChunkResponses,
            firstUsefulRasterMs: run.firstUsefulRasterMs ?? null,
          };
          await testInfo.attach(`l11-prepare-api-diagnostics-${sourceId}-${label}-${repeat}.json`, {
            body: JSON.stringify(diagnostic, null, 2),
            contentType: "application/json",
          });
          console.log(`[L11_PREPARE_API_DIAGNOSTICS_${sourceId}] ${JSON.stringify(diagnostic)}`);
        }
        expect(run.prepareDurationsMs.length,
          `${sourceId} ${label} ${repeat} must have one actual prepare API duration`).toBe(1);
        expect(run.sceneId, `${sourceId} ${label} ${repeat} must resolve an actual persisted scene ID`).toBeTruthy();
        expect(outcomes.length, `${sourceId} ${label} ${repeat} every host load must have a terminal outcome`).toBe(starts.length);
        const qualityWarning = page.getByTestId("cad-v2-quality-warning");
        const qualityWarningCount = await withTimeout(qualityWarning.count(), 5_000, "L11 quality-warning locator count");
        const warning = qualityWarningCount > 0
          ? await withTimeout(qualityWarning.textContent(), 5_000, "L11 quality-warning text read")
          : null;
        logSeedStage("quality-warning-read-complete", { present: qualityWarningCount > 0 });
        const initialChunkIds = [...run.chunkIds];
        const requestedChunkIds = new Set(initialChunkIds);
        const rejectedVisibleChunkEvents = outcomes
          .filter((event) => event.status === "rejected" && event.chunkId && requestedChunkIds.has(event.chunkId));
        const rejectedVisibleChunkIds = [...new Set(rejectedVisibleChunkEvents.map((event) => event.chunkId!))];
        const overviewLodEvents = outcomes.filter((event) => event.overviewLod && event.status === "accepted");
        const worstOverviewLodEvent = overviewLodEvents.reduce<ResourceEvent | null>((worst, event) => {
          const errorAtSupportedZoom = (event.overviewLod!.maxCenterlineDeviationCssPixels +
            (event.positionCodecErrorCssPixels ?? 0)) * CAD_V2_OVERVIEW_MAX_ZOOM_FACTOR;
          const worstError = worst
            ? (worst.overviewLod!.maxCenterlineDeviationCssPixels + (worst.positionCodecErrorCssPixels ?? 0)) *
              CAD_V2_OVERVIEW_MAX_ZOOM_FACTOR
            : -1;
          return errorAtSupportedZoom > worstError ? event : worst;
        }, null);
        const maxOverviewLodErrorAtSupportedZoom = worstOverviewLodEvent
          ? (worstOverviewLodEvent.overviewLod!.maxCenterlineDeviationCssPixels +
            (worstOverviewLodEvent.positionCodecErrorCssPixels ?? 0)) * CAD_V2_OVERVIEW_MAX_ZOOM_FACTOR
          : 0;
        console.log(`[L11_OVERVIEW_${sourceId}_${label}_${repeat}] ${JSON.stringify({
          overviewEvaluatedChunkCount: overviewLodEvents.length,
          compactedChunkCount: overviewLodEvents.filter((event) => (event.overviewLod?.collapsedSegmentCount ?? 0) > 0).length,
          collapsedSegmentCount: overviewLodEvents.reduce((sum, event) => sum + (event.overviewLod?.collapsedSegmentCount ?? 0), 0),
          representativePointCount: overviewLodEvents.reduce((sum, event) => sum + (event.overviewLod?.representativePointCount ?? 0), 0),
          maxCenterlineErrorAtSupportedZoomCssPixels: maxOverviewLodErrorAtSupportedZoom,
          worstChunkId: worstOverviewLodEvent?.chunkId ?? null,
          worstOverviewErrorCssPixels: worstOverviewLodEvent?.overviewLod?.maxCenterlineDeviationCssPixels ?? 0,
          worstPositionCodecErrorCssPixels: worstOverviewLodEvent?.positionCodecErrorCssPixels ?? 0,
          worstCollapsedSegmentCount: worstOverviewLodEvent?.overviewLod?.collapsedSegmentCount ?? 0,
          worstVertexCount: worstOverviewLodEvent?.chunkVertexCount ?? 0,
          maximumSupportedZoomFactor: CAD_V2_OVERVIEW_MAX_ZOOM_FACTOR,
        })}`);
        expect(maxOverviewLodErrorAtSupportedZoom,
          `${sourceId} ${label} ${repeat} overview compaction plus coordinate encoding must stay within 0.25 CSS px at ${CAD_V2_OVERVIEW_MAX_ZOOM_FACTOR}x zoom`)
          .toBeLessThanOrEqual(0.25);
        logSeedStage("overview-analysis-complete", {
          chunkRequests: initialChunkIds.length,
          rejectedVisibleChunks: rejectedVisibleChunkIds.length,
          overviewEvaluatedChunks: overviewLodEvents.length,
          maxOverviewErrorCssPixels: maxOverviewLodErrorAtSupportedZoom,
        });
        if (rejectedVisibleChunkEvents.length > 0) {
          const reasonCounts = rejectedVisibleChunkEvents.flatMap((event) => event.rejectionResources ?? [])
            .reduce<Record<string, number>>((counts, resource) => {
              counts[resource] = (counts[resource] ?? 0) + 1;
              return counts;
            }, {});
          console.log(`[L11_RESOURCE_${sourceId}_${label}_${repeat}] ${JSON.stringify({
            requestedVisibleChunkCount: requestedChunkIds.size,
            rejectedVisibleChunkCount: rejectedVisibleChunkIds.length,
            reasonCounts,
            rejected: rejectedVisibleChunkEvents.slice(0, 20).map((event) => ({
              chunkId: event.chunkId,
              resources: event.rejectionResources,
              cpu: event.cpuResidentBytes,
              rendererCpu: event.rendererCpuResidentBytes,
              retainedRefinement: event.retainedRefinementSourceBytes,
              rendererExtraSource: event.additionalRetainedRendererCpuBytes,
              cpuCandidate: event.candidateCpuBytes,
              geometryCpuBytesAdded: event.geometryCpuBytesAdded,
              incomingUnpackedCpuBytes: event.incomingUnpackedCpuBytes,
              sharedRendererSourceBytes: event.sharedRendererSourceBytes,
              candidateRetainedSourceBytes: event.retainedRefinementSourceBytesIfAccepted,
              releasedUnusedPathDistanceBytes: event.releasedUnusedPathDistanceBytes,
              positionCodecErrorWorld: event.positionCodecErrorWorld,
              positionCodecErrorCssPixels: event.positionCodecErrorCssPixels,
              cpuLimit: event.cpuBudgetBytes,
              gpu: event.gpuBufferBytesEstimate,
              gpuCandidate: event.candidateGpuBufferBytes,
              gpuLimit: event.gpuBudgetBytes,
              vertices: event.chunkVertexCount,
              revision: event.visibleSetRevision,
            })),
          })}`);
        }
        expect(rejectedVisibleChunkIds,
          `${sourceId} ${label} ${repeat} visible chunks must not be skipped by the CPU/GPU admission budget`).toEqual([]);
        if (warning !== null) {
          expect(warning, `${sourceId} ${label} ${repeat} settled viewport must not report a partial drawing`).not.toMatch(/kısmi|parça atlandı/i);
        }

        await expect(canvas).toBeVisible({ timeout: 10_000 });
        logSeedStage("settled-raster-zoom-in-start");
        await withTimeout(
          page.locator('button[title="Yakınlaştır (+)"]').evaluate((button) => (button as HTMLButtonElement).click()),
          15_000,
          "L11 settled-raster zoom-in click",
        );
        logSeedStage("settled-raster-zoom-in-complete");
        const settledRasterReadback = await armCanvasWebGlReadback(page, canvas);
        logSeedStage("settled-raster-readback-armed");
        await withTimeout(
          page.locator('button[title="Uzaklaştır (-)"]').evaluate((button) => (button as HTMLButtonElement).click()),
          15_000,
          "L11 settled-raster zoom-out click",
        );
        logSeedStage("settled-raster-zoom-out-complete");
        const screenshot = await settledRasterReadback();
        const raster = measureRaster(screenshot);
        logSeedStage("settled-raster-captured", { raster });
        expect(raster.foregroundPixelCount, `${sourceId} ${label} ${repeat} settled canvas must contain visible drawing pixels`)
          .toBeGreaterThan(0);
        expect(raster.occupiedCellCount, `${sourceId} ${label} ${repeat} settled canvas must occupy raster cells`).toBeGreaterThan(0);
        expect(raster.hasSubstantiveContent,
          `${sourceId} ${label} ${repeat} settled canvas must pass the calibrated substantive-raster gate`).toBe(true);
        const settledRasterSample = {
          elapsedMs: performance.now() - startedAt,
          raster,
          sha256: sha256(screenshot),
        };
        rasterSamples.push(settledRasterSample);
        const meaningfulPixelThreshold = Math.max(100, Math.ceil(raster.foregroundPixelCount * 0.1));
        const meaningfulCellThreshold = Math.max(2, Math.ceil(raster.occupiedCellCount * 0.1));
        const firstMeaningfulSample = rasterSamples.find((sample) =>
          sample.raster.hasSubstantiveContent &&
          sample.raster.foregroundPixelCount >= meaningfulPixelThreshold &&
          sample.raster.occupiedCellCount >= meaningfulCellThreshold);
        expect(firstMeaningfulSample,
          `${sourceId} ${label} ${repeat} must produce a substantive raster above the calibrated noise floor and >=${meaningfulPixelThreshold} foreground pixels / >=${meaningfulCellThreshold} occupied cells before/at settled`)
          .toBeTruthy();
        run.firstUsefulRasterMs = firstMeaningfulSample!.elapsedMs;
        run.firstUsefulRaster = firstMeaningfulSample!.raster;
        run.firstUsefulCanvasSha256 = firstMeaningfulSample!.sha256;
        run.rasterSamples = rasterSamples.map(({ elapsedMs, raster: sampleRaster, sha256: sampleSha256 }) => ({
          elapsedMs,
          raster: sampleRaster,
          sha256: sampleSha256,
        }));
        if (repeat === 0 || repeat === 1) {
          const sampleName = repeat === 0 ? "seed" : "repeat-1";
          await testInfo.attach(`l11-settled-raster-${sourceId}-${sampleName}-${label}.png`, {
            body: screenshot,
            contentType: "image/png",
          });
        }
        const settledMs = performance.now() - startedAt;

        await page.evaluate(() => {
          const metrics = (window as any).__cadL11;
          metrics.inputToDrawMs.length = 0;
          metrics.inputKinds.length = 0;
          metrics.inputMarkers.length = 0;
          metrics.drawCalls = 0;
          metrics.drawCallsByMethod = {};
          metrics.multiDrawCalls = 0;
        });
        const waitForInputDraw = async (before: number, description: "zoom-in" | "zoom-out", interactionIndex: number) => {
          logSeedStage("interaction-start", { interactionIndex, kind: description });
          await withTimeout(
            page.evaluate(() => { (window as any).__cadL11.measureInteractionDraws = true; }),
            10_000,
            "L11 interaction measurement enable",
          );
          try {
            await withTimeout(page.evaluate(({ kind }) => {
              const metrics = (window as any).__cadL11;
              const title = kind === "zoom-in" ? "Yakınlaştır (+)" : "Uzaklaştır (-)";
              const target = document.querySelector<HTMLButtonElement>(`button[title="${title}"]`);
              if (!target) throw new Error(`L11 cannot find the ${kind} toolbar button.`);
              metrics.inputMarkers.push({ at: window.performance.now(), drawCount: metrics.drawCalls, kind });
              target.click();
            }, { kind: description }), 15_000, `L11 ${description} click evaluation`);
            await expect.poll(() => page.evaluate(() => (window as any).__cadL11.inputToDrawMs.length as number), { timeout: 5_000 })
              .toBe(before + 1);
            const measured = await page.evaluate(() => (window as any).__cadL11.inputToDrawMs.at(-1) as number);
            logSeedStage("interaction-draw-complete", { interactionIndex, kind: description, inputToDrawMs: measured });
          } catch (error) {
            const diagnostics = await page.evaluate(() => {
              const metrics = (window as any).__cadL11;
              const canvas = document.querySelector<HTMLCanvasElement>("#document-studio-shell canvas");
              return {
                metrics: {
                  drawCalls: metrics.drawCalls,
                  multiDrawCalls: metrics.multiDrawCalls,
                  patchedDrawMethods: metrics.patchedDrawMethods,
                  inputMarkers: metrics.inputMarkers,
                  inputToDrawMs: metrics.inputToDrawMs,
                },
                canvas: canvas && { width: canvas.width, height: canvas.height, dataset: { ...canvas.dataset } },
              };
            });
            throw new Error(`${sourceId} ${label} ${repeat} ${description} produced no input-to-draw sample: ${JSON.stringify(diagnostics)}; ${error instanceof Error ? error.message : String(error)}`);
          } finally {
            await withTimeout(
              page.evaluate(() => { (window as any).__cadL11.measureInteractionDraws = false; }),
              10_000,
              "L11 interaction measurement disable",
            );
          }
        };
        for (let index = 0; index < 15; index++) {
          let before = await page.evaluate(() => (window as any).__cadL11.inputToDrawMs.length as number);
          await waitForInputDraw(before, "zoom-in", index * 2);
          before = await page.evaluate(() => (window as any).__cadL11.inputToDrawMs.length as number);
          await waitForInputDraw(before, "zoom-out", index * 2 + 1);
        }
        logSeedStage("input-interactions-complete", { inputDrawSamples: 30 });
        const frameMetrics = await withTimeout(page.evaluate(async () => {
          const metrics = (window as any).__cadL11;
          metrics.measureDrawFrames = true;
          metrics.previousDrawFrameAt = null;
          metrics.frameIntervalsMs.length = 0;
          metrics.frameCallbackDurationsMs.length = 0;
          const surface = document.querySelector('[aria-label="CAD V2 Çizim Etkileşim Alanı"]');
          if (!surface) throw new Error("L11 cannot find the CAD interaction surface.");
          const rect = surface.getBoundingClientRect();
          for (let index = 0; index < 60; index++) {
            surface.dispatchEvent(new WheelEvent("wheel", {
              deltaY: index % 2 === 0 ? 120 : -120,
              clientX: rect.left + rect.width / 2,
              clientY: rect.top + rect.height / 2,
              bubbles: true,
              cancelable: true,
            }));
            await new Promise((resolve) => window.setTimeout(resolve, 8));
          }
          await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
          metrics.measureDrawFrames = false;
          return {
            frameIntervalsMs: [...metrics.frameIntervalsMs] as number[],
            callbackDurationsMs: [...metrics.frameCallbackDurationsMs] as number[],
            inputToDrawMs: [...metrics.inputToDrawMs] as number[],
            longTasksMs: [...metrics.longTasksMs] as number[],
            interactionDrawCalls: metrics.drawCalls as number,
            interactionDrawCallsByMethod: { ...metrics.drawCallsByMethod } as Record<string, number>,
            interactionMultiDrawCalls: metrics.multiDrawCalls as number,
            multiDrawExtensionQueries: metrics.multiDrawExtensionQueries as number,
            viewerMultiDrawExtensionQueries: metrics.viewerMultiDrawExtensionQueries as number,
            viewerMultiDrawExtensionQueriesByContext: { ...metrics.viewerMultiDrawExtensionQueriesByContext } as Record<string, number>,
            viewerMultiDrawExtensionAvailable: metrics.viewerMultiDrawExtensionAvailable as number,
            viewerMultiDrawExtensionMissing: metrics.viewerMultiDrawExtensionMissing as number,
            multiDrawSupportedExtensionListQueries: metrics.multiDrawSupportedExtensionListQueries as number,
            viewerMultiDrawSupportedExtensionListQueries: metrics.viewerMultiDrawSupportedExtensionListQueries as number,
            viewerMultiDrawSupportedExtensionListQueriesByContext: { ...metrics.viewerMultiDrawSupportedExtensionListQueriesByContext } as Record<string, number>,
            viewerMultiDrawExtensionAdvertised: metrics.viewerMultiDrawExtensionAdvertised as number,
            viewerMultiDrawExtensionKeys: [...metrics.viewerMultiDrawExtensionKeys] as string[][],
            multiDrawPropertyReads: [...metrics.multiDrawPropertyReads] as string[],
            multiDrawMethodNames: [...metrics.multiDrawMethodNames] as string[],
            rendererSortModes: [...metrics.rendererSortModes] as Array<{
              sortObjects: boolean;
              depthBufferAvailable: boolean;
              loadedChunkCount: number;
              nonPainterDepthChunkCount: number;
              hasAuxiliaryObjects: boolean;
            }>,
            painterPageDiagnostics: [...metrics.painterPageDiagnostics] as Array<Record<string, unknown>>,
            painterPromotionDiagnostics: [...metrics.painterPromotionDiagnostics] as Array<Record<string, unknown>>,
          };
        }), 30_000, "L11 60-wheel frame-sample evaluation");
        logSeedStage("frame-sample-complete", {
          frameIntervalSamples: frameMetrics.frameIntervalsMs.length,
          inputToDrawSamples: frameMetrics.inputToDrawMs.length,
          drawCalls: frameMetrics.interactionDrawCalls,
        });
        const batchDiagnostics = await page.evaluate(() => (window as any).__cadL11.batchDiagnostics as Array<Record<string, unknown>>);
        const fallbackCounts: Record<string, number> = {};
        for (const diagnostic of batchDiagnostics) {
          for (const reason of (diagnostic.painterDepthFallbackReasons as string[] | undefined) ?? []) {
            fallbackCounts[reason] = (fallbackCounts[reason] ?? 0) + 1;
          }
        }
        console.log(`[L11_RENDER_${sourceId}_${label}_${repeat}] ${JSON.stringify({
          frameIntervalsMs: frameMetrics.frameIntervalsMs,
          drawCallbackP95Ms: percentile(frameMetrics.callbackDurationsMs, 0.95),
          inputToDrawMs: frameMetrics.inputToDrawMs,
          interactionDrawCalls: frameMetrics.interactionDrawCalls,
          interactionDrawCallsByMethod: frameMetrics.interactionDrawCallsByMethod,
          interactionMultiDrawCalls: frameMetrics.interactionMultiDrawCalls,
          multiDrawExtensionQueries: frameMetrics.multiDrawExtensionQueries,
          viewerMultiDrawExtensionQueries: frameMetrics.viewerMultiDrawExtensionQueries,
          viewerMultiDrawExtensionQueriesByContext: frameMetrics.viewerMultiDrawExtensionQueriesByContext,
          viewerMultiDrawExtensionAvailable: frameMetrics.viewerMultiDrawExtensionAvailable,
          viewerMultiDrawExtensionMissing: frameMetrics.viewerMultiDrawExtensionMissing,
          multiDrawSupportedExtensionListQueries: frameMetrics.multiDrawSupportedExtensionListQueries,
          viewerMultiDrawSupportedExtensionListQueries: frameMetrics.viewerMultiDrawSupportedExtensionListQueries,
          viewerMultiDrawSupportedExtensionListQueriesByContext: frameMetrics.viewerMultiDrawSupportedExtensionListQueriesByContext,
          viewerMultiDrawExtensionAdvertised: frameMetrics.viewerMultiDrawExtensionAdvertised,
          viewerMultiDrawExtensionKeys: frameMetrics.viewerMultiDrawExtensionKeys,
          multiDrawPropertyReads: frameMetrics.multiDrawPropertyReads,
          multiDrawMethodNames: frameMetrics.multiDrawMethodNames,
          rendererSortModes: frameMetrics.rendererSortModes,
          longTasksMs: frameMetrics.longTasksMs,
          batchDiagnosticCount: batchDiagnostics.length,
          painterDepthBatchCount: batchDiagnostics.filter((item) => item.painterDepthBatch === true).length,
          painterDepthFallbackCounts: fallbackCounts,
          painterPageDiagnostics: frameMetrics.painterPageDiagnostics,
          painterPromotionDiagnostics: frameMetrics.painterPromotionDiagnostics,
        })}`);
        const maxViewerContextExtensionQueries = Math.max(
          0,
          ...Object.values(frameMetrics.viewerMultiDrawExtensionQueriesByContext),
        );
        expect(maxViewerContextExtensionQueries,
          `${sourceId} ${label} should query WEBGL_multi_draw at most once per WebGL context`)
          .toBeLessThanOrEqual(1);
        const maxViewerContextCapabilityQueries = Math.max(
          0,
          ...Object.values(frameMetrics.viewerMultiDrawSupportedExtensionListQueriesByContext),
        );
        expect(maxViewerContextCapabilityQueries,
          `${sourceId} ${label} should inspect the advertised WEBGL_multi_draw capability at most once per WebGL context`)
          .toBeLessThanOrEqual(1);
        expect(frameMetrics.viewerMultiDrawExtensionAdvertised,
          `${sourceId} ${label} ${repeat} should observe WEBGL_multi_draw in the viewer WebGL context's supported extension list`)
          .toBeGreaterThan(0);
        const hasOnlyPainterDepthBatches = batchDiagnostics.length > 0 &&
          batchDiagnostics.every((item) => item.painterDepthBatch === true);
        if (hasOnlyPainterDepthBatches && !frameMetrics.rendererSortModes.at(-1)?.hasAuxiliaryObjects) {
          const orderingMode = frameMetrics.rendererSortModes.at(-1);
          expect(orderingMode, `${sourceId} ${label} ${repeat} should report the active CAD render ordering mode`).toBeTruthy();
          expect(orderingMode!.depthBufferAvailable,
            `${sourceId} ${label} ${repeat} painter-depth batches require a real WebGL depth buffer`).toBe(true);
          expect(orderingMode!.sortObjects,
            `${sourceId} ${label} ${repeat} may skip O(n log n) object sorting only when all loaded chunks are painter-depth batches`).toBe(false);
          expect(orderingMode!.nonPainterDepthChunkCount,
            `${sourceId} ${label} ${repeat} must have no legacy/fallback chunk before object sorting is skipped`).toBe(0);
        }
        let interactionStableSamples = 0;
        let previousEventCount = -1;
        let finalEvents: ResourceEvent[] = [];
        let interactionSettlePolls = 0;
        const interactionSettleTimeoutMs = positiveIntegerFromEnv(
          "CAD_V2_L11_INTERACTION_SETTLED_TIMEOUT_MS",
          settledHostTimeoutMs,
        );
        const interactionSettleDeadline = Date.now() + interactionSettleTimeoutMs;
        while (Date.now() < interactionSettleDeadline && interactionStableSamples < 5) {
          interactionSettlePolls++;
          const eventCounts = await page.evaluate(() => {
            const events = (window as unknown as { __cadL11: { hostEvents: ResourceEvent[] } }).__cadL11.hostEvents;
            let startedCount = 0;
            let outcomeCount = 0;
            for (const event of events) {
              if (event.type === "chunk-load-start") startedCount++;
              else if (event.type === "chunk-load-outcome") outcomeCount++;
            }
            return { eventCount: events.length, startedCount, outcomeCount };
          });
          if (eventCounts.eventCount === previousEventCount && run.pendingChunkResponses === 0 && eventCounts.startedCount === eventCounts.outcomeCount) interactionStableSamples++;
          else interactionStableSamples = 0;
          previousEventCount = eventCounts.eventCount;
          if (repeat === 0 && interactionSettlePolls % 20 === 0) {
            logSeedStage("interaction-host-settle-poll", {
              stableSamples: interactionStableSamples,
              eventCount: eventCounts.eventCount,
              startedCount: eventCounts.startedCount,
              outcomeCount: eventCounts.outcomeCount,
              pendingChunkResponses: run.pendingChunkResponses,
            });
          }
          await page.waitForTimeout(250);
        }
        if (interactionStableSamples !== 5) {
          const diagnostic = await page.evaluate(() => {
            const events = (window as unknown as { __cadL11: { hostEvents: ResourceEvent[] } }).__cadL11.hostEvents;
            let startedCount = 0;
            let outcomeCount = 0;
            for (const event of events) {
              if (event.type === "chunk-load-start") startedCount++;
              else if (event.type === "chunk-load-outcome") outcomeCount++;
            }
            return {
              eventCount: events.length,
              startedCount,
              outcomeCount,
              pendingHostLoads: Math.max(0, startedCount - outcomeCount),
              recentHostEvents: events.slice(-40),
            };
          });
          const failure = {
            sourceId,
            label,
            repeat,
            interactionSettleTimeoutMs,
            interactionSettlePolls,
            interactionStableSamples,
            pendingChunkResponses: run.pendingChunkResponses,
            failedChunkRequestCount: run.failedChunkRequestCount,
            diagnostic,
          };
          await testInfo.attach(`l11-interaction-settle-timeout-${sourceId}-${label}-${repeat}.json`, {
            body: Buffer.from(JSON.stringify(failure, null, 2)),
            contentType: "application/json",
          });
          throw new Error(`${sourceId} ${label} ${repeat} interaction requests did not reach terminal outcomes: ${JSON.stringify(failure)}`);
        }
        finalEvents = await page.evaluate(() => (window as unknown as { __cadL11: { hostEvents: ResourceEvent[] } }).__cadL11.hostEvents);
        const finalOutcomes = finalEvents.filter((event) => event.type === "chunk-load-outcome");
        const startsByLoadId = new Map(finalEvents
          .filter((event) => event.type === "chunk-load-start" && Number.isSafeInteger(event.loadId) && Number.isFinite(event.recordedAtMs))
          .map((event) => [event.loadId!, event.recordedAtMs!]));
        run.hostPipelineDurationsMs = finalOutcomes.flatMap((event) => {
          const startedAt = typeof event.loadId === "number" ? startsByLoadId.get(event.loadId) : undefined;
          return startedAt !== undefined && Number.isFinite(event.recordedAtMs) && event.recordedAtMs! >= startedAt
            ? [event.recordedAtMs! - startedAt]
            : [];
        });
        const runFrameP95 = percentile(frameMetrics.frameIntervalsMs, 0.95);
        const runInputP95 = percentile(frameMetrics.inputToDrawMs, 0.95);
        if (sourceId === "R002") {
          const instancedDrawCalls = (frameMetrics.interactionDrawCallsByMethod.drawArraysInstanced ?? 0) +
            (frameMetrics.interactionDrawCallsByMethod.drawElementsInstanced ?? 0);
          expect(instancedDrawCalls,
            `${sourceId} ${label} ${repeat} must observe its lineweight-instanced CAD draw path`).toBeGreaterThan(0);
        }
        if (sourceId === "R003") {
          expect(frameMetrics.painterPageDiagnostics.length,
            `${sourceId} ${label} ${repeat} should promote eligible chunks into bounded shared painter pages`).toBeGreaterThan(0);
          expect(frameMetrics.painterPromotionDiagnostics.length,
            `${sourceId} ${label} ${repeat} should explain each painter-page promotion attempt`).toBeGreaterThan(0);
        }
        expect(runFrameP95, `${sourceId} ${label} ${repeat} must produce actual CAD draw-frame intervals`).not.toBeNull();
        expect(runInputP95, `${sourceId} ${label} ${repeat} must produce input-to-WebGL-draw samples`).not.toBeNull();
        expect(finalOutcomes.length, `${sourceId} ${label} ${repeat} must retain terminal host outcomes`).toBeGreaterThan(0);
        expect(state.rendererIssues.slice(rendererIssueStart),
          `${sourceId} ${label} ${repeat} must not emit shader, NaN-bound, or renderer-frame errors`).toEqual([]);

        const resident = outcomes.filter((event) => event.status === "accepted");
        for (const event of resident) {
          if (Number.isFinite(event.cpuResidentBytes) && Number.isFinite(event.cpuBudgetBytes)) {
            expect(event.cpuResidentBytes).toBeLessThanOrEqual(event.cpuBudgetBytes!);
          }
          if (Number.isFinite(event.gpuBufferBytesEstimate) && Number.isFinite(event.gpuBudgetBytes)) {
            expect(event.gpuBufferBytesEstimate).toBeLessThanOrEqual(event.gpuBudgetBytes!);
          }
        }
        logSeedStage("sample-complete", {
          settledMs: Math.round(settledMs),
          firstUsefulRasterMs: Math.round(run.firstUsefulRasterMs!),
          frameP95Ms: runFrameP95,
          inputP95Ms: runInputP95,
          acceptedChunks: resident.length,
          rejectedChunks: outcomes.filter((event) => event.status === "rejected").length,
        });
        state.activeRun = null;
        return {
          label,
          repeat,
          sceneId: run.sceneId!,
          settledMs,
          firstNonemptyRasterMs: run.firstNonemptyRasterMs!,
          firstNonemptyRaster: run.firstNonemptyRaster!,
          firstUsefulRasterMs: run.firstUsefulRasterMs!,
          firstUsefulRaster: run.firstUsefulRaster!,
          firstUsefulCanvasSha256: run.firstUsefulCanvasSha256!,
          rasterSamples: run.rasterSamples!,
          firstWebglDrawMs: run.firstWebglDrawMs ?? null,
          initialChunkRequestCount: initialChunkIds.length,
          prepareApi: {
            status: run.prepareResponseStatus ?? null,
            jobStatus: run.prepareJobStatus ?? null,
            wallMs: run.prepareDurationsMs[0] ?? null,
          },
          chunkRequests: {
            sampleCount: run.chunkFetchDurationsMs.length,
            uniqueChunkCount: new Set(initialChunkIds).size,
            totalMs: run.chunkFetchDurationsMs.reduce((total, duration) => total + duration, 0),
            p50Ms: percentile(run.chunkFetchDurationsMs, 0.5),
            p95Ms: percentile(run.chunkFetchDurationsMs, 0.95),
            encodedResponseBodyBytes: run.chunkResponseBytes.reduce((total, byteLength) => total + byteLength, 0),
            responseBodyBytes: [...run.chunkResponseBytes],
          },
          hostLoadPipeline: {
            sampleCount: run.hostPipelineDurationsMs.length,
            p50Ms: percentile(run.hostPipelineDurationsMs, 0.5),
            p95Ms: percentile(run.hostPipelineDurationsMs, 0.95),
          },
          fetchedChunkSetSha256: sha256(Array.from(new Set(initialChunkIds)).sort().join("\n")),
          hostLoadCount: starts.length,
          terminalOutcomeCount: outcomes.length,
          acceptedChunks: resident.length,
          rejectedChunks: outcomes.filter((event) => event.status === "rejected").length,
          warning,
          settledRaster: raster,
          canvasSha256: sha256(screenshot),
          interactionFrameIntervalSampleCount: frameMetrics.frameIntervalsMs.length,
          interactionFrameIntervalP95Ms: runFrameP95,
          interactionFrameIntervalMaxMs: frameMetrics.frameIntervalsMs.length ? Math.max(...frameMetrics.frameIntervalsMs) : null,
          interactionInputToDrawSampleCount: frameMetrics.inputToDrawMs.length,
          interactionInputToDrawP95Ms: runInputP95,
          interactionInputToDrawMaxMs: frameMetrics.inputToDrawMs.length ? Math.max(...frameMetrics.inputToDrawMs) : null,
          interactionDrawCalls: frameMetrics.interactionDrawCalls,
          interactionMultiDrawCalls: frameMetrics.interactionMultiDrawCalls,
          painterPageDiagnostics: frameMetrics.painterPageDiagnostics,
          painterPromotionDiagnostics: frameMetrics.painterPromotionDiagnostics,
          frameIntervalsMs: frameMetrics.frameIntervalsMs,
          inputToDrawMs: frameMetrics.inputToDrawMs,
          drawCallbackP95Ms: percentile(frameMetrics.callbackDurationsMs, 0.95),
          longTaskCount: frameMetrics.longTasksMs.length,
          maxLongTaskMs: frameMetrics.longTasksMs.length ? Math.max(...frameMetrics.longTasksMs) : 0,
          peakAcceptedCpuEstimateBytes: Math.max(0, ...resident.map((event) => event.cpuResidentBytes ?? 0)),
          peakAcceptedGpuEstimateBytes: Math.max(0, ...resident.map((event) => event.gpuBufferBytesEstimate ?? 0)),
          cpuBudgetBytes: resident.find((event) => Number.isFinite(event.cpuBudgetBytes))?.cpuBudgetBytes ?? null,
          gpuBudgetBytes: resident.find((event) => Number.isFinite(event.gpuBudgetBytes))?.gpuBudgetBytes ?? null,
          maxAdmissionPositionCodecErrorWorld: Math.max(0, ...resident.map((event) => event.positionCodecErrorWorld ?? 0)),
          maxAdmissionPositionCodecErrorCssPixels: Math.max(0, ...resident.map((event) => event.positionCodecErrorCssPixels ?? 0)),
        };
      };

      type BrowserSample = Awaited<ReturnType<typeof sampleOpen>>;
      const coldRuns: BrowserSample[] = [];
      const warmRuns: BrowserSample[] = [];
      const seedContext = await browser.newContext({
        baseURL: browserBaseURL,
        viewport: { width: 1440, height: 900 },
        deviceScaleFactor: 1,
      });
      const seedPage = await seedContext.newPage();
      const seedState: BrowserPairState = {
        activeRun: null,
        requestByObject: new WeakMap<object, { run: BrowserRun; kind: "chunk" | "prepare"; startedAt: number }>(),
        diagnosticByRequest: new WeakMap<object, BrowserRun["apiCallDiagnostics"][number]>(),
        runStartedAtMs: null,
        rendererIssues: [],
        browserErrors: [],
        sceneId: null,
      };
      let seed: BrowserSample;
      let manifest: {
        sceneId: string;
        sourceSha256: string;
        qualityStatus: string;
        compilerRevision?: string;
        chunks: Array<{ chunkId: string; byteLength?: number; sha256?: string }>;
        indexPages?: Array<{
          indexId: string;
          byteLength: number;
          sha256: string;
          layoutIds: string[];
          chunkIds?: string[];
          chunks?: Array<{ chunkId: string; byteLength?: number; sha256?: string }>;
        }>;
        metadataPages?: unknown[];
      };
      let manifestChunkCount = 0;
      let manifestChunkByteLength = 0;
      try {
        await installMetrics(seedPage);
        seedPage.on("console", (message) => {
          const text = message.text();
          if (message.type() === "error" && seedState.browserErrors.length < 40 && !seedState.browserErrors.includes(text)) seedState.browserErrors.push(text.slice(0, 1_000));
          if (rendererIssuePattern.test(text) && !seedState.rendererIssues.includes(text)) seedState.rendererIssues.push(text.slice(0, 1_000));
          if (text.startsWith("[CadV2Host]")) seedState.activeRun?.hostLifecycleMessages.push(text.slice(0, 1_000));
        });
        seedPage.on("response", (response) => {
          if (response.status() < 400 || seedState.browserErrors.length >= 40) return;
          const failure = `HTTP ${response.status()} ${response.request().method()} ${response.url()}`;
          if (!seedState.browserErrors.includes(failure)) seedState.browserErrors.push(failure.slice(0, 1_000));
        });
        seedPage.on("pageerror", (error) => {
          if (seedState.browserErrors.length < 40 && !seedState.browserErrors.includes(error.message)) seedState.browserErrors.push(error.message.slice(0, 1_000));
          if (rendererIssuePattern.test(error.message) && !seedState.rendererIssues.includes(error.message)) seedState.rendererIssues.push(error.message.slice(0, 1_000));
        });
        attachRequestMetrics(seedPage, seedState);
        await signInAdmin(seedPage);
        await seedPage.setViewportSize({ width: 1440, height: 900 });
        seed = await sampleOpen(seedPage, seedState, "cold", false, 0);
        expect(seed.sceneId, `${sourceId} seed must publish an actual scene`).toBeTruthy();
        manifest = await seedPage.evaluate(async (sceneId) => {
          const response = await fetch(`/api/dokumantasyon/cad-v2/scenes/${encodeURIComponent(sceneId)}/manifest`, {
            cache: "no-store",
          });
          if (!response.ok) throw new Error(`Actual scene manifest request returned ${response.status}.`);
          return await response.json() as {
            sceneId: string;
            sourceSha256: string;
            qualityStatus: string;
            compilerRevision?: string;
            chunks: Array<{ chunkId: string; byteLength?: number; sha256?: string }>;
            indexPages?: Array<{
              indexId: string;
              byteLength: number;
              sha256: string;
              layoutIds: string[];
              chunkIds?: string[];
              chunks?: Array<{ chunkId: string; byteLength?: number; sha256?: string }>;
            }>;
            metadataPages?: unknown[];
          };
        }, seed.sceneId!);
        expect(manifest.sceneId, `${sourceId} manifest must match the prepared scene`).toBe(seed.sceneId);
        expect(manifest.sourceSha256, `${sourceId} manifest must identify the checked source bytes`).toBe(sourceSha256);
        const inlineChunkIds = manifest.chunks.map((chunk) => chunk.chunkId);
        const indexCoverage = await seedPage.evaluate(async ({ sceneId, indexPages }) => {
          const loadedChunks: Array<{ chunkId?: string; byteLength?: number }> = [];
          let loadedIndexPageCount = 0;
          const pages = indexPages ?? [];
          for (let offset = 0; offset < pages.length; offset += 4) {
            const batch = pages.slice(offset, offset + 4);
            const loaded = await Promise.all(batch.map(async (reference) => {
              const response = await fetch(
                `/api/dokumantasyon/cad-v2/scenes/${encodeURIComponent(sceneId)}/indexes/${encodeURIComponent(reference.indexId)}`,
                { cache: "no-store" },
              );
              if (!response.ok) throw new Error(`Scene index ${reference.indexId} returned HTTP ${response.status}.`);
              const bytes = new Uint8Array(await response.arrayBuffer());
              if (bytes.byteLength !== reference.byteLength) {
                throw new Error(`Scene index ${reference.indexId} byte length ${bytes.byteLength} did not match ${reference.byteLength}.`);
              }
              const digest = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", bytes)))
                .map((value) => value.toString(16).padStart(2, "0")).join("");
              if (digest !== reference.sha256.toLowerCase()) {
                throw new Error(`Scene index ${reference.indexId} SHA-256 did not match its immutable manifest reference.`);
              }
              const page = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)) as {
                indexId?: string;
                layoutIds?: string[];
                chunks?: Array<{ chunkId?: string }>;
              };
              if (page.indexId !== reference.indexId || !Array.isArray(page.layoutIds) || !Array.isArray(page.chunks)) {
                throw new Error(`Scene index ${reference.indexId} payload shape did not match its immutable reference.`);
              }
              const expectedChunkIds = reference.chunkIds ?? reference.chunks?.map((chunk) => chunk.chunkId) ?? [];
              const actualChunkIds = page.chunks.map((chunk) => chunk.chunkId);
              if (actualChunkIds.length !== expectedChunkIds.length ||
                  actualChunkIds.some((chunkId, index) => chunkId !== expectedChunkIds[index])) {
                throw new Error(`Scene index ${reference.indexId} chunk allow-list did not match its immutable reference.`);
              }
              if (page.layoutIds.length !== reference.layoutIds.length ||
                  page.layoutIds.some((layoutId, index) => layoutId !== reference.layoutIds[index])) {
                throw new Error(`Scene index ${reference.indexId} layout allow-list did not match its immutable reference.`);
              }
              return { indexId: reference.indexId, chunks: page.chunks };
            }));
            loadedIndexPageCount += loaded.length;
            loadedChunks.push(...loaded.flatMap((page) => page.chunks));
          }
          return {
            indexPageCount: loadedIndexPageCount,
            chunks: loadedChunks,
            chunkIds: loadedChunks.map((chunk) => chunk.chunkId).filter((chunkId): chunkId is string => typeof chunkId === "string"),
            chunkByteLength: loadedChunks.reduce((total, chunk) => total + (chunk.byteLength ?? 0), 0),
          };
        }, { sceneId: manifest.sceneId, indexPages: manifest.indexPages });
        const indexedChunkIds = indexCoverage.chunkIds;
        const authoritativeChunkIds = indexedChunkIds.length > 0 ? indexedChunkIds : inlineChunkIds;
        expect(indexCoverage.indexPageCount, `${sourceId} every advertised immutable index page must be retrievable`)
          .toBe(manifest.indexPages?.length ?? 0);
        expect(authoritativeChunkIds.length,
          `${sourceId} persisted manifest must provide chunk refs inline or through immutable index pages`).toBeGreaterThan(0);
        expect(new Set(authoritativeChunkIds).size,
          `${sourceId} persisted chunk refs must be unique across immutable index pages`).toBe(authoritativeChunkIds.length);
        if (inlineChunkIds.length > 0 && indexedChunkIds.length > 0) {
          expect(new Set(indexedChunkIds), `${sourceId} inline and indexed chunk sets must agree`)
            .toEqual(new Set(inlineChunkIds));
        }
        manifestChunkCount = authoritativeChunkIds.length;
        manifestChunkByteLength = indexCoverage.chunkByteLength ||
          manifest.chunks.reduce((total, chunk) => total + (chunk.byteLength ?? 0), 0);
      } finally {
        seedState.activeRun = null;
        await seedContext.close();
      }
      console.log(`[L11_${sourceId}_SEED] ${JSON.stringify({
        prepareApi: seed.prepareApi,
        firstUsefulRasterMs: seed.firstUsefulRasterMs,
        sceneId: manifest.sceneId,
        sourceSha256: manifest.sourceSha256,
        qualityStatus: manifest.qualityStatus,
        chunkCount: manifestChunkCount,
        inlineChunkCount: manifest.chunks.length,
        indexPageCount: manifest.indexPages?.length ?? 0,
        totalChunkBytes: manifestChunkByteLength,
      })}`);

      for (let repeat = 1; repeat <= repeatCount; repeat++) {
        const context = await browser.newContext({
          baseURL: browserBaseURL,
          viewport: { width: 1440, height: 900 },
          deviceScaleFactor: 1,
        });
        const runPage = await context.newPage();
        let contextCloseRequestedByTest = false;
        context.on("close", () => {
          console.error(`[L11_CONTEXT_CLOSED_${sourceId}] ${JSON.stringify({ repeat, requestedByTest: contextCloseRequestedByTest, browserConnected: browser.isConnected() })}`);
        });
        runPage.on("close", () => {
          console.error(`[L11_PAGE_CLOSED_${sourceId}] ${JSON.stringify({ repeat, requestedByTest: contextCloseRequestedByTest, browserConnected: browser.isConnected() })}`);
        });
        runPage.on("crash", () => {
          console.error(`[L11_PAGE_CRASHED_${sourceId}] ${JSON.stringify({ repeat, browserConnected: browser.isConnected() })}`);
        });
        const pairState: BrowserPairState = {
          activeRun: null,
          requestByObject: new WeakMap<object, { run: BrowserRun; kind: "chunk" | "prepare"; startedAt: number }>(),
          diagnosticByRequest: new WeakMap<object, BrowserRun["apiCallDiagnostics"][number]>(),
          runStartedAtMs: null,
          rendererIssues: [],
          browserErrors: [],
          sceneId: null,
        };
        try {
          await installMetrics(runPage);
          runPage.on("console", (message) => {
            const text = message.text();
            if (message.type() === "error" && pairState.browserErrors.length < 40 && !pairState.browserErrors.includes(text)) pairState.browserErrors.push(text.slice(0, 1_000));
            if (rendererIssuePattern.test(text) && !pairState.rendererIssues.includes(text)) pairState.rendererIssues.push(text.slice(0, 1_000));
            if (text.startsWith("[CadV2Host]")) pairState.activeRun?.hostLifecycleMessages.push(text.slice(0, 1_000));
          });
          runPage.on("response", (response) => {
          if (response.status() < 400 || pairState.browserErrors.length >= 40) return;
          const failure = `HTTP ${response.status()} ${response.request().method()} ${response.url()}`;
          if (!pairState.browserErrors.includes(failure)) pairState.browserErrors.push(failure.slice(0, 1_000));
        });
        runPage.on("pageerror", (error) => {
            if (pairState.browserErrors.length < 40 && !pairState.browserErrors.includes(error.message)) pairState.browserErrors.push(error.message.slice(0, 1_000));
            if (rendererIssuePattern.test(error.message) && !pairState.rendererIssues.includes(error.message)) pairState.rendererIssues.push(error.message.slice(0, 1_000));
          });
          attachRequestMetrics(runPage, pairState);
          await signInAdmin(runPage);
          await runPage.setViewportSize({ width: 1440, height: 900 });
          coldRuns.push(await sampleOpen(runPage, pairState, "cold", false, repeat));
          warmRuns.push(await sampleOpen(runPage, pairState, "warm", true, repeat));
        } finally {
          pairState.activeRun = null;
          contextCloseRequestedByTest = true;
          await context.close();
        }
        if (repeat % 5 === 0) console.log(`[L11_${sourceId}] completed ${repeat}/${repeatCount} cold + ${repeat}/${repeatCount} warm.`);
      }
      const summarize = (runs: typeof coldRuns) => {
        const settled = runs.map((run) => run.settledMs);
        const frame = runs.map((run) => run.interactionFrameIntervalP95Ms!);
        const input = runs.map((run) => run.interactionInputToDrawP95Ms!);
        const pooledFrameValues = runs.flatMap((run) => run.frameIntervalsMs);
        const pooledInputValues = runs.flatMap((run) => run.inputToDrawMs);
        const firstNonemptyRasterValues = runs.map((run) => run.firstNonemptyRasterMs);
        const firstRasterValues = runs.map((run) => run.firstUsefulRasterMs);
        const firstWebglDrawValues = runs.flatMap((run) => run.firstWebglDrawMs === null ? [] : [run.firstWebglDrawMs]);
        const prepareValues = runs.flatMap((run) => run.prepareApi.wallMs === null ? [] : [run.prepareApi.wallMs]);
        const chunkFetchValues = runs.flatMap((run) => run.chunkRequests.p95Ms === null ? [] : [run.chunkRequests.p95Ms]);
        const hostLoadValues = runs.flatMap((run) => run.hostLoadPipeline.p95Ms === null ? [] : [run.hostLoadPipeline.p95Ms]);
        return {
          count: runs.length,
          firstNonemptyCanvasRasterRepeats: runs.filter((run) => run.firstNonemptyRaster.foregroundPixelCount > 0 && run.firstNonemptyRaster.occupiedCellCount > 0).length,
          firstNonemptyCanvasRasterMs: { p50: percentile(firstNonemptyRasterValues, 0.5), p95: percentile(firstNonemptyRasterValues, 0.95), max: Math.max(...firstNonemptyRasterValues) },
          firstUsefulCanvasRasterRepeats: runs.filter((run) => run.firstUsefulRaster.foregroundPixelCount >= 100 && run.firstUsefulRaster.occupiedCellCount >= 2).length,
          firstUsefulCanvasRasterMs: { p50: percentile(firstRasterValues, 0.5), p95: percentile(firstRasterValues, 0.95), max: Math.max(...firstRasterValues) },
          firstWebglDrawMs: { sampleCount: firstWebglDrawValues.length, p50: percentile(firstWebglDrawValues, 0.5), p95: percentile(firstWebglDrawValues, 0.95), max: firstWebglDrawValues.length ? Math.max(...firstWebglDrawValues) : null },
          prepareApiWallMs: { sampleCount: prepareValues.length, p50: percentile(prepareValues, 0.5), p95: percentile(prepareValues, 0.95), max: prepareValues.length ? Math.max(...prepareValues) : null },
          chunkFetchP95Ms: { sampleCount: chunkFetchValues.length, p50: percentile(chunkFetchValues, 0.5), p95: percentile(chunkFetchValues, 0.95), max: chunkFetchValues.length ? Math.max(...chunkFetchValues) : null },
          hostLoadPipelineP95Ms: { sampleCount: hostLoadValues.length, p50: percentile(hostLoadValues, 0.5), p95: percentile(hostLoadValues, 0.95), max: hostLoadValues.length ? Math.max(...hostLoadValues) : null },
          settledP50Ms: percentile(settled, 0.5),
          settledP95Ms: percentile(settled, 0.95),
          settledMaxMs: Math.max(...settled),
          settledNonemptyRasterRepeats: runs.filter((run) => run.settledRaster.foregroundPixelCount > 0).length,
          perRunFrameP95Ms: { p50: percentile(frame, 0.5), p95: percentile(frame, 0.95), max: Math.max(...frame), runsAbove20Ms: frame.filter((value) => value > 20).length },
          perRunInputToDrawP95Ms: { p50: percentile(input, 0.5), p95: percentile(input, 0.95), max: Math.max(...input), runsAbove100Ms: input.filter((value) => value > 100).length },
          pooledFrameIntervals: {
            sampleCount: pooledFrameValues.length,
            p50: percentile(pooledFrameValues, 0.5),
            p95: percentile(pooledFrameValues, 0.95),
            max: pooledFrameValues.length ? Math.max(...pooledFrameValues) : null,
          },
          pooledInputToDraw: {
            sampleCount: pooledInputValues.length,
            p50: percentile(pooledInputValues, 0.5),
            p95: percentile(pooledInputValues, 0.95),
            max: pooledInputValues.length ? Math.max(...pooledInputValues) : null,
          },
          fetchedSetRepeatable: new Set(runs.map((run) => run.fetchedChunkSetSha256)).size === 1,
          settledCanvasRepeatable: new Set(runs.map((run) => run.canvasSha256)).size === 1,
          runResults: runs,
        };
      };
      const cold = summarize(coldRuns);
      const warm = summarize(warmRuns);
      const executionMode = process.env.CAD_V2_L11_RUN_MODE ?? "production-release";
      const performanceResult = cold.count === repeatCount && warm.count === repeatCount &&
        cold.perRunFrameP95Ms.runsAbove20Ms === 0 && warm.perRunFrameP95Ms.runsAbove20Ms === 0 &&
        cold.perRunInputToDrawP95Ms.runsAbove100Ms === 0 && warm.perRunInputToDrawP95Ms.runsAbove100Ms === 0 &&
        cold.fetchedSetRepeatable && warm.fetchedSetRepeatable && cold.settledCanvasRepeatable && warm.settledCanvasRepeatable &&
        cold.settledNonemptyRasterRepeats === repeatCount && warm.settledNonemptyRasterRepeats === repeatCount &&
        cold.firstUsefulCanvasRasterRepeats === repeatCount && warm.firstUsefulCanvasRasterRepeats === repeatCount
        ? "PASS" : "FAIL";
      const diagnosticComplete = cold.count === repeatCount && warm.count === repeatCount &&
        cold.fetchedSetRepeatable && warm.fetchedSetRepeatable &&
        cold.settledCanvasRepeatable && warm.settledCanvasRepeatable &&
        cold.settledNonemptyRasterRepeats === repeatCount && warm.settledNonemptyRasterRepeats === repeatCount &&
        cold.firstUsefulCanvasRasterRepeats === repeatCount && warm.firstUsefulCanvasRasterRepeats === repeatCount;
      const result = executionMode === "production-diagnostic"
        ? diagnosticComplete ? "DIAGNOSTIC_COMPLETE" : "DIAGNOSTIC_INCOMPLETE"
        : performanceResult;
      const report = {
        executionMode,
        performanceResult,
        acceptedAsProductionRelease: acceptsL11ProductionRelease({ executionMode, performanceResult, qualityStatus: manifest.qualityStatus }),
        sourceId,
        sourcePath: source.path,
        sourceBytes,
        sourceSha256,
        sourceUploadMs,
        sourceUploadMode: preuploadedFileId ? "preuploaded-isolated-fixture" : "fresh-upload",
        compilerRevision: CAD_V2_COMPILER_REVISION,
        seed,
        scene: {
          sceneId: manifest.sceneId,
          sourceSha256: manifest.sourceSha256,
          manifestChunkCount,
          manifestChunkByteLength,
          indexPageCount: manifest.indexPages?.length ?? null,
          metadataPageCount: manifest.metadataPages?.length ?? null,
          qualityStatus: manifest.qualityStatus,
        },
        fixtureMode: preuploadedFileId
          ? "A real source file, metadata row, manifest, and immutable scene generation were preloaded into fresh isolated local Document Studio and CAD storage. The seed calls the actual prepare API against that existing READY scene and is reported separately; it does not compile or publish. Each measured pair uses a fresh browser context, clears Chrome's HTTP cache before cold full navigation, then reloads the same page/context for warm. Playwright request routing is absent. CAD API endpoints send no-store responses, so warm browser caching primarily applies to static app assets; the scene store and Next process stay warm after the seed. Raster capture reads WebGL2 RGBA immediately after an actual renderer draw, so DOM/portal overlays are outside the captured buffer; a synthetic full-screen overlay probe checks this boundary. First-raster polling is checked every 250 ms while waiting for substantive content. After host requests settle, a zoom-in/zoom-out pair schedules a final renderer frame for the settled raster."
          : "Real source uploaded into isolated local Document Studio storage; first seed uses the actual local prepare API and durable scene directory to compile/publish once. The seed is reported separately. Each measured pair uses a fresh browser context, clears Chrome's HTTP cache before cold full navigation, then reloads the same page/context for warm. Playwright request routing is absent. CAD API endpoints send no-store responses, so warm browser caching primarily applies to static app assets; the scene store and Next process stay warm after the seed. Raster capture reads WebGL2 RGBA immediately after an actual renderer draw, so DOM/portal overlays are outside the captured buffer; a synthetic full-screen overlay probe checks this boundary. First-raster polling is checked every 250 ms while waiting for substantive content. After host requests settle, a zoom-in/zoom-out pair schedules a final renderer frame for the settled raster.",
        repeatCountPerCondition: repeatCount,
        conditions: { coldHostOpen: cold, warmHostReopen: warm },
        result,
        limits: preuploadedFileId
          ? `The source and its scene were compiled/published before this browser run (scene compiler=${manifest.compilerRevision ?? "not recorded"}); seed and measured prepare calls resolve the existing READY scene, so this report has no cold decode/compile/publish measure. The seed is excluded from the measured cold/warm browser samples; the service and Next process remain warm. Cold clears Chromium's HTTP cache before navigation; CAD API responses are private/no-store, so warm reload mainly reuses static app assets. First nonempty and first meaningful raster values are sampled upper bounds near renderer draw callbacks, not OS compositor-present timestamps; WebGL readback and PNG encoding overhead remain included in navigation timing and are not isolated. The meaningful-raster threshold is relative to each run's settled canvas and is not a semantic geometry/native-reference fidelity check. Request/API and host load spans are not isolated renderer CPU phases. GPU buffer bytes are estimates, not VRAM; sampled process values are not continuous OS peak. Diagnostic runs cannot be accepted as production release. This browser condition does not establish mobile or native AutoCAD parity.`
          : "The seed includes the first actual prepare/compile/publish and is excluded from the measured cold/warm samples; phase-level decode/compile/publish timing is not independently instrumented. The measured service and Next process remain warm after the seed. Cold clears Chromium's HTTP cache before navigation; CAD API responses are private/no-store, so warm reload mainly reuses static app assets. First nonempty and first meaningful raster values are sampled upper bounds near renderer draw callbacks, not OS compositor-present timestamps; WebGL readback and PNG encoding overhead remain included in navigation timing and are not isolated. The meaningful-raster threshold is relative to each run's settled canvas and is not a semantic geometry/native-reference fidelity check. Request/API and host load spans are not isolated renderer CPU phases. GPU buffer bytes are estimates, not VRAM; sampled process values are not continuous OS peak. Diagnostic runs cannot be accepted as production release. This browser condition does not establish mobile or native AutoCAD parity.",
      };
      const reportDirectory = path.resolve(process.env.CAD_V2_L11_REPORT_DIR ?? ".test-data/l11-hardware");
      mkdirSync(reportDirectory, { recursive: true });
      const reportPath = path.join(reportDirectory, `browser-release-${sourceId.toLowerCase()}-${new Date().toISOString().replace(/[:.]/g, "-")}.json`);
      writeFileSync(reportPath, JSON.stringify(report, null, 2), "utf8");
      console.log(`[L11_${sourceId}_RELEASE_REPORT] ${reportPath}`);
      console.log(`[L11_${sourceId}_RELEASE_SUMMARY] ${JSON.stringify({ result: report.result, executionMode, acceptedAsProductionRelease: report.acceptedAsProductionRelease, cold: { settledP95Ms: cold.settledP95Ms, firstRasterP95Ms: cold.firstUsefulCanvasRasterMs.p95, frame: cold.perRunFrameP95Ms, input: cold.perRunInputToDrawP95Ms }, warm: { settledP95Ms: warm.settledP95Ms, firstRasterP95Ms: warm.firstUsefulCanvasRasterMs.p95, frame: warm.perRunFrameP95Ms, input: warm.perRunInputToDrawP95Ms }, scene: report.scene })}`);
      if (executionMode === "production-diagnostic") {
        expect(report.result, `${sourceId} production diagnostic must complete actual cold/warm raster samples`).toBe("DIAGNOSTIC_COMPLETE");
        expect(report.acceptedAsProductionRelease, `${sourceId} diagnostic samples cannot satisfy the production release gate`).toBe(false);
      } else {
        expect(report.result, `${sourceId} L11 cold/warm release conditions must meet every per-run threshold and repeatability gate`).toBe("PASS");
        expect(report.acceptedAsProductionRelease,
          `${sourceId} is not releasable unless the production mode and scene quality gates both pass (quality=${manifest.qualityStatus})`,
        ).toBe(true);
      }
    } finally {
      await cleanupUploadedCadFixtures(fixturePage);
      if (fileId === null) console.log(`[L11_${sourceId}] no uploaded document fixture required cleanup.`);
    }
  });
});
