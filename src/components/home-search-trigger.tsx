"use client";

import { Search } from "lucide-react";

export function HomeSearchTrigger({ className = "" }: { className?: string }) {
  return (
    <button
      type="button"
      aria-label="KAKS, maliyet, donatı veya TBDY 2018 ara"
      aria-haspopup="dialog"
      aria-controls="command-palette-dialog"
      onClick={() => window.dispatchEvent(new CustomEvent("open-command-palette"))}
      className={`group ${className}`}
    >
      <Search className="h-4 w-4" aria-hidden />
      <span className="relative min-w-0 flex-1 overflow-hidden">
        <span className="home-search-default block truncate transition-transform duration-200 group-hover:-translate-y-full group-focus-visible:-translate-y-full">
          KAKS, maliyet, donatı veya TBDY 2018 ara…
        </span>
        <span
          aria-hidden
          className="home-search-example absolute inset-0 block translate-y-full truncate text-[var(--home-fg)] transition-transform duration-200 group-hover:translate-y-0 group-focus-visible:translate-y-0"
        >
          Araç, rehber ve yönetmelikler arasında arayın…
        </span>
      </span>
      <kbd className="ml-auto hidden rounded border border-current/20 px-1.5 py-0.5 font-mono text-[10px] opacity-60 sm:inline">
        Ctrl K
      </kbd>
    </button>
  );
}
