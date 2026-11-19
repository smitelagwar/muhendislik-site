import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { deflateSync } from "node:zlib";
import { decodeCp1254, encodeCp1254 } from "./cp1254";
import { inflateIde201094Stream, scanIde201094Streams } from "./ide-zlib";
import {
  computeIdeMaterialHash,
  decodeF9FrameForces,
  extractIdeMaterials,
  extractIdePrecomputedF9,
  extractIdeSeismicAndSoil,
  transformIdeF9Coord,
  type IdePrecomputedF9,
} from "./ide-r1-r5";
import { parseIde10 } from "./index";
import { importIdeWorkspace } from "../ide-workspace";

const MS1_PATH = "D:\\IDM_DOWNLOAD\\MUSTAFA SELVİ TÜM PROJELER\\STATİK\\1.kısım\\MUSTAFA SELVİ 1.KISIM.ide10";
const MS2_PATH = "D:\\IDM_DOWNLOAD\\MUSTAFA SELVİ TÜM PROJELER\\STATİK\\2.kısım\\MUSTAFA SELVİ 2.KISIM.ide10";
const SK_PATH = "D:\\IDM_DOWNLOAD\\SÜHEYLA KARA PROJELER\\STATİK\\218 ada 50 parsel STATİK.ide10";
// T-F5.1: encoded v11 (211220) reading oracle — same project as MS1/A0, values must match the A0 fingerprint.
const X11_PATH = "C:\\Users\\hsyn\\Desktop\\hsyncad\\incelemeler\\donusum-esdegerlik-2026-11-15\\00-kaynak\\X11_downloads.ide11";
const A0_FINGERPRINT_PATH = "C:\\Users\\hsyn\\Desktop\\hsyncad_idecad_uzanti_optimizasyon\\evidence\\fingerprints\\A0_orijinal__ide10.fingerprint.json";

const close = (actual: number | null | undefined, expected: number, tol = 1e-4) => {
  assert.equal(typeof actual, "number", `Expected number near ${expected}, got ${actual}`);
  assert.ok(Math.abs(actual! - expected) <= tol, `${actual} != ${expected} (±${tol})`);
};

function loadArrayBuffer(path: string): ArrayBuffer {
  const buf = readFileSync(path);
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
}

test("CP1254 pure-JS codec decodes and encodes all Turkish characters and punctuation", () => {
  const sample = "İSTANBUL ŞANTİYE ĞÜÖÇ ı ş ğ ü ö ç € – — ‘ ’ “ ”";
  const encoded = encodeCp1254(sample);
  assert.equal(decodeCp1254(encoded), sample);
  // Spot-check exact CP1254 codepoints for İ, Ş, Ğ, ı, ş, ğ
  assert.deepEqual(
    Array.from(encodeCp1254("İŞĞışğ")),
    [0xdd, 0xde, 0xd0, 0xfd, 0xfe, 0xf0],
  );
});

test("computeIdeMaterialHash matches Ghidra 0x1409486a0 verified values", () => {
  assert.equal(computeIdeMaterialHash("CONTINUOUS"), 0x941);
  assert.equal(computeIdeMaterialHash("C25 B420C"), 0x7f6);
  assert.equal(computeIdeMaterialHash("S235"), 0x473);
  assert.equal(computeIdeMaterialHash("C25"), 0x145);
  assert.equal(computeIdeMaterialHash("C30/37"), 0x43b);
});

test("synthetic minimal buffers keep R1/R3/R5 undefined without fabricating defaults", () => {
  const empty = new Uint8Array(256);
  const view = new DataView(empty.buffer);
  assert.equal(extractIdeMaterials(empty, view), undefined);
  assert.equal(extractIdeSeismicAndSoil(empty, view, 128, 200), undefined);
  assert.equal(extractIdePrecomputedF9(empty, view, 128), undefined);
  assert.deepEqual(transformIdeF9Coord(1, 2, 3), { x: 1, y: -3, z: 2 });
});

test("201094 zlib stream scanner and decoder inflate synthetic F9 frame force block", () => {
  // 1 case x 2 stations x 6 f32 = 12 floats = 52 bytes
  const raw = new Uint8Array(4 + 12 * 4);
  const rawView = new DataView(raw.buffer);
  rawView.setUint32(0, 12, true);
  const vals = [-5.5, 1.75, 0.25, 0.01, 0.375, 2.5, -4.0, 1.5, 0.2, 0.01, -0.5, 1.0];
  vals.forEach((v, i) => rawView.setFloat32(4 + i * 4, v, true));
  const compressed = deflateSync(raw);

  const frame = new Uint8Array(12 + compressed.length);
  const frameView = new DataView(frame.buffer);
  frameView.setUint32(0, 201094, true);
  frameView.setUint32(4, compressed.length, true);
  frameView.setUint32(8, raw.length, true);
  frame.set(compressed, 12);

  const streams = scanIde201094Streams(frame);
  assert.equal(streams.length, 1);
  assert.equal(streams[0].rawLength, raw.length);
  const inflated = inflateIde201094Stream(frame, streams[0]);
  const rows = decodeF9FrameForces(inflated, 2, "n_v2_v3_t_m2_m3");
  assert.equal(rows.length, 2);
  close(rows[0].n, -5.5, 1e-5);
  close(rows[0].m3, 2.5, 1e-5);
  close(rows[1].n, -4.0, 1e-5);
});

test("MS1 real .ide10 extracts R1-R5 and hydrates CadModel without ide-unassigned", { skip: !existsSync(MS1_PATH) }, () => {
  const buf = loadArrayBuffer(MS1_PATH);
  const project = parseIde10(buf, "MUSTAFA SELVİ 1.KISIM.ide10");

  // R1
  assert.ok(project.materials && project.materials.length >= 2);
  assert.equal(project.materials[0].name, "C25 B420C");
  assert.equal(project.materials[0].kind, "concrete");
  close(project.materials[0].fckMpa, 25.0, 0.05);
  close(project.materials[0].fykMpa, 420.0, 0.5);
  close(project.materials[0].elasticModulusMpa, 30250.0, 5.0);
  close(project.materials[0].unitWeightTfM3, 2.5, 1e-4);
  assert.equal(project.materials[1].name, "S235");
  assert.equal(project.materials[1].kind, "steel");
  assert.equal(project.materials[1].fckMpa, null);
  close(project.materials[1].elasticModulusMpa, 200000.0, 50.0);

  // R2 (Radye RD01)
  const rd01 = project.elements.find(e => e.name === "RD01" && e.foundation);
  assert.ok(rd01?.slabLoads);
  close(rd01.slabLoads.deadTfM2, 1.795, 1e-4);
  close(rd01.slabLoads.finishTfM2, 0.17, 1e-4);
  close(rd01.slabLoads.liveTfM2, 0.5, 1e-4);

  // R3
  assert.ok(project.seismicSoil);
  assert.equal(project.seismicSoil.exposureClass, "XC2");
  close(project.seismicSoil.subgradeKoTfM3, 3080, 1e-3);
  close(project.seismicSoil.bearingCapacityQtTfM2, 55, 1e-3);
  close(project.seismicSoil.rEntered, 6, 1e-3);
  close(project.seismicSoil.liveLoadFactorN, 0.3, 1e-4);
  assert.equal(project.seismicSoil.spectrumId, "DSF1");
  close(project.seismicSoil.latitude, 39.6584, 1e-3);
  close(project.seismicSoil.longitude, 35.8734, 1e-3);

  // R4
  assert.deepEqual(rd01.rebarLayout, { kind: "raft", topX: "Ø14/13", topY: "Ø14/13", bottomX: "Ø14/13", bottomY: "Ø14/13" });
  const wallsWithRebar = project.elements.filter(e => e.type === "wall" && e.rebarLayout?.kind === "wall");
  const beamsWithRebar = project.elements.filter(e => e.type === "beam" && e.rebarLayout?.kind === "beam");
  assert.ok(wallsWithRebar.length > 0, "Expected wall rebar extracted in MS1");
  assert.ok(beamsWithRebar.length > 0, "Expected beam rebar extracted in MS1");

  // R5
  assert.ok(project.f9Results);
  assert.equal(project.f9Results.barForceStreamsCount, 1057);
  assert.equal(project.f9Results.nodalDisplacementStreamsCount, 28001);
  assert.equal(project.f9Results.shellResultStreamsCount, 373);
  const modalMain = project.f9Results.modalTables.find(t => t.name === "Modal'");
  assert.ok(modalMain && modalMain.frequenciesHz.length > 0);
  close(1 / modalMain.frequenciesHz[0], 0.83726, 1e-4);

  // Model hydration
  const model = importIdeWorkspace(project);
  assert.equal(model.materials[0].name, "C25 B420C");
  assert.ok(!model.materials.some(m => m.id === "ide-unassigned"));
  const hydratedSlab = model.elements.find(e => e.type === "slab" && e.name === "RD01");
  if (hydratedSlab?.type === "slab") {
    close(hydratedSlab.finishLoad, 0.17 * 9.80665, 1e-3);
    close(hydratedSlab.liveLoad, 0.5 * 9.80665, 1e-3);
  }
});

test("X11 encoded v11 .ide11 reads R1-R5 with the exact A0 oracle values (T-F5.1)", { skip: !existsSync(X11_PATH), timeout: 300_000 }, () => {
  const project = parseIde10(loadArrayBuffer(X11_PATH), "X11_downloads.ide11");
  assert.equal(project.format, "ide11");

  // R1: 2 materials, semantics equal to the A0 (v10 .ide10) oracle.
  assert.ok(project.materials && project.materials.length === 2, `Expected 2 materials, got ${project.materials?.length}`);
  const [c25, s235] = project.materials!;
  assert.equal(c25.name, "C25 B420C");
  assert.equal(c25.kind, "concrete");
  close(c25.fckMpa, 25.0, 0.05);
  close(c25.fykMpa, 420.0, 0.5);
  close(c25.fctkMpa, 1.75, 0.05);
  close(c25.gammaS, 1.15, 1e-6);
  close(c25.gammaC, 1.5, 1e-6);
  close(c25.elasticModulusMpa, 30250.0, 5.0);
  close(c25.poisson, 0.2, 1e-9);
  close(c25.unitWeightTfM3, 2.5, 1e-9);
  assert.equal(s235.name, "S235");
  assert.equal(s235.kind, "steel");
  assert.equal(s235.fckMpa, null);
  assert.equal(s235.fykMpa, null);
  close(s235.elasticModulusMpa, 200000.0, 50.0);
  close(s235.poisson, 0.3, 1e-9);
  close(s235.unitWeightTfM3, 7.849, 1e-9);

  // R3: seismic/soil — every field equal to the A0 oracle (fingerprint values).
  assert.ok(project.seismicSoil, "Expected seismicSoil on the encoded v11 carrier");
  assert.equal(project.seismicSoil.exposureClass, "XC2");
  close(project.seismicSoil.rEntered, 6, 1e-3);
  close(project.seismicSoil.rSelectedRatio, 0.7794746499380645, 1e-9);
  close(project.seismicSoil.liveLoadFactorN, 0.3, 1e-4);
  close(project.seismicSoil.subgradeKoTfM3, 3080, 1e-3);
  close(project.seismicSoil.bearingCapacityQtTfM2, 55, 1e-3);
  close(project.seismicSoil.importanceI, 1, 1e-6);
  assert.equal(project.seismicSoil.spectrumId, "DSF1");
  close(project.seismicSoil.ss, 0.429, 1e-6);
  close(project.seismicSoil.s1, 0.143, 1e-6);
  close(project.seismicSoil.sds, 0.3861, 1e-6);
  close(project.seismicSoil.sd1, 0.1144, 1e-6);
  close(project.seismicSoil.latitude, 39.6584, 1e-3);
  close(project.seismicSoil.longitude, 35.8734, 1e-3);

  // R4: 468 rebar layouts = 178 walls + 289 beams + 1 raft, spot values equal to A0.
  const walls = project.elements.filter(e => e.type === "wall" && e.rebarLayout?.kind === "wall");
  const beams = project.elements.filter(e => e.type === "beam" && e.rebarLayout?.kind === "beam");
  const rafts = project.elements.filter(e => e.type === "slab" && e.rebarLayout?.kind === "raft");
  assert.equal(walls.length, 178, `Expected 178 wall rebars, got ${walls.length}`);
  assert.equal(beams.length, 289, `Expected 289 beam rebars, got ${beams.length}`);
  assert.equal(rafts.length, 1, `Expected 1 raft rebar, got ${rafts.length}`);
  assert.equal(walls.length + beams.length + rafts.length, 468);

  const roofFloorId = project.floors.find(f => f.name === "ASANSÖR MAK.DAİRESİ")!.id;
  const thirdFloorId = project.floors.find(f => f.name === "3. KAT")!.id;
  const p43 = walls.find(w => w.name === "P43" && w.floorId === roofFloorId);
  assert.ok(p43?.rebarLayout && p43.rebarLayout.kind === "wall", "Expected P43 wall rebar on ASANSÖR MAK.DAİRESİ");
  assert.deepEqual(p43.rebarLayout, {
    kind: "wall", webDiaMm: 10, webSpacingCm: 25, headCount: 9, headDiaMm: 14,
    webStirrupDiaMm: 8, webStirrupSpacingCm: 20, headStirrupDiaMm: 8, headStirrupSpacingCm: 16,
  });
  const k34 = beams.find(b => b.name === "K34" && b.floorId === thirdFloorId);
  assert.ok(k34?.rebarLayout && k34.rebarLayout.kind === "beam", "Expected K34 beam rebar on 3. KAT");
  assert.deepEqual(k34.rebarLayout, {
    kind: "beam", topCount: 2, topDiaMm: 14, bottomCount: 2, bottomDiaMm: 14,
    stirrupDiaMm: 8, stirrupSpacingCm: [20, 10],
  });
  const k63 = beams.find(b => b.name === "K63" && b.floorId === thirdFloorId);
  assert.ok(k63?.rebarLayout && k63.rebarLayout.kind === "beam", "Expected K63 beam rebar on 3. KAT");
  assert.deepEqual(k63.rebarLayout, {
    kind: "beam", topCount: 3, topDiaMm: 14, bottomCount: 2, bottomDiaMm: 14,
    stirrupDiaMm: 8, stirrupSpacingCm: [20, 10],
  });
  assert.equal(rafts[0].name, "RD01");
  assert.deepEqual(rafts[0].rebarLayout, {
    kind: "raft", topX: "Ø14/13", topY: "Ø14/13", bottomX: "Ø14/13", bottomY: "Ø14/13",
  });

  // R5: 10 modal tables + 201094 stream census equal to A0.
  assert.ok(project.f9Results, "Expected f9Results on the encoded v11 carrier");
  assert.equal(project.f9Results.modalTables.length, 10);
  assert.equal(project.f9Results.barForceStreamsCount, 1057);
  assert.equal(project.f9Results.nodalDisplacementStreamsCount, 28001);
  assert.equal(project.f9Results.shellResultStreamsCount, 373);
  const modalMain = project.f9Results.modalTables.find(t => t.name === "Modal'")!;
  assert.equal(modalMain.modeCount, 15);
  close(modalMain.frequenciesHz[0], 1.1943711174476759, 1e-9);

  // Full modal comparison against the A0 fingerprint oracle (frequency deviation <= 1e-9).
  if (existsSync(A0_FINGERPRINT_PATH)) {
    const a0 = JSON.parse(readFileSync(A0_FINGERPRINT_PATH, "utf8")) as {
      f9Results: { modalTables: { name: string; modeCount: number; frequenciesHz: number[] }[] };
    };
    assert.equal(a0.f9Results.modalTables.length, project.f9Results!.modalTables.length);
    for (let i = 0; i < a0.f9Results.modalTables.length; i++) {
      const expected = a0.f9Results.modalTables[i];
      const actual: IdePrecomputedF9["modalTables"][number] = project.f9Results!.modalTables[i];
      assert.equal(actual.name, expected.name, `Modal table ${i} name`);
      assert.equal(actual.modeCount, expected.modeCount, `Modal table ${i} modeCount`);
      assert.equal(actual.frequenciesHz.length, expected.frequenciesHz.length, `Modal table ${i} frequency count`);
      for (let m = 0; m < expected.frequenciesHz.length; m++) {
        assert.ok(
          Math.abs(actual.frequenciesHz[m] - expected.frequenciesHz[m]) <= 1e-9,
          `Modal ${expected.name} mode ${m}: ${actual.frequenciesHz[m]} != ${expected.frequenciesHz[m]} (±1e-9)`,
        );
      }
    }
  }
});

test("MS2 real .ide10 extracts R1-R5 cleanly", { skip: !existsSync(MS2_PATH) }, () => {
  const project = parseIde10(loadArrayBuffer(MS2_PATH), "MUSTAFA SELVİ 2.KISIM.ide10");
  assert.equal(project.seismicSoil?.exposureClass, "XC2");
  close(project.seismicSoil?.subgradeKoTfM3, 3080, 1e-3);
  assert.equal(project.seismicSoil?.spectrumId, "DSF1");
  assert.equal(project.f9Results?.barForceStreamsCount, 497);
  assert.equal(project.f9Results?.nodalDisplacementStreamsCount, 234);
  const modalMain = project.f9Results?.modalTables.find(t => t.name === "Modal'");
  assert.ok(modalMain);
  close(1 / modalMain.frequenciesHz[0], 1.12218, 1e-4);
});

test("SK real .ide10 extracts R1-R5 including column rebar and 1852B F9 frames", { skip: !existsSync(SK_PATH) }, () => {
  const bytes = new Uint8Array(readFileSync(SK_PATH));
  const project = parseIde10(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), "218 ada 50 parsel STATİK.ide10");

  // R2 D50 (thick slab at 2.045 tf/m²)
  const d50 = project.elements.find(e => e.name === "D50" && e.slabLoads && Math.abs(e.slabLoads.deadTfM2 - 2.045) < 0.01);
  assert.ok(d50?.slabLoads);
  close(d50.slabLoads.deadTfM2, 2.045, 1e-4);
  close(d50.slabLoads.finishTfM2, 0.17, 1e-4);
  close(d50.slabLoads.liveTfM2, 0.5, 1e-4);

  // R3
  assert.equal(project.seismicSoil?.exposureClass, "XO");
  close(project.seismicSoil?.subgradeKoTfM3, 2016, 1e-3);
  close(project.seismicSoil?.bearingCapacityQtTfM2, 36, 1e-3);
  close(project.seismicSoil?.rEntered, 7, 1e-3);
  assert.equal(project.seismicSoil?.spectrumId, "RSF1");
  close(project.seismicSoil?.latitude, 39.9935, 1e-3);
  close(project.seismicSoil?.longitude, 35.7921, 1e-3);

  // R4 column S01 (SK S401 -> 6Ø14 + 4Ø14, Ø8/15/10/10)
  const s01 = project.elements.find(e => e.type === "column" && e.name === "S01" && e.rebarLayout?.kind === "column");
  assert.ok(s01?.rebarLayout && s01.rebarLayout.kind === "column");
  assert.equal(s01.rebarLayout.majorCount, 6);
  assert.equal(s01.rebarLayout.minorCount, 4);
  assert.equal(s01.rebarLayout.barDiaMm, 14);
  assert.equal(s01.rebarLayout.stirrupDiaMm, 8);
  assert.deepEqual(s01.rebarLayout.stirrupSpacingCm, [15, 10, 10]);

  // R5
  assert.equal(project.f9Results?.barForceStreamsCount, 2176);
  assert.equal(project.f9Results?.nodalDisplacementStreamsCount, 945);
  assert.ok(project.f9Results && project.f9Results.shellResultStreamsCount >= 47);
  const modalMain = project.f9Results?.modalTables.find(t => t.name === "Modal'");
  assert.ok(modalMain && modalMain.modeCount === 24 && modalMain.frequenciesHz.some(f => Math.abs(1 / f - 0.91569) < 0.001));

  // Decode real 1852B F9 stream inside S01 record
  const s01Streams = scanIde201094Streams(bytes, s01.sourceOffset, s01.sourceOffset + 4000, 4);
  const stream1852 = s01Streams.find(s => s.rawLength === 1852);
  assert.ok(stream1852, "Expected 1852B stream in S01");
  const raw1852 = inflateIde201094Stream(bytes, stream1852);
  const rows = decodeF9FrameForces(raw1852, 7, "n_v2_v3_t_m2_m3");
  assert.equal(rows.length, 11 * 7);
  close(rows[0].n, -5.5476, 1e-3);
  close(rows[0].m3, 2.5012, 1e-3);
});
