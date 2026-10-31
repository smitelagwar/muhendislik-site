"use client";

import { useEffect, useRef, useState } from "react";
import * as ThreeRuntime from "three";
import type * as ThreeTypes from "three/src/Three.js";
import { OrbitControls, type OrbitControlsEventMap } from "three/addons/controls/OrbitControls.js";
import type { Controls } from "three/src/extras/Controls.js";
import type { IdeElement, IdeProject } from "@/lib/hsyncad/ide-import";
import { surfaceUvs } from "@/lib/hsyncad/ide-scene-style";

// The older CAD preview declares a deliberately narrow ambient Three namespace.
const THREE = ThreeRuntime as unknown as typeof ThreeTypes;
type CadControls = OrbitControls & Pick<Controls<OrbitControlsEventMap>, "addEventListener" | "removeEventListener" | "dispose" | "object">;
type View = "perspective" | "top" | "front" | "right";
type Span = { end: number; id: string };
type Batch = { positions: number[]; edges: number[]; faces: Span[]; segments: Span[] };

export interface IdeScene3DProps {
  project: IdeProject;
  elements: IdeElement[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  view: View;
  fitKey: number;
  light?: boolean;
  slabMode?: "transparent" | "solid" | "hidden";
  showAxes?: boolean;
}

const COLORS: Record<string, number> = { column: 0xb3b4b2, beam: 0xb8b9b6, wall: 0xb0b0ad, masonry: 0xe8a165, slab: 0x77749f, foundation: 0xb8b9b6, stair: 0xb7b8b5, axis: 0x66666c, slabEdge: 0x8a85aa, line: 0x87838c, unknown: 0x8b8c8e };

function disposeGroup(group: ThreeTypes.Object3D, disposeTextures = false) {
  const materials = new Set<ThreeTypes.Material>();
  const textures = new Set<ThreeTypes.Texture>();
  group.traverse(object => {
    if (object instanceof THREE.Mesh || object instanceof THREE.Line || object instanceof THREE.Sprite) {
      if (!(object instanceof THREE.Sprite)) object.geometry.dispose();
      for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
        materials.add(material);
        if (disposeTextures && "map" in material && material.map instanceof THREE.Texture) textures.add(material.map);
      }
    }
  });
  for (const texture of textures) texture.dispose();
  for (const material of materials) material.dispose();
  group.clear();
}

function surfaceTexture(kind: "brick" | "concrete", renderer: ThreeTypes.WebGLRenderer) {
  const canvas = document.createElement("canvas"); canvas.width = 256; canvas.height = 128;
  const context = canvas.getContext("2d");
  if (!context) return null;
  context.fillStyle = kind === "brick" ? "#d8b8a1" : "#d5d5d1"; context.fillRect(0, 0, 256, 128);
  let seed = 517;
  const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  if (kind === "brick") {
    for (let row = 0; row < 4; row++) for (let col = -1; col < 3; col++) {
      const shade = Math.round(random() * 16);
      context.fillStyle = `rgb(${187 + shade},${107 + shade},${53 + shade})`;
      context.fillRect(col * 128 + (row % 2 ? 64 : 0) + 1, row * 32 + 1, 126, 30);
    }
  }
  for (let i = 0; i < 6000; i++) {
    const alpha = kind === "brick" ? .06 : .045;
    context.fillStyle = random() > .5 ? `rgba(255,255,255,${alpha})` : `rgba(40,35,30,${alpha})`;
    context.fillRect(Math.floor(random() * 256), Math.floor(random() * 128), 1 + random() * 2, 1 + random());
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping; texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  return texture;
}

function axisBubble(name: string, x: number, y: number, z: number) {
  const canvas = document.createElement("canvas"); canvas.width = canvas.height = 96;
  const context = canvas.getContext("2d");
  if (!context) return null;
  context.fillStyle = "#fff"; context.strokeStyle = "#ee7545"; context.lineWidth = 3;
  context.beginPath(); context.arc(48, 48, 39, 0, Math.PI * 2); context.fill(); context.stroke();
  context.font = `${name.length > 2 ? 28 : 38}px Arial`; context.textAlign = "center"; context.textBaseline = "middle";
  context.fillStyle = "#e96836"; context.fillText(name, 48, 50);
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false }));
  sprite.position.set(x, y, z); sprite.scale.setScalar(.45); return sprite;
}

function cleanRing(source: IdeElement["points"]) {
  const points = source.filter(p => Number.isFinite(p.x) && Number.isFinite(p.y));
  if (points.length > 2 && points[0].x === points.at(-1)!.x && points[0].y === points.at(-1)!.y) return points.slice(0, -1);
  return points;
}

function polygon(element: IdeElement) {
  return cleanRing(element.footprint ?? ((element.type === "column" || element.type === "slab") ? element.points : []));
}

function rings(element: IdeElement) {
  const exterior = polygon(element);
  return exterior.length >= 3 ? [exterior, ...(element.holes ?? []).map(cleanRing).filter(hole => hole.length >= 3)] : [element.points];
}

/** Coordinates are copied from the native footprint. No widths or heights are guessed. */
function nativeGeometry(element: IdeElement): ThreeTypes.BufferGeometry | null {
  if (element.mesh) {
    const { positions, indices } = element.mesh;
    const vertexCount = positions.length / 3;
    if (!positions.length || positions.length % 3 || positions.some(value => !Number.isFinite(value) || Math.abs(value) > 1_000_000) || (indices ? !indices.length || indices.length % 3 || indices.some(index => !Number.isInteger(index) || index < 0 || index >= vertexCount) : vertexCount % 3)) return null;
    const world = new Float32Array(positions.length);
    for (let i = 0; i < positions.length; i += 3) { world[i] = positions[i]; world[i + 1] = positions[i + 2]; world[i + 2] = -positions[i + 1]; }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(world, 3));
    if (indices) geometry.setIndex(indices);
    return geometry;
  }
  const points = polygon(element);
  if (points.length < 3 || element.bottom === undefined || element.top === undefined || !Number.isFinite(element.bottom) || !Number.isFinite(element.top) || element.top <= element.bottom) return null;
  const exterior = points.map(p => new THREE.Vector2(p.x, p.y));
  if (!THREE.ShapeUtils.isClockWise(exterior)) exterior.reverse();
  const shape = new THREE.Shape(exterior);
  // ShapeUtils/Earcut triangulates caps around the stored inner rings, and
  // ExtrudeGeometry creates the vertical faces of those openings as well.
  for (const hole of (element.holes ?? []).map(cleanRing)) if (hole.length >= 3) {
    const interior = hole.map(p => new THREE.Vector2(p.x, p.y));
    if (THREE.ShapeUtils.isClockWise(interior)) interior.reverse();
    shape.holes.push(new THREE.Path(interior));
  }
  const geometry = new THREE.ExtrudeGeometry(shape, { depth: element.top - element.bottom, bevelEnabled: false, steps: 1, curveSegments: 1 });
  // Native Z is vertical; Three Y is vertical. Native plan +Y maps to -Z.
  geometry.rotateX(-Math.PI / 2);
  geometry.translate(0, element.bottom, 0);
  return geometry;
}

/** Native quad borders are retained; rendering diagonals are not drawn as source edges. */
function sourceMeshEdges(element: IdeElement, geometry: ThreeTypes.BufferGeometry): ThreeTypes.BufferGeometry {
  const quads = element.mesh?.quads, points = geometry.getAttribute("position");
  if (!quads?.length || quads.length % 4 || quads.some(index => !Number.isInteger(index) || index < 0 || index >= points.count)) return new THREE.WireframeGeometry(geometry);
  const seen = new Set<string>(), edges: number[] = [];
  for (let i = 0; i < quads.length; i += 4) for (let j = 0; j < 4; j++) {
    const a = quads[i + j], b = quads[i + (j + 1) % 4];
    if (a === b) continue;
    const key = a < b ? `${a}:${b}` : `${b}:${a}`;
    if (seen.has(key)) continue;
    seen.add(key); edges.push(points.getX(a), points.getY(a), points.getZ(a), points.getX(b), points.getY(b), points.getZ(b));
  }
  const result = new THREE.BufferGeometry(); result.setAttribute("position", new THREE.Float32BufferAttribute(edges, 3)); return result;
}

function idAt(spans: Span[], index: number) {
  let lo = 0, hi = spans.length;
  while (lo < hi) { const mid = (lo + hi) >>> 1; if (spans[mid].end <= index) lo = mid + 1; else hi = mid; }
  return spans[lo]?.id ?? null;
}

interface Runtime {
  scene: ThreeTypes.Scene;
  renderer: ThreeTypes.WebGLRenderer;
  camera: ThreeTypes.PerspectiveCamera | ThreeTypes.OrthographicCamera;
  controls: CadControls;
  content: ThreeTypes.Group;
  selection: ThreeTypes.Group;
  ground: ThreeTypes.Group;
  textures: { brick: ThreeTypes.Texture | null; concrete: ThreeTypes.Texture | null };
  render: () => void;
  fit: (view?: View) => void;
  view: View;
  byId: Map<string, IdeElement>;
}

export default function IdeScene3D({ project, elements, selectedId, onSelect, view, fitKey, light = true, slabMode = "transparent", showAxes = true }: IdeScene3DProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const runtimeRef = useRef<Runtime | null>(null);
  const fittedContentRef = useRef<{ project: IdeProject; elements: IdeElement[]; light: boolean } | null>(null);
  const onSelectRef = useRef(onSelect);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { onSelectRef.current = onSelect; }, [onSelect]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let renderer: ThreeTypes.WebGLRenderer;
    try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false }); }
    catch {
      const timer = window.setTimeout(() => setError("3B görünüm için WebGL kullanılamıyor. 2B kat planlarını inceleyebilirsiniz."), 0);
      return () => window.clearTimeout(timer);
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(light ? 0xffffff : 0x17212c);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    const canvas = renderer.domElement;
    Object.assign(canvas.style, { display: "block", width: "100%", height: "100%", touchAction: "none" });
    canvas.setAttribute("data-testid", "ide-3d-canvas");
    canvas.setAttribute("role", "img");
    canvas.setAttribute("aria-label", "IDE projesinin dosyadan okunan geometri ve kotlarıyla 3B görünümü");
    host.appendChild(canvas);

    const scene = new THREE.Scene();
    const perspective = new THREE.PerspectiveCamera(34, 1, 0.01, 100000);
    const orthographic = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.01, 100000);
    perspective.position.set(25, 20, 25);
    let viewportAspect = 1;
    const controls = new OrbitControls(perspective, canvas) as CadControls;
    controls.enableDamping = false;
    controls.rotateSpeed = 0.6;
    controls.zoomSpeed = 0.75;
    controls.panSpeed = 0.75;
    controls.screenSpacePanning = true;
    controls.maxPolarAngle = Math.PI * 0.98;
    controls.minDistance = 0.05;
    controls.maxDistance = 100000;
    const content = new THREE.Group(), selection = new THREE.Group(), ground = new THREE.Group();
    scene.add(content, selection, ground);
    scene.add(new THREE.HemisphereLight(0xffffff, 0x7a7b86, 2));
    const key = new THREE.DirectionalLight(0xffffff, 2.5);
    key.position.set(25, 60, 30); scene.add(key);
    const fill = new THREE.DirectionalLight(0xd7e7ff, 0.8);
    fill.position.set(-25, 15, -30); scene.add(fill);

    let frame = 0, disposed = false, lost = false;
    const render = () => {
      if (frame || disposed || lost) return;
      frame = requestAnimationFrame(() => { frame = 0; if (!disposed && !lost) renderer.render(scene, runtime.camera); });
    };
    const fit = (mode: View = runtime.view) => {
      runtime.view = mode;
      runtime.camera = mode === "perspective" ? perspective : orthographic;
      const camera = runtime.camera;
      controls.object = camera;
      controls.enableRotate = mode === "perspective";
      canvas.dataset.projection = mode === "perspective" ? "perspective" : "orthographic";
      canvas.dataset.view = mode;
      const bounds = new THREE.Box3().setFromObject(content);
      if (bounds.isEmpty()) { controls.target.set(0, 0, 0); camera.position.set(20, 15, 20); controls.update(); render(); return; }
      const center = bounds.getCenter(new THREE.Vector3()), size = bounds.getSize(new THREE.Vector3());
      const radius = Math.max(size.length() / 2, 0.5);
      const vfov = THREE.MathUtils.degToRad(perspective.fov), hfov = 2 * Math.atan(Math.tan(vfov / 2) * viewportAspect);
      const distance = mode === "perspective" ? radius / Math.sin(Math.min(vfov, hfov) / 2) * 1.12 : radius * 3 + 1;
      const direction = mode === "top" ? new THREE.Vector3(0, 1, 0) : mode === "front" ? new THREE.Vector3(0, 0, 1) : mode === "right" ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(1, 0.55, 1.2).normalize();
      camera.up.set(0, mode === "top" ? 0 : 1, mode === "top" ? -1 : 0);
      if (camera === orthographic) {
        const width = mode === "right" ? size.z : size.x, height = mode === "top" ? size.z : size.y;
        const half = Math.max(height / 2, width / (2 * viewportAspect), 0.5) * 1.12;
        orthographic.left = -half * viewportAspect; orthographic.right = half * viewportAspect;
        orthographic.top = half; orthographic.bottom = -half; orthographic.zoom = 1;
      }
      controls.target.copy(center);
      camera.position.copy(center).addScaledVector(direction, distance);
      camera.near = Math.max(0.001, distance / 10000);
      camera.far = Math.max(distance * 100, 1000);
      camera.updateProjectionMatrix(); controls.update(); render();
    };
    const runtime: Runtime = { scene, renderer, camera: perspective, controls, content, selection, ground, textures: { brick: surfaceTexture("brick", renderer), concrete: surfaceTexture("concrete", renderer) }, render, fit, view: "perspective", byId: new Map() };
    runtimeRef.current = runtime;
    controls.addEventListener("change", render);

    let lastAspect = 0;
    const resize = () => {
      const { width, height } = host.getBoundingClientRect();
      if (width < 1 || height < 1) return;
      viewportAspect = width / height;
      renderer.setSize(width, height, false); perspective.aspect = viewportAspect; perspective.updateProjectionMatrix();
      const half = (orthographic.top - orthographic.bottom) / 2;
      orthographic.left = -half * viewportAspect; orthographic.right = half * viewportAspect; orthographic.updateProjectionMatrix();
      if (!lastAspect && !content.children.length) fit();
      else if (!lastAspect) fit(runtime.view);
      lastAspect = viewportAspect;
      render();
    };
    const observer = new ResizeObserver(resize); observer.observe(host); resize();
    const raycaster = new THREE.Raycaster(), pointer = new THREE.Vector2();
    let pressed: { id: number; x: number; y: number; dragged: boolean } | null = null;
    const down = (event: PointerEvent) => {
      if (pressed) { pressed.dragged = true; return; }
      if (event.button === 0) pressed = { id: event.pointerId, x: event.clientX, y: event.clientY, dragged: false };
    };
    const move = (event: PointerEvent) => { if (pressed && Math.hypot(event.clientX - pressed.x, event.clientY - pressed.y) > 5) pressed.dragged = true; };
    const up = (event: PointerEvent) => {
      const start = pressed; pressed = null;
      if (!start || start.id !== event.pointerId || start.dragged || lost) return;
      const rect = canvas.getBoundingClientRect();
      pointer.set((event.clientX - rect.left) / rect.width * 2 - 1, 1 - (event.clientY - rect.top) / rect.height * 2);
      raycaster.setFromCamera(pointer, runtime.camera);
      raycaster.params.Line = { threshold: Math.max(0.02, runtime.camera.position.distanceTo(controls.target) * 0.0007) };
      const hits = raycaster.intersectObjects(content.children, false);
      // A transparent floor should not prevent picking the visible wall below.
      const hit = hits.find(item => !item.object.userData.transparentSlab) ?? hits[0];
      if (!hit) { onSelectRef.current(null); return; }
      const spans = hit.object.userData.spans as Span[] | undefined;
      const index = hit.object instanceof THREE.Mesh ? hit.faceIndex : hit.index;
      if (spans && index != null) onSelectRef.current(idAt(spans, index));
    };
    const cancel = () => { pressed = null; };
    const contextLost = (event: Event) => { event.preventDefault(); lost = true; setError("3B görüntü bağlantısı kesildi. Tarayıcının görüntüyü geri yüklemesi bekleniyor; 2B plan kullanılabilir."); };
    const contextRestored = () => { lost = false; setError(null); render(); };
    canvas.addEventListener("pointerdown", down); canvas.addEventListener("pointermove", move);
    canvas.addEventListener("pointerup", up); canvas.addEventListener("pointercancel", cancel);
    canvas.addEventListener("webglcontextlost", contextLost); canvas.addEventListener("webglcontextrestored", contextRestored);
    return () => {
      disposed = true; observer.disconnect(); if (frame) cancelAnimationFrame(frame);
      controls.removeEventListener("change", render); controls.dispose();
      canvas.removeEventListener("pointerdown", down); canvas.removeEventListener("pointermove", move);
      canvas.removeEventListener("pointerup", up); canvas.removeEventListener("pointercancel", cancel);
      canvas.removeEventListener("webglcontextlost", contextLost); canvas.removeEventListener("webglcontextrestored", contextRestored);
      disposeGroup(content); disposeGroup(selection); disposeGroup(ground, true);
      runtime.textures.brick?.dispose(); runtime.textures.concrete?.dispose();
      renderer.dispose(); renderer.forceContextLoss(); canvas.remove(); runtimeRef.current = null;
    };
  }, [light]);

  useEffect(() => {
    const runtime = runtimeRef.current;
    if (!runtime) return;
    disposeGroup(runtime.content); disposeGroup(runtime.selection);
    runtime.byId = new Map(elements.map(element => [element.id, element]));
    const floors = new Map(project.floors.map(floor => [floor.id, floor]));
    const batches = new Map<string, Batch>();
    for (const element of elements) {
      if (element.planOnly || element.type === "axis" || (element.type === "slab" && !element.foundation && slabMode === "hidden")) continue;
      const materialType = element.type === "wall" && element.structural === false ? "masonry" : element.foundation ? "foundation" : element.type;
      let batch = batches.get(materialType);
      if (!batch) { batch = { positions: [], edges: [], faces: [], segments: [] }; batches.set(materialType, batch); }
      const geometry = nativeGeometry(element);
      if (geometry) {
        const flat = geometry.index ? geometry.toNonIndexed() : geometry;
        const positions = flat.getAttribute("position");
        for (let i = 0; i < positions.count; i++) batch.positions.push(positions.getX(i), positions.getY(i), positions.getZ(i));
        batch.faces.push({ end: batch.positions.length / 9, id: element.id });
        if (element.mesh) {
          const edgeGeometry = sourceMeshEdges(element, geometry), edgePoints = edgeGeometry.getAttribute("position");
          for (let i = 0; i < edgePoints.count; i++) batch.edges.push(edgePoints.getX(i), edgePoints.getY(i), edgePoints.getZ(i));
          batch.segments.push({ end: batch.edges.length / 3, id: element.id });
          edgeGeometry.dispose();
        }
        if (flat !== geometry) flat.dispose(); geometry.dispose();
      }
      if (element.mesh) continue;
      const outlines = rings(element);
      const bottom = element.bottom ?? floors.get(element.floorId)?.elevation;
      if (bottom === undefined || !Number.isFinite(bottom)) continue;
      const levels = geometry && element.top !== undefined ? [bottom, element.top] : [bottom];
      for (const ring of outlines) {
        if (ring.length < 2) continue;
        const closed = polygon(element).length >= 3;
        for (const level of levels) for (let i = 0; i < ring.length - (closed ? 0 : 1); i++) {
          const a = ring[i], b = ring[(i + 1) % ring.length];
          batch.edges.push(a.x, level, -a.y, b.x, level, -b.y);
        }
        if (levels.length === 2) for (const p of ring) batch.edges.push(p.x, levels[0], -p.y, p.x, levels[1], -p.y);
      }
      batch.segments.push({ end: batch.edges.length / 3, id: element.id });
    }
    for (const [type, batch] of batches) {
      if (batch.positions.length) {
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute("position", new THREE.Float32BufferAttribute(batch.positions, 3)); geometry.computeVertexNormals(); geometry.computeBoundingSphere();
        const transparentSlab = type === "slab" && slabMode === "transparent";
        const textured = ["column", "beam", "wall", "foundation", "masonry"].includes(type);
        if (textured) geometry.setAttribute("uv", new THREE.BufferAttribute(surfaceUvs(batch.positions, type === "masonry" ? .64 : .8, type === "masonry" ? .48 : .8), 2));
        const material = new THREE.MeshStandardMaterial({ color: COLORS[type] ?? COLORS.unknown, roughness: .94, metalness: 0, side: transparentSlab ? THREE.FrontSide : THREE.DoubleSide, map: textured ? type === "masonry" ? runtime.textures.brick : runtime.textures.concrete : null, transparent: transparentSlab, opacity: transparentSlab ? .16 : 1, depthWrite: !transparentSlab });
        const mesh = new THREE.Mesh(geometry, material); mesh.userData.spans = batch.faces; mesh.userData.transparentSlab = transparentSlab;
        mesh.renderOrder = transparentSlab ? 2 : 0; runtime.content.add(mesh);
      }
      if (batch.edges.length) {
        const geometry = new THREE.BufferGeometry(); geometry.setAttribute("position", new THREE.Float32BufferAttribute(batch.edges, 3)); geometry.computeBoundingSphere();
        const material = new THREE.LineBasicMaterial({ color: light ? type === "masonry" ? 0x9e6843 : 0x515261 : 0xb2c0d1, transparent: true, opacity: type === "slab" ? .18 : .22 });
        const edges = new THREE.LineSegments(geometry, material); edges.userData.spans = batch.segments; runtime.content.add(edges);
      }
    }
    runtime.renderer.domElement.dataset.nativeMeshCount = String(elements.filter(element => element.mesh?.source === "native-analysis-mesh").length);
    runtime.renderer.domElement.dataset.slabMode = slabMode;
    runtime.renderer.domElement.dataset.masonryCount = String(elements.filter(element => element.type === "wall" && element.structural === false).length);
    runtime.renderer.domElement.dataset.style = "native-materials";
    const previous = fittedContentRef.current;
    if (!previous || previous.project !== project || previous.elements !== elements || previous.light !== light) runtime.fit();
    fittedContentRef.current = { project, elements, light };
    runtime.render();
  }, [project, elements, light, slabMode]);

  useEffect(() => {
    const runtime = runtimeRef.current;
    if (!runtime) return;
    disposeGroup(runtime.ground, true);
    const bounds = new THREE.Box3().setFromObject(runtime.content);
    if (bounds.isEmpty()) return;
    const size = bounds.getSize(new THREE.Vector3()), center = bounds.getCenter(new THREE.Vector3());
    let groundLevel = Infinity;
    for (const floor of project.floors) groundLevel = Math.min(groundLevel, floor.elevation);
    for (const element of project.elements) if (element.foundation && element.bottom !== undefined) groundLevel = Math.min(groundLevel, element.bottom);
    if (!Number.isFinite(groundLevel)) groundLevel = bounds.min.y;
    groundLevel -= .03;
    const gridSize = Math.max(100, Math.ceil(Math.max(size.x, size.z) * 3 / 10) * 10);
    const grid = new THREE.GridHelper(gridSize, gridSize, light ? 0xc6c7df : 0x4b5866, light ? 0xe7e7f2 : 0x293947);
    grid.position.set(Math.round(center.x), groundLevel, Math.round(center.z));
    const gridMaterials = Array.isArray(grid.material) ? grid.material : [grid.material];
    for (const material of gridMaterials) { material.transparent = true; material.opacity = .8; material.depthWrite = false; }
    runtime.ground.add(grid);
    const baseFloor = project.floors.reduce<IdeProject["floors"][number] | undefined>((lowest, floor) => !lowest || floor.elevation < lowest.elevation ? floor : lowest, undefined);
    const lines: number[] = [];
    let axes = 0;
    if (showAxes && baseFloor) for (const element of project.elements) {
      if (element.type !== "axis" || element.floorId !== baseFloor.id || element.points.length !== 2) continue;
      const [a, b] = element.points;
      lines.push(a.x, groundLevel + .01, -a.y, b.x, groundLevel + .01, -b.y);
      for (const point of [a, b]) { const bubble = axisBubble(element.name, point.x, groundLevel + .03, -point.y); if (bubble) runtime.ground.add(bubble); }
      axes++;
    }
    if (lines.length) {
      const geometry = new THREE.BufferGeometry(); geometry.setAttribute("position", new THREE.Float32BufferAttribute(lines, 3));
      const axesLines = new THREE.LineSegments(geometry, new THREE.LineDashedMaterial({ color: light ? 0x737379 : 0x99a5b0, dashSize: .6, gapSize: .15, transparent: true, opacity: .65 }));
      axesLines.computeLineDistances(); runtime.ground.add(axesLines);
    }
    runtime.renderer.domElement.dataset.groundAxisCount = String(axes);
    runtime.render();
  }, [project, elements, light, slabMode, showAxes]);

  useEffect(() => {
    const runtime = runtimeRef.current;
    if (!runtime) return;
    disposeGroup(runtime.selection);
    const element = selectedId ? runtime.byId.get(selectedId) : undefined;
    if (element) {
      const geometry = nativeGeometry(element);
      if (geometry) {
        const material = new THREE.MeshBasicMaterial({ color: 0x1677ed, transparent: true, opacity: 0.55, depthTest: false, side: THREE.DoubleSide });
        const overlay = new THREE.Mesh(geometry, material); overlay.renderOrder = 10; runtime.selection.add(overlay);
        if (element.mesh) {
          const wireframe = new THREE.LineSegments(sourceMeshEdges(element, geometry), new THREE.LineBasicMaterial({ color: 0x0755b4, depthTest: false }));
          wireframe.renderOrder = 11; runtime.selection.add(wireframe);
        }
      } else {
        const elevation = element.bottom ?? project.floors.find(floor => floor.id === element.floorId)?.elevation;
        if (elevation !== undefined) for (const source of rings(element)) {
          const ring = polygon(element).length >= 3 ? [...source, source[0]] : source;
          if (ring.length > 1) {
            const geometry = new THREE.BufferGeometry().setFromPoints(ring.map(p => new THREE.Vector3(p.x, elevation, -p.y)));
            const line = new THREE.Line(geometry, new THREE.LineBasicMaterial({ color: 0x1677ed, depthTest: false })); line.renderOrder = 10; runtime.selection.add(line);
          }
        }
      }
    }
    runtime.render();
  }, [selectedId, elements, project, light]);

  useEffect(() => { runtimeRef.current?.fit(view); }, [view, fitKey, light]);

  return <div ref={hostRef} data-testid="ide-3d-stage" style={{ position: "relative", width: "100%", height: "100%", minHeight: 0, overflow: "hidden" }}>
    {error && <div role="status" style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", padding: 24, background: light ? "#f4f6f8e6" : "#17212ce6", zIndex: 1, textAlign: "center" }}>{error}</div>}
  </div>;
}
