"use client";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
export type CameraView = "perspective" | "front" | "side" | "top";
export default function BuildingViewer({ view, resetToken, onFailure }: { view: CameraView; resetToken: number; onFailure: () => void }) {
  const host = useRef<HTMLDivElement>(null);
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
    ];
    const group = new THREE.Group();
    scene.add(group);
    const add = (x: number, y: number, z: number, w: number, h: number, d: number, material: number) => {
      const part = new THREE.Mesh(geometry, materials[material]);
      part.position.set(x, y, z);
      part.scale.set(w, h, d);
      group.add(part);
    };
    add(0, -.25, 0, 8, .5, 8, 1);
    for (let floor = 0; floor < 5; floor++) {
      const y = floor * 1.6;
      for (const x of [-3.3, 0, 3.3]) for (const z of [-3.3, 0, 3.3]) add(x, y + .8, z, .25, 1.6, .25, 0);
      for (const x of [-3.3, 0, 3.3]) add(x, y + 1.55, 0, .22, .26, 6.8, 1);
      for (const z of [-3.3, 0, 3.3]) add(0, y + 1.55, z, 6.8, .26, .22, 1);
      add(0, y + 1.61, 0, 6.8, .12, 6.8, 2);
    }
    add(0, 4, 0, .23, 8, 1.5, 3);
    scene.add(new THREE.HemisphereLight("#d7ecff", "#172130", 2));
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
    const target = new THREE.Vector3(0, 4, 0);
    const applyView = (v: CameraView) => {
      const positions: Record<CameraView, [number, number, number]> = { perspective: [15, 14, 18], front: [0, 5, 23], side: [23, 5, 0], top: [.01, 24, 0] };
      camera.position.set(...positions[v]);
      camera.up.set(0, 1, 0);
      controls?.target.copy(target);
      camera.lookAt(target);
      controls?.update();
    };
    const lost = (event: Event) => { event.preventDefault(); onFailureRef.current(); };
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
      const resize = () => {
        if (!renderer || !el || stopped) return;
        const w = Math.max(1, el.clientWidth), h = Math.max(1, el.clientHeight);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h, false);
        renderer.render(scene, camera);
      };
      observer = new ResizeObserver(resize);
      observer.observe(el);
      cameraController.current = applyView;
      applyView("perspective");
      const tick = () => {
        if (stopped) return;
        controls?.update();
        renderer?.render(scene, camera);
        frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    } catch {
      onFailureRef.current();
    }
    return () => {
      stopped = true;
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
      grid.dispose();
    };
  }, []);
  useEffect(() => { cameraController.current(view); }, [view]);
  useEffect(() => { if (resetToken > 0) cameraController.current("perspective"); }, [resetToken]);
  return <div ref={host} data-testid="irregularity-three-canvas" className="h-full w-full touch-none" />;
}
