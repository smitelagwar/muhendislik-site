/**
 * T-F7.1 — KALICI IDE KABUL KAPISI (G7; 11-KABUL-VE-KANIT-PROTOKOLU.md §3)
 *
 * Tek komutla uçtan uca kabul zinciri (G7: F3+F4+F6 senaryolarının TÜMÜ):
 *   A0 ÜRET  : convert_trial_to_native ile B0_orijinal.ide11trial → .ide10 + .ide11
 *              (donör A0; çıktılar daima YENİ adla kanıt klasörüne)
 *   B  ÖLÇ   : probe-attribute-streams (30.260) + ide-fidelity-audit her çıktıya
 *              + çift farkları HS↔A0 ve HS↔X11 (compare-pairs'ın alan-düzeyi
 *              karşılaştırma motoru; taze çıktı etiketleriyle)
 *   B2 YAMA  : F6 ayağı — kapının KENDİ .ide11 çıktısında ilk K34 kirişinin
 *              beamSectionHeight alanı 0.50→0.55 (saveNativeIdeOutput; T-F6.1
 *              deseni): bayt kapsamı 12 B (8 alan + 4 CRC; kapsam dışı 0),
 *              parse K34=0.55 + diğer kat K34'leri değişmez, CRC mührü geçerli
 *   C  MASAÜSTÜ: desktop.py ile İKİ açılış — (1) üretilen .ide10 (F3 ayağı),
 *              (2) yamalı .ide11 (F6/F4 bacakları; T-F6.3 deseni): başlık +
 *              kat ağacı + kapama ölçütleri (JSON+PNG kanıt) — bayrakla
 *              atlanabilir (--skip-desktop; CI profili) AMA varsayılan AÇIK
 *   D  KANIT : her aşamanın çıktısı evidence\orkestrasyon\<tarih>-acceptance-gate\
 *              altına yazılır (README + ham çıktılar)
 *   E  ÖZET  : tek ekrana rapor — ölçüt → ölçülen → GEÇTİ/KIRMIZI;
 *              herhangi biri KIRMIZI → exit ≠ 0
 *
 * KAPI SÖZLEŞMESİ:
 *   - Ölçütler 11-KABUL-VE-KANIT-PROTOKOLU.md §2'den SAPTIRILAMAZ; ölçüt
 *     sabitleri tek tabloda (ORACLE) tutulur.
 *   - Masaüstü aşaması başarısızsa KIRMIZI ("ertelendi-raporlandı" profili YOK).
 *     Açık ideCAD oturumu varsa masaüstü aşaması koşulamaz → KIRMIZI.
 *   - --skip-desktop yalnız CI/hızlı koşu profiliidir: "desktop: SKIPPED"
 *     KIRMIZI sayılmaz ama özet "tam kabul profili DEĞİLDİR" notu taşır.
 *
 * SÜRÜM NOTLARI (oracle ekleme/çıkarma yalnız buraya işlenir):
 *   v1 — 2026-11-19 (T-F7.1): ilk tablo; 11-KABUL §2 dönüşüm ölçütleri tek tek
 *        işlenmiştir — 30.260 / 468 / 2 / 10 / 10 / 1.266 / 6/6 / 159 / boyut
 *        bandı / XX uydurma 0 / HS↔X11 geometri-etiket-yük 0 / CRC / masaüstü;
 *        F9'suz rapor + metraj oracle satırları kapı senaryoları dışında olup
 *        G3'ün iderpt bayt-özdeş kanıtına bağlıdır.
 *   v2 — 2026-11-19 (T-F7.1 ilk tam koşu): 11-KABUL §2 "1.266/1.266 geometri"
 *        değeri merdiven ayrıştırılmadan ÖNCEKİ okuyucu sayımıdır; güncel okuyucu
 *        7 merdiveni de eleman sayar (T3.3d kanıtı: "geometri 1.266+7") ve
 *        TAMAMI (1.273) geometri/etiket düzeyinde A0 ile eşittir. Ölçüt bu yüzden
 *        1.266 çekirdek + 7 merdiven = 1.273 toplam sayımı üzerinden ölçülür;
 *        çekirdek değer (1.266) tabloda korunur. Diğer ölçütler değişmedi.
 *   v3 — 2026-11-19 (T-F7.1b): G7 ölçütüne F6 (yama roundtrip) ayağı eklendi:
 *        ilk K34 beamSectionHeight 0.50→0.55; bayt kapsamı 12 = 8 alan + 4 CRC
 *        (kapsam dışı 0); parse K34=0.55 + diğer kat K34'leri değişmez; CRC
 *        mührü geçerli (kaynak: 11-KABUL §3 G6 + T-F6.1 bayt kanıtı). C masaüstü
 *        ayağı İKİ açılışa genişletildi (üretilen .ide10 + yamalı .ide11; her
 *        açılışta başlık + kat ağacı + kapama). --negatif-test sözleşmesi
 *        KORUNDU (yalnız .ide10 stored-CRC bozulur); yama ayağı negatif ve
 *        --skip-desktop profillerinde de koşar (makine ölçümleri masaüstünden
 *        bağımsızdır; yama girdisi sağlamsa F satırları izolasyonla yeşildir).
 *   v4 — 2026-11-19 (K2 onarım turu; KARAR-001 hükmü (B)): isteğe bağlı
 *        `--oracle-json <profil>` bayrağı. MS1'e donuk sabitler (sayımlar, boyut
 *        bantları, masaüstü başlık/kat, F6 yama hedefi) eşli ticari donörden
 *        ölçülen profil dosyasıyla doğrulamalı birleşir (yalnız bilinen
 *        anahtarlar; bilinmeyen anahtar/yanlış tip/eksik anahtar → sert hata).
 *        Profil `x11: null` → B14–B16 "X11-YOK (ölçülemez)" sınıfı (SAPMA-A:
 *        KIRMIZI da GEÇTİ de sayılmaz; X11 varlık kontrolü atlanır; özet dürüst
 *        not taşır). Profil üretimi: scripts/hsyncad/ide-oracle-profile.ts
 *        (YFS-1: değerler donörden ölçülür, elle sayı uydurma yasak).
 *        Varsayılan davranış (bayrak yok) bayt bayt aynı; gömülü K1 profili
 *        ve 29-ölçüt sözleşmesi DEĞİŞMEDİ.
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { verifyIdeHeaderChecksum } from "../../src/lib/hsyncad/ide-import/ide-binary-codec";
import { parseIde10 } from "../../src/lib/hsyncad/ide-import";
import { saveNativeIdeOutput } from "../../src/lib/hsyncad/ide-native-save";

// ─────────────────────────────────────────────────────────────────────────────
// ORACLE — 11-KABUL §2 "Oracle değerler" (MUSTAFA SELVİ 1.KISIM referans seti).
// Tek tablo; SAPTIRILAMAZ. Değişiklik ← yalnız açık sürüm notuyla (üst başlık).
// ─────────────────────────────────────────────────────────────────────────────
export const ORACLE = {
  attributeStreams: 30260,        // `.ide10` çıktısındaki 201094 alt-akış sayısı (A0 ile aynı)
  streamCompressedBytes: 115_300_000,  // ~115,3 MB sıkışmış (±%1)
  streamRawBytes: 411_700_000,    // ~411,7 MB açılmış (±%1)
  streamSizeTolerancePct: 1,
  rebarBlocks: 468,               // 178 perde + 289 kiriş + 1 radye (R4)
  materials: 2,                   // C25 B420C + S235 (R1) + eleman↔malzeme eşlemi
  seismicFields: 10,              // rEntered, rSelectedRatio, n, ko, qt, I, ss, s1, sds, sd1 (R3)
  f9ModalTables: 10,              // R5; frekans sapması ≤ 1e-9
  f9MaxFrequencyDeviation: 1e-9,
  elementsCore: 1266,             // 11-KABUL §2 çekirdek sayımı (merdiven öncesi okuyucu)
  elementsStairs: 7,              // merdiven (güncel okuyucu elemanları; t33d: "1.266+7")
  elements: 1273,                 // 1.266 çekirdek + 7 merdiven (v2 notuna bakınız)
  floors: 6,                      // Asansör Mak. Dairesi dahil
  labels: 1273,                   // kesit etiketi (1.266 çekirdek + 7; donör kaynaklı); uydurma yok
  slabLoads: 159,                 // döşeme yükü
  xxFabricatedLabels: 0,          // ölçüm: HS↔A0 labelDiff (donör-kaynaklı birebirlik)
  ide11GeometryLabelLoadDiff: 0,  // HS↔X11 (§2 ".ide11 yönlü fark ölçütü")
  carrierChecksumValid: true,     // her çıktıda taşıyıcı CRC'si geçerli
  desktopProjectTitle: "MUSTAFA SELVİ",  // pencere başlığı: proje adı + aktif kat
  desktopFloors: 6,               // gerçek ideCAD kat ağacında 6 kat düğümü
  // F6 yama senaryosu (v3; kaynak: 11-KABUL §3 G6 + T-F6.1 bayt kanıtı):
  patchBeamName: "K34",           // ilk K34 kirişi (T-F6.1: ide-floor-1:6129433, 3. KAT)
  patchFromHeight: 0.5,          // 0.50 m kaynak kesit yüksekliği (kesit 25/50)
  patchToHeight: 0.55,           // 0.55 m yama değeri (kesit 25/55)
  patchFieldBytes: 8,             // tipli f64 alan, yerinde yazım (alan@ad+266)
  patchCrcBytes: 4,               // yeniden mühürlenen taşıyıcı CRC'si (@83..86)
  patchChangedBytes: 12,          // 8 alan + 4 CRC; kapsam dışı 0 (T-F6.1 diff kanıtı)
} as const;

/** 11-KABUL §2 R3 alan adları (repo okuyucu adlarıyla birebir). */
export const SEISMIC_ORACLE_FIELDS = [
  "rEntered", "rSelectedRatio", "liveLoadFactorN", "subgradeKoTfM3",
  "bearingCapacityQtTfM2", "importanceI", "ss", "s1", "sds", "sd1",
] as const;

// ─────────────────────────────────────────────────────────────────────────────
// ORACLE PROFİL KATMANI (v4; KARAR-001 hükmü (B) — K2 onarım turu).
// 11-KABUL §6: "sabit sayılar proje özine göre yeniden okunur". --oracle-json
// verilirse MS1'e donuk ölçüm sabitleri profil değerleriyle birleşir; bayrak
// yoksa davranış bayt bayt aynı kalır (K1 profili bozulmaz).
// ─────────────────────────────────────────────────────────────────────────────

/** Gömülü ORACLE tablosunun genişletilmiş tipi (profil birleşmesine izin verir). */
export type OracleConstants = {
  [K in keyof typeof ORACLE]:
    typeof ORACLE[K] extends string ? string :
    typeof ORACLE[K] extends boolean ? boolean : number;
};

/** Profilde birleştirilebilen (proje-kilitli) oracle anahtarları. */
export const ORACLE_PROFILE_MERGE_KEYS = [
  "attributeStreams", "streamCompressedBytes", "streamRawBytes",
  "rebarBlocks", "materials", "f9ModalTables",
  "elementsCore", "elementsStairs", "elements",
  "floors", "labels", "slabLoads",
  "desktopProjectTitle", "desktopFloors",
  "patchBeamName", "patchFromHeight", "patchToHeight",
] as const;

export type OracleMergeKey = typeof ORACLE_PROFILE_MERGE_KEYS[number];

/** Profil dosyasının ham biçimi (ide-oracle-profile.ts üretir; gate doğrular). */
export interface OracleProfileFile {
  profileVersion: number;
  projectId: string;
  /** Ticari referans .ide11 yolu; null → B14–B16 X11-YOK sınıfı (SAPMA-A). */
  x11: string | null;
  /** Türetim kaynak belgeleri (YFS-1: her sayı nereden ölçüldü). */
  derivedFrom: { donorIde10: string; donorSha256: string } & Record<string, unknown>;
  oracle: Partial<Record<OracleMergeKey, number | string>>;
}

export interface OracleContext {
  /** Birleşmiş oracle sabitleri (profil yoksa gömülü ORACLE). */
  constants: OracleConstants;
  /** null → X11 ticari referans yok: B14–B16 X11-YOK (ölçülemez) sınıfı. */
  x11: string | null;
  projectId?: string;
  profilePath?: string;
  derivedFrom?: OracleProfileFile["derivedFrom"];
}

/** Varsayılan bağlam: gömülü K1 ORACLE'ı; X11 bekleniyor (preflight zorunlu). */
export const DEFAULT_ORACLE_CONTEXT: OracleContext = { constants: ORACLE, x11: "" };

const PROFILE_INTEGER_KEYS: readonly OracleMergeKey[] = [
  "attributeStreams", "streamCompressedBytes", "streamRawBytes",
  "rebarBlocks", "materials", "f9ModalTables",
  "elementsCore", "elementsStairs", "elements",
  "floors", "labels", "slabLoads", "desktopFloors",
];
const PROFILE_STRING_KEYS: readonly OracleMergeKey[] = ["desktopProjectTitle", "patchBeamName"];
const PROFILE_HEIGHT_KEYS: readonly OracleMergeKey[] = ["patchFromHeight", "patchToHeight"];

/**
 * Profil nesnesini sert doğrulamayla OracleContext'e çevirir.
 * Bilinmeyen anahtar / eksik anahtar / yanlış tip / tutarsız çapraz değer → hata.
 */
export function buildOracleContextFromRaw(raw: unknown, source: string): OracleContext {
  const fail = (why: string): never => {
    throw new Error(`oracle profili geçersiz (${source}): ${why}`);
  };
  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) fail("kök nesne değil");
  const obj = raw as Record<string, unknown>;
  const knownTop = ["profileVersion", "projectId", "x11", "derivedFrom", "oracle"] as const;
  for (const key of Object.keys(obj)) {
    if (!(knownTop as readonly string[]).includes(key)) fail(`bilinmeyen üst anahtar: '${key}'`);
  }
  if (obj.profileVersion !== 1) fail(`profileVersion 1 olmalı (bulunan: ${String(obj.profileVersion)})`);
  if (typeof obj.projectId !== "string" || obj.projectId.trim() === "") fail("projectId boş/dizgi değil");
  if (obj.x11 !== null && (typeof obj.x11 !== "string" || obj.x11.trim() === "")) {
    fail("x11 ya geçerli yol dizgisi ya da null olmalı");
  }
  const derived = obj.derivedFrom;
  if (derived === null || typeof derived !== "object" || Array.isArray(derived)) fail("derivedFrom nesne değil");
  if (typeof (derived as Record<string, unknown>).donorIde10 !== "string" || !((derived as Record<string, unknown>).donorIde10 as string).trim()) {
    fail("derivedFrom.donorIde10 boş/dizgi değil");
  }
  if (typeof (derived as Record<string, unknown>).donorSha256 !== "string" || !/^[0-9a-f]{64}$/.test((derived as Record<string, unknown>).donorSha256 as string)) {
    fail("derivedFrom.donorSha256 64 haneli hex değil");
  }
  const oracleRaw = obj.oracle;
  if (oracleRaw === null || typeof oracleRaw !== "object" || Array.isArray(oracleRaw)) fail("oracle nesnesi değil");
  const oracleObj = oracleRaw as Record<string, unknown>;
  for (const key of Object.keys(oracleObj)) {
    if (!(ORACLE_PROFILE_MERGE_KEYS as readonly string[]).includes(key)) {
      fail(`bilinmeyen oracle anahtarı: '${key}' (yalnız ${ORACLE_PROFILE_MERGE_KEYS.join(", ")} birleştirilebilir)`);
    }
  }
  for (const key of ORACLE_PROFILE_MERGE_KEYS) {
    if (!(key in oracleObj)) fail(`eksik oracle anahtarı: '${key}' (profil tam olmalı)`);
  }
  for (const key of PROFILE_INTEGER_KEYS) {
    const v = oracleObj[key];
    if (typeof v !== "number" || !Number.isSafeInteger(v) || v < 0) {
      fail(`'${key}' negatif-olmayan tam sayı olmalı (bulunan: ${typeof v === "number" ? v : typeof v})`);
    }
  }
  for (const key of PROFILE_STRING_KEYS) {
    const v = oracleObj[key];
    if (typeof v !== "string" || v.trim() === "") fail(`'${key}' boş-olmayan dizgi olmalı`);
  }
  for (const key of PROFILE_HEIGHT_KEYS) {
    const v = oracleObj[key];
    if (typeof v !== "number" || !Number.isFinite(v) || v <= 0) fail(`'${key}' pozitif sonlu sayı olmalı`);
  }
  if ((oracleObj.elements as number) !== (oracleObj.elementsCore as number) + (oracleObj.elementsStairs as number)) {
    fail("elements ≠ elementsCore + elementsStairs");
  }
  if ((oracleObj.patchToHeight as number) <= (oracleObj.patchFromHeight as number)) {
    fail("patchToHeight, patchFromHeight'ten büyük olmalı (yama değeri değişiklik olmalı)");
  }
  const constants: OracleConstants = { ...ORACLE, ...oracleObj } as OracleConstants;
  return {
    constants,
    x11: obj.x11 as string | null,
    projectId: obj.projectId as string,
    profilePath: source,
    derivedFrom: derived as OracleProfileFile["derivedFrom"],
  };
}

/** Profil dosyasını okuyup doğrular (sert hata → main().catch → FATAL). */
export function loadOracleContext(profilePath: string): OracleContext {
  if (!fs.existsSync(profilePath)) throw new Error(`oracle profil dosyası yok: ${profilePath}`);
  const raw: unknown = JSON.parse(fs.readFileSync(profilePath, "utf8"));
  return buildOracleContextFromRaw(raw, profilePath);
}

export type CriterionStatus = "GECTI" | "KIRMIZI" | "SKIPPED" | "X11-YOK";

export interface CriterionResult {
  stage: "A" | "B" | "F" | "C" | "D";
  id: string;
  criterion: string;
  target: string;
  measured: string;
  status: CriterionStatus;
  note?: string;
}

export interface PairDiffElements {
  matched: number; missingInB: number; extraInB: number;
  geometryEqual: number; geometryDiff: number;
  labelEqual: number; labelDiff: number;
  rebarBoth: number; rebarMismatch: number;
  loadsOnlyA: number; loadsOnlyB: number; loadsMismatch: number;
}

export interface PairDiff {
  elements: PairDiffElements;
  /** ide-fidelity-audit compare çıktısında matched/geometryDiff SAYIDIR (dizi değil). */
  floors: { matched: number; geometryDiff: number; onlyInA: unknown[]; onlyInB: unknown[] };
  materials: { countA: number; countB: number; diff: unknown[] };
  seismic: { presentA: boolean; presentB: boolean; diff: Array<{ field: string }> };
  f9: { tablesA: number; tablesB: number; maxFrequencyDeviation: number | null; tableDiff: unknown[] };
}

export interface CensusRow { file: string; attributeStreams: number; compressedBytes: number; rawBytes: number; }

export interface DesktopMeasurement {
  skipped: boolean;
  failNote?: string;
  mainTitle?: string;
  titleMustContain?: string[];
  floorsExpected?: string[];
  floorsFound?: string[];
  closedClean?: boolean;
  remainingProcesses?: number;
  integrityOk?: boolean;
  image?: string;
}

/** F6 yama ayağı ölçümleri (saveNativeIdeOutput; T-F6.1 deseni). */
export interface PatchMeasurement {
  ok: boolean;
  failNote?: string;
  targetId?: string;
  targetName?: string;
  targetFloor?: string;
  originalHeight?: number;
  patchedHeight?: number;
  changedBytes?: number;
  fieldBytes?: number;
  crcBytes?: number;
  outOfScopeBytes?: number;
  crcValid?: boolean;
  otherK34Count?: number;
  otherK34Changed?: number;
  patchedFile?: string;
  patchedSha?: string;
  elapsedMs?: number;
}

export interface MeasurementBundle {
  conversionOk: boolean;
  conversionError?: string;
  conversionDetail?: string;
  crcValid: { ide10: boolean; ide11: boolean };
  census: { ide10?: CensusRow; ide11?: CensusRow };
  pairHs10VsA0: PairDiff | null;
  pairHs11VsX11: PairDiff | null;
  /** slabLoads taşıyan eleman sayısı (HS .ide10 ve A0 parmak izlerinden). */
  slabLoadCount?: { hs10: number; a0: number };
  /** F6 yama ayağı ölçümleri (kapının kendi .ide11 çıktısında K34 yaması). */
  patch: PatchMeasurement;
  desktop: DesktopMeasurement;
  /** İkinci masaüstü açılışı: yamalı .ide11 (F6/F4 bacakları). */
  desktop11: DesktopMeasurement;
  corpusIntegrityOk: boolean;
  corpusIntegrityNote?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Saf değerlendirme katmanı (ölçüm demeti → ölçüt sonuçları).
// Test dosyası bu katmanı mock ölçümlerle sınar (negatif test sözleşmesi).
// ─────────────────────────────────────────────────────────────────────────────

const tr = (n: number): string => n.toLocaleString("tr-TR");

function crit(
  stage: CriterionResult["stage"], id: string, criterion: string, target: string,
  measured: string, status: CriterionStatus, note?: string,
): CriterionResult {
  return { stage, id, criterion, target, measured, status, ...(note ? { note } : {}) };
}

const RED_MISSING = (stage: string, id: string, criterion: string, target: string, why: string): CriterionResult =>
  crit(stage as CriterionResult["stage"], id, criterion, target, `ölçülemedi (${why})`, "KIRMIZI");

export function withinPct(measured: number, target: number, pct: number): boolean {
  return Math.abs(measured - target) <= target * (pct / 100);
}

/** HS(.ide10)↔A0 + HS(.ide11)↔X11 çift farkları + sayım → B aşaması ölçütleri. */
export function evaluateStageB(
  bundle: MeasurementBundle, ctx: OracleContext = DEFAULT_ORACLE_CONTEXT,
): CriterionResult[] {
  const o = ctx.constants;
  const out: CriterionResult[] = [];
  const c10 = bundle.census.ide10;

  out.push(c10
    ? crit("B", "B1", "201094 alt-akış sayısı (.ide10)", tr(o.attributeStreams),
      tr(c10.attributeStreams), c10.attributeStreams === o.attributeStreams ? "GECTI" : "KIRMIZI")
    : RED_MISSING("B", "B1", "201094 alt-akış sayısı (.ide10)", tr(o.attributeStreams), "probe census yok"));

  out.push(c10
    ? crit("B", "B2", "alt-akış sıkışmış boyut bandı (±%1)", `~${(o.streamCompressedBytes / 1e6).toFixed(1)} MB`,
      `${(c10.compressedBytes / 1e6).toFixed(1)} MB`, withinPct(c10.compressedBytes, o.streamCompressedBytes, o.streamSizeTolerancePct) ? "GECTI" : "KIRMIZI")
    : RED_MISSING("B", "B2", "alt-akış sıkışmış boyut bandı (±%1)", `~${(o.streamCompressedBytes / 1e6).toFixed(1)} MB`, "probe census yok"));

  out.push(c10
    ? crit("B", "B3", "alt-akış açılmış boyut bandı (±%1)", `~${(o.streamRawBytes / 1e6).toFixed(1)} MB`,
      `${(c10.rawBytes / 1e6).toFixed(1)} MB`, withinPct(c10.rawBytes, o.streamRawBytes, o.streamSizeTolerancePct) ? "GECTI" : "KIRMIZI")
    : RED_MISSING("B", "B3", "alt-akış açılmış boyut bandı (±%1)", `~${(o.streamRawBytes / 1e6).toFixed(1)} MB`, "probe census yok"));

  const d = bundle.pairHs10VsA0;
  if (!d) {
    out.push(RED_MISSING("B", "B4", `R4 donatı ${tr(o.rebarBlocks)}/${tr(o.rebarBlocks)}`, `${o.rebarBlocks}/0 uyumsuz`, "HS↔A0 diff yok"));
    out.push(RED_MISSING("B", "B5", `R1 malzeme ${tr(o.materials)}/${tr(o.materials)}`, `${o.materials}/${o.materials} (diff 0)`, "HS↔A0 diff yok"));
    out.push(RED_MISSING("B", "B6", "R3 deprem/zemin 10/10 alan", "10/10 (diff 0)", "HS↔A0 diff yok"));
    out.push(RED_MISSING("B", "B7", `R5 F9/modal tablo ${tr(o.f9ModalTables)}`, `${o.f9ModalTables}/${o.f9ModalTables} (tablo diff 0)`, "HS↔A0 diff yok"));
    out.push(RED_MISSING("B", "B8", "F9 frekans sapması ≤1e-9", "≤ 1e-9", "HS↔A0 diff yok"));
    out.push(RED_MISSING("B", "B9", `geometri ${tr(o.elementsCore)}+${o.elementsStairs} (1 µm)`, `${tr(o.elements)}/${tr(o.elements)} (diff 0)`, "HS↔A0 diff yok"));
    out.push(RED_MISSING("B", "B10", `kat ${o.floors}/${o.floors}`, `${o.floors}/${o.floors}`, "HS↔A0 diff yok"));
    out.push(RED_MISSING("B", "B11", `kesit etiketi ${tr(o.elementsCore)}+${o.elementsStairs}`, `${tr(o.labels)}/${tr(o.labels)}`, "HS↔A0 diff yok"));
    out.push(RED_MISSING("B", "B12", "XX uydurma etiket 0", "0", "HS↔A0 diff yok"));
    out.push(RED_MISSING("B", "B13", `döşeme yükü ${o.slabLoads}/${o.slabLoads}`, `${o.slabLoads}/${o.slabLoads} (diff 0)`, "HS↔A0 diff yok"));
    return out;
  }
  const e = d.elements;
  out.push(crit("B", "B4", `R4 donatı ${tr(o.rebarBlocks)}/${tr(o.rebarBlocks)}`, `${o.rebarBlocks}/0 uyumsuz`,
    `${tr(e.rebarBoth)}/${tr(e.rebarMismatch)}`,
    e.rebarBoth === o.rebarBlocks && e.rebarMismatch === 0 ? "GECTI" : "KIRMIZI"));

  out.push(crit("B", "B5", `R1 malzeme ${tr(o.materials)}/${tr(o.materials)}`, `${o.materials}/${o.materials} (diff 0)`,
    `${d.materials.countA}/${d.materials.countB} (diff ${d.materials.diff.length})`,
    d.materials.countA === o.materials && d.materials.countB === o.materials && d.materials.diff.length === 0 ? "GECTI" : "KIRMIZI"));

  const seismicOracleDiff = d.seismic.diff.filter(x => (SEISMIC_ORACLE_FIELDS as readonly string[]).includes(x.field));
  out.push(crit("B", "B6", "R3 deprem/zemin 10/10 alan", "10/10 (diff 0)",
    d.seismic.presentA && d.seismic.presentB ? `10/10 (diff ${seismicOracleDiff.length})` : `okunamadı (A:${d.seismic.presentA} B:${d.seismic.presentB})`,
    d.seismic.presentA && d.seismic.presentB && seismicOracleDiff.length === 0 ? "GECTI" : "KIRMIZI"));

  out.push(crit("B", "B7", `R5 F9/modal tablo ${tr(o.f9ModalTables)}`, `${o.f9ModalTables}/${o.f9ModalTables} (tablo diff 0)`,
    `${d.f9.tablesA}/${d.f9.tablesB} (tablo diff ${d.f9.tableDiff.length})`,
    d.f9.tablesA === o.f9ModalTables && d.f9.tablesB === o.f9ModalTables && d.f9.tableDiff.length === 0 ? "GECTI" : "KIRMIZI"));

  const dev = d.f9.maxFrequencyDeviation;
  out.push(crit("B", "B8", "F9 frekans sapması ≤1e-9", "≤ 1e-9",
    dev === null ? "ölçülemedi (tablo yok)" : dev.toExponential(3),
    dev !== null && dev <= o.f9MaxFrequencyDeviation ? "GECTI" : "KIRMIZI"));

  out.push(crit("B", "B9", `geometri ${tr(o.elementsCore)}+${o.elementsStairs} (1 µm)`, `${tr(o.elements)}/${tr(o.elements)} (diff 0)`,
    `${tr(e.matched)}/${tr(e.geometryEqual)} (diff ${tr(e.geometryDiff)}, eksik ${e.missingInB}/${e.extraInB})`,
    e.matched === o.elements && e.geometryEqual === o.elements && e.geometryDiff === 0 && e.missingInB === 0 && e.extraInB === 0 ? "GECTI" : "KIRMIZI",
    `${tr(o.elementsCore)} çekirdek + ${o.elementsStairs} merdiven = ${o.elements} (v2 sürüm notu)`));

  out.push(crit("B", "B10", `kat ${o.floors}/${o.floors}`, `${o.floors}/${o.floors} (Asansör Mak. Dairesi dahil)`,
    `${d.floors.matched}/${o.floors} (fark ${d.floors.geometryDiff}, tek taraf ${d.floors.onlyInA.length + d.floors.onlyInB.length})`,
    d.floors.matched === o.floors && d.floors.geometryDiff === 0 && d.floors.onlyInA.length === 0 && d.floors.onlyInB.length === 0 ? "GECTI" : "KIRMIZI"));

  out.push(crit("B", "B11", `kesit etiketi ${tr(o.elementsCore)}+${o.elementsStairs}`, `${tr(o.labels)}/${tr(o.labels)}`,
    `${tr(e.labelEqual)}/${tr(e.labelDiff)}`,
    e.labelEqual === o.labels && e.labelDiff === 0 ? "GECTI" : "KIRMIZI"));

  out.push(crit("B", "B12", "XX uydurma etiket 0", "0",
    `${e.labelDiff}`,
    e.labelDiff === o.xxFabricatedLabels ? "GECTI" : "KIRMIZI",
    "ölçüm: donör kaynaklı birebirlik — HS↔A0 labelDiff (donör A0 etiketlerinden sapma = uydurma)"));

  const sl = bundle.slabLoadCount;
  out.push(sl
    ? crit("B", "B13", `döşeme yükü ${o.slabLoads}/${o.slabLoads}`, `${o.slabLoads}/${o.slabLoads} (diff 0)`,
      `${tr(sl.hs10)}/${tr(sl.a0)} (fark ${tr(e.loadsMismatch)}, tek taraf ${e.loadsOnlyA}/${e.loadsOnlyB})`,
      sl.hs10 === o.slabLoads && sl.a0 === o.slabLoads && e.loadsMismatch === 0 && e.loadsOnlyA === 0 && e.loadsOnlyB === 0 ? "GECTI" : "KIRMIZI",
      "ölçüm: parmak izlerinde slabLoads taşıyan eleman sayısı + HS↔A0 yük farkı")
    : RED_MISSING("B", "B13", `döşeme yükü ${o.slabLoads}/${o.slabLoads}`, `${o.slabLoads}/${o.slabLoads} (diff 0)`, "parmak izi sayımı yok"));

  return out;
}

export function evaluateStageB11(
  bundle: MeasurementBundle, ctx: OracleContext = DEFAULT_ORACLE_CONTEXT,
): CriterionResult[] {
  // Profil x11:null → ticari .ide11 eşi yok (SAPMA-A; KARAR-001 hükmü (B)):
  // ölçülemez dürüst-limit sınıfı — KIRMIZI da GEÇTİ de sayılmaz.
  if (ctx.x11 === null) {
    const note = "SAPMA-A (KARAR-001): tam kabul profili X11 eşi olmadığından .ide11-yönlü çift ölçümü yok — X11-YOK (ölçülemez) sınıfı";
    return [
      crit("B", "B14", "HS↔X11 geometri farkı 0", "0", "X11-YOK (ölçülemez)", "X11-YOK", note),
      crit("B", "B15", "HS↔X11 etiket farkı 0", "0", "X11-YOK (ölçülemez)", "X11-YOK", note),
      crit("B", "B16", "HS↔X11 yük farkı 0", "0", "X11-YOK (ölçülemez)", "X11-YOK", note),
    ];
  }
  const o = ctx.constants;
  const d = bundle.pairHs11VsX11;
  if (!d) {
    return [
      RED_MISSING("B", "B14", "HS↔X11 geometri farkı 0", "0", "diff yok"),
      RED_MISSING("B", "B15", "HS↔X11 etiket farkı 0", "0", "diff yok"),
      RED_MISSING("B", "B16", "HS↔X11 yük farkı 0", "0", "diff yok"),
    ];
  }
  const e = d.elements;
  return [
    crit("B", "B14", "HS↔X11 geometri farkı 0", "0",
      `${tr(e.geometryDiff)} (eş ${tr(e.geometryEqual)}/${tr(e.matched)})`,
      e.geometryDiff === o.ide11GeometryLabelLoadDiff ? "GECTI" : "KIRMIZI"),
    crit("B", "B15", "HS↔X11 etiket farkı 0", "0",
      `${tr(e.labelDiff)}`, e.labelDiff === o.ide11GeometryLabelLoadDiff ? "GECTI" : "KIRMIZI"),
    crit("B", "B16", "HS↔X11 yük farkı 0", "0",
      `${tr(e.loadsMismatch)} (tek taraf ${e.loadsOnlyA}/${e.loadsOnlyB})`,
      e.loadsMismatch === o.ide11GeometryLabelLoadDiff && e.loadsOnlyA === 0 && e.loadsOnlyB === 0 ? "GECTI" : "KIRMIZI"),
  ];
}

/** F6 yama ayağı: kapının kendi .ide11 çıktısında test yaması (F1-F3; hedef profil gelir). */
export function evaluateStageF(
  bundle: MeasurementBundle, ctx: OracleContext = DEFAULT_ORACLE_CONTEXT,
): CriterionResult[] {
  const o = ctx.constants;
  const fmt2 = (n: number): string => n.toFixed(2);
  const p = bundle.patch;
  const why = p && p.failNote ? p.failNote : "yama ayağı koşulmadı";
  if (!p || !p.ok) {
    return [
      RED_MISSING("F", "F1", "F6 yama bayt kapsamı (8B alan + 4B CRC = 12; kapsam dışı 0)", "12 bayt", why),
      RED_MISSING("F", "F2", `yamalı parse: ${o.patchBeamName}=${fmt2(o.patchToHeight)}, diğer kat ${o.patchBeamName}'leri değişmez`, `${o.patchBeamName} ${fmt2(o.patchToHeight)}; diğerleri ${fmt2(o.patchFromHeight)}`, why),
      RED_MISSING("F", "F3", "yamalı çıktı CRC mührü geçerli", "geçerli", why),
    ];
  }
  const f1 = p.changedBytes === o.patchChangedBytes
    && p.fieldBytes === o.patchFieldBytes
    && p.crcBytes === o.patchCrcBytes
    && p.outOfScopeBytes === 0;
  const f2 = p.patchedHeight === o.patchToHeight
    && p.originalHeight === o.patchFromHeight
    && p.otherK34Changed === 0
    && (p.otherK34Count ?? 0) >= 1;
  const f3 = p.crcValid === o.carrierChecksumValid;
  return [
    crit("F", "F1", "F6 yama bayt kapsamı (8B alan + 4B CRC = 12; kapsam dışı 0)", "12 bayt",
      `${p.changedBytes} bayt (alan ${p.fieldBytes} + CRC ${p.crcBytes}; kapsam dışı ${p.outOfScopeBytes})`,
      f1 ? "GECTI" : "KIRMIZI",
      `hedef: ilk ${o.patchBeamName} kirişi ${p.targetId} (${p.targetFloor}); beamSectionHeight ${o.patchFromHeight}→${o.patchToHeight}; T-F6.1 deseni`),
    crit("F", "F2", `yamalı parse: ${o.patchBeamName}=${fmt2(o.patchToHeight)}, diğer kat ${o.patchBeamName}'leri değişmez`, `${o.patchBeamName} ${fmt2(o.patchToHeight)}; diğerleri ${fmt2(o.patchFromHeight)}`,
      `${o.patchBeamName}=${p.patchedHeight} (kaynak ${p.originalHeight}); diğer ${o.patchBeamName} ${p.otherK34Count ?? 0} adet, değişen ${p.otherK34Changed ?? "?"}`,
      f2 ? "GECTI" : "KIRMIZI",
      `yamalı tampon yeniden parse edilir; yama dışı ${o.patchBeamName} kirişleri ${fmt2(o.patchFromHeight)} kalmalı`),
    crit("F", "F3", "yamalı çıktı CRC mührü geçerli", "geçerli",
      p.crcValid ? "geçerli" : "GEÇERSİZ", f3 ? "GECTI" : "KIRMIZI",
      p.patchedFile ? `yamalı çıktı: ${p.patchedFile} (SHA ${p.patchedSha?.slice(0, 16)}…)` : undefined),
  ];
}

export function evaluateStageC(
  bundle: MeasurementBundle, ctx: OracleContext = DEFAULT_ORACLE_CONTEXT,
): CriterionResult[] {
  const o = ctx.constants;
  const dt = bundle.desktop;
  if (dt.skipped) {
    const note = "CI/hızlı profil — tam kabul profili DEĞİLDİR";
    return [
      crit("C", "C1", "ideCAD açılış (başlık: dosya+proje+aktif kat)", "başlık tam", "SKIPPED", "SKIPPED", note),
      crit("C", "C2", `kat ağacı tam ${o.desktopFloors}/${o.desktopFloors}`, `${o.desktopFloors}/${o.desktopFloors}`, "SKIPPED", "SKIPPED", note),
      crit("C", "C3", "masaüstü tur sonunda süreç kapanışı", "kapalı, süreç 0", "SKIPPED", "SKIPPED", note),
    ];
  }
  const titleOk = Boolean(dt.mainTitle)
    && /\[[^\]]+\]/.test(dt.mainTitle!)
    && (dt.titleMustContain ?? [o.desktopProjectTitle]).every(part => dt.mainTitle!.includes(part));
  const out: CriterionResult[] = [];
  out.push(crit("C", "C1", "ideCAD açılış (başlık: dosya+proje+aktif kat)", "başlık tam",
    dt.failNote && !dt.mainTitle ? dt.failNote : (dt.mainTitle ?? "başlık okunamadı"),
    titleOk ? "GECTI" : "KIRMIZI",
    "pencere başlığında dosya adı + proje adı + aktif kat bulunmalı"));
  const expected = dt.floorsExpected ?? [];
  const found = dt.floorsFound ?? [];
  const floorsOk = expected.length === o.desktopFloors && expected.every(f => found.includes(f));
  out.push(crit("C", "C2", `kat ağacı tam ${o.desktopFloors}/${o.desktopFloors}`, `${o.desktopFloors}/${o.desktopFloors}`,
    found.length ? `${found.length}/${o.desktopFloors} (${found.join(", ")})` : (dt.failNote ?? "kat ağacı okunamadı"),
    floorsOk ? "GECTI" : "KIRMIZI",
    "salt-okunur TVM dökümü (girdi gönderilmez)"));
  out.push(crit("C", "C3", "masaüstü tur sonunda süreç kapanışı", "kapalı, süreç 0",
    dt.closedClean === undefined ? (dt.failNote ?? "kapanış kanıtı yok") : `closed=${dt.closedClean}, kalan süreç ${dt.remainingProcesses ?? "?"}`,
    dt.closedClean === true && (dt.remainingProcesses ?? 1) === 0 ? "GECTI" : "KIRMIZI"));
  return out;
}

/** İkinci masaüstü açılışı (yamalı .ide11; F6/F4 bacakları) ölçütleri (C5-C7). */
export function evaluateStageC11(
  bundle: MeasurementBundle, ctx: OracleContext = DEFAULT_ORACLE_CONTEXT,
): CriterionResult[] {
  const o = ctx.constants;
  const dt = bundle.desktop11;
  if (dt.skipped) {
    const note = "CI/hızlı profil — tam kabul profili DEĞİLDİR";
    return [
      crit("C", "C5", "yamalı .ide11 açılışı (başlık: dosya+proje+aktif kat)", "başlık tam", "SKIPPED", "SKIPPED", note),
      crit("C", "C6", `yamalı .ide11 kat ağacı tam ${o.desktopFloors}/${o.desktopFloors}`, `${o.desktopFloors}/${o.desktopFloors}`, "SKIPPED", "SKIPPED", note),
      crit("C", "C7", "yamalı .ide11 masaüstü tur sonunda süreç kapanışı", "kapalı, süreç 0", "SKIPPED", "SKIPPED", note),
    ];
  }
  const titleOk = Boolean(dt.mainTitle)
    && /\[[^\]]+\]/.test(dt.mainTitle!)
    && (dt.titleMustContain ?? [o.desktopProjectTitle]).every(part => dt.mainTitle!.includes(part));
  const expected = dt.floorsExpected ?? [];
  const found = dt.floorsFound ?? [];
  const floorsOk = expected.length === o.desktopFloors && expected.every(f => found.includes(f));
  return [
    crit("C", "C5", "yamalı .ide11 açılışı (başlık: dosya+proje+aktif kat)", "başlık tam",
      dt.failNote && !dt.mainTitle ? dt.failNote : (dt.mainTitle ?? "başlık okunamadı"),
      titleOk ? "GECTI" : "KIRMIZI",
      "F6/F4 bacağı: yamalı dosya gerçek ideCAD'de açılmalı (T-F6.3 deseni)"),
    crit("C", "C6", `yamalı .ide11 kat ağacı tam ${o.desktopFloors}/${o.desktopFloors}`, `${o.desktopFloors}/${o.desktopFloors}`,
      found.length ? `${found.length}/${o.desktopFloors} (${found.join(", ")})` : (dt.failNote ?? "kat ağacı okunamadı"),
      floorsOk ? "GECTI" : "KIRMIZI",
      "salt-okunur TVM dökümü (girdi gönderilmez)"),
    crit("C", "C7", "yamalı .ide11 masaüstü tur sonunda süreç kapanışı", "kapalı, süreç 0",
      dt.closedClean === undefined ? (dt.failNote ?? "kapanış kanıtı yok") : `closed=${dt.closedClean}, kalan süreç ${dt.remainingProcesses ?? "?"}`,
      dt.closedClean === true && (dt.remainingProcesses ?? 1) === 0 ? "GECTI" : "KIRMIZI"),
  ];
}

export function evaluateGate(
  bundle: MeasurementBundle,
  opts: { skipDesktop: boolean },
  ctx: OracleContext = DEFAULT_ORACLE_CONTEXT,
): CriterionResult[] {
  const o = ctx.constants;
  const out: CriterionResult[] = [];
  out.push(crit("A", "A1", "dönüşüm üretimi (.ide10 + .ide11, donör A0)", "iki çıktı üretildi",
    bundle.conversionOk ? (bundle.conversionDetail ?? "üretildi") : (bundle.conversionError ?? "üretilemedi"),
    bundle.conversionOk ? "GECTI" : "KIRMIZI"));
  const crcOk = bundle.crcValid.ide10 === o.carrierChecksumValid && bundle.crcValid.ide11 === o.carrierChecksumValid;
  out.push(crit("A", "A2", "çıktı taşıyıcı CRC'si geçerli", "ikisi de geçerli",
    `ide10=${bundle.crcValid.ide10}, ide11=${bundle.crcValid.ide11}`, crcOk ? "GECTI" : "KIRMIZI"));

  out.push(...evaluateStageB(bundle, ctx));
  out.push(...evaluateStageB11(bundle, ctx));
  out.push(...evaluateStageF(bundle, ctx));
  out.push(...evaluateStageC(bundle, ctx));
  out.push(...evaluateStageC11(bundle, ctx));

  const i10 = bundle.desktop.integrityOk;
  const i11 = bundle.desktop11.integrityOk;
  const fmtIntegrity = (v: boolean | undefined) => v === undefined ? "ölçülmedi" : v ? "sabit" : "DEĞİŞTİ";
  out.push(crit("C", "C4", "masaüstü sonrası çıktı bütünlüğü (.ide10 + yamalı .ide11 SHA sabit)", "değişmedi (ikisi de)",
    `ide10=${fmtIntegrity(i10)}, ide11-yamali=${fmtIntegrity(i11)}`,
    i10 === false || i11 === false ? "KIRMIZI" : "GECTI",
    opts.skipDesktop ? "--skip-desktop profili: masaüstü erişimi olmadığından kanıt zayıf profil" : undefined));

  out.push(crit("D", "D1", "kaynak korpus bayt-sabit (B0/A0/X11 yalnız OKU)", "SHA değişmedi",
    bundle.corpusIntegrityOk ? "SHA değişmedi" : (bundle.corpusIntegrityNote ?? "DEĞİŞTİ"),
    bundle.corpusIntegrityOk ? "GECTI" : "KIRMIZI",
    ctx.x11 === null ? "X11-YOK profili (SAPMA-A): bütünlük yalnız B0/A0 üzerinde ölçüldü" : undefined));
  return out;
}

export function computeExitCode(results: CriterionResult[]): number {
  return results.some(r => r.status === "KIRMIZI") ? 1 : 0;
}

/** Tam kabul profili: KIRMIZI yok VE SKIPPED yok. */
export function isFullAcceptanceProfile(results: CriterionResult[]): boolean {
  return results.every(r => r.status === "GECTI");
}

export function formatSummary(results: CriterionResult[], meta: { negatifTest: boolean; skipDesktop: boolean; runDir: string; oracleProfile?: string }): string {
  const lines: string[] = [];
  lines.push("=".repeat(100));
  lines.push("IDE KABUL KAPISI (T-F7.1 / G7) — ÖZET RAPOR");
  if (meta.negatifTest) lines.push("PROFİL: NEGATİF TEST (bilerek bozulan çıktıyla KIRMIZI beklenir)");
  else if (meta.skipDesktop) lines.push("PROFİL: CI/HIZLI (--skip-desktop — tam kabul profili DEĞİLDİR)");
  else lines.push("PROFİL: TAM KABUL (masaüstü dahil)");
  if (meta.oracleProfile) lines.push(`ORACLE PROFİLİ: ${meta.oracleProfile} (KARAR-001; gömülü K1 tablosu değişmedi)`);
  lines.push("Kanıt klasörü: " + meta.runDir);
  lines.push("-".repeat(100));
  lines.push(`${"AŞAMA".padEnd(7)}${"ÖLÇÜT".padEnd(48)}${"HEDEF".padEnd(24)}ÖLÇÜLEN → SONUÇ`);
  for (const r of results) {
    lines.push(`${r.stage.padEnd(7)}${r.criterion.padEnd(48)}${r.target.padEnd(24)}${r.measured} → ${r.status}`);
    if (r.note) lines.push(`${"".padEnd(7)}  not: ${r.note}`);
  }
  const gecti = results.filter(r => r.status === "GECTI").length;
  const kirmizi = results.filter(r => r.status === "KIRMIZI").length;
  const x11yok = results.filter(r => r.status === "X11-YOK").length;
  const skipped = results.filter(r => r.status === "SKIPPED").length;
  lines.push("-".repeat(100));
  let sonuc = `SONUÇ: ${gecti} GEÇTİ, ${kirmizi} KIRMIZI`;
  if (x11yok > 0) sonuc += `, ${x11yok} X11-YOK`;
  sonuc += `, ${skipped} SKIPPED`;
  lines.push(sonuc);
  if (x11yok > 0) {
    lines.push("X11-YOK (SAPMA-A; KARAR-001): tam kabul profili X11 eşi olmadığından .ide11-yönlü çift ölçümü yok");
  }
  if (kirmizi > 0) lines.push("KAPI: KIRMIZI — exit ≠ 0");
  else if (x11yok > 0 && skipped > 0) lines.push("KAPI: yeşil (SKIPPED + X11-YOK profili) — tam kabul profili DEĞİLDİR");
  else if (x11yok > 0) lines.push("KAPI: yeşil (X11-YOK profili) — tam kabul profili DEĞİLDİR");
  else if (skipped > 0) lines.push("KAPI: yeşil (SKIPPED profili) — tam kabul profili DEĞİLDİR");
  else lines.push("KAPI: TAM KABUL YEŞİL — exit 0");
  lines.push("=".repeat(100));
  return lines.join("\n");
}

// ─────────────────────────────────────────────────────────────────────────────
// CLI + aşama koşucuları
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_CAMPAIGN_DIR = "C:\\Users\\hsyn\\Desktop\\hsyncad_idecad_uzanti_optimizasyon";
const DEFAULT_CORPUS_DIR = "C:\\Users\\hsyn\\Desktop\\hsyncad\\incelemeler\\donusum-esdegerlik-2026-11-15\\00-kaynak";
const DEFAULT_DESKTOP_EXE = "C:\\Program Files\\ideCAD\\ideCAD Statik 11 Deneme\\ideCAD_Statik_11_Deneme.exe";

const USAGE = [
  "Kullanım:",
  "  npx tsx scripts/hsyncad/ide-acceptance-gate.ts [bayraklar]",
  "",
  "Aşamalar (sıralı):",
  "  A0 ÜRET    convert_trial_to_native --to all --donor A0 → .ide10 + .ide11 (yeni adla kanıt klasörüne)",
  "  B  ÖLÇ     probe-attribute-streams (30.260 + boyut bandı) + ide-fidelity-audit fingerprint",
  "             (her çıktı + A0 + X11) + çift farkları: HS↔A0, HS↔X11",
  "  B2 YAMA    (F6 ayağı) kapının kendi .ide11 çıktısında ilk K34 kirişinin beamSectionHeight",
  "             değeri 0.50→0.55 (saveNativeIdeOutput; T-F6.1 deseni) → yamalı çıktı yeni adla",
  "             kanıt klasörüne; ölçütler: bayt kapsamı 12 B (8 alan + 4 CRC; kapsam dışı 0),",
  "             parse K34=0.55 + diğer kat K34'leri değişmez, CRC mührü geçerli",
  "  C  MASAÜSTÜ desktop.py ile İKİ açılış: (1) üretilen .ide10 (F3 ayağı — değişmedi),",
  "             (2) yamalı .ide11 (F6/F4 bacakları; T-F6.3 deseni): başlık + kat ağacı + kapama;",
  "             salt-okunur TVM kat ağacı dökümü; her tur sonunda süreç kapanır (varsayılan AÇIK;",
  "             masaüstü süre bütçesi iki açılış)",
  "  D  KANIT   her aşama evidence\\orkestrasyon\\<tarih>-acceptance-gate\\run-<HHMMSS>\\ altına yazar",
  "  E  ÖZET    ölçüt → ölçülen → GEÇTİ/KIRMIZI; herhangi bir KIRMIZI → exit ≠ 0",
  "",
  "Bayraklar:",
  "  --campaign-dir <dir>   Kampanya kökü (araçlar + kanıt dizini) [varsayılan: " + DEFAULT_CAMPAIGN_DIR + "]",
  "  --corpus-dir <dir>     Kaynak korpus [varsayılan: " + DEFAULT_CORPUS_DIR + "]",
  "  --input <path>         Dönüştürülecek .ide11trial [varsayılan: <corpus>\\B0_orijinal.ide11trial]",
  "  --donor <path>         Eş proje donör .ide10 [varsayılan: <corpus>\\A0_orijinal.ide10]",
  "  --x11 <path>           Ticari referans .ide11 [varsayılan: <corpus>\\X11_downloads.ide11]",
  "  --desktop-exe <path>   ideCAD EXE [varsayılan: " + DEFAULT_DESKTOP_EXE + "]",
  "  --out-root <dir>       Kanıt kökü [varsayılan: <campaign>\\evidence\\orkestrasyon]",
  "  --skip-desktop         CI/hızlı profil: masaüstü aşaması atlanır (SKIPPED, KIRMIZI sayılmaz;",
  "                         özette 'tam kabul profili DEĞİLDİR' notu)",
  "  --oracle-json <yol>    Proje-özel oracle profili (KARAR-001 onarımı; üretici:",
  "                         scripts/hsyncad/ide-oracle-profile.ts — değerler eşli ticari",
  "                         donör .ide10'dan ölçülür, YFS-1). MS1'e donuk sabitler profil",
  "                         değerleriyle doğrulamalı birleşir: yalnız bilinen anahtarlar;",
  "                         bilinmeyen anahtar / eksik anahtar / yanlış tip → sert hata.",
  "                         Profil x11:null → X11 varlık kontrolü atlanır ve B14–B16",
  "                         'X11-YOK (ölçülemez)' sınıfına düşer (KIRMIZI sayılmaz, GEÇTİ",
  "                         de sayılmaz; SAPMA-A dürüst notu özette listelenir). Bayrak",
  "                         yoksa davranış K1 profiliyle bayt bayt aynıdır.",
  "  --negatif-test         Kasıtlı bozuk senaryo: üretilen .ide10 stored-CRC'si bozulur",
  "                         (mevcut sözleşme KORUNUR); KIRMIZI + exit ≠ 0 beklenir (doğrulama",
  "                         profili; masaüstü atlanır; yama ayağı yine koşar — sağlam .ide11",
  "                         F satırları izolasyonla yeşil kalır)",
  "  --stage-timeout-ms <n> Tek aşama üst sınırı [varsayılan: 900000 = 15 dk]",
  "  -h, --help             Bu yardım",
  "",
  "Sözleşme notları:",
  "  * Ölçütler 11-KABUL-VE-KANIT-PROTOKOLU.md §2'den saptırılamaz; sabitler tek ORACLE tablosu.",
  "  * G7: kapı F3+F4+F6 senaryolarının TÜMÜNÜ ölçer (yama ayağı B2'de, masaüstü iki açılışta).",
  "  * Yama ayağı --skip-desktop ve --negatif-test profillerinde de koşar (makine ölçümleri",
  "    masaüstünden bağımsızdır); yama girdisi bozuksa F satırları KIRMIZI/'ölçülemedi' sınıfına düşer.",
  "  * Masaüstü aşaması öncesi Get-Process ideCAD kontrolü yapılır; açık oturum varsa aşama koşulamaz →",
  "    KIRMIZI ('ertelendi' profili YOK). Oturumu kapatıp yeniden koşun veya CI profili kullanın.",
  "  * B0/A0/X11 yalnız OKU; tüm çıktılar (yamalı .ide11 dahil) yeni adla kanıt klasörüne yazılır.",
].join("\n");

interface GateOptions {
  help: boolean;
  campaignDir: string;
  corpusDir: string;
  inputPath: string;
  donorPath: string;
  x11Path: string;
  desktopExe: string;
  outRoot: string;
  skipDesktop: boolean;
  negatifTest: boolean;
  stageTimeoutMs: number;
  /** KARAR-001 onarımı: proje-özel oracle profili (verilirse doğrulamalı birleşir). */
  oracleJsonPath?: string;
}

function parseCliArgs(argvRaw: string[]): GateOptions {
  const campaignDir = DEFAULT_CAMPAIGN_DIR;
  const corpusDir = DEFAULT_CORPUS_DIR;
  const options: GateOptions = {
    help: false,
    campaignDir,
    corpusDir,
    inputPath: path.join(corpusDir, "B0_orijinal.ide11trial"),
    donorPath: path.join(corpusDir, "A0_orijinal.ide10"),
    x11Path: path.join(corpusDir, "X11_downloads.ide11"),
    desktopExe: DEFAULT_DESKTOP_EXE,
    outRoot: path.join(campaignDir, "evidence", "orkestrasyon"),
    skipDesktop: false,
    negatifTest: false,
    stageTimeoutMs: 900_000,
  };
  // "--anahtar=değer" biçimini "--anahtar", "değer" belirteçlerine ayır.
  const argv: string[] = [];
  for (const raw of argvRaw) {
    const eq = raw.indexOf("=");
    if (eq > 2 && raw.startsWith("--") && !raw.slice(2, eq).includes("-")) {
      argv.push(raw.slice(0, eq), raw.slice(eq + 1));
    } else {
      argv.push(raw);
    }
  }
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "-h" || arg === "--help") { options.help = true; continue; }
    if (arg === "--skip-desktop") { options.skipDesktop = true; continue; }
    if (arg === "--negatif-test") { options.negatifTest = true; continue; }
    const needValue = (flag: string): string => {
      const value = argv[i + 1];
      if (value === undefined || value.trim() === "" || value.startsWith("--")) {
        throw new Error(`${flag} için değer gerekli.`);
      }
      i += 1;
      return value;
    };
    if (arg === "--campaign-dir") { options.campaignDir = path.resolve(needValue(arg)); options.outRoot = path.join(options.campaignDir, "evidence", "orkestrasyon"); continue; }
    if (arg === "--corpus-dir") {
      options.corpusDir = path.resolve(needValue(arg));
      options.inputPath = path.join(options.corpusDir, "B0_orijinal.ide11trial");
      options.donorPath = path.join(options.corpusDir, "A0_orijinal.ide10");
      options.x11Path = path.join(options.corpusDir, "X11_downloads.ide11");
      continue;
    }
    if (arg === "--input") { options.inputPath = path.resolve(needValue(arg)); continue; }
    if (arg === "--donor") { options.donorPath = path.resolve(needValue(arg)); continue; }
    if (arg === "--x11") { options.x11Path = path.resolve(needValue(arg)); continue; }
    if (arg === "--oracle-json") { options.oracleJsonPath = path.resolve(needValue(arg)); continue; }
    if (arg === "--desktop-exe") { options.desktopExe = needValue(arg); continue; }
    if (arg === "--out-root") { options.outRoot = path.resolve(needValue(arg)); continue; }
    if (arg === "--stage-timeout-ms") { options.stageTimeoutMs = Number(needValue(arg)); continue; }
    throw new Error(`Bilinmeyen bayrak: ${arg}\n\n${USAGE}`);
  }
  if (options.negatifTest) options.skipDesktop = true;
  return options;
}

// ── yardımcılar ─────────────────────────────────────────────────────────────

function sha256(filePath: string): string {
  const hash = crypto.createHash("sha256");
  hash.update(fs.readFileSync(filePath));
  return hash.digest("hex");
}

function sleepSync(ms: number): void {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

interface RunResult { status: number | null; stdout: string; stderr: string; ok: boolean; }

function runLogged(
  cmd: string, args: string[], logFile: string, opts: { timeoutMs: number; cwd?: string },
): RunResult {
  const line = `\n=== ${new Date().toISOString()} ===\n${cmd} ${args.map(a => `"${a}"`).join(" ")}\n`;
  fs.appendFileSync(logFile, line);
  const res = spawnSync(cmd, args, {
    timeout: opts.timeoutMs,
    encoding: "utf8",
    maxBuffer: 512 * 1024 * 1024,
    cwd: opts.cwd,
  });
  const stdout = res.stdout ?? "";
  const stderr = res.stderr ?? "";
  fs.appendFileSync(logFile, stdout + (stderr ? `\n[stderr]\n${stderr}` : "") + `\n[exit=${res.status ?? "null"}${res.error ? " err=" + res.error.message : ""}]\n`);
  return { status: res.status, stdout, stderr, ok: res.status === 0 };
}

function listIdecadProcesses(): Array<{ id: number; name: string }> {
  const ps = "Get-Process | Where-Object { $_.ProcessName -like 'ideCAD*' -or $_.ProcessName -like 'ideRPT*' } | Select-Object Id,ProcessName | ConvertTo-Json -Compress";
  const res = spawnSync("powershell", ["-NoProfile", "-Command", ps], { timeout: 30_000, encoding: "utf8" });
  if (res.status !== 0 || !res.stdout?.trim()) return [];
  try {
    const parsed = JSON.parse(res.stdout.trim());
    if (Array.isArray(parsed)) return parsed.map((p: { Id: number; ProcessName: string }) => ({ id: p.Id, name: p.ProcessName }));
    if (parsed && typeof parsed === "object") return [{ id: parsed.Id, name: parsed.ProcessName }];
  } catch { /* boş liste döner */ }
  return [];
}

/** Salt-okunur SysTreeView32 TVM dökümü (T3.4c deseni; girdi gönderilmez). */
const STORYTREE_PS1 = String.raw`
param(
  [Parameter(Mandatory = $true)][int]$TargetPid,
  [Parameter(Mandatory = $true)][int]$MainHwnd,
  [Parameter(Mandatory = $true)][string]$OutFile
)
$ErrorActionPreference = 'Stop'
$source = @'
using System;
using System.Text;
using System.Collections.Generic;
using System.Runtime.InteropServices;

public static class IdeTreeDump {
  private delegate bool EnumProc(IntPtr h, IntPtr l);
  [DllImport("user32.dll")] private static extern bool EnumChildWindows(IntPtr h, EnumProc cb, IntPtr l);
  [DllImport("user32.dll", CharSet = CharSet.Unicode)] private static extern int GetClassName(IntPtr h, StringBuilder sb, int max);
  [DllImport("user32.dll", CharSet = CharSet.Unicode)] private static extern IntPtr SendMessageTimeoutW(IntPtr h, uint msg, IntPtr w, IntPtr l, uint flags, uint timeout, out IntPtr result);
  [DllImport("kernel32.dll")] private static extern IntPtr OpenProcess(uint access, bool inherit, int pid);
  [DllImport("kernel32.dll")] private static extern bool CloseHandle(IntPtr h);
  [DllImport("kernel32.dll")] private static extern IntPtr VirtualAllocEx(IntPtr p, IntPtr a, uint size, uint type, uint prot);
  [DllImport("kernel32.dll")] private static extern bool VirtualFreeEx(IntPtr p, IntPtr a, uint size, uint type);
  [DllImport("kernel32.dll")] private static extern bool WriteProcessMemory(IntPtr p, IntPtr a, byte[] buf, uint size, out IntPtr written);
  [DllImport("kernel32.dll")] private static extern bool ReadProcessMemory(IntPtr p, IntPtr a, byte[] buf, uint size, out IntPtr read);

  private const uint TVIF_HANDLE = 0x10, TVIF_TEXT = 0x1, TVIF_CHILDREN = 0x40;
  private const uint TVGN_ROOT = 0x0, TVGN_NEXT = 0x1, TVGN_CHILD = 0x4;
  private const uint TVM_GETCOUNT = 0x1105, TVM_GETNEXTITEM = 0x110A, TVM_GETITEMW = 0x113E;
  private const uint MEM_COMMIT = 0x1000, MEM_RESERVE = 0x2000, PAGE_READWRITE = 0x04, MEM_RELEASE = 0x8000;
  private const uint SMTO_ABORTIFHUNG = 0x0002;

  private static IntPtr Send(IntPtr h, uint msg, IntPtr w, IntPtr l) {
    IntPtr res;
    SendMessageTimeoutW(h, msg, w, l, SMTO_ABORTIFHUNG, 5000, out res);
    return res;
  }

  private static void PutU32(byte[] b, int off, uint v) {
    b[off] = (byte)v; b[off+1] = (byte)(v >> 8); b[off+2] = (byte)(v >> 16); b[off+3] = (byte)(v >> 24);
  }
  private static void PutU64(byte[] b, int off, long v) {
    PutU32(b, off, (uint)v); PutU32(b, off + 4, (uint)((ulong)v >> 32));
  }
  private static int GetI32(byte[] b, int off) {
    return (int)((uint)b[off] | ((uint)b[off+1] << 8) | ((uint)b[off+2] << 16) | ((uint)b[off+3] << 24));
  }

  private static void Collect(IntPtr h, List<IntPtr> acc) {
    EnumChildWindows(h, delegate(IntPtr c, IntPtr l) {
      StringBuilder sb = new StringBuilder(256);
      GetClassName(c, sb, 256);
      if (sb.ToString() == "SysTreeView32") acc.Add(c);
      Collect(c, acc);
      return true;
    }, IntPtr.Zero);
  }

  public static string Dump(IntPtr main, int pid) {
    List<IntPtr> trees = new List<IntPtr>();
    Collect(main, trees);
    if (trees.Count == 0) return null;
    IntPtr proc = OpenProcess(0x0008 | 0x0010 | 0x0020, false, pid);
    if (proc == IntPtr.Zero) return null;
    try {
      IntPtr best = IntPtr.Zero; long bestCount = -1;
      foreach (IntPtr t in trees) {
        long c = Send(t, TVM_GETCOUNT, IntPtr.Zero, IntPtr.Zero).ToInt64();
        if (c > bestCount) { bestCount = c; best = t; }
      }
      IntPtr itemBuf = VirtualAllocEx(proc, IntPtr.Zero, 64, MEM_COMMIT | MEM_RESERVE, PAGE_READWRITE);
      IntPtr textBuf = VirtualAllocEx(proc, IntPtr.Zero, 8192, MEM_COMMIT | MEM_RESERVE, PAGE_READWRITE);
      List<string> lines = new List<string>();
      if (itemBuf != IntPtr.Zero && textBuf != IntPtr.Zero) {
        IntPtr root = Send(best, TVM_GETNEXTITEM, (IntPtr)TVGN_ROOT, IntPtr.Zero);
        Walk(best, proc, itemBuf, textBuf, root, 0, lines);
      }
      if (itemBuf != IntPtr.Zero) VirtualFreeEx(proc, itemBuf, 0, MEM_RELEASE);
      if (textBuf != IntPtr.Zero) VirtualFreeEx(proc, textBuf, 0, MEM_RELEASE);
      return String.Join("\r\n", lines.ToArray());
    } finally { CloseHandle(proc); }
  }

  private static void Walk(IntPtr tree, IntPtr proc, IntPtr itemBuf, IntPtr textBuf, IntPtr item, int depth, List<string> lines) {
    if (item == IntPtr.Zero || lines.Count > 200000) return;
    byte[] tvi = new byte[64];
    PutU32(tvi, 0, TVIF_HANDLE | TVIF_TEXT | TVIF_CHILDREN);
    PutU64(tvi, 8, item.ToInt64());
    PutU64(tvi, 24, textBuf.ToInt64());
    PutU32(tvi, 32, 4096);
    IntPtr written;
    if (!WriteProcessMemory(proc, itemBuf, tvi, 64, out written)) return;
    if (Send(tree, TVM_GETITEMW, IntPtr.Zero, itemBuf) == IntPtr.Zero) return;
    byte[] back = new byte[64];
    IntPtr read;
    if (!ReadProcessMemory(proc, itemBuf, back, 64, out read)) return;
    int cChildren = GetI32(back, 44);
    string label = "";
    byte[] textBytes = new byte[8192];
    if (ReadProcessMemory(proc, textBuf, textBytes, 8192, out read)) {
      int wchars = 4096;
      for (int i = 0; i < 8190; i += 2) {
        if (textBytes[i] == 0 && textBytes[i + 1] == 0) { wchars = i / 2; break; }
      }
      if (wchars > 0) label = Encoding.Unicode.GetString(textBytes, 0, wchars * 2);
    }
    lines.Add(new String(' ', depth * 2) + label + " (children=" + cChildren + ")");
    IntPtr child = Send(tree, TVM_GETNEXTITEM, (IntPtr)TVGN_CHILD, item);
    while (child != IntPtr.Zero && lines.Count <= 200000) {
      Walk(tree, proc, itemBuf, textBuf, child, depth + 1, lines);
      child = Send(tree, TVM_GETNEXTITEM, (IntPtr)TVGN_NEXT, child);
    }
  }
}
'@
Add-Type -TypeDefinition $source
$text = [IdeTreeDump]::Dump([IntPtr]$MainHwnd, $TargetPid)
if ($null -eq $text) {
  Write-Error ("SysTreeView32 bulunamadi ya da okunamadi (pid=" + $TargetPid + ", hwnd=" + $MainHwnd + ")")
  exit 1
}
$utf8 = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($OutFile, $text, $utf8)
Write-Output ("storytree-dump tamam; toplam satir: " + ([regex]::Matches($text, [char]13 + [char]10).Count + 1))
`;

function normalizeTr(s: string): string {
  return s.toLocaleUpperCase("tr-TR").trim();
}

// ── main ─────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const options = parseCliArgs(process.argv.slice(2));
  if (options.help) {
    console.log(USAGE);
    return;
  }

  // KARAR-001 onarımı (v4): isteğe bağlı proje-özel oracle profili. Bayrak yoksa
  // DEFAULT_ORACLE_CONTEXT (gömülü K1 ORACLE'ı) → davranış bayt bayt aynı.
  let oracleCtx: OracleContext = DEFAULT_ORACLE_CONTEXT;
  if (options.oracleJsonPath) {
    oracleCtx = loadOracleContext(options.oracleJsonPath);
    console.log(`[ORACLE PROFİLİ] ${oracleCtx.projectId} ← ${options.oracleJsonPath}${oracleCtx.x11 === null ? " (x11: null → B14–B16 X11-YOK sınıfı, SAPMA-A)" : ""}`);
  }

  const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
  const toolsDir = path.join(options.campaignDir, "tools");
  const preflight: Array<[string, string]> = [
    ["kampanya", options.campaignDir],
    ["tools", toolsDir],
    ["girdi", options.inputPath],
    ["donör", options.donorPath],
  ];
  // Profil x11:null → X11 eşi yok (SAPMA-A): varlık kontrolü atlanır.
  if (oracleCtx.x11 !== null) preflight.push(["X11", options.x11Path]);
  for (const [label, p] of preflight) {
    if (!fs.existsSync(p)) {
      console.error(`FATAL: ${label} yolu yok: ${p}`);
      process.exit(1);
    }
  }

  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const dateStamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  const runId = `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  const gateDir = path.join(options.outRoot, `${dateStamp}-acceptance-gate`);
  const runDir = path.join(gateDir, `run-${runId}`);
  const uretimDir = path.join(runDir, "uretim");
  const olcumDir = path.join(runDir, "olcum");
  const kabulDir = path.join(runDir, "kabul");
  for (const d of [uretimDir, olcumDir, kabulDir]) fs.mkdirSync(d, { recursive: true });

  const corpusBefore: { b0: string; a0: string; x11?: string } = {
    b0: sha256(options.inputPath),
    a0: sha256(options.donorPath),
    ...(oracleCtx.x11 !== null ? { x11: sha256(options.x11Path) } : {}),
  };

  const baseName = `HS_B0_gate_${dateStamp}-${runId}`;
  const inputCopy = path.join(uretimDir, `${baseName}.ide11trial`);
  const ide10Path = path.join(uretimDir, `${baseName}.ide10`);
  const ide11Path = path.join(uretimDir, `${baseName}.ide11`);
  const convLog = path.join(uretimDir, "convert-cikti.log");

  const commandsLog: string[] = [];

  // ── A0 ÜRET ────────────────────────────────────────────────────────────────
  console.log(`[A0 ÜRET] ${options.inputPath} → ${baseName}.ide10 + ${baseName}.ide11 (donör: ${path.basename(options.donorPath)})`);
  const inputSha = sha256(options.inputPath);
  fs.copyFileSync(options.inputPath, inputCopy);
  if (sha256(inputCopy) !== inputSha) {
    console.error("FATAL: girdi kopyası bayt-özdeş değil; duruluyor.");
    process.exit(1);
  }
  const convertArgs = [
    "--import", "tsx", path.join("scripts", "hsyncad", "convert_trial_to_native.ts"),
    inputCopy, "--out-dir", uretimDir, "--to", "all", "--donor", options.donorPath,
  ];
  commandsLog.push(convertArgs.join(" "));
  const conv = runLogged(process.execPath, convertArgs, convLog, { timeoutMs: options.stageTimeoutMs, cwd: repoRoot });
  let conversionOk = conv.ok && fs.existsSync(ide10Path) && fs.existsSync(ide11Path);
  let conversionError: string | undefined;
  if (!conv.ok) conversionError = `dönüşüm komutu exit ${conv.status} — bkz. ${convLog}`;
  else if (!conversionOk) conversionError = "çıktı dosyaları eksik — bkz. " + convLog;

  // ── NEGATİF TEST profili: üretilen .ide10 stored-CRC'sini kasıtlı boz ──────
  if (options.negatifTest && conversionOk) {
    const fd = fs.openSync(ide10Path, "r+");
    const one = Buffer.alloc(1);
    fs.readSync(fd, one, 0, 1, 84);
    fs.writeSync(fd, Buffer.from([one[0] ^ 0xa5]), 0, 1, 84);
    fs.closeSync(fd);
    console.log("[NEGATİF TEST] üretilen .ide10 stored-CRC baytı (offset 84) kasıtlı bozuldu — KIRMIZI bekleniyor.");
  }

  // ── B ÖLÇ (probe + fingerprint + çiftler) ─────────────────────────────────
  // F6 yama ayağı çıktısı: kapının kendi .ide11 çıktısından üretilir, yeni adla
  // kanıt klasörüne yazılır (kaynak .ide11 yalnız OKU).
  const patchedIde11Name = `${baseName}-F6-yamali.ide11`;
  const patchedIde11Path = path.join(uretimDir, patchedIde11Name);
  const patch: PatchMeasurement = { ok: false, failNote: "yama ayağı koşulmadı" };
  const bundle: MeasurementBundle = {
    conversionOk,
    ...(conversionError ? { conversionError } : {}),
    ...(conversionOk ? {
      conversionDetail: `${baseName}.ide10 (${fs.statSync(ide10Path).size.toLocaleString("tr-TR")} B) + ${baseName}.ide11 (${fs.statSync(ide11Path).size.toLocaleString("tr-TR")} B)`,
    } : {}),
    crcValid: { ide10: false, ide11: false },
    census: {},
    pairHs10VsA0: null,
    pairHs11VsX11: null,
    patch,
    desktop: { skipped: options.skipDesktop },
    desktop11: { skipped: options.skipDesktop },
    corpusIntegrityOk: true,
  };

  if (conversionOk) {
    bundle.crcValid.ide10 = verifyIdeHeaderChecksum(new Uint8Array(fs.readFileSync(ide10Path))).valid;
    bundle.crcValid.ide11 = verifyIdeHeaderChecksum(new Uint8Array(fs.readFileSync(ide11Path))).valid;

    console.log("[B ÖLÇ] probe-attribute-streams ...");
    const probeLog = path.join(olcumDir, "probe-cikti.log");
    const censusPath = path.join(olcumDir, "attribute-stream-census.json");
    const probeArgs = ["--import", "tsx", path.join(toolsDir, "probe-attribute-streams.ts"), olcumDir, ide10Path, ide11Path];
    commandsLog.push(probeArgs.join(" "));
    const probe = runLogged(process.execPath, probeArgs, probeLog, { timeoutMs: options.stageTimeoutMs, cwd: repoRoot });
    if (probe.ok && fs.existsSync(censusPath)) {
      const rows: CensusRow[] = JSON.parse(fs.readFileSync(censusPath, "utf8"));
      bundle.census.ide10 = rows.find(r => r.file === `${baseName}.ide10`);
      bundle.census.ide11 = rows.find(r => r.file === `${baseName}.ide11`);
    }

    console.log("[B ÖLÇ] ide-fidelity-audit fingerprint (her çıktı + A0 + X11) ...");
    const auditLog = path.join(olcumDir, "audit-cikti.log");
    // Profil x11:null → X11 eşi yok: X11 parmak izi alınmaz, HS↔X11 çifti koşulmaz.
    const fingerprintTargets = oracleCtx.x11 !== null
      ? [ide10Path, ide11Path, options.donorPath, options.x11Path]
      : [ide10Path, ide11Path, options.donorPath];
    const fpLabel = (p: string) => path.basename(p).replace(/\.[^.]+$/, "") + "__" + path.extname(p).replace(/^\./, "");
    const fingerprintOk = new Map<string, boolean>();
    for (const target of fingerprintTargets) {
      const args = ["--import", "tsx", path.join(toolsDir, "ide-fidelity-audit.ts"), "fingerprint", olcumDir, target];
      commandsLog.push(args.join(" "));
      const r = runLogged(process.execPath, args, auditLog, { timeoutMs: options.stageTimeoutMs, cwd: repoRoot });
      fingerprintOk.set(fpLabel(target), r.ok);
    }

    const comparePairs: Array<[string, string, keyof MeasurementBundle]> = [
      [fpLabel(ide10Path), fpLabel(options.donorPath), "pairHs10VsA0"],
    ];
    if (oracleCtx.x11 !== null) {
      comparePairs.push([fpLabel(ide11Path), fpLabel(options.x11Path), "pairHs11VsX11"]);
    }
    const compareLog = path.join(olcumDir, "compare-cikti.log");
    for (const [labelA, labelB, key] of comparePairs) {
      const diffPath = path.join(olcumDir, `${labelA}__vs__${labelB}.diff.json`);
      if (!fingerprintOk.get(labelA) || !fingerprintOk.get(labelB)) continue; // ölçülemeyen çift → null kalır
      const args = ["--import", "tsx", path.join(toolsDir, "ide-fidelity-audit.ts"), "compare", olcumDir, labelA, labelB];
      commandsLog.push(args.join(" "));
      const r = runLogged(process.execPath, args, compareLog, { timeoutMs: options.stageTimeoutMs, cwd: repoRoot });
      if (r.ok && fs.existsSync(diffPath)) {
        (bundle as unknown as Record<string, unknown>)[key] = JSON.parse(fs.readFileSync(diffPath, "utf8"));
      }
    }
  }

  // ── masaüstü beklenen başlık/kat ölçütleri + döşeme yükü sayımı (parmak izleri) ──
  let expectedFloors: string[] = [];
  let expectedProjectName = oracleCtx.constants.desktopProjectTitle;
  const hs10FpPath = path.join(olcumDir, `${baseName}__ide10.fingerprint.json`);
  const a0FpPath = path.join(olcumDir, `A0_orijinal__ide10.fingerprint.json`);
  if (fs.existsSync(hs10FpPath)) {
    const fp = JSON.parse(fs.readFileSync(hs10FpPath, "utf8"));
    expectedFloors = fp.floors.map((f: { name: string }) => f.name);
    if (typeof fp.carrier?.projectName === "string" && fp.carrier.projectName.trim() !== "") {
      expectedProjectName = fp.carrier.projectName;
    }
    if (fs.existsSync(a0FpPath)) {
      const a0fp = JSON.parse(fs.readFileSync(a0FpPath, "utf8"));
      bundle.slabLoadCount = {
        hs10: fp.elements.filter((el: { slabLoads: unknown }) => el.slabLoads != null).length,
        a0: a0fp.elements.filter((el: { slabLoads: unknown }) => el.slabLoads != null).length,
      };
    }
  }

  // ── B2 YAMA (F6 ayağı; G7: F3+F4+F6 tümü) ──────────────────────────────────
  // Kapının KENDİ .ide11 çıktısı üzerinde kanonik test yaması: ilk K34 kirişinin
  // beamSectionHeight değeri 0.50→0.55 (saveNativeIdeOutput; T-F6.1 deseni).
  // Doğrulamalar: (a) bayt diff yalnız hedef alan 8B + CRC 4B = 12, kapsam dışı 0;
  // (b) parse ile yamalı K34=0.55 + diğer kat K34'leri değişmez; (c) CRC mührü
  // geçerli. Masaüstünden bağımsızdır: --skip-desktop / --negatif-test
  // profillerinde de koşar (negatif profilde yalnız .ide10 bozulur).
  if (!conversionOk) {
    patch.failNote = "dönüşüm çıktısı yok — yama ayağı koşulamadı";
  } else {
    const oc = oracleCtx.constants;
    console.log(`[B2 YAMA] F6 senaryosu: ${baseName}.ide11 → ilk ${oc.patchBeamName} beamSectionHeight ${oc.patchFromHeight}→${oc.patchToHeight} ...`);
    const patchStarted = Date.now();
    try {
      const srcBytes = Uint8Array.from(fs.readFileSync(ide11Path));
      const srcBuf = srcBytes.buffer.slice(0, srcBytes.byteLength) as ArrayBuffer;
      const project = parseIde10(srcBuf, `${baseName}.ide11`);
      const floorName = (id: string) => project.floors.find(f => f.id === id)?.name ?? "?";
      const k34s = project.elements.filter(e => e.type === "beam" && e.name === oc.patchBeamName);
      const target = k34s[0];
      if (!target || typeof target.sourceOffset !== "number") {
        throw new Error(`yama hedefi bulunamadı: '${oc.patchBeamName}' tipli kiriş kaydı yok`);
      }
      if (target.height !== oc.patchFromHeight) {
        throw new Error(`yama hedefi kesit yüksekliği ${target.height} — beklenen ${oc.patchFromHeight} (profil/F6 senaryosu)`);
      }
      patch.targetId = target.id;
      patch.targetName = target.name;
      patch.targetFloor = floorName(target.floorId);
      patch.originalHeight = target.height;
      const result = saveNativeIdeOutput(srcBytes, [{
        id: target.id, sourceOffset: target.sourceOffset,
        field: "beamSectionHeight", value: oc.patchToHeight,
      }]);
      // bağımsız bayt sınıflandırması: her değişen bayt ya yama alanında ya da
      // yeniden mühürlenen CRC başlığında olmalı; kapsam dışı tek bayt kırmızıdır.
      let fieldBytes = 0, crcBytes = 0, outOfScopeBytes = 0;
      for (let i = 0; i < srcBytes.byteLength; i++) {
        if (srcBytes[i] === result.bytes[i]) continue;
        const inField = result.patchedRanges.some(r => i >= r.offset && i < r.offset + r.length);
        if (inField) fieldBytes += 1;
        else if (i >= 83 && i < 87) crcBytes += 1;
        else outOfScopeBytes += 1;
      }
      patch.fieldBytes = fieldBytes;
      patch.crcBytes = crcBytes;
      patch.outOfScopeBytes = outOfScopeBytes;
      patch.changedBytes = fieldBytes + crcBytes + outOfScopeBytes;
      patch.crcValid = verifyIdeHeaderChecksum(result.bytes).valid;
      fs.writeFileSync(patchedIde11Path, result.bytes);
      patch.patchedFile = patchedIde11Name;
      patch.patchedSha = sha256(patchedIde11Path);
      // parse doğrulaması: yamalı K34=0.55 + diğer kat K34'leri değişmez
      const patchedBuf = result.bytes.buffer.slice(0, result.bytes.byteLength) as ArrayBuffer;
      const patchedProject = parseIde10(patchedBuf, patchedIde11Name);
      const targetAfter = patchedProject.elements.find(e => e.id === target.id);
      const otherK34 = patchedProject.elements.filter(e => e.type === "beam" && e.name === oc.patchBeamName && e.id !== target.id);
      patch.patchedHeight = targetAfter?.height;
      patch.otherK34Count = otherK34.length;
      patch.otherK34Changed = otherK34.filter(e => e.height !== oc.patchFromHeight).length;
      patch.elapsedMs = Date.now() - patchStarted;
      patch.ok = true;
      delete patch.failNote;
      commandsLog.push(`saveNativeIdeOutput(${baseName}.ide11; ${target.id} '${target.name}' beamSectionHeight ${oc.patchFromHeight}→${oc.patchToHeight}) [süreç içi kitaplık çağrısı]`);
      console.log(`[B2 YAMA] ${target.id} (${patch.targetFloor}) → ${patchedIde11Name}: ${patch.changedBytes} bayt (alan ${fieldBytes} + CRC ${crcBytes}; kapsam dışı ${outOfScopeBytes}); parse K34=${patch.patchedHeight}, diğer K34 ${otherK34.length} adet (değişen ${patch.otherK34Changed}); CRC=${patch.crcValid}`);
    } catch (err) {
      patch.failNote = `yama ayağı hatası: ${err instanceof Error ? err.message : String(err)}`;
      console.log(`[B2 YAMA] ${patch.failNote}`);
    }
    fs.writeFileSync(path.join(olcumDir, "yama-olcum.json"), JSON.stringify(patch, null, 2), "utf8");
  }

  // ── C MASAÜSTÜ (İKİ açılış: üretilen .ide10 + yamalı .ide11) ────────────────
  const ide10ShaBefore = conversionOk ? sha256(ide10Path) : "";
  const patchedShaBefore = patch.ok ? sha256(patchedIde11Path) : "";
  const desktopLog = path.join(kabulDir, "desktop-cikti.log");
  const storytreePs1Path = path.join(kabulDir, "storytree-dump.ps1");
  if (!options.skipDesktop && conversionOk) {
    console.log("[C MASAÜSTÜ] gerçek ideCAD kabul turu — İKİ açılış (.ide10 + yamalı .ide11) ...");
    const dt1: DesktopMeasurement = {
      skipped: false,
      titleMustContain: [`${baseName}.ide10`, expectedProjectName],
      floorsExpected: expectedFloors,
    };
    const dt2: DesktopMeasurement = {
      skipped: false,
      titleMustContain: [patchedIde11Name, expectedProjectName],
      floorsExpected: expectedFloors,
    };
    bundle.desktop = dt1;
    bundle.desktop11 = dt2;

    const pre = listIdecadProcesses();
    commandsLog.push("powershell Get-Process ideCAD* (ön kontrol)");
    if (pre.length > 0) {
      const preNote = `önceden açık ideCAD oturumu (pid ${pre.map(p => p.id).join(",")}) — kapı sözleşmesi: masaüstü aşaması koşulamaz, KIRMIZI. Oturum kapatıp yeniden koşun (CI profili: --skip-desktop).`;
      dt1.failNote = preNote;
      dt2.failNote = preNote;
      dt1.integrityOk = sha256(ide10Path) === ide10ShaBefore;
      if (patch.ok) dt2.integrityOk = sha256(patchedIde11Path) === patchedShaBefore;
      console.log(`[C MASAÜSTÜ] ${preNote}`);
    } else {
      // Tek masaüstü ayağı (her iki açılışta aynı düzen): launch → tam yükleme
      // başlığı → bind+observe → salt-okunur TVM kat ağacı dökümü → alt+f4 →
      // kalan süreç 0 → çıktı bayt-sabitliği. Her ayak kendi out-dir'ini
      // kullanır (session/closed/latest dosyaları çakışmaz).
      const desktopLeg = (leg: {
        label: string; projectPath: string; outDir: string; sessionPath: string;
        storyPath: string; katOzetiPath: string; dt: DesktopMeasurement; shaBefore: string;
      }): void => {
        const dt = leg.dt;
        try {
          fs.writeFileSync(storytreePs1Path, STORYTREE_PS1.trimStart() + "\n", "utf8");
          const launchArgs = ["-X", "utf8", path.join("scripts", "idecad", "desktop.py"), "launch",
            "--exe", options.desktopExe, "--project", leg.projectPath, "--dismiss-trial",
            "--session", leg.sessionPath, "--out-dir", leg.outDir];
          commandsLog.push("python " + launchArgs.join(" "));
          const launch = runLogged("python", launchArgs, desktopLog, { timeoutMs: 60_000, cwd: repoRoot });
          let pid: number | null = null;
          let mainHwnd: number | null = null;
          if (launch.ok) {
            try {
              const j = JSON.parse(launch.stdout.slice(launch.stdout.indexOf("{")));
              pid = j.pid ?? null;
              mainHwnd = j.main_hwnd ?? null;
            } catch { /* kırmızı not aşağıda */ }
          }
          if (pid === null) {
            dt.failNote = `ideCAD launch başarısız (exit ${launch.status}) — bkz. ${desktopLog}`;
            return;
          }
          // tam yükleme bekle: başlıkta dosya adı + [aktif kat] görünecek
          const deadline = Date.now() + Math.min(options.stageTimeoutMs, 300_000);
          let title: string | null = null;
          while (Date.now() < deadline) {
            const listRes = runLogged("python", ["-X", "utf8", path.join("scripts", "idecad", "desktop.py"), "list"], desktopLog, { timeoutMs: 35_000, cwd: repoRoot });
            if (listRes.ok) {
              try {
                const start = listRes.stdout.indexOf("{");
                const windowsList = JSON.parse(listRes.stdout.slice(start)).windows as Array<{ pid: number; class: string; title: string; hwnd: number }>;
                const w = windowsList.find(w => w.pid === pid && w.class === "ideCADMainFrame"
                  && w.title.includes(leg.label) && /\[[^\]]+\]/.test(w.title));
                if (w) { title = w.title; mainHwnd = w.hwnd; break; }
              } catch { /* tekrar dener */ }
            }
            sleepSync(3000);
          }
          if (title === null || mainHwnd === null) {
            dt.failNote = `tam yükleme başlığı beklenemedi (pid ${pid}) — bkz. ${desktopLog}`;
            return;
          }
          const bindArgs = ["-X", "utf8", path.join("scripts", "idecad", "desktop.py"), "bind",
            "--hwnd", String(mainHwnd), "--expect-title", title,
            "--session", leg.sessionPath, "--out-dir", leg.outDir];
          commandsLog.push("python " + bindArgs.join(" "));
          const bind = runLogged("python", bindArgs, desktopLog, { timeoutMs: 35_000, cwd: repoRoot });
          const obsArgs = ["-X", "utf8", path.join("scripts", "idecad", "desktop.py"), "observe", "--session", leg.sessionPath, "--brief"];
          commandsLog.push("python " + obsArgs.join(" "));
          const obs = runLogged("python", obsArgs, desktopLog, { timeoutMs: 35_000, cwd: repoRoot });
          if (bind.ok && obs.ok) {
            try {
              const start = obs.stdout.indexOf("{");
              const oj = JSON.parse(obs.stdout.slice(start));
              dt.mainTitle = oj.main_title ?? title;
              dt.image = oj.image ?? undefined;
            } catch { dt.mainTitle = title; }
          } else {
            dt.failNote = `bind/observe başarısız — bkz. ${desktopLog}`;
          }

          // salt-okunur kat ağacı TVM dökümü
          const treeArgs = ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", storytreePs1Path,
            "-TargetPid", String(pid), "-MainHwnd", String(mainHwnd), "-OutFile", leg.storyPath];
          commandsLog.push("powershell " + treeArgs.join(" "));
          const tree = runLogged("powershell", treeArgs, desktopLog, { timeoutMs: 180_000 });
          if (tree.ok && fs.existsSync(leg.storyPath)) {
            const nodeNames = fs.readFileSync(leg.storyPath, "utf8")
              .split(/\r?\n/)
              .map(l => l.trim())
              .filter(Boolean)
              .map(l => l.replace(/\s*\(children=-?\d+\)$/, ""));
            const normalizedNodes = new Set(nodeNames.map(normalizeTr));
            const floorsFound = expectedFloors.filter(f => normalizedNodes.has(normalizeTr(f)));
            dt.floorsFound = floorsFound;
            const katOzeti = [
              "KAT AĞACI ÖZETİ (salt-okunur TVM dökümü; girdi gönderilmedi):",
              ...expectedFloors.map(f => `  - ${f} → ${floorsFound.includes(f) ? "BULUNDU" : "YOK"}`),
              `TOPLAM: ${floorsFound.length}/${expectedFloors.length}`,
            ].join("\n");
            fs.writeFileSync(leg.katOzetiPath, katOzeti + "\n", "utf8");
          } else {
            dt.failNote = `kat ağacı TVM dökümü başarısız — bkz. ${desktopLog}`;
          }

          // kapanış
          const keyArgs = ["-X", "utf8", path.join("scripts", "idecad", "desktop.py"), "key",
            "--session", leg.sessionPath, "--chord", "alt+f4"];
          commandsLog.push("python " + keyArgs.join(" "));
          const close = runLogged("python", keyArgs, desktopLog, { timeoutMs: 35_000, cwd: repoRoot });
          const closedJson = path.join(leg.outDir, "closed.json");
          dt.closedClean = close.ok && fs.existsSync(closedJson)
            ? Boolean(JSON.parse(fs.readFileSync(closedJson, "utf8")).closed)
            : false;
          sleepSync(2000);
          const post = listIdecadProcesses();
          dt.remainingProcesses = post.length;
          commandsLog.push("powershell Get-Process ideCAD* (kapanış sonrası kontrol)");
        } finally {
          // bütünlük: masaüstü sonrası çıktı bayt-sabit
          dt.integrityOk = sha256(leg.projectPath) === leg.shaBefore;
        }
      };

      // 1. açılış: üretilen .ide10 (mevcut F3 ayağı — davranış aynen korundu)
      desktopLeg({
        label: `${baseName}.ide10`, projectPath: ide10Path, outDir: kabulDir,
        sessionPath: path.join(kabulDir, "session.json"),
        storyPath: path.join(kabulDir, "storytree.txt"),
        katOzetiPath: path.join(kabulDir, "kat-ozeti.txt"),
        dt: dt1, shaBefore: ide10ShaBefore,
      });

      // 2. açılış: yamalı .ide11 (F6/F4 bacakları; T-F6.3 deseni) — yalnız
      // birinci açılış temiz kapandığında koşulur (süreç hijyeni: açık
      // oturum birikmez, ikinci launch kalan sürecin üstüne binmez).
      if (!patch.ok) {
        dt2.failNote = `yamalı .ide11 üretilemedi — ikinci açılış koşulamadı (${patch.failNote ?? "yama ayağı kırmızı"})`;
      } else if (dt1.closedClean !== true || (dt1.remainingProcesses ?? 1) !== 0) {
        dt2.failNote = `birinci açılış temiz kapanmadı (closed=${dt1.closedClean}, kalan süreç ${dt1.remainingProcesses ?? "?"}) — ikinci açılış koşulmadı (süreç hijyeni)`;
      } else {
        sleepSync(3000);
        const outDir2 = path.join(kabulDir, "ide11-yamali");
        fs.mkdirSync(outDir2, { recursive: true });
        desktopLeg({
          label: patchedIde11Name, projectPath: patchedIde11Path, outDir: outDir2,
          sessionPath: path.join(outDir2, "session.json"),
          storyPath: path.join(outDir2, "storytree.txt"),
          katOzetiPath: path.join(outDir2, "kat-ozeti.txt"),
          dt: dt2, shaBefore: patchedShaBefore,
        });
      }
    }
  } else if (options.skipDesktop && conversionOk) {
    bundle.desktop = { skipped: true, integrityOk: sha256(ide10Path) === ide10ShaBefore };
    bundle.desktop11 = { skipped: true, ...(patch.ok ? { integrityOk: sha256(patchedIde11Path) === patchedShaBefore } : {}) };
  }

  // ── D kaynak korpus bütünlüğü ─────────────────────────────────────────────
  // Profil x11:null → X11 diskte yok (SAPMA-A): bütünlük yalnız B0/A0 üzerinden.
  const corpusAfter: { b0: string; a0: string; x11?: string } = {
    b0: sha256(options.inputPath),
    a0: sha256(options.donorPath),
    ...(oracleCtx.x11 !== null ? { x11: sha256(options.x11Path) } : {}),
  };
  const corpusOk = corpusBefore.b0 === corpusAfter.b0
    && corpusBefore.a0 === corpusAfter.a0
    && (oracleCtx.x11 === null || corpusBefore.x11 === corpusAfter.x11);
  bundle.corpusIntegrityOk = corpusOk;
  if (!corpusOk) {
    const parts: string[] = [];
    if (corpusBefore.b0 !== corpusAfter.b0) parts.push("B0");
    if (corpusBefore.a0 !== corpusAfter.a0) parts.push("A0");
    if (oracleCtx.x11 !== null && corpusBefore.x11 !== corpusAfter.x11) parts.push("X11");
    bundle.corpusIntegrityNote = `SHA değişti: ${parts.join(", ")}`;
  }

  // ── E ÖZET + kanıt yazımı ──────────────────────────────────────────────────
  const results = evaluateGate(bundle, { skipDesktop: options.skipDesktop }, oracleCtx);
  const summary = formatSummary(results, {
    negatifTest: options.negatifTest,
    skipDesktop: options.skipDesktop,
    runDir,
    ...(oracleCtx.profilePath
      ? { oracleProfile: `${oracleCtx.projectId} (${path.basename(oracleCtx.profilePath)})` }
      : {}),
  });
  console.log("\n" + summary);

  const exitCode = computeExitCode(results);
  const fullProfile = isFullAcceptanceProfile(results);
  const x11yokCount = results.filter(r => r.status === "X11-YOK").length;

  // ozet.md
  const ozetLines = [
    `# ide-acceptance-gate koşu özeti — ${dateStamp} run-${runId}`,
    "",
    summary,
    "",
    `## Komutlar (birebir; ham çıktılar run klasöründe)`,
    ...commandsLog.map(c => `- \`${c}\``),
    "",
    `## Kanıt yolları`,
    `- Üretim: \`${uretimDir}\` (dönüşüm çıktıları + F6 yamalı ${patchedIde11Name})`,
    `- Ölçüm: \`${olcumDir}\` (census + parmak izleri + çift diff JSON'ları + yama-olcum.json)`,
    `- Masaüstü: \`${kabulDir}\` (JSON+PNG, storytree, kat-ozeti, closed.json) + \`${path.join(kabulDir, "ide11-yamali")}\` (yamalı .ide11 açılışı)`,
    "",
    `**Kapı:** ${exitCode === 0
      ? (fullProfile ? "TAM KABUL YEŞİL" : x11yokCount > 0 ? "yeşil (X11-YOK profili — tam kabul DEĞİLDİR; SAPMA-A)" : "yeşil (SKIPPED profili — tam kabul DEĞİLDİR)")
      : "KIRMIZI"} — exit ${exitCode}`,
  ];
  fs.writeFileSync(path.join(runDir, "ozet.md"), ozetLines.join("\n") + "\n", "utf8");

  // README.md (§4 sözleşme: komut → gerçek çıktı → yorum)
  const stageNotes: string[] = [];
  stageNotes.push(`- **A0 ÜRET:** ${conversionOk ? "üretildi" : "BAŞARISIZ"} — girdi kopyası bayt-özdeş (SHA ${inputSha.slice(0, 16)}…); donör ${path.basename(options.donorPath)} yalnız okundu; çıktılar yeni adla (${baseName}.ide10/.ide11).${options.negatifTest ? " **NEGATİF TEST profili:** .ide10 stored-CRC kasıtlı bozuldu." : ""}`);
  stageNotes.push(`- **B ÖLÇ:** probe census → ${bundle.census.ide10 ? `${bundle.census.ide10.attributeStreams} alt-akış` : "census yok"}; parmak izleri ${bundle.pairHs10VsA0 ? "tam" : "eksik"}; HS↔A0 diff ${bundle.pairHs10VsA0 ? "üretildi" : "ÜRETİLEMEDİ"}; HS↔X11 diff ${bundle.pairHs11VsX11 ? "üretildi" : oracleCtx.x11 === null ? "X11-YOK (SAPMA-A — ticari .ide11 eşi olmadığından koşulmadı)" : "ÜRETİLEMEDİ"}.`);
  stageNotes.push(`- **B2 YAMA (F6 ayağı):** ${patch.ok
    ? `yamalı çıktı \`${patch.patchedFile}\`; ${patch.changedBytes} bayt değişti (alan ${patch.fieldBytes} + CRC ${patch.crcBytes}; kapsam dışı ${patch.outOfScopeBytes}); parse ${patch.targetName ?? oracleCtx.constants.patchBeamName}=${patch.patchedHeight}, diğer ${patch.targetName ?? oracleCtx.constants.patchBeamName} ${patch.otherK34Count} adet (değişen ${patch.otherK34Changed}); CRC=${patch.crcValid}; hedef ${patch.targetId} (${patch.targetFloor})`
    : `KIRMIZI notu: ${patch.failNote ?? "yama ayağı kırmızı"}`}.`);
  stageNotes.push(`- **C MASAÜSTÜ:** ${options.skipDesktop
    ? "SKIPPED (--skip-desktop; tam kabul profili DEĞİLDİR)"
    : `açılış 1 (.ide10): ${bundle.desktop.failNote ? `KIRMIZI notu: ${bundle.desktop.failNote}` : `başlık: ${bundle.desktop.mainTitle ?? "?"}; kat ${bundle.desktop.floorsFound?.length ?? "?"}/${expectedFloors.length}; kapanış ${bundle.desktop.closedClean ? "temiz" : "SORUNLU"}`}; açılış 2 (yamalı .ide11): ${bundle.desktop11.failNote ? `KIRMIZI notu: ${bundle.desktop11.failNote}` : `başlık: ${bundle.desktop11.mainTitle ?? "?"}; kat ${bundle.desktop11.floorsFound?.length ?? "?"}/${expectedFloors.length}; kapanış ${bundle.desktop11.closedClean ? "temiz" : "SORUNLU"}`}`}.`);
  stageNotes.push(`- **D BÜTÜNLÜK:** ${oracleCtx.x11 === null ? "B0/A0 (X11-YOK profili, SAPMA-A)" : "B0/A0/X11"} ${corpusOk ? "bayt-sabit kaldı" : "DEĞİŞTİ (KIRMIZI)"}; üretilen .ide10 + yamalı .ide11 masaüstü sonrası ${bundle.desktop.integrityOk === false || bundle.desktop11.integrityOk === false ? "DEĞİŞTİ" : "bayt-sabit"}.`);
  const readme = [
    `# acceptance-gate run-${runId} (${dateStamp})`,
    "",
    `Bu klasör \`${path.join("scripts", "hsyncad", "ide-acceptance-gate.ts")}\` koşusunun kanıtıdır; immutable'dır, düzeltme yeni run klasörüyle eklenir.`,
    "",
    "## Ne ölçüldü, hangi komutla, sonuç ne",
    ...stageNotes,
    "",
    "## Ölçüt tablosu (ölçüt → ölçülen → sonuç)",
    "```",
    ...results.map(r => `${r.id} [${r.status}] ${r.criterion} | hedef: ${r.target} | ölçülen: ${r.measured}`),
    "```",
    "",
    "## Birebir komutlar",
    "```",
    ...commandsLog,
    "```",
    "",
    "## Yorum",
    exitCode === 0
      ? (fullProfile ? "Kapı TAM KABUL profiliyle YEŞİL: 11-KABUL §2 oracle ölçütlerinin + F6 yama senaryosunun tamamı ölçüldü ve geçti (G7: F3+F4+F6 tümü)." : x11yokCount > 0 ? "Kapı yeşil ama X11-YOK profili (SAPMA-A; KARAR-001): B14–B16 ticari .ide11 eşi olmadığından ölçülemez — tam kabul DEĞİLDİR." : "Kapı yeşil ama SKIPPED profili: masaüstü aşaması koşulmadı — tam kabul DEĞİLDİR.")
      : "Kapı KIRMIZI: en az bir ölçüt ölçülen değeriyle oracle'a oturmuyor (bkz. tablo).",
    `Oracle sabitleri ${oracleCtx.profilePath
      ? `bu koşuda --oracle-json profiliyle birleşti: ${oracleCtx.projectId} (${path.basename(oracleCtx.profilePath)}); gömülü ORACLE tablosu (11-KABUL §2) değişmedi`
      : "script içi ORACLE tablosudur (11-KABUL §2); bu koşuda değişiklik yapılmadı"}.`,
  ].join("\n");
  fs.writeFileSync(path.join(runDir, "README.md"), readme + "\n", "utf8");

  fs.writeFileSync(path.join(runDir, "gate-sonuc.json"), JSON.stringify({
    dateStamp, runId, negatifTest: options.negatifTest, skipDesktop: options.skipDesktop,
    exitCode, fullProfile,
    ...(oracleCtx.profilePath ? { oracleProfile: { projectId: oracleCtx.projectId, path: oracleCtx.profilePath, x11: oracleCtx.x11 } } : {}),
    results,
    bundle: {
      conversionOk: bundle.conversionOk,
      crcValid: bundle.crcValid,
      census: bundle.census,
      pairHs10VsA0Present: bundle.pairHs10VsA0 !== null,
      pairHs11VsX11Present: bundle.pairHs11VsX11 !== null,
      patch: bundle.patch,
      desktop: bundle.desktop,
      desktop11: bundle.desktop11,
      corpusIntegrityOk: bundle.corpusIntegrityOk,
    },
  }, null, 2), "utf8");

  console.log(`\nKanıt: ${runDir}`);
  process.exitCode = exitCode;
}

const invokedDirectly = (() => {
  try {
    return Boolean(process.argv[1]) && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
  } catch {
    return false;
  }
})();

if (invokedDirectly) {
  main().catch(err => {
    console.error("FATAL:", err instanceof Error ? err.message : err);
    process.exit(1);
  });
}
