"use client";

import { Home, Layers, Check, Info } from "lucide-react";
import type { UnitTypology } from "@/lib/calculations/modules/ruhsat-on-fizibilite";
import type { QuickFeasibilityViewModel } from "@/lib/calculations/modules/ruhsat-on-fizibilite";

interface TypologyComparisonGridProps {
  typologies: QuickFeasibilityViewModel["typologies"];
  selectedTypology: UnitTypology;
  onSelectTypology: (ut: UnitTypology) => void;
}

export function TypologyComparisonGrid({
  typologies,
  selectedTypology,
  onSelectTypology,
}: TypologyComparisonGridProps) {
  const units: UnitTypology[] = ["1+1", "2+1", "3+1", "4+1"];

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-violet-700 dark:text-violet-300">
            Daire Dağılım Alternatifleri
          </span>
          <h3 className="text-base font-black text-foreground dark:text-white">
            1+1 / 2+1 / 3+1 / 4+1 Karşılaştırma Matrisi
          </h3>
        </div>
        <span className="hidden text-xs text-muted-foreground sm:inline-block">
          Seçerek detaylandırın
        </span>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {units.map((unitType) => {
          const item = typologies[unitType];
          const isSelected = selectedTypology === unitType;

          return (
            <button
              key={unitType}
              type="button"
              onClick={() => onSelectTypology(unitType)}
              aria-pressed={isSelected}
              className={`relative flex flex-col justify-between rounded-2xl border p-4 text-left transition-all ${
                isSelected
                  ? "border-violet-500 bg-violet-500/10 shadow-md ring-2 ring-violet-500/30 dark:border-violet-400 dark:bg-violet-500/20"
                  : "border-border/80 bg-card/90 hover:border-violet-500/40 hover:bg-card dark:border-white/10 dark:bg-[#090d26]/80 dark:hover:border-violet-500/30"
              }`}
            >
              <div>
                {/* Üst Başlık & Seçim Rozeti */}
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 rounded-lg border border-violet-500/30 bg-violet-500/10 px-2.5 py-0.5 text-xs font-black text-violet-700 dark:border-violet-400/30 dark:bg-violet-500/20 dark:text-violet-200">
                    <Home className="h-3.5 w-3.5" /> Hepsi {unitType}
                  </span>
                  {isSelected && (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-violet-600 text-white dark:bg-violet-400 dark:text-slate-950">
                      <Check className="h-3 w-3 stroke-[3]" />
                    </span>
                  )}
                </div>

                {/* Ana Daire Adedi */}
                <div className="mt-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Ön Aday Toplam
                  </span>
                  <div className="mt-0.5 font-mono text-xl font-black text-foreground sm:text-2xl dark:text-white">
                    {item.candidateTotalUnitsLabel}
                  </div>
                  <div className="mt-1 text-xs font-medium text-muted-foreground">
                    {item.unitsPerFloorLabel}
                  </div>
                </div>

                {/* Metrekare Dağılımı */}
                <div className="mt-4 space-y-1.5 border-t border-border/60 pt-3 text-xs dark:border-white/10">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Emsal payı:</span>
                    <strong className="font-mono text-foreground dark:text-slate-200">
                      {item.emsalSharePerUnitLabel}
                    </strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Kapalı brüt:</span>
                    <strong className="font-mono text-foreground dark:text-slate-200">
                      {item.closedGrossRangeLabel}
                    </strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Tahmini net:</span>
                    <strong className="font-mono text-foreground dark:text-slate-200">
                      {item.netRangeLabel}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Teknik Rozetler */}
              <div className="mt-4 flex flex-wrap gap-1.5 pt-2 border-t border-border/40 dark:border-white/5">
                <span
                  className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                    item.shelterSignal.tone === "alert"
                      ? "bg-rose-500/15 text-rose-700 dark:text-rose-300"
                      : item.shelterSignal.tone === "warning"
                      ? "bg-amber-500/15 text-amber-700 dark:text-amber-300"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {item.shelterSignal.label}
                </span>
                <span
                  className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                    item.liftSignal.tone === "alert"
                      ? "bg-rose-500/15 text-rose-700 dark:text-rose-300"
                      : item.liftSignal.tone === "warning"
                      ? "bg-amber-500/15 text-amber-700 dark:text-amber-300"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {item.liftSignal.label}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
