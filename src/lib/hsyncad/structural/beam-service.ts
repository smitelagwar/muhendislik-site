import {barArea,beamMaterial,sectionStrips,validateBeamBars,type BeamSection,type BeamBar,type BeamMaterial} from "./rc-beam-section";
import {beamSectionForce,beamStations,type BeamCase} from "./beam-forces";
export type ServiceEnvironment="indoor_normal"|"indoor_humid_or_outdoor_normal"|"outdoor_humid"|"aggressive";
export function crackedBeamSection(s:BeamSection,bars:readonly BeamBar[],material:BeamMaterial,sign:1|-1){
 validateBeamBars(s,bars);const m=beamMaterial(material),strips=sectionStrips(s,sign),n=m.Es/m.Ec,steel=bars.map(b=>({y:sign===1?b.y:s.h-b.y,area:barArea(b.diameter),diameter:b.diameter,x:b.x,face:b.face}));
 const area=strips.reduce((sum,r)=>sum+r.width*(r.y1-r.y0),0),centroid=strips.reduce((sum,r)=>sum+r.width*(r.y1*r.y1-r.y0*r.y0)/2,0)/area,Ig=strips.reduce((sum,r)=>sum+r.width*((r.y1-centroid)**3-(r.y0-centroid)**3)/3,0);
 const first=(c:number)=>strips.reduce((sum,r)=>{const b=Math.min(c,r.y1);return b<=r.y0?sum:sum+r.width*(c*(b-r.y0)-(b*b-r.y0*r.y0)/2);},0)+steel.reduce((sum,b)=>sum+(b.y<c?n-1:n)*b.area*(c-b.y),0);
 let lo=0,hi=s.h;for(let i=0;i<90;i++){const mid=(lo+hi)/2;if(first(mid)>0)hi=mid;else lo=mid;}const c=(lo+hi)/2;
 const Icr=strips.reduce((sum,r)=>{const b=Math.min(c,r.y1);return b<=r.y0?sum:sum+r.width*((b-c)**3-(r.y0-c)**3)/3;},0)+steel.reduce((sum,b)=>sum+(b.y<c?n-1:n)*b.area*(b.y-c)**2,0);
 const tensionFace=sign===1?"bottom":"top",ts=steel.filter(b=>b.face===tensionFace),At=ts.reduce((sum,b)=>sum+b.area,0),d=ts.reduce((sum,b)=>sum+b.area*b.y,0)/At;
 if(!Number.isFinite(d)||Icr<=0||Ig<=0||Icr>Ig)throw Error("Çatlamış kesit profili/geçerli elastik modül oranı çözülemedi.");
 return {neutralAxisMm:c,Icr,Ig,centroid,d,At,n,ts,McrKnm:2.5*m.fctd*Ig/(s.h-centroid)/1e6,sourceClause:"TS500-13.1/13.2"};
}
function effectiveI(M:number,p:ReturnType<typeof crackedBeamSection>){const r=M===0?1:Math.min(1,p.McrKnm/Math.abs(M))**3;return Math.min(p.Ig,r*p.Ig+(1-r)*p.Icr);}
export function uniformBeamDeflection(load:BeamCase,EI:number,kind:"simple"|"edge"|"interior"|"cantilever"){
 if(!Number.isFinite(EI)||EI<=0)throw Error("Sehim rijitliği geçersiz.");const L=load.lengthMm,force=beamSectionForce(load,0),M=force.Mknm*1e6,V=force.Vkn*1000,q=load.uniformKnM[1];
 const poly=(x:number)=>(M*x*x/2+V*x**3/6+q*x**4/24)/EI,constant=kind==="cantilever"?0:-poly(L)/L;
 const value=(x:number)=>constant*x+poly(x),slope=(x:number)=>constant+(M*x+V*x*x/2+q*x**3/6)/EI;
 const roots:number[]=[0,L];if(q===0){if(V!==0)roots.push(-M/V);}else{const discriminant=V*V-2*q*M;if(discriminant>=0)roots.push((-V+Math.sqrt(discriminant))/q,(-V-Math.sqrt(discriminant))/q);}
 const split=[...new Set(roots.filter(x=>x>=0&&x<=L))].sort((a,b)=>a-b),points=[0,L];
 for(let i=0;i<split.length-1;i++){let a=split[i],b=split[i+1],fa=slope(a),fb=slope(b);if(fa===0)points.push(a);if(fb===0)points.push(b);if(fa*fb>=0)continue;for(let j=0;j<70;j++){const mid=(a+b)/2,fm=slope(mid);if(fa*fm<=0){b=mid;fb=fm;}else{a=mid;fa=fm;}}points.push((a+b)/2);}
 const extrema=points.map(x=>({xMm:x,deflectionMm:value(x)})),max=extrema.reduce((a,b)=>Math.abs(a.deflectionMm)>=Math.abs(b.deflectionMm)?a:b);
 return {maxAbsMm:Math.abs(max.deflectionMm),criticalXmm:max.xMm,extrema,relativeToSupportChord:kind!=="cantilever",source:"Gerçek uniform yük moment eğriliğinin integrali"};
}
export function beamServiceability(input:{section:BeamSection;bars:readonly BeamBar[];material:BeamMaterial;total:BeamCase;sustained:BeamCase;live:BeamCase;kind:"simple"|"edge"|"interior"|"cantilever";duration:"3months"|"6months"|"12months"|"5years";environment:ServiceEnvironment;partition:"none_floor"|"none_roof"|"sensitive"|"insensitive";source:string}){
 const {section:s,bars,material}=input,m=beamMaterial(material);if(!input.source?.trim()||!["simple","edge","interior","cantilever"].includes(input.kind))throw Error("Servis sınır koşulu/kaynağı gerekli.");
 const checked=beamStations([input.total,input.sustained,input.live]);if(checked.some(st=>st.cases.some(c=>Math.abs(c.NcompressionKn)>1e-8||Math.abs(c.MweakKnm)>1e-8||Math.abs(c.VweakKn)>1e-8||Math.abs(c.Tknm)>1e-8)))throw Error("Servis eksenel/iki eksenli/burulmalı çatlak etkileşimi desteklenmiyor.");
 if(!["none_floor","none_roof","sensitive","insensitive"].includes(input.partition)||!["indoor_normal","indoor_humid_or_outdoor_normal","outdoor_humid","aggressive"].includes(input.environment))throw Error("Servis ortamı/bölme kararı bilinmiyor.");
 const gamma={"3months":1,"6months":1.2,"12months":1.4,"5years":2}[input.duration];if(!gamma)throw Error("Yükleme süresi tablo profili dışında.");
 const sections={positive:crackedBeamSection(s,bars,material,1),negative:crackedBeamSection(s,bars,material,-1)},all=checked;
 const get=(M:number)=>M>=0?sections.positive:sections.negative;
 // TS500-13.1: ilgili açıklık ve mesnet ortalamaları; toplam/kalıcı/live ayrı rijitlikleriyle.
 const evaluate=(load:BeamCase)=>{
  const stations=beamStations([load]),values=stations.map(st=>st.cases[0]),mid=values.filter(v=>v.xMm>0&&v.xMm<load.lengthMm).reduce((a,b)=>Math.abs(a.Mknm)>Math.abs(b.Mknm)?a:b),left=values[0],right=values.at(-1)!;
  const iMid=effectiveI(mid.Mknm,get(mid.Mknm)),iEnds=(effectiveI(left.Mknm,get(left.Mknm))+effectiveI(right.Mknm,get(right.Mknm)))/2,Ieff=input.kind==="cantilever"?effectiveI(left.Mknm,get(left.Mknm)):input.kind==="simple"?iMid:(iMid+iEnds)/2;
  return {...uniformBeamDeflection(load,m.Ec*Ieff,input.kind),Ieff,caseId:load.id};};
 const instant=evaluate(input.total),sustained=evaluate(input.sustained),live=evaluate(input.live),compressionArea=Math.min(...["top","bottom"].map(face=>bars.filter(b=>b.face===face).reduce((sum,b)=>sum+barArea(b.diameter),0))),dMax=Math.max(sections.positive.d,sections.negative.d),rhoPrime=compressionArea/(s.bw*dMax),lambda=gamma/(1+50*rhoPrime),longTermMm=instant.maxAbsMm+lambda*sustained.maxAbsMm;
 const crackLimit={indoor_normal:.4,indoor_humid_or_outdoor_normal:.3,outdoor_humid:.2,aggressive:.1}[input.environment];
 const cracks=all.map(st=>{const force=st.cases.find(c=>c.caseId===input.total.id)!,p=get(force.Mknm),M=Math.abs(force.Mknm),stress=M*1e6/p.Icr*p.n*Math.max(0,p.d-p.neutralAxisMm),a=s.h-p.d,maxDiameter=Math.max(...p.ts.map(b=>b.diameter)),equivalentN=p.At/barArea(maxDiameter),effectiveArea=2*a*s.bw/equivalentN,c=Math.min(...p.ts.map(b=>Math.min(s.bw/2-Math.abs(b.x),s.h-b.y)));
  // TS500-13.5: MPa,mm; çatlamayan kesitte çatlak genişliği sıfırdır.
  const width=M<=p.McrKnm?0:1.3*Math.cbrt(effectiveArea*c)*stress*1e-5;return {xMm:st.xMm,Mknm:force.Mknm,stressMPa:stress,widthMm:width,limitMm:crackLimit,passed:width<=crackLimit&&stress<=m.fyk};});
 const denominator={none_floor:360,none_roof:180,sensitive:480,insensitive:240}[input.partition],demand=input.partition.startsWith("none")?live.maxAbsMm:longTermMm,limit=input.total.lengthMm/denominator;
 return {instant,sustained,live,lambda,rhoPrime,longTermMm,deflection:{demandMm:demand,limitMm:limit,passed:demand<=limit,partitionComparisonUsesConservativeFullLongTerm:!input.partition.startsWith("none")},cracks,passed:demand<=limit&&cracks.every(c=>c.passed),sourceClauses:["TS500-13.1–13.5/Çizelge13.2–13.4"]};
}
