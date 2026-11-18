import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import {
  executeAnalyticalReportPipeline
} from "../../src/lib/hsyncad/reporting/analytical-report-pipeline";
import type {
  ExplicitBeamAnalyticalInput,
  AnalyticalNodeDefinition,
  ExplicitProvableMaterial,
  ExplicitDesignCatalog
} from "../../src/lib/hsyncad/structural/analytical-bridge-types";
import { beamSectionForce } from "../../src/lib/hsyncad/structural/beam-forces";

const RHO_STEEL = 7850; // kg/m^3

function createBaselineMaterial(): ExplicitProvableMaterial {
  return {
    fck: 30, // C30/37
    fctk: 1.9,
    reinforcementClass: "B420C",
    fyk: 420,
    fywk: 420,
    Ec: 32000,
    densityKgM3: RHO_STEEL,
    tensileBasis: "table_3_2",
    elasticBasis: "table_3_2",
    testEvidence: null,
    source: "TS 500:2000 Çizelge 3.2 (C30 / B420C)"
  };
}

function createBaselineNodes(spanM = 6.0): [AnalyticalNodeDefinition, AnalyticalNodeDefinition] {
  return [
    {
      id: "N1",
      position: [0, 0, 0],
      prescribed: [0, 0, 0, 0, 0, null],
      springs: [0, 0, 0, 0, 0, 0]
    },
    {
      id: "N2",
      position: [spanM, 0, 0],
      prescribed: [null, 0, 0, 0, 0, null],
      springs: [0, 0, 0, 0, 0, 0]
    }
  ];
}

function createBaselineCatalog(): ExplicitDesignCatalog {
  return {
    diameters: [14, 16, 18, 20],
    stirrupDiameters: [8, 10],
    spacings: [75, 100, 125, 150, 200],
    maxCount: 8,
    maxRows: 2,
    maxCandidates: 1000,
    stockLengthMm: 12000
  };
}

function createExplicitBeamInput(overrides?: Partial<ExplicitBeamAnalyticalInput>): ExplicitBeamAnalyticalInput {
  const spanMm = overrides?.geometry?.spanMm ?? 6000;
  const spanM = spanMm / 1000;

  return {
    id: "B101",
    floorId: "1F",
    modelRevision: "REV-2026-11-08-01",
    analysisStamp: "STAMP-P06-P09-01",
    role: "beam",
    source: "explicit_analytical_contract",
    geometry: {
      spanMm,
      bwMm: 300,
      hMm: 600,
      slabThicknessMm: 150,
      columnWidthMm: 400,
      coverMm: 30,
      aggregateMm: 16,
      kind: "simple",
      outside: false,
      flange: null,
      leftJoint: "N1",
      rightJoint: "N2",
      source: "cad_verified_gross_geometry",
      ...overrides?.geometry
    },
    material: overrides?.material ?? createBaselineMaterial(),
    nodes: overrides?.nodes ?? createBaselineNodes(spanM),
    loadCases: overrides?.loadCases ?? [
      {
        id: "G",
        kind: "G",
        uniformKnM: [0, -25, 0], // 25 kN/m gravity
        source: "dead_load_ledger_verified"
      },
      {
        id: "Q",
        kind: "Q",
        uniformKnM: [0, -10, 0], // 10 kN/m live
        source: "live_load_occupancy_verified"
      }
    ],
    combinations: overrides?.combinations ?? [
      {
        id: "ULS",
        terms: [
          { factor: 1.4, loadCaseId: "G" },
          { factor: 1.6, loadCaseId: "Q" }
        ]
      },
      {
        id: "SLS_TOTAL",
        terms: [
          { factor: 1.0, loadCaseId: "G" },
          { factor: 1.0, loadCaseId: "Q" }
        ]
      },
      {
        id: "SLS_SUSTAINED",
        terms: [
          { factor: 1.0, loadCaseId: "G" },
          { factor: 0.3, loadCaseId: "Q" }
        ]
      },
      {
        id: "SLS_LIVE",
        terms: [
          { factor: 1.0, loadCaseId: "Q" }
        ]
      }
    ],
    seismic: overrides?.seismic !== undefined ? overrides.seismic : null,
    service: overrides?.service !== undefined ? overrides.service : {
      totalCaseId: "SLS_TOTAL",
      sustainedCaseId: "SLS_SUSTAINED",
      liveCaseId: "SLS_LIVE",
      duration: "5years",
      environment: "indoor_normal",
      partition: "insensitive",
      source: "TS 500-13 SLS combinations"
    },
    anchors: overrides?.anchors ?? {
      left: { kind: "straight", availableMm: 1200, coverMm: 30, clearSpacingMm: 40, source: "column_face_anchorage" },
      right: { kind: "straight", availableMm: 1200, coverMm: 30, clearSpacingMm: 40, source: "column_face_anchorage" }
    },
    support: overrides?.support ?? {
      left: "direct",
      right: "direct",
      hangerLeftKn: 0,
      hangerRightKn: 0,
      source: "direct_column_support"
    },
    continuity: overrides?.continuity ?? {
      leftBeamId: null,
      rightBeamId: null,
      source: "simply_supported_isolated"
    },
    catalog: overrides?.catalog ?? createBaselineCatalog(),
    transverse: overrides?.transverse ?? {
      hookBendDefinition: {
        hookAngleDeg: 135,
        hookExtensionMm: 80,
        bendRadiusMm: 24,
        source: "TS 500-7.3 / TBDY 7.4 standard 135-deg hook"
      }
    },
    qualityReviewed: overrides?.qualityReviewed ?? {
      value: true,
      source: "PE_Structural_Quality_Signoff_20261108"
    },
    loadCoverage: overrides?.loadCoverage ?? {
      value: "all_required_combinations_reviewed",
      source: "TBDY_Gravity_ULS_Matrix_Pass"
    },
    independentReview: overrides?.independentReview ?? {
      engineerName: "İnşaat Yüksek Mühendisi",
      reviewDate: "2026-11-08",
      notes: ["Tekil kiriş doğrulanmış analitik hesap modeli."]
    },
    ...overrides
  };
}

test("P17 Core Pipeline: Complete positive explicit geometric case runs P06 -> P09 -> P15 -> P16 end-to-end", () => {
  const input = createExplicitBeamInput();
  const res = executeAnalyticalReportPipeline(input);

  assert.equal(res.beamId, "B101");
  assert.equal(res.modelRevision, "REV-2026-11-08-01");
  assert.equal(res.success, true);
  assert.equal(res.status, "design_ready");
  // Draft status strictly enforced since seismic/service/whole-building are omitted
  assert.equal(res.reviewStatus, "taslak_muhendis_incelemesi_gerekli");

  // P06 checks
  assert.ok(res.p06Forces);
  assert.equal(typeof res.p06Forces.memberEndForces["G"], "object");
  assert.equal(res.p06Forces.memberEndForces["G"].length, 12);

  // P09 checks
  assert.ok(res.p09Design);
  assert.equal(res.p09Design.status, "design_ready");
  assert.ok(res.p09Design.selected);
  assert.ok(res.p09Design.selected.bars.length >= 4);

  // P15 schedule checks
  assert.ok(res.p15Schedule);
  assert.equal(res.p15Schedule.isComplete, true);
  assert.ok(res.p15Schedule.knownMassKg > 0);
  assert.equal(res.p15Schedule.totalMassKg, res.p15Schedule.knownMassKg);

  // P16 single-PDF checks
  assert.ok(res.p16Report);
  assert.ok(res.p16Report.renderResult.pdfBytes.length > 1000);
  const pdfHeader = Buffer.from(res.p16Report.renderResult.pdfBytes.slice(0, 5)).toString("utf-8");
  assert.equal(pdfHeader, "%PDF-");

  // Verify same BarInput instance consumed by P15 and P16
  assert.equal(res.rebarInputs.length, res.p16Report.reinforcementSchedule.uniqueBars.length);
  for (let i = 0; i < res.rebarInputs.length; i++) {
    assert.equal(res.rebarInputs[i].id, res.p16Report.reinforcementSchedule.uniqueBars[i].id);
    assert.equal(res.rebarInputs[i].diameterMm, res.p16Report.reinforcementSchedule.uniqueBars[i].diameterMm);
    assert.equal(res.rebarInputs[i].count, res.p16Report.reinforcementSchedule.uniqueBars[i].count);
    assert.equal(res.rebarInputs[i].role, res.p16Report.reinforcementSchedule.uniqueBars[i].role);
  }
  assert.equal(res.p15Schedule.knownMassKg, res.p16Report.reinforcementSchedule.knownMassKg);
});

test("P17 Core Pipeline Oracle 1: Load and span mutation changes P06 forces and design demand proportionally", () => {
  const baseInput = createExplicitBeamInput();
  const baseRes = executeAnalyticalReportPipeline(baseInput);

  // Mutate load: Increase G from 25 to 35 kN/m
  const loadMutatedInput = createExplicitBeamInput({
    loadCases: [
      {
        id: "G",
        kind: "G",
        uniformKnM: [0, -35, 0], // increased from -25
        source: "mutated_load"
      },
      {
        id: "Q",
        kind: "Q",
        uniformKnM: [0, -10, 0],
        source: "live_load"
      }
    ]
  });
  const loadRes = executeAnalyticalReportPipeline(loadMutatedInput);

  const baseV = Math.abs(baseRes.p06Forces!.memberEndForces["G"][1]);
  const mutatedV = Math.abs(loadRes.p06Forces!.memberEndForces["G"][1]);

  // Shear force V = q*L / 2 -> for 25 kN/m * 6m / 2 = 75 kN; for 35 kN/m * 6m / 2 = 105 kN
  assert.ok(Math.abs(baseV - 75.0) < 1e-4);
  assert.ok(Math.abs(mutatedV - 105.0) < 1e-4);
  assert.ok(mutatedV > baseV, "Increased load must strictly increase shear demand");

  // Mutate span: Increase span from 6m to 7m
  const spanMutatedInput = createExplicitBeamInput({
    geometry: {
      spanMm: 7000,
      bwMm: 300,
      hMm: 600,
      slabThicknessMm: 150,
      columnWidthMm: 400,
      coverMm: 30,
      aggregateMm: 16,
      kind: "simple",
      outside: false,
      flange: null,
      leftJoint: "N1",
      rightJoint: "N2",
      source: "mutated_span_7m"
    },
    nodes: createBaselineNodes(7.0)
  });
  const spanRes = executeAnalyticalReportPipeline(spanMutatedInput);
  const spanV = Math.abs(spanRes.p06Forces!.memberEndForces["G"][1]);
  // for 25 kN/m * 7m / 2 = 87.5 kN
  assert.ok(Math.abs(spanV - 87.5) < 1e-4);
  assert.ok(spanV > baseV, "Increased span must strictly increase shear demand");
});

test("P17 Core Pipeline Oracle 2: Physical bar count / diameter mutations change known mass deterministically", () => {
  const baseInput = createExplicitBeamInput();
  const baseRes = executeAnalyticalReportPipeline(baseInput);
  const baseMass = baseRes.p15Schedule!.knownMassKg;

  // Catalog restricted to larger diameters forces heavier design
  const heavyCatalogInput = createExplicitBeamInput({
    catalog: {
      diameters: [20], // only 20mm bars
      stirrupDiameters: [10], // 10mm stirrups
      spacings: [100],
      maxCount: 8,
      maxRows: 2,
      maxCandidates: 1000,
      stockLengthMm: 12000
    }
  });
  const heavyRes = executeAnalyticalReportPipeline(heavyCatalogInput);
  const heavyMass = heavyRes.p15Schedule!.knownMassKg;

  assert.ok(heavyMass > baseMass, "Larger diameter reinforcement must yield higher schedule mass");
});

test("P17 Core Pipeline Oracle 3: Missing transverse hook/bend definition leaves total mass null", () => {
  // Transverse hookBendDefinition is omitted (null)
  const missingGeomInput = createExplicitBeamInput({
    transverse: {
      hookBendDefinition: null,
      verifiedCutLengthMm: null
    }
  });
  const res = executeAnalyticalReportPipeline(missingGeomInput);

  assert.equal(res.status, "incomplete");
  assert.ok(res.p15Schedule);
  // Stirrup role is missing from verified bars
  assert.equal(res.p15Schedule.isComplete, false);
  assert.equal(res.p15Schedule.totalMassKg, null);
  // Known mass still tracks verified longitudinal bars
  assert.ok(res.p15Schedule.knownMassKg > 0);
  assert.ok(res.missingFacts.some(f => f.field === "transverse.hookBendDefinition"));
});

test("P17 Core Pipeline Oracle 4: Missing quality review or load coverage fact blocks completion", () => {
  // Quality reviewed false
  const unreviewedInput = createExplicitBeamInput({
    qualityReviewed: {
      value: false,
      source: "unreviewed_test"
    }
  });
  const res = executeAnalyticalReportPipeline(unreviewedInput);

  assert.equal(res.status, "incomplete");
  assert.equal(res.success, false);
  assert.ok(res.p09Design);
  assert.equal(res.p09Design.status, "incomplete");
  assert.ok(
    res.missingFacts.some(f => f.field === "qualityReviewed" && f.severity === "blocking"),
    "qualityReviewed false must appear in missingFacts with blocking severity"
  );
  assert.equal(res.p15Schedule, null);
  assert.equal(res.p16Report, null);
});

test("P17 Core Pipeline Oracle 5: P09 selected bars are reconciled with P16 report without rebar definition drift", () => {
  const input = createExplicitBeamInput();
  const res = executeAnalyticalReportPipeline(input);

  assert.ok(res.p16Report);
  // Beam calculation summary checks must include the reconciliation check
  const beamSummary = res.p16Report.beamSummaries[0];
  assert.ok(beamSummary);
  const recCheck = beamSummary.checks.find(c => c.id.endsWith("-rebar-reconcile"));
  assert.ok(recCheck, "P16 report must perform explicit rebar reconciliation check");
  assert.equal(recCheck.status, "pass");

  // Reconciled counts match P09 selected bars
  const p09Bars = res.p09Design!.selected!.bars;
  const botBars = p09Bars.filter(b => b.face === "bottom");
  const topBars = p09Bars.filter(b => b.face === "top");

  const schedBot = res.rebarInputs.filter(b => b.role === "main_bottom" || b.role === "longitudinal");
  const schedTop = res.rebarInputs.filter(b => b.role === "main_top");

  assert.equal(schedBot.reduce((s, b) => s + b.count, 0), botBars.length);
  assert.equal(schedTop.reduce((s, b) => s + b.count, 0), topBars.length);
});

test("P17 Core Pipeline Oracle 6: Browser-safety verified - zero node:crypto in client/shared module chain", () => {
  const typesPath = path.resolve("src/lib/hsyncad/structural/analytical-bridge-types.ts");
  const pipelinePath = path.resolve("src/lib/hsyncad/reporting/analytical-report-pipeline.ts");

  const typesContent = fs.readFileSync(typesPath, "utf-8");
  const pipelineContent = fs.readFileSync(pipelinePath, "utf-8");

  const cryptoImportPattern = /(?:import|require)\s*\(?.*['"](?:node:)?crypto['"]/;
  assert.ok(!cryptoImportPattern.test(typesContent), "analytical-bridge-types.ts must have zero crypto imports");
  assert.ok(!cryptoImportPattern.test(pipelineContent), "analytical-report-pipeline.ts must have zero crypto imports");
});

test("P17 Core Fix Decision 1: When P09 design fails (e.g. extreme load/no_layout), fabrication and P16 normal report are aborted with structured failure and null schedule", () => {
  // Extreme moment load that cannot be reinforced with the catalog
  const failedInput = createExplicitBeamInput({
    loadCases: [
      {
        id: "G",
        kind: "G",
        uniformKnM: [0, -5000, 0], // 5000 kN/m -> M = 22,500 kNm, cannot be supported by 300x600 section
        source: "extreme_overload"
      }
    ],
    combinations: [
      {
        id: "ULS",
        terms: [{ factor: 1.0, loadCaseId: "G" }]
      }
    ]
  });

  const res = executeAnalyticalReportPipeline(failedInput);

  assert.equal(res.success, false);
  assert.equal(res.status, "failed");
  assert.equal(res.reviewStatus, "reddedildi");
  assert.equal(res.rebarInputs.length, 0);
  assert.equal(res.p15Schedule, null);
  assert.equal(res.p16Report, null);
  assert.ok(res.diagnostics.some(d => d.includes("P09 Kiriş Tasarımı 'design_ready' durumunda değil")));
  assert.ok(res.p09Design);
  assert.ok(res.p09Design.status === "no_layout" || res.p09Design.status === "budget_exhausted" || res.p09Design.status === "failed");
});

test("P17 Core Fix Decision 2: Implausible-short or mismatched transverse cut length fails reconciliation and prevents stirrup fabrication", () => {
  // Test A: Implausibly short cut length (50mm for 300x600 beam whose centerline curve is ~1680mm)
  const shortCutInput = createExplicitBeamInput({
    transverse: {
      hookBendDefinition: {
        hookAngleDeg: 135,
        hookExtensionMm: 80,
        bendRadiusMm: 24,
        source: "TS 500 standard hook"
      },
      verifiedCutLengthMm: 50 // 50 mm is completely implausible for a 300x600 beam
    }
  });

  const shortRes = executeAnalyticalReportPipeline(shortCutInput);

  // Stirrup bar should NOT be created due to geometric reconciliation failure
  assert.equal(shortRes.status, "incomplete");
  assert.equal(shortRes.rebarInputs.some(b => b.role === "stirrup"), false);
  assert.ok(shortRes.p15Schedule);
  assert.equal(shortRes.p15Schedule.isComplete, false);
  assert.equal(shortRes.p15Schedule.totalMassKg, null);
  assert.ok(shortRes.diagnostics.some(d => d.includes("Etriye kesim boyu mutabakatı başarısız")));

  // Test B: Verified cut length within tolerance of the physical curve (~1680 mm)
  const matchingCutInput = createExplicitBeamInput({
    transverse: {
      hookBendDefinition: {
        hookAngleDeg: 135,
        hookExtensionMm: 80,
        bendRadiusMm: 24,
        source: "TS 500 standard hook"
      },
      verifiedCutLengthMm: 1680 // closely matches physical curve
    }
  });

  const matchRes = executeAnalyticalReportPipeline(matchingCutInput);

  assert.equal(matchRes.success, true);
  assert.equal(matchRes.status, "design_ready");
  assert.equal(matchRes.rebarInputs.some(b => b.role === "stirrup"), true);
  assert.ok(matchRes.p15Schedule);
  assert.equal(matchRes.p15Schedule.isComplete, true);
  assert.ok(matchRes.p15Schedule.totalMassKg! > 0);
});

test("P17 Core Fix Decision 3: Pipeline result returns allCases including computed load combinations with identical provenance", () => {
  const input = createExplicitBeamInput();
  const res = executeAnalyticalReportPipeline(input);

  assert.ok(res.beamCases["G"], "Must include raw dead load case G");
  assert.ok(res.beamCases["Q"], "Must include raw live load case Q");
  assert.ok(res.beamCases["ULS"], "Must include computed ULS combination");
  assert.ok(res.beamCases["SLS_TOTAL"], "Must include computed SLS_TOTAL combination");
  assert.ok(res.beamCases["SLS_SUSTAINED"], "Must include computed SLS_SUSTAINED combination");
  assert.ok(res.beamCases["SLS_LIVE"], "Must include computed SLS_LIVE combination");

  // Provenance consistency
  assert.equal(res.beamCases["ULS"].modelRevision, input.modelRevision);
  assert.equal(res.beamCases["SLS_TOTAL"].analysisStamp, input.analysisStamp);
});

test("P17 Core Fix Decision 4: qualityReviewed false explicitly appears in missingFacts and prevents PASS", () => {
  const unapprovedInput = createExplicitBeamInput({
    qualityReviewed: {
      value: false,
      source: "unapproved_engineer_signoff"
    }
  });

  const res = executeAnalyticalReportPipeline(unapprovedInput);

  assert.equal(res.success, false);
  assert.equal(res.status, "incomplete");
  assert.ok(
    res.missingFacts.some(f => f.field === "qualityReviewed" && f.severity === "blocking"),
    "qualityReviewed must be flagged as blocking missingFact"
  );
  assert.equal(res.p15Schedule, null);
  assert.equal(res.p16Report, null);
});
