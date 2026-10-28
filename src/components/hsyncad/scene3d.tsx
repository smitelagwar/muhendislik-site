"use client";

import { useEffect, useRef, useState } from "react";
import { Maximize2 } from "lucide-react";
// Explicit supported exports use Three's complete installed types. The legacy
// document viewer has its own narrow ambient "three" declarations.
import * as ThreeRuntime from "three";
import type * as ThreeTypes from "three/src/Three.js";
import { OrbitControls, type OrbitControlsEventMap } from "three/addons/controls/OrbitControls.js";
import type { Controls } from "three/src/extras/Controls.js";
import { isSolidElement, type CadModel } from "@/lib/hsyncad/model";
import { layerState } from "@/lib/hsyncad/definitions";
import { resolveJunctions, type JunctionResult } from "@/lib/hsyncad/junctions";
import { axisSegments } from "@/lib/hsyncad/axes";

const THREE = ThreeRuntime as unknown as typeof ThreeTypes;

import type { AnalysisResult } from "@/lib/hsyncad/analysis";

interface Scene3DProps {
  model: CadModel;
  light?: boolean;
  selectedId: string | null;
  onSelect: (id: string) => void;
  hiddenLayers: string[];
  junctions?: JunctionResult;
  fitKey?: number;
  viewRequest?: { mode: string; revision: number };
  analysisResult?: AnalysisResult | null;
  analysisViewMode?: string;
}

// Restore only the official inherited lifecycle/event types hidden by that shim.
type CadOrbitControls = OrbitControls & Pick<Controls<OrbitControlsEventMap>, "addEventListener" | "removeEventListener" | "dispose">;

interface SceneRuntime {
  scene: ThreeTypes.Scene;
  camera: ThreeTypes.PerspectiveCamera;
  renderer: ThreeTypes.WebGLRenderer;
  controls: CadOrbitControls;
  elements: ThreeTypes.Group;
  fit: () => void;
  render: () => void;
  didFitModel: boolean;
}

const COLORS = {
  column: 0xeab160,
  beam: 0x6a9de1,
  wall: 0x5cbbad,
  slab: 0xb29bd7,
};

function disposeObjects(root: ThreeTypes.Object3D) {
  root.traverse((object) => {
    if (object instanceof THREE.Mesh || object instanceof THREE.Line) {
      object.geometry.dispose();
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      for (const material of materials) material.dispose();
    }
  });
  root.clear();
}

/** One model unit is one metre. Plan +Y maps to world -Z; world +Y is elevation. */
export default function Scene3D({ model, selectedId, onSelect, hiddenLayers, junctions, fitKey = 0, light = true, viewRequest, analysisResult, analysisViewMode }: Scene3DProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const runtimeRef = useRef<SceneRuntime | null>(null);
  const selectRef = useRef(onSelect);
  const [renderError, setRenderError] = useState<string | null>(null);

  useEffect(() => {
    selectRef.current = onSelect;
  }, [onSelect]);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    let renderer: ThreeTypes.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    } catch {
      // Renderer creation is an external operation; report its result after the effect.
      const notification = window.setTimeout(() => {
        setRenderError("3B görünüm için WebGL gerekiyor. Tarayıcınızda donanım hızlandırmayı etkinleştirin; 2B modelleme ve metrajı kullanmaya devam edebilirsiniz.");
      }, 0);
      return () => window.clearTimeout(notification);
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setClearColor(light ? 0xffffff : 0x18232e);
    renderer.domElement.style.display = "block";
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    renderer.domElement.style.touchAction = "none";
    renderer.domElement.setAttribute("aria-label", "Yapı elemanlarının metre ölçeğinde etkileşimli 3B katı modeli");
    renderer.domElement.setAttribute("role", "img");
    renderer.domElement.setAttribute("data-testid", "hsyncad-3d-canvas");
    viewport.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, 1, 0.01, 100000);
    camera.position.set(12, 10, 12);
    const controls = new OrbitControls(camera, renderer.domElement) as CadOrbitControls;
    controls.enableDamping = false;
    controls.minDistance = 0.1;
    controls.maxDistance = 100000;
    controls.maxPolarAngle = Math.PI * 0.94;
    controls.screenSpacePanning = true;
    controls.touches.ONE = THREE.TOUCH.ROTATE;
    controls.touches.TWO = THREE.TOUCH.DOLLY_PAN;
    controls.target.set(2, 1.4, -2);
    controls.update();

    scene.add(new THREE.HemisphereLight(0xe9f2ff, 0x5b6672, 2.2));
    const keyLight = new THREE.DirectionalLight(0xffffff, 2.5);
    keyLight.position.set(8, 15, 5);
    scene.add(keyLight);
    const fillLight = new THREE.DirectionalLight(0xb2d4ff, 0.75);
    fillLight.position.set(-8, 6, -7);
    scene.add(fillLight);

    const grid = new THREE.GridHelper(100, 100, light ? 0xb7bcc4 : 0x53677b, light ? 0xe2e5f2 : 0x2d3e4f);
    grid.position.y = -0.012;
    scene.add(grid);
    const axes = new THREE.AxesHelper(1.5);
    axes.position.y = 0.01;
    scene.add(axes);
    const elements = new THREE.Group();
    scene.add(elements);

    let frame = 0;
    let disposed = false;
    const render = () => {
      if (disposed || frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        if (!disposed) renderer.render(scene, camera);
      });
    };
    const fit = () => {
      const bounds = new THREE.Box3().setFromObject(elements);
      if (bounds.isEmpty()) {
        controls.target.set(2, 0, -2); camera.position.set(12, 4, 12);
        camera.near = 0.01; camera.far = 100000; camera.updateProjectionMatrix(); controls.update(); render(); return;
      }
      const center = bounds.getCenter(new THREE.Vector3());
      const size = bounds.getSize(new THREE.Vector3());
      const radius = Math.max(size.length() * 0.5, 3);
      const verticalFov = THREE.MathUtils.degToRad(camera.fov);
      const horizontalFov = 2 * Math.atan(Math.tan(verticalFov / 2) * camera.aspect);
      const distance = radius / Math.sin(Math.min(verticalFov, horizontalFov) / 2) * 1.18;
      const direction = new THREE.Vector3(1, 0.85, 1).normalize();
      controls.target.copy(center);
      camera.position.copy(center).addScaledVector(direction, distance);
      camera.near = Math.max(0.005, distance / 10000);
      camera.far = Math.max(1000, distance * 100);
      camera.updateProjectionMatrix();
      controls.update();
      render();
    };

    const runtime: SceneRuntime = { scene, camera, renderer, controls, elements, fit, render, didFitModel: false };
    runtimeRef.current = runtime;

    const resize = () => {
      const { width, height } = viewport.getBoundingClientRect();
      if (width <= 0 || height <= 0) return;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      render();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(viewport);
    resize();
    fit();
    controls.addEventListener("change", render);

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let pressed: { x: number; y: number; pointerId: number; dragged: boolean } | null = null;
    const pointerDown = (event: PointerEvent) => {
      if (pressed || event.button !== 0) {
        if (pressed) pressed.dragged = true;
        return;
      }
      pressed = { x: event.clientX, y: event.clientY, pointerId: event.pointerId, dragged: false };
    };
    const pointerMove = (event: PointerEvent) => {
      if (pressed && Math.hypot(event.clientX - pressed.x, event.clientY - pressed.y) > 5) pressed.dragged = true;
    };
    const pointerUp = (event: PointerEvent) => {
      const start = pressed;
      pressed = null;
      if (!start || start.pointerId !== event.pointerId || start.dragged) return;
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.set(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1);
      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObjects(elements.children, false).find((item) => item.object instanceof THREE.Mesh);
      const id: unknown = hit?.object.userData.elementId;
      if (typeof id === "string") selectRef.current(id);
    };
    const pointerCancel = () => { pressed = null; };
    const contextLost = (event: Event) => {
      event.preventDefault();
      setRenderError("3B görüntü bağlantısı kesildi. Görünümü yeniden başlatmak için sayfayı yenileyin.");
    };
    renderer.domElement.addEventListener("pointerdown", pointerDown);
    renderer.domElement.addEventListener("pointermove", pointerMove);
    renderer.domElement.addEventListener("pointerup", pointerUp);
    renderer.domElement.addEventListener("pointercancel", pointerCancel);
    renderer.domElement.addEventListener("webglcontextlost", contextLost);

    return () => {
      disposed = true;
      observer.disconnect();
      if (frame) cancelAnimationFrame(frame);
      controls.removeEventListener("change", render);
      controls.dispose();
      renderer.domElement.removeEventListener("pointerdown", pointerDown);
      renderer.domElement.removeEventListener("pointermove", pointerMove);
      renderer.domElement.removeEventListener("pointerup", pointerUp);
      renderer.domElement.removeEventListener("pointercancel", pointerCancel);
      renderer.domElement.removeEventListener("webglcontextlost", contextLost);
      disposeObjects(scene);
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
      runtimeRef.current = null;
    };
  }, [light]);

  useEffect(() => {
    const runtime = runtimeRef.current;
    const viewport = viewportRef.current;
    if (!runtime || !viewport) return;
    disposeObjects(runtime.elements);
    const resolvedJunctions = junctions ?? resolveJunctions(model);
    const floors = new Map(model.floors.map((floor) => [floor.id, floor]));
    const elementsById = new Map(model.elements.map((e) => [e.id, e]));
    let solidCount = 0;
    for (const e of model.elements) if (e.type === "slabEdge" && layerState(model, e.layer, e.floorId).visible && !hiddenLayers.includes(e.layer)) {
      const floor = floors.get(e.floorId)!;
      const geometry = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(e.start.x, floor.elevation + floor.height + (e.topOffset ?? 0) + 0.005, -e.start.y), new THREE.Vector3(e.end.x, floor.elevation + floor.height + (e.endTopOffset ?? e.topOffset ?? 0) + 0.005, -e.end.y)]);
      const line = new THREE.Line(geometry, new THREE.LineDashedMaterial({ color: e.color ?? 0xd577ae, dashSize: 0.12, gapSize: 0.08 }));
      line.computeLineDistances(); runtime.elements.add(line);
    }

    for (const element of model.elements) {
      if (element.type !== "axis" || (!layerState(model, element.layer, element.floorId).visible || hiddenLayers.includes(element.layer))) continue;
      const floor = floors.get(element.floorId);
      if (!floor) continue;
      const sections = axisSegments(element);
      for (const section of sections) {
        const geometry = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(section.a.x, floor.elevation + 0.015, -section.a.y),
          new THREE.Vector3(section.b.x, floor.elevation + 0.015, -section.b.y),
        ]);
        const color = section.color ?? model.layers?.find(l => l.name === element.layer)?.color ?? 0x91a5b8;
        const line = new THREE.Line(geometry, section.style === "solid" ? new THREE.LineBasicMaterial({ color }) : new THREE.LineDashedMaterial({ color, dashSize: 0.2, gapSize: 0.1 }));
        line.computeLineDistances(); runtime.elements.add(line);
      }
    }

    if (resolvedJunctions.status === "resolved" && resolvedJunctions.parts.length > 0) {
      for (const part of resolvedJunctions.parts) {
        const element = elementsById.get(part.elementId);
        if (element && (!layerState(model, element.layer, element.floorId).visible || hiddenLayers.includes(element.layer))) continue;
        if (part.footprint.length < 3) continue;
        const depth = part.top - part.bottom;
        if (depth <= 1e-6) continue;
        let geometry: ThreeTypes.BufferGeometry;
        if (part.faces) {
          const positions: number[] = [];
          for (const face of part.faces) for (let i = 1; i + 1 < face.length; i++) for (const p of [face[0], face[i], face[i + 1]]) positions.push(p.x, p.z, -p.y);
          geometry = new THREE.BufferGeometry();
          geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
        } else {
          const shape = new THREE.Shape(part.footprint.map(p => new THREE.Vector2(p.x, p.y)));
          geometry = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false, steps: 1 });
          geometry.rotateX(-Math.PI / 2);
          geometry.translate(0, part.bottom, 0);
        }
        const analysisMember = analysisResult?.members[part.elementId];
        const capacityColor = analysisMember ? (analysisMember.capacityRatio > 1.0 ? 0xef4444 : analysisMember.capacityRatio > 0.70 ? 0xf59e0b : 0x22c55e) : undefined;
        const layerColor = element?.layer === "Temeller" ? 0x8b5cf6 : element?.layer === "Merdivenler" ? 0xec4899 : (element?.color ?? model.layers?.find(l => l.name === element?.layer)?.color ?? COLORS[part.type]);
        const baseColor = (analysisViewMode === "capacity" && capacityColor !== undefined) ? capacityColor : layerColor;
        geometry.computeVertexNormals();
        const material = new THREE.MeshStandardMaterial({ color: baseColor, roughness: 0.78, metalness: 0.04 });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.name = element?.name ?? part.type;
        mesh.userData.elementId = part.elementId;
        mesh.userData.baseColor = new THREE.Color(baseColor).getHex();
        const edges = new THREE.LineSegments(new THREE.EdgesGeometry(geometry, 25), new THREE.LineBasicMaterial({ color: 0x263849, transparent: true, opacity: 0.65 }));
        mesh.add(edges);
        runtime.elements.add(mesh);
        solidCount += 1;
      }
    }
    const bounds = new THREE.Box3().setFromObject(runtime.elements);
    const size = bounds.isEmpty() ? new THREE.Vector3() : bounds.getSize(new THREE.Vector3());
    // These values describe the generated THREE scene, not only React's input model.
    viewport.dataset.renderedSolidCount = String(solidCount);
    viewport.dataset.volumeSize = JSON.stringify(size.toArray());
    viewport.dataset.modelSignature = JSON.stringify(model.elements.filter((element) => !(!layerState(model, element.layer, element.floorId).visible || hiddenLayers.includes(element.layer))));
    if (solidCount > 0 && !runtime.didFitModel) {
      runtime.didFitModel = true;
      runtime.fit();
    }
    runtime.render();
  }, [model, hiddenLayers, junctions, analysisResult, analysisViewMode]);

  useEffect(() => {
    if (!fitKey) return;
    const frame = requestAnimationFrame(() => runtimeRef.current?.fit());
    return () => cancelAnimationFrame(frame);
  }, [fitKey]);

  useEffect(() => {
    const runtime = runtimeRef.current;
    if (!runtime || !viewRequest) return;
    const directions: Record<string, [number, number, number]> = {
      perspective: [1, .85, 1], top: [0, 1, .0001], bottom: [0, -1, .0001],
      left: [-1, 0, 0], right: [1, 0, 0], front: [0, 0, 1], back: [0, 0, -1], iso: [1, 1, 1],
    };
    const direction = viewRequest.mode === "perspective" && !runtime.elements.children.length ? [1, .3, 1] as const : directions[viewRequest.mode];
    if (!direction) return;
    runtime.fit();
    const distance = runtime.camera.position.distanceTo(runtime.controls.target);
    runtime.camera.position.copy(runtime.controls.target).addScaledVector(new THREE.Vector3(...direction).normalize(), distance);
    runtime.controls.update(); runtime.render();
    if (viewportRef.current) viewportRef.current.dataset.view = viewRequest.mode;
  }, [viewRequest, light]);

  useEffect(() => {
    const runtime = runtimeRef.current;
    if (!runtime) return;
    for (const object of runtime.elements.children) {
      if (!(object instanceof THREE.Mesh) || !(object.material instanceof THREE.MeshStandardMaterial)) continue;
      const selected = object.userData.elementId === selectedId;
      object.material.color.setHex(selected ? 0xffd56a : object.userData.baseColor as number);
      object.material.emissive.setHex(selected ? 0x6b4108 : 0x000000);
      object.material.setValues({ emissiveIntensity: selected ? 0.3 : 0 });
      for (const child of object.children) {
        if (child instanceof THREE.LineSegments && child.material instanceof THREE.LineBasicMaterial) {
          child.material.color.setHex(selected ? 0xffedb8 : 0x263849);
          child.material.setValues({ opacity: selected ? 1 : 0.65 });
        }
      }
    }
    runtime.render();
  }, [selectedId, model, hiddenLayers, junctions]);

  const solidCount = junctions?.status === "failed" ? 0 : model.elements.filter(isSolidElement).filter(element => layerState(model, element.layer, element.floorId).visible && !hiddenLayers.includes(element.layer)).length;

  return (
    <section className="hcad-scene3d" data-testid="hsyncad-3d" data-solid-count={solidCount} style={{ display: "flex", flexDirection: "column", minWidth: 0, minHeight: 0, height: "100%", background: "var(--hc-panel, #18232e)", overflow: "hidden" }} aria-label="3B Perspektif Penceresi">
      <div className="hcad-view-heading">
        <span><i className="hcad-dot" /><h2 style={{ fontSize: "inherit", fontWeight: 600, margin: 0 }}>3B Perspektif Penceresi</h2></span>
        <button type="button" data-testid="hsyncad-3d-fit" aria-label="3B modeli sığdır" title="Modeli sığdır · Sürükle: döndür, iki parmak: yakınlaştır" onClick={() => runtimeRef.current?.fit()} style={{ padding: "3px 7px", minHeight: 25, fontSize: 10, flexShrink: 0 }}><Maximize2 size={13} />Sığdır</button>
      </div>
      <div ref={viewportRef} data-testid="hsyncad-3d-viewport" style={{ flex: 1, minHeight: 0, position: "relative", overflow: "hidden", background: light ? "#ffffff" : "#18232e" }}>
        {renderError && <p role="alert" style={{ position: "absolute", zIndex: 1, inset: 20, padding: 16, color: "#ffe0b3", background: "#243440", borderRadius: 8, fontSize: 13 }}>{renderError}</p>}
        {junctions?.status === "failed" && <p role="alert" className="hcad-scene-error">Birleşim üretilemedi. Çakışan brüt katılar gizlendi. {junctions.error}</p>}
        {!renderError && junctions?.status !== "failed" && solidCount === 0 && <div className="hcad-empty-scene" style={{ pointerEvents: "none", position: "absolute", zIndex: 1, inset: 0, display: "grid", placeItems: "center", padding: 24, color: "#b8c9d8", textAlign: "center", fontSize: 12 }}>2B pencerede oluşturduğunuz yapı burada yükselir.</div>}
        <div style={{ pointerEvents: "none", position: "absolute", zIndex: 1, bottom: 12, left: 12, color: "#b8c9d8", fontFamily: "monospace", fontSize: 10, display: "flex", gap: 10 }}>
          <span style={{ color: "#efa58d" }}>X</span><span style={{ color: "#8bd4bf" }}>Y</span><span style={{ color: "#8db6eb" }}>Z ↑</span><span>1 birim = 1 m</span>
        </div>
        <span style={{ pointerEvents: "none", position: "absolute", zIndex: 1, right: 12, bottom: 12, color: "#b8c9d8", fontSize: 10 }}>{solidCount} katı eleman</span>
      </div>
    </section>
  );
}
