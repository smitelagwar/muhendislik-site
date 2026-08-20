import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {
  CURRENT_RULE_SNAPSHOT,
  calculateRuhsatFeasibility,
} from "../src/lib/calculations/modules/ruhsat-on-fizibilite";
import {
  buildRuhsatAnalysisExport,
  buildRuhsatPdfSnapshot,
} from "../src/lib/calculations/modules/ruhsat-on-fizibilite/reporting";
import { createPdfExportDocument } from "../src/lib/calculations/reporting";
import {
  makeCalculationRequest,
  makeRawCurrentLawInput,
  normalizeCurrentLawFixture,
} from "./fixtures/ruhsat-on-fizibilite-fixtures";

function inspectPdf(pdfPath: string): { pageCount: number; text: string } {
  const script = `
import json
import sys
from pypdf import PdfReader

reader = PdfReader(sys.argv[1])
print(json.dumps({"pageCount": len(reader.pages), "text": "\\n".join((page.extract_text() or "") for page in reader.pages)}, ensure_ascii=False))
`;
  const result = spawnSync("python", ["-X", "utf8", "-", pdfPath], {
    input: script,
    encoding: "utf-8",
  });
  if (result.status !== 0) throw new Error(result.stderr || "PDF inspection failed.");
  return JSON.parse(result.stdout) as { pageCount: number; text: string };
}

async function main() {
  const rawInput = makeRawCurrentLawInput();
  const calculation = calculateRuhsatFeasibility(
    makeCalculationRequest(normalizeCurrentLawFixture()),
    CURRENT_RULE_SNAPSHOT
  );

  assert.equal(calculation.ok, true, "Rapor fixture analizi hesaplanabilmeli.");
  if (!calculation.ok) throw new Error("Rapor fixture analizi hesaplanamadı.");

  const generatedAt = "22 Ağustos 2026 10:30";
  const pdfSnapshot = buildRuhsatPdfSnapshot(calculation.value, rawInput, generatedAt);
  const exported = buildRuhsatAnalysisExport(rawInput, calculation.value, "2026-08-22T10:30:00.000Z");
  assert.equal(exported.schemaVersion, "ruhsat-on-fizibilite-export@1");
  assert.equal(exported.analysis.versions.ruleSnapshot, calculation.value.versions.ruleSnapshot);
  assert.deepEqual(exported.rawInput, rawInput, "JSON dışa aktarımı kullanıcı girdisini değiştirmemeli.");
  assert.equal(pdfSnapshot.highlights.length, 4, "PDF ilk görünümde dört özet metrik taşımalı.");
  assert(pdfSnapshot.sections.some((section) => section.title === "Daire senaryoları"));
  assert(pdfSnapshot.footnotes.some((note) => note.includes("sunucuya gönderilmez")));

  const temporaryDirectory = await fs.mkdtemp(path.join(os.tmpdir(), "ruhsat-report-"));
  const pdfPath = path.join(temporaryDirectory, "ruhsat-on-fizibilite.pdf");
  const keepArtifact = process.env.RUHSAT_REPORT_KEEP === "1";

  try {
    const pdf = createPdfExportDocument(pdfSnapshot);
    await fs.writeFile(pdfPath, Buffer.from(pdf.output("arraybuffer")));

    const inspection = inspectPdf(pdfPath);
    const text = inspection.text.replace(/\s+/g, " ").trim();
    assert(inspection.pageCount >= 1, "Ruhsat raporu en az bir sayfa üretmeli.");
    assert(text.includes("Ruhsat Ön Fizibilite Raporu"), "PDF başlığı korunmalı.");
    assert(text.toLocaleLowerCase("tr-TR").includes("daire senaryoları"), "PDF senaryo özetini içermeli.");
    assert(text.includes("Kural snapshot"), "PDF sürüm izini içermeli.");
    assert(!text.includes("REQUIRES_CONFIRMATION"), "PDF kullanıcıya ham teknik enum göstermemeli.");
    assert(text.includes(generatedAt), "PDF sabit üretim tarihini içermeli.");

    console.log(JSON.stringify({ status: "ok", pageCount: inspection.pageCount, scenarioCount: calculation.value.scenarios.length, pdfPath: keepArtifact ? pdfPath : undefined }, null, 2));
  } finally {
    if (!keepArtifact) await fs.rm(temporaryDirectory, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
