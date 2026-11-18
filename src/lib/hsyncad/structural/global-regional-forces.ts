import type {ModalStructureInput} from "./modal-structure";
import type {RawSpectrum} from "./global-demand";

/** Component bounds from two independent modal cases are not simultaneous design tuples. */
export function regionalModalForces(input:ModalStructureInput,upper:RawSpectrum,lower:RawSpectrum|null,baseM:number,Dupper:number,upperFactor:number){
 if(!Number.isFinite(baseM)||![Dupper,upperFactor].every(v=>Number.isFinite(v)&&v>=1))throw Error("Invalid regional force coefficients.");
 for(const r of [upper,...(lower?[lower]:[])])if(r.metadata.purpose!=="raw_modal"||r.metadata.localEnvelopesScale!==1||r.direction.id!==upper.direction.id)throw Error("Matching raw regional modal cases required.");
 const nodes=new Map(input.nodes.map(n=>[n.id,n])),unresolved:string[]=[];
 const region=(id:string,ids:readonly string[])=>{
  if(!lower)return "upper" as const;
  const z=ids.map(n=>{const node=nodes.get(n);if(!node)throw Error("Unknown regional element node.");return node.position[2];});
  const above=z.some(v=>v>baseM+1e-8),below=z.some(v=>v<baseM-1e-8);
  if(above&&below||!above&&!below){unresolved.push(id);return "unresolved" as const;}
  return above?"upper" as const:"basement" as const;
 };
 const packet=(id:string,ids:readonly string[],a:RawSpectrum["shells"][number]["globalNodalForces"],b:typeof a|null)=>{
  const part=region(id,ids),factors=part==="upper"?{ductile:[upperFactor,0],nonductile:[Dupper*upperFactor,0]}:part==="basement"?{ductile:[1,1],nonductile:[.6*Dupper,1.5]}:null;
  if(b&&b.maxima.length!==a.maxima.length)throw Error("Mismatched regional result dimensions.");
  const bound=(f:number[])=>a.maxima.map((v,i)=>f[0]*v+f[1]*(b?.maxima[i]??0));
  return {id,part,factors,ductileComponentBounds:factors?bound(factors.ductile):null,nonductileComponentBounds:factors?bound(factors.nonductile):null,
   upperRaw:a,lowerRaw:b,coincidentPhysicalTuple:false,combination:"conservative sum of absolute modal component bounds",sourceClause:part==="upper"?"4.10.1.1/2":"4.10.1.4/5"};
 };
 const frames=input.frames.map(e=>{const a=upper.members.find(r=>r.id===e.id),b=lower?.members.find(r=>r.id===e.id);if(!a||lower&&!b)throw Error("Missing regional frame force result.");return packet(e.id,e.nodes,a.localEndForces,b?.localEndForces??null);});
 const shells=input.shells.map(e=>{const a=upper.shells.find(r=>r.id===e.id),b=lower?.shells.find(r=>r.id===e.id);if(!a||lower&&!b)throw Error("Missing regional shell force result.");return packet(e.id,e.nodes,a.globalNodalForces,b?.globalNodalForces??null);});
 return {frames,shells,unresolved,lowerReduction:lower?{R:2.5,I:1,D:1.5}:null,upperBetaAppliedToBasement:false,memberCapacityApproved:false};
}
