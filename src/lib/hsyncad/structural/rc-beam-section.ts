import {positive,nonnegative} from "./global-control-types";
export type BeamMaterial={fck:number;fctk:number;reinforcementClass:"S420"|"B420C"|"B500C";fyk:number;fywk:number;Ec:number;tensileBasis:"table_3_2"|"equation_3_1"|"verified_test";elasticBasis:"table_3_2"|"equation_3_2"|"verified_test";testEvidence:string|null;source:string};
export type BeamSection={bw:number;h:number;bf:number;hf:number};
export type BeamBar={id:string;x:number;y:number;diameter:number;face:"top"|"bottom"|"side"};
export const barArea=(diameter:number)=>Math.PI*diameter*diameter/4;
export function beamMaterial(m:BeamMaterial){
 const grades=[16,18,20,25,30,35,40,45,50],k=[.85,.85,.85,.85,.82,.79,.76,.73,.70],i=grades.indexOf(m.fck);
 if(i<0||!m.source?.trim()||![m.fctk,m.fyk,m.fywk,m.Ec].every(v=>Number.isFinite(v)&&v>0)||m.fyk>500||m.fywk>500||!["S420","B420C","B500C"].includes(m.reinforcementClass)||m.fyk!==(m.reinforcementClass==="B500C"?500:420)||m.Ec>=200000)throw Error("Malzeme sınıfı/kaynağı desteklenen betonarme profilinde değil.");
 const fct=[1.4,1.5,1.6,1.8,1.9,2.1,2.2,2.3,2.5],elastic=[27000,27500,28000,30000,32000,33000,34000,36000,37000];
 if(!["table_3_2","equation_3_1","verified_test"].includes(m.tensileBasis)||!["table_3_2","equation_3_2","verified_test"].includes(m.elasticBasis))throw Error("Malzeme tablo/denklem/deney temeli bilinmiyor.");
 if((m.tensileBasis==="verified_test"||m.elasticBasis==="verified_test")&&!m.testEvidence?.trim())throw Error("Karakteristik malzeme deney kanıtı gerekli.");
 const tensile=m.tensileBasis==="table_3_2"?fct[i]:m.tensileBasis==="equation_3_1"?.35*Math.sqrt(m.fck):m.fctk,Ec=m.elasticBasis==="table_3_2"?elastic[i]:m.elasticBasis==="equation_3_2"?3250*Math.sqrt(m.fck)+14000:m.Ec;
 if(Math.abs(m.fctk-tensile)>1e-8||Math.abs(m.Ec-Ec)>1e-6||m.fctk>=m.fck)throw Error("Malzeme değeri beyan edilen tablo/denklem temeliyle uyuşmuyor.");
 // TS500-6.2.5 ve7.1, Çizelge7.1; yerinde döküm, normal nitelik denetimi profili.
 return {...m,fcd:m.fck/1.5,fctd:m.fctk/1.5,fyd:m.fyk/1.15,fywd:m.fywk/1.15,Es:200000,ecu:.003,k1:k[i]};
}
export function validateBeamSection(s:BeamSection){
 if(![s.bw,s.h,s.bf].every(v=>Number.isFinite(v)&&v>0)||!Number.isFinite(s.hf)||s.hf<0||s.hf>=s.h||s.bf<s.bw||s.hf===0&&s.bf!==s.bw)throw Error("Dikdörtgen/T kesit ölçüleri geçersiz.");return s;
}
export function effectiveFlange(bw:number,h:number,hf:number,leftClear:number,rightClear:number,span:number,kind:"simple"|"edge"|"interior"|"cantilever",symmetric:boolean){
 [bw,h,hf,span].forEach(v=>positive(v,"kesit/açıklık"));[leftClear,rightClear].forEach(v=>nonnegative(v,"komşu kiriş net aralığı"));
 if(!["simple","edge","interior","cantilever"].includes(kind)||typeof symmetric!=="boolean")throw Error("Tabla mesnet/simetri kararı eksik.");
 // TS500-6.11–6.13: her taşma ≤6hf ve net aralığın yarısı; toplam taşma .2lp/.1lp.
 const lp=span*{simple:1,edge:.8,interior:.6,cantilever:1.5}[kind],limit=(symmetric?.2:.1)*lp;
 if(symmetric&&Math.abs(leftClear-rightClear)>1e-8||!symmetric&&leftClear!==0&&rightClear!==0)throw Error("Bu tabla profili simetrik T veya tek taraflı L gerektirir.");
 const left=Math.min(leftClear/2,6*hf,symmetric?limit/2:limit),right=Math.min(rightClear/2,6*hf,symmetric?limit/2:limit);
 return {section:validateBeamSection({bw,h,hf,bf:bw+left+right}),lp,left,right,sourceClause:"TS500-6.3.6"};
}
export function sectionStrips(s:BeamSection,sign:1|-1){
 validateBeamSection(s);return [{y0:0,y1:s.h,width:s.bw},...(s.hf?[{y0:sign===1?0:s.h-s.hf,y1:sign===1?s.hf:s.h,width:s.bf-s.bw}]:[])];
}
function concreteBlock(s:BeamSection,a:number,sign:1|-1,fcd:number){
 let area=0,first=0;for(const strip of sectionStrips(s,sign)){const b=Math.min(a,strip.y1);if(b<=strip.y0)continue;area+=strip.width*(b-strip.y0);first+=strip.width*(b*b-strip.y0**2)/2;}
 return {force:.85*fcd*area,centroid:area?first/area:0};
}
export function validateBeamBars(s:BeamSection,bars:readonly BeamBar[]){
 validateBeamSection(s);if(!bars.length||new Set(bars.map(b=>b.id)).size!==bars.length)throw Error("Benzersiz gerçek donatı koordinatları gerekli.");
 for(const b of bars)if(!b.id||![b.x,b.y,b.diameter].every(Number.isFinite)||b.diameter<=0||!["top","bottom","side"].includes(b.face)||Math.abs(b.x)+b.diameter/2>s.bw/2||b.y-b.diameter/2<0||b.y+b.diameter/2>s.h)throw Error("Donatı kesite sığmıyor.");
 for(let i=0;i<bars.length;i++)for(let j=0;j<i;j++)if(Math.hypot(bars[i].x-bars[j].x,bars[i].y-bars[j].y)<(bars[i].diameter+bars[j].diameter)/2-1e-8)throw Error("Donatı çubukları çakışıyor.");
}
export function beamCapacity(s:BeamSection,bars:readonly BeamBar[],material:BeamMaterial,sign:1|-1,NcompressionKn=0){
 validateBeamBars(s,bars);if(![1,-1].includes(sign)||!Number.isFinite(NcompressionKn))throw Error("Kesit yönü/eksenel kuvvet geçersiz.");const m=beamMaterial(material),N=NcompressionKn*1000;
 const steel=bars.map(b=>({...b,y:sign===1?b.y:s.h-b.y,area:barArea(b.diameter)}));
 // TS500-7.1: düzlem kesit,0.003 beton ve elastoplastik çelik; brüt eşdeğer beton bloğu.
 const state=(c:number)=>{const block=concreteBlock(s,Math.min(s.h,m.k1*c),sign,m.fcd),forces=steel.map(b=>({id:b.id,y:b.y,area:b.area,strain:m.ecu*(1-b.y/c),stress:Math.max(-m.fyd,Math.min(m.fyd,m.Es*m.ecu*(1-b.y/c)))}));
  return {c,block,forces,axial:block.force+forces.reduce((sum,b)=>sum+b.stress*b.area,0),moment:(block.force*(s.h/2-block.centroid)+forces.reduce((sum,b)=>sum+b.area*b.stress*(s.h/2-b.y),0))/1e6};};
 let lo=s.h*1e-10,hi=s.h*10000;if(state(lo).axial>N||state(hi).axial<N)return {status:"axial_outside_capacity" as const,sign,NcompressionKn};
 for(let i=0;i<100;i++){const mid=(lo+hi)/2;if(state(mid).axial<N)lo=mid;else hi=mid;}const result=state((lo+hi)/2),residualN=result.axial-N;
 if(![result.c,result.axial,result.moment,result.block.force,result.block.centroid,...result.forces.flatMap(b=>[b.strain,b.stress])].every(Number.isFinite))throw Error("Kesit hesabında sayısal taşma oluştu.");
 if(Math.abs(residualN)>1e-4+Math.abs(N)*1e-9)throw Error("Kesit eksenel dengesi yakınsamadı.");
 const tensionFace=sign===1?"bottom":"top",compressionFace=sign===1?"top":"bottom",area=(face:string)=>bars.filter(b=>b.face===face).reduce((sum,b)=>sum+barArea(b.diameter),0),At=area(tensionFace),Ac=area(compressionFace);
 const d=steel.filter(b=>b.face===tensionFace).reduce((sum,b)=>sum+b.area*b.y,0)/At;if(!Number.isFinite(d)||d<=0)throw Error("Çekme yüzü donatısı eksik.");
 const rho=At/(s.bw*d),rhoPrime=Ac/(s.bw*d),rhoBalanced=.85*m.k1*m.fcd/m.fyd*m.ecu/(m.ecu+m.fyd/m.Es),rhoMin=.8*m.fctd/m.fyd;
 return {status:"solved" as const,sign,NcompressionKn,capacityKnm:Math.max(0,result.moment),neutralAxisMm:result.c,concreteBlock:result.block,steel:result.forces,residualN,d,At,Ac,rho,rhoPrime,rhoBalanced,rhoMin,
  strainLimitSatisfied:result.forces.every(b=>Math.abs(b.strain)<=.1),minimumSatisfied:rho>=rhoMin,maximumSatisfied:rho<=.02&&rho-rhoPrime<=.85*rhoBalanced,tensionYielded:result.forces.filter(b=>b.y>result.c).some(b=>-b.strain>=m.fyd/m.Es),sourceClauses:["TS500-7.1","7.3–7.5"]};
}
export function requiredBeamSteel(s:BeamSection,material:BeamMaterial,sign:1|-1,Mknm:number,d:number,compressionArea:number,compressionDepth:number,NcompressionKn=0){
 positive(d,"faydalı yükseklik");nonnegative(Mknm,"moment");nonnegative(compressionArea,"basınç donatısı");if(d>=s.h||compressionDepth<=0||compressionDepth>=d)throw Error("Donatı ağırlık merkezi geçersiz.");
 const m=beamMaterial(material),aMin=.8*m.fctd/m.fyd*s.bw*d,aMax=Math.min(.02*s.bw*d,compressionArea+.85*(.85*m.k1*m.fcd/m.fyd*m.ecu/(m.ecu+m.fyd/m.Es))*s.bw*d);
 // İki nokta alanı fiziksel katalog seçimi değildir; yerleşim ayrıca gerçek çap/koordinatlarla sınanır.
 const cap=(area:number)=>capacityFromPointAreas(s,m,sign,area,d,compressionArea,compressionDepth,NcompressionKn);
 if(aMax<aMin||cap(aMax)<Mknm)return {status:"insufficient_section" as const,requiredAreaMm2:null,limitAreaMm2:aMax};
 let lo=aMin,hi=aMax;for(let i=0;i<60;i++){const mid=(lo+hi)/2;if(cap(mid)<Mknm)lo=mid;else hi=mid;}
 return {status:"solved" as const,requiredAreaMm2:hi,minimumAreaMm2:aMin,limitAreaMm2:aMax,sourceClause:"TS500-7.1/7.3"};
}
function capacityFromPointAreas(s:BeamSection,m:ReturnType<typeof beamMaterial>,sign:1|-1,At:number,d:number,Ac:number,dc:number,Nkn:number){
 let lo=s.h*1e-10,hi=s.h*10000;const calc=(c:number)=>{const block=concreteBlock(s,Math.min(s.h,m.k1*c),sign,m.fcd),ft=At*Math.max(-m.fyd,Math.min(m.fyd,m.Es*m.ecu*(1-d/c))),fc=Ac*Math.max(-m.fyd,Math.min(m.fyd,m.Es*m.ecu*(1-dc/c)));
  return {N:block.force+ft+fc,M:(block.force*(s.h/2-block.centroid)+ft*(s.h/2-d)+fc*(s.h/2-dc))/1e6};};
 if(calc(lo).N>Nkn*1000||calc(hi).N<Nkn*1000)return 0;
 for(let i=0;i<80;i++){const c=(lo+hi)/2;if(calc(c).N<Nkn*1000)lo=c;else hi=c;}return Math.max(0,calc((lo+hi)/2).M);
}
