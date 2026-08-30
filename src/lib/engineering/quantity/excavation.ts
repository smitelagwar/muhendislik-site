export interface ExcavationInput {
  baseWidthM: number; // Kazı taban genişliği (m)
  baseLengthM: number; // Kazı taban uzunluğu (m)
  depthM: number; // Kazı derinliği (m)
  slopeRatio?: number; // Şev eğimi yatay/düşey (0: düşey, 0.5: 1/2 şev)
  workingSpaceMarginM?: number; // Çalışma payı (m, varsayılan 0.5m)
  swellPercentage?: number; // Kabarma katsayısı (%20-%35)
  truckCapacityM3?: number; // Damperli kamyon hacmi (m3, varsayılan 15 m3)
}

export interface ExcavationResult {
  bottomAreaM2: number;
  topAreaM2: number;
  solidVolumeM3: number; // Sıkışık yerinde kazı hacmi
  looseVolumeM3: number; // Kabarmış nakliye hacmi
  truckTripsCount: number;
  notes: string[];
}

export function calculateExcavation(input: ExcavationInput): ExcavationResult | null {
  const {
    baseWidthM: w,
    baseLengthM: l,
    depthM: h,
    slopeRatio: m = 0.5,
    workingSpaceMarginM: margin = 0.5,
    swellPercentage = 25.0,
    truckCapacityM3 = 15.0,
  } = input;

  if (w <= 0 || l <= 0 || h <= 0) return null;

  const w1 = w + 2 * margin;
  const l1 = l + 2 * margin;
  const bottomAreaM2 = w1 * l1;

  const w2 = w1 + 2 * m * h;
  const l2 = l1 + 2 * m * h;
  const topAreaM2 = w2 * l2;

  const wm = (w1 + w2) / 2;
  const lm = (l1 + l2) / 2;
  const midAreaM2 = wm * lm;

  // Prizmoid Hacim Formülü (Simpson Kuralı)
  const solidVolumeM3 = (h / 6) * (bottomAreaM2 + 4 * midAreaM2 + topAreaM2);

  const swellFactor = 1 + Math.max(0, swellPercentage) / 100;
  const looseVolumeM3 = solidVolumeM3 * swellFactor;

  const truckCap = truckCapacityM3 > 0 ? truckCapacityM3 : 15.0;
  const truckTripsCount = Math.ceil(looseVolumeM3 / truckCap);

  const notes = [
    `Yerinde Sıkışık Kazı Hacmi: ${solidVolumeM3.toFixed(1)} m³ (Taban: ${w1.toFixed(1)}x${l1.toFixed(1)} m, Üst: ${w2.toFixed(1)}x${l2.toFixed(1)} m).`,
    `Zemin Kabarma Payı (%${swellPercentage}): Kabarmış taşınacak hacim ${looseVolumeM3.toFixed(1)} m³.`,
    `Gereken Kamyon Sefer Sayısı: ~${truckTripsCount} sefer (${truckCap} m³/kamyon kapasitesi ile).`,
  ];

  return {
    bottomAreaM2,
    topAreaM2,
    solidVolumeM3,
    looseVolumeM3,
    truckTripsCount,
    notes,
  };
}
