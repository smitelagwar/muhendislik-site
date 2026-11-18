import test from "node:test";
import assert from "node:assert/strict";
import { parseDecimal, pressureToKPa, pressureFromKPa, forcePerVolumeToSI, forcePerVolumeFromSI } from "../../src/lib/hsyncad/structural/units";

test("decimal comma/dot, empty and explicit zero are distinct", () => {
  assert.equal(parseDecimal(" 1,25 "), 1.25);
  assert.equal(parseDecimal("1.25"), 1.25);
  assert.equal(parseDecimal(""), null);
  assert.equal(parseDecimal("0"), 0);
  assert.equal(parseDecimal("-0,5"), -.5);
});
test("soil unit weight and subgrade input convert force per volume without pressure confusion", () => {
  for (const original of [2.1, 2.5, 3080]) {
    const si = forcePerVolumeToSI(original, "tf/m3");
    assert.ok(Math.abs(si - original * 9.80665) < 1e-9);
    assert.ok(Math.abs(forcePerVolumeFromSI(si, "tf/m3") - original) < 1e-9);
  }
  assert.throws(() => forcePerVolumeToSI(Infinity, "tf/m3"));
  assert.throws(() => forcePerVolumeToSI(1e308, "tf/m3"));
});
test("ambiguous grouping and nonfinite input are rejected", () => {
  for (const v of ["1.234,56", "1,234.56", "1 234", "NaN", "Infinity", "1e309", "--1", "1,2,3", "."]) assert.throws(() => parseDecimal(v), Error, v);
});
test("pressure conversion preserves physics over repeated unit switches", () => {
  for (const unit of ["kPa", "MPa", "tf/m2"] as const) {
    let canonical = 157.813;
    for (let i = 0; i < 100; i++) canonical = pressureToKPa(pressureFromKPa(canonical, unit), unit);
    assert.ok(Math.abs(canonical - 157.813) < 1e-10);
  }
  assert.equal(pressureToKPa(1, "MPa"), 1000);
  assert.equal(pressureToKPa(1, "tf/m2"), 9.80665);
  for (const n of [-1, NaN, Infinity]) assert.throws(() => pressureToKPa(n, "kPa"));
  assert.throws(() => pressureToKPa(1e308, "MPa"));
});
