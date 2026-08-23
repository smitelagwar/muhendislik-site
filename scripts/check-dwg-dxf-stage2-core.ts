import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import {
  convertDwgToDxf,
  DwgConversionError,
  DWG_DXF_CONVERTER_SIGNATURE,
  DWG_DXF_ENGINE_VERSION,
  inspectDwgBytes,
  supportedDwgMagics,
} from "../src/lib/dokumantasyon/dwg";

const FIXTURE_DIR = process.env.DWG_STAGE2_FIXTURE_DIR || ".poc/stage2-fixtures";
const FIXTURES = ["sample_AC1014.dwg", "sample_AC1032.dwg"] as const;

function bytes(value: string): Uint8Array {
  return new TextEncoder().encode(value);
}

function sha256(value: Uint8Array): string {
  return createHash("sha256").update(value).digest("hex");
}

function expectConversionError(fn: () => unknown, code: DwgConversionError["code"]): void {
  let caught: unknown;
  try {
    fn();
  } catch (error) {
    caught = error;
  }
  assert.ok(caught instanceof DwgConversionError, `Expected DwgConversionError(${code})`);
  assert.equal(caught.code, code);
}

async function assertEnginePin(): Promise<void> {
  const raw = await fs.readFile("node_modules/@node-projects/acad-ts/package.json", "utf8");
  const packageJson = JSON.parse(raw) as { version?: string };
  assert.equal(packageJson.version, DWG_DXF_ENGINE_VERSION);
  assert.ok(DWG_DXF_CONVERTER_SIGNATURE.includes(`acad-ts:${DWG_DXF_ENGINE_VERSION}`));
}

function assertPreflight(): void {
  const empty = inspectDwgBytes(new Uint8Array());
  assert.equal(empty.status, "invalid");
  assert.equal(empty.reasonCode, "EMPTY_INPUT");

  const short = inspectDwgBytes(bytes("AC10"));
  assert.equal(short.status, "invalid");
  assert.equal(short.reasonCode, "TRUNCATED_HEADER");

  const invalid = inspectDwgBytes(bytes("NOTDWG-but-long-enough"));
  assert.equal(invalid.status, "invalid");
  assert.equal(invalid.reasonCode, "INVALID_SIGNATURE");

  const r13 = new Uint8Array(64);
  r13.set(bytes("AC1012"));
  const unsupported = inspectDwgBytes(r13);
  assert.equal(unsupported.status, "unsupported");
  assert.equal(unsupported.reasonCode, "UNSUPPORTED_VERSION");
  expectConversionError(() => convertDwgToDxf(r13), "UNSUPPORTED_VERSION");

  assert.deepEqual(supportedDwgMagics(), [
    "AC1014",
    "AC1015",
    "AC1018",
    "AC1021",
    "AC1024",
    "AC1027",
    "AC1032",
  ]);
}

async function assertFixture(fileName: (typeof FIXTURES)[number]) {
  const filePath = path.join(FIXTURE_DIR, fileName);
  const source = new Uint8Array(await fs.readFile(filePath));
  const first = convertDwgToDxf(source);
  const second = convertDwgToDxf(source);

  assert.equal(first.signature, DWG_DXF_CONVERTER_SIGNATURE);
  assert.equal(first.inspection.status, "supported");
  assert.equal(first.inspection.magic, fileName.match(/AC\d{4}/)?.[0]);
  assert.equal(first.dxfEnvelope.valid, true);
  assert.ok(first.stats.outputBytes > 0);
  assert.ok(first.stats.entityCount >= 0);
  assert.equal(first.stats.sourceBytes, source.byteLength);

  assert.equal(Buffer.compare(Buffer.from(first.dxfBytes), Buffer.from(second.dxfBytes)), 0);
  assert.deepEqual(first.diagnostics, second.diagnostics);
  assert.deepEqual(first.dxfEnvelope, second.dxfEnvelope);
  assert.deepEqual(
    {
      outputBytes: first.stats.outputBytes,
      entityCount: first.stats.entityCount,
      layerCount: first.stats.layerCount,
      blockCount: first.stats.blockCount,
    },
    {
      outputBytes: second.stats.outputBytes,
      entityCount: second.stats.entityCount,
      layerCount: second.stats.layerCount,
      blockCount: second.stats.blockCount,
    }
  );

  return {
    fileName,
    sourceBytes: source.byteLength,
    outputBytes: first.stats.outputBytes,
    entityCount: first.stats.entityCount,
    layerCount: first.stats.layerCount,
    blockCount: first.stats.blockCount,
    diagnostics: first.diagnostics.length,
    outputSha256: sha256(first.dxfBytes),
  };
}

async function assertOutputLimit(): Promise<void> {
  const source = new Uint8Array(await fs.readFile(path.join(FIXTURE_DIR, "sample_AC1032.dwg")));
  expectConversionError(
    () => convertDwgToDxf(source, { initialOutputBytes: 1024, maxOutputBytes: 64 * 1024 }),
    "OUTPUT_LIMIT_EXCEEDED"
  );
}

async function main() {
  await assertEnginePin();
  assertPreflight();
  const results = [];
  for (const fixture of FIXTURES) results.push(await assertFixture(fixture));
  await assertOutputLimit();

  console.log("DWG→DXF Stage 2 deterministic core: PASS");
  console.table(results);
  console.log(`signature=${DWG_DXF_CONVERTER_SIGNATURE}`);
}

await main();
