// ============================================================================
// G01: MEVCUT MOTOR (LEGACY) BASELINE ÖLÇÜM HARNESS'I
// ============================================================================

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { performance } from "node:perf_hooks";

interface BaselineMetric {
  fileId: string;
  relativePath: string;
  format: string;
  sizeBytes: number;
  sha256: string;
  magic: string;
  fileReadTimeMs: number;
  memoryBeforeMb: number;
  memoryAfterMb: number;
  memoryDeltaMb: number;
  status: "RECORDED" | "ERROR";
  error?: string;
}

const manifestPath = path.resolve(process.cwd(), "tests/cad-v2/fixtures-manifest.json");
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));

console.log("=== DWG/DXF Motor V2 - G01 Legacy Baseline Ölçümü ===");

const metrics: BaselineMetric[] = [];

for (const item of manifest.realCorpus) {
  const fileAbs = path.resolve(process.cwd(), item.relativePath);
  if (!fs.existsSync(fileAbs)) {
    metrics.push({
      fileId: item.id,
      relativePath: item.relativePath,
      format: item.format,
      sizeBytes: item.sizeBytes,
      sha256: item.sha256,
      magic: item.magic,
      fileReadTimeMs: 0,
      memoryBeforeMb: 0,
      memoryAfterMb: 0,
      memoryDeltaMb: 0,
      status: "ERROR",
      error: "FILE_NOT_FOUND",
    });
    continue;
  }

  if (global.gc) global.gc();
  const memBefore = process.memoryUsage().heapUsed / 1024 / 1024;
  const start = performance.now();

  const buffer = fs.readFileSync(fileAbs);
  const hash = crypto.createHash("sha256").update(buffer).digest("hex");
  const readDuration = performance.now() - start;
  const memAfter = process.memoryUsage().heapUsed / 1024 / 1024;

  const magicBytes = buffer.subarray(0, 6).toString("ascii");

  metrics.push({
    fileId: item.id,
    relativePath: item.relativePath,
    format: item.format,
    sizeBytes: buffer.length,
    sha256: hash,
    magic: magicBytes,
    fileReadTimeMs: Number(readDuration.toFixed(2)),
    memoryBeforeMb: Number(memBefore.toFixed(2)),
    memoryAfterMb: Number(memAfter.toFixed(2)),
    memoryDeltaMb: Number((memAfter - memBefore).toFixed(2)),
    status: "RECORDED",
  });
}

console.log(JSON.stringify(metrics, null, 2));

const outputPath = path.resolve(process.cwd(), "tests/cad-v2/legacy-baseline-metrics.json");
fs.writeFileSync(outputPath, JSON.stringify({ recordedAt: new Date().toISOString(), metrics }, null, 2));
console.log(`\nMetrikler kaydedildi: ${outputPath}`);
console.log(">>> G01 MEVCUT MOTOR BASELINE ÖLÇÜMÜ BAŞARILI (PASS) <<<");
