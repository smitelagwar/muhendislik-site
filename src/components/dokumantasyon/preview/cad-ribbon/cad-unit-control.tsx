"use client";

import * as React from "react";

import type {
  CadMeasurementAreaUnit,
  CadMeasurementLengthUnit,
} from "@/lib/dokumantasyon/cad-review/store";
import {
  CAD_MEASUREMENT_CONTEXT_CHANGED_EVENT,
  resolveCadSourceUnitContext,
  type CadSourceUnitContext,
} from "@/lib/dokumantasyon/cad-review/units";
import { cn } from "@/lib/utils";
import { CAD_START_CALIBRATION_EVENT } from "../cad-calibration-overlay";
import { closeCadToolPopovers } from "./cad-tool-popover";

function sourceLabel(source: CadSourceUnitContext | null): string {
  if (!source || source.source === "unknown") return "Birim yok / kalibrasyon gerekli";
  if (source.source === "dxf-insunits") return `${source.sourceUnit} (DXF)`;
  if (source.source === "manual") return `${source.sourceUnit} (manuel)`;
  if (source.source === "calibration") return "Kalibre edilmiş çizim";
  return String(source.sourceUnit);
}

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
  const [source, setSource] = React.useState<CadSourceUnitContext | null>(null);

  React.useEffect(() => {
    const refresh = () => setSource(resolveCadSourceUnitContext());
    refresh();
    const timer = window.setTimeout(refresh, 500);
    window.addEventListener(CAD_MEASUREMENT_CONTEXT_CHANGED_EVENT, refresh);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener(CAD_MEASUREMENT_CONTEXT_CHANGED_EVENT, refresh);
    };
  }, []);

  const startCalibration = () => {
    closeCadToolPopovers();
    window.requestAnimationFrame(() => {
      window.dispatchEvent(new Event(CAD_START_CALIBRATION_EVENT));
    });
  };

  return (
    <div className="space-y-3" data-cad-unit-control="true">
      <div>
        <div className="mb-1.5 text-[11px] font-semibold text-muted-foreground">Uzunluk Birimi</div>
        <div className="grid grid-cols-3 gap-1" role="radiogroup" aria-label="Uzunluk birimi">
          {(["mm", "cm", "m"] as const).map((unit) => (
            <button
              key={unit}
              type="button"
              role="radio"
              onClick={() => onLengthUnitChange(unit)}
              aria-checked={lengthUnit === unit}
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
        <div className="grid grid-cols-4 gap-1" role="radiogroup" aria-label="Uzunluk hassasiyeti">
          {[0, 1, 2, 3].map((item) => (
            <button
              key={item}
              type="button"
              role="radio"
              onClick={() => onPrecisionChange(item)}
              aria-checked={precision === item}
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
          <div className="grid grid-cols-3 gap-1" role="radiogroup" aria-label="Alan birimi">
            {(["m2", "cm2", "mm2"] as const).map((unit) => (
              <button
                key={unit}
                type="button"
                role="radio"
                onClick={() => onAreaUnitChange(unit)}
                aria-checked={areaUnit === unit}
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
          <div className="grid grid-cols-4 gap-1" role="radiogroup" aria-label="Alan hassasiyeti">
            {[0, 1, 2, 3].map((item) => (
              <button
                key={item}
                type="button"
                role="radio"
                onClick={() => onAreaPrecisionChange(item)}
                aria-checked={areaPrecision === item}
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

      <div className="rounded-md border border-border/80 bg-muted/30 p-2" data-testid="cad-source-unit-card">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Çizim Birimi</div>
            <div className="truncate text-xs font-medium" data-testid="cad-source-unit-label">Kaynak: {sourceLabel(source)}</div>
          </div>
          <button
            type="button"
            onClick={startCalibration}
            className="h-8 shrink-0 rounded-md border border-border bg-background px-2.5 text-[11px] font-semibold outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring"
            data-testid="cad-calibration-start"
          >
            Kalibre Et
          </button>
        </div>
      </div>
    </div>
  );
}
