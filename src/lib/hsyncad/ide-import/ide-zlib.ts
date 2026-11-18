import { unzlibSync } from "three/addons/libs/fflate.module.js";

function adler32(bytes: Uint8Array) {
  let a = 1, b = 0;
  for (let start = 0; start < bytes.length; start += 5552) {
    const end = Math.min(bytes.length, start + 5552);
    for (let i = start; i < end; i++) { a += bytes[i]; b += a; }
    a %= 65521; b %= 65521;
  }
  return ((b << 16) | a) >>> 0;
}

export function inflateIdeZlib(compressed: Uint8Array, rawLength: number) {
  // One extra byte detects streams that exceed the declared size.
  const raw = unzlibSync(compressed, { out: new Uint8Array(rawLength + 1) });
  const view = new DataView(compressed.buffer, compressed.byteOffset, compressed.byteLength);
  if (raw.length !== rawLength || adler32(raw) !== view.getUint32(compressed.byteLength - 4, false)) {
    throw new Error("IDE zlib verisi kayıtlı boyut veya Adler32 sağlamasını karşılamıyor.");
  }
  return raw;
}

export const IDE_201094_MAGIC = 201094;

export interface Ide201094StreamHeader {
  /** Offset of the `201094` (`0x00031186`) u32 marker. */
  offset: number;
  /** Offset of the `0x78` zlib payload (`offset + 12`). */
  payloadOffset: number;
  compressedLength: number;
  rawLength: number;
  /** Offset immediately following the compressed payload. */
  endOffset: number;
}

/**
 * Scan `[u32 201094][u32 comp_len][u32 raw_len][0x78...]` frames without inflating every block.
 * Pass `startOffset`/`endOffset` to bound scanning to a single element or section.
 */
export function scanIde201094Streams(
  bytes: Uint8Array,
  startOffset = 0,
  endOffset = bytes.length,
  maxStreams = 200_000,
): Ide201094StreamHeader[] {
  const limit = Math.min(bytes.length, endOffset);
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const out: Ide201094StreamHeader[] = [];
  let pos = Math.max(0, startOffset);
  while (pos + 16 <= limit && out.length < maxStreams) {
    if (
      bytes[pos] === 0x86 &&
      bytes[pos + 1] === 0x11 &&
      bytes[pos + 2] === 0x03 &&
      bytes[pos + 3] === 0x00
    ) {
      const compressedLength = view.getUint32(pos + 4, true);
      const rawLength = view.getUint32(pos + 8, true);
      const payloadOffset = pos + 12;
      const streamEnd = payloadOffset + compressedLength;
      if (
        compressedLength >= 8 &&
        compressedLength <= 64 * 1024 * 1024 &&
        rawLength >= 1 &&
        rawLength <= 64 * 1024 * 1024 &&
        streamEnd <= limit &&
        bytes[payloadOffset] === 0x78
      ) {
        out.push({
          offset: pos,
          payloadOffset,
          compressedLength,
          rawLength,
          endOffset: streamEnd,
        });
        pos = streamEnd;
        continue;
      }
    }
    pos++;
  }
  return out;
}

/** Inflate a single located `201094` zlib stream using browser-safe `inflateIdeZlib`. */
export function inflateIde201094Stream(bytes: Uint8Array, header: Ide201094StreamHeader): Uint8Array {
  return inflateIdeZlib(
    bytes.subarray(header.payloadOffset, header.endOffset),
    header.rawLength,
  );
}
