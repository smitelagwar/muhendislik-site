import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import {parseIde10} from './index';
import {readIdeStairTemplate} from './stairs';
import {deriveIdeStairPlan} from './stair-plan';
const sample='D:/IDM_DOWNLOAD/MUSTAFA SELVİ TÜM PROJELER/STATİK/1.kısım/MUSTAFA SELVİ 1.KISIM.ide10';
test('native explicit-count stairs retain edited corners, world placement and sequential numbers', {skip:!existsSync(sample)},()=>{
 const bytes=readFileSync(sample),view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength),project=parseIde10(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'Mustafa1.ide10');
 let total=0;
 for(const stair of project.elements.filter(e=>e.type==='stair')){
  const graph=readIdeStairTemplate(bytes,view,stair.sourceOffset,stair.name.length+1)!;
  const result=deriveIdeStairPlan(graph,stair.points[0],stair.mesh!)!;
  assert.ok(result,stair.name);assert.equal(result.rotationDegrees,0);assert.equal(result.flightCount,2);total+=result.flightCount;
  assert.ok(result.paths.every(p=>p.length>=2&&p.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y))));
  if(stair.name==='M1'){
   assert.equal(result.unsupportedFlightCount,0);assert.deepEqual(result.texts.map(t=>t.text),Array.from({length:18},(_,i)=>String(i+1)));
   const first=result.paths[0];assert.ok(first.some(p=>Math.abs(p.x-19.4)<1e-8),'native primary edit -0.05 must be applied');assert.ok(first.some(p=>Math.abs(p.x-18.2)<1e-8));
   assert.ok(first.every(p=>Math.abs(p.y-11.25)<1e-8));
   const step=result.paths[1];assert.ok(step.every(p=>Math.abs(p.y-10.98)<1e-8),'2.16m /8 verified tread intervals');
  } else assert.ok(result.unsupportedFlightCount>=1,'winding middle flights must not receive invented parallel steps');
  const automatic=structuredClone(graph);automatic.areas.find(a=>a.kind==='flight')!.riserCountParameter=0;
  assert.equal(deriveIdeStairPlan(automatic,stair.points[0],stair.mesh!),undefined,'automatic counts remain unresolved');
  const displaced={...stair.mesh!,positions:stair.mesh!.positions.map((v,i)=>i%3===0?v+100:v)};
  assert.equal(deriveIdeStairPlan(graph,stair.points[0],displaced),undefined,'stale/unmatched geometry must not authenticate placement');
 }
 assert.equal(total,14);
});
