"use client";

import { useState } from "react";
import { ChevronDown, Info } from "lucide-react";
import { formatTL } from "@/lib/calculations/core";
import type { CategoryResult } from "@/lib/calculations/types";

interface KategoriKartiProps {
  result: CategoryResult;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

const GROUP_COLORS: Record<
  CategoryResult["group"],
  { chip: string; label: string }
> = {
  kabaIs: { chip: "bg-sky-500/10 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300", label: "Kaba Is" },
  inceIs: { chip: "bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300", label: "Ince Is" },
  diger: { chip: "bg-violet-500/10 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300", label: "Diger Gider" },
};

export function KategoriKarti({
  result,
  isOpen,
  onToggle,
  children,
}: KategoriKartiProps) {
  const [showVarsayim, setShowVarsayim] = useState(false);
  const groupMeta = GROUP_COLORS[result.group];

  return (
    <div
      className={`overflow-hidden rounded-[24px] border transition-colors ${
        isOpen
          ? "border-zinc-300 bg-white shadow-sm dark:border-zinc-700 dark:bg-zinc-950/85"
          : "border-zinc-200/80 bg-white/82 hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-950/70 dark:hover:border-zinc-700"
      }`}
    >
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
      >
        <div className="flex min-w-0 items-center gap-3">
          <span
            className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${groupMeta.chip}`}
          >
            {groupMeta.label}
          </span>
          <span className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            {result.label}
          </span>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <span className="text-sm font-black tabular-nums text-amber-600 dark:text-amber-300">
            {formatTL(result.altToplam)}
          </span>
          <ChevronDown
            className={`h-4 w-4 text-zinc-500 transition-transform ${isOpen ? "rotate-180" : ""}`}
          />
        </div>
      </button>

      {isOpen ? (
        <div className="border-t border-zinc-200 px-5 pb-5 pt-4 dark:border-zinc-800">
          {result.quantities.length > 0 ? (
            <div className="mb-4 flex flex-wrap gap-2">
              {result.quantities.map((quantity) => (
                <div
                  key={quantity.id}
                  className="rounded-xl border border-zinc-200 bg-zinc-50 px-2.5 py-1.5 dark:border-zinc-800 dark:bg-zinc-900"
                >
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">
                    {quantity.label}:{" "}
                  </span>
                  <span className="text-xs font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
                    {quantity.miktar.toLocaleString("tr-TR", {
                      maximumFractionDigits: 1,
                    })}{" "}
                    {quantity.birim}
                  </span>
                </div>
              ))}
            </div>
          ) : null}

          <div className="mb-4">{children}</div>

          {result.costLines.length > 0 ? (
            <div className="mb-3 overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50/80 dark:border-zinc-800 dark:bg-zinc-900/60">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-zinc-800">
                    <th className="px-3 py-2 text-left font-semibold text-zinc-500 dark:text-zinc-400">
                      Kalem
                    </th>
                    <th className="px-3 py-2 text-right font-semibold text-zinc-500 dark:text-zinc-400">
                      Tutar
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {result.costLines
                    .filter((line) => line.altToplam > 0)
                    .map((line) => (
                      <tr
                        key={line.id}
                        className="border-b border-zinc-200 last:border-0 dark:border-zinc-800"
                      >
                        <td className="px-3 py-2 text-zinc-700 dark:text-zinc-300">
                          {line.label}
                        </td>
                        <td className="px-3 py-2 text-right font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
                          {formatTL(line.altToplam)}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          ) : null}

          {result.varsayimlar.length > 0 ? (
            <div>
              <button
                type="button"
                onClick={() => setShowVarsayim((value) => !value)}
                className="flex items-center gap-1.5 text-xs text-zinc-500 transition-colors hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
              >
                <Info className="h-3 w-3" />
                {showVarsayim ? "Varsayimlari gizle" : "Hesap varsayimlari"}
              </button>
              {showVarsayim ? (
                <ul className="mt-2 space-y-1.5">
                  {result.varsayimlar.map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-2 text-xs leading-6 text-zinc-600 dark:text-zinc-400"
                    >
                      <span className="mt-2 h-1.5 w-1.5 rounded-full bg-zinc-400 dark:bg-zinc-500" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
