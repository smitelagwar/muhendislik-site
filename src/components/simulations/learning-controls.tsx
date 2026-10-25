"use client";

import React, { useEffect, useState } from "react";
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Expand,
  Pause,
  Play,
  RotateCcw,
  SlidersHorizontal,
  Sparkles,
  Target,
} from "lucide-react";
import type { DetailModel } from "@/lib/simulations/core/types";
import {
  getColumnLearningSteps,
  type SimulationLearningState,
} from "@/lib/simulations/state/view-reducer";

export function LearningControlsPanel({
  model,
  learning,
  explodePercent,
  onSelectStep,
  onPrevStep,
  onNextStep,
  onTogglePlaying,
  onReturnToFreeMode,
  onChangeExplodePercent,
  onChangeLayerProgressT,
  onFocusSelectedPart,
  onResetAll,
}: {
  model: DetailModel;
  learning: SimulationLearningState;
  explodePercent: number;
  onSelectStep: (stepIndex: number) => void;
  onPrevStep: () => void;
  onNextStep: () => void;
  onTogglePlaying: (playing: boolean) => void;
  onReturnToFreeMode: () => void;
  onChangeExplodePercent: (explodePercent: number) => void;
  onChangeLayerProgressT: (progressT: number) => void;
  onFocusSelectedPart: () => void;
  onResetAll: () => void;
}) {
  const steps = getColumnLearningSteps(model.presetId);
  const currentStep =
    steps[Math.max(0, Math.min(steps.length - 1, learning.stepIndex))] ??
    steps[0];

  // SSR ile istemci ilk render'ı aynı kalsın diye başlangıç false; tercih effect içinde okunur
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    queueMicrotask(() => setPrefersReducedMotion(mediaQuery.matches));
    const listener = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
      if (event.matches && learning.isPlaying) {
        onTogglePlaying(false);
      }
    };
    mediaQuery.addEventListener("change", listener);
    return () => mediaQuery.removeEventListener("change", listener);
  }, [learning.isPlaying, onTogglePlaying]);

  useEffect(() => {
    if (!learning.isPlaying || prefersReducedMotion) return;
    const timer = window.setInterval(() => {
      if (learning.stepIndex >= steps.length - 1) {
        onTogglePlaying(false);
      } else {
        onNextStep();
      }
    }, 2800);
    return () => window.clearInterval(timer);
  }, [
    learning.isPlaying,
    learning.stepIndex,
    onNextStep,
    onTogglePlaying,
    prefersReducedMotion,
    steps.length,
  ]);

  const isGuided = learning.mode === "guided";

  return (
    <section
      data-testid="learning-controls-panel"
      data-learning-mode={learning.mode}
      data-learning-step-index={learning.stepIndex}
      data-learning-playing={learning.isPlaying ? "true" : "false"}
      data-layer-progress-t={learning.layerProgressT.toFixed(2)}
      data-explode-percent={explodePercent}
      data-reduced-motion={prefersReducedMotion ? "true" : "false"}
      className="rounded-xl border border-border/80 dark:border-purple-500/25 bg-card/95 dark:bg-[#0f0d22]/95 p-2 sm:p-2.5 shadow-sm space-y-1.5"
    >
      {/* Satır 1: Öğretim Adım Hapları + Navigasyon + Eylemler */}
      <div className="flex flex-wrap items-center justify-between gap-1.5">
        {/* Sol: Mod & Adım Hapları */}
        <div className="flex flex-wrap items-center gap-1 sm:gap-1.5">
          <div className="flex items-center gap-1 mr-0.5">
            <BookOpen className="h-3.5 w-3.5 text-purple-400 shrink-0" />
            <span
              data-testid="learning-mode-badge"
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                isGuided
                  ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30"
                  : "bg-muted text-muted-foreground dark:bg-white/10 dark:text-zinc-300"
              }`}
            >
              {isGuided
                ? `Rehberli · ${currentStep.badge}`
                : "Serbest Mod"}
            </span>
          </div>

          <div
            className="flex flex-wrap items-center gap-1"
            role="list"
            aria-label="Kolon öğrenme adımları"
          >
            {steps.map((step) => {
              const isCurrent = learning.stepIndex === step.index && isGuided;
              return (
                <button
                  key={step.id}
                  type="button"
                  data-testid={`learning-step-btn-${step.index}`}
                  aria-pressed={isCurrent}
                  onClick={() => onSelectStep(step.index)}
                  title={`${step.badge}: ${step.title} (t=${step.layerProgressT.toFixed(2)})`}
                  className={`min-h-[28px] rounded-lg border px-2 py-0.5 text-xs font-bold transition-all ${
                    isCurrent
                      ? "border-purple-500 bg-purple-600 text-white shadow-sm"
                      : "border-border/70 dark:border-white/10 bg-muted/40 dark:bg-[#15122c] text-muted-foreground dark:text-zinc-300 hover:border-purple-500/40 hover:text-foreground"
                  }`}
                >
                  <span>{step.badge}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Sağ: Navigasyon ve Butonlar */}
        <div className="flex flex-wrap items-center gap-1">
          {isGuided ? (
            <button
              type="button"
              data-testid="learning-return-free-btn"
              onClick={onReturnToFreeMode}
              className="min-h-[28px] inline-flex items-center gap-1 rounded-lg border border-border/80 dark:border-white/15 bg-muted/60 dark:bg-[#181432] px-2 py-0.5 text-[11px] font-bold text-foreground dark:text-zinc-200 hover:border-purple-500/40"
            >
              <Sparkles className="h-3 w-3 text-purple-400" />
              <span className="hidden sm:inline">Serbest Mod</span>
            </button>
          ) : (
            <button
              type="button"
              data-testid="learning-start-guided-btn"
              onClick={() => onSelectStep(learning.stepIndex)}
              className="min-h-[28px] inline-flex items-center gap-1 rounded-lg border border-purple-500/40 bg-purple-600 px-2 py-0.5 text-[11px] font-bold text-white hover:bg-purple-500"
            >
              <Sparkles className="h-3 w-3" />
              <span>Rehberli Başlat</span>
            </button>
          )}

          <button
            type="button"
            data-testid="learning-prev-step-btn"
            onClick={onPrevStep}
            disabled={isGuided && learning.stepIndex <= 0}
            aria-label="Önceki Adım"
            className="min-h-[28px] inline-flex items-center gap-0.5 rounded-lg border border-border/80 dark:border-white/15 bg-card/80 dark:bg-[#171330] px-2 py-0.5 text-[11px] font-bold text-foreground dark:text-zinc-200 hover:border-purple-500/40 disabled:opacity-40"
          >
            <ChevronLeft className="h-3 w-3" />
            <span className="hidden sm:inline">Önceki</span>
          </button>

          {!prefersReducedMotion && (
            <button
              type="button"
              data-testid="learning-play-toggle-btn"
              onClick={() => {
                if (!learning.isPlaying && !isGuided) {
                  onSelectStep(learning.stepIndex);
                }
                onTogglePlaying(!learning.isPlaying);
              }}
              aria-label={learning.isPlaying ? "Duraklat" : "Adımları Oynat"}
              className="min-h-[28px] inline-flex items-center gap-1 rounded-lg border border-cyan-500/40 bg-cyan-500/15 px-2 py-0.5 text-[11px] font-bold text-cyan-800 dark:text-cyan-200 hover:bg-cyan-500/25"
            >
              {learning.isPlaying ? (
                <>
                  <Pause className="h-3 w-3" />
                  <span className="hidden sm:inline">Duraklat</span>
                </>
              ) : (
                <>
                  <Play className="h-3 w-3" />
                  <span className="hidden sm:inline">Oynat</span>
                </>
              )}
            </button>
          )}

          <button
            type="button"
            data-testid="learning-next-step-btn"
            onClick={() => {
              if (!isGuided) {
                onSelectStep(0);
              } else {
                onNextStep();
              }
            }}
            disabled={isGuided && learning.stepIndex >= steps.length - 1}
            aria-label="Sonraki Adım"
            className="min-h-[28px] inline-flex items-center gap-0.5 rounded-lg border border-purple-500/40 bg-purple-500/15 px-2 py-0.5 text-[11px] font-bold text-purple-700 dark:text-purple-200 hover:bg-purple-500/25 disabled:opacity-40"
          >
            <span className="hidden sm:inline">Sonraki</span>
            <ChevronRight className="h-3 w-3" />
          </button>

          <button
            type="button"
            data-testid="learning-focus-step-part-btn"
            onClick={onFocusSelectedPart}
            aria-label="Adım Parçasına Odaklan"
            className="min-h-[28px] inline-flex items-center gap-1 rounded-lg bg-purple-600 px-2 py-0.5 text-[11px] font-bold text-white hover:bg-purple-500 transition-colors"
          >
            <Target className="h-3 w-3" />
            <span className="hidden md:inline">Odaklan</span>
          </button>

          <button
            type="button"
            data-testid="learning-reset-btn"
            onClick={onResetAll}
            aria-label="Tümünü Sıfırla"
            className="min-h-[28px] inline-flex items-center gap-1 rounded-lg border border-border/80 dark:border-white/15 bg-card/80 dark:bg-[#171330] px-2 py-0.5 text-[11px] font-bold text-foreground dark:text-zinc-200 hover:border-purple-500/40"
          >
            <RotateCcw className="h-3 w-3" />
            <span className="hidden md:inline">Sıfırla</span>
          </button>
        </div>
      </div>

      {/* Satır 2: Aktif Adım Mini Kartı (Açıklama & İpucu) */}
      <div
        data-testid="learning-active-step-card"
        className="rounded-lg border border-purple-500/25 bg-purple-500/10 px-2.5 py-1.5 flex flex-wrap items-center justify-between gap-2 text-xs"
      >
        <div className="flex flex-wrap items-center gap-2 min-w-0">
          <span className="rounded bg-purple-600 px-1.5 py-0.5 font-mono text-[10px] font-bold text-white shrink-0">
            {currentStep.badge}
          </span>
          <h3
            data-testid="learning-active-step-title"
            className="font-extrabold text-foreground dark:text-white shrink-0"
          >
            {currentStep.title}
          </h3>
          <span className="hidden lg:inline text-muted-foreground dark:text-zinc-400">·</span>
          <p
            data-testid="learning-active-step-summary"
            className="text-[11px] text-foreground/85 dark:text-zinc-300 line-clamp-1"
          >
            {currentStep.summary}
          </p>
        </div>
        <p className="text-[10px] text-purple-800 dark:text-purple-200/90 hidden xl:inline shrink-0">
          <strong>İpucu:</strong> {currentStep.whatToNotice}
        </p>
      </div>

      {/* Satır 3: Patlatma + Zaman Sürgüleri (Grid) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {/* Patlatma */}
        <div className="rounded-lg border border-border/70 dark:border-white/10 bg-muted/40 dark:bg-[#15122c] px-2.5 py-1.5 space-y-1">
          <div className="flex items-center justify-between gap-1.5">
            <div className="flex items-center gap-1 text-[11px] font-extrabold text-foreground dark:text-white">
              <Expand className="h-3 w-3 text-amber-400 shrink-0" />
              <label htmlFor="column-explode-slider">Patlatma</label>
            </div>
            <div className="flex items-center gap-1">
              {[0, 35, 70, 100].map((val) => (
                <button
                  key={val}
                  type="button"
                  data-testid={`explode-preset-${val}`}
                  onClick={() => onChangeExplodePercent(val)}
                  className={`rounded px-1.5 py-0.5 font-mono text-[10px] font-bold transition-colors ${
                    explodePercent === val
                      ? "bg-amber-500 text-slate-950"
                      : "bg-card/80 dark:bg-white/5 text-muted-foreground dark:text-zinc-300 hover:bg-amber-500/20"
                  }`}
                >
                  %{val}
                </button>
              ))}
              <span
                data-testid="explode-percent-value"
                className="rounded bg-amber-500/15 border border-amber-500/30 px-1.5 py-0.5 font-mono text-[10px] font-bold text-amber-600 dark:text-amber-300"
              >
                %{explodePercent}
              </span>
            </div>
          </div>

          <input
            id="column-explode-slider"
            data-testid="explode-slider"
            type="range"
            min={0}
            max={100}
            step={5}
            value={explodePercent}
            onChange={(e) => onChangeExplodePercent(Number(e.target.value))}
            aria-label="Patlatılmış görünüm oranı yüzde"
            className="w-full h-1.5 accent-amber-400 cursor-pointer"
          />

          {explodePercent > 0 && (
            <p
              data-testid="explode-educational-disclaimer"
              className="text-[10px] font-semibold text-amber-600 dark:text-amber-300 truncate"
            >
              Parçalar açıklama amacıyla ayrılmıştır (gerçek mm ölçüleri değişmez).
            </p>
          )}
        </div>

        {/* Zaman Parametresi (t = 0..1) */}
        <div className="rounded-lg border border-border/70 dark:border-white/10 bg-muted/40 dark:bg-[#15122c] px-2.5 py-1.5 space-y-1">
          <div className="flex items-center justify-between gap-1.5">
            <div className="flex items-center gap-1 text-[11px] font-extrabold text-foreground dark:text-white">
              <SlidersHorizontal className="h-3 w-3 text-cyan-400 shrink-0" />
              <label htmlFor="layer-progress-t-slider">Zaman t</label>
            </div>
            <div className="flex items-center gap-1">
              {[
                { t: 0, label: "0" },
                { t: 0.2, label: ".2" },
                { t: 0.4, label: ".4" },
                { t: 0.65, label: ".65" },
                { t: 1, label: "1.0" },
              ].map((item) => (
                <button
                  key={item.t}
                  type="button"
                  data-testid={`layer-progress-preset-${item.t}`}
                  onClick={() => onChangeLayerProgressT(item.t)}
                  className={`rounded px-1.5 py-0.5 font-mono text-[10px] font-bold transition-colors ${
                    Math.abs(learning.layerProgressT - item.t) < 0.02
                      ? "bg-cyan-500 text-slate-950"
                      : "bg-card/80 dark:bg-white/5 text-muted-foreground dark:text-zinc-300 hover:bg-cyan-500/20"
                  }`}
                >
                  {item.label}
                </button>
              ))}
              <span
                data-testid="layer-progress-t-value"
                className="rounded bg-cyan-500/15 border border-cyan-500/30 px-1.5 py-0.5 font-mono text-[10px] font-bold text-cyan-600 dark:text-cyan-300"
              >
                t={learning.layerProgressT.toFixed(2)}
              </span>
            </div>
          </div>

          <input
            id="layer-progress-t-slider"
            data-testid="layer-progress-t-slider"
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={learning.layerProgressT}
            onChange={(e) => onChangeLayerProgressT(Number(e.target.value))}
            aria-label="Katman katman gösterim zaman parametresi t"
            className="w-full h-1.5 accent-cyan-400 cursor-pointer"
          />
        </div>
      </div>
    </section>
  );
}
