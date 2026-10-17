import type {
  ProjectedPoint, Vector3, WhaleConfig, WhaleFeatureLine, WhaleFlipper,
  WhaleFlukes, WhaleMesh, WhaleRib, WhaleSpineNode, WhaleSurfacePatch, WhaleNodule,
} from "./whale-types";
import { sampleWhaleMotion } from "./whale-motion";

export function vec3(x = 0, y = 0, z = 0): Vector3 { return { x, y, z }; }
export function vAdd(a: Vector3, b: Vector3): Vector3 { return vec3(a.x + b.x, a.y + b.y, a.z + b.z); }
export function vSub(a: Vector3, b: Vector3): Vector3 { return vec3(a.x - b.x, a.y - b.y, a.z - b.z); }
export function vScale(v: Vector3, s: number): Vector3 { return vec3(v.x * s, v.y * s, v.z * s); }
export function vDot(a: Vector3, b: Vector3): number { return a.x * b.x + a.y * b.y + a.z * b.z; }
export function vCross(a: Vector3, b: Vector3): Vector3 {
  return vec3(a.y * b.z - a.z * b.y, a.z * b.x - a.x * b.z, a.x * b.y - a.y * b.x);
}
export function vLen(v: Vector3): number { return Math.hypot(v.x, v.y, v.z); }
export function vNormalize(v: Vector3): Vector3 {
  const length = vLen(v);
  return length < 1e-8 ? vec3(0, -1, 0) : vScale(v, 1 / length);
}
export function vLerp(a: Vector3, b: Vector3, t: number): Vector3 { return vAdd(a, vScale(vSub(b, a), t)); }
export function rotateAroundAxis(v: Vector3, axis: Vector3, angle: number): Vector3 {
  const k = vNormalize(axis);
  return vAdd(vAdd(vScale(v, Math.cos(angle)), vScale(vCross(k, v), Math.sin(angle))),
    vScale(k, vDot(k, v) * (1 - Math.cos(angle))));
}

const TAU = Math.PI * 2;
const clamp = (n: number, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, n));
const smoothStep = (a: number, b: number, n: number) => { const u = clamp((n - a) / (b - a)); return u * u * (3 - 2 * u); };
const seeded = (n: number) => { const v = Math.sin(n * 127.1 + 31.7) * 43758.5453; return v - Math.floor(v); };

export function projectPoint(p: Vector3, width: number, height: number, focalLength = 850): ProjectedPoint {
  const scale = focalLength / Math.max(focalLength + p.z, 40);
  return {
    x: width / 2 + p.x * scale, y: height / 2 + p.y * scale,
    z: p.z, scale, alpha: clamp(1 - p.z / 1600, 0.3, 1),
  };
}

/** Eski çağıranlar için aynı imza; yeni rota kadraj dışında da devam eder. */
export function computeTrajectoryPosition(timeSec: number, width: number, height: number, period = 72) {
  return sampleWhaleMotion(timeSec, width, height, {
    length: Math.min(width * 0.64, height * 1.17, 1240),
    swimSpeed: 0.16, loopPeriod: period, cameraFocalLength: 1200,
  });
}

export interface WhaleSectionDimensions {
  rx: number; ry: number; ventralBias: number;
  isHead: boolean; isThoracic: boolean; isPeduncle: boolean;
}

// Burun, çene, göğüs ve kuyruk bileği aynı sürekli anatomik profili paylaşır.
const PROFILE = [
  [0, 0.001, 0.001, 0], [0.025, 0.043, 0.024, 0.002],
  [0.075, 0.070, 0.038, 0.006], [0.15, 0.092, 0.059, 0.012],
  [0.23, 0.103, 0.076, 0.020], [0.32, 0.100, 0.082, 0.023],
  [0.43, 0.084, 0.071, 0.016], [0.56, 0.063, 0.055, 0.006],
  [0.68, 0.043, 0.039, 0.001], [0.80, 0.026, 0.027, 0],
  [0.91, 0.014, 0.018, 0], [1, 0.010, 0.011, 0],
] as const;
const radiusProfiles = new Map<number, { rx: number; ry: number; ventralBias: number }>();

/** Monoton Hermite: kesit birleşimlerinde basamak veya yapay halka oluşturmaz. */
function profileAt(s: number, column: 1 | 2 | 3): number {
  const t = clamp(s);
  // Yuvarlak burun kapağı: sıfıra doğrusal daralan koni yerine eliptik kesit.
  if (t < 0.025 && column !== 3) {
    const end = PROFILE[1][column], span = PROFILE[1][0];
    const before = (end - PROFILE[0][column]) / span;
    const after = (PROFILE[2][column] - end) / (PROFILE[2][0] - span);
    const slope = 2 * before * after / (before + after);
    const u = t / span, correction = 0.5 - slope * span / end;
    return end * Math.sqrt(u) * (1 + correction * (1 - u));
  }
  let i = 0;
  while (i < PROFILE.length - 2 && t > PROFILE[i + 1][0]) i++;
  const a = PROFILE[i], b = PROFILE[i + 1];
  const slope = (j: number) => (PROFILE[j + 1][column] - PROFILE[j][column]) / (PROFILE[j + 1][0] - PROFILE[j][0]);
  const tangent = (j: number) => {
    if (j === 0) return slope(0);
    if (j === PROFILE.length - 1) return slope(j - 1);
    const l = slope(j - 1), r = slope(j);
    return l * r <= 0 ? 0 : 2 * l * r / (l + r);
  };
  const h = b[0] - a[0], u = (t - a[0]) / h;
  return (2 * u ** 3 - 3 * u ** 2 + 1) * a[column] + (u ** 3 - 2 * u ** 2 + u) * h * tangent(i)
    + (-2 * u ** 3 + 3 * u ** 2) * b[column] + (u ** 3 - u ** 2) * h * tangent(i + 1);
}

export function computeRadii(s: number, length: number): WhaleSectionDimensions {
  const key = clamp(s);
  let profile = radiusProfiles.get(key);
  if (!profile) {
    profile = { rx: profileAt(key, 1), ry: profileAt(key, 2), ventralBias: profileAt(key, 3) };
    // Aynı deri koordinatları her karede kullanılır; farklı çağrılarda bellek sınırlıdır.
    if (radiusProfiles.size >= 16_384) radiusProfiles.clear();
    radiusProfiles.set(key, profile);
  }
  return {
    rx: profile.rx * length, ry: profile.ry * length,
    ventralBias: profile.ventralBias * length,
    isHead: s < 0.2, isThoracic: s >= 0.2 && s < 0.44, isPeduncle: s >= 0.7,
  };
}

export function computeSpineNodes(timeSec: number, width: number, height: number, config: WhaleConfig, numNodes = 56): WhaleSpineNode[] {
  const motion = sampleWhaleMotion(timeSec, width, height, config);
  const { pos, tangent: forward, bankAngle, phase, effort, bend } = motion;
  // Dünya yukarısı sabittir: sağa dönerken sırt aşağıya devrilmez.
  const worldUp = vNormalize(vec3(0.03, -1, -0.2));
  const up = rotateAroundAxis(vNormalize(vSub(worldUp, vScale(forward, vDot(worldUp, forward)))), forward, bankAngle);
  const right = vNormalize(vCross(forward, up));
  // Açısal dalga arkaya gecikerek iletilir. Sabit uzunluklu segmentlerin integrali
  // gövdenin her vuruşta lastik gibi uzamasını engeller; dönüş kuyruğa yayılır.
  const directionAt = (s: number) => {
    const envelope = smoothStep(0.18, 1, s);
    const pitch = Math.sin(phase - s * 2.7) * (0.035 + envelope * 0.44) * effort;
    const yaw = bend * (s - 0.18) + Math.sin(phase * 0.5 - s * 2) * envelope * 0.055;
    return vNormalize(vAdd(forward, vAdd(vScale(up, pitch), vScale(right, yaw))));
  };
  const positions: Vector3[] = [vec3()];
  const stations = Array.from({ length: numNodes }, (_, i) => (1 - Math.cos(i / (numNodes - 1) * Math.PI)) / 2);
  for (let i = 1; i < numNodes; i++) {
    positions.push(vAdd(positions[i - 1], vScale(directionAt((stations[i] + stations[i - 1]) / 2), -config.length * (stations[i] - stations[i - 1]))));
  }
  const anchor = positions[stations.findIndex(s => s >= 0.46)];
  const nodes: WhaleSpineNode[] = [];
  let previousNormal = up;
  let previousTangent = forward;
  for (let i = 0; i < numNodes; i++) {
    const s = stations[i];
    const tangent = directionAt(s);
    // Gerçek paralel taşıma: yüzgeç kökleri ve kuyruk dalga boyunca burkulmaz.
    const axis = vCross(previousTangent, tangent);
    const transported = vLen(axis) > 1e-7
      ? rotateAroundAxis(previousNormal, axis, Math.atan2(vLen(axis), vDot(previousTangent, tangent)))
      : previousNormal;
    const binormal = vNormalize(vCross(tangent, transported));
    const normal = vNormalize(vCross(binormal, tangent));
    nodes.push({ s, pos: vAdd(pos, vSub(positions[i], anchor)), tangent, normal, binormal, ...computeRadii(s, config.length) });
    previousNormal = normal;
    previousTangent = tangent;
  }
  return nodes;
}

export function generateWhaleMesh(timeSec: number, width: number, height: number, config: WhaleConfig): WhaleMesh {
  const small = width < 1024 || config.detail === "distant";
  const motion = sampleWhaleMotion(timeSec, width, height, config);
  const nodes = computeSpineNodes(timeSec, width, height, config, small ? 40 : 64);
  const L = config.length;
  const camera = vec3(0, 0, -config.cameraFocalLength);
  const project = (p: Vector3) => {
    const point = projectPoint(p, width, height, config.cameraFocalLength);
    return point;
  };
  const frameNodes = new Map<number, WhaleSpineNode>();
  const nodeAt = (s: number): WhaleSpineNode => {
    const cached = frameNodes.get(s);
    if (cached) return cached;
    const position = clamp(s);
    let low = 0, high = nodes.length - 1;
    while (high - low > 1) {
      const middle = (low + high) >> 1;
      if (nodes[middle].s <= position) low = middle; else high = middle;
    }
    const i = low, u = (position - nodes[i].s) / (nodes[i + 1].s - nodes[i].s);
    const a = nodes[i], b = nodes[i + 1];
    const node = { s, pos: vLerp(a.pos, b.pos, u), tangent: vNormalize(vLerp(a.tangent, b.tangent, u)),
      normal: vNormalize(vLerp(a.normal, b.normal, u)), binormal: vNormalize(vLerp(a.binormal, b.binormal, u)),
      ...computeRadii(s, L) };
    frameNodes.set(s, node);
    return node;
  };
  const surfacePoint = (s: number, theta: number, lift = 0): ProjectedPoint => {
    const n = nodeAt(s), c = Math.cos(theta), v = Math.sin(theta);
    const ry = n.ry + (v < 0 ? n.ventralBias : 0);
    // Geniş ve basık rostrum ile kabarık alt çene, eliptik gövdeden ayrı biçimlenir.
    const head = 1 - smoothStep(0.14, 0.29, s);
    const jawRim = Math.exp(-Math.pow((v + 0.15) / 0.15, 2)) * head * 0.055;
    const lateral = Math.sign(c) * Math.abs(c) ** (1 - head * 0.13) * (n.rx + lift) * (1 + jawRim);
    const vertical = v * (ry + lift) * (v > 0 ? 1 - head * 0.12 * v : 1);
    const p = vAdd(n.pos, vAdd(vScale(n.binormal, lateral), vScale(n.normal, vertical)));
    const normal = vNormalize(vAdd(vScale(n.binormal, c / Math.max(n.rx, 1)), vScale(n.normal, v / Math.max(ry, 1))));
    const point = project(p);
    point.visibility = vDot(normal, vNormalize(vSub(camera, p)));
    return point;
  };

  const ringSteps = small ? 28 : 48;
  const ribs: WhaleRib[] = nodes.map(n => ({
    s: n.s, ...computeRadii(n.s, L),
    points: Array.from({ length: ringSteps }, (_, j) => surfacePoint(n.s, j / ringSteps * TAU)),
  }));
  const streamlines = Array.from({ length: ringSteps }, (_, j) => ribs.map(r => r.points[j]));
  const surface: WhaleSurfacePatch[] = [];
  for (let i = 0; i < ribs.length - 1; i++) {
    for (let j = 0; j < ringSteps; j++) {
      const k = (j + 1) % ringSteps;
      const points = [ribs[i].points[j], ribs[i + 1].points[j], ribs[i + 1].points[k], ribs[i].points[k]];
      const facing = points.reduce((a, p) => a + (p.visibility ?? 0), 0) / 4;
      if (facing < -0.08) continue;
      const light = clamp(0.35 + 0.48 * Math.sin((j + 0.5) / ringSteps * TAU) + 0.25 * facing);
      surface.push({ points, light, ventral: clamp(-Math.sin((j + 0.5) / ringSteps * TAU) * 1.6 - 0.55)
        * (1 - smoothStep(0.43, 0.74, ribs[i].s)), depth: points.reduce((a, p) => a + p.z, 0) / 4 });
    }
  }
  surface.sort((a, b) => b.depth - a.depth);

  // Ekran teğetlerinden seçilen dış kontur burun ve kuyrukta da kapanır.
  const edgeA: ProjectedPoint[] = [], edgeB: ProjectedPoint[] = [];
  const spine = nodes.map(n => project(n.pos));
  ribs.forEach((r, i) => {
    const prev = spine[Math.max(0, i - 1)], next = spine[Math.min(spine.length - 1, i + 1)];
    const dx = next.x - prev.x, dy = next.y - prev.y;
    const sorted = [...r.points].sort((a, b) => (a.x - b.x) * -dy + (a.y - b.y) * dx);
    edgeA.push(sorted[0]); edgeB.push(sorted[sorted.length - 1]);
  });
  const silhouettePolygon = [...edgeA, ...edgeB.reverse()];
  const pleatCount = small ? 16 : 26;
  const pleatAt = (j: number, i: number, offset: number) => {
    const s = 0.018 + i / 39 * (0.51 - Math.abs(j - (pleatCount - 1) / 2) * 0.0055);
    const spread = Math.sin(clamp(s / 0.18) * Math.PI / 2);
    return surfacePoint(s, -Math.PI / 2 + (j / (pleatCount - 1) - 0.5) * 2.45 * spread + offset, 0.7);
  };
  const ventralPleats = Array.from({ length: pleatCount }, (_, j) => Array.from({ length: 40 }, (_, i) => pleatAt(j, i, 0)));
  const pleatHighlights = Array.from({ length: pleatCount }, (_, j) => Array.from({ length: 40 }, (_, i) => pleatAt(j, i, 0.014)));

  const attach = nodeAt(0.255);
  const buildFlipper = (side: "left" | "right"): WhaleFlipper => {
    const sign = side === "left" ? -1 : 1;
    const base = vAdd(attach.pos, vAdd(vScale(attach.binormal, sign * attach.rx * 0.86), vScale(attach.normal, -attach.ry * 0.36)));
    const flex = Math.sin(motion.phase - sign * 0.8 - 0.7) * 0.11 * motion.effort + sign * motion.bend * 0.10;
    const feather = Math.sin(motion.phase - 1.3 - sign * 0.7) * 0.32 + sign * motion.bend * 0.3;
    const pointAt = (u: number, chord: number): ProjectedPoint => {
      const curve = vAdd(base, vAdd(vScale(attach.binormal, sign * L * (0.33 * u - 0.045 * u * u)),
        vAdd(vScale(attach.tangent, -L * (0.11 * u + 0.09 * u * u)),
          vScale(attach.normal, L * (-0.10 * u - 0.025 * Math.sin(u * Math.PI) + flex * u * u)))));
      // Yedi küçük yuvarlak tüberkül; uçta kiriş sıfıra kapanır.
      const bumps = Math.sin(u * 7 * Math.PI) ** 8 * Math.sin(u * Math.PI) * L * 0.004;
      const halfChord = L * (0.027 * (1 - u) ** 0.65 + 0.018 * Math.sin(u * Math.PI));
      const chordDirection = rotateAroundAxis(attach.tangent, attach.binormal, feather * u);
      return project(vAdd(curve, vScale(chordDirection, halfChord * chord + (chord > 0 ? bumps : 0))));
    };
    const steps = 42;
    const leadingEdge = Array.from({ length: steps + 1 }, (_, i) => pointAt(i / steps, 1));
    const trailingEdge = Array.from({ length: steps + 1 }, (_, i) => pointAt(i / steps, -1));
    return {
      side, leadingEdge, trailingEdge, depth: pointAt(0.5, 0).z,
      tubercles: Array.from({ length: 7 }, (_, i) => pointAt((i + 0.5) / 7, 1)),
      // Beş falanks, ortak bilekten farklı uzunluklarda açılır.
      internalSpars: Array.from({ length: 5 }, (_, d) => Array.from({ length: 26 }, (_, i) => {
        const v = i / 25;
        return pointAt(0.035 + v * (0.69 + Math.sin(d / 4 * Math.PI) * 0.26), (d - 2) * 0.32 * Math.sin(v * Math.PI / 2));
      })),
      sections: Array.from({ length: 14 }, (_, i) => [-1, -0.5, 0, 0.5, 1].map(c => pointAt((i + 1) / 16, c))),
      etching: Array.from({ length: small ? 12 : 54 }, (_, i) => {
        const u = 0.08 + seeded(i + 400) * 0.80, c = seeded(i + 500) * 1.3 - 0.65;
        return [pointAt(u, c), pointAt(u + 0.014, c + 0.05), pointAt(u + 0.028, c + 0.075)];
      }),
    };
  };

  const tail = nodeAt(1);
  const flukeAxis = rotateAroundAxis(tail.tangent, tail.binormal, motion.tailPitch);
  const flukeNormal = vNormalize(vCross(tail.binormal, flukeAxis));
  const tailPoint = (lateral: number, axial: number, cup = 0) => project(vAdd(tail.pos,
    vAdd(vScale(tail.binormal, lateral * L), vAdd(vScale(flukeAxis, axial * L),
      vScale(flukeNormal, (cup + Math.sin(motion.phase - 2.1) * lateral * lateral * 0.19) * L)))));
  const flukeOutline: ProjectedPoint[] = [];
  const flukeRibs: ProjectedPoint[][] = [];
  // Lobların ön ve arka kenarları birleşir; ortadaki V gerçek bir yüzey çentiğidir.
  for (const sign of [-1, 1]) {
    for (let i = 0; i <= 24; i++) {
      const u = i / 24;
      flukeOutline.push(tailPoint(sign * 0.235 * u, 0.012 + 0.026 * Math.sin(Math.PI * u) - 0.078 * u * u, 0.022 * u ** 2));
    }
    for (let i = 23; i >= 0; i--) {
      const u = i / 24;
      const scallop = Math.sin(u * Math.PI * 9) * 0.0018 * Math.sin(u * Math.PI);
      flukeOutline.push(tailPoint(sign * 0.235 * u, -0.024 - 0.080 * Math.sin(u * Math.PI * 0.85) + scallop, 0.022 * u ** 2));
    }
    for (let i = 1; i < 10; i++) {
      const u = i / 10;
      flukeRibs.push(Array.from({ length: 9 }, (_, j) => {
        const v = j / 8;
        return tailPoint(sign * 0.235 * u, (0.012 + 0.026 * Math.sin(Math.PI * u) - 0.078 * u * u) * (1 - v)
          + (-0.024 - 0.080 * Math.sin(u * Math.PI * 0.85)) * v, 0.022 * u ** 2 + 0.007 * Math.sin(v * Math.PI));
      }));
    }
  }
  const flukeContours = [-1, 1].flatMap(sign => [0.22, 0.46, 0.70, 0.86].map(v =>
    Array.from({ length: 25 }, (_, i) => {
      const u = i / 24;
      const front = 0.012 + 0.026 * Math.sin(Math.PI * u) - 0.078 * u * u;
      const back = -0.024 - 0.080 * Math.sin(u * Math.PI * 0.85);
      return tailPoint(sign * 0.235 * u, front * (1 - v) + back * v, 0.022 * u * u + 0.007 * Math.sin(v * Math.PI));
    })));
  const flukes: WhaleFlukes = { outline: flukeOutline, notch: tailPoint(0, -0.024), contours: flukeContours,
    tips: [tailPoint(-0.235, -0.066, 0.022), tailPoint(0.235, -0.066, 0.022)], ribLines: flukeRibs, depth: tail.pos.z };

  const d = nodeAt(0.665);
  const dorsalPoint = (axial: number, vertical: number) => project(vAdd(d.pos,
    vAdd(vScale(d.tangent, axial * L), vScale(d.normal, d.ry + vertical * L))));
  const dorsalFin = { outline: [dorsalPoint(0.055, -0.006), dorsalPoint(0.025, 0.008),
    dorsalPoint(-0.005, 0.046), dorsalPoint(-0.020, 0.050), dorsalPoint(-0.016, 0.018), dorsalPoint(-0.058, -0.008)], depth: d.pos.z };

  const featureLines: WhaleFeatureLine[] = [];
  const tubercles: ProjectedPoint[] = [], eyes: ProjectedPoint[] = [];
  const nodules: WhaleNodule[] = [];
  for (const sign of [-1, 1]) {
    const sideAngle = sign === 1 ? 0 : Math.PI;
    featureLines.push({ kind: "jaw", points: Array.from({ length: 34 }, (_, i) => {
      const s = 0.008 + i / 33 * 0.245;
      return surfacePoint(s, sideAngle - sign * (0.08 + 0.16 * Math.sin(i / 33 * Math.PI)), 0.8);
    }) });
    featureLines.push({ kind: "jaw", points: Array.from({ length: 34 }, (_, i) =>
      surfacePoint(0.008 + i / 33 * 0.248, sideAngle - sign * (0.13 + 0.16 * Math.sin(i / 33 * Math.PI)), 0.9)) });
    eyes.push(surfacePoint(0.183, sideAngle + sign * 0.12, 1));
    featureLines.push({ kind: "eye", points: Array.from({ length: 18 }, (_, i) => {
      const a = i / 17 * TAU;
      return surfacePoint(0.183 + Math.cos(a) * 0.010, sideAngle + sign * (0.12 + Math.sin(a) * 0.045), 1.1);
    }) });
    // Kaş, göz altı kırışığı, ağız köşesi ve omuz kıvrımları.
    for (let k = 0; k < 3; k++) {
      featureLines.push({ kind: "fold", points: Array.from({ length: 16 }, (_, i) => {
        const u = i / 15;
        return surfacePoint(0.156 + u * 0.075 + k * 0.004, sideAngle + sign * (0.24 + Math.sin(u * Math.PI) * 0.08 + k * 0.045), 0.8);
      }) });
      featureLines.push({ kind: "fold", points: Array.from({ length: 20 }, (_, i) => {
        const a = -0.9 + i / 19 * 2.9;
        return surfacePoint(0.254 + Math.cos(a) * (0.025 + k * 0.006), sideAngle - sign * (0.39 + Math.sin(a) * (0.23 + k * 0.04)), 0.9);
      }) });
    }
    for (let row = 0; row < 2; row++) for (let i = 0; i < 8; i++) {
      const s = 0.018 + i * 0.023 + seeded(i + row * 8) * 0.004;
      const angle = sideAngle + sign * (0.48 + row * 0.60 + seeded(i + 70) * 0.10);
      const size = 0.0018 + seeded(i + row * 17 + 2) * 0.0017;
      const center = surfacePoint(s, angle, L * 0.0035);
      tubercles.push(center);
      const rim = (a: number, shrink = 1) => {
        const r = 1 + Math.sin(a * 3 + i) * 0.11;
        return surfacePoint(s + Math.cos(a) * size * r * shrink, angle + Math.sin(a) * 0.043 * r * shrink, L * 0.0015);
      };
      nodules.push({ center, outline: Array.from({ length: 15 }, (_, j) => rim(j / 14 * TAU)),
        crown: Array.from({ length: 9 }, (_, j) => rim(0.25 + j / 8 * Math.PI, 0.55)) });
    }
    featureLines.push({ kind: "blowhole", points: Array.from({ length: 12 }, (_, i) =>
      surfacePoint(0.175 + i / 11 * 0.035, Math.PI / 2 + sign * (0.065 + Math.sin(i / 11 * Math.PI) * 0.028), 1)) });
  }
  for (const angle of [Math.PI / 2 - 0.43, Math.PI / 2 + 0.43]) {
    featureLines.push({ kind: "ridge", points: Array.from({ length: 28 }, (_, i) =>
      surfacePoint(0.012 + i / 27 * 0.165, angle + Math.sin(i / 27 * Math.PI) * 0.15, 1)) });
  }
  featureLines.push({ kind: "ridge", points: Array.from({ length: 24 }, (_, i) => surfacePoint(0.008 + i / 23 * 0.18, Math.PI / 2, 1)) });
  for (let i = 0; i < 11; i++) {
    featureLines.push({ kind: "scar", points: Array.from({ length: 6 }, (_, j) =>
      surfacePoint(0.25 + (i * 0.047) % 0.39 + j * 0.0018, 0.4 + i * 1.9 + j * 0.03, 0.5)) });
  }
  // Sabit gravür noktaları her karede aynı yüzeyde kalır, titreşmez.
  const stipples = Array.from({ length: small ? 200 : 1080 }, (_, i) =>
    surfacePoint(0.025 + seeded(i) * 0.82, i * 2.399963, 0.6));
  // Tarama kılavuzları yüzey koordinatlarına bağlıdır; yüzüşte deriyle birlikte bükülür.
  const etching = Array.from({ length: small ? 60 : 420 }, (_, i) => {
    const s = 0.045 + seeded(i + 800) * 0.84;
    const theta = i * 2.399963;
    const span = 0.008 + seeded(i + 900) * 0.017;
    return { opacity: 0.22 + seeded(i + 1000) * 0.46,
      points: Array.from({ length: 5 }, (_, j) => {
        const u = j / 4;
        return surfacePoint(s + u * span, theta + u * 0.08 + Math.sin(u * Math.PI) * 0.025, 0.6);
      }) };
  });
  // Bireye özgü pigment adaları: yüzeyle birlikte hareket eden düzensiz deri lekeleri.
  const skinMarks = Array.from({ length: small ? 65 : 220 }, (_, i) => {
    const seed = i + (config.actor ?? 0) * 193;
    const s = 0.035 + seeded(seed + 1400) * 0.84, theta = seed * 2.399963;
    const radius = 0.001 + seeded(seed + 1700) * 0.004;
    return { light: i % 4 !== 0, opacity: 0.05 + seeded(seed + 1800) * 0.16,
      points: Array.from({ length: 9 }, (_, j) => {
        const a = j / 8 * TAU, irregular = 0.7 + seeded(seed * 11 + j) * 0.5;
        return surfacePoint(s + Math.cos(a) * radius * irregular, theta + Math.sin(a) * radius * 7 * irregular, 0.8);
      }) };
  });
  const mesh: WhaleMesh = {
    spine, ribs, streamlines, ventralPleats, pleatHighlights, silhouettePolygon, surface, featureLines, eyes, tubercles, stipples, nodules, etching, skinMarks,
    leftFlipper: buildFlipper("left"), rightFlipper: buildFlipper("right"), flukes, dorsalFin,
    depth: nodes[Math.floor(nodes.length / 2)].pos.z,
    technicalMarkers: [
      { pos: spine[4], label: "MEGAPTERA NOVAEANGLIAE", type: "cross" },
      { pos: project(attach.pos), label: "PEKTORAL YÜZGEÇ", type: "node" },
      { pos: spine[Math.round((nodes.length - 1) * 0.665)], label: "SIRT YÜZGECİ", type: "datum" },
      { pos: flukes.notch, label: "KUYRUK LOBLARI", type: "cross" },
    ],
  };
  return mesh;
}
