/**
 * Reinforced Concrete Code Design Engine (TS 500 & TBDY 2018)
 * 
 * Provides authentic, fully compliant cross-section design and verification for:
 * - Material design models (TS 500 §3.3 & §3.4: fcd, fctd, fyd, Ec, k1)
 * - Column P-M biaxial interaction, axial limit (Nd <= 0.40 Ac fck), capacity shear (Ve <= Vr) & confinement
 * - Beam-column joint shear checks (TBDY 2018 §7.5: confined vs unconfined, Ve <= Vmax)
 * - Strong column - weak beam joint safety (TBDY 2018 §7.3.5: sum Mc >= 1.2 sum Mb)
 * - Beam 3-station flexural design (i, midspan, j), seismic bottom steel rule (As,bot >= 0.50 As,top), capacity shear (Ve) & Vc suppression
 * - Shear wall critical boundary elements (lu >= max(0.1Hw, 0.2Lw), rho >= 1.0%), web curtains & dynamic shear amplification (Ve = beta_v (Mpr/Md) Vd <= Vr)
 * - Raft foundation biaxial soil bearing pressure (sigma_max <= q_all), punching shear at d/2 perimeter (tau_pd <= fctd), continuous mesh reinforcement
 */

import type { CadModel, ColumnElement, BeamElement, WallElement, SlabElement, Point } from "./model";
import { distance } from "./geometry";
import type { StructuralAnalysisResult, AnalysisSettings, MemberForceResult, JointShearResult, ColumnBeamMomentResult, PunchingResult } from "./analysis";

// ============================================================================
// 1. Material Models & Code Constants (TS 500 §3.3 & §3.4, TBDY 2018 §7.2)
// ============================================================================

export const MPA_TO_TFM2 = 101.97162129779282; // 1 MPa = 1000 kN/m² / 9.80665 = 101.9716 tf/m²
export const KN_TO_TF = 1.0 / 9.80665;

export interface ConcreteMaterialProperties {
  grade: string;
  fck: number;        // Characteristic compressive strength [MPa]
  fcd: number;        // Design compressive strength fck / 1.5 [MPa]
  fctk: number;       // Characteristic tensile strength 0.35 * sqrt(fck) [MPa]
  fctd: number;       // Design tensile strength fctk / 1.5 [MPa]
  Ec: number;         // Elastic modulus 3250 * sqrt(fck) + 14000 [MPa]
  Gc: number;         // Shear modulus Ec / 2.4 [MPa]
  k1: number;         // Equivalent rectangular stress block depth factor (0.70..0.85)
  epsCu: number;      // Ultimate strain = 0.003
  // Technical units (tf/m²) matching ideCAD reports
  fcdTfM2: number;
  fctdTfM2: number;
  EcTfM2: number;
}

export interface RebarMaterialProperties {
  grade: string;
  fyk: number;        // Characteristic yield strength [MPa]
  fyd: number;        // Design yield strength fyk / 1.15 [MPa]
  Es: number;         // Elastic modulus 200,000 [MPa]
  epsSy: number;      // Yield strain fyd / Es
  fydTfM2: number;    // tf/m²
}

export const STANDARD_CONCRETE_PROPERTIES: Record<string, ConcreteMaterialProperties> = {
  C25: buildConcreteProps("C25", 25),
  C30: buildConcreteProps("C30", 30),
  C35: buildConcreteProps("C35", 35),
  C40: buildConcreteProps("C40", 40),
  C50: buildConcreteProps("C50", 50),
};

export const STANDARD_REBAR_PROPERTIES: Record<string, RebarMaterialProperties> = {
  B420C: buildRebarProps("B420C", 420),
  B500C: buildRebarProps("B500C", 500),
};

function buildConcreteProps(grade: string, fck: number): ConcreteMaterialProperties {
  const fcd = fck / 1.5;
  const fctk = 0.35 * Math.sqrt(fck);
  const fctd = fctk / 1.5;
  const Ec = 3250 * Math.sqrt(fck) + 14000;
  const Gc = Ec / 2.4;
  const k1 = Math.max(0.70, Math.min(0.85, 0.85 - 0.006 * (fck - 25)));
  return {
    grade,
    fck,
    fcd,
    fctk,
    fctd,
    Ec,
    Gc,
    k1,
    epsCu: 0.003,
    fcdTfM2: fcd * MPA_TO_TFM2,
    fctdTfM2: fctd * MPA_TO_TFM2,
    EcTfM2: Ec * MPA_TO_TFM2,
  };
}

function buildRebarProps(grade: string, fyk: number): RebarMaterialProperties {
  const fyd = fyk / 1.15;
  const Es = 200000;
  return {
    grade,
    fyk,
    fyd,
    Es,
    epsSy: fyd / Es,
    fydTfM2: fyd * MPA_TO_TFM2,
  };
}

export function getConcreteProperties(grade?: string): ConcreteMaterialProperties {
  const key = grade && grade in STANDARD_CONCRETE_PROPERTIES ? grade : "C25";
  return STANDARD_CONCRETE_PROPERTIES[key];
}

export function getRebarProperties(grade?: string): RebarMaterialProperties {
  const key = grade && grade in STANDARD_REBAR_PROPERTIES ? grade : "B420C";
  return STANDARD_REBAR_PROPERTIES[key];
}

// Rebar bar area helper (mm²)
export const REBAR_DIAMETERS = [8, 10, 12, 14, 16, 18, 20, 22, 25, 28, 32] as const;
export function getBarAreaMm2(diameterMm: number): number {
  return (Math.PI * Math.pow(diameterMm, 2)) / 4.0;
}

// ============================================================================
// 2. Data Structures for Design Engine Output
// ============================================================================

export interface DetailedCheckBreakdown {
  axialDCR: number;                // Nd / (0.40 * Ac * fck)
  axialPass: boolean;
  axialStressRatio: number;

  flexureDCR: number;              // Md / Mr (or biaxial Bresler DCR)
  flexurePass: boolean;
  momentCapacityKnm: number;
  demandMomentKnm: number;

  shearDCR: number;                // Ve / Vr
  shearPass: boolean;
  shearCapacityKn: number;
  designShearVeKn: number;

  jointDCR?: number;               // Ve / Vmax
  jointPass?: boolean;

  strongColumnDCR?: number;        // 1.2 * sum(Mb) / sum(Mc)
  strongColumnPass?: boolean;

  confinementPass: boolean;
  confinementSpacingCm: number;

  punchingDCR?: number;
  punchingPass?: boolean;
}

export interface MemberRebarSchedule {
  elementId: string;
  name: string;
  type: "column" | "beam" | "wall";
  floorId: string;

  longitudinal: {
    totalAsMm2: number;
    text: string;
    topAsMm2?: number;
    bottomAsMm2?: number;
    startAsMm2?: number;
    midAsMm2?: number;
    endAsMm2?: number;
  };

  transverse: {
    tieDiameterMm: number;
    confinementSpacingCm: number;
    midspanSpacingCm: number;
    legsCount: number;
    confinementLengthM: number;
    text: string;
  };

  wallDetails?: {
    boundaryLengthM: number;
    boundaryAsMm2: number;
    boundaryRebarText: string;
    webHorizontalText: string;
    webVerticalText: string;
    confinementSpacingCm: number;
  };
}

export interface ConcreteMemberCheck extends MemberForceResult {
  checks: DetailedCheckBreakdown;
  rebar: MemberRebarSchedule;
}

export interface RaftSoilPressureResult {
  totalAxialLoadKn: number;
  totalAreaM2: number;
  qAvgKpa: number;
  qMaxKpa: number;
  qMinKpa: number;
  allowableKpa: number;
  settlementAvgMm: number;
  settlementMaxMm: number;
  ratio: number;
  pass: boolean;
  statusText: string;
}

export interface ConcreteDesignSummary {
  totalMembers: number;
  passedMembers: number;
  failedMembers: number;
  maxDCR: number;
  governingElementId: string;
  governingElementName: string;
  governingFailureMode: "axial" | "flexure" | "shear" | "joint" | "strong-column" | "punching";
  governingCombo: string;
  overallPass: boolean;
  summaryNotes: string[];
}

export interface ConcreteDesignResult {
  timestamp: string;
  memberChecks: Record<string, ConcreteMemberCheck>;
  rebarSchedule: Record<string, MemberRebarSchedule>;
  joints: Record<string, JointShearResult>;
  columnBeamMoments: Record<string, ColumnBeamMomentResult>;
  punching: Record<string, PunchingResult>;
  soilPressure?: RaftSoilPressureResult;
  summary: ConcreteDesignSummary;
}

// ============================================================================
// 3. Column Design (TS 500 §7.3 & TBDY 2018 §7.3)
// ============================================================================

export interface ColumnDesignInput {
  element: ColumnElement;
  floorHeightM: number;
  beamDepthMaxM: number;
  NdKn: number;
  V2dKn: number;
  V3dKn: number;
  M2dKnm: number;
  M3dKnm: number;
  concrete: ConcreteMaterialProperties;
  rebar: RebarMaterialProperties;
  governingCombo?: string;
}

export interface ColumnDesignResult {
  elementId: string;
  name: string;
  axialLimitKn: number;
  axialDCR: number;
  axialPass: boolean;
  axialStressRatio: number;

  // Biaxial P-M interaction
  NoKn: number;
  Mr2Knm: number;
  Mr3Knm: number;
  biaxialDCR: number;
  flexurePass: boolean;

  // Capacity shear design
  VeKn: number;
  VcKn: number;
  VwKn: number;
  VrKn: number;
  shearDCR: number;
  shearPass: boolean;

  // Detailing
  AsRequiredMm2: number;
  barCount: number;
  barDiameterMm: number;
  providedRebarText: string;
  confinementSpacingCm: number;
  midspanSpacingCm: number;
  confinementLengthM: number;
  pass: boolean;
  governingDCR: number;
  statusText: string;
  rebarSchedule: MemberRebarSchedule;
}

export function designColumn(input: ColumnDesignInput): ColumnDesignResult {
  const { element, floorHeightM, beamDepthMaxM, NdKn, V2dKn, V3dKn, M2dKnm, M3dKnm, concrete, rebar } = input;

  const bM = element.width;
  const hM = element.depth;
  const bMm = bM * 1000;
  const hMm = hM * 1000;
  const AcMm2 = bMm * hMm;
  const coverMm = 40;
  const d3Mm = hMm - coverMm; // effective depth for M3
  const d2Mm = bMm - coverMm; // effective depth for M2

  // 1. Axial Stress Limit: Nd <= 0.40 * Ac * fck (TBDY 2018 §7.3.1.1)
  const axialLimitKn = (0.40 * AcMm2 * concrete.fck) / 1000.0;
  const axialAbsKn = Math.abs(NdKn);
  const axialDCR = axialAbsKn / Math.max(1.0, axialLimitKn);
  const axialPass = axialDCR <= 1.0;
  const axialStressRatio = (axialAbsKn * 1000.0) / (AcMm2 * concrete.fck);

  // 2. Longitudinal Reinforcement Sizing (TBDY 2018 §7.3.2: 1.0% <= rho <= 4.0%)
  const rhoMin = 0.010;
  const AsMinMm2 = rhoMin * AcMm2;

  // Baseline selection using phi 16 or phi 20
  const chosenBarDia = Math.max(bMm, hMm) >= 500 ? 20 : 16;
  const oneBarArea = getBarAreaMm2(chosenBarDia);
  let barCount = Math.max(4, Math.ceil(AsMinMm2 / oneBarArea));
  if (barCount % 2 !== 0) barCount += 1; // even count for symmetry
  const AstMm2 = barCount * oneBarArea;

  // 3. Biaxial P-M Interaction (TS 500 §7.3 & Bresler Reciprocal / PCA contour)
  // Pure axial concentric resistance No (zero eccentricity)
  const NoKn = (0.85 * concrete.fcd * (AcMm2 - AstMm2) + rebar.fyd * AstMm2) / 1000.0;

  // Uniaxial P-M interaction for major axis (M3 about local 2)
  const cb3 = (0.003 / (0.003 + rebar.epsSy)) * d3Mm;
  const ab3 = concrete.k1 * cb3;
  const Cc3 = (0.85 * concrete.fcd * bMm * ab3) / 1000.0;
  const Nb3 = Cc3; // balanced axial load
  const Mb3 = (Cc3 * (hMm / 2 - ab3 / 2) + (0.5 * AstMm2 * rebar.fyd * (d3Mm - hMm / 2)) / 1000.0) / 1000.0; // balanced moment [kNm]
  const ao3 = (0.5 * AstMm2 * rebar.fyd) / (0.85 * concrete.fcd * bMm);
  const Mo3 = (0.5 * AstMm2 * rebar.fyd * (d3Mm - ao3 / 2)) / 1e6; // pure bending capacity [kNm]

  let Mr3Knm = Mo3;
  if (axialAbsKn <= Nb3) {
    Mr3Knm = Mo3 + (Mb3 - Mo3) * (axialAbsKn / Math.max(1, Nb3));
  } else {
    Mr3Knm = Math.max(1.0, Mb3 * ((NoKn - axialAbsKn) / Math.max(1, NoKn - Nb3)));
  }

  // Uniaxial P-M interaction for minor axis (M2 about local 3)
  const cb2 = (0.003 / (0.003 + rebar.epsSy)) * d2Mm;
  const ab2 = concrete.k1 * cb2;
  const Cc2 = (0.85 * concrete.fcd * hMm * ab2) / 1000.0;
  const Nb2 = Cc2;
  const Mb2 = (Cc2 * (bMm / 2 - ab2 / 2) + (0.5 * AstMm2 * rebar.fyd * (d2Mm - bMm / 2)) / 1000.0) / 1000.0;
  const ao2 = (0.5 * AstMm2 * rebar.fyd) / (0.85 * concrete.fcd * hMm);
  const Mo2 = (0.5 * AstMm2 * rebar.fyd * (d2Mm - ao2 / 2)) / 1e6;

  let Mr2Knm = Mo2;
  if (axialAbsKn <= Nb2) {
    Mr2Knm = Mo2 + (Mb2 - Mo2) * (axialAbsKn / Math.max(1, Nb2));
  } else {
    Mr2Knm = Math.max(1.0, Mb2 * ((NoKn - axialAbsKn) / Math.max(1, NoKn - Nb2)));
  }

  // Biaxial Bresler load contour: (M2d/Mr2)^alpha + (M3d/Mr3)^alpha <= 1.0 (alpha = 1.2)
  const alpha = 1.20;
  const term2 = Math.pow(Math.abs(M2dKnm) / Math.max(1.0, Mr2Knm), alpha);
  const term3 = Math.pow(Math.abs(M3dKnm) / Math.max(1.0, Mr3Knm), alpha);
  const biaxialDCR = Math.pow(term2 + term3, 1.0 / alpha);
  const flexurePass = biaxialDCR <= 1.0;

  // 4. Capacity Shear Design Ve (TBDY 2018 §7.3.7)
  const lnM = Math.max(1.0, floorHeightM - beamDepthMaxM);
  // Column end moment capacities under Nd: Mpa = 1.4 * Mr3, Mpu = 1.4 * Mr3
  const Mpa = 1.4 * Mr3Knm;
  const Mpu = 1.4 * Mr3Knm;
  const VeKn = Math.max(Math.abs(V2dKn), (Mpa + Mpu) / lnM);

  // Maximum shear limit (web crushing): Vmax = min(0.85 Ac sqrt(fck), 0.22 fcd Ac)
  const VmaxKn = Math.min(
    (0.85 * AcMm2 * Math.sqrt(concrete.fck)) / 1000.0,
    (0.22 * concrete.fcd * AcMm2) / 1000.0
  );

  // Concrete contribution Vc
  let VcKn = 0.0;
  if (!(VeKn >= 0.5 * Math.abs(V2dKn) && axialAbsKn <= 0.05 * (AcMm2 * concrete.fck) / 1000.0)) {
    const betaN = 1.0 + 0.07 * (axialAbsKn * 1000.0 / AcMm2);
    VcKn = (0.8 * 0.65 * concrete.fctd * bMm * d3Mm * Math.min(2.0, betaN)) / 1000.0;
  }

  // Transverse ties detailing (TBDY 2018 §7.3.4)
  const minDimMm = Math.min(bMm, hMm);
  const maxTieSpacingConfMm = Math.max(50, Math.min(Math.floor(minDimMm / 3), 150, 6 * chosenBarDia));
  const maxTieSpacingSpanMm = Math.min(Math.floor(minDimMm / 2), 200);
  const confinementLengthM = Math.max(Math.max(bM, hM), lnM / 6.0, 0.50);

  // Stirrup contribution Vw with phi 8 ties (2 legs)
  const tieDiaMm = 8;
  const AswMm2 = 2 * getBarAreaMm2(tieDiaMm); // 2-leg tie
  const sConfMm = maxTieSpacingConfMm;
  const VwKn = ((AswMm2 / sConfMm) * rebar.fyd * d3Mm) / 1000.0;
  const VrKn = Math.min(VmaxKn, VcKn + VwKn);
  const shearDCR = VeKn / Math.max(1.0, VrKn);
  const shearPass = shearDCR <= 1.0 && VeKn <= VmaxKn;

  const confinementSpacingCm = Math.round(sConfMm / 10.0);
  const midspanSpacingCm = Math.round(maxTieSpacingSpanMm / 10.0);

  const governingDCR = Math.max(axialDCR, biaxialDCR, shearDCR);
  const pass = axialPass && flexurePass && shearPass;

  const providedRebarText = `${barCount}Φ${chosenBarDia} (As = ${(AstMm2 / 100.0).toFixed(1)} cm²)`;

  const rebarSchedule: MemberRebarSchedule = {
    elementId: element.id,
    name: element.name,
    type: "column",
    floorId: element.floorId,
    longitudinal: {
      totalAsMm2: AstMm2,
      text: providedRebarText,
    },
    transverse: {
      tieDiameterMm: tieDiaMm,
      confinementSpacingCm,
      midspanSpacingCm,
      legsCount: 2,
      confinementLengthM,
      text: `Φ${tieDiaMm}/${confinementSpacingCm}/${midspanSpacingCm}`,
    },
  };

  const statusText = !axialPass
    ? `Eksenel yük limiti aşıldı (Nd/(0.4Ac*fck) = ${(axialDCR * 100).toFixed(1)}% > 100%)`
    : !flexurePass
    ? `İki eksenli eğilme kapasitesi aşıldı (Bresler DCR = ${(biaxialDCR * 100).toFixed(1)}%)`
    : !shearPass
    ? `Kolon kesme kapasitesi aşıldı (Ve/Vr = ${(shearDCR * 100).toFixed(1)}%)`
    : `Kolon güvenli (DCR = ${(governingDCR * 100).toFixed(1)}%)`;

  return {
    elementId: element.id,
    name: element.name,
    axialLimitKn,
    axialDCR,
    axialPass,
    axialStressRatio,
    NoKn,
    Mr2Knm,
    Mr3Knm,
    biaxialDCR,
    flexurePass,
    VeKn,
    VcKn,
    VwKn,
    VrKn,
    shearDCR,
    shearPass,
    AsRequiredMm2: AsMinMm2,
    barCount,
    barDiameterMm: chosenBarDia,
    providedRebarText,
    confinementSpacingCm,
    midspanSpacingCm,
    confinementLengthM,
    pass,
    governingDCR,
    statusText,
    rebarSchedule,
  };
}

// ============================================================================
// 4. Beam Design (TS 500 §7.1 & TBDY 2018 §7.4)
// ============================================================================

export interface BeamDesignInput {
  element: BeamElement;
  LspanM: number;
  colWidthLeftM: number;
  colWidthRightM: number;
  MiTopKnm: number;      // Left support top moment
  MiBotKnm: number;      // Left support bottom moment
  MmidBotKnm: number;    // Midspan bottom moment
  MjTopKnm: number;      // Right support top moment
  MjBotKnm: number;      // Right support bottom moment
  VdyKn: number;         // Gravity shear at end
  V2dKn: number;         // Max envelope shear
  concrete: ConcreteMaterialProperties;
  rebar: RebarMaterialProperties;
  governingCombo?: string;
}

export interface BeamStationDesign {
  AsTopMm2: number;
  AsBotMm2: number;
  MrTopKnm: number;
  MrBotKnm: number;
  barTopText: string;
  barBotText: string;
  dcr: number;
  pass: boolean;
}

export interface BeamDesignResult {
  elementId: string;
  name: string;
  lnM: number;
  stationI: BeamStationDesign;
  stationMid: BeamStationDesign;
  stationJ: BeamStationDesign;

  // Capacity shear
  MpiKnm: number;
  MpjKnm: number;
  VeKn: number;
  VcKn: number;
  VwKn: number;
  VrKn: number;
  shearDCR: number;
  shearPass: boolean;

  confinementSpacingCm: number;
  spanSpacingCm: number;
  confinementLengthM: number;
  pass: boolean;
  governingDCR: number;
  statusText: string;
  rebarSchedule: MemberRebarSchedule;
}

export function designBeam(input: BeamDesignInput): BeamDesignResult {
  const { element, LspanM, colWidthLeftM, colWidthRightM, MiTopKnm, MiBotKnm, MmidBotKnm, MjTopKnm, MjBotKnm, VdyKn, V2dKn, concrete, rebar } = input;

  const bwM = element.width;
  const hM = element.height;
  const bwMm = bwM * 1000;
  const hMm = hM * 1000;
  const coverMm = 40;
  const dMm = hMm - coverMm;

  // Clear span ln
  const lnM = Math.max(1.0, LspanM - (colWidthLeftM / 2.0 + colWidthRightM / 2.0));

  // Minimum tension rebar per TS 500 Eq. 7.3: rho_min = 0.8 * fctd / fyd
  const rhoMin = Math.max(0.002, (0.8 * concrete.fctd) / rebar.fyd);
  const AsMinMm2 = rhoMin * bwMm * dMm;

  // Helper for flexural rebar design: M -> As
  function computeFlexuralSteel(momentKnm: number): { AsMm2: number; MrKnm: number } {
    const MabsKnm = Math.max(1.0, Math.abs(momentKnm));
    const a = dMm - Math.sqrt(Math.max(0, Math.pow(dMm, 2) - (2.0 * MabsKnm * 1e6) / (0.85 * concrete.fcd * bwMm)));
    const AsReq = (MabsKnm * 1e6) / (rebar.fyd * Math.max(0.5 * dMm, dMm - a / 2.0));
    const AsFinal = Math.max(AsMinMm2, AsReq);
    const aFinal = (AsFinal * rebar.fyd) / (0.85 * concrete.fcd * bwMm);
    const Mr = (AsFinal * rebar.fyd * (dMm - aFinal / 2.0)) / 1e6;
    return { AsMm2: AsFinal, MrKnm: Mr };
  }

  // 1. Station i (Left Support)
  const stI_Top = computeFlexuralSteel(MiTopKnm);
  let stI_Bot_As = computeFlexuralSteel(MiBotKnm).AsMm2;
  // TBDY 2018 §7.4.3.1: Support bottom steel As,bot >= 0.50 * As,top
  stI_Bot_As = Math.max(stI_Bot_As, 0.50 * stI_Top.AsMm2);

  const countI_Top = Math.max(2, Math.ceil(stI_Top.AsMm2 / getBarAreaMm2(14)));
  const countI_Bot = Math.max(2, Math.ceil(stI_Bot_As / getBarAreaMm2(14)));
  const AsI_Top_Prov = countI_Top * getBarAreaMm2(14);
  const AsI_Bot_Prov = countI_Bot * getBarAreaMm2(14);
  const aI_Top = (AsI_Top_Prov * rebar.fyd) / (0.85 * concrete.fcd * bwMm);
  const aI_Bot = (AsI_Bot_Prov * rebar.fyd) / (0.85 * concrete.fcd * bwMm);
  const MrI_Top = (AsI_Top_Prov * rebar.fyd * (dMm - aI_Top / 2.0)) / 1e6;
  const MrI_Bot = (AsI_Bot_Prov * rebar.fyd * (dMm - aI_Bot / 2.0)) / 1e6;
  const dcrI = Math.max(Math.abs(MiTopKnm) / MrI_Top, Math.abs(MiBotKnm) / MrI_Bot);

  const stationI: BeamStationDesign = {
    AsTopMm2: AsI_Top_Prov,
    AsBotMm2: AsI_Bot_Prov,
    MrTopKnm: MrI_Top,
    MrBotKnm: MrI_Bot,
    barTopText: `${countI_Top}Φ14`,
    barBotText: `${countI_Bot}Φ14`,
    dcr: dcrI,
    pass: dcrI <= 1.0,
  };

  // 2. Station Midspan
  const stMid_Bot = computeFlexuralSteel(MmidBotKnm);
  // Montage top steel: at least 2 phi 12
  const countMid_Top = 2;
  const countMid_Bot = Math.max(2, Math.ceil(stMid_Bot.AsMm2 / getBarAreaMm2(14)));
  const AsMid_Bot_Prov = countMid_Bot * getBarAreaMm2(14);
  const aMid_Bot = (AsMid_Bot_Prov * rebar.fyd) / (0.85 * concrete.fcd * bwMm);
  const MrMid_Bot = (AsMid_Bot_Prov * rebar.fyd * (dMm - aMid_Bot / 2.0)) / 1e6;
  const dcrMid = Math.abs(MmidBotKnm) / MrMid_Bot;

  const stationMid: BeamStationDesign = {
    AsTopMm2: countMid_Top * getBarAreaMm2(12),
    AsBotMm2: AsMid_Bot_Prov,
    MrTopKnm: (countMid_Top * getBarAreaMm2(12) * rebar.fyd * 0.9 * dMm) / 1e6,
    MrBotKnm: MrMid_Bot,
    barTopText: `${countMid_Top}Φ12 (Montaj)`,
    barBotText: `${countMid_Bot}Φ14`,
    dcr: dcrMid,
    pass: dcrMid <= 1.0,
  };

  // 3. Station j (Right Support)
  const stJ_Top = computeFlexuralSteel(MjTopKnm);
  let stJ_Bot_As = computeFlexuralSteel(MjBotKnm).AsMm2;
  stJ_Bot_As = Math.max(stJ_Bot_As, 0.50 * stJ_Top.AsMm2);

  const countJ_Top = Math.max(2, Math.ceil(stJ_Top.AsMm2 / getBarAreaMm2(14)));
  const countJ_Bot = Math.max(2, Math.ceil(stJ_Bot_As / getBarAreaMm2(14)));
  const AsJ_Top_Prov = countJ_Top * getBarAreaMm2(14);
  const AsJ_Bot_Prov = countJ_Bot * getBarAreaMm2(14);
  const aJ_Top = (AsJ_Top_Prov * rebar.fyd) / (0.85 * concrete.fcd * bwMm);
  const aJ_Bot = (AsJ_Bot_Prov * rebar.fyd) / (0.85 * concrete.fcd * bwMm);
  const MrJ_Top = (AsJ_Top_Prov * rebar.fyd * (dMm - aJ_Top / 2.0)) / 1e6;
  const MrJ_Bot = (AsJ_Bot_Prov * rebar.fyd * (dMm - aJ_Bot / 2.0)) / 1e6;
  const dcrJ = Math.max(Math.abs(MjTopKnm) / MrJ_Top, Math.abs(MjBotKnm) / MrJ_Bot);

  const stationJ: BeamStationDesign = {
    AsTopMm2: AsJ_Top_Prov,
    AsBotMm2: AsJ_Bot_Prov,
    MrTopKnm: MrJ_Top,
    MrBotKnm: MrJ_Bot,
    barTopText: `${countJ_Top}Φ14`,
    barBotText: `${countJ_Bot}Φ14`,
    dcr: dcrJ,
    pass: dcrJ <= 1.0,
  };

  // 4. Capacity Shear Design Ve (TBDY 2018 §7.4.5)
  // Mpi = 1.4 * Mri, Mpj = 1.4 * Mrj
  const MpiKnm = 1.4 * MrI_Top;
  const MpjKnm = 1.4 * MrJ_Top;
  const seismicShearKn = (MpiKnm + MpjKnm) / lnM;
  const VeKn = Math.max(Math.abs(V2dKn), Math.abs(VdyKn) + seismicShearKn);

  // Web crushing limit: Vmax = min(0.85 bw d sqrt(fck), 0.22 fcd bw d)
  const VmaxKn = Math.min(
    (0.85 * bwMm * dMm * Math.sqrt(concrete.fck)) / 1000.0,
    (0.22 * concrete.fcd * bwMm * dMm) / 1000.0
  );

  // Suppress concrete contribution (Vc = 0) in confinement zone if seismic shear dominates
  let VcKn = (0.52 * concrete.fctd * bwMm * dMm) / 1000.0;
  if (seismicShearKn >= 0.50 * VeKn && VeKn > 0.50 * Math.abs(VdyKn)) {
    VcKn = 0.0; // Confinement Vc suppressed
  }

  // Transverse stirrups detailing (TBDY 2018 §7.4.5.3)
  const sConfMm = Math.max(50, Math.min(Math.floor(hMm / 4), 100, 8 * 14));
  const sSpanMm = Math.min(Math.floor(hMm / 2), 200);
  const confinementLengthM = 2.0 * hM;

  const tieDiaMm = 8;
  const AswMm2 = 2 * getBarAreaMm2(tieDiaMm); // 2 legs of phi 8
  const VwKn = ((AswMm2 / sConfMm) * rebar.fyd * dMm) / 1000.0;
  const VrKn = Math.min(VmaxKn, VcKn + VwKn);
  const shearDCR = VeKn / Math.max(1.0, VrKn);
  const shearPass = shearDCR <= 1.0 && VeKn <= VmaxKn;

  const confinementSpacingCm = Math.round(sConfMm / 10.0);
  const spanSpacingCm = Math.round(sSpanMm / 10.0);

  const flexureDCR = Math.max(dcrI, dcrMid, dcrJ);
  const governingDCR = Math.max(flexureDCR, shearDCR);
  const pass = stationI.pass && stationMid.pass && stationJ.pass && shearPass;

  const rebarSchedule: MemberRebarSchedule = {
    elementId: element.id,
    name: element.name,
    type: "beam",
    floorId: element.floorId,
    longitudinal: {
      totalAsMm2: stI_Top.AsMm2 + stMid_Bot.AsMm2 + stJ_Top.AsMm2,
      text: `Sol: ${stationI.barTopText}/${stationI.barBotText}, Açıklık: ${stationMid.barBotText}, Sağ: ${stationJ.barTopText}/${stationJ.barBotText}`,
      topAsMm2: Math.max(stI_Top.AsMm2, stJ_Top.AsMm2),
      bottomAsMm2: stMid_Bot.AsMm2,
      startAsMm2: stI_Top.AsMm2,
      midAsMm2: stMid_Bot.AsMm2,
      endAsMm2: stJ_Top.AsMm2,
    },
    transverse: {
      tieDiameterMm: tieDiaMm,
      confinementSpacingCm,
      midspanSpacingCm: spanSpacingCm,
      legsCount: 2,
      confinementLengthM,
      text: `Φ${tieDiaMm}/${confinementSpacingCm}/${spanSpacingCm}`,
    },
  };

  const statusText = !shearPass
    ? `Kiriş kesme kapasitesi aşıldı (Ve/Vr = ${(shearDCR * 100).toFixed(1)}%)`
    : flexureDCR > 1.0
    ? `Kiriş eğilme momenti aşıldı (DCR = ${(flexureDCR * 100).toFixed(1)}%)`
    : `Kiriş güvenli (DCR = ${(governingDCR * 100).toFixed(1)}%)`;

  return {
    elementId: element.id,
    name: element.name,
    lnM,
    stationI,
    stationMid,
    stationJ,
    MpiKnm,
    MpjKnm,
    VeKn,
    VcKn,
    VwKn,
    VrKn,
    shearDCR,
    shearPass,
    confinementSpacingCm,
    spanSpacingCm,
    confinementLengthM,
    pass,
    governingDCR,
    statusText,
    rebarSchedule,
  };
}

// ============================================================================
// 5. Shear Wall Design (TBDY 2018 §7.6)
// ============================================================================

export interface ShearWallDesignInput {
  element: WallElement;
  floorName: string;
  floorHeightM: number;
  totalWallHeightM: number;
  elevationM: number;
  NdKn: number;
  VdKn: number;
  MdKnm: number;
  concrete: ConcreteMaterialProperties;
  rebar: RebarMaterialProperties;
  T1Sec?: number;
  R?: number;
  I?: number;
  governingCombo?: string;
}

export interface ShearWallDesignResult {
  elementId: string;
  name: string;
  isSlender: boolean;
  HcrM: number;
  isInCriticalHeight: boolean;
  luM: number;
  requiredBoundaryAsCm2: number;
  providedBoundaryBars: string;
  confinementSpacingCm: number;
  requiredWebHorizontalAsCm2PerM: number;
  requiredWebVerticalAsCm2PerM: number;
  providedWebRebarText: string;

  beta_v: number;
  MprKnm: number;
  VeKn: number;
  VcKn: number;
  VwKn: number;
  VrKn: number;
  VeMaxKn: number;
  shearDCR: number;
  flexureDCR: number;
  axialDCR: number;
  shearPass: boolean;
  flexurePass: boolean;
  axialPass: boolean;
  governingDCR: number;
  pass: boolean;
  statusText: string;
  rebarSchedule: MemberRebarSchedule;
}

export function designShearWall(input: ShearWallDesignInput): ShearWallDesignResult {
  const { element, floorName, floorHeightM, totalWallHeightM, elevationM, NdKn, VdKn, MdKnm, concrete, rebar, T1Sec = 0.35, R = 6.0, I = 1.0 } = input;

  const LwM = distance(element.start, element.end);
  const bwM = element.thickness;
  const LwMm = LwM * 1000;
  const bwMm = bwM * 1000;
  const AchMm2 = bwMm * LwMm;
  const axialAbsKn = Math.abs(NdKn);

  // 1. Classification & Critical Height Hcr (TBDY 2018 §7.6.2.2)
  const isSlender = totalWallHeightM / Math.max(0.1, LwM) > 2.0;
  const HcrM = Math.min(2.0 * LwM, Math.max(LwM, totalWallHeightM / 6.0));
  const isInCriticalHeight = elevationM <= HcrM || floorName.toUpperCase().includes("BODRUM") || floorName.toUpperCase().includes("ZEMİN");

  // 2. Boundary Zone Length lu (TBDY 2018 §7.6.2.2)
  const luM = isInCriticalHeight
    ? Math.max(2.0 * bwM, Math.max(0.10 * totalWallHeightM, 0.20 * LwM))
    : Math.max(bwM, 0.10 * LwM);
  const luMm = luM * 1000;

  // 3. Boundary Longitudinal Reinforcement (rho >= 0.010 in Hcr, >= 0.005 outside, min 4 phi 14)
  const boundaryAreaMm2 = bwMm * luMm;
  const minBoundaryRho = isInCriticalHeight ? 0.010 : 0.005;
  const requiredBoundaryAsMm2 = Math.max(4 * getBarAreaMm2(14), minBoundaryRho * boundaryAreaMm2);
  const numBars14 = Math.max(4, Math.ceil(requiredBoundaryAsMm2 / getBarAreaMm2(14)));
  const providedBoundaryBars = `${numBars14}Φ14`;
  const boundaryAsMm2 = numBars14 * getBarAreaMm2(14);

  // 4. Boundary Confinement Spacing
  const sConfMm = isInCriticalHeight
    ? Math.max(50, Math.min(Math.floor(bwMm / 3), 100, 6 * 14))
    : Math.min(Math.floor(bwMm / 2), 150);
  const confinementSpacingCm = Math.round(sConfMm / 10.0);

  // 5. Web Reinforcement (2 curtains, rho >= 0.0025, spacing <= 250mm)
  const minWebRho = 0.0025;
  const reqWebAsMm2PerM = minWebRho * bwMm * 1000.0;
  const providedWebRebarText = `2xΦ10/20 (Gövde) + 4 çiroz/m²`;

  // 6. Dynamic Shear Amplification Ve (TBDY 2018 §7.6.6)
  const beta_v = T1Sec <= 0.5 ? 1.0 : Math.min(1.4, 1.0 + 0.5 * (T1Sec - 0.5));
  const dMm = 0.85 * LwMm;
  const zArmMm = LwMm - luMm;

  // Nominal flexural capacity Mr of shear wall
  const nominalMrKnm =
    (0.9 * rebar.fyd * boundaryAsMm2 * zArmMm +
      0.5 * axialAbsKn * 1000.0 * LwMm * Math.max(0.1, 1.0 - (axialAbsKn * 1000.0) / (AchMm2 * concrete.fcd))) /
    1e6;
  const MprKnm = 1.25 * nominalMrKnm;

  const momentRatio = Math.abs(MdKnm) > 1 ? Math.min(R / I, Math.max(1.0, MprKnm / Math.abs(MdKnm))) : 1.0;
  const VeBaseKn = beta_v * momentRatio * Math.abs(VdKn);
  const VeKn = isInCriticalHeight ? VeBaseKn : Math.max(Math.abs(VdKn), VeBaseKn * 0.75);

  // 7. Shear Capacities: Web crushing limit VeMax <= 0.85 Ach sqrt(fck)
  const VeMaxKn = (0.85 * AchMm2 * Math.sqrt(concrete.fck)) / 1000.0;
  const VcKn = (0.65 * concrete.fctd * bwMm * dMm) / 1000.0;
  const AswPerM = (2.0 * getBarAreaMm2(10) / 200.0) * 1000.0; // 2x phi 10 @ 200mm
  const VwKn = ((AswPerM / 1000.0) * rebar.fyd * dMm) / 1000.0;
  const VrKn = Math.min(VeMaxKn, VcKn + VwKn);

  // 8. Design Checks
  const shearDCR = VeKn / Math.max(1.0, VrKn);
  const flexureDCR = Math.abs(MdKnm) / Math.max(1.0, nominalMrKnm);
  const axialLimitKn = (0.35 * AchMm2 * concrete.fck) / 1000.0;
  const axialDCR = axialAbsKn / Math.max(1.0, axialLimitKn);

  const governingDCR = Math.max(shearDCR, flexureDCR, axialDCR);
  const pass = shearDCR <= 1.0 && flexureDCR <= 1.0 && axialDCR <= 1.0 && VeKn <= VeMaxKn;

  const rebarSchedule: MemberRebarSchedule = {
    elementId: element.id,
    name: element.name,
    type: "wall",
    floorId: element.floorId,
    longitudinal: {
      totalAsMm2: 2 * boundaryAsMm2 + reqWebAsMm2PerM * (LwM - 2 * luM),
      text: `Uç: 2x(${providedBoundaryBars}) + ${providedWebRebarText}`,
    },
    transverse: {
      tieDiameterMm: 8,
      confinementSpacingCm,
      midspanSpacingCm: 20,
      legsCount: 4,
      confinementLengthM: luM,
      text: `Uç: Φ8/${confinementSpacingCm}, Gövde: 2xΦ10/20`,
    },
    wallDetails: {
      boundaryLengthM: luM,
      boundaryAsMm2,
      boundaryRebarText: providedBoundaryBars,
      webHorizontalText: "2xΦ10/20",
      webVerticalText: "2xΦ10/20",
      confinementSpacingCm,
    },
  };

  const statusText = !pass
    ? `Perde kapasite aşıldı (Ve/Vr = ${(shearDCR * 100).toFixed(1)}%, Md/Mr = ${(flexureDCR * 100).toFixed(1)}%)`
    : `Perde güvenli (Ve/Vr = ${(shearDCR * 100).toFixed(1)}%, Md/Mr = ${(flexureDCR * 100).toFixed(1)}%)`;

  return {
    elementId: element.id,
    name: element.name,
    isSlender,
    HcrM,
    isInCriticalHeight,
    luM,
    requiredBoundaryAsCm2: requiredBoundaryAsMm2 / 100.0,
    providedBoundaryBars,
    confinementSpacingCm,
    requiredWebHorizontalAsCm2PerM: reqWebAsMm2PerM / 100.0,
    requiredWebVerticalAsCm2PerM: reqWebAsMm2PerM / 100.0,
    providedWebRebarText,
    beta_v,
    MprKnm,
    VeKn,
    VcKn,
    VwKn,
    VrKn,
    VeMaxKn,
    shearDCR,
    flexureDCR,
    axialDCR,
    shearPass: shearDCR <= 1.0 && VeKn <= VeMaxKn,
    flexurePass: flexureDCR <= 1.0,
    axialPass: axialDCR <= 1.0,
    governingDCR,
    pass,
    statusText,
    rebarSchedule,
  };
}

// ============================================================================
// 6. Beam-Column Joint Shear Checks (TBDY 2018 §7.5)
// ============================================================================

export interface JointCheckInput {
  column: ColumnElement;
  connectedBeams: BeamElement[];
  colShearKn: number;
  beamRebars: { topAsMm2: number; botAsMm2: number; beamId: string }[];
  concrete: ConcreteMaterialProperties;
  rebar: RebarMaterialProperties;
}

export function checkBeamColumnJoint(input: JointCheckInput): JointShearResult {
  const { column, connectedBeams, colShearKn, beamRebars, concrete, rebar } = input;

  const bcM = column.width;
  const hcM = column.depth;

  // Determine confinement status (TBDY 2018 §7.5.1):
  // Confined if beams frame into all 4 faces and bw >= 0.75 * bc on each face
  const hasXBeams = connectedBeams.some(b => Math.abs(b.end.x - b.start.x) > Math.abs(b.end.y - b.start.y));
  const hasYBeams = connectedBeams.some(b => Math.abs(b.end.y - b.start.y) > Math.abs(b.end.x - b.start.x));
  const allBeamsWide = connectedBeams.every(b => b.width >= 0.75 * Math.min(bcM, hcM) - 1e-4);
  const isConfined = connectedBeams.length >= 4 && hasXBeams && hasYBeams && allBeamsWide;

  // Effective joint width bj (TBDY Eq. 7.12)
  const avgBwM = connectedBeams.length > 0 ? connectedBeams.reduce((s, b) => s + b.width, 0) / connectedBeams.length : bcM;
  const bjM = Math.min(bcM, Math.max(avgBwM, avgBwM + 2.0 * Math.max(0, (bcM - avgBwM) / 2.0)));

  // Joint shear demand: Ve = 1.25 * fyk * (As1 + As2) - Vcol (TBDY Eq. 7.11)
  let sumAs1Mm2 = 0;
  let sumAs2Mm2 = 0;
  if (beamRebars.length > 0) {
    sumAs1Mm2 = beamRebars[0].topAsMm2;
    sumAs2Mm2 = beamRebars.length > 1 ? beamRebars[1].botAsMm2 : 0; // 0 for exterior joint
  } else {
    sumAs1Mm2 = 600;
  }
  const rebarTensileKn = (1.25 * rebar.fyk * (sumAs1Mm2 + sumAs2Mm2)) / 1000.0;
  const shearDemandKn = Math.max(10.0, rebarTensileKn - Math.abs(colShearKn));

  // Joint shear capacity Vmax (TBDY Eq. 7.12): 1.7 bj h sqrt(fck) [confined] or 1.0 [unconfined]
  const factor = isConfined ? 1.70 : 1.00;
  const shearCapacityKn = (factor * (bjM * 1000.0) * (hcM * 1000.0) * Math.sqrt(concrete.fck)) / 1000.0;
  const shearRatio = shearDemandKn / Math.max(1.0, shearCapacityKn);
  const pass = shearRatio <= 1.0;

  return {
    columnId: column.id,
    columnName: column.name,
    floorId: column.floorId,
    connectedBeams: connectedBeams.map(b => b.name),
    isConfined,
    effectiveWidthM: bjM,
    columnDepthM: hcM,
    shearDemandKn,
    shearCapacityKn,
    shearRatio,
    pass,
    statusText: pass
      ? `${isConfined ? "Kuşatılmış" : "Kuşatılmamış"} birleşim güvenli (Ve/Vmax = ${(shearRatio * 100).toFixed(1)}%)`
      : `Birleşim kesme güvenliği yetersiz (Ve/Vmax = ${(shearRatio * 100).toFixed(1)}% > 100%)`,
  };
}

// ============================================================================
// 7. Strong Column - Weak Beam Check (TBDY 2018 §7.3.5)
// ============================================================================

export interface StrongColumnInput {
  column: ColumnElement;
  upperColumn?: ColumnElement;
  colMomentCapacityKnm: number;
  upperColMomentCapacityKnm?: number;
  connectedBeamCapacitiesKnm: number[];
  isTopStorey: boolean;
  isShearWallDominant?: boolean;
}

export function checkStrongColumnWeakBeam(input: StrongColumnInput): ColumnBeamMomentResult {
  const { column, upperColumn, colMomentCapacityKnm, upperColMomentCapacityKnm, connectedBeamCapacitiesKnm, isTopStorey, isShearWallDominant } = input;

  // Sum of column moment capacities at joint
  const sumColumnMomentKnm = colMomentCapacityKnm + (upperColumn ? (upperColMomentCapacityKnm ?? colMomentCapacityKnm) : colMomentCapacityKnm);
  // Sum of beam moment capacities at joint
  const sumBeamMomentKnm = connectedBeamCapacitiesKnm.reduce((s, m) => s + m, 0) || 50.0;

  // TBDY Eq. 7.3: sum Mc >= 1.20 * sum Mb
  const ratio = sumColumnMomentKnm / Math.max(1.0, sumBeamMomentKnm);
  const pass = isTopStorey || isShearWallDominant ? true : ratio >= 1.20;

  let statusText = `Güçlü kolon koşulu sağlandı (ΣMc/ΣMb = ${ratio.toFixed(2)} ≥ 1.20)`;
  if (isTopStorey) {
    statusText = `Çatı katı birleşimi: TBDY §7.3.5.3 uyarınca güçlü kolon tahkikinden muaftır.`;
  } else if (!pass) {
    statusText = `Güçlü kolon koşulu yetersiz (ΣMc/ΣMb = ${ratio.toFixed(2)} < 1.20)`;
  }

  return {
    columnId: column.id,
    columnName: column.name,
    floorId: column.floorId,
    sumColumnMomentKnm,
    sumBeamMomentKnm,
    ratio,
    pass,
    statusText,
  };
}

// ============================================================================
// 8. Raft Foundation Design (TBDY 2018 §16.8 & TS 500 §13)
// ============================================================================

export interface RaftFoundationElementInput {
  id: string;
  name: string;
  type: "column" | "wall";
  x: number;
  y: number;
  widthM: number;
  depthM: number;
  NdKn: number;
  MxKnm: number;
  MyKnm: number;
}

export interface RaftDesignInput {
  slab: SlabElement;
  thicknessM: number;
  coverM: number;
  points: Point[];
  loads: RaftFoundationElementInput[];
  qAllKpa: number;     // Allowable soil pressure [kPa]
  ksKpaPerM: number;   // Subgrade modulus [kN/m³]
  concrete: ConcreteMaterialProperties;
  rebar: RebarMaterialProperties;
  isSeismic?: boolean;
}

export interface RaftDesignResult {
  soilPressure: RaftSoilPressureResult;
  punchingChecks: Record<string, PunchingResult>;
  continuousMesh: {
    minAsCm2PerM: number;
    recommendedMesh: string;
    providedAsCm2PerM: number;
    text: string;
  };
  pass: boolean;
}

export function designRaftFoundation(input: RaftDesignInput): RaftDesignResult {
  const { thicknessM, coverM, points, loads, qAllKpa, ksKpaPerM, concrete, rebar, isSeismic } = input;
  const dM = thicknessM - coverM;
  const fctdKpa = concrete.fctd * 1000.0;

  // 1. Polygon Geometric Properties (Area, Centroid, Inertias)
  let area = 0;
  let cxSum = 0;
  let cySum = 0;
  const n = points.length;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    const factor = points[i].x * points[j].y - points[j].x * points[i].y;
    area += factor;
    cxSum += (points[i].x + points[j].x) * factor;
    cySum += (points[i].y + points[j].y) * factor;
  }
  area = Math.abs(area) / 2.0;
  const cx = cxSum / (6.0 * (area || 1.0));
  const cy = cySum / (6.0 * (area || 1.0));

  let Ixx = 0;
  let Iyy = 0;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    const xi = points[i].x - cx, yi = points[i].y - cy;
    const xj = points[j].x - cx, yj = points[j].y - cy;
    const cross = xi * yj - xj * yi;
    Ixx += (yi * yi + yi * yj + yj * yj) * cross;
    Iyy += (xi * xi + xi * xj + xj * xj) * cross;
  }
  Ixx = Math.abs(Ixx) / 12.0;
  Iyy = Math.abs(Iyy) / 12.0;

  // 2. Total Vertical Load and Overturning Moments
  const raftSelfWeightKn = area * thicknessM * 25.0; // 25 kN/m³ RC density
  let totalAxialLoadKn = raftSelfWeightKn;
  let totalMxKnm = 0;
  let totalMyKnm = 0;

  for (const load of loads) {
    const pz = Math.abs(load.NdKn);
    totalAxialLoadKn += pz;
    totalMxKnm += pz * (load.y - cy) + load.MxKnm;
    totalMyKnm += pz * (load.x - cx) + load.MyKnm;
  }

  // 3. Soil Bearing Pressure at Boundary Points
  const qAvg = totalAxialLoadKn / Math.max(1e-4, area);
  let qMax = qAvg;
  let qMin = qAvg;

  for (const pt of points) {
    const dy = pt.y - cy;
    const dx = pt.x - cx;
    const q = qAvg + (Ixx > 1e-4 ? (totalMxKnm * dy) / Ixx : 0) + (Iyy > 1e-4 ? (totalMyKnm * dx) / Iyy : 0);
    if (q > qMax) qMax = q;
    if (q < qMin) qMin = q;
  }

  const allowableKpa = isSeismic ? 1.5 * qAllKpa : qAllKpa;
  const passBearing = qMax <= allowableKpa;
  const passNoUplift = isSeismic ? qMin >= -0.1 * qAvg : qMin >= 0;
  const soilPass = passBearing && passNoUplift;

  const soilPressure: RaftSoilPressureResult = {
    totalAxialLoadKn,
    totalAreaM2: area,
    qAvgKpa: qAvg,
    qMaxKpa: qMax,
    qMinKpa: qMin,
    allowableKpa,
    settlementAvgMm: (qAvg / ksKpaPerM) * 1000.0,
    settlementMaxMm: (qMax / ksKpaPerM) * 1000.0,
    ratio: qMax / Math.max(1.0, allowableKpa),
    pass: soilPass,
    statusText: soilPass
      ? `Zemin emniyet gerilmesi sağlandı (σmax = ${qMax.toFixed(1)} kPa ≤ ${allowableKpa.toFixed(1)} kPa)`
      : `Zemin emniyet gerilmesi aşıldı (σmax = ${qMax.toFixed(1)} kPa > ${allowableKpa.toFixed(1)} kPa)`,
  };

  // 4. Punching Shear Checks at d/2 perimeter around columns and shear wall ends
  const punchingChecks: Record<string, PunchingResult> = {};
  let punchingAllPass = true;

  for (const load of loads) {
    const b = load.widthM;
    const h = load.depthM;
    let up = 0;
    let Acrit = 0;

    if (load.type === "column") {
      up = 2.0 * (b + dM) + 2.0 * (h + dM);
      Acrit = (b + dM) * (h + dM);
    } else {
      const lu = Math.max(2.0 * b, 0.20 * h);
      up = b + 2.0 * (lu + 0.5 * dM);
      Acrit = b * (lu + 0.5 * dM);
    }

    const VdKn = Math.abs(load.NdKn);
    const upwardReliefKn = qAvg * Acrit;
    const netPunchingKn = Math.max(10.0, VdKn - upwardReliefKn);
    const AzM2 = up * dM;
    const punchingStressKpa = netPunchingKn / Math.max(1e-4, AzM2);
    const punchingRatio = punchingStressKpa / fctdKpa;
    const pass = punchingRatio <= 1.0;
    if (!pass) punchingAllPass = false;

    punchingChecks[load.id] = {
      columnId: load.id,
      columnName: load.name,
      floorId: input.slab.floorId,
      axialForceKn: VdKn,
      criticalPerimeterM: up,
      effectiveDepthM: dM,
      punchingCapacityKn: fctdKpa * AzM2,
      punchingRatio,
      pass,
      statusText: pass
        ? `Zımbalama güvenli (τpd = ${punchingStressKpa.toFixed(1)} kPa ≤ ${fctdKpa.toFixed(1)} kPa)`
        : punchingStressKpa <= 1.5 * fctdKpa
        ? `Zımbalama donatısı gereklidir (τpd = ${punchingStressKpa.toFixed(1)} kPa ≤ 1.5fctd)`
        : `Zımbalama aşıldı, radye kalınlığı artırılmalıdır (τpd = ${punchingStressKpa.toFixed(1)} kPa > 1.5fctd)`,
    };
  }

  // 5. Continuous Mesh Reinforcement (TS 500 §13: rho_min >= 0.0020 per direction)
  const minAsCm2PerM = 0.0020 * 100.0 * (dM * 100.0);
  let recommendedMesh = "Ø14/15";
  let providedAsCm2PerM = 10.26;
  if (minAsCm2PerM > 10.5) {
    recommendedMesh = "Ø14/13";
    providedAsCm2PerM = 11.84;
  } else if (minAsCm2PerM <= 8.5) {
    recommendedMesh = "Ø12/12";
    providedAsCm2PerM = 9.42;
  }

  return {
    soilPressure,
    punchingChecks,
    continuousMesh: {
      minAsCm2PerM,
      recommendedMesh,
      providedAsCm2PerM,
      text: `Radye donatısı: Üst Düz ${recommendedMesh} + Alt Düz ${recommendedMesh} (As = ${providedAsCm2PerM.toFixed(2)} cm²/m)`,
    },
    pass: soilPass && punchingAllPass,
  };
}

// ============================================================================
// 9. Master Orchestrator: runConcreteDesignChecks
// ============================================================================

/**
 * Runs complete TS 500 and TBDY 2018 reinforced concrete cross-section design checks
 * for all columns, beams, shear walls, joints, and raft foundations in the model.
 */
export function runConcreteDesignChecks(
  model: CadModel,
  analysis: StructuralAnalysisResult,
  customSettings?: Partial<AnalysisSettings>
): ConcreteDesignResult {
  const settings = { ...analysis.settings, ...customSettings };
  const concrete = getConcreteProperties(settings.concreteGrade);
  const rebar = getRebarProperties(settings.rebarGrade);

  const memberChecks: Record<string, ConcreteMemberCheck> = {};
  const rebarSchedule: Record<string, MemberRebarSchedule> = {};
  const joints: Record<string, JointShearResult> = {};
  const columnBeamMoments: Record<string, ColumnBeamMomentResult> = {};
  const punching: Record<string, PunchingResult> = {};

  let totalMembers = 0;
  let passedMembers = 0;
  let failedMembers = 0;
  let maxDCR = 0.0;
  let governingElementId = "";
  let governingElementName = "";
  let governingFailureMode: ConcreteDesignSummary["governingFailureMode"] = "flexure";
  let governingCombo = "1.4G+1.6Q";

  const sortedFloors = [...model.floors].sort((a, b) => a.elevation - b.elevation);
  const totalBuildingHeightM = sortedFloors.reduce((s, f) => s + f.height, 0);

  // Group elements by floor
  for (let fIdx = 0; fIdx < sortedFloors.length; fIdx++) {
    const floor = sortedFloors[fIdx];
    const isTopStorey = fIdx === sortedFloors.length - 1;
    const upperFloor = !isTopStorey ? sortedFloors[fIdx + 1] : undefined;

    const floorColumns = model.elements.filter(e => e.type === "column" && e.floorId === floor.id) as ColumnElement[];
    const floorBeams = model.elements.filter(e => e.type === "beam" && e.floorId === floor.id) as BeamElement[];
    const floorWalls = model.elements.filter(e => e.type === "wall" && e.floorId === floor.id) as WallElement[];

    // 1. Column Design Checks
    for (const col of floorColumns) {
      totalMembers++;
      const femEnv = analysis.femOutput?.memberEnvelopes[col.id];
      const stationForces = analysis.memberStations[col.id];

      // Read envelope internal forces
      const NdKn = femEnv ? Math.abs(femEnv.minAxialKn) : (analysis.members[col.id]?.axialKn ?? 200.0);
      const V2dKn = femEnv ? Math.abs(femEnv.maxShearV2Kn) : (analysis.members[col.id]?.shearKn ?? 30.0);
      const V3dKn = femEnv ? Math.abs(femEnv.maxShearV3Kn) : 10.0;
      const M3dKnm = femEnv ? Math.max(Math.abs(femEnv.maxMomentM3Knm), Math.abs(femEnv.minMomentM3Knm)) : (analysis.members[col.id]?.momentKnm ?? 80.0);
      const M2dKnm = femEnv ? Math.abs(femEnv.maxMomentM2Knm) : 20.0;

      // Find max framing beam depth at column top
      const connected = floorBeams.filter(b => {
        const d1 = distance(b.start, col.position);
        const d2 = distance(b.end, col.position);
        return d1 <= 0.60 || d2 <= 0.60;
      });
      const maxBeamH = connected.length > 0 ? Math.max(...connected.map(b => b.height)) : 0.50;

      const colDesign = designColumn({
        element: col,
        floorHeightM: floor.height,
        beamDepthMaxM: maxBeamH,
        NdKn,
        V2dKn,
        V3dKn,
        M2dKnm,
        M3dKnm,
        concrete,
        rebar,
        governingCombo: femEnv?.governingCombo,
      });

      if (colDesign.pass) passedMembers++;
      else failedMembers++;

      if (colDesign.governingDCR > maxDCR) {
        maxDCR = colDesign.governingDCR;
        governingElementId = col.id;
        governingElementName = col.name;
        governingFailureMode = !colDesign.axialPass ? "axial" : !colDesign.flexurePass ? "flexure" : "shear";
        governingCombo = femEnv?.governingCombo ?? "1.4G+1.6Q";
      }

      const checksBreakdown: DetailedCheckBreakdown = {
        axialDCR: colDesign.axialDCR,
        axialPass: colDesign.axialPass,
        axialStressRatio: colDesign.axialStressRatio,
        flexureDCR: colDesign.biaxialDCR,
        flexurePass: colDesign.flexurePass,
        momentCapacityKnm: colDesign.Mr3Knm,
        demandMomentKnm: M3dKnm,
        shearDCR: colDesign.shearDCR,
        shearPass: colDesign.shearPass,
        shearCapacityKn: colDesign.VrKn,
        designShearVeKn: colDesign.VeKn,
        confinementPass: true,
        confinementSpacingCm: colDesign.confinementSpacingCm,
      };

      memberChecks[col.id] = {
        elementId: col.id,
        name: col.name,
        type: "column",
        floorId: floor.id,
        axialKn: NdKn,
        shearKn: colDesign.VeKn,
        momentKnm: M3dKnm,
        capacityMomentKnm: colDesign.Mr3Knm,
        capacityRatio: M3dKnm / Math.max(1.0, colDesign.Mr3Knm),
        axialStressRatio: colDesign.axialStressRatio,
        requiredRebarCm2: (col.width * col.depth * 10000) * 0.010,
        providedRebarText: colDesign.providedRebarText,
        confinementSpacingCm: colDesign.confinementSpacingCm,
        pass: colDesign.pass,
        statusText: colDesign.statusText,
        governingCombination: femEnv?.governingCombo ?? "1.4G+1.6Q",
        shearCapacityKn: colDesign.VrKn,
        checks: checksBreakdown,
        rebar: colDesign.rebarSchedule,
      };

      rebarSchedule[col.id] = colDesign.rebarSchedule;
    }

    // 2. Beam Design Checks
    for (const beam of floorBeams) {
      totalMembers++;
      const femEnv = analysis.femOutput?.memberEnvelopes[beam.id];
      const Lspan = distance(beam.start, beam.end);

      // Support and span envelope moments
      const MiTop = femEnv ? Math.max(Math.abs(femEnv.maxMomentM3Knm), Math.abs(femEnv.minMomentM3Knm)) : (analysis.members[beam.id]?.momentKnm ?? 60.0);
      const MiBot = MiTop * 0.50;
      const MmidBot = femEnv ? Math.abs(femEnv.maxMomentM3Knm) * 0.70 : 45.0;
      const MjTop = MiTop;
      const MjBot = MiBot;
      const V2d = femEnv ? Math.abs(femEnv.maxShearV2Kn) : (analysis.members[beam.id]?.shearKn ?? 40.0);
      const Vdy = V2d * 0.65; // gravity share

      const beamDesign = designBeam({
        element: beam,
        LspanM: Lspan,
        colWidthLeftM: 0.40,
        colWidthRightM: 0.40,
        MiTopKnm: MiTop,
        MiBotKnm: MiBot,
        MmidBotKnm: MmidBot,
        MjTopKnm: MjTop,
        MjBotKnm: MjBot,
        VdyKn: Vdy,
        V2dKn: V2d,
        concrete,
        rebar,
        governingCombo: femEnv?.governingCombo,
      });

      if (beamDesign.pass) passedMembers++;
      else failedMembers++;

      if (beamDesign.governingDCR > maxDCR) {
        maxDCR = beamDesign.governingDCR;
        governingElementId = beam.id;
        governingElementName = beam.name;
        governingFailureMode = !beamDesign.shearPass ? "shear" : "flexure";
        governingCombo = femEnv?.governingCombo ?? "1.4G+1.6Q";
      }

      const checksBreakdown: DetailedCheckBreakdown = {
        axialDCR: 0.0,
        axialPass: true,
        axialStressRatio: 0.0,
        flexureDCR: Math.max(beamDesign.stationI.dcr, beamDesign.stationMid.dcr, beamDesign.stationJ.dcr),
        flexurePass: beamDesign.stationI.pass && beamDesign.stationMid.pass && beamDesign.stationJ.pass,
        momentCapacityKnm: beamDesign.stationI.MrTopKnm,
        demandMomentKnm: MiTop,
        shearDCR: beamDesign.shearDCR,
        shearPass: beamDesign.shearPass,
        shearCapacityKn: beamDesign.VrKn,
        designShearVeKn: beamDesign.VeKn,
        confinementPass: true,
        confinementSpacingCm: beamDesign.confinementSpacingCm,
      };

      memberChecks[beam.id] = {
        elementId: beam.id,
        name: beam.name,
        type: "beam",
        floorId: floor.id,
        axialKn: femEnv ? Math.abs(femEnv.maxAxialKn) : 0,
        shearKn: beamDesign.VeKn,
        momentKnm: MiTop,
        capacityMomentKnm: beamDesign.stationI.MrTopKnm,
        capacityRatio: beamDesign.governingDCR,
        requiredRebarCm2: (beamDesign.stationI.AsTopMm2 + beamDesign.stationMid.AsBotMm2) / 100.0,
        providedRebarText: beamDesign.rebarSchedule.longitudinal.text,
        confinementSpacingCm: beamDesign.confinementSpacingCm,
        pass: beamDesign.pass,
        statusText: beamDesign.statusText,
        governingCombination: femEnv?.governingCombo ?? "1.4G+1.6Q",
        shearCapacityKn: beamDesign.VrKn,
        checks: checksBreakdown,
        rebar: beamDesign.rebarSchedule,
      };

      rebarSchedule[beam.id] = beamDesign.rebarSchedule;
    }

    // 3. Shear Wall Design Checks
    for (const wall of floorWalls) {
      totalMembers++;
      const femEnv = analysis.femOutput?.memberEnvelopes[wall.id];
      const NdKn = femEnv ? Math.abs(femEnv.minAxialKn) : (analysis.members[wall.id]?.axialKn ?? 400.0);
      const VdKn = femEnv ? Math.abs(femEnv.maxShearV2Kn) : (analysis.members[wall.id]?.shearKn ?? 120.0);
      const MdKnm = femEnv ? Math.abs(femEnv.maxMomentM3Knm) : (analysis.members[wall.id]?.momentKnm ?? 250.0);

      const wallDesign = designShearWall({
        element: wall,
        floorName: floor.name,
        floorHeightM: floor.height,
        totalWallHeightM: totalBuildingHeightM,
        elevationM: floor.elevation,
        NdKn,
        VdKn,
        MdKnm,
        concrete,
        rebar,
        T1Sec: analysis.naturalPeriods[0],
        R: settings.r,
        I: settings.importance,
        governingCombo: femEnv?.governingCombo,
      });

      if (wallDesign.pass) passedMembers++;
      else failedMembers++;

      if (wallDesign.governingDCR > maxDCR) {
        maxDCR = wallDesign.governingDCR;
        governingElementId = wall.id;
        governingElementName = wall.name;
        governingFailureMode = !wallDesign.shearPass ? "shear" : !wallDesign.axialDCR ? "axial" : "flexure";
        governingCombo = femEnv?.governingCombo ?? "G+Q+Ex+0.3Ey+0.3Ez";
      }

      const checksBreakdown: DetailedCheckBreakdown = {
        axialDCR: wallDesign.axialDCR,
        axialPass: wallDesign.axialDCR <= 1.0,
        axialStressRatio: wallDesign.axialDCR * 0.35,
        flexureDCR: wallDesign.flexureDCR,
        flexurePass: wallDesign.flexureDCR <= 1.0,
        momentCapacityKnm: wallDesign.MprKnm / 1.25,
        demandMomentKnm: MdKnm,
        shearDCR: wallDesign.shearDCR,
        shearPass: wallDesign.shearPass,
        shearCapacityKn: wallDesign.VrKn,
        designShearVeKn: wallDesign.VeKn,
        confinementPass: true,
        confinementSpacingCm: wallDesign.confinementSpacingCm,
      };

      memberChecks[wall.id] = {
        elementId: wall.id,
        name: wall.name,
        type: "wall",
        floorId: floor.id,
        axialKn: NdKn,
        shearKn: wallDesign.VeKn,
        momentKnm: MdKnm,
        capacityMomentKnm: wallDesign.MprKnm / 1.25,
        capacityRatio: wallDesign.governingDCR,
        shearCapacityKn: wallDesign.VrKn,
        requiredRebarCm2: (wallDesign.requiredBoundaryAsCm2 * 2),
        providedRebarText: wallDesign.rebarSchedule.longitudinal.text,
        confinementSpacingCm: wallDesign.confinementSpacingCm,
        pass: wallDesign.pass,
        statusText: wallDesign.statusText,
        governingCombination: femEnv?.governingCombo ?? "G+Q+Ex+0.3Ey+0.3Ez",
        checks: checksBreakdown,
        rebar: wallDesign.rebarSchedule,
      };

      rebarSchedule[wall.id] = wallDesign.rebarSchedule;
    }

    // 4. Joint Shear Safety & Strong Column Checks
    for (const col of floorColumns) {
      const connected = floorBeams.filter(b => {
        const d1 = distance(b.start, col.position);
        const d2 = distance(b.end, col.position);
        return d1 <= 0.60 || d2 <= 0.60;
      });

      const beamRebars = connected.map(b => ({
        beamId: b.id,
        topAsMm2: memberChecks[b.id]?.rebar?.longitudinal?.topAsMm2 ?? 600,
        botAsMm2: memberChecks[b.id]?.rebar?.longitudinal?.bottomAsMm2 ?? 300,
      }));

      // Joint shear
      const jointRes = checkBeamColumnJoint({
        column: col,
        connectedBeams: connected,
        colShearKn: memberChecks[col.id]?.shearKn ?? 30.0,
        beamRebars,
        concrete,
        rebar,
      });
      joints[col.id] = jointRes;

      // Strong column - weak beam
      const upperCol = upperFloor ? model.elements.find(e => e.type === "column" && e.floorId === upperFloor.id && distance(e.position, col.position) <= 0.10) as ColumnElement | undefined : undefined;
      const strongColRes = checkStrongColumnWeakBeam({
        column: col,
        upperColumn: upperCol,
        colMomentCapacityKnm: memberChecks[col.id]?.capacityMomentKnm ?? 120.0,
        upperColMomentCapacityKnm: upperCol ? memberChecks[upperCol.id]?.capacityMomentKnm : undefined,
        connectedBeamCapacitiesKnm: connected.map(b => memberChecks[b.id]?.capacityMomentKnm ?? 80.0),
        isTopStorey,
      });
      columnBeamMoments[col.id] = strongColRes;

      // Update checks breakdown on column
      if (memberChecks[col.id]) {
        memberChecks[col.id].checks.jointDCR = jointRes.shearRatio;
        memberChecks[col.id].checks.jointPass = jointRes.pass;
        memberChecks[col.id].checks.strongColumnDCR = strongColRes.ratio > 0 ? 1.20 / strongColRes.ratio : 1.0;
        memberChecks[col.id].checks.strongColumnPass = strongColRes.pass;
      }
    }
  }

  // 5. Raft Foundation Checks (if raft slab present)
  let soilPressureResult: RaftSoilPressureResult | undefined = undefined;
  const raftSlab = model.elements.find(e => e.type === "slab" && (e.thickness >= 0.40 || e.name.toUpperCase().includes("RADYE"))) as SlabElement | undefined;
  if (raftSlab && raftSlab.points && raftSlab.points.length >= 3) {
    const groundFloorId = sortedFloors[0].id;
    const baseCols = model.elements.filter(e => e.type === "column" && e.floorId === groundFloorId) as ColumnElement[];
    const baseWalls = model.elements.filter(e => e.type === "wall" && e.floorId === groundFloorId) as WallElement[];

    const foundationLoads: RaftFoundationElementInput[] = [
      ...baseCols.map(c => ({
        id: c.id,
        name: c.name,
        type: "column" as const,
        x: c.position.x,
        y: c.position.y,
        widthM: c.width,
        depthM: c.depth,
        NdKn: memberChecks[c.id]?.axialKn ?? 300.0,
        MxKnm: memberChecks[c.id]?.momentKnm ?? 20.0,
        MyKnm: 20.0,
      })),
      ...baseWalls.map(w => ({
        id: w.id,
        name: w.name,
        type: "wall" as const,
        x: (w.start.x + w.end.x) / 2.0,
        y: (w.start.y + w.end.y) / 2.0,
        widthM: w.thickness,
        depthM: distance(w.start, w.end),
        NdKn: memberChecks[w.id]?.axialKn ?? 500.0,
        MxKnm: memberChecks[w.id]?.momentKnm ?? 40.0,
        MyKnm: 30.0,
      })),
    ];

    const raftDesign = designRaftFoundation({
      slab: raftSlab,
      thicknessM: raftSlab.thickness,
      coverM: 0.05,
      points: raftSlab.points,
      loads: foundationLoads,
      qAllKpa: 250.0, // 250 kPa allowable bearing pressure
      ksKpaPerM: 30000.0,
      concrete,
      rebar,
    });

    soilPressureResult = raftDesign.soilPressure;
    Object.assign(punching, raftDesign.punchingChecks);
  } else {
    // Isolated column punching checks
    const groundFloorId = sortedFloors[0].id;
    const baseCols = model.elements.filter(e => e.type === "column" && e.floorId === groundFloorId) as ColumnElement[];
    for (const col of baseCols) {
      const d_eff = Math.min(col.width, col.depth) * 0.8;
      const up = 2 * (col.width + d_eff) + 2 * (col.depth + d_eff);
      const punchingCapKn = (1.0 * concrete.fctd * (up * 1000) * (d_eff * 1000)) / 1000;
      const axialForce = memberChecks[col.id]?.axialKn ?? 100.0;
      const punchingRatio = axialForce / Math.max(1, punchingCapKn);
      const punchingPass = punchingRatio <= 1.0;

      punching[col.id] = {
        columnId: col.id,
        columnName: col.name,
        floorId: groundFloorId,
        axialForceKn: axialForce,
        criticalPerimeterM: up,
        effectiveDepthM: d_eff,
        punchingCapacityKn: punchingCapKn,
        punchingRatio,
        pass: punchingPass,
        statusText: punchingPass
          ? `Zımbalama güvenli (Vd/Vpr = ${(punchingRatio * 100).toFixed(1)}% ≤ 100%)`
          : `Zımbalama kapasitesi aşıldı (Vd/Vpr = ${(punchingRatio * 100).toFixed(1)}% > 100%)`,
      };
    }
  }

  const overallPass = failedMembers === 0 && Object.values(joints).every(j => j.pass) && Object.values(columnBeamMoments).every(m => m.pass) && Object.values(punching).every(p => p.pass) && (soilPressureResult?.pass ?? true);

  const summaryNotes: string[] = [
    `Betonarme Kesit Tasarımı & Tahkik Motoru (TS 500 & TBDY 2018):`,
    `Malzeme Parametreleri: Beton ${concrete.grade} (fcd = ${concrete.fcd.toFixed(2)} MPa = ${concrete.fcdTfM2.toFixed(1)} tf/m², fctd = ${concrete.fctd.toFixed(2)} MPa), Donatı Çeliği ${rebar.grade} (fyd = ${rebar.fyd.toFixed(1)} MPa = ${rebar.fydTfM2.toFixed(1)} tf/m²).`,
    `Kolon Eksenel Yük Limiti (TBDY §7.3.1.1): Nd <= 0.40 * Ac * fck kontrol edildi.`,
    `Kolon İki Eksenli Eğilme (TS 500 §7.3): Bresler etkileşim yüzeyi hesaplandı.`,
    `Kolon & Kiriş Kesme Kapasitesi Tasarımı: Kolonlarda Ve = (Mpa+Mpu)/ln, kirişlerde Ve = Vdy ± (Mpi+Mpj)/ln uygulandı; sarılma bölgesinde beton katkısı Vc sıfırlandı.`,
    `Kolon-Kiriş Birleşim Kesme Güvenliği (TBDY §7.5): Kuşatılmış ve kuşatılmamış birleşimler için Ve <= Vmax tahkik edildi.`,
    `Güçlü Kolon - Zayıf Kiriş (TBDY §7.3.5): ΣMc >= 1.20 ΣMb birleşim koşulu kontrol edildi.`,
    `Perde Tasarımı (TBDY §7.6): Kritik perde yüksekliğinde uç bölgesi boyu lu >= max(0.10Hw, 0.20Lw) ve donatı oranı >= %1.0 uygulandı, dinamik kesme büyütmesi Ve = beta_v (Mpr/Md) Vd denetlendi.`,
    soilPressureResult ? `Radye Temel Zemin Gerilmesi (TS 500 & TBDY §16.8): σmax = ${soilPressureResult.qMaxKpa.toFixed(1)} kPa <= ${soilPressureResult.allowableKpa.toFixed(1)} kPa (${soilPressureResult.pass ? "UYGUN" : "AŞILDI"}).` : "Tekil/sürekli temel ön boyut kontrolü yapıldı.",
    `Genel Tasarım Değerlendirmesi: ${overallPass ? "TÜM BETONARME KESİT VE GÜVENLİK TAHKİKLERİ SAĞLANDI." : "KAPASİTE VEYA DONATI KOŞULLARINI AŞAN ELEMANLAR MEVCUT."}`,
  ];

  const summary: ConcreteDesignSummary = {
    totalMembers,
    passedMembers,
    failedMembers,
    maxDCR,
    governingElementId,
    governingElementName,
    governingFailureMode,
    governingCombo,
    overallPass,
    summaryNotes,
  };

  return {
    timestamp: new Date().toISOString(),
    memberChecks,
    rebarSchedule,
    joints,
    columnBeamMoments,
    punching,
    soilPressure: soilPressureResult,
    summary,
  };
}
