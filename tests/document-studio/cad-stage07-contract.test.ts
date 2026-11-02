import { test } from "node:test";
import assert from "node:assert/strict";
import { CadReviewStore } from "../../src/lib/dokumantasyon/cad-review/store";
import { CadMarkupFacade } from "../../src/lib/dokumantasyon/cad-review/markup-facade";
import { CadFreehandController } from "../../src/lib/dokumantasyon/cad-review/freehand-controller";
import { CadMarkupController } from "../../src/lib/dokumantasyon/cad-review/markup-controller";
import { simplifyStrokeSamples } from "../../src/lib/dokumantasyon/cad-review/stroke-simplifier";
import { sanitizeReviewText } from "../../src/lib/dokumantasyon/cad-review/security";
import type { CadPoint2d, CadReviewDocument } from "../../src/lib/dokumantasyon/cad-review/schema";

function document(): CadReviewDocument {
  return { schemaVersion: 1, fileId: "11111111-1111-4111-8111-111111111111",
    sourceVersionKey: "stage07.dxf", sourceSha256: "a".repeat(64),
    revision: 0, createdAt: new Date(0).toISOString(),
    updatedAt: new Date(0).toISOString(), items: [] };
}
class Surface extends EventTarget {
  captures = new Set<number>();
  getBoundingClientRect() { return { left: 0, top: 0, width: 1200, height: 800 }; }
  setPointerCapture(id: number) { this.captures.add(id); }
  releasePointerCapture(id: number) { this.captures.delete(id); }
  hasPointerCapture(id: number) { return this.captures.has(id); }
}
type PointerOptions = {
  id?: number; type?: string; primary?: boolean; button?: number;
  coalesced?: {x:number;y:number}[];
};
function pointer(el: Surface, kind: string, x: number, y: number, opts: PointerOptions = {}) {
  const coalesced = opts.coalesced ?? [];
  const event = Object.assign(new Event(kind, { bubbles: true, cancelable: true }), {
    pointerId: opts.id ?? 1, pointerType: opts.type ?? "mouse",
    isPrimary: opts.primary ?? true, button: opts.button ?? 0,
    clientX: x, clientY: y,
    getCoalescedEvents: () => coalesced.map((p) => ({
      clientX: p.x, clientY: p.y,
    })),
  });
  el.dispatchEvent(event);
}
function setup<T>(fn: (surface: Surface, win: Surface, document: Surface) => T): T {
  const g = globalThis as unknown as {window?:Window;document?:Document};
  const oldWindow = g.window, oldDocument = g.document;
  const surface = new Surface(), win = new Surface();
  const document = Object.assign(new Surface(), { hidden: false });
  g.window = win as unknown as Window;
  g.document = document as unknown as Document;
  try { return fn(surface, win, document); }
  finally { g.window = oldWindow; g.document = oldDocument; }
}
async function setupAsync<T>(fn: (surface: Surface, win: Surface, document: Surface) => Promise<T>): Promise<T> {
  const g = globalThis as unknown as {window?:Window;document?:Document};
  const oldWindow = g.window, oldDocument = g.document;
  const surface = new Surface(), win = new Surface();
  const doc = Object.assign(new Surface(), { hidden: false });
  g.window = win as unknown as Window;
  g.document = doc as unknown as Document;
  try { return await fn(surface, win, doc); }
  finally { g.window = oldWindow; g.document = oldDocument; }
}

function create() {
  const store = new CadReviewStore(document());
  return { store, facade: new CadMarkupFacade(store) };
}
const identity = (p: CadPoint2d) => ({ ...p });

test("screen-space RDP retains CAD-world vertices at zoom extremes and closed contours", () => {
  for (const scale of [0.001, 1, 100_000]) {
    const samples = Array.from({ length: 120 }, (_, i) => ({
      screen: {x: i, y: i < 60 ? 0 : i - 60},
      world: {x: 4_000_000 + i * scale, y: 5_000_000 + (i < 60 ? 0 : i - 60) * scale},
    }));
    const result = simplifyStrokeSamples(samples, 1, 0.9);
    assert.equal(result.length, 3);
    assert.deepEqual(result[0], samples[0]!.world);
    assert.deepEqual(result[result.length-1], samples[119]!.world);
  }
  const loop = [
    {screen:{x:0,y:0},world:{x:0,y:0}},
    {screen:{x:50,y:0},world:{x:50,y:0}},
    {screen:{x:50,y:50},world:{x:50,y:50}},
    {screen:{x:0,y:0},world:{x:0,y:0}},
  ];
  assert.ok(simplifyStrokeSamples(loop).length >= 3);
});

test("coalesced stylus samples commit a single world stroke, one undo/redo and JSON reload",()=>{
  setup((host)=>{
    const {store, facade}=create();
    let cameraEnabled=true;
    const ctl=new CadFreehandController(host as unknown as HTMLElement,store,facade,{
      screenToWorld:p=>({x:p.x*10,y:p.y*10}),worldToScreen:p=>({x:p.x/10,y:p.y/10}),
      setCameraInteractionEnabled:v=>{cameraEnabled=v;},
    });
    store.setActiveTool("stroke");
    pointer(host,"pointerdown",20,30,{type:"pen",id:9});
    assert.equal(cameraEnabled,false);
    assert.equal(store.getDraft().draftItem?.type,"stroke");
    pointer(host,"pointermove",90,50,{id:9,type:"pen",coalesced:[
      {x:40,y:30},{x:55,y:30},{x:70,y:50},
    ]});
    pointer(host,"pointerup",110,70,{type:"pen",id:9});
    assert.equal(cameraEnabled,true);
    assert.equal(store.getDraft().draftItem,null);
    assert.equal(host.captures.size,0);
    assert.equal(store.getItems().length,1);
    const item=store.getItems()[0]!;
    assert.equal(item.type,"stroke");
    if(item.type==="stroke"){
      assert.deepEqual(item.points[0],{x:200,y:300});
      assert.deepEqual(item.points[item.points.length-1],{x:1100,y:700});
      assert.ok(item.points.length >= 3);
    }
    assert.equal(store.undo(),true);
    assert.equal(store.undo(),false);
    assert.equal(store.redo(),true);
    const saved=JSON.parse(JSON.stringify(store.getDocument()));
    assert.deepEqual(saved.items[0]?.points,(item.type==="stroke"?item.points:null));
    ctl.destroy();
  });
});

test("touch: uncommitted stroke cancels on second pointer, Escape, pointercancel, blur and tool switch",()=>{
  setup((host,win)=>{
    const {store,facade}=create();
    const ctl=new CadFreehandController(host as unknown as HTMLElement,store,facade,{
      screenToWorld:identity,worldToScreen:identity,
    });
    store.setActiveTool("stroke");
    pointer(host,"pointerdown",10,10,{type:"touch",id:1});
    pointer(host,"pointermove",20,25,{type:"touch",id:1});
    pointer(host,"pointerdown",20,25,{type:"touch",id:2,primary:false});
    pointer(host,"pointerup",40,40,{type:"touch",id:1});
    assert.equal(store.getItems().length,0);
    assert.equal(host.captures.size,0);
    pointer(host,"pointerdown",10,10,{type:"touch",id:3});
    pointer(host,"pointermove",20,25,{type:"touch",id:3});
    win.dispatchEvent(Object.assign(new Event("keydown"),{key:"Escape"}));
    pointer(host,"pointerup",30,30,{type:"touch",id:3});
    assert.equal(store.getItems().length,0);
    pointer(host,"pointerdown",10,10,{type:"touch",id:4});
    pointer(host,"pointermove",30,30,{type:"touch",id:4});
    pointer(host,"pointercancel",30,30,{type:"touch",id:4});
    assert.equal(store.getItems().length,0);
    pointer(host,"pointerdown",10,10,{type:"touch",id:5});
    pointer(host,"pointermove",40,40,{type:"touch",id:5});
    win.dispatchEvent(new Event("blur"));
    pointer(host,"pointerup",50,50,{type:"touch",id:5});
    assert.equal(store.getItems().length,0);
    pointer(host,"pointerdown",10,10,{type:"touch",id:6});
    pointer(host,"pointermove",40,40,{type:"touch",id:6});
    store.setActiveTool("select");
    pointer(host,"pointerup",50,50,{type:"touch",id:6});
    assert.equal(store.getItems().length,0);
    ctl.destroy();
  });
});

test("one eraser swipe removes only review strokes/shapes, one undo restores and measurements remain",()=>{
  setup((host)=>{
    const {store,facade}=create();
    const first=facade.addStroke({points:[{x:0,y:10},{x:150,y:10}]});
    const second=facade.addStroke({points:[{x:0,y:60},{x:150,y:60}]});
    const note=facade.addText({position:{x:30,y:110},text:"keep"});
    const untouched=store.addItem({
      id:"22222222-2222-4222-8222-222222222222",type:"distance",
      start:{x:0,y:10},end:{x:150,y:10},measuredLength:150,
      status:"open",author:"Admin",comment:"",style:{color:"#f00",opacity:1,strokeWidth:2},
      createdAt:new Date(0).toISOString(),updatedAt:new Date(0).toISOString(),
    });
    assert.equal(untouched,true);
    const ctl=new CadFreehandController(host as unknown as HTMLElement,store,facade,{
      screenToWorld:identity,worldToScreen:identity,
    });
    store.setActiveTool("eraser");
    pointer(host,"pointerdown",50,10,{id:8});
    pointer(host,"pointermove",50,60,{id:8});
    assert.equal(store.getItems().length,4, "pending eraser must not mutate source/review mid gesture");
    pointer(host,"pointerup",50,60,{id:8});
    assert.equal(store.getItems().length,2);
    assert.deepEqual(store.getItems().map(x=>x.id),[note.id,"22222222-2222-4222-8222-222222222222"]);
    assert.equal(store.undo(),true);
    assert.deepEqual(store.getItems().map(x=>x.id),[first.id,second.id,note.id,"22222222-2222-4222-8222-222222222222"]);
    assert.equal(store.undo(),true, "previous undo is the prior add, not a second eraser fragment");
    ctl.destroy();
  });
});

test("eraser cancellation and wrong pointer cannot remove any review item",()=>{
  setup((host)=>{
    const {store,facade}=create();
    const shape=facade.addShape({shapeKind:"rect",p1:{x:0,y:0},p2:{x:100,y:50}});
    const ctl=new CadFreehandController(host as unknown as HTMLElement,store,facade,{
      screenToWorld:identity,worldToScreen:identity,
    });
    store.setActiveTool("eraser");
    pointer(host,"pointerdown",0,25,{id:1});
    pointer(host,"pointerup",0,25,{id:2});
    pointer(host,"pointercancel",0,25,{id:1});
    assert.deepEqual(store.getItems().map(x=>x.id),[shape.id]);
    pointer(host,"pointerdown",0,25,{id:5});
    pointer(host,"pointermove",0,26,{id:5});
    store.setActiveTool("stroke");
    pointer(host,"pointerup",0,26,{id:5});
    assert.equal(store.getItems().length,1);
    ctl.destroy();
  });
});

test("pin, text and callout asynchronous input commits once, cancellation and switch never commit",async()=>{
  await setupAsync(async(host)=>{
    const {store,facade}=create();
    let resolveComment:((data:{comment:string}|null)=>void)|null=null;
    let resolveText:((data:{text:string}|null)=>void)|null=null;
    const controller=new CadMarkupController(host as unknown as HTMLElement,store,facade,{
      screenToWorld:identity,worldToScreen:identity,
      requestCommentInput:()=>new Promise(resolve=>{resolveComment=resolve;}),
      requestTextInput:()=>new Promise(resolve=>{resolveText=resolve;}),
    });
    store.setActiveTool("comment_pin");
    pointer(host,"pointerdown",30,40);
    pointer(host,"pointerup",30,40);
    assert.equal(store.getItems().length,0);
    resolveComment?.({comment:"  <b>Pin</b>  "});
    await new Promise(resolve=>setImmediate(resolve));
    assert.equal(store.getItems().length,1);
    const pin=store.getItems()[0];
    assert.equal(pin?.type,"comment_pin");
    if(pin?.type==="comment_pin") assert.equal(pin.comment,"bPin/b");
    store.setActiveTool("text");
    pointer(host,"pointerdown",50,60);
    pointer(host,"pointerup",50,60);
    resolveText?.({text:"First"});
    await new Promise(resolve=>setImmediate(resolve));
    assert.equal(store.getItems().length,2);
    store.setActiveTool("comment_pin");
    pointer(host,"pointerdown",80,90);
    pointer(host,"pointerup",80,90);
    controller.cancel();
    resolveComment?.({comment:"Must not save"});
    await new Promise(resolve=>setImmediate(resolve));
    assert.equal(store.getItems().length,2);
    store.setActiveTool("text");
    pointer(host,"pointerdown",75,75);
    pointer(host,"pointerup",75,75);
    store.setActiveTool("select");
    resolveText?.({text:"Stale"});
    await new Promise(resolve=>setImmediate(resolve));
    assert.equal(store.getItems().length,2);
    assert.equal(store.undo(),true);
    assert.equal(store.getItems().length,1);
    controller.destroy();
  });
});

test("text sanitizer and facade reject blank or unsafe control-only input",()=>{
  const {store,facade}=create();
  assert.equal(sanitizeReviewText("  <script>x</script>  "),"scriptx/script");
  assert.throws(()=>facade.addText({position:{x:1,y:2},text:"  "}),/boş/);
  assert.throws(()=>facade.addCommentPin({position:{x:1,y:2},comment:"  "}),/boş/);
  assert.equal(store.getItems().length,0);
});
