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
import { createLineStrokeQuad } from "./cad-stroke";
import { resolveDrawCommandRenderOrder } from "./render-order";
import { isChunkVisibleInCamera } from "./chunk-visibility";

export interface CadV2RendererOptions {
  canvas: HTMLCanvasElement;
  inputOverlay: HTMLElement;
  initialBBox: CadBBox2D;
  onCameraChange?: (state: CadCameraState) => void;
  onPanToolChange?: (active: boolean) => void;
  backgroundColor?: number;
}

function createThreeColor(r: number, g: number, b: number): THREE.Color {
  const c = new THREE.Color();
  (c as any).setRGB(r, g, b, (THREE as any).SRGBColorSpace);
  return c;
}

function applyThreeColor(color: THREE.Color, r: number, g: number, b: number): void {
  (color as any).setRGB(r, g, b, (THREE as any).SRGBColorSpace);
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
  private activeLayoutId = "Model";
  private chunkBounds = new Map<string, CadBBox2D>();
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
    this.renderer.sortObjects = true; // Painter's order korunur (renderOrder sıralaması)
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
        this.updateChunkVisibility(camState);
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
    const dx = -(cameraCenter[0] - camOrigin[0]);
    const dy = -(cameraCenter[1] - camOrigin[1]);
    this.contentGroup.position.set(dx, dy, 0);

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

    const lineCount = chunk.xyArray ? chunk.xyArray.length / 2 : 0;
    const triCount = chunk.trianglesArray ? chunk.trianglesArray.length / 2 : 0;
    if (lineCount === 0 && triCount === 0) return;

    const chunkGroup = new THREE.Group();
    const layoutId = chunk.meta?.layoutId || "Model";
    chunkGroup.userData.layoutId = layoutId;
    const cameraCenter = this.cameraAdapter.getState().center;
    chunkGroup.visible = layoutId === this.activeLayoutId && isChunkVisibleInCamera(
      this.chunkBounds.get(chunk.chunkId),
      this.cameraAdapter.getState()
    );

    chunkGroup.position.set(chunk.origin[0] - cameraCenter[0], chunk.origin[1] - cameraCenter[1], 0);

    // Parça taban renderOrder hesabı (ağ geliş sırasından bağımsız kararlı çizim)
    const chunkIdx = parseInt(chunk.chunkId.replace(/\D+/g, "") || "0", 10);
    const baseOrder = chunkIdx * 10000;

    const isLight = this.isLightBackground();
    const drawCommands: Array<{
      kind: "line" | "triangle" | "wipeout";
      layer: string;
      color: [number, number, number];
      firstVertex: number;
      vertexCount: number;
      order?: number;
      globalOrderIndex?: number;
      alpha?: number;
      isAci7?: boolean;
      lineweightMm?: number;
      dashStyle?: { dashSize: number; gapSize: number };
    }> = chunk.meta?.drawCommands || [];

    if (drawCommands.length > 0) {
      // 1. Birleşik drawCommands: Yalnız bitişik, aynı (kind, layer, color, lineweight) olan komutları birleştir
      const mergedCommands: Array<{
        kind: "line" | "triangle" | "wipeout";
        layer: string;
        color: [number, number, number];
        alpha: number;
        lineweightMm: number;
        renderOrder: number;
        totalVertices: number;
        runs: Array<{ firstVertex: number; vertexCount: number }>;
        dashStyle?: { dashSize: number; gapSize: number };
      }> = [];

      for (const cmd of drawCommands) {
        const last = mergedCommands[mergedCommands.length - 1];
        const cmdLw = cmd.lineweightMm ?? 0;
        const commandRenderOrder = resolveDrawCommandRenderOrder(
          cmd.globalOrderIndex,
          baseOrder + mergedCommands.length,
        );
        if (
          last &&
          last.kind === cmd.kind &&
          last.layer === cmd.layer &&
          Math.abs(last.lineweightMm - cmdLw) < 1e-4 &&
          Math.abs(last.color[0] - cmd.color[0]) < 1e-4 &&
          Math.abs(last.color[1] - cmd.color[1]) < 1e-4 &&
          Math.abs(last.color[2] - cmd.color[2]) < 1e-4 &&
          last.dashStyle?.dashSize === cmd.dashStyle?.dashSize &&
          last.dashStyle?.gapSize === cmd.dashStyle?.gapSize &&
          cmd.kind !== "wipeout" // Wipeout maskeleri ayrık tutulur
        ) {
          last.totalVertices += cmd.vertexCount;
          last.runs.push({ firstVertex: cmd.firstVertex, vertexCount: cmd.vertexCount });
        } else {
          mergedCommands.push({
            kind: cmd.kind,
            layer: cmd.layer,
            color: cmd.color,
            alpha: cmd.alpha ?? 1,
            lineweightMm: cmdLw,
            renderOrder: commandRenderOrder,
            totalVertices: cmd.vertexCount,
            runs: [{ firstVertex: cmd.firstVertex, vertexCount: cmd.vertexCount }],
            ...(cmd.dashStyle ? { dashStyle: cmd.dashStyle } : {}),
          });
        }
      }

      for (let cmdIdx = 0; cmdIdx < mergedCommands.length; cmdIdx++) {
        const cmd = mergedCommands[cmdIdx];
        if (cmd.totalVertices === 0) continue;

        let r = cmd.color[0] ?? 0.9;
        let g = cmd.color[1] ?? 0.9;
        let b = cmd.color[2] ?? 0.9;
        const isAci7 = (cmd as any).isAci7 === true;

        if (cmd.kind === "line") {
          const xy = chunk.xyArray;
          const pos = new Float32Array(cmd.totalVertices * 3);
          const lineDistances = cmd.dashStyle ? new Float32Array(cmd.totalVertices) : null;
          if (lineDistances && (!chunk.pathDistancesArray || chunk.pathDistancesArray.length < xy.length / 2)) {
            throw new Error(`DASHED draw command in chunk ${chunk.chunkId} requires aligned PATH_DISTANCE values`);
          }
          let offset = 0;
          let pathOffset = 0;
          for (const rDef of cmd.runs) {
            const start = rDef.firstVertex * 2;
            const end = (rDef.firstVertex + rDef.vertexCount) * 2;
            for (let i = start; i < end; i += 2) {
              pos[offset++] = xy[i];
              pos[offset++] = xy[i + 1];
              pos[offset++] = 0;
              if (lineDistances) lineDistances[pathOffset++] = chunk.pathDistancesArray![i / 2]!;
            }
          }

          if (isLight && !this.isMonochrome && isAci7) {
            r = 0.08; g = 0.08; b = 0.08;
          }
          if (this.isMonochrome) {
            r = isLight ? 0.08 : 0.95;
            b = isLight ? 0.08 : 0.95;
            g = isLight ? 0.08 : 0.95;
          }

          const geom = new THREE.BufferGeometry();
          geom.setAttribute("position", new THREE.BufferAttribute(pos, 3));
          if (lineDistances) geom.setAttribute("lineDistance", new THREE.BufferAttribute(lineDistances, 1));
          const matColor = createThreeColor(r, g, b);
          const materialOptions = {
            color: matColor,
            transparent: cmd.alpha !== undefined && cmd.alpha < 1,
            opacity: cmd.alpha ?? 1,
            depthTest: false,
            depthWrite: false,
          };
          const mat = cmd.dashStyle
            ? new THREE.LineDashedMaterial({
                ...materialOptions,
                dashSize: cmd.dashStyle.dashSize,
                gapSize: cmd.dashStyle.gapSize,
                scale: 1,
              })
            : new THREE.LineBasicMaterial(materialOptions);
          (mat as any).userData = {
            originalColor: [cmd.color[0], cmd.color[1], cmd.color[2]],
            isAci7,
            alpha: cmd.alpha ?? 1,
          };

          const lines = new THREE.LineSegments(geom, mat);
          (lines as any).frustumCulled = false;
          lines.name = cmd.layer;
          lines.renderOrder = cmd.renderOrder;
          const layerVis = this.layerVisibility.get(cmd.layer) ?? true;
          lines.visible = layerVis;
          (lines as any).userData = {
            isLineCenterline: true,
            lineweightMm: cmd.lineweightMm,
            layer: cmd.layer,
          };
          chunkGroup.add(lines);

          // Lineweight kalın çizgi quad meşhi (lineweightMm > 0.001 mm ve hairline değilse)
          if (cmd.lineweightMm > 1e-4) {
            const quadVerts: number[] = [];
            const strokeW = cmd.lineweightMm;
            for (let i = 0; i < pos.length; i += 6) {
              const p0: [number, number] = [pos[i], pos[i + 1]];
              const p1: [number, number] = [pos[i + 3], pos[i + 4]];
              const q = createLineStrokeQuad(p0, p1, strokeW);
              if (q) {
                for (let k = 0; k < q.length; k += 2) {
                  quadVerts.push(q[k], q[k + 1], 0);
                }
              }
            }
            if (quadVerts.length > 0) {
              const thickGeom = new THREE.BufferGeometry();
              thickGeom.setAttribute("position", new THREE.Float32BufferAttribute(quadVerts, 3));
              const thickMatColor = createThreeColor(r, g, b);
              const thickMat = new THREE.MeshBasicMaterial({
                color: thickMatColor,
                side: THREE.DoubleSide,
                transparent: cmd.alpha !== undefined && cmd.alpha < 1,
                opacity: cmd.alpha ?? 1,
                depthTest: false,
                depthWrite: false,
              });
              (thickMat as any).userData = {
                originalColor: [cmd.color[0], cmd.color[1], cmd.color[2]],
                isAci7,
                alpha: cmd.alpha ?? 1,
              };
              const thickMesh = new THREE.Mesh(thickGeom, thickMat);
              (thickMesh as any).frustumCulled = false;
              thickMesh.name = cmd.layer;
              thickMesh.renderOrder = cmd.renderOrder;
              thickMesh.visible = this.isLineweight && layerVis;
              (thickMesh as any).userData = {
                isLineweightMesh: true,
                lineweightMm: cmd.lineweightMm,
                layer: cmd.layer,
              };
              chunkGroup.add(thickMesh);
            }
          }
        } else if (cmd.kind === "triangle" && chunk.trianglesArray) {
          const tri = chunk.trianglesArray;
          const pos = new Float32Array(cmd.totalVertices * 3);
          let offset = 0;
          for (const rDef of cmd.runs) {
            const start = rDef.firstVertex * 2;
            const end = (rDef.firstVertex + rDef.vertexCount) * 2;
            for (let i = start; i < end; i += 2) {
              pos[offset++] = tri[i];
              pos[offset++] = tri[i + 1];
              pos[offset++] = 0;
            }
          }

          if (isLight && !this.isMonochrome && isAci7) {
            r = 0.08; g = 0.08; b = 0.08;
          }
          if (this.isMonochrome) {
            r = isLight ? 0.08 : 0.95;
            g = isLight ? 0.08 : 0.95;
            b = isLight ? 0.08 : 0.95;
          }

          const geom = new THREE.BufferGeometry();
          geom.setAttribute("position", new THREE.BufferAttribute(pos, 3));
          const matColor = createThreeColor(r, g, b);
          const mat = new THREE.MeshBasicMaterial({
            color: matColor,
            side: THREE.DoubleSide,
            transparent: cmd.alpha !== undefined && cmd.alpha < 1,
            opacity: cmd.alpha ?? 1,
            depthTest: false,
            depthWrite: false,
          });
          (mat as any).userData = {
            originalColor: [cmd.color[0], cmd.color[1], cmd.color[2]],
            isAci7,
            alpha: cmd.alpha ?? 1,
          };

          const mesh = new THREE.Mesh(geom, mat);
          (mesh as any).frustumCulled = false;
          mesh.name = cmd.layer;
          mesh.renderOrder = cmd.renderOrder;
          mesh.visible = this.layerVisibility.get(cmd.layer) ?? true;
          chunkGroup.add(mesh);
        } else if (cmd.kind === "wipeout" && chunk.trianglesArray) {
          const tri = chunk.trianglesArray;
          const pos = new Float32Array(cmd.totalVertices * 3);
          let offset = 0;
          for (const rDef of cmd.runs) {
            const start = rDef.firstVertex * 2;
            const end = (rDef.firstVertex + rDef.vertexCount) * 2;
            for (let i = start; i < end; i += 2) {
              pos[offset++] = tri[i];
              pos[offset++] = tri[i + 1];
              pos[offset++] = 0;
            }
          }

          const geom = new THREE.BufferGeometry();
          geom.setAttribute("position", new THREE.BufferAttribute(pos, 3));
          const mat = new THREE.MeshBasicMaterial({
            color: new THREE.Color(this.backgroundColorHex),
            side: THREE.DoubleSide,
            transparent: false,
            depthTest: false,
            depthWrite: false,
          });
          mat.userData = { isWipeout: true, originalColor: [1, 1, 1] };

          const mesh = new THREE.Mesh(geom, mat);
          (mesh as any).frustumCulled = false;
          mesh.userData = { isWipeout: true };
          mesh.name = cmd.layer;
          mesh.renderOrder = cmd.renderOrder;
          mesh.visible = this.layerVisibility.get(cmd.layer) ?? true;
          chunkGroup.add(mesh);
        }
      }
    } else {
      // 2. Geriye dönük uyumluluk: layerRuns ile bitişik komutları birleştir
      const layerRuns: Array<{
        layer: string;
        color: [number, number, number];
        firstVertex: number;
        vertexCount: number;
      }> = chunk.meta?.layerRuns || [];

      if (layerRuns.length > 0) {
        const mergedRuns: Array<{
          layer: string;
          color: [number, number, number];
          totalVertices: number;
          runs: Array<{ firstVertex: number; vertexCount: number }>;
        }> = [];

        for (const run of layerRuns) {
          const last = mergedRuns[mergedRuns.length - 1];
          if (
            last &&
            last.layer === run.layer &&
            Math.abs(last.color[0] - run.color[0]) < 1e-4 &&
            Math.abs(last.color[1] - run.color[1]) < 1e-4 &&
            Math.abs(last.color[2] - run.color[2]) < 1e-4
          ) {
            last.totalVertices += run.vertexCount;
            last.runs.push(run);
          } else {
            mergedRuns.push({
              layer: run.layer,
              color: run.color,
              totalVertices: run.vertexCount,
              runs: [run],
            });
          }
        }

        const xy = chunk.xyArray;
        for (let rIdx = 0; rIdx < mergedRuns.length; rIdx++) {
          const group = mergedRuns[rIdx];
          if (group.totalVertices === 0) continue;

          const groupPos = new Float32Array(group.totalVertices * 3);
          let offset = 0;
          for (const rDef of group.runs) {
            const start = rDef.firstVertex * 2;
            const end = (rDef.firstVertex + rDef.vertexCount) * 2;
            for (let i = start; i < end; i += 2) {
              groupPos[offset++] = xy[i];
              groupPos[offset++] = xy[i + 1];
              groupPos[offset++] = 0;
            }
          }

          let r = group.color[0] ?? 0.9;
          let g = group.color[1] ?? 0.9;
          let b = group.color[2] ?? 0.9;
          const isAci7 = (group as any).isAci7 === true;

          if (isLight && !this.isMonochrome && isAci7) {
            r = 0.08; g = 0.08; b = 0.08;
          }
          if (this.isMonochrome) {
            r = isLight ? 0.08 : 0.95;
            g = isLight ? 0.08 : 0.95;
            b = isLight ? 0.08 : 0.95;
          }

          const subGeom = new THREE.BufferGeometry();
          subGeom.setAttribute("position", new THREE.BufferAttribute(groupPos, 3));

          const subMatColor = createThreeColor(r, g, b);
          const subMat = new THREE.LineBasicMaterial({
            color: subMatColor,
            transparent: true,
            opacity: 1,
            depthTest: false,
            depthWrite: false,
          });
          (subMat as any).userData = {
            originalColor: [group.color[0] ?? 0.9, group.color[1] ?? 0.9, group.color[2] ?? 0.9],
            isAci7,
          };

          const subLines = new THREE.LineSegments(subGeom, subMat);
          (subLines as any).frustumCulled = false;
          subLines.name = group.layer;
          subLines.renderOrder = baseOrder + rIdx;
          subLines.visible = this.layerVisibility.get(group.layer) ?? true;
          chunkGroup.add(subLines);
        }
      } else if (lineCount > 0) {
        const pos3D = new Float32Array(lineCount * 3);
        for (let i = 0; i < lineCount; i++) {
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
        lineSegments.renderOrder = baseOrder;
        chunkGroup.add(lineSegments);
      }

      // Varsa üçgenleri de ekle
      if (chunk.trianglesArray && chunk.trianglesArray.length > 0) {
        const triGeom = new THREE.BufferGeometry();
        const triPos = new Float32Array((chunk.trianglesArray.length / 2) * 3);
        let tOffset = 0;
        for (let i = 0; i < chunk.trianglesArray.length; i += 2) {
          triPos[tOffset++] = chunk.trianglesArray[i];
          triPos[tOffset++] = chunk.trianglesArray[i + 1];
          triPos[tOffset++] = 0;
        }
        triGeom.setAttribute("position", new THREE.BufferAttribute(triPos, 3));
        const triMat = new THREE.MeshBasicMaterial({
          color: 0xcccccc,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 1,
          depthTest: false,
          depthWrite: false,
        });
        const triMesh = new THREE.Mesh(triGeom, triMat);
        triMesh.renderOrder = baseOrder + 5000;
        chunkGroup.add(triMesh);
      }
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
      if ((child as any).geometry) {
        (child as any).geometry.dispose();
      }
      if ((child as any).material) {
        const mat = (child as any).material;
        if (Array.isArray(mat)) {
          mat.forEach((m: any) => m.dispose());
        } else {
          mat.dispose();
        }
      }
    }
    this.loadedChunks.delete(chunkId);
    this.invalidate();
  }

  /** Rebuilds a chunk while keeping its current draw alive until the replacement is complete. */
  public replaceSceneChunkGeometry(chunk: UnpackedSceneChunk): boolean {
    const previous = this.loadedChunks.get(chunk.chunkId);
    if (!previous) return false;

    // addSceneChunk removes an existing map entry. Keep the old group attached to the scene,
    // build the replacement synchronously, then retire the old group before the next RAF.
    this.loadedChunks.delete(chunk.chunkId);
    try {
      this.addSceneChunk(chunk);
      const replacement = this.loadedChunks.get(chunk.chunkId);
      if (!replacement) {
        this.loadedChunks.set(chunk.chunkId, previous);
        return false;
      }
      this.disposeChunkGroup(previous.group);
      this.invalidate();
      return true;
    } catch (error) {
      const partial = this.loadedChunks.get(chunk.chunkId);
      if (partial && partial !== previous) this.removeSceneChunk(chunk.chunkId);
      if (!this.loadedChunks.has(chunk.chunkId)) this.loadedChunks.set(chunk.chunkId, previous);
      throw error;
    }
  }

  private disposeChunkGroup(group: THREE.Group): void {
    this.scene.remove(group);
    for (const child of group.children) {
      if ((child as any).geometry) (child as any).geometry.dispose();
      if ((child as any).material) {
        const material = (child as any).material;
        if (Array.isArray(material)) material.forEach((item: THREE.Material) => item.dispose());
        else material.dispose();
      }
    }
  }

  public clearChunks(): void {
    for (const chunkId of Array.from(this.loadedChunks.keys())) {
      this.removeSceneChunk(chunkId);
    }
  }

  public hasChunk(chunkId: string): boolean {
    return this.loadedChunks.has(chunkId);
  }

  public getLoadedChunkIds(): Set<string> {
    return new Set(this.loadedChunks.keys());
  }

  /**
   * F06: Aktif paftayı (Layout) değiştirir ve sadece o paftaya ait parçaları görünür kılar.
   */
  public setActiveLayout(layoutId: string): void {
    this.activeLayoutId = layoutId;
    this.updateChunkVisibility(this.cameraAdapter.getState());
    this.invalidate();
  }

  /** Manifest dünya bbox'larını renderer'a aktarır; legacy boundsız chunk'lar görünür tutulur. */
  public setChunkBounds(chunks: Array<{ chunkId: string; bbox?: CadBBox2D }>): void {
    this.chunkBounds.clear();
    for (const chunk of chunks) {
      if (chunk.bbox) this.chunkBounds.set(chunk.chunkId, [...chunk.bbox]);
    }
    this.updateChunkVisibility(this.cameraAdapter.getState());
    this.invalidate();
  }

  private updateChunkVisibility(camera: CadCameraState): void {
    for (const [chunkId, item] of this.loadedChunks) {
      const chunkLayout = item.group.userData.layoutId || "Model";
      item.group.visible = chunkLayout === this.activeLayoutId && isChunkVisibleInCamera(
        this.chunkBounds.get(chunkId),
        camera
      );
    }
  }

  public getActiveLayout(): string {
    return this.activeLayoutId;
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
          const u = (child as any).userData;
          if (u?.isLineweightMesh) {
            child.visible = visible && this.isLineweight;
          } else {
            child.visible = visible;
          }
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
        if ((child as any).userData?.isWipeout) {
          // Wipeout maskeleri monokrom mürekkep rengine dönüşmez
          continue;
        }
        if ((child as any).material && (child as any).material.color) {
          if (enabled) {
            (child as any).material.color.setHex(monoHex);
          } else {
            const orig = (child as any).userData?.originalColor || [0.9, 0.9, 0.9];
            const isAci7 = (child as any).userData?.isAci7 === true;
            let [r, g, b] = orig;
            if (isLight && isAci7) {
              r = 0.08;
              g = 0.08;
              b = 0.08;
            }
            applyThreeColor((child as any).material.color, r, g, b);
          }
          (child as any).material.needsUpdate = true;
        }
      }
    }
    this.invalidate();
  }

  /**
   * Çizgi kalınlığı modunu aç/kapat (LWT Toggle)
   */
  public setLineweight(enabled: boolean): void {
    this.isLineweight = enabled;
    for (const chunk of Array.from(this.loadedChunks.values())) {
      for (const child of chunk.group.children) {
        const u = (child as any).userData;
        if (u?.isLineweightMesh) {
          const layerVis = this.layerVisibility.get(child.name) ?? true;
          child.visible = enabled && layerVis;
        }
      }
    }
    this.invalidate();
  }

  public getLineweight(): boolean {
    return this.isLineweight;
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

    for (const chunk of Array.from(this.loadedChunks.values())) {
      for (const child of chunk.group.children) {
        // Wipeout maskeleri arka plan rengiyle güncellenir
        if ((child as any).userData?.isWipeout && (child as any).material) {
          ((child as any).material as THREE.MeshBasicMaterial).color.setHex(colorHex);
          ((child as any).material as THREE.MeshBasicMaterial).needsUpdate = true;
          continue;
        }

        if (wasLight !== isLight || this.isMonochrome) {
          const monoHex = isLight ? 0x111111 : 0xffffff;
          if ((child as any).material && (child as any).material.color) {
            if (this.isMonochrome) {
              (child as any).material.color.setHex(monoHex);
            } else {
              const orig = (child as any).userData?.originalColor || [0.9, 0.9, 0.9];
              const isAci7 = (child as any).userData?.isAci7 === true;
              let [r, g, b] = orig;
              if (isLight && isAci7) {
                r = 0.08;
                g = 0.08;
                b = 0.08;
              }
              applyThreeColor((child as any).material.color, r, g, b);
            }
            (child as any).material.needsUpdate = true;
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
