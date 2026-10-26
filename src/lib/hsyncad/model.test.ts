import test from "node:test";
import assert from "node:assert/strict";
import { createDemoModel, createEmptyModel, translateElement, validateModel, type CadElement, type CadModel, type ColumnElement, type SlabElement } from "./model";
import { elementFootprint, elementVerticalRange, isSimplePolygon, polygonArea, snapPoint } from "./geometry";
import { calculateQuantities } from "./quantities";
import { buildAxisGrid, createAxisElement, createParallelAxis, extendedAxisEndpoints, nextAxisName, parseAxisSpacings } from "./axes";
import { resolveJunctions } from "./junctions";

const base = { id: "element-1", name: "E1", floorId: "floor-0", materialId: "concrete", layer: "Yapı" };
const column: ColumnElement = { ...base, type: "column", position: { x: 0, y: 0 }, width: 0.4, depth: 0.4, height: 3 };
const slab: SlabElement = { ...base, type: "slab", points: [{ x: 0, y: 0 }, { x: 4, y: 0 }, { x: 4, y: 4 }, { x: 0, y: 4 }], thickness: 0.15 };
const modelWith = (elements: CadElement[]): CadModel => ({ ...createEmptyModel(), elements });
const close = (value: number | null, expected: number | null) => { assert.notEqual(value, null); assert.notEqual(expected, null); assert.ok(Math.abs(value! - expected!) < 1e-9, `${value} ≠ ${expected}`); };

test("SI quantities match independently hand-calculated isolated elements", () => {
  const beam: CadElement = { ...base, type: "beam", start: { x: 0, y: 0 }, end: { x: 4, y: 0 }, width: 0.25, height: 0.5 };
  const wall: CadElement = { ...base, type: "wall", start: { x: 0, y: 0 }, end: { x: 4, y: 0 }, thickness: 0.2, height: 3 };
  for (const [element, volume, formwork] of [[column, 0.48, 4.8], [beam, 0.5, 5.25], [wall, 2.4, 25.2], [slab, 2.4, 18.4]] as const) {
    const result = calculateQuantities(modelWith([element]));
    close(result.grossVolume, volume); close(result.netVolume, volume); close(result.formwork, formwork); close(result.overlapVolume, 0);
    assert.equal(result.warnings.length, 0);
  }
});

test("4×4 demo matches hand calculation and survives JSON round trip", () => {
  const model = validateModel(JSON.parse(JSON.stringify(createDemoModel())));
  const result = calculateQuantities(model);
  close(result.grossVolume, 8.72);
  close(result.netVolume, 8.0885);
  close(result.overlapVolume, 0.6315);
  close(result.formwork, 83.8);
  close(result.rows.find(r => r.type === "column")!.netVolume, 1.92);
  close(result.rows.find(r => r.type === "wall")!.netVolume, 2.4);
  close(result.rows.find(r => r.type === "beam")!.netVolume, 1.775);
  close(result.rows.find(r => r.type === "slab")!.netVolume, 1.9935);
  assert.deepEqual(model, createDemoModel());
});

test("triple intersections count once and type attribution is input-order independent", () => {
  const elements: CadElement[] = [
    { ...column, width: 1, depth: 1, height: 3 },
    { ...base, id: "beam", type: "beam", start: { x: -0.5, y: 0 }, end: { x: 0.5, y: 0 }, width: 1, height: 1 },
    { ...slab, id: "slab", points: [{ x: -0.5, y: -0.5 }, { x: 0.5, y: -0.5 }, { x: 0.5, y: 0.5 }, { x: -0.5, y: 0.5 }], thickness: 1 },
  ];
  const result = calculateQuantities(modelWith(elements));
  close(result.grossVolume, 5); close(result.netVolume, 3); close(result.overlapVolume, 2);
  close(result.rows.find(r => r.type === "column")!.netVolume, 3);
  close(result.rows.find(r => r.type === "beam")!.netVolume, 0);
  close(result.rows.find(r => r.type === "slab")!.netVolume, 0);
  assert.deepEqual(calculateQuantities(modelWith([...elements].reverse())), result);
});

test("duplicate solids and adjacent floors use spatial union, not pairwise subtraction", () => {
  const result = calculateQuantities(modelWith([column, { ...column, id: "copy" }, { ...column, id: "copy-2" }]));
  close(result.grossVolume, 1.44); close(result.netVolume, 0.48);
  const model = modelWith([column, { ...column, id: "upper", floorId: "upper" }]);
  model.floors.push({ id: "upper", name: "1. kat", elevation: 3, height: 3 });
  close(calculateQuantities(model).netVolume, 0.96);
});

test("box union agrees with an independent integer voxel count", () => {
  let seed = 4921;
  const next = () => (seed = (seed * 1664525 + 1013904223) >>> 0) % 4;
  for (let trial = 0; trial < 20; trial++) {
    const occupied = new Set<string>();
    const elements: ColumnElement[] = [];
    for (let i = 0; i < 8; i++) {
      const x = next(), y = next(), width = next() + 1, depth = next() + 1, height = next() + 1;
      elements.push({ ...column, id: `${i}`, position: { x: x + width / 2, y: y + depth / 2 }, width, depth, height });
      for (let xx = x; xx < x + width; xx++) for (let yy = y; yy < y + depth; yy++) for (let zz = 0; zz < height; zz++) occupied.add(`${xx},${yy},${zz}`);
    }
    close(calculateQuantities(modelWith(elements)).netVolume, occupied.size);
  }
});

test("angled solids and concave slabs have resolved net quantities", () => {
  const diagonal: CadElement = { ...base, type: "beam", start: { x: 0, y: 0 }, end: { x: 3, y: 4 }, width: 0.2, height: 0.5 };
  const lShape: SlabElement = { ...slab, id: "L", points: [{ x: 0, y: 0 }, { x: 2, y: 0 }, { x: 2, y: 1 }, { x: 1, y: 1 }, { x: 1, y: 2 }, { x: 0, y: 2 }], thickness: 0.2 };
  assert.doesNotThrow(() => validateModel(modelWith([lShape])));
  close(polygonArea(lShape.points), 3);
  close(calculateQuantities(modelWith([lShape])).grossVolume, 0.6);
  const result = calculateQuantities(modelWith([diagonal, lShape]));
  assert.notEqual(result.netVolume, null);
  assert.ok(result.netVolume! < result.grossVolume);
  assert.ok(result.overlapVolume! > 0);
  assert.equal(result.warnings.length, 0);
});

test("invalid import is rejected completely without altering existing model", () => {
  const existing = createDemoModel(), snapshot = JSON.stringify(existing);
  const invalid: unknown[] = [null, [], {}, { ...existing, schemaVersion: 2 }, { ...existing, floors: [] }, { ...existing, materials: [] }, { ...existing, elements: [{ ...column, width: 0 }] }, { ...existing, elements: [{ ...column, position: { x: Infinity, y: 0 } }] }, { ...existing, elements: [{ ...column, floorId: "missing" }] }, { ...existing, elements: [{ ...column, materialId: "missing" }] }, { ...existing, elements: [column, column] }, { ...existing, elements: [{ ...base, type: "axis", start: { x: 0, y: 0 }, end: { x: 0, y: 0 } }] }, { ...existing, elements: [{ ...column, height: -3 }] }];
  for (const input of invalid) assert.throws(() => validateModel(input));
  assert.equal(JSON.stringify(existing), snapshot);
});

test("crossing, touching, collinear reversals and repeated polygon corners are rejected", () => {
  const polygons = [
    [{ x: 0, y: 0 }, { x: 4, y: 4 }, { x: 4, y: 0 }, { x: 0, y: 4 }],
    [{ x: 0, y: 0 }, { x: 4, y: 0 }, { x: 2, y: 0 }, { x: 2, y: 2 }],
    [{ x: 0, y: 0 }, { x: 4, y: 0 }, { x: 4, y: 4 }, { x: 0, y: 0 }],
    [{ x: 0, y: 0 }, { x: 4, y: 0 }, { x: 4, y: 4 }, { x: 2, y: 0 }, { x: 0, y: 4 }],
  ];
  for (const points of polygons) {
    assert.equal(isSimplePolygon(points), false);
    assert.throws(() => validateModel(modelWith([{ ...slab, points }])));
  }
});

test("translated elements preserve dimensions and original coordinates", () => {
  const moved = translateElement(column, { x: 2, y: -3 });
  assert.equal(moved.type, "column");
  if (moved.type === "column") { assert.deepEqual(moved.position, { x: 2, y: -3 }); assert.equal(moved.height, 3); }
  assert.deepEqual(column.position, { x: 0, y: 0 });
  const movedSlab = translateElement(slab, { x: 1, y: 1 });
  close(polygonArea(elementFootprint(movedSlab)), 16);
  assert.deepEqual(slab.points[0], { x: 0, y: 0 });
});

test("solid elevations agree with the floor convention", () => {
  const floor = { id: "floor-0", name: "Kat", elevation: 3.2, height: 3 };
  assert.deepEqual(elementVerticalRange(column, floor), [3.2, 6.2]);
  close(elementVerticalRange(slab, floor)[0], 6.05);
  close(elementVerticalRange(slab, floor)[1], 6.2);
});

test("snap resolves axis intersection, endpoint, midpoint and grid in priority order", () => {
  const axes: CadElement[] = [
    { ...base, type: "axis", start: { x: -2, y: 0 }, end: { x: 2, y: 0 } },
    { ...base, id: "axis-2", type: "axis", start: { x: 0, y: -2 }, end: { x: 0, y: 2 } },
  ];
  const intersection = snapPoint({ x: 0.02, y: 0.03 }, axes, 0.1, 0.25);
  assert.equal(intersection.kind, "intersection"); assert.deepEqual(intersection.point, { x: 0, y: 0 });
  assert.equal(snapPoint({ x: 2.03, y: 0.02 }, axes, 0.1).kind, "endpoint");
  assert.equal(snapPoint({ x: 0.01, y: 0.01 }, axes.slice(0, 1), 0.1).kind, "midpoint");
  assert.deepEqual(snapPoint({ x: 3.07, y: 3.12 }, axes, 0.1, 0.25), { point: { x: 3, y: 3 }, kind: "grid" });
  assert.equal(snapPoint({ x: 8, y: 8 }, axes, 0.1).kind, "none");
});

test("empty model has zero quantities and remains serializable", () => {
  const model = validateModel(JSON.parse(JSON.stringify(createEmptyModel())));
  const result = calculateQuantities(model);
  close(result.netVolume, 0); close(result.formwork, 0);
  assert.equal(result.rows.length, 4); assert.equal(result.warnings.length, 0);
});

test("axis naming, grid generation and parallel offset match structural convention", () => {
  const empty: CadElement[] = [];
  assert.equal(nextAxisName(empty, "vertical", "floor-0"), "1");
  assert.equal(nextAxisName(empty, "horizontal", "floor-0"), "A");

  const xSpacings = parseAxisSpacings("4;4");
  const ySpacings = parseAxisSpacings("3;5");
  assert.deepEqual(xSpacings, [4, 4]);
  assert.deepEqual(ySpacings, [3, 5]);

  const grid = buildAxisGrid({
    origin: { x: 0, y: 0 },
    xSpacings,
    ySpacings,
    extension: 1,
    labelSide: "both",
    floorId: "floor-0",
    materialId: "concrete",
  }, empty);

  // 3 vertical axes (X=0, 4, 8) + 3 horizontal axes (Y=0, 3, 8) = 6 axes
  assert.equal(grid.length, 6);
  const vertical = grid.filter((a) => a.orientation === "vertical");
  const horizontal = grid.filter((a) => a.orientation === "horizontal");
  assert.equal(vertical.length, 3);
  assert.equal(horizontal.length, 3);
  assert.deepEqual(vertical.map((a) => a.name), ["1", "2", "3"]);
  assert.deepEqual(horizontal.map((a) => a.name), ["A", "B", "C"]);

  // Extended endpoints
  const [extStart, extEnd] = extendedAxisEndpoints(vertical[0]);
  close(extStart.y, -1);
  close(extEnd.y, 9);

  // Parallel axis offset
  const parallel = createParallelAxis(vertical[0], 2.5, grid);
  assert.equal(parallel.orientation, "vertical");
  close(parallel.start.x, 2.5);
  close(parallel.end.x, 2.5);
});

test("resolveJunctions produces disjoint non-overlapping 3D solid parts", () => {
  const elements: CadElement[] = [
    { ...column, width: 1, depth: 1, height: 3 },
    { ...base, id: "beam", type: "beam", start: { x: -0.5, y: 0 }, end: { x: 1.5, y: 0 }, width: 0.5, height: 0.6 },
    { ...slab, id: "slab", points: [{ x: -0.5, y: -0.5 }, { x: 1.5, y: -0.5 }, { x: 1.5, y: 1.5 }, { x: -0.5, y: 1.5 }], thickness: 0.15 },
  ];
  const model = modelWith(elements);
  const junctions = resolveJunctions(model);
  assert.equal(junctions.status, "resolved");
  assert.ok(junctions.parts.length > 0);

  // Parts should sum up to net volume
  const partsVolume = junctions.parts.reduce((sum, p) => sum + p.volume, 0);
  close(partsVolume, junctions.netVolume);

  // Column volume should be intact (priority 0)
  const columnParts = junctions.parts.filter((p) => p.elementId === column.id);
  const columnVolume = columnParts.reduce((sum, p) => sum + p.volume, 0);
  close(columnVolume, 3);
});
