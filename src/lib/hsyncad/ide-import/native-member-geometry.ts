import type { IdePoint } from "./index";
import { hasIdeEncodedNumbers } from "./numeric-codec";

/** Observed structural-template families only. Native column construction
 * (140adba70) stores endZ - storeyTop in object+0x158; 14059e0e0 reads that
 * member after the style tuple and unit scale. Structural walls use the
 * base member's object+0x250 field (141fccbd0). */
export function readNativeMemberTopOffset(view: DataView, nameOffset: number, name: string, end: number, primitive: number, points: IdePoint[]): { value: number; sourceOffset: number } | undefined {
  if (!hasIdeEncodedNumbers(view.buffer as ArrayBuffer)) return;
  const p = nameOffset + name.length + 1;
  let at: number;
  if (primitive === 17) {
    if (p + 322 > Math.min(end, view.byteLength) || view.getUint32(p + 262, true) !== 1) return;
    if (![67, 48, 25047, 10051, 1, 1].every((value, i) => view.getUint32(p + 274 + i * 4, true) === value)) return;
    if (![298, 306, 314].every(offset => view.getFloat64(p + offset, true) === 1)) return;
    at = p + 266;
  } else if (primitive === 4) {
    if (p + 824 > Math.min(end, view.byteLength) || points.length !== 4 || view.getUint32(p + 16, true) !== 288 || view.getUint32(p + 20, true) !== 5) return;
    if (![68, 48, 25047, 25048, 65, 68, 69, 10049].every((value, i) => view.getUint32(p + 768 + i * 4, true) === value)) return;
    const width = view.getFloat64(p + 479, true), depth = view.getFloat64(p + 487, true);
    if (![width, depth].every(value => Number.isFinite(value) && value > .01 && value <= 100)) return;
    if (Math.abs(view.getFloat64(p + 463, true) * 2 - width) > 1e-8 || Math.abs(view.getFloat64(p + 471, true) * 2 - depth) > 1e-8) return;
    const side = (i: number) => Math.hypot(points[i].x - points[(i + 1) % 4].x, points[i].y - points[(i + 1) % 4].y);
    if ([0, 2].some(i => Math.abs(side(i) - width) > 1e-7) || [1, 3].some(i => Math.abs(side(i) - depth) > 1e-7)) return;
    if (view.getFloat64(p + 800, true) !== 1 || view.getFloat64(p + 816, true) !== .025) return;
    at = p + 808;
  } else return;
  const value = view.getFloat64(at, true);
  return Number.isFinite(value) && Math.abs(value) <= 100 ? { value, sourceOffset: at } : undefined;
}

/** 140adba70 sets bit 0x200 for the native circle family, retains its diameter,
 * and builds a polygon for display. Keep the original points separately. */
export function readNativeCircleSection(view: DataView, nameOffset: number, name: string, end: number, points: IdePoint[]): { center: IdePoint; radius: number; sourceOffset: number } | undefined {
  if (!hasIdeEncodedNumbers(view.buffer as ArrayBuffer)) return;
  const p = nameOffset + name.length + 1;
  if (p + 140 > Math.min(end, view.byteLength) || points.length < 8 || !(view.getUint32(p + 16, true) & 0x200) || view.getUint32(p + 20, true) !== 5) return;
  const radius = view.getFloat64(p + 108, true);
  if (!Number.isFinite(radius) || radius <= .005 || radius > 50 || view.getFloat64(p + 116, true) !== radius || view.getFloat64(p + 124, true) !== radius * 2 || view.getFloat64(p + 132, true) !== radius * 2) return;
  const center = { x: points.reduce((sum, point) => sum + point.x, 0) / points.length, y: points.reduce((sum, point) => sum + point.y, 0) / points.length };
  if (points.some(point => Math.abs(Math.hypot(point.x - center.x, point.y - center.y) - radius) > 1e-7)) return;
  const chord = 2 * radius * Math.sin(Math.PI / points.length);
  if (points.some((point, i) => Math.abs(Math.hypot(point.x - points[(i + 1) % points.length].x, point.y - points[(i + 1) % points.length].y) - chord) > 1e-7)) return;
  return { center, radius, sourceOffset: p + 108 };
}
