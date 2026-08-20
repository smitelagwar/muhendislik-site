"use client";

import { AlertTriangle, CheckCircle2, CircleHelp, ShieldCheck } from "lucide-react";
import { formatSayi } from "@/lib/calculations/core";
import type {
  ConfidenceAssessment,
  DomainIssue,
  FeasibilityCalculationResult,
} from "@/lib/calculations/modules/ruhsat-on-fizibilite";
import type { FormIssue } from "../ruhsat-form-state";

interface RuhsatShellSummaryProps {
  confidence: ConfidenceAssessment;
  normalizationIssues: readonly DomainIssue[];
  assumptionIssues: readonly FormIssue[];
  calculation: FeasibilityCalculationResult | null;
}

function confidenceLabel(level: ConfidenceAssessment["level"]): string {
  if (level === "BELOW_A") return "A seviyesi henüz doğrulanmadı";
  return `Güven seviyesi ${level}`;
}

function confidenceDescription(confidence: ConfidenceAssessment): string {
  if (confidence.level === "BELOW_A") {
    return "Güncel ve okunaklı imar belgesi olmadan sonuçlar yalnız teorik ön değerlendirme niteliğindedir.";
  }
  if (confidence.missingForNextLevel.length === 0) {
    return "Belge ve çizim zinciri en yüksek tanımlı kontrol seviyesine ulaştı; yine de resmî onay değildir.";
  }
  return "Bir sonraki seviye için eksik belge veya proje verileri bulunuyor.";
}

export function RuhsatShellSummary({
  confidence,
  normalizationIssues,
  assumptionIssues,
  calculation,
}: RuhsatShellSummaryProps) {
  const diagnostics = calculation?.diagnostics ?? [];
  const analysis = calculation?.ok ? calculation.value : null;
  const legalRights = analysis?.legalRights ?? null;
  const hasBlockingInput = normalizationIssues.some((issue) => issue.severity === "error") || assumptionIssues.length > 0 || calculation?.ok === false;
  const missingMessages = [...normalizationIssues.map((issue) => issue.message), ...assumptionIssues.map((issue) => issue.message), ...diagnostics.map((diagnostic) => diagnostic.message)];

  return (
    <aside aria-live="polite" className="space-y-5" data-testid="ruhsat-shell-summary">
      <section className="overflow-hidden rounded-[28px] border border-border/80 bg-card/95 p-5 shadow-[0_16px_45px_rgba(0,0,0,0.08)] backdrop-blur-2xl sm:p-6 dark:border-violet-500/25 dark:bg-[#090d26]/90 dark:shadow-[0_20px_55px_rgba(0,0,0,0.45)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-violet-700 dark:text-violet-300">İlk durum</p>
            <h2 className="mt-1 text-xl font-black tracking-tight text-foreground dark:text-white" data-testid="ruhsat-result-status">
              {hasBlockingInput
                ? "Girdileri kontrol edin"
                : analysis?.status === "CALCULATED"
                  ? "Ön fizibilite hesaplandı"
                  : analysis?.status === "PARTIAL"
                    ? "Kısmi ön değerlendirme"
                    : "Hesap için kritik veri eksik"}
            </h2>
          </div>
          {analysis?.status === "CALCULATED" && !hasBlockingInput ? <CheckCircle2 className="h-6 w-6 shrink-0 text-emerald-600 dark:text-emerald-300" /> : <CircleHelp className="h-6 w-6 shrink-0 text-amber-600 dark:text-amber-300" />}
        </div>
        <p className="mt-3 text-sm leading-6 text-muted-foreground dark:text-slate-300">
          {analysis?.status === "CALCULATED" && !hasBlockingInput
            ? "Yasal üst sınırlar ve senaryo motoru üretildi. Sonuçların mimari yerleşim veya ruhsat onayı olmadığı unutulmamalıdır."
            : "Kritik alanları tamamladıkça motor yalnız desteklenen ve izlenebilir sonuçları gösterir; eksik veri yerine sayı uydurmaz."}
        </p>
      </section>

      <section className="rounded-[28px] border border-border/80 bg-card/90 p-5 shadow-sm backdrop-blur-2xl dark:border-blue-500/20 dark:bg-[#090d26]/85">
        <div className="flex items-start gap-3">
          <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-2 text-blue-700 dark:text-blue-300"><ShieldCheck className="h-5 w-5" /></div>
          <div>
            <h2 className="text-base font-black text-foreground dark:text-white" data-testid="ruhsat-confidence">{confidenceLabel(confidence.level)}</h2>
            <p className="mt-1 text-xs leading-5 text-muted-foreground dark:text-slate-400">{confidenceDescription(confidence)}</p>
          </div>
        </div>
      </section>

      {legalRights && (legalRights.taksMaxM2 !== null || legalRights.emsalMaxM2 !== null) ? (
        <section className="rounded-[28px] border border-border/80 bg-card/90 p-5 shadow-sm backdrop-blur-2xl dark:border-violet-500/20 dark:bg-[#090d26]/85">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-violet-700 dark:text-violet-300">Teorik üst sınırlar</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
            <div className="rounded-2xl border border-border/70 bg-muted/35 p-3 dark:border-white/10 dark:bg-[#070a1e]"><span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground dark:text-slate-400">TAKS max</span><strong className="mt-1 block font-mono text-lg text-foreground dark:text-white" data-testid="ruhsat-result-taks-max">{legalRights.taksMaxM2 === null ? "—" : `${formatSayi(legalRights.taksMaxM2, 2)} m²`}</strong></div>
            <div className="rounded-2xl border border-border/70 bg-muted/35 p-3 dark:border-white/10 dark:bg-[#070a1e]"><span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground dark:text-slate-400">Emsal max</span><strong className="mt-1 block font-mono text-lg text-foreground dark:text-white" data-testid="ruhsat-result-emsal-max">{legalRights.emsalMaxM2 === null ? "—" : `${formatSayi(legalRights.emsalMaxM2, 2)} m²`}</strong></div>
            <div className="rounded-2xl border border-border/70 bg-muted/35 p-3 dark:border-white/10 dark:bg-[#070a1e]"><span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground dark:text-slate-400">Etkin oturum</span><strong className="mt-1 block font-mono text-lg text-foreground dark:text-white" data-testid="ruhsat-result-footprint">{legalRights.effectiveFootprintLimitM2 === null ? "—" : `${formatSayi(legalRights.effectiveFootprintLimitM2, 2)} m²`}</strong></div>
          </div>
          {analysis?.scenarios.length ? <p className="mt-4 text-xs leading-5 text-muted-foreground dark:text-slate-400" data-testid="ruhsat-scenario-ready">Üç HEURISTIC daire senaryosu motor tarafından işlendi. Geometri ve yerleşim teyidi olmadan kesin yerleşim iddiası yapılmaz.</p> : null}
        </section>
      ) : null}

      {missingMessages.length > 0 ? (
        <section className="rounded-[28px] border border-amber-500/30 bg-amber-500/10 p-5 dark:border-amber-400/25 dark:bg-amber-500/10" data-testid="ruhsat-missing-data">
          <div className="flex gap-3"><AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700 dark:text-amber-300" /><div><h2 className="text-sm font-black text-amber-950 dark:text-amber-50">Eksik veya teyit bekleyen veri</h2><ul className="mt-2 space-y-1.5 text-xs leading-5 text-amber-900 dark:text-amber-100">{Array.from(new Set(missingMessages)).slice(0, 6).map((message) => <li key={message}>• {message}</li>)}</ul></div></div>
        </section>
      ) : null}
    </aside>
  );
}
