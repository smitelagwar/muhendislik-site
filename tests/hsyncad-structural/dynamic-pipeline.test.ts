import test from "node:test";
import assert from "node:assert/strict";
import {responseSpectrum} from "../../src/lib/hsyncad/structural/response-spectrum";
import {solveModalStructure,prepareModalStructure,type ModalStructureInput} from "../../src/lib/hsyncad/structural/modal-structure";
import {evaluateSpectrum,type StandardSpectrum} from "../../src/lib/hsyncad/structural/design-spectrum";
import {partitionBasementMass,accidentalDiaphragmSets,basementDesignForce,concreteSeismicCombinations} from "../../src/lib/hsyncad/structural/dynamic-analysis-sets";
import {orthogonalEarthquakeCases,type ForceCase} from "../../src/lib/hsyncad/structural/modal-combination";
import {buildingFixture} from "../../scripts/hsyncad/p06-fixtures";
import {cantileverModal} from "./modal-fixtures";
const close=(a:number,b:number)=>assert.ok(Math.abs(a-b)<1e-8+1e-5*Math.abs(b),`${a} != ${b}`);
const spectrum:StandardSpectrum={hazard:"DD-2",ss:1,s1:.3,soil:"ZC",dataSource:"synthetic oracle"};
const direction={id:"X" as const,reduction:{R:4,D:2,I:1},orientation:"horizontal" as const,equivalentCheck:{shearKn:1,irregularity:{A1:false,B2:false,B3:false,decisionSource:"explicit benchmark"}}};
test("spectrum-to-actual-frame forces: SDOF displacement, base moment and scaled reaction oracle",()=>{
 const input=cantileverModal(),r=responseSpectrum(input,{maxModes:4},spectrum,direction,"CQC",.05);assert.equal(r.status,"solved",JSON.stringify(r));if(r.status!=="solved")return;
 const T=2*Math.PI/Math.sqrt(3*3e7*.01/(27*10)),a=evaluateSpectrum(spectrum,T,direction.reduction).reducedMps2,force=10*a;
 close(r.baseShearKn,force);close(r.nodes[1].displacement.maxima[0],force*27/(3*3e7*.01));close(r.nodes[0].constraintReaction.maxima[0],force);close(r.members[0].localEndForces.maxima[5],force*3);
 const increased=responseSpectrum(input,{maxModes:4},spectrum,{...direction,equivalentCheck:{...direction.equivalentCheck,shearKn:force*2}},"CQC",.05);assert.equal(increased.status,"solved");if(increased.status!=="solved")return;close(increased.scaling.beta,1.6);close(increased.nodes[1].displacement.maxima[0],r.nodes[1].displacement.maxima[0]*1.6);close(increased.members[0].localEndForces.maxima[5],force*3*1.6);
 input.frames[0].uniformLocal=[1,-2,3];const repeated=responseSpectrum(input,{maxModes:4},spectrum,direction,"CQC",.05);assert.equal(repeated.status,"solved");if(repeated.status==="solved")close(repeated.baseShearKn,force);
});
export function rigidBuilding():ModalStructureInput{
 const f=buildingFixture(2,3,false),inertias=f.nodes.map(n=>({nodeId:n.id,values:(n.position[2]===0?[0,0,0,0,0,0]:[10,10,10,0,0,0]) as [number,number,number,number,number,number],source:"explicit" as const}));
 return {...f,inertias,rotationOrigin:[2.5,2.5,0],directions:[{id:"X",requiredFraction:.99},{id:"Y",requiredFraction:.99},{id:"RZ",requiredFraction:.99}],rigidDiaphragms:[3,6].map(z=>({id:`floor:${z}`,nodeIds:f.nodes.filter(n=>n.position[2]===z).map(n=>n.id),centerXY:[2.5,2.5] as const,decisionSource:"explicit benchmark rigid slab",accidental:null}))};
}
test("rigid in-plane constraints reproduce exact total/polar mass without artificial DOFs",()=>{
 const input=rigidBuilding(),system=prepareModalStructure(input),r=solveModalStructure(input,{maxModes:24});assert.equal(r.status,"solved",JSON.stringify(r));if(r.status!=="solved")return;
 close(r.totalInfluenceMass.X,80);close(r.totalInfluenceMass.Y,80);close(r.totalInfluenceMass.RZ,80*(2.5**2+2.5**2));assert.ok(r.coverage.X>.99-1e-8);assert.ok(r.coverage.Y>.99-1e-8);assert.ok(r.coverage.RZ>.99-1e-8);
 for(const m of r.modes)for(const d of input.rigidDiaphragms!){const i=input.nodes.findIndex(n=>n.id===d.nodeIds[0]),j=input.nodes.findIndex(n=>n.id===d.nodeIds[1]),rz=m.fullShape[6*i+5];close(m.fullShape[6*i+5],m.fullShape[6*j+5]);close(m.fullShape[6*j+1]-m.fullShape[6*i+1],(input.nodes[j].position[0]-input.nodes[i].position[0])*rz);}
 assert.ok(system.K.n<system.free.length);
});
test("eccentricity +/- inertia cases implement source Eq4.18 and affect torsional modes",()=>{
 const input=rigidBuilding(),sets=accidentalDiaphragmSets(input,input.rigidDiaphragms!.map(d=>({diaphragmId:d.id,widthX:5,widthY:5})));assert.equal(sets.length,4);
 const a=prepareModalStructure(sets[0].input),b=prepareModalStructure(sets[1].input),base=prepareModalStructure(input);close(a.mass.reduce((s,v)=>s+v,0)-base.mass.reduce((s,v)=>s+v,0),80*(.05*5)**2);assert.deepEqual(a.mass,b.mass);
 const r=solveModalStructure(input,{maxModes:24}),e=solveModalStructure(sets[0].input,{maxModes:24});assert.equal(e.status,"solved");assert.equal(r.status,"solved");if(r.status==="solved"&&e.status==="solved")assert.ok(e.modes.some((m,i)=>Math.abs(m.periodSeconds-r.modes[i]?.periodSeconds)>1e-5));
 const invalid=structuredClone(input);invalid.rigidDiaphragms![0].centerXY=[0,0];assert.equal(solveModalStructure(invalid,{maxModes:24}).status,"invalid_input");
});
test("upper/basement mass sets retain shared stiffness, complete partition and physical coupling",()=>{
 const input=rigidBuilding(),split=partitionBasementMass(input,input.nodes.map(n=>({nodeId:n.id,part:n.position[2]===6?"upper":n.position[2]===3?"basement":"excluded",reason:"explicit benchmark floor role"})),"benchmark rigid-basement assumption, not automatic classification");
 const u=prepareModalStructure(split.upper),b=prepareModalStructure(split.basement);assert.deepEqual(u.K.rows,b.K.rows);close(u.mass.filter((_,i)=>u.basis[i].component===0).reduce((s,v)=>s+v,0),40);close(b.mass.filter((_,i)=>b.basis[i].component===0).reduce((s,v)=>s+v,0),40);
 const r=solveModalStructure(split.upper,{maxModes:24});assert.equal(r.status,"solved",JSON.stringify(r));if(r.status==="solved")assert.ok(r.modes.some(m=>m.fullShape.slice(4*6,8*6).some(v=>Math.abs(v)>1e-8)));
 const raw=responseSpectrum(split.upper,{maxModes:24},spectrum,{...direction,purpose:"raw_modal",equivalentCheck:null},"CQC",.05);assert.equal(raw.status,"solved",JSON.stringify(raw));if(raw.status==="solved"){assert.equal(raw.scaling.beta,1);assert.ok(raw.members.some(m=>m.localEndForces.maxima.some(v=>v>0)));}
 assert.equal(responseSpectrum(split.upper,{maxModes:24},spectrum,direction,"CQC",.05).status,"invalid_input");
 assert.throws(()=>partitionBasementMass(input,[],""));close(split.basementReduction.R/split.basementReduction.I,2.5);
});
test("local vertical modal response uses actual axial stiffness and no horizontal reduction",()=>{
 const input=cantileverModal();input.nodes[1].prescribed=[0,0,null,0,0,0];input.directions=[{id:"Z",requiredFraction:1}];
 const vertical={id:"Z" as const,orientation:"vertical" as const,reduction:{R:1,D:1,I:1},equivalentCheck:null},r=responseSpectrum(input,{maxModes:4},spectrum,vertical,"CQC",.05);assert.equal(r.status,"solved",JSON.stringify(r));if(r.status!=="solved")return;
 const stiffness=3e7*.2/3,T=2*Math.PI*Math.sqrt(10/stiffness),a=evaluateSpectrum(spectrum,T,{R:1,D:1,I:1},"vertical").reducedMps2;close(r.baseShearKn,10*a);close(r.nodes[1].displacement.maxima[2],10*a/stiffness);close(r.members[0].localEndForces.maxima[0],10*a);
});
test("spring-supported modal response retains actual spring reaction and series compliance",()=>{
 const input=cantileverModal();input.nodes[0].prescribed=[null,0,0,0,0,0];input.nodes[0].springs=[1000,0,0,0,0,0];
 const r=responseSpectrum(input,{maxModes:4},spectrum,direction,"CQC",.05);assert.equal(r.status,"solved",JSON.stringify(r));if(r.status!=="solved")return;
 const compliance=1/1000+27/(3*3e7*.01),T=2*Math.PI*Math.sqrt(10*compliance),F=10*evaluateSpectrum(spectrum,T,direction.reduction).reducedMps2;
 close(r.nodes[0].springReaction.maxima[0],F);close(r.nodes[0].constraintReaction.maxima[0],0);close(r.nodes[1].displacement.maxima[0],F*compliance);
});
test("bilateral raft modal frequency, soil reaction and pressure follow total area and mass",()=>{
 const positions=[[0,0,0],[1,0,0],[1,1,0],[0,1,0]] as const;
 const input:ModalStructureInput={nodes:positions.map((position,i)=>({id:`n${i}`,position,load:[0,0,0,0,0,0],prescribed:[0,0,null,0,0,0],springs:[0,0,0,0,0,0]})),frames:[],shells:[{id:"raft",nodes:["n0","n1","n2","n3"],E:3e7,nu:.2,thickness:.2,shearCorrection:5/6,drillPenalty:.01,modifiers:{membrane:1,bending:1,shear:1},pressure:0}],foundation:{shellIds:["raft"],ks:10000,compressionSign:-1,mode:"bilateral",maxIterations:1},inertias:positions.map((_p,i)=>({nodeId:`n${i}`,values:[0,0,.125,0,0,0],source:"integrated"})),rotationOrigin:[.5,.5,0],directions:[{id:"Z",requiredFraction:1}]};
 const r=responseSpectrum(input,{maxModes:4},spectrum,{id:"Z",orientation:"vertical",reduction:{R:1,D:1,I:1},equivalentCheck:null},"CQC",.05);assert.equal(r.status,"solved",JSON.stringify(r));if(r.status!=="solved")return;
 const T=2*Math.PI*Math.sqrt(.5/10000),force=.5*evaluateSpectrum(spectrum,T,{R:1,D:1,I:1},"vertical").reducedMps2;close(r.modal.modes[0].omega2,10000/.5);close(r.baseShearKn,force);
 r.nodes.forEach(n=>{close(n.soil!.tributaryArea,.25);close(n.soil!.perturbation.maxima[0],force/4);close(n.soil!.perturbation.maxima[1],force);assert.equal(n.soil!.totalContactApproved,false);});
 input.foundation!.mode="compression_only";assert.equal(responseSpectrum(input,{maxModes:4},spectrum,{id:"Z",orientation:"vertical",reduction:{R:1,D:1,I:1},equivalentCheck:null},"CQC",.05).status,"invalid_input");
});
test("concrete and basement combinations use active load cases, complete tuples and explicit absent-load decisions",()=>{
 const g:ForceCase={id:"G",modelRevision:"1",stiffnessSet:"S",values:[10,20,30,40,50,60]},x={...g,id:"X"},y={...g,id:"Y"},horizontal=orthogonalEarthquakeCases(x,y,null);
 const combinations=concreteSeismicCombinations([{kind:"G",case:g}],horizontal,{method:"approximate_4.10",sds:1,applicabilityDecision:"4.4.3.1 features explicitly absent"},{Q:"No live load in synthetic fixture",S:"No snow fixture",H:"No soil fixture"});assert.equal(combinations.length,16);close(combinations[0].values[0],10+13+2);close(combinations[1].values[0],9+13-2);
 assert.throws(()=>concreteSeismicCombinations([{kind:"G",case:g}],horizontal,{method:"approximate_4.10",sds:1,applicabilityDecision:"declared"}));
 const v=basementDesignForce("B",g,{...g,id:"lower"},"basement","nonductile",2.5,1.5);close(v.values[0],(.6*2.5+1.5)*10);assert.equal(v.secondOrderScaleApplied,false);
});
test("unknown mass/contact/spectrum decision cannot produce dynamic success",()=>{
 const input=cantileverModal();input.inertias.pop();assert.equal(solveModalStructure(input,{maxModes:4}).status,"invalid_input");
 assert.equal(responseSpectrum(cantileverModal(),{maxModes:4},spectrum,{...direction,equivalentCheck:null},"CQC",.05).status,"invalid_input");
});
test("symmetric and torsion-coupled rigid floor frequencies match independent 2x2 mechanics",()=>{
 for(const asymmetric of [false,true]){
  const f=buildingFixture(2,2,false);f.frames=f.frames.filter(e=>e.nodes.map(id=>f.nodes.find(n=>n.id===id)!.position[2]).some(z=>z===0));f.frames.forEach(e=>{e.theory="euler_bernoulli";});
  f.nodes.filter(n=>n.position[2]>0).forEach(n=>{n.prescribed=[null,null,0,0,0,null];});
  if(asymmetric)f.frames.filter(e=>f.nodes.find(n=>n.id===e.nodes[0])!.position[1]===0).forEach(e=>{e.E*=2;});
  const input:ModalStructureInput={...f,inertias:f.nodes.map(n=>({nodeId:n.id,source:"explicit",values:n.position[2]===0?[0,0,0,0,0,0]:[10,10,0,0,0,0]})),rotationOrigin:[2.5,2.5,0],directions:[{id:"X",requiredFraction:1},{id:"Y",requiredFraction:1},{id:"RZ",requiredFraction:1}],rigidDiaphragms:[{id:"roof",nodeIds:f.nodes.filter(n=>n.position[2]>0).map(n=>n.id),centerXY:[2.5,2.5],decisionSource:"analytical rigid plate",accidental:null}]};
  const r=solveModalStructure(input,{maxModes:3});assert.equal(r.status,"solved",JSON.stringify(r));if(r.status!=="solved")return;
  const k=12*3e7*.005208333333333333/27,count=asymmetric?6:4,a=count*k/40,c=(count*k*12.5+4*1.25e7*.0088/3)/500,b=asymmetric?5*k/Math.sqrt(40*500):0;
  const expected=[a,(a+c-Math.hypot(a-c,2*b))/2,(a+c+Math.hypot(a-c,2*b))/2].sort((a,b)=>a-b);r.modes.forEach((m,i)=>close(m.omega2,expected[i]));
  if(asymmetric)assert.ok(r.modes.some(m=>m.participation.X.fraction>.01&&m.participation.RZ.fraction>.01));
 }
});
