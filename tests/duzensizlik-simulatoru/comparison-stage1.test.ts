import test from "node:test";
import assert from "node:assert/strict";
import { SCENARIO_IDS } from "../../src/lib/duzensizlik-simulatoru/scenarios";
import { FRAME_SPAN, LEVEL_HEIGHT, LEVELS, SLAB_LIFT, makeBlueprint, segmentPose, jointAt } from "../../src/lib/duzensizlik-simulatoru/motion";
import { SHAKE_LEVELS } from "../../src/lib/duzensizlik-simulatoru/intensity";
import { makeReferenceBlueprint, referenceJointAt, referenceSlabPose } from "../../src/lib/duzensizlik-simulatoru/reference-model";

test("Regular references are complete and independent for A1-B3",()=>{
  for(const id of SCENARIO_IDS){
    const regular=makeReferenceBlueprint(id);
    assert.ok(regular.segments.length>35,id);
    assert.equal(regular.slabs.length,LEVELS,id);
    assert.ok(regular.segments.every(s=>s.kind!=="highlight"&&s.kind!=="transfer"),id);
    assert.ok(regular.slabs.every(s=>s.width===FRAME_SPAN*2&&s.depth===FRAME_SPAN*2),id);
  }
});
test("Distinct regular geometric configurations match all irregularities",()=>{
  const a1=makeReferenceBlueprint("A1").segments.filter(s=>s.kind==="wall");
  assert.equal(a1.length,LEVELS*2);
  assert.equal(a1.filter(s=>s.a[0]===-FRAME_SPAN).length,LEVELS);
  assert.equal(a1.filter(s=>s.a[0]===FRAME_SPAN).length,LEVELS);
  assert.equal(makeReferenceBlueprint("A2").slabs.filter(s=>s.level===3).length,1);
  assert.ok(makeBlueprint("A2").slabs.filter(s=>s.level===3).length>1);
  assert.ok(makeReferenceBlueprint("A3").segments.every(s=>s.a[0]<=FRAME_SPAN&&s.b[0]<=FRAME_SPAN));
  const b2=makeReferenceBlueprint("B2").segments.filter(s=>s.kind==="wall");
  assert.equal(b2.length,LEVELS);
  assert.equal(b2[0].a[1],0);
  assert.ok(makeBlueprint("B2").segments.filter(s=>s.kind==="wall").length<LEVELS);
  const b3=makeReferenceBlueprint("B3");
  assert.ok(b3.segments.some(s=>s.kind==="column"&&s.a[0]===0&&s.a[2]===FRAME_SPAN&&s.a[1]===0));
  assert.ok(!makeBlueprint("B3").segments.some(s=>s.kind==="column"&&s.a[0]===0&&s.a[2]===FRAME_SPAN&&s.a[1]===0));
});
test("Reference joints and slab centers remain continuous across five intensities",()=>{
  for(const id of SCENARIO_IDS){
    const model=makeReferenceBlueprint(id);
    for(const preset of SHAKE_LEVELS)for(const phase of [0,.5,Math.PI/2,Math.PI,3*Math.PI/2]){
      for(const member of model.segments){
        const a=referenceJointAt(member.a,phase,preset.strength);
        const b=referenceJointAt(member.b,phase,preset.strength);
        const pose=segmentPose(a,b);
        assert.ok(pose&&pose.length>0&&pose.mid.every(Number.isFinite),id);
      }
      for(const slab of model.slabs){
        const center:[number,number,number]=[slab.cx,slab.level*LEVEL_HEIGHT,slab.cz];
        const joint=referenceJointAt(center,phase,preset.strength);
        const surface=referenceSlabPose(center,phase,preset.strength);
        assert.ok(surface.position.every(Number.isFinite));
        assert.ok(Math.abs(surface.position[0]-joint[0])<1e-10);
        assert.ok(Math.abs(surface.position[2]-joint[2])<1e-10);
        assert.ok(Math.abs(surface.position[1]-joint[1]-SLAB_LIFT)<1e-10);
      }
      assert.deepEqual(referenceJointAt([0,0,0],phase,preset.strength),[0,0,0]);
    }
  }
});
test("Reference sway has no torsion or exaggerated B2 ground-floor drift",()=>{
  const phase=Math.PI/2,y=LEVELS*LEVEL_HEIGHT;
  const a=referenceJointAt([-FRAME_SPAN,y,FRAME_SPAN],phase,1);
  const b=referenceJointAt([FRAME_SPAN,y,-FRAME_SPAN],phase,1);
  assert.ok(Math.abs((a[0]+FRAME_SPAN)-(b[0]-FRAME_SPAN))<1e-10);
  assert.ok(jointAt([0,LEVEL_HEIGHT,0],"B2",phase,1)[0]>referenceJointAt([0,LEVEL_HEIGHT,0],phase,1)[0]*3);
});
