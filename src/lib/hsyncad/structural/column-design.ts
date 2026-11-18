import {control,fact,type Fact,type GlobalControl} from "./global-control-types";
import {beamMaterial,type BeamMaterial} from "./rc-beam-section";
import {columnCapacity,columnGeometry,type ColumnShape,type ColumnBar} from "./rc-column-section";
import {magnifyColumnCase,type ColumnStabilityInput} from "./column-stability";
import {columnDetailing,automatedColumnTie,rectangleColumnBars,circleColumnBars,type ColumnTie,type ColumnLap} from "./column-detailing";
import {validateBeamCase,beamSectionForce,combineBeamCases,type BeamCase} from "./beam-forces";
export type ColumnDesignInput={id:string;storeyId:string;shape:ColumnShape;material:BeamMaterial;mode:"existing_reinforcement"|"redesign";bars:ColumnBar[];tie:ColumnTie;cover:number;aggregate:number;clearLengthMm:number;outside:boolean;source:string;
 baseJoint:string;topJoint:string;qualityReviewed:Fact<boolean>;loadCoverage:Fact<"all_required_combinations_reviewed">;GQEmaxKn:Fact<number>;shortColumn:Fact<boolean>;cantilever:boolean;foundationEmbedMm:number|null;
 loads:{force:BeamCase;stability:ColumnStabilityInput}[];seismic:null|{D:number;analysisStamp:string;ductility:"high";source:string;pairs:{gravity:BeamCase;earthquake:BeamCase}[]};
 laps:ColumnLap[];development:{required:boolean;availableMm:number;offsetMm:number;transitionHeightMm:number;source:string};catalog:{diameters:number[];counts:number[];maxCandidates:number};};
function check(id:string,clause:string,ok:boolean,observed:unknown,limit:unknown,source:string){return control(id,clause,ok?"pass":"fail",observed,limit,id,[source]);}
export function columnMemberShear(input:ColumnDesignInput,bars:ColumnBar[]){
 const g=columnGeometry(input.shape),m=beamMaterial(input.material),result:{caseId:string;direction:"M2"|"M3";VdesignKn:number;VdKn:number;capacityShearKn:number;DcapKn:number;VcKn:number;VrKn:number;passed:boolean;sourceClause:string}[]=[];
 if(input.shape.kind!=="rectangle")return {status:"unsupported" as const,reason:"Daire/poligon N-M çözümü kullanılabilir; etkin kesme alanı ve etriye etkinliği bu üye profilinde henüz doğrulanmadı.",result};
 const localAngle=input.shape.kind==="rectangle"?input.shape.angleRad:0;
 const c=Math.cos(localAngle),s=Math.sin(localAngle);
 const paired=[...input.seismic?.pairs.map(p=>({combined:combineBeamCases(`column-combined:${p.earthquake.id}`,[{factor:1,load:p.gravity},{factor:1,load:p.earthquake}]),amplified:combineBeamCases(`column-D:${p.earthquake.id}`,[{factor:1,load:p.gravity},{factor:input.seismic!.D,load:p.earthquake}]),earthquake:p.earthquake}))??[],...input.loads.map(l=>({combined:l.force,amplified:l.force,earthquake:null}))];
 for(const p of paired){const bottom=beamSectionForce(p.combined,0),top=beamSectionForce(p.combined,input.clearLengthMm);
  if(Math.abs(bottom.Tknm)>1e-8||Math.abs(top.Tknm)>1e-8)return {status:"unsupported" as const,reason:"Kolonda kesme-burulma etkileşimi için ayrı doğrulama gerekli.",result};
  for(const direction of ["M2","M3"] as const){const M2=direction==="M2"?c:-s,M3=direction==="M3"?c:s,capacities=[bottom,top].flatMap(f=>[-1,1].map(sign=>columnCapacity(input.shape,bars,input.material,f.NcompressionKn,sign*M2,sign*M3)));
   if(capacities.some(c=>c.status!=="solved"||c.capacityKnm===null))return {status:"incomplete" as const,reason:"Kapasite kesmesine esas gerçek N/yön uç kapasitesi çözülemedi.",result};
   const component=(f:ReturnType<typeof beamSectionForce>)=>direction==="M2"?-s*f.Vkn+c*f.VweakKn:c*f.Vkn+s*f.VweakKn;
   const capValues=capacities.map(c=>c.status==="solved"?c.capacityKnm??0:0),capacityShearKn=1.4*(Math.max(capValues[0],capValues[1])+Math.max(capValues[2],capValues[3]))/(input.clearLengthMm/1000),VdKn=Math.max(Math.abs(component(bottom)),Math.abs(component(top))),Db=beamSectionForce(p.amplified,0),Dt=beamSectionForce(p.amplified,input.clearLengthMm),DcapKn=Math.max(Math.abs(component(Db)),Math.abs(component(Dt))),VdesignKn=input.seismic?Math.max(VdKn,Math.min(capacityShearKn,DcapKn)):VdKn;
   const width=direction==="M2"?input.shape.b:input.shape.h,height=direction==="M2"?input.shape.h:input.shape.b,d=height-input.cover-input.tie.diameter-Math.max(...bars.map(b=>b.diameter))/2,minimumN=Math.min(bottom.NcompressionKn,top.NcompressionKn),gamma=minimumN>=0?.07:-.3,Vcr=Math.max(0,.65*m.fctd*width*d*(1+gamma*Math.abs(minimumN)*1000/g.area));
   const Eb=p.earthquake?beamSectionForce(p.earthquake,0):null,Et=p.earthquake?beamSectionForce(p.earthquake,input.clearLengthMm):null,zeroVc=!!input.seismic&&Math.min(bottom.NcompressionKn,top.NcompressionKn)*1000<=.05*g.area*m.fck&&(!Eb||!Et||Math.abs(component(Eb))>.5*Math.abs(component(bottom))||Math.abs(component(Et))>.5*Math.abs(component(top)));
   const Vc=zeroVc?0:.8*Vcr,legs=direction==="M2"?input.tie.legsV:input.tie.legsU,area=Math.PI*input.tie.diameter**2/4,spacing=Math.max(input.tie.endSpacingMm,input.tie.middleSpacingMm),Vr=Vc+legs*area/spacing*m.fywd*d,V=VdesignKn*1000,Aw=width*d;
   result.push({caseId:p.combined.id,direction,VdesignKn,VdKn,capacityShearKn,DcapKn,VcKn:Vc/1000,VrKn:Vr/1000,passed:d>0&&V<=Vr&&V<=.22*m.fcd*Aw&&(!input.seismic||V<=.85*Aw*Math.sqrt(m.fck)),sourceClause:"TS500-8/TBDY7.3.7.3–7.3.8; conservative column-capacity branch"});
  }
 }
 return {status:result.every(r=>r.passed)?"passed" as const:"failed" as const,result,beamDistributionReductionApplied:false};
}
function assess(input:ColumnDesignInput,bars:ColumnBar[]){
 const checks:GlobalControl[]=[],Nmax=Math.max(0,...input.loads.flatMap(l=>[beamSectionForce(l.force,0).NcompressionKn,beamSectionForce(l.force,input.clearLengthMm).NcompressionKn])),short=fact(input.shortColumn,"kısa kolon kararı");
 if(typeof short!=="boolean")throw Error("Kısa kolon değerlendirmesi açık boolean olmalı.");
 const detailing=columnDetailing({shape:input.shape,bars,material:input.material,tie:input.tie,cover:input.cover,aggregate:input.aggregate,clearLengthMm:input.clearLengthMm,highDuctility:!!input.seismic,NmaxKn:Nmax,GQEmaxKn:fact(input.GQEmaxKn,"G+Q+E eksenel üst sınır"),shortColumn:short,cantilever:input.cantilever,foundationEmbedMm:input.foundationEmbedMm,laps:input.laps,development:input.development});
 checks.push(check("outer_hoop_cover","TS500-9.5.1",input.cover>=(input.outside?25:20),input.cover,input.outside?25:20,input.source));
 for(const c of detailing.checks)checks.push(check(c.id,c.clause,c.passed,c.observed,c.limit,input.source));
 if(input.laps.length)checks.push(control("lap_geometry","TBDY7.3.3","requires_engineering",input.laps,null,"Bindirme bölgesi yerel sınırları hesaplandı; gerçek ekli bar/çiroz yerleşimi ve kalabalık kontrolü ayrıca gerekli.",[input.source]));
 if(input.development.required)checks.push(control("terminal_development_geometry","TBDY7.3.3.2","requires_engineering",input.development,null,"Skaler kenetlenme boyu kontrolü fiziksel bitiş kancası/filiz yerleşimi kanıtı değildir.",[input.development.source]));
 if(checks.some(c=>c.status==="fail"))return {passed:false,checks,detailing,bars,tie:input.tie,demands:[]};
 const demands=input.loads.map(l=>{const amplification=magnifyColumnCase(input.shape,bars,input.material,l.force,l.stability),interactions=amplification.designCorners.map(d=>({...d,capacity:columnCapacity(input.shape,bars,input.material,d.Nkn,d.M2knm,d.M3knm)}));
  checks.push(check(`biaxial:${l.force.id}`,"TS500-7.1/7.5/7.6",interactions.every(i=>i.capacity.status==="solved"&&i.capacity.utilization<=1),interactions,1,input.source));return {caseId:l.force.id,amplification,interactions};});
 const shear=columnMemberShear(input,bars);checks.push(control("column_shear","TS500-8/TBDY7.3.7",shear.status==="passed"?"pass":shear.status==="failed"?"fail":shear.status==="unsupported"?"unsupported":"missing_data",shear,null,"Kiriş dağılımı indirimi yerine güvenli tarafta kolon uç kapasitesi dalı; D üst sınırı ve Vd alt sınırı korunur.",[input.source]));
 return {passed:checks.every(c=>c.status==="pass"),checks,detailing,bars,tie:input.tie,demands,shear};
}
export function designColumn(input:ColumnDesignInput){
 try{
  if(!input.id||!input.storeyId||!input.source?.trim()||!input.baseJoint||!input.topJoint||input.baseJoint===input.topJoint||!["existing_reinforcement","redesign"].includes(input.mode)||!Array.isArray(input.loads)||!input.loads.length||input.loads.length>64||new Set(input.loads.map(l=>l.force.id)).size!==input.loads.length)throw Error("Kolon kimlik/geometri/yük kapsamı geçersiz.");
  if(fact(input.qualityReviewed,"kolon kalite değerlendirmesi")!==true||fact(input.loadCoverage,"kolon yük kapsamı")!=="all_required_combinations_reviewed")return {status:"incomplete" as const,id:input.id,engineeringAcceptance:false};
  if(!Number.isFinite(fact(input.GQEmaxKn,"GQE eksenel kuvvet"))||fact(input.GQEmaxKn,"GQE eksenel kuvvet")<0)throw Error("GQE eksenel basınç kaynağı geçersiz.");
  const first=input.loads[0].force;for(const l of input.loads){validateBeamCase(l.force);if(l.force.lengthMm!==input.clearLengthMm||l.force.modelRevision!==first.modelRevision||l.force.stiffnessSet!==first.stiffnessSet||l.force.analysisStamp!==first.analysisStamp||l.stability.memberId!==input.id)throw Error("Kolon aynı model/analiz revizyonunda değil.");}
  const material=beamMaterial(input.material);if(input.seismic&&(input.seismic.ductility!=="high"||input.seismic.D<1||!Number.isFinite(input.seismic.D)||input.seismic.analysisStamp!==first.analysisStamp||!input.seismic.source.trim()||input.material.fck<25||input.material.reinforcementClass==="S420"))throw Error("Kolon yüksek süneklik/malzeme/snapshot profili doğrulanmadı.");
  if(input.seismic){if(!input.seismic.pairs.length)throw Error("Gerçek deprem/düşey bileşeni eksik.");for(const p of input.seismic.pairs){const combined=combineBeamCases(`coverage:${p.earthquake.id}`,[{factor:1,load:p.gravity},{factor:1,load:p.earthquake}]);if(combined.analysisStamp!==first.analysisStamp||!input.loads.some(l=>l.force.endForces.every((v,i)=>Math.abs(v-combined.endForces[i])<1e-7)&&l.force.uniformKnM.every((v,i)=>Math.abs(v-combined.uniformKnM[i])<1e-7)))throw Error("Kolon kapasite kesmesi birleşimi gerçek ULS/snapshot kapsamıyla uyuşmuyor.");}}
  let selected:ReturnType<typeof assess>|null=null,attempts=0;
  if(input.mode==="existing_reinforcement"){selected=assess(input,input.bars);attempts=1;}
  else{
   const c=input.catalog;if(!c||!c.diameters.length||c.diameters.some(d=>!Number.isFinite(d)||d<14||d>32)||!c.counts.length||c.counts.some(n=>!Number.isSafeInteger(n)||n<2||n>12)||!Number.isSafeInteger(c.maxCandidates)||c.maxCandidates<1||c.maxCandidates>200)throw Error("Sınırlı kolon donatı kataloğu gerekli.");
   const candidates:ColumnBar[][]=[];
   for(const d of c.diameters)if(input.shape.kind==="rectangle")for(const n of c.counts)for(const h of c.counts)candidates.push(rectangleColumnBars(input.shape,d,n,h,input.cover,input.tie.diameter));else if(input.shape.kind==="circle")for(const n of c.counts)if(n>=6&&n%2===0)candidates.push(circleColumnBars(input.shape,d,n,input.cover,input.tie.diameter));else continue;
   candidates.sort((a,b)=>a.reduce((s,b)=>s+b.diameter**2,0)-b.reduce((s,b)=>s+b.diameter**2,0));
   for(const bars of candidates){if(attempts>=c.maxCandidates)break;attempts++;
    // Sarılma yolları kullanıcı geometrisidir; değişen bar kimlikleri için yeni gerçek yol üretmek gerekir.
    const tie=automatedColumnTie(input.shape,bars,input.tie),result=assess({...input,tie},bars);selected=result;if(result.passed||result.checks.some(c=>c.status==="requires_engineering")&&result.checks.every(c=>c.status!=="fail"))break;}
  }
  const ready=selected?.passed===true,exhausted=!ready&&input.mode==="redesign"&&attempts>=input.catalog.maxCandidates;
  return {status:ready?"design_ready" as const:exhausted?"budget_exhausted" as const:selected?.checks.some(c=>["requires_engineering","missing_data"].includes(c.status))?"incomplete" as const:selected?.checks.some(c=>c.status==="unsupported")?"unsupported" as const:"failed" as const,id:input.id,selected,attempts,modelRevision:first.modelRevision,stiffnessSet:first.stiffnessSet,analysisStamp:first.analysisStamp,material,engineeringAcceptance:false,wholeBuildingApproved:false,metadata:{version:"column-design-v1",pDeltaSolved:false,finalFabricationQuantityApproved:false}};
 }catch(error){const reason=String(error);return {status:reason.includes("missing_data")?"incomplete" as const:"invalid_input" as const,id:input.id,reason,engineeringAcceptance:false};}
}
