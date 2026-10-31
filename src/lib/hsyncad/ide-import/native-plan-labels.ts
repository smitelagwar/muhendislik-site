import type { IdePoint } from "./index";
import { isIde11SchemaVersion } from "./numeric-codec";

function nativeString(bytes: Uint8Array, view: DataView, at: number, end: number): string | undefined {
  if (at < 0 || at + 4 > end) return;
  const length = view.getUint32(at, true);
  if (length < 2 || length > 161 || at + 4 + length > end || bytes[at + 3 + length] !== 0) return;
  const text = bytes.subarray(at + 4, at + 3 + length);
  if (text.some(value => value < 32 || value === 127 || value === 255)) return;
  return new TextDecoder("windows-1254").decode(text);
}

/** Stored section dimensions include native joined ends, which line span does
 * not. Require the standalone dimensions and an identical name-prefixed label
 * inside this member's record; no geometry-length fallback is allowed. */
export function readNativeWallPlanSection(bytes: Uint8Array, view: DataView, nameOffset: number, name: string, recordEnd: number, points: IdePoint[], width: number): string | undefined {
  if (points.length !== 2 || !Number.isFinite(width) || width <= 0) return;
  const dx = points[1].x - points[0].x, dy = points[1].y - points[0].y;
  const horizontal = Math.abs(dy) < 1e-7, vertical = Math.abs(dx) < 1e-7;
  if (horizontal === vertical) return; // Diagonal label-order semantics unknown.
  const start = nameOffset + name.length + 1, end = Math.min(bytes.length, recordEnd, start + 1800);
  const strings: { at: number; text: string }[] = [];
  for (let at = start + 400; at + 4 < end; at++) {
    const text = nativeString(bytes, view, at, end);
    if (text) strings.push({ at, text });
  }
  const matches: string[] = [];
  for (const { text } of strings) {
    if (!/^\d+(?:[.,]\d+)?\/\d+(?:[.,]\d+)?$/.test(text) || !strings.some(entry => entry.text === `${name} ${text}`)) continue;
    const pair = text.split("/").map(value => Number(value.replace(",", ".")));
    if (pair.some(value => !Number.isFinite(value) || value <= 0 || value > 100_000)) continue;
    const widthCm = width * 100, firstWidth = Math.abs(pair[0] - widthCm) < 0.001, secondWidth = Math.abs(pair[1] - widthCm) < 0.001;
    if (!firstWidth && !secondWidth) continue;
    const long = firstWidth ? pair[1] : pair[0], short = firstWidth ? pair[0] : pair[1];
    matches.push(horizontal ? `${long}/${short}` : `${short}/${long}`);
  }
  const unique = [...new Set(matches)];
  return unique.length === 1 ? unique[0] : undefined;
}

/** Type-2 native wall member-height field. Its surrounding flat-wall family is
 * checked; the reader must not substitute a full-storey height when accepted.
 * Official wall settings define height upwards from the floor base, with auto
 * height accounting for native beams and slabs. Unknown slopes remain unset. */
export function readNativeWallHeight(view: DataView, nameOffset: number, name: string, recordEnd: number): { height: number; sourceOffset: number } | undefined {
  const p = nameOffset + name.length + 1;
  if (p + 322 > Math.min(recordEnd, view.byteLength) || view.getUint32(p + 262, true) !== 119) return;
  // These 24 bytes are six raw u32 style/material/flag values, not three
  // encoded doubles. Their tiny IEEE754 interpretation happened to pass the
  // old flat-wall check. The authenticated 211220 family is unchanged across
  // all 221 matching wall records in the selected original and trial files.
  if (isIde11SchemaVersion(view.buffer as ArrayBuffer)) {
    const expected = [98, 70, 25035, 10062, 1, 1];
    if (expected.some((value, index) => view.getUint32(p + 274 + index * 4, true) !== value)) return;
  } else if ([274, 282, 290].some(offset => { const value = view.getFloat64(p + offset, true); return !Number.isFinite(value) || Math.abs(value) > 1e-8; })) return;
  if ([298, 306, 314].some(offset => view.getFloat64(p + offset, true) !== 1)) return;
  const height = view.getFloat64(p + 266, true);
  return Number.isFinite(height) && height > 0.01 && height <= 100 ? { height, sourceOffset: p + 266 } : undefined;
}

/** Encoded 211220 beam family. Trial display labels are stored as "XX", but
 * the typed beam-height field remains present. Its complete tag, raw style
 * references and three unit-scale doubles match all 357 original/trial pairs.
 * Width comes from the separately authenticated common geometry record. */
export function readNativeBeamSection(view: DataView, nameOffset: number, name: string, recordEnd: number, width: number): { sectionLabel: string; height: number } | undefined {
  if (!isIde11SchemaVersion(view.buffer as ArrayBuffer) || !Number.isFinite(width) || width <= 0 || width > 100) return;
  const p = nameOffset + name.length + 1;
  if (p + 322 > Math.min(recordEnd, view.byteLength) || view.getUint32(p + 262, true) !== 1) return;
  if ([21, 61, 25004, 10049, 1, 1].some((value, index) => view.getUint32(p + 274 + index * 4, true) !== value)) return;
  if ([298, 306, 314].some(offset => view.getFloat64(p + offset, true) !== 1)) return;
  const height = view.getFloat64(p + 266, true);
  if (!Number.isFinite(height) || height <= 0.01 || height > 100) return;
  const centimetres = (value: number) => String(Number((value * 100).toFixed(5)));
  return { sectionLabel: `${centimetres(width)}/${centimetres(height)}`, height };
}
