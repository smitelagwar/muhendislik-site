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
import { CAD_AUTOCAD_FONT_PARITY_V1 } from "../cad-font-fidelity-config";
import {
  evaluateCadFontParity,
  type CadFontParityEvaluation,
} from "../cad-font-registry";
export type { CadFontParityEvaluation };
import { decodeDxfBytes, detectDxfEncoding } from "../dxf-encoding";
import { startCadPerfPhase, endCadPerfPhase } from "../cad-runtime/perf";
import {
  buildCadSessionCacheKey,
  getCachedCadSource,
  putCachedCadSource,
  evictCachedCadSource,
} from "../cad-runtime/session-cache";

if (typeof window !== "undefined") {
  const originalGetContext = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function (
    this: HTMLCanvasElement,
    contextId: string,
    options?: unknown
  ) {
    if (contextId === "webgl2" || contextId === "webgl") {
      const opts =
        typeof options === "object" && options !== null
          ? { ...options, preserveDrawingBuffer: true }
          : { preserveDrawingBuffer: true };
      return originalGetContext.call(this, contextId, opts);
    }
    return originalGetContext.call(this, contextId, options);
  } as typeof HTMLCanvasElement.prototype.getContext;
}

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
  fileId?: string;
  sourceVersionKey?: string;
  signal?: AbortSignal;
  databaseOptions?: Omit<AcApOpenDatabaseOptions, "mode">;
  onPhase?: (phase: CadLoadingPhase, phaseText: string) => void;
}

type CadSimpleViewerModule = typeof import("@mlightcad/cad-simple-viewer");

let rawViewerModulePromise: Promise<CadSimpleViewerModule> | null = null;
let initializedViewerModulePromise: Promise<CadSimpleViewerModule> | null = null;
let libreDwgRegistrationPromise: Promise<void> | null = null;
let fontPreloadPromise: Promise<void> | null = null;
let engineEnhancementsInitialized = false;

type CadFontManagerInstance = {
  cacheFont: (buf: ArrayBuffer, filename: string, aliases: string[]) => Promise<unknown>;
  events?: unknown;
};

let activeFontManager: CadFontManagerInstance | null = null;

async function ensureFontsPreloaded(fontManager?: CadFontManagerInstance | null): Promise<void> {
  if (typeof window === "undefined") return;
  if (fontManager) {
    activeFontManager = fontManager;
  }
  if (!fontPreloadPromise) {
    startCadPerfPhase("font-preload");
    fontPreloadPromise = (async () => {
      try {
        const mgr =
          fontManager ??
          activeFontManager ??
          (await import("@mlightcad/mtext-renderer")).FontManager.instance;
        activeFontManager = mgr;

        const [regularRes, boldRes, serifRegularRes, serifBoldRes] = await Promise.all([
          fetch("/cad-upstream/fonts/Arial-Regular.ttf"),
          fetch("/cad-upstream/fonts/Arial-Bold.ttf"),
          fetch("/cad-upstream/fonts/IBMPlexSerif-Regular.ttf"),
          fetch("/cad-upstream/fonts/IBMPlexSerif-Bold.ttf"),
        ]);

        const cacheTasks: Promise<unknown>[] = [];

        if (regularRes.ok) {
          const buf = await regularRes.arrayBuffer();
          cacheTasks.push(
            mgr.cacheFont(buf, "Arial-Regular.ttf", [
              "arial",
              "arial-regular",
              "arial.ttf",
              "standard",
              "txt",
              "txt.shx",
              "romans",
              "romans.shx",
              "simplex",
              "simplex.shx",
              "isocpeur",
              "isocpeur.ttf",
              "calibri",
              "helvetica",
              "verdana",
              "tahoma",
              "swis",
              "arial_1_18",
            ])
          );
        }

        if (boldRes.ok) {
          const buf = await boldRes.arrayBuffer();
          cacheTasks.push(
            mgr.cacheFont(buf, "Arial-Bold.ttf", [
              "arial-bold",
              "arial-bold.ttf",
              "arialb.ttf",
              "arialbd.ttf",
              "arialbd",
              "arial bold",
              "arial_bold",
            ])
          );
        }

        if (serifRegularRes.ok) {
          const buf = await serifRegularRes.arrayBuffer();
          cacheTasks.push(
            mgr.cacheFont(buf, "IBMPlexSerif-Regular.ttf", [
              "ibm-plex-serif",
              "ibm plex serif",
              "times",
              "times roman",
              "times-roman",
              "times_roman",
              "times new roman",
              "times-new-roman",
              "times new roman tur",
              "times new roman tur_1_18",
              "romant",
              "romanc",
              "romand",
              "serif",
            ])
          );
        }

        if (serifBoldRes.ok) {
          const buf = await serifBoldRes.arrayBuffer();
          cacheTasks.push(
            mgr.cacheFont(buf, "IBMPlexSerif-Bold.ttf", [
              "ibm-plex-serif-bold",
              "ibm plex serif bold",
              "times-bold",
              "times bold",
              "times new roman bold",
              "timesbd",
              "timesbd.ttf",
            ])
          );
        }

        await Promise.all(cacheTasks);
      } catch (err) {
        console.warn("[cad-upstream] Font preload hatası:", err);
      } finally {
        endCadPerfPhase("font-preload");
      }
    })();
  }
  return fontPreloadPromise;
}

async function initializeCadEngineEnhancements(Viewer: CadSimpleViewerModule): Promise<void> {
  if (engineEnhancementsInitialized) return;
  engineEnhancementsInitialized = true;

  // 1. Ölçü birimini ("m", "mm") kaldırma: AutoCAD gibi doğrudan sayı gösterimi
  if (Viewer.MEASUREMENT_LENGTH_FORMAT_OPTIONS) {
    Viewer.MEASUREMENT_LENGTH_FORMAT_OPTIONS.showUnits = false;
    Viewer.MEASUREMENT_LENGTH_FORMAT_OPTIONS.showApproximate = false;
  }

  try {
    const [dataModel, mtextRenderer, threeRenderer] = await Promise.all([
      import("@mlightcad/data-model"),
      import("@mlightcad/mtext-renderer"),
      import("@mlightcad/three-renderer"),
    ]);

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

    // DXF R12 / Flat DXF desteği: 100 AcDbEntity alt sınıf etiketi olmayan DXF'lerde
    // entity-özel grup kodlarının (10, 20, 1, 40 vb.) yutulmasını önleme hook'u
    if (dataModel.AcDbEntity?.prototype?.dxfInFields) {
      const origEntityDxfIn = dataModel.AcDbEntity.prototype.dxfInFields;
      const COMMON_ENTITY_CODES = new Set([8, 6, 48, 60, 62, 420, 370, 440, 67]);

      dataModel.AcDbEntity.prototype.dxfInFields = function (filer: unknown) {
        const f = filer as {
          atSubclassData: (name: string) => boolean;
          atEndOfObject: boolean;
          atEof: boolean;
          atExtendedData: boolean;
          readItem: () => { code: number; value: unknown } | undefined;
          peekItem: () => { code: number; value: unknown } | undefined;
          pushBackItem: (item: unknown) => void;
        };

        if (typeof f?.atSubclassData !== "function") {
          return origEntityDxfIn.call(this, filer as never);
        }

        const hasAcDbEntity = f.atSubclassData("AcDbEntity");
        if (hasAcDbEntity) {
          return origEntityDxfIn.call(this, filer as never);
        }

        // 100 AcDbEntity etiketi yok: Yalnız ortak entity kodlarını tüket,
        // entity'ye özel kodlarda (10, 20, 1 vb.) durarak alt sınıfa bırak.
        const self = this as unknown as {
          layer?: string;
          lineType?: string;
          linetypeScale?: number;
          visibility?: boolean;
          color?: { colorIndex?: number; setRGBValue?: (rgb: number) => void };
          lineWeight?: number;
          transparency?: unknown;
          _dxfPaperSpace?: boolean;
        };


        while (!f.atEndOfObject && !f.atEof && !f.atExtendedData) {
          const item = f.peekItem();
          if (!item) break;
          const code = Number(item.code);
          if (code === 100 || !COMMON_ENTITY_CODES.has(code)) {
            break;
          }
          f.readItem();
          switch (code) {
            case 8: self.layer = String(item.value); break;
            case 6: self.lineType = String(item.value); break;
            case 48: self.linetypeScale = Number(item.value); break;
            case 60: self.visibility = Number(item.value) === 0; break;
            case 62: if (self.color) self.color.colorIndex = Number(item.value); break;
            case 420: self.color?.setRGBValue?.(Number(item.value)); break;
            case 370: self.lineWeight = Number(item.value); break;
            case 67: self._dxfPaperSpace = Number(item.value) !== 0; break;
          }
        }
        return this;
      };
    }


    // 2. Dolu Font ve Yüksek Kalite Metin Render Altyapısı
    const fontManager = mtextRenderer.FontManager.instance;
    fontManager.baseUrl = "/cad-upstream/fonts/";
    fontManager.setDefaultFonts(["arial", "ibm-plex-serif"]);
    fontManager.awaitFontsBeforeDraw = true;
    fontManager.lazyFontLoading = true;

    // Tüm standart ve yaygın CAD fontlarını dolu gövdeli TrueType fontlara haritalama
    fontManager.setFontMapping({
      // Arial ailesi (düz ve sans-serif)
      arial: "arial",
      "arial.ttf": "arial",
      "arial-regular": "arial",
      arial_1_18: "arial",
      "arial-bold": "arial-bold",
      "arial-bold.ttf": "arial-bold",
      "arialbd.ttf": "arial-bold",
      arialbd: "arial-bold",
      "arial bold": "arial-bold",
      arial_bold: "arial-bold",
      "arialb.ttf": "arial-bold",

      // Klasik CAD SHX ve tek-çizgi fallback'lerini dolu gövdeli Arial'a haritalama
      standard: "arial",
      txt: "arial",
      "txt.shx": "arial",
      romans: "arial",
      "romans.shx": "arial",
      simplex: "arial",
      "simplex.shx": "arial",
      isocpeur: "arial",
      "isocpeur.ttf": "arial",
      calibri: "arial",
      helvetica: "arial",
      verdana: "arial",
      tahoma: "arial",
      swis: "arial",

      // Times / Serif ailesi (AutoCAD'deki Times Roman / RomanT serif stilleri)
      times: "ibm-plex-serif",
      "times roman": "ibm-plex-serif",
      "times-roman": "ibm-plex-serif",
      times_roman: "ibm-plex-serif",
      "times new roman": "ibm-plex-serif",
      "times-new-roman": "ibm-plex-serif",
      "times new roman tur": "ibm-plex-serif",
      "times new roman tur_1_18": "ibm-plex-serif",
      romant: "ibm-plex-serif",
      romanc: "ibm-plex-serif",
      romand: "ibm-plex-serif",
      serif: "ibm-plex-serif",
      "times-bold": "ibm-plex-serif-bold",
      "times bold": "ibm-plex-serif-bold",
      "times new roman bold": "ibm-plex-serif-bold",
      timesbd: "ibm-plex-serif-bold",
      "timesbd.ttf": "ibm-plex-serif-bold",
    });

    // Stage 5: Fontları deterministik olarak arka planda paralel başlat, modül init'i bloklama
    activeFontManager = fontManager;
    void ensureFontsPreloaded(fontManager);

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

export function preloadCadViewerCode(): Promise<CadSimpleViewerModule> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("preloadCadViewerCode is client-only"));
  }
  if (!rawViewerModulePromise) {
    startCadPerfPhase("raw-viewer-preload");
    rawViewerModulePromise = import("@mlightcad/cad-simple-viewer")
      .then((Viewer) => {
        endCadPerfPhase("raw-viewer-preload");
        return Viewer;
      })
      .catch((error) => {
        endCadPerfPhase("raw-viewer-preload");
        rawViewerModulePromise = null;
        throw error;
      });
  }
  return rawViewerModulePromise;
}

export async function loadViewerModule(): Promise<CadSimpleViewerModule> {
  if (!initializedViewerModulePromise) {
    initializedViewerModulePromise = (async () => {
      startCadPerfPhase("mlightcad-import");
      const Viewer = await (rawViewerModulePromise ?? preloadCadViewerCode());
      endCadPerfPhase("mlightcad-import");

      startCadPerfPhase("engine-enhancements");
      await initializeCadEngineEnhancements(Viewer);
      endCadPerfPhase("engine-enhancements");

      return Viewer;
    })().catch((error) => {
      initializedViewerModulePromise = null;
      throw error;
    });
  }
  return initializedViewerModulePromise;
}

async function registerLibreDwgConverter(): Promise<void> {
  if (!libreDwgRegistrationPromise) {
    startCadPerfPhase("libredwg-registration");
    libreDwgRegistrationPromise = Promise.all([
      import("@mlightcad/data-model"),
      import("@mlightcad/libredwg-converter"),
    ])
      .then(([dataModel, libreDwg]) => {
        const converter = new libreDwg.AcDbLibreDwgConverter({
          convertByEntityType: false,
          useWorker: true,
          parserWorkerUrl: CAD_UPSTREAM_WORKER_URLS.dwgParser,
        });
        dataModel.AcDbDatabaseConverterManager.instance.register(
          dataModel.AcDbFileType.DWG,
          converter
        );
        endCadPerfPhase("libredwg-registration");
      })
      .catch((error) => {
        endCadPerfPhase("libredwg-registration");
        libreDwgRegistrationPromise = null;
        throw error;
      });
  }
  return libreDwgRegistrationPromise;
}

async function fetchCadSource(
  accessUrl: string,
  signal?: AbortSignal,
  cacheKey?: string | null
): Promise<{ bytes: ArrayBuffer; fromCache: boolean }> {
  if (cacheKey) {
    const cached = getCachedCadSource(cacheKey);
    if (cached) {
      return { bytes: cached, fromCache: true };
    }
  }

  startCadPerfPhase("source-fetch");
  try {
    const response = await fetch(accessUrl, {
      signal,
      cache: "no-store",
    });

    if (!response.ok) {
      throw new CadUpstreamAdapterError(
        "source-fetch-failed",
        `CAD kaynağı alınamadı (HTTP ${response.status}).`
      );
    }

    const bytes = await response.arrayBuffer();
    if (bytes.byteLength === 0) {
      throw new CadUpstreamAdapterError("source-empty", "CAD dosyası boş.");
    }

    if (cacheKey) {
      putCachedCadSource(cacheKey, bytes);
    }

    return { bytes, fromCache: false };
  } catch (error) {
    if (signal?.aborted || (error instanceof Error && error.name === "AbortError")) {
      throw error;
    }
    if (error instanceof CadUpstreamAdapterError) throw error;
    throw new CadUpstreamAdapterError(
      "network-error",
      error instanceof Error ? error.message : "Ağ bağlantı hatası."
    );
  } finally {
    endCadPerfPhase("source-fetch");
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
  private fontDiagnostics: CadFontParityEvaluation = {
    fontParityExact: true,
    requestedFonts: [],
    resolvedExactFonts: [],
    fallbackFonts: [],
    missingFonts: [],
  };

  private constructor(
    private readonly manager: AcApDocManager,
    private readonly Viewer: CadSimpleViewerModule,
    private readonly interactionHost: HTMLElement
  ) {}

  static async create(options: CadUpstreamCreateOptions): Promise<CadUpstreamAdapter> {
    const Viewer = await loadViewerModule();
    await registerLibreDwgConverter();

    startCadPerfPhase("worker-readiness");
    const workersReachable = await Viewer.AcApDocManager.checkWebworkerReadiness(
      CAD_UPSTREAM_WORKER_URLS
    );
    if (!workersReachable) {
      endCadPerfPhase("worker-readiness");
      throw new CadUpstreamAdapterError(
        "worker-unavailable",
        "MLightCAD DWG/MTEXT worker dosyalarına erişilemiyor."
      );
    }

    Viewer.AcApSettingManager.instance.isShowCommandLine = false;
    Viewer.AcApSettingManager.instance.isShowRibbon = false;
    Viewer.AcApSettingManager.instance.isShowToolbar = false;

    Viewer.acedApplyUiTheme(
      options.theme ?? "dark",
      options.busyIndicatorHost ?? options.container
    );

    try {
      options.container.replaceChildren();
    } catch {}

    const manager = Viewer.AcApDocManager.createInstance({
      container: options.container,
      busyIndicatorHost: options.busyIndicatorHost ?? options.container,
      autoResize: true,
      webworkerFileUrls: CAD_UPSTREAM_WORKER_URLS,
      checkWorkersOnInit: true,
      useMainThreadDraw: options.useMainThreadDraw ?? true,
    });

    if (!manager) {
      endCadPerfPhase("worker-readiness");
      throw new CadUpstreamAdapterError(
        "open-failed",
        "MLightCAD document manager başlatılamadı."
      );
    }

    if (!(await manager.areWorkersReady())) {
      endCadPerfPhase("worker-readiness");
      await manager.destroy();
      throw new CadUpstreamAdapterError(
        "worker-unavailable",
        "MLightCAD worker readiness kontrolü başarısız."
      );
    }
    endCadPerfPhase("worker-readiness");

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

    // Stage 4 & 5: Overlap worker verification, source file download, and font readiness concurrently.
    // Instead of waiting serially, all three operations run in parallel.
    // If worker readiness fails or is rejected, in-flight fetch is aborted immediately.
    const fetchController = new AbortController();
    const handleSignalAbort = () => {
      fetchController.abort(options.signal?.reason);
    };

    if (options.signal) {
      if (options.signal.aborted) {
        fetchController.abort(options.signal.reason);
      } else {
        options.signal.addEventListener("abort", handleSignalAbort, { once: true });
      }
    }

    options.onPhase?.("verify-workers", "CAD worker dosyaları doğrulanıyor");

    const workerReadyPromise = (async () => {
      try {
        const ready = await this.manager.areWorkersReady();
        if (ready) {
          options.onPhase?.("fetch-source", "Çizim dosyası indiriliyor");
        }
        return ready;
      } catch {
        return false;
      }
    })();

    const cacheKey = buildCadSessionCacheKey({
      fileId: options.fileId,
      sourceVersionKey: options.sourceVersionKey,
      accessUrl: options.accessUrl,
    });

    const sourceFetchPromise = fetchCadSource(options.accessUrl, fetchController.signal, cacheKey);

    const mtextRenderer = (this.Viewer as unknown as { mtextRenderer?: { FontManager?: { instance?: CadFontManagerInstance } } }).mtextRenderer;
    const fontManager = mtextRenderer?.FontManager?.instance ?? activeFontManager;
    const fontPreloadTask = ensureFontsPreloaded(fontManager);

    const [workersReady, sourceResult] = await Promise.all([
      workerReadyPromise,
      sourceFetchPromise.then(
        (res) => ({ ok: true as const, bytes: res.bytes, fromCache: res.fromCache }),
        (err) => ({ ok: false as const, error: err })
      ),
      fontPreloadTask,
    ]);

    if (options.signal) {
      options.signal.removeEventListener("abort", handleSignalAbort);
    }

    if (!workersReady) {
      fetchController.abort("WORKER_UNAVAILABLE");
      throw new CadUpstreamAdapterError(
        "worker-unavailable",
        "MLightCAD worker dosyaları çizim açılmadan önce doğrulanamadı."
      );
    }

    if (!sourceResult.ok) {
      throw sourceResult.error;
    }

    const bytes = sourceResult.bytes;

    if (CAD_AUTOCAD_FONT_PARITY_V1) {
      const requested = extractDxfOrDwgFonts(bytes, extension);
      this.fontDiagnostics = evaluateCadFontParity(requested);

      const fontEvents = fontManager?.events as { fontNotFound?: { subscribe?: (cb: (e: { fontName: string }) => void) => void } } | undefined;
      if (fontEvents?.fontNotFound?.subscribe) {
        fontEvents.fontNotFound.subscribe(({ fontName }) => {
          if (fontName && !this.fontDiagnostics.missingFonts.includes(fontName)) {
            this.fontDiagnostics.missingFonts.push(fontName);
            this.fontDiagnostics.fontParityExact = false;
          }
        });
      }
    } else {
      this.fontDiagnostics = {
        fontParityExact: false,
        requestedFonts: [],
        resolvedExactFonts: [],
        fallbackFonts: [],
        missingFonts: [],
      };
    }

    const isDwg = extension.includes("dwg");
    options.onPhase?.(
      "parse-convert",
      isDwg
        ? "DWG geometrisi LibreDWG ile çözümleniyor"
        : "DXF içeriği çözümleniyor"
    );

    // DXF dosyalarında windows-1254 (veya UTF-8 harici) tek bayt kodlama algılanırsa temiz UTF-8 baytına transcode et
    let documentBytes: ArrayBuffer = bytes;
    if (!isDwg && bytes.byteLength >= 64) {
      try {
        const uint8 = new Uint8Array(bytes);
        const encodingResolution = detectDxfEncoding(uint8);
        if (!encodingResolution.isBinary && encodingResolution.encoding !== "utf-8") {
          const decodedText = decodeDxfBytes(uint8, encodingResolution.encoding);
          if (decodedText && decodedText.trim().length > 0) {
            const encoded = new TextEncoder().encode(decodedText);
            const copy = new Uint8Array(encoded.byteLength);
            copy.set(encoded);
            documentBytes = copy.buffer as ArrayBuffer;
          }
        }
      } catch (encodingErr) {
        console.warn("[cad-upstream] DXF encoding transcode uyarısı:", encodingErr);
      }
    }

    const openOptions: AcApOpenDatabaseOptions = {
      minimumChunkSize: 1000,
      progressiveRendering: true,
      ...(options.databaseOptions ?? {}),
      mode: this.Viewer.AcEdOpenMode.Read,
    };

    startCadPerfPhase("open-document");
    const success = await this.manager.openDocument(
      options.displayName,
      documentBytes,
      openOptions
    );
    endCadPerfPhase("open-document");

    if (!success) {
      if (cacheKey) {
        evictCachedCadSource(cacheKey);
      }
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
    startCadPerfPhase("wait-until-idle");
    const idle = await this.manager.curView.waitUntilIdle(
      CAD_UPSTREAM_BLANK_VALIDATION_IDLE_MS
    );
    endCadPerfPhase("wait-until-idle");
    if (idle && this.manager.curView.stats.summary.entityCount === 0) {
      throw new CadUpstreamAdapterError(
        "blank-document",
        `MLightCAD dosyayı açtı ancak çizilebilir geometri üretmedi: ${options.displayName}`
      );
    }

    options.onPhase?.("render-ready", "İlk çizim görünümü hazırlanıyor");

    startCadPerfPhase("layer-snapshot");
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
    endCadPerfPhase("layer-snapshot");

    this.restorePanMode();
    this.configureMobilePinchZoom();
    this.configureSnapRuntime();
    this.configureMobileGestureGuard();
    this.attachCanvasContextLostHandler();

    if (typeof window !== "undefined") {
      (window as unknown as { __cadAdapter?: unknown }).__cadAdapter = this;
    }
    this.setBackgroundColor(this.backgroundColorOption);
    this.applyDisplayMode();
    this.zoomToFit();
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

    startCadPerfPhase("snap-catalog");
    const database = this.manager.curDocument?.database;
    this.snapCatalog = buildCadSnapPrimitives(database);
    this.rebuildVisibleSnapIndex();
    endCadPerfPhase("snap-catalog");

    startCadPerfPhase("text-catalog");
    try {
      const textEntities = buildCadTextSearchCatalog(database);
      this.textSearchIndex = new CadTextSearchIndex(textEntities);
    } catch {
      this.textSearchIndex = new CadTextSearchIndex([]);
    }
    endCadPerfPhase("text-catalog");


    this.distanceMeasurementController = new CadPressHoldDistanceController(
      this.interactionHost,
      {
        resolvePoint: (screenPoint, snapModes, options) =>
          this.resolveDistancePoint(screenPoint, snapModes, options),
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
    snapModes: ReadonlySet<CadSnapMode>,
    options?: { originPoint?: CadSnapPoint | null; isOrtho?: boolean }
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
            origin: options?.originPoint ?? null,
          })
        : null;

    if (snap) {
      return {
        point: snap.point,
        snap,
      };
    }

    if (options?.isOrtho && options.originPoint) {
      const dx = worldPoint.x - options.originPoint.x;
      const dy = worldPoint.y - options.originPoint.y;
      const lockedPoint =
        Math.abs(dx) >= Math.abs(dy)
          ? { x: worldPoint.x, y: options.originPoint.y }
          : { x: options.originPoint.x, y: worldPoint.y };
      return {
        point: lockedPoint,
        snap: null,
      };
    }

    return {
      point: worldPoint,
      snap: null,
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

  getFontFidelityDiagnostics(): CadFontParityEvaluation {
    return {
      fontParityExact: this.fontDiagnostics.fontParityExact,
      requestedFonts: [...this.fontDiagnostics.requestedFonts],
      resolvedExactFonts: [...this.fontDiagnostics.resolvedExactFonts],
      fallbackFonts: [...this.fontDiagnostics.fallbackFonts],
      missingFonts: [...this.fontDiagnostics.missingFonts],
    };
  }

  getCanvas(): HTMLCanvasElement | null {
    return (this.container?.querySelector("canvas") as HTMLCanvasElement | null) ?? null;
  }

  isContextLost(): boolean {
    const canvas = this.getCanvas();
    if (!canvas) return false;
    const gl = (canvas.getContext("webgl2") || canvas.getContext("webgl")) as WebGLRenderingContext | null;
    return Boolean(gl && gl.isContextLost && gl.isContextLost());
  }

  private attachCanvasContextLostHandler(): void {
    const canvas = this.getCanvas();
    if (!canvas) return;
    const onContextLost = (e: Event) => {
      e.preventDefault();
      console.warn("[cad-upstream] Canvas WebGL context lost; preventDefault() çağrıldı (kurtarmaya izin verildi).");
    };
    canvas.addEventListener("webglcontextlost", onContextLost, false);
  }

  resumeAfterBackground(): void {
    if (this.destroyed) return;

    this.mobileGestureGuard?.reset();
    this.distanceMeasurementController?.cancel(false);
    this.chainDistanceMeasurementController?.cancel(false);
    this.areaMeasurementController?.cancel(false);

    const view = this.getActiveLayoutView();
    if (view) {
      view.enabled = true;
      const controls = (view as unknown as {
        _cameraControls?: {
          disconnect?: () => void;
          connect?: () => void;
          state?: number;
          pointers?: unknown[];
          pointerPositions?: Map<unknown, unknown>;
          update?: () => void;
        };
      })._cameraControls;

      if (controls) {
        try {
          if (typeof controls.disconnect === "function" && typeof controls.connect === "function") {
            controls.disconnect();
            controls.connect();
          }
          if (controls.state !== undefined) {
            controls.state = -1;
          }
          if (Array.isArray(controls.pointers)) {
            controls.pointers.length = 0;
          }
          if (controls.pointerPositions && typeof controls.pointerPositions.clear === "function") {
            controls.pointerPositions.clear();
          }
          controls.update?.();
        } catch (err) {
          console.warn("[cad-upstream] Controls reset uyarısı:", err);
        }
      }

      try {
        const anyView = view as unknown as {
          onWindowResize?: () => void;
          startAnimationLoop?: () => void;
          _isDirty?: boolean;
        };
        anyView.onWindowResize?.();
        anyView.startAnimationLoop?.();
        if (anyView._isDirty !== undefined) {
          anyView._isDirty = true;
        }
      } catch (err) {
        console.warn("[cad-upstream] View wake up uyarısı:", err);
      }
    }

    if (this.manager.curView) {
      try {
        const anyCurView = this.manager.curView as unknown as {
          onWindowResize?: () => void;
          startAnimationLoop?: () => void;
          _isDirty?: boolean;
        };
        anyCurView.onWindowResize?.();
        anyCurView.startAnimationLoop?.();
        if (anyCurView._isDirty !== undefined) {
          anyCurView._isDirty = true;
        }
      } catch (err) {
        console.warn("[cad-upstream] curView wake up uyarısı:", err);
      }
    }

    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("resize"));
    }
  }

  async destroy(): Promise<void> {
    if (this.destroyed) return;
    this.destroyed = true;
    startCadPerfPhase("destroy");

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
    const targetContainer = this.container;
    if (this.container) {
      delete (this.container as unknown as { __cadAdapter?: CadUpstreamAdapter }).__cadAdapter;
      this.container = null;
    }

    try {
      await Promise.race([
        this.manager.destroy(),
        new Promise((resolve) => setTimeout(resolve, 2000)),
      ]);
    } catch {
      // Bounded manager destroy fallback
    }

    if (targetContainer) {
      try {
        targetContainer.replaceChildren();
      } catch {}
    }
    endCadPerfPhase("destroy");
  }
}

function extractDxfOrDwgFonts(inputBytes: ArrayBuffer | Uint8Array, extension: string): string[] {
  const bytes = inputBytes instanceof Uint8Array ? inputBytes : new Uint8Array(inputBytes);
  const isDxf = extension.includes("dxf") || bytes[0] === 0x20 || bytes[0] === 0x30;
  if (!isDxf) return [];

  try {
    const text = new TextDecoder("utf-8", { fatal: false }).decode(bytes);
    const lines = text.replace(/\r\n?/g, "\n").split("\n");
    const styleFontMap = new Map<string, string>();
    const usedStyles = new Set<string>();

    let inTableStyle = false;
    let currentStyleName = "";
    let currentFont = "";

    for (let i = 0; i + 1 < lines.length; i += 2) {
      const code = Number.parseInt(lines[i].trim(), 10);
      const val = lines[i + 1]?.trim() ?? "";

      if (code === 0 && val === "TABLE") {
        if (i + 3 < lines.length && Number.parseInt(lines[i + 2].trim(), 10) === 2 && lines[i + 3].trim().toUpperCase() === "STYLE") {
          inTableStyle = true;
        }
      } else if (code === 0 && val === "ENDTAB") {
        if (currentStyleName && currentFont) {
          styleFontMap.set(currentStyleName.toUpperCase(), currentFont);
        }
        inTableStyle = false;
      }

      if (inTableStyle) {
        if (code === 0 && val === "STYLE") {
          if (currentStyleName && currentFont) {
            styleFontMap.set(currentStyleName.toUpperCase(), currentFont);
          }
          currentStyleName = "";
          currentFont = "";
        } else if (code === 2) {
          currentStyleName = val;
        } else if (code === 3) {
          currentFont = val;
        }
      }

      // Entity style kullanımı (Group code 7)
      if (code === 7 && val) {
        usedStyles.add(val.toUpperCase());
      }
    }

    if (currentStyleName && currentFont) {
      styleFontMap.set(currentStyleName.toUpperCase(), currentFont);
    }

    const requestedFonts = new Set<string>();
    for (const styleName of usedStyles) {
      const fontFile = styleFontMap.get(styleName);
      if (fontFile) {
        requestedFonts.add(fontFile);
      } else {
        requestedFonts.add(styleName);
      }
    }

    if (requestedFonts.size === 0) {
      for (const fontFile of styleFontMap.values()) {
        requestedFonts.add(fontFile);
      }
    }

    return Array.from(requestedFonts);
  } catch {
    return [];
  }
}
