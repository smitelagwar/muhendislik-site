"use client";

import * as React from "react";
import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

export interface CadColorOption {
  name: string;
  hex: string;
}

export function CadColorControl({
  value,
  onChange,
  colors,
  label = "Renk",
}: {
  value: string;
  onChange: (color: string) => void;
  colors: readonly CadColorOption[];
  label?: string;
}) {
  return (
    <fieldset className="space-y-2" data-cad-color-control="true">
      <legend className="text-[11px] font-semibold text-muted-foreground">{label}</legend>
      <div className="grid grid-cols-5 gap-1.5">
        {colors.map((color) => {
          const selected = color.hex.toLowerCase() === value.toLowerCase();
          return (
            <button
              key={color.hex}
              type="button"
              className={cn(
                "relative flex size-8 items-center justify-center rounded-md border border-border/80 outline-none transition-transform hover:scale-105 focus-visible:ring-2 focus-visible:ring-ring",
                selected && "ring-2 ring-primary/70"
              )}
              style={{ backgroundColor: color.hex }}
              onClick={() => onChange(color.hex)}
              aria-label={`${color.name} seç`}
              aria-pressed={selected}
              data-cad-color={color.hex}
            >
              {selected ? <Check className="size-4 text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]" /> : null}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
