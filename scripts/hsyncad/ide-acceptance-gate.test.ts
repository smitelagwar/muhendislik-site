/**
 * T-F7.1/T-F7.1b — ide-acceptance-gate birim testleri.
 *
 * Kapının saf değerlendirme katmanı (ORACLE + evaluateGate) mock ölçüm
 * demetleriyle sınanır. Negatif test sözleşmesi (11-KABUL G7): bilerek
 * bozuk/uydurma ölçümler kapıyı KIRMIZI'ya çevirmeli ve exit ≠ 0 üretmeli.
 * T-F7.1b: F6 yama ayağı (F1-F3) + yamalı .ide11 ikinci masaüstü açılışı
 * (C5-C7) mock katmanıyla aynı sözleşmeye bağlandı.
 *
 * Koşum: npx tsx --test scripts/hsyncad/ide-acceptance-gate.test.ts
 */
import test from "node:test";
import assert from "node:assert/strict";
import {
  ORACLE,
  SEISMIC_ORACLE_FIELDS,
  DEFAULT_ORACLE_CONTEXT,
  ORACLE_PROFILE_MERGE_KEYS,
  buildOracleContextFromRaw,
  evaluateGate,
  evaluateStageB,
  evaluateStageB11,
  evaluateStageF,
  evaluateStageC,
  formatSummary,
  computeExitCode,
  isFullAcceptanceProfile,
  withinPct,
  type MeasurementBundle,
  type PairDiff,
  type PatchMeasurement,
  type OracleContext,
} from "./ide-acceptance-gate";

// ── ölçüm demeti fabrikaları (mock ölçüm katmanı) ────────────────────────────

function greenPair(): PairDiff {
  return {
    elements: {
      matched: ORACLE.elements, missingInB: 0, extraInB: 0,
      geometryEqual: ORACLE.elements, geometryDiff: 0,
      labelEqual: ORACLE.labels, labelDiff: 0,
      rebarBoth: ORACLE.rebarBlocks, rebarMismatch: 0,
      loadsOnlyA: 0, loadsOnlyB: 0, loadsMismatch: 0,
    },
    floors: { matched: ORACLE.floors, geometryDiff: 0, onlyInA: [], onlyInB: [] },
    materials: { countA: ORACLE.materials, countB: ORACLE.materials, diff: [] },
    seismic: { presentA: true, presentB: true, diff: [] },
    f9: { tablesA: ORACLE.f9ModalTables, tablesB: ORACLE.f9ModalTables, maxFrequencyDeviation: 0, tableDiff: [] },
  };
}

const FLOORS = ["ASANSÖR MAK.DAİRESİ", "3. KAT", "2. KAT", "1. KAT", "ZEMİN KAT", "1. BODRUM"];

function greenDesktop(): MeasurementBundle["desktop"] {
  return {
    skipped: false,
    mainTitle: "ideCAD Statik - HS_B0_gate.ide10 - MUSTAFA SELVİ 1.KISIM - [1. BODRUM TAVANI,  0.50 KOTU]",
    titleMustContain: ["HS_B0_gate.ide10", "MUSTAFA SELVİ 1.KISIM"],
    floorsExpected: FLOORS,
    floorsFound: FLOORS,
    closedClean: true,
    remainingProcesses: 0,
    integrityOk: true,
  };
}

function greenDesktop11(): MeasurementBundle["desktop11"] {
  return {
    skipped: false,
    mainTitle: "ideCAD Statik - HS_B0_gate_2026-11-19-095629-F6-yamali.ide11 - MUSTAFA SELVİ 1.KISIM - [1. BODRUM TAVANI,  0.50 KOTU]",
    titleMustContain: ["HS_B0_gate_2026-11-19-095629-F6-yamali.ide11", "MUSTAFA SELVİ 1.KISIM"],
    floorsExpected: FLOORS,
    floorsFound: FLOORS,
    closedClean: true,
    remainingProcesses: 0,
    integrityOk: true,
  };
}

function greenPatch(): PatchMeasurement {
  return {
    ok: true,
    targetId: "ide-floor-1:6129433",
    targetName: ORACLE.patchBeamName,
    targetFloor: "3. KAT",
    originalHeight: ORACLE.patchFromHeight,
    patchedHeight: ORACLE.patchToHeight,
    changedBytes: ORACLE.patchChangedBytes,
    fieldBytes: ORACLE.patchFieldBytes,
    crcBytes: ORACLE.patchCrcBytes,
    outOfScopeBytes: 0,
    crcValid: true,
    otherK34Count: 3,
    otherK34Changed: 0,
    patchedFile: "HS_B0_gate_2026-11-19-095629-F6-yamali.ide11",
    patchedSha: "c29ebd482b26995a",
    elapsedMs: 12_000,
  };
}

function greenBundle(): MeasurementBundle {
  return {
    conversionOk: true,
    conversionDetail: "HS_B0_gate.ide10 + HS_B0_gate.ide11",
    crcValid: { ide10: true, ide11: true },
    census: {
      ide10: {
        file: "HS_B0_gate.ide10",
        attributeStreams: ORACLE.attributeStreams,
        compressedBytes: ORACLE.streamCompressedBytes,
        rawBytes: ORACLE.streamRawBytes,
      },
      ide11: {
        file: "HS_B0_gate.ide11",
        attributeStreams: ORACLE.attributeStreams,
        compressedBytes: ORACLE.streamCompressedBytes,
        rawBytes: ORACLE.streamRawBytes,
      },
    },
    pairHs10VsA0: greenPair(),
    pairHs11VsX11: greenPair(),
    slabLoadCount: { hs10: ORACLE.slabLoads, a0: ORACLE.slabLoads },
    patch: greenPatch(),
    desktop: greenDesktop(),
    desktop11: greenDesktop11(),
    corpusIntegrityOk: true,
  };
}

const byId = (results: ReturnType<typeof evaluateGate>, id: string) =>
  results.find(r => r.id === id)!;

// ── sözleşme sabitleme testleri ───────────────────────────────────────────────

test("ORACLE tablosu 11-KABUL §2 değerlerini birebir taşır (saptırma yasağı sabiti)", () => {
  assert.equal(ORACLE.attributeStreams, 30260);
  assert.equal(ORACLE.rebarBlocks, 468);
  assert.equal(ORACLE.materials, 2);
  assert.equal(ORACLE.seismicFields, 10);
  assert.equal(ORACLE.f9ModalTables, 10);
  assert.equal(ORACLE.f9MaxFrequencyDeviation, 1e-9);
  assert.equal(ORACLE.elementsCore, 1266);   // 11-KABUL §2 çekirdek sayımı
  assert.equal(ORACLE.elementsStairs, 7);    // v2 sürüm notu: güncel okuyucu merdivenleri de sayar
  assert.equal(ORACLE.elements, 1273);       // 1.266 + 7
  assert.equal(ORACLE.floors, 6);
  assert.equal(ORACLE.labels, 1273);
  assert.equal(ORACLE.slabLoads, 159);
  assert.equal(ORACLE.xxFabricatedLabels, 0);
  assert.equal(ORACLE.ide11GeometryLabelLoadDiff, 0);
  assert.equal(ORACLE.carrierChecksumValid, true);
  assert.equal(ORACLE.desktopFloors, 6);
  // F6 yama senaryosu sabitleri (v3; kaynak 11-KABUL §3 G6 + T-F6.1)
  assert.equal(ORACLE.patchBeamName, "K34");
  assert.equal(ORACLE.patchFromHeight, 0.5);
  assert.equal(ORACLE.patchToHeight, 0.55);
  assert.equal(ORACLE.patchFieldBytes, 8);
  assert.equal(ORACLE.patchCrcBytes, 4);
  assert.equal(ORACLE.patchChangedBytes, 12);
  assert.equal(SEISMIC_ORACLE_FIELDS.length, 10);
  assert.deepEqual(SEISMIC_ORACLE_FIELDS, [
    "rEntered", "rSelectedRatio", "liveLoadFactorN", "subgradeKoTfM3",
    "bearingCapacityQtTfM2", "importanceI", "ss", "s1", "sds", "sd1",
  ]);
});

test("tam yeşil ölçüm demeti: 29 ölçütün tamamı GECTI, exit 0, tam kabul profili", () => {
  const results = evaluateGate(greenBundle(), { skipDesktop: false });
  assert.equal(results.length, 29);
  assert.deepEqual(results.map(r => r.status), results.map(() => "GECTI"));
  // yeni ayaklar tabloda: F6 yama satırları (F1-F3) + ikinci masaüstü açılışı (C5-C7)
  for (const id of ["F1", "F2", "F3", "C5", "C6", "C7"]) {
    assert.equal(byId(results, id).status, "GECTI", `${id} GECTI olmalı`);
  }
  assert.equal(byId(results, "F1").measured, "12 bayt (alan 8 + CRC 4; kapsam dışı 0)");
  assert.equal(byId(results, "F2").measured, "K34=0.55 (kaynak 0.5); diğer K34 3 adet, değişen 0");
  assert.equal(byId(results, "F3").measured, "geçerli");
  assert.equal(computeExitCode(results), 0);
  assert.equal(isFullAcceptanceProfile(results), true);
});

// ── negatif testler (mock ölçüm katmanı; KIRMIZI + exit ≠ 0 sözleşmesi) ──────

test("negatif: alt-akış 30.261 (kasıtlı uyuşmaz) → B1 KIRMIZI ve exit ≠ 0", () => {
  const bundle = greenBundle();
  bundle.census.ide10!.attributeStreams = ORACLE.attributeStreams + 1;
  const results = evaluateGate(bundle, { skipDesktop: false });
  const b1 = byId(results, "B1");
  assert.equal(b1.status, "KIRMIZI");
  assert.equal(b1.measured, "30.261");
  assert.equal(computeExitCode(results), 1);
  // yalnız B1 kırmızı; diğer ölçütler ölçüldü ve geçti
  assert.equal(results.filter(r => r.status === "KIRMIZI").length, 1);
});

test("negatif: CRC bozuk çıktı (stored-CRC uyuşmaz) → A2 KIRMIZI ve exit ≠ 0", () => {
  const bundle = greenBundle();
  bundle.crcValid.ide10 = false;
  const results = evaluateGate(bundle, { skipDesktop: false });
  assert.equal(byId(results, "A2").status, "KIRMIZI");
  assert.equal(computeExitCode(results), 1);
});

test("negatif: labelDiff=1 → hem kesit etiketi (B11) hem XX uydurma (B12) KIRMIZI", () => {
  const bundle = greenBundle();
  bundle.pairHs10VsA0!.elements.labelDiff = 1;
  bundle.pairHs10VsA0!.elements.labelEqual = ORACLE.labels - 1;
  const results = evaluateGate(bundle, { skipDesktop: false });
  assert.equal(byId(results, "B11").status, "KIRMIZI");
  assert.equal(byId(results, "B12").status, "KIRMIZI");
  assert.equal(byId(results, "B12").measured, "1");
  assert.equal(computeExitCode(results), 1);
});

test("negatif: döşeme yükü sayımı 158 (kasıtlı uyuşmaz) → B13 KIRMIZI", () => {
  const bundle = greenBundle();
  bundle.slabLoadCount!.hs10 = ORACLE.slabLoads - 1;
  const results = evaluateGate(bundle, { skipDesktop: false });
  assert.equal(byId(results, "B13").status, "KIRMIZI");
  assert.equal(computeExitCode(results), 1);
});

test("negatif: HS↔A0 diff yok (aşama hatası) → B4..B13 'ölçülemedi' KIRMIZI ve exit ≠ 0", () => {
  const bundle = greenBundle();
  bundle.pairHs10VsA0 = null;
  const results = evaluateGate(bundle, { skipDesktop: false });
  for (const id of ["B4", "B5", "B6", "B7", "B8", "B9", "B10", "B11", "B12", "B13"]) {
    const row = byId(results, id);
    assert.equal(row.status, "KIRMIZI", `${id} KIRMIZI olmalı`);
    assert.match(row.measured, /ölçülemedi/);
  }
  assert.equal(computeExitCode(results), 1);
});

test("negatif: masaüstü başlığı okunamadı → C1 KIRMIZI (kapıda 'ertelendi' profili yok)", () => {
  const bundle = greenBundle();
  bundle.desktop = { skipped: false, failNote: "tam yükleme başlığı beklenemedi", titleMustContain: ["HS_B0_gate.ide10", "MUSTAFA SELVİ 1.KISIM"], floorsExpected: FLOORS };
  const results = evaluateGate(bundle, { skipDesktop: false });
  assert.equal(byId(results, "C1").status, "KIRMIZI");
  assert.equal(byId(results, "C2").status, "KIRMIZI");
  assert.equal(byId(results, "C3").status, "KIRMIZI");
  assert.equal(computeExitCode(results), 1);
});

test("negatif: kapanış sonrası ideCAD süreci kaldı → C3 KIRMIZI", () => {
  const bundle = greenBundle();
  bundle.desktop.closedClean = false;
  bundle.desktop.remainingProcesses = 1;
  const results = evaluateGate(bundle, { skipDesktop: false });
  assert.equal(byId(results, "C3").status, "KIRMIZI");
  assert.equal(computeExitCode(results), 1);
});

test("negatif: kaynak korpus SHA değişti → D1 KIRMIZI", () => {
  const bundle = greenBundle();
  bundle.corpusIntegrityOk = false;
  bundle.corpusIntegrityNote = "SHA değişti: B0";
  const results = evaluateGate(bundle, { skipDesktop: false });
  assert.equal(byId(results, "D1").status, "KIRMIZI");
  assert.equal(computeExitCode(results), 1);
});

// ── F6 yama ayağı negatifleri (bozuk girdi → KIRMIZI/'ölçülemedi' sözleşmesi) ─

test("negatif: yama bayt kapsamı 13 (kapsam dışı 1 bayt) → F1 KIRMIZI", () => {
  const bundle = greenBundle();
  bundle.patch.outOfScopeBytes = 1;
  bundle.patch.changedBytes = 13;
  const results = evaluateGate(bundle, { skipDesktop: false });
  assert.equal(byId(results, "F1").status, "KIRMIZI");
  assert.equal(byId(results, "F2").status, "GECTI");
  assert.equal(byId(results, "F3").status, "GECTI");
  assert.equal(computeExitCode(results), 1);
});

test("negatif: yamalı parse K34 değişmedi (0.50 kaldı) → F2 KIRMIZI", () => {
  const bundle = greenBundle();
  bundle.patch.patchedHeight = 0.5;
  const results = evaluateGate(bundle, { skipDesktop: false });
  assert.equal(byId(results, "F2").status, "KIRMIZI");
  assert.equal(byId(results, "F1").status, "GECTI");
  assert.equal(computeExitCode(results), 1);
});

test("negatif: diğer kat K34'lerinden biri değişti → F2 KIRMIZI", () => {
  const bundle = greenBundle();
  bundle.patch.otherK34Changed = 1;
  const results = evaluateGate(bundle, { skipDesktop: false });
  assert.equal(byId(results, "F2").status, "KIRMIZI");
  assert.equal(computeExitCode(results), 1);
});

test("negatif: yamalı çıktı CRC mührü geçersiz → F3 KIRMIZI", () => {
  const bundle = greenBundle();
  bundle.patch.crcValid = false;
  const results = evaluateGate(bundle, { skipDesktop: false });
  assert.equal(byId(results, "F3").status, "KIRMIZI");
  assert.equal(byId(results, "F1").status, "GECTI");
  assert.equal(computeExitCode(results), 1);
});

test("negatif: yama ayağı bozuk girdide koşamadı → F1..F3 'ölçülemedi' KIRMIZI ve exit ≠ 0", () => {
  const bundle = greenBundle();
  bundle.patch = { ok: false, failNote: "yama ayağı hatası: kiriş kesit kaydının grameri doğrulanamadı" };
  // gerçek main() davranışı: yamalı dosya yoksa ikinci açılış da koşulamaz
  bundle.desktop11 = { skipped: false, failNote: "yamalı .ide11 üretilemedi — ikinci açılış koşulamadı (yama ayağı hatası: kiriş kesit kaydının grameri doğrulanamadı)" };
  const results = evaluateGate(bundle, { skipDesktop: false });
  for (const id of ["F1", "F2", "F3"]) {
    const row = byId(results, id);
    assert.equal(row.status, "KIRMIZI", `${id} KIRMIZI olmalı`);
    assert.match(row.measured, /ölçülemedi/);
  }
  // ikinci masaüstü açılışı da yamalı dosya olmadığından KIRMIZI
  assert.equal(byId(results, "C5").status, "KIRMIZI");
  assert.equal(computeExitCode(results), 1);
});

test("negatif: yamalı .ide11 masaüstü başlığı okunamadı → C5-C7 KIRMIZI (birinci açılış yeşil kalır)", () => {
  const bundle = greenBundle();
  bundle.desktop11 = { skipped: false, failNote: "tam yükleme başlığı beklenemedi", titleMustContain: ["HS_B0_gate_2026-11-19-095629-F6-yamali.ide11", "MUSTAFA SELVİ 1.KISIM"], floorsExpected: FLOORS };
  const results = evaluateGate(bundle, { skipDesktop: false });
  assert.equal(byId(results, "C5").status, "KIRMIZI");
  assert.equal(byId(results, "C6").status, "KIRMIZI");
  assert.equal(byId(results, "C7").status, "KIRMIZI");
  assert.equal(byId(results, "C1").status, "GECTI");
  assert.equal(byId(results, "C2").status, "GECTI");
  assert.equal(computeExitCode(results), 1);
});

// ── profil testleri ───────────────────────────────────────────────────────────

test("--skip-desktop: C1-C3 ve C5-C7 SKIPPED, KIRMIZI sayılmaz; yama ayağı makine ölçümleri yine koşar; exit 0 ama tam kabul profili DEĞİLDİR", () => {
  const bundle = greenBundle();
  bundle.desktop = { skipped: true, integrityOk: true };
  bundle.desktop11 = { skipped: true, integrityOk: true };
  const results = evaluateGate(bundle, { skipDesktop: true });
  assert.equal(byId(results, "C1").status, "SKIPPED");
  assert.equal(byId(results, "C2").status, "SKIPPED");
  assert.equal(byId(results, "C3").status, "SKIPPED");
  assert.equal(byId(results, "C5").status, "SKIPPED");
  assert.equal(byId(results, "C6").status, "SKIPPED");
  assert.equal(byId(results, "C7").status, "SKIPPED");
  assert.match(byId(results, "C1").note!, /tam kabul profili DEĞİLDİR/);
  // yama ayak makine ölçümleri masaüstünden bağımsızdır: F satırları ölçüldü
  assert.equal(byId(results, "F1").status, "GECTI");
  assert.equal(byId(results, "F2").status, "GECTI");
  assert.equal(byId(results, "F3").status, "GECTI");
  assert.equal(results.some(r => r.status === "KIRMIZI"), false);
  assert.equal(computeExitCode(results), 0);
  assert.equal(isFullAcceptanceProfile(results), false);
});

test("dönüşüm üretilemedi → A1 KIRMIZI; B/F ölçütleri ölçülemedi KIRMIZI", () => {
  const bundle: MeasurementBundle = {
    conversionOk: false,
    conversionError: "dönüşüm komutu exit 1",
    crcValid: { ide10: false, ide11: false },
    census: {},
    pairHs10VsA0: null,
    pairHs11VsX11: null,
    patch: { ok: false, failNote: "dönüşüm çıktısı yok — yama ayağı koşulamadı" },
    desktop: { skipped: true },
    desktop11: { skipped: true },
    corpusIntegrityOk: true,
  };
  const results = evaluateGate(bundle, { skipDesktop: true });
  assert.equal(byId(results, "A1").status, "KIRMIZI");
  assert.equal(byId(results, "A2").status, "KIRMIZI");
  assert.equal(byId(results, "B1").status, "KIRMIZI");
  assert.equal(byId(results, "F1").status, "KIRMIZI");
  assert.match(byId(results, "F1").measured, /ölçülemedi/);
  assert.equal(computeExitCode(results), 1);
});

test("boyut bandı ±%1 sınır mantığı", () => {
  const t = ORACLE.streamCompressedBytes;
  assert.equal(withinPct(t, t, ORACLE.streamSizeTolerancePct), true);
  assert.equal(withinPct(Math.round(t * 1.009), t, ORACLE.streamSizeTolerancePct), true);
  assert.equal(withinPct(Math.round(t * 1.011), t, ORACLE.streamSizeTolerancePct), false);
  assert.equal(withinPct(Math.round(t * 0.99), t, ORACLE.streamSizeTolerancePct), true);
  assert.equal(withinPct(Math.round(t * 0.989), t, ORACLE.streamSizeTolerancePct), false);
});

// ── K2/KARAR-001 onarımı: --oracle-json profil sözleşmesi (v4) ───────────────
// Profiller eşli ticari donörden ölçülür (YFS-1); buradaki sayılar yalnız
// doğrulama katmanının sözleşmesini sınamak için sentetik profilde kullanılır.

/** Geçerli bir sentetik profil (kapının kendi doğrulayıcısından geçer biçimde). */
function makeRawProfile(overrides?: {
  x11?: unknown;
  oracle?: Record<string, unknown>;
  top?: Record<string, unknown>;
}): Record<string, unknown> {
  return {
    profileVersion: 1,
    projectId: "TEST-K2-X",
    x11: overrides?.x11 === undefined ? null : overrides.x11,    derivedFrom: {
      donorIde10: "D:\\SENTETIK\\TEST KULESİ.ide10",
      donorSha256: "a".repeat(64),
      not: "bu profil birim testte sentetiktir; gerçek üretim ide-oracle-profile.ts ile donörden ölçülür",
    },
    oracle: {
      attributeStreams: 1234,
      streamCompressedBytes: 80_000_000,
      streamRawBytes: 300_000_000,
      rebarBlocks: 40,
      materials: 3,
      f9ModalTables: 8,
      elementsCore: 295,
      elementsStairs: 5,
      elements: 300,
      floors: 4,
      labels: 300,
      slabLoads: 60,
      desktopProjectTitle: "TEST KULESİ",
      desktopFloors: 4,
      patchBeamName: "K7",
      patchFromHeight: 0.6,
      patchToHeight: 0.65,
      ...(overrides?.oracle ?? {}),
    },
    ...(overrides?.top ?? {}),
  };
}

function profilePair(): PairDiff {
  return {
    elements: {
      matched: 300, missingInB: 0, extraInB: 0,
      geometryEqual: 300, geometryDiff: 0,
      labelEqual: 300, labelDiff: 0,
      rebarBoth: 40, rebarMismatch: 0,
      loadsOnlyA: 0, loadsOnlyB: 0, loadsMismatch: 0,
    },
    floors: { matched: 4, geometryDiff: 0, onlyInA: [], onlyInB: [] },
    materials: { countA: 3, countB: 3, diff: [] },
    seismic: { presentA: true, presentB: true, diff: [] },
    f9: { tablesA: 8, tablesB: 8, maxFrequencyDeviation: 0, tableDiff: [] },
  };
}

function profileBundle(): MeasurementBundle {
  const base = greenBundle();
  return {
    ...base,
    census: {
      ide10: {
        file: "HS_TEST.ide10",
        attributeStreams: 1234,
        compressedBytes: 80_000_000,
        rawBytes: 300_000_000,
      },
      ide11: {
        file: "HS_TEST.ide11",
        attributeStreams: 1234,
        compressedBytes: 80_000_000,
        rawBytes: 300_000_000,
      },
    },
    pairHs10VsA0: profilePair(),
    pairHs11VsX11: profilePair(),
    slabLoadCount: { hs10: 60, a0: 60 },
    patch: {
      ok: true,
      targetId: "ide-floor-1:1",
      targetName: "K7",
      targetFloor: "2. KAT",
      originalHeight: 0.6,
      patchedHeight: 0.65,
      changedBytes: 12,
      fieldBytes: 8,
      crcBytes: 4,
      outOfScopeBytes: 0,
      crcValid: true,
      otherK34Count: 2,
      otherK34Changed: 0,
      patchedFile: "HS_TEST-F6-yamali.ide11",
      patchedSha: "deadbeef",
      elapsedMs: 5_000,
    },
  };
}

test("oracle profili: evaluateStageB hedef/criterion dizgeleri profil sayılarını yansıtır ve ölçüm profille eşleşince yeşildir", () => {
  const ctx = buildOracleContextFromRaw(makeRawProfile(), "sentetik-test") as OracleContext;
  const bundle = profileBundle();
  const results = evaluateStageB(bundle, ctx);
  const by = (id: string) => results.find(r => r.id === id)!;

  assert.equal(by("B1").target, "1.234");
  assert.equal(by("B1").criterion, "201094 alt-akış sayısı (.ide10)");
  assert.equal(by("B1").status, "GECTI");
  assert.equal(by("B4").criterion, "R4 donatı 40/40");
  assert.equal(by("B4").target, "40/0 uyumsuz");
  assert.equal(by("B4").status, "GECTI");
  assert.equal(by("B5").criterion, "R1 malzeme 3/3");
  assert.equal(by("B7").criterion, "R5 F9/modal tablo 8");
  assert.equal(by("B7").target, "8/8 (tablo diff 0)");
  assert.equal(by("B9").criterion, "geometri 295+5 (1 µm)");
  assert.equal(by("B9").target, "300/300 (diff 0)");
  assert.equal(by("B9").note, "295 çekirdek + 5 merdiven = 300 (v2 sürüm notu)");
  assert.equal(by("B10").criterion, "kat 4/4");
  assert.equal(by("B11").criterion, "kesit etiketi 295+5");
  assert.equal(by("B11").target, "300/300");
  assert.equal(by("B13").criterion, "döşeme yükü 60/60");
  assert.equal(by("B13").target, "60/60 (diff 0)");
  for (const r of results) assert.equal(r.status, "GECTI", `${r.id} profil ölçümleriyle yeşil olmalı`);

  // profil sapması: ölçüm 1235 → B1 KIRMIZI (hedef profil sayısı, gömülü 30.260 değil)
  const sapan = profileBundle();
  sapan.census.ide10!.attributeStreams = 1235;
  const sapanResults = evaluateStageB(sapan, ctx);
  const b1 = sapanResults.find(r => r.id === "B1")!;
  assert.equal(b1.status, "KIRMIZI");
  assert.equal(b1.target, "1.234");
  assert.equal(b1.measured, "1.235");
});

test("oracle profili: F yama ayağı profil kiriş hedefiyle (K7 0.60→0.65) ölçülür", () => {
  const ctx = buildOracleContextFromRaw(makeRawProfile(), "sentetik-test") as OracleContext;
  const results = evaluateStageF(profileBundle(), ctx);
  const f2 = results.find(r => r.id === "F2")!;
  assert.equal(f2.criterion, "yamalı parse: K7=0.65, diğer kat K7'leri değişmez");
  assert.equal(f2.target, "K7 0.65; diğerleri 0.60");
  assert.equal(f2.measured, "K7=0.65 (kaynak 0.6); diğer K7 2 adet, değişen 0");
  assert.equal(f2.status, "GECTI");
  assert.equal(results.find(r => r.id === "F1")!.note, "hedef: ilk K7 kirişi ide-floor-1:1 (2. KAT); beamSectionHeight 0.6→0.65; T-F6.1 deseni");

  // gömülü K34 senaryosu profille eşleşmez → F2 KIRMIZI (honest bar profile göre)
  const k34 = greenBundle();
  const k34Results = evaluateStageF(k34, ctx);
  assert.equal(k34Results.find(r => r.id === "F2")!.status, "KIRMIZI");
});

test("oracle profili: masaüstü kat/başlık ölçütleri profil sayılarıyla", () => {
  const ctx = buildOracleContextFromRaw(makeRawProfile(), "sentetik-test") as OracleContext;
  const dt: MeasurementBundle["desktop"] = {
    skipped: false,
    mainTitle: "ideCAD Statik - HS_TEST.ide10 - TEST KULESİ - [2. KAT]",
    titleMustContain: ["HS_TEST.ide10", "TEST KULESİ"],
    floorsExpected: ["4. KAT", "3. KAT", "2. KAT", "1. KAT"],
    floorsFound: ["4. KAT", "3. KAT", "2. KAT", "1. KAT"],
    closedClean: true,
    remainingProcesses: 0,
    integrityOk: true,
  };
  const results = evaluateStageC({ ...greenBundle(), desktop: dt }, ctx);
  assert.equal(results.find(r => r.id === "C2")!.criterion, "kat ağacı tam 4/4");
  assert.equal(results.find(r => r.id === "C2")!.status, "GECTI");
});

test("profil x11:null → B14–B16 X11-YOK (ölçülemez) sınıfı: KIRMIZI da GEÇTİ de sayılmaz", () => {
  const ctx = buildOracleContextFromRaw(makeRawProfile({ x11: null }), "sentetik-test") as OracleContext;
  assert.equal(ctx.x11, null);
  const bundle = greenBundle(); // pairHs11VsX11 dolu olsa bile X11-YOK bağlamı kazanır
  const results = evaluateStageB11(bundle, ctx);
  assert.equal(results.length, 3);
  for (const id of ["B14", "B15", "B16"]) {
    const row = results.find(r => r.id === id)!;
    assert.equal(row.status, "X11-YOK", `${id} X11-YOK olmalı`);
    assert.equal(row.measured, "X11-YOK (ölçülemez)");
    assert.match(row.note!, /SAPMA-A \(KARAR-001\): tam kabul profili X11 eşi olmadığından \.ide11-yönlü çift ölçümü yok/);
  }
  assert.equal(computeExitCode(results), 0);
  assert.equal(isFullAcceptanceProfile(results), false);

  // tam kapı: 29 ölçütün 26'sı GEÇTİ, 3'ü X11-YOK; exit 0; tam kabul profili DEĞİLDİR
  // (ölçüm demeti profil sayılarıyla tutarlı olmalı; aksi halde B satırları kırmızı düşer)
  const full = profileBundle();
  const testFloors = ["4. KAT", "3. KAT", "2. KAT", "1. KAT"];
  full.desktop = {
    skipped: false,
    mainTitle: "ideCAD Statik - HS_TEST.ide10 - TEST KULESİ - [2. KAT]",
    titleMustContain: ["HS_TEST.ide10", "TEST KULESİ"],
    floorsExpected: testFloors,
    floorsFound: testFloors,
    closedClean: true,
    remainingProcesses: 0,
    integrityOk: true,
  };
  full.desktop11 = {
    skipped: false,
    mainTitle: "ideCAD Statik - HS_TEST-F6-yamali.ide11 - TEST KULESİ - [2. KAT]",
    titleMustContain: ["HS_TEST-F6-yamali.ide11", "TEST KULESİ"],
    floorsExpected: testFloors,
    floorsFound: testFloors,
    closedClean: true,
    remainingProcesses: 0,
    integrityOk: true,
  };
  const gate = evaluateGate(full, { skipDesktop: false }, ctx);
  assert.equal(gate.length, 29);
  assert.equal(gate.filter(r => r.status === "GECTI").length, 26);
  assert.equal(gate.filter(r => r.status === "X11-YOK").length, 3);
  assert.equal(gate.filter(r => r.status === "KIRMIZI").length, 0);
  assert.equal(computeExitCode(gate), 0);
  assert.equal(isFullAcceptanceProfile(gate), false);

  const summary = formatSummary(gate, { negatifTest: false, skipDesktop: false, runDir: "test", oracleProfile: "TEST-K2-X (sentetik)" });
  assert.match(summary, /SONUÇ: 26 GEÇTİ, 0 KIRMIZI, 3 X11-YOK, 0 SKIPPED/);
  assert.match(summary, /tam kabul profili X11 eşi olmadığından \.ide11-yönlü çift ölçümü yok/);
  assert.match(summary, /KAPI: yeşil \(X11-YOK profili\) — tam kabul profili DEĞİLDİR/);
  assert.match(summary, /ORACLE PROFİLİ: TEST-K2-X \(sentetik\)/);
});

test("profil x11 VAR + HS↔X11 diff yok → B14–B16 KIRMIZI sözleşmesi korunur (K1 davranışı)", () => {
  const ctx = buildOracleContextFromRaw(makeRawProfile({ x11: "C:\\X11\\ref.ide11" }), "sentetik-test") as OracleContext;
  const bundle = greenBundle();
  bundle.pairHs11VsX11 = null;
  const results = evaluateStageB11(bundle, ctx);
  for (const id of ["B14", "B15", "B16"]) {
    assert.equal(results.find(r => r.id === id)!.status, "KIRMIZI", `${id} KIRMIZI kalmalı`);
  }
});

test("profil doğrulama: bilinmeyen anahtar / yanlış tip / eksik anahtar → sert hata", () => {
  // (c) bilinmeyen oracle anahtarı
  assert.throws(
    () => buildOracleContextFromRaw(makeRawProfile({ oracle: { tasanSayi: 1 } }), "sentetik-test"),
    /bilinmeyen oracle anahtarı: 'tasanSayi'/,
  );
  // bilinmeyen üst anahtar
  assert.throws(
    () => buildOracleContextFromRaw(makeRawProfile({ top: { tasan: 1 } }), "sentetik-test"),
    /bilinmeyen üst anahtar: 'tasan'/,
  );
  // yanlış tip (sayı yerine dizgi)
  assert.throws(
    () => buildOracleContextFromRaw(makeRawProfile({ oracle: { attributeStreams: "1234" } }), "sentetik-test"),
    /'attributeStreams' negatif-olmayan tam sayı olmalı/,
  );
  // negatif sayım
  assert.throws(
    () => buildOracleContextFromRaw(makeRawProfile({ oracle: { rebarBlocks: -1 } }), "sentetik-test"),
    /'rebarBlocks' negatif-olmayan tam sayı olmalı/,
  );
  // eksik anahtar (profil tam olmalı)
  const eksik = makeRawProfile() as { oracle: Record<string, unknown> };
  delete eksik.oracle.rebarBlocks;
  assert.throws(
    () => buildOracleContextFromRaw(eksik, "sentetik-test"),
    /eksik oracle anahtarı: 'rebarBlocks'/,
  );
  // profileVersion sözleşmesi
  assert.throws(
    () => buildOracleContextFromRaw(makeRawProfile({ top: { profileVersion: 2 } }), "sentetik-test"),
    /profileVersion 1 olmalı/,
  );
  // çapraz tutarlılık: elements ≠ core + stairs
  assert.throws(
    () => buildOracleContextFromRaw(makeRawProfile({ oracle: { elements: 301 } }), "sentetik-test"),
    /elements ≠ elementsCore \+ elementsStairs/,
  );
  // yama değeri değişiklik olmalı
  assert.throws(
    () => buildOracleContextFromRaw(makeRawProfile({ oracle: { patchToHeight: 0.6 } }), "sentetik-test"),
    /patchToHeight, patchFromHeight'ten büyük olmalı/,
  );
  // x11 tipi
  assert.throws(
    () => buildOracleContextFromRaw(makeRawProfile({ x11: 42 }), "sentetik-test"),
    /x11 ya geçerli yol dizgisi ya da null olmalı/,
  );
  // birleşme anahtarları, protokol sabitlerini (ör. carrierChecksumValid) kapsamaz
  assert.equal((ORACLE_PROFILE_MERGE_KEYS as readonly string[]).includes("carrierChecksumValid"), false);
  assert.equal((ORACLE_PROFILE_MERGE_KEYS as readonly string[]).includes("xxFabricatedLabels"), false);
});

test("varsayılan bağlam (bayrak yok): gömülü K1 ORACLE'ı ile sonuç bayt-özdeş", () => {
  const bundle = greenBundle();
  const varsayilan = evaluateGate(bundle, { skipDesktop: false });
  const acikBaglam = evaluateGate(bundle, { skipDesktop: false }, DEFAULT_ORACLE_CONTEXT);
  assert.deepEqual(varsayilan, acikBaglam);
  assert.equal(DEFAULT_ORACLE_CONTEXT.x11, "");
  // 29-ölçüt sözleşmesi ve K1 profil davranışı yukarıdaki testlerle sabitlendi
});
