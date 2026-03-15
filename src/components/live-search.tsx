"use client";

import { Search } from "lucide-react";

export function LiveSearch({ items }: { items: unknown }) {
  const hasItems = Array.isArray(items) && items.length > 0;

  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new CustomEvent("open-command-palette"))}
      className="group hidden h-11 w-80 items-center gap-3 rounded-full border border-transparent bg-zinc-100 px-4 text-[15px] font-medium text-zinc-500 shadow-sm transition-all hover:bg-zinc-200 hover:shadow-md active:scale-[0.98] dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-400 dark:hover:bg-zinc-800 lg:flex"
    >
      <Search className="h-5 w-5 text-zinc-400 transition-colors group-hover:text-zinc-500" />
      <span className="flex-1 text-left">{hasItems ? "İçerik, araç veya konu ara..." : "Site içinde ara..."}</span>
      <span className="rounded-lg border border-zinc-200 bg-white px-2 py-1 text-[10px] font-black tracking-tight text-zinc-400 shadow-sm dark:border-zinc-700 dark:bg-zinc-800">
        Ctrl K
      </span>
    </button>
  );
}
