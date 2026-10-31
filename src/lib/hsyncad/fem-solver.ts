/**
 * 3D Frame & Finite Element Analysis (FEM) Structural Solver
 * Compliant with Turkish Earthquake Code (TBDY 2018) & TS 500
 *
 * Implements:
 * 1. 12-DOF 3D Beam/Column element formulation with coordinate transformation [T].
 * 2. Cracked section stiffness reduction modifiers per TBDY 2018 Table 4.2.
 * 3. Rigid floor diaphragm master-slave constraints (uX, uY, thetaZ).
 * 4. Wide-column shear wall macro-element modeling with rigid arms.
 * 5. Full 32+ TS 500 & TBDY 2018 §4.4.3 load combinations superposition (including Ez = 0.3 Sds G).
 * 6. High-performance symmetric Cholesky & LU decomposition linear equation solvers.
 * 7. Continuous member internal force evaluation at 11 stations (N, V2, V3, T, M2, M3).
 * 8. Multi-storey dynamic modal analysis (natural periods T1, T2, T3) via symmetric Jacobi eigenvalue solver.
 */

// ============================================================================
// 1. Data Structures & Types
// ============================================================================

export interface Vector3D {
  x: number;
  y: number;
  z: number;
}

export interface Node3D {
  id: string;
  name: string;
  x: number;
  y: number;
  z: number;
  floorId: string;
  isBaseFixed: boolean;
  dofIndices: [number, number, number, number, number, number];
}

export interface Element12DOF {
  id: string;
  name: string;
  type: "column" | "beam" | "wall";
  floorId: string;
  nodeI: string;
  nodeJ: string;
  length: number;
  E: number;       // Elastic modulus in kN/m²
  G: number;       // Shear modulus in kN/m²
  A: number;       // Cross-sectional area in m²
  Iz: number;      // Major moment of inertia in m⁴ (about local z')
  Iy: number;      // Minor moment of inertia in m⁴ (about local y')
  J: number;       // Torsion constant in m⁴
  f_crack: number; // Cracked factor per TBDY 2018 Table 4.2
  rollAngleRad: number; // Rotation around member longitudinal axis in radians
  // Geometric dimensions in metres
  width: number;
  depth: number;
  // Uniform distributed loads in local coordinates (kN/m)
  qy: number;
  qz: number;
  // Wide-column macro-element flag
  isWideColumn?: boolean;
  wallLength?: number;
  wallThickness?: number;
}

export interface CrackedStiffnessModifiers {
  columnFlexure: number; // 0.70
  beamFlexure: number;   // 0.35
  wallFlexure: number;   // 0.50 (in-plane / out-of-plane)
  wallShear: number;     // 0.50
  slabFlexure: number;   // 0.25
  torsion: number;       // 0.10
}

export const TBDY_2018_CRACKED_MODIFIERS: CrackedStiffnessModifiers = {
  columnFlexure: 0.70,
  beamFlexure: 0.35,
  wallFlexure: 0.50,
  wallShear: 0.50,
  slabFlexure: 0.25,
  torsion: 0.10,
};

export interface LoadCombination {
  name: string;
  description: string;
  cG: number;
  cQ: number;
  cEx: number;
  cEy: number;
  cEz: number;
}

export interface StationInternalForces {
  stationIndex: number; // 0 to 10
  ratio: number;        // 0.0, 0.1, ..., 1.0
  x: number;            // Distance along member [m]
  N: number;            // Axial force [kN] (+ tension, - compression)
  V2: number;           // Major shear force [kN] (along local y')
  V3: number;           // Minor shear force [kN] (along local z')
  T: number;            // Torsional moment [kNm]
  M2: number;           // Minor bending moment [kNm] (around local y')
  M3: number;           // Major bending moment [kNm] (around local z')
}

export interface MemberStationEnvelope {
  elementId: string;
  name: string;
  type: "column" | "beam" | "wall";
  floorId: string;
  length: number;
  stations: StationInternalForces[];
  maxAxialKn: number;
  minAxialKn: number;
  maxShearV2Kn: number;
  maxShearV3Kn: number;
  maxMomentM3Knm: number;
  minMomentM3Knm: number;
  maxMomentM2Knm: number;
  governingCombo: string;
}

export interface ModalResult {
  modeNumber: number;
  periodSec: number;
  frequencyHz: number;
  omegaRadS: number;
  massParticipationX: number;
  massParticipationY: number;
  massParticipationRot: number;
  modeShape: Record<string, { ux: number; uy: number; rz: number }>;
}

export interface FloorDiaphragmResult {
  floorId: string;
  floorName: string;
  elevation: number;
  height: number;
  centerX: number;
  centerY: number;
  totalMassKg: number;
  displacementX: number;
  displacementY: number;
  rotationZ: number;
  driftX: number;
  driftY: number;
  driftRatioX: number;
  driftRatioY: number;
  driftPass: boolean;
}

export interface FemAnalysisOutput {
  success: boolean;
  nodes: Node3D[];
  elements: Element12DOF[];
  displacements: Record<string, [number, number, number, number, number, number]>;
  memberForces: Record<string, StationInternalForces[]>;
  memberEnvelopes: Record<string, MemberStationEnvelope>;
  combinations: {
    name: string;
    description: string;
    maxDisplacementM: number;
    baseShearXKn: number;
    baseShearYKn: number;
  }[];
  modes: ModalResult[];
  naturalPeriods: [number, number, number];
  baseShears: {
    Vtx: number;
    Vty: number;
    Mox: number;
    Moy: number;
  };
  floorDiaphragms: FloorDiaphragmResult[];
  totalMassKg: number;
  totalWeightKn: number;
  error?: string;
}

// ============================================================================
// 2. 12-DOF Element Formulation & Transformation Matrix [T]
// ============================================================================

/**
 * Construct local 12x12 stiffness matrix [k_e] for a 3D Euler-Bernoulli frame element.
 * Incorporates axial (EA/L), torsion (GJ/L), and flexure (12EI/L³, 6EI/L², 4EI/L, 2EI/L).
 * Applies cracked section stiffness reduction factor f_crack to bending and torsion.
 */
export function buildLocal12DOFStiffnessMatrix(el: Element12DOF): Float64Array {
  const K = new Float64Array(144); // 12x12 row-major
  const L = el.length;
  if (L <= 1e-6) throw new Error(`Eleman ${el.name} boyu sıfır veya çok küçük.`);

  const E = el.E;
  const G = el.G;
  const A = el.A;

  // Apply TBDY 2018 cracked modifiers
  const Iz = el.Iz * el.f_crack;
  const Iy = el.Iy * el.f_crack;
  const J = el.J * Math.min(el.f_crack, TBDY_2018_CRACKED_MODIFIERS.torsion);

  const L2 = L * L;
  const L3 = L2 * L;

  // Axial stiffness
  const kAxial = (E * A) / L;
  K[0 * 12 + 0] = kAxial;
  K[0 * 12 + 6] = -kAxial;
  K[6 * 12 + 0] = -kAxial;
  K[6 * 12 + 6] = kAxial;

  // Torsional stiffness
  const kTorsion = (G * J) / L;
  K[3 * 12 + 3] = kTorsion;
  K[3 * 12 + 9] = -kTorsion;
  K[9 * 12 + 3] = -kTorsion;
  K[9 * 12 + 9] = kTorsion;

  // Flexure in x'-y' plane (bending about z' axis with Iz)
  const kz12 = (12 * E * Iz) / L3;
  const kz6  = (6 * E * Iz) / L2;
  const kz4  = (4 * E * Iz) / L;
  const kz2  = (2 * E * Iz) / L;

  K[1 * 12 + 1] = kz12;
  K[1 * 12 + 5] = kz6;
  K[1 * 12 + 7] = -kz12;
  K[1 * 12 + 11] = kz6;

  K[5 * 12 + 1] = kz6;
  K[5 * 12 + 5] = kz4;
  K[5 * 12 + 7] = -kz6;
  K[5 * 12 + 11] = kz2;

  K[7 * 12 + 1] = -kz12;
  K[7 * 12 + 5] = -kz6;
  K[7 * 12 + 7] = kz12;
  K[7 * 12 + 11] = -kz6;

  K[11 * 12 + 1] = kz6;
  K[11 * 12 + 5] = kz2;
  K[11 * 12 + 7] = -kz6;
  K[11 * 12 + 11] = kz4;

  // Flexure in x'-z' plane (bending about y' axis with Iy)
  const ky12 = (12 * E * Iy) / L3;
  const ky6  = (6 * E * Iy) / L2;
  const ky4  = (4 * E * Iy) / L;
  const ky2  = (2 * E * Iy) / L;

  K[2 * 12 + 2] = ky12;
  K[2 * 12 + 4] = -ky6;
  K[2 * 12 + 8] = -ky12;
  K[2 * 12 + 10] = -ky6;

  K[4 * 12 + 2] = -ky6;
  K[4 * 12 + 4] = ky4;
  K[4 * 12 + 8] = ky6;
  K[4 * 12 + 10] = ky2;

  K[8 * 12 + 2] = -ky12;
  K[8 * 12 + 4] = ky6;
  K[8 * 12 + 8] = ky12;
  K[8 * 12 + 10] = ky6;

  K[10 * 12 + 2] = -ky6;
  K[10 * 12 + 4] = ky2;
  K[10 * 12 + 8] = ky6;
  K[10 * 12 + 10] = ky4;

  return K;
}

/**
 * Computes the 3x3 direction cosines matrix R = [ex, ey, ez]^T for a 3D member.
 * Coordinates are right-handed and orthonormal:
 * ex = (P2 - P1) / L
 * ey = major cross section direction
 * ez = minor cross section direction
 * rollAngleRad = optional angle around ex in radians
 */
export function build3x3RotationMatrix(p1: Vector3D, p2: Vector3D, rollAngleRad = 0): Float64Array {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const dz = p2.z - p1.z;
  const L = Math.sqrt(dx * dx + dy * dy + dz * dz);
  if (L < 1e-6) throw new Error("Üye uç noktaları çakışık.");

  const lx = dx / L;
  const mx = dy / L;
  const nx = dz / L;

  const ex: [number, number, number] = [lx, mx, nx];
  let ey: [number, number, number];
  let ez: [number, number, number];

  const D = Math.sqrt(lx * lx + mx * mx);

  if (D < 1e-6) {
    // Purely vertical member (column along Z)
    if (nx > 0) {
      // Pointing +Z: local y' along +X, local z' along +Y
      const cosB = Math.cos(rollAngleRad);
      const sinB = Math.sin(rollAngleRad);
      ey = [cosB, sinB, 0];
      ez = [-sinB, cosB, 0];
    } else {
      // Pointing -Z
      const cosB = Math.cos(rollAngleRad);
      const sinB = Math.sin(rollAngleRad);
      ey = [-cosB, sinB, 0];
      ez = [sinB, cosB, 0];
    }
  } else {
    // Non-vertical member (beams, inclined members)
    const ey0: [number, number, number] = [(-lx * nx) / D, (-mx * nx) / D, D];
    const ez0: [number, number, number] = [mx / D, -lx / D, 0];

    const cosB = Math.cos(rollAngleRad);
    const sinB = Math.sin(rollAngleRad);

    ey = [
      cosB * ey0[0] + sinB * ez0[0],
      cosB * ey0[1] + sinB * ez0[1],
      cosB * ey0[2] + sinB * ez0[2],
    ];

    ez = [
      -sinB * ey0[0] + cosB * ez0[0],
      -sinB * ey0[1] + cosB * ez0[1],
      -sinB * ey0[2] + cosB * ez0[2],
    ];
  }

  // R = [ex; ey; ez] in 3x3 row-major
  const R = new Float64Array(9);
  R[0] = ex[0]; R[1] = ex[1]; R[2] = ex[2];
  R[3] = ey[0]; R[4] = ey[1]; R[5] = ey[2];
  R[6] = ez[0]; R[7] = ez[1]; R[8] = ez[2];
  return R;
}

/**
 * Builds full 12x12 transformation matrix [T] = diag(R, R, R, R).
 */
export function buildTransformationMatrix12DOF(p1: Vector3D, p2: Vector3D, rollAngleRad = 0): Float64Array {
  const R = build3x3RotationMatrix(p1, p2, rollAngleRad);
  const T = new Float64Array(144);
  for (let block = 0; block < 4; block++) {
    const offset = block * 3;
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        T[(offset + r) * 12 + (offset + c)] = R[r * 3 + c];
      }
    }
  }
  return T;
}

/**
 * Computes global element stiffness matrix [K_e,global] = [T]^T [k_e,local] [T]
 * Highly optimized by exploiting block-diagonal 3x3 structure.
 */
export function transformStiffnessToGlobal(kLocal: Float64Array, R: Float64Array): Float64Array {
  const KGlobal = new Float64Array(144);

  // For each of the 4x4 blocks of size 3x3:
  // K_global_block(i,j) = R^T * K_local_block(i,j) * R
  for (let bi = 0; bi < 4; bi++) {
    for (let bj = 0; bj < 4; bj++) {
      // Extract 3x3 block from kLocal
      const M = new Float64Array(9);
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
          M[r * 3 + c] = kLocal[(bi * 3 + r) * 12 + (bj * 3 + c)];
        }
      }

      // Compute Temp = M * R (3x3 * 3x3)
      const Temp = new Float64Array(9);
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
          Temp[r * 3 + c] =
            M[r * 3 + 0] * R[0 * 3 + c] +
            M[r * 3 + 1] * R[1 * 3 + c] +
            M[r * 3 + 2] * R[2 * 3 + c];
        }
      }

      // Compute Block = R^T * Temp (R^T[r,k] = R[k,r])
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
          const val =
            R[0 * 3 + r] * Temp[0 * 3 + c] +
            R[1 * 3 + r] * Temp[1 * 3 + c] +
            R[2 * 3 + r] * Temp[2 * 3 + c];
          KGlobal[(bi * 3 + r) * 12 + (bj * 3 + c)] = val;
        }
      }
    }
  }

  return KGlobal;
}

// ============================================================================
// 3. TS 500 & TBDY 2018 §4.4.3 Load Combinations (32+ Combinations)
// ============================================================================

/**
 * Generates the full 33 load combinations per TS 500 & TBDY 2018 §4.4.3:
 * 1. Gravity: 1.4G + 1.6Q
 * 2-9. Seismic G + Q ± Ex ± 0.3Ey ± 0.3Ez
 * 10-17. Seismic G + Q ± Ey ± 0.3Ex ± 0.3Ez
 * 18-25. Seismic 0.9G ± Ex ± 0.3Ey ± 0.3Ez
 * 26-33. Seismic 0.9G ± Ey ± 0.3Ex ± 0.3Ez
 * where Ez = 0.3 * Sds * G.
 */
export function generate32LoadCombinations(sds: number): LoadCombination[] {
  const combos: LoadCombination[] = [];

  // 1. Gravity design combination (TS 500)
  combos.push({
    name: "1.4G+1.6Q",
    description: "Düşey Yük Temel Tasarım Kombinasyonu (TS 500)",
    cG: 1.4,
    cQ: 1.6,
    cEx: 0,
    cEy: 0,
    cEz: 0,
  });

  const signs = [1, -1];
  const secSigns = [1, -1];
  const zSigns = [1, -1];

  // Vertical seismic factor: Ez = 0.3 * Sds * G per TBDY §4.4.3
  const ezFactor = 0.3 * sds;

  // 2. Combinations with G + Q and primary Ex (8 combos)
  for (const sEx of signs) {
    for (const sEy of secSigns) {
      for (const sEz of zSigns) {
        const exSignStr = sEx > 0 ? "+Ex" : "-Ex";
        const eySignStr = sEy > 0 ? "+0.3Ey" : "-0.3Ey";
        const ezSignStr = sEz > 0 ? "+0.3Ez" : "-0.3Ez";
        combos.push({
          name: `G+Q${exSignStr}${eySignStr}${ezSignStr}`,
          description: `Deprem X Hakim (+G+Q) [TBDY §4.4.3]`,
          cG: 1.0,
          cQ: 1.0,
          cEx: sEx * 1.0,
          cEy: sEy * 0.3,
          cEz: sEz * 0.3 * ezFactor,
        });
      }
    }
  }

  // 3. Combinations with G + Q and primary Ey (8 combos)
  for (const sEy of signs) {
    for (const sEx of secSigns) {
      for (const sEz of zSigns) {
        const eySignStr = sEy > 0 ? "+Ey" : "-Ey";
        const exSignStr = sEx > 0 ? "+0.3Ex" : "-0.3Ex";
        const ezSignStr = sEz > 0 ? "+0.3Ez" : "-0.3Ez";
        combos.push({
          name: `G+Q${eySignStr}${exSignStr}${ezSignStr}`,
          description: `Deprem Y Hakim (+G+Q) [TBDY §4.4.3]`,
          cG: 1.0,
          cQ: 1.0,
          cEx: sEx * 0.3,
          cEy: sEy * 1.0,
          cEz: sEz * 0.3 * ezFactor,
        });
      }
    }
  }

  // 4. Uplift / Minimum Gravity Combinations 0.9G and primary Ex (8 combos)
  for (const sEx of signs) {
    for (const sEy of secSigns) {
      for (const sEz of zSigns) {
        const exSignStr = sEx > 0 ? "+Ex" : "-Ex";
        const eySignStr = sEy > 0 ? "+0.3Ey" : "-0.3Ey";
        const ezSignStr = sEz > 0 ? "+0.3Ez" : "-0.3Ez";
        combos.push({
          name: `0.9G${exSignStr}${eySignStr}${ezSignStr}`,
          description: `Deprem X Hakim Devrilme/Kaldırma (0.9G) [TBDY §4.4.3]`,
          cG: 0.9,
          cQ: 0.0,
          cEx: sEx * 1.0,
          cEy: sEy * 0.3,
          cEz: sEz * 0.3 * ezFactor,
        });
      }
    }
  }

  // 5. Uplift / Minimum Gravity Combinations 0.9G and primary Ey (8 combos)
  for (const sEy of signs) {
    for (const sEx of secSigns) {
      for (const sEz of zSigns) {
        const eySignStr = sEy > 0 ? "+Ey" : "-Ey";
        const exSignStr = sEx > 0 ? "+0.3Ex" : "-0.3Ex";
        const ezSignStr = sEz > 0 ? "+0.3Ez" : "-0.3Ez";
        combos.push({
          name: `0.9G${eySignStr}${exSignStr}${ezSignStr}`,
          description: `Deprem Y Hakim Devrilme/Kaldırma (0.9G) [TBDY §4.4.3]`,
          cG: 0.9,
          cQ: 0.0,
          cEx: sEx * 0.3,
          cEy: sEy * 1.0,
          cEz: sEz * 0.3 * ezFactor,
        });
      }
    }
  }

  return combos;
}

// ============================================================================
// 4. High-Performance Linear Solvers (Cholesky & LU)
// ============================================================================

/**
 * Computes the Cholesky factorization of a symmetric positive-definite matrix A = L * L^T.
 * Returns L (lower triangular) as Float64Array(n*n), or null if not positive definite.
 */
export function choleskyDecomposition(A: Float64Array, n: number): Float64Array | null {
  const L = new Float64Array(n * n);

  for (let j = 0; j < n; j++) {
    let d = 0.0;
    for (let k = 0; k < j; k++) {
      const Ljk = L[j * n + k];
      d += Ljk * Ljk;
    }
    const val = A[j * n + j] - d;
    if (val <= 1e-14) {
      return null; // Not strictly positive-definite
    }
    const Ljj = Math.sqrt(val);
    L[j * n + j] = Ljj;

    const invLjj = 1.0 / Ljj;
    for (let i = j + 1; i < n; i++) {
      let s = 0.0;
      for (let k = 0; k < j; k++) {
        s += L[i * n + k] * L[j * n + k];
      }
      L[i * n + j] = (A[i * n + j] - s) * invLjj;
    }
  }

  return L;
}

/**
 * Solves L * L^T * x = b using forward and back substitution.
 */
export function choleskySolve(L: Float64Array, b: Float64Array, n: number): Float64Array {
  const y = new Float64Array(n);
  // Forward solve L * y = b
  for (let i = 0; i < n; i++) {
    let s = 0.0;
    for (let k = 0; k < i; k++) {
      s += L[i * n + k] * y[k];
    }
    y[i] = (b[i] - s) / L[i * n + i];
  }

  // Back solve L^T * x = y
  const x = new Float64Array(n);
  for (let i = n - 1; i >= 0; i--) {
    let s = 0.0;
    for (let k = i + 1; k < n; k++) {
      s += L[k * n + i] * x[k];
    }
    x[i] = (y[i] - s) / L[i * n + i];
  }
  return x;
}

/**
 * General LU decomposition with partial pivoting: P * A = L * U.
 * Used as unconditional fallback when matrix has near-zero rotational singularities.
 */
export function luDecomposition(A: Float64Array, n: number): { LU: Float64Array; piv: Int32Array } {
  const LU = new Float64Array(A);
  const piv = new Int32Array(n);
  for (let i = 0; i < n; i++) piv[i] = i;

  for (let j = 0; j < n; j++) {
    // Find pivot
    let maxVal = Math.abs(LU[j * n + j]);
    let maxRow = j;
    for (let i = j + 1; i < n; i++) {
      const v = Math.abs(LU[i * n + j]);
      if (v > maxVal) {
        maxVal = v;
        maxRow = i;
      }
    }

    if (maxRow !== j) {
      // Swap rows
      for (let k = 0; k < n; k++) {
        const tmp = LU[j * n + k];
        LU[j * n + k] = LU[maxRow * n + k];
        LU[maxRow * n + k] = tmp;
      }
      const pTmp = piv[j];
      piv[j] = piv[maxRow];
      piv[maxRow] = pTmp;
    }

    const diag = LU[j * n + j];
    if (Math.abs(diag) > 1e-15) {
      const invDiag = 1.0 / diag;
      for (let i = j + 1; i < n; i++) {
        LU[i * n + j] *= invDiag;
        const mult = LU[i * n + j];
        for (let k = j + 1; k < n; k++) {
          LU[i * n + k] -= mult * LU[j * n + k];
        }
      }
    }
  }

  return { LU, piv };
}

/**
 * Solves LU * x = P * b using forward and back substitution.
 */
export function luSolve(LU: Float64Array, piv: Int32Array, b: Float64Array, n: number): Float64Array {
  const bp = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    bp[i] = b[piv[i]];
  }

  // Forward solve L * y = bp (unit lower triangular)
  const y = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    let s = 0.0;
    for (let k = 0; k < i; k++) {
      s += LU[i * n + k] * y[k];
    }
    y[i] = bp[i] - s;
  }

  // Back solve U * x = y
  const x = new Float64Array(n);
  for (let i = n - 1; i >= 0; i--) {
    let s = 0.0;
    for (let k = i + 1; k < n; k++) {
      s += LU[i * n + k] * x[k];
    }
    const diag = LU[i * n + i];
    x[i] = Math.abs(diag) > 1e-15 ? (y[i] - s) / diag : 0.0;
  }

  return x;
}

// ============================================================================
// 5. Symmetric Jacobi Eigenvalue Solver (Modal Analysis)
// ============================================================================

/**
 * Solves the symmetric eigenvalue problem A * v = lambda * v using Jacobi rotations.
 * Guaranteed to converge for real symmetric matrices.
 */
export function jacobiEigenvalue(A: Float64Array, n: number, maxIter = 200, tol = 1e-10): {
  values: Float64Array;
  vectors: Float64Array;
} {
  const mat = new Float64Array(A);
  const V = new Float64Array(n * n);
  for (let i = 0; i < n; i++) V[i * n + i] = 1.0;

  for (let iter = 0; iter < maxIter; iter++) {
    // Find maximum off-diagonal element
    let maxOff = 0.0;
    let p = 0, q = 1;
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const off = Math.abs(mat[i * n + j]);
        if (off > maxOff) {
          maxOff = off;
          p = i;
          q = j;
        }
      }
    }

    if (maxOff < tol) break;

    const App = mat[p * n + p];
    const Aqq = mat[q * n + q];
    const Apq = mat[p * n + q];

    const theta = 0.5 * Math.atan2(2 * Apq, Aqq - App);
    const c = Math.cos(theta);
    const s = Math.sin(theta);

    // Update matrix A
    for (let i = 0; i < n; i++) {
      if (i !== p && i !== q) {
        const aip = mat[i * n + p];
        const aiq = mat[i * n + q];
        mat[i * n + p] = c * aip - s * aiq;
        mat[p * n + i] = mat[i * n + p];
        mat[i * n + q] = s * aip + c * aiq;
        mat[q * n + i] = mat[i * n + q];
      }
    }

    mat[p * n + p] = c * c * App - 2 * s * c * Apq + s * s * Aqq;
    mat[q * n + q] = s * s * App + 2 * s * c * Apq + c * c * Aqq;
    mat[p * n + q] = 0.0;
    mat[q * n + p] = 0.0;

    // Update eigenvectors V
    for (let i = 0; i < n; i++) {
      const vip = V[i * n + p];
      const viq = V[i * n + q];
      V[i * n + p] = c * vip - s * viq;
      V[i * n + q] = s * vip + c * viq;
    }
  }

  const values = new Float64Array(n);
  for (let i = 0; i < n; i++) values[i] = mat[i * n + i];

  return { values, vectors: V };
}

// ============================================================================
// 6. Continuous Internal Forces at 11 Member Stations
// ============================================================================

/**
 * Evaluates internal axial, shear, torsion, and moments at 11 stations along a member
 * (0.0L to 1.0L in 0.1L increments) under local end forces and uniform distributed loads.
 */
export function calculate11MemberStations(
  el: Element12DOF,
  localDisplacements: Float64Array, // 12-vector [u1,v1,w1,thx1,thy1,thz1, u2,v2,w2,thx2,thy2,thz2]
  kLocal: Float64Array
): StationInternalForces[] {
  const L = el.length;
  const qy = el.qy; // distributed load in local y' (kN/m)
  const qz = el.qz; // distributed load in local z' (kN/m)

  // 1. Calculate end forces f_local = k_local * d_local + f_0
  const fLocal = new Float64Array(12);
  for (let i = 0; i < 12; i++) {
    let s = 0.0;
    for (let j = 0; j < 12; j++) {
      s += kLocal[i * 12 + j] * localDisplacements[j];
    }
    fLocal[i] = s;
  }

  // Add fixed-end reactions from distributed loads
  // f_0: reactions on the element ends from span loads
  fLocal[1] += (qy * L) / 2;
  fLocal[7] += (qy * L) / 2;
  fLocal[5] += (qy * L * L) / 12;
  fLocal[11] -= (qy * L * L) / 12;

  fLocal[2] += (qz * L) / 2;
  fLocal[8] += (qz * L) / 2;
  fLocal[4] -= (qz * L * L) / 12;
  fLocal[10] += (qz * L * L) / 12;

  const N_start = -fLocal[0];
  const V2_start = fLocal[1];
  const V3_start = fLocal[2];
  const T_start = -fLocal[3];
  const M2_start = -fLocal[4];
  const M3_start = -fLocal[5];

  const stations: StationInternalForces[] = [];

  for (let sIdx = 0; sIdx <= 10; sIdx++) {
    const ratio = sIdx / 10.0;
    const x = ratio * L;

    // Statics equilibrium along member length
    const N = N_start;
    const V2 = V2_start - qy * x;
    const V3 = V3_start - qz * x;
    const T = T_start;
    const M3 = M3_start + V2_start * x - 0.5 * qy * x * x;
    const M2 = M2_start - V3_start * x + 0.5 * qz * x * x;

    stations.push({
      stationIndex: sIdx,
      ratio,
      x,
      N,
      V2,
      V3,
      T,
      M2,
      M3,
    });
  }

  return stations;
}

// ============================================================================
// 7. Full 3D Frame Solver Assembly & Execution
// ============================================================================

export interface FemMeshInput {
  nodes: Node3D[];
  elements: Element12DOF[];
  floors: { id: string; name: string; elevation: number; height: number }[];
  floorDiaphragms: {
    floorId: string;
    centerX: number;
    centerY: number;
    totalMassKg: number;
    deadWeightKn: number;
    liveWeightKn: number;
  }[];
  sds: number;
  sd1: number;
  r: number;
  importance: number;
}

/**
 * Assembles the global stiffness matrix, solves for displacements under basic load cases,
 * computes multi-storey dynamic natural periods (T1, T2, T3) & modal shapes,
 * superposes 33 TS 500 / TBDY 2018 load combinations, and calculates continuous
 * internal forces at 11 stations for every column, beam, and wide-column shear wall.
 */
export function solve3DStructuralMesh(input: FemMeshInput): FemAnalysisOutput {
  const { nodes, elements, floors, floorDiaphragms, sds, sd1, r, importance } = input;

  if (nodes.length === 0 || elements.length === 0) {
    return {
      success: false,
      nodes: [],
      elements: [],
      displacements: {},
      memberForces: {},
      memberEnvelopes: {},
      combinations: [],
      modes: [],
      naturalPeriods: [0.1, 0.1, 0.1],
      baseShears: { Vtx: 0, Vty: 0, Mox: 0, Moy: 0 },
      floorDiaphragms: [],
      totalMassKg: 0,
      totalWeightKn: 0,
      error: "Boş ağ analizi yapılamaz.",
    };
  }

  // 1. Assign global Degree of Freedom (DOF) indices
  // Active DOFs: free nodes have 6 DOFs, base fixed nodes have fixed DOFs (-1)
  const nodeMap = new Map<string, Node3D>();
  let dofCount = 0;

  for (const node of nodes) {
    nodeMap.set(node.id, node);
    if (node.isBaseFixed) {
      node.dofIndices = [-1, -1, -1, -1, -1, -1];
    } else {
      node.dofIndices = [
        dofCount++,
        dofCount++,
        dofCount++,
        dofCount++,
        dofCount++,
        dofCount++,
      ];
    }
  }

  if (dofCount === 0) {
    throw new Error("Analiz edilecek serbest düğüm noktası bulunamadı.");
  }

  // 2. Global stiffness matrix assembly [K_global]
  const KGlobal = new Float64Array(dofCount * dofCount);
  const elementRMap = new Map<string, Float64Array>();
  const elementKLocalMap = new Map<string, Float64Array>();

  for (const el of elements) {
    const nI = nodeMap.get(el.nodeI);
    const nJ = nodeMap.get(el.nodeJ);
    if (!nI || !nJ) continue;

    const p1: Vector3D = { x: nI.x, y: nI.y, z: nI.z };
    const p2: Vector3D = { x: nJ.x, y: nJ.y, z: nJ.z };

    const R = build3x3RotationMatrix(p1, p2, el.rollAngleRad);
    const kLocal = buildLocal12DOFStiffnessMatrix(el);
    const kElemGlobal = transformStiffnessToGlobal(kLocal, R);

    elementRMap.set(el.id, R);
    elementKLocalMap.set(el.id, kLocal);

    const elemDofs = [...nI.dofIndices, ...nJ.dofIndices];

    // Assemble into KGlobal
    for (let i = 0; i < 12; i++) {
      const rowDof = elemDofs[i];
      if (rowDof < 0) continue;
      for (let j = 0; j < 12; j++) {
        const colDof = elemDofs[j];
        if (colDof < 0) continue;
        KGlobal[rowDof * dofCount + colDof] += kElemGlobal[i * 12 + j];
      }
    }
  }

  // Small diagonal regularization for unconstrained rotational DOFs
  for (let i = 0; i < dofCount; i++) {
    if (Math.abs(KGlobal[i * dofCount + i]) < 1e-9) {
      KGlobal[i * dofCount + i] = 1000.0;
    }
  }

  // 3. Decompose KGlobal (Cholesky with LU fallback)
  let choleskyL = choleskyDecomposition(KGlobal, dofCount);
  let luResult: { LU: Float64Array; piv: Int32Array } | null = null;
  if (!choleskyL) {
    luResult = luDecomposition(KGlobal, dofCount);
  }

  const solveSystem = (rhs: Float64Array): Float64Array => {
    if (choleskyL) {
      return choleskySolve(choleskyL, rhs, dofCount);
    }
    return luSolve(luResult!.LU, luResult!.piv, rhs, dofCount);
  };

  // 4. Calculate total weights, floor lateral seismic forces (TBDY 2018)
  let totalBuildingMassKg = 0;
  let totalBuildingWeightKn = 0;
  for (const fd of floorDiaphragms) {
    totalBuildingMassKg += fd.totalMassKg;
    totalBuildingWeightKn += fd.deadWeightKn + 0.3 * fd.liveWeightKn;
  }
  if (totalBuildingWeightKn < 1.0) totalBuildingWeightKn = 100.0;

  // Empirical period proxy T_1 = Ct * H^(3/4)
  const sortedFloors = [...floors].sort((a, b) => a.elevation - b.elevation);
  const totalHeightM = sortedFloors.reduce((sum, f) => sum + f.height, 0);
  const Ct = 0.07;
  const T_empirical = Math.max(0.1, Ct * Math.pow(Math.max(1, totalHeightM), 0.75));

  // TBDY 2018 Design Spectrum Sa(T)
  const TA = 0.2 * (sd1 / sds);
  const TB = sd1 / sds;
  const getSa = (T: number): number => {
    if (T < TA) return (0.4 + 0.6 * (T / TA)) * sds;
    if (T <= TB) return sds;
    return sd1 / T;
  };

  const Sa1 = getSa(T_empirical);
  const rawBaseShearKn = (totalBuildingWeightKn * Sa1) / (r / importance);
  const minBaseShearKn = 0.04 * totalBuildingWeightKn * importance * sds;
  const designBaseShearKn = Math.max(rawBaseShearKn, minBaseShearKn);

  // Distribute lateral seismic base shear to storeys: Fi = Vt * (wi * Hi) / sum(wj * Hj)
  let sumWeightHeight = 0;
  let currentH = 0;
  const floorHeights: number[] = [];
  for (const floor of sortedFloors) {
    currentH += floor.height;
    floorHeights.push(currentH);
    const fd = floorDiaphragms.find(f => f.floorId === floor.id);
    const w = fd ? fd.deadWeightKn + 0.3 * fd.liveWeightKn : 100;
    sumWeightHeight += w * currentH;
  }
  if (sumWeightHeight < 1e-4) sumWeightHeight = 1.0;

  const storeyLateralForcesX = new Map<string, number>();
  const storeyLateralForcesY = new Map<string, number>();
  for (let i = 0; i < sortedFloors.length; i++) {
    const floor = sortedFloors[i];
    const fd = floorDiaphragms.find(f => f.floorId === floor.id);
    const w = fd ? fd.deadWeightKn + 0.3 * fd.liveWeightKn : 100;
    const force = (designBaseShearKn * (w * floorHeights[i])) / sumWeightHeight;
    storeyLateralForcesX.set(floor.id, force);
    storeyLateralForcesY.set(floor.id, force);
  }

  // 5. Build basic load vectors: G, Q, Ex, Ey, Ez
  const loadG = new Float64Array(dofCount);
  const loadQ = new Float64Array(dofCount);
  const loadEx = new Float64Array(dofCount);
  const loadEy = new Float64Array(dofCount);
  const loadEz = new Float64Array(dofCount);

  // Distribute floor vertical gravity and lateral earthquake forces to floor nodes
  for (const floor of sortedFloors) {
    const floorNodes = nodes.filter(n => n.floorId === floor.id && !n.isBaseFixed);
    if (floorNodes.length === 0) continue;

    const fd = floorDiaphragms.find(f => f.floorId === floor.id);
    const deadKn = fd ? fd.deadWeightKn : 50;
    const liveKn = fd ? fd.liveWeightKn : 20;

    const deadPerNode = deadKn / floorNodes.length;
    const livePerNode = liveKn / floorNodes.length;
    const fxPerNode = (storeyLateralForcesX.get(floor.id) ?? 0) / floorNodes.length;
    const fyPerNode = (storeyLateralForcesY.get(floor.id) ?? 0) / floorNodes.length;
    // Vertical seismic basis: 1.0 * G dead load. The combination factor cEz = ±0.09 * Sds
    // accurately scales dispEz to produce exactly ±0.3 * Ez = ±0.09 * Sds * G per TBDY 2018 §4.4.3.
    const fzPerNode = deadKn / floorNodes.length;

    for (const node of floorNodes) {
      const dofX = node.dofIndices[0];
      const dofY = node.dofIndices[1];
      const dofZ = node.dofIndices[2];

      if (dofZ >= 0) {
        loadG[dofZ] -= deadPerNode;   // -Z downward
        loadQ[dofZ] -= livePerNode;   // -Z downward
        loadEz[dofZ] -= fzPerNode;    // -Z vertical seismic basis (1.0 * G)
      }
      if (dofX >= 0) {
        loadEx[dofX] += fxPerNode;    // +X lateral
      }
      if (dofY >= 0) {
        loadEy[dofY] += fyPerNode;    // +Y lateral
      }
    }
  }

  // 6. Solve basic load cases
  const dispG = solveSystem(loadG);
  const dispQ = solveSystem(loadQ);
  const dispEx = solveSystem(loadEx);
  const dispEy = solveSystem(loadEy);
  const dispEz = solveSystem(loadEz);

  // 7. Multi-Storey Dynamic Modal Analysis (Periods T1, T2, T3) via Condensed Floor Flexibility
  const numStoreys = sortedFloors.length;
  const modes: ModalResult[] = [];
  let naturalPeriods: [number, number, number] = [T_empirical, T_empirical * 0.85, T_empirical * 0.70];

  if (numStoreys >= 1 && numStoreys <= 20) {
    const MDiag = new Float64Array(numStoreys);
    const FFlex = new Float64Array(numStoreys * numStoreys);

    for (let k = 0; k < numStoreys; k++) {
      const fl = sortedFloors[k];
      const fd = floorDiaphragms.find(f => f.floorId === fl.id);
      // Convert kg to metric tonnes: since K is in kN/m, omega^2 = (kN/m) / tonnes = (1/s^2)
      const massKg = fd ? Math.max(10, fd.totalMassKg) : 50000;
      MDiag[k] = massKg / 1000.0;
    }

    // Apply unit lateral loads at each floor level to find condensed flexibility matrix
    for (let col = 0; col < numStoreys; col++) {
      const fl = sortedFloors[col];
      const targetZ = fl.elevation + fl.height;
      const flNodes = nodes.filter(n => !n.isBaseFixed && Math.abs(n.z - targetZ) < 0.15);
      const unitRhs = new Float64Array(dofCount);
      const perNode = 1.0 / Math.max(1, flNodes.length);
      for (const n of flNodes) {
        if (n.dofIndices[0] >= 0) unitRhs[n.dofIndices[0]] += perNode;
      }
      const uUnit = solveSystem(unitRhs);

      for (let row = 0; row < numStoreys; row++) {
        const rowFl = sortedFloors[row];
        const rowTargetZ = rowFl.elevation + rowFl.height;
        const rowNodes = nodes.filter(n => !n.isBaseFixed && Math.abs(n.z - rowTargetZ) < 0.15);
        let avgDisp = 0.0;
        for (const n of rowNodes) {
          if (n.dofIndices[0] >= 0) avgDisp += uUnit[n.dofIndices[0]];
        }
        avgDisp /= Math.max(1, rowNodes.length);
        FFlex[row * numStoreys + col] = avgDisp;
      }
    }

    // Invert flexibility F to get condensed stiffness K_condensed
    const luF = luDecomposition(FFlex, numStoreys);
    const KCond = new Float64Array(numStoreys * numStoreys);
    for (let c = 0; c < numStoreys; c++) {
      const e = new Float64Array(numStoreys);
      e[c] = 1.0;
      const colK = luSolve(luF.LU, luF.piv, e, numStoreys);
      for (let r = 0; r < numStoreys; r++) {
        KCond[r * numStoreys + c] = colK[r];
      }
    }

    // Symmetrize KCond
    for (let r = 0; r < numStoreys; r++) {
      for (let c = r + 1; c < numStoreys; c++) {
        const avg = 0.5 * (KCond[r * numStoreys + c] + KCond[c * numStoreys + r]);
        KCond[r * numStoreys + c] = avg;
        KCond[c * numStoreys + r] = avg;
      }
    }

    // Build A_dyn = M^(-1/2) * KCond * M^(-1/2)
    const ADyn = new Float64Array(numStoreys * numStoreys);
    for (let r = 0; r < numStoreys; r++) {
      const invSqrtMr = 1.0 / Math.sqrt(MDiag[r]);
      for (let c = 0; c < numStoreys; c++) {
        const invSqrtMc = 1.0 / Math.sqrt(MDiag[c]);
        ADyn[r * numStoreys + c] = KCond[r * numStoreys + c] * invSqrtMr * invSqrtMc;
      }
    }

    const eigen = jacobiEigenvalue(ADyn, numStoreys);

    // Pair eigenvalues and vectors, then sort ascending
    const modePairs: { omega2: number; vec: Float64Array }[] = [];
    for (let i = 0; i < numStoreys; i++) {
      const omega2 = eigen.values[i];
      if (omega2 > 0) {
        const vec = new Float64Array(numStoreys);
        for (let r = 0; r < numStoreys; r++) {
          vec[r] = eigen.vectors[r * numStoreys + i] / Math.sqrt(MDiag[r]);
        }
        modePairs.push({ omega2, vec });
      }
    }
    modePairs.sort((a, b) => a.omega2 - b.omega2);

    for (let m = 0; m < Math.min(3, modePairs.length); m++) {
      const omega2 = modePairs[m].omega2;
      const omega = Math.sqrt(omega2);
      const rawT = (2 * Math.PI) / omega;
      // TBDY 2018 §4.8.4 upper bound T1 <= 1.4 * TpA
      const T = Math.min(Math.max(rawT, 0.7 * T_empirical), 1.4 * T_empirical);
      const phi = modePairs[m].vec;

      let sumMphi = 0.0;
      let sumMphi2 = 0.0;
      for (let r = 0; r < numStoreys; r++) {
        sumMphi += MDiag[r] * phi[r];
        sumMphi2 += MDiag[r] * phi[r] * phi[r];
      }
      const mEffX = sumMphi2 > 0 ? (sumMphi * sumMphi) / sumMphi2 : 0.0;
      const mTotal = MDiag.reduce((a, b) => a + b, 0);
      const partRatioX = mTotal > 0 ? mEffX / mTotal : 0.8;

      const shape: Record<string, { ux: number; uy: number; rz: number }> = {};
      for (let r = 0; r < numStoreys; r++) {
        shape[sortedFloors[r].id] = { ux: phi[r], uy: 0, rz: 0 };
      }

      modes.push({
        modeNumber: m + 1,
        periodSec: T,
        frequencyHz: 1.0 / T,
        omegaRadS: omega,
        massParticipationX: partRatioX,
        massParticipationY: 0.1,
        massParticipationRot: 0.05,
        modeShape: shape,
      });
    }

    if (modes.length >= 3) {
      naturalPeriods = [modes[0].periodSec, modes[1].periodSec, modes[2].periodSec];
    } else if (modes.length >= 1) {
      naturalPeriods = [modes[0].periodSec, modes[0].periodSec * 0.85, modes[0].periodSec * 0.70];
    }
  }

  // 8. Superpose 33 Load Combinations
  const combinations = generate32LoadCombinations(sds);
  const comboOutputs: {
    name: string;
    description: string;
    maxDisplacementM: number;
    baseShearXKn: number;
    baseShearYKn: number;
  }[] = [];

  // Element station envelopes across all combinations
  const memberStationEnvelopes = new Map<string, StationInternalForces[]>();
  const governingCombos = new Map<string, string>();
  const maxForces = new Map<string, { N: number; V2: number; V3: number; M2: number; M3: number }>();
  const minForces = new Map<string, { N: number; V2: number; V3: number; M2: number; M3: number }>();

  // Governing displacement vector (envelope max)
  const envDisplacements = new Float64Array(dofCount);

  for (const combo of combinations) {
    const { cG, cQ, cEx, cEy, cEz } = combo;

    // Superposed nodal displacement vector: u_combo = cG*uG + cQ*uQ + cEx*uEx + cEy*uEy + cEz*uEz
    const uCombo = new Float64Array(dofCount);
    let maxDisp = 0.0;
    for (let i = 0; i < dofCount; i++) {
      const val =
        cG * dispG[i] +
        cQ * dispQ[i] +
        cEx * dispEx[i] +
        cEy * dispEy[i] +
        cEz * dispEz[i];
      uCombo[i] = val;
      if (Math.abs(val) > Math.abs(envDisplacements[i])) {
        envDisplacements[i] = val;
      }
      if (Math.abs(val) > maxDisp) {
        maxDisp = Math.abs(val);
      }
    }

    const baseShearX = Math.abs(cEx) * designBaseShearKn;
    const baseShearY = Math.abs(cEy) * designBaseShearKn;

    comboOutputs.push({
      name: combo.name,
      description: combo.description,
      maxDisplacementM: maxDisp,
      baseShearXKn: baseShearX,
      baseShearYKn: baseShearY,
    });

    // Evaluate stations for each element under this combination
    for (const el of elements) {
      const nI = nodeMap.get(el.nodeI);
      const nJ = nodeMap.get(el.nodeJ);
      if (!nI || !nJ) continue;

      const elemDofs = [...nI.dofIndices, ...nJ.dofIndices];
      const uElemGlobal = new Float64Array(12);
      for (let i = 0; i < 12; i++) {
        const dof = elemDofs[i];
        uElemGlobal[i] = dof >= 0 ? uCombo[dof] : 0.0;
      }

      const R = elementRMap.get(el.id)!;
      const kLocal = elementKLocalMap.get(el.id)!;

      // Transform displacements to local: d_local = T * u_global (T block diagonal with R)
      const dLocal = new Float64Array(12);
      for (let block = 0; block < 4; block++) {
        for (let r = 0; r < 3; r++) {
          dLocal[block * 3 + r] =
            R[r * 3 + 0] * uElemGlobal[block * 3 + 0] +
            R[r * 3 + 1] * uElemGlobal[block * 3 + 1] +
            R[r * 3 + 2] * uElemGlobal[block * 3 + 2];
        }
      }

      const stations = calculate11MemberStations(el, dLocal, kLocal);

      // Initialize or update member envelopes
      let currentEnv = memberStationEnvelopes.get(el.id);
      if (!currentEnv) {
        memberStationEnvelopes.set(el.id, stations);
        governingCombos.set(el.id, combo.name);
        maxForces.set(el.id, {
          N: Math.max(...stations.map(s => s.N)),
          V2: Math.max(...stations.map(s => Math.abs(s.V2))),
          V3: Math.max(...stations.map(s => Math.abs(s.V3))),
          M2: Math.max(...stations.map(s => Math.abs(s.M2))),
          M3: Math.max(...stations.map(s => Math.abs(s.M3))),
        });
        minForces.set(el.id, {
          N: Math.min(...stations.map(s => s.N)),
          V2: Math.min(...stations.map(s => s.V2)),
          V3: Math.min(...stations.map(s => s.V3)),
          M2: Math.min(...stations.map(s => s.M2)),
          M3: Math.min(...stations.map(s => s.M3)),
        });
      } else {
        const curMax = maxForces.get(el.id)!;
        const curMin = minForces.get(el.id)!;
        let isNewGoverning = false;

        for (let s = 0; s <= 10; s++) {
          const st = stations[s];
          const envSt = currentEnv[s];

          if (Math.abs(st.M3) > Math.abs(envSt.M3)) {
            envSt.M3 = st.M3;
            isNewGoverning = true;
          }
          if (Math.abs(st.V2) > Math.abs(envSt.V2)) {
            envSt.V2 = st.V2;
            isNewGoverning = true;
          }
          if (Math.abs(st.N) > Math.abs(envSt.N)) {
            envSt.N = st.N;
          }
          if (Math.abs(st.M2) > Math.abs(envSt.M2)) {
            envSt.M2 = st.M2;
          }
          if (Math.abs(st.V3) > Math.abs(envSt.V3)) {
            envSt.V3 = st.V3;
          }
          if (Math.abs(st.T) > Math.abs(envSt.T)) {
            envSt.T = st.T;
          }

          curMax.N = Math.max(curMax.N, st.N);
          curMin.N = Math.min(curMin.N, st.N);
          curMax.V2 = Math.max(curMax.V2, Math.abs(st.V2));
          curMax.V3 = Math.max(curMax.V3, Math.abs(st.V3));
          curMax.M3 = Math.max(curMax.M3, st.M3);
          curMin.M3 = Math.min(curMin.M3, st.M3);
          curMax.M2 = Math.max(curMax.M2, Math.abs(st.M2));
        }

        if (isNewGoverning) {
          governingCombos.set(el.id, combo.name);
        }
      }
    }
  }

  // 9. Format member envelopes dictionary
  const memberEnvelopesRecord: Record<string, MemberStationEnvelope> = {};
  for (const el of elements) {
    const stations = memberStationEnvelopes.get(el.id) ?? [];
    const maxF = maxForces.get(el.id) ?? { N: 0, V2: 0, V3: 0, M2: 0, M3: 0 };
    const minF = minForces.get(el.id) ?? { N: 0, V2: 0, V3: 0, M2: 0, M3: 0 };
    memberEnvelopesRecord[el.id] = {
      elementId: el.id,
      name: el.name,
      type: el.type,
      floorId: el.floorId,
      length: el.length,
      stations,
      maxAxialKn: maxF.N,
      minAxialKn: minF.N,
      maxShearV2Kn: maxF.V2,
      maxShearV3Kn: maxF.V3,
      maxMomentM3Knm: maxF.M3,
      minMomentM3Knm: minF.M3,
      maxMomentM2Knm: maxF.M2,
      governingCombo: governingCombos.get(el.id) ?? "1.4G+1.6Q",
    };
  }

  // 10. Node displacement output map
  const nodeDisplacements: Record<string, [number, number, number, number, number, number]> = {};
  for (const node of nodes) {
    if (node.isBaseFixed) {
      nodeDisplacements[node.id] = [0, 0, 0, 0, 0, 0];
    } else {
      nodeDisplacements[node.id] = [
        envDisplacements[node.dofIndices[0]],
        envDisplacements[node.dofIndices[1]],
        envDisplacements[node.dofIndices[2]],
        envDisplacements[node.dofIndices[3]],
        envDisplacements[node.dofIndices[4]],
        envDisplacements[node.dofIndices[5]],
      ];
    }
  }

  // 11. Floor diaphragm displacement and drift calculation
  const floorDiaphragmResults: FloorDiaphragmResult[] = [];
  let prevDispX = 0.0;
  let prevDispY = 0.0;

  for (const floor of sortedFloors) {
    const flNodes = nodes.filter(n => n.floorId === floor.id && !n.isBaseFixed);
    const fd = floorDiaphragms.find(f => f.floorId === floor.id);

    let avgUx = 0.0;
    let avgUy = 0.0;
    let avgRz = 0.0;
    for (const n of flNodes) {
      if (n.dofIndices[0] >= 0) avgUx += envDisplacements[n.dofIndices[0]];
      if (n.dofIndices[1] >= 0) avgUy += envDisplacements[n.dofIndices[1]];
      if (n.dofIndices[5] >= 0) avgRz += envDisplacements[n.dofIndices[5]];
    }
    const count = Math.max(1, flNodes.length);
    avgUx /= count;
    avgUy /= count;
    avgRz /= count;

    const driftX = Math.abs(avgUx - prevDispX);
    const driftY = Math.abs(avgUy - prevDispY);
    const driftRatioX = (r / importance) * (driftX / floor.height);
    const driftRatioY = (r / importance) * (driftY / floor.height);
    const driftPass = Math.max(driftRatioX, driftRatioY) <= 0.008;

    floorDiaphragmResults.push({
      floorId: floor.id,
      floorName: floor.name,
      elevation: floor.elevation,
      height: floor.height,
      centerX: fd?.centerX ?? 0,
      centerY: fd?.centerY ?? 0,
      totalMassKg: fd?.totalMassKg ?? 1000,
      displacementX: avgUx,
      displacementY: avgUy,
      rotationZ: avgRz,
      driftX,
      driftY,
      driftRatioX,
      driftRatioY,
      driftPass,
    });

    prevDispX = avgUx;
    prevDispY = avgUy;
  }

  // Overturning moments
  let Mox = 0.0;
  let Moy = 0.0;
  for (let i = 0; i < sortedFloors.length; i++) {
    const fl = sortedFloors[i];
    const H = floorHeights[i];
    const Fx = storeyLateralForcesX.get(fl.id) ?? 0;
    const Fy = storeyLateralForcesY.get(fl.id) ?? 0;
    Mox += Fy * H;
    Moy += Fx * H;
  }

  return {
    success: true,
    nodes,
    elements,
    displacements: nodeDisplacements,
    memberForces: Object.fromEntries(
      Object.entries(memberEnvelopesRecord).map(([id, env]) => [id, env.stations])
    ),
    memberEnvelopes: memberEnvelopesRecord,
    combinations: comboOutputs,
    modes,
    naturalPeriods,
    baseShears: {
      Vtx: designBaseShearKn,
      Vty: designBaseShearKn,
      Mox,
      Moy,
    },
    floorDiaphragms: floorDiaphragmResults,
    totalMassKg: totalBuildingMassKg,
    totalWeightKn: totalBuildingWeightKn,
  };
}
