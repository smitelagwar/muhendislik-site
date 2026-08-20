import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import {
  CURRENT_RULE_SNAPSHOT,
  ENGINE_VERSION,
  RULE_SNAPSHOT_VERSION,
  calculateRuhsatFeasibility,
  evaluateTechnicalTriggers,
  type TechnicalTriggerContext,
} from "../src/lib/calculations/modules/ruhsat-on-fizibilite";
import {
  RUHSAT_EXPORT_SCHEMA_VERSION,
  buildRuhsatAnalysisExport,
  buildRuhsatPdfSnapshot,
} from "../src/lib/calculations/modules/ruhsat-on-fizibilite/reporting";
import {
  makeCalculationRequest,
  makeRawCurrentLawInput,
  makeScenarioAssumptions,
  normalizeCurrentLawFixture,
} from "./fixtures/ruhsat-on-fizibilite-fixtures";

function triggerContext(overrides: Partial<TechnicalTriggerContext> = {}): TechnicalTriggerContext {
  return {
    floorCount: 5,
    buildingHeightM: 18,
    totalUnits: 15,
    unitsPerFloor: 3,
    unitType: "2+1",
    projectUseType: "RESIDENTIAL",
    basementIntent: "NONE",
    parcelAreaM2: 1_000,
    roofProjectionAreaM2: 350,
    estimatedTotalBuildingAreaM2: 1_750,
    shelterPersonCapacity: null,
    ...overrides,
  };
}

async function main() {
  const checks: string[] = [];
  const rawInput = makeRawCurrentLawInput();
  const baseline = calculateRuhsatFeasibility(
    makeCalculationRequest(normalizeCurrentLawFixture()),
    CURRENT_RULE_SNAPSHOT
  );
  assert.equal(baseline.ok, true);
  if (!baseline.ok) throw new Error("Release fixture hesaplanamadı.");
  assert.equal(baseline.value.status, "CALCULATED");

  // Yanlış eşik / off-by-one / float sınırları.
  assert.equal(evaluateTechnicalTriggers(triggerContext({ floorCount: 9 })).lift.requiredLiftCount, 1);
  assert.equal(evaluateTechnicalTriggers(triggerContext({ floorCount: 10 })).lift.requiredLiftCount, 2);
  assert.equal(evaluateTechnicalTriggers(triggerContext({ buildingHeightM: 21.499999 })).fire.heightGateReached, false);
  assert.equal(evaluateTechnicalTriggers(triggerContext({ buildingHeightM: 21.5 })).fire.heightGateReached, true);
  assert.equal(evaluateTechnicalTriggers(triggerContext({ estimatedTotalBuildingAreaM2: 1_999.999999 })).nseb.state, "NOT_TRIGGERED");
  assert.equal(evaluateTechnicalTriggers(triggerContext({ estimatedTotalBuildingAreaM2: 2_000 })).nseb.state, "CHECK_REQUIRED");
  assert.equal(evaluateTechnicalTriggers(triggerContext({ parcelAreaM2: 2_000, roofProjectionAreaM2: 1_000 })).rainWater.state, "NOT_TRIGGERED");
  assert.equal(evaluateTechnicalTriggers(triggerContext({ parcelAreaM2: 2_000.000001 })).rainWater.state, "REQUIRES_CONFIRMATION");
  checks.push("threshold-off-by-one-float");

  // Geometri yokken sayı yalnız adaydır; sessiz kesinlik üretilemez.
  const geometryUnknown = calculateRuhsatFeasibility(
    makeCalculationRequest(normalizeCurrentLawFixture({ geometryCapacityM2: null })),
    CURRENT_RULE_SNAPSHOT
  );
  assert.equal(geometryUnknown.ok, true);
  if (!geometryUnknown.ok) throw new Error("Geometri teyitsiz fixture hesaplanamadı.");
  assert.equal(geometryUnknown.value.legalRights.geometryStatus, "UNKNOWN");
  assert.equal(geometryUnknown.value.legalRights.traces.effectiveFootprintLimit?.approximate, true);
  assert(geometryUnknown.value.qa.includes("GEOMETRY_UNVERIFIED"));
  assert.equal(geometryUnknown.value.exactPlacementClaimed, false);
  assert(geometryUnknown.value.scenarios.every((scenario) => scenario.exactPlacementClaimed === false));
  assert(geometryUnknown.value.scenarios.every((scenario) => scenario.assumptionStatus === "HEURISTIC"));
  assert(geometryUnknown.value.scenarios.every((scenario) => scenario.placementClaimStatus === "CANDIDATE_GEOMETRY_UNVERIFIED"));
  checks.push("false-certainty-and-heuristic");

  // Girdi değişince senaryolar gerçekten yeniden hesaplanmalıdır.
  const lowerEmsal = calculateRuhsatFeasibility(
    makeCalculationRequest(normalizeCurrentLawFixture({ kaks: "0,60" })),
    CURRENT_RULE_SNAPSHOT
  );
  assert.equal(lowerEmsal.ok, true);
  if (!lowerEmsal.ok) throw new Error("Düşük emsal fixture hesaplanamadı.");
  assert.notDeepEqual(
    lowerEmsal.value.scenarios.map((scenario) => scenario.finalTotalUnits),
    baseline.value.scenarios.map((scenario) => scenario.finalTotalUnits)
  );
  checks.push("scenario-recalculation");

  // Döngü final sonuç gibi gizlenemez.
  const cycle = calculateRuhsatFeasibility(
    makeCalculationRequest(
      normalizeCurrentLawFixture({ taks: "0,465", kaks: "3", floorCount: "5", geometryCapacityM2: "465" }),
      makeScenarioAssumptions({ secondLiftAdditionalAreaM2: 60 })
    ),
    CURRENT_RULE_SNAPSHOT
  );
  assert.equal(cycle.ok, true);
  if (!cycle.ok) throw new Error("Cycle fixture hesaplanamadı.");
  assert.equal(cycle.value.status, "PARTIAL");
  assert(cycle.value.qa.includes("SCENARIO_NON_CONVERGENCE"));
  assert(cycle.value.scenarios.some((scenario) => scenario.convergenceStatus === "CYCLE_DETECTED" && scenario.finalTotalUnits === null));
  checks.push("cycle-not-hidden");

  // Rule ve provenance referansları canonical snapshot içinde izlenebilir olmalıdır.
  const sourceIds = new Set<string>(CURRENT_RULE_SNAPSHOT.sources.map((source) => source.id));
  const ruleIds = new Set<string>(CURRENT_RULE_SNAPSHOT.executableRules.map((rule) => rule.id));
  for (const rule of CURRENT_RULE_SNAPSHOT.executableRules) {
    assert(rule.sourceIds.length > 0, `${rule.id} kaynak referansı taşımalı.`);
    assert(rule.sourceIds.every((sourceId) => sourceIds.has(sourceId)), `${rule.id} bilinmeyen kaynak içeriyor.`);
  }
  for (const trace of Object.values(baseline.value.legalRights.traces)) {
    assert(trace && trace.ruleIds.length > 0 && trace.ruleIds.every((ruleId) => ruleIds.has(ruleId)));
    assert(trace.sourceIds.length > 0, "Hesap izi provenance kaybetmemeli.");
  }
  for (const scenario of baseline.value.scenarios) {
    assert(scenario.triggers, "Sabitlenmiş senaryo trigger seti taşımalı.");
    if (!scenario.triggers) continue;
    for (const trigger of [scenario.triggers.lift, scenario.triggers.shelter, scenario.triggers.fire, scenario.triggers.nseb, scenario.triggers.rainWater]) {
      assert(trigger.ruleIds.length > 0, "Sayısal teknik trigger rule id taşımalı.");
      assert(trigger.ruleIds.every((ruleId) => ruleIds.has(ruleId)), "Teknik trigger canonical olmayan rule id taşıyor.");
    }
  }
  assert.equal(baseline.value.versions.engine, ENGINE_VERSION);
  assert.equal(baseline.value.versions.ruleSnapshot, RULE_SNAPSHOT_VERSION);
  checks.push("rule-source-version-provenance");

  // PDF ve JSON aynı analizi, sürümü ve aday dilini taşımalıdır.
  const pdfSnapshot = buildRuhsatPdfSnapshot(geometryUnknown.value, makeRawCurrentLawInput({ geometryCapacityM2: null }), "22 Ağustos 2026 12:00");
  const jsonExport = buildRuhsatAnalysisExport(rawInput, baseline.value, "2026-08-22T12:00:00.000Z");
  assert.equal(jsonExport.schemaVersion, RUHSAT_EXPORT_SCHEMA_VERSION);
  assert.equal(jsonExport.analysis.versions.ruleSnapshot, baseline.value.versions.ruleSnapshot);
  const scenarioSection = pdfSnapshot.sections.find((section) => section.title === "Daire senaryoları");
  assert.equal(scenarioSection?.rows.length, 3);
  assert(scenarioSection?.rows.every((row) => row.value.includes("aday BB")));
  assert(pdfSnapshot.footnotes.some((note) => note.includes("kesin yerleşim")));
  checks.push("pdf-json-analysis-parity");

  // Route kaynaklarında URL privacy, legacy motor ve XSS sızıntısı olmamalıdır.
  const routeRoot = path.join(process.cwd(), "src", "app", "hesaplamalar", "tahmini-insaat-alani");
  const clientSource = await fs.readFile(path.join(routeRoot, "ruhsat-on-fizibilite-client.tsx"), "utf8");
  const routeFiles = [
    "ruhsat-on-fizibilite-client.tsx",
    "ruhsat-form-state.ts",
    "components/RuhsatInputFlow.tsx",
    "components/RuhsatShellSummary.tsx",
    "components/RuhsatResultsExperience.tsx",
    "components/RuhsatReportActions.tsx",
  ];
  const routeSource = (await Promise.all(routeFiles.map((file) => fs.readFile(path.join(routeRoot, file), "utf8")))).join("\n");
  assert(!clientSource.includes("searchParams.get("), "Yeni istemci legacy query değerlerini okumamalı.");
  assert(!clientSource.includes("localStorage"), "Yeni istemci localStorage kullanmamalı.");
  assert(!routeSource.includes("dangerouslySetInnerHTML"), "Kullanıcı girdisi HTML olarak render edilmemeli.");
  assert(!routeSource.includes("modules/tahmini-insaat-alani"), "Yeni route legacy motoru import etmemeli.");
  assert(routeSource.includes("HEURISTIC"), "Varsayım statüsü kullanıcı arayüzünde görünür olmalı.");
  assert(routeSource.includes("Kesin yerleşim iddiası: hayır"), "False-certainty uyarısı görünür olmalı.");
  checks.push("privacy-xss-legacy-boundary");

  const implementationState = await fs.readFile(path.join(process.cwd(), "docs", "ruhsat-on-fizibilite", "IMPLEMENTATION_STATE.md"), "utf8");
  assert(implementationState.includes("V1 JSON import"));
  assert(implementationState.includes("01.07.2026"));
  assert(implementationState.includes("REQUIRES_CONFIRMATION"));
  checks.push("deferred-scope-visible");

  console.log(JSON.stringify({ status: "ok", checks, criticalIssues: 0 }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
