"use client";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
export type CameraView = "perspective" | "front" | "side" | "top";
export type IrregularityScenario = "A1" | "A2" | "A3" | "B1" | "B2" | "B3";
export default function BuildingViewer({ view, resetToken, scenario, playing, speed, showSlabs, onFailure }: { view: CameraView; resetToken: number; scenario: IrregularityScenario; playing: boolean; speed: number; showSlabs: boolean; onFailure: () => void }) {
  const host = useRef<HTMLDivElement>(null);
  const live = useRef({ playing, speed, showSlabs });
  live.current = { playing, speed, showSlabs };
  const cameraController = useRef<(v: CameraView) => void>(() => {});
  const onFailureRef = useRef(onFailure);
  onFailureRef.current = onFailure;
  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#0b1726");
    const camera = new THREE.PerspectiveCamera(42, 1, .1, 140);
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const materials = [
      new THREE.MeshStandardMaterial({ color: "#81afc6", roughness: .73 }),
      new THREE.MeshStandardMaterial({ color: "#537b9c", roughness: .76 }),
      new THREE.MeshStandardMaterial({ color: "#bbd7e8", transparent: true, opacity: .22, depthWrite: false }),
      new THREE.MeshStandardMaterial({ color: "#f4a76a", roughness: .7 }),
      new THREE.MeshStandardMaterial({ color: "#f16f68", roughness: .68 }),
    ];
    const group = new THREE.Group();
    scene.add(group);
    const floors = Array.from({ length: 5 }, () => new THREE.Group());
    floors.forEach(floor => group.add(floor));
    let activeFloor = -1;
    const slabs: THREE.Mesh[] = [];
    const add = (x: number, y: number, z: number, w: number, h: number, d: number, material: number) => {
      const part = new THREE.Mesh(geometry, materials[material]);
      part.position.set(x, y, z);
      part.scale.set(w, h, d);
      (activeFloor < 0 ? group : floors[activeFloor]).add(part);
      if (material === 2) slabs.push(part);
    };
    // Distinct *illustrative* static geometry for each TBDY irregularity.
    // No color or deformation here is a calculated structural response.
    const offset = scenario === "A3" ? 1.8 : 0;
    add(offset / 2, -.25, 0, 8 + offset, .5, 8, 1);
    for (let floor = 0; floor < 5; floor++) {
      const y = floor * 1.6;
      activeFloor = floor;
      for (const x of [-3.3, 0, 3.3]) for (const z of [-3.3, 0, 3.3]) {
        // B3: one lower-level column terminates; show a highlighted transfer beam.
        if (scenario === "B3" && floor === 0 && x === 3.3 && z === 3.3) continue;
        // B1: red identifies an illustrative reduced-strength storey, NOT calculated capacity.
        const material = scenario === "B1" && floor === 0 ? 4 : 0;
        add(x, y + .8, z, .25, 1.6, .25, material);
      }
      for (const x of [-3.3, 0, 3.3]) add(x, y + 1.55, 0, .22, .26, 6.8, scenario === "B3" && floor === 0 && x === 3.3 ? 3 : 1);
      for (const z of [-3.3, 0, 3.3]) add(0, y + 1.55, z, 6.8, .26, .22, scenario === "B3" && floor === 0 && z === 3.3 ? 3 : 1);
      if (scenario === "A2") {
        // Four slab strips surround a visible opening near the center.
        add(-2.25, y + 1.61, 0, 2.3, .12, 6.8, 2);
        add(2.25, y + 1.61, 0, 2.3, .12, 6.8, 2);
        add(0, y + 1.61, -2.25, 2.2, .12, 2.3, 2);
        add(0, y + 1.61, 2.25, 2.2, .12, 2.3, 2);
        if (floor === 2) add(0, y + 1.61, -1.1, 2.2, .14, .2, 4);
      } else {
        add(0, y + 1.61, 0, 6.8, .12, 6.8, 2);
      }
      if (scenario === "A3") {
        // A coherent projecting bay gives a clear re-entrant plan corner.
        add(4.25, y + .8, -3.3, .25, 1.6, .25, 0);
        add(4.25, y + .8, 0, .25, 1.6, .25, 0);
        add(4.25, y + 1.61, -1.65, 1.9, .12, 3.4, 2);
        add(3.8, y + 1.55, -3.3, 1.5, .26, .22, 1);
        add(3.8, y + 1.55, 0, 1.5, .26, .22, 1);
        if (floor === 2) add(3.3, y + 1.61, 0, .28, .14, .8, 4);
      }
      if (scenario === "B2" && floor === 0) {
        // Emphasize the open ground-storey mechanism, not computed drift.
        for (const x of [-3.3, 3.3]) add(x, y + .75, -3.1, .35, 1.45, .13, 3);
      }
    }
    activeFloor = -1;
    if (scenario === "A1") {
      // Eccentric wall denotes stiffness asymmetry; torsional motion comes later.
      add(-2.7, 4, 0, .22, 8, 2.5, 3);
    } else if (scenario === "B3") {
      add(3.3, 2.5, 3.3, .25, 1.6, .25, 4);
    } else if (scenario !== "B2" && scenario !== "B1") {
      add(0, 4, 0, .23, 8, 1.5, 3);
    }
    scene.add(new THREE.AmbientLight("#d7ecff", 1.55));
    const light = new THREE.DirectionalLight("#ffffff", 3);
    light.position.set(8, 16, 10);
    scene.add(light);
    const grid = new THREE.GridHelper(24, 24, "#35536e", "#22374b");
    grid.position.y = -.55;
    scene.add(grid);
    let renderer: THREE.WebGLRenderer | undefined;
    let controls: OrbitControls | undefined;
    let observer: ResizeObserver | undefined;
    let frame = 0;
    let stopped = false;
    let elapsed = 0;
    let previous = 0;
    let dirty = true;
    let contextLost = false;
    let motionBlend = 0;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const target = new THREE.Vector3(0, 4, 0);
    const applyView = (v: CameraView) => {
      dirty = true;
      const positions: Record<CameraView, [number, number, number]> = { perspective: [15, 14, 18], front: [0, 5, 23], side: [23, 5, 0], top: [.01, 24, 0] };
      camera.position.set(...positions[v]);
      controls?.target.copy(target);
      camera.lookAt(target);
      controls?.update();
    };
    const lost = (event: Event) => { event.preventDefault(); contextLost = true; onFailureRef.current(); };
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
      renderer.domElement.style.cssText = "width:100%;height:100%;touch-action:none";
      el.appendChild(renderer.domElement);
      renderer.domElement.addEventListener("webglcontextlost", lost);
      controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = .085;
      controls.rotateSpeed = .5;
      controls.zoomSpeed = .65;
      controls.panSpeed = .65;
      controls.minDistance = 9;
      controls.maxDistance = 42;
      controls.addEventListener('change', () => { dirty = true; });
      const resize = () => {
        if (!renderer || !el || stopped) return;
        const w = Math.max(1, el.clientWidth), h = Math.max(1, el.clientHeight);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h, false);
        if (!contextLost) renderer.render(scene, camera);
      };
      observer = new ResizeObserver(resize);
      observer.observe(el);
      cameraController.current = applyView;
      applyView("perspective");
      const tick = (now: number) => {
        if (stopped) return;
        const dt = previous ? Math.min((now - previous) / 1000, .05) : 0;
        previous = now;
        const active = live.current.playing && !document.hidden && !reducedMotion;
        if (active) elapsed += dt * live.current.speed;
        motionBlend += ((active ? 1 : 0) - motionBlend) * Math.min(1, dt * 5);
        const wave = Math.sin(elapsed * 3.1) * motionBlend;
        floors.forEach((floor, i) => {
          const h = (i + 1) / 5;
          const amplitude = scenario === "B2" ? (i === 0 ? .13 : .36) : .16 * h;
          floor.position.x = wave * amplitude;
          floor.position.z = Math.cos(elapsed * 2.4) * .06 * h * motionBlend;
          floor.rotation.y = scenario === "A1" ? wave * h * .045 : 0;
        });
        let layerChanged = false;
        slabs.forEach(slab => {
          if (slab.visible !== live.current.showSlabs) {
            slab.visible = live.current.showSlabs;
            layerChanged = true;
          }
        });
        const cameraChanged = controls?.update() ?? false;
        if (!contextLost && (active || motionBlend > .002 || dirty || layerChanged || cameraChanged)) renderer?.render(scene, camera);
        dirty = false;
        frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    } catch {
      onFailureRef.current();
    }
    return () => {
      stopped = true;
      cameraController.current = () => {};
      cancelAnimationFrame(frame);
      observer?.disconnect();
      controls?.dispose();
      if (renderer) {
        renderer.domElement.removeEventListener("webglcontextlost", lost);
        renderer.domElement.remove();
        renderer.dispose();
      }
      geometry.dispose();
      materials.forEach(m => m.dispose());
      grid.geometry.dispose();
      if (Array.isArray(grid.material)) grid.material.forEach(m => m.dispose());
      else grid.material.dispose();
    };
  }, [scenario]);
  useEffect(() => { cameraController.current(view); }, [view]);
  useEffect(() => { if (resetToken > 0) cameraController.current("perspective"); }, [resetToken]);
  return <div ref={host} data-testid="irregularity-three-canvas" className="h-full w-full touch-none" />;
}
