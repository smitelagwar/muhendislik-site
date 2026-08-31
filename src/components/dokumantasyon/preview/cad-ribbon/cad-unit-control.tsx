"use client";

import * as React from "react";

import type {
  CadMeasurementAreaUnit,
  CadMeasurementLengthUnit,
} from "@/lib/dokumantasyon/cad-review/store";
import { cn } from "@/lib/utils";

export function CadUnitControl({
  lengthUnit,
  precision,
  areaUnit,
  areaPrecision,
  onLengthUnitChange,
  onPrecisionChange,
  onAreaUnitChange,
  onAreaPrecisionChange,
}: {
  lengthUnit: CadMeasurementLengthUnit;
  precision: number;
  areaUnit?: CadMeasurementAreaUnit;
  areaPrecision?: number;
  onLengthUnitChange: (unit: CadMeasurementLengthUnit) => void;
  onPrecisionChange: (precision: number) => void;
  onAreaUnitChange?: (unit: CadMeasurementAreaUnit) => void;
  onAreaPrecisionChange?: (precision: number) => void;
}) {
  return (
    <div className="space-y-3" data-cad-unit-control="true">
      <div>
        <div className="mb-1.5 text-[11px] font-semibold text-muted-foreground">Uzunluk Birimi</div>
        <div className="grid grid-cols-3 gap-1">
          {(["mm", "cm", "m"] as const).map((unit) => (
            <button
              key={unit}
              type="button"
              onClick={() => onLengthUnitChange(unit)}
              aria-pressed={lengthUnit === unit}
              className={cn(
                "h-8 rounded-md border border-border px-2 text-xs font-semibold outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring",
                lengthUnit === unit && "border-primary/40 bg-primary/10 text-foreground"
              )}
            >
              {unit}
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="mb-1.5 text-[11px] font-semibold text-muted-foreground">Uzunluk Hassasiyeti</div>
        <div className="grid grid-cols-4 gap-1">
          {[0, 1, 2, 3].map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => onPrecisionChange(item)}
              aria-pressed={precision === item}
              className={cn(
                "h-8 rounded-md border border-border px-1 text-[11px] font-mono outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring",
                precision === item && "border-primary/40 bg-primary/10 text-foreground"
              )}
            >
              {item === 0 ? "0" : `0.${"0".repeat(item)}`}
            </button>
          ))}
        </div>
      </div>

      {areaUnit && onAreaUnitChange ? (
        <div>
          <div className="mb-1.5 text-[11px] font-semibold text-muted-foreground">Alan Gösterimi</div>
          <div className="grid grid-cols-3 gap-1">
            {(["m2", "cm2", "mm2"] as const).map((unit) => (
              <button
                key={unit}
                type="button"
                onClick={() => onAreaUnitChange(unit)}
                aria-pressed={areaUnit === unit}
                className={cn(
                  "h-8 rounded-md border border-border px-2 text-xs font-semibold outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring",
                  areaUnit === unit && "border-primary/40 bg-primary/10 text-foreground"
                )}
              >
                {unit === "m2" ? "m²" : unit === "cm2" ? "cm²" : "mm²"}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {typeof areaPrecision === "number" && onAreaPrecisionChange ? (
        <div>
          <div className="mb-1.5 text-[11px] font-semibold text-muted-foreground">Alan Hassasiyeti</div>
          <div className="grid grid-cols-4 gap-1">
            {[0, 1, 2, 3].map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => onAreaPrecisionChange(item)}
                aria-pressed={areaPrecision === item}
                className={cn(
                  "h-8 rounded-md border border-border px-1 text-[11px] font-mono outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring",
                  areaPrecision === item && "border-primary/40 bg-primary/10 text-foreground"
                )}
              >
                {item === 0 ? "0" : `0.${"0".repeat(item)}`}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
