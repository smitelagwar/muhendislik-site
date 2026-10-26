"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { makeBlueprint, jointAt, segmentPose, type V3 } from "@/lib/duzensizlik-simulatoru/motion";
import type { ScenarioId } from "@/lib/duzensizlik-simulatoru/scenarios";

export type CameraView = "perspective" | "front" | "side" | "top";
interface Props {
  scenario: ScenarioId;
  view: CameraView;
  resetToken: number;
  playing: boolean;
  speed: number;
  showSlabs: boolean;
  showMembers: boolean;
  showHighlights: boolean;
  active: boolean;
  onFailure: () => void;
}
interface Runtime {
  refresh: () => void;
  changeScenario: (scenario: ScenarioId) => void;
  view: (view: CameraView, immediate?: boolean) => void;
  reset: () => void;
}

export default function BuildingViewer(props: Props) {
  const root = useRef<HTMLDivElement>(null);
  const runtime = useRef<Runtime | null>(null);
  const latest = useRef(props);
  const initial = useRef(props);
  useEffect(() => { latest.current = props; runtime.current?.refresh(); }, [props]);
  useEffect(() => {
    const host = root.current;
    if (!host) return;
    let disposed = false;
    let lost = false;
    let raf = 0;
    let activeFrames = 0;
    let ticking = false;
    let lastStamp = 0;
    let elapsed = 0;
    let blend = 0;
    let dirty = true;
    let scenario: ScenarioId = initial.current.scenario;
    let selectedView: CameraView = initial.current.view;
    let cameraTween: { from: V3; to: V3; targetFrom: V3; targetTo: V3; start: number; duration: number } | null = null;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#0c1725");
    const camera = new THREE.PerspectiveCamera(40, 1, .1, 220);
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "default" });
    } catch {
      latest.current.onFailure();
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, window.innerWidth < 768 ? 1.35 : 1.75));
    renderer.domElement.style.cssText = "display:block;width:100%;height:100%;touch-action:none";
    renderer.domElement.setAttribute("aria-label", "3B betonarme bina inceleme alanı");
    host.append(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = .09;
    controls.rotateSpeed = .44;
    controls.zoomSpeed = .58;
    controls.panSpeed = .38;
    controls.minPolarAngle = .07;
    controls.maxPolarAngle = Math.PI * .93;
    controls.screenSpacePanning = true;
    const unit = new THREE.BoxGeometry(1, 1, 1);
    const mat = {
      column: new THREE.MeshStandardMaterial({color:"#8dbbd0",metalness:.12,roughness:.69}),
      beam: new THREE.MeshStandardMaterial({color:"#638da9",metalness:.09,roughness:.73}),
      slab: new THREE.MeshStandardMaterial({color:"#a4c9d9",transparent:true,opacity:.22,depthWrite:false,roughness:.84}),
      wall: new THREE.MeshStandardMaterial({color:"#e8a766",metalness:.07,roughness:.72,transparent:true,opacity:.82}),
      highlight: new THREE.MeshStandardMaterial({color:"#fa746c",emissive:"#62211f",emissiveIntensity:.27,roughness:.7}),
      transfer: new THREE.MeshStandardMaterial({color:"#f3b05f",emissive:"#623d17",emissiveIntensity:.15}),
      foundation: new THREE.MeshStandardMaterial({color:"#284054",roughness:.79}),
    };
    const axis = new THREE.Vector3(0,1,0);
    const frame = new THREE.Group();
    scene.add(frame);
    const pad = new THREE.Mesh(unit, mat.foundation);
    pad.scale.set(7.9,.34,7.9);
    pad.position.set(0,-.26,0);
    frame.add(pad);
    const grid = new THREE.GridHelper(28,28,"#334e66","#223448");
    grid.position.y = -.46;
    scene.add(grid);
    scene.add(new THREE.AmbientLight("#dcefff",1.35));
    const key = new THREE.DirectionalLight("#ffffff",2.65);
    key.position.set(9,16,11);
    scene.add(key);
    const rim = new THREE.DirectionalLight("#55bce0",.8);
    rim.position.set(-11,9,-8);
    scene.add(rim);

    type Part = { mesh: THREE.Mesh; a: V3; b: V3; kind: "column" | "beam" | "wall" | "highlight" | "transfer" };
    type Surface = { mesh: THREE.Mesh; x:number; z:number; y:number };
    let segments: Part[] = [];
    let surfaces: Surface[] = [];
    let modelBounds = makeBlueprint(scenario).bounds;
    const updateSegment = (part: Part, phase: number, intensity: number) => {
      const a = jointAt(part.a,scenario,phase,intensity);
      const b = jointAt(part.b,scenario,phase,intensity);
      const pose = segmentPose(a,b);
      if (!pose) { part.mesh.visible = false; return; }
      part.mesh.position.set(...pose.mid);
      part.mesh.quaternion.setFromUnitVectors(axis,new THREE.Vector3(...pose.direction));
      const cross = part.kind==="column" ? (scenario==="B1" && part.a[1]===0 ? .19 : .26) : part.kind==="highlight" ? .13 : part.kind==="wall" ? .20 : part.kind==="transfer" ? .38 : .24;
      const depth = part.kind==="wall" ? 2.5 : part.kind==="transfer" ? .35 : cross;
      part.mesh.scale.set(cross,pose.length,depth);
      part.mesh.visible = part.kind==="highlight" ? latest.current.showHighlights : latest.current.showMembers;
    };
    const updateModel = (phase: number,intensity: number) => {
      for(const part of segments) updateSegment(part,phase,intensity);
      for(const surface of surfaces) {
        const origin:V3=[surface.x,surface.y,surface.z];
        const p=jointAt(origin,scenario,phase,intensity);
        const q=jointAt([surface.x+1,surface.y,surface.z],scenario,phase,intensity);
        surface.mesh.position.set(...p);
        surface.mesh.rotation.set(0,Math.atan2(q[2]-p[2],q[0]-p[0]),0);
        surface.mesh.visible=latest.current.showSlabs;
      }
    };
    const rebuild = (next: ScenarioId) => {
      scenario = next;
      for(const p of segments) frame.remove(p.mesh);
      for(const s of surfaces) frame.remove(s.mesh);
      segments=[];
      surfaces=[];
      const blueprint=makeBlueprint(scenario);
      modelBounds=blueprint.bounds;
      pad.position.x=(modelBounds.min[0]+modelBounds.max[0])/2;
      pad.scale.x=modelBounds.max[0]-modelBounds.min[0]+.8;
      for (const segment of blueprint.segments) {
        const kind=segment.kind;
        const mesh=new THREE.Mesh(unit,mat[kind]);
        mesh.userData.kind=kind;
        frame.add(mesh);
        segments.push({mesh,a:segment.a,b:segment.b,kind});
      }
      for (const slab of blueprint.slabs) {
        const mesh=new THREE.Mesh(unit,mat.slab);
        mesh.scale.set(slab.width,.11,slab.depth);
        frame.add(mesh);
        surfaces.push({mesh,x:slab.cx,z:slab.cz,y:slab.level*1.6});
      }
      elapsed=0;
      blend=0;
      updateModel(0,0);
      dirty=true;
    };
    const fitDistance=() => {
      const w=modelBounds.max[0]-modelBounds.min[0],h=modelBounds.max[1]-modelBounds.min[1],d=modelBounds.max[2]-modelBounds.min[2];
      const aspect=Math.max(.2,camera.aspect);
      const vertical=Math.tan((camera.fov*Math.PI/180)/2);
      const radius=Math.hypot(w,h,d)*.5;
      return Math.min(90, Math.max(13, (radius / Math.min(vertical,vertical*aspect)) * 1.03));
    };
    const direction=(v:CameraView):V3 => v==="front" ? [0,.09,1] : v==="side" ? [1,.09,0] : v==="top" ? [.015,1,.075] : [.8,.65,1];
    const cameraTarget=():V3 => [(modelBounds.min[0]+modelBounds.max[0])/2, (modelBounds.min[1]+modelBounds.max[1])/2+.1, (modelBounds.min[2]+modelBounds.max[2])/2];
    const viewCamera=(v:CameraView,immediate=false) => {
      selectedView=v;
      const dest=cameraTarget(),dir=direction(v),length=Math.hypot(...dir),distance=fitDistance();
      const to:V3=[dest[0]+dir[0]/length*distance,dest[1]+dir[1]/length*distance,dest[2]+dir[2]/length*distance];
      controls.minDistance=Math.max(4,distance*.25);
      controls.maxDistance=Math.max(28,distance*2.2);
      if(immediate || window.matchMedia("(prefers-reduced-motion: reduce)").matches){
        camera.position.set(...to);
        controls.target.set(...dest);
        controls.update();
        cameraTween=null;
      } else {
        cameraTween={
          from:[camera.position.x,camera.position.y,camera.position.z],
          to,
          targetFrom:[controls.target.x,controls.target.y,controls.target.z],
          targetTo:dest,
          start:performance.now(),duration:380,
        };
      }
      dirty=true;
      wake();
    };
    const wake=()=>{
      if(disposed||lost||raf||ticking) return;
      activeFrames=0;
      raf=requestAnimationFrame(tick);
    };
    const render=()=>{
      if(disposed||lost||!latest.current.active||document.hidden){ticking=false;return;}
      renderer.render(scene,camera);
    };
    const tick=(now:number)=>{
      ticking=true;
      raf=0;
      if(disposed||lost||!latest.current.active||document.hidden){ticking=false;return;}
      const dt=lastStamp?Math.min((now-lastStamp)/1000,.05):0;
      lastStamp=now;
      const allowed=!window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const running=latest.current.playing && allowed;
      if(running) elapsed+=dt*Math.max(.25,Math.min(2,latest.current.speed))*3.1;
      blend+=(Number(running)-blend)*Math.min(1,dt*5.5);
      const moving=running||blend>.002;
      if(moving) updateModel(elapsed,blend);
      if(cameraTween){
        const f=Math.min(1,(now-cameraTween.start)/cameraTween.duration);
        const smooth=f*f*(3-2*f),a=cameraTween;
        camera.position.set(a.from[0]+(a.to[0]-a.from[0])*smooth,a.from[1]+(a.to[1]-a.from[1])*smooth,a.from[2]+(a.to[2]-a.from[2])*smooth);
        controls.target.set(a.targetFrom[0]+(a.targetTo[0]-a.targetFrom[0])*smooth,a.targetFrom[1]+(a.targetTo[1]-a.targetFrom[1])*smooth,a.targetFrom[2]+(a.targetTo[2]-a.targetFrom[2])*smooth);
        if(f>=1) cameraTween=null;
        dirty=true;
      }
      const controlChanged=controls.update();
      if(dirty||moving||controlChanged||cameraTween) render();
      dirty=false;
      activeFrames=(dirty||moving||controlChanged||cameraTween) ? 0 : activeFrames+1;
      ticking=false;
      if(activeFrames<4) raf=requestAnimationFrame(tick);
    };
    const cancelTween=()=>{ cameraTween=null; dirty=true; wake(); };
    const markDirty=()=>{ dirty=true; wake(); };
    controls.addEventListener("start",cancelTween);
    controls.addEventListener("change",markDirty);
    const resize=()=>{
      if(disposed) return;
      const w=Math.max(1,host.clientWidth),h=Math.max(1,host.clientHeight);
      camera.aspect=w/h;
      camera.updateProjectionMatrix();
      renderer.setSize(w,h,false);
      // Keep the building contained after mobile rotation or inspector resize.
      viewCamera(selectedView,true);
    };
    const observer=new ResizeObserver(resize);
    observer.observe(host);
    const onVisible=()=>{lastStamp=0; if(!document.hidden){dirty=true;wake();}};
    document.addEventListener("visibilitychange",onVisible);
    const onLoss=(e:Event)=>{e.preventDefault();lost=true;cancelAnimationFrame(raf);raf=0;latest.current.onFailure();};
    renderer.domElement.addEventListener("webglcontextlost",onLoss);
    rebuild(scenario);
    runtime.current={
      refresh:()=>{updateModel(elapsed,blend);dirty=true;wake();},
      changeScenario:(next)=>{rebuild(next);viewCamera(selectedView,false);wake();},
      view:viewCamera,
      reset:()=>{elapsed=0;blend=0;updateModel(0,0);viewCamera("perspective",false);},
    };
    resize();
    return ()=>{
      disposed=true;
      cancelAnimationFrame(raf);
      runtime.current=null;
      observer.disconnect();
      controls.removeEventListener("start",cancelTween);
      controls.removeEventListener("change",markDirty);
      controls.dispose();
      document.removeEventListener("visibilitychange",onVisible);
      renderer.domElement.removeEventListener("webglcontextlost",onLoss);
      renderer.domElement.remove();
      renderer.dispose();
      unit.dispose();
      grid.geometry.dispose();
      if(Array.isArray(grid.material)) grid.material.forEach(m=>m.dispose());
      else grid.material.dispose();
      Object.values(mat).forEach(m=>m.dispose());
    };
  }, []);
  useEffect(()=>{runtime.current?.changeScenario(props.scenario);},[props.scenario]);
  useEffect(()=>{runtime.current?.view(props.view);},[props.view]);
  useEffect(()=>{if(props.resetToken>0)runtime.current?.reset();},[props.resetToken]);
  return <div ref={root} data-testid="irregularity-three-canvas" data-scenario={props.scenario} className="h-full w-full touch-none" />;
}
