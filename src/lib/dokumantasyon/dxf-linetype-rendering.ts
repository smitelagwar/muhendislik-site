export const DXF_LINETYPE_CONTINUOUS = "CONTINUOUS";
export const DXF_LINETYPE_BY_LAYER = "BYLAYER";
export const DXF_LINETYPE_BY_BLOCK = "BYBLOCK";
export const DXF_LINETYPE_MAX_RENDER_PRIMITIVES = 2_000_000;

export interface DxfLinetypeSourceAudit {
  globalScale: number;
  layers: Record<string, string>;
  layerRecordCount: number;
  layerLinetypeCount: number;
}

export interface DxfLinetypeParsedLayer {
  name?: string;
  lineType?: string;
}

export interface DxfSimpleLinetypeDefinition {
  name: string;
  pattern: number[];
  patternLength: number;
}

export interface DxfParsedLinetypeRecord {
  name?: string;
  pattern?: number[];
  patternLength?: number;
}

export interface DxfLinetypeParsedDxf {
  header?: Record<string, unknown>;
  tables?: {
    layer?: {
      layers?: Record<string, DxfLinetypeParsedLayer>;
    };
    lineType?: {
      lineTypes?: Record<string, DxfParsedLinetypeRecord>;
    };
  };
  __dxfLinetypeSourceAudit?: DxfLinetypeSourceAudit;
}

export interface DxfLinetypePoint {
  x: number;
  y: number;
}

export interface DxfExpandedLinetypePath {
  lineVertices: DxfLinetypePoint[];
  dotVertices: DxfLinetypePoint[];
  primitiveCount: number;
}

type DxfPair = { code: number; value: string };

export class DxfLinetypeExpansionLimitError extends Error {
  readonly code = "DXF_LINETYPE_EXPANSION_LIMIT_EXCEEDED";

  constructor(limit: number) {
    super(`DXF linetype expansion exceeded the ${limit} primitive safety limit.`);
    this.name = "DxfLinetypeExpansionLimitError";
  }
}

function parsePairs(text: string): DxfPair[] {
  const lines = text.split(/\r\n|\r|\n/g);
  const pairs: DxfPair[] = [];
  for (let index = 0; index + 1 < lines.length; index += 2) {
    const code = Number.parseInt(lines[index].trim(), 10);
    if (!Number.isFinite(code)) continue;
    pairs.push({ code, value: lines[index + 1].trim() });
  }
  return pairs;
}

function positiveFiniteScale(value: unknown, fallback = 1): number {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed) || Math.abs(parsed) <= Number.EPSILON) return fallback;
  return Math.abs(parsed);
}

function parseGlobalScale(pairs: DxfPair[]): number {
  for (let index = 0; index < pairs.length; index += 1) {
    const pair = pairs[index];
    if (pair.code !== 9 || pair.value.toUpperCase() !== "$LTSCALE") continue;
    for (let cursor = index + 1; cursor < pairs.length; cursor += 1) {
      const candidate = pairs[cursor];
      if (candidate.code === 9 || candidate.code === 0) break;
      if (candidate.code >= 40 && candidate.code <= 49) {
        return positiveFiniteScale(candidate.value);
      }
    }
  }
  return 1;
}

function parseLayerLinetypes(pairs: DxfPair[]) {
  const layers: Record<string, string> = {};
  let layerRecordCount = 0;
  let layerLinetypeCount = 0;

  for (let index = 0; index + 1 < pairs.length; index += 1) {
    if (pairs[index].code !== 0 || pairs[index].value.toUpperCase() !== "TABLE") continue;
    if (pairs[index + 1].code !== 2 || pairs[index + 1].value.toUpperCase() !== "LAYER") continue;

    let cursor = index + 2;
    while (cursor < pairs.length) {
      const pair = pairs[cursor];
      if (pair.code === 0 && pair.value.toUpperCase() === "ENDTAB") break;
      if (pair.code !== 0 || pair.value.toUpperCase() !== "LAYER") {
        cursor += 1;
        continue;
      }

      layerRecordCount += 1;
      let name: string | null = null;
      let lineType: string | null = null;
      let recordCursor = cursor + 1;
      while (recordCursor < pairs.length && pairs[recordCursor].code !== 0) {
        const recordPair = pairs[recordCursor];
        if (recordPair.code === 2 && name === null) name = recordPair.value;
        if (recordPair.code === 6 && lineType === null) lineType = recordPair.value;
        recordCursor += 1;
      }

      if (name && lineType) {
        layers[name] = lineType;
        layerLinetypeCount += 1;
      }
      cursor = recordCursor;
    }
    break;
  }

  return { layers, layerRecordCount, layerLinetypeCount };
}

export function normalizeDxfLinetypeName(value: unknown): string {
  return typeof value === "string" ? value.trim().toUpperCase() : "";
}

export function auditDxfLinetypeSource(text: string): DxfLinetypeSourceAudit {
  const pairs = parsePairs(text);
  const layerAudit = parseLayerLinetypes(pairs);
  return {
    globalScale: parseGlobalScale(pairs),
    layers: layerAudit.layers,
    layerRecordCount: layerAudit.layerRecordCount,
    layerLinetypeCount: layerAudit.layerLinetypeCount,
  };
}

export function enrichParsedDxfLinetypes(
  dxf: DxfLinetypeParsedDxf,
  audit: DxfLinetypeSourceAudit
): DxfLinetypeParsedDxf {
  const parsedLayers = dxf.tables?.layer?.layers;
  if (parsedLayers) {
    for (const layer of Object.values(parsedLayers)) {
      const name = layer.name;
      if (!name) continue;
      const sourceLineType = audit.layers[name];
      if (sourceLineType) layer.lineType = sourceLineType;
    }
  }
  dxf.__dxfLinetypeSourceAudit = audit;
  return dxf;
}

export function collectDxfSimpleLinetypes(
  dxf: DxfLinetypeParsedDxf
): Record<string, DxfSimpleLinetypeDefinition> {
  const result: Record<string, DxfSimpleLinetypeDefinition> = {};
  const records = dxf.tables?.lineType?.lineTypes ?? {};

  for (const [tableKey, record] of Object.entries(records)) {
    const name = normalizeDxfLinetypeName(record?.name || tableKey);
    if (!name || name === DXF_LINETYPE_CONTINUOUS) continue;
    const pattern = Array.isArray(record?.pattern)
      ? record.pattern.map(Number).filter(Number.isFinite)
      : [];
    if (pattern.length === 0 || pattern.every((value) => Math.abs(value) <= Number.EPSILON)) continue;
    const patternLength = pattern.reduce((sum, value) => sum + Math.abs(value), 0);
    if (!(patternLength > Number.EPSILON)) continue;
    result[name] = {
      name,
      pattern,
      patternLength: Number.isFinite(record.patternLength) && Number(record.patternLength) > 0
        ? Number(record.patternLength)
        : patternLength,
    };
  }
  return result;
}

export function resolveDxfLayerLinetype(
  layerName: string | null | undefined,
  layers: Record<string, string>
): string {
  if (!layerName) return DXF_LINETYPE_CONTINUOUS;
  const exact = layers[layerName];
  if (exact) return normalizeDxfLinetypeName(exact) || DXF_LINETYPE_CONTINUOUS;
  const normalizedLayer = layerName.toUpperCase();
  for (const [name, lineType] of Object.entries(layers)) {
    if (name.toUpperCase() === normalizedLayer) {
      return normalizeDxfLinetypeName(lineType) || DXF_LINETYPE_CONTINUOUS;
    }
  }
  return DXF_LINETYPE_CONTINUOUS;
}

export function resolveDxfLinetypeScale(globalScale: unknown, entityScale: unknown): number {
  return positiveFiniteScale(globalScale) * positiveFiniteScale(entityScale);
}

function interpolate(start: DxfLinetypePoint, end: DxfLinetypePoint, ratio: number): DxfLinetypePoint {
  return {
    x: start.x + (end.x - start.x) * ratio,
    y: start.y + (end.y - start.y) * ratio,
  };
}

function samePoint(a: DxfLinetypePoint | undefined, b: DxfLinetypePoint): boolean {
  if (!a) return false;
  return Math.abs(a.x - b.x) <= 1e-9 && Math.abs(a.y - b.y) <= 1e-9;
}

/**
 * Expands a simple DXF linetype into actual visible geometry. Positive elements are dashes,
 * negative elements are gaps and zero elements are dots. Pattern phase is continuous over the
 * entire polyline instead of restarting at every vertex. Source geometry is never mutated.
 */
export function expandDxfSimpleLinetypePath({
  vertices,
  closed = false,
  pattern,
  scale = 1,
  maxPrimitives = DXF_LINETYPE_MAX_RENDER_PRIMITIVES,
}: {
  vertices: readonly DxfLinetypePoint[];
  closed?: boolean;
  pattern: readonly number[];
  scale?: number;
  maxPrimitives?: number;
}): DxfExpandedLinetypePath {
  const cleanPattern = pattern.map(Number).filter(Number.isFinite);
  const safeScale = positiveFiniteScale(scale);
  if (vertices.length < 2 || cleanPattern.length === 0 || cleanPattern.every((value) => Math.abs(value) <= Number.EPSILON)) {
    return { lineVertices: [], dotVertices: [], primitiveCount: 0 };
  }

  const lineVertices: DxfLinetypePoint[] = [];
  const dotVertices: DxfLinetypePoint[] = [];
  let primitiveCount = 0;
  let patternIndex = 0;
  let remainingPatternLength = Math.abs(cleanPattern[0]) * safeScale;

  const assertBudget = () => {
    if (primitiveCount >= maxPrimitives) throw new DxfLinetypeExpansionLimitError(maxPrimitives);
  };

  const advanceZeroElements = (point: DxfLinetypePoint) => {
    let guard = 0;
    while (Math.abs(cleanPattern[patternIndex]) <= Number.EPSILON) {
      assertBudget();
      const dot = { x: point.x, y: point.y };
      if (!samePoint(dotVertices.at(-1), dot)) {
        dotVertices.push(dot);
        primitiveCount += 1;
      }
      patternIndex = (patternIndex + 1) % cleanPattern.length;
      remainingPatternLength = Math.abs(cleanPattern[patternIndex]) * safeScale;
      guard += 1;
      if (guard > cleanPattern.length) return;
    }
  };

  const segmentCount = closed ? vertices.length : vertices.length - 1;
  for (let segmentIndex = 0; segmentIndex < segmentCount; segmentIndex += 1) {
    const start = vertices[segmentIndex];
    const end = vertices[(segmentIndex + 1) % vertices.length];
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const segmentLength = Math.hypot(dx, dy);
    if (!(segmentLength > Number.EPSILON)) continue;

    let consumed = 0;
    while (consumed < segmentLength - 1e-9) {
      const currentPoint = interpolate(start, end, consumed / segmentLength);
      advanceZeroElements(currentPoint);
      const patternValue = cleanPattern[patternIndex];
      if (remainingPatternLength <= Number.EPSILON) {
        remainingPatternLength = Math.abs(patternValue) * safeScale;
        if (remainingPatternLength <= Number.EPSILON) continue;
      }

      const step = Math.min(segmentLength - consumed, remainingPatternLength);
      if (patternValue > 0 && step > Number.EPSILON) {
        assertBudget();
        lineVertices.push(
          interpolate(start, end, consumed / segmentLength),
          interpolate(start, end, (consumed + step) / segmentLength)
        );
        primitiveCount += 1;
      }

      consumed += step;
      remainingPatternLength -= step;
      if (remainingPatternLength <= 1e-9) {
        patternIndex = (patternIndex + 1) % cleanPattern.length;
        remainingPatternLength = Math.abs(cleanPattern[patternIndex]) * safeScale;
      }
    }
  }

  return { lineVertices, dotVertices, primitiveCount };
}
