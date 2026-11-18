import test from "node:test";
import assert from "node:assert/strict";
import { createDemoModel, validateModel } from "../../src/lib/hsyncad/model";
import { migrateStructuralModel } from "../../src/lib/hsyncad/structural/migration";
import { createStructuralProject, readStructuralProject, updateProjectSettings } from "../../src/lib/hsyncad/structural/project-schema";

test("legacy migration retains geometry and original payload, without inferred roles or material", () => {
  const original = { ...createDemoModel(), customLegacyField: { number: 15 } };
  const migrated = migrateStructuralModel(original, "project-a");
  assert.deepEqual(migrated.elements, validateModel(original).elements);
  assert.deepEqual(migrated.structural!.legacyArchive, original);
  assert.ok(migrated.structural!.objects.filter(o => o.role !== "excluded").every(o => o.role === "unknown" && o.materialId === null));
  const reopened = validateModel(JSON.parse(JSON.stringify(migrated)));
  assert.deepEqual(reopened, migrated);
  assert.deepEqual(migrateStructuralModel(reopened, "ignored-id"), reopened);
});
test("new projects do not share defaults or previous project's input", () => {
  const model = createDemoModel(), a = createStructuralProject(model, "a"), b = createStructuralProject(model, "b");
  a.settings.qt = { value: 539.36575, source: "user_input", evidence: "user" };
  assert.equal(b.settings.qt.value, null);
  assert.ok(Object.values(b.settings).every(v => v.value === null && v.source === "unknown"));
});
test("qt remains distinct from allowable pressure; input is not a used R", () => {
  const p = createStructuralProject(createDemoModel(), "a"), settings = structuredClone(p.settings);
  settings.qt = { value: 539.36575, source: "user_input", evidence: null };
  settings.r = { value: 8, source: "user_input", evidence: null };
  const next = updateProjectSettings(p, settings);
  assert.equal(next.revision, 1); assert.equal(p.revision, 0);
  assert.equal(next.settings.allowablePressure.value, null);
  assert.deepEqual(next.coefficients.r, { entered: 8, recommended: null, used: null, reason: null });
  assert.equal(readStructuralProject(JSON.parse(JSON.stringify(next))).settings.qt.value, 539.36575);
});
test("unsupported structural versions and malformed settings are rejected", () => {
  const p = createStructuralProject(createDemoModel(), "a");
  assert.throws(() => readStructuralProject({ ...p, schemaVersion: 2 }));
  assert.throws(() => readStructuralProject({ ...p, settings: {} }));
  for (const value of [-1, 0, Infinity, NaN]) {
    const settings = structuredClone(p.settings); settings.qt = { value, source: "user_input", evidence: null };
    assert.throws(() => updateProjectSettings(p, settings));
  }
});
test("cross-field and source constraints reject misleading records", () => {
  const p = createStructuralProject(createDemoModel(), "a"), s = structuredClone(p.settings);
  s.dryUnitWeight = { value: 25, source: "user_input", evidence: null };
  s.saturatedUnitWeight = { value: 20, source: "user_input", evidence: null };
  assert.throws(() => updateProjectSettings(p, s), /saturatedUnitWeight/);
  s.saturatedUnitWeight.value = 26; s.connection = { value: "enlarged", source: "user_input", evidence: null };
  assert.throws(() => updateProjectSettings(p, s), /enlargementRatio/);
  s.connection.value = "straight"; s.qt.value = 55;
  assert.throws(() => updateProjectSettings(p, s), /kaynak/);
});
test("future top-level model versions are not silently migrated", () => {
  assert.throws(() => migrateStructuralModel({ ...createDemoModel(), schemaVersion: 2 }, "a"));
});
test("physical materials and load objects retain SI units and provenance over save/reopen", () => {
  const p = createStructuralProject(createDemoModel(), "loads-a");
  p.materials[0] = { materialId: "concrete", source: "user_input", properties: { fckMPa: 30, elasticModulusMPa: 30000, fykMPa: null, densityKgM3: 2400, poisson: .2 } };
  p.loads = [{ id: "load-1", kind: "live", source: "user_input", evidence: null, elementIds: ["slab-0"], coordinateSystem: "global", distribution: "area", unit: "kN/m2", components: [0, 0, -2], selfWeightIncluded: false, massParticipation: .3, applicationRegion: null }];
  assert.deepEqual(readStructuralProject(JSON.parse(JSON.stringify(p))), p);
  p.loads[0].unit = "kN";
  assert.throws(() => readStructuralProject(p), /Yükün/);
  p.loads[0].unit = "kN/m2"; p.loads[0].elementIds = ["nonexistent"];
  assert.throws(() => readStructuralProject(p), /Yükün/);
  p.loads[0].elementIds = ["slab-0"]; p.materials[0].properties!.poisson = .7;
  assert.throws(() => readStructuralProject(p), /poisson/);
});
test("legacy unknown numeric payload is never silently changed into null", () => {
  assert.throws(() => migrateStructuralModel({ ...createDemoModel(), customUnknown: Infinity }, "a"), /sonlu/);
});
test("mechanical connection, support, explicit reinforcement and design limits roundtrip without fabrication", () => {
  const p = createStructuralProject(createDemoModel(), "physical-a"), o = p.objects.find(o => o.elementId === "column-0")!;
  o.role = "column"; o.source = "user_input"; o.materialId = "concrete"; o.coverM = .035;
  o.connections = { startJointId: "joint-a", endJointId: "joint-b", startReleases: null, endReleases: [false, false, false, false, false, false], eccentricityM: { x: .1, y: 0, z: 0 } };
  o.supports = [{ jointId: "joint-a", restrained: [true, true, true, false, false, false], stiffness: null }];
  o.reinforcement = { mode: "existing", source: "user_input", bars: [{ id: "bar-1", diameterMm: 16, quantity: 4, steelMaterialId: "steel", centerLineM: [{ x: 0, y: 0, z: .035 }, { x: 0, y: 0, z: 2.965 }], hookStart: null, hookEnd: null }] };
  o.designConstraints = { minBarDiameterMm: 12, maxBarDiameterMm: 20, maxSpacingM: .2, lockedReinforcement: true };
  assert.deepEqual(readStructuralProject(JSON.parse(JSON.stringify(p))), p);
  o.reinforcement.bars[0].quantity = 1.5;
  assert.throws(() => readStructuralProject(p), /Donatı/);
  o.reinforcement.bars[0].quantity = 4; o.designConstraints.maxBarDiameterMm = 10;
  assert.throws(() => readStructuralProject(p), /kısıt/);
});
