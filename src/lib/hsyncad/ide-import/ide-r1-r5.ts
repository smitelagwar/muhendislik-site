import { decodeCp1254, encodeCp1254 } from "./cp1254";
import { scanIde201094Streams } from "./ide-zlib";

/**
 * Encoded v11 sub-stream frame magic (T-F5.1, measured on the 2026-11-19 equivalence corpus).
 *
 * The v10 writer frames zlib sub-streams with the u32 marker 0x00031186
 * (`scanIde201094Streams`); the encoded 211220 writer (X11_downloads.ide11,
 * D0_desktop.ide11trial) frames the same `[u32 compLen][u32 rawLen][0x78 zlib]`
 * body with u32 0x00033914 instead, so the frames are invisible to the v10
 * scanner. Census on X11: 30259 encoded-magic streams + the single plain
 * drawing-style stream (0x00031186, raw 813063) == A0's 30260 total.
 */
const IDE_V11_STREAM_MAGIC = 0x33914;

export interface IdeV11SubStreamHeader {
  offset: number;
  endOffset: number;
  rawLength: number;
}

/** Scan `[u32 0x33914][u32 compLen][u32 rawLen][0x78…]` frames in an encoded v11 body. */
function scanIdeV11SubStreams(
  bytes: Uint8Array,
  startOffset: number,
  endOffset: number,
  maxStreams: number,
): IdeV11SubStreamHeader[] {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const limit = Math.min(bytes.length, endOffset);
  const out: IdeV11SubStreamHeader[] = [];
  let pos = Math.max(0, startOffset);
  while (pos + 16 <= limit && out.length < maxStreams) {
    if (view.getUint32(pos, true) === IDE_V11_STREAM_MAGIC) {
      const compressedLength = view.getUint32(pos + 4, true);
      const rawLength = view.getUint32(pos + 8, true);
      const streamEnd = pos + 12 + compressedLength;
      if (
        compressedLength >= 8 &&
        compressedLength <= 64 * 1024 * 1024 &&
        rawLength >= 1 &&
        rawLength <= 64 * 1024 * 1024 &&
        streamEnd <= limit &&
        bytes[pos + 12] === 0x78
      ) {
        out.push({ offset: pos, endOffset: streamEnd, rawLength });
        pos = streamEnd;
        continue;
      }
    }
    pos++;
  }
  return out;
}

export interface IdeMaterialRecord {
  id: number;
  name: string;
  kind: "concrete" | "steel";
  fckMpa: number | null;
  fykMpa: number | null;
  fctkMpa: number | null;
  gammaS: number | null;
  gammaC: number | null;
  elasticModulusMpa: number;
  poisson: number;
  unitWeightTfM3: number;
  sourceOffset: number;
}

export interface IdeSlabLoadTriplet {
  deadTfM2: number;
  finishTfM2: number;
  liveTfM2: number;
  unit: "tf/m²";
  sourceOffset: number;
}

export interface IdeSeismicAndSoilParams {
  exposureClass?: string;
  rEntered: number | null;
  rSelectedRatio: number | null;
  liveLoadFactorN: number | null;
  subgradeKoTfM3: number | null;
  bearingCapacityQtTfM2: number | null;
  importanceI: number | null;
  spectrumId?: string;
  ss: number | null;
  s1: number | null;
  sds: number | null;
  sd1: number | null;
  latitude?: number | null;
  longitude?: number | null;
}

export type IdeElementRebar =
  | { kind: "column"; majorCount: number; minorCount: number; barDiaMm: number; stirrupDiaMm: number; stirrupSpacingCm: number[] }
  | { kind: "wall"; webDiaMm: number; webSpacingCm: number; headCount: number; headDiaMm: number; webStirrupDiaMm: number; webStirrupSpacingCm: number; headStirrupDiaMm: number; headStirrupSpacingCm: number }
  | { kind: "beam"; topCount: number; topDiaMm: number; bottomCount: number; bottomDiaMm: number; stirrupDiaMm: number; stirrupSpacingCm: number[] }
  | { kind: "raft"; topX: string; topY: string; bottomX: string; bottomY: string };

export interface IdePrecomputedF9 {
  modalTables: {
    name: string;
    modeCount: number;
    frequenciesHz: number[];
    gamma?: number[];
    effectiveMassT?: number[];
  }[];
  barForceStreamsCount: number;
  nodalDisplacementStreamsCount: number;
  shellResultStreamsCount: number;
}

export interface IdeF9FrameForceRow {
  caseIndex: number;
  stationIndex: number;
  n: number;
  v2: number;
  v3: number;
  t: number;
  m2: number;
  m3: number;
}

const TF_CM2_TO_MPA = 0.0980665;
const TF_M2_TO_MPA = 0.00980665;
const REBAR_DIAS = new Set([8, 10, 12, 14, 16, 18, 20, 22, 25, 28, 32]);
const STIRRUP_DIAS = new Set([6, 8, 10, 12]);
const FRAME_STREAM_RAW_SIZES = new Set([532, 820, 1636, 1852, 5716]);
const EXPOSURE_CLASSES = new Set([
  "XO", "X0",
  "XC1", "XC2", "XC3", "XC4",
  "XS1", "XS2", "XS3",
  "XD1", "XD2", "XD3",
  "XF1", "XF2", "XF3", "XF4",
  "XA1", "XA2", "XA3",
]);

function isFiniteRange(n: number, min: number, max: number): boolean {
  return Number.isFinite(n) && n >= min && n <= max;
}

function readF64OrNull(view: DataView, offset: number, min: number, max: number): number | null {
  if (offset < 0 || offset + 8 > view.byteLength) return null;
  const v = view.getFloat64(offset, true);
  return isFiniteRange(v, min, max) ? v : null;
}

function findAsciiBytes(bytes: Uint8Array, needle: string, from = 0, to = bytes.length): number {
  const target = encodeCp1254(needle);
  const limit = Math.min(bytes.length, to) - target.length;
  outer: for (let i = Math.max(0, from); i <= limit; i++) {
    for (let j = 0; j < target.length; j++) {
      if (bytes[i + j] !== target[j]) continue outer;
    }
    return i;
  }
  return -1;
}

/**
 * Native material name hash (`FUN_1409486a0`).
 * `"CONTINUOUS"` returns `0x941` (`2369`); otherwise up to 11 CP1254 chars (clamped to 10 if `len >= 12`).
 */
export function computeIdeMaterialHash(name: string): number {
  if (name === "CONTINUOUS") return 0x941;
  const raw = encodeCp1254(name);
  const n = raw.length < 12 ? raw.length : 10;
  const weights = [0x1d, 0x11, 1];
  let sum = 0;
  for (let i = 0; i < n; i++) {
    let ch = raw[i];
    if (ch >= 97 && ch <= 122) ch -= 32;
    sum += Math.abs(ch - 65) * weights[i % 3];
  }
  return sum;
}

/** Transform ideCAD F9 local coordinates `(x, y, z)` to `(x, -z, y)` global right-handed frame. */
export function transformIdeF9Coord(x: number, y: number, z: number): { x: number; y: number; z: number } {
  return { x, y: -z, z: y };
}

/** R1: Extract global material dictionary anchored after `TEMEL TASARIM ZARFI\0` (+764 + 38).
 *
 * v10 (201094): 14 contiguous plain f64s per record (fck/fyk stored in tf/cm², E in tf/m²).
 * Encoded v11 (211220/211280, T-F5.1, measured on X11/B0/C1/D0): the record header
 * and the `+802` count anchor are identical, but the 13 numeric fields sit on an
 * encoded-f64 grid with four u32 separators (104/131/131/[150], semantics unestablished)
 * and a 128-byte stride: fck/fyk are stored already in MPa while fctk stays tf/cm² and
 * E stays tf/m² — the decoded values equal the v10 record after its unit conversions. */
export function extractIdeMaterials(bytes: Uint8Array, view: DataView, v11Encoded = false): IdeMaterialRecord[] | undefined {
  const zt = findAsciiBytes(bytes, "TEMEL TASARIM ZARFI\0");
  if (zt < 0) return undefined;
  const countOffset = zt + 764 + 38;
  if (countOffset + 4 > bytes.length) return undefined;
  const count = view.getUint32(countOffset, true);
  if (count < 1 || count > 64) return undefined;

  const materials: IdeMaterialRecord[] = [];
  let cursor = countOffset + 4;
  for (let i = 0; i < count; i++) {
    if (cursor + 13 > bytes.length) return undefined;
    const kindRaw = view.getUint32(cursor + 4, true);
    const strFlag = bytes[cursor + 8];
    const slen = view.getUint32(cursor + 9, true);
    if (strFlag !== 0 || slen < 2 || slen > 128 || cursor + 13 + slen + (v11Encoded ? 128 : 112) > bytes.length) return undefined;
    if (bytes[cursor + 13 + slen - 1] !== 0) return undefined;
    const name = decodeCp1254(bytes.subarray(cursor + 13, cursor + 13 + slen - 1));
    const floatsOffset = cursor + 13 + slen;
    let fckMpaValue: number, fykMpaValue: number, fctkMpaValue: number;
    let gammaS: number, gammaC: number, elasticModulusMpa: number, poisson: number, unitWeightTfM3: number;
    if (v11Encoded) {
      // Encoded v11 grid: [fck MPa] [u32] [fyk MPa] [u32] [fyk MPa] [u32]
      // [fctk tf/cm²][?0.85][gammaS][gammaC][E tf/m²][poisson][weight][1e-5][0][?][u32][?].
      fckMpaValue = view.getFloat64(floatsOffset, true);
      fykMpaValue = view.getFloat64(floatsOffset + 12, true);
      fctkMpaValue = view.getFloat64(floatsOffset + 36, true) * TF_CM2_TO_MPA;
      gammaS = view.getFloat64(floatsOffset + 52, true);
      gammaC = view.getFloat64(floatsOffset + 60, true);
      elasticModulusMpa = view.getFloat64(floatsOffset + 68, true) * TF_M2_TO_MPA;
      poisson = view.getFloat64(floatsOffset + 76, true);
      unitWeightTfM3 = view.getFloat64(floatsOffset + 84, true);
    } else {
      const raw: number[] = [];
      for (let j = 0; j < 14; j++) {
        raw.push(view.getFloat64(floatsOffset + j * 8, true));
      }
      fckMpaValue = raw[0] * TF_CM2_TO_MPA;
      fykMpaValue = raw[1] * TF_CM2_TO_MPA;
      fctkMpaValue = raw[3] * TF_CM2_TO_MPA;
      gammaS = raw[5];
      gammaC = raw[6];
      elasticModulusMpa = raw[7] * TF_M2_TO_MPA;
      poisson = raw[8];
      unitWeightTfM3 = raw[9];
    }
    if (!isFiniteRange(elasticModulusMpa, 100, 1_000_000) || !isFiniteRange(poisson, 0, 0.5) || !isFiniteRange(unitWeightTfM3, 0.01, 50)) {
      return undefined;
    }
    const kind: "concrete" | "steel" = kindRaw === 1 || unitWeightTfM3 > 5 || elasticModulusMpa > 100_000 ? "steel" : "concrete";
    const isConcrete = kind === "concrete";
    materials.push({
      id: i,
      name,
      kind,
      fckMpa: isConcrete && isFiniteRange(fckMpaValue, 1, 200) ? fckMpaValue : null,
      fykMpa: isConcrete && isFiniteRange(fykMpaValue, 10, 2000) ? fykMpaValue : null,
      fctkMpa: isConcrete && isFiniteRange(fctkMpaValue, 0.1, 50) ? fctkMpaValue : null,
      gammaS: isConcrete && isFiniteRange(gammaS, 0.5, 5) ? gammaS : null,
      gammaC: isConcrete && isFiniteRange(gammaC, 0.5, 5) ? gammaC : null,
      elasticModulusMpa,
      poisson,
      unitWeightTfM3,
      sourceOffset: cursor,
    });
    cursor = floatsOffset + (v11Encoded ? 128 : 112);
  }
  return materials.length ? materials : undefined;
}

/** R1: Resolve per-element `materialIndex` from `"CONTINUOUS"` (`0x941` inherit default concrete) or explicit material name. */
export function resolveElementMaterialIndex(
  bytes: Uint8Array,
  view: DataView,
  attributesOffset: number,
  recordEnd: number,
  type: string,
  structural: boolean | undefined,
  materials: IdeMaterialRecord[] | undefined,
): number | undefined {
  if (!materials?.length) return undefined;
  if (type === "axis" || type === "line" || type === "section" || type === "band") return undefined;
  if (type === "wall" && structural === false) return undefined;

  const defaultConcreteId = materials.find(m => m.kind === "concrete")?.id ?? materials[0].id;
  const searchEnd = Math.min(bytes.length, recordEnd, attributesOffset + 450);
  for (let at = attributesOffset + 340; at + 8 < searchEnd; at++) {
    const slen = view.getUint32(at, true);
    if (slen < 2 || slen > 64 || at + 4 + slen > searchEnd || bytes[at + 3 + slen] !== 0) continue;
    const text = decodeCp1254(bytes.subarray(at + 4, at + 3 + slen));
    if (text === "CONTINUOUS") return defaultConcreteId;
    const explicit = materials.find(m => m.name === text);
    if (explicit) return explicit.id;
  }
  if (type === "column" || type === "beam" || type === "wall" || type === "slab") {
    return defaultConcreteId;
  }
  return undefined;
}

/** R3: Extract pre-floor TBDY/soil params, tail `DSF1`/`RSF1` spectrum params, and `G1` lat/lon.
 *
 * The pre-floor `ko` slot anchors at a version-dependent distance before the
 * exposure-class string (measured, T-F5.1): v10 201094 → 568; encoded v11
 * 211220 → 677 (X11/D0); encoded v11 211280 → 561 (B0/C1). Relative to `ko`
 * the fields keep the same v10 offsets in every version family (with the
 * (r, ratio) pair duplicated 16 bytes earlier in encoded v11 carriers). The
 * tail `G1` latitude/longitude stay plain little-endian f64 in encoded v11
 * bodies (they are outside the Blowfish numeric coding), unlike the pre-floor
 * and spectrum f64 fields which decode through the encoded view. */
export function extractIdeSeismicAndSoil(
  bytes: Uint8Array,
  view: DataView,
  firstFloorOffset: number,
  lastFloorOffset: number,
  v11Encoded = false,
  carrierVersion = 0,
): IdeSeismicAndSoilParams | undefined {
  let exposureClass: string | undefined;
  let rEntered: number | null = null;
  let rSelectedRatio: number | null = null;
  let liveLoadFactorN: number | null = null;
  let subgradeKoTfM3: number | null = null;
  let bearingCapacityQtTfM2: number | null = null;
  let importanceI: number | null = null;

  const koAnchorDistance = v11Encoded ? (carrierVersion >= 211280 ? 561 : 677) : 568;
  const preLimit = Math.min(bytes.length - 8, firstFloorOffset);
  for (let at = 24; at + 8 < preLimit; at++) {
    const slen = view.getUint32(at, true);
    if (slen < 3 || slen > 4 || at + 4 + slen > preLimit || bytes[at + 3 + slen] !== 0) continue;
    const candidate = decodeCp1254(bytes.subarray(at + 4, at + 3 + slen));
    if (!EXPOSURE_CLASSES.has(candidate)) continue;
    const koOff = at + 4 - koAnchorDistance;
    if (koOff < 49) continue;
    const ko = readF64OrNull(view, koOff, 1, 1_000_000);
    const nVal = readF64OrNull(view, koOff - 8, 0, 2);
    if (ko === null || nVal === null) continue;
    exposureClass = candidate;
    rEntered = readF64OrNull(view, koOff - 49, 0.5, 20);
    rSelectedRatio = readF64OrNull(view, koOff - 41, 0.5, 20);
    liveLoadFactorN = nVal;
    subgradeKoTfM3 = ko;
    bearingCapacityQtTfM2 = readF64OrNull(view, koOff + 8, 0.1, 100_000);
    importanceI = readF64OrNull(view, koOff + 34, 0.5, 5);
    break;
  }

  let spectrumId: string | undefined;
  let ss: number | null = null;
  let s1: number | null = null;
  let sds: number | null = null;
  let sd1: number | null = null;

  for (const tag of ["DSF1\0", "RSF1\0"] as const) {
    const tagOff = findAsciiBytes(bytes, tag, Math.max(0, lastFloorOffset));
    if (tagOff >= 4 && view.getUint32(tagOff - 4, true) === 5) {
      const specEnd = tagOff + 5;
      const candSs = readF64OrNull(view, specEnd + 44, 0, 20);
      const candS1 = readF64OrNull(view, specEnd + 52, 0, 20);
      const candSds = readF64OrNull(view, specEnd + 68, 0, 20);
      const candSd1 = readF64OrNull(view, specEnd + 76, 0, 20);
      if (candSs !== null && candS1 !== null && candSds !== null && candSd1 !== null) {
        spectrumId = tag.slice(0, 4);
        ss = candSs;
        s1 = candS1;
        sds = candSds;
        sd1 = candSd1;
        break;
      }
    }
  }

  let latitude: number | null | undefined;
  let longitude: number | null | undefined;
  const g1Off = findAsciiBytes(bytes, "\x03\x00\x00\x00G1\0", Math.max(0, lastFloorOffset));
  if (g1Off >= 0 && g1Off + 23 <= bytes.length) {
    // Encoded v11 carriers keep the G1 latitude/longitude as plain f64 outside
    // the Blowfish numeric coding; read them through a raw view there.
    const rawView = v11Encoded ? new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength) : view;
    const lat = readF64OrNull(rawView, g1Off + 7, -90, 90);
    const lon = readF64OrNull(rawView, g1Off + 15, -180, 180);
    if (lat !== null && lon !== null && (Math.abs(lat) > 0.01 || Math.abs(lon) > 0.01)) {
      latitude = lat;
      longitude = lon;
    }
  }

  if (exposureClass === undefined && spectrumId === undefined && latitude === undefined) {
    return undefined;
  }

  return {
    ...(exposureClass !== undefined ? { exposureClass } : {}),
    rEntered,
    rSelectedRatio,
    liveLoadFactorN,
    subgradeKoTfM3,
    bearingCapacityQtTfM2,
    importanceI,
    ...(spectrumId !== undefined ? { spectrumId } : {}),
    ss,
    s1,
    sds,
    sd1,
    ...(latitude !== undefined ? { latitude } : {}),
    ...(longitude !== undefined ? { longitude } : {}),
  };
}

/**
 * R4 (encoded v11, T-F5.1): rebar schedules in the 211220 encoded body.
 *
 * Measured on X11_downloads.ide11 (all anchors value-validated, no fitting):
 * - Sub-streams are framed with u32 0x33914 (`scanIdeV11SubStreams`), the zlib
 *   payloads inflate byte-identically to the v10 twin streams.
 * - Beam tuple after the last sub-stream: `[u32 1][enc topDia m][u32 topCount][u32 1][u32 1][enc 0]…[u32 1][u32 1][enc botDia m][u32 botCount]…[enc stirrupDia m][enc sp0 m][enc sp1 m]`
 *   at p+4/p+12/p+16/p+40/p+48/p+140/p+148/p+156 (p+140 group preceded by u32 1 at p+136).
 * - Wall tuple: `[enc webSpacing m]` at p, then `[u32 1][enc webDia m]` at p+8/+12,
 *   `[u32 1][enc headDia m][u32 headCount]` at p+20/+24/+32, mirrored right head at
 *   p+36/+40/+48, `[enc headStirrupSpacing m]` p+52, `[u32 1][enc headStirrupDia m]` p+60/+64,
 *   `[enc webStirrupSpacing m]` p+72, `[u32 1][enc webStirrupDia m]` p+80/+84.
 * - Raft foundation: `[enc spacing m][u32 1][enc dia m]` twice (X/Y) at q/q+4/q+12
 *   and q+20/q+24/q+32, near `attributes+975` (v10 reads the same pair at +960+shift).
 * Diameters/spacings are encoded f64 in metres (0.014 m = Ø14, 0.2 m = 20 cm);
 * counts stay plain u32. No encoded-column evidence exists in the corpus, so
 * columns are left unresolved (undefined) rather than guessed.
 */
function extractIdeElementRebarV11(
  bytes: Uint8Array,
  view: DataView,
  attributesOffset: number,
  limit: number,
  type: string,
  foundation: boolean,
): IdeElementRebar | undefined {
  const diaMm = (f: number) => Math.round(f * 1000);
  const spacingCm = (f: number) => Math.round(f * 100);
  const isDiaM = (f: number) => Number.isFinite(f) && Math.abs(f * 1000 - Math.round(f * 1000)) < 1e-6 && REBAR_DIAS.has(diaMm(f));
  const isStirrupDiaM = (f: number) => Number.isFinite(f) && Math.abs(f * 1000 - Math.round(f * 1000)) < 1e-6 && STIRRUP_DIAS.has(diaMm(f));
  const isSpacingM = (f: number, minCm: number, maxCm: number) =>
    Number.isFinite(f) && Math.abs(f * 100 - Math.round(f * 100)) < 1e-6 && spacingCm(f) >= minCm && spacingCm(f) <= maxCm;

  if (type === "slab" && foundation) {
    // Raft: `[enc spacing m][u32 1][enc dia m][enc spacing m][u32 1][enc dia m]`
    // (X/Y pair) near attributes+976 — v10 reads the same pair at +960+shift.
    const scanEnd = Math.min(limit, attributesOffset + 1100);
    for (let q = Math.max(0, attributesOffset + 900); q + 40 <= scanEnd; q++) {
      const s1 = view.getFloat64(q, true);
      if (!isSpacingM(s1, 5, 50)) continue;
      if (view.getUint32(q + 8, true) !== 1) continue;
      const d1 = view.getFloat64(q + 12, true);
      if (!isDiaM(d1)) continue;
      const s2 = view.getFloat64(q + 20, true);
      if (!isSpacingM(s2, 5, 50)) continue;
      if (view.getUint32(q + 28, true) !== 1) continue;
      const d2 = view.getFloat64(q + 32, true);
      if (!isDiaM(d2)) continue;
      return {
        kind: "raft",
        topX: `Ø${diaMm(d1)}/${spacingCm(s1)}`,
        topY: `Ø${diaMm(d2)}/${spacingCm(s2)}`,
        bottomX: `Ø${diaMm(d1)}/${spacingCm(s1)}`,
        bottomY: `Ø${diaMm(d2)}/${spacingCm(s2)}`,
      };
    }
    return undefined;
  }

  if (type !== "wall" && type !== "beam") return undefined;
  const streams = scanIdeV11SubStreams(bytes, attributesOffset, Math.min(limit, attributesOffset + 20_000), 16);
  if (!streams.length) return undefined;
  const afterStreams = streams[streams.length - 1].endOffset;

  if (type === "wall") {
    // The +220 window cap mirrors the v10 reader's wall scanning discipline.
    const scanEnd = Math.min(limit - 92, afterStreams + 220);
    for (let p = afterStreams + 32; p <= scanEnd; p++) {
      const webSpacing = view.getFloat64(p, true);
      if (!isSpacingM(webSpacing, 5, 50)) continue;
      if (view.getUint32(p + 8, true) !== 1) continue;
      const webDia = view.getFloat64(p + 12, true);
      if (!isDiaM(webDia)) continue;
      if (view.getUint32(p + 20, true) !== 1) continue;
      const headDiaL = view.getFloat64(p + 24, true);
      if (!isDiaM(headDiaL)) continue;
      const headCountL = view.getUint32(p + 32, true);
      if (headCountL < 1 || headCountL > 60) continue;
      if (view.getUint32(p + 36, true) !== 1) continue;
      const headDiaR = view.getFloat64(p + 40, true);
      if (!isDiaM(headDiaR) || diaMm(headDiaR) !== diaMm(headDiaL)) continue;
      const headCountR = view.getUint32(p + 48, true);
      if (headCountR !== headCountL) continue;
      const headStirrupSpacing = view.getFloat64(p + 52, true);
      if (!isSpacingM(headStirrupSpacing, 4, 40)) continue;
      if (view.getUint32(p + 60, true) !== 1) continue;
      const headStirrupDia = view.getFloat64(p + 64, true);
      if (!isStirrupDiaM(headStirrupDia)) continue;
      const webStirrupSpacing = view.getFloat64(p + 72, true);
      if (!isSpacingM(webStirrupSpacing, 4, 40)) continue;
      if (view.getUint32(p + 80, true) !== 1) continue;
      const webStirrupDia = view.getFloat64(p + 84, true);
      if (!isStirrupDiaM(webStirrupDia)) continue;
      return {
        kind: "wall",
        webDiaMm: diaMm(webDia),
        webSpacingCm: spacingCm(webSpacing),
        headCount: headCountL,
        headDiaMm: diaMm(headDiaL),
        webStirrupDiaMm: diaMm(webStirrupDia),
        webStirrupSpacingCm: spacingCm(webStirrupSpacing),
        headStirrupDiaMm: diaMm(headStirrupDia),
        headStirrupSpacingCm: spacingCm(headStirrupSpacing),
      };
    }
    return undefined;
  }

  // Beam: p+4 topDia, p+12 topCount, p+40 bottomDia, p+48 bottomCount,
  // p+140 stirrup dia, p+148/p+156 stirrup spacings (all encoded f64 in metres).
  // The +700 window cap mirrors the v10 reader's scanning discipline so the
  // encoded profile matches the A0 oracle one-to-one (T-F5.1 note: tuples do
  // exist beyond +700 in both bodies — e.g. A0 K40 at +725 — but widening the
  // window would change v10-established counts and belongs to a separate task).
  const scanEnd = Math.min(limit - 164, afterStreams + 700);
  for (let p = afterStreams + 32; p <= scanEnd; p++) {
    if (view.getUint32(p, true) !== 1) continue;
    const topDia = view.getFloat64(p + 4, true);
    if (!isDiaM(topDia)) continue;
    const topCount = view.getUint32(p + 12, true);
    if (topCount < 1 || topCount > 24) continue;
    if (view.getUint32(p + 16, true) !== 1) continue;
    if (view.getUint32(p + 36, true) !== 1) continue;
    const bottomDia = view.getFloat64(p + 40, true);
    if (!isDiaM(bottomDia)) continue;
    const bottomCount = view.getUint32(p + 48, true);
    if (bottomCount < 1 || bottomCount > 24) continue;
    const stirrupDia = view.getFloat64(p + 140, true);
    if (!isStirrupDiaM(stirrupDia)) continue;
    const sp0 = view.getFloat64(p + 148, true);
    if (!isSpacingM(sp0, 4, 40)) continue;
    const sp1 = view.getFloat64(p + 156, true);
    if (!isSpacingM(sp1, 4, 40)) continue;
    return {
      kind: "beam",
      topCount,
      topDiaMm: diaMm(topDia),
      bottomCount,
      bottomDiaMm: diaMm(bottomDia),
      stirrupDiaMm: diaMm(stirrupDia),
      stirrupSpacingCm: [spacingCm(sp0), spacingCm(sp1)],
    };
  }
  return undefined;
}

/** R4: Extract per-element rebar schedules strictly within `[attributesOffset .. recordEnd]`. */
export function extractIdeElementRebar(
  bytes: Uint8Array,
  view: DataView,
  attributesOffset: number,
  recordEnd: number,
  type: string,
  foundation: boolean,
  v11Schema: boolean,
  v11Encoded = false,
): IdeElementRebar | undefined {
  const limit = Math.min(bytes.length, recordEnd);
  if (v11Encoded) {
    return extractIdeElementRebarV11(bytes, view, attributesOffset, limit, type, foundation);
  }
  const shift = v11Schema ? 4 : 0;

  if (type === "slab" && foundation) {
    const off = attributesOffset + 960 + shift;
    if (off + 16 > limit) return undefined;
    const d1 = view.getInt32(off, true);
    const s1 = view.getInt32(off + 4, true);
    const d2 = view.getInt32(off + 8, true);
    const s2 = view.getInt32(off + 12, true);
    if (REBAR_DIAS.has(d1) && REBAR_DIAS.has(d2) && s1 >= 5 && s1 <= 50 && s2 >= 5 && s2 <= 50) {
      return {
        kind: "raft",
        topX: `Ø${d1}/${s1}`,
        topY: `Ø${d2}/${s2}`,
        bottomX: `Ø${d1}/${s1}`,
        bottomY: `Ø${d2}/${s2}`,
      };
    }
    return undefined;
  }

  if (type !== "column" && type !== "wall" && type !== "beam") return undefined;
  const streams = scanIde201094Streams(bytes, attributesOffset, Math.min(limit, attributesOffset + 20_000), 16);
  if (!streams.length) return undefined;
  const afterStreams = streams[streams.length - 1].endOffset;

  if (type === "column") {
    const scanEnd = Math.min(limit - 36, afterStreams + 220);
    for (let p = afterStreams + 32; p <= scanEnd; p++) {
      const barDia = view.getInt32(p, true);
      const majorCount = view.getInt32(p + 4, true);
      const barDia2 = view.getInt32(p + 8, true);
      const minorCount = view.getInt32(p + 12, true);
      const stDia = view.getInt32(p + 16, true);
      const sp0 = view.getInt32(p + 20, true);
      const stDia2 = view.getInt32(p + 24, true);
      const sp1 = view.getInt32(p + 28, true);
      const sp2 = view.getInt32(p + 32, true);
      if (
        REBAR_DIAS.has(barDia) &&
        barDia === barDia2 &&
        majorCount >= 1 && majorCount <= 40 &&
        minorCount >= 1 && minorCount <= 40 &&
        STIRRUP_DIAS.has(stDia) &&
        stDia === stDia2 &&
        sp0 >= 4 && sp0 <= 40 &&
        sp1 >= 4 && sp1 <= 40 &&
        sp2 >= 4 && sp2 <= 40
      ) {
        return {
          kind: "column",
          majorCount,
          minorCount,
          barDiaMm: barDia,
          stirrupDiaMm: stDia,
          stirrupSpacingCm: [sp0, sp1, sp2],
        };
      }
    }
    return undefined;
  }

  if (type === "wall") {
    const scanEnd = Math.min(limit - 40, afterStreams + 220);
    for (let p = afterStreams + 32; p <= scanEnd; p++) {
      const webDia = view.getInt32(p, true);
      const webSpacing = view.getInt32(p + 4, true);
      const headDiaL = view.getInt32(p + 8, true);
      const headCountL = view.getInt32(p + 12, true);
      const headDiaR = view.getInt32(p + 16, true);
      const headCountR = view.getInt32(p + 20, true);
      const headStDia = view.getInt32(p + 24, true);
      const headStSp = view.getInt32(p + 28, true);
      const webStDia = view.getInt32(p + 32, true);
      const webStSp = view.getInt32(p + 36, true);
      if (
        REBAR_DIAS.has(webDia) &&
        webSpacing >= 5 && webSpacing <= 50 &&
        REBAR_DIAS.has(headDiaL) &&
        headDiaL === headDiaR &&
        headCountL >= 1 && headCountL <= 60 &&
        headCountL === headCountR &&
        STIRRUP_DIAS.has(headStDia) &&
        STIRRUP_DIAS.has(webStDia) &&
        headStSp >= 4 && headStSp <= 40 &&
        webStSp >= 4 && webStSp <= 40
      ) {
        return {
          kind: "wall",
          webDiaMm: webDia,
          webSpacingCm: webSpacing,
          headCount: headCountL,
          headDiaMm: headDiaL,
          webStirrupDiaMm: webStDia,
          webStirrupSpacingCm: webStSp,
          headStirrupDiaMm: headStDia,
          headStirrupSpacingCm: headStSp,
        };
      }
    }
    return undefined;
  }

  // Beam: after zero gap following last F9 stream (`topDia, topCount @ +0`, `botDia, botCount @ +20`, `stDia, sp0, sp1 @ +80`)
  const scanEnd = Math.min(limit - 92, afterStreams + 700);
  for (let p = afterStreams + 32; p <= scanEnd; p++) {
    const topDia = view.getInt32(p, true);
    const topCount = view.getInt32(p + 4, true);
    const botDia = view.getInt32(p + 20, true);
    const botCount = view.getInt32(p + 24, true);
    const stDia = view.getInt32(p + 80, true);
    const sp0 = view.getInt32(p + 84, true);
    const sp1 = view.getInt32(p + 88, true);
    if (
      REBAR_DIAS.has(topDia) &&
      REBAR_DIAS.has(botDia) &&
      topCount >= 1 && topCount <= 24 &&
      botCount >= 1 && botCount <= 24 &&
      STIRRUP_DIAS.has(stDia) &&
      sp0 >= 4 && sp0 <= 40 &&
      sp1 >= 4 && sp1 <= 40 &&
      view.getInt32(p - 4, true) === 0 &&
      view.getInt32(p - 8, true) === 0
    ) {
      return {
        kind: "beam",
        topCount,
        topDiaMm: topDia,
        bottomCount: botCount,
        bottomDiaMm: botDia,
        stirrupDiaMm: stDia,
        stirrupSpacingCm: [sp0, sp1],
      };
    }
  }
  return undefined;
}

/** R5: Extract Modal tables and `201094` F9 stream counts without inflating 28k+ streams upfront.
 *
 * Encoded v11 bodies (T-F5.1) frame their sub-streams with u32 0x33914; both
 * magics are scanned there so the census matches the v10 reading of the same
 * project (X11: 1057 bar + 28001 nodal + 373 shell == A0). */
export function extractIdePrecomputedF9(
  bytes: Uint8Array,
  view: DataView,
  lastFloorOffset: number,
  v11Encoded = false,
): IdePrecomputedF9 | undefined {
  const streams = v11Encoded
    ? [...scanIde201094Streams(bytes), ...scanIdeV11SubStreams(bytes, 0, bytes.length, 200_000)]
    : scanIde201094Streams(bytes);
  let barForceStreamsCount = 0;
  let nodalDisplacementStreamsCount = 0;
  let shellResultStreamsCount = 0;

  for (const s of streams) {
    if (FRAME_STREAM_RAW_SIZES.has(s.rawLength)) {
      barForceStreamsCount++;
    } else if (s.rawLength === 14620 || s.rawLength === 13564) {
      nodalDisplacementStreamsCount++;
    } else if (s.rawLength >= 45 && (s.rawLength - 17) % 28 === 0) {
      shellResultStreamsCount++;
    }
  }

  const modalTables: IdePrecomputedF9["modalTables"] = [];
  const modalStart = Math.max(24, lastFloorOffset);
  for (let i = modalStart; i + 120 < bytes.length; i++) {
    const slen = view.getUint32(i, true);
    if (slen < 7 || slen > 24 || i + 4 + slen + 112 > bytes.length || bytes[i + 3 + slen] !== 0) continue;
    // Fast prefix check for "Modal"
    if (bytes[i + 4] !== 77 || bytes[i + 5] !== 111 || bytes[i + 6] !== 100 || bytes[i + 7] !== 97 || bytes[i + 8] !== 108) continue;
    const name = decodeCp1254(bytes.subarray(i + 4, i + 3 + slen));
    if (!/^Modal(?:-B)?(?:'| [EB]+E?\d)$/.test(name)) continue;

    const nameEnd = i + 4 + slen;
    const modeCount = view.getUint32(nameEnd + 104, true);
    if (modeCount < 1 || modeCount > 120 || nameEnd + 108 + modeCount * 8 > bytes.length) continue;

    const frequenciesHz: number[] = [];
    let validFreqs = true;
    for (let m = 0; m < modeCount; m++) {
      const f = view.getFloat64(nameEnd + 108 + m * 8, true);
      if (!isFiniteRange(f, 1e-9, 100_000)) {
        validFreqs = false;
        break;
      }
      frequenciesHz.push(f);
    }
    if (!validFreqs) continue;

    const massStart = nameEnd + 108 + modeCount * 8;
    let gamma: number[] | undefined;
    let effectiveMassT: number[] | undefined;
    if (massStart + modeCount * 18 * 8 <= bytes.length) {
      const candGamma: number[] = [];
      const candMass: number[] = [];
      let validMass = true;
      for (let m = 0; m < modeCount; m++) {
        const g = view.getFloat64(massStart + (m * 18 + 1) * 8, true);
        const me = view.getFloat64(massStart + (m * 18 + 2) * 8, true);
        if (!isFiniteRange(Math.abs(g), 0, 1_000_000) || !isFiniteRange(me, 0, 1_000_000)) {
          validMass = false;
          break;
        }
        candGamma.push(g);
        candMass.push(me);
      }
      if (validMass) {
        gamma = candGamma;
        effectiveMassT = candMass;
      }
    }

    modalTables.push({
      name,
      modeCount,
      frequenciesHz,
      ...(gamma ? { gamma } : {}),
      ...(effectiveMassT ? { effectiveMassT } : {}),
    });
    i = nameEnd + 108 + modeCount * 8;
  }

  if (
    modalTables.length === 0 &&
    barForceStreamsCount === 0 &&
    nodalDisplacementStreamsCount === 0 &&
    shellResultStreamsCount === 0
  ) {
    return undefined;
  }

  return {
    modalTables,
    barForceStreamsCount,
    nodalDisplacementStreamsCount,
    shellResultStreamsCount,
  };
}

/** Decode an inflated `201094` frame force buffer (`[u32 floatCount][case_idx][station_idx][6 f32]`). */
export function decodeF9FrameForces(
  raw: Uint8Array,
  stationCount: number,
  layout: "n_v2_v3_t_m2_m3" | "n_v3_v2_m3_t_m2" | "v3_v2_n_t_negM2_m3" = "n_v2_v3_t_m2_m3",
): IdeF9FrameForceRow[] {
  if (raw.length < 4 || stationCount <= 0) return [];
  const view = new DataView(raw.buffer, raw.byteOffset, raw.byteLength);
  const floatCount = view.getUint32(0, true);
  if (4 + floatCount * 4 > raw.length || floatCount % (stationCount * 6) !== 0) return [];
  const caseCount = floatCount / (stationCount * 6);
  const rows: IdeF9FrameForceRow[] = [];
  for (let c = 0; c < caseCount; c++) {
    for (let s = 0; s < stationCount; s++) {
      const base = 4 + (c * stationCount + s) * 24;
      const a0 = view.getFloat32(base, true);
      const a1 = view.getFloat32(base + 4, true);
      const a2 = view.getFloat32(base + 8, true);
      const a3 = view.getFloat32(base + 12, true);
      const a4 = view.getFloat32(base + 16, true);
      const a5 = view.getFloat32(base + 20, true);
      if (layout === "n_v3_v2_m3_t_m2") {
        rows.push({ caseIndex: c, stationIndex: s, n: a0, v2: a2, v3: a1, t: a4, m2: a5, m3: a3 });
      } else if (layout === "v3_v2_n_t_negM2_m3") {
        rows.push({ caseIndex: c, stationIndex: s, n: a2, v2: a1, v3: a0, t: a3, m2: -a4, m3: a5 });
      } else {
        rows.push({ caseIndex: c, stationIndex: s, n: a0, v2: a1, v3: a2, t: a3, m2: a4, m3: a5 });
      }
    }
  }
  return rows;
}
