// ============================================================================
// DWG/DXF MOTOR V2 — THREE.JS 0.172.0 CAD WEBGL2 RENDERER
// ============================================================================
// Sözleşme: motor_v2/29_RENDER_VE_YASAM_DONGUSU.md
// Kamera-bağıl Float64->Float32 offset, tek kirli frame (dirty-frame) RAF planlayıcısı,
// tam bellek ve GPU kaynak temizliği.

import * as THREE from "three";
import type { CadBBox2D, CadPoint2D } from "../canonical/types";
import { D3CameraAdapter, type CadCameraState } from "../interaction/d3-camera-adapter";
import type { UnpackedSceneChunk } from "../../../workers/cad-v2/cad-v2-scene-worker";

export interface CadV2RendererOptions {
  canvas: HTMLCanvasElement;
  inputOverlay: HTMLElement;
  initialBBox: CadBBox2D;
  onCameraChange?: (state: CadCameraState) => void;
  onPanToolChange?: (active: boolean) => void;
  backgroundColor?: number;
}

export class CadV2Renderer {
  private canvas: HTMLCanvasElement;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.OrthographicCamera;
  private cameraAdapter: D3CameraAdapter;

  private isDirty = false;
  private rafId: number | null = null;
  private isDisposed = false;
  private disposedResources: Array<{ dispose: () => void }> = [];

  // Geometri kök grubu (kamera-bağıl ofset için)
  private contentGroup: THREE.Group;
  private defaultWorldOrigin: CadPoint2D;
  private layerVisibility = new Map<string, boolean>();
  private isMonochrome = false;
  private isLineweight = false;
  private backgroundColorHex: number;
  private activeFitBBox: CadBBox2D | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private boundContextLost: (e: Event) => void;
  private boundContextRestored: (e: Event) => void;
  private contextRecoveryTimer: any = null;
  private loadedChunks = new Map<
    string,
    {
      origin: [number, number];
      group: THREE.Group;
      geometry?: THREE.BufferGeometry;
      material?: THREE.Material;
    }
  >();

  constructor(options: CadV2RendererOptions) {
    this.canvas = options.canvas;
    this.backgroundColorHex = options.backgroundColor ?? 0x121212;

    const [minX, minY, maxX, maxY] = options.initialBBox;
    this.defaultWorldOrigin = [(minX + maxX) / 2, (minY + maxY) / 2];

    const width = Math.max(10, this.canvas.clientWidth || 800);
    const height = Math.max(10, this.canvas.clientHeight || 600);

    // 1. WebGLRenderer başlat
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: false,
      premultipliedAlpha: true,
      preserveDrawingBuffer: false,
      stencil: true,
      depth: false,
      powerPreference: "default",
    });

    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setSize(width, height, false);
    this.renderer.sortObjects = false; // Painter's order korunur
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    (this.renderer as any).toneMapping = (THREE as any).NoToneMapping;
    this.renderer.setClearColor(this.backgroundColorHex, 1);

    // 2. Sahne ve Kamera
    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(-width / 2, width / 2, height / 2, -height / 2, 0.1, 10);
    this.camera.position.set(0, 0, 1);
    this.camera.lookAt(0, 0, 0);

    this.contentGroup = new THREE.Group();
    this.scene.add(this.contentGroup);

    // 3. d3-zoom kamera adaptörü
    this.cameraAdapter = new D3CameraAdapter({
      inputElement: options.inputOverlay,
      initialBBox: options.initialBBox,
      threeCamera: this.camera,
      onCameraChange: (camState) => {
        this.updateCameraRelativeOffset(camState.center);
        if (options.onCameraChange) options.onCameraChange(camState);
      },
      onPanToolChange: options.onPanToolChange,
      onInvalidate: () => this.invalidate(),
    });

    // 4. ResizeObserver ile duyarlı kanvas boyutu izleme
    if (typeof ResizeObserver !== "undefined" && this.canvas.parentElement) {
      this.resizeObserver = new ResizeObserver((entries) => {
        if (this.isDisposed || !entries[0]) return;
        const { width: w, height: h } = entries[0].contentRect;
        if (w > 0 && h > 0) {
          this.resize(w, h);
        }
      });
      this.resizeObserver.observe(this.canvas.parentElement);
    }

    // 5. WebGL Context Loss & Recovery yönetimi (15s timeout)
    this.boundContextLost = (e: Event) => {
      e.preventDefault();
      console.warn("[CadRenderer] WebGL context kaybedildi!");
      if (this.rafId !== null) {
        cancelAnimationFrame(this.rafId);
        this.rafId = null;
      }
      this.contextRecoveryTimer = setTimeout(() => {
        console.error("[CadRenderer] WebGL context 15s içinde kurtarılamadı!");
      }, 15_000);
    };

    this.boundContextRestored = () => {
      console.log("[CadRenderer] WebGL context geri yüklendi!");
      if (this.contextRecoveryTimer) {
        clearTimeout(this.contextRecoveryTimer);
        this.contextRecoveryTimer = null;
      }
      this.invalidate();
    };

    this.canvas.addEventListener("webglcontextlost", this.boundContextLost, false);
    this.canvas.addEventListener("webglcontextrestored", this.boundContextRestored, false);

    // İlk çizimi planla
    this.invalidate();
  }

  /**
   * Kirli frame planlayıcısı: birden fazla event gelse bile tek RAF çalışır
   */
  public invalidate(): void {
    if (this.isDisposed) return;
    this.isDirty = true;
    if (this.rafId === null) {
      this.rafId = requestAnimationFrame(this.renderFrame.bind(this));
    }
  }

  private renderFrame(): void {
    this.rafId = null;
    if (this.isDisposed || !this.isDirty) return;

    this.isDirty = false;
    this.renderer.render(this.scene, this.camera);
  }

  /**
   * Kamera-bağıl Float64->Float32 ofsetleme:
   * Dünya koordinatları merkezden çıkarılarak küçük yerel koordinat uzayında çizilir.
   */
  private updateCameraRelativeOffset(cameraCenter: CadPoint2D): void {
    const camOrigin = this.cameraAdapter ? this.cameraAdapter.getState().worldOrigin : this.defaultWorldOrigin;
    // contentGroup konumu: kamera merkezine göre ters yönde ötelenir
    const dx = -(cameraCenter[0] - camOrigin[0]);
    const dy = -(cameraCenter[1] - camOrigin[1]);
    this.contentGroup.position.set(dx, dy, 0);

    // Her parça (chunk) kendi Float64 orijini ile kamera merkezi arasındaki küçük fark ile ötelenir
    for (const chunk of Array.from(this.loadedChunks.values())) {
      chunk.group.position.set(chunk.origin[0] - cameraCenter[0], chunk.origin[1] - cameraCenter[1], 0);
    }
  }

  /**
   * İkili DV2SCN01 parçasını sahneye ekler ve çizer
   */
  public addSceneChunk(chunk: UnpackedSceneChunk): void {
    if (this.loadedChunks.has(chunk.chunkId)) {
      this.removeSceneChunk(chunk.chunkId);
    }

    const count = chunk.xyArray.length / 2;
    if (count === 0) return;

    const chunkGroup = new THREE.Group();
    const cameraCenter = this.cameraAdapter.getState().center;
    chunkGroup.position.set(chunk.origin[0] - cameraCenter[0], chunk.origin[1] - cameraCenter[1], 0);

    const layerRuns: Array<{
      layer: string;
      color: [number, number, number];
      firstVertex: number;
      vertexCount: number;
    }> = chunk.meta?.layerRuns || [];

    if (layerRuns.length > 0) {
      // (layer, color) çiftine göre gruplayarak 26,000 draw call ve geometry yerine ~1,000 draw call'a düşür
      const groups = new Map<
        string,
        {
          layer: string;
          color: [number, number, number];
          totalVertices: number;
          runs: Array<{ firstVertex: number; vertexCount: number }>;
        }
      >();

      for (const run of layerRuns) {
        const key = `${run.layer}||${run.color[0].toFixed(3)},${run.color[1].toFixed(3)},${run.color[2].toFixed(3)}`;
        let g = groups.get(key);
        if (!g) {
          g = {
            layer: run.layer,
            color: run.color,
            totalVertices: 0,
            runs: [],
          };
          groups.set(key, g);
        }
        g.totalVertices += run.vertexCount;
        g.runs.push(run);
      }

      const isLight = this.isLightBackground();
      const xy = chunk.xyArray;

      for (const group of Array.from(groups.values())) {
        if (group.totalVertices === 0) continue;

        const groupPos = new Float32Array(group.totalVertices * 3);
        let offset = 0;

        for (const r of group.runs) {
          const start = r.firstVertex * 2;
          const end = (r.firstVertex + r.vertexCount) * 2;
          for (let i = start; i < end; i += 2) {
            groupPos[offset++] = xy[i];
            groupPos[offset++] = xy[i + 1];
            groupPos[offset++] = 0;
          }
        }

        let r = group.color[0] ?? 0.9;
        let g = group.color[1] ?? 0.9;
        let b = group.color[2] ?? 0.9;

        // ACI 7 / Beyaz Çizgi Kuralı: Açık arka planda saf beyaz çizgiler siyah/koyu mürekkeple çizilir
        if (isLight && !this.isMonochrome && r > 0.88 && g > 0.88 && b > 0.88) {
          r = 0.08;
          g = 0.08;
          b = 0.08;
        }

        if (this.isMonochrome) {
          r = isLight ? 0.08 : 0.95;
          g = isLight ? 0.08 : 0.95;
          b = isLight ? 0.08 : 0.95;
        }

        const subGeom = new THREE.BufferGeometry();
        subGeom.setAttribute("position", new THREE.BufferAttribute(groupPos, 3));

        const subMat = new THREE.LineBasicMaterial({
          color: new THREE.Color(r, g, b),
          transparent: true,
          opacity: 1,
          depthTest: false,
          depthWrite: false,
        });
        (subMat as any).userData = {
          originalColor: [group.color[0] ?? 0.9, group.color[1] ?? 0.9, group.color[2] ?? 0.9],
        };

        const subLines = new THREE.LineSegments(subGeom, subMat);
        (subLines as any).frustumCulled = false; // 18M+ vertex için CPU bounding sphere hesaplamasını atla
        subLines.name = group.layer;
        subLines.visible = this.layerVisibility.get(group.layer) ?? true;
        chunkGroup.add(subLines);
      }
    } else {
      // 2D Float32 (x, y) -> 3D Float32 (x, y, 0) koordinat dizisi
      const pos3D = new Float32Array(count * 3);
      for (let i = 0; i < count; i++) {
        pos3D[i * 3] = chunk.xyArray[i * 2];
        pos3D[i * 3 + 1] = chunk.xyArray[i * 2 + 1];
        pos3D[i * 3 + 2] = 0;
      }

      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute("position", new THREE.BufferAttribute(pos3D, 3));

      const material = new THREE.LineBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 1,
        depthTest: false,
        depthWrite: false,
      });
      (material as any).userData = { originalColor: [1, 1, 1] };

      const lineSegments = new THREE.LineSegments(geometry, material);
      (lineSegments as any).frustumCulled = false;
      lineSegments.name = "0";
      chunkGroup.add(lineSegments);
    }

    this.scene.add(chunkGroup);

    this.loadedChunks.set(chunk.chunkId, {
      origin: chunk.origin,
      group: chunkGroup,
    });

    this.invalidate();
  }

  public removeSceneChunk(chunkId: string): void {
    const item = this.loadedChunks.get(chunkId);
    if (!item) return;

    this.scene.remove(item.group);
    for (const child of item.group.children) {
      if (child instanceof THREE.LineSegments) {
        child.geometry.dispose();
        (child.material as THREE.Material).dispose();
      }
    }
    this.loadedChunks.delete(chunkId);
    this.invalidate();
  }

  public clearChunks(): void {
    for (const chunkId of Array.from(this.loadedChunks.keys())) {
      this.removeSceneChunk(chunkId);
    }
  }

  /**
   * Sahneye 2D retained çizgi listesi ekler
   */
  public addLines(
    segments: Array<{ start: [number, number]; end: [number, number]; color?: number; layer?: string }>
  ): void {
    const positions: number[] = [];
    const colors: number[] = [];
    const camOrigin = this.cameraAdapter ? this.cameraAdapter.getState().worldOrigin : this.defaultWorldOrigin;

    for (const seg of segments) {
      // Koordinatları dünya orijinine göre rölatif hesapla
      const x0 = seg.start[0] - camOrigin[0];
      const y0 = seg.start[1] - camOrigin[1];
      const x1 = seg.end[0] - camOrigin[0];
      const y1 = seg.end[1] - camOrigin[1];

      positions.push(x0, y0, 0, x1, y1, 0);

      const c = new THREE.Color(seg.color ?? 0xffffff);
      colors.push(c.r, c.g, c.b, c.r, c.g, c.b);
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));

    const material = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 1,
      depthTest: false,
      depthWrite: false,
    });

    const lineSegments = new THREE.LineSegments(geometry, material);
    this.contentGroup.add(lineSegments);

    this.disposedResources.push(geometry, material);
    this.invalidate();
  }

  /**
   * Katman görünürlüğünü dinamik olarak aç/kapat (Katman Paneli)
   */
  public setLayerVisibility(layerId: string, visible: boolean): void {
    this.layerVisibility.set(layerId, visible);
    for (const chunk of Array.from(this.loadedChunks.values())) {
      for (const child of chunk.group.children) {
        if (child.name === layerId) {
          child.visible = visible;
        }
      }
    }
    this.invalidate();
  }

  public isLightBackground(): boolean {
    return this.backgroundColorHex === 0xf4f4f5 || this.backgroundColorHex > 0x888888;
  }

  public setPanToolActive(active: boolean): void {
    this.cameraAdapter.setPanToolActive(active);
  }

  /**
   * Monokrom (tek renk) modunu aç/kapat
   */
  public setMonochrome(enabled: boolean): void {
    this.isMonochrome = enabled;
    const isLight = this.isLightBackground();
    const monoHex = isLight ? 0x111111 : 0xffffff;

    for (const chunk of Array.from(this.loadedChunks.values())) {
      for (const child of chunk.group.children) {
        if (child instanceof THREE.LineSegments && child.material instanceof THREE.LineBasicMaterial) {
          if (enabled) {
            child.material.color.setHex(monoHex);
          } else {
            const orig = (child.material as any).userData?.originalColor || [0.9, 0.9, 0.9];
            let [r, g, b] = orig;
            if (isLight && r > 0.88 && g > 0.88 && b > 0.88) {
              r = 0.08;
              g = 0.08;
              b = 0.08;
            }
            child.material.color.r = r;
            child.material.color.g = g;
            child.material.color.b = b;
          }
          child.material.needsUpdate = true;
        }
      }
    }
    this.invalidate();
  }

  /**
   * Çizgi kalınlığı modunu aç/kapat
   */
  public setLineweight(enabled: boolean): void {
    this.isLineweight = enabled;
    this.invalidate();
  }

  /**
   * Gerçek çizim sınırlarını saklar
   */
  public setFitBBox(bbox: CadBBox2D): void {
    this.activeFitBBox = bbox;
    this.cameraAdapter.setFitBBox(bbox);
  }

  /**
   * Çizimi sığdır
   */
  public fit(bbox?: CadBBox2D): void {
    const target = bbox || this.activeFitBBox || [-500, -500, 500, 500];
    this.cameraAdapter.fit(target);
  }

  public zoomIn(): void {
    this.cameraAdapter.zoomIn();
  }

  public zoomOut(): void {
    this.cameraAdapter.zoomOut();
  }

  public setBackgroundColor(colorHex: number): void {
    const wasLight = this.isLightBackground();
    this.backgroundColorHex = colorHex;
    this.renderer.setClearColor(colorHex, 1);
    const isLight = this.isLightBackground();

    if (wasLight !== isLight || this.isMonochrome) {
      const monoHex = isLight ? 0x111111 : 0xffffff;
      for (const chunk of Array.from(this.loadedChunks.values())) {
        for (const child of chunk.group.children) {
          if (child instanceof THREE.LineSegments && child.material instanceof THREE.LineBasicMaterial) {
            if (this.isMonochrome) {
              child.material.color.setHex(monoHex);
            } else {
              const orig = (child.material as any).userData?.originalColor || [0.9, 0.9, 0.9];
              let [r, g, b] = orig;
              if (isLight && r > 0.88 && g > 0.88 && b > 0.88) {
                r = 0.08;
                g = 0.08;
                b = 0.08;
              }
              child.material.color.r = r;
              child.material.color.g = g;
              child.material.color.b = b;
            }
            child.material.needsUpdate = true;
          }
        }
      }
    }
    this.invalidate();
  }

  public resize(width: number, height: number): void {
    if (this.isDisposed || width <= 0 || height <= 0) return;
    this.renderer.setSize(width, height, false);
    this.cameraAdapter.resize(width, height);
    this.invalidate();
  }

  public getCameraAdapter(): D3CameraAdapter {
    return this.cameraAdapter;
  }

  /**
   * Yaşam döngüsü temizliği: tüm GPU kaynaklarını ve listener'ları serbest bırak
   */
  public dispose(): void {
    if (this.isDisposed) return;
    this.isDisposed = true;

    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }

    this.cameraAdapter.dispose();
    this.clearChunks();

    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }

    if (this.canvas) {
      this.canvas.removeEventListener("webglcontextlost", this.boundContextLost);
      this.canvas.removeEventListener("webglcontextrestored", this.boundContextRestored);
    }

    if (this.contextRecoveryTimer) {
      clearTimeout(this.contextRecoveryTimer);
      this.contextRecoveryTimer = null;
    }

    // Sahnedeki tüm mesh ve materyalleri temizle
    for (const res of this.disposedResources) {
      try {
        res.dispose();
      } catch (err) {
        console.warn("[CadRenderer] Kaynak temizleme hatası:", err);
      }
    }
    this.disposedResources = [];

    this.scene.clear();
    this.renderer.dispose();
  }
}
