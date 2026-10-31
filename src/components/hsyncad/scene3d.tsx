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
import {
  cadToThreeCoord,
  cadToThreeDisplacement,
  build3DRibbonData,
  calculateAutoDiagramScale,
  calculateAutoDeformationScale,
  interpolateStationForces,
  getDcrColorHex,
  getDcrColor,
  getVertexDisplacement,
  getDisplacementHeatmapColor,
  getMaxDisplacementMagnitude,
  projectRaycastHitToStation,
  type ForceDiagramType,
} from "@/lib/hsyncad/diagram-geometry";

export { getVertexDisplacement };

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
  diagramScale?: number;
  deformationScale?: number;
  activeCombination?: string;
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

function computeBuildingDimension(model: CadModel): number {
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity, maxZ = 10;
  for (const floor of model.floors) {
    if (floor.elevation + floor.height > maxZ) maxZ = floor.elevation + floor.height;
  }
  for (const el of model.elements) {
    if (el.type === "column") {
      minX = Math.min(minX, el.position.x); maxX = Math.max(maxX, el.position.x);
      minY = Math.min(minY, el.position.y); maxY = Math.max(maxY, el.position.y);
    } else if (el.type === "beam" || el.type === "wall") {
      minX = Math.min(minX, el.start.x, el.end.x); maxX = Math.max(maxX, el.start.x, el.end.x);
      minY = Math.min(minY, el.start.y, el.end.y); maxY = Math.max(maxY, el.start.y, el.end.y);
    }
  }
  const spanX = Number.isFinite(minX) ? maxX - minX : 20;
  const spanY = Number.isFinite(minY) ? maxY - minY : 20;
  return Math.max(spanX, spanY, maxZ, 15);
}


/** One model unit is one metre. Plan +Y maps to world -Z; world +Y is elevation. */
export default function Scene3D({ model, selectedId, onSelect, hiddenLayers, junctions, fitKey = 0, light = true, viewRequest, analysisResult, analysisViewMode = "none", diagramScale = 1.0, deformationScale = 100, activeCombination = "Zarf" }: Scene3DProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const runtimeRef = useRef<SceneRuntime | null>(null);
  const selectRef = useRef(onSelect);
  const [renderError, setRenderError] = useState<string | null>(null);

  const [hoverInfo, setHoverInfo] = useState<{
    elementName: string;
    elementType: string;
    x: number;
    L: number;
    M3: number;
    V2: number;
    N: number;
    dcr: number;
    clientX: number;
    clientY: number;
  } | null>(null);

  const analysisResultRef = useRef(analysisResult);
  const analysisViewModeRef = useRef(analysisViewMode);
  const modelRef = useRef(model);
  const hoverRef = useRef(hoverInfo);

  useEffect(() => {
    analysisResultRef.current = analysisResult;
    analysisViewModeRef.current = analysisViewMode;
    modelRef.current = model;
    hoverRef.current = hoverInfo;
  }, [analysisResult, analysisViewMode, model, hoverInfo]);

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
      if (pressed) {
        if (Math.hypot(event.clientX - pressed.x, event.clientY - pressed.y) > 5) pressed.dragged = true;
        return;
      }
      const aRes = analysisResultRef.current;
      const vMode = analysisViewModeRef.current;
      if (!aRes || !vMode || vMode === "none") {
        if (hoverRef.current) setHoverInfo(null);
        return;
      }
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.set(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1);
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(elements.children, true);
      const hit = hits.find((item) => item.object instanceof THREE.Mesh && item.object.userData.elementId);
      if (hit && typeof hit.object.userData.elementId === "string") {
        const id = hit.object.userData.elementId;
        const el = modelRef.current.elements.find((e) => e.id === id);
        if (el) {
          const stations = (aRes.memberStations?.[id] || aRes.memberForces?.[id] || []) as any[];
          const floor = modelRef.current.floors.find((f) => f.id === el.floorId);
          const { t, x, L } = projectRaycastHitToStation(hit.point, el, floor);
          const forces = interpolateStationForces(stations, t);
          const memberResult = aRes.members?.[id];
          const dcr = memberResult?.capacityRatio ?? 0;
          setHoverInfo({
            elementName: el.name,
            elementType: el.type,
            x,
            L,
            M3: forces.M3,
            V2: forces.V2,
            N: forces.N,
            dcr,
            clientX: event.clientX - rect.left,
            clientY: event.clientY - rect.top,
          });
          return;
        }
      }
      if (hoverRef.current) setHoverInfo(null);
    };
    const pointerLeave = () => {
      if (hoverRef.current) setHoverInfo(null);
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
    const pointerCancel = () => { pressed = null; if (hoverRef.current) setHoverInfo(null); };
    const contextLost = (event: Event) => {
      event.preventDefault();
      setRenderError("3B görüntü bağlantısı kesildi. Görünümü yeniden başlatmak için sayfayı yenileyin.");
    };
    renderer.domElement.addEventListener("pointerdown", pointerDown);
    renderer.domElement.addEventListener("pointermove", pointerMove);
    renderer.domElement.addEventListener("pointerup", pointerUp);
    renderer.domElement.addEventListener("pointercancel", pointerCancel);
    renderer.domElement.addEventListener("pointerleave", pointerLeave);
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
      renderer.domElement.removeEventListener("pointerleave", pointerLeave);
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

    const buildingDim = computeBuildingDimension(model);
    const baseDispScale = analysisResult?.displacements ? calculateAutoDeformationScale(analysisResult.displacements, buildingDim) : 100;
    const activeDispScale = baseDispScale * ((deformationScale || 100) / 100);
    const maxDispMag = getMaxDisplacementMagnitude(analysisResult);

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
        geometry.computeVertexNormals();

        const analysisMember = analysisResult?.members[part.elementId];
        const capacityColor = analysisMember ? getDcrColorHex(analysisMember.capacityRatio) : undefined;
        const layerColor = element?.layer === "Temeller" ? 0x8b5cf6 : element?.layer === "Merdivenler" ? 0xec4899 : (element?.color ?? model.layers?.find(l => l.name === element?.layer)?.color ?? COLORS[part.type]);

        if (analysisViewMode === "displacement") {
          // 1. Ghost structure (undeformed reference)
          const ghostMat = new THREE.MeshStandardMaterial({
            color: 0x94a3b8,
            roughness: 0.8,
            transparent: true,
            opacity: 0.18,
            depthWrite: false,
          });
          const ghostMesh = new THREE.Mesh(geometry, ghostMat);
          const ghostEdges = new THREE.LineSegments(new THREE.EdgesGeometry(geometry, 25), new THREE.LineBasicMaterial({ color: 0x475569, transparent: true, opacity: 0.25 }));
          ghostMesh.add(ghostEdges);
          runtime.elements.add(ghostMesh);

          // 2. Deformed structure with vertex displacement and smooth contour coloration
          const posAttr = geometry.getAttribute("position");
          const defPositions = new Float32Array(posAttr.count * 3);
          const defColors = new Float32Array(posAttr.count * 3);
          for (let i = 0; i < posAttr.count; i++) {
            const vx = posAttr.getX(i);
            const vy = posAttr.getY(i);
            const vz = posAttr.getZ(i);
            const cadX = vx, cadY = -vz, cadZ = vy;
            const [ux, uy, uz] = getVertexDisplacement(cadX, cadY, cadZ, analysisResult);
            const [uThreeX, uThreeY, uThreeZ] = cadToThreeDisplacement(ux, uy, uz);
            defPositions[i * 3 + 0] = vx + activeDispScale * uThreeX;
            defPositions[i * 3 + 1] = vy + activeDispScale * uThreeY;
            defPositions[i * 3 + 2] = vz + activeDispScale * uThreeZ;

            const uMag = Math.hypot(ux, uy, uz);
            const rho = Math.min(1.0, uMag / maxDispMag);
            const [r, g, b] = getDisplacementHeatmapColor(rho);
            defColors[i * 3 + 0] = r;
            defColors[i * 3 + 1] = g;
            defColors[i * 3 + 2] = b;
          }
          const defGeometry = new THREE.BufferGeometry();
          defGeometry.setAttribute("position", new THREE.Float32BufferAttribute(defPositions, 3));
          defGeometry.setAttribute("color", new THREE.Float32BufferAttribute(defColors, 3));
          defGeometry.computeVertexNormals();
          const defMat = new THREE.MeshStandardMaterial({
            vertexColors: true,
            roughness: 0.65,
            metalness: 0.1,
          });
          const defMesh = new THREE.Mesh(defGeometry, defMat);
          defMesh.name = (element?.name ?? part.type) + " (Deforme)";
          defMesh.userData.elementId = part.elementId;
          defMesh.userData.baseColor = 0x38bdf8;
          const defEdges = new THREE.LineSegments(new THREE.EdgesGeometry(defGeometry, 25), new THREE.LineBasicMaterial({ color: 0x0284c7, transparent: true, opacity: 0.85 }));
          defMesh.add(defEdges);
          runtime.elements.add(defMesh);
          solidCount += 1;
        } else {
          const isDiagramMode = analysisViewMode === "moment" || analysisViewMode === "shear" || analysisViewMode === "axial";
          const isCapacityMode = analysisViewMode === "capacity";
          const baseColor = (isCapacityMode && capacityColor !== undefined) ? capacityColor : layerColor;
          const opacity = isDiagramMode ? 0.45 : 1.0;
          const material = new THREE.MeshStandardMaterial({
            color: baseColor,
            roughness: 0.78,
            metalness: 0.04,
            transparent: opacity < 1.0,
            opacity,
          });
          const mesh = new THREE.Mesh(geometry, material);
          mesh.name = element?.name ?? part.type;
          mesh.userData.elementId = part.elementId;
          mesh.userData.baseColor = new THREE.Color(baseColor).getHex();
          const edges = new THREE.LineSegments(new THREE.EdgesGeometry(geometry, 25), new THREE.LineBasicMaterial({ color: 0x263849, transparent: true, opacity: isDiagramMode ? 0.30 : 0.65 }));
          mesh.add(edges);
          runtime.elements.add(mesh);
          solidCount += 1;
        }
      }
    }

    // 3D Extruded Ribbon Force Diagrams
    if (analysisResult && (analysisViewMode === "moment" || analysisViewMode === "shear" || analysisViewMode === "axial")) {
      const fType: ForceDiagramType = analysisViewMode === "moment" ? "M3" : analysisViewMode === "shear" ? "V2" : "N";
      const strokeColor = fType === "M3" ? 0x2563eb : fType === "V2" ? 0x0891b2 : 0xea580c;
      const ribbonColor = fType === "M3" ? 0x3b82f6 : fType === "V2" ? 0x06b6d4 : 0xf97316;
      const map = analysisResult.memberStations || analysisResult.memberForces || {};
      const baseScale = calculateAutoDiagramScale(map, fType, 0.60);
      const scale = baseScale * (diagramScale ?? 1.0);

      for (const element of model.elements) {
        if (element.type !== "beam" && element.type !== "column" && element.type !== "wall") continue;
        if (!layerState(model, element.layer, element.floorId).visible || hiddenLayers.includes(element.layer)) continue;
        const floor = floors.get(element.floorId);
        if (!floor) continue;

        const stations = (analysisResult.memberStations?.[element.id] || analysisResult.memberForces?.[element.id] || []) as any[];
        if (stations.length < 2) continue;

        let startCad = { x: 0, y: 0, z: 0 };
        let endCad = { x: 0, y: 0, z: 0 };

        if (element.type === "beam") {
          startCad = { x: element.start.x, y: element.start.y, z: floor.elevation + floor.height };
          endCad = { x: element.end.x, y: element.end.y, z: floor.elevation + floor.height };
        } else if (element.type === "column") {
          startCad = { x: element.position.x, y: element.position.y, z: floor.elevation };
          endCad = { x: element.position.x, y: element.position.y, z: floor.elevation + (element.height || floor.height) };
        } else {
          startCad = { x: (element.start.x + element.end.x) / 2, y: (element.start.y + element.end.y) / 2, z: floor.elevation };
          endCad = { x: (element.start.x + element.end.x) / 2, y: (element.start.y + element.end.y) / 2, z: floor.elevation + (element.height || floor.height) };
        }

        const rotDeg = "rotation" in element ? ((element as any).rotation ?? 0) : 0;
        const ribbon = build3DRibbonData(startCad, endCad, element.type, stations, fType, scale, rotDeg);
        if (ribbon.meshPositions.length > 0) {
          const ribbonGeo = new THREE.BufferGeometry();
          ribbonGeo.setAttribute("position", new THREE.Float32BufferAttribute(ribbon.meshPositions, 3));
          ribbonGeo.computeVertexNormals();
          const ribbonMat = new THREE.MeshBasicMaterial({
            color: ribbonColor,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.75,
            depthWrite: false,
          });
          const ribbonMesh = new THREE.Mesh(ribbonGeo, ribbonMat);
          ribbonMesh.userData.elementId = element.id;
          ribbonMesh.renderOrder = 2;
          runtime.elements.add(ribbonMesh);

          const crestGeo = new THREE.BufferGeometry();
          crestGeo.setAttribute("position", new THREE.Float32BufferAttribute(ribbon.crestPositions, 3));
          const crestLine = new THREE.Line(crestGeo, new THREE.LineBasicMaterial({ color: strokeColor }));
          crestLine.renderOrder = 3;
          runtime.elements.add(crestLine);

          const baseGeo = new THREE.BufferGeometry();
          baseGeo.setAttribute("position", new THREE.Float32BufferAttribute(ribbon.baselinePositions, 3));
          const baseLine = new THREE.Line(baseGeo, new THREE.LineDashedMaterial({ color: 0x94a3b8, dashSize: 0.2, gapSize: 0.1 }));
          baseLine.computeLineDistances();
          baseLine.renderOrder = 2;
          runtime.elements.add(baseLine);

          const capGeo = new THREE.BufferGeometry();
          capGeo.setAttribute("position", new THREE.Float32BufferAttribute(ribbon.endCapPositions, 3));
          const capLines = new THREE.LineSegments(capGeo, new THREE.LineBasicMaterial({ color: strokeColor }));
          capLines.renderOrder = 3;
          runtime.elements.add(capLines);
        }
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
  }, [model, hiddenLayers, junctions, analysisResult, analysisViewMode, diagramScale, deformationScale]);

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
        {hoverInfo && (
          <div
            style={{
              position: "absolute",
              left: Math.min(hoverInfo.clientX + 14, (viewportRef.current?.clientWidth ?? 400) - 200),
              top: Math.max(12, hoverInfo.clientY - 60),
              pointerEvents: "none",
              zIndex: 30,
              background: "rgba(15, 23, 42, 0.94)",
              border: "1px solid #38bdf8",
              borderRadius: 6,
              padding: "8px 12px",
              color: "#f8fafc",
              fontSize: 11,
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.5)",
            }}
          >
            <div style={{ fontWeight: "bold", marginBottom: 2 }}>{hoverInfo.elementName} ({hoverInfo.elementType})</div>
            <div style={{ color: "#60a5fa", fontFamily: "var(--font-mono, monospace)" }}>
              M₃: {hoverInfo.M3.toFixed(1)} kNm · V₂: {hoverInfo.V2.toFixed(1)} kN
            </div>
            <div style={{ color: "#fb923c", fontFamily: "var(--font-mono, monospace)" }}>
              N: {hoverInfo.N.toFixed(1)} kN · <span style={{ color: getDcrColor(hoverInfo.dcr), fontWeight: "bold" }}>DCR: %{(hoverInfo.dcr * 100).toFixed(0)}</span>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
