// Geoteknik Şev Stabilitesi — Fellenius (Ordinary Method of Slices) ve Dilim Yöntemi Hesap Motoru

export interface SliceDetail {
  sliceIndex: number;
  midX: number;
  sliceWidthM: number;
  sliceHeightM: number;
  weightKnM: number;
  baseAngleDeg: number;
  baseLengthM: number;
  drivingForceKnM: number;
  resistingForceKnM: number;
}

export interface SlopeStabilityInput {
  slopeHeightM: number; // H (m)
  slopeAngleDeg: number; // beta (derece)
  soilUnitWeightKnM3: number; // gamma (kN/m3)
  cohesionKpa: number; // c' (kPa)
  internalFrictionAngleDeg: number; // phi' (derece)
  poreWaterRatioRu?: number; // ru: 0 (kuru) - 0.5 (tam doymuş)
  seismicCoeffKh?: number; // kh: Pseudostatik deprem katsayısı
  sliceCount?: number; // Varsayılan 10 dilim
}

export interface SlopeStabilityResult {
  factorOfSafetyFs: number;
  cohesionComponentFs: number;
  frictionComponentFs: number;
  totalDrivingMomentKnM: number;
  totalResistingMomentKnM: number;
  status: "stable" | "marginal" | "unstable";
  statusDescription: string;
  criticalHeightM: number;
  slices: SliceDetail[];
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
    sliceCount = 10,
  } = input;

  if (
    [H, betaDeg, gamma].some((val) => !Number.isFinite(val) || val <= 0) ||
    betaDeg >= 90 ||
    c < 0 ||
    phiDeg < 0 ||
    phiDeg >= 90 ||
    ru < 0 ||
    ru > 0.5 ||
    kh < 0 ||
    sliceCount < 4
  ) {
    return null;
  }

  const degToRad = Math.PI / 180;
  const betaRad = betaDeg * degToRad;
  const phiRad = phiDeg * degToRad;
  const tanPhi = Math.tan(phiRad);

  // Şev Geometrisi: Topuk (0, 0), Tepe (x_crest, H)
  const xCrest = H / Math.tan(betaRad);

  // Kritik Kayma Dairesi Parametreleri (Fellenius geometrisi)
  // Daire merkezi (Xc, Yc) ve Yarıçap R: Topuktan (0,0) geçip tepe arkasına uzanan yay
  const radiusR = 1.5 * H;
  const xCenter = 0.2 * xCrest;
  const yCenter = Math.sqrt(Math.max(0.1, radiusR * radiusR - xCenter * xCenter));

  // Kayma yayının yüzeyi kestiği x sınırları: x_start = 0 (topuk), x_end = tepe arkası
  const xEnd = Math.min(xCenter + radiusR * 0.95, xCrest + 0.6 * H);
  const totalWidth = xEnd;
  const sliceWidth = totalWidth / sliceCount;

  let totalDriving = 0;
  let totalResisting = 0;
  let sumCohesionResist = 0;
  let sumFrictionResist = 0;

  const slices: SliceDetail[] = [];

  for (let i = 0; i < sliceCount; i++) {
    const xMid = (i + 0.5) * sliceWidth;

    // Yüzey kotu yTop
    let yTop: number;
    if (xMid <= xCrest) {
      yTop = xMid * Math.tan(betaRad);
    } else {
      yTop = H;
    }

    // Kayma dairesi alt kotu yBot: (x - Xc)^2 + (y - Yc)^2 = R^2 => y = Yc - sqrt(R^2 - (x - Xc)^2)
    const dx = xMid - xCenter;
    const dySqrt = radiusR * radiusR - dx * dx;
    if (dySqrt <= 0) continue;

    const yBot = yCenter - Math.sqrt(dySqrt);
    const sliceHeight = Math.max(0, yTop - yBot);

    if (sliceHeight <= 0.001) continue;

    // Dilim ağırlığı W = gamma * b * h
    const weightKnM = gamma * sliceWidth * sliceHeight;

    // Taban eğim açısı alpha: sin(alpha) = (x - Xc) / R
    const sinAlpha = dx / radiusR;
    const alphaRad = Math.asin(Math.max(-0.99, Math.min(0.99, sinAlpha)));
    const cosAlpha = Math.cos(alphaRad);
    const alphaDeg = alphaRad * (180 / Math.PI);

    // Taban yay uzunluğu deltaL = b / cos(alpha)
    const baseLengthM = sliceWidth / (cosAlpha || 1);

    // Boşluk suyu basıncı U = ru * gamma * h * deltaL
    const porePressureForceU = ru * gamma * sliceHeight * baseLengthM;

    // Fellenius Kayıcı Kuvvet: T_d = W * sin(alpha) + kh * W * cos(alpha)
    const drivingForceKnM = weightKnM * sinAlpha + kh * weightKnM * cosAlpha;

    // Fellenius Direnç Kuvveti: T_r = c' * deltaL + (W * cos(alpha) - U - kh * W * sin(alpha)) * tan(phi')
    const effectiveNormal = Math.max(0, weightKnM * cosAlpha - porePressureForceU - kh * weightKnM * sinAlpha);
    const cohesionResist = c * baseLengthM;
    const frictionResist = effectiveNormal * tanPhi;
    const resistingForceKnM = cohesionResist + frictionResist;

    totalDriving += drivingForceKnM;
    totalResisting += resistingForceKnM;
    sumCohesionResist += cohesionResist;
    sumFrictionResist += frictionResist;

    slices.push({
      sliceIndex: i + 1,
      midX: Number(xMid.toFixed(2)),
      sliceWidthM: Number(sliceWidth.toFixed(2)),
      sliceHeightM: Number(sliceHeight.toFixed(2)),
      weightKnM: Number(weightKnM.toFixed(2)),
      baseAngleDeg: Number(alphaDeg.toFixed(1)),
      baseLengthM: Number(baseLengthM.toFixed(2)),
      drivingForceKnM: Number(drivingForceKnM.toFixed(2)),
      resistingForceKnM: Number(resistingForceKnM.toFixed(2)),
    });
  }

  // Güvenlik Sayısı: FS = sum(Resisting) / sum(Driving)
  const factorOfSafetyFs = totalDriving > 0 ? totalResisting / totalDriving : 99.0;
  const cohesionComponentFs = totalDriving > 0 ? sumCohesionResist / totalDriving : 0;
  const frictionComponentFs = totalDriving > 0 ? sumFrictionResist / totalDriving : 0;

  let status: "stable" | "marginal" | "unstable";
  let statusDescription: string;

  if (factorOfSafetyFs >= 1.5) {
    status = "stable";
    statusDescription = `Güvenli Şev (FS = ${factorOfSafetyFs.toFixed(2)} ≥ 1.50) — Uzun dönemli şev stabilite şartı sağlandı.`;
  } else if (factorOfSafetyFs >= 1.2) {
    status = "marginal";
    statusDescription = `Sınırda / Geçici Güvenli (FS = ${factorOfSafetyFs.toFixed(2)}) — Kısa dönemli kazı veya depremli durum için sınırda güvenli.`;
  } else {
    status = "unstable";
    statusDescription = `KAYMA RİSKİ YÜKSEK (FS = ${factorOfSafetyFs.toFixed(2)} < 1.20) — Şev açısı yatırılmalı, palye açılmalı veya kazıklı/ankrajlı iksa uygulanmalıdır!`;
  }

  const criticalHeightM = factorOfSafetyFs > 0 ? H / factorOfSafetyFs : H;

  const notes: string[] = [
    `Fellenius (Dilim Yöntemi) Güvenlik Sayısı: FS = ${factorOfSafetyFs.toFixed(2)} (${sliceCount} dilim analizi).`,
    `Kohezyon katkısı: FS_c = ${cohesionComponentFs.toFixed(2)}, Sürtünme katkısı: FS_φ = ${frictionComponentFs.toFixed(2)}.`,
    `Toplam Kayma Momenti (Driving): ${totalDriving.toFixed(1)} kNm/m, Tutucu Direnç Momenti: ${totalResisting.toFixed(1)} kNm/m.`,
  ];

  if (ru > 0) {
    notes.push(`Boşluk suyu basıncı oranı (ru = ${ru}) efektif gerilmeyi ve tutucu sürtünme kuvvetini azaltmıştır.`);
  }
  if (kh > 0) {
    notes.push(`Pseudostatik deprem katsayısı (kh = ${kh}) kayıcı momenti artırmıştır.`);
  }

  return {
    factorOfSafetyFs: Number(factorOfSafetyFs.toFixed(2)),
    cohesionComponentFs: Number(cohesionComponentFs.toFixed(2)),
    frictionComponentFs: Number(frictionComponentFs.toFixed(2)),
    totalDrivingMomentKnM: Number(totalDriving.toFixed(1)),
    totalResistingMomentKnM: Number(totalResisting.toFixed(1)),
    status,
    statusDescription,
    criticalHeightM: Number(criticalHeightM.toFixed(2)),
    slices,
    notes,
  };
}
