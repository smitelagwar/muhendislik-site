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
    <div className="flex shrink-0 items-center border-r border-border/60 pr-1.5 last:border-r-0 last:pr-0 [@media(min-width:1100px)_and_(max-width:1439px)]:pr-1">
      <div
        role="toolbar"
        aria-label={label}
        data-cad-ribbon-group={label}
        data-testid={testId}
        className={cn(
          "flex h-11 shrink-0 items-center gap-1 rounded-lg border border-border/65 bg-muted/35 p-1 [@media(pointer:coarse)]:h-14 [@media(min-width:1100px)_and_(max-width:1439px)]:h-10 [@media(min-width:1100px)_and_(max-width:1439px)]:gap-0.5 [@media(min-width:1100px)_and_(max-width:1439px)]:p-0.5",
          className
        )}
      >
        {children}
      </div>
    </div>
  );
}
