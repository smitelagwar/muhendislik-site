import fs from "node:fs";
import path from "node:path";
import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";
import {
  verifyIdeHeaderChecksum,
  IDE10_VERSION,
  IDE_HEADER_CRC_START_OFFSET,
} from "../src/lib/hsyncad/ide-import/ide-binary-codec";
import { resolveJunctions } from "../src/lib/hsyncad/junctions";
import { runStructuralAnalysis } from "../src/lib/hsyncad/analysis";
import type { CadModel } from "../src/lib/hsyncad/model";

interface TestResult {
  suite: string;
  testName: string;
  passed: boolean;
  details: string;
}

const results: TestResult[] = [];

function record(suite: string, testName: string, passed: boolean, details: string) {
  results.push({ suite, testName, passed, details });
  const status = passed ? "[PASS]" : "[FAIL]";
  console.log(`${status} [${suite}] ${testName}: ${details}`);
}

async function runEmpiricalChallenge() {
  const sonDir = "C:\\Users\\hsyn\\Desktop\\SON";
  console.log("================================================================================");
  console.log("CHALLENGER 2: EMPIRICAL DELIVERABLES & FILE FORMATS VERIFICATION HARNESS");
  console.log("Target Directory: " + sonDir);
  console.log("================================================================================\n");

  // ---------------------------------------------------------------------------
  // SUITE 1: PDF INTEGRITY (STATİK RAPOR.pdf, METRAJ.pdf, STATİK RAPOR KAPAK.pdf)
  // ---------------------------------------------------------------------------
  console.log(">>> SUITE 1: PDF Integrity Probes <<<");

  // 1.1 STATİK RAPOR.pdf
  const staticPdfPath = path.join(sonDir, "STATİK RAPOR.pdf");
  if (!fs.existsSync(staticPdfPath)) {
    record("PDF_STATIC", "File Exists", false, "File not found: " + staticPdfPath);
  } else {
    const rawBytes = fs.readFileSync(staticPdfPath);
    const headerStr = rawBytes.subarray(0, 8).toString("latin1");
    const hasPdfHeader = headerStr.startsWith("%PDF-1.");
    record("PDF_STATIC", "Magic Header %PDF-1.x", hasPdfHeader, `Header found: "${headerStr.trim()}"`);

    const rawText = rawBytes.toString("latin1");
    const hasXref = rawText.includes("xref") || rawText.includes("/XRef");
    const hasEof = rawText.includes("%%EOF");
    const hasTrailer = rawText.includes("trailer") || rawText.includes("/Root");
    record("PDF_STATIC", "PDF Structural Integrity (xref, trailer, %%EOF)", hasXref && hasEof && hasTrailer, 
      `xref=${hasXref}, trailer=${hasTrailer}, %%EOF=${hasEof}, rawSize=${rawBytes.length} bytes`);

    const staticDoc = await pdfjs.getDocument({ data: new Uint8Array(rawBytes) }).promise;
    const numPages = staticDoc.numPages;
    record("PDF_STATIC", "Page Count >= 8", numPages >= 8, `Actual page count: ${numPages}`);

    const pageTexts: string[] = [];
    let fullText = "";
    for (let p = 1; p <= numPages; p++) {
      const page = await staticDoc.getPage(p);
      const textContent = await page.getTextContent();
      const pageStr = textContent.items.map((it: any) => it.str).join(" ");
      pageTexts.push(pageStr);
      fullText += `\n--- PAGE ${p} ---\n` + pageStr;
    }

    const expectedChapters = [
      { num: 1, title: "KAT TANIMLARI", searchKey: "BÖLÜM 1" },
      { num: 2, title: "MALZEME MODELLERİ", searchKey: "BÖLÜM 2" },
      { num: 3, title: "ÇATLAMIŞ KESİT RİJİTLİKLERİ", searchKey: "BÖLÜM 3" },
      { num: 4, title: "YÜK KOMBİNASYONLARI", searchKey: "BÖLÜM 4" },
      { num: 5, title: "YAPI ÖZET RAPORU", searchKey: "BÖLÜM 5" },
      { num: 6, title: "ANALİZ AYARLARI", searchKey: "BÖLÜM 6" },
      { num: 7, title: "DEPREM SPEKTRUMU", searchKey: "BÖLÜM 7" },
      { num: 8, title: "KAT YATAY YÜKLERİ", searchKey: "BÖLÜM 8" },
      { num: 9, title: "KÜTLE VE RİJİTLİK MERKEZLERİ", searchKey: "BÖLÜM 9" },
      { num: 10, title: "RİJİT BODRUM KONTROLÜ", searchKey: "BÖLÜM 10" },
      { num: 11, title: "MODAL ANALİZ", searchKey: "BÖLÜM 11" },
      { num: 12, title: "DÜZENSİZLİK RAPORLARI", searchKey: "BÖLÜM 12" },
      { num: 13, title: "DÖŞEME HESAPLARI", searchKey: "BÖLÜM 13" },
      { num: 14, title: "KİRİŞ HESAPLARI", searchKey: "BÖLÜM 14" },
      { num: 15, title: "KOLON HESAPLARI", searchKey: "BÖLÜM 15" },
      { num: 16, title: "GÜÇLÜ KOLON TAHKİKİ", searchKey: "BÖLÜM 16" },
      { num: 17, title: "BİRLEŞİM KESME GÜVENLİĞİ", searchKey: "BÖLÜM 17" },
      { num: 18, title: "PERDE HESAPLARI", searchKey: "BÖLÜM 18" },
      { num: 19, title: "RADYE & METRAJ ÖZETİ", searchKey: "BÖLÜM 19" },
    ];

    let missingChapters: number[] = [];
    const normalizedFullText = fullText.toLocaleUpperCase("tr-TR");
    for (const chap of expectedChapters) {
      const found = normalizedFullText.includes(chap.searchKey.toLocaleUpperCase("tr-TR"));
      if (!found) {
        missingChapters.push(chap.num);
      }
    }

    record("PDF_STATIC", "Presence of all 19 Chapters", missingChapters.length === 0,
      missingChapters.length === 0 
        ? "All 19 chapters present and identified in text streams" 
        : `Missing chapters: ${missingChapters.join(", ")}`);

    const hasTbdy = normalizedFullText.includes("TBDY 2018");
    const hasTs500 = normalizedFullText.includes("TS 500");
    const hasBelediye = normalizedFullText.includes("BELEDİYESİ");
    record("PDF_STATIC", "Engineering Standards Reference (TBDY 2018, TS 500, Belediye)", hasTbdy && hasTs500 && hasBelediye,
      `TBDY 2018=${hasTbdy}, TS 500=${hasTs500}, BELEDİYESİ=${hasBelediye}`);
  }

  // 1.2 METRAJ.pdf
  console.log("\n>>> METRAJ.pdf Inspection <<<");
  const metrajPdfPath = path.join(sonDir, "METRAJ.pdf");
  if (!fs.existsSync(metrajPdfPath)) {
    record("PDF_METRAJ", "File Exists", false, "File not found: " + metrajPdfPath);
  } else {
    const rawBytes = fs.readFileSync(metrajPdfPath);
    const headerStr = rawBytes.subarray(0, 8).toString("latin1");
    record("PDF_METRAJ", "Magic Header %PDF-1.x", headerStr.startsWith("%PDF-1."), `Header: "${headerStr.trim()}"`);

    const metrajDoc = await pdfjs.getDocument({ data: new Uint8Array(rawBytes) }).promise;
    record("PDF_METRAJ", "Page Count == 4", metrajDoc.numPages === 4, `Page count: ${metrajDoc.numPages}`);

    let fullMetrajText = "";
    for (let p = 1; p <= metrajDoc.numPages; p++) {
      const page = await metrajDoc.getPage(p);
      const textContent = await page.getTextContent();
      const pageStr = textContent.items.map((it: any) => it.str).join(" ");
      fullMetrajText += `\n[PAGE ${p}] ` + pageStr;
    }

    // Ministry Poz Codes:
    const pozCodes = [
      { code: "15.150.1005", desc: "C25/30 Hazır Beton" },
      { code: "15.140.1002", desc: "Ahşap Kalıp" },
      { code: "15.160.1003", desc: "Donatı Ø8-Ø12" },
      { code: "15.160.1004", desc: "Donatı Ø14-Ø32" },
    ];
    let missingPoz: string[] = [];
    for (const pz of pozCodes) {
      if (!fullMetrajText.includes(pz.code)) {
        missingPoz.push(`${pz.code} (${pz.desc})`);
      }
    }
    record("PDF_METRAJ", "Ministry Poz Codes (15.150.1005, 15.140.1002, 15.160.1003, 15.160.1004)",
      missingPoz.length === 0,
      missingPoz.length === 0 ? "All 4 Ministry Poz codes verified" : `Missing: ${missingPoz.join(", ")}`);

    // Verify Table Structures across the 4 pages:
    // Page 1: Formwork table ("KALIP METRAJI")
    // Page 2: Concrete table ("BETON METRAJI")
    // Page 3: Rebar table ("DONATI METRAJI")
    // Page 4: Summary table ("TOPLAM METRAJ ÖZET TABLOSU")
    const hasP1 = fullMetrajText.includes("KALIP METRAJI");
    const hasP2 = fullMetrajText.includes("BETON METRAJI");
    const hasP3 = fullMetrajText.includes("DONATI METRAJI");
    const hasP4 = fullMetrajText.includes("TOPLAM METRAJ ÖZET TABLOSU");
    const hasTableStructure = hasP1 && hasP2 && hasP3 && hasP4;
    record("PDF_METRAJ", "4-Page Table Structures (Kalıp, Beton, Donatı, Toplam)", hasTableStructure,
      `P1 Formwork=${hasP1}, P2 Concrete=${hasP2}, P3 Rebar=${hasP3}, P4 Summary=${hasP4}`);
  }

  // 1.3 STATİK RAPOR KAPAK.pdf
  console.log("\n>>> STATİK RAPOR KAPAK.pdf Inspection <<<");
  const kapakPdfPath = path.join(sonDir, "STATİK RAPOR KAPAK.pdf");
  if (!fs.existsSync(kapakPdfPath)) {
    record("PDF_KAPAK", "File Exists", false, "File not found: " + kapakPdfPath);
  } else {
    const rawBytes = fs.readFileSync(kapakPdfPath);
    const headerStr = rawBytes.subarray(0, 8).toString("latin1");
    record("PDF_KAPAK", "Magic Header %PDF-1.x", headerStr.startsWith("%PDF-1."), `Header: "${headerStr.trim()}"`);

    const kapakDoc = await pdfjs.getDocument({ data: new Uint8Array(rawBytes) }).promise;
    record("PDF_KAPAK", "Page Count == 1", kapakDoc.numPages === 1, `Page count: ${kapakDoc.numPages}`);

    const page = await kapakDoc.getPage(1);
    const textContent = await page.getTextContent();
    const kapakText = textContent.items.map((it: any) => it.str).join(" ");

    const hasMunicipal = kapakText.toLocaleUpperCase("tr-TR").includes("BELEDİYESİ") || kapakText.toLocaleUpperCase("tr-TR").includes("İMAR");
    const hasProjectTitle = kapakText.includes("BETONARME") || kapakText.includes("BİNA") || kapakText.includes("YAPI") || kapakText.includes("PROJE") || kapakText.includes("MERKEZİ");
    const hasCredentials = kapakText.includes("MÜHENDİS") || kapakText.includes("TMMOB") || kapakText.includes("Sicil") || kapakText.includes("SİCİL") || kapakText.includes("İMO");
    record("PDF_KAPAK", "Municipal Cover Content & Credentials", hasMunicipal && hasProjectTitle && hasCredentials,
      `Municipal text=${hasMunicipal}, Project title=${hasProjectTitle}, Engineer credentials=${hasCredentials}`);
  }

  // ---------------------------------------------------------------------------
  // SUITE 2: CAD DXF FILE FORMAT INTEGRITY (KALIP_PLANI.dxf, DONATI_DETAYLARI.dxf)
  // ---------------------------------------------------------------------------
  console.log("\n>>> SUITE 2: CAD DXF Integrity Probes <<<");

  function parseDxfStructure(filePath: string) {
    const content = fs.readFileSync(filePath, "utf8");
    const rawLines = content.split(/\r?\n/);
    const lines = rawLines[rawLines.length - 1] === "" ? rawLines.slice(0, -1) : rawLines;
    const isPairCountEven = lines.length % 2 === 0;

    const pairs: Array<{ code: number; value: string }> = [];
    let syntaxError: string | null = null;
    for (let i = 0; i < lines.length; i += 2) {
      const code = parseInt(lines[i].trim(), 10);
      if (isNaN(code)) {
        syntaxError = `Line ${i + 1}: invalid group code "${lines[i]}"`;
        break;
      }
      pairs.push({ code, value: lines[i + 1] });
    }

    const sections: string[] = [];
    let inSection = false;
    let currentSectionName = "";
    const layersDefined = new Set<string>();
    const layersUsed = new Set<string>();
    const entityCounts: Record<string, number> = {};
    let hasEof = false;

    for (let i = 0; i < pairs.length; i++) {
      const { code, value } = pairs[i];
      if (code === 0 && value === "SECTION") {
        inSection = true;
        if (i + 1 < pairs.length && pairs[i + 1].code === 2) {
          currentSectionName = pairs[i + 1].value;
          sections.push(currentSectionName);
        }
      } else if (code === 0 && value === "ENDSEC") {
        inSection = false;
        currentSectionName = "";
      } else if (code === 0 && value === "EOF") {
        hasEof = true;
      } else if (currentSectionName === "TABLES" && code === 0 && value === "LAYER") {
        if (i + 1 < pairs.length && pairs[i + 1].code === 2) {
          layersDefined.add(pairs[i + 1].value);
        }
      } else if (currentSectionName === "ENTITIES") {
        if (code === 0) {
          entityCounts[value] = (entityCounts[value] || 0) + 1;
        } else if (code === 8) {
          layersUsed.add(value);
        }
      }
    }

    return {
      lineCount: lines.length,
      pairCount: pairs.length,
      isPairCountEven,
      syntaxError,
      sections,
      layersDefined: Array.from(layersDefined),
      layersUsed: Array.from(layersUsed),
      entityCounts,
      hasEof,
    };
  }

  // 2.1 KALIP_PLANI.dxf
  const kalipDxfPath = path.join(sonDir, "KALIP_PLANI.dxf");
  if (!fs.existsSync(kalipDxfPath)) {
    record("DXF_KALIP", "File Exists", false, "Not found: " + kalipDxfPath);
  } else {
    const kalip = parseDxfStructure(kalipDxfPath);
    record("DXF_KALIP", "ASCII Group Code/Value Pairing", kalip.isPairCountEven && !kalip.syntaxError,
      `Lines=${kalip.lineCount}, Pairs=${kalip.pairCount}, Error=${kalip.syntaxError ?? "None"}`);

    const expectedSections = ["HEADER", "TABLES", "BLOCKS", "ENTITIES"];
    const hasAllSections = expectedSections.every(s => kalip.sections.includes(s)) && kalip.hasEof;
    record("DXF_KALIP", "Standard Sections (HEADER, TABLES, BLOCKS, ENTITIES, EOF)", hasAllSections,
      `Sections found: [${kalip.sections.join(", ")}], hasEof=${kalip.hasEof}`);

    const requiredLayers = ["AKSLAR", "KOLONLAR", "KIRISLER", "PERDELER", "DOSEMELER", "TEMELLER"];
    const missingLayers = requiredLayers.filter(l => !kalip.layersDefined.includes(l) && !kalip.layersUsed.includes(l));
    record("DXF_KALIP", "Required Engineering Layers (AKSLAR, KOLONLAR, KIRISLER, PERDELER, DOSEMELER, TEMELLER)",
      missingLayers.length === 0,
      missingLayers.length === 0 ? `All 6 layers verified. Used: [${kalip.layersUsed.join(", ")}]` : `Missing layers: ${missingLayers.join(", ")}`);

    record("DXF_KALIP", "Entity Composition", Object.keys(kalip.entityCounts).length > 0,
      `Entities: ${JSON.stringify(kalip.entityCounts)}`);
  }

  // 2.2 DONATI_DETAYLARI.dxf
  const donatiDxfPath = path.join(sonDir, "DONATI_DETAYLARI.dxf");
  if (!fs.existsSync(donatiDxfPath)) {
    record("DXF_DONATI", "File Exists", false, "Not found: " + donatiDxfPath);
  } else {
    const donati = parseDxfStructure(donatiDxfPath);
    record("DXF_DONATI", "ASCII Group Code/Value Pairing", donati.isPairCountEven && !donati.syntaxError,
      `Lines=${donati.lineCount}, Pairs=${donati.pairCount}, Error=${donati.syntaxError ?? "None"}`);

    const expectedSections = ["HEADER", "TABLES", "BLOCKS", "ENTITIES"];
    const hasAllSections = expectedSections.every(s => donati.sections.includes(s)) && donati.hasEof;
    record("DXF_DONATI", "Standard Sections (HEADER, TABLES, BLOCKS, ENTITIES, EOF)", hasAllSections,
      `Sections found: [${donati.sections.join(", ")}], hasEof=${donati.hasEof}`);

    const hasRebarLayers = donati.layersUsed.includes("DONATI") || donati.layersDefined.includes("DONATI");
    record("DXF_DONATI", "Rebar Detail Layers (DONATI, KIRISLER, etc.)", hasRebarLayers,
      `Defined layers: [${donati.layersDefined.join(", ")}], Used: [${donati.layersUsed.join(", ")}]`);

    record("DXF_DONATI", "Entity Composition", Object.keys(donati.entityCounts).length > 0,
      `Entities: ${JSON.stringify(donati.entityCounts)}`);
  }

  // ---------------------------------------------------------------------------
  // SUITE 3: PROJECT FILE INTEGRITY (7_KAT_5000M2_BINA.hsyncad & .ide10)
  // ---------------------------------------------------------------------------
  console.log("\n>>> SUITE 3: Project File Integrity Probes <<<");

  // 3.1 7_KAT_5000M2_BINA.hsyncad (JSON)
  const hsyncadPath = path.join(sonDir, "7_KAT_5000M2_BINA.hsyncad");
  if (!fs.existsSync(hsyncadPath)) {
    record("PROJECT_HSYNCAD", "File Exists", false, "Not found: " + hsyncadPath);
  } else {
    try {
      const content = fs.readFileSync(hsyncadPath, "utf8");
      const model: CadModel = JSON.parse(content);
      record("PROJECT_HSYNCAD", "Valid JSON Syntax", true, `Parsed successfully (${(content.length / 1024).toFixed(1)} KB)`);

      const floorCount = Array.isArray(model.floors) ? model.floors.length : 0;
      record("PROJECT_HSYNCAD", "Floors Count == 7", floorCount === 7, `Floors count: ${floorCount}`);

      const totalHeight = model.floors.reduce((sum: number, f: any) => sum + (f.height || 0), 0);
      record("PROJECT_HSYNCAD", "Total Building Height == 24.5 m (7 * 3.5m)", Math.abs(totalHeight - 24.5) < 0.1,
        `Total height: ${totalHeight.toFixed(2)} m`);

      const elements = Array.isArray(model.elements) ? model.elements : [];
      const columns = elements.filter(e => e.type === "column");
      const beams = elements.filter(e => e.type === "beam");
      const walls = elements.filter(e => e.type === "wall");
      const slabs = elements.filter(e => e.type === "slab");
      const axes = elements.filter(e => e.type === "axis");

      record("PROJECT_HSYNCAD", "Structural Elements Inventory", elements.length === 806,
        `Total: ${elements.length} (Columns: ${columns.length}, Beams: ${beams.length}, Walls: ${walls.length}, Slabs: ${slabs.length}, Axes: ${axes.length})`);

      // Junctions Verification: test engine junction resolution on the loaded model
      const junctions = resolveJunctions(model);
      const isJunctionsResolved = junctions.status === "resolved";
      record("PROJECT_HSYNCAD", "Junction Engine Resolution", isJunctionsResolved,
        `Status=${junctions.status}, Node entries=${Object.keys(junctions.byElement).length}`);

      // Structural Analysis Verification: test solver pipeline execution on the loaded model
      const analysis = runStructuralAnalysis(model);
      const isAnalysisValid = typeof analysis.totalWeightKn === "number" && analysis.totalWeightKn > 0 &&
        typeof analysis.baseShearKn === "number" && analysis.baseShearKn > 0;
      record("PROJECT_HSYNCAD", "Structural Analysis Execution & Settings", isAnalysisValid,
        `Weight=${analysis.totalWeightKn?.toFixed(1)} kN, BaseShear=${analysis.baseShearKn?.toFixed(1)} kN, Period=${analysis.periodSec?.toFixed(3)} s, Storeys=${analysis.storeys?.length}`);

    } catch (err: any) {
      record("PROJECT_HSYNCAD", "JSON Parse & Schema Validation", false, "Exception: " + err.message);
    }
  }

  // 3.2 7_KAT_5000M2_BINA.ide10 (Binary)
  const ide10Path = path.join(sonDir, "7_KAT_5000M2_BINA.ide10");
  if (!fs.existsSync(ide10Path)) {
    record("PROJECT_IDE10", "File Exists", false, "Not found: " + ide10Path);
  } else {
    const fileBytes = fs.readFileSync(ide10Path);
    record("PROJECT_IDE10", "File Size > 100 MB", fileBytes.length > 100 * 1024 * 1024,
      `Size: ${(fileBytes.length / (1024 * 1024)).toFixed(2)} MB (${fileBytes.length} bytes)`);

    const headerStr = fileBytes.subarray(0, 74).toString("latin1");
    const isSigMatch = headerStr.startsWith("IDE BUILDING DESIGNER PROJECT FILE\r\nVer 4 SubVer 00\r\nCopyright IDE YAPI");
    record("PROJECT_IDE10", "ideCAD 88-Byte Header Magic Signature", isSigMatch,
      `Header (74b): "${headerStr.replace(/\r\n/g, "\\r\\n")}"`);

    const view = new DataView(fileBytes.buffer, fileBytes.byteOffset, fileBytes.byteLength);
    const formatVersion = view.getUint32(74, true);
    const encodedFlag = fileBytes[78];
    const headerByteLength = view.getUint32(79, true);

    record("PROJECT_IDE10", "Header Format Fields", formatVersion === IDE10_VERSION && headerByteLength === fileBytes.length,
      `formatVersion=${formatVersion} (expected ${IDE10_VERSION}), encodedFlag=${encodedFlag}, headerByteLength=${headerByteLength} (matches file size ${fileBytes.length})`);

    const crcResult = verifyIdeHeaderChecksum(new Uint8Array(fileBytes));
    record("PROJECT_IDE10", "IEEE CRC32 Checksum Verification (Offset 83..86)", crcResult.valid,
      `Stored: 0x${crcResult.stored.toString(16).padStart(8, "0")}, Computed: 0x${crcResult.computed.toString(16).padStart(8, "0")}, Valid=${crcResult.valid}`);

    // Adversarial Bit-Flip Checksum Rejection Test
    const corruptedBytes = new Uint8Array(fileBytes.length);
    corruptedBytes.set(fileBytes);
    corruptedBytes[1000] ^= 0x01;
    const corruptedResult = verifyIdeHeaderChecksum(corruptedBytes);
    record("PROJECT_IDE10", "Adversarial Checksum Sensitivity (Bit-Flip Test)", !corruptedResult.valid,
      `Bit flip at offset 1000 properly detected: stored=0x${corruptedResult.stored.toString(16)}, computed=0x${corruptedResult.computed.toString(16)}, valid=${corruptedResult.valid}`);
  }

  // ---------------------------------------------------------------------------
  // SUMMARY & EMPIRICAL VERDICT
  // ---------------------------------------------------------------------------
  console.log("\n================================================================================");
  console.log("SUMMARY OF EMPIRICAL CHECKS");
  console.log("================================================================================");
  const total = results.length;
  const passedCount = results.filter(r => r.passed).length;
  const failedCount = total - passedCount;
  console.log(`Total Probes Executed: ${total}`);
  console.log(`Passed: ${passedCount}`);
  console.log(`Failed: ${failedCount}`);

  if (failedCount === 0) {
    console.log("\n>>> EMPIRICAL VERDICT: CONFIRM_CORRECT <<<");
  } else {
    console.log("\n>>> EMPIRICAL VERDICT: DISPUTE <<<");
  }
}

runEmpiricalChallenge().catch(err => {
  console.error("Fatal error in empirical test harness:", err);
  process.exit(1);
});
