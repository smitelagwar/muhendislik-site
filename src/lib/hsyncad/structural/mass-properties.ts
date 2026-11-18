import type { Point } from "../model";
import { isSimplePolygon, segmentIntersection } from "../geometry";

function inside(p: Point, ring: Point[]): boolean {
  let hit = false;
  for (let i=0,j=ring.length-1;i<ring.length;j=i++) {
    const a=ring[j],b=ring[i],cross=(p.x-a.x)*(b.y-a.y)-(p.y-a.y)*(b.x-a.x);
    if (Math.abs(cross)<1e-10 && p.x>=Math.min(a.x,b.x)-1e-10 && p.x<=Math.max(a.x,b.x)+1e-10 && p.y>=Math.min(a.y,b.y)-1e-10 && p.y<=Math.max(a.y,b.y)+1e-10) return false;
    if ((a.y>p.y)!==(b.y>p.y) && p.x<(b.x-a.x)*(p.y-a.y)/(b.y-a.y)+a.x) hit=!hit;
  }
  return hit;
}
function crosses(a: Point[], b: Point[]) {
  return a.some((p,i)=>b.some((q,j)=>!!segmentIntersection(p,a[(i+1)%a.length],q,b[(j+1)%b.length])));
}
/** Signed boundary integrals, evaluated near the geometry to avoid large-coordinate cancellation. */
export function polygonLamina(outline: Point[], densityKgM2: number, holes: Point[][] = []) {
  if (!Number.isFinite(densityKgM2) || densityKgM2<0) throw new Error("Geçersiz yüzey kütlesi.");
  const rings=[outline,...holes];
  if (rings.some(r=>r.some(p=>!Number.isFinite(p.x)||!Number.isFinite(p.y))||!isSimplePolygon(r))) throw new Error("Geçersiz kapalı poligon.");
  for (let i=0;i<holes.length;i++) {
    if (!holes[i].every(p=>inside(p,outline)) || crosses(holes[i],outline)) throw new Error("Boşluk dış sınır içinde ve temas etmeden kalmalıdır.");
    for(let j=0;j<i;j++) if(crosses(holes[i],holes[j])||inside(holes[i][0],holes[j])||inside(holes[j][0],holes[i])) throw new Error("Boşluklar çakışamaz veya iç içe olamaz.");
  }
  const origin=outline[0]; let area=0,mx=0,my=0,polar=0;
  rings.forEach((ring,index)=>{
    let a=0,x=0,y=0,j=0;
    ring.forEach((p,i)=>{
      const q=ring[(i+1)%ring.length],px=p.x-origin.x,py=p.y-origin.y,qx=q.x-origin.x,qy=q.y-origin.y,c=px*qy-qx*py;
      a+=c/2;x+=(px+qx)*c/6;y+=(py+qy)*c/6;
      j+=(px*px+px*qx+qx*qx+py*py+py*qy+qy*qy)*c/12;
    });
    if(Math.abs(a)<1e-10) throw new Error("Sıfır alanlı poligon.");
    const sign=(a>0?1:-1)*(index===0?1:-1);area+=sign*a;mx+=sign*x;my+=sign*y;polar+=sign*j;
  });
  if(area<=1e-10) throw new Error("Net alan pozitif olmalıdır.");
  const x=mx/area,y=my/area;
  const result={areaM2:area,massKg:area*densityKgM2,center:{x:origin.x+x,y:origin.y+y},polarKgM2:(polar-area*(x*x+y*y))*densityKgM2};
  if(!Number.isFinite(result.massKg)||!Number.isFinite(result.polarKgM2)||result.polarKgM2<0) throw new Error("Kütle integrali başarısız.");
  return result;
}
export function combineLaminas(parts: ReturnType<typeof polygonLamina>[]) {
  const massKg=parts.reduce((s,p)=>s+p.massKg,0);
  if(!Number.isFinite(massKg)||massKg<=0) throw new Error("Toplam kütle pozitif olmalıdır.");
  const origin=parts[0].center;
  const dx=parts.reduce((s,p)=>s+p.massKg*(p.center.x-origin.x),0)/massKg;
  const dy=parts.reduce((s,p)=>s+p.massKg*(p.center.y-origin.y),0)/massKg;
  const center={x:origin.x+dx,y:origin.y+dy};
  const polarKgM2=parts.reduce((s,p)=>s+p.polarKgM2+p.massKg*((p.center.x-center.x)**2+(p.center.y-center.y)**2),0);
  if(!Number.isFinite(center.x)||!Number.isFinite(center.y)||!Number.isFinite(polarKgM2)||polarKgM2<0) throw new Error("Birleşik kütle integrali başarısız.");
  return {massKg,center,polarKgM2};
}
