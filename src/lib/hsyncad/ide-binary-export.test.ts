import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { parseIde10, type IdeProject } from "./ide-import";
import { exportIde10Binary, exportIde11Binary, saveNativeIdeSource } from "./ide-export";
import { validateIdeCarrier } from "./ide-import/ide-binary-codec";

const trialPath = "C:/Users/hsyn/Desktop/MUSTAFA SELVİ 1.KISIM.ide11trial";
const nativePaths = [
  "D:/IDM_DOWNLOAD/SÜHEYLA KARA PROJELER/STATİK/218 ada 50 parsel STATİK.ide10",
  "D:/IDM_DOWNLOAD/MUSTAFA SELVİ TÜM PROJELER/STATİK/2.kısım/MUSTAFA SELVİ 2.KISIM.ide10",
  "D:/IDM_DOWNLOAD/MUSTAFA SELVİ TÜM PROJELER/STATİK/1.kısım/MUSTAFA SELVİ 1.KISIM.ide10",
];
const templatePath = "C:/Program Files/ideCAD/ideCAD Statik 11 Deneme/templates/structural/ide_default_white.ide10";
const digest = (bytes: Uint8Array) => createHash("sha256").update(bytes).digest("hex");
const arrayBuffer = (bytes: Uint8Array): ArrayBuffer => Uint8Array.from(bytes).buffer;

for (const filename of nativePaths) test(`native same-source save preserves every byte: ${filename}`, { skip: !existsSync(filename), timeout: 30_000 }, () => {
  const source = readFileSync(filename), before = digest(source);
  const project = parseIde10(arrayBuffer(source), filename);
  const saved = exportIde10Binary(source, project);
  assert.equal(saved.mode, "native-ide10-passthrough");
  assert.equal(saved.patchedElementCount, 0);
  assert.equal(saved.bytes.byteLength, source.byteLength);
  assert.equal(digest(saved.bytes), before, "unknown records must survive along with decoded geometry");
  assert.equal(digest(source), before, "save must never modify source bytes");
  assert.equal(validateIdeCarrier(saved.bytes).projectName, project.name);
  assert.notEqual(saved.bytes.buffer, source.buffer, "returned storage must not alias the source");
  assert.throws(() => exportIde11Binary(source, project), /dönüşümü henüz/);
});

test("unchanged trial save preserves numeric encoding, edition metadata, all records and the trial extension", { skip: !existsSync(trialPath), timeout: 30_000 }, () => {
  const source = readFileSync(trialPath), before = digest(source);
  const project = parseIde10(arrayBuffer(source), trialPath);
  const saved = saveNativeIdeSource(source, project, "ide11trial");
  assert.equal(saved.format, "ide11trial");
  assert.equal(digest(saved.bytes), before);
  assert.equal(digest(source), before);
  assert.equal(saved.metadata.formatVersion, 211220);
  assert.equal(saved.metadata.encodedFlag, 1);
  assert.throws(() => exportIde11Binary(source, project), /dönüşümü henüz/);
  assert.throws(() => exportIde10Binary(source, project), /dönüşümü henüz/);
});

test("installed 201091 template can be preserved without claiming its geometry is decoded", { skip: !existsSync(templatePath), timeout: 10_000 }, () => {
  const source = readFileSync(templatePath);
  const saved = saveNativeIdeSource(source, undefined, "ide10");
  assert.equal(saved.metadata.formatVersion, 201091);
  assert.equal(digest(saved.bytes), digest(source));
});

test("edited models and replacement donors cannot silently become an unchanged native download", { skip: !existsSync(nativePaths[1]), timeout: 30_000 }, () => {
  const source = readFileSync(nativePaths[1]), before = digest(source);
  const project = parseIde10(arrayBuffer(source), nativePaths[1]);
  const edits: [string, (copy: IdeProject) => void][] = [
    ["project title", copy => { copy.name += " changed"; }],
    ["floor height", copy => { copy.floors[0].height += 0.5; }],
    ["geometry with unchanged counts", copy => { copy.elements[0].points[0].x += 0.25; }],
    ["element deletion", copy => { copy.elements.pop(); }],
    ["element insertion", copy => { copy.elements.push(structuredClone(copy.elements[0])); }],
    ["nested load", copy => { copy.elements.find(e => e.planAnnotation?.loads)!.planAnnotation!.loads!.live += 0.125; }],
  ];
  for (const [label, edit] of edits) {
    const copy = structuredClone(project); edit(copy);
    assert.throws(() => saveNativeIdeSource(source, copy, "ide10"), /Modelde değişiklik var/, label);
  }
  assert.throws(() => exportIde10Binary(source, project, source), /Başka bir proje/);
  assert.throws(() => exportIde11Binary(source, project, source), /Başka bir proje/);
  assert.equal(digest(source), before);
});

test("bad checksum is rejected by save, with no automatic repair", { skip: !existsSync(templatePath), timeout: 10_000 }, () => {
  const bytes = readFileSync(templatePath);
  bytes[bytes.length - 1] ^= 1;
  const before = digest(bytes);
  assert.throws(() => saveNativeIdeSource(bytes), /CRC32/);
  assert.equal(digest(bytes), before);
});
