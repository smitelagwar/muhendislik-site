import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import type { DokFile } from "../src/lib/dokumantasyon/types";
import {
  convertAndValidateDwgToDxf,
  validateDwgToDxfConversion,
  type DwgConversionResult,
  type DwgFidelityValidation,
} from "../src/lib/dokumantasyon/dwg";
import {
  claimDwgDxfDerivative,
  completeDwgDxfDerivative,
  findReadyDwgDxfDerivativeByHash,
  getDwgDxfConverterSignatureHash,
  markDwgDxfDerivativeValidating,
} from "../src/lib/dokumantasyon/dwg/server";

const FIXTURE_DIR = process.env.DWG_STAGE3_FIXTURE_DIR || ".poc/stage3-fixtures";
const COMPLEX_FIXTURES = ["sample_AC1014.dwg", "sample_AC1032.dwg"] as const;
const SIMPLE_VERSIONS = ["AC1014", "AC1032"] as const;

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

async function createSimpleDwg(versionName: (typeof SIMPLE_VERSIONS)[number]): Promise<Uint8Array> {
  const acad = await import("@node-projects/acad-ts");
  const version = acad.ACadVersion[versionName];
  assert.equal(typeof version, "number", `Missing acad-ts DWG version ${versionName}`);

  const document = new acad.CadDocument();
  assert.ok(document.header, "Synthetic DWG document must have a header");
  document.header.version = version;
  document.entities.add(new acad.Point(new acad.XYZ(10, 5, 0)));
  document.entities.add(new acad.Line(new acad.XYZ(0, 0, 0), new acad.XYZ(50, 30, 0)));

  const buffer = new ArrayBuffer(4 * 1024 * 1024);
  const writer = new acad.DwgWriter(buffer, document);
  writer.write();
  assert.ok(writer.bytesWritten > 0, `${versionName} synthetic DWG writer produced no bytes`);
  return new Uint8Array(buffer, 0, writer.bytesWritten).slice();
}

function assertStructurallyEqual(validation: DwgFidelityValidation, label: string): void {
  assert.notEqual(validation.decision, "REJECT", `${label} must not fail the fidelity gate`);
  assert.ok(validation.output, `${label} output snapshot missing`);
  assert.equal(validation.issues.filter((issue) => issue.severity === "blocking").length, 0);
  assert.equal(validation.source.entityCount, validation.output.entityCount);
  assert.equal(validation.source.modelSpaceEntityCount, validation.output.modelSpaceEntityCount);
  assert.deepEqual(validation.source.entityTypes, validation.output.entityTypes);
  assert.deepEqual(validation.source.layerNames, validation.output.layerNames);
  assert.deepEqual(validation.source.blockNames, validation.output.blockNames);
  assert.deepEqual(validation.source.lineWeights, validation.output.lineWeights);
  assert.deepEqual(validation.source.lineTypes, validation.output.lineTypes);
  assert.deepEqual(validation.source.colors, validation.output.colors);
  assert.equal(validation.source.xDataEntityCount, validation.output.xDataEntityCount);
}

async function checkSimplePositive(versionName: (typeof SIMPLE_VERSIONS)[number]) {
  const source = await createSimpleDwg(versionName);
  const started = performance.now();
  const { conversion, validation } = await convertAndValidateDwgToDxf(source);
  const elapsedMs = performance.now() - started;

  assert.equal(conversion.inspection.magic, versionName);
  assertStructurallyEqual(validation, `simple_${versionName}.dwg`);

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

async function checkComplexFixture(fileName: (typeof COMPLEX_FIXTURES)[number]) {
  const source = new Uint8Array(await fs.readFile(path.join(FIXTURE_DIR, fileName)));
  const started = performance.now();
  const { conversion, validation } = await convertAndValidateDwgToDxf(source);
  const elapsedMs = performance.now() - started;
  const blocking = validation.issues.filter((issue) => issue.severity === "blocking");

  if (fileName === "sample_AC1014.dwg") {
    assert.equal(validation.decision, "REJECT", "Known complex AC1014 fixture must be rejected rather than cached as faithful");
    assert.ok(blocking.length > 0);
    for (const code of [
      "ENTITY_COUNT_MISMATCH",
      "MODELSPACE_COUNT_MISMATCH",
      "ENTITY_TYPES_MISMATCH",
      "EXTENTS_MISMATCH",
    ]) {
      assert.ok(validation.issues.some((issue) => issue.code === code), `AC1014 rejection must include ${code}`);
    }
    assert.ok(
      validation.issues.some(
        (issue) => issue.severity === "blocking" && /NOT_IMPLEMENTED|UNSUPPORTED|UNKNOWN|MISSING/i.test(issue.code)
      ),
      "AC1014 rejection must retain at least one blocking engine diagnostic"
    );
  } else if (validation.decision === "REJECT") {
    assert.ok(blocking.length > 0, `${fileName} REJECT must have blocking evidence`);
  } else {
    assertStructurallyEqual(validation, fileName);
  }

  return { source, conversion, validation, elapsedMs };
}

async function checkLocalCache(
  positive: Awaited<ReturnType<typeof checkSimplePositive>>,
  negative: Awaited<ReturnType<typeof checkComplexFixture>>
): Promise<void> {
  process.env.DOK_ALLOW_LOCAL_STORAGE = "true";
  await fs.rm(".data", { recursive: true, force: true });

  const positiveHash = sha256(positive.source);
  const passFile = makeFile("11111111-1111-4111-8111-111111111111", "cache-pass.dwg", positive.source);
  const claimed = await claimDwgDxfDerivative({
    file: passFile,
    sourceSha256: positiveHash,
    dwgVersion: positive.conversion.inspection.magic,
  });
  assert.equal(claimed.claimed, true);
  assert.equal(claimed.derivative.status, "converting");

  await markDwgDxfDerivativeValidating(claimed.derivative.id, 10, positive.conversion.diagnostics);
  const ready = await completeDwgDxfDerivative({
    id: claimed.derivative.id,
    dxfBytes: positive.conversion.dxfBytes,
    validation: positive.validation,
    conversionMs: 10,
    validationMs: 5,
    diagnostics: positive.conversion.diagnostics,
  });
  assert.equal(ready.status, "ready");
  assert.ok(ready.validation_decision === "PASS" || ready.validation_decision === "WARN");
  assert.ok(ready.dxf_blob_pathname);
  assert.equal(ready.dxf_sha256, sha256(positive.conversion.dxfBytes));

  const hit = await findReadyDwgDxfDerivativeByHash(positiveHash);
  assert.ok(hit);
  assert.equal(hit.id, ready.id);

  assert.equal(negative.validation.decision, "REJECT", "Negative cache fixture must be rejected");
  const negativeHash = sha256(negative.source);
  const rejectFile = makeFile("22222222-2222-4222-8222-222222222222", "cache-reject.dwg", negative.source);
  const rejectClaim = await claimDwgDxfDerivative({
    file: rejectFile,
    sourceSha256: negativeHash,
    dwgVersion: negative.conversion.inspection.magic,
  });
  await markDwgDxfDerivativeValidating(rejectClaim.derivative.id, 10, negative.conversion.diagnostics);
  const failed = await completeDwgDxfDerivative({
    id: rejectClaim.derivative.id,
    dxfBytes: negative.conversion.dxfBytes,
    validation: negative.validation,
    conversionMs: 10,
    validationMs: 5,
    diagnostics: negative.conversion.diagnostics,
  });
  assert.equal(failed.status, "failed");
  assert.equal(failed.validation_decision, "REJECT");
  assert.equal(failed.dxf_blob_pathname, null);
  assert.equal(await findReadyDwgDxfDerivativeByHash(negativeHash), null);

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
  const results: Array<Record<string, string | number>> = [];
  const positives = [];

  for (const version of SIMPLE_VERSIONS) {
    const result = await checkSimplePositive(version);
    positives.push(result);
    results.push({
      fixture: `synthetic_simple_${version}`,
      expected: "PASS/WARN",
      decision: result.validation.decision,
      sourceEntities: result.validation.source.entityCount,
      outputEntities: result.validation.output?.entityCount ?? -1,
      issues: result.validation.issues.length,
      elapsedMs: Math.round(result.elapsedMs),
      dxfSha256: sha256(result.conversion.dxfBytes),
    });
  }

  const complexResults = [];
  for (const fixture of COMPLEX_FIXTURES) {
    const result = await checkComplexFixture(fixture);
    complexResults.push(result);
    results.push({
      fixture,
      expected: fixture === "sample_AC1014.dwg" ? "REJECT" : "evidence-driven",
      decision: result.validation.decision,
      sourceEntities: result.validation.source.entityCount,
      outputEntities: result.validation.output?.entityCount ?? -1,
      blockingIssues: result.validation.issues.filter((issue) => issue.severity === "blocking").length,
      issues: result.validation.issues.length,
      elapsedMs: Math.round(result.elapsedMs),
      dxfSha256: sha256(result.conversion.dxfBytes),
    });
  }

  const negative = complexResults.find((result) => result.validation.decision === "REJECT");
  assert.ok(positives[0], "At least one positive fixture must exercise the ready cache path");
  assert.ok(negative, "At least one complex fixture must exercise the REJECT cache path");
  await checkLocalCache(positives[0], negative);

  console.log("DWG→DXF Stage 3 fidelity/cache: PASS");
  console.table(results);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});