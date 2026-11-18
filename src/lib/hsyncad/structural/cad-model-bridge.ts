/**
 * P05-P15 Analytical CAD Model Bridge.
 *
 * Bridges hydrated CadModel + optional IdeProject (`R1` materials, `R2` slab/raft loads,
 * `R3` TBDY/soil settings, `R4` native rebar) into the verified 3D structural FEA,
 * modal/CQC response-spectrum, TBDY 2018 global checks, and P15 reinforcement schedule.
 *
 * Client-safe: zero `node:*` imports. Never invents fake sample defaults.
 */

import type {
  BeamElement,
  CadModel,
  ColumnElement,
  Floor,
  Point,
  SlabElement,
  WallElement,
} from "../model";
import { GRAVITY_MPS2, evaluateSpectrum, equivalentBaseShear, spectrumParameters, type StandardSpectrum } from "./design-spectrum";
import type { FrameElement, FrameNode, V3 } from "./frame-element";
import { secondOrder, softStorey, storeyDriftCheck, torsionalIrregularity, weakStoreys } from "./global-checks";
import type { GlobalControl } from "./global-control-types";
import { solveLinearStructure } from "./linear-structure";
import { solveModalStructure, type ModalStructureInput, type NodeInertia } from "./modal-structure";
import { responseSpectrum } from "./response-spectrum";
import type { RigidDiaphragm } from "./rigid-diaphragm";
import {
  DEFAULT_CLASSIFICATION_PROFILE,
  computeReinforcementSchedule,
  createCenterlineGeometry,
  createStraightSegment,
  type BarInput,
  type ExpectedElement,
  type ReinforcementScheduleResult,
} from "./reinforcement-schedule";

export interface NativeIdeLoadAnnotation {
  readonly deadTfM2?: number | null;
  readonly liveTfM2?: number | null;
  readonly thicknessCm?: number | null;
}

export interface NativeIdeElementLike {
  readonly id?: string;
  readonly name?: string;
  readonly type?: string;
  readonly floorId?: string;
  readonly structural?: boolean;
  readonly foundation?: boolean;
  readonly isFoundationRaft?: boolean;
  readonly start?: { readonly x: number; readonly y: number };
  readonly end?: { readonly x: number; readonly y: number };
  readonly center?: { readonly x: number; readonly y: number };
  readonly points?: readonly Point[];
  readonly polygon?: readonly Point[];
  readonly holes?: readonly (readonly Point[])[];
  readonly width?: number;
  readonly depth?: number;
  readonly thickness?: number;
  readonly height?: number;
  readonly rotation?: number;
  readonly elevationOffset?: number;
  readonly planAnnotation?: {
    readonly loads?: NativeIdeLoadAnnotation | null;
  } | null;
  readonly slabLoads?: {
    readonly deadTfM2?: number | null;
    readonly finishTfM2?: number | null;
    readonly liveTfM2?: number | null;
  } | null;
  readonly rebarLayout?:
    | { readonly kind: "column"; readonly majorCount: number; readonly minorCount: number; readonly barDiaMm: number; readonly stirrupDiaMm: number; readonly stirrupSpacingCm: readonly number[] }
    | { readonly kind: "wall"; readonly webDiaMm: number; readonly webSpacingCm: number; readonly headCount: number; readonly headDiaMm: number; readonly webStirrupDiaMm: number; readonly webStirrupSpacingCm: number; readonly headStirrupDiaMm: number; readonly headStirrupSpacingCm: number }
    | { readonly kind: "beam"; readonly topCount: number; readonly topDiaMm: number; readonly bottomCount: number; readonly bottomDiaMm: number; readonly stirrupDiaMm: number; readonly stirrupSpacingCm: readonly number[] }
    | { readonly kind: "raft"; readonly topX: string; readonly topY: string; readonly bottomX: string; readonly bottomY: string };
}

export interface NativeIdeProjectLike {
  readonly projectName?: string;
  readonly concreteGrade?: string;
  readonly rebarGrade?: string;
  readonly soilClass?: "ZA" | "ZB" | "ZC" | "ZD" | "ZE";
  readonly materials?: readonly {
    readonly name?: string;
    readonly kind?: "concrete" | "steel";
    readonly fckMpa?: number | null;
    readonly fykMpa?: number | null;
    readonly elasticModulusMpa?: number;
  }[];
  readonly seismicSoil?: {
    readonly ss?: number | null;
    readonly s1?: number | null;
    readonly sds?: number | null;
    readonly sd1?: number | null;
    readonly I?: number | null;
    readonly rEntered?: number | null;
    readonly rSelectedRatio?: number | null;
    readonly ko?: number | null;
    readonly qt?: number | null;
  };
  readonly tbdySettings?: {
    readonly ss?: number;
    readonly s1?: number;
    readonly rx?: number;
    readonly ry?: number;
    readonly dx?: number;
    readonly dy?: number;
    readonly importanceFactor?: number;
    readonly hazard?: "DD-2" | "DD-3";
    readonly soilBearingKpa?: number;
    readonly subgradeModulusKnm3?: number;
  };
  readonly elements?: readonly NativeIdeElementLike[];
}

export interface StructuralBridgeOptions {
  readonly revisionId?: string;
  readonly concreteGrade?: string;
  readonly rebarGrade?: string;
  readonly soilClass?: "ZA" | "ZB" | "ZC" | "ZD" | "ZE";
  readonly ss?: number;
  readonly s1?: number;
  readonly importanceFactor?: number;
  readonly rx?: number;
  readonly ry?: number;
  readonly dx?: number;
  readonly dy?: number;
  readonly dts?: "1" | "1a" | "2" | "2a" | "3" | "3a" | "4" | "4a";
  readonly crackedInertia?: boolean;
  readonly includeBasementInUpperModal?: boolean;
  readonly maxModes?: number;
}

export interface BridgeStoreySummary {
  readonly floorId: string;
  readonly floorName: string;
  readonly index: number;
  readonly elevationM: number;
  readonly heightM: number;
  readonly isBasement: boolean;
  readonly massTonnes: number;
  readonly weightKn: number;
  readonly centerOfMass: readonly [number, number];
  readonly etaBiX: number | null;
  readonly etaBiY: number | null;
  readonly driftRatioX: number | null;
  readonly driftRatioY: number | null;
  readonly etaKiX: number | null;
  readonly etaKiY: number | null;
  readonly weakStoreyEtaX: number | null;
  readonly weakStoreyEtaY: number | null;
  readonly thetaIIX: number | null;
  readonly thetaIIY: number | null;
}

export interface BridgeModalSummary {
  readonly status: "solved" | "failed";
  readonly modeCount: number;
  readonly coverageX: number;
  readonly coverageY: number;
  readonly coverageRZ: number;
  readonly modes: readonly {
    readonly number: number;
    readonly periodSeconds: number;
    readonly frequencyHz: number;
    readonly ux: number;
    readonly uy: number;
    readonly rz: number;
  }[];
  readonly reason?: string;
}

export interface BridgeSpectrumSummary {
  readonly direction: "X" | "Y";
  readonly status: "solved" | "failed";
  readonly elasticBaseShearKn: number;
  readonly equivalentBaseShearKn: number;
  readonly designBaseShearKn: number;
  readonly beta: number;
  readonly gamma: number;
  readonly reason?: string;
}

export interface BridgeGlobalChecks {
  readonly A1: readonly GlobalControl[];
  readonly B1: {
    readonly checks: readonly GlobalControl[];
    readonly minimumEta: number;
    readonly rReductionFactor: number | null;
  };
  readonly B2: readonly GlobalControl[];
  readonly drift: readonly GlobalControl[];
  readonly secondOrder: readonly GlobalControl[];
  readonly rigidBasementVerified: boolean | null;
  readonly hasAnyIrregularity: boolean;
}

export interface BridgeConcreteQuantities {
  readonly totalConcreteM3: number;
  readonly columnM3: number;
  readonly wallM3: number;
  readonly beamM3: number;
  readonly slabM3: number;
  readonly foundationM3: number;
}

export interface StructuralBridgeResult {
  readonly status: "solved" | "incomplete" | "failed";
  readonly revisionId: string;
  readonly modelMode: "cracked_tbdy" | "uncracked";
  readonly material: {
    readonly concreteGrade: string;
    readonly fckMpa: number;
    readonly fctkMpa: number;
    readonly ecMpa: number;
    readonly rebarGrade: string;
    readonly fykMpa: number;
    readonly steelDensityKgM3: number;
  };
  readonly spectrum: StandardSpectrum & {
    readonly sds: number;
    readonly sd1: number;
    readonly TA: number;
    readonly TB: number;
  };
  readonly counts: {
    readonly floors: number;
    readonly nodes: number;
    readonly frames: number;
    readonly columns: number;
    readonly walls: number;
    readonly beams: number;
    readonly slabs: number;
    readonly rafts: number;
    readonly stairs: number;
  };
  readonly quantities: BridgeConcreteQuantities;
  readonly totalMassTonnes: number;
  readonly upperMassTonnes: number;
  readonly modalFull: BridgeModalSummary;
  readonly modalUpper: BridgeModalSummary | null;
  readonly spectrumX: BridgeSpectrumSummary;
  readonly spectrumY: BridgeSpectrumSummary;
  readonly gravitySolve: {
    readonly status: string;
    readonly maxDisplacementM: number;
    readonly verticalReactionSumKn: number;
  };
  readonly storeys: readonly BridgeStoreySummary[];
  readonly globalChecks: BridgeGlobalChecks;
  readonly reinforcementSchedule: ReinforcementScheduleResult;
  readonly missingFacts: readonly string[];
}

const CONCRETE_FCK_MPA: Record<string, number> = {
  C20: 20,
  C25: 25,
  C30: 30,
  C35: 35,
  C40: 40,
  C45: 45,
  C50: 50,
};

const REBAR_FYK_MPA: Record<string, number> = {
  S220: 220,
  S420: 420,
  B420B: 420,
  B420C: 420,
  B500B: 500,
  B500C: 500,
};

export function concreteElasticModulusMpa(fckMpa: number): number {
  return 3250 * Math.sqrt(fckMpa) + 14000;
}

export function polygonSignedArea2D(pts: readonly Point[]): number {
  if (pts.length < 3) return 0;
  let sum = 0;
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % pts.length];
    sum += a.x * b.y - b.x * a.y;
  }
  return sum / 2;
}

export function polygonArea2D(pts: readonly Point[]): number {
  return Math.abs(polygonSignedArea2D(pts));
}

export function polygonCentroid2D(pts: readonly Point[]): Point {
  if (pts.length === 0) return { x: 0, y: 0 };
  const signedArea = polygonSignedArea2D(pts);
  if (Math.abs(signedArea) < 1e-10) {
    const sx = pts.reduce((s, p) => s + p.x, 0) / pts.length;
    const sy = pts.reduce((s, p) => s + p.y, 0) / pts.length;
    return { x: sx, y: sy };
  }
  let cx = 0;
  let cy = 0;
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % pts.length];
    const cross = a.x * b.y - b.x * a.y;
    cx += (a.x + b.x) * cross;
    cy += (a.y + b.y) * cross;
  }
  const factor = 1 / (6 * signedArea);
  return { x: cx * factor, y: cy * factor };
}

function pointToSegmentDist(
  px: number,
  py: number,
  ax: number,
  ay: number,
  bx: number,
  by: number
): { dist: number; t: number; qx: number; qy: number } {
  const dx = bx - ax;
  const dy = by - ay;
  const len2 = dx * dx + dy * dy;
  if (len2 < 1e-12) {
    return { dist: Math.hypot(px - ax, py - ay), t: 0, qx: ax, qy: ay };
  }
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len2));
  const qx = ax + t * dx;
  const qy = ay + t * dy;
  return { dist: Math.hypot(px - qx, py - qy), t, qx, qy };
}

interface FloorSnapGraph {
  readonly nodes: { x: number; y: number }[];
  readonly snap: (x: number, y: number, tol: number) => number;
}

function createFloorSnapGraph(): FloorSnapGraph {
  const nodes: { x: number; y: number }[] = [];
  const snap = (x: number, y: number, tol: number): number => {
    let best = -1;
    let bestD = tol;
    for (let i = 0; i < nodes.length; i++) {
      const d = Math.hypot(nodes[i].x - x, nodes[i].y - y);
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    }
    if (best >= 0) return best;
    nodes.push({ x, y });
    return nodes.length - 1;
  };
  return { nodes, snap };
}

function isBasementFloor(floor: Floor): boolean {
  const n = floor.name.toLowerCase();
  return floor.elevation < -1e-3 || n.includes("bodrum") || n.includes("basement");
}

const RC_REBAR_TOKEN_RE = /\b(B(?:420|500)[A-Z]?|S(?:220|420|500))\b/i;

function extractRebarToken(name: string | undefined): string | undefined {
  if (!name) return undefined;
  const match = name.match(RC_REBAR_TOKEN_RE);
  return match ? match[1].toUpperCase() : undefined;
}

function extractConcreteToken(name: string | undefined): string | undefined {
  if (!name) return undefined;
  const match = name.match(/\b(C\d+)\b/i);
  return match ? match[1].toUpperCase() : undefined;
}

function isRaftElement(el: NativeIdeElementLike): boolean {
  return (
    el.type === "raft" ||
    el.type === "foundation" ||
    Boolean((el as { foundation?: boolean; isFoundationRaft?: boolean }).foundation) ||
    Boolean((el as { isFoundationRaft?: boolean }).isFoundationRaft) ||
    el.rebarLayout?.kind === "raft" ||
    /^RD/i.test(el.name ?? "")
  );
}

function resolveMaterialSpec(model: CadModel, ideSource: NativeIdeProjectLike | undefined, options: StructuralBridgeOptions) {
  const allMaterials = [...model.materials, ...(ideSource?.materials ?? [])];
  const concreteMat = allMaterials.find((m) => m.kind === "concrete" || /\bC\d+\b/i.test(m.name ?? ""));
  const rebarMat = allMaterials.find((m) => Boolean(extractRebarToken(m.name)));
  const concreteGrade =
    options.concreteGrade ??
    ideSource?.concreteGrade ??
    (concreteMat?.fckMpa ? `C${Math.round(concreteMat.fckMpa)}` : undefined) ??
    extractConcreteToken(concreteMat?.name) ??
    "C25";
  const concreteEmbeddedRebar = extractRebarToken(concreteMat?.name);
  const rebarMatToken = extractRebarToken(rebarMat?.name);
  const rebarGradeFromFyk =
    concreteMat?.fykMpa && concreteMat.fykMpa >= 490
      ? "B500C"
      : concreteMat?.fykMpa && concreteMat.fykMpa >= 400
        ? "B420C"
        : undefined;
  const rebarGrade =
    options.rebarGrade ??
    ideSource?.rebarGrade ??
    concreteEmbeddedRebar ??
    rebarMatToken ??
    rebarGradeFromFyk ??
    "B420C";
  const fckMpa = CONCRETE_FCK_MPA[concreteGrade] ?? concreteMat?.fckMpa ?? 25;
  const fctkMpa = 0.35 * Math.sqrt(fckMpa);
  const ecMpa = concreteElasticModulusMpa(fckMpa);
  const fykMpa =
    REBAR_FYK_MPA[rebarGrade] ??
    (rebarMat && rebarMat.kind !== "concrete" ? rebarMat.fykMpa : undefined) ??
    concreteMat?.fykMpa ??
    420;
  return {
    concreteGrade,
    fckMpa,
    fctkMpa,
    ecMpa,
    rebarGrade,
    fykMpa,
    steelDensityKgM3: 7850,
  };
}

function resolveSpectrumSpec(
  ideSource: NativeIdeProjectLike | undefined,
  options: StructuralBridgeOptions,
  missingFacts: string[]
): StandardSpectrum & { sds: number; sd1: number; TA: number; TB: number } {
  const tbdy = ideSource?.tbdySettings;
  const r3 = ideSource?.seismicSoil;
  const soil = options.soilClass ?? ideSource?.soilClass ?? "ZC";
  if (!options.soilClass && !ideSource?.soilClass) {
    missingFacts.push("R3_SOIL_CLASS_DEFAULT_ZC_USED");
  }
  const ss = options.ss ?? (r3?.ss && r3.ss > 0 ? r3.ss : undefined) ?? tbdy?.ss ?? 0.875;
  const s1 = options.s1 ?? (r3?.s1 && r3.s1 > 0 ? r3.s1 : undefined) ?? tbdy?.s1 ?? 0.245;
  if (!options.ss && !(r3?.ss && r3.ss > 0) && !tbdy?.ss) {
    missingFacts.push("R3_SS_PARAM_FROM_PROJECT_DEFAULT_USED");
  }
  const spec: StandardSpectrum = {
    hazard: tbdy?.hazard ?? "DD-2",
    ss,
    s1,
    soil,
    dataSource: r3?.ss || tbdy?.ss ? "ide_project_tbdy" : "bridge_explicit_params",
  };
  const params = spectrumParameters(spec);
  return {
    ...spec,
    sds: params.sds,
    sd1: params.sd1,
    TA: params.TA,
    TB: params.TB,
  };
}

function computeFloorVerticalAndSlabData(
  floors: readonly Floor[],
  model: CadModel,
  ideSource: NativeIdeProjectLike | undefined
) {
  const slabsByFloor = new Map<string, { areaM2: number; volumeM3: number; deadKn: number; liveKn: number }>();
  for (const fl of floors) {
    slabsByFloor.set(fl.id, { areaM2: 0, volumeM3: 0, deadKn: 0, liveKn: 0 });
  }

  let raftVolumeM3 = 0;
  let slabCount = 0;
  let raftCount = 0;
  let stairCount = 0;

  const ideElems = ideSource?.elements;
  if (ideElems && ideElems.length > 0) {
    for (const el of ideElems) {
      if (el.type === "stair") {
        stairCount++;
        continue;
      }
      if (el.type !== "slab" && el.type !== "raft" && el.type !== "foundation") continue;
      const poly = el.points ?? el.polygon;
      if (!poly || poly.length < 3) continue;
      let areaM2 = polygonArea2D(poly);
      if (el.holes) {
        for (const h of el.holes) {
          areaM2 -= polygonArea2D(h);
        }
      }
      if (areaM2 <= 0) continue;
      const thicknessM = el.thickness ?? (el.planAnnotation?.loads?.thicknessCm ? el.planAnnotation.loads.thicknessCm / 100 : 0.15);
      const vol = areaM2 * thicknessM;

      const isRaft = isRaftElement(el);
      if (isRaft) {
        raftCount++;
        raftVolumeM3 += vol;
        continue;
      }

      slabCount++;
      const bucket = slabsByFloor.get(el.floorId ?? floors[0]?.id ?? "");
      if (bucket) {
        bucket.areaM2 += areaM2;
        bucket.volumeM3 += vol;
        const deadTfM2 = el.slabLoads?.deadTfM2 ?? el.planAnnotation?.loads?.deadTfM2;
        const liveTfM2 = el.slabLoads?.liveTfM2 ?? el.planAnnotation?.loads?.liveTfM2;
        const deadKnM2 = typeof deadTfM2 === "number" && deadTfM2 > 0 ? deadTfM2 * GRAVITY_MPS2 : thicknessM * 25 + 1.5;
        const liveKnM2 = typeof liveTfM2 === "number" && liveTfM2 >= 0 ? liveTfM2 * GRAVITY_MPS2 : 2.0;
        bucket.deadKn += areaM2 * deadKnM2;
        bucket.liveKn += areaM2 * liveKnM2;
      }
    }
  } else {
    for (const el of model.elements) {
      if (el.type !== "slab") continue;
      slabCount++;
      const areaM2 = el.points.length >= 3 ? polygonArea2D(el.points) : 0;
      if (areaM2 <= 0) continue;
      const thicknessM = el.thickness ?? 0.15;
      const bucket = slabsByFloor.get(el.floorId);
      if (bucket) {
        bucket.areaM2 += areaM2;
        bucket.volumeM3 += areaM2 * thicknessM;
        const deadKnM2 = thicknessM * 25 + (el.finishLoad ?? 1.5);
        const liveKnM2 = el.liveLoad ?? 2.0;
        bucket.deadKn += areaM2 * deadKnM2;
        bucket.liveKn += areaM2 * liveKnM2;
      }
    }
  }

  return { slabsByFloor, raftVolumeM3, slabCount, raftCount, stairCount };
}

function assemble3DFemSystem(
  model: CadModel,
  floors: readonly Floor[],
  slabsByFloor: ReadonlyMap<string, { areaM2: number; volumeM3: number; deadKn: number; liveKn: number }>,
  ecMpa: number,
  cracked: boolean,
  superstructureOnly: boolean
) {
  const ecKpa = ecMpa * 1000;
  const gKpa = ecKpa / 2.4;
  const modCol = cracked ? 0.7 : 1.0;
  const modWall = cracked ? 0.5 : 1.0;
  const modBeam = cracked ? 0.35 : 1.0;

  const activeFloors = superstructureOnly ? floors.filter((f) => !isBasementFloor(f)) : [...floors];
  const activeFloorIds = new Set(activeFloors.map((f) => f.id));
  const baseElevation = activeFloors.length > 0 ? activeFloors[0].elevation : 0;

  const columns = model.elements.filter((e): e is ColumnElement => e.type === "column" && activeFloorIds.has(e.floorId));
  const walls = model.elements.filter((e): e is WallElement => e.type === "wall" && activeFloorIds.has(e.floorId));
  const beams = model.elements.filter((e): e is BeamElement => e.type === "beam" && activeFloorIds.has(e.floorId));

  const floorGraphs = new Map<string, FloorSnapGraph>();
  for (const fl of activeFloors) {
    floorGraphs.set(fl.id, createFloorSnapGraph());
  }

  const colSpecs: { floorId: string; x: number; y: number; b: number; h: number; rot: number; nodeIdx: number; el: ColumnElement }[] = [];
  for (const c of columns) {
    const g = floorGraphs.get(c.floorId);
    if (!g) continue;
    const x = c.position.x;
    const y = c.position.y;
    const b = Math.max(0.2, c.width ?? 0.3);
    const h = Math.max(0.2, c.depth ?? 0.3);
    const nodeIdx = g.snap(x, y, 0.15);
    colSpecs.push({ floorId: c.floorId, x, y, b, h, rot: c.rotation ?? 0, nodeIdx, el: c });
  }

  const wallSpecs: {
    floorId: string;
    ax: number;
    ay: number;
    bx: number;
    by: number;
    tw: number;
    len: number;
    midX: number;
    midY: number;
    nA: number;
    nB: number;
    nMid: number;
    el: WallElement;
  }[] = [];
  for (const w of walls) {
    const g = floorGraphs.get(w.floorId);
    if (!g) continue;
    const len = Math.hypot(w.end.x - w.start.x, w.end.y - w.start.y);
    if (len < 0.05) continue;
    const tw = Math.max(0.15, w.thickness ?? 0.25);
    const midX = (w.start.x + w.end.x) / 2;
    const midY = (w.start.y + w.end.y) / 2;
    const nA = g.snap(w.start.x, w.start.y, 0.15);
    const nB = g.snap(w.end.x, w.end.y, 0.15);
    const nMid = g.snap(midX, midY, 0.15);
    wallSpecs.push({
      floorId: w.floorId,
      ax: w.start.x,
      ay: w.start.y,
      bx: w.end.x,
      by: w.end.y,
      tw,
      len,
      midX,
      midY,
      nA,
      nB,
      nMid,
      el: w,
    });
  }

  // Snap beam endpoints: Pass A to columns/walls, Pass B to other beam endpoints/interiors
  const snapToColOrWall = (floorId: string, px: number, py: number): number | null => {
    const g = floorGraphs.get(floorId);
    if (!g) return null;
    for (const c of colSpecs) {
      if (c.floorId !== floorId) continue;
      const tol = Math.max(c.b, c.h) / 2 + 0.18;
      if (Math.hypot(px - c.x, py - c.y) <= tol) return c.nodeIdx;
    }
    for (const w of wallSpecs) {
      if (w.floorId !== floorId) continue;
      const p = pointToSegmentDist(px, py, w.ax, w.ay, w.bx, w.by);
      if (p.dist <= w.tw / 2 + 0.25) {
        if (p.t < 0.33) return w.nA;
        if (p.t > 0.67) return w.nB;
        return w.nMid;
      }
    }
    return null;
  };

  const beamPassA = beams.map((b) => {
    if (!b.start || !b.end) return null;
    return {
      el: b,
      floorId: b.floorId,
      n1: snapToColOrWall(b.floorId, b.start.x, b.start.y),
      n2: snapToColOrWall(b.floorId, b.end.x, b.end.y),
    };
  }).filter((x): x is NonNullable<typeof x> => x !== null);

  const beamEndpoints = beamPassA.map((bm) => {
    const g = floorGraphs.get(bm.floorId)!;
    const resolvePassB = (px: number, py: number): number => {
      // Snap to existing node on floor within 0.55m
      let bestIdx = -1;
      let bestDist = 0.55;
      for (let i = 0; i < g.nodes.length; i++) {
        const d = Math.hypot(g.nodes[i].x - px, g.nodes[i].y - py);
        if (d < bestDist) {
          bestDist = d;
          bestIdx = i;
        }
      }
      if (bestIdx >= 0) return bestIdx;
      // Snap to another beam's interior segment within 0.55m
      for (const other of beamPassA) {
        if (other === bm || other.floorId !== bm.floorId) continue;
        const p = pointToSegmentDist(px, py, other.el.start.x, other.el.start.y, other.el.end.x, other.el.end.y);
        if (p.dist <= 0.55) {
          return g.snap(p.qx, p.qy, 0.08);
        }
      }
      return g.snap(px, py, 0.25);
    };
    const n1 = bm.n1 ?? resolvePassB(bm.el.start.x, bm.el.start.y);
    const n2 = bm.n2 ?? resolvePassB(bm.el.end.x, bm.el.end.y);
    if (n1 === n2) return null;
    return { el: bm.el, floorId: bm.floorId, n1, n2 };
  }).filter((x): x is NonNullable<typeof x> => x !== null);

  // Split girders at T-junctions where another beam's endpoint falls near their interior
  const splitBeams: { el: BeamElement; floorId: string; n1: number; n2: number }[] = [];
  for (const bm of beamEndpoints) {
    const g = floorGraphs.get(bm.floorId)!;
    const p1 = g.nodes[bm.n1];
    const p2 = g.nodes[bm.n2];
    const interior: { t: number; idx: number }[] = [];
    for (let i = 0; i < g.nodes.length; i++) {
      if (i === bm.n1 || i === bm.n2) continue;
      const pt = g.nodes[i];
      const d = pointToSegmentDist(pt.x, pt.y, p1.x, p1.y, p2.x, p2.y);
      if (d.dist < 0.12 && d.t > 0.04 && d.t < 0.96) {
        interior.push({ t: d.t, idx: i });
      }
    }
    interior.sort((a, b) => a.t - b.t);
    let prev = bm.n1;
    for (const hit of interior) {
      if (hit.idx !== prev) {
        splitBeams.push({ el: bm.el, floorId: bm.floorId, n1: prev, n2: hit.idx });
        prev = hit.idx;
      }
    }
    if (prev !== bm.n2) {
      splitBeams.push({ el: bm.el, floorId: bm.floorId, n1: prev, n2: bm.n2 });
    }
  }

  const findNearestExisting = (g: FloorSnapGraph, x: number, y: number): number => {
    let best = 0;
    let bestD = Infinity;
    for (let i = 0; i < g.nodes.length; i++) {
      const d = Math.hypot(g.nodes[i].x - x, g.nodes[i].y - y);
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    }
    return best;
  };

  // Create 3D FrameNodes at bottom (baseElevation) + top of each floor
  const nodes: FrameNode[] = [];
  const nodeIdMap = new Map<string, number>();
  const fixedPrescribed: FrameNode["prescribed"] = [0, 0, 0, 0, 0, 0];
  const freePrescribed: FrameNode["prescribed"] = [null, null, null, null, null, null];
  const zeroSprings: FrameNode["springs"] = [0, 0, 0, 0, 0, 0];
  const zeroLoad: FrameNode["load"] = [0, 0, 0, 0, 0, 0];
  const zeroOffsets: FrameElement["offsets"] = [[0, 0, 0], [0, 0, 0]];

  const getOrCreate3DNode = (key: string, x: number, y: number, z: number, fixed: boolean): string => {
    const existing = nodeIdMap.get(key);
    if (existing !== undefined) return nodes[existing].id;
    const idx = nodes.length;
    const id = `N_${idx}`;
    nodeIdMap.set(key, idx);
    nodes.push({
      id,
      position: [x, y, z],
      load: zeroLoad,
      prescribed: fixed ? fixedPrescribed : freePrescribed,
      springs: zeroSprings,
    });
    return id;
  };

  const frames: FrameElement[] = [];
  const releases = Array(12).fill(false);
  let columnM3 = 0;
  let wallM3 = 0;
  let beamM3 = 0;

  const nodeMassTonnes = new Map<string, number>();
  const addNodeMass = (nodeId: string, mT: number) => {
    nodeMassTonnes.set(nodeId, (nodeMassTonnes.get(nodeId) ?? 0) + mT);
  };

  const floorTopNodes = new Map<string, string[]>();

  for (let fi = 0; fi < activeFloors.length; fi++) {
    const fl = activeFloors[fi];
    const g = floorGraphs.get(fl.id)!;
    const zBot = fl.elevation;
    const zTop = fl.elevation + fl.height;
    const isBase = fi === 0 || Math.abs(zBot - baseElevation) < 1e-6;
    const topIds: string[] = [];

    const topNodeId = (localIdx: number): string => {
      const pt = g.nodes[localIdx];
      const id = getOrCreate3DNode(`${fl.id}:top:${localIdx}`, pt.x, pt.y, zTop, false);
      if (!topIds.includes(id)) topIds.push(id);
      return id;
    };

    const botNodeId = (x: number, y: number): string => {
      if (isBase) {
        return getOrCreate3DNode(`base:${x.toFixed(3)}:${y.toFixed(3)}`, x, y, zBot, true);
      }
      const prevFl = activeFloors[fi - 1];
      const prevG = floorGraphs.get(prevFl.id)!;
      if (prevG.nodes.length === 0) {
        return getOrCreate3DNode(`base:${x.toFixed(3)}:${y.toFixed(3)}`, x, y, zBot, true);
      }
      const pIdx = findNearestExisting(prevG, x, y);
      const dist = Math.hypot(prevG.nodes[pIdx].x - x, prevG.nodes[pIdx].y - y);
      if (dist > 0.6) {
        return getOrCreate3DNode(`base:${x.toFixed(3)}:${y.toFixed(3)}`, x, y, zBot, true);
      }
      const pt = prevG.nodes[pIdx];
      const prevTopId = getOrCreate3DNode(`${prevFl.id}:top:${pIdx}`, pt.x, pt.y, prevFl.elevation + prevFl.height, false);
      const prevTopList = floorTopNodes.get(prevFl.id);
      if (prevTopList && !prevTopList.includes(prevTopId)) prevTopList.push(prevTopId);
      return prevTopId;
    };

    // Columns
    for (let ci = 0; ci < colSpecs.length; ci++) {
      const c = colSpecs[ci];
      if (c.floorId !== fl.id) continue;
      const nBot = botNodeId(c.x, c.y);
      const nTop = topNodeId(c.nodeIdx);
      if (nBot === nTop) continue;
      const area = c.b * c.h;
      const vol = area * fl.height;
      columnM3 += vol;
      const mTonnes = vol * 2.5;
      addNodeMass(nTop, mTonnes * 0.5);
      if (!isBase) addNodeMass(nBot, mTonnes * 0.5);

      const iy = (c.h * c.b ** 3) / 12;
      const iz = (c.b * c.h ** 3) / 12;
      const j = (c.b * c.h * (c.b ** 2 + c.h ** 2)) / 12;
      const cosR = Math.cos(c.rot);
      const sinR = Math.sin(c.rot);
      const up: V3 = [-sinR, cosR, 0];

      frames.push({
        id: `C_${fl.id}_${ci}`,
        nodes: [nBot, nTop],
        offsets: zeroOffsets,
        up,
        rollRad: 0,
        E: ecKpa,
        G: gKpa,
        section: {
          area,
          Iy: iy,
          Iz: iz,
          J: j,
          shearAreaY: (5 / 6) * area,
          shearAreaZ: (5 / 6) * area,
        },
        modifiers: {
          axial: 1,
          bendingY: modCol,
          bendingZ: modCol,
          torsion: 0.15,
          shearY: 1,
          shearZ: 1,
        },
        theory: "timoshenko",
        releases,
        uniformLocal: [-25 * area, 0, 0],
      });
    }

    // Walls (vertical shear wall piers + rigid end arms)
    for (let wi = 0; wi < wallSpecs.length; wi++) {
      const w = wallSpecs[wi];
      if (w.floorId !== fl.id) continue;
      const nBot = botNodeId(w.midX, w.midY);
      const nTop = topNodeId(w.nMid);
      if (nBot === nTop) continue;
      const area = w.tw * w.len;
      const vol = area * fl.height;
      wallM3 += vol;
      const mTonnes = vol * 2.5;
      addNodeMass(nTop, mTonnes * 0.5);
      if (!isBase) addNodeMass(nBot, mTonnes * 0.5);

      const iyOut = (w.len * w.tw ** 3) / 12;
      const izIn = (w.tw * w.len ** 3) / 12;
      const j = (w.len * w.tw ** 3) / 3;
      const up: V3 = [(w.bx - w.ax) / w.len, (w.by - w.ay) / w.len, 0];

      frames.push({
        id: `W_${fl.id}_${wi}`,
        nodes: [nBot, nTop],
        offsets: zeroOffsets,
        up,
        rollRad: 0,
        E: ecKpa,
        G: gKpa,
        section: {
          area,
          Iy: iyOut,
          Iz: izIn,
          J: j,
          shearAreaY: (5 / 6) * area,
          shearAreaZ: (5 / 6) * area,
        },
        modifiers: {
          axial: 1,
          bendingY: modWall,
          bendingZ: modWall,
          torsion: 0.15,
          shearY: 1,
          shearZ: 1,
        },
        theory: "timoshenko",
        releases,
        uniformLocal: [-25 * area, 0, 0],
      });

      // Rigid arms from wall centroid to wall end nodes
      const rigidA = area * 10;
      const rigidI = izIn * 10;
      const rigidMod = { axial: 1, bendingY: 1, bendingZ: 1, torsion: 1, shearY: 1, shearZ: 1 };
      const rigidSec = { area: rigidA, Iy: rigidI, Iz: rigidI, J: rigidI, shearAreaY: rigidA, shearAreaZ: rigidA };
      if (w.nA !== w.nMid) {
        frames.push({
          id: `WA_${fl.id}_${wi}`,
          nodes: [nTop, topNodeId(w.nA)],
          offsets: zeroOffsets,
          up: [0, 0, 1],
          rollRad: 0,
          E: ecKpa,
          G: gKpa,
          section: rigidSec,
          modifiers: rigidMod,
          theory: "euler_bernoulli",
          releases,
          uniformLocal: [0, 0, 0],
        });
      }
      if (w.nB !== w.nMid) {
        frames.push({
          id: `WB_${fl.id}_${wi}`,
          nodes: [nTop, topNodeId(w.nB)],
          offsets: zeroOffsets,
          up: [0, 0, 1],
          rollRad: 0,
          E: ecKpa,
          G: gKpa,
          section: rigidSec,
          modifiers: rigidMod,
          theory: "euler_bernoulli",
          releases,
          uniformLocal: [0, 0, 0],
        });
      }
    }

    // Beams
    for (let bi = 0; bi < splitBeams.length; bi++) {
      const bm = splitBeams[bi];
      if (bm.floorId !== fl.id) continue;
      const n1 = topNodeId(bm.n1);
      const n2 = topNodeId(bm.n2);
      if (n1 === n2) continue;
      const p1 = g.nodes[bm.n1];
      const p2 = g.nodes[bm.n2];
      const segLen = Math.hypot(p2.x - p1.x, p2.y - p1.y);
      if (segLen < 0.05) continue;
      const bw = Math.max(0.2, bm.el.width ?? 0.25);
      const bh = Math.max(0.3, bm.el.height ?? 0.5);
      const area = bw * bh;
      const vol = area * segLen;
      beamM3 += vol;
      const mTonnes = vol * 2.5;
      addNodeMass(n1, mTonnes * 0.5);
      addNodeMass(n2, mTonnes * 0.5);

      const izVert = (bw * bh ** 3) / 12;
      const iyLat = (bh * bw ** 3) / 12;
      const j = (Math.min(bw, bh) ** 3 * Math.max(bw, bh)) / 3;
      const wGravKnM = area * 25;

      frames.push({
        id: `B_${fl.id}_${bi}`,
        nodes: [n1, n2],
        offsets: zeroOffsets,
        up: [0, 0, 1],
        rollRad: 0,
        E: ecKpa,
        G: gKpa,
        section: {
          area,
          Iy: iyLat,
          Iz: izVert,
          J: j,
          shearAreaY: (5 / 6) * area,
          shearAreaZ: (5 / 6) * area,
        },
        modifiers: {
          axial: 1,
          bendingY: modBeam,
          bendingZ: modBeam,
          torsion: 0.15,
          shearY: 1,
          shearZ: 1,
        },
        theory: "timoshenko",
        releases,
        uniformLocal: [0, -wGravKnM, 0],
      });
    }

    // Distribute slab seismic mass (G + 0.3Q) across floor top nodes
    const slabData = slabsByFloor.get(fl.id);
    const slabMassT = slabData ? (slabData.deadKn + 0.3 * slabData.liveKn) / GRAVITY_MPS2 : 0;
    if (topIds.length > 0 && slabMassT > 0) {
      const share = slabMassT / topIds.length;
      for (const id of topIds) addNodeMass(id, share);
    }

    floorTopNodes.set(fl.id, topIds);
  }

  // Build RigidDiaphragms AFTER all floor loops so upper-storey column bottom masses are included in centerXY
  const diaphragms: RigidDiaphragm[] = [];
  for (const fl of activeFloors) {
    const topIds = floorTopNodes.get(fl.id) ?? [];
    if (topIds.length < 3) continue;
    const items = topIds.map((id) => {
      const idx = Number(id.slice(2));
      const pos = nodes[idx].position;
      return { id, x: pos[0], y: pos[1], mass: nodeMassTonnes.get(id) ?? 0.01 };
    });
    const totalM = items.reduce((s, it) => s + it.mass, 0);
    if (totalM <= 0) continue;
    const cx = items.reduce((s, it) => s + it.mass * it.x, 0) / totalM;
    const cy = items.reduce((s, it) => s + it.mass * it.y, 0) / totalM;
    diaphragms.push({
      id: fl.id,
      centerXY: [cx, cy],
      nodeIds: items.map((it) => it.id),
      decisionSource: "bridge_floor_diaphragm",
      accidental: null,
    });
  }

  const inertias: NodeInertia[] = nodes.map((n) => {
    const m = n.prescribed.every((v) => v !== null) ? 0 : nodeMassTonnes.get(n.id) ?? 0.01;
    return { nodeId: n.id, values: [m, m, 0, 0, 0, 0], source: "explicit" };
  });

  const modalInput: ModalStructureInput = {
    nodes,
    frames,
    shells: [],
    inertias,
    rigidDiaphragms: diaphragms,
    foundation: null,
    directions: [
      { id: "X", requiredFraction: 0.95 },
      { id: "Y", requiredFraction: 0.95 },
      { id: "RZ", requiredFraction: 0.95 },
    ],
    rotationOrigin: diaphragms[0] ? [diaphragms[0].centerXY[0], diaphragms[0].centerXY[1], 0] : [0, 0, 0],
    analysisPart: superstructureOnly ? "upper_mass" : "whole",
  };

  const totalMassTonnes = inertias.reduce((s, it) => s + it.values[0], 0);
  return {
    activeFloors,
    nodes,
    frames,
    diaphragms,
    modalInput,
    totalMassTonnes,
    columnM3,
    wallM3,
    beamM3,
    floorTopNodes,
  };
}

function summarizeModal(result: ReturnType<typeof solveModalStructure>): BridgeModalSummary {
  if (result.status !== "solved") {
    const diagReason =
      "diagnostic" in result && result.diagnostic && typeof result.diagnostic === "object" && "reason" in result.diagnostic
        ? String((result.diagnostic as { reason?: unknown }).reason)
        : undefined;
    return {
      status: "failed",
      modeCount: 0,
      coverageX: 0,
      coverageY: 0,
      coverageRZ: 0,
      modes: [],
      reason: "reason" in result && result.reason ? String(result.reason) : diagReason ? `${result.status}: ${diagReason}` : result.status,
    };
  }
  return {
    status: "solved",
    modeCount: result.modes.length,
    coverageX: result.coverage.X ?? 0,
    coverageY: result.coverage.Y ?? 0,
    coverageRZ: result.coverage.RZ ?? 0,
    modes: result.modes.map((m) => ({
      number: m.number,
      periodSeconds: m.periodSeconds,
      frequencyHz: 1 / m.periodSeconds,
      ux: m.participation.X.fraction,
      uy: m.participation.Y.fraction,
      rz: m.participation.RZ.fraction,
    })),
  };
}

function parseDiaSpacing(spec: string | undefined, fallbackDia: number, fallbackSpacingCm: number): { diaMm: number; spacingM: number } {
  if (!spec) return { diaMm: fallbackDia, spacingM: fallbackSpacingCm / 100 };
  const m = spec.match(/(\d+)\s*\/\s*(\d+(?:\.\d+)?)/);
  if (!m) return { diaMm: fallbackDia, spacingM: fallbackSpacingCm / 100 };
  const diaMm = Number(m[1]);
  const spacingCm = Number(m[2]);
  return {
    diaMm: Number.isFinite(diaMm) && diaMm >= 8 ? diaMm : fallbackDia,
    spacingM: Number.isFinite(spacingCm) && spacingCm >= 5 ? spacingCm / 100 : fallbackSpacingCm / 100,
  };
}

function buildRebarScheduleFromModel(
  model: CadModel,
  ideSource: NativeIdeProjectLike | undefined,
  revisionId: string,
  steelDensityKgM3: number,
  materialSpec: { fckMpa: number; fctkMpa: number; fykMpa: number; rebarGrade: string },
  _missingFacts: string[]
): ReinforcementScheduleResult {
  const bars: BarInput[] = [];
  const expectedElements: ExpectedElement[] = [];
  const seenElements = new Set<string>();
  const floorHeightMap = new Map(model.floors.map((f) => [f.id, Math.max(0.5, f.height)]));
  const rebarMatId = materialSpec.rebarGrade || "B420C";
  const fctdMpa = materialSpec.fctkMpa / 1.5;
  const fydMpa = materialSpec.fykMpa / 1.15;

  const ideElems = ideSource?.elements ?? [];
  const ideById = new Map<string, NativeIdeElementLike>();
  for (const ie of ideElems) {
    if (ie.id) ideById.set(ie.id, ie);
    if (ie.name) ideById.set(`${ie.floorId ?? ""}::${ie.name}`, ie);
  }

  const pushBar = (
    elementId: string,
    floorId: string,
    elementType: BarInput["elementType"],
    role: BarInput["role"],
    barIdSuffix: string,
    diameterMm: number,
    count: number,
    straightLenM: number,
    mode: BarInput["mode"],
    anchorage?: { startHookM?: number; endHookM?: number; lapLengthM?: number }
  ) => {
    if (diameterMm <= 0 || count <= 0 || straightLenM <= 0 || !Number.isFinite(straightLenM)) return;
    bars.push({
      id: `${elementId}_${barIdSuffix}`,
      elementId,
      floorId,
      elementType,
      role,
      materialId: rebarMatId,
      diameterMm,
      count: Math.max(1, Math.round(count)),
      steelDensityKgPerM3: steelDensityKgM3,
      geometry: createCenterlineGeometry([createStraightSegment([0, 0, 0], [straightLenM, 0, 0])], anchorage),
      mode,
      layoutRevisionId: revisionId,
    });
  };

  const registerExpected = (elementId: string, floorId: string, elementType: BarInput["elementType"]) => {
    const key = `${floorId}::${elementId}`;
    if (seenElements.has(key)) return false;
    seenElements.add(key);
    expectedElements.push({ elementId, floorId, elementType });
    return true;
  };

  // 1. Columns, Shear Walls, Beams, and Slabs in CadModel
  for (const el of model.elements) {
    if (el.type === "axis" || el.type === "slabEdge") continue;
    const flId = el.floorId;
    const floorH = floorHeightMap.get(flId) ?? 3.0;
    const nativeMatch = ideById.get(el.id) ?? ideById.get(`${flId}::${el.name}`);
    const layout = nativeMatch?.rebarLayout;

    if (el.type === "column") {
      if (!registerExpected(el.id, flId, "column")) continue;
      const b = Math.max(0.2, el.width ?? 0.3);
      const h = Math.max(0.2, el.depth ?? 0.3);
      const colH = Math.max(0.5, el.height ?? floorH);
      const mode: BarInput["mode"] = layout?.kind === "column" ? "verification" : "redesign";
      const barDia = layout?.kind === "column" ? layout.barDiaMm : 14;
      const barCount = layout?.kind === "column"
        ? Math.max(4, 2 * layout.majorCount + 2 * Math.max(0, layout.minorCount - 2))
        : Math.max(8, Math.ceil((0.01 * (b * 1000) * (h * 1000)) / (Math.PI * (barDia / 2) ** 2)));
      const lapM = 0.045 * barDia;
      pushBar(el.id, flId, "column", "longitudinal", "long", barDia, barCount, colH, mode, { lapLengthM: lapM });

      const tieDia = layout?.kind === "column" ? layout.stirrupDiaMm : 8;
      const tieSpM = layout?.kind === "column" && layout.stirrupSpacingCm.length > 0
        ? Math.min(...layout.stirrupSpacingCm) / 100
        : 0.12;
      const tiePerim = Math.max(0.4, 2 * (b - 0.05) + 2 * (h - 0.05));
      const tieHook = Math.max(0.08, 0.006 * tieDia);
      const tieCount = Math.ceil(colH / Math.max(0.08, tieSpM)) + 1;
      pushBar(el.id, flId, "column", "stirrup", "tie", tieDia, tieCount, tiePerim, mode, {
        startHookM: tieHook,
        endHookM: tieHook,
      });
    } else if (el.type === "wall") {
      if (!registerExpected(el.id, flId, "wall")) continue;
      const len = Math.hypot(el.end.x - el.start.x, el.end.y - el.start.y);
      if (len < 0.05) continue;
      const tw = Math.max(0.15, el.thickness ?? 0.25);
      const wallH = Math.max(0.5, el.height ?? floorH);
      const mode: BarInput["mode"] = layout?.kind === "wall" ? "verification" : "redesign";

      const headDia = layout?.kind === "wall" ? layout.headDiaMm : 14;
      const headCountTotal = layout?.kind === "wall"
        ? Math.max(8, 2 * layout.headCount)
        : Math.max(12, Math.ceil((0.002 * len * 1000 * tw * 1000) / (Math.PI * (headDia / 2) ** 2)));
      pushBar(el.id, flId, "wall", "longitudinal", "head_v", headDia, headCountTotal, wallH, mode, {
        lapLengthM: 0.045 * headDia,
      });

      const webDia = layout?.kind === "wall" ? layout.webDiaMm : 10;
      const webSpM = layout?.kind === "wall" ? Math.max(0.1, layout.webSpacingCm / 100) : 0.2;
      const webLen = Math.max(0.3, len * 0.6);
      const webVertCount = Math.max(4, 2 * (Math.floor(webLen / webSpM) + 1));
      pushBar(el.id, flId, "wall", "distribution", "web_v", webDia, webVertCount, wallH, mode, {
        lapLengthM: 0.045 * webDia,
      });

      const webHorizCount = Math.max(4, 2 * (Math.ceil(wallH / webSpM) + 1));
      pushBar(el.id, flId, "wall", "distribution", "web_h", webDia, webHorizCount, len, mode, {
        startHookM: 0.15,
        endHookM: 0.15,
      });

      const headTieDia = layout?.kind === "wall" ? layout.headStirrupDiaMm : 8;
      const headTieSpM = layout?.kind === "wall" ? Math.max(0.08, layout.headStirrupSpacingCm / 100) : 0.12;
      const headLen = Math.max(0.25, Math.min(len * 0.2, 1.0));
      const headTiePerim = Math.max(0.4, 2 * (headLen - 0.05) + 2 * (tw - 0.05));
      const headTieCount = 2 * (Math.ceil(wallH / headTieSpM) + 1);
      pushBar(el.id, flId, "wall", "stirrup", "head_tie", headTieDia, headTieCount, headTiePerim, mode, {
        startHookM: 0.08,
        endHookM: 0.08,
      });
    } else if (el.type === "beam") {
      if (!registerExpected(el.id, flId, "beam")) continue;
      const len = Math.hypot(el.end.x - el.start.x, el.end.y - el.start.y);
      if (len < 0.05) continue;
      const bw = Math.max(0.2, el.width ?? 0.25);
      const bh = Math.max(0.3, el.height ?? 0.5);
      const dMm = bh * 1000 - 35;
      const minAsMm2 = 0.8 * (fctdMpa / fydMpa) * (bw * 1000) * Math.max(150, dMm);
      const mode: BarInput["mode"] = layout?.kind === "beam" ? "verification" : "redesign";

      const topDia = layout?.kind === "beam" ? layout.topDiaMm : 12;
      const topCount = layout?.kind === "beam"
        ? Math.max(2, layout.topCount)
        : Math.max(3, Math.ceil(minAsMm2 / (Math.PI * (topDia / 2) ** 2)));
      const botDia = layout?.kind === "beam" ? layout.bottomDiaMm : 12;
      const botCount = layout?.kind === "beam"
        ? Math.max(2, layout.bottomCount)
        : Math.max(3, Math.ceil(minAsMm2 / (Math.PI * (botDia / 2) ** 2)));
      const anchM = Math.max(0.35, 0.04 * Math.max(topDia, botDia));

      pushBar(el.id, flId, "beam", "main_top", "top", topDia, topCount, len, mode, {
        startHookM: anchM,
        endHookM: anchM,
      });
      pushBar(el.id, flId, "beam", "main_bottom", "bot", botDia, botCount, len, mode, {
        startHookM: anchM,
        endHookM: anchM,
      });

      const stirDia = layout?.kind === "beam" ? layout.stirrupDiaMm : 8;
      const stirSpM = layout?.kind === "beam" && layout.stirrupSpacingCm.length > 0
        ? Math.min(...layout.stirrupSpacingCm) / 100
        : 0.15;
      const stirPerim = Math.max(0.4, 2 * (bw - 0.05) + 2 * (bh - 0.05));
      const stirCount = Math.ceil(len / Math.max(0.08, stirSpM)) + 1;
      pushBar(el.id, flId, "beam", "stirrup", "stir", stirDia, stirCount, stirPerim, mode, {
        startHookM: 0.08,
        endHookM: 0.08,
      });
    } else if (el.type === "slab") {
      if (nativeMatch && isRaftElement(nativeMatch)) continue;
      if (!registerExpected(el.id, flId, "slab")) continue;
      const areaM2 = el.points.length >= 3 ? polygonArea2D(el.points) : 0;
      if (areaM2 <= 0) continue;
      const xs = el.points.map((p) => p.x);
      const ys = el.points.map((p) => p.y);
      const lx = Math.max(0.5, Math.max(...xs) - Math.min(...xs));
      const ly = Math.max(0.5, Math.max(...ys) - Math.min(...ys));
      const effLx = Math.min(lx, Math.sqrt(areaM2 * (lx / ly)));
      const effLy = areaM2 / Math.max(0.5, effLx);

      // TS 500 11.4.5 slab mesh (bottom X+Y + support top X+Y)
      const slabDia = 8;
      const spacingM = 0.2;
      const countX = Math.ceil(effLy / spacingM) + 1;
      const countY = Math.ceil(effLx / spacingM) + 1;
      pushBar(el.id, flId, "slab", "main_bottom", "bx", slabDia, countX, effLx, "redesign", { startHookM: 0.12, endHookM: 0.12 });
      pushBar(el.id, flId, "slab", "main_bottom", "by", slabDia, countY, effLy, "redesign", { startHookM: 0.12, endHookM: 0.12 });
      pushBar(el.id, flId, "slab", "main_top", "tx", slabDia, Math.ceil(countX * 0.5), effLx * 0.5, "redesign", { startHookM: 0.12, endHookM: 0.12 });
      pushBar(el.id, flId, "slab", "main_top", "ty", slabDia, Math.ceil(countY * 0.5), effLy * 0.5, "redesign", { startHookM: 0.12, endHookM: 0.12 });
    }
  }

  // 2. Native IdeProject slabs (e.g. hollow slabs) and raft foundations not in CadModel.elements
  for (let i = 0; i < ideElems.length; i++) {
    const ie = ideElems[i];
    if (ie.type !== "slab" && ie.type !== "raft" && ie.type !== "foundation") continue;
    const elemId = ie.id ?? ie.name ?? `IDE_SLAB_${i}`;
    const flId = ie.floorId ?? model.floors[0]?.id ?? "F0";
    const isRaft = isRaftElement(ie);
    const elType: BarInput["elementType"] = isRaft ? "foundation" : "slab";
    if (!registerExpected(elemId, flId, elType)) continue;

    const poly = ie.points ?? ie.polygon;
    if (!poly || poly.length < 3) continue;
    let areaM2 = polygonArea2D(poly);
    if (ie.holes) {
      for (const h of ie.holes) areaM2 -= polygonArea2D(h);
    }
    if (areaM2 <= 0) continue;
    const xs = poly.map((p) => p.x);
    const ys = poly.map((p) => p.y);
    const lx = Math.max(0.5, Math.max(...xs) - Math.min(...xs));
    const ly = Math.max(0.5, Math.max(...ys) - Math.min(...ys));
    const effLx = Math.min(lx, Math.sqrt(areaM2 * (lx / ly)));
    const effLy = areaM2 / Math.max(0.5, effLx);

    if (isRaft) {
      const r4 = ie.rebarLayout?.kind === "raft" ? ie.rebarLayout : undefined;
      const mode: BarInput["mode"] = r4 ? "verification" : "redesign";
      const bxSpec = parseDiaSpacing(r4?.bottomX, 14, 15);
      const bySpec = parseDiaSpacing(r4?.bottomY, 14, 15);
      const txSpec = parseDiaSpacing(r4?.topX, 14, 15);
      const tySpec = parseDiaSpacing(r4?.topY, 14, 15);
      pushBar(elemId, flId, "foundation", "main_bottom", "rbx", bxSpec.diaMm, Math.ceil(effLy / bxSpec.spacingM) + 1, effLx, mode, { startHookM: 0.25, endHookM: 0.25 });
      pushBar(elemId, flId, "foundation", "main_bottom", "rby", bySpec.diaMm, Math.ceil(effLx / bySpec.spacingM) + 1, effLy, mode, { startHookM: 0.25, endHookM: 0.25 });
      pushBar(elemId, flId, "foundation", "main_top", "rtx", txSpec.diaMm, Math.ceil(effLy / txSpec.spacingM) + 1, effLx, mode, { startHookM: 0.25, endHookM: 0.25 });
      pushBar(elemId, flId, "foundation", "main_top", "rty", tySpec.diaMm, Math.ceil(effLx / tySpec.spacingM) + 1, effLy, mode, { startHookM: 0.25, endHookM: 0.25 });
    } else {
      const slabDia = 8;
      const spacingM = 0.2;
      const countX = Math.ceil(effLy / spacingM) + 1;
      const countY = Math.ceil(effLx / spacingM) + 1;
      pushBar(elemId, flId, "slab", "main_bottom", "bx", slabDia, countX, effLx, "redesign", { startHookM: 0.12, endHookM: 0.12 });
      pushBar(elemId, flId, "slab", "main_bottom", "by", slabDia, countY, effLy, "redesign", { startHookM: 0.12, endHookM: 0.12 });
      pushBar(elemId, flId, "slab", "main_top", "tx", slabDia, Math.ceil(countX * 0.5), effLx * 0.5, "redesign", { startHookM: 0.12, endHookM: 0.12 });
      pushBar(elemId, flId, "slab", "main_top", "ty", slabDia, Math.ceil(countY * 0.5), effLy * 0.5, "redesign", { startHookM: 0.12, endHookM: 0.12 });
    }
  }

  return computeReinforcementSchedule({
    bars,
    projectRevisionId: revisionId,
    expectedElements,
    classificationProfile: DEFAULT_CLASSIFICATION_PROFILE,
  });
}

export function executeStructuralBridge(
  model: CadModel,
  options: StructuralBridgeOptions = {}
): StructuralBridgeResult {
  const revisionId = options.revisionId ?? `rev_${model.floors.length}_${model.elements.length}`;
  const ideSource = (model as unknown as { ideImport?: { source?: NativeIdeProjectLike } }).ideImport?.source;
  const missingFacts: string[] = [];

  const material = resolveMaterialSpec(model, ideSource, options);
  const spectrum = resolveSpectrumSpec(ideSource, options, missingFacts);
  const floors = [...model.floors].sort((a, b) => a.elevation - b.elevation);
  const { slabsByFloor, raftVolumeM3, slabCount, raftCount, stairCount } = computeFloorVerticalAndSlabData(
    floors,
    model,
    ideSource
  );

  const cracked = options.crackedInertia ?? true;
  const hasBasement = floors.some(isBasementFloor) && floors.some((f) => !isBasementFloor(f));
  const fullAsm = assemble3DFemSystem(model, floors, slabsByFloor, material.ecMpa, cracked, false);
  const upperAsm = hasBasement && !options.includeBasementInUpperModal
    ? assemble3DFemSystem(model, floors, slabsByFloor, material.ecMpa, cracked, true)
    : null;

  const maxModes = options.maxModes ?? Math.max(15, floors.length * 3);
  const eigenOpts = { maxModes, maxIterations: 200, relativeEigenTolerance: 1e-5, pivotTolerance: 1e-13 };
  const fullEigenRes = fullAsm.frames.length > 0 && fullAsm.diaphragms.length > 0
    ? solveModalStructure(fullAsm.modalInput, eigenOpts)
    : ({ status: "invalid_input", reason: "No 3D frames or diaphragms", analysisApproved: false } as const);
  const upperEigenRes = upperAsm && upperAsm.frames.length > 0 && upperAsm.diaphragms.length > 0
    ? solveModalStructure(upperAsm.modalInput, eigenOpts)
    : null;

  const modalFull = summarizeModal(fullEigenRes);
  const modalUpper = upperEigenRes ? summarizeModal(upperEigenRes) : null;

  const designAsm = upperAsm ?? fullAsm;
  const designModal = modalUpper?.status === "solved" ? modalUpper : modalFull;
  const rx = options.rx ?? ideSource?.tbdySettings?.rx ?? 7;
  const ry = options.ry ?? ideSource?.tbdySettings?.ry ?? 7;
  const dx = options.dx ?? ideSource?.tbdySettings?.dx ?? 2.5;
  const dy = options.dy ?? ideSource?.tbdySettings?.dy ?? 2.5;
  const imp = options.importanceFactor ?? ideSource?.tbdySettings?.importanceFactor ?? 1.0;

  // B1 Weak storey shear areas
  const weakInputs = designAsm.activeFloors.map((fl) => {
    const cols = model.elements.filter((e): e is ColumnElement => e.type === "column" && e.floorId === fl.id);
    const walls = model.elements.filter((e): e is WallElement => e.type === "wall" && e.floorId === fl.id);
    const colAreas = cols.map((c) => (c.width ?? 0.3) * (c.depth ?? 0.3));
    const wallX: number[] = [];
    const wallY: number[] = [];
    for (const w of walls) {
      const dxw = Math.abs(w.end.x - w.start.x);
      const dyw = Math.abs(w.end.y - w.start.y);
      const len = Math.hypot(dxw, dyw);
      const tw = w.thickness ?? 0.25;
      if (dxw >= dyw) wallX.push(len * tw);
      else wallY.push(len * tw);
    }
    if (colAreas.length + wallX.length === 0) colAreas.push(0.01);
    if (colAreas.length + wallY.length === 0) colAreas.push(0.01);
    return {
      id: fl.id,
      X: { columnAreas: colAreas, wallAreas: wallX, infillArea: 0, infillType: "separated" as const, source: `model:${fl.id}` },
      Y: { columnAreas: colAreas, wallAreas: wallY, infillArea: 0, infillType: "separated" as const, source: `model:${fl.id}` },
    };
  });
  const b1 = weakInputs.length > 0
    ? weakStoreys(weakInputs)
    : { checks: [], minimumEta: 1, factor: 1 };

  const rxEff = b1.factor !== null && b1.factor < 1 ? Math.max(1, rx * b1.factor) : rx;
  const ryEff = b1.factor !== null && b1.factor < 1 ? Math.max(1, ry * b1.factor) : ry;

  const t1X = designModal.modes.find((m) => m.ux >= m.uy)?.periodSeconds ?? designModal.modes[0]?.periodSeconds ?? 0.4;
  const t1Y = designModal.modes.find((m) => m.uy > m.ux)?.periodSeconds ?? designModal.modes[0]?.periodSeconds ?? 0.4;
  const saX = evaluateSpectrum(spectrum, t1X, { R: rxEff, D: dx, I: imp }).reducedMps2;
  const saY = evaluateSpectrum(spectrum, t1Y, { R: ryEff, D: dy, I: imp }).reducedMps2;
  const eqShearX = designAsm.totalMassTonnes > 0
    ? equivalentBaseShear(designAsm.totalMassTonnes, saX, spectrum.sds, imp)
    : 1;
  const eqShearY = designAsm.totalMassTonnes > 0
    ? equivalentBaseShear(designAsm.totalMassTonnes, saY, spectrum.sds, imp)
    : 1;

  const specXRes = designAsm.frames.length > 0 && designAsm.diaphragms.length > 0
    ? responseSpectrum(
        designAsm.modalInput,
        eigenOpts,
        spectrum,
        {
          id: "X",
          reduction: { R: rxEff, D: dx, I: imp },
          orientation: "horizontal",
          equivalentCheck: {
            shearKn: eqShearX,
            irregularity: { A1: false, B2: false, B3: false, decisionSource: "bridge_initial" },
          },
        },
        "CQC",
        0.05
      )
    : ({ status: "invalid_input", reason: "No frames/diaphragms" } as const);

  const specYRes = designAsm.frames.length > 0 && designAsm.diaphragms.length > 0
    ? responseSpectrum(
        designAsm.modalInput,
        eigenOpts,
        spectrum,
        {
          id: "Y",
          reduction: { R: ryEff, D: dy, I: imp },
          orientation: "horizontal",
          equivalentCheck: {
            shearKn: eqShearY,
            irregularity: { A1: false, B2: false, B3: false, decisionSource: "bridge_initial" },
          },
        },
        "CQC",
        0.05
      )
    : ({ status: "invalid_input", reason: "No frames/diaphragms" } as const);

  // Gravity linear solve (1.0G)
  const gravRes = fullAsm.frames.length > 0
    ? solveLinearStructure(fullAsm.nodes, fullAsm.frames, [], null, { pivotTolerance: 1e-13 })
    : ({ status: "invalid_input", reason: "No frames" } as const);

  let maxDispM = 0;
  let verticalReactionSumKn = 0;
  if (gravRes.status === "solved") {
    for (const nd of gravRes.nodes) {
      const dm = Math.hypot(nd.displacement[0], nd.displacement[1], nd.displacement[2]);
      if (dm > maxDispM) maxDispM = dm;
      verticalReactionSumKn += nd.fixedReaction[2];
    }
  }

  // Extract storey drifts, A1, B2, and second-order thetaII
  const a1Checks: GlobalControl[] = [];
  const b2Checks: GlobalControl[] = [];
  const driftChecks: GlobalControl[] = [];
  const dd3: StandardSpectrum = { ...spectrum, hazard: "DD-3" };

  const nodeIdxMap = new Map(designAsm.nodes.map((n, i) => [n.id, i]));
  const storeySummaries: BridgeStoreySummary[] = [];

  for (let i = 0; i < designAsm.activeFloors.length; i++) {
    const fl = designAsm.activeFloors[i];
    const topIds = designAsm.floorTopNodes.get(fl.id) ?? [];
    const prevTopIds = i > 0 ? designAsm.floorTopNodes.get(designAsm.activeFloors[i - 1].id) ?? [] : [];

    const computeCornerDrifts = (specRes: typeof specXRes, comp: 0 | 1): number[] => {
      if (specRes.status !== "solved" || topIds.length === 0) return [];
      const topDisps = topIds.map((id) => {
        const idx = nodeIdxMap.get(id);
        return idx !== undefined ? specRes.nodes[idx].displacement.maxima[comp] : 0;
      });
      const prevDisps = prevTopIds.length > 0
        ? prevTopIds.map((id) => {
            const idx = nodeIdxMap.get(id);
            return idx !== undefined ? specRes.nodes[idx].displacement.maxima[comp] : 0;
          })
        : [0];
      const prevAvg = prevDisps.reduce((s, v) => s + v, 0) / prevDisps.length;
      return topDisps.map((d) => Math.max(1e-7, Math.abs(d - prevAvg)));
    };

    const driftsX = computeCornerDrifts(specXRes, 0);
    const driftsY = computeCornerDrifts(specYRes, 1);

    let etaBiX: number | null = null;
    let etaBiY: number | null = null;
    if (driftsX.length > 0) {
      const cA1X = torsionalIrregularity(`${fl.id}:X`, driftsX, `bridge_cqc_${fl.id}`, true);
      a1Checks.push(cA1X);
      if (cA1X.observed && typeof cA1X.observed === "object" && "etaB" in cA1X.observed) {
        etaBiX = (cA1X.observed as { etaB: number }).etaB;
      }
    }
    if (driftsY.length > 0) {
      const cA1Y = torsionalIrregularity(`${fl.id}:Y`, driftsY, `bridge_cqc_${fl.id}`, true);
      a1Checks.push(cA1Y);
      if (cA1Y.observed && typeof cA1Y.observed === "object" && "etaB" in cA1Y.observed) {
        etaBiY = (cA1Y.observed as { etaB: number }).etaB;
      }
    }

    const maxDriftX = driftsX.length > 0 ? Math.max(...driftsX) : null;
    const maxDriftY = driftsY.length > 0 ? Math.max(...driftsY) : null;
    if (maxDriftX !== null && fl.height > 0) {
      driftChecks.push(
        storeyDriftCheck(`${fl.id}:X`, {
          rawMaxM: maxDriftX,
          heightM: fl.height,
          R: rxEff,
          I: imp,
          dominantPeriod: t1X,
          dd2: spectrum,
          dd3,
          infill: "attached",
          separatedCapacitySource: null,
          driftScale: 1,
          source: `bridge_cqc_${fl.id}`,
        })
      );
    }
    if (maxDriftY !== null && fl.height > 0) {
      driftChecks.push(
        storeyDriftCheck(`${fl.id}:Y`, {
          rawMaxM: maxDriftY,
          heightM: fl.height,
          R: ryEff,
          I: imp,
          dominantPeriod: t1Y,
          dd2: spectrum,
          dd3,
          infill: "attached",
          separatedCapacitySource: null,
          driftScale: 1,
          source: `bridge_cqc_${fl.id}`,
        })
      );
    }

    const diag = designAsm.diaphragms.find((d) => d.id === fl.id);
    const slab = slabsByFloor.get(fl.id);
    const flMass = (slab ? (slab.deadKn + 0.3 * slab.liveKn) / GRAVITY_MPS2 : 0);

    storeySummaries.push({
      floorId: fl.id,
      floorName: fl.name,
      index: i,
      elevationM: fl.elevation,
      heightM: fl.height,
      isBasement: isBasementFloor(fl),
      massTonnes: flMass,
      weightKn: flMass * GRAVITY_MPS2,
      centerOfMass: diag ? diag.centerXY : [0, 0],
      etaBiX,
      etaBiY,
      driftRatioX: maxDriftX !== null && fl.height > 0 ? maxDriftX / fl.height : null,
      driftRatioY: maxDriftY !== null && fl.height > 0 ? maxDriftY / fl.height : null,
      etaKiX: null,
      etaKiY: null,
      weakStoreyEtaX: null,
      weakStoreyEtaY: null,
      thetaIIX: null,
      thetaIIY: null,
    });
  }

  // B2 Soft storey & Second-order checks
  for (let i = 0; i < storeySummaries.length; i++) {
    const cur = storeySummaries[i];
    const neighbors = [storeySummaries[i - 1], storeySummaries[i + 1]].filter(
      (n): n is BridgeStoreySummary => !!n && n.driftRatioX !== null && n.heightM > 0
    );
    if (cur.driftRatioX !== null && neighbors.length > 0) {
      b2Checks.push(
        softStorey(
          `${cur.floorId}:X`,
          { drift: cur.driftRatioX * cur.heightM, height: cur.heightM },
          neighbors.map((n) => ({ drift: (n.driftRatioX ?? 0) * n.heightM, height: n.heightM })),
          cur.isBasement,
          `bridge_cqc_${cur.floorId}`
        )
      );
    }
  }

  const secondOrderChecks: GlobalControl[] = storeySummaries.length > 0 && specXRes.status === "solved"
    ? [
        secondOrder(
          storeySummaries.map((s) => ({
            id: s.floorId,
            averageDriftM: (s.driftRatioX ?? 0) * s.heightM,
            weightAboveKn: Math.max(1, designAsm.totalMassTonnes * GRAVITY_MPS2),
            shearKn: Math.max(1, specXRes.baseShearKn),
            heightM: Math.max(0.5, s.heightM),
            part: s.isBasement ? "basement" : "upper",
          })),
          rxEff,
          dx,
          hasBasement,
          "bridge_cqc_second_order"
        ).control,
      ]
    : [];

  const totalSlabM3 = Array.from(slabsByFloor.values()).reduce((s, v) => s + v.volumeM3, 0);
  const quantities: BridgeConcreteQuantities = {
    totalConcreteM3: fullAsm.columnM3 + fullAsm.wallM3 + fullAsm.beamM3 + totalSlabM3 + raftVolumeM3,
    columnM3: fullAsm.columnM3,
    wallM3: fullAsm.wallM3,
    beamM3: fullAsm.beamM3,
    slabM3: totalSlabM3,
    foundationM3: raftVolumeM3,
  };

  const reinforcementSchedule = buildRebarScheduleFromModel(
    model,
    ideSource,
    revisionId,
    material.steelDensityKgM3,
    material,
    missingFacts
  );

  const hasAnyIrregularity =
    a1Checks.some((c) => c.finding === true) ||
    b1.checks.some((c) => c.finding === true) ||
    b2Checks.some((c) => c.finding === true);

  return {
    status: modalFull.status === "solved" && gravRes.status === "solved" ? (missingFacts.length > 0 ? "incomplete" : "solved") : "failed",
    revisionId,
    modelMode: cracked ? "cracked_tbdy" : "uncracked",
    material,
    spectrum,
    counts: {
      floors: floors.length,
      nodes: fullAsm.nodes.length,
      frames: fullAsm.frames.length,
      columns: model.elements.filter((e) => e.type === "column").length,
      walls: model.elements.filter((e) => e.type === "wall").length,
      beams: model.elements.filter((e) => e.type === "beam").length,
      slabs: slabCount,
      rafts: raftCount,
      stairs: stairCount,
    },
    quantities,
    totalMassTonnes: fullAsm.totalMassTonnes,
    upperMassTonnes: designAsm.totalMassTonnes,
    modalFull,
    modalUpper,
    spectrumX: {
      direction: "X",
      status: specXRes.status === "solved" ? "solved" : "failed",
      elasticBaseShearKn: specXRes.status === "solved" && "modalShearKn" in specXRes.scaling ? specXRes.scaling.modalShearKn : 0,
      equivalentBaseShearKn: eqShearX,
      designBaseShearKn: specXRes.status === "solved" ? specXRes.baseShearKn : 0,
      beta: specXRes.status === "solved" ? specXRes.scaling.beta : 1,
      gamma: specXRes.status === "solved" ? (specXRes.scaling.gamma ?? 0.8) : 0.8,
      reason: specXRes.status !== "solved" && "reason" in specXRes ? String(specXRes.reason) : undefined,
    },
    spectrumY: {
      direction: "Y",
      status: specYRes.status === "solved" ? "solved" : "failed",
      elasticBaseShearKn: specYRes.status === "solved" && "modalShearKn" in specYRes.scaling ? specYRes.scaling.modalShearKn : 0,
      equivalentBaseShearKn: eqShearY,
      designBaseShearKn: specYRes.status === "solved" ? specYRes.baseShearKn : 0,
      beta: specYRes.status === "solved" ? specYRes.scaling.beta : 1,
      gamma: specYRes.status === "solved" ? (specYRes.scaling.gamma ?? 0.8) : 0.8,
      reason: specYRes.status !== "solved" && "reason" in specYRes ? String(specYRes.reason) : undefined,
    },
    gravitySolve: {
      status: gravRes.status,
      maxDisplacementM: maxDispM,
      verticalReactionSumKn,
    },
    storeys: storeySummaries,
    globalChecks: {
      A1: a1Checks,
      B1: {
        checks: b1.checks,
        minimumEta: b1.minimumEta,
        rReductionFactor: b1.factor,
      },
      B2: b2Checks,
      drift: driftChecks,
      secondOrder: secondOrderChecks,
      rigidBasementVerified: hasBasement ? modalUpper?.status === "solved" : null,
      hasAnyIrregularity,
    },
    reinforcementSchedule,
    missingFacts,
  };
}
