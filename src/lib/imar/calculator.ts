import {
  IMAR_BASEMENT_HEIGHT_M,
  IMAR_HIGH_RISE_WARNING_FLOOR_COUNT,
  IMAR_KAKS_ROUNDING_TOLERANCE,
  IMAR_NORMAL_FLOOR_HEIGHT_M,
  IMAR_TAKS_WARNING_THRESHOLD,
} from "@/lib/imar/config";
import type { ImarCalculationResult, ImarCalculatorInput, ImarWarning } from "@/lib/imar/types";

function getStatusMeta(warnings: ImarWarning[]) {
  if (warnings.some((warning) => warning.tone === "fail")) {
    return {
      tone: "fail" as const,
      label: "✗ Aşım / Tutarsızlık",
      message: "Yuvarlanmış kat senaryosunda emsal aşımı veya çelişen bir sonuç oluşuyor.",
    };
  }

  if (warnings.length > 0) {
    return {
      tone: "warn" as const,
      label: "⚠ Kontrol Gerekli",
      message: "Sonuç üretildi; plan notları ve yerel uygulama kararları ayrıca kontrol edilmeli.",
    };
  }

  return {
    tone: "ok" as const,
    label: "✓ Ön Uygun",
    message: "Girdi setiyle uyumlu bir ön fizibilite özeti üretildi.",
  };
}

export function calculateImarValues(input: ImarCalculatorInput): ImarCalculationResult | null {
  const {
    grossParcelAreaM2,
    taks,
    kaks,
    basementCount,
    frontSetbackM,
    rearSetbackM,
    sideSetbackM,
    parcelWidthM,
    parcelDepthM,
  } = input;

  if (
    [grossParcelAreaM2, taks, kaks, basementCount, frontSetbackM, rearSetbackM, sideSetbackM].some(
      (value) => !Number.isFinite(value) || value < 0,
    )
  ) {
    return null;
  }

  if (grossParcelAreaM2 <= 0 || taks <= 0 || taks > 1 || kaks <= 0) {
    return null;
  }

  const warnings: ImarWarning[] = [];
  const notes = ["Bodrum kat sayısı bu hesapta KAKS dışında varsayılmıştır."];

  let netParcelAreaM2 = grossParcelAreaM2;
  let netAreaMode: "gross" | "setbacks" = "gross";
  let buildableWidthM: number | null = null;
  let buildableDepthM: number | null = null;

  const hasAnySetback = frontSetbackM > 0 || rearSetbackM > 0 || sideSetbackM > 0;
  const hasParcelGeometry = parcelWidthM !== null && parcelDepthM !== null;

  if (hasAnySetback && hasParcelGeometry) {
    buildableWidthM = Math.max(parcelWidthM - sideSetbackM * 2, 0);
    buildableDepthM = Math.max(parcelDepthM - frontSetbackM - rearSetbackM, 0);

    if (buildableWidthM <= 0 || buildableDepthM <= 0) {
      return null;
    }

    netParcelAreaM2 = buildableWidthM * buildableDepthM;
    netAreaMode = "setbacks";

    const grossGeometryArea = parcelWidthM * parcelDepthM;
    if (Math.abs(grossGeometryArea - grossParcelAreaM2) > grossParcelAreaM2 * 0.1) {
      notes.push("Parsel eni ve derinliği, brüt arsa alanından farklı bir geometri veriyor; net alan geometri üzerinden üretildi.");
    }
  } else if (hasAnySetback) {
    notes.push("Çekme mesafeleri girildi; ancak parsel eni ve derinliği olmadığı için net alan brüt arsa alanı üzerinden bırakıldı.");
  }

  const maxGroundAreaM2 = netParcelAreaM2 * taks;
  const totalConstructionAreaM2 = netParcelAreaM2 * kaks;

  if (maxGroundAreaM2 <= 0 || totalConstructionAreaM2 <= 0) {
    return null;
  }

  const theoreticalFloorEquivalent = totalConstructionAreaM2 / maxGroundAreaM2;
  const safeNormalFloorCount = Math.max(1, Math.floor(theoreticalFloorEquivalent + 1e-9));
  const roundedNormalFloorCount = Math.max(1, Math.round(theoreticalFloorEquivalent));
  const totalFloorCount = safeNormalFloorCount + basementCount;
  const buildingHeightM =
    safeNormalFloorCount * IMAR_NORMAL_FLOOR_HEIGHT_M + basementCount * IMAR_BASEMENT_HEIGHT_M;
  const openAreaM2 = Math.max(netParcelAreaM2 - maxGroundAreaM2, 0);
  const coverageRatio = Math.min(Math.max(maxGroundAreaM2 / netParcelAreaM2, 0), 1);

  if (taks > IMAR_TAKS_WARNING_THRESHOLD) {
    warnings.push({
      tone: "warn",
      message: "Yüksek taban oranı. TAKS değeri için ilgili plan notlarını ayrıca kontrol edin.",
    });
  }

  if (safeNormalFloorCount > IMAR_HIGH_RISE_WARNING_FLOOR_COUNT) {
    warnings.push({
      tone: "warn",
      message: "Tahmini kat sayısı yüksek çıktı. Yükseklik kararı ve yapı nizamı ayrıca doğrulanmalı.",
    });
  }

  if (roundedNormalFloorCount * maxGroundAreaM2 > totalConstructionAreaM2 + IMAR_KAKS_ROUNDING_TOLERANCE) {
    warnings.push({
      tone: "fail",
      message: "Kat sayısı tam kata zorlandığında emsal aşımı oluşuyor. KAKS hesabını ve kat kabulünü gözden geçirin.",
    });
  }

  const status = getStatusMeta(warnings);

  return {
    netParcelAreaM2,
    maxGroundAreaM2,
    totalConstructionAreaM2,
    theoreticalFloorEquivalent,
    safeNormalFloorCount,
    roundedNormalFloorCount,
    totalFloorCount,
    buildingHeightM,
    openAreaM2,
    coverageRatio,
    netAreaMode,
    buildableWidthM,
    buildableDepthM,
    notes,
    warnings,
    statusTone: status.tone,
    statusLabel: status.label,
    statusMessage: status.message,
  };
}
