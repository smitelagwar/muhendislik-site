export function modalCorrelation(periods:readonly number[],damping:number,method:"CQC"|"SRSS"){
 if(!periods.length||periods.some(t=>!Number.isFinite(t)||t<=0)||!Number.isFinite(damping)||damping<=0||damping>=1||!["CQC","SRSS"].includes(method))throw Error("Invalid periods/damping/combination method.");
 const rho=periods.map((t,i)=>periods.map((u,j)=>{
  if(i===j)return 1;const r=Math.min(t,u)/Math.max(t,u);
  if(method==="SRSS"){if(r>=.8)throw Error("SRSS is not admitted for close modes (period ratio >=0.8).");return 0;}
  return 8*damping**2*(1+r)*r**1.5/((1-r*r)**2+4*damping**2*r*(1+r)**2);
 }));return {method,damping,rho,sourceClause:method==="CQC"?"4B.5b":"4B.6"};
}
/** Keep cross-component covariance and raw signed modal vectors; no independent-maxima tuple. */
export function combineModalVectors(vectors:readonly (readonly number[])[],periods:readonly number[],damping:number,method:"CQC"|"SRSS"){
 if(vectors.length!==periods.length||!vectors.length||vectors.length>256||!vectors[0].length||vectors[0].length>24||vectors.some(v=>v.length!==vectors[0].length||v.some(x=>!Number.isFinite(x))))throw Error("Invalid/budget-exceeding local modal vector dimensions.");
 const correlation=modalCorrelation(periods,damping,method),n=vectors[0].length,covariance=Array.from({length:n},()=>new Array<number>(n).fill(0));
 const weighted=vectors.map((_v,i)=>Array.from({length:n},(_,a)=>vectors.reduce((s,v,j)=>s+correlation.rho[i][j]*v[a],0)));
 for(let a=0;a<n;a++)for(let b=a;b<n;b++){
  let value=0;for(let i=0;i<vectors.length;i++)value+=vectors[i][a]*weighted[i][b];
  if(!Number.isFinite(value))throw Error("Nonfinite modal covariance.");covariance[a][b]=covariance[b][a]=value;
 }
 const maxima=covariance.map((row,i)=>{if(row[i]<-1e-10*Math.max(1,...row.map(Math.abs)))throw Error("Negative modal variance.");return Math.sqrt(Math.max(0,row[i]));});
 return {maxima,covariance,correlation,rawModalVectors:vectors.map(v=>[...v]),coincidentPhysicalTuple:false};
}
/** Statistical concomitant estimate, explicitly NOT a demonstrated simultaneous design force tuple. */
export function conditionalModalVector(combined:ReturnType<typeof combineModalVectors>,control:number,sign:1|-1){
 if(!Number.isSafeInteger(control)||control<0||control>=combined.maxima.length||![1,-1].includes(sign))throw Error("Invalid modal control component.");
 const peak=combined.maxima[control];return {values:combined.covariance.map(row=>peak?sign*row[control]/peak:0),control,sign,method:"covariance-conditional-estimate",designInteractionApproved:false};
}
export type ForceTuple=readonly[number,number,number,number,number,number]; // N,M2,M3,V2,V3,T
export type ForceCase={id:string;modelRevision:string;stiffnessSet:string;values:ForceTuple};
export function combineForceCases(id:string,terms:readonly {factor:number;load:ForceCase}[]){
 if(!id||!terms.length||terms.some(t=>!t.load.id||!t.load.modelRevision||!t.load.stiffnessSet||!Number.isFinite(t.factor)||t.load.values.length!==6||t.load.values.some(v=>!Number.isFinite(v)))||terms.some(t=>t.load.modelRevision!==terms[0].load.modelRevision))throw Error("Invalid/stale force combination.");
 // Different stiffness families may only be combined after an explicitly verified transfer, never silently.
 if(new Set(terms.map(t=>t.load.stiffnessSet)).size!==1)throw Error("G/Q and G-prime/Q-prime stiffness families require explicit analysis-set transfer.");
 const values=Array.from({length:6},(_,i)=>terms.reduce((s,t)=>s+t.factor*t.load.values[i],0));if(values.some(v=>!Number.isFinite(v)))throw Error("Force combination overflow.");
 return {id,values:values as unknown as ForceTuple,modelRevision:terms[0].load.modelRevision,stiffnessSet:terms[0].load.stiffnessSet,terms:terms.map(t=>({caseId:t.load.id,factor:t.factor}))};
}
export function orthogonalEarthquakeCases(x:ForceCase,y:ForceCase,z:ForceCase|null){
 return ["X","Y"].flatMap(primary=>([1,-1] as const).flatMap(sx=>([1,-1] as const).flatMap(sy=>{
  const base=[{factor:sx*(primary==="X"?1:.3),load:x},{factor:sy*(primary==="Y"?1:.3),load:y}];
  return z?([1,-1] as const).map(sz=>combineForceCases(`${primary}:${sx}:${sy}:Z${sz}`,[...base,{factor:.3*sz,load:z}])):[combineForceCases(`${primary}:${sx}:${sy}`,base)];
 })));
}
