"use client";

import { Search } from "lucide-react";

interface HomeSearchTriggerProps {
  className?: string;
  variant?: "default" | "crimson";
}

export function HomeSearchTrigger({
  className = "",
  variant = "default",
}: HomeSearchTriggerProps) {
  const hoverTextClass =
    variant === "crimson" ? "text-[#fff8f0]" : "text-[var(--home-fg)]";

  return (
    <button
      type="button"
      aria-label="KAKS, maliyet, donatı veya TBDY 2018 ara"
      aria-haspopup="dialog"
      aria-controls="command-palette-dialog"
      onClick={() => window.dispatchEvent(new CustomEvent("open-command-palette"))}
      className={`group ${className}`}
    >
      <Search className="h-4 w-4 shrink-0" aria-hidden />
      <span className="relative min-w-0 flex-1 overflow-hidden text-left">
        <span className="home-search-default block truncate transition-transform duration-200 group-hover:-translate-y-full group-focus-visible:-translate-y-full">
          KAKS, maliyet, donatı veya TBDY 2018 ara…
        </span>
        <span
          aria-hidden
          className={`home-search-example absolute inset-0 block translate-y-full truncate transition-transform duration-200 group-hover:translate-y-0 group-focus-visible:translate-y-0 ${hoverTextClass}`}
        >
          Araç, rehber ve yönetmelikler arasında arayın…
        </span>
      </span>
      <kbd className="ml-auto hidden shrink-0 rounded border border-current/25 px-1.5 py-0.5 font-mono text-[10px] opacity-75 sm:inline">
        Ctrl K
      </kbd>
    </button>
  );
}
