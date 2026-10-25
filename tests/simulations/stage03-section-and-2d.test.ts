import assert from "node:assert/strict";
import {
  buildColumnDetailModel,
  C1_COLUMN_SPEC,
  C1_CROSSTIE_TEACHING_SPEC,
} from "../../src/lib/simulations/scenes/column-c1";
import { evaluateColumnHorizontalSectionAtElevation } from "../../src/lib/simulations/core/section-geometry";
import {
  createInitialSimulationViewState,
  simulationViewReducer,
} from "../../src/lib/simulations/state/view-reducer";

async function main() {
  console.log("=== Simülasyon Kütüphanesi Aşama 03 2B Eşleme ve Kontrollü Kesit Testleri ===");

  const c1Model = buildColumnDetailModel(C1_COLUMN_SPEC);

  // 1. Etriye merkezi (Z=50 mm), yarıçap sınırı (Z=55 mm) ve hemen dışındaki kot (Z=56 mm)
  const atCenter50 = evaluateColumnHorizontalSectionAtElevation(c1Model, 50);
  assert.equal(atCenter50.inConcreteBody, true);
  assert.equal(atCenter50.activeZone?.id, "alt-sarilma");
  assert.equal(atCenter50.intersectedStirrupParts.length, 1);
  assert.equal(atCenter50.intersectedStirrupParts[0].id, "stirrup-1-alt-sarilma-z50");
  assert.equal(atCenter50.intersectedLongitudinalParts.length, 4);

  const atEdge55 = evaluateColumnHorizontalSectionAtElevation(c1Model, 55);
  assert.equal(
    atEdge55.intersectedStirrupParts.length,
    1,
    "Z=55 mm kotu Ø10 etriyenin ±5 mm yarıçap sınırında olduğu için etriyeyi kesmelidir",
  );

  const justOutside56 = evaluateColumnHorizontalSectionAtElevation(c1Model, 56);
  assert.equal(
    justOutside56.intersectedStirrupParts.length,
    0,
    "Z=56 mm kotu Ø10 etriyenin çapı dışında kaldığı için etriye kesilmemelidir",
  );
  assert.equal(justOutside56.intersectedLongitudinalParts.length, 4);

  // İki etriye tam ortası (Z=100 mm)
  const atGap100 = evaluateColumnHorizontalSectionAtElevation(c1Model, 100);
  assert.equal(atGap100.intersectedStirrupParts.length, 0);
  assert.equal(atGap100.nearestStirrupDistanceMm, 50);

  // 2. Bölge sınırları kontrolü: Z=600, Z=2100, Z=2700, Z=3200 mm
  const atBoundary600 = evaluateColumnHorizontalSectionAtElevation(c1Model, 600);
  assert.equal(atBoundary600.activeZone?.id, "orta-bolge");
  assert.equal(
    atBoundary600.intersectedStirrupParts.length,
    0,
    "Bölge sınırında (Z=600 mm) çift veya sınır etriyesi yoktur (550 ve 675 mm arasında)",
  );

  const atBoundary2100 = evaluateColumnHorizontalSectionAtElevation(c1Model, 2100);
  assert.equal(atBoundary2100.activeZone?.id, "ust-sarilma");
  assert.equal(atBoundary2100.intersectedStirrupParts.length, 0);

  const atBoundary2700 = evaluateColumnHorizontalSectionAtElevation(c1Model, 2700);
  assert.equal(atBoundary2700.activeZone?.id, "dugum-bolgesi");
  assert.equal(atBoundary2700.intersectedStirrupParts.length, 0);

  const atTopConcrete3200 = evaluateColumnHorizontalSectionAtElevation(c1Model, 3200);
  assert.equal(atTopConcrete3200.inConcreteBody, true);
  assert.equal(atTopConcrete3200.inDowelZone, false);

  // Filiz bölgesi (Z=3500 mm): beton gövde ve etriye yok, yalnız 4 filiz kesilir
  const atDowel3500 = evaluateColumnHorizontalSectionAtElevation(c1Model, 3500);
  assert.equal(atDowel3500.inConcreteBody, false);
  assert.equal(atDowel3500.inDowelZone, true);
  assert.equal(atDowel3500.intersectedStirrupParts.length, 0);
  assert.equal(atDowel3500.intersectedLongitudinalParts.length, 0);
  assert.equal(atDowel3500.intersectedDowelParts.length, 4);

  // 3. Çirozlu önayarda etriye kotunda (+4 / -4 mm ofsetli X ve Y çirozları) kesit kontrolü
  const crosstieModel = buildColumnDetailModel(C1_CROSSTIE_TEACHING_SPEC);
  const ctAt50 = evaluateColumnHorizontalSectionAtElevation(crosstieModel, 50);
  assert.equal(ctAt50.intersectedStirrupParts.length, 1);
  assert.equal(
    ctAt50.intersectedCrosstieParts.length,
    2,
    "Z=50 mm kotunda ±4 mm ofsetli Ø10 X/Y çirozlarının her ikisi de (±5 mm yarıçap içinde) kesilir",
  );

  // 4. Ölçü–model eşleşmesi: dimensionMarkers model boyutlarıyla birebir aynı
  const heightMarker = c1Model.dimensionMarkers.find(
    (m) => m.id === "dim-concrete-height",
  );
  const dowelMarker = c1Model.dimensionMarkers.find(
    (m) => m.id === "dim-dowel-length",
  );
  const widthMarker = c1Model.dimensionMarkers.find(
    (m) => m.id === "dim-section-width",
  );
  assert.equal(heightMarker?.valueMm, c1Model.dimensionsMm.concreteHeightZ);
  assert.equal(dowelMarker?.valueMm, c1Model.dimensionsMm.dowelLengthZ);
  assert.equal(widthMarker?.valueMm, c1Model.dimensionsMm.widthX);

  // 5. Reducer kesit kotu sınırlandırma ve reset davranışı
  let state = createInitialSimulationViewState("c1-referans");
  state = simulationViewReducer(state, {
    type: "SET_SECTION_ENABLED",
    enabled: true,
  });
  state = simulationViewReducer(state, {
    type: "SET_SECTION_ELEVATION",
    elevationZMm: 99999,
    model: c1Model,
  });
  assert.equal(state.section.enabled, true);
  assert.equal(state.section.elevationZMm, 4280);

  state = simulationViewReducer(state, {
    type: "RESET_VIEW",
  });
  assert.equal(state.section.enabled, false);
  assert.equal(state.section.elevationZMm, 1575);

  console.log("✅ Aşama 03 2B eşleme, kesit kotu, çap sınırı ve ölçü doğrulamaları geçti.");
}

main().catch((err) => {
  console.error("❌ Aşama 03 model testi hatası:", err);
  process.exit(1);
});
