import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { parseIde10 } from "./index";
import { saveNativeIdeSource } from "../ide-native-save";
import { parseIdeProjectSnapshot, serializeIdeProject, exportIdeDxf } from "../ide-export";
import { transcodeIde11TrialToIde10, transcodeIde11TrialToIde11 } from "./ide11-transcoder";
import { validateIdeCarrier } from "./ide-binary-codec";

const file = "C:/Users/hsyn/Desktop/MUSTAFA SELVİ 1.KISIM.ide11trial";
const original = "D:/IDM_DOWNLOAD/MUSTAFA SELVİ TÜM PROJELER/STATİK/1.kısım/MUSTAFA SELVİ 1.KISIM.ide10";
const digest = (bytes: Uint8Array) => createHash("sha256").update(bytes).digest("hex");
const buffer = (bytes: Uint8Array): ArrayBuffer => Uint8Array.from(bytes).buffer;
const close = (a: number, b: number) => assert.ok(Math.abs(a - b) < 1e-9, `${a} != ${b}`);

test("unverified native slab load overrides fail before modifying output", () => {
  const source = new Uint8Array(128);
  const before = digest(source);
  const options = { slabLoadOverrides: new Map([[6129657, { dead: 1.5, live: 1 }]]) };
  for (const transcode of [transcodeIde11TrialToIde10, transcodeIde11TrialToIde11]) {
    assert.throws(() => transcode(source, options), /Döşeme yükü değişikliklerinin native IDE dosyasına yazılması henüz doğrulanmadı/);
    assert.equal(digest(source), before);
  }
});

// Not: F3'te (T-F3.3) gerçek v11→v10 gövde dönüşümü gelince bu test, dönüşümün
// döşeme yüklerini koruduğunu doğrulamak üzere T-F3.3 sahibince yeniden yazılacaktır.
test("IDE11 trial to IDE10 is rejected as unsupported until F3 body conversion lands", { skip: !existsSync(file), timeout: 30_000 }, () => {
  const source = readFileSync(file);
  const before = digest(source);
  const siblingIde10 = file.replace(/\.ide11trial$/, ".ide10");
  const siblingExisted = existsSync(siblingIde10);
  assert.throws(
    () => transcodeIde11TrialToIde10(source),
    /v11→v10 gövde dönüşümü F3'te tamamlanana kadar desteklenmiyor[\s\S]*\.ide10 üretimi reddedilir[\s\S]*--to ide11 kullanın/,
  );
  assert.equal(existsSync(siblingIde10), siblingExisted, "Reddedilen üretim hiçbir .ide10 çıktısı yazmamalı.");
  assert.equal(digest(source), before);
  assert.equal(digest(readFileSync(file)), before);
});

test("native transcoders reject a damaged trial checksum", { skip: !existsSync(file), timeout: 30_000 }, () => {
  const source = readFileSync(file);
  source[source.length - 1] ^= 1;
  for (const transcode of [transcodeIde11TrialToIde10, transcodeIde11TrialToIde11]) {
    assert.throws(() => transcode(source), /CRC32/);
  }
});

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
  assert.ok(renamed.warnings.some(warning => warning.includes("Dosya uzantısı .ide10, başlıktan okunan biçim .ide11trial")));
});

const currentTrial = process.env.HSYNCAD_IDE211280_FIXTURE;
test("ideCAD 11.28 trial save retains the observed model and stair mesh", { skip: !currentTrial || !existsSync(original), timeout: 30_000 }, () => {
  const source = readFileSync(currentTrial!);
  const before = digest(source);
  assert.equal(source.readUInt32LE(74), 211280);
  const native = parseIde10(buffer(source), "sample.ide11trial");
  const previous = parseIde10(buffer(readFileSync(original)), "original.ide10");
  assert.deepEqual(native.floors.map(({name, elevation, height}) => [name, elevation, height]), previous.floors.map(({name, elevation, height}) => [name, elevation, height]));
  assert.equal(native.elements.length, 1273);
  assert.equal(native.elements.filter(e => e.mesh?.quads?.length).length, 7);
  assert.equal(native.elements.filter(e => e.planAnnotation?.loads).length, 159);
  const byId = new Map(previous.elements.map(e => [e.id, e]));
  for (const element of native.elements) {
    const baseline = byId.get(element.id);
    assert.ok(baseline);
    assert.equal(element.type, baseline.type);
    assert.equal(element.points.length, baseline.points.length);
    element.points.forEach((point, i) => { close(point.x, baseline.points[i].x); close(point.y, baseline.points[i].y); });
    if (baseline.mesh) {
      assert.equal(element.mesh?.positions.length, baseline.mesh.positions.length);
      assert.deepEqual(element.mesh?.quads, baseline.mesh.quads);
      element.mesh?.positions.forEach((n, i) => assert.ok(Math.abs(n - baseline.mesh!.positions[i]) < 0.00001));
    }
    if (baseline.planAnnotation?.loads) {
      close(element.planAnnotation!.loads!.dead, baseline.planAnnotation.loads.dead);
      close(element.planAnnotation!.loads!.live, baseline.planAnnotation.loads.live);
    }
  }
  const saved = saveNativeIdeSource(source, native, "ide11trial");
  assert.equal(digest(saved.bytes), before);
  assert.equal(digest(source), before);
});

/**
 * ideCAD 11.28'in açtığı taşıyıcı sürüm kabul ailesi: 201091 (yapı şablonu),
 * 201094 (native .ide10), 211220 (ideCAD 11.20 şeması) ve 211280 (ideCAD 11.28 şeması).
 */
const IDECAD_1128_ACCEPTANCE_FAMILY = new Set([211220, 211280, 201091, 201094]);
const conversionEvidence = (name: string) =>
  `C:/Users/hsyn/Desktop/hsyncad_idecad_uzanti_optimizasyon/evidence/hsyncad-conversions/${name}`;
const nativeIde11Carriers = ["HS_B0_orijinal.ide11", "HS_X11_downloads.ide11"].map(conversionEvidence);

test("native ide11 output keeps the source carrier version inside the ideCAD 11.28 acceptance family", { skip: !nativeIde11Carriers.every(existsSync), timeout: 120_000 }, () => {
  for (const carrierPath of nativeIde11Carriers) {
    const source = readFileSync(carrierPath);
    const before = digest(source);
    const sourceVersion = source.readUInt32LE(74);
    assert.ok(IDECAD_1128_ACCEPTANCE_FAMILY.has(sourceVersion), `${carrierPath}: kaynak taşıyıcı ${sourceVersion} kabul ailesi dışında.`);
    const converted = transcodeIde11TrialToIde11(source);
    const outView = new DataView(converted.buffer, converted.byteOffset, converted.byteLength);
    const outputVersion = outView.getUint32(74, true);
    // P0 regresyon koruması: gövde şeması değişmediği için çıktı taşıyıcısı kaynak
    // şema sürümünü taşımalıdır. 211280 gövdeyi sabit 211220 taşıyıcıyla mühürlemek
    // (eski davranış) ideCAD 11.28'in açışta kapattığı dosyalar üretiyordu.
    assert.equal(outputVersion, sourceVersion, `${carrierPath}: çıktı taşıyıcı ${outputVersion} kaynak sürüm ${sourceVersion} ile eşit olmalı.`);
    if (sourceVersion === 211280) {
      assert.notEqual(outputVersion, 211220, "211280 kaynağı için eski sabit-211220 mühürleme geri dönmemeli.");
    }
    assert.ok(IDECAD_1128_ACCEPTANCE_FAMILY.has(outputVersion), `${carrierPath}: çıktı taşıyıcı ${outputVersion} ideCAD 11.28 kabul ailesi dışında.`);
    assert.equal(converted[78], source[78], `${carrierPath}: encodedFlag dönüşümde korunmalı.`);
    assert.equal(outView.getUint32(79, true), converted.length, `${carrierPath}: mühürlü boyut çıktı ile eşit olmalı.`);
    const sealed = validateIdeCarrier(converted);
    assert.equal(sealed.formatVersion, sourceVersion);
    assert.equal(digest(source), before);
  }
});
