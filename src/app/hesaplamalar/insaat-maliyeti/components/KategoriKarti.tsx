"use client";

import { useState } from "react";
import { ChevronDown, Info } from "lucide-react";
import type { CategoryResult } from "@/lib/calculations/types";
import { formatTL } from "@/lib/calculations/core";

interface KategoriKartiProps {
  result:   CategoryResult;
  isOpen:   boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

const GROUP_BADGE: Record<string, string> = {
  kabaIs: "bg-blue-500/10 text-blue-400 ring-1 ring-blue-500/20",
  inceIs: "bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20",
  diger:  "bg-purple-500/10 text-purple-400 ring-1 ring-purple-500/20",
};

const GROUP_LABEL: Record<string, string> = {
  kabaIs: "Kaba İş",
  inceIs: "İnce İş",
  diger:  "Diğer Gider",
};

export function KategoriKarti({ result, isOpen, onToggle, children }: KategoriKartiProps) {
  const [showVarsayim, setShowVarsayim] = useState(false);

  return (
    <div
      className={`overflow-hidden rounded-xl border transition-colors duration-200 ${
        isOpen
          ? "border-zinc-700 bg-[#111]"
          : "border-zinc-800 bg-[#0d0d0d] hover:border-zinc-700"
      }`}
    >
      {/* ── HEADER ── */}
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
      >
        <div className="flex items-center gap-3 min-w-0">
          {/* Group badge */}
          <span className={`shrink-0 rounded-md px-2 py-0.5 text-xs font-semibold ${GROUP_BADGE[result.group]}`}>
            {GROUP_LABEL[result.group]}
          </span>

          {/* Kategori adı */}
          <span className="truncate text-sm font-semibold text-zinc-200">
            {result.label}
          </span>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          {/* Alt toplam */}
          <span className="text-sm font-bold tabular-nums text-amber-400">
            {formatTL(result.altToplam)}
          </span>

          {/* Chevron */}
          <ChevronDown
            className={`h-4 w-4 text-zinc-500 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          />
        </div>
      </button>

      {/* ── EXPANDED CONTENT ── */}
      {isOpen && (
        <div className="border-t border-zinc-800 px-5 pb-5 pt-4">

          {/* Miktar özeti (quantities) */}
          {result.quantities.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-2">
              {result.quantities.map(q => (
                <div
                  key={q.id}
                  className="flex items-center gap-1.5 rounded-md border border-zinc-800 bg-zinc-900 px-2.5 py-1.5"
                >
                  <span className="text-xs text-zinc-500">{q.label}:</span>
                  <span className="text-xs font-semibold tabular-nums text-zinc-300">
                    {q.miktar.toLocaleString("tr-TR", { maximumFractionDigits: 1 })} {q.birim}
                  </span>
                  {q.kaynak === "otomatik" && (
                    <span className="text-[10px] text-zinc-700">oto</span>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Input alanları (children) */}
          <div className="mb-4">{children}</div>

          {/* Maliyet dağılımı */}
          {result.costLines.length > 0 && (
            <div className="mb-3 rounded-lg border border-zinc-800 bg-zinc-900/40">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-zinc-800">
                    <th className="px-3 py-2 text-left font-medium text-zinc-600">Kalem</th>
                    <th className="px-3 py-2 text-right font-medium text-zinc-600">Tutar</th>
                  </tr>
                </thead>
                <tbody>
                  {result.costLines.filter(l => l.altToplam > 0).map(l => (
                    <tr key={l.id} className="border-b border-zinc-800/50 last:border-0">
                      <td className="px-3 py-1.5 text-zinc-400">{l.label}</td>
                      <td className="px-3 py-1.5 text-right tabular-nums text-zinc-300">
                        {formatTL(l.altToplam)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Varsayımlar */}
          {result.varsayimlar.length > 0 && (
            <div>
              <button
                type="button"
                onClick={() => setShowVarsayim(v => !v)}
                className="flex items-center gap-1.5 text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
              >
                <Info className="h-3 w-3" />
                {showVarsayim ? "Varsayımları gizle" : "Hesap varsayımları"}
              </button>
              {showVarsayim && (
                <ul className="mt-2 space-y-1">
                  {result.varsayimlar.map((v, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-zinc-600">
                      <span className="mt-0.5 text-zinc-700">•</span>
                      {v}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
