export const GRAVITY_MPS2=9.80665;
export type StandardSpectrum={hazard:"DD-2"|"DD-3";ss:number;s1:number;soil:"ZA"|"ZB"|"ZC"|"ZD"|"ZE";dataSource:string};
export type DirectionReduction={R:number;D:number;I:number};
const short={ZA:[.8,.8,.8,.8,.8,.8],ZB:[.9,.9,.9,.9,.9,.9],ZC:[1.3,1.3,1.2,1.2,1.2,1.2],ZD:[1.6,1.4,1.2,1.1,1,1],ZE:[2.4,1.7,1.3,1.1,.9,.8]};
const long={ZA:[.8,.8,.8,.8,.8,.8],ZB:[.8,.8,.8,.8,.8,.8],ZC:[1.5,1.5,1.5,1.5,1.5,1.4],ZD:[2.4,2.2,2,1.9,1.8,1.7],ZE:[4.2,3.3,2.8,2.4,2.2,2]};
function interpolate(value:number,knots:number[],values:number[]){
 if(value<=knots[0])return values[0];if(value>=knots.at(-1)!)return values.at(-1)!;
 const j=knots.findIndex(x=>x>=value);return values[j-1]+(values[j]-values[j-1])*(value-knots[j-1])/(knots[j]-knots[j-1]);
}
/** TBDY2018 Tables2.1/2.2 and Eqs2.1–2.3; ZF/site-specific input is a separate unsupported profile. */
export function spectrumParameters(input:StandardSpectrum){
 if(!["DD-2","DD-3"].includes(input.hazard)||!Object.hasOwn(short,input.soil)||![input.ss,input.s1].every(v=>Number.isFinite(v)&&v>0)||!input.dataSource.trim())throw Error("Explicit positive hazard coefficients/source and ZA–ZE soil required; ZF cannot use standard tables.");
 const fs=interpolate(input.ss,[.25,.5,.75,1,1.25,1.5],short[input.soil]),f1=interpolate(input.s1,[.1,.2,.3,.4,.5,.6],long[input.soil]),sds=input.ss*fs,sd1=input.s1*f1,TA=.2*sd1/sds,TB=sd1/sds,TL=6;
 if(![sds,sd1,TA,TB].every(Number.isFinite)||TB>=TL)throw Error("Invalid/unsupported spectrum corner periods.");
 return {...input,fs,f1,sds,sd1,TA,TB,TL,sourceClauses:["TBDY2018-2.3.3","2.2","2.3"],damping:.05};
}
export function evaluateSpectrum(input:StandardSpectrum,T:number,reduction:DirectionReduction,orientation:"horizontal"|"vertical"="horizontal"){
 if(!Number.isFinite(T)||T<0||![reduction.R,reduction.D,reduction.I].every(v=>Number.isFinite(v)&&v>=1)||reduction.R/reduction.I<1||!["horizontal","vertical"].includes(orientation))throw Error("Invalid period/directional R,D,I.");
 const s=spectrumParameters(input);let elasticG:number,Ra:number;
 if(orientation==="vertical"){
  if(T>s.TL/2||reduction.R!==1||reduction.D!==1||reduction.I!==1)throw Error("Vertical standard spectrum valid only through TLD=3s with R/I=D=1.");
  const a=s.TA/3,b=s.TB/3;elasticG=T<a?(.32+.48*T/a)*s.sds:T<=b?.8*s.sds:.8*s.sds*b/T;Ra=1;
 }else{
  elasticG=T<s.TA?(.4+.6*T/s.TA)*s.sds:T<=s.TB?s.sds:T<=s.TL?s.sd1/T:s.sd1*s.TL/T**2;
  Ra=T>s.TB?reduction.R/reduction.I:reduction.D+(reduction.R/reduction.I-reduction.D)*T/s.TB;
 }
 const elasticMps2=elasticG*GRAVITY_MPS2,reducedMps2=elasticMps2/Ra,displacementM=reducedMps2*T*T/(4*Math.PI*Math.PI);
 if(![elasticMps2,reducedMps2,displacementM,Ra].every(Number.isFinite))throw Error("Spectrum arithmetic overflow.");
 return {T,elasticG,elasticMps2,Ra,reducedMps2,displacementM,hazard:input.hazard,orientation,sourceClauses:orientation==="horizontal"?["2.2","2.3","4.1","4.8"]:["2.5","2.6","4.4.3.1"]};
}
export function dd3ToDd2Ratio(dd3:StandardSpectrum,dd2:StandardSpectrum,T:number){
 if(dd3.hazard!=="DD-3"||dd2.hazard!=="DD-2"||dd3.soil!==dd2.soil)throw Error("Hazard levels must remain distinct on the same soil profile.");
 const unity={R:1,D:1,I:1};return evaluateSpectrum(dd3,T,unity).elasticMps2/evaluateSpectrum(dd2,T,unity).elasticMps2;
}
export function equivalentBaseShear(totalMassTonnes:number,accelerationMps2:number,sds:number,I:number){
 if(![totalMassTonnes,accelerationMps2,sds,I].every(v=>Number.isFinite(v)&&v>0))throw Error("Invalid equivalent base shear inputs.");
 const result=Math.max(totalMassTonnes*accelerationMps2,.04*totalMassTonnes*I*sds*GRAVITY_MPS2);if(!Number.isFinite(result))throw Error("Equivalent base shear overflow.");return result;
}
export function modalBaseScale(modalShearKn:number,equivalentShearKn:number,irregularity:{A1:boolean;B2:boolean;B3:boolean;decisionSource:string}){
 if(![modalShearKn,equivalentShearKn].every(v=>Number.isFinite(v)&&v>0)||![irregularity.A1,irregularity.B2,irregularity.B3].every(v=>typeof v==="boolean")||!irregularity.decisionSource.trim())throw Error("Positive shears and explicit irregularity decision required.");
 const gamma=(irregularity.A1||irregularity.B2||irregularity.B3)?.9:.8;
 const beta=Math.max(1,gamma*equivalentShearKn/modalShearKn);if(!Number.isFinite(beta))throw Error("Base scale overflow.");return {gamma,beta,modalShearKn,equivalentShearKn,sourceClause:"4.8.4.1",decisionSource:irregularity.decisionSource};
}
