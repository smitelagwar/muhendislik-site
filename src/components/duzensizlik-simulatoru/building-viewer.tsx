"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { makeBlueprint, jointAt, segmentPose, slabPose, COLUMN_SECTION, BEAM_SECTION, SLAB_THICKNESS, WALL_BAY_DEPTH, BEAM_FACE_TRIM, SLAB_LIFT, type V3 } from "@/lib/duzensizlik-simulatoru/motion";
import type { ScenarioId } from "@/lib/duzensizlik-simulatoru/scenarios";
import { FOCUS_POINTS, focusAnchorAt, type FocusPoint } from "@/lib/duzensizlik-simulatoru/focus";
import { cameraFitDistance, smootherStep } from "@/lib/duzensizlik-simulatoru/camera";
import { MAX_SHAKE_STRENGTH } from "@/lib/duzensizlik-simulatoru/intensity";
import { makeReferenceBlueprint, referenceJointAt, referenceSlabPose } from "@/lib/duzensizlik-simulatoru/reference-model";
import { TEACHING, teachingCueSegment, teachingStroke, type TeachingCue } from "@/lib/duzensizlik-simulatoru/teaching";

export type CameraView = "perspective" | "front" | "side" | "left" | "top";
// The repo provides a minimal hand-written Three.js type shim for its CAD modules.
// These standard runtime members are intentionally typed locally, avoiding edits
// to the shared shim (which belongs to the other engineering tools).
type DeformedGeometry = THREE.BufferGeometry & { computeVertexNormals(): void };
type SlabRim = THREE.LineSegments & { scale: THREE.Vector3; rotation: THREE.Euler };
type SplitRenderer = THREE.WebGLRenderer & {
  setScissorTest(enabled:boolean):void;
  setViewport(x:number,y:number,width:number,height:number):void;
  setScissor(x:number,y:number,width:number,height:number):void;
};
interface Props {
  scenario: ScenarioId;
  comparing: boolean;
  view: CameraView;
  resetToken: number;
  cameraPulse: number;
  playing: boolean;
  speed: number;
  intensity: number;
  showSlabs: boolean;
  showMembers: boolean;
  showHighlights: boolean;
  active: boolean;
  onFailure: () => void;
}
interface Runtime {
  refresh: () => void;
  changeScenario: (scenario: ScenarioId) => void;
  compare: () => void;
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
    let resizedOnce = false;
    let manuallyMoved = false;
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

    const motionPreference=window.matchMedia("(prefers-reduced-motion: reduce)");
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = .075;
    controls.rotateSpeed = .38;
    controls.zoomSpeed = .52;
    controls.panSpeed = .32;
    controls.minPolarAngle = .07;
    controls.maxPolarAngle = Math.PI * .93;
    controls.screenSpacePanning = true;
    const unit = new THREE.BoxGeometry(1, 1, 1);
    const slabEdges = new THREE.EdgesGeometry(unit);
    const slabEdgeMaterial = new THREE.LineBasicMaterial({
      color: new THREE.Color("#bddae9"), transparent: true, opacity: .43, depthWrite: false,
    });
    const mat = {
      column: new THREE.MeshStandardMaterial({color:"#8dbbd0",metalness:.12,roughness:.69}),
      beam: new THREE.MeshStandardMaterial({color:"#638da9",metalness:.09,roughness:.73}),
      slab: new THREE.MeshStandardMaterial({color:"#a4c9d9",transparent:true,opacity:.30,depthWrite:false,roughness:.84}),
      wall: new THREE.MeshStandardMaterial({color:"#e8a766",metalness:.07,roughness:.72,transparent:true,opacity:.82}),
      highlight: new THREE.MeshStandardMaterial({color:"#fa746c",emissive:"#62211f",emissiveIntensity:.27,roughness:.7}),
      transfer: new THREE.MeshStandardMaterial({color:"#f3b05f",emissive:"#623d17",emissiveIntensity:.15}),
      foundation: new THREE.MeshStandardMaterial({color:"#284054",roughness:.79}),
      focusPrimary: new THREE.MeshStandardMaterial({color:"#ffd492",emissive:"#ef7c35",emissiveIntensity:.6,roughness:.35,depthTest:false,depthWrite:false}),
      focusComparison: new THREE.MeshStandardMaterial({color:"#85e5f4",emissive:"#2088a5",emissiveIntensity:.65,roughness:.35,depthTest:false,depthWrite:false}),
      focusHalo: new THREE.MeshStandardMaterial({color:"#ffb86a",emissive:"#9e4d23",emissiveIntensity:.4,transparent:true,opacity:.22,depthTest:false,depthWrite:false}),
    };
    const focusSphere = new THREE.SphereGeometry(1,12,10);
    const teachingMaterials = {
      irregular: new THREE.LineBasicMaterial({
        color:"#ffbe6d",transparent:true,opacity:.92,depthTest:false,depthWrite:false,
      }),
      reference: new THREE.LineBasicMaterial({
        color:"#67e3d4",transparent:true,opacity:.9,depthTest:false,depthWrite:false,
      }),
    };
    const axis = new THREE.Vector3(0,1,0);
    // Avoid allocating a new Three.Vector3 for every beam/column, every frame.
    const segmentDirection = new THREE.Vector3();
    const frame = new THREE.Group();
    const referenceFrame = new THREE.Group();
    referenceFrame.visible=false;
    scene.add(frame);
    scene.add(referenceFrame);
    const pad = new THREE.Mesh(unit, mat.foundation);
    pad.scale.set(7.9,.34,7.9);
    pad.position.set(0,-.26,0);
    frame.add(pad);
    const referencePad=new THREE.Mesh(unit,mat.foundation);
    referencePad.scale.set(7.9,.34,7.9);
    referencePad.position.set(0,-.26,0);
    referenceFrame.add(referencePad);
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

    type Part = { mesh: THREE.Mesh; a: V3; b: V3; kind: "column" | "beam" | "wall" | "highlight" | "transfer";
      trimA: number; trimB: number; wallRest?: Float32Array };
    type Surface = { mesh: THREE.Mesh; rim: SlabRim; x:number; z:number; y:number };
    type Marker = { point: FocusPoint; mesh: THREE.Mesh; halo: THREE.Mesh };
    type TeachingLine = { cue:TeachingCue; mesh:THREE.LineSegments; attribute:THREE.BufferAttribute };
    const pointKey = (v:V3) => v.map(x => x.toFixed(5)).join(":");
    let segments: Part[] = [];
    let surfaces: Surface[] = [];
    let markers: Marker[] = [];
    let teachingLines:TeachingLine[] = [];
    let referenceParts: Part[] = [];
    let referenceSurfaces: Surface[] = [];
    let referenceBuilt=false;
    let modelBounds = makeBlueprint(scenario).bounds;
    const updateSegment = (part: Part, phase: number, intensity: number) => {
      if (part.wallRest) {
        // A shear wall must follow BOTH floor outlines, not merely rotate a tall
        // box around its centre (which detaches its corners during A1 torsion).
        const attribute = part.mesh.geometry.getAttribute("position") as THREE.BufferAttribute;
        const vertices = attribute.array as Float32Array;
        for (let i=0; i<attribute.count; i++) {
          const j = i*3;
          const p = jointAt([part.wallRest[j],part.wallRest[j+1],part.wallRest[j+2]],scenario,phase,intensity);
          vertices[j]=p[0]; vertices[j+1]=p[1]; vertices[j+2]=p[2];
        }
        attribute.needsUpdate = true;
        (part.mesh.geometry as DeformedGeometry).computeVertexNormals();
        part.mesh.visible = latest.current.showMembers;
        return;
      }
      const a = jointAt(part.a,scenario,phase,intensity);
      const b = jointAt(part.b,scenario,phase,intensity);
      const pose = segmentPose(a,b,part.trimA,part.trimB);
      if (!pose) { part.mesh.visible = false; return; }
      part.mesh.position.set(...pose.mid);
      part.mesh.quaternion.setFromUnitVectors(axis,segmentDirection.set(...pose.direction));
      const cross = part.kind==="column" ? (scenario==="B1" && part.a[1]===0 ? .19 : COLUMN_SECTION)
        : part.kind==="highlight" ? (scenario==="B1" ? .30 : .12)
        : part.kind==="transfer" ? .38 : BEAM_SECTION;
      const depth = part.kind==="transfer" ? .35 : cross;
      part.mesh.scale.set(cross,pose.length,depth);
      if (part.kind==="highlight" && (scenario==="A2" || scenario==="A3")) {
        // Annotation runs along the slab section, not below the opening rim.
        part.mesh.position.y += SLAB_LIFT;
      }
      part.mesh.visible = part.kind==="highlight" ? latest.current.showHighlights : latest.current.showMembers;
    };

    // Two geometries share one WebGL context, camera and animation timeline.
    const clearReference=()=>{
      for(const part of referenceParts){
        referenceFrame.remove(part.mesh);
        if(part.wallRest)part.mesh.geometry.dispose();
      }
      for(const surface of referenceSurfaces){
        referenceFrame.remove(surface.mesh);
        referenceFrame.remove(surface.rim);
      }
      referenceParts=[];
      referenceSurfaces=[];
    };
    const updateReference=(phase:number,intensity:number)=>{
      for(const part of referenceParts){
        if(part.wallRest){
          const attribute=part.mesh.geometry.getAttribute("position") as THREE.BufferAttribute;
          const vertices=attribute.array as Float32Array;
          for(let i=0;i<attribute.count;i++){
            const j=i*3;
            const at=referenceJointAt([part.wallRest[j],part.wallRest[j+1],part.wallRest[j+2]],phase,intensity);
            vertices[j]=at[0];vertices[j+1]=at[1];vertices[j+2]=at[2];
          }
          attribute.needsUpdate=true;
          (part.mesh.geometry as DeformedGeometry).computeVertexNormals();
          part.mesh.visible=latest.current.showMembers;
          continue;
        }
        const a=referenceJointAt(part.a,phase,intensity);
        const b=referenceJointAt(part.b,phase,intensity);
        const pose=segmentPose(a,b,part.trimA,part.trimB);
        if(!pose){part.mesh.visible=false;continue;}
        part.mesh.position.set(...pose.mid);
        part.mesh.quaternion.setFromUnitVectors(axis,segmentDirection.set(...pose.direction));
        const cross=part.kind==="column"?COLUMN_SECTION:part.kind==="transfer"?.38:BEAM_SECTION;
        part.mesh.scale.set(cross,pose.length,part.kind==="transfer"?.35:cross);
        part.mesh.visible=latest.current.showMembers;
      }
      for(const surface of referenceSurfaces){
        const pose=referenceSlabPose([surface.x,surface.y,surface.z],phase,intensity);
        surface.mesh.position.set(...pose.position);
        surface.mesh.rotation.set(0,pose.yaw,0);
        surface.mesh.visible=latest.current.showSlabs;
        surface.rim.position.copy(surface.mesh.position);
        surface.rim.rotation.set(0,pose.yaw,0);
        surface.rim.visible=latest.current.showSlabs;
      }
    };
    const buildReference=()=>{
      clearReference();
      const blueprint=makeReferenceBlueprint(scenario);
      referencePad.position.x=(blueprint.bounds.min[0]+blueprint.bounds.max[0])/2;
      referencePad.scale.x=blueprint.bounds.max[0]-blueprint.bounds.min[0]+.8;
      const nodes=new Set<string>();
      for(const member of blueprint.segments)if(member.kind==="column"){
        nodes.add(pointKey(member.a));nodes.add(pointKey(member.b));
      }
      for(const member of blueprint.segments){
        const kind=member.kind;
        let geometry:THREE.BufferGeometry=unit;
        let wallRest:Float32Array|undefined;
        if(kind==="wall"){
          geometry=new THREE.BoxGeometry(.20,member.b[1]-member.a[1],WALL_BAY_DEPTH);
          const vertices=(geometry.getAttribute("position") as THREE.BufferAttribute).array as Float32Array;
          const center=(member.a[1]+member.b[1])/2;
          for(let i=0;i<vertices.length;i+=3){
            vertices[i]+=member.a[0];vertices[i+1]+=center;vertices[i+2]+=member.a[2];
          }
          wallRest=Float32Array.from(vertices);
        }
        const mesh=new THREE.Mesh(geometry,mat[kind]);
        if(wallRest)mesh.frustumCulled=false;
        mesh.userData.kind=kind;
        mesh.userData.storey=member.storey;
        referenceFrame.add(mesh);
        const trim=kind==="beam"||kind==="transfer";
        referenceParts.push({mesh,a:member.a,b:member.b,kind,wallRest,
          trimA:trim&&nodes.has(pointKey(member.a))?BEAM_FACE_TRIM:0,
          trimB:trim&&nodes.has(pointKey(member.b))?BEAM_FACE_TRIM:0});
      }
      for(const slab of blueprint.slabs){
        const mesh=new THREE.Mesh(unit,mat.slab);
        mesh.scale.set(slab.width,SLAB_THICKNESS,slab.depth);
        referenceFrame.add(mesh);
        const edge=new THREE.LineSegments(slabEdges,slabEdgeMaterial) as SlabRim;
        edge.scale.copy(mesh.scale);
        edge.renderOrder=2;
        referenceFrame.add(edge);
        referenceSurfaces.push({mesh,rim:edge,x:slab.cx,z:slab.cz,y:slab.level*1.6});
      }
      referenceBuilt=true;
      updateReference(elapsed,blend);
    };
    const updateTeaching=(phase:number,intensity:number)=>{
      for(const item of teachingLines){
        const [start,end]=teachingCueSegment(item.cue,scenario,phase,intensity);
        const points=teachingStroke(start,end,item.cue.kind!=="line");
        (item.attribute.array as Float32Array).set(points);
        item.attribute.needsUpdate=true;
        item.mesh.visible=latest.current.showHighlights &&
          (item.cue.side==="irregular"||latest.current.comparing);
      }
      host.dataset.teachingCueCount=String(teachingLines.length);
      host.dataset.teachingScenario=scenario;
    };
    const clearTeaching=()=>{
      for(const item of teachingLines){
        (item.cue.side==="reference"?referenceFrame:frame).remove(item.mesh);
        item.mesh.geometry.dispose();
      }
      teachingLines=[];
    };
    const buildTeaching=()=>{
      clearTeaching();
      for(const cue of TEACHING[scenario].cues){
        const geometry=new THREE.BufferGeometry();
        const attribute=new THREE.BufferAttribute(new Float32Array(18),3);
        geometry.setAttribute("position",attribute);
        const mesh=new THREE.LineSegments(geometry,teachingMaterials[cue.side]);
        mesh.frustumCulled=false; // moving endpoints have dynamic extents
        mesh.renderOrder=16;
        mesh.userData.kind="teaching-cue";
        mesh.userData.cueId=cue.id;
        (cue.side==="reference"?referenceFrame:frame).add(mesh);
        teachingLines.push({cue,mesh,attribute});
      }
      updateTeaching(elapsed,blend);
    };
    const updateModel = (phase: number,intensity: number) => {
      host.dataset.shakeIntensity = String(latest.current.intensity);
      for(const part of segments) updateSegment(part,phase,intensity);
      for(const surface of surfaces) {
        const pose = slabPose([surface.x,surface.y,surface.z],scenario,phase,intensity);
        surface.mesh.position.set(...pose.position);
        surface.mesh.rotation.set(0,pose.yaw,0);
        surface.mesh.visible=latest.current.showSlabs;
        surface.rim.position.copy(surface.mesh.position);
        surface.rim.rotation.set(0,pose.yaw,0);
        surface.rim.visible=latest.current.showSlabs;
      }
      if(latest.current.comparing && referenceBuilt)updateReference(phase,intensity);
      updateTeaching(phase,intensity);
      for(const marker of markers) {
        const at=focusAnchorAt(marker.point,scenario,phase,intensity);
        marker.mesh.position.set(...at);
        marker.halo.position.copy(marker.mesh.position);
        marker.mesh.visible=latest.current.showHighlights;
        marker.halo.visible=latest.current.showHighlights;
      }
      // Expose the positions of actual Three.js markers for browser assertions.
      host.dataset.focusVisible=String(latest.current.showHighlights);
      host.dataset.focusWorld=markers.length
        ? [markers[0].mesh.position.x,markers[0].mesh.position.y,markers[0].mesh.position.z].map(n=>n.toFixed(4)).join(",")
        : "";
    };
    const rebuild = (next: ScenarioId) => {
      scenario = next;
      for(const p of segments) {
        frame.remove(p.mesh);
        if(p.wallRest) p.mesh.geometry.dispose();
      }
      for(const s of surfaces) { frame.remove(s.mesh); frame.remove(s.rim); }
      for(const m of markers) { frame.remove(m.mesh); frame.remove(m.halo); }
      clearTeaching();
      segments=[];
      surfaces=[];
      markers=[];
      const blueprint=makeBlueprint(scenario);
      modelBounds=blueprint.bounds;
      pad.position.x=(modelBounds.min[0]+modelBounds.max[0])/2;
      pad.scale.x=modelBounds.max[0]-modelBounds.min[0]+.8;
      const columnNodes = new Set<string>();
      for(const seg of blueprint.segments) if(seg.kind==="column") {
        columnNodes.add(pointKey(seg.a));
        columnNodes.add(pointKey(seg.b));
      }
      for (const segment of blueprint.segments) {
        const kind=segment.kind;
        // A small per-wall geometry is intentionally unique: its 24 vertices
        // follow each floor's deformation, including A1 plan rotation.
        let wallRest:Float32Array|undefined;
        let geometry:THREE.BufferGeometry=unit;
        if(kind==="wall") {
          geometry=new THREE.BoxGeometry(.20,segment.b[1]-segment.a[1],WALL_BAY_DEPTH);
          const wallVertices = (geometry.getAttribute("position") as THREE.BufferAttribute).array as Float32Array;
          const centerY=(segment.a[1]+segment.b[1])/2;
          for(let j=0;j<wallVertices.length;j+=3) {
            wallVertices[j]+=segment.a[0];
            wallVertices[j+1]+=centerY;
            wallVertices[j+2]+=segment.a[2];
          }
          wallRest=Float32Array.from(wallVertices);
        }
        const mesh=new THREE.Mesh(geometry,mat[kind]);
        if(wallRest) mesh.frustumCulled=false; // Animated custom positions have dynamic bounds.
        mesh.userData.kind=kind;
        mesh.userData.storey=segment.storey;
        frame.add(mesh);
        const trimmed=kind==="beam"||kind==="transfer";
        segments.push({mesh,a:segment.a,b:segment.b,kind,wallRest,
          trimA:trimmed&&columnNodes.has(pointKey(segment.a))?BEAM_FACE_TRIM:0,
          trimB:trimmed&&columnNodes.has(pointKey(segment.b))?BEAM_FACE_TRIM:0});
      }
      for (const slab of blueprint.slabs) {
        const mesh=new THREE.Mesh(unit,mat.slab);
        mesh.scale.set(slab.width,SLAB_THICKNESS,slab.depth);
        frame.add(mesh);
        const rim=new THREE.LineSegments(slabEdges,slabEdgeMaterial) as SlabRim;
        rim.scale.copy(mesh.scale);
        rim.renderOrder=2;
        frame.add(rim);
        surfaces.push({mesh,rim,x:slab.cx,z:slab.cz,y:slab.level*1.6});
      }
      for(const point of FOCUS_POINTS[scenario]) {
        const mesh=new THREE.Mesh(focusSphere,point.role==="comparison"?mat.focusComparison:mat.focusPrimary);
        mesh.scale.setScalar(.145);
        mesh.renderOrder=12;
        mesh.userData.kind="problem-focus";
        mesh.userData.focusId=point.id;
        const halo=new THREE.Mesh(focusSphere,mat.focusHalo);
        halo.scale.setScalar(.27);
        halo.renderOrder=11;
        frame.add(halo);
        frame.add(mesh);
        markers.push({point,mesh,halo});
      }
      host.dataset.focusCount=String(markers.length);
      host.dataset.focusId=markers.map(m=>m.point.id).join(",");
      elapsed=0;
      blend=0;
      if(referenceBuilt)buildReference();
      buildTeaching();
      updateModel(0,0);
      dirty=true;
    };
    const fitDistance=()=>cameraFitDistance(modelBounds,camera.aspect,camera.fov);
    const direction=(v:CameraView):V3 => v==="front" ? [0,.09,1] : v==="side" ? [1,.09,0] : v==="left" ? [-1,.09,0] : v==="top" ? [.015,1,.075] : [.8,.65,1];
    const cameraTarget=():V3 => [(modelBounds.min[0]+modelBounds.max[0])/2, (modelBounds.min[1]+modelBounds.max[1])/2+.1, (modelBounds.min[2]+modelBounds.max[2])/2];
    const viewCamera=(v:CameraView,immediate=false) => {
      selectedView=v;
      // An explicit preset/reset restores auto-fit after manual orbit/pan.
      manuallyMoved=false;
      const dest=cameraTarget(),dir=direction(v),length=Math.hypot(...dir),distance=fitDistance();
      const to:V3=[dest[0]+dir[0]/length*distance,dest[1]+dir[1]/length*distance,dest[2]+dir[2]/length*distance];
      controls.minDistance=Math.max(4,distance*.25);
      controls.maxDistance=Math.max(28,distance*2.2);
      if(immediate || motionPreference.matches){
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

      if(latest.current.comparing && referenceBuilt){
        const split=renderer as SplitRenderer;
        const width=Math.max(2,host.clientWidth),height=Math.max(1,host.clientHeight);
        const left=Math.floor(width/2),right=width-left;
        split.setScissorTest(true);
        try{
          frame.visible=false;
          referenceFrame.visible=true;
          split.setViewport(0,0,left,height);
          split.setScissor(0,0,left,height);
          renderer.render(scene,camera);
          frame.visible=true;
          referenceFrame.visible=false;
          split.setViewport(left,0,right,height);
          split.setScissor(left,0,right,height);
          renderer.render(scene,camera);
        }finally{
          frame.visible=true;
          referenceFrame.visible=false;
          split.setScissorTest(false);
          split.setViewport(0,0,width,height);
        }
      }else{
        frame.visible=true;
        referenceFrame.visible=false;
        renderer.render(scene,camera);
      }
      host.dataset.compareMode=latest.current.comparing?"dual":"single";
      host.dataset.comparePhase=elapsed.toFixed(4);
      host.dataset.referenceMembers=String(referenceParts.length);
      // Values are sampled from the actual camera and GPU renderer, never
      // inferred from an active button. Used by bounded browser regression QA.
      const pos=[camera.position.x,camera.position.y,camera.position.z].map(v=>v.toFixed(3)).join(",");
      if(host.dataset.cameraPosition!==pos) host.dataset.cameraPosition=pos;
      host.dataset.rendererGeometries=String(renderer.info.memory.geometries);
    };
    const tick=(now:number)=>{
      ticking=true;
      raf=0;
      if(disposed||lost||!latest.current.active||document.hidden){ticking=false;return;}
      const dt=lastStamp?Math.min((now-lastStamp)/1000,.05):0;
      lastStamp=now;
      const allowed=!motionPreference.matches;
      const running=latest.current.playing && allowed;
      if(running) elapsed+=dt*Math.max(.25,Math.min(2,latest.current.speed))*3.1;
      if(running) {
        // Smoothly approach the selected displacement amplitude without resetting the scene.
        const target=Math.max(0,Math.min(MAX_SHAKE_STRENGTH,latest.current.intensity));
        blend+=(target-blend)*Math.min(1,dt*4.5);
      }
      if(!allowed && blend>0){blend=0;elapsed=0;updateModel(0,0);dirty=true;}
      const moving=running;
      if(moving) updateModel(elapsed,blend);
      if(cameraTween){
        const f=Math.min(1,(now-cameraTween.start)/cameraTween.duration);
        const smooth=smootherStep(f),a=cameraTween;
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
    const onUserStart=()=>{manuallyMoved=true;cancelTween();};
    const markDirty=()=>{ dirty=true; wake(); };
    controls.addEventListener("start",onUserStart);
    controls.addEventListener("change",markDirty);
    const resize=()=>{
      if(disposed) return;
      const w=Math.max(1,host.clientWidth),h=Math.max(1,host.clientHeight);
      camera.aspect=(latest.current.comparing?Math.max(1,Math.floor(w/2)):w)/h;
      camera.updateProjectionMatrix();
      renderer.setSize(w,h,false);
      // Keep the building contained after mobile rotation or inspector resize.
      if(!resizedOnce){resizedOnce=true;viewCamera(selectedView,true);}
      else if(!manuallyMoved)viewCamera(selectedView,false);
      else {dirty=true;wake();}
    };
    const observer=new ResizeObserver(resize);
    observer.observe(host);
    const onVisible=()=>{lastStamp=0; if(!document.hidden){dirty=true;wake();}};
    document.addEventListener("visibilitychange",onVisible);
    const onLoss=(e:Event)=>{e.preventDefault();lost=true;cancelAnimationFrame(raf);raf=0;latest.current.onFailure();};
    renderer.domElement.addEventListener("webglcontextlost",onLoss);
    rebuild(scenario);
    runtime.current={
      refresh:()=>{
        if(latest.current.comparing&&!referenceBuilt)buildReference();
        updateModel(elapsed,blend);dirty=true;wake();
      },
      compare:()=>{
        if(latest.current.comparing&&!referenceBuilt)buildReference();
        const w=Math.max(1,host.clientWidth),h=Math.max(1,host.clientHeight);
        camera.aspect=(latest.current.comparing?Math.max(1,Math.floor(w/2)):w)/h;
        camera.updateProjectionMatrix();
        updateModel(elapsed,blend);
        viewCamera(selectedView,false);
        dirty=true;wake();
      },
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
      controls.removeEventListener("start",onUserStart);
      controls.removeEventListener("change",markDirty);
      controls.dispose();
      document.removeEventListener("visibilitychange",onVisible);
      renderer.domElement.removeEventListener("webglcontextlost",onLoss);
      renderer.domElement.remove();
      renderer.dispose();
      for(const p of segments) if(p.wallRest) p.mesh.geometry.dispose();
      clearReference();
      clearTeaching();
      Object.values(teachingMaterials).forEach(material=>material.dispose());
      slabEdges.dispose();
      slabEdgeMaterial.dispose();
      focusSphere.dispose();
      unit.dispose();
      grid.geometry.dispose();
      if(Array.isArray(grid.material)) grid.material.forEach(m=>m.dispose());
      else grid.material.dispose();
      Object.values(mat).forEach(m=>m.dispose());
    };
  }, []);
  useEffect(()=>{runtime.current?.changeScenario(props.scenario);},[props.scenario]);
  useEffect(()=>{runtime.current?.view(props.view);},[props.view,props.cameraPulse]);
  useEffect(()=>{runtime.current?.compare();},[props.comparing]);
  useEffect(()=>{if(props.resetToken>0)runtime.current?.reset();},[props.resetToken]);
  return <div ref={root} data-testid="irregularity-three-canvas" data-scenario={props.scenario} className="h-full w-full touch-none" />;
}
