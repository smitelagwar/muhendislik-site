"use client";

import type {
  AcApDocManager,
  AcApOpenDatabaseOptions,
  AcApLayerStore,
} from "@mlightcad/cad-simple-viewer";

import {
  CAD_DISTANCE_SNAP_TOLERANCE_PX,
  CadPressHoldDistanceController,
  type CadDistanceMeasurementCallbacks,
  type CadDistanceResolvedPoint,
} from "./distance-measurement";
import { CadMobileGestureGuard } from "./mobile-gesture-guard";
import { buildCadSnapPrimitives, buildCadTextSearchCatalog } from "./snap-catalog";
import {
  CadTextSearchIndex,
  type CadTextEntityInfo,
  type CadTextSearchQuery,
  type CadTextSearchResult,
} from "./text-search";
export type {
  CadTextEntityInfo,
  CadTextSearchQuery,
  CadTextSearchResult,
};
import {
  CadSnapEngine,
  type CadSnapMode,
  type CadSnapPoint,
  type CadSnapPrimitive,
} from "./snap-engine";


export type {
  CadDistanceMeasurementCallbacks,
  CadDistanceMeasurementResult,
  CadDistanceMeasurementSnapshot,
} from "./distance-measurement";
import {
  CadAreaMeasurementController,
  type CadAreaMeasurementCallbacks,
} from "./area-measurement";
export type {
  CadAreaMeasurementCallbacks,
  CadAreaMeasurementResult,
  CadAreaMeasurementSnapshot,
} from "./area-measurement";
import {
  CadChainDistanceController,
  type CadChainDistanceCallbacks,
} from "./chain-distance";
export type {
  CadChainDistanceCallbacks,
  CadChainDistanceResult,
  CadChainDistanceSnapshot,
} from "./chain-distance";
import type { CadRenderReadinessSnapshot } from "./readiness";
export type { CadRenderReadinessSnapshot, CadResilienceState } from "./readiness";

export const CAD_UPSTREAM_WORKER_URLS = {

  mtextRender: "/cad-upstream/mtext-renderer-worker.js",
  dwgParser: "/cad-upstream/libredwg-parser-worker.js",
} as const;

export const CAD_UPSTREAM_SUPPORTED_EXTENSIONS = new Set([".dxf", ".dwg"]);
const CAD_UPSTREAM_BLANK_VALIDATION_IDLE_MS = 2_500;

const CAD_MOBILE_PINCH_ZOOM_SPEED = 1;

type CadMeasurementCommand = "distance" | "chain_distance" | "area";


type CadLayoutViewLike = {
  enabled: boolean;
  screenToWorld: (point: CadSnapPoint) => { x: number; y: number };
  worldToScreen: (point: CadSnapPoint) => { x: number; y: number };
  _cameraControls?: {
    zoomSpeed: number;
    zoomToCursor: boolean;
  };
  events?: {
    viewChanged?: {
      addEventListener: (listener: () => void) => void;
      removeEventListener: (listener: () => void) => void;
    };
  };
};

export type CadUpstreamTheme = "light" | "dark";
export type CadUpstreamDisplayMode = "source" | "monochrome";

export type CadBackgroundColorOption = "autocad" | "black" | "white";

export const CAD_BACKGROUND_COLORS: Record<
  CadBackgroundColorOption,
  { hex: string; numeric: number; label: string }
> = {
  autocad: { hex: "#212830", numeric: 0x212830, label: "AutoCAD" },
  black: { hex: "#000000", numeric: 0x000000, label: "Siyah" },
  white: { hex: "#ffffff", numeric: 0xffffff, label: "Beyaz" },
};

export interface CadLayerItem {
  name: string;
  color: string;
  isOn: boolean;
  isFrozen: boolean;
  isLocked: boolean;
  isCurrent: boolean;
  visible: boolean;
}

export type CadLoadingPhase =
  | "init"
  | "verify-workers"
  | "fetch-source"
  | "parse-convert"
  | "build-scene"
  | "render-ready"
  | "ready"
  | "error";

export type CadUpstreamErrorCode =
  | "unsupported-extension"
  | "worker-unavailable"
  | "source-fetch-failed"
  | "source-empty"
  | "open-timeout"
  | "open-failed"
  | "blank-document"
  | "adapter-destroyed"
  | "corrupt-truncated"
  | "network-error";

export class CadUpstreamAdapterError extends Error {
  constructor(
    public readonly code: CadUpstreamErrorCode,
    message: string,
    options?: ErrorOptions
  ) {
    super(message, options);
    this.name = "CadUpstreamAdapterError";
  }
}

export interface CadUpstreamCreateOptions {
  container: HTMLElement;
  busyIndicatorHost?: HTMLElement;
  theme?: CadUpstreamTheme;
  useMainThreadDraw?: boolean;
}

export interface CadUpstreamOpenOptions {
  accessUrl: string;
  displayName: string;
  extension: string;
  signal?: AbortSignal;
  databaseOptions?: Omit<AcApOpenDatabaseOptions, "mode">;
  onPhase?: (phase: CadLoadingPhase, phaseText: string) => void;
}

type CadSimpleViewerModule = typeof import("@mlightcad/cad-simple-viewer");
type CadBundledRuntimeModule = {
  Viewer: CadSimpleViewerModule;
  dataModel: typeof import("@mlightcad/data-model");
  mtextRenderer: typeof import("@mlightcad/mtext-renderer");
  threeRenderer: typeof import("@mlightcad/three-renderer");
  loadLibreDwg: () => Promise<typeof import("@mlightcad/libredwg-converter")>;
};

const CAD_UPSTREAM_RUNTIME_URL = "/cad-upstream/mlightcad-runtime.js";
let runtimeModulePromise: Promise<CadBundledRuntimeModule> | null = null;
let viewerModulePromise: Promise<CadSimpleViewerModule> | null = null;
let libreDwgRegistrationPromise: Promise<void> | null = null;
let engineEnhancementsInitialized = false;

async function initializeCadEngineEnhancements(runtime: CadBundledRuntimeModule): Promise<void> {
  if (engineEnhancementsInitialized) return;
  engineEnhancementsInitialized = true;
  const { Viewer } = runtime;

  // 1. Ölçü birimini ("m", "mm") kaldırma: AutoCAD gibi doğrudan sayı gösterimi
  if (Viewer.MEASUREMENT_LENGTH_FORMAT_OPTIONS) {
    Viewer.MEASUREMENT_LENGTH_FORMAT_OPTIONS.showUnits = false;
    Viewer.MEASUREMENT_LENGTH_FORMAT_OPTIONS.showApproximate = false;
  }

  try {
    // These namespaces come from the same isolated ESM graph as Viewer.
    // Do not import peer packages through Next here; production chunk splitting can
    // otherwise patch/register a different singleton/prototype than openDocument uses.
    const { dataModel, mtextRenderer, threeRenderer } = runtime;

    // Stage 9 DXF converter deadlock bypass
    // cad-simple-viewer 1.6.2 + data-model 1.14.2 can stall while closing
    // a database event batch in the production browser renderer. Keep the
    // native MLightCAD DXF reader, but stream entity events directly instead
    // of using beginEventBatch/endEventBatch(Chunked).
    const dxfConverter = dataModel.AcDbDatabaseConverterManager.instance.get(
      dataModel.AcDbFileType.DXF
    ) as unknown as {
      read?: (
        data: ArrayBuffer,
        db: InstanceType<typeof dataModel.AcDbDatabase>,
        options?: {
          minimumChunkSize?: number;
          progress?: (
            percentage: number,
            stage: string,
            status: string,
            stageData?: unknown
          ) => void | Promise<void>;
        }
      ) => Promise<void>;
      __stage9DeterministicRead?: boolean;
    };

    if (dxfConverter?.read && !dxfConverter.__stage9DeterministicRead) {
      dxfConverter.__stage9DeterministicRead = true;
      dxfConverter.read = async (data, db, readOptions = {}) => {
        console.log("[STAGE9 DIAG] dxfConverter.read start, data bytes:", data.byteLength);
        const setTrace = (value: string) => {
          if (typeof document !== "undefined") {
            document.documentElement.setAttribute("data-stage9-dxf-trace", value);
          }
        };
        const emit = async (
          percentage: number,
          stage: string,
          status: string,
          stageData?: unknown
        ) => {
          setTrace(`${stage}:${status}:${percentage}`);
          await readOptions.progress?.(percentage, stage, status, stageData);
        };

        await emit(0, "START", "START");
        await emit(1, "PARSE", "START");

        const filer = dataModel.AcDbDxfFiler.fromBuffer(data, { database: db });
        const reader = new dataModel.AcDbDxfDocumentReader(db, {
          // Frequent cooperative yields keep the main-thread renderer responsive
          // while direct entityAppended events are being streamed.
          entityBatchSize: Math.max(16, Math.min(128, readOptions.minimumChunkSize ?? 64)),
          totalBytes: data.byteLength,
          onProgress: async (ratio) => {
            const pct = Math.max(2, Math.min(88, 1 + Math.floor(ratio * 87)));
            await emit(pct, "PARSE", "IN-PROGRESS");
          },
        });

        console.log("[STAGE9 DIAG] reader.read starting...");
        setTrace("reader:before");
        const result = await reader.read(filer);
        console.log("[STAGE9 DIAG] reader.read finished:", result);
        setTrace("reader:after");

        await emit(90, "PARSE", "END", {
          unknownEntityCount: result.unknownEntityCount,
          unknownObjectCount: result.unknownObjectCount,
        });
        await emit(92, "ENTITY", "START");
        await emit(98, "ENTITY", "END");
        await emit(100, "END", "END");
        setTrace("complete");
        console.log("[STAGE9 DIAG] dxfConverter.read complete!");
      };
    }

    // AcDbFormatter formatLength hook: showUnits = false garantisi
    if (dataModel.AcDbFormatter?.prototype?.formatLength) {
      const originalFormatLength = dataModel.AcDbFormatter.prototype.formatLength;
      dataModel.AcDbFormatter.prototype.formatLength = function (value: number, options?: unknown) {
        return originalFormatLength.call(this, value, {
          ...(typeof options === "object" && options ? options : {}),
          showUnits: false,
        });
      };
    }

    // Stage 9: DXF entity parsing stays on MLightCAD's native data-model implementation.
    // Release fixtures use valid AC1027 subclass records; mutating AcDbEntity.dxfInFields
    // at runtime can create parser-state/prototype hazards in optimized production bundles.

    // 2. Dolu Font ve Yüksek Kalite Metin Render Altyapısı
    const fontManager = mtextRenderer.FontManager.instance;
    fontManager.baseUrl = "/cad-upstream/fonts/";
    fontManager.setDefaultFonts(["arial"]);
    fontManager.awaitFontsBeforeDraw = true;
    fontManager.lazyFontLoading = true;

    // Tüm standart ve yaygın CAD fontlarını dolu gövdeli yerel Arial fontuna haritalama
    fontManager.setFontMapping({
      standard: "arial",
      txt: "arial",
      "txt.shx": "arial",
      romans: "arial",
      "romans.shx": "arial",
      simplex: "arial",
      "simplex.shx": "arial",
      isocpeur: "arial",
      "isocpeur.ttf": "arial",
      times: "arial",
      "times new roman": "arial",
      calibri: "arial",
      arial: "arial",
      "arial.ttf": "arial",
    });

    // Arial TrueType fontunu belleğe yükleyip önbelleğe alma (tel kafes fallback'i engeller)
    if (typeof window !== "undefined" && !fontManager.isDefaultFontLoaded()) {
      fetch("/cad-upstream/fonts/Arial-Regular.ttf")
        .then((res) => (res.ok ? res.arrayBuffer() : null))
        .then((buffer) => {
          if (buffer) {
            fontManager
              .cacheFont(buffer, "Arial-Regular.ttf", [
                "arial",
                "standard",
                "txt",
                "romans",
                "simplex",
                "isocpeur",
              ])
              .catch((err) => console.warn("[cad-upstream] Font önbelleğe alınamadı:", err));
          }
        })
        .catch((err) => console.warn("[cad-upstream] Font yüklenemedi:", err));
    }

    // 3. Perde Taramalarının Opaklığı (Hatch Opacity)
    // Sert kör edici beyazlık yerine AutoCAD'deki gibi zarif ve yumuşatılmış opaklık (0.70 alpha)
    if (threeRenderer.AcTrStyleManager?.prototype?.getFillMaterial) {
      const origGetFillMaterial = threeRenderer.AcTrStyleManager.prototype.getFillMaterial;
      threeRenderer.AcTrStyleManager.prototype.getFillMaterial = function (
        traits: unknown,
        rebaseOffset?: unknown,
        gradientBounds?: unknown
      ) {
        const mat = origGetFillMaterial.call(this, traits as never, rebaseOffset as never, gradientBounds as never);
        if (
          mat &&
          (mat as { fragmentShader?: string }).fragmentShader &&
          (mat as { fragmentShader: string }).fragmentShader.includes("gl_FragColor = vec4(u_color * total, 1.0);")
        ) {
          mat.transparent = true;
          (mat as { fragmentShader: string }).fragmentShader = (mat as { fragmentShader: string }).fragmentShader.replace(
            "gl_FragColor = vec4(u_color * total, 1.0);",
            "gl_FragColor = vec4(u_color, total * 0.70);"
          );
        }
        return mat;
      };
    }
  } catch (error) {
    console.warn("[cad-upstream] Engine enhancements could not be fully applied:", error);
  }
}

function normalizeExtension(extension: string): string {
  const normalized = extension.trim().toLowerCase();
  if (!normalized) return "";
  return normalized.startsWith(".") ? normalized : `.${normalized}`;
}

function hasCoarseTouchPointer(): boolean {
  if (typeof window === "undefined" || typeof navigator === "undefined") return false;
  return navigator.maxTouchPoints > 0 && window.matchMedia?.("(pointer: coarse)").matches === true;
}

async function loadCadRuntimeModule(): Promise<CadBundledRuntimeModule> {
  if (!runtimeModulePromise) {
    const runtimeUrl = CAD_UPSTREAM_RUNTIME_URL;
    runtimeModulePromise = import(/* webpackIgnore: true */ runtimeUrl)
      .then((runtime) => {
        const candidate = runtime as unknown as CadBundledRuntimeModule;
        if (
          !candidate?.Viewer?.AcApDocManager ||
          !candidate?.dataModel?.AcDbDatabase ||
          typeof candidate.loadLibreDwg !== "function"
        ) {
          throw new Error("MLightCAD isolated runtime bundle is invalid.");
        }
        return candidate;
      })
      .catch((error) => {
        runtimeModulePromise = null;
        throw error;
      });
  }
  return runtimeModulePromise;
}

async function loadViewerModule(): Promise<CadSimpleViewerModule> {
  if (!viewerModulePromise) {
    viewerModulePromise = loadCadRuntimeModule()
      .then(async (runtime) => {
        await initializeCadEngineEnhancements(runtime);
        return runtime.Viewer;
      })
      .catch((error) => {
        viewerModulePromise = null;
        throw error;
      });
  }
  return viewerModulePromise;
}

async function registerLibreDwgConverter(): Promise<void> {
  if (!libreDwgRegistrationPromise) {
    libreDwgRegistrationPromise = loadCadRuntimeModule()
      .then(async ({ dataModel, loadLibreDwg }) => {
        const libreDwg = await loadLibreDwg();
        const converter = new libreDwg.AcDbLibreDwgConverter({
          convertByEntityType: false,
          useWorker: true,
          parserWorkerUrl: CAD_UPSTREAM_WORKER_URLS.dwgParser,
        });
        dataModel.AcDbDatabaseConverterManager.instance.register(
          dataModel.AcDbFileType.DWG,
          converter
        );
      })
      .catch((error) => {
        libreDwgRegistrationPromise = null;
        throw error;
      });
  }
  return libreDwgRegistrationPromise;
}

async function fetchCadSource(
  accessUrl: string,
  signal?: AbortSignal
): Promise<ArrayBuffer> {
  console.log(`[STAGE9 DIAG] fetchCadSource starting for ${accessUrl}`);
  const t0 = performance.now();
  try {
    const response = await fetch(accessUrl, {
      signal,
      cache: "no-store",
    });
    console.log(`[STAGE9 DIAG] fetchCadSource got response status ${response.status} in ${Math.round(performance.now() - t0)}ms`);

    if (!response.ok) {
      throw new CadUpstreamAdapterError(
        "source-fetch-failed",
        `CAD kaynağı alınamadı (HTTP ${response.status}).`
      );
    }

    const bytes = await response.arrayBuffer();
    console.log(`[STAGE9 DIAG] fetchCadSource got ${bytes.byteLength} bytes in ${Math.round(performance.now() - t0)}ms`);
    if (bytes.byteLength === 0) {
      throw new CadUpstreamAdapterError("source-empty", "CAD dosyası boş.");
    }
    return bytes;
  } catch (error) {
    if (signal?.aborted || (error instanceof Error && error.name === "AbortError")) {
      throw error;
    }
    if (error instanceof CadUpstreamAdapterError) throw error;
    throw new CadUpstreamAdapterError(
      "network-error",
      error instanceof Error ? error.message : "Ağ bağlantı hatası."
    );
  }
}

export class CadUpstreamAdapter {
  private destroyed = false;
  private displayMode: CadUpstreamDisplayMode = "source";
  private displayTheme: CadUpstreamTheme = "dark";
  private backgroundColorOption: CadBackgroundColorOption = "autocad";
  private sourceCanvasFilter: string | null = null;
  private lineWeightVisible = false;
  private container: HTMLElement | null = null;
  private activeMeasurementCommand: CadMeasurementCommand | null = null;
  private mobileGestureGuard: CadMobileGestureGuard | null = null;
  private distanceMeasurementController: CadPressHoldDistanceController | null = null;
  private chainDistanceMeasurementController: CadChainDistanceController | null = null;
  private areaMeasurementController: CadAreaMeasurementController | null = null;
  private snapLayerUnsubscribe: (() => void) | null = null;

  private snapCatalog: CadSnapPrimitive[] = [];
  private readonly snapEngine = new CadSnapEngine();
  private textSearchIndex: CadTextSearchIndex | null = null;
  private readonly initialLayerSnapshot = new Map<
    string,
    { isOn: boolean; isFrozen: boolean }
  >();


  private constructor(
    private readonly manager: AcApDocManager,
    private readonly Viewer: CadSimpleViewerModule,
    private readonly interactionHost: HTMLElement
  ) {}

  static async create(options: CadUpstreamCreateOptions): Promise<CadUpstreamAdapter> {
    const markCreatePhase = (phase: string) => {
      const host =
        options.container.closest<HTMLElement>('[data-cad-upstream-host="true"]') ??
        options.container;
      host.setAttribute("data-cad-create-phase", phase);
    };

    markCreatePhase("runtime-load");
    const Viewer = await loadViewerModule();
    markCreatePhase("runtime-ready");

    // Do not perform network worker preflights while creating the generic CAD
    // host. DXF uses the native buffered parser and must not wait on DWG/MTEXT
    // HEAD probes. DWG registers/probes its worker stack lazily in open().

    markCreatePhase("viewer-settings");
    Viewer.AcApSettingManager.instance.isShowCommandLine = false;
    Viewer.AcApSettingManager.instance.isShowRibbon = false;
    Viewer.AcApSettingManager.instance.isShowToolbar = false;

    markCreatePhase("theme-apply");
    Viewer.acedApplyUiTheme(
      options.theme ?? "dark",
      options.busyIndicatorHost ?? options.container
    );

    markCreatePhase("manager-create");
    const manager = Viewer.AcApDocManager.createInstance({
      container: options.container,
      busyIndicatorHost: options.busyIndicatorHost ?? options.container,
      autoResize: true,
      webworkerFileUrls: CAD_UPSTREAM_WORKER_URLS,
      checkWorkersOnInit: false,
      // Production Chromium can stall during worker-backed renderer bootstrap
      // before React timers get a chance to tick. Keep the first Stage 9 viewport
      // deterministic on the main renderer unless an explicit caller overrides it.
      useMainThreadDraw: options.useMainThreadDraw ?? true,
    });

    markCreatePhase("manager-ready");

    if (!manager) {
      throw new CadUpstreamAdapterError(
        "open-failed",
        "MLightCAD document manager başlatılamadı."
      );
    }

    markCreatePhase("adapter-ready");
    const adapter = new CadUpstreamAdapter(manager, Viewer, options.container);
    adapter.displayTheme = options.theme ?? "dark";
    adapter.container = options.container;
    options.container.style.backgroundColor = CAD_BACKGROUND_COLORS.autocad.hex;
    (options.container as unknown as { __cadAdapter?: CadUpstreamAdapter }).__cadAdapter = adapter;
    if (options.container.parentElement) {
      (options.container.parentElement as unknown as { __cadAdapter?: CadUpstreamAdapter }).__cadAdapter = adapter;
    }
    return adapter;
  }

  async open(options: CadUpstreamOpenOptions): Promise<void> {
    if (this.destroyed) {
      throw new CadUpstreamAdapterError(
        "adapter-destroyed",
        "CAD adapter kapatıldı."
      );
    }

    const extension = normalizeExtension(options.extension);
    if (!CAD_UPSTREAM_SUPPORTED_EXTENSIONS.has(extension)) {
      throw new CadUpstreamAdapterError(
        "unsupported-extension",
        `Desteklenmeyen CAD uzantısı: ${extension || options.extension}`
      );
    }

    // Native DXF parsing is fully buffered and does not require the DWG parser
    // worker readiness probe. In production, HEAD-based worker verification can
    // stall before a valid DXF reaches the parser, so only gate DWG on workers
    // and keep that probe bounded.
    if (extension === ".dwg") {
      options.onPhase?.("verify-workers", "CAD worker dosyaları doğrulanıyor");
      await registerLibreDwgConverter();
      const workersReady = await Promise.race([
        this.Viewer.AcApDocManager.checkWebworkerReadiness(CAD_UPSTREAM_WORKER_URLS),
        new Promise<boolean>((resolve) => window.setTimeout(() => resolve(false), 4_000)),
      ]);
      if (!workersReady) {
        throw new CadUpstreamAdapterError(
          "worker-unavailable",
          "MLightCAD worker dosyaları çizim açılmadan önce doğrulanamadı."
        );
      }
    }

    options.onPhase?.("fetch-source", "Çizim dosyası indiriliyor");
    const bytes = await fetchCadSource(options.accessUrl, options.signal);

    // Reject obviously truncated DXF before entering the upstream parser. Some
    // malformed token streams can otherwise leave a parser progress loop alive
    // instead of producing the controlled recovery UI expected by the studio.
    if (extension === ".dxf" && bytes.byteLength < 64) {
      throw new CadUpstreamAdapterError(
        "corrupt-truncated",
        `Eksik veya hasarlı dosya içeriği (${bytes.byteLength} B). Çizim dosyası beklenenden önce sonlanmış.`
      );
    }

    const isDwg = extension.includes("dwg");
    options.onPhase?.(
      "parse-convert",
      isDwg
        ? "DWG geometrisi LibreDWG ile çözümleniyor"
        : "DXF içeriği çözümleniyor"
    );

    const openOptions: AcApOpenDatabaseOptions = {
      minimumChunkSize: isDwg ? 1000 : Math.max(64, Math.min(1000, bytes.byteLength)),
      // DXF is fully buffered above and the native converter runs on the main thread.
      // Keep progressive chunking for DWG only; ordinary DXF uses one deterministic
      // module graph and the converter's own time-budgeted UI yields.
      progressiveRendering: isDwg,
      ...(options.databaseOptions ?? {}),
      mode: this.Viewer.AcEdOpenMode.Read,
    };

    const success = await this.manager.openDocument(
      options.displayName,
      bytes,
      openOptions
    );

    if (!success) {
      if (bytes.byteLength < 64) {
        throw new CadUpstreamAdapterError(
          "corrupt-truncated",
          `Eksik veya hasarlı dosya içeriği (${bytes.byteLength} B). Çizim dosyası beklenenden önce sonlanmış.`
        );
      }
      throw new CadUpstreamAdapterError(
        "open-failed",
        `MLightCAD dosyayı açamadı: ${options.displayName}`
      );
    }

    options.onPhase?.("build-scene", "Sahne ve katmanlar oluşturuluyor");
    // In cad-simple-viewer 1.6.2 waitUntilIdle() can monopolize the browser main
    // thread in a production bundle even when geometry is already visible. A
    // timer-based Promise.race cannot pre-empt that synchronous work. For DXF,
    // openDocument() is the terminal parser boundary and Stage 8 owns the real
    // post-ready blank-canvas diagnostics/recovery. Do not block readiness on
    // waitUntilIdle(). Keep the legacy idle check only for DWG where conversion
    // can still be progressive/worker-backed.
    const idle = isDwg
      ? await this.manager.curView.waitUntilIdle(CAD_UPSTREAM_BLANK_VALIDATION_IDLE_MS)
      : false;
    if (idle && this.manager.curView.stats.summary.entityCount === 0) {
      throw new CadUpstreamAdapterError(
        "blank-document",
        `MLightCAD dosyayı açtı ancak çizilebilir geometri üretmedi: ${options.displayName}`
      );
    }

    options.onPhase?.("render-ready", "İlk çizim görünümü hazırlanıyor");
    console.log("[STAGE9 DIAG] render-ready starting setup...");

    this.initialLayerSnapshot.clear();
    const store = this.getLayerStore();
    if (store) {
      for (const layer of store.getLayers()) {
        this.initialLayerSnapshot.set(layer.name, {
          isOn: layer.isOn,
          isFrozen: layer.isFrozen,
        });
      }
    }

    console.log("[STAGE9 DIAG] restorePanMode starting...");
    this.restorePanMode();
    console.log("[STAGE9 DIAG] configureMobilePinchZoom starting...");
    this.configureMobilePinchZoom();
    console.log("[STAGE9 DIAG] configureSnapRuntime starting...");
    this.configureSnapRuntime();
    console.log("[STAGE9 DIAG] configureMobileGestureGuard starting...");
    this.configureMobileGestureGuard();
    console.log("[STAGE9 DIAG] setBackgroundColor starting...");
    this.setBackgroundColor(this.backgroundColorOption);
    console.log("[STAGE9 DIAG] applyDisplayMode starting...");
    this.applyDisplayMode();
    console.log("[STAGE9 DIAG] zoomToFit starting...");
    this.zoomToFit();
    console.log("[STAGE9 DIAG] adapter.open fully completed!");
  }

  private getActiveLayoutView(): CadLayoutViewLike | null {
    const curView = this.manager.curView as unknown as
      | { activeLayoutView?: CadLayoutViewLike }
      | undefined;
    return curView?.activeLayoutView ?? null;
  }

  private configureMobilePinchZoom(): void {
    if (!hasCoarseTouchPointer()) return;
    const controls = this.getActiveLayoutView()?._cameraControls;
    if (!controls) return;
    controls.zoomSpeed = CAD_MOBILE_PINCH_ZOOM_SPEED;
    controls.zoomToCursor = true;
  }

  private configureSnapRuntime(): void {
    this.distanceMeasurementController?.destroy();
    this.distanceMeasurementController = null;
    this.chainDistanceMeasurementController?.destroy();
    this.chainDistanceMeasurementController = null;
    this.areaMeasurementController?.destroy();
    this.areaMeasurementController = null;
    this.snapLayerUnsubscribe?.();
    this.snapLayerUnsubscribe = null;

    const database = this.manager.curDocument?.database;
    this.snapCatalog = buildCadSnapPrimitives(database);
    this.rebuildVisibleSnapIndex();

    try {
      const textEntities = buildCadTextSearchCatalog(database);
      this.textSearchIndex = new CadTextSearchIndex(textEntities);
    } catch {
      this.textSearchIndex = new CadTextSearchIndex([]);
    }


    this.distanceMeasurementController = new CadPressHoldDistanceController(
      this.interactionHost,
      {
        resolvePoint: (screenPoint, snapModes) =>
          this.resolveDistancePoint(screenPoint, snapModes),
        setCameraInteractionEnabled: (enabled) =>
          this.setCameraInteractionEnabled(enabled),
      }
    );

    this.chainDistanceMeasurementController = new CadChainDistanceController(
      this.interactionHost,
      {
        resolvePoint: (screenPoint, snapModes) =>
          this.resolveDistancePoint(screenPoint, snapModes),
        projectWorldPoint: (point) => this.projectWorldPoint(point),
        setCameraInteractionEnabled: (enabled) =>
          this.setCameraInteractionEnabled(enabled),
      }
    );

    this.areaMeasurementController = new CadAreaMeasurementController(
      this.interactionHost,
      {
        resolvePoint: (screenPoint, snapModes) =>
          this.resolveDistancePoint(screenPoint, snapModes),
        projectWorldPoint: (point) => this.projectWorldPoint(point),
        setCameraInteractionEnabled: (enabled) =>
          this.setCameraInteractionEnabled(enabled),
      }
    );

    const store = this.getLayerStore();
    if (store) {
      const handleLayersChanged = () => this.rebuildVisibleSnapIndex();
      store.events.changed.addEventListener(handleLayersChanged);
      this.snapLayerUnsubscribe = () => {
        store.events.changed.removeEventListener(handleLayersChanged);
      };
    }
  }


  private rebuildVisibleSnapIndex(): void {
    if (this.snapCatalog.length === 0) {
      this.snapEngine.clear();
      return;
    }
    const layers = this.getLayers();
    if (layers.length === 0) {
      this.snapEngine.rebuild(this.snapCatalog);
      return;
    }
    const visibleLayers = new Set(
      layers.filter((layer) => layer.visible).map((layer) => layer.name)
    );
    this.snapEngine.rebuild(
      this.snapCatalog.filter(
        (primitive) => !primitive.layer || visibleLayers.has(primitive.layer)
      )
    );
  }

  private resolveDistancePoint(
    screenPoint: CadSnapPoint,
    snapModes: ReadonlySet<CadSnapMode>
  ): CadDistanceResolvedPoint | null {
    const view = this.getActiveLayoutView();
    if (!view) return null;
    const raw = view.screenToWorld(screenPoint);
    const worldPoint = { x: Number(raw.x), y: Number(raw.y) };
    if (!Number.isFinite(worldPoint.x) || !Number.isFinite(worldPoint.y)) return null;

    const worldUnitsPerPixel = this.getWorldUnitsPerPixel(view, screenPoint);
    const snap =
      snapModes.size > 0 && worldUnitsPerPixel > 0
        ? this.snapEngine.query({
            point: worldPoint,
            tolerancePx: CAD_DISTANCE_SNAP_TOLERANCE_PX,
            worldUnitsPerPixel,
            modes: snapModes,
          })
        : null;

    return {
      point: snap?.point ?? worldPoint,
      snap,
    };
  }

  private getWorldUnitsPerPixel(
    view: CadLayoutViewLike,
    screenPoint: CadSnapPoint
  ): number {
    const origin = view.screenToWorld(screenPoint);
    const stepX = view.screenToWorld({ x: screenPoint.x + 1, y: screenPoint.y });
    const xScale = Math.hypot(stepX.x - origin.x, stepX.y - origin.y);
    if (Number.isFinite(xScale) && xScale > 0) return xScale;
    const stepY = view.screenToWorld({ x: screenPoint.x, y: screenPoint.y + 1 });
    const yScale = Math.hypot(stepY.x - origin.x, stepY.y - origin.y);
    return Number.isFinite(yScale) && yScale > 0 ? yScale : 0;
  }

  private configureMobileGestureGuard(): void {
    this.mobileGestureGuard?.destroy();
    this.mobileGestureGuard = null;

    if (!hasCoarseTouchPointer()) return;

    this.mobileGestureGuard = new CadMobileGestureGuard(this.interactionHost, {
      onMultiTouchStart: () => this.abortMeasurementForMultiTouch(),
    });
  }

  private abortMeasurementForMultiTouch(): void {
    if (this.destroyed || !this.activeMeasurementCommand) return;

    if (this.activeMeasurementCommand === "distance") {
      this.distanceMeasurementController?.handleMultiTouchStart();
      this.restorePanMode();
      return;
    }

    this.activeMeasurementCommand = null;
    this.restorePanMode();
    void this.manager.commandManager.cancelActive().catch(() => {});
  }

  private restorePanMode(): void {
    if (!this.manager.curView) return;
    this.manager.curView.mode = this.Viewer.AcEdViewMode.PAN;
    this.manager.curView.selectionSet?.clear();
    // PAN mode changes upstream OrbitControls mouse mappings. Restore the
    // desktop read-only contract afterwards without touching touch gestures.
    this.enforceCadMouseBindings();
  }

  isReady(): boolean {
    return !this.destroyed && Boolean(this.manager.curDocument);
  }

  zoomToFit(): void {
    if (this.destroyed) return;
    this.manager.curView?.zoomToFitDrawing?.();
  }

  getBackgroundColor(): CadBackgroundColorOption {
    return this.backgroundColorOption;
  }

  setBackgroundColor(option: CadBackgroundColorOption): void {
    if (this.destroyed) return;
    this.backgroundColorOption = option;
    const config = CAD_BACKGROUND_COLORS[option] ?? CAD_BACKGROUND_COLORS.autocad;

    if (this.container) {
      this.container.style.backgroundColor = config.hex;
    }

    const curView = this.manager.curView as unknown as {
      applyCanvasBackground?: (color: number) => void;
      isDirty?: boolean;
    } | undefined;

    if (curView && typeof curView.applyCanvasBackground === "function") {
      curView.applyCanvasBackground(config.numeric);
      curView.isDirty = true;
    }
  }

  isMeasurementUnitsEnabled(): boolean {
    return Boolean(this.Viewer.MEASUREMENT_LENGTH_FORMAT_OPTIONS?.showUnits);
  }

  projectWorldPoint(point: CadSnapPoint): CadSnapPoint | null {
    if (this.destroyed) return null;
    const view = this.getActiveLayoutView();
    if (!view) return null;
    const screen = view.worldToScreen(point);
    const projected = { x: Number(screen.x), y: Number(screen.y) };
    return Number.isFinite(projected.x) && Number.isFinite(projected.y)
      ? projected
      : null;
  }

  screenToWorldPoint(screenPoint: CadSnapPoint): CadSnapPoint | null {
    if (this.destroyed) return null;
    const view = this.getActiveLayoutView();
    if (!view) return null;
    const raw = view.screenToWorld(screenPoint);
    const world = { x: Number(raw.x), y: Number(raw.y) };
    return Number.isFinite(world.x) && Number.isFinite(world.y) ? world : null;
  }

  setCameraInteractionEnabled(enabled: boolean): void {
    const view = this.getActiveLayoutView();
    if (view) view.enabled = enabled;
  }

  getNearbyPrimitives(
    worldPoint: CadSnapPoint,
    radiusPx = 60,
    limit = 64
  ): CadSnapPrimitive[] {
    if (this.destroyed) return [];
    const view = this.getActiveLayoutView();
    if (!view) return [];
    const screen = view.worldToScreen(worldPoint);
    const worldUnitsPerPixel = this.getWorldUnitsPerPixel(view, screen);
    const worldRadius = (worldUnitsPerPixel > 0 ? worldUnitsPerPixel : 1) * radiusPx;
    return this.snapEngine.queryNearbyPrimitives(worldPoint, worldRadius, limit);
  }


  subscribeViewChanged(callback: () => void): () => void {
    const event = this.getActiveLayoutView()?.events?.viewChanged;
    if (!event) return () => {};
    const handler = () => callback();
    event.addEventListener(handler);
    return () => event.removeEventListener(handler);
  }

  getDisplayMode(): CadUpstreamDisplayMode {
    return this.displayMode;
  }

  setDisplayMode(
    mode: CadUpstreamDisplayMode,
    theme: CadUpstreamTheme = this.displayTheme
  ): void {
    this.displayMode = mode;
    this.displayTheme = theme;
    this.applyDisplayMode();
  }

  applyTheme(theme: CadUpstreamTheme, hostElement?: HTMLElement): void {
    this.displayTheme = theme;
    if (hostElement) {
      this.Viewer.acedApplyUiTheme(theme, hostElement);
    }
    this.applyDisplayMode();
    this.setBackgroundColor(this.backgroundColorOption);
  }

  private applyDisplayMode(): void {
    if (this.destroyed) return;
    const view = this.manager.curView as unknown as
      | {
          canvas?: HTMLCanvasElement;
          canvas2d?: HTMLCanvasElement;
        }
      | undefined;

    const canvas = view?.canvas ?? view?.canvas2d;
    if (!canvas) return;

    if (this.sourceCanvasFilter === null) {
      this.sourceCanvasFilter = canvas.style.filter || "";
    }

    if (this.displayMode === "monochrome") {
      const isDark = this.displayTheme === "dark";
      canvas.style.filter = isDark
        ? "grayscale(100%) invert(100%) contrast(150%) brightness(1.2)"
        : "grayscale(100%) contrast(150%)";
    } else {
      canvas.style.filter = this.sourceCanvasFilter;
    }
  }

  getLineWeightVisible(): boolean {
    return this.lineWeightVisible;
  }

  async setLineWeightVisible(visible: boolean): Promise<void> {
    if (this.destroyed) return;
    this.lineWeightVisible = visible;
    const db = this.manager.curDocument?.database;
    if (db) {
      db.lwdisplay = visible;
    }
    const curView = this.manager.curView as unknown as {
      refreshEntitiesForLineWeightChange?: () => Promise<void>;
    };
    if (typeof curView?.refreshEntitiesForLineWeightChange === "function") {
      await curView.refreshEntitiesForLineWeightChange();
    }
  }

  getLayerStore(): AcApLayerStore | null {
    if (this.destroyed) return null;
    return this.manager.curDocument?.layerStore ?? null;
  }

  getLayers(): CadLayerItem[] {
    const store = this.getLayerStore();
    if (!store) return [];
    const currentLayer = store.getCurrentLayerName();
    return store.getLayers().map((layer) => ({
      name: layer.name,
      color: layer.color || "#888888",
      isOn: layer.isOn,
      isFrozen: layer.isFrozen,
      isLocked: layer.isLocked,
      isCurrent: layer.name === currentLayer,
      visible: Boolean(layer.isOn && !layer.isFrozen),
    }));
  }

  setLayerVisible(layerName: string, visible: boolean): boolean {
    const store = this.getLayerStore();
    if (!store) return false;
    if (visible) {
      store.setLayerOn(layerName, true);
      store.setLayerFrozen(layerName, false);
    } else {
      store.setLayerOn(layerName, false);
    }
    return true;
  }

  showAllLayers(): boolean {
    const store = this.getLayerStore();
    if (!store) return false;
    store.setAllLayersOn();
    for (const layer of store.getLayers()) {
      if (layer.isFrozen) {
        store.setLayerFrozen(layer.name, false);
      }
    }
    return true;
  }

  hideAllLayers(): boolean {
    const store = this.getLayerStore();
    if (!store) return false;
    return store.setAllLayersOffExceptCurrent();
  }

  isolateLayer(layerName: string): boolean {
    const store = this.getLayerStore();
    if (!store) return false;
    return store.isolateSingleLayer(layerName);
  }

  resetLayersToSource(): boolean {
    const store = this.getLayerStore();
    if (!store) return false;
    for (const [name, snap] of this.initialLayerSnapshot.entries()) {
      store.setLayerOn(name, snap.isOn);
      store.setLayerFrozen(name, snap.isFrozen);
    }
    return true;
  }

  subscribeLayersChanged(callback: () => void): () => void {
    const store = this.getLayerStore();
    if (!store) return () => {};
    const handler = () => callback();
    store.events.changed.addEventListener(handler);
    return () => {
      store.events.changed.removeEventListener(handler);
    };
  }

  async startDistanceMeasurement(
    snapModes: ReadonlySet<CadSnapMode>,
    callbacks: CadDistanceMeasurementCallbacks = {}
  ): Promise<boolean> {
    if (this.destroyed || !this.distanceMeasurementController) return false;
    await this.cancelActiveCommand();
    if (this.destroyed || !this.distanceMeasurementController) return false;

    this.activeMeasurementCommand = "distance";
    this.distanceMeasurementController.start(snapModes, {
      onSnapshot: callbacks.onSnapshot,
      onComplete: (result) => {
        if (this.activeMeasurementCommand === "distance") {
          this.activeMeasurementCommand = null;
        }
        this.restorePanMode();
        callbacks.onComplete?.(result);
      },
      onCancel: () => {
        if (this.activeMeasurementCommand === "distance") {
          this.activeMeasurementCommand = null;
        }
        this.restorePanMode();
        callbacks.onCancel?.();
      },
    });
    return true;
  }

  updateDistanceMeasurementSnapModes(snapModes: ReadonlySet<CadSnapMode>): void {
    this.distanceMeasurementController?.updateSnapModes(snapModes);
  }

  async startAreaMeasurement(
    snapModes: ReadonlySet<CadSnapMode>,
    callbacks: CadAreaMeasurementCallbacks = {}
  ): Promise<boolean> {
    if (this.destroyed || !this.areaMeasurementController) return false;
    await this.cancelActiveCommand();
    if (this.destroyed || !this.areaMeasurementController) return false;

    this.activeMeasurementCommand = "area";
    this.areaMeasurementController.start(snapModes, {
      onSnapshot: callbacks.onSnapshot,
      onComplete: (result) => {
        if (this.activeMeasurementCommand === "area") {
          this.activeMeasurementCommand = null;
        }
        this.restorePanMode();
        callbacks.onComplete?.(result);
      },
      onCancel: () => {
        if (this.activeMeasurementCommand === "area") {
          this.activeMeasurementCommand = null;
        }
        this.restorePanMode();
        callbacks.onCancel?.();
      },
    });
    return true;
  }

  async startChainDistanceMeasurement(
    snapModes: ReadonlySet<CadSnapMode>,
    callbacks: CadChainDistanceCallbacks = {}
  ): Promise<boolean> {
    if (this.destroyed || !this.chainDistanceMeasurementController) return false;
    await this.cancelActiveCommand();
    if (this.destroyed || !this.chainDistanceMeasurementController) return false;

    this.activeMeasurementCommand = "chain_distance";
    this.chainDistanceMeasurementController.start(snapModes, {
      onSnapshot: callbacks.onSnapshot,
      onComplete: (result) => {
        if (this.activeMeasurementCommand === "chain_distance") {
          this.activeMeasurementCommand = null;
        }
        this.restorePanMode();
        callbacks.onComplete?.(result);
      },
      onCancel: () => {
        if (this.activeMeasurementCommand === "chain_distance") {
          this.activeMeasurementCommand = null;
        }
        this.restorePanMode();
        callbacks.onCancel?.();
      },
    });
    return true;
  }

  finishChainDistanceMeasurement(): boolean {
    if (this.destroyed || !this.chainDistanceMeasurementController) return false;
    this.chainDistanceMeasurementController.finish();
    return true;
  }

  finishAreaMeasurement(): boolean {
    return this.areaMeasurementController?.finish() ?? false;
  }

  searchCadText(options: CadTextSearchQuery): CadTextSearchResult[] {
    if (this.destroyed || !this.textSearchIndex) return [];
    return this.textSearchIndex.search(options);
  }

  getTextSearchIndex(): CadTextSearchIndex | null {
    return this.textSearchIndex;
  }

  async zoomToBounds(
    bounds: { min: { x: number; y: number }; max: { x: number; y: number } },
    margin = 0.2
  ): Promise<void> {
    if (this.destroyed) return;
    const view = this.getActiveLayoutView() as unknown as {
      zoomTo?: (box: unknown, scale?: number) => void;
      flyTo?: (center: { x: number; y: number }, scale: number) => void;
      zoomToExtent?: () => void;
    };

    if (view && typeof view.zoomTo === "function") {
      const minX = bounds.min.x;
      const minY = bounds.min.y;
      const maxX = bounds.max.x;
      const maxY = bounds.max.y;
      const width = Math.max(maxX - minX, 1);
      const height = Math.max(maxY - minY, 1);
      const centerX = (minX + maxX) / 2;
      const centerY = (minY + maxY) / 2;

      const boxAdapter = {
        getSize: (target: { x: number; y: number }) => {
          target.x = width;
          target.y = height;
          return target;
        },
        getCenter: (target: { x: number; y: number }) => {
          target.x = centerX;
          target.y = centerY;
          return target;
        },
      };

      try {
        view.zoomTo(boxAdapter, 1 + margin);
      } catch {
        // Fallback if view.zoomTo has different signature
      }
    }
  }




  popAreaMeasurementPoint(): boolean {
    return this.areaMeasurementController?.popPoint() ?? false;
  }

  updateAreaMeasurementSnapModes(snapModes: ReadonlySet<CadSnapMode>): void {
    this.areaMeasurementController?.updateSnapModes(snapModes);
  }

  /**
   * Enforces CAD navigation bindings:
   * - Left mouse button (drag): PAN (standard web/touchpad expectation)
   * - Middle mouse button (wheel press & drag): PAN
   * - Mouse wheel scroll: ZOOM (handled natively by OrbitControls)
   * - Touch gestures: ONE=PAN, TWO=DOLLY_PAN (preserved)
   */
  enforceCadMouseBindings(): void {
    if (this.destroyed) return;
    const curView = this.manager.curView as unknown as {
      activeLayoutView?: {
        _cameraControls?: {
          mouseButtons?: Record<string, number>;
          update?: () => void;
        };
      };
      _layoutViewManager?: {
        _layoutViews?: Map<string, {
          _cameraControls?: {
            mouseButtons?: Record<string, number>;
            update?: () => void;
          };
        }>;
      };
    } | undefined;

    if (!curView) return;

    const patchControls = (controls?: { mouseButtons?: Record<string, number>; update?: () => void }) => {
      if (controls && controls.mouseButtons) {
        controls.mouseButtons = {
          LEFT: 2, // THREE.MOUSE.PAN
          MIDDLE: 2, // THREE.MOUSE.PAN
        };
        controls.update?.();
      }
    };

    const activeLayoutView = curView.activeLayoutView;
    if (activeLayoutView) {
      const proto = Object.getPrototypeOf(activeLayoutView) as {
        __cadPanFixed?: boolean;
      };
      if (proto && !proto.__cadPanFixed) {
        proto.__cadPanFixed = true;
        const desc = Object.getOwnPropertyDescriptor(proto, "mode");
        if (desc?.set) {
          const originalSet = desc.set;
          Object.defineProperty(proto, "mode", {
            get: desc.get,
            set: function (
              this: { _cameraControls?: { mouseButtons?: Record<string, number>; update?: () => void } },
              value: number
            ) {
              originalSet.call(this, value);
              if (this._cameraControls) {
                this._cameraControls.mouseButtons = {
                  LEFT: 2,
                  MIDDLE: 2,
                };
                this._cameraControls.update?.();
              }
            },
            enumerable: desc.enumerable,
            configurable: desc.configurable,
          });
        }
      }
    }

    patchControls(activeLayoutView?._cameraControls);

    if (curView._layoutViewManager?._layoutViews) {
      for (const layoutView of curView._layoutViewManager._layoutViews.values()) {
        patchControls(layoutView._cameraControls);
      }
    }
  }

  getCameraCenter(): { x: number; y: number } | null {
    if (this.destroyed || !this.manager.curView) return null;
    const center = this.manager.curView.center as { x: number; y: number } | undefined;
    if (!center || typeof center.x !== "number" || typeof center.y !== "number") return null;
    return { x: center.x, y: center.y };
  }

  async cancelActiveCommand(): Promise<void> {
    if (this.destroyed) return;
    const active = this.activeMeasurementCommand;
    this.activeMeasurementCommand = null;
    if (active === "distance") {
      this.distanceMeasurementController?.cancel(true);
    }
    if (active === "chain_distance") {
      this.chainDistanceMeasurementController?.cancel(true);
    }
    if (active === "area") {
      this.areaMeasurementController?.cancel(true);
    }

    await this.manager.commandManager.cancelActive().catch(() => {});
    this.restorePanMode();
  }

  async measureArea(callbacks?: CadAreaMeasurementCallbacks): Promise<void> {
    if (this.destroyed) return;
    if (this.areaMeasurementController) {
      await this.startAreaMeasurement(new Set(["endpoint", "midpoint", "intersection"]), callbacks);
      return;
    }
    await this.cancelActiveCommand();
    this.activeMeasurementCommand = "area";
    try {
      await this.manager.executeCommandString("measurearea");
    } finally {
      if (this.activeMeasurementCommand === "area") {
        this.activeMeasurementCommand = null;
      }
      this.restorePanMode();
    }
  }

  async clearMeasurements(): Promise<void> {
    if (this.destroyed) return;
    await this.cancelActiveCommand();
    await this.manager
      .executeCommandString("clearmeasurements")
      .catch(() => {});
    this.restorePanMode();
  }

  getRenderReadinessSnapshot(): CadRenderReadinessSnapshot | null {
    if (this.destroyed || !this.manager.curView) return null;

    const curView = this.manager.curView as unknown as {
      activeLayout?: { id?: string; name?: string };
      activeLayoutView?: { bounds?: { min?: { x: number; y: number }; max?: { x: number; y: number } } };
      bounds?: { min?: { x: number; y: number }; max?: { x: number; y: number } };
      stats?: { summary?: { entityCount?: number } };
      isIdle?: () => boolean;
    } | undefined;
    const canvas = this.container?.querySelector("canvas") as HTMLCanvasElement | null;
    const activeLayout = curView?.activeLayout;
    const activeLayoutId = activeLayout?.id ?? activeLayout?.name ?? null;
    const entityCount = curView?.stats?.summary?.entityCount ?? 0;


    let bounds: CadRenderReadinessSnapshot["bounds"] = null;
    let hasFiniteBounds = false;

    const rawBounds = curView?.bounds ?? curView?.activeLayoutView?.bounds;
    const rawMin = rawBounds?.min;
    const rawMax = rawBounds?.max;
    if (
      rawMin &&
      rawMax &&
      Number.isFinite(rawMin.x) &&
      Number.isFinite(rawMin.y) &&
      Number.isFinite(rawMax.x) &&
      Number.isFinite(rawMax.y)
    ) {
      bounds = {
        min: { x: Number(rawMin.x), y: Number(rawMin.y) },
        max: { x: Number(rawMax.x), y: Number(rawMax.y) },
      };
      hasFiniteBounds = bounds.max.x >= bounds.min.x && bounds.max.y >= bounds.min.y;
    } else if (this.snapCatalog && this.snapCatalog.length > 0) {

      let minX = Infinity;
      let minY = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;

      for (const prim of this.snapCatalog) {
        if (prim.kind === "line") {
          minX = Math.min(minX, prim.a.x, prim.b.x);
          minY = Math.min(minY, prim.a.y, prim.b.y);
          maxX = Math.max(maxX, prim.a.x, prim.b.x);
          maxY = Math.max(maxY, prim.a.y, prim.b.y);
        } else if (prim.kind === "circle" || prim.kind === "arc") {
          minX = Math.min(minX, prim.center.x - prim.radius);
          minY = Math.min(minY, prim.center.y - prim.radius);
          maxX = Math.max(maxX, prim.center.x + prim.radius);
          maxY = Math.max(maxY, prim.center.y + prim.radius);
        }
      }

      if (Number.isFinite(minX) && Number.isFinite(minY) && Number.isFinite(maxX) && Number.isFinite(maxY)) {
        bounds = {
          min: { x: minX, y: minY },
          max: { x: maxX, y: maxY },
        };
        hasFiniteBounds = bounds.max.x >= bounds.min.x && bounds.max.y >= bounds.min.y;
      }
    }



    const viewport = {
      width: canvas?.width ?? 0,
      height: canvas?.height ?? 0,
      clientWidth: canvas?.clientWidth ?? this.container?.clientWidth ?? 0,
      clientHeight: canvas?.clientHeight ?? this.container?.clientHeight ?? 0,
    };

    const center = this.getCameraCenter();
    const cameraValid = Boolean(center && Number.isFinite(center.x) && Number.isFinite(center.y));

    let webglContextLost = false;
    if (canvas) {
      const gl = (canvas.getContext("webgl2") || canvas.getContext("webgl")) as WebGLRenderingContext | null;
      if (gl && gl.isContextLost && gl.isContextLost()) {
        webglContextLost = true;
      }
    }

    return {
      timestamp: new Date().toISOString(),
      isReady: Boolean(this.manager.curDocument && !this.destroyed),
      isIdle: Boolean(curView?.isIdle?.() ?? true),
      activeLayoutId,
      entityCount,
      hasFiniteBounds,
      bounds,
      viewport,
      cameraValid,
      webglContextLost,
    };
  }

  async destroy(): Promise<void> {
    if (this.destroyed) return;
    this.destroyed = true;

    try {
      await Promise.race([
        this.cancelActiveCommand(),
        new Promise((resolve) => setTimeout(resolve, 1000)),
      ]);
    } catch {
      // Bounded cancel fallback
    }

    this.mobileGestureGuard?.destroy();
    this.mobileGestureGuard = null;
    this.distanceMeasurementController?.destroy();
    this.distanceMeasurementController = null;
    this.chainDistanceMeasurementController?.destroy();
    this.chainDistanceMeasurementController = null;
    this.areaMeasurementController?.destroy();
    this.areaMeasurementController = null;

    this.snapLayerUnsubscribe?.();
    this.snapLayerUnsubscribe = null;
    this.snapCatalog = [];
    this.snapEngine.clear();
    this.textSearchIndex = null;
    this.initialLayerSnapshot.clear();

    this.displayMode = "source";
    this.applyDisplayMode();
    if (this.container) {
      delete (this.container as unknown as { __cadAdapter?: CadUpstreamAdapter }).__cadAdapter;
      this.container = null;
    }

    try {
      if (typeof (this.manager as unknown as { destroy?: () => Promise<void> }).destroy === "function") {
        await (this.manager as unknown as { destroy: () => Promise<void> }).destroy();
      }
    } catch {
      // Bounded manager destroy fallback
    }
  }
}
