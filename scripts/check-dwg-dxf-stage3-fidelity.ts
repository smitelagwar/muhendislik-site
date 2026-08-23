import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import type { DokFile } from "../src/lib/dokumantasyon/types";
import {
  convertAndValidateDwgToDxf,
  validateDwgToDxfConversion,
  type DwgConversionResult,
} from "../src/lib/dokumantasyon/dwg";
import {
  claimDwgDxfDerivative,
  completeDwgDxfDerivative,
  findReadyDwgDxfDerivativeByHash,
  getDwgDxfConverterSignatureHash,
  markDwgDxfDerivativeValidating,
} from "../src/lib/dokumantasyon/dwg/server";

const FIXTURE_DIR = process.env.DWG_STAGE3_FIXTURE_DIR || ".poc/stage3-fixtures";
const FIXTURES = ["sample_AC1014.dwg", "sample_AC1032.dwg"] as const;

function sha256(bytes: Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex");
}

function makeFile(id: string, fileName: string, source: Uint8Array): DokFile {
  return {
    id,
    folder_id: null,
    display_name: fileName,
    blob_pathname: `fixtures/${fileName}`,
    blob_url: `local:${fileName}`,
    size_bytes: source.byteLength,
    mime_type: "application/acad",
    extension: ".dwg",
    created_at: new Date(0).toISOString(),
    updated_at: new Date(0).toISOString(),
    deleted_at: null,
    current_version_number: 1,
  };
}

async function checkFixture(fileName: (typeof FIXTURES)[number]) {
  const source = new Uint8Array(await fs.readFile(path.join(FIXTURE_DIR, fileName)));
  const started = performance.now();
  const { conversion, validation } = await convertAndValidateDwgToDxf(source);
  const elapsedMs = performance.now() - started;

  if (validation.decision === "REJECT") {
    console.error(`FIDELITY_REJECT ${fileName}`);
    console.error(JSON.stringify({ source: validation.source, output: validation.output, issues: validation.issues }, null, 2));
  }

  assert.notEqual(validation.decision, "REJECT", `${fileName} must not fail the fidelity gate`);
  assert.ok(validation.output, `${fileName} output snapshot missing`);
  assert.equal(validation.issues.filter((issue) => issue.severity === "blocking").length, 0);
  assert.deepEqual(validation.source.entityTypes, validation.output.entityTypes);
  assert.deepEqual(validation.source.layerNames, validation.output.layerNames);
  assert.deepEqual(validation.source.blockNames, validation.output.blockNames);
  assert.deepEqual(validation.source.lineWeights, validation.output.lineWeights);
  assert.deepEqual(validation.source.lineTypes, validation.output.lineTypes);
  assert.deepEqual(validation.source.colors, validation.output.colors);
  assert.equal(validation.source.modelSpaceEntityCount, validation.output.modelSpaceEntityCount);

  const tampered: DwgConversionResult = {
    ...conversion,
    sourceSnapshot: {
      ...conversion.sourceSnapshot,
      entityCount: conversion.sourceSnapshot.entityCount + 1,
    },
  };
  const rejected = await validateDwgToDxfConversion(tampered);
  assert.equal(rejected.decision, "REJECT");
  assert.ok(rejected.issues.some((issue) => issue.code === "ENTITY_COUNT_MISMATCH"));

  return { source, conversion, validation, elapsedMs };
}

async function checkLocalCache(
  source: Uint8Array,
  conversion: Awaited<ReturnType<typeof convertAndValidateDwgToDxf>>["conversion"],
  validation: Awaited<ReturnType<typeof convertAndValidateDwgToDxf>>["validation"]
): Promise<void> {
  process.env.DOK_ALLOW_LOCAL_STORAGE = "true";
  await fs.rm(".data", { recursive: true, force: true });

  const sourceHash = sha256(source);
  const file = makeFile("11111111-1111-4111-8111-111111111111", "cache-pass.dwg", source);
  const claimed = await claimDwgDxfDerivative({
    file,
    sourceSha256: sourceHash,
    dwgVersion: conversion.inspection.magic,
  });
  assert.equal(claimed.claimed, true);
  assert.equal(claimed.derivative.status, "converting");

  await markDwgDxfDerivativeValidating(claimed.derivative.id, 10, conversion.diagnostics);
  const ready = await completeDwgDxfDerivative({
    id: claimed.derivative.id,
    dxfBytes: conversion.dxfBytes,
    validation,
    conversionMs: 10,
    validationMs: 5,
    diagnostics: conversion.diagnostics,
  });
  assert.equal(ready.status, "ready");
  assert.ok(ready.validation_decision === "PASS" || ready.validation_decision === "WARN");
  assert.ok(ready.dxf_blob_pathname);
  assert.equal(ready.dxf_sha256, sha256(conversion.dxfBytes));

  const hit = await findReadyDwgDxfDerivativeByHash(sourceHash);
  assert.ok(hit);
  assert.equal(hit.id, ready.id);

  const rejectFile = makeFile("22222222-2222-4222-8222-222222222222", "cache-reject.dwg", source);
  const rejectClaim = await claimDwgDxfDerivative({
    file: rejectFile,
    sourceSha256: sourceHash,
    dwgVersion: conversion.inspection.magic,
  });
  await markDwgDxfDerivativeValidating(rejectClaim.derivative.id, 10, conversion.diagnostics);
  const rejectedValidation = {
    ...validation,
    decision: "REJECT" as const,
    issues: [
      ...validation.issues,
      { code: "TEST_BLOCK", severity: "blocking" as const, message: "Synthetic blocking fidelity failure." },
    ],
  };
  const failed = await completeDwgDxfDerivative({
    id: rejectClaim.derivative.id,
    dxfBytes: conversion.dxfBytes,
    validation: rejectedValidation,
    conversionMs: 10,
    validationMs: 5,
    diagnostics: conversion.diagnostics,
  });
  assert.equal(failed.status, "failed");
  assert.equal(failed.validation_decision, "REJECT");
  assert.equal(failed.dxf_blob_pathname, null);

  const sigHash = getDwgDxfConverterSignatureHash();
  assert.match(sigHash, /^[a-f0-9]{64}$/);
  assert.notEqual(sigHash, getDwgDxfConverterSignatureHash("different-profile"));

  await fs.rm(".data", { recursive: true, force: true });
}

async function checkMigration(): Promise<void> {
  const dbSource = await fs.readFile("src/lib/dokumantasyon/db.ts", "utf8");
  assert.match(dbSource, /LATEST_REQUIRED_SCHEMA_VERSION = "007"/);
  assert.match(dbSource, /CREATE TABLE IF NOT EXISTS dok_dwg_dxf_derivatives/);
  assert.match(dbSource, /converter_signature_sha256/);
  assert.match(dbSource, /validation_decision IN \('PASS', 'WARN'\)/);
}

async function main(): Promise<void> {
  await checkMigration();
  const results = [];
  let cacheSeed: Awaited<ReturnType<typeof checkFixture>> | null = null;

  for (const fixture of FIXTURES) {
    const result = await checkFixture(fixture);
    cacheSeed ??= result;
    results.push({
      fixture,
      decision: result.validation.decision,
      sourceEntities: result.validation.source.entityCount,
      outputEntities: result.validation.output?.entityCount ?? -1,
      layers: result.validation.source.layerCount,
      blocks: result.validation.source.blockDefinitionCount,
      xrefs: result.validation.source.xrefBlockCount,
      proxyEntities: result.validation.source.proxyGeometryEntityCount,
      issues: result.validation.issues.length,
      elapsedMs: Math.round(result.elapsedMs),
      dxfSha256: sha256(result.conversion.dxfBytes),
    });
  }

  assert.ok(cacheSeed);
  await checkLocalCache(cacheSeed.source, cacheSeed.conversion, cacheSeed.validation);

  console.log("DWG→DXF Stage 3 fidelity/cache: PASS");
  console.table(results);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});