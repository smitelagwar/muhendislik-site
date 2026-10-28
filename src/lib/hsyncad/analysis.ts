import type { CadModel, Floor, ColumnElement, BeamElement, WallElement, SlabElement } from "./model";
import { polygonArea, distance } from "./geometry";

export interface AnalysisSettings {
  concreteGrade: "C25" | "C30" | "C35" | "C40";
  rebarGrade: "B420C" | "B500C";
  sds: number;
  sd1: number;
  r: number;
  importance: number;
  liveLoadParticipation: number;
  driftLimit: number;
}

export const DEFAULT_ANALYSIS_SETTINGS: AnalysisSettings = {
  concreteGrade: "C30",
  rebarGrade: "B420C",
  sds: 1.0,
  sd1: 0.40,
  r: 8.0,
  importance: 1.0,
  liveLoadParticipation: 0.30,
  driftLimit: 0.008,
};

const CONCRETE_PROPERTIES = {
  C25: { fck: 25, fcd: 16.67, fctd: 1.20, E: 30000 },
  C30: { fck: 30, fcd: 20.00, fctd: 1.30, E: 32000 },
  C35: { fck: 35, fcd: 23.33, fctd: 1.40, E: 33000 },
  C40: { fck: 40, fcd: 26.67, fctd: 1.50, E: 34000 },
} as const;

const REBAR_PROPERTIES = {
  B420C: { fyk: 420, fyd: 365.2 },
  B500C: { fyk: 500, fyd: 434.8 },
} as const;

export interface StoreyAnalysisResult {
  floorId: string;
  name: string;
  elevation: number;
  height: number;
  deadWeightKn: number;
  liveWeightKn: number;
  totalWeightKn: number;
  lateralForceKn: number;
  shearForceKn: number;
  stiffnessKnPerM: number;
  driftM: number;
  driftRatio: number;
  driftPass: boolean;
}

export interface MemberForceResult {
  elementId: string;
  name: string;
  type: "column" | "beam" | "wall";
  floorId: string;
  axialKn: number;
  shearKn: number;
  momentKnm: number;
  capacityMomentKnm: number;
  capacityRatio: number;
  axialStressRatio?: number;
  requiredRebarCm2: number;
  providedRebarText: string;
  confinementSpacingCm: number;
  pass: boolean;
  statusText: string;
}

export interface AnalysisResult {
  timestamp: string;
  settings: AnalysisSettings;
  totalWeightKn: number;
  totalHeightM: number;
  periodSec: number;
  spectralAccelerationSa: number;
  baseShearKn: number;
  minBaseShearKn: number;
  isMinBaseShearControlled: boolean;
  storeys: StoreyAnalysisResult[];
  members: Record<string, MemberForceResult>;
  overallPass: boolean;
  maxDriftRatio: number;
  maxCapacityRatio: number;
  summaryNotes: string[];
}

export function runStructuralAnalysis(model: CadModel, customSettings?: Partial<AnalysisSettings>): AnalysisResult {
  const settings: AnalysisSettings = { ...DEFAULT_ANALYSIS_SETTINGS, ...customSettings };
  const concrete = CONCRETE_PROPERTIES[settings.concreteGrade] ?? CONCRETE_PROPERTIES.C30;
  const rebar = REBAR_PROPERTIES[settings.rebarGrade] ?? REBAR_PROPERTIES.B420C;
  const densityKnM3 = 25.0; // Reinforced concrete unit weight in kN/m³

  const sortedFloors = [...model.floors].sort((a, b) => a.elevation - b.elevation);
  const totalHeightM = sortedFloors.reduce((sum, f) => sum + f.height, 0);

  // 1. Calculate weights per floor
  const floorWeights = new Map<string, { dead: number; live: number }>();
  for (const floor of sortedFloors) {
    floorWeights.set(floor.id, { dead: 0, live: 0 });
  }

  for (const el of model.elements) {
    const weights = floorWeights.get(el.floorId);
    if (!weights) continue;

    if (el.type === "slab") {
      const slab = el as SlabElement;
      const area = polygonArea(slab.points);
      const slabDead = area * slab.thickness * densityKnM3 + area * (slab.finishLoad ?? 1.5);
      const slabLive = area * (slab.liveLoad ?? 2.0);
      weights.dead += slabDead;
      weights.live += slabLive;
    } else if (el.type === "beam") {
      const beam = el as BeamElement;
      const length = distance(beam.start, beam.end);
      const beamDead = length * beam.width * beam.height * densityKnM3;
      weights.dead += beamDead;
    } else if (el.type === "column") {
      const col = el as ColumnElement;
      const colDead = (col.width * col.depth * col.height) * densityKnM3;
      weights.dead += colDead;
    } else if (el.type === "wall") {
      const wall = el as WallElement;
      const length = distance(wall.start, wall.end);
      const wallDead = length * wall.thickness * wall.height * densityKnM3;
      weights.dead += wallDead;
    }
  }

  // Calculate building seismic weight W = \sum (G + n*Q)
  let totalBuildingWeightKn = 0;
  const storeySeismicWeights: { floor: Floor; weightKn: number; deadKn: number; liveKn: number }[] = [];

  for (const floor of sortedFloors) {
    const w = floorWeights.get(floor.id) ?? { dead: 0, live: 0 };
    // At least a minimal representative weight if empty floor
    const deadKn = Math.max(w.dead, 10.0);
    const liveKn = Math.max(w.live, 2.0);
    const seismicWeight = deadKn + settings.liveLoadParticipation * liveKn;
    storeySeismicWeights.push({ floor, weightKn: seismicWeight, deadKn, liveKn });
    totalBuildingWeightKn += seismicWeight;
  }

  // 2. Fundamental period T_1 (TBDY 2018 §4.7.1 empirical formula T_1 = Ct * H_N^(3/4))
  const Ct = 0.07; // RC frame factor
  const periodSec = Math.max(0.1, Ct * Math.pow(Math.max(1, totalHeightM), 0.75));

  // Spectral acceleration Sa(T_1) per TBDY 2018 §2.3.4
  const TA = 0.2 * (settings.sd1 / settings.sds);
  const TB = settings.sd1 / settings.sds;
  let spectralAccelerationSa = settings.sds;
  if (periodSec > TB) {
    spectralAccelerationSa = settings.sd1 / periodSec;
  } else if (periodSec < TA) {
    spectralAccelerationSa = (0.4 + 0.6 * (periodSec / TA)) * settings.sds;
  }

  // Base shear Vt = (W * Sa) / (R / I) >= 0.04 * W * I * Sds
  const rawBaseShearKn = (totalBuildingWeightKn * spectralAccelerationSa) / (settings.r / settings.importance);
  const minBaseShearKn = 0.04 * totalBuildingWeightKn * settings.importance * settings.sds;
  const baseShearKn = Math.max(rawBaseShearKn, minBaseShearKn);
  const isMinBaseShearControlled = minBaseShearKn > rawBaseShearKn;

  // 3. Distribute base shear to storeys: F_i = Vt * (w_i * H_i) / \sum(w_j * H_j)
  let sumWeightHeight = 0;
  let currentCumulativeHeight = 0;
  const floorHeightsFromBase: number[] = [];

  for (const sw of storeySeismicWeights) {
    currentCumulativeHeight += sw.floor.height;
    floorHeightsFromBase.push(currentCumulativeHeight);
    sumWeightHeight += sw.weightKn * currentCumulativeHeight;
  }
  if (sumWeightHeight < 1e-4) sumWeightHeight = 1.0;

  // Lateral stiffness per storey based on columns and walls
  const storeys: StoreyAnalysisResult[] = [];
  let cumulativeShearKn = 0;

  // Calculate top-to-bottom for shears
  const lateralForcesKn = storeySeismicWeights.map((sw, i) => {
    return (baseShearKn * (sw.weightKn * floorHeightsFromBase[i])) / sumWeightHeight;
  });

  const memberResults: Record<string, MemberForceResult> = {};
  let overallPass = true;
  let maxDriftRatio = 0;
  let maxCapacityRatio = 0;

  for (let i = sortedFloors.length - 1; i >= 0; i--) {
    const sw = storeySeismicWeights[i];
    const floor = sw.floor;
    const forceKn = lateralForcesKn[i];
    cumulativeShearKn += forceKn;

    // Calculate columns and walls on this floor
    const floorColumns = model.elements.filter(e => e.type === "column" && e.floorId === floor.id) as ColumnElement[];
    const floorWalls = model.elements.filter(e => e.type === "wall" && e.floorId === floor.id) as WallElement[];
    const floorBeams = model.elements.filter(e => e.type === "beam" && e.floorId === floor.id) as BeamElement[];

    // Column and wall stiffness sum: K = \sum (12 * E * I / h^3) in kN/m
    let totalStiffness = 0;
    const memberStiffnesses = new Map<string, number>();

    for (const col of floorColumns) {
      // I_x = b * h^3 / 12, I_y = h * b^3 / 12 (convert m to kN/m)
      const h_col = col.height || floor.height;
      const b = col.width, d = col.depth;
      const I_avg = (b * Math.pow(d, 3) + d * Math.pow(b, 3)) / 24;
      const k_col = (12 * (concrete.E * 1000) * I_avg) / Math.pow(h_col, 3);
      memberStiffnesses.set(col.id, k_col);
      totalStiffness += k_col;
    }

    for (const wall of floorWalls) {
      const h_wall = wall.height || floor.height;
      const L_w = distance(wall.start, wall.end);
      const t_w = wall.thickness;
      const I_wall = (t_w * Math.pow(L_w, 3)) / 12;
      const k_wall = (12 * (concrete.E * 1000) * I_wall) / Math.pow(h_wall, 3);
      memberStiffnesses.set(wall.id, k_wall);
      totalStiffness += k_wall;
    }

    if (totalStiffness < 1) totalStiffness = 1000.0; // fallback minimal stiffness

    // Storey drift \Delta_i = V_i / K_storey
    const storeyDriftM = cumulativeShearKn / totalStiffness;
    const effectiveDriftRatio = (settings.r / settings.importance) * (storeyDriftM / floor.height);
    const driftPass = effectiveDriftRatio <= settings.driftLimit;
    if (!driftPass) overallPass = false;
    if (effectiveDriftRatio > maxDriftRatio) maxDriftRatio = effectiveDriftRatio;

    storeys.unshift({
      floorId: floor.id,
      name: floor.name,
      elevation: floor.elevation,
      height: floor.height,
      deadWeightKn: sw.deadKn,
      liveWeightKn: sw.liveKn,
      totalWeightKn: sw.weightKn,
      lateralForceKn: forceKn,
      shearForceKn: cumulativeShearKn,
      stiffnessKnPerM: totalStiffness,
      driftM: storeyDriftM,
      driftRatio: effectiveDriftRatio,
      driftPass,
    });

    // 4. Calculate member internal forces and check capacities
    const tributaryLoadPerCol = (sw.deadKn * 1.4 + sw.liveKn * 1.6) / Math.max(1, floorColumns.length);

    for (const col of floorColumns) {
      const k_col = memberStiffnesses.get(col.id) ?? (totalStiffness / Math.max(1, floorColumns.length));
      const colShearKn = cumulativeShearKn * (k_col / totalStiffness);
      const h_col = col.height || floor.height;
      const colMomentKnm = colShearKn * (h_col / 2);
      const axialKn = tributaryLoadPerCol;

      // Axial stress ratio: nu = Nd / (Ac * fcd) <= 0.40 (TBDY 2018 §7.3.1.1)
      const AcM2 = col.width * col.depth;
      const AcMm2 = AcM2 * 1e6;
      const axialStressRatio = (axialKn * 1000) / (AcMm2 * concrete.fcd);

      // Flexural capacity Mr approx = 0.85 * fcd * b * d^2 + 0.9 * fyd * As * d
      // Assuming initial 1% rebar rho = 0.01
      const As_min = 0.01 * AcMm2;
      const d_eff = Math.max(col.width, col.depth) * 1000 - 40; // 40mm cover
      const capacityMomentKnm = (0.20 * concrete.fcd * col.width * 1000 * Math.pow(d_eff, 2) + 0.9 * rebar.fyd * As_min * d_eff) / 1e6;
      const capacityRatio = colMomentKnm / Math.max(1, capacityMomentKnm);
      if (capacityRatio > maxCapacityRatio) maxCapacityRatio = capacityRatio;

      const axialPass = axialStressRatio <= 0.40;
      const flexPass = capacityRatio <= 1.0;
      const colPass = axialPass && flexPass;
      if (!colPass) overallPass = false;

      // Rebar requirement: min 1% per TBDY 2018
      const reqRebarCm2 = (As_min / 100);
      const barCount = Math.max(4, Math.ceil(reqRebarCm2 / 2.01)); // using phi 16 (2.01 cm²)
      const rebarText = `${barCount}Φ16 (As = ${(barCount * 2.01).toFixed(1)} cm²)`;
      const confinementSpacingCm = Math.min(10, Math.floor((Math.min(col.width, col.depth) * 100) / 3));

      memberResults[col.id] = {
        elementId: col.id,
        name: col.name,
        type: "column",
        floorId: floor.id,
        axialKn,
        shearKn: colShearKn,
        momentKnm: colMomentKnm,
        capacityMomentKnm,
        capacityRatio,
        axialStressRatio,
        requiredRebarCm2: reqRebarCm2,
        providedRebarText: rebarText,
        confinementSpacingCm,
        pass: colPass,
        statusText: !axialPass
          ? `Eksenel yük limiti aşıldı (Nd/(Ac*fcd) = ${(axialStressRatio * 100).toFixed(1)}% > 40%)`
          : !flexPass
          ? `Moment kapasitesi aşıldı (Md/Mr = ${(capacityRatio * 100).toFixed(1)}%)`
          : `Uygun (Kapasite: ${(capacityRatio * 100).toFixed(1)}%)`,
      };
    }

    // Beams on this floor
    for (const beam of floorBeams) {
      const L = distance(beam.start, beam.end);
      const qDesignKnM = (sw.deadKn * 1.4 + sw.liveKn * 1.6) / Math.max(1, floorBeams.length * 4); // distributed load estimate
      const supportMomentKnm = (qDesignKnM * Math.pow(L, 2)) / 8 + 15.0; // gravity + seismic envelope
      const beamShearKn = (qDesignKnM * L) / 2 + 20.0;

      const d_eff = beam.height * 1000 - 40;
      const bw = beam.width * 1000;
      // As_req for span moment: M / (0.9 * d * fyd)
      const AsReqMm2 = (supportMomentKnm * 1e6) / (0.9 * d_eff * rebar.fyd);
      const AsMinMm2 = Math.max(0.8 * (concrete.fctd / rebar.fyk) * bw * d_eff, 0.002 * bw * d_eff);
      const finalAsMm2 = Math.max(AsReqMm2, AsMinMm2);
      const capacityMomentKnm = (0.9 * rebar.fyd * finalAsMm2 * d_eff) / 1e6;
      const capacityRatio = supportMomentKnm / Math.max(1, capacityMomentKnm);
      if (capacityRatio > maxCapacityRatio) maxCapacityRatio = capacityRatio;

      const beamPass = capacityRatio <= 1.0;
      if (!beamPass) overallPass = false;

      const barCount = Math.max(3, Math.ceil(finalAsMm2 / 154)); // using phi 14 (1.54 cm²)
      const rebarText = `${barCount}Φ14 (As = ${(barCount * 1.54).toFixed(1)} cm²)`;

      memberResults[beam.id] = {
        elementId: beam.id,
        name: beam.name,
        type: "beam",
        floorId: floor.id,
        axialKn: 0,
        shearKn: beamShearKn,
        momentKnm: supportMomentKnm,
        capacityMomentKnm,
        capacityRatio,
        requiredRebarCm2: finalAsMm2 / 100,
        providedRebarText: rebarText,
        confinementSpacingCm: Math.min(10, Math.floor((beam.height * 100) / 4)),
        pass: beamPass,
        statusText: beamPass
          ? `Uygun (Kapasite: ${(capacityRatio * 100).toFixed(1)}%)`
          : `Moment kapasitesi aşıldı (Md/Mr = ${(capacityRatio * 100).toFixed(1)}%)`,
      };
    }
  }

  const summaryNotes: string[] = [
    `TBDY 2018 Eşdeğer Deprem Yükü Analizi tamamlandı.`,
    `Bina Toplam Ağırlığı: ${totalBuildingWeightKn.toFixed(1)} kN (${(totalBuildingWeightKn / 9.81).toFixed(1)} ton).`,
    `Temel Periyot T1 = ${periodSec.toFixed(3)} s, Tasarım Taban Kesme Kuvveti Vt = ${baseShearKn.toFixed(1)} kN.`,
    isMinBaseShearControlled ? "Minimum taban kesme kontrolü (0.04*W*I*Sds) etkin oldu." : "Spektral taban kesme kuvveti kullanıldı.",
    `Maksimum Göreli Kat Ötelemesi: ${(maxDriftRatio * 100).toFixed(3)}% (Limit: ${(settings.driftLimit * 100).toFixed(2)}% - ${maxDriftRatio <= settings.driftLimit ? "UYGUN" : "AŞILDI"}).`,
    `Tasarım sonucu: Yapı genelinde ${overallPass ? "TÜM KONTROLLER SAĞLANDI" : "BAZI ELEMANLARDA KAPASİTE AŞIMI VAR"}.`,
  ];

  return {
    timestamp: new Date().toISOString(),
    settings,
    totalWeightKn: totalBuildingWeightKn,
    totalHeightM,
    periodSec,
    spectralAccelerationSa,
    baseShearKn,
    minBaseShearKn,
    isMinBaseShearControlled,
    storeys,
    members: memberResults,
    overallPass,
    maxDriftRatio,
    maxCapacityRatio,
    summaryNotes,
  };
}
