/**
 * Phase 3 Acceptance & Calibration Tests:
 * - ideCAD Metraj net formwork overlap deductions (0x140b30b40, 0x140b34950, 0x140b364c0)
 * - Rebar Ø8–Ø12 (<=12 mm) İNCE vs >=Ø14 KALIN split (#80 Flag A) + 0x141df3b30 unit weights
 * - Unified 2-pass PDF builder (image blocks, idecad_compact layout, multi-page TOC)
 * - MS1 / MS2 / SK ground-truth category suppression & ratio invariants
 */

import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { execFileSync } from "node:child_process";
import { createDemoModel, createEmptyModel, type CadModel } from "../../src/lib/hsyncad/model";
import {
  calculateFullTakeoff,
  calculateIdeNetFormworkByElement,
  calculateQuantities,
  computeIdeRebarMassKg,
  IDE_REBAR_THIN_MAX_DIAMETER_MM,
  isThinRebarDiameter,
} from "../../src/lib/hsyncad/quantities";
import {
  createIdeSourcePdf,
  deriveSectionsFromRptFlags,
  INITIAL_RPT_FLAGS,
  IDE_REPORT_TREE_GROUPS,
  syncRptFlagsWithGroup,
} from "../../src/lib/hsyncad/ide-source-report";
import type { IdeProject } from "../../src/lib/hsyncad/ide-import";
import type { ReinforcementScheduleResult } from "../../src/lib/hsyncad/structural/reinforcement-schedule";
import { renderReportDocumentToPdf } from "../../src/lib/hsyncad/reporting/pdf-renderer";
import type { ReportDocument } from "../../src/lib/hsyncad/reporting/report-document";

// 1x1 transparent PNG data URI (browser-safe raster image fixture)
const TINY_PNG_DATA_URL =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";

function extractPdfText(pdfBytes: Uint8Array): { text: string; pages: number } {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "hsyncad-p16-cal-"));
  const pdfPath = path.join(tmpDir, "doc.pdf");
  try {
    fs.writeFileSync(pdfPath, pdfBytes);
    let pages = 1;
    try {
      const info = execFileSync("pdfinfo", [pdfPath], { encoding: "utf8", timeout: 10000, windowsHide: true });
      const m = /Pages:\s*(\d+)/.exec(info);
      if (m) pages = Number(m[1]);
    } catch {
      // Fallback if pdfinfo unavailable
    }
    const text = execFileSync("pdftotext", ["-layout", pdfPath, "-"], {
      encoding: "utf8",
      timeout: 10000,
      windowsHide: true,
    });
    return { text, pages };
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}

test("Metraj formwork deductions reduce column-beam, beam-slab, and framed-slab overlaps cleanly", () => {
  const model = createDemoModel();
  const gross = calculateQuantities(model);
  const net = calculateQuantities(model, undefined, { deductFormworkOverlaps: true });
  const byElement = calculateIdeNetFormworkByElement(model);

  // Gross demo model formwork must stay untouched (83.8 m2) for backward compatibility
  assert.ok(Math.abs(gross.formwork - 83.8) < 1e-9);
  // Net deducted formwork must be strictly positive and strictly less than gross formwork
  assert.ok(net.formwork > 40 && net.formwork < gross.formwork);

  // Column loses beam intersection area (0.25 * 0.5 per meeting beam), so < 4.8 m2
  assert.ok(byElement["column-0"] < 4.8 && byElement["column-0"] > 4.0);
  // Beam clear span between 0.4 m columns (3.6 m) + 1 attached slab side (0.15 m) < gross 5.25 m2
  assert.ok(byElement["beam-0"] < 4.2 && byElement["beam-0"] > 3.5);
  // Perimeter-framed slab has net soffit only (< gross 18.4 m2)
  assert.ok(byElement["slab-0"] < 14.0 && byElement["slab-0"] > 12.5);
});

test("#80 Flag A: Rebar classification strictly groups <=12 mm (Ø8-Ø12) as İNCE and >=Ø14 as KALIN", () => {
  assert.equal(IDE_REBAR_THIN_MAX_DIAMETER_MM, 12);
  for (const d of [8, 10, 12]) {
    assert.equal(isThinRebarDiameter(d), true, `Ø${d} must be İNCE`);
  }
  for (const d of [14, 16, 18, 20, 22, 25, 28, 32]) {
    assert.equal(isThinRebarDiameter(d), false, `Ø${d} must be KALIN`);
  }

  // Exact 0x141df3b30 unit weight check: d_m * pi * d_m * count * 1962.5 * L_m
  const m12 = computeIdeRebarMassKg(12, 10, 1);
  assert.ok(Math.abs(m12 - 8.87814) < 0.01);
  const m14 = computeIdeRebarMassKg(14, 10, 1);
  assert.ok(Math.abs(m14 - 12.08445) < 0.01);
});

test("Verified ReinforcementScheduleResult integrates into calculateFullTakeoff and compact Metraj PDF", () => {
  const model = createDemoModel();
  const m8 = computeIdeRebarMassKg(8, 100, 1);
  const m12 = computeIdeRebarMassKg(12, 100, 1);
  const m16 = computeIdeRebarMassKg(16, 100, 1);

  const schedule: ReinforcementScheduleResult = {
    projectRevisionId: "rev-cal-1",
    mode: "redesign",
    uniqueBars: [
      {
        elementId: "column-0",
        floorId: "floor-0",
        materialId: "concrete",
        diameterMm: 8,
        role: "stirrup",
        unitLengthM: 1,
        cutLengthM: 1,
        count: 100,
        totalLengthM: 100,
        totalMassKg: m8,
        tag: "S1-E",
        provenance: "test",
      },
      {
        elementId: "beam-0",
        floorId: "floor-0",
        materialId: "concrete",
        diameterMm: 12,
        role: "longitudinal_top",
        unitLengthM: 10,
        cutLengthM: 10,
        count: 10,
        totalLengthM: 100,
        totalMassKg: m12,
        tag: "K1-U",
        provenance: "test",
      },
      {
        elementId: "column-1",
        floorId: "floor-0",
        materialId: "concrete",
        diameterMm: 16,
        role: "longitudinal_bottom",
        unitLengthM: 10,
        cutLengthM: 10,
        count: 10,
        totalLengthM: 100,
        totalMassKg: m16,
        tag: "S2-B",
        provenance: "test",
      },
    ],
    deduplicatedCount: 0,
    knownMassKg: m8 + m12 + m16,
    totalMassKg: m8 + m12 + m16,
    knownLengthM: 300,
    totalLengthM: 300,
    isComplete: true,
    unresolvedElementIds: [],
    explicitZeroElementIds: [],
    subtotalsByFloor: [{ floorId: "floor-0", totalLengthM: 300, totalMassKg: m8 + m12 + m16, barCount: 120, elementIds: ["column-0", "beam-0", "column-1"] }],
    subtotalsByElementType: [],
    subtotalsByDiameter: [
      { diameterMm: 8, totalLengthM: 100, totalMassKg: m8, barCount: 100 },
      { diameterMm: 12, totalLengthM: 100, totalMassKg: m12, barCount: 10 },
      { diameterMm: 16, totalLengthM: 100, totalMassKg: m16, barCount: 10 },
    ],
    subtotalsByMaterial: [],
    classification: {
      profileName: "ts500-12mm-threshold",
      thickThresholdMm: 12,
      thinMassKg: m8 + m12,
      thickMassKg: m16,
      thinLengthM: 200,
      thickLengthM: 100,
    },
  };

  const takeoff = calculateFullTakeoff(model, undefined, undefined, {
    deductFormworkOverlaps: true,
    rebarSchedule: schedule,
  });

  assert.equal(takeoff.status, "verified");
  assert.equal(takeoff.formworkAreaM2.basis, "net_deducted");
  assert.equal(takeoff.rebarTonnage.cutListVerified, true);
  assert.equal(takeoff.rebarTonnage.source, "verified_schedule");
  assert.ok(Math.abs((takeoff.rebarTonnage.thinKg ?? 0) - (m8 + m12)) < 1e-6);
  assert.ok(Math.abs((takeoff.rebarTonnage.thickKg ?? 0) - m16) < 1e-6);

  const bytes = createIdeSourcePdf(null, "c".repeat(64), "rev-cal-1", {
    cadModel: model,
    rebarSchedule: schedule,
    deductFormworkOverlaps: true,
    planDiagrams: [{ title: "Örnek Kat Planı", dataUrl: TINY_PNG_DATA_URL, widthMm: 60, heightMm: 30, caption: "Kat planı diyagramı" }],
    metadata: { title: "KALİBRASYON PROJESİ", city: "Yozgat", district: "Akdağmadeni", logoDataUrl: TINY_PNG_DATA_URL },
  });
  const { text } = extractPdfText(bytes);
  assert.match(text, /KALİBRASYON PROJESİ/);
  assert.match(text, /İnce \(Ø8-Ø12\)/);
  assert.match(text, /Kalın \(>=Ø14\)/);
  assert.match(text, /Kat planı diyagramı/);
});

test("ReportDocument image block & multi-page idecad_compact TOC map exact section pages without link errors", () => {
  const manySections = Array.from({ length: 42 }, (_, idx) => ({
    id: `sec_${idx + 1}`,
    title: `${idx + 1}. Test Bölümü — Uzun Başlık Kontrolleri`,
    family: "calculation" as const,
    pageBreakBefore: idx === 0,
    blocks: [
      { type: "paragraph" as const, paragraph: { text: `Bölüm ${idx + 1} açıklaması.`, variant: "normal" as const } },
      ...(idx === 0
        ? [{ type: "image" as const, dataUrl: TINY_PNG_DATA_URL, widthMm: 50, heightMm: 25, caption: "Gömülü Şema" }]
        : []),
    ],
  }));

  const doc: ReportDocument = {
    metadata: {
      projectName: "Çok Sayfalı TOC Testi",
      documentTitle: "Statik Rapor",
      engineerName: "Test Müh.",
      date: "14.11.2026",
      softwareName: "Hsyncad",
      softwareVersion: "1.0",
      standards: ["TBDY 2018"],
      disclaimer: "Test kapsamı.",
      revisionId: "rev-toc",
      reviewStatus: "taslak_muhendis_incelemesi_gerekli",
    },
    provenance: {
      generatedAt: new Date().toISOString(),
      layoutRevisionId: "rev-toc",
      calculationEngine: "Test Engine",
    },
    sections: [
      { id: "cover", title: "Kapak", family: "cover", blocks: [{ type: "keyValueGrid", items: [{ key: "Proje", value: "Test" }] }], pageBreakBefore: false },
      { id: "toc", title: "İçindekiler", family: "toc", blocks: [], pageBreakBefore: true },
      ...manySections,
    ],
  };

  const rendered = renderReportDocumentToPdf(doc, { layoutMode: "idecad_compact" });
  assert.ok(rendered.pageCount >= 4);
  // Section 1 starts AFTER multi-page TOC (cover = 1, TOC = pages 2..3)
  assert.ok(rendered.sectionPages["sec_1"] >= 3, `Expected sec_1 on page >= 3, got ${rendered.sectionPages["sec_1"]}`);
  const { text } = extractPdfText(rendered.pdfBytes);
  assert.match(text, /Gömülü Şema/);
  assert.match(text, /42\. Test Bölümü/);
});

test("MS1 / MS2 zero-column suppression and SK column inclusion match ground_truth_ms1_ms2_sk.json", () => {
  const gtPath = "D:\\HsyncadHybridOS\\rea-run-2026-11-14\\ide10\\ground_truth_ms1_ms2_sk.json";
  if (!fs.existsSync(gtPath)) return;

  const gt = JSON.parse(fs.readFileSync(gtPath, "utf8"));
  assert.equal(gt.MS1.categories_present_in_report.kolonlar, false);
  assert.equal(gt.MS2.categories_present_in_report.kolonlar, false);
  assert.equal(gt.SK.categories_present_in_report.kolonlar, true);

  // Check MS1/MS2/SK ground-truth thin (<=12mm) + thick (>=14mm) totals consistency
  for (const key of ["MS1", "MS2", "SK"] as const) {
    const totals = gt.verified_summary_comparison[key].metraj_totals;
    const sumKg = totals.rebar_thin_kg + totals.rebar_thick_kg;
    assert.ok(Math.abs(sumKg - totals.rebar_total_kg) <= 0.05, `${key}: thin + thick = ${sumKg} vs ${totals.rebar_total_kg}`);
  }

  // Simulate MS1/MS2 (shearwall + beam + slab, 0 columns) vs SK (with column)
  let allRptFlags = [...INITIAL_RPT_FLAGS];
  for (const g of IDE_REPORT_TREE_GROUPS) {
    if (g.rptSupported) allRptFlags = syncRptFlagsWithGroup(allRptFlags, g.id, true);
  }
  const sections = deriveSectionsFromRptFlags(allRptFlags);

  const ms1LikeSource: IdeProject = {
    format: "ide10",
    filename: "MS1.ide10",
    name: gt.verified_summary_comparison.MS1.project_title,
    byteLength: 1000,
    floors: [{ id: "f1", name: "1. BODRUM", elevation: -3, height: 3, sourceOffset: 0, endOffset: 50 }],
    elements: [
      {
        id: "w1", nativeId: 1, name: "P1", type: "wall", floorId: "f1",
        points: [{ x: 0, y: 0 }, { x: 3, y: 0 }], thickness: 0.25, height: 3,
        sourceOffset: 10, primitiveType: 0x11, layerId: 1, nativeZ: -3, lateralOffset: 0, rotation: 0, structural: true,
      },
      {
        id: "b1", nativeId: 2, name: "K101", type: "beam", floorId: "f1",
        points: [{ x: 0, y: 0 }, { x: 4, y: 0 }], width: 0.25, height: 0.5,
        sourceOffset: 20, primitiveType: 5, layerId: 2, nativeZ: 0, lateralOffset: 0, rotation: 0,
      },
    ],
    coverage: { candidateRecords: 2, decodedRecords: 2, unsupportedRecords: 0, ignoredTemplateRecords: 0, holeRecords: 0, rejectedCandidates: 0, byType: {}, unsupportedTypes: {}, limitations: [] },
    warnings: [],
  };

  const ms1Pdf = createIdeSourcePdf(ms1LikeSource, "d".repeat(64), "rev-ms1", {
    rptFlags: allRptFlags,
    sections,
    scope: "all",
  });
  const { text: ms1Text } = extractPdfText(ms1Pdf);
  assert.doesNotMatch(ms1Text, /Kolonlar \(/);
  assert.doesNotMatch(ms1Text, /Tekil Temeller \(/);
  assert.doesNotMatch(ms1Text, /Sürekli Temel \(/);
  assert.match(ms1Text, /Perdeler \(1 adet\)/);
  assert.match(ms1Text, /Kirişler \(1 adet\)/);

  const skLikeSource: IdeProject = {
    ...ms1LikeSource,
    filename: "SK.ide10",
    name: gt.verified_summary_comparison.SK.project_title,
    elements: [
      ...ms1LikeSource.elements,
      {
        id: "c1", nativeId: 3, name: "S101", type: "column", floorId: "f1",
        points: [{ x: 4, y: 0 }], width: 0.4, height: 0.4, bottom: -3, top: 0,
        sourceOffset: 30, primitiveType: 4, layerId: 3, nativeZ: -3, lateralOffset: 0, rotation: 0,
      },
    ],
  };
  const skPdf = createIdeSourcePdf(skLikeSource, "e".repeat(64), "rev-sk", {
    rptFlags: allRptFlags,
    sections,
    scope: "all",
  });
  const { text: skText } = extractPdfText(skPdf);
  assert.match(skText, /Kolonlar \(1 adet\)/);
  assert.doesNotMatch(skText, /Tekil Temeller \(/);
});
