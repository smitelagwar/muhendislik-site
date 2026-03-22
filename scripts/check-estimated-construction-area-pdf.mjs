import fs from "fs/promises";
import os from "os";
import path from "path";
import { spawnSync } from "child_process";
import * as estimatedAreaModule from "../src/lib/calculations/modules/tahmini-insaat-alani/engine.ts";
import * as reportingModule from "../src/lib/calculations/reporting.ts";

const estimatedAreaApi = estimatedAreaModule.default ?? estimatedAreaModule;
const reportingApi = reportingModule.default ?? reportingModule;
const { calculateEstimatedConstructionArea } = estimatedAreaApi;
const { createEstimatedConstructionAreaPdfDocument } = reportingApi;

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function inspectPdf(pdfPath) {
  const script = `
import json
import sys
from pypdf import PdfReader

reader = PdfReader(sys.argv[1])
text = "\\n".join((page.extract_text() or "") for page in reader.pages)
payload = {
  "pageCount": len(reader.pages),
  "text": text,
}
print(json.dumps(payload, ensure_ascii=False))
`;

  const result = spawnSync("python", ["-X", "utf8", "-", pdfPath], {
    input: script,
    encoding: "utf-8",
  });

  if (result.status !== 0) {
    throw new Error(result.stderr || "PDF inspection failed.");
  }

  return JSON.parse(result.stdout);
}

function writeEstimatedAreaPdf(snapshot, outputPath) {
  const pdf = createEstimatedConstructionAreaPdfDocument(snapshot);
  const buffer = Buffer.from(pdf.output("arraybuffer"));
  return fs.writeFile(outputPath, buffer);
}

const testCases = [
  {
    label: "Konut / 1.200 m² / TAKS 0.35 / KAKS 1.20 / 5 kat / 1 bodrum",
    input: {
      parcelAreaM2: 1200,
      taks: 0.35,
      kaks: 1.2,
      normalFloorCount: 5,
      profile: "konut",
      hasBasement: true,
      basementFloorCount: 1,
      basementFloorAreaM2: null,
    },
  },
  {
    label: "Ticari-Ofis / 2.200 m² / TAKS 0.40 / KAKS 1.80 / 6 kat / 2 bodrum",
    input: {
      parcelAreaM2: 2200,
      taks: 0.4,
      kaks: 1.8,
      normalFloorCount: 6,
      profile: "ticariOfis",
      hasBasement: true,
      basementFloorCount: 2,
      basementFloorAreaM2: null,
    },
  },
  {
    label: "Karma / 3.000 m² / TAKS 0.35 / KAKS 2.40 / 8 kat / 3 bodrum",
    input: {
      parcelAreaM2: 3000,
      taks: 0.35,
      kaks: 2.4,
      normalFloorCount: 8,
      profile: "karma",
      hasBasement: true,
      basementFloorCount: 3,
      basementFloorAreaM2: null,
    },
  },
];

const fixedDate = "22 Mart 2026";
const timePattern = /\b([01]?\d|2[0-3]):[0-5]\d\b/;
const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "estimated-area-pdf-"));
const checks = [];

try {
  for (const testCase of testCases) {
    const result = calculateEstimatedConstructionArea(testCase.input);
    assert(result, `Estimated area result could not be calculated for ${testCase.label}.`);

    const pdfPath = path.join(
      tempDir,
      testCase.label
        .toLowerCase()
        .replaceAll(/[^\w]+/g, "-")
        .replaceAll(/^-|-$/g, "") + ".pdf"
    );

    await writeEstimatedAreaPdf(
      {
        input: testCase.input,
        result,
        profileLabel: result.profileLabel,
        formattedDate: fixedDate,
      },
      pdfPath
    );

    const inspection = inspectPdf(pdfPath);
    const text = inspection.text.replace(/\s+/g, " ").trim();
    const tailText = text.slice(-500);

    assert(inspection.pageCount === 1, `${path.basename(pdfPath)} should be a single-page PDF.`);
    assert(!text.includes("Generated"), `${path.basename(pdfPath)} should not include Generated.`);
    assert(!timePattern.test(text), `${path.basename(pdfPath)} should not include a time stamp.`);
    assert(text.includes(fixedDate), `${path.basename(pdfPath)} should include the fixed Turkish date.`);
    assert(tailText.includes("Notlar"), `${path.basename(pdfPath)} should keep Notlar near the bottom.`);
    assert(
      text.includes("Profil varsayımı"),
      `${path.basename(pdfPath)} should include Profil varsayımı.`
    );
    assert(
      text.includes("Emsal harici ek alan"),
      `${path.basename(pdfPath)} should include Emsal harici ek alan.`
    );
    assert(
      text.includes("İnşa Blog") || text.includes("İNŞA BLOG"),
      `${path.basename(pdfPath)} should include İnşa Blog branding.`
    );
    assert(
      /[İŞĞÜÇÖışğüçö]/.test(text),
      `${path.basename(pdfPath)} should preserve Turkish characters in extracted text.`
    );

    checks.push({
      case: testCase.label,
      pageCount: inspection.pageCount,
      totalArea: result.yaklasikToplamInsaatAlaniM2,
    });
  }

  console.log(
    JSON.stringify(
      {
        status: "ok",
        checks,
      },
      null,
      2
    )
  );
} finally {
  await fs.rm(tempDir, { recursive: true, force: true });
}
