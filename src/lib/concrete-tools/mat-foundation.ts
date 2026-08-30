// TS 500 / TBDY 2018 Radye Temel Ön Boyutlandırma, Zemin Gerilmesi, Zımbalama ve Eğilme Donatısı Hesap Motoru

export interface MatFoundationInput {
  fckMpa: number;
  fydMpa?: number;
  buildingTotalWeightKn: number;
  matAreaM2: number;
  columnMaxAxialLoadKn: number;
  columnBxCm: number;
  columnByCm: number;
  soilAllowableStressKpa: number;
  coverMm?: number;
  matThicknessCm: number;
  spanLengthM?: number;
}

export interface MatFoundationResult {
  fctdMpa: number;
  effectiveDepthCm: number;
  matSelfWeightKn: number;
  totalLoadOnSoilKn: number;
  actualSoilStressKpa: number;
  isSoilStressSafe: boolean;
  soilStressUtilization: number;
  punchingPerimeterCm: number;
  netPunchingLoadKn: number;
  punchingStressMpa: number;
  isPunchingSafe: boolean;
  punchingUtilization: number;
  designBendingMomentKnmPerM: number;
  flexuralRebarDemandCm2PerM: number;
  minFlexuralRebarAreaCm2PerM: number;
  providedRebarAreaCm2PerM: number;
  recommendedRebarTop: string;
  recommendedRebarBottom: string;
  minThicknessRecommendationCm: number;
  isThicknessAdequate: boolean;
  status: "safe" | "warning" | "unsafe";
  notes: string[];
}

export function calculateMatFoundation(input: MatFoundationInput): MatFoundationResult | null {
  const {
    fckMpa,
    fydMpa = 365,
    buildingTotalWeightKn: Ntotal,
    matAreaM2,
    columnMaxAxialLoadKn: Ncol,
    columnBxCm,
    columnByCm,
    soilAllowableStressKpa,
    coverMm = 50,
    matThicknessCm,
    spanLengthM = 6.0,
  } = input;

  if (
    [fckMpa, fydMpa, Ntotal, matAreaM2, Ncol, columnBxCm, columnByCm, soilAllowableStressKpa, matThicknessCm, spanLengthM].some(
      (val) => !Number.isFinite(val) || val <= 0
    ) ||
    matThicknessCm * 10 <= coverMm + 50
  ) {
    return null;
  }

  const fctdMpa = (0.35 * Math.sqrt(fckMpa)) / 1.5;
  const effectiveDepthCm = matThicknessCm - coverMm / 10 - 1.0;
  if (effectiveDepthCm <= 0) return null;

  const dMm = effectiveDepthCm * 10;
  const bxMm = columnBxCm * 10;
  const byMm = columnByCm * 10;

  // 1. Zemin Emniyet Gerilmesi Kontrolü
  // Radye kendi ağırlığı: A * h * 25 kN/m3
  const matSelfWeightKn = matAreaM2 * (matThicknessCm / 100) * 25.0;
  const totalLoadOnSoilKn = Ntotal + matSelfWeightKn;
  const actualSoilStressKpa = totalLoadOnSoilKn / matAreaM2;
  const soilStressUtilization = actualSoilStressKpa / soilAllowableStressKpa;
  const isSoilStressSafe = actualSoilStressKpa <= soilAllowableStressKpa;

  // 2. Kolon Altı Zımbalama Tahkiki (TS 500 Madde 8.3)
  // u_p = 2 * (bx + by + 2d)
  const upMm = 2 * (bxMm + byMm + 2 * dMm);
  const punchingPerimeterCm = upMm / 10;

  // Zımbalama piramidinin altındaki net zemin tepkisi
  const pyramidAreaM2 = ((bxMm + 2 * dMm) / 1000) * ((byMm + 2 * dMm) / 1000);
  const netSoilReactionInPyramidKn = (actualSoilStressKpa) * pyramidAreaM2;
  const netPunchingLoadKn = Math.max(0, Ncol - netSoilReactionInPyramidKn);

  const shearAreaMm2 = upMm * dMm;
  const punchingStressMpa = (netPunchingLoadKn * 1000) / (shearAreaMm2 || 1);
  const punchingUtilization = punchingStressMpa / fctdMpa;
  const isPunchingSafe = punchingStressMpa <= fctdMpa;

  // 3. Eğilme Momenti ve Donatı Hesabı (Ters Döşeme Strip Modeli)
  // q_net ≈ Ntotal / matAreaM2
  // Md ≈ q_net * L^2 / 10 (kNm/m)
  const qNetKpa = Ntotal / matAreaM2;
  const designBendingMomentKnmPerM = (qNetKpa * spanLengthM * spanLengthM) / 10.0;

  // Gerekli As = Md / (0.9 * d * fyd)
  const dM = effectiveDepthCm / 100;
  const fydKpa = fydMpa * 1000;
  const asReqM2PerM = designBendingMomentKnmPerM / (0.9 * dM * fydKpa);
  const flexuralRebarDemandCm2PerM = asReqM2PerM * 10000; // cm2/m

  // TS 500 Madde 11.4: Radye temellerde min donatı oranı rho_min = 0.0020
  const minFlexuralRebarAreaCm2PerM = 0.002 * 100 * effectiveDepthCm; // cm2/m
  const governingAsCm2PerM = Math.max(flexuralRebarDemandCm2PerM, minFlexuralRebarAreaCm2PerM);

  // Önerilen Donatı Seçimi
  let rebarText = "Ø16/15 cm (13.40 cm²/m)";
  let providedAs = 13.40;

  if (governingAsCm2PerM > 25) {
    rebarText = "Ø22/15 cm (25.34 cm²/m)";
    providedAs = 25.34;
  } else if (governingAsCm2PerM > 18) {
    rebarText = "Ø20/15 cm (20.94 cm²/m)";
    providedAs = 20.94;
  } else if (governingAsCm2PerM > 12) {
    rebarText = "Ø16/15 cm (13.40 cm²/m)";
    providedAs = 13.40;
  } else if (governingAsCm2PerM > 9) {
    rebarText = "Ø14/15 cm (10.26 cm²/m)";
    providedAs = 10.26;
  } else {
    rebarText = "Ø12/15 cm (7.54 cm²/m)";
    providedAs = 7.54;
  }

  // 4. Pratik Kalınlık Önerisi (L / 10 - L / 12)
  const minThicknessRecommendationCm = Math.ceil((spanLengthM * 100) / 12);
  const isThicknessAdequate = matThicknessCm >= minThicknessRecommendationCm;

  let status: "safe" | "warning" | "unsafe";
  if (!isSoilStressSafe || !isPunchingSafe) {
    status = "unsafe";
  } else if (!isThicknessAdequate || soilStressUtilization > 0.9 || punchingUtilization > 0.9) {
    status = "warning";
  } else {
    status = "safe";
  }

  const notes: string[] = [
    `Zemin gerilmesi: q = ${actualSoilStressKpa.toFixed(1)} kPa (Emniyetli gerilme: ${soilAllowableStressKpa} kPa, Kapasite kullanımı: %${(soilStressUtilization * 100).toFixed(0)}).`,
    `Kolon altı zımbalama: v_pd = ${punchingStressMpa.toFixed(2)} MPa (Kapasite f_ctd: ${fctdMpa.toFixed(2)} MPa, Zımbalama kullanımı: %${(punchingUtilization * 100).toFixed(0)}).`,
    `Eğilme donatısı talebi: ${flexuralRebarDemandCm2PerM.toFixed(2)} cm²/m, TS 500 minimum donatı: ${minFlexuralRebarAreaCm2PerM.toFixed(2)} cm²/m.`,
  ];

  if (!isSoilStressSafe) {
    notes.push("UYARI: Zemin emniyet gerilmesi aşıldı! Radye temel alanı (ampatman) büyütülmelidir.");
  }
  if (!isPunchingSafe) {
    notes.push("UYARI: Kolon altında zımbalama kapasitesi yetersiz! Radye kalınlığı veya kolon enkesiti artırılmalı ya da zımbalama donatısı kullanılmalıdır.");
  }
  if (!isThicknessAdequate) {
    notes.push(`Öneri: ${spanLengthM} m açıklık için pratik radye kalınlığı en az ${minThicknessRecommendationCm} cm tavsiye edilir.`);
  }

  return {
    fctdMpa: Number(fctdMpa.toFixed(2)),
    effectiveDepthCm: Number(effectiveDepthCm.toFixed(1)),
    matSelfWeightKn: Number(matSelfWeightKn.toFixed(0)),
    totalLoadOnSoilKn: Number(totalLoadOnSoilKn.toFixed(0)),
    actualSoilStressKpa: Number(actualSoilStressKpa.toFixed(1)),
    isSoilStressSafe,
    soilStressUtilization: Number(soilStressUtilization.toFixed(3)),
    punchingPerimeterCm: Number(punchingPerimeterCm.toFixed(1)),
    netPunchingLoadKn: Number(netPunchingLoadKn.toFixed(1)),
    punchingStressMpa: Number(punchingStressMpa.toFixed(3)),
    isPunchingSafe,
    punchingUtilization: Number(punchingUtilization.toFixed(3)),
    designBendingMomentKnmPerM: Number(designBendingMomentKnmPerM.toFixed(1)),
    flexuralRebarDemandCm2PerM: Number(flexuralRebarDemandCm2PerM.toFixed(2)),
    minFlexuralRebarAreaCm2PerM: Number(minFlexuralRebarAreaCm2PerM.toFixed(2)),
    providedRebarAreaCm2PerM: providedAs,
    recommendedRebarTop: `${rebarText} (Her iki yönde üst donatı)`,
    recommendedRebarBottom: `${rebarText} (Her iki yönde alt donatı)`,
    minThicknessRecommendationCm,
    isThicknessAdequate,
    status,
    notes,
  };
}
