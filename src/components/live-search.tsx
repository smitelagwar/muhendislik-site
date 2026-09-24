"use client";

import { Search } from "lucide-react";

export function LiveSearch() {
  return (
    <button
      type="button"
      data-testid="navbar-live-search"
      aria-label="İçerik, araç veya konu ara"
      aria-haspopup="dialog"
      aria-controls="command-palette-dialog"
      onClick={() => window.dispatchEvent(new CustomEvent("open-command-palette"))}
      className="group hidden h-11 w-52 cursor-pointer items-center gap-2.5 rounded-md border border-border bg-card/80 px-3 text-sm font-medium text-muted-foreground transition-colors hover:border-blue-500/45 hover:bg-card hover:text-foreground xl:flex 2xl:w-64 2xl:gap-3 2xl:px-4"
    >
      <Search className="h-5 w-5 text-muted-foreground transition-colors group-hover:text-primary" />
      <span className="min-w-0 flex-1 truncate text-left">İçerik, araç veya konu ara...</span>
      <span className="rounded border border-border bg-secondary px-2 py-1 font-mono text-[9px] font-black tracking-tight text-muted-foreground group-hover:border-amber-500/35 group-hover:text-amber-700 dark:group-hover:text-amber-300">
        Ctrl K
      </span>
    </button>
  );
}
