// ============================================================================
// DWG/DXF MOTOR V2 — COORDINATE TRANSFORM & AFFINE MATRIX STACK (P05)
// ============================================================================
// Sözleşme: P05 — OCS, affine stack, mirrored geometri ve bounds
//
// 1. COORDINATE SPACE HARİTASI (AutoCAD DXF/DWG Standardı):
// ----------------------------------------------------------------------------
// Entity Türü     | Nokta / Özellik          | Uzay | Anlamı
// ----------------------------------------------------------------------------
// LINE            | start, end               | WCS  | Dünya koordinatı (WCS)
// CIRCLE / ARC    | center                   | OCS  | Normal N ile tanımlı OCS düzleminde
// CIRCLE / ARC    | radius                   | SCL  | Skaler yarıçap
// CIRCLE / ARC    | startAngle, endAngle     | RAD  | +Z_OCS etrafında CCW radyan açı
// LWPOLYLINE      | vertices [x, y]          | OCS  | Normal N ile tanımlı OCS düzleminde
// ELLIPSE         | center                   | WCS  | Dünya koordinatı (WCS)
// ELLIPSE         | majorAxisVector          | WCS  | Dünya koordinatı (WCS) vektörü
// ELLIPSE         | axisRatio                | SCL  | Minör / Majör skaler oranı
// SPLINE          | controlPoints            | WCS  | Dünya koordinatı (WCS)
// TEXT            | insertionPoint           | OCS  | Normal N ile tanımlı OCS (veya WCS)
// MTEXT           | insertionPoint           | WCS  | Dünya koordinatı (WCS)
// INSERT          | insertionPoint           | WCS  | AC1015+ blok ekleme noktası (WCS)
// INSERT          | scale [sx, sy, sz]       | SCL  | Blok lokal eksenlerinde ölçek
// INSERT          | rotationRad              | RAD  | Blok Z_OCS ekseni etrafında dönme
// INSERT          | extrusionDirection N     | VEC  | Blok lokal eksen yönelimi (OCS->WCS)
// HATCH           | loops [vertices/edges]   | OCS  | Hatch düzleminde OCS koordinatları
// ----------------------------------------------------------------------------
//
// 2. MATRİS KONVANSİYONU:
// - 4x4 Kolon-Vektör Konvansiyonu (Column-major Float64Array 16 eleman)
// - P_world = M_parent * M_child * P_local
// - Sütun 0: [m0, m1, m2, m3] (X ekseni)
// - Sütun 1: [m4, m5, m6, m7] (Y ekseni)
// - Sütun 2: [m8, m9, m10, m11] (Z ekseni)
// - Sütun 3: [m12, m13, m14, m15] (Öteleme T)
// ============================================================================

export type Matrix4x4 = Float64Array;

/** 2D linear transform's largest singular value (translation excluded). */
export function maxSingularValue2D(matrix: Matrix4x4): number {
  return maxSingularValue2x2(matrix[0]!, matrix[1]!, matrix[4]!, matrix[5]!);
}

/** Largest singular value for a 2×2 matrix laid out as [[a,c],[b,d]]. */
export function maxSingularValue2x2(a: number, b: number, c: number, d: number): number {
  const sumSquares = a * a + b * b + c * c + d * d;
  const determinant = a * d - b * c;
  const discriminant = Math.max(0, sumSquares * sumSquares - 4 * determinant * determinant);
  return Math.sqrt(Math.max(0, (sumSquares + Math.sqrt(discriminant)) / 2));
}

/**
 * 4x4 Birim Matris (Identity) üretir
 */
export function createIdentityMatrix(): Matrix4x4 {
  const m = new Float64Array(16);
  m[0] = 1;
  m[5] = 1;
  m[10] = 1;
  m[15] = 1;
  return m;
}

/**
 * 4x4 Öteleme (Translation) Matrisi üretir
 */
export function createTranslationMatrix(tx: number, ty: number, tz = 0): Matrix4x4 {
  const m = createIdentityMatrix();
  m[12] = tx;
  m[13] = ty;
  m[14] = tz;
  return m;
}

/**
 * 4x4 Ölçekleme (Scaling) Matrisi üretir (negatif ve non-uniform destekli)
 */
export function createScalingMatrix(sx: number, sy: number, sz = 1): Matrix4x4 {
  const m = new Float64Array(16);
  m[0] = sx;
  m[5] = sy;
  m[10] = sz;
  m[15] = 1;
  return m;
}

/**
 * Z ekseni etrafında 4x4 Döndürme (Rotation) Matrisi üretir
 */
export function createRotationZMatrix(rad: number): Matrix4x4 {
  const m = createIdentityMatrix();
  if (rad === 0) return m;
  const c = Math.cos(rad);
  const s = Math.sin(rad);
  m[0] = c;
  m[1] = s;
  m[4] = -s;
  m[5] = c;
  return m;
}

/**
 * İki 4x4 matrisi çarpar: C = A * B (Kolon-Vektör konvansiyonu)
 * Bir P vektörüne uygulandığında: C * P = A * (B * P)
 */
export function multiplyMatrix4x4(a: Matrix4x4, b: Matrix4x4): Matrix4x4 {
  const out = new Float64Array(16);

  const a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3];
  const a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7];
  const a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11];
  const a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15];

  for (let c = 0; c < 4; c++) {
    const idx = c * 4;
    const b0 = b[idx];
    const b1 = b[idx + 1];
    const b2 = b[idx + 2];
    const b3 = b[idx + 3];

    out[idx] = a00 * b0 + a10 * b1 + a20 * b2 + a30 * b3;
    out[idx + 1] = a01 * b0 + a11 * b1 + a21 * b2 + a31 * b3;
    out[idx + 2] = a02 * b0 + a12 * b1 + a22 * b2 + a32 * b3;
    out[idx + 3] = a03 * b0 + a13 * b1 + a23 * b2 + a33 * b3;
  }

  return out;
}

/**
 * Autodesk Arbitrary Axis Algorithm (Keyfî Eksen Algoritması)
 * Verilen normal vektöründen (extrusion vector) OCS -> WCS dönüşüm matrisini üretir.
 *
 * Eşik kuralı: (abs(Nx) < 1/64) && (abs(Ny) < 1/64)
 *   ise Ay = [0, 1, 0]; Wx = Ay x Wz
 *   aksi takdirde Az = [0, 0, 1]; Wx = Az x Wz
 * Wy = Wz x Wx
 */
export function arbitraryAxisMatrix(
  normal?: [number, number, number] | { x: number; y: number; z?: number }
): Matrix4x4 {
  if (!normal) {
    return createIdentityMatrix();
  }

  let nx = 0, ny = 0, nz = 1;
  if (Array.isArray(normal)) {
    nx = normal[0] || 0;
    ny = normal[1] || 0;
    nz = normal[2] ?? 1;
  } else if (typeof normal === "object") {
    nx = normal.x || 0;
    ny = normal.y || 0;
    nz = normal.z ?? 1;
  }

  // Finite ve sıfır uzunluk doğrulaması
  if (!Number.isFinite(nx) || !Number.isFinite(ny) || !Number.isFinite(nz)) {
    return createIdentityMatrix();
  }

  const len = Math.hypot(nx, ny, nz);
  if (len < 1e-6) {
    // Bozuk / sıfır normal [0, 0, 0] -> güvenli varsayılan [0, 0, 1]
    return createIdentityMatrix();
  }

  // Normalleştir
  nx /= len;
  ny /= len;
  nz /= len;

  // Varsayılan +Z ekseni [0, 0, 1] ise doğrudan identity dön
  if (Math.abs(nx) < 1e-9 && Math.abs(ny) < 1e-9 && Math.abs(nz - 1) < 1e-9) {
    return createIdentityMatrix();
  }

  const wz: [number, number, number] = [nx, ny, nz];
  let wx: [number, number, number];

  // 1/64 = 0.015625 eşiği
  const THRESHOLD = 1 / 64;
  if (Math.abs(nx) < THRESHOLD && Math.abs(ny) < THRESHOLD) {
    // Ay = [0, 1, 0] ile çapraz çarpım: Wx = Ay x Wz = [1*nz - 0*ny, 0*nx - 0*nz, 0*ny - 1*nx]
    const crossX = nz;
    const crossY = 0;
    const crossZ = -nx;
    const l = Math.hypot(crossX, crossY, crossZ);
    wx = [crossX / l, crossY / l, crossZ / l];
  } else {
    // Az = [0, 0, 1] ile çapraz çarpım: Wx = Az x Wz = [0*nz - 1*ny, 1*nx - 0*nz, 0*ny - 0*nx]
    const crossX = -ny;
    const crossY = nx;
    const crossZ = 0;
    const l = Math.hypot(crossX, crossY, crossZ);
    wx = [crossX / l, crossY / l, crossZ / l];
  }

  // Wy = Wz x Wx = [wz1*wx2 - wz2*wx1, wz2*wx0 - wz0*wx2, wz0*wx1 - wz1*wx0]
  const wyX = wz[1] * wx[2] - wz[2] * wx[1];
  const wyY = wz[2] * wx[0] - wz[0] * wx[2];
  const wyZ = wz[0] * wx[1] - wz[1] * wx[0];
  const lWy = Math.hypot(wyX, wyY, wyZ);
  const wy: [number, number, number] = [wyX / lWy, wyY / lWy, wyZ / lWy];

  // Matrisi oluştur (Kolon-major)
  const m = createIdentityMatrix();
  // Sütun 0: Wx
  m[0] = wx[0];
  m[1] = wx[1];
  m[2] = wx[2];
  // Sütun 1: Wy
  m[4] = wy[0];
  m[5] = wy[1];
  m[6] = wy[2];
  // Sütun 2: Wz
  m[8] = wz[0];
  m[9] = wz[1];
  m[10] = wz[2];

  return m;
}

/**
 * 2D bir noktayı 4x4 matrisle dönüştürür (Z=0 kabul edilir, projeksiyon XY)
 */
export function transformPoint2D(m: Matrix4x4, p: [number, number]): [number, number] {
  const x = p[0];
  const y = p[1];
  const rx = m[0] * x + m[4] * y + m[12];
  const ry = m[1] * x + m[5] * y + m[13];
  return [rx, ry];
}

/**
 * 3D bir noktayı 4x4 matrisle dönüştürür
 */
export function transformPoint3D(
  m: Matrix4x4,
  p: [number, number, number]
): [number, number, number] {
  const x = p[0], y = p[1], z = p[2];
  const rx = m[0] * x + m[4] * y + m[8] * z + m[12];
  const ry = m[1] * x + m[5] * y + m[9] * z + m[13];
  const rz = m[2] * x + m[6] * y + m[10] * z + m[14];
  return [rx, ry, rz];
}

/**
 * Bir vektörü dönüştürür (öteleme uygulanmaz, yalnızca rotasyon/ölçek)
 */
export function transformVector3D(
  m: Matrix4x4,
  v: [number, number, number]
): [number, number, number] {
  const x = v[0], y = v[1], z = v[2];
  const rx = m[0] * x + m[4] * y + m[8] * z;
  const ry = m[1] * x + m[5] * y + m[9] * z;
  const rz = m[2] * x + m[6] * y + m[10] * z;
  return [rx, ry, rz];
}

export interface InsertTransformParams {
  insertionPoint: [number, number] | [number, number, number];
  scale?: [number, number, number];
  rotationRad?: number;
  extrusionDirection?: [number, number, number];
  basePoint?: [number, number] | [number, number, number];
}

/**
 * Bir INSERT varlığının tam 4x4 dönüşüm matrisini hesaplar:
 * M = T(insertion) * B_OCS * Rz(rot) * S(scale) * T(-basePoint)
 */
export function computeInsertMatrix(params: InsertTransformParams): Matrix4x4 {
  const bx = params.basePoint ? params.basePoint[0] || 0 : 0;
  const by = params.basePoint ? params.basePoint[1] || 0 : 0;
  const bz = params.basePoint && params.basePoint[2] != null ? params.basePoint[2] : 0;

  const ix = params.insertionPoint[0] || 0;
  const iy = params.insertionPoint[1] || 0;
  const iz = params.insertionPoint[2] != null ? params.insertionPoint[2] : 0;

  const sx = params.scale ? params.scale[0] : 1;
  const sy = params.scale ? params.scale[1] : 1;
  const sz = params.scale ? params.scale[2] : 1;

  const rot = params.rotationRad || 0;

  // 1. T(-basePoint)
  const mNegBase = createTranslationMatrix(-bx, -by, -bz);

  // 2. S(scale)
  const mScale = createScalingMatrix(sx, sy, sz);

  // 3. Rz(rot)
  const mRot = createRotationZMatrix(rot);

  // 4. B_OCS (Arbitrary Axis Algorithm)
  const mOcs = arbitraryAxisMatrix(params.extrusionDirection);

  // 5. T(insertion)
  const mPos = createTranslationMatrix(ix, iy, iz);

  // Sırayla çarp: T(pos) * B_OCS * Rz(rot) * S(scale) * T(-base)
  const m1 = multiplyMatrix4x4(mScale, mNegBase);
  const m2 = multiplyMatrix4x4(mRot, m1);
  const m3 = multiplyMatrix4x4(mOcs, m2);
  const mFinal = multiplyMatrix4x4(mPos, m3);

  return mFinal;
}
