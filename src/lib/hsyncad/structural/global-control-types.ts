export type Fact<T>={value:T|null;source:string};
export type ControlStatus="determined"|"pass"|"fail"|"missing_data"|"requires_engineering"|"unsupported"|"not_applicable";
export type GlobalControl={id:string;status:ControlStatus;clause:string;dependencies:string[];observed:unknown;limit:unknown;finding:boolean|null;action:string|null;reason:string;sources:string[]};
export type B3Transfer="none"|"column_on_cantilever"|"column_on_corbel"|"column_on_simple_beam"|"wall_on_column"|"wall_on_beam_midspan";
export type EngineeringReview={present:boolean|null;reviewer:string|null;reason:string|null;transfer:B3Transfer|null;verticalAnalysisRef:string|null};
export type EngineeringReviews=Record<"A2"|"A3"|"B3",EngineeringReview>;
export function emptyEngineeringReviews():EngineeringReviews{
 const blank=()=>({present:null,reviewer:null,reason:null,transfer:null,verticalAnalysisRef:null});return {A2:blank(),A3:blank(),B3:blank()};
}
export function validateEngineeringReviews(reviews:EngineeringReviews){
 if(!reviews||Object.keys(reviews).some(k=>!["A2","A3","B3"].includes(k)))throw Error("Mühendis değerlendirmesi: geçersiz kontrol kimliği.");
 for(const id of ["A2","A3","B3"] as const){const r=reviews[id];
  if(!r||!(r.present===null||typeof r.present==="boolean")||[r.reviewer,r.reason,r.verticalAnalysisRef].some(v=>v!==null&&typeof v!=="string")
   ||!(r.transfer===null||["none","column_on_cantilever","column_on_corbel","column_on_simple_beam","wall_on_column","wall_on_beam_midspan"].includes(r.transfer)))throw Error(`review-${id}: geçersiz değerlendirme kaydı.`);
  if(r.present!==null&&(!r.reviewer?.trim()||!r.reason?.trim()))throw Error(`review-${id}-reason: karar için değerlendiren ve gerekçe gerekir.`);
  if(id!=="B3"&&(r.transfer!==null||r.verticalAnalysisRef!==null))throw Error(`review-${id}: B3 alanları başka değerlendirmeye yazılamaz.`);
  if(id==="B3"&&r.present===false&&r.transfer!==null&&r.transfer!=="none")throw Error("review-B3: B3 yok kararı ile aktarım türü çelişiyor.");
 }
}
export function fact<T>(input:Fact<T>,name:string):T{
 if(!input||input.value===null)throw Error(`${name}: missing_data`);if(!input.source?.trim())throw Error(`${name}: source required`);return input.value;
}
export const control=(id:string,clause:string,status:ControlStatus,observed:unknown,limit:unknown,reason:string,sources:string[],dependencies:string[]=[],finding:boolean|null=null,action:string|null=null):GlobalControl=>({id,clause,status,observed,limit,reason,sources,dependencies,finding,action});
export function positive(value:number,name:string){if(!Number.isFinite(value)||value<=0)throw Error(`${name}: finite positive value required`);return value;}
export function nonnegative(value:number,name:string){if(!Number.isFinite(value)||value<0)throw Error(`${name}: finite nonnegative value required`);return value;}
