import type { IdeMesh, IdePoint } from './index';
import type { IdeStairArea, IdeStairNode, IdeStairTemplate } from './stairs';
import { evaluateStairExpression } from './stair-geometry';

export interface IdeStairPlan {
  source: 'parametric-derived';
  paths: IdePoint[][];
  texts: { point: IdePoint; text: string; rotation?: number }[];
  flightCount: number;
  unsupportedFlightCount: number;
  /** Placement is accepted only with an unambiguous source-mesh corner match. */
  rotationDegrees: number;
}
const EPS = 0.00005;
const distance = (a: IdePoint, b: IdePoint) => Math.hypot(a.x-b.x,a.y-b.y);
const midpoint = (a: IdePoint,b: IdePoint) => ({x:(a.x+b.x)/2,y:(a.y+b.y)/2});

/**
 * Explicit-count straight flights only. Native primary-node edit XY and
 * cardinal placement are independently corroborated by stored analysis nodes.
 * Winding/automatic flights retain their existing native boundary display.
 */
export function deriveIdeStairPlan(graph: IdeStairTemplate, anchor: IdePoint, mesh: IdeMesh): IdeStairPlan | undefined {
  if (mesh.source !== 'native-analysis-mesh' || !mesh.positions.length || mesh.positions.length % 3) return;
  const nodes = new Map(graph.nodes.map(n=>[n.id,n]));
  const nativePoints: IdePoint[] = [];
  for(let i=0;i<mesh.positions.length;i+=3) nativePoints.push({x:mesh.positions[i],y:mesh.positions[i+1]});
  const sourcePoint=(node:IdeStairNode, allowSecondary=false):IdePoint|undefined=>{
    const formula=graph.formulaPoints[node.id];
    if(!formula || !Number.isFinite(formula.x) || !Number.isFinite(formula.y))return;
    if(node.kind==='secondary'){
      // Method3 formula positions with zero edits are unambiguous; other
      // secondary edit/trailer meanings have not been authenticated.
      if(!allowSecondary || node.method!==3 || node.nativeTrailer.some(n=>Math.abs(n)>1e-9))return;
      return formula;
    }
    const [dx,dy]=node.nativeTrailer;
    if(!Number.isFinite(dx)||!Number.isFinite(dy)||Math.abs(dx)>1000||Math.abs(dy)>1000)return;
    return{x:formula.x+dx,y:formula.y+dy};
  };
  const contourIds=new Set(graph.contours.flatMap(c=>c.curves.flatMap(c=>c.nodeIds)));
  const corners=graph.nodes.filter(n=>contourIds.has(n.id)&&sourcePoint(n));
  if(corners.length<4)return;
  const rotations=[0,90,180,270].map(degrees=>{
    const theta=degrees*Math.PI/180, cos=Math.cos(theta),sin=Math.sin(theta);
    const transform=(p:IdePoint)=>({x:anchor.x+p.x*cos-p.y*sin,y:anchor.y+p.x*sin+p.y*cos});
    const match=(p:IdePoint)=>nativePoints.some(q=>distance(p,q)<=EPS);
    return {degrees,transform,match,matches:corners.filter(n=>match(transform(sourcePoint(n)!))).length};
  }).sort((a,b)=>b.matches-a.matches);
  const placement=rotations[0];
  if(placement.matches<4||placement.matches/corners.length<.75||placement.matches===rotations[1].matches)return;
  const point=(id:number,secondary=false)=>{const n=nodes.get(id), p=n&&sourcePoint(n,secondary);return p&&placement.transform(p);};
  const line=(ids:number[],secondary=false):[IdePoint,IdePoint]|undefined=>{
    if(ids.length!==2)return;const a=point(ids[0],secondary),b=point(ids[1],secondary);
    if(a&&b&&distance(a,b)>1e-8)return[a,b];
  };
  const contours=new Map(graph.contours.map(c=>[c.id,c]));
  const ordered:IdeStairArea[]=[];
  const byName=new Map(graph.areas.map(a=>[a.name,a]));
  let current=graph.areas.find(a=>a.previousName==='NULL');
  while(current&&!ordered.includes(current)){ordered.push(current);current=byName.get(current.nextName);}
  const linked=ordered.length===graph.areas.length&&byName.size===graph.areas.length;
  if(!linked)return;
  // The first option's top-tread interpretation is independently corroborated
  // by uniform native rise/count ratios in the connected flight sequence.
  const rises=ordered.filter(a=>a.kind==='flight').map(a=>{
    const height=evaluateStairExpression(a.totalRiseExpression,graph.variables);
    const count=a.riserCountParameter+(a.nativeOptions[0]===0?1:0);
    return height!==null&&count>0&&Number.isInteger(count)&&a.riserCountParameter>0 ? height/count : null;
  });
  const countMode=rises.length>0&&rises.every((r):r is number=>r!==null&&r>0&&r<1)&&Math.max(...rises as number[])-Math.min(...rises as number[])<.0001;
  const result:IdeStairPlan={source:'parametric-derived',paths:[],texts:[],flightCount:0,unsupportedFlightCount:0,rotationDegrees:placement.degrees};
  let stepOffset=0;
  for(const area of ordered){
    if(area.kind!=='flight')continue;
    const risers=area.riserCountParameter+(area.nativeOptions[0]===0?1:0);
    const initialNumber=stepOffset+1;
    if(countMode)stepOffset+=risers;
    const sides=area.contourIds.map(id=>contours.get(id));
    const start=sides[0],end=sides.at(-1);
    const startLine=start?.curves.length===1&&start.curves[0].kind===0?line(start.curves[0].nodeIds):undefined;
    let endLine=end?.curves.length===1&&end.curves[0].kind===0?line(end.curves[0].nodeIds):undefined;
    const lot=area.lotIds.length===1?graph.lots.find(l=>l.id===area.lotIds[0]):undefined;
    const straightSides=sides.length===4&&sides.slice(1,-1).every(c=>c&&c.curves.every(l=>l.kind===0)&&c.curves.filter(l=>l.nodeIds[0]!==l.nodeIds[1]).length===1);
    if(!countMode||risers<2||risers>1000||!startLine||!endLine||!straightSides||!lot||lot.curves.length!==1||lot.curves[0].kind!==0||area.skewBegin||area.skewEnd||area.skewMethod){result.unsupportedFlightCount++;continue;}
    if(distance(startLine[0],endLine[0])+distance(startLine[1],endLine[1])>distance(startLine[0],endLine[1])+distance(startLine[1],endLine[0]))endLine=[endLine[1],endLine[0]];
    const [a,b]=startLine,[c,d]=endLine;
    if(![a,b,c,d].every(placement.match)){result.unsupportedFlightCount++;continue;}
    const before=midpoint(a,b),after=midpoint(c,d),dx=after.x-before.x,dy=after.y-before.y,length=Math.hypot(dx,dy),width=distance(a,b);
    // Parallel equal-width cross-sections with equal straight side vectors.
    if(length<.01||width<.1||Math.abs(width-distance(c,d))>1e-6||Math.hypot((c.x-a.x)-(d.x-b.x),(c.y-a.y)-(d.y-b.y))>1e-6||Math.abs((b.x-a.x)*dx+(b.y-a.y)*dy)>1e-6){result.unsupportedFlightCount++;continue;}
    for(let i=0;i<risers;i++){
      const t=i/(risers-1),p={x:a.x+(c.x-a.x)*t,y:a.y+(c.y-a.y)*t},q={x:b.x+(d.x-b.x)*t,y:b.y+(d.y-b.y)*t};
      result.paths.push([p,q]);
      const middle=midpoint(p,q);
      result.texts.push({point:{x:middle.x-dx/length*.04,y:middle.y-dy/length*.04},text:String(initialNumber+i),rotation:0});
    }
    const walking=line(lot.curves[0].nodeIds,true);
    if(walking){
      result.paths.push(walking);
      const radius=evaluateStairExpression(lot.circleExpression,graph.variables);
      if(lot.startCircle&&radius!==null&&radius>0&&radius<1)result.paths.push(Array.from({length:33},(_,i)=>({x:walking[0].x+radius*Math.cos(i*Math.PI/16),y:walking[0].y+radius*Math.sin(i*Math.PI/16)})));
      const arrow=evaluateStairExpression(lot.arrowExpression,graph.variables);
      if(lot.endArrow&&arrow!==null&&arrow>0&&arrow<1){
        const end=walking[1],wx=end.x-walking[0].x,wy=end.y-walking[0].y,wl=Math.hypot(wx,wy);
        result.paths.push([{x:end.x-wx/wl*arrow-wy/wl*arrow*.4,y:end.y-wy/wl*arrow+wx/wl*arrow*.4},end,{x:end.x-wx/wl*arrow+wy/wl*arrow*.4,y:end.y-wy/wl*arrow-wx/wl*arrow*.4}]);
      }
    }
    // Arrow/circle endpoints with nonzero secondary-node edit trailers stay
    // unresolved; no replacement path is invented.
    result.flightCount++;
  }
  return result.flightCount?result:undefined;
}
