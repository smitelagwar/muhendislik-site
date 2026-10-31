import { unzlibSync } from "three/addons/libs/fflate.module.js";
import type { IdeMesh, IdePoint } from "./index";

const MAX_NODES = 25_000;
const MAX_RAW_BYTES = 16 * 1024 * 1024;
const MAX_SCAN_BYTES = 2 * 1024 * 1024;

function adler32(bytes: Uint8Array) {
  let a = 1, b = 0;
  for (let start = 0; start < bytes.length; start += 5552) {
    const end = Math.min(bytes.length, start + 5552);
    for (let i = start; i < end; i++) { a += bytes[i]; b += a; }
    a %= 65521; b %= 65521;
  }
  return ((b << 16) | a) >>> 0;
}

export interface IdeStairAnalysisSurface {
  mesh: IdeMesh;
  planPaths: IdePoint[][];
  bottom: number;
  top: number;
  endOffset: number;
}

/**
 * Read the stored analysis surface, without interpreting result scalars as XYZ.
 * A candidate is accepted only when all four node-table counts, compressed and
 * raw lengths, Adler checksum, quad references and source bounds agree. The
 * caller limits the search to this root's native object record.
 */
export function readIdeStairAnalysisSurface(bytes: Uint8Array, view: DataView, start: number, recordEnd: number, bbox: readonly number[], encoded = false): IdeStairAnalysisSurface | undefined {
  const end = Math.min(bytes.length, recordEnd, start + MAX_SCAN_BYTES);
  let found: IdeStairAnalysisSurface | undefined;
  for (let at = start; at + 64 < end; at++) {
    // The observed native result component counts are 11 and 13. Their
    // multiplication by nodeCount is checked again in the decompressed data.
    if ((bytes[at] !== 11 && bytes[at] !== 13) || bytes[at + 1] || bytes[at + 2] || bytes[at + 3]) continue;
    const components = view.getUint32(at, true), count = view.getUint32(at + 4, true);
    if (count < 3 || count > MAX_NODES) continue;
    let cursor = at + 8 + count * 12;
    if (cursor + 4 > end) continue;
    const properties = view.getUint32(cursor, true);
    if (properties > 16_384) continue;
    cursor += 4 + properties * 12;
    if (cursor + 4 > end || view.getUint32(cursor, true) !== count) continue;
    const zOffset = cursor + 4; cursor += 4 + count * 4;
    if (cursor + 4 > end || view.getUint32(cursor, true) !== count) continue;
    cursor += 4 + count * 8;
    if (cursor + 4 > end || view.getUint32(cursor, true) !== count) continue;
    cursor += 4 + count * 8;
    const subFlag = bytes[cursor + 2], subVersion = view.getUint32(cursor + 3, true);
    if (cursor + 15 > end || bytes[cursor] !== 1 || bytes[cursor + 1] !== 1 || (subFlag !== 0 && subFlag !== 1) || (subVersion !== 201094 && subVersion !== 211220)) continue;
    const compressedBytes = view.getUint32(cursor + 7, true), rawBytes = view.getUint32(cursor + 11, true);
    cursor += 15;
    if (compressedBytes < 6 || compressedBytes > MAX_RAW_BYTES || rawBytes < 12 || rawBytes > MAX_RAW_BYTES || cursor + compressedBytes > end || bytes[cursor] !== 0x78) continue;
    try {
      const compressed = bytes.subarray(cursor, cursor + compressedBytes);
      // One extra byte detects a stream which exceeds its declared raw size.
      const raw = unzlibSync(compressed, { out: new Uint8Array(rawBytes + 1) });
      if (raw.length !== rawBytes || adler32(raw) !== view.getUint32(cursor + compressedBytes - 4, false)) continue;
      const rawView = new DataView(raw.buffer, raw.byteOffset, raw.byteLength), faceCount = rawView.getUint32(0, true), facesEnd = 4 + faceCount * 20;
      if (faceCount < 1 || faceCount > 100_000 || facesEnd + 4 > rawBytes) continue;
      const resultScalarCount = rawView.getUint32(facesEnd, true);
      if (resultScalarCount !== count * components || facesEnd + 4 + resultScalarCount * 32 + 8 !== rawBytes) continue;
      const positions: number[] = [], indices: number[] = [], quads: number[] = [];
      let bottom = Infinity, top = -Infinity, valid = true, maxNonPlanarity = 0, nonPlanarQuads = 0;
      const tolerance = Math.max(0.00005, ...bbox.map(value => Math.abs(value) * 2e-7));
      for (let i = 0; i < count; i++) {
        const x = view.getFloat32(at + 8 + i * 12, true), y = view.getFloat32(at + 12 + i * 12, true), z = view.getFloat32(zOffset + i * 4, true);
        if (![x, y, z].every(value => Number.isFinite(value) && Math.abs(value) <= 1_000_000) || x < bbox[0] - tolerance || x > bbox[2] + tolerance || y < bbox[1] - tolerance || y > bbox[3] + tolerance) { valid = false; break; }
        positions.push(x, y, z); bottom = Math.min(bottom, z); top = Math.max(top, z);
      }
      if (!valid || top - bottom < 1e-8) continue;
      const referenced = new Set<number>(), edges = new Map<string, { a: number; b: number; count: number }>();
      for (let i = 0; i < faceCount; i++) {
        const face = Array.from({ length: 4 }, (_, j) => rawView.getUint32(4 + i * 20 + j * 4, true));
        if (face.some(index => index >= count) || new Set(face).size < 3) { valid = false; break; }
        for (const index of face) referenced.add(index);
        const [a, b, c, d] = face.map(index => positions.slice(index * 3, index * 3 + 3));
        const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
        const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx, length = Math.hypot(nx, ny, nz);
        if (length < 1e-10) { valid = false; break; }
        const nonPlanarity = Math.abs((d[0] - a[0]) * nx + (d[1] - a[1]) * ny + (d[2] - a[2]) * nz) / length;
        maxNonPlanarity = Math.max(maxNonPlanarity, nonPlanarity); if (nonPlanarity > 0.00005) nonPlanarQuads++;
        quads.push(...face); indices.push(face[0], face[1], face[2], face[0], face[2], face[3]);
        for (let j = 0; j < 4; j++) {
          const a = face[j], b = face[(j + 1) % 4], key = `${Math.min(a, b)}:${Math.max(a, b)}`, edge = edges.get(key);
          if (edge) edge.count++; else edges.set(key, { a, b, count: 1 });
        }
      }
      if (!valid || referenced.size !== count) continue;
      const planPaths: IdePoint[][] = [];
      for (const edge of edges.values()) if (edge.count === 1) {
        const a = { x: positions[edge.a * 3], y: positions[edge.a * 3 + 1] }, b = { x: positions[edge.b * 3], y: positions[edge.b * 3 + 1] };
        if (Math.hypot(a.x - b.x, a.y - b.y) > 1e-8) planPaths.push([a, b]);
      }
      if (!planPaths.length) continue;
      // Multiple matching blocks inside one root are ambiguous, so none is used.
      if (found) return;
      found = { mesh: { positions, indices, quads, source: "native-analysis-mesh", sourceOffset: at, connectivityOffset: cursor, sourceNodeCount: count, sourceFaceCount: faceCount, surfaceOnly: true, nonPlanarQuads, maxNonPlanarity }, planPaths, bottom, top, endOffset: cursor + compressedBytes };
      at = cursor + compressedBytes - 1;
    } catch { /* Unrecognized/truncated native variants remain unsupported. */ }
  }
  return found;
}
