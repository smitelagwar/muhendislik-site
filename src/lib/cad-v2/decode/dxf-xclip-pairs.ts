import type { CadClipBoundary } from "../canonical/types";

export interface DxfXclipResult {
  state: "resolved" | "unresolved-reference" | "unresolved-transform";
  clipBoundary?: CadClipBoundary;
}

export interface DxfSplineSource {
  flags?: number;
  degree?: number;
  declaredKnotCount?: number;
  declaredControlPointCount?: number;
  knots: number[];
  weights: number[];
  controlPoints: Array<[number, number, number]>;
}

/** Read direct SPLINE control nets and flags from ASCII or binary DXF pairs. */
export async function parseDxfSplines(input: Buffer | Uint8Array): Promise<Map<string, DxfSplineSource>> {
  const { acdbCreateDxfPairReader } = await import("@mlightcad/data-model");
  const reader = acdbCreateDxfPairReader(new Uint8Array(input));
  const splinesByHandle = new Map<string, DxfSplineSource>();
  let currentType = "";
  let currentHandle = "";
  let current: DxfSplineSource | undefined;
  let pendingControlPoint: [number, number, number] | undefined;

  const numericValue = (value: unknown): number | undefined => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  };

  const flush = () => {
    if (!current || currentType !== "SPLINE") return;
    if (pendingControlPoint) current.controlPoints.push(pendingControlPoint);
    if (currentHandle) {
      splinesByHandle.set(currentHandle, current);
    }
    current = undefined;
    pendingControlPoint = undefined;
  };

  for (let pair = reader.next(); pair; pair = reader.next()) {
    if (pair.code === 0) {
      flush();
      currentType = upper(pair.value);
      currentHandle = "";
      current = currentType === "SPLINE"
        ? { knots: [], weights: [], controlPoints: [] }
        : undefined;
      continue;
    }
    if (currentType !== "SPLINE" || !current) continue;
    if (pair.code === 5) {
      currentHandle = upper(pair.value);
    } else if (pair.code === 70) {
      const parsed = numericValue(pair.value);
      if (parsed !== undefined && Number.isInteger(parsed) && parsed >= 0 && parsed <= 0xffff) current.flags = parsed;
    } else if (pair.code === 71) {
      const parsed = numericValue(pair.value);
      if (parsed !== undefined && Number.isInteger(parsed) && parsed >= 0) current.degree = parsed;
    } else if (pair.code === 72 || pair.code === 73) {
      const parsed = numericValue(pair.value);
      if (parsed !== undefined && Number.isInteger(parsed) && parsed >= 0) {
        if (pair.code === 72) current.declaredKnotCount = parsed;
        else current.declaredControlPointCount = parsed;
      }
    } else if (pair.code === 40 || pair.code === 41) {
      const parsed = numericValue(pair.value);
      if (parsed !== undefined) (pair.code === 40 ? current.knots : current.weights).push(parsed);
    } else if (pair.code === 10) {
      if (pendingControlPoint) current.controlPoints.push(pendingControlPoint);
      const x = numericValue(pair.value);
      pendingControlPoint = x === undefined ? undefined : [x, 0, 0];
    } else if (pair.code === 20 && pendingControlPoint) {
      const y = numericValue(pair.value);
      if (y !== undefined) pendingControlPoint[1] = y;
    } else if (pair.code === 30 && pendingControlPoint) {
      const z = numericValue(pair.value);
      if (z !== undefined) pendingControlPoint[2] = z;
    }
  }
  flush();
  return splinesByHandle;
}

type Pair = { code: number; value: string };
type RecordEntry = { type: string; pairs: Pair[] };

const upper = (value: unknown) => String(value ?? "").trim().toUpperCase();
const num = (pairs: Pair[], code: number, fallback = 0) => {
  const value = pairs.find((pair) => pair.code === code)?.value;
  const parsed = value == null ? fallback : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

/** Read XCLIP handle relationships from either ASCII or binary DXF pairs. */
export async function parseDxfXclips(input: Buffer | Uint8Array): Promise<Map<string, DxfXclipResult>> {
  const { acdbCreateDxfPairReader } = await import("@mlightcad/data-model");
  const reader = acdbCreateDxfPairReader(new Uint8Array(input));
  const records: RecordEntry[] = [];
  let current: RecordEntry | undefined;
  for (let pair = reader.next(); pair; pair = reader.next()) {
    if (pair.code === 0) {
      if (current) records.push(current);
      const type = upper(pair.value);
      current = type === "INSERT" || type === "DICTIONARY" || type === "SPATIAL_FILTER"
        ? { type, pairs: [] }
        : undefined;
      continue;
    }
    if (!current) continue;
    current.pairs.push({ code: pair.code, value: String(pair.value).trim() });
  }
  if (current) records.push(current);

  const inserts = new Map<string, string>();
  const dictionaries = new Map<string, { owner: string; entries: Map<string, string> }>();
  const filters = new Map<string, { owner: string; result: DxfXclipResult }>();

  for (const record of records) {
    const handle = upper(record.pairs.find((pair) => pair.code === 5)?.value);
    if (!handle) continue;
    if (record.type === "INSERT") {
      let insideExtensionDictionary = false;
      for (const pair of record.pairs) {
        if (pair.code === 102) {
          if (pair.value.toUpperCase() === "{ACAD_XDICTIONARY") insideExtensionDictionary = true;
          else if (pair.value === "}") insideExtensionDictionary = false;
        } else if (insideExtensionDictionary && pair.code === 360) {
          inserts.set(handle, upper(pair.value));
        }
      }
    } else if (record.type === "DICTIONARY") {
      const owner = upper([...record.pairs].reverse().find((pair) => pair.code === 330)?.value);
      const entries = new Map<string, string>();
      for (let i = 0; i < record.pairs.length - 1; i++) {
        const name = record.pairs[i];
        const id = record.pairs[i + 1];
        if (name.code === 3 && (id.code === 350 || id.code === 360)) entries.set(upper(name.value), upper(id.value));
      }
      dictionaries.set(handle, { owner, entries });
    } else if (record.type === "SPATIAL_FILTER") {
      const owner = upper([...record.pairs].reverse().find((pair) => pair.code === 330)?.value);
      const points: [number, number][] = [];
      for (let i = 0; i < record.pairs.length - 1; i++) {
        if (record.pairs[i].code === 10 && record.pairs[i + 1].code === 20) {
          const x = Number(record.pairs[i].value);
          const y = Number(record.pairs[i + 1].value);
          if (Number.isFinite(x) && Number.isFinite(y)) points.push([x, y]);
        }
      }
      const normal: [number, number, number] = [num(record.pairs, 210), num(record.pairs, 220), num(record.pairs, 230, 1)];
      const origin: [number, number, number] = [num(record.pairs, 11), num(record.pairs, 21), num(record.pairs, 31)];
      const transformValues = record.pairs.filter((pair) => pair.code === 40).map((pair) => Number(pair.value));
      // Group 40 is overloaded: front distance comes first only when group 72
      // enables front clipping; the two 12-value matrices follow it. The first
      // matrix is the inverse INSERT transform and the second maps points into
      // clip-boundary coordinates. Extract by the documented record shape,
      // never by a fixed offset that silently shifts when front clipping exists.
      const frontClippingEnabled = num(record.pairs, 72) !== 0;
      const backClippingEnabled = num(record.pairs, 73) !== 0;
      const matrixStart = frontClippingEnabled ? 1 : 0;
      const matrixValues = transformValues.slice(matrixStart);
      const matricesHaveExpectedShape = matrixValues.length === 24
        && matrixValues.every(Number.isFinite)
        && (!frontClippingEnabled || Number.isFinite(transformValues[0]));
      const clipMatrix = matricesHaveExpectedShape ? matrixValues.slice(12, 24) : [];
      const identity = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0];
      const identityClipMatrix = clipMatrix.length === 12 && clipMatrix.every((value, i) => Number.isFinite(value) && Math.abs(value - identity[i]) < 1e-10);
      const topOcs = Math.abs(normal[0]) < 1e-10 && Math.abs(normal[1]) < 1e-10 && Math.abs(normal[2] - 1) < 1e-10;
      const originZero = origin.every((value) => Math.abs(value) < 1e-10);
      const noDepthClip = !frontClippingEnabled && !backClippingEnabled;
      const result: DxfXclipResult = points.length >= 3 && matricesHaveExpectedShape && topOcs && originZero && identityClipMatrix && noDepthClip
        ? { state: "resolved", clipBoundary: { isClippingEnabled: num(record.pairs, 71) !== 0, isInverted: false, boundaryVertices: points } }
        : { state: "unresolved-transform" };
      filters.set(handle, { owner, result });
    }
  }

  const byInsert = new Map<string, DxfXclipResult>();
  for (const [insertHandle, extensionHandle] of inserts) {
    const extension = dictionaries.get(extensionHandle);
    const filterDictionaryHandle = extension?.entries.get("ACAD_FILTER");
    // An ACAD_FILTER entry is an explicit claim that this INSERT owns filter
    // metadata. A missing dictionary/SPATIAL child is therefore corrupt or
    // unsupported XCLIP data, not evidence that the INSERT is unclipped.
    if (!filterDictionaryHandle) continue;
    const filterDictionary = filterDictionaryHandle ? dictionaries.get(filterDictionaryHandle) : undefined;
    const spatialFilterHandle = filterDictionary?.entries.get("SPATIAL");
    if (!filterDictionary || !spatialFilterHandle) {
      byInsert.set(insertHandle, { state: "unresolved-reference" });
      continue;
    }
    const filter = filters.get(spatialFilterHandle);
    if (!filter || (filter.owner && filter.owner !== filterDictionaryHandle)) {
      byInsert.set(insertHandle, { state: "unresolved-reference" });
    } else {
      byInsert.set(insertHandle, filter.result);
    }
  }
  return byInsert;
}
