"use client";

import type {
  AcApDocManager,
  AcApOpenDatabaseOptions,
  AcApLayerStore,
} from "@mlightcad/cad-simple-viewer";

export const CAD_UPSTREAM_WORKER_URLS = {
  mtextRender: "/cad-upstream/mtext-renderer-worker.js",
  dwgParser: "/cad-upstream/libredwg-parser-worker.js",
} as const;

export const CAD_UPSTREAM_SUPPORTED_EXTENSIONS = new Set([".dxf", ".dwg"]);
const CAD_UPSTREAM_BLANK_VALIDATION_IDLE_MS = 2_500;

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
  private readonly initialLayerSnapshot = new Map<string, { isOn: boolean; isFrozen: boolean }>();

  private constructor(
    private readonly manager: AcApDocManager,
    private readonly Viewer: CadSimpleViewerModule
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

    // Enforce read-only site policy for preview: hide command line, ribbon, toolbar
    Viewer.AcApSettingManager.instance.isShowCommandLine = false;
    Viewer.AcApSettingManager.instance.isShowRibbon = false;
    Viewer.AcApSettingManager.instance.isShowToolbar = false;

    Viewer.acedApplyUiTheme(options.theme ?? "dark", options.busyIndicatorHost ?? options.container);

    const manager = Viewer.AcApDocManager.createInstance({
      container: options.container,
      busyIndicatorHost: options.busyIndicatorHost ?? options.container,
      autoResize: true,
      webworkerFileUrls: CAD_UPSTREAM_WORKER_URLS,
      checkWorkersOnInit: true,
      useMainThreadDraw: options.useMainThreadDraw ?? false,
    });

    if (!manager) {
      throw new CadUpstreamAdapterError("open-failed", "MLightCAD document manager başlatılamadı.");
    }

    if (!(await manager.areWorkersReady())) {
      await manager.destroy();
      throw new CadUpstreamAdapterError(
        "worker-unavailable",
        "MLightCAD worker readiness kontrolü başarısız."
      );
    }

    const adapter = new CadUpstreamAdapter(manager, Viewer);
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
      throw new CadUpstreamAdapterError("adapter-destroyed", "CAD adapter kapatıldı.");
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

    // Upstream openDocument() can report success before progressive scene
    // conversion finishes, so entityCount===0 is NOT immediately a failure.
    // Only reject the document when the upstream view itself confirms it is
    // idle and its rendered scene still contains no entities.
    const idle = await this.manager.curView.waitUntilIdle(
      CAD_UPSTREAM_BLANK_VALIDATION_IDLE_MS
    );
    if (idle && this.manager.curView.stats.summary.entityCount === 0) {
      throw new CadUpstreamAdapterError(
        "blank-document",
        `MLightCAD dosyayı açtı ancak çizilebilir geometri üretmedi: ${options.displayName}`
      );
    }

    // Capture initial layer states via public layerStore
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

    // Enforce read-only PAN view mode and clear selection set
    if (this.manager.curView) {
      this.manager.curView.mode = this.Viewer.AcEdViewMode.PAN;
      this.manager.curView.selectionSet?.clear();
      this.enforceCadMouseBindings();
      this.setBackgroundColor(this.backgroundColorOption);
    }

    this.applyDisplayMode();
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

  getDisplayMode(): CadUpstreamDisplayMode {
    return this.displayMode;
  }

  setDisplayMode(mode: CadUpstreamDisplayMode, theme: CadUpstreamTheme = this.displayTheme): void {
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
    const view = this.manager.curView as unknown as {
      canvas?: HTMLCanvasElement;
      canvas2d?: HTMLCanvasElement;
    } | undefined;

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

  // --- Public Layer Store Integration ---

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

  // --- Native Measurement & Command Execution ---

  /**
   * Enforces canonical CAD navigation bindings:
   * - Middle mouse button (wheel press & drag): PAN
   * - Left mouse button (drag): NO PAN (does not drag drawing)
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
    await this.manager.commandManager.cancelActive().catch(() => {});
    if (this.manager.curView) {
      this.manager.curView.mode = this.Viewer.AcEdViewMode.PAN;
      this.manager.curView.selectionSet?.clear();
      this.enforceCadMouseBindings();
    }
  }

  async measureDistance(): Promise<void> {
    if (this.destroyed) return;
    await this.cancelActiveCommand();
    try {
      await this.manager.executeCommandString("measuredistance");
    } finally {
      if (this.manager.curView) {
        this.manager.curView.mode = this.Viewer.AcEdViewMode.PAN;
        this.manager.curView.selectionSet?.clear();
        this.enforceCadMouseBindings();
      }
    }
  }

  async measureArea(): Promise<void> {
    if (this.destroyed) return;
    await this.cancelActiveCommand();
    try {
      await this.manager.executeCommandString("measurearea");
    } finally {
      if (this.manager.curView) {
        this.manager.curView.mode = this.Viewer.AcEdViewMode.PAN;
        this.manager.curView.selectionSet?.clear();
        this.enforceCadMouseBindings();
      }
    }
  }

  async clearMeasurements(): Promise<void> {
    if (this.destroyed) return;
    await this.cancelActiveCommand();
    await this.manager.executeCommandString("clearmeasurements").catch(() => {});
    if (this.manager.curView) {
      this.manager.curView.mode = this.Viewer.AcEdViewMode.PAN;
      this.manager.curView.selectionSet?.clear();
      this.enforceCadMouseBindings();
    }
  }

  async destroy(): Promise<void> {
    if (this.destroyed) return;
    await this.cancelActiveCommand();
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
