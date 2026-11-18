import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { parseIde10 } from "./index";
import { scanIde201094Streams } from "./ide-zlib";
import {
  IDE10_RAFT_REBAR_ATTR_OFFSET,
  IDE10_WALL_REBAR_TAIL_OFFSET,
  buildIde10BeamRebarRecord,
  buildIde10RaftRebarRecord,
  buildIde10WallRebarRecord,
} from "./ide10-r4-rebar";

/** T-F3.2c — v10 (201094) R4 donatı kayıt üreticisinin A0 birebir sınaması.
 *
 * Kanıt çapası: A0_orijinal.ide10 (145.671.130 B, SHA-256 00957781…, gramer koordinat sistemi "A0").
 * R4 bölge tanımı: ide10-grammar.json `akisDisiTasiyiclar` "R4-DONATI" (KANIT — bytemap-A0.md §5,
 * oracle 468/468 = 178 perde + 289 kiriş + 1 radye; donatı tamsayıları eleman kaydında akış-sonrası kuyrukta).
 * Alan düzeni: `ide-r1-r5.ts` `extractIdeElementRebar` okuyucu deseni (t24 census aracıyla 468/468 doğrulanmış).
 */
const A0_PATH = "C:\\Users\\hsyn\\Desktop\\hsyncad\\incelemeler\\donusum-esdegerlik-2026-11-15\\00-kaynak\\A0_orijinal.ide10";

// Okuyucu desenindeki aday kümeleri (ide-r1-r5.ts) — konum doğrulaması için birebir tekrarlanır.
const REBAR_DIAS = new Set([8, 10, 12, 14, 16, 18, 20, 22, 25, 28, 32]);
const STIRRUP_DIAS = new Set([6, 8, 10, 12]);

const i32 = (view: DataView, offset: number) => view.getInt32(offset, true);

function assertBytesEqual(produced: Uint8Array, expected: Uint8Array, label: string): void {
  assert.equal(produced.length, expected.length, `${label}: üretilen uzunluk ${produced.length} != A0 ${expected.length}`);
  for (let i = 0; i < produced.length; i++) {
    if (produced[i] !== expected[i]) {
      assert.fail(`${label}: bayt +${i} farklı — üretilen 0x${produced[i].toString(16)} != A0 0x${expected[i].toString(16)}`);
    }
  }
}

/** R4 okuyucu desenini (ide-r1-r5.ts) bayt düzeyinde tekrarlar; donatı kuyruğunun kayıt-içi konumunu döndürür. */
function locateRebarPattern(view: DataView, afterStreams: number, kind: "wall" | "beam"): number {
  if (kind === "wall") {
    const scanEnd = Math.min(view.byteLength - 40, afterStreams + 220);
    for (let p = afterStreams + 32; p <= scanEnd; p++) {
      const webDia = i32(view, p), webSpacing = i32(view, p + 4);
      const headDiaL = i32(view, p + 8), headCountL = i32(view, p + 12);
      const headDiaR = i32(view, p + 16), headCountR = i32(view, p + 20);
      const headStDia = i32(view, p + 24), headStSp = i32(view, p + 28);
      const webStDia = i32(view, p + 32), webStSp = i32(view, p + 36);
      if (
        REBAR_DIAS.has(webDia) && webSpacing >= 5 && webSpacing <= 50 && REBAR_DIAS.has(headDiaL) &&
        headDiaL === headDiaR && headCountL >= 1 && headCountL <= 60 && headCountL === headCountR &&
        STIRRUP_DIAS.has(headStDia) && STIRRUP_DIAS.has(webStDia) &&
        headStSp >= 4 && headStSp <= 40 && webStSp >= 4 && webStSp <= 40
      ) return p;
    }
    return -1;
  }
  const scanEnd = Math.min(view.byteLength - 92, afterStreams + 700);
  for (let p = afterStreams + 32; p <= scanEnd; p++) {
    const topDia = i32(view, p), topCount = i32(view, p + 4);
    const botDia = i32(view, p + 20), botCount = i32(view, p + 24);
    const stDia = i32(view, p + 80), sp0 = i32(view, p + 84), sp1 = i32(view, p + 88);
    if (
      REBAR_DIAS.has(topDia) && REBAR_DIAS.has(botDia) &&
      topCount >= 1 && topCount <= 24 && botCount >= 1 && botCount <= 24 &&
      STIRRUP_DIAS.has(stDia) && sp0 >= 4 && sp0 <= 40 && sp1 >= 4 && sp1 <= 40 &&
      i32(view, p - 4) === 0 && i32(view, p - 8) === 0
    ) return p;
  }
  return -1;
}

test("v10 R4 builder sentetik düzen: perde 40B, kiriş 92B, radye 16B + donör uzunluk doğrulaması", () => {
  // Perde: 10 × i32 LE, okuyucu alan sırasıyla birebir (webDia, webSpacing, headDia×2, headCount×2, headSt, headStSp, webSt, webStSp)
  const wall = buildIde10WallRebarRecord({
    webDiaMm: 10, webSpacingCm: 25, headDiaMm: 14, headCount: 9,
    headStirrupDiaMm: 8, headStirrupSpacingCm: 16, webStirrupDiaMm: 8, webStirrupSpacingCm: 20,
  });
  assert.equal(wall.length, 40);
  const wv = new DataView(wall.buffer, wall.byteOffset, wall.byteLength);
  assert.equal(wv.getInt32(0, true), 10);
  assert.equal(wv.getInt32(4, true), 25);
  assert.equal(wv.getInt32(8, true), 14);
  assert.equal(wv.getInt32(12, true), 9);
  assert.equal(wv.getInt32(16, true), 14);
  assert.equal(wv.getInt32(20, true), 9);
  assert.equal(wv.getInt32(24, true), 8);
  assert.equal(wv.getInt32(28, true), 16);
  assert.equal(wv.getInt32(32, true), 8);
  assert.equal(wv.getInt32(36, true), 20);

  // Kiriş: 92B blok — okuyucu alanları + A0 census sabitleri + donör geçiş yuvaları
  const at32 = new Uint8Array(12).fill(0xab);
  const at56 = new Uint8Array(12).fill(0xcd);
  const beam = buildIde10BeamRebarRecord({
    topDiaMm: 14, topCount: 2, bottomDiaMm: 14, bottomCount: 2,
    stirrupDiaMm: 8, stirrupSpacingCm: [20, 10],
    intermediates: { at32, at56 },
  });
  assert.equal(beam.length, 92);
  const bv = new DataView(beam.buffer, beam.byteOffset, beam.byteLength);
  assert.equal(bv.getInt32(0, true), 14);
  assert.equal(bv.getInt32(4, true), 2);
  assert.equal(bv.getUint32(8, true), 0);   // A0 census 289/289: +8..+15 sıfır
  assert.equal(bv.getUint32(16, true), 1);  // A0 census 289/289: +16 = 1
  assert.equal(bv.getInt32(20, true), 14);
  assert.equal(bv.getInt32(24, true), 2);
  assert.equal(bv.getUint32(28, true), 1);  // A0 census 289/289: +28 = 1
  assert.deepEqual(Array.from(beam.subarray(32, 44)), Array.from(at32));
  assert.equal(bv.getUint32(44, true), 0);  // A0 census 289/289: +44..+55 sıfır
  assert.deepEqual(Array.from(beam.subarray(56, 68)), Array.from(at56));
  assert.equal(bv.getUint32(68, true), 0);  // A0 census 289/289: +68..+79 sıfır
  assert.equal(bv.getInt32(80, true), 8);
  assert.equal(bv.getInt32(84, true), 20);
  assert.equal(bv.getInt32(88, true), 10);

  // Donör yuvaları ve etiket alanı yapısal olarak doğrulanır — yanlış boyut üretimi reddeder.
  assert.throws(() => buildIde10BeamRebarRecord({
    topDiaMm: 14, topCount: 2, bottomDiaMm: 14, bottomCount: 2,
    stirrupDiaMm: 8, stirrupSpacingCm: [20, 10],
    intermediates: { at32: new Uint8Array(11), at56 },
  }));
  assert.throws(() => buildIde10BeamRebarRecord({
    topDiaMm: 14, topCount: 2, bottomDiaMm: 14, bottomCount: 2,
    stirrupDiaMm: 8, stirrupSpacingCm: [20],
    intermediates: { at32, at56 },
  }));

  // Radye: 16B — [d1][s1][d2][s2] (okuyucu d1/s1/d2/s2 adlandırması; v10 shift=0)
  const raft = buildIde10RaftRebarRecord({ d1DiaMm: 14, d1SpacingCm: 13, d2DiaMm: 14, d2SpacingCm: 13 });
  assert.equal(raft.length, 16);
  const rv = new DataView(raft.buffer, raft.byteOffset, raft.byteLength);
  assert.equal(rv.getInt32(0, true), 14);
  assert.equal(rv.getInt32(4, true), 13);
  assert.equal(rv.getInt32(8, true), 14);
  assert.equal(rv.getInt32(12, true), 13);

  // Yerleşim sabitleri (census/okuyucu çapalı)
  assert.equal(IDE10_WALL_REBAR_TAIL_OFFSET, 96);   // A0 census 178/178: perde kuyruğu akış-sonu +96
  assert.equal(IDE10_RAFT_REBAR_ATTR_OFFSET, 960); // ide-r1-r5.ts R4 okuyucusu: attributes+960 (v10 shift=0)
});

test("A0 birebir: 468 R4 donatı kaydının üretimi (178 perde + 289 kiriş + 1 radye)", { skip: !existsSync(A0_PATH) }, () => {
  const buf = readFileSync(A0_PATH);
  const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
  const bytes = new Uint8Array(ab);
  const view = new DataView(ab);
  const project = parseIde10(ab, "A0_orijinal.ide10");
  const elements = project.elements;

  const rebarIndexes: number[] = [];
  elements.forEach((e, i) => { if (e.rebarLayout) rebarIndexes.push(i); });
  const wallCount = rebarIndexes.filter(i => elements[i].rebarLayout!.kind === "wall").length;
  const beamCount = rebarIndexes.filter(i => elements[i].rebarLayout!.kind === "beam").length;
  const raftCount = rebarIndexes.filter(i => elements[i].rebarLayout!.kind === "raft").length;
  assert.equal(rebarIndexes.length, 468, "R4 donatı kaydı sayısı (bytemap §5 oracle)");
  assert.equal(wallCount, 178, "perde donatı sayısı");
  assert.equal(beamCount, 289, "kiriş donatı sayısı");
  assert.equal(raftCount, 1, "radye donatı sayısı");

  let produced = 0;
  for (const idx of rebarIndexes) {
    const e = elements[idx];
    const r = e.rebarLayout!;
    if (r.kind !== "wall" && r.kind !== "beam" && r.kind !== "raft") continue; // A0'da kolon donatısı yok
    const attrs = e.sourceOffset + e.name.length + 1;
    const nextAttrs = idx + 1 < elements.length
      ? elements[idx + 1].sourceOffset + elements[idx + 1].name.length + 1
      : bytes.length;

    if (r.kind === "raft") {
      const p = attrs + IDE10_RAFT_REBAR_ATTR_OFFSET;
      assert.equal(i32(view, p), 14, "radye d1 (A0 RD01)");
      const record = buildIde10RaftRebarRecord({
        d1DiaMm: i32(view, p), d1SpacingCm: i32(view, p + 4),
        d2DiaMm: i32(view, p + 8), d2SpacingCm: i32(view, p + 12),
      });
      assertBytesEqual(record, bytes.subarray(p, p + 16), `radye ${e.name} @${p}`);
      produced++;
      continue;
    }

    // Kaydın kendi öznitelik akışları: [attributes, sonraki eleman sınırı) penceresi (t24 census yöntemiyle örtüşür)
    const streams = scanIde201094Streams(bytes, attrs, nextAttrs, 16);
    assert.equal(streams.length, 3, `${e.type} ${e.name}: kayıt-içi akış sayısı`);
    const afterStreams = streams[streams.length - 1].endOffset;
    const p = locateRebarPattern(view, afterStreams, r.kind);
    assert.ok(p > 0, `${e.type} ${e.name}: R4 deseni bulunamadı`);

    if (r.kind === "wall") {
      // Yerleşim: perde kuyruğu kaydın son akışından sabit +96 uzakta (A0 census 178/178)
      assert.equal(p - afterStreams, IDE10_WALL_REBAR_TAIL_OFFSET, `perde ${e.name}: kuyruk uzaklığı`);
      // Okuyucu alanları parser çıktısıyla çapraz doğrulanır
      assert.equal(i32(view, p), r.webDiaMm, `${e.name} webDia`);
      assert.equal(i32(view, p + 4), r.webSpacingCm, `${e.name} webSpacing`);
      assert.equal(i32(view, p + 8), r.headDiaMm, `${e.name} headDia`);
      assert.equal(i32(view, p + 12), r.headCount, `${e.name} headCount`);
      assert.equal(i32(view, p + 16), r.headDiaMm, `${e.name} headDia (sağ baş)`);
      assert.equal(i32(view, p + 20), r.headCount, `${e.name} headCount (sağ baş)`);
      assert.equal(i32(view, p + 24), r.headStirrupDiaMm, `${e.name} headStirrupDia`);
      assert.equal(i32(view, p + 28), r.headStirrupSpacingCm, `${e.name} headStirrupSpacing`);
      assert.equal(i32(view, p + 32), r.webStirrupDiaMm, `${e.name} webStirrupDia`);
      assert.equal(i32(view, p + 36), r.webStirrupSpacingCm, `${e.name} webStirrupSpacing`);
      const record = buildIde10WallRebarRecord({
        webDiaMm: r.webDiaMm, webSpacingCm: r.webSpacingCm,
        headDiaMm: r.headDiaMm, headCount: r.headCount,
        headStirrupDiaMm: r.headStirrupDiaMm, headStirrupSpacingCm: r.headStirrupSpacingCm,
        webStirrupDiaMm: r.webStirrupDiaMm, webStirrupSpacingCm: r.webStirrupSpacingCm,
      });
      assertBytesEqual(record, bytes.subarray(p, p + 40), `perde ${e.name} @${p}`);
      produced++;
      continue;
    }

    // Kiriş: okuyucunun sıfır-boşluk koşulu (p-4, p-8 sıfır) konum kanıtının parçası
    assert.equal(i32(view, p - 4), 0, `kiriş ${e.name}: p-4 sıfır boşluk`);
    assert.equal(i32(view, p - 8), 0, `kiriş ${e.name}: p-8 sıfır boşluk`);
    assert.equal(i32(view, p), r.topDiaMm, `${e.name} topDia`);
    assert.equal(i32(view, p + 4), r.topCount, `${e.name} topCount`);
    assert.equal(i32(view, p + 20), r.bottomDiaMm, `${e.name} bottomDia`);
    assert.equal(i32(view, p + 24), r.bottomCount, `${e.name} bottomCount`);
    assert.equal(i32(view, p + 80), r.stirrupDiaMm, `${e.name} stirrupDia`);
    assert.equal(i32(view, p + 84), r.stirrupSpacingCm[0], `${e.name} stirrupSpacing[0]`);
    assert.equal(i32(view, p + 88), r.stirrupSpacingCm[1], `${e.name} stirrupSpacing[1]`);
    const record = buildIde10BeamRebarRecord({
      topDiaMm: r.topDiaMm, topCount: r.topCount,
      bottomDiaMm: r.bottomDiaMm, bottomCount: r.bottomCount,
      stirrupDiaMm: r.stirrupDiaMm, stirrupSpacingCm: r.stirrupSpacingCm,
      // Okuyucu deseninin kapsamadığı ara baytlar donör geçişiyle birebir korunur (semantik iddia yok).
      intermediates: { at32: bytes.subarray(p + 32, p + 44), at56: bytes.subarray(p + 56, p + 68) },
    });
    assertBytesEqual(record, bytes.subarray(p, p + 92), `kiriş ${e.name} @${p}`);
    produced++;
  }
  assert.equal(produced, 468, "birebir üretilen kayıt sayısı");
});
