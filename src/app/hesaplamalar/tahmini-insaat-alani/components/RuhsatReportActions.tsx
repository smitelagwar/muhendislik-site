"use client";

import { useState } from "react";
import { Download, FileJson2, FileText, LoaderCircle, Printer, ShieldCheck } from "lucide-react";
import type {
  FeasibilityAnalysis,
  RawRuhsatAnalysisInput,
} from "@/lib/calculations/modules/ruhsat-on-fizibilite";

interface RuhsatReportActionsProps {
  analysis: FeasibilityAnalysis | null;
  rawInput: RawRuhsatAnalysisInput;
}

function exportFilename(extension: "json" | "pdf"): string {
  const date = new Date().toISOString().slice(0, 10);
  return `ruhsat-on-fizibilite-${date}.${extension}`;
}

function downloadJson(content: unknown, filename: string): void {
  const blob = new Blob([JSON.stringify(content, null, 2)], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
}

export function RuhsatReportActions({ analysis, rawInput }: RuhsatReportActionsProps) {
  const [activeAction, setActiveAction] = useState<"pdf" | "print" | "json" | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!analysis || analysis.status !== "CALCULATED") {
    return null;
  }

  const buildSnapshot = async () => {
    const reporting = await import("@/lib/calculations/modules/ruhsat-on-fizibilite/reporting");
    return reporting.buildRuhsatPdfSnapshot(analysis, rawInput);
  };

  const handlePdf = async () => {
    setActiveAction("pdf");
    setError(null);
    try {
      const [snapshot, pdfReporting] = await Promise.all([
        buildSnapshot(),
        import("@/lib/calculations/reporting"),
      ]);
      pdfReporting.exportPdf(snapshot, exportFilename("pdf"));
    } catch (cause) {
      console.error("Ruhsat ön fizibilite PDF raporu oluşturulamadı", cause);
      setError("PDF raporu oluşturulamadı. Lütfen yazdırılabilir önizlemeyi yeniden deneyin.");
    } finally {
      setActiveAction(null);
    }
  };

  const handlePrint = async () => {
    setActiveAction("print");
    setError(null);
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      setError("Yazdırılabilir görünüm açılamadı. Pop-up engelleyicisini kontrol edip yeniden deneyin.");
      setActiveAction(null);
      return;
    }
    try {
      const [snapshot, pdfReporting] = await Promise.all([
        buildSnapshot(),
        import("@/lib/calculations/reporting"),
      ]);
      pdfReporting.printPdfExport(snapshot, printWindow);
    } catch (cause) {
      printWindow.close();
      console.error("Ruhsat ön fizibilite yazdırma görünümü açılamadı", cause);
      setError("Yazdırılabilir görünüm açılamadı. Pop-up engelleyicisini kontrol edip yeniden deneyin.");
    } finally {
      setActiveAction(null);
    }
  };

  const handleJson = async () => {
    setActiveAction("json");
    setError(null);
    try {
      const reporting = await import("@/lib/calculations/modules/ruhsat-on-fizibilite/reporting");
      downloadJson(reporting.buildRuhsatAnalysisExport(rawInput, analysis), exportFilename("json"));
    } catch (cause) {
      console.error("Ruhsat ön fizibilite JSON dışa aktarımı oluşturulamadı", cause);
      setError("JSON dışa aktarımı oluşturulamadı. Girdileri kontrol edip yeniden deneyin.");
    } finally {
      setActiveAction(null);
    }
  };

  const isBusy = activeAction !== null;
  const actionLabel = activeAction === "pdf" ? "PDF hazırlanıyor" : activeAction === "print" ? "Önizleme açılıyor" : activeAction === "json" ? "JSON hazırlanıyor" : null;

  return (
    <section className="rounded-[28px] border border-border/80 bg-card/90 p-5 shadow-sm backdrop-blur-2xl dark:border-emerald-500/20 dark:bg-[#090d26]/85" data-testid="ruhsat-report-actions" aria-labelledby="ruhsat-report-actions-title">
      <div className="flex items-start gap-3">
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-2 text-emerald-700 dark:text-emerald-300"><FileText className="h-5 w-5" /></div>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-emerald-700 dark:text-emerald-300">Yerel çıktı</p>
          <h2 id="ruhsat-report-actions-title" className="mt-1 text-base font-black text-foreground dark:text-white">Raporu yalnız sizin tarayıcınızda oluşturun</h2>
          <p className="mt-1.5 text-xs leading-5 text-muted-foreground dark:text-slate-400">PDF, yazdırma görünümü ve JSON dosyası bu oturumdaki verilerle hazırlanır. Otomatik kayıt, URL paylaşımı veya sunucuya veri gönderimi yoktur.</p>
        </div>
      </div>

      <div className="mt-5 grid gap-2 sm:grid-cols-3">
        <button type="button" onClick={handlePdf} disabled={isBusy} data-testid="ruhsat-report-pdf" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-3 py-2.5 text-xs font-black text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-65 dark:bg-emerald-500 dark:text-emerald-950 dark:hover:bg-emerald-400">
          {activeAction === "pdf" ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />} PDF indir
        </button>
        <button type="button" onClick={handlePrint} disabled={isBusy} data-testid="ruhsat-report-print" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border bg-background/60 px-3 py-2.5 text-xs font-black text-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-65 dark:border-white/15 dark:bg-[#070a1e]/70 dark:text-white dark:hover:bg-white/10">
          {activeAction === "print" ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4" />} Yazdır
        </button>
        <button type="button" onClick={handleJson} disabled={isBusy} data-testid="ruhsat-report-json" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border bg-background/60 px-3 py-2.5 text-xs font-black text-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-65 dark:border-white/15 dark:bg-[#070a1e]/70 dark:text-white dark:hover:bg-white/10">
          {activeAction === "json" ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <FileJson2 className="h-4 w-4" />} JSON dışa aktar
        </button>
      </div>

      <div className="mt-4 flex gap-2 rounded-xl border border-blue-500/20 bg-blue-500/10 p-3 text-[11px] leading-5 text-blue-900 dark:border-blue-400/20 dark:text-blue-100">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
        <span>Rapor, kural snapshot ve varsayım sürümünü taşır. Kesin mimari yerleşim ya da ruhsat onayı değildir.</span>
      </div>
      <p className="sr-only" aria-live="polite">{actionLabel}</p>
      {error ? <p role="alert" className="mt-3 rounded-xl border border-red-500/25 bg-red-500/10 p-3 text-xs leading-5 text-red-800 dark:text-red-100" data-testid="ruhsat-report-error">{error}</p> : null}
    </section>
  );
}
