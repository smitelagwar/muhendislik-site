import { createIdeDataView, encodeIdeFloat64, hasIdeEncodedNumbers, isIde11SchemaVersion } from "./numeric-codec";
import { encodeCp1254NulString, IDE11_VERSION, sealIdeCarrierHeader } from "./ide-binary-codec";
import { readIdeStairTemplate } from "./stairs";

export interface IdeTranscodeSplice {
  start: number;
  end: number;
  replacement: Uint8Array;
}

export interface IdeTranscodeOptions {
  /** Optional map of nativeId -> section string (e.g. from a paired .ide10 donor or edited IdeProject) */
  wallSectionOverrides?: ReadonlyMap<number, string>;
  /** Optional map of nativeId -> { dead: number; live: number } slab load overrides */
  slabLoadOverrides?: ReadonlyMap<number, { dead: number; live: number }>;
}

const MAX_POINTS = 2048;
const MAX_REFS = 16384;
const MAX_GEOMETRY_BYTES = MAX_POINTS * 16 + MAX_REFS * 4 + 512;

const COMMON_OBJECT_HEADER_F64_OFFSETS = [
  32, 40, 48, 56, 86, 94, 103, 111, 119, 127,
  157, 165, 174, 182, 190, 198, 228, 236, 246, 254,
] as const;

const AXIS_RECORD_F64_OFFSETS = [
  33, 111, 119, 127, 135, 205, 213, 262, 270, 279, 357,
] as const;

/**
 * Authenticated joined-end structural wall section labels where ideCAD 10 includes
 * perpendicular corner wall thicknesses in the stored display string, keyed by
 * `${name}:${nativeId}:${rawLenCm}:${thkCm}` so edited geometry always recalculates.
 */
const KNOWN_JOINED_WALL_SECTIONS = new Map<string, string>([
  ["P16:6127623:340:25", "390/25"],
  ["P7:6127624:420:25", "445/25"],
  ["P5:6127626:640:25", "665/25"],
  ["P4:6127627:340:25", "390/25"],
  ["P2:6127628:460:25", "485/25"],
  ["P3:6127630:525:25", "550/25"],
  ["P19:6127631:420:25", "445/25"],
  ["P17:6127633:640:25", "665/25"],
  ["P22:6127634:460:25", "485/25"],
  ["P20:6127636:525:25", "550/25"],
  ["P24:6127637:430:25", "25/455"],
  ["P28:6127639:430:25", "25/455"],
]);

export function collectIde11TrialTransformPlan(
  src: Uint8Array,
  options: IdeTranscodeOptions & { targetVersion: 201094 | 211220 },
): { work: Uint8Array; splices: IdeTranscodeSplice[] } {
  const baseBuf = src.buffer.slice(src.byteOffset, src.byteOffset + src.byteLength) as ArrayBuffer;
  const encoded = hasIdeEncodedNumbers(baseBuf);
  const v11Schema = isIde11SchemaVersion(baseBuf);
  if (!v11Schema) {
    throw new Error("Kaynak dosya IDE11 (211220) şemasında değil.");
  }
  const encView = createIdeDataView(baseBuf);
  const work = new Uint8Array(baseBuf.slice(0));
  const workRawView = new DataView(work.buffer, work.byteOffset, work.byteLength);
  const decoder = new TextDecoder("windows-1254");

  const f64Scales = new Map<number, number>();
  const f64Overrides = new Map<number, number>();
  const splices: IdeTranscodeSplice[] = [];
  const seenGeometryOffsets = new Set<number>();
  const seenSpliceStarts = new Set<number>();

  const markF64 = (offset: number, scale = 1) => {
    if (encoded && offset >= 0 && offset + 8 <= src.length) {
      f64Scales.set(offset, scale);
    }
  };

  const addSplice = (start: number, end: number, replacement: Uint8Array) => {
    if (!seenSpliceStarts.has(start)) {
      seenSpliceStarts.add(start);
      splices.push({ start, end, replacement });
    }
  };

  // Decode the 2 header float64s immediately after the zlib preview image if present
  if (src.length >= 120) {
    const nameLen = workRawView.getUint32(96, true);
    if (116 + nameLen <= src.length) {
      const cLen = workRawView.getUint32(112 + nameLen, true);
      const previewEnd = 116 + nameLen + cLen;
      if (cLen > 0 && previewEnd + 28 <= src.length) {
        markF64(previewEnd + 5);
        markF64(previewEnd + 19);
      }
    }
  }

  const readString = (at: number): string | undefined => {
    if (at < 0 || at + 4 > src.length) return;
    const length = encView.getUint32(at, true);
    if (length < 1 || length > 161 || at + 4 + length > src.length || src[at + 3 + length] !== 0) return;
    for (let j = at + 4; j < at + 3 + length; j++) {
      if (src[j] < 32 || src[j] === 127 || src[j] === 255) return;
    }
    return decoder.decode(src.subarray(at + 4, at + 3 + length));
  };

  const followsFloorTemplate = (at: number): boolean => {
    if (src[at - 1] !== 0 || src[at - 2] !== 0) return false;
    for (let length = 3; length <= 8; length++) {
      const start = at - 2 - length;
      if (start < 4 || src[start] !== 84 || encView.getUint32(start - 4, true) !== length + 1) continue;
      let digits = true;
      for (let j = start + 1; j < at - 2; j++) if (src[j] < 48 || src[j] > 57) digits = false;
      if (digits) return true;
    }
    return false;
  };

  const hasNativeFloorHeader = (at: number, name: string): boolean => {
    const length = encView.getUint32(at, true), data = at + 4 + length;
    if (data + 100 >= src.length) return false;
    const ordinal = encView.getInt32(data + 16, true), marker = encView.getUint32(data + 24, true);
    if (Math.abs(ordinal) > 1000 || encView.getUint32(data + 20, true) === 0 || (marker !== 0 && marker !== 0xffffffff)) return false;
    const viewport = data + 4;
    const viewScale = encView.getFloat64(viewport + 28, true);
    if (!Number.isFinite(viewScale) || viewScale <= 0 || viewScale > 1000) return false;
    for (let j = 0; j < 4; j++) {
      const a = encView.getFloat64(viewport + 36 + j * 16, true), b = encView.getFloat64(viewport + 44 + j * 16, true);
      if (!Number.isFinite(a) || Math.abs(a) > 1e6 || a !== b) return false;
    }
    for (let p = data + 100; p < Math.min(src.length - 165, data + 1800); p++) {
      const title = readString(p);
      if (title?.startsWith(`${name} TAVANI, `) && / KOTU$/.test(title)) return true;
    }
    return false;
  };

  const candidates: { nameOffset: number; name: string; bbox: number[] }[] = [];
  const floors: { sourceOffset: number }[] = [];

  for (let i = 24; i < src.length - 24; i++) {
    const length = encView.getUint32(i, true);
    if (length < 1 || length > 161 || i + 4 + length + 20 > src.length || src[i + 3 + length] !== 0) continue;
    const text = readString(i);
    if (text === undefined) continue;
    const at = i + 4;
    const isNativeHdr = text ? hasNativeFloorHeader(i, text) : false;
    if (text && (followsFloorTemplate(i) || isNativeHdr)) {
      const elevation = encView.getFloat64(at + length, true), height = encView.getFloat64(at + length + 8, true);
      if (Number.isFinite(elevation) && Math.abs(elevation) <= 1e6 && Number.isFinite(height) && height >= 0.1 && height <= 100) {
        floors.push({ sourceOffset: at });
        markF64(at + length);
        markF64(at + length + 8);
        if (isNativeHdr) {
          const data = at + length;
          const viewport = data + 4;
          markF64(viewport + 28);
          for (let j = 0; j < 8; j++) markF64(viewport + 36 + j * 8);
          if (options.targetVersion === 201094) {
            addSplice(data + 28, data + 32, new Uint8Array(0));
          }
        }
      }
    }
    if (at < 21) continue;
    const color = encView.getUint32(at + length, true);
    if (color < 999999000 || color > 1000001000) continue;
    const bbox = [0, 1, 2, 3].map(j => encView.getFloat32(at - 21 + j * 4, true));
    if (bbox.some(v => !Number.isFinite(v) || Math.abs(v) > 1e6) || bbox[2] < bbox[0] - 0.0001 || bbox[3] < bbox[1] - 0.0001) continue;
    candidates.push({ nameOffset: at, name: text, bbox });
  }

  if (!floors.length) {
    throw new Error("Dönüştürülecek IDE dosyasında kat kaydı bulunamadı.");
  }

  const inspectGeometry = (c: { nameOffset: number; name: string; bbox: number[] }) => {
    const nameOffset = c.nameOffset, bboxOffset = nameOffset - 21;
    const min = Math.max(0, nameOffset - (c.name ? MAX_GEOMETRY_BYTES : 8192));
    const padLen = encoded ? 16 : 0;
    for (let p = bboxOffset - (36 + padLen); p >= min; p--) {
      if (seenGeometryOffsets.has(p)) continue;
      const primitiveType = encView.getUint32(p, true), count = encView.getUint32(p + 4, true);
      if (primitiveType < 1 || primitiveType > 200 || count < 1 || count > MAX_POINTS) continue;
      if ((primitiveType === 123 || primitiveType === 128) && count !== 2) continue;
      if (primitiveType === 40 && count !== 1) continue;
      const tail = p + 8 + count * 16;
      if (tail + 36 + padLen > bboxOffset) continue;
      const nativeId = encView.getUint32(tail, true);
      const nativeZ = encView.getFloat64(tail + 4, true) * (encoded ? 0.5 : 1);
      const width = encView.getFloat64(tail + 12, true) * (encoded ? 1 / 3 : 1);
      const layerId = encView.getUint32(tail + 20, true);
      if (nativeId === 0 || !Number.isFinite(nativeZ) || Math.abs(nativeZ) > 1e6 || !Number.isFinite(width) || width < 0 || width > 1000 || layerId > 100000) continue;
      let cursor = tail + 24, valid = true, rotation = 0, padStart = 0, rotOffset = 0;
      for (let list = 0; list < 3; list++) {
        if (cursor + 4 > bboxOffset) { valid = false; break; }
        const length = encView.getUint32(cursor, true);
        cursor += 4;
        if (length > MAX_REFS || cursor + length * 4 > bboxOffset) { valid = false; break; }
        cursor += length * 4;
        if (list === 0) {
          padStart = cursor;
          cursor += padLen;
          if (cursor + 8 > bboxOffset) { valid = false; break; }
          rotOffset = cursor;
          rotation = encView.getFloat64(cursor, true);
          cursor += 8;
        }
      }
      if (!valid || cursor + 8 !== bboxOffset || !Number.isFinite(rotation)) continue;
      const lateralOffset = encView.getFloat64(cursor, true);
      if (!Number.isFinite(lateralOffset) || Math.abs(lateralOffset) > 1000) continue;
      const tolerance = Math.max(0.0005, ...c.bbox.map(v => Math.abs(v) * 2e-6));
      const pts: { x: number; y: number }[] = [];
      for (let j = 0; j < count; j++) {
        const x = encView.getFloat64(p + 8 + j * 16, true), y = encView.getFloat64(p + 16 + j * 16, true);
        if (!Number.isFinite(x) || !Number.isFinite(y) || Math.abs(x) > 1e6 || Math.abs(y) > 1e6 || x < c.bbox[0] - tolerance || x > c.bbox[2] + tolerance || y < c.bbox[1] - tolerance || y > c.bbox[3] + tolerance) { valid = false; break; }
        pts.push({ x, y });
      }
      if (!valid) continue;
      seenGeometryOffsets.add(p);
      return { primitiveType, count, nativeId, width, points: pts, geometryOffset: p, tail, padStart, padLen, rotOffset, latOffset: cursor };
    }
  };

  const cm = (v: number) => String(Number((v * 100).toFixed(5)));

  for (let idx = 0; idx < candidates.length; idx++) {
    const c = candidates[idx];
    const g = inspectGeometry(c);
    if (!g) continue;
    for (let j = 0; j < g.count; j++) {
      markF64(g.geometryOffset + 8 + j * 16);
      markF64(g.geometryOffset + 16 + j * 16);
    }
    markF64(g.tail + 4, 0.5);
    markF64(g.tail + 12, 1 / 3);
    if (g.padLen > 0) {
      addSplice(g.padStart, g.padStart + g.padLen, new Uint8Array(0));
    }
    markF64(g.rotOffset);
    markF64(g.latOffset);

    if (c.nameOffset < floors[0].sourceOffset || !c.name) continue;

    const p = c.nameOffset + c.name.length + 1;
    if (
      g.primitiveType === 2 ||
      g.primitiveType === 4 ||
      g.primitiveType === 5 ||
      g.primitiveType === 7 ||
      g.primitiveType === 17 ||
      g.primitiveType === 40 ||
      g.primitiveType === 44
    ) {
      for (const rel of COMMON_OBJECT_HEADER_F64_OFFSETS) {
        markF64(p + rel);
      }
    } else if (g.primitiveType === 6) {
      for (const rel of AXIS_RECORD_F64_OFFSETS) {
        markF64(p + rel);
      }
    }

    if (g.primitiveType === 5) {
      // Beam
      if (p + 322 <= src.length && encView.getUint32(p + 262, true) === 1) {
        const height = encView.getFloat64(p + 266, true);
        markF64(p + 266);
        markF64(p + 298);
        markF64(p + 306);
        markF64(p + 314);
        if (Number.isFinite(height) && height > 0.01 && height <= 100) {
          const label = `${cm(g.width)}/${cm(height)}`;
          for (let s = p + 322; s < Math.min(src.length - 10, p + 1200); s++) {
            if (encView.getUint32(s, true) === 3 && src[s + 4] === 0x58 && src[s + 5] === 0x58 && src[s + 6] === 0) {
              addSplice(s, s + 7, encodeCp1254NulString(label));
              break;
            }
          }
        }
      }
    } else if (g.primitiveType === 2) {
      // Architectural Wall
      if (p + 322 <= src.length && encView.getUint32(p + 262, true) === 119) {
        markF64(p + 266);
        if (options.targetVersion === 201094) {
          work.fill(0, p + 274, p + 298);
        }
        markF64(p + 298);
        markF64(p + 306);
        markF64(p + 314);
      }
    } else if (g.primitiveType === 17 && g.points.length === 2 && g.width > 0) {
      // Structural Wall: decode wall scalars and restore the two "XX" strings after p + 400
      markF64(p + 298);
      markF64(p + 306);
      markF64(p + 314);
      markF64(p + 410);
      markF64(p + 486);
      markF64(p + 494);
      const dx = g.points[1].x - g.points[0].x, dy = g.points[1].y - g.points[0].y;
      const horizontal = Math.abs(dy) < 1e-7, vertical = Math.abs(dx) < 1e-7;
      const overrideSection = options.wallSectionOverrides?.get(g.nativeId);
      let section = overrideSection;
      if (!section && (horizontal !== vertical)) {
        const lenCm = Math.round(Math.hypot(dx, dy) * 100);
        const thkCm = Math.round(g.width * 100);
        const joinedKey = `${c.name}:${g.nativeId}:${lenCm}:${thkCm}`;
        section = KNOWN_JOINED_WALL_SECTIONS.get(joinedKey) ?? (horizontal ? `${lenCm}/${thkCm}` : `${thkCm}/${lenCm}`);
      }
      if (section) {
        const end = Math.min(src.length - 10, p + 1400);
        const xxOffsets: number[] = [];
        for (let s = p + 400; s < end; s++) {
          if (encView.getUint32(s, true) === 3 && src[s + 4] === 0x58 && src[s + 5] === 0x58 && src[s + 6] === 0) {
            xxOffsets.push(s);
            if (xxOffsets.length === 2) break;
          }
        }
        if (xxOffsets.length === 2) {
          addSplice(xxOffsets[0], xxOffsets[0] + 7, encodeCp1254NulString(section));
          addSplice(xxOffsets[1], xxOffsets[1] + 7, encodeCp1254NulString(`${c.name} ${section}`));
          const afterSecondXx = xxOffsets[1] + 7;
          markF64(afterSecondXx + 60);
          markF64(afterSecondXx + 68);
          markF64(afterSecondXx + 118);
          markF64(afterSecondXx + 126);
        }
      }
    } else if (g.primitiveType === 7) {
      // Slab
      if (p + 519 <= src.length && encView.getUint32(p + 470, true) === 36) {
        markF64(p + 485);
        markF64(p + 501);
        const loadOverride = options.slabLoadOverrides?.get(g.nativeId);
        if (loadOverride) {
          f64Overrides.set(p + 485, loadOverride.live);
          f64Overrides.set(p + 501, loadOverride.dead);
        }
        if (options.targetVersion === 201094) {
          addSplice(p + 470, p + 474, new Uint8Array(0));
        }
      }
    } else if (g.primitiveType === 40) {
      // Stair
      const tempOffsets: number[] = [];
      const proxyView = new Proxy(encView, {
        get(target, prop) {
          if (prop === "getFloat64") {
            return (off: number, le?: boolean) => {
              tempOffsets.push(off);
              return target.getFloat64(off, le);
            };
          }
          const val = Reflect.get(target, prop);
          return typeof val === "function" ? val.bind(target) : val;
        },
      });
      const tpl = readIdeStairTemplate(src, proxyView, c.nameOffset, c.name.length + 1);
      if (tpl) {
        for (const off of tempOffsets) markF64(off);
        const end = Math.min(src.length, tpl.endOffset + 2_000_000);
        for (let at = tpl.endOffset; at + 15 < end; at++) {
          if (work[at] === 1 && work[at + 1] === 1 && (work[at + 2] === 1 || work[at + 2] === 0) && encView.getUint32(at + 3, true) === 211220 && work[at + 15] === 0x78) {
            work[at + 2] = 0;
            workRawView.setUint32(at + 3, options.targetVersion, true);
            break;
          }
        }
      }
    }
  }

  for (const [off, scale] of f64Scales) {
    workRawView.setFloat64(off, encView.getFloat64(off, true) * scale, true);
  }
  for (const [off, val] of f64Overrides) {
    workRawView.setFloat64(off, val, true);
  }

  return { work, splices };
}

export function applyIdeBinarySplices(work: Uint8Array, splices: IdeTranscodeSplice[]): Uint8Array {
  const ordered = [...splices].sort((a, b) => a.start - b.start);
  let totalDelta = 0;
  let prevEnd = 0;
  for (const sp of ordered) {
    if (sp.start < prevEnd) {
      throw new Error(`Çakışan ikili yama aralığı: ${sp.start} < ${prevEnd}`);
    }
    totalDelta += sp.replacement.byteLength - (sp.end - sp.start);
    prevEnd = sp.end;
  }
  const out = new Uint8Array(work.byteLength + totalDelta);
  let r = 0, w = 0;
  for (const sp of ordered) {
    if (sp.start > r) {
      out.set(work.subarray(r, sp.start), w);
      w += sp.start - r;
    }
    if (sp.replacement.byteLength > 0) {
      out.set(sp.replacement, w);
      w += sp.replacement.byteLength;
    }
    r = sp.end;
  }
  if (r < work.byteLength) {
    out.set(work.subarray(r), w);
  }
  return out;
}

/**
 * Converts a .ide11trial (or .ide11) buffer into a native .ide11 (version 211220) binary:
 * - Preserves the native v11 (211220, encodedFlag=1) binary stream layout so all 75 C++ geometry readers
 *   and 400,000+ Blowfish float64 values in the post-floor 3D FEM/mesh tables remain 100% aligned in ideCAD 11.
 * - Clears any student-edition lock byte at `previewEnd + 28` (`[rdi+11h]`).
 * - Restores all redacted `"XX"` beam and structural wall plan labels inside floor records to their native section strings.
 * - Applies any slab G/Q load overrides in-place using the native v11 Blowfish float64 codec.
 */
export function transcodeIde11TrialToIde11(
  sourceBuffer: ArrayBuffer | Uint8Array,
  options: IdeTranscodeOptions = {},
): Uint8Array {
  const src = sourceBuffer instanceof Uint8Array
    ? sourceBuffer
    : new Uint8Array(sourceBuffer);
  const baseBuf = src.buffer.slice(src.byteOffset, src.byteOffset + src.byteLength) as ArrayBuffer;
  if (!isIde11SchemaVersion(baseBuf)) {
    throw new Error("Kaynak dosya IDE11 (211220) şemasında değil.");
  }
  const encoded = hasIdeEncodedNumbers(baseBuf);
  const encView = createIdeDataView(baseBuf);
  const work = new Uint8Array(baseBuf.slice(0));
  const workRawView = new DataView(work.buffer, work.byteOffset, work.byteLength);
  const decoder = new TextDecoder("windows-1254");

  // Clear studentFlag ([rdi+11h]) at previewEnd + 28 and demoFlag at previewEnd + 29 if present
  if (work.byteLength >= 120) {
    const nameLen = workRawView.getUint32(96, true);
    if (116 + nameLen <= work.byteLength) {
      const cLen = workRawView.getUint32(112 + nameLen, true);
      const previewEnd = 116 + nameLen + cLen;
      if (previewEnd + 34 <= work.byteLength && workRawView.getUint32(previewEnd + 30, true) === 0x000005ce) {
        work[previewEnd + 28] = 0;
        work[previewEnd + 29] = 0;
      }
    }
  }

  const readString = (at: number): string | undefined => {
    if (at < 0 || at + 4 > src.length) return;
    const length = encView.getUint32(at, true);
    if (length < 1 || length > 161 || at + 4 + length > src.length || src[at + 3 + length] !== 0) return;
    for (let j = at + 4; j < at + 3 + length; j++) {
      if (src[j] < 32 || src[j] === 127 || src[j] === 255) return;
    }
    return decoder.decode(src.subarray(at + 4, at + 3 + length));
  };

  const followsFloorTemplate = (at: number): boolean => {
    if (src[at - 1] !== 0 || src[at - 2] !== 0) return false;
    for (let length = 3; length <= 8; length++) {
      const start = at - 2 - length;
      if (start < 4 || src[start] !== 84 || encView.getUint32(start - 4, true) !== length + 1) continue;
      let digits = true;
      for (let j = start + 1; j < at - 2; j++) if (src[j] < 48 || src[j] > 57) digits = false;
      if (digits) return true;
    }
    return false;
  };

  const hasNativeFloorHeader = (at: number, name: string): boolean => {
    const length = encView.getUint32(at, true), data = at + 4 + length;
    if (data + 100 >= src.length) return false;
    const ordinal = encView.getInt32(data + 16, true), marker = encView.getUint32(data + 24, true);
    if (Math.abs(ordinal) > 1000 || encView.getUint32(data + 20, true) === 0 || (marker !== 0 && marker !== 0xffffffff)) return false;
    const viewport = data + 4;
    const viewScale = encView.getFloat64(viewport + 28, true);
    if (!Number.isFinite(viewScale) || viewScale <= 0 || viewScale > 1000) return false;
    for (let j = 0; j < 4; j++) {
      const a = encView.getFloat64(viewport + 36 + j * 16, true), b = encView.getFloat64(viewport + 44 + j * 16, true);
      if (!Number.isFinite(a) || Math.abs(a) > 1e6 || a !== b) return false;
    }
    for (let p = data + 100; p < Math.min(src.length - 165, data + 1800); p++) {
      const title = readString(p);
      if (title?.startsWith(`${name} TAVANI, `) && / KOTU$/.test(title)) return true;
    }
    return false;
  };

  const candidates: { nameOffset: number; name: string; bbox: number[] }[] = [];
  const floors: { sourceOffset: number }[] = [];

  for (let i = 24; i < src.length - 24; i++) {
    const length = encView.getUint32(i, true);
    if (length < 1 || length > 161 || i + 4 + length + 20 > src.length || src[i + 3 + length] !== 0) continue;
    const text = readString(i);
    if (text === undefined) continue;
    const at = i + 4;
    const isNativeHdr = text ? hasNativeFloorHeader(i, text) : false;
    if (text && (followsFloorTemplate(i) || isNativeHdr)) {
      const elevation = encView.getFloat64(at + length, true), height = encView.getFloat64(at + length + 8, true);
      if (Number.isFinite(elevation) && Math.abs(elevation) <= 1e6 && Number.isFinite(height) && height >= 0.1 && height <= 100) {
        floors.push({ sourceOffset: at });
      }
    }
    if (at < 21) continue;
    const color = encView.getUint32(at + length, true);
    if (color < 999999000 || color > 1000001000) continue;
    const bbox = [0, 1, 2, 3].map(j => encView.getFloat32(at - 21 + j * 4, true));
    if (bbox.some(v => !Number.isFinite(v) || Math.abs(v) > 1e6) || bbox[2] < bbox[0] - 0.0001 || bbox[3] < bbox[1] - 0.0001) continue;
    candidates.push({ nameOffset: at, name: text, bbox });
  }

  if (!floors.length) {
    throw new Error("Dönüştürülecek IDE dosyasında kat kaydı bulunamadı.");
  }

  const seenGeometryOffsets = new Set<number>();
  const seenSpliceStarts = new Set<number>();
  const splices: IdeTranscodeSplice[] = [];
  const addSplice = (start: number, end: number, replacement: Uint8Array) => {
    if (!seenSpliceStarts.has(start)) {
      seenSpliceStarts.add(start);
      splices.push({ start, end, replacement });
    }
  };
  const writeF64InPlace = (offset: number, value: number) => {
    if (encoded) {
      work.set(encodeIdeFloat64(value), offset);
    } else {
      workRawView.setFloat64(offset, value, true);
    }
  };

  const inspectGeometry = (c: { nameOffset: number; name: string; bbox: number[] }) => {
    const nameOffset = c.nameOffset, bboxOffset = nameOffset - 21;
    const min = Math.max(0, nameOffset - (c.name ? MAX_GEOMETRY_BYTES : 8192));
    const padLen = encoded ? 16 : 0;
    for (let p = bboxOffset - (36 + padLen); p >= min; p--) {
      if (seenGeometryOffsets.has(p)) continue;
      const primitiveType = encView.getUint32(p, true), count = encView.getUint32(p + 4, true);
      if (primitiveType < 1 || primitiveType > 200 || count < 1 || count > MAX_POINTS) continue;
      if ((primitiveType === 123 || primitiveType === 128) && count !== 2) continue;
      if (primitiveType === 40 && count !== 1) continue;
      const tail = p + 8 + count * 16;
      if (tail + 36 + padLen > bboxOffset) continue;
      const nativeId = encView.getUint32(tail, true);
      const nativeZ = encView.getFloat64(tail + 4, true) * (encoded ? 0.5 : 1);
      const width = encView.getFloat64(tail + 12, true) * (encoded ? 1 / 3 : 1);
      const layerId = encView.getUint32(tail + 20, true);
      if (nativeId === 0 || !Number.isFinite(nativeZ) || Math.abs(nativeZ) > 1e6 || !Number.isFinite(width) || width < 0 || width > 1000 || layerId > 100000) continue;
      let cursor = tail + 24, valid = true, rotation = 0;
      for (let list = 0; list < 3; list++) {
        if (cursor + 4 > bboxOffset) { valid = false; break; }
        const length = encView.getUint32(cursor, true);
        cursor += 4;
        if (length > MAX_REFS || cursor + length * 4 > bboxOffset) { valid = false; break; }
        cursor += length * 4;
        if (list === 0) {
          cursor += padLen;
          if (cursor + 8 > bboxOffset) { valid = false; break; }
          rotation = encView.getFloat64(cursor, true);
          cursor += 8;
        }
      }
      if (!valid || cursor + 8 !== bboxOffset || !Number.isFinite(rotation)) continue;
      const lateralOffset = encView.getFloat64(cursor, true);
      if (!Number.isFinite(lateralOffset) || Math.abs(lateralOffset) > 1000) continue;
      const tolerance = Math.max(0.0005, ...c.bbox.map(v => Math.abs(v) * 2e-6));
      const pts: { x: number; y: number }[] = [];
      for (let j = 0; j < count; j++) {
        const x = encView.getFloat64(p + 8 + j * 16, true), y = encView.getFloat64(p + 16 + j * 16, true);
        if (!Number.isFinite(x) || !Number.isFinite(y) || Math.abs(x) > 1e6 || Math.abs(y) > 1e6 || x < c.bbox[0] - tolerance || x > c.bbox[2] + tolerance || y < c.bbox[1] - tolerance || y > c.bbox[3] + tolerance) { valid = false; break; }
        pts.push({ x, y });
      }
      if (!valid) continue;
      seenGeometryOffsets.add(p);
      return { primitiveType, count, nativeId, width, points: pts };
    }
  };

  const cm = (v: number) => String(Number((v * 100).toFixed(5)));

  for (let idx = 0; idx < candidates.length; idx++) {
    const c = candidates[idx];
    if (c.nameOffset < floors[0].sourceOffset || !c.name) continue;
    const g = inspectGeometry(c);
    if (!g) continue;
    const p = c.nameOffset + c.name.length + 1;

    if (g.primitiveType === 5) {
      // Restore redacted "XX" beam plan section string
      if (p + 322 <= src.length && encView.getUint32(p + 262, true) === 1) {
        const height = encView.getFloat64(p + 266, true);
        if (Number.isFinite(height) && height > 0.01 && height <= 100) {
          const label = `${cm(g.width)}/${cm(height)}`;
          for (let s = p + 322; s < Math.min(src.length - 10, p + 1200); s++) {
            if (encView.getUint32(s, true) === 3 && src[s + 4] === 0x58 && src[s + 5] === 0x58 && src[s + 6] === 0) {
              addSplice(s, s + 7, encodeCp1254NulString(label));
              break;
            }
          }
        }
      }
    } else if (g.primitiveType === 17 && g.points.length === 2 && g.width > 0) {
      // Restore redacted "XX" structural wall plan section strings
      const dx = g.points[1].x - g.points[0].x, dy = g.points[1].y - g.points[0].y;
      const horizontal = Math.abs(dy) < 1e-7, vertical = Math.abs(dx) < 1e-7;
      let section = options.wallSectionOverrides?.get(g.nativeId);
      if (!section && (horizontal !== vertical)) {
        const lenCm = Math.round(Math.hypot(dx, dy) * 100);
        const thkCm = Math.round(g.width * 100);
        const joinedKey = `${c.name}:${g.nativeId}:${lenCm}:${thkCm}`;
        section = KNOWN_JOINED_WALL_SECTIONS.get(joinedKey) ?? (horizontal ? `${lenCm}/${thkCm}` : `${thkCm}/${lenCm}`);
      }
      if (section) {
        const end = Math.min(src.length - 10, p + 1400);
        const xxOffsets: number[] = [];
        for (let s = p + 400; s < end; s++) {
          if (encView.getUint32(s, true) === 3 && src[s + 4] === 0x58 && src[s + 5] === 0x58 && src[s + 6] === 0) {
            xxOffsets.push(s);
            if (xxOffsets.length === 2) break;
          }
        }
        if (xxOffsets.length === 2) {
          addSplice(xxOffsets[0], xxOffsets[0] + 7, encodeCp1254NulString(section));
          addSplice(xxOffsets[1], xxOffsets[1] + 7, encodeCp1254NulString(`${c.name} ${section}`));
        }
      }
    } else if (g.primitiveType === 7) {
      // Apply modified slab G/Q loads in-place
      if (p + 519 <= src.length && encView.getUint32(p + 470, true) === 36) {
        const loadOverride = options.slabLoadOverrides?.get(g.nativeId);
        if (loadOverride) {
          const curLive = encView.getFloat64(p + 485, true);
          const curDead = encView.getFloat64(p + 501, true);
          if (Math.abs(curLive - loadOverride.live) > 1e-6) {
            writeF64InPlace(p + 485, loadOverride.live);
          }
          if (Math.abs(curDead - loadOverride.dead) > 1e-6) {
            writeF64InPlace(p + 501, loadOverride.dead);
          }
        }
      }
    }
  }

  const out = applyIdeBinarySplices(work, splices);
  return sealIdeCarrierHeader(out, {
    formatVersion: IDE11_VERSION,
    encodedFlag: encoded ? 1 : 0,
  });
}
