// Etkileşimli halftone hologram parçacık yay-sönümleme motoru

export type HologramSubject = "building" | "bust" | "mosque";
export type HologramAtmosphere = "obsidian" | "crimson" | "alabaster";

export const HOLOGRAM_GRID_SIZE = 228;
export const HOLOGRAM_POINT_COUNT = HOLOGRAM_GRID_SIZE * HOLOGRAM_GRID_SIZE; // 51.984 düzenli halftone mikro-kare
export const DEFAULT_SCATTER_BOOST = 0.5;

/**
 * Düzenli halftone kafesi üzerinde parçacık başına 2. derece yay-sönümleme
 * ve balistik girdap dağılımı fizik alanı.
 */
export interface HalftoneSpringField {
  gridSize: number;
  count: number;
  worldSpan: number;
  /** Temel kafes XY koordinatları (uzunluk = count * 2) */
  baseXY: Float32Array;
  /** Parçacık başına deterministik karakter özellikleri: [curlAngle, stiffnessMul, dragMul, buoyancy] */
  traits: Float32Array;
  /** Dinamik GPU aktarım tamponu: [dx, dy, dz, energy] (uzunluk = count * 4) */
  dynOffset: Float32Array;
  /** Parçacık başına 3B hız: [vx, vy, vz] (uzunluk = count * 3) */
  velocity: Float32Array;
  /** Alandaki tepe kinetik enerji (0..1) */
  peakEnergy: number;
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v));
}

/**
 * Düzenli halftone dağılımı için parçacık başına kinetik yay-sönümleme kafesini ayırır.
 */
export function createHalftoneSpringField(
  gridSize: number = HOLOGRAM_GRID_SIZE,
  worldSpan: number = 4.1,
): HalftoneSpringField {
  const count = gridSize * gridSize;
  const baseXY = new Float32Array(count * 2);
  const traits = new Float32Array(count * 4);
  const dynOffset = new Float32Array(count * 4);
  const velocity = new Float32Array(count * 3);

  let idx = 0;
  for (let gy = 0; gy < gridSize; gy++) {
    const v = (gy + 0.5) / gridSize;
    const y = (0.5 - v) * worldSpan;
    for (let gx = 0; gx < gridSize; gx++) {
      const u = (gx + 0.5) / gridSize;
      const x = (u - 0.5) * worldSpan;

      baseXY[idx * 2] = x;
      baseXY[idx * 2 + 1] = y;

      // Organik yay geri dönüşü ve girdap dağılımı için deterministik nokta bazlı özet
      const h1 = Math.sin(gx * 12.9898 + gy * 78.233) * 43758.5453;
      const r1 = h1 - Math.floor(h1);
      const h2 = Math.sin(gx * 39.346 + gy * 11.135) * 24634.6345;
      const r2 = h2 - Math.floor(h2);
      const h3 = Math.sin(gx * 73.156 + gy * 52.235) * 19384.2341;
      const r3 = h3 - Math.floor(h3);

      traits[idx * 4] = r1 * Math.PI * 2;
      traits[idx * 4 + 1] = 0.72 + r2 * 0.62;
      traits[idx * 4 + 2] = 0.78 + r3 * 0.44;
      traits[idx * 4 + 3] = 0.35 + r1 * 0.65;

      idx++;
    }
  }

  return {
    gridSize,
    count,
    worldSpan,
    baseXY,
    traits,
    dynOffset,
    velocity,
    peakEnergy: 0,
  };
}

export interface SpringPointerInput {
  x: number;
  y: number;
  vx: number;
  vy: number;
  active: boolean;
}

/**
 * Tıklama veya dokunma anında yay kafesine dışa doğru kinetik şok dalgası uygular.
 */
export function triggerSpringShockwave(
  field: HalftoneSpringField,
  originX: number,
  originY: number,
  strength: number = 0.75,
): void {
  const { count, baseXY, traits, velocity, dynOffset } = field;
  const maxR = 2.35;
  const maxR2 = maxR * maxR;

  for (let i = 0; i < count; i++) {
    const bx = baseXY[i * 2];
    const by = baseXY[i * 2 + 1];
    const dx = bx - originX;
    const dy = by - originY;
    const d2 = dx * dx + dy * dy;
    if (d2 > maxR2) continue;

    const dist = Math.sqrt(d2) + 0.001;
    const norm = dist / maxR;
    const falloff = (1 - norm) * (1 - norm);
    const angle = traits[i * 4];
    const buoyancy = traits[i * 4 + 3];

    const radialX = dx / dist;
    const radialY = dy / dist;
    const swirlX = -radialY;
    const swirlY = radialX;

    const impulse = (3.1 + buoyancy * 1.9) * falloff * strength;
    const vIdx = i * 3;
    velocity[vIdx] += (radialX * 0.72 + swirlX * 0.32 + Math.cos(angle) * 0.42) * impulse;
    velocity[vIdx + 1] += (radialY * 0.72 + swirlY * 0.32 + Math.sin(angle) * 0.42) * impulse;
    velocity[vIdx + 2] += (0.55 + buoyancy * 0.85) * impulse * 0.85;

    const oIdx = i * 4;
    dynOffset[oIdx + 3] = Math.max(dynOffset[oIdx + 3], clamp(falloff * 1.05, 0, 1));
  }
  field.peakEnergy = Math.max(field.peakEnergy, 0.85);
}

/**
 * 51.984 parçacıklı balistik rüzgar + girdap dağılımı + elastik yay geri dönüşü adımını yürütür.
 * Boşta O(1) erken çıkış ve işaretçi çevresinde sıkı AABB budaması kullanır.
 */
export function stepHalftoneSpringField(
  field: HalftoneSpringField,
  pointer: SpringPointerInput,
  dt: number,
  scatterBoost: number = DEFAULT_SCATTER_BOOST,
  timeSec: number = 0,
  reducedMotion: boolean = false,
): number {
  const { count, baseXY, traits, dynOffset, velocity } = field;

  if (reducedMotion) {
    if (field.peakEnergy > 0) {
      dynOffset.fill(0);
      velocity.fill(0);
      field.peakEnergy = 0;
    }
    return 0;
  }

  if (!pointer.active && field.peakEnergy <= 0) {
    return 0;
  }

  const stepDt = clamp(dt, 0.001, 0.04);
  const boost = clamp(scatterBoost, 0.4, 2.0);
  const radius = 0.78 + boost * 0.44;
  const radius2 = radius * radius;
  const ptrSpeed = pointer.active ? Math.hypot(pointer.vx, pointer.vy) : 0;
  const speedNorm = clamp(ptrSpeed / 5.5, 0, 1.8);

  const baseSpringK = 24.0;
  const baseDamping = 5.4;

  let peakEnergy = 0;

  for (let i = 0; i < count; i++) {
    const oIdx = i * 4;
    let ox = dynOffset[oIdx];
    let oy = dynOffset[oIdx + 1];
    let oz = dynOffset[oIdx + 2];
    let energy = dynOffset[oIdx + 3];

    const vIdx = i * 3;
    let vx = velocity[vIdx];
    let vy = velocity[vIdx + 1];
    let vz = velocity[vIdx + 2];

    const bx = baseXY[i * 2];
    const by = baseXY[i * 2 + 1];

    let insidePointer = false;
    let pdx = 0;
    let pdy = 0;
    let dist2 = 999;

    if (pointer.active) {
      pdx = bx + ox * 0.35 - pointer.x;
      pdy = by + oy * 0.35 - pointer.y;
      if (Math.abs(pdx) < radius && Math.abs(pdy) < radius) {
        dist2 = pdx * pdx + pdy * pdy;
        if (dist2 < radius2) {
          insidePointer = true;
        }
      }
    }

    if (
      !insidePointer &&
      energy < 0.0015 &&
      vx * vx + vy * vy + vz * vz < 0.0001 &&
      ox * ox + oy * oy + oz * oz < 0.00005
    ) {
      if (energy !== 0 || ox !== 0 || oy !== 0 || oz !== 0) {
        dynOffset[oIdx] = 0;
        dynOffset[oIdx + 1] = 0;
        dynOffset[oIdx + 2] = 0;
        dynOffset[oIdx + 3] = 0;
        velocity[vIdx] = 0;
        velocity[vIdx + 1] = 0;
        velocity[vIdx + 2] = 0;
      }
      continue;
    }

    const tIdx = i * 4;
    const angle = traits[tIdx];
    const kMul = traits[tIdx + 1];
    const dMul = traits[tIdx + 2];
    const buoyancy = traits[tIdx + 3];

    if (insidePointer) {
      const dist = Math.sqrt(dist2) + 0.001;
      const norm = dist / radius;
      const falloff = (1 - norm) * (1 - norm);
      const rx = pdx / dist;
      const ry = pdy / dist;
      const tx = -ry;
      const ty = rx;

      const swirlDir = angle + timeSec * 1.85;
      const shatterX = Math.cos(swirlDir);
      const shatterY = Math.sin(swirlDir);

      // İmleç rüzgar sürüklemesi
      const windGain = (0.78 + boost * 0.45) * falloff;
      vx += pointer.vx * windGain * stepDt * 9.5;
      vy += pointer.vy * windGain * stepDt * 9.5;

      // Tanecikli halftone dağılımı + teğetsel girdap
      const burstGain = (4.2 + speedNorm * 6.8) * (0.55 + boost * 0.55) * falloff * stepDt;
      const swirlSign = angle > Math.PI ? 1 : -1;
      vx += (shatterX * 0.72 + tx * 0.48 * swirlSign + rx * 0.24) * burstGain;
      vy += (shatterY * 0.72 + ty * 0.48 * swirlSign + ry * 0.24) * burstGain;
      vz += (0.55 + buoyancy * 0.95) * burstGain * 0.65;

      energy = Math.max(energy, clamp(falloff * (0.72 + speedNorm * 0.45), 0, 1));
    }

    // 2. derece sönümlü yay parçacıkları tam kafes hücresine geri çeker
    const k = baseSpringK * kMul;
    const damp = Math.exp(-baseDamping * dMul * stepDt);

    vx = (vx - ox * k * stepDt) * damp;
    vy = (vy - oy * k * stepDt) * damp;
    vz = (vz - oz * k * 1.15 * stepDt) * damp;

    const maxV = 6.2;
    vx = clamp(vx, -maxV, maxV);
    vy = clamp(vy, -maxV, maxV);
    vz = clamp(vz, -maxV, maxV);

    ox += vx * stepDt;
    oy += vy * stepDt;
    oz += vz * stepDt;

    const dispMag = Math.hypot(ox, oy, oz * 0.65);
    const velMag = Math.hypot(vx, vy, vz * 0.65);
    const kineticEnergy = clamp(dispMag * 1.45 + velMag * 0.22, 0, 1);
    energy = Math.max(kineticEnergy, energy * Math.exp(-2.8 * stepDt));

    dynOffset[oIdx] = ox;
    dynOffset[oIdx + 1] = oy;
    dynOffset[oIdx + 2] = oz;
    dynOffset[oIdx + 3] = energy;

    velocity[vIdx] = vx;
    velocity[vIdx + 1] = vy;
    velocity[vIdx + 2] = vz;

    if (energy > peakEnergy) peakEnergy = energy;
  }

  field.peakEnergy = peakEnergy;
  return peakEnergy;
}
