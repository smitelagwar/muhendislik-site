#!/usr/bin/env node
/**
 * CLI Tool: End-to-End Model Solve, Design, and Single-PDF Report Flow (P17 + IDE Source Parity)
 *
 * STATUS for `--model`: QUARANTINED (Mechanical Safety Quarantine)
 * Direct CadModel-to-Single-PDF reporting flow is unvalidated and quarantined.
 * When invoked with `--model`, this tool deterministically fails and exits non-zero
 * with an explicit unsupported pipeline diagnostic. No PDF file is produced or written.
 *
 * When invoked with `--ide <file.ide10|.ide11trial> --output <report.pdf>`,
 * runs the verified 2-pass IDE source + net Metraj PDF pipeline (`createIdeSourcePdf`).
 *
 * Usage:
 *   npx tsx scripts/hsyncad/model-report-flow.ts --model <model.json> --output <report.pdf>
 *   npx tsx scripts/hsyncad/model-report-flow.ts --ide <project.ide10> --output <report.pdf>
 */

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { validateModel, type CadModel } from "../../src/lib/hsyncad/model.js";
import { parseIde10 } from "../../src/lib/hsyncad/ide-import/index.js";
import { importIdeWorkspace } from "../../src/lib/hsyncad/ide-workspace.js";
import { createIdeSourcePdf } from "../../src/lib/hsyncad/ide-source-report.js";
import {
  computeModelFingerprint,
  generateModelProjectReport,
  UnsupportedPipelineError,
} from "../../src/lib/hsyncad/reporting/model-report-adapter.js";

function parseArgs(argv: string[]): {
  modelPath: string | null;
  idePath: string | null;
  outputPath: string | null;
  scope: "all" | "active_floor";
  floorName: string | undefined;
} {
  let modelPath: string | null = null;
  let idePath: string | null = null;
  let outputPath: string | null = null;
  let scope: "all" | "active_floor" = "all";
  let floorName: string | undefined;

  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--model" || arg === "-m" || arg === "--input" || arg === "-i") {
      modelPath = argv[++i] || null;
    } else if (arg === "--ide") {
      idePath = argv[++i] || null;
    } else if (arg === "--output" || arg === "-o") {
      outputPath = argv[++i] || null;
    } else if (arg === "--scope") {
      const val = argv[++i];
      if (val === "active_floor" || val === "all") scope = val;
    } else if (arg === "--floor") {
      floorName = argv[++i] || undefined;
    } else if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    }
  }

  return { modelPath, idePath, outputPath, scope, floorName };
}

function printHelp(): void {
  console.log(`
Hsyncad - End-to-End Model / IDE Source Single-PDF Report Flow

Usage:
  npx tsx scripts/hsyncad/model-report-flow.ts [options]

Options:
  --model, -m    <path>   Path to CadModel JSON file (QUARANTINED: exits non-zero, writes no PDF)
  --ide          <path>   Path to .ide10 / .ide11trial source file (runs 2-pass unified PDF)
  --output, -o   <path>   Path to destination PDF file
  --scope        <mode>   all | active_floor (default: all)
  --floor        <name>   Target floor name when --scope active_floor
  --help, -h              Show this help message
`);
}

async function runIdeSourceFlow(
  idePath: string,
  outputPath: string | null,
  scope: "all" | "active_floor",
  floorName: string | undefined
): Promise<void> {
  const resolvedIde = path.resolve(process.cwd(), idePath);
  if (!fs.existsSync(resolvedIde)) {
    console.error(`Error: IDE file does not exist: ${resolvedIde}`);
    process.exit(1);
  }
  const buf = fs.readFileSync(resolvedIde);
  const sha256 = crypto.createHash("sha256").update(buf).digest("hex");
  const arrayBuf = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
  const filename = path.basename(resolvedIde);
  const source = parseIde10(arrayBuf, filename);
  const cadModel = importIdeWorkspace(source);
  const revision = crypto.createHash("sha256").update(JSON.stringify(cadModel)).digest("hex").slice(0, 16);

  const pdfBytes = createIdeSourcePdf(source, sha256, revision, {
    scope,
    activeFloorName: floorName,
    cadModel,
    deductFormworkOverlaps: true,
    metraj: { enabled: true, kalip: true, beton: true, donati: true, detay: true },
  });

  const outTarget = outputPath
    ? path.resolve(process.cwd(), outputPath)
    : path.resolve(process.cwd(), `${filename.replace(/\.[^.]+$/, "")}-statik-metraj-raporu.pdf`);
  fs.writeFileSync(outTarget, pdfBytes);
  console.log(`[Hsyncad IDE Report] Generated ${pdfBytes.length} bytes -> ${outTarget}`);
}

async function main(): Promise<void> {
  const { modelPath, idePath, outputPath, scope, floorName } = parseArgs(process.argv);

  if (idePath && !modelPath) {
    await runIdeSourceFlow(idePath, outputPath, scope, floorName);
    return;
  }

  if (!modelPath) {
    console.error("Error: --model or --ide parameter is required.");
    printHelp();
    process.exit(1);
  }

  const resolvedModel = path.resolve(process.cwd(), modelPath);
  if (!fs.existsSync(resolvedModel)) {
    console.error(`Error: Model file does not exist: ${resolvedModel}`);
    process.exit(1);
  }

  let rawContent: string;
  try {
    rawContent = fs.readFileSync(resolvedModel, "utf-8");
  } catch (err) {
    console.error(`Error reading model file: ${err}`);
    process.exit(1);
  }

  let rawModel: CadModel;
  try {
    rawModel = JSON.parse(rawContent);
  } catch (err) {
    console.error(`Error parsing JSON: ${err}`);
    process.exit(1);
  }

  const model = validateModel(rawModel);
  const fingerprint = computeModelFingerprint(model);
  console.log(`[Hsyncad P17 Quarantine] Model loaded. Fingerprint: ${fingerprint.slice(0, 16)}...`);

  // Explicit quarantined pipeline diagnostic check
  console.error(`[Hsyncad P17 Quarantine] ERROR: Direct model-to-report pipeline is mechanically quarantined.`);
  console.error(`[Hsyncad P17 Quarantine] Dynamic reinforcement synthesis and unvalidated approximations are strictly prohibited.`);
  console.error(`[Hsyncad P17 Quarantine] No PDF file will be produced or written.`);

  try {
    generateModelProjectReport(model);
  } catch (err) {
    if (err instanceof UnsupportedPipelineError) {
      console.error(`[Hsyncad P17 Quarantine] Diagnostic Code: ${err.diagnostic.code}`);
      console.error(`[Hsyncad P17 Quarantine] Diagnostic Reason: ${err.diagnostic.details.reason}`);
      console.error(`[Hsyncad P17 Quarantine] Required Action: ${err.diagnostic.details.requiredAction}`);
    } else {
      console.error(`[Hsyncad P17 Quarantine] Unexpected error:`, err);
    }
  }

  // Strictly exit non-zero without writing any output PDF
  if (outputPath) {
    const resolvedOut = path.resolve(process.cwd(), outputPath);
    if (fs.existsSync(resolvedOut)) {
      // Do not touch existing files, but ensure we did not write it
    }
  }

  process.exit(1);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
