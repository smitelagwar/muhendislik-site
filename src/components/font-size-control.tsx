"use client";

import { useState } from "react";
import { Type } from "lucide-react";

const DEFAULT_SIZE = 17;

export function FontSizeControl() {
  const [size, setSize] = useState(DEFAULT_SIZE);

  const applySize = (nextSize: number) => {
    setSize(nextSize);
    document.documentElement.style.setProperty("--article-font-size", `${nextSize}px`);
  };

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={() => applySize(Math.max(14, size - 1))}
        className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-100 text-xs font-bold text-zinc-600 transition-colors hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
        aria-label="Yazıyı küçült"
      >
        A-
      </button>
      <button
        type="button"
        onClick={() => applySize(DEFAULT_SIZE)}
        className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-100 text-zinc-600 transition-colors hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
        aria-label="Yazı boyutunu sıfırla"
        title="Varsayılan boyut"
      >
        <Type className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        onClick={() => applySize(Math.min(22, size + 1))}
        className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-100 text-sm font-bold text-zinc-600 transition-colors hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
        aria-label="Yazıyı büyüt"
      >
        A+
      </button>
    </div>
  );
}
