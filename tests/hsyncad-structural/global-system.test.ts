import test from "node:test";
import assert from "node:assert/strict";
import {selectSystem,directionalCompatibility,type DirectionSystemInput} from "../../src/lib/hsyncad/structural/system-selection";
const f=<T>(value:T)=>({value,source:"source-informed scenario, not native expected output"});
const close=(a:number|null,b:number)=>assert.ok(a!==null&&Math.abs(a-b)<1e-10);
const a13:DirectionSystemInput={enteredR:f(8),declaredCode:f("A13"),traits:f({frameDuctility:"none",wallDuctility:"high",wallKind:"solid",slab:"beam_slab"}),moments:{wallShare:1,individual:[{id:"w1",share:.5},{id:"w2",share:.5}],edges:[{id:"n",share:.5},{id:"s",share:.5}],coupling:[],source:"signed cuts scenario"}};
test("A13 table R6 is selected before4/5 distribution reduction; subsequent decisions do not multiply R repeatedly",()=>{
 const r=selectSystem("X",a13,"1",5,1);assert.equal(r.initialR,6);close(r.usedR,4.8);assert.equal(r.D,2.5);close(selectSystem("X",{...a13,enteredR:f(4.8)},"1",5,1).usedR,4.8);close(selectSystem("X",a13,"1",5,1).usedR,4.8);close(selectSystem("X",a13,"1",5,.8125).usedR,4.8*.8125);
});
test("A15/R7 needs actual wall-frame share and by-direction compatible ductility",()=>{
 const input:DirectionSystemInput={...a13,enteredR:f(7),declaredCode:f("A15"),traits:f({frameDuctility:"high",wallDuctility:"high",wallKind:"solid",slab:"beam_slab"}),moments:{...a13.moments!,wallShare:.6,individual:[{id:"1",share:.3},{id:"2",share:.3}],edges:[{id:"l",share:.3},{id:"r",share:.3}]}};
 const r=selectSystem("X",input,"1",5,1);assert.equal(r.usedR,7);assert.equal(selectSystem("X",{...input,moments:{...input.moments!,wallShare:.9}},"1",5,1).selectedCode,"A13");
 assert.equal(selectSystem("X",{...input,moments:null},"1",5,1).usedR,null);assert.equal(selectSystem("X",{...input,moments:{...input.moments!,wallShare:.75}},"1",5,1).usedR,null);
 const limited=selectSystem("Y",{enteredR:f(4),declaredCode:f("A31"),traits:f({frameDuctility:"limited",wallDuctility:"none",wallKind:"none",slab:"beam_slab"}),moments:null},"3",7,1);assert.equal(directionalCompatibility(r,limited).status,"fail");
});

test("coupled-wall family requires actual coupling ratio and does not accept a beam label",()=>{
 const input:DirectionSystemInput={...a13,enteredR:f(7),declaredCode:f("A12"),traits:f({frameDuctility:"none",wallDuctility:"high",wallKind:"coupled",slab:"beam_slab"}),moments:{...a13.moments!,coupling:[]}};
 assert.equal(selectSystem("X",input,"1",5,1).usedR,null);
 const withRatio=(omega:number)=>({...input,moments:{...input.moments!,coupling:[{id:"actual pier pair",omega}]}});
 assert.equal(selectSystem("X",withRatio(.32),"1",5,1).usedR,null);assert.notEqual(selectSystem("X",withRatio(1/3),"1",5,1).usedR,null);
});
