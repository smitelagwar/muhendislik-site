import { formatSayi } from "@/lib/calculations/core";
import type { PdfExportSnapshot } from "@/lib/calculations/reporting";
import type { FeasibilityAnalysis, RawRuhsatAnalysisInput, ScenarioResult } from "./index";

export const RUHSAT_EXPORT_SCHEMA_VERSION = "ruhsat-on-fizibilite-export@1" as const;

export interface RuhsatAnalysisExport {
  schemaVersion: typeof RUHSAT_EXPORT_SCHEMA_VERSION;
  exportedAt: string;
  rawInput: RawRuhsatAnalysisInput;
  analysis: FeasibilityAnalysis;
}

function optionalText(value: string | null): string {
  return value?.trim() || "Belirtilmedi";
}

function numberOrConfirmation(value: number | null): string {
  return value === null ? "Teyit bekliyor" : `${formatSayi(value, 2)} m²`;
}

function confidenceLabel(level: FeasibilityAnalysis["confidence"]["level"]): string {
  return level === "BELOW_A" ? "A seviyesi altında" : `Güven seviyesi ${level}`;
}

function convergenceLabel(scenario: ScenarioResult): string {
  if (scenario.convergenceStatus === "CONVERGED") return "Sabitlendi";
  if (scenario.convergenceStatus === "CYCLE_DETECTED") return "Döngü algılandı";
  return "İterasyon sınırında";
}

function scenarioLabel(scenario: ScenarioResult): string {
  if (scenario.id === "COMPACT_MAX_UNITS") return "Kompakt";
  if (scenario.id === "BALANCED") return "Dengeli";
  return "Konforlu";
}

function bottleneckLabel(scenario: ScenarioResult): string {
  const labels: Record<NonNullable<ScenarioResult["primaryBottleneck"]>, string> = {
    TAKS: "TAKS / yasal oturum",
    GEOMETRY: "Geometri teyidi",
    EMSAL: "Emsal üst sınırı",
    CORE: "Çekirdek ve ortak alan",
    LIFT: "Asansör rezervi",
    FIRE: "Yangın incelemesi",
    SHELTER: "Sığınak kapasitesi",
    INSUFFICIENT_DATA: "Kritik veri eksik",
  };
  return scenario.primaryBottleneck ? labels[scenario.primaryBottleneck] : "Sabit sonuç oluşmadı";
}

function qaLabel(code: FeasibilityAnalysis["qa"][number]): string {
  const labels: Record<FeasibilityAnalysis["qa"][number], string> = {
    THEORETICAL_ONLY: "Sonuç teorik ön değerlendirme niteliğindedir.",
    GEOMETRY_UNVERIFIED: "Manuel geometri kapasitesi teyit edilmedi.",
    ARCHITECTURAL_FIT_UNVERIFIED: "Mimari ön plan uyumu doğrulanmadı.",
    LOCAL_RULES_UNCONFIRMED: "Yerel plan notları ayrıca teyit edilmelidir.",
    PARKING_RULE_UNCONFIRMED: "Otopark çözümü kesin sayı olarak üretilmedi.",
    SCENARIOS_COLLAPSED: "Senaryo sonuçları birbirine yaklaştı.",
    SCENARIO_NON_CONVERGENCE: "En az bir senaryo sabitlenemedi.",
  };
  return labels[code];
}

function technicalSummary(scenario: ScenarioResult): string {
  if (!scenario.triggers) return "Teknik tetik özeti için sabitlenmiş senaryo yok.";
  const { lift, shelter, fire, parking } = scenario.triggers;
  const liftText = lift.requiredLiftCount === null ? "asansör teyit bekliyor" : `${lift.requiredLiftCount} asansör`;
  const shelterText = shelter.estimatedPersonEquivalent === null ? "sığınak kişisi teyit bekliyor" : `${formatSayi(shelter.estimatedPersonEquivalent, 0)} kişi eşdeğeri`;
  const fireText = fire.heightGateReached ? "yangın yükseklik kapısı açık" : "yangın kapısı açık değil / teyit bekliyor";
  const parkingText = parking.state === "REQUIRES_CONFIRMATION" ? "teyit gerekli" : parking.state;
  return `${liftText}; ${shelterText}; ${fireText}; otopark: ${parkingText}.`;
}

export function buildRuhsatPdfSnapshot(
  analysis: FeasibilityAnalysis,
  rawInput: RawRuhsatAnalysisInput,
  generatedAt = new Date().toLocaleString("tr-TR")
): PdfExportSnapshot {
  const legalRights = analysis.legalRights;
  const scenarioRows = analysis.scenarios.map((scenario) => ({
    label: `${scenarioLabel(scenario)} - ${convergenceLabel(scenario)}`,
    value: scenario.finalTotalUnits === null
      ? `${formatSayi(scenario.observedUnitCountRange.minimum, 0)}-${formatSayi(scenario.observedUnitCountRange.maximum, 0)} aday BB; ${bottleneckLabel(scenario)}`
      : `${formatSayi(scenario.finalTotalUnits, 0)} aday BB (${formatSayi(scenario.finalUnitsPerFloor ?? 0, 0)} BB/kat); ${bottleneckLabel(scenario)}`,
  }));

  return {
    variant: "calculation",
    badge: "RUHSAT ÖN ETÜDÜ",
    title: "Ruhsat Ön Fizibilite Raporu",
    subtitle: "Teorik imar hakları, daire senaryoları ve teyit notları",
    generatedAt,
    highlights: [
      {
        label: "Veri güveni",
        value: confidenceLabel(analysis.confidence.level),
        helper: "Belge zinciri ve proje verisine göre",
        tone: "violet",
      },
      {
        label: "TAKS üst sınırı",
        value: numberOrConfirmation(legalRights.taksMaxM2),
        helper: "Parsel alanı × TAKS",
        tone: "blue",
      },
      {
        label: "Emsal üst sınırı",
        value: numberOrConfirmation(legalRights.emsalMaxM2),
        helper: "Parsel alanı × KAKS",
        tone: "emerald",
      },
      {
        label: "Etkin oturum",
        value: numberOrConfirmation(legalRights.effectiveFootprintLimitM2),
        helper: legalRights.geometryStatus === "MANUAL_CAPACITY_PROVIDED" ? "Manuel geometri kapasitesi dikkate alındı" : "Geometri teyidi bekliyor",
        tone: "amber",
      },
    ],
    sections: [
      {
        title: "Analiz kapsamı",
        rows: [
          { label: "Ruhsat başvuru tarihi", value: optionalText(rawInput.project.permitApplicationDate) },
          { label: "Belediye / ilçe", value: `${optionalText(rawInput.project.municipality)} / ${optionalText(rawInput.project.district)}` },
          { label: "Kullanım", value: rawInput.project.useType === "RESIDENTIAL" ? "Konut" : optionalText(rawInput.project.useType) },
          { label: "Hedef BB tipi", value: optionalText(rawInput.program.targetUnitType) },
          { label: "Analiz durumu", value: analysis.status === "CALCULATED" ? "Hesaplandı" : analysis.status === "PARTIAL" ? "Kısmi ön değerlendirme" : "Kritik veri eksik" },
        ],
      },
      {
        title: "Yasal haklar ve geometri",
        rows: [
          { label: "Parsel alanı", value: numberOrConfirmation(legalRights.parcelAreaM2) },
          { label: "TAKS / KAKS", value: `${legalRights.taks === null ? "Teyit bekliyor" : formatSayi(legalRights.taks, 2)} / ${legalRights.kaks === null ? "Teyit bekliyor" : formatSayi(legalRights.kaks, 2)}` },
          { label: "TAKS üst sınırı", value: numberOrConfirmation(legalRights.taksMaxM2) },
          { label: "Emsal üst sınırı", value: numberOrConfirmation(legalRights.emsalMaxM2) },
          { label: "Etkin oturum sınırı", value: numberOrConfirmation(legalRights.effectiveFootprintLimitM2) },
          { label: "Geometri durumu", value: legalRights.geometryStatus === "MANUAL_CAPACITY_PROVIDED" ? "Manuel kapasite sağlandı" : "Geometri teyidi bekliyor" },
        ],
      },
      {
        title: "Daire senaryoları",
        rows: scenarioRows.length > 0 ? scenarioRows : [{ label: "Senaryo", value: "Kritik veriler tamamlanmadığı için üretilemedi." }],
      },
      {
        title: "Teknik inceleme özeti",
        rows: analysis.scenarios.map((scenario) => ({ label: scenarioLabel(scenario), value: technicalSummary(scenario) })),
      },
      {
        title: "İz ve sürüm bilgisi",
        rows: [
          { label: "Kural snapshot", value: analysis.versions.ruleSnapshot },
          { label: "Analiz / motor", value: `${analysis.versions.analysisSchema} / ${analysis.versions.engine}` },
          { label: "Varsayım politikası", value: `${analysis.versions.assumptionPolicy} (HEURISTIC)` },
          { label: "Hesap izleri", value: "TAKS, emsal ve etkin oturum hesap iziyle üretildi." },
        ],
      },
    ],
    footnotes: [
      "Bu rapor istemci tarafında, kullanıcının mevcut girdilerinden üretilmiştir; veri sunucuya gönderilmez veya tarayıcıda otomatik saklanmaz.",
      "Daire adetleri aday kapasitedir. Geometri, mimari uyum, yerel plan notları, otopark ve ilgili teknik kontroller teyit edilmeden kesin yerleşim ya da ruhsat sonucu olarak kullanılamaz.",
      ...analysis.qa.map(qaLabel),
    ],
  };
}

export function buildRuhsatAnalysisExport(
  rawInput: RawRuhsatAnalysisInput,
  analysis: FeasibilityAnalysis,
  exportedAt = new Date().toISOString()
): RuhsatAnalysisExport {
  return {
    schemaVersion: RUHSAT_EXPORT_SCHEMA_VERSION,
    exportedAt,
    rawInput,
    analysis,
  };
}
