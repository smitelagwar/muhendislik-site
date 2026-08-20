"use client";

import { useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  CircleAlert,
  CircleHelp,
  FileText,
  ShieldAlert,
  Sparkles,
  Wrench,
} from "lucide-react";
import { formatSayi } from "@/lib/calculations/core";
import type {
  AnalysisQaCode,
  CalculationTrace,
  FeasibilityAnalysis,
  PrimaryBottleneckCode,
  ScenarioConvergenceStatus,
  ScenarioId,
  ScenarioResult,
  TechnicalCheckState,
  TechnicalTriggerSet,
} from "@/lib/calculations/modules/ruhsat-on-fizibilite";

interface RuhsatResultsExperienceProps {
  analysis: FeasibilityAnalysis | null;
}

const SCENARIO_COPY: Record<ScenarioId, { title: string; description: string }> = {
  COMPACT_MAX_UNITS: {
    title: "Kompakt",
    description: "Daha küçük hedef alanlarla BB adedini önceler.",
  },
  BALANCED: {
    title: "Dengeli",
    description: "Alan ile bağımsız bölüm sayısı arasında denge arar.",
  },
  COMFORT_FEWER_UNITS: {
    title: "Konforlu",
    description: "Daha geniş hedef alanlarla daha az BB öngörür.",
  },
};

const BOTTLENECK_COPY: Record<PrimaryBottleneckCode, { title: string; description: string }> = {
  TAKS: {
    title: "TAKS / yasal oturum sınırı",
    description: "Kat başına aday kapasite, yasal oturum üst sınırında daralıyor.",
  },
  GEOMETRY: {
    title: "Geometri ve yerleşim teyidi",
    description: "Parsel geometri kapasitesi bilinmiyor veya yasal oturumdan daha dar bir sınır oluşturuyor.",
  },
  EMSAL: {
    title: "Emsal üst sınırı",
    description: "Toplam aday bağımsız bölüm kapasitesi emsal hakkıyla sınırlanıyor.",
  },
  CORE: {
    title: "Çekirdek ve ortak alan",
    description: "Çekirdek, ortak alan veya sirkülasyon rezervleri kat kapasitesini etkiliyor.",
  },
  LIFT: {
    title: "Asansör rezervi",
    description: "Asansör tetikleyicisi için ayrılan alan aday kat kapasitesini etkiliyor.",
  },
  FIRE: {
    title: "Yangın inceleme rezervi",
    description: "Yükseklik inceleme kapısı için ayrılan rezerv aday kapasiteyi etkiliyor.",
  },
  SHELTER: {
    title: "Sığınak kapasitesi",
    description: "Verilen manuel sığınak kişi kapasitesi aday bağımsız bölüm sayısını karşılamıyor.",
  },
  INSUFFICIENT_DATA: {
    title: "Kritik veri eksik",
    description: "Senaryo üretmek için gerekli imar veya proje verisi henüz tamamlanmadı.",
  },
};

const QA_COPY: Record<AnalysisQaCode, string> = {
  THEORETICAL_ONLY: "Güncel imar belgesi teyit edilmeden sonuç teorik ön değerlendirme niteliğindedir.",
  GEOMETRY_UNVERIFIED: "Manuel geometri kapasitesi yok; etkin oturum yalnız yasal üst sınır kabul edildi.",
  ARCHITECTURAL_FIT_UNVERIFIED: "Mimari ön plan olmadan yerleşim uyumu doğrulanmadı.",
  LOCAL_RULES_UNCONFIRMED: "Yerel plan notları ve idare uygulaması ayrıca teyit edilmelidir.",
  PARKING_RULE_UNCONFIRMED: "Otopark çözümü bu ön etütte kesin sayı olarak üretilmedi.",
  SCENARIOS_COLLAPSED: "Senaryolardan en az ikisi aynı BB sonucuna yaklaştı; mimari ayrım için daha fazla veri gerekebilir.",
  SCENARIO_NON_CONVERGENCE: "En az bir senaryo sabitlenemedi; son iterasyon kesin sonuç olarak kullanılmadı.",
};

function convergenceCopy(status: ScenarioConvergenceStatus): { label: string; detail: string } {
  if (status === "CONVERGED") {
    return { label: "Sabitlendi", detail: "Tetikler ve kapasite aynı aday sonuçta buluştu." };
  }
  if (status === "CYCLE_DETECTED") {
    return { label: "Döngü algılandı", detail: "Karşılıklı tetikler sonucu değiştirdi; kesin aday sayı verilmedi." };
  }
  return { label: "İterasyon sınırı", detail: "Güvenli iterasyon sınırında sabit sonuç oluşmadı." };
}

function triggerLabel(state: TechnicalCheckState): string {
  if (state === "NOT_TRIGGERED") return "Tetiklenmedi";
  if (state === "CHECK_REQUIRED") return "Kontrol gerekli";
  if (state === "REQUIRES_CONFIRMATION") return "Teyit gerekli";
  return "Veri bekleniyor";
}

function provenanceLabel(status: string): string {
  const labels: Record<string, string> = {
    DOCUMENT: "Belge",
    CALCULATION: "Hesap",
    MEASUREMENT: "Ölçüm",
    ASSUMPTION: "Varsayım",
    HEURISTIC: "Heuristic",
    REQUIRES_CONFIRMATION: "Teyit gerekli",
    HISTORICAL_RULE: "Tarihsel kural",
    LOCAL_RULE: "Yerel kural",
    GEOMETRY_CONFIRMATION: "Geometri teyidi",
    ARCHITECTURAL_CONFIRMATION: "Mimari teyit",
  };
  return labels[status] ?? status;
}

function TriggerSummary({ triggers }: { triggers: TechnicalTriggerSet }) {
  const rows = [
    {
      label: "Asansör",
      state: triggers.lift.state,
      detail:
        triggers.lift.requiredLiftCount === null
          ? "Kullanım türü veya proje koşulu teyit bekliyor."
          : triggers.lift.requiredLiftCount === 0
            ? triggers.lift.shaftReservationRequired
              ? "Şaft rezervi incelenmeli."
              : "Asansör tetiklenmedi."
            : `${triggers.lift.requiredLiftCount} asansör için rezerv dikkate alındı.`,
    },
    {
      label: "Sığınak",
      state: triggers.shelter.state,
      detail:
        triggers.shelter.estimatedPersonEquivalent === null
          ? "Kişi eşdeğeri kesinleşmedi."
          : `${formatSayi(triggers.shelter.estimatedPersonEquivalent, 0)} kişi eşdeğeri incelendi.`,
    },
    {
      label: "Yangın",
      state: triggers.fire.state,
      detail: triggers.fire.heightGateReached ? "Yükseklik inceleme kapısı açıldı." : "Yükseklik kapısı açılmadı veya veri eksik.",
    },
    {
      label: "nSEB",
      state: triggers.nseb.state,
      detail: `${formatSayi(triggers.nseb.evaluatedAreaM2 ?? 0, 2)} m² teorik yapı alanı üzerinden değerlendirildi.`,
    },
    {
      label: "Yağmur suyu",
      state: triggers.rainWater.state,
      detail: `${formatSayi(triggers.rainWater.evaluatedAreaM2 ?? 0, 2)} m² etkin oturum üzerinden değerlendirildi.`,
    },
  ];

  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {rows.map((row) => (
        <div key={row.label} className="rounded-xl border border-border/70 bg-background/50 p-3 dark:border-white/10 dark:bg-[#070a1e]/65">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-black text-foreground dark:text-white">{row.label}</span>
            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold text-muted-foreground dark:bg-white/10 dark:text-slate-300">{triggerLabel(row.state)}</span>
          </div>
          <p className="mt-1.5 text-[11px] leading-5 text-muted-foreground dark:text-slate-400">{row.detail}</p>
        </div>
      ))}
    </div>
  );
}

function TraceCard({ label, trace }: { label: string; trace: CalculationTrace | null }) {
  if (!trace) {
    return <p className="text-xs leading-5 text-muted-foreground dark:text-slate-400">{label}: Bu hesap için yeterli kaynaklı veri yok.</p>;
  }

  return (
    <div className="rounded-xl border border-border/70 bg-background/50 p-3 dark:border-white/10 dark:bg-[#070a1e]/65">
      <p className="text-xs font-black text-foreground dark:text-white">{label}</p>
      <p className="mt-1 text-[11px] leading-5 text-muted-foreground dark:text-slate-400">{trace.formula}</p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {trace.inputStatuses.map((status, index) => <span key={`${status}-${index}`} className="rounded-full border border-blue-500/20 bg-blue-500/10 px-2 py-0.5 text-[10px] font-bold text-blue-700 dark:text-blue-200">{provenanceLabel(status)}</span>)}
        {trace.approximate ? <span className="rounded-full border border-amber-500/25 bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-800 dark:text-amber-200">Yaklaşık / teyit bekliyor</span> : null}
      </div>
      {trace.sourceIds.length > 0 ? <p className="mt-2 text-[10px] leading-4 text-muted-foreground dark:text-slate-500">Kaynak: {trace.sourceIds.join(", ")}</p> : null}
    </div>
  );
}

function ScenarioCard({ scenario, selected, onSelect }: { scenario: ScenarioResult; selected: boolean; onSelect: () => void }) {
  const copy = SCENARIO_COPY[scenario.id];
  const convergence = convergenceCopy(scenario.convergenceStatus);
  const isStable = scenario.convergenceStatus === "CONVERGED";

  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
      data-testid={`ruhsat-scenario-${scenario.id}`}
      className={`min-w-0 rounded-2xl border p-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 ${selected ? "border-violet-500 bg-violet-500/10 shadow-[0_10px_28px_rgba(124,58,237,0.12)] dark:border-violet-400 dark:bg-violet-500/15" : "border-border/80 bg-background/45 hover:border-violet-400/60 dark:border-white/10 dark:bg-[#070a1e]/65"}`}
    >
      <div className="flex items-start justify-between gap-3">
        <span>
          <span className="block text-sm font-black text-foreground dark:text-white">{copy.title}</span>
          <span className="mt-1 block text-[11px] leading-4 text-muted-foreground dark:text-slate-400">{copy.description}</span>
        </span>
        {isStable ? <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-300" /> : <CircleAlert className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-300" />}
      </div>
      <div className="mt-4">
        <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground dark:text-slate-400">Aday BB adedi</span>
        <strong className="mt-1 block font-mono text-2xl font-black text-foreground dark:text-white">{scenario.finalTotalUnits === null ? "—" : formatSayi(scenario.finalTotalUnits, 0)}</strong>
        <span className="text-[11px] text-muted-foreground dark:text-slate-400">{scenario.finalUnitsPerFloor === null ? convergence.label : `${formatSayi(scenario.finalUnitsPerFloor, 0)} BB / kat`}</span>
      </div>
      <div className="mt-3 border-t border-border/70 pt-3 text-[11px] text-muted-foreground dark:border-white/10 dark:text-slate-400">
        Hedef kapalı brüt: <strong className="font-mono text-foreground dark:text-slate-200">{formatSayi(scenario.targetClosedGrossAreaM2, 0)} m²</strong>
      </div>
    </button>
  );
}

export function RuhsatResultsExperience({ analysis }: RuhsatResultsExperienceProps) {
  const [selectedId, setSelectedId] = useState<ScenarioId>("BALANCED");
  const scenarios = analysis?.scenarios ?? [];
  const selectedScenario = scenarios.find((scenario) => scenario.id === selectedId) ?? scenarios[0] ?? null;

  if (!analysis || analysis.status === "INSUFFICIENT_DATA" || scenarios.length === 0) {
    return (
      <section data-testid="ruhsat-results-empty" className="rounded-[28px] border border-dashed border-border bg-card/60 p-5 text-sm shadow-sm backdrop-blur-xl dark:border-white/15 dark:bg-[#090d26]/65">
        <div className="flex gap-3"><CircleHelp className="h-5 w-5 shrink-0 text-violet-700 dark:text-violet-300" /><div><h2 className="font-black text-foreground dark:text-white">Senaryo karşılaştırması hazır bekliyor</h2><p className="mt-1.5 text-xs leading-5 text-muted-foreground dark:text-slate-400">Ruhsat başvuru tarihi, parsel alanı, TAKS, KAKS ve kat adedi geçerli olduğunda üç aday senaryo burada karşılaştırılır.</p></div></div>
      </section>
    );
  }

  const bottleneck = selectedScenario?.primaryBottleneck
    ? BOTTLENECK_COPY[selectedScenario.primaryBottleneck]
    : null;
  const lastIteration = selectedScenario?.iterations.at(-1) ?? null;
  const convergence = selectedScenario ? convergenceCopy(selectedScenario.convergenceStatus) : null;

  return (
    <section aria-labelledby="ruhsat-results-title" className="space-y-5" data-testid="ruhsat-results-experience">
      <div className="rounded-[28px] border border-border/80 bg-card/95 p-5 shadow-sm backdrop-blur-2xl sm:p-6 dark:border-violet-500/20 dark:bg-[#090d26]/90">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-violet-700 dark:text-violet-300">Daire senaryoları</p>
            <h2 id="ruhsat-results-title" className="mt-1 text-xl font-black tracking-tight text-foreground dark:text-white">Üç aday, tek güven sınırı</h2>
            <p className="mt-2 text-xs leading-5 text-muted-foreground dark:text-slate-400">Kartlardan birini seçerek ana darboğazı ve nedeni görün. Sayılar kesin mimari yerleşim iddiası değildir.</p>
          </div>
          <Sparkles className="h-6 w-6 shrink-0 text-violet-700 dark:text-violet-300" />
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-3" role="group" aria-label="Daire senaryosu seçimi">
          {scenarios.map((scenario) => <ScenarioCard key={scenario.id} scenario={scenario} selected={selectedScenario?.id === scenario.id} onSelect={() => setSelectedId(scenario.id)} />)}
        </div>
      </div>

      {selectedScenario ? (
        <>
          <section className="rounded-[28px] border border-border/80 bg-card/90 p-5 shadow-sm backdrop-blur-2xl dark:border-blue-500/20 dark:bg-[#090d26]/85" data-testid="ruhsat-main-bottleneck">
            <div className="flex items-start gap-3">
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-2 text-amber-700 dark:text-amber-200"><AlertTriangle className="h-5 w-5" /></div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-amber-800 dark:text-amber-200">Seçili senaryonun ana darboğazı</p>
                <h3 className="mt-1 text-lg font-black text-foreground dark:text-white">{bottleneck?.title ?? "Sabit sonuç oluşmadı"}</h3>
                <p className="mt-1.5 text-xs leading-5 text-muted-foreground dark:text-slate-400">{bottleneck?.description ?? convergence?.detail}</p>
              </div>
            </div>
            <div className="mt-4 rounded-xl border border-border/70 bg-background/45 p-3 text-xs leading-5 text-muted-foreground dark:border-white/10 dark:bg-[#070a1e]/65 dark:text-slate-400">
              <strong className="text-foreground dark:text-slate-200">Yerleşim statüsü:</strong> {selectedScenario.placementClaimStatus === "CANDIDATE_GEOMETRY_UNVERIFIED" ? "Geometri teyitsiz aday" : selectedScenario.placementClaimStatus === "CANDIDATE_ARCHITECTURAL_FIT_UNVERIFIED" ? "Mimari uyum teyitsiz aday" : "Ön plan kapasitesi adayı"}. Kesin yerleşim iddiası: hayır.
            </div>
          </section>

          <details className="group rounded-[28px] border border-border/80 bg-card/90 p-5 shadow-sm backdrop-blur-2xl dark:border-white/10 dark:bg-[#090d26]/85" data-testid="ruhsat-why-details">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
              <span className="flex items-start gap-3"><span className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-2 text-blue-700 dark:text-blue-300"><Wrench className="h-5 w-5" /></span><span><span className="block text-base font-black text-foreground dark:text-white">Neden bu sonuç?</span><span className="mt-1 block text-xs leading-5 text-muted-foreground dark:text-slate-400">Kapasite, rezerv ve teknik tetiklerin son sabit adımını görün.</span></span></span>
              <ChevronDown className="h-5 w-5 shrink-0 text-violet-700 transition group-open:rotate-180 dark:text-violet-300" />
            </summary>
            <div className="mt-5 space-y-4">
              {lastIteration ? <div className="grid gap-3 sm:grid-cols-3"><div className="rounded-xl border border-border/70 bg-background/50 p-3 dark:border-white/10 dark:bg-[#070a1e]/65"><span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground dark:text-slate-400">BB’ye ayrılabilir kat alanı</span><strong className="mt-1 block font-mono text-base text-foreground dark:text-white">{formatSayi(lastIteration.areaAllocatableToUnitsM2, 2)} m²</strong></div><div className="rounded-xl border border-border/70 bg-background/50 p-3 dark:border-white/10 dark:bg-[#070a1e]/65"><span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground dark:text-slate-400">Kat rezervleri</span><strong className="mt-1 block font-mono text-base text-foreground dark:text-white">{formatSayi(lastIteration.reserves.totalReservedAreaM2, 2)} m²</strong></div><div className="rounded-xl border border-border/70 bg-background/50 p-3 dark:border-white/10 dark:bg-[#070a1e]/65"><span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground dark:text-slate-400">İterasyon durumu</span><strong className="mt-1 block text-base text-foreground dark:text-white">{convergence?.label}</strong></div></div> : <p className="text-xs leading-5 text-muted-foreground dark:text-slate-400">Sabit bir iterasyon adımı oluşmadığı için alan rezerv ayrıntısı kesinleştirilmedi.</p>}
              {selectedScenario.triggers ? <div><h4 className="mb-2 text-sm font-black text-foreground dark:text-white">Teknik kontrol özeti</h4><TriggerSummary triggers={selectedScenario.triggers} /></div> : null}
            </div>
          </details>

          <details className="group rounded-[28px] border border-border/80 bg-card/90 p-5 shadow-sm backdrop-blur-2xl dark:border-white/10 dark:bg-[#090d26]/85" data-testid="ruhsat-evidence-details">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4"><span className="flex items-start gap-3"><span className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-2 text-emerald-700 dark:text-emerald-300"><FileText className="h-5 w-5" /></span><span><span className="block text-base font-black text-foreground dark:text-white">Kaynak, hesap ve teyit izi</span><span className="mt-1 block text-xs leading-5 text-muted-foreground dark:text-slate-400">Yasal üst sınırların hangi veri statüsüyle oluştuğunu kontrol edin.</span></span></span><ChevronDown className="h-5 w-5 shrink-0 text-violet-700 transition group-open:rotate-180 dark:text-violet-300" /></summary>
            <div className="mt-5 grid gap-3"><TraceCard label="TAKS üst sınırı" trace={analysis.legalRights.traces.taksMax} /><TraceCard label="Emsal üst sınırı" trace={analysis.legalRights.traces.emsalMax} /><TraceCard label="Etkin oturum" trace={analysis.legalRights.traces.effectiveFootprintLimit} /><p className="text-[11px] leading-5 text-muted-foreground dark:text-slate-400"><strong className="text-foreground dark:text-slate-200">Senaryo alanları:</strong> HEURISTIC. Rule snapshot: {analysis.versions.ruleSnapshot}.</p></div>
          </details>

          {analysis.qa.length > 0 ? <section className="rounded-[28px] border border-amber-500/25 bg-amber-500/10 p-5 dark:border-amber-400/20 dark:bg-amber-500/10" data-testid="ruhsat-qa-notes"><div className="flex gap-3"><ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-800 dark:text-amber-200" /><div><h3 className="text-sm font-black text-amber-950 dark:text-amber-50">Sonucu etkileyen teyit notları</h3><ul className="mt-2 space-y-1.5 text-xs leading-5 text-amber-900 dark:text-amber-100">{analysis.qa.map((code) => <li key={code}>• {QA_COPY[code]}</li>)}</ul></div></div></section> : null}
        </>
      ) : null}
    </section>
  );
}
