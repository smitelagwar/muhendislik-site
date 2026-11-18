import {columnBarGeometry,type ColumnShape,type ColumnBar} from "./rc-column-section";
import {barArea,beamMaterial,type BeamMaterial} from "./rc-beam-section";
import {anchorageLength,stirrupLocations} from "./beam-detailing";
export type ColumnTie={diameter:number;endSpacingMm:number;middleSpacingMm:number;coreB:number;coreH:number;legsU:number;legsV:number;maxUnsupportedSpacingMm:number;restrainedBarIds:string[];crossTies:{id:string;fromBarId:string;toBarId:string}[];source:string;kind:"rectangular"|"circular_hoop";hookAngleDeg:number;hookTailMm:number;innerBendDiameterMm:number};
export type ColumnLap={barIds:string[];startMm:number;lengthMm:number;addedSteelAreaMm2:number;spacingMm:number;source:string};
export function rectangleColumnBars(shape:Extract<ColumnShape,{kind:"rectangle"}>,diameter:number,alongB:number,alongH:number,cover:number,tieDiameter:number):ColumnBar[]{
 if(!Number.isFinite(diameter)||diameter<14||diameter>32||![alongB,alongH].every(n=>Number.isSafeInteger(n)&&n>=2&&n<=12)||!Number.isFinite(cover)||cover<=0||!Number.isFinite(tieDiameter)||tieDiameter<8)throw Error("Kolon katalog yerleşimi geçersiz.");
 const edge=cover+tieDiameter+diameter/2,b=shape.b-2*edge,h=shape.h-2*edge,c=Math.cos(shape.angleRad),s=Math.sin(shape.angleRad),center=shape.center??{u:0,v:0},points:{u:number;v:number}[]=[];if(b<=0||h<=0)throw Error("Donatı kolon kesitine sığmıyor.");
 for(const sign of [-1,1])for(let i=0;i<alongB;i++)points.push({u:-b/2+b*i/(alongB-1),v:sign*h/2});
 for(const sign of [-1,1])for(let i=1;i<alongH-1;i++)points.push({u:sign*b/2,v:-h/2+h*i/(alongH-1)});
 return points.map((p,i)=>({id:`column-bar:${i}`,u:center.u+c*p.u-s*p.v,v:center.v+s*p.u+c*p.v,diameter}));
}
export function circleColumnBars(shape:Extract<ColumnShape,{kind:"circle"}>,diameter:number,count:number,cover:number,tieDiameter:number):ColumnBar[]{
 if(!Number.isSafeInteger(count)||count<6||count>40||count%2||diameter<14||diameter>32||cover<=0||tieDiameter<8)throw Error("Dairesel kolon donatı profili geçersiz.");const r=shape.diameter/2-cover-tieDiameter-diameter/2,center=shape.center??{u:0,v:0};if(r<=0)throw Error("Donatı dairesel kesite sığmıyor.");
 return Array.from({length:count},(_,i)=>({id:`column-bar:${i}`,u:center.u+r*Math.cos(i*2*Math.PI/count),v:center.v+r*Math.sin(i*2*Math.PI/count),diameter}));
}
export function columnDetailing(input:{shape:ColumnShape;bars:ColumnBar[];material:BeamMaterial;tie:ColumnTie;cover:number;aggregate:number;clearLengthMm:number;highDuctility:boolean;NmaxKn:number;GQEmaxKn:number;shortColumn:boolean;cantilever:boolean;foundationEmbedMm:number|null;laps:ColumnLap[];development:{required:boolean;availableMm:number;offsetMm:number;transitionHeightMm:number;source:string}}){
 const model=columnBarGeometry(input.shape,input.bars),g=model.geometry,m=beamMaterial(input.material),t=input.tie,high=input.highDuctility,minDim=input.shape.kind==="rectangle"?Math.min(input.shape.b,input.shape.h):input.shape.kind==="circle"?input.shape.diameter:Math.min(g.widthU,g.widthV),maxDim=input.shape.kind==="rectangle"?Math.max(input.shape.b,input.shape.h):input.shape.kind==="circle"?input.shape.diameter:Math.max(g.widthU,g.widthV),phiMin=Math.min(...input.bars.map(b=>b.diameter)),phiMax=Math.max(...input.bars.map(b=>b.diameter));
 if(![input.cover,input.aggregate,input.clearLengthMm,t.diameter,t.endSpacingMm,t.middleSpacingMm,t.coreB,t.coreH,t.legsU,t.legsV,t.maxUnsupportedSpacingMm].every(Number.isFinite)||input.cover<=0||input.aggregate<=0||input.clearLengthMm<=0||!t.source?.trim()||!Number.isSafeInteger(t.legsU)||!Number.isSafeInteger(t.legsV)||t.legsU<2||t.legsV<2||t.diameter<8||t.endSpacingMm<=0||t.middleSpacingMm<=0)throw Error("Kolon örtü/etriye geometrisi/kaynağı eksik.");
 const rho=model.steelArea/g.area,geometricMinimum=input.shape.kind==="circle"?(high?350:300):high?300:250;
 const checks:{id:string;passed:boolean;observed:unknown;limit:unknown;clause:string}[]=[];
 const add=(id:string,passed:boolean,observed:unknown,limit:unknown,clause:string)=>checks.push({id,passed,observed,limit,clause});
 add("geometry",minDim>=geometricMinimum,minDim,geometricMinimum,"TS500-7.4/TBDY7.3.1.1");add("longitudinal_ratio",rho>=.01&&rho<=.04,rho,[.01,.04],"TBDY7.3.2.1/TS500-7.8/7.9");
 add("axial_limit",input.NmaxKn*1000<=.9*m.fcd*g.area&&(!high||Math.max(input.NmaxKn,input.GQEmaxKn)*1000<=.4*m.fck*g.area),{NmaxKn:input.NmaxKn,GQEmaxKn:input.GQEmaxKn},{TS500:.9*m.fcd*g.area/1000,TBDY:.4*m.fck*g.area/1000},"TS500-7.7/TBDY7.3.1.2; conservative all-ULS upper bound");
 add("longitudinal_diameter_count",phiMin>=14&&(input.shape.kind!=="circle"||input.bars.length>=6),{phiMin,count:input.bars.length},null,"TS500-7.4.1/TBDY7.3.2.1");
 const minGap=Math.min(...model.bars.flatMap((a,i)=>model.bars.slice(i+1).map(b=>Math.hypot(a.u-b.u,a.v-b.v)-(a.diameter+b.diameter)/2))),clearRequired=Math.max(40,1.5*phiMax,4*input.aggregate/3),actualCover=Math.min(...model.bars.map(b=>b.clearCover));
 add("spacing_cover",minGap>=clearRequired&&actualCover>=input.cover+t.diameter-1e-7,{minGap,actualCover},{clearRequired,longitudinalCover:input.cover+t.diameter},"TS500-9.5.1/9.5.2");
 const paths=columnTieGeometry(input.shape,input.bars,t);
 add("lateral_bar_restraint",input.bars.every(b=>paths.restrainedBarIds.includes(b.id))&&paths.maximumLegGapMm<=Math.min(300,high?25*t.diameter:300),paths,high?25*t.diameter:300,"TBDY7.3.4/TS500-7.4.1");

 const endZone=input.shortColumn?input.clearLengthMm:Math.max(input.clearLengthMm/6,1.5*maxDim,500,input.cantilever?2*maxDim:0),endLimit=high?Math.min(minDim/3,150,6*phiMin):Math.min(200,12*phiMin),middleLimit=high?Math.min(minDim/2,200):Math.min(200,12*phiMin);
 add("tie_diameter_spacing",t.diameter>=Math.max(8,high?8:phiMax/3)&&t.endSpacingMm<=endLimit&&(!high||t.endSpacingMm>=50)&&t.middleSpacingMm<=middleLimit,{diameter:t.diameter,end:t.endSpacingMm,middle:t.middleSpacingMm},{endLimit,middleLimit},"TBDY7.3.4.1/2/TS500-7.4.1");
 const factor=Math.max(input.NmaxKn,input.GQEmaxKn)*1000>.2*g.area*m.fck?1:2/3,hoopArea=barArea(t.diameter);let requiredU:number,requiredV:number,providedU:number,providedV:number;
 if(input.shape.kind==="circle"){
  if(t.kind!=="circular_hoop"||Math.abs(t.coreB-t.coreH)>1e-6||t.coreB<=0||Math.abs(t.coreB-(input.shape.diameter-2*input.cover))>1e-6)throw Error("Dairesel çekirdek/çember geometrisi geçersiz.");
  const coreArea=Math.PI*t.coreB**2/4,requiredRho=factor*Math.max(.45*(g.area/coreArea-1)*m.fck/m.fywk,.12*m.fck/m.fywk),providedRho=4*hoopArea/(t.coreB*t.endSpacingMm);requiredU=requiredV=requiredRho;providedU=providedV=providedRho;
 }else{
  if(input.shape.kind!=="rectangle")throw Error("Poligon/dönük kolon etriye sarılma geometrisi için doğrulanmış özel detay gerekli.");
  if(t.kind!=="rectangular"||t.coreB<=0||t.coreH<=0||Math.abs(t.coreB-(input.shape.b-2*input.cover))>1e-6||Math.abs(t.coreH-(input.shape.h-2*input.cover))>1e-6)throw Error("Dikdörtgen çekirdek sınırı geçersiz.");const Ack=t.coreB*t.coreH;
  requiredU=factor*Math.max(.30*t.endSpacingMm*t.coreB*(g.area/Ack-1)*m.fck/m.fywk,.075*t.endSpacingMm*t.coreB*m.fck/m.fywk);requiredV=factor*Math.max(.30*t.endSpacingMm*t.coreH*(g.area/Ack-1)*m.fck/m.fywk,.075*t.endSpacingMm*t.coreH*m.fck/m.fywk);providedU=t.legsU*hoopArea;providedV=t.legsV*hoopArea;
 }
 if(high)add("confinement_steel",providedU>=requiredU&&providedV>=requiredV,{providedU,providedV},{requiredU,requiredV,factor},"TBDY7.1/7.2");
 add("hooks",t.hookAngleDeg===135&&t.hookTailMm>=Math.max(6*t.diameter,80)&&t.innerBendDiameterMm>=5*t.diameter,{angle:t.hookAngleDeg,tail:t.hookTailMm,bend:t.innerBendDiameterMm},null,"TBDY7.2.8");
 if(input.foundationEmbedMm!==null)add("foundation_ties",input.foundationEmbedMm>=minDim,input.foundationEmbedMm,minDim,"TBDY7.3.4.1");
 const lapChecks=input.laps.map(l=>{if(!l.source.trim()||!l.barIds.length||l.barIds.some(id=>!input.bars.some(b=>b.id===id))||!Number.isFinite(l.startMm)||!Number.isFinite(l.lengthMm)||l.lengthMm<=0||!Number.isFinite(l.addedSteelAreaMm2)||l.addedSteelAreaMm2<0)throw Error("Kolon bindirme yerleşimi geçersiz.");
  const required=Math.max(...l.barIds.map(id=>{const b=input.bars.find(b=>b.id===id)!;return anchorageLength(b.diameter,input.material,"II",input.cover,minGap).lb;})),end=l.startMm+l.lengthMm,rhoLap=(model.steelArea+l.addedSteelAreaMm2)/g.area;
  const passed=l.startMm>=input.clearLengthMm/3&&end<=2*input.clearLengthMm/3&&l.lengthMm>=required&&l.spacingMm<=Math.min(minDim/3,150)&&rhoLap<=.06;return {...l,required,rhoLap,passed};});
 if(input.laps.length)add("laps",lapChecks.every(l=>l.passed),lapChecks,null,"TBDY7.3.3.1/7.3.2.2");
 if(!input.development.source?.trim())throw Error("Kolon devam/kenetlenme kararı kaynağı gerekli.");
 if(![input.development.availableMm,input.development.offsetMm,input.development.transitionHeightMm].every(Number.isFinite)||input.development.offsetMm<0||input.development.transitionHeightMm<=0)throw Error("Kolon geçiş geometrisi geçersiz.");
 const developmentRequired=Math.max(...input.bars.map(b=>Math.max(1.5*anchorageLength(b.diameter,input.material,"II",input.cover,minGap).lb,40*b.diameter)));
 add("development_transition",(!input.development.required||input.development.availableMm>=developmentRequired)&&input.development.offsetMm<=input.development.transitionHeightMm/6,input.development,developmentRequired,"TBDY7.3.3.2");
 return {checks,passed:checks.every(c=>c.passed),endZoneMm:endZone,tiePaths:paths,tieLocations:stirrupLocations(input.clearLengthMm,endZone/2,t.endSpacingMm,input.shortColumn?t.endSpacingMm:t.middleSpacingMm),requiredU,requiredV,providedU,providedV,rho,minGap,actualCover,lapChecks,steelAreaMm2:model.steelArea,confinementFactor:factor,hookAndTieLayoutSource:t.source,finalFabricationQuantityApproved:false};
}

export function columnTieGeometry(shape:ColumnShape,bars:ColumnBar[],tie:ColumnTie){
 const model=columnBarGeometry(shape,bars);
 if(shape.kind==="circle"){
  if(tie.crossTies.length||tie.kind!=="circular_hoop")throw Error("Dairesel kolon tam çevre çemberi gerektirir.");
  const angles=model.bars.map(b=>Math.atan2(b.v,b.u)).sort((a,b)=>a-b),r=Math.max(...model.bars.map(b=>Math.hypot(b.u,b.v)));
  if(model.bars.some(b=>Math.abs(Math.hypot(b.u,b.v)-(tie.coreB/2-tie.diameter-b.diameter/2))>1e-6))throw Error("Daire boyuna donatısı gerçek çember çekirdeği çevresinde olmalı.");
  const maximumLegGapMm=Math.max(...angles.map((a,i)=>2*r*Math.sin(((i===angles.length-1?angles[0]+2*Math.PI:angles[i+1])-a)/2)));
  return {restrainedBarIds:bars.map(b=>b.id),legsU:2,legsV:2,maximumLegGapMm,kind:"continuous-circular-hoop"};
 }
 if(shape.kind!=="rectangle")throw Error("Genel poligon sarılma donatısı özel yerleşim doğrulaması gerektirir.");
 const c=Math.cos(shape.angleRad),s=Math.sin(shape.angleRad),points=model.bars.map(b=>({...b,u:c*b.u+s*b.v,v:-s*b.u+c*b.v})),maxU=Math.max(...points.map(b=>Math.abs(b.u))),maxV=Math.max(...points.map(b=>Math.abs(b.v))),corners=points.filter(b=>Math.abs(Math.abs(b.u)-maxU)<1e-6&&Math.abs(Math.abs(b.v)-maxV)<1e-6);
 if(corners.length!==4)throw Error("Dört fiziksel kolon köşesinde boyuna donatı gerekli.");
 const restrained=new Set(corners.map(b=>b.id)),used=new Set<string>(),uLegs=[-tie.coreH/2,tie.coreH/2],vLegs=[-tie.coreB/2,tie.coreB/2];
 for(const path of tie.crossTies){const a=points.find(b=>b.id===path.fromBarId),b=points.find(b=>b.id===path.toBarId),key=[path.fromBarId,path.toBarId].sort().join(":");
  if(!path.id||!a||!b||a.id===b.id||used.has(key))throw Error("Çiroz fiziksel uçları/tekil yolu geçersiz.");used.add(key);
  if(Math.abs(a.v-b.v)<1e-6&&a.u*b.u<0){if(corners.includes(a)&&corners.includes(b))throw Error("Dış etriye kolu çiroz olarak ikinci kez sayılamaz.");uLegs.push(a.v);}
  else if(Math.abs(a.u-b.u)<1e-6&&a.v*b.v<0){if(corners.includes(a)&&corners.includes(b))throw Error("Dış etriye kolu çiroz olarak ikinci kez sayılamaz.");vLegs.push(a.u);}
  else throw Error("Bu profilde çiroz iki karşı yüz arasında gerçek paralel kol olmalı.");restrained.add(a.id);restrained.add(b.id);
 }
 const maxGap=(values:number[])=>{const ordered=values.sort((a,b)=>a-b);return Math.max(...ordered.slice(1).map((v,i)=>v-ordered[i]));},maximumLegGapMm=Math.max(maxGap(uLegs),maxGap(vLegs));
 if(tie.legsU!==uLegs.length||tie.legsV!==vLegs.length||tie.restrainedBarIds.some(id=>!restrained.has(id))||new Set(tie.restrainedBarIds).size!==restrained.size||tie.maxUnsupportedSpacingMm+1e-7<maximumLegGapMm)throw Error("Etriye kolu/tutulan donatı/aralık beyanı gerçek çiroz yollarıyla uyuşmuyor.");
 return {restrainedBarIds:[...restrained],legsU:uLegs.length,legsV:vLegs.length,maximumLegGapMm,paths:tie.crossTies,kind:"outer-rectangle-and-explicit-cross-ties"};
}

export function automatedColumnTie(shape:ColumnShape,bars:ColumnBar[],template:ColumnTie):ColumnTie{
 const g=columnBarGeometry(shape,bars),result={...template,restrainedBarIds:bars.map(b=>b.id),crossTies:[] as ColumnTie["crossTies"]};
 if(shape.kind==="circle"){const points=g.bars.map(b=>Math.atan2(b.v,b.u)).sort((a,b)=>a-b),r=Math.max(...g.bars.map(b=>Math.hypot(b.u,b.v)));return {...result,legsU:2,legsV:2,maxUnsupportedSpacingMm:Math.max(...points.map((v,i)=>2*r*Math.sin(((i===points.length-1?points[0]+2*Math.PI:points[i+1])-v)/2))),source:`${template.source}; actual generated circular hoop`};}
 if(shape.kind!=="rectangle")throw Error("Otomatik kolon sarılması yalnız dikdörtgen/daire profilinde.");
 const c=Math.cos(shape.angleRad),s=Math.sin(shape.angleRad),points=g.bars.map(b=>({...b,u:c*b.u+s*b.v,v:-s*b.u+c*b.v})),maxU=Math.max(...points.map(b=>Math.abs(b.u))),maxV=Math.max(...points.map(b=>Math.abs(b.v))),uLegs=[-template.coreH/2,template.coreH/2],vLegs=[-template.coreB/2,template.coreB/2];
 for(const a of points){if(Math.abs(Math.abs(a.u)-maxU)<1e-6&&Math.abs(Math.abs(a.v)-maxV)<1e-6)continue;
  if(a.u<0&&Math.abs(Math.abs(a.u)-maxU)<1e-6){const b=points.find(b=>Math.abs(b.u+a.u)<1e-6&&Math.abs(b.v-a.v)<1e-6);if(!b)throw Error("Karşı kolon çiroz ucu bulunamadı.");result.crossTies.push({id:`crossU:${a.id}`,fromBarId:a.id,toBarId:b.id});uLegs.push(a.v);}
  if(a.v<0&&Math.abs(Math.abs(a.v)-maxV)<1e-6){const b=points.find(b=>Math.abs(b.v+a.v)<1e-6&&Math.abs(b.u-a.u)<1e-6);if(!b)throw Error("Karşı kolon çiroz ucu bulunamadı.");result.crossTies.push({id:`crossV:${a.id}`,fromBarId:a.id,toBarId:b.id});vLegs.push(a.u);}
 }
 const gap=(a:number[])=>{a.sort((x,y)=>x-y);return Math.max(...a.slice(1).map((v,i)=>v-a[i]));};
 return {...result,legsU:uLegs.length,legsV:vLegs.length,maxUnsupportedSpacingMm:Math.max(gap(uLegs),gap(vLegs)),source:`${template.source}; actual generated rectangular cross-ties`};
}
