import { polygonLamina, combineLaminas } from "./mass-properties";
import type { Point } from "../model";

export const STANDARD_GRAVITY=9.80665;
export type LoadPatch = {
  id:string; physicalLoadId:string; caseId:string; elementId:string; floorId:string; kind:"self_weight"|"dead"|"finish"|"live"|"wall"|"soil"|"water"|"snow"|"wind"|"other";
  direction:[number,number,number];
  provenance:{source:"user_input"|"native_decoded"|"derived";evidence:string|null};
  basis:"area"|"line"|"point"|"volume";
  intensity:number; unit:"kN/m2"|"tf/m2"|"kN/m"|"kN"|"kN/m3";
  measure:number; position:Point; footprint?:Point[]; holes?:Point[][];
  line?:[Point,Point];
  jointId?:string;
  prismHeightM?:number;
  massParticipation:number|null;
  selfWeightIncluded:boolean|null;
  loadPath:"direct_surface"|"one_way_transfer";
};

/** Explicit applied-load ledger. No automatic native G, mass fraction, or self-weight default. */
export function buildLoadLedger(patches:LoadPatch[]) {
  if(new Set(patches.map(p=>p.id)).size!==patches.length) throw new Error("Yinelenen yük kimliği.");
  if(new Set(patches.map(p=>p.physicalLoadId)).size!==patches.length) throw new Error("Aynı fiziksel yük farklı yol/kimlikle iki kez uygulandı.");
  const totals:Record<string,number>=Object.create(null), totalsByCase:Record<string,number>=Object.create(null),masses:ReturnType<typeof polygonLamina>[]=[];
  const floorMasses=new Map<string,ReturnType<typeof polygonLamina>[]>();
  const records=patches.map(p=>{
    const oldMassCount=masses.length;
    let applicationCenter=p.position;
    if([p.id,p.physicalLoadId,p.caseId,p.elementId,p.floorId].some(s=>typeof s!=="string"||!s.trim()) || !Number.isFinite(p.intensity)||!Number.isFinite(p.measure)||p.measure<=0
      || !Number.isFinite(p.position.x)||!Number.isFinite(p.position.y)) throw new Error("Yük kimliği/ölçüsü geçersiz.");
    if(!["self_weight","dead","finish","live","wall","soil","water","snow","wind","other"].includes(p.kind)||!["direct_surface","one_way_transfer"].includes(p.loadPath))throw new Error("Yük türü/aktarımı desteklenmiyor.");
    if(p.provenance.source==="native_decoded") throw new Error("Native G/Q semantiği kabulü eksik; ham gözlem solver yükü değildir.");
    if(!["user_input","derived"].includes(p.provenance.source)) throw new Error("Yük kaynağı bilinmiyor.");
    if(!Array.isArray(p.direction)||p.direction.length!==3||p.direction.some(n=>!Number.isFinite(n))||Math.abs(Math.hypot(...p.direction)-1)>1e-10) throw new Error("Birim yük yönü gerekli.");
    if(typeof p.selfWeightIncluded!=="boolean") throw new Error("Öz ağırlık anlamı bilinmiyor; G otomatik aktarılamaz.");
    if(p.kind==="self_weight" && p.selfWeightIncluded) throw new Error("Öz ağırlık ikinci kez eklenemez.");
    if(p.massParticipation===null||!Number.isFinite(p.massParticipation)||p.massParticipation<0||p.massParticipation>1) throw new Error("Kütle katılımı bilinmiyor/geçersiz.");
    const required={area:["kN/m2","tf/m2"],line:["kN/m"],point:["kN"],volume:["kN/m3"]}[p.basis];
    if(!required?.includes(p.unit)) throw new Error("Yük dağılımı/birimi uyuşmuyor.");
    if(p.basis==="point"&&p.measure!==1) throw new Error("Nokta yüküne alan/boy çarpanı uygulanamaz.");
    if(p.basis==="area"||p.basis==="volume") {
      if(!p.footprint) throw new Error("Yük için gerçek poligon gerekli.");
      const area=polygonLamina(p.footprint,1,p.holes).areaM2;
      applicationCenter=polygonLamina(p.footprint,1,p.holes).center;
      if(p.basis==="volume"&&(!Number.isFinite(p.prismHeightM)||p.prismHeightM!<=0)) throw new Error("Hacim yükü için açık prizma yüksekliği gerekir.");
      const measured=area*(p.basis==="volume"?p.prismHeightM!:1);
      if(Math.abs(measured-p.measure)>1e-8*Math.max(1,p.measure)) throw new Error("Yük ölçüsü ile geometri uyuşmuyor.");
    }
    if(p.basis==="line"&&(!p.line||Math.abs(Math.hypot(p.line[1].x-p.line[0].x,p.line[1].y-p.line[0].y)-p.measure)>1e-8*Math.max(1,p.measure))) throw new Error("Çizgi uçları/boyu uyuşmuyor.");
    if(p.basis==="line"&&p.line)applicationCenter={x:(p.line[0].x+p.line[1].x)/2,y:(p.line[0].y+p.line[1].y)/2};
    const loadKn=p.intensity*(p.unit==="tf/m2"?STANDARD_GRAVITY:1)*p.measure;
    if(!Number.isFinite(loadKn)) throw new Error("Yük taşması.");
    const massKg=Math.max(0,loadKn)*(1000*p.massParticipation/STANDARD_GRAVITY);
    if(!Number.isFinite(massKg)) throw new Error("Kütle taşması.");
    if(p.massParticipation>0 && (p.direction[0]!==0||p.direction[1]!==0||p.direction[2]!==-1)) throw new Error("Kütleye katılan yük açık düşey ağırlık olmalıdır.");
    // Upward force is retained, never converted to a negative mass.
    if(p.massParticipation>0 && loadKn<0) throw new Error("Negatif yük kütleye sessizce çevrilemez.");
    if(massKg>0) {
      if(p.basis==="area"||p.basis==="volume") {
        if(!p.footprint) throw new Error("Yüzey kütlesi için gerçek poligon gerekli.");
        const a=polygonLamina(p.footprint,1,p.holes);
        if(p.basis==="area" && Math.abs(a.areaM2-p.measure)>1e-8*Math.max(1,p.measure)) throw new Error("Yük alanı ile poligon alanı farklı.");
        masses.push(polygonLamina(p.footprint,massKg/a.areaM2,p.holes));
      } else if(p.basis==="point") masses.push({areaM2:0,massKg,center:p.position,polarKgM2:0});
      else {
        if(!p.line) throw new Error("Çizgi kütlesi için iki gerçek uç gerekli.");
        const [a,b]=p.line,L=Math.hypot(b.x-a.x,b.y-a.y);
        if(!Number.isFinite(L)||Math.abs(L-p.measure)>1e-8*Math.max(1,p.measure)) throw new Error("Çizgi boyu/ölçüsü uyuşmuyor.");
        masses.push({areaM2:0,massKg,center:{x:(a.x+b.x)/2,y:(a.y+b.y)/2},polarKgM2:massKg*L*L/12});
      }
    }
    totals[p.kind]=(totals[p.kind]??0)+loadKn;
    if(masses.length>oldMassCount){const group=floorMasses.get(p.floorId)??[];group.push(masses.at(-1)!);floorMasses.set(p.floorId,group);}
    totalsByCase[p.caseId]=(totalsByCase[p.caseId]??0)+loadKn;
    if(!Number.isFinite(totals[p.kind])||!Number.isFinite(totalsByCase[p.caseId]))throw new Error("Yük toplamında sayı taşması.");
    return {...structuredClone(p),applicationCenter,loadKn,forceKn:p.direction.map(d=>d*loadKn),massKg};
  });
  // Same physical self-weight cannot be both declared in G and generated separately.
  for(const p of patches.filter(p=>p.kind==="self_weight")) if(patches.some(q=>q.elementId===p.elementId&&q.kind!=="self_weight"&&q.selfWeightIncluded)) throw new Error("G içinde bulunan öz ağırlık ayrıca üretilemez.");
  const weights=patches.filter(p=>p.kind==="self_weight");
  if(new Set(weights.map(p=>p.elementId)).size!==weights.length) throw new Error("Aynı elemanın öz ağırlığı iki kez üretildi.");
  return {schemaVersion:1,records,totals,totalsByCase,massByFloor:Object.fromEntries([...floorMasses].sort(([a],[b])=>a.localeCompare(b)).map(([id,parts])=>[id,combineLaminas(parts)])),mass: masses.length?combineLaminas(masses):null,
    analysisApproved:false,sourceSemantics:"explicit_only"};
}

export function prismaticSelfWeight(id:string,elementId:string,floorId:string,footprint:Point[],heightM:number,densityKgM3:number,holes:Point[][]=[]):LoadPatch {
  if(!Number.isFinite(heightM)||heightM<=0||!Number.isFinite(densityKgM3)||densityKgM3<=0) throw new Error("Öz ağırlık için açık pozitif yükseklik/yoğunluk gerekir.");
  const shape=polygonLamina(footprint,1,holes);
  return {id,physicalLoadId:id,caseId:"G",elementId,floorId,kind:"self_weight",direction:[0,0,-1],provenance:{source:"derived",evidence:"explicit uniform vertical prism geometry and density"},basis:"volume",intensity:densityKgM3*STANDARD_GRAVITY/1000,unit:"kN/m3",measure:shape.areaM2*heightM,position:shape.center,footprint,holes,prismHeightM:heightM,massParticipation:1,selfWeightIncluded:false,loadPath:"direct_surface"};
}

/** Static equilibrium oracle for one uniformly loaded simply supported strip, not a building solver. */
export function oneWayUniformStrip(totalKn:number,spanM:number,mode:"direct_surface"|"one_way_transfer") {
  if(mode!=="one_way_transfer") throw new Error("Doğrudan kabuk yükü ayrıca şerit olarak aktarılamaz.");
  if(!Number.isFinite(totalKn)||!Number.isFinite(spanM)||spanM<=0) throw new Error("Geçersiz şerit yükü/açıklığı.");
  const momentAboutLeftKnm=totalKn*spanM/2;
  if(!Number.isFinite(momentAboutLeftKnm))throw new Error("Moment hesabında sayı taşması.");
  return {transferredKn:totalKn,reactionLeftKn:totalKn/2,reactionRightKn:totalKn/2,momentAboutLeftKnm,authority:"static_equilibrium_oracle"};
}
