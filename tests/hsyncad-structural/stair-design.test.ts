import test from "node:test";
import assert from "node:assert/strict";
import { designStair } from "../../src/lib/hsyncad/structural/stair-design";
import { beamMaterial } from "../../src/lib/hsyncad/structural/rc-beam-section";
import { landingBenchmarkGeometry, oneFlightGeometry, stairDesignInput, doubleFlightWithLandingGeometry } from "./stair-fixtures";

test("landing design reports hand-calculated G/Q reactions and 1D strip moment", () => {
  const input = stairDesignInput(landingBenchmarkGeometry()), result = designStair(input), landing = result.components[0];
  // Landing: 30 kN self weight + 3 kN finish + 12 kN live; both supports receive half.
  assert.ok(Math.abs(result.equilibrium.appliedKn - 45) < 1e-10);
  assert.ok(Math.abs(result.equilibrium.supportVerticalKn - 45) < 1e-10);
  assert.ok(Math.abs(landing.reactions[0].totalServiceKn - 22.5) < 1e-10);
  // ULS line load = 1.2(15+1.5) + 1.6(6) = 29.4 kN/m; M = qL²/8 = 14.7 kNm total width.
  assert.ok(Math.abs(landing.design.demandKnmPerM - 7.35) < 1e-8);
  assert.ok(Math.abs(result.supportReactions.find(s => s.supportId === "landing-support-left")!.ultimateKnByCombination["ULS-GQ"] - 29.4) < 1e-10);
  assert.equal(result.engineeringAcceptance, false);
  assert.equal(result.status, "local_review_ready");
  assert.ok(result.checks.some(c => c.id.endsWith(":main-minimum") && c.status === "pass"));
  assert.ok(result.checks.some(c => c.id.endsWith(":anchorage") && c.status === "pass"));
});

test("uncracked simple landing deflection agrees with the independent 5qL4/384EI oracle", () => {
  const result = designStair(stairDesignInput(landingBenchmarkGeometry())), landing = result.components[0];
  const h = 300, b = 1000, L = 2000, qNPerMm = 11.25;
  const Ig = b * h ** 3 / 12, Ec = beamMaterial(stairDesignInput(landingBenchmarkGeometry()).material).Ec;
  const expectedMm = 5 * qNPerMm * L ** 4 / (384 * Ec * Ig);
  const actualMm = landing.design.service.total.instantTotalMm;
  assert.ok(Math.abs(actualMm - expectedMm) / expectedMm < .01, `actual=${actualMm}; expected=${expectedMm}`);
});

test("double flight and landing loads collect at the shared intermediate support IDs", () => {
  const result = designStair(stairDesignInput(doubleFlightWithLandingGeometry()));
  const supports = new Map(result.supportReactions.map(s => [s.supportId, s]));
  assert.equal(result.physicalComponentCount, 3);
  assert.ok(supports.get("landing-left")!.serviceKn > 0);
  assert.ok(supports.get("landing-right")!.serviceKn > 0);
  assert.equal(Object.keys(supports.get("landing-left")!.ultimateKnByCombination).length, 1);
  assert.ok(Math.abs(result.equilibrium.residualKn) < 1e-8);
  assert.equal(result.checks.filter(c => c.id.endsWith(":serviceability")).length, 3);
});

test("inclined flight carries signed axial force through every ULS station and remains review-gated for service axial effects", () => {
  const result = designStair(stairDesignInput(oneFlightGeometry()));
  const flexure = result.checks.find(c => c.id === "flight-1:flexure")!;
  const observed = flexure.observed as { checkedAxialMomentStations: number; axialEnvelope: { maxCompressionKnPerM: number; maxTensionKnPerM: number } };
  assert.ok(observed.checkedAxialMomentStations > 200);
  assert.ok(observed.axialEnvelope.maxCompressionKnPerM > 0);
  assert.ok(observed.axialEnvelope.maxTensionKnPerM > 0);
  assert.equal(result.checks.find(c => c.id === "flight-1:service-axial")?.status, "requires_engineering");
  assert.equal(result.status, "requires_review");
  const shear = result.checks.find(c => c.id === "flight-1:one-way-shear");
  assert.ok(shear);
  assert.equal((shear.observed as unknown[]).length, 2);
});

test("projected versus inclined finish loads use the exact cosine area transformation", () => {
  const geometry = oneFlightGeometry(), a = stairDesignInput(geometry), b = stairDesignInput(geometry);
  a.loads["flight-1"] = { ...a.loads["flight-1"], finishKnM2: 2, finishBasis: "projected" };
  b.loads["flight-1"] = { ...b.loads["flight-1"], finishKnM2: 2, finishBasis: "inclined" };
  const ra = designStair(a).components[0].loads.finishProjectedKnM2, rb = designStair(b).components[0].loads.finishProjectedKnM2;
  const cosine = 2800 / Math.hypot(2800, 1500);
  assert.ok(Math.abs(ra - 2) < 1e-12);
  assert.ok(Math.abs(rb - 2 / cosine) < 1e-12);
  assert.ok(rb > ra);
});

test("geometry or stiffness revision mismatch invalidates the attached global analysis", () => {
  const input = stairDesignInput(oneFlightGeometry());
  input.geometry = { ...input.geometry, geometryRevision: "stairs-geom-r2" };
  const result = designStair(input);
  assert.equal(result.globalAnalysis.status, "rebuild_required");
  assert.equal(result.status, "rebuild_required");
  assert.equal(result.engineeringAcceptance, false);
});

test("physical geometry mutation invalidates the global analysis even when revision strings are unchanged", () => {
  const input = stairDesignInput(oneFlightGeometry());
  const original = input.geometry;
  input.geometry = { ...original, components: original.components.map(component => ({ ...component,
    thicknessMm: component.thicknessMm + 10 })) };
  assert.equal(input.geometry.modelRevision, original.modelRevision);
  assert.equal(input.geometry.stiffnessSet, original.stiffnessSet);
  assert.equal(input.geometry.geometryRevision, original.geometryRevision);
  const result = designStair(input);
  assert.equal(result.globalAnalysis.status, "rebuild_required");
  assert.equal(result.status, "rebuild_required");
});

test("omitted component load or a failed slab detailing limit cannot be reported as ready", () => {
  const missing = stairDesignInput(oneFlightGeometry()); delete missing.loads["flight-1"];
  assert.throws(() => designStair(missing), /Yük\/analiz\/kombinasyon kapsamı/);
  const bad = stairDesignInput(oneFlightGeometry()); bad.coverMm = 10;
  assert.throws(() => designStair(bad), /net örtüsü en az 15 mm/);
  const spacing = stairDesignInput(oneFlightGeometry()); spacing.mainBottom.spacingMm = 250;
  const result = designStair(spacing);
  assert.equal(result.status, "requires_review");
  assert.ok(result.checks.some(c => c.id.endsWith(":main-spacing") && c.status === "fail"));
});

test("all declared ultimate combinations are retained; no first-ten truncation", () => {
  const input = stairDesignInput(oneFlightGeometry());
  input.ultimateCases = Array.from({ length: 12 }, (_, i) => ({ id: `ULS-${i + 1}`, use: "ultimate" as const,
    deadFactor: 1.2, liveFactor: 1.6 + i / 100, source: `combination ${i + 1}` }));
  const result = designStair(input), flight = result.components[0];
  assert.equal(flight.reactions[0].ultimateKnByCombination.length, 12);
  assert.equal(Object.keys(result.supportReactions[0].ultimateKnByCombination).length, 12);
  assert.ok(flight.reactions[0].ultimateKnByCombination.some(c => c.id === "ULS-12"));
});
