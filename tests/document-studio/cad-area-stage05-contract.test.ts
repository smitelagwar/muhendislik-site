import { test } from "node:test";
import assert from "node:assert/strict";
import {
  signedPolygonArea, validateCadPolygon, polygonPerimeter, polygonCentroid,
} from "../../src/lib/dokumantasyon/cad-upstream/polygon-geometry";
import {
  CadAreaMeasurementController,
} from "../../src/lib/dokumantasyon/cad-upstream/area-measurement";
import { CadReviewStore } from "../../src/lib/dokumantasyon/cad-review/store";
import { cadReviewDocumentSchema, type CadReviewDocument } from "../../src/lib/dokumantasyon/cad-review/schema";
import {
  captureMeasurementContext, sourceContextFromInsunits,
  formatCapturedArea, formatCapturedDistance,
  calculateCalibrationFromWorldDistance,
} from "../../src/lib/dokumantasyon/cad-review/units";
import type { CadSnapPoint, CadSnapMode } from "../../src/lib/dokumantasyon/cad-upstream/snap-engine";

const rectangle: CadSnapPoint[] = [
  {x:0,y:0},{x:3000,y:0},{x:3000,y:4000},{x:0,y:4000},
];
const near = (actual: number, expected: number, tolerance=1e-7) =>
  assert.ok(Math.abs(actual-expected) <= tolerance, actual + " != " + expected);

test("known-mm fixture rectangle 12,000,000 world² / 14,000 world perimeter -> 12 m² / 14 m", () => {
  const result = validateCadPolygon(rectangle);
  assert.equal(result.valid, true);
  assert.equal(result.area, 12_000_000);
  assert.equal(result.perimeter, 14_000);
  assert.deepEqual(result.centroid, {x:1500,y:2000});
  const ctx = captureMeasurementContext(sourceContextFromInsunits(4), {
    displayUnit:"m", areaDisplayUnit:"m2", precision:2, areaPrecision:2,
  });
  assert.equal(formatCapturedArea(result.area!,ctx),"12,00 m²");
  assert.equal(formatCapturedDistance(result.perimeter!,ctx),"14,00 m");
});

test("UTM 4e6/5e6 offset, 37° rotation, CW/CCW and mirror keep area magnitude", () => {
  const offset={x:4_000_000,y:5_000_000};
  const angle=37*Math.PI/180,c=Math.cos(angle),s=Math.sin(angle);
  const transform=(mirror: boolean) => rectangle.map(p=>({
    x:offset.x+(mirror?-1:1)*p.x*c-p.y*s,
    y:offset.y+(mirror?-1:1)*p.x*s+p.y*c,
  }));
  const regular=transform(false),mirrored=transform(true);
  const a=validateCadPolygon(regular),b=validateCadPolygon(mirrored);
  assert.equal(a.valid,true);
  assert.equal(b.valid,true);
  near(a.area!,12_000_000,1e-4);
  near(b.area!,12_000_000,1e-4);
  near(a.perimeter!,14_000,1e-6);
  near(b.perimeter!,14_000,1e-6);
  near(signedPolygonArea(regular),12_000_000,1e-4);
  near(signedPolygonArea(regular.slice().reverse()),-12_000_000,1e-4);
  near(signedPolygonArea(mirrored),-12_000_000,1e-4);
  near(polygonPerimeter(regular),14_000,1e-6);
  near(polygonCentroid(regular).x,offset.x+1500*c-2000*s,1e-6);
  near(polygonCentroid(regular).y,offset.y+1500*s+2000*c,1e-6);
});

test("crossing / bowtie, duplicate, close edge, collinear and out-of-range polygons reject", () => {
  const bowtie=[{x:0,y:0},{x:10,y:10},{x:0,y:10},{x:10,y:0}];
  assert.equal(validateCadPolygon(bowtie).reason,"self-intersection");
  assert.equal(validateCadPolygon([{x:0,y:0},{x:10,y:0},{x:10,y:10},{x:0,y:0}]).valid,false);
  assert.equal(validateCadPolygon([{x:0,y:0},{x:10,y:0},{x:10,y:1e-12},{x:0,y:10}]).valid,false);
  assert.equal(validateCadPolygon([{x:0,y:0},{x:1,y:0},{x:2,y:0}]).reason,"degenerate");
  assert.equal(validateCadPolygon([{x:0,y:0},{x:1,y:0},{x:Number.NaN,y:1}]).reason,"invalid-point");
  assert.equal(validateCadPolygon([{x:1e9+2,y:0},{x:1,y:0},{x:0,y:1}]).reason,"invalid-point");
  assert.equal(validateCadPolygon([{x:0,y:0},{x:10,y:0}]).reason,"too-few-points");
});

test("source-less and calibrated units: scale twice -> length x2, area x4", () => {
  const first=calculateCalibrationFromWorldDistance(100,50,"cm",1);
  const second=calculateCalibrationFromWorldDistance(100,100,"cm",2);
  const c1=captureMeasurementContext(first,{displayUnit:"m",areaDisplayUnit:"m2"});
  const c2=captureMeasurementContext(second,{displayUnit:"m",areaDisplayUnit:"m2"});
  assert.equal(formatCapturedArea(240000,c1),"6,00 m²");
  assert.equal(formatCapturedArea(240000,c2),"24,00 m²");
  assert.equal(formatCapturedDistance(400,c1),"2,00 m");
  assert.equal(formatCapturedDistance(400,c2),"4,00 m");
  const unknown=captureMeasurementContext(sourceContextFromInsunits(0),{displayUnit:"m"});
  assert.equal(formatCapturedArea(12000000,unknown),"12.000.000,00 çizim birimi²");
});

class FakeSurface extends EventTarget {
  getBoundingClientRect(){return {left:0,top:0,width:1000,height:800};}
}
function withDom(run:(host:FakeSurface,win:FakeSurface)=>void){
  const g=globalThis as unknown as {window?:Window,document?:Document};
  const w=g.window,d=g.document;
  const win=new FakeSurface(),doc=Object.assign(new FakeSurface(),{hidden:false});
  g.window=win as unknown as Window;g.document=doc as unknown as Document;
  try{run(new FakeSurface(),win);}finally{g.window=w;g.document=d;}
}
function emit(host:EventTarget,name:string,x:number,y:number,opts:{type?:string;id?:number;isPrimary?:boolean;timeStamp?:number}={}){
  const event=Object.assign(new Event(name,{bubbles:true,cancelable:true}),{
    pointerType:opts.type??"mouse",pointerId:opts.id??1,isPrimary:opts.isPrimary??true,
    button:0,clientX:x,clientY:y,
  });
  host.dispatchEvent(event);
}
function click(host:EventTarget,p:CadSnapPoint,type="mouse"){
  emit(host,"pointerdown",p.x,p.y,{type});
  emit(host,"pointerup",p.x,p.y,{type});
}

test("mouse 4 points -> one result, one-shot Finish; false pan and duplicate not saved", () => {
  withDom(host=>{
    const done:{area:number;perimeter:number;points:readonly CadSnapPoint[]}[]=[];
    const controller=new CadAreaMeasurementController(host as unknown as HTMLElement,{
      resolvePoint:p=>({point:p,snap:null}),
      projectWorldPoint:p=>p,
    });
    controller.start(new Set<CadSnapMode>(["endpoint"]),{onComplete:r=>done.push(r)});
    emit(host,"pointerdown",0,0);emit(host,"pointerup",100,100);
    for(const p of rectangle)click(host,p);
    assert.equal(controller.finish(),true);
    assert.equal(controller.finish(),false);
    assert.equal(done.length,1);
    assert.equal(done[0]?.points.length,4);
    assert.equal(done[0]?.area,12000000);
    controller.destroy();
  });
});

test("invalid polygon Finish does not emit complete; Backspace can correct geometry", () => {
  withDom((host,win)=>{
    const done:number[]=[];
    let lastError:string|null|undefined=null;
    const controller=new CadAreaMeasurementController(host as unknown as HTMLElement,{
      resolvePoint:p=>({point:p,snap:null}),projectWorldPoint:p=>p,
    });
    controller.start(new Set<CadSnapMode>(["endpoint"]),{
      onComplete:r=>done.push(r.area),
      onSnapshot:s=>{lastError=s?.validationError;},
    });
    for(const p of [{x:0,y:0},{x:10,y:10},{x:0,y:10},{x:10,y:0}])click(host,p);
    assert.equal(controller.finish(),false);
    assert.equal(done.length,0);
    assert.ok(lastError);
    controller.popPoint();
    click(host,{x:-5,y:5}); // non-intersecting corrective point
    assert.equal(controller.finish(),true);
    assert.equal(done.length,1);
    controller.destroy();
  });
});

test("touch 4 taps + visible Finish, ESC and double click do not double-commit",()=>{
  withDom((host,win)=>{
    let completed=0,canceled=0;
    const ctl=new CadAreaMeasurementController(host as unknown as HTMLElement,{
      resolvePoint:p=>({point:p,snap:null}),projectWorldPoint:p=>p,
    });
    ctl.start(new Set<CadSnapMode>(["endpoint"]),{
      onComplete:()=>completed++,onCancel:()=>canceled++,
    });
    for(const p of rectangle)click(host,p,"touch");
    assert.equal(ctl.finish(),true);
    assert.equal(ctl.finish(),false);
    assert.equal(completed,1);
    ctl.start(new Set<CadSnapMode>(["endpoint"]),{onCancel:()=>canceled++});
    click(host,rectangle[0]!);
    win.dispatchEvent(Object.assign(new Event("keydown",{cancelable:true}),{key:"Escape",isComposing:false}));
    assert.equal(canceled,1);
    ctl.destroy();
  });
});

test("one area review item persists world geometry, undo/redo, reload JSON without double owner",()=>{
  const empty:CadReviewDocument={
    schemaVersion:1,fileId:"11111111-1111-4111-8111-111111111111",
    sourceVersionKey:"area.dxf",sourceSha256:"a".repeat(64),revision:0,
    items:[],createdAt:"2026-11-02T00:00:00.000Z",updatedAt:"2026-11-02T00:00:00.000Z",
  };
  const store=new CadReviewStore(empty);
  const ctx=captureMeasurementContext(sourceContextFromInsunits(4),{displayUnit:"m",areaDisplayUnit:"m2"});
  const now="2026-11-02T00:00:00.000Z";
  assert.equal(store.addMeasuredItem({
    type:"area",id:"22222222-2222-4222-8222-222222222222",
    points:rectangle,measuredArea:12_000_000,measuredPerimeter:14000,
    author:"Admin",comment:"",status:"open",style:{color:"#10b981",strokeWidth:2,opacity:1},
    createdAt:now,updatedAt:now,
  },ctx),true);
  assert.equal(store.getItems().length,1);
  assert.equal(store.canUndo(),true);
  assert.equal(store.undo(),true);assert.equal(store.getItems().length,0);
  assert.equal(store.redo(),true);
  const again=cadReviewDocumentSchema.parse(JSON.parse(JSON.stringify(store.getDocument())));
  const result=again.items[0];
  assert.equal(result?.type,"area");
  if(result?.type==="area"){
    assert.equal(result.measuredArea,12_000_000);
    assert.equal(result.measuredPerimeter,14000);
    assert.equal(formatCapturedArea(result.measuredArea,result.measurementContext!),"12,00 m²");
  }
});

test("stage9-area-20m2.dxf oracle: 5000 x 4000 source-mm = 20 m² / 18 m", () => {
  const vertices=[
    {x:0,y:0},{x:5000,y:0},{x:5000,y:4000},{x:0,y:4000},
  ];
  const validated=validateCadPolygon(vertices);
  assert.equal(validated.valid,true);
  assert.equal(validated.area,20_000_000);
  assert.equal(validated.perimeter,18_000);
  const context=captureMeasurementContext(sourceContextFromInsunits(4),{
    displayUnit:"m",areaDisplayUnit:"m2",areaPrecision:2,precision:2,
  });
  assert.equal(formatCapturedArea(validated.area!,context),"20,00 m²");
  assert.equal(formatCapturedDistance(validated.perimeter!,context),"18,00 m");
});

test("stage9-unitless-calibration.dxf: no fabricated m²; explicit scale -> 6 m²", () => {
  const vertices=[
    {x:0,y:0},{x:400,y:0},{x:400,y:600},{x:0,y:600},
  ];
  const validated=validateCadPolygon(vertices);
  assert.equal(validated.area,240_000);
  const unknown=captureMeasurementContext(sourceContextFromInsunits(0),{displayUnit:"m",areaDisplayUnit:"m2"});
  assert.equal(formatCapturedArea(validated.area!,unknown),"240.000,00 çizim birimi²");
  const calibrated=captureMeasurementContext(
    calculateCalibrationFromWorldDistance(100,50,"cm",1),
    {displayUnit:"m",areaDisplayUnit:"m2"},
  );
  assert.equal(formatCapturedArea(validated.area!,calibrated),"6,00 m²");
});
