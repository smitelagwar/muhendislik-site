/** AutoCAD DIMENSION ACAD/DSTYLE XDATA overrides, keyed only by source handle. */
export interface DxfDimensionOverrideRecord {
  sourceHandle: string;
  values: Map<number, number>;
  unsupported: boolean;
}

export interface DxfDimensionOverrideScan {
  byHandle: Map<string, DxfDimensionOverrideRecord>;
  geometryByHandle: Map<string, DxfLinearDimensionGeometry>;
}

export interface DxfLinearDimensionGeometry {
  sourceHandle: string;
  dimType: number;
  defPoint?: [number, number];
  line1Start?: [number, number];
  line1End?: [number, number];
  rotationRad?: number;
  supported: boolean;
}

const supportedCodes = new Set([40, 47, 48, 71, 75, 76, 142, 144, 271, 272, 277]);
const validValue = (code: number, value: number) => {
  if (!Number.isFinite(value)) return false;
  if ([71, 75, 76].includes(code)) return value === 0 || value === 1;
  if ([271, 272].includes(code)) return Number.isInteger(value) && value >= 0 && value <= 8;
  if (code === 277) return value === 1 || value === 2;
  return value >= 0;
};

const expectedValueCode = (code: number) => [40, 47, 48, 142, 144].includes(code) ? 1040 : 1070;

export async function parseDxfDimensionOverridePairs(input: Buffer | Uint8Array): Promise<DxfDimensionOverrideScan> {
  const { acdbCreateDxfPairReader } = await import("@mlightcad/data-model");
  const reader = acdbCreateDxfPairReader(new Uint8Array(input));
  const records = new Map<string, DxfDimensionOverrideRecord>();
  const geometryByHandle = new Map<string, DxfLinearDimensionGeometry>();
  let section = "";
  let sectionNamePending = false;
  let isDimension = false;
  let handle = "";
  let inAcad = false;
  let dstylePending = false;
  let inDstyle = false;
  let pendingCode: number | undefined;
  let values = new Map<number, number>();
  let unsupported = false;
  let sawDstyle = false;
  const sourceNumbers = new Map<number, number>();

  const point = (xCode: number): [number, number] | undefined => {
    const x = sourceNumbers.get(xCode);
    const y = sourceNumbers.get(xCode + 10);
    return x !== undefined && y !== undefined && Number.isFinite(x) && Number.isFinite(y) ? [x, y] : undefined;
  };

  const flush = () => {
    if (isDimension && sawDstyle) {
      if (inDstyle || dstylePending || pendingCode !== undefined || !handle) unsupported = true;
      if (records.has(handle)) unsupported = true;
      const record = { sourceHandle: handle, values, unsupported };
      records.set(handle, record);
    }
    if (isDimension && handle) {
      const dimType = sourceNumbers.get(70);
      if (dimType !== undefined && ((dimType & 7) === 0 || (dimType & 7) === 1)) {
        const defPoint = point(10);
        const line1Start = point(13);
        const line1End = point(14);
        const nx = sourceNumbers.get(210) ?? 0;
        const ny = sourceNumbers.get(220) ?? 0;
        const nz = sourceNumbers.get(230) ?? 1;
        const planar = nx === 0 && ny === 0 && nz === 1
          && [30, 33, 34].every((code) => (sourceNumbers.get(code) ?? 0) === 0)
          && (sourceNumbers.get(52) ?? 0) === 0;
        const rotationDeg = sourceNumbers.get(50);
        const supported = Boolean(Number.isInteger(dimType) && defPoint && line1Start && line1End && planar
          && (rotationDeg === undefined || Number.isFinite(rotationDeg)) && !geometryByHandle.has(handle));
        geometryByHandle.set(handle, {
          sourceHandle: handle,
          dimType,
          defPoint,
          line1Start,
          line1End,
          rotationRad: rotationDeg !== undefined && Number.isFinite(rotationDeg) ? rotationDeg * Math.PI / 180 : undefined,
          supported,
        });
      }
    }
    isDimension = false;
    handle = "";
    inAcad = false;
    dstylePending = false;
    inDstyle = false;
    pendingCode = undefined;
    values = new Map();
    unsupported = false;
    sawDstyle = false;
    sourceNumbers.clear();
  };

  for (let pair = reader.next(); pair; pair = reader.next()) {
    if (pair.code === 0) {
      flush();
      const kind = String(pair.value).trim().toUpperCase();
      if (kind === "SECTION") sectionNamePending = true;
      else if (kind === "ENDSEC") section = "";
      else isDimension = section === "ENTITIES" && kind === "DIMENSION";
      continue;
    }
    if (sectionNamePending && pair.code === 2) {
      section = String(pair.value).trim().toUpperCase();
      sectionNamePending = false;
      continue;
    }
    if (!isDimension) continue;
    const raw = String(pair.value).trim();
    if (!inAcad && [10, 20, 30, 13, 23, 33, 14, 24, 34, 50, 52, 70, 210, 220, 230].includes(pair.code)) {
      sourceNumbers.set(pair.code, Number(raw));
    }
    if (pair.code === 5) {
      handle = raw.toUpperCase();
    } else if (pair.code === 1001) {
      if (inDstyle || dstylePending) unsupported = true;
      inAcad = raw.toUpperCase() === "ACAD";
      dstylePending = false;
    } else if (pair.code === 1000 && inAcad && !inDstyle) {
      dstylePending = raw.toUpperCase() === "DSTYLE";
      if (dstylePending) sawDstyle = true;
    } else if (pair.code === 1002 && inAcad) {
      if (raw === "{" && dstylePending && !inDstyle) {
        inDstyle = true;
        sawDstyle = true;
        dstylePending = false;
      } else if (raw === "}" && inDstyle) {
        if (pendingCode !== undefined) unsupported = true;
        inDstyle = false;
        pendingCode = undefined;
      } else if (inDstyle || dstylePending) {
        unsupported = true;
      }
    } else if (inDstyle) {
      if (pendingCode === undefined) {
        const code = Number(raw);
        if (pair.code !== 1070 || !Number.isInteger(code)) unsupported = true;
        else pendingCode = code;
      } else {
        const value = Number(raw);
        if (!supportedCodes.has(pendingCode) || pair.code !== expectedValueCode(pendingCode) || !validValue(pendingCode, value)) unsupported = true;
        else values.set(pendingCode, value);
        pendingCode = undefined;
      }
    }
  }
  flush();
  return { byHandle: records, geometryByHandle };
}
