import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, statSync } from "node:fs";
import { createHash } from "node:crypto";
import { deflateSync } from "node:zlib";
import {
  computeIdePayloadChecksum,
  getIde11CompressedBlock,
  getIdeCarrierFormat,
  IDE_HEADER_SIGNATURE,
  IdeCarrierValidationError,
  type IdeCarrierValidationCode,
  type IdeCarrierMetadata,
  type NativeIdeFormat,
  validateIdeCarrier,
} from "./ide-binary-codec";
import { parseIde10 } from "./index";
import { inflateIdeZlib } from "./ide-zlib";
import { saveNativeIdeSource } from "../ide-native-save";

// Bit-at-a-time oracle, independent of the production table and sealer.
function rawCrc(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (const byte of bytes.subarray(88)) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++) crc = crc & 1 ? (crc >>> 1) ^ 0xedb88320 : crc >>> 1;
  }
  return crc >>> 0;
}

function carrier(version = 201094, encoded = 0): Uint8Array<ArrayBuffer> {
  const bytes = new Uint8Array(160);
  bytes.set(new TextEncoder().encode(IDE_HEADER_SIGNATURE));
  const view = new DataView(bytes.buffer);
  view.setUint32(74, version, true);
  bytes[78] = encoded;
  view.setUint32(79, bytes.length, true);
  // Native Windows-1254 name: "İş\0".
  view.setUint32(96, 3, true);
  bytes.set([0xdd, 0xfe, 0], 100);
  view.setUint32(83, rawCrc(bytes), true);
  return bytes;
}

const rejects = (bytes: Uint8Array, code: IdeCarrierValidationCode) => {
  assert.throws(() => validateIdeCarrier(bytes), error => error instanceof IdeCarrierValidationError && error.code === code);
};

test("carrier CRC uses the raw accumulator, checked against the standard 123456789 vector", () => {
  const bytes = new Uint8Array(97);
  bytes.set(new TextEncoder().encode("123456789"), 88);
  assert.equal(rawCrc(bytes), 0x340bc6d9);
  assert.equal(computeIdePayloadChecksum(bytes), 0x340bc6d9);
  assert.notEqual(computeIdePayloadChecksum(bytes), 0xcbf43926);
});

test("known raw v10/v11 and encoded v11 envelopes validate without changing their bytes", () => {
  for (const [version, encoded] of [[201091, 0], [201094, 0], [211220, 0], [211220, 1]]) {
    const bytes = carrier(version, encoded), before = bytes.slice();
    const result = validateIdeCarrier(bytes);
    assert.equal(result.formatVersion, version);
    assert.equal(result.encodedFlag, encoded);
    assert.equal(result.byteLength, bytes.length);
    assert.equal(result.projectName, "İş");
    assert.equal(result.projectNameByteLength, 3);
    assert.deepEqual(bytes, before);
    // Byte offsets in Buffer/Uint8Array views must be respected.
    const surrounded = new Uint8Array(bytes.length + 14);
    surrounded.fill(0xff); surrounded.set(bytes, 7);
    assert.deepEqual(validateIdeCarrier(surrounded.subarray(7, 7 + bytes.length)), result);
  }
});

test("rejects damaged signatures, unknown versions, illegal flags and both truncation and appended bytes", () => {
  rejects(new Uint8Array(99), "signature");
  const badSignature = carrier(); badSignature[73] = 1;
  rejects(badSignature, "signature");
  rejects(carrier(211221, 0), "version");
  rejects(carrier(211221, 1), "version");
  rejects(carrier(201094, 1), "encoding");
  rejects(carrier(211220, 2), "encoding");
  rejects(carrier().subarray(0, 159), "length");
  const extended = new Uint8Array(161); extended.set(carrier());
  rejects(extended, "length");
});

test("rejects out-of-bounds and unterminated project names, including an embedded premature NUL", () => {
  for (const length of [0, 61, 0xffffffff]) {
    const bytes = carrier(); new DataView(bytes.buffer).setUint32(96, length, true);
    rejects(bytes, "name");
  }
  const missingNul = carrier(); missingNul[102] = 65;
  rejects(missingNul, "name");
  const embeddedNul = carrier(); embeddedNul[101] = 0;
  rejects(embeddedNul, "name");
});

test("rejects corrupted payload and inverted CRC before the geometry scanner; never repairs input", () => {
  const corrupted = carrier(); corrupted[159] ^= 1;
  const before = corrupted.slice();
  rejects(corrupted, "checksum");
  assert.throws(() => parseIde10(corrupted.buffer, "valid-looking.ide10"), /CRC32/);
  assert.deepEqual(corrupted, before);
  const inverted = carrier(), view = new DataView(inverted.buffer);
  view.setUint32(83, (view.getUint32(83, true) ^ 0xffffffff) >>> 0, true);
  rejects(inverted, "checksum");
});

test("11.04 compressed archives require a bounded, complete body and valid Adler checksum", () => {
  const raw = new TextEncoder().encode("a verified project body");
  const compressed = deflateSync(raw);
  const bytes = new Uint8Array(179 + compressed.length);
  bytes.set(carrier(211040));
  bytes.set(compressed, 179);
  const view = new DataView(bytes.buffer);
  view.setUint32(79, bytes.length, true);
  // Empty preview and prefix tables, with zero timestamps before the flag.
  view.setUint32(149, 0x5ce, true);
  bytes[170] = 1;
  view.setUint32(171, raw.length, true);
  view.setUint32(175, compressed.length, true);
  view.setUint32(83, rawCrc(bytes), true);
  const metadata = validateIdeCarrier(bytes);
  assert.equal(getIdeCarrierFormat(bytes, metadata), "cde");
  assert.deepEqual(getIde11CompressedBlock(bytes, metadata), { offset: 179, rawLength: raw.length });
  assert.deepEqual(inflateIdeZlib(bytes.subarray(179), raw.length), raw);
  assert.throws(() => inflateIdeZlib(compressed, raw.length - 1), /boyut/);
  const corrupt = compressed.slice();
  corrupt[corrupt.length - 1] ^= 1;
  assert.throws(() => inflateIdeZlib(corrupt, raw.length), /Adler32/);
  view.setUint32(175, compressed.length - 1, true);
  assert.throws(() => getIde11CompressedBlock(bytes, metadata), /uzunluğu/);
});

function carrierWithMarker(version: number, encoded: 0 | 1, studentFlag = 0, demoFlag = 0): Uint8Array<ArrayBuffer> {
  const bytes = carrier(version, encoded);
  const view = new DataView(bytes.buffer);
  // projectNameByteLength = 3 -> previewLengthOffset = 115, previewLen = 0 -> previewEnd = 119
  bytes[119 + 28] = studentFlag;
  bytes[119 + 29] = demoFlag;
  view.setUint32(119 + 30, 0x5ce, true);
  view.setUint32(83, rawCrc(bytes), true);
  return bytes;
}

test("getIdeCarrierFormat distinguishes converted commercial ide11 from trial/student/211280 carriers", () => {
  const commercialEncoded = carrierWithMarker(211220, 1, 0, 0);
  assert.equal(getIdeCarrierFormat(commercialEncoded, validateIdeCarrier(commercialEncoded)), "ide11");

  const demoTrial = carrierWithMarker(211220, 1, 0, 1);
  assert.equal(getIdeCarrierFormat(demoTrial, validateIdeCarrier(demoTrial)), "ide11trial");

  const studentTrial = carrierWithMarker(211220, 1, 1, 0);
  assert.equal(getIdeCarrierFormat(studentTrial, validateIdeCarrier(studentTrial)), "ide11trial");

  const currentTrialNoMarker = carrier(211280, 1);
  assert.equal(getIdeCarrierFormat(currentTrialNoMarker, validateIdeCarrier(currentTrialNoMarker)), "ide11trial");

  // T-F1.3: a 211280 carrier with cleared lock bytes is a commercial .ide11 (real evidence:
  // HS_B0_orijinal.ide11, Hsyncad's commercial 211280 output). The version alone must not
  // force the trial label; only the lock bytes may.
  const currentCommercialClearedMarker = carrierWithMarker(211280, 1, 0, 0);
  assert.equal(getIdeCarrierFormat(currentCommercialClearedMarker, validateIdeCarrier(currentCommercialClearedMarker)), "ide11");

  const noMarkerEncoded = carrier(211220, 1);
  assert.equal(getIdeCarrierFormat(noMarkerEncoded, validateIdeCarrier(noMarkerEncoded)), "ide11trial");

  const noMarkerRaw = carrier(211220, 0);
  assert.equal(getIdeCarrierFormat(noMarkerRaw, validateIdeCarrier(noMarkerRaw)), "ide11");

  const v10 = carrier(201094, 0);
  assert.equal(getIdeCarrierFormat(v10, validateIdeCarrier(v10)), "ide10");
});

// Real-byte evidence, read on 2026-11-18 from the campaign corpus and conversion output (read-only).
// previewEnd = 116 + nameLen(u32@96) + previewLen(u32@112+nameLen); the lock bytes live at
// previewEnd+28 (student, [rdi+11h]) and previewEnd+29 (demo); the marker is u32@previewEnd+30 = 0x5ce.
// - X11_downloads.ide11 (ideCAD's own commercial .ide11 save, sha256 EB2AFEAB…): u32@74=211220,
//   byte@78=1, real bytes previewEnd+26..+33 = 68 00 00 00 ce 05 00 00 → student=0, demo=0
// - B0_orijinal.ide11trial (trial record, sha256 43B9C306…): u32@74=211280, byte@78=1,
//   previewEnd+26..+33 = 68 00 00 01 ce 05 00 00 → student=0, demo=1
// - HS_B0_orijinal.ide11 (Hsyncad commercial 211280 output, cleared locks): u32@74=211280,
//   byte@78=1, previewEnd+26..+33 = 68 00 00 00 ce 05 00 00
const REAL_PREVIEW_TAIL = {
  commercial: [0x68, 0x00, 0x00, 0x00, 0xce, 0x05, 0x00, 0x00],
  trialDemo: [0x68, 0x00, 0x00, 0x01, 0xce, 0x05, 0x00, 0x00],
} as const;

function carrierWithRealPreviewTail(version: number, realTail: readonly number[]): Uint8Array<ArrayBuffer> {
  const bytes = carrier(version, 1);
  // projectNameByteLength = 3 → previewEnd = 119; the real slice covers the student lock (+28),
  // the demo lock (+29) and the 0x5ce marker (+30..+33) exactly as observed in the corpus files.
  bytes.set(realTail, 119 + 26);
  new DataView(bytes.buffer).setUint32(83, rawCrc(bytes), true);
  return bytes;
}

test("getIdeCarrierFormat lets the lock bytes, not the 211280 version, decide trial vs commercial", () => {
  const formatOf = (bytes: Uint8Array) => getIdeCarrierFormat(bytes, validateIdeCarrier(bytes));
  // Commercial carriers keep encodedFlag=1 with zero lock bytes, including version 211280.
  assert.equal(formatOf(carrierWithRealPreviewTail(211220, REAL_PREVIEW_TAIL.commercial)), "ide11");
  assert.equal(formatOf(carrierWithRealPreviewTail(211280, REAL_PREVIEW_TAIL.commercial)), "ide11");
  // Trial records carry the demo lock byte (B0/C1 pattern) on both observed versions.
  assert.equal(formatOf(carrierWithRealPreviewTail(211280, REAL_PREVIEW_TAIL.trialDemo)), "ide11trial");
  assert.equal(formatOf(carrierWithRealPreviewTail(211220, REAL_PREVIEW_TAIL.trialDemo)), "ide11trial");
});

const realCarrierProbes: Array<[label: string, path: string, version: 211220 | 211280, expected: NativeIdeFormat]> = [
  ["X11_downloads.ide11 (ideCAD's own commercial save)", "C:/Users/hsyn/Desktop/hsyncad/incelemeler/donusum-esdegerlik-2026-11-15/00-kaynak/X11_downloads.ide11", 211220, "ide11"],
  ["HS_X11_downloads.ide11 (Hsyncad commercial output)", "C:/Users/hsyn/Desktop/hsyncad_idecad_uzanti_optimizasyon/evidence/hsyncad-conversions/HS_X11_downloads.ide11", 211220, "ide11"],
  ["HS_B0_orijinal.ide11 (Hsyncad commercial 211280 output)", "C:/Users/hsyn/Desktop/hsyncad_idecad_uzanti_optimizasyon/evidence/hsyncad-conversions/HS_B0_orijinal.ide11", 211280, "ide11"],
  ["B0_orijinal.ide11trial (trial record)", "C:/Users/hsyn/Desktop/hsyncad/incelemeler/donusum-esdegerlik-2026-11-15/00-kaynak/B0_orijinal.ide11trial", 211280, "ide11trial"],
  ["C1_canli_kiyas.ide11trial (trial record)", "C:/Users/hsyn/Desktop/hsyncad/incelemeler/donusum-esdegerlik-2026-11-15/00-kaynak/C1_canli_kiyas.ide11trial", 211280, "ide11trial"],
  ["D0_desktop.ide11trial (trial record)", "C:/Users/hsyn/Desktop/hsyncad/incelemeler/donusum-esdegerlik-2026-11-15/00-kaynak/D0_desktop.ide11trial", 211220, "ide11trial"],
];

for (const [label, path, version, expected] of realCarrierProbes) test(`real carrier bytes classify by lock/version: ${label}`, { skip: !existsSync(path), timeout: 15_000 }, () => {
  // Read only the bounded header+preview prefix (~28.4 KB), never the 140 MB body.
  const bytes = new Uint8Array(readFileSync(path).subarray(0, 30_000));
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const formatVersion = view.getUint32(74, true);
  assert.equal(formatVersion, version, "version bytes must match the manifest");
  assert.equal(bytes[78], 1);
  const metadata: IdeCarrierMetadata = {
    formatVersion: version,
    encodedFlag: 1,
    byteLength: statSync(path).size,
    projectName: "",
    projectNameByteLength: view.getUint32(96, true),
    storedChecksum: view.getUint32(83, true),
  };
  assert.equal(getIdeCarrierFormat(bytes, metadata), expected);
});

const officialCde = process.env.HSYNCAD_IDE211040_FIXTURE;
test("ideYAPI 11.04 sample reads the two native storeys and keeps its original compressed format", { skip: !officialCde, timeout: 30_000 }, () => {
  assert.ok(officialCde);
  const bytes = new Uint8Array(readFileSync(officialCde));
  const digest = "3495e99b68ba72fd74573a327243d38576f525f608cc562d65ade694b0cd27ac";
  assert.equal(createHash("sha256").update(bytes).digest("hex"), digest);
  const project = parseIde10(bytes.buffer, "Examine the Structural Model.cde");
  assert.equal(project.format, "cde");
  assert.equal(project.byteLength, bytes.length);
  assert.deepEqual(project.floors.map(({ name, elevation, height }) => [name, elevation, height]), [["STORY 1", 3, 3], ["BASE STORY", 0, 3]]);
  assert.deepEqual(project.coverage.byType, { column: 24, wall: 30, axis: 17, slab: 19, beam: 31, section: 2, slabEdge: 12 });
  assert.equal(new Set(project.elements.map(element => element.id)).size, project.elements.length);
  const column = project.elements.find(element => element.name === "S1240" && element.floorId === project.floors[0].id);
  assert.equal(column?.type, "column");
  assert.deepEqual(column.points[0], { x: 8.449999999999982, y: 13.799999999999988 });
  assert.ok(project.elements.filter(element => element.type === "beam").every(element => element.planOnly && element.height === undefined));
  const saved = saveNativeIdeSource(bytes);
  assert.equal(saved.format, "cde");
  assert.equal(createHash("sha256").update(saved.bytes).digest("hex"), digest);
  assert.throws(() => saveNativeIdeSource(bytes, undefined, "ide11"), /dönüşümü/);
});

const originalSamples = [
  "D:/IDM_DOWNLOAD/SÜHEYLA KARA PROJELER/STATİK/218 ada 50 parsel STATİK.ide10",
  "D:/IDM_DOWNLOAD/MUSTAFA SELVİ TÜM PROJELER/STATİK/2.kısım/MUSTAFA SELVİ 2.KISIM.ide10",
  "D:/IDM_DOWNLOAD/MUSTAFA SELVİ TÜM PROJELER/STATİK/1.kısım/MUSTAFA SELVİ 1.KISIM.ide10",
  "C:/Users/hsyn/Desktop/MUSTAFA SELVİ 1.KISIM.ide11trial",
  "C:/Program Files/ideCAD/ideCAD Statik 11 Deneme/templates/structural/ide_default_white.ide10",
];

for (const filename of originalSamples) test(`original carrier integrity: ${filename}`, { skip: !existsSync(filename), timeout: 15_000 }, () => {
  const bytes = readFileSync(filename);
  const before = createHash("sha256").update(bytes).digest("hex");
  const metadata = validateIdeCarrier(bytes);
  assert.equal(metadata.byteLength, bytes.length);
  assert.equal(metadata.storedChecksum, bytes.readUInt32LE(83));
  assert.ok(metadata.projectName.length > 0);
  assert.equal(createHash("sha256").update(bytes).digest("hex"), before);
  assert.equal(createHash("sha256").update(readFileSync(filename)).digest("hex"), before);
});
