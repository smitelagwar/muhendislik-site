export type BoltGrade = "8.8" | "10.9";
export type BoltDiameter = 16 | 20 | 24 | 27 | 30;

export interface BoltProperties {
  diameterMm: number;
  stressAreaAsMm2: number;
  holeDiameterD0Mm: number;
}

export const BOLT_DATA: Record<BoltDiameter, BoltProperties> = {
  16: { diameterMm: 16, stressAreaAsMm2: 157, holeDiameterD0Mm: 18 },
  20: { diameterMm: 20, stressAreaAsMm2: 245, holeDiameterD0Mm: 22 },
  24: { diameterMm: 24, stressAreaAsMm2: 353, holeDiameterD0Mm: 26 },
  27: { diameterMm: 27, stressAreaAsMm2: 459, holeDiameterD0Mm: 30 },
  30: { diameterMm: 30, stressAreaAsMm2: 561, holeDiameterD0Mm: 33 },
};

export interface BoltedConnectionInput {
  boltGrade: BoltGrade;
  boltDiameterMm: BoltDiameter;
  boltCount: number;
  shearPlanesCount: number; // 1: tek tesirli, 2: çift tesirli
  plateThicknessMm: number;
  steelUltimateStrengthFuMpa?: number; // Levha çeliği fu (S275=430, S355=510)
  designShearForceVdKn: number;
  designTensionForceNdKn?: number;
}

export interface BoltedConnectionResult {
  singleBoltShearCapacityFvRdKn: number;
  singleBoltBearingCapacityFbRdKn: number;
  singleBoltTensionCapacityFtRdKn: number;
  totalConnectionShearCapacityKn: number;
  totalConnectionBearingCapacityKn: number;
  totalConnectionTensionCapacityKn: number;
  shearUtilization: number;
  tensionUtilization: number;
  combinedUtilization: number;
  isSafe: boolean;
  notes: string[];
}

export function calculateBoltedConnection(input: BoltedConnectionInput): BoltedConnectionResult | null {
  const {
    boltGrade,
    boltDiameterMm,
    boltCount,
    shearPlanesCount,
    plateThicknessMm,
    steelUltimateStrengthFuMpa: fuPlate = 510, // S355 varsayılan
    designShearForceVdKn,
    designTensionForceNdKn = 0,
  } = input;

  if (
    [boltCount, shearPlanesCount, plateThicknessMm, designShearForceVdKn].some(
      (val) => !Number.isFinite(val) || val <= 0
    ) ||
    !BOLT_DATA[boltDiameterMm]
  ) {
    return null;
  }

  const bolt = BOLT_DATA[boltDiameterMm];
  const fub = boltGrade === "8.8" ? 800 : 1000;
  const gammaM2 = 1.25;

  // 1. Cıvata Makaslama Dayanımı (ÇYTHYE 2018 Denklem 13.1): Fv,Rd = (alpha_v * fub * As) / gammaM2
  const alphaV = 0.6;
  const singleBoltShearCapacityFvRdKn =
    (alphaV * fub * bolt.stressAreaAsMm2 * shearPlanesCount) / (gammaM2 * 1000);

  // 2. Levha Ezilme Dayanımı (ÇYTHYE 2018 Denklem 13.2): Fb,Rd = (k1 * alpha_b * fu * d * t) / gammaM2
  // Standart kenar mesafeleri için k1=2.5, alpha_b=1.0 kabulü
  const singleBoltBearingCapacityFbRdKn =
    (2.5 * 1.0 * fuPlate * bolt.diameterMm * plateThicknessMm) / (gammaM2 * 1000);

  // 3. Cıvata Çekme Dayanımı: Ft,Rd = (0.9 * fub * As) / gammaM2
  const singleBoltTensionCapacityFtRdKn =
    (0.9 * fub * bolt.stressAreaAsMm2) / (gammaM2 * 1000);

  const totalConnectionShearCapacityKn = singleBoltShearCapacityFvRdKn * boltCount;
  const totalConnectionBearingCapacityKn = singleBoltBearingCapacityFbRdKn * boltCount;
  const totalConnectionTensionCapacityKn = singleBoltTensionCapacityFtRdKn * boltCount;

  const effectiveShearCapacityKn = Math.min(
    totalConnectionShearCapacityKn,
    totalConnectionBearingCapacityKn
  );

  const shearUtilization = designShearForceVdKn / effectiveShearCapacityKn;
  const tensionUtilization =
    designTensionForceNdKn > 0 ? designTensionForceNdKn / totalConnectionTensionCapacityKn : 0;

  // ÇYTHYE 2018 Madde 13.3.4 Bileşik Makaslama ve Çekme: (Vd / Fv,Rd) + (Nd / (1.4 * Ft,Rd)) <= 1.0
  const combinedUtilization = shearUtilization + tensionUtilization / 1.4;
  const isSafe = combinedUtilization <= 1.0 && shearUtilization <= 1.0;

  const notes: string[] = [
    `Cıvata: ${boltCount} adet M${bolt.diameterMm} (${boltGrade} kalite, As = ${bolt.stressAreaAsMm2} mm²).`,
    `Tek cıvata makaslama kapasitesi: Fv,Rd = ${singleBoltShearCapacityFvRdKn.toFixed(1)} kN (${shearPlanesCount === 2 ? "Çift" : "Tek"} tesirli).`,
    `Levha ezilme kapasitesi (t = ${plateThicknessMm} mm): Fb,Rd = ${singleBoltBearingCapacityFbRdKn.toFixed(1)} kN/cıvata.`,
    isSafe
      ? `Birleşim güvenli (Kapasite kullanım oranı: %${(combinedUtilization * 100).toFixed(1)}).`
      : `UYARI: Birleşim kapasitesi aşıldı (%${(combinedUtilization * 100).toFixed(1)})! Cıvata adedi veya çapı artırılmalıdır.`,
  ];

  return {
    singleBoltShearCapacityFvRdKn,
    singleBoltBearingCapacityFbRdKn,
    singleBoltTensionCapacityFtRdKn,
    totalConnectionShearCapacityKn,
    totalConnectionBearingCapacityKn,
    totalConnectionTensionCapacityKn,
    shearUtilization,
    tensionUtilization,
    combinedUtilization,
    isSafe,
    notes,
  };
}

export interface WeldedConnectionInput {
  throatThicknessAMm: number; // Kaynak boğaz kalınlığı a (mm)
  weldLengthMm: number; // Etkili kaynak boyu Lw (mm)
  steelUltimateStrengthFuMpa: number; // S235=360, S355=510
  designShearForceVdKn: number;
}

export interface WeldedConnectionResult {
  designWeldStrengthFvwDMpa: number;
  totalWeldCapacityFwRdKn: number;
  utilization: number;
  isSafe: boolean;
  notes: string[];
}

export function calculateWeldedConnection(input: WeldedConnectionInput): WeldedConnectionResult | null {
  const {
    throatThicknessAMm: a,
    weldLengthMm: Lw,
    steelUltimateStrengthFuMpa: fu,
    designShearForceVdKn: VdKn,
  } = input;

  if (a <= 0 || Lw <= 0 || fu <= 0 || VdKn <= 0) return null;

  const betaW = fu >= 510 ? 0.9 : 0.8; // S355 için 0.9, S235 için 0.8
  const gammaM2 = 1.25;

  // ÇYTHYE 2018 Denklem 13.17: fvw,d = fu / (sqrt(3) * beta_w * gamma_M2)
  const designWeldStrengthFvwDMpa = fu / (Math.sqrt(3) * betaW * gammaM2);

  // Fw,Rd = a * Lw * fvw,d
  const totalWeldCapacityFwRdKn = (a * Lw * designWeldStrengthFvwDMpa) / 1000;
  const utilization = VdKn / totalWeldCapacityFwRdKn;
  const isSafe = utilization <= 1.0;

  const notes = [
    `Köşe kaynak boğaz kalınlığı: a = ${a} mm, etkili boy: Lw = ${Lw} mm.`,
    `Tasarım kaynak kayma dayanımı: fvw,d = ${designWeldStrengthFvwDMpa.toFixed(1)} MPa.`,
    `Toplam kaynak kapasitesi: Fw,Rd = ${totalWeldCapacityFwRdKn.toFixed(1)} kN (Talep: ${VdKn} kN - %${(utilization * 100).toFixed(1)}).`,
  ];

  return {
    designWeldStrengthFvwDMpa,
    totalWeldCapacityFwRdKn,
    utilization,
    isSafe,
    notes,
  };
}
