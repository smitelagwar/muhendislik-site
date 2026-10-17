import type { Vector3, WhaleConfig, WhaleMotion, WhaleSceneLayout } from "./whale-types";

const TAU = Math.PI * 2;
const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));
const normalize = (p: Vector3): Vector3 => {
  const l = Math.hypot(p.x, p.y, p.z) || 1;
  return { x: p.x / l, y: p.y / l, z: p.z / l };
};

export function defaultWhaleLayout(width: number, height: number): WhaleSceneLayout {
  const gutter = Math.max(width * 0.095, (width - 1312) / 2 - 24);
  return { left: gutter * 0.55, right: width - gutter * 0.55,
    top: Math.max(135, height * 0.19), opening: { x: width * 0.79, y: height * 0.80 } };
}

/** Eşit aralıklı kübik eğri; ekrandan tamamen çıkılmış uçlar dışında C1 süreklidir. */
function spline(points: Vector3[], u: number): Vector3 {
  const f = clamp(u, 0, 1) * (points.length - 1);
  const i = Math.min(points.length - 2, Math.floor(f)), t = f - i;
  const a = points[Math.max(0, i - 1)], b = points[i], c = points[i + 1], d = points[Math.min(points.length - 1, i + 2)];
  const axis = (key: keyof Vector3) => 0.5 * (2 * b[key] + (-a[key] + c[key]) * t
    + (2 * a[key] - 5 * b[key] + 4 * c[key] - d[key]) * t * t
    + (-a[key] + 3 * b[key] - 3 * c[key] + d[key]) * t * t * t);
  return { x: axis("x"), y: axis("y"), z: axis("z") };
}

/** Merkez paneller yerine yan koridorlar ve son satırın boş hücresi ziyaret edilir. */
export function sampleWhaleMotion(time: number, width: number, height: number, config: WhaleConfig): WhaleMotion {
  const actor = config.actor ?? 0;
  const layout = config.layout ?? defaultWhaleLayout(width, height);
  const { left, right, top, opening } = layout;
  const period = config.loopPeriod * (actor ? 1.19 : 1);
  const u = ((time / period + (actor ? 0.28 : 0.23)) % 1 + 1) % 1;
  // Uç marjı yakın perspektifteki bütün anatomiyi de gizler; sarma görünürken gerçekleşmez.
  const margin = Math.max(width, config.length * 2.8);
  const screenPoints: Vector3[] = actor === 0 ? [
    { x: -margin, y: height * 1.20, z: 430 },
    { x: -width * 0.30, y: height * 0.94, z: 180 },
    { x: left, y: height * 0.76, z: -80 },
    { x: left, y: height * 0.43, z: -180 },
    { x: left + width * 0.12, y: top, z: 100 },
    { x: width * 0.52, y: top - 20, z: 640 },
    { x: right, y: height * 0.36, z: 880 },
    { x: right, y: height * 0.65, z: 280 },
    { x: opening.x, y: opening.y, z: -170 },
    { x: width * 1.18, y: height * 0.97, z: -60 },
    { x: width + margin, y: height * 1.18, z: 430 },
  ] : [
    { x: width + margin, y: height * 0.28, z: 540 },
    { x: width * 1.28, y: height * 0.32, z: 230 },
    { x: right, y: height * 0.48, z: 650 },
    { x: opening.x, y: opening.y * 0.92, z: 400 },
    { x: width * 0.51, y: height * 1.06, z: 280 },
    { x: left, y: height * 0.84, z: 700 },
    { x: left, y: height * 0.46, z: 480 },
    { x: width * 0.34, y: top + 18, z: 60 },
    { x: width * 0.56, y: height * 0.43, z: -220 },
    { x: -width * 0.25, y: height * 0.68, z: 100 },
    { x: -margin, y: height * 0.92, z: 540 },
  ];
  const points = screenPoints.map(p => {
    const perspective = (config.cameraFocalLength + p.z) / config.cameraFocalLength;
    return { x: (p.x - width / 2) * perspective, y: (p.y - height / 2) * perspective, z: p.z };
  });
  const pos = spline(points, u);
  const direction = (v: number) => {
    const before = spline(points, v - 0.0003), after = spline(points, v + 0.0003);
    return normalize({ x: after.x - before.x, y: after.y - before.y, z: after.z - before.z });
  };
  const tangent = direction(u), ahead = direction(u + 0.006), behind = direction(u - 0.006);
  const bend = clamp((ahead.x * behind.y - ahead.y * behind.x) * 3.2, -0.65, 0.65);
  const bankAngle = -0.48 + bend * 0.55 + Math.sin(u * TAU * 2 + actor) * 0.28;
  // İtiş ve süzülme: yavaş modülasyon fazı kesmeden kuvveti değiştirir.
  const phase = TAU * config.swimSpeed * time + actor * 2.6 + Math.sin(time * 0.11 + actor) * 0.32;
  const effort = 0.66 + 0.34 * Math.sin(time * 0.085 + actor * 2) ** 2;
  return { pos, tangent, bankAngle, bend, phase, effort,
    tailPitch: Math.sin(phase - 1.65) * 0.28 * effort };
}
