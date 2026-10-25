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
      className="rounded-2xl border border-border/80 dark:border-purple-500/25 bg-card/95 dark:bg-[#0f0d22]/95 p-4 shadow-sm space-y-4"
    >
      {/* Üst Başlık: Katman Katman İnceleme + Patlatma ve Zaman Kontrolleri */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-400">
            <BookOpen className="h-4 w-4" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xs font-extrabold uppercase tracking-wider text-purple-600 dark:text-purple-300">
                Katman Katman İnceleme ve Öğrenme Adımları
              </h2>
              <span
                data-testid="learning-mode-badge"
                className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                  isGuided
                    ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30"
                    : "bg-muted text-muted-foreground dark:bg-white/10 dark:text-zinc-300"
                }`}
              >
                {isGuided
                  ? `Rehberli Mod · ${currentStep.badge}`
                  : "Serbest İnceleme Modu"}
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground dark:text-zinc-400">
              Bu sıra zorunlu şantiye imalat sırası değildir; donatı bileşenlerini katman katman inceleme rehberidir.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {isGuided ? (
            <button
              type="button"
              data-testid="learning-return-free-btn"
              onClick={onReturnToFreeMode}
              className="min-h-[38px] inline-flex items-center gap-1.5 rounded-xl border border-border/80 dark:border-white/15 bg-muted/60 dark:bg-[#181432] px-3 py-1.5 text-xs font-bold text-foreground dark:text-zinc-200 hover:border-purple-500/40"
            >
              <Sparkles className="h-3.5 w-3.5 text-purple-400" />
              <span>Serbest Moda Dön</span>
            </button>
          ) : (
            <button
              type="button"
              data-testid="learning-start-guided-btn"
              onClick={() => onSelectStep(learning.stepIndex)}
              className="min-h-[38px] inline-flex items-center gap-1.5 rounded-xl border border-purple-500/40 bg-purple-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-purple-500"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Rehberli Adımı Başlat</span>
            </button>
          )}

          <button
            type="button"
            data-testid="learning-prev-step-btn"
            onClick={onPrevStep}
            disabled={isGuided && learning.stepIndex <= 0}
            className="min-h-[38px] inline-flex items-center gap-1 rounded-xl border border-border/80 dark:border-white/15 bg-card/80 dark:bg-[#171330] px-2.5 py-1.5 text-xs font-bold text-foreground dark:text-zinc-200 hover:border-purple-500/40 disabled:opacity-40"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            <span>Önceki Adım</span>
          </button>

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
            className="min-h-[38px] inline-flex items-center gap-1 rounded-xl border border-purple-500/40 bg-purple-500/15 px-2.5 py-1.5 text-xs font-bold text-purple-700 dark:text-purple-200 hover:bg-purple-500/25 disabled:opacity-40"
          >
            <span>Sonraki Adım</span>
            <ChevronRight className="h-3.5 w-3.5" />
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
              className="min-h-[38px] inline-flex items-center gap-1.5 rounded-xl border border-cyan-500/40 bg-cyan-500/15 px-3 py-1.5 text-xs font-bold text-cyan-800 dark:text-cyan-200 hover:bg-cyan-500/25"
            >
              {learning.isPlaying ? (
                <>
                  <Pause className="h-3.5 w-3.5" />
                  <span>Duraklat</span>
                </>
              ) : (
                <>
                  <Play className="h-3.5 w-3.5" />
                  <span>Adımları Oynat</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* 5 Öğrenme Adımı Hızlı Seçici Sekmeler */}
      <div
        className="grid gap-2 sm:grid-cols-5"
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
              className={`min-h-[54px] rounded-xl border p-2.5 text-left transition-all ${
                isCurrent
                  ? "border-purple-500 bg-purple-600/20 text-foreground dark:text-white shadow-sm"
                  : "border-border/70 dark:border-white/10 bg-muted/40 dark:bg-[#15122c] text-muted-foreground dark:text-zinc-300 hover:border-purple-500/40"
              }`}
            >
              <div className="flex items-center justify-between gap-1 text-[10px] font-mono font-bold text-purple-600 dark:text-purple-300">
                <span>{step.badge}</span>
                <span>t={step.layerProgressT.toFixed(2)}</span>
              </div>
              <p className="mt-1 line-clamp-2 text-[11px] font-bold leading-snug text-foreground dark:text-white">
                {step.title}
              </p>
            </button>
          );
        })}
      </div>

      {/* Aktif Adım Açıklaması + Parçaya Odaklan */}
      <div
        data-testid="learning-active-step-card"
        className="rounded-xl border border-purple-500/25 bg-purple-500/10 p-3.5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"
      >
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-md bg-purple-600 px-2 py-0.5 font-mono text-[10px] font-bold text-white">
              {currentStep.badge}
            </span>
            <h3
              data-testid="learning-active-step-title"
              className="text-sm font-extrabold text-foreground dark:text-white"
            >
              {currentStep.title}
            </h3>
          </div>
          <p
            data-testid="learning-active-step-summary"
            className="text-xs leading-relaxed text-foreground/90 dark:text-zinc-200"
          >
            {currentStep.summary}
          </p>
          <p className="text-[11px] text-purple-800 dark:text-purple-200/90">
            <strong>İnceleme ipucu:</strong> {currentStep.whatToNotice}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            data-testid="learning-focus-step-part-btn"
            onClick={onFocusSelectedPart}
            className="min-h-[38px] inline-flex items-center gap-1.5 rounded-xl bg-purple-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-purple-500 transition-colors"
          >
            <Target className="h-3.5 w-3.5" />
            <span>Adım Parçasına Odaklan</span>
          </button>
          <button
            type="button"
            data-testid="learning-reset-btn"
            onClick={onResetAll}
            className="min-h-[38px] inline-flex items-center gap-1.5 rounded-xl border border-border/80 dark:border-white/15 bg-card/80 dark:bg-[#171330] px-3 py-1.5 text-xs font-bold text-foreground dark:text-zinc-200 hover:border-purple-500/40"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Tümünü Sıfırla</span>
          </button>
        </div>
      </div>

      {/* Alt İkili Kontrol: Patlatma (0–100) + Tek Zaman Parametresi (t = 0..1) */}
      <div className="grid grid-cols-[minmax(0,1fr)] gap-3 md:grid-cols-2">
        {/* Patlatma Görünümü (0–100%) */}
        <div className="rounded-xl border border-border/70 dark:border-white/10 bg-muted/40 dark:bg-[#15122c] p-3 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-xs font-extrabold text-foreground dark:text-white">
              <Expand className="h-3.5 w-3.5 text-amber-400" />
              <label htmlFor="column-explode-slider">
                Patlatılmış Görünüm (0–100)
              </label>
            </div>
            <span
              data-testid="explode-percent-value"
              className="rounded-md bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 font-mono text-xs font-bold text-amber-600 dark:text-amber-300"
            >
              %{explodePercent}
            </span>
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
            className="w-full accent-amber-400 cursor-pointer"
          />

          <div className="flex flex-wrap items-center justify-between gap-1.5">
            <div className="flex items-center gap-1">
              {[0, 35, 70, 100].map((val) => (
                <button
                  key={val}
                  type="button"
                  data-testid={`explode-preset-${val}`}
                  onClick={() => onChangeExplodePercent(val)}
                  className={`rounded-md px-2 py-0.5 font-mono text-[10px] font-bold transition-colors ${
                    explodePercent === val
                      ? "bg-amber-500 text-slate-950"
                      : "bg-card/80 dark:bg-white/5 text-muted-foreground dark:text-zinc-300 hover:bg-amber-500/20"
                  }`}
                >
                  %{val}
                </button>
              ))}
            </div>

            {explodePercent > 0 && (
              <span
                data-testid="explode-educational-disclaimer"
                className="text-[11px] font-semibold text-amber-600 dark:text-amber-300"
              >
                Parçalar açıklama amacıyla ayrılmıştır (gerçek mm ölçüleri değişmez).
              </span>
            )}
          </div>
        </div>

        {/* Tek Zaman Parametresiyle Katman Katman Gösterim (t = 0.00 .. 1.00) */}
        <div className="rounded-xl border border-border/70 dark:border-white/10 bg-muted/40 dark:bg-[#15122c] p-3 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-xs font-extrabold text-foreground dark:text-white">
              <SlidersHorizontal className="h-3.5 w-3.5 text-cyan-400" />
              <label htmlFor="layer-progress-t-slider">
                Katman Zaman Parametresi (t = 0.00–1.00)
              </label>
            </div>
            <span
              data-testid="layer-progress-t-value"
              className="rounded-md bg-cyan-500/15 border border-cyan-500/30 px-2 py-0.5 font-mono text-xs font-bold text-cyan-600 dark:text-cyan-300"
            >
              t = {learning.layerProgressT.toFixed(2)}
            </span>
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
            className="w-full accent-cyan-400 cursor-pointer"
          />

          <div className="flex flex-wrap items-center justify-between gap-1 text-[10px] text-muted-foreground dark:text-zinc-400">
            <div className="flex flex-wrap items-center gap-1">
              {[
                { t: 0, label: "t=0 (Boş)" },
                { t: 0.2, label: "t=0.20 (Beton)" },
                { t: 0.4, label: "t=0.40 (+Boyuna)" },
                { t: 0.65, label: "t=0.65 (+Etriye)" },
                { t: 1, label: "t=1.00 (Tam Kafes)" },
              ].map((item) => (
                <button
                  key={item.t}
                  type="button"
                  data-testid={`layer-progress-preset-${item.t}`}
                  onClick={() => onChangeLayerProgressT(item.t)}
                  className={`rounded-md px-1.5 py-0.5 font-mono font-bold transition-colors ${
                    Math.abs(learning.layerProgressT - item.t) < 0.02
                      ? "bg-cyan-500 text-slate-950"
                      : "bg-card/80 dark:bg-white/5 text-muted-foreground dark:text-zinc-300 hover:bg-cyan-500/20"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
