import {cross,dot,type V3} from "./frame-element";
export type ShellRect={id:string;nodes:readonly[string,string,string,string];E:number;nu:number;thickness:number;shearCorrection:number;drillPenalty:number;
 modifiers:{membrane:number;bending:number;shear:number};pressure:number};
const signs=[[-1,-1],[1,-1],[1,1],[-1,1]];
function shape(xi:number,eta:number,a:number,b:number){return signs.map(([sx,sy])=>({N:(1+sx*xi)*(1+sy*eta)/4,dx:sx*(1+sy*eta)/(2*a),dy:sy*(1+sx*xi)/(2*b)}));}
function shear(xi:number,eta:number,a:number,b:number){
 const s=shape(xi,eta,a,b),bx=new Float64Array(24),by=new Float64Array(24);
 s.forEach((n,i)=>{bx[6*i+2]=n.dx;bx[6*i+4]=n.N;by[6*i+2]=n.dy;by[6*i+3]=-n.N;});return [bx,by];
}
/** Flat rectangular 6DOF shell: Q4 plane stress + MITC4 tying + explicit drilling penalty. */
export function compileShellRect(e:ShellRect,p:readonly[V3,V3,V3,V3]) {
 if(![e.E,e.thickness,e.shearCorrection,e.drillPenalty,...Object.values(e.modifiers)].every(v=>Number.isFinite(v)&&v>0)
  ||!Number.isFinite(e.nu)||e.nu<=-1||e.nu>=.5||!Number.isFinite(e.pressure)||p.some(v=>v.some(x=>!Number.isFinite(x))))throw new Error("Invalid shell properties.");
 const dx=p[1].map((v,i)=>v-p[0][i]) as unknown as V3,dy=p[3].map((v,i)=>v-p[0][i]) as unknown as V3,a=Math.hypot(...dx),b=Math.hypot(...dy);
 if(a<=1e-10||b<=1e-10)throw new Error("Zero shell edge.");
 const x=dx.map(v=>v/a) as unknown as V3,y=dy.map(v=>v/b) as unknown as V3,z=cross(x,y);
 if(Math.abs(dot(x,y))>1e-10||Math.hypot(...p[2].map((v,i)=>v-p[0][i]-dx[i]-dy[i]))>1e-8*Math.max(a,b))throw new Error("Only planar rectangles accepted; no silent projection of warped/distorted quads.");
 const R=[x,y,z],local=new Float64Array(576),G=e.E/(2*(1+e.nu)),mem=e.E*e.thickness*e.modifiers.membrane/(1-e.nu**2),bend=e.E*e.thickness**3*e.modifiers.bending/(12*(1-e.nu**2)),shearK=e.shearCorrection*G*e.thickness*e.modifiers.shear;
 const D=[[1,e.nu,0],[e.nu,1,0],[0,0,(1-e.nu)/2]];
 const ax=shear(0,-1,a,b)[0],cx=shear(0,1,a,b)[0],dyb=shear(-1,0,a,b)[1],byb=shear(1,0,a,b)[1];
 const add=(B:Float64Array[],factor:number,weight:number)=>{
  for(let i=0;i<24;i++)for(let j=0;j<24;j++){let v=0;for(let r=0;r<B.length;r++)for(let s=0;s<B.length;s++)v+=B[r][i]*(B.length===3?D[r][s]:(r===s?1:0))*B[s][j];local[i*24+j]+=v*factor*weight;}
 };
 for(const xi of [-1/Math.sqrt(3),1/Math.sqrt(3)])for(const eta of [-1/Math.sqrt(3),1/Math.sqrt(3)]) {
  const s=shape(xi,eta,a,b),Bm=Array.from({length:3},()=>new Float64Array(24)),Bb=Array.from({length:3},()=>new Float64Array(24));
  s.forEach((n,i)=>{const k=i*6;Bm[0][k]=n.dx;Bm[1][k+1]=n.dy;Bm[2][k]=n.dy;Bm[2][k+1]=n.dx;Bb[0][k+4]=n.dx;Bb[1][k+3]=-n.dy;Bb[2][k+4]=n.dy;Bb[2][k+3]=-n.dx;});
  const Bs=[Float64Array.from(ax,(v,i)=>(1-eta)*v/2+(1+eta)*cx[i]/2),Float64Array.from(dyb,(v,i)=>(1-xi)*v/2+(1+xi)*byb[i]/2)];
  add(Bm,mem,a*b/4);add(Bb,bend,a*b/4);add(Bs,shearK,a*b/4);
 }
 // Hughes-type drilling constraint is a declared element stabilization, not global singularity repair.
 for(const xi of [-1/Math.sqrt(3),1/Math.sqrt(3)])for(const eta of [-1/Math.sqrt(3),1/Math.sqrt(3)]){
  const Bd=new Float64Array(24);
  shape(xi,eta,a,b).forEach((n,i)=>{Bd[6*i]=.5*n.dy;Bd[6*i+1]=-.5*n.dx;Bd[6*i+5]=n.N;});
  for(let i=0;i<24;i++)for(let j=0;j<24;j++)local[i*24+j]+=Bd[i]*Bd[j]*e.drillPenalty*G*e.thickness*e.modifiers.membrane*a*b/4;
 }
 const T=new Float64Array(576);for(let block=0;block<8;block++)for(let i=0;i<3;i++)for(let j=0;j<3;j++)T[(3*block+i)*24+3*block+j]=R[i][j];
 const kt=new Float64Array(576),kg=new Float64Array(576);
 for(let i=0;i<24;i++)for(let j=0;j<24;j++)for(let k=0;k<24;k++)kt[i*24+j]+=local[i*24+k]*T[k*24+j];
 for(let i=0;i<24;i++)for(let j=i;j<24;j++){let value=0;for(let k=0;k<24;k++)value+=T[k*24+i]*kt[k*24+j];kg[i*24+j]=value;kg[j*24+i]=value;}
 const fg=new Float64Array(24);for(let node=0;node<4;node++)for(let k=0;k<3;k++)fg[node*6+k]=e.pressure*a*b*z[k]/4;
 if(kg.some(v=>!Number.isFinite(v))||fg.some(v=>!Number.isFinite(v)))throw new Error("Shell arithmetic overflow.");
 return {local,kg,fg,area:a*b,R,metadata:{type:"flat-rect-MITC4-Q4-explicit-drill",drillPenalty:e.drillPenalty,shearCorrection:e.shearCorrection}};
}
