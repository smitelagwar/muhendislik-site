/**
 * T-F7.1 — KALICI IDE KABUL KAPISI (G7; 11-KABUL-VE-KANIT-PROTOKOLU.md §3)
 *
 * Tek komutla uçtan uca kabul zinciri:
 *   A0 ÜRET  : convert_trial_to_native ile B0_orijinal.ide11trial → .ide10 + .ide11
 *              (donör A0; çıktılar daima YENİ adla kanıt klasörüne)
 *   B  ÖLÇ   : probe-attribute-streams (30.260) + ide-fidelity-audit her çıktıya
 *              + çift farkları HS↔A0 ve HS↔X11 (compare-pairs'ın alan-düzeyi
 *              karşılaştırma motoru; taze çıktı etiketleriyle)
 *   C  MASAÜSTÜ: desktop.py ile .ide10 çıktısını gerçek ideCAD'de aç
 *              (başlık + kat ağacı ölçütleri; JSON+PNG kanıt) — bayrakla
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
 *   v1 — 2026-11-19 (T-F7.1): ilk tablo; 11-KABUL §2'nin tamamı tek tek işlendi
 *        (30.260 / 468 / 2 / 10 / 10 / 1.266 / 6/6 / 159 / boyut bandı /
 *        XX uydurma 0 / HS↔X11 geometri-etiket-yük 0 / CRC / masaüstü).
 *   v2 — 2026-11-19 (T-F7.1 ilk tam koşu): 11-KABUL §2 "1.266/1.266 geometri"
 *        değeri merdiven ayrıştırılmadan ÖNCEKİ okuyucu sayımıdır; güncel okuyucu
 *        7 merdiveni de eleman sayar (T3.3d kanıtı: "geometri 1.266+7") ve
 *        TAMAMI (1.273) geometri/etiket düzeyinde A0 ile eşittir. Ölçüt bu yüzden
 *        1.266 çekirdek + 7 merdiven = 1.273 toplam sayımı üzerinden ölçülür;
 *        çekirdek değer (1.266) tabloda korunur. Diğer ölçütler değişmedi.
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { verifyIdeHeaderChecksum } from "../../src/lib/hsyncad/ide-import/ide-binary-codec";

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
} as const;

/** 11-KABUL §2 R3 alan adları (repo okuyucu adlarıyla birebir). */
export const SEISMIC_ORACLE_FIELDS = [
  "rEntered", "rSelectedRatio", "liveLoadFactorN", "subgradeKoTfM3",
  "bearingCapacityQtTfM2", "importanceI", "ss", "s1", "sds", "sd1",
] as const;

export type CriterionStatus = "GECTI" | "KIRMIZI" | "SKIPPED";

export interface CriterionResult {
  stage: "A" | "B" | "C" | "D";
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
  desktop: DesktopMeasurement;
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
export function evaluateStageB(bundle: MeasurementBundle): CriterionResult[] {
  const out: CriterionResult[] = [];
  const c10 = bundle.census.ide10;

  out.push(c10
    ? crit("B", "B1", "201094 alt-akış sayısı (.ide10)", tr(ORACLE.attributeStreams),
      tr(c10.attributeStreams), c10.attributeStreams === ORACLE.attributeStreams ? "GECTI" : "KIRMIZI")
    : RED_MISSING("B", "B1", "201094 alt-akış sayısı (.ide10)", tr(ORACLE.attributeStreams), "probe census yok"));

  out.push(c10
    ? crit("B", "B2", "alt-akış sıkışmış boyut bandı (±%1)", `~${(ORACLE.streamCompressedBytes / 1e6).toFixed(1)} MB`,
      `${(c10.compressedBytes / 1e6).toFixed(1)} MB`, withinPct(c10.compressedBytes, ORACLE.streamCompressedBytes, ORACLE.streamSizeTolerancePct) ? "GECTI" : "KIRMIZI")
    : RED_MISSING("B", "B2", "alt-akış sıkışmış boyut bandı (±%1)", `~${(ORACLE.streamCompressedBytes / 1e6).toFixed(1)} MB`, "probe census yok"));

  out.push(c10
    ? crit("B", "B3", "alt-akış açılmış boyut bandı (±%1)", `~${(ORACLE.streamRawBytes / 1e6).toFixed(1)} MB`,
      `${(c10.rawBytes / 1e6).toFixed(1)} MB`, withinPct(c10.rawBytes, ORACLE.streamRawBytes, ORACLE.streamSizeTolerancePct) ? "GECTI" : "KIRMIZI")
    : RED_MISSING("B", "B3", "alt-akış açılmış boyut bandı (±%1)", `~${(ORACLE.streamRawBytes / 1e6).toFixed(1)} MB`, "probe census yok"));

  const d = bundle.pairHs10VsA0;
  if (!d) {
    out.push(RED_MISSING("B", "B4", "R4 donatı 468/468", `${ORACLE.rebarBlocks}/0 uyumsuz`, "HS↔A0 diff yok"));
    out.push(RED_MISSING("B", "B5", "R1 malzeme 2/2", "2/2 (diff 0)", "HS↔A0 diff yok"));
    out.push(RED_MISSING("B", "B6", "R3 deprem/zemin 10/10 alan", "10/10 (diff 0)", "HS↔A0 diff yok"));
    out.push(RED_MISSING("B", "B7", "R5 F9/modal tablo 10", "10/10", "HS↔A0 diff yok"));
    out.push(RED_MISSING("B", "B8", "F9 frekans sapması ≤1e-9", "≤ 1e-9", "HS↔A0 diff yok"));
    out.push(RED_MISSING("B", "B9", "geometri 1.266+7 (1 µm)", "1.273/1.273 (diff 0)", "HS↔A0 diff yok"));
    out.push(RED_MISSING("B", "B10", "kat 6/6", "6/6", "HS↔A0 diff yok"));
    out.push(RED_MISSING("B", "B11", "kesit etiketi 1.266+7", "1.273/1.273", "HS↔A0 diff yok"));
    out.push(RED_MISSING("B", "B12", "XX uydurma etiket 0", "0", "HS↔A0 diff yok"));
    out.push(RED_MISSING("B", "B13", "döşeme yükü 159/159", "159/159 (diff 0)", "HS↔A0 diff yok"));
    return out;
  }
  const e = d.elements;
  out.push(crit("B", "B4", "R4 donatı 468/468", `${ORACLE.rebarBlocks}/0 uyumsuz`,
    `${tr(e.rebarBoth)}/${tr(e.rebarMismatch)}`,
    e.rebarBoth === ORACLE.rebarBlocks && e.rebarMismatch === 0 ? "GECTI" : "KIRMIZI"));

  out.push(crit("B", "B5", "R1 malzeme 2/2", `${ORACLE.materials}/2 (diff 0)`,
    `${d.materials.countA}/${d.materials.countB} (diff ${d.materials.diff.length})`,
    d.materials.countA === ORACLE.materials && d.materials.countB === ORACLE.materials && d.materials.diff.length === 0 ? "GECTI" : "KIRMIZI"));

  const seismicOracleDiff = d.seismic.diff.filter(x => (SEISMIC_ORACLE_FIELDS as readonly string[]).includes(x.field));
  out.push(crit("B", "B6", "R3 deprem/zemin 10/10 alan", "10/10 (diff 0)",
    d.seismic.presentA && d.seismic.presentB ? `10/10 (diff ${seismicOracleDiff.length})` : `okunamadı (A:${d.seismic.presentA} B:${d.seismic.presentB})`,
    d.seismic.presentA && d.seismic.presentB && seismicOracleDiff.length === 0 ? "GECTI" : "KIRMIZI"));

  out.push(crit("B", "B7", "R5 F9/modal tablo 10", `${ORACLE.f9ModalTables}/10 (tablo diff 0)`,
    `${d.f9.tablesA}/${d.f9.tablesB} (tablo diff ${d.f9.tableDiff.length})`,
    d.f9.tablesA === ORACLE.f9ModalTables && d.f9.tablesB === ORACLE.f9ModalTables && d.f9.tableDiff.length === 0 ? "GECTI" : "KIRMIZI"));

  const dev = d.f9.maxFrequencyDeviation;
  out.push(crit("B", "B8", "F9 frekans sapması ≤1e-9", "≤ 1e-9",
    dev === null ? "ölçülemedi (tablo yok)" : dev.toExponential(3),
    dev !== null && dev <= ORACLE.f9MaxFrequencyDeviation ? "GECTI" : "KIRMIZI"));

  out.push(crit("B", "B9", "geometri 1.266+7 (1 µm)", "1.273/1.273 (diff 0)",
    `${tr(e.matched)}/${tr(e.geometryEqual)} (diff ${tr(e.geometryDiff)}, eksik ${e.missingInB}/${e.extraInB})`,
    e.matched === ORACLE.elements && e.geometryEqual === ORACLE.elements && e.geometryDiff === 0 && e.missingInB === 0 && e.extraInB === 0 ? "GECTI" : "KIRMIZI",
    `1.266 çekirdek + ${ORACLE.elementsStairs} merdiven = ${ORACLE.elements} (v2 sürüm notu)`));

  out.push(crit("B", "B10", "kat 6/6", "6/6 (Asansör Mak. Dairesi dahil)",
    `${d.floors.matched}/6 (fark ${d.floors.geometryDiff}, tek taraf ${d.floors.onlyInA.length + d.floors.onlyInB.length})`,
    d.floors.matched === ORACLE.floors && d.floors.geometryDiff === 0 && d.floors.onlyInA.length === 0 && d.floors.onlyInB.length === 0 ? "GECTI" : "KIRMIZI"));

  out.push(crit("B", "B11", "kesit etiketi 1.266+7", "1.273/1.273",
    `${tr(e.labelEqual)}/${tr(e.labelDiff)}`,
    e.labelEqual === ORACLE.labels && e.labelDiff === 0 ? "GECTI" : "KIRMIZI"));

  out.push(crit("B", "B12", "XX uydurma etiket 0", "0",
    `${e.labelDiff}`,
    e.labelDiff === ORACLE.xxFabricatedLabels ? "GECTI" : "KIRMIZI",
    "ölçüm: donör kaynaklı birebirlik — HS↔A0 labelDiff (donör A0 etiketlerinden sapma = uydurma)"));

  const sl = bundle.slabLoadCount;
  out.push(sl
    ? crit("B", "B13", "döşeme yükü 159/159", "159/159 (diff 0)",
      `${tr(sl.hs10)}/${tr(sl.a0)} (fark ${tr(e.loadsMismatch)}, tek taraf ${e.loadsOnlyA}/${e.loadsOnlyB})`,
      sl.hs10 === ORACLE.slabLoads && sl.a0 === ORACLE.slabLoads && e.loadsMismatch === 0 && e.loadsOnlyA === 0 && e.loadsOnlyB === 0 ? "GECTI" : "KIRMIZI",
      "ölçüm: parmak izlerinde slabLoads taşıyan eleman sayısı + HS↔A0 yük farkı")
    : RED_MISSING("B", "B13", "döşeme yükü 159/159", "159/159 (diff 0)", "parmak izi sayımı yok"));

  return out;
}

export function evaluateStageB11(bundle: MeasurementBundle): CriterionResult[] {
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
      e.geometryDiff === ORACLE.ide11GeometryLabelLoadDiff ? "GECTI" : "KIRMIZI"),
    crit("B", "B15", "HS↔X11 etiket farkı 0", "0",
      `${tr(e.labelDiff)}`, e.labelDiff === ORACLE.ide11GeometryLabelLoadDiff ? "GECTI" : "KIRMIZI"),
    crit("B", "B16", "HS↔X11 yük farkı 0", "0",
      `${tr(e.loadsMismatch)} (tek taraf ${e.loadsOnlyA}/${e.loadsOnlyB})`,
      e.loadsMismatch === ORACLE.ide11GeometryLabelLoadDiff && e.loadsOnlyA === 0 && e.loadsOnlyB === 0 ? "GECTI" : "KIRMIZI"),
  ];
}

export function evaluateStageC(bundle: MeasurementBundle): CriterionResult[] {
  const dt = bundle.desktop;
  if (dt.skipped) {
    const note = "CI/hızlı profil — tam kabul profili DEĞİLDİR";
    return [
      crit("C", "C1", "ideCAD açılış (başlık: dosya+proje+aktif kat)", "başlık tam", "SKIPPED", "SKIPPED", note),
      crit("C", "C2", "kat ağacı tam 6/6", "6/6", "SKIPPED", "SKIPPED", note),
      crit("C", "C3", "masaüstü tur sonunda süreç kapanışı", "kapalı, süreç 0", "SKIPPED", "SKIPPED", note),
    ];
  }
  const titleOk = Boolean(dt.mainTitle)
    && /\[[^\]]+\]/.test(dt.mainTitle!)
    && (dt.titleMustContain ?? [ORACLE.desktopProjectTitle]).every(part => dt.mainTitle!.includes(part));
  const out: CriterionResult[] = [];
  out.push(crit("C", "C1", "ideCAD açılış (başlık: dosya+proje+aktif kat)", "başlık tam",
    dt.failNote && !dt.mainTitle ? dt.failNote : (dt.mainTitle ?? "başlık okunamadı"),
    titleOk ? "GECTI" : "KIRMIZI",
    "pencere başlığında dosya adı + proje adı + aktif kat bulunmalı"));
  const expected = dt.floorsExpected ?? [];
  const found = dt.floorsFound ?? [];
  const floorsOk = expected.length === ORACLE.desktopFloors && expected.every(f => found.includes(f));
  out.push(crit("C", "C2", "kat ağacı tam 6/6", "6/6",
    found.length ? `${found.length}/${ORACLE.desktopFloors} (${found.join(", ")})` : (dt.failNote ?? "kat ağacı okunamadı"),
    floorsOk ? "GECTI" : "KIRMIZI",
    "salt-okunur TVM dökümü (girdi gönderilmez)"));
  out.push(crit("C", "C3", "masaüstü tur sonunda süreç kapanışı", "kapalı, süreç 0",
    dt.closedClean === undefined ? (dt.failNote ?? "kapanış kanıtı yok") : `closed=${dt.closedClean}, kalan süreç ${dt.remainingProcesses ?? "?"}`,
    dt.closedClean === true && (dt.remainingProcesses ?? 1) === 0 ? "GECTI" : "KIRMIZI"));
  return out;
}

export function evaluateGate(bundle: MeasurementBundle, opts: { skipDesktop: boolean }): CriterionResult[] {
  const out: CriterionResult[] = [];
  out.push(crit("A", "A1", "dönüşüm üretimi (.ide10 + .ide11, donör A0)", "iki çıktı üretildi",
    bundle.conversionOk ? (bundle.conversionDetail ?? "üretildi") : (bundle.conversionError ?? "üretilemedi"),
    bundle.conversionOk ? "GECTI" : "KIRMIZI"));
  const crcOk = bundle.crcValid.ide10 === ORACLE.carrierChecksumValid && bundle.crcValid.ide11 === ORACLE.carrierChecksumValid;
  out.push(crit("A", "A2", "çıktı taşıyıcı CRC'si geçerli", "ikisi de geçerli",
    `ide10=${bundle.crcValid.ide10}, ide11=${bundle.crcValid.ide11}`, crcOk ? "GECTI" : "KIRMIZI"));

  out.push(...evaluateStageB(bundle));
  out.push(...evaluateStageB11(bundle));
  out.push(...evaluateStageC(bundle));

  out.push(crit("C", "C4", "masaüstü sonrası çıktı bütünlüğü (.ide10 SHA sabit)", "değişmedi",
    bundle.desktop.integrityOk === undefined
      ? (opts.skipDesktop ? "masaüstü koşulmadı (skip)" : "bütünlük ölçümü yok")
      : bundle.desktop.integrityOk ? "değişmedi" : "DEĞİŞTİ",
    bundle.desktop.integrityOk === false ? "KIRMIZI" : "GECTI",
    opts.skipDesktop ? "--skip-desktop profili: masaüstü erişimi olmadığından kanıt zayıf profil" : undefined));

  out.push(crit("D", "D1", "kaynak korpus bayt-sabit (B0/A0/X11 yalnız OKU)", "SHA değişmedi",
    bundle.corpusIntegrityOk ? "SHA değişmedi" : (bundle.corpusIntegrityNote ?? "DEĞİŞTİ"),
    bundle.corpusIntegrityOk ? "GECTI" : "KIRMIZI"));
  return out;
}

export function computeExitCode(results: CriterionResult[]): number {
  return results.some(r => r.status === "KIRMIZI") ? 1 : 0;
}

/** Tam kabul profili: KIRMIZI yok VE SKIPPED yok. */
export function isFullAcceptanceProfile(results: CriterionResult[]): boolean {
  return results.every(r => r.status === "GECTI");
}

export function formatSummary(results: CriterionResult[], meta: { negatifTest: boolean; skipDesktop: boolean; runDir: string }): string {
  const lines: string[] = [];
  lines.push("=".repeat(100));
  lines.push("IDE KABUL KAPISI (T-F7.1 / G7) — ÖZET RAPOR");
  if (meta.negatifTest) lines.push("PROFİL: NEGATİF TEST (bilerek bozulan çıktıyla KIRMIZI beklenir)");
  else if (meta.skipDesktop) lines.push("PROFİL: CI/HIZLI (--skip-desktop — tam kabul profili DEĞİLDİR)");
  else lines.push("PROFİL: TAM KABUL (masaüstü dahil)");
  lines.push("Kanıt klasörü: " + meta.runDir);
  lines.push("-".repeat(100));
  lines.push(`${"AŞAMA".padEnd(7)}${"ÖLÇÜT".padEnd(48)}${"HEDEF".padEnd(24)}ÖLÇÜLEN → SONUÇ`);
  for (const r of results) {
    lines.push(`${r.stage.padEnd(7)}${r.criterion.padEnd(48)}${r.target.padEnd(24)}${r.measured} → ${r.status}`);
    if (r.note) lines.push(`${"".padEnd(7)}  not: ${r.note}`);
  }
  const gecti = results.filter(r => r.status === "GECTI").length;
  const kirmizi = results.filter(r => r.status === "KIRMIZI").length;
  const skipped = results.filter(r => r.status === "SKIPPED").length;
  lines.push("-".repeat(100));
  lines.push(`SONUÇ: ${gecti} GEÇTİ, ${kirmizi} KIRMIZI, ${skipped} SKIPPED`);
  if (kirmizi > 0) lines.push("KAPI: KIRMIZI — exit ≠ 0");
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
  "  C  MASAÜSTÜ desktop.py ile .ide10 çıktısını gerçek ideCAD'de aç; başlık + kat ağacı ölçütleri;",
  "             salt-okunur TVM kat ağacı dökümü; tur sonunda süreç kapanır (varsayılan AÇIK)",
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
  "  --negatif-test         Kasıtlı bozuk senaryo: üretilen .ide10 stored-CRC'si bozulur;",
  "                         KIRMIZI + exit ≠ 0 beklenir (doğrulama profili; masaüstü atlanır)",
  "  --stage-timeout-ms <n> Tek aşama üst sınırı [varsayılan: 900000 = 15 dk]",
  "  -h, --help             Bu yardım",
  "",
  "Sözleşme notları:",
  "  * Ölçütler 11-KABUL-VE-KANIT-PROTOKOLU.md §2'den saptırılamaz; sabitler tek ORACLE tablosu.",
  "  * Masaüstü aşaması öncesi Get-Process ideCAD kontrolü yapılır; açık oturum varsa aşama koşulamaz →",
  "    KIRMIZI ('ertelendi' profili YOK). Oturumu kapatıp yeniden koşun veya CI profili kullanın.",
  "  * B0/A0/X11 yalnız OKU; tüm çıktılar yeni adla kanıt klasörüne yazılır.",
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

  const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
  const toolsDir = path.join(options.campaignDir, "tools");
  for (const [label, p] of [["kampanya", options.campaignDir], ["tools", toolsDir], ["girdi", options.inputPath], ["donör", options.donorPath], ["X11", options.x11Path]] as const) {
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

  const corpusBefore = {
    b0: sha256(options.inputPath),
    a0: sha256(options.donorPath),
    x11: sha256(options.x11Path),
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
    desktop: { skipped: options.skipDesktop },
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
    const fingerprintTargets = [ide10Path, ide11Path, options.donorPath, options.x11Path];
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
      [fpLabel(ide11Path), fpLabel(options.x11Path), "pairHs11VsX11"],
    ];
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
  let expectedProjectName = ORACLE.desktopProjectTitle;
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

  // ── C MASAÜSTÜ ────────────────────────────────────────────────────────────
  const ide10ShaBefore = conversionOk ? sha256(ide10Path) : "";
  if (!options.skipDesktop && conversionOk) {
    console.log("[C MASAÜSTÜ] gerçek ideCAD kabul turu (desktop.py) ...");
    const dt: DesktopMeasurement = {
      skipped: false,
      titleMustContain: [`${baseName}.ide10`, expectedProjectName],
      floorsExpected: expectedFloors,
    };
    bundle.desktop = dt;
    const desktopLog = path.join(kabulDir, "desktop-cikti.log");
    const sessionPath = path.join(kabulDir, "session.json");

    const pre = listIdecadProcesses();
    commandsLog.push("powershell Get-Process ideCAD* (ön kontrol)");
    if (pre.length > 0) {
      dt.failNote = `önceden açık ideCAD oturumu (pid ${pre.map(p => p.id).join(",")}) — kapı sözleşmesi: masaüstü aşaması koşulamaz, KIRMIZI. Oturum kapatıp yeniden koşun (CI profili: --skip-desktop).`;
      console.log(`[C MASAÜSTÜ] ${dt.failNote}`);
      dt.integrityOk = sha256(ide10Path) === ide10ShaBefore;
    } else {
      const launchArgs = ["-X", "utf8", path.join("scripts", "idecad", "desktop.py"), "launch",
        "--exe", options.desktopExe, "--project", ide10Path, "--dismiss-trial",
        "--session", sessionPath, "--out-dir", kabulDir];
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
      } else {
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
                && w.title.includes(`${baseName}.ide10`) && /\[[^\]]+\]/.test(w.title));
              if (w) { title = w.title; mainHwnd = w.hwnd; break; }
            } catch { /* tekrar dener */ }
          }
          sleepSync(3000);
        }
        if (title === null || mainHwnd === null) {
          dt.failNote = `tam yükleme başlığı beklenemedi (pid ${pid}) — bkz. ${desktopLog}`;
        } else {
          const bindArgs = ["-X", "utf8", path.join("scripts", "idecad", "desktop.py"), "bind",
            "--hwnd", String(mainHwnd), "--expect-title", title,
            "--session", sessionPath, "--out-dir", kabulDir];
          commandsLog.push("python " + bindArgs.join(" "));
          const bind = runLogged("python", bindArgs, desktopLog, { timeoutMs: 35_000, cwd: repoRoot });
          const obsArgs = ["-X", "utf8", path.join("scripts", "idecad", "desktop.py"), "observe", "--session", sessionPath, "--brief"];
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
          const ps1Path = path.join(kabulDir, "storytree-dump.ps1");
          fs.writeFileSync(ps1Path, STORYTREE_PS1.trimStart() + "\n", "utf8");
          const storyPath = path.join(kabulDir, "storytree.txt");
          const treeArgs = ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", ps1Path,
            "-TargetPid", String(pid), "-MainHwnd", String(mainHwnd), "-OutFile", storyPath];
          commandsLog.push("powershell " + treeArgs.join(" "));
          const tree = runLogged("powershell", treeArgs, desktopLog, { timeoutMs: 180_000 });
          if (tree.ok && fs.existsSync(storyPath)) {
            const nodeNames = fs.readFileSync(storyPath, "utf8")
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
            fs.writeFileSync(path.join(kabulDir, "kat-ozeti.txt"), katOzeti + "\n", "utf8");
          } else {
            dt.failNote = `kat ağacı TVM dökümü başarısız — bkz. ${desktopLog}`;
          }

          // kapanış
          const keyArgs = ["-X", "utf8", path.join("scripts", "idecad", "desktop.py"), "key",
            "--session", sessionPath, "--chord", "alt+f4"];
          commandsLog.push("python " + keyArgs.join(" "));
          const close = runLogged("python", keyArgs, desktopLog, { timeoutMs: 35_000, cwd: repoRoot });
          const closedJson = path.join(kabulDir, "closed.json");
          dt.closedClean = close.ok && fs.existsSync(closedJson)
            ? Boolean(JSON.parse(fs.readFileSync(closedJson, "utf8")).closed)
            : false;
          sleepSync(2000);
          const post = listIdecadProcesses();
          dt.remainingProcesses = post.length;
          commandsLog.push("powershell Get-Process ideCAD* (kapanış sonrası kontrol)");
        }
      }
      // bütünlük: masaüstü sonrası .ide10 bayt-sabit
      dt.integrityOk = sha256(ide10Path) === ide10ShaBefore;
      bundle.desktop = dt;
    }
  } else if (options.skipDesktop && conversionOk) {
    bundle.desktop = { skipped: true, integrityOk: sha256(ide10Path) === ide10ShaBefore };
  }

  // ── D kaynak korpus bütünlüğü ─────────────────────────────────────────────
  const corpusAfter = {
    b0: sha256(options.inputPath),
    a0: sha256(options.donorPath),
    x11: sha256(options.x11Path),
  };
  const corpusOk = corpusBefore.b0 === corpusAfter.b0 && corpusBefore.a0 === corpusAfter.a0 && corpusBefore.x11 === corpusAfter.x11;
  bundle.corpusIntegrityOk = corpusOk;
  if (!corpusOk) {
    const parts: string[] = [];
    if (corpusBefore.b0 !== corpusAfter.b0) parts.push("B0");
    if (corpusBefore.a0 !== corpusAfter.a0) parts.push("A0");
    if (corpusBefore.x11 !== corpusAfter.x11) parts.push("X11");
    bundle.corpusIntegrityNote = `SHA değişti: ${parts.join(", ")}`;
  }

  // ── E ÖZET + kanıt yazımı ──────────────────────────────────────────────────
  const results = evaluateGate(bundle, { skipDesktop: options.skipDesktop });
  const summary = formatSummary(results, {
    negatifTest: options.negatifTest,
    skipDesktop: options.skipDesktop,
    runDir,
  });
  console.log("\n" + summary);

  const exitCode = computeExitCode(results);
  const fullProfile = isFullAcceptanceProfile(results);

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
    `- Üretim: \`${uretimDir}\``,
    `- Ölçüm: \`${olcumDir}\` (census + parmak izleri + çift diff JSON'ları)`,
    `- Masaüstü: \`${kabulDir}\` (JSON+PNG, storytree, kat-ozeti, closed.json)`,
    "",
    `**Kapı:** ${exitCode === 0 ? (fullProfile ? "TAM KABUL YEŞİL" : "yeşil (SKIPPED profili — tam kabul DEĞİLDİR)") : "KIRMIZI"} — exit ${exitCode}`,
  ];
  fs.writeFileSync(path.join(runDir, "ozet.md"), ozetLines.join("\n") + "\n", "utf8");

  // README.md (§4 sözleşme: komut → gerçek çıktı → yorum)
  const stageNotes: string[] = [];
  stageNotes.push(`- **A0 ÜRET:** ${conversionOk ? "üretildi" : "BAŞARISIZ"} — girdi kopyası bayt-özdeş (SHA ${inputSha.slice(0, 16)}…); donör ${path.basename(options.donorPath)} yalnız okundu; çıktılar yeni adla (${baseName}.ide10/.ide11).${options.negatifTest ? " **NEGATİF TEST profili:** .ide10 stored-CRC kasıtlı bozuldu." : ""}`);
  stageNotes.push(`- **B ÖLÇ:** probe census → ${bundle.census.ide10 ? `${bundle.census.ide10.attributeStreams} alt-akış` : "census yok"}; parmak izleri ${bundle.pairHs10VsA0 ? "tam" : "eksik"}; HS↔A0 diff ${bundle.pairHs10VsA0 ? "üretildi" : "ÜRETİLEMEDİ"}; HS↔X11 diff ${bundle.pairHs11VsX11 ? "üretildi" : "ÜRETİLEMEDİ"}.`);
  stageNotes.push(`- **C MASAÜSTÜ:** ${options.skipDesktop ? "SKIPPED (--skip-desktop; tam kabul profili DEĞİLDİR)" : bundle.desktop.failNote ? `KIRMIZI notu: ${bundle.desktop.failNote}` : `başlık: ${bundle.desktop.mainTitle ?? "?"}; kat ${bundle.desktop.floorsFound?.length ?? "?"}/${expectedFloors.length}; kapanış ${bundle.desktop.closedClean ? "temiz" : "SORUNLU"}`}.`);
  stageNotes.push(`- **D BÜTÜNLÜK:** B0/A0/X11 ${corpusOk ? "bayt-sabit kaldı" : "DEĞİŞTİ (KIRMIZI)"}; üretilen .ide10 masaüstü sonrası ${bundle.desktop.integrityOk === false ? "DEĞİŞTİ" : "bayt-sabit"}.`);
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
      ? (fullProfile ? "Kapı TAM KABUL profiliyle YEŞİL: 11-KABUL §2 oracle ölçütlerinin tamamı ölçüldü ve geçti." : "Kapı yeşil ama SKIPPED profili: masaüstü aşaması koşulmadı — tam kabul DEĞİLDİR.")
      : "Kapı KIRMIZI: en az bir ölçüt ölçülen değeriyle oracle'a oturmuyor (bkz. tablo).",
    `Oracle sabitleri script içi ORACLE tablosudur (11-KABUL §2); bu koşuda değişiklik yapılmadı.`,
  ].join("\n");
  fs.writeFileSync(path.join(runDir, "README.md"), readme + "\n", "utf8");

  fs.writeFileSync(path.join(runDir, "gate-sonuc.json"), JSON.stringify({
    dateStamp, runId, negatifTest: options.negatifTest, skipDesktop: options.skipDesktop,
    exitCode, fullProfile,
    results,
    bundle: {
      conversionOk: bundle.conversionOk,
      crcValid: bundle.crcValid,
      census: bundle.census,
      pairHs10VsA0Present: bundle.pairHs10VsA0 !== null,
      pairHs11VsX11Present: bundle.pairHs11VsX11 !== null,
      desktop: bundle.desktop,
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
