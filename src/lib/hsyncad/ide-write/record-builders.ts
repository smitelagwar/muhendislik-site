/**
 * ideCAD binary record builders for structural elements.
 * Generates bit-level compatible records for axes, columns, beams, walls, and slabs.
 */

import { encodeCp1254NulString } from "../ide-import/ide-binary-codec";
import type { Point } from "../model";
import {
  DEFAULT_COLORS,
  DEFAULT_LAYER_IDS,
  PRIMITIVE_AXIS,
  PRIMITIVE_BAND,
  PRIMITIVE_BEAM,
  PRIMITIVE_COLUMN,
  PRIMITIVE_LINE,
  PRIMITIVE_SECTION,
  PRIMITIVE_SHEAR_WALL,
  PRIMITIVE_SLAB,
  PRIMITIVE_SLAB_EDGE,
  PRIMITIVE_STAIR,
  PRIMITIVE_WALL,
  type IdeFormatVersion,
} from "./format-constants";

export interface BoundingBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export function computePointsBbox(points: Point[]): BoundingBox {
  if (points.length === 0) return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const p of points) {
    if (p.x < minX) minX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.x > maxX) maxX = p.x;
    if (p.y > maxY) maxY = p.y;
  }
  return { minX, minY, maxX, maxY };
}

export function computeLineFootprint(
  start: Point,
  end: Point,
  width: number,
  lateralOffset = 0,
): Point[] {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const len = Math.hypot(dx, dy);
  if (len < 1e-8 || width <= 0) return [start, end];
  const nx = -dy / len;
  const ny = dx / len;
  const left = lateralOffset;
  const right = left - width;
  return [
    { x: start.x + nx * right, y: start.y + ny * right },
    { x: end.x + nx * right, y: end.y + ny * right },
    { x: end.x + nx * left, y: end.y + ny * left },
    { x: start.x + nx * left, y: start.y + ny * left },
  ];
}

/**
 * Universal safe endpoint resolver that supports CadElement (start/end),
 * IdeElement (points array), and positioned elements. Never throws TypeError.
 */
export function resolveElementEndpoints(el: {
  start?: Point;
  end?: Point;
  points?: Point[];
  position?: Point;
}): { start: Point; end: Point } {
  if (el.start && typeof el.start.x === "number" && typeof el.start.y === "number" &&
      el.end && typeof el.end.x === "number" && typeof el.end.y === "number") {
    return { start: el.start, end: el.end };
  }
  if (el.points && el.points.length >= 2) {
    const p0 = el.points[0];
    const p1 = el.points[1];
    if (typeof p0.x === "number" && typeof p0.y === "number" &&
        typeof p1.x === "number" && typeof p1.y === "number") {
      return { start: p0, end: p1 };
    }
  }
  if (el.points && el.points.length === 1) {
    const p0 = el.points[0];
    return { start: p0, end: { x: p0.x + 1, y: p0.y } };
  }
  if (el.position && typeof el.position.x === "number" && typeof el.position.y === "number") {
    return { start: el.position, end: { x: el.position.x + 1, y: el.position.y } };
  }
  return { start: { x: 0, y: 0 }, end: { x: 1, y: 0 } };
}

export interface CommonGeometryParams {
  primitiveType: number;
  points: Point[];
  nativeId: number;
  nativeZ: number;
  width: number;
  layerId: number;
  rotation?: number;
  lateralOffset?: number;
  bbox: BoundingBox;
  name: string;
  color: number;
  extraAttributes?: Uint8Array;
}

/**
 * Builds the standard native geometry record structure:
 * [primitiveType: u32] [count: u32] [points: count * 16B]
 * [nativeId: u32] [nativeZ: f64] [width: f64] [layerId: u32]
 * [list0: u32 len=0] [rotation: f64] [list1: u32 len=0] [list2: u32 len=0]
 * [lateralOffset: f64]
 * [bbox: 4 * f32 = 16B]
 * [padding: 0x00] [nameLen: u32] [name: CP1254 + NUL]
 * [color: u32]
 * [extraAttributes: optional byte payload (sections, loads, etc.)]
 */
export function buildCommonRecord(params: CommonGeometryParams): Uint8Array {
  const count = params.points.length;
  const pointsSize = count * 16;
  const nameBytes = encodeCp1254NulString(params.name); // 4-byte len + text + NUL
  const extraLen = params.extraAttributes ? params.extraAttributes.byteLength : 0;

  // Geometry block before bboxOffset:
  // primitiveType (4) + count (4) + points (pointsSize)
  // tail: nativeId (4) + nativeZ (8) + width (8) + layerId (4) = 24
  // list 0: len (4) = 4
  // rotation: (8)
  // list 1: len (4) = 4
  // list 2: len (4) = 4
  // lateralOffset: (8)
  // Total before bbox = 8 + pointsSize + 24 + 4 + 8 + 4 + 4 + 8 = pointsSize + 60
  const geomPreBboxSize = 8 + pointsSize + 52;

  // Bbox = 16
  // padding = 1
  // nameBytes (4 + name.length + 1)
  // color = 4
  const coreTotal = geomPreBboxSize + 16 + 1 + nameBytes.byteLength + 4;
  const totalSize = coreTotal + extraLen;

  const buffer = new Uint8Array(totalSize);
  const view = new DataView(buffer.buffer);
  let offset = 0;

  // 1. Primitive type & count
  view.setUint32(offset, params.primitiveType, true);
  offset += 4;
  view.setUint32(offset, count, true);
  offset += 4;

  // 2. Points
  for (const pt of params.points) {
    view.setFloat64(offset, pt.x, true);
    offset += 8;
    view.setFloat64(offset, pt.y, true);
    offset += 8;
  }

  // 3. Tail
  view.setUint32(offset, params.nativeId, true);
  offset += 4;
  view.setFloat64(offset, params.nativeZ, true);
  offset += 8;
  view.setFloat64(offset, params.width, true);
  offset += 8;
  view.setUint32(offset, params.layerId, true);
  offset += 4;

  // 4. Reference list 0 (empty)
  view.setUint32(offset, 0, true);
  offset += 4;

  // 5. Rotation
  view.setFloat64(offset, params.rotation ?? 0, true);
  offset += 8;

  // 6. Reference list 1 (empty)
  view.setUint32(offset, 0, true);
  offset += 4;

  // 7. Reference list 2 (empty)
  view.setUint32(offset, 0, true);
  offset += 4;

  // 8. Lateral offset
  view.setFloat64(offset, params.lateralOffset ?? 0, true);
  offset += 8;

  // 9. Bounding box (4 x f32)
  view.setFloat32(offset, params.bbox.minX, true);
  offset += 4;
  view.setFloat32(offset, params.bbox.minY, true);
  offset += 4;
  view.setFloat32(offset, params.bbox.maxX, true);
  offset += 4;
  view.setFloat32(offset, params.bbox.maxY, true);
  offset += 4;

  // 10. Padding byte (0x00)
  buffer[offset] = 0x00;
  offset += 1;

  // 11. Name (length-prefixed CP1254 with NUL)
  buffer.set(nameBytes, offset);
  offset += nameBytes.byteLength;

  // 12. Color (u32 LE ~ 1,000,000,000)
  view.setUint32(offset, params.color, true);
  offset += 4;

  // 13. Extra attributes
  if (params.extraAttributes && extraLen > 0) {
    buffer.set(params.extraAttributes, offset);
    offset += extraLen;
  }

  return buffer;
}

/** Encodes an Axis element record. */
export function encodeAxisRecord(
  axis: {
    name: string;
    start?: Point;
    end?: Point;
    points?: Point[];
    position?: Point;
    layer?: string;
  },
  nativeId: number,
): Uint8Array {
  const { start, end } = resolveElementEndpoints(axis);
  const points = [start, end];
  const bbox = computePointsBbox(points);
  // Expand bounds slightly for axes
  bbox.minX -= 0.1;
  bbox.minY -= 0.1;
  bbox.maxX += 0.1;
  bbox.maxY += 0.1;

  return buildCommonRecord({
    primitiveType: PRIMITIVE_AXIS,
    points,
    nativeId,
    nativeZ: 0,
    width: 0,
    layerId: DEFAULT_LAYER_IDS.axis,
    rotation: 0,
    lateralOffset: 0,
    bbox,
    name: axis.name,
    color: DEFAULT_COLORS.axis,
  });
}

/** Encodes a Column element record (4 corner points polygon). */
export function encodeColumnRecord(
  col: {
    name: string;
    position?: Point;
    points?: Point[];
    width?: number;
    depth?: number;
    height?: number;
    rotation?: number;
    baseOffset?: number;
    nativeZ?: number;
  },
  nativeId: number,
): Uint8Array {
  const width = typeof col.width === "number" && col.width > 0 ? col.width : 0.5;
  const depth = typeof col.depth === "number" && col.depth > 0 ? col.depth : width;
  let points: Point[];
  if (col.points && col.points.length >= 4) {
    points = col.points.slice(0, 4);
  } else if (col.points && col.points.length > 0) {
    const p0 = col.points[0];
    points = [
      p0,
      { x: p0.x + width, y: p0.y },
      { x: p0.x + width, y: p0.y + depth },
      { x: p0.x, y: p0.y + depth },
    ];
  } else if (col.position) {
    const w = width / 2;
    const d = depth / 2;
    const rotRad = ((col.rotation ?? 0) * Math.PI) / 180;
    const cos = Math.cos(rotRad);
    const sin = Math.sin(rotRad);
    const localCorners = [
      { x: -w, y: -d },
      { x: w, y: -d },
      { x: w, y: d },
      { x: -w, y: d },
    ];
    points = localCorners.map(c => ({
      x: col.position!.x + c.x * cos - c.y * sin,
      y: col.position!.y + c.x * sin + c.y * cos,
    }));
  } else {
    points = [
      { x: 0, y: 0 },
      { x: width, y: 0 },
      { x: width, y: depth },
      { x: 0, y: depth },
    ];
  }

  const bbox = computePointsBbox(points);

  return buildCommonRecord({
    primitiveType: PRIMITIVE_COLUMN,
    points,
    nativeId,
    nativeZ: col.baseOffset ?? col.nativeZ ?? 0,
    width,
    layerId: DEFAULT_LAYER_IDS.column,
    rotation: col.rotation ?? 0,
    lateralOffset: 0,
    bbox,
    name: col.name,
    color: DEFAULT_COLORS.column,
  });
}

/** Encodes a Beam element record with section label and height attributes. */
export function encodeBeamRecord(
  beam: {
    name: string;
    start?: Point;
    end?: Point;
    points?: Point[];
    position?: Point;
    width?: number;
    height?: number;
    topOffset?: number;
    offset?: number;
    lateralOffset?: number;
  },
  nativeId: number,
  version: IdeFormatVersion = "ide11",
): Uint8Array {
  const { start, end } = resolveElementEndpoints(beam);
  const points = [start, end];
  const width = typeof beam.width === "number" && beam.width > 0 ? beam.width : 0.25;
  const height = typeof beam.height === "number" && beam.height > 0 ? beam.height : 0.50;
  const lateralOffset = beam.offset ?? beam.lateralOffset ?? 0;
  const footprint = computeLineFootprint(start, end, width, lateralOffset);
  const bbox = computePointsBbox(footprint);

  // Extra attributes payload for beam (includes section label and height)
  // Size ~ 600 bytes
  const extra = new Uint8Array(600);
  const extraView = new DataView(extra.buffer);

  // Tag at relative p + 262: (In buildCommonRecord, extra starts right after color at p+4)
  // relative offset in extra = 262 - 4 = 258
  extraView.setUint32(258, 1, true); // beam tag = 1
  extraView.setFloat64(262, height, true); // height at p + 266 -> relative 262

  if (version === "ide11") {
    // [21, 61, 25004, 10049, 1, 1] at p + 274 -> relative 270
    const v11Vals = [21, 61, 25004, 10049, 1, 1];
    v11Vals.forEach((val, idx) => extraView.setUint32(270 + idx * 4, val, true));
  }

  // Three unit-scale doubles at p + 298, p + 306, p + 314 -> relative 294, 302, 310
  extraView.setFloat64(294, 1.0, true);
  extraView.setFloat64(302, 1.0, true);
  extraView.setFloat64(310, 1.0, true);

  // Section label string at relative 350
  const widthCm = Math.round(width * 100);
  const heightCm = Math.round(height * 100);
  const sectionLabel = `${widthCm}/${heightCm}`;
  const labelBytes = encodeCp1254NulString(sectionLabel);
  extra.set(labelBytes, 350);

  return buildCommonRecord({
    primitiveType: PRIMITIVE_BEAM,
    points,
    nativeId,
    nativeZ: beam.topOffset ?? 0,
    width,
    layerId: DEFAULT_LAYER_IDS.beam,
    rotation: 0,
    lateralOffset,
    bbox,
    name: beam.name,
    color: DEFAULT_COLORS.beam,
    extraAttributes: extra,
  });
}

/** Encodes a Wall / Shear wall element record with height attributes. */
export function encodeWallRecord(
  wall: {
    name: string;
    start?: Point;
    end?: Point;
    points?: Point[];
    position?: Point;
    thickness?: number;
    width?: number;
    height?: number;
    baseOffset?: number;
    offset?: number;
    lateralOffset?: number;
    primitiveType?: number;
  },
  nativeId: number,
  version: IdeFormatVersion = "ide11",
): Uint8Array {
  const { start, end } = resolveElementEndpoints(wall);
  const points = [start, end];
  const thickness = typeof wall.thickness === "number" && wall.thickness > 0
    ? wall.thickness
    : typeof wall.width === "number" && wall.width > 0
    ? wall.width
    : 0.25;
  const height = typeof wall.height === "number" && wall.height > 0 ? wall.height : 3.0;
  const lateralOffset = wall.offset ?? wall.lateralOffset ?? 0;
  const footprint = computeLineFootprint(start, end, thickness, lateralOffset);
  const bbox = computePointsBbox(footprint);

  const extra = new Uint8Array(650);
  const extraView = new DataView(extra.buffer);

  // Tag at p + 262 -> relative 258
  extraView.setUint32(258, 119, true);
  extraView.setFloat64(262, height, true); // height at p + 266 -> relative 262

  if (version === "ide11") {
    const v11Vals = [98, 70, 25035, 10062, 1, 1];
    v11Vals.forEach((val, idx) => extraView.setUint32(270 + idx * 4, val, true));
  }

  extraView.setFloat64(294, 1.0, true);
  extraView.setFloat64(302, 1.0, true);
  extraView.setFloat64(310, 1.0, true);

  // Wall plan section string at relative 400
  const wallLen = Math.hypot(end.x - start.x, end.y - start.y);
  const lenCm = Math.round(wallLen * 100);
  const thickCm = Math.round(thickness * 100);
  const wallSection = `${lenCm}/${thickCm}`;
  const sectionBytes = encodeCp1254NulString(wallSection);
  extra.set(sectionBytes, 400);

  const fullLabel = `${wall.name} ${wallSection}`;
  const fullBytes = encodeCp1254NulString(fullLabel);
  extra.set(fullBytes, 450);

  const primType = wall.primitiveType === PRIMITIVE_WALL ? PRIMITIVE_WALL : PRIMITIVE_SHEAR_WALL;

  return buildCommonRecord({
    primitiveType: primType,
    points,
    nativeId,
    nativeZ: wall.baseOffset ?? 0,
    width: thickness,
    layerId: DEFAULT_LAYER_IDS.wall,
    rotation: 0,
    lateralOffset,
    bbox,
    name: wall.name,
    color: DEFAULT_COLORS.wall,
    extraAttributes: extra,
  });
}

/** Encodes a Slab element record with live/dead loads and design calculation axes. */
export function encodeSlabRecord(
  slab: {
    name: string;
    points?: Point[];
    footprint?: Point[];
    thickness?: number;
    width?: number;
    topOffset?: number;
    liveLoad?: number;
    deadLoad?: number;
    finishLoad?: number;
  },
  nativeId: number,
  version: IdeFormatVersion = "ide11",
): Uint8Array {
  let points = slab.points && slab.points.length >= 3 ? slab.points : slab.footprint ?? [];
  if (points.length < 3) {
    points = [
      { x: 0, y: 0 },
      { x: 5, y: 0 },
      { x: 5, y: 5 },
      { x: 0, y: 5 },
    ];
  }
  const thickness = typeof slab.thickness === "number" && slab.thickness > 0
    ? slab.thickness
    : typeof slab.width === "number" && slab.width > 0
    ? slab.width
    : 0.15;
  const bbox = computePointsBbox(points);

  // Extra attributes payload for slab loads and design axes (up to ~1200 bytes)
  const extra = new Uint8Array(1200);
  const extraView = new DataView(extra.buffer);

  const shift = version === "ide11" ? 4 : 0;
  extraView.setUint32(466 - 4, 43, true);
  if (version === "ide11") {
    extraView.setUint32(470 - 4, 36, true);
  }
  extraView.setUint32(470 + shift - 4, 1, true);
  extraView.setUint32(475 + shift - 4, 1, true);

  const live = slab.liveLoad ?? 0.35;
  const dead = slab.deadLoad ?? slab.finishLoad ?? 0.5;
  extraView.setFloat64(481 + shift - 4, live, true);

  extraView.setUint32(489 + shift - 4, 85, true);
  extraView.setUint32(493 + shift - 4, 45, true);
  extraView.setFloat64(497 + shift - 4, dead, true);

  // Slab calculation axes (readSlabDesignAxes):
  const axis1Offset = 772 + shift;
  const midY = (bbox.minY + bbox.maxY) / 2;

  extraView.setFloat64(axis1Offset - 24, 0, true);
  extraView.setFloat64(axis1Offset - 16, 1, true);
  extraView.setFloat64(axis1Offset - 8, -midY, true);

  // 4 points (endpoints repeated twice)
  const ax1PtA = { x: bbox.minX + 0.1, y: midY };
  const ax1PtB = { x: bbox.maxX - 0.1, y: midY };
  const ax1Points = [ax1PtA, ax1PtB, ax1PtA, ax1PtB];
  ax1Points.forEach((pt, idx) => {
    extraView.setFloat64(axis1Offset + idx * 16, pt.x, true);
    extraView.setFloat64(axis1Offset + idx * 16 + 8, pt.y, true);
  });

  return buildCommonRecord({
    primitiveType: PRIMITIVE_SLAB,
    points,
    nativeId,
    nativeZ: slab.topOffset ?? 0,
    width: thickness,
    layerId: DEFAULT_LAYER_IDS.slab,
    rotation: 0,
    lateralOffset: 0,
    bbox,
    name: slab.name,
    color: DEFAULT_COLORS.slab,
    extraAttributes: extra,
  });
}

/** Encodes a Band Beam record (primitiveType = 128). */
export function encodeBandRecord(
  band: {
    name: string;
    start?: Point;
    end?: Point;
    points?: Point[];
    width?: number;
    height?: number;
  },
  nativeId: number,
): Uint8Array {
  const { start, end } = resolveElementEndpoints(band);
  const width = band.width ?? 0.6;
  const footprint = computeLineFootprint(start, end, width, 0);
  const bbox = computePointsBbox(footprint);

  return buildCommonRecord({
    primitiveType: PRIMITIVE_BAND,
    points: [start, end],
    nativeId,
    nativeZ: 0,
    width,
    layerId: DEFAULT_LAYER_IDS.beam,
    rotation: 0,
    lateralOffset: 0,
    bbox,
    name: band.name || `B${nativeId}`,
    color: DEFAULT_COLORS.beam,
  });
}

/** Encodes a Slab Edge or Line record (primitiveType = 45 or 44). */
export function encodeSlabEdgeRecord(
  edge: {
    name?: string;
    start?: Point;
    end?: Point;
    points?: Point[];
    type?: string;
  },
  nativeId: number,
): Uint8Array {
  const { start, end } = resolveElementEndpoints(edge);
  const points = [start, end];
  const bbox = computePointsBbox(points);
  const isLine = edge.type === "line";

  return buildCommonRecord({
    primitiveType: isLine ? PRIMITIVE_LINE : PRIMITIVE_SLAB_EDGE,
    points,
    nativeId,
    nativeZ: 0,
    width: 0,
    layerId: DEFAULT_LAYER_IDS.slab,
    rotation: 0,
    lateralOffset: 0,
    bbox,
    name: edge.name || (isLine ? `L${nativeId}` : `DK${nativeId}`),
    color: DEFAULT_COLORS.slab,
  });
}

/** Encodes a Stair record (primitiveType = 40). */
export function encodeStairRecord(
  stair: {
    name?: string;
    start?: Point;
    position?: Point;
    points?: Point[];
    width?: number;
  },
  nativeId: number,
): Uint8Array {
  const { start } = resolveElementEndpoints(stair);
  const points = stair.points && stair.points.length > 0 ? stair.points : [start];
  const bbox = computePointsBbox(points);

  return buildCommonRecord({
    primitiveType: PRIMITIVE_STAIR,
    points,
    nativeId,
    nativeZ: 0,
    width: stair.width ?? 1.2,
    layerId: DEFAULT_LAYER_IDS.stair,
    rotation: 0,
    lateralOffset: 0,
    bbox,
    name: stair.name || `M${nativeId}`,
    color: DEFAULT_COLORS.stair,
  });
}

/** Encodes a generic fallback record for unhandled element types. */
export function encodeGenericRecord(
  el: {
    name?: string;
    start?: Point;
    end?: Point;
    points?: Point[];
    position?: Point;
    primitiveType?: number;
    width?: number;
  },
  nativeId: number,
): Uint8Array {
  let points: Point[];
  if (el.points && el.points.length > 0) {
    points = el.points;
  } else {
    const { start, end } = resolveElementEndpoints(el);
    points = [start, end];
  }
  const bbox = computePointsBbox(points);

  return buildCommonRecord({
    primitiveType: el.primitiveType ?? PRIMITIVE_SECTION,
    points,
    nativeId,
    nativeZ: 0,
    width: el.width ?? 0,
    layerId: DEFAULT_LAYER_IDS.dimension,
    rotation: 0,
    lateralOffset: 0,
    bbox,
    name: el.name || `E${nativeId}`,
    color: 1000000000,
  });
}
