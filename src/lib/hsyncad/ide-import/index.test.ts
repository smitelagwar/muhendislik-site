import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { basename } from "node:path";
import { inflateSync } from "node:zlib";
import { parseIde10, type IdeProject } from "./index";
import { readNativeWallHeight } from "./native-plan-labels";
import { IDE_HEADER_SIGNATURE, sealIdeCarrierHeader } from "./ide-binary-codec";
import { encodeIdeFloat64 } from "./numeric-codec";

const close = (actual: number, expected: number) => assert.ok(Math.abs(actual - expected) < 1e-9, `${actual} != ${expected}`);
const sha256 = (data: Uint8Array) => createHash("sha256").update(data).digest("hex");
// These private test copies intentionally alter fields below the integrity
// layer. Seal only the test copy so the field grammar can still be exercised.
const sealTestCopy = (buffer: ArrayBuffer) => sealIdeCarrierHeader(new Uint8Array(buffer), { formatVersion: 201094, encodedFlag: 0 });
const samples = [
  {
    path: "D:\\IDM_DOWNLOAD\\SÜHEYLA KARA PROJELER\\STATİK\\218 ada 50 parsel STATİK.ide10",
    sha256: "de92fa251e51912d212281f0d1cfe8ee13f7474b703a4e6c3cc91aa88aef8b2b",
    bytes: 74359398, floors: [15.4, 12.4, 9.4, 6.4, 3.4, 0.4, -3.6], heights: [2.2, 3, 3, 3, 3, 3, 4], elements: 2171, holes: 107, stairs: 9, bands: 0, sections: 14,
    beam: "K39", beamFloor: 1, beamStart: [34.7, 11.258151537445759], beamEnd: [38.55, 11.258151537445759], foundation: "D50", foundationBottom: -4.35,
  },
  {
    path: "D:\\IDM_DOWNLOAD\\MUSTAFA SELVİ TÜM PROJELER\\STATİK\\2.kısım\\MUSTAFA SELVİ 2.KISIM.ide10",
    sha256: "0a4400a0a1d499d8fce98860fef3e8145c43d5925ee535bf9cb54017a5cbaf90",
    bytes: 48753119, floors: [10.5, 7.5, 4.5, 0.5, -2.5], heights: [3, 3, 3, 4, 3], elements: 686, holes: 27, stairs: 1, bands: 12, sections: 5,
    beam: "K5", beamFloor: 1, beamStart: [37.55, 20.65], beamEnd: [42.05, 20.65], foundation: "RD01", foundationBottom: -3.15,
  },
  {
    path: "D:\\IDM_DOWNLOAD\\MUSTAFA SELVİ TÜM PROJELER\\STATİK\\1.kısım\\MUSTAFA SELVİ 1.KISIM.ide10",
    sha256: "0095778181794af8f4f8cfb52cabcca3dda4fc098cb3ea33a90e5c659bdaf325",
    bytes: 145671130, floors: [13.5, 10.5, 7.5, 4.5, 0.5, -2.5], heights: [1.6, 3, 3, 3, 4, 3], elements: 1273, holes: 76, stairs: 7, bands: 25, sections: 6,
    beam: "K1", beamFloor: 1, beamStart: [5.25, 23.3], beamEnd: [10, 23.3], foundation: "RD01", foundationBottom: -3.15,
  },
] as const;

function assertAccounting(project: IdeProject) {
  const c = project.coverage;
  assert.equal(c.candidateRecords, c.decodedRecords + c.unsupportedRecords + c.holeRecords + c.rejectedCandidates);
  assert.equal(c.decodedRecords, project.elements.length);
  assert.equal(Object.values(c.byType).reduce((a, b) => a + b, 0), c.decodedRecords);
  assert.equal(Object.values(c.unsupportedTypes).reduce((a, b) => a + b, 0), c.unsupportedRecords);
  assert.equal(new Set(project.elements.map(e => e.id)).size, project.elements.length);
}

test("rejects JSON, empty input, damaged format header and missing floor data", () => {
  for (const text of ["", '{"schemaVersion":1}', "IDE BUILDING DESIGNER PROJECT FILE\r\nVer 3 SubVer 00\r\n"]) {
    const bytes = new TextEncoder().encode(text);
    assert.throws(() => parseIde10(bytes.buffer, "broken.ide10"), /desteklenen/);
  }
  const header = new Uint8Array(273);
  header.set(new TextEncoder().encode(IDE_HEADER_SIGNATURE));
  new DataView(header.buffer).setUint32(96, 1, true);
  sealTestCopy(header.buffer);
  assert.throws(() => parseIde10(header.buffer, "empty.ide10"), /kat kayıtları/);
});

const nativeIfcFixture = process.env.HSYNCAD_IFC_NATIVE_FIXTURE;
test("native IFC-created trial: unformatted floor title, imported beam sections and empty slab accounting", { skip: !nativeIfcFixture, timeout: 10000 }, () => {
  const bytes = Uint8Array.from(readFileSync(nativeIfcFixture!));
  assert.equal(sha256(bytes), "7b50f625a9ad91f9f5e96630c5230375d9533d5bfb830e85a2db978aa9f82e63");
  const project = parseIde10(bytes.buffer, "hsyncad-4x4-body-first-ilk-kayit.ide11trial");
  assert.deepEqual(project.floors.map(f => [f.name, f.elevation, f.height]), [["Zemin kat", 0, 3]]);
  assert.equal(project.elements.length, 9);
  assert.equal(project.coverage.candidateRecords, 10);
  assert.equal(project.coverage.unsupportedTypes["Döşeme sınır noktaları boş"], 1);
  assert.equal(project.coverage.unsupportedRecords, 1);
  assertAccounting(project);
  const beams = project.elements.filter(e => e.type === "beam");
  assert.equal(beams.length, 4);
  for (const beam of beams) {
    assert.equal(beam.sectionLabel, "25/50"); close(beam.bottom!, 2.5); close(beam.top!, 3);
  }
  const unknownBeam = bytes.slice(), beam = beams[0];
  new DataView(unknownBeam.buffer).setUint32(beam.sourceOffset + beam.name.length + 1 + 274, 69, true);
  sealIdeCarrierHeader(unknownBeam, { formatVersion: 211280, encodedFlag: 1 });
  const planOnly = parseIde10(unknownBeam.buffer, "unknown-beam-style.ide11trial").elements.find(e => e.id === beam.id)!;
  assert.equal(planOnly.planOnly, true);
  assert.equal(planOnly.height, undefined);
  const damaged = bytes.slice(), floor = project.floors[0];
  const floorData = floor.sourceOffset + new DataView(damaged.buffer).getUint32(floor.sourceOffset - 4, true);
  new DataView(damaged.buffer).setUint32(floorData + 20, 0, true);
  sealIdeCarrierHeader(damaged, { formatVersion: 211280, encodedFlag: 1 });
  assert.throws(() => parseIde10(damaged.buffer, "damaged-floor.ide11trial"), /kat kayıtları/);
  assert.equal(sha256(bytes), "7b50f625a9ad91f9f5e96630c5230375d9533d5bfb830e85a2db978aa9f82e63");
});

const nativePanelsFixture = process.env.HSYNCAD_IFC_PANELS_FIXTURE;
test("native IFC panel acceptance: eleven solids including two bounded slabs survive original application save", { skip: !nativePanelsFixture, timeout: 10000 }, () => {
  const bytes = Uint8Array.from(readFileSync(nativePanelsFixture!));
  assert.equal(sha256(bytes), "7b63a5b1a9d3d263fe73914ea878b597985be9e09b09ca97dd20015f8b08c254");
  const project = parseIde10(bytes.buffer, "hsyncad-paneller-ilk-kayit.ide11trial");
  assert.deepEqual(project.floors.map(f => [f.name, f.elevation, f.height]), [["Zemin kat", 0, 3]]);
  assert.deepEqual(project.coverage.byType, { beam: 4, column: 4, wall: 1, slab: 2 });
  assert.equal(project.coverage.unsupportedRecords, 0);
  assertAccounting(project);
  const slabs = project.elements.filter(e => e.type === "slab");
  for (const slab of slabs) {
    close(slab.bottom!, 2.85); close(slab.top!, 3); close(slab.thickness!, .15);
    assert.equal(slab.points.length, 8); assert.equal(slab.holes?.length ?? 0, 0);
    const xs = slab.points.map(p => p.x), ys = slab.points.map(p => p.y);
    close(Math.min(...xs), .125); close(Math.max(...xs), 3.875);
    const expected = slab.name === "D1" ? [2.1, 3.875] : [.125, 1.9];
    close(Math.min(...ys), expected[0]); close(Math.max(...ys), expected[1]);
  }
  assert.equal(project.elements.find(e => e.type === "wall")!.structural, true);
});

for (const sample of [
  { label: "first save", path: process.env.HSYNCAD_IFC_TC33_FIXTURE, sha256: "5dcf547bbc5c00aa68eb4f2362222b7d6d615a4f1e6ca96628e18ec83f9bd296" },
  { label: "reopened and saved", path: process.env.HSYNCAD_IFC_TC33_RESAVED_FIXTURE, sha256: "c3b4c34514351577966982e4f8537ef838579e5f37935b2fa59389a5e79e3937" },
]) test(`native IFC three-storey ${sample.label} retains unopened top floor, different heights and all thirty-three solids`, { skip: !sample.path, timeout: 10000 }, () => {
  const bytes = Uint8Array.from(readFileSync(sample.path!));
  assert.equal(sha256(bytes), sample.sha256);
  const project = parseIde10(bytes.buffer, "hsyncad-tc33-ilk-kayit.ide11trial");
  assert.deepEqual(project.floors.map(f => [f.name, f.elevation, f.height]), [["Birinci kat", 3.5, 2.8], ["Zemin", 0, 3.5], ["Bodrum", -3, 3]]);
  assert.equal(project.elements.length, 33); assert.equal(project.coverage.ignoredTemplateRecords, 0);
  assert.equal(project.coverage.unsupportedRecords, 0); assertAccounting(project);
  for (const [index, floor] of project.floors.entries()) {
    const elements = project.elements.filter(e => e.floorId === floor.id);
    assert.equal(elements.length, 11);
    for (const beam of elements.filter(e => e.type === "beam")) {
      close(beam.top!, [6.3, 3.5, 0][index]); close(beam.height!, [.4, .65, .5][index]);
    }
    for (const slab of elements.filter(e => e.type === "slab")) {
      close(slab.top!, [6.3, 3.5, 0][index]); close(slab.thickness!, [.18, .2, .15][index]);
      assert.equal(slab.points.length, 8);
    }
  }
  const damaged = bytes.slice(), floor = project.floors[0];
  const data = floor.sourceOffset + new DataView(damaged.buffer).getUint32(floor.sourceOffset - 4, true);
  // Both copies of one bound are changed equally: duplicated values alone
  // cannot certify an unopened header; the exact sentinel must also match.
  damaged.set(encodeIdeFloat64(2), data + 40);
  damaged.set(encodeIdeFloat64(2), data + 48);
  sealIdeCarrierHeader(damaged, { formatVersion: 211280, encodedFlag: 1 });
  assert.equal(parseIde10(damaged.buffer, "damaged-unopened-floor.ide11trial").floors.length, 2);
  assert.equal(sha256(bytes), sample.sha256);
});

const nativeOffsetFixture = process.env.HSYNCAD_IFC_TC8_FIXTURE;
test("native IFC custom sections retain short member top offsets and analytic circle radius", { skip: !nativeOffsetFixture, timeout: 10000 }, () => {
  const bytes = Uint8Array.from(readFileSync(nativeOffsetFixture!));
  assert.equal(sha256(bytes), "b65c4f22d09e943066a30aa6a27539bf376e67cadc69522d6d175105e6ee1649");
  const project = parseIde10(bytes.buffer, "hsyncad-tc8-ilk-kayit.ide11trial");
  assert.equal(project.elements.length, 8); assertAccounting(project);
  const short = project.elements.find(e => e.name === "S92")!, wall = project.elements.find(e => e.name === "P91")!;
  close(short.bottom!, .2); close(short.top!, 2.5); close(short.height!, 2.3);
  close(short.nativeTopOffset!.value, -.5); assert.equal(short.verticalSource, "native-member-offset");
  close(wall.bottom!, .3); close(wall.top!, 1.5); close(wall.height!, 1.2); close(wall.nativeTopOffset!.value, -1.5);
  const circle = project.elements.find(e => e.name === "S93")!;
  close(circle.circleSection!.radius, .3); close(circle.circleSection!.center.x, 4); close(circle.circleSection!.center.y, 0);
  assert.equal(circle.points.length, 25, "native display points remain intact");
  assert.equal(circle.footprint!.length, 64, "viewer footprint is derived from the authenticated circle radius");
  const changed = bytes.slice(); changed.set(encodeIdeFloat64(-.9), short.nativeTopOffset!.sourceOffset);
  sealIdeCarrierHeader(changed, { formatVersion: 211280, encodedFlag: 1 });
  close(parseIde10(changed.buffer, "changed-short-copy.ide11trial").elements.find(e => e.name === "S92")!.top!, 2.1);
  const badCircle = bytes.slice(); badCircle.set(encodeIdeFloat64(.4), circle.circleSection!.sourceOffset);
  sealIdeCarrierHeader(badCircle, { formatVersion: 211280, encodedFlag: 1 });
  assert.equal(parseIde10(badCircle.buffer, "bad-circle-copy.ide11trial").elements.find(e => e.name === "S93")!.circleSection, undefined);
  assert.equal(sha256(bytes), "b65c4f22d09e943066a30aa6a27539bf376e67cadc69522d6d175105e6ee1649");
});

for (const sample of samples) test(`native sample acceptance: ${basename(sample.path)}`, { skip: !existsSync(sample.path), timeout: 30000 }, () => {
  // Originals stay outside the repository/public tree. SHA binds the test to
  // exactly the three human-selected files, not to an inferred nearby report.
  const input = readFileSync(sample.path);
  assert.equal(input.length, sample.bytes);
  assert.equal(sha256(input), sample.sha256);
  const buffer = input.buffer.slice(input.byteOffset, input.byteOffset + input.byteLength);
  const before = sha256(new Uint8Array(buffer));
  const project = parseIde10(buffer, basename(sample.path));
  assert.equal(sha256(new Uint8Array(buffer)), before, "reader mutated its input");
  assert.equal(sha256(readFileSync(sample.path)), sample.sha256, "original source changed");
  assert.equal(project.floors.length, sample.floors.length);
  for (let i = 0; i < sample.floors.length; i++) {
    close(project.floors[i].elevation, sample.floors[i]);
    close(project.floors[i].height, sample.heights[i]);
  }
  assert.ok(project.floors.some(f => f.name === "ZEMİN KAT"), "CP1254 Turkish text must survive");
  assert.equal(project.elements.length, sample.elements);
  assert.equal(project.elements.reduce((sum, e) => sum + (e.holes?.length ?? 0), 0), sample.holes);
  assert.equal(project.coverage.holeRecords, sample.holes);
  assertAccounting(project);
  assert.equal(project.coverage.unsupportedRecords, 0, "all named candidates in the verified grammar are represented");
  assert.equal(project.elements.filter(e => e.type === "band").length, sample.bands);
  assert.equal(project.elements.filter(e => e.type === "section").length, sample.sections);
  for (const element of project.elements.filter(e => e.type === "band" || e.type === "section")) {
    assert.equal(element.planOnly, true);
    assert.equal(element.points.length, 2);
    assert.equal(element.bottom, undefined); assert.equal(element.top, undefined);
    assert.equal(element.height, undefined); assert.equal(element.thickness, undefined);
    const nameOffset = element.sourceOffset;
    const geometryOffset = nameOffset - (element.type === "band" ? 121 : 113);
    const view = new DataView(buffer);
    assert.equal(view.getUint32(geometryOffset, true), element.type === "band" ? 128 : 123);
    for (let i = 0; i < 2; i++) {
      close(element.points[i].x, view.getFloat64(geometryOffset + 8 + i * 16, true));
      close(element.points[i].y, view.getFloat64(geometryOffset + 16 + i * 16, true));
    }
    if (element.type === "band") {
      close(element.width!, 0.4);
      assert.equal(element.footprint!.length, 4);
      const [a, b] = element.points, length = Math.hypot(b.x - a.x, b.y - a.y);
      const nx = -(b.y - a.y) / length, ny = (b.x - a.x) / length;
      for (const [i, point] of [a, b, b, a].entries()) {
        const offset = element.lateralOffset - (i < 2 ? element.width! : 0);
        close(element.footprint![i].x, point.x + nx * offset);
        close(element.footprint![i].y, point.y + ny * offset);
      }
    } else assert.equal(element.footprint, undefined);
  }
  const stairs = project.elements.filter(e => e.type === "stair");
  assert.equal(stairs.length, sample.stairs);
  assert.equal(project.coverage.byType.stair, sample.stairs);
  const sourceView = new DataView(buffer);
  for (const stair of stairs) {
    const mesh = stair.mesh!;
    assert.equal(mesh.source, "native-analysis-mesh");
    assert.equal(mesh.surfaceOnly, true);
    assert.equal(stair.verticalSource, "native-analysis-mesh");
    assert.equal(stair.thickness, undefined, "analysis surfaces must not acquire an inferred solid thickness");
    assert.ok(stair.stairParameters && Object.keys(stair.stairParameters.variables).length > 0);
    const at = mesh.sourceOffset!, count = sourceView.getUint32(at + 4, true);
    assert.equal(mesh.sourceNodeCount, count);
    assert.equal(mesh.positions.length, count * 3);
    const propertiesAt = at + 8 + count * 12;
    const zOffset = propertiesAt + 4 + sourceView.getUint32(propertiesAt, true) * 12 + 4;
    let bottom = Infinity, top = -Infinity;
    for (let i = 0; i < count; i++) {
      // The independent assertion reads the native source fields directly;
      // world Z must survive unchanged, without a second floor translation.
      assert.equal(mesh.positions[i * 3], sourceView.getFloat32(at + 8 + i * 12, true));
      assert.equal(mesh.positions[i * 3 + 1], sourceView.getFloat32(at + 12 + i * 12, true));
      const z = sourceView.getFloat32(zOffset + i * 4, true);
      assert.equal(mesh.positions[i * 3 + 2], z);
      bottom = Math.min(bottom, z); top = Math.max(top, z);
    }
    assert.equal(stair.bottom, bottom); assert.equal(stair.top, top);
    const connectivity = mesh.connectivityOffset!, compressedLength = sourceView.getUint32(connectivity - 8, true);
    // Node's zlib is independent from the browser reader's fflate decoder.
    const raw = inflateSync(new Uint8Array(buffer, connectivity, compressedLength));
    assert.equal(raw.length, sourceView.getUint32(connectivity - 4, true));
    const faces = raw.readUInt32LE(0);
    assert.equal(mesh.sourceFaceCount, faces);
    assert.equal(mesh.quads!.length, faces * 4);
    assert.equal(mesh.indices!.length, faces * 6);
    const referenced = new Set<number>();
    for (let i = 0; i < faces; i++) {
      const q = [0, 1, 2, 3].map(j => raw.readUInt32LE(4 + i * 20 + j * 4));
      assert.deepEqual(mesh.quads!.slice(i * 4, i * 4 + 4), q);
      assert.deepEqual(mesh.indices!.slice(i * 6, i * 6 + 6), [q[0], q[1], q[2], q[0], q[2], q[3]]);
      for (const index of q) { assert.ok(index < count); referenced.add(index); }
    }
    assert.equal(referenced.size, count);
    assert.ok(stair.planPaths!.length > 0);
    assert.ok(stair.planPaths!.every(p => p.length >= 2 && p.every(point => Number.isFinite(point.x) && Number.isFinite(point.y))), "plan paths remain separate finite polylines, including verified tread cuts and walking lines");
  }
  // The first storey has no preceding T01 template. Its repeated native view
  // coordinates plus matching native viewport title authenticate it instead.
  assert.ok(project.elements.some(e => e.floorId === project.floors[0].id));
  const firstFloor = project.floors[0], floorNameBytes = new DataView(buffer).getUint32(firstFloor.sourceOffset - 4, true);
  const damagedFloor = buffer.slice(0);
  new DataView(damagedFloor).setFloat64(firstFloor.sourceOffset + floorNameBytes + 36, Number.NaN, true);
  sealTestCopy(damagedFloor);
  assert.equal(parseIde10(damagedFloor, "damaged-floor-header.ide10").floors.length, project.floors.length - 1);
  const loadedSlab = project.elements.find(e => e.type === "slab" && !e.foundation && e.planAnnotation?.loads)!;
  assert.ok(loadedSlab);
  const loadFields = loadedSlab.planAnnotation!.loads!, attributes = loadedSlab.sourceOffset + loadedSlab.name.length + 1;
  close(loadFields.dead, new DataView(buffer).getFloat64(attributes + 497, true));
  close(loadFields.live, new DataView(buffer).getFloat64(attributes + 481, true));
  assert.equal(loadFields.unit, "tf/m²");
  const customLoad = buffer.slice(0); new DataView(customLoad).setFloat64(attributes + 497, 0.1234, true);
  sealTestCopy(customLoad);
  close(parseIde10(customLoad, "changed-load-copy.ide10").elements.find(e => e.id === loadedSlab.id)!.planAnnotation!.loads!.dead, 0.1234);
  const brokenLoad = buffer.slice(0); new DataView(brokenLoad).setFloat64(attributes + 497, Number.NaN, true);
  sealTestCopy(brokenLoad);
  assert.equal(parseIde10(brokenLoad, "broken-load-copy.ide10").elements.find(e => e.id === loadedSlab.id)!.planAnnotation?.loads, undefined);
  if (sample.stairs === 7) {
    const basement = project.floors.at(-1)!;
    const slab = project.elements.find(e => e.name === "D4" && e.floorId === basement.id)!;
    close(slab.planAnnotation!.loads!.dead, 0.545); close(slab.planAnnotation!.loads!.live, 0.5);
    assert.equal(slab.planAnnotation!.designAxes!.length, 2);
    const horizontal = slab.planAnnotation!.designAxes!.find(a => a.direction === "x")!;
    close(horizontal.points[0].x, 5.5); close(horizontal.points[0].y, 18.5); close(horizontal.points[1].x, 9.75);
    const vertical = slab.planAnnotation!.designAxes!.find(a => a.direction === "y")!;
    close(vertical.points[0].x, 7.625); close(vertical.points[0].y, 15.25); close(vertical.points[1].y, 21.75);
    for (const [name, section] of [["P1", "475/25"], ["P2", "485/25"], ["P3", "550/25"], ["P4", "390/25"], ["P35", "25/150"], ["K55", "25/50"]]) {
      assert.equal(project.elements.find(e => e.name === name && e.floorId === basement.id)!.planAnnotation!.section, section);
    }
  }
  const masonry = project.elements.filter(e => e.type === "wall" && e.structural === false && e.nativeHeightOffset !== undefined);
  assert.equal(masonry.length, project.elements.filter(e => e.type === "wall" && e.structural === false).length, "all flat masonry walls in these samples have native heights");
  for (const wall of masonry) {
    assert.equal(wall.verticalSource, "native-wall-height");
    assert.equal(wall.height, new DataView(buffer).getFloat64(wall.nativeHeightOffset!, true));
    close(wall.top! - wall.bottom!, wall.height!);
  }
  if (masonry.length) {
  const firstWall = masonry[0], damagedWall = buffer.slice(0);
  new DataView(damagedWall).setFloat64(firstWall.nativeHeightOffset!, Number.NaN, true);
  assert.equal(readNativeWallHeight(new DataView(damagedWall), firstWall.sourceOffset, firstWall.name, damagedWall.byteLength), undefined);
  new DataView(damagedWall).setFloat64(firstWall.nativeHeightOffset!, firstWall.height!, true);
  new DataView(damagedWall).setUint32(firstWall.nativeHeightOffset! - 4, 0, true);
  assert.equal(readNativeWallHeight(new DataView(damagedWall), firstWall.sourceOffset, firstWall.name, damagedWall.byteLength), undefined, "height requires its native typed tag");
  }
  const beam = project.elements.find(e => e.name === sample.beam && e.floorId === project.floors[sample.beamFloor].id)!;
  assert.ok(beam);
  close(beam.points[0].x, sample.beamStart[0]); close(beam.points[0].y, sample.beamStart[1]);
  close(beam.points[1].x, sample.beamEnd[0]); close(beam.points[1].y, sample.beamEnd[1]);
  assert.equal(beam.sectionLabel, "25/50"); close(beam.width!, 0.25); close(beam.height!, 0.5);
  assert.equal(beam.verticalSource, "storey-derived", "derived elevations must stay explicit");
  const foundation = project.elements.find(e => e.name === sample.foundation && e.foundation)!;
  assert.ok(foundation, "native raft flag must distinguish a foundation from a ceiling slab");
  close(foundation.top!, project.floors.at(-1)!.elevation);
  close(foundation.bottom!, sample.foundationBottom);
  for (const e of project.elements) {
    const floor = project.floors.find(f => f.id === e.floorId)!;
    assert.ok(e.sourceOffset >= floor.sourceOffset && e.sourceOffset < floor.endOffset);
    if (e.footprint) assert.ok(e.footprint.length >= 3);
  }
  assert.ok(project.warnings.length > 0, "partial native coverage must not claim complete equivalence");
  if (sample.stairs === 9) {
    const column = project.elements.find(e => e.name === "S36" && e.floorId === project.floors[1].id)!;
    close(column.footprint![0].x, 38.55); close(column.footprint![0].y, 10.958151537445758);
    const slab = project.elements.find(e => e.name === "D07" && e.floorId === project.floors[1].id)!;
    assert.equal(slab.points.length, 10); assert.equal(slab.holes!.length, 1);
    close(slab.holes![0][0].x, 9.85); close(slab.holes![0][0].y, 20.283151537443416);
    // Corrupt a real float64 point in a private copy: no plausible-coordinate
    // fallback or fabricated replacement may keep the damaged member visible.
    const damaged = buffer.slice(0);
    new DataView(damaged).setFloat64(3541567 + 8, Number.NaN, true);
    sealTestCopy(damaged);
    const partial = parseIde10(damaged, "damaged-copy.ide10");
    assert.ok(!partial.elements.some(e => e.id === beam.id));
    assert.equal(partial.coverage.unsupportedRecords, project.coverage.unsupportedRecords + 1);
    assertAccounting(partial);
  }
});
