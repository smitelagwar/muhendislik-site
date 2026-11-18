import test from "node:test";
import assert from "node:assert/strict";
import {spectrumParameters,evaluateSpectrum,modalBaseScale,equivalentBaseShear,dd3ToDd2Ratio,GRAVITY_MPS2,type StandardSpectrum} from "../../src/lib/hsyncad/structural/design-spectrum";
import {modalCorrelation,combineModalVectors,conditionalModalVector,orthogonalEarthquakeCases,combineForceCases,type ForceCase} from "../../src/lib/hsyncad/structural/modal-combination";
const close=(a:number,b:number)=>assert.ok(Math.abs(a-b)<1e-9+1e-6*Math.abs(b),`${a} != ${b}`);
const spectrum:StandardSpectrum={hazard:"DD-2",ss:.625,s1:.25,soil:"ZD",dataSource:"explicit synthetic hazard coefficients; not a map query"};
test("soil coefficients interpolate table brackets and keep hazard levels independent",()=>{
 const s=spectrumParameters(spectrum);close(s.fs,1.3);close(s.f1,2.1);close(s.sds,.625*1.3);close(s.sd1,.25*2.1);
 const low=spectrumParameters({...spectrum,ss:.1,s1:.01}),high=spectrumParameters({...spectrum,ss:2,s1:.8});close(low.fs,1.6);close(high.f1,1.7);
 assert.throws(()=>spectrumParameters({...spectrum,soil:"ZF" as never}));assert.throws(()=>spectrumParameters({...spectrum,dataSource:""}));
 close(dd3ToDd2Ratio({...spectrum,hazard:"DD-3",ss:spectrum.ss/2,s1:spectrum.s1/2},spectrum,.01),evaluateSpectrum({...spectrum,hazard:"DD-3",ss:spectrum.ss/2,s1:spectrum.s1/2},.01,{R:1,D:1,I:1}).elasticG/evaluateSpectrum(spectrum,.01,{R:1,D:1,I:1}).elasticG);
});
test("horizontal spectrum all branches, continuity, acceleration conversion and reduction",()=>{
 const s=spectrumParameters(spectrum),red={R:7,D:2.5,I:1};
 close(evaluateSpectrum(spectrum,0,red).elasticG,.4*s.sds);close(evaluateSpectrum(spectrum,s.TA,red).elasticG,s.sds);close(evaluateSpectrum(spectrum,s.TB,red).elasticG,s.sds);
 const long=evaluateSpectrum(spectrum,2,red);close(long.elasticG,s.sd1/2);close(long.Ra,7);close(long.reducedMps2,s.sd1/2*GRAVITY_MPS2/7);close(evaluateSpectrum(spectrum,12,red).elasticG,s.sd1*6/144);
 const short=evaluateSpectrum(spectrum,s.TB/2,red);close(short.Ra,2.5+(7-2.5)/2);close(short.displacementM,short.reducedMps2*(s.TB/2)**2/(4*Math.PI*Math.PI));
});
test("vertical spectrum is distinct, unreduced and rejects its undefined long-period tail",()=>{
 const s=spectrumParameters(spectrum),red={R:1,D:1,I:1};close(evaluateSpectrum(spectrum,0,red,"vertical").elasticG,.32*s.sds);close(evaluateSpectrum(spectrum,s.TB/3,red,"vertical").elasticG,.8*s.sds);
 assert.throws(()=>evaluateSpectrum(spectrum,3.1,red,"vertical"));assert.throws(()=>evaluateSpectrum(spectrum,.1,{R:7,D:2.5,I:1},"vertical"));
});
test("CQC equals coherent sum at repeated periods, retains signed cancellation and covariance",()=>{
 const r=combineModalVectors([[2,3],[4,-1]],[1,1],.05,"CQC");close(r.maxima[0],6);close(r.maxima[1],2);close(r.covariance[0][1],12);close(conditionalModalVector(r,0,1).values[1],2);assert.equal(r.coincidentPhysicalTuple,false);
 close(modalCorrelation([1,1.000001],.05,"CQC").rho[0][1],1);close(combineModalVectors([[2],[-2]],[1,1],.05,"CQC").maxima[0],0);assert.throws(()=>modalCorrelation([1,1.1],.05,"SRSS"));
 close(combineModalVectors([[3],[4]],[1,2],.05,"SRSS").maxima[0],5);
});
test("base shear scale applies irregularity gamma and never downscales; minimum shear is physical",()=>{
 const regular={A1:false,B2:false,B3:false,decisionSource:"explicit test decision"};close(modalBaseScale(40,100,regular).beta,2);close(modalBaseScale(40,100,{...regular,B2:true}).beta,2.25);close(modalBaseScale(100,40,regular).beta,1);
 close(equivalentBaseShear(100,.001,1,1),.04*100*GRAVITY_MPS2);assert.throws(()=>modalBaseScale(0,100,regular));
});
test("direction sign cases derive from active loads and preserve a full correlated force tuple",()=>{
 const x:ForceCase={id:"X",modelRevision:"r1",stiffnessSet:"seismic",values:[1,2,3,4,5,6]},y={...x,id:"Y",values:[6,5,4,3,2,1] as const},z={...x,id:"Z"};
 const cases=orthogonalEarthquakeCases(x,y,null);assert.equal(cases.length,8);close(cases[0].values[0],1+.3*6);close(cases[0].values[5],6+.3);
 assert.equal(orthogonalEarthquakeCases(x,y,z).length,16);assert.throws(()=>combineForceCases("bad",[{factor:1,load:x},{factor:1,load:{...y,stiffnessSet:"G-prime"}}]));assert.throws(()=>combineForceCases("stale",[{factor:1,load:x},{factor:1,load:{...y,modelRevision:"r2"}}]));
});
