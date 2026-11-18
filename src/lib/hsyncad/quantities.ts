import { distance, elementFootprint, elementVerticalRange, polygonArea, polygonPerimeter } from "./geometry";
import { resolveJunctions, type JunctionResult } from "./junctions";
import {
  isSolidElement,
  type BeamElement,
  type CadModel,
  type ColumnElement,
  type Floor,
  type Point,
  type SlabElement,
  type SolidElement,
  type WallElement,
} from "./model";
import { effectiveThickness } from "./definitions";
import type { ConcreteDesignResult } from "./design-engine";
import type { ReinforcementScheduleResult } from "./structural/reinforcement-schedule";

export type QuantityRow = {
  type: SolidElement["type"];
  count: number;
  grossVolume: number;
  netVolume: number | null;
  formwork: number;
};
export type QuantityResult = {
  rows: QuantityRow[];
  grossVolume: number;
  netVolume: number | null;
  overlapVolume: number | null;
  formwork: number;
  assumptions: string[];
  warnings: string[];
};
const TYPES = ["column", "beam", "wall", "slab"] as const;

export interface ElementTakeoffItem {
  id: string;
  name: string;
  type: string;
  floorName: string;
  concreteM3: number | null;
  formworkM2: number | null;
  rebarKg: number | null;
  rebarText: string;
}

export interface StoryTakeoffSummary {
  concreteM3: number | null;
  formworkM2: number | null;
  rebarKg: number | null;
  thinKg: number | null;
  thickKg: number | null;
  byDiameter: Record<number, number>;
}

export interface ComprehensiveTakeoffResult {
  integrityVersion: 2;
  status: "partial" | "verified" | "empty";
  concreteVolumeM3: {
    total: number | null;
    grossTotal: number;
    byElement: Record<string, number | null>;
    byFloor: Record<string, number | null>;
  };
  formworkAreaM2: {
    total: number | null;
    grossTotal?: number;
    basis: "gross_geometry" | "net_deducted";
    byElement: Record<string, number | null>;
    byFloor: Record<string, number | null>;
  };
  rebarTonnage: {
    totalKg: number | null;
    totalTons: number | null;
    thinKg: number | null;
    thickKg: number | null;
    knownSubtotalKg: number;
    missingElementIds: string[];
    source: "user_entered_mass" | "verified_schedule";
    cutListVerified: boolean;
    byDiameter: Record<number, number>;
    byElement: Record<string, number | null>;
    byFloor: Record<string, StoryTakeoffSummary>;
  };
  summary: {
    steelDensityKgM3: number | null;
    formworkToConcreteRatio: number | null;
    totalElements: number;
  };
  elementBreakdown: ElementTakeoffItem[];
  assumptions: string[];
  warnings: string[];
}

export interface IdeTakeoffOptions {
  deductFormworkOverlaps?: boolean;
  rebarSchedule?: ReinforcementScheduleResult | null;
}

/** Authoritative ideCAD Metraj classification threshold (#80 Flag A): <= 12 mm (Ø8–Ø12) = İNCE, >= Ø14 = KALIN. */
export const IDE_REBAR_THIN_MAX_DIAMETER_MM = 12;

/** Standard ideCAD / TS 708 diameter order for Metraj tables. */
export const IDE_METRAJ_DIAMETERS = [8, 10, 12, 14, 16, 18, 20, 22, 24, 25, 26, 28, 30, 32] as const;

/** Mevcut nominal kg/m tablosu; gerçek donatı yerleşiminin veya TS708 kabulünün kanıtı değildir. */
export const REBAR_UNIT_WEIGHTS: Record<number, number> = {
  8: 0.395, 10: 0.617, 12: 0.888, 14: 1.208, 16: 1.578, 18: 1.998, 20: 2.466,
  22: 2.984, 24: 3.551, 25: 3.853, 26: 4.168, 28: 4.834, 30: 5.549, 32: 6.313,
};

/** Exact native ideCAD rebar mass formula (0x141df3b30:179): d_m * pi * d_m * count * 1962.5 * L_m (1962.5 = 7850 / 4). */
export function computeIdeRebarMassKg(diameterMm: number, lengthM: number, count = 1): number {
  if (!Number.isFinite(diameterMm) || diameterMm <= 0 || !Number.isFinite(lengthM) || lengthM < 0 || !Number.isFinite(count) || count < 0) {
    return 0;
  }
  const dM = diameterMm / 1000;
  return dM * Math.PI * dM * count * 1962.5 * lengthM;
}

export function isThinRebarDiameter(diameterMm: number): boolean {
  return diameterMm <= IDE_REBAR_THIN_MAX_DIAMETER_MM;
}

const add = (a: number | null, b: number | null): number | null => (a === null || b === null ? null : a + b);

function verticalOverlap(a: [number, number], b: [number, number]): number {
  return Math.max(0, Math.min(a[1], b[1]) - Math.max(a[0], b[0]));
}

function pointInPolygon(p: Point, poly: readonly Point[]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i].x;
    const yi = poly[i].y;
    const xj = poly[j].x;
    const yj = poly[j].y;
    if ((yi > p.y) !== (yj > p.y) && p.x < ((xj - xi) * (p.y - yi)) / (yj - yi + 1e-30) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

function pointNearPolygon(p: Point, poly: readonly Point[], tol: number): boolean {
  if (pointInPolygon(p, poly)) return true;
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const lenSq = dx * dx + dy * dy;
    const t = lenSq > 1e-12 ? Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / lenSq)) : 0;
    const px = a.x + t * dx;
    const py = a.y + t * dy;
    if (Math.hypot(p.x - px, p.y - py) <= tol) return true;
  }
  return false;
}

function sampleSegmentCoverageFraction(
  start: Point,
  end: Point,
  check: (p: Point) => boolean,
  samples = 24
): number {
  let hits = 0;
  for (let i = 0; i < samples; i++) {
    const t = (i + 0.5) / samples;
    const p = { x: start.x + (end.x - start.x) * t, y: start.y + (end.y - start.y) * t };
    if (check(p)) hits++;
  }
  return hits / samples;
}

function grossElementFormwork(element: SolidElement, bottom: number, top: number): number {
  const footprint = elementFootprint(element);
  if (element.type === "column" && ((element.leanX ?? 0) !== 0 || (element.leanY ?? 0) !== 0)) {
    return footprint.reduce((sum, p, i) => {
      const q = footprint[(i + 1) % footprint.length];
      const dx = q.x - p.x;
      const dy = q.y - p.y;
      return sum + Math.hypot((top - bottom) * Math.hypot(dx, dy), dx * (element.leanY ?? 0) - dy * (element.leanX ?? 0));
    }, 0);
  }
  if (element.type === "column" || element.type === "wall") {
    return polygonPerimeter(footprint) * (top - bottom);
  }
  if (element.type === "beam") {
    return (
      polygonArea(footprint) *
        Math.hypot(1, ((element.endTopOffset ?? element.topOffset ?? 0) - (element.topOffset ?? 0)) / distance(element.start, element.end)) +
      polygonPerimeter(footprint) * element.height
    );
  }
  return (
    polygonArea(footprint) * Math.hypot(1, (element.slopeX ?? 0) / 100, (element.slopeY ?? 0) / 100) +
    polygonPerimeter(footprint) * effectiveThickness(element)
  );
}

/**
 * Compute ideCAD Metraj net formwork areas per element with joint overlap deductions:
 * - Columns (0x140b30b40 + 0x140b34950): deduct beam/wall intersection contact area (b * h_overlap).
 * - Beams (0x140b30b40 + 0x140b364c0): clear span net length L_net inside columns/walls, no end-cap
 *   formwork inside supports, and deduct attached slab thickness along left/right side faces.
 * - Walls (0x140b30b40): clear length L_net minus column overlaps, plus attached slab thickness deduction.
 * - Slabs (0x140b30b40): net soffit area from resolved non-overlapping junction parts + free unframed edges * t.
 */
export function calculateIdeNetFormworkByElement(
  model: CadModel,
  junctions: JunctionResult = resolveJunctions(model)
): Record<string, number> {
  const floors = new Map<string, Floor>(model.floors.map((f) => [f.id, f]));
  const solids = model.elements.filter(isSolidElement);
  const prepared = solids.map((el) => {
    const floor = floors.get(el.floorId);
    if (!floor) throw new Error(`${el.name}: net kalıp hesabı için kat bulunamadı.`);
    return {
      el,
      footprint: elementFootprint(el),
      z: elementVerticalRange(el, floor),
      grossFw: grossElementFormwork(el, ...elementVerticalRange(el, floor)),
    };
  });

  const columns = prepared.filter((p) => p.el.type === "column") as Array<{
    el: ColumnElement;
    footprint: Point[];
    z: [number, number];
    grossFw: number;
  }>;
  const walls = prepared.filter((p) => p.el.type === "wall") as Array<{
    el: WallElement;
    footprint: Point[];
    z: [number, number];
    grossFw: number;
  }>;
  const beams = prepared.filter((p) => p.el.type === "beam") as Array<{
    el: BeamElement;
    footprint: Point[];
    z: [number, number];
    grossFw: number;
  }>;
  const slabs = prepared.filter((p) => p.el.type === "slab") as Array<{
    el: SlabElement;
    footprint: Point[];
    z: [number, number];
    grossFw: number;
  }>;

  const netSlabSoffitMap = new Map<string, number>();
  if (junctions.status === "resolved") {
    for (const part of junctions.parts) {
      if (part.type === "slab") {
        const h = Math.max(part.top - part.bottom, 1e-6);
        netSlabSoffitMap.set(part.elementId, (netSlabSoffitMap.get(part.elementId) ?? 0) + part.volume / h);
      }
    }
  }

  const out: Record<string, number> = {};

  for (const col of columns) {
    let deduction = 0;
    for (const b of beams) {
      const zOv = verticalOverlap(col.z, b.z);
      if (zOv <= 1e-6) continue;
      // Check if beam footprint intersects/touches column footprint (0x140b34950)
      const beamHitsCol =
        sampleSegmentCoverageFraction(b.el.start, b.el.end, (pt) => pointNearPolygon(pt, col.footprint, b.el.width * 0.5 + 0.01), 40) > 0;
      if (beamHitsCol) {
        // Each beam meeting a column removes b_beam * zOv from the column vertical formwork
        // (up to 2 faces if passing cleanly through)
        const endsInCol =
          (pointNearPolygon(b.el.start, col.footprint, 0.02) ? 1 : 0) +
          (pointNearPolygon(b.el.end, col.footprint, 0.02) ? 1 : 0);
        const passThrough = endsInCol === 0 ? 2 : endsInCol;
        deduction += passThrough * b.el.width * zOv;
      }
    }
    for (const w of walls) {
      const zOv = verticalOverlap(col.z, w.z);
      if (zOv <= 1e-6) continue;
      const hits =
        sampleSegmentCoverageFraction(w.el.start, w.el.end, (pt) => pointNearPolygon(pt, col.footprint, w.el.thickness * 0.5 + 0.01), 40) > 0;
      if (hits) {
        const endsInCol =
          (pointNearPolygon(w.el.start, col.footprint, 0.02) ? 1 : 0) +
          (pointNearPolygon(w.el.end, col.footprint, 0.02) ? 1 : 0);
        const faces = endsInCol === 0 ? 2 : endsInCol;
        deduction += faces * w.el.thickness * zOv;
      }
    }
    out[col.el.id] = Math.max(0, Math.min(col.grossFw, col.grossFw - deduction));
  }

  for (const b of beams) {
    const len = distance(b.el.start, b.el.end);
    if (len <= 1e-9) {
      out[b.el.id] = 0;
      continue;
    }
    // Clear span net length outside columns and walls (0x140b364c0)
    const blockedFrac = sampleSegmentCoverageFraction(
      b.el.start,
      b.el.end,
      (pt) =>
        columns.some((c) => verticalOverlap(c.z, b.z) > 1e-6 && pointNearPolygon(pt, c.footprint, 0.005)) ||
        walls.some((w) => verticalOverlap(w.z, b.z) > 1e-6 && pointNearPolygon(pt, w.footprint, 0.005)),
      48
    );
    const netLen = len * Math.max(0, 1 - blockedFrac);
    const dx = (b.el.end.x - b.el.start.x) / len;
    const dy = (b.el.end.y - b.el.start.y) / len;
    const nx = -dy;
    const ny = dx;
    const probeOffset = b.el.width * 0.5 + 0.04;

    let attachedSlabThicknessSum = 0;
    for (const side of [-1, 1] as const) {
      let sideMaxSlabFrac = 0;
      for (const s of slabs) {
        const zOv = verticalOverlap(b.z, s.z);
        if (zOv <= 1e-6) continue;
        const tSlab = effectiveThickness(s.el);
        const sideFrac = sampleSegmentCoverageFraction(
          { x: b.el.start.x + nx * side * probeOffset, y: b.el.start.y + ny * side * probeOffset },
          { x: b.el.end.x + nx * side * probeOffset, y: b.el.end.y + ny * side * probeOffset },
          (pt) => pointInPolygon(pt, s.footprint),
          24
        );
        const effDeduct = Math.min(b.el.height, Math.min(zOv, tSlab)) * sideFrac;
        if (effDeduct > sideMaxSlabFrac) sideMaxSlabFrac = effDeduct;
      }
      attachedSlabThicknessSum += sideMaxSlabFrac;
    }

    const slopeFactor = Math.hypot(
      1,
      ((b.el.endTopOffset ?? b.el.topOffset ?? 0) - (b.el.topOffset ?? 0)) / len
    );
    // 0x140b30b40:422: netLen * (b + 2*h - sum(attached_slab_t))
    const soffit = b.el.width * netLen * slopeFactor;
    const sides = Math.max(0, 2 * b.el.height - attachedSlabThicknessSum) * netLen;
    out[b.el.id] = Math.max(0, Math.min(b.grossFw, soffit + sides));
  }

  for (const w of walls) {
    const len = distance(w.el.start, w.el.end);
    if (len <= 1e-9) {
      out[w.el.id] = 0;
      continue;
    }
    const blockedFrac = sampleSegmentCoverageFraction(
      w.el.start,
      w.el.end,
      (pt) => columns.some((c) => verticalOverlap(c.z, w.z) > 1e-6 && pointNearPolygon(pt, c.footprint, 0.005)),
      48
    );
    const netLen = len * Math.max(0, 1 - blockedFrac);
    const wallH = w.z[1] - w.z[0];
    const dx = (w.el.end.x - w.el.start.x) / len;
    const dy = (w.el.end.y - w.el.start.y) / len;
    const nx = -dy;
    const ny = dx;
    const probeOffset = w.el.thickness * 0.5 + 0.04;

    let slabDeductH = 0;
    for (const side of [-1, 1] as const) {
      let sideDeduct = 0;
      for (const s of slabs) {
        const zOv = verticalOverlap(w.z, s.z);
        if (zOv <= 1e-6) continue;
        const sideFrac = sampleSegmentCoverageFraction(
          { x: w.el.start.x + nx * side * probeOffset, y: w.el.start.y + ny * side * probeOffset },
          { x: w.el.end.x + nx * side * probeOffset, y: w.el.end.y + ny * side * probeOffset },
          (pt) => pointInPolygon(pt, s.footprint),
          24
        );
        sideDeduct = Math.max(sideDeduct, Math.min(zOv, effectiveThickness(s.el)) * sideFrac);
      }
      slabDeductH += sideDeduct;
    }
    const faceFw = Math.max(0, 2 * wallH - slabDeductH) * netLen;
    const exposedEnds =
      (columns.some((c) => verticalOverlap(c.z, w.z) > 1e-6 && pointNearPolygon(w.el.start, c.footprint, 0.02)) ? 0 : 1) +
      (columns.some((c) => verticalOverlap(c.z, w.z) > 1e-6 && pointNearPolygon(w.el.end, c.footprint, 0.02)) ? 0 : 1);
    const endFw = exposedEnds * w.el.thickness * wallH;
    out[w.el.id] = Math.max(0, Math.min(w.grossFw, faceFw + endFw));
  }

  for (const s of slabs) {
    const slopeFactor = Math.hypot(1, (s.el.slopeX ?? 0) / 100, (s.el.slopeY ?? 0) / 100);
    const rawSoffit = netSlabSoffitMap.get(s.el.id) ?? polygonArea(s.footprint);
    const soffit = rawSoffit * slopeFactor;
    const slabT = effectiveThickness(s.el);

    // Free perimeter edges NOT bounded by a beam, wall, or column
    let freeEdgeLen = 0;
    const pts = s.footprint;
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i];
      const b = pts[(i + 1) % pts.length];
      const edgeLen = distance(a, b);
      if (edgeLen <= 1e-9) continue;
      const framedFrac = sampleSegmentCoverageFraction(
        a,
        b,
        (pt) =>
          beams.some((bm) => verticalOverlap(bm.z, s.z) > 1e-6 && pointNearPolygon(pt, bm.footprint, 0.03)) ||
          walls.some((wl) => verticalOverlap(wl.z, s.z) > 1e-6 && pointNearPolygon(pt, wl.footprint, 0.03)) ||
          columns.some((cl) => verticalOverlap(cl.z, s.z) > 1e-6 && pointNearPolygon(pt, cl.footprint, 0.03)),
        24
      );
      freeEdgeLen += edgeLen * Math.max(0, 1 - framedFrac);
    }
    out[s.el.id] = Math.max(0, Math.min(s.grossFw, soffit + freeEdgeLen * slabT));
  }

  return out;
}

/** Proje adından bağımsız geometri metrajı. Donatı As değerinden kesim boyu uydurulmaz. */
export function calculateFullTakeoff(
  model: CadModel,
  _designResult?: ConcreteDesignResult,
  junctions: JunctionResult = resolveJunctions(model),
  options?: IdeTakeoffOptions
): ComprehensiveTakeoffResult {
  const deductFormwork = Boolean(options?.deductFormworkOverlaps);
  const netFormworkMap = deductFormwork ? calculateIdeNetFormworkByElement(model, junctions) : null;
  const rebarSchedule = options?.rebarSchedule ?? null;
  const hasVerifiedSchedule = Boolean(
    rebarSchedule && rebarSchedule.isComplete && rebarSchedule.totalMassKg !== null
  );

  // Build verified schedule lookups per element & floor
  const verifiedMassByElement = new Map<string, number>();
  const verifiedByDiameter: Record<number, number> = {};
  const verifiedFloorDiameters = new Map<string, Record<number, number>>();
  const verifiedFloorThin = new Map<string, number>();
  const verifiedFloorThick = new Map<string, number>();
  const verifiedFloorTotal = new Map<string, number>();
  const floorIdToName = new Map(model.floors.map((f) => [f.id, f.name]));

  if (hasVerifiedSchedule && rebarSchedule) {
    for (const dSub of rebarSchedule.subtotalsByDiameter) {
      verifiedByDiameter[dSub.diameterMm] = (verifiedByDiameter[dSub.diameterMm] ?? 0) + dSub.totalMassKg;
    }
    for (const bar of rebarSchedule.uniqueBars) {
      verifiedMassByElement.set(bar.elementId, (verifiedMassByElement.get(bar.elementId) ?? 0) + bar.totalMassKg);
      const flName = floorIdToName.get(bar.floorId) ?? bar.floorId;
      const dMap = verifiedFloorDiameters.get(flName) ?? {};
      dMap[bar.diameterMm] = (dMap[bar.diameterMm] ?? 0) + bar.totalMassKg;
      verifiedFloorDiameters.set(flName, dMap);
      verifiedFloorTotal.set(flName, (verifiedFloorTotal.get(flName) ?? 0) + bar.totalMassKg);
      if (isThinRebarDiameter(bar.diameterMm)) {
        verifiedFloorThin.set(flName, (verifiedFloorThin.get(flName) ?? 0) + bar.totalMassKg);
      } else {
        verifiedFloorThick.set(flName, (verifiedFloorThick.get(flName) ?? 0) + bar.totalMassKg);
      }
    }
  }

  const concreteByElement: Record<string, number | null> = {};
  const concreteByFloor: Record<string, number | null> = {};
  const formworkByElement: Record<string, number | null> = {};
  const formworkByFloor: Record<string, number | null> = {};
  const rebarByElement: Record<string, number | null> = {};
  const stories: Record<string, StoryTakeoffSummary> = {};
  const elements = model.elements.filter(isSolidElement);
  const missingElementIds: string[] = [];
  const warnings = [...junctions.warnings];
  let knownSubtotalKg = 0;
  let grossFormworkTotal = 0;

  for (const floor of model.floors) {
    // Görünür ad kimlik değildir; aynı adlı katlar bir sunum grubunda toplanır.
    concreteByFloor[floor.name] ??= 0;
    formworkByFloor[floor.name] ??= 0;
    stories[floor.name] ??= {
      concreteM3: 0,
      formworkM2: 0,
      rebarKg: hasVerifiedSchedule ? (verifiedFloorTotal.get(floor.name) ?? 0) : 0,
      thinKg: hasVerifiedSchedule ? (verifiedFloorThin.get(floor.name) ?? 0) : null,
      thickKg: hasVerifiedSchedule ? (verifiedFloorThick.get(floor.name) ?? 0) : null,
      byDiameter: hasVerifiedSchedule ? { ...(verifiedFloorDiameters.get(floor.name) ?? {}) } : {},
    };
  }

  const elementBreakdown: ElementTakeoffItem[] = elements.map((element) => {
    const floor = model.floors.find((f) => f.id === element.floorId);
    const floorName = floor?.name ?? `Kat bulunamadı: ${element.floorId}`;
    if (!stories[floorName]) {
      stories[floorName] = {
        concreteM3: 0,
        formworkM2: 0,
        rebarKg: hasVerifiedSchedule ? (verifiedFloorTotal.get(floorName) ?? 0) : 0,
        thinKg: hasVerifiedSchedule ? (verifiedFloorThin.get(floorName) ?? 0) : null,
        thickKg: hasVerifiedSchedule ? (verifiedFloorThick.get(floorName) ?? 0) : null,
        byDiameter: hasVerifiedSchedule ? { ...(verifiedFloorDiameters.get(floorName) ?? {}) } : {},
      };
      concreteByFloor[floorName] = 0;
      formworkByFloor[floorName] = 0;
    }

    const candidateNet = junctions.status === "resolved" ? junctions.byElement[element.id]?.netVolume : null;
    const net = typeof candidateNet === "number" && Number.isFinite(candidateNet) && candidateNet >= 0 ? candidateNet : null;
    const grossFormwork = floor ? calculateQuantities({ ...model, elements: [element] }, junctions).formwork : null;
    if (grossFormwork !== null && Number.isFinite(grossFormwork)) grossFormworkTotal += grossFormwork;
    const candidateFw = netFormworkMap ? (netFormworkMap[element.id] ?? grossFormwork) : grossFormwork;
    const formwork = candidateFw !== null && Number.isFinite(candidateFw) ? candidateFw : null;

    let rebarKg: number | null;
    let rebarText: string;
    if (hasVerifiedSchedule) {
      rebarKg = verifiedMassByElement.get(element.id) ?? 0;
      knownSubtotalKg += rebarKg;
      rebarText = "Doğrulanmış donatı kesim listesi";
    } else {
      const declared = element.rebarMass;
      rebarKg = typeof declared === "number" && Number.isFinite(declared) && declared >= 0 ? declared : null;
      if (rebarKg === null) missingElementIds.push(element.id);
      else knownSubtotalKg += rebarKg;
      rebarText =
        rebarKg === null
          ? "Bilinmiyor - kesim listesi yok"
          : "Kullanıcının beyan ettiği kütle; kesim listesi doğrulanmadı";
    }

    for (const [map, value] of [
      [concreteByElement, net],
      [formworkByElement, formwork],
      [rebarByElement, rebarKg],
    ] as const) {
      map[element.type] = add(map[element.type] === undefined ? 0 : map[element.type], value);
    }
    concreteByFloor[floorName] = add(concreteByFloor[floorName], net);
    formworkByFloor[floorName] = add(formworkByFloor[floorName], formwork);
    const story = stories[floorName];
    story.concreteM3 = add(story.concreteM3, net);
    story.formworkM2 = add(story.formworkM2, formwork);
    if (!hasVerifiedSchedule) {
      story.rebarKg = add(story.rebarKg, rebarKg);
    }
    if (!floor) warnings.push(`${element.id}: kat bulunamadı; metraj eksik.`);
    return {
      id: element.id,
      name: element.name,
      type: element.type,
      floorName,
      concreteM3: net,
      formworkM2: formwork,
      rebarKg,
      rebarText,
    };
  });

  const sum = (values: (number | null)[]) => values.reduce<number | null>(add, 0);
  const concrete = sum(Object.values(concreteByElement));
  const formwork = sum(Object.values(formworkByElement));

  const totalKg = hasVerifiedSchedule
    ? rebarSchedule!.totalMassKg!
    : missingElementIds.length
      ? null
      : knownSubtotalKg;

  // Enforce #80 Flag A: thinKg = <= 12 mm (Ø8–Ø12), thickKg = >= 14 mm (Ø14+)
  let thinKg: number | null = elements.length ? null : 0;
  let thickKg: number | null = elements.length ? null : 0;
  if (hasVerifiedSchedule) {
    let thinSum = 0;
    let thickSum = 0;
    for (const [diamStr, kg] of Object.entries(verifiedByDiameter)) {
      const diam = Number(diamStr);
      if (isThinRebarDiameter(diam)) thinSum += kg;
      else thickSum += kg;
    }
    thinKg = thinSum;
    thickKg = thickSum;
  }

  if (!hasVerifiedSchedule && missingElementIds.length) {
    warnings.push(`${missingElementIds.length} elemanda donatı kütlesi bilinmiyor; toplam verilmedi.`);
  }
  if (model.ideImport?.references.length) {
    warnings.push(`${model.ideImport.references.length} native referans hesap modelinde yok; proje metrajı tam değildir.`);
  }
  if (!hasVerifiedSchedule || !deductFormwork) {
    warnings.push("Gerçek donatı kesim listesi ve net kalıp temas profili henüz doğrulanmadı.");
  }

  const basis: "gross_geometry" | "net_deducted" = deductFormwork ? "net_deducted" : "gross_geometry";
  const status: ComprehensiveTakeoffResult["status"] =
    elements.length === 0 ? "empty" : hasVerifiedSchedule && deductFormwork && concrete !== null ? "verified" : "partial";

  return {
    integrityVersion: 2,
    status,
    concreteVolumeM3: { total: concrete, grossTotal: junctions.grossVolume, byElement: concreteByElement, byFloor: concreteByFloor },
    formworkAreaM2: { total: formwork, grossTotal: grossFormworkTotal, basis, byElement: formworkByElement, byFloor: formworkByFloor },
    rebarTonnage: {
      totalKg,
      totalTons: totalKg === null ? null : totalKg / 1000,
      thinKg,
      thickKg,
      knownSubtotalKg: hasVerifiedSchedule ? totalKg! : knownSubtotalKg,
      missingElementIds: hasVerifiedSchedule ? [] : missingElementIds,
      source: hasVerifiedSchedule ? "verified_schedule" : "user_entered_mass",
      cutListVerified: hasVerifiedSchedule,
      byDiameter: hasVerifiedSchedule ? verifiedByDiameter : {},
      byElement: rebarByElement,
      byFloor: stories,
    },
    summary: {
      steelDensityKgM3: concrete !== null && concrete > 0 && totalKg !== null ? totalKg / concrete : null,
      formworkToConcreteRatio: concrete !== null && concrete > 0 && formwork !== null ? formwork / concrete : null,
      totalElements: elements.length,
    },
    elementBreakdown,
    assumptions: [
      "Beton: mevcut net geometri motoru; başarısız net hesap brütle doldurulmaz.",
      deductFormwork
        ? "Kalıp net alan hesabı: kolon-kiriş/perde birleşim yüzeyleri, kiriş net açıklığı ve kiriş/perde yan yüzlerindeki döşeme kalınlığı temas düşümleri uygulanır."
        : "Kalıp brüt geometrik alandır; ortak temas yüzleri düşülmedi. TS500 ölçüm kuralı iddia edilmez.",
      hasVerifiedSchedule
        ? "Donatı: doğrulanmış kesim listesi üzerinden çap ve boy hesabı yapılır; Ø8–Ø12 (<=12 mm) İnce, >=Ø14 Kalın sınıfındadır."
        : "Donatı yalnız açık kullanıcı kütlesinden alınır. Alan/donatı oranı/isim/standart çap varsayımıyla tonaj üretilmez.",
      "Beyan edilen sıfır ile eksik değer ayrıdır. Çap ve ince/kalın dağılımı kütleden çıkarılamaz.",
    ],
    warnings,
  };
}

export function calculateQuantities(
  model: CadModel,
  junctions: JunctionResult = resolveJunctions(model),
  options?: { deductFormworkOverlaps?: boolean }
): QuantityResult {
  const rows: QuantityRow[] = TYPES.map((type) => ({
    type,
    count: 0,
    grossVolume: 0,
    netVolume: junctions.status === "resolved" ? 0 : null,
    formwork: 0,
  }));
  const byType = Object.fromEntries(rows.map((row) => [row.type, row])) as Record<SolidElement["type"], QuantityRow>;
  const floors = new Map(model.floors.map((f) => [f.id, f]));
  const netFormworkMap = options?.deductFormworkOverlaps ? calculateIdeNetFormworkByElement(model, junctions) : null;

  for (const element of model.elements) {
    if (!isSolidElement(element)) continue;
    const floor = floors.get(element.floorId);
    if (!floor) throw new Error(`${element.name}: metraj için kat bulunamadı.`);
    const row = byType[element.type];
    const footprint = elementFootprint(element);
    const [bottom, top] = elementVerticalRange(element, floor);
    row.count++;
    row.grossVolume +=
      polygonArea(footprint) *
      (element.type === "slab" ? effectiveThickness(element) : element.type === "beam" ? element.height : top - bottom);
    if (row.netVolume !== null) row.netVolume += junctions.byElement[element.id]?.netVolume ?? 0;
    row.formwork += netFormworkMap
      ? netFormworkMap[element.id] ?? grossElementFormwork(element, bottom, top)
      : grossElementFormwork(element, bottom, top);
  }

  return {
    rows,
    grossVolume: rows.reduce((sum, row) => sum + row.grossVolume, 0),
    netVolume: junctions.netVolume,
    overlapVolume: junctions.overlapVolume,
    formwork: rows.reduce((sum, row) => sum + row.formwork, 0),
    warnings: junctions.warnings,
    assumptions: [
      "Bütün uzunluklar metre; beton m³, kalıp m². Akslar metraja girmez. Metraj tüm katları ve gizli katmanlardaki elemanları kapsar.",
      "Kat yüksekliğine bağlı kolon/perde: alt = kat kotu + alt kot farkı, üst = kat tavanı + üst kot farkı. Sabit yükseklikte üst = alt + yükseklik + üst kot farkı. Kiriş/döşeme üst yüzü kat tavanı + kot farkıdır.",
      "Beton hacmi ve 3B görünüm aynı kesişmeyen katı parçalardan üretilir. Eğik elemanlar ve konkav döşemeler desteklenir. Ortak hacim kolon → perde → kiriş → döşeme, aynı tipte kimlik sırasıyla tek elemana atanır.",
      "Nokta bağları plan koordinatlarını ilişkilendirir. Bağlı iki elemanın kotları arasında kesin düşey açıklık varsa ayrıca uyarı gösterilir; geometrik net hacim yine hesaplanır. Bu denetim mühendislik bağlantısı veya taşıma gücü doğrulaması değildir.",
      "Birleşim toleransı 0,00000001 m. İşlem/parça sınırı veya geometri hatasında net metraj verilmez ve katı parçalar üretilmez; brüt değer net yerine kullanılmaz.",
      options?.deductFormworkOverlaps
        ? "Kalıp net alan hesabı: birleşim temas düşümleri uygulanır (kolon-kiriş/perde teması, kiriş/perde döşeme kalınlığı ve döşeme boş kenar kontrolü)."
        : "Kalıp brüttür; birleşimlerdeki temas yüzeyleri düşülmez. Kolon/perde: çevre × gerçek yükseklik. Kiriş: (b + 2h) × boy + 2bh (iki uç dahil). Döşeme: alt alan + çevre × kalınlık.",
      "Daireler seçilen kenar sayısıyla, eğrisel perdeler seçilen yay parçasıyla çokgenleştirilir; hacim ve 3B aynı yaklaşımı kullanır. Eğimli döşemelerde kalınlık düşeydir; kot ilk köşede, X/Y eğimleri yüzde cinsindedir. Katmanlı döşeme kalınlığı tanımlı beton katmanlarının toplamıdır. Kaplama yükü ve hareketli yük ayrıca saklanır; taşıma gücü hesabı yapılmaz.",
      "Boşluklar, donatı, fire, çalışma payları ve yapım sırası yoktur. Bu geometrik ön metraj; taşıma gücü, deprem veya TBDY uygunluk hesabı değildir.",
    ],
  };
}
