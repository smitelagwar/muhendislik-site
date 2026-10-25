"use client";

import React, { useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";
import {
  Eye,
  EyeOff,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Box,
  Layers,
  Columns2,
  Scissors,
  AlertTriangle,
} from "lucide-react";
import type {
  CameraPresetId,
  DetailModel,
  LayerVisibilityMask,
} from "@/lib/simulations/core/types";
import type {
  SimulationSectionState,
  WorkspaceLayoutMode,
} from "@/lib/simulations/state/view-reducer";
import {
  createSimulationThreeScene,
  isWebGLAvailable,
  type SimulationEngineDiagnostics,
  type SimulationThreeController,
} from "@/lib/simulations/engine/three-column-viewer";
import { Drawing2DPreview } from "./drawing-2d";

declare global {
  interface Window {
    __simulationController?: SimulationThreeController | null;
    __simulationDiagnostics?: SimulationEngineDiagnostics | null;
  }
}

const CAMERA_PRESETS: ReadonlyArray<{ id: CameraPresetId; label: string }> = [
  { id: "isometric", label: "İzometrik" },
  { id: "front", label: "Ön" },
  { id: "right", label: "Sağ" },
  { id: "top", label: "Üst" },
];

export default function SimulationViewer({
  model,
  layers,
  selectedPartId,
  section,
  explodePercent,
  activePreset,
  viewTab,
  focusTrigger,
  onToggleConcrete,
  onSelectPreset,
  onSelectPart,
  onChangeViewTab,
  onToggleSection,
  onChangeSectionElevation,
  onResetAll,
}: {
  model: DetailModel;
  layers: LayerVisibilityMask;
  selectedPartId: string | null;
  section: SimulationSectionState;
  explodePercent: number;
  activePreset: CameraPresetId;
  viewTab: WorkspaceLayoutMode;
  focusTrigger: number;
  onToggleConcrete: () => void;
  onSelectPreset: (preset: CameraPresetId) => void;
  onSelectPart: (partId: string | null) => void;
  onChangeViewTab: (tab: WorkspaceLayoutMode) => void;
  onToggleSection: (enabled: boolean) => void;
  onChangeSectionElevation: (elevationZMm: number) => void;
  onResetAll: () => void;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const controllerRef = useRef<SimulationThreeController | null>(null);
  const onSelectPartRef = useRef(onSelectPart);

  useEffect(() => {
    onSelectPartRef.current = onSelectPart;
  }, [onSelectPart]);

  const { resolvedTheme } = useTheme();

  const [webglStatus, setWebglStatus] = useState<
    "ready" | "unsupported" | "context-lost"
  >(() =>
    typeof window !== "undefined" && !isWebGLAvailable()
      ? "unsupported"
      : "ready",
  );
  const [diagnostics, setDiagnostics] =
    useState<SimulationEngineDiagnostics | null>(null);
  const [retryToken, setRetryToken] = useState(0);
  const autoRestoreAttemptedRef = useRef(false);

  const isDark = resolvedTheme !== "light";
  const concreteVisible = layers.concrete;

  useEffect(() => {
    const container = containerRef.current;
    if (!container || webglStatus !== "ready") return;

    let controller: SimulationThreeController | null = null;
    try {
      controller = createSimulationThreeScene({
        container,
        model,
        initialLayers: layers,
        initialSelectedPartId: selectedPartId,
        initialSection: section,
        initialExplodePercent: explodePercent,
        isDarkTheme: isDark,
        onDiagnosticsChange: (diag) => {
          setDiagnostics(diag);
          if (typeof window !== "undefined") {
            window.__simulationDiagnostics = diag;
          }
        },
        onPartPicked: (pickedPartId) => {
          onSelectPartRef.current(pickedPartId);
        },
        onContextLost: () => {
          if (!autoRestoreAttemptedRef.current) {
            autoRestoreAttemptedRef.current = true;
            setRetryToken((prev) => prev + 1);
            return;
          }
          setWebglStatus("context-lost");
        },
      });
      controllerRef.current = controller;
      if (typeof window !== "undefined") {
        window.__simulationController = controller;
        window.__simulationDiagnostics = controller.getDiagnostics();
      }
    } catch {
      queueMicrotask(() => setWebglStatus("unsupported"));
    }

    return () => {
      if (controller) {
        controller.dispose();
      }
      controllerRef.current = null;
      if (typeof window !== "undefined") {
        window.__simulationController = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [model, retryToken, webglStatus]);

  useEffect(() => {
    controllerRef.current?.setLayerVisibility(layers);
  }, [layers]);

  useEffect(() => {
    controllerRef.current?.setSelectedPartId(selectedPartId);
  }, [selectedPartId]);

  useEffect(() => {
    controllerRef.current?.setSectionState(section);
  }, [section]);

  useEffect(() => {
    controllerRef.current?.setExplodePercent(explodePercent);
  }, [explodePercent]);

  useEffect(() => {
    controllerRef.current?.setCameraPreset(activePreset);
  }, [activePreset]);

  useEffect(() => {
    controllerRef.current?.setThemeMode(isDark);
  }, [isDark]);

  useEffect(() => {
    if (focusTrigger > 0) {
      controllerRef.current?.focusSelectedPart();
    }
  }, [focusTrigger]);

  const handleSelectPreset = (preset: CameraPresetId) => {
    onSelectPreset(preset);
    controllerRef.current?.setCameraPreset(preset);
  };

  const handleFit = () => {
    controllerRef.current?.fitToModel();
  };

  const handleZoom = (dir: "in" | "out") => {
    controllerRef.current?.zoomByStep(dir);
  };

  const handleReset = () => {
    onResetAll();
    controllerRef.current?.resetView();
  };

  const handleRetryWebGL = () => {
    if (!isWebGLAvailable()) {
      setWebglStatus("unsupported");
      return;
    }
    // Kullanıcı elle yeniden denediğinde otomatik tek seferlik geri yükleme hakkı yenilenir
    autoRestoreAttemptedRef.current = false;
    setWebglStatus("ready");
    setRetryToken((prev) => prev + 1);
  };

  const show3DPane = viewTab === "split" || viewTab === "3d";
  const show2DPane = viewTab === "split" || viewTab === "2d";

  return (
    <div className="space-y-4" data-testid="simulation-viewer-root">
      {/* Üst Araç Çubuğu (Kompakt Stüdyo Çubuğu) */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border/80 dark:border-purple-500/20 bg-card/90 dark:bg-[#110e24]/90 p-2 sm:p-2.5 shadow-sm">
        {/* Görünüm Modu (3B+2B Eşzamanlı / 3B Sahne / 2B Şema), Beton ve Kesit */}
        <div className="flex flex-wrap items-center gap-1.5">
          <div
            className="inline-flex flex-wrap rounded-lg border border-border/80 dark:border-white/10 bg-muted/60 dark:bg-[#181432] p-0.5"
            role="tablist"
            aria-label="Görünüm modu seçimi"
          >
            <button
              type="button"
              role="tab"
              aria-selected={viewTab === "split"}
              data-testid="sim-tab-split"
              onClick={() => onChangeViewTab("split")}
              className={`min-h-[36px] rounded-md px-2.5 py-1 text-xs font-bold transition-all inline-flex items-center gap-1.5 ${
                viewTab === "split"
                  ? "bg-purple-600 text-white shadow-sm"
                  : "text-muted-foreground dark:text-zinc-300 hover:text-foreground dark:hover:text-white"
              }`}
            >
              <Columns2 className="h-3.5 w-3.5" />
              <span>2B + 3B</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={viewTab === "3d"}
              data-testid="sim-tab-3d"
              onClick={() => onChangeViewTab("3d")}
              className={`min-h-[36px] rounded-md px-2.5 py-1 text-xs font-bold transition-all inline-flex items-center gap-1.5 ${
                viewTab === "3d"
                  ? "bg-purple-600 text-white shadow-sm"
                  : "text-muted-foreground dark:text-zinc-300 hover:text-foreground dark:hover:text-white"
              }`}
            >
              <Box className="h-3.5 w-3.5" />
              <span>3B Sahne</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={viewTab === "2d"}
              data-testid="sim-tab-2d"
              onClick={() => onChangeViewTab("2d")}
              className={`min-h-[36px] rounded-md px-2.5 py-1 text-xs font-bold transition-all inline-flex items-center gap-1.5 ${
                viewTab === "2d"
                  ? "bg-purple-600 text-white shadow-sm"
                  : "text-muted-foreground dark:text-zinc-300 hover:text-foreground dark:hover:text-white"
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              <span>2B Çizim</span>
            </button>
          </div>

          <button
            type="button"
            data-testid="toggle-concrete-btn"
            aria-pressed={!concreteVisible}
            onClick={onToggleConcrete}
            className={`min-h-[38px] inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1 text-xs font-bold transition-all ${
              concreteVisible
                ? "border-purple-500/40 bg-purple-500/15 text-foreground dark:text-purple-100 hover:bg-purple-500/25"
                : "border-amber-500/50 bg-amber-500/20 text-amber-700 dark:text-amber-200 hover:bg-amber-500/30"
            }`}
          >
            {concreteVisible ? (
              <>
                <EyeOff className="h-3.5 w-3.5 text-purple-400" />
                <span>Betonu Gizle</span>
              </>
            ) : (
              <>
                <Eye className="h-3.5 w-3.5 text-amber-400" />
                <span>Betonu Göster</span>
              </>
            )}
          </button>

          <button
            type="button"
            data-testid="toolbar-toggle-section-btn"
            aria-pressed={section.enabled}
            onClick={() => onToggleSection(!section.enabled)}
            className={`min-h-[38px] inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1 text-xs font-bold transition-all ${
              section.enabled
                ? "border-cyan-400 bg-cyan-500/20 text-cyan-800 dark:text-cyan-200"
                : "border-border/80 dark:border-white/10 bg-card/80 dark:bg-[#171330] text-foreground dark:text-zinc-200 hover:border-cyan-500/40"
            }`}
          >
            <Scissors className="h-3.5 w-3.5 text-cyan-400" />
            <span>{section.enabled ? `Kesit: Z=${section.elevationZMm}` : "Yatay Kesit"}</span>
          </button>
        </div>

        {/* Kamera Hazır Bakışları ve Kontroller */}
        <div className="flex flex-wrap items-center gap-1">
          {CAMERA_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              data-testid={`camera-preset-${preset.id}`}
              onClick={() => handleSelectPreset(preset.id)}
              disabled={!show3DPane || webglStatus !== "ready"}
              className={`min-h-[36px] rounded-lg px-2.5 py-1 text-xs font-bold transition-all disabled:opacity-40 ${
                activePreset === preset.id && show3DPane
                  ? "bg-violet-600/90 text-white shadow-sm"
                  : "border border-border/80 dark:border-white/10 bg-card/80 dark:bg-[#171330] text-muted-foreground dark:text-zinc-300 hover:text-foreground dark:hover:text-white"
              }`}
            >
              {preset.label}
            </button>
          ))}

          <div className="h-4 w-px bg-border/80 dark:bg-white/10 mx-0.5 hidden sm:block" />

          <button
            type="button"
            data-testid="camera-zoom-in"
            onClick={() => handleZoom("in")}
            disabled={!show3DPane || webglStatus !== "ready"}
            aria-label="Yakınlaş"
            title="Yakınlaş"
            className="min-h-[36px] min-w-[36px] inline-flex items-center justify-center rounded-lg border border-border/80 dark:border-white/10 bg-card/80 dark:bg-[#171330] text-foreground dark:text-zinc-200 hover:border-purple-500/40 disabled:opacity-40"
          >
            <ZoomIn className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            data-testid="camera-zoom-out"
            onClick={() => handleZoom("out")}
            disabled={!show3DPane || webglStatus !== "ready"}
            aria-label="Uzaklaş"
            title="Uzaklaş"
            className="min-h-[36px] min-w-[36px] inline-flex items-center justify-center rounded-lg border border-border/80 dark:border-white/10 bg-card/80 dark:bg-[#171330] text-foreground dark:text-zinc-200 hover:border-purple-500/40 disabled:opacity-40"
          >
            <ZoomOut className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            data-testid="camera-fit-btn"
            onClick={handleFit}
            disabled={!show3DPane || webglStatus !== "ready"}
            aria-label="Modele sığdır"
            title="Modele sığdır"
            className="min-h-[36px] inline-flex items-center gap-1 rounded-lg border border-border/80 dark:border-white/10 bg-card/80 dark:bg-[#171330] px-2 py-1 text-xs font-bold text-foreground dark:text-zinc-200 hover:border-purple-500/40 disabled:opacity-40"
          >
            <Maximize2 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Sığdır</span>
          </button>
          <button
            type="button"
            data-testid="simulation-reset-btn"
            onClick={handleReset}
            className="min-h-[36px] inline-flex items-center gap-1 rounded-lg border border-purple-500/40 bg-purple-500/15 px-2.5 py-1 text-xs font-bold text-foreground dark:text-purple-200 hover:bg-purple-500/25"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Sıfırla</span>
          </button>
        </div>
      </div>

      {/* Ana Görünüm Alanı */}
      {webglStatus !== "ready" ? (
        <div
          data-testid="simulation-webgl-fallback"
          className="space-y-4 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-5"
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-extrabold text-foreground dark:text-white">
                  {webglStatus === "context-lost"
                    ? "3B WebGL Bağlamı Kesildi — 2B Yedek Görünüm Aktif"
                    : "3B WebGL Kullanılamıyor — 2B Yedek Görünüm Aktif"}
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground dark:text-zinc-300">
                  Cihazınızda veya tarayıcı oturumunuzda WebGL başlatılamadığı için bu
                  donatı detayının ölçekli 2B şeması gösterilmektedir. Parça listesi ve
                  katman kontrolleri çalışmaya devam eder.
                </p>
              </div>
            </div>
            <button
              type="button"
              data-testid="retry-webgl-btn"
              onClick={handleRetryWebGL}
              className="min-h-[40px] rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400"
            >
              3B&apos;yi Yeniden Dene
            </button>
          </div>

          <Drawing2DPreview
            model={model}
            layers={layers}
            selectedPartId={selectedPartId}
            section={section}
            onSelectPart={onSelectPart}
            onToggleSection={onToggleSection}
            onChangeSectionElevation={onChangeSectionElevation}
          />
        </div>
      ) : (
        <div className="space-y-4">
          <div
            className={show3DPane ? "block" : "hidden"}
            aria-hidden={!show3DPane}
          >
            <div className="relative overflow-hidden rounded-2xl border border-border/80 dark:border-purple-500/25 bg-[#f4f5f8] dark:bg-[#0b0a18] shadow-inner">
              <div
                ref={containerRef}
                data-testid="simulation-canvas-host"
                data-concrete-visible={concreteVisible ? "true" : "false"}
                data-selected-part-id={selectedPartId ?? ""}
                data-section-enabled={section.enabled ? "true" : "false"}
                data-section-elevation-mm={section.elevationZMm}
                data-concrete-cap-visible={diagnostics?.concreteCapVisible ? "true" : "false"}
                data-explode-percent={explodePercent}
                data-camera-preset={activePreset}
                data-orbit-azimuth={diagnostics?.orbitAzimuthRad ?? 0}
                data-orbit-polar={diagnostics?.orbitPolarRad ?? 0}
                data-camera-distance={diagnostics?.cameraDistanceM ?? 0}
                data-draw-calls={diagnostics?.drawCalls ?? 0}
                data-triangles={diagnostics?.triangles ?? 0}
                data-quality-profile={diagnostics?.qualityProfile ?? "balanced"}
                data-rendered-frames={diagnostics?.renderedFrames ?? 0}
                data-canvas-count={diagnostics?.canvasCount ?? 0}
                className="h-[clamp(360px,56dvh,520px)] sm:h-[clamp(440px,58dvh,620px)] lg:h-[clamp(520px,64dvh,740px)] 2xl:h-[clamp(580px,68dvh,860px)] min-h-[320px] max-h-[calc(100dvh-76px)] w-full touch-none select-none cursor-grab active:cursor-grabbing"
              />

              {/* Sahne üstü bilgi rozetleri */}
              <div className="pointer-events-none absolute left-3 top-3 right-3 flex flex-wrap items-center justify-between gap-2">
                <span className="rounded-xl border border-border/70 dark:border-white/10 bg-background/85 dark:bg-[#110e24]/85 px-2.5 py-1 text-[11px] font-bold text-foreground dark:text-zinc-200 backdrop-blur-md">
                  Sol sürükle: Döndür · Tıkla: Seç · Sağ sürükle: Kaydır
                </span>
                <div className="flex flex-wrap items-center gap-1.5">
                  <span
                    data-testid="concrete-state-badge"
                    className="rounded-xl border border-purple-500/30 bg-purple-500/15 px-2.5 py-1 font-mono text-[11px] font-bold text-purple-700 dark:text-purple-200 backdrop-blur-md"
                  >
                    {concreteVisible ? "Beton: Görünür" : "Beton: Gizli"}
                  </span>
                  {section.enabled && (
                    <span
                      data-testid="section-state-badge"
                      className="rounded-xl border border-cyan-500/40 bg-cyan-500/20 px-2.5 py-1 font-mono text-[11px] font-bold text-cyan-800 dark:text-cyan-200 backdrop-blur-md"
                    >
                      Kesit A–A: Z={section.elevationZMm} mm
                    </span>
                  )}
                  {explodePercent > 0 && (
                    <span
                      data-testid="explode-state-badge"
                      className="rounded-xl border border-amber-500/40 bg-amber-500/20 px-2.5 py-1 font-mono text-[11px] font-bold text-amber-800 dark:text-amber-200 backdrop-blur-md"
                    >
                      Patlatma: %{explodePercent} (parçalar açıklama amacıyla ayrılmıştır)
                    </span>
                  )}
                </div>
              </div>

              {/* Renk lejandı */}
              <div className="pointer-events-none absolute bottom-3 left-3 right-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border/70 dark:border-white/10 bg-background/85 dark:bg-[#110e24]/85 px-3 py-2 text-[11px] backdrop-blur-md">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="inline-flex items-center gap-1.5 font-semibold text-foreground dark:text-zinc-200">
                    <span className="h-2.5 w-2.5 rounded-full bg-slate-400" />
                    {model.counts.longitudinalBars}Ø20 Boyuna
                  </span>
                  <span className="inline-flex items-center gap-1.5 font-semibold text-foreground dark:text-zinc-200">
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                    Filiz (1080 mm)
                  </span>
                  <span className="inline-flex items-center gap-1.5 font-semibold text-foreground dark:text-zinc-200">
                    <span className="h-2.5 w-2.5 rounded-full bg-cyan-400" />
                    Sarılma (Ø10/100)
                  </span>
                  <span className="inline-flex items-center gap-1.5 font-semibold text-foreground dark:text-zinc-200">
                    <span className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
                    Orta (Ø10/150)
                  </span>
                  <span className="inline-flex items-center gap-1.5 font-semibold text-foreground dark:text-zinc-200">
                    <span className="h-2.5 w-2.5 rounded-full bg-green-500" />
                    Üst Bölge (Ø10/100)
                  </span>
                </div>
                {diagnostics && (
                  <span className="font-mono text-[10px] text-muted-foreground dark:text-zinc-400">
                    {model.counts.stirrups} etriye · {diagnostics.drawCalls} draw call
                  </span>
                )}
              </div>
            </div>
          </div>

          {show2DPane && (
            <div className="space-y-3 pt-1">
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border/80 dark:border-purple-500/20 bg-card/90 dark:bg-[#110e24]/90 px-3 py-2 shadow-xs">
                <div className="flex flex-wrap items-center gap-2">
                  {viewTab === "split" ? (
                    <>
                      <Columns2 className="h-4 w-4 text-purple-400" />
                      <span className="text-xs font-bold text-foreground dark:text-zinc-200">
                        2B Teknik Çizim (Boykesit &amp; Enkesit)
                      </span>
                      <span className="rounded-full bg-purple-500/15 border border-purple-500/30 px-2 py-0.5 text-[10px] font-bold text-purple-700 dark:text-purple-300">
                        3B Sahne ile Canlı Senkronize
                      </span>
                    </>
                  ) : (
                    <>
                      <Layers className="h-4 w-4 text-cyan-400" />
                      <span className="text-xs font-bold text-foreground dark:text-zinc-200">
                        2B Teknik Çizim (Tam Ekran Şema)
                      </span>
                      <span className="text-[11px] text-muted-foreground dark:text-zinc-400">
                        (3B motor arka planda korunmaktadır)
                      </span>
                    </>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {viewTab === "split" ? (
                    <button
                      type="button"
                      data-testid="expand-2d-to-fullscreen-tab"
                      onClick={() => onChangeViewTab("2d")}
                      className="min-h-[32px] inline-flex items-center gap-1.5 rounded-lg border border-border/70 dark:border-white/10 bg-muted/60 dark:bg-[#181432] px-2.5 py-1 text-xs font-bold text-muted-foreground hover:text-foreground dark:text-zinc-300 dark:hover:text-white transition-all"
                    >
                      <Maximize2 className="h-3 w-3" />
                      <span className="hidden sm:inline">Tam 2B Moduna Geç</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      data-testid="return-to-3d-tab"
                      onClick={() => onChangeViewTab("3d")}
                      className="min-h-[32px] inline-flex items-center gap-1.5 rounded-lg border border-cyan-500/40 bg-cyan-500/20 px-2.5 py-1 text-xs font-bold text-cyan-800 dark:text-cyan-200 hover:bg-cyan-500/30 transition-all"
                    >
                      <Box className="h-3 w-3" />
                      <span>3B Sahneye Dön</span>
                    </button>
                  )}
                </div>
              </div>

              <Drawing2DPreview
                model={model}
                layers={layers}
                selectedPartId={selectedPartId}
                section={section}
                onSelectPart={onSelectPart}
                onToggleSection={onToggleSection}
                onChangeSectionElevation={onChangeSectionElevation}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
