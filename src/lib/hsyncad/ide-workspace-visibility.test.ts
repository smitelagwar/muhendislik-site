import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { parseIde10, type IdeElement, type IdeProject } from "./ide-import";
import { ideProjectAnalytics, importIdeWorkspace } from "./ide-workspace";

// T-F5.2 — encoded v11 (.ide11, 211220) hydration visibility.
// Korpus dosyası yalnız OKUNUR: parse → importIdeWorkspace → R1-R5 sayıları.
const X11_PATH = "C:\\Users\\hsyn\\Desktop\\hsyncad\\incelemeler\\donusum-esdegerlik-2026-11-15\\00-kaynak\\X11_downloads.ide11";

function loadArrayBuffer(path: string): ArrayBuffer {
  const buf = readFileSync(path);
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
}

const makeElement = (id: string, over: Partial<IdeElement> = {}): IdeElement => ({
  id,
  nativeId: 1,
  name: id,
  type: "beam",
  floorId: "f1",
  points: [{ x: 0, y: 0 }, { x: 1, y: 0 }],
  sourceOffset: 0,
  primitiveType: 5,
  layerId: 0,
  nativeZ: 0,
  lateralOffset: 0,
  rotation: 0,
  ...over,
});

const makeProject = (over: Partial<IdeProject> = {}): IdeProject => ({
  format: "ide11",
  filename: "sentetik.ide11",
  name: "sentetik",
  byteLength: 1024,
  floors: [{ id: "f1", name: "1. KAT", elevation: 0, height: 3, sourceOffset: 0, endOffset: 0 }],
  elements: [makeElement("K1"), makeElement("K2")],
  coverage: {
    candidateRecords: 0,
    decodedRecords: 0,
    unsupportedRecords: 0,
    ignoredTemplateRecords: 0,
    holeRecords: 0,
    rejectedCandidates: 0,
    byType: {},
    unsupportedTypes: {},
    limitations: [],
  },
  warnings: [],
  ...over,
});

test("ideProjectAnalytics counts synthetic R1-R5 fields without fabricating missing ones", () => {
  assert.equal(ideProjectAnalytics(null), null);
  assert.equal(ideProjectAnalytics(undefined), null);
  const source = makeProject({
    elements: [
      makeElement("K1", {
        rebarLayout: { kind: "beam", topCount: 2, topDiaMm: 14, bottomCount: 2, bottomDiaMm: 14, stirrupDiaMm: 8, stirrupSpacingCm: [20] },
      }),
      makeElement("K2"),
    ],
    materials: [{
      id: 1, name: "C25 B420C", kind: "concrete", fckMpa: 25, fykMpa: 420, fctkMpa: null,
      gammaS: 1.15, gammaC: 1.5, elasticModulusMpa: 30250, poisson: 0.2, unitWeightTfM3: 2.5, sourceOffset: 0,
    }],
    seismicSoil: {
      rEntered: 6, rSelectedRatio: null, liveLoadFactorN: 0.3, subgradeKoTfM3: 3080,
      bearingCapacityQtTfM2: 55, importanceI: 1, ss: 0.429, s1: 0.143, sds: 0.3861, sd1: 0.1144,
      exposureClass: "XC2", spectrumId: "DSF1",
    },
    f9Results: {
      modalTables: [
        { name: "Modal'", modeCount: 1, frequenciesHz: [1.2] },
        { name: "Modal 2", modeCount: 1, frequenciesHz: [1.5] },
      ],
      barForceStreamsCount: 0, nodalDisplacementStreamsCount: 0, shellResultStreamsCount: 0,
    },
  });
  const analytics = ideProjectAnalytics(source)!;
  assert.equal(analytics.materialCount, 1);
  assert.equal(analytics.rebarCount, 1);
  assert.equal(analytics.modalTableCount, 2);
  assert.equal(analytics.seismic?.exposureClass, "XC2");
  assert.equal(analytics.seismic?.spectrumId, "DSF1");
  // Kaynakta olmayan R1-R5 alanları sayım olarak da olmamalıdır.
  const bare = ideProjectAnalytics(makeProject())!;
  assert.equal(bare.materialCount, 0);
  assert.equal(bare.rebarCount, 0);
  assert.equal(bare.modalTableCount, 0);
  assert.equal(bare.seismic, undefined);
});

test("X11 encoded v11 .ide11 parse → workspace modelinde 2 malzeme / 468 donatı / 10 modal (T-F5.2)", { skip: !existsSync(X11_PATH), timeout: 300_000 }, () => {
  const project = parseIde10(loadArrayBuffer(X11_PATH), "X11_downloads.ide11");
  const model = importIdeWorkspace(project);
  // R1 hidrasyonu: malzemeler workspace modelinin malzeme listesine akar.
  assert.equal(model.materials.length, 2, `Expected 2 materials, got ${model.materials.length}`);
  assert.equal(model.materials[0].name, "C25 B420C");
  assert.ok(!model.materials.some(m => m.id === "ide-unassigned"));
  // R1/R3/R4/R5 workspace modelinde (model.ideImport.source) korunur ve UI özet sayımına akar.
  assert.ok(model.ideImport, "Expected ideImport on the workspace model");
  const analytics = ideProjectAnalytics(model.ideImport.source)!;
  assert.equal(analytics.materialCount, 2);
  assert.equal(analytics.rebarCount, 468, `Expected 468 rebar layouts, got ${analytics.rebarCount}`);
  assert.equal(analytics.modalTableCount, 10, `Expected 10 modal tables, got ${analytics.modalTableCount}`);
  assert.equal(analytics.seismic?.exposureClass, "XC2");
  assert.equal(analytics.seismic?.spectrumId, "DSF1");
  assert.ok(Math.abs((analytics.seismic?.rEntered ?? 0) - 6) < 1e-6, "Expected rEntered = 6");
  assert.ok(Math.abs((analytics.seismic?.subgradeKoTfM3 ?? 0) - 3080) < 1e-6, "Expected ko = 3080 tf/m³");
  assert.ok(Math.abs((analytics.seismic?.bearingCapacityQtTfM2 ?? 0) - 55) < 1e-6, "Expected qt = 55 tf/m²");
});
