import fs from "node:fs/promises";
import path from "node:path";
import { performance } from "node:perf_hooks";

const DEFAULT_FIXTURE_DIR = ".poc/fixtures";
const DEFAULT_OUTPUT = "artifacts/dwg-dxf-phase1/node-results.json";
const DEFAULT_REPEATS = 2;
const MIN_DXF_BUFFER_BYTES = 4 * 1024 * 1024;
const MAX_DXF_BUFFER_BYTES = 256 * 1024 * 1024;

function median(values) {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle];
}

function roundMs(value) {
  return Math.round(value * 100) / 100;
}

function countCollection(value) {
  if (!value) return 0;
  if (typeof value.length === "number") return value.length;
  if (typeof value.size === "number") return value.size;
  if (typeof value.count === "number") return value.count;
  if (typeof value[Symbol.iterator] === "function") {
    let count = 0;
    for (const _item of value) count += 1;
    return count;
  }
  return 0;
}

function notificationMessage(event) {
  if (!event || typeof event !== "object") return String(event ?? "");
  const message = event.message ?? event.Message ?? event.error ?? event.Error;
  return typeof message === "string" ? message : JSON.stringify(event);
}

function exactArrayBuffer(buffer) {
  return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
}

function usedUint8Length(buffer) {
  for (let index = buffer.length - 1; index >= 0; index -= 1) {
    if (buffer[index] !== 0) return index + 1;
  }
  return 0;
}

function memorySnapshot() {
  const value = process.memoryUsage();
  return {
    rss: value.rss,
    heapUsed: value.heapUsed,
    external: value.external,
    arrayBuffers: value.arrayBuffers,
  };
}

function resolveReader(acad) {
  const Reader = acad.DwgReader;
  if (!Reader) throw new Error("@node-projects/acad-ts DwgReader export not found");
  const staticRead = Reader.readFromStream ?? Reader.ReadFromStream;
  if (typeof staticRead !== "function") {
    throw new Error("DwgReader readFromStream/ReadFromStream API not found");
  }
  return { Reader, staticRead };
}

function resolveWriter(acad) {
  const Writer = acad.DxfWriter;
  if (!Writer) throw new Error("@node-projects/acad-ts DxfWriter export not found");
  const staticWrite = Writer.writeToStream ?? Writer.WriteToStream;
  if (typeof staticWrite !== "function") {
    throw new Error("DxfWriter writeToStream/WriteToStream API not found");
  }
  return { Writer, staticWrite };
}

function writeAsciiDxfAdaptive({ Writer, staticWrite }, document, sourceBytes, warnings) {
  let capacity = Math.max(MIN_DXF_BUFFER_BYTES, sourceBytes * 4);
  let attempts = 0;

  while (capacity <= MAX_DXF_BUFFER_BYTES) {
    attempts += 1;
    const target = new Uint8Array(capacity);
    try {
      staticWrite.call(
        Writer,
        target,
        document,
        false,
        undefined,
        (_sender, event) => warnings.push(notificationMessage(event))
      );
      const usedBytes = usedUint8Length(target);
      return {
        bytes: target.subarray(0, usedBytes),
        capacityBytes: capacity,
        attempts,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (!/buffer is too small|too small/i.test(message) || capacity === MAX_DXF_BUFFER_BYTES) {
        throw error;
      }
      capacity = Math.min(capacity * 2, MAX_DXF_BUFFER_BYTES);
    }
  }

  throw new Error(`DXF output exceeded ${MAX_DXF_BUFFER_BYTES} bytes`);
}

function inspectDxf(bytes) {
  const head = Buffer.from(bytes.subarray(0, Math.min(bytes.length, 4096))).toString("latin1");
  const tail = Buffer.from(bytes.subarray(Math.max(0, bytes.length - 2048))).toString("latin1");
  return {
    hasSection: /\bSECTION\b/.test(head),
    hasHeader: /\bHEADER\b/.test(head),
    hasEof: /\bEOF\b/.test(tail),
  };
}

async function readPackageVersion() {
  try {
    const raw = await fs.readFile("node_modules/@node-projects/acad-ts/package.json", "utf8");
    return JSON.parse(raw).version ?? "unknown";
  } catch {
    return "unknown";
  }
}

async function benchmarkOne(acad, filePath, repeats) {
  const source = await fs.readFile(filePath);
  const magic = source.subarray(0, 6).toString("ascii");
  const reader = resolveReader(acad);
  const writer = resolveWriter(acad);
  const runs = [];

  for (let repeat = 0; repeat < repeats; repeat += 1) {
    if (typeof global.gc === "function") global.gc();
    const memoryBefore = memorySnapshot();
    const readWarnings = [];
    const writeWarnings = [];

    const readStarted = performance.now();
    const document = reader.staticRead.call(
      reader.Reader,
      exactArrayBuffer(source),
      (_sender, event) => readWarnings.push(notificationMessage(event))
    );
    const readMs = performance.now() - readStarted;
    const memoryAfterRead = memorySnapshot();

    const entityCount = countCollection(document?.modelSpace?.entities);
    const layerCount = countCollection(document?.layers);
    const blockCount = countCollection(document?.blockRecords ?? document?.blocks);

    const writeStarted = performance.now();
    const output = writeAsciiDxfAdaptive(writer, document, source.byteLength, writeWarnings);
    const writeMs = performance.now() - writeStarted;
    const memoryAfterWrite = memorySnapshot();
    const dxfInspection = inspectDxf(output.bytes);

    runs.push({
      repeat: repeat + 1,
      readMs: roundMs(readMs),
      writeMs: roundMs(writeMs),
      totalMs: roundMs(readMs + writeMs),
      outputBytes: output.bytes.byteLength,
      outputCapacityBytes: output.capacityBytes,
      outputAttempts: output.attempts,
      entityCount,
      layerCount,
      blockCount,
      readWarnings: [...new Set(readWarnings)].slice(0, 50),
      writeWarnings: [...new Set(writeWarnings)].slice(0, 50),
      dxfInspection,
      memory: {
        before: memoryBefore,
        afterRead: memoryAfterRead,
        afterWrite: memoryAfterWrite,
      },
    });
  }

  return {
    file: path.basename(filePath),
    magic,
    sourceBytes: source.byteLength,
    success: true,
    medianReadMs: roundMs(median(runs.map((run) => run.readMs))),
    medianWriteMs: roundMs(median(runs.map((run) => run.writeMs))),
    medianTotalMs: roundMs(median(runs.map((run) => run.totalMs))),
    outputBytes: runs.at(-1)?.outputBytes ?? null,
    entityCount: runs.at(-1)?.entityCount ?? null,
    layerCount: runs.at(-1)?.layerCount ?? null,
    blockCount: runs.at(-1)?.blockCount ?? null,
    dxfInspection: runs.at(-1)?.dxfInspection ?? null,
    runs,
  };
}

async function main() {
  const fixtureDir = process.env.DWG_BENCH_DIR || DEFAULT_FIXTURE_DIR;
  const outputPath = process.env.DWG_BENCH_OUTPUT || DEFAULT_OUTPUT;
  const repeats = Math.max(1, Number(process.env.DWG_BENCH_REPEATS || DEFAULT_REPEATS));
  const entries = await fs.readdir(fixtureDir, { withFileTypes: true });
  const files = entries
    .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".dwg"))
    .map((entry) => path.join(fixtureDir, entry.name))
    .sort();

  if (files.length === 0) throw new Error(`No DWG fixtures found in ${fixtureDir}`);

  const acad = await import("@node-projects/acad-ts");
  const packageVersion = await readPackageVersion();
  const results = [];

  for (const filePath of files) {
    try {
      const result = await benchmarkOne(acad, filePath, repeats);
      results.push(result);
      console.log(
        `[dwg-node] ${result.file}: ${result.magic} ${result.medianTotalMs} ms, ` +
          `${result.entityCount} entities, ${result.outputBytes} DXF bytes`
      );
    } catch (error) {
      const source = await fs.readFile(filePath);
      const message = error instanceof Error ? error.stack || error.message : String(error);
      results.push({
        file: path.basename(filePath),
        magic: source.subarray(0, 6).toString("ascii"),
        sourceBytes: source.byteLength,
        success: false,
        error: message,
      });
      console.error(`[dwg-node] ${path.basename(filePath)} failed: ${message}`);
    }
  }

  const report = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    runtime: {
      node: process.version,
      platform: process.platform,
      arch: process.arch,
      acadTsVersion: packageVersion,
      repeats,
    },
    summary: {
      files: results.length,
      succeeded: results.filter((result) => result.success).length,
      failed: results.filter((result) => !result.success).length,
      medianTotalMs: roundMs(
        median(results.filter((result) => result.success).map((result) => result.medianTotalMs))
      ),
    },
    results,
  };

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`);

  if (report.summary.succeeded === 0) {
    process.exitCode = 1;
  }
}

await main();
