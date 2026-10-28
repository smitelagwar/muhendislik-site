import test from "node:test";
import assert from "node:assert/strict";
import { SCENARIO_IDS } from "../../src/lib/duzensizlik-simulatoru/scenarios";
import { FRAME_SPAN, LEVEL_HEIGHT } from "../../src/lib/duzensizlik-simulatoru/motion";
import { SHAKE_LEVELS } from "../../src/lib/duzensizlik-simulatoru/intensity";
import { TEACHING, teachingCueSegment, teachingStroke } from "../../src/lib/duzensizlik-simulatoru/teaching";

test("A1-B3 each have their own readable, distinct comparison lessons",()=>{
  const ids=new Set<string>();
  for(const scenario of SCENARIO_IDS){
    const lesson=TEACHING[scenario];
    assert.ok(lesson.label&&lesson.reference&&lesson.irregular&&lesson.watch&&lesson.caution);
    assert.ok(lesson.cues.length>=2,scenario);
    assert.ok(lesson.cues.some(c=>c.side==="irregular"),scenario);
    assert.ok(lesson.cues.some(c=>c.side==="reference"),scenario);
    for(const cue of lesson.cues){
      assert.ok(!ids.has(scenario+":"+cue.id),"Cue IDs must be scenario-unique");
      ids.add(scenario+":"+cue.id);
      assert.ok(cue.start.every(Number.isFinite));
      assert.ok(cue.end===undefined||cue.end.every(Number.isFinite));
    }
  }
  assert.equal(TEACHING.A1.cues.filter(c=>c.kind==="displacement"&&c.side==="irregular").length,2);
  assert.equal(TEACHING.A2.cues.filter(c=>c.side==="irregular"&&c.kind==="arrow").length,4);
  assert.ok(TEACHING.A3.cues.some(c=>c.id==="wing-x"));
  assert.ok(TEACHING.B1.caution.includes("dayanım"));
  assert.ok(TEACHING.B2.cues.some(c=>c.kind==="displacement"));
  assert.equal(TEACHING.B3.cues.filter(c=>c.side==="irregular"&&c.kind==="arrow").length,5);
});

test("Teaching strokes follow moving joints across phases and intensities",()=>{
  for(const scenario of SCENARIO_IDS)for(const cue of TEACHING[scenario].cues){
    for(const level of SHAKE_LEVELS)for(const phase of [0,.2,Math.PI/2,Math.PI,5.8]){
      const [start,end]=teachingCueSegment(cue,scenario,phase,level.strength);
      assert.ok(start.every(Number.isFinite)&&end.every(Number.isFinite),scenario+":"+cue.id);
      const stroke=teachingStroke(start,end,cue.kind!=="line");
      assert.equal(stroke.length,18);
      assert.ok([...stroke].every(Number.isFinite),scenario+":"+cue.id);
      for(let axis=0;axis<3;axis++){
        assert.ok(Math.abs(stroke[axis]-start[axis])<1e-5);
        assert.ok(Math.abs(stroke[axis+3]-end[axis])<1e-5);
      }
    }
  }
});

test("A1 opposing corners diverge while reference lacks twisting",()=>{
  const irregular=TEACHING.A1.cues.filter(c=>c.kind==="displacement"&&c.side==="irregular");
  const regular=TEACHING.A1.cues.filter(c=>c.kind==="displacement"&&c.side==="reference");
  const horizontal=(c:typeof irregular[number])=>{
    const [a,b]=teachingCueSegment(c,"A1",Math.PI/2,2.4);
    return [b[0]-a[0],b[2]-a[2]] as const;
  };
  const i1=horizontal(irregular[0]),i2=horizontal(irregular[1]);
  const r1=horizontal(regular[0]),r2=horizontal(regular[1]);
  assert.ok(Math.hypot(i1[0]-i2[0],i1[1]-i2[1])>.02);
  assert.ok(Math.hypot(r1[0]-r2[0],r1[1]-r2[1])<1e-6);
});
test("A2 guides remain on the floor plane and outside the aperture",()=>{
  for(const cue of TEACHING.A2.cues.filter(c=>c.side==="irregular")){
    assert.equal(cue.start[1],3*LEVEL_HEIGHT);
    assert.ok(Math.max(Math.abs(cue.start[0]),Math.abs(cue.start[2]))>2.1);
    assert.ok(Math.max(Math.abs(cue.start[0]),Math.abs(cue.start[2]))<=FRAME_SPAN);
  }
});
test("B3 illustrated path is transferred to left and right supports",()=>{
  const arrows=TEACHING.B3.cues.filter(c=>c.side==="irregular");
  assert.ok(arrows.some(c=>c.end?.[0]===-FRAME_SPAN));
  assert.ok(arrows.some(c=>c.end?.[0]===FRAME_SPAN));
  assert.ok(arrows.some(c=>c.end?.[1]===.18));
});
