import { isSolidElement, type CadModel } from "./model";
import type { AnalysisResult } from "./analysis";
import type { ConcreteDesignResult } from "./design-engine";

export type ReportReadiness = {
  calculationComplete: boolean;
  designChecksSatisfied: boolean | null;
  professionalReviewState: "not_reviewed";
  status: "missing_data" | "fail" | "requires_review" | "pass";
  reasons: string[];
  missingElementIds: string[];
  failedElementIds: string[];
};

/** Eski sonuç/overallPass alanı yeni rapor için kabul kanıtı değildir. */
export function getReportReadiness(model: CadModel, analysis?: AnalysisResult | null, design?: ConcreteDesignResult): ReportReadiness {
  const required = model.elements.filter(isSolidElement);
  const members = analysis?.members ?? {};
  const missingElementIds = required.filter(e => !members[e.id]).map(e => e.id);
  const failedElementIds = Object.values(members).filter(m => m.pass === false).map(m => m.elementId);
  for (const check of Object.values(design?.memberChecks ?? {})) {
    if (check.pass === false && !failedElementIds.includes(check.elementId)) failedElementIds.push(check.elementId);
  }
  const relatedFailure = [
    ...Object.values(analysis?.joints ?? {}), ...Object.values(analysis?.punching ?? {}),
    ...Object.values(analysis?.columnBeamMoments ?? {}), ...Object.values(design?.joints ?? {}),
    ...Object.values(design?.punching ?? {}), ...Object.values(design?.columnBeamMoments ?? {}),
  ].some(c => c.pass === false)
    || analysis?.storeys?.some(s => s.driftPass === false)
    || design?.soilPressure?.pass === false
    || analysis?.overallPass === false || design?.summary?.overallPass === false;

  const bridge = analysis?.analyticalBridge;
  const failed = failedElementIds.length > 0 || relatedFailure;

  if (bridge) {
    const reasons: string[] = [];
    if (bridge.modalFull.status !== "solved") reasons.push(`3B modal analiz çözülemedi (${bridge.modalFull.reason ?? "hata"}).`);
    if (bridge.gravitySolve.status !== "solved") reasons.push(`3B düşey statik analiz çözülemedi (${bridge.gravitySolve.status}).`);
    if (bridge.globalChecks.B1.rReductionFactor === null) reasons.push("TBDY 2018 B1 zayıf kat sınırı (eta < 0.60) aşıldı.");
    for (const fact of bridge.missingFacts) {
      reasons.push(`Eksik doğrulama verisi: ${fact}`);
    }
    if (!analysis || !required.length || missingElementIds.length) {
      reasons.unshift("Model veya zorunlu eleman hesap verisi eksik.");
    }
    const calcOk = bridge.modalFull.status === "solved" && bridge.gravitySolve.status === "solved";
    const fullPass = calcOk && !failed && bridge.status === "solved" && bridge.missingFacts.length === 0 && !missingElementIds.length;
    return {
      calculationComplete: calcOk,
      designChecksSatisfied: failed ? false : fullPass ? true : null,
      professionalReviewState: "not_reviewed",
      status: failed || !calcOk ? "fail" : !required.length || missingElementIds.length ? "missing_data" : fullPass ? "pass" : "requires_review",
      reasons,
      missingElementIds,
      failedElementIds,
    };
  }

  const reasons = [
    "Mevcut ön hesap motorunun tam mevzuat ve yaprak kontrol kabulü tamamlanmadı.",
    "Sonuçların model/ayar/yük/donatı revizyon bağı doğrulanmadı; kayıtlı overallPass kabul edilmez.",
    "Gerçek donatı kesim listesi, kabuk/temel/merdiven ve gerekli kontrol kapsamı tamamlanmadı.",
  ];
  if (!analysis || !required.length || missingElementIds.length) reasons.unshift("Model veya zorunlu eleman hesap verisi eksik.");
  if (model.ideImport?.references.length) reasons.push(`${model.ideImport.references.length} native referans kaydı hesap kapsamına aktarılmadı.`);
  return {
    calculationComplete: false, designChecksSatisfied: failed ? false : null,
    professionalReviewState: "not_reviewed",
    status: failed ? "fail" : !analysis || !required.length || missingElementIds.length ? "missing_data" : "requires_review",
    reasons, missingElementIds, failedElementIds,
  };
}

export function reportStatusLabel(status: ReportReadiness["status"]): string {
  return status === "fail" ? "SAĞLANMADI - inceleme gerekli"
    : status === "missing_data" ? "VERİ EKSİK"
      : status === "pass" ? "DOĞRULANDI"
        : "DOĞRULAMA GEREKLİ";
}
