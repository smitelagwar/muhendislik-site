import { test } from "node:test";
import assert from "node:assert/strict";
import { CadReviewStore } from "../../src/lib/dokumantasyon/cad-review/store";
import { CadMarkupFacade, translateMarkupItem } from "../../src/lib/dokumantasyon/cad-review/markup-facade";
import { CadMarkupController } from "../../src/lib/dokumantasyon/cad-review/markup-controller";
import { findHitReviewItem, hitTestReviewItem } from "../../src/lib/dokumantasyon/cad-review/hit-test";
import { generateRevisionCloudPoints, generateRevisionCloudSvgPath } from "../../src/lib/dokumantasyon/cad-review/cloud-generator";
import { cadReviewDocumentSchema, type CadReviewDocument, type CadReviewItem } from "../../src/lib/dokumantasyon/cad-review/schema";

const now = "2026-11-02T00:00:00.000Z";
function doc(): CadReviewDocument {
  return {
    schemaVersion: 1,
    fileId: "11111111-1111-4111-8111-111111111111",
    sourceVersionKey: "test.dxf",
    sourceSha256: "a".repeat(64),
    revision: 0,
    items: [],
    createdAt: now, updatedAt: now,
  };
}
const project = (p: {x:number;y:number}) => ({...p});
function create() {
  const store = new CadReviewStore(doc());
  return { store, facade: new CadMarkupFacade(store) };
}
class Surface extends EventTarget {
  private readonly captured = new Set<number>();
  getBoundingClientRect() { return { left: 0, top: 0, width: 1200, height: 800 }; }
  setPointerCapture(id: number) { this.captured.add(id); }
  releasePointerCapture(id: number) { this.captured.delete(id); }
  hasPointerCapture(id: number) { return this.captured.has(id); }
}
function pointer(el: Surface, kind: string, x: number, y: number,
  opts: {id?:number; shift?:boolean; primary?:boolean; type?:string; button?:number}={}) {
  const ev = Object.assign(new Event(kind,{bubbles:true,cancelable:true}), {
    pointerId:opts.id??1, pointerType:opts.type??"mouse",
    isPrimary:opts.primary??true, shiftKey:opts.shift??false,
    button:opts.button??0, clientX:x, clientY:y,
  });
  el.dispatchEvent(ev);
}
function click(el: Surface, x:number,y:number,opts={}) {
  pointer(el,"pointerdown",x,y,opts);
  pointer(el,"pointerup",x,y,opts);
}
function dom<T>(fn:(host:Surface, win:Surface)=>T):T {
  const g=globalThis as unknown as {window?: Window;document?:Document};
  const prevW=g.window,prevD=g.document;
  const win=new Surface(),document=Object.assign(new Surface(),{hidden:false});
  const host=new Surface();
  g.window=win as unknown as Window;
  g.document=document as unknown as Document;
  try { return fn(host,win); } finally {g.window=prevW;g.document=prevD;}
}

test("Circle center/radius in preview, hit test and persisted geometry agree",()=>{
  const {store,facade}=create();
  const circle=facade.addShape({
    shapeKind:"circle",p1:{x:50,y:50},p2:{x:90,y:50},radius:40,
  });
  assert.equal(hitTestReviewItem(circle,{x:50,y:90},{projectWorldToScreen:project,tolerancePx:2}),true);
  assert.equal(hitTestReviewItem(circle,{x:50,y:50},{projectWorldToScreen:project,tolerancePx:2}),false);
  assert.equal(hitTestReviewItem(circle,{x:10,y:50},{projectWorldToScreen:project,tolerancePx:2}),true);
  assert.equal(store.getItems().length,1);
  assert.equal(cadReviewDocumentSchema.parse(JSON.parse(JSON.stringify(store.getDocument()))).items[0]?.type,"shape");
});

test("Cloud generator is bounded at huge extents, works in reversed direction and matches same hit curve",()=>{
  const a={x:20,y:30},b={x:260,y:190};
  const original=generateRevisionCloudPoints(a,b,{arcRadius:9,segmentsPerArc:4});
  const reversed=generateRevisionCloudPoints(b,a,{arcRadius:9,segmentsPerArc:4});
  assert.deepEqual(original,reversed);
  assert.ok(original.length>20);
  assert.ok(generateRevisionCloudSvgPath(a,b,{arcRadius:9,segmentsPerArc:4}).startsWith("M "));
  const huge=generateRevisionCloudPoints({x:-1e9,y:-1e9},{x:1e9,y:1e9},{arcRadius:9,segmentsPerArc:4});
  assert.ok(huge.length<=1600, String(huge.length));
  assert.deepEqual(generateRevisionCloudPoints(a,a),[]);
  const {facade}=create();
  const cloud=facade.addShape({shapeKind:"cloud",p1:b,p2:a});
  assert.equal(hitTestReviewItem(cloud,original[0]!,{
    projectWorldToScreen:project,tolerancePx:2,
  }),true);
});

test("Reversed rectangle drag -> transient preview, one valid item, exactly one undo/redo",()=>{
  dom(host=>{
    const {store,facade}=create();
    const ctl=new CadMarkupController(host as unknown as HTMLElement,store,facade,{
      screenToWorld:project, worldToScreen:project,
      setCameraInteractionEnabled:()=>{},
    });
    store.setActiveTool("shape_rect");
    pointer(host,"pointerdown",100,100);
    pointer(host,"pointermove",20,30);
    assert.equal(store.getDraft().draftItem?.type,"shape");
    assert.equal(store.getItems().length,0);
    pointer(host,"pointerup",20,30);
    assert.equal(store.getDraft().draftItem,null);
    assert.equal(store.getItems().length,1);
    const rect=store.getItems()[0];
    assert.equal(rect?.type,"shape");
    if(rect?.type==="shape"){
      assert.deepEqual(rect.p1,{x:100,y:100});
      assert.deepEqual(rect.p2,{x:20,y:30});
    }
    assert.equal(store.undo(),true);
    assert.equal(store.getItems().length,0);
    assert.equal(store.undo(),false);
    assert.equal(store.redo(),true);
    assert.equal(store.getItems().length,1);
    ctl.destroy();
  });
});

test("A selected move grip is actually draggable; translation is one undoable store command",()=>{
  dom(host=>{
    const {store,facade}=create();
    const shape=facade.addShape({shapeKind:"rect",p1:{x:0,y:0},p2:{x:100,y:100}});
    store.setActiveTool("select");
    const ctl=new CadMarkupController(host as unknown as HTMLElement,store,facade,{
      screenToWorld:project,worldToScreen:project,setCameraInteractionEnabled:()=>{},
    });
    store.setSelectedItems([shape.id]);
    const grip=findHitReviewItem(store.getItems(),{x:50,y:50},{
      projectWorldToScreen:project,selectedItemIds:store.getSession().selectedItemIds,tolerancePx:2,
    });
    assert.equal(grip?.id,shape.id);
    pointer(host,"pointerdown",50,50);
    pointer(host,"pointermove",70,75);
    assert.equal(store.getDraft().draftItem?.type,"shape");
    pointer(host,"pointerup",70,75);
    const moved=store.getItems().find(i=>i.id===shape.id);
    assert.equal(moved?.type,"shape");
    if(moved?.type==="shape"){
      assert.deepEqual(moved.p1,{x:20,y:25});
      assert.deepEqual(moved.p2,{x:120,y:125});
    }
    assert.equal(store.undo(),true);
    const reverted=store.getItems().find(i=>i.id===shape.id);
    if(reverted?.type==="shape")assert.deepEqual(reverted.p1,{x:0,y:0});
    assert.equal(store.redo(),true);
    ctl.destroy();
  });
});

test("Shift multiple review selections and Delete are a single undo step",()=>{
  dom(host=>{
    const {store,facade}=create();
    const one=facade.addShape({shapeKind:"rect",p1:{x:0,y:0},p2:{x:100,y:100}});
    const two=facade.addShape({shapeKind:"rect",p1:{x:200,y:0},p2:{x:300,y:100}});
    store.setActiveTool("select");
    const ctl=new CadMarkupController(host as unknown as HTMLElement,store,facade,{
      screenToWorld:project,worldToScreen:project,
    });
    click(host,0,30);
    assert.deepEqual([...store.getSession().selectedItemIds],[one.id]);
    click(host,200,30,{shift:true});
    assert.equal(store.getSession().selectedItemIds.size,2);
    assert.equal(store.removeItems(store.getSession().selectedItemIds),2);
    assert.equal(store.getItems().length,0);
    assert.equal(store.undo(),true);
    assert.deepEqual(store.getItems().map(x=>x.id),[one.id,two.id]);
    assert.equal(store.redo(),true);
    assert.equal(store.getItems().length,0);
    ctl.destroy();
  });
});

test("Read-only and different layout items can never be moved; selection doesn't select CAD source",()=>{
  dom(host=>{
    const {store,facade}=create();
    const shape=facade.addShape({
      shapeKind:"rect",p1:{x:0,y:0},p2:{x:100,y:100},layoutId:"PLAN_A",
    });
    store.setActiveLayoutId("PLAN_B");
    store.setActiveTool("select");
    const ctl=new CadMarkupController(host as unknown as HTMLElement,store,facade,{
      screenToWorld:project,worldToScreen:project,
      isItemReadOnly:(item)=>item.id===shape.id,
    });
    click(host,0,20);
    assert.equal(store.getSession().selectedItemIds.size,0);
    store.setActiveLayoutId("PLAN_A");
    click(host,0,20);
    assert.equal(store.getSession().selectedItemIds.has(shape.id),true);
    pointer(host,"pointerdown",0,20);
    pointer(host,"pointermove",30,40);
    pointer(host,"pointerup",30,40);
    assert.equal(store.getItems()[0]?.type,"shape");
    if(store.getItems()[0]?.type==="shape")assert.deepEqual(store.getItems()[0].p1,{x:0,y:0});
    ctl.destroy();
  });
});

test("ESC, pointercancel, window blur and lostcapture discard markup draft without commit",()=>{
  dom((host,win)=>{
    const {store,facade}=create();
    let enabled=true;
    const ctl=new CadMarkupController(host as unknown as HTMLElement,store,facade,{
      screenToWorld:project,worldToScreen:project,
      setCameraInteractionEnabled:value=>{enabled=value;},
    });
    store.setActiveTool("shape_cloud");
    pointer(host,"pointerdown",10,10);
    pointer(host,"pointermove",100,100);
    assert.equal(store.getDraft().draftItem?.type,"shape");
    win.dispatchEvent(Object.assign(new Event("keydown",{cancelable:true}),{key:"Escape",isComposing:false}));
    pointer(host,"pointerup",100,100);
    assert.equal(store.getItems().length,0);
    assert.equal(enabled,true);
    pointer(host,"pointerdown",10,10);
    pointer(host,"pointermove",100,100);
    pointer(host,"pointercancel",100,100);
    assert.equal(store.getItems().length,0);
    pointer(host,"pointerdown",10,10);
    pointer(host,"pointermove",100,100);
    win.dispatchEvent(new Event("blur"));
    assert.equal(store.getDraft().draftItem,null);
    assert.equal(store.getItems().length,0);
    pointer(host,"pointerdown",10,10);
    pointer(host,"pointermove",100,100);
    pointer(host,"lostpointercapture",100,100);
    assert.equal(store.getItems().length,0);
    ctl.destroy();
  });
});

test("Tool switch mid-drag never commits prior tool and normal lostcapture does not cancel committed item",()=>{
  dom(host=>{
    const {store,facade}=create();
    const ctl=new CadMarkupController(host as unknown as HTMLElement,store,facade,{
      screenToWorld:project,worldToScreen:project,
    });
    store.setActiveTool("shape_rect");
    pointer(host,"pointerdown",10,10);
    pointer(host,"pointermove",70,80);
    store.setActiveTool("select");
    pointer(host,"pointerup",70,80);
    assert.equal(store.getItems().length,0);
    store.setActiveTool("shape_circle");
    pointer(host,"pointerdown",10,10);
    pointer(host,"pointermove",60,10);
    pointer(host,"pointerup",60,10);
    pointer(host,"lostpointercapture",60,10);
    assert.equal(store.getItems().length,1);
    assert.equal(store.getItems()[0]?.type,"shape");
    if(store.getItems()[0]?.type==="shape")assert.equal(store.getItems()[0].shapeKind,"circle");
    ctl.destroy();
  });
});

test("Eraser removes only markup at overlapping measurement; DXF source is never changed",()=>{
  const {store,facade}=create();
  const measurement: CadReviewItem={
    id:"22222222-2222-4222-8222-222222222222",
    type:"distance",start:{x:0,y:0},end:{x:100,y:0},measuredLength:100,
    author:"Admin",comment:"",status:"open",style:{color:"#00f",strokeWidth:2,opacity:1},
    createdAt:now,updatedAt:now,
  };
  assert.equal(store.addItem(measurement),true);
  const markup=facade.addStroke({points:[{x:0,y:0},{x:100,y:0}]});
  assert.equal(facade.eraseItemAtPoint({x:50,y:0},project),true);
  assert.equal(store.getItems().some(x=>x.id===markup.id),false);
  assert.equal(store.getItems().some(x=>x.id===measurement.id),true);
  assert.equal(store.undo(),true);
  assert.equal(store.getItems().some(x=>x.id===markup.id),true);
  const translation=translateMarkupItem(measurement,10,20);
  assert.equal(translation,null);
});

test("Closed review item stays selectable but cannot be moved until reopened",()=>{
  const {store,facade}=create();
  const shape=facade.addShape({shapeKind:"rect",p1:{x:0,y:0},p2:{x:100,y:60}});
  assert.equal(facade.updateItemStatus(shape.id,"closed"),true);
  assert.equal(facade.moveItem(shape.id,10,20),false);
  assert.equal(store.getItems().length,1);
  if(store.getItems()[0]?.type==="shape")assert.deepEqual(store.getItems()[0].p1,{x:0,y:0});
  assert.equal(facade.updateItemStatus(shape.id,"open"),true);
  assert.equal(facade.moveItem(shape.id,10,20),true);
  if(store.getItems()[0]?.type==="shape")assert.deepEqual(store.getItems()[0].p1,{x:10,y:20});
  assert.equal(store.undo(),true);
  if(store.getItems()[0]?.type==="shape")assert.deepEqual(store.getItems()[0].p1,{x:0,y:0});
});
