import {beamMaterial,barArea,type BeamMaterial} from "./rc-beam-section";
export type SectionPoint={u:number;v:number};
export type ColumnShape=({kind:"rectangle";b:number;h:number;angleRad:number}|{kind:"circle";diameter:number}|{kind:"polygon";vertices:SectionPoint[]}) & {source:string;center?:SectionPoint};
export type ColumnBar=SectionPoint&{id:string;diameter:number};
function integrals(points:readonly SectionPoint[]){
 let area=0,qu=0,qv=0,Iu=0,Iv=0,Iuv=0;
 for(let i=0;i<points.length;i++){const p=points[i],q=points[(i+1)%points.length],c=p.u*q.v-q.u*p.v;area+=c/2;qu+=(p.u+q.u)*c/6;qv+=(p.v+q.v)*c/6;Iu+=(p.v*p.v+p.v*q.v+q.v*q.v)*c/12;Iv+=(p.u*p.u+p.u*q.u+q.u*q.u)*c/12;Iuv+=(2*p.u*p.v+p.u*q.v+q.u*p.v+2*q.u*q.v)*c/24;}
 return {area,qu,qv,Iu,Iv,Iuv};
}
export function columnGeometry(shape:ColumnShape){
 if(!shape.source?.trim())throw Error("Kolon kesit geometrisi kaynağı gerekli.");const center={...(shape.center??{u:0,v:0})};if(![center.u,center.v].every(Number.isFinite))throw Error("Kesit referansı geçersiz.");
 if(shape.kind==="circle"){
  if(!Number.isFinite(shape.diameter)||shape.diameter<=0)throw Error("Kolon çapı pozitif olmalı.");const r=shape.diameter/2,area=Math.PI*r*r,I=Math.PI*r**4/4;
  if(!Number.isFinite(I))throw Error("Kesit integrali taştı.");return {kind:"circle" as const,center,area,Iu:I,Iv:I,Iuv:0,r,vertices:[] as SectionPoint[],widthU:2*r,widthV:2*r,centrosymmetric:true};
 }
 let points:SectionPoint[];
 if(shape.kind==="rectangle"){
  if(![shape.b,shape.h,shape.angleRad].every(Number.isFinite)||shape.b<=0||shape.h<=0)throw Error("Kolon dikdörtgen ölçüsü/açısı geçersiz.");
  const c=Math.cos(shape.angleRad),s=Math.sin(shape.angleRad);points=[[-1,-1],[1,-1],[1,1],[-1,1]].map(([x,y])=>({u:c*x*shape.b/2-s*y*shape.h/2,v:s*x*shape.b/2+c*y*shape.h/2}));
 }else if(shape.kind==="polygon"){
  if(!Array.isArray(shape.vertices)||shape.vertices.length<3||shape.vertices.length>32||shape.vertices.some(p=>![p.u,p.v].every(Number.isFinite)))throw Error("3–32 gerçek poligon köşesi gerekli.");
  const origin=shape.vertices[0];points=shape.vertices.map(p=>({u:p.u-origin.u,v:p.v-origin.v}));let raw=integrals(points);if(raw.area<0){points.reverse();raw=integrals(points);}if(raw.area<=0||!Number.isFinite(raw.area))throw Error("Poligon alanı geçersiz.");
  const centroid={u:raw.qu/raw.area,v:raw.qv/raw.area};points=points.map(p=>({u:p.u-centroid.u,v:p.v-centroid.v}));center.u=origin.u+centroid.u;center.v=origin.v+centroid.v;
 }else throw Error("Kolon kesit ailesi desteklenmiyor.");
 const dimensions=Math.max(...points.flatMap(p=>[Math.abs(p.u),Math.abs(p.v)]));
 for(let i=0;i<points.length;i++){const a=points[i],b=points[(i+1)%points.length],c=points[(i+2)%points.length],cross=(b.u-a.u)*(c.v-b.v)-(b.v-a.v)*(c.u-b.u);if(cross<=1e-10*dimensions*dimensions)throw Error("Yalnız basit dışbükey, sıfır kenarsız poligon kesit destekleniyor.");
  for(const q of points)if((b.u-a.u)*(q.v-a.v)-(b.v-a.v)*(q.u-a.u)<-1e-8*dimensions*dimensions)throw Error("Kendiyle kesişen/dışbükey olmayan poligon desteklenmiyor.");}
 const m=integrals(points);if(![m.area,m.Iu,m.Iv].every(v=>Number.isFinite(v)&&v>0))throw Error("Kesit integrali geçersiz.");
 const widthU=Math.max(...points.map(p=>p.u))-Math.min(...points.map(p=>p.u)),widthV=Math.max(...points.map(p=>p.v))-Math.min(...points.map(p=>p.v));
 return {kind:"polygon" as const,center,area:m.area,Iu:m.Iu,Iv:m.Iv,Iuv:m.Iuv,r:0,vertices:points,widthU,widthV,centrosymmetric:points.every(p=>points.some(q=>Math.hypot(p.u+q.u,p.v+q.v)<=1e-7*Math.max(widthU,widthV)))};
}
export function columnBarGeometry(shape:ColumnShape,bars:readonly ColumnBar[]){
 const g=columnGeometry(shape);if(!bars.length||bars.length>100||new Set(bars.map(b=>b.id)).size!==bars.length)throw Error("Benzersiz ve sınırlı kolon donatı koordinatları gerekli.");
 const normalized=bars.map(b=>{if(!b.id||![b.u,b.v,b.diameter].every(Number.isFinite)||b.diameter<=0)throw Error("Kolon donatısı geçersiz.");const u=b.u-g.center.u,v=b.v-g.center.v;
  const distance=g.kind==="circle"?g.r-Math.hypot(u,v):Math.min(...g.vertices.map((a,i)=>{const c=g.vertices[(i+1)%g.vertices.length];return ((c.u-a.u)*(v-a.v)-(c.v-a.v)*(u-a.u))/Math.hypot(c.u-a.u,c.v-a.v);}));
  if(distance<b.diameter/2-1e-7)throw Error("Kolon boyuna donatısı kesit dışında.");return {...b,u,v,area:barArea(b.diameter),clearCover:distance-b.diameter/2};});
 for(let i=0;i<normalized.length;i++)for(let j=0;j<i;j++)if(Math.hypot(normalized[i].u-normalized[j].u,normalized[i].v-normalized[j].v)<(normalized[i].diameter+normalized[j].diameter)/2-1e-7)throw Error("Kolon donatı çubukları çakışıyor.");
 return {geometry:g,bars:normalized,steelArea:normalized.reduce((s,b)=>s+b.area,0),centrosymmetric:g.centrosymmetric&&normalized.every(b=>normalized.some(q=>Math.hypot(b.u+q.u,b.v+q.v)<1e-6&&Math.abs(b.diameter-q.diameter)<1e-7))};
}
function clippedIntegral(points:SectionPoint[],nu:number,nv:number,threshold:number){
 const clipped:SectionPoint[]=[];
 for(let i=0;i<points.length;i++){const a=points[i],b=points[(i+1)%points.length],da=nu*a.u+nv*a.v-threshold,db=nu*b.u+nv*b.v-threshold;
  if(da>=0)clipped.push(a);if((da<0&&db>0)||(da>0&&db<0)){const t=da/(da-db);clipped.push({u:a.u+t*(b.u-a.u),v:a.v+t*(b.v-a.v)});}}
 return clipped.length>=3?integrals(clipped):{area:0,qu:0,qv:0,Iu:0,Iv:0,Iuv:0};
}
/** TS500-7.1/7.5: M2=-∫σv dA, M3=∫σu dA; N basınç pozitif. */
export function prepareColumnSection(shape:ColumnShape,bars:readonly ColumnBar[],material:BeamMaterial){
 const model=columnBarGeometry(shape,bars),g=model.geometry,m=beamMaterial(material),referenceLength=Math.max(g.widthU,g.widthV),axialBounds={minimumKn:-model.steelArea*m.fyd/1000,maximumKn:(.85*m.fcd*g.area+model.steelArea*m.fyd)/1000};
 const plane=(theta:number,c:number)=>{
  if(!Number.isFinite(theta)||!Number.isFinite(c)||c<=0)throw Error("Tarafsız eksen düzlemi geçersiz.");const nu=Math.cos(theta),nv=Math.sin(theta),max=g.kind==="circle"?g.r:Math.max(...g.vertices.map(p=>nu*p.u+nv*p.v)),threshold=max-m.k1*c;
  let area:number,qu:number,qv:number;
  if(g.kind==="circle"){
   const t=threshold,r=g.r;if(t>=r){area=0;qu=0;qv=0;}else if(t<=-r){area=Math.PI*r*r;qu=0;qv=0;}else{const root=Math.sqrt(Math.max(0,r*r-t*t));area=r*r*Math.acos(t/r)-t*root;const first=2/3*root**3;qu=nu*first;qv=nv*first;}
  }else{const block=clippedIntegral(g.vertices,nu,nv,threshold);area=block.area;qu=block.qu;qv=block.qv;}
  let N=.85*m.fcd*area,M2=-.85*m.fcd*qv,M3=.85*m.fcd*qu;
  const steel=model.bars.map(b=>{const strain=m.ecu*(1-(max-nu*b.u-nv*b.v)/c),stress=Math.max(-m.fyd,Math.min(m.fyd,m.Es*strain)),force=b.area*stress;N+=force;M2-=force*b.v;M3+=force*b.u;return {id:b.id,strain,stressMPa:stress,forceN:force};});
  if(![N,M2,M3,area,qu,qv].every(Number.isFinite))throw Error("Kolon gerilme integrali taştı.");
  return {theta,c,Nkn:N/1000,M2knm:M2/1e6,M3knm:M3/1e6,concreteAreaMm2:area,steel,strainLimitSatisfied:steel.every(s=>Math.abs(s.strain)<=.1),momentOrder:"M2=-first-v,M3=first-u"};
 };
 const atN=(Nkn:number,theta:number)=>{
  if(!Number.isFinite(Nkn))throw Error("Kolon eksenel kuvveti sonlu olmalı.");let lo=referenceLength*1e-10,hi=referenceLength*10000;
  if(Nkn<=axialBounds.minimumKn+1e-8||Nkn>=axialBounds.maximumKn-1e-8)return null;
  for(let i=0;i<80;i++){const c=(lo+hi)/2;if(plane(theta,c).Nkn<Nkn)lo=c;else hi=c;}const result=plane(theta,(lo+hi)/2);
  if(Math.abs(result.Nkn-Nkn)>1e-7+1e-8*Math.abs(Nkn))throw Error("Kolon N dengesi yakınsamadı.");return result;
 };
 return {...model,material:m,axialBounds,plane,atN};
}
export function columnCapacity(shape:ColumnShape,bars:readonly ColumnBar[],material:BeamMaterial,Nkn:number,M2knm:number,M3knm:number,angularSamples=64){
 try{
  if(![Nkn,M2knm,M3knm].every(Number.isFinite)||!Number.isSafeInteger(angularSamples)||angularSamples<16||angularSamples>256)throw Error("Kolon talebi/açı bütçesi geçersiz.");
  const s=prepareColumnSection(shape,bars,material),magnitude=Math.hypot(M2knm,M3knm);
  if(!s.centrosymmetric)return {status:"unsupported" as const,reason:"Otomatik etkileşim kabulü merkez simetrili kesit/donatı profiliyle sınırlı.",engineeringAcceptance:false};
  if(Nkn<=s.axialBounds.minimumKn||Nkn>=s.axialBounds.maximumKn)return {status:"axial_limit" as const,axialBounds:s.axialBounds,engineeringAcceptance:false};
  if(magnitude===0)return {status:"solved" as const,utilization:Nkn>=0?Nkn/s.axialBounds.maximumKn:Nkn/s.axialBounds.minimumKn,capacityKnm:null,matchedState:null,axialBounds:s.axialBounds,method:"centrosymmetric nominal axial endpoint",engineeringAcceptance:false};
  const norm=(state:NonNullable<ReturnType<typeof s.atN>>)=>(M2knm*state.M3knm-M3knm*state.M2knm)/(magnitude*Math.max(1e-12,Math.hypot(state.M2knm,state.M3knm))),positive=(state:NonNullable<ReturnType<typeof s.atN>>)=>M2knm*state.M2knm+M3knm*state.M3knm>0,roots:NonNullable<ReturnType<typeof s.atN>>[]=[];
  const states=Array.from({length:angularSamples+1},(_,i)=>{const state=s.atN(Nkn,i*2*Math.PI/angularSamples);if(!state)throw Error("Sınırda eksenel kesit çözülemedi.");return state;});
  const add=(r:typeof states[number])=>{if(positive(r)&&!roots.some(p=>Math.abs(Math.hypot(p.M2knm,p.M3knm)/Math.hypot(r.M2knm,r.M3knm)-1)<1e-6))roots.push(r);};
  for(let i=0;i<angularSamples;i++){
   let a=states[i],b=states[i+1],fa=norm(a),fb=norm(b);if(Math.abs(fa)<1e-10)add(a);if(Math.abs(fb)<1e-10)add(b);
   if(fa*fb>=0)continue;for(let j=0;j<50;j++){const mid=s.atN(Nkn,(a.theta+b.theta)/2)!;const f=norm(mid);if(fa*f<=0){b=mid;fb=f;}else{a=mid;fa=f;}}add(s.atN(Nkn,(a.theta+b.theta)/2)!);
  }
  if(roots.length!==1)return {status:"nonconverged" as const,reason:"Tek ve doğrulanmış pozitif radyal kapasite dalı bulunamadı.",positiveBranches:roots.length,engineeringAcceptance:false};
  const matched=roots[0],capacityKnm=Math.hypot(matched.M2knm,matched.M3knm),alignmentResidual=Math.abs(norm(matched));
  if(!matched.strainLimitSatisfied)return {status:"strain_limit" as const,matchedState:matched,engineeringAcceptance:false};
  if(alignmentResidual>1e-7||capacityKnm<=0)throw Error("İki eksenli kapasite yön artığı büyük.");
  return {status:"solved" as const,Nkn,utilization:magnitude/capacityKnm,capacityKnm,matchedState:matched,axialBounds:s.axialBounds,alignmentResidual,method:"exact-compression-geometry and strain-compatible-biaxial-neutral-axis",angularSamples,engineeringAcceptance:false};
 }catch(error){return {status:"invalid_input" as const,reason:String(error),engineeringAcceptance:false};}
}
