import {assembleSymmetric,solveSparseSpd,type UpperEntry} from "./sparse-spd";
export type V3=readonly[number,number,number];
export type FrameNode={id:string;position:V3;load:readonly[number,number,number,number,number,number];prescribed:readonly[number|null,number|null,number|null,number|null,number|null,number|null];springs:readonly[number,number,number,number,number,number]};
export type FrameElement={id:string;nodes:readonly[string,string];offsets:readonly[V3,V3];up:V3;rollRad:number;
 E:number;G:number;section:{area:number;Iy:number;Iz:number;J:number;shearAreaY:number;shearAreaZ:number};
 modifiers:{axial:number;bendingY:number;bendingZ:number;torsion:number;shearY:number;shearZ:number};
 theory:"euler_bernoulli"|"timoshenko";releases:readonly boolean[];uniformLocal:V3};
export const dot=(a:V3,b:V3)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
export const cross=(a:V3,b:V3):V3=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const length=(v:V3)=>Math.hypot(...v);
const positive=(v:number)=>Number.isFinite(v)&&v>0;
export function localFrame(a:V3,b:V3,up:V3,rollRad:number):{R:V3[];length:number} {
 if([...a,...b,...up,rollRad].some(v=>!Number.isFinite(v)))throw new Error("Nonfinite frame geometry.");
 const d:V3=[b[0]-a[0],b[1]-a[1],b[2]-a[2]],L=length(d);if(L<=1e-10)throw new Error("Zero element length.");
 const x=d.map(v=>v/L) as unknown as V3,projection=dot(up,x),y0=up.map((v,i)=>v-projection*x[i]) as unknown as V3,n=length(y0);
 if(n<=1e-10*Math.max(1,length(up)))throw new Error("Reference axis parallel to element.");
 const y=y0.map(v=>v/n) as unknown as V3,z=cross(x,y),c=Math.cos(rollRad),s=Math.sin(rollRad);
 return {R:[x,y.map((v,i)=>c*v+s*z[i]) as unknown as V3,z.map((v,i)=>c*v-s*y[i]) as unknown as V3],length:L};
}
export function frameLocalStiffness(e:FrameElement,L:number):Float64Array {
 if(!positive(L)||![e.E,e.G,...Object.values(e.section),...Object.values(e.modifiers)].every(positive))throw new Error("Section/moduli/modifiers must be explicitly positive.");
 if(!["euler_bernoulli","timoshenko"].includes(e.theory))throw new Error("Unsupported beam theory.");
 const k=new Float64Array(144),put=(ids:number[],v:number[][])=>ids.forEach((i,a)=>ids.forEach((j,b)=>{k[i*12+j]=v[a][b];}));
 const axial=e.E*e.section.area*e.modifiers.axial/L,torsion=e.G*e.section.J*e.modifiers.torsion/L;
 put([0,6],[[axial,-axial],[-axial,axial]]);put([3,9],[[torsion,-torsion],[-torsion,torsion]]);
 const flex=(EI:number,GA:number,ids:number[],sign:number)=>{
  const phi=e.theory==="timoshenko"?12*EI/(GA*L*L):0;
  const a=12*EI/(L**3*(1+phi)),b=sign*6*EI/(L*L*(1+phi)),c=(4+phi)*EI/(L*(1+phi)),d=(2-phi)*EI/(L*(1+phi));
  put(ids,[[a,b,-a,b],[b,c,-b,d],[-a,-b,a,-b],[b,d,-b,c]]);
 };
 flex(e.E*e.section.Iz*e.modifiers.bendingZ,e.G*e.section.shearAreaY*e.modifiers.shearY,[1,5,7,11],1);
 flex(e.E*e.section.Iy*e.modifiers.bendingY,e.G*e.section.shearAreaZ*e.modifiers.shearZ,[2,4,8,10],-1);
 if(k.some(v=>!Number.isFinite(v)))throw new Error("Element stiffness overflow.");return k;
}
function transform(R:V3[],offsets:readonly[V3,V3]):Float64Array {
 const t=new Float64Array(144);
 for(let end=0;end<2;end++){
  const base=end*6,r=offsets[end],skew=[[0,-r[2],r[1]],[r[2],0,-r[0]],[-r[1],r[0],0]];
  for(let i=0;i<3;i++)for(let j=0;j<3;j++){
   t[(base+i)*12+base+j]=R[i][j];t[(base+3+i)*12+base+3+j]=R[i][j];
   t[(base+i)*12+base+3+j]=-R[i].reduce((sum,v,k)=>sum+v*skew[k][j],0);
  }
 }return t;
}
export const mv=(a:Float64Array,x:ArrayLike<number>,n:number)=>Float64Array.from({length:n},(_,i)=>{let s=0;for(let j=0;j<n;j++)s+=a[i*n+j]*x[j];return s;});
function transVec(t:Float64Array,x:ArrayLike<number>){return Float64Array.from({length:12},(_,i)=>{let s=0;for(let j=0;j<12;j++)s+=t[j*12+i]*x[j];return s;});}
function transK(t:Float64Array,k:Float64Array){
 const kt=new Float64Array(144),out=new Float64Array(144);
 for(let i=0;i<12;i++)for(let j=0;j<12;j++)for(let a=0;a<12;a++)kt[i*12+j]+=k[i*12+a]*t[a*12+j];
 for(let i=0;i<12;i++)for(let j=i;j<12;j++){let v=0;for(let a=0;a<12;a++)v+=t[a*12+i]*kt[a*12+j];out[i*12+j]=v;out[j*12+i]=v;}
 return out;
}
function condense(k:Float64Array,f:Float64Array,releases:readonly boolean[]) {
 if(releases.length!==12||releases.some(v=>typeof v!=="boolean"))throw new Error("Twelve explicit release flags required.");
 const r=releases.flatMap((v,i)=>v?[i]:[]),a=releases.flatMap((v,i)=>v?[]:[i]);
 const solve=(b:number[])=>{
  if(!r.length)return new Float64Array();
  const triplets:UpperEntry[]=[];for(let i=0;i<r.length;i++)for(let j=i;j<r.length;j++)triplets.push([i,j,k[r[i]*12+r[j]]]);
  const result=solveSparseSpd(assembleSymmetric(r.length,triplets),b);
  if(result.status!=="solved")throw new Error(`Release condensation: ${result.reason}`);return result.x;
 };
 const out=k.slice(),load=f.slice();
 if(r.length){
  const c=solve(r.map(i=>f[i]));
  for(const j of a){const x=solve(r.map(i=>k[i*12+j]));for(const i of a)out[i*12+j]=k[i*12+j]-r.reduce((s,index,p)=>s+k[i*12+index]*x[p],0);}
  for(const i of a)load[i]=f[i]-r.reduce((s,index,p)=>s+k[i*12+index]*c[p],0);
  for(const i of r){load[i]=0;for(let j=0;j<12;j++){out[i*12+j]=0;out[j*12+i]=0;}}
 }
 return {k:out,f:load,recover:(u:Float64Array)=>{
  if(r.length){const v=solve(r.map(i=>f[i]-a.reduce((s,j)=>s+k[i*12+j]*u[j],0)));r.forEach((index,p)=>{u[index]=v[p];});}return u;
 }};
}

export function compileFrameElement(e:FrameElement,positions:readonly[V3,V3]) {
 if(e.offsets.length!==2||e.offsets.some(r=>r.length!==3||r.some(v=>!Number.isFinite(v)))||e.uniformLocal.length!==3||e.uniformLocal.some(v=>!Number.isFinite(v)))throw new Error("Invalid offset/distributed load.");
 const a=positions[0].map((v,i)=>v+e.offsets[0][i]) as unknown as V3,b=positions[1].map((v,i)=>v+e.offsets[1][i]) as unknown as V3;
 const frame=localFrame(a,b,e.up,e.rollRad),L=frame.length,k=frameLocalStiffness(e,L),[qx,qy,qz]=e.uniformLocal;
 const f=Float64Array.from([qx*L/2,qy*L/2,qz*L/2,0,-qz*L*L/12,qy*L*L/12,qx*L/2,qy*L/2,qz*L/2,0,qz*L*L/12,-qy*L*L/12]);
 const condensed=condense(k,f,e.releases),t=transform(frame.R,e.offsets),kg=transK(t,condensed.k),fg=transVec(t,condensed.f);
 return {e,k,f,t,condensed,kg,fg,frame};
}
