import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

import {
  createDemoModel,
  type CadModel,
  type BeamElement
} from "../../src/lib/hsyncad/model.js";
import { migrateStructuralModel } from "../../src/lib/hsyncad/structural/migration.js";
import { updateProjectSettings } from "../../src/lib/hsyncad/structural/project-schema.js";
import { emptyEngineeringReviews } from "../../src/lib/hsyncad/structural/global-control-types.js";
import {
  buildExplicitReportInputFromModel,
  generateModelProjectReport,
  downloadSingleProjectReportPdf,
  computeModelFingerprint,
  isAnalysisStale,
  getQuarantinedPipelineDiagnostic,
  UnsupportedPipelineError
} from "../../src/lib/hsyncad/reporting/model-report-adapter.js";

function buildTestBuildingModel(): CadModel {
  const base = createDemoModel();
  const migrated = migrateStructuralModel(base, "PROJ-P17-TEST-01");
  return migrated;
}

test("P17: User enters structural settings and updates model revision fingerprint", () => {
  const model = buildTestBuildingModel();
  const initialFingerprint = computeModelFingerprint(model);
  assert.ok(initialFingerprint, "Initial fingerprint must be computed");

  // User enters settings via ProjectAnalysisSettings logic
  const structural = model.structural!;
  const newSettings = structuredClone(structural.settings);
  newSettings.soilClass = { value: "ZD", source: "user_input", evidence: null };
  newSettings.concreteGrade = { value: "C30", source: "user_input", evidence: null };
  newSettings.rebarGrade = { value: "B420C", source: "user_input", evidence: null };

  const reviews = emptyEngineeringReviews();
  reviews.A2 = { present: false, reviewer: "Mühendis Test", reason: "Döşeme sürekliliği tam", transfer: null, verticalAnalysisRef: null };
  reviews.A3 = { present: false, reviewer: "Mühendis Test", reason: "Çıkıntı yok", transfer: null, verticalAnalysisRef: null };
  reviews.B3 = { present: false, reviewer: "Mühendis Test", reason: "Düşey taşıyıcı süreksizliği yok", transfer: "none", verticalAnalysisRef: null };

  const updatedStructural = updateProjectSettings(structural, newSettings, reviews);
  const updatedModel: CadModel = { ...model, structural: updatedStructural };

  const updatedFingerprint = computeModelFingerprint(updatedModel);
  assert.notEqual(updatedFingerprint, initialFingerprint, "Fingerprint must change when settings/revision change");
  assert.equal(updatedModel.structural?.revision, structural.revision + 1, "Revision must increment on save");
});

test("P17: Stale model detection rejects out-of-sync analysis export", () => {
  const model = buildTestBuildingModel();
  const snapshotFingerprint = computeModelFingerprint(model);

  // Analysis is fresh
  assert.equal(isAnalysisStale(model, snapshotFingerprint), false, "Fresh analysis must not be stale");

  // User alters geometry (e.g. moves or adds an element)
  const modifiedModel: CadModel = {
    ...model,
    elements: [
      ...model.elements,
      {
        id: "new-beam-test",
        type: "beam",
        floorId: "1F",
        layer: "BEAMS",
        width: 0.25,
        height: 0.50,
        start: { x: 0, y: 0 },
        end: { x: 4.0, y: 0 },
        visible: true,
        locked: false
      } as BeamElement
    ]
  };

  assert.equal(
    isAnalysisStale(modifiedModel, snapshotFingerprint),
    true,
    "Model must be detected as stale when geometry is mutated"
  );
});

test("P17 Mechanical Quarantine: buildExplicitReportInputFromModel deterministically throws structured UnsupportedPipelineError", () => {
  const model = buildTestBuildingModel();

  assert.throws(
    () => {
      buildExplicitReportInputFromModel(model);
    },
    (err: unknown) => {
      assert.ok(err instanceof UnsupportedPipelineError, "Error must be instance of UnsupportedPipelineError");
      assert.equal(err.name, "UnsupportedPipelineError");
      assert.equal(err.diagnostic.status, "unsupported");
      assert.equal(err.diagnostic.code, "QUARANTINED_UNVALIDATED_PIPELINE");
      assert.equal(err.diagnostic.details.fakeCalculationProhibited, true);
      return true;
    },
    "Calling buildExplicitReportInputFromModel must immediately fail with structured unsupported diagnostic"
  );
});

test("P17 Mechanical Quarantine: generateModelProjectReport and downloadSingleProjectReportPdf deterministically fail", async () => {
  const model = buildTestBuildingModel();

  // Synchronous generate entrypoint throws
  assert.throws(
    () => {
      generateModelProjectReport(model);
    },
    (err: unknown) => {
      assert.ok(err instanceof UnsupportedPipelineError, "Error must be instance of UnsupportedPipelineError");
      assert.equal(err.diagnostic.code, "QUARANTINED_UNVALIDATED_PIPELINE");
      return true;
    },
    "generateModelProjectReport must throw UnsupportedPipelineError"
  );

  // Client download helper rejects
  await assert.rejects(
    async () => {
      await downloadSingleProjectReportPdf(model);
    },
    (err: unknown) => {
      assert.ok(err instanceof UnsupportedPipelineError, "Error must be instance of UnsupportedPipelineError");
      assert.equal(err.diagnostic.code, "QUARANTINED_UNVALIDATED_PIPELINE");
      return true;
    },
    "downloadSingleProjectReportPdf must reject with UnsupportedPipelineError"
  );

  // Structured diagnostic inspection helper returns valid diagnostic
  const diag = getQuarantinedPipelineDiagnostic();
  assert.equal(diag.status, "unsupported");
  assert.equal(diag.code, "QUARANTINED_UNVALIDATED_PIPELINE");
  assert.equal(diag.details.fakeCalculationProhibited, true);
});

test("P17 Mechanical Quarantine: Legacy adapter strictly removes old analysis, bar builder, and synthetic seismic capacity data", () => {
  const adapterSource = fs.readFileSync(
    path.resolve(process.cwd(), "src/lib/hsyncad/reporting/model-report-adapter.ts"),
    "utf-8"
  );

  // Prohibited imports
  assert.ok(!adapterSource.includes("../analysis"), "Must not import old analysis.ts");
  assert.ok(!adapterSource.includes("../design-engine"), "Must not import old design-engine.ts");
  assert.ok(!adapterSource.includes("reinforcement-schedule"), "Must not import reinforcement-schedule.ts");
  assert.ok(!adapterSource.includes("explicit-project-report"), "Must not import explicit-project-report.ts");

  // Prohibited dynamic / fake calculations
  assert.ok(!adapterSource.includes("seismicCapacityData"), "Must not synthesize seismicCapacityData");
  assert.ok(!adapterSource.includes("crossSectionBars"), "Must not fabricate crossSectionBars");
  assert.ok(!adapterSource.includes("botDiam"), "Must not fabricate botDiam");
  assert.ok(!adapterSource.includes("topDiam"), "Must not fabricate topDiam");
  assert.ok(!adapterSource.includes("rebarInputs"), "Must not fabricate rebarInputs");
});

test("P17 Mechanical Quarantine: CLI model-report-flow exits non-zero with explicit unsupported diagnostic and produces no PDF", () => {
  const model = buildTestBuildingModel();
  const tmpModelPath = path.resolve(process.cwd(), `tmp-test-model-${Date.now()}.json`);
  const tmpPdfPath = path.resolve(process.cwd(), `tmp-test-out-${Date.now()}.pdf`);

  fs.writeFileSync(tmpModelPath, JSON.stringify(model));

  try {
    const tsxCli = path.resolve(process.cwd(), "node_modules/tsx/dist/cli.mjs");
    const scriptPath = path.resolve(process.cwd(), "scripts/hsyncad/model-report-flow.ts");

    const result = spawnSync(
      process.execPath,
      [tsxCli, scriptPath, "--model", tmpModelPath, "--output", tmpPdfPath],
      { encoding: "utf-8" }
    );

    // Non-zero exit code
    assert.notEqual(result.status, 0, `CLI must exit non-zero, got ${result.status}`);

    // No PDF file written
    assert.equal(fs.existsSync(tmpPdfPath), false, "CLI must not write destination PDF file");

    // Output contains structured quarantine diagnostic message
    const combinedOutput = `${result.stdout}\n${result.stderr}`;
    assert.ok(
      combinedOutput.includes("QUARANTINED_UNVALIDATED_PIPELINE"),
      "CLI output must contain QUARANTINED_UNVALIDATED_PIPELINE diagnostic code"
    );
    assert.ok(
      combinedOutput.includes("mechanically quarantined"),
      "CLI output must explicitly state mechanically quarantined"
    );
  } finally {
    if (fs.existsSync(tmpModelPath)) {
      try { fs.unlinkSync(tmpModelPath); } catch (_) {}
    }
    if (fs.existsSync(tmpPdfPath)) {
      try { fs.unlinkSync(tmpPdfPath); } catch (_) {}
    }
  }
});

test("P17: Zero ideCAD / REA runtime dependencies", () => {
  assert.equal(typeof (process.env as Record<string, string | undefined>)["IDECAD_PATH"], "undefined");
  assert.equal(typeof (process.env as Record<string, string | undefined>)["REA_CLI_PATH"], "undefined");
});

test("P17: Zero test fixture runtime imports in production reporting adapter", () => {
  const adapterSource = fs.readFileSync(
    path.resolve(process.cwd(), "src/lib/hsyncad/reporting/model-report-adapter.ts"),
    "utf-8"
  );

  assert.ok(!adapterSource.includes("/tests/"), "Production adapter must not import from /tests/");
  assert.ok(!adapterSource.includes("p16-fixtures"), "Production adapter must not import test fixtures");
  assert.ok(!adapterSource.includes("sample-project-input"), "Production adapter must not import sample JSON fixtures");
});
