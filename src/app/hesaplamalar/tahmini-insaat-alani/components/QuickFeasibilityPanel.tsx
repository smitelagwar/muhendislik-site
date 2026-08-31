"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Sparkles, HelpCircle } from "lucide-react";

interface QuickFeasibilityPanelProps {
  parcelArea: string;
  taks: string;
  kaks: string;
  floorCount: string;
  onParcelAreaChange: (val: string) => void;
  onTaksChange: (val: string) => void;
  onKaksChange: (val: string) => void;
  onFloorCountChange: (val: string) => void;
  onFillExample: () => void;
}

export function QuickFeasibilityPanel({
  parcelArea,
  taks,
  kaks,
  floorCount,
  onParcelAreaChange,
  onTaksChange,
  onKaksChange,
  onFloorCountChange,
  onFillExample,
}: QuickFeasibilityPanelProps) {
  const [showFloorInput, setShowFloorInput] = useState(Boolean(floorCount && floorCount.trim() !== ""));

  return (
    <section className="rounded-[28px] border border-border/80 bg-card/95 p-5 shadow-[0_16px_45px_rgba(0,0,0,0.06)] backdrop-blur-2xl sm:p-6 dark:border-violet-500/25 dark:bg-[#090d26]/90">
      <div className="flex items-center justify-between gap-3 border-b border-border/60 pb-4 dark:border-white/10">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-violet-700 dark:text-violet-300">
            Hızlı Girdi
          </span>
          <h2 className="mt-1 text-lg font-black tracking-tight text-foreground dark:text-white">
            Temel İmar Verileri
          </h2>
        </div>
        <button
          type="button"
          onClick={onFillExample}
          className="inline-flex items-center gap-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-xs font-semibold text-violet-700 transition hover:bg-violet-500/20 dark:border-violet-400/30 dark:bg-violet-500/15 dark:text-violet-200"
        >
          <Sparkles className="h-3.5 w-3.5" /> Örnek Doldur
        </button>
      </div>

      <div className="mt-5 space-y-4">
        {/* Arsa Alanı */}
        <div>
          <label htmlFor="quick-parcel-area" className="flex items-center justify-between text-xs font-bold text-foreground dark:text-slate-200">
            <span>Arsa / Net Parsel Alanı (m²) *</span>
            <span className="text-[11px] font-normal text-muted-foreground">Emsale esas alan</span>
          </label>
          <div className="relative mt-1.5">
            <input
              id="quick-parcel-area"
              type="text"
              inputMode="decimal"
              placeholder="Örn: 850"
              value={parcelArea}
              onChange={(e) => onParcelAreaChange(e.target.value)}
              className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-base font-mono font-bold text-foreground placeholder:font-sans placeholder:font-normal placeholder:text-muted-foreground focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-white/10 dark:bg-[#070a1e] dark:text-white"
            />
            <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">
              m²
            </span>
          </div>
        </div>

        {/* TAKS & KAKS grid */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <div>
            <label htmlFor="quick-taks" className="flex items-center justify-between text-xs font-bold text-foreground dark:text-slate-200">
              <span>TAKS *</span>
              <span className="text-[10px] text-muted-foreground">0.05–0.90</span>
            </label>
            <div className="relative mt-1.5">
              <input
                id="quick-taks"
                type="text"
                inputMode="decimal"
                placeholder="Örn: 0.40"
                value={taks}
                onChange={(e) => onTaksChange(e.target.value)}
                className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-base font-mono font-bold text-foreground placeholder:font-sans placeholder:font-normal placeholder:text-muted-foreground focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-white/10 dark:bg-[#070a1e] dark:text-white"
              />
            </div>
          </div>

          <div>
            <label htmlFor="quick-kaks" className="flex items-center justify-between text-xs font-bold text-foreground dark:text-slate-200">
              <span>KAKS / Emsal *</span>
              <span className="text-[10px] text-muted-foreground">Örn: 1.60</span>
            </label>
            <div className="relative mt-1.5">
              <input
                id="quick-kaks"
                type="text"
                inputMode="decimal"
                placeholder="Örn: 1.60"
                value={kaks}
                onChange={(e) => onKaksChange(e.target.value)}
                className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-base font-mono font-bold text-foreground placeholder:font-sans placeholder:font-normal placeholder:text-muted-foreground focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-white/10 dark:bg-[#070a1e] dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Opsiyonel Kat Adedi Disclosure */}
        <div className="pt-2">
          {!showFloorInput ? (
            <button
              type="button"
              onClick={() => setShowFloorInput(true)}
              className="inline-flex w-full items-center justify-between rounded-2xl border border-dashed border-violet-500/40 bg-violet-500/5 px-4 py-2.5 text-xs font-bold text-violet-700 transition hover:bg-violet-500/10 dark:border-violet-400/30 dark:bg-violet-500/10 dark:text-violet-200"
            >
              <span>+ İmar kat adedini biliyorum (Opsiyonel)</span>
              <span className="text-[11px] font-normal text-muted-foreground">Sonucu daraltır</span>
            </button>
          ) : (
            <div className="rounded-2xl border border-violet-500/30 bg-violet-500/5 p-3.5 dark:border-violet-500/20 dark:bg-[#0c1033]">
              <div className="flex items-center justify-between">
                <label htmlFor="quick-floor-count" className="text-xs font-bold text-foreground dark:text-slate-200">
                  Toplam İmar / Emsal Kat Adedi
                </label>
                <button
                  type="button"
                  onClick={() => {
                    onFloorCountChange("");
                    setShowFloorInput(false);
                  }}
                  className="text-[11px] font-medium text-muted-foreground hover:text-foreground"
                >
                  Kaldır
                </button>
              </div>
              <div className="relative mt-1.5">
                <input
                  id="quick-floor-count"
                  type="number"
                  min="1"
                  max="60"
                  placeholder="Örn: 4"
                  value={floorCount}
                  onChange={(e) => onFloorCountChange(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm font-mono font-bold text-foreground placeholder:font-sans placeholder:font-normal placeholder:text-muted-foreground focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-white/10 dark:bg-[#070a1e] dark:text-white"
                />
              </div>
              <p className="mt-1.5 text-[11px] leading-4 text-muted-foreground">
                Kat adedi girildiğinde katta düşen daire sayısı ve asansör tetikleri netleşir.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
