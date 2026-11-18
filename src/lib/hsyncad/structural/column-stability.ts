import {columnBarGeometry,type ColumnShape,type ColumnBar} from "./rc-column-section";
import {beamMaterial,type BeamMaterial} from "./rc-beam-section";
import {beamSectionForce,validateBeamCase,type BeamCase} from "./beam-forces";
import {fact,type Fact} from "./global-control-types";
export type EffectiveLength={method:"verified_k";k:Fact<number>}|{method:"joint_ratios";alphaBottom:Fact<number>;alphaTop:Fact<number>;oneEndHinged:boolean}|{method:"nonsway_default";source:string};
export type FrameStabilityEvidence={source:string;elasticState:"uncracked";loadCombination:"G+Q+E"|"G+1.3Q+1.3W";analysisStamp:string;coverage:Fact<"all_storey_columns">;driftMm:number;shearKn:number;characteristicMembers:{id:string;Nkn:number;lengthMm:number}[];ultimateMembers:{id:string;Nkn:number;criticalLoadKn:number}[];permanentShearKn:number;totalShearKn:number};
export type ColumnStabilityInput={memberId:string;axes:readonly[EffectiveLength,EffectiveLength];frame:readonly[FrameStabilityEvidence,FrameStabilityEvidence];permanentNkn:number;stiffnessMethod:"TS500_7_20"|"TS500_7_21";providedDesignBounds:null|{analysisStamp:string;axis1Knm:number;axis2Knm:number};source:string};
function positive(v:number,name:string){if(!Number.isFinite(v)||v<=0)throw Error(`${name}: pozitif sonlu değer gerekli.`);return v;}
export function frameStability(e:FrameStabilityEvidence,stamp:string){
 if(!e.source?.trim()||e.elasticState!=="uncracked"||!["G+Q+E","G+1.3Q+1.3W"].includes(e.loadCombination)||e.analysisStamp!==stamp||fact(e.coverage,"kat kolon kapsamı")!=="all_storey_columns")throw Error("TS500-7.13 kat/stiffness/snapshot kanıtı eksik/eski.");
 if(!Number.isFinite(e.driftMm)||e.driftMm<0||!e.characteristicMembers.length||new Set(e.characteristicMembers.map(c=>c.id)).size!==e.characteristicMembers.length)throw Error("Kat stabilite geometrisi geçersiz.");
 const sumNoverL=e.characteristicMembers.reduce((sum,c)=>{if(!c.id||!Number.isFinite(c.Nkn)||c.Nkn<0)throw Error("Karakteristik kolon basınç listesi geçersiz.");return sum+c.Nkn/positive(c.lengthMm,"kat boyu");},0),phi=1.5*e.driftMm*sumNoverL/positive(e.shearKn,"kat kesmesi"),sway=phi>.05;
 if(!e.ultimateMembers.length||new Set(e.ultimateMembers.map(c=>c.id)).size!==e.ultimateMembers.length||e.ultimateMembers.some(c=>!e.characteristicMembers.some(k=>k.id===c.id))||e.ultimateMembers.length!==e.characteristicMembers.length)throw Error("Kat ULS/karakteristik üye kapsamı uyuşmuyor.");
 const sumN=e.ultimateMembers.reduce((s,c)=>{if(!Number.isFinite(c.Nkn)||c.Nkn<0)throw Error("Kat ULS basınç kuvveti geçersiz.");return s+c.Nkn;},0),sumNk=e.ultimateMembers.reduce((s,c)=>s+positive(c.criticalLoadKn,"kat burkulma yükü"),0),swayRatio=sumN/sumNk;
 if(!Number.isFinite(e.permanentShearKn)||e.permanentShearKn<0)throw Error("Kalıcı kesme kaynağı geçersiz.");const swayRm=e.permanentShearKn/positive(e.totalShearKn,"toplam kesme");
 return {phi,sway,sumN,sumNk,swayRatio,swayRm,betaS:swayRatio<1/1.3?Math.max(1,1/(1-1.3*swayRatio)):null,swayLoadLimitSatisfied:swayRatio<=.45,sourceClauses:["TS500-7.13","7.23","7.27/7.28"]};
}
export function effectiveColumnLength(input:EffectiveLength,sway:boolean){
 if(input.method==="verified_k"){const k=fact(input.k,"etkili boy katsayısı");if(!Number.isFinite(k)||k<.5)throw Error("Doğrulanmış k≥0.5 olmalı.");return {k,method:input.method,source:input.k.source};}
 if(input.method==="nonsway_default"){if(sway||!input.source?.trim())throw Error("k=1 varsayımı yalnız ötelenmesi önlenmiş açık TS500 profili için geçerli.");return {k:1,method:input.method,source:input.source};}
 if(input.method!=="joint_ratios")throw Error("Etkili boy yöntemi bilinmiyor.");const a=fact(input.alphaBottom,"alt α"),b=fact(input.alphaTop,"üst α");if(![a,b].every(v=>Number.isFinite(v)&&v>=0)||typeof input.oneEndHinged!=="boolean")throw Error("Gerçek düğüm I/ℓ oranları gerekli.");
 const min=Math.min(a,b),mean=(a+b)/2;
 const k=!sway?Math.min(.7+.05*(a+b),.85+.05*min,1):input.oneEndHinged?2+.3*Math.max(a,b):mean<2?(20-mean)/20*Math.sqrt(1+mean):.9*Math.sqrt(mean);
 if(!sway&&input.oneEndHinged)throw Error("Mafsallı non-sway uçta ayrı doğrulanmış k gerekli.");return {k,method:input.method,alphaBottom:a,alphaTop:b,source:`${input.alphaBottom.source};${input.alphaTop.source}`};
}
export function magnifyColumnCase(shape:ColumnShape,bars:readonly ColumnBar[],material:BeamMaterial,load:BeamCase,input:ColumnStabilityInput){
 validateBeamCase(load);if(Math.abs(load.uniformKnM[0])>1e-12)throw Error("TS500 yaklaşık narinlik profili sabit N ister; yayılı eksenel yük genel ikinci mertebe hesabı gerektirir.");
 if(!input.source?.trim()||!["TS500_7_20","TS500_7_21"].includes(input.stiffnessMethod)||!Number.isFinite(input.permanentNkn)||input.permanentNkn<0)throw Error("Narinlik rijitliği/kalıcı yük kaynağı eksik.");
 const model=columnBarGeometry(shape,bars),g=model.geometry,m=beamMaterial(material),angle=.5*Math.atan2(2*g.Iuv,g.Iv-g.Iu),c=Math.cos(angle),s=Math.sin(angle),q=(M2:number,M3:number)=>[c*M3-s*M2,-s*M3-c*M2] as const;
 const sectionInertia=[c*c*g.Iv+2*c*s*g.Iuv+s*s*g.Iu,s*s*g.Iv-2*c*s*g.Iuv+c*c*g.Iu],projectedBars=model.bars.map(b=>({area:b.area,q:[c*b.u+s*b.v,-s*b.u+c*b.v]}));
 const widths=g.kind==="circle"?[g.widthU,g.widthV]:[Math.max(...g.vertices.map(p=>c*p.u+s*p.v))-Math.min(...g.vertices.map(p=>c*p.u+s*p.v)),Math.max(...g.vertices.map(p=>-s*p.u+c*p.v))-Math.min(...g.vertices.map(p=>-s*p.u+c*p.v))];
 const bottom=beamSectionForce(load,0),top=beamSectionForce(load,load.lengthMm),ends=[q(bottom.MweakKnm,bottom.Mknm),q(top.MweakKnm,top.Mknm)],N=bottom.NcompressionKn,frames=input.frame.map(e=>frameStability(e,load.analysisStamp));
 const positions=[0,load.lengthMm,load.lengthMm/2],f=load.endForces,[,qy,qz]=load.uniformKnM;
 for(const [V,Q]of [[c*f[1]+s*f[2],c*qy+s*qz],[-s*f[1]+c*f[2],-s*qy+c*qz]])if(Q!==0){const x=-V/Q*1000;if(x>0&&x<load.lengthMm)positions.push(x);}
 const values=positions.map(x=>{const force=beamSectionForce(load,x);return {xMm:x,q:q(force.MweakKnm,force.Mknm)};});
 const axes=sectionInertia.map((I,i)=>{
  let frame=frames[i];const own=input.frame[i].ultimateMembers.find(c=>c.id===input.memberId);if(!own||Math.abs(own.Nkn-Math.max(0,N))>1e-7+1e-7*Math.abs(N))throw Error("Güncel kolon/kat N kaydı uyuşmuyor.");
  const small=Math.abs(ends[0][i])<=Math.abs(ends[1][i])?ends[0][i]:ends[1][i],large=Math.abs(ends[0][i])>Math.abs(ends[1][i])?ends[0][i]:ends[1][i],ratio=large===0?0:small/large,maxMoment=Math.max(...values.map(v=>Math.abs(v.q[i]))),emin=15+.03*widths[i],minimumMoment=Math.abs(N)*emin/1000,baseMoment=Math.max(maxMoment,minimumMoment);
  const length=effectiveColumnLength(input.axes[i],frame.sway),radius=Math.sqrt(I/g.area),slenderness=length.k*load.lengthMm/radius,ignoreLimit=frame.sway?22:Math.min(40,34-12*ratio),Rm=frame.sway?frame.swayRm:N>0?input.permanentNkn/N:0,Is=projectedBars.reduce((sum,b)=>sum+b.area*b.q[i]**2,0),EI=(input.stiffnessMethod==="TS500_7_20"?.2*m.Ec*I+m.Es*Is:.4*m.Ec*I)/(1+Rm),Nk=Math.PI*Math.PI*EI/(length.k*load.lengthMm)**2/1000;
  frame=frameStability({...input.frame[i],ultimateMembers:input.frame[i].ultimateMembers.map(c=>c.id===input.memberId?{...c,criticalLoadKn:Nk}:c)},load.analysisStamp);
  let beta=1,betaS=1,combination:"none"|"maximum"|"product"="none";
  if(N>0){if(slenderness>100)throw Error("ℓk/i>100: genel doğrusal olmayan ikinci mertebe çözümü gerekli.");const denominator=1-1.3*N/Nk;if(denominator<=0)throw Error("Kolon Euler sınırında/yakınsamayan moment büyütmesi.");
   const Cm=frame.sway||qy!==0||qz!==0?1:Math.max(.4,.6+.4*ratio);if(slenderness>ignoreLimit)beta=Math.max(1,Cm/denominator);
   if(frame.sway){if(!frame.swayLoadLimitSatisfied||frame.betaS===null)throw Error("Kat ΣN≤0.45ΣNk koşulu sağlanmadı.");betaS=frame.betaS;combination=load.lengthMm/radius>35/Math.sqrt(N*1000/(m.fck*g.area))?"product":"maximum";}}
  const factor=combination==="product"?beta*betaS:Math.max(beta,betaS);
  return {axis:i+1,projectedWidthMm:widths[i],I,Is,radiusMm:radius,length,slenderness,ignoreLimit,Rm,EI,NkKn:Nk,beta,betaS,factor,combination,minimumEccentricityMm:emin,frame,firstOrderMaximumKnm:maxMoment,minimumMomentKnm:minimumMoment,designBoundKnm:baseMoment*factor};
 });
 if(input.providedDesignBounds){const p=input.providedDesignBounds;if(p.analysisStamp!==load.analysisStamp||![p.axis1Knm,p.axis2Knm].every(Number.isFinite)||Math.abs(p.axis1Knm-axes[0].designBoundKnm)>1e-7+1e-7*axes[0].designBoundKnm||Math.abs(p.axis2Knm-axes[1].designBoundKnm)>1e-7+1e-7*axes[1].designBoundKnm)throw Error("Önceden büyütülmüş momentler güncel ilk mertebe hesabıyla uyuşmuyor; ikinci kez büyütülmedi.");}
 const designCorners=([-1,1] as const).flatMap(a=>([-1,1] as const).map(b=>{const u=a*axes[0].designBoundKnm,v=b*axes[1].designBoundKnm,qu=c*u-s*v,qv=s*u+c*v;return {Nkn:N,M2knm:-qv,M3knm:qu,kind:"conservative_component_bound",coincidentPhysicalTuple:false};}));
 return {caseId:load.id,Nkn:N,principalAngleRad:angle,axes,frame:axes.map(a=>a.frame),designCorners,firstOrderSamples:values,appliedExactlyOnce:true,providedBoundsVerified:input.providedDesignBounds!==null,sourceClauses:["TS500-6.16","7.13–7.29"],geometricSecondOrderSolved:false};
}
