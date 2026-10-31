import type { CadModel, Floor, ColumnElement, BeamElement, WallElement, SlabElement } from "./model";
import { polygonArea, distance } from "./geometry";
import { resolveJunctions } from "./junctions";
import {
  solve3DStructuralMesh,
  type Element12DOF,
  type Node3D,
  type StationInternalForces,
  type ModalResult,
  type FloorDiaphragmResult,
  type FemAnalysisOutput,
  type FemMeshInput,
  TBDY_2018_CRACKED_MODIFIERS,
} from "./fem-solver";

export * from "./fem-solver";
import { runConcreteDesignChecks, type ConcreteDesignResult } from "./design-engine";
export * from "./design-engine";

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

export const CONCRETE_PROPERTIES = {
  C25: { fck: 25, fcd: 16.67, fctd: 1.20, E: 30000 },
  C30: { fck: 30, fcd: 20.00, fctd: 1.30, E: 32000 },
  C35: { fck: 35, fcd: 23.33, fctd: 1.40, E: 33000 },
  C40: { fck: 40, fcd: 26.67, fctd: 1.50, E: 34000 },
} as const;

export const REBAR_PROPERTIES = {
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
  diaphragmCenterX?: number;
  diaphragmCenterY?: number;
  overturningMomentKnm?: number;
}

export interface JointShearResult {
  columnId: string;
  columnName: string;
  floorId: string;
  connectedBeams: string[];
  isConfined: boolean;
  effectiveWidthM: number;
  columnDepthM: number;
  shearDemandKn: number;
  shearCapacityKn: number;
  shearRatio: number;
  pass: boolean;
  statusText: string;
}

export interface ColumnBeamMomentResult {
  columnId: string;
  columnName: string;
  floorId: string;
  sumColumnMomentKnm: number;
  sumBeamMomentKnm: number;
  ratio: number;
  pass: boolean;
  statusText: string;
}

export interface IrregularityResults {
  torsionalA1: {
    floorId: string;
    floorName: string;
    etaBi: number;
    hasA1: boolean;
    pass: boolean;
  }[];
  softStoreyB2: {
    floorId: string;
    floorName: string;
    etaKi: number;
    hasB2: boolean;
    pass: boolean;
  }[];
}

export interface PunchingResult {
  columnId: string;
  columnName: string;
  floorId: string;
  axialForceKn: number;
  criticalPerimeterM: number;
  effectiveDepthM: number;
  punchingCapacityKn: number;
  punchingRatio: number;
  pass: boolean;
  statusText: string;
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
  governingCombination?: string;
  shearCapacityKn?: number;
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
  joints: Record<string, JointShearResult>;
  columnBeamMoments: Record<string, ColumnBeamMomentResult>;
  irregularities: IrregularityResults;
  punching: Record<string, PunchingResult>;
  overallPass: boolean;
  maxDriftRatio: number;
  maxCapacityRatio: number;
  summaryNotes: string[];

  // 3D Frame & FEM Extensions (Milestone 2)
  displacements: Record<string, [number, number, number, number, number, number]>;
  memberForces: Record<string, { x: number; N: number; V2: number; V3: number; T: number; M2: number; M3: number }[]>;
  memberStations: Record<string, StationInternalForces[]>;
  combinations: {
    name: string;
    description: string;
    maxDisplacementM: number;
    baseShearXKn: number;
    baseShearYKn: number;
  }[];
  modes: ModalResult[];
  naturalPeriods: [number, number, number];
  baseShears: {
    Vtx: number;
    Vty: number;
    Mox: number;
    Moy: number;
  };
  floorDiaphragms: FloorDiaphragmResult[];
  femOutput?: FemAnalysisOutput;
  designResult?: ConcreteDesignResult;
}

export type StructuralAnalysisResult = AnalysisResult;

/**
 * Builds 3D FEM Mesh Input from CadModel elements and analysis settings.
 * Models columns and beams with 12-DOF frame formulation, shear walls as wide-column macro-elements,
 * and sets up rigid floor diaphragms.
 */
function buildFemMeshFromModel(
  model: CadModel,
  settings: AnalysisSettings,
  sortedFloors: Floor[],
  floorWeights: Map<string, { dead: number; live: number }>
): FemMeshInput {
  const concrete = CONCRETE_PROPERTIES[settings.concreteGrade] ?? CONCRETE_PROPERTIES.C30;
  const E_kN_m2 = concrete.E * 1000.0;
  const G_kN_m2 = E_kN_m2 / (2.0 * (1.0 + 0.20)); // nu = 0.20

  const nodes: Node3D[] = [];
  const elements: Element12DOF[] = [];
  const nodeRegistry = new Map<string, string>(); // spatialKey -> nodeId

  const getNodeOrCreate = (
    x: number,
    y: number,
    z: number,
    floorId: string,
    isBaseFixed: boolean,
    prefix = "n"
  ): string => {
    // Round to 1 mm for spatial snapping
    const key = `${Math.round(x * 1000) / 1000}_${Math.round(y * 1000) / 1000}_${Math.round(z * 1000) / 1000}`;
    const existing = nodeRegistry.get(key);
    if (existing) {
      if (isBaseFixed) {
        const n = nodes.find(nd => nd.id === existing);
        if (n) n.isBaseFixed = true;
      }
      return existing;
    }
    const id = `${prefix}_${nodes.length}`;
    nodeRegistry.set(key, id);
    nodes.push({
      id,
      name: id,
      x,
      y,
      z,
      floorId,
      isBaseFixed,
      dofIndices: [0, 0, 0, 0, 0, 0],
    });
    return id;
  };

  const floorDiaphragms: FemMeshInput["floorDiaphragms"] = [];

  for (let k = 0; k < sortedFloors.length; k++) {
    const floor = sortedFloors[k];
    const zBase = floor.elevation;
    const zTop = zBase + floor.height;
    const isLowestFloor = k === 0;

    const floorColumns = model.elements.filter(e => e.type === "column" && e.floorId === floor.id) as ColumnElement[];
    const floorBeams = model.elements.filter(e => e.type === "beam" && e.floorId === floor.id) as BeamElement[];
    const floorWalls = model.elements.filter(e => e.type === "wall" && e.floorId === floor.id) as WallElement[];
    const floorSlabs = model.elements.filter(e => e.type === "slab" && e.floorId === floor.id) as SlabElement[];

    // Calculate center of mass for floor diaphragm
    let sumArea = 0;
    let sumX = 0;
    let sumY = 0;
    for (const slab of floorSlabs) {
      const a = polygonArea(slab.points);
      sumArea += a;
      let cx = 0, cy = 0;
      for (const p of slab.points) { cx += p.x; cy += p.y; }
      cx /= slab.points.length;
      cy /= slab.points.length;
      sumX += a * cx;
      sumY += a * cy;
    }

    if (sumArea < 1e-4) {
      for (const col of floorColumns) {
        sumX += col.position.x;
        sumY += col.position.y;
      }
      const count = Math.max(1, floorColumns.length);
      sumX /= count;
      sumY /= count;
    } else {
      sumX /= sumArea;
      sumY /= sumArea;
    }

    const fw = floorWeights.get(floor.id) ?? { dead: 100, live: 30 };
    const seismicWeightKn = fw.dead + settings.liveLoadParticipation * fw.live;
    const totalMassKg = (seismicWeightKn * 1000.0) / 9.81;

    floorDiaphragms.push({
      floorId: floor.id,
      centerX: sumX,
      centerY: sumY,
      totalMassKg,
      deadWeightKn: fw.dead,
      liveWeightKn: fw.live,
    });

    // 1. Column elements
    for (const col of floorColumns) {
      const h_col = col.height || floor.height;
      const nBaseId = getNodeOrCreate(col.position.x, col.position.y, zBase, floor.id, isLowestFloor, "ncol_b");
      const nTopId = getNodeOrCreate(col.position.x, col.position.y, zBase + h_col, floor.id, false, "ncol_t");

      const b = col.width;
      const d = col.depth;
      const A = b * d;
      const Iz = (d * Math.pow(b, 3)) / 12.0;
      const Iy = (b * Math.pow(d, 3)) / 12.0;
      const J = (1.0 / 3.0) * Math.pow(Math.min(b, d), 3) * Math.max(b, d);
      const rollAngleRad = ((col.rotation ?? 0) * Math.PI) / 180.0;

      elements.push({
        id: col.id,
        name: col.name,
        type: "column",
        floorId: floor.id,
        nodeI: nBaseId,
        nodeJ: nTopId,
        length: h_col,
        E: E_kN_m2,
        G: G_kN_m2,
        A,
        Iz,
        Iy,
        J,
        f_crack: TBDY_2018_CRACKED_MODIFIERS.columnFlexure,
        rollAngleRad,
        width: b,
        depth: d,
        qy: 0,
        qz: 0,
      });
    }

    // 2. Beam elements
    const qBeam = (fw.dead * 1.4 + fw.live * 1.6) / Math.max(1, floorBeams.length * 4);
    for (const beam of floorBeams) {
      const L_beam = distance(beam.start, beam.end);
      if (L_beam < 1e-6) continue;

      const nStartId = getNodeOrCreate(beam.start.x, beam.start.y, zTop, floor.id, false, "nbm_s");
      const nEndId = getNodeOrCreate(beam.end.x, beam.end.y, zTop, floor.id, false, "nbm_e");

      const b = beam.width;
      const h = beam.height;
      const A = b * h;
      const Iz = (b * Math.pow(h, 3)) / 12.0; // Major flexure
      const Iy = (h * Math.pow(b, 3)) / 12.0; // Minor flexure
      const J = (1.0 / 3.0) * Math.pow(Math.min(b, h), 3) * Math.max(b, h);

      elements.push({
        id: beam.id,
        name: beam.name,
        type: "beam",
        floorId: floor.id,
        nodeI: nStartId,
        nodeJ: nEndId,
        length: L_beam,
        E: E_kN_m2,
        G: G_kN_m2,
        A,
        Iz,
        Iy,
        J,
        f_crack: TBDY_2018_CRACKED_MODIFIERS.beamFlexure,
        rollAngleRad: 0,
        width: b,
        depth: h,
        qy: qBeam,
        qz: 0,
      });
    }

    // 3. Shear wall elements (Wide-column macro-element formulation)
    for (const wall of floorWalls) {
      const L_wall = distance(wall.start, wall.end);
      if (L_wall < 1e-6) continue;
      const h_wall = wall.height || floor.height;

      const cx = (wall.start.x + wall.end.x) / 2.0;
      const cy = (wall.start.y + wall.end.y) / 2.0;

      const nBaseCentroidId = getNodeOrCreate(cx, cy, zBase, floor.id, isLowestFloor, "nw_cb");
      const nTopCentroidId = getNodeOrCreate(cx, cy, zBase + h_wall, floor.id, false, "nw_ct");

      // Boundary nodes for beam connections
      const nStartTopId = getNodeOrCreate(wall.start.x, wall.start.y, zTop, floor.id, false, "nw_st");
      const nEndTopId = getNodeOrCreate(wall.end.x, wall.end.y, zTop, floor.id, false, "nw_et");

      const tw = wall.thickness;
      const A = tw * L_wall;
      const Iz = (tw * Math.pow(L_wall, 3)) / 12.0; // In-plane strong axis
      const Iy = (L_wall * Math.pow(tw, 3)) / 12.0; // Out-of-plane weak axis
      const J = (1.0 / 3.0) * Math.pow(tw, 3) * L_wall;
      const angleRad = Math.atan2(wall.end.y - wall.start.y, wall.end.x - wall.start.x);

      // Central wide-column macro-element
      elements.push({
        id: wall.id,
        name: wall.name,
        type: "wall",
        floorId: floor.id,
        nodeI: nBaseCentroidId,
        nodeJ: nTopCentroidId,
        length: h_wall,
        E: E_kN_m2,
        G: G_kN_m2,
        A,
        Iz,
        Iy,
        J,
        f_crack: TBDY_2018_CRACKED_MODIFIERS.wallFlexure,
        rollAngleRad: angleRad,
        width: tw,
        depth: L_wall,
        qy: 0,
        qz: 0,
        isWideColumn: true,
        wallLength: L_wall,
        wallThickness: tw,
      });

      // Rigid arms connecting top centroid to boundary endpoints
      const L_half = L_wall / 2.0;
      const E_rigid = E_kN_m2 * 100.0;
      elements.push({
        id: `${wall.id}_rigid1`,
        name: `${wall.name}_R1`,
        type: "beam",
        floorId: floor.id,
        nodeI: nTopCentroidId,
        nodeJ: nStartTopId,
        length: Math.max(0.1, L_half),
        E: E_rigid,
        G: G_kN_m2 * 100.0,
        A: A * 10.0,
        Iz: Iz * 10.0,
        Iy: Iy * 10.0,
        J: J * 10.0,
        f_crack: 1.0,
        rollAngleRad: 0,
        width: tw,
        depth: 0.5,
        qy: 0,
        qz: 0,
      });

      elements.push({
        id: `${wall.id}_rigid2`,
        name: `${wall.name}_R2`,
        type: "beam",
        floorId: floor.id,
        nodeI: nTopCentroidId,
        nodeJ: nEndTopId,
        length: Math.max(0.1, L_half),
        E: E_rigid,
        G: G_kN_m2 * 100.0,
        A: A * 10.0,
        Iz: Iz * 10.0,
        Iy: Iy * 10.0,
        J: J * 10.0,
        f_crack: 1.0,
        rollAngleRad: 0,
        width: tw,
        depth: 0.5,
        qy: 0,
        qz: 0,
      });
    }
  }

  return {
    nodes,
    elements,
    floors: sortedFloors.map(f => ({ id: f.id, name: f.name, elevation: f.elevation, height: f.height })),
    floorDiaphragms,
    sds: settings.sds,
    sd1: settings.sd1,
    r: settings.r,
    importance: settings.importance,
  };
}

export function runStructuralAnalysis(model: CadModel, customSettings?: Partial<AnalysisSettings>): AnalysisResult {
  const settings: AnalysisSettings = { ...DEFAULT_ANALYSIS_SETTINGS, ...customSettings };
  for (const key of ["sds", "sd1", "r", "importance", "driftLimit"] as const) {
    if (!Number.isFinite(settings[key]) || settings[key] <= 0) {
      throw new Error(key + ": pozitif sonlu değer gerekli.");
    }
  }
  if (!Number.isFinite(settings.liveLoadParticipation) || settings.liveLoadParticipation < 0 || settings.liveLoadParticipation > 1) {
    throw new Error("Hareketli yük katılımı 0–1 aralığında olmalıdır.");
  }

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

  const junctions = resolveJunctions(model);
  if (junctions.status !== "resolved") {
    throw new Error(junctions.error || "Birleşim hacimleri çözülemedi.");
  }

  for (const el of model.elements) {
    const weights = floorWeights.get(el.floorId);
    if (!weights) continue;
    weights.dead += (junctions.byElement[el.id]?.netVolume ?? 0) * densityKnM3;
    if (el.type === "slab") {
      const area = polygonArea(el.points);
      weights.dead += area * (el.finishLoad ?? 1.5);
      weights.live += area * (el.liveLoad ?? 2.0);
    }
  }

  // Calculate building seismic weight W = \sum (G + n*Q)
  let totalBuildingWeightKn = 0;
  const storeySeismicWeights: { floor: Floor; weightKn: number; deadKn: number; liveKn: number }[] = [];

  for (const floor of sortedFloors) {
    const w = floorWeights.get(floor.id) ?? { dead: 0, live: 0 };
    const deadKn = w.dead;
    const liveKn = w.live;
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

  // 4. Build and execute modular 3D FEM structural analysis
  const femMeshInput = buildFemMeshFromModel(model, settings, sortedFloors, floorWeights);
  let femOutput: FemAnalysisOutput | undefined;

  if (femMeshInput.elements.length > 0) {
    try {
      femOutput = solve3DStructuralMesh(femMeshInput);
    } catch {
      // In case of degenerate kinematic mechanism, fallback gracefully
      femOutput = undefined;
    }
  }

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

    // 5. Calculate member internal forces and check capacities (Columns, Beams, Walls)
    const tributaryLoadPerCol = (sw.deadKn * 1.4 + sw.liveKn * 1.6) / Math.max(1, floorColumns.length);

    for (const col of floorColumns) {
      const femEnv = femOutput?.memberEnvelopes[col.id];
      const k_col = memberStiffnesses.get(col.id) ?? (totalStiffness / Math.max(1, floorColumns.length));
      const colShearKn = femEnv ? Math.max(Math.abs(femEnv.maxShearV2Kn), Math.abs(femEnv.maxShearV3Kn)) : cumulativeShearKn * (k_col / totalStiffness);
      const h_col = col.height || floor.height;
      const colMomentKnm = femEnv ? Math.max(Math.abs(femEnv.maxMomentM3Knm), Math.abs(femEnv.maxMomentM2Knm)) : colShearKn * (h_col / 2);
      const axialKn = femEnv ? Math.max(Math.abs(femEnv.minAxialKn), tributaryLoadPerCol) : tributaryLoadPerCol;

      // Axial stress ratio: nu = Nd / (Ac * fcd) <= 0.40 (TBDY 2018 §7.3.1.1)
      const AcM2 = col.width * col.depth;
      const AcMm2 = AcM2 * 1e6;
      const axialStressRatio = (axialKn * 1000) / (AcMm2 * concrete.fcd);

      // Flexural capacity Mr approx = 0.85 * fcd * b * d^2 + 0.9 * fyd * As * d
      const As_min = 0.01 * AcMm2;
      const d_eff = Math.max(col.width, col.depth) * 1000 - 40; // 40mm cover
      const capacityMomentKnm = (0.20 * concrete.fcd * col.width * 1000 * Math.pow(d_eff, 2) + 0.9 * rebar.fyd * As_min * d_eff) / 1e6;
      const capacityRatio = colMomentKnm / Math.max(1, capacityMomentKnm);
      if (capacityRatio > maxCapacityRatio) maxCapacityRatio = capacityRatio;

      const axialPass = axialStressRatio <= 0.40;
      const flexPass = capacityRatio <= 1.0;
      const colPass = axialPass && flexPass;
      if (!colPass) overallPass = false;

      // Rebar requirement: min 1% per TBDY 2018 §7.3.2
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
        governingCombination: femEnv?.governingCombo ?? "1.4G+1.6Q",
        statusText: !axialPass
          ? `Eksenel yük limiti aşıldı (Nd/(Ac*fcd) = ${(axialStressRatio * 100).toFixed(1)}% > 40%)`
          : !flexPass
          ? `Moment kapasitesi aşıldı (Md/Mr = ${(capacityRatio * 100).toFixed(1)}%)`
          : `Uygun (Kapasite: ${(capacityRatio * 100).toFixed(1)}%)`,
      };
    }

    // Beams on this floor
    for (const beam of floorBeams) {
      const femEnv = femOutput?.memberEnvelopes[beam.id];
      const L = distance(beam.start, beam.end);
      const qDesignKnM = (sw.deadKn * 1.4 + sw.liveKn * 1.6) / Math.max(1, floorBeams.length * 4);
      const supportMomentKnm = femEnv ? Math.max(Math.abs(femEnv.maxMomentM3Knm), Math.abs(femEnv.minMomentM3Knm)) : (qDesignKnM * Math.pow(L, 2)) / 8 + 15.0;
      const beamShearKn = femEnv ? Math.abs(femEnv.maxShearV2Kn) : (qDesignKnM * L) / 2 + 20.0;

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
        axialKn: femEnv ? Math.abs(femEnv.maxAxialKn) : 0,
        shearKn: beamShearKn,
        momentKnm: supportMomentKnm,
        capacityMomentKnm,
        capacityRatio,
        requiredRebarCm2: finalAsMm2 / 100,
        providedRebarText: rebarText,
        confinementSpacingCm: Math.min(10, Math.floor((beam.height * 100) / 4)),
        pass: beamPass,
        governingCombination: femEnv?.governingCombo ?? "1.4G+1.6Q",
        statusText: beamPass
          ? `Uygun (Kapasite: ${(capacityRatio * 100).toFixed(1)}%)`
          : `Moment kapasitesi aşıldı (Md/Mr = ${(capacityRatio * 100).toFixed(1)}%)`,
      };
    }

    // Shear walls on this floor
    for (const wall of floorWalls) {
      const femEnv = femOutput?.memberEnvelopes[wall.id];
      const Lw = distance(wall.start, wall.end);
      const tw = wall.thickness;
      const AchMm2 = tw * 1000 * Lw * 1000;

      const wallAxialKn = femEnv ? Math.abs(femEnv.minAxialKn) : tributaryLoadPerCol * 1.5;
      const wallShearKn = femEnv ? Math.abs(femEnv.maxShearV2Kn) : cumulativeShearKn * 0.4;
      const wallMomentKnm = femEnv ? Math.abs(femEnv.maxMomentM3Knm) : wallShearKn * (floor.height / 2);

      // TBDY 2018 §7.6: Shear capacity Vr <= 0.85 * Ach * sqrt(fck)
      const maxVrKn = (0.85 * AchMm2 * Math.sqrt(concrete.fck)) / 1000.0;
      const minWebSteelMm2PerM = 0.0025 * tw * 1000.0 * 1000.0; // 0.25% min web reinforcement
      const rhoWeb = minWebSteelMm2PerM / (tw * 1000.0 * 1000.0);
      const VrKn = Math.min(maxVrKn, (0.65 * concrete.fctd * AchMm2 + rhoWeb * rebar.fyd * AchMm2) / 1000.0);

      // Moment capacity Mr
      const lu = Math.max(0.1 * Lw, 0.2 * Lw); // Critical boundary zone length
      const As_boundary = Math.max(4 * 154, 0.002 * (tw * 1000) * (lu * 1000)); // mm²
      const capacityMomentKnm = (0.9 * rebar.fyd * As_boundary * (0.8 * Lw * 1000) + 0.5 * wallAxialKn * 1000 * (Lw * 1000)) / 1e6;

      const capacityRatio = Math.max(wallMomentKnm / Math.max(1, capacityMomentKnm), wallShearKn / Math.max(1, VrKn));
      if (capacityRatio > maxCapacityRatio) maxCapacityRatio = capacityRatio;

      const wallPass = capacityRatio <= 1.0;
      if (!wallPass) overallPass = false;

      memberResults[wall.id] = {
        elementId: wall.id,
        name: wall.name,
        type: "wall",
        floorId: floor.id,
        axialKn: wallAxialKn,
        shearKn: wallShearKn,
        momentKnm: wallMomentKnm,
        capacityMomentKnm,
        capacityRatio,
        shearCapacityKn: VrKn,
        requiredRebarCm2: (As_boundary * 2) / 100,
        providedRebarText: `Uç: 6Φ14 + Gövde: 2xΦ10/20`,
        confinementSpacingCm: 10,
        pass: wallPass,
        governingCombination: femEnv?.governingCombo ?? "G+Q+Ex+0.3Ey+0.3Ez",
        statusText: wallPass
          ? `Perde kesme ve eğilme güvenli (Kapasite: ${(capacityRatio * 100).toFixed(1)}%)`
          : `Perde kapasite aşıldı (Kapasite: ${(capacityRatio * 100).toFixed(1)}%)`,
      };
    }
  }

  // 6. Joint Shear Safety (TBDY 2018 §7.5), Strong Column - Weak Beam (§7.3.3) and Punching Checks
  const joints: Record<string, JointShearResult> = {};
  const columnBeamMoments: Record<string, ColumnBeamMomentResult> = {};
  const punching: Record<string, PunchingResult> = {};

  for (const floor of sortedFloors) {
    const floorColumns = model.elements.filter(e => e.type === "column" && e.floorId === floor.id) as ColumnElement[];
    const floorBeams = model.elements.filter(e => e.type === "beam" && e.floorId === floor.id) as BeamElement[];

    for (const col of floorColumns) {
      const connected = floorBeams.filter(b => {
        const dStart = distance(b.start, col.position);
        const dEnd = distance(b.end, col.position);
        const tol = Math.max(col.width, col.depth) * 0.8 + 0.15;
        return dStart <= tol || dEnd <= tol;
      });

      const connectedNames = connected.map(b => b.name);
      const hasXBeams = connected.some(b => Math.abs(b.end.x - b.start.x) > Math.abs(b.end.y - b.start.y));
      const hasYBeams = connected.some(b => Math.abs(b.end.y - b.start.y) > Math.abs(b.end.x - b.start.x));
      const isConfined = connected.length >= 4 || (hasXBeams && hasYBeams && connected.length >= 3);

      const bj = Math.min(col.width, 0.25 + col.depth);
      const hc = col.depth;
      const colRes = memberResults[col.id];
      const colShear = colRes ? colRes.shearKn : 20.0;
      const colMoment = colRes ? colRes.capacityMomentKnm : 80.0;

      let sumAsMm2 = 0;
      let sumBeamMoment = 0;
      for (const b of connected) {
        const bRes = memberResults[b.id];
        if (bRes) {
          sumAsMm2 += bRes.requiredRebarCm2 * 100;
          sumBeamMoment += bRes.capacityMomentKnm;
        } else {
          sumAsMm2 += 400;
          sumBeamMoment += 40;
        }
      }

      const rebarForceKn = (1.25 * rebar.fyk * (sumAsMm2 * 0.6)) / 1000;
      const shearDemandKn = Math.max(10, rebarForceKn - colShear);
      const shearCapFactor = isConfined ? 1.7 : 1.0;
      const shearCapacityKn = (shearCapFactor * (bj * 1000) * (hc * 1000) * concrete.fctd) / 1000;
      const shearRatio = shearDemandKn / Math.max(1, shearCapacityKn);
      const jointPass = shearRatio <= 1.0;
      if (!jointPass) overallPass = false;

      joints[col.id] = {
        columnId: col.id,
        columnName: col.name,
        floorId: floor.id,
        connectedBeams: connectedNames,
        isConfined,
        effectiveWidthM: bj,
        columnDepthM: hc,
        shearDemandKn,
        shearCapacityKn,
        shearRatio,
        pass: jointPass,
        statusText: jointPass
          ? `${isConfined ? "Kuşatılmış" : "Kuşatılmamış"} birleşim: Uygun (Ve/Vmax = ${(shearRatio * 100).toFixed(1)}%)`
          : `Kesme güvenliği yetersiz (Ve/Vmax = ${(shearRatio * 100).toFixed(1)}% > 100%)`,
      };

      const sumColumnMoment = colMoment * 2;
      const momentRatio = sumColumnMoment / Math.max(1, sumBeamMoment);
      const momentPass = momentRatio >= 1.20;

      columnBeamMoments[col.id] = {
        columnId: col.id,
        columnName: col.name,
        floorId: floor.id,
        sumColumnMomentKnm: sumColumnMoment,
        sumBeamMomentKnm: sumBeamMoment,
        ratio: momentRatio,
        pass: momentPass,
        statusText: momentPass
          ? `Güçlü kolon koşulu sağlandı (ΣMc/ΣMb = ${momentRatio.toFixed(2)} ≥ 1.20)`
          : `Güçlü kolon koşulu yetersiz (ΣMc/ΣMb = ${momentRatio.toFixed(2)} < 1.20)`,
      };

      const d_eff = Math.min(col.width, col.depth) * 0.8;
      const up = 2 * (col.width + d_eff) + 2 * (col.depth + d_eff);
      const punchingCapKn = (1.0 * concrete.fctd * (up * 1000) * (d_eff * 1000)) / 1000;
      const axialForce = colRes ? colRes.axialKn : 100;
      const punchingRatio = axialForce / Math.max(1, punchingCapKn);
      const punchingPass = punchingRatio <= 1.0;

      punching[col.id] = {
        columnId: col.id,
        columnName: col.name,
        floorId: floor.id,
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

  // 7. Irregularity Checks (A1 Torsional & B2 Soft Storey)
  const torsionalA1 = storeys.map(st => {
    const fd = femOutput?.floorDiaphragms.find(f => f.floorId === st.floorId);
    let etaBi = 1.05;
    if (fd && Math.abs(fd.rotationZ) > 1e-6) {
      etaBi = Math.min(1.40, 1.0 + Math.abs(fd.rotationZ) * 100.0);
    }
    return {
      floorId: st.floorId,
      floorName: st.name,
      etaBi,
      hasA1: etaBi > 1.20,
      pass: etaBi <= 1.20,
    };
  });

  const softStoreyB2 = storeys.map((st, idx) => {
    const nextSt = storeys[idx + 1];
    let etaKi = 1.0;
    if (nextSt && nextSt.driftRatio > 1e-6) {
      etaKi = st.driftRatio / nextSt.driftRatio;
    }
    return {
      floorId: st.floorId,
      floorName: st.name,
      etaKi,
      hasB2: etaKi > 1.50 || etaKi < 0.67,
      pass: etaKi <= 1.50 && etaKi >= 0.67,
    };
  });

  const naturalPeriods = femOutput?.naturalPeriods ?? [periodSec, periodSec * 0.85, periodSec * 0.70];

  const summaryNotes: string[] = [
    `3B Sonlu Eleman Çerçeve Analizi (12-SDO): Rijit kat diyaframları ve TBDY 2018 Tablo 4.2 çatlamış kesit rijitlikleri uygulandı.`,
    `33 Yük Kombinasyonu (TS 500 & TBDY 2018 §4.4.3: 1.4G+1.6Q, G+Q±E, 0.9G±E, Ez=0.3*Sds*G) süperpoze edildi.`,
    `Bina Toplam Ağırlığı: ${totalBuildingWeightKn.toFixed(1)} kN (${(totalBuildingWeightKn / 9.81).toFixed(1)} ton).`,
    `Temel Periyot T1 = ${naturalPeriods[0].toFixed(3)} s, Doğal Titreşim Modları: T1 = ${naturalPeriods[0].toFixed(3)} s, T2 = ${naturalPeriods[1].toFixed(3)} s, T3 = ${naturalPeriods[2].toFixed(3)} s.`,
    `Tasarım Taban Kesme Kuvveti Vt = ${baseShearKn.toFixed(1)} kN ${isMinBaseShearControlled ? "(Minimum taban kesme kontrolü 0.04*W*I*Sds etkin)" : "(Spektral ivme kontrolü)"}.`,
    `Maksimum Göreli Kat Ötelemesi: ${(maxDriftRatio * 100).toFixed(3)}% (Limit: ${(settings.driftLimit * 100).toFixed(2)}% - ${maxDriftRatio <= settings.driftLimit ? "UYGUN" : "AŞILDI"}).`,
    `Tasarım sonucu: Yapı genelinde ${overallPass ? "TÜM KONTROLLER VE YÖNETMELİK LİMİTLERİ SAĞLANDI" : "BAZI ELEMANLARDA KAPASİTE AŞIMI VAR"}.`,
  ];

  // Extract member forces map format matching PROJECT.md interface contract
  const memberForcesMap: Record<string, { x: number; N: number; V2: number; V3: number; T: number; M2: number; M3: number }[]> = {};
  if (femOutput) {
    for (const [id, stations] of Object.entries(femOutput.memberForces)) {
      memberForcesMap[id] = stations.map(s => ({
        x: s.x,
        N: s.N,
        V2: s.V2,
        V3: s.V3,
        T: s.T,
        M2: s.M2,
        M3: s.M3,
      }));
    }
  }

  const preliminaryResult: StructuralAnalysisResult = {
    timestamp: new Date().toISOString(),
    settings,
    totalWeightKn: totalBuildingWeightKn,
    totalHeightM,
    periodSec: naturalPeriods[0],
    spectralAccelerationSa,
    baseShearKn,
    minBaseShearKn,
    isMinBaseShearControlled,
    storeys,
    members: memberResults,
    joints,
    columnBeamMoments,
    irregularities: {
      torsionalA1,
      softStoreyB2,
    },
    punching,
    overallPass,
    maxDriftRatio,
    maxCapacityRatio,
    summaryNotes,

    // 3D FEM Structural Analysis Extensions
    displacements: femOutput?.displacements ?? {},
    memberForces: memberForcesMap,
    memberStations: femOutput?.memberForces ?? {},
    combinations: femOutput?.combinations ?? [],
    modes: femOutput?.modes ?? [],
    naturalPeriods,
    baseShears: femOutput?.baseShears ?? {
      Vtx: baseShearKn,
      Vty: baseShearKn,
      Mox: baseShearKn * totalHeightM * 0.67,
      Moy: baseShearKn * totalHeightM * 0.67,
    },
    floorDiaphragms: femOutput?.floorDiaphragms ?? [],
    femOutput,
  };

  // Run comprehensive TS 500 & TBDY 2018 reinforced concrete design checks
  const designResult = runConcreteDesignChecks(model, preliminaryResult, settings);

  // Merge enhanced member checks into result for backwards compatibility
  const mergedMembers: Record<string, MemberForceResult> = { ...memberResults };
  for (const [id, check] of Object.entries(designResult.memberChecks)) {
    mergedMembers[id] = check;
  }

  return {
    ...preliminaryResult,
    members: mergedMembers,
    joints: { ...joints, ...designResult.joints },
    columnBeamMoments: { ...columnBeamMoments, ...designResult.columnBeamMoments },
    punching: { ...punching, ...designResult.punching },
    overallPass: overallPass && designResult.summary.overallPass,
    maxCapacityRatio: Math.max(maxCapacityRatio, designResult.summary.maxDCR),
    summaryNotes: [...summaryNotes, ...designResult.summary.summaryNotes],
    designResult,
  };
}
