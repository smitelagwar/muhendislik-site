import {cross,dot,type V3} from "./frame-element";
export type RectOpening={x0:number;x1:number;y0:number;y1:number};
/** Conforming structured rectangular mesh. Opening edges enter both grid axes, never bridged. */
export function meshRectPanel(input:{id:string;origin:V3;axisX:V3;axisY:V3;width:number;height:number;divisionsX:number;divisionsY:number;openings:readonly RectOpening[]}){
 const {id,origin,axisX,axisY,width,height,divisionsX,divisionsY,openings}=input;
 if(!id||origin.length!==3||axisX.length!==3||axisY.length!==3||[...origin,...axisX,...axisY,width,height].some(v=>!Number.isFinite(v))||width<=0||height<=0
  ||![divisionsX,divisionsY].every(n=>Number.isSafeInteger(n)&&n>0&&n<=128)||Math.abs(dot(axisX,axisX)-1)>1e-10||Math.abs(dot(axisY,axisY)-1)>1e-10||Math.abs(dot(axisX,axisY))>1e-10||openings.length>32)throw Error("Invalid orthogonal rectangular mesh domain/budget.");
 openings.forEach((h,i)=>{
  if(!Object.values(h).every(Number.isFinite)||h.x0<=0||h.y0<=0||h.x1>=width||h.y1>=height||h.x0>=h.x1||h.y0>=h.y1)throw Error("Opening must be strictly inside panel.");
  if(openings.slice(0,i).some(q=>h.x0<=q.x1&&h.x1>=q.x0&&h.y0<=q.y1&&h.y1>=q.y0))throw Error("Overlapping/touching openings unsupported.");
 });
 const xs=[...new Set([...Array.from({length:divisionsX+1},(_,i)=>i*width/divisionsX),...openings.flatMap(h=>[h.x0,h.x1])])].sort((a,b)=>a-b);
 const ys=[...new Set([...Array.from({length:divisionsY+1},(_,i)=>i*height/divisionsY),...openings.flatMap(h=>[h.y0,h.y1])])].sort((a,b)=>a-b);
 if(xs.some((x,i)=>i>0&&x-xs[i-1]<1e-10*width)||ys.some((y,i)=>i>0&&y-ys[i-1]<1e-10*height))throw Error("Near-coincident grid lines; resolve explicitly.");
 const key=(x:number,y:number)=>`${id}:n:${x}:${y}`,cells:{id:string;nodes:readonly[string,string,string,string]}[]=[],used=new Set<string>();
 for(let y=0;y<ys.length-1;y++)for(let x=0;x<xs.length-1;x++){
  const cx=(xs[x]+xs[x+1])/2,cy=(ys[y]+ys[y+1])/2;if(openings.some(h=>cx>h.x0&&cx<h.x1&&cy>h.y0&&cy<h.y1))continue;
  const ids=[key(x,y),key(x+1,y),key(x+1,y+1),key(x,y+1)] as const;ids.forEach(n=>used.add(n));cells.push({id:`${id}:s:${x}:${y}`,nodes:ids});
 }
 const nodes=ys.flatMap((y,j)=>xs.map((x,i)=>({id:key(i,j),position:origin.map((v,d)=>v+x*axisX[d]+y*axisY[d]) as unknown as V3}))).filter(n=>used.has(n.id));
 return {nodes,cells,normal:cross(axisX,axisY),area:width*height-openings.reduce((a,h)=>a+(h.x1-h.x0)*(h.y1-h.y0),0),method:"orthogonal-grid-opening-lines-v1"};
}
