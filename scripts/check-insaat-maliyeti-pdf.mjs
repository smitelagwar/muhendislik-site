import fs from "fs/promises";
import os from "os";
import path from "path";
import { spawnSync } from "child_process";
import * as constructionCostModule from "../src/lib/calculations/modules/insaat-maliyeti-v2/index.ts";
import * as reportingModule from "../src/lib/calculations/reporting.ts";

const constructionCostApi = constructionCostModule.default ?? constructionCostModule;
const reportingApi = reportingModule.default ?? reportingModule;
const {
  buildConstructionCostPdfSnapshot,
  buildConstructionCostReport,
  createDefaultCollection,
} = constructionCostApi;
const { createConstructionCostPdfDocument } = reportingApi;

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

const collection = createDefaultCollection();
collection.scenarios[0].name = "Senaryo A";
collection.scenarios[0].inputs.projectName = "PDF Doğrulama Projesi";
collection.scenarios[0].inputs.area.totalArea = 1800;
collection.scenarios.push({
  ...collection.scenarios[0],
  id: "scenario-b",
  name: "Senaryo B",
  presetId: "premium-residence",
  inputs: {
    ...collection.scenarios[0].inputs,
    qualityLevel: "premium",
    floorCount: 8,
    unitCount: 30,
    area: {
      ...collection.scenarios[0].inputs.area,
      advancedMode: true,
      totalArea: 0,
      basementArea: 320,
      normalArea: 1680,
      parkingArea: 600,
      landscapeArea: 300,
    },
  },
});
collection.comparisonMode = "compare";

const report = buildConstructionCostReport(collection);
const pdfSnapshot = buildConstructionCostPdfSnapshot(report);
pdfSnapshot.generatedAt = "22 Mart 2026";
const pdf = createConstructionCostPdfDocument(pdfSnapshot);

const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "construction-cost-pdf-"));

try {
  const pdfPath = path.join(tempDir, "construction-cost.pdf");
  await fs.writeFile(pdfPath, Buffer.from(pdf.output("arraybuffer")));
  const inspection = inspectPdf(pdfPath);
  const text = inspection.text.replace(/\s+/g, " ").trim();

  assert(inspection.pageCount <= 2, "Construction cost PDF should fit within two pages.");
  assert(
    text.includes("Maliyet kırılımı") || text.includes("En yüksek maliyet kalemleri"),
    "PDF should include the compact analysis sections."
  );
  assert(text.includes("22 Mart 2026"), "PDF should include the fixed Turkish date.");
  assert(text.includes("En yüksek maliyet kalemleri"), "PDF should include top line items section.");
  assert(/[İŞĞÜÇÖışğüçö]/.test(text), "PDF should preserve Turkish characters.");

  console.log(
    JSON.stringify(
      {
        status: "ok",
        pageCount: inspection.pageCount,
      },
      null,
      2,
    ),
  );
} finally {
  await fs.rm(tempDir, { recursive: true, force: true });
}
