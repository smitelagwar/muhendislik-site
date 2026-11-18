import test from "node:test";
import assert from "node:assert/strict";
import {designBeam,designBeams} from "../../src/lib/hsyncad/structural/beam-design";
import {beamDesignFixture,solvedUniformBeam} from "./beam-fixtures";
import {combineBeamCases} from "../../src/lib/hsyncad/structural/beam-forces";
test("actual FE demands produce a physical full-length layout and load increase can change steel",()=>{
 const a=beamDesignFixture(6),before=JSON.stringify(a),r=designBeam(a);assert.equal(r.status,"design_ready",JSON.stringify(r));assert.equal(JSON.stringify(a),before);assert.equal(r.engineeringAcceptance,false);
 const higher=designBeam(beamDesignFixture(25));assert.equal(higher.status,"design_ready",JSON.stringify(higher));if("selected" in r&&r.selected&&"selected" in higher&&higher.selected){assert.ok(higher.selected.bars.reduce((s,b)=>s+b.diameter*b.diameter,0)>r.selected.bars.reduce((s,b)=>s+b.diameter*b.diameter,0));assert.ok(r.selected.bars.length>=4);assert.ok("anchors" in r.selected&&r.selected.anchors!.every(b=>b.cutLengthMm>6000));}
});
test("existing failed, missing, unsupported, stale and bounded jobs never become ready",()=>{
 const input=beamDesignFixture(40);input.mode="existing_reinforcement";input.existing={top:{diameter:12,count:2,rows:1},bottom:{diameter:12,count:2,rows:1},stirrupDiameter:8,legs:2,spacingEnd:150,spacingMiddle:250,sideDiameter:12,sideEach:0};assert.equal(designBeam(input).status,"failed");
 const missing=beamDesignFixture();missing.qualityReviewed.value=null;assert.equal(designBeam(missing).status,"incomplete");
 const noService=beamDesignFixture();noService.service=null;assert.equal(designBeam(noService).status,"incomplete");
 const coupling=beamDesignFixture();coupling.role="coupling_beam";assert.equal(designBeam(coupling).status,"unsupported");
 const budget=beamDesignFixture(25);budget.catalog.maxCandidates=1;assert.equal(designBeam(budget).status,"budget_exhausted");
 const stale=beamDesignFixture();stale.service!.total.analysisStamp="old";assert.equal(designBeam(stale).status,"invalid_input");
});
test("high-ductility capacity shear uses actual signed gravity/earthquake cases and current stamp",()=>{
 const input=beamDesignFixture(6),gravity=solvedUniformBeam(6,"vertical"),earthquake=solvedUniformBeam(3,"earthquake",true),combined=combineBeamCases("ULS-earthquake",[{factor:1,load:gravity},{factor:1,load:earthquake}]);input.ultimate.push(combined);input.seismic={D:2.5,analysisStamp:gravity.analysisStamp,source:"explicit current global fixture decision",pairs:[{gravity,earthquake}]};
 const r=designBeam(input);assert.equal(r.status,"design_ready",JSON.stringify(r));if("selected" in r&&r.selected&&"shear" in r.selected)assert.ok(r.selected.shear!.transfers.length>0);
 input.seismic.analysisStamp="changed-R";assert.equal(designBeam(input).status,"invalid_input");
});
test("all beams beyond ten are processed and missing continuity cannot be approved",()=>{
 const inputs=Array.from({length:12},(_,i)=>({...beamDesignFixture(6),id:`B${i}`}));const r=designBeams(inputs);assert.equal(r.outputCount,12);assert.equal(r.results.length,12);assert.equal(r.status,"designs_ready",JSON.stringify(r.results.map(x=>x.status)));
 inputs[0].continuity.rightBeamId="missing";const bad=designBeams(inputs);assert.equal(bad.status,"incomplete");assert.equal(bad.continuity[0].status,"fail");
});

test("actual torsion FE case requires extra perimeter steel and closed stirrups; excessive torque fails",()=>{
 const input=beamDesignFixture(6),gravity=solvedUniformBeam(6,"gravity-torsion"),earthquake=solvedUniformBeam(0,"torque",false,20),combined=combineBeamCases("ULS-torque",[{factor:1,load:gravity},{factor:1,load:earthquake}]);
 input.ultimate.push(combined);input.seismic={D:2.5,analysisStamp:gravity.analysisStamp,source:"synthetic nodal torque earthquake case",pairs:[{gravity,earthquake}]};
 const r=designBeam(input);assert.equal(r.status,"design_ready",JSON.stringify(r));if("selected" in r&&r.selected&&"shear" in r.selected){assert.ok(r.selected.shear!.end.requiredLongitudinalMm2>0);assert.ok(r.selected.bars.some(b=>b.face==="side"));}
 const excessive=beamDesignFixture(6),t=solvedUniformBeam(0,"high-torque",false,200);excessive.ultimate.push(combineBeamCases("ULS-too-high-torque",[{factor:1,load:gravity},{factor:1,load:t}]));excessive.mode="existing_reinforcement";excessive.existing={top:{diameter:20,count:2,rows:1},bottom:{diameter:20,count:2,rows:1},stirrupDiameter:8,legs:2,spacingEnd:100,spacingMiddle:150,sideDiameter:12,sideEach:1};assert.equal(designBeam(excessive).status,"failed");
});

test("capacity-design end moments retain the actual axial force of their signed load case",()=>{
 const input=beamDesignFixture(6),gravity=solvedUniformBeam(6,"axial-gravity"),earthquake=solvedUniformBeam(3,"axial-earthquake",true);earthquake.endForces=[...earthquake.endForces];(earthquake.endForces as number[])[0]=100;(earthquake.endForces as number[])[6]=-100;
 input.ultimate.push(combineBeamCases("axial-combined",[{factor:1,load:gravity},{factor:1,load:earthquake}]));input.seismic={D:2.5,analysisStamp:gravity.analysisStamp,source:"explicit axial/shear fixture",pairs:[{gravity,earthquake}]};
 const r=designBeam(input);assert.equal(r.status,"design_ready",JSON.stringify(r));if("selected" in r&&r.selected&&"shear" in r.selected){const transfers=r.selected.shear!.transfers as {endCapacities:{leftTop:{NcompressionKn:number};rightBottom:{NcompressionKn:number}}}[];assert.equal(transfers[0].endCapacities.leftTop.NcompressionKn,100);assert.equal(transfers[0].endCapacities.rightBottom.NcompressionKn,100);}
});
