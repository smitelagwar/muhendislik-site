import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { parseIde10 } from "../../src/lib/hsyncad/ide-import";
import * as ideExport from "../../src/lib/hsyncad/ide-export";
import { transcodeIde11TrialToIde10, type Ide10TranscodeDiagnostics } from "../../src/lib/hsyncad/ide-import/ide11-transcoder";
import {
  getIdeCarrierFormat,
  IDE10_VERSION,
  validateIdeCarrier,
  verifyIdeHeaderChecksum,
  type NativeIdeFormat,
} from "../../src/lib/hsyncad/ide-import/ide-binary-codec";

type TargetFormat = "ide11" | "ide10";
type TargetFilter = TargetFormat | "all";
type TranscodeFn = (sourceBuffer: ArrayBuffer | Uint8Array) => Uint8Array;

interface CliOptions {
  help: boolean;
  inputPath?: string;
  outDir?: string;
  to?: TargetFilter;
  donorPath?: string;
  force: boolean;
  backupDir?: string;
}

const USAGE = [
  "Usage:",
  "  npx tsx scripts/hsyncad/convert_trial_to_native.ts <input-path> [options]",
  "  npx tsx scripts/hsyncad/convert_trial_to_native.ts --input <path> [options]",
  "",
  "Options:",
  "  --input <path>       Input .ide11trial (or .ide10) file path (required)",
  "  --out-dir <dir>      Output directory (default: directory of input file)",
  "  --to <target>        Target format: ide11 | ide10 | all",
  "                       (trial input default: ide11; --to ide10 and --to all now",
  "                       perform the real v11->v10 body conversion — T-F3.3)",
  "  --donor <path>       Optional paired native .ide10 of the SAME project",
  "                       (fills unestablished-layout regions; recommended)",
  "  --force              Allow overwriting existing output files or equal input path",
  "  --backup-dir <dir>   Optional directory for additional backup copies",
  "  -h, --help           Show this help message",
].join("\n");

function sha256(buf: Uint8Array | Buffer): string {
  return crypto.createHash("sha256").update(buf).digest("hex");
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return new Uint8Array(bytes).buffer;
}

function canonicalComparePath(targetPath: string): string {
  const resolved = path.resolve(targetPath);
  try {
    const real = fs.existsSync(resolved) ? fs.realpathSync(resolved) : resolved;
    return process.platform === "win32" ? real.toLowerCase() : real;
  } catch {
    return process.platform === "win32" ? resolved.toLowerCase() : resolved;
  }
}

function parseCliArgs(argv: string[]): CliOptions {
  const options: CliOptions = { help: false, force: false };
  let positionalOnly = false;

  const takeValue = (flag: string, inlineValue: string | undefined, index: number): { value: string; nextIndex: number } => {
    const value = inlineValue ?? argv[index + 1];
    if (value === undefined || (inlineValue === undefined && value.startsWith("-"))) {
      throw new Error(`Missing value for ${flag}.`);
    }
    if (value.trim() === "") {
      throw new Error(`Empty value provided for ${flag}.`);
    }
    return { value, nextIndex: inlineValue !== undefined ? index : index + 1 };
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (!positionalOnly && arg === "--") {
      positionalOnly = true;
      continue;
    }
    if (!positionalOnly && (arg === "-h" || arg === "--help")) {
      options.help = true;
      continue;
    }
    if (!positionalOnly && arg === "--force") {
      options.force = true;
      continue;
    }
    if (!positionalOnly && (arg === "--input" || arg.startsWith("--input="))) {
      if (options.inputPath !== undefined) {
        throw new Error("Multiple input paths provided.");
      }
      const inline = arg.startsWith("--input=") ? arg.slice("--input=".length) : undefined;
      const { value, nextIndex } = takeValue("--input", inline, i);
      options.inputPath = value;
      i = nextIndex;
      continue;
    }
    if (!positionalOnly && (arg === "--out-dir" || arg.startsWith("--out-dir="))) {
      const inline = arg.startsWith("--out-dir=") ? arg.slice("--out-dir=".length) : undefined;
      const { value, nextIndex } = takeValue("--out-dir", inline, i);
      options.outDir = value;
      i = nextIndex;
      continue;
    }
    if (!positionalOnly && (arg === "--to" || arg.startsWith("--to="))) {
      const inline = arg.startsWith("--to=") ? arg.slice("--to=".length) : undefined;
      const { value, nextIndex } = takeValue("--to", inline, i);
      if (value !== "ide11" && value !== "ide10" && value !== "all") {
        throw new Error(`Invalid --to value "${value}". Expected one of: ide11, ide10, all.`);
      }
      options.to = value;
      i = nextIndex;
      continue;
    }
    if (!positionalOnly && (arg === "--backup-dir" || arg.startsWith("--backup-dir="))) {
      const inline = arg.startsWith("--backup-dir=") ? arg.slice("--backup-dir=".length) : undefined;
      const { value, nextIndex } = takeValue("--backup-dir", inline, i);
      options.backupDir = value;
      i = nextIndex;
      continue;
    }
    if (!positionalOnly && (arg === "--donor" || arg.startsWith("--donor="))) {
      const inline = arg.startsWith("--donor=") ? arg.slice("--donor=".length) : undefined;
      const { value, nextIndex } = takeValue("--donor", inline, i);
      options.donorPath = value;
      i = nextIndex;
      continue;
    }
    if (!positionalOnly && arg.startsWith("-")) {
      throw new Error(`Unknown option: ${arg}`);
    }
    if (options.inputPath !== undefined) {
      throw new Error(`Unexpected extra positional argument: ${arg}`);
    }
    options.inputPath = arg;
  }

  if (!options.help && !options.inputPath) {
    throw new Error(`Input file path is required.\n\n${USAGE}`);
  }
  return options;
}

function resolveTargets(sourceFormat: NativeIdeFormat, to?: TargetFilter): TargetFormat[] {
  if (sourceFormat === "ide11trial") {
    // T-F3.3: v11→v10 gerçek gövde dönüşümü artık destekli. Trial girdide
    // varsayılan hedef --to ide11; --to ide10 ve --to all gerçek dönüşümü üretir.
    if (to === "ide10") return ["ide10"];
    if (to === "all") return ["ide11", "ide10"];
    return ["ide11"];
  }
  if (sourceFormat === "ide10") {
    if (to === "ide10") {
      throw new Error("Input file is already .ide10; cannot convert .ide10 to .ide10.");
    }
    return ["ide11"];
  }
  if (sourceFormat === "ide11") {
    if (to !== "ide10") {
      throw new Error("Input file is already commercial .ide11; no other target is currently available.");
    }
    return ["ide10"];
  }
  throw new Error(`Unsupported source format "${sourceFormat}" for native conversion.`);
}

function assertSafeDestination(destPath: string, inputPath: string, force: boolean): void {
  if (force) return;
  if (canonicalComparePath(destPath) === canonicalComparePath(inputPath)) {
    throw new Error(
      `Refusing to overwrite input file "${inputPath}". Use --out-dir or pass --force to allow overwriting.`,
    );
  }
  if (fs.existsSync(destPath)) {
    throw new Error(
      `Refusing to overwrite existing output file "${destPath}". Pass --force to overwrite.`,
    );
  }
}

async function main() {
  const options = parseCliArgs(process.argv.slice(2));
  if (options.help) {
    console.log(USAGE);
    return;
  }

  const inputPath = path.resolve(options.inputPath!);
  if (!fs.existsSync(inputPath) || !fs.statSync(inputPath).isFile()) {
    throw new Error(`Input file not found: ${inputPath}`);
  }

  const outDir = path.resolve(options.outDir ?? path.dirname(inputPath));
  const backupDir = options.backupDir ? path.resolve(options.backupDir) : undefined;
  const ext = path.extname(inputPath);
  const baseName = path.basename(inputPath, ext);
  if (!baseName) {
    throw new Error(`Could not derive safe base filename from: ${inputPath}`);
  }

  const sourceBytes = new Uint8Array(fs.readFileSync(inputPath));
  const sourceHash = sha256(sourceBytes);

  const sourceCarrier = validateIdeCarrier(sourceBytes);
  const sourceFormat = getIdeCarrierFormat(sourceBytes, sourceCarrier);
  const targets = resolveTargets(sourceFormat, options.to);

  // T-F3.3: --donor ile eş proje .ide10 donörü (yalnız .ide10 hedefi için anlamlı).
  let donorBytes: Uint8Array | undefined;
  if (options.donorPath) {
    if (!targets.includes("ide10")) {
      throw new Error("--donor yalnız .ide10 hedefiyle anlamlıdır; --to ide10 veya --to all kullanın.");
    }
    const donorPath = path.resolve(options.donorPath);
    if (!fs.existsSync(donorPath) || !fs.statSync(donorPath).isFile()) {
      throw new Error(`Donör dosyası bulunamadı: ${donorPath}`);
    }
    donorBytes = new Uint8Array(fs.readFileSync(donorPath));
    const donorCarrier = validateIdeCarrier(donorBytes);
    if (donorCarrier.formatVersion !== IDE10_VERSION || donorCarrier.encodedFlag !== 0) {
      throw new Error(`Donör v10 (201094, encoded=0) olmalı: sürüm ${donorCarrier.formatVersion}, encoded ${donorCarrier.encodedFlag}.`);
    }
    console.log(`[1] Donor: ${donorPath}`);
    console.log(`    Size: ${donorBytes.length.toLocaleString()} bytes, SHA-256: ${sha256(donorBytes)}`);
  }

  const transcodeIde10ToIde11 = (ideExport as { transcodeIde10ToIde11?: TranscodeFn }).transcodeIde10ToIde11;
  if (sourceFormat === "ide10" && typeof transcodeIde10ToIde11 !== "function") {
    throw new Error(
      "transcodeIde10ToIde11 is not exported by src/lib/hsyncad/ide-export.ts; .ide10 -> .ide11 conversion is not available yet.",
    );
  }

  const plannedOutputs = targets.map(target => ({
    target,
    outputPath: path.join(outDir, `${baseName}.${target}`),
    backupPath: backupDir ? path.join(backupDir, `${baseName}.${target}`) : undefined,
  }));

  for (const plan of plannedOutputs) {
    assertSafeDestination(plan.outputPath, inputPath, options.force);
    if (plan.backupPath) {
      assertSafeDestination(plan.backupPath, inputPath, options.force);
    }
  }

  console.log("================================================================================");
  console.log(`HSYNCAD NATIVE TRANSCODER: ${sourceFormat} -> ${targets.map(t => `.${t}`).join(" & ")}`);
  console.log("================================================================================\n");

  console.log(`[1] Loaded Source File: ${inputPath}`);
  console.log(`    Size: ${sourceBytes.length.toLocaleString()} bytes`);
  console.log(`    SHA-256: ${sourceHash}`);
  console.log(
    `    Carrier: Format ${sourceFormat}, Version ${sourceCarrier.formatVersion}, Encoded: ${sourceCarrier.encodedFlag}, Name: "${sourceCarrier.projectName}"`,
  );

  const sourceProject = parseIde10(
    toArrayBuffer(sourceBytes),
    path.basename(inputPath),
  );
  console.log(`    Floors: ${sourceProject.floors.length} (${sourceProject.floors.map(f => f.name).join(", ")})`);
  console.log(`    Total Elements: ${sourceProject.elements.length}`);
  console.log(`    Breakdown:`, sourceProject.coverage.byType);

  const generated: Array<{
    target: TargetFormat;
    outputPath: string;
    backupPath?: string;
    bytes: Uint8Array;
  }> = [];

  for (let idx = 0; idx < plannedOutputs.length; idx++) {
    const plan = plannedOutputs[idx];
    const step = idx + 2;
    console.log(`\n[${step}] Transcoding to .${plan.target}...`);

    let outBytes: Uint8Array;
    if (plan.target === "ide11") {
      outBytes = sourceFormat === "ide10"
        ? transcodeIde10ToIde11!(sourceBytes)
        : ideExport.transcodeIde11TrialToIde11(sourceBytes);
    } else {
      const diagnostics = {} as Ide10TranscodeDiagnostics;
      outBytes = transcodeIde11TrialToIde10(
        sourceBytes,
        donorBytes ? { ide10Donor: donorBytes, diagnostics } : { diagnostics },
      );
      // Dönüşüm tanıklama özeti (T-F3.3): gerçek ölçülen değerler.
      console.log(`    Frames rewritten: ${diagnostics.frames?.rewritten ?? "?"} (native 201094 kept: ${diagnostics.frames?.native201094 ?? "?"}, prelude flags cleared: ${diagnostics.frames?.preludeFlagsCleared ?? "?"})`);
      console.log(`    Label splices (beam + wall sections): ${diagnostics.labelSplices?.beam ?? "?"}`);
      if (diagnostics.donor) {
        const dn = diagnostics.donor;
        console.log(`    Donor regions: pre-floor [${dn.preFloorSplice.workFrom}..${dn.preFloorSplice.workTo}) <- donor [${dn.preFloorSplice.donorFrom}..${dn.preFloorSplice.donorTo})`);
        console.log(`    R1: ${dn.r1.records} records, ${dn.r1.slotsBitExact} slots bit-exact, ${dn.r1.slotsDonorFallback} donor slots${dn.r1.donorSlots.length ? ` (${dn.r1.donorSlots.join(",")})` : ""}`);
        console.log(`    R3: ${dn.r3.patches} patches, changed bytes ${dn.r3.patchesChangedBytes}, fields bit-exact: ${dn.r3.fieldsBitExact}`);
        console.log(`    R4: wall ${dn.r4.wall}, beam ${dn.r4.beam}, raft ${dn.r4.raft}; blocks verified ${dn.r4.blocksVerified}, mismatches ${dn.r4.blockMismatches}, tuple unresolved ${dn.r4.tupleUnresolved}`);
        console.log(`    R5: ${dn.r5.tables} modal tables, region byte-equal to donor: ${dn.r5.regionBytesEqual}`);
        console.log(`    Spectrum fields bit-exact: ${dn.spectrum.fieldsBitExact}`);
      } else {
        console.log(`    Donor: none — unestablished-layout regions keep their v11 layout (analytic reads may be partial).`);
      }
    }

    const chk = verifyIdeHeaderChecksum(outBytes);
    if (!chk.valid) {
      throw new Error(`${plan.target.toUpperCase()} checksum validation failed: stored=${chk.stored}, computed=${chk.computed}`);
    }
    const outCarrier = validateIdeCarrier(outBytes);
    const outFormat = getIdeCarrierFormat(outBytes, outCarrier);
    if (plan.target === "ide11") {
      // The v11 carrier keeps the source schema version: ideCAD 11.28 writes 211280 and
      // closes any file it does not recognise, so the version may not be rewritten.
      if (outCarrier.formatVersion !== sourceCarrier.formatVersion) {
        throw new Error(
          `IDE11 carrier version mismatch: source ${sourceCarrier.formatVersion}, output ${outCarrier.formatVersion}.`,
        );
      }
      if (outFormat !== "ide11" && outFormat !== "ide11trial") {
        throw new Error(`IDE11 carrier format mismatch: got "${outFormat}".`);
      }
    } else if (outFormat !== "ide10" || outCarrier.formatVersion !== IDE10_VERSION) {
      throw new Error(
        `IDE10 carrier mismatch: expected "${plan.target}" @ ${IDE10_VERSION}, got "${outFormat}" @ ${outCarrier.formatVersion}.`,
      );
    }

    console.log(`    ${plan.target.toUpperCase()} Checksum: VALID (0x${chk.computed.toString(16)})`);
    console.log(`    Carrier: Format ${outFormat}, Version ${outCarrier.formatVersion}, Encoded: ${outCarrier.encodedFlag}`);

    const reparsed = parseIde10(
      toArrayBuffer(outBytes),
      `${baseName}.${plan.target}`,
    );
    console.log(`    Reparsed Floors: ${reparsed.floors.length}`);
    console.log(`    Reparsed Elements: ${reparsed.elements.length}`);
    console.log(`    Breakdown:`, reparsed.coverage.byType);

    if (sha256(sourceBytes) !== sourceHash) {
      throw new Error("Internal error: sourceBytes was mutated during transcoding.");
    }

    generated.push({ ...plan, bytes: outBytes });
  }

  fs.mkdirSync(outDir, { recursive: true });
  if (backupDir) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const writeFlag = options.force ? "w" : "wx";
  for (const item of generated) {
    fs.writeFileSync(item.outputPath, Buffer.from(item.bytes), { flag: writeFlag });
    console.log(`    Saved: ${item.outputPath} (${item.bytes.length.toLocaleString()} bytes, SHA-256: ${sha256(item.bytes)})`);

    if (item.backupPath && canonicalComparePath(item.backupPath) !== canonicalComparePath(item.outputPath)) {
      fs.writeFileSync(item.backupPath, Buffer.from(item.bytes), { flag: writeFlag });
      console.log(`    Backup saved: ${item.backupPath}`);
    }
  }

  console.log("\n================================================================================");
  console.log("TRANSCODING COMPLETED SUCCESSFULLY!");
  console.log("All generated files verified and written safely.");
  console.log("================================================================================");
}

main().catch(err => {
  console.error("FATAL ERROR:", err instanceof Error ? err.message : err);
  process.exit(1);
});
