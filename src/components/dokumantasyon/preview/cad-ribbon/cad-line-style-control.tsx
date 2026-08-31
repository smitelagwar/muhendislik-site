"use client";

import * as React from "react";

import type { CadReviewLineDash } from "@/lib/dokumantasyon/cad-review/schema";
import { cn } from "@/lib/utils";

export interface CadLineStyleOption {
  label: string;
  value: CadReviewLineDash;
}

function dashArray(value: CadReviewLineDash): string | undefined {
  if (value === "dashed") return "9 5";
  if (value === "dotted") return "2 4";
  return undefined;
}

export function CadLineStyleControl({
  value,
  onChange,
  options,
  label = "Çizgi Tipi",
  testIdPrefix = "cad-line-style",
}: {
  value: CadReviewLineDash;
  onChange: (style: CadReviewLineDash) => void;
  options: readonly CadLineStyleOption[];
  label?: string;
  testIdPrefix?: string;
}) {
  return (
    <fieldset className="space-y-1.5" data-cad-line-style-control="true">
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
            <svg viewBox="0 0 72 8" className="h-3 w-20" aria-hidden="true" data-cad-line-style-preview={option.value}>
              <line x1="2" y1="4" x2="70" y2="4" stroke="currentColor" strokeWidth="2" strokeDasharray={dashArray(option.value)} />
            </svg>
            <span className="font-medium">{option.label}</span>
          </button>
        ))}
      </div>
    </fieldset>
  );
}
