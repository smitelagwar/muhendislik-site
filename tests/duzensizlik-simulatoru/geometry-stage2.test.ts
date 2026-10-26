import test from "node:test";
import assert from "node:assert/strict";
import { SCENARIO_IDS } from "../../src/lib/duzensizlik-simulatoru/scenarios";
import { BEAM_FACE_TRIM, BEAM_SECTION, COLUMN_SECTION, FRAME_SPAN,
  SLAB_LIFT, SLAB_THICKNESS, WALL_BAY_DEPTH, jointAt, makeBlueprint,
  segmentPose, slabPose, type V3 } from "../../src/lib/duzensizlik-simulatoru/motion";

const near=(a:number,b:number,eps=1e-6)=>assert.ok(Math.abs(a-b)<eps,`expected ${a} ≈ ${b}`);

test("Trimmed beams meet (and slightly embed in) column faces without gaps",()=>{
  assert.ok(BEAM_FACE_TRIM>0 && BEAM_FACE_TRIM<COLUMN_SECTION/2);
  assert.ok(SLAB_LIFT-SLAB_THICKNESS/2>BEAM_SECTION/2);
  const a:V3=[0,1.6,0],b:V3=[FRAME_SPAN,1.6,0];
  const pose=segmentPose(a,b,BEAM_FACE_TRIM,BEAM_FACE_TRIM);
  assert.ok(pose);
  near(pose.length, FRAME_SPAN-2*BEAM_FACE_TRIM);
  near(pose.mid[0]-pose.length/2, BEAM_FACE_TRIM);
  near(pose.mid[0]+pose.length/2, FRAME_SPAN-BEAM_FACE_TRIM);
  assert.equal(segmentPose(a,b,FRAME_SPAN,BEAM_FACE_TRIM),null);
  assert.equal(segmentPose(a,b,-.1,0),null);
});

test("A1 slab corner follows the SAME rotation as its surrounding joints",()=>{
  const corners:V3[]=[[-3.2,3.2,-3.2],[3.2,3.2,-3.2],[-3.2,3.2,3.2],[3.2,3.2,3.2]];
  const center:V3=[0,3.2,0];
  for(const phase of [0,.4,Math.PI/2,Math.PI,Math.PI*1.5]){
    const slab=slabPose(center,"A1",phase,1);
    assert.ok(slab.position.every(Number.isFinite));
    for(const corner of corners){
      const dx=corner[0]-center[0],dz=corner[2]-center[2];
      const worldX=slab.position[0]+dx*Math.cos(slab.yaw)+dz*Math.sin(slab.y);
      const worldZ=slab.position[2]-dx*Math.sin(slab.y)+dz*Math.cos(slab.y);
      const expected=jointAt(corner,"A1",phase,1);
      near(worldX,expected[0],1e-5);
      near(worldZ,expected[2],1e-5);
    }
  }
});

test("Six scenario slabs remain finite, beam-clear and within declared model bounds",()=>{
  for(const id of SCENARIO_IDS){
    const blueprint=makeBlueprint(id);
    for(const slab of blueprint.slabs) {
      assert.ok(slab.width>0 && slab.depth>0);
      for(const phase of [0,Math.PI/2,Math.PI*1.5]) {
        const pose=slabPose([slab.cx,slab.level*1.6,slab.cz],id,phase,1);
        assert.ok(Number.isFinite(pose.yaw));
        assert.ok(pose.position.every(Number.isFinite));
        const offsets=[[-slab.width/2,-slab.depth/2],[slab.width/2,slab.depth/2],
          [-slab.width/2,slab.depth/2],[slab.width/2,-slab.depth/2]];
        for(const [dx,dz] of offsets) {
          const x=pose.position[0]+dx*Math.cos(pose.yaw)+dz*Math.sin(pose.yaw);
          const z=pose.position[2]-dx*Math.sin(pose.yaw)+dz*Math.cos(pose.yaw);
          assert.ok(x>=blueprint.bounds.min[0]-1e-5&&x<=blueprint.bounds.max[0]+1e-5,`${id} slab X ${x}`);
          assert.ok(z>=blueprint.bounds.min[2]-1e-5&&z<=blueprint.bounds.max[2]+1e-5,`${id} slab Z ${z}`);
        }
      }
    }
    for(const segment of blueprint.segments){
      for(const phase of [0,Math.PI/2,Math.PI*1.5]){
        const pose=segmentPose(jointAt(segment.a,id,phase,1),jointAt(segment.b,id,phase,1));
        assert.ok(pose && pose.mid.every(Number.isFinite) && Number.isFinite(pose.length),id);
      }
    }
  }
});

test("A1/B2 shear walls span precisely between the two surrounding frame lines",()=>{
  for(const id of ["A1","B2"] as const){
    const walls=makeBlueprint(id).segments.filter(s=>s.kind==="wall");
    assert.ok(walls.length>0);
    for(const wall of walls){
      near(wall.a[2],-FRAME_SPAN/2);
      near(wall.b[2],-FRAME_SPAN/2);
      near(wall.a[2]-WALL_BAY_DEPTH/2,-FRAME_SPAN);
      near(wall.a[2]+WALL_BAY_DEPTH/2,0);
      for(const phase of [0,Math.PI/2,Math.PI*1.5]){
        for(const z of [-FRAME_SPAN,0]){
          const bottom=jointAt([wall.a[0],wall.a[1],z],id,phase,1);
          const top=jointAt([wall.b[0],wall.b[1],z],id,phase,1);
          assert.ok(bottom.every(Number.isFinite)&&top.every(Number.isFinite));
        }
      }
    }
  }
});

test("A2 opening stays on level three and B3 has no accidental lower bearing column",()=>{
  const a2=makeBlueprint("A2");
  assert.equal(a2.slabs.filter(s=>s.level===3).length,4);
  assert.ok(a2.slabs.filter(s=>s.level!==3).every(s=>s.width===6.4&&s.depth===6.4));
  const b3=makeBlueprint("B3");
  assert.ok(b3.segments.some(s=>s.kind==="transfer"));
  assert.ok(!b3.segments.some(s=>s.kind==="column"&&s.a[0]===3.2&&s.a[2]===3.2&&s.a[1]===0));
});
