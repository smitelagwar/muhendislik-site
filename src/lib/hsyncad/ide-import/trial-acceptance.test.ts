import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { parseIde10 } from "./index";
import { parseIdeProjectSnapshot, serializeIdeProject, exportIdeDxf } from "../ide-export";

const file = "C:/Users/hsyn/Desktop/MUSTAFA SELVİ 1.KISIM.ide11trial";
const original = "D:/IDM_DOWNLOAD/MUSTAFA SELVİ TÜM PROJELER/STATİK/1.kısım/MUSTAFA SELVİ 1.KISIM.ide10";
const digest = (bytes: Uint8Array) => createHash("sha256").update(bytes).digest("hex");
const buffer = (bytes: Uint8Array): ArrayBuffer => Uint8Array.from(bytes).buffer;
const close = (a: number, b: number) => assert.ok(Math.abs(a - b) < 1e-9, `${a} != ${b}`);

const KNOWN_TRIAL_DIGESTS = new Set([
  "8808af458b18f4300a28a33625db28b1f6401af596f579a2e82cd4eb410fc4d1",
  "007812939985974036ac2ddff157b8f2bd482d4b770905afb30ceb71f442f97c",
]);

test("actual IDE11 trial opens with native dimensions, graph, mesh and source immutability", { skip: !existsSync(file) || !existsSync(original), timeout: 30_000 }, () => {
  const source = readFileSync(file);
  const before = digest(source);
  assert.ok(KNOWN_TRIAL_DIGESTS.has(before), `Unexpected trial SHA-256: ${before}`);
  assert.ok(source.length === 146683236 || source.length === 146682896);
  assert.equal(source.readUInt32LE(74), 211220);
  assert.equal(source.readUInt32LE(79), source.length);
  assert.equal(source[78], 1);
  const title = Buffer.from([0x33, 0x2e, 0x20, 0x4b, 0x41, 0x54, 0]);
  const at = source.indexOf(title);
  assert.ok(at === 308304 || at === 307964);
  assert.equal(source.subarray(at + title.length, at + title.length + 8).toString("hex"), "33ed9728fb8a2229");
  assert.notEqual(source.readDoubleLE(at + title.length), 10.5);
  const copy = buffer(source);
  const project = parseIde10(copy, "MUSTAFA SELVİ 1.KISIM.ide11trial");
  const prior = parseIde10(buffer(readFileSync(original)), "original.ide10");
  assert.equal(project.format, "ide11trial");
  assert.deepEqual(project.floors.map(f => [f.name, f.elevation, f.height]), prior.floors.map(f => [f.name, f.elevation, f.height]));
  assert.equal(project.floors.length, 6);
  assert.equal(project.elements.length, 1273);
  assert.equal(project.coverage.unsupportedRecords, 0);
  assert.equal(project.coverage.holeRecords, 76);
  assert.deepEqual(project.coverage.byType, prior.coverage.byType);
  assert.equal(project.elements.filter(e => e.mesh).length, 7);
  const key = (e: typeof project.elements[number]) => `${e.floorId}:${e.nativeId}`;
  const old = new Map(prior.elements.map(e => [key(e), e]));
  for (const e of project.elements) {
    const p = old.get(key(e)); assert.ok(p); assert.equal(e.name, p.name);
    assert.equal(e.points.length, p.points.length);
    e.points.forEach((point, i) => { close(point.x, p.points[i].x); close(point.y, p.points[i].y); });
    for (const field of ["width", "thickness", "nativeZ", "lateralOffset"] as const) if (p[field] !== undefined) close(e[field]!, p[field]);
    if (p.mesh) { assert.deepEqual(e.mesh?.positions, p.mesh.positions); assert.deepEqual(e.mesh?.quads, p.mesh.quads); }
    if (p.planPaths) { assert.equal(e.planPaths?.length, p.planPaths.length); }
  }
  assert.equal(project.elements.filter(e => e.planAnnotation?.loads).length, 159);
  assert.equal(project.elements.filter(e => e.verticalSource === "native-wall-height").length, 221);
  assert.equal(project.elements.filter(e => e.type === "beam" && e.sectionLabel).length, 357);
  assert.equal(project.elements.reduce((sum, e) => sum + (e.planAnnotation?.designAxes?.length ?? 0), 0), 303);
  const saved = parseIdeProjectSnapshot(serializeIdeProject(project));
  assert.equal(saved.elements.length, 1273);
  assert.equal(saved.format, "ide11trial");
  assert.match(exportIdeDxf(saved, saved.floors.at(-1)!.id), /AC1024/);
  assert.equal(digest(new Uint8Array(copy)), before);
  assert.equal(digest(readFileSync(file)), before);
});

test("encoded carrier rejects unknown codec and incomplete source instead of inventing geometry", { skip: !existsSync(file), timeout: 15_000 }, () => {
  const input = buffer(readFileSync(file)), altered = input.slice(0);
  new DataView(altered).setUint32(74, 211221, true);
  assert.throws(() => parseIde10(altered, "renamed.ide10"), /kodlama sürümü/);
  assert.throws(() => parseIde10(input.slice(0, -1), "partial.ide11trial"), /boyutu uyuşmuyor/);
  const renamed = parseIde10(input, "renamed.ide10");
  assert.equal(renamed.format, "ide11trial", "header chooses the codec, never the extension");
});
