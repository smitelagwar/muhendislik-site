import test from "node:test";
import assert from "node:assert/strict";
import { cameraFitDistance, smootherStep } from "../../src/lib/duzensizlik-simulatoru/camera";
import { SCENARIO_IDS } from "../../src/lib/duzensizlik-simulatoru/scenarios";
import { makeBlueprint } from "../../src/lib/duzensizlik-simulatoru/motion";

test("Safe camera-fit distance frames all scenarios and is closer on typical phones",()=>{
  for(const id of SCENARIO_IDS){
    const bounds=makeBlueprint(id).bounds;
    const portrait=cameraFitDistance(bounds,390/680);
    const desktop=cameraFitDistance(bounds,1366/610);
    assert.ok(Number.isFinite(portrait)&&portrait>=13&&portrait<=90,id);
    assert.ok(Number.isFinite(desktop)&&desktop>=13&&desktop<=90,id);
    assert.ok(portrait>desktop,id);
  }
  const a1=makeBlueprint("A1").bounds;
  const oldRadius=Math.hypot(a1.max[0]-a1.min[0],a1.max[1]-a1.min[1],a1.max[2]-a1.min[2])*.5;
  const oldMobile=oldRadius/(Math.tan(40*Math.PI/360)*(390/680))*1.03;
  assert.ok(cameraFitDistance(a1,390/680)<oldMobile,"new mobile fit should make the model visibly larger");
});
test("Camera easing is stable, bounded, smooth at both endpoints",()=>{
  assert.equal(smootherStep(-5),0);
  assert.equal(smootherStep(0),0);
  assert.equal(smootherStep(1),1);
  assert.equal(smootherStep(6),1);
  let last=0;
  for(let i=1;i<=100;i++){const s=smootherStep(i/100);assert.ok(s>=last&&s<=1);last=s;}
  assert.ok(smootherStep(.01)<.00002,"motion enters slowly");
  assert.ok(1-smootherStep(.99)<.00002,"motion settles smoothly");
});
