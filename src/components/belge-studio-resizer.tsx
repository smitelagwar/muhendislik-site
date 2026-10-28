"use client";

import type { BelgeStudioResizerApi } from "@/hooks/use-belge-studio-resizer";

interface BelgeStudioResizerProps {
  resizer: BelgeStudioResizerApi;
}

export function BelgeStudioResizer({ resizer }: BelgeStudioResizerProps) {
  const { isDragging, resizerProps } = resizer;

  return (
    <div
      {...resizerProps}
      title="Formu genişletmek için sürükleyin · Varsayılan için çift tıklayın"
      className={`group relative hidden lg:flex w-2.5 shrink-0 select-none items-center justify-center cursor-col-resize touch-none transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 z-10 ${
        isDragging
          ? "bg-amber-500/25 ring-1 ring-amber-500/50"
          : "bg-border/40 hover:bg-amber-500/20 active:bg-amber-500/30"
      }`}
    >
      {/* İnce görsel dikey çizgi */}
      <div
        className={`h-full w-[1px] transition-colors duration-150 ${
          isDragging
            ? "bg-amber-500"
            : "bg-border group-hover:bg-amber-500/70"
        }`}
      />

      {/* Merkezdeki zarif tutamaç (grip indicator) */}
      <div
        className={`absolute top-1/2 -translate-y-1/2 flex flex-col items-center justify-center gap-1 py-2 px-0.5 rounded-full border transition-all duration-150 ${
          isDragging
            ? "bg-amber-500 border-amber-600 shadow-sm shadow-amber-500/40"
            : "bg-card border-border/80 group-hover:border-amber-500/60 group-hover:bg-amber-500/10"
        }`}
      >
        <span
          className={`h-1 w-1 rounded-full ${
            isDragging ? "bg-white" : "bg-muted-foreground/60 group-hover:bg-amber-600 dark:group-hover:bg-amber-400"
          }`}
        />
        <span
          className={`h-1 w-1 rounded-full ${
            isDragging ? "bg-white" : "bg-muted-foreground/60 group-hover:bg-amber-600 dark:group-hover:bg-amber-400"
          }`}
        />
        <span
          className={`h-1 w-1 rounded-full ${
            isDragging ? "bg-white" : "bg-muted-foreground/60 group-hover:bg-amber-600 dark:group-hover:bg-amber-400"
          }`}
        />
      </div>
    </div>
  );
}
