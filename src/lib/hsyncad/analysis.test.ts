import { test } from "node:test";
import assert from "node:assert/strict";
import { createDemoModel } from "./model";
import { runStructuralAnalysis } from "./analysis";

test("TBDY 2018 analysis calculates building weight, period, base shear and storey drift", () => {
  const model = createDemoModel();
  const result = runStructuralAnalysis(model);

  assert.ok(result.totalWeightKn > 50, "Bina ağırlığı pozitif ve gerçekçi olmalı");
  assert.ok(result.periodSec > 0.05 && result.periodSec < 2.0, "Doğal periyot gerçekçi sınırda olmalı");
  assert.ok(result.baseShearKn >= result.minBaseShearKn, "Taban kesme kuvveti minimum kontrolden küçük olamaz");
  assert.equal(result.storeys.length, model.floors.length);

  const zemin = result.storeys[0];
  assert.ok(zemin.totalWeightKn > 0);
  assert.ok(zemin.lateralForceKn > 0);
  assert.ok(zemin.shearForceKn >= zemin.lateralForceKn);
  assert.ok(Number.isFinite(zemin.driftRatio));
});

test("Member forces and capacity checks provide rebar and capacity ratios", () => {
  const model = createDemoModel();
  const result = runStructuralAnalysis(model);

  const columns = model.elements.filter(e => e.type === "column");
  for (const col of columns) {
    const check = result.members[col.id];
    assert.ok(check, `Kolon ${col.name} analiz çıktısında bulunmalı`);
    assert.ok(check.axialKn > 0);
    assert.ok(check.capacityRatio > 0);
    assert.ok(check.axialStressRatio !== undefined && check.axialStressRatio >= 0);
    assert.ok(check.requiredRebarCm2 > 0);
    assert.ok(check.providedRebarText.includes("Φ"));
  }

  const beams = model.elements.filter(e => e.type === "beam");
  for (const beam of beams) {
    const check = result.members[beam.id];
    assert.ok(check, `Kiriş ${beam.name} analiz çıktısında bulunmalı`);
    assert.ok(check.momentKnm > 0);
    assert.ok(check.capacityRatio > 0);
    assert.ok(check.requiredRebarCm2 > 0);
  }
});

test("Higher seismic hazard or ductility changes base shear accordingly", () => {
  const model = createDemoModel();
  const lowHazard = runStructuralAnalysis(model, { sds: 0.5 });
  const highHazard = runStructuralAnalysis(model, { sds: 1.5 });

  assert.ok(highHazard.baseShearKn > lowHazard.baseShearKn, "Yüksek ivme daha büyük taban kesme kuvveti üretmeli");
});
