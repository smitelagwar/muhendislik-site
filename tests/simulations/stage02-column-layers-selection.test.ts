import assert from "node:assert/strict";
import {
  buildColumnDetailModel,
  C1_COLUMN_SPEC,
  C1_CROSSTIE_TEACHING_SPEC,
} from "../../src/lib/simulations/scenes/column-c1";
import {
  createInitialSimulationViewState,
  simulationViewReducer,
} from "../../src/lib/simulations/state/view-reducer";
import { sampleArcSegment3Mm } from "../../src/lib/simulations/engine/three-column-viewer";

async function main() {
  console.log("=== Simülasyon Kütüphanesi Aşama 02 Geometri, Katman ve Seçim Testleri ===");

  // 1. Bağımsız beklenen 27 etriye kotu ve bölge sınırları
  const expectedElevations = [
    50, 150, 250, 350, 450, 550, // Alt sarılma (6)
    675, 825, 975, 1125, 1275, 1425, 1575, 1725, 1875, 2025, // Orta bölge (10)
    2150, 2250, 2350, 2450, 2550, 2650, // Üst sarılma (6)
    2750, 2850, 2950, 3050, 3150, // Üst düğüm bölgesi (5)
  ];

  const c1Model = buildColumnDetailModel(C1_COLUMN_SPEC);
  const c1Stirrups = c1Model.parts.filter(
    (p) => p.kind === "rebar" && p.category === "stirrup",
  );
  assert.equal(c1Stirrups.length, 27, "C1 modelinde tam 27 etriye bulunmalı");

  const actualElevations = c1Stirrups.map((p) =>
    p.kind === "rebar" ? p.elevationZMm : -1,
  );
  assert.deepEqual(
    actualElevations,
    expectedElevations,
    "27 etriyenin Z kotları bağımsız beklenen diziyle birebir eşleşmeli",
  );

  // 2. Paspayı ve sınır kontrolü:
  // 300x300 kesitte halfW = 150 mm, net paspayı = 30 mm, etriye Ø10 => etriye ekseni ±115 mm, dış yüzü ±120 mm.
  // Köşe boyuna donatı Ø20 => merkez ±100 mm, dış yüzü ±110 mm.
  assert.equal(c1Model.dimensionsMm.stirrupAxisOffsetFromFaceMm, 35);
  assert.equal(c1Model.dimensionsMm.cornerBarCenterOffsetFromFaceMm, 50);

  const c1LongBars = c1Model.parts.filter(
    (p) => p.kind === "rebar" && p.category === "longitudinal",
  );
  assert.equal(c1LongBars.length, 4);
  for (const bar of c1LongBars) {
    if (bar.kind !== "rebar") continue;
    const seg = bar.segments[0];
    assert.equal(seg.kind, "line");
    if (seg.kind === "line") {
      assert.equal(Math.abs(seg.start.x), 100, "C1 köşe boyuna donatı X merkezi ±100 mm olmalı");
      assert.equal(Math.abs(seg.start.y), 100, "C1 köşe boyuna donatı Y merkezi ±100 mm olmalı");
      assert.equal(seg.start.z, 0);
      assert.equal(seg.end.z, 3200);
    }
  }

  // 3. Etriyelerde düz kol + köşe büküm yayı (arc) + 135° deprem kancası (hook) kontrolü
  for (const st of c1Stirrups) {
    if (st.kind !== "rebar") continue;
    const arcSegments = st.segments.filter((s) => s.kind === "arc");
    const hookSegments = st.segments.filter(
      (s) => s.kind === "line" && s.role === "hook",
    );
    assert.ok(
      arcSegments.length >= 5,
      `Etriye ${st.id} en az 5 yay segmenti (4 köşe + kanca bükümü) içermeli`,
    );
    assert.equal(
      hookSegments.length,
      2,
      `Etriye ${st.id} iki adet 135° kanca kolu içermeli`,
    );
    assert.equal(st.hookAngleDeg, 135);

    // Tüm etriye noktalarının net paspayı sınırı (|x|,|y| <= 115 mm eksen) içinde kaldığını doğrula
    for (const seg of st.segments) {
      if (seg.kind === "line") {
        assert.ok(Math.abs(seg.start.x) <= 115.01 && Math.abs(seg.end.x) <= 115.01);
        assert.ok(Math.abs(seg.start.y) <= 115.01 && Math.abs(seg.end.y) <= 115.01);
      } else {
        const chords = sampleArcSegment3Mm(seg, 6);
        for (const ch of chords) {
          assert.ok(Math.abs(ch.start.x) <= 115.01 && Math.abs(ch.end.x) <= 115.01);
          assert.ok(Math.abs(ch.start.y) <= 115.01 && Math.abs(ch.end.y) <= 115.01);
        }
      }
    }
  }

  // 4. İkinci önayar (Çirozlu öğretim önayarı) kontrolü ve C1 ile karışmama garantisi
  const crosstieModel = buildColumnDetailModel(C1_CROSSTIE_TEACHING_SPEC);
  assert.equal(c1Model.counts.crossties, 0, "C1 referans modelinde çiroz 0 olmalı");
  assert.equal(crosstieModel.dimensionsMm.widthX, 400);
  assert.equal(crosstieModel.counts.longitudinalBars, 8);
  assert.equal(crosstieModel.counts.dowels, 8);
  assert.equal(crosstieModel.counts.stirrups, 27);
  assert.equal(crosstieModel.counts.crossties, 54);

  // 5. Gizleme model koordinatlarını değiştirmez ve seçili parça gizlenince seçim temizlenir
  const snapshotBefore = JSON.stringify(c1Model.parts[1]);
  let state = createInitialSimulationViewState("c1-referans");

  // Etriye #1 seç
  const firstStirrupId = c1Stirrups[0].id;
  state = simulationViewReducer(state, {
    type: "SELECT_PART",
    partId: firstStirrupId,
    model: c1Model,
  });
  assert.equal(state.selectedPartId, firstStirrupId);

  // Etriye katmanı kapatıldığında seçili etriye otomatik temizlenir
  state = simulationViewReducer(state, {
    type: "TOGGLE_LAYER",
    layerId: "stirrup",
    model: c1Model,
  });
  assert.equal(state.layers.stirrup, false);
  assert.equal(
    state.selectedPartId,
    null,
    "Gizlenen katmandaki seçili parçanın seçimi temizlenmeli",
  );

  const snapshotAfter = JSON.stringify(c1Model.parts[1]);
  assert.equal(
    snapshotBefore,
    snapshotAfter,
    "Katman gizleme model koordinatlarını değiştirmemelidir",
  );

  // 6. 20 ardışık katman ve önayar değişimi stres/tutarlılık testi
  for (let i = 0; i < 20; i++) {
    const nextPreset = i % 2 === 0 ? "c1-cirozlu-ogretim" : "c1-referans";
    const activeMod = nextPreset === "c1-referans" ? c1Model : crosstieModel;
    state = simulationViewReducer(state, {
      type: "SET_PRESET",
      presetId: nextPreset,
    });
    assert.equal(state.selectedPartId, null, "Önayar değişiminde eski seçim sıfırlanmalı");

    const filterCycle =
      i % 3 === 0
        ? "only-stirrup"
        : i % 3 === 1
          ? "only-longitudinal"
          : "all";
    state = simulationViewReducer(state, {
      type: "APPLY_QUICK_FILTER",
      filter: filterCycle,
      model: activeMod,
    });

    if (filterCycle === "only-stirrup") {
      assert.equal(state.layers.stirrup, true);
      assert.equal(state.layers.longitudinal, false);
      assert.equal(state.layers.concrete, false);
    } else if (filterCycle === "only-longitudinal") {
      assert.equal(state.layers.longitudinal, true);
      assert.equal(state.layers.stirrup, false);
      assert.equal(state.layers.concrete, false);
    } else {
      assert.equal(state.layers.concrete, true);
      assert.equal(state.layers.stirrup, true);
      assert.equal(state.layers.longitudinal, true);
    }
  }

  console.log("✅ Aşama 02 geometri, büküm/kanca, paspayı, 20 önayar/katman döngüsü testleri geçti.");
}

main().catch((err) => {
  console.error("❌ Aşama 02 testi hatası:", err);
  process.exit(1);
});
