import { encodeCp1254 } from "./cp1254";

/**
 * v10 (.ide10, 201094 düz taşıyıcı) R3 deprem/zemin kayıt üreticisi — T-F3.2b.
 *
 * KANIT zinciri (uydurma alan yok):
 * - Okuyucu deseni: `ide-r1-r5.ts` `extractIdeSeismicAndSoil` — ayar alanı `ko` yuvası bazlı
 *   (okuyucu: `koOff = exposureStringStart + 4 - 568`), tayf alanları `spectrumEnd` bazlı
 *   (`spectrumEnd` = `[u32 5]["DSF1"|"RSF1"][NUL]` bitişi).
 * - A0 oracle: `evidence/orkestrasyon/2026-11-18-F2-T2.4/rea/bytemap-A0.md` §5 (10/10 alan).
 * - Gramer: `ide10-grammar.json` `akisDisiTasiyicilar` R3-DEPREM-ZEMIN (KANIT, assumption yok).
 *
 * Kapsam sözleşmesi: R3 bölgesi akış-dışı DÜZ bölgedir ve 10 alan yuvası arasında bu görevin
 * kanıt kapsamı DIŞINDA başka alanlar vardır (A0'da 0.4 / 0.3 / 1.0 / 0.6657 f64'ler ve u32
 * sayaçlar gözlendi; bunların semantiği kanıtlanmadı). Bu yüzden builder tüm bölgeyi DEĞİL,
 * yalnızca 2 çapa + 10 KANIT alan yaması üretir; bilinmeyen aralık baytları uydurulmaz
 * (tuketiciSozlesme: VARSAYIM/kanıtsız içerik üretim yoluna girmez).
 *
 * Alanlar düz little-endian f64'dir (ölçek YOK): `ide10-grammar.json` olcekKuralları
 * (OLCEK-NATIVEZ / OLCEK-GENISLIK) kapsamı yalnız ortak/eleman kaydı skalerleridir.
 */

export interface Ide10R3SeismicInput {
  /** Maruziyet sınıfı çapası (ör. "XC2"); okuyucu tarama penceresi slen 3..4 → 2..3 karakter. */
  exposureClass: string;
  /** TBDY davranış katsayısı R (A0: 6). */
  rEntered: number;
  /** R seçim oranı (A0: 0.7794746499380645). */
  rSelectedRatio: number;
  /** Hareketli yük katkı katsayısı n (A0: 0.3). */
  liveLoadFactorN: number;
  /** Zemin yatak katsayısı ko, tf/m³ (A0: 3080). */
  subgradeKoTfM3: number;
  /** Zemin taşıma gücü qt, tf/m² (A0: 55). */
  bearingCapacityQtTfM2: number;
  /** Bina önem katsayısı I (A0: 1). */
  importanceI: number;
  /** Tayf çapası — KANIT yalnız DSF1 ve RSF1 (okuyucu imzaları). */
  spectrumId: "DSF1" | "RSF1";
  /** DSF1 tayf kısa periyot parametresi Ss (A0: 0.429). */
  ss: number;
  /** DSF1 tayf 1.0 sn parametresi S1 (A0: 0.143). */
  s1: number;
  /** SDS = 2/3·Ss (A0: 0.3861). */
  sds: number;
  /** SD1 (A0: 0.1144). */
  sd1: number;
}

/** Yamanın tabanı: `koSlot` = ko f64 yuvası başlangıcı; `spectrumEnd` = tayf çapası bitişi. */
export type Ide10R3SeismicPatchBase = "koSlot" | "spectrumEnd";

export interface Ide10R3SeismicPatch {
  /** Alan adı (10 KANIT alan + exposureClass/spectrumId çapaları). */
  alan: string;
  base: Ide10R3SeismicPatchBase;
  /** Tabandan göreli bayt ofseti (okuyucu sözleşmesinin işaret kuralıyla). */
  offset: number;
  bytes: Uint8Array;
}

/** Ayar bloğu ofsetleri — taban: ko yuvası (okuyucu `extractIdeSeismicAndSoil`). */
export const R3_SETTINGS_OFFSETS = {
  rEntered: -49,
  rSelectedRatio: -41,
  liveLoadFactorN: -8,
  subgradeKoTfM3: 0,
  bearingCapacityQtTfM2: 8,
  importanceI: 34,
} as const;

/** Exposure sınıfı çapası: `[u32 slen][CP1254 sınıf][NUL]` başlangıcı = ko yuvası + 564. */
export const R3_EXPOSURE_ANCHOR_KO_OFFSET = 564;

/** Tayf alanı ofsetleri — taban: spectrumEnd. */
export const R3_SPECTRUM_OFFSETS = {
  ss: 44,
  s1: 52,
  sds: 68,
  sd1: 76,
} as const;

/** Tayf çapası `[u32 5][id\0]` (9 bayt) = spectrumEnd − 9. */
export const R3_SPECTRUM_ANCHOR_OFFSET = -9;

const R3_SPECTRUM_IDS: ReadonlySet<string> = new Set(["DSF1", "RSF1"]);

function f64le(value: number): Uint8Array {
  const out = new Uint8Array(8);
  new DataView(out.buffer).setFloat64(0, value, true);
  return out;
}

/**
 * R3 deprem/zemin alan yamalarını üretir: 2 çapa + 10 KANIT alan (12 yama).
 * Bilinmeyen aralık baytları üretilmez — tüketici (T-F3.3) yamaları hedef bölgeye ofsetleriyle
 * uygular, kapsam dışı baytlar kaynak dosyadan korunur.
 */
export function buildIde10R3SeismicPatches(input: Ide10R3SeismicInput): Ide10R3SeismicPatch[] {
  const exposureBytes = encodeCp1254(input.exposureClass);
  if (exposureBytes.length < 2 || exposureBytes.length > 3) {
    throw new Error(`ide10 R3: exposureClass "${input.exposureClass}" okuyucu penceresi dışı (slen 3..4 → 2..3 karakter)`);
  }
  if (!R3_SPECTRUM_IDS.has(input.spectrumId)) {
    throw new Error(`ide10 R3: spectrumId "${input.spectrumId}" kanıt dışı (yalnız DSF1/RSF1)`);
  }
  const numeric: Array<[keyof Ide10R3SeismicInput, number]> = [
    ["rEntered", input.rEntered],
    ["rSelectedRatio", input.rSelectedRatio],
    ["liveLoadFactorN", input.liveLoadFactorN],
    ["subgradeKoTfM3", input.subgradeKoTfM3],
    ["bearingCapacityQtTfM2", input.bearingCapacityQtTfM2],
    ["importanceI", input.importanceI],
    ["ss", input.ss],
    ["s1", input.s1],
    ["sds", input.sds],
    ["sd1", input.sd1],
  ];
  for (const [name, value] of numeric) {
    if (!Number.isFinite(value)) {
      throw new Error(`ide10 R3: alan ${String(name)} sonlu sayı değil (${value})`);
    }
  }

  // Exposure çapası: [u32 slen][CP1254 sınıf][NUL] (slen = karakter sayısı + 1, NUL dahil)
  const exposureAnchor = new Uint8Array(4 + exposureBytes.length + 1);
  new DataView(exposureAnchor.buffer).setUint32(0, exposureBytes.length + 1, true);
  exposureAnchor.set(exposureBytes, 4);

  // Tayf çapası: [u32 5]["DSF1"|"RSF1"][NUL] → 9 bayt
  const spectrumAnchor = new Uint8Array(9);
  new DataView(spectrumAnchor.buffer).setUint32(0, 5, true);
  spectrumAnchor.set(encodeCp1254(input.spectrumId), 4);

  return [
    { alan: "exposureClass", base: "koSlot", offset: R3_EXPOSURE_ANCHOR_KO_OFFSET, bytes: exposureAnchor },
    { alan: "rEntered", base: "koSlot", offset: R3_SETTINGS_OFFSETS.rEntered, bytes: f64le(input.rEntered) },
    { alan: "rSelectedRatio", base: "koSlot", offset: R3_SETTINGS_OFFSETS.rSelectedRatio, bytes: f64le(input.rSelectedRatio) },
    { alan: "liveLoadFactorN", base: "koSlot", offset: R3_SETTINGS_OFFSETS.liveLoadFactorN, bytes: f64le(input.liveLoadFactorN) },
    { alan: "subgradeKoTfM3", base: "koSlot", offset: R3_SETTINGS_OFFSETS.subgradeKoTfM3, bytes: f64le(input.subgradeKoTfM3) },
    { alan: "bearingCapacityQtTfM2", base: "koSlot", offset: R3_SETTINGS_OFFSETS.bearingCapacityQtTfM2, bytes: f64le(input.bearingCapacityQtTfM2) },
    { alan: "importanceI", base: "koSlot", offset: R3_SETTINGS_OFFSETS.importanceI, bytes: f64le(input.importanceI) },
    { alan: "spectrumId", base: "spectrumEnd", offset: R3_SPECTRUM_ANCHOR_OFFSET, bytes: spectrumAnchor },
    { alan: "ss", base: "spectrumEnd", offset: R3_SPECTRUM_OFFSETS.ss, bytes: f64le(input.ss) },
    { alan: "s1", base: "spectrumEnd", offset: R3_SPECTRUM_OFFSETS.s1, bytes: f64le(input.s1) },
    { alan: "sds", base: "spectrumEnd", offset: R3_SPECTRUM_OFFSETS.sds, bytes: f64le(input.sds) },
    { alan: "sd1", base: "spectrumEnd", offset: R3_SPECTRUM_OFFSETS.sd1, bytes: f64le(input.sd1) },
  ];
}
