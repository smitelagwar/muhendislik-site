import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { decodeCp1254, encodeCp1254 } from "./cp1254";
import { extractIdeSeismicAndSoil } from "./ide-r1-r5";
import { parseIde10 } from "./index";
import {
  buildIde10R3SeismicPatches,
  type Ide10R3SeismicInput,
  type Ide10R3SeismicPatch,
} from "./ide10-r3-seismic";

/**
 * T-F3.2b — v10 R3 deprem/zemin kayit uretici sinamasi.
 *
 * KANIT zinciri:
 * - Okuyucu deseni: `ide-r1-r5.ts` `extractIdeSeismicAndSoil` (ayar alani ko yuvasi bazli; tayf
 *   `spectrumEnd` bazli; exposure capasi = ko yuvasi + 564).
 * - A0 oracle: `evidence/orkestrasyon/2026-11-18-F2-T2.4/rea/bytemap-A0.md` §5 (10/10 alan).
 * - Gramer: `ide10-grammar.json` `akisDisiTasiyicilar` R3-DEPREM-ZEMIN (KANIT).
 *
 * Kapsam notu: R3 bolgesinde 10 alan yuvasi arasinda bu gorevin kanit kapsami DISINDA baska
 * alanlar vardir (A0'da 0.4 / 0.3 / 1.0 / 0.6657 f64 ve u32 sayaclar gozlendi). Builder bu
 * yuzden tum bolgeyi degil, yalnizca 2 capa + 10 KANIT alan yamasi uretir; bilinmeyen
 * araliklar uydurulmaz.
 */

const A0_PATH = "C:\\Users\\hsyn\\Desktop\\hsyncad\\incelemeler\\donusum-esdegerlik-2026-11-15\\00-kaynak\\A0_orijinal.ide10";

const A0_INPUT: Ide10R3SeismicInput = {
  exposureClass: "XC2",
  rEntered: 6,
  rSelectedRatio: 0.7794746499380645,
  liveLoadFactorN: 0.3,
  subgradeKoTfM3: 3080,
  bearingCapacityQtTfM2: 55,
  importanceI: 1,
  spectrumId: "DSF1",
  ss: 0.429,
  s1: 0.143,
  sds: 0.3861,
  sd1: 0.1144,
};

function loadArrayBuffer(path: string): ArrayBuffer {
  const buf = readFileSync(path);
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
}

function f64Bytes(value: number): Uint8Array {
  const out = new Uint8Array(8);
  new DataView(out.buffer).setFloat64(0, value, true);
  return out;
}

function assertBytesEqual(actual: Uint8Array, expected: Uint8Array, label: string): void {
  assert.equal(actual.length, expected.length, `${label}: length`);
  for (let i = 0; i < actual.length; i++) {
    assert.equal(actual[i], expected[i], `${label}: byte ${i}: ${actual[i]} != ${expected[i]}`);
  }
}

function patchByName(patches: Ide10R3SeismicPatch[], name: string): Ide10R3SeismicPatch {
  const patch = patches.find(p => p.alan === name);
  assert.ok(patch, `patch not produced: ${name}`);
  return patch;
}

test("R3 builder emits 2 anchors + 10 KANIT field patches at reader-contract offsets with exact LE f64 encodings", () => {
  const patches = buildIde10R3SeismicPatches(A0_INPUT);
  assert.equal(patches.length, 12);

  // Ayar blogu — taban: ko yuvasi (f64 subgradeKoTfM3); exposure capasi = taban + 564
  // (okuyucu: koOff = exposureStringStart + 4 - 568)
  const exposure = patchByName(patches, "exposureClass");
  assert.equal(exposure.base, "koSlot");
  assert.equal(exposure.offset, 564);
  assertBytesEqual(exposure.bytes, new Uint8Array([4, 0, 0, 0, 0x58, 0x43, 0x32, 0]), "exposureClass");

  const settings: Array<[string, number, number]> = [
    ["rEntered", -49, A0_INPUT.rEntered],
    ["rSelectedRatio", -41, A0_INPUT.rSelectedRatio],
    ["liveLoadFactorN", -8, A0_INPUT.liveLoadFactorN],
    ["subgradeKoTfM3", 0, A0_INPUT.subgradeKoTfM3],
    ["bearingCapacityQtTfM2", 8, A0_INPUT.bearingCapacityQtTfM2],
    ["importanceI", 34, A0_INPUT.importanceI],
  ];
  for (const [name, offset, value] of settings) {
    const patch = patchByName(patches, name);
    assert.equal(patch.base, "koSlot", `${name}: base`);
    assert.equal(patch.offset, offset, `${name}: offset`);
    assertBytesEqual(patch.bytes, f64Bytes(value), `${name}: f64 LE`);
  }

  // Tayf blogu — taban: spectrumEnd ([u32 5][id\0] bitisi); capa yamasi taban - 9
  const spectrum = patchByName(patches, "spectrumId");
  assert.equal(spectrum.base, "spectrumEnd");
  assert.equal(spectrum.offset, -9);
  assertBytesEqual(spectrum.bytes, new Uint8Array([5, 0, 0, 0, 0x44, 0x53, 0x46, 0x31, 0]), "spectrumId");

  const spectrumFields: Array<[string, number, number]> = [
    ["ss", 44, A0_INPUT.ss],
    ["s1", 52, A0_INPUT.s1],
    ["sds", 68, A0_INPUT.sds],
    ["sd1", 76, A0_INPUT.sd1],
  ];
  for (const [name, offset, value] of spectrumFields) {
    const patch = patchByName(patches, name);
    assert.equal(patch.base, "spectrumEnd", `${name}: base`);
    assert.equal(patch.offset, offset, `${name}: offset`);
    assertBytesEqual(patch.bytes, f64Bytes(value), `${name}: f64 LE`);
  }
});

test("R3 builder rejects non-finite fields, out-of-window exposure classes and unsupported spectrum ids", () => {
  assert.throws(() => buildIde10R3SeismicPatches({ ...A0_INPUT, rEntered: Number.NaN }));
  assert.throws(() => buildIde10R3SeismicPatches({ ...A0_INPUT, rSelectedRatio: Number.POSITIVE_INFINITY }));
  assert.throws(() => buildIde10R3SeismicPatches({ ...A0_INPUT, liveLoadFactorN: Number.NaN }));
  assert.throws(() => buildIde10R3SeismicPatches({ ...A0_INPUT, subgradeKoTfM3: Number.NaN }));
  assert.throws(() => buildIde10R3SeismicPatches({ ...A0_INPUT, bearingCapacityQtTfM2: Number.NaN }));
  assert.throws(() => buildIde10R3SeismicPatches({ ...A0_INPUT, importanceI: Number.NaN }));
  assert.throws(() => buildIde10R3SeismicPatches({ ...A0_INPUT, ss: Number.NaN }));
  assert.throws(() => buildIde10R3SeismicPatches({ ...A0_INPUT, s1: Number.NaN }));
  assert.throws(() => buildIde10R3SeismicPatches({ ...A0_INPUT, sds: Number.NaN }));
  assert.throws(() => buildIde10R3SeismicPatches({ ...A0_INPUT, sd1: Number.NaN }));
  // Okuyucu tarama penceresi slen 3..4 => exposure sinifi 2..3 karakter
  assert.throws(() => buildIde10R3SeismicPatches({ ...A0_INPUT, exposureClass: "X" }));
  assert.throws(() => buildIde10R3SeismicPatches({ ...A0_INPUT, exposureClass: "XC21" }));
  // Yalniz KANIT tayf capalari DSF1/RSF1
  assert.throws(() => buildIde10R3SeismicPatches({ ...A0_INPUT, spectrumId: "DSF2" as Ide10R3SeismicInput["spectrumId"] }));
});

test("A0 R3 region: reader-parsed 10 fields rebuild byte-for-byte (12/12 patches, 80 field bytes)", { skip: !existsSync(A0_PATH) }, () => {
  const ab = loadArrayBuffer(A0_PATH);
  const bytes = new Uint8Array(ab);
  const view = new DataView(ab);

  const project = parseIde10(ab, "A0_orijinal.ide10");
  const floors = project.floors ?? [];
  assert.ok(floors.length >= 2, "A0 floor list");
  const firstFloorOffset = floors[0].sourceOffset;
  const lastFloorOffset = floors[floors.length - 1].sourceOffset;

  // 1) A0'nin R3 bolgesindeki 10 alani mevcut okuyucuyla coz
  const r3 = extractIdeSeismicAndSoil(bytes, view, firstFloorOffset, lastFloorOffset);
  assert.ok(r3, "extractIdeSeismicAndSoil on A0");
  assert.equal(r3.exposureClass, "XC2");
  assert.equal(r3.spectrumId, "DSF1");
  assert.equal(r3.rEntered, 6);
  assert.equal(r3.rSelectedRatio, 0.7794746499380645);
  assert.equal(r3.liveLoadFactorN, 0.3);
  assert.equal(r3.subgradeKoTfM3, 3080);
  assert.equal(r3.bearingCapacityQtTfM2, 55);
  assert.equal(r3.importanceI, 1);
  assert.equal(r3.ss, 0.429);
  assert.equal(r3.s1, 0.143);
  assert.equal(r3.sds, 0.3861);
  assert.equal(r3.sd1, 0.1144);

  // 2) Capalari okuyucu deseniyle konumla (ide-r1-r5.ts extractIdeSeismicAndSoil)
  const preLimit = Math.min(bytes.length - 8, firstFloorOffset);
  const slen = r3.exposureClass.length + 1;
  let at = -1;
  for (let i = 24; i + 8 < preLimit; i++) {
    if (view.getUint32(i, true) !== slen) continue;
    if (i + 4 + slen > preLimit || bytes[i + 3 + slen] !== 0) continue;
    if (decodeCp1254(bytes.subarray(i + 4, i + 3 + slen)) !== r3.exposureClass) continue;
    const koOff = i + 4 - 568;
    const ko = view.getFloat64(koOff, true);
    const nVal = view.getFloat64(koOff - 8, true);
    if (ko >= 1 && ko <= 1_000_000 && nVal >= 0 && nVal <= 2) {
      at = i;
      break;
    }
  }
  assert.ok(at >= 0, "exposure anchor not found in A0 pre-floor region");
  const koOff = at + 4 - 568;

  const tag = encodeCp1254(`${r3.spectrumId}\0`);
  let tagOff = -1;
  outer: for (let i = Math.max(0, lastFloorOffset); i <= bytes.length - tag.length; i++) {
    for (let j = 0; j < tag.length; j++) {
      if (bytes[i + j] !== tag[j]) continue outer;
    }
    if (view.getUint32(i - 4, true) === 5) {
      tagOff = i;
      break;
    }
  }
  assert.ok(tagOff >= 0, "DSF1 tag not found in A0 tail region");
  const spectrumEnd = tagOff + 5;

  // 3) Cozulen degerlerle uret → uretilen baytlar A0 bolgesiyle BIREBIR
  const patches = buildIde10R3SeismicPatches({
    exposureClass: r3.exposureClass,
    rEntered: r3.rEntered!,
    rSelectedRatio: r3.rSelectedRatio!,
    liveLoadFactorN: r3.liveLoadFactorN!,
    subgradeKoTfM3: r3.subgradeKoTfM3!,
    bearingCapacityQtTfM2: r3.bearingCapacityQtTfM2!,
    importanceI: r3.importanceI!,
    spectrumId: r3.spectrumId as Ide10R3SeismicInput["spectrumId"],
    ss: r3.ss!,
    s1: r3.s1!,
    sds: r3.sds!,
    sd1: r3.sd1!,
  });
  assert.equal(patches.length, 12);

  let fieldByteCount = 0;
  for (const patch of patches) {
    const abs = (patch.base === "koSlot" ? koOff : spectrumEnd) + patch.offset;
    assert.ok(abs >= 0 && abs + patch.bytes.length <= bytes.length, `patch ${patch.alan}: out of range`);
    const a0Slice = bytes.subarray(abs, abs + patch.bytes.length);
    assertBytesEqual(patch.bytes, a0Slice, `patch ${patch.alan} @ ${patch.base}${patch.offset >= 0 ? "+" : ""}${patch.offset}`);
    if (patch.alan !== "exposureClass" && patch.alan !== "spectrumId") {
      fieldByteCount += patch.bytes.length;
    }
  }
  assert.equal(fieldByteCount, 80, "10 alan x 8B A0 ile birebir");
});
