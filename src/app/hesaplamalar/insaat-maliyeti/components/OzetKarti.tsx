"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Building2, Download, ExternalLink, Printer } from "lucide-react";
import { buildCalculationPdfSnapshot, exportPdf } from "@/lib/calculations/reporting";
import { formatM2Fiyat, formatTL } from "@/lib/calculations/core";
import type { CalculationResultSnapshot } from "@/lib/calculations/types";
import type { OfficialCostResultSnapshot } from "@/lib/calculations/official-unit-costs";
import { MaliyetChart } from "./MaliyetChart";

interface Props {
  snapshot: CalculationResultSnapshot;
  officialBaseline?: OfficialCostResultSnapshot | null;
}

export function OzetKarti({ snapshot, officialBaseline = null }: Props) {
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const comparison = useMemo(() => {
    if (!officialBaseline) {
      return null;
    }

    const fark = snapshot.genelToplam - officialBaseline.resmiToplamMaliyet;
    const farkPct =
      officialBaseline.resmiToplamMaliyet > 0
        ? (fark / officialBaseline.resmiToplamMaliyet) * 100
        : 0;

    return { fark, farkPct };
  }, [officialBaseline, snapshot.genelToplam]);

  const officialLink = `/hesaplamalar/resmi-birim-maliyet-2026?alan=${encodeURIComponent(
    snapshot.project.insaatAlani
  )}`;

  const downloadPDF = () => {
    setIsExporting(true);
    setExportError(null);

    try {
      const pdfSnapshot = buildCalculationPdfSnapshot(snapshot, officialBaseline);
      exportPdf(pdfSnapshot, `insaat-maliyet-raporu-${Date.now()}.pdf`);
    } catch (error) {
      console.error("Calculation PDF export failed", error);
      setExportError("PDF raporu oluşturulamadı. Yazdır seçeneğini kullanabilirsiniz.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="sticky top-24 overflow-hidden rounded-[28px] border border-zinc-200/80 bg-white/88 shadow-[0_24px_70px_-42px_rgba(15,23,42,0.35)] backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/82 dark:shadow-[0_24px_70px_-42px_rgba(2,8,23,0.78)]">
      <div className="border-b border-zinc-200/70 bg-gradient-to-r from-amber-100/60 to-blue-100/40 px-6 py-5 dark:border-zinc-800 dark:from-amber-500/10 dark:to-blue-500/10">
        <h3 className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.22em] text-amber-700 dark:text-amber-300">
          <Building2 className="h-4 w-4" />
          Yatırım Özeti
        </h3>
      </div>

      <div className="p-6">
        <div className="mb-8 space-y-6">
          <div className="relative pl-6">
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
              Anahtar Teslim Satış
            </p>
            <p className="mt-2 text-4xl font-black tabular-nums text-zinc-950 dark:text-white">
              {formatTL(snapshot.anahtarTeslimSatisFiyati)}
            </p>
            <div className="absolute left-0 top-0 h-full w-1 rounded-full bg-amber-500 shadow-[0_0_18px_rgba(245,158,11,0.55)]" />
          </div>

          <div className="flex items-center justify-between rounded-2xl border border-zinc-200 bg-zinc-50/85 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900/80">
            <span className="text-xs font-bold text-zinc-600 dark:text-zinc-400">
              Net İnşaat Maliyeti
            </span>
            <span className="text-sm font-black tabular-nums text-amber-600 dark:text-amber-300">
              {formatTL(snapshot.genelToplam)}
            </span>
          </div>

          <div className="flex gap-4 border-t border-zinc-200 pt-4 dark:border-zinc-800">
            <div className="flex-1">
              <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                m² Başına Maliyet
              </p>
              <p className="mt-1 text-base font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
                {formatM2Fiyat(snapshot.m2BasinaFiyat)}
              </p>
            </div>
            {snapshot.project.bagimsizBolumSayisi > 0 && (
              <div className="flex-1 border-l border-zinc-200 pl-4 dark:border-zinc-800">
                <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                  Bölüm Başına
                </p>
                <p className="mt-1 text-base font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
                  {formatTL(snapshot.bolumBasinaFiyat)}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="mb-6 rounded-2xl border border-zinc-200 bg-zinc-50/80 py-3 dark:border-zinc-800 dark:bg-zinc-900/70">
          <MaliyetChart snapshot={snapshot} />
        </div>

        <div className="mb-6 space-y-3">
          {[
            { label: "Kaba İşler", value: snapshot.kabaIsToplamı, color: "bg-sky-500" },
            { label: "İnce İşler", value: snapshot.inceIsToplamı, color: "bg-emerald-500" },
            { label: "Diğer Giderler", value: snapshot.digerToplamı, color: "bg-violet-500" },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div className={`h-2.5 w-2.5 rounded-full ${item.color}`} />
                <span className="text-zinc-600 dark:text-zinc-400">{item.label}</span>
              </div>
              <span className="font-semibold tabular-nums text-zinc-950 dark:text-white">
                {formatTL(item.value)}
              </span>
            </div>
          ))}

          {snapshot.muteahhitKariTutari > 0 && (
            <div className="flex items-center justify-between border-t border-zinc-200 pt-2 text-sm dark:border-zinc-800">
              <span className="text-zinc-500 dark:text-zinc-400">
                Müteahhit Kârı (+%{(snapshot.project.muteahhitKariPct * 100).toFixed(0)})
              </span>
              <span className="font-semibold tabular-nums text-zinc-800 dark:text-zinc-200">
                {formatTL(snapshot.muteahhitKariTutari)}
              </span>
            </div>
          )}

          {snapshot.kdvTutari > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-500 dark:text-zinc-400">
                KDV (+%{(snapshot.project.kdvOraniPct * 100).toFixed(0)})
              </span>
              <span className="font-semibold tabular-nums text-zinc-800 dark:text-zinc-200">
                {formatTL(snapshot.kdvTutari)}
              </span>
            </div>
          )}
        </div>

        {comparison ? (
          <div className="mb-6 rounded-2xl border border-blue-200/80 bg-blue-50/75 p-4 dark:border-blue-900/50 dark:bg-blue-950/30">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-blue-700 dark:text-blue-300">
              Resmî Karşılaştırma
            </p>
            <div className="mt-3 space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-zinc-600 dark:text-zinc-400">Resmî toplam</span>
                <span className="font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
                  {formatTL(officialBaseline!.resmiToplamMaliyet)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-600 dark:text-zinc-400">Detaylı toplam</span>
                <span className="font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
                  {formatTL(snapshot.genelToplam)}
                </span>
              </div>
              <div className="flex items-center justify-between border-t border-blue-200/70 pt-2 dark:border-blue-900/50">
                <span className="text-zinc-700 dark:text-zinc-300">Fark</span>
                <span className="font-black tabular-nums text-blue-700 dark:text-blue-300">
                  {formatTL(comparison.fark)} (%{comparison.farkPct.toFixed(1)})
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="mb-6 rounded-2xl border border-zinc-200 bg-zinc-50/80 p-4 dark:border-zinc-800 dark:bg-zinc-900/70">
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              2026 resmî birim maliyet sınıfı ile karşılaştır
            </p>
            <p className="mt-1 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
              Resmî metrekare birim maliyetini seçip bu detaylı sonucu aynı alan için
              yan yana görebilirsiniz.
            </p>
            <Link
              href={officialLink}
              className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-blue-700 transition-colors hover:text-blue-800 dark:text-blue-300 dark:hover:text-blue-200"
            >
              Resmî aracı aç
              <ExternalLink className="h-4 w-4" />
            </Link>
          </div>
        )}

        {exportError ? (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
            {exportError}
          </div>
        ) : null}

        <div className="print-hidden grid grid-cols-2 gap-3 border-t border-zinc-200 pt-5 dark:border-zinc-800">
          <button
            type="button"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-300 bg-white px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
            onClick={() => window.print()}
          >
            <Printer className="h-4 w-4" />
            Yazdır
          </button>
          <button
            type="button"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-zinc-950 transition-colors hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-70"
            onClick={downloadPDF}
            disabled={isExporting}
          >
            <Download className={`h-4 w-4 ${isExporting ? "animate-spin" : ""}`} />
            {isExporting ? "Hazırlanıyor" : "PDF Raporu"}
          </button>
        </div>
      </div>
    </div>
  );
}
