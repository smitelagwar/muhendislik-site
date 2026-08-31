"use client";

import { Target, HelpCircle } from "lucide-react";
import type { UnitTypology } from "@/lib/calculations/modules/ruhsat-on-fizibilite";
import type { QuickFeasibilityViewModel } from "@/lib/calculations/modules/ruhsat-on-fizibilite";

interface ReverseSizingCardProps {
  desiredUnits: string;
  reverseUnitType: UnitTypology;
  onDesiredUnitsChange: (val: string) => void;
  onReverseUnitTypeChange: (ut: UnitTypology) => void;
  reverseResult: QuickFeasibilityViewModel["reverseSizing"];
}

export function ReverseSizingCard({
  desiredUnits,
  reverseUnitType,
  onDesiredUnitsChange,
  onReverseUnitTypeChange,
  reverseResult,
}: ReverseSizingCardProps) {
  return (
    <section className="rounded-[28px] border border-border/80 bg-card/95 p-5 shadow-[0_16px_45px_rgba(0,0,0,0.06)] backdrop-blur-2xl sm:p-6 dark:border-violet-500/25 dark:bg-[#090d26]/90">
      <div className="flex items-center gap-2 border-b border-border/60 pb-4 dark:border-white/10">
        <div className="rounded-xl border border-violet-500/30 bg-violet-500/10 p-2 text-violet-700 dark:text-violet-300">
          <Target className="h-4 w-4" />
        </div>
        <div>
          <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-violet-700 dark:text-violet-300">
            Ters Hesap
          </span>
          <h3 className="text-base font-black text-foreground dark:text-white">
            Hedef Daire Adedine Göre Metrekare
          </h3>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-[1fr_130px]">
        <div>
          <label htmlFor="desired-units" className="text-xs font-bold text-foreground dark:text-slate-200">
            Hedef Toplam Daire Adedi
          </label>
          <input
            id="desired-units"
            type="number"
            min="1"
            max="500"
            placeholder="Örn: 10 veya 12"
            value={desiredUnits}
            onChange={(e) => onDesiredUnitsChange(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm font-mono font-bold text-foreground placeholder:font-sans placeholder:font-normal placeholder:text-muted-foreground focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-white/10 dark:bg-[#070a1e] dark:text-white"
          />
        </div>

        <div>
          <label htmlFor="reverse-unit-type" className="text-xs font-bold text-foreground dark:text-slate-200">
            Hedef Tipoloji
          </label>
          <select
            id="reverse-unit-type"
            value={reverseUnitType}
            onChange={(e) => onReverseUnitTypeChange(e.target.value as UnitTypology)}
            className="mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm font-bold text-foreground focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-white/10 dark:bg-[#070a1e] dark:text-white"
          >
            <option value="1+1">1+1</option>
            <option value="2+1">2+1</option>
            <option value="3+1">3+1</option>
            <option value="4+1">4+1</option>
          </select>
        </div>
      </div>

      {reverseResult ? (
        <div className="mt-5 rounded-2xl border border-violet-500/20 bg-violet-500/5 p-4 dark:bg-[#070a1e]">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/40 pb-3 dark:border-white/5">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                Uyum Sınıfı
              </span>
              <div className="flex items-center gap-2">
                <span className="font-bold text-foreground dark:text-white">
                  {reverseResult.fitClassBadge.text}
                </span>
                <span className="rounded-full bg-violet-500/20 px-2 py-0.5 text-[10px] font-bold text-violet-700 dark:text-violet-300">
                  {desiredUnits} Adet {reverseUnitType}
                </span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground max-w-[280px]">
              {reverseResult.fitClassBadge.description}
            </p>
          </div>

          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3 text-xs">
            <div className="rounded-xl bg-background/80 p-2.5 dark:bg-[#090d26]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Emsal Payı / Daire
              </span>
              <strong className="mt-1 block font-mono text-sm text-foreground dark:text-white">
                {reverseResult.emsalShareLabel}
              </strong>
              <span className="text-[10px] text-muted-foreground">Kesin aritmetik</span>
            </div>

            <div className="rounded-xl bg-background/80 p-2.5 dark:bg-[#090d26]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Tahmini Kapalı Brüt
              </span>
              <strong className="mt-1 block font-mono text-sm text-foreground dark:text-white">
                {reverseResult.closedGrossRangeLabel}
              </strong>
              <span className="text-[10px] text-muted-foreground">Ortak alan düşülmüş</span>
            </div>

            <div className="rounded-xl bg-background/80 p-2.5 dark:bg-[#090d26]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Tahmini Net Alan
              </span>
              <strong className="mt-1 block font-mono text-sm text-foreground dark:text-white">
                {reverseResult.netRangeLabel}
              </strong>
              <span className="text-[10px] text-muted-foreground">Süpürülebilir iç alan</span>
            </div>
          </div>
        </div>
      ) : (
        <p className="mt-3 text-xs text-muted-foreground">
          Yukarıya arsa, TAKS ve KAKS girdikten sonra buraya hedeflediğiniz daire sayısını yazabilirsiniz.
        </p>
      )}
    </section>
  );
}
