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
  eta1Factor: number;
  notes: string[];
}

export const BOND_FACTORS: Record<BondCondition, { label: string; eta1: number }> = {
  good: { label: "İyi Aderans (Yatay Donatı Alt Bölge)", eta1: 1.0 },
  poor: { label: "Kötü Aderans (Yatay Donatı Üst 30cm)", eta1: 0.7 },
};

export const SPLICE_ALPHA_FACTORS: Record<SpliceType, { label: string; alpha: number }> = {
  duz: { label: "Düz Uçlu Kenetlenme", alpha: 1.0 },
  kancali: { label: "90° veya 135° Kancalı", alpha: 0.7 },
  manson: { label: "Mekanik Manşonlu Birleşim", alpha: 0.5 },
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
  } = input;

  if (
    [fckMpa, fydMpa, phi].some((val) => !Number.isFinite(val) || val <= 0) ||
    !BOND_FACTORS[bondCondition] ||
    !SPLICE_ALPHA_FACTORS[spliceType]
  ) {
    return null;
  }

  const eta1 = BOND_FACTORS[bondCondition].eta1;
  const alpha = SPLICE_ALPHA_FACTORS[spliceType].alpha;

  // TS 500 Denklem 9.1: lb = (phi * fyd) / (16 * fctd * eta1)
  const basicAnchorageLengthLbMm = (phi * fydMpa) / (16 * fctdMpa * eta1);
  const basicAnchorageLengthLbCm = Math.ceil(basicAnchorageLengthLbMm / 10);

  // Tasarım kenetlenme boyu lbd = alpha * lb
  const designAnchorageLengthLbdMm = basicAnchorageLengthLbMm * alpha;
  const designAnchorageLengthLbdCm = Math.ceil(designAnchorageLengthLbdMm / 10);

  // Minimum sınırlamalar: max(15*phi, 200 mm)
  const minimumLengthLimitMm = Math.max(15 * phi, 200);

  // Bindirmeli ek boyu hesabı
  let recommendedLapSpliceLengthMm: number;
  if (isCompression) {
    // Basınç bindirme: max(0.3 * lb, 15*phi, 200mm)
    recommendedLapSpliceLengthMm = Math.max(0.3 * basicAnchorageLengthLbMm, minimumLengthLimitMm);
  } else {
    // Çekme bindirme: max(1.3 * lbd, 15*phi, 200mm)
    recommendedLapSpliceLengthMm = Math.max(1.3 * designAnchorageLengthLbdMm, minimumLengthLimitMm);
  }

  const recommendedLapSpliceLengthCm = Math.ceil(recommendedLapSpliceLengthMm / 10);

  const notes: string[] = [
    `Temel kenetlenme boyu lb = ${basicAnchorageLengthLbCm} cm.`,
    isCompression
      ? `Basınç donatısı bindirmeli ek boyu: ${recommendedLapSpliceLengthCm} cm (TS 500 Madde 9.2).`
      : `Çekme donatısı bindirmeli ek boyu: ${recommendedLapSpliceLengthCm} cm (%50 bindirme varsayımıyla, 1.3·lbd).`,
    bondCondition === "poor"
      ? "Üst donatılarda beton oturması ve su kusması nedeniyle kenetlenme boyu artırılmıştır (η1 = 0.7)."
      : "İyi aderans koşulu sağlanmıştır (η1 = 1.0).",
  ];

  return {
    fctdMpa,
    fydMpa,
    basicAnchorageLengthLbMm,
    basicAnchorageLengthLbCm,
    designAnchorageLengthLbdMm,
    designAnchorageLengthLbdCm,
    recommendedLapSpliceLengthMm,
    recommendedLapSpliceLengthCm,
    minimumLengthLimitMm,
    alphaFactor: alpha,
    eta1Factor: eta1,
    notes,
  };
}
