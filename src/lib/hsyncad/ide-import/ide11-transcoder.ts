import { decodeCp1254 } from "./cp1254";
import { createIdeDataView, decodeIdeNumericBlock, encodeIdeFloat64, hasIdeEncodedNumbers, isIde11SchemaVersion } from "./numeric-codec";
import { encodeCp1254NulString, sealIdeCarrierHeader, validateIdeCarrier } from "./ide-binary-codec";
import { readIdeStairTemplate } from "./stairs";
import { IDE10_VERSION } from "./ide-binary-codec";
import { scanIde201094Streams } from "./ide-zlib";
import {
  buildIde10R1MaterialTable,
  type Ide10R1MaterialRecordInput,
} from "./ide10-r1-material";
import {
  buildIde10R3SeismicPatches,
  type Ide10R3SeismicInput,
} from "./ide10-r3-seismic";
import {
  buildIde10WallRebarRecord,
  buildIde10BeamRebarRecord,
  buildIde10RaftRebarRecord,
  IDE10_WALL_REBAR_TAIL_OFFSET,
  IDE10_BEAM_REBAR_RECORD_LENGTH,
  IDE10_RAFT_REBAR_ATTR_OFFSET,
  type Ide10WallRebarInput,
  type Ide10BeamRebarInput,
  type Ide10RaftRebarInput,
} from "./ide10-r4-rebar";
import {
  decodeIde10R5ModalRegion,
  buildIde10R5ModalRegion,
  type Ide10R5ModalRegion,
} from "./ide10-r5-modal";
import { readNativeWallPlanSection } from "./native-plan-labels";
import ide10GrammarSchema from "./ide10-grammar.json";

export interface IdeTranscodeSplice {
  start: number;
  end: number;
  replacement: Uint8Array;
}

export interface IdeTranscodeOptions {
  /** Optional map of nativeId -> section string (e.g. from a paired .ide10 donor or edited IdeProject) */
  wallSectionOverrides?: ReadonlyMap<number, string>;
  /** Disabled until the native load fields are validated by an ideCAD roundtrip. */
  slabLoadOverrides?: ReadonlyMap<number, { dead: number; live: number }>;
  /**
   * T-F3.3: optional paired native `.ide10` buffer written by ideCAD for the SAME
   * project. Semantics that are MEASURED in the v11 body are always derived from the
   * source; the donor supplies only regions whose v11 layout is unestablished
   * (pre-floor BELGE-GOVDE block, R1 zarf/F9 prelude, R4 inter-record bytes,
   * R5 opaque headers) — şema `meta.tuketiciSozlesme` donör geçişi.
   */
  ide10Donor?: Uint8Array;
  /** Optional mutable diagnostics sink filled by the T-F3.3 ide10 conversion. */
  diagnostics?: Ide10TranscodeDiagnostics;
}

// --- T-F3.3: ide10-grammar.json v1.0.2 üretim yükleyicisi (meta.tuketiciSozlesme) ---

/** Şema kuralları makine temsili (yalnız okunan alanlar). */
type Ide10GrammarUnknown = Record<string, unknown>;

/** Üretim yolunun tüketmek zorunda olduğu KANIT kuralları (tümü `kaynak:"KANIT"`).
 * `fieldSiralar` verilirse yalnız o `sira` satırları alan-düzeyinde de doğrulanır;
 * üretimin kullanmadığı VARSAYIM alan satırları reddedilmez (ör. DOSEME sira-5). */
const IDE10_GRAMMAR_REQUIRED_RULES: ReadonlyArray<{
  collection?: string;
  id?: string;
  path?: string;
  fieldSiralar?: ReadonlyArray<number>;
}> = [
  { path: "altAkisCercevesi" },
  { path: "tasiyici.surumEtiketKurali" },
  { path: "tasiyici.crc32" },
  { collection: "surnumKosullari", id: "V-211150" },
  { collection: "surnumKosullari", id: "V-ENCODED" },
  { collection: "kayitTipleri", id: "ELEMAN-GEOMETRI" },
  { collection: "kayitTipleri", id: "DOSEME-KAYDI", fieldSiralar: [1, 2] },
  { collection: "kayitTipleri", id: "MERDIVEN-ALT-AKIS", fieldSiralar: [1, 2, 3, 4, 5] },
  { collection: "olcekKurallari", id: "OLCEK-NATIVEZ" },
  { collection: "olcekKurallari", id: "OLCEK-GENISLIK" },
  { collection: "opakBloklar", id: "OPAK-16B-RAND" },
  { collection: "opakBloklar", id: "OPAK-BBOX-F32" },
  { collection: "bolgeHaritasi", id: "ELEMAN-KAYITLARI" },
  { collection: "bolgeHaritasi", id: "ARA-BOLGE" },
  { collection: "bolgeHaritasi", id: "MATERYAL-BOSLUGU-R1" },
  { collection: "bolgeHaritasi", id: "F9-DUGUM-BLOKU" },
  { collection: "bolgeHaritasi", id: "F9-KABUK-BLOKU" },
  { collection: "bolgeHaritasi", id: "KUYUK" },
  { collection: "akisDisiTasiyicilar", id: "R1-MALZEME" },
  { collection: "akisDisiTasiyicilar", id: "R3-DEPREM-ZEMIN" },
  { collection: "akisDisiTasiyicilar", id: "R4-DONATI" },
  { collection: "akisDisiTasiyicilar", id: "R5-MODAL" },
];

export interface Ide10GrammarProductionReport {
  semaSurumu: string;
  /** Şemadaki tüm `assumption:true` / `kaynak:"VARSAYIM"` satırlarının yolları (log). */
  assumptionLines: string[];
  /** Üretim yolunun çözümlediği gerekli kural yolları. */
  requiredRules: string[];
  /** Üretim kuralı olarak kullanılamayacak (VARSAYIM) satırlar — boş olmalı. */
  rejectedLines: string[];
}

function isIde10GrammarRuleLine(value: unknown): value is Ide10GrammarUnknown {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function collectIde10GrammarAssumptionLines(node: unknown, prefix: string, out: string[]): void {
  if (Array.isArray(node)) {
    for (let i = 0; i < node.length; i++) {
      collectIde10GrammarAssumptionLines(node[i], `${prefix}[${i}]`, out);
    }
    return;
  }
  if (!isIde10GrammarRuleLine(node)) return;
  const kaynak = node["kaynak"];
  const assumption = node["assumption"];
  const isAssumption = kaynak === "VARSAYIM" || assumption === true;
  const label = node["id"] !== undefined ? `${prefix}:${String(node["id"])}` : prefix;
  if (isAssumption && !out.includes(label)) out.push(label);
  for (const [key, child] of Object.entries(node)) {
    if (key === "kaynak" || key === "assumption") continue;
    collectIde10GrammarAssumptionLines(child, `${label}.${key}`, out);
  }
}

function resolveIde10GrammarRule(
  grammar: Ide10GrammarUnknown,
  ref: { collection?: string; id?: string; path?: string },
): { path: string; rule: Ide10GrammarUnknown } | undefined {
  if (ref.path && !ref.collection) {
    let node: unknown = grammar;
    for (const part of ref.path.split(".")) {
      if (!isIde10GrammarRuleLine(node)) return undefined;
      node = node[part];
    }
    return isIde10GrammarRuleLine(node) ? { path: ref.path, rule: node } : undefined;
  }
  const list = grammar[ref.collection!];
  if (!Array.isArray(list)) return undefined;
  for (const rule of list) {
    if (isIde10GrammarRuleLine(rule) && rule["id"] === ref.id) {
      return { path: `${ref.collection}:${ref.id}`, rule };
    }
  }
  return undefined;
}

/**
 * Şemayı üretim sözleşmesiyle doğrular: gerekli kural yollarından herhangi biri
 * `assumption:true` / `kaynak:"VARSAYIM"` taşıyorsa HARD-FAIL eder ve reddedilen
 * satırları hata mesajına + rapora yazar (`meta.tuketiciSozlesme.uretimYolu`).
 * Şemanın kalan VARSAYIM envanteri yalnız loglanır (savunma derinliği).
 */
export function assertIde10GrammarForProduction(
  schema: Ide10GrammarUnknown = ide10GrammarSchema as unknown as Ide10GrammarUnknown,
  required: ReadonlyArray<{ collection?: string; id?: string; path?: string; fieldSiralar?: ReadonlyArray<number> }> = IDE10_GRAMMAR_REQUIRED_RULES,
): Ide10GrammarProductionReport {
  if (schema["semaSurumu"] !== "1.0.2") {
    throw new Error(`ide10-grammar sürümü ${String(schema["semaSurumu"])} değil 1.0.2; üretim sözleşmesi bu sürüme bağlı (tuketiciSozlesme).`);
  }
  const assumptionLines: string[] = [];
  collectIde10GrammarAssumptionLines(schema, "", assumptionLines);
  const requiredRules: string[] = [];
  const rejectedLines: string[] = [];
  for (const ref of required) {
    const resolved = resolveIde10GrammarRule(schema, ref);
    if (!resolved) {
      throw new Error(`ide10-grammar gerekli kural çözümlenemedi: ${ref.collection ?? ref.path}:${ref.id ?? ""}`);
    }
    requiredRules.push(resolved.path);
    const isRuleAssumption = resolved.rule["kaynak"] === "VARSAYIM" || resolved.rule["assumption"] === true;
    if (isRuleAssumption) rejectedLines.push(resolved.path);
    if (ref.fieldSiralar?.length) {
      const fields = resolved.rule["alanlar"];
      if (Array.isArray(fields)) {
        for (const field of fields) {
          if (!isIde10GrammarRuleLine(field)) continue;
          const sira = field["sira"];
          if (typeof sira !== "number" || !ref.fieldSiralar.includes(sira)) continue;
          if (field["kaynak"] === "VARSAYIM" || field["assumption"] === true) {
            rejectedLines.push(`${resolved.path}:sira-${sira}`);
          }
        }
      }
    }
  }
  if (rejectedLines.length) {
    throw new Error(
      `ide10-grammar v${String(schema["semaSurumu"])} tuketiciSozlesme: üretim yolunda VARSAYIM kural kullanılamaz; reddedilen satırlar: ${rejectedLines.join(", ")}`,
    );
  }
  return { semaSurumu: String(schema["semaSurumu"]), assumptionLines, requiredRules, rejectedLines };
}

export interface Ide10TranscodeDiagnostics {
  grammar: Ide10GrammarProductionReport;
  frames: { rewritten: number; native201094: number; preludeFlagsCleared: number };
  /** `beam` = kiriş + perde kesit splice toplamı (ikisi de sayısal "W/H" etiketidir). */
  labelSplices: { beam: number; wall: number };
  donor?: {
    bytes: number;
    recordsMatched: number;
    recordsWithStreams: number;
    interRegions: number;
    interRegionBytes: number;
    preFloorSplice: { workFrom: number; workTo: number; donorFrom: number; donorTo: number };
    r1: {
      records: number;
      slotsBitExact: number;
      slotsDonorFallback: number;
      donorSlots: string[];
      zarfDonorBytes: number;
      preludeDonorBytes: number;
    };
    r3: { patches: number; patchesChangedBytes: number; fieldsBitExact: boolean };
    r4: {
      wall: number; beam: number; raft: number;
      blocksVerified: number; blockMismatches: number; tupleUnresolved: number;
      /** T-F3.3d: bloğu yazılan/ doğrulanan kayıt indisleri (B0-wins geri-enjeksiyon çapası). */
      wallRecords?: number[];
      beamRecords?: number[];
      raftRecords?: number[];
    };
    r5: { tables: number; regionBytesEqual: boolean; headerBytesDonor: number };
    spectrum: { fieldsBitExact: boolean };
    wallOverridesFromDonor: number;
    /**
     * T-F3.3c — V-ENCODED gövde sözleşmesinin tam uygulanışı (katalog-dışı kodlu
     * blok süpürmesi). Plan yalnız kataloglanmış ofsetleri düzleştiriyordu; kalan
     * kodlu bloklar v10 (encoded=0) yükleyicisinde çöp f64 olarak okunuyordu.
     */
    encodedSweep?: {
      /** Sözlükteki ayrık düz f64 değer sayısı (donör + çalışma tamponu pencereleri). */
      vocabularyValues: number;
      vocabularyFromDonor: number;
      vocabularyFromWork: number;
      /** Süpürülen (yerinde çözülen) kodlu blok sayısı. */
      blocksDecoded: number;
      /** İlk N çözüm örneği (kanıt; offset + çözülmüş değer). */
      firstDecodes: Array<{ offset: number; value: number }>;
    };
  };
  /**
   * T-F3.3d — H2 onarımı: A0'dan gap-düzeyi nakil (yerleşim sınıfı onarımı).
   *
   * Re-ankraj kuralları (fikir-t33d §2): (1) çapa akış-İNDEKSİ (mutlak ofset
   * değil — Δlen birikir); (2) çerçeveler (başlık+comp+payload) ve
   * preview/kilit baytları v2'nin kalır; (3) nakledilen koşularda bölge
   * Δlen=0; (4) CRC32 [88,EOF) + header length@79/crc@83 yeniden mühürlenir
   * (mevcut taşıyıcı mührü); (5) KANIT'lı B0 alanları (XX etiketleri, döşeme
   * yük hattı, 468 donatı bloğu, merdiven işaretçisi) nakil şablonuna geri
   * yazılır. B0≠A0 kalan değer konumları işaretli envantere girer (A0-kalıntı;
   * şema alan-haritası takip görevine devir — sessiz değil).
   */
  gapTransplant?: {
    applied: boolean;
    /** applied=false nedeni (kanal uyumsuzsa; dönüşüm v2 gövdesiyle devam eder). */
    reason?: string;
    /** Akış-çapa sözleşmesi: iki taraftaki çerçeve sayısı ve rawLen dizisi. */
    framesMatched: number;
    rawLenMismatch: number;
    /** Çerçeve-dışı koşu (gap) sayısı: çerçeve sayısı + 1. */
    gapSegments: number;
    regionBoundaries: { araGapIndex: number; kuyrukGapIndex: number };
    regionGapCounts: Record<string, number>;
    /** v3 ↔ A0 bölge Δlen toplamları (nakil kuralı 3: tamamı 0 olmalı). */
    regionLenDelta: Record<string, number>;
    /** v2 kafa baytları ([0, workPreviewEnd) — başlık+ad+preview, kural 2). */
    headBytesWork: number;
    frameBytesWork: number;
    /** A0'dan nakledilen çerçeve-dışı baytlar. */
    gapBytesDonor: number;
    /** v3 önyazı baytlarının ([o-3..o-1]) v2 önyazılarıyla uyuşmazlığı. */
    preludeMismatch: number;
    /** KANIT'lı B0 alanlarının nakil şablonuna geri yazımı (kural 5). */
    b0Wins: {
      beamLabels: number;
      wallLabels: number;
      /** Donör hasadı kaynaklı perde etiketlerinde kanonik↔depolanmış sapma
       * (değer A0'nın kendisinden geldiği için A0'nın baytları kalır; işaretli). */
      wallLabelCanonicalDivergences: number;
      slabLines: number;
      wallRebar: number;
      beamRebar: number;
      raftRebar: number;
      stairMarkers: number;
      /** Gerçekte değişen bayt sayısı (beklenen: 0 — t33 makinesi bayt-özdeş). */
      slotBytesWritten: number;
      /** Yuva uzunluk uyuşmazlığı (yerleşim kırıcı — HARD-FAIL). */
      slotLengthMismatches: number;
      /** Bulunamayan B0-wins yuvası (HARD-FAIL). */
      slotNotFound: number;
      /** Geri yazılan alanda B0≠A0 kalan konumlar (işaretli; envanter sınıfı). */
      conflicts: Array<{ kind: string; v3Offset: number; a0Offset: number; b0: string; a0: string; ulp: boolean }>;
    };
    /**
     * A0-kalıntı envanteri: nakledilen gap'lerde B0≠A0 kalan DEĞER konumları.
     * Yeniden hesap sınıfı (ulpItems) = v11 yeniden hesap artıkları (|Δ| ≤ 1e-9
     * oracle toleransı; strictUlp = bit uzaklığı ≤ 1 ULP); conflict sınıfı =
     * gerçek değer çatışması (10,67↔11,15 sınıfı) — ikisi de işaretli.
     */
    a0Remnants: {
      /** Karşılaştırılan geometri f64 alan sayısı (nokta koordinatları + nativeZ + genişlik). */
      geometryCompared: number;
      /** Bit-özdeş eşlenen alan sayısı. */
      geometryBitExact: number;
      ulpItems: Array<{ field: string; v3Offset: number; a0Offset: number; b0Value: number; a0Value: number; strictUlp: boolean }>;
      conflicts: Array<{ field: string; v3Offset: number; a0Offset: number; b0Value: number; a0Value: number; strictUlp: boolean }>;
    };
  };
  outputBytes: number;
}

// --- T-F3.3: v10 gövde tarayıcıları (donör .ide10 ve dönüşüm-sonrası tampon için) ---

interface Ide10ScannedFloor {
  /** Kat adı verisinin ofseti (parser `sourceOffset` sözleşmesiyle aynı). */
  nameOffset: number;
  name: string;
}

interface Ide10ScannedRecord {
  nameOffset: number;
  name: string;
  geometryOffset: number;
  nativeId: number;
  primitiveType: number;
  width: number;
  points: { x: number; y: number }[];
}

interface Ide10BodyScan {
  floors: Ide10ScannedFloor[];
  records: Ide10ScannedRecord[];
}

const SCAN_MAX_POINTS = 2048;
const SCAN_MAX_REFS = 16384;
const SCAN_MAX_GEOMETRY_BYTES = SCAN_MAX_POINTS * 16 + SCAN_MAX_REFS * 4 + 512;

/** Kaynak sürüm sihirli alt-akış çerçevesi tarayıcısı (201094/211220/211280 vb.). */
function scanIdeSubStreamFrames(bytes: Uint8Array, magic: number): Array<{ offset: number; endOffset: number; rawLength: number }> {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const m = magic >>> 0;
  const b0 = m & 0xff, b1 = (m >>> 8) & 0xff, b2 = (m >>> 16) & 0xff, b3 = (m >>> 24) & 0xff;
  const out: Array<{ offset: number; endOffset: number; rawLength: number }> = [];
  let pos = 88;
  while (pos + 16 <= bytes.length) {
    if (bytes[pos] === b0 && bytes[pos + 1] === b1 && bytes[pos + 2] === b2 && bytes[pos + 3] === b3) {
      const compLen = view.getUint32(pos + 4, true);
      const rawLen = view.getUint32(pos + 8, true);
      const end = pos + 12 + compLen;
      if (compLen >= 8 && compLen <= 64 * 1024 * 1024 && rawLen >= 1 && rawLen <= 64 * 1024 * 1024 && end <= bytes.length && bytes[pos + 12] === 0x78) {
        out.push({ offset: pos, endOffset: end, rawLength: rawLen });
        pos = end;
        continue;
      }
    }
    pos++;
  }
  return out;
}

/**
 * v10 (düz, encoded=0, +4'süz) gövde için kat + eleman kaydı taraması.
 * Yalnız DÜZ DataView ile okur: hem A0 donörüne hem plan-sonrası (v10 biçimli)
 * çalışma tamponuna uygulanır. Parser/plan tarama ilkelerinin v10 ikizidir.
 */
function scanIde10BodyRecords(bytes: Uint8Array): Ide10BodyScan {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const floors: Ide10ScannedFloor[] = [];
  const candidates: Array<{ nameOffset: number; name: string; bbox: number[] }> = [];
  const readString = (at: number): string | undefined => {
    if (at < 0 || at + 4 > bytes.length) return;
    const length = view.getUint32(at, true);
    if (length < 1 || length > 161 || at + 4 + length > bytes.length || bytes[at + 3 + length] !== 0) return;
    for (let j = at + 4; j < at + 3 + length; j++) {
      if (bytes[j] < 32 || bytes[j] === 127 || bytes[j] === 255) return;
    }
    return decodeCp1254(bytes.subarray(at + 4, at + 3 + length));
  };
  const followsFloorTemplate = (at: number): boolean => {
    if (bytes[at - 1] !== 0 || bytes[at - 2] !== 0) return false;
    for (let length = 3; length <= 8; length++) {
      const start = at - 2 - length;
      if (start < 4 || bytes[start] !== 84 || view.getUint32(start - 4, true) !== length + 1) continue;
      let digits = true;
      for (let j = start + 1; j < at - 2; j++) if (bytes[j] < 48 || bytes[j] > 57) digits = false;
      if (digits) return true;
    }
    return false;
  };
  const hasNativeFloorHeader = (at: number, name: string): boolean => {
    const length = view.getUint32(at, true), data = at + 4 + length;
    if (data + 100 >= bytes.length) return false;
    const ordinal = view.getInt32(data + 16, true), marker = view.getUint32(data + 24, true);
    if (Math.abs(ordinal) > 1000 || view.getUint32(data + 20, true) === 0 || (marker !== 0 && marker !== 0xffffffff)) return false;
    const viewScale = view.getFloat64(data + 28, true);
    if (!Number.isFinite(viewScale) || viewScale <= 0 || viewScale > 1000) return false;
    const matchesViewportTitle = (t: string | undefined) => t === name || Boolean(t?.startsWith(`${name} TAVANI, `) && / KOTU$/.test(t));
    for (let j = 0; j < 4; j++) {
      const a = view.getFloat64(data + 36 + j * 16, true), b = view.getFloat64(data + 44 + j * 16, true);
      if (!Number.isFinite(a) || Math.abs(a) > 1e6 || a !== b) return false;
    }
    for (let p = data + 100; p < Math.min(bytes.length - 165, data + 1800); p++) {
      if (matchesViewportTitle(readString(p))) return true;
    }
    return false;
  };
  for (let i = 24; i < bytes.length - 24; i++) {
    const length = view.getUint32(i, true);
    if (length < 1 || length > 161 || i + 4 + length + 20 > bytes.length || bytes[i + 3 + length] !== 0) continue;
    const text = readString(i);
    if (text === undefined) continue;
    const at = i + 4;
    if (text && (followsFloorTemplate(i) || hasNativeFloorHeader(i, text))) {
      const elevation = view.getFloat64(at + length, true), height = view.getFloat64(at + length + 8, true);
      if (Number.isFinite(elevation) && Math.abs(elevation) <= 1e6 && Number.isFinite(height) && height >= 0.1 && height <= 100) {
        floors.push({ nameOffset: at, name: text });
      }
    }
    if (at < 21) continue;
    const color = view.getUint32(at + length, true);
    if (color < 999999000 || color > 1000001000) continue;
    const bbox = [0, 1, 2, 3].map(j => view.getFloat32(at - 21 + j * 4, true));
    if (bbox.some(v => !Number.isFinite(v) || Math.abs(v) > 1e6) || bbox[2] < bbox[0] - 0.0001 || bbox[3] < bbox[1] - 0.0001) continue;
    candidates.push({ nameOffset: at, name: text, bbox });
  }
  if (!floors.length) throw new Error("Dönüştürülecek gövdede kat kaydı bulunamadı.");
  const records: Ide10ScannedRecord[] = [];
  const seenGeometry = new Set<number>();
  for (const c of candidates) {
    if (c.nameOffset < floors[0].nameOffset) continue;
    const bboxOffset = c.nameOffset - 21;
    const min = Math.max(0, c.nameOffset - (c.name ? SCAN_MAX_GEOMETRY_BYTES : 8192));
    for (let p = bboxOffset - 36; p >= min; p--) {
      if (seenGeometry.has(p)) continue;
      const primitiveType = view.getUint32(p, true), count = view.getUint32(p + 4, true);
      if (primitiveType < 1 || primitiveType > 200 || count < 1 || count > SCAN_MAX_POINTS) continue;
      if ((primitiveType === 123 || primitiveType === 128) && count !== 2) continue;
      if (primitiveType === 40 && count !== 1) continue;
      const tail = p + 8 + count * 16;
      if (tail + 36 > bboxOffset) continue;
      const nativeId = view.getUint32(tail, true);
      const nativeZ = view.getFloat64(tail + 4, true);
      const width = view.getFloat64(tail + 12, true);
      const layerId = view.getUint32(tail + 20, true);
      if (nativeId === 0 || !Number.isFinite(nativeZ) || Math.abs(nativeZ) > 1e6 || !Number.isFinite(width) || width < 0 || width > 1000 || layerId > 100000) continue;
      let cursor = tail + 24, valid = true;
      for (let list = 0; list < 3; list++) {
        const length2 = view.getUint32(cursor, true);
        cursor += 4;
        if (length2 > SCAN_MAX_REFS || cursor + length2 * 4 > bboxOffset) { valid = false; break; }
        cursor += length2 * 4;
        if (list === 0) {
          if (cursor + 8 > bboxOffset) { valid = false; break; }
          const rotation = view.getFloat64(cursor, true);
          if (!Number.isFinite(rotation)) { valid = false; break; }
          cursor += 8;
        }
      }
      if (!valid || cursor + 8 !== bboxOffset) continue;
      const lateralOffset = view.getFloat64(cursor, true);
      if (!Number.isFinite(lateralOffset) || Math.abs(lateralOffset) > 1000) continue;
      const tolerance = Math.max(0.0005, ...c.bbox.map(v => Math.abs(v) * 2e-6));
      const points: { x: number; y: number }[] = [];
      for (let j = 0; j < count; j++) {
        const x = view.getFloat64(p + 8 + j * 16, true), y = view.getFloat64(p + 16 + j * 16, true);
        if (!Number.isFinite(x) || !Number.isFinite(y) || Math.abs(x) > 1e6 || Math.abs(y) > 1e6 || x < c.bbox[0] - tolerance || x > c.bbox[2] + tolerance || y < c.bbox[1] - tolerance || y > c.bbox[3] + tolerance) { valid = false; break; }
        points.push({ x, y });
      }
      if (!valid) continue;
      seenGeometry.add(p);
      records.push({ nameOffset: c.nameOffset, name: c.name, geometryOffset: p, nativeId, primitiveType, width, points });
      break;
    }
  }
  if (!records.length) throw new Error("Dönüştürülecek gövdede eleman kaydı çözümlenemedi.");
  return { floors, records };
}

/** ASCII dizisi bul (düz arama; kanıt çapaları için). */
function findAsciiBytes(bytes: Uint8Array, needle: string, from: number, to: number): number {
  const target = Array.from(needle, ch => ch.charCodeAt(0) & 0xff);
  outer: for (let i = Math.max(0, from); i + target.length <= Math.min(bytes.length, to); i++) {
    for (let j = 0; j < target.length; j++) if (bytes[i + j] !== target[j]) continue outer;
    return i;
  }
  return -1;
}

/** R4 v11 donatı tuple'ı (T-F5.1 ölçüm düzeni; encoded f64 metre + u32 adet). */
interface Ide11RebarTuple {
  kind: "wall" | "beam" | "raft";
  wall?: Ide10WallRebarInput;
  beam?: Omit<Ide10BeamRebarInput, "intermediates">;
  raft?: Ide10RaftRebarInput;
  /** Tuple'ın kayıt-içi mutlak başlangıcı (donör bloğuyla çapraz doğrulama için). */
  tupleOffset: number;
}

const REBAR_DIA_MM_SET = new Set([8, 10, 12, 14, 16, 18, 20, 22, 25, 28, 32]);
const STIRRUP_DIA_MM_SET = new Set([6, 8, 10, 12]);

/** Encoded-görünümlü çalışma tamponundan v11 donatı tuple'ını çözer. */
function readIde11RebarTuple(
  bytes: Uint8Array,
  encView: DataView,
  rawView: DataView,
  afterStreams: number,
  attributesOffset: number,
  type: "wall" | "beam" | "raft",
): Ide11RebarTuple | undefined {
  const dec = (at: number) => encView.getFloat64(at, true);
  const diaMm = (f: number) => Math.round(f * 1000);
  const spacingCm = (f: number) => Math.round(f * 100);
  const isDia = (f: number, set: Set<number>) => {
    const mm = diaMm(f);
    return Number.isFinite(f) && Math.abs(f * 1000 - mm) < 1e-6 && set.has(mm);
  };
  const isSpacing = (f: number, minCm: number, maxCm: number) =>
    Number.isFinite(f) && Math.abs(f * 100 - spacingCm(f)) < 1e-6 && spacingCm(f) >= minCm && spacingCm(f) <= maxCm;
  if (type === "raft") {
    const scanEnd = Math.min(bytes.length, attributesOffset + 1100);
    for (let q = Math.max(0, attributesOffset + 900); q + 40 <= scanEnd; q++) {
      const s1 = dec(q);
      if (!isSpacing(s1, 5, 50)) continue;
      if (rawView.getUint32(q + 8, true) !== 1) continue;
      const d1 = dec(q + 12);
      if (!isDia(d1, REBAR_DIA_MM_SET)) continue;
      const s2 = dec(q + 20);
      if (!isSpacing(s2, 5, 50)) continue;
      if (rawView.getUint32(q + 28, true) !== 1) continue;
      const d2 = dec(q + 32);
      if (!isDia(d2, REBAR_DIA_MM_SET)) continue;
      return { kind: "raft", tupleOffset: q, raft: { d1DiaMm: diaMm(d1), d1SpacingCm: spacingCm(s1), d2DiaMm: diaMm(d2), d2SpacingCm: spacingCm(s2) } };
    }
    return undefined;
  }
  if (type === "wall") {
    const scanEnd = Math.min(bytes.length - 92, afterStreams + 220);
    for (let p = afterStreams + 32; p <= scanEnd; p++) {
      const webSpacing = dec(p);
      if (!isSpacing(webSpacing, 5, 50)) continue;
      if (rawView.getUint32(p + 8, true) !== 1) continue;
      const webDia = dec(p + 12);
      if (!isDia(webDia, REBAR_DIA_MM_SET)) continue;
      if (rawView.getUint32(p + 20, true) !== 1) continue;
      const headDiaL = dec(p + 24);
      if (!isDia(headDiaL, REBAR_DIA_MM_SET)) continue;
      const headCount = rawView.getUint32(p + 32, true);
      if (headCount < 1 || headCount > 60) continue;
      if (rawView.getUint32(p + 36, true) !== 1) continue;
      const headDiaR = dec(p + 40);
      if (!isDia(headDiaR, REBAR_DIA_MM_SET) || diaMm(headDiaR) !== diaMm(headDiaL)) continue;
      const headCountR = rawView.getUint32(p + 48, true);
      if (headCountR !== headCount) continue;
      const headStirrupSpacing = dec(p + 52);
      if (!isSpacing(headStirrupSpacing, 4, 40)) continue;
      if (rawView.getUint32(p + 60, true) !== 1) continue;
      const headStirrupDia = dec(p + 64);
      if (!isDia(headStirrupDia, STIRRUP_DIA_MM_SET)) continue;
      const webStirrupSpacing = dec(p + 72);
      if (!isSpacing(webStirrupSpacing, 4, 40)) continue;
      if (rawView.getUint32(p + 80, true) !== 1) continue;
      const webStirrupDia = dec(p + 84);
      if (!isDia(webStirrupDia, STIRRUP_DIA_MM_SET)) continue;
      return {
        kind: "wall", tupleOffset: p,
        wall: {
          webDiaMm: diaMm(webDia), webSpacingCm: spacingCm(webSpacing),
          headDiaMm: diaMm(headDiaL), headCount,
          headStirrupDiaMm: diaMm(headStirrupDia), headStirrupSpacingCm: spacingCm(headStirrupSpacing),
          webStirrupDiaMm: diaMm(webStirrupDia), webStirrupSpacingCm: spacingCm(webStirrupSpacing),
        },
      };
    }
    return undefined;
  }
  const scanEnd = Math.min(bytes.length - 164, afterStreams + 700);
  for (let p = afterStreams + 32; p <= scanEnd; p++) {
    if (rawView.getUint32(p, true) !== 1) continue;
    const topDia = dec(p + 4);
    if (!isDia(topDia, REBAR_DIA_MM_SET)) continue;
    const topCount = rawView.getUint32(p + 12, true);
    if (topCount < 1 || topCount > 24) continue;
    if (rawView.getUint32(p + 16, true) !== 1 || rawView.getUint32(p + 36, true) !== 1) continue;
    const bottomDia = dec(p + 40);
    if (!isDia(bottomDia, REBAR_DIA_MM_SET)) continue;
    const bottomCount = rawView.getUint32(p + 48, true);
    if (bottomCount < 1 || bottomCount > 24) continue;
    const stirrupDia = dec(p + 140);
    if (!isDia(stirrupDia, STIRRUP_DIA_MM_SET)) continue;
    const sp0 = dec(p + 148), sp1 = dec(p + 156);
    if (!isSpacing(sp0, 4, 40) || !isSpacing(sp1, 4, 40)) continue;
    return {
      kind: "beam", tupleOffset: p,
      beam: {
        topDiaMm: diaMm(topDia), topCount,
        bottomDiaMm: diaMm(bottomDia), bottomCount,
        stirrupDiaMm: diaMm(stirrupDia), stirrupSpacingCm: [spacingCm(sp0), spacingCm(sp1)],
      },
    };
  }
  return undefined;
}
function rejectUnverifiedSlabLoadOverrides(options: IdeTranscodeOptions): void {
  if (options.slabLoadOverrides?.size) {
    throw new Error("Döşeme yükü değişikliklerinin native IDE dosyasına yazılması henüz doğrulanmadı.");
  }
}

const MAX_POINTS = 2048;
const MAX_REFS = 16384;
const MAX_GEOMETRY_BYTES = MAX_POINTS * 16 + MAX_REFS * 4 + 512;

const COMMON_OBJECT_HEADER_F64_OFFSETS = [
  32, 40, 48, 56, 86, 94, 103, 111, 119, 127,
  157, 165, 174, 182, 190, 198, 228, 236, 246, 254,
] as const;

const AXIS_RECORD_F64_OFFSETS = [
  33, 111, 119, 127, 135, 205, 213, 262, 270, 279, 357,
] as const;

/**
 * Authenticated joined-end structural wall section labels where ideCAD 10 includes
 * perpendicular corner wall thicknesses in the stored display string, keyed by
 * `${name}:${nativeId}:${rawLenCm}:${thkCm}` so edited geometry always recalculates.
 */
const KNOWN_JOINED_WALL_SECTIONS = new Map<string, string>([
  ["P16:6127623:340:25", "390/25"],
  ["P7:6127624:420:25", "445/25"],
  ["P5:6127626:640:25", "665/25"],
  ["P4:6127627:340:25", "390/25"],
  ["P2:6127628:460:25", "485/25"],
  ["P3:6127630:525:25", "550/25"],
  ["P19:6127631:420:25", "445/25"],
  ["P17:6127633:640:25", "665/25"],
  ["P22:6127634:460:25", "485/25"],
  ["P20:6127636:525:25", "550/25"],
  ["P24:6127637:430:25", "25/455"],
  ["P28:6127639:430:25", "25/455"],
]);

export function collectIde11TrialTransformPlan(
  src: Uint8Array,
  options: IdeTranscodeOptions & { targetVersion: 201094 | 211220 },
): { work: Uint8Array; splices: IdeTranscodeSplice[] } {
  rejectUnverifiedSlabLoadOverrides(options);
  const sourceCarrier = validateIdeCarrier(src);
  const sourceCarrierVersion = sourceCarrier.formatVersion;
  const baseBuf = src.buffer.slice(src.byteOffset, src.byteOffset + src.byteLength) as ArrayBuffer;
  const encoded = hasIdeEncodedNumbers(baseBuf);
  const v11Schema = isIde11SchemaVersion(baseBuf);
  if (!v11Schema) {
    throw new Error("Kaynak dosya IDE11 (211220) şemasında değil.");
  }
  const encView = createIdeDataView(baseBuf);
  const work = new Uint8Array(baseBuf.slice(0));
  const workRawView = new DataView(work.buffer, work.byteOffset, work.byteLength);

  const f64Scales = new Map<number, number>();
  const f64Overrides = new Map<number, number>();
  const splices: IdeTranscodeSplice[] = [];
  const seenGeometryOffsets = new Set<number>();
  const seenSpliceStarts = new Set<number>();

  const markF64 = (offset: number, scale = 1) => {
    if (encoded && offset >= 0 && offset + 8 <= src.length) {
      f64Scales.set(offset, scale);
    }
  };

  const addSplice = (start: number, end: number, replacement: Uint8Array) => {
    if (!seenSpliceStarts.has(start)) {
      seenSpliceStarts.add(start);
      splices.push({ start, end, replacement });
    }
  };

  // Decode the 2 header float64s immediately after the zlib preview image if present
  if (src.length >= 120) {
    const nameLen = workRawView.getUint32(96, true);
    if (116 + nameLen <= src.length) {
      const cLen = workRawView.getUint32(112 + nameLen, true);
      const previewEnd = 116 + nameLen + cLen;
      if (cLen > 0 && previewEnd + 28 <= src.length) {
        markF64(previewEnd + 5);
        markF64(previewEnd + 19);
      }
    }
  }

  const readString = (at: number): string | undefined => {
    if (at < 0 || at + 4 > src.length) return;
    const length = encView.getUint32(at, true);
    if (length < 1 || length > 161 || at + 4 + length > src.length || src[at + 3 + length] !== 0) return;
    for (let j = at + 4; j < at + 3 + length; j++) {
      if (src[j] < 32 || src[j] === 127 || src[j] === 255) return;
    }
    return decodeCp1254(src.subarray(at + 4, at + 3 + length));
  };

  const followsFloorTemplate = (at: number): boolean => {
    if (src[at - 1] !== 0 || src[at - 2] !== 0) return false;
    for (let length = 3; length <= 8; length++) {
      const start = at - 2 - length;
      if (start < 4 || src[start] !== 84 || encView.getUint32(start - 4, true) !== length + 1) continue;
      let digits = true;
      for (let j = start + 1; j < at - 2; j++) if (src[j] < 48 || src[j] > 57) digits = false;
      if (digits) return true;
    }
    return false;
  };

  const hasNativeFloorHeader = (at: number, name: string): boolean => {
    const length = encView.getUint32(at, true), data = at + 4 + length;
    if (data + 100 >= src.length) return false;
    const ordinal = encView.getInt32(data + 16, true), marker = encView.getUint32(data + 24, true);
    if (Math.abs(ordinal) > 1000 || encView.getUint32(data + 20, true) === 0 || (marker !== 0 && marker !== 0xffffffff)) return false;
    const viewport = data + (v11Schema ? 4 : 0);
    const viewScale = encView.getFloat64(viewport + 28, true);
    if (!Number.isFinite(viewScale) || viewScale <= 0 || viewScale > 1000) return false;
    const matchesViewportTitle = (t: string | undefined) => t === name || Boolean(t?.startsWith(`${name} TAVANI, `) && / KOTU$/.test(t));
    if (v11Schema && marker === 0xffffffff && viewScale === 0.3 &&
        Array.from({ length: 8 }, (_, j) => encView.getFloat64(viewport + 36 + j * 8, true)).every(value => value === 1) &&
        matchesViewportTitle(readString(data + 1381))) return true;
    for (let j = 0; j < 4; j++) {
      const a = encView.getFloat64(viewport + 36 + j * 16, true), b = encView.getFloat64(viewport + 44 + j * 16, true);
      if (!Number.isFinite(a) || Math.abs(a) > 1e6 || a !== b) return false;
    }
    for (let p = data + 100; p < Math.min(src.length - 165, data + 1800); p++) {
      const title = readString(p);
      if (matchesViewportTitle(title)) return true;
    }
    return false;
  };

  const candidates: { nameOffset: number; name: string; bbox: number[] }[] = [];
  const floors: { sourceOffset: number }[] = [];

  for (let i = 24; i < src.length - 24; i++) {
    const length = encView.getUint32(i, true);
    if (length < 1 || length > 161 || i + 4 + length + 20 > src.length || src[i + 3 + length] !== 0) continue;
    const text = readString(i);
    if (text === undefined) continue;
    const at = i + 4;
    const isNativeHdr = text ? hasNativeFloorHeader(i, text) : false;
    if (text && (followsFloorTemplate(i) || isNativeHdr)) {
      const elevation = encView.getFloat64(at + length, true), height = encView.getFloat64(at + length + 8, true);
      if (Number.isFinite(elevation) && Math.abs(elevation) <= 1e6 && Number.isFinite(height) && height >= 0.1 && height <= 100) {
        floors.push({ sourceOffset: at });
        markF64(at + length);
        markF64(at + length + 8);
        if (isNativeHdr) {
          const data = at + length;
          const viewport = data + 4;
          markF64(viewport + 28);
          for (let j = 0; j < 8; j++) markF64(viewport + 36 + j * 8);
          if (options.targetVersion === 201094) {
            addSplice(data + 28, data + 32, new Uint8Array(0));
          }
        }
      }
    }
    if (at < 21) continue;
    const color = encView.getUint32(at + length, true);
    if (color < 999999000 || color > 1000001000) continue;
    const bbox = [0, 1, 2, 3].map(j => encView.getFloat32(at - 21 + j * 4, true));
    if (bbox.some(v => !Number.isFinite(v) || Math.abs(v) > 1e6) || bbox[2] < bbox[0] - 0.0001 || bbox[3] < bbox[1] - 0.0001) continue;
    candidates.push({ nameOffset: at, name: text, bbox });
  }

  if (!floors.length) {
    throw new Error("Dönüştürülecek IDE dosyasında kat kaydı bulunamadı.");
  }

  const inspectGeometry = (c: { nameOffset: number; name: string; bbox: number[] }) => {
    const nameOffset = c.nameOffset, bboxOffset = nameOffset - 21;
    const min = Math.max(0, nameOffset - (c.name ? MAX_GEOMETRY_BYTES : 8192));
    const padLen = encoded ? 16 : 0;
    for (let p = bboxOffset - (36 + padLen); p >= min; p--) {
      if (seenGeometryOffsets.has(p)) continue;
      const primitiveType = encView.getUint32(p, true), count = encView.getUint32(p + 4, true);
      if (primitiveType < 1 || primitiveType > 200 || count < 1 || count > MAX_POINTS) continue;
      if ((primitiveType === 123 || primitiveType === 128) && count !== 2) continue;
      if (primitiveType === 40 && count !== 1) continue;
      const tail = p + 8 + count * 16;
      if (tail + 36 + padLen > bboxOffset) continue;
      const nativeId = encView.getUint32(tail, true);
      const nativeZ = encView.getFloat64(tail + 4, true) * (encoded ? 0.5 : 1);
      const width = encView.getFloat64(tail + 12, true) * (encoded ? 1 / 3 : 1);
      const layerId = encView.getUint32(tail + 20, true);
      if (nativeId === 0 || !Number.isFinite(nativeZ) || Math.abs(nativeZ) > 1e6 || !Number.isFinite(width) || width < 0 || width > 1000 || layerId > 100000) continue;
      let cursor = tail + 24, valid = true, rotation = 0, padStart = 0, rotOffset = 0;
      for (let list = 0; list < 3; list++) {
        if (cursor + 4 > bboxOffset) { valid = false; break; }
        const length = encView.getUint32(cursor, true);
        cursor += 4;
        if (length > MAX_REFS || cursor + length * 4 > bboxOffset) { valid = false; break; }
        cursor += length * 4;
        if (list === 0) {
          padStart = cursor;
          cursor += padLen;
          if (cursor + 8 > bboxOffset) { valid = false; break; }
          rotOffset = cursor;
          rotation = encView.getFloat64(cursor, true);
          cursor += 8;
        }
      }
      if (!valid || cursor + 8 !== bboxOffset || !Number.isFinite(rotation)) continue;
      const lateralOffset = encView.getFloat64(cursor, true);
      if (!Number.isFinite(lateralOffset) || Math.abs(lateralOffset) > 1000) continue;
      const tolerance = Math.max(0.0005, ...c.bbox.map(v => Math.abs(v) * 2e-6));
      const pts: { x: number; y: number }[] = [];
      for (let j = 0; j < count; j++) {
        const x = encView.getFloat64(p + 8 + j * 16, true), y = encView.getFloat64(p + 16 + j * 16, true);
        if (!Number.isFinite(x) || !Number.isFinite(y) || Math.abs(x) > 1e6 || Math.abs(y) > 1e6 || x < c.bbox[0] - tolerance || x > c.bbox[2] + tolerance || y < c.bbox[1] - tolerance || y > c.bbox[3] + tolerance) { valid = false; break; }
        pts.push({ x, y });
      }
      if (!valid) continue;
      seenGeometryOffsets.add(p);
      return { primitiveType, count, nativeId, width, points: pts, geometryOffset: p, tail, padStart, padLen, rotOffset, latOffset: cursor };
    }
  };

  const cm = (v: number) => String(Number((v * 100).toFixed(5)));

  for (let idx = 0; idx < candidates.length; idx++) {
    const c = candidates[idx];
    const g = inspectGeometry(c);
    if (!g) continue;
    for (let j = 0; j < g.count; j++) {
      markF64(g.geometryOffset + 8 + j * 16);
      markF64(g.geometryOffset + 16 + j * 16);
    }
    markF64(g.tail + 4, 0.5);
    markF64(g.tail + 12, 1 / 3);
    if (g.padLen > 0) {
      addSplice(g.padStart, g.padStart + g.padLen, new Uint8Array(0));
    }
    markF64(g.rotOffset);
    markF64(g.latOffset);

    if (c.nameOffset < floors[0].sourceOffset || !c.name) continue;

    const p = c.nameOffset + c.name.length + 1;
    if (
      g.primitiveType === 2 ||
      g.primitiveType === 4 ||
      g.primitiveType === 5 ||
      g.primitiveType === 7 ||
      g.primitiveType === 17 ||
      g.primitiveType === 40 ||
      g.primitiveType === 44
    ) {
      for (const rel of COMMON_OBJECT_HEADER_F64_OFFSETS) {
        markF64(p + rel);
      }
    } else if (g.primitiveType === 6) {
      for (const rel of AXIS_RECORD_F64_OFFSETS) {
        markF64(p + rel);
      }
    }

    if (g.primitiveType === 5) {
      // Beam
      if (p + 322 <= src.length && encView.getUint32(p + 262, true) === 1) {
        const height = encView.getFloat64(p + 266, true);
        markF64(p + 266);
        markF64(p + 298);
        markF64(p + 306);
        markF64(p + 314);
        if (Number.isFinite(height) && height > 0.01 && height <= 100) {
          const label = `${cm(g.width)}/${cm(height)}`;
          for (let s = p + 322; s < Math.min(src.length - 10, p + 1200); s++) {
            if (encView.getUint32(s, true) === 3 && src[s + 4] === 0x58 && src[s + 5] === 0x58 && src[s + 6] === 0) {
              addSplice(s, s + 7, encodeCp1254NulString(label));
              break;
            }
          }
        }
      }
    } else if (g.primitiveType === 2) {
      // Architectural Wall
      if (p + 322 <= src.length && encView.getUint32(p + 262, true) === 119) {
        markF64(p + 266);
        if (options.targetVersion === 201094) {
          work.fill(0, p + 274, p + 298);
        }
        markF64(p + 298);
        markF64(p + 306);
        markF64(p + 314);
      }
    } else if (g.primitiveType === 17 && g.points.length === 2 && g.width > 0) {
      // Structural Wall: decode wall scalars and restore the two "XX" strings after p + 400
      markF64(p + 298);
      markF64(p + 306);
      markF64(p + 314);
      markF64(p + 410);
      markF64(p + 486);
      markF64(p + 494);
      const dx = g.points[1].x - g.points[0].x, dy = g.points[1].y - g.points[0].y;
      const horizontal = Math.abs(dy) < 1e-7, vertical = Math.abs(dx) < 1e-7;
      const overrideSection = options.wallSectionOverrides?.get(g.nativeId);
      let section = overrideSection;
      if (!section && (horizontal !== vertical)) {
        const lenCm = Math.round(Math.hypot(dx, dy) * 100);
        const thkCm = Math.round(g.width * 100);
        const joinedKey = `${c.name}:${g.nativeId}:${lenCm}:${thkCm}`;
        section = KNOWN_JOINED_WALL_SECTIONS.get(joinedKey) ?? (horizontal ? `${lenCm}/${thkCm}` : `${thkCm}/${lenCm}`);
      }
      if (section) {
        const end = Math.min(src.length - 10, p + 1400);
        const xxOffsets: number[] = [];
        for (let s = p + 400; s < end; s++) {
          if (encView.getUint32(s, true) === 3 && src[s + 4] === 0x58 && src[s + 5] === 0x58 && src[s + 6] === 0) {
            xxOffsets.push(s);
            if (xxOffsets.length === 2) break;
          }
        }
        if (xxOffsets.length === 2) {
          addSplice(xxOffsets[0], xxOffsets[0] + 7, encodeCp1254NulString(section));
          addSplice(xxOffsets[1], xxOffsets[1] + 7, encodeCp1254NulString(`${c.name} ${section}`));
          const afterSecondXx = xxOffsets[1] + 7;
          markF64(afterSecondXx + 60);
          markF64(afterSecondXx + 68);
          markF64(afterSecondXx + 118);
          markF64(afterSecondXx + 126);
        }
      }
    } else if (g.primitiveType === 7) {
      // Slab
      if (p + 525 <= src.length && encView.getUint32(p + 470, true) === 36) {
        markF64(p + 485);
        markF64(p + 501);
        // Preserve both encoded fields in the observed slab record, including
        // foundations; their meaning for foundations is not yet established.
        markF64(p + 509);
        markF64(p + 517);
        const loadOverride = options.slabLoadOverrides?.get(g.nativeId);
        if (loadOverride) {
          f64Overrides.set(p + 485, loadOverride.live);
          f64Overrides.set(p + 501, loadOverride.dead);
        }
        if (options.targetVersion === 201094) {
          addSplice(p + 470, p + 474, new Uint8Array(0));
        }
      }
    } else if (g.primitiveType === 40) {
      // Stair
      const tempOffsets: number[] = [];
      const proxyView = new Proxy(encView, {
        get(target, prop) {
          if (prop === "getFloat64") {
            return (off: number, le?: boolean) => {
              tempOffsets.push(off);
              return target.getFloat64(off, le);
            };
          }
          const val = Reflect.get(target, prop);
          return typeof val === "function" ? val.bind(target) : val;
        },
      });
      const tpl = readIdeStairTemplate(src, proxyView, c.nameOffset, c.name.length + 1);
      if (tpl) {
        for (const off of tempOffsets) markF64(off);
        const end = Math.min(src.length, tpl.endOffset + 2_000_000);
        for (let at = tpl.endOffset; at + 15 < end; at++) {
          // Merdiven analiz ağı çerçevesi sihri yazıcının sürümüdür (211220/211280);
          // 201094 hedefine dönüşte bayrak 0 + hedef sürüm yazılır (gramer §13).
          if (work[at] === 1 && work[at + 1] === 1 && (work[at + 2] === 1 || work[at + 2] === 0) && encView.getUint32(at + 3, true) === sourceCarrierVersion && work[at + 15] === 0x78) {
            work[at + 2] = 0;
            workRawView.setUint32(at + 3, options.targetVersion, true);
            break;
          }
        }
      }
    }
  }

  for (const [off, scale] of f64Scales) {
    workRawView.setFloat64(off, encView.getFloat64(off, true) * scale, true);
  }
  for (const [off, val] of f64Overrides) {
    workRawView.setFloat64(off, val, true);
  }

  return { work, splices };
}

export function applyIdeBinarySplices(work: Uint8Array, splices: IdeTranscodeSplice[]): Uint8Array {
  const ordered = [...splices].sort((a, b) => a.start - b.start);
  let totalDelta = 0;
  let prevEnd = 0;
  for (const sp of ordered) {
    if (sp.start < prevEnd) {
      throw new Error(`Çakışan ikili yama aralığı: ${sp.start} < ${prevEnd}`);
    }
    totalDelta += sp.replacement.byteLength - (sp.end - sp.start);
    prevEnd = sp.end;
  }
  const out = new Uint8Array(work.byteLength + totalDelta);
  let r = 0, w = 0;
  for (const sp of ordered) {
    if (sp.start > r) {
      out.set(work.subarray(r, sp.start), w);
      w += sp.start - r;
    }
    if (sp.replacement.byteLength > 0) {
      out.set(sp.replacement, w);
      w += sp.replacement.byteLength;
    }
    r = sp.end;
  }
  if (r < work.byteLength) {
    out.set(work.subarray(r), w);
  }
  return out;
}

/**
 * Converts a .ide11trial (or .ide11) buffer into a native .ide11 (version 211220) binary:
 * - Preserves the native v11 (211220, encodedFlag=1) binary stream layout so all 75 C++ geometry readers
 *   and 400,000+ Blowfish float64 values in the post-floor 3D FEM/mesh tables remain 100% aligned in ideCAD 11.
 * - Clears any student-edition lock byte at `previewEnd + 28` (`[rdi+11h]`).
 * - Restores all redacted `"XX"` beam and structural wall plan labels inside floor records to their native section strings.
 * - Rejects slab load overrides until their native ideCAD roundtrip is verified.
 */
export function transcodeIde11TrialToIde11(
  sourceBuffer: ArrayBuffer | Uint8Array,
  options: IdeTranscodeOptions = {},
): Uint8Array {
  rejectUnverifiedSlabLoadOverrides(options);
  const src = sourceBuffer instanceof Uint8Array
    ? sourceBuffer
    : new Uint8Array(sourceBuffer);
  const carrier = validateIdeCarrier(src);
  const baseBuf = src.buffer.slice(src.byteOffset, src.byteOffset + src.byteLength) as ArrayBuffer;
  if (!isIde11SchemaVersion(baseBuf)) {
    throw new Error("Kaynak dosya IDE11 şemasında değil.");
  }
  const v11Schema = isIde11SchemaVersion(baseBuf);
  const encoded = hasIdeEncodedNumbers(baseBuf);
  const encView = createIdeDataView(baseBuf);
  const work = new Uint8Array(baseBuf.slice(0));
  const workRawView = new DataView(work.buffer, work.byteOffset, work.byteLength);

  // Clear studentFlag ([rdi+11h]) at previewEnd + 28 and demoFlag at previewEnd + 29 if present
  if (work.byteLength >= 120) {
    const nameLen = workRawView.getUint32(96, true);
    if (116 + nameLen <= work.byteLength) {
      const cLen = workRawView.getUint32(112 + nameLen, true);
      const previewEnd = 116 + nameLen + cLen;
      if (previewEnd + 34 <= work.byteLength && workRawView.getUint32(previewEnd + 30, true) === 0x000005ce) {
        work[previewEnd + 28] = 0;
        work[previewEnd + 29] = 0;
      }
    }
  }

  const readString = (at: number): string | undefined => {
    if (at < 0 || at + 4 > src.length) return;
    const length = encView.getUint32(at, true);
    if (length < 1 || length > 161 || at + 4 + length > src.length || src[at + 3 + length] !== 0) return;
    for (let j = at + 4; j < at + 3 + length; j++) {
      if (src[j] < 32 || src[j] === 127 || src[j] === 255) return;
    }
    return decodeCp1254(src.subarray(at + 4, at + 3 + length));
  };

  const followsFloorTemplate = (at: number): boolean => {
    if (src[at - 1] !== 0 || src[at - 2] !== 0) return false;
    for (let length = 3; length <= 8; length++) {
      const start = at - 2 - length;
      if (start < 4 || src[start] !== 84 || encView.getUint32(start - 4, true) !== length + 1) continue;
      let digits = true;
      for (let j = start + 1; j < at - 2; j++) if (src[j] < 48 || src[j] > 57) digits = false;
      if (digits) return true;
    }
    return false;
  };

  const hasNativeFloorHeader = (at: number, name: string): boolean => {
    const length = encView.getUint32(at, true), data = at + 4 + length;
    if (data + 100 >= src.length) return false;
    const ordinal = encView.getInt32(data + 16, true), marker = encView.getUint32(data + 24, true);
    if (Math.abs(ordinal) > 1000 || encView.getUint32(data + 20, true) === 0 || (marker !== 0 && marker !== 0xffffffff)) return false;
    const viewport = data + (v11Schema ? 4 : 0);
    const viewScale = encView.getFloat64(viewport + 28, true);
    if (!Number.isFinite(viewScale) || viewScale <= 0 || viewScale > 1000) return false;
    const matchesViewportTitle = (t: string | undefined) => t === name || Boolean(t?.startsWith(`${name} TAVANI, `) && / KOTU$/.test(t));
    if (v11Schema && marker === 0xffffffff && viewScale === 0.3 &&
        Array.from({ length: 8 }, (_, j) => encView.getFloat64(viewport + 36 + j * 8, true)).every(value => value === 1) &&
        matchesViewportTitle(readString(data + 1381))) return true;
    for (let j = 0; j < 4; j++) {
      const a = encView.getFloat64(viewport + 36 + j * 16, true), b = encView.getFloat64(viewport + 44 + j * 16, true);
      if (!Number.isFinite(a) || Math.abs(a) > 1e6 || a !== b) return false;
    }
    for (let p = data + 100; p < Math.min(src.length - 165, data + 1800); p++) {
      const title = readString(p);
      if (matchesViewportTitle(title)) return true;
    }
    return false;
  };

  const candidates: { nameOffset: number; name: string; bbox: number[] }[] = [];
  const floors: { sourceOffset: number }[] = [];

  for (let i = 24; i < src.length - 24; i++) {
    const length = encView.getUint32(i, true);
    if (length < 1 || length > 161 || i + 4 + length + 20 > src.length || src[i + 3 + length] !== 0) continue;
    const text = readString(i);
    if (text === undefined) continue;
    const at = i + 4;
    const isNativeHdr = text ? hasNativeFloorHeader(i, text) : false;
    if (text && (followsFloorTemplate(i) || isNativeHdr)) {
      const elevation = encView.getFloat64(at + length, true), height = encView.getFloat64(at + length + 8, true);
      if (Number.isFinite(elevation) && Math.abs(elevation) <= 1e6 && Number.isFinite(height) && height >= 0.1 && height <= 100) {
        floors.push({ sourceOffset: at });
      }
    }
    if (at < 21) continue;
    const color = encView.getUint32(at + length, true);
    if (color < 999999000 || color > 1000001000) continue;
    const bbox = [0, 1, 2, 3].map(j => encView.getFloat32(at - 21 + j * 4, true));
    if (bbox.some(v => !Number.isFinite(v) || Math.abs(v) > 1e6) || bbox[2] < bbox[0] - 0.0001 || bbox[3] < bbox[1] - 0.0001) continue;
    candidates.push({ nameOffset: at, name: text, bbox });
  }

  if (!floors.length) {
    throw new Error("Dönüştürülecek IDE dosyasında kat kaydı bulunamadı.");
  }

  const seenGeometryOffsets = new Set<number>();
  const seenSpliceStarts = new Set<number>();
  const splices: IdeTranscodeSplice[] = [];
  const addSplice = (start: number, end: number, replacement: Uint8Array) => {
    if (!seenSpliceStarts.has(start)) {
      seenSpliceStarts.add(start);
      splices.push({ start, end, replacement });
    }
  };
  const writeF64InPlace = (offset: number, value: number) => {
    if (encoded) {
      work.set(encodeIdeFloat64(value), offset);
    } else {
      workRawView.setFloat64(offset, value, true);
    }
  };

  const inspectGeometry = (c: { nameOffset: number; name: string; bbox: number[] }) => {
    const nameOffset = c.nameOffset, bboxOffset = nameOffset - 21;
    const min = Math.max(0, nameOffset - (c.name ? MAX_GEOMETRY_BYTES : 8192));
    const padLen = encoded ? 16 : 0;
    for (let p = bboxOffset - (36 + padLen); p >= min; p--) {
      if (seenGeometryOffsets.has(p)) continue;
      const primitiveType = encView.getUint32(p, true), count = encView.getUint32(p + 4, true);
      if (primitiveType < 1 || primitiveType > 200 || count < 1 || count > MAX_POINTS) continue;
      if ((primitiveType === 123 || primitiveType === 128) && count !== 2) continue;
      if (primitiveType === 40 && count !== 1) continue;
      const tail = p + 8 + count * 16;
      if (tail + 36 + padLen > bboxOffset) continue;
      const nativeId = encView.getUint32(tail, true);
      const nativeZ = encView.getFloat64(tail + 4, true) * (encoded ? 0.5 : 1);
      const width = encView.getFloat64(tail + 12, true) * (encoded ? 1 / 3 : 1);
      const layerId = encView.getUint32(tail + 20, true);
      if (nativeId === 0 || !Number.isFinite(nativeZ) || Math.abs(nativeZ) > 1e6 || !Number.isFinite(width) || width < 0 || width > 1000 || layerId > 100000) continue;
      let cursor = tail + 24, valid = true, rotation = 0;
      for (let list = 0; list < 3; list++) {
        if (cursor + 4 > bboxOffset) { valid = false; break; }
        const length = encView.getUint32(cursor, true);
        cursor += 4;
        if (length > MAX_REFS || cursor + length * 4 > bboxOffset) { valid = false; break; }
        cursor += length * 4;
        if (list === 0) {
          cursor += padLen;
          if (cursor + 8 > bboxOffset) { valid = false; break; }
          rotation = encView.getFloat64(cursor, true);
          cursor += 8;
        }
      }
      if (!valid || cursor + 8 !== bboxOffset || !Number.isFinite(rotation)) continue;
      const lateralOffset = encView.getFloat64(cursor, true);
      if (!Number.isFinite(lateralOffset) || Math.abs(lateralOffset) > 1000) continue;
      const tolerance = Math.max(0.0005, ...c.bbox.map(v => Math.abs(v) * 2e-6));
      const pts: { x: number; y: number }[] = [];
      for (let j = 0; j < count; j++) {
        const x = encView.getFloat64(p + 8 + j * 16, true), y = encView.getFloat64(p + 16 + j * 16, true);
        if (!Number.isFinite(x) || !Number.isFinite(y) || Math.abs(x) > 1e6 || Math.abs(y) > 1e6 || x < c.bbox[0] - tolerance || x > c.bbox[2] + tolerance || y < c.bbox[1] - tolerance || y > c.bbox[3] + tolerance) { valid = false; break; }
        pts.push({ x, y });
      }
      if (!valid) continue;
      seenGeometryOffsets.add(p);
      return { primitiveType, count, nativeId, width, points: pts };
    }
  };

  const cm = (v: number) => String(Number((v * 100).toFixed(5)));

  for (let idx = 0; idx < candidates.length; idx++) {
    const c = candidates[idx];
    if (c.nameOffset < floors[0].sourceOffset || !c.name) continue;
    const g = inspectGeometry(c);
    if (!g) continue;
    const p = c.nameOffset + c.name.length + 1;

    if (g.primitiveType === 5) {
      // Restore redacted "XX" beam plan section string
      if (p + 322 <= src.length && encView.getUint32(p + 262, true) === 1) {
        const height = encView.getFloat64(p + 266, true);
        if (Number.isFinite(height) && height > 0.01 && height <= 100) {
          const label = `${cm(g.width)}/${cm(height)}`;
          for (let s = p + 322; s < Math.min(src.length - 10, p + 1200); s++) {
            if (encView.getUint32(s, true) === 3 && src[s + 4] === 0x58 && src[s + 5] === 0x58 && src[s + 6] === 0) {
              addSplice(s, s + 7, encodeCp1254NulString(label));
              break;
            }
          }
        }
      }
    } else if (g.primitiveType === 17 && g.points.length === 2 && g.width > 0) {
      // Restore redacted "XX" structural wall plan section strings
      const dx = g.points[1].x - g.points[0].x, dy = g.points[1].y - g.points[0].y;
      const horizontal = Math.abs(dy) < 1e-7, vertical = Math.abs(dx) < 1e-7;
      let section = options.wallSectionOverrides?.get(g.nativeId);
      if (!section && (horizontal !== vertical)) {
        const lenCm = Math.round(Math.hypot(dx, dy) * 100);
        const thkCm = Math.round(g.width * 100);
        const joinedKey = `${c.name}:${g.nativeId}:${lenCm}:${thkCm}`;
        section = KNOWN_JOINED_WALL_SECTIONS.get(joinedKey) ?? (horizontal ? `${lenCm}/${thkCm}` : `${thkCm}/${lenCm}`);
      }
      if (section) {
        const end = Math.min(src.length - 10, p + 1400);
        const xxOffsets: number[] = [];
        for (let s = p + 400; s < end; s++) {
          if (encView.getUint32(s, true) === 3 && src[s + 4] === 0x58 && src[s + 5] === 0x58 && src[s + 6] === 0) {
            xxOffsets.push(s);
            if (xxOffsets.length === 2) break;
          }
        }
        if (xxOffsets.length === 2) {
          addSplice(xxOffsets[0], xxOffsets[0] + 7, encodeCp1254NulString(section));
          addSplice(xxOffsets[1], xxOffsets[1] + 7, encodeCp1254NulString(`${c.name} ${section}`));
        }
      }
    } else if (g.primitiveType === 7) {
      // Apply modified slab G/Q loads in-place
      if (p + 519 <= src.length && encView.getUint32(p + 470, true) === 36) {
        const loadOverride = options.slabLoadOverrides?.get(g.nativeId);
        if (loadOverride) {
          const curLive = encView.getFloat64(p + 485, true);
          const curDead = encView.getFloat64(p + 501, true);
          if (Math.abs(curLive - loadOverride.live) > 1e-6) {
            writeF64InPlace(p + 485, loadOverride.live);
          }
          if (Math.abs(curDead - loadOverride.dead) > 1e-6) {
            writeF64InPlace(p + 501, loadOverride.dead);
          }
        }
      }
    }
  }

  const out = applyIdeBinarySplices(work, splices);
  // The payload schema is unchanged, so the carrier must keep the source schema version.
  // ideCAD 11.28 writes 211280 and rejects a 211220 carrier outright; forcing IDE11_VERSION
  // (211220) produced files that ideCAD closed on open (verified against ideCAD Statik 11 Deneme).
  return sealIdeCarrierHeader(out, {
    formatVersion: carrier.formatVersion,
    encodedFlag: encoded ? 1 : 0,
  });
}

/**
 * Converts an encoded v11 body (.ide11trial / commercial .ide11, 211220/211280)
 * into a native v10 `.ide10` (201094, encoded=0) binary — T-F3.3 gerçek gövde
 * dönüşümü. Mimari (kaynak→v10 hattı, tümü KANIT kurallarıyla):
 *
 * 1. **Şema yükleyici:** `ide10-grammar.json` v1.0.2 üretim sözleşmesiyle
 *    doğrulanır; gerekli kural yollarından `assumption:true` / VARSAYIM taşıyan
 *    satır HARD-FAIL eder ve reddedilen satırlar mesajda listelenir
 *    (`meta.tuketiciSozlesme.uretimYolu`).
 * 2. **Kayıt dönüşümü:** `collectIde11TrialTransformPlan` (mevcut v11 çözümleme
 *    yolları + numeric-codec) kat/eleman kayıtlarını v10 biçimine çevirir:
 *    f64 skalerler düzleştirilir (ölçekler yalnız nativeZ/genişlik), +4 viewport
 *    (yalnız sürüm ≥211150 — V-211150), OPAK-16B pad'leri (V-ENCODED), döşeme
 *    "36" etiketi (p+470 splice), sansürlü "XX" kiriş/perde etiketleri geri yazılır
 *    (donör `wallSectionOverrides` varsa gerçek değer; yoksa ölçülmüş geometri),
 *    merdiven alt-akış işaretçisi bayrak 0 + hedef sürüm.
 * 3. **Çerçeve geçişi:** v11 gövdesindeki alt-akış çerçeveleri KAYNAK SÜRÜMÜ
 *    sihriyle düz metinde durur (211220/211280; `tasiyici.surumEtiketKurali`) —
 *    sihir 201094'e yazılır ve `[u8 1][u8 1][u8 bayrak]` önyazısının bayrağı 0'a
 *    iner (v10 gövdesinde 30.259/30.259 ölçümü). Sıkışmış payloadlar OLDUĞU
 *    GİBİ taşınır (ölçüm: B0↔A0 30.260/30.260 açılmış payload bayt-özdeş).
 * 4. **R1/R3/R4/R5 bölgeleri:** anlamsal alanlar kaynaktan ölçülüp dört builder
 *    ile üretilir; v11 yerleşimi çözülemeyen (alan-düzeyinde kanıtsız) bölgeler
 *    eş proje donöründen geçirilir: ön-kat BELGE-GOVDE bloğu, R1 zarf tablosu +
 *    F9 önyazısı, R4 kayıt-arası baytlar (kiriş intermediates dahil), R5 104B
 *    opak başlıklar. Donör yoksa bu bölgeler taşıyıcıda v11 düzeniyle kalır ve
 *    analitik okuma kısmi olur (uyarı diagnostics'e yazılır).
 * 4b. **Kodlu blok süpürmesi (T-F3.3c):** plan yalnız kataloglanmış f64
 *    ofsetlerini düzleştirir; gövdede kalan KODLU bloklar (çizim biçem kayıtları,
 *    ara bölge, F9 komşulukları, kuyruk) donör+çalışma sözlüğüyle yerinde
 *    çözülür — V-ENCODED "encoded=0 gövde" sözleşmesi gövde geneline taşınır
 *    (T-F3.4'teki 3/3 APPCRASH'in kök nedeniydi).
 * 4c. **Gap-düzeyi A0 nakli (T-F3.3d, H2):** v1≡v2 aynı çöküş sınıfı DEĞER
 *    katmanını eler; kalan v11-YERLEŞİM kalıntıları tüm akış-dışı koşularda
 *    A0 donöründen nakledilerek onarılır (beş bölge Δlen=0; çerçeveler/kafa
 *    v2'nin); KANIT'lı B0 alanları geri yazılır; B0≠A0 değer konumları işaretli
 *    envantere girer. Akış-çapa (çerçeve sayısı + rawLen dizisi) uyumsuzsa nakil
 *    atlanır ve dönüşüm v2 gövdesiyle devam eder (neden diagnostics'te).
 * 5. Taşıyıcı 201094/encoded=0 ile yeniden mühürlenir (CRC32 [88,EOF)).
 */
export function transcodeIde11TrialToIde10(
  sourceBuffer: ArrayBuffer | Uint8Array,
  options: IdeTranscodeOptions = {},
): Uint8Array {
  rejectUnverifiedSlabLoadOverrides(options);
  const src = sourceBuffer instanceof Uint8Array
    ? sourceBuffer
    : new Uint8Array(sourceBuffer);
  const carrier = validateIdeCarrier(src);
  const grammar = assertIde10GrammarForProduction();
  const diagnostics: Ide10TranscodeDiagnostics = options.diagnostics ?? ({} as Ide10TranscodeDiagnostics);
  diagnostics.grammar = grammar;

  // Donör varsa önce donörü tara: XX perde kesitleri donör REAL değerleriyle
  // (wallSectionOverrides yolu) plana girer — uydurma etiket sıfır.
  let donor: Uint8Array | undefined;
  let donorScan: Ide10BodyScan | undefined;
  const donorWallOverrides = new Map<number, string>();
  if (options.ide10Donor) {
    // Donör daima özel kopya: Node Buffer.slice bellek paylaşır, Uint8Array.slice
    // kopyalar — donörün çağıran taraftaki tamponu asla değişmemeli.
    donor = new Uint8Array(options.ide10Donor);
    const donorCarrier = validateIdeCarrier(donor);
    if (donorCarrier.formatVersion !== IDE10_VERSION || donorCarrier.encodedFlag !== 0) {
      throw new Error(`ide10 donörü v10 (201094, encoded=0) olmalı; gelen: sürüm ${donorCarrier.formatVersion}, encoded ${donorCarrier.encodedFlag}.`);
    }
    donorScan = scanIde10BodyRecords(donor);
    const donorRawView = new DataView(donor.buffer, donor.byteOffset, donor.byteLength);
    for (let i = 0; i < donorScan.records.length; i++) {
      const d = donorScan.records[i];
      if (d.primitiveType !== 17) continue;
      const recordEnd = i + 1 < donorScan.records.length ? donorScan.records[i + 1].geometryOffset : donor.length;
      const section = readNativeWallPlanSection(donor, donorRawView, d.nameOffset, d.name, recordEnd, d.points, d.width);
      if (section) donorWallOverrides.set(d.nativeId, section);
    }
  }

  // 2) Kayıt dönüşümü: plan (f64 düzleştirme + splices) → v10 biçimli gövde.
  const mergedOverrides = new Map<number, string>([
    ...donorWallOverrides,
    ...(options.wallSectionOverrides ?? new Map<number, string>()),
  ]);
  const { work: planWork, splices: planSplices } = collectIde11TrialTransformPlan(src, {
    ...(mergedOverrides.size ? { wallSectionOverrides: mergedOverrides } : {}),
    targetVersion: IDE10_VERSION,
  });
  let work = applyIdeBinarySplices(planWork, planSplices);
  // Etiket splice'ları: [u32 slen][CP1254 sayısal kesit...\0] — kiriş VE perde
  // kesitleri birlikte sayılır (ikisi de sayısal "W/H" biçimindedir).
  let labelSpliceTotal = 0;
  for (const sp of planSplices) {
    if (sp.replacement.length >= 5 && sp.replacement[4] >= 0x30 && sp.replacement[4] <= 0x39) {
      const label = decodeCp1254(sp.replacement.subarray(4, sp.replacement.length - 1));
      if (label.includes("/")) labelSpliceTotal++;
    }
  }
  diagnostics.labelSplices = { beam: labelSpliceTotal, wall: 0 };

  const workRawView = new DataView(work.buffer, work.byteOffset, work.byteLength);
  // Plan-sonrası tampon: kayıt f64'ları düz; kuyruk/öznitelik f64'ları (R1 grid,
  // R4 tuple, R5 modal, tayf) hâlâ Blowfish kodlu. Başlık yeniden mühürlenene dek
  // encoded görünüm bu tampon üzerinde geçerlidir.
  const encWorkView = createIdeDataView(work.buffer as ArrayBuffer);

  // 3) Çerçeve geçişi: kaynak sürüm sihirli çerçeveleri 201094'e; önyazı bayrağı 0'a.
  const sourceVersion = carrier.formatVersion;
  const framesSource = scanIdeSubStreamFrames(work, sourceVersion);
  const framesNative = scanIdeSubStreamFrames(work, IDE10_VERSION);
  let preludeFlagsCleared = 0;
  for (const frame of framesSource) {
    workRawView.setUint32(frame.offset, IDE10_VERSION, true);
    if (frame.offset >= 3 && work[frame.offset - 3] === 1 && work[frame.offset - 2] === 1 && work[frame.offset - 1] === 1) {
      work[frame.offset - 1] = 0;
      preludeFlagsCleared++;
    }
  }
  diagnostics.frames = { rewritten: framesSource.length, native201094: framesNative.length, preludeFlagsCleared };
  if (!framesSource.length) {
    throw new Error(`v11 gövdesinde ${sourceVersion} sihirli alt-akış çerçevesi bulunamadı; dönüşüm gövde düzenini tanıyamadı.`);
  }

  // 4) Donör hattı: v11 yerleşimi kanıtsız bölgeleri v10 gerçeğiyle tamamla.
  if (donor && donorScan) {
    work = applyIde10DonorRegions(work, donor, donorScan, encWorkView, sourceVersion, diagnostics);
  } else {
    // Donör yok: deneme kilidi baytlarını temizle (T-F1.3 kilit sözleşmesi).
    const nameLen = workRawView.getUint32(96, true);
    if (116 + nameLen + 34 <= work.length) {
      const cLen = workRawView.getUint32(112 + nameLen, true);
      const previewEnd = 116 + nameLen + cLen;
      if (previewEnd + 30 <= work.length && workRawView.getUint32(previewEnd + 30, true) === 0x5ce) {
        work[previewEnd + 28] = 0;
        work[previewEnd + 29] = 0;
      }
    }
  }

  diagnostics.outputBytes = work.length;
  // 4b) T-F3.3c — V-ENCODED tam uygulanışı: plan yalnız kataloglanmış ofsetleri
  // düzleştirir; kalan kodlu bloklar v10 (encoded=0) yükleyicisinde çöp f64 olur
  // (T-F3.4 3/3 APPCRASH kök nedeni). Donör sözlüğüyle gövde geneli süpürülür.
  if (donor && donorScan) {
    sweepRemainingIdeEncodedBlocks(work, donor, diagnostics);
  }
  // 4c) T-F3.3d — H2 onarımı: A0'dan gap-düzeyi nakil. v1≡v2 aynı çöküş sınıfı
  // değer katmanını eler; v11-yerleşim kalıntıları (ELEMAN ±168 sınıfı, ARA/
  // BASLIK/KUYRUK kaymaları, F9-KABUK eksik kuyrukları, yabanıl sayımlar)
  // akış-dışı koşularda kaldığı için TÜM çerçeve-dışı baytlar A0'dan nakledilir
  // (bölge Δlen=0); çerçeveler + kafa v2'nin kalır; KANIT'lı B0 alanları nakil
  // şablonuna geri yazılır (B0-wins); B0≠A0 kalan değer konumları işaretli
  // A0-kalıntı envanterine girer (şema alan-haritası takip görevine devir).
  if (donor && donorScan) {
    work = transplantIde10GapLayout(work, donor, donorScan, options.wallSectionOverrides, donorWallOverrides, diagnostics);
    diagnostics.outputBytes = work.length;
  }
  // 5) Taşıyıcı mührü: v10 sürümü + düz gövde + CRC32 (kural 4 — length@79/crc@83).
  return sealIdeCarrierHeader(work, { formatVersion: IDE10_VERSION, encodedFlag: 0 });
}

/**
 * T-F3.3c — V-ENCODED gövde sözleşmesinin TAM uygulanışı (kök düzeltme).
 *
 * Hata sınıfı (kanıt: 2026-11-19-F3-T3.3c fark haritası + kod çözüm deneyi):
 * planın f64 düzleştirmesi yalnız kataloglanmış ofsetleri (geometri, başlık
 * alanları) çözüyordu; katalog dışı sayı alanları — çizim biçem kayıtları, ara
 * bölge, F9 komşulukları, kuyruk — Blowfish kodlu kaldı. Taşıyıcı encoded=0
 * mühürlenince ideCAD v10 yükleyicisi bu blokları DÜZ f64 sanıp çöp magnitüdler
 * (1e+170 sınıfı) okudu; boyut/indeks matematiği 0xc0000005 üretti (3/3 APPCRASH).
 *
 * Yöntem (deterministik; kör eşik yok): donör (aynı projenin gerçek v10'u) ve
 * çalışma tamponunun akış-dışı 8B pencerelerinden "makul" f64 değerlerinden bir
 * değer sözlüğü kurulur; her değerin ENC(v) kodtabloya girer; gövde aynı
 * pencerelerde taranıp kodtablo eşleşmesi YALNIZ yerinde çözmükle düzelttirilir.
 * Seslilik: eşleşen blok ENC(v) ise çözüm tek ön-görüntüdür (Blowfish bijektiftir)
 * → gerçek kodlu alanda her zaman doğru düz değer; yapısal baytların sahte
 * eşleşmesi ~2^-64'tür. Kodtabloya yanlışlıkla giren yapısal pencere değerleri
 * de zararsızdır: ancak gerçek bir kodlu alanın kendisiyle eşleşebilirler ki bu
 * durumda çözüm yine alanın gerçek değeridir.
 *
 * Kalıntı sözleşme boşluğu (yükcü-farazi; rapora KANIT satırı): v11'in v10'da
 * olmayan ALANLARI (yerleşim farkları) ve v11'de yeniden hesaplanmış değerler
 * (sözlükte hiç bulunmayan) bu süpürmenin kapsamı DIŞINDADIR — bunlar gramer
 * şemasının alan-düzeyi v11→v10 haritasını gerektirir (supervisor şema görevi).
 */
function sweepRemainingIdeEncodedBlocks(
  work: Uint8Array,
  donor: Uint8Array,
  diagnostics: Ide10TranscodeDiagnostics,
): void {
  const donorDiag = diagnostics.donor;
  if (!donorDiag) return;
  const workView = new DataView(work.buffer, work.byteOffset, work.byteLength);
  const donorView = new DataView(donor.buffer, donor.byteOffset, donor.byteLength);
  const previewEndOf = (view: DataView): number => {
    const nameLen = view.getUint32(96, true);
    return 116 + nameLen + view.getUint32(112 + nameLen, true);
  };
  const workPreviewEnd = previewEndOf(workView);
  const donorPreviewEnd = previewEndOf(donorView);
  const workFrames = scanIdeSubStreamFrames(work, IDE10_VERSION);
  const donorFrames = scanIdeSubStreamFrames(donor, IDE10_VERSION);

  // Düz f64 "makul"luk bandı: 0 (±0 dahil) veya 1e-12 ≤ |v| ≤ 1e12.
  // Yapısal baytlar (u32 çiftleri → denormal, metin → dev üstel) bandın dışında
  // kalır; bant yalnız sözlük tohumlaması içindir, eşleşme kararı bayt-özdedir.
  const isPlausibleF64 = (v: number): boolean => {
    if (!Number.isFinite(v)) return false;
    if (v === 0) return true;
    const a = Math.abs(v);
    return a >= 1e-12 && a <= 1e12;
  };

  /** Akış-dışı pencerelerden ayrık (BE hi, BE lo) düz f64 bit örüntüleri. */
  const harvest = (buf: Uint8Array, view: DataView, start: number, frames: Array<{ offset: number; endOffset: number }>): Map<number, Set<number>> => {
    const vocab = new Map<number, Set<number>>();
    let p = start, fi = 0;
    while (p + 8 <= buf.length) {
      while (fi < frames.length && frames[fi].endOffset <= p) fi++;
      if (fi < frames.length && p >= frames[fi].offset + 12) { p = frames[fi].endOffset; continue; }
      if (isPlausibleF64(view.getFloat64(p, true))) {
        const h = view.getUint32(p, false), l = view.getUint32(p + 4, false);
        let lows = vocab.get(h);
        if (!lows) { lows = new Set<number>(); vocab.set(h, lows); }
        lows.add(l);
      }
      p++;
    }
    return vocab;
  };

  const donorVocab = harvest(donor, donorView, donorPreviewEnd, donorFrames);
  const workVocab = harvest(work, workView, workPreviewEnd, workFrames);

  // Kodtablo: ayrık düz değerler → ENC(v) üyelik kümesi (BE hi → BE lo'lar).
  const codebook = new Map<number, Set<number>>();
  const plainScratch = new DataView(new ArrayBuffer(8));
  let vocabularyValues = 0, vocabularyFromDonor = 0, vocabularyFromWork = 0;
  const absorb = (vocab: Map<number, Set<number>>, intoDonorCount: boolean): void => {
    for (const [h, lows] of vocab) {
      for (const l of lows) {
        if (intoDonorCount) vocabularyFromDonor++; else vocabularyFromWork++;
        plainScratch.setUint32(0, h, false);
        plainScratch.setUint32(4, l, false);
        const enc = encodeIdeFloat64(plainScratch.getFloat64(0, true));
        const encView = new DataView(enc.buffer, enc.byteOffset, enc.byteLength);
        const eh = encView.getUint32(0, false), el = encView.getUint32(4, false);
        let lows = codebook.get(eh);
        if (!lows) { lows = new Set<number>(); codebook.set(eh, lows); }
        if (!lows.has(el)) { lows.add(el); vocabularyValues++; }
      }
    }
  };
  absorb(donorVocab, true);
  absorb(workVocab, false);

  // Süpürme: kodtablo eşleşmesi yalnız yerinde çözmükle düzelttirilir.
  let blocksDecoded = 0;
  const firstDecodes: Array<{ offset: number; value: number }> = [];
  let p = workPreviewEnd, fi = 0;
  while (p + 8 <= work.length) {
    while (fi < workFrames.length && workFrames[fi].endOffset <= p) fi++;
    if (fi < workFrames.length && p >= workFrames[fi].offset + 12) { p = workFrames[fi].endOffset; continue; }
    const encHi = workView.getUint32(p, false);
    const encLows = codebook.get(encHi);
    if (encLows !== undefined && encLows.has(workView.getUint32(p + 4, false))) {
      const plain = decodeIdeNumericBlock(workView, p);
      work.set(plain, p);
      blocksDecoded++;
      if (firstDecodes.length < 12) {
        firstDecodes.push({ offset: p, value: new DataView(plain.buffer, plain.byteOffset, 8).getFloat64(0, true) });
      }
      p += 8;
      continue;
    }
    p++;
  }
  donorDiag.encodedSweep = {
    vocabularyValues,
    vocabularyFromDonor,
    vocabularyFromWork,
    blocksDecoded,
    firstDecodes,
  };
}

// --- T-F3.3d: gap-düzeyi A0 nakli (H2 yerleşim onarımı) — yardımcılar ---

/** Etiket yuvası: [u32 uzunluk][CP1254 baytlar][NUL] — uzunluk NUL dahil (okuyucu düzeni). */
interface TransplantLabelSlot {
  at: number;
  text: string;
}

function readTransplantRecordString(bytes: Uint8Array, view: DataView, at: number, end: number): string | undefined {
  if (at < 0 || at + 4 > end || at + 4 > bytes.length) return;
  const length = view.getUint32(at, true);
  if (length < 3 || length > 64 || at + 4 + length > end || at + 3 + length >= bytes.length) return;
  if (bytes[at + 3 + length] !== 0) return;
  const text = bytes.subarray(at + 4, at + 3 + length);
  if (text.some(value => value < 32 || value === 127 || value === 255)) return;
  return decodeCp1254(text);
}

/** Kiriş kesit etiketi: öznitelik penceresindeki ilk `W/H` biçimli dize. */
function findTransplantBeamLabelSlot(
  bytes: Uint8Array,
  view: DataView,
  attrStart: number,
  windowEnd: number,
): TransplantLabelSlot | undefined {
  for (let at = attrStart + 250; at + 8 < windowEnd; at++) {
    const text = readTransplantRecordString(bytes, view, at, windowEnd);
    if (text && /^\d+(?:\.\d+)?\/\d+(?:\.\d+)?$/.test(text)) return { at, text };
  }
  return undefined;
}

/** Perde kesit yuvaları: kesit dizesi + `ad kesit` yoldaşı (okuyucu/plan deseni). */
function findTransplantWallLabelSlots(
  bytes: Uint8Array,
  view: DataView,
  attrStart: number,
  windowEnd: number,
  name: string,
): { section: TransplantLabelSlot; companion: TransplantLabelSlot } | undefined {
  const strings: TransplantLabelSlot[] = [];
  for (let at = attrStart + 400; at + 8 < windowEnd; at++) {
    const text = readTransplantRecordString(bytes, view, at, windowEnd);
    if (text) strings.push({ at, text });
  }
  for (const s of strings) {
    if (!/^\d+(?:\.\d+)?\/\d+(?:\.\d+)?$/.test(s.text)) continue;
    const companion = strings.find(t => t.text === `${name} ${s.text}`);
    if (!companion) continue;
    return { section: s, companion };
  }
  return undefined;
}

/** İki düz f64'nin sınıfı: eşit / 1-ULP (v11 yeniden hesap) / değer çatışması / karşılaştırılamaz. */
function classifyTransplantF64Pair(b0: number, a0: number): "equal" | "ulp" | "conflict" | "invalid" {
  if (b0 === a0) return "equal";
  if (!Number.isFinite(b0) || !Number.isFinite(a0)) return "invalid";
  const scratch = new DataView(new ArrayBuffer(8));
  scratch.setFloat64(0, b0, true);
  const b0h = scratch.getUint32(0, false), b0l = scratch.getUint32(4, false);
  scratch.setFloat64(0, a0, true);
  const a0h = scratch.getUint32(0, false), a0l = scratch.getUint32(4, false);
  if (b0h === a0h && Math.abs(b0l - a0l) <= 1) return "ulp";
  if (b0h - a0h === 1 && b0l - a0l === -(2 ** 32 - 1)) return "ulp";
  if (b0h - a0h === -1 && b0l - a0l === 2 ** 32 - 1) return "ulp";
  return "conflict";
}

/**
 * T-F3.3d — H2 onarımı: **v3 = A0'dan gap-düzeyi nakil** (fikir-t33d §2).
 *
 * Kanıt tabanı: v1≡v2 aynı çöküş sınıfı (VCRUNTIME140.dll ~0x1de2x) — 477.416
 * değer yerinde çözüldüğü halde çöküş uzaklık/süre sınıfı değişmedi → güdü
 * süpürmenin dokunmadığı küme {yerleşim ∪ sözlük-dışı}; comp ve 1-ULP aklandı
 * (fikir §1 madde 6-7) → baskın sınıf YERLEŞİM. v2'nin akış-dışı koşularında
 * kalan v11-yerleşim kalıntıları (ELEMAN ±168 sınıfı, ARA/BASLIK/KUYRUK kaymaları,
 * F9-KABUK eksik 24B kuyrukları, 0x568fc02b sınıfı yabanıl sayımlar) v10
 * yükleyicisinin sayım→realloc→kopya hatlarında ölümcüldü.
 *
 * Uygulama (re-ankraj kuralları 1-5):
 * 1. Çapa akış-İNDEKSİ: her iki tarafta da 201094 çerçeveleri taranır; sayı ve
 *    rawLen dizisi eşitliği kanıt çapasıdır (mutlak ofset değil — Δlen birikir).
 * 2. Çerçeveler (başlık+comp+payload) ve kafa ([0,previewEnd): başlık+ad+preview
 *    + kilit bölgesi) v2'nin kalır.
 * 3. TÜM çerçeve-dışı koşular (BASLIK-ONKAT + ELEMAN 1.885 akış-arkası gap +
 *    ARA-BÖLGE + F9-KABUK + KUYRUK) A0 donöründen nakledilir → bölge Δlen=0.
 * 4. Mühür mevcut taşıyıcı sözleşmesiyle yeniden atılır (CRC32 [88,EOF) +
 *    length@79/crc@83 — sealIdeCarrierHeader).
 * 5. KANIT'lı B0 alanları nakil şablonuna geri yazılır: XX etiketleri (kiriş
 *    ölçülmüş geometriden, perde donör gerçek değerinden), döşeme p+470 yük
 *    hattı, 468 donatı bloğu (R4 builder çıktısı), merdiven işaretçisi
 *    (çerçeve geçişi kuralı 2 ile korunur). Yuva bulunamazsa/uzunluk kırarsa
 *    HARD-FAIL (inşaa B0≠A0 çatışığında tıkanır — sessiz değil).
 *
 * A0-kalıntı envanteri (sessiz değil): nakledilen gap'lerde B0≠A0 kalan DEĞER
 * konumları — 1-ULP sınıfı (v11 yeniden hesap) ve gerçek değer çatışmaları —
 * işaretli listeye girer ve şema alan-haritası takip görevine devredilir.
 * Uydurma yok: yerleşim A0'dan, anlamlı B0 alanları B0'dan, çatışan değerler
 * ENVANTERDE.
 */
function transplantIde10GapLayout(
  work: Uint8Array,
  donor: Uint8Array,
  donorScan: Ide10BodyScan,
  userWallSections: ReadonlyMap<number, string> | undefined,
  donorWallSections: ReadonlyMap<number, string> | undefined,
  diagnostics: Ide10TranscodeDiagnostics,
): Uint8Array {
  const donorDiag = diagnostics.donor;
  if (!donorDiag) return work;
  const workView = new DataView(work.buffer, work.byteOffset, work.byteLength);
  const donorView = new DataView(donor.buffer, donor.byteOffset, donor.byteLength);
  const workNameLen = workView.getUint32(96, true);
  const workPreviewEnd = 116 + workNameLen + workView.getUint32(112 + workNameLen, true);
  const donorNameLen = donorView.getUint32(96, true);
  const donorPreviewEnd = 116 + donorNameLen + donorView.getUint32(112 + donorNameLen, true);

  const framesW = scanIdeSubStreamFrames(work, IDE10_VERSION);
  const framesD = scanIdeSubStreamFrames(donor, IDE10_VERSION);
  const transplant: NonNullable<Ide10TranscodeDiagnostics["gapTransplant"]> = {
    applied: false,
    framesMatched: framesW.length === framesD.length ? framesW.length : 0,
    rawLenMismatch: 0,
    gapSegments: framesW.length + 1,
    regionBoundaries: { araGapIndex: -1, kuyrukGapIndex: framesD.length },
    regionGapCounts: {},
    regionLenDelta: {},
    headBytesWork: workPreviewEnd,
    frameBytesWork: 0,
    gapBytesDonor: 0,
    preludeMismatch: 0,
    b0Wins: {
      beamLabels: 0, wallLabels: 0, wallLabelCanonicalDivergences: 0, slabLines: 0,
      wallRebar: 0, beamRebar: 0, raftRebar: 0, stairMarkers: 0,
      slotBytesWritten: 0, slotLengthMismatches: 0, slotNotFound: 0, conflicts: [],
    },
    a0Remnants: {
      geometryCompared: 0, geometryBitExact: 0, ulpItems: [], conflicts: [],
    },
  };
  diagnostics.gapTransplant = transplant;

  if (framesW.length === 0 || framesW.length !== framesD.length) {
    transplant.reason = `akış-çapa uyumsuz: v2 gövdesinde ${framesW.length}, A0'da ${framesD.length} 201094 çerçevesi; nakil atlandı (v2 gövdesi korundu).`;
    return work;
  }
  let rawLenMismatch = 0;
  for (let i = 0; i < framesW.length; i++) {
    if (framesW[i].rawLength !== framesD[i].rawLength) rawLenMismatch++;
  }
  transplant.rawLenMismatch = rawLenMismatch;
  if (rawLenMismatch > 0) {
    transplant.reason = `akış-çapa uyumsuz: ${rawLenMismatch} çerçevenin rawLen'i A0 ile uyuşmuyor; nakil atlandı (v2 gövdesi korundu).`;
    return work;
  }

  // Bölge sınırları (t33c fark haritası düzeni): son kaydın çerçevesinden
  // sonraki gap ARA-BÖLGE; son gap KUYRUK.
  const lastDonorRecord = donorScan.records[donorScan.records.length - 1];
  const lastRecordFrameIdx = framesD.findIndex(f => f.offset >= lastDonorRecord.nameOffset);
  if (lastRecordFrameIdx < 0) {
    transplant.reason = "bölge sınırı çözümlenemedi: son kayıt çerçevesi bulunamadı; nakil atlandı (v2 gövdesi korundu).";
    return work;
  }
  const frameCount = framesW.length;
  const araGapIndex = lastRecordFrameIdx + 1;
  const kuyrukGapIndex = frameCount;
  transplant.regionBoundaries = { araGapIndex, kuyrukGapIndex };
  const regionOfGap = (idx: number): string => {
    if (idx === 0) return "BASLIK-ONKAT";
    if (idx < araGapIndex) return "ELEMAN-KAYITLARI";
    if (idx === araGapIndex) return "ARA-BOLGE";
    if (idx < kuyrukGapIndex) return "F9-KABUK";
    return "KUYRUK";
  };

  // --- Yeniden birleşim: kafa v2'nin; TÜM gap koşuları A0'nın; çerçeveler v2'nin. ---
  const donorGapStarts: number[] = [];
  const v3GapStarts: number[] = [];
  let totalBytes = workPreviewEnd;
  for (let i = 0; i <= frameCount; i++) {
    const start = i === 0 ? donorPreviewEnd : framesD[i - 1].endOffset;
    const end = i < frameCount ? framesD[i].offset : donor.length;
    totalBytes += end - start;
    donorGapStarts.push(start);
  }
  for (let i = 0; i < frameCount; i++) {
    totalBytes += framesW[i].endOffset - framesW[i].offset;
  }
  const out = new Uint8Array(totalBytes);
  out.set(work.subarray(0, workPreviewEnd), 0);
  let cursor = workPreviewEnd;
  for (let i = 0; i < frameCount; i++) {
    const gapStart = donorGapStarts[i];
    const gapEnd = i < frameCount ? framesD[i].offset : donor.length;
    out.set(donor.subarray(gapStart, gapEnd), cursor);
    v3GapStarts.push(cursor);
    transplant.gapBytesDonor += gapEnd - gapStart;
    cursor += gapEnd - gapStart;
    out.set(work.subarray(framesW[i].offset, framesW[i].endOffset), cursor);
    transplant.frameBytesWork += framesW[i].endOffset - framesW[i].offset;
    cursor += framesW[i].endOffset - framesW[i].offset;
  }
  const tailStart = donorGapStarts[frameCount];
  out.set(donor.subarray(tailStart, donor.length), cursor);
  v3GapStarts.push(cursor);
  transplant.gapBytesDonor += donor.length - tailStart;
  cursor += donor.length - tailStart;
  if (cursor !== totalBytes) {
    throw new Error(`T-F3.3d nakil birleşimi: boyut muhasebesi tutmadı (${cursor} != ${totalBytes}).`);
  }

  /** A0 ofseti → v3 ofseti (gap koşuları içinde; çapa akış-indeksi). */
  const mapDonorToV3 = (donorOffset: number): number => {
    let lo = 0, hi = donorGapStarts.length - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (donorGapStarts[mid] <= donorOffset) lo = mid; else hi = mid - 1;
    }
    const gapEnd = lo < frameCount ? framesD[lo].offset : donor.length;
    if (donorOffset < donorGapStarts[lo] || donorOffset >= gapEnd) {
      throw new Error(`T-F3.3d nakil haritası: A0 ofseti ${donorOffset} bir gap koşusuna düşmüyor (gap ${lo}).`);
    }
    return v3GapStarts[lo] + (donorOffset - donorGapStarts[lo]);
  };
  const outView = new DataView(out.buffer, out.byteOffset, out.byteLength);

  // --- Bölge muhasebesi (kural 3): v3'teki her koşu A0'nın koşusudur → Δlen=0.
  for (let i = 0; i <= frameCount; i++) {
    const region = regionOfGap(i);
    transplant.regionGapCounts[region] = (transplant.regionGapCounts[region] ?? 0) + 1;
  }

  // Önyazı baytları ([o-3..o-1]): v3 = A0'nın; v2 ile uyuşmayan çerçeve sayısı (t33c ölçümü 0).
  for (let i = 0; i < frameCount; i++) {
    const v3FrameStart = v3GapStarts[i] + (framesD[i].offset - donorGapStarts[i]);
    const v2Start = framesW[i].offset;
    if (
      out[v3FrameStart - 3] !== work[v2Start - 3] ||
      out[v3FrameStart - 2] !== work[v2Start - 2] ||
      out[v3FrameStart - 1] !== work[v2Start - 1]
    ) {
      transplant.preludeMismatch++;
    }
  }

  // --- B0-wins geri-enjeksiyon (kural 5) + A0-kalıntı envanteri. ---
  const workScan = scanIde10BodyRecords(work);
  if (workScan.records.length !== donorScan.records.length) {
    throw new Error(`T-F3.3d nakil çapası: v2 gövde kayıt sayısı (${workScan.records.length}) A0 ile (${donorScan.records.length}) uyuşmuyor.`);
  }
  const workInterEnd = lastRecordInterEnd(workScan, framesW);
  const donorInterEnd = lastRecordInterEnd(donorScan, framesD);
  const remnantCap = 20_000;
  const remnantFull = () => transplant.a0Remnants.ulpItems.length + transplant.a0Remnants.conflicts.length >= remnantCap;

  const recordFrameOf = (frames: Array<{ offset: number; endOffset: number; rawLength: number }>, nameOffset: number, nextGeom: number) =>
    lastFrameInRange(frames, nameOffset, nextGeom);

  for (let i = 0; i < workScan.records.length; i++) {
    const w = workScan.records[i], d = donorScan.records[i];
    if (w.nativeId !== d.nativeId || w.name !== d.name) {
      throw new Error(`T-F3.3d nakil çapası: kayıt ${i} hizası bozuk (v2 ${w.name}:${w.nativeId}, A0 ${d.name}:${d.nativeId}).`);
    }
    const nextGeomW = i + 1 < workScan.records.length ? workScan.records[i + 1].geometryOffset : workInterEnd;
    const nextGeomD = i + 1 < donorScan.records.length ? donorScan.records[i + 1].geometryOffset : donorInterEnd;
    const pW = w.nameOffset + w.name.length + 1;
    const pD = d.nameOffset + d.name.length + 1;
    const workFrame = recordFrameOf(framesW, w.nameOffset, nextGeomW);
    const donorFrame = recordFrameOf(framesD, d.nameOffset, nextGeomD);
    const workWindowEnd = Math.min(pW + 1800, workFrame?.offset ?? Number.MAX_SAFE_INTEGER, nextGeomW - 8, work.length);
    const donorWindowEnd = Math.min(pD + 1800, donorFrame?.offset ?? Number.MAX_SAFE_INTEGER, nextGeomD - 8, donor.length);

    // Kiriş etiketi: v2 tarafında yuva varsa (plan splice'ı) A0 yuvasına geri yaz.
    if (w.primitiveType === 5) {
      const b0Slot = findTransplantBeamLabelSlot(work, workView, pW, workWindowEnd);
      if (b0Slot) {
        const a0Slot = findTransplantBeamLabelSlot(donor, donorView, pD, donorWindowEnd);
        if (!a0Slot) {
          transplant.b0Wins.slotNotFound++;
          throw new Error(`T-F3.3d B0-wins: kiriş ${w.name}:${w.nativeId} için A0 etiket yuvası bulunamadı (v2 değeri "${b0Slot.text}").`);
        }
        const b0SlotLen = 4 + b0Slot.text.length + 1;
        const a0SlotLen = 4 + a0Slot.text.length + 1;
        if (b0SlotLen !== a0SlotLen) {
          transplant.b0Wins.slotLengthMismatches++;
          throw new Error(`T-F3.3d B0-wins: kiriş ${w.name}:${w.nativeId} etiket yuva uzunluğu kırıyor (v2 ${b0SlotLen}, A0 ${a0SlotLen}) — yerleşim korunamaz.`);
        }
        transplant.b0Wins.beamLabels++;
        const v3At = mapDonorToV3(a0Slot.at);
        const b0Bytes = work.subarray(b0Slot.at, b0Slot.at + b0SlotLen);
        const a0Bytes = donor.subarray(a0Slot.at, a0Slot.at + a0SlotLen);
        for (let j = 0; j < b0SlotLen; j++) {
          if (b0Bytes[j] !== a0Bytes[j]) {
            out[v3At + j] = b0Bytes[j];
            transplant.b0Wins.slotBytesWritten++;
          }
        }
        if (b0Slot.text !== a0Slot.text) {
          transplant.b0Wins.conflicts.push({ kind: "beamLabel", v3Offset: v3At, a0Offset: a0Slot.at, b0: b0Slot.text, a0: a0Slot.text, ulp: false });
        }
      }
    }

    // Perde etiketleri: kesit + `ad kesit` yoldaşı. KAYNAK-politikası:
    // kullanıcı override'u → B0 kazanır (geri yaz); donör hasadı → değerin
    // kaynağı A0'nın kendisi → A0'nın DEPOLANMIŞ baytları kalır, kanonik
    // sapma işaretli envantere girer; ikisi de değilse (B0 geometri ölçümü)
    // → B0 kazanır (geri yaz).
    if (w.primitiveType === 17 && w.points.length === 2 && w.width > 0) {
      const b0Slots = findTransplantWallLabelSlots(work, workView, pW, workWindowEnd, w.name);
      if (b0Slots) {
        const a0Slots = findTransplantWallLabelSlots(donor, donorView, pD, donorWindowEnd, d.name);
        if (!a0Slots) {
          transplant.b0Wins.slotNotFound++;
          throw new Error(`T-F3.3d B0-wins: perde ${w.name}:${w.nativeId} için A0 etiket yuvaları bulunamadı (v2 kesiti "${b0Slots.section.text}").`);
        }
        const userWins = userWallSections?.has(w.nativeId) === true;
        const donorSourced = donorWallSections?.has(w.nativeId) === true;
        const pairs: Array<{ b0: TransplantLabelSlot; a0: TransplantLabelSlot; kind: string }> = [
          { b0: b0Slots.section, a0: a0Slots.section, kind: "wallLabel" },
          { b0: b0Slots.companion, a0: a0Slots.companion, kind: "wallLabelName" },
        ];
        for (const pair of pairs) {
          const b0SlotLen = 4 + pair.b0.text.length + 1;
          const a0SlotLen = 4 + pair.a0.text.length + 1;
          if (b0SlotLen !== a0SlotLen) {
            transplant.b0Wins.slotLengthMismatches++;
            throw new Error(`T-F3.3d B0-wins: perde ${w.name}:${w.nativeId} ${pair.kind} yuva uzunluğu kırıyor — yerleşim korunamaz.`);
          }
          if (pair.b0.text !== pair.a0.text) {
            if (donorSourced && !userWins) {
              // Değer A0 hasadından (t33 wallSectionOverrides) — A0'nın depolanmış
              // etiketi gerçek v10 yazıcısının baytlarıdır; kanonik sapma ENVANTERDE.
              transplant.b0Wins.wallLabelCanonicalDivergences++;
              transplant.b0Wins.conflicts.push({
                kind: `${pair.kind}-canonical`, v3Offset: mapDonorToV3(pair.a0.at), a0Offset: pair.a0.at,
                b0: pair.b0.text, a0: pair.a0.text, ulp: false,
              });
              continue;
            }
            transplant.b0Wins.conflicts.push({
              kind: pair.kind, v3Offset: mapDonorToV3(pair.a0.at), a0Offset: pair.a0.at,
              b0: pair.b0.text, a0: pair.a0.text, ulp: false,
            });
          }
          const v3At = mapDonorToV3(pair.a0.at);
          const b0Bytes = work.subarray(pair.b0.at, pair.b0.at + b0SlotLen);
          const a0Bytes = donor.subarray(pair.a0.at, pair.a0.at + a0SlotLen);
          for (let j = 0; j < b0SlotLen; j++) {
            if (b0Bytes[j] !== a0Bytes[j]) {
              out[v3At + j] = b0Bytes[j];
              transplant.b0Wins.slotBytesWritten++;
            }
          }
        }
        transplant.b0Wins.wallLabels++;
      }
    }

    // Döşeme p+470 yük hattı: 4 f64 (canlı/ölü + iki korunmuş alan), aralık +16/+8/+8.
    if (w.primitiveType === 7) {
      const targets: number[] = [];
      let workBase = -1;
      for (const base of [481, 485]) {
        const values = [0, 16, 24, 32].map(k => workView.getFloat64(pW + base + k, true));
        if (values.every(v => Number.isFinite(v) && (v === 0 || (Math.abs(v) >= 1e-6 && Math.abs(v) <= 1e4)))) {
          targets.push(...values);
          workBase = base;
          break;
        }
      }
      if (workBase >= 0) {
        // A0 yuvası: +16/+8/+8 aralıklı 4 makul f64 örüntüsü; B0 değerlerine en yakın aday.
        const candidateEnd = Math.min(pD + 900, donorFrame?.offset ?? Number.MAX_SAFE_INTEGER, nextGeomD - 40);
        const offsets = [0, 16, 24, 32];
        let bestAt = -1, bestScore = Number.POSITIVE_INFINITY, bestDist = Number.POSITIVE_INFINITY;
        for (let x = pD + 380; x + 40 <= candidateEnd; x++) {
          let ok = true;
          const values: number[] = [];
          for (const k of offsets) {
            const v = donorView.getFloat64(x + k, true);
            if (!Number.isFinite(v) || !(v === 0 || (Math.abs(v) >= 1e-6 && Math.abs(v) <= 1e4))) { ok = false; break; }
            values.push(v);
          }
          if (!ok) continue;
          let score = 0;
          for (let k = 0; k < 4; k++) score += Math.abs(targets[k] - values[k]);
          const dist = Math.abs(x - (pD + 481));
          if (score < bestScore || (score === bestScore && dist < bestDist)) { bestAt = x; bestScore = score; bestDist = dist; }
        }
        if (bestAt < 0) {
          transplant.b0Wins.slotNotFound++;
          throw new Error(`T-F3.3d B0-wins: döşeme ${w.name}:${w.nativeId} için A0 yük hattı yuvası bulunamadı.`);
        }
        transplant.b0Wins.slabLines++;
        const v3At = mapDonorToV3(bestAt);
        const fieldNames = ["live", "dead", "preservedA", "preservedB"];
        for (let k = 0; k < 4; k++) {
          const b0Value = targets[k];
          const a0Value = donorView.getFloat64(bestAt + offsets[k], true);
          if (b0Value === a0Value) continue;
          const ulp = classifyTransplantF64Pair(b0Value, a0Value) === "ulp";
          transplant.b0Wins.conflicts.push({ kind: `slabLine.${fieldNames[k]}`, v3Offset: v3At + offsets[k], a0Offset: bestAt + offsets[k], b0: String(b0Value), a0: String(a0Value), ulp });
          const bytes = new Uint8Array(8);
          new DataView(bytes.buffer).setFloat64(0, b0Value, true);
          for (let j = 0; j < 8; j++) {
            if (out[v3At + offsets[k] + j] !== bytes[j]) {
              out[v3At + offsets[k] + j] = bytes[j];
              transplant.b0Wins.slotBytesWritten++;
            }
          }
        }
      }
    }

    // 468 donatı bloğu: R4 kayıt listeleriyle (wall/beam dilim içinde, raft özniteliklerde).
    if (workFrame && donorFrame) {
      const sliceW = work.subarray(workFrame.endOffset, nextGeomW);
      const sliceD = donor.subarray(donorFrame.endOffset, nextGeomD);
      if (donorDiag.r4.wallRecords?.includes(i) && sliceW.length >= IDE10_WALL_REBAR_TAIL_OFFSET + 40 && sliceD.length >= IDE10_WALL_REBAR_TAIL_OFFSET + 40) {
        transplant.b0Wins.wallRebar++;
        const v3SliceAt = mapDonorToV3(donorFrame.endOffset);
        for (let j = 0; j < 40; j++) {
          const b0 = sliceW[IDE10_WALL_REBAR_TAIL_OFFSET + j];
          if (out[v3SliceAt + IDE10_WALL_REBAR_TAIL_OFFSET + j] !== b0) {
            out[v3SliceAt + IDE10_WALL_REBAR_TAIL_OFFSET + j] = b0;
            transplant.b0Wins.slotBytesWritten++;
          }
        }
      }
      if (donorDiag.r4.beamRecords?.includes(i)) {
        const atW = findIde10BeamRebarBlockInSlice(sliceW);
        const atD = findIde10BeamRebarBlockInSlice(sliceD);
        if (atW < 0 || atD < 0) {
          transplant.b0Wins.slotNotFound++;
          throw new Error(`T-F3.3d B0-wins: kiriş donatı bloğu ${w.name}:${w.nativeId} çözümlenemedi (v2 ${atW}, A0 ${atD}).`);
        }
        transplant.b0Wins.beamRebar++;
        const v3SliceAt = mapDonorToV3(donorFrame.endOffset);
        for (let j = 0; j < IDE10_BEAM_REBAR_RECORD_LENGTH; j++) {
          const b0 = sliceW[atW + j];
          if (out[v3SliceAt + atD + j] !== b0) {
            out[v3SliceAt + atD + j] = b0;
            transplant.b0Wins.slotBytesWritten++;
          }
        }
      }
    }
    if (donorDiag.r4.raftRecords?.includes(i)) {
      transplant.b0Wins.raftRebar++;
      const v3At = mapDonorToV3(pD + IDE10_RAFT_REBAR_ATTR_OFFSET);
      for (let j = 0; j < 16; j++) {
        const b0 = work[pW + IDE10_RAFT_REBAR_ATTR_OFFSET + j];
        if (out[v3At + j] !== b0) {
          out[v3At + j] = b0;
          transplant.b0Wins.slotBytesWritten++;
        }
      }
    }

    // Merdiven işaretçisi: çerçeveler v2'nin (kural 2) — v3'te sihir 201094 +
    // önyazı [1][1][0] denetlenir (plan bayrak 0 + hedef sürüm yazar).
    if (w.primitiveType === 40 && workFrame) {
      const frameIdx = framesW.indexOf(workFrame);
      const v3FrameStart = v3GapStarts[frameIdx] + (framesD[frameIdx].offset - donorGapStarts[frameIdx]);
      if (
        outView.getUint32(v3FrameStart, true) === IDE10_VERSION &&
        out[v3FrameStart - 3] === 1 && out[v3FrameStart - 2] === 1 && out[v3FrameStart - 1] === 0
      ) {
        transplant.b0Wins.stairMarkers++;
      }
    }

    // --- A0-kalıntı envanteri: geometri f64 alanları (noktalar + nativeZ + genişlik).
    // Sınıflandırma: bit-özdeş / yeniden hesap (|Δ| ≤ 1e-9 — t33 oracle close()
    // toleransı; v11 yeniden hesap sınıfının ölçütlü karşılığı) / gerçek değer
    // çatışması (10,67↔11,15 sınıfı). strictUlp = bit uzaklığı ≤ 1 ULP.
    const wTail = w.geometryOffset + 8 + w.points.length * 16;
    const dTail = d.geometryOffset + 8 + d.points.length * 16;
    const compareField = (field: string, wOffset: number, dOffset: number) => {
      const b0Value = workView.getFloat64(wOffset, true);
      const a0Value = donorView.getFloat64(dOffset, true);
      transplant.a0Remnants.geometryCompared++;
      if (b0Value === a0Value) {
        transplant.a0Remnants.geometryBitExact++;
        return;
      }
      if (!Number.isFinite(b0Value) || !Number.isFinite(a0Value)) return;
      const strictUlp = classifyTransplantF64Pair(b0Value, a0Value) === "ulp";
      const recompute = Math.abs(b0Value - a0Value) <= 1e-9;
      if (remnantFull()) return;
      const item = { field: `${w.name}:${w.nativeId}.${field}`, v3Offset: mapDonorToV3(dOffset), a0Offset: dOffset, b0Value, a0Value, strictUlp };
      if (recompute) transplant.a0Remnants.ulpItems.push(item);
      else transplant.a0Remnants.conflicts.push(item);
    };
    if (w.points.length === d.points.length) {
      for (let j = 0; j < w.points.length; j++) {
        compareField(`point[${j}].x`, w.geometryOffset + 8 + j * 16, d.geometryOffset + 8 + j * 16);
        compareField(`point[${j}].y`, w.geometryOffset + 16 + j * 16, d.geometryOffset + 16 + j * 16);
      }
    } else if (!remnantFull()) {
      transplant.a0Remnants.conflicts.push({
        field: `${w.name}:${w.nativeId}.points.length`, v3Offset: mapDonorToV3(dTail), a0Offset: dTail,
        b0Value: w.points.length, a0Value: d.points.length, strictUlp: false,
      });
    }
    compareField("nativeZ", wTail + 4, dTail + 4);
    compareField("width", wTail + 12, dTail + 12);
  }

  // --- Bölge Δlen doğrulaması (kural 3): v3 koşuları A0'nın koşuları. ---
  const v3Frames = scanIdeSubStreamFrames(out, IDE10_VERSION);
  if (v3Frames.length !== frameCount) {
    throw new Error(`T-F3.3d nakil sonrası: v3 gövdesinde ${v3Frames.length} çerçeve (beklenen ${frameCount}).`);
  }
  for (let i = 0; i <= frameCount; i++) {
    const a0Len = (i < frameCount ? framesD[i].offset : donor.length) - donorGapStarts[i];
    const v3Len = (i < frameCount ? v3Frames[i].offset : out.length) - v3GapStarts[i];
    const region = regionOfGap(i);
    transplant.regionLenDelta[region] = (transplant.regionLenDelta[region] ?? 0) + (v3Len - a0Len);
  }
  for (const [region, delta] of Object.entries(transplant.regionLenDelta)) {
    if (delta !== 0) {
      throw new Error(`T-F3.3d nakil kuralı 3 ihlali: bölge ${region} Δlen=${delta} (0 olmalı).`);
    }
  }

  transplant.applied = true;
  return out;
}

/** Donör v10 bölgelerini uygular ve birleşik gövdeyi döndürür. */
function applyIde10DonorRegions(
  work: Uint8Array,
  donor: Uint8Array,
  donorScan: Ide10BodyScan,
  encWorkView: DataView,
  sourceVersion: number,
  diagnostics: Ide10TranscodeDiagnostics,
): Uint8Array {
  const workScan = scanIde10BodyRecords(work);
  const donorRawView = new DataView(donor.buffer, donor.byteOffset, donor.byteLength);
  // Çerçeve geçişi bitti: her iki tarafta da 201094 sihri geçerli.
  const donorFrames = scanIdeSubStreamFrames(donor, IDE10_VERSION);
  const workFrames = scanIdeSubStreamFrames(work, IDE10_VERSION);
  const donorDiag: NonNullable<Ide10TranscodeDiagnostics["donor"]> = {
    bytes: donor.length,
    recordsMatched: 0,
    recordsWithStreams: 0,
    interRegions: 0,
    interRegionBytes: 0,
    preFloorSplice: { workFrom: 0, workTo: 0, donorFrom: 0, donorTo: 0 },
    r1: { records: 0, slotsBitExact: 0, slotsDonorFallback: 0, donorSlots: [], zarfDonorBytes: 0, preludeDonorBytes: 0 },
    r3: { patches: 0, patchesChangedBytes: 0, fieldsBitExact: false },
    r4: { wall: 0, beam: 0, raft: 0, blocksVerified: 0, blockMismatches: 0, tupleUnresolved: 0, wallRecords: [], beamRecords: [], raftRecords: [] },
    r5: { tables: 0, regionBytesEqual: false, headerBytesDonor: 0 },
    spectrum: { fieldsBitExact: false },
    wallOverridesFromDonor: 0,
  };
  diagnostics.donor = donorDiag;

  if (donorScan.records.length !== workScan.records.length) {
    throw new Error(`Donör/kaynak eleman kaydı sayısı uyuşmuyor: donör ${donorScan.records.length}, kaynak ${workScan.records.length}.`);
  }
  for (let i = 0; i < donorScan.records.length; i++) {
    const d = donorScan.records[i], w = workScan.records[i];
    if (d.nativeId !== w.nativeId || d.name !== w.name) {
      throw new Error(`Donör/kaynak kayıt sırası ${i}. adımda uyuşmuyor: donör ${d.name}:${d.nativeId}, kaynak ${w.name}:${w.nativeId}.`);
    }
  }
  donorDiag.recordsMatched = donorScan.records.length;
  donorDiag.wallOverridesFromDonor = workScan.records.filter(r => r.primitiveType === 17).length;

  const splices: IdeTranscodeSplice[] = [];

  // --- Ön-kat BELGE-GOVDE bloğu: v11 alan haritası kanıtsız → donör v10 bloğu. ---
  const workRawView = new DataView(work.buffer, work.byteOffset, work.byteLength);
  {
    const workNameLen = workRawView.getUint32(96, true);
    const workPreviewEnd = 116 + workNameLen + workRawView.getUint32(112 + workNameLen, true);
    const donorNameLen = donorRawView.getUint32(96, true);
    const donorPreviewEnd = 116 + donorNameLen + donorRawView.getUint32(112 + donorNameLen, true);
    const workFrom = workPreviewEnd;
    const workTo = workScan.floors[0].nameOffset - 4;
    const donorFrom = donorPreviewEnd;
    const donorTo = donorScan.floors[0].nameOffset - 4;
    let content = donor.slice(donorFrom, donorTo);
    donorDiag.preFloorSplice = { workFrom, workTo, donorFrom, donorTo };

    // R3 (ön-kat ayarları): kaynak değerlerini çöz, builder yamalarıyla donör
    // bloğuna uygula (eş proje: bayt değişikliği 0 beklenir; fark gerçek farktır).
    donorDiag.r3 = applyIde10R3Patches(content, work, encWorkView, workFrom, workTo, sourceVersion);
    splices.push({ start: workFrom, end: workTo, replacement: content });
  }

  // --- R1 malzeme bölgesi: zarf + F9 önyazısı donör; sözlük builder ile kaynaktan. ---
  applyIde10R1Region(work, encWorkView, workRawView, donor, donorRawView, workFrames, splices, donorDiag);

  // --- R4: kayıt-arası bölgeler donör + builder doğrulaması (468 donatı). ---
  applyIde10RebarInterRegions(work, encWorkView, workRawView, workScan, donorScan, donor, donorRawView, workFrames, donorFrames, splices, donorDiag);

  // --- R5: modal bölge — anlamsal alanlar kaynaktan (bit-özdeş), opak başlıklar donör. ---
  applyIde10ModalRegion(work, encWorkView, donor, donorRawView, splices, donorDiag);

  // --- Tayf: DSF1 ss/s1/sds/sd1 kaynakta kodlu → düz yaz + donörle doğrula. ---
  {
    const workDsf = findAsciiBytes(work, "DSF1\0", work.length - 700_000, work.length);
    const donorDsf = findAsciiBytes(donor, "DSF1\0", donor.length - 700_000, donor.length);
    if (workDsf >= 0 && donorDsf >= 0) {
      const offsets = [44, 52, 68, 76];
      let bitExact = true;
      for (const off of offsets) {
        const decoded = encWorkView.getFloat64(workDsf + 5 + off, true);
        workRawView.setFloat64(workDsf + 5 + off, decoded, true);
        if (decoded !== donorRawView.getFloat64(donorDsf + 5 + off, true)) bitExact = false;
      }
      donorDiag.spectrum = { fieldsBitExact: bitExact };
    }
  }

  return applyIdeBinarySplices(work, splices);
}

/**
 * R3: donör ön-kat bloğu içine ko-yuvası bazlı yamaları uygular.
 * Kaynak (v11) ko ankraj mesafesi: 211280 → 561, 211220 → 677 (T-F5.1 ölçümü);
 * v10 → 568 (R3 builder sözleşmesi). spectrumEnd bazlı yamalar kuyruk bölgesine
 * ait olduğundan ayrıca ele alınır (çağıran tarafta in-place düz çözüm + doğrulama).
 */
function applyIde10R3Patches(
  content: Uint8Array,
  work: Uint8Array,
  encWorkView: DataView,
  workFrom: number,
  workTo: number,
  sourceVersion: number,
): { patches: number; patchesChangedBytes: number; fieldsBitExact: boolean } {
  const koAnchorDistance = sourceVersion >= 211280 ? 561 : 677;
  const exposureClasses = ["XO", "X0", "XC1", "XC2", "XC3", "XC4", "XS1", "XS2", "XS3", "XF1", "XF2", "XF3", "XF4", "XA1", "XA2", "XA3", "XM1", "XM2", "XM3", "AC1", "AC2", "AC3", "AB1", "AB2", "AB3", "C1", "C2", "C3", "M1", "M2", "M3"];
  let donorClassStart = -1, donorClassLen = 0, exposureClass = "";
  for (const cls of exposureClasses) {
    const at = findAsciiBytes(content, `${cls}\0`, 0, content.length);
    if (at < 4) continue;
    const slen = new DataView(content.buffer, content.byteOffset, content.byteLength).getUint32(at - 4, true);
    if (slen === cls.length + 1) {
      donorClassStart = at;
      donorClassLen = cls.length;
      exposureClass = cls;
      break;
    }
  }
  if (donorClassStart < 0) return { patches: 0, patchesChangedBytes: 0, fieldsBitExact: false };
  // ko yuvası = sınıf baytları başlangıcı − (568 v10 / 561 v11-211280 / 677 v11-211220);
  // (çapa = sınıf başlangıcı − 4; koOff = çapa + 4 − mesafe — T-F5.1 ölçümü).
  const donorKo = donorClassStart - 568;
  const workClassStart = findAsciiBytes(work, `${exposureClass}\0`, workFrom, workTo);
  if (workClassStart < 0) return { patches: 0, patchesChangedBytes: 0, fieldsBitExact: false };
  const workKo = workClassStart - koAnchorDistance;
  const settingsOffsets: Record<string, number> = {
    rEntered: -49, rSelectedRatio: -41, liveLoadFactorN: -8,
    subgradeKoTfM3: 0, bearingCapacityQtTfM2: 8, importanceI: 34,
  };
  const dec = (at: number) => encWorkView.getFloat64(at, true);
  const input: Ide10R3SeismicInput = {
    exposureClass,
    rEntered: dec(workKo + settingsOffsets.rEntered),
    rSelectedRatio: dec(workKo + settingsOffsets.rSelectedRatio),
    liveLoadFactorN: dec(workKo + settingsOffsets.liveLoadFactorN),
    subgradeKoTfM3: dec(workKo + settingsOffsets.subgradeKoTfM3),
    bearingCapacityQtTfM2: dec(workKo + settingsOffsets.bearingCapacityQtTfM2),
    importanceI: dec(workKo + settingsOffsets.importanceI),
    spectrumId: "DSF1",
    ss: 0, s1: 0, sds: 0, sd1: 0,
  };
  // Tayf değerleri kuyruktan okunur (spectrumEnd bazlı yamalar içeride değil).
  const workDsf = findAsciiBytes(work, "DSF1\0", work.length - 700_000, work.length);
  if (workDsf >= 0) {
    input.ss = dec(workDsf + 5 + 44);
    input.s1 = dec(workDsf + 5 + 52);
    input.sds = dec(workDsf + 5 + 68);
    input.sd1 = dec(workDsf + 5 + 76);
  } else {
    const workRsf = findAsciiBytes(work, "RSF1\0", work.length - 700_000, work.length);
    if (workRsf < 0) return { patches: 0, patchesChangedBytes: 0, fieldsBitExact: false };
    input.spectrumId = "RSF1";
    input.ss = dec(workRsf + 5 + 44);
    input.s1 = dec(workRsf + 5 + 52);
    input.sds = dec(workRsf + 5 + 68);
    input.sd1 = dec(workRsf + 5 + 76);
  }
  const patches = buildIde10R3SeismicPatches(input);
  let changedBytes = 0;
  let fieldsBitExact = true;
  for (const patch of patches) {
    if (patch.base !== "koSlot") continue; // spectrumEnd yamaları kuyruk bölgesinde
    const at = donorKo + patch.offset;
    if (at < 0 || at + patch.bytes.length > content.length) continue;
    for (let j = 0; j < patch.bytes.length; j++) {
      if (content[at + j] !== patch.bytes[j]) {
        content[at + j] = patch.bytes[j];
        changedBytes++;
        fieldsBitExact = false;
      }
    }
  }
  return { patches: patches.filter(p => p.base === "koSlot").length, patchesChangedBytes: changedBytes, fieldsBitExact };
}

/**
 * R1: [donör zarf][builder sözlüğü][donör F9 önyazısı] içeriğiyle kaynağın
 * R1 komşuluğunu değiştirir. Sözlük 14 f64 yuvası kaynaktan çözülür; FP ters
 * dönüşü bit-özdeş olmayan yuvalar donör gerçek değeriyle tamamlanır (donorSlots).
 */
function applyIde10R1Region(
  work: Uint8Array,
  encWorkView: DataView,
  workRawView: DataView,
  donor: Uint8Array,
  donorRawView: DataView,
  workFrames: Array<{ offset: number; endOffset: number; rawLength: number }>,
  splices: IdeTranscodeSplice[],
  donorDiag: NonNullable<Ide10TranscodeDiagnostics["donor"]>,
): void {
  const workZt = findAsciiBytes(work, "TEMEL TASARIM ZARFI\0", 0, work.length);
  const donorZt = findAsciiBytes(donor, "TEMEL TASARIM ZARFI\0", 0, donor.length);
  if (workZt < 0 || donorZt < 0) return;
  const TF_CM2 = 0.0980665, TF_M2 = 0.00980665;
  const count = workRawView.getUint32(workZt + 802, true);
  const donorCount = donorRawView.getUint32(donorZt + 802, true);
  if (count !== donorCount || count < 1 || count > 64) return;
  const records: Ide10R1MaterialRecordInput[] = [];
  let workCursor = workZt + 806, donorCursor = donorZt + 806;
  let slotsBitExact = 0, slotsDonorFallback = 0;
  const donorSlots: string[] = [];
  for (let i = 0; i < count; i++) {
    const workSlen = workRawView.getUint32(workCursor + 9, true);
    const donorSlen = donorRawView.getUint32(donorCursor + 9, true);
    if (workSlen !== donorSlen) return;
    const nativeId = workRawView.getUint32(workCursor, true);
    const kind = (workRawView.getUint32(workCursor + 4, true) === 1 ? 1 : 0) as 0 | 1;
    const name = decodeCp1254(work.subarray(workCursor + 13, workCursor + 13 + workSlen - 1));
    const workFloats = workCursor + 13 + workSlen;
    const donorFloats = donorCursor + 13 + donorSlen;
    const dec = (off: number) => encWorkView.getFloat64(workFloats + off, true);
    // v11 128B grid → v10 112B/14 f64 kaydı (T-F5.1 ölçümü + bu görevin ölçümü):
    // raw0/1/2 birim dönüşümlü (MPa→tf/cm²), raw12 (MPa→tf/m²), diğerleri bit-özdeş.
    const derived: number[] = [
      dec(0) / TF_CM2, dec(12) / TF_CM2, dec(24) / TF_CM2,
      dec(36), dec(44), dec(52), dec(60), dec(68), dec(76), dec(84), dec(92), dec(100),
      dec(108) / TF_M2, dec(120),
    ];
    const floats: number[] = [];
    for (let s = 0; s < 14; s++) {
      const donorValue = donorRawView.getFloat64(donorFloats + s * 8, true);
      if (derived[s] === donorValue) {
        floats.push(derived[s]);
        slotsBitExact++;
      } else {
        // FP ters dönüş bit-özdeş değil → donör v10 gerçek değeri (aynı proje).
        floats.push(donorValue);
        slotsDonorFallback++;
        donorSlots.push(`${name}.raw${s}`);
      }
    }
    records.push({ nativeId, kind, name, floats });
    workCursor += 13 + workSlen + 128;
    donorCursor += 13 + donorSlen + 112;
  }
  const dictBytes = buildIde10R1MaterialTable(records);
  const donorDictEnd = donorCursor;
  // Donör içerik: zarf bölgesi [donorZt+20 .. +802) (sayaca kadar) + builder
  // sözlüğü ([u32 count] dahil) + F9 önyazısı 43B.
  const zarf = donor.slice(donorZt + 20, donorZt + 802);
  const prelude = donor.slice(donorDictEnd, donorDictEnd + 43);
  const content = new Uint8Array(zarf.length + dictBytes.length + prelude.length);
  content.set(zarf, 0);
  content.set(dictBytes, zarf.length);
  content.set(prelude, zarf.length + dictBytes.length);
  // Kaynak tarafta değiştirilecek aralık: [workZt+20 .. ilk F9 çerçevesi).
  const workDictEnd = workCursor;
  const nextFrame = workFrames.find(f => f.offset >= workDictEnd);
  if (!nextFrame) return;
  splices.push({ start: workZt + 20, end: nextFrame.offset, replacement: content });
  donorDiag.r1 = {
    records: count,
    slotsBitExact,
    slotsDonorFallback,
    donorSlots,
    zarfDonorBytes: zarf.length,
    preludeDonorBytes: prelude.length,
  };
}

/**
 * R4: her akış taşıyan kayıt için kayıt-arası bölgeyi donörden geçirir; dondurulmuş
 * donör dilimi içindeki v10 donatı bloğunu kaynağın v11 tuple'ından üretilen
 * builder çıktısıyla çapraz doğrular (uyuşmazlıkta blok donör dilimine yazılır).
 */
function applyIde10RebarInterRegions(
  work: Uint8Array,
  encWorkView: DataView,
  workRawView: DataView,
  workScan: Ide10BodyScan,
  donorScan: Ide10BodyScan,
  donor: Uint8Array,
  donorRawView: DataView,
  workFrames: Array<{ offset: number; endOffset: number; rawLength: number }>,
  donorFrames: Array<{ offset: number; endOffset: number; rawLength: number }>,
  splices: IdeTranscodeSplice[],
  donorDiag: NonNullable<Ide10TranscodeDiagnostics["donor"]>,
): void {
  const donorInterEnd = lastRecordInterEnd(donorScan, donorFrames);
  const workInterEnd = lastRecordInterEnd(workScan, workFrames);
  donorDiag.r4.wallRecords = donorDiag.r4.wallRecords ?? [];
  donorDiag.r4.beamRecords = donorDiag.r4.beamRecords ?? [];
  donorDiag.r4.raftRecords = donorDiag.r4.raftRecords ?? [];
  for (let i = 0; i < workScan.records.length; i++) {
    const w = workScan.records[i], d = donorScan.records[i];
    const nextGeomW = i + 1 < workScan.records.length ? workScan.records[i + 1].geometryOffset : workInterEnd;
    const nextGeomD = i + 1 < donorScan.records.length ? donorScan.records[i + 1].geometryOffset : donorInterEnd;
    const workFrame = lastFrameInRange(workFrames, w.nameOffset, nextGeomW);
    const donorFrame = lastFrameInRange(donorFrames, d.nameOffset, nextGeomD);
    if (!workFrame || !donorFrame) continue;
    donorDiag.recordsWithStreams++;
    let slice: Uint8Array = donor.slice(donorFrame.endOffset, nextGeomD);
    const attributesOffsetW = w.nameOffset + w.name.length + 1;
    const attributesOffsetD = d.nameOffset + d.name.length + 1;
    const foundationW = (workRawView.getUint32(attributesOffsetW + 8, true) & 0x00200000) !== 0;
    let tuple: Ide11RebarTuple | undefined;
    if (w.primitiveType === 17) {
      tuple = readIde11RebarTuple(work, encWorkView, workRawView, workFrame.endOffset, attributesOffsetW, "wall");
      if (tuple) {
        donorDiag.r4.wall++;
        donorDiag.r4.wallRecords!.push(i);
        const built = buildIde10WallRebarRecord(tuple.wall!);
        const at = IDE10_WALL_REBAR_TAIL_OFFSET;
        slice = patchSliceIfDifferent(slice, at, built, donorDiag);
      }
    } else if (w.primitiveType === 5) {
      tuple = readIde11RebarTuple(work, encWorkView, workRawView, workFrame.endOffset, attributesOffsetW, "beam");
      if (tuple) {
        donorDiag.r4.beam++;
        const at = findIde10BeamRebarBlockInSlice(slice);
        if (at < 0) { donorDiag.r4.tupleUnresolved++; } else {
          donorDiag.r4.beamRecords!.push(i);
          const built = buildIde10BeamRebarRecord({
            ...tuple.beam!,
            intermediates: { at32: slice.slice(at + 32, at + 44), at56: slice.slice(at + 56, at + 68) },
          });
          slice = patchSliceIfDifferent(slice, at, built, donorDiag);
        }
      }
    } else if (w.primitiveType === 7 && foundationW) {
      tuple = readIde11RebarTuple(work, encWorkView, workRawView, workFrame.endOffset, attributesOffsetW, "raft");
      if (tuple) {
        donorDiag.r4.raft++;
        donorDiag.r4.raftRecords!.push(i);
        // Radye bloğu kayıt özniteliklerinde (+960), kayıt-arası dilimde değil.
        const donorRaft = donor.slice(attributesOffsetD + 960, attributesOffsetD + 976);
        const built = buildIde10RaftRebarRecord(tuple.raft!);
        const raftSlice = patchSliceIfDifferent(donorRaft, 0, built, donorDiag);
        splices.push({ start: attributesOffsetW + 960, end: attributesOffsetW + 976, replacement: raftSlice });
      }
    }
    splices.push({ start: workFrame.endOffset, end: nextGeomW, replacement: slice });
    donorDiag.interRegions++;
    donorDiag.interRegionBytes += slice.length;
  }
}

/** Son eleman kaydının kayıt-arası bölge sınırı: #1885 çerçevesi (biçim-bağımsız blok). */
function lastRecordInterEnd(scan: Ide10BodyScan, frames: Array<{ offset: number; endOffset: number; rawLength: number }>): number {
  const lastRecord = scan.records[scan.records.length - 1];
  const frame = lastFrameInRange(frames, lastRecord.nameOffset, Number.MAX_SAFE_INTEGER);
  if (frame) {
    const after = frames.find(f => f.offset >= frame.endOffset);
    if (after) return after.offset;
  }
  return frames.length ? frames[frames.length - 1].offset : scan.records[scan.records.length - 1].nameOffset;
}

function lastFrameInRange(
  frames: Array<{ offset: number; endOffset: number; rawLength: number }>,
  from: number,
  to: number,
): { offset: number; endOffset: number; rawLength: number } | undefined {
  let found: { offset: number; endOffset: number; rawLength: number } | undefined;
  for (const f of frames) {
    if (f.offset < from) continue;
    if (f.offset >= to) break;
    found = f;
  }
  return found;
}

/** v10 kiriş donatı bloğunu dilim içinde bulur (okuyucu kuralları: p−4/p−8 sıfır + imzalar). */
function findIde10BeamRebarBlockInSlice(slice: Uint8Array): number {
  const view = new DataView(slice.buffer, slice.byteOffset, slice.byteLength);
  const scanEnd = slice.length - IDE10_BEAM_REBAR_RECORD_LENGTH;
  for (let p = 32; p <= scanEnd; p++) {
    const topDia = view.getInt32(p, true);
    const topCount = view.getInt32(p + 4, true);
    const botDia = view.getInt32(p + 20, true);
    const botCount = view.getInt32(p + 24, true);
    const stDia = view.getInt32(p + 80, true);
    const sp0 = view.getInt32(p + 84, true);
    const sp1 = view.getInt32(p + 88, true);
    if (
      REBAR_DIA_MM_SET.has(topDia) && REBAR_DIA_MM_SET.has(botDia) &&
      topCount >= 1 && topCount <= 24 && botCount >= 1 && botCount <= 24 &&
      STIRRUP_DIA_MM_SET.has(stDia) && sp0 >= 4 && sp0 <= 40 && sp1 >= 4 && sp1 <= 40 &&
      view.getInt32(p - 4, true) === 0 && view.getInt32(p - 8, true) === 0
    ) {
      return p;
    }
  }
  return -1;
}

/** Dilim içindeki bloğu builder çıktısıyla karşılaştırır; fark varsa düzelt (kaynak değeri kazanır). */
function patchSliceIfDifferent(
  slice: Uint8Array,
  at: number,
  built: Uint8Array,
  donorDiag: NonNullable<Ide10TranscodeDiagnostics["donor"]>,
): Uint8Array {
  let equal = true;
  for (let j = 0; j < built.length; j++) {
    if (slice[at + j] !== built[j]) { equal = false; break; }
  }
  if (equal) {
    donorDiag.r4.blocksVerified++;
    return slice;
  }
  const copy = slice.slice(0);
  copy.set(built, at);
  donorDiag.r4.blockMismatches++;
  return copy;
}

/**
 * R5: modal bölge — frekanslar ve 18×f64 kayıtları kaynaktan ÇÖZÜLEREK yazılır
 * (ölçüm: 10/10 tablo frekans+kayıt bit-özdeş), 104B opak başlıklar + tablo-arası
 * kuyruk baytları alan-düzeyinde kanıtsız olduğundan donörden geçirilir.
 */
function applyIde10ModalRegion(
  work: Uint8Array,
  encWorkView: DataView,
  donor: Uint8Array,
  donorRawView: DataView,
  splices: IdeTranscodeSplice[],
  donorDiag: NonNullable<Ide10TranscodeDiagnostics["donor"]>,
): void {
  const workRegion = decodeIde10R5ModalRegion(work, encWorkView, work.length - 700_000, work.length);
  const donorRegion = decodeIde10R5ModalRegion(donor, donorRawView, donor.length - 700_000, donor.length);
  if (!workRegion || !donorRegion) return;
  if (workRegion.tables.length !== donorRegion.tables.length) {
    throw new Error(`Modal tablo sayısı uyuşmuyor: kaynak ${workRegion.tables.length}, donör ${donorRegion.tables.length}.`);
  }
  const tables = workRegion.tables.map((t, i) => ({
    name: t.name,
    header: donorRegion.tables[i].header,
    modeCount: t.modeCount,
    frequenciesHz: t.frequenciesHz,
    modeRows: t.modeRows,
  }));
  const built = buildIde10R5ModalRegion({ regionStart: workRegion.regionStart, regionEnd: workRegion.regionEnd, tables, interSegments: donorRegion.interSegments });
  const donorSpan = donor.slice(donorRegion.regionStart, donorRegion.regionEnd);
  let regionBytesEqual = built.length === donorSpan.length;
  if (regionBytesEqual) {
    for (let j = 0; j < built.length; j++) {
      if (built[j] !== donorSpan[j]) { regionBytesEqual = false; break; }
    }
  }
  splices.push({ start: workRegion.regionStart, end: workRegion.regionEnd, replacement: built });
  donorDiag.r5 = {
    tables: tables.length,
    regionBytesEqual,
    headerBytesDonor: tables.reduce((sum, t) => sum + t.header.length, 0),
  };
}
