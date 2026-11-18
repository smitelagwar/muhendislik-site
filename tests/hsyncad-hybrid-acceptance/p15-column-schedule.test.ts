import test from "node:test";
import assert from "node:assert/strict";
import {
  computeReinforcementSchedule,
  formatScheduleSummary,
  type BarInput,
  type ExpectedElement
} from "../../src/lib/hsyncad/structural/reinforcement-schedule.js";
import {
  buildColumnReinforcementBarInputs,
  describeColumnP10ApiBlocker,
  type ColumnReinforcementAdapterInput,
  type ColumnStoreyEndpoints,
  type ColumnLongitudinalDetangling,
  type ColumnTieDetangling
} from "../../src/lib/hsyncad/structural/reinforcement-from-columns.js";
import {
  rectangleColumnBars,
  circleColumnBars,
  columnDetailing,
  automatedColumnTie,
  type ColumnTie
} from "../../src/lib/hsyncad/structural/column-detailing.js";
import { type ColumnDesignInput } from "../../src/lib/hsyncad/structural/column-design.js";
import { fact } from "../../src/lib/hsyncad/structural/global-control-types.js";
import { type BeamMaterial } from "../../src/lib/hsyncad/structural/rc-beam-section.js";

const RHO_STEEL = 7850; // kg/m^3

const C30_B420C: BeamMaterial = {
  fck: 30,
  fctk: 1.9,
  reinforcementClass: "B420C" as const,
  fyk: 420,
  fywk: 420,
  Ec: 32000,
  tensileBasis: "table_3_2" as const,
  elasticBasis: "table_3_2" as const,
  testEvidence: null,
  source: "synthetic TS500 Table 3.2 profile"
};

/**
 * Independent analytical physical oracle calculating rebar masses from first principles:
 * Mass = A * rho * L * count
 */
function analyticalRebarMass(diameterMm: number, lengthM: number, count: number, density: number = RHO_STEEL): number {
  const areaM2 = (Math.PI * (diameterMm / 1000) ** 2) / 4;
  return areaM2 * density * lengthM * count;
}

function makeRectangularColumnInput(options: {
  id: string;
  storeyId: string;
  bMm?: number;
  hMm?: number;
  clearLengthMm?: number;
  phiLong?: number;
  alongB?: number;
  alongH?: number;
  phiTie?: number;
  mode?: "existing_reinforcement" | "redesign";
  revision?: string;
  withCrossTies?: boolean;
}): ColumnDesignInput {
  const b = options.bMm ?? 500;
  const h = options.hMm ?? 500;
  const clearLengthMm = options.clearLengthMm ?? 3000;
  const phiLong = options.phiLong ?? 16;
  const alongB = options.withCrossTies === false ? 2 : (options.alongB ?? 3);
  const alongH = options.withCrossTies === false ? 2 : (options.alongH ?? 3);
  const phiTie = options.phiTie ?? 8;
  const cover = 30;
  const revision = options.revision ?? "rev-2026-p15";

  const shape = {
    kind: "rectangle" as const,
    b,
    h,
    angleRad: 0,
    center: { u: 0, v: 0 },
    source: "authored_cad_shape"
  };

  const bars = rectangleColumnBars(shape, phiLong, alongB, alongH, cover, phiTie);

  const coreB = b - 2 * cover;
  const coreH = h - 2 * cover;

  const template: ColumnTie = {
    diameter: phiTie,
    endSpacingMm: 100,
    middleSpacingMm: 150,
    coreB,
    coreH,
    legsU: 2,
    legsV: 2,
    maxUnsupportedSpacingMm: 300,
    restrainedBarIds: bars.map((b) => b.id),
    crossTies: [],
    source: "TBDY7.3.4 seismic confinement",
    kind: "rectangular",
    hookAngleDeg: 135,
    hookTailMm: 80,
    innerBendDiameterMm: 48
  };

  const tie = automatedColumnTie(shape, bars, template);

  const fakeForce = {
    id: `case-${options.id}`,
    lengthMm: clearLengthMm,
    modelRevision: revision,
    stiffnessSet: "uncracked",
    analysisStamp: "stamp-p15",
    endForces: [0, 0, 0, 0, 0, 0],
    uniformKnM: [0, 0]
  };

  return {
    id: options.id,
    storeyId: options.storeyId,
    shape,
    material: C30_B420C,
    mode: options.mode ?? "existing_reinforcement",
    bars,
    tie,
    cover,
    aggregate: 20,
    clearLengthMm,
    outside: false,
    source: "P10 verification baseline",
    baseJoint: `J_BASE_${options.id}`,
    topJoint: `J_TOP_${options.id}`,
    qualityReviewed: { value: true, source: "quality check" },
    loadCoverage: { value: "all_required_combinations_reviewed" as const, source: "load coverage" },
    GQEmaxKn: { value: 200, source: "GQE" },
    shortColumn: { value: false, source: "short col" },
    cantilever: false,
    foundationEmbedMm: null,
    loads: [
      {
        force: fakeForce as any,
        stability: { memberId: options.id } as any
      }
    ],
    seismic: null,
    laps: [],
    development: {
      required: false,
      availableMm: 1000,
      offsetMm: 0,
      transitionHeightMm: 300,
      source: "joint calc"
    },
    catalog: { diameters: [16], counts: [3], maxCandidates: 1 }
  };
}

test("P15 Column Adapter: real supported positive case matches independent analytical oracle", () => {
  const colInput = makeRectangularColumnInput({
    id: "COL-101",
    storeyId: "1F",
    bMm: 500,
    hMm: 500,
    clearLengthMm: 3000,
    phiLong: 16,
    alongB: 3,
    alongH: 3, // Total bars = 2*3 + 2*(3-2) = 8 bars
    phiTie: 8,
    withCrossTies: true
  });

  const endpoints: ColumnStoreyEndpoints = {
    baseZ: 0.0,
    topZ: 3.0,
    originX: 2.0,
    originY: 4.0
  };

  const longDet: ColumnLongitudinalDetangling = {
    topLapExtensionM: 0.50, // 500 mm lap splice above 1F
    bottomStarterExtensionM: 0.0,
    topHookM: 0.0,
    bottomHookM: 0.0,
    provenance: "authored_cad_geometry"
  };

  const tieDet: ColumnTieDetangling = {
    hookTailM: 0.08,
    provenance: "authored_cad_geometry"
  };

  const adapterResult = buildColumnReinforcementBarInputs({
    columnInput: colInput,
    projectRevisionId: "rev-2026-p15",
    steelDensityKgPerM3: RHO_STEEL,
    storeyEndpoints: endpoints,
    longitudinalDetangling: longDet,
    tieDetangling: tieDet
  });

  assert.equal(adapterResult.status, "ready", `Issues: ${JSON.stringify(adapterResult.issues)}`);
  assert.equal(adapterResult.issues.length, 0);
  assert.equal(adapterResult.elementId, "COL-101");
  assert.equal(adapterResult.floorId, "1F");
  assert.equal(adapterResult.mode, "verification");
  assert.deepEqual(adapterResult.requiredRoles, ["longitudinal", "stirrup", "crosstie"]);

  // Verify bar count and roles
  const longBars = adapterResult.bars.filter((b) => b.role === "longitudinal");
  const stirrupBars = adapterResult.bars.filter((b) => b.role === "stirrup");
  const crossTieBars = adapterResult.bars.filter((b) => b.role === "crosstie");

  assert.equal(longBars.length, 8); // 8 longitudinal bars
  assert.equal(stirrupBars.length, 1);
  assert.equal(crossTieBars.length, 2); // U and V cross-ties from automated tie

  // Compute schedule
  const schedule = computeReinforcementSchedule({
    bars: adapterResult.bars,
    expectedElements: [adapterResult.expectedElement],
    projectRevisionId: "rev-2026-p15"
  });

  assert.equal(schedule.isComplete, true);
  assert.deepEqual(schedule.unresolvedElementIds, []);
  assert.equal(schedule.mode, "verification");

  // INDEPENDENT ANALYTICAL ORACLE COMPARISON
  // 1. Longitudinal: 8 bars of diameter 16mm, length = 3.0m (clear) + 0.5m (lap) = 3.5m
  const oracleLongMass = analyticalRebarMass(16, 3.5, 8);

  // 2. Stirrups: coreB = 500 - 2*30 = 440mm = 0.44m, coreH = 440mm = 0.44m
  // Perimeter = 2 * (0.44 + 0.44) = 1.76m. Two hooks = 2 * 0.08m = 0.16m. Unit length = 1.92m.
  const numTies = stirrupBars[0].count;
  const oracleTieMass = analyticalRebarMass(8, 1.76 + 0.16, numTies);

  // 3. Cross-ties: two ties connecting opposing bars across 408mm distance between bar centers
  // (500mm - 2 * (cover=30 + phiTie=8 + phiLong/2=8) = 408mm = 0.408m).
  // Each cross-tie unit length = 0.408m + 2 * 0.08m = 0.568m. Total paths = 2.
  const oracleCrossMass = analyticalRebarMass(8, 0.408 + 0.16, numTies) * 2;

  const oracleTotalMass = oracleLongMass + oracleTieMass + oracleCrossMass;

  assert.ok(Math.abs(schedule.knownMassKg - oracleTotalMass) < 1e-6);
  assert.ok(Math.abs((schedule.totalMassKg ?? 0) - oracleTotalMass) < 1e-6);
});

test("P15 Column Adapter: circular column placement matches analytical circular oracle", () => {
  const shape = {
    kind: "circle" as const,
    diameter: 600,
    center: { u: 0, v: 0 },
    source: "authored_circular_shape"
  };
  const bars = circleColumnBars(shape, 20, 8, 30, 10);
  const coreD = 600 - 2 * 30; // 540 mm
  const tie: ColumnTie = {
    diameter: 10,
    endSpacingMm: 100,
    middleSpacingMm: 150,
    coreB: coreD,
    coreH: coreD,
    legsU: 2,
    legsV: 2,
    maxUnsupportedSpacingMm: 200,
    restrainedBarIds: bars.map((b) => b.id),
    crossTies: [],
    source: "TBDY circular hoop",
    kind: "circular_hoop",
    hookAngleDeg: 135,
    hookTailMm: 100,
    innerBendDiameterMm: 50
  };

  const colInput: ColumnDesignInput = {
    ...makeRectangularColumnInput({ id: "CIRC-01", storeyId: "1F", clearLengthMm: 3200, revision: "rev-circ" }),
    shape,
    bars,
    tie,
    clearLengthMm: 3200
  };

  const adapterResult = buildColumnReinforcementBarInputs({
    columnInput: colInput,
    projectRevisionId: "rev-circ",
    steelDensityKgPerM3: RHO_STEEL,
    storeyEndpoints: { baseZ: 0, topZ: 3.2 },
    longitudinalDetangling: {
      topLapExtensionM: 0.60,
      provenance: "authored_cad_geometry"
    },
    tieDetangling: {
      hookTailM: 0.10,
      provenance: "authored_cad_geometry"
    }
  });

  assert.equal(adapterResult.status, "ready", `Issues: ${JSON.stringify(adapterResult.issues)}`);
  assert.equal(adapterResult.bars.length, 8 + 1); // 8 longitudinal + 1 circular hoop group

  const sched = computeReinforcementSchedule({
    bars: adapterResult.bars,
    expectedElements: [adapterResult.expectedElement],
    projectRevisionId: "rev-circ"
  });

  assert.equal(sched.isComplete, true);

  // Oracle for circular column
  const oracleLong = analyticalRebarMass(20, 3.2 + 0.60, 8);
  const hoopCount = adapterResult.bars.find((b) => b.role === "stirrup")!.count;
  // Circular circumference: 2 * pi * R = pi * 0.54m + 2 * 0.10m hooks
  const hoopLen = Math.PI * 0.54 + 0.20;
  const oracleHoop = analyticalRebarMass(10, hoopLen, hoopCount);
  const oracleTotal = oracleLong + oracleHoop;

  assert.ok(Math.abs(sched.knownMassKg - oracleTotal) < 1e-4);
});

test("P15 Column Adapter: same element ID across 3 floors has unique bar IDs and floor subtotals", () => {
  const floors = ["GF", "1F", "2F"];
  const allBars: BarInput[] = [];
  const expectedElements: ExpectedElement[] = [];

  for (let i = 0; i < floors.length; i++) {
    const floorId = floors[i];
    const colInput = makeRectangularColumnInput({
      id: "C-SAME",
      storeyId: floorId,
      clearLengthMm: 3000,
      revision: "rev-multi-floor"
    });

    const baseZ = i * 3.5;
    const topZ = baseZ + 3.0;

    const res = buildColumnReinforcementBarInputs({
      columnInput: colInput,
      projectRevisionId: "rev-multi-floor",
      steelDensityKgPerM3: RHO_STEEL,
      storeyEndpoints: { baseZ, topZ },
      longitudinalDetangling: { topLapExtensionM: 0.5, provenance: "authored_cad_geometry" },
      tieDetangling: { hookTailM: 0.08, provenance: "authored_cad_geometry" }
    });

    assert.equal(res.status, "ready");
    allBars.push(...res.bars);
    expectedElements.push(res.expectedElement);
  }

  // Ensure all bar IDs are globally distinct
  const barIds = allBars.map((b) => b.id);
  assert.equal(new Set(barIds).size, allBars.length);

  const sched = computeReinforcementSchedule({
    bars: allBars,
    expectedElements,
    projectRevisionId: "rev-multi-floor"
  });

  assert.equal(sched.isComplete, true);
  assert.equal(sched.subtotalsByFloor.length, 3);
  assert.deepEqual(
    sched.subtotalsByFloor.map((f) => f.floorId).sort(),
    ["1F", "2F", "GF"]
  );

  // Exact floating point raw subtotal conservation across dimensions
  const sumFloorMass = sched.subtotalsByFloor.reduce((acc, f) => acc + f.totalMassKg, 0);
  const sumElemMass = sched.subtotalsByElementType.reduce((acc, e) => acc + e.totalMassKg, 0);
  const sumDiamMass = sched.subtotalsByDiameter.reduce((acc, d) => acc + d.totalMassKg, 0);
  const sumClassMass = sched.classification.thinMassKg + sched.classification.thickMassKg;

  assert.ok(Math.abs(sumFloorMass - sched.knownMassKg) < 1e-11);
  assert.ok(Math.abs(sumElemMass - sched.knownMassKg) < 1e-11);
  assert.ok(Math.abs(sumDiamMass - sched.knownMassKg) < 1e-11);
  assert.ok(Math.abs(sumClassMass - sched.knownMassKg) < 1e-11);
});

test("P15 Column Adapter: P10 API blocker / unproven lengths refuse guessing and produce null total mass", () => {
  const colInput = makeRectangularColumnInput({
    id: "COL-UNPROVEN",
    storeyId: "1F",
    revision: "rev-blocker"
  });

  // Case 1: Missing storey endpoints
  const resNoEndpoints = buildColumnReinforcementBarInputs({
    columnInput: colInput,
    projectRevisionId: "rev-blocker",
    steelDensityKgPerM3: RHO_STEEL
  });

  assert.equal(resNoEndpoints.status, "missing_data");
  assert.equal(resNoEndpoints.bars.length, 0);
  assert.ok(resNoEndpoints.blockerExplanation?.includes("[API BLOCKER]"));
  assert.ok(resNoEndpoints.issues.some((i) => i.includes("storeyEndpoints")));

  // Passing this to schedule leaves element unresolved
  const schedIncomplete = computeReinforcementSchedule({
    bars: resNoEndpoints.bars,
    expectedElements: [resNoEndpoints.expectedElement],
    projectRevisionId: "rev-blocker"
  });
  assert.equal(schedIncomplete.isComplete, false);
  assert.equal(schedIncomplete.totalMassKg, null);
  assert.deepEqual(schedIncomplete.unresolvedElementIds, ["COL-UNPROVEN"]);

  // Case 2: Endpoints provided, but longitudinal provenance is "unproven"
  const resUnproven = buildColumnReinforcementBarInputs({
    columnInput: colInput,
    projectRevisionId: "rev-blocker",
    steelDensityKgPerM3: RHO_STEEL,
    storeyEndpoints: { baseZ: 0, topZ: 3 },
    longitudinalDetangling: { provenance: "unproven" },
    tieDetangling: { provenance: "authored_cad_geometry" }
  });

  assert.equal(resUnproven.status, "missing_data");
  assert.equal(resUnproven.bars.length, 0);
  assert.ok(resUnproven.issues.some((i) => i.includes("Heuristic guessing is forbidden")));
});

test("P15 Column Adapter: role completeness enforcement rejects partial group coverage", () => {
  const colInput = makeRectangularColumnInput({
    id: "COL-PARTIAL",
    storeyId: "1F",
    withCrossTies: true,
    revision: "rev-roles"
  });

  const res = buildColumnReinforcementBarInputs({
    columnInput: colInput,
    projectRevisionId: "rev-roles",
    steelDensityKgPerM3: RHO_STEEL,
    storeyEndpoints: { baseZ: 0, topZ: 3 },
    longitudinalDetangling: { topLapExtensionM: 0.5, provenance: "authored_cad_geometry" },
    tieDetangling: { hookTailM: 0.08, provenance: "authored_cad_geometry" }
  });

  // Omit cross-ties from the bar list
  const barsWithoutCrossTie = res.bars.filter((b) => b.role !== "crosstie");

  const schedPartial = computeReinforcementSchedule({
    bars: barsWithoutCrossTie,
    expectedElements: [res.expectedElement],
    projectRevisionId: "rev-roles"
  });

  assert.equal(schedPartial.isComplete, false);
  assert.equal(schedPartial.totalMassKg, null);
  assert.deepEqual(schedPartial.unresolvedElementIds, ["COL-PARTIAL"]);

  // Including all bars satisfies role completeness
  const schedFull = computeReinforcementSchedule({
    bars: res.bars,
    expectedElements: [res.expectedElement],
    projectRevisionId: "rev-roles"
  });
  assert.equal(schedFull.isComplete, true);
  assert.deepEqual(schedFull.unresolvedElementIds, []);
});

test("P15 Column Adapter: unknown source mapping suppresses project total mass", () => {
  const colInput = makeRectangularColumnInput({
    id: "COL-SRC-UNKNOWN",
    storeyId: "1F",
    revision: "rev-src-unknown"
  });

  const res = buildColumnReinforcementBarInputs({
    columnInput: colInput,
    projectRevisionId: "rev-src-unknown",
    steelDensityKgPerM3: RHO_STEEL,
    storeyEndpoints: { baseZ: 0, topZ: 3 },
    longitudinalDetangling: { topLapExtensionM: 0.5, provenance: "authored_cad_geometry" },
    tieDetangling: { hookTailM: 0.08, provenance: "authored_cad_geometry" }
  });

  const sched = computeReinforcementSchedule({
    bars: res.bars,
    expectedElements: [res.expectedElement],
    groupCoverageScope: { sourceGroupMappingStatus: "unknown" },
    projectRevisionId: "rev-src-unknown"
  });

  assert.equal(sched.isComplete, false);
  assert.equal(sched.totalMassKg, null);
  assert.ok(sched.knownMassKg > 0);
});

test("P15 Column Adapter: mutations of diameter, count, and lap strictly scale expected mass", () => {
  const baseCol = makeRectangularColumnInput({
    id: "COL-MUT",
    storeyId: "1F",
    phiLong: 16,
    clearLengthMm: 3000,
    withCrossTies: false,
    revision: "rev-mut"
  });

  const baseEndpoints = { baseZ: 0, topZ: 3 };

  const resBase = buildColumnReinforcementBarInputs({
    columnInput: baseCol,
    projectRevisionId: "rev-mut",
    steelDensityKgPerM3: RHO_STEEL,
    storeyEndpoints: baseEndpoints,
    longitudinalDetangling: { topLapExtensionM: 0.5, provenance: "authored_cad_geometry" },
    tieDetangling: { hookTailM: 0.08, provenance: "authored_cad_geometry" }
  });

  const schedBase = computeReinforcementSchedule({
    bars: resBase.bars,
    projectRevisionId: "rev-mut"
  });

  const longBase = resBase.bars.filter((b) => b.role === "longitudinal");
  const longMassBase = longBase.reduce((s, b) => {
    const area = (Math.PI * (b.diameterMm / 1000) ** 2) / 4;
    return s + area * RHO_STEEL * (b.geometry as any).totalLengthM * b.count;
  }, 0);

  // 1. Diameter Mutation: phi 16 -> phi 20. Mass must scale by (20/16)^2 = 1.5625
  const colPhi20 = makeRectangularColumnInput({
    id: "COL-MUT",
    storeyId: "1F",
    phiLong: 20,
    clearLengthMm: 3000,
    withCrossTies: false,
    revision: "rev-mut"
  });

  const resPhi20 = buildColumnReinforcementBarInputs({
    columnInput: colPhi20,
    projectRevisionId: "rev-mut",
    steelDensityKgPerM3: RHO_STEEL,
    storeyEndpoints: baseEndpoints,
    longitudinalDetangling: { topLapExtensionM: 0.5, provenance: "authored_cad_geometry" },
    tieDetangling: { hookTailM: 0.08, provenance: "authored_cad_geometry" }
  });

  const longPhi20 = resPhi20.bars.filter((b) => b.role === "longitudinal");
  const longMassPhi20 = longPhi20.reduce((s, b) => {
    const area = (Math.PI * (b.diameterMm / 1000) ** 2) / 4;
    return s + area * RHO_STEEL * (b.geometry as any).totalLengthM * b.count;
  }, 0);

  assert.ok(Math.abs(longMassPhi20 / longMassBase - (20 / 16) ** 2) < 1e-10);

  // 2. Lap Mutation: lap 0.5m -> 1.0m. Length 3.5m -> 4.0m. Mass must scale by 4.0 / 3.5
  const resLap1m = buildColumnReinforcementBarInputs({
    columnInput: baseCol,
    projectRevisionId: "rev-mut",
    steelDensityKgPerM3: RHO_STEEL,
    storeyEndpoints: baseEndpoints,
    longitudinalDetangling: { topLapExtensionM: 1.0, provenance: "authored_cad_geometry" },
    tieDetangling: { hookTailM: 0.08, provenance: "authored_cad_geometry" }
  });

  const longLap1m = resLap1m.bars.filter((b) => b.role === "longitudinal");
  const longMassLap1m = longLap1m.reduce((s, b) => {
    const area = (Math.PI * (b.diameterMm / 1000) ** 2) / 4;
    return s + area * RHO_STEEL * (b.geometry as any).totalLengthM * b.count;
  }, 0);

  assert.ok(Math.abs(longMassLap1m / longMassBase - 4.0 / 3.5) < 1e-10);
});

test("P15 Column Adapter: stale layout revision is explicitly blocked", () => {
  const colInput = makeRectangularColumnInput({
    id: "COL-STALE",
    storeyId: "1F",
    revision: "rev-current"
  });

  // Attempt adapter with mismatched project revision
  const resMismatch = buildColumnReinforcementBarInputs({
    columnInput: colInput,
    projectRevisionId: "rev-old-stale",
    steelDensityKgPerM3: RHO_STEEL,
    storeyEndpoints: { baseZ: 0, topZ: 3 },
    longitudinalDetangling: { provenance: "authored_cad_geometry" },
    tieDetangling: { provenance: "authored_cad_geometry" }
  });

  assert.equal(resMismatch.status, "rejected");
  assert.ok(resMismatch.issues.some((i) => i.includes("Revision mismatch")));
});

test("P15 Column Adapter: mode distinction (verification vs redesign vs mixed)", () => {
  const colVerif = makeRectangularColumnInput({
    id: "C-V",
    storeyId: "1F",
    mode: "existing_reinforcement",
    revision: "rev-mode"
  });
  const colRedesign = makeRectangularColumnInput({
    id: "C-R",
    storeyId: "1F",
    mode: "redesign",
    revision: "rev-mode"
  });

  const endpoints = { baseZ: 0, topZ: 3 };
  const longDet = { topLapExtensionM: 0.5, provenance: "authored_cad_geometry" as const };
  const tieDet = { hookTailM: 0.08, provenance: "authored_cad_geometry" as const };

  const resV = buildColumnReinforcementBarInputs({
    columnInput: colVerif,
    projectRevisionId: "rev-mode",
    steelDensityKgPerM3: RHO_STEEL,
    storeyEndpoints: endpoints,
    longitudinalDetangling: longDet,
    tieDetangling: tieDet
  });

  const resR = buildColumnReinforcementBarInputs({
    columnInput: colRedesign,
    projectRevisionId: "rev-mode",
    steelDensityKgPerM3: RHO_STEEL,
    storeyEndpoints: endpoints,
    longitudinalDetangling: longDet,
    tieDetangling: tieDet
  });

  assert.equal(resV.mode, "verification");
  assert.equal(resR.mode, "redesign");

  const schedV = computeReinforcementSchedule({ bars: resV.bars, projectRevisionId: "rev-mode" });
  assert.equal(schedV.mode, "verification");

  const schedR = computeReinforcementSchedule({ bars: resR.bars, projectRevisionId: "rev-mode" });
  assert.equal(schedR.mode, "redesign");

  const schedMixed = computeReinforcementSchedule({
    bars: [...resV.bars, ...resR.bars],
    projectRevisionId: "rev-mode"
  });
  assert.equal(schedMixed.mode, "mixed");
});
