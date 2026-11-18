/** P02: eski sabit referans/donatı yoğunluğu kabullerinin yerine bağımsız geometri ve veri kapsamı oracle'ları. */
import test from "node:test";
import assert from "node:assert/strict";
import { calculateFullTakeoff } from "../../src/lib/hsyncad/quantities";
import { smallSlab, manyColumns } from "../hsyncad-structural/report-fixtures";
const close = (value: number | null, expected: number) => { assert.notEqual(value, null); assert.ok(Math.abs(value! - expected) < 1e-8); };
test("isolated slab volume follows width x depth x thickness", () => { close(calculateFullTakeoff(smallSlab()).concreteVolumeM3.total, 4*4*.15); });
test("isolated rectangular column volume follows actual height", () => { close(calculateFullTakeoff(manyColumns(1)).concreteVolumeM3.total, .4*.4*3); });
test("duplicate solid cannot double concrete", () => { const m = manyColumns(1); m.elements.push({ ...m.elements[0], id: "duplicate" }); close(calculateFullTakeoff(m).concreteVolumeM3.total, .48); });
test("name, translation and element ordering leave physics unchanged", () => {
  const a = manyColumns(7), before = calculateFullTakeoff(a).concreteVolumeM3.total;
  a.name = "MUSTAFA SELVİ"; a.elements.reverse();
  for (const e of a.elements) if (e.type === "column") { e.position.x += 123; e.position.y -= 17; }
  close(calculateFullTakeoff(a).concreteVolumeM3.total, before!);
});
test("same fixture with twice thickness has twice volume and retains missing steel", () => {
  close(calculateFullTakeoff(smallSlab(.3)).concreteVolumeM3.total, 4.8);
  assert.equal(calculateFullTakeoff(smallSlab(.3)).rebarTonnage.totalKg, null);
});
test("unknown steel cannot satisfy a code density window", () => { assert.equal(calculateFullTakeoff(manyColumns(3)).summary.steelDensityKgM3, null); });
test("declared element mass is summed without inventing diameter or lap factors", () => {
  const m = manyColumns(3); m.elements.forEach((e,i)=>{e.rebarMass=i*10;});
  const t = calculateFullTakeoff(m); close(t.rebarTonnage.totalKg,30);
  assert.equal(t.rebarTonnage.thinKg,null); assert.deepEqual(t.rebarTonnage.byDiameter,{});
});
test("negative and nonfinite declared mass remain unknown", () => { for (const x of [-1,NaN,Infinity]) { const m=manyColumns(1);m.elements[0].rebarMass=x;assert.equal(calculateFullTakeoff(m).rebarTonnage.totalKg,null); } });
