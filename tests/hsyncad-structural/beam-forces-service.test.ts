import test from "node:test";
import assert from "node:assert/strict";
import {beamStations,beamSectionForce,combineBeamCases} from "../../src/lib/hsyncad/structural/beam-forces";
import {uniformBeamDeflection,crackedBeamSection,beamServiceability} from "../../src/lib/hsyncad/structural/beam-service";
import {placeBeamBars} from "../../src/lib/hsyncad/structural/beam-detailing";
import {solvedUniformBeam,beamDesignFixture,beamTestMaterial} from "./beam-fixtures";
const close=(a:number,b:number,t=1e-7)=>assert.ok(Math.abs(a-b)<t*Math.max(1,Math.abs(b)),`${a} != ${b}`);
test("real P06 reactions recover analytical qL2/8 and a shifted zero-shear station",()=>{
 const c=solvedUniformBeam(10),s=beamStations([c]);close(beamSectionForce(c,3000).Mknm,10*6*6/8);close(beamSectionForce(c,0).Vkn,30);assert.equal(s.length,3);
 const shifted={...c,endForces:[...c.endForces]};shifted.endForces[1]=20;shifted.endForces[7]=40;shifted.endForces[11]=-60;
 assert.ok(beamStations([shifted]).some(s=>Math.abs(s.xMm-2000)<1e-8));assert.throws(()=>beamStations([{...c,kind:"CQC" as never}]));assert.throws(()=>combineBeamCases("bad",[{factor:1,load:c},{factor:1,load:{...c,id:"stale",analysisStamp:"old-R"}}]));
});
test("curvature integration matches qL4/384EI and fixed-end qL4/384EI exactly",()=>{
 const EI=30000*.3e3*600**3/12,L=6000,q=10,simple=uniformBeamDeflection(solvedUniformBeam(q),EI,"simple"),fixed=uniformBeamDeflection(solvedUniformBeam(q,"fixed",true),EI,"interior");
 close(simple.maxAbsMm,5*q*L**4/(384*EI));close(simple.criticalXmm,3000);close(fixed.maxAbsMm,q*L**4/(384*EI));
});
test("cracked inertia, duration and actual service load change deflection/crack width",()=>{
 const fixture=beamDesignFixture(),section={bw:300,h:600,bf:300,hf:0},layout={top:{diameter:20,count:2,rows:1},bottom:{diameter:20,count:2,rows:1},stirrupDiameter:8,legs:2,spacingEnd:100,spacingMiddle:150,sideDiameter:12,sideEach:0},bars=placeBeamBars(section,layout,30,16).bars,p=crackedBeamSection(section,bars,beamTestMaterial,1);assert.ok(p.Icr>0&&p.Icr<p.Ig);
 const input={section,bars,material:beamTestMaterial,...fixture.service!,kind:"simple" as const},a=beamServiceability(input),b=beamServiceability({...input,duration:"3months"});assert.ok(a.longTermMm>b.longTermMm);
 const multiplier=(id:string,load:typeof input.total)=>combineBeamCases(id,[{factor:2,load}]),higher=beamServiceability({...input,total:multiplier("higher",input.total),sustained:multiplier("higher-s",input.sustained),live:multiplier("higher-q",input.live)});assert.ok(higher.instant.maxAbsMm>a.instant.maxAbsMm);assert.ok(Math.max(...higher.cracks.map(c=>c.widthMm))>Math.max(...a.cracks.map(c=>c.widthMm)));
});
