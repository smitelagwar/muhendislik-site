import {columnGeometry,type ColumnShape,type ColumnBar,type SectionPoint} from "./rc-column-section";
import {beamMaterial,barArea,type BeamMaterial} from "./rc-beam-section";
export type WallCell={id:string;physicalPanelId:string;shape:Extract<ColumnShape,{kind:"rectangle"}>};
export type WallSection={cells:WallCell[];bars:ColumnBar[];source:string};
const cross=(a:SectionPoint,b:SectionPoint)=>a.u*b.v-a.v*b.u;
function integral(p:SectionPoint[]){let area=0,qu=0,qv=0;for(let i=0;i<p.length;i++){const a=p[i],b=p[(i+1)%p.length],d=cross(a,b);area+=d/2;qu+=(a.u+b.u)*d/6;qv+=(a.v+b.v)*d/6;}return {area,qu,qv};}
function clip(p:SectionPoint[],u:number,v:number,t:number){const out:SectionPoint[]=[];for(let i=0;i<p.length;i++){const a=p[i],b=p[(i+1)%p.length],da=u*a.u+v*a.v-t,db=u*b.u+v*b.v-t;if(da>=0)out.push(a);if(da*db<0){const s=da/(da-db);out.push({u:a.u+s*(b.u-a.u),v:a.v+s*(b.v-a.v)});}}return out;}
export function wallCellOverlapArea(a:WallCell,b:WallCell){const points=(c:WallCell)=>{const g=columnGeometry(c.shape);return g.vertices.map(p=>({u:p.u+g.center.u,v:p.v+g.center.v}));};let p=points(a);const q=points(b);for(let i=0;i<q.length;i++){const a=q[i],b=q[(i+1)%q.length],u=-(b.v-a.v),v=b.u-a.u;p=clip(p,u,v,u*a.u+v*a.v);}return integral(p).area;}
export function prepareWallSection(section:WallSection,material:BeamMaterial){
 if(!section.source?.trim()||!section.cells.length||section.cells.length>16||new Set(section.cells.map(c=>c.id)).size!==section.cells.length||new Set(section.cells.map(c=>c.physicalPanelId)).size!==section.cells.length||section.cells.some(c=>!c.id||!c.physicalPanelId))throw Error("Tekil fiziksel panel ve sınırlı kesit hücresi gerekli.");
 const cells=section.cells.map(c=>{const g=columnGeometry(c.shape);return {...c,vertices:g.vertices.map(p=>({u:p.u+g.center.u,v:p.v+g.center.v})),area:g.area,center:g.center};}),touch=cells.map(()=>new Set<number>());
 for(let i=0;i<cells.length;i++)for(let j=0;j<i;j++){
  let intersection=cells[i].vertices;const p=cells[j].vertices;
  for(let k=0;k<p.length;k++){const a=p[k],b=p[(k+1)%p.length],u=-(b.v-a.v),v=b.u-a.u;intersection=clip(intersection,u,v,u*a.u+v*a.v);}
  if(integral(intersection).area>1e-5)throw Error("Perde hücreleri kesişiyor: beton/kuvvet iki kez sayılamaz; gerçek ayrık bölümlere ayır.");
  for(let a=0;a<4;a++)for(let b=0;b<4;b++){const p=cells[i].vertices[a],q=cells[i].vertices[(a+1)%4],r=cells[j].vertices[b],s=cells[j].vertices[(b+1)%4],dx=q.u-p.u,dy=q.v-p.v,L=Math.hypot(dx,dy),distance=(x:SectionPoint)=>Math.abs(dx*(x.v-p.v)-dy*(x.u-p.u))/L;
   if(distance(r)<1e-6&&distance(s)<1e-6){const t=(x:SectionPoint)=>((x.u-p.u)*dx+(x.v-p.v)*dy)/L,overlap=Math.min(L,Math.max(t(r),t(s)))-Math.max(0,Math.min(t(r),t(s)));if(overlap>1e-6){touch[i].add(j);touch[j].add(i);}}
  }
 }
 const visited=new Set([0]),queue=[0];for(const i of queue)for(const j of touch[i])if(!visited.has(j)){visited.add(j);queue.push(j);}if(visited.size!==cells.length)throw Error("Ayrık perde parçaları tek monolitik kesit sayılamaz; bağ kirişi modeli gerekir.");
 const area=cells.reduce((s,c)=>s+c.area,0),center={u:cells.reduce((s,c)=>s+c.area*c.center.u,0)/area,v:cells.reduce((s,c)=>s+c.area*c.center.v,0)/area},polygons=cells.map(c=>c.vertices.map(p=>({u:p.u-center.u,v:p.v-center.v}))),vertices=polygons.flat(),size=Math.max(...vertices.map(p=>Math.hypot(p.u,p.v)))*2;
 if(!section.bars.length||section.bars.length>800||new Set(section.bars.map(b=>b.id)).size!==section.bars.length)throw Error("Gerçek ve tekil perde düşey donatısı gerekli.");
 const bars=section.bars.map(b=>{if(!b.id||![b.u,b.v,b.diameter].every(Number.isFinite)||b.diameter<=0)throw Error("Perde donatısı geçersiz.");
  const fits=cells.some(c=>c.vertices.every((p,i)=>{const q=c.vertices[(i+1)%4];return ((q.u-p.u)*(b.v-p.v)-(q.v-p.v)*(b.u-p.u))/Math.hypot(q.u-p.u,q.v-p.v)>=b.diameter/2-1e-7;}));if(!fits)throw Error("Donatı doğrulanmış beton hücresine sığmıyor.");return {...b,u:b.u-center.u,v:b.v-center.v,area:barArea(b.diameter)};});
 for(let i=0;i<bars.length;i++)for(let j=0;j<i;j++)if(Math.hypot(bars[i].u-bars[j].u,bars[i].v-bars[j].v)<(bars[i].diameter+bars[j].diameter)/2-1e-7)throw Error("Perde donatıları çakışıyor.");
 const m=beamMaterial(material),steelArea=bars.reduce((s,b)=>s+b.area,0),bounds={min:-steelArea*m.fyd/1000,max:(.85*m.fcd*area+steelArea*m.fyd)/1000};
 const plane=(theta:number,c:number)=>{const u=Math.cos(theta),v=Math.sin(theta),edge=Math.max(...vertices.map(p=>u*p.u+v*p.v)),threshold=edge-m.k1*c,blocks=polygons.map(p=>integral(clip(p,u,v,threshold)));let N=0,M2=0,M3=0;
  for(const b of blocks){N+=.85*m.fcd*b.area;M2-=.85*m.fcd*b.qv;M3+=.85*m.fcd*b.qu;}
  let strainLimit=true;for(const b of bars){const e=m.ecu*(1-(edge-u*b.u-v*b.v)/c),f=b.area*Math.max(-m.fyd,Math.min(m.fyd,m.Es*e));N+=f;M2-=f*b.v;M3+=f*b.u;if(Math.abs(e)>.1)strainLimit=false;}
  return {theta,c,Nkn:N/1000,M2knm:M2/1e6,M3knm:M3/1e6,strainLimit};};
 const atN=(N:number,theta:number)=>{if(!Number.isFinite(N)||N<=bounds.min||N>=bounds.max)throw Error("Perde eksenel kuvveti nominal uç sınırının dışında.");let a=size*1e-10,b=size*1e4;for(let i=0;i<75;i++){const c=(a+b)/2;if(plane(theta,c).Nkn<N)a=c;else b=c;}const r=plane(theta,(a+b)/2);if(Math.abs(r.Nkn-N)>1e-6+1e-8*Math.abs(N))throw Error("Perde N dengesi yakınsamadı.");return r;};
 return {area,center,cells,bars,steelArea,bounds,plane,atN};
}
export function wallCapacity(section:WallSection,material:BeamMaterial,Nkn:number,M2knm:number,M3knm:number){
 try{
  if(![Nkn,M2knm,M3knm].every(Number.isFinite)||Math.hypot(M2knm,M3knm)===0)throw Error("Sıfır olmayan açık perde moment yönü gerekli.");
  const p=prepareWallSection(section,material),states=Array.from({length:129},(_,i)=>p.atN(Nkn,2*Math.PI*i/128)),mag=Math.hypot(M2knm,M3knm),f=(s:typeof states[number])=>(M2knm*s.M3knm-M3knm*s.M2knm)/mag;
  let winding=0;for(let i=0;i<128;i++){const a=states[i],b=states[i+1],c=a.M2knm*b.M3knm-a.M3knm*b.M2knm;if(a.M3knm<=0&&b.M3knm>0&&c>0)winding++;if(a.M3knm>0&&b.M3knm<=0&&c<0)winding--;}
  if(Math.abs(winding)!==1)return {status:"requires_engineering" as const,reason:"Sıfır moment noktası doğrulanmış N etkileşim çevriminin içinde değil.",engineeringAcceptance:false};
  const roots:typeof states=[];for(let i=0;i<128;i++){let a=states[i],b=states[i+1],fa=f(a),fb=f(b);if(Math.abs(fa)<1e-8)roots.push(a);if(fa*fb>=0)continue;for(let j=0;j<45;j++){const mid=p.atN(Nkn,(a.theta+b.theta)/2),fm=f(mid);if(fa*fm<=0){b=mid;fb=fm;}else{a=mid;fa=fm;}}roots.push(p.atN(Nkn,(a.theta+b.theta)/2));}
  const positive=roots.filter(s=>s.M2knm*M2knm+s.M3knm*M3knm>0).sort((a,b)=>Math.hypot(a.M2knm,a.M3knm)-Math.hypot(b.M2knm,b.M3knm));
  if(!positive.length)throw Error("Pozitif kapasite dalı yakınsamadı.");const state=positive[0],capacityKnm=Math.hypot(state.M2knm,state.M3knm),residual=Math.abs(f(state))/capacityKnm;
  if(!state.strainLimit||residual>1e-7)return {status:"requires_engineering" as const,reason:"Perde kapasite gerinim/yön sınırı doğrulanmadı.",engineeringAcceptance:false};
  return {status:"solved" as const,Nkn,capacityKnm,utilization:mag/capacityKnm,state,alignmentResidual:residual,areaMm2:p.area,steelAreaMm2:p.steelArea,centroid:p.center,radialBranch:"nearest-positive-crossing-with-origin-inside",engineeringAcceptance:false};
 }catch(error){return {status:"invalid_input" as const,reason:String(error),engineeringAcceptance:false};}
}
