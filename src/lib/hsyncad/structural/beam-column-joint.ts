import {designColumn,type ColumnDesignInput} from "./column-design";
import {designBeam,type BeamDesignInput} from "./beam-design";
import {beamCapacity,barArea} from "./rc-beam-section";
import {columnCapacity,columnGeometry} from "./rc-column-section";
import {columnTieGeometry,type ColumnTie} from "./column-detailing";
import {beamSectionForce} from "./beam-forces";
import {fact,type Fact} from "./global-control-types";

export type JointInput={id:string;source:string;lowerColumnId:string;upperColumnId:string|null;roofTermination:Fact<boolean>;
 beams:{beamId:string;end:"left"|"right";face:"U+"|"U-"|"V+"|"V-";offsetMm:number;anchorVerticalDirection:"down"|"up"|null;source:string}[];tie:ColumnTie};
export type ColumnJointInput={columns:ColumnDesignInput[];beams:BeamDesignInput[];joints:JointInput[];boundaryNodes:Fact<string[]>;source:string};
type CR=ReturnType<typeof designColumn>;
type BR=ReturnType<typeof designBeam>;
/** Kapasiteler bağımsız ihtiyatlı alt/üst zarflardır; eşzamanlı modal kuvvet takımı değildir. */
export function checkBeamColumnJoint(j:JointInput,columns:ColumnDesignInput[],beams:BeamDesignInput[],columnResults:CR[],beamResults:BR[]){
 try{
  if(!j.id||!j.source?.trim()||!j.beams.length||j.beams.length>4||new Set(j.beams.map(b=>b.face)).size!==j.beams.length)throw Error("Birleşim tekil yüz/topoloji/kaynak profili geçersiz.");
  const lower=columns.find(c=>c.id===j.lowerColumnId),upper=j.upperColumnId?columns.find(c=>c.id===j.upperColumnId):null;
  if(!lower||lower.topJoint!==j.id||j.upperColumnId&&(!upper||upper.baseJoint!==j.id)||!upper&&fact(j.roofTermination,"çatı kolon bitişi")!==true)throw Error("Gerçek alt/üst kolon veya açık çatı bitişi eksik.");
  const cols=[lower,...upper?[upper]:[]],results=cols.map(c=>columnResults.find(r=>r.id===c.id));
  if(results.some(r=>r?.status!=="design_ready"))return {id:j.id,status:"incomplete" as const,reason:"Kolon üye hesabı tamamlanmadı.",engineeringAcceptance:false};
  if(cols.some(c=>c.shape.kind!=="rectangle"||Math.abs(c.shape.angleRad)>1e-8))return {id:j.id,status:"unsupported" as const,reason:"Birleşim profili ortak U/V eksenli dikdörtgen kolon ister; dönük/daire/poligon kesit yapay genişlikle kabul edilmez.",engineeringAcceptance:false};
  const selected=results.map(r=>r&&"selected" in r?r.selected:null);
  if(selected.some(r=>!r))throw Error("Gerçek kolon donatısı eksik.");
  if(upper){const a=selected[0]!.bars,b=selected[1]!.bars;
   if(a.length!==b.length||a.some(p=>!b.some(q=>Math.hypot(q.u-p.u,q.v-p.v)<1e-6&&q.diameter===p.diameter)))return {id:j.id,status:"incomplete" as const,reason:"Kat kesit/donatı geçişinde gerçek filiz/kenetlenme yerleşimi ayrıca gerekli.",engineeringAcceptance:false};}
  const linked=j.beams.map(link=>{const input=beams.find(b=>b.id===link.beamId),result=beamResults.find(b=>b.id===link.beamId);
   if(!input||input.geometry[link.end==="left"?"leftJoint":"rightJoint"]!==j.id||!link.source?.trim()||!Number.isFinite(link.offsetMm)||result?.status!=="design_ready"||!("selected" in result)||!result.selected||!("capacities" in result.selected))throw Error("Gerçek kiriş ucu/donatı/tasarım sonucu eksik.");
   return {link,input,selected:result.selected};});
  const attached=beams.flatMap(b=>(["left","right"] as const).filter(e=>b.geometry[e==="left"?"leftJoint":"rightJoint"]===j.id).map(e=>`${b.id}:${e}`));
  if(attached.length!==linked.length||attached.some(k=>!linked.some(b=>`${b.input.id}:${b.link.end}`===k)))throw Error("Birleşime bağlı kirişlerin tümü kapsanmadı.");
  const stamp=lower.loads[0].force;
  if([...cols.flatMap(c=>c.loads.map(l=>l.force)),...linked.flatMap(b=>b.input.ultimate)].some(f=>f.analysisStamp!==stamp.analysisStamp||f.modelRevision!==stamp.modelRevision||f.stiffnessSet!==stamp.stiffnessSet))throw Error("Birleşim eski/karışık model, rijitlik veya analiz revizyonu içeriyor.");
  const section=cols.map(c=>c.shape as Extract<ColumnDesignInput["shape"],{kind:"rectangle"}>),bcol=Math.min(...section.map(s=>s.b)),hcol=Math.min(...section.map(s=>s.h));
  for(const b of linked){const anchor=b.input.anchors[b.link.end],depth=b.link.face[0]==="U"?bcol:hcol,clear=depth-2*Math.max(...cols.map(c=>c.cover));
   if(anchor.kind==="straight"){
    if(anchor.availableMm>clear||b.selected.anchors.some(a=>a[b.link.end].extensionMm>clear))throw Error("Düz kiriş kenetlenmesi gerçek kolon alanına sığmıyor; karşı kirişe devam eden fiziksel çubuk yolu ayrıca gerekli.");
   }else if(anchor.kind==="hook90"){
    const continuation=b.link.anchorVerticalDirection==="down"?lower:b.link.anchorVerticalDirection==="up"?upper:null;
    if(!continuation||anchor.horizontalMm>clear||anchor.verticalMm>continuation.clearLengthMm-2*continuation.cover)throw Error("Kiriş kancası yatay kolon cebine/düşey devam alanına sığmıyor veya yönü belirsiz.");
   }else throw Error("Birleşim ucunda serbest donatı kenetlenmesi kabul edilmez.");
  }
  const confined=(["U+","U-","V+","V-"] as const).every(face=>linked.some(b=>b.link.face===face&&b.input.geometry.bw>=.75*Math.max(...section.map(s=>face[0]==="U"?s.h:s.b))&&Math.abs(b.link.offsetMm)<=1e-8));
  const directions=(["U","V"] as const).flatMap(axis=>{const sides=linked.filter(b=>b.link.face[0]===axis);if(!sides.length)return [];
   const width=axis==="U"?hcol:bcol,depth=axis==="U"?bcol:hcol;
   // Şekil 7.10 genişliğini büyütmeyen alt sınır: dar kirişin eksene göre örtüşen simetrik şeridi.
   const bj=Math.min(width,...sides.map(b=>b.input.geometry.bw-2*Math.abs(b.link.offsetMm)));
   if(bj<=0||sides.some(b=>Math.abs(b.link.offsetMm)+b.input.geometry.bw/2>width/2+1e-8))throw Error("Eksantrik birleşim/kiriş taşması bu doğrulanmış panel profilinin dışında.");
   const signs=([-1,1] as const).map(sign=>{
    const beamEnds=sides.map(b=>{const bendingSign=(b.link.face.endsWith("+")?sign:-sign) as 1|-1;
     const Ns=b.input.ultimate.map(f=>beamSectionForce(f,b.link.end==="left"?0:f.lengthMm).NcompressionKn),caps=Ns.map(N=>beamCapacity({bw:b.input.geometry.bw,h:b.input.geometry.h,bf:b.input.geometry.bw,hf:0},b.selected.bars,b.input.material,bendingSign,N));
     if(b.input.geometry.flange||caps.some(c=>c.status!=="solved"))throw Error("Birleşim gerçek uç kapasitesi çözülemedi; tabla katkısı özel doğrulama ister.");
     const face=bendingSign===1?"bottom":"top",As=b.selected.bars.filter(bar=>bar.face===face).reduce((sum,bar)=>sum+barArea(bar.diameter),0);
     return {beamId:b.input.id,end:b.link.end,face,bendingSign,capacityKnm:Math.max(...caps.map(c=>c.status==="solved"?c.capacityKnm:0)),AsMm2:As,yieldForceKn:1.25*b.input.material.fyk*As/1000};});
    const columnEnds=cols.map((col,i)=>{const Ns=col.loads.map(l=>beamSectionForce(l.force,i===0?l.force.lengthMm:0).NcompressionKn),caps=Ns.map(N=>columnCapacity(col.shape,selected[i]!.bars,col.material,N,axis==="V"?sign:0,axis==="U"?sign:0));
     if(caps.some(c=>c.status!=="solved"||c.capacityKnm===null))throw Error("Güçlü kolon için gerçek N/yön kapasitesi çözülemedi.");
     return {columnId:col.id,Ns,minimumCapacityKnm:Math.min(...caps.map(c=>c.status==="solved"?c.capacityKnm??0:0))};});
    const Mc=columnEnds.reduce((s,c)=>s+c.minimumCapacityKnm,0),Mb=beamEnds.reduce((s,b)=>s+b.capacityKnm,0),lowN=cols.length===2&&cols.every(col=>col.loads.every(l=>Math.max(beamSectionForce(l.force,0).NcompressionKn,beamSectionForce(l.force,l.force.lengthMm).NcompressionKn)*1000<=.1*col.material.fck*columnGeometry(col.shape).area)),exception=!upper?"roof_termination":lowN?"both_columns_low_axial":null;
    // Vkol işaret eşleştirmesi belirsizliğinde yararlı çıkarma uygulanmaz; |Vkol| eklenerek üst sınır kurulur.
    const shearBound=Math.max(...cols.map((col,i)=>Math.max(...col.loads.map(l=>{const f=beamSectionForce(l.force,i===0?l.force.lengthMm:0);return Math.abs(axis==="U"?f.Vkn:f.VweakKn);}))));
    const Ve=beamEnds.reduce((s,b)=>s+b.yieldForceKn,0)+shearBound,limit=(confined?1.7:1)*bj*depth*Math.sqrt(Math.min(...cols.map(c=>c.material.fck)))/1000;
    return {sign,beamEnds,columnEnds,columnCapacityKnm:Mc,beamCapacityKnm:Mb,strongColumnRequiredKnm:1.2*Mb,strongColumnRatio:Mb>0?Mc/Mb:null,exception,strongColumnPassed:exception!==null||Mc>=1.2*Mb,jointShearKn:Ve,columnShearUpperBoundKn:shearBound,jointShearLimitKn:limit,jointShearPassed:Ve<=limit,shearBoundKind:"conservative_no_helpful_column_subtraction"};});
   return [{axis,effectiveWidthMm:bj,columnDepthMm:depth,signs}];});
  const panel=columnTieGeometry(lower.shape,selected[0]!.bars,j.tie),detail=selected[0]!.detailing,factor=confined?.4:.6,area=barArea(j.tie.diameter),providedU=panel.legsU*area/j.tie.endSpacingMm,providedV=panel.legsV*area/j.tie.endSpacingMm,requiredU=factor*detail.requiredU/selected[0]!.tie.endSpacingMm,requiredV=factor*detail.requiredV/selected[0]!.tie.endSpacingMm;
  const tiePassed=j.tie.kind==="rectangular"&&j.tie.diameter>=8&&j.tie.endSpacingMm>0&&j.tie.endSpacingMm<=(confined?150:100)&&providedU>=requiredU&&providedV>=requiredV&&j.tie.hookAngleDeg===135&&j.tie.hookTailMm>=Math.max(80,6*j.tie.diameter)&&j.tie.innerBendDiameterMm>=5*j.tie.diameter&&Math.abs(j.tie.coreB-selected[0]!.tie.coreB)<1e-8&&Math.abs(j.tie.coreH-selected[0]!.tie.coreH)<1e-8;
  const passed=tiePassed&&directions.every(d=>d.signs.every(s=>s.strongColumnPassed&&s.jointShearPassed));
  return {id:j.id,status:passed?"joint_ready" as const:"failed" as const,confined,directions,panelTie:{passed:tiePassed,providedU,providedV,requiredU,requiredV,panel,factor},analysisStamp:stamp.analysisStamp,engineeringAcceptance:false,sourceClauses:["TBDY7.3.5","7.5.1","7.11–7.13","7.5.2.3"],physicalTupleFromModalMaxima:false};
 }catch(error){return {id:j.id,status:"incomplete" as const,reason:String(error),engineeringAcceptance:false};}
}

export function designColumnsAndJoints(input:ColumnJointInput){
 try{
  const all=[...input.columns,...input.beams];if(!input.source?.trim()||!input.columns.length||!input.beams.length||all.length>300||new Set(all.map(c=>c.id)).size!==all.length||new Set(input.joints.map(j=>j.id)).size!==input.joints.length)throw Error("Tekil eleman/topoloji veya sınırlı kapsam geçersiz.");
  const boundary=fact(input.boundaryNodes,"dış kapsam mesnet düğümleri");if(!Array.isArray(boundary)||boundary.some(n=>typeof n!=="string"||!n))throw Error("Dış mesnet düğüm kapsamı eksik.");
  const columnNodes=new Set(input.columns.flatMap(c=>[c.baseJoint,c.topJoint])),beamNodes=new Set(input.beams.flatMap(b=>[b.geometry.leftJoint,b.geometry.rightJoint])),required=[...beamNodes].filter(n=>columnNodes.has(n)),missing=required.filter(n=>!input.joints.some(j=>j.id===n)),uncovered=[...new Set([...columnNodes,...beamNodes])].filter(n=>!required.includes(n)&&!boundary.includes(n));
  if(input.joints.some(j=>!required.includes(j.id)))throw Error("Gerekmeyen/yanlış birleşim kimliği kapsamı yanıltıyor.");
  const columns=input.columns.map(designColumn),beams=input.beams.map(designBeam),joints=input.joints.map(j=>{
   const lower=input.columns.filter(c=>c.topJoint===j.id),upper=input.columns.filter(c=>c.baseJoint===j.id);
   if(lower.length!==1||upper.length>1||lower[0]?.id!==j.lowerColumnId||(upper[0]?.id??null)!==j.upperColumnId)return {id:j.id,status:"incomplete" as const,reason:"Tüm bağlı alt/üst kolonlar tekil topolojiyle kapsanmadı.",engineeringAcceptance:false};
   return checkBeamColumnJoint(j,input.columns,input.beams,columns,beams);});
  const frameIssues:string[]=[];
  for(const col of input.columns)for(const load of col.loads)for(let axis=0;axis<2;axis++){
   const frame=load.stability.frame[axis],story=input.columns.filter(c=>c.storeyId===col.storeyId),ids=frame.ultimateMembers.map(c=>c.id);
   if(story.length!==ids.length||story.some(c=>!ids.includes(c.id)))frameIssues.push(`${col.id}:${load.force.id}:${axis}: kat kolon kapsamı eksik`);
   for(const member of frame.ultimateMembers){const peer=story.find(c=>c.id===member.id),result=columns.find(c=>c.id===member.id),demand=result&&"selected" in result?result.selected?.demands.find(d=>d.caseId===load.force.id):null,characteristic=frame.characteristicMembers.find(c=>c.id===member.id);
    if(!peer||!demand||!characteristic||Math.abs(characteristic.lengthMm-peer.clearLengthMm)>1e-6||Math.abs(member.Nkn-Math.max(0,demand.amplification.Nkn))>1e-6||member.id!==col.id&&Math.abs(member.criticalLoadKn-demand.amplification.axes[axis].NkKn)>1e-6*Math.max(1,member.criticalLoadKn))frameIssues.push(`${col.id}:${load.force.id}:${axis}:${member.id}: gerçek üye N/Nk/boy kaydı uyuşmuyor`);
   }
  }
  const ready=!missing.length&&!uncovered.length&&!frameIssues.length&&columns.every(c=>c.status==="design_ready")&&beams.every(b=>b.status==="design_ready")&&joints.every(j=>j.status==="joint_ready");
  return {status:ready?"column_joint_ready" as const:"incomplete" as const,columns,beams,joints,frameIssues,requiredJoints:required,missingJoints:missing,uncoveredNodes:uncovered,engineeringAcceptance:false,wholeBuildingApproved:false,metadata:{version:"column-joint-v1",allElementsProcessed:true,globalScopeApproved:false,finalFabricationQuantityApproved:false}};
 }catch(error){return {status:"invalid_input" as const,reason:String(error),engineeringAcceptance:false,wholeBuildingApproved:false};}
}
