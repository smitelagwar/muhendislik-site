import test from "node:test";
import assert from "node:assert/strict";
import {checkInteriorPunching,punchingCapacityGate,punchingPerimeter} from "../../src/lib/hsyncad/structural/punching-shear";
const box=(x0:number,y0:number,x1:number,y1:number)=>[[x0,y0],[x1,y0],[x1,y1],[x0,y1]] as const;
const support={id:"C1",kind:"column" as const,footprint:box(4.8,4.8,5.2,5.2),origin:[5,5] as const};
const current={modelRevision:"current-r",stiffnessSet:"current-k",analysisStamp:"current-a"};
const perimeter=()=>punchingPerimeter({boundary:{outer:box(0,0,10,10),openings:[]},support,effectiveDepthM:.2});
const action={...current,source:"current P06 signed vertical cut",NaboveKn:0,NbelowKn:400,FaKn:20,MxAdjacentKnM:[50,50] as const,MyAdjacentKnM:[0,0] as const};
const material={fctdMPa:1.2,source:"TS500 C25 table 3.2",evidence:"source-controlled C25 design tensile strength"};
test("TS500 interior punching independent numeric oracle keeps Vpd algebraic",()=>{
 const r=checkInteriorPunching({perimeter:perimeter(),support,action,expectedCurrent:current,material});assert.equal(r.status,"passed");if(r.status!=="passed")return;
 assert.ok(Math.abs(r.gamma-.8)<1e-12);assert.ok(Math.abs(r.VprKn-460.8)<1e-10);assert.equal(r.VpdKn,380);assert.equal(r.action.signedVpdKn,380);
});
test("punching load within perimeter may reverse the signed demand without abs-ing N",()=>{
 const r=checkInteriorPunching({perimeter:perimeter(),support,action:{...action,NbelowKn:100,FaKn:130,MxAdjacentKnM:[0,0]},expectedCurrent:current,material});assert.equal(r.status,"passed");if(r.status==="passed"){assert.equal(r.action.signedVpdKn,-30);assert.equal(r.VpdKn,30);}
});
test("punching geometry retains edge/corner classification but refuses unimplemented code perimeters",()=>{
 const edge=punchingPerimeter({boundary:{outer:box(0,0,4,4),openings:[]},support:{id:"edge",kind:"column",footprint:box(-.05,-.05,.25,.25),origin:[.1,.1]},effectiveDepthM:.2});assert.equal(edge.classification,"corner");assert.equal(punchingCapacityGate(edge).status,"unsupported");
 const opening=punchingPerimeter({boundary:{outer:box(0,0,4,4),openings:[box(1,1,1.2,1.2)]},support:{id:"near",kind:"column",footprint:box(1.5,1.5,1.9,1.9),origin:[1.7,1.7]},effectiveDepthM:.2});assert.equal(opening.geometryStatus,"unsupported");assert.match(opening.diagnostics.join(" "),/5d/);
});
test("interior punching rejects stale solution identities and non-rectangular loaded areas",()=>{
 assert.throws(()=>checkInteriorPunching({perimeter:perimeter(),support,action:{...action,analysisStamp:"stale"},expectedCurrent:current,material}));
 const triangle={id:"triangle",kind:"column" as const,footprint:[[1,1],[2,1],[1.5,2]] as const,origin:[1.5,1.5] as const};assert.throws(()=>punchingPerimeter({boundary:{outer:box(0,0,4,4),openings:[]},support:triangle,effectiveDepthM:.2}));
 assert.throws(()=>checkInteriorPunching({perimeter:perimeter(),support,action:{...action,NaboveKn:400,NbelowKn:400},expectedCurrent:current,material}));
});
