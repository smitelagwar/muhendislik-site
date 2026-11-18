import test from "node:test";
import assert from "node:assert/strict";
import {createDemoModel} from "../../src/lib/hsyncad/model";
import {createStructuralProject} from "../../src/lib/hsyncad/structural/project-schema";
import {evaluateRigidRectangularBearing,resolveFoundationSettings,winklerFoundation} from "../../src/lib/hsyncad/structural/foundation-contact";

const fixture=()=>createStructuralProject(createDemoModel(),"synthetic-foundation");
const set=(p:ReturnType<typeof fixture>,key:keyof typeof p.settings,value:number|string|boolean|null)=>{p.settings[key]={value,source:value===null?"unknown":"user_input",evidence:value===null?null:"isolated synthetic fixture"};};

test("bearing keeps signed uplift and exposes qmin/average/maximum even when average is checked",()=>{
 const result=evaluateRigidRectangularBearing({footing:{id:"f",role:"footing",widthM:2,lengthM:2,centerX:0,centerY:0},
  demand:{compressionKn:100,momentXKnm:80,momentYKnm:0},selfWeightKn:0,selfWeightSource:"explicit zero synthetic",overburdenKn:0,overburdenSource:"explicit zero synthetic",
  limitKpa:55,limitBasis:"qt_design_resistance",criterion:"average",criterionApplicability:"unknown"});
 assert.equal(result.areaM2,4);assert.equal(result.qaverageKpa,25);assert.equal(result.qmaxKpa,85);assert.equal(result.qminKpa,-35);
 assert.equal(result.checkedKpa,25);assert.equal(result.status,"uplift");
});

test("MS1 geotechnical inputs convert once and unknown/both capacity bases do not silently select",()=>{
 const p=fixture();set(p,"qt",55*9.80665);set(p,"subgrade",3080*9.80665);
 set(p,"foundationCriterion","maximum");set(p,"foundationEarthquake","include");set(p,"foundationNegativeContact","check");
 set(p,"interaction","enabled");set(p,"connection","straight");set(p,"thicknessFactor",1);set(p,"soilMethod","winkler");
 const controls=resolveFoundationSettings(p,"footing",{id:"G+Q",seismic:false,limitState:"ultimate"});
 assert.ok(Math.abs(controls.bearingLimitKpa!-539.36575)<1e-10);assert.ok(Math.abs(controls.ksKnm3!-30204.482)<1e-9);
 assert.equal(controls.limitBasis,"qt_design_resistance");assert.equal(controls.blockers.length,0);
 set(p,"allowablePressure",300);const ambiguous=resolveFoundationSettings(p,"footing",{id:"G+Q",seismic:false,limitState:"ultimate"});
 assert.equal(ambiguous.limitBasis,"unknown");assert.equal(ambiguous.bearingLimitKpa,null);
 assert.ok(ambiguous.reviewRequired.some(b=>b.includes("qt tasarım")));
});

test("missing settings and average normative basis remain blockers; disabled coupled option cannot run",()=>{
 const p=fixture();set(p,"qt",500);set(p,"subgrade",30000);set(p,"foundationCriterion","average");set(p,"foundationEarthquake","include");
 set(p,"foundationNegativeContact","check");set(p,"interaction","enabled");set(p,"connection","straight");set(p,"thicknessFactor",1);set(p,"soilMethod","winkler");
 const settings=resolveFoundationSettings(p,"footing",{id:"E",seismic:true,limitState:"ultimate"});
 assert.ok(settings.reviewRequired.some(b=>b.includes("normatif uygulanabilirliği")));
 set(p,"interaction",null);
 const missing=resolveFoundationSettings(p,"footing",{id:"E",seismic:true,limitState:"ultimate"});
 assert.ok(missing.blockers.some(b=>b.includes("etkileşimi seçimi bilinmiyor")));
 set(p,"interaction","enabled");set(p,"foundationCriterion","maximum");set(p,"connection","enlarged");set(p,"enlargementRatio",.5);set(p,"soilMethod","coupled_winkler");
 const coupled=resolveFoundationSettings(p,"footing",{id:"E",seismic:true,limitState:"ultimate"});
 assert.throws(()=>winklerFoundation({shellIds:["raft"],settings:coupled}),/coupled_winkler/);
});

test("invalid limit values reject instead of producing a false pass",()=>{
 const base={footing:{id:"f",role:"footing" as const,widthM:2,lengthM:2,centerX:0,centerY:0},demand:{compressionKn:100,momentXKnm:0,momentYKnm:0},
  selfWeightKn:0,selfWeightSource:"zero",overburdenKn:0,overburdenSource:"zero",limitBasis:"qt_design_resistance" as const,criterion:"maximum" as const,criterionApplicability:"applicable" as const};
 assert.throws(()=>evaluateRigidRectangularBearing({...base,limitKpa:0}),/pozitif/);
 assert.throws(()=>evaluateRigidRectangularBearing({...base,limitKpa:Number.NaN}),/pozitif/);
});
