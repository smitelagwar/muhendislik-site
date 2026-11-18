import assert from "node:assert/strict";
import { test } from "node:test";
import { createDemoModel, type CadModel } from "../model";
import { executeStructuralBridge, type NativeIdeProjectLike } from "./cad-model-bridge";

const close = (actual: number, expected: number, tol = 1e-6) => {
  assert.ok(Math.abs(actual - expected) <= tol, `${actual} != ${expected} (tol=${tol})`);
};

function attachIdeSource(model: CadModel, source: NativeIdeProjectLike): CadModel {
  return {
    ...model,
    ideImport: {
      source: source as NonNullable<CadModel["ideImport"]>["source"],
      mappedIds: model.elements.map((e) => e.id),
      references: [],
    },
  };
}

test("DB150 raft foundation (foundation: true + rebarLayout.kind=raft) is classified as raft, not ceiling slab", () => {
  const base = createDemoModel();
  const floorId = base.floors[0].id;
  const matId = base.materials[0].id;
  // Remove demo slab from model.elements (simulating reference-only slabs/rafts)
  const modelNoSlab: CadModel = {
    ...base,
    elements: base.elements.filter((e) => e.type !== "slab"),
  };

  const raftPoly = [
    { x: -1, y: -1 },
    { x: 5, y: -1 },
    { x: 5, y: 5 },
    { x: -1, y: 5 },
  ]; // 6 x 6 = 36 m², t = 0.75 m -> 27.0 m³
  const slabPoly = [
    { x: 0, y: 0 },
    { x: 4, y: 0 },
    { x: 4, y: 4 },
    { x: 0, y: 4 },
  ]; // 4 x 4 = 16 m², t = 0.15 m -> 2.4 m³

  const model = attachIdeSource(modelNoSlab, {
    projectName: "SÜHEYLA KARA",
    elements: [
      {
        id: "slab-d101",
        name: "D101",
        type: "slab",
        floorId,
        thickness: 0.15,
        points: slabPoly,
      },
      {
        id: "raft-db150",
        name: "DB150",
        type: "slab",
        floorId,
        thickness: 0.75,
        foundation: true,
        points: raftPoly,
        rebarLayout: {
          kind: "raft",
          topX: "Ø16/15",
          topY: "Ø14/11",
          bottomX: "Ø16/15",
          bottomY: "Ø14/11",
        },
      },
    ],
  });

  // Also test without D101 interference vs with D101:
  const res = executeStructuralBridge(model, {
    ss: 0.467,
    s1: 0.164,
    soilClass: "ZB",
  });

  assert.equal(res.counts.rafts, 1);
  assert.equal(res.counts.slabs, 1);
  close(res.quantities.foundationM3, 27.0);
  close(res.quantities.slabM3, 2.4);

  const db150Bars = res.reinforcementSchedule.uniqueBars.filter((b) => b.elementId === "raft-db150");
  assert.ok(db150Bars.length === 4, `Expected 4 raft bar groups for DB150, got ${db150Bars.length}`);
  assert.ok(db150Bars.every((b) => b.elementType === "foundation"));
  assert.ok(db150Bars.every((b) => b.mode === "verification"));
  assert.ok(db150Bars.some((b) => b.diameterMm === 16), "DB150 raft must include Ø16 bars");
  assert.ok(db150Bars.some((b) => b.diameterMm === 14), "DB150 raft must include Ø14 bars");
  assert.ok(!db150Bars.some((b) => b.diameterMm === 8), "DB150 raft must NOT use Ø8 slab mesh");

  const foundationSubtotal = res.reinforcementSchedule.subtotalsByElementType.find((s) => s.elementType === "foundation");
  assert.ok(foundationSubtotal && foundationSubtotal.totalMassKg > 0, "foundation rebar subtotal must be positive");
  const dia16 = res.reinforcementSchedule.subtotalsByDiameter.find((d) => d.diameterMm === 16);
  assert.ok(dia16 && dia16.totalMassKg > 0, "Ø16 rebar subtotal must be positive");

  const d101Bars = res.reinforcementSchedule.uniqueBars.filter((b) => b.elementId === "slab-d101");
  assert.ok(d101Bars.length > 0);
  assert.ok(d101Bars.every((b) => b.elementType === "slab" && b.diameterMm === 8));
});

test("DB150 raft with isFoundationRaft: true or also mapped in model.elements stays a raft foundation", () => {
  const base = createDemoModel();
  const floorId = base.floors[0].id;
  const matId = base.materials[0].id;
  const raftPoly = [
    { x: 0, y: 0 },
    { x: 5, y: 0 },
    { x: 5, y: 4 },
    { x: 0, y: 4 },
  ]; // 20 m², t = 0.75 m -> 15.0 m³

  // Case A: isFoundationRaft: true (no foundation: true, no rebarLayout)
  const modelFlag = attachIdeSource(
    {
      ...base,
      elements: base.elements.filter((e) => e.type !== "slab"),
    },
    {
      elements: [
        {
          id: "raft-db150-flag",
          name: "DB150",
          type: "slab",
          floorId,
          thickness: 0.75,
          isFoundationRaft: true,
          points: raftPoly,
        },
      ],
    }
  );
  const resFlag = executeStructuralBridge(modelFlag, { ss: 0.467, s1: 0.164, soilClass: "ZB" });
  assert.equal(resFlag.counts.rafts, 1);
  assert.equal(resFlag.counts.slabs, 0);
  close(resFlag.quantities.foundationM3, 15.0);
  close(resFlag.quantities.slabM3, 0);
  const flagBars = resFlag.reinforcementSchedule.uniqueBars.filter((b) => b.elementId === "raft-db150-flag");
  assert.ok(flagBars.length === 4 && flagBars.every((b) => b.elementType === "foundation"));
  assert.equal(resFlag.reinforcementSchedule.subtotalsByElementType.find((s) => s.elementType === "slab"), undefined);

  // Case B: DB150 (without holes) also present in model.elements as type: "slab"
  const modelMapped = attachIdeSource(
    {
      ...base,
      elements: [
        ...base.elements.filter((e) => e.type !== "slab"),
        {
          id: "raft-db150-mapped",
          name: "DB150",
          type: "slab",
          floorId,
          materialId: matId,
          layer: "Döşemeler",
          points: raftPoly,
          thickness: 0.75,
        },
      ],
    },
    {
      elements: [
        {
          id: "raft-db150-mapped",
          name: "DB150",
          type: "slab",
          floorId,
          thickness: 0.75,
          foundation: true,
          points: raftPoly,
          rebarLayout: {
            kind: "raft",
            topX: "Ø16/15",
            topY: "Ø16/15",
            bottomX: "Ø16/15",
            bottomY: "Ø16/15",
          },
        },
      ],
    }
  );
  const resMapped = executeStructuralBridge(modelMapped, { ss: 0.467, s1: 0.164, soilClass: "ZB" });
  assert.equal(resMapped.counts.rafts, 1);
  assert.equal(resMapped.counts.slabs, 0);
  close(resMapped.quantities.foundationM3, 15.0);
  close(resMapped.quantities.slabM3, 0);
  const mappedBars = resMapped.reinforcementSchedule.uniqueBars.filter((b) => b.elementId === "raft-db150-mapped");
  assert.ok(mappedBars.length === 4);
  assert.ok(mappedBars.every((b) => b.elementType === "foundation" && b.diameterMm === 16));
  assert.equal(resMapped.reinforcementSchedule.subtotalsByElementType.find((s) => s.elementType === "slab"), undefined);
});

test("rebarGrade resolves B420C (420 MPa) from 'C25 B420C' when structural steel S235 is also present", () => {
  const base = createDemoModel();
  const model: CadModel = {
    ...base,
    materials: [
      {
        id: "ide-mat-0",
        name: "C25 B420C",
        kind: "concrete",
        fckMpa: 25,
        fykMpa: 420,
        elasticModulusMpa: 30250,
        unitWeightTfM3: 2.5,
      },
      {
        id: "ide-mat-1",
        name: "S235",
        kind: "steel",
        fckMpa: null,
        fykMpa: null,
        elasticModulusMpa: 200000,
        unitWeightTfM3: 7.849,
      },
    ],
  };

  const res = executeStructuralBridge(model, { ss: 0.429, s1: 0.143, soilClass: "ZB" });
  assert.equal(res.material.concreteGrade, "C25");
  assert.equal(res.material.fckMpa, 25);
  assert.equal(res.material.rebarGrade, "B420C");
  assert.equal(res.material.fykMpa, 420);
  assert.ok(res.reinforcementSchedule.uniqueBars.every((b) => b.materialId === "B420C"));
  assert.deepEqual(
    res.reinforcementSchedule.subtotalsByMaterial.map((m) => m.materialId),
    ["B420C"]
  );

  // Even when S235 explicitly carries fykMpa: 235, RC rebar must stay B420C / 420 MPa
  const modelWithSteelYield: CadModel = {
    ...model,
    materials: [
      model.materials[0],
      {
        id: "ide-mat-1",
        name: "S235",
        kind: "steel",
        fckMpa: null,
        fykMpa: 235,
        elasticModulusMpa: 200000,
        unitWeightTfM3: 7.849,
      },
    ],
  };
  const res2 = executeStructuralBridge(modelWithSteelYield, { ss: 0.429, s1: 0.143, soilClass: "ZB" });
  assert.equal(res2.material.rebarGrade, "B420C");
  assert.equal(res2.material.fykMpa, 420);

  // C30 B500C + S235 resolves B500C / 500 MPa
  const modelB500: CadModel = {
    ...model,
    materials: [
      {
        id: "ide-mat-0",
        name: "C30 B500C",
        kind: "concrete",
        fckMpa: 30,
        fykMpa: 500,
      },
      modelWithSteelYield.materials[1],
    ],
  };
  const resB500 = executeStructuralBridge(modelB500, { ss: 0.429, s1: 0.143, soilClass: "ZB" });
  assert.equal(resB500.material.concreteGrade, "C30");
  assert.equal(resB500.material.rebarGrade, "B500C");
  assert.equal(resB500.material.fykMpa, 500);
});

test("missingFacts flags default ZC soil class when neither options.soilClass nor ideSource.soilClass is provided", () => {
  const base = createDemoModel();
  const model = attachIdeSource(base, {
    seismicSoil: {
      ss: 0.429,
      s1: 0.143,
    },
  });

  const resDefault = executeStructuralBridge(model);
  assert.equal(resDefault.spectrum.soil, "ZC");
  assert.ok(
    resDefault.missingFacts.includes("R3_SOIL_CLASS_DEFAULT_ZC_USED"),
    `Expected R3_SOIL_CLASS_DEFAULT_ZC_USED in missingFacts, got: ${JSON.stringify(resDefault.missingFacts)}`
  );
  assert.ok(!resDefault.missingFacts.includes("R3_SS_PARAM_FROM_PROJECT_DEFAULT_USED"));

  const resExplicit = executeStructuralBridge(model, { soilClass: "ZB" });
  assert.equal(resExplicit.spectrum.soil, "ZB");
  assert.ok(!resExplicit.missingFacts.includes("R3_SOIL_CLASS_DEFAULT_ZC_USED"));
  assert.equal(resExplicit.status, "solved");
});
