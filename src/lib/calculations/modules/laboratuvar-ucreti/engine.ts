import {
  DEFAULT_CONCRETE_M3_PER_M2,
  DEFAULT_EBIS_CHIP_UNIT_PRICE_NET,
  DEFAULT_KAROT_UNIT_PRICE_NET,
  DEFAULT_REBAR_TON_PER_M2,
  EK9_CONCRETE_UNIT_PRICES,
  LABORATUVAR_EFFECTIVE_YEAR,
  LABORATUVAR_VAT_RATE,
  MAX_SAFE_LAB_AREA_M2,
  MAX_SAFE_LAB_FLOORS,
  MAX_SAFE_LAB_KAROT,
  MAX_SAFE_LAB_POURS,
  STEEL_TEAM_UNIT_PRICE_NET,
  TS13515_DAILY_TIERS,
} from "./constants";
import type {
  LaboratuvarBreakdownItem,
  LaboratuvarConcreteGrade,
  LaboratuvarSampleType,
  LaboratuvarUcretiInput,
  LaboratuvarUcretiResult,
} from "./types";

function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export interface LaboratuvarValidationResult {
  readonly isValid: boolean;
  readonly errors: readonly string[];
  readonly data?: LaboratuvarUcretiInput;
}

const VALID_GRADES: readonly LaboratuvarConcreteGrade[] = ["standard", "high"];
const VALID_SAMPLES: readonly LaboratuvarSampleType[] = ["cube", "cylinder"];

export function validateLaboratuvarInput(input: unknown): LaboratuvarValidationResult {
  if (typeof input !== "object" || input === null) {
    return { isValid: false, errors: ["Geçerli bir hesaplama girdisi sağlanmalıdır."] };
  }

  const raw = input as Partial<LaboratuvarUcretiInput>;
  const errors: string[] = [];

  if (typeof raw.area !== "number" || !Number.isFinite(raw.area) || raw.area <= 0) {
    errors.push("İnşaat alanı sıfırdan büyük olmalıdır.");
  } else if (raw.area > MAX_SAFE_LAB_AREA_M2) {
    errors.push("İnşaat alanı teknik sınırı aşıyor.");
  }

  if (
    typeof raw.floors !== "number" ||
    !Number.isInteger(raw.floors) ||
    raw.floors < 1 ||
    raw.floors > MAX_SAFE_LAB_FLOORS
  ) {
    errors.push(`Kat sayısı 1 ile ${MAX_SAFE_LAB_FLOORS} arasında tam sayı olmalıdır.`);
  }

  if (!raw.concreteGrade || !VALID_GRADES.includes(raw.concreteGrade)) {
    errors.push("Geçerli bir beton sınıfı seçilmelidir.");
  }

  if (!raw.sampleType || !VALID_SAMPLES.includes(raw.sampleType)) {
    errors.push("Geçerli bir numune tipi seçilmelidir.");
  }

  if (raw.concreteM3 !== undefined && (!Number.isFinite(raw.concreteM3) || raw.concreteM3 <= 0)) {
    errors.push("Beton miktarı sıfırdan büyük olmalıdır.");
  }
  if (raw.rebarTons !== undefined && (!Number.isFinite(raw.rebarTons) || raw.rebarTons < 0)) {
    errors.push("Demir miktarı negatif olamaz.");
  }
  if (
    raw.pourCount !== undefined &&
    (!Number.isInteger(raw.pourCount) || raw.pourCount < 1 || raw.pourCount > MAX_SAFE_LAB_POURS)
  ) {
    errors.push(`Döküm sayısı 1 ile ${MAX_SAFE_LAB_POURS} arasında tam sayı olmalıdır.`);
  }
  if (
    raw.karotCount !== undefined &&
    (!Number.isInteger(raw.karotCount) || raw.karotCount < 0 || raw.karotCount > MAX_SAFE_LAB_KAROT)
  ) {
    errors.push(`Karot adedi 0 ile ${MAX_SAFE_LAB_KAROT} arasında tam sayı olmalıdır.`);
  }
  if (
    raw.chipUnitPrice !== undefined &&
    (!Number.isFinite(raw.chipUnitPrice) || raw.chipUnitPrice < 0)
  ) {
    errors.push("Çip birim fiyatı negatif olamaz.");
  }

  if (errors.length > 0) {
    return { isValid: false, errors };
  }

  return {
    isValid: true,
    errors: [],
    data: {
      area: raw.area as number,
      floors: raw.floors as number,
      concreteGrade: raw.concreteGrade as LaboratuvarConcreteGrade,
      sampleType: raw.sampleType as LaboratuvarSampleType,
      concreteM3: raw.concreteM3,
      rebarTons: raw.rebarTons,
      pourCount: raw.pourCount,
      karotCount: raw.karotCount,
      chipUnitPrice: raw.chipUnitPrice,
    },
  };
}

/**
 * TS 13515 Çizelge B1.1 + 2022/7 Genelgesi:
 * Günlük döküm hacmi (m³) ve alan (m²) kriterlerinden yüksek olanını uygular.
 */
export function resolveDailyConcreteSamples(
  pourVolumeM3: number,
  pourAreaM2: number,
  concreteGrade: LaboratuvarConcreteGrade
): number {
  const byVolume = resolveTierSamplesByVolume(pourVolumeM3);
  const byArea = resolveTierSamplesByArea(pourAreaM2);
  const baseSamples = Math.max(byVolume, byArea);
  return concreteGrade === "high" ? baseSamples * 2 : baseSamples;
}

function resolveTierSamplesByVolume(volumeM3: number): number {
  for (const tier of TS13515_DAILY_TIERS) {
    if (volumeM3 <= tier.maxVolumeM3) {
      return tier.totalSamples;
    }
  }
  const extraSteps = Math.ceil((volumeM3 - 600) / 200);
  return 40 + extraSteps * 4;
}

function resolveTierSamplesByArea(areaM2: number): number {
  if (areaM2 <= 150) return 8;
  for (const tier of TS13515_DAILY_TIERS) {
    if (tier.maxAreaM2 > 0 && areaM2 <= tier.maxAreaM2) {
      return tier.totalSamples;
    }
  }
  const extraSteps = Math.ceil((areaM2 - 1850) / 200);
  return 40 + extraSteps * 4;
}

/**
 * TS 708 donatı çeliği numune takım sayısı tahmini:
 * İlk 90 tona kadar tipik çap çeşitliliğine göre 4–6 takım; 90 ton üstü her 30 tona +1 takım.
 */
export function estimateSteelTeamCount(rebarTons: number): number {
  if (rebarTons <= 0) return 0;
  if (rebarTons <= 15) return 4;
  if (rebarTons <= 40) return 5;
  if (rebarTons <= 90) return 6;
  return 6 + Math.ceil((rebarTons - 90) / 30);
}

export function calculateLaboratuvarFee(input: LaboratuvarUcretiInput): LaboratuvarUcretiResult {
  const validation = validateLaboratuvarInput(input);
  if (!validation.isValid || !validation.data) {
    throw new Error(validation.errors.join(" "));
  }

  const clean = validation.data;
  const estimatedConcreteM3 = round2(clean.concreteM3 ?? clean.area * DEFAULT_CONCRETE_M3_PER_M2);
  const estimatedRebarTons = round2(clean.rebarTons ?? clean.area * DEFAULT_REBAR_TON_PER_M2);
  const pourCount = clean.pourCount ?? 1 + clean.floors * 2;
  const karotCount = clean.karotCount ?? 0;
  const chipUnitPriceNet = round2(clean.chipUnitPrice ?? DEFAULT_EBIS_CHIP_UNIT_PRICE_NET);

  // Temel dökümü toplam hacmin ~%28'i, kalan kat dökümleri eşit dağıtılır
  const typicalFloorAreaM2 = clean.area / clean.floors;
  const foundationVolumeM3 = pourCount === 1 ? estimatedConcreteM3 : estimatedConcreteM3 * 0.28;
  const foundationSamples = resolveDailyConcreteSamples(
    foundationVolumeM3,
    typicalFloorAreaM2,
    clean.concreteGrade
  );

  let upperSamples = 0;
  if (pourCount > 1) {
    const upperPours = pourCount - 1;
    const avgUpperVolumeM3 = (estimatedConcreteM3 - foundationVolumeM3) / upperPours;
    const perUpperPourSamples = resolveDailyConcreteSamples(
      avgUpperVolumeM3,
      typicalFloorAreaM2 * 0.5,
      clean.concreteGrade
    );
    upperSamples = upperPours * perUpperPourSamples;
  }

  const sampleCount = foundationSamples + upperSamples;
  const chipCount = sampleCount;
  const steelTeamCount = estimateSteelTeamCount(estimatedRebarTons);

  const concreteTariff = EK9_CONCRETE_UNIT_PRICES[clean.sampleType];
  const concreteTestCostNet = round2(sampleCount * concreteTariff.midNet);
  const concreteTestMinNet = round2(sampleCount * concreteTariff.minNet);
  const concreteTestMaxNet = round2(sampleCount * concreteTariff.maxNet);

  const chipCostNet = round2(chipCount * chipUnitPriceNet);
  const steelTestCostNet = round2(steelTeamCount * STEEL_TEAM_UNIT_PRICE_NET);
  const karotCostNet = round2(karotCount * DEFAULT_KAROT_UNIT_PRICE_NET);

  const subtotalNet = round2(concreteTestCostNet + chipCostNet + steelTestCostNet + karotCostNet);
  const minSubtotalNet = round2(concreteTestMinNet + chipCostNet + steelTestCostNet + karotCostNet);
  const maxSubtotalNet = round2(concreteTestMaxNet + chipCostNet + steelTestCostNet + karotCostNet);

  const vatRate = LABORATUVAR_VAT_RATE;
  const vatAmount = round2(subtotalNet * vatRate);
  const totalGross = round2(subtotalNet + vatAmount);
  const minGross = round2(minSubtotalNet * (1 + vatRate));
  const maxGross = round2(maxSubtotalNet * (1 + vatRate));
  const perSquareMeterGross = round2(totalGross / clean.area);

  const breakdown: LaboratuvarBreakdownItem[] = [
    {
      id: "concrete",
      label: `Taze Beton Deneyi (${clean.sampleType === "cube" ? "Küp" : "Silindir"})`,
      quantityText: `${sampleCount} adet`,
      unitPriceNet: concreteTariff.midNet,
      amountNet: concreteTestCostNet,
    },
    {
      id: "chip",
      label: "EBİS Beton Çipi (Etiket)",
      quantityText: `${chipCount} adet`,
      unitPriceNet: chipUnitPriceNet,
      amountNet: chipCostNet,
    },
    {
      id: "steel",
      label: "Demir Çekme Deneyi",
      quantityText: `${steelTeamCount} takım`,
      unitPriceNet: STEEL_TEAM_UNIT_PRICE_NET,
      amountNet: steelTestCostNet,
    },
  ];

  if (karotCount > 0) {
    breakdown.push({
      id: "karot",
      label: "Karot Basınç Deneyi",
      quantityText: `${karotCount} adet`,
      unitPriceNet: DEFAULT_KAROT_UNIT_PRICE_NET,
      amountNet: karotCostNet,
    });
  }

  return {
    input: clean,
    effectiveYear: LABORATUVAR_EFFECTIVE_YEAR,
    estimatedConcreteM3,
    estimatedRebarTons,
    pourCount,
    sampleCount,
    chipCount,
    steelTeamCount,
    karotCount,
    concreteUnitMinNet: concreteTariff.minNet,
    concreteUnitMidNet: concreteTariff.midNet,
    concreteUnitMaxNet: concreteTariff.maxNet,
    concreteTestCostNet,
    chipUnitPriceNet,
    chipCostNet,
    steelUnitPriceNet: STEEL_TEAM_UNIT_PRICE_NET,
    steelTestCostNet,
    karotUnitPriceNet: DEFAULT_KAROT_UNIT_PRICE_NET,
    karotCostNet,
    subtotalNet,
    vatRate,
    vatAmount,
    totalGross,
    minGross,
    maxGross,
    perSquareMeterGross,
    breakdown,
  };
}

export function tryCalculateLaboratuvarFee(
  input: LaboratuvarUcretiInput
): LaboratuvarUcretiResult | null {
  try {
    return calculateLaboratuvarFee(input);
  } catch {
    return null;
  }
}
