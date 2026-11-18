import {control,fact,positive,type Fact,type GlobalControl} from "./global-control-types";
import {beamMaterial,beamCapacity,requiredBeamSteel,effectiveFlange,barArea,type BeamMaterial,type BeamSection,type BeamBar} from "./rc-beam-section";
import {beamStations,beamSectionForce,combineBeamCases,type BeamCase} from "./beam-forces";
import {placeBeamBars,beamShearTorsion,capacityShear,beamAnchorage,stirrupLocations,type BeamLayout,type FaceLayout,type Anchorage} from "./beam-detailing";
import {beamServiceability,type ServiceEnvironment} from "./beam-service";
export type BeamDesignInput={id:string;role:"beam"|"band_beam"|"coupling_beam";source:string;mode:"redesign"|"existing_reinforcement";qualityReviewed:Fact<boolean>;loadCoverage:Fact<"all_required_combinations_reviewed">;
 geometry:{spanMm:number;bw:number;h:number;slabThickness:number;columnWidth:number;cover:number;aggregate:number;kind:"simple"|"edge"|"interior"|"cantilever";outside:boolean;flange:null|{hf:number;leftClear:number;rightClear:number;symmetric:boolean};leftJoint:string;rightJoint:string;source:string};
 material:BeamMaterial;ultimate:BeamCase[];seismic:null|{D:number;analysisStamp:string;source:string;pairs:{gravity:BeamCase;earthquake:BeamCase}[]};
 service:{total:BeamCase;sustained:BeamCase;live:BeamCase;duration:"3months"|"6months"|"12months"|"5years";environment:ServiceEnvironment;partition:"none_floor"|"none_roof"|"sensitive"|"insensitive";source:string}|null;
 anchors:{left:Anchorage;right:Anchorage};support:{left:"direct"|"indirect";right:"direct"|"indirect";hangerLeftKn:number;hangerRightKn:number;source:string};
 continuity:{leftBeamId:string|null;rightBeamId:string|null;source:string};existing:BeamLayout|null;
 catalog:{diameters:number[];stirrupDiameters:number[];spacings:number[];maxCount:number;maxRows:number;maxCandidates:number;stockLengthMm:number};splices:readonly unknown[]};
type BeamForceAssessment=ReturnType<typeof beamSectionForce>&{capacity:ReturnType<typeof beamCapacity>;passed:boolean;utilization:number|null};
const finite=(x:number)=>Number.isFinite(x);
function check(id:string,clause:string,passed:boolean,observed:unknown,limit:unknown,reason:string,sources:string[]){return control(id,clause,passed?"pass":"fail",observed,limit,reason,sources);}
function sectionOf(input:BeamDesignInput){const g=input.geometry;return g.flange?effectiveFlange(g.bw,g.h,g.flange.hf,g.flange.leftClear,g.flange.rightClear,g.spanMm,g.kind,g.flange.symmetric).section:{bw:g.bw,h:g.h,bf:g.bw,hf:0};}
function catalogueFaces(input:BeamDesignInput){const g=input.geometry,c=input.catalog,result:FaceLayout[]=[],material=beamMaterial(input.material);
 for(const diameter of c.diameters)for(let rows=1;rows<=c.maxRows;rows++)for(let count=2*rows;count<=c.maxCount;count++){
  const rowCount=Math.ceil(count/rows),width=g.bw-2*(g.cover+Math.min(...c.stirrupDiameters)+diameter/2),gap=Math.max(20,diameter,4*g.aggregate/3);
  const dLower=g.h-(g.cover+Math.max(...c.stirrupDiameters)+diameter/2+(rows-1)*(diameter+gap));
  if(count*barArea(diameter)>=.8*material.fctd/material.fyd*g.bw*dLower&&width/(rowCount-1)-diameter>=gap&&g.h>2*(g.cover+Math.min(...c.stirrupDiameters)+diameter/2+(rows-1)*(diameter+gap)))result.push({diameter,count,rows});
 }
 return result.sort((a,b)=>a.count*barArea(a.diameter)-b.count*barArea(b.diameter)||a.rows-b.rows||a.diameter-b.diameter);
}
// Denge üst sınırı: M≤N*h/2+Σ(As*fyd*y). Geçemeyecek aday tam kesit çözümünden önce elenir.
function faceDepth(face:FaceLayout,cover:number,stirrup:number,aggregate:number){
 const gap=Math.max(20,face.diameter,4*aggregate/3);let weighted=0,used=0;
 for(let row=0;row<face.rows;row++){const count=Math.ceil((face.count-used)/(face.rows-row));weighted+=count*(cover+stirrup+face.diameter/2+row*(face.diameter+gap));used+=count;}
 return weighted/face.count;
}
function validateInput(input:BeamDesignInput){
 const g=input.geometry,c=input.catalog;if(!input.id||!input.source?.trim()||!g.source?.trim()||!g.leftJoint||!g.rightJoint||g.leftJoint===g.rightJoint||!input.support.source?.trim()||!input.continuity.source?.trim())throw Error("Kiriş/geometri/bağlantı kaynağı eksik.");
 [g.spanMm,g.bw,g.h,g.slabThickness,g.columnWidth,g.cover,g.aggregate,c.stockLengthMm].forEach(v=>positive(v,"kiriş ölçüsü/katalog"));
 if(!["beam","band_beam","coupling_beam"].includes(input.role)||!["redesign","existing_reinforcement"].includes(input.mode)||!["simple","edge","interior","cantilever"].includes(g.kind)||typeof g.outside!=="boolean"||![input.support.left,input.support.right].every(v=>["direct","indirect"].includes(v)))throw Error("Kiriş rolü/mesnet/tasarım modu geçersiz.");
 if(![c.maxRows,c.maxCount,c.maxCandidates].every(Number.isSafeInteger)||c.maxRows<1||c.maxRows>3||c.maxCount<2||c.maxCount>20||c.maxCandidates<1||c.maxCandidates>5000||!c.diameters.length||c.diameters.length>9||!c.stirrupDiameters.length||c.stirrupDiameters.length>5||!c.spacings.length||c.spacings.length>30||c.diameters.some(d=>!finite(d)||d<12||d>32)||c.stirrupDiameters.some(d=>!finite(d)||d<8||d>16)||c.spacings.some(s=>!finite(s)||s<25||s>350))throw Error("Sınırlı donatı kataloğu geçersiz.");
 if(!input.ultimate.length||input.ultimate.length>128||input.seismic&&input.seismic.pairs.length>64)throw Error("Kiriş yük durumu bütçesi aşıldı.");
 const stations=beamStations(input.ultimate);if(input.ultimate[0].lengthMm!==g.spanMm)throw Error("Gerçek esnek eleman açıklığı kesit girdisiyle eşleşmiyor.");
 if(input.seismic){const s=input.seismic;positive(s.D,"D");if(s.D<1||s.analysisStamp!==input.ultimate[0].analysisStamp||!s.source.trim()||!s.pairs.length)throw Error("Güncel global katsayı/analiz kimliği ve gerçek deprem bileşenleri gerekli.");for(const p of s.pairs)beamStations([input.ultimate[0],p.gravity,p.earthquake]);}
 if(input.service)beamStations([input.ultimate[0],input.service.total,input.service.sustained,input.service.live]);
 if(g.flange&&Math.abs(g.flange.hf-g.slabThickness)>1e-8)throw Error("Tabla kalınlığı fiziksel döşeme kalınlığıyla eşleşmiyor.");
 if(input.splices.length)throw Error("Bindirmeli fiziksel parça/yerleşim bu tam-boy otomatik profilinde desteklenmiyor; bağımsız bindirme kontrolü kullanılmalı.");
 return stations;
}
function assess(input:BeamDesignInput,section:BeamSection,layout:BeamLayout,selectStirrups:boolean){
 const g=input.geometry,high=!!input.seismic,placed=placeBeamBars(section,layout,g.cover,g.aggregate),bars=placed.bars,checks:GlobalControl[]=[],stations=beamStations(input.ultimate),capacities=new Map<string,ReturnType<typeof beamCapacity>>();
 const capacity=(sign:1|-1,N:number)=>{const key=`${sign}:${N}`;let result=capacities.get(key);if(!result){result=beamCapacity(section,bars,input.material,sign,N);capacities.set(key,result);}return result;};
 const forceChecks=stations.flatMap(st=>st.cases.map(force=>{const cap=capacity(force.Mknm>=0?1:-1,force.NcompressionKn),ok=cap.status==="solved"&&cap.capacityKnm+1e-8>=Math.abs(force.Mknm)&&cap.minimumSatisfied&&cap.maximumSatisfied&&cap.tensionYielded&&cap.strainLimitSatisfied;
  return {...force,capacity:cap,passed:ok,utilization:cap.status==="solved"&&cap.capacityKnm>0?Math.abs(force.Mknm)/cap.capacityKnm:null};}));
 checks.push(check("flexure","TS500-7.1/7.3",forceChecks.every(c=>c.passed),forceChecks,null,"Bütün gerçek istasyon ve birleşimlerde eksenel uyumlu eğilme kapasitesi/minimum/maksimum/süneklik.",[input.source]));
 if(forceChecks.some(c=>!c.passed))return {passed:false,reason:"Eğilme/minimum/maksimum/süneklik sınırı",forceChecks,layout,bars,checks};
 const pos=capacity(1,0),neg=capacity(-1,0);if(pos.status!=="solved"||neg.status!=="solved")throw Error("Uç kapasitesi çözülemedi.");
 const minimumD=Math.min(pos.d,neg.d),At=neg.At,Ac=pos.At,ratioRequired=high&&["edge","interior"].includes(g.kind)?.5:high?.5:0;
 checks.push(check("support_bottom_ratio","TBDY7.4.2.3",!high||Ac>=ratioRequired*At,{bottom:Ac,top:At},ratioRequired,"İhtiyatlı DTS1/2 oranı; bütün otomatik yüksek süneklik profilinde%50.",[input.source]));
 const forces=stations.flatMap(s=>s.cases),worstN=Math.min(0,...forces.map(f=>f.NcompressionKn)),maxT=Math.max(...forces.map(f=>Math.abs(f.Tknm))),maxV=Math.max(...forces.map(f=>Math.abs(f.Vkn)));let endV=maxV,zeroConcrete=false;
 const capacityTransfers=input.seismic?.pairs.map(p=>{const combined=combineBeamCases("capacity-combined",[{factor:1,load:p.gravity},{factor:1,load:p.earthquake}]),amplified=combineBeamCases("capacity-D",[{factor:1,load:p.gravity},{factor:input.seismic!.D,load:p.earthquake}]);
  if(!input.ultimate.some(u=>u.endForces.every((v,i)=>Math.abs(v-combined.endForces[i])<1e-7)&&u.uniformKnM.every((v,i)=>Math.abs(v-combined.uniformKnM[i])<1e-7)))throw Error("Kapasite kesmesinin fiziksel birleşimi gerçek ULS kapsamından eksik.");
  const gl=beamSectionForce(p.gravity,0),gr=beamSectionForce(p.gravity,g.spanMm),al=beamSectionForce(amplified,0),ar=beamSectionForce(amplified,g.spanMm),el=beamSectionForce(p.earthquake,0),er=beamSectionForce(p.earthquake,g.spanMm),cl=beamSectionForce(combined,0),cr=beamSectionForce(combined,g.spanMm);
  if(Math.abs(el.Vkn)>.5*Math.abs(cl.Vkn)||Math.abs(er.Vkn)>.5*Math.abs(cr.Vkn))zeroConcrete=true;
  const leftTop=capacity(-1,cl.NcompressionKn),leftBottom=capacity(1,cl.NcompressionKn),rightTop=capacity(-1,cr.NcompressionKn),rightBottom=capacity(1,cr.NcompressionKn);
  if(leftTop.status!=="solved"||leftBottom.status!=="solved"||rightTop.status!=="solved"||rightBottom.status!=="solved")throw Error("Kapasite kesmesine esas eksenel uyumlu uç kapasitesi çözülemedi.");
  return {...capacityShear({gravityLeftKn:gl.Vkn,gravityRightKn:gr.Vkn,leftTopCapacity:leftTop.capacityKnm,leftBottomCapacity:leftBottom.capacityKnm,rightTopCapacity:rightTop.capacityKnm,rightBottomCapacity:rightBottom.capacityKnm,clearSpanMm:g.spanMm,amplifiedLeftKn:al.Vkn,amplifiedRightKn:ar.Vkn}),gravityCase:p.gravity.id,earthquakeCase:p.earthquake.id,endCapacities:{leftTop,leftBottom,rightTop,rightBottom},amplified};})??[];
 if(capacityTransfers.length)endV=Math.max(endV,...capacityTransfers.flatMap(c=>[c.leftKn,c.rightKn]));
 const shearInput={section,material:input.material,d:minimumD,NcompressionKn:worstN,Tknm:maxT,cover:g.cover,highDuctility:high};
 if(selectStirrups){
  const end=beamShearTorsion({...shearInput,Vkn:endV,layout,zeroConcrete}),middle=beamShearTorsion({...shearInput,Vkn:maxV,layout,zeroConcrete:false}),a=barArea(layout.stirrupDiameter),choose=(limit:number)=>Math.max(0,...input.catalog.spacings.filter(s=>s<=limit+1e-9));
  layout={...layout,spacingEnd:choose(Math.min(end.endLimit,end.spacingLimit,a/end.requiredOuterPerMm)),spacingMiddle:choose(Math.min(middle.spacingLimit,a/middle.requiredOuterPerMm))};
  if(layout.spacingEnd===0||layout.spacingMiddle===0)return {passed:false,reason:"Katalogda yeterli etriye aralığı yok",layout,bars,checks,forceChecks};
 }
 const end=beamShearTorsion({...shearInput,Vkn:endV,layout,zeroConcrete}),middle=beamShearTorsion({...shearInput,Vkn:maxV,layout,zeroConcrete:false});
 checks.push(check("shear_torsion","TS500-8/TBDY7.4.5",end.passed&&middle.passed,{end,middle},null,"Kesme/burulma bileşen üst sınırları ihtiyatlıdır; fiziksel eşzamanlı takım diye sunulmaz.",[input.source]));
 const torsionArea=Math.max(end.requiredLongitudinalMm2,middle.requiredLongitudinalMm2);
 return finishAssessment(input,section,layout,bars,checks,forceChecks,pos,neg,placed.sideArea,end,middle,capacityTransfers,torsionArea,forces);
}
function finishAssessment(input:BeamDesignInput,section:BeamSection,layout:BeamLayout,bars:BeamBar[],checks:GlobalControl[],forceChecks:BeamForceAssessment[],pos:Extract<ReturnType<typeof beamCapacity>,{status:"solved"}>,neg:Extract<ReturnType<typeof beamCapacity>,{status:"solved"}>,sideArea:number,end:ReturnType<typeof beamShearTorsion>,middle:ReturnType<typeof beamShearTorsion>,transfers:unknown[],torsionArea:number,forces:ReturnType<typeof beamSectionForce>[]){
 const g=input.geometry,high=!!input.seismic,required=forces.map(f=>{const sign=f.Mknm>=0?1:-1,cap=sign===1?pos:neg,compFace=sign===1?"top":"bottom",cb=bars.filter(b=>b.face===compFace),compArea=cb.reduce((s,b)=>s+barArea(b.diameter),0),compDepth=cb.reduce((s,b)=>s+barArea(b.diameter)*(sign===1?b.y:g.h-b.y),0)/compArea;
  return {...f,required:requiredBeamSteel(section,input.material,sign,Math.abs(f.Mknm),cap.d,compArea,compDepth,f.NcompressionKn)};});
 const topInsufficient=required.some(f=>f.Mknm<0&&f.required.status!=="solved"),bottomInsufficient=required.some(f=>f.Mknm>=0&&f.required.status!=="solved");
 const requiredTop=topInsufficient?null:Math.max(.8*beamMaterial(input.material).fctd/beamMaterial(input.material).fyd*section.bw*neg.d,...required.filter(f=>f.Mknm<0).map(f=>f.required.requiredAreaMm2??0)),requiredBottom=bottomInsufficient?null:Math.max(.8*beamMaterial(input.material).fctd/beamMaterial(input.material).fyd*section.bw*pos.d,...required.filter(f=>f.Mknm>=0).map(f=>f.required.requiredAreaMm2??0));
 checks.push(check("torsion_longitudinal","TS500-8.16/8.18",requiredTop!==null&&requiredBottom!==null&&neg.At>=requiredTop+torsionArea/2&&pos.At>=requiredBottom+torsionArea/2,{requiredTop,requiredBottom,reservePerFace:torsionArea/2},null,"Burulma boyuna alanı eğilmeye ek; gövde donatısı bu rezervden düşülmez.",[input.source]));
 const sideRequired=Math.max(g.h>600?.001*section.bw*Math.max(pos.d,neg.d):0,high&&g.h>g.spanMm/4?.3*Math.max(pos.At,neg.At):0),sideSpacing=g.h/(layout.sideEach+1);
 checks.push(check("web_reinforcement","TS500-7.6/TBDY7.4.1.1c",sideArea>=sideRequired&&(sideRequired===0||sideSpacing<=(high&&g.h>g.spanMm/4?150:300))&&(torsionArea===0||layout.sideEach>0&&layout.sideDiameter>=12&&sideSpacing<=300),{sideArea,sideSpacing},sideRequired,"Gerçek iki yan yüz gövde yerleşimi.",[input.source]));
 const anchors=bars.map(b=>{const position=b.y>=g.h/2||b.y>300?"II":"I",left=beamAnchorage(input.anchors.left,b.diameter,input.material,position,high,false),right=beamAnchorage(input.anchors.right,b.diameter,input.material,position,high,g.kind==="cantilever"),cutLengthMm=g.spanMm+left.cutExtensionMm+right.cutExtensionMm;return {barId:b.id,position,left,right,cutLengthMm,continuousRangeMm:[0,g.spanMm],areaMm2:barArea(b.diameter),xMm:b.x,yMm:b.y};});
 checks.push(check("anchorage_stock","TS500-9/TBDY7.4.3",anchors.every(a=>a.left.passed&&a.right.passed&&a.cutLengthMm<=input.catalog.stockLengthMm),anchors,input.catalog.stockLengthMm,"Tam boy sürekli çubuk; doğrulanmamış ek/kesme noktası veya stok aşımı kabul edilmez.",[input.source]));
 const hanger=(side:"left"|"right")=>input.support[side]==="direct"?true:(side==="left"?input.support.hangerLeftKn:input.support.hangerRightKn)>=Math.max(...forces.filter(f=>f.xMm===(side==="left"?0:g.spanMm)).map(f=>Math.abs(f.Vkn)));
 // Askı alanı değil doğrulanmış askı kuvveti kapasitesi gerekir; yerleşim P10/P12 bağlantısında ayrıca izlenir.
 checks.push(check("indirect_support","TS500-8.1.2/8.1.6",hanger("left")&&hanger("right"),input.support,null,"Dolaylı mesnet askı kapasitesi gerçek mesnet talebini karşılamalı; beyanın kaynağı zorunlu.",[input.support.source]));
 if(input.support.left==="indirect"||input.support.right==="indirect")checks.push(control("hanger_layout","TS500-8.1.6","requires_engineering",input.support,null,"Askı kuvveti beyanı yerleşim/topoloji kanıtı değildir; dolaylı mesnet otomatik nihai kabul edilmez.",[input.support.source]));
 const service=input.service?beamServiceability({section,bars,material:input.material,...input.service,kind:g.kind}):null;
 checks.push(service?check("serviceability","TS500-13",service.passed,service,null,"Gerçek servis momentleri, çatlamış kesit, sehim/çatlak ve süre etkisi.",[input.service!.source]):control("serviceability","TS500-13","missing_data",null,null,"Gerçek servis/kalıcı/live durumları ve çevre kararı eksik.",[]));
 const stirrups=stirrupLocations(g.spanMm,g.h,layout.spacingEnd,layout.spacingMiddle);stirrups.hookTailMinimumMm=Math.max(6*layout.stirrupDiameter,80);
 const critical=forceChecks.reduce((a,b)=>(a.utilization??0)>=(b.utilization??0)?a:b),criticalRequired=required.find(r=>r.caseId===critical.caseId&&r.xMm===critical.xMm)!;
 return {passed:checks.every(c=>c.status==="pass"),checks,layout,bars,forceChecks,required,critical:{caseId:critical.caseId,xMm:critical.xMm,Mknm:critical.Mknm,NcompressionKn:critical.NcompressionKn,utilization:critical.utilization,capacity:critical.capacity,required:criticalRequired.required},capacities:{positive:pos,negative:neg},shear:{end,middle,transfers},service,anchors,stirrups,steelAreaMm2:bars.reduce((sum,b)=>sum+barArea(b.diameter),0),physicalTupleFromModalMaxima:false};
}
export function designBeam(input:BeamDesignInput){
 try{
  const stations=validateInput(input),section=sectionOf(input),g=input.geometry,checks:GlobalControl[]=[];beamMaterial(input.material);
  if(input.role!=="beam")return {status:"unsupported" as const,id:input.id,reason:input.role==="coupling_beam"?"Bağ kirişi özel tasarımı P11 gerektirir.":"Bant kirişi döşeme şeridi/etkin genişlik modeli P12 gerektirir.",engineeringAcceptance:false};
  if(fact(input.qualityReviewed,"beton/çelik kalite kararı")!==true||fact(input.loadCoverage,"yük birleşimi kapsamı")!=="all_required_combinations_reviewed")return {status:"incomplete" as const,id:input.id,reason:"Kalite/yük kapsamı doğrulaması eksik.",engineeringAcceptance:false};
  if(input.seismic)checks.push(control("seismic_material","TBDY7.2.5",input.material.fck<25?"fail":input.material.reinforcementClass==="S420"?"requires_engineering":"pass",input.material,null,"En az C25; S420 için ek süneklik/karbon/deney koşulları ayrıca doğrulanmalı.",[input.material.source]));
  checks.push(check("geometry","TS500-7.3/TBDY7.4.1",g.bw>=(input.seismic?250:200)&&g.h>=Math.max(300,3*g.slabThickness)&&g.bw<=g.h+g.columnWidth&&(!input.seismic||g.h<=3.5*g.bw)&&g.cover>=(g.outside?25:20),g,null,"Çerçeve kiriş geometrisi ve net örtü profili.",[g.source]));
  if(g.spanMm/g.h<(g.kind==="simple"?1.5:2.5))checks.push(control("deep_beam","TS500-7.3/8.5","unsupported",g.spanMm/g.h,null,"Yüksek kirişin doğrusal olmayan/gerilme alanı hesabı gerekir.",[g.source]));
  const forces=stations.flatMap(s=>s.cases);checks.push(check("beam_axial","TS500-7.2/TBDY7.4.1.2",forces.every(f=>f.NcompressionKn*1000<=.1*input.material.fck*section.bw*section.h),forces.map(f=>f.NcompressionKn),.1*input.material.fck*section.bw*section.h/1000,"Eksenel basınç sınırı aşılıyorsa kolon tasarımı gerekir.",[input.source]));
  if(forces.some(f=>Math.abs(f.MweakKnm)>1e-8||Math.abs(f.VweakKn)>1e-8))checks.push(control("biaxial_scope","TS500-7.5","unsupported",null,null,"İki eksenli kiriş etkileşimi bu tek eksenli profilde kabul edilmez.",[input.source]));
  if(checks.some(c=>c.status!=="pass"))return {status:checks.some(c=>c.status==="fail")?"failed" as const:checks.some(c=>c.status==="unsupported")?"unsupported" as const:"incomplete" as const,id:input.id,checks,engineeringAcceptance:false};
  let selected:ReturnType<typeof assess>|null=null,attempts=0,prunedByEquilibrium=0,exhausted=false;
  if(input.mode==="existing_reinforcement"){if(!input.existing)throw Error("Mevcut donatı yerleşimi zorunlu.");attempts=1;selected=assess(input,section,input.existing,false);}
  else{
   const faces=catalogueFaces(input),pairs=faces.flatMap(top=>faces.map(bottom=>({top,bottom,area:top.count*barArea(top.diameter)+bottom.count*barArea(bottom.diameter)}))).sort((a,b)=>a.area-b.area);
   if(pairs.length>60000)throw Error("Katalog arama uzayı bütçesi aşıldı.");
   outer:for(const pair of pairs)for(const stirrupDiameter of [...input.catalog.stirrupDiameters].sort((a,b)=>a-b)){
    const sideDiameter=12,sideNeed=Math.max(g.h>600?.001*section.bw*g.h:0,input.seismic&&g.h>g.spanMm/4?.3*Math.max(pair.top.count*barArea(pair.top.diameter),pair.bottom.count*barArea(pair.bottom.diameter)):0),torsion=forces.some(f=>Math.abs(f.Tknm)>1e-8),sideEach=Math.max(sideNeed?Math.ceil(sideNeed/(2*barArea(sideDiameter))):0,sideNeed||torsion?Math.ceil(g.h/(input.seismic&&g.h>g.spanMm/4?150:300))-1:0);
    const topArea=pair.top.count*barArea(pair.top.diameter),bottomArea=pair.bottom.count*barArea(pair.bottom.diameter),dt=faceDepth(pair.top,g.cover,stirrupDiameter,g.aggregate),db=faceDepth(pair.bottom,g.cover,stirrupDiameter,g.aggregate),sideUpper=2*sideEach*barArea(sideDiameter)*g.h,fyd=beamMaterial(input.material).fyd;
    if(forces.some(f=>Math.abs(f.Mknm)*1e6>f.NcompressionKn*1000*g.h/2+fyd*(f.Mknm>=0?topArea*dt+bottomArea*(g.h-db)+sideUpper:topArea*(g.h-dt)+bottomArea*db+sideUpper)+1e-6)){prunedByEquilibrium++;continue;}
    if(attempts>=input.catalog.maxCandidates){exhausted=true;break outer;}attempts++;
    const layout:BeamLayout={...pair,stirrupDiameter,legs:2,spacingEnd:25,spacingMiddle:25,sideDiameter,sideEach};
    try{const result=assess(input,section,layout,true);if(result.passed||result.checks.some(c=>["missing_data","requires_engineering"].includes(c.status))&&result.checks.every(c=>c.status!=="fail")){selected=result;break outer;}if(!selected||result.checks.length>selected.checks.length||result.checks.length===selected.checks.length&&result.checks.filter(c=>c.status==="fail").length<selected.checks.filter(c=>c.status==="fail").length)selected=result;}catch(error){if(!(error instanceof Error)||!/(sığmıyor|net aralı|çakışıyor|gövde çubuk|gövde donatısı bütçesi)/i.test(error.message))throw error;}
   }
  }
  if(!selected)return {status:exhausted?"budget_exhausted" as const:"no_layout" as const,id:input.id,attempts,prunedByEquilibrium,checks,engineeringAcceptance:false};
  checks.push(...selected.checks);const ready=selected.passed;
  return {status:ready?"design_ready" as const:exhausted?"budget_exhausted" as const:checks.some(c=>["missing_data","requires_engineering"].includes(c.status))?"incomplete" as const:"failed" as const,id:input.id,section,attempts,prunedByEquilibrium,checks,selected,modelRevision:input.ultimate[0].modelRevision,stiffnessSet:input.ultimate[0].stiffnessSet,analysisStamp:input.ultimate[0].analysisStamp,engineeringAcceptance:false,wholeBuildingApproved:false,metadata:{version:"beam-design-v1",profile:"uniform prismatic cast-in-place RC beam",allBarsContinuous:true,finalFabricationQuantityApproved:false}};
 }catch(error){const reason=String(error);return {status:reason.includes("missing_data")?"incomplete" as const:"invalid_input" as const,id:input.id,reason,engineeringAcceptance:false};}
}
export function designBeams(inputs:readonly BeamDesignInput[]){
 if(!inputs.length||inputs.length>5000||new Set(inputs.map(i=>i.id)).size!==inputs.length)throw Error("Benzersiz kiriş listesi/bütçesi gerekli.");
 const results=inputs.map(designBeam),continuity:GlobalControl[]=[];
 for(const input of inputs)for(const side of ["left","right"] as const){const id=side==="left"?input.continuity.leftBeamId:input.continuity.rightBeamId;if(!id)continue;const neighbor=inputs.find(b=>b.id===id),joint=side==="left"?input.geometry.leftJoint:input.geometry.rightJoint,back=side==="left"?"rightBeamId":"leftBeamId";
  continuity.push(check(`continuity:${input.id}:${side}`,"TS500-7.3/TBDY7.4.3",!!neighbor&&neighbor.geometry[side==="left"?"rightJoint":"leftJoint"]===joint&&neighbor.continuity[back]===input.id&&neighbor.ultimate[0]?.modelRevision===input.ultimate[0]?.modelRevision,{neighborId:id,joint},null,"Komşu kiriş fiziksel düğüm/karşılıklı kayıt ve revizyonla bağlı olmalı; düz kenetlenme boyu ayrıca sınanır.",[input.continuity.source]));
 }
 return {status:results.every(r=>r.status==="design_ready")&&continuity.every(c=>c.status==="pass")?"designs_ready":"incomplete",results,continuity,inputCount:inputs.length,outputCount:results.length,engineeringAcceptance:false,wholeBuildingApproved:false};
}
