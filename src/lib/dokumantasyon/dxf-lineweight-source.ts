export const DXF_LINEWEIGHT_BY_BLOCK = -1;
export const DXF_LINEWEIGHT_BY_LAYER = -2;
export const DXF_LINEWEIGHT_DEFAULT = -3;
export const DXF_LINEWEIGHT_DEFAULT_HUNDREDTHS_MM = 25;

export interface DxfLineweightSourceAudit {
  defaultLineweight: number;
  layers: Record<string, number>;
  layerRecordCount: number;
  layerLineweightCount: number;
  entityLineweightValueCount: number;
  invalidLineweightValues: number[];
}

export interface DxfLineweightParsedLayer {
  name?: string;
  lineweight?: number;
}

export interface DxfLineweightParsedDxf {
  header?: Record<string, unknown>;
  tables?: {
    layer?: {
      layers?: Record<string, DxfLineweightParsedLayer>;
    };
  };
  __dxfLineweightSourceAudit?: DxfLineweightSourceAudit;
}

type DxfPair = { code: number; value: string };

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

function numericLineweight(value: string | number | undefined | null): number | null {
  if (value === undefined || value === null || value === "") return null;
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) return null;
  return Math.trunc(parsed);
}

export function isKnownDxfLineweight(value: number): boolean {
  return value === DXF_LINEWEIGHT_BY_BLOCK ||
    value === DXF_LINEWEIGHT_BY_LAYER ||
    value === DXF_LINEWEIGHT_DEFAULT ||
    (value >= 0 && value <= 211);
}

export function normalizeDxfLineweight(
  value: number | string | undefined | null,
  fallback = DXF_LINEWEIGHT_BY_LAYER
): number {
  const parsed = numericLineweight(value);
  if (parsed === null || !isKnownDxfLineweight(parsed)) return fallback;
  return parsed;
}

function parseDefaultLineweight(pairs: DxfPair[]): number {
  for (let index = 0; index < pairs.length; index += 1) {
    const pair = pairs[index];
    if (pair.code !== 9 || pair.value.toUpperCase() !== "$LWDEFAULT") continue;
    for (let cursor = index + 1; cursor < pairs.length; cursor += 1) {
      const candidate = pairs[cursor];
      if (candidate.code === 9 || candidate.code === 0) break;
      const value = numericLineweight(candidate.value);
      if (value !== null && value >= 0 && value <= 211) return value;
    }
  }
  return DXF_LINEWEIGHT_DEFAULT_HUNDREDTHS_MM;
}

function parseLayerLineweights(pairs: DxfPair[]) {
  const layers: Record<string, number> = {};
  let layerRecordCount = 0;
  let layerLineweightCount = 0;
  const layerLineweightPairIndexes = new Set<number>();

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
      let lineweight: number | null = null;
      let lineweightPairIndex: number | null = null;
      let recordCursor = cursor + 1;
      while (recordCursor < pairs.length && pairs[recordCursor].code !== 0) {
        const recordPair = pairs[recordCursor];
        if (recordPair.code === 2 && name === null) name = recordPair.value;
        if (recordPair.code === 370) {
          lineweight = numericLineweight(recordPair.value);
          lineweightPairIndex = recordCursor;
        }
        recordCursor += 1;
      }

      if (name && lineweight !== null && isKnownDxfLineweight(lineweight)) {
        layers[name] = lineweight;
        layerLineweightCount += 1;
        if (lineweightPairIndex !== null) layerLineweightPairIndexes.add(lineweightPairIndex);
      }
      cursor = recordCursor;
    }
    break;
  }

  return { layers, layerRecordCount, layerLineweightCount, layerLineweightPairIndexes };
}

export function auditDxfLineweightSource(text: string): DxfLineweightSourceAudit {
  const pairs = parsePairs(text);
  const defaultLineweight = parseDefaultLineweight(pairs);
  const layerAudit = parseLayerLineweights(pairs);
  const invalidLineweightValues: number[] = [];
  let entityLineweightValueCount = 0;

  for (let index = 0; index < pairs.length; index += 1) {
    const pair = pairs[index];
    if (pair.code !== 370 || layerAudit.layerLineweightPairIndexes.has(index)) continue;
    const value = numericLineweight(pair.value);
    if (value === null) continue;
    // $LWDEFAULT is a header variable, not an entity property.
    const previous = pairs[index - 1];
    if (previous?.code === 9 && previous.value.toUpperCase() === "$LWDEFAULT") continue;
    entityLineweightValueCount += 1;
    if (!isKnownDxfLineweight(value) && !invalidLineweightValues.includes(value)) {
      invalidLineweightValues.push(value);
    }
  }

  return {
    defaultLineweight,
    layers: layerAudit.layers,
    layerRecordCount: layerAudit.layerRecordCount,
    layerLineweightCount,
    entityLineweightValueCount,
    invalidLineweightValues,
  };
}

export function enrichParsedDxfLineweights(
  dxf: DxfLineweightParsedDxf,
  audit: DxfLineweightSourceAudit
): DxfLineweightParsedDxf {
  const parsedLayers = dxf.tables?.layer?.layers;
  if (parsedLayers) {
    for (const layer of Object.values(parsedLayers)) {
      const name = layer.name;
      if (!name) continue;
      const sourceLineweight = audit.layers[name];
      if (sourceLineweight !== undefined) layer.lineweight = sourceLineweight;
    }
  }
  dxf.__dxfLineweightSourceAudit = audit;
  return dxf;
}

function resolveLayerLineweight(
  layerName: string | null | undefined,
  layers: Record<string, number>,
  defaultLineweight: number
): number {
  if (!layerName) return defaultLineweight;
  const layerValue = normalizeDxfLineweight(layers[layerName], DXF_LINEWEIGHT_DEFAULT);
  if (layerValue >= 0) return layerValue;
  return defaultLineweight;
}

export function resolveDxfLineweightHundredthsMm({
  value,
  layerName,
  layers,
  defaultLineweight = DXF_LINEWEIGHT_DEFAULT_HUNDREDTHS_MM,
  byBlockValue,
}: {
  value?: number | null;
  layerName?: string | null;
  layers: Record<string, number>;
  defaultLineweight?: number;
  byBlockValue?: number | null;
}): number {
  const safeDefault = defaultLineweight >= 0 && defaultLineweight <= 211
    ? defaultLineweight
    : DXF_LINEWEIGHT_DEFAULT_HUNDREDTHS_MM;
  const normalized = normalizeDxfLineweight(value, DXF_LINEWEIGHT_BY_LAYER);

  if (normalized >= 0) return normalized;
  if (normalized === DXF_LINEWEIGHT_DEFAULT) return safeDefault;
  if (normalized === DXF_LINEWEIGHT_BY_LAYER) {
    return resolveLayerLineweight(layerName, layers, safeDefault);
  }
  if (normalized === DXF_LINEWEIGHT_BY_BLOCK) {
    const byBlock = normalizeDxfLineweight(byBlockValue, DXF_LINEWEIGHT_DEFAULT);
    if (byBlock >= 0) return byBlock;
    if (byBlock === DXF_LINEWEIGHT_BY_LAYER) {
      return resolveLayerLineweight(layerName, layers, safeDefault);
    }
    return safeDefault;
  }
  return safeDefault;
}

/**
 * AutoCAD lineweights are paper-oriented hundredths of a millimetre. The WebGL viewer has no
 * physical paper scale, so LWT display uses a bounded screen-space mapping that preserves the
 * source ordering while staying readable during zoom. The source value itself is never changed.
 */
export function lineweightHundredthsMmToCssPixels(lineweight: number): number {
  const safe = Math.max(0, Math.min(211, lineweight));
  return Math.max(1, Math.min(9, Number((1 + (safe / 100) * 4).toFixed(2))));
}
