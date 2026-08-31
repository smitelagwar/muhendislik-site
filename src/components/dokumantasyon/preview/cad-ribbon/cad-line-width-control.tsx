"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

export interface CadLineWidthOption {
  label: string;
  value: number;
  desc?: string;
}

export function CadLineWidthControl({
  value,
  onChange,
  options,
  label = "İşaretleme Kalınlığı",
  testIdPrefix = "cad-line-width",
}: {
  value: number;
  onChange: (width: number) => void;
  options: readonly CadLineWidthOption[];
  label?: string;
  testIdPrefix?: string;
}) {
  return (
    <fieldset className="space-y-1.5" data-cad-line-width-control="true">
      <legend className="text-[11px] font-semibold text-muted-foreground">{label}</legend>
      <div className="space-y-1" role="radiogroup" aria-label={`${label} seçenekleri`}>
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            role="radio"
            onClick={() => onChange(option.value)}
            aria-checked={value === option.value}
            className={cn(
              "flex h-8 w-full items-center gap-2 rounded-md border border-transparent px-2 text-xs outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring",
              value === option.value && "border-primary/30 bg-primary/10 text-foreground"
            )}
            data-testid={`${testIdPrefix}-${option.value}`}
          >
            <span
              className="w-20 shrink-0 rounded-full bg-current"
              style={{ height: Math.max(1, Math.min(option.value, 8)) }}
              data-cad-line-width-preview={option.value}
              aria-hidden="true"
            />
            <span className="font-medium">{option.label}</span>
            {option.desc ? <span className="ml-auto text-[10px] text-muted-foreground">{option.desc}</span> : null}
          </button>
        ))}
      </div>
    </fieldset>
  );
}
