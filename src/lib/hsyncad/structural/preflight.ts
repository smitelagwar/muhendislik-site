import { validateModel, isSolidElement, type CadModel } from "../model";
import { elementFootprint, elementVerticalRange, distance } from "../geometry";
import { resolveJunctions } from "../junctions";
import { polygonLamina } from "./mass-properties";
import { buildLoadLedger, STANDARD_GRAVITY, type LoadPatch } from "./load-ledger";

type Issue={code:string;subject:string;status:"missing_data"|"unsupported"|"invalid";reason:string};
/** Diagnostic boundary only: it does not solve stiffness, reactions, or code compliance. */
export function structuralPreflight(input:CadModel, patches:LoadPatch[]) {
  const model=validateModel(input),issues:Issue[]=[],nodes=new Map<string,{id:string;x:number;y:number;z:number}>();
  const add=(code:string,subject:string,status:Issue["status"],reason:string)=>issues.push({code,subject,status,reason});
  const physical=model.structural;
  if(!physical) add("structural_missing","project","missing_data","Sürümlü fiziksel proje yok.");
  if(model.ideImport) add("native_semantics","project","unsupported","Native malzeme/G/ayar/donatı kabul kapıları açık; isim veya varsayılanla tamamlanmaz.");
  const joints=resolveJunctions(model);
  if(joints.status!=="resolved") add("geometry_failed","project","invalid","Net geometri başarısız; brütle doldurulmadı.");
  else if((joints.overlapVolume??0)>1e-10) add("overlap","project","unsupported","Ortak hacim var; öz ağırlık/kütle için net parçaların integrali gerekir.");
  const node=(id:string,p:{x:number;y:number;z:number})=>{
    const old=nodes.get(id);
    if(old&&Math.hypot(old.x-p.x,old.y-p.y,old.z-p.z)>1e-8) add("joint_coordinate_conflict",id,"invalid","Aynı analitik kimlik farklı konumlarda.");
    else if(!old)nodes.set(id,{id,...p});
  };
  const elements=[];
  for(const e of model.elements.filter(isSolidElement).sort((a,b)=>a.id.localeCompare(b.id))) {
    const p=physical?.objects.find(p=>p.elementId===e.id);
    if(!p||p.role==="unknown") {add("role_unknown",e.id,"missing_data","Fiziksel rol açıkça tanımlanmalı.");continue;}
    if(p.role==="excluded")continue;
    const material=physical?.materials.find(m=>m.materialId===p.materialId);
    if(!material?.properties||material.source==="unknown"||material.properties.elasticModulusMPa===null||material.properties.densityKgM3===null||material.properties.poisson===null) add("material_unknown",e.id,"missing_data","Fiziksel malzeme E/Poisson/kütle yoğunluğu eksik.");
    if(p.localAxis===null)add("axis_unknown",e.id,"missing_data","Yerel eksen kararı bilinmiyor.");
    else if(p.localAxis!==0)add("axis_unit_unresolved",e.id,"unsupported","Sıfır dışı yerel dönüşün birimi/çerçevesi doğrulanmalı.");
    if(p.openingsM===null)add("openings_unknown",e.id,"missing_data","Boşluk kapsamı bilinmiyor; boşluk yok varsayılmadı.");
    else if(p.openingsM.length)add("opening_depth_model",e.id,"unsupported","3B boşluk derinliği/taşıyıcı ağ modeli ayrıca doğrulanmalı; dolu kesit sayılmadı.");
    const floor=model.floors.find(f=>f.id===e.floorId)!;
    const [bottom,top]=elementVerticalRange(e,floor);
    const footprint=elementFootprint(e);
    let section;
    try {section=polygonLamina(footprint,1,p.openingsM?.map(h=>h.map(v=>({x:v.x,y:v.y})))??[]);}
    catch(error){add("section_invalid",e.id,"invalid",String(error));continue;}
    if(top<=bottom)add("vertical_range",e.id,"invalid","Pozitif düşey aralık yok.");
    if(p.diaphragmId===null)add("diaphragm_unknown",e.id,"missing_data","Kat/diyafram bağı bilinmiyor; otomatik rijit diyafram atanmadı.");
    const floorRole=physical?.floorRoles?.find(r=>r.floorId===e.floorId);
    if(!floorRole||floorRole.role==="unknown"||floorRole.source==="unknown"||floorRole.diaphragmId!==p.diaphragmId)add("floor_role_unknown",e.id,"missing_data","Kat rolü/diyafram kaydı eksik veya çelişkili.");
    if(e.type==="slab"||e.type==="wall"||!["beam","column"].includes(p.role)) add("surface_mesh_required",e.id,"unsupported","Kabuk/merdiven/temel/perde ağı ve fiziksel model doğrulaması gerekir.");
    let ends:null|[{x:number;y:number;z:number},{x:number;y:number;z:number}]=null;
    if(e.type==="column") {
      if(e.section==="circle")add("analytic_section_required",e.id,"unsupported","Çember çokgenleştirmesi gerçek kesit integrali yerine kabul edilmedi.");
      if(e.leanX||e.leanY)add("inclined_section_required",e.id,"unsupported","Eğik kesitin normal düzlem özellikleri ayrıca doğrulanmalı.");
      ends=[{...section.center,z:bottom},{x:section.center.x+(e.leanX??0),y:section.center.y+(e.leanY??0),z:top}];
    } else if(e.type==="beam") {
      if(e.curveSagitta||e.offset||(e.endTopOffset??e.topOffset??0)!==(e.topOffset??0))add("special_beam_geometry",e.id,"unsupported","Eğri/ofset/eğik kiriş dönüşümü ayrıca doğrulanmalı.");
      const startZ=floor.elevation+floor.height+(e.topOffset??0)-e.height/2;
      const endZ=floor.elevation+floor.height+(e.endTopOffset??e.topOffset??0)-e.height/2;
      ends=[{...e.start,z:startZ},{...e.end,z:endZ}];
      if(distance(e.start,e.end)<=1e-8)add("zero_length",e.id,"invalid","Sıfır boylu eleman.");
    }
    if(ends) {
      const c=p.connections;
      if(!c?.startJointId||!c.endJointId)add("connectivity_unknown",e.id,"missing_data","Çizim yakınlığı mekanik bağlantı değildir.");
      else {node(c.startJointId,ends[0]);node(c.endJointId,ends[1]);}
      if(c?.startReleases===null||c?.endReleases===null)add("releases_unknown",e.id,"missing_data","Uç salımları bilinmiyor; rijit varsayılmadı.");
      if(c?.eccentricityM&&Math.hypot(c.eccentricityM.x,c.eccentricityM.y,c.eccentricityM.z)>0) add("rigid_offset",e.id,"unsupported","Rijit bölge/kaçıklık dönüşümü solverda doğrulanmalı.");
    }
    let localFrame=null;
    if(ends) {
      const d={x:ends[1].x-ends[0].x,y:ends[1].y-ends[0].y,z:ends[1].z-ends[0].z},L=Math.hypot(d.x,d.y,d.z);
      if(L<=1e-10)add("zero_length",e.id,"invalid","Analitik eleman boyu sıfır.");
      else {
        const x={x:d.x/L,y:d.y/L,z:d.z/L},ref=Math.abs(x.z)>.99?{x:0,y:1,z:0}:{x:0,y:0,z:1};
        const y={x:ref.y*x.z-ref.z*x.y,y:ref.z*x.x-ref.x*x.z,z:ref.x*x.y-ref.y*x.x},norm=Math.hypot(y.x,y.y,y.z);y.x/=norm;y.y/=norm;y.z/=norm;
        const z={x:x.y*y.z-x.z*y.y,y:x.z*y.x-x.x*y.z,z:x.x*y.y-x.y*y.x};
        localFrame={x,y,z,reference:ref,rollApplied:false,convention:"global-Z reference; near-vertical global-Y"};
      }
    }
    elements.push({id:e.id,floorId:e.floorId,role:p.role,materialId:p.materialId,localAxis:p.localAxis,localFrame,
      diaphragmId:p.diaphragmId,ends,connections:p.connections,supports:p.supports,geometry:{footprint,bottom,top,openings:p.openingsM},planAreaM2:section.areaM2,
      section:e.type==="beam"?{shape:"rectangle",widthM:e.width,depthM:e.height,areaM2:e.width*e.height}:{shape:"polygon",areaM2:section.areaM2}});
  }
  if(!physical?.loads)add("load_inventory_unknown","project","missing_data","Tam yük envanteri bilinmiyor.");
  if(!elements.length)add("empty_model","project","missing_data","Hesap nesnesi yok.");
  for(const l of physical?.loads??[]) {
    if(l.kind==="temperature")add("thermal_unsupported",l.id,"unsupported","Sıcaklık etkisi korunur; eşdeğer kuvvet/gerinim hesabı henüz doğrulanmadı.");
    else if(!patches.some(p=>p.id===l.id))add("declared_load_not_compiled",l.id,"missing_data","Tanımlı yük giriş paketine aktarılmadı.");
  }
  for(const patch of patches) {
    if(!elements.some(e=>e.id===patch.elementId))add("load_target_missing",patch.id,"invalid","Yükün fiziksel elemanı bulunamadı.");
    if(!model.floors.some(f=>f.id===patch.floorId)||model.elements.find(e=>e.id===patch.elementId)?.floorId!==patch.floorId)add("load_floor_mismatch",patch.id,"invalid","Yükün katı/elemanı uyuşmuyor.");
    if(patch.basis==="point") {
      const target=patch.jointId?nodes.get(patch.jointId):null;
      if(!target||Math.hypot(target.x-patch.position.x,target.y-patch.position.y)>1e-8)add("point_load_joint_unknown",patch.id,"missing_data","Nokta yükünün gerçek XYZ düğümü/konumu gerekli.");
    }
    if(patch.kind==="self_weight") {
      const e=elements.find(e=>e.id===patch.elementId),rho=physical?.materials.find(m=>m.materialId===e?.materialId)?.properties?.densityKgM3;
      if(!e||rho===null||rho===undefined||patch.basis!=="volume"||patch.unit!=="kN/m3"||patch.provenance.source!=="derived"
        ||Math.abs(patch.intensity-rho*STANDARD_GRAVITY/1000)>1e-8*Math.max(1,rho*STANDARD_GRAVITY/1000)
        ||Math.abs(patch.measure-e.planAreaM2*(e.geometry.top-e.geometry.bottom))>1e-8*Math.max(1,patch.measure))add("self_weight_binding",patch.id,"invalid","Öz ağırlık malzeme yoğunluğu/net prizma geometrisiyle uyuşmuyor.");
      const signature=(points:{x:number;y:number}[])=>JSON.stringify([...points].map(p=>({x:p.x,y:p.y})).sort((a,b)=>a.x-b.x||a.y-b.y));
      if(e&&(!patch.footprint||signature(patch.footprint)!==signature(e.geometry.footprint)))add("self_weight_geometry",patch.id,"invalid","Öz ağırlık dağılım poligonu fiziksel elemanla aynı değil.");
      if(e&&JSON.stringify((patch.holes??[]).map(signature).sort())!==JSON.stringify((e.geometry.openings??[]).map(signature).sort()))add("self_weight_openings",patch.id,"invalid","Öz ağırlık boşlukları fiziksel geometriyle aynı değil.");
    }
  }
  for(const e of elements) if(!patches.some(p=>p.elementId===e.id))add("load_coverage_missing",e.id,"missing_data","Elemanın öz ağırlık/yük envanteri bildirilmedi.");
  let loads=null;
  try{loads=buildLoadLedger([...patches].sort((a,b)=>a.id.localeCompare(b.id)));}catch(error){add("load_invalid","project","invalid",String(error));}
  const adjacency=new Map<string,Set<string>>(),supports=new Set<string>();
  for(const e of elements) {
    const c=e.connections;
    if(c?.startJointId&&c.endJointId){for(const [a,b] of [[c.startJointId,c.endJointId],[c.endJointId,c.startJointId]]){const set=adjacency.get(a)??new Set();set.add(b);adjacency.set(a,set);}}
    for(const s of e.supports??[]) {if(!nodes.has(s.jointId))add("support_joint_missing",e.id,"invalid","Mesnetin düğümü yok.");else if(s.restrained.some(Boolean)||s.stiffness?.some(v=>v!==null&&v>0))supports.add(s.jointId);}
  }
  const reached=new Set<string>(),stack=[...supports];
  while(stack.length){const n=stack.pop()!;if(reached.has(n))continue;reached.add(n);stack.push(...(adjacency.get(n)??[]));}
  for(const n of nodes.keys())if(!reached.has(n))add("unsupported_component",n,"invalid","Bileşenin mesnede mekanik yolu yok.");
  const list=[...nodes.values()].sort((a,b)=>a.id.localeCompare(b.id));
  for(let i=0;i<list.length;i++)for(let j=0;j<i;j++)if(Math.hypot(list[i].x-list[j].x,list[i].y-list[j].y,list[i].z-list[j].z)<1e-8)add("unmerged_coincident_joints",list[i].id,"missing_data","Çakışan farklı düğüm kimlikleri otomatik birleştirilmedi.");
  return {schemaVersion:1,projectId:physical?.projectId??null,revision:physical?.revision??null,
    status:issues.length?"blocked":"input_ready",analysisApproved:false,stability:"requires_solver_check",nodes:list,elements,declaredLoads:physical?.loads??null,
    materials:physical?.materials??null,settings:physical?.settings??null,floorRoles:physical?.floorRoles??null,
    appliedLoadInputs:structuredClone([...patches].sort((a,b)=>a.id.localeCompare(b.id))),loads,massAssembly:"physical integrals only; FE mass matrix not assembled",issues:issues.sort((a,b)=>a.subject.localeCompare(b.subject)||a.code.localeCompare(b.code))};
}
