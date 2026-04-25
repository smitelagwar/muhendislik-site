"use client";

import { Search } from "lucide-react";

export function LiveSearch() {
  return (
    <button
      type="button"
      data-testid="navbar-live-search"
      aria-label="İçerik, araç veya konu ara"
      aria-haspopup="dialog"
      onClick={() => window.dispatchEvent(new CustomEvent("open-command-palette"))}
      className="group hidden h-11 w-80 items-center gap-3 rounded-full border border-zinc-800 bg-zinc-950/70 px-4 text-[15px] font-medium text-zinc-400 shadow-sm transition-all hover:border-amber-400/35 hover:bg-zinc-900 hover:text-zinc-100 hover:shadow-md active:scale-[0.98] xl:flex"
    >
      <Search className="h-5 w-5 text-zinc-500 transition-colors group-hover:text-amber-200" />
      <span className="flex-1 text-left">İçerik, araç veya konu ara...</span>
      <span className="rounded-lg border border-zinc-700 bg-zinc-900 px-2 py-1 text-[10px] font-black tracking-tight text-zinc-500 group-hover:border-amber-400/30 group-hover:text-amber-200">
        Ctrl K
      </span>
    </button>
  );
}
