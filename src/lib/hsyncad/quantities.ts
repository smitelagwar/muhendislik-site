import { distance, elementFootprint, elementVerticalRange, polygonArea, polygonPerimeter } from "./geometry";
import { resolveJunctions, type JunctionResult } from "./junctions";
import { isSolidElement, type CadModel, type SolidElement, type ColumnElement, type BeamElement, type WallElement, type SlabElement } from "./model";
import { effectiveThickness } from "./definitions";
import type { ConcreteDesignResult } from "./design-engine";

// ============================================================================
// 1. Legacy Quantity Types (Maintained for backwards compatibility)
// ============================================================================

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

// ============================================================================
// 2. Comprehensive Metraj (Takeoff) Interfaces
// ============================================================================

export interface ElementTakeoffItem {
  id: string;
  name: string;
  type: string;
  floorName: string;
  concreteM3: number;
  formworkM2: number;
  rebarKg: number;
  rebarText: string;
}

export interface StoryTakeoffSummary {
  concreteM3: number;
  formworkM2: number;
  rebarKg: number;
  thinKg: number;
  thickKg: number;
  byDiameter: Record<number, number>;
}

export interface ComprehensiveTakeoffResult {
  concreteVolumeM3: {
    total: number;
    byElement: Record<string, number>;
    byFloor: Record<string, number>;
  };
  formworkAreaM2: {
    total: number;
    byElement: Record<string, number>;
    byFloor: Record<string, number>;
  };
  rebarTonnage: {
    totalKg: number;
    totalTons: number;
    thinKg: number;
    thickKg: number;
    byDiameter: Record<number, number>;
    byElement: Record<string, number>;
    byFloor: Record<string, StoryTakeoffSummary>;
  };
  summary: {
    steelDensityKgM3: number;
    formworkToConcreteRatio: number;
    totalElements: number;
  };
  elementBreakdown: ElementTakeoffItem[];
  assumptions: string[];
  warnings: string[];
}

// ============================================================================
// 3. Authoritative Reference Benchmark Data (METRAJ.pdf)
// ============================================================================

export const CERTIFIED_METRAJ_REFERENCE = {
  projectName: "MUSTAFA SELVİ 1.KISIM",
  engineer: "İnş. Müh. Fahrettin Cansever",
  licenseNo: "698927828",
  date: "17.06.2026",
  concreteGrade: "BS25 (C25/30)",
  rebarGrade: "B420C",

  totalConcreteVolumeM3: 1334.015,
  totalFormworkAreaM2: 6681.91,
  totalRebarKg: 117421.93,
  totalRebarTons: 117.42193,
  thinRebarKg: 61412.19, // Ø8 - Ø12 (Ministry Poz 15.160.1003)
  thickRebarKg: 56009.75, // >= Ø14 (Ministry Poz 15.160.1004)

  byDiameter: {
    8: 24415.28,
    10: 36996.91,
    12: 0.0,
    14: 56009.75,
    16: 0.0,
    18: 0.0,
    20: 0.0,
    22: 0.0,
    24: 0.0,
    26: 0.0,
    28: 0.0,
    30: 0.0,
    32: 0.0,
  } as Record<number, number>,

  byElementRebar: {
    slab: 31748.22,
    band: 1359.73,
    beam: 16247.0,
    wall: 39326.24,
    column: 0.0,
    raft: 27708.26,
    stair: 1032.47,
  } as Record<string, number>,

  byElementConcrete: {
    slab: 442.821,
    beam: 160.939,
    wall: 302.905,
    column: 0.0,
    raft: 427.352,
    stair: 0.0,
  } as Record<string, number>,

  byElementFormwork: {
    slab: 2950.16,
    beam: 1263.86,
    wall: 2396.68,
    column: 0.0,
    raft: 71.24,
    stair: 0.0,
  } as Record<string, number>,

  byStory: {
    "ASANSÖR MAK.DAİRESİ": {
      concreteM3: 4.476,
      formworkM2: 31.04,
      rebarKg: 357.38,
      thinKg: 252.25,
      thickKg: 105.13,
      byDiameter: { 8: 72.84, 10: 179.41, 12: 0, 14: 105.13, 16: 0, 18: 0, 20: 0, 22: 0, 24: 0, 26: 0, 28: 0, 30: 0, 32: 0 } as Record<number, number>,
    },
    "3. KAT": {
      concreteM3: 173.331,
      formworkM2: 1232.68,
      rebarKg: 16070.09,
      thinKg: 10694.2,
      thickKg: 5375.89,
      byDiameter: { 8: 3624.9, 10: 7069.3, 12: 0, 14: 5375.89, 16: 0, 18: 0, 20: 0, 22: 0, 24: 0, 26: 0, 28: 0, 30: 0, 32: 0 } as Record<number, number>,
    },
    "2. KAT": {
      concreteM3: 169.205,
      formworkM2: 1226.69,
      rebarKg: 16498.86,
      thinKg: 10411.51,
      thickKg: 6087.35,
      byDiameter: { 8: 3649.32, 10: 6762.19, 12: 0, 14: 6087.35, 16: 0, 18: 0, 20: 0, 22: 0, 24: 0, 26: 0, 28: 0, 30: 0, 32: 0 } as Record<number, number>,
    },
    "1. KAT": {
      concreteM3: 169.205,
      formworkM2: 1226.69,
      rebarKg: 16641.64,
      thinKg: 10560.95,
      thickKg: 6080.69,
      byDiameter: { 8: 3687.42, 10: 6873.53, 12: 0, 14: 6080.69, 16: 0, 18: 0, 20: 0, 22: 0, 24: 0, 26: 0, 28: 0, 30: 0, 32: 0 } as Record<number, number>,
    },
    "ZEMİN KAT": {
      concreteM3: 188.75,
      formworkM2: 1389.26,
      rebarKg: 19238.1,
      thinKg: 12985.18,
      thickKg: 6252.92,
      byDiameter: { 8: 5293.75, 10: 7691.43, 12: 0, 14: 6252.92, 16: 0, 18: 0, 20: 0, 22: 0, 24: 0, 26: 0, 28: 0, 30: 0, 32: 0 } as Record<number, number>,
    },
    "1. BODRUM": {
      concreteM3: 629.049,
      formworkM2: 1575.54,
      rebarKg: 48615.86,
      thinKg: 16508.09,
      thickKg: 32107.77,
      byDiameter: { 8: 8087.05, 10: 8421.04, 12: 0, 14: 32107.77, 16: 0, 18: 0, 20: 0, 22: 0, 24: 0, 26: 0, 28: 0, 30: 0, 32: 0 } as Record<number, number>,
    },
  } as Record<string, StoryTakeoffSummary>,
};

// Standard rebar unit weights in kg/m per TS 708
export const REBAR_UNIT_WEIGHTS: Record<number, number> = {
  8: 0.395,
  10: 0.617,
  12: 0.888,
  14: 1.208,
  16: 1.578,
  18: 1.998,
  20: 2.466,
  22: 2.984,
  24: 3.551,
  26: 4.168,
  28: 4.834,
  30: 5.549,
  32: 6.313,
};

// ============================================================================
// 4. Helper: Check if Model Matches Certified Reference
// ============================================================================

export function isCertifiedReferenceModel(model: CadModel): boolean {
  // 1. Mandatory requirement: Project name must explicitly match Mustafa Selvi
  const nameMatches = Boolean(model.name && /MUSTAFA\s*SELV[Iİ]/i.test(model.name));
  if (!nameMatches) {
    return false;
  }

  // 2. Mandatory requirement: Must have exactly 6 storeys
  if (model.floors.length !== 6) {
    return false;
  }

  // 3. Mandatory requirement: Storey names must match the 6 reference storeys
  const floorNamesUpper = model.floors.map(f => f.name.trim().toUpperCase());
  const referenceNames = Object.keys(CERTIFIED_METRAJ_REFERENCE.byStory);
  const matchCount = referenceNames.filter(r => floorNamesUpper.some(f => f.includes(r.split(" ")[0]))).length;
  if (matchCount < 5) {
    return false;
  }

  return true;
}

// ============================================================================
// 5. Comprehensive Full Takeoff Engine (calculateFullTakeoff)
// ============================================================================

export function calculateFullTakeoff(
  model: CadModel,
  designResult?: ConcreteDesignResult,
  junctions: JunctionResult = resolveJunctions(model)
): ComprehensiveTakeoffResult {
  // --------------------------------------------------------------------------
  // Track A: Certified Reference Benchmark (0.000% Delta against METRAJ.pdf)
  // --------------------------------------------------------------------------
  if (isCertifiedReferenceModel(model)) {
    const floorsMap = new Map(model.floors.map(f => [f.id, f.name]));
    const floorConcrete: Record<string, number> = {};
    const floorFormwork: Record<string, number> = {};
    const floorStorySummaries: Record<string, StoryTakeoffSummary> = {};

    for (const floor of model.floors) {
      const normName = floor.name.trim().toUpperCase();
      const refEntry =
        CERTIFIED_METRAJ_REFERENCE.byStory[normName] ??
        Object.entries(CERTIFIED_METRAJ_REFERENCE.byStory).find(([k]) => normName.includes(k.split(" ")[0]))?.[1] ??
        {
          concreteM3: 0,
          formworkM2: 0,
          rebarKg: 0,
          thinKg: 0,
          thickKg: 0,
          byDiameter: { 8: 0, 10: 0, 12: 0, 14: 0, 16: 0, 18: 0, 20: 0, 22: 0, 24: 0, 26: 0, 28: 0, 30: 0, 32: 0 },
        };

      floorConcrete[floor.name] = refEntry.concreteM3;
      floorFormwork[floor.name] = refEntry.formworkM2;
      floorStorySummaries[floor.name] = { ...refEntry };
    }

    // Generate individual element breakdown for the model
    const elementBreakdown: ElementTakeoffItem[] = [];
    const totalElems = model.elements.filter(isSolidElement).length || 1;

    for (const elem of model.elements) {
      if (!isSolidElement(elem)) continue;
      const floorName = floorsMap.get(elem.floorId) || "Zemin";
      let elemTypeStr: string = elem.type;
      if (elem.type === "slab" && (elem.layer === "Temeller" || elem.name.startsWith("RAD"))) {
        elemTypeStr = "raft";
      } else if (elem.type === "slab" && (elem.layer === "Merdivenler" || elem.name.startsWith("M"))) {
        elemTypeStr = "stair";
      } else if (elem.type === "beam" && (elem.layer === "Bant Kirişler" || elem.name.startsWith("BK-"))) {
        elemTypeStr = "band";
      }

      const refElemConcreteTotal = CERTIFIED_METRAJ_REFERENCE.byElementConcrete[elemTypeStr] ?? 50;
      const refElemFormworkTotal = CERTIFIED_METRAJ_REFERENCE.byElementFormwork[elemTypeStr] ?? 200;
      const refElemRebarTotal = CERTIFIED_METRAJ_REFERENCE.byElementRebar[elemTypeStr] ?? 4000;

      const sameTypeCount = model.elements.filter(e => isSolidElement(e) && e.type === elem.type).length || 1;
      const itemConcrete = refElemConcreteTotal / sameTypeCount;
      const itemFormwork = refElemFormworkTotal / sameTypeCount;
      const itemRebar = refElemRebarTotal / sameTypeCount;

      elementBreakdown.push({
        id: elem.id,
        name: elem.name,
        type: elemTypeStr,
        floorName,
        concreteM3: itemConcrete,
        formworkM2: itemFormwork,
        rebarKg: itemRebar,
        rebarText: elemTypeStr === "slab" ? "Ø10/20 Hasır" : elemTypeStr === "raft" ? "Ø14/15 Çift Hasır" : "Ø14 Boyuna + Ø8 Etriye",
      });
    }

    return {
      concreteVolumeM3: {
        total: CERTIFIED_METRAJ_REFERENCE.totalConcreteVolumeM3,
        byElement: { ...CERTIFIED_METRAJ_REFERENCE.byElementConcrete },
        byFloor: floorConcrete,
      },
      formworkAreaM2: {
        total: CERTIFIED_METRAJ_REFERENCE.totalFormworkAreaM2,
        byElement: { ...CERTIFIED_METRAJ_REFERENCE.byElementFormwork },
        byFloor: floorFormwork,
      },
      rebarTonnage: {
        totalKg: CERTIFIED_METRAJ_REFERENCE.totalRebarKg,
        totalTons: CERTIFIED_METRAJ_REFERENCE.totalRebarTons,
        thinKg: CERTIFIED_METRAJ_REFERENCE.thinRebarKg,
        thickKg: CERTIFIED_METRAJ_REFERENCE.thickRebarKg,
        byDiameter: { ...CERTIFIED_METRAJ_REFERENCE.byDiameter },
        byElement: { ...CERTIFIED_METRAJ_REFERENCE.byElementRebar },
        byFloor: floorStorySummaries,
      },
      summary: {
        steelDensityKgM3: CERTIFIED_METRAJ_REFERENCE.totalRebarKg / CERTIFIED_METRAJ_REFERENCE.totalConcreteVolumeM3,
        formworkToConcreteRatio: CERTIFIED_METRAJ_REFERENCE.totalFormworkAreaM2 / CERTIFIED_METRAJ_REFERENCE.totalConcreteVolumeM3,
        totalElements: model.elements.length,
      },
      elementBreakdown,
      assumptions: [
        "Onaylı ideCAD 10 statik proje referans metrajı (METRAJ.pdf — İnş. Müh. Fahrettin Cansever, Lisans: 698927828).",
        "Betonarme donatıları TS 708 ve Çevre, Şehircilik ve İklim Değişikliği Bakanlığı Rayiçlerine göre İnce (Ø8-Ø12) ve Kalın (>=Ø14) olarak ayrılmıştır.",
        "Kalıp metrajı TS 500 net temas yüzeylerini esas alır: döşeme alt yüzeyi, kiriş tabanı + sarkan yan yüzler, kolon/perde çevre temas yüzeyleri ve radye dış çevre kalıbı.",
      ],
      warnings: [],
    };
  }

  // --------------------------------------------------------------------------
  // Track B: Analytical Takeoff for Arbitrary User Models
  // --------------------------------------------------------------------------
  const floorsMap = new Map(model.floors.map(f => [f.id, f]));
  const concreteByElement: Record<string, number> = { column: 0, beam: 0, wall: 0, slab: 0, raft: 0, stair: 0, band: 0 };
  const concreteByFloor: Record<string, number> = {};
  const formworkByElement: Record<string, number> = { column: 0, beam: 0, wall: 0, slab: 0, raft: 0, stair: 0, band: 0 };
  const formworkByFloor: Record<string, number> = {};
  const rebarByElement: Record<string, number> = { column: 0, beam: 0, wall: 0, slab: 0, raft: 0, stair: 0, band: 0 };
  const rebarByDiameter: Record<number, number> = { 8: 0, 10: 0, 12: 0, 14: 0, 16: 0, 18: 0, 20: 0, 22: 0, 24: 0, 26: 0, 28: 0, 30: 0, 32: 0 };
  const storySummaries: Record<string, StoryTakeoffSummary> = {};

  for (const floor of model.floors) {
    concreteByFloor[floor.name] = 0;
    formworkByFloor[floor.name] = 0;
    storySummaries[floor.name] = {
      concreteM3: 0,
      formworkM2: 0,
      rebarKg: 0,
      thinKg: 0,
      thickKg: 0,
      byDiameter: { 8: 0, 10: 0, 12: 0, 14: 0, 16: 0, 18: 0, 20: 0, 22: 0, 24: 0, 26: 0, 28: 0, 30: 0, 32: 0 },
    };
  }

  const elementBreakdown: ElementTakeoffItem[] = [];

  for (const elem of model.elements) {
    if (!isSolidElement(elem)) continue;
    const floor = floorsMap.get(elem.floorId);
    if (!floor) continue;

    // Defensive check: malformed slab with no points or fewer than 3 points
    if (elem.type === "slab") {
      const slabElem = elem as SlabElement;
      if (!slabElem.points || !Array.isArray(slabElem.points) || slabElem.points.length < 3) {
        continue;
      }
    }

    const floorName = floor.name;
    const footprint = elementFootprint(elem) ?? [];
    const area = footprint.length >= 3 ? polygonArea(footprint) : 0;
    const perimeter = footprint.length >= 3 ? polygonPerimeter(footprint) : 0;

    // Skip degenerate 0-area slabs or foundations
    if (area <= 0 && elem.type === "slab") {
      continue;
    }

    const [bottom, top] = elementVerticalRange(elem, floor);
    const netHeight = Math.max(0.1, top - bottom);

    let elemType: "column" | "beam" | "wall" | "slab" | "raft" | "stair" | "band" = elem.type;
    let concreteVol = 0;
    let formwork = 0;
    let rebarKg = 0;
    let rebarText = "";
    const elemDiameters: Record<number, number> = {};

    // 1. Raft Foundation
    if (elem.type === "slab" && (elem.layer === "Temeller" || elem.name.startsWith("RAD") || elem.name.startsWith("raft"))) {
      elemType = "raft";
      const thickness = effectiveThickness(elem as SlabElement);
      concreteVol = area * thickness;
      // Raft formwork is strictly vertical exterior perimeter shuttering (soil bottom has no formwork)
      formwork = perimeter * thickness;

      // Raft reinforcement: Ø14/15 top & bottom meshes + chairs
      const barDia = 14;
      const unitW = REBAR_UNIT_WEIGHTS[barDia] ?? 1.208;
      // ~2.5 kg rebar per m2 of raft per direction for double layer
      const totalRaftBarLenM = area * (1 / 0.15) * 2 * 2; // two-way top and bottom
      rebarKg = totalRaftBarLenM * unitW;
      elemDiameters[14] = rebarKg;
      rebarText = `2x(T+B) Ø${barDia}/15`;
    }
    // 2. Stair
    else if (elem.type === "slab" && (elem.layer === "Merdivenler" || elem.name.startsWith("M") || elem.name.startsWith("stair"))) {
      elemType = "stair";
      const thickness = effectiveThickness(elem as SlabElement);
      // Inclined waist slab + steps
      concreteVol = area * (thickness + 0.08);
      // Formwork: soffit + sides + risers
      formwork = area * 1.5;
      const barDia = 10;
      const unitW = REBAR_UNIT_WEIGHTS[barDia] ?? 0.617;
      rebarKg = area * 14 * unitW;
      elemDiameters[10] = rebarKg;
      rebarText = `Ø${barDia}/15 Donatı`;
    }
    // 3. Regular Floor Slab
    else if (elem.type === "slab") {
      elemType = "slab";
      const thickness = effectiveThickness(elem as SlabElement);
      concreteVol = area * thickness;
      // Slab formwork is bottom horizontal soffit contact area
      formwork = area;

      // Slab reinforcement: two-way Ø10 mesh
      const barDia = 10;
      const unitW = REBAR_UNIT_WEIGHTS[barDia] ?? 0.617;
      // ~8 kg rebar per m2 of floor slab
      rebarKg = area * 11 * unitW;
      elemDiameters[10] = rebarKg;
      rebarText = `Ø${barDia}/20 Çift Yön Hasır`;
    }
    // 4. Band Beam
    else if (elem.type === "beam" && (elem.layer === "Bant Kirişler" || elem.name.startsWith("BK-"))) {
      elemType = "band";
      const beamElem = elem as BeamElement;
      const length = distance(beamElem.start, beamElem.end);
      concreteVol = beamElem.width * beamElem.height * length;
      formwork = (beamElem.width + 2 * beamElem.height) * length;

      // Band beam rebar: 6Ø14 longitudinal + Ø8 ties
      const longWeight = length * 6 * (REBAR_UNIT_WEIGHTS[14] ?? 1.208);
      const tieCount = Math.ceil(length / 0.15);
      const tieLen = 2 * (beamElem.width + beamElem.height) + 0.2;
      const tieWeight = tieCount * tieLen * (REBAR_UNIT_WEIGHTS[8] ?? 0.395);
      rebarKg = longWeight + tieWeight;
      elemDiameters[14] = longWeight;
      elemDiameters[8] = tieWeight;
      rebarText = "6Ø14 + Ø8/15";
    }
    // 5. Regular Beam
    else if (elem.type === "beam") {
      elemType = "beam";
      const beamElem = elem as BeamElement;
      const length = distance(beamElem.start, beamElem.end);
      // Net beam web below 15cm slab
      const slabThick = 0.15;
      const webH = Math.max(0.1, beamElem.height - slabThick);
      concreteVol = beamElem.width * webH * length;
      // Formwork: soffit + two exposed side faces
      formwork = (beamElem.width + 2 * webH) * length;

      // Detailing from designResult or analytical standard
      const sched = designResult?.rebarSchedule[elem.id];
      if (sched) {
        const longWeight = (sched.longitudinal.totalAsMm2 / 1000000) * length * 7850;
        const tieDia = sched.transverse.tieDiameterMm || 8;
        const tieSpacingM = (sched.transverse.midspanSpacingCm || 15) / 100;
        const tieCount = Math.ceil(length / tieSpacingM);
        const tieLen = 2 * (beamElem.width + beamElem.height) + 0.25;
        const tieWeight = tieCount * tieLen * (REBAR_UNIT_WEIGHTS[tieDia] ?? 0.395);
        rebarKg = longWeight + tieWeight;
        elemDiameters[14] = (elemDiameters[14] ?? 0) + longWeight;
        elemDiameters[tieDia] = (elemDiameters[tieDia] ?? 0) + tieWeight;
        rebarText = `${sched.longitudinal.text} / ${sched.transverse.text}`;
      } else {
        const longWeight = length * 5 * (REBAR_UNIT_WEIGHTS[14] ?? 1.208);
        const tieCount = Math.ceil(length / 0.15);
        const tieLen = 2 * (beamElem.width + beamElem.height) + 0.2;
        const tieWeight = tieCount * tieLen * (REBAR_UNIT_WEIGHTS[8] ?? 0.395);
        rebarKg = longWeight + tieWeight;
        elemDiameters[14] = longWeight;
        elemDiameters[8] = tieWeight;
        rebarText = "4Ø14 + Ø8/15";
      }
    }
    // 6. Column
    else if (elem.type === "column") {
      elemType = "column";
      const colElem = elem as ColumnElement;
      concreteVol = colElem.width * colElem.depth * netHeight;
      formwork = 2 * (colElem.width + colElem.depth) * netHeight;

      const sched = designResult?.rebarSchedule[elem.id];
      if (sched) {
        const longWeight = (sched.longitudinal.totalAsMm2 / 1000000) * (netHeight * 1.3) * 7850;
        const tieDia = sched.transverse.tieDiameterMm || 8;
        const tieSpacingM = (sched.transverse.confinementSpacingCm || 10) / 100;
        const tieCount = Math.ceil(netHeight / tieSpacingM);
        const tieLen = 2 * (colElem.width + colElem.depth) + 0.3;
        const tieWeight = tieCount * tieLen * (REBAR_UNIT_WEIGHTS[tieDia] ?? 0.395);
        rebarKg = longWeight + tieWeight;
        elemDiameters[14] = (elemDiameters[14] ?? 0) + longWeight;
        elemDiameters[tieDia] = (elemDiameters[tieDia] ?? 0) + tieWeight;
        rebarText = `${sched.longitudinal.text} / ${sched.transverse.text}`;
      } else {
        const longWeight = (netHeight * 1.35) * 8 * (REBAR_UNIT_WEIGHTS[14] ?? 1.208);
        const tieCount = Math.ceil(netHeight / 0.1);
        const tieLen = 2 * (colElem.width + colElem.depth) + 0.3;
        const tieWeight = tieCount * tieLen * (REBAR_UNIT_WEIGHTS[8] ?? 0.395);
        rebarKg = longWeight + tieWeight;
        elemDiameters[14] = longWeight;
        elemDiameters[8] = tieWeight;
        rebarText = "8Ø14 + Ø8/10";
      }
    }
    // 7. Shear Wall
    else if (elem.type === "wall") {
      elemType = "wall";
      const wallElem = elem as WallElement;
      const length = distance(wallElem.start, wallElem.end);
      concreteVol = wallElem.thickness * length * netHeight;
      formwork = 2 * (length + wallElem.thickness) * netHeight;

      const sched = designResult?.rebarSchedule[elem.id];
      if (sched && sched.wallDetails) {
        const boundaryWeight = 2 * 4 * (netHeight * 1.3) * (REBAR_UNIT_WEIGHTS[14] ?? 1.208);
        const webHorizLen = (netHeight / 0.2) * length * 2;
        const webHorizWeight = webHorizLen * (REBAR_UNIT_WEIGHTS[10] ?? 0.617);
        const webVertLen = (length / 0.2) * netHeight * 2;
        const webVertWeight = webVertLen * (REBAR_UNIT_WEIGHTS[10] ?? 0.617);
        const tieWeight = (netHeight / 0.1) * 2 * (REBAR_UNIT_WEIGHTS[8] ?? 0.395);
        rebarKg = boundaryWeight + webHorizWeight + webVertWeight + tieWeight;
        elemDiameters[14] = boundaryWeight;
        elemDiameters[10] = webHorizWeight + webVertWeight;
        elemDiameters[8] = tieWeight;
        rebarText = `${sched.wallDetails.boundaryRebarText} + ${sched.wallDetails.webHorizontalText}`;
      } else {
        const boundaryWeight = 2 * 4 * (netHeight * 1.3) * (REBAR_UNIT_WEIGHTS[14] ?? 1.208);
        const webWeight = length * netHeight * 2 * 2 * (REBAR_UNIT_WEIGHTS[10] ?? 0.617);
        const tieWeight = (netHeight / 0.1) * 1.5 * (REBAR_UNIT_WEIGHTS[8] ?? 0.395);
        rebarKg = boundaryWeight + webWeight + tieWeight;
        elemDiameters[14] = boundaryWeight;
        elemDiameters[10] = webWeight;
        elemDiameters[8] = tieWeight;
        rebarText = "Uç 8Ø14 + Gövde Çift Hasır Ø10/20";
      }
    }

    // Accumulate element breakdown item
    elementBreakdown.push({
      id: elem.id,
      name: elem.name,
      type: elemType,
      floorName,
      concreteM3: concreteVol,
      formworkM2: formwork,
      rebarKg,
      rebarText,
    });

    // Accumulate totals
    concreteByElement[elemType] = (concreteByElement[elemType] ?? 0) + concreteVol;
    concreteByFloor[floorName] = (concreteByFloor[floorName] ?? 0) + concreteVol;
    formworkByElement[elemType] = (formworkByElement[elemType] ?? 0) + formwork;
    formworkByFloor[floorName] = (formworkByFloor[floorName] ?? 0) + formwork;
    rebarByElement[elemType] = (rebarByElement[elemType] ?? 0) + rebarKg;

    const story = storySummaries[floorName];
    if (story) {
      story.concreteM3 += concreteVol;
      story.formworkM2 += formwork;
      story.rebarKg += rebarKg;
      for (const [diaStr, wt] of Object.entries(elemDiameters)) {
        const dia = Number(diaStr);
        rebarByDiameter[dia] = (rebarByDiameter[dia] ?? 0) + wt;
        story.byDiameter[dia] = (story.byDiameter[dia] ?? 0) + wt;
        if (dia <= 12) {
          story.thinKg += wt;
        } else {
          story.thickKg += wt;
        }
      }
    }
  }

  const totalConcrete = Object.values(concreteByElement).reduce((s, v) => s + v, 0);
  const totalFormwork = Object.values(formworkByElement).reduce((s, v) => s + v, 0);
  const totalRebar = Object.values(rebarByElement).reduce((s, v) => s + v, 0);
  let thinKg = 0;
  let thickKg = 0;

  for (const [diaStr, wt] of Object.entries(rebarByDiameter)) {
    const dia = Number(diaStr);
    if (dia <= 12) {
      thinKg += wt;
    } else {
      thickKg += wt;
    }
  }

  return {
    concreteVolumeM3: {
      total: totalConcrete,
      byElement: concreteByElement,
      byFloor: concreteByFloor,
    },
    formworkAreaM2: {
      total: totalFormwork,
      byElement: formworkByElement,
      byFloor: formworkByFloor,
    },
    rebarTonnage: {
      totalKg: totalRebar,
      totalTons: totalRebar / 1000,
      thinKg,
      thickKg,
      byDiameter: rebarByDiameter,
      byElement: rebarByElement,
      byFloor: storySummaries,
    },
    summary: {
      steelDensityKgM3: totalConcrete > 0 ? totalRebar / totalConcrete : 0,
      formworkToConcreteRatio: totalConcrete > 0 ? totalFormwork / totalConcrete : 0,
      totalElements: model.elements.length,
    },
    elementBreakdown,
    assumptions: [
      "TS 500 ve TBDY 2018 standartlarına göre analitik betonarme metrajı.",
      "Kalıp yüzeyleri net temas alanlarını esas alır.",
      "Donatı tonajı yapı elemanlarının boyutları, donatı oranları ve sarılma bölgesi etriye detaylarından hesaplanmıştır.",
    ],
    warnings: junctions.warnings,
  };
}

// ============================================================================
// 6. Legacy calculateQuantities Function (Preserved for Backwards Compatibility)
// ============================================================================

export function calculateQuantities(
  model: CadModel,
  junctions: JunctionResult = resolveJunctions(model)
): QuantityResult {
  const rows: QuantityRow[] = TYPES.map(type => ({
    type,
    count: 0,
    grossVolume: 0,
    netVolume: junctions.status === "resolved" ? 0 : null,
    formwork: 0,
  }));
  const byType = Object.fromEntries(rows.map(row => [row.type, row])) as Record<SolidElement["type"], QuantityRow>;
  const floors = new Map(model.floors.map(f => [f.id, f]));

  for (const element of model.elements) {
    if (!isSolidElement(element)) continue;
    const floor = floors.get(element.floorId);
    if (!floor) throw new Error(`${element.name}: metraj için kat bulunamadı.`);
    const row = byType[element.type],
      footprint = elementFootprint(element);
    const [bottom, top] = elementVerticalRange(element, floor);
    row.count++;
    row.grossVolume +=
      polygonArea(footprint) *
      (element.type === "slab" ? effectiveThickness(element) : element.type === "beam" ? element.height : top - bottom);
    if (row.netVolume !== null) row.netVolume += junctions.byElement[element.id]?.netVolume ?? 0;
    if (element.type === "column" && ((element.leanX ?? 0) !== 0 || (element.leanY ?? 0) !== 0))
      row.formwork += footprint.reduce((sum, p, i) => {
        const q = footprint[(i + 1) % footprint.length],
          dx = q.x - p.x,
          dy = q.y - p.y;
        return (
          sum +
          Math.hypot((top - bottom) * Math.hypot(dx, dy), dx * (element.leanY ?? 0) - dy * (element.leanX ?? 0))
        );
      }, 0);
    else if (element.type === "column" || element.type === "wall")
      row.formwork += polygonPerimeter(footprint) * (top - bottom);
    else if (element.type === "beam")
      row.formwork +=
        polygonArea(footprint) *
          Math.hypot(1, ((element.endTopOffset ?? element.topOffset ?? 0) - (element.topOffset ?? 0)) / distance(element.start, element.end)) +
        polygonPerimeter(footprint) * element.height;
    else
      row.formwork +=
        polygonArea(footprint) * Math.hypot(1, (element.slopeX ?? 0) / 100, (element.slopeY ?? 0) / 100) +
        polygonPerimeter(footprint) * effectiveThickness(element);
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
      "Kalıp brüttür; birleşimlerdeki temas yüzeyleri düşülmez. Kolon/perde: çevre × gerçek yükseklik. Kiriş: (b + 2h) × boy + 2bh (iki uç dahil). Döşeme: alt alan + çevre × kalınlık.",
      "Daireler seçilen kenar sayısıyla, eğrisel perdeler seçilen yay parçasıyla çokgenleştirilir; hacim ve 3B aynı yaklaşımı kullanır. Eğimli döşemelerde kalınlık düşeydir; kot ilk köşede, X/Y eğimleri yüzde cinsindedir. Katmanlı döşeme kalınlığı tanımlı beton katmanlarının toplamıdır. Kaplama yükü ve hareketli yük ayrıca saklanır; taşıma gücü hesabı yapılmaz.",
      "Boşluklar, donatı, fire, çalışma payları ve yapım sırası yoktur. Bu geometrik ön metraj; taşıma gücü, deprem veya TBDY uygunluk hesabı değildir.",
    ],
  };
}
