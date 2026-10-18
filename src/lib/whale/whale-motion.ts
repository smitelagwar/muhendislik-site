import type { Vector3, WhaleConfig, WhaleMotion, WhaleSceneLayout } from "./whale-types";

const TAU = Math.PI * 2;
const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));
const normalize = (p: Vector3): Vector3 => {
  const l = Math.hypot(p.x, p.y, p.z) || 1;
  return { x: p.x / l, y: p.y / l, z: p.z / l };
};

export function defaultWhaleLayout(width: number, height: number): WhaleSceneLayout {
  const gutter = Math.max(width * 0.095, (width - 1312) / 2 - 24);
  return {
    left: gutter * 0.55,
    right: width - gutter * 0.55,
    top: Math.max(135, height * 0.19),
    opening: { x: width * 0.79, y: height * 0.80 },
  };
}

/** Eşit aralıklı Catmull-Rom kübik eğri; C1 süreklidir. */
function spline(points: Vector3[], u: number): Vector3 {
  const f = clamp(u, 0, 1) * (points.length - 1);
  const i = Math.min(points.length - 2, Math.floor(f)), t = f - i;
  const a = points[Math.max(0, i - 1)], b = points[i], c = points[i + 1], d = points[Math.min(points.length - 1, i + 2)];
  const axis = (key: keyof Vector3) => 0.5 * (2 * b[key] + (-a[key] + c[key]) * t
    + (2 * a[key] - 5 * b[key] + 4 * c[key] - d[key]) * t * t
    + (-a[key] + 3 * b[key] - 3 * c[key] + d[key]) * t * t * t);
  return { x: axis("x"), y: axis("y"), z: axis("z") };
}

/**
 * Kontrol noktaları arasındaki mesafe farklarından kaynaklanan ani hızlanma ve
 * takılmaları dengeler; uç noktaları (0 ve 1) koruyarak görünmez kadraj sarılmasını bozmaz.
 */
function stabilizeSplineParameter(points: Vector3[], u: number): number {
  const clamped = clamp(u, 0, 1);
  if (clamped <= 0 || clamped >= 1) return clamped;
  const steps = 48;
  const cum: number[] = [0];
  let prev = spline(points, 0);
  for (let i = 1; i <= steps; i++) {
    const raw = i / steps;
    const cur = spline(points, raw);
    const segLen = Math.hypot(cur.x - prev.x, cur.y - prev.y, (cur.z - prev.z) * 0.65);
    // Uç marjlarda çok uzun mesafelerin ekran içi süreyi yutmaması için yumuşak ağırlık:
    const edgeWeight = raw < 0.12 || raw > 0.88 ? 0.58 : 1.0;
    cum.push(cum[i - 1] + Math.pow(Math.max(segLen, 1), 0.62) * edgeWeight);
    prev = cur;
  }
  const total = cum[steps] || 1;
  const target = clamped * total;
  let low = 0, high = steps;
  while (high - low > 1) {
    const mid = (low + high) >> 1;
    if (cum[mid] <= target) low = mid;
    else high = mid;
  }
  const span = cum[high] - cum[low] || 1;
  const localT = (target - cum[low]) / span;
  const mapped = (low + localT) / steps;
  // Orijinal parametre ile yay-boyu parametresini harmanlayarak hem pürüzsüz hız hem koridor zamanlaması sağlar.
  return clamped * 0.45 + mapped * 0.55;
}

/** Merkez paneller yerine yan koridorlar, açık derinlik katmanları ve son satırın boş hücresi ziyaret edilir. */
export function sampleWhaleMotion(time: number, width: number, height: number, config: WhaleConfig): WhaleMotion {
  const actor = config.actor ?? 0;
  const layout = config.layout ?? defaultWhaleLayout(width, height);
  const { left, right, top, opening } = layout;
  const period = config.loopPeriod * (actor ? 1.19 : 1);
  const rawU = ((time / period + (actor ? 0.28 : 0.23)) % 1 + 1) % 1;
  // Uç marjı yakın perspektifteki bütün anatomiyi de gizler; sarma görünürken gerçekleşmez.
  const margin = Math.max(width, config.length * 2.8);
  const leftOuter = Math.max(20, left * 0.46);
  const leftInner = Math.max(36, left * 0.72);
  const rightOuter = Math.min(width - 24, right + (width - right) * 0.42);
  const rightInner = Math.max(right * 0.98, width - (width - right) * 1.05);

  const screenPoints: Vector3[] = actor === 0 ? [
    { x: -margin, y: height * 1.18, z: 430 },
    { x: -width * 0.28, y: height * 0.92, z: 150 },
    { x: leftOuter, y: height * 0.78, z: -85 },
    { x: leftInner, y: height * 0.40, z: -185 },
    { x: left * 1.18, y: top * 0.74, z: 95 },
    { x: width * 0.52, y: top - 26, z: 660 },
    { x: rightOuter, y: height * 0.34, z: 890 },
    { x: rightInner, y: height * 0.64, z: 240 },
    { x: opening.x, y: opening.y, z: -175 },
    { x: width * 1.18, y: height * 0.96, z: -60 },
    { x: width + margin, y: height * 1.18, z: 430 },
  ] : [
    { x: width + margin, y: height * 0.26, z: 540 },
    { x: width * 1.26, y: height * 0.32, z: 210 },
    { x: rightOuter, y: height * 0.48, z: 120 },
    { x: Math.max(opening.x * 1.04, rightInner - width * 0.02), y: opening.y * 0.94, z: -110 },
    { x: width * 0.52, y: height * 1.06, z: 320 },
    { x: leftOuter, y: height * 0.84, z: 710 },
    { x: leftInner, y: height * 0.46, z: 460 },
    { x: width * 0.34, y: top + 18, z: 55 },
    { x: width * 0.56, y: height * 0.43, z: -220 },
    { x: -width * 0.25, y: height * 0.68, z: 100 },
    { x: -margin, y: height * 0.92, z: 540 },
  ];

  const points = screenPoints.map(p => {
    const perspective = (config.cameraFocalLength + p.z) / config.cameraFocalLength;
    return { x: (p.x - width / 2) * perspective, y: (p.y - height / 2) * perspective, z: p.z };
  });

  const u = stabilizeSplineParameter(points, rawU);
  const pos = spline(points, u);
  const direction = (v: number) => {
    const before = spline(points, v - 0.0004), after = spline(points, v + 0.0004);
    return normalize({ x: after.x - before.x, y: after.y - before.y, z: after.z - before.z });
  };
  const tangent = direction(u), ahead = direction(u + 0.008), behind = direction(u - 0.008);
  const bend = clamp((ahead.x * behind.y - ahead.y * behind.x) * 3.4, -0.65, 0.65);
  // 3B yatış açısı (bankAngle): sırt ve yan yüzeyi üç-çeyrek perspektifte kameraya sunar.
  const bankAngle = clamp((actor === 0 ? -0.32 : 0.28) + bend * 0.52 + Math.sin(u * TAU * 2 + actor * 1.4) * 0.24, -1.15, 1.15);
  // İtiş ve süzülme: yavaş modülasyon fazı kesmeden kuvveti değiştirir.
  const phase = TAU * config.swimSpeed * time + actor * 2.6 + Math.sin(time * 0.11 + actor) * 0.32;
  const effort = 0.68 + 0.32 * Math.sin(time * 0.085 + actor * 2) ** 2;
  return {
    pos,
    tangent,
    bankAngle,
    bend,
    phase,
    effort,
    tailPitch: Math.sin(phase - 1.65) * 0.30 * effort,
  };
}
