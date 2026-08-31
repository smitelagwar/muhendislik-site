"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

export function CadRibbonGroup({
  label,
  children,
  className,
  testId,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
  testId?: string;
}) {
  return (
    <div className="flex shrink-0 items-center border-r border-border/60 pr-1.5 last:border-r-0 last:pr-0">
      <div
        role="toolbar"
        aria-label={label}
        data-cad-ribbon-group={label}
        data-testid={testId}
        className={cn(
          "flex h-11 shrink-0 items-center gap-1 rounded-lg border border-border/65 bg-muted/35 p-1 [@media(pointer:coarse)]:h-14",
          className
        )}
      >
        {children}
      </div>
    </div>
  );
}
