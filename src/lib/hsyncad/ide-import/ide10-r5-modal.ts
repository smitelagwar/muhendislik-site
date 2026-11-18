import { decodeCp1254, encodeCp1254 } from "./cp1254";

/**
 * v10 R5 F9/modal producer (T-F3.2d).
 *
 * Kanit tabani (uretim yolu yalniz KANIT; VARSAYIM isaretli alanlar kullanilmaz):
 * - ide10-grammar.json v1.0.1 akisDisiTasiyicilar R5-MODAL: kuyrukta 10 modal tablo
 *   (A0 koordinat; bytemap-A0.md §4/§5 oracle 10 tablo).
 * - ide-r1-r5.ts extractIdePrecomputedF9 okuyucu deseni:
 *   [u32 slen][ad CP1254 + NUL][104B baslik][u32 modeCount][modeCount×f64 frekans]
 *   [modeCount × 18×f64 kayit] (gamma = satir uye 1, etkin kutle = uye 2).
 * - ide10-grammar.json MODAL-PERIYOT-KAYDI (KANIT, M-base): akis-DISI duz f64 cifti
 *   @248907 (Mode 3 T) / @248915 (Mode 1 T) — A0'daki karsiligi ARA-BOLGE'de
 *   T = 1/f bit-exact ciftleri (T-F3.2d olcumu, bu modulun testinde dogrulanir).
 *
 * Baslik (104B) ve tablolar arasi kuyruk baytlari gramerde alan-duzeyinde acik
 * DEGILDIR; uretici bunlari seffaf opak bayt olarak tasiyip aynen geri yazar —
 * semantik iddia uydurulmaz (KANIT yalniz ilkesi).
 */

/** Reader deseniyle ayni modal ad imzasi (`extractIdePrecomputedF9`). */
const MODAL_NAME_RE = /^Modal(?:-B)?(?:'| [EB]+E?\d)$/;
const MODAL_NAME_MIN_LEN = 7;
const MODAL_NAME_MAX_LEN = 24;
/** Ad NUL'u ile modeCount arasindaki sabit 104 baytlik baslik blogu. */
const MODAL_HEADER_BYTES = 104;
/** Ad bitisinden modeCount'a olan sabit ofset (reader: nameEnd + 104). */
const MODAL_MODE_COUNT_OFFSET_FROM_NAME_END = 104;
/** Frekans dizisi baslangici ad bitisinden +108 (modeCount u32'sinden +4). */
const MODAL_FREQS_OFFSET_FROM_NAME_END = 108;
/** Reader semantigi: her mod kaydinda 18 f64 (gamma = uye 1, etkin kutle = uye 2). */
const MODAL_MODE_ROW_F64_COUNT = 18;
const MODAL_MODE_COUNT_MIN = 1;
const MODAL_MODE_COUNT_MAX = 120;

export interface Ide10R5ModalTable {
  /** CP1254 tablo adi (uretici encodeCp1254 ile geri yazar; NUL eklenir). */
  name: string;
  /** Ad NUL'u ile modeCount arasindaki 104 bayt (opak: tablo kimligi + sabit dolgu). */
  header: Uint8Array;
  modeCount: number;
  /** modeCount × f64 — Hz (reader aralik dogrulamasi: [1e-9, 1e5]). */
  frequenciesHz: number[];
  /** modeCount × [18 f64] ham kayit satirlari (gamma = satir[1], etkin kutle = satir[2]). */
  modeRows: number[][];
}

export interface Ide10R5ModalRegion {
  /** Dosya icinde ilk tablonun [u32 slen] ofseti. */
  regionStart: number;
  /** Son tablonun 18×f64 kayitlarinin bitis ofseti. */
  regionEnd: number;
  tables: Ide10R5ModalTable[];
  /** Tablo i kayit bitisi ile tablo i+1 basi arasindaki opak baytlar (tables.length - 1 adet). */
  interSegments: Uint8Array[];
}

export interface Ide10R5ModalPeriodPair {
  /** periodASeconds f64'nin dosya icindeki mutlak ofseti. */
  offset: number;
  tableIndex: number;
  modeIndexA: number;
  modeIndexB: number;
  periodASeconds: number;
  periodBSeconds: number;
}

export interface Ide10R5ModalPeriodBlock {
  blockStart: number;
  blockEnd: number;
  pairs: Ide10R5ModalPeriodPair[];
}

/** Modal frekans (Hz) → periyot (s). A0'da depolanan ciftlerle bit-exact (16/16). */
export function ide10ModalPeriodSeconds(frequencyHz: number): number {
  return 1 / frequencyHz;
}

function isFiniteRange(n: number, min: number, max: number): boolean {
  return Number.isFinite(n) && n >= min && n <= max;
}

/**
 * Kuyruk bolgesindeki R5 modal tablolarini cozer (frekanslar dahil).
 * Reader deseniyle ayni imza dogrulamasi; yapismayan her sey tablo olarak kabul edilmez.
 */
export function decodeIde10R5ModalRegion(
  bytes: Uint8Array,
  view: DataView,
  from: number,
  to: number,
): Ide10R5ModalRegion | undefined {
  const limit = Math.min(to, bytes.length);
  const tables: Ide10R5ModalTable[] = [];
  const interSegments: Uint8Array[] = [];
  let regionStart: number | null = null;
  let prevEnd: number | null = null;

  outer: for (let i = Math.max(0, from); i + MODAL_FREQS_OFFSET_FROM_NAME_END < limit; i++) {
    const slen = view.getUint32(i, true);
    if (slen < MODAL_NAME_MIN_LEN || slen > MODAL_NAME_MAX_LEN) continue;
    // "Modal" onek hizli kontrolu (reader deseni)
    if (bytes[i + 4] !== 0x4d || bytes[i + 5] !== 0x6f || bytes[i + 6] !== 0x64 || bytes[i + 7] !== 0x61 || bytes[i + 8] !== 0x6c) continue;
    if (i + 4 + slen + MODAL_HEADER_BYTES + 4 > limit) continue;
    if (bytes[i + 3 + slen] !== 0) continue;
    const name = decodeCp1254(bytes.subarray(i + 4, i + 3 + slen));
    if (!MODAL_NAME_RE.test(name)) continue;

    const nameEnd = i + 4 + slen;
    const modeCount = view.getUint32(nameEnd + MODAL_MODE_COUNT_OFFSET_FROM_NAME_END, true);
    if (modeCount < MODAL_MODE_COUNT_MIN || modeCount > MODAL_MODE_COUNT_MAX) continue;
    const massStart = nameEnd + MODAL_FREQS_OFFSET_FROM_NAME_END + modeCount * 8;
    const recEnd = massStart + modeCount * MODAL_MODE_ROW_F64_COUNT * 8;
    if (recEnd > limit) continue;

    const frequenciesHz: number[] = [];
    for (let m = 0; m < modeCount; m++) {
      const f = view.getFloat64(nameEnd + MODAL_FREQS_OFFSET_FROM_NAME_END + m * 8, true);
      if (!isFiniteRange(f, 1e-9, 100_000)) continue outer;
      frequenciesHz.push(f);
    }
    const modeRows: number[][] = [];
    for (let m = 0; m < modeCount; m++) {
      const row: number[] = [];
      for (let k = 0; k < MODAL_MODE_ROW_F64_COUNT; k++) {
        const v = view.getFloat64(massStart + (m * MODAL_MODE_ROW_F64_COUNT + k) * 8, true);
        if (!Number.isFinite(v)) continue outer;
        row.push(v);
      }
      modeRows.push(row);
    }

    if (prevEnd !== null) interSegments.push(bytes.slice(prevEnd, i));
    if (regionStart === null) regionStart = i;
    prevEnd = recEnd;
    tables.push({ name, header: bytes.slice(nameEnd, nameEnd + MODAL_HEADER_BYTES), modeCount, frequenciesHz, modeRows });
    i = recEnd - 1; // tarama bu tablonun sonuna atlar; tablolar arasi baytlar opak tasinir
  }

  if (!tables.length || regionStart === null || prevEnd === null) return undefined;
  return { regionStart, regionEnd: prevEnd, tables, interSegments };
}

function writeF64(out: DataView, at: number, value: number): void {
  if (!Number.isFinite(value)) {
    throw new Error(`finite olmayan f64 yazilamaz (offset ${at}, deger ${value})`);
  }
  out.setFloat64(at, value, true);
}

/**
 * Cozulmus R5 modal bolgesini v10 baytlarina geri uretir.
 * Semantik alanlar (ad, modeCount, frekanslar, 18×f64 kayitlar) degerden yazilir;
 * baslik ve tablolar arasi opak baytlar aynen korunur.
 */
export function buildIde10R5ModalRegion(region: Ide10R5ModalRegion): Uint8Array {
  const { tables, interSegments } = region;
  if (!tables.length) throw new Error("modal bolge uretimi icin en az bir tablo gerekir");
  if (interSegments.length !== tables.length - 1) {
    throw new Error(`interSegments (${interSegments.length}) tablo sayisiyla uyumsuz (${tables.length})`);
  }

  let total = 0;
  for (let t = 0; t < tables.length; t++) {
    const table = tables[t];
    const nameBytes = encodeCp1254(table.name);
    if (nameBytes.includes(0)) throw new Error(`modal ad NUL iceremez: ${JSON.stringify(table.name)}`);
    if (table.header.length !== MODAL_HEADER_BYTES) {
      throw new Error(`${table.name}: baslik ${table.header.length} B; beklenen ${MODAL_HEADER_BYTES}`);
    }
    if (table.frequenciesHz.length !== table.modeCount || table.modeRows.length !== table.modeCount) {
      throw new Error(`${table.name}: frekans/kayit sayisi modeCount ile uyumsuz`);
    }
    for (let m = 0; m < table.modeCount; m++) {
      if (table.modeRows[m].length !== MODAL_MODE_ROW_F64_COUNT) {
        throw new Error(`${table.name} mod ${m}: kayit 18 f64 olmali`);
      }
    }
    total += 4 + nameBytes.length + 1 + MODAL_HEADER_BYTES + 4 + table.modeCount * 8 + table.modeCount * MODAL_MODE_ROW_F64_COUNT * 8;
    if (t < tables.length - 1) total += interSegments[t].length;
  }

  const out = new Uint8Array(total);
  const view = new DataView(out.buffer, out.byteOffset, out.byteLength);
  let at = 0;
  for (let t = 0; t < tables.length; t++) {
    const table = tables[t];
    const nameBytes = encodeCp1254(table.name);
    view.setUint32(at, nameBytes.length + 1, true);
    at += 4;
    out.set(nameBytes, at);
    at += nameBytes.length;
    out[at++] = 0;
    out.set(table.header, at);
    at += MODAL_HEADER_BYTES;
    view.setUint32(at, table.modeCount, true);
    at += 4;
    for (let m = 0; m < table.modeCount; m++) writeF64(view, at, table.frequenciesHz[m]), (at += 8);
    for (let m = 0; m < table.modeCount; m++) {
      for (let k = 0; k < MODAL_MODE_ROW_F64_COUNT; k++) writeF64(view, at, table.modeRows[m][k]), (at += 8);
    }
    if (t < tables.length - 1) {
      out.set(interSegments[t], at);
      at += interSegments[t].length;
    }
  }
  if (at !== total) throw new Error(`uretim uzunlugu uyusmaz: ${at} != ${total}`);
  return out;
}

/**
 * Akis-DISI bolgede modal periyot ciftlerini bulur: her depolanan f64, bir modal
 * tablo frekansinin bit-exact 1/f tersidir (A0 olcumu). Temiz eslesmeyen
 * (ciftlenemeyen/kesintili) eslesmelerde tanimsiz doner — zorla eslestirme yapilmaz.
 */
export function findIde10R5ModalPeriodPairs(
  bytes: Uint8Array,
  view: DataView,
  from: number,
  to: number,
  tables: ReadonlyArray<Ide10R5ModalTable>,
): Ide10R5ModalPeriodBlock | undefined {
  const targets = new Map<number, { tableIndex: number; modeIndex: number }[]>();
  for (let t = 0; t < tables.length; t++) {
    for (let m = 0; m < tables[t].modeCount; m++) {
      const period = ide10ModalPeriodSeconds(tables[t].frequenciesHz[m]);
      if (!Number.isFinite(period) || period <= 0) continue;
      const arr = targets.get(period);
      if (arr) arr.push({ tableIndex: t, modeIndex: m });
      else targets.set(period, [{ tableIndex: t, modeIndex: m }]);
    }
  }

  const matches: { offset: number; tableIndex: number; modeIndex: number; period: number }[] = [];
  const limit = Math.min(to, bytes.length);
  for (let off = Math.max(0, from); off + 8 <= limit; off++) {
    const v = view.getFloat64(off, true);
    if (!Number.isFinite(v)) continue;
    const hits = targets.get(v);
    if (!hits) continue;
    for (const h of hits) matches.push({ offset: off, ...h, period: v });
  }
  matches.sort((a, b) => a.offset - b.offset);

  const pairs: Ide10R5ModalPeriodPair[] = [];
  let cursor = 0;
  while (cursor + 1 < matches.length) {
    const a = matches[cursor];
    const b = matches[cursor + 1];
    if (b.offset !== a.offset + 8 || b.tableIndex !== a.tableIndex) return undefined;
    pairs.push({
      offset: a.offset,
      tableIndex: a.tableIndex,
      modeIndexA: a.modeIndex,
      modeIndexB: b.modeIndex,
      periodASeconds: a.period,
      periodBSeconds: b.period,
    });
    cursor += 2;
  }
  if (cursor !== matches.length || !pairs.length) return undefined;
  for (let k = 1; k < pairs.length; k++) {
    if (pairs[k].offset !== pairs[k - 1].offset + 16) return undefined;
  }
  return { blockStart: pairs[0].offset, blockEnd: pairs[pairs.length - 1].offset + 16, pairs };
}

/**
 * Modal periyot ciftlerini akis-DISI duz f64 olarak yazar (her cift 16 B:
 * [f64 periodA][f64 periodB]). M-base gramer MODAL-PERIYOT-KAYDI tek ciftle
 * kullanilir: {periodASeconds: Mode 3 T, periodBSeconds: Mode 1 T} → @248907/+8.
 */
export function buildIde10R5ModalPeriodPairs(
  pairs: ReadonlyArray<{ periodASeconds: number; periodBSeconds: number }>,
): Uint8Array {
  if (!pairs.length) throw new Error("periyot bolgesi icin en az bir cift gerekir");
  const out = new Uint8Array(pairs.length * 16);
  const view = new DataView(out.buffer, out.byteOffset, out.byteLength);
  let at = 0;
  for (const p of pairs) {
    writeF64(view, at, p.periodASeconds);
    at += 8;
    writeF64(view, at, p.periodBSeconds);
    at += 8;
  }
  return out;
}
