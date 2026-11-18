import test from "node:test";
import assert from "node:assert/strict";
import {
  createStraightSegment,
  createArcSegment,
  createCenterlineGeometry,
  createDeclaredFabricationGeometry,
  computeBarMetrics,
  computeReinforcementSchedule,
  formatScheduleSummary,
  type BarInput,
  type ExpectedElement,
  type ExplicitZeroElement
} from "../../src/lib/hsyncad/structural/reinforcement-schedule.js";

// Canonical steel density reference
const RHO_STEEL = 7850; // kg/m^3

test("P15: closed form straight bar geometry and mass match independent physical formula", () => {
  // Line from (0,0,0) to (3,4,0) -> L = 5.0 m
  const seg = createStraightSegment([0, 0, 0], [3, 4, 0]);
  assert.equal(seg.kind, "straight");
  assert.equal(seg.lengthM, 5);

  const geom = createCenterlineGeometry([seg]);
  assert.equal(geom.kind, "centerline");
  assert.equal(geom.totalLengthM, 5);

  // phi 16 mm, count 4, density 7850 kg/m^3
  // d = 0.016 m, A = pi * 0.016^2 / 4 = 0.00020106192982974676 m^2
  // unit mass = A * 7850 * 5 = 7.89168074581756 kg
  // total length = 20 m
  // total mass = 4 * 7.89168074581756 = 31.56672298327024 kg
  const bar: BarInput = {
    id: "bar-straight-1",
    elementId: "K101",
    floorId: "1F",
    elementType: "beam",
    role: "main_bottom",
    materialId: "B420C",
    diameterMm: 16,
    count: 4,
    steelDensityKgPerM3: RHO_STEEL,
    geometry: geom,
    mode: "verification",
    layoutRevisionId: "rev-001"
  };

  const computed = computeBarMetrics(bar);
  assert.equal(computed.unitLengthM, 5);
  assert.equal(computed.totalLengthM, 20);

  const expectedUnitMass = ((Math.PI * 0.016 * 0.016) / 4) * RHO_STEEL * 5;
  assert.ok(Math.abs(computed.unitMassKg - expectedUnitMass) < 1e-9);
  assert.ok(Math.abs(computed.totalMassKg - expectedUnitMass * 4) < 1e-9);
  assert.ok(Math.abs(computed.totalMassKg - 31.56672298) < 1e-6);
});

test("P15: multi-segment bent bar including arc contribution matches independent geometry", () => {
  // Straight 2.0 m + 90 deg bend (R = 0.1 m) + Straight 1.0 m
  const seg1 = createStraightSegment([0, 0, 0], [2, 0, 0]); // L = 2.0
  const seg2 = createArcSegment([2, 0, 0], [2.1, 0.1, 0], 0.1, Math.PI / 2); // R*theta = 0.1 * pi/2 = 0.05 * pi
  const seg3 = createStraightSegment([2.1, 0.1, 0], [2.1, 1.1, 0]); // L = 1.0

  const geom = createCenterlineGeometry([seg1, seg2, seg3]);
  const expectedTotalLength = 2.0 + 0.1 * (Math.PI / 2) + 1.0;
  assert.ok(Math.abs(geom.totalLengthM - expectedTotalLength) < 1e-12);

  // phi 12 mm, count 2, density 7850
  const bar: BarInput = {
    id: "bar-bent-1",
    elementId: "K102",
    floorId: "1F",
    elementType: "beam",
    role: "stirrup",
    materialId: "B420C",
    diameterMm: 12,
    count: 2,
    steelDensityKgPerM3: RHO_STEEL,
    geometry: geom,
    mode: "verification",
    layoutRevisionId: "rev-001"
  };

  const computed = computeBarMetrics(bar);
  assert.ok(Math.abs(computed.unitLengthM - expectedTotalLength) < 1e-12);
  assert.ok(Math.abs(computed.totalLengthM - expectedTotalLength * 2) < 1e-12);

  const expectedUnitMass = ((Math.PI * 0.012 * 0.012) / 4) * RHO_STEEL * expectedTotalLength;
  assert.ok(Math.abs(computed.unitMassKg - expectedUnitMass) < 1e-9);
  assert.ok(Math.abs(computed.totalMassKg - expectedUnitMass * 2) < 1e-9);
});

test("P15: explicit lap and hook geometry mutations cleanly alter total physical length", () => {
  const seg = createStraightSegment([0, 0, 0], [4, 0, 0]); // L = 4.0 m

  const baseGeom = createCenterlineGeometry([seg]);
  assert.equal(baseGeom.totalLengthM, 4);

  const geomWithHooks = createCenterlineGeometry([seg], {
    startHookM: 0.15,
    endHookM: 0.2
  });
  assert.equal(geomWithHooks.totalLengthM, 4.35);

  const geomWithLap = createCenterlineGeometry([seg], {
    startHookM: 0.15,
    endHookM: 0.2,
    lapLengthM: 0.8
  });
  assert.equal(geomWithLap.totalLengthM, 5.15);

  // Lap mutation: incrementing lap by 0.25 m increases total length by exactly 0.25 m
  const mutatedLap = createCenterlineGeometry([seg], {
    startHookM: 0.15,
    endHookM: 0.2,
    lapLengthM: 0.8 + 0.25
  });
  assert.ok(Math.abs(mutatedLap.totalLengthM - (geomWithLap.totalLengthM + 0.25)) < 1e-12);
});

test("P15: physical mass scaling laws (diameter^2, count, length, density)", () => {
  const seg1 = createStraightSegment([0, 0, 0], [1, 0, 0]);
  const geom1 = createCenterlineGeometry([seg1]);

  const baseBar: BarInput = {
    id: "scale-base",
    elementId: "S101",
    floorId: "1F",
    elementType: "column",
    role: "longitudinal",
    materialId: "B420C",
    diameterMm: 10,
    count: 2,
    steelDensityKgPerM3: 7850,
    geometry: geom1,
    mode: "verification",
    layoutRevisionId: "rev-scale"
  };

  const baseRes = computeBarMetrics(baseBar);

  // 1. Diameter scaling: doubling diameter from 10 mm to 20 mm must quadruple mass (d^2)
  const barD20: BarInput = { ...baseBar, id: "scale-d20", diameterMm: 20 };
  const resD20 = computeBarMetrics(barD20);
  assert.ok(Math.abs(resD20.unitMassKg / baseRes.unitMassKg - 4) < 1e-9);
  assert.ok(Math.abs(resD20.totalMassKg / baseRes.totalMassKg - 4) < 1e-9);

  // 2. Count scaling: tripling count from 2 to 6 must triple total mass and total length
  const barCount6: BarInput = { ...baseBar, id: "scale-count6", count: 6 };
  const resCount6 = computeBarMetrics(barCount6);
  assert.ok(Math.abs(resCount6.totalLengthM / baseRes.totalLengthM - 3) < 1e-9);
  assert.ok(Math.abs(resCount6.totalMassKg / baseRes.totalMassKg - 3) < 1e-9);

  // 3. Length scaling: doubling length from 1 m to 2 m must double unit and total mass
  const seg2 = createStraightSegment([0, 0, 0], [2, 0, 0]);
  const geom2 = createCenterlineGeometry([seg2]);
  const barLen2: BarInput = { ...baseBar, id: "scale-len2", geometry: geom2 };
  const resLen2 = computeBarMetrics(barLen2);
  assert.ok(Math.abs(resLen2.unitMassKg / baseRes.unitMassKg - 2) < 1e-9);
  assert.ok(Math.abs(resLen2.totalMassKg / baseRes.totalMassKg - 2) < 1e-9);

  // 4. Density scaling: density increased to 8000 kg/m^3
  const barDensity: BarInput = { ...baseBar, id: "scale-rho", steelDensityKgPerM3: 8000 };
  const resDensity = computeBarMetrics(barDensity);
  assert.ok(Math.abs(resDensity.unitMassKg / baseRes.unitMassKg - 8000 / 7850) < 1e-9);
});

test("P15: stable bar ID and element/floor ownership distinguish bars across floors", () => {
  const geom = createCenterlineGeometry([createStraightSegment([0, 0, 0], [3, 0, 0])]);

  // Bar with same ID "bar-1" on 1F and 2F
  const bar1F: BarInput = {
    id: "bar-1",
    elementId: "K101",
    floorId: "1F",
    elementType: "beam",
    role: "main_bottom",
    materialId: "B420C",
    diameterMm: 16,
    count: 2,
    steelDensityKgPerM3: RHO_STEEL,
    geometry: geom,
    mode: "verification",
    layoutRevisionId: "rev-multi-floor"
  };

  const bar2F: BarInput = {
    id: "bar-1",
    elementId: "K201",
    floorId: "2F",
    elementType: "beam",
    role: "main_bottom",
    materialId: "B420C",
    diameterMm: 16,
    count: 3,
    steelDensityKgPerM3: RHO_STEEL,
    geometry: geom,
    mode: "verification",
    layoutRevisionId: "rev-multi-floor"
  };

  const sched = computeReinforcementSchedule({
    bars: [bar1F, bar2F],
    projectRevisionId: "rev-multi-floor"
  });

  assert.equal(sched.uniqueBars.length, 2);
  assert.equal(sched.deduplicatedCount, 0);
  assert.equal(sched.subtotalsByFloor.length, 2);
  assert.equal(sched.subtotalsByFloor[0].floorId, "1F");
  assert.equal(sched.subtotalsByFloor[0].barCount, 2);
  assert.equal(sched.subtotalsByFloor[1].floorId, "2F");
  assert.equal(sched.subtotalsByFloor[1].barCount, 3);
});

test("P15: exact duplicate bar is deduplicated, while conflicting duplicate throws", () => {
  const geom = createCenterlineGeometry([createStraightSegment([0, 0, 0], [3, 0, 0])]);

  const barOriginal: BarInput = {
    id: "dup-bar",
    elementId: "K101",
    floorId: "1F",
    elementType: "beam",
    role: "main_bottom",
    materialId: "B420C",
    diameterMm: 14,
    count: 3,
    steelDensityKgPerM3: RHO_STEEL,
    geometry: geom,
    mode: "verification",
    layoutRevisionId: "rev-dup"
  };

  // Exact duplicate
  const barExact = { ...barOriginal };

  const sched = computeReinforcementSchedule({
    bars: [barOriginal, barExact],
    projectRevisionId: "rev-dup"
  });

  assert.equal(sched.uniqueBars.length, 1);
  assert.equal(sched.deduplicatedCount, 1);

  // Conflicting duplicate (different diameter)
  const barConflict = { ...barOriginal, diameterMm: 16 };

  assert.throws(
    () => {
      computeReinforcementSchedule({
        bars: [barOriginal, barConflict],
        projectRevisionId: "rev-dup"
      });
    },
    /Conflicting duplicate bar definition/
  );
});

test("P15: coverage registry separates missing group/unknown from explicit zero", () => {
  const geom = createCenterlineGeometry([createStraightSegment([0, 0, 0], [3, 0, 0])]);

  const bar1: BarInput = {
    id: "b1",
    elementId: "K101",
    floorId: "1F",
    elementType: "beam",
    role: "main_bottom",
    materialId: "B420C",
    diameterMm: 16,
    count: 2,
    steelDensityKgPerM3: RHO_STEEL,
    geometry: geom,
    mode: "verification",
    layoutRevisionId: "rev-cov"
  };

  const expected: ExpectedElement[] = [
    { elementId: "K101", floorId: "1F", elementType: "beam" },
    { elementId: "K102", floorId: "1F", elementType: "beam" },
    { elementId: "K103", floorId: "1F", elementType: "beam" }
  ];

  // Case A: K102 is explicit zero (verified unreinforced), K103 is unknown/missing
  const explicitZeros: ExplicitZeroElement[] = [
    {
      elementId: "K102",
      floorId: "1F",
      reason: "Unreinforced tie-beam per architectural exemption note 4",
      provenance: "verification_verified_zero"
    }
  ];

  const schedIncomplete = computeReinforcementSchedule({
    bars: [bar1],
    expectedElements: expected,
    explicitZeroElements: explicitZeros,
    projectRevisionId: "rev-cov"
  });

  assert.equal(schedIncomplete.isComplete, false);
  assert.deepEqual(schedIncomplete.unresolvedElementIds, ["K103"]);
  assert.deepEqual(schedIncomplete.explicitZeroElementIds, ["K102"]);
  assert.ok(schedIncomplete.knownMassKg > 0);
  assert.equal(schedIncomplete.totalMassKg, null);
  assert.equal(schedIncomplete.totalLengthM, null);

  // Case B: K103 also resolved (explicit zero)
  const explicitZerosAll: ExplicitZeroElement[] = [
    ...explicitZeros,
    {
      elementId: "K103",
      floorId: "1F",
      reason: "Secondary lintel unreinforced",
      provenance: "verification_verified_zero"
    }
  ];

  const schedComplete = computeReinforcementSchedule({
    bars: [bar1],
    expectedElements: expected,
    explicitZeroElements: explicitZerosAll,
    projectRevisionId: "rev-cov"
  });

  assert.equal(schedComplete.isComplete, true);
  assert.deepEqual(schedComplete.unresolvedElementIds, []);
  assert.deepEqual(schedComplete.explicitZeroElementIds, ["K102", "K103"]);
  assert.ok(schedComplete.totalMassKg !== null);
  assert.equal(schedComplete.totalMassKg, schedComplete.knownMassKg);
});

test("P15: large project (>10 elements) detects final failing group without truncation", () => {
  const geom = createCenterlineGeometry([createStraightSegment([0, 0, 0], [2, 0, 0])]);
  const expected: ExpectedElement[] = [];
  const bars: BarInput[] = [];

  // Generate 15 elements: ELEM-01 to ELEM-15
  for (let i = 1; i <= 15; i++) {
    const id = `ELEM-${i.toString().padStart(2, "0")}`;
    expected.push({ elementId: id, floorId: "1F", elementType: "column" });
    // All reinforced EXCEPT the 15th element
    if (i !== 15) {
      bars.push({
        id: `bar-${id}`,
        elementId: id,
        floorId: "1F",
        elementType: "column",
        role: "longitudinal",
        materialId: "B420C",
        diameterMm: 14,
        count: 4,
        steelDensityKgPerM3: RHO_STEEL,
        geometry: geom,
        mode: "verification",
        layoutRevisionId: "rev-large"
      });
    }
  }

  const sched = computeReinforcementSchedule({
    bars,
    expectedElements: expected,
    projectRevisionId: "rev-large"
  });

  assert.equal(sched.isComplete, false);
  assert.deepEqual(sched.unresolvedElementIds, ["ELEM-15"]);
  assert.equal(sched.totalMassKg, null);
});

test("P15: raw subtotal conservation across dimensions and presentation display rounding", () => {
  const geomStraight = createCenterlineGeometry([createStraightSegment([0, 0, 0], [4, 0, 0])]);
  const geomBent = createCenterlineGeometry([
    createStraightSegment([0, 0, 0], [1.5, 0, 0]),
    createArcSegment([1.5, 0, 0], [1.6, 0.1, 0], 0.1, Math.PI / 2),
    createStraightSegment([1.6, 0.1, 0], [1.6, 1.1, 0])
  ]);

  const bars: BarInput[] = [
    // 1F Beam - Thin (phi 10)
    {
      id: "b1",
      elementId: "K101",
      floorId: "1F",
      elementType: "beam",
      role: "stirrup",
      materialId: "B420C",
      diameterMm: 10,
      count: 20,
      steelDensityKgPerM3: RHO_STEEL,
      geometry: geomBent,
      mode: "verification",
      layoutRevisionId: "rev-conserv"
    },
    // 1F Beam - Thick (phi 16)
    {
      id: "b2",
      elementId: "K101",
      floorId: "1F",
      elementType: "beam",
      role: "main_bottom",
      materialId: "B420C",
      diameterMm: 16,
      count: 4,
      steelDensityKgPerM3: RHO_STEEL,
      geometry: geomStraight,
      mode: "verification",
      layoutRevisionId: "rev-conserv"
    },
    // 1F Column - Thick (phi 20)
    {
      id: "b3",
      elementId: "S101",
      floorId: "1F",
      elementType: "column",
      role: "longitudinal",
      materialId: "B420C",
      diameterMm: 20,
      count: 8,
      steelDensityKgPerM3: RHO_STEEL,
      geometry: geomStraight,
      mode: "verification",
      layoutRevisionId: "rev-conserv"
    },
    // 2F Slab - Thin (phi 8)
    {
      id: "b4",
      elementId: "D201",
      floorId: "2F",
      elementType: "slab",
      role: "distribution",
      materialId: "B420C",
      diameterMm: 8,
      count: 30,
      steelDensityKgPerM3: RHO_STEEL,
      geometry: geomStraight,
      mode: "verification",
      layoutRevisionId: "rev-conserv"
    }
  ];

  const sched = computeReinforcementSchedule({
    bars,
    projectRevisionId: "rev-conserv"
  });

  const known = sched.knownMassKg;

  // 1. Floor conservation
  const sumFloor = sched.subtotalsByFloor.reduce((acc, f) => acc + f.totalMassKg, 0);
  assert.ok(Math.abs(sumFloor - known) < 1e-12, "Floor subtotal sum must equal known mass");

  // 2. Element type conservation
  const sumElemType = sched.subtotalsByElementType.reduce((acc, e) => acc + e.totalMassKg, 0);
  assert.ok(Math.abs(sumElemType - known) < 1e-12, "Element type subtotal sum must equal known mass");

  // 3. Diameter conservation
  const sumDiameter = sched.subtotalsByDiameter.reduce((acc, d) => acc + d.totalMassKg, 0);
  assert.ok(Math.abs(sumDiameter - known) < 1e-12, "Diameter subtotal sum must equal known mass");

  // 4. Material conservation
  const sumMaterial = sched.subtotalsByMaterial.reduce((acc, m) => acc + m.totalMassKg, 0);
  assert.ok(Math.abs(sumMaterial - known) < 1e-12, "Material subtotal sum must equal known mass");

  // 5. Thin + Thick conservation
  const sumThinThick = sched.classification.thinMassKg + sched.classification.thickMassKg;
  assert.ok(Math.abs(sumThinThick - known) < 1e-12, "Thin + thick mass sum must equal known mass");

  // Format presentation
  const summary = formatScheduleSummary(sched, 2, 2);
  assert.equal(typeof summary.knownMassFormattedKg, "string");
  assert.equal(typeof summary.knownMassFormattedTon, "string");
  assert.equal(summary.isComplete, true);
});

test("P15: verification vs redesign mode separation and mixed handling", () => {
  const geom = createCenterlineGeometry([createStraightSegment([0, 0, 0], [2, 0, 0])]);

  const barVerif: BarInput = {
    id: "bv",
    elementId: "E1",
    floorId: "1F",
    elementType: "beam",
    role: "main_bottom",
    materialId: "B420C",
    diameterMm: 12,
    count: 2,
    steelDensityKgPerM3: RHO_STEEL,
    geometry: geom,
    mode: "verification",
    layoutRevisionId: "rev-mode"
  };

  const schedVerif = computeReinforcementSchedule({
    bars: [barVerif],
    projectRevisionId: "rev-mode"
  });
  assert.equal(schedVerif.mode, "verification");

  const barRedesign: BarInput = {
    id: "br",
    elementId: "E2",
    floorId: "1F",
    elementType: "beam",
    role: "main_bottom",
    materialId: "B420C",
    diameterMm: 12,
    count: 2,
    steelDensityKgPerM3: RHO_STEEL,
    geometry: geom,
    mode: "redesign",
    layoutRevisionId: "rev-mode"
  };

  const schedRedesign = computeReinforcementSchedule({
    bars: [barRedesign],
    projectRevisionId: "rev-mode"
  });
  assert.equal(schedRedesign.mode, "redesign");

  const schedMixed = computeReinforcementSchedule({
    bars: [barVerif, barRedesign],
    projectRevisionId: "rev-mode"
  });
  assert.equal(schedMixed.mode, "mixed");
});

test("P15: declared fabrication geometry requires valid provenance and explanation", () => {
  const validDecl = createDeclaredFabricationGeometry(
    6.45,
    "user_declared",
    "Fabrication drawing cut-list item B-12 without 3D bend coordinates in CAD file"
  );
  assert.equal(validDecl.kind, "declared_fabrication");
  assert.equal(validDecl.declaredLengthM, 6.45);

  assert.throws(() => {
    createDeclaredFabricationGeometry(-2, "user_declared", "Invalid negative length");
  }, /declaredLengthM must be a finite positive number/);

  assert.throws(() => {
    createDeclaredFabricationGeometry(5, "native_declared", "   ");
  }, /inabilityToVerifyPathReason must be provided/);
});

test("P15: input validation guards (stale revision, NaN, negative, zero, non-integer count)", () => {
  const geom = createCenterlineGeometry([createStraightSegment([0, 0, 0], [2, 0, 0])]);

  const base: BarInput = {
    id: "guard-bar",
    elementId: "K101",
    floorId: "1F",
    elementType: "beam",
    role: "main_bottom",
    materialId: "B420C",
    diameterMm: 16,
    count: 2,
    steelDensityKgPerM3: RHO_STEEL,
    geometry: geom,
    mode: "verification",
    layoutRevisionId: "rev-current"
  };

  // Stale revision
  assert.throws(() => {
    computeReinforcementSchedule({
      bars: [{ ...base, layoutRevisionId: "rev-stale" }],
      projectRevisionId: "rev-current"
    });
  }, /Stale layout revision/);

  // Negative diameter
  assert.throws(() => {
    computeBarMetrics({ ...base, diameterMm: -16 });
  }, /diameterMm must be a finite positive number/);

  // NaN diameter
  assert.throws(() => {
    computeBarMetrics({ ...base, diameterMm: NaN });
  }, /diameterMm must be a finite positive number/);

  // Zero diameter
  assert.throws(() => {
    computeBarMetrics({ ...base, diameterMm: 0 });
  }, /diameterMm must be a finite positive number/);

  // Fractional count
  assert.throws(() => {
    computeBarMetrics({ ...base, count: 2.5 });
  }, /count must be a positive integer/);

  // Zero count
  assert.throws(() => {
    computeBarMetrics({ ...base, count: 0 });
  }, /count must be a positive integer/);

  // Missing / non-positive density
  assert.throws(() => {
    computeBarMetrics({ ...base, steelDensityKgPerM3: 0 });
  }, /steelDensityKgPerM3 must be an explicit finite positive physical value/);
});

test("P15 fix: derived length overflow guard rejects non-finite Euclidean distances", () => {
  assert.throws(() => {
    createStraightSegment([0, 0, 0], [1e308, 1e308, 0]);
  }, /segment length must be finite/);
});

test("P15 fix: coverage checking qualifies elementId by floorId for expected and zero elements", () => {
  const geom = createCenterlineGeometry([createStraightSegment([0, 0, 0], [3, 0, 0])]);
  const bar1F: BarInput = {
    id: "bar-1F",
    elementId: "COL-01",
    floorId: "1F",
    elementType: "column",
    role: "longitudinal",
    materialId: "B420C",
    diameterMm: 16,
    count: 4,
    steelDensityKgPerM3: RHO_STEEL,
    geometry: geom,
    mode: "verification",
    layoutRevisionId: "rev-flr"
  };

  const expected2F: ExpectedElement[] = [
    { elementId: "COL-01", floorId: "2F", elementType: "column" }
  ];

  // Case A: Bar on 1F does NOT satisfy expected element on 2F
  const schedBar = computeReinforcementSchedule({
    bars: [bar1F],
    expectedElements: expected2F,
    projectRevisionId: "rev-flr"
  });
  assert.equal(schedBar.isComplete, false);
  assert.deepEqual(schedBar.unresolvedElementIds, ["COL-01"]);

  // Case B: Explicit zero on 1F does NOT satisfy expected element on 2F
  const schedZero = computeReinforcementSchedule({
    bars: [],
    expectedElements: expected2F,
    explicitZeroElements: [
      {
        elementId: "COL-01",
        floorId: "1F",
        reason: "Unreinforced column stub on 1F",
        provenance: "verification_verified_zero"
      }
    ],
    projectRevisionId: "rev-flr"
  });
  assert.equal(schedZero.isComplete, false);
  assert.deepEqual(schedZero.unresolvedElementIds, ["COL-01"]);
});

test("P15 fix: required role coverage and unknown source mapping prevent premature complete", () => {
  const geom = createCenterlineGeometry([createStraightSegment([0, 0, 0], [3, 0, 0])]);
  const stirrupBar: BarInput = {
    id: "b-stirrup",
    elementId: "BEAM-101",
    floorId: "1F",
    elementType: "beam",
    role: "stirrup",
    materialId: "B420C",
    diameterMm: 8,
    count: 10,
    steelDensityKgPerM3: RHO_STEEL,
    geometry: geom,
    mode: "verification",
    layoutRevisionId: "rev-roles"
  };

  const expectedWithRoles: ExpectedElement[] = [
    {
      elementId: "BEAM-101",
      floorId: "1F",
      elementType: "beam",
      requiredRoles: ["main_bottom", "stirrup"]
    }
  ];

  // 1. Missing main_bottom role -> incomplete
  const schedIncomplete = computeReinforcementSchedule({
    bars: [stirrupBar],
    expectedElements: expectedWithRoles,
    projectRevisionId: "rev-roles"
  });
  assert.equal(schedIncomplete.isComplete, false);
  assert.deepEqual(schedIncomplete.unresolvedElementIds, ["BEAM-101"]);

  // 2. Add main_bottom -> complete
  const mainBar: BarInput = {
    id: "b-main",
    elementId: "BEAM-101",
    floorId: "1F",
    elementType: "beam",
    role: "main_bottom",
    materialId: "B420C",
    diameterMm: 16,
    count: 4,
    steelDensityKgPerM3: RHO_STEEL,
    geometry: geom,
    mode: "verification",
    layoutRevisionId: "rev-roles"
  };

  const schedComplete = computeReinforcementSchedule({
    bars: [stirrupBar, mainBar],
    expectedElements: expectedWithRoles,
    projectRevisionId: "rev-roles"
  });
  assert.equal(schedComplete.isComplete, true);
  assert.deepEqual(schedComplete.unresolvedElementIds, []);

  // 3. Unknown source group mapping status suppresses complete
  const schedUnknownMapping = computeReinforcementSchedule({
    bars: [stirrupBar, mainBar],
    expectedElements: expectedWithRoles,
    groupCoverageScope: { sourceGroupMappingStatus: "unknown" },
    projectRevisionId: "rev-roles"
  });
  assert.equal(schedUnknownMapping.isComplete, false);
  assert.equal(schedUnknownMapping.totalMassKg, null);
});
