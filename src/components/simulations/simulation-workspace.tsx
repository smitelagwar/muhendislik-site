"use client";

import React, { useEffect, useMemo, useReducer, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  ArrowLeft,
  Box,
  Check,
  Info,
  Layers,
  Link2,
  Maximize2,
  Minimize2,
  PanelRight,
  RotateCcw,
  ShieldAlert,
  Sliders,
  X,
} from "lucide-react";
import type { SimulationCatalogItem } from "@/lib/simulations/catalog";
import { SIMULATIONS_HUB_HREF } from "@/lib/simulations/catalog";
import { TOOLS_HUB_HREF } from "@/lib/tools-data";
import type {
  ColumnPresetId,
  DetailModel,
  SimulationLayerId,
} from "@/lib/simulations/core/types";
import {
  buildColumnDetailModel,
  COLUMN_PARAMETER_LIMITS,
  getColumnSceneSpec,
  getDefaultColumnExperimentInput,
  validateAndBuildCustomColumnSpec,
  type ColumnParameterExperimentInput,
} from "@/lib/simulations/scenes/column-c1";
import {
  createInitialSimulationViewState,
  simulationViewReducer,
  type QuickLayerFilterId,
} from "@/lib/simulations/state/view-reducer";
import {
  encodeSimulationShareUrl,
  parseAndApplySimulationUrlState,
} from "@/lib/simulations/state/url-state";
import { LayerPanel } from "./layer-panel";
import { PartInfoPanel } from "./part-info";
import { LearningControlsPanel } from "./learning-controls";

const LazySimulationViewer = dynamic(() => import("./simulation-viewer"), {
  ssr: false,
  loading: () => (
    <div
      data-testid="simulation-viewer-loading"
      className="flex h-[460px] w-full flex-col items-center justify-center gap-3 rounded-2xl border border-border/80 dark:border-purple-500/20 bg-card/80 dark:bg-[#0b0a18] p-6 text-center"
    >
      <div className="h-9 w-9 animate-spin rounded-full border-2 border-purple-500 border-t-transparent" />
      <p className="text-sm font-bold text-foreground dark:text-white">
        3B Donatı Kafesi Hazırlanıyor...
      </p>
      <p className="text-xs text-muted-foreground dark:text-zinc-400">
        Three.js sahnesi ve kolon donatı geometrisi yükleniyor.
      </p>
    </div>
  ),
});

const PRESET_OPTIONS: ReadonlyArray<{
  id: ColumnPresetId;
  label: string;
  badge: string;
}> = [
  {
    id: "c1-referans",
    label: "C1 Referans Örneği (300×300 · 4Ø20)",
    badge: "Görsel Kaynak",
  },
  {
    id: "c1-cirozlu-ogretim",
    label: "Çirozlu Öğretim Önayarı (400×400 · 8Ø20 + Çiroz)",
    badge: "Öğretim Önayarı",
  },
];

export function SimulationWorkspace({
  item,
  model: initialModel,
}: {
  item: SimulationCatalogItem;
  model: DetailModel;
}) {
  const [viewState, dispatch] = useReducer(
    simulationViewReducer,
    initialModel.presetId,
    createInitialSimulationViewState,
  );
  const [focusTrigger, setFocusTrigger] = useState(0);
  const [inspectorTab, setInspectorTab] = useState<"parts" | "layers" | "notes">(
    "parts",
  );
  const [showAbout, setShowAbout] = useState(false);
  const [inspectorOpen, setInspectorOpen] = useState(true);
  const [focusMode, setFocusMode] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const studioContainerRef = useRef<HTMLDivElement>(null);
  const previousInspectorOpenRef = useRef(true);

  const initialColumnParams = useMemo(
    () =>
      getDefaultColumnExperimentInput(
        initialModel.presetId === "c1-cirozlu-ogretim"
          ? "c1-cirozlu-ogretim"
          : "c1-referans",
      ),
    [initialModel.presetId],
  );
  const [appliedColumnParams, setAppliedColumnParams] =
    useState<ColumnParameterExperimentInput>(initialColumnParams);
  const [draftWidthMm, setDraftWidthMm] = useState<string>(
    String(initialColumnParams.sectionWidthMm),
  );
  const [draftDepthMm, setDraftDepthMm] = useState<string>(
    String(initialColumnParams.sectionDepthMm),
  );
  const [draftBarDiaMm, setDraftBarDiaMm] = useState<string>(
    String(initialColumnParams.longitudinalDiameterMm),
  );
  const [draftConfinementSpacingMm, setDraftConfinementSpacingMm] = useState<string>(
    String(initialColumnParams.confinementSpacingMm),
  );
  const [draftMiddleSpacingMm, setDraftMiddleSpacingMm] = useState<string>(
    String(initialColumnParams.middleSpacingMm),
  );
  const [paramErrorReason, setParamErrorReason] = useState<string | null>(null);
  const [urlFallbackNotice, setUrlFallbackNotice] = useState<string | null>(null);
  const [shareCopied, setShareCopied] = useState(false);
  const hasHydratedUrlRef = useRef(false);

  const syncDraftInputsFromParams = (params: ColumnParameterExperimentInput) => {
    setDraftWidthMm(String(params.sectionWidthMm));
    setDraftDepthMm(String(params.sectionDepthMm));
    setDraftBarDiaMm(String(params.longitudinalDiameterMm));
    setDraftConfinementSpacingMm(String(params.confinementSpacingMm));
    setDraftMiddleSpacingMm(String(params.middleSpacingMm));
  };

  // İlk açılışta (bir kez) URL sorgu parametrelerini parse -> validate -> model -> view sırasıyla uygula
  useEffect(() => {
    if (hasHydratedUrlRef.current || typeof window === "undefined") {
      return;
    }
    hasHydratedUrlRef.current = true;
    const rawSearch = window.location.search;
    if (!rawSearch || rawSearch === "?") {
      return;
    }
    const parsed = parseAndApplySimulationUrlState({
      slug: item.slug,
      searchOrUrl: rawSearch,
      initialModel,
    });
    queueMicrotask(() => {
      if (parsed.fellBackToDefault && parsed.reason) {
        setUrlFallbackNotice(parsed.reason);
        return;
      }
      if (item.slug === "kolon-detayi") {
        setAppliedColumnParams(parsed.columnParams);
        syncDraftInputsFromParams(parsed.columnParams);
      }
      dispatch({ type: "HYDRATE_FROM_URL", nextState: parsed.viewState });
    });
  }, [initialModel, item.slug]);

  // Önayar veya uygulanan kolon parametreleri değiştiğinde saf model üretilir; kamera/katman değişimi modeli yeniden üretmez.
  const activeModel = useMemo(() => {
    if (
      initialModel.slug === "kiris-detayi" ||
      initialModel.slug === "kolon-kiris-birlesimi" ||
      initialModel.slug === "tekil-temel" ||
      initialModel.slug === "perde-detayi" ||
      initialModel.slug === "radye-temel"
    ) {
      return initialModel;
    }
    const validation = validateAndBuildCustomColumnSpec(appliedColumnParams);
    if (validation.valid && validation.spec) {
      return buildColumnDetailModel(validation.spec);
    }
    return buildColumnDetailModel(
      getColumnSceneSpec(
        viewState.presetId === "c1-cirozlu-ogretim"
          ? "c1-cirozlu-ogretim"
          : "c1-referans",
      ),
    );
  }, [appliedColumnParams, initialModel, viewState.presetId]);

  const currentShareUrl = useMemo(
    () =>
      encodeSimulationShareUrl({
        slug: item.slug,
        viewState,
        model: activeModel,
        columnParams: item.slug === "kolon-detayi" ? appliedColumnParams : null,
      }),
    [activeModel, appliedColumnParams, item.slug, viewState],
  );

  const handleToggleLayer = (layerId: SimulationLayerId) => {
    dispatch({ type: "TOGGLE_LAYER", layerId, model: activeModel });
  };

  const handleApplyQuickFilter = (filter: QuickLayerFilterId) => {
    dispatch({ type: "APPLY_QUICK_FILTER", filter, model: activeModel });
  };

  const handleSelectPart = (partId: string | null) => {
    dispatch({ type: "SELECT_PART", partId, model: activeModel });
  };

  const handleSelectPreset = (presetId: ColumnPresetId) => {
    const defaults = getDefaultColumnExperimentInput(
      presetId === "c1-cirozlu-ogretim" ? "c1-cirozlu-ogretim" : "c1-referans",
    );
    setAppliedColumnParams(defaults);
    syncDraftInputsFromParams(defaults);
    setParamErrorReason(null);
    dispatch({ type: "SET_PRESET", presetId });
  };

  const handleApplyColumnParams = () => {
    const candidate: ColumnParameterExperimentInput = {
      presetId:
        viewState.presetId === "c1-cirozlu-ogretim"
          ? "c1-cirozlu-ogretim"
          : "c1-referans",
      sectionWidthMm: Number(draftWidthMm),
      sectionDepthMm: Number(draftDepthMm),
      longitudinalDiameterMm: Number(draftBarDiaMm),
      confinementSpacingMm: Number(draftConfinementSpacingMm),
      middleSpacingMm: Number(draftMiddleSpacingMm),
    };
    const validation = validateAndBuildCustomColumnSpec(candidate);
    if (!validation.valid || !validation.normalizedParams) {
      setParamErrorReason(
        validation.reason ??
          "Parametreler geometrik sınırları aştığı için son geçerli kolon sahnesi korundu.",
      );
      return;
    }
    setParamErrorReason(null);
    setAppliedColumnParams(validation.normalizedParams);
    syncDraftInputsFromParams(validation.normalizedParams);
  };

  const handleResetColumnParamsToPreset = () => {
    const defaults = getDefaultColumnExperimentInput(
      viewState.presetId === "c1-cirozlu-ogretim"
        ? "c1-cirozlu-ogretim"
        : "c1-referans",
    );
    setParamErrorReason(null);
    setAppliedColumnParams(defaults);
    syncDraftInputsFromParams(defaults);
  };

  const handleResetAll = () => {
    const defaults = getDefaultColumnExperimentInput(
      viewState.presetId === "c1-cirozlu-ogretim"
        ? "c1-cirozlu-ogretim"
        : "c1-referans",
    );
    setParamErrorReason(null);
    setUrlFallbackNotice(null);
    setAppliedColumnParams(defaults);
    syncDraftInputsFromParams(defaults);
    dispatch({ type: "RESET_VIEW" });
    if (typeof window !== "undefined" && window.location.search) {
      window.history.replaceState(null, "", window.location.pathname);
    }
  };

  const handleCopyShareLink = async () => {
    const origin =
      typeof window !== "undefined" ? window.location.origin : "";
    const fullShareUrl = encodeSimulationShareUrl({
      slug: item.slug,
      viewState,
      model: activeModel,
      columnParams: item.slug === "kolon-detayi" ? appliedColumnParams : null,
      origin,
    });
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", currentShareUrl);
    }
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(fullShareUrl);
      }
    } catch {
      // Clipboard API kısıtlı ortamlarda sessizce devam et
    }
    setShareCopied(true);
    window.setTimeout(() => setShareCopied(false), 2400);
  };

  const handleFocusSelectedPart = () => {
    setFocusTrigger((prev) => prev + 1);
  };

  const handleToggleFocusMode = () => {
    setFocusMode((prev) => {
      const next = !prev;
      if (next) {
        previousInspectorOpenRef.current = inspectorOpen;
        setInspectorOpen(false);
      } else {
        setInspectorOpen(previousInspectorOpenRef.current);
      }
      return next;
    });
  };

  const handleToggleFullscreen = async () => {
    if (typeof document === "undefined") return;
    try {
      if (!document.fullscreenElement) {
        if (studioContainerRef.current?.requestFullscreen) {
          await studioContainerRef.current.requestFullscreen();
        } else {
          handleToggleFocusMode();
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        }
      }
    } catch {
      handleToggleFocusMode();
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
        if (tag === "input" || tag === "textarea" || tag === "select") return;
        if (document.fullscreenElement && document.exitFullscreen) {
          document.exitFullscreen().catch(() => {});
        } else if (focusMode) {
          setFocusMode(false);
          setInspectorOpen(previousInspectorOpenRef.current);
        }
      }
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [focusMode]);

  const selectedPart = useMemo(() => {
    if (!viewState.selectedPartId) return null;
    return activeModel.parts.find((p) => p.id === viewState.selectedPartId) ?? null;
  }, [activeModel.parts, viewState.selectedPartId]);

  return (
    <div
      ref={studioContainerRef}
      className={`space-y-4 ${focusMode ? "simulation-focus-mode" : ""} fullscreen:bg-background fullscreen:p-4 fullscreen:overflow-y-auto`}
      data-testid="simulation-workspace"
      data-focus-mode={focusMode ? "true" : "false"}
      data-fullscreen={isFullscreen ? "true" : "false"}
    >
      {/* Üst Gezinme, Başlık ve Önayar Seçici (Kompakt Stüdyo Başlığı) */}
      <header className="rounded-2xl border border-border/80 dark:border-purple-500/25 bg-card/90 dark:bg-[#0f0d22]/90 p-3 sm:p-4 shadow-sm space-y-3">
        {/* Üst Şerit: Gezinme, Paylaşım ve Kataloğa Dönüş */}
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <nav
            aria-label="Sayfa konumu"
            className="flex flex-wrap items-center gap-1.5 text-xs font-semibold text-muted-foreground dark:text-zinc-400"
          >
            <Link
              href={TOOLS_HUB_HREF}
              className="hover:text-foreground dark:hover:text-white transition-colors"
            >
              Araçlar
            </Link>
            <span>/</span>
            <Link
              href={SIMULATIONS_HUB_HREF}
              data-testid="back-to-simulations-link"
              className="inline-flex items-center gap-1 text-purple-600 dark:text-purple-300 hover:underline"
            >
              Simülasyonlar
            </Link>
            <span>/</span>
            <span className="text-foreground dark:text-white font-bold">
              {item.shortTitle}
            </span>
          </nav>

          <div data-testid="share-link-bar" className="flex flex-wrap items-center gap-2">
            <span
              data-testid="share-camera-note"
              className="hidden lg:inline text-[11px] text-muted-foreground dark:text-zinc-400"
            >
              Serbest orbit açısı paylaşılmaz; seçili hazır kamera yönü taşınır.
            </span>
            <button
              type="button"
              data-testid="simulation-focus-mode-toggle"
              onClick={handleToggleFocusMode}
              aria-pressed={focusMode}
              aria-label={focusMode ? "Odak modundan çık" : "Odak moduna geç"}
              title={focusMode ? "Odak modundan çık (ESC)" : "Odak moduna geç (Geniş Sahne)"}
              className={`min-h-[36px] inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition-all ${
                focusMode
                  ? "border-purple-500 bg-purple-600 text-white shadow-sm"
                  : "border-border/80 dark:border-white/15 bg-card/80 dark:bg-[#171330] text-foreground dark:text-zinc-200 hover:border-purple-500/40"
              }`}
            >
              {focusMode ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
              <span className="hidden sm:inline">{focusMode ? "Normal Görünüm" : "Odak Modu"}</span>
            </button>
            <button
              type="button"
              data-testid="simulation-fullscreen-toggle"
              onClick={handleToggleFullscreen}
              aria-pressed={isFullscreen}
              aria-label={isFullscreen ? "Tam ekrandan çık" : "Tam ekran yap"}
              title={isFullscreen ? "Tam ekrandan çık (ESC)" : "Tam ekran yap"}
              className="min-h-[36px] inline-flex items-center gap-1.5 rounded-xl border border-border/80 dark:border-white/15 bg-card/80 dark:bg-[#171330] px-3 py-1.5 text-xs font-bold text-foreground dark:text-zinc-200 hover:border-purple-500/40 transition-all"
            >
              {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
              <span className="hidden sm:inline">{isFullscreen ? "Pencere" : "Tam Ekran"}</span>
            </button>
            <button
              type="button"
              data-testid="simulation-inspector-toggle"
              onClick={() => {
                if (focusMode) setFocusMode(false);
                setInspectorOpen((prev) => !prev);
              }}
              aria-expanded={inspectorOpen}
              aria-label={inspectorOpen ? "Denetçi panelini gizle" : "Denetçi panelini aç"}
              className="min-h-[36px] inline-flex items-center gap-1.5 rounded-xl border border-border/80 dark:border-white/15 bg-card/80 dark:bg-[#171330] px-3 py-1.5 text-xs font-bold text-foreground dark:text-zinc-200 hover:border-purple-500/40 transition-all"
            >
              <PanelRight className="h-3.5 w-3.5 text-purple-400" />
              <span className="hidden sm:inline">{inspectorOpen ? "Paneli Gizle" : "Paneli Aç"}</span>
            </button>
            <button
              type="button"
              data-testid="copy-share-link-btn"
              data-share-url={currentShareUrl}
              onClick={handleCopyShareLink}
              aria-label="Bağlantıyı kopyala"
              className="min-h-[36px] inline-flex items-center gap-1.5 rounded-xl border border-purple-500/40 bg-purple-500/15 hover:bg-purple-500/25 px-3 py-1.5 text-xs font-bold text-purple-800 dark:text-purple-200 transition-all"
            >
              {shareCopied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-500" />
                  <span>Kopyalandı</span>
                </>
              ) : (
                <>
                  <Link2 className="h-3.5 w-3.5" />
                  <span>Paylaş</span>
                </>
              )}
            </button>
            <Link
              href={SIMULATIONS_HUB_HREF}
              className="min-h-[36px] inline-flex items-center gap-1.5 rounded-xl border border-border/80 dark:border-white/15 bg-card/80 dark:bg-[#171330] px-3 py-1.5 text-xs font-bold text-foreground dark:text-zinc-200 hover:border-purple-500/40 transition-all"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Katalog</span>
            </Link>
          </div>
        </div>

        {/* Başlık ve Rozet Satırı */}
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-purple-500/30 bg-purple-500/10 px-2.5 py-0.5 text-[11px] font-bold text-purple-700 dark:text-purple-200">
              <Box className="h-3 w-3 text-purple-400" />
              <span>{item.categoryLabel}</span>
              <span>·</span>
              <span className="font-mono" data-testid="active-preset-badge">
                {activeModel.presetId === "r1-radye-temel"
                  ? "R1 Radye Temel Örneği"
                  : activeModel.presetId === "p1-perde"
                    ? "P1 Perde Örneği"
                    : activeModel.presetId === "t1-tekil-temel"
                      ? "T1 Tekil Temel Örneği"
                      : activeModel.presetId === "d1-dis-birlesim"
                        ? "D1 Dış Birleşim Örneği"
                        : activeModel.presetId === "k1-referans"
                          ? "K1 Eğitim Örneği"
                          : activeModel.presetId === "c1-referans"
                            ? "C1 Eğitim Örneği"
                            : "Çirozlu Öğretim Önayarı"}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowAbout((prev) => !prev)}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-muted-foreground hover:text-foreground dark:text-zinc-400 dark:hover:text-white transition-colors"
            >
              <Info className="h-3 w-3" />
              <span>{showAbout ? "Açıklamayı Kapat" : "Hakkında"}</span>
            </button>
          </div>

          <h1
            data-testid="simulation-scene-title"
            className="text-lg sm:text-xl md:text-2xl font-black tracking-tight text-foreground dark:text-white"
          >
            {activeModel.title}
          </h1>

          {showAbout && (
            <p className="text-xs sm:text-sm leading-relaxed text-muted-foreground dark:text-zinc-300 pt-0.5">
              {activeModel.subtitle} — {item.description}
            </p>
          )}
        </div>

        {urlFallbackNotice && (
          <div
            data-testid="url-fallback-notice"
            role="status"
            className="flex items-start gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3.5 py-2 text-xs text-amber-800 dark:text-amber-200"
          >
            <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{urlFallbackNotice}</span>
          </div>
        )}

        {/* Önayar (Preset) Seçim Çubuğu: Kolon için C1 Referans vs Çirozlu Öğretim Önayarı */}
        {activeModel.slug === "kolon-detayi" && (
          <div className="space-y-2 pt-2 border-t border-border/60 dark:border-white/10">
            <div
              className="flex flex-wrap items-center gap-2"
              role="group"
              aria-label="Kolon öğretim önayarı seçimi"
            >
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground dark:text-zinc-400 mr-1">
                Önayar:
              </span>
              {PRESET_OPTIONS.map((preset) => {
                const active = viewState.presetId === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    data-testid={`preset-btn-${preset.id}`}
                    aria-pressed={active}
                    onClick={() => handleSelectPreset(preset.id)}
                    className={`min-h-[36px] inline-flex items-center gap-1.5 rounded-xl border px-3 py-1 text-xs font-bold transition-all ${
                      active
                        ? "border-purple-500 bg-purple-600 text-white shadow-sm"
                        : "border-border/80 dark:border-white/15 bg-muted/40 dark:bg-[#171330] text-foreground dark:text-zinc-200 hover:border-purple-500/40"
                    }`}
                  >
                    <span>{preset.label}</span>
                    <span
                      className={`rounded-full px-1.5 py-0.2 text-[10px] font-mono ${
                        active
                          ? "bg-white/20 text-white"
                          : "bg-purple-500/15 text-purple-600 dark:text-purple-300"
                      }`}
                    >
                      {preset.badge}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Yalnız Kolon İçin Kontrollü Parametre Denemesi */}
            <div
              data-testid="column-parameter-experiment-panel"
              className="rounded-xl border border-border/80 dark:border-purple-500/25 bg-muted/30 dark:bg-[#141029]/90 p-3 space-y-2"
            >
              <div className="flex flex-wrap items-center justify-between gap-1.5">
                <div className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-purple-700 dark:text-purple-200">
                  <Sliders className="h-3.5 w-3.5 text-purple-400" />
                  <span>Kontrollü Kolon Parametre Denemesi</span>
                </div>
                <span
                  data-testid="column-params-product-limit-note"
                  className="text-[10px] font-semibold text-amber-600 dark:text-amber-300"
                >
                  UI aralıkları ürün/geometri limitidir, yönetmelik limiti değildir.
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                <label className="flex flex-col gap-0.5 text-[10px] font-bold text-muted-foreground dark:text-zinc-300">
                  <span>
                    Genişlik b<sub>x</sub> ({COLUMN_PARAMETER_LIMITS.sectionWidthMm.min}–
                    {COLUMN_PARAMETER_LIMITS.sectionWidthMm.max} mm)
                  </span>
                  <input
                    type="number"
                    data-testid="param-input-width"
                    min={COLUMN_PARAMETER_LIMITS.sectionWidthMm.min}
                    max={COLUMN_PARAMETER_LIMITS.sectionWidthMm.max}
                    step={10}
                    value={draftWidthMm}
                    onChange={(e) => setDraftWidthMm(e.target.value)}
                    className="min-h-[34px] rounded-lg border border-border/80 dark:border-white/15 bg-background dark:bg-[#0d0a1c] px-2 py-1 font-mono text-xs font-bold text-foreground dark:text-white"
                  />
                </label>

                <label className="flex flex-col gap-0.5 text-[10px] font-bold text-muted-foreground dark:text-zinc-300">
                  <span>
                    Derinlik b<sub>y</sub> ({COLUMN_PARAMETER_LIMITS.sectionDepthMm.min}–
                    {COLUMN_PARAMETER_LIMITS.sectionDepthMm.max} mm)
                  </span>
                  <input
                    type="number"
                    data-testid="param-input-depth"
                    min={COLUMN_PARAMETER_LIMITS.sectionDepthMm.min}
                    max={COLUMN_PARAMETER_LIMITS.sectionDepthMm.max}
                    step={10}
                    value={draftDepthMm}
                    onChange={(e) => setDraftDepthMm(e.target.value)}
                    className="min-h-[34px] rounded-lg border border-border/80 dark:border-white/15 bg-background dark:bg-[#0d0a1c] px-2 py-1 font-mono text-xs font-bold text-foreground dark:text-white"
                  />
                </label>

                <label className="flex flex-col gap-0.5 text-[10px] font-bold text-muted-foreground dark:text-zinc-300">
                  <span>
                    Boyuna Çap Ø ({COLUMN_PARAMETER_LIMITS.longitudinalDiameterMm.min}–
                    {COLUMN_PARAMETER_LIMITS.longitudinalDiameterMm.max} mm)
                  </span>
                  <input
                    type="number"
                    data-testid="param-input-bar-dia"
                    min={COLUMN_PARAMETER_LIMITS.longitudinalDiameterMm.min}
                    max={COLUMN_PARAMETER_LIMITS.longitudinalDiameterMm.max}
                    step={2}
                    value={draftBarDiaMm}
                    onChange={(e) => setDraftBarDiaMm(e.target.value)}
                    className="min-h-[34px] rounded-lg border border-border/80 dark:border-white/15 bg-background dark:bg-[#0d0a1c] px-2 py-1 font-mono text-xs font-bold text-foreground dark:text-white"
                  />
                </label>

                <label className="flex flex-col gap-0.5 text-[10px] font-bold text-muted-foreground dark:text-zinc-300">
                  <span>
                    Sarılma s<sub>c</sub> ({COLUMN_PARAMETER_LIMITS.confinementSpacingMm.min}–
                    {COLUMN_PARAMETER_LIMITS.confinementSpacingMm.max} mm)
                  </span>
                  <input
                    type="number"
                    data-testid="param-input-confinement-spacing"
                    min={COLUMN_PARAMETER_LIMITS.confinementSpacingMm.min}
                    max={COLUMN_PARAMETER_LIMITS.confinementSpacingMm.max}
                    step={5}
                    value={draftConfinementSpacingMm}
                    onChange={(e) => setDraftConfinementSpacingMm(e.target.value)}
                    className="min-h-[34px] rounded-lg border border-border/80 dark:border-white/15 bg-background dark:bg-[#0d0a1c] px-2 py-1 font-mono text-xs font-bold text-foreground dark:text-white"
                  />
                </label>

                <label className="flex flex-col gap-0.5 text-[10px] font-bold text-muted-foreground dark:text-zinc-300">
                  <span>
                    Orta Bölge s<sub>m</sub> ({COLUMN_PARAMETER_LIMITS.middleSpacingMm.min}–
                    {COLUMN_PARAMETER_LIMITS.middleSpacingMm.max} mm)
                  </span>
                  <input
                    type="number"
                    data-testid="param-input-middle-spacing"
                    min={COLUMN_PARAMETER_LIMITS.middleSpacingMm.min}
                    max={COLUMN_PARAMETER_LIMITS.middleSpacingMm.max}
                    step={5}
                    value={draftMiddleSpacingMm}
                    onChange={(e) => setDraftMiddleSpacingMm(e.target.value)}
                    className="min-h-[34px] rounded-lg border border-border/80 dark:border-white/15 bg-background dark:bg-[#0d0a1c] px-2 py-1 font-mono text-xs font-bold text-foreground dark:text-white"
                  />
                </label>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
                <span className="text-[10px] text-muted-foreground dark:text-zinc-400">
                  Çubuk adedi ({activeModel.counts.longitudinalBars} adet) ve kat yüksekliği ({activeModel.dimensionsMm.concreteHeightZ} mm) seçili önayara bağlıdır.
                </span>

                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    data-testid="reset-column-params-btn"
                    onClick={handleResetColumnParamsToPreset}
                    className="min-h-[34px] inline-flex items-center gap-1.5 rounded-lg border border-border/80 dark:border-white/15 bg-card/80 dark:bg-[#191433] px-2.5 py-1 text-xs font-bold text-foreground dark:text-zinc-200 hover:border-purple-500/40"
                  >
                    <RotateCcw className="h-3 w-3" />
                    <span>Önayara Sıfırla</span>
                  </button>
                  <button
                    type="button"
                    data-testid="apply-column-params-btn"
                    onClick={handleApplyColumnParams}
                    className="min-h-[34px] inline-flex items-center gap-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 px-3.5 py-1 text-xs font-extrabold text-white shadow-sm transition-all"
                  >
                    <span>Uygula</span>
                  </button>
                </div>
              </div>

              {paramErrorReason && (
                <div
                  data-testid="column-params-error-banner"
                  role="alert"
                  className="flex items-start gap-2 rounded-lg border border-rose-500/40 bg-rose-500/15 px-3 py-2 text-xs font-semibold text-rose-800 dark:text-rose-200"
                >
                  <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5 text-rose-500" />
                  <span>{paramErrorReason}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Ana Çalışma Alanı: 3B Sahne Öncelikli Grid + Açılıp Kapanabilen Sağ Denetçi */}
      <div
        data-testid="simulation-studio-grid"
        className={
          inspectorOpen
            ? "grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_clamp(320px,23vw,380px)]"
            : "grid grid-cols-1 gap-4"
        }
      >
        <div className="min-w-0 space-y-4">
          <LazySimulationViewer
            model={activeModel}
            layers={viewState.layers}
            selectedPartId={viewState.selectedPartId}
            section={viewState.section}
            explodePercent={viewState.explodePercent}
            activePreset={viewState.cameraPreset}
            viewTab={viewState.viewTab}
            focusTrigger={focusTrigger}
            onToggleConcrete={() => handleToggleLayer("concrete")}
            onSelectPreset={(cameraPreset) =>
              dispatch({ type: "SET_CAMERA_PRESET", cameraPreset })
            }
            onSelectPart={handleSelectPart}
            onChangeViewTab={(viewTab) =>
              dispatch({ type: "SET_VIEW_TAB", viewTab })
            }
            onToggleSection={(enabled) =>
              dispatch({ type: "SET_SECTION_ENABLED", enabled })
            }
            onChangeSectionElevation={(elevationZMm) =>
              dispatch({
                type: "SET_SECTION_ELEVATION",
                elevationZMm,
                model: activeModel,
              })
            }
            onResetAll={handleResetAll}
          />

          <LearningControlsPanel
            model={activeModel}
            learning={viewState.learning}
            explodePercent={viewState.explodePercent}
            onSelectStep={(stepIndex) =>
              dispatch({
                type: "SET_LEARNING_STEP",
                stepIndex,
                model: activeModel,
              })
            }
            onPrevStep={() =>
              dispatch({ type: "PREV_LEARNING_STEP", model: activeModel })
            }
            onNextStep={() =>
              dispatch({ type: "NEXT_LEARNING_STEP", model: activeModel })
            }
            onTogglePlaying={(isPlaying) =>
              dispatch({ type: "SET_LEARNING_PLAYING", isPlaying })
            }
            onReturnToFreeMode={() => dispatch({ type: "RETURN_TO_FREE_MODE" })}
            onChangeExplodePercent={(explodePercent) =>
              dispatch({ type: "SET_EXPLODE_PERCENT", explodePercent })
            }
            onChangeLayerProgressT={(progressT) =>
              dispatch({
                type: "SET_LAYER_PROGRESS_T",
                progressT,
                model: activeModel,
              })
            }
            onFocusSelectedPart={handleFocusSelectedPart}
            onResetAll={handleResetAll}
          />
        </div>

        {/* Sağ Denetçi: 1280px+ yan panel, <1280px sahne altı akıllı sekmeli yapı */}
        <aside
          data-testid="simulation-inspector-panel"
          className={inspectorOpen ? "min-w-0 space-y-3" : "hidden"}
          aria-hidden={!inspectorOpen}
        >
          <div className="flex items-center justify-between gap-2 px-1">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground dark:text-zinc-400">
              Denetçi & Bilgi
            </span>
            <button
              type="button"
              onClick={() => setInspectorOpen(false)}
              aria-label="Denetçi panelini kapat"
              className="inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[11px] font-bold text-muted-foreground hover:text-foreground dark:text-zinc-400 dark:hover:text-white transition-colors"
            >
              <X className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Kapat</span>
            </button>
          </div>

          <div
            className="grid grid-cols-3 gap-1.5 rounded-2xl border border-border/80 dark:border-purple-500/20 bg-card/90 dark:bg-[#110e24]/90 p-1.5"
            role="tablist"
            aria-label="Denetçi sekmeleri"
          >
            <button
              type="button"
              role="tab"
              aria-selected={inspectorTab === "parts"}
              data-testid="inspector-tab-parts"
              onClick={() => setInspectorTab("parts")}
              className={`min-h-[40px] rounded-xl px-2.5 py-1.5 text-xs font-bold transition-all ${
                inspectorTab === "parts"
                  ? "bg-purple-600 text-white shadow-sm"
                  : "text-muted-foreground dark:text-zinc-300 hover:text-foreground dark:hover:text-white"
              }`}
            >
              Parça & Seçim
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={inspectorTab === "layers"}
              data-testid="inspector-tab-layers"
              onClick={() => setInspectorTab("layers")}
              className={`min-h-[40px] rounded-xl px-2.5 py-1.5 text-xs font-bold transition-all ${
                inspectorTab === "layers"
                  ? "bg-purple-600 text-white shadow-sm"
                  : "text-muted-foreground dark:text-zinc-300 hover:text-foreground dark:hover:text-white"
              }`}
            >
              Katmanlar
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={inspectorTab === "notes"}
              data-testid="inspector-tab-notes"
              onClick={() => setInspectorTab("notes")}
              className={`min-h-[40px] rounded-xl px-2.5 py-1.5 text-xs font-bold transition-all ${
                inspectorTab === "notes"
                  ? "bg-purple-600 text-white shadow-sm"
                  : "text-muted-foreground dark:text-zinc-300 hover:text-foreground dark:hover:text-white"
              }`}
            >
              Özet & Kaynak
            </button>
          </div>

          {inspectorTab === "parts" && (
            <PartInfoPanel
              model={activeModel}
              layers={viewState.layers}
              selectedPartId={viewState.selectedPartId}
              onSelectPart={handleSelectPart}
              onFocusSelectedPart={handleFocusSelectedPart}
            />
          )}

          {inspectorTab === "layers" && (
            <LayerPanel
              model={activeModel}
              layers={viewState.layers}
              quickFilter={viewState.quickFilter}
              onToggleLayer={handleToggleLayer}
              onApplyQuickFilter={handleApplyQuickFilter}
            />
          )}

          {inspectorTab === "notes" && (
            <div className="space-y-4" data-testid="simulation-notes-panel">
              <section className="rounded-2xl border border-border/80 dark:border-purple-500/20 bg-card/90 dark:bg-[#0f0d22]/90 p-5">
                <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-purple-600 dark:text-purple-300">
                  <Layers className="h-4 w-4" />
                  <span>Geometri ve Donatı Sayımları</span>
                </div>

                <dl className="mt-4 grid grid-cols-2 gap-2.5 text-xs">
                  <div className="rounded-xl border border-border/60 dark:border-white/10 bg-muted/40 dark:bg-[#16122c] p-3">
                    <dt className="text-muted-foreground dark:text-zinc-400">Beton Kesiti</dt>
                    <dd
                      data-testid="summary-section-size"
                      className="mt-1 font-mono text-sm font-black text-foreground dark:text-white"
                    >
                      {activeModel.dimensionsMm.widthX}×{activeModel.dimensionsMm.depthY} mm
                    </dd>
                  </div>
                  <div className="rounded-xl border border-border/60 dark:border-white/10 bg-muted/40 dark:bg-[#16122c] p-3">
                    <dt className="text-muted-foreground dark:text-zinc-400">Beton Boyu</dt>
                    <dd className="mt-1 font-mono text-sm font-black text-foreground dark:text-white">
                      {activeModel.dimensionsMm.concreteHeightZ} mm
                    </dd>
                  </div>
                  <div className="rounded-xl border border-border/60 dark:border-white/10 bg-muted/40 dark:bg-[#16122c] p-3">
                    <dt className="text-muted-foreground dark:text-zinc-400">Boyuna Donatı</dt>
                    <dd
                      data-testid="summary-longitudinal-count"
                      className="mt-1 font-mono text-sm font-black text-foreground dark:text-white"
                    >
                      {activeModel.counts.longitudinalBars}Ø
                      {activeModel.slug === "kolon-detayi"
                        ? appliedColumnParams.longitudinalDiameterMm
                        : 20}{" "}
                      + Filiz
                    </dd>
                  </div>
                  <div className="rounded-xl border border-border/60 dark:border-white/10 bg-muted/40 dark:bg-[#16122c] p-3">
                    <dt className="text-muted-foreground dark:text-zinc-400">Etriye / Çiroz</dt>
                    <dd
                      data-testid="summary-stirrup-crosstie-count"
                      className="mt-1 font-mono text-sm font-black text-cyan-500 dark:text-cyan-400"
                    >
                      {activeModel.counts.stirrups} etriye
                      {activeModel.counts.crossties > 0
                        ? ` + ${activeModel.counts.crossties} çiroz`
                        : ""}
                    </dd>
                  </div>
                </dl>
              </section>

              <section className="rounded-2xl border border-border/80 dark:border-purple-500/20 bg-card/90 dark:bg-[#0f0d22]/90 p-5">
                <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-amber-500 dark:text-amber-300">
                  <Info className="h-4 w-4" />
                  <span>Kaynak Verisi ve Öğretim Varsayımları</span>
                </div>

                <ul className="mt-3 space-y-2.5 text-xs leading-relaxed text-muted-foreground dark:text-zinc-300">
                  {activeModel.assumptions.map((note) => (
                    <li
                      key={note.id}
                      className="rounded-xl border border-border/60 dark:border-white/10 bg-muted/30 dark:bg-[#151129] p-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <strong className="font-bold text-foreground dark:text-white">
                          {note.label}
                        </strong>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            note.isTeachingAssumption
                              ? "bg-amber-500/15 text-amber-600 dark:text-amber-300 border border-amber-500/30"
                              : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30"
                          }`}
                        >
                          {note.isTeachingAssumption ? "Öğretim Varsayımı" : "Görsel Kaynak"}
                        </span>
                      </div>
                      <p className="mt-1.5 text-[11px]">{note.description}</p>
                    </li>
                  ))}
                </ul>

                <div className="mt-3 flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-[11px] text-amber-800 dark:text-amber-200">
                  <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>
                    Bu model kavramsal ve geometrik eğitim amaçlıdır; uygulama projesi veya
                    yönetmelik uygunluk onayı yerine geçmez.
                  </span>
                </div>
              </section>
            </div>
          )}
        </aside>
      </div>

      {/* Mobilde parça seçildiğinde gösterilen ergonomik hızlı alt çip (ekranı kapatmayan mikro çip) */}
      {selectedPart && (
        <div
          data-testid="mobile-selected-part-chip"
          className="xl:hidden fixed bottom-[calc(5.25rem+env(safe-area-inset-bottom))] md:bottom-8 left-3 right-16 sm:right-4 z-[60] flex items-center justify-between gap-2.5 rounded-2xl border border-purple-500/40 bg-card/95 dark:bg-[#120f26]/95 p-3 shadow-2xl backdrop-blur-md"
          role="region"
          aria-label="Seçili parça hızlı eylemleri"
        >
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-purple-500 animate-pulse" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-300">
                Seçili Parça
              </span>
            </div>
            <p className="truncate text-xs font-extrabold text-foreground dark:text-white">
              {selectedPart.label}
            </p>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              data-testid="mobile-open-detail-btn"
              onClick={() => {
                setInspectorOpen(true);
                setInspectorTab("parts");
              }}
              className="min-h-[38px] rounded-xl bg-purple-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-purple-500 transition-colors"
            >
              Detayı İncele
            </button>
            <button
              type="button"
              data-testid="mobile-clear-part-btn"
              onClick={() => handleSelectPart(null)}
              aria-label="Seçimi kaldır"
              className="min-h-[38px] min-w-[38px] inline-flex items-center justify-center rounded-xl border border-border/80 dark:border-white/10 bg-card/80 dark:bg-[#181432] text-muted-foreground hover:text-foreground dark:text-zinc-300 dark:hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
