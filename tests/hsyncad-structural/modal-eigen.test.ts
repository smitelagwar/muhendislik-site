import test from "node:test";
import assert from "node:assert/strict";
import {assembleSymmetric,factorSparseSpd} from "../../src/lib/hsyncad/structural/sparse-spd";
import {solveModalEigen} from "../../src/lib/hsyncad/structural/modal-eigen";
import {solveModalStructure} from "../../src/lib/hsyncad/structural/modal-structure";
import {cantileverModal} from "./modal-fixtures";
const close=(a:number,b:number)=>assert.ok(Math.abs(a-b)<1e-8+1e-6*Math.abs(b),`${a} != ${b}`);
test("reused sparse factor solves independent RHS with actual residuals",()=>{
 const f=factorSparseSpd(assembleSymmetric(2,[[0,0,2],[0,1,-1],[1,1,2]]));assert.equal(f.status,"factored");if(f.status!=="factored")return;
 const a=f.solve([1,0]),b=f.solve([0,1]);assert.equal(a.status,"solved");assert.equal(b.status,"solved");if(a.status!=="solved"||b.status!=="solved")return;close(a.x[0],2/3);close(b.x[0],1/3);assert.equal(f.solve([NaN,0]).status,"invalid_input");
});
test("SDOF omega/period/participation follow mechanics with no empirical clipping",()=>{
 const K=assembleSymmetric(1,[[0,0,40]]),r=solveModalEigen(K,[10],[{id:"X",vector:[1],requiredFraction:1}],{maxModes:1});assert.equal(r.status,"solved",JSON.stringify(r));if(r.status!=="solved")return;
 close(r.modes[0].omega2,4);close(r.modes[0].periodSeconds,Math.PI);close(r.modes[0].participation.X.effectiveMass,10);close(r.coverage.X,1);assert.ok(r.modes[0].relativeResidual<1e-7);
});
test("two-storey equal-mass shear system matches independent quadratic characteristic polynomial",()=>{
 const K=assembleSymmetric(2,[[0,0,2],[0,1,-1],[1,1,1]]),r=solveModalEigen(K,[1,1],[{id:"X",vector:[1,1],requiredFraction:1}],{maxModes:2});assert.equal(r.status,"solved",JSON.stringify(r));if(r.status!=="solved")return;
 close(r.modes[0].omega2,(3-Math.sqrt(5))/2);close(r.modes[1].omega2,(3+Math.sqrt(5))/2);close(r.coverage.X,1);assert.ok(r.orthogonalityError<1e-8);
});
test("massless rotational DOF is statically recovered, never assigned tiny artificial mass",()=>{
 const K=assembleSymmetric(2,[[0,0,4],[0,1,-2],[1,1,2]]),r=solveModalEigen(K,[2,0],[{id:"X",vector:[1,0],requiredFraction:1}],{maxModes:1});assert.equal(r.status,"solved",JSON.stringify(r));if(r.status!=="solved")return;
 close(r.modes[0].omega2,1);close(r.modes[0].shape[1]/r.modes[0].shape[0],1);assert.equal(r.metadata.masslessDofs,1);
});
test("repeated and nearby modes preserve all directional and rotational effective masses",()=>{
 const K=assembleSymmetric(3,[[0,0,4],[1,1,4],[2,2,4.00001]]),r=solveModalEigen(K,[1,1,2],[{id:"X",vector:[1,0,0],requiredFraction:1},{id:"Y",vector:[0,1,0],requiredFraction:1},{id:"RZ",vector:[0,0,1],requiredFraction:1}],{maxModes:3});assert.equal(r.status,"solved",JSON.stringify(r));if(r.status!=="solved")return;
 close(r.coverage.X,1);close(r.coverage.Y,1);close(r.coverage.RZ,1);close(r.modes[0].omega2,2.000005);close(r.modes[1].omega2,4);close(r.modes[2].omega2,4);
});
test("mode count expands beyond legacy limits; insufficient budget never passes",()=>{
 const n=18,K=assembleSymmetric(n,Array.from({length:n},(_,i)=>[i,i,(i+1)**2] as const)),mass=Array(n).fill(1),influence=[{id:"X",vector:Array(n).fill(1),requiredFraction:.99}];
 const enough=solveModalEigen(K,mass,influence,{maxModes:n,initialSubspace:4});assert.equal(enough.status,"solved",JSON.stringify(enough));if(enough.status==="solved")assert.ok(enough.modes.length>15);
 assert.equal(solveModalEigen(K,mass,influence,{maxModes:4,initialSubspace:4}).status,"insufficient_modes");
});
test("zero-load mechanisms, invalid mass, unconverged budget and cancellation fail closed",()=>{
 const K=assembleSymmetric(2,[[0,0,2],[0,1,-1],[1,1,2]]),r=[{id:"X",vector:[1,1],requiredFraction:1}];
 assert.equal(solveModalEigen(assembleSymmetric(2,[[0,0,1],[0,1,-1],[1,1,1]]),[1,1],r,{maxModes:2}).status,"solver_error");
 assert.equal(solveModalEigen(K,[-1,1],r,{maxModes:2}).status,"invalid_input");
 assert.equal(solveModalEigen(K,[1,1],r,{maxModes:1,maxIterations:1}).status,"nonconverged");
 assert.equal(solveModalEigen(K,[1,1],r,{maxModes:2,cancelled:()=>true}).status,"solver_error");
});

test("actual 3D element assembly reproduces tip-mass cantilever frequency, including massless bending rotation",()=>{
 const r=solveModalStructure(cantileverModal(),{maxModes:4});assert.equal(r.status,"solved",JSON.stringify(r));if(r.status!=="solved")return;
 close(r.modes[0].omega2,3*3e7*.01/(3**3*10));close(r.modes[0].fullShape[0],0);close(r.modes[0].fullShape[10]/r.modes[0].fullShape[6],1.5/3);
});
test("very low frequencies are diagnosed and zero requested participation modes retained",()=>{
 const r=solveModalEigen(assembleSymmetric(2,[[0,0,1e-12],[1,1,1]]),[1,1],[{id:"X",vector:[0,1],requiredFraction:1}],{maxModes:2});assert.equal(r.status,"solved",JSON.stringify(r));if(r.status!=="solved")return;
 assert.equal(r.modes.length,2);assert.ok(r.modes[0].diagnostics.includes("low_frequency_omega2_below_declared_threshold"));assert.ok(r.modes[0].zeroParticipation);close(r.modes[0].omega2,1e-12);assert.ok(r.modes[0].periodSeconds>1000000);
});
