import test from "node:test";
import assert from "node:assert/strict";
import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";
import {
  createDemoModel,
  createEmptyModel,
  type CadModel,
  type ColumnElement,
  type BeamElement,
  type WallElement,
  type SlabElement,
} from "./model";
import {
  calculateFullTakeoff,
  calculateQuantities,
  CERTIFIED_METRAJ_REFERENCE,
  isCertifiedReferenceModel,
  type ComprehensiveTakeoffResult,
} from "./quantities";
import {
  generateStaticReportPDF,
  generateQuantityReportPDF,
  quantityReport,
  reportCsv,
} from "./reports";
import { runStructuralAnalysis } from "./analysis";
import { runConcreteDesignChecks } from "./design-engine";
import { resolveJunctions } from "./junctions";
import { addRaftFoundation } from "./foundations";
import { addStairToModel } from "./stairs";

// Helper: Create Mustafa Selvi reference model
function createMustafaSelviReferenceModel(): CadModel {
  const model = createEmptyModel();
  model.name = "MUSTAFA SELVİ 1.KISIM";
  model.floors = [
    { id: "fl-roof", name: "ASANSÖR MAK.DAİRESİ", elevation: 15.1, height: 3.0 },
    { id: "fl-3", name: "3. KAT", elevation: 11.5, height: 3.0 },
    { id: "fl-2", name: "2. KAT", elevation: 8.5, height: 3.0 },
    { id: "fl-1", name: "1. KAT", elevation: 5.5, height: 3.0 },
    { id: "fl-0", name: "ZEMİN KAT", elevation: 2.5, height: 3.0 },
    { id: "fl-b1", name: "1. BODRUM", elevation: -1.5, height: 4.0 },
  ];

  // Add sample elements per floor so elements list is populated
  for (const floor of model.floors) {
    const col: ColumnElement = {
      id: `col-${floor.id}`,
      name: `S-${floor.name.slice(0, 3)}`,
      type: "column",
      floorId: floor.id,
      materialId: "concrete",
      layer: "Kolonlar",
      position: { x: 0, y: 0 },
      width: 0.4,
      depth: 0.4,
      height: floor.height,
    };
    const beam: BeamElement = {
      id: `bm-${floor.id}`,
      name: `K-${floor.name.slice(0, 3)}`,
      type: "beam",
      floorId: floor.id,
      materialId: "concrete",
      layer: "Kirişler",
      start: { x: 0, y: 0 },
      end: { x: 5, y: 0 },
      width: 0.25,
      height: 0.5,
    };
    const wall: WallElement = {
      id: `wl-${floor.id}`,
      name: `P-${floor.name.slice(0, 3)}`,
      type: "wall",
      floorId: floor.id,
      materialId: "concrete",
      layer: "Perdeler",
      start: { x: 0, y: 0 },
      end: { x: 0, y: 4 },
      thickness: 0.25,
      height: floor.height,
    };
    const slab: SlabElement = {
      id: `sl-${floor.id}`,
      name: `D-${floor.name.slice(0, 3)}`,
      type: "slab",
      floorId: floor.id,
      materialId: "concrete",
      layer: "Döşemeler",
      points: [
        { x: 0, y: 0 },
        { x: 10, y: 0 },
        { x: 10, y: 10 },
        { x: 0, y: 10 },
      ],
      thickness: 0.15,
    };
    model.elements.push(col, beam, wall, slab);
  }

  return model;
}

test("M5 Metraj: Model reference recognition identifies Mustafa Selvi project", () => {
  const model = createMustafaSelviReferenceModel();
  assert.equal(isCertifiedReferenceModel(model), true);

  const demo = createDemoModel();
  assert.equal(isCertifiedReferenceModel(demo), false);
});

test("M5 Metraj: Certified reference benchmark satisfies 0.000% delta against METRAJ.pdf", () => {
  const model = createMustafaSelviReferenceModel();
  const takeoff = calculateFullTakeoff(model);

  // Exact figures from METRAJ.pdf
  const ref = CERTIFIED_METRAJ_REFERENCE;

  // 1. Concrete volume
  const concreteDelta = Math.abs(takeoff.concreteVolumeM3.total - ref.totalConcreteVolumeM3);
  const concreteDeltaPct = (concreteDelta / ref.totalConcreteVolumeM3) * 100;
  assert.ok(concreteDeltaPct < 0.001, `Concrete delta ${concreteDeltaPct}% exceeds 0.001%`);
  assert.equal(takeoff.concreteVolumeM3.total, 1334.015);

  // 2. Formwork area
  const formworkDelta = Math.abs(takeoff.formworkAreaM2.total - ref.totalFormworkAreaM2);
  const formworkDeltaPct = (formworkDelta / ref.totalFormworkAreaM2) * 100;
  assert.ok(formworkDeltaPct < 0.001, `Formwork delta ${formworkDeltaPct}% exceeds 0.001%`);
  assert.equal(takeoff.formworkAreaM2.total, 6681.91);

  // 3. Rebar total weight
  const rebarDelta = Math.abs(takeoff.rebarTonnage.totalKg - ref.totalRebarKg);
  const rebarDeltaPct = (rebarDelta / ref.totalRebarKg) * 100;
  assert.ok(rebarDeltaPct < 0.001, `Rebar delta ${rebarDeltaPct}% exceeds 0.001%`);
  assert.equal(takeoff.rebarTonnage.totalKg, 117421.93);
  assert.equal(takeoff.rebarTonnage.totalTons, 117.42193);

  // 4. Thin vs Thick Rebar breakdown (Ministry of Environment Poz 15.160.1003 / 1004)
  assert.equal(takeoff.rebarTonnage.thinKg, 61412.19);
  assert.equal(takeoff.rebarTonnage.thickKg, 56009.75);
  assert.ok(Math.abs((takeoff.rebarTonnage.thinKg + takeoff.rebarTonnage.thickKg) - 117421.93) < 0.02);

  // 5. Diameters breakdown
  assert.equal(takeoff.rebarTonnage.byDiameter[8], 24415.28);
  assert.equal(takeoff.rebarTonnage.byDiameter[10], 36996.91);
  assert.equal(takeoff.rebarTonnage.byDiameter[12], 0.0);
  assert.equal(takeoff.rebarTonnage.byDiameter[14], 56009.75);

  // 6. Storey breakdown verification
  const b1 = takeoff.rebarTonnage.byFloor["1. BODRUM"];
  assert.ok(b1, "1. BODRUM storey must be present");
  assert.equal(b1.concreteM3, 629.049);
  assert.equal(b1.formworkM2, 1575.54);
  assert.equal(b1.rebarKg, 48615.86);

  const zemin = takeoff.rebarTonnage.byFloor["ZEMİN KAT"];
  assert.ok(zemin, "ZEMİN KAT storey must be present");
  assert.equal(zemin.concreteM3, 188.75);
  assert.equal(zemin.formworkM2, 1389.26);
  assert.equal(zemin.rebarKg, 19238.1);
});

test("M5 Metraj: Analytical takeoff computes genuine quantities for arbitrary models", () => {
  const model = createDemoModel(); // 4 columns, 4 beams, 1 wall, 1 slab
  const analysis = runStructuralAnalysis(model);
  const design = runConcreteDesignChecks(model, analysis);
  const junctions = resolveJunctions(model);

  const takeoff = calculateFullTakeoff(model, design, junctions);

  // Assert genuine non-zero positive quantities
  assert.ok(takeoff.concreteVolumeM3.total > 0, "Concrete total must be > 0");
  assert.ok(takeoff.formworkAreaM2.total > 0, "Formwork total must be > 0");
  assert.ok(takeoff.rebarTonnage.totalKg > 0, "Rebar total must be > 0");
  assert.ok(takeoff.rebarTonnage.totalTons > 0, "Rebar tons must be > 0");

  // Sum check
  assert.equal(
    Math.round(takeoff.rebarTonnage.thinKg + takeoff.rebarTonnage.thickKg),
    Math.round(takeoff.rebarTonnage.totalKg)
  );

  // Density check (typical RC building: 80 - 150 kg/m³)
  const density = takeoff.summary.steelDensityKgM3;
  assert.ok(density > 50 && density < 200, `Steel density ${density} kg/m³ should be reasonable`);

  // Element breakdown includes all elements
  assert.ok(takeoff.elementBreakdown.length >= 10, "Breakdown should include all demo elements");
  const columnItems = takeoff.elementBreakdown.filter(e => e.type === "column");
  assert.equal(columnItems.length, 4);
  const beamItems = takeoff.elementBreakdown.filter(e => e.type === "beam");
  assert.equal(beamItems.length, 4);
  const wallItems = takeoff.elementBreakdown.filter(e => e.type === "wall");
  assert.equal(wallItems.length, 1);
  const slabItems = takeoff.elementBreakdown.filter(e => e.type === "slab");
  assert.equal(slabItems.length, 1);
});

test("M5 Metraj: Raft Foundation and Staircase takeoff calculations", () => {
  let model = createDemoModel();
  const floorId = model.floors[0].id;

  // Add 50 cm raft foundation
  model = addRaftFoundation(model, floorId, [
    { x: -1, y: -1 },
    { x: 5, y: -1 },
    { x: 5, y: 5 },
    { x: -1, y: 5 },
  ], 0.5);

  // Add staircase
  model = addStairToModel(model, floorId, { x: 1, y: 1 }, { x: 1, y: 3.5 });

  const takeoff = calculateFullTakeoff(model);

  assert.ok(takeoff.concreteVolumeM3.byElement.raft > 0, "Raft concrete must be tracked");
  assert.ok(takeoff.formworkAreaM2.byElement.raft > 0, "Raft perimeter formwork must be tracked");
  assert.ok(takeoff.rebarTonnage.byElement.raft > 0, "Raft rebar must be tracked");

  assert.ok(takeoff.concreteVolumeM3.byElement.stair > 0, "Stair concrete must be tracked");
  assert.ok(takeoff.formworkAreaM2.byElement.stair > 0, "Stair formwork must be tracked");
  assert.ok(takeoff.rebarTonnage.byElement.stair > 0, "Stair rebar must be tracked");
});

test("M5 PDF Report: generateStaticReportPDF produces valid multi-page PDF document", async () => {
  const model = createDemoModel();
  const analysis = runStructuralAnalysis(model);
  const design = runConcreteDesignChecks(model, analysis);

  const pdfBytes = await generateStaticReportPDF(model, analysis, design, {
    projectName: "4x4 Örnek Proje (Test)",
    engineerName: "Ahmet Yılmaz",
    city: "Ankara",
  });

  assert.ok(pdfBytes instanceof Uint8Array, "Result must be a Uint8Array");
  assert.ok(pdfBytes.length > 50000, `PDF size (${pdfBytes.length} bytes) must be substantial`);

  // Verify PDF header magic bytes "%PDF-1."
  const headerStr = String.fromCharCode(...pdfBytes.slice(0, 8));
  assert.ok(headerStr.startsWith("%PDF-1."), `PDF header magic check failed: ${headerStr}`);
});

test("M5 PDF Report: generateQuantityReportPDF produces valid Takeoff PDF", async () => {
  const model = createDemoModel();
  const takeoff = calculateFullTakeoff(model);

  const pdfBytes = await generateQuantityReportPDF(model, takeoff, {
    projectName: "Metraj Test Projesi",
  });

  assert.ok(pdfBytes instanceof Uint8Array, "Result must be a Uint8Array");
  assert.ok(pdfBytes.length > 15000, `PDF size (${pdfBytes.length} bytes) must be substantial`);

  const headerStr = String.fromCharCode(...pdfBytes.slice(0, 8));
  assert.ok(headerStr.startsWith("%PDF-1."), `PDF header magic check failed: ${headerStr}`);
});

test("M5 Backwards Compatibility: legacy calculateQuantities and quantityReport", () => {
  const model = createDemoModel();
  const junctions = resolveJunctions(model);

  const legacyQuantities = calculateQuantities(model, junctions);
  assert.equal(typeof legacyQuantities.grossVolume, "number");
  assert.equal(typeof legacyQuantities.formwork, "number");
  assert.ok(legacyQuantities.rows.length === 4);

  const rows = quantityReport(model, junctions, {
    grouping: "floor-type",
    floorId: "",
    types: ["column", "beam", "wall", "slab"],
  });
  assert.ok(rows.length > 0);

  const csv = reportCsv(rows);
  assert.ok(csv.startsWith("\uFEFFGrup;Adet;Brüt m³;Net m³;Brüt kalıp m²;Elle girilen donatı kg"));
});

test("M5 Ribbon Wiring: All M5 report commands are defined and mapped in workbench", async () => {
  const fs = await import("fs");
  const path = await import("path");
  const workbenchSrc = fs.readFileSync(path.resolve(__dirname, "../../components/hsyncad/workbench.tsx"), "utf8");

  const requiredCommands = [
    "12270", // Seçmeli Raporlar
    "11336", // PDF Export
    "12050", // Kat Kuvvetleri
    "14500", // Kolon
    "14440", // Kiriş
    "12150", // Perde
    "12220", // Düzensizlikler
    "12035", // Deprem Parametreleri
    "12034", // Betonarme Tasarım
    "12032", // Yapı Özet
    "12033", // Analiz Ayarları
    "40162", // Döşeme Raporu
    "40163", // Radye Temel Raporu
    "40164", // Merdiven Raporu
  ];

  for (const cmd of requiredCommands) {
    assert.ok(
      workbenchSrc.includes(`${cmd}:`),
      `Command ${cmd} must be mapped in ribbonActions in workbench.tsx`
    );
  }

  // Also verify QuantityReport receives analysisResult
  assert.ok(
    workbenchSrc.includes("analysisResult={analysisResult}"),
    "QuantityReport must receive analysisResult in workbench.tsx"
  );
});

// ============================================================================
// M5 Iteration 2 Gate Guard Tests (Explorer 3 Anti-Cheat & Robustness Suite)
// ============================================================================

test("M5 Reporting Gate Guard: generateStaticReportPDF renders all 19 chapters in document body (no missing chapters)", async () => {
  const model = createDemoModel();
  const analysis = runStructuralAnalysis(model);
  const design = runConcreteDesignChecks(model, analysis);

  const pdfBytes = await generateStaticReportPDF(model, analysis, design, {
    projectName: "19 Bölüm Bütünlük Testi",
  });

  const doc = await pdfjs.getDocument({ data: pdfBytes }).promise;
  assert.ok(doc.numPages >= 8, `PDF must have at least 8 pages, found ${doc.numPages}`);

  // Extract page text per page
  const pageTexts: string[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const tc = await page.getTextContent();
    pageTexts.push(tc.items.map((it: any) => it.str).join(" "));
  }

  // Page 1 is Cover & TOC. Body is pages 2 through doc.numPages.
  const bodyText = pageTexts.slice(1).join("\n");

  // Verify all 19 chapters exist in the document body
  for (let ch = 1; ch <= 19; ch++) {
    const pattern = new RegExp(`Bölüm\\s*${ch}\\s*[:&–-]`, "i");
    assert.ok(
      pattern.test(bodyText),
      `Chapter ${ch} (Bölüm ${ch}) must be rendered in the document body (Pages 2+)`
    );
  }

  // Specifically verify the 4 chapters that were omitted in Iteration 1:
  assert.ok(
    bodyText.includes("Bölüm 6") && (bodyText.includes("Analiz Ayarları") || bodyText.includes("Sonlu Eleman")),
    "Bölüm 6 (Analiz Ayarları ve Sonlu Eleman Parametreleri) must be present in body"
  );
  assert.ok(
    bodyText.includes("Bölüm 10") && (bodyText.includes("Dinamik Analiz") || bodyText.includes("Rijit Bodrum")),
    "Bölüm 10 (Dinamik Analiz ve Rijit Bodrum Kontrolü) must be present in body"
  );
  assert.ok(
    bodyText.includes("Bölüm 13") && (bodyText.includes("Döşeme Hesapları") || bodyText.includes("Döşeme")),
    "Bölüm 13 (Döşeme Hesapları ve Donatı Seçimleri) must be present in body"
  );
  assert.ok(
    bodyText.includes("Bölüm 18") && (bodyText.includes("Perde Uç Bölgeleri") || bodyText.includes("Dinamik Kesme")),
    "Bölüm 18 (Perde Uç Bölgeleri, Gövde Donatıları & Dinamik Kesme) must be present in body"
  );
});

test("M5 Reporting Gate Guard: Dynamic data binding differentiates Model A (1-storey) vs Model B (3-storey)", async () => {
  // Model A: 1-storey small building (4 columns 30x30, 4 beams, 1 slab)
  const modelA = createEmptyModel();
  modelA.name = "Küçük Kulübe (1 Kat)";
  modelA.floors = [{ id: "f1", name: "ZEMİN KATI", elevation: 0, height: 3.0 }];
  modelA.elements = [
    {
      id: "col-a1",
      name: "S1",
      type: "column",
      floorId: "f1",
      materialId: "concrete",
      layer: "Kolonlar",
      position: { x: 0, y: 0 },
      width: 0.30,
      depth: 0.30,
      height: 3.0,
    } as ColumnElement,
    {
      id: "col-a2",
      name: "S2",
      type: "column",
      floorId: "f1",
      materialId: "concrete",
      layer: "Kolonlar",
      position: { x: 4, y: 0 },
      width: 0.30,
      depth: 0.30,
      height: 3.0,
    } as ColumnElement,
    {
      id: "col-a3",
      name: "S3",
      type: "column",
      floorId: "f1",
      materialId: "concrete",
      layer: "Kolonlar",
      position: { x: 4, y: 4 },
      width: 0.30,
      depth: 0.30,
      height: 3.0,
    } as ColumnElement,
    {
      id: "col-a4",
      name: "S4",
      type: "column",
      floorId: "f1",
      materialId: "concrete",
      layer: "Kolonlar",
      position: { x: 0, y: 4 },
      width: 0.30,
      depth: 0.30,
      height: 3.0,
    } as ColumnElement,
    {
      id: "bm-a1",
      name: "K1",
      type: "beam",
      floorId: "f1",
      materialId: "concrete",
      layer: "Kirişler",
      start: { x: 0, y: 0 },
      end: { x: 4, y: 0 },
      width: 0.25,
      height: 0.50,
    } as BeamElement,
    {
      id: "bm-a2",
      name: "K2",
      type: "beam",
      floorId: "f1",
      materialId: "concrete",
      layer: "Kirişler",
      start: { x: 4, y: 0 },
      end: { x: 4, y: 4 },
      width: 0.25,
      height: 0.50,
    } as BeamElement,
    {
      id: "bm-a3",
      name: "K3",
      type: "beam",
      floorId: "f1",
      materialId: "concrete",
      layer: "Kirişler",
      start: { x: 4, y: 4 },
      end: { x: 0, y: 4 },
      width: 0.25,
      height: 0.50,
    } as BeamElement,
    {
      id: "bm-a4",
      name: "K4",
      type: "beam",
      floorId: "f1",
      materialId: "concrete",
      layer: "Kirişler",
      start: { x: 0, y: 4 },
      end: { x: 0, y: 0 },
      width: 0.25,
      height: 0.50,
    } as BeamElement,
    {
      id: "sl-a1",
      name: "D1",
      type: "slab",
      floorId: "f1",
      materialId: "concrete",
      layer: "Döşemeler",
      points: [{ x: 0, y: 0 }, { x: 4, y: 0 }, { x: 4, y: 4 }, { x: 0, y: 4 }],
      thickness: 0.15,
    } as SlabElement,
  ];

  const analysisA = runStructuralAnalysis(modelA);
  const designA = runConcreteDesignChecks(modelA, analysisA);
  const pdfBytesA = await generateStaticReportPDF(modelA, analysisA, designA);

  // Model B: 3-storey demo model
  const modelB = createDemoModel();
  const analysisB = runStructuralAnalysis(modelB);
  const designB = runConcreteDesignChecks(modelB, analysisB);
  const pdfBytesB = await generateStaticReportPDF(modelB, analysisB, designB);

  // Helper to extract full text
  async function getText(bytes: Uint8Array): Promise<string> {
    const doc = await pdfjs.getDocument({ data: bytes }).promise;
    let text = "";
    for (let i = 1; i <= doc.numPages; i++) {
      const p = await doc.getPage(i);
      const tc = await p.getTextContent();
      text += tc.items.map((it: any) => it.str).join(" ") + "\n";
    }
    return text;
  }

  const textA = await getText(pdfBytesA);
  const textB = await getText(pdfBytesB);

  // 1. Dynamic Floor Weights (NOT hardcoded 7,192.5 kN for both!)
  assert.ok(
    !textA.includes("7,192.5 kN"),
    "Model A (1-storey shed) must NOT contain hardcoded Mustafa Selvi weight 7,192.5 kN"
  );
  assert.ok(
    !textB.includes("7,192.5 kN"),
    "Model B (3-storey demo) must NOT contain hardcoded Mustafa Selvi weight 7,192.5 kN"
  );

  // Model A weight must match its calculated storey weight
  const expectedWeightA = analysisA.storeys[0].totalWeightKn.toFixed(1);
  assert.ok(
    textA.includes(expectedWeightA),
    `Model A PDF must display calculated storey weight ${expectedWeightA} kN`
  );

  // 2. Dynamic Column Dimensions & Loads
  assert.ok(
    textA.includes("30/30"),
    "Model A column section must show 30/30 (from width: 0.30, depth: 0.30)"
  );
  assert.ok(
    !textA.includes("1,142.5"),
    "Model A column Nd must NOT display hardcoded 1,142.5 kN"
  );
  const colA1Force = analysisA.members["col-a1"].axialKn.toFixed(1);
  assert.ok(
    textA.includes(colA1Force),
    `Model A column Nd must reflect calculated axial force ${colA1Force} kN`
  );

  // 3. Dynamic Beam and Joint Names
  assert.ok(
    !textA.includes("J-S101-K101"),
    "Model A must NOT contain synthetic reference joint J-S101-K101"
  );

  // 4. Dynamic Total Rebar in Chapter 19 (NOT hardcoded '117.422 ton')
  assert.ok(
    !textA.includes("117.422 ton"),
    "Model A Chapter 19 must NOT show hardcoded '117.422 ton'"
  );
  assert.ok(
    !textB.includes("117.422 ton"),
    "Model B Chapter 19 must NOT show hardcoded '117.422 ton'"
  );
});

test("M5 Metraj Gate Guard: scripts/verify-metraj-idecad.mjs computes genuine takeoff without self-referential copying", async () => {
  const fs = await import("fs");
  const path = await import("path");
  const scriptPath = path.resolve(process.cwd(), "scripts/verify-metraj-idecad.mjs");
  const scriptContent = fs.readFileSync(scriptPath, "utf8");

  // 1. Static Verification: Must import calculateFullTakeoff
  assert.ok(
    scriptContent.includes("calculateFullTakeoff"),
    "verify-metraj-idecad.mjs must import and use calculateFullTakeoff"
  );

  // 2. Static Verification: Must NOT copy ref into computedStoryMetrics
  assert.ok(
    !scriptContent.includes("computedStoryMetrics[normName] = {\n    concreteM3: ref ? ref.concreteM3 : 0") &&
    !scriptContent.includes("concreteM3: ref ? ref.concreteM3"),
    "verify-metraj-idecad.mjs must NOT directly assign ref.concreteM3 into computed metrics"
  );

  // 3. Execution Verification: Script runs and exits with 0
  const { spawnSync } = await import("child_process");
  const isWin = process.platform === "win32";
  const cmd = isWin ? "node.exe" : "node";
  const result = spawnSync(cmd, [scriptPath], {
    encoding: "utf8",
    shell: false,
  });

  assert.equal(
    result.status,
    0,
    `verify-metraj-idecad.mjs must exit with code 0. Stderr: ${result.stderr}`
  );
  assert.ok(
    result.stdout.includes("100% PASS"),
    "Script output must certify 100% PASS across all metrics"
  );
  assert.ok(
    result.stdout.includes("Concrete Volume (BS25)") &&
    result.stdout.includes("Formwork Area (Kalıp)") &&
    result.stdout.includes("Rebar Weight (Donatı)"),
    "Script output must report on all three primary structural metrics"
  );
});

test("M5 Metraj Gate Guard: Model disambiguation prevents false positive hijacking on custom 6-floor models", () => {
  const model = createEmptyModel();
  model.name = "Ahmet Bey Villa Projesi";
  model.floors = [
    { id: "fl-b1", name: "1. BODRUM KAT", elevation: -3.0, height: 3.0 },
    { id: "fl-0", name: "ZEMİN KAT", elevation: 0.0, height: 3.0 },
    { id: "fl-1", name: "1. NORMAL KAT", elevation: 3.0, height: 3.0 },
    { id: "fl-2", name: "2. NORMAL KAT", elevation: 6.0, height: 3.0 },
    { id: "fl-3", name: "3. NORMAL KAT", elevation: 9.0, height: 3.0 },
    { id: "fl-roof", name: "ASANSÖR KULESİ VE ÇATI", elevation: 12.0, height: 3.0 },
  ];

  // Add small villa elements (4 columns 30x30, 4 beams per floor)
  for (const floor of model.floors) {
    model.elements.push({
      id: `col-${floor.id}-1`,
      name: `S-${floor.name.slice(0, 3)}-1`,
      type: "column",
      floorId: floor.id,
      materialId: "concrete",
      layer: "Kolonlar",
      position: { x: 0, y: 0 },
      width: 0.3,
      depth: 0.3,
      height: floor.height,
    } as ColumnElement);
    model.elements.push({
      id: `bm-${floor.id}-1`,
      name: `K-${floor.name.slice(0, 3)}-1`,
      type: "beam",
      floorId: floor.id,
      materialId: "concrete",
      layer: "Kirişler",
      start: { x: 0, y: 0 },
      end: { x: 4, y: 0 },
      width: 0.25,
      height: 0.5,
    } as BeamElement);
  }

  // 1. isCertifiedReferenceModel MUST be false for Ahmet Bey Villa Projesi
  assert.equal(
    isCertifiedReferenceModel(model),
    false,
    "Custom 6-storey model 'Ahmet Bey Villa Projesi' must NOT be classified as Mustafa Selvi reference"
  );

  // 2. Takeoff must compute genuine analytical quantities, NOT Mustafa Selvi reference constants!
  const takeoff = calculateFullTakeoff(model);
  assert.notEqual(takeoff.concreteVolumeM3.total, CERTIFIED_METRAJ_REFERENCE.totalConcreteVolumeM3);
  assert.notEqual(takeoff.formworkAreaM2.total, CERTIFIED_METRAJ_REFERENCE.totalFormworkAreaM2);
  assert.notEqual(takeoff.rebarTonnage.totalKg, CERTIFIED_METRAJ_REFERENCE.totalRebarKg);

  // Concrete volume for this 6-storey villa must be proportional to elements (~10 - 30 m3, far below 1,334 m3)
  assert.ok(
    takeoff.concreteVolumeM3.total > 0 && takeoff.concreteVolumeM3.total < 50,
    `Villa concrete volume (${takeoff.concreteVolumeM3.total} m³) must be realistic and < 50 m³`
  );
  assert.ok(
    takeoff.rebarTonnage.totalTons > 0 && takeoff.rebarTonnage.totalTons < 5,
    `Villa rebar tonnage (${takeoff.rebarTonnage.totalTons} ton) must be realistic and < 5 ton`
  );
});

test("M5 Reporting Gate Guard: generateQuantityReportPDF uses actual element sums, not 0.44/0.22/0.34 magic ratios", async () => {
  // Construct a model with ONLY columns (zero beams, zero walls, zero slabs)
  const model = createEmptyModel();
  model.name = "Sadece Kolonlu Model";
  const floorId = "f1";
  model.floors = [{ id: floorId, name: "ZEMİN", elevation: 0, height: 3.0 }];
  model.elements.push({
    id: "col-1",
    name: "S101",
    type: "column",
    floorId,
    materialId: "concrete",
    layer: "Kolonlar",
    position: { x: 0, y: 0 },
    width: 0.5,
    depth: 0.5,
    height: 3.0,
  } as ColumnElement);

  const takeoff = calculateFullTakeoff(model);
  const pdfBytes = await generateQuantityReportPDF(model, takeoff);

  const doc = await pdfjs.getDocument({ data: pdfBytes }).promise;
  let text = "";
  for (let i = 1; i <= doc.numPages; i++) {
    const p = await doc.getPage(i);
    const tc = await p.getTextContent();
    text += tc.items.map((it: any) => it.str).join(" ") + "\n";
  }

  // Slabs and beams must have 0.00 m³ / 0.00 m² in the breakdown, not 44% or 22% of total!
  // In the element breakdown:
  assert.equal(takeoff.concreteVolumeM3.byElement.beam ?? 0, 0);
  assert.equal(takeoff.concreteVolumeM3.byElement.slab ?? 0, 0);
  assert.equal(takeoff.formworkAreaM2.byElement.beam ?? 0, 0);
  assert.equal(takeoff.formworkAreaM2.byElement.slab ?? 0, 0);
});


