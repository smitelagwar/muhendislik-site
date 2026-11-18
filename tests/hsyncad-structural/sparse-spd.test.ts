import test from "node:test";
import assert from "node:assert/strict";
import {assembleSymmetric,solveSparseSpd,multiply,type UpperEntry} from "../../src/lib/hsyncad/structural/sparse-spd";
const close=(a:number,b:number)=>assert.ok(Math.abs(a-b)<=1e-9+1e-6*Math.abs(b),`${a} != ${b}`);
test("independent 2DOF analytical solution and residual",()=>{
 const a=assembleSymmetric(2,[[0,0,4],[0,1,1],[1,1,3]]),r=solveSparseSpd(a,[1,2]);
 assert.equal(r.status,"solved");if(r.status!=="solved")return;
 close(r.x[0],1/11);close(r.x[1],7/11);assert.ok(r.relativeResidual<1e-12);
});
test("axial chain satisfies FL/EA and each force equilibrium at structural scale",()=>{
 const n=3000,EA=2e6,L=.5,F=30,entries:UpperEntry[]=[];
 for(let i=0;i<n;i++){entries.push([i,i,(i===n-1?1:2)*EA/L]);if(i<n-1)entries.push([i,i+1,-EA/L]);}
 const b=new Float64Array(n);b[n-1]=F;const a=assembleSymmetric(n,entries),r=solveSparseSpd(a,b,{relativeTolerance:1e-6});
 assert.equal(r.status,"solved");if(r.status!=="solved")return;
 close(r.x[n-1],F*n*L/EA);close(EA/L*r.x[0],F);assert.ok(r.factorEntries<=2*n);
 for(const i of [0,20,1500,2999])close(r.x[i],F*(i+1)*L/EA);
});
test("zero-load mechanism and indefinite stiffness are rejected, no fake zero solution",()=>{
 assert.equal(solveSparseSpd(assembleSymmetric(2,[[0,0,1],[0,1,-1],[1,1,1]]),[0,0]).status,"not_positive_definite");
 assert.equal(solveSparseSpd(assembleSymmetric(2,[[0,0,1],[0,1,2],[1,1,1]]),[1,1]).status,"not_positive_definite");
 assert.equal(solveSparseSpd(assembleSymmetric(2,[[0,0,1]]),[1,0]).status,"not_positive_definite");
});
test("stiffness units spanning16orders preserve scaled solution",()=>{
 const a=assembleSymmetric(2,[[0,0,1e-8],[1,1,1e8]]),r=solveSparseSpd(a,[2e-8,3e8]);
 assert.equal(r.status,"solved");if(r.status==="solved"){close(r.x[0],2);close(r.x[1],3);}
});
test("finite input, storage convention, resource budget and cancellation are enforced",()=>{
 assert.throws(()=>assembleSymmetric(2,[[1,0,1]]));assert.throws(()=>assembleSymmetric(2,[[0,0,NaN]]));
 const a=assembleSymmetric(2,[[0,0,2],[0,1,-1],[1,1,2]]);
 assert.equal(solveSparseSpd(a,[NaN,0]).status,"invalid_input");
 assert.equal(solveSparseSpd(a,[1,0],{maxFactorEntries:1}).status,"resource_limit");
 assert.equal(solveSparseSpd(a,[1,0],{cancelled:()=>true}).status,"cancelled");
 assert.deepEqual([...multiply(a,[1,1])],[1,1]);
});
test("assembly order is deterministic and inputs are never modified",()=>{
 const entries:UpperEntry[]=[[0,0,2],[0,0,3],[0,1,1],[1,1,4]],before=structuredClone(entries);
 const a=assembleSymmetric(2,entries),b=assembleSymmetric(2,[...entries].reverse());
 assert.deepEqual(solveSparseSpd(a,[1,2]),solveSparseSpd(b,[1,2]));assert.deepEqual(entries,before);
});
