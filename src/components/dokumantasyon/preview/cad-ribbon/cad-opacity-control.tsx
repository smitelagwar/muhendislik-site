"use client";

import * as React from "react";

export function CadOpacityControl({
  value,
  onChange,
  label = "Opaklık",
  testId = "cad-markup-opacity",
}: {
  value: number;
  onChange: (opacity: number) => void;
  label?: string;
  testId?: string;
}) {
  const clamped = Math.max(0, Math.min(1, Number.isFinite(value) ? value : 1));
  const percent = Math.round(clamped * 100);

  return (
    <div className="space-y-1.5" data-cad-opacity-control="true">
      <div className="flex items-center justify-between gap-3 text-[11px] font-semibold text-muted-foreground">
        <label htmlFor={testId}>{label}</label>
        <output htmlFor={testId} className="font-mono text-foreground">{percent}%</output>
      </div>
      <input
        id={testId}
        type="range"
        min={10}
        max={100}
        step={5}
        value={Math.max(10, percent)}
        onChange={(event) => onChange(Number(event.target.value) / 100)}
        onKeyDown={(event) => event.stopPropagation()}
        className="h-5 w-full cursor-pointer accent-primary"
        aria-label={label}
        data-testid={testId}
      />
    </div>
  );
}
