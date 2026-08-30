export interface SlopeStabilityInput {
  slopeHeightM: number;
  slopeAngleDeg: number;
  soilUnitWeightKnM3: number;
  cohesionKpa: number;
  internalFrictionAngleDeg: number;
  poreWaterRatioRu?: number; // 0 (kuru) - 0.5 (tam doymuş/sızma)
  seismicCoeffKh?: number; // Pseudostatik deprem katsayısı
}

export interface SlopeStabilityResult {
  factorOfSafetyFs: number;
  cohesionComponentFs: number;
  frictionComponentFs: number;
  status: "stable" | "marginal" | "unstable";
  statusDescription: string;
  criticalHeightM: number;
  notes: string[];
}

export function calculateSlopeStability(input: SlopeStabilityInput): SlopeStabilityResult | null {
  const {
    slopeHeightM: H,
    slopeAngleDeg: betaDeg,
    soilUnitWeightKnM3: gamma,
    cohesionKpa: c,
    internalFrictionAngleDeg: phiDeg,
    poreWaterRatioRu: ru = 0,
    seismicCoeffKh: kh = 0,
  } = input;

  if (
    [H, betaDeg, gamma].some((val) => !Number.isFinite(val) || val <= 0) ||
    betaDeg >= 90 ||
    c < 0 ||
    phiDeg < 0 ||
    phiDeg >= 90 ||
    ru < 0 ||
    ru > 0.5 ||
    kh < 0
  ) {
    return null;
  }

  const betaRad = (betaDeg * Math.PI) / 180;
  const phiRad = (phiDeg * Math.PI) / 180;

  const sinBeta = Math.sin(betaRad);
  const cosBeta = Math.cos(betaRad);
  const tanBeta = Math.tan(betaRad);
  const tanPhi = Math.tan(phiRad);

  // Basitleştirilmiş Dilim / Sonsuz Şev & Dairesel Kayma Yüzeyi Birleşik Analizi
  // FS = (c / (gamma * H * sin(beta) * cos(beta))) + (tan(phi) / tan(beta)) * (1 - ru / cos^2(beta) - kh * tan(beta))
  const drivingDenominator = gamma * H * sinBeta * cosBeta * (1 + kh * (1 / tanBeta));
  const cohesionComponentFs = drivingDenominator > 0 ? (c > 0 ? (c * 2.5) / drivingDenominator : 0) : 0;

  const poreWaterEffect = Math.max(0, 1 - ru / (cosBeta * cosBeta));
  const frictionComponentFs = tanBeta > 0 ? (tanPhi / tanBeta) * poreWaterEffect * (1 / (1 + kh * 0.5)) : 0;

  const factorOfSafetyFs = Math.max(0.1, cohesionComponentFs + frictionComponentFs);

  let status: "stable" | "marginal" | "unstable";
  let statusDescription: string;

  if (factorOfSafetyFs >= 1.5) {
    status = "stable";
    statusDescription = `Güvenli Şev (FS = ${factorOfSafetyFs.toFixed(2)} ≥ 1.50) — Uzun dönemli stabilite şartı sağlandı.`;
  } else if (factorOfSafetyFs >= 1.2) {
    status = "marginal";
    statusDescription = `Sınırda / Geçici Güvenli (FS = ${factorOfSafetyFs.toFixed(2)}) — Depremli veya kısa dönem kazı şartlarında kabul edilebilir.`;
  } else {
    status = "unstable";
    statusDescription = `KAYMA RİSKİ YÜKSEK (FS = ${factorOfSafetyFs.toFixed(2)} < 1.20) — Şev açısı yatırılmalı, palye açılmalı veya iksa uygulanmalıdır!`;
  }

  // Kritik Şev Yüksekliği (FS=1.0 olduğu yükseklik)
  const criticalHeightM =
    cohesionComponentFs > 0 ? H * ((1.0 - frictionComponentFs) / cohesionComponentFs) : H;

  const notes: string[] = [
    `Şev Güvenlik Sayısı: FS = ${factorOfSafetyFs.toFixed(2)} (Kohezyon katkısı: ${cohesionComponentFs.toFixed(2)}, Sürtünme katkısı: ${frictionComponentFs.toFixed(2)}).`,
    ru > 0
      ? `Boşluk suyu basıncı (ru = ${ru}) efektif gerilmeyi ve sürtünme direncini %${((1 - poreWaterEffect) * 100).toFixed(0)} düşürmüştür.`
      : "Kuru zemin koşulları geçerlidir.",
    kh > 0
      ? `Pseudostatik deprem katsayısı (kh = ${kh}) dinamik kayma kuvvetini artırmıştır.`
      : "Statik stabilite analizi yapılmıştır.",
  ];

  return {
    factorOfSafetyFs,
    cohesionComponentFs,
    frictionComponentFs,
    status,
    statusDescription,
    criticalHeightM: Math.max(0, criticalHeightM),
    notes,
  };
}
