import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { decodeCp1254, encodeCp1254 } from "./cp1254";
import { extractIdeMaterials } from "./ide-r1-r5";
import { parseIde10 } from "./index";
import {
  buildIde10ElementMaterialAssignment,
  buildIde10R1MaterialRecord,
  buildIde10R1MaterialTable,
  type Ide10R1MaterialRecordInput,
} from "./ide10-r1-material";

/**
 * T-F3.2a — v10 R1 malzeme kayıt üreticisi sınaması (KIRMIZI → YEŞİL).
 *
 * KANIT zinciri (uydurma alan yok):
 * - Okuyucu deseni: `ide-r1-r5.ts` `extractIdeMaterials` (çapa `TEMEL TASARIM ZARFI\0`,
 *   count @zt+802; kayıt = [u32 nativeId][u32 kind][u8 bayrak=0][u32 slen][CP1254 ad\0][14×f64])
 *   ve `resolveElementMaterialIndex` (eleman↔malzeme eşlem kaydı = eleman kaydının
 *   öznitelik kuyruğunda [u32 slen][ad\0]; "CONTINUOUS" = varsayılan beton mirası).
 * - A0 oracle: `evidence/orkestrasyon/2026-11-18-F2-T2.4/rea/bytemap-A0.md` §5
 *   (2/2 malzeme: C25 B420C beton + S235 çelik; eşlem kayıtlarda).
 * - Gramer: `ide10-grammar.json` `akisDisiTasiyicilar` R1-MALZEME (KANIT; assumption yok).
 * - Bayt tanığı (birebir hedef): A0 sözlük tablosu @36403473..36403742 (269 B =
 *   tablo 1: C25 B420C kaydı 135 B + tablo 2: S235 kaydı 130 B + count 4 B) ve
 *   eleman kayıtları içinde 553 × [u32 11]["CONTINUOUS\0"] eşlem kaydı
 *   (712 elemanda materialIndex tanımlı; 159'u tip varsayılanına düşer).
 * - Çapraz tanıklar: MS2 (nativeId 1,2) ve SK (nativeId 1,3 — ARDIŞIK OLMAYAN nativeId
 *   tanığı; t32a çalışma kaydı) aynı kayıt düzenini taşıyor.
 *
 * Kapsam notu: A0 R1 bölgesindeki `TEMEL TASARIM ZARFI` zarf tablosu
 * (@36402691..36403455; 6 proje-değişkenli f64 + 34 giriş) ve F9 blok önyazısı
 * (@36403742..36403785; [u32][u32][3×f64][u32][u32 0xNN8000][01 01 00]) bu görevin
 * malzeme sözleşmesi DIŞINDAdır — semantiği kanıtlanmadı, üretim yoluna girmez
 * (tuketiciSozlesme: kanıtsız içerik uydurulmaz; T-F3.3 donör geçişi uygular).
 */

const A0_PATH = "C:\\Users\\hsyn\\Desktop\\hsyncad\\incelemeler\\donusum-esdegerlik-2026-11-15\\00-kaynak\\A0_orijinal.ide10";
const MS2_PATH = "D:\\IDM_DOWNLOAD\\MUSTAFA SELVİ TÜM PROJELER\\STATİK\\2.kısım\\MUSTAFA SELVİ 2.KISIM.ide10";
const SK_PATH = "D:\\IDM_DOWNLOAD\\SÜHEYLA KARA PROJELER\\STATİK\\218 ada 50 parsel STATİK.ide10";

function loadArrayBuffer(path: string): ArrayBuffer {
  const buf = readFileSync(path);
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
}

function assertBytesEqual(actual: Uint8Array, expected: Uint8Array, label: string): void {
  assert.equal(actual.length, expected.length, `${label}: length ${actual.length} != ${expected.length}`);
  for (let i = 0; i < actual.length; i++) {
    assert.equal(actual[i], expected[i], `${label}: byte ${i}: ${actual[i]} != ${expected[i]}`);
  }
}

/** Okuyucu çapa taraması (`ide-r1-r5.ts` findAsciiBytes deseni — modül-içi kopya). */
function findAnchor(bytes: Uint8Array, needle = "TEMEL TASARIM ZARFI\0"): number {
  const target = encodeCp1254(needle);
  outer: for (let i = 0; i <= bytes.length - target.length; i++) {
    for (let j = 0; j < target.length; j++) {
      if (bytes[i + j] !== target[j]) continue outer;
    }
    return i;
  }
  return -1;
}

test("R1 builder emits the exact dictionary byte layout: count + [u32 id][u32 kind][u8 0][u32 slen][ad\\0][14×f64]", () => {
  const floatsA = Array.from({ length: 14 }, (_, i) => i + 0.5);
  const floatsB = Array.from({ length: 14 }, (_, i) => 20 + i * 1.25);
  const recA: Ide10R1MaterialRecordInput = { nativeId: 1, kind: 0, name: "C25 B420C", floats: floatsA };
  const recB: Ide10R1MaterialRecordInput = { nativeId: 2, kind: 1, name: "S235", floats: floatsB };

  // Beklenen baytlar elle kurulur (yerleşim sözleşmesi; kayıt başına 13 + slen + 112)
  const nameA = encodeCp1254("C25 B420C");
  const nameB = encodeCp1254("S235");
  const table = new Uint8Array(4 + (13 + nameA.length + 1 + 112) + (13 + nameB.length + 1 + 112));
  const view = new DataView(table.buffer);
  let p = 0;
  view.setUint32(p, 2, true); p += 4;
  view.setUint32(p, recA.nativeId, true); p += 4;
  view.setUint32(p, recA.kind, true); p += 4;
  table[p] = 0; p += 1;
  view.setUint32(p, nameA.length + 1, true); p += 4;
  table.set(nameA, p); p += nameA.length;
  table[p] = 0; p += 1;
  for (const v of floatsA) { view.setFloat64(p, v, true); p += 8; }
  view.setUint32(p, recB.nativeId, true); p += 4;
  view.setUint32(p, recB.kind, true); p += 4;
  table[p] = 0; p += 1;
  view.setUint32(p, nameB.length + 1, true); p += 4;
  table.set(nameB, p); p += nameB.length;
  table[p] = 0; p += 1;
  for (const v of floatsB) { view.setFloat64(p, v, true); p += 8; }
  assert.equal(p, table.length);

  const built = buildIde10R1MaterialTable([recA, recB]);
  assertBytesEqual(built, table, "sözlük tablosu (sentetik)");

  // Kayıt düzeyi: tablo 1 / tablo 2 ayrı ayrı da üretilebilir
  const builtA = buildIde10R1MaterialRecord(recA);
  assertBytesEqual(builtA, table.subarray(4, 4 + 13 + nameA.length + 1 + 112), "tablo 1: C25 B420C kaydı");
  const builtB = buildIde10R1MaterialRecord(recB);
  assertBytesEqual(builtB, table.subarray(4 + 13 + nameA.length + 1 + 112), "tablo 2: S235 kaydı");

  // Eşlem kaydı: [u32 slen][CP1254 ad + NUL] — "CONTINUOUS" 11 bayt slen ile
  const assignment = buildIde10ElementMaterialAssignment("CONTINUOUS");
  assertBytesEqual(assignment, new Uint8Array([11, 0, 0, 0, 0x43, 0x4f, 0x4e, 0x54, 0x49, 0x4e, 0x55, 0x4f, 0x55, 0x53, 0]), "CONTINUOUS eşlem kaydı");
});

test("R1 builder rejects kanıt dışı üretim girdileri (sert hata; sessiz varsayılan yok)", () => {
  const valid: Ide10R1MaterialRecordInput = {
    nativeId: 1,
    kind: 0,
    name: "C25 B420C",
    floats: Array.from({ length: 14 }, (_, i) => i + 1),
  };
  // Boş/64+ tablo: okuyucu count zarfı 1..64 (ide-r1-r5.ts L139-140)
  assert.throws(() => buildIde10R1MaterialTable([]));
  assert.throws(() => buildIde10R1MaterialTable(Array.from({ length: 65 }, () => valid)));
  // 14 sabit f64 bloğu: kayıt parametre düzeni 112 B
  assert.throws(() => buildIde10R1MaterialTable([{ ...valid, floats: valid.floats.slice(0, 13) }]));
  assert.throws(() => buildIde10R1MaterialTable([{ ...valid, floats: [...valid.floats.slice(0, 13), Number.NaN] }]));
  // kind yalnız 0 (beton) / 1 (çelik) — kanıt tanığı 8/8 kayıt
  assert.throws(() => buildIde10R1MaterialTable([{ ...valid, kind: 2 as unknown as 0 | 1 }]));
  // nativeId u32 olmalı (SK tanığı: ardışık olmak zorunda değil ama tamsayı/u32 aralığı şart)
  assert.throws(() => buildIde10R1MaterialTable([{ ...valid, nativeId: -1 }]));
  assert.throws(() => buildIde10R1MaterialTable([{ ...valid, nativeId: 1.5 }]));
  assert.throws(() => buildIde10R1MaterialTable([{ ...valid, nativeId: 0x1_0000_0000 }]));
  // Ad: boş / NUL içeren / CP1254'e oturmayan ve okuyucu slen zarfı dışı
  assert.throws(() => buildIde10R1MaterialTable([{ ...valid, name: "" }]));
  assert.throws(() => buildIde10R1MaterialTable([{ ...valid, name: "C25\0B420C" }]));
  assert.throws(() => buildIde10R1MaterialTable([{ ...valid, name: "日本" }]));
  assert.throws(() => buildIde10R1MaterialTable([{ ...valid, name: "X".repeat(200) }]));
  // Eşlem kaydı: okuyucu bölge taraması slen 2..64 (ide-r1-r5.ts L201)
  assert.throws(() => buildIde10ElementMaterialAssignment(""));
  assert.throws(() => buildIde10ElementMaterialAssignment("CONTINUOUS\0"));
  assert.throws(() => buildIde10ElementMaterialAssignment("日本"));
  assert.throws(() => buildIde10ElementMaterialAssignment("X".repeat(100)));
});

test("A0 R1 bölgesi: okuyucuyla çözülen 2 malzeme sözlük tablosu BİREBİR yeniden üretilir (269 B)", { skip: !existsSync(A0_PATH) }, () => {
  const ab = loadArrayBuffer(A0_PATH);
  const bytes = new Uint8Array(ab);
  const view = new DataView(ab);

  // 1) Okuyucu: 2 malzeme (oracle — bytemap-A0.md §5)
  const materials = extractIdeMaterials(bytes, view);
  assert.ok(materials, "extractIdeMaterials on A0");
  assert.equal(materials.length, 2);
  assert.equal(materials[0].name, "C25 B420C");
  assert.equal(materials[0].kind, "concrete");
  assert.equal(materials[1].name, "S235");
  assert.equal(materials[1].kind, "steel");

  // 2) Bayt düzeyinde çöz: okuyucu yerleşimiyle yürü (count @zt+802)
  const zt = findAnchor(bytes);
  assert.ok(zt >= 0, "A0 çapası");
  const countOffset = zt + 764 + 38;
  assert.equal(countOffset, 36403473, "A0 count konumu (bytemap §4)");
  const count = view.getUint32(countOffset, true);
  assert.equal(count, 2);
  const inputs: Ide10R1MaterialRecordInput[] = [];
  let cursor = countOffset + 4;
  for (let i = 0; i < count; i++) {
    const nativeId = view.getUint32(cursor, true);
    const kind = view.getUint32(cursor + 4, true);
    assert.equal(bytes[cursor + 8], 0, `kayıt ${i}: bayrak 0 tanığı`);
    const slen = view.getUint32(cursor + 9, true);
    const name = decodeCp1254(bytes.subarray(cursor + 13, cursor + 13 + slen - 1));
    const floats: number[] = [];
    for (let j = 0; j < 14; j++) floats.push(view.getFloat64(cursor + 13 + slen + j * 8, true));
    inputs.push({ nativeId, kind: kind as 0 | 1, name, floats });
    cursor = cursor + 13 + slen + 112;
  }
  const recEnd = cursor;
  assert.equal(recEnd, 36403742, "A0 sözlük bitişi");
  assert.equal(recEnd - countOffset, 269, "A0 sözlük tablosu 269 B");

  // 3) Builder'a girdi olarak ver → üretilen baytlar A0 ile BİREBİR
  const table = buildIde10R1MaterialTable(inputs);
  assertBytesEqual(table, bytes.subarray(countOffset, recEnd), "A0 sözlük tablosu (269 B)");

  // Tablo 1 (C25 B420C kaydı) + tablo 2 (S235 kaydı) ayrı ayrı bayt aralıklarıyla
  assertBytesEqual(buildIde10R1MaterialRecord(inputs[0]), bytes.subarray(36403477, 36403612), "tablo 1: C25 B420C @36403477..36403612");
  assertBytesEqual(buildIde10R1MaterialRecord(inputs[1]), bytes.subarray(36403612, 36403742), "tablo 2: S235 @36403612..36403742");

  // 4) Üretim → okuyucu gidiş-dönüş: çapa + okuyucu-atla arası + tablo; sentetik tamponda
  //    çapa @0 olduğundan count, okuyucu sabiti olan çapa+802'de olmalı
  //    (okuyucu çapa ile count arasını okumaz; sıfır dolgu okuyucu sözleşmesiyle geçerli)
  const roundCountOffset = 764 + 38;
  const round = new Uint8Array(roundCountOffset + table.length);
  round.set(encodeCp1254("TEMEL TASARIM ZARFI\0"), 0);
  round.set(table, roundCountOffset);
  const reread = extractIdeMaterials(round, new DataView(round.buffer));
  assert.ok(reread, "üretim çıktısı okuyucuyla çözüldü");
  assert.equal(reread.length, 2);
  assert.equal(reread[0].name, "C25 B420C");
  assert.equal(reread[0].kind, "concrete");
  assert.equal(reread[1].name, "S235");
  assert.equal(reread[1].kind, "steel");
});

test("A0 eleman↔malzeme eşlem kayıtları BİREBİR yeniden üretilir (553 × CONTINUOUS)", { skip: !existsSync(A0_PATH) }, () => {
  const ab = loadArrayBuffer(A0_PATH);
  const bytes = new Uint8Array(ab);
  const view = new DataView(ab);

  const project = parseIde10(ab, "A0_orijinal.ide10");
  const materials = project.materials;
  assert.ok(materials?.length === 2, "parseIde10 malzemeleri");
  const names = new Set(materials.map(m => m.name));

  // Okuyucu bölge taraması (ide-r1-r5.ts resolveElementMaterialIndex):
  // [attributes+340, attributes+450) içindeki ilk [u32 slen 2..64][ad\0]
  let withIndex = 0;
  let located = 0;
  for (const el of project.elements) {
    if (el.materialIndex === undefined) continue;
    withIndex++;
    const attributes = el.sourceOffset + el.name.length + 1;
    const searchEnd = Math.min(bytes.length, attributes + 450);
    for (let at = attributes + 340; at + 8 < searchEnd; at++) {
      const slen = view.getUint32(at, true);
      if (slen < 2 || slen > 64 || at + 4 + slen > searchEnd || bytes[at + 3 + slen] !== 0) continue;
      const text = decodeCp1254(bytes.subarray(at + 4, at + 3 + slen));
      if (text !== "CONTINUOUS" && !names.has(text)) continue;
      const built = buildIde10ElementMaterialAssignment(text);
      assertBytesEqual(built, bytes.subarray(at, at + 4 + slen), `eşlem kaydı @${at} (eleman ${el.name})`);
      located++;
      break;
    }
  }
  // A0 ölçümü (t32a çalışma kaydı): 712 tanımlı materialIndex, 553'ünde bölgede kayıt
  assert.equal(withIndex, 712, "materialIndex tanımlı eleman sayısı");
  assert.equal(located, 553, "bölgede eşlem kaydı bulunan eleman sayısı");
});

test("MS2 ve SK çapraz tanıkları: sözlük tabloları BİREBİR; SK nativeId ardışık değil (1,3)", { skip: !existsSync(MS2_PATH) || !existsSync(SK_PATH) }, () => {
  for (const path of [MS2_PATH, SK_PATH]) {
    const ab = loadArrayBuffer(path);
    const bytes = new Uint8Array(ab);
    const view = new DataView(ab);
    const zt = findAnchor(bytes);
    assert.ok(zt >= 0, `${path}: çapa`);
    const countOffset = zt + 764 + 38;
    const count = view.getUint32(countOffset, true);
    assert.equal(count, 2, `${path}: 2 malzeme`);
    const inputs: Ide10R1MaterialRecordInput[] = [];
    let cursor = countOffset + 4;
    for (let i = 0; i < count; i++) {
      const nativeId = view.getUint32(cursor, true);
      const kind = view.getUint32(cursor + 4, true);
      const slen = view.getUint32(cursor + 9, true);
      const name = decodeCp1254(bytes.subarray(cursor + 13, cursor + 13 + slen - 1));
      const floats: number[] = [];
      for (let j = 0; j < 14; j++) floats.push(view.getFloat64(cursor + 13 + slen + j * 8, true));
      inputs.push({ nativeId, kind: kind as 0 | 1, name, floats });
      cursor = cursor + 13 + slen + 112;
    }
    assertBytesEqual(buildIde10R1MaterialTable(inputs), bytes.subarray(countOffset, cursor), `${path}: sözlük tablosu`);
    if (path === SK_PATH) {
      // SK tanığı: nativeId 1 ve 3 — kayıt sırası ≠ nativeId; builder girdiyi aynen taşır
      assert.deepEqual(inputs.map(r => r.nativeId), [1, 3], "SK nativeId çifti");
    }
  }
});
