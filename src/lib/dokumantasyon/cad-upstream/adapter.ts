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
    viewerModulePromise = import("@mlightcad/cad-simple-viewer").catch((error) => {
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
  private sourceCanvasFilter: string | null = null;
  private lineWeightVisible = false;
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
  }

  isReady(): boolean {
    return !this.destroyed && Boolean(this.manager.curDocument);
  }

  zoomToFit(): void {
    if (this.destroyed) return;
    this.manager.curView?.zoomToFitDrawing?.();
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
    this.destroyed = true;
    await this.manager.destroy();
  }
}
