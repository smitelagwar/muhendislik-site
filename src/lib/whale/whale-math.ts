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
  // Üç-çeyrek (3/4) Darboux Ekran-Şerit Çerçevesi:
  // camDir doğrudan kameraya (-Z) bakar; inPlane ekran düzleminde sırt profilini tutar.
  const camDir = vNormalize(vSub(vec3(0, 0, -1), vScale(forward, -forward.z)));
  const screenRef = vec3(config.actor ? 0.52 : -0.52, -0.85, 0);
  const inPlane = vNormalize(
    vSub(screenRef, vAdd(vScale(forward, vDot(screenRef, forward)), vScale(camDir, vDot(screenRef, camDir))))
  );
  // Sırt (up) %92 ekran konturunda + %39 kameraya dönük; yan gövde (binormal) ise %92 kameraya dönük 3/4 perspektiftedir.
  const roll = 0.40 + bankAngle * 0.22;
  const up = vNormalize(vAdd(vScale(inPlane, Math.cos(roll)), vScale(camDir, Math.sin(roll))));
  const right = vNormalize(vCross(forward, up));
  // Biyomekanik dalga: Baş hafif dengeleyici salınım yapar, göğüs stabildir, kuyruk sapı (peduncle) güçlü itiş üretir.
  // Sabit uzunluklu segmentlerin integrali gövde boyunu matematiksel olarak sabit tutar.
  const directionAt = (s: number) => {
    const envelope = smoothStep(0.18, 1, s);
    const headCounter = (1 - smoothStep(0.0, 0.26, s)) * Math.sin(phase + 0.45) * 0.028 * effort;
    const pitch = headCounter + Math.sin(phase - s * 2.85) * (0.032 + envelope * 0.46) * effort;
    const yaw = bend * (s - 0.20) + Math.sin(phase * 0.5 - s * 2.1) * envelope * 0.06;
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
    // Gerçek paralel taşıma + kuyruk sapında 3B perspektif açılımı:
    // Sırt yüzgeci (s=0.665) yan profilde yükselirken, kuyruk lobları (s=1) kameraya ~48° açıyla çift kanatlı görünür.
    const axis = vCross(previousTangent, tangent);
    const transported = vLen(axis) > 1e-7
      ? rotateAroundAxis(previousNormal, axis, Math.atan2(vLen(axis), vDot(previousTangent, tangent)))
      : previousNormal;
    const baseBinormal = vNormalize(vCross(tangent, transported));
    const baseNormal = vNormalize(vCross(baseBinormal, tangent));
    const camSign = vDot(baseBinormal, camDir) >= 0 ? 1 : -1;
    const peduncleRoll = smoothStep(0.68, 1.0, s) * 0.44 * camSign;
    const normal = peduncleRoll !== 0 ? rotateAroundAxis(baseNormal, tangent, peduncleRoll) : baseNormal;
    const binormal = vNormalize(vCross(tangent, normal));
    nodes.push({ s, pos: vAdd(pos, vSub(positions[i], anchor)), tangent, normal, binormal, ...computeRadii(s, config.length) });
    previousNormal = baseNormal;
    previousTangent = tangent;
  }
  return nodes;
}

export function generateWhaleMesh(timeSec: number, width: number, height: number, config: WhaleConfig): WhaleMesh {
  const small = width < 1024 || config.detail === "distant";
  const motion = sampleWhaleMotion(timeSec, width, height, config);
  const nodes = computeSpineNodes(timeSec, width, height, config, small ? 42 : 64);
  const L = config.length;
  const camera = vec3(0, 0, -config.cameraFocalLength);
  const sunLight = vNormalize(vec3(-0.32, -0.78, -0.54));
  const fillLight = vNormalize(vec3(0.45, -0.45, -0.77));

  const project = (p: Vector3) => projectPoint(p, width, height, config.cameraFocalLength);

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
    const node = {
      s,
      pos: vLerp(a.pos, b.pos, u),
      tangent: vNormalize(vLerp(a.tangent, b.tangent, u)),
      normal: vNormalize(vLerp(a.normal, b.normal, u)),
      binormal: vNormalize(vLerp(a.binormal, b.binormal, u)),
      ...computeRadii(s, L),
    };
    frameNodes.set(s, node);
    return node;
  };

  // Gerçek 3B anatomik yüzey noktası ve boyutsuz (dimensionless) birim 3B dünya normali
  const surfacePoint3D = (s: number, theta: number, lift = 0): { world: Vector3; normal: Vector3; point: ProjectedPoint; pleatWave: number } => {
    const n = nodeAt(s), c = Math.cos(theta), v = Math.sin(theta);
    const ryBase = n.ry + (v < 0 ? n.ventralBias : 0);

    // 1. Baş, yassı rostrum, kavisli alt çene (mandibula) ve hava deliği tümseği (splashguard)
    const head = 1 - smoothStep(0.14, 0.29, s);
    const jawRim = Math.exp(-Math.pow((v + 0.16) / 0.16, 2)) * head * 0.064;
    const blowholeSplashguard = Math.exp(-Math.pow((s - 0.178) / 0.026, 2)) * Math.max(0, v - 0.72) * L * 0.014;
    const browRidge = Math.exp(-Math.pow((s - 0.183) / 0.022, 2)) * Math.exp(-Math.pow((v - 0.12) / 0.14, 2)) * L * 0.006;

    // 2. Kambur sırt yüzgeci kaidesi (dorsal hump) ve kuyruk sapı (peduncle) omurga boğumları
    const dorsalHump = Math.exp(-Math.pow((s - 0.655) / 0.048, 2)) * Math.max(0, v - 0.45) ** 1.5 * L * 0.022;
    const peduncleKeel = smoothStep(0.68, 0.94, s) * (1 - smoothStep(0.95, 1.0, s)) * Math.pow(Math.abs(v), 2.4) * L * 0.010;
    const caudalKnuckles = (s > 0.71 && s < 0.91 && v > 0.75)
      ? Math.pow(Math.max(0, Math.sin((s - 0.71) / 0.20 * Math.PI * 5)), 4) * (v - 0.75) * L * 0.008
      : 0;

    // 3. 3B Karın olukları (ventral pleats)
    const inPleatZone = (1 - smoothStep(0.44, 0.56, s)) * smoothStep(0.015, 0.05, s) * clamp((-v - 0.18) / 0.62);
    const pleatWave = inPleatZone > 0 ? Math.cos(theta * 26) * inPleatZone : 0;

    const lateral = Math.sign(c) * Math.abs(c) ** (1 - head * 0.14) * (n.rx + lift + browRidge) * (1 + jawRim);
    const vertical = v * (ryBase + lift) * (v > 0 ? 1 - head * 0.13 * v : 1)
      + blowholeSplashguard + dorsalHump + Math.sign(v) * peduncleKeel + caudalKnuckles;

    const p = vAdd(n.pos, vAdd(vScale(n.binormal, lateral), vScale(n.normal, vertical)));

    // Boyutsuz (dimensionless) eliptik kesit normali + boyuna koniklik eğimi (taper)
    const sPrev = Math.max(0, s - 0.015), sNext = Math.min(1, s + 0.015);
    const rPrev = computeRadii(sPrev, L), rNext = computeRadii(sNext, L);
    const drds = ((rNext.rx - rPrev.rx) * Math.abs(c) + (rNext.ry - rPrev.ry) * Math.abs(v)) / ((sNext - sPrev) * L || 1);
    const aspect = clamp(ryBase / Math.max(n.rx, 1), 0.5, 2.0);
    const normal = vNormalize(vAdd(
      vAdd(
        vScale(n.binormal, c * aspect),
        vScale(n.normal, v + (dorsalHump > 0 ? 0.12 : 0))
      ),
      vScale(n.tangent, -drds * 0.42)
    ));

    const point = project(p);
    point.visibility = vDot(normal, vNormalize(vSub(camera, p)));
    return { world: p, normal, point, pleatWave };
  };

  const surfacePoint = (s: number, theta: number, lift = 0): ProjectedPoint => surfacePoint3D(s, theta, lift).point;

  // 3B Phong + Fresnel Rim + Sualtı Kostik aydınlatma hesaplayıcısı
  const compute3DShading = (worldPos: Vector3, normal: Vector3, ventralFactor: number, pleatWave = 0, sCoord = 0.5, thetaCoord = 0): Omit<WhaleSurfacePatch, "points"> => {
    const viewDir = vNormalize(vSub(camera, worldPos));
    const facing = vDot(normal, viewDir);
    const nDotSun = Math.max(0, vDot(normal, sunLight));
    const nDotFill = Math.max(0, vDot(normal, fillLight));
    const skyBounce = Math.max(0, -normal.y) * 0.18;
    const abyssBounce = Math.max(0, normal.y) * 0.10;

    // Lambertian + Hemispherical 3B aydınlanma [0, 1]
    const light = clamp(0.12 + nDotSun * 0.62 + nDotFill * 0.20 + skyBounce + abyssBounce + pleatWave * 0.09);

    // Blinn-Phong ıslak deri speküler parlama
    const halfVec = vNormalize(vAdd(sunLight, viewDir));
    const nDotH = Math.max(0, vDot(normal, halfVec));
    const specular = clamp(Math.pow(nDotH, 20) * 0.92 + Math.pow(nDotH, 6) * 0.18);

    // 3B Fresnel siluet kenar aydınlatması (Rim Light)
    const fresnel = Math.pow(1 - clamp(facing, 0, 1), 2.35);
    const rim = clamp(fresnel * (0.32 + 0.68 * Math.max(0, -normal.y * 0.65 + 0.35)));

    // Sualtı güneş kostikleri (yalnız yukarı/ışığa bakan sırt yüzeylerinde)
    const causticPhase1 = worldPos.x * 0.024 + worldPos.z * 0.019 + timeSec * 1.35;
    const causticPhase2 = worldPos.x * 0.017 - worldPos.y * 0.022 - timeSec * 0.95;
    const causticWave = Math.max(0, Math.sin(causticPhase1) * Math.cos(causticPhase2));
    const caustic = clamp(Math.pow(causticWave, 2.2) * Math.max(0, nDotSun - 0.22) * (1 - ventralFactor * 0.85) * 1.35);

    return {
      light,
      ventral: clamp(ventralFactor),
      depth: worldPos.z,
      specular,
      rim,
      caustic,
      pleatShade: pleatWave,
      s: sCoord,
      theta: thetaCoord,
    };
  };

  const ringSteps = small ? 30 : 48;
  const grid3D = nodes.map(n =>
    Array.from({ length: ringSteps }, (_, j) => surfacePoint3D(n.s, j / ringSteps * TAU))
  );

  const ribs: WhaleRib[] = nodes.map((n, i) => ({
    s: n.s,
    ...computeRadii(n.s, L),
    points: grid3D[i].map(cell => cell.point),
  }));
  const streamlines = Array.from({ length: ringSteps }, (_, j) => ribs.map(r => r.points[j]));

  const surface: WhaleSurfacePatch[] = [];
  for (let i = 0; i < ribs.length - 1; i++) {
    const sMid = (nodes[i].s + nodes[i + 1].s) * 0.5;
    for (let j = 0; j < ringSteps; j++) {
      const k = (j + 1) % ringSteps;
      const c00 = grid3D[i][j], c10 = grid3D[i + 1][j], c11 = grid3D[i + 1][k], c01 = grid3D[i][k];
      const points = [c00.point, c10.point, c11.point, c01.point];
      const facing = (
        (c00.point.visibility ?? 0) +
        (c10.point.visibility ?? 0) +
        (c11.point.visibility ?? 0) +
        (c01.point.visibility ?? 0)
      ) * 0.25;
      if (facing < -0.10) continue;

      const avgWorld = vScale(vAdd(vAdd(c00.world, c10.world), vAdd(c11.world, c01.world)), 0.25);
      const avgNormal = vNormalize(vAdd(vAdd(c00.normal, c10.normal), vAdd(c11.normal, c01.normal)));
      const thetaMid = ((j + 0.5) / ringSteps) * TAU;
      const sinTheta = Math.sin(thetaMid);
      const ventralFactor = clamp(-sinTheta * 1.55 - 0.38) * (1 - smoothStep(0.45, 0.76, sMid));
      const pleatAvg = (c00.pleatWave + c10.pleatWave + c11.pleatWave + c01.pleatWave) * 0.25;

      surface.push({
        points,
        ...compute3DShading(avgWorld, avgNormal, ventralFactor, pleatAvg, sMid, thetaMid),
      });
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

  // ─── 3B Hidrofil Pektoral Yüzgeçler (Megaptera novaeangliae) ───
  const attach = nodeAt(0.255);
  const buildFlipper = (side: "left" | "right"): WhaleFlipper => {
    const sign = side === "left" ? -1 : 1;
    const base = vAdd(attach.pos, vAdd(vScale(attach.binormal, sign * attach.rx * 0.84), vScale(attach.normal, -attach.ry * 0.34)));
    const flex = Math.sin(motion.phase - sign * 0.75 - 0.65) * 0.13 * motion.effort + sign * motion.bend * 0.12;
    const feather = Math.sin(motion.phase - 1.25 - sign * 0.65) * 0.34 + sign * motion.bend * 0.30;

    const flipper3DAt = (u: number, chord: number, sideSurface = 1): { world: Vector3; normal: Vector3; point: ProjectedPoint } => {
      const spanCurve = vAdd(
        base,
        vAdd(
          vScale(attach.binormal, sign * L * (0.34 * u - 0.048 * u * u)),
          vAdd(
            vScale(attach.tangent, -L * (0.105 * u + 0.095 * u * u)),
            vScale(attach.normal, L * (-0.105 * u - 0.028 * Math.sin(u * Math.PI) + flex * Math.pow(u, 1.75)))
          )
        )
      );
      // Dokuz karakteristik Megaptera ön kenar tüberkülü; uçta (u=1) kiriş sıfıra kapanır.
      const bumps = Math.sin(u * 9 * Math.PI) ** 6 * Math.sin(u * Math.PI) * L * 0.0046;
      const halfChord = L * (0.029 * (1 - u) ** 0.65 + 0.019 * Math.sin(u * Math.PI));
      const chordDirection = rotateAroundAxis(attach.tangent, attach.binormal, feather * u);
      const wingNormal = vNormalize(vCross(chordDirection, vScale(attach.binormal, sign)));
      const thickness = L * 0.0085 * (1 - 0.72 * u) * Math.sqrt(Math.max(0, 1 - chord * chord)) * sideSurface;
      const world = vAdd(
        spanCurve,
        vAdd(
          vScale(chordDirection, halfChord * chord + (chord > 0 ? bumps * Math.max(0, chord) : 0)),
          vScale(wingNormal, thickness)
        )
      );
      const normal = vNormalize(vAdd(
        vScale(wingNormal, sideSurface * 0.85),
        vScale(chordDirection, chord * 0.42)
      ));
      const point = project(world);
      point.visibility = vDot(normal, vNormalize(vSub(camera, world)));
      return { world, normal, point };
    };

    const pointAt = (u: number, chord: number): ProjectedPoint => flipper3DAt(u, chord, 0).point;

    const steps = 44;
    const leadingEdge = Array.from({ length: steps + 1 }, (_, i) => pointAt(i / steps, 1));
    const trailingEdge = Array.from({ length: steps + 1 }, (_, i) => pointAt(i / steps, -1));

    // Yüzgeç için 3B gölgelendirilmiş hidrofil yüzey yamaları
    const spanSteps = small ? 10 : 18;
    const chordSteps = small ? 4 : 6;
    const finSurface: WhaleSurfacePatch[] = [];
    const viewDirSample = vNormalize(vSub(camera, base));
    const baseWingNormal = vNormalize(vCross(attach.tangent, vScale(attach.binormal, sign)));
    const orientSign = vDot(baseWingNormal, viewDirSample) >= 0 ? 1 : -1;

    for (let iu = 0; iu < spanSteps; iu++) {
      const u0 = iu / spanSteps, u1 = (iu + 1) / spanSteps;
      const uMid = (u0 + u1) * 0.5;
      for (let ic = 0; ic < chordSteps; ic++) {
        const c0 = -1 + (ic / chordSteps) * 2;
        const c1 = -1 + ((ic + 1) / chordSteps) * 2;
        const p00 = flipper3DAt(u0, c0, orientSign);
        const p10 = flipper3DAt(u1, c0, orientSign);
        const p11 = flipper3DAt(u1, c1, orientSign);
        const p01 = flipper3DAt(u0, c1, orientSign);
        const avgWorld = vScale(vAdd(vAdd(p00.world, p10.world), vAdd(p11.world, p01.world)), 0.25);
        const avgNormal = vNormalize(vAdd(vAdd(p00.normal, p10.normal), vAdd(p11.normal, p01.normal)));
        // Megaptera kanatları: uçlara ve ön kenara doğru parlak beyaz/fildişi, omuz kökünde alacalı arduvaz
        const whitePattern = clamp(smoothStep(0.12, 0.55, uMid) * 0.82 + (c0 + c1) * 0.18 + (orientSign < 0 ? 0.35 : 0.15));
        finSurface.push({
          points: [p00.point, p10.point, p11.point, p01.point],
          ...compute3DShading(avgWorld, avgNormal, whitePattern, 0, uMid, (c0 + c1) * 0.5),
        });
      }
    }
    finSurface.sort((a, b) => b.depth - a.depth);

    return {
      side,
      leadingEdge,
      trailingEdge,
      depth: pointAt(0.5, 0).z,
      tubercles: Array.from({ length: 9 }, (_, i) => pointAt((i + 0.5) / 9, 1)),
      internalSpars: Array.from({ length: 5 }, (_, d) => Array.from({ length: 26 }, (_, i) => {
        const v = i / 25;
        return pointAt(0.035 + v * (0.69 + Math.sin(d / 4 * Math.PI) * 0.26), (d - 2) * 0.32 * Math.sin(v * Math.PI / 2));
      })),
      sections: Array.from({ length: 14 }, (_, i) => [-1, -0.5, 0, 0.5, 1].map(c => pointAt((i + 1) / 16, c))),
      etching: Array.from({ length: small ? 12 : 48 }, (_, i) => {
        const u = 0.08 + seeded(i + 400) * 0.80, c = seeded(i + 500) * 1.3 - 0.65;
        return [pointAt(u, c), pointAt(u + 0.014, c + 0.05), pointAt(u + 0.028, c + 0.075)];
      }),
      surface: finSurface,
    };
  };

  // ─── 3B Çatallı Kuyruk Yüzgeci (Caudal Flukes) ───
  const tail = nodeAt(1);
  const flukeAxis = rotateAroundAxis(tail.tangent, tail.binormal, motion.tailPitch);
  const flukeNormal = vNormalize(vCross(tail.binormal, flukeAxis));

  const fluke3DAt = (sign: number, u: number, v: number): { world: Vector3; normal: Vector3; point: ProjectedPoint } => {
    const lateral = sign * 0.242 * u;
    const front = 0.013 + 0.028 * Math.sin(Math.PI * u) - 0.080 * u * u;
    const scallop = Math.sin(u * Math.PI * 10) * 0.0022 * Math.sin(u * Math.PI);
    const back = -0.025 - 0.082 * Math.sin(u * Math.PI * 0.85) + scallop;
    const axial = front * (1 - v) + back * v;
    const flexCup = Math.sin(motion.phase - 2.15) * lateral * lateral * 0.22;
    const camber = 0.022 * u * u + 0.0075 * Math.sin(v * Math.PI) + flexCup;
    const world = vAdd(
      tail.pos,
      vAdd(
        vScale(tail.binormal, lateral * L),
        vAdd(vScale(flukeAxis, axial * L), vScale(flukeNormal, camber * L))
      )
    );
    const viewCheck = vDot(flukeNormal, vSub(camera, world)) >= 0 ? 1 : -1;
    const normal = vNormalize(vAdd(
      vScale(flukeNormal, viewCheck * 0.86),
      vAdd(
        vScale(flukeAxis, (0.45 - v) * 0.42),
        vScale(tail.binormal, -sign * u * 0.25)
      )
    ));
    const point = project(world);
    point.visibility = vDot(normal, vNormalize(vSub(camera, world)));
    return { world, normal, point };
  };

  const tailPoint = (lateral: number, axial: number, cup = 0) => project(vAdd(tail.pos,
    vAdd(vScale(tail.binormal, lateral * L), vAdd(vScale(flukeAxis, axial * L),
      vScale(flukeNormal, (cup + Math.sin(motion.phase - 2.15) * lateral * lateral * 0.22) * L)))));

  const flukeOutline: ProjectedPoint[] = [];
  const flukeRibs: ProjectedPoint[][] = [];
  const flukeSurface: WhaleSurfacePatch[] = [];

  for (const sign of [-1, 1]) {
    for (let i = 0; i <= 24; i++) {
      const u = i / 24;
      flukeOutline.push(fluke3DAt(sign, u, 0).point);
    }
    for (let i = 23; i >= 0; i--) {
      const u = i / 24;
      flukeOutline.push(fluke3DAt(sign, u, 1).point);
    }
    for (let i = 1; i < 10; i++) {
      const u = i / 10;
      flukeRibs.push(Array.from({ length: 9 }, (_, j) => fluke3DAt(sign, u, j / 8).point));
    }

    const uSteps = small ? 8 : 14;
    const vSteps = small ? 4 : 6;
    for (let iu = 0; iu < uSteps; iu++) {
      const u0 = iu / uSteps, u1 = (iu + 1) / uSteps;
      const uMid = (u0 + u1) * 0.5;
      for (let iv = 0; iv < vSteps; iv++) {
        const v0 = iv / vSteps, v1 = (iv + 1) / vSteps;
        const vMid = (v0 + v1) * 0.5;
        const p00 = fluke3DAt(sign, u0, v0);
        const p10 = fluke3DAt(sign, u1, v0);
        const p11 = fluke3DAt(sign, u1, v1);
        const p01 = fluke3DAt(sign, u0, v1);
        const avgWorld = vScale(vAdd(vAdd(p00.world, p10.world), vAdd(p11.world, p01.world)), 0.25);
        const avgNormal = vNormalize(vAdd(vAdd(p00.normal, p10.normal), vAdd(p11.normal, p01.normal)));
        // Kuyruk loblarının iç ve arka kenarına yakın karakteristik açık pigment desenleri
        const flukeVentral = clamp(Math.sin(uMid * Math.PI) * (0.25 + 0.45 * Math.sin(vMid * Math.PI)));
        flukeSurface.push({
          points: [p00.point, p10.point, p11.point, p01.point],
          ...compute3DShading(avgWorld, avgNormal, flukeVentral, 0, uMid, vMid),
        });
      }
    }
  }
  flukeSurface.sort((a, b) => b.depth - a.depth);

  const flukeContours = [-1, 1].flatMap(sign => [0.22, 0.46, 0.70, 0.86].map(v =>
    Array.from({ length: 25 }, (_, i) => fluke3DAt(sign, i / 24, v).point)));

  const flukes: WhaleFlukes = {
    outline: flukeOutline,
    notch: tailPoint(0, -0.025),
    contours: flukeContours,
    tips: [fluke3DAt(-1, 1, 0.35).point, fluke3DAt(1, 1, 0.35).point],
    ribLines: flukeRibs,
    surface: flukeSurface,
    depth: tail.pos.z,
  };

  // ─── 3B Kambur Sırt Yüzgeci (Dorsal Fin & Muscular Hump) ───
  const d = nodeAt(0.665);
  const dorsal3DAt = (u: number, h: number): { world: Vector3; normal: Vector3; point: ProjectedPoint } => {
    const axial = (0.062 - u * 0.124) * (1 - h * 0.55) - Math.pow(h, 1.6) * 0.024;
    const vertical = -0.006 + h * (0.056 * Math.sin(Math.pow(u, 0.75) * Math.PI));
    const thickness = (1 - h * 0.85) * Math.sin(u * Math.PI) * 0.014;
    const viewSide = vDot(d.binormal, vSub(camera, d.pos)) >= 0 ? 1 : -1;
    const world = vAdd(
      d.pos,
      vAdd(
        vScale(d.tangent, axial * L),
        vAdd(
          vScale(d.normal, d.ry + vertical * L),
          vScale(d.binormal, viewSide * thickness * L)
        )
      )
    );
    const normal = vNormalize(vAdd(
      vScale(d.binormal, viewSide * 0.78),
      vAdd(vScale(d.normal, 0.48), vScale(d.tangent, (0.5 - u) * 0.35))
    ));
    return { world, normal, point: project(world) };
  };
  const dorsalPoint = (axial: number, vertical: number) => project(vAdd(d.pos,
    vAdd(vScale(d.tangent, axial * L), vScale(d.normal, d.ry + vertical * L))));

  const dorsalSurface: WhaleSurfacePatch[] = [];
  for (let iu = 0; iu < 6; iu++) {
    const u0 = iu / 6, u1 = (iu + 1) / 6;
    for (let ih = 0; ih < 4; ih++) {
      const h0 = ih / 4, h1 = (ih + 1) / 4;
      const p00 = dorsal3DAt(u0, h0), p10 = dorsal3DAt(u1, h0), p11 = dorsal3DAt(u1, h1), p01 = dorsal3DAt(u0, h1);
      const avgWorld = vScale(vAdd(vAdd(p00.world, p10.world), vAdd(p11.world, p01.world)), 0.25);
      const avgNormal = vNormalize(vAdd(vAdd(p00.normal, p10.normal), vAdd(p11.normal, p01.normal)));
      dorsalSurface.push({
        points: [p00.point, p10.point, p11.point, p01.point],
        ...compute3DShading(avgWorld, avgNormal, 0, 0, 0.665, Math.PI / 2),
      });
    }
  }
  const dorsalFin = {
    outline: [
      dorsalPoint(0.058, -0.006),
      dorsalPoint(0.026, 0.010),
      dorsalPoint(-0.004, 0.048),
      dorsalPoint(-0.022, 0.052),
      dorsalPoint(-0.018, 0.019),
      dorsalPoint(-0.060, -0.008),
    ],
    surface: dorsalSurface,
    depth: d.pos.z,
  };

  const featureLines: WhaleFeatureLine[] = [];
  const tubercles: ProjectedPoint[] = [], eyes: ProjectedPoint[] = [];
  const nodules: WhaleNodule[] = [];
  for (const sign of [-1, 1]) {
    const sideAngle = sign === 1 ? 0 : Math.PI;
    featureLines.push({
      kind: "jaw",
      points: Array.from({ length: 34 }, (_, i) => {
        const s = 0.008 + i / 33 * 0.245;
        return surfacePoint(s, sideAngle - sign * (0.08 + 0.16 * Math.sin(i / 33 * Math.PI)), 0.8);
      }),
    });
    featureLines.push({
      kind: "jaw",
      points: Array.from({ length: 34 }, (_, i) =>
        surfacePoint(0.008 + i / 33 * 0.248, sideAngle - sign * (0.13 + 0.16 * Math.sin(i / 33 * Math.PI)), 0.9)
      ),
    });
    eyes.push(surfacePoint(0.183, sideAngle + sign * 0.12, 1));
    featureLines.push({
      kind: "eye",
      points: Array.from({ length: 18 }, (_, i) => {
        const a = i / 17 * TAU;
        return surfacePoint(0.183 + Math.cos(a) * 0.010, sideAngle + sign * (0.12 + Math.sin(a) * 0.045), 1.1);
      }),
    });
    // Kaş, göz altı kırışığı, ağız köşesi ve omuz kıvrımları.
    for (let k = 0; k < 3; k++) {
      featureLines.push({
        kind: "fold",
        points: Array.from({ length: 16 }, (_, i) => {
          const u = i / 15;
          return surfacePoint(0.156 + u * 0.075 + k * 0.004, sideAngle + sign * (0.24 + Math.sin(u * Math.PI) * 0.08 + k * 0.045), 0.8);
        }),
      });
      featureLines.push({
        kind: "fold",
        points: Array.from({ length: 20 }, (_, i) => {
          const a = -0.9 + i / 19 * 2.9;
          return surfacePoint(0.254 + Math.cos(a) * (0.025 + k * 0.006), sideAngle - sign * (0.39 + Math.sin(a) * (0.23 + k * 0.04)), 0.9);
        }),
      });
    }
    for (let row = 0; row < 2; row++) {
      for (let i = 0; i < 8; i++) {
        const s = 0.018 + i * 0.023 + seeded(i + row * 8) * 0.004;
        const angle = sideAngle + sign * (0.48 + row * 0.60 + seeded(i + 70) * 0.10);
        const size = 0.0018 + seeded(i + row * 17 + 2) * 0.0017;
        const center = surfacePoint(s, angle, L * 0.0035);
        tubercles.push(center);
        const rim = (a: number, shrink = 1) => {
          const r = 1 + Math.sin(a * 3 + i) * 0.11;
          return surfacePoint(s + Math.cos(a) * size * r * shrink, angle + Math.sin(a) * 0.043 * r * shrink, L * 0.0015);
        };
        nodules.push({
          center,
          outline: Array.from({ length: 15 }, (_, j) => rim(j / 14 * TAU)),
          crown: Array.from({ length: 9 }, (_, j) => rim(0.25 + j / 8 * Math.PI, 0.55)),
        });
      }
    }
    featureLines.push({
      kind: "blowhole",
      points: Array.from({ length: 12 }, (_, i) =>
        surfacePoint(0.175 + i / 11 * 0.035, Math.PI / 2 + sign * (0.065 + Math.sin(i / 11 * Math.PI) * 0.028), 1)
      ),
    });
  }
  for (const angle of [Math.PI / 2 - 0.43, Math.PI / 2 + 0.43]) {
    featureLines.push({
      kind: "ridge",
      points: Array.from({ length: 28 }, (_, i) =>
        surfacePoint(0.012 + i / 27 * 0.165, angle + Math.sin(i / 27 * Math.PI) * 0.15, 1)
      ),
    });
  }
  featureLines.push({
    kind: "ridge",
    points: Array.from({ length: 24 }, (_, i) => surfacePoint(0.008 + i / 23 * 0.18, Math.PI / 2, 1)),
  });
  for (let i = 0; i < 11; i++) {
    featureLines.push({
      kind: "scar",
      points: Array.from({ length: 6 }, (_, j) =>
        surfacePoint(0.25 + (i * 0.047) % 0.39 + j * 0.0018, 0.4 + i * 1.9 + j * 0.03, 0.5)
      ),
    });
  }

  // Sabit gravür noktaları her karede aynı yüzeyde kalır, titreşmez.
  const stipples = Array.from({ length: small ? 180 : 720 }, (_, i) =>
    surfacePoint(0.025 + seeded(i) * 0.82, i * 2.399963, 0.6)
  );
  // Tarama kılavuzları yüzey koordinatlarına bağlıdır; yüzüşte deriyle birlikte bükülür.
  const etching = Array.from({ length: small ? 50 : 280 }, (_, i) => {
    const s = 0.045 + seeded(i + 800) * 0.84;
    const theta = i * 2.399963;
    const span = 0.008 + seeded(i + 900) * 0.017;
    return {
      opacity: 0.20 + seeded(i + 1000) * 0.40,
      points: Array.from({ length: 5 }, (_, j) => {
        const u = j / 4;
        return surfacePoint(s + u * span, theta + u * 0.08 + Math.sin(u * Math.PI) * 0.025, 0.6);
      }),
    };
  });
  // Bireye özgü pigment adaları: yüzeyle birlikte hareket eden düzensiz deri lekeleri.
  const skinMarks = Array.from({ length: small ? 65 : 200 }, (_, i) => {
    const seed = i + (config.actor ?? 0) * 193;
    const s = 0.035 + seeded(seed + 1400) * 0.84, theta = seed * 2.399963;
    const radius = 0.001 + seeded(seed + 1700) * 0.004;
    return {
      light: i % 4 !== 0,
      opacity: 0.06 + seeded(seed + 1800) * 0.18,
      points: Array.from({ length: 9 }, (_, j) => {
        const a = j / 8 * TAU, irregular = 0.7 + seeded(seed * 11 + j) * 0.5;
        return surfacePoint(s + Math.cos(a) * radius * irregular, theta + Math.sin(a) * radius * 7 * irregular, 0.8);
      }),
    };
  });

  const leftFlipper = buildFlipper("left");
  const rightFlipper = buildFlipper("right");

  // ─── 3B Hidrodinamik Girdap / Akış İzleri (Slipstream Wake Trails) ───
  const buildWakeLine = (origin: ProjectedPoint, phaseShift: number, scaleLen: number) => {
    const pts: ProjectedPoint[] = [];
    for (let i = 0; i < 12; i++) {
      const u = i / 11;
      const swirl = Math.sin(motion.phase - u * 4.2 + phaseShift) * L * 0.012 * u;
      const world = vAdd(
        vec3(
          (origin.x - width / 2) / origin.scale,
          (origin.y - height / 2) / origin.scale,
          origin.z
        ),
        vAdd(
          vScale(tail.tangent, -L * scaleLen * u),
          vAdd(vScale(tail.normal, swirl), vScale(tail.binormal, Math.cos(motion.phase - u * 3.5 + phaseShift) * L * 0.008 * u))
        )
      );
      pts.push(project(world));
    }
    return { points: pts, opacity: 0.28 * motion.effort };
  };

  const wakeLines = [
    buildWakeLine(leftFlipper.leadingEdge.at(-1)!, 0.0, 0.16),
    buildWakeLine(rightFlipper.leadingEdge.at(-1)!, 1.5, 0.16),
    buildWakeLine(flukes.tips[0], 0.8, 0.20),
    buildWakeLine(flukes.tips[1], 2.3, 0.20),
  ];

  const mesh: WhaleMesh = {
    spine,
    ribs,
    streamlines,
    ventralPleats,
    pleatHighlights,
    silhouettePolygon,
    surface,
    featureLines,
    eyes,
    tubercles,
    stipples,
    nodules,
    etching,
    skinMarks,
    wakeLines,
    leftFlipper,
    rightFlipper,
    flukes,
    dorsalFin,
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
