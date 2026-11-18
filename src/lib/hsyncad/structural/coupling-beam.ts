import {designBeam,type BeamDesignInput} from "./beam-design";
import {placeBeamBars,beamShearTorsion,anchorageLength,beamAnchorage} from "./beam-detailing";
import {beamMaterial,barArea} from "./rc-beam-section";
import {beamSectionForce,validateBeamCase} from "./beam-forces";
import type {V3} from "./frame-element";
import {fact} from "./global-control-types";
export type DiagonalBarPath={id:string;diameter:number;points:readonly[V3,V3,V3,V3]};
export type CouplingBeamInput={id:string;leftWallId:string;rightWallId:string;zMm:number;axisZMm:number;beam:BeamDesignInput;
 leftPier:{widthMm:number;thicknessMm:number;aboveMm:number;belowMm:number;source:string};rightPier:{widthMm:number;thicknessMm:number;aboveMm:number;belowMm:number;source:string};
 diagonal:null|{bundles:readonly[{id:string;bars:DiagonalBarPath[]},{id:string;bars:DiagonalBarPath[]}];tieDiameter:number;tieSpacingMm:number;hookAngle:number;tailMm:number;bendDiameterMm:number;source:string};source:string};
const norm=(p:V3)=>Math.hypot(...p),sub=(a:V3,b:V3)=>a.map((v,i)=>v-b[i]) as unknown as V3,dot=(a:V3,b:V3)=>a.reduce((s,v,i)=>s+v*b[i],0);
function segmentDistance(a:V3,b:V3,c:V3,d:V3){const u=sub(b,a),v=sub(d,c),w=sub(a,c),A=dot(u,u),B=dot(u,v),C=dot(v,v),D=dot(u,w),E=dot(v,w),den=A*C-B*B;let s=den>1e-10?(B*E-C*D)/den:0,t=den>1e-10?(A*E-B*D)/den:E/C;
 for(let i=0;i<3;i++){s=Math.max(0,Math.min(1,(B*t-D)/A));t=Math.max(0,Math.min(1,(B*s+E)/C));}return norm(w.map((x,i)=>x+s*u[i]-t*v[i]) as unknown as V3);}
export function designCouplingBeam(input:CouplingBeamInput){
 try{
  const b=input.beam,g=b.geometry,m=beamMaterial(b.material),L=g.spanMm,h=g.h;if(!input.id||input.id!==b.id||!input.leftWallId||!input.rightWallId||input.leftWallId===input.rightWallId||!input.source?.trim()||b.role!=="coupling_beam"||!Number.isFinite(input.zMm)||!Number.isFinite(input.axisZMm)||!b.ultimate.length||!b.existing||b.mode!=="existing_reinforcement")throw Error("Gerçek bağ kirişi, iki perde, mevcut donatı ve kot gerekli.");
  if(fact(b.qualityReviewed,"bağ kirişi malzeme incelemesi")!==true||fact(b.loadCoverage,"bağ kirişi yük kapsamı")!=="all_required_combinations_reviewed"||b.material.fck<25||b.material.reinforcementClass==="S420"||b.splices.length||g.flange)throw Error("Bağ kirişi malzeme/yük/ek/tabla profili doğrulanmadı.");
  if(![g.bw,g.h,g.spanMm,g.cover,g.aggregate,g.slabThickness].every(v=>Number.isFinite(v)&&v>0)||typeof g.outside!=="boolean"||g.bw<250||g.h<Math.max(300,3*g.slabThickness)||g.h>3.5*g.bw||g.cover<(g.outside?25:20))throw Error("Bağ kirişi genel geometri/örtü profili doğrulanmadı.");
  for(const c of b.ultimate)validateBeamCase(c);const first=b.ultimate[0];if(b.ultimate.some(c=>c.analysisStamp!==first.analysisStamp||c.modelRevision!==first.modelRevision||c.stiffnessSet!==first.stiffnessSet||c.lengthMm!==L))throw Error("Bağ kirişi snapshot/uzunluk karışmış.");
  const placed=placeBeamBars({bw:g.bw,h:g.h,bf:g.bw,hf:0},b.existing,g.cover,g.aggregate),d=g.h-Math.max(...placed.bars.filter(b=>b.face==="top").map(b=>b.y)),forces=b.ultimate.flatMap(c=>[beamSectionForce(c,0),beamSectionForce(c,L)]),Vd=Math.max(...forces.map(f=>Math.abs(f.Vkn))),needDiagonal=L<=2*h&&Vd>1.5*g.bw*d*m.fctd/1000,upper=.85*g.bw*d*Math.sqrt(m.fck)/1000;
  if(d<=0||Vd>upper)return {status:"failed" as const,id:input.id,reason:"Bağ kirişi kesme üst sınırı",VdKn:Vd,limitKn:upper,engineeringAcceptance:false};
  if(!needDiagonal){if(!b.seismic)throw Error("Normal bağ kirişi dalı için gerçek düşey/deprem bileşenleri ve D gerekli.");
   const result=designBeam({...b,role:"beam"}),anchors=placed.bars.every(bar=>(["left","right"] as const).every(side=>{const a=b.anchors[side],pier=side==="left"?input.leftPier:input.rightPier;return a.kind==="straight"&&a.availableMm<=pier.widthMm-g.cover&&Math.abs(bar.x)+bar.diameter/2<=pier.thicknessMm/2-g.cover&&h/2-bar.y+bar.diameter/2<=pier.aboveMm-g.cover&&h/2-bar.y-bar.diameter/2>=-pier.belowMm+g.cover;}));return {id:input.id,status:result.status==="design_ready"?(anchors?"coupling_ready" as const:"failed" as const):result.status,branch:"ordinary_7_20" as const,ordinary:result,physicalAnchorsFit:anchors,VdKn:Vd,limitKn:upper,nominalEndCapacityKnm:result.status==="design_ready"&&result.selected&&"capacities" in result.selected?Math.max(result.selected.capacities.positive.capacityKnm,result.selected.capacities.negative.capacityKnm):null,analysisStamp:first.analysisStamp,engineeringAcceptance:false};}
  const diag=input.diagonal;if(!diag||!diag.source?.trim())return {id:input.id,status:"incomplete" as const,branch:"diagonal_required" as const,reason:"İki 7.20 koşulu da sağlanmıyor; gerçek çapraz demet yolları gerekli.",engineeringAcceptance:false};
  if(forces.some(f=>Math.abs(f.NcompressionKn)>1e-7||Math.abs(f.Tknm)>1e-7||Math.abs(f.VweakKn)>1e-7||Math.abs(f.MweakKnm)>1e-7)||b.ultimate.some(c=>c.uniformKnM.some(v=>Math.abs(v)>1e-10)||Math.abs(beamSectionForce(c,0).Mknm+beamSectionForce(c,L).Mknm)>1e-7))return {id:input.id,status:"requires_engineering" as const,reason:"Çapraz demet profili saf antisismetrik M-V içindir; düşey yayılı yük/eksenel/ortalama moment için ek kordon/strut-tie hesabı gerekli.",engineeringAcceptance:false};
  const all=diag.bundles.flatMap(d=>d.bars);if(diag.bundles[0].id===diag.bundles[1].id||new Set(all.map(b=>b.id)).size!==all.length||diag.bundles.some(b=>b.bars.length<4||b.bars.length>16))throw Error("İki tekil gerçek demette en az dört fiziksel bar gerekli.");
  const checks:{id:string;passed:boolean;observed:unknown;limit:unknown}[]=[],add=(id:string,passed:boolean,observed:unknown,limit:unknown)=>checks.push({id,passed,observed,limit});
  const bundles=diag.bundles.map((bundle,k)=>{let shear=0;const angles:number[]=[],envelope:{y:number;n:number}[]=[];
   for(const bar of bundle.bars){const p=bar.points;if(!bar.id||!Number.isFinite(bar.diameter)||bar.diameter<12||p.some(p=>p.length!==3||p.some(v=>!Number.isFinite(v)))||Math.abs(p[1][0])>1e-7||Math.abs(p[2][0]-L)>1e-7)throw Error("Gerçek ankraj/kolon yüzü noktalarıyla dört noktalı çapraz bar yolu gerekli.");
    const v=sub(p[2],p[1]),len=norm(v),unit=v.map(x=>x/len) as unknown as V3,gamma=Math.atan2(Math.abs(v[2]),L);if(Math.abs(v[1])>1e-7||v[2]*(k===0?1:-1)<=0)throw Error("Çapraz demetlerin fiziksel eğimleri karşıt olmalı.");
    const embedLeft=dot(sub(p[1],p[0]),unit),embedRight=dot(sub(p[3],p[2]),unit),lb=anchorageLength(bar.diameter,b.material,"I",g.cover,g.aggregate*4/3).lb;
    const collinear=(a:V3,q:V3)=>norm(a.map((x,i)=>x-dot(a,q)*q[i]) as unknown as V3)<1e-6;
    if(!collinear(sub(p[1],p[0]),unit)||!collinear(sub(p[3],p[2]),unit))throw Error("Ankraj uzantısı fiziksel çapraz barla doğrusal olmalı.");
    const pierFit=(q:V3,left:boolean)=>{const pier=left?input.leftPier:input.rightPier;return pier.source?.trim()&&[pier.widthMm,pier.thicknessMm,pier.aboveMm,pier.belowMm].every(v=>Number.isFinite(v)&&v>0)&&q[0]>=(left?-pier.widthMm:L)+g.cover+bar.diameter/2&&q[0]<=(left?0:L+pier.widthMm)-g.cover-bar.diameter/2&&Math.abs(q[1])<=pier.thicknessMm/2-g.cover-bar.diameter/2&&q[2]>=-pier.belowMm+g.cover+bar.diameter/2&&q[2]<=pier.aboveMm-g.cover-bar.diameter/2;};
    const clearFit=p.slice(1,3).every(q=>Math.abs(q[1])<=g.bw/2-g.cover-diag.tieDiameter-bar.diameter/2&&Math.abs(q[2])<=h/2-g.cover-diag.tieDiameter-bar.diameter/2);
    add(`diagonal_path:${bar.id}`,embedLeft>=1.5*lb&&embedRight>=1.5*lb&&!!pierFit(p[0],true)&&!!pierFit(p[3],false)&&clearFit,{embedLeft,embedRight,lb},1.5*lb);angles.push(gamma);shear+=barArea(bar.diameter)*m.fyd*Math.sin(gamma)/1000;envelope.push({y:p[1][1],n:Math.cos(gamma)*p[1][2]});
   }
   if(Math.max(...angles)-Math.min(...angles)>1e-7)throw Error("Tek demette paralel gerçek bar yolları gerekli.");
   const y0=Math.min(...envelope.map(p=>p.y)),y1=Math.max(...envelope.map(p=>p.y)),n0=Math.min(...envelope.map(p=>p.n)),n1=Math.max(...envelope.map(p=>p.n));
   // Bu profil dört köşe barlı bağımsız demet kafesini çözer; ara kol beyanı kabul edilmez.
   add(`bundle_cage:${bundle.id}`,bundle.bars.length===4&&envelope.every(p=>(Math.abs(p.y-y0)<1e-6||Math.abs(p.y-y1)<1e-6)&&(Math.abs(p.n-n0)<1e-6||Math.abs(p.n-n1)<1e-6))&&y1>y0&&n1>n0&&Math.max(y1-y0,n1-n0)<=25*diag.tieDiameter,{y0,y1,n0,n1},25*diag.tieDiameter);
   return {id:bundle.id,shearContributionKn:shear,gammaRad:angles[0],barIds:bundle.bars.map(b=>b.id)};});
  const minPhi=Math.min(...all.map(b=>b.diameter)),Vr=2*Math.min(...bundles.map(b=>b.shearContributionKn));add("diagonal_shear",Vd<=Vr,{Vd,Vr},Vr);
  add("diagonal_ties",diag.tieDiameter>=8&&diag.tieSpacingMm>0&&diag.tieSpacingMm<=Math.min(8*minPhi,100)&&diag.hookAngle===135&&diag.tailMm>=Math.max(80,6*diag.tieDiameter)&&diag.bendDiameterMm>=5*diag.tieDiameter,diag,null);
  for(let i=0;i<all.length;i++)for(let j=0;j<i;j++){const distance=segmentDistance(all[i].points[0],all[i].points[3],all[j].points[0],all[j].points[3])-(all[i].diameter+all[j].diameter)/2;add(`bar_clear:${all[i].id}:${all[j].id}`,distance>=Math.max(20,all[i].diameter,all[j].diameter,4*g.aggregate/3),distance,null);}
  for(const bar of placed.bars){const left=b.anchors.left,right=b.anchors.right;if(left.kind!=="straight"||right.kind!=="straight")throw Error("Çapraz profilde ek normal barların gerçek düz ankraj yolu gerekli; kancalı ek yollar özel model ister.");
   const p:V3=[-left.availableMm,bar.x,h/2-bar.y],q:V3=[L+right.availableMm,bar.x,h/2-bar.y],anchorPassed=beamAnchorage(left,bar.diameter,b.material,"I",false,false).passed&&beamAnchorage(right,bar.diameter,b.material,"I",false,false).passed;
   const fits=left.availableMm<=input.leftPier.widthMm-g.cover&&right.availableMm<=input.rightPier.widthMm-g.cover&&Math.abs(bar.x)+bar.diameter/2<=Math.min(input.leftPier.thicknessMm,input.rightPier.thicknessMm)/2-g.cover&&Math.abs(p[2])+bar.diameter/2<=Math.min(input.leftPier.aboveMm,input.leftPier.belowMm,input.rightPier.aboveMm,input.rightPier.belowMm)-g.cover;
   add(`normal_anchor:${bar.id}`,anchorPassed&&fits,{p,q},null);
   for(const diagonal of all){const clear=segmentDistance(p,q,diagonal.points[0],diagonal.points[3])-(bar.diameter+diagonal.diameter)/2;add(`normal_diagonal_clear:${bar.id}:${diagonal.id}`,clear+1e-7>=Math.max(20,bar.diameter,diagonal.diameter,4*g.aggregate/3),clear,null);}
  }
  const topArea=placed.bars.filter(b=>b.face==="top").reduce((s,b)=>s+barArea(b.diameter),0),bottomArea=placed.bars.filter(b=>b.face==="bottom").reduce((s,b)=>s+barArea(b.diameter),0),minimum=.8*m.fctd/m.fyd*g.bw*d;
  const ordinaryMinimum=beamShearTorsion({section:{bw:g.bw,h,bf:g.bw,hf:0},material:b.material,d,NcompressionKn:0,Tknm:0,Vkn:0,cover:g.cover,highDuctility:true,layout:b.existing,zeroConcrete:true});
  add("additional_ts500_minimum",topArea>=minimum&&bottomArea>=minimum&&ordinaryMinimum.passed,{topArea,bottomArea,minimum,ordinaryMinimum},null);
  add("deep_web_minimum",b.existing.sideDiameter>=12&&g.h/(b.existing.sideEach+1)<=150&&2*b.existing.sideEach*barArea(b.existing.sideDiameter)>=.3*Math.max(topArea,bottomArea),b.existing,null);
  return {id:input.id,status:checks.every(c=>c.passed)?"coupling_ready" as const:"failed" as const,branch:"diagonal_7_21" as const,checks,bundles,VdKn:Vd,capacityShearKn:Vr,limitKn:upper,nominalEndCapacityKnm:Vr*L/2000,analysisStamp:first.analysisStamp,modelRevision:first.modelRevision,stiffnessSet:first.stiffnessSet,engineeringAcceptance:false,finalFabricationQuantityApproved:false};
 }catch(error){return {id:input.id,status:"invalid_input" as const,reason:String(error),engineeringAcceptance:false};}
}
