import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

import {
  generateExplicitProjectReport,
  evaluateBeam,
  type BeamDesignDefinition,
  type ExplicitProjectReportInput
} from "../../src/lib/hsyncad/reporting/explicit-project-report.js";
import {
  renderReportDocumentToPdf
} from "../../src/lib/hsyncad/reporting/pdf-renderer.js";
import {
  validateReportDocument,
  type ReportDocument
} from "../../src/lib/hsyncad/reporting/report-document.js";
import {
  createStraightSegment,
  createCenterlineGeometry,
  type BarInput
} from "../../src/lib/hsyncad/structural/reinforcement-schedule.js";

const RHO_STEEL = 7850; // kg/m^3

function createSampleBeam(id = "K101", spanM = 5.0): BeamDesignDefinition {
  return {
    id,
    floorId: "1F",
    spanM,
    bwMm: 250,
    hMm: 500,
    coverMm: 40,
    fck: 25,
    fyk: 420,
    stirrupDiameterMm: 8,
    stirrupSpacingMm: 150,
    stirrupLegs: 2,
    designMoments: {
      mEdSpanKnm: 65,
      mEdLeftSupportKnm: 85,
      mEdRightSupportKnm: 85
    },
    designShearVEdKn: 55,
    axialNEdKn: 0,
    crossSectionBars: [
      { id: `${id}-b1`, x: -60, y: 40, diameter: 16, face: "bottom" },
      { id: `${id}-b2`, x: 60, y: 40, diameter: 16, face: "bottom" },
      { id: `${id}-t1`, x: -60, y: 460, diameter: 12, face: "top" },
      { id: `${id}-t2`, x: 60, y: 460, diameter: 12, face: "top" }
    ]
  };
}

function createSampleBars(beamId = "K101", rev = "REV-2026-01"): BarInput[] {
  const geomBottom = createCenterlineGeometry([
    createStraightSegment([0, 0, 0], [5.0, 0, 0])
  ]);
  const geomTop = createCenterlineGeometry([
    createStraightSegment([0, 0, 0], [5.0, 0, 0])
  ]);

  return [
    {
      id: `bar-${beamId}-bot`,
      elementId: beamId,
      floorId: "1F",
      elementType: "beam",
      role: "main_bottom",
      materialId: "B420C",
      diameterMm: 16,
      count: 2,
      steelDensityKgPerM3: RHO_STEEL,
      geometry: geomBottom,
      mode: "verification",
      layoutRevisionId: rev
    },
    {
      id: `bar-${beamId}-top`,
      elementId: beamId,
      floorId: "1F",
      elementType: "beam",
      role: "main_top",
      materialId: "B420C",
      diameterMm: 12,
      count: 2,
      steelDensityKgPerM3: RHO_STEEL,
      geometry: geomTop,
      mode: "verification",
      layoutRevisionId: rev
    }
  ];
}

test("P16: End-to-end structural report generation produces multi-page PDF with %PDF- header", () => {
  const input: ExplicitProjectReportInput = {
    projectName: "İSTANBUL KADIKÖY KONUT PROJESİ",
    revisionId: "REV-2026-01",
    engineerName: "İnş. Müh. Hüseyin Demir",
    organization: "Luna Mühendislik Müşavirlik Ltd.",
    beams: [createSampleBeam("K101"), createSampleBeam("K102")],
    rebarInputs: [...createSampleBars("K101"), ...createSampleBars("K102")]
  };

  const result = generateExplicitProjectReport(input);

  assert.ok(result.renderResult.pdfBytes.byteLength > 10000, "PDF bytes should be substantial");
  const header = Buffer.from(result.renderResult.pdfBytes.slice(0, 5)).toString("utf-8");
  assert.equal(header, "%PDF-", "PDF header must match standard magic bytes");
  assert.ok(result.renderResult.pageCount >= 4, "Report must be a multi-page document");

  // Document validation
  validateReportDocument(result.document);
  assert.equal(result.document.metadata.projectName, input.projectName);
  assert.equal(result.document.sections[0].id, "sec-cover");
  assert.equal(result.document.sections[1].id, "sec-toc");
});

test("P16: Two-pass pagination maps TOC entries accurately to section start pages", () => {
  const input: ExplicitProjectReportInput = {
    projectName: "ANKARA ÇANKAYA İŞ MERKEZİ",
    revisionId: "REV-2026-02",
    engineerName: "İnş. Müh. Elif Kaya",
    beams: [createSampleBeam("K101"), createSampleBeam("K102"), createSampleBeam("K103")],
    rebarInputs: [
      ...createSampleBars("K101", "REV-2026-02"),
      ...createSampleBars("K102", "REV-2026-02"),
      ...createSampleBars("K103", "REV-2026-02")
    ]
  };

  const result = generateExplicitProjectReport(input);
  const secPages = result.renderResult.sectionPages;

  assert.equal(secPages["sec-cover"], 1, "Cover page must start at page 1");
  assert.equal(secPages["sec-toc"], 2, "TOC page must start at page 2");
  assert.ok(secPages["sec-readiness"] >= 3, "Readiness must follow TOC");
  assert.ok(secPages["sec-calc-beams"] >= secPages["sec-readiness"]);
  assert.ok(secPages["sec-rebar-schedule"] >= secPages["sec-calc-beams"]);
  assert.ok(secPages["sec-appendix"] >= secPages["sec-rebar-schedule"]);

  // Write temporary PDF and use pdftotext to verify TOC content
  const tempPdfPath = path.join(process.cwd(), "temp-test-toc.pdf");
  fs.writeFileSync(tempPdfPath, Buffer.from(result.renderResult.pdfBytes));

  try {
    const textOut = execSync(`pdftotext "${tempPdfPath}" -`, { encoding: "utf-8" });
    assert.match(textOut, /İÇİNDEKİLER/);
    assert.match(textOut, /PROJE KAPSAMI VE HESAP DURUMU/);
    assert.match(textOut, /BETONARME KİRİŞ TAHKİKLERİ VE KAPASİTE HESAPLARI/);
    assert.match(textOut, /DONATI METRAJI VE MALZEME İCMALİ/);
    assert.match(textOut, /EKLER: KAPSAM, METODOLOJİ VE SINIRLAMALAR/);
  } finally {
    if (fs.existsSync(tempPdfPath)) {
      fs.unlinkSync(tempPdfPath);
    }
  }
});

test("P16: Input bar modification cleanly alters reinforcement schedule mass in PDF output", () => {
  const rev = "REV-2026-MUTATION";

  // Case A: 2 x Ø16 bars (A = 201.06 mm2 per bar)
  const inputA: ExplicitProjectReportInput = {
    projectName: "DEĞİŞİM TESTİ A",
    revisionId: rev,
    engineerName: "Mühendis Test",
    beams: [createSampleBeam("K101")],
    rebarInputs: createSampleBars("K101", rev)
  };
  const resultA = generateExplicitProjectReport(inputA);
  const massA = resultA.reinforcementSchedule.knownMassKg;

  // Case B: 4 x Ø16 bars for bottom
  const barsB = createSampleBars("K101", rev);
  barsB[0].count = 4; // double bottom count
  const inputB: ExplicitProjectReportInput = {
    projectName: "DEĞİŞİM TESTİ B",
    revisionId: rev,
    engineerName: "Mühendis Test",
    beams: [createSampleBeam("K101")],
    rebarInputs: barsB
  };
  const resultB = generateExplicitProjectReport(inputB);
  const massB = resultB.reinforcementSchedule.knownMassKg;

  assert.ok(massB > massA, `Mutated bar count must increase mass: ${massB} > ${massA}`);

  // Difference: 2 additional Ø16 bars of 5m: 2 * (pi * 0.016^2 / 4) * 7850 * 5 = 15.783 kg
  const expectedDiff = 2 * (Math.PI * 0.016 * 0.016 / 4) * 7850 * 5.0;
  assert.ok(Math.abs((massB - massA) - expectedDiff) < 1e-4, "Mass difference must match physical density formula");
});

test("P16: Revision mismatch between rebar input and project is strictly rejected", () => {
  const input: ExplicitProjectReportInput = {
    projectName: "REVISION MISMATCH TEST",
    revisionId: "REV-ACTIVE-05",
    engineerName: "Mühendis",
    beams: [createSampleBeam("K101")],
    rebarInputs: createSampleBars("K101", "REV-STALE-OLD") // Mismatched revision
  };

  assert.throws(
    () => generateExplicitProjectReport(input),
    /Revision mismatch/
  );
});

test("P16: Unsupported elements are visibly flagged without fabricating PASS status", () => {
  const beamUnsupported: BeamDesignDefinition = {
    ...createSampleBeam("K999"),
    unsupportedStatus: "unsupported"
  };

  const input: ExplicitProjectReportInput = {
    projectName: "KAPSAM DIŞI ELEMAN TESTİ",
    revisionId: "REV-2026-UNSUP",
    engineerName: "Mühendis",
    beams: [createSampleBeam("K101"), beamUnsupported],
    rebarInputs: createSampleBars("K101", "REV-2026-UNSUP"),
    unsupportedFeatures: ["K999: Özel mafsallı açıklık geometrisi analitik profil dışındadır."]
  };

  const result = generateExplicitProjectReport(input);

  const k999Summary = result.beamSummaries.find((b) => b.elementId === "K999");
  assert.ok(k999Summary);
  assert.equal(k999Summary.status, "unsupported");
  assert.notEqual(result.document.metadata.reviewStatus, "onayli");

  // Check PDF text output to confirm KAPSAM DIŞI is printed
  const tempPdfPath = path.join(process.cwd(), "temp-test-unsup.pdf");
  fs.writeFileSync(tempPdfPath, Buffer.from(result.renderResult.pdfBytes));

  try {
    const textOut = execSync(`pdftotext "${tempPdfPath}" -`, { encoding: "utf-8" });
    assert.match(textOut, /KAPSAM DIŞI/);
  } finally {
    if (fs.existsSync(tempPdfPath)) {
      fs.unlinkSync(tempPdfPath);
    }
  }
});

test("P16: Turkish characters render with full fidelity and extract cleanly", () => {
  const input: ExplicitProjectReportInput = {
    projectName: "TÜRKÇE KARAKTER DOĞRULAMA PROJESİ (ĞŞİÖÜçşğüöı)",
    revisionId: "REV-TURKISH",
    engineerName: "İnş. Yük. Müh. Çağlar Şentürk",
    organization: "Özgür Çözüm Mühendisliği",
    buildingType: "Konut ve Ticari İşyeri Yapısı",
    beams: [createSampleBeam("K101")],
    rebarInputs: createSampleBars("K101", "REV-TURKISH"),
    customScopeNotes: [
      "TS 500 ve TBDY 2018 uyarınca donatı açılımı ve bindirme boyu tahkiki yapılmıştır.",
      "Açıklık ve mesnetlerde sünek tasarım ilkelerine riayet edilmiştir."
    ]
  };

  const result = generateExplicitProjectReport(input);
  const tempPdfPath = path.join(process.cwd(), "temp-test-turkish.pdf");
  fs.writeFileSync(tempPdfPath, Buffer.from(result.renderResult.pdfBytes));

  try {
    const textOut = execSync(`pdftotext "${tempPdfPath}" -`, { encoding: "utf-8" });
    assert.match(textOut, /Çağlar Şentürk/);
    assert.match(textOut, /Özgür Çözüm/);
    assert.match(textOut, /İÇİNDEKİLER/);
    assert.match(textOut, /TAHKİKLERİ/);
    assert.match(textOut, /İCMALİ/);
  } finally {
    if (fs.existsSync(tempPdfPath)) {
      fs.unlinkSync(tempPdfPath);
    }
  }
});

test("P16: Multi-element project with overflowing table wraps across pages and repeats table headers", () => {
  // Generate 25 beams to force multi-page table wrapping in the calculation and schedule sections
  const beams: BeamDesignDefinition[] = [];
  const bars: BarInput[] = [];
  const rev = "REV-PAGINATION-25";

  for (let i = 1; i <= 25; i++) {
    const beamId = `K${100 + i}`;
    beams.push(createSampleBeam(beamId, 4.0 + (i % 3)));
    bars.push(...createSampleBars(beamId, rev));
  }

  const input: ExplicitProjectReportInput = {
    projectName: "ÇOK ELEMANLI YÜKSEK HACİMLİ TABLO WRAP TESTİ",
    revisionId: rev,
    engineerName: "İnş. Müh. Barış Demir",
    beams,
    rebarInputs: bars
  };

  const result = generateExplicitProjectReport(input);
  assert.ok(result.renderResult.pageCount >= 6, "Report with 25 beams must span at least 6 pages");

  const tempPdfPath = path.join(process.cwd(), "temp-test-wrapping.pdf");
  fs.writeFileSync(tempPdfPath, Buffer.from(result.renderResult.pdfBytes));

  try {
    // Read with pdftotext
    const textOut = execSync(`pdftotext "${tempPdfPath}" -`, { encoding: "utf-8" });
    // Both K101 and K125 should be in the document
    assert.match(textOut, /K101/);
    assert.match(textOut, /K125/);
    // Table headers should appear multiple times in the document text because they repeat across pages
    const headerMatches = textOut.match(/Birim kg\/m/g);
    assert.ok(headerMatches && headerMatches.length >= 2, "Table headers must repeat across page boundaries");
  } finally {
    if (fs.existsSync(tempPdfPath)) {
      fs.unlinkSync(tempPdfPath);
    }
  }
});

test("P16: PDF contains internal clickable link annotations for TOC navigation", () => {
  const input: ExplicitProjectReportInput = {
    projectName: "LİNK ANOTASYON DOĞRULAMA PROJESİ",
    revisionId: "REV-LINKS-01",
    engineerName: "İnş. Müh. Deniz Yılmaz",
    beams: [createSampleBeam("K101")],
    rebarInputs: createSampleBars("K101", "REV-LINKS-01")
  };

  const result = generateExplicitProjectReport(input);
  const pdfString = Buffer.from(result.renderResult.pdfBytes).toString("latin1");

  // In PDF specification, clickable annotations contain /Subtype /Link and /Dest or /A << /S /GoTo
  assert.match(pdfString, /\/Subtype\s*\/Link/, "Generated PDF must contain /Subtype /Link annotations for TOC");
});

test("P16: Reinforcement subtotal tables contain authentic barCount numbers rather than missing placeholders", () => {
  const input: ExplicitProjectReportInput = {
    projectName: "SUBTOTAL COUNT VERIFICATION",
    revisionId: "REV-COUNT-01",
    engineerName: "Mühendis Test",
    beams: [createSampleBeam("K101")],
    rebarInputs: createSampleBars("K101", "REV-COUNT-01")
  };

  const result = generateExplicitProjectReport(input);
  const rebarSec = result.document.sections.find((s) => s.id === "sec-rebar-schedule");
  assert.ok(rebarSec, "Rebar schedule section must exist");

  const diaTableBlock = rebarSec.blocks.find(
    (b) => b.type === "table" && b.table.id === "tbl-rebar-diameter-subtotals"
  );
  assert.ok(diaTableBlock && diaTableBlock.type === "table");
  for (const row of diaTableBlock.table.rows) {
    const countVal = row[1];
    assert.notEqual(countVal, "-", "Diameter subtotal count must not be '-'");
    assert.notEqual(countVal, undefined, "Diameter subtotal count must be defined");
    assert.ok(Number(countVal) > 0, "Diameter subtotal count must be positive integer");
  }

  const floorTableBlock = rebarSec.blocks.find(
    (b) => b.type === "table" && b.table.id === "tbl-rebar-floor-subtotals"
  );
  assert.ok(floorTableBlock && floorTableBlock.type === "table");
  for (const row of floorTableBlock.table.rows) {
    const countVal = row[1];
    assert.notEqual(countVal, "-", "Floor subtotal count must not be '-'");
    assert.notEqual(countVal, undefined, "Floor subtotal count must be defined");
    assert.ok(Number(countVal) > 0, "Floor subtotal count must be positive integer");
  }
});

test("P16: Unsupported concrete or steel grade is rejected without silent fallback", () => {
  const badConcreteBeam = {
    ...createSampleBeam("K901"),
    fck: 99 // Unsupported
  };

  const inputConcrete: ExplicitProjectReportInput = {
    projectName: "UNSUPPORTED CONCRETE TEST",
    revisionId: "REV-MAT-01",
    engineerName: "Mühendis",
    beams: [badConcreteBeam],
    rebarInputs: createSampleBars("K901", "REV-MAT-01")
  };

  assert.throws(
    () => generateExplicitProjectReport(inputConcrete),
    /Desteklenmeyen beton sınıfı/
  );

  const badSteelBeam = {
    ...createSampleBeam("K902"),
    fyk: 220 // Unsupported
  };

  const inputSteel: ExplicitProjectReportInput = {
    projectName: "UNSUPPORTED STEEL TEST",
    revisionId: "REV-MAT-02",
    engineerName: "Mühendis",
    beams: [badSteelBeam],
    rebarInputs: createSampleBars("K902", "REV-MAT-02")
  };

  assert.throws(
    () => generateExplicitProjectReport(inputSteel),
    /Desteklenmeyen donatı çeliği sınıfı/
  );
});

test("P16 Engine Bridge: Cross-section and schedule rebar mismatch fails reconciliation and voids total mass", () => {
  const rev = "REV-RECON-MISMATCH";
  // Beam has 2 x Ø16 bottom bars
  const beam = createSampleBeam("K101");
  // Schedule has 3 x Ø16 bottom bars (mismatch!)
  const bars = createSampleBars("K101", rev);
  bars[0].count = 3;

  const input: ExplicitProjectReportInput = {
    projectName: "REBAR RECONCILIATION TEST",
    revisionId: rev,
    engineerName: "Mühendis",
    buildingType: "Konut",
    structuralSystem: "Betonarme Çerçeve",
    soilClass: "ZC",
    earthquakeDts: "DTS-1",
    beams: [beam],
    rebarInputs: bars
  };

  const result = generateExplicitProjectReport(input);
  const k101 = result.beamSummaries.find((b) => b.elementId === "K101");
  assert.ok(k101);

  const reconCheck = k101.checks.find((c) => c.id === "K101-rebar-reconcile");
  assert.ok(reconCheck, "Rebar reconciliation check must exist");
  assert.equal(reconCheck.status, "fail", "Reconciliation check must fail on count mismatch");
  assert.match(reconCheck.observed, /Alt donatı uyumsuz/);

  // When reconciliation fails, totalMassKg must be null (no fabricated equivalence)
  assert.equal(result.reinforcementSchedule.totalMassKg, null);
  assert.equal(result.reinforcementSchedule.isComplete, false);
  assert.equal(result.document.metadata.reviewStatus, "reddedildi");
});

test("P16 Engine Bridge: Missing project metadata is surfaced as BİLİNMİYOR without silent fallback assumptions", () => {
  const input: ExplicitProjectReportInput = {
    projectName: "METADATA GAP AUDIT",
    revisionId: "REV-META-01",
    engineerName: "Mühendis",
    // buildingType, structuralSystem, soilClass, earthquakeDts omitted!
    beams: [createSampleBeam("K101")],
    rebarInputs: createSampleBars("K101", "REV-META-01")
  };

  const result = generateExplicitProjectReport(input);
  const desc = result.document.metadata.buildingDescription;
  assert.ok(desc);
  assert.match(desc.buildingType, /BİLİNMİYOR/);
  assert.match(desc.structuralSystem, /BİLİNMİYOR/);
  assert.match(desc.soilClass, /BİLİNMİYOR/);
  assert.match(desc.earthquakeDts, /BİLİNMİYOR/);

  assert.notEqual(result.document.metadata.reviewStatus, "onayli");
  const readinessSec = result.document.sections.find((s) => s.id === "sec-readiness");
  assert.ok(readinessSec);
});

test("P16 Engine Bridge: User-declared free shear without capacity design derivation is marked unsupported and cannot claim PASS", () => {
  const beamFreeShear = createSampleBeam("K101");
  beamFreeShear.designShearVEdKn = 5.0; // artificially low shear to test that it does not fabricate PASS

  const input: ExplicitProjectReportInput = {
    projectName: "FREE SHEAR PASS PREVENTION",
    revisionId: "REV-SHEAR-01",
    engineerName: "Mühendis",
    buildingType: "Konut",
    structuralSystem: "Betonarme Çerçeve",
    soilClass: "ZC",
    earthquakeDts: "DTS-1",
    beams: [beamFreeShear],
    rebarInputs: createSampleBars("K101", "REV-SHEAR-01")
  };

  const result = generateExplicitProjectReport(input);
  const k101 = result.beamSummaries.find((b) => b.elementId === "K101");
  assert.ok(k101);

  const capCheck = k101.checks.find((c) => c.id === "K101-capacity-shear");
  assert.ok(capCheck, "Capacity shear check must exist");
  assert.equal(capCheck.status, "unsupported", "Capacity shear without derivation must be unsupported");
  assert.notEqual(k101.status, "pass", "Beam cannot pass when capacity shear is unsupported");
});

test("P16 Engine Bridge: Seismic capacity data derivation produces authentic TBDY 7.4.5 capacity shear check", () => {
  const beamWithSeismic = {
    ...createSampleBeam("K101"),
    seismicCapacityData: {
      gravityLeftKn: 40.0,
      gravityRightKn: 40.0,
      amplifiedLeftKn: 90.0,
      amplifiedRightKn: 90.0
    }
  };

  const input: ExplicitProjectReportInput = {
    projectName: "AUTHENTIC CAPACITY SHEAR",
    revisionId: "REV-SEISMIC-01",
    engineerName: "Mühendis",
    buildingType: "Konut",
    structuralSystem: "Betonarme Çerçeve",
    soilClass: "ZC",
    earthquakeDts: "DTS-1",
    beams: [beamWithSeismic],
    rebarInputs: createSampleBars("K101", "REV-SEISMIC-01")
  };

  const result = generateExplicitProjectReport(input);
  const k101 = result.beamSummaries.find((b) => b.elementId === "K101");
  assert.ok(k101);

  const capCheck = k101.checks.find((c) => c.id === "K101-capacity-shear");
  assert.ok(capCheck);
  assert.equal(capCheck.clause, "TBDY-7.4.5");
  assert.notEqual(capCheck.status, "unsupported", "With seismic data, capacity shear must be evaluated");
  assert.match(capCheck.observed, /Ve=/);
});



