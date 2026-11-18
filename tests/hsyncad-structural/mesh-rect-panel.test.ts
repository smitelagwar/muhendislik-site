import test from "node:test";
import assert from "node:assert/strict";
import {meshRectPanel} from "../../src/lib/hsyncad/structural/mesh-rect-panel";
import {compileShellRect} from "../../src/lib/hsyncad/structural/shell-rect";
const input={id:"wall",origin:[2,3,4] as const,axisX:[1,0,0] as const,axisY:[0,0,1] as const,width:5,height:3,divisionsX:4,divisionsY:3,openings:[{x0:1.1,x1:2.3,y0:.5,y1:2.2}]};
test("mesh preserves opening area, planarity and shared edge connectivity",()=>{
 const mesh=meshRectPanel(input),map=new Map(mesh.nodes.map(n=>[n.id,n.position]));let area=0;const edges=new Map<string,number>();
 for(const cell of mesh.cells){const c=compileShellRect({...cell,E:3e7,nu:.2,thickness:.2,shearCorrection:5/6,drillPenalty:.01,modifiers:{membrane:1,bending:1,shear:1},pressure:0},cell.nodes.map(id=>map.get(id)!) as never);area+=c.area;
  cell.nodes.forEach((a,i)=>{const key=[a,cell.nodes[(i+1)%4]].sort().join("/");edges.set(key,(edges.get(key)??0)+1);});
 }
 assert.ok(Math.abs(area-(15-1.2*1.7))<1e-10);assert.ok(Math.abs(area-mesh.area)<1e-10);assert.ok([...edges.values()].every(n=>n===1||n===2));assert.ok(mesh.nodes.every(n=>n.position[1]===3));assert.deepEqual(mesh,meshRectPanel(input));
});
test("mesh rejects invalid axes, exterior/overlapping holes and unbounded refinement",()=>{
 assert.throws(()=>meshRectPanel({...input,axisY:[1,0,0]}));assert.throws(()=>meshRectPanel({...input,divisionsX:10000}));assert.throws(()=>meshRectPanel({...input,openings:[...input.openings,...input.openings]}));assert.throws(()=>meshRectPanel({...input,openings:[{x0:-1,x1:2,y0:.5,y1:2}]}));
});
