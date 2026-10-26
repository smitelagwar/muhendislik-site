import test from "node:test";
import assert from "node:assert/strict";
import { SCENARIO_IDS } from "../../src/lib/duzensizlik-simulatoru/scenarios";
import { jointAt, makeBlueprint, segmentPose, LEVEL_HEIGHT } from "../../src/lib/duzensizlik-simulatoru/motion";

test("All six scenarios have nonempty continuous 3D structural blueprints", () => {
  for(const scenario of SCENARIO_IDS){
    const blueprint=makeBlueprint(scenario);
    assert.ok(blueprint.segments.length>35,scenario);
    assert.ok(blueprint.slabs.length>=5,scenario);
    for(const segment of blueprint.segments){
      for(const phase of [0,Math.PI/2,Math.PI,Math.PI*1.5]){
        const a=jointAt(segment.a,scenario,phase,.8);
        const b=jointAt(segment.b,scenario,phase,.8);
        const pose=segmentPose(a,b);
        assert.ok(pose&&pose.length>0,scenario);
        assert.ok(pose.mid.every(Number.isFinite),scenario);
        const actual0=pose.mid.map((val,i)=>val-pose.direction[i]*pose.length/2);
        const actual1=pose.mid.map((val,i)=>val+pose.direction[i]*pose.length/2);
        for(let i=0;i<3;i++){
          assert.ok(Math.abs(actual0[i]-a[i])<1e-6,"segment start must coincide with its joint");
          assert.ok(Math.abs(actual1[i]-b[i])<1e-6,"segment end must coincide with its joint");
        }
      }
    }
  }
});
test("A1 imparts different horizontal displacement to opposite edges",()=>{
  const a=jointAt([-3.2,5*LEVEL_HEIGHT,-3.2],"A1",Math.PI/2,1);
  const b=jointAt([3.2,5*LEVEL_HEIGHT,3.2],"A1",Math.PI/2,1);
  assert.ok(Math.abs((a[0]+3.2)-(b[0]-3.2))>.1);
});
test("B1 is not falsely modeled with amplified weak-storey drift",()=>{
  const base=jointAt([0,0,0],"B1",Math.PI/2,1);
  const first=jointAt([0,LEVEL_HEIGHT,0],"B1",Math.PI/2,1);
  const second=jointAt([0,2*LEVEL_HEIGHT,0],"B1",Math.PI/2,1);
  assert.ok(Math.abs(first[0]-base[0]) < Math.abs(jointAt([0,LEVEL_HEIGHT,0],"B2",Math.PI/2,1)[0]));
  assert.ok(Math.abs((second[0]-first[0])-(first[0]-base[0]))<.001);
});
test("B2 accumulates the majority of relative drift in the first storey",()=>{
  const f1=jointAt([0,LEVEL_HEIGHT,0],"B2",Math.PI/2,1)[0];
  const f2=jointAt([0,LEVEL_HEIGHT*2,0],"B2",Math.PI/2,1)[0];
  assert.ok(f1>.3);
  assert.ok(f2-f1<.04);
});
test("A2 opening occurs on the third slab only",()=>{
  const blueprint=makeBlueprint("A2");
  assert.equal(blueprint.slabs.filter(s=>s.level===3).length,4);
  assert.ok((4.2*4.2)/(6.4*6.4)>1/3,"illustrative area aperture is clearly larger than a third");
  assert.ok(!blueprint.segments.some(s=>s.kind==="column"&&s.a[0]===0&&s.a[2]===0),"central column may not cross opening");
  assert.ok(!blueprint.segments.some(s=>s.kind==="beam"&&s.storey===3&&s.a[2]===0&&s.b[2]===0),"no central beam may cross A2 opening");
  for(const level of [1,2,4,5])assert.equal(blueprint.slabs.filter(s=>s.level===level).length,1);
});
test("A3 projection lies within model fit bounds",()=>{
  const blue=makeBlueprint("A3");
  assert.ok(blue.bounds.max[0]>6.4);
  assert.ok(blue.segments.some(seg=>seg.a[0]===6.4||seg.b[0]===6.4));
});
test("B3 has a transfer element and a missing lower column under it",()=>{
  const blue=makeBlueprint("B3");
  assert.ok(blue.segments.some(s=>s.kind==="transfer"));
  assert.ok(!blue.segments.some(s=>s.kind==="column"&&s.a[0]===3.2&&s.a[2]===3.2&&s.a[1]===0));
});
test("Invalid or zero-length segments are rejected rather than generating NaN",()=>{
  assert.equal(segmentPose([0,0,0],[0,0,0]),null);
  assert.equal(segmentPose([0,0,0],[Infinity,1,0]),null);
});
