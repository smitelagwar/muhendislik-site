import test from "node:test";
import assert from "node:assert/strict";
import { stairGeometry, validateStairFamilyRegistry } from "../../src/lib/hsyncad/structural/stair-geometry";
import { doubleFlightWithLandingGeometry, landingBenchmarkGeometry, oneFlightGeometry } from "./stair-fixtures";

test("closed landing prism is counted once and transfers exact self weight", () => {
  const result = stairGeometry(landingBenchmarkGeometry()), landing = result.components[0];
  assert.equal(landing.landingVolumeM3, 1.2);
  assert.equal(landing.waistVolumeM3, 0);
  assert.equal(landing.grossVolumeM3, 1.2);
  assert.equal(landing.selfWeightKn, 30);
  assert.deepEqual(result.supportReactions.map(s => s.verticalKn), [15, 15]);
  assert.equal(result.equilibriumResidualKn, 0);
});

test("flight waist and triangular step wedge volumes and first-moment reactions match hand calculation", () => {
  const result = stairGeometry(oneFlightGeometry()), flight = result.components[0];
  const run = 2.8, rise = 1.5, length = Math.hypot(run, rise), width = 1.2, waist = .2;
  const expectedWaist = width * length * waist;
  const expectedSteps = width * 10 * .15 * .28 / 2;
  const expectedStepWeight = expectedSteps * 25;
  const stepCentroidX = .28 * (3 * 10 - 1) / 6;
  const expectedRight = (width * length * waist * 25) / 2 + expectedStepWeight * stepCentroidX / run;
  assert.ok(Math.abs(flight.waistVolumeM3 - expectedWaist) < 1e-12);
  assert.ok(Math.abs(flight.stepVolumeM3 - expectedSteps) < 1e-12);
  assert.ok(Math.abs(flight.grossVolumeM3 - (expectedWaist + expectedSteps)) < 1e-12);
  assert.ok(Math.abs(result.supportReactions[1].verticalKn - expectedRight) < 1e-10);
  assert.ok(Math.abs(result.supportReactions.reduce((s, r) => s + r.verticalKn, 0) - flight.selfWeightKn) < 1e-10);
  assert.notEqual(result.supportReactions[0].verticalKn, result.supportReactions[1].verticalKn);
});

test("flight rise must match registered floor elevations", () => {
  const geometry = oneFlightGeometry();
  assert.throws(() => stairGeometry({ ...geometry, floorLevelsMm: { L0: 0, L1: 1600 } }), /kot farkıyla uyuşmuyor/);
});

test("floor family registry rejects duplicate physical or native identities", () => {
  const a = oneFlightGeometry(), b = { ...oneFlightGeometry(), physicalFamilyId: "stairs-other", nativeRepresentationIds: ["native-stair-1"] };
  assert.throws(() => validateStairFamilyRegistry([a, b]), /iki fiziksel aileye bağlanmış/);
  assert.throws(() => validateStairFamilyRegistry([a, a]), /yinelenmiş/);
});

test("double flight plus intermediate landing keeps floor links and all physical supports", () => {
  const result = stairGeometry(doubleFlightWithLandingGeometry());
  assert.equal(result.physicalComponentCount, 3);
  assert.deepEqual(result.components.map(c => c.kind), ["flight", "landing", "flight"]);
  assert.equal(result.components[0].endFloorId, "Lmid");
  assert.equal(result.components[2].startFloorId, "Lmid");
  assert.deepEqual(result.supportReactions.find(r => r.supportId === "landing-left")?.componentIds, ["flight-lower", "landing-mid"]);
  assert.deepEqual(result.supportReactions.find(r => r.supportId === "landing-right")?.componentIds, ["landing-mid", "flight-upper"]);
});

test("native mesh cannot be counted unless a disjoint closed parametric family is declared", () => {
  const geometry = oneFlightGeometry();
  assert.throws(() => stairGeometry({ ...geometry, disjointSolids: { checked: false as never, source: "" } }), /çakışmasız katı kontrolü/);
});
