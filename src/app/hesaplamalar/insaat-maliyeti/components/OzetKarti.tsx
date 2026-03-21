"use client";

import { Building2, Download, Printer } from "lucide-react";
import type { CalculationResultSnapshot } from "@/lib/calculations/types";
import { formatM2Fiyat, formatTL } from "@/lib/calculations/core";
import { MaliyetChart } from "./MaliyetChart";

interface Props {
  snapshot: CalculationResultSnapshot;
}

export function OzetKarti({ snapshot }: Props) {
  return (
    <div className="sticky top-24 overflow-hidden rounded-xl border border-zinc-700 bg-[#111] shadow-2xl">
      {/* ── HEADER ── */}
      <div className="border-b border-zinc-800 bg-[#0d0d0d] px-5 py-4">
        <h3 className="flex items-center gap-2 text-sm font-semibold tracking-wide text-amber-500">
          <Building2 className="h-4 w-4" />
          Proje Maliyet Özeti
        </h3>
      </div>

      <div className="p-5">
        {/* ── TOPLAMLAR ── */}
        <div className="mb-6 space-y-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Genel Toplam</p>
            <p className="mt-1 text-3xl font-bold tabular-nums text-zinc-100">
              {formatTL(snapshot.genelToplam)}
            </p>
          </div>

          <div className="flex gap-4 border-t border-zinc-800 pt-4">
            <div className="flex-1">
              <p className="text-[11px] font-medium text-zinc-500">m² Başına Maliyet</p>
              <p className="mt-1 text-base font-semibold tabular-nums text-zinc-200">
                {formatM2Fiyat(snapshot.m2BasinaFiyat)}
              </p>
            </div>
            {snapshot.project.bagimsizBolumSayisi > 0 && (
              <div className="flex-1 border-l border-zinc-800 pl-4">
                <p className="text-[11px] font-medium text-zinc-500">Bölüm Başına</p>
                <p className="mt-1 text-base font-semibold tabular-nums text-zinc-200">
                  {formatTL(snapshot.bolumBasinaFiyat)}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ── GRAFİK ── */}
        <div className="mb-6 rounded-xl border border-zinc-800 bg-zinc-900/50 py-2">
          <MaliyetChart snapshot={snapshot} />
        </div>

        {/* ── DAĞILIM LİSTESİ ── */}
        <div className="space-y-3 mb-6">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <div className="h-2.5 w-2.5 rounded-full bg-blue-500" />
              <span className="text-zinc-400">Kaba İşler</span>
            </div>
            <span className="font-semibold tabular-nums text-zinc-200">{formatTL(snapshot.kabaIsToplamı)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
              <span className="text-zinc-400">İnce İşler</span>
            </div>
            <span className="font-semibold tabular-nums text-zinc-200">{formatTL(snapshot.inceIsToplamı)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <div className="h-2.5 w-2.5 rounded-full bg-purple-500" />
              <span className="text-zinc-400">Diğer Giderler</span>
            </div>
            <span className="font-semibold tabular-nums text-zinc-200">{formatTL(snapshot.digerToplamı)}</span>
          </div>
        </div>

        {/* ── ACTIONS (Faz 2 için hazırlık) ── */}
        <div className="grid grid-cols-2 gap-3 border-t border-zinc-800 pt-5">
          <button
            type="button"
            className="flex items-center justify-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-xs font-semibold text-zinc-300 transition-colors hover:bg-zinc-700 hover:text-white"
            onClick={() => alert("Yazdır özelliği Faz 2'de eklenecek.")}
          >
            <Printer className="h-3.5 w-3.5" />
            Yazdır
          </button>
          <button
            type="button"
            className="flex items-center justify-center gap-2 rounded-lg bg-amber-500 px-3 py-2 text-xs font-semibold text-zinc-950 transition-colors hover:bg-amber-400"
            onClick={() => alert("PDF İndir özelliği Faz 2'de eklenecek.")}
          >
            <Download className="h-3.5 w-3.5" />
            PDF İndir
          </button>
        </div>

      </div>
    </div>
  );
}
