import { test } from "node:test";
import assert from "node:assert/strict";
import { createDemoModel } from "./model";
import { runStructuralAnalysis, type AnalysisResult } from "./analysis";

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

test("Joint shear safety, strong column, irregularities and punching are evaluated", () => {
  const model = createDemoModel();
  const result = runStructuralAnalysis(model);

  const columns = model.elements.filter(e => e.type === "column");
  for (const col of columns) {
    const joint = result.joints[col.id];
    assert.ok(joint, `Kolon ${col.name} birleşim kesme kontrolünde bulunmalı`);
    assert.ok(joint.shearDemandKn > 0);
    assert.ok(joint.shearCapacityKn > 0);
    assert.ok(joint.shearRatio >= 0);

    const momentCheck = result.columnBeamMoments[col.id];
    assert.ok(momentCheck, `Kolon ${col.name} güçlü kolon tahkikinde bulunmalı`);
    assert.ok(momentCheck.sumColumnMomentKnm > 0);
    assert.ok(momentCheck.ratio >= 0);

    const punch = result.punching[col.id];
    assert.ok(punch, `Kolon ${col.name} zımbalama kontrolünde bulunmalı`);
    assert.ok(punch.punchingCapacityKn > 0);
  }

  assert.ok(result.irregularities.torsionalA1.length > 0);
  assert.ok(result.irregularities.softStoreyB2.length > 0);
});

test("Milestone 2: 3D Frame FEM Solver produces continuous 11 stations for columns, beams, and walls", () => {
  const model = createDemoModel();
  const result = runStructuralAnalysis(model);

  // Check 3D nodal displacements exist
  assert.ok(Object.keys(result.displacements).length > 0, "3D düğüm noktası deplasmanları üretilmeli");
  for (const [, disp] of Object.entries(result.displacements)) {
    assert.equal(disp.length, 6, "Her düğüm noktasında 6 serbestlik derecesi bulunmalı [ux, uy, uz, rotx, roty, rotz]");
  }

  // Check 11 member stations exist for columns and beams
  for (const el of model.elements) {
    if (el.type === "column" || el.type === "beam" || el.type === "wall") {
      const stations = result.memberStations[el.id];
      assert.ok(stations, `Eleman ${el.name} için istasyon kuvvetleri bulunmalı`);
      assert.equal(stations.length, 11, `Eleman ${el.name} 11 istasyonda hesaplanmalı`);

      // Check station ratios from 0.0 to 1.0
      assert.equal(stations[0].ratio, 0.0);
      assert.equal(stations[10].ratio, 1.0);
      for (const st of stations) {
        assert.ok(Number.isFinite(st.N), "Eksenel kuvvet sonlu olmalı");
        assert.ok(Number.isFinite(st.V2), "Kesme kuvveti V2 sonlu olmalı");
        assert.ok(Number.isFinite(st.M3), "Eğilme momenti M3 sonlu olmalı");
      }

      // Check PROJECT.md memberForces interface contract
      const contractForces = result.memberForces[el.id];
      assert.ok(contractForces, `memberForces sözleşmesi ${el.id} için mevcut olmalı`);
      assert.equal(contractForces.length, 11);
      assert.ok(contractForces[0].x >= 0);
    }
  }
});

test("Milestone 2: 33 Load Combinations per TS 500 & TBDY 2018 §4.4.3 are superposed", () => {
  const model = createDemoModel();
  const result = runStructuralAnalysis(model);

  assert.equal(result.combinations.length, 33, "Tam 33 yük kombinasyonu (1 düşey + 32 deprem) süperpoze edilmeli");
  const comboNames = new Set(result.combinations.map(c => c.name));

  // Must include gravity
  assert.ok(comboNames.has("1.4G+1.6Q"), "1.4G+1.6Q kombinasyonu bulunmalı");

  // Must include vertical earthquake Ez = 0.3 * Sds * G
  const withEz = result.combinations.filter(c => c.name.includes("Ez"));
  assert.equal(withEz.length, 32, "Tüm 32 deprem kombinasyonu düşey deprem Ez içermeli");

  // Must include uplift 0.9G combinations
  const uplift = result.combinations.filter(c => c.name.startsWith("0.9G"));
  assert.equal(uplift.length, 16, "16 adet 0.9G devrilme kombinasyonu bulunmalı");
});

test("Milestone 2: Storey dynamic results include 3 natural periods, base shears and overturning moments", () => {
  const model = createDemoModel();
  const result = runStructuralAnalysis(model);

  assert.equal(result.naturalPeriods.length, 3, "İlk 3 doğal periyot (T1, T2, T3) raporlanmalı");
  assert.ok(result.naturalPeriods[0] > 0.05, "T1 periyodu pozitif ve gerçekçi olmalı");
  assert.ok(result.naturalPeriods[1] > 0.02, "T2 periyodu pozitif olmalı");
  assert.ok(result.naturalPeriods[2] > 0.01, "T3 periyodu pozitif olmalı");

  assert.ok(result.baseShears.Vtx > 0, "Taban kesme kuvveti Vtx pozitif olmalı");
  assert.ok(result.baseShears.Vty > 0, "Taban kesme kuvveti Vty pozitif olmalı");
  assert.ok(result.baseShears.Mox > 0, "Devrilme momenti Mox pozitif olmalı");
  assert.ok(result.baseShears.Moy > 0, "Devrilme momenti Moy pozitif olmalı");

  // Rigid floor diaphragms results
  assert.ok(result.floorDiaphragms.length > 0, "Kat diyafram sonuçları mevcut olmalı");
  const fd = result.floorDiaphragms[0];
  assert.ok(Number.isFinite(fd.driftRatioX));
  assert.ok(Number.isFinite(fd.driftRatioY));
});

test("Milestone 2: Shear Wall macro-elements are evaluated for boundary zones and shear design", () => {
  const model = createDemoModel();
  const result = runStructuralAnalysis(model);

  const walls = model.elements.filter(e => e.type === "wall");
  assert.ok(walls.length > 0, "Demo modelde perde elemanı bulunmalı");

  for (const wall of walls) {
    const check = result.members[wall.id];
    assert.ok(check, `Perde ${wall.name} analiz sonuçlarında bulunmalı`);
    assert.equal(check.type, "wall");
    assert.ok(check.capacityMomentKnm > 0, "Perde moment kapasitesi pozitif olmalı");
    assert.ok(check.shearCapacityKn !== undefined && check.shearCapacityKn > 0, "Perde kesme kapasitesi Vr hesaplanmalı");
    assert.ok(check.requiredRebarCm2 > 0, "Perde donatı alanı hesaplanmalı");
    assert.ok(check.providedRebarText.includes("Uç"), "Perde uç bölgesi donatısı belirtilmeli");
    assert.ok(check.providedRebarText.includes("Gövde"), "Perde gövde donatısı belirtilmeli");
  }
});
