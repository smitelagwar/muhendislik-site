import {prepareWallSection,type WallSection} from "./wall-section";
import {columnTieGeometry,type ColumnTie} from "./column-detailing";
import {beamAnchorage,anchorageLength,type Anchorage} from "./beam-detailing";
import {barArea,beamMaterial,type BeamMaterial} from "./rc-beam-section";
import type {ColumnShape} from "./rc-column-section";
export type WallDetail={coverMm:number;aggregateMm:number;horizontalDiameter:number;horizontalSpacingMm:number;webBarIds:string[];
 boundaries:{id:string;shape:Extract<ColumnShape,{kind:"rectangle"}>;barIds:string[];tie:ColumnTie}[];
 webLinks:{id:string;frontBarId:string;backBarId:string;zMm:number;diameter:number;hookAngle:number;tailMm:number;bendDiameterMm:number}[];
 horizontalAnchors:{left:Anchorage;right:Anchorage};verticalAnchors:{foundationDepthMm:number;topStraightMm:number;topTailMm:number;topInnerBendDiameterMm:number;source:string};
 laps:readonly unknown[];source:string};
export function criticalWallHeight(lengthMm:number,heightMm:number){if(![lengthMm,heightMm].every(v=>Number.isFinite(v)&&v>0))throw Error("Gerçek perde boyu/yüksekliği gerekli.");return Math.min(2*lengthMm,Math.max(lengthMm,heightMm/6));}
export function wallDetailing(section:WallSection,material:BeamMaterial,heightMm:number,storeyHeightsMm:number[],detail:WallDetail){
 const p=prepareWallSection(section,material),m=beamMaterial(material);
 if(section.cells.length!==1||Math.abs(section.cells[0].shape.angleRad)>1e-9)return {status:"requires_engineering" as const,reason:"L/T/U ortak N-M hesaplanır; özel uç bölgesi/etkin kol ve çiroz detayı otomatik dikdörtgen profilinde değil."};
 const shape=section.cells[0].shape,L=shape.b,t=shape.h,center=shape.center??{u:0,v:0},Hcr=criticalWallHeight(L,heightMm),slender=heightMm/L>2,checks:{id:string;passed:boolean;observed:unknown;limit:unknown;clause:string}[]=[],add=(id:string,passed:boolean,observed:unknown,limit:unknown,clause:string)=>checks.push({id,passed,observed,limit,clause});
 if(!detail.source?.trim()||![detail.coverMm,detail.aggregateMm,detail.horizontalDiameter,detail.horizontalSpacingMm,heightMm,...storeyHeightsMm].every(v=>Number.isFinite(v)&&v>0))throw Error("Kaynaklı gerçek perde donatı/detay ölçüleri gerekli.");
 add("wall_geometry",L/t>=6&&t>=Math.max(250,...storeyHeightsMm.map(h=>h/16),L/30),{L,t,storeyHeightsMm},null,"TBDY7.6.1.2; no special thickness reduction");
 add("cover",detail.coverMm>=25&&p.bars.every(b=>Math.min(L/2-Math.abs(b.u),t/2-Math.abs(b.v))-b.diameter/2>=detail.coverMm+detail.horizontalDiameter-1e-7),detail.coverMm,25,"TS500-9.5.1; conservative outside cover and outer hoop");
 const zoneLength=slender?Math.max(.2*L,2*t):0;
 if(detail.boundaries.length!==(slender?2:0))throw Error("Perde narinliğine göre gerçek iki uç bölgesi veya tam gövde gerekli.");
 const used=new Set<string>(),boundaryResults=detail.boundaries.map((b,i)=>{
  if(!b.id||b.shape.kind!=="rectangle"||Math.abs(b.shape.angleRad)>1e-9||b.shape.h!==t||b.shape.b<zoneLength||Math.abs((b.shape.center?.v??0)-center.v)>1e-7||Math.abs((b.shape.center?.u??0)-(center.u+(i===0?-1:1)*(L-b.shape.b)/2))>1e-6)throw Error("Gerçek uç bölgesi duvar ucuna oturmuyor/alanı yetersiz.");
  const bars=b.barIds.map(id=>{const bar=section.bars.find(x=>x.id===id);if(!bar||used.has(id))throw Error("Uç bölgesi donatısı kayıp/iki kez sayıldı.");used.add(id);return bar;}),paths=columnTieGeometry(b.shape,bars,b.tie),area=bars.reduce((s,b)=>s+barArea(b.diameter),0),tie=b.tie,phiMin=Math.min(...bars.map(b=>b.diameter)),phiMax=Math.max(...bars.map(b=>b.diameter));
  const requiredU=2/3*.075*tie.endSpacingMm*tie.coreB*m.fck/m.fywk,requiredV=2/3*.075*tie.endSpacingMm*tie.coreH*m.fck/m.fywk;
  const rho=area/(b.shape.b*t),passed=area>=.002*p.area&&bars.length>=4&&phiMin>=14&&rho<=.03&&tie.kind==="rectangular"&&Math.abs(tie.coreB-(b.shape.b-2*detail.coverMm))<1e-7&&Math.abs(tie.coreH-(t-2*detail.coverMm))<1e-7&&tie.diameter>=8&&tie.endSpacingMm>=50&&tie.endSpacingMm<=Math.min(150,6*phiMin,t/3)&&tie.middleSpacingMm<=Math.min(t,200)&&paths.maximumLegGapMm<=25*tie.diameter&&paths.restrainedBarIds.length===bars.length&&paths.legsU*barArea(tie.diameter)>=requiredU&&paths.legsV*barArea(tie.diameter)>=requiredV&&tie.hookAngleDeg===135&&tie.hookTailMm>=Math.max(80,6*tie.diameter)&&tie.innerBendDiameterMm>=5*tie.diameter;
  add(`boundary:${b.id}`,passed,{area,rho,phiMin,phiMax,paths,requiredU,requiredV},null,"TBDY7.6.2.3/7.6.5; critical detailing retained over full height");return {id:b.id,area,rho,passed,shape:b.shape,requiredU,requiredV};});
 if(slender&&detail.boundaries[0].shape.b+detail.boundaries[1].shape.b>=L)throw Error("Uç bölgeleri kesişiyor; özel tüm-kesit sarılma hesabı gerekli.");
 const webLeft=center.u-L/2+(slender?detail.boundaries[0].shape.b:0),webRight=center.u+L/2-(slender?detail.boundaries[1].shape.b:0),webLength=webRight-webLeft;
 if(new Set(detail.webBarIds).size!==detail.webBarIds.length||!detail.webBarIds.length)throw Error("Gerçek tekil gövde düşey donatısı gerekli.");
 const web=detail.webBarIds.map(id=>{const bar=section.bars.find(b=>b.id===id);if(!bar||used.has(id)||bar.u<=webLeft||bar.u>=webRight)throw Error("Gövde donatısı uç bölgesine taşmış/kayıp/iki kez sayıldı.");used.add(id);return bar;});
 if(used.size!==section.bars.length)throw Error("Her fiziksel düşey donatı gövde veya bir uç bölgesinde sayılmalı.");
 const horizontalRho=2*barArea(detail.horizontalDiameter)/(t*detail.horizontalSpacingMm),verticalRho=web.reduce((s,b)=>s+barArea(b.diameter),0)/(t*webLength),front=web.filter(b=>b.v>center.v).sort((a,b)=>a.u-b.u),back=web.filter(b=>b.v<center.v).sort((a,b)=>a.u-b.u);
 const gap=(bars:typeof web)=>Math.max(0,...bars.slice(1).map((b,i)=>b.u-bars[i].u),bars[0]?.u-webLeft,webRight-bars.at(-1)!.u);
 add("web_ratio_spacing",horizontalRho>=.0025&&verticalRho>=.0025&&detail.horizontalDiameter>=8&&detail.horizontalSpacingMm<=250&&front.length===back.length&&front.length>0&&Math.max(gap(front),gap(back))<=250&&web.every(b=>b.diameter>=8),{horizontalRho,verticalRho},.0025,"TBDY7.6.3.1; no reduction");
 if(!front.length||front.length!==back.length)throw Error("Gerçek iki yüz gövde ağı eksik.");
 if(new Set(detail.webLinks.map(l=>l.id)).size!==detail.webLinks.length||detail.webLinks.length>30000)throw Error("Tekil/sınırlı deprem çirozu kimliği gerekli.");
 const linkKeys=new Set<string>();for(const link of detail.webLinks){const a=front.find(b=>b.id===link.frontBarId),b=back.find(b=>b.id===link.backBarId),key=`${link.frontBarId}:${link.backBarId}:${link.zMm}`;
  if(!link.id||!a||!b||Math.abs(a.u-b.u)>1e-7||!Number.isFinite(link.zMm)||link.zMm<detail.coverMm+link.diameter/2||link.zMm>heightMm-detail.coverMm-link.diameter/2||linkKeys.has(key))throw Error("Gerçek iki yüzü bağlamayan/tekrar/örtü dışındaki gövde çirozu.");linkKeys.add(key);
  add(`link:${link.id}`,link.diameter>=detail.horizontalDiameter&&link.hookAngle===135&&link.tailMm>=Math.max(80,6*link.diameter)&&link.bendDiameterMm>=5*link.diameter,link,null,"TBDY7.6.3.3/7.2.8");
 }
 for(let i=0;i<front.length;i++){const a=front[i],b=back.find(b=>Math.abs(b.u-a.u)<1e-7);if(!b)throw Error("Karşı yüzde gövde barı eksik.");const links=detail.webLinks.filter(l=>l.frontBarId===a.id&&l.backBarId===b.id).sort((a,b)=>a.zMm-b.zMm);if(!links.length)throw Error("Gövde barının gerçek çirozları eksik.");const width=(i===front.length-1?webRight:(a.u+front[i+1].u)/2)-(i===0?webLeft:(a.u+front[i-1].u)/2);
  links.forEach((link,j)=>{const lo=j===0?0:(links[j-1].zMm+link.zMm)/2,hi=j===links.length-1?heightMm:(link.zMm+links[j+1].zMm)/2,density=lo<Hcr?10:4;add(`link_area:${link.id}`,width*(hi-lo)<=1e6/density,{width,height:hi-lo},1e6/density,"TBDY7.6.3.3; actual tributary area, not only total count");});
 }
 const minGap=Math.min(...section.bars.flatMap((a,i)=>section.bars.slice(i+1).map(b=>Math.hypot(a.u-b.u,a.v-b.v)-(a.diameter+b.diameter)/2))),phiMax=Math.max(...section.bars.map(b=>b.diameter));add("vertical_clear_spacing",minGap>=Math.max(40,1.5*phiMax,4*detail.aggregateMm/3),minGap,null,"TS500-9.5.2; conservative column gap");
 const horizontalAnchors=(["left","right"] as const).map((side,i)=>{const a=detail.horizontalAnchors[side],r=beamAnchorage(a,detail.horizontalDiameter,material,"I",false,false),pocket=slender?detail.boundaries[i].shape.b:Math.max(2*t,.2*L);const fits=a.kind==="hook90"&&a.horizontalMm<=pocket-2*detail.coverMm&&a.verticalMm<=t-2*detail.coverMm&&a.coverMm>=detail.coverMm;add(`horizontal_anchor:${side}`,r.passed&&fits,{a,r,pocket},null,"TBDY7.6.4/TS500-9; physical in-section 90° return");return {side,...r,fits};});
 const va=detail.verticalAnchors;if(!va.source?.trim()||![va.foundationDepthMm,va.topStraightMm,va.topTailMm,va.topInnerBendDiameterMm].every(v=>Number.isFinite(v)&&v>0))throw Error("Gerçek düşey kenetlenme geometrisi gerekli.");
 const verticalAnchors=section.bars.map(b=>{const lb=anchorageLength(b.diameter,material,"I",detail.coverMm,minGap).lb,top=beamAnchorage({kind:"hook90",horizontalMm:va.topStraightMm,verticalMm:va.topTailMm,innerBendDiameterMm:va.topInnerBendDiameterMm,coverMm:detail.coverMm,clearSpacingMm:minGap,source:va.source},b.diameter,material,"I",false,false),availableTail=L/2+Math.abs(b.u-center.u)-detail.coverMm;
  return {barId:b.id,lb,top,passed:va.foundationDepthMm>=Math.max(lb,300,t)&&va.topStraightMm<=Math.min(...storeyHeightsMm)-2*detail.coverMm&&va.topTailMm<=availableTail&&top.passed};});
 add("vertical_anchors",verticalAnchors.every(a=>a.passed),verticalAnchors,null,"TS500-9/TBDY7.6.5.2; straight foundation pocket and inward top hook");
 if(detail.laps.length)return {status:"requires_engineering" as const,checks,reason:"Gerçek ekli çubuk/şaşırtma/kalabalık yerleşimi bu sürekli bar profilinde desteklenmiyor."};
 return {status:checks.every(c=>c.passed)?"passed" as const:"failed" as const,checks,HcrMm:Hcr,slender,zoneLengthMm:zoneLength,boundaryResults,webLengthMm:webLength,horizontalRho,verticalRho,horizontalAnchors,verticalAnchors,conservativeCriticalDetailOverFullHeight:true,finalFabricationQuantityApproved:false};
}
