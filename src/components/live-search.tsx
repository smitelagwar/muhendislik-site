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
      className="group hidden h-11 w-80 items-center gap-3 rounded-full border border-border bg-card/70 px-4 text-[15px] font-medium text-muted-foreground shadow-sm transition-all hover:border-teal-400/35 hover:bg-card hover:text-foreground hover:shadow-md active:scale-[0.98] xl:flex"
    >
      <Search className="h-5 w-5 text-muted-foreground transition-colors group-hover:text-primary" />
      <span className="flex-1 text-left">İçerik, araç veya konu ara...</span>
      <span className="rounded-lg border border-zinc-700 bg-card px-2 py-1 text-[10px] font-black tracking-tight text-muted-foreground group-hover:border-teal-400/30 group-hover:text-primary">
        Ctrl K
      </span>
    </button>
  );
}
