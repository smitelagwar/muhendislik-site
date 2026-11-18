import {control,fact,positive,type Fact,type GlobalControl} from "./global-control-types";
import type {DTS} from "./building-classification";
export const RC_SYSTEMS={
 A11:{R:8,D:3,minBys:3,ductility:"high",wall:"none",frames:true},
 A12:{R:7,D:2.5,minBys:2,ductility:"high",wall:"coupled",frames:false},
 A13:{R:6,D:2.5,minBys:2,ductility:"high",wall:"solid",frames:false},
 A14:{R:8,D:2.5,minBys:2,ductility:"high",wall:"coupled",frames:true},
 A15:{R:7,D:2.5,minBys:2,ductility:"high",wall:"solid",frames:true},
 A21:{R:6,D:2.5,minBys:4,ductility:"mixed",wall:"coupled",frames:true},
 A22:{R:5,D:2.5,minBys:4,ductility:"mixed",wall:"solid",frames:true},
 A23:{R:6,D:2.5,minBys:6,ductility:"mixed",wall:"coupled",frames:true},
 A24:{R:5,D:2.5,minBys:6,ductility:"mixed",wall:"solid",frames:true},
 A31:{R:4,D:2.5,minBys:7,ductility:"limited",wall:"none",frames:true},
 A32:{R:4,D:2,minBys:6,ductility:"limited",wall:"solid",frames:false},
 A33:{R:4,D:2,minBys:6,ductility:"limited",wall:"solid",frames:true},
} as const;
export type RcSystem=keyof typeof RC_SYSTEMS;
export type MomentDistribution={wallShare:number;individual:{id:string;share:number}[];edges:{id:string;share:number}[];coupling:{id:string;omega:number}[];source:string};
export type DirectionSystemInput={enteredR:Fact<number>;declaredCode:Fact<RcSystem>;traits:Fact<{frameDuctility:"high"|"limited"|"none";wallDuctility:"high"|"limited"|"none";wallKind:"none"|"solid"|"coupled";slab:"beam_slab"|"flat"|"oneway_ribbed"}>;moments:MomentDistribution|null};
export function selectSystem(direction:"X"|"Y",input:DirectionSystemInput,dts:DTS,bys:number,weakFactor:number|null){
 const declared=fact(input.declaredCode,"system code"),entered=positive(fact(input.enteredR,"entered R"),"R"),traits=fact(input.traits,"physical system traits");
 if(!Object.hasOwn(RC_SYSTEMS,declared)||!Number.isSafeInteger(bys)||bys<1||bys>8)throw Error("Unsupported/invalid cast-in-place concrete system/BYS; A16 single-storey special profile not implemented.");
 if(!["1","1a","2","2a","3","3a","4","4a"].includes(dts)||weakFactor!==null&&(!Number.isFinite(weakFactor)||weakFactor<=0||weakFactor>1)||!["beam_slab","flat","oneway_ribbed"].includes(traits.slab))throw Error("Invalid DTS/weak-storey factor/slab profile.");
 const original=RC_SYSTEMS[declared],checks:GlobalControl[]=[];let code:RcSystem=declared,minBys:number=original.minBys;
 const expectedFrame=original.frames?original.ductility==="high"?"high":"limited":"none",expectedWall=original.wall==="none"?"none":original.ductility==="limited"?"limited":"high";
 const traitsMatch=traits.frameDuctility===expectedFrame&&traits.wallDuctility===expectedWall&&traits.wallKind===original.wall;
 checks.push(control(`system_traits:${direction}`,"Table4.1/4.3.3",traitsMatch?"pass":"fail",traits,{frameDuctility:expectedFrame,wallDuctility:expectedWall,wallKind:original.wall},"Taşıyıcı rol/süneklik/bağlılık kararı nesne sayısından çıkarılmaz.",[input.traits.source,input.declaredCode.source]));
 if(traits.slab==="oneway_ribbed"&&!(["A23","A24","A31"].includes(declared)))checks.push(control(`ribbed_scope:${direction}`,"4.3.4.3","fail",declared,["A23","A24","A31"],"Tek doğrultulu dişli döşemeli betonarme çerçeve sınırlı süneklik kapsamındadır.",[input.traits.source]));
 if(traits.slab==="flat")checks.push(control(`flat_scope:${direction}`,"4.3.4.4",["A12","A13","A32"].includes(declared)?"requires_engineering":"fail",declared,["A12","A13","A32"],"Kirişsiz döşemede iki aşamalı mafsallı/monolitik model gerekir; tek çözüm yeterli değil.",[input.traits.source],[],null,"İki aşamalı model zarfı sağlanmadan genel kabul kapalı."));
 if(original.ductility==="limited"&&dts.endsWith("a")||declared==="A31"&&!["3","4"].includes(dts)||original.ductility==="mixed"&&["1a","2a"].includes(dts)&&bys<=6)checks.push(control(`ductility_limits:${direction}`,"4.3.4.1/3","fail",{declared,dts,bys},null,"DTS/BYS süneklik kapsamı izin vermiyor.",["TBDY2018 selected clauses"]));
 if(["A21","A22"].includes(declared)&&dts==="4")minBys=2;
 const wall=original.wall!=="none",m=input.moments;
 if(wall&&!m)checks.push(control(`wall_distribution:${direction}`,"4.3.2.4/4.3.4.5–8","missing_data",null,null,"Gerçek modal kesit bileşkeleri ve kenar aks dağılımı gerekir.",[]));
 if(m){
  if(!m.source.trim()||!Number.isFinite(m.wallShare)||m.wallShare<0||m.individual.some(v=>!v.id||!Number.isFinite(v.share)||v.share<0)||m.edges.some(v=>!v.id||!Number.isFinite(v.share)||v.share<0)||m.coupling.some(v=>!v.id||!Number.isFinite(v.omega)||v.omega<0))throw Error("Invalid signed-modal moment distribution packet.");
  if(original.wall==="coupled"){
   const couplingValid=m.coupling.length>0&&m.coupling.every(c=>c.omega>=1/3);
   checks.push(control(`coupling:${direction}`,"4.13–4.15",couplingValid?"pass":m.coupling.length?"fail":"missing_data",m.coupling,1/3,"Bağ kirişi adı yeterli değil; gerçek Nv*c/MDEV gerekir. Ω>2/3 için aşırı eksenel etki değerlendirmesi ayrıca sürer.",[m.source],[],null,couplingValid?m.coupling.some(c=>c.omega>2/3)?"Ω üst hedefi ve eksenel kuvvetleri P11'de değerlendir.":null:"Bağlı perde sınıflaması doğrulanmadı; her parça boşluksuz perde olarak yeniden modellenmeli."));
  }
  if(["A14","A15"].includes(declared)){
   if(m.wallShare===.4||m.wallShare===.75)checks.push(control(`mixed_share:${direction}`,"4.2/4.3.4.5","requires_engineering",m.wallShare,[.4,.75],"Tam sınırda denklemdeki kesin eşitsizlik ile metindeki sınır ifadesi değerlendirilmelidir; yuvarlayıp uygun sayılmaz.",[m.source]));
   else if(m.wallShare>.75){code=declared==="A14"?"A12":"A13";minBys=RC_SYSTEMS[code].minBys;checks.push(control(`mixed_share:${direction}`,"4.3.4.5","determined",m.wallShare,.75,"Üst sınır aşıldı; perde sistemi R/D/BYS değerleri kullanılır.",[m.source],[],true,`Sistemi ${code} katsayılarına taşı ve yeniden analiz et.`));}
   else if(m.wallShare<.4){minBys++;checks.push(control(`mixed_share:${direction}`,"4.3.4.5","determined",m.wallShare,.4,"Alt sınır sağlanmadı; R/D sabit, izin verilen BYS bir artırılır.",[m.source],[],true,"BYS sınırını yeniden kontrol et."));}
   else checks.push(control(`mixed_share:${direction}`,"4.3.4.5","pass",m.wallShare,[.4,.75],"Perde/çerçeve devrilme payı aralık içinde.",[m.source]));
  }
  if(original.ductility!=="high"&&wall&&original.frames)checks.push(control(`limited_wall_share:${direction}`,"4.3.4.6/7",m.wallShare>=.75?"pass":"fail",m.wallShare,.75,"Karma/sınırlı perde-çerçeve için perde payı koşulu; sağlanmıyorsa alternatif sistem açık tasarım/model değişikliği gerektirir.",[m.source]));
 }
 let distributionFactor=1;
 if(wall&&["1","1a","2","2a"].includes(dts)&&m){
  if(!m.individual.length||m.edges.length<2)checks.push(control(`wall_distribution:${direction}`,"4.3.2.4","missing_data",m,null,"Tekil perde ve her kenar aks için kapsamlı dağılım tanımı gerekir.",[m.source]));
  else {const finding=m.individual.some(v=>v.share>1/3)||m.edges.some(v=>v.share<1/6);if(finding)distributionFactor=.8;checks.push(control(`wall_distribution:${direction}`,"4.3.2.4","determined",{individual:m.individual,edges:m.edges},{individualMax:1/3,edgeMin:1/6},"Bir koşulun ihlali R'yi4/5 ile azaltır; D değişmez.",[m.source],[],finding,finding?"Aynı modele azaltılmış R ile yeniden analiz.":null));}
 }
 checks.push(control(`BYS_limit:${direction}`,"Table4.1/4.3.4",bys>=minBys?"pass":"fail",{bys,code},minBys,"BYS numarası küçüldükçe bina yükselir; iki doğrultunun elverişsiz sınırı gerekir.",[input.declaredCode.source],[],null,bys<minBys?"Taşıyıcı sistemi veya bina yüksekliğini yeniden değerlendir.":null));
 const nominal=RC_SYSTEMS[code],blocking=checks.some(c=>["fail","missing_data","requires_engineering","unsupported"].includes(c.status))||weakFactor===null;
 const usedR=blocking?null:Math.min(entered,nominal.R*distributionFactor*weakFactor!);
 if(usedR!==null)positive(usedR,"selected R");
 return {direction,enteredR:entered,initialR:original.R,declaredCode:declared,selectedCode:code,recommendedR:nominal.R,usedR,D:nominal.D,ductility:nominal.ductility,minBys,distributionFactor,weakFactor,checks,
  reason:checks.filter(c=>c.finding||c.status!=="pass").map(c=>({id:c.id,status:c.status,action:c.action})),analysisApproved:false};
}
export function directionalCompatibility(x:ReturnType<typeof selectSystem>,y:ReturnType<typeof selectSystem>){return control("directional_systems","4.3.4.2",x.ductility===y.ductility?"pass":"fail",{X:x.selectedCode,Y:y.selectedCode},{ductility:"same",minBys:Math.max(x.minBys,y.minBys)},"X/Y R ve D farklı olabilir; süneklik düzeyi aynı olmalıdır.",["TBDY2018-4.3.4.2"]);}
