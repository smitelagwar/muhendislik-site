import assert from "node:assert/strict";
import test from "node:test";
import { createDemoModel, createEmptyModel, type CadModel, type Point } from "./model";
import { exportCadModelIfc, IfcExportError } from "./ifc-export";
import { createIdeCadPanelDemo, ideCadSlabPanelIssues } from "./ifc-panels";

type Ref = { ref: number };
type Value = string | number | null | Ref | Value[];
type Entity = { type: string; values: Value[] };

/** A small STEP reader for inspecting emitted structure, independent of the writer's helpers. */
function entities(text: string): Map<number, Entity> {
  const rows = new Map<number, Entity>();
  for (const line of text.split("\n")) {
    const match = line.match(/^#(\d+)=([A-Z0-9]+)\((.*)\);$/);
    if (!match) continue;
    let index = 0;
    const source = `(${match[3]})`;
    const parse = (): Value => {
      if (source[index] === "(") {
        index++; const result: Value[] = [];
        while (source[index] !== ")") { result.push(parse()); if (source[index] === ",") index++; else assert.equal(source[index], ")"); }
        index++; return result;
      }
      if (source[index] === "'") {
        index++; let result = "";
        for (;;) {
          assert.ok(index < source.length);
          const c = source[index++];
          if (c !== "'") { result += c; continue; }
          if (source[index] === "'") { result += "'"; index++; continue; }
          return result;
        }
      }
      const start = index;
      while (index < source.length && ![",", "(", ")"].includes(source[index])) index++;
      const token = source.slice(start, index);
      if (source[index] === "(") return [token, parse()];
      if (token === "$" || token === "*") return null;
      if (token.startsWith("#")) return { ref: Number(token.slice(1)) };
      if (/^[+-]?[\d.]+(?:E[+-]?\d+)?$/.test(token)) return Number(token);
      return token;
    };
    rows.set(Number(match[1]), { type: match[2], values: parse() as Value[] });
    assert.equal(index, source.length);
  }
  return rows;
}
const entity = (rows: Map<number, Entity>, ref: Value) => rows.get((ref as Ref).ref)!;
const list = (rows: Map<number, Entity>, type: string) => [...rows.values()].filter(e => e.type === type);
const vector = (rows: Map<number, Entity>, ref: Value) => entity(rows, ref).values[0] as number[];
const cross = (a: number[], b: number[]) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
function transform(rows: Map<number, Entity>, placement: Value, point: number[]): number[] {
  const local = entity(rows, placement), axes = entity(rows, local.values[1]);
  const origin = vector(rows, axes.values[0]), z = vector(rows, axes.values[1]), x = vector(rows, axes.values[2]), y = cross(z, x);
  const p = origin.map((v, i) => v + point[0] * x[i] + point[1] * y[i] + point[2] * z[i]);
  return local.values[0] ? transform(rows, local.values[0], p) : p;
}
const near = (actual: number, expected: number) => assert.ok(Math.abs(actual - expected) < 1e-8, `${actual} != ${expected}`);
const rectangle = (x: number, y: number, w: number, h: number): Point[] => [{ x, y }, { x: x + w, y }, { x: x + w, y: y + h }, { x, y: y + h }];

test("IFC2X3 contains structural classes, SI units and all references; it reports omitted axes", { timeout: 5000 }, () => {
  const model = createDemoModel(), output = exportCadModelIfc(model), rows = entities(output.text);
  assert.match(output.text, /FILE_SCHEMA\(\('IFC2X3'\)\)/);
  assert.equal(list(rows, "IFCCOLUMN").length, 4);
  assert.equal(list(rows, "IFCBEAM").length, 4);
  assert.equal(list(rows, "IFCWALLSTANDARDCASE").length, 1);
  assert.equal(list(rows, "IFCSLAB").length, 1);
  assert.equal(list(rows, "IFCEXTRUDEDAREASOLID").length, 10);
  assert.equal(output.report.exported.length + output.report.omitted.length, model.elements.length);
  assert.equal(output.report.omitted.length, 4);
  assert.ok(output.report.omitted.every(e => e.code === "NON_SOLID"));
  assert.equal(output.report.nativeIdeCadVerified, false);
  assert.ok(output.report.notTransferred.some(s => s.includes("Donatı")));
  assert.ok(list(rows, "IFCSIUNIT").some(e => e.values[1] === ".LENGTHUNIT." && e.values[2] === null && e.values[3] === ".METRE."));
  const check = (v: Value) => { if (Array.isArray(v)) v.forEach(check); else if (typeof v === "object" && v) assert.ok(rows.has(v.ref), `Missing #${v.ref}`); };
  [...rows.values()].forEach(e => e.values.forEach(check));
  for (const e of output.report.exported) assert.match(e.ifcId, /^[0-3][0-9A-Za-z_$]{21}$/);
  assert.equal(new Set(output.report.exported.map(e => e.ifcId)).size, 10);
  // The installed ideCAD importer reads the first member geometry's profile.
  // Axis-first wall geometry caused APPCRASH 0xa2988b in the native trial.
  for (const product of [...list(rows, "IFCBEAM"), ...list(rows, "IFCWALLSTANDARDCASE")]) {
    const shape = entity(rows, product.values[6]);
    const representations = (shape.values[2] as Value[]).map(ref => entity(rows, ref));
    assert.equal(representations[0].values[1], "Body");
    const solid = entity(rows, (representations[0].values[3] as Value[])[0]);
    assert.equal(solid.type, "IFCEXTRUDEDAREASOLID");
    assert.equal(entity(rows, solid.values[0]).type, "IFCRECTANGLEPROFILEDEF");
    assert.equal(representations[1].values[1], "Axis");
  }
});

test("ceiling containment compensates ideCAD's lower-storey assignment without shifting world coordinates", { timeout: 5000 }, () => {
  const model = createDemoModel();
  model.floors[0].elevation = -3; model.floors[0].height = 3.5;
  model.floors.push({ id: "upper", name: "Birinci Kat", elevation: .5, height: 4 });
  model.elements.push({ id: "roof", name: "DÇ", floorId: "upper", materialId: "concrete", layer: "Döşemeler", type: "slab", points: rectangle(0, 0, 4, 4), thickness: .2 });
  const { text, report } = exportCadModelIfc(model), rows = entities(text);
  assert.equal(report.storeys.length, 3);
  assert.deepEqual(report.storeys.map(s => s.elevation), [-3, .5, 4.5]);
  const beam = report.exported.find(e => e.id === "beam-0")!;
  assert.equal(beam.containerFloorId, "upper"); near(beam.bottom, 0); near(beam.top, .5);
  const roof = report.exported.find(e => e.id === "roof")!;
  assert.equal(roof.containerFloorId, report.storeys[2].id); near(roof.bottom, 4.3); near(roof.top, 4.5);
  const column = list(rows, "IFCCOLUMN").find(e => e.values[7] === "column-0")!;
  assert.deepEqual(transform(rows, column.values[5], [0, 0, 0]), [0, 0, -3]);
  const beamEntity = list(rows, "IFCBEAM").find(e => e.values[7] === "beam-0")!;
  assert.deepEqual(transform(rows, beamEntity.values[5], [4, 0, 0]), [4, 0, .25]);
  const roofEntity = list(rows, "IFCSLAB").find(e => e.values[7] === "roof")!;
  near(transform(rows, roofEntity.values[5], [0, 0, 0])[2], 4.3);
  const actualContainers = list(rows, "IFCRELCONTAINEDINSPATIALSTRUCTURE");
  assert.equal(actualContainers.length, 3);
  for (const relationship of actualContainers) {
    const storey = entity(rows, relationship.values[5]);
    for (const child of relationship.values[4] as Value[]) {
      const product = entity(rows, child), expected = report.exported.find(e => e.id === product.values[7])!;
      assert.equal(storey.values[2], report.storeys.find(s => s.id === expected.containerFloorId)!.name.replace(/ğ/g, "\\X2\\011F\\X0\\").replace(/ü/g, "\\X2\\00FC\\X0\\").replace(/ı/g, "\\X2\\0131\\X0\\"));
    }
  }
});

test("beam lateral offsets, rotations, column anchoring and exact circle sections survive geometry encoding", { timeout: 5000 }, () => {
  const model = createEmptyModel(); model.floors[0].elevation = 5;
  const common = { floorId: "floor-0", materialId: "concrete", layer: "Test" };
  model.elements = [
    { ...common, id: "b", name: "Kiriş", type: "beam", start: { x: 1, y: 2 }, end: { x: 1, y: 6 }, width: .4, height: .6, alignment: "left", offset: .1, topOffset: .2 },
    { ...common, id: "c", name: "Dairesel", type: "column", position: { x: 5, y: 7 }, width: .6, depth: .6, height: 2.5, section: "circle", rotation: 90, anchorMode: "corner", baseOffset: .2 },
  ];
  const { text, report } = exportCadModelIfc(model), rows = entities(text);
  const beam = list(rows, "IFCBEAM")[0];
  const start = transform(rows, beam.values[5], [0, 0, 0]), end = transform(rows, beam.values[5], [4, 0, 0]);
  near(start[0], .7); near(start[1], 2); near(start[2], 7.9);
  near(end[0], .7); near(end[1], 6);
  const column = list(rows, "IFCCOLUMN")[0], origin = transform(rows, column.values[5], [0, 0, 0]);
  near(origin[0], 5.3); near(origin[1], 7.3); near(origin[2], 5.2);
  assert.equal(list(rows, "IFCCIRCLEPROFILEDEF")[0].values[3], .3);
  near(report.exported.find(e => e.id === "c")!.volume, Math.PI * .3 ** 2 * 2.5);
  near(report.exported.find(e => e.id === "b")!.volume, .4 * .6 * 4);
});

test("slab holes are explicit profile voids and reduce volume; invalid or touching holes fail", { timeout: 5000 }, () => {
  const model = createDemoModel(), holes = { "slab-0": [rectangle(1, 1, 1, 1), rectangle(2.5, 2.5, .5, .5)] };
  const { text, report } = exportCadModelIfc(model, { holesBySlabId: holes }), rows = entities(text);
  const profile = list(rows, "IFCARBITRARYPROFILEDEFWITHVOIDS")[0];
  assert.equal((profile.values[3] as Value[]).length, 2);
  near(report.exported.find(e => e.id === "slab-0")!.volume, (16 - 1 - .25) * .15);
  for (const bad of [[rectangle(3, 3, 2, 2)], [rectangle(0, 0, 1, 1)], [rectangle(1, 1, 2, 2), rectangle(1.5, 1.5, .5, .5)], [rectangle(1, 1, 1, 1), rectangle(2, 1, 1, 1)]]) {
    assert.throws(() => exportCadModelIfc(model, { holesBySlabId: { "slab-0": bad } }), /boşluklar/);
  }
  assert.throws(() => exportCadModelIfc(model, { holesBySlabId: { missing: holes["slab-0"] } }), /bulunamadı/);
});

test("unsupported geometry is refused by default and explicit partial export accounts for each omission", { timeout: 5000 }, () => {
  const model = createDemoModel();
  for (const e of model.elements) {
    if (e.id === "beam-0" && e.type === "beam") e.endTopOffset = .3;
    if (e.id === "wall-0" && e.type === "wall") e.curveSagitta = .5;
    if (e.id === "column-0" && e.type === "column") e.leanX = .1;
    if (e.type === "slab") e.slopeY = 5;
  }
  assert.throws(() => exportCadModelIfc(model), (error: unknown) => error instanceof IfcExportError && error.issues.length === 4);
  const result = exportCadModelIfc(model, { unsupportedElements: "omit" });
  assert.equal(result.report.omitted.filter(e => e.code === "UNSUPPORTED_GEOMETRY").length, 4);
  assert.equal(result.report.exported.length, 6);
  assert.equal(result.report.exported.length + result.report.omitted.length, model.elements.length);
});

test("IFC is deterministic under input ordering and escapes Turkish text, quotes, slash and newlines", { timeout: 5000 }, () => {
  const model = createDemoModel(); model.name = "Çağrı 'Özel' \\ Test\n1";
  const first = exportCadModelIfc(model);
  const reordered: CadModel = { ...model, elements: [...model.elements].reverse(), materials: [...model.materials].reverse(), floors: [...model.floors].reverse() };
  assert.equal(exportCadModelIfc(reordered).text, first.text);
  assert.match(first.text, /\\X2\\00C7\\X0\\/);
  assert.match(first.text, /''\\X2\\00D6\\X0\\zel''/);
  assert.match(first.text, /\\\\ Test\\X2\\000A\\X0\\1/);
  assert.equal(list(entities(first.text), "IFCPROJECT").length, 1);
  assert.throws(() => exportCadModelIfc(model, { timestamp: "2026-02-31T00:00:00Z" }), /zaman/);
  model.floors.push({ id: "bad", name: "Boşluklu", elevation: 10, height: 3 });
  assert.throws(() => exportCadModelIfc(model), /katlar/);
});

test("ideCAD panel mode refuses slabs the native importer loses or trims without changing the source", { timeout: 5000 }, () => {
  const model = createDemoModel(), before = JSON.stringify(model);
  assert.deepEqual([...ideCadSlabPanelIssues(model).keys()], ["slab-0"]);
  assert.throws(() => exportCadModelIfc(model, { requireIdeCadPanels: true }), (error: unknown) =>
    error instanceof IfcExportError && error.issues.length === 1 && error.issues[0].id === "slab-0" && /kapalı alan/.test(error.message));
  model.elements = model.elements.filter(e => e.type !== "wall");
  assert.equal(ideCadSlabPanelIssues(model).size, 1, "a rectangle inside an outer frame is still trimmed by native import");
  model.elements = createDemoModel().elements;
  const partial = exportCadModelIfc(model, { requireIdeCadPanels: true, unsupportedElements: "omit" });
  assert.equal(partial.report.exported.length, 9);
  assert.equal(partial.report.omitted.find(e => e.id === "slab-0")?.code, "UNSUPPORTED_GEOMETRY");
  assert.equal(JSON.stringify(model), before, "export must not split or trim a user's slabs");
});

test("enclosed panel demo exports eleven solids; boundary order and a collinear vertex do not change panel matching", { timeout: 5000 }, () => {
  const model = createIdeCadPanelDemo();
  assert.equal(ideCadSlabPanelIssues(model).size, 0);
  const slab = model.elements.find(e => e.type === "slab")!;
  if (slab.type !== "slab") throw new Error("missing demo slab");
  const [a, b] = slab.points;
  slab.points.splice(1, 0, { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
  slab.points.reverse();
  assert.equal(ideCadSlabPanelIssues(model).size, 0);
  const result = exportCadModelIfc(model, { requireIdeCadPanels: true });
  assert.equal(result.report.exported.length, 11);
  assert.equal(result.report.omitted.length, 4);
  assert.equal(list(entities(result.text), "IFCSLAB").length, 2);
  assert.ok(result.report.notTransferred.some(s => s.includes("dayanım sınıfları")));
  assert.equal(result.report.nativeIdeCadVerified, false, "a validated example does not certify every exported file");
  slab.points[0].x += .01;
  assert.equal(ideCadSlabPanelIssues(model).size, 1);
});

test("ideCAD panel mode refuses unverified holes even though generic IFC writes explicit void profiles", { timeout: 5000 }, () => {
  const model = createIdeCadPanelDemo(), holes = { "panel-0": [rectangle(1, 2.5, .5, .5)] };
  assert.equal(list(entities(exportCadModelIfc(model, { holesBySlabId: holes }).text), "IFCARBITRARYPROFILEDEFWITHVOIDS").length, 1);
  assert.throws(() => exportCadModelIfc(model, { requireIdeCadPanels: true, holesBySlabId: holes }), (error: unknown) =>
    error instanceof IfcExportError && error.issues.length === 1 && error.issues[0].code === "NATIVE_HOLES_UNVERIFIED");
});

test("editor-only slab edges cannot certify a panel when those boundaries are not exported to ideCAD", { timeout: 5000 }, () => {
  const model = createEmptyModel(), ring = rectangle(0, 0, 4, 4);
  model.elements = ring.map((point, i) => ({ id: `edge-${i}`, name: `E${i}`, floorId: "floor-0", materialId: "concrete", layer: "Kenarlar", type: "slabEdge", start: point, end: ring[(i + 1) % ring.length] }));
  model.elements.push({ id: "s", name: "D1", floorId: "floor-0", materialId: "concrete", layer: "Döşemeler", type: "slab", points: ring, thickness: .15 });
  assert.equal(ideCadSlabPanelIssues(model).size, 1);
  assert.throws(() => exportCadModelIfc(model, { requireIdeCadPanels: true }), /kapalı alan/);
});

test("diagonal walls use a zero-centred profile and correctly transformed axis endpoints", { timeout: 5000 }, () => {
  const model = createEmptyModel();
  model.elements = [{ id: "p", name: "P1", floorId: "floor-0", materialId: "concrete", layer: "Perdeler", type: "wall", start: { x: 5, y: 10 }, end: { x: 8, y: 13 }, thickness: .2, height: 3, alignment: "right", offset: .15 }];
  const rows = entities(exportCadModelIfc(model).text), wall = list(rows, "IFCWALLSTANDARDCASE")[0];
  const origin = transform(rows, wall.values[5], [0, 0, 0]), shift = .05 / Math.sqrt(2);
  near(origin[0], 6.5 - shift); near(origin[1], 11.5 + shift);
  const profile = list(rows, "IFCRECTANGLEPROFILEDEF")[0];
  assert.deepEqual(vector(rows, entity(rows, profile.values[2]).values[0]), [0, 0]);
  near(profile.values[3] as number, Math.sqrt(18)); near(profile.values[4] as number, .2);
  const shape = entity(rows, wall.values[6]), representations = shape.values[2] as Value[];
  const axis = entity(rows, (entity(rows, representations[1]).values[3] as Value[])[0]);
  const points = (axis.values[0] as Value[]).map(ref => transform(rows, wall.values[5], vector(rows, ref)));
  near(points[0][0], 5 - shift); near(points[0][1], 10 + shift);
  near(points[1][0], 8 - shift); near(points[1][1], 13 + shift);
});
