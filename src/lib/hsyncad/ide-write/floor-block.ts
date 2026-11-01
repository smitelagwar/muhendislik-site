/**
 * ideCAD binary floor block builder (Storey header, element sequence, trailer).
 */

import { encodeCp1254NulString } from "../ide-import/ide-binary-codec";
import type { Floor } from "../model";
import type { BoundingBox } from "./record-builders";
import type { IdeFormatVersion } from "./format-constants";

export interface StoreyHeaderOptions {
  floor: Floor;
  ordinal: number;
  format?: IdeFormatVersion;
  modelBounds?: BoundingBox;
}

/**
 * Builds the Storey Header that satisfies BOTH `followsFloorTemplate` and `hasNativeFloorHeader`.
 */
export function buildStoreyHeader(options: StoreyHeaderOptions): Uint8Array {
  const { floor, ordinal } = options;
  const format = options.format ?? "ide11";
  const bounds = options.modelBounds ?? { minX: -20, minY: -20, maxX: 60, maxY: 60 };

  // Ensure bounds are non-zero area
  const minX = bounds.minX;
  const minY = bounds.minY;
  const maxX = Math.max(bounds.maxX, minX + 10);
  const maxY = Math.max(bounds.maxY, minY + 10);

  const chunks: Uint8Array[] = [];

  // 1. Template prefix (followsFloorTemplate):
  // 4 bytes len (4), "T01\0" (4 bytes), plus 1 byte NUL = 9 bytes
  const templatePrefix = new Uint8Array([4, 0, 0, 0, 0x54, 0x30, 0x31, 0x00, 0x00]);
  chunks.push(templatePrefix);

  // 2. Floor name string (at this point `at` starts)
  const nameBytes = encodeCp1254NulString(floor.name);
  chunks.push(nameBytes);

  // 3. Storey data block (data = at + 4 + length)
  // Needs to be at least 300 bytes to comfortably host the ceiling title string
  const dataBlockSize = 350;
  const dataBlock = new Uint8Array(dataBlockSize);
  const dataView = new DataView(dataBlock.buffer);

  // data + 0: elevation (f64 LE)
  dataView.setFloat64(0, floor.elevation, true);
  // data + 8: height (f64 LE)
  dataView.setFloat64(8, floor.height, true);
  // data + 16: ordinal (int32 LE)
  dataView.setInt32(16, ordinal, true);
  // data + 20: flags (non-zero u32, e.g. 3)
  dataView.setUint32(20, 3, true);
  // data + 24: marker (0 or 0xffffffff)
  dataView.setUint32(24, 0, true);

  // Viewport offset (v11 shifts by 4 bytes)
  const vpOffset = format === "ide11" ? 4 : 0;
  if (format === "ide11") {
    dataView.setUint32(28, 0, true); // extra u32 reference
  }

  // viewport + 28: viewScale (f64 LE)
  dataView.setFloat64(vpOffset + 28, 50.0, true);

  // viewport + 36: Four consecutive coordinates serialized TWICE each:
  // [minX, minX, minY, minY, maxX, maxX, maxY, maxY]
  const coords = [minX, minX, minY, minY, maxX, maxX, maxY, maxY];
  coords.forEach((val, idx) => {
    dataView.setFloat64(vpOffset + 36 + idx * 8, val, true);
  });

  // Ceiling title string inside data + 120 .. data + 250:
  // Must match format: `${name} TAVANI, +${elev} KOTU`
  const sign = floor.elevation >= 0 ? "+" : "";
  const ceilingTitle = `${floor.name} TAVANI, ${sign}${floor.elevation.toFixed(2)} KOTU`;
  const titleBytes = encodeCp1254NulString(ceilingTitle);
  dataBlock.set(titleBytes, 140);

  chunks.push(dataBlock);

  // Concatenate chunks
  const totalLen = chunks.reduce((acc, c) => acc + c.byteLength, 0);
  const result = new Uint8Array(totalLen);
  let pos = 0;
  for (const chunk of chunks) {
    result.set(chunk, pos);
    pos += chunk.byteLength;
  }

  return result;
}

/** Builds the floor trailer (terminating the storey element list). */
export function buildStoreyTrailer(): Uint8Array {
  // 16 bytes storey terminator
  const trailer = new Uint8Array(16);
  const view = new DataView(trailer.buffer);
  view.setUint32(0, 0, true);
  view.setUint32(4, 0, true);
  view.setUint32(8, 0, true);
  view.setUint32(12, 0, true);
  return trailer;
}
