import type {
  ConstructionAreaProfile,
  ConstructionAreaProfileDefinition,
  EstimatedConstructionAreaInput,
  EstimatedConstructionAreaResult,
  EstimatedConstructionAreaWarning,
} from "./types";

export const CONSTRUCTION_AREA_PROFILE_DEFINITIONS: readonly ConstructionAreaProfileDefinition[] = [
  {
    id: "konut",
    label: "Konut",
    description: "Apartman, site ve ağırlıklı konut projeleri için dengeli ön fizibilite.",
    baseNonEmsalRatio: 0.24,
    helper: "Merdiven, asansör çekirdeği, ortak hacim ve tipik emsal dışı konut alanları daha yüksektir.",
  },
  {
    id: "ticariOfis",
    label: "Ticari / Ofis",
    description: "Ofis, iş merkezi ve yoğun ortak çekirdekli ticari yapılar için daha kontrollü artış.",
    baseNonEmsalRatio: 0.18,
    helper: "Ofis çekirdeği güçlüdür ancak emsal dışı büyüme çoğu konut senaryosundan daha sınırlıdır.",
  },
  {
    id: "karma",
    label: "Karma Kullanım",
    description: "Konut ve ticari birimlerin birlikte kurgulandığı dengeli projeler.",
    baseNonEmsalRatio: 0.22,
    helper: "Konut ve ticari ortak alan karakteri arasında dengeli bir emsal dışı tahmin üretir.",
  },
] as const;

const PROFILE_MAP: Record<ConstructionAreaProfile, ConstructionAreaProfileDefinition> = {
  konut: CONSTRUCTION_AREA_PROFILE_DEFINITIONS[0],
  ticariOfis: CONSTRUCTION_AREA_PROFILE_DEFINITIONS[1],
  karma: CONSTRUCTION_AREA_PROFILE_DEFINITIONS[2],
};

function buildStatus(warnings: EstimatedConstructionAreaWarning[]) {
  if (warnings.length > 0) {
    return {
      status: "warn" as const,
      label: "Kontrol gerekli",
    };
  }

  return {
    status: "ok" as const,
    label: "Uyumlu",
  };
}

function isFiniteNumber(value: number) {
  return Number.isFinite(value);
}

function getFloorCountAdjustmentRatio(normalFloorCount: number) {
  if (normalFloorCount >= 8) {
    return 0.02;
  }

  if (normalFloorCount >= 5) {
    return 0.01;
  }

  return 0;
}

export function getConstructionAreaProfileDefinition(
  profile: ConstructionAreaProfile
): ConstructionAreaProfileDefinition {
  return PROFILE_MAP[profile];
}

export function calculateEstimatedConstructionArea(
  input: EstimatedConstructionAreaInput
): EstimatedConstructionAreaResult | null {
  const {
    parcelAreaM2,
    taks,
    kaks,
    normalFloorCount,
    profile,
    hasBasement,
    basementFloorCount,
    basementFloorAreaM2,
  } = input;

  if (
    !isFiniteNumber(parcelAreaM2) ||
    !isFiniteNumber(taks) ||
    !isFiniteNumber(kaks) ||
    !Number.isInteger(normalFloorCount) ||
    !Number.isInteger(basementFloorCount)
  ) {
    return null;
  }

  if (parcelAreaM2 <= 0 || taks <= 0 || taks > 1 || kaks <= 0 || normalFloorCount < 1) {
    return null;
  }

  if (!(profile in PROFILE_MAP)) {
    return null;
  }

  if (hasBasement && basementFloorCount < 1) {
    return null;
  }

  if (basementFloorAreaM2 !== null && (!isFiniteNumber(basementFloorAreaM2) || basementFloorAreaM2 <= 0)) {
    return null;
  }

  const profileDefinition = PROFILE_MAP[profile];
  const maxGroundAreaM2 = parcelAreaM2 * taks;
  const emsalAreaM2 = parcelAreaM2 * kaks;
  const katYerlesimKapasitesiM2 = maxGroundAreaM2 * normalFloorCount;
  const averageRequiredFloorAreaM2 = emsalAreaM2 / normalFloorCount;
  const theoreticalFloorEquivalent = emsalAreaM2 / maxGroundAreaM2;
  const katAdediDuzeltmesiOrani = getFloorCountAdjustmentRatio(normalFloorCount);
  const emsalHariciEkAlanOrani = Math.min(
    profileDefinition.baseNonEmsalRatio + katAdediDuzeltmesiOrani,
    0.3
  );
  const emsalHariciEkAlanM2 = emsalAreaM2 * emsalHariciEkAlanOrani;
  const bodrumVarsayimKullanildi = hasBasement && basementFloorAreaM2 === null;
  const resolvedBasementFloorAreaM2 = hasBasement ? basementFloorAreaM2 ?? maxGroundAreaM2 : 0;
  const toplamBodrumAlanM2 = hasBasement ? basementFloorCount * resolvedBasementFloorAreaM2 : 0;
  const yaklasikToplamInsaatAlaniM2 =
    emsalAreaM2 + emsalHariciEkAlanM2 + toplamBodrumAlanM2;

  const warnings: EstimatedConstructionAreaWarning[] = [];
  const notes = [
    "Emsal harici ek alan; merdiven, asansör çekirdeği, ortak hacimler, teknik alanlar ve proje tipine göre değişebilen tipik alanlar için ön fizibilite varsayımıdır.",
    "Planlı Alanlar İmar Yönetmeliği ve yerel plan notları emsal dışı alanları proje bazında farklı değerlendirebilir; bu araç ruhsat hesabı yerine geçmez.",
    profileDefinition.helper,
  ];

  if (katYerlesimKapasitesiM2 < emsalAreaM2) {
    warnings.push({
      tone: "warn",
      message:
        "Girilen normal kat sayısı, emsal alanını tam taşımıyor. Kat adedi, TAKS veya plan kabulü yeniden kontrol edilmelidir.",
    });
  }

  if (bodrumVarsayimKullanildi) {
    notes.push("Bodrum kat alanı girilmediği için her bodrum kat, maksimum taban alanı kadar varsayıldı.");
  }

  if (emsalHariciEkAlanOrani >= 0.3) {
    notes.push("Emsal harici artış oranı, ön fizibilite için %30 üst sınırında tutuldu.");
  }

  const status = buildStatus(warnings);
  const statusMessage =
    status.status === "ok"
      ? "Kat yerleşimi emsal alanını taşıyor. Profil bazlı emsal dışı alan ve bodrum katkısıyla yaklaşık toplam üretildi."
      : "Tahmini toplam üretildi; ancak kat yerleşimi emsal alanını taşımadığı için proje kabulü gözden geçirilmeli.";

  return {
    profile,
    profileLabel: profileDefinition.label,
    maxGroundAreaM2,
    emsalAreaM2,
    katYerlesimKapasitesiM2,
    averageRequiredFloorAreaM2,
    theoreticalFloorEquivalent,
    bazEmsalHariciOrani: profileDefinition.baseNonEmsalRatio,
    katAdediDuzeltmesiOrani,
    emsalHariciEkAlanOrani,
    emsalHariciEkAlanM2,
    resolvedBasementFloorAreaM2,
    toplamBodrumAlanM2,
    bodrumVarsayimKullanildi,
    yaklasikToplamInsaatAlaniM2,
    status: status.status,
    statusLabel: status.label,
    statusMessage,
    warnings,
    notes,
  };
}

export const calculateQuickEstimatedConstructionArea = calculateEstimatedConstructionArea;
