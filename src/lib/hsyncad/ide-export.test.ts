import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
// @ts-expect-error Upstream's independent DXF parser publishes JavaScript only.
import DxfParser from "dxf-viewer/src/parser/DxfParser.js";
import { parseIde10, type IdeElement, type IdeProject } from "./ide-import";
import { exportIdeDxf, exportIdeSvg, ideExportBasename, parseIdeProjectSnapshot, serializeIdeProject } from "./ide-export";

const rectangle = (x: number, y: number, width: number, height: number) => [{ x, y }, { x: x + width, y }, { x: x + width, y: y + height }, { x, y: y + height }];
function fixture(): IdeProject {
  const member = (id: string, overrides: Partial<IdeElement>): IdeElement => ({ id, nativeId: Number(id), name: id, type: "line", floorId: "floor0", points: [], sourceOffset: 10, primitiveType: 6, layerId: 1, nativeZ: 0, lateralOffset: 0, rotation: 0, ...overrides });
  const elements: IdeElement[] = [
    member("1", { name: 'D<4 & "test">', type: "slab", points: rectangle(0, 0, 10, 8), holes: [rectangle(2, 3, 2, 2)], thickness: .15, planAnnotation: { loads: { dead: .545, live: .5, unit: "tf/m²", sourceOffset: 20 }, designAxes: [{ points: [{ x: 5, y: 0 }, { x: 5, y: 8 }], direction: "y", sourceOffset: 20 }] } }),
    member("2", { name: "K1", type: "beam", points: [{ x: 0, y: 1 }, { x: 10, y: 1 }], footprint: rectangle(0, .75, 10, .25), width: .25, height: .5, sectionLabel: "25/50" }),
    member("3", { name: "Gğ & <A>", type: "axis", points: [{ x: -1, y: -1 }, { x: 12, y: -1 }] }),
    member("4", { name: "M1", type: "stair", points: [{ x: 6, y: 2 }], planPaths: [[{ x: 6, y: 2 }, { x: 7, y: 2 }], [{ x: 6, y: 3 }, { x: 6.5, y: 3.5 }, { x: 7, y: 3 }]], planTexts: [{ point: { x: 6.5, y: 2.1 }, text: "1" }, { point: { x: 6.5, y: 3.1 }, text: '<script onload="alert(1)">&</script>' }] }),
    member("5", { name: "RD01", type: "slab", foundation: true, points: rectangle(-2, -2, 15, 12), thickness: .65 }),
    member("6", { name: "UPPER", floorId: "floor1", sourceOffset: 95, points: [{ x: 100, y: 100 }, { x: 101, y: 101 }] }),
  ];
  return { format: "ide10", filename: "source.ide10", name: '<script> & "project"', byteLength: 100, floors: [{ id: "floor0", name: "ZEMİN KAT", elevation: 0, height: 3, sourceOffset: 0, endOffset: 90 }, { id: "floor1", name: "1. KAT", elevation: 3, height: 3, sourceOffset: 90, endOffset: 100 }], elements, coverage: { candidateRecords: 6, decodedRecords: 6, unsupportedRecords: 0, ignoredTemplateRecords: 0, holeRecords: 0, rejectedCandidates: 0, byType: { slab: 2, beam: 1, axis: 1, stair: 1, line: 1 }, unsupportedTypes: {}, limitations: ["Decoded geometry only"] }, warnings: ["Not a native ideCAD serialization"] };
}

test("viewer snapshots preserve geometry/provenance and reject corrupt or executable-shaped data", () => {
  const project = fixture(), output = serializeIdeProject(project);
  assert.deepEqual(parseIdeProjectSnapshot(output), project);
  const trialMetadata = { ...project, format: "ide11trial" as const };
  assert.equal(parseIdeProjectSnapshot(serializeIdeProject(trialMetadata)).format, "ide11trial");
  for (const changed of [
    { ...project, format: "unsupported" },
    { ...project, coverage: { ...project.coverage, decodedRecords: 99 } },
    { ...project, elements: project.elements.map((e, i) => i === 0 ? { ...e, floorId: "absent" } : e) },
    { ...project, elements: project.elements.map((e, i) => i === 1 ? { ...e, id: "1" } : e) },
    { ...project, elements: project.elements.map((e, i) => i === 0 ? { ...e, points: [{ x: 1e7, y: 0 }] } : e) },
  ]) assert.throws(() => parseIdeProjectSnapshot(JSON.stringify({ kind: "hsyncad-ide-viewer", schemaVersion: 1, project: changed })), /Geçerli/);
  assert.throws(() => parseIdeProjectSnapshot(output.replace('"x":0', '"x":1e309')), /Geçerli/);
  assert.throws(() => parseIdeProjectSnapshot('{"kind":"hsyncad-ide-viewer","schemaVersion":2}'), /Geçerli/);
  const poisoned = JSON.parse(output); poisoned.project.extra = JSON.parse('{"__proto__":{"polluted":true}}');
  assert.throws(() => parseIdeProjectSnapshot(JSON.stringify(poisoned)), /Geçerli/);
  const bad = fixture(); bad.elements[0].points[0].x = Number.NaN;
  assert.throws(() => serializeIdeProject(bad), /Geçerli/, "NaN must be rejected before JSON turns it into null");
});

test("snapshot mesh references cannot address absent vertices", () => {
  const project = fixture();
  project.elements[3].mesh = { source: "native-analysis-mesh", positions: [0, 0, 0, 1, 0, 0, 0, 1, 0], indices: [0, 1, 2], surfaceOnly: true };
  assert.deepEqual(parseIdeProjectSnapshot(serializeIdeProject(project)).elements[3].mesh, project.elements[3].mesh);
  project.elements[3].mesh!.indices![2] = 3;
  assert.throws(() => serializeIdeProject(project), /Geçerli/);
});

test("R2010 DXF opens with an independent parser, keeps metres/holes and two endpoint labels", () => {
  const project = fixture(), before = JSON.stringify(project), dxf = exportIdeDxf(project, "floor0");
  const parsed = new DxfParser().parseSync(dxf) as { header: Record<string, unknown>; entities: { type: string; layer: string; vertices?: { x: number; y: number }[]; shape?: boolean; center?: { x: number; y: number }; text?: string; x?: number; y?: number }[] };
  assert.equal(parsed.header.$ACADVER, "AC1024"); assert.equal(parsed.header.$INSUNITS, 6);
  const slab = parsed.entities.find(e => e.type === "LWPOLYLINE" && e.layer === "IDE_SLAB")!;
  assert.equal(slab.shape, true); assert.deepEqual(slab.vertices!.map(v => ({ x: v.x, y: v.y })), rectangle(0, 0, 10, 8));
  const hole = parsed.entities.find(e => e.layer === "IDE_SLAB_HOLES")!;
  assert.equal(hole.shape, true); assert.deepEqual(hole.vertices!.map(v => ({ x: v.x, y: v.y })), rectangle(2, 3, 2, 2));
  const bubbles = parsed.entities.filter(e => e.type === "CIRCLE");
  assert.equal(bubbles.length, 2); assert.deepEqual(bubbles.map(e => e.center), [{ x: -1, y: -1, z: 0 }, { x: 12, y: -1, z: 0 }]);
  assert.equal(parsed.entities.filter(e => e.type === "TEXT" && e.layer === "IDE_AXIS").length, 2);
  assert.ok(dxf.includes("\\U+011F"), "Turkish text is preserved through ASCII DXF escapes");
  assert.ok(!dxf.includes("UPPER")); assert.ok(!dxf.includes("RD01"), "ceiling plan does not silently include the raft");
  assert.ok(parsed.entities.some(e => e.layer === "IDE_DESIGN_Y"));
  assert.equal(parsed.entities.filter(e => e.type === "LWPOLYLINE" && e.layer === "IDE_STAIR").length, 2);
  assert.equal(JSON.stringify(project), before, "export must not mutate the open project");
  assert.match(dxf, /0\r\nENDSEC\r\n0\r\nEOF\r\n$/);
});

test("SVG escapes all source text and keeps true hole subpaths and source floor isolation", () => {
  const project = fixture(), svg = exportIdeSvg(project, "floor0");
  assert.ok(!svg.includes("<script")); assert.ok(svg.includes("&lt;script&gt;"));
  assert.ok(svg.includes("D&lt;4 &amp; &quot;test&quot;&gt;"));
  assert.ok(svg.includes('fill-rule="evenodd"')); assert.ok(svg.includes("M2,-3 L4,-3 L4,-5 L2,-5 Z"));
  assert.equal((svg.match(/<circle /g) ?? []).length, 2);
  assert.ok(svg.includes("G=0.545 tf/m²")); assert.ok(svg.includes("Q=0.5 tf/m²"));
  assert.ok(!svg.includes("UPPER")); assert.ok(!svg.includes("RD01"));
  assert.ok(svg.includes('font-size="0.09"'), "native-derived stair numbers are retained");
  assert.ok(!exportIdeSvg(project, "floor0", { labels: false }).includes("<text"));
  assert.ok(exportIdeSvg(project, "floor0", { includeFoundations: true }).includes("RD01"));
  assert.throws(() => exportIdeSvg(project, "missing"), /kat bulunamadı/);
  assert.equal(ideExportBasename('C:\\folder\\MUSTAFA SELVİ 1.KISIM.ide11trial'), "MUSTAFA SELVİ 1.KISIM");
});

const personalNative = "D:/IDM_DOWNLOAD/MUSTAFA SELVİ TÜM PROJELER/STATİK/1.kısım/MUSTAFA SELVİ 1.KISIM.ide10";
test("the supplied native project supports a complete viewer round trip and independent vector exports", { skip: !existsSync(personalNative), timeout: 30_000 }, () => {
  const source = readFileSync(personalNative);
  const project = parseIde10(source.buffer.slice(source.byteOffset, source.byteOffset + source.byteLength), "MUSTAFA SELVİ 1.KISIM.ide10");
  const restored = parseIdeProjectSnapshot(serializeIdeProject(project));
  // JSON normalization drops undefined keys/prototypes and maps -0 to 0; all
  // serialized geometry/provenance values must otherwise remain identical.
  assert.deepEqual(restored, JSON.parse(JSON.stringify(project)));
  const floor = project.floors.at(-1)!;
  const output = exportIdeDxf(project, floor.id);
  const parsed = new DxfParser().parseSync(output);
  assert.ok(parsed.entities.length > 100);
  assert.ok(exportIdeSvg(project, floor.id).includes("G=0.545"));
  assert.equal(project.byteLength, source.byteLength);
});
