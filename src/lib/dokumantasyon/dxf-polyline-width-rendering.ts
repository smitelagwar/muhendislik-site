const EPSILON = 1e-9;
export const DXF_POLYLINE_WIDTH_MAX_TRIANGLES = 2_000_000;
export const DXF_POLYLINE_WIDTH_DEFAULT_ARC_ANGLE = (10 / 180) * Math.PI;
export const DXF_POLYLINE_WIDTH_MIN_ARC_SUBDIVISIONS = 8;
const MITER_LIMIT = 4;

export interface DxfPolylineWidthVertex {
  x: number;
  y: number;
  z?: number;
  bulge?: number;
  startWidth?: number;
  endWidth?: number;
  [key: string]: unknown;
}

export interface DxfPolylineWidthEntity {
  type?: string;
  handle?: string;
  width?: number;
  shape?: boolean;
  vertices?: DxfPolylineWidthVertex[];
  isPolyfaceMesh?: boolean;
  is3dPolyline?: boolean;
  is3dPolygonMesh?: boolean;
  extrusionDirection?: { x?: number; y?: number; z?: number };
  __dxfPolylineWidthSource?: DxfPolylineWidthEntitySource;
  [key: string]: unknown;
}

export interface DxfPolylineWidthParsedDxf {
  entities?: DxfPolylineWidthEntity[];
  blocks?: Record<string, { entities?: DxfPolylineWidthEntity[] }>;
  __dxfPolylineWidthSourceAudit?: DxfPolylineWidthSourceAudit;
}

export interface DxfPolylineWidthEntitySource {
  handle: string | null;
  type: "LWPOLYLINE" | "POLYLINE";
  constantWidth: number | null;
  defaultStartWidth: number;
  defaultEndWidth: number;
  vertices: Array<{ startWidth?: number; endWidth?: number }>;
  hasWidth: boolean;
  invalidWidth: boolean;
}

export interface DxfPolylineWidthSourceAudit {
  widthPolylineCount: number;
  variableWidthPolylineCount: number;
  constantWidthPolylineCount: number;
  legacyPolylineCount: number;
  invalidWidthPolylineCount: number;
  unmatchedSourceCount: number;
  records: DxfPolylineWidthEntitySource[];
}

export interface DxfWidePolylineMesh {
  vertices: Array<{ x: number; y: number }>;
  indices: number[];
  sourceSegmentCount: number;
  tessellatedSegmentCount: number;
  triangleCount: number;
  miterJoinCount: number;
  bevelJoinCount: number;
}

type Pair = { code: number; value: string };
type RecordData = { section: string | null; type: string; pairs: Pair[] };
type Sample = { x: number; y: number; width: number };
type Strip = {
  samples: Sample[];
  left: Array<{ x: number; y: number }>;
  right: Array<{ x: number; y: number }>;
};

function parsePairs(text: string): Pair[] {
  const lines = text.replace(/\r\n?/g, "\n").split("\n");
  const pairs: Pair[] = [];
  for (let index = 0; index + 1 < lines.length; index += 2) {
    const code = Number.parseInt(lines[index].trim(), 10);
    if (Number.isFinite(code)) pairs.push({ code, value: lines[index + 1].trim() });
  }
  return pairs;
}

function parseRecords(text: string): RecordData[] {
  const pairs = parsePairs(text);
  const records: RecordData[] = [];
  let section: string | null = null;
  let type: string | null = null;
  let recordPairs: Pair[] = [];

  const flush = () => {
    if (type) records.push({ section, type, pairs: recordPairs });
  };

  for (let index = 0; index < pairs.length; index += 1) {
    const pair = pairs[index];
    const value = pair.value.toUpperCase();
    if (pair.code === 0 && value === "SECTION") {
      flush();
      type = null;
      recordPairs = [];
      const next = pairs[index + 1];
      section = next?.code === 2 ? next.value.toUpperCase() : null;
      continue;
    }
    if (pair.code === 0 && value === "ENDSEC") {
      flush();
      type = null;
      recordPairs = [];
      section = null;
      continue;
    }
    if (pair.code === 0) {
      flush();
      type = value;
      recordPairs = [pair];
      continue;
    }
    if (type) recordPairs.push(pair);
  }
  flush();
  return records;
}

function valueForCode(pairs: Pair[], code: number): string | null {
  return pairs.find((pair) => pair.code === code)?.value ?? null;
}

function optionalNumberForCode(pairs: Pair[], code: number): number | undefined {
  const raw = valueForCode(pairs, code);
  if (raw === null) return undefined;
  const value = Number.parseFloat(raw);
  return Number.isFinite(value) ? value : undefined;
}

function widthValue(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function isPositiveWidth(value: unknown): boolean {
  return widthValue(value) > EPSILON;
}

function isInvalidWidth(value: unknown): boolean {
  return typeof value === "number" && (!Number.isFinite(value) || value < -EPSILON);
}

function sourceFromLwPolyline(record: RecordData): DxfPolylineWidthEntitySource {
  const constantWidth = optionalNumberForCode(record.pairs, 43) ?? null;
  const vertices: DxfPolylineWidthEntitySource["vertices"] = [];
  let current: { startWidth?: number; endWidth?: number } | null = null;
  for (const pair of record.pairs) {
    if (pair.code === 10) {
      if (current) vertices.push(current);
      current = {};
    } else if (current && pair.code === 40) {
      const value = Number.parseFloat(pair.value);
      if (Number.isFinite(value)) current.startWidth = value;
    } else if (current && pair.code === 41) {
      const value = Number.parseFloat(pair.value);
      if (Number.isFinite(value)) current.endWidth = value;
    }
  }
  if (current) vertices.push(current);
  const widths = [constantWidth, ...vertices.flatMap((vertex) => [vertex.startWidth, vertex.endWidth])];
  return {
    handle: valueForCode(record.pairs, 5),
    type: "LWPOLYLINE",
    constantWidth,
    defaultStartWidth: 0,
    defaultEndWidth: 0,
    vertices,
    hasWidth: widths.some(isPositiveWidth),
    invalidWidth: widths.some(isInvalidWidth),
  };
}

function sourceFromLegacyPolyline(record: RecordData): DxfPolylineWidthEntitySource {
  const defaultStartWidth = optionalNumberForCode(record.pairs, 40) ?? 0;
  const defaultEndWidth = optionalNumberForCode(record.pairs, 41) ?? 0;
  return {
    handle: valueForCode(record.pairs, 5),
    type: "POLYLINE",
    constantWidth: null,
    defaultStartWidth,
    defaultEndWidth,
    vertices: [],
    hasWidth: isPositiveWidth(defaultStartWidth) || isPositiveWidth(defaultEndWidth),
    invalidWidth: isInvalidWidth(defaultStartWidth) || isInvalidWidth(defaultEndWidth),
  };
}

export function auditDxfPolylineWidthSource(text: string): DxfPolylineWidthSourceAudit {
  const records = parseRecords(text);
  const sources: DxfPolylineWidthEntitySource[] = [];
  let activeLegacy: DxfPolylineWidthEntitySource | null = null;

  for (const record of records) {
    if (record.section !== "ENTITIES" && record.section !== "BLOCKS") continue;
    if (record.type === "LWPOLYLINE") {
      activeLegacy = null;
      sources.push(sourceFromLwPolyline(record));
      continue;
    }
    if (record.type === "POLYLINE") {
      activeLegacy = sourceFromLegacyPolyline(record);
      sources.push(activeLegacy);
      continue;
    }
    if (activeLegacy && record.type === "VERTEX") {
      const startWidth = optionalNumberForCode(record.pairs, 40);
      const endWidth = optionalNumberForCode(record.pairs, 41);
      activeLegacy.vertices.push({ startWidth, endWidth });
      const effectiveStart = startWidth ?? activeLegacy.defaultStartWidth;
      const effectiveEnd = endWidth ?? activeLegacy.defaultEndWidth;
      if (isPositiveWidth(effectiveStart) || isPositiveWidth(effectiveEnd)) activeLegacy.hasWidth = true;
      if (isInvalidWidth(effectiveStart) || isInvalidWidth(effectiveEnd)) activeLegacy.invalidWidth = true;
      continue;
    }
    if (activeLegacy && record.type === "SEQEND") activeLegacy = null;
  }

  const widthRecords = sources.filter((source) => source.hasWidth);
  return {
    widthPolylineCount: widthRecords.length,
    variableWidthPolylineCount: widthRecords.filter((source) =>
      source.constantWidth === null && source.vertices.some((vertex) =>
        vertex.startWidth !== undefined || vertex.endWidth !== undefined
      )
    ).length,
    constantWidthPolylineCount: widthRecords.filter((source) =>
      source.constantWidth !== null && source.constantWidth > EPSILON
    ).length,
    legacyPolylineCount: widthRecords.filter((source) => source.type === "POLYLINE").length,
    invalidWidthPolylineCount: widthRecords.filter((source) => source.invalidWidth).length,
    unmatchedSourceCount: 0,
    records: sources,
  };
}

function allParsedPolylineEntities(dxf: DxfPolylineWidthParsedDxf): DxfPolylineWidthEntity[] {
  const entities = [...(dxf.entities ?? [])];
  for (const block of Object.values(dxf.blocks ?? {})) entities.push(...(block.entities ?? []));
  return entities.filter((entity) => entity.type === "LWPOLYLINE" || entity.type === "POLYLINE");
}

export function enrichParsedDxfPolylineWidths(
  dxf: DxfPolylineWidthParsedDxf,
  audit: DxfPolylineWidthSourceAudit
): DxfPolylineWidthParsedDxf {
  const parsed = allParsedPolylineEntities(dxf);
  const byHandle = new Map(parsed.filter((entity) => entity.handle).map((entity) => [entity.handle!, entity]));
  const unmatchedByType = new Map<"LWPOLYLINE" | "POLYLINE", DxfPolylineWidthEntity[]>();
  for (const type of ["LWPOLYLINE", "POLYLINE"] as const) {
    unmatchedByType.set(type, parsed.filter((entity) => entity.type === type));
  }

  let unmatchedSourceCount = 0;
  for (const source of audit.records) {
    let entity = source.handle ? byHandle.get(source.handle) : undefined;
    if (!entity) {
      const candidates = unmatchedByType.get(source.type) ?? [];
      entity = candidates.shift();
      if (!entity) {
        unmatchedSourceCount += 1;
        continue;
      }
    } else {
      const candidates = unmatchedByType.get(source.type);
      if (candidates) {
        const index = candidates.indexOf(entity);
        if (index >= 0) candidates.splice(index, 1);
      }
    }

    entity.__dxfPolylineWidthSource = source;
    const vertices = entity.vertices ?? [];
    if (source.type === "LWPOLYLINE") {
      const constant = source.constantWidth ?? widthValue(entity.width);
      for (let index = 0; index < vertices.length; index += 1) {
        const sourceVertex = source.vertices[index] ?? {};
        if (constant > EPSILON) {
          vertices[index].startWidth = constant;
          vertices[index].endWidth = constant;
        } else {
          vertices[index].startWidth = sourceVertex.startWidth ?? widthValue(vertices[index].startWidth);
          vertices[index].endWidth = sourceVertex.endWidth ?? widthValue(vertices[index].endWidth);
        }
      }
    } else {
      for (let index = 0; index < vertices.length; index += 1) {
        const sourceVertex = source.vertices[index] ?? {};
        vertices[index].startWidth = sourceVertex.startWidth ?? source.defaultStartWidth;
        vertices[index].endWidth = sourceVertex.endWidth ?? source.defaultEndWidth;
      }
    }
  }

  dxf.__dxfPolylineWidthSourceAudit = { ...audit, unmatchedSourceCount };
  return dxf;
}

export function hasDxfPolylinePhysicalWidth(vertex: DxfPolylineWidthVertex): boolean {
  return isPositiveWidth(vertex.startWidth) || isPositiveWidth(vertex.endWidth);
}

function normalize2(x: number, y: number): { x: number; y: number } | null {
  const length = Math.hypot(x, y);
  if (length <= EPSILON) return null;
  return { x: x / length, y: y / length };
}

function sampleSourceSegment(
  start: DxfPolylineWidthVertex,
  end: DxfPolylineWidthVertex,
  arcAngle: number,
  minArcSubdivisions: number
): Sample[] {
  const startWidth = Math.max(0, widthValue(start.startWidth));
  const endWidth = Math.max(0, widthValue(start.endWidth));
  const bulge = widthValue(start.bulge);
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const chord = Math.hypot(dx, dy);
  if (chord <= EPSILON) return [];

  if (Math.abs(bulge) <= EPSILON) {
    return [
      { x: start.x, y: start.y, width: startWidth },
      { x: end.x, y: end.y, width: endWidth },
    ];
  }

  const includedAngle = 4 * Math.atan(bulge);
  const halfAngle = includedAngle / 2;
  const sinHalf = Math.sin(halfAngle);
  if (Math.abs(sinHalf) <= EPSILON) {
    return [
      { x: start.x, y: start.y, width: startWidth },
      { x: end.x, y: end.y, width: endWidth },
    ];
  }

  const ux = dx / chord;
  const uy = dy / chord;
  let radius = chord / 2 / sinHalf;
  const cosHalf = Math.cos(halfAngle);
  const center = {
    x: (ux * sinHalf - uy * cosHalf) * radius + start.x,
    y: (ux * cosHalf + uy * sinHalf) * radius + start.y,
  };
  const absAngle = Math.abs(includedAngle);
  let subdivisions = Math.floor(absAngle / Math.max(arcAngle, EPSILON));
  subdivisions = Math.max(minArcSubdivisions, subdivisions, 1);
  const startAngle = Math.atan2(start.y - center.y, start.x - center.x);
  const step = includedAngle / subdivisions;
  if (includedAngle < 0) radius = -radius;

  const samples: Sample[] = [];
  for (let index = 0; index <= subdivisions; index += 1) {
    const t = index / subdivisions;
    if (index === 0) {
      samples.push({ x: start.x, y: start.y, width: startWidth });
      continue;
    }
    if (index === subdivisions) {
      samples.push({ x: end.x, y: end.y, width: endWidth });
      continue;
    }
    const angle = startAngle + index * step;
    samples.push({
      x: center.x + radius * Math.cos(angle),
      y: center.y + radius * Math.sin(angle),
      width: startWidth + (endWidth - startWidth) * t,
    });
  }
  return samples;
}

function buildStrip(samples: Sample[]): Strip | null {
  if (samples.length < 2) return null;
  const left: Strip["left"] = [];
  const right: Strip["right"] = [];

  for (let index = 0; index < samples.length; index += 1) {
    const current = samples[index];
    const previous = samples[Math.max(0, index - 1)];
    const next = samples[Math.min(samples.length - 1, index + 1)];
    const tangent = normalize2(next.x - previous.x, next.y - previous.y) ??
      normalize2(next.x - current.x, next.y - current.y) ??
      normalize2(current.x - previous.x, current.y - previous.y);
    if (!tangent) return null;
    const halfWidth = Math.max(0, current.width) / 2;
    const nx = -tangent.y;
    const ny = tangent.x;
    left.push({ x: current.x + nx * halfWidth, y: current.y + ny * halfWidth });
    right.push({ x: current.x - nx * halfWidth, y: current.y - ny * halfWidth });
  }

  return { samples, left, right };
}

function tryApplyMiterJoin(previous: Strip, next: Strip): boolean {
  const prevCount = previous.samples.length;
  if (prevCount < 2 || next.samples.length < 2) return false;
  const prevEnd = previous.samples[prevCount - 1];
  const nextStart = next.samples[0];
  if (Math.hypot(prevEnd.x - nextStart.x, prevEnd.y - nextStart.y) > 1e-6) return false;
  if (Math.abs(prevEnd.width - nextStart.width) > 1e-6 || prevEnd.width <= EPSILON) return false;

  const incoming = normalize2(
    prevEnd.x - previous.samples[prevCount - 2].x,
    prevEnd.y - previous.samples[prevCount - 2].y
  );
  const outgoing = normalize2(
    next.samples[1].x - nextStart.x,
    next.samples[1].y - nextStart.y
  );
  if (!incoming || !outgoing) return false;

  const inNormal = { x: -incoming.y, y: incoming.x };
  const outNormal = { x: -outgoing.y, y: outgoing.x };
  const miter = normalize2(inNormal.x + outNormal.x, inNormal.y + outNormal.y);
  if (!miter) return false;
  const denominator = miter.x * inNormal.x + miter.y * inNormal.y;
  if (Math.abs(denominator) <= EPSILON) return false;
  const halfWidth = prevEnd.width / 2;
  const miterLength = halfWidth / denominator;
  if (!Number.isFinite(miterLength) || Math.abs(miterLength) > halfWidth * MITER_LIMIT) return false;

  const left = { x: prevEnd.x + miter.x * miterLength, y: prevEnd.y + miter.y * miterLength };
  const right = { x: prevEnd.x - miter.x * miterLength, y: prevEnd.y - miter.y * miterLength };
  previous.left[prevCount - 1] = left;
  previous.right[prevCount - 1] = right;
  next.left[0] = left;
  next.right[0] = right;
  return true;
}

function pushTriangle(
  vertices: DxfWidePolylineMesh["vertices"],
  indices: number[],
  a: { x: number; y: number },
  b: { x: number; y: number },
  c: { x: number; y: number }
): void {
  const base = vertices.length;
  vertices.push(a, b, c);
  indices.push(base, base + 1, base + 2);
}

export function buildDxfWidePolylineMesh({
  vertices: sourceVertices,
  closed,
  arcTessellationAngle = DXF_POLYLINE_WIDTH_DEFAULT_ARC_ANGLE,
  minArcSubdivisions = DXF_POLYLINE_WIDTH_MIN_ARC_SUBDIVISIONS,
  maxTriangles = DXF_POLYLINE_WIDTH_MAX_TRIANGLES,
}: {
  vertices: readonly DxfPolylineWidthVertex[];
  closed: boolean;
  arcTessellationAngle?: number;
  minArcSubdivisions?: number;
  maxTriangles?: number;
}): DxfWidePolylineMesh | null {
  if (sourceVertices.length < 2) return null;
  const sourceSegmentCount = closed ? sourceVertices.length : sourceVertices.length - 1;
  const strips: Strip[] = [];

  for (let index = 0; index < sourceSegmentCount; index += 1) {
    const start = sourceVertices[index];
    const end = sourceVertices[(index + 1) % sourceVertices.length];
    if (isInvalidWidth(start.startWidth) || isInvalidWidth(start.endWidth)) return null;
    const samples = sampleSourceSegment(start, end, arcTessellationAngle, minArcSubdivisions);
    if (samples.length < 2 || !samples.some((sample) => sample.width > EPSILON)) continue;
    const strip = buildStrip(samples);
    if (strip) strips.push(strip);
  }
  if (strips.length === 0) return null;

  let miterJoinCount = 0;
  const bevelPairs: Array<[Strip, Strip]> = [];
  for (let index = 0; index < strips.length - 1; index += 1) {
    if (tryApplyMiterJoin(strips[index], strips[index + 1])) miterJoinCount += 1;
    else bevelPairs.push([strips[index], strips[index + 1]]);
  }
  if (closed && strips.length > 1) {
    if (tryApplyMiterJoin(strips[strips.length - 1], strips[0])) miterJoinCount += 1;
    else bevelPairs.push([strips[strips.length - 1], strips[0]]);
  }

  const vertices: DxfWidePolylineMesh["vertices"] = [];
  const indices: number[] = [];
  let tessellatedSegmentCount = 0;
  const ensureBudget = (additionalTriangles: number) => {
    if (indices.length / 3 + additionalTriangles > maxTriangles) {
      throw new Error("DXF_POLYLINE_WIDTH_TRIANGLE_LIMIT_EXCEEDED");
    }
  };

  for (const strip of strips) {
    for (let index = 0; index < strip.samples.length - 1; index += 1) {
      ensureBudget(2);
      pushTriangle(vertices, indices, strip.left[index], strip.right[index], strip.left[index + 1]);
      pushTriangle(vertices, indices, strip.right[index], strip.right[index + 1], strip.left[index + 1]);
      tessellatedSegmentCount += 1;
    }
  }

  for (const [previous, next] of bevelPairs) {
    const previousIndex = previous.samples.length - 1;
    const previousSample = previous.samples[previousIndex];
    const nextSample = next.samples[0];
    if (Math.hypot(previousSample.x - nextSample.x, previousSample.y - nextSample.y) > 1e-6) continue;
    const center = { x: previousSample.x, y: previousSample.y };
    ensureBudget(2);
    pushTriangle(vertices, indices, previous.left[previousIndex], center, next.left[0]);
    pushTriangle(vertices, indices, previous.right[previousIndex], next.right[0], center);
  }

  return {
    vertices,
    indices,
    sourceSegmentCount,
    tessellatedSegmentCount,
    triangleCount: indices.length / 3,
    miterJoinCount,
    bevelJoinCount: bevelPairs.length,
  };
}
