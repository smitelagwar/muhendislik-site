import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  generateProjectPaftas,
  SHEET_SIZES,
  buildColumnSchedule,
  buildRebarSchedule,
  STANDARD_ENGINEERING_NOTES,
  STANDARD_CONCRETE_COVERS,
} from "./pafta-engine";
import { exportPaftaToDxf } from "./pafta-dxf";
import { createSevenStoreyCommercialBuilding } from "./seven-storey-demo";


describe("hsynCAD ideCAD-Style Professional Pafta Engine", () => {
  it("defines standard Turkish civil engineering sheet sizes correctly", () => {
    assert.equal(SHEET_SIZES["Roll-90x210"].widthMm, 2100);
    assert.equal(SHEET_SIZES["Roll-90x210"].heightMm, 900);
    assert.equal(SHEET_SIZES["Roll-90x210"].marginLeftMm, 25); // 25mm binding margin

    assert.equal(SHEET_SIZES["A0"].widthMm, 1189);
    assert.equal(SHEET_SIZES["A0"].heightMm, 841);
    assert.equal(SHEET_SIZES["A1"].widthMm, 841);
    assert.equal(SHEET_SIZES["A1"].heightMm, 594);
  });

  it("builds detailed column and shear wall schedule (Kolon Donatı Tablosu)", () => {
    const model = createSevenStoreyCommercialBuilding();
    const schedule = buildColumnSchedule(model);

    assert.ok(schedule.length > 0, "Schedule must contain elements");

    // Must contain both columns and shear walls
    const cols = schedule.filter(s => s.type === "column");
    const walls = schedule.filter(s => s.type === "wall");
    assert.ok(cols.length >= 8, "Expected at least 8 column types");
    assert.ok(walls.length >= 2, "Expected shear core wall types");

    // Check rebar callout format (e.g. 10Φ14, 16Φ20, Φ8/10-15)
    for (const c of cols) {
      assert.match(c.colNo, /^[S|P]/, "Column number should start with S or P");
      assert.match(c.sectionDimensions, /^\d+\/\d+$/, "Dimensions should be width/depth in cm");
      assert.match(c.longitudinalRebar, /\d+Φ\d+/, "Longitudinal rebar format invalid");
      assert.match(c.stirrupRebar, /Φ8/, "Stirrups should be Φ8");
      assert.ok(c.confinementHeightCm >= 50, "Confinement height must be at least 50 cm");
    }

    for (const w of walls) {
      assert.match(w.longitudinalRebar, /Gövde Donatısı/, "Shear wall must have web rebar");
      assert.match(w.stirrupRebar, /Çiroz/, "Shear wall must have cross-ties (çiroz)");
    }
  });

  it("calculates comprehensive project rebar takeoff schedule", () => {
    const model = createSevenStoreyCommercialBuilding();
    const takeoff = buildRebarSchedule(model);

    assert.ok(takeoff.length >= 6, "Expected at least 6 rebar groups");

    // Must calculate total steel weight > 0
    const totalSteelKg = takeoff.reduce((sum, item) => sum + item.totalWeightKg, 0);
    assert.ok(totalSteelKg > 10000, `Expected multi-ton rebar takeoff for 7-storey plaza, got ${totalSteelKg} kg`);

    // Verify diameters present (Φ8, Φ12, Φ14, Φ16, Φ18)
    const diameters = new Set(takeoff.map(t => t.diameterMm));
    assert.ok(diameters.has(8), "Expected Φ8 for stirrups");
    assert.ok(diameters.has(16) || diameters.has(18), "Expected Φ16 or Φ18 for columns/beams");
    assert.ok(takeoff.every(row => row.element.startsWith("Taslak ")), "Generated reinforcement must be identified as preliminary");
  });

  it("generates complete multi-sheet pafta suite matching Süheyla Kara standards", () => {
    const model = createSevenStoreyCommercialBuilding();
    const sheets = generateProjectPaftas(model, "Roll-90x210", {
      projectName: "SÜHEYLA KARA STATİK PROJESİ",
      owner: "SÜHEYLA KARA",
      engineerName: "NİZAMETTİN SAMED ÖZER",
    });

    assert.equal(sheets.length, 5, "Expected 5 distinct pafta drawings in the suite");

    const s100 = sheets.find(s => s.sheetNo === "S-100");
    const s01 = sheets.find(s => s.sheetNo === "S-01");
    const s02 = sheets.find(s => s.sheetNo === "S-02");
    const s03 = sheets.find(s => s.sheetNo === "S-03");
    const s04 = sheets.find(s => s.sheetNo === "S-04");

    assert.ok(s100, "Master pafta S-100 must exist");
    assert.ok(s01, "Foundation pafta S-01 must exist");
    assert.ok(s02, "Formwork pafta S-02 must exist");
    assert.ok(s03, "Beam details pafta S-03 must exist");
    assert.ok(s04, "Rebar schedule pafta S-04 must exist");

    assert.equal(s100!.metadata.projectName, "SÜHEYLA KARA STATİK PROJESİ");
    assert.equal(s100!.metadata.owner, "SÜHEYLA KARA");
    assert.equal(s100!.dimensions.widthMm, 2100);
    assert.equal(s100!.dimensions.heightMm, 900);

    // Verify viewports
    assert.ok(s100!.viewports.length >= 3, "S-100 must have plan, column table, and antet viewports");
    assert.ok(s100!.columnSchedule.length > 0, "S-100 must have column schedule");
    assert.ok(s100!.notes.length === STANDARD_ENGINEERING_NOTES.length, "Notes must be included");
    assert.ok(s100!.concreteCovers.length === STANDARD_CONCRETE_COVERS.length, "Covers must be included");
  });

  it("exports valid, fully-formed AutoCAD ASCII DXF sheet", () => {
    const model = createSevenStoreyCommercialBuilding();
    const sheets = generateProjectPaftas(model, "Roll-90x210");
    const s100 = sheets[0];

    const dxf = exportPaftaToDxf(s100, model);

    // Basic structure
    assert.ok(dxf.includes("SECTION\r\n2\r\nHEADER"), "DXF missing HEADER section");
    assert.ok(dxf.includes("SECTION\r\n2\r\nTABLES"), "DXF missing TABLES section");
    assert.ok(dxf.includes("SECTION\r\n2\r\nBLOCKS"), "DXF missing BLOCKS section");
    assert.ok(dxf.includes("SECTION\r\n2\r\nENTITIES"), "DXF missing ENTITIES section");
    assert.ok(dxf.endsWith("0\r\nEOF"), "DXF must terminate with 0 EOF");

    // Standard engineering layers
    assert.ok(dxf.includes("SINIR_CIZGILERI"), "Missing SINIR_CIZGILERI layer");
    assert.ok(dxf.includes("ANTET"), "Missing ANTET layer");
    assert.ok(dxf.includes("TABLOLAR"), "Missing TABLOLAR layer");
    assert.ok(dxf.includes("AKSLAR"), "Missing AKSLAR layer");
    assert.ok(dxf.includes("KOLONLAR"), "Missing KOLONLAR layer");
    assert.ok(dxf.includes("PERDELER"), "Missing PERDELER layer");
    assert.ok(dxf.includes("DOSEMELER"), "Missing DOSEMELER layer");

    // Key text labels in DXF
    assert.ok(dxf.includes("T.C. İSTANBUL VALİLİĞİ"), "Missing municipality banner");
    assert.ok(dxf.includes("DEPREM VE ZEMİN HESAP PARAMETRELERİ"), "Missing seismic parameter title");
    assert.ok(dxf.includes("KOLON VE PERDE DONATI TABLOSU"), "Missing column schedule title");
    assert.ok(dxf.includes("NET BETON ÖRTÜLERİ"), "Missing concrete covers title");
    assert.ok(dxf.includes("S-100"), "Missing sheet number S-100");
  });
});
