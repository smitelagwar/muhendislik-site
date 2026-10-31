import { describe, test } from "node:test";
import assert from "node:assert/strict";
import {
  getVertexDisplacement,
  getDisplacementHeatmapColor,
  getMaxDisplacementMagnitude,
  projectRaycastHitToStation,
  interpolateStationForces,
  type StationData,
} from "../../src/lib/hsyncad/diagram-geometry";

describe("Milestone 4 Iteration 2: Empirical Kinematics, Projection Invariants & Oracles", () => {
  // =========================================================================
  // Suite 1: Multi-Storey Displacement Kinematics & Mathematical Oracles
  // =========================================================================
  describe("1. Multi-Storey Displacement Kinematics & Mathematical Oracles (N = 1..10 Storeys)", () => {
    test("1.1 Ground and Substructure Clamping Oracle: Z <= 0 strictly produces zero drift across all (X, Y)", () => {
      // Create a multi-storey building analysis with non-trivial drifts and rotations
      const buildingAnalysis: any = {
        floorDiaphragms: [
          { elevation: 3.0, displacementX: 0.015, displacementY: 0.005, rotationZ: 0.001, centerX: 12.0, centerY: 10.0 },
          { elevation: 6.0, displacementX: 0.030, displacementY: 0.010, rotationZ: 0.002, centerX: 12.0, centerY: 10.0 },
          { elevation: 9.0, displacementX: 0.045, displacementY: 0.015, rotationZ: 0.003, centerX: 12.0, centerY: 10.0 },
        ],
      };

      // Comprehensive spatial grid at ground (Z = 0) and deep substructure (Z < 0)
      const testX = [-50, -12, 0, 5.5, 12.0, 25, 100];
      const testY = [-50, -10, 0, 3.2, 10.0, 30, 100];
      const testZ = [0.0, -0.0001, -0.5, -3.0, -15.0, -100.0];

      for (const z of testZ) {
        for (const x of testX) {
          for (const y of testY) {
            const disp = getVertexDisplacement(x, y, z, buildingAnalysis);
            assert.deepEqual(
              disp,
              [0, 0, 0],
              `Elevation Z=${z} at (${x}, ${y}) MUST strictly clamp to [0, 0, 0]`
            );
          }
        }
      }
    });

    test("1.2 Monotonic Elevation Drift Oracle for Tall Buildings (N = 1 to 10 Storeys)", () => {
      // Test buildings of varying heights: 1, 3, 5, 8, 10 storeys
      const storeyCounts = [1, 3, 5, 8, 10];
      const storeyHeight = 3.0; // 3.0 m per storey

      for (const N of storeyCounts) {
        // Construct building with realistic inverted-triangular/first-mode drift profile
        const diaphragms: any[] = [];
        for (let k = 1; k <= N; k++) {
          const elev = k * storeyHeight;
          // Linear drift: 3.5 mm per floor
          const ux = k * 0.0035;
          const uy = k * 0.0012;
          diaphragms.push({
            floorId: `F${k}`,
            elevation: elev,
            displacementX: ux,
            displacementY: uy,
            rotationZ: 0.0002 * (k / N),
            centerX: 15.0,
            centerY: 12.0,
          });
        }

        const analysis: any = { floorDiaphragms: diaphragms };
        const roofZ = N * storeyHeight;

        // Sweep 200 sample elevations from Z = 0 to Z = roofZ
        const sampleCount = 200;
        let prevDispMag = 0.0;
        let prevUx = 0.0;

        for (let s = 0; s <= sampleCount; s++) {
          const z = (s / sampleCount) * roofZ;
          // Sample at center of rigidity where rotation does not obscure translational drift
          const [ux, uy, uz] = getVertexDisplacement(15.0, 12.0, z, analysis);
          const mag = Math.hypot(ux, uy, uz);

          // Invariant 1: Non-negative displacement
          assert.ok(mag >= 0, `Displacement magnitude at Z=${z} must be >= 0`);

          // Invariant 2: Monotonic increase with elevation
          if (s > 0) {
            assert.ok(
              mag >= prevDispMag - 1e-12,
              `Building N=${N}: Drift magnitude must be monotonically non-decreasing with height (Z=${z}, prev=${prevDispMag}, curr=${mag})`
            );
            assert.ok(
              ux >= prevUx - 1e-12,
              `Building N=${N}: ux must be monotonically non-decreasing with height (Z=${z}, prev=${prevUx}, curr=${ux})`
            );
          }

          prevDispMag = mag;
          prevUx = ux;
        }

        // Invariant 3: Top floor cap: elevations above roof must match roof displacement
        const atRoof = getVertexDisplacement(15.0, 12.0, roofZ, analysis);
        const aboveRoof = getVertexDisplacement(15.0, 12.0, roofZ + 2.5, analysis);
        assert.ok(
          Math.abs(aboveRoof[0] - atRoof[0]) < 1e-9 && Math.abs(aboveRoof[1] - atRoof[1]) < 1e-9,
          `Building N=${N}: Elevations above roof must cap at roof diaphragm displacement`
        );
      }
    });

    test("1.3 Diaphragm Torsional Rotation & Differential Plan Drift Oracle", () => {
      // Floor diaphragm at elevation Z = 6.0 m
      const diaUx = 0.025; // 25 mm lateral translation
      const diaUy = 0.008; // 8 mm lateral translation
      const thetaZ = 0.0012; // 1.2 mrad counterclockwise rotation
      const cx = 14.0;
      const cy = 10.0;

      const analysis: any = {
        floorDiaphragms: [
          { elevation: 6.0, displacementX: diaUx, displacementY: diaUy, rotationZ: thetaZ, centerX: cx, centerY: cy },
        ],
      };

      // Oracle 1: At Center of Rigidity (cx, cy), displacement is pure translation
      const atCenter = getVertexDisplacement(cx, cy, 6.0, analysis);
      assert.ok(
        Math.abs(atCenter[0] - diaUx) < 1e-9,
        `At center of rigidity, ux must be exactly dia.ux (${diaUx})`
      );
      assert.ok(
        Math.abs(atCenter[1] - diaUy) < 1e-9,
        `At center of rigidity, uy must be exactly dia.uy (${diaUy})`
      );

      // Oracle 2: Symmetric Plan Offsets Oracle (Differential Drift Invariant)
      // Kinematic formula:
      // u_x(cx, cy + dy) = diaUx - thetaZ * dy
      // u_x(cx, cy - dy) = diaUx + thetaZ * dy
      // Difference: u_x(minus) - u_x(plus) = 2 * thetaZ * dy
      // Mean: (u_x(plus) + u_x(minus)) / 2 = diaUx
      const dyOffsets = [1.0, 2.5, 5.0, 8.0, 15.0];
      for (const dy of dyOffsets) {
        const ptPlus = getVertexDisplacement(cx, cy + dy, 6.0, analysis);
        const ptMinus = getVertexDisplacement(cx, cy - dy, 6.0, analysis);

        const diffUx = ptMinus[0] - ptPlus[0];
        const expectedDiff = 2 * thetaZ * dy;
        assert.ok(
          Math.abs(diffUx - expectedDiff) < 1e-9,
          `Differential drift for dy=${dy}: expected diff ${expectedDiff}, got ${diffUx}`
        );

        const meanUx = 0.5 * (ptPlus[0] + ptMinus[0]);
        assert.ok(
          Math.abs(meanUx - diaUx) < 1e-9,
          `Symmetric mean ux for dy=${dy}: expected ${diaUx}, got ${meanUx}`
        );
      }

      // Oracle 3: Orthogonal X-Offset Invariant for uy
      // u_y(cx + dx, cy) = diaUy + thetaZ * dx
      // u_y(cx - dx, cy) = diaUy - thetaZ * dx
      // Difference: u_y(plus) - u_y(minus) = 2 * thetaZ * dx
      const dxOffsets = [1.5, 3.0, 6.0, 10.0];
      for (const dx of dxOffsets) {
        const ptPlus = getVertexDisplacement(cx + dx, cy, 6.0, analysis);
        const ptMinus = getVertexDisplacement(cx - dx, cy, 6.0, analysis);

        const diffUy = ptPlus[1] - ptMinus[1];
        const expectedDiff = 2 * thetaZ * dx;
        assert.ok(
          Math.abs(diffUy - expectedDiff) < 1e-9,
          `Differential drift for dx=${dx}: expected diff ${expectedDiff}, got ${diffUy}`
        );

        const meanUy = 0.5 * (ptPlus[1] + ptMinus[1]);
        assert.ok(
          Math.abs(meanUy - diaUy) < 1e-9,
          `Symmetric mean uy for dx=${dx}: expected ${diaUy}, got ${meanUy}`
        );
      }

      // Oracle 4: Clockwise (negative thetaZ) rotation inversion
      const analysisCW: any = {
        floorDiaphragms: [
          { elevation: 6.0, displacementX: diaUx, displacementY: diaUy, rotationZ: -thetaZ, centerX: cx, centerY: cy },
        ],
      };
      const ptCWPlus = getVertexDisplacement(cx, cy + 5.0, 6.0, analysisCW);
      const ptCCWPlus = getVertexDisplacement(cx, cy + 5.0, 6.0, analysis);
      // For CW rotation, +dy increases ux: ux = diaUx - (-thetaZ) * dy = diaUx + thetaZ * dy
      assert.ok(
        ptCWPlus[0] > diaUx && ptCCWPlus[0] < diaUx,
        "Opposite rotation signs MUST produce symmetrically opposite drift offsets"
      );
    });

    test("1.4 C0 Kinematic Continuity Oracle across Storey Elevation Boundaries", () => {
      // 4-storey building
      const analysis: any = {
        floorDiaphragms: [
          { elevation: 3.0, displacementX: 0.010, displacementY: 0.003, rotationZ: 0.0002, centerX: 10, centerY: 10 },
          { elevation: 6.0, displacementX: 0.022, displacementY: 0.007, rotationZ: 0.0005, centerX: 10, centerY: 10 },
          { elevation: 9.0, displacementX: 0.035, displacementY: 0.011, rotationZ: 0.0008, centerX: 10, centerY: 10 },
          { elevation: 12.0, displacementX: 0.046, displacementY: 0.015, rotationZ: 0.0011, centerX: 10, centerY: 10 },
        ],
      };

      const boundaries = [3.0, 6.0, 9.0, 12.0];
      const eps = 1e-6; // small elevation perturbation

      for (const zb of boundaries) {
        const uBelow = getVertexDisplacement(12.5, 8.5, zb - eps, analysis);
        const uAt = getVertexDisplacement(12.5, 8.5, zb, analysis);
        const uAbove = getVertexDisplacement(12.5, 8.5, zb + eps, analysis);

        // Jump across boundary must be negligible (C0 continuity: |u(z+) - u(z-)| < 1e-5)
        const jumpBelow = Math.hypot(uAt[0] - uBelow[0], uAt[1] - uBelow[1]);
        const jumpAbove = Math.hypot(uAbove[0] - uAt[0], uAbove[1] - uAt[1]);

        assert.ok(
          jumpBelow < 1e-5,
          `At boundary Z=${zb}: displacement jump from below (${jumpBelow}) must be < 1e-5 m`
        );
        assert.ok(
          jumpAbove < 1e-5,
          `At boundary Z=${zb}: displacement jump from above (${jumpAbove}) must be < 1e-5 m`
        );
      }
    });
  });

  // =========================================================================
  // Suite 2: Raycast Projection Mathematical Properties & Invariants
  // =========================================================================
  describe("2. Raycast Projection Mathematical Properties & Invariants", () => {
    test("2.1 Orthogonal Projection Property: (P_hit - P_proj) . (P2 - P1) == 0 for all internal points", () => {
      // Test across multiple member orientations:
      const testCases = [
        // Horizontal beam along X-axis
        {
          element: { type: "beam", start: { x: 0, y: 0 }, end: { x: 6, y: 0 } },
          floor: { elevation: 0, height: 3.0 },
          p1Three: { x: 0, y: 3.0, z: 0 },
          p2Three: { x: 6, y: 3.0, z: 0 },
        },
        // Diagonal beam in plan (3-4-5 triangle)
        {
          element: { type: "beam", start: { x: 1, y: 2 }, end: { x: 4, y: 6 } },
          floor: { elevation: 3.0, height: 3.0 },
          p1Three: { x: 1, y: 6.0, z: -2 },
          p2Three: { x: 4, y: 6.0, z: -6 },
        },
        // Vertical column from Z=3 to Z=6.5
        {
          element: { type: "column", position: { x: 5, y: 7 }, height: 3.5, bottomZ: 3.0 },
          floor: { elevation: 3.0, height: 3.5 },
          p1Three: { x: 5, y: 3.0, z: -7 },
          p2Three: { x: 5, y: 6.5, z: -7 },
        },
        // Skew shear wall
        {
          element: { type: "wall", start: { x: -2, y: 3 }, end: { x: 5, y: -1 }, bottomZ: 0, height: 3.0 },
          floor: { elevation: 0, height: 3.0 },
          p1Three: { x: -2, y: 1.5, z: -3 },
          p2Three: { x: 5, y: 1.5, z: 1 },
        },
      ];

      for (const tc of testCases) {
        const { p1Three, p2Three, element, floor } = tc;
        const dx = p2Three.x - p1Three.x;
        const dy = p2Three.y - p1Three.y;
        const dz = p2Three.z - p1Three.z;
        const Lsq = dx * dx + dy * dy + dz * dz;
        const L = Math.sqrt(Lsq);

        // Sample 20 internal station fractions t_true in (0, 1)
        for (let i = 1; i < 20; i++) {
          const tTrue = i / 20.0;
          // Point on the axis:
          const axisX = p1Three.x + tTrue * dx;
          const axisY = p1Three.y + tTrue * dy;
          const axisZ = p1Three.z + tTrue * dz;

          // Generate an arbitrary non-zero orthogonal offset vector w
          // w must satisfy w . D = 0.
          // Pick an arbitrary vector v, then w = v - (v . D / |D|^2) * D
          const vx = Math.sin(i * 1.7) * 2.5;
          const vy = Math.cos(i * 2.3) * 2.5;
          const vz = Math.sin(i * 3.1) * 2.5;
          const dotVD = vx * dx + vy * dy + vz * dz;
          const wx = vx - (dotVD / Lsq) * dx;
          const wy = vy - (dotVD / Lsq) * dy;
          const wz = vz - (dotVD / Lsq) * dz;

          // Construct test hit point: P_hit = P_axis + w
          const hitPoint = { x: axisX + wx, y: axisY + wy, z: axisZ + wz };

          // Run projectRaycastHitToStation
          const res = projectRaycastHitToStation(hitPoint, element, floor);

          // 1. Invariant: recovered t must match tTrue within numerical tolerance
          assert.ok(
            Math.abs(res.t - tTrue) < 1e-6,
            `Element ${element.type}: recovered t (${res.t}) must match true t (${tTrue})`
          );

          // 2. Invariant: physical distance x == t * L
          assert.ok(
            Math.abs(res.x - tTrue * L) < 1e-6,
            `Element ${element.type}: physical x (${res.x}) must equal t * L (${tTrue * L})`
          );

          // 3. Mathematical Orthogonality Property:
          // Vector from P_proj to P_hit: r = P_hit - (P1 + t * D)
          const projX = p1Three.x + res.t * dx;
          const projY = p1Three.y + res.t * dy;
          const projZ = p1Three.z + res.t * dz;
          const rx = hitPoint.x - projX;
          const ry = hitPoint.y - projY;
          const rz = hitPoint.z - projZ;

          const dotOrthogonal = rx * dx + ry * dy + rz * dz;
          assert.ok(
            Math.abs(dotOrthogonal) < 1e-9,
            `Orthogonality invariant violated: (P_hit - P_proj) . D = ${dotOrthogonal} (must be 0)`
          );
        }
      }
    });

    test("2.2 Minimum Distance Oracle: Projected point strictly minimizes Euclidean distance", () => {
      // Beam along X from (0, 3, 0) to (10, 3, 0)
      const beam = { type: "beam", start: { x: 0, y: 0 }, end: { x: 10, y: 0 } };
      const floor = { elevation: 0, height: 3.0 };
      const p1 = { x: 0, y: 3, z: 0 };
      const p2 = { x: 10, y: 3, z: 0 };
      const D = { x: 10, y: 0, z: 0 };

      // Arbitrary off-axis query point projecting to t = 0.42 (x = 4.2)
      const hitPoint = { x: 4.2, y: 5.5, z: -3.8 };
      const res = projectRaycastHitToStation(hitPoint, beam, floor);

      assert.ok(Math.abs(res.t - 0.42) < 1e-6, `Computed t must be 0.42`);

      const projPoint = { x: p1.x + res.t * D.x, y: p1.y + res.t * D.y, z: p1.z + res.t * D.z };
      const minDistance = Math.hypot(hitPoint.x - projPoint.x, hitPoint.y - projPoint.y, hitPoint.z - projPoint.z);

      // Sample 100 other candidate points along the segment tau in [0, 1]
      for (let i = 0; i <= 100; i++) {
        const tau = i / 100.0;
        if (Math.abs(tau - res.t) < 1e-4) continue; // skip the projected point itself
        const candX = p1.x + tau * D.x;
        const candY = p1.y + tau * D.y;
        const candZ = p1.z + tau * D.z;
        const dist = Math.hypot(hitPoint.x - candX, hitPoint.y - candY, hitPoint.z - candZ);

        assert.ok(
          dist > minDistance,
          `Minimum distance property violated: distance at tau=${tau} (${dist}) must be > minDistance (${minDistance})`
        );
      }
    });

    test("2.3 Boundary Clamping & Projection Idempotence Oracle", () => {
      const beam = { type: "beam", start: { x: 2, y: 4 }, end: { x: 8, y: 4 } };
      const floor = { elevation: 0, height: 3.0 };

      // Point before start (rawT < 0)
      const hitBefore = projectRaycastHitToStation({ x: -5.0, y: 3.0, z: -4.0 }, beam, floor);
      assert.equal(hitBefore.t, 0.0, "Before start hit must strictly clamp t to 0.0");
      assert.equal(hitBefore.x, 0.0, "Before start hit must strictly clamp x to 0.0");

      // Point beyond end (rawT > 1)
      const hitBeyond = projectRaycastHitToStation({ x: 15.0, y: 3.0, z: -4.0 }, beam, floor);
      assert.equal(hitBeyond.t, 1.0, "Beyond end hit must strictly clamp t to 1.0");
      assert.equal(hitBeyond.x, hitBeyond.L, "Beyond end hit must strictly clamp x to L");

      // Projection Idempotence: projecting the projected point gives identical station
      const hitArbitrary = { x: 5.6, y: 4.8, z: -2.1 };
      const proj1 = projectRaycastHitToStation(hitArbitrary, beam, floor);
      // Construct the 3D projected point
      const p1Three = { x: 2, y: 3.0, z: -4 };
      const p2Three = { x: 8, y: 3.0, z: -4 };
      const pOnAxis = {
        x: p1Three.x + proj1.t * (p2Three.x - p1Three.x),
        y: p1Three.y + proj1.t * (p2Three.y - p1Three.y),
        z: p1Three.z + proj1.t * (p2Three.z - p1Three.z),
      };
      const proj2 = projectRaycastHitToStation(pOnAxis, beam, floor);
      assert.ok(
        Math.abs(proj2.t - proj1.t) < 1e-9,
        `Projection idempotence violated: proj2.t (${proj2.t}) must equal proj1.t (${proj1.t})`
      );
    });

    test("2.4 Degenerate Geometry Guard: zero-length member does not throw or produce NaN", () => {
      // Coincident start and end points
      const degenerateBeam = { type: "beam", start: { x: 5, y: 5 }, end: { x: 5, y: 5 } };
      const res = projectRaycastHitToStation({ x: 5, y: 3, z: -5 }, degenerateBeam);
      assert.ok(!Number.isNaN(res.t), "t must not be NaN");
      assert.ok(!Number.isNaN(res.x), "x must not be NaN");
      assert.ok(res.t >= 0 && res.t <= 1, "t must be clamped in [0, 1]");
    });
  });

  // =========================================================================
  // Suite 3: Displacement Contour Heatmap Color Boundedness & Continuity
  // =========================================================================
  describe("3. Displacement Contour Heatmap Color Boundedness & Lipschitz Continuity", () => {
    test("3.1 Strict [0, 1] RGB Boundedness Oracle under Extreme Inputs", () => {
      const extremeInputs = [
        -1e9, -1000, -1.0, -0.001, -0.0, 0.0, 0.0001, 0.1, 0.25, 0.37, 0.5,
        0.63, 0.75, 0.88, 1.0, 1.0001, 2.5, 100, 1e9,
        Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY,
      ];

      for (const rho of extremeInputs) {
        const [r, g, b] = getDisplacementHeatmapColor(rho);
        // All channels must be strictly finite numbers
        assert.ok(Number.isFinite(r), `r must be finite for rho=${rho}`);
        assert.ok(Number.isFinite(g), `g must be finite for rho=${rho}`);
        assert.ok(Number.isFinite(b), `b must be finite for rho=${rho}`);

        // All channels must be strictly bounded in [0, 1]
        assert.ok(r >= 0 && r <= 1.0, `r channel out of [0, 1] for rho=${rho}: ${r}`);
        assert.ok(g >= 0 && g <= 1.0, `g channel out of [0, 1] for rho=${rho}: ${g}`);
        assert.ok(b >= 0 && b <= 1.0, `b channel out of [0, 1] for rho=${rho}: ${b}`);
      }
    });

    test("3.2 C0 Continuity Oracle across Segment Boundaries (rho = 0.25, 0.50, 0.75)", () => {
      const boundaries = [0.25, 0.50, 0.75];
      const deltas = [1e-4, 1e-6, 1e-8];

      for (const rhoB of boundaries) {
        for (const eps of deltas) {
          const cLeft = getDisplacementHeatmapColor(rhoB - eps);
          const cAt = getDisplacementHeatmapColor(rhoB);
          const cRight = getDisplacementHeatmapColor(rhoB + eps);

          const jumpLeft = Math.max(
            Math.abs(cAt[0] - cLeft[0]),
            Math.abs(cAt[1] - cLeft[1]),
            Math.abs(cAt[2] - cLeft[2])
          );
          const jumpRight = Math.max(
            Math.abs(cRight[0] - cAt[0]),
            Math.abs(cRight[1] - cAt[1]),
            Math.abs(cRight[2] - cAt[2])
          );

          // Theoretical slope <= 3.0, so jump must be <= 3.1 * eps + 1e-12
          const maxAllowedJump = 3.1 * eps + 1e-12;
          assert.ok(
            jumpLeft <= maxAllowedJump,
            `Color jump at left of boundary rho=${rhoB} (eps=${eps}) was ${jumpLeft}, exceeded ${maxAllowedJump}`
          );
          assert.ok(
            jumpRight <= maxAllowedJump,
            `Color jump at right of boundary rho=${rhoB} (eps=${eps}) was ${jumpRight}, exceeded ${maxAllowedJump}`
          );
        }
      }
    });

    test("3.3 Global Lipschitz Continuity Oracle (10,000 Step Fine Discretization Sweep)", () => {
      // Discretize rho in [0, 1] into N = 10,000 steps
      const N = 10000;
      const dRho = 1.0 / N;
      const L_theor = 3.0; // Theoretical maximum derivative magnitude in any piecewise segment

      let prevColor = getDisplacementHeatmapColor(0.0);

      for (let i = 1; i <= N; i++) {
        const rho = i * dRho;
        const color = getDisplacementHeatmapColor(rho);

        // Check channel bounds
        assert.ok(color[0] >= 0 && color[0] <= 1, `r at rho=${rho} out of bounds`);
        assert.ok(color[1] >= 0 && color[1] <= 1, `g at rho=${rho} out of bounds`);
        assert.ok(color[2] >= 0 && color[2] <= 1, `b at rho=${rho} out of bounds`);

        // Check step difference against theoretical Lipschitz bound
        const stepDiffR = Math.abs(color[0] - prevColor[0]);
        const stepDiffG = Math.abs(color[1] - prevColor[1]);
        const stepDiffB = Math.abs(color[2] - prevColor[2]);
        const maxStepDiff = Math.max(stepDiffR, stepDiffG, stepDiffB);

        // Maximum allowed step difference: L_theor * dRho + numerical slack
        assert.ok(
          maxStepDiff <= L_theor * dRho + 1e-9,
          `Lipschitz continuity violated at rho=${rho}: max step diff ${maxStepDiff} > ${L_theor * dRho}`
        );

        prevColor = color;
      }
    });

    test("3.4 Color Spectrum Progression & Dominance Oracle", () => {
      // At rho = 0 (zero drift): dominant Blue
      const c0 = getDisplacementHeatmapColor(0.0);
      assert.ok(c0[2] > c0[0] && c0[2] > c0[1], "At rho=0, Blue channel must dominate");

      // At rho = 0.5 (mid drift): dominant Green
      const c50 = getDisplacementHeatmapColor(0.5);
      assert.ok(c50[1] > c50[0] && c50[1] > c50[2], "At rho=0.5, Green channel must dominate");

      // At rho = 1.0 (peak drift): dominant Red
      const c100 = getDisplacementHeatmapColor(1.0);
      assert.ok(c100[0] > c100[1] && c100[0] > c100[2], "At rho=1.0, Red channel must dominate");

      // Blue channel strictly monotonically decreases from rho = 0.25 to rho = 1.0
      let prevB = getDisplacementHeatmapColor(0.25)[2];
      for (let s = 1; s <= 20; s++) {
        const rho = 0.25 + (s / 20) * 0.75;
        const b = getDisplacementHeatmapColor(rho)[2];
        assert.ok(b <= prevB + 1e-9, `Blue channel must non-increase on [0.25, 1.0] (rho=${rho})`);
        prevB = b;
      }

      // Red channel strictly monotonically increases from rho = 0.25 to rho = 0.75
      let prevR = getDisplacementHeatmapColor(0.25)[0];
      for (let s = 1; s <= 20; s++) {
        const rho = 0.25 + (s / 20) * 0.50;
        const r = getDisplacementHeatmapColor(rho)[0];
        assert.ok(r >= prevR - 1e-9, `Red channel must non-decrease on [0.25, 0.75] (rho=${rho})`);
        prevR = r;
      }
    });
  });

  // =========================================================================
  // Suite 4: Member Force Station Linear Interpolation Mathematical Invariants
  // =========================================================================
  describe("4. Member Force Linear Interpolation Mathematical Invariants", () => {
    test("4.1 Knot Value Exactness & Convex Boundedness Oracle", () => {
      // Create 11 stations with non-linear internal force variations
      const numStations = 11;
      const stations: StationData[] = [];
      for (let i = 0; i < numStations; i++) {
        const xi = (i / (numStations - 1)) * 6.0; // 6 m beam
        // Parabolic bending moment M(x) = q * x * (L - x) / 2 with q = 20 kN/m
        const M3 = 0.5 * 20 * xi * (6.0 - xi);
        // Linear shear force V(x) = q * (L / 2 - x)
        const V2 = 20 * (3.0 - xi);
        stations.push({ x: xi, N: -15.0, V2, V3: 0, T: 0, M2: 0, M3 });
      }

      // Knot exactness: at t = k / 10, interpolated value matches stations[k] exactly
      for (let k = 0; k < numStations; k++) {
        const tk = k / (numStations - 1);
        const interp = interpolateStationForces(stations, tk);
        assert.ok(
          Math.abs(interp.x - stations[k].x) < 1e-9,
          `At knot k=${k}: x must match exactly`
        );
        assert.ok(
          Math.abs(interp.M3 - stations[k].M3) < 1e-9,
          `At knot k=${k}: M3 must match exactly`
        );
        assert.ok(
          Math.abs(interp.V2 - stations[k].V2) < 1e-9,
          `At knot k=${k}: V2 must match exactly`
        );
      }

      // Convex boundedness: between knot k and k+1, interpolated value lies between stations[k] and stations[k+1]
      for (let k = 0; k < numStations - 1; k++) {
        const s1 = stations[k];
        const s2 = stations[k + 1];
        const minM = Math.min(s1.M3, s2.M3);
        const maxM = Math.max(s1.M3, s2.M3);

        for (let sub = 1; sub < 5; sub++) {
          const tSub = (k + sub / 5.0) / (numStations - 1);
          const interp = interpolateStationForces(stations, tSub);

          assert.ok(
            interp.M3 >= minM - 1e-9 && interp.M3 <= maxM + 1e-9,
            `Convexity violated in interval [${k}, ${k+1}] at t=${tSub}: M3=${interp.M3} not in [${minM}, ${maxM}]`
          );
        }
      }
    });

    test("4.2 Boundary Clamping and Empty/Single Station Invariants", () => {
      // Empty array
      const emptyRes = interpolateStationForces([], 0.5);
      assert.deepEqual(emptyRes, { x: 0, N: 0, V2: 0, V3: 0, T: 0, M2: 0, M3: 0 });

      // Single station
      const singleStation: StationData[] = [{ x: 2.5, N: -50, V2: 30, V3: 0, T: 1.5, M2: 0, M3: 75 }];
      const singleRes = interpolateStationForces(singleStation, 0.8);
      assert.deepEqual(singleRes, { x: 2.5, N: -50, V2: 30, V3: 0, T: 1.5, M2: 0, M3: 75 });

      // t < 0 and t > 1 clamping on multiple stations
      const stations: StationData[] = [
        { x: 0, N: 0, V2: 10, V3: 0, T: 0, M2: 0, M3: 0 },
        { x: 4, N: 0, V2: -10, V3: 0, T: 0, M2: 0, M3: 20 },
      ];
      const clampedNegative = interpolateStationForces(stations, -1.5);
      assert.deepEqual(clampedNegative, stations[0], "t < 0 must clamp to first station");

      const clampedPositive = interpolateStationForces(stations, 3.5);
      assert.deepEqual(clampedPositive, stations[1], "t > 1 must clamp to last station");
    });
  });
});
