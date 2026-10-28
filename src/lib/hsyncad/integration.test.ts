import test from "node:test";
import assert from "node:assert/strict";
import { createEmptyModel, validateModel, type CadModel, type ColumnElement, type SlabElement } from "./model";
import { elementFootprint, elementVerticalRange, polygonArea, snapPoint } from "./geometry";
import { DEFAULT_SNAP, layerState, setLayerState, wallPath } from "./definitions";
import { createToolTemplate } from "./creation";
import { resolveJunctions } from "./junctions";
import { quantityReport, reportCsv } from "./reports";
import { calculateQuantities } from "./quantities";
import { createFeatureDemo } from "./feature-demo";

const close = (a: number | null, b: number, tolerance = 1e-7) => { assert.notEqual(a, null); assert.ok(Math.abs(a! - b) < tolerance, `${a} ≠ ${b}`); };
function column(id = "c"): ColumnElement { return { ...createToolTemplate("column", "floor-0", "concrete"), type: "column", id, name: id, position: { x: 0.5, y: 0.5 }, width: 1, depth: 1, height: 3, heightMode: "fixed" } as ColumnElement; }
function slab(): SlabElement { return { ...createToolTemplate("slab", "floor-0", "concrete"), type: "slab", id: "slab", name: "D1", points: [{ x: 0, y: 0 }, { x: 2, y: 0 }, { x: 2, y: 2 }, { x: 0, y: 2 }], thickness: 0.2, slopeX: 50 } as SlabElement; }
function checked(model: CadModel) { const r = resolveJunctions(validateModel(model)); assert.equal(r.status, "resolved", r.error); return r; }

test("circular and polygon columns share offset/rotation geometry and survive JSON", () => {
  const model = createEmptyModel(), circle = { ...column(), section: "circle" as const, circleSegments: 32, offsetX: 1, offsetY: 2, rotation: 90 };
  model.elements = [circle];
  const p = elementFootprint(circle); assert.equal(p.length, 32);
  close(polygonArea(p), 32 / 8 * Math.sin(2 * Math.PI / 32));
  close(p.reduce((s, q) => s + q.x, 0) / 32, -1.5); close(p.reduce((s, q) => s + q.y, 0) / 32, 1.5);
  close(checked(model).netVolume, polygonArea(p) * 3);
  assert.deepEqual(validateModel(JSON.parse(JSON.stringify(model))).elements, model.elements);
  model.elements = [{ ...column(), section: "polygon", sectionPoints: [{ x: 0, y: 0 }, { x: 2, y: 0 }, { x: 0, y: 1 }] }];
  close(checked(model).netVolume, 3);
  assert.throws(() => validateModel({ ...model, elements: [{ ...model.elements[0], sectionPoints: [{ x: 0, y: 0 }, { x: 2, y: 2 }, { x: 0, y: 2 }, { x: 2, y: 0 }] }] }));
});
test("arc wall sagitta, offsets and 3D/quantity footprint are consistent", () => {
  const model = createEmptyModel();
  const wall = { ...createToolTemplate("wall", "floor-0", "concrete"), type: "wall" as const, start: { x: 0, y: 0 }, end: { x: 4, y: 0 }, thickness: 0.2, height: 3, curveSagitta: 1, curveSegments: 12 };
  const path = wallPath(wall); close(path[6].x, 2); close(path[6].y, 1);
  assert.equal(elementFootprint(wall).length, 26);
  model.elements = [wall];
  const r = checked(model); close(r.netVolume, polygonArea(elementFootprint(wall)) * 3);
  close(calculateQuantities(model, r).netVolume, r.netVolume!);
});
test("sloping slab is a plane-clipped solid with exact volume and idempotent duplicates", () => {
  const model = createEmptyModel(); model.elements = [slab()];
  close(checked(model).netVolume, 0.8); assert.deepEqual(elementVerticalRange(slab(), model.floors[0]), [2.8, 4]);
  model.elements.push({ ...slab(), id: "duplicate" });
  const result = checked(model); close(result.grossVolume, 1.6); close(result.netVolume, 0.8);
  close(result.overlapVolume, 0.8); assert.ok(result.parts.every(p => p.faces?.length));
});
test("leaning column intersections match the independent integral of linear overlap", () => {
  const model = createEmptyModel(); model.elements = [column("a"), { ...column("b"), leanX: 1 }];
  const r = checked(model); close(r.grossVolume, 6); close(r.netVolume, 4.5); close(r.overlapVolume, 1.5);
  const reversed = checked({ ...model, elements: [...model.elements].reverse() }); close(reversed.netVolume, r.netVolume!);
});
test("sloped slab-column junction, buildup and load report keep whole-model deductions", () => {
  const model = createEmptyModel(); model.elements = [{ ...column(), height: 4 }, { ...slab(), buildUp: [{ name: "Alt", thickness: 0.1 }, { name: "Üst", thickness: 0.1 }], finishLoad: 1.5, liveLoad: 2, rebarMass: 20 }];
  const r = checked(model); close(r.netVolume, 4.6);
  const rows = quantityReport(model, r, { grouping: "type", floorId: "", types: ["slab"] });
  close(rows[0].gross, 0.8); close(rows[0].net, 0.6); close(rows[0].finishKN, 6); close(rows[0].liveKN, 8); close(rows[0].rebarKg, 20);
  assert.match(reportCsv(rows), /0,600000/);
  const q = calculateQuantities(model, r); close(q.grossVolume, 4.8);
  close(q.rows.find(row => row.type === "slab")!.formwork, 4 * Math.sqrt(1.25) + 8 * 0.2);
});
test("axis intersections beyond finite endpoints and separate snap toggles work", () => {
  const common = { id: "a", name: "A", floorId: "floor-0", materialId: "concrete", layer: "Akslar", type: "axis" as const };
  const axes = [{ ...common, start: { x: 3.13, y: -1 }, end: { x: 3.13, y: 1 } }, { ...common, id: "b", start: { x: 0, y: 10.13 }, end: { x: 5, y: 10.13 } }];
  assert.deepEqual(snapPoint({ x: 3.14, y: 10.14 }, axes, 0.2, 0.25).point, { x: 3.13, y: 10.13 });
  assert.equal(snapPoint({ x: 3.14, y: 10.14 }, axes, 0.2, 0.25, { ...DEFAULT_SNAP, intersection: false }).kind, "grid");
  assert.equal(snapPoint({ x: 8.12, y: 8.12 }, [], 0.2, 0.25, { grid: false }).kind, "none");
});
test("per-floor layer scope, future-floor defaults and all settings roundtrip", () => {
  let model = createEmptyModel(); model.floors.push({ id: "f2", name: "Kat 1", elevation: 3, height: 4 });
  model = setLayerState(model, "Kolonlar", { visible: false, locked: true }, "floor", "floor-0");
  assert.deepEqual(layerState(model, "Kolonlar", "f2"), { visible: true, locked: false });
  model.floors.push({ id: "f3", name: "Kat 2", elevation: 7, height: 3 });
  assert.deepEqual(layerState(model, "Kolonlar", "f3"), { visible: true, locked: false });
  model.snap = { ...DEFAULT_SNAP, tolerancePx: 18, showNodes: true }; model.toolDefaults = { column: { ...column(), section: "circle" } };
  const restored = validateModel(JSON.parse(JSON.stringify(model))); assert.deepEqual(restored, model);
  const def = createToolTemplate("column", "floor-0", "concrete"); assert.equal(def.type === "column" && def.heightMode, "story");
});
test("isolated column levels do not waste the full clipping work budget", () => {
  const model = createEmptyModel(); model.elements = Array.from({ length: 200 }, (_, i) => ({ ...column(`c${i}`), position: { x: i * 2, y: 0 }, height: 3 + i * 0.001 }));
  checked(model);
});
test("complete feature demo remains serializable with a resolved combined solid model", () => {
  const model = createFeatureDemo();
  const result = checked(model);
  assert.ok(result.netVolume! > 8.0885);
  assert.equal(model.elements.length, 20);
  assert.deepEqual(validateModel(JSON.parse(JSON.stringify(model))), model);
});
test("report groups use stable identities even if two floors have the same display name", () => {
  const model = createEmptyModel(); model.floors.push({ id: "other", name: "Zemin kat", elevation: 3, height: 3 });
  model.elements = [column("first"), { ...column("second"), floorId: "other" }];
  const rows = quantityReport(model, checked(model), { grouping: "floor", floorId: "", types: ["column"] });
  assert.equal(rows.length, 2); assert.notEqual(rows[0].id, rows[1].id);
});
test("separate beam end elevations preserve section volume instead of using the bounding-box height", () => {
  const model = createEmptyModel(), template = createToolTemplate("beam", "floor-0", "concrete");
  if (template.type !== "beam") throw new Error("Invalid beam template");
  const beam = { ...template, start: { x: 0, y: 0 }, end: { x: 4, y: 0 }, width: 0.25, height: 0.5, topOffset: 0, endTopOffset: 1 };
  model.elements = [beam];
  const r = checked(model); close(r.netVolume, 0.5);
  assert.deepEqual(elementVerticalRange(beam, model.floors[0]), [2.5, 4]);
  const q = calculateQuantities(model, r); close(q.grossVolume, 0.5); close(q.formwork, Math.sqrt(1.0625) + 8.5 * 0.5);
});
