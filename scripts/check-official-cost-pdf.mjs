import fs from "fs/promises";
import os from "os";
import path from "path";
import { spawnSync } from "child_process";
import * as officialCostModule from "../src/lib/calculations/official-unit-costs/index.ts";
import * as reportingModule from "../src/lib/calculations/reporting.ts";

const officialCostApi = officialCostModule.default ?? officialCostModule;
const reportingApi = reportingModule.default ?? reportingModule;
const { calculateOfficialUnitCost } = officialCostApi;
const { createOfficialCostPdfDocument } = reportingApi;

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

function writeOfficialPdf(result, outputPath) {
  const pdf = createOfficialCostPdfDocument(result);
  const buffer = Buffer.from(pdf.output("arraybuffer"));
  return fs.writeFile(outputPath, buffer);
}

const testCases = [
  { grup: "II", sinif: "C", alan: 1000 },
  { grup: "III", sinif: "B", alan: 2500 },
  { grup: "V", sinif: "D", alan: 40000 },
];

const monthPattern =
  /\b\d{1,2} (Ocak|Şubat|Mart|Nisan|Mayıs|Haziran|Temmuz|Ağustos|Eylül|Ekim|Kasım|Aralık) 20\d{2}\b/;
const timePattern = /\b([01]?\d|2[0-3]):[0-5]\d\b/;

const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "official-cost-pdf-"));
const checks = [];

try {
  for (const testCase of testCases) {
    const result = calculateOfficialUnitCost(
      {
        yil: 2026,
        grup: testCase.grup,
        sinif: testCase.sinif,
      },
      testCase.alan,
    );

    assert(result, `Official cost result could not be calculated for ${testCase.grup}-${testCase.sinif}.`);

    const pdfPath = path.join(
      tempDir,
      `official-${testCase.grup}-${testCase.sinif}-${testCase.alan}.pdf`,
    );
    await writeOfficialPdf(result, pdfPath);

    const inspection = inspectPdf(pdfPath);
    const text = inspection.text.replace(/\s+/g, " ").trim();
    const tailText = text.slice(-500);

    assert(inspection.pageCount === 1, `${path.basename(pdfPath)} should be a single-page PDF.`);
    assert(!text.includes("Generated"), `${path.basename(pdfPath)} should not include Generated.`);
    assert(!timePattern.test(text), `${path.basename(pdfPath)} should not include a time stamp.`);
    assert(monthPattern.test(text), `${path.basename(pdfPath)} should include a Turkish long date.`);
    assert(!text.includes("Kaynak bölüm"), `${path.basename(pdfPath)} should not include Kaynak bölüm.`);
    assert(!text.includes("Açıklama"), `${path.basename(pdfPath)} should not include Açıklama.`);
    assert(tailText.includes("Notlar"), `${path.basename(pdfPath)} should keep Notlar near the bottom.`);
    assert(
      text.includes("İnşa Blog") || text.includes("İNŞA BLOG"),
      `${path.basename(pdfPath)} should include İnşa Blog branding.`,
    );
    assert(
      /[İŞĞÜÇÖı]/.test(text),
      `${path.basename(pdfPath)} should preserve Turkish characters in extracted text.`,
    );

    checks.push({
      case: `${testCase.grup}-${testCase.sinif} / ${testCase.alan} m²`,
      pageCount: inspection.pageCount,
      dateFound: monthPattern.test(text),
    });
  }

  console.log(
    JSON.stringify(
      {
        status: "ok",
        checks,
      },
      null,
      2,
    ),
  );
} finally {
  await fs.rm(tempDir, { recursive: true, force: true });
}
