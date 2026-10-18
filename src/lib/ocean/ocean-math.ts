import type { OceanProjectedPoint, OceanQuadPatch, OceanVec3 } from "./ocean-types";

export const TAU = Math.PI * 2;
export const clamp = (n: number, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, n));
export const mix = (a: number, b: number, t: number) => a + (b - a) * t;
export const smoothStep = (a: number, b: number, n: number) => {
  const u = clamp((n - a) / (b - a));
  return u * u * (3 - 2 * u);
};
export const seeded = (n: number) => {
  const v = Math.sin(n * 127.1 + 31.7) * 43758.5453123;
  return v - Math.floor(v);
};

export function oVec3(x = 0, y = 0, z = 0): OceanVec3 {
  return { x, y, z };
}
export function oAdd(a: OceanVec3, b: OceanVec3): OceanVec3 {
  return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z };
}
export function oSub(a: OceanVec3, b: OceanVec3): OceanVec3 {
  return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
}
export function oScale(v: OceanVec3, s: number): OceanVec3 {
  return { x: v.x * s, y: v.y * s, z: v.z * s };
}
export function oDot(a: OceanVec3, b: OceanVec3): number {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}
export function oCross(a: OceanVec3, b: OceanVec3): OceanVec3 {
  return {
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x,
  };
}
export function oLen(v: OceanVec3): number {
  return Math.hypot(v.x, v.y, v.z);
}
export function oNormalize(v: OceanVec3): OceanVec3 {
  const l = oLen(v);
  return l < 1e-8 ? { x: 0, y: -1, z: 0 } : { x: v.x / l, y: v.y / l, z: v.z / l };
}
export function oLerp(a: OceanVec3, b: OceanVec3, t: number): OceanVec3 {
  return {
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t,
    z: a.z + (b.z - a.z) * t,
  };
}
export function oRotateAroundAxis(v: OceanVec3, axis: OceanVec3, angle: number): OceanVec3 {
  const k = oNormalize(axis);
  const cosA = Math.cos(angle);
  const sinA = Math.sin(angle);
  return oAdd(
    oAdd(oScale(v, cosA), oScale(oCross(k, v), sinA)),
    oScale(k, oDot(k, v) * (1 - cosA))
  );
}

export const OCEAN_FOCAL_LENGTH = 1400;
export const OCEAN_SUN_DIR = oNormalize({ x: -0.28, y: -0.82, z: -0.50 });
export const OCEAN_FILL_DIR = oNormalize({ x: 0.42, y: -0.40, z: -0.81 });

/**
 * Ekran koordinat merkezli 3B noktayı (`x, y` ekran piksel uzayında, `z` derinlik)
 * gerçek perspektif ölçeğiyle 2B kanvas uzayına izdüşürür.
 */
export function projectOceanPoint(
  p: OceanVec3,
  width: number,
  height: number,
  focalLength = OCEAN_FOCAL_LENGTH
): OceanProjectedPoint {
  const scale = focalLength / Math.max(focalLength + p.z, 80);
  const cx = width * 0.5;
  const cy = height * 0.5;
  return {
    x: cx + (p.x - cx) * scale,
    y: cy + (p.y - cy) * scale,
    z: p.z,
    scale,
    alpha: clamp(1 - p.z / 1650, 0.22, 1),
  };
}

/**
 * 3B yüzey dörtgeni (quad) için dünya normali, Blinn-Phong ıslak speküler yansıması,
 * 3B Fresnel siluet kenar ışığı ve yarı-saydam yaprak/dokular için alt-yüzey saçılımı (subsurface scattering) hesaplar.
 */
export function buildOceanQuadPatch(
  w00: OceanVec3,
  w10: OceanVec3,
  w11: OceanVec3,
  w01: OceanVec3,
  p00: OceanProjectedPoint,
  p10: OceanProjectedPoint,
  p11: OceanProjectedPoint,
  p01: OceanProjectedPoint,
  tint: OceanQuadPatch["tint"],
  width: number,
  height: number,
  accent = 0
): OceanQuadPatch {
  const uVec = oSub(w10, w00);
  const vVec = oSub(w01, w00);
  let normal = oNormalize(oCross(uVec, vVec));
  const center: OceanVec3 = {
    x: (w00.x + w10.x + w11.x + w01.x) * 0.25,
    y: (w00.y + w10.y + w11.y + w01.y) * 0.25,
    z: (w00.z + w10.z + w11.z + w01.z) * 0.25,
  };
  const camera: OceanVec3 = { x: width * 0.5, y: height * 0.5, z: -OCEAN_FOCAL_LENGTH };
  const viewDir = oNormalize(oSub(camera, center));
  if (oDot(normal, viewDir) < 0) {
    normal = oScale(normal, -1);
  }
  const facing = clamp(oDot(normal, viewDir), 0, 1);
  const nDotSun = Math.max(0, oDot(normal, OCEAN_SUN_DIR));
  const nDotFill = Math.max(0, oDot(normal, OCEAN_FILL_DIR));
  const light = clamp(0.16 + nDotSun * 0.62 + nDotFill * 0.22 + Math.max(0, -normal.y) * 0.14);

  const halfVec = oNormalize(oAdd(OCEAN_SUN_DIR, viewDir));
  const nDotH = Math.max(0, oDot(normal, halfVec));
  const specular = clamp(Math.pow(nDotH, 18) * 0.88 + Math.pow(nDotH, 5) * 0.18);

  const rim = clamp(Math.pow(1 - facing, 2.2) * (0.35 + 0.65 * Math.max(0, -normal.y * 0.6 + 0.4)));
  const backLight = Math.max(0, oDot(oScale(OCEAN_SUN_DIR, -1), viewDir) * 0.4 + (1 - facing) * 0.6);
  const subsurface = clamp(backLight * (0.4 + nDotSun * 0.6));

  return {
    points: [p00, p10, p11, p01],
    light,
    specular,
    rim,
    subsurface,
    depth: center.z,
    tint,
    accent,
  };
}

/** C1 sürekli 3B Catmull-Rom eğri interpolasyonu */
export function oceanSpline(points: OceanVec3[], u: number): OceanVec3 {
  const f = clamp(u, 0, 1) * (points.length - 1);
  const i = Math.min(points.length - 2, Math.floor(f));
  const t = f - i;
  const a = points[Math.max(0, i - 1)];
  const b = points[i];
  const c = points[i + 1];
  const d = points[Math.min(points.length - 1, i + 2)];
  const axis = (key: keyof OceanVec3) =>
    0.5 *
    (2 * b[key] +
      (-a[key] + c[key]) * t +
      (2 * a[key] - 5 * b[key] + 4 * c[key] - d[key]) * t * t +
      (-a[key] + 3 * b[key] - 3 * c[key] + d[key]) * t * t * t);
  return { x: axis("x"), y: axis("y"), z: axis("z") };
}
