import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { parseIde10, type IdeProject } from "./ide-import";
import { importIdeWorkspace, ideReferenceElements } from "./ide-workspace";
import { elementFootprint, elementVerticalRange } from "./geometry";
import { validateModel, translateElement } from "./model";
import { historyReducer } from "../../components/hsyncad/editor-state";
import { ideReferenceGeometry } from "./ide-reference-geometry";
import { createHash } from "node:crypto";
import { exportCadModelIfc } from "./ifc-export";
import { IDE_EXAMPLES } from "./ide-examples";
import * as ThreeRuntime from "three";
import type * as ThreeTypes from "three/src/Three.js";

const root = "C:/Users/hsyn/Desktop/hsyncad/incelemeler/idecad-rea/native-2026-11-04";
const fixtures = [
  `${root}/hsyncad-paneller-test.ide11trial`,
  `${root}/fixtures-2026-11-05/hsyncad-tc33-yeniden-ac.ide11trial`,
  `${root}/fixtures-2026-11-05-offsets-r2/hsyncad-tc8-r2-yeniden-ac.ide11trial`,
  "D:/IDM_DOWNLOAD/MUSTAFA SELVİ TÜM PROJELER/STATİK/1.kısım/MUSTAFA SELVİ 1.KISIM.ide10",
  "D:/IDM_DOWNLOAD/SÜHEYLA KARA PROJELER/STATİK/218 ada 50 parsel STATİK.ide10",
  `${root}/idecad-official-structural-model.cde`,
];
const close = (a: number, b: number) => assert.ok(Math.abs(a - b) < 1e-5, `${a} != ${b}`);

for (const file of fixtures) test(`editable import retains contours, elevations, references and save/reopen: ${file.split("/").at(-1)}`, { skip: !existsSync(file), timeout: 60_000 }, () => {
  const bytes = Uint8Array.from(readFileSync(file)), before = bytes.slice();
  const source = parseIde10(bytes.buffer, file.split("/").at(-1)!);
  const model = importIdeWorkspace(source);
  assert.ok(model.elements.length > 0);
  assert.equal(model.elements.length + ideReferenceElements(model).length, source.elements.length);
  for (const element of model.elements) {
    const original = source.elements.find(e => e.id === element.id)!;
    if (element.type !== "axis" && element.type !== "slabEdge") {
      const [bottom, top] = elementVerticalRange(element, model.floors.find(f => f.id === element.floorId)!);
      close(bottom, original.bottom!); close(top, original.top!);
      const footprint = elementFootprint(element);
      assert.ok(footprint.every(p => original.footprint!.some(q => Math.hypot(p.x - q.x, p.y - q.y) < 1e-5)), element.name);
    }
  }
  const first = model.elements.find(e => e.type === "beam") ?? model.elements[0];
  const moved = translateElement(first, { x: 1.25, y: -.75 });
  const edited = validateModel({ ...model, elements: model.elements.map(e => e.id === first.id ? { ...moved, name: "Düzenlenen" } : e) });
  const saved = validateModel(JSON.parse(JSON.stringify(edited)));
  assert.equal(JSON.stringify(saved), JSON.stringify(edited));
  assert.equal(JSON.stringify(ideReferenceElements(saved)), JSON.stringify(ideReferenceElements(model)));
  const history = historyReducer({ present: model, past: [], future: [] }, { type: "commit", model: edited });
  assert.deepEqual(historyReducer(history, { type: "undo" }).present, model);
  for (const reference of ideReferenceElements(saved)) {
    const geometry = ideReferenceGeometry(reference);
    if (reference.mesh) assert.equal(geometry!.getAttribute("position").count, reference.mesh.positions.length / 3);
    geometry?.dispose();
  }
  assert.deepEqual(bytes, before);
  console.log(JSON.stringify({ file: source.filename, floors: model.floors.length, editable: model.elements.length, references: model.ideImport!.references.length, unsupported: source.coverage.unsupportedRecords }));
});

test("holes and unknown dimensions stay as references; invalid import metadata is rejected", () => {
  const base = { nativeId: 1, floorId: "f", sourceOffset: 0, primitiveType: 7, layerId: 0, nativeZ: 0, lateralOffset: 0, rotation: 0 };
  const points = [{ x: 0, y: 0 }, { x: 4, y: 0 }, { x: 4, y: 4 }, { x: 0, y: 4 }];
  const source: IdeProject = { format: "ide11", name: "Delikli", filename: "test.ide11", byteLength: 100, floors: [{ id: "f", name: "Kat", elevation: 0, height: 3, sourceOffset: 0, endOffset: 100 }], elements: [
    { ...base, id: "slab", name: "D1", type: "slab", points, footprint: points, holes: [[{ x: 1, y: 1 }, { x: 2, y: 1 }, { x: 2, y: 2 }]], top: 3, bottom: 2.8, thickness: .2 },
    { ...base, id: "beam", nativeId: 2, name: "K1", type: "beam", points: points.slice(0, 2), width: .25, planOnly: true },
  ], coverage: { candidateRecords: 2, decodedRecords: 2, unsupportedRecords: 0, ignoredTemplateRecords: 0, holeRecords: 0, rejectedCandidates: 0, byType: { slab: 1, beam: 1 }, unsupportedTypes: {}, limitations: [] }, warnings: [] };
  const model = importIdeWorkspace(source);
  assert.equal(model.elements.length, 0);
  assert.equal(ideReferenceElements(model).length, 2);
  const geometry = ideReferenceGeometry(source.elements[0])!;
  assert.ok(geometry.getAttribute("position").count > 0); geometry.dispose();
  assert.throws(() => validateModel({ ...model, ideImport: { ...model.ideImport, mappedIds: ["beam"] } }));
  const report = exportCadModelIfc(model).report;
  assert.equal(report.omitted.filter(e => e.code === "IDE_SOURCE_REFERENCE").length, 2);
  assert.equal(report.sourceElementCount, 2);
  const THREE = ThreeRuntime as unknown as typeof ThreeTypes;
  for (const outer of [points, [...points].reverse()]) for (const hole of [source.elements[0].holes![0], [...source.elements[0].holes![0]].reverse()]) {
    const g = ideReferenceGeometry({ ...source.elements[0], footprint: outer, holes: [hole] })!;
    const material = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide }), mesh = new THREE.Mesh(g, material);
    mesh.updateMatrixWorld(true);
    const ray = new THREE.Raycaster(new THREE.Vector3(1.6, 10, -1.3), new THREE.Vector3(0, -1, 0));
    assert.equal(ray.intersectObject(mesh).length, 0);
    ray.set(new THREE.Vector3(.5, 10, -.5), new THREE.Vector3(0, -1, 0));
    assert.ok(ray.intersectObject(mesh).length > 0);
    g.dispose(); material.dispose();
  }
});

test("all published examples are valid editable files with matching hashes and complete decoded coverage", () => {
  const root = "public/hsyncad/examples";
  const manifest = JSON.parse(readFileSync(`${root}/manifest.json`, "utf8")) as { id: string; filename: string; sha256: string; editable: number; references: number; decoded: number }[];
  assert.deepEqual(manifest.map(item => item.id), IDE_EXAMPLES.map(item => item.id));
  for (const item of manifest) {
    const bytes = readFileSync(`${root}/${item.filename}`);
    assert.equal(createHash("sha256").update(bytes).digest("hex"), item.sha256);
    const model = validateModel(JSON.parse(bytes.toString("utf8")));
    assert.equal(model.elements.length, item.editable);
    assert.equal(ideReferenceElements(model).length, item.references);
    assert.equal(model.elements.length + ideReferenceElements(model).length, item.decoded);
  }
});
