import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import type { CadModel } from "../../src/lib/hsyncad/model";
import { runStructuralAnalysis, DEFAULT_ANALYSIS_SETTINGS } from "../../src/lib/hsyncad/analysis";
import { getReportReadiness } from "../../src/lib/hsyncad/report-readiness";
import { executeStructuralBridge } from "../../src/lib/hsyncad/structural/cad-model-bridge";
import { parseIde10 } from "../../src/lib/hsyncad/ide-import";
import { importIdeWorkspace } from "../../src/lib/hsyncad/ide-workspace";

function buildSynthetic2StoreyModel(): CadModel {
  return {
    schemaVersion: 1,
    name: "Synthetic 2-Storey Frame",
    floors: [
      { id: "F1", name: "Zemin Kat", elevation: 0, height: 3.0 },
      { id: "F2", name: "1. Kat", elevation: 3.0, height: 3.0 },
    ],
    materials: [
      { id: "C25", name: "C25", kind: "concrete", fckMpa: 25 },
      { id: "B420C", name: "B420C", kind: "steel", fykMpa: 420 },
    ],
    elements: [
      // F1 columns
      { id: "C11", type: "column", floorId: "F1", name: "S101", materialId: "C25", layer: "Kolonlar", position: { x: 0, y: 0 }, width: 0.4, depth: 0.4, height: 3.0, rotation: 0 },
      { id: "C12", type: "column", floorId: "F1", name: "S102", materialId: "C25", layer: "Kolonlar", position: { x: 5, y: 0 }, width: 0.4, depth: 0.4, height: 3.0, rotation: 0 },
      { id: "C13", type: "column", floorId: "F1", name: "S103", materialId: "C25", layer: "Kolonlar", position: { x: 5, y: 4 }, width: 0.4, depth: 0.4, height: 3.0, rotation: 0 },
      { id: "C14", type: "column", floorId: "F1", name: "S104", materialId: "C25", layer: "Kolonlar", position: { x: 0, y: 4 }, width: 0.4, depth: 0.4, height: 3.0, rotation: 0 },
      // F1 beams
      { id: "B11", type: "beam", floorId: "F1", name: "K101", materialId: "C25", layer: "Kirişler", start: { x: 0, y: 0 }, end: { x: 5, y: 0 }, width: 0.25, height: 0.5 },
      { id: "B12", type: "beam", floorId: "F1", name: "K102", materialId: "C25", layer: "Kirişler", start: { x: 5, y: 0 }, end: { x: 5, y: 4 }, width: 0.25, height: 0.5 },
      { id: "B13", type: "beam", floorId: "F1", name: "K103", materialId: "C25", layer: "Kirişler", start: { x: 5, y: 4 }, end: { x: 0, y: 4 }, width: 0.25, height: 0.5 },
      { id: "B14", type: "beam", floorId: "F1", name: "K104", materialId: "C25", layer: "Kirişler", start: { x: 0, y: 4 }, end: { x: 0, y: 0 }, width: 0.25, height: 0.5 },
      // F1 slab
      { id: "D11", type: "slab", floorId: "F1", name: "D101", materialId: "C25", layer: "Döşemeler", points: [{ x: 0, y: 0 }, { x: 5, y: 0 }, { x: 5, y: 4 }, { x: 0, y: 4 }], thickness: 0.15, finishLoad: 1.5, liveLoad: 2.0 },
      // F2 columns
      { id: "C21", type: "column", floorId: "F2", name: "S201", materialId: "C25", layer: "Kolonlar", position: { x: 0, y: 0 }, width: 0.4, depth: 0.4, height: 3.0, rotation: 0 },
      { id: "C22", type: "column", floorId: "F2", name: "S202", materialId: "C25", layer: "Kolonlar", position: { x: 5, y: 0 }, width: 0.4, depth: 0.4, height: 3.0, rotation: 0 },
      { id: "C23", type: "column", floorId: "F2", name: "S203", materialId: "C25", layer: "Kolonlar", position: { x: 5, y: 4 }, width: 0.4, depth: 0.4, height: 3.0, rotation: 0 },
      { id: "C24", type: "column", floorId: "F2", name: "S204", materialId: "C25", layer: "Kolonlar", position: { x: 0, y: 4 }, width: 0.4, depth: 0.4, height: 3.0, rotation: 0 },
      // F2 beams
      { id: "B21", type: "beam", floorId: "F2", name: "K201", materialId: "C25", layer: "Kirişler", start: { x: 0, y: 0 }, end: { x: 5, y: 0 }, width: 0.25, height: 0.5 },
      { id: "B22", type: "beam", floorId: "F2", name: "K202", materialId: "C25", layer: "Kirişler", start: { x: 5, y: 0 }, end: { x: 5, y: 4 }, width: 0.25, height: 0.5 },
      { id: "B23", type: "beam", floorId: "F2", name: "K203", materialId: "C25", layer: "Kirişler", start: { x: 5, y: 4 }, end: { x: 0, y: 4 }, width: 0.25, height: 0.5 },
      { id: "B24", type: "beam", floorId: "F2", name: "K204", materialId: "C25", layer: "Kirişler", start: { x: 0, y: 4 }, end: { x: 0, y: 0 }, width: 0.25, height: 0.5 },
      // F2 slab
      { id: "D21", type: "slab", floorId: "F2", name: "D201", materialId: "C25", layer: "Döşemeler", points: [{ x: 0, y: 0 }, { x: 5, y: 0 }, { x: 5, y: 4 }, { x: 0, y: 4 }], thickness: 0.15, finishLoad: 1.5, liveLoad: 2.0 },
    ],
  };
}

test("cad-model-bridge solves 3D modal, CQC spectrum, TBDY global checks, and wires through runStructuralAnalysis", () => {
  const model = buildSynthetic2StoreyModel();
  const bridge = executeStructuralBridge(model, { ss: 0.9, s1: 0.25, soilClass: "ZC", rx: 8, ry: 8 });
  assert.equal(bridge.modalFull.status, "solved", `modalFull failed: ${bridge.modalFull.reason}`);
  assert.equal(bridge.gravitySolve.status, "solved");
  assert.ok(bridge.modalFull.coverageX >= 0.95);
  assert.ok(bridge.modalFull.coverageY >= 0.95);
  assert.ok(bridge.modalFull.coverageRZ >= 0.95);
  assert.equal(bridge.spectrumX.status, "solved");
  assert.equal(bridge.spectrumY.status, "solved");
  assert.ok(bridge.quantities.totalConcreteM3 > 10);
  assert.equal(bridge.material.ecMpa, 3250 * Math.sqrt(25) + 14000);

  const analysis = runStructuralAnalysis(model, DEFAULT_ANALYSIS_SETTINGS);
  assert.ok(analysis.analyticalBridge);
  assert.equal(analysis.analyticalBridge?.modalFull.status, "solved");

  const readiness = getReportReadiness(model, analysis, analysis.designResult);
  assert.equal(readiness.calculationComplete, true);
  // Synthetic model has no native rebar schedule (and may fail toy member checks)
  assert.ok(readiness.status === "requires_review" || readiness.status === "fail");
});

const MS1_PATH = "D:\\IDM_DOWNLOAD\\MUSTAFA SELVİ TÜM PROJELER\\STATİK\\1.kısım\\MUSTAFA SELVİ 1.KISIM.ide10";
const MS2_PATH = "D:\\IDM_DOWNLOAD\\MUSTAFA SELVİ TÜM PROJELER\\STATİK\\2.kısım\\MUSTAFA SELVİ 2.KISIM.ide10";
const SK_PATH = "D:\\IDM_DOWNLOAD\\SÜHEYLA KARA PROJELER\\STATİK\\218 ada 50 parsel STATİK.ide10";

test("MS1/MS2/SK native .ide10 bridge calibration (volume + 3D modal >=95%)", { skip: !existsSync(MS1_PATH) || !existsSync(MS2_PATH) || !existsSync(SK_PATH) }, async () => {
  const cases = [
    { name: "MS2", path: MS2_PATH, gtVol: 633.099 },
    { name: "MS1", path: MS1_PATH, gtVol: 1334.015 },
    { name: "SK", path: SK_PATH, gtVol: 1873.479 },
  ];

  for (const c of cases) {
    const buf = readFileSync(c.path);
    const ide = await parseIde10(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength), `${c.name}.ide10`);
    const model = importIdeWorkspace(ide);
    const bridge = executeStructuralBridge(model);

    assert.equal(bridge.modalFull.status, "solved", `${c.name} full modal must solve: ${bridge.modalFull.reason}`);
    assert.ok(bridge.modalFull.coverageX >= 0.95, `${c.name} coverageX >= 95%`);
    assert.ok(bridge.modalFull.coverageY >= 0.95, `${c.name} coverageY >= 95%`);
    assert.equal(bridge.gravitySolve.status, "solved", `${c.name} gravity solve must pass`);

    const volRatio = bridge.quantities.totalConcreteM3 / c.gtVol;
    assert.ok(volRatio > 0.97 && volRatio < 1.03, `${c.name} concrete volume ratio ${volRatio.toFixed(4)} out of [0.97, 1.03]`);
    assert.equal(bridge.reinforcementSchedule.isComplete, true, `${c.name} reinforcementSchedule must be complete`);
    assert.ok((bridge.reinforcementSchedule.totalMassKg ?? 0) > 10000, `${c.name} rebar mass must be realistic > 10t`);
  }
});
