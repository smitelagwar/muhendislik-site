import assert from "node:assert/strict";
import { calculateConcreteQuantity } from "../src/lib/engineering/quantity/concrete-volume";
import { calculateExcavation } from "../src/lib/engineering/quantity/excavation";
import { calculateRebarQuantity } from "../src/lib/engineering/quantity/rebar-ratio";
import { calculateFormworkQuantity } from "../src/lib/engineering/quantity/formwork-ratio";
import { calculateMasonryQuantity } from "../src/lib/engineering/quantity/masonry";
import { calculatePlasterPaint } from "../src/lib/engineering/quantity/plaster-paint";
import { calculateRoofCovering } from "../src/lib/engineering/quantity/roof-covering";
import { calculateTileQuantity } from "../src/lib/engineering/quantity/tile-flooring";

console.log("==================================================================");
console.log("FAZ 7 & 8 — KABA & İNCE YAPI METRAJ MOTORLARI TEST PAKETİ");
console.log("==================================================================\n");

function approxEqual(actual: number, expected: number, tolerance = 0.1, label = "") {
  const diff = Math.abs(actual - expected);
  assert.ok(
    diff <= tolerance,
    `[${label}] Uyuşmazlık: Beklenen=${expected}, Hesaplanan=${actual}, Fark=${diff}`
  );
}

// 1. Beton Metrajı
console.log("[1] Beton Metrajı (concrete-volume.ts) Test Ediliyor...");
const concRes = calculateConcreteQuantity({
  columnsCount: 16,
  columnWidthM: 0.4,
  columnDepthM: 0.5,
  columnHeightM: 3.0,
  beamLengthM: 100,
  beamWidthM: 0.25,
  beamDepthM: 0.5,
  slabAreaM2: 200,
  slabThicknessM: 0.15,
  foundationAreaM2: 200,
  foundationThicknessM: 0.5,
  wastePercentage: 3.0,
});
approxEqual(concRes.columnsVolumeM3, 9.6, 0.1, "Kolon hacmi");
approxEqual(concRes.beamsVolumeM3, 12.5, 0.1, "Kiriş hacmi");
approxEqual(concRes.slabsVolumeM3, 30.0, 0.1, "Döşeme hacmi");
approxEqual(concRes.foundationVolumeM3, 100.0, 0.1, "Temel hacmi");
approxEqual(concRes.totalNetVolumeM3, 152.1, 0.1, "Net toplam hacim");
assert.equal(concRes.mixerTruckCount, 18);
console.log("  ✓ Beton Metrajı motoru GEÇTİ.");

// 2. Hafriyat Metrajı
console.log("[2] Hafriyat Metrajı (excavation.ts) Test Ediliyor...");
const excRes = calculateExcavation({
  baseWidthM: 10,
  baseLengthM: 20,
  depthM: 3,
  slopeRatio: 0.5,
  workingSpaceMarginM: 0.5,
  swellPercentage: 25,
});
assert.ok(excRes);
assert.ok(excRes.solidVolumeM3 > 700, "Sıkışık kazı hacmi makul olmalı");
assert.ok(excRes.looseVolumeM3 > excRes.solidVolumeM3, "Kabarmış hacim büyük olmalı");
assert.ok(excRes.truckTripsCount > 40);
console.log("  ✓ Hafriyat Metrajı motoru GEÇTİ.");

// 3. Pratik Donatı Metrajı
console.log("[3] Pratik Donatı Metrajı (rebar-ratio.ts) Test Ediliyor...");
const rebarRes = calculateRebarQuantity({
  totalConstructionAreaM2: 1000,
  typology: "residential_standard",
  wastePercentage: 5,
});
assert.ok(rebarRes);
approxEqual(rebarRes.unitWeightKgPerM2, 32.0, 0.1, "Birim demir kg/m2");
approxEqual(rebarRes.netWeightTon, 32.0, 0.1, "Net donatı ton");
approxEqual(rebarRes.grossWeightTon, 33.6, 0.1, "Brüt donatı ton");
console.log("  ✓ Pratik Donatı motoru GEÇTİ.");

// 4. Pratik Kalıp Metrajı
console.log("[4] Pratik Kalıp Metrajı (formwork-ratio.ts) Test Ediliyor...");
const formRes = calculateFormworkQuantity({
  storyFloorAreaM2: 250,
  storyCount: 4,
  floorHeightM: 3.0,
  formworkToFloorRatio: 2.5,
});
assert.ok(formRes);
approxEqual(formRes.singleStoryFormworkAreaM2, 625.0, 0.1, "Tek kat kalıp");
approxEqual(formRes.totalBuildingFormworkAreaM2, 2500.0, 0.1, "Toplam kalıp");
assert.ok(formRes.plywoodSheetsCount === 200);
console.log("  ✓ Pratik Kalıp motoru GEÇTİ.");

// 5. Duvar Metrajı
console.log("[5] Duvar Metrajı (masonry.ts) Test Ediliyor...");
const masRes = calculateMasonryQuantity({
  wallLengthM: 20,
  wallHeightM: 3,
  openingsCount: 2,
  openingWidthM: 1.5,
  openingHeightM: 2.0,
  materialType: "brick_13_5",
  wastePercentage: 5,
});
assert.ok(masRes);
approxEqual(masRes.grossAreaM2, 60.0, 0.1, "Brüt alan");
approxEqual(masRes.openingsAreaM2, 6.0, 0.1, "Boşluk alanı");
approxEqual(masRes.netAreaM2, 54.0, 0.1, "Net alan");
assert.ok(masRes.totalPiecesCount > 1400);
console.log("  ✓ Duvar Metrajı motoru GEÇTİ.");

// 6. Sıva ve Boya Metrajı
console.log("[6] Sıva ve Boya Metrajı (plaster-paint.ts) Test Ediliyor...");
const plasRes = calculatePlasterPaint({
  wallAreaM2: 200,
  ceilingAreaM2: 80,
  plasterType: "gypsum",
  paintType: "interior_silicone",
  plasterThicknessCm: 1.5,
});
assert.ok(plasRes);
approxEqual(plasRes.totalPlasterAreaM2, 280.0, 0.1, "Toplam yüzey");
assert.ok(plasRes.plasterKg > 4000);
assert.ok(plasRes.paintKg > 50);
console.log("  ✓ Sıva ve Boya motoru GEÇTİ.");

// 7. Çatı Kaplama Metrajı
console.log("[7] Çatı Kaplama Metrajı (roof-covering.ts) Test Ediliyor...");
const roofRes = calculateRoofCovering({
  horizontalAreaM2: 150,
  slopePercentage: 33,
  coveringType: "marsilya_tile",
  ridgeLengthM: 12,
});
assert.ok(roofRes);
approxEqual(roofRes.slopeAngleDeg, 18.26, 0.1, "Eğim açısı");
assert.ok(roofRes.slopedRoofAreaM2 > 155.0, "Eğimli çatı alanı");
assert.ok(roofRes.totalMaterialUnitsCount > 2400);
console.log("  ✓ Çatı Kaplama motoru GEÇTİ.");

// 8. Seramik ve Fayans Metrajı
console.log("[8] Seramik ve Fayans Metrajı (tile-flooring.ts) Test Ediliyor...");
const tileRes = calculateTileQuantity({
  floorAreaM2: 50,
  wallTileAreaM2: 30,
  tileDimension: "60x60",
  wastePercentage: 8,
});
assert.ok(tileRes);
approxEqual(tileRes.totalNetAreaM2, 80.0, 0.1, "Net alan");
approxEqual(tileRes.totalGrossAreaM2, 86.4, 0.1, "Brüt alan");
assert.equal(tileRes.tileBoxesCount, 60);
console.log("  ✓ Seramik ve Fayans motoru GEÇTİ.");

console.log("\n==================================================================");
console.log("✅ FAZ 7 & 8 METRAJ MOTORLARI TESTLERİNİN TAMAMI BAŞARIYLA GEÇTİ.");
console.log("==================================================================\n");
