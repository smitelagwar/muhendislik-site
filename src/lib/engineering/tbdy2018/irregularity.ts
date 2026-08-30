// TBDY 2018 Tablo 3.6 - Bina Düzensizlikleri Hesap Modülü

// --- A1: Burulma Düzensizliği ---
export interface TorsionalIrregularityInput {
  maxInterstoryDriftMm: number; // (Delta_i)_max
  minInterstoryDriftMm: number; // (Delta_i)_min
}

export interface TorsionalIrregularityResult {
  avgInterstoryDriftMm: number; // (Delta_i)_ort
  torsionalRatioEtaBi: number; // eta_bi = Delta_max / Delta_ort
  hasA1Irregularity: boolean;
  isExcessiveTorsion: boolean; // eta_bi > 2.0
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
  const isExcessiveTorsion = torsionalRatioEtaBi > 2.0;

  let statusText: string;
  if (!hasA1Irregularity) {
    statusText = "A1 Burulma Düzensizliği YOK (ηbi ≤ 1.20)";
  } else if (!isExcessiveTorsion) {
    statusText = "A1 Burulma Düzensizliği VAR (1.20 < ηbi ≤ 2.00) — Eşdeğer deprem yükünde Dbi ek dışmerkezlik büyütmesi uygulanmalıdır.";
  } else {
    statusText = "AŞIRI BURULMA DÜZENSİZLİĞİ (ηbi > 2.00) — Taşıyıcı sistem rijitliği ve plan yerleşimi revize edilmelidir.";
  }

  const notes: string[] = [
    `Burulma Düzensizliği Katsayısı: ηbi = ${torsionalRatioEtaBi.toFixed(3)}.`,
    hasA1Irregularity
      ? `TBDY 2018 Tablo 3.6 uyarınca ηbi > 1.20 durumunda dinamik analiz (Mod Birleştirme) veya Dbi katsayısı zorunludur.`
      : `Kat seviyesinde burulma etkisi dengeli ve sınırlar içindedir.`,
  ];

  return {
    avgInterstoryDriftMm: Number(avgInterstoryDriftMm.toFixed(2)),
    torsionalRatioEtaBi: Number(torsionalRatioEtaBi.toFixed(3)),
    hasA1Irregularity,
    isExcessiveTorsion,
    statusText,
    notes,
  };
}

// --- A2: Döşeme Süreksizlikleri ---
export interface FloorDiscontinuityInput {
  totalFloorAreaM2: number;
  totalOpeningAreaM2: number;
  hasLocalStiffnessDrop50Pct?: boolean;
}

export interface FloorDiscontinuityResult {
  openingRatio: number;
  hasA2Irregularity: boolean;
  statusText: string;
  notes: string[];
}

export function checkFloorDiscontinuity(input: FloorDiscontinuityInput): FloorDiscontinuityResult | null {
  const { totalFloorAreaM2: totalArea, totalOpeningAreaM2: openArea, hasLocalStiffnessDrop50Pct } = input;

  if (totalArea <= 0 || openArea < 0 || openArea >= totalArea) {
    return null;
  }

  const openingRatio = openArea / totalArea;
  const hasAreaDiscontinuity = openingRatio > 0.33;
  const hasA2Irregularity = hasAreaDiscontinuity || !!hasLocalStiffnessDrop50Pct;

  const statusText = hasA2Irregularity
    ? `A2 Döşeme Süreksizliği VAR (${(openingRatio * 100).toFixed(1)}% boşluk ${hasAreaDiscontinuity ? "> %33" : ""})`
    : `A2 Döşeme Süreksizliği YOK (${(openingRatio * 100).toFixed(1)}% boşluk ≤ %33)`;

  const notes: string[] = [
    `Boşluk Oranı: ${(openingRatio * 100).toFixed(2)}% (Sınır: %33.00).`,
    hasA2Irregularity
      ? "TBDY 2018 Madde 3.6.1.2: Döşemenin düzlem içi rijit diyafram kabulü geçersiz olabilir; sonlu elemanlar kabuk modeliyle modellenmelidir."
      : "Döşeme rijit diyafram kabulü geçerlidir.",
  ];

  return {
    openingRatio: Number(openingRatio.toFixed(3)),
    hasA2Irregularity,
    statusText,
    notes,
  };
}

// --- A3: Planda Çıkıntılar Bulunması ---
export interface PlanProjectionInput {
  totalBuildingLengthXM: number; // Lx
  totalBuildingLengthYM: number; // Ly
  projectionLengthXM: number; // ax
  projectionLengthYM: number; // ay
}

export interface PlanProjectionResult {
  ratioX: number;
  ratioY: number;
  hasA3Irregularity: boolean;
  statusText: string;
  notes: string[];
}

export function checkPlanProjection(input: PlanProjectionInput): PlanProjectionResult | null {
  const { totalBuildingLengthXM: lx, totalBuildingLengthYM: ly, projectionLengthXM: ax, projectionLengthYM: ay } = input;

  if (lx <= 0 || ly <= 0 || ax < 0 || ay < 0) {
    return null;
  }

  const ratioX = ax / lx;
  const ratioY = ay / ly;
  const hasA3Irregularity = ratioX > 0.20 && ratioY > 0.20;

  const statusText = hasA3Irregularity
    ? `A3 Planda Çıkıntı Düzensizliği VAR (ax/Lx = %${(ratioX * 100).toFixed(1)} > %20 ve ay/Ly = %${(ratioY * 100).toFixed(1)} > %20)`
    : "A3 Planda Çıkıntı Düzensizliği YOK";

  const notes: string[] = [
    `X Yönü Çıkıntı Oranı: %${(ratioX * 100).toFixed(1)} (Sınır: %20), Y Yönü Çıkıntı Oranı: %${(ratioY * 100).toFixed(1)} (Sınır: %20).`,
    hasA3Irregularity
      ? "TBDY 2018 Tablo 3.6 A3: Girintili-çıkıntılı planda (L, H, U tipleri) döşeme düzlemi iç gerilmeleri kontrol edilmelidir."
      : "Plan geometrisi çıkıntı sınırları içindedir.",
  ];

  return {
    ratioX: Number(ratioX.toFixed(3)),
    ratioY: Number(ratioY.toFixed(3)),
    hasA3Irregularity,
    statusText,
    notes,
  };
}

// --- B1: Komşu Katlar Arası Dayanım Düzensizliği (Zayıf Kat) ---
export interface WeakStoryInput {
  currentStoryEffectiveShearAreaM2: number; // sum(Ae)_i
  upperStoryEffectiveShearAreaM2: number; // sum(Ae)_{i+1}
}

export interface WeakStoryResult {
  strengthRatioEtaCi: number;
  hasB1Irregularity: boolean;
  isExcessiveWeakStory: boolean; // eta_ci < 0.65 (TBDY izin vermez)
  statusText: string;
  notes: string[];
}

export function checkWeakStory(input: WeakStoryInput): WeakStoryResult | null {
  const { currentStoryEffectiveShearAreaM2: aeCur, upperStoryEffectiveShearAreaM2: aeUp } = input;

  if (aeCur <= 0 || aeUp <= 0) {
    return null;
  }

  const strengthRatioEtaCi = aeCur / aeUp;
  const hasB1Irregularity = strengthRatioEtaCi < 0.80;
  const isExcessiveWeakStory = strengthRatioEtaCi < 0.65;

  let statusText: string;
  if (!hasB1Irregularity) {
    statusText = "B1 Zayıf Kat Düzensizliği YOK (ηci ≥ 0.80)";
  } else if (!isExcessiveWeakStory) {
    statusText = "B1 Zayıf Kat Düzensizliği VAR (0.65 ≤ ηci < 0.80) — İlgili kata düşey taşıyıcı ilavesi önerilir.";
  } else {
    statusText = "AŞIRI ZAYIF KAT DÜZENSİZLİĞİ (ηci < 0.65) — TBDY 2018 Madde 3.6.2.3 uyarınca bu duruma izin verilmez!";
  }

  const notes: string[] = [
    `Dayanım Oranı: ηci = ${strengthRatioEtaCi.toFixed(3)} (Sınır: 0.80).`,
    hasB1Irregularity
      ? `TBDY 2018 Tablo 3.6 B1: Alt kattaki etkili kesme alanı üst katın %80'inden azdır.`
      : `Katlar arası taşıyıcı alan değişimi düzenlidir.`,
  ];

  return {
    strengthRatioEtaCi: Number(strengthRatioEtaCi.toFixed(3)),
    hasB1Irregularity,
    isExcessiveWeakStory,
    statusText,
    notes,
  };
}

// --- B2: Komşu Katlar Arası Rijitlik Düzensizliği (Yumuşak Kat) ---
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
    `Rijitlik Düzensizliği Katsayısı: ηki = ${stiffnessRatioEtaKi.toFixed(3)} (Sınır: 2.00).`,
    hasB2Irregularity
      ? `TBDY 2018 Madde 3.6.2.2: ηki > 2.00 durumunda yumuşak kat davranışı mevcuttur; kat yüksekliği veya perde rijitlikleri dengelenmelidir.`
      : `Katlar arası rijitlik değişimi yönetmelik sınırları içerisindedir.`,
  ];

  return {
    stiffnessRatioEtaKi: Number(stiffnessRatioEtaKi.toFixed(3)),
    hasB2Irregularity,
    statusText,
    notes,
  };
}

// --- B3: Düşey Elemanların Süreksizliği ---
export interface VerticalDiscontinuityInput {
  hasColumnPlantedOnBeam: boolean; // Kirişe oturan kolon var mı?
  hasShearWallDiscontinuity: boolean; // Altta devam etmeyen perde var mı?
}

export interface VerticalDiscontinuityResult {
  hasB3Irregularity: boolean;
  statusText: string;
  notes: string[];
}

export function checkVerticalDiscontinuity(input: VerticalDiscontinuityInput): VerticalDiscontinuityResult {
  const { hasColumnPlantedOnBeam, hasShearWallDiscontinuity } = input;
  const hasB3Irregularity = hasColumnPlantedOnBeam || hasShearWallDiscontinuity;

  const statusText = hasB3Irregularity
    ? "B3 Düşey Eleman Süreksizliği VAR — Taşıyıcı kolon veya perdelerde süreksizlik mevcut!"
    : "B3 Düşey Eleman Süreksizliği YOK — Tüm düşey taşıyıcılar temele kadar kesintisiz devam ediyor.";

  const notes: string[] = [
    hasColumnPlantedOnBeam
      ? "UYARI: Kiriş üzerine oturan kolon (saplama kolon) TBDY 2018 Madde 3.6.2.4 uyarınca özel düşey deprem yükü kombinasyonları ve aktarma kirişi tahkiki gerektirir."
      : "Kirişe oturan kolon bulunmamaktadır.",
    hasShearWallDiscontinuity
      ? "UYARI: Perdenin alt katta devam etmemesi veya kolonlar üzerine oturtulması durumuna TBDY 2018'de kesin kısıtlamalar getirilmiştir."
      : "Perde süreksizliği bulunmamaktadır.",
  ];

  return {
    hasB3Irregularity,
    statusText,
    notes,
  };
}

// --- Genel Bütünleşik Düzensizlik Kontrolü ---
export interface CombinedIrregularityInput {
  torsional?: TorsionalIrregularityInput;
  floorDiscontinuity?: FloorDiscontinuityInput;
  planProjection?: PlanProjectionInput;
  weakStory?: WeakStoryInput;
  softStory?: SoftStoryIrregularityInput;
  verticalDiscontinuity?: VerticalDiscontinuityInput;
}

export interface CombinedIrregularityResult {
  hasAnyIrregularity: boolean;
  irregularitiesFound: string[];
  torsional?: TorsionalIrregularityResult;
  floorDiscontinuity?: FloorDiscontinuityResult;
  planProjection?: PlanProjectionResult;
  weakStory?: WeakStoryResult;
  softStory?: SoftStoryIrregularityResult;
  verticalDiscontinuity?: VerticalDiscontinuityResult;
}

export function calculateIrregularities(input: CombinedIrregularityInput): CombinedIrregularityResult {
  const found: string[] = [];

  let torsional: TorsionalIrregularityResult | undefined;
  if (input.torsional) {
    const res = checkTorsionalIrregularity(input.torsional);
    if (res) {
      torsional = res;
      if (res.hasA1Irregularity) found.push("A1 - Burulma Düzensizliği");
    }
  }

  let floorDiscontinuity: FloorDiscontinuityResult | undefined;
  if (input.floorDiscontinuity) {
    const res = checkFloorDiscontinuity(input.floorDiscontinuity);
    if (res) {
      floorDiscontinuity = res;
      if (res.hasA2Irregularity) found.push("A2 - Döşeme Süreksizliği");
    }
  }

  let planProjection: PlanProjectionResult | undefined;
  if (input.planProjection) {
    const res = checkPlanProjection(input.planProjection);
    if (res) {
      planProjection = res;
      if (res.hasA3Irregularity) found.push("A3 - Planda Çıkıntılar");
    }
  }

  let weakStory: WeakStoryResult | undefined;
  if (input.weakStory) {
    const res = checkWeakStory(input.weakStory);
    if (res) {
      weakStory = res;
      if (res.hasB1Irregularity) found.push("B1 - Zayıf Kat Düzensizliği");
    }
  }

  let softStory: SoftStoryIrregularityResult | undefined;
  if (input.softStory) {
    const res = checkSoftStoryIrregularity(input.softStory);
    if (res) {
      softStory = res;
      if (res.hasB2Irregularity) found.push("B2 - Yumuşak Kat Düzensizliği");
    }
  }

  let verticalDiscontinuity: VerticalDiscontinuityResult | undefined;
  if (input.verticalDiscontinuity) {
    const res = checkVerticalDiscontinuity(input.verticalDiscontinuity);
    verticalDiscontinuity = res;
    if (res.hasB3Irregularity) found.push("B3 - Düşey Eleman Süreksizliği");
  }

  return {
    hasAnyIrregularity: found.length > 0,
    irregularitiesFound: found,
    torsional,
    floorDiscontinuity,
    planProjection,
    weakStory,
    softStory,
    verticalDiscontinuity,
  };
}
