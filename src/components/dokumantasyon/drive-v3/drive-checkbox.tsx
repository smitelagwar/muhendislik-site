"use client";

import React from "react";
import { Check, Minus } from "lucide-react";

export interface DriveCheckboxProps {
  checked: boolean;
  indeterminate?: boolean;
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
  ariaLabel: string;
  subtle?: boolean;
  dataTestId?: string;
  className?: string;
}

export function DriveCheckbox({
  checked,
  indeterminate = false,
  onClick,
  ariaLabel,
  subtle = false,
  dataTestId,
  className = "",
}: DriveCheckboxProps) {
  const isActive = checked || indeterminate;

  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={indeterminate ? "mixed" : checked}
      aria-pressed={checked}
      aria-label={ariaLabel}
      data-selection-control="true"
      data-testid={dataTestId}
      onClick={onClick}
      className={`group/checkbox inline-flex min-h-[44px] min-w-[44px] lg:h-8 lg:w-8 lg:min-h-0 lg:min-w-0 shrink-0 items-center justify-center rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/70 transition-opacity duration-150 ${
        subtle && !isActive ? "opacity-55 hover:opacity-100 focus-visible:opacity-100" : "opacity-100"
      } ${className}`}
    >
      <span
        aria-hidden="true"
        className={`flex h-[18px] w-[18px] items-center justify-center rounded-[5px] transition-colors duration-150 ${
          indeterminate
            ? "border border-amber-500 bg-amber-500/90 text-zinc-950 shadow-[0_1px_4px_rgba(245,158,11,0.3)]"
            : checked
              ? "border border-amber-500 bg-amber-500 text-zinc-950 shadow-[0_1px_4px_rgba(245,158,11,0.4)]"
              : "border border-zinc-400/70 bg-background/60 group-hover/checkbox:border-amber-500 dark:border-zinc-500/80"
        }`}
      >
        {indeterminate ? (
          <Minus className="h-3 w-3" strokeWidth={3} />
        ) : checked ? (
          <Check className="h-3 w-3" strokeWidth={3} />
        ) : null}
      </span>
    </button>
  );
}
