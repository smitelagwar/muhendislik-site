import test from "node:test";
import assert from "node:assert/strict";
import { createEmptyModel, validateModel, type CadModel, type SlabElement } from "./model";
import { createToolTemplate } from "./creation";
import { axisSegments, buildAxisGrid } from "./axes";
import { bindNewElement, copyElementsToFloor, reconcileConnections, removeWithDependents } from "./relationships";
import { pointInRegion, regionAt, regionLabelPoint, slabRegions } from "./regions";
import { elementFootprint, polygonArea } from "./geometry";
import { calculateQuantities } from "./quantities";
const close = (a: number, b: number) => assert.ok(Math.abs(a - b) < 1e-7, `${a} != ${b}`);
function frame(): CadModel {
  const m = createEmptyModel(), f = m.floors[0].id, mat = m.materials[0].id;
  m.elements.push(...buildAxisGrid({ origin: { x: 0, y: 0 }, xSpacings: [4], ySpacings: [4], extension: 1, labelSide: "both", floorId: f, materialId: mat }, []));
  const corners = [{ x: 0, y: 0 }, { x: 4, y: 0 }, { x: 4, y: 4 }, { x: 0, y: 4 }];
  corners.forEach((position, i) => { const c = createToolTemplate("column", f, mat); if (c.type !== "column") throw new Error(); m.elements.push(bindNewElement({ ...c, id: `c${i}`, name: `S${i}`, position }, m)); });
  corners.forEach((start, i) => { const b = createToolTemplate("beam", f, mat); if (b.type !== "beam") throw new Error(); m.elements.push(bindNewElement({ ...b, id: `b${i}`, name: `K${i}`, start, end: corners[(i + 1) % 4] }, m)); });
  return m;
}
function withSlab(m: CadModel): CadModel {
  const region = regionAt({ x: 2, y: 2 }, slabRegions(m.elements, m.floors[0].id))!;
  const slab = createToolTemplate("slab", m.floors[0].id, m.materials[0].id) as SlabElement;
  return { ...m, elements: [...m.elements, { ...slab, id: "slab", name: "D1", points: region.points, boundary: { elementIds: region.elementIds } }] };
}
test("automatic slab uses inner physical outlines with column corner intrusions", () => {
  const m = frame(), regions = slabRegions(m.elements, m.floors[0].id);
  assert.equal(regions.length, 1); close(polygonArea(regions[0].points), 14.04);
  assert.ok(regionAt({ x: 2, y: 2 }, regions)); assert.equal(regionAt({ x: 0, y: 0 }, regions), undefined);
  const ready = validateModel(withSlab(m)); assert.equal(calculateQuantities(ready).warnings.length, 0);
});
test("a middle wall splits closed areas and a missing outer beam leaves no face", () => {
  const m = frame(), wall = createToolTemplate("wall", m.floors[0].id, m.materials[0].id);
  if (wall.type !== "wall") throw new Error();
  m.elements.push({ ...wall, id: "w", start: { x: 0, y: 2 }, end: { x: 4, y: 2 } });
  const regions = slabRegions(m.elements, m.floors[0].id); assert.equal(regions.length, 2);
  close(regions.reduce((s, r) => s + polygonArea(r.points), 0), 13.29);
  const open = frame(); open.elements = open.elements.filter(e => e.id !== "b0");
  assert.equal(slabRegions(open.elements, open.floors[0].id).length, 0);
});
test("slab edges close a free perimeter without producing concrete quantities", () => {
  const m = createEmptyModel(), points = [{ x: 0, y: 0 }, { x: 4, y: 0 }, { x: 4, y: 3 }, { x: 0, y: 3 }];
  m.elements = points.map((start, i) => ({ id: `edge${i}`, type: "slabEdge", name: `DK${i}`, floorId: m.floors[0].id, materialId: m.materials[0].id, layer: "Döşeme kenarları", start, end: points[(i + 1) % 4] }));
  const regions = slabRegions(m.elements, m.floors[0].id); assert.equal(regions.length, 1); close(polygonArea(regions[0].points), 12);
  const q = calculateQuantities(validateModel(m)); close(q.grossVolume, 0); close(q.netVolume!, 0);
});
test("axis edit propagates through column anchors and beam endpoints into a linked slab", () => {
  const before = withSlab(frame()), axis = before.elements.find(e => e.type === "axis" && e.start.x === 4 && e.end.x === 4)!;
  const next = { ...before, elements: before.elements.map(e => e.id === axis.id && e.type === "axis" ? { ...e, start: { ...e.start, x: 5 }, end: { ...e.end, x: 5 } } : e) };
  const resolved = validateModel(reconcileConnections(next, before));
  assert.deepEqual(resolved.elements.find(e => e.id === "c1" && e.type === "column")?.type, "column");
  const c = resolved.elements.find(e => e.id === "c1"), b = resolved.elements.find(e => e.id === "b0"), slab = resolved.elements.find(e => e.type === "slab");
  assert.equal(c?.type === "column" && c.position.x, 5); assert.equal(b?.type === "beam" && b.end.x, 5);
  assert.ok(slab?.type === "slab"); close(polygonArea(slab.points), 17.79);
  assert.deepEqual(validateModel(JSON.parse(JSON.stringify(resolved))), resolved);
});
test("manual column position edit detaches its axes but moves attached beam ends", () => {
  const before = frame(), next = { ...before, elements: before.elements.map(e => e.id === "c1" && e.type === "column" ? { ...e, position: { x: 5, y: 1 } } : e) };
  const m = validateModel(reconcileConnections(next, before)), c = m.elements.find(e => e.id === "c1"), b = m.elements.find(e => e.id === "b0");
  assert.equal(c?.connections, undefined); assert.deepEqual(b?.type === "beam" && b.end, { x: 5, y: 1 });
});
test("breaking a linked perimeter is rejected atomically; deleting a boundary removes its dependent slab", () => {
  const before = withSlab(frame()), original = JSON.stringify(before);
  const broken = { ...before, elements: before.elements.map(e => e.id === "b0" && e.type === "beam" ? { ...e, start: { x: 0, y: -2 }, end: { x: 4, y: -2 } } : e) };
  assert.throws(() => reconcileConnections(broken, before), /çevresi açılıyor/); assert.equal(JSON.stringify(before), original);
  const removed = removeWithDependents(before, "b0"); assert.equal(removed.count, 2);
  assert.ok(!removed.model.elements.some(e => e.type === "slab")); validateModel(reconcileConnections(removed.model, before));
});
test("column edge/corner pivots and mirroring retain the picked reference point", () => {
  const c = createToolTemplate("column", "floor-0", "concrete"); if (c.type !== "column") throw new Error();
  const edge = elementFootprint({ ...c, width: 0.4, depth: 0.6, anchorMode: "edge" });
  close(Math.min(...edge.map(p => p.x)), 0); close(Math.max(...edge.map(p => p.x)), 0.4);
  const corner = elementFootprint({ ...c, width: 0.4, depth: 0.6, anchorMode: "corner", mirrorX: true });
  close(Math.min(...corner.map(p => p.y)), 0); close(Math.max(...corner.map(p => p.y)), 0.6);
  assert.ok(pointInRegion({ x: 0.1, y: 0.1 }, corner));
});


test("axis negative deltas shorten the drawn line and labels may be absent", () => {
  const m = frame(), axis = m.elements.find(e => e.type === "axis")!;
  if (axis.type !== "axis") throw new Error();
  const shortened = { ...axis, extensionStart: -0.5, extensionEnd: -1, labelSide: "none" as const };
  validateModel({ ...m, elements: m.elements.map(e => e.id === axis.id ? shortened : e) });
  const lines = axisSegments(shortened); assert.equal(lines.length, 1);
  close(Math.hypot(lines[0].b.x - lines[0].a.x, lines[0].b.y - lines[0].a.y), 2.5);
  assert.throws(() => validateModel({ ...m, elements: [{ ...shortened, extensionStart: -10 }] }), /delta/);
});
test("concave slab default label stays inside its region", () => {
  const points = [{x:0,y:0},{x:4,y:0},{x:4,y:1},{x:1,y:1},{x:1,y:4},{x:0,y:4}];
  assert.ok(pointInRegion(regionLabelPoint(points), points));
});

test("moving a support to another storey detaches former-storey children without moving them", () => {
  const before = frame();
  before.floors.push({ id: "upper", name: "Üst kat", elevation: 3, height: 4 });
  const next = { ...before, elements: before.elements.map(e => e.id === "c1" ? { ...e, floorId: "upper" } : e) };
  const resolved = validateModel(reconcileConnections(next, before));
  const beam = resolved.elements.find(e => e.id === "b0");
  assert.ok(beam?.type === "beam");
  assert.deepEqual(beam.end, { x: 4, y: 0 });
  assert.equal(beam.connections?.end, undefined);
  assert.equal(beam.connections?.start?.kind, "column");
  const moved = resolved.elements.find(e => e.id === "c1");
  assert.equal(moved?.connections, undefined);
});

test("floor copies remap every relationship and own independent nested geometry", () => {
  const source = withSlab(frame()), snapshot = JSON.stringify(source);
  source.floors.push({ id: "upper", name: "Üst kat", elevation: 3, height: 4 });
  const copies = copyElementsToFloor(source.elements, "upper");
  const copied = validateModel({ ...source, elements: [...source.elements, ...copies] });
  const copyIds = new Set(copies.map(e => e.id));
  for (const e of copies) {
    assert.ok(!source.elements.some(original => original.id === e.id));
    for (const binding of Object.values(e.connections ?? {})) for (const id of binding.kind === "axes" ? binding.ids : [binding.id]) assert.ok(copyIds.has(id));
    if (e.type === "slab") assert.ok(e.boundary?.elementIds.every(id => copyIds.has(id)));
  }
  const beam = copies.find(e => e.type === "beam")!, slab = copies.find(e => e.type === "slab")!;
  assert.ok(beam.type === "beam" && slab.type === "slab");
  beam.start.x = 99; slab.points[0].x = 99;
  assert.equal(JSON.stringify({ ...source, floors: source.floors.slice(0, 1) }), snapshot);
  // A story-bound 0.4×0.4 column grows from 3 to 4 m on the destination floor.
  const q = calculateQuantities(copied);
  close(q.rows.find(row => row.type === "column")!.grossVolume, 4 * 0.4 * 0.4 * (3 + 4));
  assert.deepEqual(validateModel(JSON.parse(JSON.stringify(copied))), copied);
});

test("copying only dependent elements preserves geometry and omits unavailable references", () => {
  const source = withSlab(frame());
  const copies = copyElementsToFloor(source.elements.filter(e => e.type === "beam" || e.type === "slab"), "upper");
  const model = { ...createEmptyModel(), floors: [{ id: "upper", name: "Üst kat", elevation: 3, height: 3 }], elements: copies };
  assert.doesNotThrow(() => validateModel(model));
  assert.ok(copies.filter(e => e.type === "beam").every(e => !e.connections));
  const slabOnly = copyElementsToFloor(source.elements.filter(e => e.type === "slab"), "floor-0")[0];
  assert.ok(slabOnly.type === "slab"); assert.equal(slabOnly.boundary, undefined);
  assert.doesNotThrow(() => validateModel({ ...createEmptyModel(), elements: [slabOnly] }));
});

test("deleting an axis detaches its column anchors but retains valid downstream framing", () => {
  const before = frame(), axis = before.elements.find(e => e.type === "axis")!;
  const removal = removeWithDependents(before, axis.id), resolved = validateModel(reconcileConnections(removal.model, before));
  assert.equal(removal.count, 1);
  assert.ok(resolved.elements.every(e => Object.values(e.connections ?? {}).every(binding => binding.kind !== "axes" || !binding.ids.includes(axis.id))));
  assert.ok(resolved.elements.some(e => e.type === "beam" && e.connections?.start?.kind === "column"));
});

test("curving a straight support detaches its chord binding and preserves the child's picked node", () => {
  const before = createEmptyModel(), parent = createToolTemplate("beam", "floor-0", "concrete"), child = createToolTemplate("wall", "floor-0", "concrete");
  assert.ok(parent.type === "beam" && child.type === "wall");
  before.elements = [{ ...parent, id: "support" }];
  before.elements.push(bindNewElement({ ...child, id: "child", start: { x: 2, y: 0 }, end: { x: 2, y: 2 } }, before));
  assert.equal(before.elements[1].connections?.start?.kind, "member");
  const next = { ...before, elements: before.elements.map(e => e.id === "support" ? { ...e, curveSagitta: 1 } : e) };
  const resolved = validateModel(reconcileConnections(next, before)), wall = resolved.elements.find(e => e.id === "child");
  assert.ok(wall?.type === "wall"); assert.equal(wall.connections, undefined);
  assert.deepEqual(wall.start, { x: 2, y: 0 });
});

test("plan-bound beam elevation gaps produce diagnostics while net volume remains geometric", () => {
  const source = frame();
  assert.equal(calculateQuantities(source).warnings.length, 0);
  for (const endTopOffset of [undefined, 3]) {
    const model = { ...source, elements: source.elements.map(e => e.id === "b0" && e.type === "beam" ? { ...e, topOffset: 2, endTopOffset } : e) };
    const q = calculateQuantities(model);
    assert.notEqual(q.netVolume, null);
    assert.equal(q.warnings.length, 2);
    assert.ok(q.warnings.every(w => /fiziksel beton birleşimi yok/.test(w)));
    assert.ok(q.warnings.some(w => /1,5 m açıklık/.test(w)));
    if (endTopOffset) assert.ok(q.warnings.some(w => /2,5 m açıklık/.test(w)));
  }
  // Surface contact has zero overlap volume but still is a valid touching connection.
  const touching = { ...source, elements: source.elements.map(e => e.id === "b0" && e.type === "beam" ? { ...e, topOffset: 0.5 } : e) };
  assert.equal(calculateQuantities(touching).warnings.length, 0);
});
