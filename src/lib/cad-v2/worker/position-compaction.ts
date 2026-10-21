/**
 * Per-chunk normalized coordinates for the renderer's bounded resident buffers.
 * The codec reports a strict Euclidean world-space error bound; callers retain the
 * source curve payload separately when runtime refinement is available.
 */
export interface CadV2PositionCodec {
  minX: number;
  minY: number;
  extentX: number;
  extentY: number;
  maxWorldError: number;
}

export type CadV2PositionArray = Float32Array | Uint16Array;

export interface PackedCadV2PositionArray {
  positions: Uint16Array;
  codec: CadV2PositionCodec;
}

const UINT16_MAX = 0xffff;

function getPositionBounds(source: Float32Array): { minX: number; minY: number; extentX: number; extentY: number } {
  if (source.length % 2 !== 0) throw new Error("CAD V2 XY positions must contain complete 2D vertices");
  if (source.length === 0) return { minX: 0, minY: 0, extentX: 0, extentY: 0 };

  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;
  for (let index = 0; index < source.length; index += 2) {
    const x = source[index]!;
    const y = source[index + 1]!;
    if (!Number.isFinite(x) || !Number.isFinite(y)) {
      throw new Error("CAD V2 cannot compact non-finite XY positions");
    }
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  }
  return { minX, minY, extentX: maxX - minX, extentY: maxY - minY };
}

/** Returns the strict codec error bound without allocating the packed U16 payload. */
export function estimateCadV2PositionCodecMaxWorldError(source: Float32Array): number {
  const { extentX, extentY } = getPositionBounds(source);
  return Math.hypot(extentX, extentY) / (2 * UINT16_MAX);
}

export function packCadV2PositionArray(source: Float32Array): PackedCadV2PositionArray {
  const { minX, minY, extentX, extentY } = getPositionBounds(source);
  const positions = new Uint16Array(source.length);
  for (let index = 0; index < source.length; index += 2) {
    positions[index] = extentX === 0 ? 0 : Math.round((source[index]! - minX) / extentX * UINT16_MAX);
    positions[index + 1] = extentY === 0 ? 0 : Math.round((source[index + 1]! - minY) / extentY * UINT16_MAX);
  }

  return {
    positions,
    codec: {
      minX,
      minY,
      extentX,
      extentY,
      maxWorldError: Math.hypot(extentX, extentY) / (2 * UINT16_MAX),
    },
  };
}

export function decodeCadV2PositionArray(
  positions: CadV2PositionArray,
  codec: CadV2PositionCodec | undefined,
): Float32Array {
  if (positions instanceof Float32Array) return positions;
  if (!codec || positions.length % 2 !== 0 ||
      ![codec.minX, codec.minY, codec.extentX, codec.extentY, codec.maxWorldError].every(Number.isFinite) ||
      codec.extentX < 0 || codec.extentY < 0 || codec.maxWorldError < 0) {
    throw new Error("CAD V2 compact XY positions require a valid position codec");
  }
  const decoded = new Float32Array(positions.length);
  for (let index = 0; index < positions.length; index += 2) {
    decoded[index] = codec.minX + positions[index]! / UINT16_MAX * codec.extentX;
    decoded[index + 1] = codec.minY + positions[index + 1]! / UINT16_MAX * codec.extentY;
  }
  return decoded;
}
