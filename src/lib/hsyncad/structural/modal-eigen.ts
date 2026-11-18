import {factorSparseSpd,multiply,type SparseMatrix,type SparseOptions} from "./sparse-spd";
export type Influence={id:string;vector:readonly number[];requiredFraction:number};
export type EigenOptions=SparseOptions&{maxModes:number;initialSubspace?:number;maxIterations?:number;relativeEigenTolerance?:number;maxBasisEntries?:number;lowFrequencyOmega2?:number};
const dot=(a:ArrayLike<number>,b:ArrayLike<number>)=>{let s=0;for(let i=0;i<a.length;i++)s+=a[i]*b[i];return s;};
const norm=(a:ArrayLike<number>)=>Math.sqrt(dot(a,a));
function orthogonalize(v:Float64Array,basis:Float64Array[]){
 for(let pass=0;pass<2;pass++)for(const q of basis){const d=dot(v,q);for(let i=0;i<v.length;i++)v[i]-=d*q[i];}
 const length=norm(v);if(!Number.isFinite(length)||length<1e-13)return null;for(let i=0;i<v.length;i++)v[i]/=length;return v;
}
/** Small projected symmetric eigenproblem only. Not a dense building eigensolver. */
export function projectedJacobi(input:Float64Array,n:number){
 const a=input.slice(),vectors=new Float64Array(n*n);for(let i=0;i<n;i++)vectors[i*n+i]=1;
 const scale=norm(a);if(!Number.isFinite(scale)||!scale)throw Error("Invalid projected operator.");
 for(let sweep=0;sweep<80;sweep++){
  let off=0;for(let p=0;p<n;p++)for(let q=p+1;q<n;q++)off=Math.hypot(off,a[p*n+q]);
  if(off<=1e-13*scale)return Array.from({length:n},(_,i)=>({value:a[i*n+i],vector:Float64Array.from({length:n},(_,r)=>vectors[r*n+i])})).sort((x,y)=>y.value-x.value);
  for(let p=0;p<n;p++)for(let q=p+1;q<n;q++){
   const apq=a[p*n+q];if(Math.abs(apq)<=1e-15*scale)continue;
   const tau=(a[q*n+q]-a[p*n+p])/(2*apq),t=(tau>=0?1:-1)/(Math.abs(tau)+Math.hypot(1,tau)),c=1/Math.hypot(1,t),s=t*c;
   a[p*n+p]-=t*apq;a[q*n+q]+=t*apq;a[p*n+q]=a[q*n+p]=0;
   for(let k=0;k<n;k++)if(k!==p&&k!==q){const kp=a[k*n+p],kq=a[k*n+q];a[k*n+p]=a[p*n+k]=c*kp-s*kq;a[k*n+q]=a[q*n+k]=s*kp+c*kq;}
   for(let k=0;k<n;k++){const kp=vectors[k*n+p],kq=vectors[k*n+q];vectors[k*n+p]=c*kp-s*kq;vectors[k*n+q]=s*kp+c*kq;}
  }
 }
 throw Error("Projected eigenproblem did not converge.");
}
export type ModalMode={number:number;omega2:number;periodSeconds:number;shape:number[];generalizedMass:number;relativeResidual:number;participation:Record<string,{gamma:number;effectiveMass:number;fraction:number}>;zeroParticipation:boolean;diagnostics:string[]};
/** Inverse block subspace iteration on sqrt(M) K^-1 sqrt(M), including exact massless recovery. */
export function solveModalEigen(K:SparseMatrix,mass:readonly number[],influences:readonly Influence[],options:EigenOptions){
 try{
  const {maxModes,initialSubspace=8,maxIterations=160,relativeEigenTolerance=1e-7,maxBasisEntries=4000000,lowFrequencyOmega2=1e-10}=options;
  if(mass.length!==K.n||mass.some(m=>!Number.isFinite(m)||m<0)||!influences.length||new Set(influences.map(i=>i.id)).size!==influences.length||influences.some(i=>!i.id||i.vector.length!==K.n||i.vector.some(v=>!Number.isFinite(v))||!Number.isFinite(i.requiredFraction)||i.requiredFraction<=0||i.requiredFraction>1)
   ||![maxModes,initialSubspace,maxIterations,maxBasisEntries].every(v=>Number.isSafeInteger(v)&&v>0)||maxModes>256||![relativeEigenTolerance,lowFrequencyOmega2].every(v=>Number.isFinite(v)&&v>0))throw Error("Invalid mass, influence, tolerance or modal budget.");
  const dynamic=mass.flatMap((m,i)=>m>0?[i]:[]);if(!dynamic.length)throw Error("No positive dynamic mass.");
  const totals=Object.fromEntries(influences.map(r=>[r.id,mass.reduce((s,m,i)=>s+m*r.vector[i]**2,0)]));if(Object.values(totals).some(m=>!Number.isFinite(m)||m<=0))throw Error("Influence has no finite positive generalized input mass.");
  const factor=factorSparseSpd(K,options);if(factor.status!=="factored")return {status:"solver_error" as const,diagnostic:factor,analysisApproved:false};
  const sqrt=Float64Array.from(dynamic,i=>Math.sqrt(mass[i]));let applications=0,iterations=0,seed=846219;
  const apply=(q:Float64Array)=>{
   if(options.cancelled?.())throw Error("Modal job cancelled.");
   const rhs=new Float64Array(K.n);dynamic.forEach((i,j)=>{rhs[i]=sqrt[j]*q[j];});const s=factor.solve(rhs);applications++;
   if(s.status!=="solved")throw Error(`Inverse operator: ${s.status}: ${s.reason}`);
   return {full:s.x,dynamic:Float64Array.from(dynamic,(i,j)=>sqrt[j]*s.x[i])};
  };
  let q:Float64Array[]=[];const cap=Math.min(maxModes,dynamic.length);let size=Math.min(initialSubspace,cap);
  const grow=()=>{
   if(size*dynamic.length>maxBasisEntries)throw Error("Modal basis storage budget exhausted.");
   for(let attempts=0;q.length<size&&attempts<4*dynamic.length+size;attempts++){
    const v=Float64Array.from(dynamic,()=>{seed=(Math.imul(1664525,seed)+1013904223)>>>0;return seed/4294967296-.5;});
    const candidate=orthogonalize(v,q);if(candidate)q.push(candidate);
   }
   if(q.length!==size)throw Error("Could not initialize independent modal basis.");
  };grow();let lastModes:ModalMode[]=[],coverage:Record<string,number>={};
  while(iterations<maxIterations){
   iterations++;const next:Float64Array[]=[];
   for(const v of q){const candidate=orthogonalize(apply(v).dynamic,next);if(!candidate)throw Error("Inverse subspace lost rank.");next.push(candidate);}q=next;
   const aq=q.map(apply),T=new Float64Array(size*size);
   for(let i=0;i<size;i++)for(let j=i;j<size;j++){const v=dot(q[i],aq[j].dynamic);T[i*size+j]=T[j*size+i]=v;}
   const eig=projectedJacobi(T,size);const modes:ModalMode[]=[];coverage=Object.fromEntries(influences.map(r=>[r.id,0]));
   for(const [modeNumber,pair] of eig.entries()){
    if(!Number.isFinite(pair.value)||pair.value<=0)throw Error("Nonpositive Ritz inverse eigenvalue; no mode discarded.");
    const omega2=1/pair.value,phi=new Float64Array(K.n);
    for(let j=0;j<size;j++)for(let i=0;i<K.n;i++)phi[i]+=aq[j].full[i]*pair.vector[j]*omega2;
    const gm=mass.reduce((s,m,i)=>s+m*phi[i]**2,0);if(!Number.isFinite(gm)||gm<=0)throw Error("Invalid generalized modal mass.");
    let dominant=0;for(let i=1;i<K.n;i++)if(Math.abs(phi[i])>Math.abs(phi[dominant]))dominant=i;
    const normalizer=(phi[dominant]>=0?1:-1)/Math.sqrt(gm);for(let i=0;i<K.n;i++)phi[i]*=normalizer;
    const kphi=multiply(K,phi),mphi=Float64Array.from(mass,(m,i)=>omega2*m*phi[i]),res=Float64Array.from(kphi,(v,i)=>v-mphi[i]);
    const relativeResidual=norm(res)/(norm(kphi)+norm(mphi));
    const participation=Object.fromEntries(influences.map(r=>{const gamma=mass.reduce((s,m,i)=>s+m*phi[i]*r.vector[i],0),effectiveMass=gamma*gamma;return [r.id,{gamma,effectiveMass,fraction:effectiveMass/totals[r.id]}];}));
    const zeroParticipation=Object.values(participation).every(v=>v.fraction<1e-12);
    modes.push({number:modeNumber+1,omega2,periodSeconds:2*Math.PI/Math.sqrt(omega2),shape:[...phi],generalizedMass:1,relativeResidual,participation,zeroParticipation,
     diagnostics:[...(omega2<lowFrequencyOmega2?["low_frequency_omega2_below_declared_threshold"]:[]),...(zeroParticipation?["zero_effective_mass_in_requested_directions"]:[])]});
   }
   let prefix=0;for(const mode of modes){if(!Number.isFinite(mode.relativeResidual)||mode.relativeResidual>relativeEigenTolerance)break;prefix++;for(const r of influences)coverage[r.id]+=mode.participation[r.id].fraction;}
   lastModes=modes;
   const sufficient=influences.every(r=>coverage[r.id]+1e-10>=r.requiredFraction);
   if(sufficient){
    const accepted=modes.slice(0,prefix);let orthogonalityError=0;
    for(let i=0;i<accepted.length;i++)for(let j=0;j<accepted.length;j++)orthogonalityError=Math.max(orthogonalityError,Math.abs(mass.reduce((s,m,k)=>s+m*accepted[i].shape[k]*accepted[j].shape[k],0)-(i===j?1:0)));
    if(orthogonalityError>1e-6)throw Error("Mass orthogonality check failed.");
    return {status:"solved" as const,modes:accepted,coverage,totalInfluenceMass:totals,orthogonalityError,analysisApproved:false,metadata:{method:"inverse-block-subspace-Rayleigh-Ritz-v1",iterations,inverseApplications:applications,subspaceSize:size,massiveDofs:dynamic.length,masslessDofs:K.n-dynamic.length,relativeEigenTolerance,lowFrequencyOmega2,maxModes,minimumScaledPivot:factor.minimumScaledPivot,factorEntries:factor.factorEntries,rawPeriodsClipped:false}};
   }
   if(prefix===size||(size<cap&&prefix>0&&iterations%12===0)){
    if(size===cap)return {status:"insufficient_modes" as const,modes,coverage,totalInfluenceMass:totals,analysisApproved:false,reason:"Converged modal budget does not meet requested effective mass."};
    size=Math.min(cap,Math.max(size+1,size*2));grow();
   }
  }
  return {status:"nonconverged" as const,modes:lastModes,coverage,analysisApproved:false,reason:"Modal iteration budget exhausted; unresolved modes retained as diagnostics."};
 }catch(error){return {status:options.cancelled?.()?"cancelled" as const:"invalid_input" as const,reason:String(error),analysisApproved:false};}
}
