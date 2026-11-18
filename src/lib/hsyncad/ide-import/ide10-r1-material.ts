import { decodeCp1254, encodeCp1254 } from "./cp1254";

/**
 * v10 (.ide10, 201094 düz taşıyıcı) R1 malzeme kayıtları üreticisi — T-F3.2a.
 *
 * KANIT zinciri (uydurma alan yok):
 * - Okuyucu deseni: `ide-r1-r5.ts` `extractIdeMaterials` — çapa `TEMEL TASARIM ZARFI\0`,
 *   count @zt+802 (`zt + 764 + 38`), kayıt = [u32 nativeId][u32 kind][u8 bayrak=0][u32 slen]
 *   [CP1254 ad + NUL][14×f64 LE]; `resolveElementMaterialIndex` — eleman↔malzeme eşlem
 *   kaydı = eleman öznitelik kuyruğunda `[u32 slen 2..64][ad\0]`; "CONTINUOUS" = varsayılan
 *   beton mirası (native ad karması FUN_1409486a0: "CONTINUOUS" → 0x941).
 * - A0 oracle: `evidence/orkestrasyon/2026-11-18-F2-T2.4/rea/bytemap-A0.md` §5
 *   (2/2 malzeme: C25 B420C beton + S235 çelik; eleman↔malzeme eşlemesi kayıtlarda).
 * - Gramer: `ide10-grammar.json` `akisDisiTasiyicilar` R1-MALZEME (KANIT; assumption yok).
 * - Bayt tanıkları: A0 @36403473..36403742 (269 B sözlük; tablo 1 = C25 B420C kaydı
 *   @36403477..36403612, tablo 2 = S235 kaydı @36403612..36403742) + 553 ×
 *   [u32 11]["CONTINUOUS\0"] eşlem kaydı; MS2 (nativeId 1,2) ve SK (nativeId 1,3 —
 *   ardışık OLMAYAN nativeId tanığı) aynı düzeni taşır; B0 (.ide11trial) kayıt başlığı
 *   bayt-özdeş, yalnız 14 f64 Blofish kodlanmış (v11 okuma T-F5.1'in sahipliğinde).
 *
 * Kapsam sözleşmesi: A0 R1 bölgesindeki `TEMEL TASARIM ZARFI` zarf tablosu
 * (@36402691..36403455; 6 proje-değişkenli f64 + [u32 34] + 34×20B giriş) ve F9 blok
 * önyazısı (@36403742..36403785; [u32][u32][3×f64][u32 1][u32 0xNN8000][01 01 00]) bu
 * görevin malzeme sözleşmesi DIŞINDAdır — semantiği kanıtlanmadı, uydurulmaz
 * (tuketiciSozlesme: kanıtsız/VARSAYIM içerik üretim yoluna girmez; T-F3.3 donör geçişi
 * uygular). Aynı gerekçeyle kayıt içindeki bayrak alanı sabit 0 yazılır: okuyucu 0'dan
 * farklı bayrağı reddeder (ide-r1-r5.ts L149) ve 4 dosya × 2 kayıt tanığının tamamı 0'dır.
 *
 * f64 alanları ölçeksiz düz little-endian depolanır: `ide10-grammar.json` olcekKuralları
 * (OLCEK-NATIVEZ / OLCEK-GENISLIK) kapsamı yalnız ortak/eleman kaydı skalerleridir —
 * malzeme parametre bloğu kapsam dışıdır (A0 bayt tanığıyla birebir doğrulanır).
 */

/** Kayıt parametre bloğu sabit boyutu: 14 × f64 = 112 B (okuyucu `extractIdeMaterials`). */
export const R1_MATERIAL_FLOAT_COUNT = 14;

/** Sözlük count okuyucu zarfı: 1..64 (ide-r1-r5.ts L139-140 üretim aynası). */
export const R1_MATERIAL_COUNT_MAX = 64;

/** Kayıt adı slen okuyucu zarfı: 2..128, NUL dahil (ide-r1-r5.ts L149). */
export const R1_MATERIAL_NAME_SLEN_MAX = 128;

/** Eşlem kaydı slen okuyucu bölge zarfı: 2..64, NUL dahil (ide-r1-r5.ts L201). */
export const R1_ASSIGNMENT_SLEN_MAX = 64;

/** Eşlem kaydı miras-adı: `CONTINUOUS` (okuyucu → varsayılan beton). */
export const R1_ASSIGNMENT_CONTINUOUS = "CONTINUOUS";

export interface Ide10R1MaterialRecordInput {
  /**
   * Kaydın ilk u32'ı. `extractIdeMaterials` bu alanı okumaz (liste indeksini `id` olarak
   * raporlar); bayt tanıkları: A0/MS2 = 1,2; SK = 1,3 — kayıt sırasından bağımsız
   * native kimlik, birebir üretim için girdi olarak taşınır.
   */
  nativeId: number;
  /** 0 = beton, 1 = çelik (okuyucu `kindRaw === 1` → steel; tanıklar yalnız 0/1 taşıyor). */
  kind: 0 | 1;
  /** CP1254 malzeme adı (ör. "C25 B420C", "S235"). */
  name: string;
  /** 14 ham f64 — depolama birimi değerleri (ölçek YOK; bayt birebirliği ham değerle sağlanır). */
  floats: number[];
}

function encodeName(name: string, label: string, slenMax: number): Uint8Array {
  if (typeof name !== "string" || name.length === 0) {
    throw new Error(`ide10 R1: ${label} adı boş`);
  }
  if (name.includes("\0")) {
    throw new Error(`ide10 R1: ${label} adı NUL içeriyor ("${name}")`);
  }
  const encoded = encodeCp1254(name);
  if (decodeCp1254(encoded) !== name) {
    throw new Error(`ide10 R1: ${label} adı CP1254'e oturmuyor ("${name}")`);
  }
  const slen = encoded.length + 1;
  if (slen < 2 || slen > slenMax) {
    throw new Error(`ide10 R1: ${label} adı slen zarfı dışı (slen=${slen}, zarf 2..${slenMax})`);
  }
  return encoded;
}

function validateRecord(record: Ide10R1MaterialRecordInput, index: number): void {
  const label = `kayıt ${index} (${record.name || "adsız"})`;
  if (!Number.isInteger(record.nativeId) || record.nativeId < 0 || record.nativeId > 0xffff_ffff) {
    throw new Error(`ide10 R1: ${label} nativeId u32 değil (${record.nativeId})`);
  }
  if (record.kind !== 0 && record.kind !== 1) {
    throw new Error(`ide10 R1: ${label} kind kanıt dışı (${record.kind}; yalnız 0=beton / 1=çelik)`);
  }
  if (!Array.isArray(record.floats) || record.floats.length !== R1_MATERIAL_FLOAT_COUNT) {
    throw new Error(`ide10 R1: ${label} f64 bloğu ${R1_MATERIAL_FLOAT_COUNT} değer taşımalı`);
  }
  for (const v of record.floats) {
    if (!Number.isFinite(v)) {
      throw new Error(`ide10 R1: ${label} f64 sonlu sayı değil (${v})`);
    }
  }
}

/**
 * Tek malzeme kaydı üretir: [u32 nativeId][u32 kind][u8 0][u32 slen][ad\0][14×f64 LE].
 * Boyut = 13 + slen + 112 (A0 tablo 1: 135 B, tablo 2: 130 B).
 */
export function buildIde10R1MaterialRecord(record: Ide10R1MaterialRecordInput): Uint8Array {
  validateRecord(record, 0);
  const nameBytes = encodeName(record.name, "sözlük", R1_MATERIAL_NAME_SLEN_MAX);
  const out = new Uint8Array(13 + nameBytes.length + 1 + R1_MATERIAL_FLOAT_COUNT * 8);
  const view = new DataView(out.buffer);
  let p = 0;
  view.setUint32(p, record.nativeId, true); p += 4;
  view.setUint32(p, record.kind, true); p += 4;
  out[p] = 0; p += 1; // bayrak: okuyucu yalnız 0 kabul eder (ide-r1-r5.ts L149)
  view.setUint32(p, nameBytes.length + 1, true); p += 4;
  out.set(nameBytes, p); p += nameBytes.length;
  out[p] = 0; p += 1;
  for (const v of record.floats) {
    view.setFloat64(p, v, true);
    p += 8;
  }
  return out;
}

/**
 * Malzeme sözlük tablosu üretir: [u32 count][count × kayıt] (A0: @36403473..36403742, 269 B).
 * Girdi sırası kayıt sırasıdır; nativeId girdiden aynen taşınır (SK tanığı: 1,3).
 */
export function buildIde10R1MaterialTable(records: Ide10R1MaterialRecordInput[]): Uint8Array {
  if (!Array.isArray(records) || records.length < 1 || records.length > R1_MATERIAL_COUNT_MAX) {
    throw new Error(`ide10 R1: sözlük count zarfı dışı (${records?.length ?? "tanımsız"}; okuyucu zarfı 1..${R1_MATERIAL_COUNT_MAX})`);
  }
  const parts = records.map((r, i) => {
    validateRecord(r, i);
    return buildIde10R1MaterialRecord(r);
  });
  const total = parts.reduce((sum, p) => sum + p.length, 0) + 4;
  const out = new Uint8Array(total);
  new DataView(out.buffer).setUint32(0, records.length, true);
  let p = 4;
  for (const part of parts) {
    out.set(part, p);
    p += part.length;
  }
  return out;
}

/**
 * Eleman↔malzeme eşlem kaydı üretir: [u32 slen][CP1254 ad + NUL].
 * A0 tanığı: 553 × "CONTINUOUS" (slen=11) — okuyucu `resolveElementMaterialIndex`
 * bölge taraması bu kaydı eleman kaydının öznitelik kuyruğunda arar.
 */
export function buildIde10ElementMaterialAssignment(name: string): Uint8Array {
  const nameBytes = encodeName(name, "eşlem", R1_ASSIGNMENT_SLEN_MAX);
  const out = new Uint8Array(4 + nameBytes.length + 1);
  new DataView(out.buffer).setUint32(0, nameBytes.length + 1, true);
  out.set(nameBytes, 4);
  out[out.length - 1] = 0;
  return out;
}
