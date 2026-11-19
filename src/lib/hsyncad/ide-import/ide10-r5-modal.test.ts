import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import {
  buildIde10R5ModalPeriodPairs,
  buildIde10R5ModalRegion,
  decodeIde10R5ModalRegion,
  findIde10R5ModalPeriodPairs,
  ide10ModalPeriodSeconds,
  type Ide10R5ModalRegion,
  type Ide10R5ModalTable,
} from "./ide10-r5-modal";

/**
 * T-F3.2d — v10 R5 F9/modal producer (10 modal tables + modal period region).
 *
 * Oracle (SADECE OKU):
 * - A0_orijinal.ide10 (v10 201094 referans govde; SHA-256 00957781…):
 *   kuyruk bolgesi 10 modal tablo (bytemap-A0.md §4/§5; t24 oracle 10 tablo)
 *   + ARA-BOLGE modal periyot ciftleri (T-F3.2d bit-exact olcumu: T = 1/f).
 * - M0-work.ide11trial (M-base; gramer MODAL-PERIYOT-KAYDI):
 *   akis-DISI duz f64 cifti @248907 (Mode 3 T) / @248915 (Mode 1 T).
 */
const A0_PATH =
  "C:\\Users\\hsyn\\Desktop\\hsyncad\\incelemeler\\donusum-esdegerlik-2026-11-15\\00-kaynak\\A0_orijinal.ide10";
const M0_WORK_PATH =
  "C:\\Users\\hsyn\\Desktop\\hsyncad_idecad_uzanti_optimizasyon\\evidence\\orkestrasyon\\2026-11-18-F2-T2.2\\rea\\M0-work.ide11trial";

// A0 kuyruk bolgesi (bolgeHaritasi KUYUK: 145.103.614..145.671.130; tarama carpasmadan baslar)
const A0_TAIL_SCAN_FROM = 145_100_000;
// A0 ARA-BOLGE (bolgeHaritasi: 35.473.174..36.402.671) — modal periyot ciftleri burada, akis DISI
const A0_ARA_BOLGE_FROM = 35_473_174;
const A0_ARA_BOLGE_TO = 36_402_671;

// T-F3.2d olcumu (A0): 10 tablonun bolge konumlari ve ilk 3 frekans degeri
const EXPECTED_NAMES = [
  "Modal'", "Modal E1", "Modal E2", "Modal E3", "Modal E4",
  "Modal BE1", "Modal BE2", "Modal BE3", "Modal BE4", "Modal-B'",
] as const;
const EXPECTED_MODE_COUNTS = [15, 6, 6, 6, 6, 15, 15, 15, 15, 24];
const EXPECTED_FREQS_012 = [
  [1.19437111745, 1.37053691567, 1.48932916829],
  [1.31065031422, 1.44109608325, 1.58449278028],
  [1.25333649859, 1.490706946, 1.60083589048],
  [1.29437091123, 1.47748376518, 1.56573843466],
  [1.28317481671, 1.38077450396, 1.68550888511],
  [0.00016656332878, 16.4083589873, 29.5482601576],
  [0.00016656332878, 16.4058300672, 29.5090380761],
  [0.00016656332878, 15.8999673644, 29.6133962085],
  [0.00016656332878, 16.9143936431, 29.6130054583],
  [0.00016656332878, 13.7793719447, 17.3567818366],
];
// A0 ARA-BOLGE modal periyot blogu (T-F3.2d olcumu; ciftler bit-exact 1/f)
const EXPECTED_PAIR_TABLES = [1, 5, 2, 6, 3, 7, 4, 8]; // E1, BE1, E2, BE2, E3, BE3, E4, BE4
const EXPECTED_PAIR_BLOCK_START = 35_625_941;
const EXPECTED_PAIR_BLOCK_END = 35_626_069;
// M-base gramer MODAL-PERIYOT-KAYDI (KANIT): @248907 Mode 3 T, @248915 Mode 1 T
const M0_MODE3_T = 0.03801594350107567;
const M0_MODE1_T = 0.16059170853931365;

function loadArrayBuffer(path: string): ArrayBuffer {
  const buf = readFileSync(path);
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
}

function diffIndices(a: Uint8Array, b: Uint8Array, limit = 64): number[] {
  assert.equal(a.length, b.length, `length ${a.length} != ${b.length}`);
  const out: number[] = [];
  for (let i = 0; i < a.length && out.length <= limit; i++) {
    if (a[i] !== b[i]) {
      if (out.length === limit) { out.push(-1); break; }
      out.push(i);
    }
  }
  return out;
}

function makeHeader(id: number): Uint8Array {
  const header = new Uint8Array(104);
  const hv = new DataView(header.buffer, header.byteOffset, header.byteLength);
  hv.setUint32(0, id, true);
  header.set([0xc0, 0x66, 0x20, 0x00], 4);
  header.set([0xc0, 0x66, 0x20, 0x00], 8);
  header.fill(0xff, 12, 20);
  return header;
}

test("synthetic modal region: build → decode round trip keeps semantic fields", () => {
  const row0 = Array.from({ length: 18 }, (_, k) => (k === 1 ? 0.5 : k === 2 ? 250 : k === 15 ? 0.125 : 0));
  const row1 = Array.from({ length: 18 }, (_, k) => (k === 1 ? -0.25 : k === 2 ? 80.5 : 0));
  const tables: Ide10R5ModalTable[] = [
    { name: "Modal E1", header: makeHeader(67), modeCount: 2, frequenciesHz: [1.5, 2.5], modeRows: [row0, row1] },
    { name: "Modal-B'", header: makeHeader(499), modeCount: 1, frequenciesHz: [3.25], modeRows: [row0] },
  ];
  const inter = new Uint8Array([0xde, 0xad, 0xbe, 0xef, 0, 0, 0, 0]);
  const region: Ide10R5ModalRegion = { regionStart: 0, regionEnd: 0, tables, interSegments: [inter] };

  const built = buildIde10R5ModalRegion(region);
  const view = new DataView(built.buffer, built.byteOffset, built.byteLength);
  const decoded = decodeIde10R5ModalRegion(built, view, 0, built.length);
  assert.ok(decoded, "decode of built region must succeed");
  assert.equal(decoded.regionStart, 0);
  assert.equal(decoded.regionEnd, built.length);
  assert.deepEqual(decoded.tables.map(t => t.name), ["Modal E1", "Modal-B'"]);
  assert.equal(decoded.tables[0].modeCount, 2);
  assert.deepEqual(decoded.tables[0].frequenciesHz, [1.5, 2.5]);
  assert.deepEqual(decoded.tables[0].modeRows, [row0, row1]);
  assert.deepEqual(Array.from(decoded.interSegments[0]), Array.from(inter));
  assert.equal(ide10ModalPeriodSeconds(2), 0.5);
});

test("decode returns undefined on buffers without modal tables (no fabricated defaults)", () => {
  const empty = new Uint8Array(256);
  const view = new DataView(empty.buffer);
  assert.equal(decodeIde10R5ModalRegion(empty, view, 0, empty.length), undefined);
  const periodBlock = findIde10R5ModalPeriodPairs(empty, view, 0, empty.length, []);
  assert.equal(periodBlock, undefined);
});

test("A0: 10 modal tables decode → build is byte-identical to the A0 region (freq deviation 0)", { skip: !existsSync(A0_PATH) }, () => {
  const buf = loadArrayBuffer(A0_PATH);
  const bytes = new Uint8Array(buf);
  const view = new DataView(buf);

  const region = decodeIde10R5ModalRegion(bytes, view, A0_TAIL_SCAN_FROM, bytes.length);
  assert.ok(region, "A0 kuyruk modal bolgesi cozulmeli");
  assert.equal(region.tables.length, 10);
  assert.equal(region.regionStart, 145_266_156);
  assert.equal(region.regionEnd, 145_305_420);
  assert.equal(region.interSegments.length, 9);
  assert.deepEqual(region.tables.map(t => t.name), [...EXPECTED_NAMES]);
  assert.deepEqual(region.tables.map(t => t.modeCount), EXPECTED_MODE_COUNTS);

  for (let t = 0; t < 10; t++) {
    for (let m = 0; m < 3; m++) {
      const f = region.tables[t].frequenciesHz[m];
      const expected = EXPECTED_FREQS_012[t][m];
      assert.ok(
        Math.abs(f - expected) <= 1e-9,
        `table ${t} mode ${m} freq ${f} != ${expected} (±1e-9)`,
      );
    }
    console.log(
      `A0 modal tablo ${t}: ${region.tables[t].name} m=${region.tables[t].modeCount} f=[${region.tables[t].frequenciesHz.slice(0, 3).map(f => f.toPrecision(12)).join(", ")}]`,
    );
  }

  const built = buildIde10R5ModalRegion(region);
  assert.equal(built.length, region.regionEnd - region.regionStart);
  const expected = bytes.subarray(region.regionStart, region.regionEnd);
  const diffs = diffIndices(built, expected);
  assert.deepEqual(diffs, [], `bayt-ozdeslik bozuldu; ilk fark rel+${diffs[0]}`);
  console.log(`A0 modal bolge: ${region.regionStart}..${region.regionEnd} (${built.length} B) birebir=BIREBIR`);
});

test("A0: builder writes frequencies semantically (mutated freq changes exactly its 8 bytes)", { skip: !existsSync(A0_PATH) }, () => {
  const buf = loadArrayBuffer(A0_PATH);
  const bytes = new Uint8Array(buf);
  const view = new DataView(buf);

  const region = decodeIde10R5ModalRegion(bytes, view, A0_TAIL_SCAN_FROM, bytes.length);
  assert.ok(region);
  // "Modal E1" (tablo 1) mode 0 frekansi: nameEnd+108 = 145.270.784
  const mutated = {
    ...region,
    tables: region.tables.map((t, ti) =>
      ti === 1
        ? { ...t, frequenciesHz: t.frequenciesHz.map((f, fi) => (fi === 0 ? f + 1 : f)) }
        : t,
    ),
  };
  const built = buildIde10R5ModalRegion(mutated);
  const expected = bytes.subarray(region.regionStart, region.regionEnd);
  const diffs = diffIndices(built, expected);
  const freqOff = 145_270_784 - region.regionStart;
  assert.deepEqual(diffs, Array.from({ length: 8 }, (_, k) => freqOff + k));
  const written = new DataView(built.buffer, built.byteOffset, built.byteLength).getFloat64(freqOff, true);
  assert.ok(Math.abs(written - (region.tables[1].frequenciesHz[0] + 1)) <= 1e-12);
});

test("A0: ARA-BOLGE modal period pairs are bit-exact 1/f reciprocals and rebuild byte-identical", { skip: !existsSync(A0_PATH) }, () => {
  const buf = loadArrayBuffer(A0_PATH);
  const bytes = new Uint8Array(buf);
  const view = new DataView(buf);

  const region = decodeIde10R5ModalRegion(bytes, view, A0_TAIL_SCAN_FROM, bytes.length);
  assert.ok(region);
  const block = findIde10R5ModalPeriodPairs(bytes, view, A0_ARA_BOLGE_FROM, A0_ARA_BOLGE_TO, region.tables);
  assert.ok(block, "A0 ARA-BOLGE periyot ciftleri bulunmali");
  assert.equal(block.pairs.length, 8);
  assert.equal(block.blockStart, EXPECTED_PAIR_BLOCK_START);
  assert.equal(block.blockEnd, EXPECTED_PAIR_BLOCK_END);
  assert.deepEqual(block.pairs.map(p => p.tableIndex), EXPECTED_PAIR_TABLES);

  for (const p of block.pairs) {
    const fA = region.tables[p.tableIndex].frequenciesHz[p.modeIndexA];
    const fB = region.tables[p.tableIndex].frequenciesHz[p.modeIndexB];
    assert.ok(
      Object.is(p.periodASeconds, ide10ModalPeriodSeconds(fA)),
      `cift A periyodu 1/f bit-exact degil (tablo ${p.tableIndex} mod ${p.modeIndexA})`,
    );
    assert.ok(
      Object.is(p.periodBSeconds, ide10ModalPeriodSeconds(fB)),
      `cift B periyodu 1/f bit-exact degil (tablo ${p.tableIndex} mod ${p.modeIndexB})`,
    );
    console.log(
      `A0 periyot cifti @${p.offset}: tablo=${region.tables[p.tableIndex].name} T=[${p.periodASeconds.toPrecision(12)}, ${p.periodBSeconds.toPrecision(12)}]`,
    );
  }

  const built = buildIde10R5ModalPeriodPairs(block.pairs);
  assert.equal(built.length, block.blockEnd - block.blockStart);
  assert.deepEqual(diffIndices(built, bytes.subarray(block.blockStart, block.blockEnd)), []);
  console.log(`A0 modal periyot blogu: ${block.blockStart}..${block.blockEnd} (${built.length} B) birebir=BIREBIR`);
});

test("M-base: grammar MODAL-PERIYOT-KAYDI record is byte-identical to M0-work @248907", { skip: !existsSync(M0_WORK_PATH) }, () => {
  const m0 = new Uint8Array(loadArrayBuffer(M0_WORK_PATH));
  const built = buildIde10R5ModalPeriodPairs([
    { periodASeconds: M0_MODE3_T, periodBSeconds: M0_MODE1_T },
  ]);
  assert.equal(built.length, 16);
  assert.deepEqual(diffIndices(built, m0.subarray(248_907, 248_923)), []);
  const view = new DataView(built.buffer, built.byteOffset, built.byteLength);
  assert.ok(Object.is(view.getFloat64(0, true), M0_MODE3_T));
  assert.ok(Object.is(view.getFloat64(8, true), M0_MODE1_T));
  console.log("M0-work @248907..248923 modal periyot kaydi (T3,T1) bayt-ozdes uretildi");
});
