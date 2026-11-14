import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { createEmptyModel, createDemoModel } from "./model";
import { calculateFullTakeoff } from "./quantities";
import { generateStaticReportPDF, generateQuantityReportPDF, quantityReport, reportCsv } from "./reports";
import { resolveJunctions } from "./junctions";
import {
  INITIAL_RPT_FLAGS,
  IDE_REPORT_TREE_GROUPS,
  buildRptProfileBytes,
  parseRptProfileBytes,
  syncRptFlagsWithGroup,
  syncRptFlagsWithLeaf,
  deriveSectionsFromRptFlags,
  getIdeReportGroupPresence,
  createIdeSourcePdf,
} from "./ide-source-report";
import type { IdeProject } from "./ide-import";
import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";
import type { CadModel } from "./model";
import type { AnalysisResult, MemberForceResult } from "./analysis";
import type { ConcreteDesignResult } from "./design-engine";

function smallSlab(thickness = .15): CadModel {
  const model = createEmptyModel();
  model.name = "MUSTAFA SELVİ 1.KISIM";
  model.floors = ["ASANSÖR MAK.DAİRESİ", "3. KAT", "2. KAT", "1. KAT", "ZEMİN KAT", "1. BODRUM"].map((name, i) => ({ id: `f${i}`, name, elevation: i * 3, height: 3 }));
  model.elements = [{ id: "slab", name: "D1", type: "slab", floorId: "f0", materialId: "concrete", layer: "Döşemeler",
    thickness, points: [{ x: 0, y: 0 }, { x: 4, y: 0 }, { x: 4, y: 4 }, { x: 0, y: 4 }] }];
  return model;
}
function manyColumns(count: number, name = "Kapsam sınaması"): CadModel {
  const model = createEmptyModel(); model.name = name;
  model.elements = Array.from({ length: count }, (_, i) => ({ id: `column-${i}`, name: `KOLON-${i}`, type: "column" as const,
    floorId: "floor-0", materialId: "concrete", layer: "Kolonlar", position: { x: i * 2, y: 0 }, width: .4, depth: .4, height: 3 }));
  return model;
}
/** Yalnız renderer girdisi. Bu fixture bir solver doğruluk oracle'ı değildir. */
function preliminaryRecords(model: CadModel): AnalysisResult {
  return { members: Object.fromEntries(model.elements.filter(e => e.type === "column").map(e => [e.id, {
    elementId: e.id, name: e.name, type: "column", floorId: e.floorId, axialKn: 10, shearKn: 2, momentKnm: 3,
    pass: true, governingCombination: "SENTETİK-RENDERER", capacityRatio: .3,
  } as MemberForceResult])), storeys: [], modes: [], overallPass: true } as unknown as AnalysisResult;
}
async function pdfText(bytes: Uint8Array): Promise<{ text: string; pages: number }> {
  const task = pdfjs.getDocument({ data: bytes.slice(), useSystemFonts: true });
  const doc = await task.promise;
  try {
    const texts: string[] = [];
    for (let i = 1; i <= doc.numPages; i++) {
      const content = await (await doc.getPage(i)).getTextContent();
      texts.push(content.items.map(item => "str" in item ? item.str : "").join(" "));
    }
    return { text: texts.join("\n"), pages: doc.numPages };
  } finally { await task.destroy(); }
}


type ExtendedRebarTonnage = ReturnType<typeof calculateFullTakeoff>["rebarTonnage"] & {
  missingElementIds?: string[];
  knownSubtotalKg?: number;
  cutListVerified?: boolean;
};

const close = (actual: number | null, expected: number) => { assert.notEqual(actual, null); assert.ok(Math.abs(actual! - expected) < 1e-8, `${actual} != ${expected}`); };
test("P02: 4x4 slab is 2.4m3, doubled thickness is 4.8m3, identity cannot substitute a printed answer", () => {
  const a = smallSlab(), b = smallSlab(.3);
  close(calculateFullTakeoff(a).concreteVolumeM3.total, 2.4);
  close(calculateFullTakeoff(b).concreteVolumeM3.total, 4.8);
  b.name = "Bağımsız sınama";
  close(calculateFullTakeoff(b).concreteVolumeM3.total, 4.8);
  a.elements = [];
  assert.equal(calculateFullTakeoff(a).concreteVolumeM3.total, 0);
});
test("P02: absent reinforcement differs from declared zero; As is not a cut list", () => {
  const model = smallSlab();
  const missing = calculateFullTakeoff(model);
  assert.equal(missing.rebarTonnage.totalKg, null);
  assert.equal(missing.rebarTonnage.totalTons, null);
  assert.deepEqual((missing.rebarTonnage as ExtendedRebarTonnage).missingElementIds, ["slab"]);
  model.elements[0].rebarMass = 0;
  assert.equal(calculateFullTakeoff(model).rebarTonnage.totalKg, 0);
  model.elements[0].rebarMass = 123.45;
  const known = calculateFullTakeoff(model);
  close(known.rebarTonnage.totalKg, 123.45);
  assert.equal(known.rebarTonnage.thinKg, null);
  assert.deepEqual(known.rebarTonnage.byDiameter, {});
  assert.equal((known.rebarTonnage as ExtendedRebarTonnage).cutListVerified, false);
});
test("P02: element labels cannot invent foundation/stair geometry", () => {
  const model = smallSlab();
  for (const name of ["RAD01", "M1", "raft-01", "D1"]) {
    model.elements[0].name = name;
    close(calculateFullTakeoff(model).concreteVolumeM3.total, 2.4);
  }
});
test("P02: one missing final element prevents a complete reinforcement total", () => {
  const model = manyColumns(11);
  model.elements.forEach(e => { e.rebarMass = 12; });
  delete model.elements.at(-1)!.rebarMass;
  const result = calculateFullTakeoff(model);
  assert.equal(result.rebarTonnage.totalKg, null);
  assert.equal((result.rebarTonnage as ExtendedRebarTonnage).knownSubtotalKg, 120);
  assert.deepEqual((result.rebarTonnage as ExtendedRebarTonnage).missingElementIds, ["column-10"]);
});
test("P02: failed geometry cannot be reported as a net gross fallback", () => {
  const model = smallSlab(), junctions = resolveJunctions(model);
  const result = calculateFullTakeoff(model, undefined, { ...junctions, status: "failed", netVolume: null });
  assert.equal(result.concreteVolumeM3.total, null);
});
test("P02: same-name floors preserve per-element, type and overall sums", () => {
  const model = manyColumns(2); model.floors.push({ ...model.floors[0], id: "second", elevation: 5 }); model.elements[1].floorId = "second";
  const result = calculateFullTakeoff(model);
  close(result.concreteVolumeM3.total, .96);
  close(result.concreteVolumeM3.byFloor[model.floors[0].name], .96);
  close(result.elementBreakdown.reduce((s, e) => s + (e.concreteM3 ?? 0), 0), .96);
});
test("P02: empty/cached positive analysis cannot grant global suitability", async () => {
  const readinessModulePath = "./report-" + "readiness";
  const { getReportReadiness } = (await import(readinessModulePath)) as {
    getReportReadiness: (
      model: CadModel,
      analysis?: AnalysisResult | null
    ) => { calculationComplete: boolean; designChecksSatisfied: boolean | null; status: string };
  };
  assert.equal(getReportReadiness(createEmptyModel()).status, "missing_data");
  const model = manyColumns(1), analysis = preliminaryRecords(model);
  const status = getReportReadiness(model, analysis);
  assert.equal(status.calculationComplete, false);
  assert.equal(status.designChecksSatisfied, null);
  assert.equal(status.status, "requires_review");
  analysis.members["column-0"].pass = false;
  assert.equal(getReportReadiness(model, analysis).status, "fail");
});
test("P02 PDF: empty results render explicit missing data, no signatures or example engineering values", async () => {
  const { text } = await pdfText(
    await (generateStaticReportPDF as (m: CadModel, a?: AnalysisResult) => Promise<Uint8Array>)(createEmptyModel())
  );
  assert.match(text, /VERİ EKSİK/);
  assert.match(text, /TAMAMLANMADI/);
  assert.doesNotMatch(text, /E-İMZALIDIR|Resmi Onay Belgesidir|GÜVENLİ|TÜM SINIRLAR SAĞLANDI|Fahrettin|1334[.,]015|0[.,]837/);
});
test("P02 PDF: final failed element and modes beyond nine are retained", async () => {
  const model = manyColumns(37), analysis = preliminaryRecords(model);
  analysis.members["column-36"].pass = false;
  analysis.modes = Array.from({ length: 15 }, (_, i) => ({ modeNumber: i + 1, periodSec: 100 + i, frequencyHz: 1, omegaRadS: 1, massParticipationX: .01, massParticipationY: .02, massParticipationRot: 0, modeShape: {} }));
  const { text, pages } = await pdfText(await generateStaticReportPDF(model, analysis));
  assert.ok(pages > 2);
  assert.match(text, /column-36/);
  assert.match(text, /SAĞLANMADI/);
  assert.match(text, /114/);
  assert.doesNotMatch(text, /GÜVENLİ|TÜM SINIRLAR SAĞLANDI/);
});
test("P02 PDF: stale takeoff values are recomputed; unknown reinforcement is not zero", async () => {
  const model = smallSlab(), cached = calculateFullTakeoff(model);
  cached.concreteVolumeM3.total = 999999;
  cached.rebarTonnage.totalKg = 117421.93;
  const { text } = await pdfText(await generateQuantityReportPDF(model, cached));
  assert.match(text, /2,4/);
  assert.match(text, /VERİ EKSİK/);
  assert.doesNotMatch(text, /999[.,]999|117[.,]421/);
});
test("P02 PDF: legacy modal participation placeholders cannot become numeric report values", async () => {
  const model = manyColumns(1), analysis = preliminaryRecords(model);
  analysis.modes = [{ modeNumber: 1, periodSec: 9.87654, frequencyHz: 1, omegaRadS: 1,
    massParticipationX: 12345.678, massParticipationY: 23456.789, massParticipationRot: 34567.891, modeShape: {} }];
  const { text } = await pdfText(await generateStaticReportPDF(model, analysis));
  assert.match(text, /3B modal çözüm doğrulanmadı/);
  assert.match(text, /HESAPLANAMADI/);
  assert.doesNotMatch(text, /12[.,]345|23[.,]456|34[.,]567/);
});
test("P02 PDF: empty design dictionaries cannot hide a failed analysis joint", async () => {
  const model = manyColumns(1), analysis = preliminaryRecords(model);
  analysis.joints = { "last-joint-failure": { columnId: "column-0", columnName: "S0", floorId: "floor-0", connectedBeams: [], isConfined: false, effectiveWidthM: .4, columnDepthM: .4, shearDemandKn: 400, shearCapacityKn: 1, shearRatio: 400, pass: false, statusText: "" } };
  const design = { joints: {}, memberChecks: {} } as unknown as ConcreteDesignResult;
  const { text } = await pdfText(await generateStaticReportPDF(model, analysis, design));
  assert.match(text, /last-joint-failure/);
  assert.match(text, /SAĞLANMADI/);
});
test("P02 CSV: missing mass and formula injection stay explicit", () => {
  const model = createDemoModel(); model.floors[0].name = "=1+1";
  const rows = quantityReport(model, resolveJunctions(model), { grouping: "floor", floorId: "", types: ["column", "beam", "wall", "slab"] });
  assert.ok(rows.every(r => (r.rebarKg as number | null) === null));
  const csv = reportCsv(rows);
  assert.match(csv, /HESAPLANAMADI/);
  assert.ok(csv.includes("\"'="));
});

function sampleIdeProject(): IdeProject {
  return {
    format: "ide10",
    filename: "ORNEK-PROJE.ide10",
    name: "ORNEK PROJE",
    byteLength: 1024,
    floors: [
      { id: "f-bodrum", name: "1. BODRUM", elevation: -3, height: 3, sourceOffset: 0, endOffset: 100 },
      { id: "f-zemin", name: "ZEMİN KAT", elevation: 0, height: 3.2, sourceOffset: 100, endOffset: 200 },
    ],
    elements: [
      {
        id: "col-1", nativeId: 1, name: "S101", type: "column", floorId: "f-zemin",
        points: [{ x: 0, y: 0 }], width: 0.4, height: 0.5, bottom: 0, top: 3.2,
        sourceOffset: 10, primitiveType: 4, layerId: 1, nativeZ: 0, lateralOffset: 0, rotation: 0,
      },
      {
        id: "beam-1", nativeId: 2, name: "K101", type: "beam", floorId: "f-zemin",
        points: [{ x: 0, y: 0 }, { x: 5, y: 0 }], width: 0.25, height: 0.5,
        sourceOffset: 20, primitiveType: 5, layerId: 2, nativeZ: 0, lateralOffset: 0, rotation: 0,
      },
      {
        id: "slab-1", nativeId: 3, name: "D101", type: "slab", floorId: "f-zemin",
        points: [{ x: 0, y: 0 }, { x: 5, y: 0 }, { x: 5, y: 4 }, { x: 0, y: 4 }], thickness: 0.15,
        planAnnotation: { loads: { dead: 0.2, live: 0.35, unit: "tf/m²", sourceOffset: 25 } },
        sourceOffset: 30, primitiveType: 7, layerId: 3, nativeZ: 0, lateralOffset: 0, rotation: 0,
      },
      {
        id: "radye-1", nativeId: 4, name: "RD01", type: "slab", floorId: "f-bodrum",
        points: [{ x: 0, y: 0 }, { x: 6, y: 0 }, { x: 6, y: 5 }, { x: 0, y: 5 }], thickness: 0.6,
        foundation: true,
        sourceOffset: 40, primitiveType: 7, layerId: 4, nativeZ: -3, lateralOffset: 0, rotation: 0,
      },
    ],
    coverage: {
      candidateRecords: 4, decodedRecords: 4, unsupportedRecords: 0,
      ignoredTemplateRecords: 0, holeRecords: 0, rejectedCandidates: 0,
      byType: { column: 1, beam: 1, slab: 2 }, unsupportedTypes: {}, limitations: [],
    },
    warnings: [],
  };
}

test("RPT 146-flag binary roundtrip and tree sync match betonarme-11-28 baseline SHA-256", () => {
  assert.equal(INITIAL_RPT_FLAGS.length, 146);
  assert.equal(IDE_REPORT_TREE_GROUPS.length, 22);
  const bytes = buildRptProfileBytes(INITIAL_RPT_FLAGS);
  assert.equal(bytes.length, 193);
  const sha = createHash("sha256").update(bytes).digest("hex");
  assert.equal(sha, "3deccaa53e18e7fe48d66e09830827ef4588c4688f1098ed2495f7dd1329334e");
  assert.deepEqual(parseRptProfileBytes(bytes), [...INITIAL_RPT_FLAGS]);

  // Toggle leaf off/on updates parentTreeIdx and root
  let flags = syncRptFlagsWithGroup(INITIAL_RPT_FLAGS, "birlesim", false);
  assert.equal(flags[119], false);
  assert.equal(flags[120], false);
  assert.ok(!deriveSectionsFromRptFlags(flags).includes("birlesim"));

  flags = syncRptFlagsWithLeaf(flags, "birlesim", 119, true);
  assert.equal(flags[119], true);
  assert.equal(flags[120], true);
  assert.ok(deriveSectionsFromRptFlags(flags).includes("birlesim"));

  // Invalid buffers must be rejected
  assert.throws(() => parseRptProfileBytes(new Uint8Array(100)));
  const badByte = new Uint8Array(bytes);
  badByte[60] = 2;
  assert.throws(() => parseRptProfileBytes(badByte));
});

test("getIdeReportGroupPresence skips absent element groups across scopes", () => {
  const ide = sampleIdeProject();
  const allPresence = getIdeReportGroupPresence(ide, null, "all");
  assert.equal(allPresence.aciklama.applicable, false);
  assert.equal(allPresence.kolon.count, 1);
  assert.equal(allPresence.kiris.count, 1);
  assert.equal(allPresence.doseme.count, 1);
  assert.equal(allPresence.radye.count, 1);
  assert.equal(allPresence.birlesim.count, 1);
  assert.equal(allPresence.tekil_temel.present, false);
  assert.equal(allPresence.tekil_temel.count, 0);
  assert.equal(allPresence.surekli_temel.present, false);
  assert.equal(allPresence.merdiven.present, false);
  assert.equal(allPresence.perde.present, false);

  const zeminPresence = getIdeReportGroupPresence(ide, null, "active_floor", "zemin kat");
  assert.equal(zeminPresence.kolon.count, 1);
  assert.equal(zeminPresence.radye.count, 0);
  assert.equal(zeminPresence.radye.present, false);

  const selPresence = getIdeReportGroupPresence(ide, null, "selected", undefined, ["col-1"]);
  assert.equal(selPresence.kolon.count, 1);
  assert.equal(selPresence.kiris.count, 0);
  assert.equal(selPresence.birlesim.count, 0);
});

test("createIdeSourcePdf skips zero-count selected groups and combines static + metraj", async () => {
  const ide = sampleIdeProject();
  const model = createDemoModel();
  // Select ALL 21 rpt groups (including tekil_temel, surekli_temel, kazik, merdiven which are absent in sampleIdeProject)
  let allOn = [...INITIAL_RPT_FLAGS];
  for (const g of IDE_REPORT_TREE_GROUPS) {
    if (g.rptSupported) allOn = syncRptFlagsWithGroup(allOn, g.id, true);
  }
  const bytes = createIdeSourcePdf(ide, "a".repeat(64), "rev-1", {
    scope: "all",
    rptFlags: allOn,
    sections: deriveSectionsFromRptFlags(allOn),
    ideKapak: true,
    cadModel: model,
    metadata: {
      title: "TEST YAPI PROJESİ",
      designer: "Müh. Deneme",
      revisionNote: "Rev-02",
      dateNote: "14.11.2026",
      city: "İstanbul",
      district: "Kadıköy",
      usagePurpose: "KONUT",
      pafta: "12",
      ada: "345",
      parsel: "6",
    },
    metraj: { enabled: true, kalip: true, beton: true, donati: true, detay: true },
  });
  const { text } = await pdfText(bytes);
  assert.match(text, /TEST YAPI PROJESİ/);
  assert.match(text, /İstanbul \/ Kadıköy/);
  assert.match(text, /12 \/ 345 \/ 6/);
  assert.match(text, /METRAJ RAPORU/);
  assert.match(text, /1\. Kalıp Metrajı/);
  assert.match(text, /2\. Beton Metrajı/);
  assert.match(text, /3\. Donatı \/ Özet Metraj/);
  assert.match(text, /4\. Kata ve Elemana Göre Detaylı Metraj/);
  assert.match(text, /Seçili olduğu halde projede\/kapsamda 0 adet bulunan eleman grupları rapora dahil edilmemiştir/);
  // Absent groups must NOT appear as printed sections
  assert.doesNotMatch(text, /Tekil Temeller \(/);
  assert.doesNotMatch(text, /Sürekli Temel \(/);
  assert.doesNotMatch(text, /Kazıklar \(/);
  assert.doesNotMatch(text, /Merdivenler \(/);
  // Present groups MUST appear
  assert.match(text, /Kolonlar \(/);
  assert.match(text, /Kirişler \(/);
  assert.match(text, /Döşemeler \(/);
  assert.match(text, /Radye Döşemeler \(/);

  // Fail-closed on unknown active floor
  assert.throws(() => createIdeSourcePdf(ide, "a".repeat(64), "rev-1", {
    scope: "active_floor",
    activeFloorName: "OLMAYAN KAT",
  }));

  // Works with CadModel only (source = null) and metraj disabled
  const modelOnlyBytes = createIdeSourcePdf(null, "b".repeat(64), "rev-model", {
    cadModel: model,
    scope: "selected",
    selectedElementIds: ["column-0"],
    metraj: { enabled: false },
  });
  const { text: modelOnlyText } = await pdfText(modelOnlyBytes);
  assert.match(modelOnlyText, /Seçili elemanlar \(1 adet\)/);
  assert.match(modelOnlyText, /Kolonlar \(1 adet\)/);
  assert.doesNotMatch(modelOnlyText, /METRAJ RAPORU/);
});
