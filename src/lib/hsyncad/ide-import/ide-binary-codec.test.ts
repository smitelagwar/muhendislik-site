import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { deflateSync } from "node:zlib";
import {
  computeIdePayloadChecksum,
  getIde11CompressedBlock,
  getIdeCarrierFormat,
  IDE_HEADER_SIGNATURE,
  IdeCarrierValidationError,
  type IdeCarrierValidationCode,
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
