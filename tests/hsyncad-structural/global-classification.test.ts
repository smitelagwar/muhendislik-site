import test from "node:test";
import assert from "node:assert/strict";
import {classifySeismicUse,evaluateBasement,classifyBuildingHeight,requiredPerformance,type BasementEvidence} from "../../src/lib/hsyncad/structural/building-classification";
const f=<T>(value:T|null)=>({value,source:"explicit independent fixture"});
const basement:BasementEvidence={hasBasement:f(true),enclosingRigidSides:f(3),basementTopM:f(0),wholePeriod:f({X:1.09,Y:1.099}),upperMassOnlyPeriod:f({X:1,Y:1})};
test("BKS/I and DTS use exact thresholds and BKS1 suffix, not project name",()=>{
 assert.equal(classifySeismicUse(f(1),f(.33)).dts,"3a");assert.equal(classifySeismicUse(f(2),f(.5)).dts,"2");assert.equal(classifySeismicUse(f(3),f(.75)).dts,"1");assert.equal(classifySeismicUse(f(1),f(.329999)).I,1.5);assert.throws(()=>classifySeismicUse(f(null),f(.75)));
});
test("basement needs >=3 rigid sides and both actual period ratios strictly below1.1",()=>{
 assert.equal(evaluateBasement(basement).rigid,true);assert.equal(evaluateBasement({...basement,wholePeriod:f({X:1.1,Y:1})}).rigid,false);assert.equal(evaluateBasement({...basement,enclosingRigidSides:f(2)}).rigid,false);assert.equal(evaluateBasement({...basement,wholePeriod:f(null)}).rigid,null);
});
test("height is top minus eligible base, BYS inequalities and roof decision remain explicit",()=>{
 const levels=[{id:"f",elevationM:-6,role:"foundation" as const,source:"fixture"},{id:"b",elevationM:0,role:"basement" as const,source:"fixture"},{id:"r",elevationM:28,role:"roof" as const,source:"fixture"}];
 const h=classifyBuildingHeight(levels,evaluateBasement(basement),"1",f(null));assert.equal(h.heightM,28);assert.equal(h.bys,5);assert.equal(requiredPerformance("1",1).status,"unsupported");
 const no=classifyBuildingHeight(levels,evaluateBasement({...basement,enclosingRigidSides:f(2)}),"1",f(null));assert.equal(no.heightM,34);assert.equal(no.bys,4);
 assert.equal(classifyBuildingHeight([...levels,{id:"lift",elevationM:31,role:"roof_extension",source:"fixture"}],evaluateBasement(basement),"1",f(null)).heightM,null);
 assert.equal(classifyBuildingHeight([...levels,{id:"lift",elevationM:31,role:"roof_extension",source:"fixture"}],evaluateBasement(basement),"1",f(true)).heightM,28);
});
