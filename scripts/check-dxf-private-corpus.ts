import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { decodeDxfBytes, detectDxfEncoding } from "../src/lib/dokumantasyon/dxf-encoding";
import { auditDxfText, getDxfStage2BlockingIssues } from "../src/lib/dokumantasyon/dxf-fidelity-audit";
import {
  auditDxfReleaseHardening,
  getDxfReleaseHardeningBlockingIssues,
} from "../src/lib/dokumantasyon/dxf-release-hardening";
import { auditDxfStage3, getDxfStage3BlockingIssues } from "../src/lib/dokumantasyon/dxf-stage3-fidelity";
import { auditDxfStage4, getDxfStage4BlockingIssues } from "../src/lib/dokumantasyon/dxf-stage4-fidelity";
import { buildDxfStage5DiagnosticsReport } from "../src/lib/dokumantasyon/dxf-stage5-diagnostics";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const corpusDir = path.join(root, "tests", "private-dxf-corpus");
const manifestPath = path.join(corpusDir, "manifest.local.json");

type ExpectedStatus = "clean" | "warning" | "blocked";
type Manifest = Record<string, ExpectedStatus>;

async function exists(filePath: string) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  if (!(await exists(manifestPath))) {
    console.log("Private DXF corpus manifest bulunamadı; public CI için bu kontrol bilinçli olarak skip edildi.");
    return;
  }

  const manifest = JSON.parse(await readFile(manifestPath, "utf8")) as Manifest;
  const observed: Array<{ file: string; expected: ExpectedStatus; actual: ExpectedStatus; warnings: number; blocking: number }> = [];

  for (const [fileName, expected] of Object.entries(manifest)) {
    assert.ok(fileName.toLowerCase().endsWith(".dxf"), `${fileName}: corpus girdisi DXF olmalı`);
    assert.ok(["clean", "warning", "blocked"].includes(expected), `${fileName}: geçersiz expected status`);
    const filePath = path.join(corpusDir, fileName);
    assert.ok(await exists(filePath), `${fileName}: manifest girdisinin dosyası bulunamadı`);

    const source = new Uint8Array(await readFile(filePath));
    const encoding = detectDxfEncoding(source);
    assert.equal(encoding.isBinary, false, `${fileName}: binary DXF bu viewer tarafından desteklenmiyor`);
    const text = decodeDxfBytes(source, encoding.encoding);
    const audit = auditDxfText(text);
    const stage3 = auditDxfStage3(text);
    const stage4 = auditDxfStage4(text);
    const releaseHardening = auditDxfReleaseHardening(text);
    const report = buildDxfStage5DiagnosticsReport({
      encoding,
      audit,
      stage3,
      stage4,
      releaseHardening,
      stage2BlockingIssues: getDxfStage2BlockingIssues(audit),
      stage3BlockingIssues: getDxfStage3BlockingIssues(stage3),
      stage4BlockingIssues: getDxfStage4BlockingIssues(stage4),
      releaseHardeningBlockingIssues: getDxfReleaseHardeningBlockingIssues(releaseHardening),
    });

    assert.equal(report.status, expected, `${fileName}: private corpus release status changed`);
    observed.push({
      file: fileName,
      expected,
      actual: report.status,
      warnings: report.warningCount,
      blocking: report.blockingCount,
    });
  }

  console.table(observed);
  console.log(`Private DXF corpus doğrulandı: ${observed.length} gerçek/anonymized dosya.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
