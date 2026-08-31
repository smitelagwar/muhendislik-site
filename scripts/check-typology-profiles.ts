import assert from "node:assert/strict";
import {
  TYPOLOGY_PROFILES,
  UNIT_TYPOLOGIES,
  COMFORT_BANDS,
  QUICK_RESERVE_ENVELOPE,
} from "../src/lib/calculations/modules/ruhsat-on-fizibilite/typology-profiles";

console.log("Tipoloji Profilleri Tutarlılık ve Kalibrasyon Testleri başlatılıyor...");

// Test 1: 4 tipoloji eksiksiz tanımlı mı?
assert.equal(UNIT_TYPOLOGIES.length, 4);
for (const type of UNIT_TYPOLOGIES) {
  const profile = TYPOLOGY_PROFILES[type];
  assert.ok(profile, `${type} profili tanımlı olmalı`);
  assert.equal(profile.unitType, type);
  assert.equal(profile.provenance, "HEURISTIC");
  assert.equal(profile.calibrationStatus, "PROVISIONAL");
  assert.ok(profile.sourceNotes.length > 0);

  // Test 2: Her konfor bandı tutarlı mı?
  for (const band of COMFORT_BANDS) {
    const b = profile.bands[band];
    assert.ok(b.targetNetAreaM2.min > 0, `${type} ${band} net min > 0 olmalı`);
    assert.ok(b.targetNetAreaM2.max > b.targetNetAreaM2.min, `${type} ${band} net max > min olmalı`);
    assert.ok(b.targetClosedGrossAreaM2.min > b.targetNetAreaM2.min, `${type} ${band} brüt min > net min olmalı`);
    assert.ok(b.targetClosedGrossAreaM2.max > b.targetNetAreaM2.max, `${type} ${band} brüt max > net max olmalı`);

    // 1.12 - 1.24 katsayı kontrolü
    const ratioMin = b.targetClosedGrossAreaM2.min / b.targetNetAreaM2.min;
    const ratioMax = b.targetClosedGrossAreaM2.max / b.targetNetAreaM2.max;
    assert.ok(Math.abs(ratioMin - 1.12) < 0.01, `${type} ${band} ratioMin ~1.12 olmalı (hesaplanan: ${ratioMin})`);
    assert.ok(Math.abs(ratioMax - 1.24) < 0.01, `${type} ${band} ratioMax ~1.24 olmalı (hesaplanan: ${ratioMax})`);
  }

  // Test 3: Konfor bandı artış sırası
  assert.ok(
    profile.bands.COMPACT.targetNetAreaM2.min < profile.bands.BALANCED.targetNetAreaM2.min,
    `${type} compact < balanced olmalı`
  );
  assert.ok(
    profile.bands.BALANCED.targetNetAreaM2.min < profile.bands.COMFORT.targetNetAreaM2.min,
    `${type} balanced < comfort olmalı`
  );
}

// Test 4: Tipoloji büyüklük hiyerarşisi (1+1 < 2+1 < 3+1 < 4+1)
assert.ok(TYPOLOGY_PROFILES["1+1"].bands.BALANCED.targetNetAreaM2.min < TYPOLOGY_PROFILES["2+1"].bands.BALANCED.targetNetAreaM2.min);
assert.ok(TYPOLOGY_PROFILES["2+1"].bands.BALANCED.targetNetAreaM2.min < TYPOLOGY_PROFILES["3+1"].bands.BALANCED.targetNetAreaM2.min);
assert.ok(TYPOLOGY_PROFILES["3+1"].bands.BALANCED.targetNetAreaM2.min < TYPOLOGY_PROFILES["4+1"].bands.BALANCED.targetNetAreaM2.min);

// Test 5: Quick reserve envelope değerleri (0.08, 0.12, 0.20)
assert.equal(QUICK_RESERVE_ENVELOPE.COMPACT, 0.08);
assert.equal(QUICK_RESERVE_ENVELOPE.BALANCED, 0.12);
assert.equal(QUICK_RESERVE_ENVELOPE.COMFORT, 0.20);

console.log("Tüm Tipoloji Profilleri Testleri BAŞARIYLA GEÇTİ.");
