import {control,fact,positive,nonnegative,type Fact,type GlobalControl} from "./global-control-types";
export type BKS=1|2|3;
export type DTS="1"|"1a"|"2"|"2a"|"3"|"3a"|"4"|"4a";
export type BuildingLevel={id:string;elevationM:number;role:"foundation"|"basement"|"superstructure"|"roof"|"roof_extension";source:string};
export type BasementEvidence={hasBasement:Fact<boolean>;enclosingRigidSides:Fact<number>;basementTopM:Fact<number>;wholePeriod:Fact<{X:number;Y:number}>;upperMassOnlyPeriod:Fact<{X:number;Y:number}>};
/** Explicit BKS input is a use-purpose decision, never inferred from the project name. */
export function classifySeismicUse(bks:Fact<BKS>,dd2Sds:Fact<number>){
 const use=fact(bks,"BKS"),sds=nonnegative(fact(dd2Sds,"DD2 SDS"),"SDS");if(![1,2,3].includes(use))throw Error("Invalid BKS.");
 const I={1:1.5,2:1.2,3:1}[use],index=sds<.33?4:sds<.5?3:sds<.75?2:1,dts=`${index}${use===1?"a":""}` as DTS;
 return {bks:use,I,dts,controls:[control("BKS_I","Table3.1","determined",{bks:use,I},null,"Bina kullanım amacı kaynaklı açık karar.",[bks.source]),control("DTS","Table3.2","determined",{sds,dts},[.33,.5,.75],"DD-2 SDS ve BKS ile, yuvarlamadan.",[bks.source,dd2Sds.source],["BKS_I"])]};
}
export function evaluateBasement(input:BasementEvidence){
 const present=fact(input.hasBasement,"basement presence");if(typeof present!=="boolean")throw Error("Invalid basement presence.");
 if(!present)return {rigid:false,topM:null,control:control("rigid_basement","3.3.1.1/2","not_applicable",false,null,"Bodrum olmadığı açıkça beyan edildi.",[input.hasBasement.source])};
 if(input.enclosingRigidSides.value===null)return {rigid:null,topM:null,control:control("rigid_basement","3.3.1.1","missing_data",null,{minSides:3,periodRatioStrictMax:1.1},"Çevreleme/rijitlik geometrisi bilinmiyor.",[input.hasBasement.source])};
 const sides=fact(input.enclosingRigidSides,"rigid enclosing sides");if(!Number.isSafeInteger(sides)||sides<0||sides>4)throw Error("Enclosing side count must be0–4, with an explicit rigidity decision.");
 if(sides<3)return {rigid:false,topM:null,control:control("rigid_basement","3.3.1.1/2","determined",{sides},3,"Çevreleme koşulu sağlanmadı; temel üstünden ölçülür.",[input.enclosingRigidSides.source])};
 if(input.wholePeriod.value===null||input.upperMassOnlyPeriod.value===null||input.basementTopM.value===null)return {rigid:null,topM:null,control:control("rigid_basement","3.3.1.1","missing_data",{sides},1.1,"Aynı taşıyıcı sistemin iki doğrultuda tüm/üst kütle periyotları ve üst kotu gerekir.",[input.enclosingRigidSides.source])};
 const whole=fact(input.wholePeriod,"whole period"),upper=fact(input.upperMassOnlyPeriod,"upper-mass period"),topM=fact(input.basementTopM,"basement top");
 if(!Number.isFinite(topM))throw Error("Invalid basement top elevation.");const ratios={X:positive(whole.X,"whole X")/positive(upper.X,"upper X"),Y:positive(whole.Y,"whole Y")/positive(upper.Y,"upper Y")},rigid=ratios.X<1.1&&ratios.Y<1.1;
 return {rigid,topM,control:control("rigid_basement","3.3.1.1","determined",{sides,ratios,rigid},1.1,"İki doğrultuda kesin küçüklük koşulu birlikte uygulanır.",[input.enclosingRigidSides.source,input.wholePeriod.source,input.upperMassOnlyPeriod.source,input.basementTopM.source])};
}
export function classifyBuildingHeight(levels:readonly BuildingLevel[],basement:ReturnType<typeof evaluateBasement>,dts:DTS,roofExtensionExclusion:Fact<boolean>){
 if(!levels.length||new Set(levels.map(l=>l.id)).size!==levels.length||levels.some(l=>!l.id||!l.source.trim()||!Number.isFinite(l.elevationM)||!["foundation","basement","superstructure","roof","roof_extension"].includes(l.role)))throw Error("Explicit unique levels/roles/elevations/sources required.");
 if(basement.rigid===null)return {heightM:null,bys:null,baseM:null,control:control("HN_BYS","3.3.1/Table3.3","missing_data",null,null,"Bodrum tabanı kararı eksik; kat yüksekliği toplanmaz.",[],["rigid_basement","DTS"])};
 const foundation=levels.filter(l=>l.role==="foundation");if(foundation.length!==1)throw Error("One explicit foundation-top reference level required.");
 const extensions=levels.filter(l=>l.role==="roof_extension");if(extensions.length&&roofExtensionExclusion.value===null)return {heightM:null,bys:null,baseM:null,control:control("HN_BYS","3.3.1.3","requires_engineering",null,null,"Küçük kütleli çatı uzantısı istisnası kendiliğinden uygulanmaz.",[],["rigid_basement","DTS"])};
 const omit=extensions.length?fact(roofExtensionExclusion,"roof extension exclusion"):false;
 if(typeof omit!=="boolean")throw Error("Invalid roof extension decision.");const candidates=levels.filter(l=>l.role==="roof"||l.role==="superstructure"||l.role==="roof_extension"&&!omit);
 if(!candidates.length)throw Error("Missing roof/upper-structure height boundary.");
 const baseM=basement.rigid?basement.topM!:foundation[0].elevationM,topM=Math.max(...candidates.map(l=>l.elevationM)),heightM=positive(topM-baseM,"HN");
 if(basement.rigid&&baseM<=foundation[0].elevationM||levels.some(l=>l.role==="superstructure"&&l.elevationM<baseM))throw Error("Conflicting level roles/reference base.");
 if(basement.rigid&&!levels.some(l=>l.role==="basement"&&Math.abs(l.elevationM-baseM)<1e-8))throw Error("Basement top must match an explicit basement level.");
 const group=["1","1a","2","2a"].includes(dts)?0:["3","3a"].includes(dts)?1:["4","4a"].includes(dts)?2:-1;if(group<0)throw Error("Invalid DTS.");
 const boundaries=[[70,56,42,28,17.5,10.5,7],[91,70,56,42,28,17.5,10.5],[105,91,56,42,28,17.5,10.5]][group];const index=boundaries.findIndex(boundary=>heightM>boundary),bys=index===-1?8:index+1;
 return {heightM,bys,baseM,control:control("HN_BYS","3.3.1/Table3.3","determined",{baseM,topM,heightM,bys,dts},boundaries,"İlgili bina tabanı ile üst sınırın kot farkı; sınırlar ham değerle.",levels.map(l=>l.source).concat(omit?[roofExtensionExclusion.source]:[]),["rigid_basement","DTS"])};
}
export function requiredPerformance(dts:DTS,bys:number):GlobalControl{
 if(!Number.isSafeInteger(bys)||bys<1||bys>8)throw Error("Invalid BYS.");
 const advanced=bys===1||["1a","2a"].includes(dts)&&[2,3].includes(bys);
 return control("performance_scope","Table3.4/4.1.4",advanced?"unsupported":"determined",{dts,bys,advancedRequired:advanced},null,advanced?"DGT ön tasarım yeterli değil; ilgili ŞGDT/yüksek bina kapsamı gerekir.":"Yeni betonarme bina için DD-2 DGT kapsamı; eleman kabulü ayrıca gerekir.",["TBDY2018 selected source pages18,31"],["DTS","HN_BYS"],advanced,advanced?"ŞGDT/yüksek bina değerlendirmesi tamamlanana kadar nihai kabul kapalı.":null);
}
