import test from "node:test";
import assert from "node:assert/strict";
import { FOCUS_POINTS, focusAnchorAt } from "../../src/lib/duzensizlik-simulatoru/focus";
import { SCENARIO_IDS, SCENARIOS } from "../../src/lib/duzensizlik-simulatoru/scenarios";
import { FRAME_SPAN, LEVEL_HEIGHT, makeBlueprint } from "../../src/lib/duzensizlik-simulatoru/motion";

test("Six scenarios each provide distinct, finite, geometry-linked focus markers",()=>{
  for(const id of SCENARIO_IDS){
    const b=makeBlueprint(id),points=FOCUS_POINTS[id];
    assert.ok(points.length>0 && points.length<4,id);
    assert.ok(SCENARIOS[id].why.length>28 && SCENARIOS[id].focusLabel.length>8,id);
    const unique=new Set(points.map(x=>x.id));
    assert.equal(unique.size,points.length,id);
    for(const point of points){
      assert.ok(point.start.every(Number.isFinite));
      for(const phase of [0,Math.PI/2,Math.PI*1.5]){
        const p=focusAnchorAt(point,id,phase,1);
        assert.ok(p.every(Number.isFinite),id);
        p.forEach((v,i)=>assert.ok(v>=b.bounds.min[i]-.6 && v<=b.bounds.max[i]+.6,`${id} focus outside bounds at phase ${phase}`));
      }
    }
  }
});
test("A1 compares genuinely different lateral edge movements",()=>{
  const [near,far]=FOCUS_POINTS.A1;
  assert.equal(FOCUS_POINTS.A1.length,2);
  assert.equal(near.role,"primary"); assert.equal(far.role,"comparison");
  const a=focusAnchorAt(near,"A1",0,1),b=focusAnchorAt(far,"A1",0,1);
  const c=focusAnchorAt(near,"A1",Math.PI/2,1),d=focusAnchorAt(far,"A1",Math.PI/2,1);
  assert.ok(Math.abs((c[0]-a[0])-(d[0]-b[0]))>.15);
});
test("B1 B2 B3 correctly point to their distinct first storey issue",()=>{
  for(const id of ["B1","B2","B3"] as const){
    const p=FOCUS_POINTS[id][0];
    assert.ok(p.end);
    assert.equal(p.start[1],0);
    assert.equal(p.end[1],LEVEL_HEIGHT);
  }
  assert.equal(FOCUS_POINTS.A2[0].start[1],3*LEVEL_HEIGHT);
  assert.equal(FOCUS_POINTS.A3[0].start[0],FRAME_SPAN);
});
test("B3 upper column bears on an uninterrupted beam with support at BOTH ends",()=>{
  const blue=makeBlueprint("B3");
  const t=blue.segments.find(s=>s.kind==="transfer");
  assert.ok(t);
  assert.equal(t.a[0],-FRAME_SPAN);assert.equal(t.b[0],FRAME_SPAN);
  assert.equal(t.a[2],FRAME_SPAN);assert.equal(t.b[2],FRAME_SPAN);
  assert.ok(blue.segments.some(s=>s.kind==="column"&&s.a[0]===0&&s.a[1]===LEVEL_HEIGHT&&s.a[2]===FRAME_SPAN));
  assert.ok(!blue.segments.some(s=>s.kind==="column"&&s.a[0]===0&&s.a[1]===0&&s.a[2]===FRAME_SPAN));
  for(const x of [-FRAME_SPAN,FRAME_SPAN]){
    assert.ok(blue.segments.some(s=>s.kind==="column"&&s.a[0]===x&&s.a[1]===0&&s.a[2]===FRAME_SPAN));
  }
});
