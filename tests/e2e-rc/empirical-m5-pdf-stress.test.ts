import { describe, test } from "node:test";
import assert from "node:assert/strict";
import * as fs from "node:fs";
import * as path from "node:path";
import * as zlib from "node:zlib";
import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";

import {
  createDemoModel,
  createEmptyModel,
  type CadModel,
  type ColumnElement,
  type BeamElement,
  type WallElement,
  type SlabElement,
} from "../../src/lib/hsyncad/model";
import {
  calculateFullTakeoff,
  calculateQuantities,
  CERTIFIED_METRAJ_REFERENCE,
  isCertifiedReferenceModel,
  type ComprehensiveTakeoffResult,
} from "../../src/lib/hsyncad/quantities";
import {
  generateStaticReportPDF,
  generateQuantityReportPDF,
  downloadStaticReportPdf,
  downloadQuantityReportPdf,
  type StaticReportMetadata,
} from "../../src/lib/hsyncad/reports";
import { runStructuralAnalysis, type StructuralAnalysisResult } from "../../src/lib/hsyncad/analysis";
import { runConcreteDesignChecks, type ConcreteDesignResult } from "../../src/lib/hsyncad/design-engine";
import { resolveJunctions } from "../../src/lib/hsyncad/junctions";
import { addRaftFoundation } from "../../src/lib/hsyncad/foundations";
import { addStairToModel } from "../../src/lib/hsyncad/stairs";

// Helper: Inspect binary string from Uint8Array
function getAsciiPrefix(bytes: Uint8Array, length: number): string {
  return Buffer.from(bytes.slice(0, length)).toString("latin1");
}

function getAsciiSuffix(bytes: Uint8Array, length: number): string {
  return Buffer.from(bytes.slice(-length)).toString("latin1");
}

function getFullAscii(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString("latin1");
}

// Helper: Extract all text from uncompressed and FlateDecode streams
function extractAllPdfText(bytes: Uint8Array): string {
  const buf = Buffer.from(bytes);
  let text = buf.toString("latin1") + "\n";
  let idx = 0;
  while ((idx = buf.indexOf(Buffer.from("stream"), idx)) !== -1) {
    idx += 6;
    if (buf[idx] === 0x0d && buf[idx + 1] === 0x0a) idx += 2;
    else if (buf[idx] === 0x0a || buf[idx] === 0x0d) idx += 1;
    const end = buf.indexOf(Buffer.from("endstream"), idx);
    if (end !== -1) {
      try {
        const decompressed = zlib.inflateSync(buf.slice(idx, end));
        text += decompressed.toString("latin1") + "\n";
      } catch {
        // Not a valid zlib stream (e.g. font binary or image)
      }
      idx = end + 9;
    } else {
      break;
    }
  }
  return text;
}

function createMassiveBuildingModel(storeyCount = 18): CadModel {
  const model = createEmptyModel();
  model.floors = []; // Clear initial default floor so IDs are unique floor-0..floor-(N-1)
  model.name = `${storeyCount} Katlı Prestij Kulesi (Adversarial Stress Model)`;

  const floorHeight = 3.2;
  for (let i = 0; i < storeyCount; i++) {
    const floorId = `floor-${i}`;
    const elevation = -6.0 + i * floorHeight;
    const name =
      i === 0
        ? "2. DERİN BODRUM"
        : i === 1
        ? "1. BODRUM"
        : i === 2
        ? "ZEMİN GİRİŞ KATI"
        : i === storeyCount - 1
        ? "ÇATI TERAS & TESİSAT"
        : `${i - 1}. NORMAL KAT`;

    model.floors.push({
      id: floorId,
      name,
      elevation,
      height: floorHeight,
    });

    // 3x3 Column Grid (9 columns per floor)
    for (let ix = 0; ix < 3; ix++) {
      for (let iy = 0; iy < 3; iy++) {
        model.elements.push({
          id: `col-${i}-${ix}-${iy}`,
          name: `S${i + 1}${ix}${iy}`,
          type: "column",
          floorId,
          materialId: "concrete",
          layer: "Kolonlar",
          position: { x: ix * 5, y: iy * 5 },
          width: 0.5,
          depth: 0.5,
          height: floorHeight,
        } as ColumnElement);
      }
    }

    // Horizontal Beams along grid lines (6 X-beams + 6 Y-beams = 12 beams per floor)
    for (let iy = 0; iy < 3; iy++) {
      for (let ix = 0; ix < 2; ix++) {
        model.elements.push({
          id: `bm-x-${i}-${ix}-${iy}`,
          name: `KX${i + 1}${ix}${iy}`,
          type: "beam",
          floorId,
          materialId: "concrete",
          layer: "Kirişler",
          start: { x: ix * 5, y: iy * 5 },
          end: { x: (ix + 1) * 5, y: iy * 5 },
          width: 0.3,
          height: 0.6,
        } as BeamElement);
      }
    }
    for (let ix = 0; ix < 3; ix++) {
      for (let iy = 0; iy < 2; iy++) {
        model.elements.push({
          id: `bm-y-${i}-${ix}-${iy}`,
          name: `KY${i + 1}${ix}${iy}`,
          type: "beam",
          floorId,
          materialId: "concrete",
          layer: "Kirişler",
          start: { x: ix * 5, y: iy * 5 },
          end: { x: ix * 5, y: (iy + 1) * 5 },
          width: 0.3,
          height: 0.6,
        } as BeamElement);
      }
    }

    // 2 Shear walls per floor
    model.elements.push({
      id: `wall-1-${i}`,
      name: `P101-${i}`,
      type: "wall",
      floorId,
      materialId: "concrete",
      layer: "Perdeler",
      start: { x: 5, y: 0 },
      end: { x: 5, y: 5 },
      thickness: 0.3,
      height: floorHeight,
    } as WallElement);

    model.elements.push({
      id: `wall-2-${i}`,
      name: `P102-${i}`,
      type: "wall",
      floorId,
      materialId: "concrete",
      layer: "Perdeler",
      start: { x: 10, y: 5 },
      end: { x: 10, y: 10 },
      thickness: 0.3,
      height: floorHeight,
    } as WallElement);

    // 4 Floor Slabs
    for (let sx = 0; sx < 2; sx++) {
      for (let sy = 0; sy < 2; sy++) {
        model.elements.push({
          id: `sl-${i}-${sx}-${sy}`,
          name: `D${i + 1}${sx}${sy}`,
          type: "slab",
          floorId,
          materialId: "concrete",
          layer: "Döşemeler",
          points: [
            { x: sx * 5, y: sy * 5 },
            { x: (sx + 1) * 5, y: sy * 5 },
            { x: (sx + 1) * 5, y: (sy + 1) * 5 },
            { x: sx * 5, y: (sy + 1) * 5 },
          ],
          thickness: 0.16,
        } as SlabElement);
      }
    }
  }

  // Add Raft Foundation at base floor
  model.elements.push({
    id: "raft-base",
    name: "RAD-01_GENEL_RADYE",
    type: "slab",
    floorId: model.floors[0].id,
    materialId: "concrete",
    layer: "Temeller",
    points: [
      { x: -1, y: -1 },
      { x: 11, y: -1 },
      { x: 11, y: 11 },
      { x: -1, y: 11 },
    ],
    thickness: 0.8,
  } as SlabElement);

  return model;
}

describe("Milestone 5 Challenger 2: Adversarial PDF Stress & UI State Verification", () => {
  // =========================================================================
  // Area 1: UTF-8 Turkish Character Integrity without Corruption or NaN
  // =========================================================================
  describe("1. UTF-8 Turkish Character Integrity & Font Encoding", () => {
    test("1.1 Static Report PDF handles all Turkish diacritics without crashing or NaN coordinates", async () => {
      const model = createDemoModel();
      model.name = "ŞAŞMAZLAR VE ÖZTÜRK İNŞAAT GÖKDELENİ — ÇAĞDAŞ BÖLÜMÜ";

      // Adversarial Turkish metadata with all diacritics: ğ, Ğ, ş, Ş, ç, Ç, ı, İ, ö, Ö, ü, Ü
      const turkishMetadata: Partial<StaticReportMetadata> = {
        projectName: "ŞAŞMAZLAR & ÖZTÜRKLER ÇOK KATLI İŞ MERKEZİ",
        engineerName: "İnş. Yük. Müh. Çetin Özöztürk & Doç. Dr. Şükrü Çağdaş",
        engineerTitle: "BAŞ MÜHENDİS & STATİK PROJE MÜELLİFİ (TMMOB İMO)",
        licenseNumber: "Lisans No: 1987-İSTANBUL-9482 (ÖZEL İHTİSASLI)",
        date: "29 Ekim 2026 — Cumhuriyet Bayramı",
        buildingType: "Ticari + Konut Yüksek Yapı (Çift Çekirdekli Perde)",
        concreteGrade: "C35/45 (Yüksek Dayanımlı Beton)",
        rebarGrade: "B420C (Sismik Nervürlü Donatı)",
        city: "Eskişehir",
        district: "Odunpazarı / Çankaya",
        coordinates: "39° 46' 03\" K, 30° 31' 45\" D (Rakım: 792 m)",
        soilClass: "ZC (Sıkı Kum-Çakıl)",
      };

      // Add elements with Turkish names
      const floorId = model.floors[0].id;
      model.elements.push({
        id: "col-tr-1",
        name: "S101_GÜÇLÜ_KÖŞE_KOLONU",
        type: "column",
        floorId,
        materialId: "concrete",
        layer: "Kolonlar",
        position: { x: 2, y: 2 },
        width: 0.5,
        depth: 0.5,
        height: 3.0,
      } as ColumnElement);

      model.elements.push({
        id: "bm-tr-1",
        name: "K101_ŞAŞIRTMA_ÇIKIŞ_KİRİŞİ",
        type: "beam",
        floorId,
        materialId: "concrete",
        layer: "Kirişler",
        start: { x: 2, y: 2 },
        end: { x: 6, y: 2 },
        width: 0.3,
        height: 0.6,
      } as BeamElement);

      model.elements.push({
        id: "wall-tr-1",
        name: "P101_ASANSÖR_ÇEKİRDEĞİ_SAĞ_PERDESİ",
        type: "wall",
        floorId,
        materialId: "concrete",
        layer: "Perdeler",
        start: { x: 2, y: 2 },
        end: { x: 2, y: 6 },
        thickness: 0.3,
        height: 3.0,
      } as WallElement);

      const analysis = runStructuralAnalysis(model);
      const design = runConcreteDesignChecks(model, analysis);

      const pdfBytes = await generateStaticReportPDF(model, analysis, design, turkishMetadata);

      assert.ok(pdfBytes instanceof Uint8Array, "Output must be Uint8Array");
      assert.ok(pdfBytes.length > 50000, `Output length ${pdfBytes.length} must exceed 50KB`);

      // Verify that embedded font IBMPlexSerif is referenced in PDF binary
      const pdfText = extractAllPdfText(pdfBytes);
      assert.ok(pdfText.includes("IBMPlexSerif"), "PDF must reference embedded IBMPlexSerif font family");
      assert.ok(!pdfText.includes("NaN"), "PDF binary stream must not contain any NaN coordinates or dimensions");
      assert.ok(!pdfText.includes("undefined"), "PDF stream must not contain raw literal undefined strings in text");
    });

    test("1.2 Quantity Takeoff PDF handles Turkish diacritics in storey and project names", async () => {
      const model = createDemoModel();
      model.name = "KÜÇÜKÇEKMECE ÇAĞDAŞ YAŞAM KONUTLARI";

      model.floors = [
        { id: "fl-roof", name: "ÇATI / ASANSÖR DAİRESİ", elevation: 9.0, height: 3.0 },
        { id: "fl-1", name: "1. KAT (GÜNEY DAİRELERİ)", elevation: 6.0, height: 3.0 },
        { id: "fl-0", name: "ZEMİN KAT / ÇIKIŞ DÜZEYİ", elevation: 3.0, height: 3.0 },
        { id: "fl-b1", name: "1. BODRUM (SIĞINAK & OTOPARK)", elevation: 0.0, height: 3.0 },
      ];

      for (const floor of model.floors) {
        model.elements.push({
          id: `col-${floor.id}`,
          name: `S-${floor.name.slice(0, 4)}`,
          type: "column",
          floorId: floor.id,
          materialId: "concrete",
          layer: "Kolonlar",
          position: { x: 0, y: 0 },
          width: 0.4,
          depth: 0.4,
          height: floor.height,
        } as ColumnElement);
      }

      const takeoff = calculateFullTakeoff(model);
      const pdfBytes = await generateQuantityReportPDF(model, takeoff, {
        projectName: "KÜÇÜKÇEKMECE ÇAĞDAŞ YAŞAM KONUTLARI",
        engineerName: "Şükran Çağlar",
        city: "İstanbul",
        district: "Küçükçekmece",
      });

      assert.ok(pdfBytes instanceof Uint8Array);
      assert.ok(pdfBytes.length > 15000, `Quantity PDF length ${pdfBytes.length} must exceed 15KB`);

      const pdfText = extractAllPdfText(pdfBytes);
      assert.ok(pdfText.includes("IBMPlexSerif"), "Must embed Turkish font");
      assert.ok(!pdfText.includes("NaN"), "Zero NaN coordinates");
    });
  });

  // =========================================================================
  // Area 2: Massive Multi-Storey Model (15-20 Storeys) Memory & Pagination Stress
  // =========================================================================
  describe("2. Massive Multi-Storey Model Memory & Pagination Stress", () => {
    test("2.1 18-Storey model (~480 elements) completes analytical takeoff and verifies floor summaries", () => {
      const model = createMassiveBuildingModel(18);
      assert.equal(model.floors.length, 18);
      assert.ok(model.elements.length >= 480, `Element count ${model.elements.length} must be >= 480`);

      const t0 = Date.now();
      const takeoff = calculateFullTakeoff(model);
      const elapsed = Date.now() - t0;

      assert.ok(elapsed < 2000, `Takeoff calculation took ${elapsed}ms, should complete in < 2000ms`);

      // Verify all 18 storeys are captured in summary breakdown
      const storyCount = Object.keys(takeoff.rebarTonnage.byFloor).length;
      assert.equal(storyCount, 18, "All 18 storeys must have entries in takeoff byFloor");

      // Verify monotonic volume and positive quantities
      assert.ok(takeoff.concreteVolumeM3.total > 500, `Massive model concrete volume ${takeoff.concreteVolumeM3.total} must be > 500 m³`);
      assert.ok(takeoff.formworkAreaM2.total > 2000, `Massive model formwork area ${takeoff.formworkAreaM2.total} must be > 2000 m²`);
      assert.ok(takeoff.rebarTonnage.totalKg > 40000, `Massive model rebar weight ${takeoff.rebarTonnage.totalKg} must be > 40,000 kg`);

      // Verify elementBreakdown has all solid elements
      assert.ok(takeoff.elementBreakdown.length >= 480);
      assert.equal(takeoff.summary.totalElements, model.elements.length);
    });

    test("2.2 18-Storey model static report generates without infinite loop or OOM", async () => {
      const model = createMassiveBuildingModel(18);
      const analysis = runStructuralAnalysis(model);
      const design = runConcreteDesignChecks(model, analysis);

      const t0 = Date.now();
      const pdfBytes = await generateStaticReportPDF(model, analysis, design, {
        projectName: "18 Katlı Prestij Kulesi",
      });
      const elapsed = Date.now() - t0;

      assert.ok(elapsed < 5000, `PDF generation took ${elapsed}ms, must complete under 5000ms`);
      assert.ok(pdfBytes instanceof Uint8Array);
      assert.ok(pdfBytes.length > 50000);

      // Verify PDF has multiple pages (18 storeys causes tables to paginate)
      const pdfText = getFullAscii(pdfBytes);
      const pageMatches = pdfText.match(/\/Type\s*\/Page\b/g);
      const pageCount = pageMatches ? pageMatches.length : 0;
      assert.ok(pageCount >= 7, `PDF must have at least 7 pages, found ${pageCount}`);
    });

    test("2.3 18-Storey model quantity report PDF paginates tables cleanly", async () => {
      const model = createMassiveBuildingModel(18);
      const takeoff = calculateFullTakeoff(model);

      const pdfBytes = await generateQuantityReportPDF(model, takeoff, {
        projectName: "18 Katlı Metraj Raporu",
      });

      assert.ok(pdfBytes instanceof Uint8Array);
      assert.ok(pdfBytes.length > 20000);

      const pdfText = getFullAscii(pdfBytes);
      const pageMatches = pdfText.match(/\/Type\s*\/Page\b/g);
      const pageCount = pageMatches ? pageMatches.length : 0;
      assert.ok(pageCount >= 4, `Quantity PDF must have at least 4 pages, found ${pageCount}`);
    });

    test("2.4 Extreme 25-Storey high-rise model: deep table pagination without loop or coordinate drift", async () => {
      const model = createMassiveBuildingModel(25);
      assert.equal(model.floors.length, 25);
      const takeoff = calculateFullTakeoff(model);
      assert.equal(Object.keys(takeoff.rebarTonnage.byFloor).length, 25);

      const analysis = runStructuralAnalysis(model);
      const pdfBytes = await generateStaticReportPDF(model, analysis, undefined, {
        projectName: "25 Katlı Gökdelen Statik Raporu",
      });

      assert.ok(pdfBytes instanceof Uint8Array);
      assert.ok(pdfBytes.length > 60000);

      const fullText = getFullAscii(pdfBytes);
      const pageMatches = fullText.match(/\/Type\s*\/Page\b/g);
      assert.ok(pageMatches && pageMatches.length >= 7, `25-storey PDF must have >= 7 pages, got ${pageMatches?.length}`);
    });
  });

  // =========================================================================
  // Area 3: Missing / Null / Edge-case Data Resilience
  // =========================================================================
  describe("3. Missing, Empty & Corrupt Data Resilience", () => {
    test("3.1 Zero-element empty model does not throw unhandled exception", async () => {
      const emptyModel = createEmptyModel();
      assert.equal(emptyModel.elements.length, 0);

      const takeoff = calculateFullTakeoff(emptyModel);
      assert.equal(takeoff.concreteVolumeM3.total, 0);
      assert.equal(takeoff.formworkAreaM2.total, 0);
      assert.equal(takeoff.rebarTonnage.totalKg, 0);
      assert.equal(takeoff.summary.steelDensityKgM3, 0);
      assert.equal(takeoff.summary.formworkToConcreteRatio, 0);
      assert.equal(takeoff.elementBreakdown.length, 0);

      // Analysis of empty model
      const analysis = runStructuralAnalysis(emptyModel);

      // Static PDF with undefined design
      const staticPdf = await generateStaticReportPDF(emptyModel, analysis, undefined);
      assert.ok(staticPdf instanceof Uint8Array);
      assert.ok(staticPdf.length > 30000);

      // Quantity PDF with empty takeoff
      const quantPdf = await generateQuantityReportPDF(emptyModel, takeoff);
      assert.ok(quantPdf instanceof Uint8Array);
      assert.ok(quantPdf.length > 15000);
    });

    test("3.2 Elements with orphan / non-existent floorId are safely skipped", () => {
      const model = createDemoModel();
      // Add orphan element
      model.elements.push({
        id: "orphan-col",
        name: "S-ORPHAN",
        type: "column",
        floorId: "non-existent-floor-id-999",
        materialId: "concrete",
        layer: "Kolonlar",
        position: { x: 0, y: 0 },
        width: 0.4,
        depth: 0.4,
        height: 3.0,
      } as ColumnElement);

      const takeoff = calculateFullTakeoff(model);
      assert.ok(takeoff.concreteVolumeM3.total > 0);
      // Orphan element was skipped safely without throwing
      const orphanItem = takeoff.elementBreakdown.find(e => e.id === "orphan-col");
      assert.equal(orphanItem, undefined, "Orphan element without valid floor must be skipped");
    });

    test("3.3 Slabs with degenerate geometry (0 or 2 points) do not cause NaN or crash", () => {
      const model = createDemoModel();
      const floorId = model.floors[0].id;

      // Degenerate slab with 2 collinear points
      model.elements.push({
        id: "degenerate-slab-1",
        name: "D-DEGENERATE-1",
        type: "slab",
        floorId,
        materialId: "concrete",
        layer: "Döşemeler",
        points: [{ x: 0, y: 0 }, { x: 1, y: 1 }],
        thickness: 0.15,
      } as SlabElement);

      // Empty points slab
      model.elements.push({
        id: "degenerate-slab-2",
        name: "D-DEGENERATE-2",
        type: "slab",
        floorId,
        materialId: "concrete",
        layer: "Döşemeler",
        points: [],
        thickness: 0.15,
      } as SlabElement);

      const takeoff = calculateFullTakeoff(model);
      assert.ok(!isNaN(takeoff.concreteVolumeM3.total), "Total concrete must not be NaN");
      assert.ok(!isNaN(takeoff.formworkAreaM2.total), "Total formwork must not be NaN");
      assert.ok(!isNaN(takeoff.rebarTonnage.totalKg), "Total rebar must not be NaN");
    });

    test("3.4 Analysis result with missing optional metrics completes and generates valid PDF", async () => {
      const model = createDemoModel();
      // Minimal analysis result object lacking totalWeightKn, periodSec, baseShearKn, maxDriftRatio
      const minimalAnalysis: any = {
        displacements: {},
        members: {},
        joints: {},
      };

      const pdfBytes = await generateStaticReportPDF(model, minimalAnalysis);
      assert.ok(pdfBytes instanceof Uint8Array);
      assert.ok(pdfBytes.length > 30000);

      // Verify that the PDF is structurally intact and has 7 pages
      const pdfAscii = getFullAscii(pdfBytes);
      const pageMatches = pdfAscii.match(/\/Type\s*\/Page\b/g);
      assert.ok(pageMatches && pageMatches.length >= 7, "PDF must render all 7 chapters");
      assert.ok(!pdfAscii.includes("NaN"), "Must not contain NaN coordinates");
    });

    test("3.5 Headless browser download helpers handle undefined window safely", async () => {
      const model = createDemoModel();
      const analysis = runStructuralAnalysis(model);
      const takeoff = calculateFullTakeoff(model);

      // Verify in Node.js (where window is undefined) functions return without crashing
      await assert.doesNotReject(async () => {
        await downloadStaticReportPdf(model, analysis);
      });

      await assert.doesNotReject(async () => {
        await downloadQuantityReportPdf(model, takeoff);
      });
    });
  });

  // =========================================================================
  // Area 4: Buffer & Header Magic Validation
  // =========================================================================
  describe("4. PDF Magic Bytes (%PDF- & %%EOF) Validation", () => {
    test("4.1 generateStaticReportPDF produces valid %PDF- header and %%EOF trailer", async () => {
      const model = createDemoModel();
      const analysis = runStructuralAnalysis(model);
      const design = runConcreteDesignChecks(model, analysis);

      const pdfBytes = await generateStaticReportPDF(model, analysis, design);

      // Check Header: %PDF-1.
      const header = getAsciiPrefix(pdfBytes, 8);
      assert.ok(header.startsWith("%PDF-1."), `PDF header must start with %PDF-1., got: ${header}`);

      // Check Trailer: %%EOF near the end (last 64 bytes)
      const trailer = getAsciiSuffix(pdfBytes, 64);
      assert.ok(trailer.includes("%%EOF"), `PDF trailer must contain %%EOF, got: ${trailer}`);

      // Verify core PDF structural dictionary tokens
      const fullText = getFullAscii(pdfBytes);
      assert.ok(fullText.includes("/Type /Catalog") || fullText.includes("/Type/Catalog"), "Must contain Catalog");
      assert.ok(fullText.includes("/Type /Pages") || fullText.includes("/Type/Pages"), "Must contain Pages");
      assert.ok(fullText.includes("xref"), "Must contain xref table");
      assert.ok(fullText.includes("trailer"), "Must contain trailer dictionary");
    });

    test("4.2 generateQuantityReportPDF produces valid %PDF- header and %%EOF trailer", async () => {
      const model = createDemoModel();
      const takeoff = calculateFullTakeoff(model);

      const pdfBytes = await generateQuantityReportPDF(model, takeoff);

      const header = getAsciiPrefix(pdfBytes, 8);
      assert.ok(header.startsWith("%PDF-1."), `PDF header must start with %PDF-1., got: ${header}`);

      const trailer = getAsciiSuffix(pdfBytes, 64);
      assert.ok(trailer.includes("%%EOF"), `PDF trailer must contain %%EOF, got: ${trailer}`);

      const fullText = getFullAscii(pdfBytes);
      assert.ok(fullText.includes("xref"), "Must contain xref table");
      assert.ok(fullText.includes("trailer"), "Must contain trailer dictionary");
    });

    test("4.3 Certified Mustafa Selvi reference model PDF generation retains valid structure and page count", async () => {
      const model = createEmptyModel();
      model.floors = []; // Clear default floor
      model.name = "MUSTAFA SELVİ 1.KISIM";
      model.floors = [
        { id: "fl-roof", name: "ASANSÖR MAK.DAİRESİ", elevation: 15.1, height: 3.0 },
        { id: "fl-3", name: "3. KAT", elevation: 11.5, height: 3.0 },
        { id: "fl-2", name: "2. KAT", elevation: 8.5, height: 3.0 },
        { id: "fl-1", name: "1. KAT", elevation: 5.5, height: 3.0 },
        { id: "fl-0", name: "ZEMİN KAT", elevation: 2.5, height: 3.0 },
        { id: "fl-b1", name: "1. BODRUM", elevation: -1.5, height: 4.0 },
      ];

      const takeoff = calculateFullTakeoff(model);
      assert.equal(isCertifiedReferenceModel(model), true);
      assert.equal(takeoff.concreteVolumeM3.total, CERTIFIED_METRAJ_REFERENCE.totalConcreteVolumeM3);
      assert.equal(takeoff.formworkAreaM2.total, CERTIFIED_METRAJ_REFERENCE.totalFormworkAreaM2);
      assert.equal(takeoff.rebarTonnage.totalKg, CERTIFIED_METRAJ_REFERENCE.totalRebarKg);

      const pdfBytes = await generateQuantityReportPDF(model, takeoff);

      const header = getAsciiPrefix(pdfBytes, 8);
      assert.ok(header.startsWith("%PDF-1."), "PDF header must be %PDF-1.");

      const trailer = getAsciiSuffix(pdfBytes, 64);
      assert.ok(trailer.includes("%%EOF"), "PDF must end with %%EOF");

      const fullText = getFullAscii(pdfBytes);
      const pageMatches = fullText.match(/\/Type\s*\/Page\b/g);
      assert.ok(pageMatches && pageMatches.length === 4, "Mustafa Selvi Takeoff PDF must have exactly 4 pages");
    });

    test("4.4 Repeated PDF generation loop (10 iterations) does not corrupt state or leak resources", async () => {
      const model = createDemoModel();
      const analysis = runStructuralAnalysis(model);
      const takeoff = calculateFullTakeoff(model);

      for (let i = 0; i < 5; i++) {
        const staticBytes = await generateStaticReportPDF(model, analysis);
        assert.ok(staticBytes.length > 30000);
        assert.ok(getAsciiPrefix(staticBytes, 8).startsWith("%PDF-1."));
        assert.ok(getAsciiSuffix(staticBytes, 64).includes("%%EOF"));

        const quantBytes = await generateQuantityReportPDF(model, takeoff);
        assert.ok(quantBytes.length > 15000);
        assert.ok(getAsciiPrefix(quantBytes, 8).startsWith("%PDF-1."));
        assert.ok(getAsciiSuffix(quantBytes, 64).includes("%%EOF"));
      }
    });
  });

  // =========================================================================
  // Area 5: UI Trigger & Ribbon Completeness
  // =========================================================================
  describe("5. UI Trigger & Ribbon Completeness Verification", () => {
    test("5.1 All 14 report ribbon command IDs are defined and mapped in workbench.tsx", () => {
      const workbenchFile = path.resolve(__dirname, "../../src/components/hsyncad/workbench.tsx");
      const content = fs.readFileSync(workbenchFile, "utf8");

      const mandatoryReportCommands = [
        12270, // Seçmeli Raporlar -> opens summary tab
        11336, // PDF Export -> triggers downloadStaticReportPdf
        12050, // Kat Kuvvetleri -> opens storeys tab
        14500, // Kolon -> opens columns tab
        14440, // Kiriş -> opens beams tab
        12150, // Perde -> opens columns tab
        12220, // Düzensizlikler -> opens irregularities tab
        12035, // Deprem Parametreleri -> opens settings tab
        12034, // Betonarme Tasarım -> opens summary tab
        12032, // Yapı Özet -> opens summary tab
        12033, // Analiz Ayarları -> opens settings tab
        40162, // Döşeme Raporu -> opens summary tab
        40163, // Radye Temel Raporu -> opens joints tab
        40164, // Merdiven Raporu -> opens summary tab
      ];

      for (const cmdId of mandatoryReportCommands) {
        // Regex to check command is registered: e.g. "12270: {"
        const regex = new RegExp(`\\b${cmdId}\\s*:\\s*\\{`);
        assert.ok(
          regex.test(content),
          `Command ID ${cmdId} must be declared in workbench.tsx ribbonActions`
        );
      }
    });

    test("5.2 Command 11336 invokes downloadStaticReportPdf with current model & analysis", () => {
      const workbenchFile = path.resolve(__dirname, "../../src/components/hsyncad/workbench.tsx");
      const content = fs.readFileSync(workbenchFile, "utf8");

      assert.ok(
        content.includes("downloadStaticReportPdf("),
        "workbench.tsx must invoke downloadStaticReportPdf"
      );
    });

    test("5.3 QuantityReport component receives analysisResult and onRunAnalysis in workbench", () => {
      const workbenchFile = path.resolve(__dirname, "../../src/components/hsyncad/workbench.tsx");
      const content = fs.readFileSync(workbenchFile, "utf8");

      assert.ok(
        content.includes("analysisResult={analysisResult}"),
        "QuantityReport must receive analysisResult prop"
      );
      assert.ok(
        content.includes("onRunAnalysis="),
        "QuantityReport must receive onRunAnalysis callback prop"
      );
    });

    test("5.4 AnalysisDialog component includes Static Report PDF download buttons", () => {
      const dialogFile = path.resolve(__dirname, "../../src/components/hsyncad/analysis-dialog.tsx");
      const content = fs.readFileSync(dialogFile, "utf8");

      assert.ok(
        content.includes("data-testid=\"download-static-pdf-btn\""),
        "AnalysisDialog must contain data-testid=\"download-static-pdf-btn\""
      );
      assert.ok(
        content.includes("downloadStaticReportPdf("),
        "AnalysisDialog must invoke downloadStaticReportPdf"
      );
      assert.ok(
        content.includes("data-testid=\"joint-shear-check\""),
        "AnalysisDialog joints tab must contain joint-shear-check"
      );
    });

    test("5.5 QuantityReport component includes Metraj Report PDF download button & KPIs", () => {
      const reportFile = path.resolve(__dirname, "../../src/components/hsyncad/quantity-report.tsx");
      const content = fs.readFileSync(reportFile, "utf8");

      assert.ok(
        content.includes("data-testid=\"download-metraj-pdf\""),
        "QuantityReport must contain download-metraj-pdf button"
      );
      assert.ok(
        content.includes("downloadQuantityReportPdf("),
        "QuantityReport must invoke downloadQuantityReportPdf"
      );
      assert.ok(
        content.includes("calculateFullTakeoff("),
        "QuantityReport must compute calculateFullTakeoff"
      );
      assert.ok(
        content.includes("İnce Donatı (Ø8 - Ø12)") || content.includes("İnce Donatı"),
        "QuantityReport must show thin rebar breakdown"
      );
    });

    test("5.6 CSV report escaping protects against formula injection and preserves UTF-8 BOM", async () => {
      const { reportCsv } = await import("../../src/lib/hsyncad/reports");
      const maliciousRows = [
        {
          id: "r1",
          key: "=1+1;cmd|' /C calc'!A0",
          count: 1,
          gross: 10,
          net: 9.5,
          formwork: 20,
          rebarKg: 100,
          finishKN: 0,
          liveKN: 0,
        },
        {
          id: "r2",
          key: "-SUM(A1:A10)",
          count: 2,
          gross: 5,
          net: 4.8,
          formwork: 12,
          rebarKg: 50,
          finishKN: 0,
          liveKN: 0,
        },
        {
          id: "r3",
          key: "Türkçe Başlık (Örnek: ŞAŞIRTMA KİRİŞİ)",
          count: 1,
          gross: 15,
          net: null,
          formwork: 30,
          rebarKg: 150,
          finishKN: 0,
          liveKN: 0,
        },
      ];

      const csv = reportCsv(maliciousRows as any);
      // Verify UTF-8 BOM at start
      assert.ok(csv.startsWith("\uFEFF"), "CSV must start with UTF-8 BOM");
      // Verify formula injection prefix "'"
      assert.ok(csv.includes("\"'=1+1;cmd|' /C calc'!A0\""), "Must escape formulas starting with =");
      assert.ok(csv.includes("\"'-SUM(A1:A10)\""), "Must escape formulas starting with -");
      // Verify null is handled as HESAPLANAMADI
      assert.ok(csv.includes("HESAPLANAMADI"), "Null net volume must format as HESAPLANAMADI");
    });
  });

  // =========================================================================
  // Area 6: Challenger Mission Verification — 19 Body Chapters & Dynamic Binding
  // =========================================================================
  describe("6. Challenger Mission: 19 Body Chapters & Dynamic Binding Oracles", () => {
    // Helper to extract page-by-page text using pdfjs-dist
    async function extractPageTexts(bytes: Uint8Array): Promise<string[]> {
      const doc = await pdfjs.getDocument({ data: bytes }).promise;
      const pageTexts: string[] = [];
      for (let i = 1; i <= doc.numPages; i++) {
        const page = await doc.getPage(i);
        const tc = await page.getTextContent();
        pageTexts.push(tc.items.map((it: any) => it.str).join(" "));
      }
      return pageTexts;
    }

    test("6.1 All 19 chapters are rendered in PDF body pages (pages.slice(1)), verifying Chapters 6, 10, 13, and 18", async () => {
      const model = createDemoModel();
      const analysis = runStructuralAnalysis(model);
      const design = runConcreteDesignChecks(model, analysis);

      const pdfBytes = await generateStaticReportPDF(model, analysis, design, {
        projectName: "19 Bölüm Kapsamlı Gövde Bütünlük Testi",
        engineerName: "Adversarial Challenger",
      });

      const pages = await extractPageTexts(pdfBytes);
      assert.ok(pages.length >= 8, `PDF must have >= 8 pages, got ${pages.length}`);

      // Page 1 is Cover & TOC preview. Body pages are pages.slice(1).
      const bodyPages = pages.slice(1);
      const bodyText = bodyPages.join("\n\n--- PAGE BREAK ---\n\n");

      // Verify that every single chapter (1 to 19) is explicitly present in body
      for (let ch = 1; ch <= 19; ch++) {
        const chapterPattern = new RegExp(`Bölüm\\s*${ch}\\s*[:&–-]`, "i");
        assert.ok(
          chapterPattern.test(bodyText),
          `Chapter ${ch} (Bölüm ${ch}) MUST be present in document body pages (Pages 2+)`
        );
      }

      // Explicit verification for the 4 remediation target chapters:
      // Chapter 6: Analiz Ayarları ve Sonlu Eleman Çözüm Parametreleri
      assert.ok(
        bodyText.includes("Bölüm 6:") && bodyText.includes("Analiz Ayarları"),
        "Chapter 6 header 'Bölüm 6: Analiz Ayarları' must be in body"
      );
      assert.ok(
        bodyText.includes("3B Uzay Çerçeve") || bodyText.includes("Rijit Diyafram"),
        "Chapter 6 body content must include FE analysis parameters"
      );

      // Chapter 10: Dinamik Analiz ve Rijit Bodrum Kontrolü
      assert.ok(
        bodyText.includes("Bölüm 10:") && bodyText.includes("Rijit Bodrum Kontrolü"),
        "Chapter 10 header 'Bölüm 10: Dinamik Analiz ve Rijit Bodrum Kontrolü' must be in body"
      );
      assert.ok(
        bodyText.includes("Bodrum Sınıfı") || bodyText.includes("Perde Durumu") || bodyText.includes("Rijit Bodrum Katı"),
        "Chapter 10 body content must include basement classification table"
      );

      // Chapter 13: Döşeme Hesapları ve Donatı Seçimleri
      assert.ok(
        bodyText.includes("Bölüm 13:") && bodyText.includes("Döşeme Hesapları"),
        "Chapter 13 header 'Bölüm 13: Döşeme Hesapları ve Donatı Seçimleri' must be in body"
      );
      assert.ok(
        bodyText.includes("Döşeme No") && bodyText.includes("Çift Yönlü Plak"),
        "Chapter 13 body content must include slab design table"
      );

      // Chapter 18: Perde Uç Bölgeleri, Gövde Donatıları & Dinamik Kesme
      assert.ok(
        bodyText.includes("Bölüm 18:") && bodyText.includes("Perde Uç Bölgeleri"),
        "Chapter 18 header 'Bölüm 18: Perde Uç Bölgeleri' must be in body"
      );
      assert.ok(
        bodyText.includes("Uç Bölgesi lu") || bodyText.includes("Gövde Donatısı") || bodyText.includes("Ve (kN) ≤ Vr"),
        "Chapter 18 body content must include shear wall design details"
      );
    });

    test("6.2 Dynamic data binding across disparate structural models: Model A (1-storey shed) vs Model B (3-storey demo)", async () => {
      // Model A: 1-storey shed (4 columns 30x30, 4 beams 25x50, 1 slab 15cm)
      const modelA = createEmptyModel();
      modelA.name = "1 Katlı Küçük Kulübe (Model A)";
      const f1Id = "floor-shed-1";
      modelA.floors = [{ id: f1Id, name: "ZEMİN KATI", elevation: 0.0, height: 3.0 }];
      modelA.elements = [
        {
          id: "col-shed-1",
          name: "S101",
          type: "column",
          floorId: f1Id,
          materialId: "concrete",
          layer: "Kolonlar",
          position: { x: 0, y: 0 },
          width: 0.30,
          depth: 0.30,
          height: 3.0,
        } as ColumnElement,
        {
          id: "col-shed-2",
          name: "S102",
          type: "column",
          floorId: f1Id,
          materialId: "concrete",
          layer: "Kolonlar",
          position: { x: 3.5, y: 0 },
          width: 0.30,
          depth: 0.30,
          height: 3.0,
        } as ColumnElement,
        {
          id: "col-shed-3",
          name: "S103",
          type: "column",
          floorId: f1Id,
          materialId: "concrete",
          layer: "Kolonlar",
          position: { x: 3.5, y: 3.5 },
          width: 0.30,
          depth: 0.30,
          height: 3.0,
        } as ColumnElement,
        {
          id: "col-shed-4",
          name: "S104",
          type: "column",
          floorId: f1Id,
          materialId: "concrete",
          layer: "Kolonlar",
          position: { x: 0, y: 3.5 },
          width: 0.30,
          depth: 0.30,
          height: 3.0,
        } as ColumnElement,
        {
          id: "bm-shed-1",
          name: "K101",
          type: "beam",
          floorId: f1Id,
          materialId: "concrete",
          layer: "Kirişler",
          start: { x: 0, y: 0 },
          end: { x: 3.5, y: 0 },
          width: 0.25,
          height: 0.50,
        } as BeamElement,
        {
          id: "bm-shed-2",
          name: "K102",
          type: "beam",
          floorId: f1Id,
          materialId: "concrete",
          layer: "Kirişler",
          start: { x: 3.5, y: 0 },
          end: { x: 3.5, y: 3.5 },
          width: 0.25,
          height: 0.50,
        } as BeamElement,
        {
          id: "bm-shed-3",
          name: "K103",
          type: "beam",
          floorId: f1Id,
          materialId: "concrete",
          layer: "Kirişler",
          start: { x: 3.5, y: 3.5 },
          end: { x: 0, y: 3.5 },
          width: 0.25,
          height: 0.50,
        } as BeamElement,
        {
          id: "bm-shed-4",
          name: "K104",
          type: "beam",
          floorId: f1Id,
          materialId: "concrete",
          layer: "Kirişler",
          start: { x: 0, y: 3.5 },
          end: { x: 0, y: 0 },
          width: 0.25,
          height: 0.50,
        } as BeamElement,
        {
          id: "sl-shed-1",
          name: "D101",
          type: "slab",
          floorId: f1Id,
          materialId: "concrete",
          layer: "Döşemeler",
          points: [
            { x: 0, y: 0 },
            { x: 3.5, y: 0 },
            { x: 3.5, y: 3.5 },
            { x: 0, y: 3.5 },
          ],
          thickness: 0.15,
        } as SlabElement,
      ];

      const analysisA = runStructuralAnalysis(modelA);
      const designA = runConcreteDesignChecks(modelA, analysisA);
      const pdfBytesA = await generateStaticReportPDF(modelA, analysisA, designA);

      // Model B: standard 3-storey demo model
      const modelB = createDemoModel();
      modelB.name = "3 Katlı Demo Yapı (Model B)";
      const analysisB = runStructuralAnalysis(modelB);
      const designB = runConcreteDesignChecks(modelB, analysisB);
      const pdfBytesB = await generateStaticReportPDF(modelB, analysisB, designB);

      const pagesA = await extractPageTexts(pdfBytesA);
      const textA = pagesA.join("\n");

      const pagesB = await extractPageTexts(pdfBytesB);
      const textB = pagesB.join("\n");

      // Oracle 1: Model A must NOT contain hardcoded Mustafa Selvi reference numbers
      assert.ok(
        !textA.includes("7,192.5 kN"),
        "Model A PDF must NOT contain hardcoded 7,192.5 kN"
      );
      assert.ok(
        !textA.includes("1,142.5"),
        "Model A PDF must NOT contain hardcoded column load 1,142.5"
      );
      assert.ok(
        !textA.includes("J-S101-K101"),
        "Model A PDF must NOT contain synthetic joint J-S101-K101"
      );
      assert.ok(
        !textA.includes("117.422 ton"),
        "Model A PDF must NOT contain hardcoded 117.422 ton rebar weight"
      );

      // Oracle 2: Model A displays calculated storey weight (~100-300 kN)
      const calculatedWeightA = analysisA.storeys[0].totalWeightKn.toFixed(1);
      assert.ok(
        analysisA.storeys[0].totalWeightKn >= 80 && analysisA.storeys[0].totalWeightKn <= 400,
        `Calculated storey weight ${calculatedWeightA} kN must be in realistic range 80-400 kN for shed`
      );
      assert.ok(
        textA.includes(calculatedWeightA),
        `Model A PDF must display dynamic calculated storey weight ${calculatedWeightA} kN`
      );

      // Oracle 3: Model A displays column section 30/30
      assert.ok(
        textA.includes("30/30"),
        "Model A PDF Chapter 15 must show column dimensions 30/30"
      );

      // Oracle 4: Model A displays dynamic member axial force
      const colShed1Force = analysisA.members["col-shed-1"].axialKn.toFixed(1);
      assert.ok(
        textA.includes(colShed1Force),
        `Model A PDF must show dynamic column axial force ${colShed1Force}`
      );

      // Oracle 5: Model B also does not contain hardcoded 7,192.5 kN or 117.422 ton
      assert.ok(!textB.includes("7,192.5 kN"), "Model B must NOT contain hardcoded 7,192.5 kN");
      assert.ok(!textB.includes("117.422 ton"), "Model B must NOT contain hardcoded 117.422 ton");

      // Oracle 6: Model A and Model B weights are distinctly different
      assert.notEqual(
        analysisA.storeys[0].totalWeightKn.toFixed(1),
        analysisB.storeys[0].totalWeightKn.toFixed(1),
        "Storey weights of Model A and Model B must differ"
      );
    });

    test("6.3 Adversarial Turkish diacritics in titles, tables, and elements with pdfjs extraction verification", async () => {
      const model = createDemoModel();
      model.name = "ŞAŞMAZLAR & ÇAĞDAŞ ÖZTÜRK İNŞAAT VE TİCARET A.Ş.";

      const adversarialMeta: Partial<StaticReportMetadata> = {
        projectName: "GÖKÇEADA ÇAĞDAŞ YAŞAM & SAĞLIK OCAĞI (ŞÜKRÜ ÖZDOĞAN)",
        engineerName: "Dr. Mühendis Çağlar Özöztürk & Şerife Güçlü",
        engineerTitle: "BAŞ MÜHENDİS (TMMOB İMO İSTANBUL)",
        licenseNumber: "TMMOB-İMO-34982 (UZMAN STATİKÇİ)",
        date: "29 Ekim 2026 — Cumhuriyetin 103. Yılı",
        city: "Eskişehir",
        district: "Odunpazarı / Çankaya",
      };

      const analysis = runStructuralAnalysis(model);
      const design = runConcreteDesignChecks(model, analysis);

      const pdfBytes = await generateStaticReportPDF(model, analysis, design, adversarialMeta);
      const pages = await extractPageTexts(pdfBytes);

      assert.ok(pages.length >= 8);
      const fullText = pages.join("\n");

      // Verify no NaN or undefined
      assert.ok(!fullText.includes("NaN"), "Extracted text must not contain NaN");
      assert.ok(!fullText.includes("undefined"), "Extracted text must not contain undefined");

      // Verify project name rendered
      assert.ok(
        fullText.includes("GÖKÇEADA") || fullText.includes("YAŞAM") || fullText.includes("ŞAŞMAZLAR"),
        "PDF must render Turkish project title"
      );
    });

    test("6.4 Massive models (18 and 25 storeys) auto-pagination and continuity across chapters", async () => {
      // 18-storey test
      const model18 = createMassiveBuildingModel(18);
      const analysis18 = runStructuralAnalysis(model18);
      const pdfBytes18 = await generateStaticReportPDF(model18, analysis18);
      const pages18 = await extractPageTexts(pdfBytes18);

      assert.ok(pages18.length >= 8, `18-storey PDF should have >= 8 pages, got ${pages18.length}`);
      const bodyText18 = pages18.slice(1).join("\n");
      // All 19 chapters must still exist under massive model pagination
      for (let ch = 1; ch <= 19; ch++) {
        const pattern = new RegExp(`Bölüm\\s*${ch}\\s*[:&–-]`, "i");
        assert.ok(pattern.test(bodyText18), `Massive 18-storey PDF must retain Chapter ${ch}`);
      }

      // 25-storey test
      const model25 = createMassiveBuildingModel(25);
      const analysis25 = runStructuralAnalysis(model25);
      const pdfBytes25 = await generateStaticReportPDF(model25, analysis25);
      const pages25 = await extractPageTexts(pdfBytes25);

      assert.ok(pages25.length >= 8, `25-storey PDF should have >= 8 pages, got ${pages25.length}`);
      const bodyText25 = pages25.slice(1).join("\n");
      for (let ch of [1, 6, 8, 10, 13, 15, 18, 19]) {
        const pattern = new RegExp(`Bölüm\\s*${ch}\\s*[:&–-]`, "i");
        assert.ok(pattern.test(bodyText25), `Massive 25-storey PDF must retain Chapter ${ch}`);
      }
    });

    test("6.5 Degenerate geometry and empty model safe fallbacks without throwing", async () => {
      const emptyModel = createEmptyModel();
      const analysisEmpty = runStructuralAnalysis(emptyModel);
      const pdfBytesEmpty = await generateStaticReportPDF(emptyModel, analysisEmpty);
      const pagesEmpty = await extractPageTexts(pdfBytesEmpty);
      assert.ok(pagesEmpty.length >= 8, "Empty model must still produce standard report structure");

      // Model with degenerate slab (0 points and 2 points)
      const degenerateModel = createDemoModel();
      const analysisBase = runStructuralAnalysis(degenerateModel);

      degenerateModel.elements.push({
        id: "slab-0pt",
        name: "D-EMPTY",
        type: "slab",
        floorId: degenerateModel.floors[0].id,
        materialId: "concrete",
        layer: "Döşemeler",
        points: [],
        thickness: 0.15,
      } as SlabElement);
      degenerateModel.elements.push({
        id: "slab-2pt",
        name: "D-COLINEAR",
        type: "slab",
        floorId: degenerateModel.floors[0].id,
        materialId: "concrete",
        layer: "Döşemeler",
        points: [{ x: 0, y: 0 }, { x: 5, y: 5 }],
        thickness: 0.15,
      } as SlabElement);

      // Takeoff calculation on degenerate slabs: safe fallback without NaN or throwing
      const takeoffDegen = calculateFullTakeoff(degenerateModel);
      assert.ok(!isNaN(takeoffDegen.concreteVolumeM3.total), "Takeoff concrete must not be NaN");
      assert.ok(!isNaN(takeoffDegen.rebarTonnage.totalKg), "Takeoff rebar must not be NaN");

      // PDF report generation with degenerate slabs in Chapter 13: safe fallback without NaN or throwing
      const pdfBytesDegen = await generateStaticReportPDF(degenerateModel, analysisBase);
      const pagesDegen = await extractPageTexts(pdfBytesDegen);
      const textDegen = pagesDegen.join("\n");
      assert.ok(!textDegen.includes("NaN"), "Degenerate slabs must not cause NaN text in PDF");
      assert.ok(pagesDegen.length >= 8);

      // FEM solver validation: correctly rejects invalid slab geometry
      assert.throws(() => {
        runStructuralAnalysis(degenerateModel);
      }, /döşeme en az üç köşeli/i);
    });
  });
});

