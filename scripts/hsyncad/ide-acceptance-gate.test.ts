/**
 * T-F7.1 — ide-acceptance-gate birim testleri.
 *
 * Kapının saf değerlendirme katmanı (ORACLE + evaluateGate) mock ölçüm
 * demetleriyle sınanır. Negatif test sözleşmesi (11-KABUL G7): bilerek
 * bozuk/uydurma ölçümler kapıyı KIRMIZI'ya çevirmeli ve exit ≠ 0 üretmeli.
 *
 * Koşum: npx tsx --test scripts/hsyncad/ide-acceptance-gate.test.ts
 */
import test from "node:test";
import assert from "node:assert/strict";
import {
  ORACLE,
  SEISMIC_ORACLE_FIELDS,
  evaluateGate,
  computeExitCode,
  isFullAcceptanceProfile,
  withinPct,
  type MeasurementBundle,
  type PairDiff,
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
    desktop: greenDesktop(),
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
  assert.equal(SEISMIC_ORACLE_FIELDS.length, 10);
  assert.deepEqual(SEISMIC_ORACLE_FIELDS, [
    "rEntered", "rSelectedRatio", "liveLoadFactorN", "subgradeKoTfM3",
    "bearingCapacityQtTfM2", "importanceI", "ss", "s1", "sds", "sd1",
  ]);
});

test("tam yeşil ölçüm demeti: 23 ölçütün tamamı GECTI, exit 0, tam kabul profili", () => {
  const results = evaluateGate(greenBundle(), { skipDesktop: false });
  assert.equal(results.length, 23);
  assert.deepEqual(results.map(r => r.status), results.map(() => "GECTI"));
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

// ── profil testleri ───────────────────────────────────────────────────────────

test("--skip-desktop: C1-C3 SKIPPED, KIRMIZI sayılmaz; exit 0 ama tam kabul profili DEĞİLDİR", () => {
  const bundle = greenBundle();
  bundle.desktop = { skipped: true, integrityOk: true };
  const results = evaluateGate(bundle, { skipDesktop: true });
  assert.equal(byId(results, "C1").status, "SKIPPED");
  assert.equal(byId(results, "C2").status, "SKIPPED");
  assert.equal(byId(results, "C3").status, "SKIPPED");
  assert.match(byId(results, "C1").note!, /tam kabul profili DEĞİLDİR/);
  assert.equal(results.some(r => r.status === "KIRMIZI"), false);
  assert.equal(computeExitCode(results), 0);
  assert.equal(isFullAcceptanceProfile(results), false);
});

test("dönüşüm üretilemedi → A1 KIRMIZI ve B/C ölçütleri ölçülemedi KIRMIZI", () => {
  const bundle: MeasurementBundle = {
    conversionOk: false,
    conversionError: "dönüşüm komutu exit 1",
    crcValid: { ide10: false, ide11: false },
    census: {},
    pairHs10VsA0: null,
    pairHs11VsX11: null,
    desktop: { skipped: true },
    corpusIntegrityOk: true,
  };
  const results = evaluateGate(bundle, { skipDesktop: true });
  assert.equal(byId(results, "A1").status, "KIRMIZI");
  assert.equal(byId(results, "A2").status, "KIRMIZI");
  assert.equal(byId(results, "B1").status, "KIRMIZI");
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
