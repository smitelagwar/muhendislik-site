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
  minFlexuralRebarAreaCm2PerM: number;
  recommendedRebarTop: string;
  recommendedRebarBottom: string;
  minThicknessLimitCm: number;
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
    [fckMpa, Ntotal, matAreaM2, Ncol, columnBxCm, columnByCm, soilAllowableStressKpa, matThicknessCm].some(
      (val) => !Number.isFinite(val) || val <= 0
    )
  ) {
    return null;
  }

  const fctdMpa = (0.35 * Math.sqrt(fckMpa)) / 1.5;
  const effectiveDepthCm = Math.max(10, matThicknessCm - coverMm / 10 - 1.0);
  const dMm = effectiveDepthCm * 10;
  const bxMm = columnBxCm * 10;
  const byMm = columnByCm * 10;

  // 1. Zemin Gerilmesi Kontrolü
  // Radye kendi ağırlığı: A * h * 25 kN/m3
  const matSelfWeightKn = matAreaM2 * (matThicknessCm / 100) * 25.0;
  const totalLoadOnSoilKn = Ntotal + matSelfWeightKn;
  const actualSoilStressKpa = totalLoadOnSoilKn / matAreaM2;
  const soilStressUtilization = actualSoilStressKpa / soilAllowableStressKpa;
  const isSoilStressSafe = actualSoilStressKpa <= soilAllowableStressKpa;

  // 2. Kolon Zımbalama Tahkiki (Radye Temel)
  // u_p = 2 * (bx + by + 2d)
  const upMm = 2 * (bxMm + byMm + 2 * dMm);
  const punchingPerimeterCm = upMm / 10;

  // Zımbalama piramidinin altındaki net zemin tepkisi
  const pyramidAreaM2 = ((bxMm + 2 * dMm) / 1000) * ((byMm + 2 * dMm) / 1000);
  const netSoilReactionInPyramidKn = (Ntotal / matAreaM2) * pyramidAreaM2;
  const netPunchingLoadKn = Math.max(0, Ncol - netSoilReactionInPyramidKn);

  const shearAreaMm2 = upMm * dMm;
  const punchingStressMpa = (netPunchingLoadKn * 1000) / shearAreaMm2;
  const punchingUtilization = punchingStressMpa / fctdMpa;
  const isPunchingSafe = punchingStressMpa <= fctdMpa;

  // 3. Minimum Donatı Hesabı (TS 500 Madde 11.4: Radye temellerde her iki doğrultuda ve her iki yüzde min rho = 0.002)
  const minFlexuralRebarAreaCm2PerM = 0.002 * 100 * effectiveDepthCm; // cm2/m

  // Önerilen Donatı Çapı ve Aralığı
  let rebarText = "Ø16/15 cm (13.40 cm²/m)";
  if (minFlexuralRebarAreaCm2PerM > 15) {
    rebarText = "Ø20/15 cm (20.94 cm²/m)";
  } else if (minFlexuralRebarAreaCm2PerM > 11) {
    rebarText = "Ø16/15 cm (13.40 cm²/m)";
  } else if (minFlexuralRebarAreaCm2PerM > 8) {
    rebarText = "Ø14/15 cm (10.26 cm²/m)";
  } else {
    rebarText = "Ø12/15 cm (7.54 cm²/m)";
  }

  // 4. Minimum Kalınlık Tahkiki (TBDY 2018 & TS 500)
  // Radye temellerde pratik alt sınır: max(30 cm, Lmax / 12)
  const minThicknessLimitCm = Math.max(40, Math.ceil((spanLengthM * 100) / 12));
  const isThicknessAdequate = matThicknessCm >= minThicknessLimitCm;

  let status: "safe" | "warning" | "unsafe";
  if (!isSoilStressSafe || punchingStressMpa > 1.5 * fctdMpa) {
    status = "unsafe";
  } else if (!isPunchingSafe || !isThicknessAdequate || soilStressUtilization > 0.9) {
    status = "warning";
  } else {
    status = "safe";
  }

  const notes: string[] = [
    `Ortalama zemin gerilmesi: ${actualSoilStressKpa.toFixed(1)} kPa (Emniyet: ${soilAllowableStressKpa} kPa - %${(soilStressUtilization * 100).toFixed(0)}).`,
    isPunchingSafe
      ? `Zımbalama tahkiki güvenli: vpd (${punchingStressMpa.toFixed(2)} MPa) <= fctd (${fctdMpa.toFixed(2)} MPa).`
      : `UYARI: Zımbalama gerilmesi (${punchingStressMpa.toFixed(2)} MPa) > fctd (${fctdMpa.toFixed(2)} MPa). Zımbalama donatısı veya temel kalınlığı artırımı gerekir.`,
    `TBDY 2018 gereği radye temelde alt ve üst hasır için çift sıra donatı öngörülmelidir.`,
  ];

  return {
    fctdMpa,
    effectiveDepthCm,
    matSelfWeightKn,
    totalLoadOnSoilKn,
    actualSoilStressKpa,
    isSoilStressSafe,
    soilStressUtilization,
    punchingPerimeterCm,
    netPunchingLoadKn,
    punchingStressMpa,
    isPunchingSafe,
    punchingUtilization,
    minFlexuralRebarAreaCm2PerM,
    recommendedRebarTop: rebarText,
    recommendedRebarBottom: rebarText,
    minThicknessLimitCm,
    isThicknessAdequate,
    status,
    notes,
  };
}
