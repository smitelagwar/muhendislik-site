import {barArea,beamMaterial,validateBeamBars,type BeamMaterial,type BeamSection,type BeamBar} from "./rc-beam-section";
import {positive,nonnegative} from "./global-control-types";
export type FaceLayout={diameter:number;count:number;rows:number};
export type BeamLayout={top:FaceLayout;bottom:FaceLayout;stirrupDiameter:number;legs:number;spacingEnd:number;spacingMiddle:number;sideDiameter:number;sideEach:number};
export function placeBeamBars(s:BeamSection,layout:BeamLayout,cover:number,aggregate:number){
 positive(cover,"net örtü");positive(aggregate,"agrega");const bars:BeamBar[]=[];
 if(!Number.isSafeInteger(layout.legs)||layout.legs<2||layout.legs>8||!Number.isSafeInteger(layout.sideEach)||layout.sideEach<0||layout.sideEach>20)throw Error("Etriye kolu/gövde donatısı bütçesi geçersiz.");
 [layout.stirrupDiameter,layout.spacingEnd,layout.spacingMiddle].forEach(v=>positive(v,"etriye"));
 for(const face of ["top","bottom"] as const){const f=layout[face];if(!Number.isSafeInteger(f.count)||f.count<2||f.count>30||!Number.isSafeInteger(f.rows)||f.rows<1||f.rows>3||f.count<f.rows*2||f.diameter<12||!Number.isFinite(f.diameter))throw Error("Donatı çap/adet/sıra profili geçersiz.");
  const gap=Math.max(20,f.diameter,4*aggregate/3),edge=cover+layout.stirrupDiameter+f.diameter/2,width=s.bw-2*edge;
  for(let row=0,used=0;row<f.rows;row++){
   const count=Math.ceil((f.count-used)/(f.rows-row));if(width/(count-1)-f.diameter<gap-1e-8)throw Error("Boyuna donatı net aralığı yetersiz.");
   const depth=edge+row*(f.diameter+gap);for(let j=0;j<count;j++)bars.push({id:`${face}:${used+j}`,face,x:-width/2+width*j/(count-1),y:face==="top"?depth:s.h-depth,diameter:f.diameter});used+=count;
  }
 }
 if(layout.sideEach){if(layout.sideDiameter<10||!Number.isFinite(layout.sideDiameter))throw Error("Gövde donatısı çapı yetersiz.");const edge=cover+layout.stirrupDiameter+layout.sideDiameter/2,top=Math.max(...bars.filter(b=>b.face==="top").map(b=>b.y+b.diameter/2)),bottom=Math.min(...bars.filter(b=>b.face==="bottom").map(b=>b.y-b.diameter/2));
  for(const sign of [-1,1])for(let i=1;i<=layout.sideEach;i++)bars.push({id:`side:${sign}:${i}`,face:"side",x:sign*(s.bw/2-edge),y:top+(bottom-top)*i/(layout.sideEach+1),diameter:layout.sideDiameter});}
 validateBeamBars(s,bars);
 const clear=Math.max(20,4*aggregate/3);for(let i=0;i<bars.length;i++)for(let j=0;j<i;j++)if(Math.hypot(bars[i].x-bars[j].x,bars[i].y-bars[j].y)-(bars[i].diameter+bars[j].diameter)/2<Math.max(clear,Math.max(bars[i].diameter,bars[j].diameter))-1e-8)throw Error("Donatı sıraları/gövde çubukları arasında net aralık yetersiz.");
 const sideArea=2*layout.sideEach*barArea(layout.sideDiameter),coverToBars=Math.min(...bars.map(b=>Math.min(s.bw/2-Math.abs(b.x)-b.diameter/2,b.y-b.diameter/2,s.h-b.y-b.diameter/2)));
 return {bars,sideArea,coverToBars,sourceClause:"TS500-7.3/TBDY7.4.2"};
}
export function beamShearTorsion(input:{section:BeamSection;material:BeamMaterial;d:number;NcompressionKn:number;Vkn:number;Tknm:number;layout:BeamLayout;cover:number;zeroConcrete:boolean;highDuctility:boolean}){
 const {section:s,material,d,layout:l}=input,m=beamMaterial(material);positive(d,"faydalı yükseklik");if(d>=s.h||![input.Vkn,input.Tknm,input.NcompressionKn].every(Number.isFinite))throw Error("Kesme/burulma talebi geçersiz.");
 const V=Math.abs(input.Vkn)*1000,T=Math.abs(input.Tknm)*1e6,N=Math.abs(input.NcompressionKn)*1000,Ac=s.bw*s.h,gamma=input.NcompressionKn>=0?.07:-.3;
 // TS500-8.1–8.7,8.10–8.19; burulma indirimsiz denge burulması olarak korunur.
 const Vcr=Math.max(0,.65*m.fctd*s.bw*d*(1+gamma*N/Ac)),Vc=input.zeroConcrete?0:.8*Vcr,S=Math.min(s.bw,s.h)**2*Math.max(s.bw,s.h)/3,Tcr=1.35*m.fctd*S;
 const coreB=s.bw-2*input.cover-l.stirrupDiameter,coreH=s.h-2*input.cover-l.stirrupDiameter,Ae=positive(coreB*coreH,"etriye merkez alanı"),ue=2*(coreB+coreH);
 if(coreB<=0||coreH<=0)throw Error("Etriye çekirdeği geçersiz.");
 const torsionIgnored=T<=.65*m.fctd*S,designT=torsionIgnored?0:T,ratio=designT===0?0:V===0?1:Math.min(1,designT/(V*s.bw)),minShear=.3*m.fctd/m.fywd*s.bw/l.legs;
 const minOuter=.15*m.fctd/m.fywd*(1+1.3*ratio)*s.bw,minTorsion=.15*m.fctd/m.fywd*1.3*ratio*s.bw;
 const requiredOuterPerMm=Math.max(minShear,designT?minOuter:0,Math.max(0,V-Vc)/(d*l.legs*m.fywd)+designT/(2*Ae*m.fywd));
 const requiredLongitudinalMm2=designT?Math.max(designT/(2*Ae*m.fywd)*ue*m.fywd/m.fyd,designT*ue/(2*m.fyd*Ae)):0;
 const vr=(spacing:number)=>Vc+l.legs*barArea(l.stirrupDiameter)/spacing*m.fywd*d;
 const stress=designT/S+V/(s.bw*d),stressLimit=.22*m.fcd,upperV=input.highDuctility?.85*s.bw*d*Math.sqrt(m.fck):Infinity;
 const spacingLimit=Math.min(d/(V>3*Vcr?4:2),designT?ue/8:Infinity,designT?300:Infinity),endLimit=input.highDuctility?Math.min(d/4,8*Math.min(l.top.diameter,l.bottom.diameter),150):spacingLimit;
 return {VcrKn:Vcr/1000,VcKn:Vc/1000,TcrKnm:Tcr/1e6,torsionIgnored,requiredOuterPerMm,requiredLongitudinalMm2,Ae,ue,
  endVrKn:vr(l.spacingEnd)/1000,middleVrKn:vr(l.spacingMiddle)/1000,stress,stressLimit,upperVkn:Number.isFinite(upperV)?upperV/1000:null,spacingLimit,endLimit,
  passed:stress<=stressLimit&&V<=upperV&&l.spacingEnd<=Math.min(spacingLimit,endLimit)&&l.spacingMiddle<=spacingLimit&&barArea(l.stirrupDiameter)/l.spacingEnd>=Math.max(requiredOuterPerMm,minTorsion)&&barArea(l.stirrupDiameter)/l.spacingMiddle>=Math.max(requiredOuterPerMm,minTorsion),
  sourceClauses:["TS500-8.1–8.19","TBDY7.4.4/7.4.5"],compatibilityTorsionReduced:false};
}
export function capacityShear(input:{gravityLeftKn:number;gravityRightKn:number;leftTopCapacity:number;leftBottomCapacity:number;rightTopCapacity:number;rightBottomCapacity:number;clearSpanMm:number;amplifiedLeftKn:number;amplifiedRightKn:number}){
 const v=Object.values(input);if(v.some(x=>!Number.isFinite(x))||input.clearSpanMm<=0||[input.leftTopCapacity,input.leftBottomCapacity,input.rightTopCapacity,input.rightBottomCapacity].some(x=>x<0))throw Error("Kapasite kesmesi girdisi eksik.");
 const L=input.clearSpanMm/1000,forward=1.4*(input.leftTopCapacity+input.rightBottomCapacity)/L,reverse=1.4*(input.leftBottomCapacity+input.rightTopCapacity)/L;
 // TBDY7.9: iki deprem yönü; D ile artırılmış gerçek toplam kesme üst sınırı.
 const rawLeft=Math.max(Math.abs(input.gravityLeftKn+forward),Math.abs(input.gravityLeftKn-reverse)),rawRight=Math.max(Math.abs(input.gravityRightKn+forward),Math.abs(input.gravityRightKn-reverse));
 return {leftKn:Math.min(rawLeft,Math.abs(input.amplifiedLeftKn)),rightKn:Math.min(rawRight,Math.abs(input.amplifiedRightKn)),rawLeft,rawRight,forward,reverse,sourceClause:"TBDY7.4.5.1/7.9"};
}
export type Anchorage=({kind:"straight";availableMm:number;source:string}|{kind:"hook90";horizontalMm:number;verticalMm:number;innerBendDiameterMm:number;source:string}|{kind:"free";source:string}) & {coverMm:number;clearSpacingMm:number};
export function anchorageLength(diameter:number,material:BeamMaterial,position:"I"|"II",cover:number,clearSpacing:number){
 const m=beamMaterial(material);positive(diameter,"çap");positive(cover,"kenetlenme örtüsü");nonnegative(clearSpacing,"kenetlenme net aralığı");if(diameter>=40||!["I","II"].includes(position))throw Error("Kenetlenme çapı/konumu desteklenmiyor.");
 let lb=Math.max(.12*m.fyd/m.fctd*diameter,20*diameter);if(diameter>32)lb*=100/(132-diameter);if(position==="I")lb*=1.4;if(cover<diameter||clearSpacing<1.5*diameter)lb*=1.2;
 return {lb,sourceClause:"TS500-9.1.2",excessSteelReductionApplied:false};
}
export function beamAnchorage(end:Anchorage,diameter:number,material:BeamMaterial,position:"I"|"II",high:boolean,freeAllowed:boolean){
 if(!end.source?.trim())throw Error("Kenetlenme geometrisi kaynağı gerekli.");const {lb}=anchorageLength(diameter,material,position,end.coverMm,end.clearSpacingMm);
 if(end.kind==="free")return {passed:freeAllowed,lb,extensionMm:0,cutExtensionMm:0,reason:"Serbest uç kararı"};
 if(end.kind==="straight"){nonnegative(end.availableMm,"kenetlenme alanı");const required=high?Math.max(lb,50*diameter):lb;return {passed:end.availableMm>=required,lb,required,extensionMm:required,cutExtensionMm:required,reason:"Tam boy nervürlü düz kenetlenme"};}
 if(end.kind!=="hook90")throw Error("Kenetlenme türü desteklenmiyor.");
 [end.horizontalMm,end.verticalMm,end.innerBendDiameterMm].forEach(v=>positive(v,"kanca ölçüsü"));
 const radius=(end.innerBendDiameterMm+diameter)/2;
 // a ve b dış izdüşüm boyları; a+b ihtiyatlı olarak lb ile karşılaştırılır.
 const passed=end.horizontalMm>=.4*lb&&end.verticalMm>=12*diameter&&end.horizontalMm+end.verticalMm>=lb&&end.innerBendDiameterMm>=6*diameter&&Math.min(end.horizontalMm,end.verticalMm)>=radius;
 return {passed,lb,required:lb,extensionMm:end.horizontalMm,cutExtensionMm:end.horizontalMm+end.verticalMm-2*radius+Math.PI*radius/2,geometry:{kind:"line-arc-line",horizontal:end.horizontalMm,vertical:end.verticalMm,radius,sweepRad:Math.PI/2},reason:"TBDY7.4.3.1/TS500-9.1.2 ve9.3.1"};
}
export function beamLap(input:{diameter:number;material:BeamMaterial;position:"I"|"II";cover:number;clearSpacing:number;fraction:number;startMm:number;lengthMm:number;spanMm:number;heightMm:number;stirrupDiameter:number;stirrupSpacing:number;high:boolean;isBottom:boolean;plasticZones:readonly {startMm:number;endMm:number}[]}){
 if(!Number.isFinite(input.fraction)||input.fraction<=0||input.fraction>1||!Number.isFinite(input.startMm)||input.startMm<0||!Number.isFinite(input.lengthMm)||input.lengthMm<=0||input.startMm+input.lengthMm>input.spanMm)throw Error("Bindirme yeri/oranı geçersiz.");
 const base=anchorageLength(input.diameter,input.material,input.position,input.cover,input.clearSpacing).lb,required=base*(1+.5*input.fraction)*(input.position==="I"?1.4:1),end=input.startMm+input.lengthMm;
 const forbidden=input.high&&(input.startMm<2*input.heightMm||end>input.spanMm-2*input.heightMm||input.plasticZones.some(z=>input.startMm<z.endMm&&end>z.startMm));
 return {required,passed:!forbidden&&input.lengthMm>=required&&input.stirrupDiameter>=Math.max(8,input.diameter/3)&&input.stirrupSpacing<=Math.min(input.heightMm/4,input.high?100:200)&&Math.floor(input.lengthMm/input.stirrupSpacing)+1>=6,forbidden,sourceClauses:["TS500-9.2.5","TBDY7.4.3.2"],staggeringStillRequired:input.fraction>0&&input.fraction<1};
}
export function stirrupLocations(span:number,h:number,endSpacing:number,middleSpacing:number){
 [span,h,endSpacing,middleSpacing].forEach(v=>positive(v,"etriye yerleşimi"));if(span<50)throw Error("Kiriş boyu etriye için yetersiz.");
 const boundaries=[25,Math.min(2*h,span-25),Math.max(span-2*h,25),span-25].sort((a,b)=>a-b),positions:number[]=[];
 for(let i=0;i<boundaries.length-1;i++){const a=boundaries[i],b=boundaries[i+1];if(b<=a)continue;const spacing=(a+b)/2<2*h||(a+b)/2>span-2*h?endSpacing:middleSpacing,n=Math.ceil((b-a)/spacing);for(let j=0;j<=n;j++)positions.push(a+(b-a)*j/n);}
 return {positionsMm:[...new Set(positions)].sort((a,b)=>a-b),endZoneMm:Math.min(2*h,span/2),hookAngleDeg:135,hookTailMinimumMm:null as number|null,cutLengthMm:null,fabricationCuttingListApproved:false};
}
