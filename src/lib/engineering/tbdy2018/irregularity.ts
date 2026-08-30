export interface TorsionalIrregularityInput {
  maxInterstoryDriftMm: number; // (Delta_i)_max
  minInterstoryDriftMm: number; // (Delta_i)_min
}

export interface TorsionalIrregularityResult {
  avgInterstoryDriftMm: number; // (Delta_i)_ort
  torsionalRatioEtaBi: number; // eta_bi = Delta_max / Delta_ort
  hasA1Irregularity: boolean;
  statusText: string;
  notes: string[];
}

export function checkTorsionalIrregularity(input: TorsionalIrregularityInput): TorsionalIrregularityResult | null {
  const { maxInterstoryDriftMm: dMax, minInterstoryDriftMm: dMin } = input;

  if (dMax < 0 || dMin < 0 || (dMax === 0 && dMin === 0)) {
    return null;
  }

  const avgInterstoryDriftMm = (dMax + dMin) / 2;
  const torsionalRatioEtaBi = avgInterstoryDriftMm > 0 ? dMax / avgInterstoryDriftMm : 1.0;
  const hasA1Irregularity = torsionalRatioEtaBi > 1.2;

  let statusText: string;
  if (torsionalRatioEtaBi <= 1.2) {
    statusText = "A1 Burulma Düzensizliği YOK (ηbi ≤ 1.20)";
  } else if (torsionalRatioEtaBi <= 2.0) {
    statusText = "A1 Burulma Düzensizliği VAR (1.20 < ηbi ≤ 2.00) — Eşdeğer deprem yükü ek dışmerkezlik katsayısı (D_bi) ile artırılmalıdır.";
  } else {
    statusText = "AŞIRI BURULMA DÜZENSİZLİĞİ (ηbi > 2.00) — TBDY 2018 gereği taşıyıcı sistem plan geometrisi veya rijitlik dağılımı revize edilmelidir.";
  }

  const notes: string[] = [
    `Burulma Düzensizliği Katsayısı: ηbi = ${torsionalRatioEtaBi.toFixed(3)}.`,
    hasA1Irregularity
      ? `TBDY 2018 Madde 3.6.2.1: ηbi > 1.20 olduğundan dinamik analiz (Mod Birleştirme Yöntemi) veya Dbi büyütmesi uygulanmalıdır.`
      : `Döşeme her iki yönde rijit diyafram kabulüyle dengeli ötelenmektedir.`,
  ];

  return {
    avgInterstoryDriftMm,
    torsionalRatioEtaBi,
    hasA1Irregularity,
    statusText,
    notes,
  };
}

export interface SoftStoryIrregularityInput {
  currentStoryDriftRatio: number; // (Delta_i / h_i)
  upperStoryDriftRatio: number; // (Delta_{i+1} / h_{i+1})
}

export interface SoftStoryIrregularityResult {
  stiffnessRatioEtaKi: number;
  hasB2Irregularity: boolean;
  statusText: string;
  notes: string[];
}

export function checkSoftStoryIrregularity(input: SoftStoryIrregularityInput): SoftStoryIrregularityResult | null {
  const { currentStoryDriftRatio: driftCur, upperStoryDriftRatio: driftUp } = input;

  if (driftCur <= 0 || driftUp <= 0) {
    return null;
  }

  const stiffnessRatioEtaKi = driftCur / driftUp;
  const hasB2Irregularity = stiffnessRatioEtaKi > 2.0;

  const statusText = hasB2Irregularity
    ? "B2 Yumuşak Kat Düzensizliği VAR (ηki > 2.00) — Katlar arası rijitlik farkı kritik seviyede!"
    : "B2 Yumuşak Kat Düzensizliği YOK (ηki ≤ 2.00)";

  const notes: string[] = [
    `Rijitlik Düzensizliği Katsayısı: ηki = ${stiffnessRatioEtaKi.toFixed(3)}.`,
    hasB2Irregularity
      ? `TBDY 2018 Madde 3.6.2.2: ηki > 2.00 durumunda yumuşak kat davranışı mevcuttur; zemin kat yüksekliği veya eleman rijitlikleri dengelenmelidir.`
      : `Katlar arası rijitlik değişimi yönetmelik sınırları içerisindedir.`,
  ];

  return {
    stiffnessRatioEtaKi,
    hasB2Irregularity,
    statusText,
    notes,
  };
}

export interface FloorDiscontinuityInput {
  totalFloorAreaM2: number;
  totalOpeningAreaM2: number;
}

export interface FloorDiscontinuityResult {
  openingRatio: number;
  hasA2Irregularity: boolean;
  statusText: string;
  notes: string[];
}

export function checkFloorDiscontinuity(input: FloorDiscontinuityInput): FloorDiscontinuityResult | null {
  const { totalFloorAreaM2: Atotal, totalOpeningAreaM2: Aopen } = input;

  if (Atotal <= 0 || Aopen < 0) return null;

  const openingRatio = Aopen / Atotal;
  const hasA2Irregularity = openingRatio > 0.33;

  const statusText = hasA2Irregularity
    ? `A2 Döşeme Süreksizliği VAR (Boşluk Oranı %${(openingRatio * 100).toFixed(1)} > %33)`
    : `A2 Döşeme Süreksizliği YOK (Boşluk Oranı %${(openingRatio * 100).toFixed(1)} ≤ %33)`;

  const notes = [
    `Toplam Kat Alanı: ${Atotal} m², Toplam Boşluk: ${Aopen} m² (%${(openingRatio * 100).toFixed(1)}).`,
    hasA2Irregularity
      ? "TBDY 2018 Tablo 3.6: Döşeme boşluklarının toplam kat alanının 1/3'ünü aşması durumunda 3 boyutlu yarı rijit diyafram analizi zorunludur."
      : "Rijit diyafram kabulü geçerlidir.",
  ];

  return {
    openingRatio,
    hasA2Irregularity,
    statusText,
    notes,
  };
}
