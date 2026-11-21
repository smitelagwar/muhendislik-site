"use client";

import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ClipboardPaste, Copy, Loader2, Scissors, X } from "lucide-react";
import type { CommandTargetItem } from "./command-registry";

export interface ClipboardState {
  mode: "copy" | "cut";
  items: CommandTargetItem[];
}

export interface ClipboardBarProps {
  clipboardState: ClipboardState | null;
  canPaste: boolean;
  isPasting?: boolean;
  onPaste: () => void;
  onClear: () => void;
}

export function ClipboardBar({
  clipboardState,
  canPaste,
  isPasting = false,
  onPaste,
  onClear,
}: ClipboardBarProps) {
  const count = clipboardState?.items.length ?? 0;
  const isCut = clipboardState?.mode === "cut";

  return (
    <AnimatePresence>
      {clipboardState && count > 0 && (
        <motion.div
          role="status"
          aria-live="polite"
          data-testid="dok-clipboard-bar"
          initial={{ opacity: 0, y: -10, height: 0 }}
          animate={{ opacity: 1, y: 0, height: "auto" }}
          exit={{ opacity: 0, y: -10, height: 0 }}
          transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="overflow-hidden"
        >
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-500/35 bg-amber-500/10 px-3 py-2 text-xs text-foreground shadow-sm backdrop-blur-md dark:border-amber-500/30 dark:bg-amber-500/10">
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-amber-500/20 text-amber-700 dark:text-amber-400">
                {isCut ? <Scissors className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              </span>
              <span className="truncate font-medium">
                <strong className="font-semibold text-amber-800 dark:text-amber-300">
                  {count} öğe {isCut ? "kesildi" : "kopyalandı"}
                </strong>
                <span className="hidden text-muted-foreground sm:inline">
                  {" "}
                  — Hedef klasöre gidip Yapıştır&apos;a basın
                </span>
              </span>
            </div>

            <div className="flex shrink-0 items-center gap-1.5">
              <button
                type="button"
                data-testid="dok-clipboard-paste"
                disabled={!canPaste || isPasting}
                onClick={onPaste}
                className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-2.5 py-1 text-xs font-semibold text-zinc-950 shadow-sm transition-all hover:bg-amber-400 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isPasting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <ClipboardPaste className="h-3.5 w-3.5" />
                )}
                <span>Buraya Yapıştır</span>
                <kbd className="hidden rounded bg-zinc-950/15 px-1 py-0.5 font-mono text-[10px] sm:inline">
                  Ctrl+V
                </kbd>
              </button>

              <button
                type="button"
                data-testid="dok-clipboard-clear"
                disabled={isPasting}
                onClick={onClear}
                aria-label="Panoyu temizle"
                className="inline-flex items-center gap-1 rounded-lg border border-border/80 bg-background/80 px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900/70"
              >
                <X className="h-3.5 w-3.5" />
                <span>İptal</span>
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
