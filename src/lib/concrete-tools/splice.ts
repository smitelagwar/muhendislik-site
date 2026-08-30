// TS 500 / TBDY 2018 Donatı Kenetlenme ve Bindirmeli Ek Boyu Hesap Motoru

export type BondCondition = "good" | "poor";
export type SpliceType = "duz" | "kancali" | "manson";

export interface SpliceInput {
  fckMpa: number;
  fctdMpa?: number;
  fydMpa?: number;
  barDiameterMm: number;
  bondCondition: BondCondition;
  spliceType: SpliceType;
  isCompression: boolean;
  splicedRatioPercent?: number; // Aynı kesitte eklenen donatı oranı (%25, %50, %100)
}

export interface SpliceResult {
  fctdMpa: number;
  fydMpa: number;
  basicAnchorageLengthLbMm: number;
  basicAnchorageLengthLbCm: number;
  designAnchorageLengthLbdMm: number;
  designAnchorageLengthLbdCm: number;
  recommendedLapSpliceLengthMm: number;
  recommendedLapSpliceLengthCm: number;
  minimumLengthLimitMm: number;
  alphaFactor: number;
  alpha0LapFactor: number;
  isMechanicalCoupler: boolean;
  couplerLengthMm?: number;
  notes: string[];
}

export const BOND_FACTORS: Record<BondCondition, { label: string; fbdMultiplier: number }> = {
  good: { label: "İyi Aderans (Konum I - Yatay donatı alt bölge, düşey çubuklar)", fbdMultiplier: 2.0 },
  poor: { label: "Kötü Aderans (Konum II - Döküm sırasında üst 30 cm yatay donatı)", fbdMultiplier: 1.4 },
};

export const SPLICE_ALPHA_FACTORS: Record<SpliceType, { label: string; alpha: number }> = {
  duz: { label: "Düz Uçlu Çubuk", alpha: 1.0 },
  kancali: { label: "90° veya 135° Standart Kancalı", alpha: 0.7 },
  manson: { label: "Mekanik Manşonlu Birleşim (TS EN ISO 15835)", alpha: 0.0 },
};

export function calculateSpliceLength(input: SpliceInput): SpliceResult | null {
  const {
    fckMpa,
    fctdMpa = (0.35 * Math.sqrt(fckMpa)) / 1.5,
    fydMpa = 365,
    barDiameterMm: phi,
    bondCondition,
    spliceType,
    isCompression,
    splicedRatioPercent = 50,
  } = input;

  if (
    [fckMpa, fydMpa, phi].some((val) => !Number.isFinite(val) || val <= 0) ||
    !BOND_FACTORS[bondCondition] ||
    !SPLICE_ALPHA_FACTORS[spliceType]
  ) {
    return null;
  }

  const fbdMultiplier = BOND_FACTORS[bondCondition].fbdMultiplier;
  const fbd = fbdMultiplier * fctdMpa;
  const alpha = SPLICE_ALPHA_FACTORS[spliceType].alpha;
  const isMechanicalCoupler = spliceType === "manson";

  // 1. TS 500 Denklem 9.1: Temel Kenetlenme Boyu lb = (phi * fyd) / (4 * fbd)
  const basicAnchorageLengthLbMm = (phi * fydMpa) / (4 * fbd);
  const basicAnchorageLengthLbCm = Math.ceil(basicAnchorageLengthLbMm / 10);

  // 2. Tasarım Kenetlenme Boyu lbd = alpha * lb
  const designAnchorageLengthLbdMm = alpha * basicAnchorageLengthLbMm;
  const designAnchorageLengthLbdCm = Math.ceil(designAnchorageLengthLbdMm / 10);

  // 3. Minimum Boy Sınırı (TS 500: max(15*phi, 200 mm))
  const minimumLengthLimitMm = Math.max(15 * phi, 200);

  // 4. Bindirme Katsayısı alpha0 (TS 500 Madde 9.2)
  let alpha0LapFactor = 1.0;
  if (!isCompression) {
    if (splicedRatioPercent <= 25) alpha0LapFactor = 1.0;
    else if (splicedRatioPercent <= 50) alpha0LapFactor = 1.3;
    else alpha0LapFactor = 1.6;
  } else {
    alpha0LapFactor = 1.0;
  }

  // 5. Bindirmeli Ek Boyu (l_0)
  let recommendedLapSpliceLengthMm: number;
  let recommendedLapSpliceLengthCm: number;
  let couplerLengthMm: number | undefined;

  if (isMechanicalCoupler) {
    couplerLengthMm = Math.round(7.5 * phi);
    recommendedLapSpliceLengthMm = couplerLengthMm;
    recommendedLapSpliceLengthCm = Math.ceil(couplerLengthMm / 10);
  } else {
    if (isCompression) {
      recommendedLapSpliceLengthMm = Math.max(basicAnchorageLengthLbMm, minimumLengthLimitMm);
    } else {
      recommendedLapSpliceLengthMm = Math.max(alpha0LapFactor * designAnchorageLengthLbdMm, minimumLengthLimitMm);
    }
    recommendedLapSpliceLengthCm = Math.ceil(recommendedLapSpliceLengthMm / 10);
  }

  const notes: string[] = [];
  if (isMechanicalCoupler) {
    notes.push(`Mekanik Manşon: Bindirme boyuna gerek yoktur. TS EN ISO 15835 Tip II manşon uzunluğu yaklaşık ${couplerLengthMm} mm (${recommendedLapSpliceLengthCm} cm)'dir.`);
    notes.push("Manşonlu birleşimlerde çubuk uçları tork anahtarı ile üretici şartnamesine uygun sıkılmalıdır.");
  } else {
    notes.push(`Temel kenetlenme boyu: lb = ${basicAnchorageLengthLbCm} cm (${basicAnchorageLengthLbMm.toFixed(0)} mm).`);
    notes.push(
      isCompression
        ? `Basınç bindirmeli ek boyu: l0 = ${recommendedLapSpliceLengthCm} cm (TS 500 Madde 9.2).`
        : `Çekme bindirmeli ek boyu: l0 = ${recommendedLapSpliceLengthCm} cm (%${splicedRatioPercent} bindirme oranı, alpha0 = ${alpha0LapFactor}).`
    );
    if (bondCondition === "poor") {
      notes.push("Konum II (kötü aderans - üst donatı): Beton oturması nedeniyle kenetlenme boyu artırılmıştır.");
    }
  }

  return {
    fctdMpa: Number(fctdMpa.toFixed(2)),
    fydMpa,
    basicAnchorageLengthLbMm: Number(basicAnchorageLengthLbMm.toFixed(1)),
    basicAnchorageLengthLbCm,
    designAnchorageLengthLbdMm: Number(designAnchorageLengthLbdMm.toFixed(1)),
    designAnchorageLengthLbdCm,
    recommendedLapSpliceLengthMm: Number(recommendedLapSpliceLengthMm.toFixed(1)),
    recommendedLapSpliceLengthCm,
    minimumLengthLimitMm,
    alphaFactor: alpha,
    alpha0LapFactor,
    isMechanicalCoupler,
    couplerLengthMm,
    notes,
  };
}
