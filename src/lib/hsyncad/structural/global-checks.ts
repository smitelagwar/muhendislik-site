import {polygonLamina} from "./mass-properties";
import {dd3ToDd2Ratio,type StandardSpectrum} from "./design-spectrum";
import {control,fact,positive,nonnegative,type Fact,type EngineeringReview,type GlobalControl} from "./global-control-types";
type Point={x:number;y:number};
export function driftStatistics(drifts:readonly number[]){
 if(!drifts.length||drifts.some(d=>!Number.isFinite(d)||d<0))throw Error("Invalid drift amplitudes.");
 const max=Math.max(...drifts),min=Math.min(...drifts),mean=(max+min)/2;if(mean===0)throw Error("Zero-excitation drift ratio is undefined, not automatically regular.");
 return {max,min,rigidMean:mean,memberMean:drifts.reduce((s,v)=>s+v,0)/drifts.length,etaB:max/mean};
}
export function torsionalIrregularity(storyId:string,drifts:readonly number[],source:string,accidentalEccentricityIncluded:boolean){
 if(!source.trim()||!accidentalEccentricityIncluded)return control(`A1:${storyId}`,"Table3.6/Fig3.1","missing_data",null,1.2,"±%5 ek dışmerkezlikli gerçek göreli ötelemeler gerekir.",source?[source]:[]);
 const stats=driftStatistics(drifts),finding=stats.etaB>1.2;return control(`A1:${storyId}`,"Table3.6/Fig3.1","determined",stats,1.2,"Rijit diyaframda ortalama=(max+min)/2; yuvarlama yok.",[source],[],finding,finding?"Hesap yöntemi/ek dışmerkezlik ve taban büyütmesi kararına aktar.":null);
}
export function softStorey(storyId:string,current:{drift:number;height:number},neighbors:{drift:number;height:number}[],basement:boolean,source:string){
 if(basement)return control(`B2:${storyId}`,"Table3.6","not_applicable",null,2,"B2 tanımında bodrum katı kapsam dışı; diğer kontroller kaldırılmaz.",[source]);
 if(!source.trim()||!neighbors.length)throw Error("Source and adjacent storey response required.");
 const a=nonnegative(current.drift,"drift")/positive(current.height,"height"),ratios=neighbors.map(n=>{const b=nonnegative(n.drift,"adjacent drift")/positive(n.height,"adjacent height");return b===0?a===0?null:"unbounded":a/b;});
 if(ratios.some(v=>v===null))return control(`B2:${storyId}`,"Table3.6","missing_data",ratios,2,"Sıfır/sıfır rijitlik oranı belirlenemiyor.",[source]);
 const finding=ratios.some(v=>v==="unbounded"||typeof v==="number"&&v>2);return control(`B2:${storyId}`,"Table3.6","determined",ratios,2,"Kat yüksekliğine bölünmüş ortalama driftin iki komşuya oranı.",[source],[],finding,finding?"Hesap yöntemi ve γE kararına aktar.":null);
}
function reviewed(r:EngineeringReview){return r.present!==null&&!!r.reviewer?.trim()&&!!r.reason?.trim();}
export function slabDiscontinuity(id:string,geometry:Fact<{outline:Point[];holes:Point[][]}>,review:EngineeringReview,model:"shell"|"rigid"|"unknown"){
 let areaRatio:number|null=null;if(geometry.value!==null){const g=fact(geometry,"slab geometry"),gross=polygonLamina(g.outline,1).areaM2,net=polygonLamina(g.outline,1,g.holes).areaM2;areaRatio=(gross-net)/gross;}
 const geometric=areaRatio!==null&&areaRatio>1/3,manual=reviewed(review)?review.present:null,finding=geometric||manual===true?true:areaRatio!==null&&manual===false?false:null;
 const result=control(`A2:${id}`,"Table3.6/3.6.2.2",finding===null?"requires_engineering":"determined",{openingRatio:areaRatio,review},1/3,"Alan koşulu ile II/III yük aktarımı/rijitlik değerlendirmesi ayrıdır.",[geometry.source,...(reviewed(review)?[`${review.reviewer}: ${review.reason}`]:[])],[],finding,finding?"Döşeme yük aktarımını membran/kabuk modelinde göster.":null);
 const modeling=control(`A2_model:${id}`,"3.6.2.2",finding===null?"requires_engineering":finding?model==="shell"?"requires_engineering":"fail":"not_applicable",model,"shell","Kabuk beyanı tek başına yük aktarımı kanıtı değildir; yöntem istisnası bu kontrolü kaldırmaz.",geometry.source?[geometry.source]:[],[result.id]);return {result,modeling};
}
export function planProjection(id:string,dimensions:Fact<{Lx:number;Ly:number;projections:{ax:number;ay:number}[]}>,review:EngineeringReview,model:"shell"|"rigid"|"unknown"){
 let geometric:boolean|null=null;if(dimensions.value!==null){const g=fact(dimensions,"projection dimensions");positive(g.Lx,"Lx");positive(g.Ly,"Ly");if(g.projections.some(p=>!Number.isFinite(p.ax)||!Number.isFinite(p.ay)||p.ax<0||p.ay<0||p.ax>g.Lx||p.ay>g.Ly))throw Error("Invalid projection geometry.");geometric=g.projections.some(p=>p.ax>.2*g.Lx&&p.ay>.2*g.Ly);}
 const manual=reviewed(review)?review.present:null,finding=geometric===true||manual===true?true:geometric===false&&manual===false?false:null;
 const result=control(`A3:${id}`,"Table3.6/Fig3.3",finding===null?"requires_engineering":"determined",{geometry:dimensions.value,review},.2,"İki dik boyut koşulu birlikte; geometri/yapısal aktarım kararı bilinmiyorsa yok yazılmaz.",[dimensions.source,...(reviewed(review)?[`${review.reviewer}: ${review.reason}`]:[])],[],finding,finding?"Membran/kabuk modelinde yük aktarımı doğrulanmalı.":null);
 return {result,modeling:control(`A3_model:${id}`,"3.6.2.2",finding===null?"requires_engineering":finding?model==="shell"?"requires_engineering":"fail":"not_applicable",model,"shell","A2/A3 yük aktarımı doğrulaması kabuk beyanından bağımsız olarak gerekir.",[dimensions.source],[result.id])};
}
export function verticalDiscontinuity(id:string,review:EngineeringReview):GlobalControl{
 if(!reviewed(review))return control(`B3:${id}`,"Table3.6/3.6.2.4","requires_engineering",review,null,"Düşey taşıyıcı sürekliliği için görünür mühendis kararı gerekir.",[]);
 const refs=[`${review.reviewer}: ${review.reason}`];if(review.present===false)return control(`B3:${id}`,"3.6.2.4","determined",review,null,"B3 yok kararı kaynaklıdır; diğer kontroller sürer.",refs,[],false);
 if(!review.transfer||review.transfer==="none")return control(`B3:${id}`,"3.6.2.4","requires_engineering",review,null,"B3 aktarım türü belirlenmeli.",refs,[],true);
 const allowed=review.transfer==="column_on_simple_beam",reference=allowed&&!!review.verticalAnalysisRef?.trim();return control(`B3:${id}`,"3.6.2.4",allowed?reference?"requires_engineering":"missing_data":"fail",review,"column_on_simple_beam with verified vertical analysis",allowed?"İki ucu mesnetli kiriş üstü kolon için düşey deprem hesabı gerekir; referans metni tek başına hesap kanıtı değildir.":"Bu düşey süreksizlik düzenine izin verilmez.",refs.concat(reference?[review.verticalAnalysisRef!]:[]),[],true,allowed?"Yerel düşey hesap kapsamı/revizyonunu doğrula.":"Taşıyıcı sistemi yeniden düzenle.");
}
export type ShearAreaInput={columnAreas:number[];wallAreas:number[];infillArea:number;infillType:"attached"|"separated";source:string};
export function weakStoreys(stories:readonly {id:string;X:ShearAreaInput;Y:ShearAreaInput}[]){
 if(!stories.length||new Set(stories.map(s=>s.id)).size!==stories.length)throw Error("Unique bottom-to-top storeys required.");const checks:GlobalControl[]=[];let minimum=1;
 for(let i=0;i<stories.length-1;i++)for(const direction of ["X","Y"] as const){
  const lower=stories[i][direction],upper=stories[i+1][direction];
  const validate=(s:ShearAreaInput)=>{if(!s.source.trim()||!Array.isArray(s.columnAreas)||!Array.isArray(s.wallAreas)||!["attached","separated"].includes(s.infillType))throw Error("Missing shear-area composition/source.");[...s.columnAreas,...s.wallAreas,s.infillArea].forEach(a=>nonnegative(a,"section area"));};validate(lower);validate(upper);
  const ak=(s:ShearAreaInput)=>s.infillType==="separated"?0:s.infillArea,omitInfill=ak(lower)>ak(upper),area=(s:ShearAreaInput)=>s.columnAreas.reduce((a,b)=>a+b,0)+s.wallAreas.reduce((a,b)=>a+b,0)+(omitInfill?0:.15*ak(s));
  const low=positive(area(lower),"lower effective shear area"),high=positive(area(upper),"upper effective shear area"),eta=low/high;minimum=Math.min(minimum,eta);
  checks.push(control(`B1:${stories[i].id}:${direction}`,"Table3.6/3.6.2.3",eta<.6?"fail":"determined",{eta,lowerArea:low,upperArea:high,omitInfill},[.6,.8],"Dolgu alanı altta daha fazlaysa her iki katta dolgu dışlanır.",[lower.source,upper.source],[],eta<.8,eta<.6?"Zayıf kat dayanım/rijitliği artırılıp analiz yenilenmeli.":eta<.8?"İki doğrultunun R katsayısını 1.25ηmin ile azaltıp yeniden analiz et.":null));
 }
 if(stories.length===1)checks.push(control("B1:no_adjacent_storey","Table3.6","not_applicable",1,null,"Tek açık kat için üst komşu kat oranı yok.",[stories[0].X.source,stories[0].Y.source]));
 return {checks,minimumEta:minimum,factor:minimum<.6?null:minimum<.8?1.25*minimum:1};
}
export function storeyDriftCheck(id:string,input:{rawMaxM:number;heightM:number;R:number;I:number;dominantPeriod:number;dd2:StandardSpectrum;dd3:StandardSpectrum;infill:"attached"|"separated";separatedCapacitySource:string|null;driftScale:number;source:string}){
 const {rawMaxM,heightM,R,I,dominantPeriod,dd2,dd3}=input;nonnegative(rawMaxM,"drift");[heightM,R,I,dominantPeriod,input.driftScale].forEach(v=>positive(v,"drift parameter"));if(!input.source.trim()||!["attached","separated"].includes(input.infill))throw Error("Missing drift source/infill decision.");
 const lambda=dd3ToDd2Ratio(dd3,dd2,dominantPeriod),effectiveDriftM=rawMaxM*input.driftScale*R/I,demand=lambda*effectiveDriftM/heightM,limit=input.infill==="attached"?.008:.016;
 const status=input.infill==="separated"&&!input.separatedCapacitySource?.trim()?"missing_data":demand<=limit?"pass":"fail";
 return control(`drift:${id}`,"4.32–4.34",status,{rawMaxM,effectiveDriftM,lambda,demand,driftScale:input.driftScale},limit,"Betonarme κ=1; ayrık dolgu alternatifi için deformasyon kapasitesi kanıtı gerekir.",[input.source,...(input.separatedCapacitySource?[input.separatedCapacitySource]:[])],[],null,status==="fail"?"Rijitliği artırıp deprem hesabını yenile.":status==="missing_data"?"Ayrık dolgu/cephe kapasite kanıtını ekle.":null);
}
export function secondOrder(stories:readonly {id:string;averageDriftM:number;weightAboveKn:number;shearKn:number;heightM:number;part:"upper"|"basement"}[],R:number,D:number,rigidBasement:boolean,source:string){
 if(!stories.length||!source.trim())throw Error("Second-order demand/source required.");positive(R,"R");positive(D,"D");
 const theta=stories.filter(s=>!rigidBasement||s.part!=="basement").map(s=>({id:s.id,value:nonnegative(s.averageDriftM,"drift")*positive(s.weightAboveKn,"weight above")/(positive(s.shearKn,"story shear")*positive(s.heightM,"height"))}));if(!theta.length)throw Error("No applicable upper storey.");
 const max=Math.max(...theta.map(t=>t.value)),limit=.12*D/(.5*R),betaII=max<=limit?1:Math.max(1,.88+.5*R/D*max);
 return {theta,max,betaII,control:control("second_order","4.35–4.37","determined",{theta,max,betaII},limit,"Betonarme Ch=0.5; bu bir kuvvet büyütmesidir, geometrik nonlineer/P-Delta çözümü değildir.",[source],[],max>limit,max>limit?"İlgili doğrultunun iç kuvvetlerine βII uygula veya rijitliği değiştirip yeniden analiz et.":null)};
}
export function seismicGap(input:{heightM:number;ownDisplacementM:number;neighborDisplacement:Fact<number>;neighborCannotBeAnalyzed:Fact<boolean>;sameFloorLevels:Fact<boolean>;R:number;I:number;providedM:Fact<number>;source:string}){
 const height=positive(input.heightM,"height"),own=nonnegative(input.ownDisplacementM,"own displacement"),same=fact(input.sameFloorLevels,"adjacent floor alignment");positive(input.R,"R");positive(input.I,"I");
 if(typeof same!=="boolean")throw Error("Explicit boolean adjacent floor alignment required.");
 let neighbor:number,assumption:string|null=null;
 if(input.neighborDisplacement.value!==null)neighbor=nonnegative(fact(input.neighborDisplacement,"neighbor displacement"),"neighbor displacement");
 else if(input.neighborCannotBeAnalyzed.value===true){fact(input.neighborCannotBeAnalyzed,"neighbor analysis decision");neighbor=own;assumption="Unanalysable existing neighbor lower bound equals this building displacement (4.9.3.1).";}
 else return control("seismic_gap","4.9.3.1","missing_data",null,null,"Komşu bina deplasmanı veya hesap yapılamama gerekçesi bilinmiyor.",[input.source]);
 const alpha=(same?.25:.5)*input.R/input.I,dynamicM=alpha*Math.hypot(own,neighbor),minimumM=.03+Math.max(0,Math.ceil((height-6)/3))*.01,requiredM=Math.max(dynamicM,minimumM);
 const provided=input.providedM.value===null?null:nonnegative(fact(input.providedM,"provided seismic gap"),"gap");
 return control("seismic_gap","4.9.3.1/2",provided===null?"missing_data":provided>=requiredM?"pass":"fail",{own,neighbor,alpha,dynamicM,minimumM,requiredM,provided,assumption},requiredM,"Kısmi3m yükseklik aralığı ihtiyatlı olarak yukarı tamamlanır; oturma/sıcaklık etkileri bu kapsamda değil.",[input.source,input.sameFloorLevels.source,input.neighborDisplacement.source,input.providedM.source]);
}
