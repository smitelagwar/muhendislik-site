"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import { CadColorControl, type CadColorOption } from "./cad-color-control";

const FILL_PRESETS = [
  { label: "Yok", value: 0 },
  { label: "%10", value: 0.1 },
  { label: "%20", value: 0.2 },
  { label: "%35", value: 0.35 },
] as const;

export function CadFillControl({
  fillColor,
  fillOpacity = 0,
  fallbackColor,
  colors,
  onChange,
  label = "Dolgu",
  testIdPrefix = "cad-fill",
}: {
  fillColor?: string;
  fillOpacity?: number;
  fallbackColor: string;
  colors: readonly CadColorOption[];
  onChange: (patch: { fillColor?: string; fillOpacity?: number }) => void;
  label?: string;
  testIdPrefix?: string;
}) {
  const clampedOpacity = Math.max(0, Math.min(1, fillOpacity));
  const activeColor = fillColor || fallbackColor;

  return (
    <div className="space-y-2" data-cad-fill-control="true">
      <div className="text-[11px] font-semibold text-muted-foreground">{label}</div>
      <div className="grid grid-cols-4 gap-1">
        {FILL_PRESETS.map((preset) => {
          const selected = Math.abs(clampedOpacity - preset.value) < 0.001;
          return (
            <button
              key={preset.label}
              type="button"
              aria-pressed={selected}
              onClick={() =>
                onChange({
                  fillColor: preset.value > 0 ? activeColor : fillColor,
                  fillOpacity: preset.value,
                })
              }
              className={cn(
                "relative flex h-9 items-center justify-center overflow-hidden rounded-md border border-border bg-background text-[10px] font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring",
                selected && "border-primary/50 ring-1 ring-primary/30"
              )}
              data-testid={`${testIdPrefix}-${Math.round(preset.value * 100)}`}
            >
              {preset.value > 0 ? (
                <span
                  className="absolute inset-1 rounded-sm border border-foreground/10"
                  style={{ backgroundColor: activeColor, opacity: preset.value }}
                  aria-hidden="true"
                />
              ) : null}
              <span className="relative z-10 rounded bg-background/80 px-1">{preset.label}</span>
            </button>
          );
        })}
      </div>
      <CadColorControl
        label="Dolgu Rengi"
        value={activeColor}
        colors={colors}
        onChange={(color) => onChange({ fillColor: color, fillOpacity: clampedOpacity || 0.2 })}
        testIdPrefix={`${testIdPrefix}-color`}
      />
    </div>
  );
}
