import assert from "node:assert/strict";
import {
  buildEquivalentRebarRows,
  calculateRebarResult,
  calculateRebarSpacing,
  formatAreaCm2,
  formatAreaMm2,
  formatDecimal,
  parseRebarQuantity,
} from "../src/lib/rebar-calculations";

const initialResult = calculateRebarResult(14, 5);
assert.equal(formatAreaCm2(initialResult.totalAreaMm2), "7,70");
assert.equal(formatAreaMm2(initialResult.totalAreaMm2), "769,69");

const diameter12 = buildEquivalentRebarRows(initialResult.totalAreaMm2).find((row) => row.diameter === 12);
assert(diameter12);
assert.equal(diameter12.quantity, 7);
assert.equal(formatAreaCm2(diameter12.providedAreaMm2), "7,92");
assert.equal(formatAreaCm2(diameter12.surplusAreaMm2), "0,22");

const defaultSpacing = calculateRebarSpacing({
  quantity: 5,
  diameter: 14,
  widthCm: 30,
  coverMm: 30,
  stirrupDiameterMm: 8,
});
assert(defaultSpacing);
assert.equal(formatDecimal(defaultSpacing.netSpacingMm), "38,50");
assert.equal(formatDecimal(defaultSpacing.minSpacingMm), "25,00");

const diameter32Spacing = calculateRebarSpacing({
  quantity: 5,
  diameter: 32,
  widthCm: 30,
  coverMm: 30,
  stirrupDiameterMm: 8,
});
assert(diameter32Spacing);
assert.equal(formatDecimal(diameter32Spacing.minSpacingMm), "48,00");

for (const invalid of ["", "0", "-1", "2,5", "NaN", "9007199254740992"]) {
  assert.equal(parseRebarQuantity(invalid).quantity, null, `${invalid || "boş"} geçersiz olmalı`);
}

assert.equal(parseRebarQuantity("1000000").quantity, 1_000_000);

console.log("Donatı hesap doğrulamaları başarılı.");
