// ÇYTHYE 2018 / TS EN 1993-1-8 Çelik Cıvatalı ve Kaynaklı Birleşim Hesap Motoru

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
  edgeDistanceE1Mm?: number; // Yük yönündeki kenar mesafesi e1
  edgeDistanceE2Mm?: number; // Yüke dik kenar mesafesi e2
  spacingP1Mm?: number; // Yük yönündeki delik aralığı p1
  spacingP2Mm?: number; // Yüke dik delik aralığı p2
  designShearForceVdKn: number;
  designTensionForceNdKn?: number;
}

export interface BoltedConnectionResult {
  singleBoltShearCapacityFvRdKn: number;
  singleBoltBearingCapacityFbRdKn: number;
  singleBoltTensionCapacityFtRdKn: number;
  alphaBFactor: number;
  k1Factor: number;
  governingBoltShearBearingCapacityKn: number;
  totalConnectionShearCapacityKn: number;
  totalConnectionBearingCapacityKn: number;
  totalConnectionTensionCapacityKn: number;
  shearUtilization: number;
  tensionUtilization: number;
  combinedUtilization: number;
  isSafe: boolean;
  status: "safe" | "exceeded";
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
    edgeDistanceE1Mm,
    edgeDistanceE2Mm,
    spacingP1Mm,
    spacingP2Mm,
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
  const d0 = bolt.holeDiameterD0Mm;

  // 1. Cıvata Makaslama Dayanımı (ÇYTHYE 2018 Denklem 13.1): Fv,Rd = (alpha_v * fub * As) / gammaM2
  const alphaV = boltGrade === "8.8" ? 0.6 : 0.5;
  const singleBoltShearCapacityFvRdKn =
    (alphaV * fub * bolt.stressAreaAsMm2 * shearPlanesCount) / (gammaM2 * 1000);

  // 2. Levha Ezilme Dayanımı (ÇYTHYE 2018 Denklem 13.2): Fb,Rd = (k1 * alpha_b * fu * d * t) / gammaM2
  const e1 = edgeDistanceE1Mm ?? 1.5 * d0;
  const e2 = edgeDistanceE2Mm ?? 1.5 * d0;
  const p1 = spacingP1Mm ?? 3.0 * d0;

  // alpha_b = min(e1 / (3*d0), p1 / (3*d0) - 1/4, fub / fu, 1.0)
  const alphaB1 = e1 / (3 * d0);
  const alphaB2 = p1 / (3 * d0) - 0.25;
  const alphaB3 = fub / fuPlate;
  const alphaB = Math.max(0.1, Math.min(alphaB1, alphaB2, alphaB3, 1.0));

  // k1 = min(2.8 * (e2 / d0) - 1.7, 2.5)
  const k1 = Math.max(0.5, Math.min(2.8 * (e2 / d0) - 1.7, 2.5));

  const singleBoltBearingCapacityFbRdKn =
    (k1 * alphaB * fuPlate * bolt.diameterMm * plateThicknessMm) / (gammaM2 * 1000);

  // 3. Cıvata Çekme Dayanımı: Ft,Rd = (0.9 * fub * As) / gammaM2
  const singleBoltTensionCapacityFtRdKn =
    (0.9 * fub * bolt.stressAreaAsMm2) / (gammaM2 * 1000);

  const totalConnectionShearCapacityKn = singleBoltShearCapacityFvRdKn * boltCount;
  const totalConnectionBearingCapacityKn = singleBoltBearingCapacityFbRdKn * boltCount;
  const totalConnectionTensionCapacityKn = singleBoltTensionCapacityFtRdKn * boltCount;

  const governingSingleShearBearingKn = Math.min(
    singleBoltShearCapacityFvRdKn,
    singleBoltBearingCapacityFbRdKn
  );
  const totalEffectiveShearKn = governingSingleShearBearingKn * boltCount;

  const shearUtilization = designShearForceVdKn / totalEffectiveShearKn;
  const tensionUtilization =
    designTensionForceNdKn > 0 ? designTensionForceNdKn / totalConnectionTensionCapacityKn : 0;

  // ÇYTHYE 2018 Madde 13.3.4 Bileşik Makaslama ve Çekme: (Vd / Fv,Rd) + (Nd / (1.4 * Ft,Rd)) <= 1.0
  const combinedUtilization = shearUtilization + tensionUtilization / 1.4;
  const isSafe = combinedUtilization <= 1.0 && shearUtilization <= 1.0 && tensionUtilization <= 1.0;
  const status: "safe" | "exceeded" = isSafe ? "safe" : "exceeded";

  const notes: string[] = [
    `Cıvata Grubu: ${boltCount} adet M${bolt.diameterMm} (Kalite: ${boltGrade}, As = ${bolt.stressAreaAsMm2} mm², Delik d0 = ${d0} mm).`,
    `Tek Cıvata Kapasiteleri: Makaslama Fv,Rd = ${singleBoltShearCapacityFvRdKn.toFixed(1)} kN, Levha Ezilme Fb,Rd = ${singleBoltBearingCapacityFbRdKn.toFixed(1)} kN (αb = ${alphaB.toFixed(2)}, k1 = ${k1.toFixed(2)}), Çekme Ft,Rd = ${singleBoltTensionCapacityFtRdKn.toFixed(1)} kN.`,
    `Toplam Birleşim Kesme Kapasitesi: ${totalEffectiveShearKn.toFixed(1)} kN (Kullanım: %${(shearUtilization * 100).toFixed(1)}).`,
  ];

  if (designTensionForceNdKn > 0) {
    notes.push(`Eksenel Çekme Kullanımı: %${(tensionUtilization * 100).toFixed(1)}, Bileşik Etkileşim: %${(combinedUtilization * 100).toFixed(1)}.`);
  }

  return {
    singleBoltShearCapacityFvRdKn: Number(singleBoltShearCapacityFvRdKn.toFixed(1)),
    singleBoltBearingCapacityFbRdKn: Number(singleBoltBearingCapacityFbRdKn.toFixed(1)),
    singleBoltTensionCapacityFtRdKn: Number(singleBoltTensionCapacityFtRdKn.toFixed(1)),
    alphaBFactor: Number(alphaB.toFixed(3)),
    k1Factor: Number(k1.toFixed(3)),
    governingBoltShearBearingCapacityKn: Number(governingSingleShearBearingKn.toFixed(1)),
    totalConnectionShearCapacityKn: Number(totalConnectionShearCapacityKn.toFixed(1)),
    totalConnectionBearingCapacityKn: Number(totalConnectionBearingCapacityKn.toFixed(1)),
    totalConnectionTensionCapacityKn: Number(totalConnectionTensionCapacityKn.toFixed(1)),
    shearUtilization: Number(shearUtilization.toFixed(3)),
    tensionUtilization: Number(tensionUtilization.toFixed(3)),
    combinedUtilization: Number(combinedUtilization.toFixed(3)),
    isSafe,
    status,
    notes,
  };
}

export interface WeldedConnectionInput {
  weldThicknessMm: number; // a: Kaynak boğaz kalınlığı (mm)
  weldLengthMm: number; // L: Kaynak uzunluğu (mm)
  steelGrade: "S235" | "S275" | "S355";
  designShearForceVdKn: number;
}

export interface WeldedConnectionResult {
  throatThicknessMm: number;
  weldLengthMm: number;
  weldStrengthFvwDMpa: number;
  weldShearCapacityKn: number;
  utilization: number;
  isSafe: boolean;
  status: "safe" | "exceeded";
  notes: string[];
}

export function calculateWeldedConnection(input: WeldedConnectionInput): WeldedConnectionResult | null {
  const { weldThicknessMm: a, weldLengthMm: L, steelGrade, designShearForceVdKn: Vd } = input;

  if (a <= 0 || L <= 0 || Vd <= 0) return null;

  const fuMap = { S235: 360, S275: 430, S355: 510 };
  const betaWMap = { S235: 0.8, S275: 0.85, S355: 0.9 };
  const fu = fuMap[steelGrade] ?? 510;
  const betaW = betaWMap[steelGrade] ?? 0.9;
  const gammaM2 = 1.25;

  // ÇYTHYE 2018 / EC3 Köşe Kaynak Dayanımı fvw,d = fu / (sqrt(3) * beta_w * gamma_M2)
  const fvwDMpa = fu / (Math.sqrt(3) * betaW * gammaM2);
  const weldAreaMm2 = a * L;
  const weldShearCapacityKn = (weldAreaMm2 * fvwDMpa) / 1000;
  const utilization = Vd / weldShearCapacityKn;
  const isSafe = utilization <= 1.0;

  return {
    throatThicknessMm: a,
    weldLengthMm: L,
    weldStrengthFvwDMpa: Number(fvwDMpa.toFixed(1)),
    weldShearCapacityKn: Number(weldShearCapacityKn.toFixed(1)),
    utilization: Number(utilization.toFixed(3)),
    isSafe,
    status: isSafe ? "safe" : "exceeded",
    notes: [
      `Köşe Kaynak: a = ${a} mm, L = ${L} mm (${steelGrade} çeliği, fu = ${fu} MPa, βw = ${betaW}).`,
      `Tasarım Kaynak Dayanımı: fvw,d = ${fvwDMpa.toFixed(1)} MPa, Kapasite = ${weldShearCapacityKn.toFixed(1)} kN (Kullanım: %${(utilization * 100).toFixed(1)}).`,
    ],
  };
}
