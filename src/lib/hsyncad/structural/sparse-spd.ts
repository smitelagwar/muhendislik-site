/** Numerical SPD kernel. No stiffness jitter, pivot replacement, or successful fallback. */
export type UpperEntry = readonly [number, number, number];
export type SparseMatrix = { n:number; rows:ReadonlyMap<number,number>[]; nonzeros:number };
export type LinearResult = {
  status:"solved"; x:Float64Array; residualNorm:number; relativeResidual:number; minimumScaledPivot:number;
  inputNonzeros:number; factorEntries:number; peakWorkingEntries:number; algorithm:"scaled-sparse-LDLT-v1"; iterations:0;
} | {status:"invalid_input"|"not_positive_definite"|"resource_limit"|"residual_failed"|"cancelled";reason:string};

/** Upper entries only: inserting a complete symmetric matrix twice is rejected. */
export function assembleSymmetric(n:number,entries:Iterable<UpperEntry>):SparseMatrix {
  if(!Number.isSafeInteger(n)||n<=0||n>200000)throw new Error("Invalid matrix dimension.");
  const ordered=[...entries].sort((a,b)=>a[0]-b[0]||a[1]-b[1]||a[2]-b[2]);
  const rows=Array.from({length:n},()=>new Map<number,number>());
  for(const [i,j,v] of ordered) {
    if(!Number.isSafeInteger(i)||!Number.isSafeInteger(j)||i<0||j<i||j>=n||!Number.isFinite(v))throw new Error("Expected finite upper-triangle triplet.");
    const sum=(rows[i].get(j)??0)+v;if(!Number.isFinite(sum))throw new Error("Assembly overflow.");
    rows[i].set(j,sum);if(i!==j)rows[j].set(i,sum);
  }
  for(const row of rows)for(const [j,v] of row)if(v===0)row.delete(j);
  return {n,rows,nonzeros:rows.reduce((s,r)=>s+r.size,0)};
}
export function multiply(a:SparseMatrix,x:ArrayLike<number>):Float64Array {
  if(x.length!==a.n)throw new Error("Vector dimension mismatch.");
  return Float64Array.from(a.rows,row=>{let value=0;for(const [j,k] of row)value+=k*x[j];return value;});
}
const norm=(x:ArrayLike<number>)=>{let result=0;for(let i=0;i<x.length;i++)result=Math.hypot(result,x[i]);return result;};

export type SparseOptions={pivotTolerance?:number;relativeTolerance?:number;absoluteTolerance?:number;maxFactorEntries?:number;cancelled?:()=>boolean};
export function factorSparseSpd(a:SparseMatrix,options:SparseOptions={}) {
  const {pivotTolerance=1e-12,relativeTolerance=1e-8,absoluteTolerance=1e-10,maxFactorEntries=2000000}=options;
  if(!Number.isSafeInteger(a.n)||a.n<=0||a.rows.length!==a.n||![pivotTolerance,relativeTolerance,absoluteTolerance].every(v=>Number.isFinite(v)&&v>0)
    ||!Number.isSafeInteger(maxFactorEntries)||maxFactorEntries<=0)return {status:"invalid_input" as const,reason:"Invalid dimensions, tolerance or budget."};
  const scale=new Float64Array(a.n),d=new Float64Array(a.n),lCol=Array.from({length:a.n},()=>new Array<[number,number]>());
  for(let i=0;i<a.n;i++) {
    const diag=a.rows[i].get(i)??0;
    if(!Number.isFinite(diag)||diag<=0)return {status:"not_positive_definite" as const,reason:`Nonpositive diagonal at DOF ${i}.`};
    scale[i]=Math.sqrt(diag);
    for(const [j,v] of a.rows[i])if(!Number.isSafeInteger(j)||j<0||j>=a.n||!Number.isFinite(v)||a.rows[j].get(i)!==v)return {status:"invalid_input" as const,reason:"Matrix must be finite and symmetric."};
  }
  let workingEntries=a.rows.reduce((s,r)=>s+r.size,0),peakWorkingEntries=workingEntries;
  if(workingEntries>2*maxFactorEntries)return {status:"resource_limit" as const,reason:"Input storage exceeds declared working budget."};
  const work=a.rows.map((r,i)=>new Map([...r].map(([j,v])=>[j,(v/scale[i])/scale[j]])));
  const eliminated=new Uint8Array(a.n),order=new Int32Array(a.n),curDeg=new Int32Array(a.n);
  const buckets=new Map<number,Set<number>>();
  let minDeg=a.n;
  for(let i=0;i<a.n;i++){
    const deg=work[i].size;curDeg[i]=deg;if(deg<minDeg)minDeg=deg;
    let b=buckets.get(deg);if(!b){b=new Set();buckets.set(deg,b);}b.add(i);
  }
  const updateDeg=(i:number)=>{
    const oldDeg=curDeg[i],newDeg=work[i].size;
    if(oldDeg===newDeg)return;
    buckets.get(oldDeg)?.delete(i);
    curDeg[i]=newDeg;
    let b=buckets.get(newDeg);if(!b){b=new Set();buckets.set(newDeg,b);}b.add(i);
    if(newDeg<minDeg)minDeg=newDeg;
  };
  let entries=0,minimumScaledPivot=Infinity;
  for(let step=0;step<a.n;step++) {
    if(options.cancelled?.())return {status:"cancelled" as const,reason:"Caller cancelled factorization."};
    while(minDeg<=a.n){const b=buckets.get(minDeg);if(b&&b.size>0)break;minDeg++;}
    const k=buckets.get(minDeg)!.values().next().value as number;
    buckets.get(minDeg)!.delete(k);eliminated[k]=1;order[step]=k;
    const pivot=work[k].get(k)??0;
    if(!Number.isFinite(pivot)||pivot<=pivotTolerance)return {status:"not_positive_definite" as const,reason:`Scaled pivot ${k}=${pivot}; mechanism, indefinite or ill-conditioned system. No regularization applied.`};
    d[k]=pivot;minimumScaledPivot=Math.min(minimumScaledPivot,pivot);
    const adjacent=[...work[k].keys()].filter(j=>j!==k&&!eliminated[j]);
    entries+=adjacent.length+1;
    if(entries>maxFactorEntries)return {status:"resource_limit" as const,reason:"Sparse factor fill budget exhausted."};
    const coefficients=Float64Array.from(adjacent,i=>work[i].get(k)!/pivot);
    const colEntries:[number,number][]=new Array(adjacent.length);
    for(let p=0;p<adjacent.length;p++)colEntries[p]=[adjacent[p],coefficients[p]];
    lCol[k]=colEntries;
    for(let p=0;p<adjacent.length;p++)for(let q=p;q<adjacent.length;q++) {
      const i=adjacent[p],j=adjacent[q],next=(work[i].get(j)??0)-coefficients[p]*pivot*coefficients[q];
      if(!Number.isFinite(next))return {status:"invalid_input" as const,reason:"Factor arithmetic overflow."};
      const existed=work[i].has(j),cost=i===j?1:2;
      if(next===0){if(existed)workingEntries-=cost;work[i].delete(j);if(i!==j)work[j].delete(i);}else{
        if(!existed){workingEntries+=cost;peakWorkingEntries=Math.max(peakWorkingEntries,workingEntries);}
        if(workingEntries>2*maxFactorEntries)return {status:"resource_limit" as const,reason:"Working sparse fill budget exhausted."};
        work[i].set(j,next);if(i!==j)work[j].set(i,next);
      }
    }
    for(const i of adjacent){work[i].delete(k);updateDeg(i);}
    workingEntries-=work[k].size+adjacent.length;
    work[k].clear();
  }
  const solve=(b:ArrayLike<number>):LinearResult=>{
  if(b.length!==a.n||Array.from(b).some(v=>!Number.isFinite(v)))return {status:"invalid_input",reason:"Invalid RHS."};
  if(options.cancelled?.())return {status:"cancelled",reason:"Caller cancelled solve."};
  const y=Float64Array.from(b,(v,i)=>v/scale[i]);
  for(let step=0;step<a.n;step++){const k=order[step],yk=y[k];for(const [i,v] of lCol[k])y[i]-=v*yk;}
  for(let i=0;i<a.n;i++)y[i]/=d[i];
  for(let step=a.n-1;step>=0;step--){const k=order[step];let yk=y[k];for(const [i,v] of lCol[k])yk-=v*y[i];y[k]=yk;}
  const x=Float64Array.from(y,(v,i)=>v/scale[i]);
  if(x.some(v=>!Number.isFinite(v)))return {status:"invalid_input",reason:"Nonfinite displacement."};
  const residual=multiply(a,x);for(let i=0;i<a.n;i++)residual[i]-=b[i];
  const residualNorm=norm(residual),rhsNorm=norm(b);
  if(!Number.isFinite(residualNorm)||residualNorm>absoluteTolerance+relativeTolerance*rhsNorm)return {status:"residual_failed",reason:`Residual ${residualNorm} exceeds declared tolerance.`};
  return {status:"solved",x,residualNorm,relativeResidual:rhsNorm?residualNorm/rhsNorm:0,minimumScaledPivot,inputNonzeros:a.nonzeros,factorEntries:entries,peakWorkingEntries,algorithm:"scaled-sparse-LDLT-v1",iterations:0};
  };
  return {status:"factored" as const,solve,minimumScaledPivot,inputNonzeros:a.nonzeros,factorEntries:entries,peakWorkingEntries};
}
export function solveSparseSpd(a:SparseMatrix,b:ArrayLike<number>,options:SparseOptions={}):LinearResult {
 if(b.length!==a.n||Array.from(b).some(v=>!Number.isFinite(v)))return {status:"invalid_input",reason:"Invalid RHS."};
 const factor=factorSparseSpd(a,options);return factor.status==="factored"?factor.solve(b):factor;
}
