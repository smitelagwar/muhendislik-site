"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  AlertCircle,
  Eye,
  Layers,
  Loader2,
  Magnet,
  Maximize,
  RotateCcw,
  Ruler,
  Square,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  CadUpstreamAdapter,
  CadUpstreamAdapterError,
  CAD_BACKGROUND_COLORS,
  type CadBackgroundColorOption,
  type CadDistanceMeasurementSnapshot,
  type CadLayerItem,
  type CadUpstreamDisplayMode,
  type CadUpstreamTheme,
} from "@/lib/dokumantasyon/cad-upstream/adapter";
import {
  CAD_SNAP_MODES,
  createDefaultCadSnapSettings,
  getEnabledCadSnapModes,
  loadCadSnapSettings,
  saveCadSnapSettings,
  type CadSnapSettings,
  type CadSnapSettingsStorage,
} from "@/lib/dokumantasyon/cad-upstream/snap-settings";
import { resolveCadUpstreamTimeoutMs } from "@/lib/dokumantasyon/dwg/runtime-policy";
import {
  CadDistanceOverlay,
  type CadDistanceOverlayMeasurement,
} from "./cad-distance-overlay";
import { CadLayerPanel } from "./cad-layer-panel";
import { CadSnapSettingsPanel } from "./cad-snap-settings-panel";

export interface DokCadUpstreamViewerProps {
  accessUrl: string;
  displayName: string;
  fileId: string;
  extension: string;
  sizeBytes: number;
  timeoutMs?: number;
  onReady?: () => void;
  onViewerFailure?: (reason: string) => void;
}

type HostState = "loading" | "ready" | "error";
type ActiveTool = "distance" | "area" | null;

let previousCadUpstreamTeardown: Promise<void> = Promise.resolve();

function resolveSiteTheme(): CadUpstreamTheme {
  if (typeof document === "undefined") return "dark";
  const root = document.documentElement;
  if (root.classList.contains("dark")) return "dark";
  if (root.classList.contains("light")) return "light";
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function resolveSnapStorage(): CadSnapSettingsStorage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function failureReason(error: unknown): string {
  if (error instanceof CadUpstreamAdapterError) {
    return `${error.code}:${error.message}`;
  }
  return error instanceof Error
    ? `upstream-error:${error.message}`
    : "upstream-error:Bilinmeyen CAD hatası";
}

function CadDisplayControls({
  displayMode,
  lineWeightVisible,
  backgroundColor,
  onSelectDisplayMode,
  onToggleLineWeight,
  onSelectBackgroundColor,
  compact = false,
}: {
  displayMode: CadUpstreamDisplayMode;
  lineWeightVisible: boolean;
  backgroundColor: CadBackgroundColorOption;
  onSelectDisplayMode: (mode: CadUpstreamDisplayMode) => void;
  onToggleLineWeight: () => void;
  onSelectBackgroundColor: (color: CadBackgroundColorOption) => void;
  compact?: boolean;
}) {
  const buttonClass = compact
    ? "h-6 rounded-md px-2 text-[10px] font-medium"
    : "h-7 px-2 text-[11px]";

  return (
    <div
      className={
        compact
          ? "flex items-center gap-0.5 rounded-md border border-border/40 bg-background/30 p-0.5 text-muted-foreground backdrop-blur-sm"
          : "flex items-center gap-1 rounded-lg border border-border/70 bg-background/90 p-1 shadow-sm backdrop-blur"
      }
      data-cad-display-controls="true"
    >
      <Button
        type="button"
        size="sm"
        variant={displayMode === "source" ? "secondary" : "ghost"}
        className={`${buttonClass} ${
          displayMode === "source" ? "text-foreground" : "text-muted-foreground/70"
        }`}
        aria-pressed={displayMode === "source"}
        title="Gerçek Renk"
        onClick={() => onSelectDisplayMode("source")}
      >
        <Eye className="mr-1 h-3 w-3" />
        Gerçek Renk
      </Button>
      <Button
        type="button"
        size="sm"
        variant={displayMode === "monochrome" ? "secondary" : "ghost"}
        className={`${buttonClass} ${
          displayMode === "monochrome" ? "text-foreground" : "text-muted-foreground/70"
        }`}
        aria-pressed={displayMode === "monochrome"}
        title="Siyah-Beyaz"
        onClick={() => onSelectDisplayMode("monochrome")}
      >
        Siyah-Beyaz
      </Button>
      <span className="mx-0.5 h-3.5 w-px bg-border/60" aria-hidden="true" />
      <Button
        type="button"
        size="sm"
        variant={lineWeightVisible ? "secondary" : "ghost"}
        className={`${buttonClass} ${
          lineWeightVisible ? "text-foreground" : "text-muted-foreground/70"
        }`}
        aria-pressed={lineWeightVisible}
        title="Çizgi kalınlıklarını göster/gizle"
        onClick={onToggleLineWeight}
      >
        Lineweight
      </Button>
      <span className="mx-0.5 h-3.5 w-px bg-border/60" aria-hidden="true" />
      <div className="flex items-center gap-0.5" role="group" aria-label="Arka plan rengi">
        <Button
          type="button"
          size="sm"
          variant={backgroundColor === "autocad" ? "secondary" : "ghost"}
          className={`${buttonClass} ${backgroundColor === "autocad" ? "text-foreground font-medium" : "text-muted-foreground/70"}`}
          aria-pressed={backgroundColor === "autocad"}
          title="AutoCAD Koyu Gri Arka Plan (#212830)"
          onClick={() => onSelectBackgroundColor("autocad")}
          data-testid="cad-bg-autocad"
        >
          <span className="mr-1 inline-block h-2.5 w-2.5 rounded-full border border-white/20 bg-[#212830]" aria-hidden="true" />
          AutoCAD
        </Button>
        <Button
          type="button"
          size="sm"
          variant={backgroundColor === "black" ? "secondary" : "ghost"}
          className={`${buttonClass} ${backgroundColor === "black" ? "text-foreground font-medium" : "text-muted-foreground/70"}`}
          aria-pressed={backgroundColor === "black"}
          title="Siyah Arka Plan (#000000)"
          onClick={() => onSelectBackgroundColor("black")}
          data-testid="cad-bg-black"
        >
          <span className="mr-1 inline-block h-2.5 w-2.5 rounded-full border border-white/20 bg-black" aria-hidden="true" />
          Siyah
        </Button>
        <Button
          type="button"
          size="sm"
          variant={backgroundColor === "white" ? "secondary" : "ghost"}
          className={`${buttonClass} ${backgroundColor === "white" ? "text-foreground font-medium" : "text-muted-foreground/70"}`}
          aria-pressed={backgroundColor === "white"}
          title="Beyaz Arka Plan (#ffffff)"
          onClick={() => onSelectBackgroundColor("white")}
          data-testid="cad-bg-white"
        >
          <span className="mr-1 inline-block h-2.5 w-2.5 rounded-full border border-black/20 bg-white" aria-hidden="true" />
          Beyaz
        </Button>
      </div>
    </div>
  );
}

export function DokCadUpstreamViewer({
  accessUrl,
  displayName,
  fileId,
  extension,
  sizeBytes,
  timeoutMs,
  onReady,
  onViewerFailure,
}: DokCadUpstreamViewerProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const adapterRef = useRef<CadUpstreamAdapter | null>(null);
  const displayModeRef = useRef<CadUpstreamDisplayMode>("source");
  const lineWeightVisibleRef = useRef(false);
  const backgroundColorRef = useRef<CadBackgroundColorOption>("autocad");
  const distanceMeasurementIdRef = useRef(0);
  const [state, setState] = useState<HostState>("loading");
  const [message, setMessage] = useState("MLightCAD hazırlanıyor");
  const [retryKey, setRetryKey] = useState(0);
  const [displayMode, setDisplayMode] = useState<CadUpstreamDisplayMode>("source");
  const [lineWeightVisible, setLineWeightVisible] = useState(false);
  const [backgroundColor, setBackgroundColor] = useState<CadBackgroundColorOption>("autocad");
  const [activeTool, setActiveTool] = useState<ActiveTool>(null);
  const [layers, setLayers] = useState<CadLayerItem[]>([]);
  const [layerPanelOpen, setLayerPanelOpen] = useState(false);
  const [layerQuery, setLayerQuery] = useState("");
  const [snapPanelOpen, setSnapPanelOpen] = useState(false);
  const [snapSettings, setSnapSettings] = useState<CadSnapSettings>(() =>
    createDefaultCadSnapSettings()
  );
  const [distanceSnapshot, setDistanceSnapshot] =
    useState<CadDistanceMeasurementSnapshot | null>(null);
  const [distanceMeasurements, setDistanceMeasurements] = useState<
    CadDistanceOverlayMeasurement[]
  >([]);
  const [, setViewRevision] = useState(0);

  const effectiveTimeoutMs = timeoutMs ?? resolveCadUpstreamTimeoutMs(sizeBytes);

  useEffect(() => {
    setSnapSettings(loadCadSnapSettings(resolveSnapStorage()));
  }, []);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const abortController = new AbortController();
    let cancelled = false;
    let timedOut = false;
    let adapter: CadUpstreamAdapter | null = null;
    let themeObserver: MutationObserver | null = null;
    let systemThemeQuery: MediaQueryList | null = null;
    let syncTheme: (() => void) | null = null;
    let unsubscribeLayers: (() => void) | null = null;
    let unsubscribeViewChanged: (() => void) | null = null;
    let timeoutId: number | null = null;

    const startup = previousCadUpstreamTeardown.then(async () => {
      if (cancelled) return;

      setState("loading");
      setMessage("MLightCAD hazırlanıyor");
      setLayerPanelOpen(false);
      setSnapPanelOpen(false);
      setActiveTool(null);
      setDistanceSnapshot(null);
      setDistanceMeasurements([]);

      const upstreamWork = (async () => {
        setMessage("CAD worker dosyaları doğrulanıyor");
        const createdAdapter = await CadUpstreamAdapter.create({
          container: viewport,
          busyIndicatorHost: viewport,
          theme: resolveSiteTheme(),
        });
        adapter = createdAdapter;
        adapterRef.current = createdAdapter;

        if (cancelled || timedOut || abortController.signal.aborted) {
          adapterRef.current = null;
          await createdAdapter.destroy().catch(() => {});
          adapter = null;
          return;
        }

        syncTheme = () => {
          if (!adapter || cancelled) return;
          adapter.applyTheme(resolveSiteTheme(), viewport);
        };

        themeObserver = new MutationObserver(syncTheme);
        themeObserver.observe(document.documentElement, {
          attributes: true,
          attributeFilter: ["class"],
        });

        systemThemeQuery = window.matchMedia?.("(prefers-color-scheme: dark)") ?? null;
        systemThemeQuery?.addEventListener?.("change", syncTheme);

        setMessage(
          extension.trim().toLowerCase().includes("dwg") ? "DWG açılıyor" : "DXF açılıyor"
        );
        await createdAdapter.open({
          accessUrl,
          displayName,
          extension,
          signal: abortController.signal,
        });

        createdAdapter.setDisplayMode(displayModeRef.current, resolveSiteTheme());
        createdAdapter.setBackgroundColor(backgroundColorRef.current);
        const initialLineWeight = createdAdapter.getLineWeightVisible();
        lineWeightVisibleRef.current = initialLineWeight;
        setLineWeightVisible(initialLineWeight);

        setLayers(createdAdapter.getLayers());
        unsubscribeLayers = createdAdapter.subscribeLayersChanged(() => {
          if (!cancelled && adapterRef.current) {
            setLayers(adapterRef.current.getLayers());
          }
        });
        unsubscribeViewChanged = createdAdapter.subscribeViewChanged(() => {
          if (!cancelled) setViewRevision((value) => value + 1);
        });
      })();

      const deadline = new Promise<never>((_, reject) => {
        timeoutId = window.setTimeout(() => {
          timedOut = true;
          abortController.abort("CAD_UPSTREAM_TIMEOUT");
          reject(
            new CadUpstreamAdapterError(
              "open-timeout",
              `MLightCAD ${Math.round(
                effectiveTimeoutMs / 1000
              )} saniye içinde terminal sonuca ulaşamadı.`
            )
          );
        }, effectiveTimeoutMs);
      });

      try {
        await Promise.race([upstreamWork, deadline]);
        if (timeoutId !== null) window.clearTimeout(timeoutId);
        timeoutId = null;
        if (cancelled || timedOut || abortController.signal.aborted) return;
        setState("ready");
        setMessage("");
        onReady?.();
      } catch (error) {
        if (timeoutId !== null) window.clearTimeout(timeoutId);
        timeoutId = null;
        themeObserver?.disconnect();
        if (systemThemeQuery && syncTheme) {
          systemThemeQuery.removeEventListener?.("change", syncTheme);
        }
        if (unsubscribeLayers) {
          unsubscribeLayers();
          unsubscribeLayers = null;
        }
        if (unsubscribeViewChanged) {
          unsubscribeViewChanged();
          unsubscribeViewChanged = null;
        }

        if (adapter) {
          if (adapterRef.current === adapter) adapterRef.current = null;
          await adapter.destroy().catch(() => {});
          adapter = null;
        }

        void upstreamWork.catch(() => undefined);

        if (cancelled || (abortController.signal.aborted && !timedOut)) return;

        const reason = failureReason(error);
        setState("error");
        setMessage(
          reason.split(":").slice(1).join(":") || "CAD görüntüleyici başlatılamadı."
        );
        onViewerFailure?.(reason);
      }
    });

    return () => {
      cancelled = true;
      abortController.abort("CAD_UPSTREAM_UNMOUNT");
      if (timeoutId !== null) window.clearTimeout(timeoutId);
      themeObserver?.disconnect();
      if (systemThemeQuery && syncTheme) {
        systemThemeQuery.removeEventListener?.("change", syncTheme);
      }
      if (unsubscribeLayers) {
        unsubscribeLayers();
        unsubscribeLayers = null;
      }
      if (unsubscribeViewChanged) {
        unsubscribeViewChanged();
        unsubscribeViewChanged = null;
      }

      if (adapterRef.current === adapter) adapterRef.current = null;
      previousCadUpstreamTeardown = startup
        .catch(() => undefined)
        .then(async () => {
          if (adapter) {
            await adapter.destroy().catch(() => {});
            adapter = null;
          }
        });
    };
  }, [
    accessUrl,
    displayName,
    effectiveTimeoutMs,
    extension,
    fileId,
    retryKey,
    onReady,
    onViewerFailure,
  ]);

  const handleStartDistanceRef = useRef<() => Promise<void>>(() => Promise.resolve());

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }

      if (event.key === "Escape") {
        setLayerPanelOpen(false);
        setSnapPanelOpen(false);
        setActiveTool(null);
        setDistanceSnapshot(null);
        void adapterRef.current?.cancelActiveCommand();
        return;
      }

      if (
        (event.key === "t" || event.key === "T" || event.code === "KeyT") &&
        !event.ctrlKey &&
        !event.metaKey &&
        !event.altKey
      ) {
        if (state === "ready") {
          event.preventDefault();
          void handleStartDistanceRef.current?.();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [state]);

  const selectDisplayMode = (mode: CadUpstreamDisplayMode) => {
    displayModeRef.current = mode;
    setDisplayMode(mode);
    adapterRef.current?.setDisplayMode(mode, resolveSiteTheme());
  };

  const toggleLineWeight = async () => {
    const adapter = adapterRef.current;
    if (!adapter) return;
    const next = !lineWeightVisibleRef.current;
    try {
      await adapter.setLineWeightVisible(next);
      lineWeightVisibleRef.current = next;
      setLineWeightVisible(next);
    } catch (error) {
      console.warn("MLightCAD lineweight değiştirilemedi", error);
    }
  };

  const selectBackgroundColor = (color: CadBackgroundColorOption) => {
    backgroundColorRef.current = color;
    setBackgroundColor(color);
    adapterRef.current?.setBackgroundColor(color);
  };

  const handleSnapSettingsChange = (next: CadSnapSettings) => {
    setSnapSettings(next);
    saveCadSnapSettings(resolveSnapStorage(), next);
    adapterRef.current?.updateDistanceMeasurementSnapModes(
      getEnabledCadSnapModes(next)
    );
  };

  const handleZoomToFit = () => {
    adapterRef.current?.zoomToFit();
  };

  const handleStartDistance = async () => {
    const adapter = adapterRef.current;
    if (!adapter) return;
    if (activeTool === "distance") {
      await adapter.cancelActiveCommand();
      return;
    }

    const started = await adapter.startDistanceMeasurement(
      getEnabledCadSnapModes(snapSettings),
      {
        onSnapshot: (snapshot) => setDistanceSnapshot(snapshot),
        onComplete: (measurement) => {
          distanceMeasurementIdRef.current += 1;
          setDistanceMeasurements((current) => [
            ...current,
            {
              ...measurement,
              id: `distance-${distanceMeasurementIdRef.current}`,
            },
          ]);
          setDistanceSnapshot(null);
          setActiveTool((current) => (current === "distance" ? null : current));
        },
        onCancel: () => {
          setDistanceSnapshot(null);
          setActiveTool((current) => (current === "distance" ? null : current));
        },
      }
    );
    setActiveTool(started ? "distance" : null);
  };
  handleStartDistanceRef.current = handleStartDistance;

  const handleStartArea = async () => {
    const adapter = adapterRef.current;
    if (!adapter) return;
    if (activeTool === "area") {
      setActiveTool(null);
      await adapter.cancelActiveCommand();
      return;
    }
    await adapter.cancelActiveCommand();
    setDistanceSnapshot(null);
    setActiveTool("area");
    try {
      await adapter.measureArea();
    } finally {
      setActiveTool(null);
    }
  };

  const handleClearMeasurements = async () => {
    setActiveTool(null);
    setDistanceSnapshot(null);
    setDistanceMeasurements([]);
    distanceMeasurementIdRef.current = 0;
    await adapterRef.current?.clearMeasurements();
  };

  const handleToggleLayer = (name: string, visible: boolean) => {
    adapterRef.current?.setLayerVisible(name, visible);
  };

  const handleIsolateLayer = (name: string) => {
    adapterRef.current?.isolateLayer(name);
  };

  const handleShowAllLayers = () => {
    adapterRef.current?.showAllLayers();
  };

  const handleHideAllLayers = () => {
    adapterRef.current?.hideAllLayers();
  };

  const handleResetLayers = () => {
    adapterRef.current?.resetLayersToSource();
  };

  const handleToggleLayerPanel = () => {
    setLayerPanelOpen((open) => {
      const next = !open;
      if (next) setSnapPanelOpen(false);
      return next;
    });
  };

  const handleToggleSnapPanel = () => {
    setSnapPanelOpen((open) => {
      const next = !open;
      if (next) setLayerPanelOpen(false);
      return next;
    });
  };

  const toolbarTarget =
    state === "ready" && typeof document !== "undefined"
      ? document.getElementById("cad-studio-toolbar-slot")
      : null;

  const displayControls =
    state === "ready" ? (
      <CadDisplayControls
        displayMode={displayMode}
        lineWeightVisible={lineWeightVisible}
        backgroundColor={backgroundColor}
        onSelectDisplayMode={selectDisplayMode}
        onToggleLineWeight={() => void toggleLineWeight()}
        onSelectBackgroundColor={selectBackgroundColor}
        compact={Boolean(toolbarTarget)}
      />
    ) : null;

  const selectedSnapModes = CAD_SNAP_MODES.filter((mode) => snapSettings.modes[mode]).join(",");

  return (
    <section
      className="relative flex h-full min-h-0 w-full min-w-0 flex-1 overflow-hidden bg-background"
      style={{ backgroundColor: CAD_BACKGROUND_COLORS[backgroundColor].hex }}
      data-cad-upstream-host="true"
      data-file-id={fileId}
      data-cad-upstream-state={state}
      data-cad-color-mode={displayMode}
      data-cad-background-color={backgroundColor}
      data-cad-lineweight={lineWeightVisible ? "on" : "off"}
      data-cad-active-tool={activeTool ?? "none"}
      data-cad-distance-phase={distanceSnapshot?.phase ?? "inactive"}
      data-cad-layer-panel-open={layerPanelOpen ? "true" : "false"}
      data-cad-snap-panel-open={snapPanelOpen ? "true" : "false"}
      data-cad-snap-enabled={snapSettings.enabled ? "true" : "false"}
      data-cad-snap-modes={snapSettings.enabled ? selectedSnapModes : ""}
      data-cad-snap-selected-modes={selectedSnapModes}
      data-cad-timeout-ms={effectiveTimeoutMs}
    >
      <div
        ref={viewportRef}
        className="absolute inset-0"
        aria-label={`${displayName} CAD görünümü`}
      />

      {state === "ready" ? (
        <CadDistanceOverlay
          snapshot={distanceSnapshot}
          measurements={distanceMeasurements}
          projectPoint={(point) => adapterRef.current?.projectWorldPoint(point) ?? null}
        />
      ) : null}

      {displayControls && toolbarTarget
        ? createPortal(displayControls, toolbarTarget)
        : displayControls
          ? <div className="absolute left-3 top-3 z-20">{displayControls}</div>
          : null}

      {state === "ready" ? (
        <div
          className="absolute left-3 top-14 z-20 flex flex-col gap-1 rounded-lg border border-border/70 bg-background/90 p-1 shadow-sm backdrop-blur"
          data-testid="cad-left-quick-rail"
          role="toolbar"
          aria-label="CAD hızlı erişim araçları"
        >
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0"
            title="Çizimi ekrana sığdır"
            onClick={handleZoomToFit}
            data-testid="cad-tool-fit"
            aria-label="Görünüme sığdır"
          >
            <Maximize className="h-4 w-4" />
          </Button>

          <span className="my-0.5 h-px w-full bg-border" aria-hidden="true" />

          <Button
            type="button"
            size="sm"
            variant={activeTool === "distance" ? "default" : "ghost"}
            className="h-8 w-8 p-0"
            title="Mesafe Ölç [T] (Nokta için tıklayın veya basılı tutun)"
            onClick={() => void handleStartDistance()}
            data-testid="cad-tool-distance"
            aria-label="Mesafe ölç"
            aria-pressed={activeTool === "distance"}
          >
            <Ruler className="h-4 w-4" />
          </Button>

          <Button
            type="button"
            size="sm"
            variant={activeTool === "area" ? "default" : "ghost"}
            className="h-8 w-8 p-0"
            title="Alan Ölç (Çokgen noktalarını seçin)"
            onClick={() => void handleStartArea()}
            data-testid="cad-tool-area"
            aria-label="Alan ölç"
            aria-pressed={activeTool === "area"}
          >
            <Square className="h-4 w-4" />
          </Button>

          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0 hover:text-destructive"
            title="Ölçümleri Temizle"
            onClick={() => void handleClearMeasurements()}
            data-testid="cad-tool-clear"
            aria-label="Ölçümleri temizle"
          >
            <Trash2 className="h-4 w-4" />
          </Button>

          <span className="my-0.5 h-px w-full bg-border" aria-hidden="true" />

          <Button
            type="button"
            size="sm"
            variant={snapPanelOpen ? "secondary" : "ghost"}
            className={`h-8 w-8 p-0 ${snapSettings.enabled ? "" : "text-muted-foreground/45"}`}
            title="Nesne Yakalama Ayarları"
            onClick={handleToggleSnapPanel}
            data-testid="cad-tool-snap-settings"
            aria-label="Nesne yakalama ayarları"
            aria-pressed={snapPanelOpen}
          >
            <Magnet className="h-4 w-4" />
          </Button>

          <Button
            type="button"
            size="sm"
            variant={layerPanelOpen ? "secondary" : "ghost"}
            className="h-8 w-8 p-0"
            title="Katmanlar"
            onClick={handleToggleLayerPanel}
            data-testid="cad-tool-layers"
            aria-label="Katmanlar"
            aria-pressed={layerPanelOpen}
          >
            <Layers className="h-4 w-4" />
          </Button>
        </div>
      ) : null}

      {state === "ready" && snapPanelOpen ? (
        <CadSnapSettingsPanel
          settings={snapSettings}
          onChange={handleSnapSettingsChange}
          onClose={() => setSnapPanelOpen(false)}
        />
      ) : null}

      {state === "ready" && layerPanelOpen ? (
        <CadLayerPanel
          layers={layers}
          query={layerQuery}
          onQueryChange={setLayerQuery}
          onToggleLayer={handleToggleLayer}
          onIsolateLayer={handleIsolateLayer}
          onShowAll={handleShowAllLayers}
          onHideAll={handleHideAllLayers}
          onResetSource={handleResetLayers}
          onClose={() => setLayerPanelOpen(false)}
        />
      ) : null}

      {state === "loading" ? (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-background/72 backdrop-blur-[1px]">
          <div className="flex items-center gap-2 rounded-lg border border-border/70 bg-card/90 px-3 py-2 text-xs text-muted-foreground shadow-sm">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>{message}</span>
          </div>
        </div>
      ) : null}

      {state === "error" ? (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-background p-4">
          <div className="flex max-w-md flex-col items-center gap-3 text-center">
            <AlertCircle className="h-7 w-7 text-destructive" />
            <div>
              <p className="text-sm font-semibold text-foreground">CAD görünümü açılamadı</p>
              <p className="mt-1 text-xs text-muted-foreground">{message}</p>
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="gap-2"
              onClick={() => setRetryKey((value) => value + 1)}
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Tekrar dene
            </Button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
