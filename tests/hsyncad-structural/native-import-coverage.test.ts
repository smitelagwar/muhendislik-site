import test from "node:test";
import assert from "node:assert/strict";
import { createDemoModel } from "../../src/lib/hsyncad/model";
import type { IdeProject } from "../../src/lib/hsyncad/ide-import";
import { nativeImportCoverage } from "../../src/lib/hsyncad/structural/native-import-coverage";
function fixture() {
  const model = createDemoModel();
  const source = { format: "ide10", filename: "test.ide10", byteLength: 2000,
    elements: [{ id: "slab", nativeId: 7, name: "RAD1", type: "slab", floorId: "f", sourceOffset: 100,
      holes: [[{ x: 1, y: 1 }, { x: 2, y: 1 }, { x: 1, y: 2 }]],
      planAnnotation: { loads: { dead: .2, live: .3, unit: "tf/m²", sourceOffset: 400 } } }],
    coverage: { unsupportedRecords: 0 } } as unknown as IdeProject;
  model.ideImport = { source, mappedIds: [], references: [{ id: "slab", reason: "İç boşluk hesap adaptörü eksik" }] };
  return model;
}
const identity = { sha256: "a".repeat(64), bytes: 2000 };
test("zero parser unsupported cannot approve engineering; source loads remain observations", () => {
  const model = fixture(), before = structuredClone(model);
  const result = nativeImportCoverage(model, identity);
  assert.equal(result.engineeringAcceptance, false); assert.equal(result.counts.calculationReady, 0);
  assert.equal(result.counts.references, 1); assert.equal(result.counts.loadObservations, 1);
  assert.equal(result.records[0].physicalRole, "unknown"); assert.equal(result.records[0].geometryPreserved.holes, 1);
  assert.equal(result.records[0].observedLoads?.solverInput, false);
  assert.equal(result.records[0].observedLoads?.selfWeightIncluded, "unknown");
  assert.deepEqual(result.records[0].analysisGeometryCandidate?.openingsM, model.ideImport!.source.elements[0].holes);
  assert.deepEqual(model, before);
});
test("missing/duplicated mapping and altered source identity fail closed", () => {
  const model = fixture(); model.ideImport!.references = [];
  assert.throws(() => nativeImportCoverage(model, identity), /kapsam/);
  assert.throws(() => nativeImportCoverage(fixture(), { ...identity, bytes: 1 }), /kimli/);
});
test("wrong units and nonfinite observed loads are rejected", () => {
  const model = fixture(), load = model.ideImport!.source.elements[0].planAnnotation!.loads!;
  load.dead = NaN; assert.throws(() => nativeImportCoverage(model, identity), /yük/);
  load.dead = .2; (load as unknown as { unit: string }).unit = "kN/m²";
  assert.throws(() => nativeImportCoverage(model, identity), /yük/);
});
