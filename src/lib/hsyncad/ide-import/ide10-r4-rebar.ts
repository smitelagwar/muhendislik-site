/**
 * T-F3.2c — v10 (201094) R4 donatı kayıtları için bayt üreticisi (builder).
 *
 * KANIT tabanı (yalnız KANIT kuralları; şemada R4 için `assumption:true` satırı YOKTUR):
 * - Bölge tanımı: `ide10-grammar.json` `akisDisiTasiyiclar` "R4-DONATI" — donatı tamsayıları eleman
 *   kaydında akış-sonrası kuyrukta; 468 `rebarLayout` = 178 perde + 289 kiriş + 1 radye
 *   (KANIT: bytemap-A0.md §5, oracle 468/468; M5-diff: kiriş donatısı s0–s23 akışlarında).
 * - Alan düzeni: `ide-r1-r5.ts` `extractIdeElementRebar` R4 okuyucu deseni (t24 census aracıyla
 *   468/468 doğrulanmış; perde p+0..p+40 10×i32, kiriş p+0/p+4/p+20/p+24/p+80/p+84/p+88,
 *   radye attributes+960 4×i32, v10 shift=0).
 * - Census sabitleri: A0 üzerinde bu görevin ölçümü — kiriş bloğunda +8..+15, +44..+55, +68..+79
 *   sıfır ve +16, +28 = 1 (289/289); perde kuyruğu son akıştan +96 bayt uzakta (178/178).
 *
 * Uydurma yok: okuyucu deseninin kapsamadığı kiriş ara baytları (+32..+43, +56..+67) için
 * semantik ad kurulmamıştır; bunlar donör geçişi (`intermediates`) olarak birebir korunur —
 * şema `meta.tuketiciSozlesme`'nin ölçülmemiş alanlar için öngördüğü davranış.
 *
 * Kapsam dışı: kolon donatısı. Okuyucuda desenı vardır ancak A0'da kolon donatı kaydı yok
 * (468 = 178+289+1); bayt-birebir kanıtı olmayan düzen üretilmez.
 */

/** Perde donatı kuyruğunun, kaydın son öznitelik akışının bitişinden bayt uzaklığı (A0 census 178/178). */
export const IDE10_WALL_REBAR_TAIL_OFFSET = 96;

/** Radye donatı kuyruğunun eleman ad dizesi bitiminden (attributes) bayt uzaklığı — okuyucu deseni (v10 shift=0). */
export const IDE10_RAFT_REBAR_ATTR_OFFSET = 960;

/** Kiriş donatı bloğu bayt uzunluğu (okuyucu deseni: son alan sp1 @+88 → 92 bayt). */
export const IDE10_BEAM_REBAR_RECORD_LENGTH = 92;

export interface Ide10WallRebarInput {
  /** Örme (web) çapı, mm — okuyucu `webDiaMm`. */
  webDiaMm: number;
  /** Örme aralığı, cm — okuyucu `webSpacingCm`. */
  webSpacingCm: number;
  /** Uç (baş) bölgesi boyuna çapı, mm — okuyucu `headDiaMm` (sol/sağ uç aynı değeri taşır). */
  headDiaMm: number;
  /** Uç bölgesi boyuna adedi — okuyucu `headCount` (sol/sağ uç aynı değeri taşır). */
  headCount: number;
  /** Uç bölgesi sargı çapı, mm — okuyucu `headStirrupDiaMm`. */
  headStirrupDiaMm: number;
  /** Uç bölgesi sargı aralığı, cm — okuyucu `headStirrupSpacingCm`. */
  headStirrupSpacingCm: number;
  /** Örme sargı çapı, mm — okuyucu `webStirrupDiaMm`. */
  webStirrupDiaMm: number;
  /** Örme sargı aralığı, cm — okuyucu `webStirrupSpacingCm`. */
  webStirrupSpacingCm: number;
}

export interface Ide10BeamRebarInput {
  /** Üst boyuna çapı, mm — okuyucu `topDiaMm`. */
  topDiaMm: number;
  /** Üst boyuna adedi — okuyucu `topCount`. */
  topCount: number;
  /** Alt boyuna çapı, mm — okuyucu `bottomDiaMm`. */
  bottomDiaMm: number;
  /** Alt boyuna adedi — okuyucu `bottomCount`. */
  bottomCount: number;
  /** Sargı (etriye) çapı, mm — okuyucu `stirrupDiaMm`. */
  stirrupDiaMm: number;
  /** Sargı aralıkları [sp0, sp1], cm — okuyucu `stirrupSpacingCm` (tam 2 giriş). */
  stirrupSpacingCm: number[];
  /**
   * Okuyucu deseninin kapsamadığı ara baytlar (donör geçişi; semantik iddia yoktur):
   * `at32` → blok +32..+43 (12 bayt), `at56` → blok +56..+67 (12 bayt).
   * Bayt-birebir üretim için zorunludur; A0 census'ında bu baytlar kayıttan kayda değişir.
   */
  intermediates: { at32: Uint8Array; at56: Uint8Array };
}

export interface Ide10RaftRebarInput {
  /** Radye X-yönü çap/göreli adlandırma: okuyucu d1 (`topX: Ød1/s1`), mm. */
  d1DiaMm: number;
  /** Okuyucu s1 (`topX: Ød1/s1`), cm. */
  d1SpacingCm: number;
  /** Okuyucu d2 (`topY: Ød2/s2`), mm. */
  d2DiaMm: number;
  /** Okuyucu s2 (`topY: Ød2/s2`), cm. */
  d2SpacingCm: number;
}

function assertIntField(value: number, name: string): void {
  if (!Number.isInteger(value) || value < 0 || value > 0x7fffffff) {
    throw new Error(`IDE10 R4 donatı kaydı: '${name}' alanı 0..2^31-1 aralığında tamsayı olmalı (aldı: ${value}).`);
  }
}

/**
 * Perde donatı kuyruğunu üretir: 40 bayt, 10×i32 küçük-endian, okuyucu alan sırasıyla birebir
 * (webDia, webSpacing, headDia, headCount, headDia, headCount, headStDia, headStSp, webStDia, webStSp).
 * Yerleşim: kaydın son öznitelik akışından `IDE10_WALL_REBAR_TAIL_OFFSET` (=96) bayt ötede.
 */
export function buildIde10WallRebarRecord(input: Ide10WallRebarInput): Uint8Array {
  assertIntField(input.webDiaMm, "webDiaMm");
  assertIntField(input.webSpacingCm, "webSpacingCm");
  assertIntField(input.headDiaMm, "headDiaMm");
  assertIntField(input.headCount, "headCount");
  assertIntField(input.headStirrupDiaMm, "headStirrupDiaMm");
  assertIntField(input.headStirrupSpacingCm, "headStirrupSpacingCm");
  assertIntField(input.webStirrupDiaMm, "webStirrupDiaMm");
  assertIntField(input.webStirrupSpacingCm, "webStirrupSpacingCm");

  const out = new Uint8Array(40);
  const view = new DataView(out.buffer);
  view.setInt32(0, input.webDiaMm, true);
  view.setInt32(4, input.webSpacingCm, true);
  view.setInt32(8, input.headDiaMm, true);
  view.setInt32(12, input.headCount, true);
  view.setInt32(16, input.headDiaMm, true);   // sağ uç baş — okuyucu koşulu headDiaL === headDiaR
  view.setInt32(20, input.headCount, true);   // sağ uç adet — okuyucu koşulu headCountL === headCountR
  view.setInt32(24, input.headStirrupDiaMm, true);
  view.setInt32(28, input.headStirrupSpacingCm, true);
  view.setInt32(32, input.webStirrupDiaMm, true);
  view.setInt32(36, input.webStirrupSpacingCm, true);
  return out;
}

/**
 * Kiriş donatı kuyruğunu üretir: 92 bayt.
 * Düzen (okuyucu desenı + A0 census sabitleri + donör geçişi):
 *   +0   i32 topDia        +4  i32 topCount
 *   +8..15 8×0x00 (census 289/289)   +16 i32 1 (census 289/289)
 *   +20  i32 bottomDia     +24 i32 bottomCount   +28 i32 1 (census 289/289)
 *   +32..43 donör at32     +44..55 12×0x00 (census)   +56..67 donör at56   +68..79 12×0x00 (census)
 *   +80  i32 stirrupDia     +84 i32 sp0     +88 i32 sp1
 * Desen öncesinde 8 baytlık sıfır boşluk (okuyucu koşulu p-4/p-8 sıfır) bu kaydın parçası değildir;
 * kayıt yerleşimi T-F3.3 gövde transcoder'ının sorumluluğundadır.
 */
export function buildIde10BeamRebarRecord(input: Ide10BeamRebarInput): Uint8Array {
  assertIntField(input.topDiaMm, "topDiaMm");
  assertIntField(input.topCount, "topCount");
  assertIntField(input.bottomDiaMm, "bottomDiaMm");
  assertIntField(input.bottomCount, "bottomCount");
  assertIntField(input.stirrupDiaMm, "stirrupDiaMm");
  if (!Array.isArray(input.stirrupSpacingCm) || input.stirrupSpacingCm.length !== 2) {
    throw new Error("IDE10 R4 donatı kaydı: 'stirrupSpacingCm' tam 2 giriş içermeli (okuyucu deseni sp0/sp1).");
  }
  assertIntField(input.stirrupSpacingCm[0], "stirrupSpacingCm[0]");
  assertIntField(input.stirrupSpacingCm[1], "stirrupSpacingCm[1]");
  const { at32, at56 } = input.intermediates;
  if (!(at32 instanceof Uint8Array) || at32.length !== 12) {
    throw new Error("IDE10 R4 donatı kaydı: donör 'at32' tam 12 bayt olmalı (blok +32..+43).");
  }
  if (!(at56 instanceof Uint8Array) || at56.length !== 12) {
    throw new Error("IDE10 R4 donatı kaydı: donör 'at56' tam 12 bayt olmalı (blok +56..+67).");
  }

  const out = new Uint8Array(IDE10_BEAM_REBAR_RECORD_LENGTH);
  const view = new DataView(out.buffer);
  view.setInt32(0, input.topDiaMm, true);
  view.setInt32(4, input.topCount, true);
  // +8..15: A0 census 289/289 sıfır; +16: A0 census 289/289 sabit 1
  view.setUint32(8, 0, true);
  view.setUint32(16, 1, true);
  view.setInt32(20, input.bottomDiaMm, true);
  view.setInt32(24, input.bottomCount, true);
  view.setUint32(28, 1, true); // A0 census 289/289 sabit 1
  out.set(at32, 32);
  // +44..55: A0 census 289/289 sıfır (DataView başlangıçta sıfırlı bırakılır)
  out.set(at56, 56);
  // +68..79: A0 census 289/289 sıfır
  view.setInt32(80, input.stirrupDiaMm, true);
  view.setInt32(84, input.stirrupSpacingCm[0], true);
  view.setInt32(88, input.stirrupSpacingCm[1], true);
  return out;
}

/**
 * Radye temeli donatı kuyruğunu üretir: 16 bayt, 4×i32 küçük-endian (d1, s1, d2, s2).
 * Yerleşim: eleman ad dizesi bitiminden (attributes) `IDE10_RAFT_REBAR_ATTR_OFFSET` (=960) bayt ötede
 * (okuyucu deseni `attributesOffset + 960 + shift`; v10/201094 için shift=0).
 */
export function buildIde10RaftRebarRecord(input: Ide10RaftRebarInput): Uint8Array {
  assertIntField(input.d1DiaMm, "d1DiaMm");
  assertIntField(input.d1SpacingCm, "d1SpacingCm");
  assertIntField(input.d2DiaMm, "d2DiaMm");
  assertIntField(input.d2SpacingCm, "d2SpacingCm");

  const out = new Uint8Array(16);
  const view = new DataView(out.buffer);
  view.setInt32(0, input.d1DiaMm, true);
  view.setInt32(4, input.d1SpacingCm, true);
  view.setInt32(8, input.d2DiaMm, true);
  view.setInt32(12, input.d2SpacingCm, true);
  return out;
}
