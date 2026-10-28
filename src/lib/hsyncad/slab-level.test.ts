import test from "node:test";
import assert from "node:assert/strict";
import { createDemoModel, createEmptyModel, validateModel, type CadModel, type BeamElement } from "./model";
import { slabRegionsAtLevel } from "./regions";
import { polygonArea } from "./geometry";
import { memberFootprintsInBand } from "./polyhedra";
import { reconcileConnections } from "./relationships";
import { createWorkflowDemo } from "./workflow-demo";
const close = (a: number, b: number) => assert.ok(Math.abs(a - b) < 1e-7, `${a} != ${b}`);
const spec = { floorId: "floor-0", thickness: 0.15, topOffset: 0 };
function frame() { const m = createDemoModel(); m.elements = m.elements.filter(e => e.type !== "slab" && e.type !== "wall"); return m; }
test("automatic slab cannot close on a frame a metre below its concrete band", () => {
  const m = frame(); m.elements = m.elements.map(e => e.type === "beam" ? { ...e, topOffset: -1 } : e);
  assert.equal(slabRegionsAtLevel(m, spec).length, 0);
  const low = slabRegionsAtLevel(m, { ...spec, topOffset: -1 }); assert.equal(low.length, 1); close(polygonArea(low[0].points), 14.04);
});
test("superposed frames are distinguished by elevation and boundary identities", () => {
  const m = frame(), beams = m.elements.filter((e): e is BeamElement => e.type === "beam");
  m.elements.push(...beams.map(e => ({ ...e, id: `low-${e.id}`, name: `Alt ${e.name}`, topOffset: -1 })));
  const upper = slabRegionsAtLevel(m, spec), lower = slabRegionsAtLevel(m, { ...spec, topOffset: -1 });
  assert.equal(upper.length, 1); assert.equal(lower.length, 1);
  assert.ok(upper[0].elementIds.every(id => !id.startsWith("low-")));
  assert.ok(lower[0].elementIds.filter(id => beams.some(b => `low-${b.id}` === id)).length === 4);
});
test("slab edge levels round trip and only close a matching level", () => {
  const m = createEmptyModel(), points = [{ x: 0, y: 0 }, { x: 4, y: 0 }, { x: 4, y: 3 }, { x: 0, y: 3 }];
  m.elements = points.map((start, i) => ({ id: `edge-${i}`, type: "slabEdge", name: `DK${i}`, floorId: spec.floorId, materialId: "concrete", layer: "Döşeme kenarları", start, end: points[(i + 1) % points.length], topOffset: -1 }));
  const checked = validateModel(JSON.parse(JSON.stringify(m))); assert.equal(slabRegionsAtLevel(checked, spec).length, 0);
  const lower = slabRegionsAtLevel(checked, { ...spec, topOffset: -1 }); close(polygonArea(lower[0].points), 12);
});
test("inclined member band projections use actual 3D geometry", () => {
  const m = frame(), floor = m.floors[0], beam = m.elements.find((e): e is BeamElement => e.type === "beam")!;
  const slope = memberFootprintsInBand({ ...beam, start: { x: 0, y: 0 }, end: { x: 4, y: 0 }, endTopOffset: -2 }, floor, 2.85, 3);
  close(slope.reduce((a, p) => a + polygonArea(p), 0), 0.075);
  const c = m.elements.find(e => e.type === "column")!; if (c.type !== "column") throw new Error();
  const section = memberFootprintsInBand({ ...c, position: { x: 0, y: 0 }, leanX: 0.6 }, floor, 2.85, 3).flat();
  close(Math.min(...section.map(p => p.x)), 0.37); close(Math.max(...section.map(p => p.x)), 0.8);
});
test("linked slabs reject elevation gaps and new splitting members without mutating the original", () => {
  const before = createWorkflowDemo(), snapshot = JSON.stringify(before);
  const wrongLevel: CadModel = { ...before, elements: before.elements.map(e => e.type === "beam" ? { ...e, topOffset: -1 } : e) };
  assert.throws(() => reconcileConnections(wrongLevel, before), /kot ve sınır/);
  const beam = before.elements.find((e): e is BeamElement => e.type === "beam")!;
  assert.throws(() => reconcileConnections({ ...before, elements: [...before.elements, { ...beam, id: "split", name: "Ayırıcı", connections: undefined, start: { x: 0, y: 1 }, end: { x: 4, y: 1 } }] }, before), /alanlara ayrılıyor/);
  assert.equal(JSON.stringify(before), snapshot);
});
test("automatic sloping slab recognition is explicitly refused; manual geometry remains supported", () => {
  assert.throws(() => slabRegionsAtLevel(frame(), { ...spec, slopeX: 5 }), /Köşelerle çiz/);
  const m = createDemoModel(); m.elements = m.elements.map(e => e.type === "slab" ? { ...e, slopeX: 5 } : e); validateModel(m);
});

test("loading a linked slab rejects stale shape, open perimeter and a mismatching level", () => {
  const model = createWorkflowDemo(), snapshot = JSON.stringify(model);
  const changedShape = { ...model, elements: model.elements.map(e => e.type === "slab" ? { ...e, points: e.points.map(p => ({ x: p.x + 0.25, y: p.y })) } : e) };
  assert.throws(() => validateModel(changedShape), /kayıtlı döşeme çevresi/);
  const changedLevel = { ...model, elements: model.elements.map(e => e.type === "slab" ? { ...e, topOffset: 1 } : e) };
  assert.throws(() => validateModel(changedLevel), /kayıtlı döşeme çevresi/);
  // IDs still exist, but the boundary member has been moved away from the saved face.
  const open = { ...model, elements: model.elements.map(e => e.type === "beam" ? { ...e, connections: undefined, start: { x: e.start.x, y: e.start.y + 10 }, end: { x: e.end.x, y: e.end.y + 10 } } : { ...e, connections: undefined }) };
  assert.throws(() => validateModel(open), /kayıtlı döşeme çevresi/);
  assert.equal(JSON.stringify(model), snapshot);
  // An explicit detach remains a valid manual slab and is preserved on save/open.
  assert.doesNotThrow(() => validateModel({ ...changedShape, elements: changedShape.elements.map(e => e.type === "slab" ? { ...e, boundary: undefined } : e) }));
  assert.doesNotThrow(() => validateModel({ ...model, elements: model.elements.map(e => e.type === "slab" ? { ...e, points: [...e.points.slice(1), e.points[0]].reverse() } : e) }));
});
