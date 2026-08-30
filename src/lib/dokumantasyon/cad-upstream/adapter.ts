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
import { buildCadSnapPrimitives } from "./snap-catalog";
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

export const CAD_UPSTREAM_WORKER_URLS = {
  mtextRender: "/cad-upstream/mtext-renderer-worker.js",
  dwgParser: "/cad-upstream/libredwg-parser-worker.js",
} as const;

export const CAD_UPSTREAM_SUPPORTED_EXTENSIONS = new Set([".dxf", ".dwg"]);
const CAD_UPSTREAM_BLANK_VALIDATION_IDLE_MS = 2_500;
const CAD_MOBILE_PINCH_ZOOM_SPEED = 1;

type CadMeasurementCommand = "distance" | "area";

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

export type CadUpstreamErrorCode =
  | "unsupported-extension"
  | "worker-unavailable"
  | "source-fetch-failed"
  | "source-empty"
  | "open-timeout"
  | "open-failed"
  | "blank-document"
  | "adapter-destroyed";

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
}

type CadSimpleViewerModule = typeof import("@mlightcad/cad-simple-viewer");

let viewerModulePromise: Promise<CadSimpleViewerModule> | null = null;
let libreDwgRegistrationPromise: Promise<void> | null = null;
let engineEnhancementsInitialized = false;

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

async function loadViewerModule(): Promise<CadSimpleViewerModule> {
  if (!viewerModulePromise) {
    viewerModulePromise = import("@mlightcad/cad-simple-viewer")
      .then(async (Viewer) => {
        await initializeCadEngineEnhancements(Viewer);
        return Viewer;
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
  return bytes;
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
  private snapLayerUnsubscribe: (() => void) | null = null;
  private snapCatalog: CadSnapPrimitive[] = [];
  private readonly snapEngine = new CadSnapEngine();
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
    const Viewer = await loadViewerModule();
    await registerLibreDwgConverter();

    const workersReachable = await Viewer.AcApDocManager.checkWebworkerReadiness(
      CAD_UPSTREAM_WORKER_URLS
    );
    if (!workersReachable) {
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

    const manager = Viewer.AcApDocManager.createInstance({
      container: options.container,
      busyIndicatorHost: options.busyIndicatorHost ?? options.container,
      autoResize: true,
      webworkerFileUrls: CAD_UPSTREAM_WORKER_URLS,
      checkWorkersOnInit: true,
      useMainThreadDraw: options.useMainThreadDraw ?? false,
    });

    if (!manager) {
      throw new CadUpstreamAdapterError(
        "open-failed",
        "MLightCAD document manager başlatılamadı."
      );
    }

    if (!(await manager.areWorkersReady())) {
      await manager.destroy();
      throw new CadUpstreamAdapterError(
        "worker-unavailable",
        "MLightCAD worker readiness kontrolü başarısız."
      );
    }

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

    if (!(await this.manager.areWorkersReady())) {
      throw new CadUpstreamAdapterError(
        "worker-unavailable",
        "MLightCAD worker dosyaları çizim açılmadan önce doğrulanamadı."
      );
    }

    const bytes = await fetchCadSource(options.accessUrl, options.signal);
    const openOptions: AcApOpenDatabaseOptions = {
      minimumChunkSize: 1000,
      progressiveRendering: true,
      ...(options.databaseOptions ?? {}),
      mode: this.Viewer.AcEdOpenMode.Read,
    };

    const success = await this.manager.openDocument(
      options.displayName,
      bytes,
      openOptions
    );

    if (!success) {
      throw new CadUpstreamAdapterError(
        "open-failed",
        `MLightCAD dosyayı açamadı: ${options.displayName}`
      );
    }

    const idle = await this.manager.curView.waitUntilIdle(
      CAD_UPSTREAM_BLANK_VALIDATION_IDLE_MS
    );
    if (idle && this.manager.curView.stats.summary.entityCount === 0) {
      throw new CadUpstreamAdapterError(
        "blank-document",
        `MLightCAD dosyayı açtı ancak çizilebilir geometri üretmedi: ${options.displayName}`
      );
    }

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

    this.restorePanMode();
    this.configureMobilePinchZoom();
    this.configureSnapRuntime();
    this.configureMobileGestureGuard();
    this.setBackgroundColor(this.backgroundColorOption);
    this.applyDisplayMode();
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
    this.snapLayerUnsubscribe?.();
    this.snapLayerUnsubscribe = null;

    const database = this.manager.curDocument?.database;
    this.snapCatalog = buildCadSnapPrimitives(database);
    this.rebuildVisibleSnapIndex();

    this.distanceMeasurementController = new CadPressHoldDistanceController(
      this.interactionHost,
      {
        resolvePoint: (screenPoint, snapModes) =>
          this.resolveDistancePoint(screenPoint, snapModes),
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

  private setCameraInteractionEnabled(enabled: boolean): void {
    const view = this.getActiveLayoutView();
    if (view) view.enabled = enabled;
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
    await this.manager.commandManager.cancelActive().catch(() => {});
    this.restorePanMode();
  }

  async measureArea(): Promise<void> {
    if (this.destroyed) return;
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

  async destroy(): Promise<void> {
    if (this.destroyed) return;
    await this.cancelActiveCommand();
    this.mobileGestureGuard?.destroy();
    this.mobileGestureGuard = null;
    this.distanceMeasurementController?.destroy();
    this.distanceMeasurementController = null;
    this.snapLayerUnsubscribe?.();
    this.snapLayerUnsubscribe = null;
    this.snapCatalog = [];
    this.snapEngine.clear();
    this.initialLayerSnapshot.clear();
    this.displayMode = "source";
    this.applyDisplayMode();
    if (this.container) {
      delete (this.container as unknown as { __cadAdapter?: CadUpstreamAdapter }).__cadAdapter;
      this.container = null;
    }
    this.destroyed = true;
    await this.manager.destroy();
  }
}
