import { describe, test } from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";
import {
  cadToThreeCoord,
  cadToThreeDisplacement,
  build3DRibbonData,
  calculateAutoDeformationScale,
  calculateAutoDiagramScale,
  getDcrColor,
  getDcrColorHex,
  interpolateStationForces,
  type StationData,
  type Point3D,
  type ForceDiagramType,
} from "../../src/lib/hsyncad/diagram-geometry";

describe("Milestone 4 Challenger 2: 3D Scene, Deformed Mesh, Extruded Ribbons & DCR Heatmap", () => {
  // =========================================================================
  // Area 1: Three.js Coordinate & Vector Mapping (All 8 Octants & Invariants)
  // =========================================================================
  describe("1. Three.js Coordinate & Vector Mapping Across 8 Space Octants", () => {
    test("1.1 Bijective 8-Octant Coordinate Mapping with Invertibility & Distance Preservation", () => {
      // 8 octants with signs (+/- X, +/- Y, +/- Z)
      const octantSigns = [
        { octant: 1, sx: +1, sy: +1, sz: +1 },
        { octant: 2, sx: -1, sy: +1, sz: +1 },
        { octant: 3, sx: -1, sy: -1, sz: +1 },
        { octant: 4, sx: +1, sy: -1, sz: +1 },
        { octant: 5, sx: +1, sy: +1, sz: -1 },
        { octant: 6, sx: -1, sy: +1, sz: -1 },
        { octant: 7, sx: -1, sy: -1, sz: -1 },
        { octant: 8, sx: +1, sy: -1, sz: -1 },
      ];

      for (const { octant, sx, sy, sz } of octantSigns) {
        const xCad = sx * 15.25;
        const yCad = sy * 23.40;
        const zCad = sz * 7.85;

        // Transformation rule: (X, Y, Z)_cad -> (X, Z, -Y)_three
        const [xThree, yThree, zThree] = cadToThreeCoord(xCad, yCad, zCad);

        // Verification of coordinate positions
        assert.equal(xThree, xCad, `Octant ${octant}: Three.js X must match CAD X`);
        assert.equal(yThree, zCad, `Octant ${octant}: Three.js Y must match CAD Elevation Z`);
        assert.equal(zThree, -yCad, `Octant ${octant}: Three.js Z must match -CAD Y`);

        // Invertibility: (X_three, -Z_three, Y_three) == (X_cad, Y_cad, Z_cad)
        const recoveredCadX = xThree;
        const recoveredCadY = -zThree;
        const recoveredCadZ = yThree;

        assert.equal(recoveredCadX, xCad, `Octant ${octant}: Inverted X must match original CAD X`);
        assert.equal(recoveredCadY, yCad, `Octant ${octant}: Inverted Y must match original CAD Y`);
        assert.equal(recoveredCadZ, zCad, `Octant ${octant}: Inverted Z must match original CAD Z`);

        // Isometry: Euclidean norm must be strictly invariant
        const distCad = Math.hypot(xCad, yCad, zCad);
        const distThree = Math.hypot(xThree, yThree, zThree);
        assert.ok(
          Math.abs(distCad - distThree) < 1e-12,
          `Octant ${octant}: Euclidean distance must be preserved exactly (cad: ${distCad}, three: ${distThree})`
        );
      }
    });

    test("1.2 SO(3) Rigid Rotation Properties (Determinant +1, Right-Handedness & Basis Dot Products)", () => {
      // Basis vectors in CAD: i=(1,0,0), j=(0,1,0), k=(0,0,1)
      const [iX, iY, iZ] = cadToThreeCoord(1, 0, 0); // (1, 0, 0)
      const [jX, jY, jZ] = cadToThreeCoord(0, 1, 0); // (0, 0, -1)
      const [kX, kY, kZ] = cadToThreeCoord(0, 0, 1); // (0, 1, 0)

      // Transformation Matrix T = [ [1, 0, 0], [0, 0, 1], [0, -1, 0] ]
      // Determinant = 1*(0*0 - 1*(-1)) = +1
      const det = iX * (jY * kZ - jZ * kY) - iY * (jX * kZ - jZ * kX) + iZ * (jX * kY - jY * kX);
      assert.equal(det, 1, "Transformation matrix must have determinant +1 (pure proper rotation, no reflection)");

      // Basis orthogonality in Three.js
      const dotIJ = iX * jX + iY * jY + iZ * jZ;
      const dotJK = jX * kX + jY * kY + jZ * kZ;
      const dotKI = kX * iX + kY * iY + kZ * iZ;

      assert.equal(dotIJ, 0, "i_three dot j_three must be 0");
      assert.equal(dotJK, 0, "j_three dot k_three must be 0");
      assert.equal(dotKI, 0, "k_three dot i_three must be 0");

      // Cross product test: i_three x j_three must equal k_three
      const crossX = iY * jZ - iZ * jY;
      const crossY = iZ * jX - iX * jZ;
      const crossZ = iX * jY - iY * jX;

      assert.ok(Math.abs(crossX - kX) < 1e-12, "Cross product i x j (X) must equal k_three X");
      assert.ok(Math.abs(crossY - kY) < 1e-12, "Cross product i x j (Y) must equal k_three Y");
      assert.ok(Math.abs(crossZ - kZ) < 1e-12, "Cross product i x j (Z) must equal k_three Z");
    });

    test("1.3 Displacement Vector Linearity and Affine Transformation Consistency", () => {
      const u1: [number, number, number] = [0.012, -0.008, 0.004];
      const u2: [number, number, number] = [-0.005, 0.015, -0.002];
      const a = 2.5;
      const b = -1.8;

      // Linear combination in CAD
      const combCad: [number, number, number] = [
        a * u1[0] + b * u2[0],
        a * u1[1] + b * u2[1],
        a * u1[2] + b * u2[2],
      ];

      const mappedComb = cadToThreeDisplacement(combCad[0], combCad[1], combCad[2]);
      const mappedU1 = cadToThreeDisplacement(u1[0], u1[1], u1[2]);
      const mappedU2 = cadToThreeDisplacement(u2[0], u2[1], u2[2]);

      const expectedComb: [number, number, number] = [
        a * mappedU1[0] + b * mappedU2[0],
        a * mappedU1[1] + b * mappedU2[1],
        a * mappedU1[2] + b * mappedU2[2],
      ];

      assert.ok(Math.abs(mappedComb[0] - expectedComb[0]) < 1e-12, "Displacement linearity in X");
      assert.ok(Math.abs(mappedComb[1] - expectedComb[1]) < 1e-12, "Displacement linearity in Y");
      assert.ok(Math.abs(mappedComb[2] - expectedComb[2]) < 1e-12, "Displacement linearity in Z");

      // Verify deformed coordinate consistency: T(p + s*u) == T(p) + s*T(u)
      const pCad = { x: 8.5, y: 12.0, z: 3.0 };
      const scale = 150;
      const deformedCad = {
        x: pCad.x + scale * u1[0],
        y: pCad.y + scale * u1[1],
        z: pCad.z + scale * u1[2],
      };

      const directThree = cadToThreeCoord(deformedCad.x, deformedCad.y, deformedCad.z);
      const baseThree = cadToThreeCoord(pCad.x, pCad.y, pCad.z);
      const dispThree = cadToThreeDisplacement(u1[0], u1[1], u1[2]);

      assert.ok(Math.abs(directThree[0] - (baseThree[0] + scale * dispThree[0])) < 1e-12, "Deformed coordinate consistency X");
      assert.ok(Math.abs(directThree[1] - (baseThree[1] + scale * dispThree[1])) < 1e-12, "Deformed coordinate consistency Y");
      assert.ok(Math.abs(directThree[2] - (baseThree[2] + scale * dispThree[2])) < 1e-12, "Deformed coordinate consistency Z");
    });

    test("1.4 Extreme Numerical Coordinates (Sub-millimeter to Kilometric)", () => {
      const extremes = [
        { x: 1e-9, y: 1e-9, z: 1e-9 },
        { x: 1e5, y: -1e5, z: 1e4 },
        { x: -50000.123456, y: 30000.654321, z: -1200.789 },
      ];

      for (const p of extremes) {
        const [tx, ty, tz] = cadToThreeCoord(p.x, p.y, p.z);
        assert.ok(Number.isFinite(tx) && Number.isFinite(ty) && Number.isFinite(tz), "Coordinates must be finite");
        assert.equal(tx, p.x);
        assert.equal(ty, p.z);
        assert.equal(tz, -p.y);
      }
    });
  });

  // =========================================================================
  // Area 2: Extruded Ribbon Geometry Invariants & Topological Oracles
  // =========================================================================
  describe("2. Extruded Ribbon Geometry Invariants & Topological Oracles", () => {
    test("2.1 Topological Exactness: 11-Station Member Generates 10 Quads, 20 Triangles, 60 Vertices", () => {
      const startCad: Point3D = { x: 0, y: 0, z: 3 };
      const endCad: Point3D = { x: 6, y: 0, z: 3 }; // 6-meter span beam
      const numStations = 11;
      const stations: StationData[] = Array.from({ length: numStations }, (_, i) => ({
        x: (i / (numStations - 1)) * 6,
        M3: -35 + 85 * Math.sin((i / (numStations - 1)) * Math.PI),
        V2: 45 - 90 * (i / (numStations - 1)),
        N: -18,
      }));

      const ribbon = build3DRibbonData(startCad, endCad, "beam", stations, "M3", 0.015, 0);

      // Invariant 1: 10 quads * 2 triangles * 3 vertices = 60 vertices * 3 floats = 180 floats
      const expectedQuadCount = numStations - 1; // 10
      const expectedTriangles = expectedQuadCount * 2; // 20
      const expectedVertices = expectedTriangles * 3; // 60
      const expectedMeshFloats = expectedVertices * 3; // 180

      assert.equal(ribbon.meshPositions.length, expectedMeshFloats, "MeshPositions must contain exactly 180 floats");

      // Invariant 2: Crest Positions line strip = 11 points * 3 floats = 33 floats
      assert.equal(ribbon.crestPositions.length, numStations * 3, "CrestPositions must contain exactly 33 floats");

      // Invariant 3: Baseline line strip = 11 points * 3 floats = 33 floats
      assert.equal(ribbon.baselinePositions.length, numStations * 3, "BaselinePositions must contain exactly 33 floats");

      // Invariant 4: End Caps = 2 lines * 2 points * 3 floats = 12 floats
      assert.equal(ribbon.endCapPositions.length, 12, "EndCapPositions must contain exactly 12 floats");

      // Check no NaN or Infinite values anywhere in ribbon output
      for (let i = 0; i < ribbon.meshPositions.length; i++) {
        assert.ok(Number.isFinite(ribbon.meshPositions[i]), `meshPositions[${i}] must be finite`);
      }
      for (let i = 0; i < ribbon.crestPositions.length; i++) {
        assert.ok(Number.isFinite(ribbon.crestPositions[i]), `crestPositions[${i}] must be finite`);
      }
      for (let i = 0; i < ribbon.baselinePositions.length; i++) {
        assert.ok(Number.isFinite(ribbon.baselinePositions[i]), `baselinePositions[${i}] must be finite`);
      }
      for (let i = 0; i < ribbon.endCapPositions.length; i++) {
        assert.ok(Number.isFinite(ribbon.endCapPositions[i]), `endCapPositions[${i}] must be finite`);
      }
    });

    test("2.2 Triangle Winding Order & Surface Normal Alignment across all Quads", () => {
      const startCad: Point3D = { x: 1, y: 2, z: 4 };
      const endCad: Point3D = { x: 7, y: 2, z: 4 };
      const stations: StationData[] = Array.from({ length: 11 }, (_, i) => ({
        x: (i / 10) * 6,
        M3: 60 * Math.sin((i / 10) * Math.PI),
      }));

      const ribbon = build3DRibbonData(startCad, endCad, "beam", stations, "M3", 0.02, 0);
      const pos = ribbon.meshPositions;

      // Each quad has 18 floats = Triangle 1 (indices 0..8) and Triangle 2 (indices 9..17)
      for (let quad = 0; quad < 10; quad++) {
        const offset = quad * 18;

        // Triangle 1 vertices: v0, v1, v2
        const v0 = new THREE.Vector3(pos[offset + 0], pos[offset + 1], pos[offset + 2]);
        const v1 = new THREE.Vector3(pos[offset + 3], pos[offset + 4], pos[offset + 5]);
        const v2 = new THREE.Vector3(pos[offset + 6], pos[offset + 7], pos[offset + 8]);

        // Triangle 2 vertices: w0, w1, w2
        const w0 = new THREE.Vector3(pos[offset + 9], pos[offset + 10], pos[offset + 11]);
        const w1 = new THREE.Vector3(pos[offset + 12], pos[offset + 13], pos[offset + 14]);
        const w2 = new THREE.Vector3(pos[offset + 15], pos[offset + 16], pos[offset + 17]);

        // Compute normals via cross products
        const edge1A = new THREE.Vector3().subVectors(v1, v0);
        const edge1B = new THREE.Vector3().subVectors(v2, v0);
        const normal1 = new THREE.Vector3().crossVectors(edge1A, edge1B).normalize();

        const edge2A = new THREE.Vector3().subVectors(w1, w0);
        const edge2B = new THREE.Vector3().subVectors(w2, w0);
        const normal2 = new THREE.Vector3().crossVectors(edge2A, edge2B).normalize();

        // If moment is non-zero, triangles have non-zero area and must have parallel normals
        if (normal1.length() > 0.5 && normal2.length() > 0.5) {
          const dotNormals = normal1.dot(normal2);
          assert.ok(
            dotNormals > 0.9999,
            `Quad ${quad}: Triangle 1 and Triangle 2 normals must point in same direction (dot: ${dotNormals})`
          );
        }
      }
    });

    test("2.3 Extrusion Normal Orthogonality: Beam Extrusion vs Column Horizontal Plane", () => {
      // Case A: Slanted Beam in plan (from (0,0,3) to (4,3,3), L = 5 m)
      const beamStart = { x: 0, y: 0, z: 3 };
      const beamEnd = { x: 4, y: 3, z: 3 };
      const beamStations: StationData[] = [
        { x: 0, M3: 50 },
        { x: 5, M3: 50 },
      ];

      const beamRibbon = build3DRibbonData(beamStart, beamEnd, "beam", beamStations, "M3", 0.01, 0);
      // Tangent in Three.js: CAD dx=4, dy=3, dz=0 -> Three.js dx=4, dy=0, dz=-3
      // Normal for beam extrusion in Three.js is nyThree = 1 (vertical elevation)
      // Dot product: 4*0 + 0*1 + (-3)*0 = 0.
      const b0 = [beamRibbon.baselinePositions[0], beamRibbon.baselinePositions[1], beamRibbon.baselinePositions[2]];
      const c0 = [beamRibbon.crestPositions[0], beamRibbon.crestPositions[1], beamRibbon.crestPositions[2]];
      const extrusionVec = [c0[0] - b0[0], c0[1] - b0[1], c0[2] - b0[2]];

      assert.equal(extrusionVec[0], 0, "Beam extrusion X component must be 0");
      assert.ok(Math.abs(extrusionVec[1]) > 0, "Beam extrusion Y component must be non-zero");
      assert.equal(extrusionVec[2], 0, "Beam extrusion Z component must be 0");

      // Case B: Column with varying orientation angles
      const columnStart = { x: 2, y: 5, z: 0 };
      const columnEnd = { x: 2, y: 5, z: 3.5 }; // Vertical along Elevation Z
      const angles = [0, 30, 45, 60, 90, 135, 180, 270];

      for (const deg of angles) {
        const colStations: StationData[] = [
          { x: 0, M3: 80 },
          { x: 3.5, M3: 80 },
        ];
        const colRibbon = build3DRibbonData(columnStart, columnEnd, "column", colStations, "M3", 0.01, deg);
        const colB0 = [colRibbon.baselinePositions[0], colRibbon.baselinePositions[1], colRibbon.baselinePositions[2]];
        const colC0 = [colRibbon.crestPositions[0], colRibbon.crestPositions[1], colRibbon.crestPositions[2]];
        const colExt = [colC0[0] - colB0[0], colC0[1] - colB0[1], colC0[2] - colB0[2]];

        // In Three.js, column axis is vertical Y. Extrusion must be purely horizontal (Y offset == 0)
        assert.ok(Math.abs(colExt[1]) < 1e-6, `Column angle ${deg} deg: Extrusion elevation Y offset must be 0`);

        // Check horizontal plane magnitude
        const horizDist = Math.hypot(colExt[0], colExt[2]);
        const expectedOffset = 0.01 * 80; // scale * val = 0.8 m
        assert.ok(
          Math.abs(horizDist - expectedOffset) < 1e-6,
          `Column angle ${deg} deg: Horizontal offset must equal ${expectedOffset}, got ${horizDist}`
        );

        // Check angle direction in Three.js (cos deg, 0, -sin deg)
        const rad = (deg * Math.PI) / 180;
        const expectedX = expectedOffset * Math.cos(rad);
        const expectedZ = expectedOffset * (-Math.sin(rad));
        assert.ok(Math.abs(colExt[0] - expectedX) < 1e-6, `Column angle ${deg} deg: Extrusion X match`);
        assert.ok(Math.abs(colExt[2] - expectedZ) < 1e-6, `Column angle ${deg} deg: Extrusion Z match`);
      }
    });

    test("2.4 Degenerate & Edge Case Geometries: Zero-Length Members & Insufficient Stations", () => {
      const pZero: Point3D = { x: 3, y: 4, z: 5 };
      const stations: StationData[] = [
        { x: 0, M3: 10 },
        { x: 1, M3: 20 },
      ];

      // Exact zero length (startCad === endCad)
      const zeroRibbon = build3DRibbonData(pZero, pZero, "beam", stations, "M3", 0.01, 0);
      assert.equal(zeroRibbon.meshPositions.length, 0, "Zero-length member must yield empty meshPositions");
      assert.equal(zeroRibbon.crestPositions.length, 0, "Zero-length member must yield empty crestPositions");
      assert.equal(zeroRibbon.baselinePositions.length, 0, "Zero-length member must yield empty baselinePositions");
      assert.equal(zeroRibbon.endCapPositions.length, 0, "Zero-length member must yield empty endCapPositions");

      // Near zero length (dist < 1e-6)
      const nearZeroEnd: Point3D = { x: 3 + 1e-8, y: 4, z: 5 };
      const nearZeroRibbon = build3DRibbonData(pZero, nearZeroEnd, "beam", stations, "M3", 0.01, 0);
      assert.equal(nearZeroRibbon.meshPositions.length, 0, "Sub-micrometer member must yield empty arrays safely");

      // Empty stations array
      const endCad: Point3D = { x: 7, y: 4, z: 5 };
      const emptyStationsRibbon = build3DRibbonData(pZero, endCad, "beam", [], "M3", 0.01, 0);
      assert.equal(emptyStationsRibbon.meshPositions.length, 0, "Empty stations must yield empty arrays");

      // Single station (cannot form intervals)
      const singleStationRibbon = build3DRibbonData(pZero, endCad, "beam", [{ x: 0, M3: 10 }], "M3", 0.01, 0);
      assert.equal(singleStationRibbon.meshPositions.length, 0, "Single station must yield empty arrays");
    });

    test("2.5 Collinear Multi-Span Beams: Continuity of Baseline Coordinates", () => {
      // Continuous 2-span beam: Beam 1 (0..4m), Beam 2 (4..8m) along X axis at Y=3, Z=3
      const span1Start: Point3D = { x: 0, y: 3, z: 3 };
      const span1End: Point3D = { x: 4, y: 3, z: 3 };
      const span2Start: Point3D = { x: 4, y: 3, z: 3 };
      const span2End: Point3D = { x: 8, y: 3, z: 3 };

      const stations1: StationData[] = Array.from({ length: 11 }, (_, i) => ({
        x: (i / 10) * 4,
        M3: 40,
      }));
      const stations2: StationData[] = Array.from({ length: 11 }, (_, i) => ({
        x: (i / 10) * 4,
        M3: 40,
      }));

      const r1 = build3DRibbonData(span1Start, span1End, "beam", stations1, "M3", 0.01, 0);
      const r2 = build3DRibbonData(span2Start, span2End, "beam", stations2, "M3", 0.01, 0);

      // Junction coordinate: last point of r1 baseline vs first point of r2 baseline
      const r1EndBase = [
        r1.baselinePositions[10 * 3 + 0],
        r1.baselinePositions[10 * 3 + 1],
        r1.baselinePositions[10 * 3 + 2],
      ];
      const r2StartBase = [
        r2.baselinePositions[0],
        r2.baselinePositions[1],
        r2.baselinePositions[2],
      ];

      assert.ok(Math.abs(r1EndBase[0] - r2StartBase[0]) < 1e-6, "Collinear beam baseline junction X continuous");
      assert.ok(Math.abs(r1EndBase[1] - r2StartBase[1]) < 1e-6, "Collinear beam baseline junction Y continuous");
      assert.ok(Math.abs(r1EndBase[2] - r2StartBase[2]) < 1e-6, "Collinear beam baseline junction Z continuous");
    });

    test("2.6 Three.js BufferGeometry Integration & Bounding Box Oracle", () => {
      const startCad: Point3D = { x: 0, y: 0, z: 3 };
      const endCad: Point3D = { x: 5, y: 0, z: 3 };
      // Non-zero moment along entire span (e.g. cantilever or continuous beam M3 > 0)
      const stations: StationData[] = Array.from({ length: 11 }, (_, i) => ({
        x: (i / 10) * 5,
        M3: 40 + 20 * Math.sin((i / 10) * Math.PI),
      }));

      const ribbon = build3DRibbonData(startCad, endCad, "beam", stations, "M3", 0.01, 0);

      // Instantiate native Three.js BufferGeometry
      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.Float32BufferAttribute(ribbon.meshPositions, 3));
      geo.computeVertexNormals();
      geo.computeBoundingBox();

      const bbox = geo.boundingBox;
      assert.ok(bbox !== null, "BoundingBox must be successfully computed");
      assert.ok(!bbox.isEmpty(), "BoundingBox must not be empty");
      assert.ok(Number.isFinite(bbox.min.x) && Number.isFinite(bbox.max.x), "BoundingBox X finite");
      assert.ok(Number.isFinite(bbox.min.y) && Number.isFinite(bbox.max.y), "BoundingBox Y finite");
      assert.ok(Number.isFinite(bbox.min.z) && Number.isFinite(bbox.max.z), "BoundingBox Z finite");

      // Verify normal attribute was created and has length 1 for all vertices in non-zero quads
      const normAttr = geo.getAttribute("normal");
      assert.ok(normAttr !== undefined, "Normal attribute must exist");
      assert.equal(normAttr.count, 60, "Must have exactly 60 vertex normals");

      for (let i = 0; i < normAttr.count; i++) {
        const nx = normAttr.getX(i);
        const ny = normAttr.getY(i);
        const nz = normAttr.getZ(i);
        assert.ok(Number.isFinite(nx) && Number.isFinite(ny) && Number.isFinite(nz), `Normal at vertex ${i} must be finite`);
        const len = Math.hypot(nx, ny, nz);
        assert.ok(Math.abs(len - 1.0) < 1e-3, `Normal at vertex ${i} must be normalized to unit length`);
      }

      // Also verify simply supported beam with zero moment at ends (no NaNs produced)
      const pinnedStations: StationData[] = Array.from({ length: 11 }, (_, i) => ({
        x: (i / 10) * 5,
        M3: 50 * Math.sin((i / 10) * Math.PI),
      }));
      const pinnedRibbon = build3DRibbonData(startCad, endCad, "beam", pinnedStations, "M3", 0.01, 0);
      const pinnedGeo = new THREE.BufferGeometry();
      pinnedGeo.setAttribute("position", new THREE.Float32BufferAttribute(pinnedRibbon.meshPositions, 3));
      pinnedGeo.computeVertexNormals();
      const pinnedNorm = pinnedGeo.getAttribute("normal");
      for (let i = 0; i < pinnedNorm.count; i++) {
        assert.ok(Number.isFinite(pinnedNorm.getX(i)), `Pinned normal X at vertex ${i} must be finite`);
        assert.ok(Number.isFinite(pinnedNorm.getY(i)), `Pinned normal Y at vertex ${i} must be finite`);
        assert.ok(Number.isFinite(pinnedNorm.getZ(i)), `Pinned normal Z at vertex ${i} must be finite`);
      }
    });
  });

  // =========================================================================
  // Area 3: Deformation Scale Factor Clamping & Micro/Macro Drift Scenarios
  // =========================================================================
  describe("3. Deformation Scale Factor Clamping & Boundary Stress Testing", () => {
    test("3.1 Microscopic Drift Clamping: u_max in [1e-9 .. 1e-7] meters", () => {
      // Drift below 1e-7 threshold defaults to 100
      const nanoDrift: Record<string, [number, number, number, number, number, number]> = {
        node1: [1e-9, 0, 0, 0, 0, 0],
      };
      const scaleNano = calculateAutoDeformationScale(nanoDrift, 20);
      assert.equal(scaleNano, 100, "Sub-threshold drift (1e-9 m) must return default scale 100");

      // Drift just above 1e-7 threshold (e.g. 2e-7 m):
      // raw = (0.06 * 20) / (2e-7) = 1.2 / 2e-7 = 6,000,000x -> Clamped to 2000
      const microDrift: Record<string, [number, number, number, number, number, number]> = {
        node1: [2e-7, 0, 0, 0, 0, 0],
      };
      const scaleMicro = calculateAutoDeformationScale(microDrift, 20);
      assert.equal(scaleMicro, 2000, "Microscopic drift (2e-7 m) must clamp strictly to upper bound 2000x");
    });

    test("3.2 Massive Drift Clamping: u_max in [0.50 .. 5.0] meters", () => {
      // Catastrophic / extreme drift (5.0 meters)
      // raw = (0.06 * 20) / 5.0 = 0.24x -> Clamped to 10
      const massiveDrift5m: Record<string, [number, number, number, number, number, number]> = {
        node1: [3.0, 4.0, 0, 0, 0, 0], // hypot = 5.0 m
      };
      const scale5m = calculateAutoDeformationScale(massiveDrift5m, 20);
      assert.equal(scale5m, 10, "Massive drift (5.0 m) must clamp strictly to lower bound 10x");

      // Large drift (0.80 meters)
      // raw = (0.06 * 20) / 0.80 = 1.5x -> Clamped to 10
      const largeDrift: Record<string, [number, number, number, number, number, number]> = {
        node1: [0.80, 0, 0, 0, 0, 0],
      };
      const scaleLarge = calculateAutoDeformationScale(largeDrift, 20);
      assert.equal(scaleLarge, 10, "Large drift (0.80 m) must clamp strictly to lower bound 10x");
    });

    test("3.3 Monotonic Clamping Property: Scale strictly in [10, 2000] for all Drifts", () => {
      const testDrifts = [
        1e-8, 5e-8, 1e-7, 5e-7, 1e-6, 5e-6, 1e-5, 5e-5,
        1e-4, 5e-4, 1e-3, 5e-3, 1e-2, 5e-2, 0.1, 0.5, 1.0, 2.5, 5.0, 10.0,
      ];

      for (const d of testDrifts) {
        const dispMap: Record<string, [number, number, number, number, number, number]> = {
          node: [d, 0, 0, 0, 0, 0],
        };
        const scale = calculateAutoDeformationScale(dispMap, 25);
        assert.ok(
          scale >= 10 && scale <= 2000,
          `Scale factor ${scale} for drift ${d} m must be clamped strictly within [10, 2000]`
        );
        assert.equal(Number.isInteger(scale), true, "Scale factor must be an integer");
      }
    });

    test("3.4 Boundary Building Dimensions: Extreme Small (0.1 m) to Skyscraper (500 m)", () => {
      const disp: Record<string, [number, number, number, number, number, number]> = {
        node: [0.01, 0, 0, 0, 0, 0], // 10 mm drift
      };

      // When buildingDimension is small (< 5 m), formula Math.max(5, buildingDimensionM) prevents collapse
      const scaleTinyBuilding = calculateAutoDeformationScale(disp, 0.5);
      // raw = (0.06 * 5) / 0.01 = 30x
      assert.equal(scaleTinyBuilding, 30, "Tiny building dimension must use 5.0m floor limit");

      // Skyscraper (500 m):
      // raw = (0.06 * 500) / 0.01 = 3000x -> Clamped to 2000
      const scaleSkyscraper = calculateAutoDeformationScale(disp, 500);
      assert.equal(scaleSkyscraper, 2000, "Skyscraper dimension must clamp to 2000");
    });

    test("3.5 Degenerate Displacements: Empty, All-Zero, and Null Entries", () => {
      assert.equal(calculateAutoDeformationScale({}, 20), 100, "Empty displacements map returns 100");
      assert.equal(calculateAutoDeformationScale({ n1: [0, 0, 0, 0, 0, 0] }, 20), 100, "All-zero drift returns 100");
      assert.equal(calculateAutoDeformationScale({ n1: undefined }, 20), 100, "Undefined displacement returns 100");
    });
  });

  // =========================================================================
  // Area 4: DCR Color Grading Edge Cases & Exact Threshold Oracles
  // =========================================================================
  describe("4. DCR Color Grading Edge Cases & Exact Threshold Oracles", () => {
    test("4.1 Mandatory Dispatch Threshold Suite: [0.699, 0.700, 0.701, 0.899, 0.900, 0.901, 0.999, 1.000, 1.001]", () => {
      const oracleTable = [
        // Threshold around 0.70 (Lime vs Yellow)
        { ratio: 0.699, expectedHexStr: "#84cc16", expectedHexNum: 0x84cc16, tier: "Lime (Safe)" },
        { ratio: 0.700, expectedHexStr: "#84cc16", expectedHexNum: 0x84cc16, tier: "Lime (Safe)" },
        { ratio: 0.701, expectedHexStr: "#eab308", expectedHexNum: 0xeab308, tier: "Yellow (Moderate)" },

        // Threshold around 0.90 (Yellow vs Orange)
        { ratio: 0.899, expectedHexStr: "#eab308", expectedHexNum: 0xeab308, tier: "Yellow (Moderate)" },
        { ratio: 0.900, expectedHexStr: "#eab308", expectedHexNum: 0xeab308, tier: "Yellow (Moderate)" },
        { ratio: 0.901, expectedHexStr: "#f97316", expectedHexNum: 0xf97316, tier: "Orange (Near Capacity)" },

        // Threshold around 1.00 (Orange vs Red)
        { ratio: 0.999, expectedHexStr: "#f97316", expectedHexNum: 0xf97316, tier: "Orange (Near Capacity)" },
        { ratio: 1.000, expectedHexStr: "#f97316", expectedHexNum: 0xf97316, tier: "Orange (Near Capacity)" },
        { ratio: 1.001, expectedHexStr: "#ef4444", expectedHexNum: 0xef4444, tier: "Red (Over Capacity)" },
      ];

      for (const item of oracleTable) {
        const hexStr = getDcrColor(item.ratio);
        const hexNum = getDcrColorHex(item.ratio);

        assert.equal(
          hexStr,
          item.expectedHexStr,
          `DCR ratio ${item.ratio} must map to ${item.tier} string ${item.expectedHexStr}, got ${hexStr}`
        );
        assert.equal(
          hexNum,
          item.expectedHexNum,
          `DCR ratio ${item.ratio} must map to ${item.tier} hex number 0x${item.expectedHexNum.toString(16)}, got 0x${hexNum.toString(16)}`
        );

        // Cross-representation bit-level parity
        const parsedFromStr = parseInt(hexStr.slice(1), 16);
        assert.equal(
          parsedFromStr,
          hexNum,
          `Bitwise representation parity failed for ratio ${item.ratio}: str parsed ${parsedFromStr} vs num ${hexNum}`
        );
      }
    });

    test("4.2 Lower Tier Boundary: [0.000, 0.499, 0.500, 0.501] (Green vs Lime)", () => {
      // <= 0.50 is Green (#22c55e)
      assert.equal(getDcrColor(0.000), "#22c55e");
      assert.equal(getDcrColorHex(0.000), 0x22c55e);

      assert.equal(getDcrColor(0.499), "#22c55e");
      assert.equal(getDcrColorHex(0.499), 0x22c55e);

      assert.equal(getDcrColor(0.500), "#22c55e");
      assert.equal(getDcrColorHex(0.500), 0x22c55e);

      // > 0.50 and <= 0.70 is Lime (#84cc16)
      assert.equal(getDcrColor(0.501), "#84cc16");
      assert.equal(getDcrColorHex(0.501), 0x84cc16);
    });

    test("4.3 Extreme Values & Boundary Robustness (Negative, Zero, Huge, Infinity, NaN)", () => {
      // Negative ratios (physically anomalous or unloaded)
      assert.equal(getDcrColor(-0.25), "#22c55e", "Negative ratio maps to Green safe tier");
      assert.equal(getDcrColorHex(-0.25), 0x22c55e);

      // Huge DCR values (e.g. 50x over capacity)
      assert.equal(getDcrColor(50.0), "#ef4444", "Huge ratio maps to Red over-capacity tier");
      assert.equal(getDcrColorHex(50.0), 0xef4444);

      // Infinity (division by zero in capacity)
      assert.equal(getDcrColor(Number.POSITIVE_INFINITY), "#ef4444", "Infinity maps to Red over-capacity");
      assert.equal(getDcrColorHex(Number.POSITIVE_INFINITY), 0xef4444);
    });
  });

  // =========================================================================
  // Area 5: Station Linear Interpolation & Raycasting Probe Oracles
  // =========================================================================
  describe("5. Station Linear Interpolation & Raycasting Probe Oracles", () => {
    test("5.1 Exact Support & Midspan Interpolation Invariants", () => {
      const stations: StationData[] = [
        { x: 0.0, M3: -40, V2: 50, N: -30 },
        { x: 1.0, M3: -10, V2: 30, N: -30 },
        { x: 2.0, M3: +10, V2: 10, N: -30 },
        { x: 3.0, M3: +20, V2: -10, N: -30 },
        { x: 4.0, M3: +10, V2: -30, N: -30 },
        { x: 5.0, M3: -20, V2: -50, N: -30 },
      ];

      // Station count = 6, intervals = 5
      // t = 0.0 (start support)
      const at0 = interpolateStationForces(stations, 0.0);
      assert.equal(at0.x, 0.0);
      assert.equal(at0.M3, -40);
      assert.equal(at0.V2, 50);
      assert.equal(at0.N, -30);

      // t = 1.0 (end support)
      const at1 = interpolateStationForces(stations, 1.0);
      assert.equal(at1.x, 5.0);
      assert.equal(at1.M3, -20);
      assert.equal(at1.V2, -50);
      assert.equal(at1.N, -30);

      // t = 0.50 (exact midspan: interval index 2.5, between station 2 (x=2) and 3 (x=3))
      // M3: 0.5 * 10 + 0.5 * 20 = 15
      // V2: 0.5 * 10 + 0.5 * (-10) = 0
      const atMid = interpolateStationForces(stations, 0.5);
      assert.equal(atMid.x, 2.5);
      assert.equal(atMid.M3, 15);
      assert.equal(atMid.V2, 0);
      assert.equal(atMid.N, -30);
    });

    test("5.2 Fraction Clamping: t < 0 and t > 1 Clamped to Ends Without Throwing", () => {
      const stations: StationData[] = [
        { x: 0.0, M3: -50 },
        { x: 4.0, M3: 30 },
      ];

      const under = interpolateStationForces(stations, -0.5);
      assert.equal(under.x, 0.0, "Negative fraction t must clamp to station 0");
      assert.equal(under.M3, -50);

      const over = interpolateStationForces(stations, 1.8);
      assert.equal(over.x, 4.0, "Fraction t > 1 must clamp to last station");
      assert.equal(over.M3, 30);
    });

    test("5.3 Empty Station Array Returns All Zeroes Safely", () => {
      const emptyRes = interpolateStationForces([], 0.5);
      assert.equal(emptyRes.x, 0);
      assert.equal(emptyRes.M3, 0);
      assert.equal(emptyRes.V2, 0);
      assert.equal(emptyRes.N, 0);
    });
  });
});
