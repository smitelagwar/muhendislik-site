// ============================================================================
// DWG/DXF MOTOR V2 — THREE.JS 0.172.0 CAD WEBGL2 RENDERER
// ============================================================================
// Sözleşme: motor_v2/29_RENDER_VE_YASAM_DONGUSU.md
// Kamera-bağıl Float64->Float32 offset, tek kirli frame (dirty-frame) RAF planlayıcısı,
// tam bellek ve GPU kaynak temizliği.

import * as THREE from "three";
import { BatchedMesh } from "three/src/objects/BatchedMesh.js";
import type { CadBBox2D, CadPoint2D } from "../canonical/types";
import { D3CameraAdapter, type CadCameraState } from "../interaction/d3-camera-adapter";
import type { UnpackedSceneChunk } from "../../../workers/cad-v2/cad-v2-scene-worker";
import {
  decodeCadV2PositionArray,
  type CadV2PositionCodec,
  type CadV2PositionArray,
} from "../worker/position-compaction";
import {
  resolveDrawCommandRenderOrder,
} from "./render-order";
import { CAD_V2_PAINTER_DEPTH_MAX_ORDER } from "../painter-order-compaction";
import { isChunkVisibleInCamera } from "./chunk-visibility";
import { RenderedFrameGate } from "./rendered-frame-gate";
import { ChunkMutationRenderScheduler } from "./chunk-mutation-render-scheduler";
import { PendingCameraChange } from "./pending-camera-change";
import { estimateThreeGroupBufferBytes } from "./resource-memory-estimate";
import {
  CAD_V2_PAINTER_PAGE_FALLBACK_STYLES,
  getCadV2PainterPageMaxStyles,
} from "./painter-page-capacity";
import { supportsCadV2MultiDraw } from "./multi-draw-capability";
import { canSkipCadV2ObjectSort } from "./render-ordering-policy";
import {
  CAD_V2_CPU_RESIDENT_BUDGET_BYTES,
  CAD_V2_GPU_BUFFER_BUDGET_BYTES,
  evaluateCadV2ResourceBudget,
} from "./chunk-memory-accounting";
import {
  CadV2ResourceOwnershipLedger,
  type CadV2OwnedResourceInput,
  type CadV2ResourceOwnershipSnapshotEntry,
} from "./resource-ownership-ledger";

let nextRendererOwnerId = 1;

interface CadRenderableLike {
  children?: unknown[];
  geometry?: THREE.BufferGeometry;
  material?: THREE.Material | THREE.Material[];
  name?: string;
  userData?: Record<string, any>;
}

interface LoadedChunkRecord {
  origin: [number, number];
  group: THREE.Group;
  usesPainterDepthBatch: boolean;
  geometry?: THREE.BufferGeometry;
  material?: THREE.Material;
  painterPageChunk?: CadV2PainterPageChunk;
  painterPageMeshes?: THREE.Mesh[];
  resourceLease?: { release: () => void };
}

type CadV2BatchedMesh = THREE.Mesh & {
  isBatchedMesh: true;
  isMesh: boolean;
  isLine: boolean;
  isLineSegments: boolean;
  perObjectFrustumCulled: boolean;
  sortObjects: boolean;
  _geometryInfo: Array<Record<string, unknown>>;
  _geometryCount: number;
  _geometryInitialized: boolean;
  _nextVertexStart: number;
  _instanceInfo: Array<{ visible: boolean; active: boolean; geometryIndex: number }>;
  _colorsTexture: { image: { data: Float32Array }; needsUpdate: boolean } | null;
  _multiDrawStarts: Int32Array;
  _multiDrawCounts: Int32Array;
  _multiDrawCount: number;
  userData: Record<string, any>;
  addInstance(geometryId: number): number;
  setMatrixAt(instanceId: number, matrix: THREE.Matrix4): CadV2BatchedMesh;
  setColorAt(instanceId: number, color: THREE.Color): CadV2BatchedMesh;
  getColorAt(instanceId: number, color: THREE.Color): CadV2BatchedMesh;
  setVisibleAt(instanceId: number, visible: boolean): CadV2BatchedMesh;
  getVisibleAt(instanceId: number): boolean;
  dispose(): void;
};

const CadV2BatchedMeshConstructor = BatchedMesh as unknown as new (
  maxInstanceCount: number,
  maxVertexCount: number,
  maxIndexCount: number,
  material: THREE.Material,
) => CadV2BatchedMesh;

function getContiguousVertexSpan(
  runs: readonly { firstVertex: number; vertexCount: number }[],
): { startVertex: number; endVertex: number } | null {
  if (runs.length === 0) return null;
  const startVertex = runs[0]!.firstVertex;
  let endVertex = startVertex + runs[0]!.vertexCount;
  for (let index = 1; index < runs.length; index++) {
    const run = runs[index]!;
    if (run.firstVertex !== endVertex) return null;
    endVertex += run.vertexCount;
  }
  return { startVertex, endVertex };
}

function vertexRangesCoverSource(
  runs: readonly { firstVertex: number; vertexCount: number }[],
  sourceVertexCount: number,
): boolean {
  if (!Number.isSafeInteger(sourceVertexCount) || sourceVertexCount <= 0 || runs.length === 0) return false;
  const ranges = runs
    .map((run) => ({ start: run.firstVertex, end: run.firstVertex + run.vertexCount }))
    .filter((range) => Number.isSafeInteger(range.start) && Number.isSafeInteger(range.end) && range.start >= 0 && range.end > range.start)
    .sort((left, right) => left.start - right.start || left.end - right.end);
  let coveredUntil = 0;
  for (const range of ranges) {
    if (range.start > coveredUntil) return false;
    coveredUntil = Math.max(coveredUntil, range.end);
  }
  return coveredUntil === sourceVertexCount;
}

function selectOrPackVertexRanges(
  source: CadV2PositionArray,
  runs: readonly { firstVertex: number; vertexCount: number }[],
  totalVertices: number,
  componentsPerVertex: number,
  shareWholeSource = false,
): CadV2PositionArray {
  const span = getContiguousVertexSpan(runs);
  if (span && shareWholeSource) {
    return source.subarray(
      span.startVertex * componentsPerVertex,
      span.endVertex * componentsPerVertex,
    );
  }

  const packed = source instanceof Uint16Array
    ? new Uint16Array(totalVertices * componentsPerVertex)
    : new Float32Array(totalVertices * componentsPerVertex);
  let offset = 0;
  for (const run of runs) {
    const start = run.firstVertex * componentsPerVertex;
    const end = (run.firstVertex + run.vertexCount) * componentsPerVertex;
    packed.set(source.subarray(start, end), offset);
    offset += end - start;
  }
  return packed;
}

function visitRenderObjects(root: unknown, visit: (object: CadRenderableLike) => void): void {
  if (!root || typeof root !== "object") return;
  const object = root as CadRenderableLike;
  visit(object);
  for (const child of object.children ?? []) visitRenderObjects(child, visit);
}

function estimateGeometryResource(
  geometry: THREE.BufferGeometry,
  cpuBuffers: Set<ArrayBufferLike>,
  gpuAttributes: Set<object>,
): { cpuResidentBytes: number; gpuBufferBytesEstimate: number } {
  let cpuResidentBytes = 0;
  let gpuBufferBytesEstimate = 0;
  const attributes = Object.values(geometry.attributes) as Array<any>;
  const index = (geometry as THREE.BufferGeometry & { index?: THREE.BufferAttribute }).index;
  if (index) attributes.push(index);
  for (const attribute of attributes) {
    const data = attribute.data ?? attribute;
    const view = (attribute.array ?? data.array) as unknown as ArrayBufferView;
    if (!ArrayBuffer.isView(view)) continue;
    if (!cpuBuffers.has(view.buffer)) {
      cpuBuffers.add(view.buffer);
      cpuResidentBytes += view.buffer.byteLength;
    }
    if (!gpuAttributes.has(data)) {
      gpuAttributes.add(data);
      gpuBufferBytesEstimate += view.byteLength;
    }
  }
  return { cpuResidentBytes, gpuBufferBytesEstimate };
}

function collectChunkOwnedResources(root: unknown): CadV2OwnedResourceInput[] {
  const resources = new Map<object, CadV2OwnedResourceInput>();
  const cpuBuffers = new Set<ArrayBufferLike>();
  const gpuAttributes = new Set<object>();
  const add = (input: CadV2OwnedResourceInput) => {
    if (!resources.has(input.resource)) resources.set(input.resource, input);
  };
  visitRenderObjects(root, (renderable) => {
    if (renderable.geometry) {
      add({
        resource: renderable.geometry,
        kind: "geometry",
        byteEstimate: estimateGeometryResource(renderable.geometry, cpuBuffers, gpuAttributes),
        dispose: () => {
          if ((renderable as CadRenderableLike & { isBatchedMesh?: boolean }).isBatchedMesh) {
            (renderable as CadRenderableLike & { dispose?: () => void }).dispose?.();
          } else {
            renderable.geometry!.dispose();
          }
        },
      });
    }
    const materials = Array.isArray(renderable.material)
      ? renderable.material
      : renderable.material ? [renderable.material] : [];
    for (const material of materials) {
      if (resources.has(material)) continue;
      const uniformBuffers = new Set<ArrayBufferLike>();
      let cpuResidentBytes = 0;
      const uniforms = (material as THREE.Material & {
        uniforms?: Record<string, { value?: unknown }>;
      }).uniforms;
      for (const uniform of Object.values(uniforms ?? {}) as Array<{ value?: unknown }>) {
        const value = uniform?.value;
        if (value && typeof value === "object" && (value as any).isTexture === true) {
          const texture = value as THREE.Texture & { image?: { data?: ArrayBufferView } };
          const data = texture.image?.data;
          if (data && ArrayBuffer.isView(data)) {
            const bytes = data.buffer.byteLength;
            add({
              resource: texture,
              kind: "texture",
              byteEstimate: { cpuResidentBytes: bytes, gpuBufferBytesEstimate: data.byteLength },
              dispose: () => texture.dispose(),
            });
          }
          continue;
        }
        if (ArrayBuffer.isView(value)) {
          if (!uniformBuffers.has(value.buffer)) {
            uniformBuffers.add(value.buffer);
            cpuResidentBytes += value.buffer.byteLength;
          }
        }
      }
      add({
        resource: material,
        kind: "material",
        byteEstimate: { cpuResidentBytes, gpuBufferBytesEstimate: 0 },
        dispose: () => material.dispose(),
      });
    }
  });
  return Array.from(resources.values());
}

function disposeUnregisteredGroup(group: THREE.Group): void {
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  const textures = new Set<THREE.Texture>();
  const batchedMeshes = new Set<CadV2BatchedMesh>();
  visitRenderObjects(group, (renderable) => {
    if (renderable.geometry) {
      if ((renderable as CadRenderableLike & { isBatchedMesh?: boolean }).isBatchedMesh) {
        batchedMeshes.add(renderable as CadV2BatchedMesh);
      } else {
        geometries.add(renderable.geometry);
      }
    }
    const assigned = Array.isArray(renderable.material)
      ? renderable.material
      : renderable.material ? [renderable.material] : [];
    for (const material of assigned) {
      materials.add(material);
      const uniforms = (material as THREE.Material & { uniforms?: Record<string, { value?: unknown }> }).uniforms;
      for (const uniform of Object.values(uniforms ?? {}) as Array<{ value?: unknown }>) {
        const value = uniform?.value;
        if (value && typeof value === "object" && (value as any).isTexture === true) textures.add(value as THREE.Texture);
      }
    }
  });
  for (const mesh of batchedMeshes) mesh.dispose();
  for (const geometry of geometries) geometry.dispose();
  for (const texture of textures) texture.dispose();
  for (const material of materials) material.dispose();
}

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

type CadV2BatchedLineRange = {
  layer: string;
  color: [number, number, number];
  alpha: number;
  lineweightMm: number;
  renderOrder: number;
  totalVertices: number;
  runs: Array<{ firstVertex: number; vertexCount: number }>;
  isAci7: boolean;
  firstGlobalOrderIndex?: number | null;
  lastGlobalOrderIndex?: number | null;
};

type CadV2LineBatchRebuild = {
  source: CadV2PositionArray;
  positionCodec?: CadV2PositionCodec;
  commands: CadV2BatchedLineRange[];
  painterDepth: boolean;
  globalOrderMax: number;
  renderOrder: number;
};

const CAD_V2_PAINTER_DEPTH_SPAN = 0.8;
function getCadV2PainterDepthZ(globalOrderIndex: number, globalOrderMax: number): number | null {
  if (!Number.isSafeInteger(globalOrderIndex) || globalOrderIndex < 0 ||
      !Number.isSafeInteger(globalOrderMax) || globalOrderMax < globalOrderIndex ||
      globalOrderMax > CAD_V2_PAINTER_DEPTH_MAX_ORDER) return null;
  return ((globalOrderIndex + 1) / (globalOrderMax + 1)) * CAD_V2_PAINTER_DEPTH_SPAN;
}

function createCadV2MultiDrawLineBatch(
  source: CadV2PositionArray,
  commands: CadV2BatchedLineRange[],
  isLightBackground: boolean,
  isMonochrome: boolean,
  layerVisibility: Map<string, boolean>,
  painterDepth = false,
  globalOrderMax = 0,
  renderOrder?: number,
  positionCodec?: CadV2PositionCodec,
): CadV2BatchedMesh {
  const spans = commands.map((command) => {
    const span = getContiguousVertexSpan(command.runs);
    if (!span || span.endVertex - span.startVertex !== command.totalVertices) {
      throw new Error("CAD V2 multi-draw line ranges must be contiguous source spans");
    }
    return span;
  });
  const sourceStartVertex = Math.min(...spans.map((span) => span.startVertex));
  const sourceEndVertex = Math.max(...spans.map((span) => span.endVertex));
  const sourceVertexCount = sourceEndVertex - sourceStartVertex;
  const sourcePositionView = source.subarray(sourceStartVertex * 2, sourceEndVertex * 2);
  const material = new THREE.LineBasicMaterial({
    color: 0xffffff,
    transparent: false,
    opacity: 1,
    depthTest: painterDepth,
    depthWrite: painterDepth,
  });
  const batch = new CadV2BatchedMeshConstructor(commands.length, sourceVertexCount, 0, material) as CadV2BatchedMesh & {
    isMesh: boolean;
    isLine: boolean;
    isLineSegments: boolean;
    _geometryInfo: Array<Record<string, unknown>>;
    _geometryCount: number;
    _geometryInitialized: boolean;
    _nextVertexStart: number;
    userData: Record<string, unknown>;
  };
  const geometry = new THREE.BufferGeometry();
  setCadV2Position2D(geometry, sourcePositionView);
  batch.geometry = geometry;
  batch._geometryInitialized = true;
  batch._geometryCount = commands.length;
  batch._nextVertexStart = sourceVertexCount;
  batch._geometryInfo = commands.map((command, index) => {
    const span = spans[index]!;
    const batchVertexStart = span.startVertex - sourceStartVertex;
    return {
      vertexStart: batchVertexStart,
      vertexCount: command.totalVertices,
      reservedVertexCount: command.totalVertices,
      indexStart: -1,
      indexCount: -1,
      reservedIndexCount: -1,
      start: batchVertexStart,
      count: command.totalVertices,
      active: true,
      boundingBox: null,
      boundingSphere: null,
    };
  });
  (batch as any).isMesh = false;
  batch.isLine = true;
  batch.isLineSegments = true;
  // Chunks already have manifest bounds and the 2D XY attribute has no z component.
  // Three.js BatchMesh.computeBoundingSphere() would otherwise read z=undefined and produce NaN.
  batch.frustumCulled = false;
  batch.perObjectFrustumCulled = false;
  batch.sortObjects = false;
  batch.renderOrder = commands[0]?.renderOrder ?? 0;
  batch.name = "cad-v2-multidraw-lines";
  applyCadV2PositionCodec(batch, positionCodec);
  const instances: Array<{
    layer: string;
    color: [number, number, number];
    isAci7: boolean;
    lineweightMm: number;
    renderOrder: number;
    firstVertex: number;
    vertexCount: number;
    globalOrderIndex?: number | null;
    painterDepthZ?: number;
  }> = [];
  commands.forEach((command, index) => {
    const instanceId = batch.addInstance(index);
    const span = spans[index]!;
    const [sourceR, sourceG, sourceB] = command.color;
    let r = sourceR;
    let g = sourceG;
    let b = sourceB;
    if (isLightBackground && !isMonochrome && command.isAci7) r = g = b = 0.08;
    if (isMonochrome) r = g = b = isLightBackground ? 0.08 : 0.95;
    batch.setColorAt(instanceId, createThreeColor(r, g, b));
    batch.setVisibleAt(instanceId, layerVisibility.get(command.layer) ?? true);
    if (painterDepth) {
      const orderIndex = command.lastGlobalOrderIndex ?? command.firstGlobalOrderIndex;
      const depthZ = typeof orderIndex === "number" ? getCadV2PainterDepthZ(orderIndex, globalOrderMax) : null;
      if (depthZ === null) throw new Error("CAD V2 painter-depth batch requires a valid compiler order index");
      batch.setMatrixAt(instanceId, new THREE.Matrix4().makeTranslation(0, 0, depthZ));
    }
    instances.push({
      layer: command.layer,
      color: command.color,
      isAci7: command.isAci7,
      lineweightMm: command.lineweightMm,
      renderOrder: command.renderOrder,
      firstVertex: span.startVertex,
      vertexCount: command.totalVertices,
      globalOrderIndex: command.lastGlobalOrderIndex ?? command.firstGlobalOrderIndex ?? null,
      painterDepthZ: painterDepth
        ? getCadV2PainterDepthZ(command.lastGlobalOrderIndex ?? command.firstGlobalOrderIndex ?? -1, globalOrderMax) ?? 0
        : 0,
    });
  });
  batch.userData = {
    cadV2MultiDrawLineBatch: true,
    instances,
    source,
    positionCodec,
    lineweightMeshes: [],
    painterDepth,
    globalOrderMax,
    lineBatchRebuild: {
      source,
      positionCodec,
      commands,
      painterDepth,
      globalOrderMax,
      renderOrder: batch.renderOrder,
    } satisfies CadV2LineBatchRebuild,
  };
  if (Number.isFinite(renderOrder)) batch.renderOrder = renderOrder!;
  return batch;
}

function createCadV2MultiDrawTriangleBatch(
  source: CadV2PositionArray,
  commands: CadV2BatchedLineRange[],
  isLightBackground: boolean,
  isMonochrome: boolean,
  layerVisibility: Map<string, boolean>,
  painterDepth = false,
  globalOrderMax = 0,
  renderOrder?: number,
): CadV2BatchedMesh {
  const batch = createCadV2MultiDrawLineBatch(
    source,
    commands,
    isLightBackground,
    isMonochrome,
    layerVisibility,
    painterDepth,
    globalOrderMax,
    renderOrder,
  );
  const lineMaterial = batch.material as THREE.Material;
  batch.material = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    side: THREE.DoubleSide,
    transparent: false,
    depthTest: painterDepth,
    depthWrite: painterDepth,
  }) as any;
  lineMaterial.dispose();
  batch.isMesh = true;
  batch.isLine = false;
  batch.isLineSegments = false;
  batch.name = "cad-v2-multidraw-triangles";
  return batch;
}

function applyThreeColor(color: THREE.Color, r: number, g: number, b: number): void {
  (color as any).setRGB(r, g, b, (THREE as any).SRGBColorSpace);
}

function setCadV2Position2D(geometry: THREE.BufferGeometry, positions: CadV2PositionArray): void {
  const normalized = positions instanceof Uint16Array;
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 2, normalized));
  let radiusSquared = 0;
  for (let i = 0; i < positions.length; i += 2) {
    const x = normalized ? positions[i]! / 0xffff : positions[i]!;
    const y = normalized ? positions[i + 1]! / 0xffff : positions[i + 1]!;
    if (!Number.isFinite(x) || !Number.isFinite(y)) {
      throw new Error("CAD V2 renderer received a non-finite 2D vertex");
    }
    radiusSquared = Math.max(radiusSquared, x * x + y * y);
  }
  // CAD V2 vertices are planar (z = 0); the sphere encloses all local vertices
  // and remains valid while the camera-relative chunk group moves.
  (geometry as any).boundingSphere = new (THREE as any).Sphere(
    new THREE.Vector3(),
    Math.sqrt(radiusSquared),
  );
}

function applyCadV2PositionCodec<T extends object>(object: T, codec?: CadV2PositionCodec): T {
  if (!codec) return object;
  const renderable = object as T & { position: THREE.Vector3; scale: THREE.Vector3 };
  renderable.position.set(codec.minX, codec.minY, 0);
  renderable.scale.set(codec.extentX, codec.extentY, 1);
  return object;
}

function getCadV2PositionTransform(codec?: CadV2PositionCodec) {
  const Vector2 = (THREE as any).Vector2;
  return {
    offset: new Vector2(codec?.minX ?? 0, codec?.minY ?? 0),
    scale: new Vector2(codec?.extentX ?? 1, codec?.extentY ?? 1),
  };
}

function createLineweightMesh(centerline: THREE.LineSegments, positionCodec?: CadV2PositionCodec): THREE.Mesh | null {
  const lineData = (centerline as any).userData ?? {};
  positionCodec ??= lineData.positionCodec as CadV2PositionCodec | undefined;
  const lineweightMm = lineData.lineweightMm;
  if (!Number.isFinite(lineweightMm) || lineweightMm <= 1e-4) return null;

  const geometry = centerline.geometry as any;
  const position = geometry.getAttribute("position");
  const storedValues = position?.array as CadV2PositionArray | undefined;
  if (!storedValues || storedValues.length < 4 || storedValues.length % 4 !== 0 || geometry.index ||
      (storedValues instanceof Uint16Array && !positionCodec)) return null;
  for (let index = 0; index < storedValues.length; index++) {
    if (!Number.isFinite(storedValues[index])) return null;
  }

  const material = centerline.material as any;
  const materialData = material?.userData ?? {};
  const sourceColor = material?.color ?? material?.uniforms?.uColor?.value;
  const color = sourceColor?.clone ? sourceColor.clone() : new THREE.Color(0xffffff);
  const opacityValue = material?.opacity ?? material?.uniforms?.uOpacity?.value ?? materialData.alpha ?? 1;
  const opacity = Number.isFinite(opacityValue) ? opacityValue : 1;
  const normalized = storedValues instanceof Uint16Array;
  const interleavedSegments = new (THREE as any).InstancedInterleavedBuffer(storedValues, 4);
  const thickGeometry = new (THREE as any).InstancedBufferGeometry();
  thickGeometry.setAttribute("position", new THREE.BufferAttribute(
    new Float32Array([0, -1, 1, -1, 0, 1, 1, -1, 1, 1, 0, 1]),
    2,
  ));
  thickGeometry.setAttribute("instanceStart", new (THREE as any).InterleavedBufferAttribute(interleavedSegments, 2, 0, normalized));
  thickGeometry.setAttribute("instanceEnd", new (THREE as any).InterleavedBufferAttribute(interleavedSegments, 2, 2, normalized));
  thickGeometry.instanceCount = storedValues.length / 4;
  thickGeometry.boundingSphere = new (THREE as any).Sphere(new THREE.Vector3(), 1);
  const thickMaterial = new THREE.ShaderMaterial({
    transparent: opacity < 1,
    depthTest: false,
    depthWrite: false,
    uniforms: {
      uColor: { value: color },
      uOpacity: { value: opacity },
      uHalfWidth: { value: lineweightMm / 2 },
      uCadV2PositionOffset: { value: getCadV2PositionTransform(positionCodec).offset },
      uCadV2PositionScale: { value: getCadV2PositionTransform(positionCodec).scale },
    },
    vertexShader: `attribute vec2 instanceStart;
      attribute vec2 instanceEnd;
      uniform float uHalfWidth;
      uniform vec2 uCadV2PositionOffset;
      uniform vec2 uCadV2PositionScale;
      void main() {
        vec2 start = uCadV2PositionOffset + instanceStart * uCadV2PositionScale;
        vec2 end = uCadV2PositionOffset + instanceEnd * uCadV2PositionScale;
        vec2 delta = end - start;
        float segmentLength = length(delta);
        if (segmentLength < 1.0e-9) {
          gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
          return;
        }
        vec2 normal = vec2(-delta.y, delta.x) / segmentLength;
        vec2 point = mix(start, end, position.x) + normal * (uHalfWidth * position.y);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(point, 0.0, 1.0);
      }`,
    fragmentShader: `uniform vec3 uColor;
      uniform float uOpacity;
      void main() {
        gl_FragColor = vec4(uColor, uOpacity);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
  thickMaterial.userData = {
    originalColor: lineData.originalColor ?? materialData.originalColor ?? [0.9, 0.9, 0.9],
    isAci7: (lineData.isAci7 ?? materialData.isAci7) === true,
    alpha: opacity,
  };

  const thickMesh = new THREE.Mesh(thickGeometry, thickMaterial);
  (thickMesh as any).frustumCulled = false;
  thickMesh.name = centerline.name;
  thickMesh.renderOrder = centerline.renderOrder;
  thickMesh.visible = centerline.visible;
  thickMesh.userData = { isLineweightMesh: true, lineweightMm, layer: centerline.name };
  return thickMesh;
}

type CadV2BatchedLineInstance = {
  layer: string;
  color: [number, number, number];
  isAci7: boolean;
  lineweightMm: number;
  renderOrder: number;
  firstVertex: number;
  vertexCount: number;
  globalOrderIndex?: number | null;
  painterDepthZ?: number;
};

type CadV2PainterPageChunk = {
  chunkId: string;
  lineSource: CadV2PositionArray | null;
  lineCommands: CadV2BatchedLineRange[];
  triangleSource: CadV2PositionArray | null;
  triangleCommands: CadV2BatchedLineRange[];
  origin: [number, number];
  worldOrigin: CadPoint2D;
  positionCodec?: CadV2PositionCodec;
  globalOrderMax: number;
  visible: boolean;
  active: boolean;
  promoted: boolean;
  pages: Set<CadV2PainterRenderPage>;
  styleRefs: Array<{ page: CadV2PainterRenderPage; index: number }>;
};

type CadV2PainterLinePageStyle = {
  chunk: CadV2PainterPageChunk;
  instance: CadV2BatchedLineInstance;
  styleIndex: number;
  segmentStart: number;
  segmentEnd: number;
  offsetX: number;
  offsetY: number;
  scaleX: number;
  scaleY: number;
  depthZ: number;
};

type CadV2PainterTrianglePageStyle = {
  chunk: CadV2PainterPageChunk;
  instance: CadV2BatchedLineInstance;
  instanceId: number;
  depthZ: number;
};

type CadV2PainterRenderPage = {
  kind: "line" | "triangle";
  mesh: THREE.Mesh;
  styles: Array<CadV2PainterLinePageStyle | CadV2PainterTrianglePageStyle>;
  activeChunks: Set<CadV2PainterPageChunk>;
  styleData?: Float32Array;
  styleTexture?: THREE.DataTexture;
};

type CadV2PainterPromotionDiagnostic = {
  outcome: "stale" | "empty-pages" | "budget-rejected" | "promoted" | "rollback";
  requestedChunkCount: number;
  currentChunkCount: number;
  pageCount: number;
  promotedChunkCount: number;
  remainingGroupCount: number;
  remainingObjectCount: number;
  remainingObjectCountsByName: Record<string, number>;
  cameraRelativeChunkCount: number;
  currentCpuBytes?: number;
  currentGpuBytes?: number;
  removedCpuBytes?: number;
  removedGpuBytes?: number;
  pageCpuBytes?: number;
  pageGpuBytes?: number;
  projectedCpuBytes?: number;
  projectedGpuBytes?: number;
  cpuBudgetBytes?: number;
  gpuBudgetBytes?: number;
  error?: string;
};

const CAD_V2_PAINTER_PAGE_CHUNK_COUNT = 512;
const CAD_V2_PAINTER_PAGE_MAX_SEGMENTS = 65_536;

type CadV2PainterLinePageInput = {
  chunk: CadV2PainterPageChunk;
  command: CadV2BatchedLineRange;
  source: CadV2PositionArray;
  span: { startVertex: number; endVertex: number };
};

function createCadV2PainterLinePage(
  inputs: CadV2PainterLinePageInput[],
  isLightBackground: boolean,
  isMonochrome: boolean,
  layerVisibility: Map<string, boolean>,
  lineweightEnabled: boolean,
  drawingBufferResolution: [number, number],
  maxStyles: number,
): CadV2PainterRenderPage {
  if (inputs.length === 0 || inputs.length > maxStyles) {
    throw new Error("CAD V2 painter line page has an invalid style count");
  }
  const compact = inputs[0]!.source instanceof Uint16Array;
  if (inputs.some((input) => (input.source instanceof Uint16Array) !== compact)) {
    throw new Error("CAD V2 painter line page cannot mix compact and float position buffers");
  }
  const vertexCount = inputs.reduce((total, input) => total + input.command.totalVertices, 0);
  const segmentCount = vertexCount / 2;
  if (!Number.isSafeInteger(vertexCount) || vertexCount <= 0 || vertexCount % 2 !== 0 ||
      !Number.isSafeInteger(segmentCount) || segmentCount > CAD_V2_PAINTER_PAGE_MAX_SEGMENTS) {
    throw new Error("CAD V2 painter line page exceeds its bounded segment capacity");
  }

  const source = compact ? new Uint16Array(vertexCount * 2) : new Float32Array(vertexCount * 2);
  const segmentStyles = new Uint16Array(segmentCount);
  const styleData = new Float32Array(inputs.length * 12);
  const styles: CadV2PainterLinePageStyle[] = [];
  const activeChunks = new Set<CadV2PainterPageChunk>();
  let targetVertex = 0;
  let targetSegment = 0;
  let renderOrder = Number.POSITIVE_INFINITY;
  for (let styleIndex = 0; styleIndex < inputs.length; styleIndex++) {
    const { chunk, command, source: sourceChunk, span } = inputs[styleIndex]!;
    if (span.endVertex - span.startVertex !== command.totalVertices) {
      throw new Error("CAD V2 painter line page requires contiguous source vertices");
    }
    const sourceStart = span.startVertex * 2;
    const sourceEnd = span.endVertex * 2;
    source.set(sourceChunk.subarray(sourceStart, sourceEnd) as CadV2PositionArray, targetVertex * 2);
    const commandSegments = command.totalVertices / 2;
    const positionCodec = chunk.positionCodec;
    const depthOrderIndex = command.lastGlobalOrderIndex ?? command.firstGlobalOrderIndex;
    const depthZ = typeof depthOrderIndex === "number"
      ? getCadV2PainterDepthZ(depthOrderIndex, chunk.globalOrderMax)
      : null;
    if (depthZ === null) throw new Error("CAD V2 painter line page requires a valid global draw order");
    const [offsetX, offsetY] = [
      chunk.origin[0] - chunk.worldOrigin[0] + (positionCodec?.minX ?? 0),
      chunk.origin[1] - chunk.worldOrigin[1] + (positionCodec?.minY ?? 0),
    ];
    const [scaleX, scaleY] = [positionCodec?.extentX ?? 1, positionCodec?.extentY ?? 1];
    if (![offsetX, offsetY, scaleX, scaleY].every(Number.isFinite) || scaleX < 0 || scaleY < 0) {
      throw new Error("CAD V2 painter line page received an invalid position transform");
    }
    const instance: CadV2BatchedLineInstance = {
      layer: command.layer,
      color: command.color,
      isAci7: command.isAci7,
      lineweightMm: command.lineweightMm,
      renderOrder: command.renderOrder,
      firstVertex: targetVertex,
      vertexCount: command.totalVertices,
      globalOrderIndex: depthOrderIndex,
      painterDepthZ: depthZ,
    };
    const style = {
      chunk,
      instance,
      styleIndex,
      segmentStart: targetSegment,
      segmentEnd: targetSegment + commandSegments,
      offsetX,
      offsetY,
      scaleX,
      scaleY,
      depthZ,
    } satisfies CadV2PainterLinePageStyle;
    styles.push(style);
    activeChunks.add(chunk);
    renderOrder = Math.min(renderOrder, command.renderOrder);
    for (let index = targetSegment; index < targetSegment + commandSegments; index++) {
      segmentStyles[index] = styleIndex;
    }

    let [r, g, b] = command.color;
    if (isLightBackground && !isMonochrome && command.isAci7) r = g = b = 0.08;
    if (isMonochrome) r = g = b = isLightBackground ? 0.08 : 0.95;
    const color = createThreeColor(r, g, b);
    const offset = styleIndex * 12;
    styleData[offset] = targetSegment;
    styleData[offset + 1] = targetSegment + commandSegments;
    styleData[offset + 2] = color.r;
    styleData[offset + 3] = color.g;
    styleData[offset + 4] = color.b;
    styleData[offset + 5] = lineweightEnabled ? command.lineweightMm / 2 : 0;
    styleData[offset + 6] = chunk.active && chunk.visible && (layerVisibility.get(command.layer) ?? true) ? 1 : 0;
    styleData[offset + 7] = depthZ;
    styleData[offset + 8] = offsetX;
    styleData[offset + 9] = offsetY;
    styleData[offset + 10] = scaleX;
    styleData[offset + 11] = scaleY;
    targetVertex += command.totalVertices;
    targetSegment += commandSegments;
  }

  const interleavedSegments = new (THREE as any).InstancedInterleavedBuffer(source, 4);
  const geometry = new (THREE as any).InstancedBufferGeometry() as THREE.InstancedBufferGeometry;
  geometry.setAttribute("position", new THREE.BufferAttribute(
    new Float32Array([0, -1, 1, -1, 0, 1, 1, -1, 1, 1, 0, 1]),
    2,
  ));
  geometry.setAttribute("instanceStart", new (THREE as any).InterleavedBufferAttribute(interleavedSegments, 2, 0, compact));
  geometry.setAttribute("instanceEnd", new (THREE as any).InterleavedBufferAttribute(interleavedSegments, 2, 2, compact));
  geometry.setAttribute("cadV2StyleIndex", new (THREE as any).InstancedBufferAttribute(segmentStyles, 1, false));
  geometry.instanceCount = segmentCount;
  (geometry as any).boundingSphere = new (THREE as any).Sphere(new THREE.Vector3(), 1);

  const styleTexture = new THREE.DataTexture(
    styleData,
    1,
    inputs.length * 3,
    THREE.RGBAFormat,
    THREE.FloatType,
  );
  styleTexture.minFilter = THREE.NearestFilter;
  styleTexture.magFilter = THREE.NearestFilter;
  styleTexture.generateMipmaps = false;
  styleTexture.flipY = false;
  styleTexture.needsUpdate = true;

  const material = new THREE.ShaderMaterial({
    glslVersion: (THREE as any).GLSL3,
    transparent: false,
    depthTest: true,
    depthWrite: true,
    uniforms: {
      uCadV2LineStyles: { value: styleTexture },
      uCadV2ViewportResolution: { value: new (THREE as any).Vector2(
        Math.max(1, drawingBufferResolution[0]),
        Math.max(1, drawingBufferResolution[1]),
      ) },
    },
    vertexShader: `in vec2 instanceStart;
      in vec2 instanceEnd;
      in float cadV2StyleIndex;
      uniform sampler2D uCadV2LineStyles;
      uniform vec2 uCadV2ViewportResolution;
      flat out vec3 vCadV2LineColor;
      vec4 getCadV2LineStyle(int styleIndex, int row) {
        return texelFetch(uCadV2LineStyles, ivec2(0, styleIndex * 3 + row), 0);
      }
      void main() {
        int styleIndex = int(cadV2StyleIndex + 0.5);
        vec4 colorWidthVisibilityDepth = getCadV2LineStyle(styleIndex, 1);
        if (colorWidthVisibilityDepth.z < 0.5) {
          gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
          vCadV2LineColor = vec3(0.0);
          return;
        }
        vec4 rangeAndColor = getCadV2LineStyle(styleIndex, 0);
        vec4 positionTransform = getCadV2LineStyle(styleIndex, 2);
        vec2 start = positionTransform.xy + instanceStart * positionTransform.zw;
        vec2 end = positionTransform.xy + instanceEnd * positionTransform.zw;
        vec2 delta = end - start;
        float segmentLength = length(delta);
        if (segmentLength < 1.0e-9) {
          gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
          vCadV2LineColor = vec3(0.0);
          return;
        }
        vec4 startClip = projectionMatrix * modelViewMatrix * vec4(start, colorWidthVisibilityDepth.w, 1.0);
        vec4 endClip = projectionMatrix * modelViewMatrix * vec4(end, colorWidthVisibilityDepth.w, 1.0);
        vec4 clipPosition = mix(startClip, endClip, position.x);
        if (colorWidthVisibilityDepth.y > 1.0e-4) {
          vec2 normal = vec2(-delta.y, delta.x) / segmentLength;
          vec2 point = mix(start, end, position.x) + normal * (colorWidthVisibilityDepth.y * position.y);
          clipPosition = projectionMatrix * modelViewMatrix * vec4(point, colorWidthVisibilityDepth.w, 1.0);
        } else {
          vec2 startNdc = startClip.xy / startClip.w;
          vec2 endNdc = endClip.xy / endClip.w;
          vec2 segmentPixels = (endNdc - startNdc) * uCadV2ViewportResolution * 0.5;
          float segmentPixelLength = length(segmentPixels);
          if (segmentPixelLength < 1.0e-5) {
            gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
            vCadV2LineColor = vec3(0.0);
            return;
          }
          vec2 normalPixels = vec2(-segmentPixels.y, segmentPixels.x) / segmentPixelLength;
          vec2 ndcOffset = normalPixels * position.y / uCadV2ViewportResolution;
          clipPosition.xy += ndcOffset * clipPosition.w;
        }
        gl_Position = clipPosition;
        vCadV2LineColor = vec3(rangeAndColor.z, rangeAndColor.w, colorWidthVisibilityDepth.x);
      }`,
    fragmentShader: `flat in vec3 vCadV2LineColor;
      out vec4 cadV2FragmentColor;
      #define gl_FragColor cadV2FragmentColor
      void main() {
        cadV2FragmentColor = vec4(vCadV2LineColor, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.frustumCulled = false;
  mesh.renderOrder = Number.isFinite(renderOrder) ? renderOrder : 0;
  mesh.name = "cad-v2-painter-line-page";
  const page: CadV2PainterRenderPage = {
    kind: "line",
    mesh,
    styles,
    activeChunks,
    styleData,
    styleTexture,
  };
  mesh.userData = { isCadV2PainterLinePage: true, painterPage: page };
  return page;
}

function createCadV2BatchedLineweightMesh(
  instances: CadV2BatchedLineInstance[],
  source: CadV2PositionArray,
  isLightBackground: boolean,
  isMonochrome: boolean,
  layerVisibility: Map<string, boolean>,
  painterDepth = false,
  drawingBufferResolution: [number, number] = [1, 1],
  positionCodec?: CadV2PositionCodec,
): THREE.Mesh | null {
  if (instances.length === 0) return null;
  if (source instanceof Uint16Array && !positionCodec) return null;
  let expectedFirstVertex = instances[0]!.firstVertex;
  let segmentCount = 0;
  for (const instance of instances) {
    if (instance.firstVertex !== expectedFirstVertex || instance.vertexCount <= 0 || instance.vertexCount % 2 !== 0) {
      return null;
    }
    expectedFirstVertex += instance.vertexCount;
    segmentCount += instance.vertexCount / 2;
  }
  if (segmentCount === 0) return null;

  const sourceStartVertex = instances[0]!.firstVertex;
  const sourceEndVertex = expectedFirstVertex;
  const sourcePositions = source.subarray(sourceStartVertex * 2, sourceEndVertex * 2);
  const normalized = source instanceof Uint16Array;
  const positionTransform = getCadV2PositionTransform(positionCodec);
  const interleavedSegments = new (THREE as any).InstancedInterleavedBuffer(sourcePositions, 4);
  const geometry = new (THREE as any).InstancedBufferGeometry() as THREE.InstancedBufferGeometry;
  geometry.setAttribute("position", new THREE.BufferAttribute(
    new Float32Array([0, -1, 1, -1, 0, 1, 1, -1, 1, 1, 0, 1]),
    2,
  ));
  geometry.setAttribute("instanceStart", new (THREE as any).InterleavedBufferAttribute(interleavedSegments, 2, 0, normalized));
  geometry.setAttribute("instanceEnd", new (THREE as any).InterleavedBufferAttribute(interleavedSegments, 2, 2, normalized));
  geometry.instanceCount = segmentCount;
  // The shader expands these base quad vertices from 2D segment attributes. Three.js
  // transparent sorting can still request a bound even with frustum culling disabled.
  (geometry as any).boundingSphere = new (THREE as any).Sphere(
    new THREE.Vector3(0.5, 0, 0),
    Math.sqrt(1.25),
  );

  // Two RGBA texels per command: segment range + linear R/G, then linear B + half-width + visibility.
  // This keeps command style metadata proportional to draw commands, not to every segment.
  const styleData = new Float32Array(instances.length * 8);
  const styleSegments = instances.map((instance, index) => {
    const segmentStart = (instance.firstVertex - sourceStartVertex) / 2;
    const count = instance.vertexCount / 2;
    let [r, g, b] = instance.color;
    if (isLightBackground && !isMonochrome && instance.isAci7) r = g = b = 0.08;
    if (isMonochrome) r = g = b = isLightBackground ? 0.08 : 0.95;
    const color = createThreeColor(r, g, b);
    const offset = index * 8;
    styleData[offset] = segmentStart;
    styleData[offset + 1] = segmentStart + count;
    styleData[offset + 2] = color.r;
    styleData[offset + 3] = color.g;
    styleData[offset + 4] = color.b;
    styleData[offset + 5] = instance.lineweightMm / 2;
    styleData[offset + 6] = layerVisibility.get(instance.layer) ?? true ? 1 : 0;
    styleData[offset + 7] = painterDepth ? instance.painterDepthZ ?? 0 : 0;
    return { ...instance, segmentStart, segmentCount: count, styleIndex: index };
  });
  const styleTexture = new THREE.DataTexture(
    styleData,
    1,
    instances.length * 2,
    THREE.RGBAFormat,
    THREE.FloatType,
  );
  styleTexture.minFilter = THREE.NearestFilter;
  styleTexture.magFilter = THREE.NearestFilter;
  styleTexture.generateMipmaps = false;
  styleTexture.flipY = false;
  styleTexture.needsUpdate = true;

  const material = new THREE.ShaderMaterial({
    glslVersion: (THREE as any).GLSL3,
    transparent: false,
    depthTest: painterDepth,
    depthWrite: painterDepth,
    uniforms: {
      uCadV2LineStyles: { value: styleTexture },
      uCadV2LineStyleCount: { value: instances.length },
      uCadV2ViewportResolution: { value: new (THREE as any).Vector2(
        Math.max(1, drawingBufferResolution[0]),
        Math.max(1, drawingBufferResolution[1]),
      ) },
      uCadV2PositionOffset: { value: positionTransform.offset },
      uCadV2PositionScale: { value: positionTransform.scale },
    },
    vertexShader: `in vec2 instanceStart;
      in vec2 instanceEnd;
      uniform sampler2D uCadV2LineStyles;
      uniform int uCadV2LineStyleCount;
      uniform vec2 uCadV2ViewportResolution;
      uniform vec2 uCadV2PositionOffset;
      uniform vec2 uCadV2PositionScale;
      flat out vec3 vCadV2LineColor;
      vec4 getCadV2LineStyle(int styleIndex, int row) {
        return texelFetch(uCadV2LineStyles, ivec2(0, styleIndex * 2 + row), 0);
      }
      void main() {
        int low = 0;
        int high = uCadV2LineStyleCount - 1;
        int styleIndex = 0;
        for (int step = 0; step < 32; step++) {
          if (low > high) break;
          int middle = (low + high) / 2;
          vec4 rangeAndColor = getCadV2LineStyle(middle, 0);
          float sourceSegment = float(gl_InstanceID);
          if (sourceSegment < rangeAndColor.x) high = middle - 1;
          else if (sourceSegment >= rangeAndColor.y) low = middle + 1;
          else { styleIndex = middle; break; }
        }
        vec4 rangeAndColor = getCadV2LineStyle(styleIndex, 0);
        vec4 colorWidthVisibilityDepth = getCadV2LineStyle(styleIndex, 1);
        vec2 start = uCadV2PositionOffset + instanceStart * uCadV2PositionScale;
        vec2 end = uCadV2PositionOffset + instanceEnd * uCadV2PositionScale;
        vec2 delta = end - start;
        float segmentLength = length(delta);
        if (colorWidthVisibilityDepth.z < 0.5 || segmentLength < 1.0e-9) {
          gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
          vCadV2LineColor = vec3(0.0);
          return;
        }
        vec4 startClip = projectionMatrix * modelViewMatrix * vec4(start, colorWidthVisibilityDepth.w, 1.0);
        vec4 endClip = projectionMatrix * modelViewMatrix * vec4(end, colorWidthVisibilityDepth.w, 1.0);
        vec4 clipPosition = mix(startClip, endClip, position.x);
        if (colorWidthVisibilityDepth.y > 1.0e-4) {
          vec2 normal = vec2(-delta.y, delta.x) / segmentLength;
          vec2 point = mix(start, end, position.x) + normal * (colorWidthVisibilityDepth.y * position.y);
          clipPosition = projectionMatrix * modelViewMatrix * vec4(point, colorWidthVisibilityDepth.w, 1.0);
        } else {
          vec2 startNdc = startClip.xy / startClip.w;
          vec2 endNdc = endClip.xy / endClip.w;
          vec2 segmentPixels = (endNdc - startNdc) * uCadV2ViewportResolution * 0.5;
          float segmentPixelLength = length(segmentPixels);
          if (segmentPixelLength < 1.0e-5) {
            gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
            vCadV2LineColor = vec3(0.0);
            return;
          }
          vec2 normalPixels = vec2(-segmentPixels.y, segmentPixels.x) / segmentPixelLength;
          vec2 ndcOffset = normalPixels * position.y / uCadV2ViewportResolution;
          clipPosition.xy += ndcOffset * clipPosition.w;
        }
        gl_Position = clipPosition;
        vCadV2LineColor = vec3(rangeAndColor.z, rangeAndColor.w, colorWidthVisibilityDepth.x);
      }`,
    fragmentShader: `flat in vec3 vCadV2LineColor;
      out vec4 cadV2FragmentColor;
      #define gl_FragColor cadV2FragmentColor
      void main() {
        cadV2FragmentColor = vec4(vCadV2LineColor, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.frustumCulled = false;
  mesh.renderOrder = instances[0]!.renderOrder;
  mesh.name = "cad-v2-batched-lineweight";
  mesh.userData = {
    isLineweightMesh: true,
    isBatchedLineweightMesh: true,
    styleData,
    styleTexture,
    styleSegments,
  };
  return mesh;
}

function createCadV2SingleLineweightMesh(
  instance: CadV2BatchedLineInstance,
  source: CadV2PositionArray,
  positionCodec?: CadV2PositionCodec,
): THREE.Mesh | null {
  if (source instanceof Uint16Array && !positionCodec) return null;
  const positions = source.subarray(instance.firstVertex * 2, (instance.firstVertex + instance.vertexCount) * 2);
  const centerlineGeometry = new THREE.BufferGeometry();
  setCadV2Position2D(centerlineGeometry, positions);
  const color = createThreeColor(...instance.color);
  const centerlineMaterial = new THREE.LineBasicMaterial({
    color,
    transparent: false,
    opacity: 1,
    depthTest: false,
    depthWrite: false,
  });
  const centerline = new THREE.LineSegments(centerlineGeometry, centerlineMaterial);
  centerline.name = instance.layer;
  centerline.renderOrder = instance.renderOrder;
  centerline.userData = {
    isLineCenterline: true,
    lineweightMm: instance.lineweightMm,
    layer: instance.layer,
    originalColor: instance.color,
    isAci7: instance.isAci7,
    positionCodec,
  };
  centerlineMaterial.userData = { originalColor: instance.color, isAci7: instance.isAci7 };
  const mesh = createLineweightMesh(centerline);
  centerlineGeometry.dispose();
  centerlineMaterial.dispose();
  if (!mesh) return null;
  mesh.userData.isBatchedLineweightMesh = true;
  return mesh;
}

function updateCadV2BatchedLineweightStyles(mesh: THREE.Mesh, monochrome: boolean, isLightBackground: boolean): void {
  const metadata = (mesh.userData as any)?.styleSegments as Array<CadV2BatchedLineInstance & {
    styleIndex: number;
  }> | undefined;
  const styleData = (mesh.userData as any)?.styleData as Float32Array | undefined;
  const styleTexture = (mesh.userData as any)?.styleTexture as THREE.DataTexture | undefined;
  if (!metadata || !styleData || !styleTexture) return;
  metadata.forEach((instance, index) => {
    let [r, g, b] = instance.color;
    if (monochrome) r = g = b = isLightBackground ? 0.08 : 0.95;
    else if (isLightBackground && instance.isAci7) r = g = b = 0.08;
    const color = createThreeColor(r, g, b);
    const offset = index * 8;
    styleData[offset + 2] = color.r;
    styleData[offset + 3] = color.g;
    styleData[offset + 4] = color.b;
  });
  styleTexture.needsUpdate = true;
}

function setCadV2BatchedLineweightLayerVisibility(mesh: THREE.Mesh, layer: string, visible: boolean): void {
  const metadata = (mesh.userData as any)?.styleSegments as Array<CadV2BatchedLineInstance & {
    styleIndex: number;
  }> | undefined;
  const styleData = (mesh.userData as any)?.styleData as Float32Array | undefined;
  const styleTexture = (mesh.userData as any)?.styleTexture as THREE.DataTexture | undefined;
  if (!metadata || !styleData || !styleTexture) return;
  for (const instance of metadata) {
    if (instance.layer === layer) {
      styleData[instance.styleIndex * 8 + 6] = visible ? 1 : 0;
    }
  }
  styleTexture.needsUpdate = true;
}

function disposeCadV2LineweightMesh(mesh: THREE.Mesh): void {
  const styleTexture = (mesh.userData as any)?.styleTexture as THREE.DataTexture | undefined;
  styleTexture?.dispose();
  mesh.geometry.dispose();
  const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
  for (const material of materials) material.dispose();
}

function getCadV2ViewportResolution(renderer: THREE.WebGLRenderer): [number, number] {
  const size = new (THREE as any).Vector2();
  const getSize = (renderer as any).getSize;
  if (typeof getSize === "function") getSize.call(renderer, size);
  else {
    size.set(
      Math.max(1, (renderer as any).domElement?.clientWidth ?? 1),
      Math.max(1, (renderer as any).domElement?.clientHeight ?? 1),
    );
  }
  return [Math.max(1, size.x), Math.max(1, size.y)];
}

function insertCadV2ObjectAt(group: THREE.Group, object: any, index: number): void {
  group.add(object);
  const currentIndex = group.children.indexOf(object);
  const targetIndex = Math.max(0, Math.min(index, group.children.length - 1));
  if (currentIndex !== targetIndex) {
    group.children.splice(currentIndex, 1);
    group.children.splice(targetIndex, 0, object);
  }
}

function updateCadV2BatchedLineweightResolution(mesh: THREE.Mesh, resolution: [number, number]): void {
  const uniform = (mesh.material as THREE.ShaderMaterial)?.uniforms?.uCadV2ViewportResolution;
  if (uniform?.value?.set) uniform.value.set(Math.max(1, resolution[0]), Math.max(1, resolution[1]));
}

function suppressCenterlineForLineweight(centerline: THREE.LineSegments): void {
  const lineData = (centerline as any).userData ?? {};
  if (lineData.isDashed || lineData.lineweightSuppressed) return;
  const geometry = centerline.geometry as any;
  const position = geometry.getAttribute("position");
  if (!position) return;
  lineData.lineweightPositionAttribute = position;
  lineData.lineweightSuppressed = true;
  geometry.deleteAttribute("position");
  centerline.visible = false;
}

function restoreCenterlineAfterLineweight(centerline: THREE.LineSegments, visible: boolean): void {
  const lineData = (centerline as any).userData ?? {};
  if (!lineData.lineweightSuppressed || !lineData.lineweightPositionAttribute) return;
  (centerline.geometry as any).setAttribute("position", lineData.lineweightPositionAttribute);
  delete lineData.lineweightPositionAttribute;
  delete lineData.lineweightSuppressed;
  centerline.visible = visible;
}

export class CadV2Renderer {
  private canvas: HTMLCanvasElement;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.OrthographicCamera;
  private cameraAdapter: D3CameraAdapter;
  private pendingCameraChange = new PendingCameraChange<CadCameraState>();

  private isDirty = false;
  private rafId: number | null = null;
  private isDisposed = false;
  private disposedResources: Array<{ dispose: () => void }> = [];
  private readonly resourceOwnershipLedger = new CadV2ResourceOwnershipLedger((error) => {
    console.warn("[CadRenderer] Kaynak son-sahip dispose hatası:", error);
  });
  private resourceOwnerScene = `renderer-${nextRendererOwnerId++}`;
  private resourceOwnerGeneration = 0;
  private renderedFrameGate = new RenderedFrameGate();
  private chunkMutationRenderScheduler = new ChunkMutationRenderScheduler(() => this.invalidate(), 100);

  // Geometri kök grubu (kamera-bağıl ofset için)
  private contentGroup: THREE.Group;
  private painterPagesGroup: THREE.Group;
  private pendingPainterPageChunks: CadV2PainterPageChunk[] = [];
  private painterRenderPages = new Set<CadV2PainterRenderPage>();
  private painterPageMaxStyles = CAD_V2_PAINTER_PAGE_FALLBACK_STYLES;
  private defaultWorldOrigin: CadPoint2D;
  private layerVisibility = new Map<string, boolean>();
  private isMonochrome = false;
  private isLineweight = false;
  private backgroundColorHex: number;
  private activeFitBBox: CadBBox2D | null = null;
  private activeLayoutId = "Model";
  private chunkBounds = new Map<string, CadBBox2D>();
  private cameraRelativeChunkIds = new Set<string>();
  private resizeObserver: ResizeObserver | null = null;
  private boundContextLost: (e: Event) => void;
  private boundContextRestored: (e: Event) => void;
  private contextRecoveryTimer: any = null;
  private loadedChunks = new Map<string, LoadedChunkRecord>();
  private nonPainterDepthChunkIds = new Set<string>();
  private lastReportedSortObjects: boolean | null = null;

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
      depth: true,
      powerPreference: "default",
    });

    const gl = this.renderer.getContext() as WebGL2RenderingContext;
    this.painterPageMaxStyles = getCadV2PainterPageMaxStyles(gl.getParameter(gl.MAX_TEXTURE_SIZE));

    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setSize(width, height, false);
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
    this.painterPagesGroup = new THREE.Group();
    (this.painterPagesGroup as any).name = "cad-v2-painter-pages";
    this.scene.add(this.painterPagesGroup);

    // 3. d3-zoom kamera adaptörü
    this.cameraAdapter = new D3CameraAdapter({
      inputElement: options.inputOverlay,
      initialBBox: options.initialBBox,
      threeCamera: this.camera,
      onCameraChange: (camState) => {
        this.pendingCameraChange.enqueue(camState);
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
      this.renderedFrameGate.markContextLost();
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
      this.renderedFrameGate.markContextRestored();
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

  /** Coalesces per-chunk scene mutations during a bounded ingestion pass. */
  public beginChunkMutationBatch(): (flush?: boolean) => void {
    const endBatch = this.chunkMutationRenderScheduler?.begin();
    return (flush = true) => {
      if (flush) this.flushPendingPainterPageChunks();
      endBatch?.(flush);
    };
  }

  private requestChunkMutationRender(): void {
    if (this.chunkMutationRenderScheduler) this.chunkMutationRenderScheduler.request();
    else this.invalidate();
  }

  private renderFrame(): void {
    this.rafId = null;
    if (this.isDisposed || !this.isDirty) return;

    if (this.renderedFrameGate.isUnavailable() || this.canvas.getContext("webgl2")?.isContextLost()) return;
    this.isDirty = false;
    try {
        this.pendingCameraChange.flush((cameraState) => {
          this.updateCameraRelativeOffset(cameraState.center);
          this.updateChunkVisibility(cameraState);
        });
        this.renderer.render(this.scene, this.camera);
        if (!this.canvas.getContext("webgl2")?.isContextLost()) this.renderedFrameGate.markFrameRendered();
    } catch (error) {
      this.renderedFrameGate.markFrameFailed();
      console.error("[CadRenderer] Frame çizimi başarısız oldu:", error);
    }
  }

  /** Requests a frame and confirms that WebGL rendered it after context recovery. */
  public waitForNextRenderedFrame(timeoutMs = 15_000): Promise<boolean> {
    const pending = this.renderedFrameGate.waitForFrame(timeoutMs);
    if (!this.renderedFrameGate.isUnavailable()) this.invalidate();
    return pending;
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
    this.painterPagesGroup.position.set(dx, dy, 0);

    for (const chunkId of this.cameraRelativeChunkIds) {
      const chunk = this.loadedChunks.get(chunkId);
      if (!chunk) {
        this.cameraRelativeChunkIds.delete(chunkId);
        continue;
      }
      // A promoted chunk with no remaining children is represented by its shared
      // painter page, whose parent group was translated above. Retire the chunk id
      // from this hot path instead of rescanning every loaded chunk on every frame.
      if (chunk.painterPageChunk?.promoted && chunk.group.children.length === 0) {
        this.cameraRelativeChunkIds.delete(chunkId);
        continue;
      }
      chunk.group.position.set(chunk.origin[0] - cameraCenter[0], chunk.origin[1] - cameraCenter[1], 0);
    }
  }

  private createPainterTrianglePage(
    inputs: Array<{
      chunk: CadV2PainterPageChunk;
      command: CadV2BatchedLineRange;
      source: CadV2PositionArray;
      span: { startVertex: number; endVertex: number };
    }>,
  ): CadV2PainterRenderPage {
    if (inputs.length === 0 || inputs.length > this.painterPageMaxStyles) {
      throw new Error("CAD V2 painter triangle page has an invalid instance count");
    }
    const compact = inputs[0]!.source instanceof Uint16Array;
    if (inputs.some((input) => (input.source instanceof Uint16Array) !== compact)) {
      throw new Error("CAD V2 painter triangle page cannot mix compact and float position buffers");
    }
    const vertexCount = inputs.reduce((total, input) => total + input.command.totalVertices, 0);
    if (!Number.isSafeInteger(vertexCount) || vertexCount <= 0 || vertexCount > CAD_V2_PAINTER_PAGE_MAX_SEGMENTS * 2) {
      throw new Error("CAD V2 painter triangle page exceeds its bounded vertex capacity");
    }
    const source = compact ? new Uint16Array(vertexCount * 2) : new Float32Array(vertexCount * 2);
    const batchCommands: CadV2BatchedLineRange[] = [];
    const styles: CadV2PainterTrianglePageStyle[] = [];
    const activeChunks = new Set<CadV2PainterPageChunk>();
    let targetVertex = 0;
    let renderOrder = Number.POSITIVE_INFINITY;
    for (const input of inputs) {
      const { chunk, command, source: sourceChunk, span } = input;
      if (span.endVertex - span.startVertex !== command.totalVertices) {
        throw new Error("CAD V2 painter triangle page requires contiguous source vertices");
      }
      source.set(sourceChunk.subarray(span.startVertex * 2, span.endVertex * 2) as CadV2PositionArray, targetVertex * 2);
      batchCommands.push({
        ...command,
        runs: [{ firstVertex: targetVertex, vertexCount: command.totalVertices }],
      });
      const depthOrderIndex = command.lastGlobalOrderIndex ?? command.firstGlobalOrderIndex;
      const depthZ = typeof depthOrderIndex === "number"
        ? getCadV2PainterDepthZ(depthOrderIndex, chunk.globalOrderMax)
        : null;
      if (depthZ === null) throw new Error("CAD V2 painter triangle page requires a valid global draw order");
      styles.push({ chunk, instance: {
        layer: command.layer,
        color: command.color,
        isAci7: command.isAci7,
        lineweightMm: command.lineweightMm,
        renderOrder: command.renderOrder,
        firstVertex: targetVertex,
        vertexCount: command.totalVertices,
        globalOrderIndex: depthOrderIndex,
        painterDepthZ: depthZ,
      }, instanceId: styles.length, depthZ });
      activeChunks.add(chunk);
      renderOrder = Math.min(renderOrder, command.renderOrder);
      targetVertex += command.totalVertices;
    }

    const batch = createCadV2MultiDrawTriangleBatch(
      source,
      batchCommands,
      this.isLightBackground(),
      this.isMonochrome,
      this.layerVisibility,
      false,
      0,
      Number.isFinite(renderOrder) ? renderOrder : 0,
    );
    const material = batch.material as THREE.MeshBasicMaterial;
    material.depthTest = true;
    material.depthWrite = true;
    material.needsUpdate = true;
    batch.sortObjects = false;
    batch.perObjectFrustumCulled = false;
    batch.frustumCulled = false;
    const cameraWorldOrigin = this.cameraAdapter.getState().worldOrigin;
    for (const style of styles) {
      const matrix = new THREE.Matrix4().makeTranslation(
        style.chunk.origin[0] - cameraWorldOrigin[0],
        style.chunk.origin[1] - cameraWorldOrigin[1],
        style.depthZ,
      );
      batch.setMatrixAt(style.instanceId, matrix);
      batch.setVisibleAt(
        style.instanceId,
        style.chunk.active && style.chunk.visible && (this.layerVisibility.get(style.instance.layer) ?? true),
      );
    }
    batch.name = "cad-v2-painter-triangle-page";
    const page: CadV2PainterRenderPage = {
      kind: "triangle",
      mesh: batch,
      styles,
      activeChunks,
    };
    batch.userData = {
      isCadV2PainterTrianglePage: true,
      painterPage: page,
      instances: styles.map((style) => style.instance),
    };
    return page;
  }

  private createPainterPages(chunks: CadV2PainterPageChunk[]): CadV2PainterRenderPage[] {
    const pages: CadV2PainterRenderPage[] = [];
    const lineInputs: CadV2PainterLinePageInput[] = [];
    const triangleInputs: Array<{
      chunk: CadV2PainterPageChunk;
      command: CadV2BatchedLineRange;
      source: CadV2PositionArray;
      span: { startVertex: number; endVertex: number };
    }> = [];
    let lineSegments = 0;
    let triangleVertices = 0;
    let lineCompact: boolean | null = null;
    let triangleCompact: boolean | null = null;

    const flushLines = () => {
      if (lineInputs.length === 0) return;
      pages.push(createCadV2PainterLinePage(
        lineInputs.splice(0),
        this.isLightBackground(),
        this.isMonochrome,
        this.layerVisibility,
        this.isLineweight,
        getCadV2ViewportResolution(this.renderer),
        this.painterPageMaxStyles,
      ));
      lineSegments = 0;
      lineCompact = null;
    };
    const flushTriangles = () => {
      if (triangleInputs.length === 0) return;
      pages.push(this.createPainterTrianglePage(triangleInputs.splice(0)));
      triangleVertices = 0;
      triangleCompact = null;
    };

    for (const chunk of chunks) {
      if (!chunk.active) continue;
      for (const command of chunk.lineCommands) {
        if (!chunk.lineSource) throw new Error(`CAD V2 painter line source is missing for ${chunk.chunkId}`);
        const span = getContiguousVertexSpan(command.runs);
        if (!span || span.endVertex - span.startVertex !== command.totalVertices || command.totalVertices % 2 !== 0) {
          throw new Error(`CAD V2 painter line range is not contiguous for ${chunk.chunkId}`);
        }
        const commandSegments = command.totalVertices / 2;
        const compact = chunk.lineSource instanceof Uint16Array;
        if (lineInputs.length > 0 && (lineCompact !== compact ||
            lineInputs.length >= this.painterPageMaxStyles ||
            lineSegments + commandSegments > CAD_V2_PAINTER_PAGE_MAX_SEGMENTS)) flushLines();
        if (commandSegments > CAD_V2_PAINTER_PAGE_MAX_SEGMENTS) {
          throw new Error(`CAD V2 painter line command exceeds its page capacity for ${chunk.chunkId}`);
        }
        lineCompact = compact;
        lineInputs.push({ chunk, command, source: chunk.lineSource, span });
        lineSegments += commandSegments;
      }

      for (const command of chunk.triangleCommands) {
        if (!chunk.triangleSource) throw new Error(`CAD V2 painter triangle source is missing for ${chunk.chunkId}`);
        const span = getContiguousVertexSpan(command.runs);
        if (!span || span.endVertex - span.startVertex !== command.totalVertices) {
          throw new Error(`CAD V2 painter triangle range is not contiguous for ${chunk.chunkId}`);
        }
        const compact = chunk.triangleSource instanceof Uint16Array;
        if (triangleInputs.length > 0 && (triangleCompact !== compact ||
            triangleInputs.length >= this.painterPageMaxStyles ||
            triangleVertices + command.totalVertices > CAD_V2_PAINTER_PAGE_MAX_SEGMENTS * 2)) flushTriangles();
        if (command.totalVertices > CAD_V2_PAINTER_PAGE_MAX_SEGMENTS * 2) {
          throw new Error(`CAD V2 painter triangle command exceeds its page capacity for ${chunk.chunkId}`);
        }
        triangleCompact = compact;
        triangleInputs.push({ chunk, command, source: chunk.triangleSource, span });
        triangleVertices += command.totalVertices;
      }
    }
    flushLines();
    flushTriangles();
    return pages;
  }

  private queuePainterPageChunk(chunk: CadV2PainterPageChunk): void {
    if (!chunk.active || chunk.promoted || (chunk.lineCommands.length === 0 && chunk.triangleCommands.length === 0)) return;
    this.pendingPainterPageChunks.push(chunk);
    if (this.pendingPainterPageChunks.length < CAD_V2_PAINTER_PAGE_CHUNK_COUNT) return;
    const batch = this.pendingPainterPageChunks.splice(0, CAD_V2_PAINTER_PAGE_CHUNK_COUNT);
    this.promotePainterPageChunks(batch);
  }

  private flushPendingPainterPageChunks(): void {
    if (this.pendingPainterPageChunks.length === 0) return;
    this.promotePainterPageChunks(this.pendingPainterPageChunks.splice(0));
  }

  private reportPainterPromotionDiagnostic(event: CadV2PainterPromotionDiagnostic): void {
    if (typeof window === "undefined") return;
    const report = (window as Window & {
      __cadV2PainterPromotionDiagnostics?: (diagnostic: CadV2PainterPromotionDiagnostic) => void;
    }).__cadV2PainterPromotionDiagnostics;
    if (typeof report !== "function") return;
    try {
      report(event);
    } catch (error) {
      console.warn("[CadRenderer] Painter promotion diagnostic callback failed.", error);
    }
  }

  private hasPainterPromotionDiagnosticListener(): boolean {
    if (typeof window === "undefined") return false;
    return typeof (window as Window & {
      __cadV2PainterPromotionDiagnostics?: unknown;
    }).__cadV2PainterPromotionDiagnostics === "function";
  }

  private promotePainterPageChunks(chunks: CadV2PainterPageChunk[]): void {
    const currentChunks = chunks.filter((chunk) => chunk.active &&
      this.loadedChunks.get(chunk.chunkId)?.painterPageChunk === chunk);
    if (currentChunks.length === 0) {
      this.reportPainterPromotionDiagnostic({
        outcome: "stale",
        requestedChunkCount: chunks.length,
        currentChunkCount: 0,
        pageCount: 0,
        promotedChunkCount: 0,
        remainingGroupCount: 0,
        remainingObjectCount: 0,
        remainingObjectCountsByName: {},
        cameraRelativeChunkCount: this.cameraRelativeChunkIds.size,
      });
      return;
    }

    const temporaryPageGroup = new THREE.Group();
    let pages: CadV2PainterRenderPage[] = [];
    const originalObjectsByChunk = new Map<CadV2PainterPageChunk, any[]>();
    const committedChunks: CadV2PainterPageChunk[] = [];
    try {
      pages = this.createPainterPages(currentChunks);
      if (pages.length === 0) {
        this.reportPainterPromotionDiagnostic({
          outcome: "empty-pages",
          requestedChunkCount: chunks.length,
          currentChunkCount: currentChunks.length,
          pageCount: 0,
          promotedChunkCount: 0,
          remainingGroupCount: currentChunks.length,
          remainingObjectCount: currentChunks.reduce((total, chunk) =>
            total + (this.loadedChunks.get(chunk.chunkId)?.group.children.length ?? 0), 0),
          remainingObjectCountsByName: {},
          cameraRelativeChunkCount: this.cameraRelativeChunkIds.size,
        });
        return;
      }
      for (const page of pages) temporaryPageGroup.add(page.mesh);

      const pageEstimate = estimateThreeGroupBufferBytes(temporaryPageGroup);
      const removedObjects: unknown[] = [];
      for (const chunk of currentChunks) {
        const item = this.loadedChunks.get(chunk.chunkId)!;
        const objects = item.group.children.filter((child: any) => this.isPainterChunkRenderObject(child));
        originalObjectsByChunk.set(chunk, objects);
        removedObjects.push(...objects);
      }
      const removedResources = collectChunkOwnedResources({ children: removedObjects });
      const currentEstimate = this.resourceOwnershipLedger.getAggregateByteEstimate();
      const removedCpuBytes = removedResources
        .reduce((total, resource) => total + resource.byteEstimate.cpuResidentBytes, 0);
      const removedGpuBytes = removedResources
        .reduce((total, resource) => total + resource.byteEstimate.gpuBufferBytesEstimate, 0);
      const projected = evaluateCadV2ResourceBudget(
        Math.max(0, currentEstimate.cpuResidentBytes - removedCpuBytes) + pageEstimate.cpuResidentBytes,
        Math.max(0, currentEstimate.gpuBufferBytesEstimate - removedGpuBytes) + pageEstimate.gpuBufferBytesEstimate,
        CAD_V2_CPU_RESIDENT_BUDGET_BYTES,
        CAD_V2_GPU_BUFFER_BUDGET_BYTES,
      );
      if (!projected.withinBudget) {
        disposeUnregisteredGroup(temporaryPageGroup);
        this.reportPainterPromotionDiagnostic({
          outcome: "budget-rejected",
          requestedChunkCount: chunks.length,
          currentChunkCount: currentChunks.length,
          pageCount: pages.length,
          promotedChunkCount: 0,
          remainingGroupCount: currentChunks.length,
          remainingObjectCount: removedObjects.length,
          remainingObjectCountsByName: {},
          cameraRelativeChunkCount: this.cameraRelativeChunkIds.size,
          currentCpuBytes: currentEstimate.cpuResidentBytes,
          currentGpuBytes: currentEstimate.gpuBufferBytesEstimate,
          removedCpuBytes,
          removedGpuBytes,
          pageCpuBytes: pageEstimate.cpuResidentBytes,
          pageGpuBytes: pageEstimate.gpuBufferBytesEstimate,
          projectedCpuBytes: projected.cpuResidentBytes,
          projectedGpuBytes: projected.gpuBufferBytesEstimate,
          cpuBudgetBytes: CAD_V2_CPU_RESIDENT_BUDGET_BYTES,
          gpuBudgetBytes: CAD_V2_GPU_BUFFER_BUDGET_BYTES,
        });
        console.warn("[CadRenderer] Painter page promotion skipped by the resident resource budget.", {
          chunkCount: currentChunks.length,
          projectedCpuBytes: projected.cpuResidentBytes,
          projectedGpuBytes: projected.gpuBufferBytesEstimate,
        });
        return;
      }

      for (const page of pages) {
        for (let index = 0; index < page.styles.length; index++) {
          const style = page.styles[index]!;
          style.chunk.pages.add(page);
          style.chunk.styleRefs.push({ page, index });
        }
        this.painterPagesGroup.add(page.mesh);
        this.painterRenderPages.add(page);
      }
      for (const chunk of currentChunks) {
        const item = this.loadedChunks.get(chunk.chunkId)!;
        for (const child of [...item.group.children]) {
          if (this.isPainterChunkRenderObject(child)) item.group.remove(child);
        }
        item.painterPageMeshes = [...chunk.pages].map((page) => page.mesh);
        chunk.promoted = true;
        if (item.group.children.length === 0) {
          this.scene.remove(item.group);
          this.cameraRelativeChunkIds.delete(chunk.chunkId);
        }
        committedChunks.push(chunk);
        this.refreshChunkResourceLease(chunk.chunkId, item);
      }
      for (const chunk of currentChunks) {
        chunk.lineSource = null;
        chunk.triangleSource = null;
        chunk.lineCommands = [];
        chunk.triangleCommands = [];
      }
      for (const page of pages) {
        const diagnostics = typeof window !== "undefined" ? (window as any).__cadV2PainterPageDiagnostics : null;
        if (typeof diagnostics === "function") {
          try {
            diagnostics({
              kind: page.kind,
              pageMeshCount: pages.length,
              pageStyleCount: page.styles.length,
              pageChunkCount: page.activeChunks.size,
              cameraRelativeChunkCount: this.cameraRelativeChunkIds.size,
              cpuResidentBytes: pageEstimate.cpuResidentBytes,
              gpuBufferBytesEstimate: pageEstimate.gpuBufferBytesEstimate,
            });
          } catch (diagnosticError) {
            console.warn("[CadRenderer] Painter page diagnostic callback failed.", diagnosticError);
          }
        }
      }
      if (this.hasPainterPromotionDiagnosticListener()) {
        const remainingObjectCountsByName: Record<string, number> = {};
        let remainingGroupCount = 0;
        let remainingObjectCount = 0;
        for (const chunk of currentChunks) {
          const group = this.loadedChunks.get(chunk.chunkId)?.group;
          if (!group) continue;
          if (group.children.length > 0) remainingGroupCount++;
          for (const child of group.children) {
            remainingObjectCount++;
            const objectName = child.name || child.type || "unnamed";
            remainingObjectCountsByName[objectName] = (remainingObjectCountsByName[objectName] ?? 0) + 1;
          }
        }
        this.reportPainterPromotionDiagnostic({
          outcome: "promoted",
          requestedChunkCount: chunks.length,
          currentChunkCount: currentChunks.length,
          pageCount: pages.length,
          promotedChunkCount: committedChunks.length,
          remainingGroupCount,
          remainingObjectCount,
          remainingObjectCountsByName,
          cameraRelativeChunkCount: this.cameraRelativeChunkIds.size,
          currentCpuBytes: currentEstimate.cpuResidentBytes,
          currentGpuBytes: currentEstimate.gpuBufferBytesEstimate,
          removedCpuBytes,
          removedGpuBytes,
          pageCpuBytes: pageEstimate.cpuResidentBytes,
          pageGpuBytes: pageEstimate.gpuBufferBytesEstimate,
          projectedCpuBytes: projected.cpuResidentBytes,
          projectedGpuBytes: projected.gpuBufferBytesEstimate,
          cpuBudgetBytes: CAD_V2_CPU_RESIDENT_BUDGET_BYTES,
          gpuBudgetBytes: CAD_V2_GPU_BUFFER_BUDGET_BYTES,
        });
      }
    } catch (error) {
      for (const chunk of committedChunks) {
        const item = this.loadedChunks.get(chunk.chunkId);
        if (!item) continue;
        for (const object of originalObjectsByChunk.get(chunk) ?? []) item.group.add(object);
        item.painterPageMeshes = [];
        chunk.promoted = false;
        this.cameraRelativeChunkIds.add(chunk.chunkId);
        if (!(this.scene as any).children.includes(item.group)) this.scene.add(item.group);
        try {
          this.refreshChunkResourceLease(chunk.chunkId, item);
        } catch (rollbackError) {
          console.warn("[CadRenderer] Painter page ownership rollback failed.", rollbackError);
        }
      }
      for (const chunk of currentChunks) {
        chunk.pages.clear();
        chunk.styleRefs = [];
      }
      for (const page of pages) {
        this.painterPagesGroup.remove(page.mesh);
        this.painterRenderPages.delete(page);
        temporaryPageGroup.add(page.mesh);
      }
      if (temporaryPageGroup.children.length > 0) disposeUnregisteredGroup(temporaryPageGroup);
      if (this.hasPainterPromotionDiagnosticListener()) {
        this.reportPainterPromotionDiagnostic({
          outcome: "rollback",
          requestedChunkCount: chunks.length,
          currentChunkCount: currentChunks.length,
          pageCount: pages.length,
          promotedChunkCount: 0,
          remainingGroupCount: currentChunks.filter((chunk) =>
            (this.loadedChunks.get(chunk.chunkId)?.group.children.length ?? 0) > 0).length,
          remainingObjectCount: currentChunks.reduce((total, chunk) =>
            total + (this.loadedChunks.get(chunk.chunkId)?.group.children.length ?? 0), 0),
          remainingObjectCountsByName: {},
          cameraRelativeChunkCount: this.cameraRelativeChunkIds.size,
          error: error instanceof Error ? error.message : String(error),
        });
      }
      console.warn("[CadRenderer] Painter page promotion skipped; existing chunk render objects remain active.", error);
    }
  }

  private isPainterChunkRenderObject(object: CadRenderableLike): boolean {
    const userData = (object as any).userData ?? {};
    return object.name === "cad-v2-multidraw-lines" ||
      object.name === "cad-v2-multidraw-triangles" ||
      userData.lineBatchRebuild !== undefined ||
      userData.isBatchedLineweightMesh === true ||
      userData.isLineweightMesh === true;
  }

  private updatePainterLineStyle(page: CadV2PainterRenderPage, index: number): void {
    if (page.kind !== "line" || !page.styleData || !page.styleTexture) return;
    const style = page.styles[index] as CadV2PainterLinePageStyle | undefined;
    if (!style) return;
    const chunk = style.chunk;
    const instance = style.instance;
    let [r, g, b] = instance.color;
    const isLight = this.isLightBackground();
    if (this.isMonochrome) r = g = b = isLight ? 0.08 : 0.95;
    else if (isLight && instance.isAci7) r = g = b = 0.08;
    const color = createThreeColor(r, g, b);
    const offset = index * 12;
    page.styleData[offset + 2] = color.r;
    page.styleData[offset + 3] = color.g;
    page.styleData[offset + 4] = color.b;
    page.styleData[offset + 5] = this.isLineweight ? instance.lineweightMm / 2 : 0;
    page.styleData[offset + 6] = chunk.active && chunk.visible && (this.layerVisibility.get(instance.layer) ?? true) ? 1 : 0;
    page.styleTexture.needsUpdate = true;
  }

  private updatePainterPageChunkVisibility(chunk: CadV2PainterPageChunk): void {
    for (const reference of chunk.styleRefs) {
      if (reference.page.kind === "line") {
        this.updatePainterLineStyle(reference.page, reference.index);
      } else {
        const style = reference.page.styles[reference.index] as CadV2PainterTrianglePageStyle | undefined;
        const batch = reference.page.mesh as CadV2BatchedMesh;
        if (style) batch.setVisibleAt(reference.index, chunk.active && chunk.visible &&
          (this.layerVisibility.get(style.instance.layer) ?? true));
      }
    }
  }

  private updatePainterPageThemes(): void {
    for (const page of this.painterRenderPages) {
      if (page.kind === "line") {
        for (let index = 0; index < page.styles.length; index++) this.updatePainterLineStyle(page, index);
        continue;
      }
      for (let index = 0; index < page.styles.length; index++) {
        const style = page.styles[index] as CadV2PainterTrianglePageStyle;
        const batch = page.mesh as CadV2BatchedMesh;
        let [r, g, b] = style.instance.color;
        const isLight = this.isLightBackground();
        if (this.isMonochrome) r = g = b = isLight ? 0.08 : 0.95;
        else if (isLight && style.instance.isAci7) r = g = b = 0.08;
        batch.setColorAt(index, createThreeColor(r, g, b));
        batch.setVisibleAt(index, style.chunk.active && style.chunk.visible &&
          (this.layerVisibility.get(style.instance.layer) ?? true));
      }
    }
  }

  private retirePainterPageChunk(
    chunk: CadV2PainterPageChunk | undefined,
    refreshStyleVisibility = true,
    removeFromPending = true,
  ): void {
    if (!chunk || !chunk.active) return;
    chunk.active = false;
    chunk.visible = false;
    if (removeFromPending) {
      this.pendingPainterPageChunks = this.pendingPainterPageChunks.filter((pending) => pending !== chunk);
    }
    if (refreshStyleVisibility) this.updatePainterPageChunkVisibility(chunk);
    for (const page of chunk.pages) {
      page.activeChunks.delete(chunk);
      if (page.activeChunks.size === 0) {
        this.painterPagesGroup.remove(page.mesh);
        this.painterRenderPages.delete(page);
      }
    }
    chunk.pages.clear();
    chunk.styleRefs = [];
    chunk.lineSource = null;
    chunk.triangleSource = null;
    chunk.lineCommands = [];
    chunk.triangleCommands = [];
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
    let resourceLease: { release: () => void } | null = null;
    let painterPageChunk: CadV2PainterPageChunk | undefined;
    try {
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
      globalOrderEndIndex?: number;
      alpha?: number;
      isAci7?: boolean;
      lineweightMm?: number;
      dashStyle?: { dashSize: number; gapSize: number; pattern?: number[] };
    }> = chunk.meta?.drawCommands || [];
    const globalOrderMax = chunk.meta?.globalOrderMax;
    const painterDepthRuns = Number.isSafeInteger(globalOrderMax) && globalOrderMax! >= 0 &&
      globalOrderMax! <= CAD_V2_PAINTER_DEPTH_MAX_ORDER;
    const lineSourceRuns = drawCommands
      .filter((command) => command.kind === "line")
      .map(({ firstVertex, vertexCount }) => ({ firstVertex, vertexCount }));
    const triangleSourceRuns = drawCommands
      .filter((command) => command.kind === "triangle" || command.kind === "wipeout")
      .map(({ firstVertex, vertexCount }) => ({ firstVertex, vertexCount }));
    const shareLinePositionSource = vertexRangesCoverSource(lineSourceRuns, chunk.xyArray.length / 2);
    const shareTrianglePositionSource = vertexRangesCoverSource(
      triangleSourceRuns,
      (chunk.trianglesArray?.length ?? 0) / 2,
    );
    let usesPainterDepthBatch = false;

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
        isAci7: boolean;
        firstGlobalOrderIndex: number | null;
        lastGlobalOrderIndex: number | null;
        globalOrderIsContiguous: boolean;
        dashStyle?: { dashSize: number; gapSize: number; pattern?: number[] };
      }> = [];

      for (const cmd of drawCommands) {
        const last = mergedCommands[mergedCommands.length - 1];
        const cmdLw = cmd.lineweightMm ?? 0;
        const cmdIsAci7 = cmd.isAci7 === true;
        const commandGlobalOrderIndex = Number.isSafeInteger(cmd.globalOrderIndex) ? cmd.globalOrderIndex! : null;
        const commandGlobalOrderEndIndex = Number.isSafeInteger(cmd.globalOrderEndIndex)
          ? cmd.globalOrderEndIndex!
          : commandGlobalOrderIndex;
        const commandRenderOrder = resolveDrawCommandRenderOrder(
          cmd.globalOrderIndex,
          baseOrder + mergedCommands.length,
        );
        if (
          last &&
          last.kind === cmd.kind &&
          (!painterDepthRuns || (
            last.firstGlobalOrderIndex !== null &&
            last.firstGlobalOrderIndex === last.lastGlobalOrderIndex &&
            commandGlobalOrderIndex !== null &&
            commandGlobalOrderIndex === commandGlobalOrderEndIndex &&
            commandGlobalOrderIndex === last.firstGlobalOrderIndex
          )) &&
          last.layer === cmd.layer &&
          Math.abs(last.lineweightMm - cmdLw) < 1e-4 &&
          Math.abs(last.color[0] - cmd.color[0]) < 1e-4 &&
          Math.abs(last.color[1] - cmd.color[1]) < 1e-4 &&
          Math.abs(last.color[2] - cmd.color[2]) < 1e-4 &&
          last.isAci7 === cmdIsAci7 &&
          last.dashStyle?.dashSize === cmd.dashStyle?.dashSize &&
          last.dashStyle?.gapSize === cmd.dashStyle?.gapSize &&
          JSON.stringify(last.dashStyle?.pattern) === JSON.stringify(cmd.dashStyle?.pattern) &&
          cmd.kind !== "wipeout" // Wipeout maskeleri ayrık tutulur
        ) {
          last.totalVertices += cmd.vertexCount;
          last.runs.push({ firstVertex: cmd.firstVertex, vertexCount: cmd.vertexCount });
          last.globalOrderIsContiguous = last.globalOrderIsContiguous &&
            last.lastGlobalOrderIndex !== null && commandGlobalOrderIndex === last.lastGlobalOrderIndex + 1 &&
            commandGlobalOrderEndIndex !== null && commandGlobalOrderEndIndex >= commandGlobalOrderIndex!;
          last.lastGlobalOrderIndex = commandGlobalOrderEndIndex;
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
            isAci7: cmdIsAci7,
            firstGlobalOrderIndex: commandGlobalOrderIndex,
            lastGlobalOrderIndex: commandGlobalOrderEndIndex,
            globalOrderIsContiguous: commandGlobalOrderIndex !== null && commandGlobalOrderEndIndex !== null &&
              commandGlobalOrderEndIndex >= commandGlobalOrderIndex,
            ...(cmd.dashStyle ? { dashStyle: cmd.dashStyle } : {}),
          });
        }
      }

      const supportsMultiDraw = supportsCadV2MultiDraw(this.renderer.getContext() as WebGL2RenderingContext);
      const painterDepthFallbackReasons = [
        ...(!supportsMultiDraw ? ["webgl-multi-draw-unavailable"] : []),
        ...(!painterDepthRuns ? ["global-order-range-unavailable"] : []),
        ...(mergedCommands.some((command) => command.kind === "line") && !shareLinePositionSource
          ? ["line-source-ranges-incomplete"] : []),
        ...(mergedCommands.some((command) => command.kind === "triangle") && !shareTrianglePositionSource
          ? ["triangle-source-ranges-incomplete"] : []),
        ...(mergedCommands.some((command) => command.kind !== "line" && command.kind !== "triangle")
          ? ["unsupported-primitive-kind"] : []),
        ...(mergedCommands.some((command) => command.alpha !== 1 || Boolean(command.dashStyle))
          ? ["transparency-or-dash"] : []),
        ...(mergedCommands.some((command) => command.totalVertices <= 0 || getContiguousVertexSpan(command.runs) === null)
          ? ["noncontiguous-command-range"] : []),
        ...(mergedCommands.some((command) => {
          const orderIndex = command.lastGlobalOrderIndex ?? command.firstGlobalOrderIndex;
          return typeof orderIndex !== "number" || getCadV2PainterDepthZ(orderIndex, globalOrderMax) === null;
        }) ? ["invalid-command-order"] : []),
      ];
      const painterLineCommands = mergedCommands.filter((command) => command.kind === "line");
      const painterTriangleCommands = mergedCommands.filter((command) => command.kind === "triangle");
      const canUsePainterDepthBatches = supportsMultiDraw && painterDepthRuns &&
        (painterLineCommands.length === 0 || shareLinePositionSource) &&
        (painterTriangleCommands.length === 0 || shareTrianglePositionSource) && mergedCommands.length > 0 &&
        mergedCommands.every((command) => {
          const orderIndex = command.lastGlobalOrderIndex ?? command.firstGlobalOrderIndex;
          return (command.kind === "line" || command.kind === "triangle") &&
            command.alpha === 1 && !command.dashStyle && command.totalVertices > 0 &&
            getContiguousVertexSpan(command.runs) !== null &&
            typeof orderIndex === "number" && getCadV2PainterDepthZ(orderIndex, globalOrderMax) !== null;
        });
      let painterDepthBatchesInstalled = false;
      const batchDiagnostics = typeof window !== "undefined"
        ? (window as any).__cadV2BatchDiagnostics
        : null;
      if (canUsePainterDepthBatches) {
        const lineCommands = painterLineCommands as CadV2BatchedLineRange[];
        const triangleCommands = painterTriangleCommands as CadV2BatchedLineRange[];
        if (lineCommands.length > 0 || triangleCommands.length > 0) {
          painterPageChunk = {
            chunkId: chunk.chunkId,
            lineSource: lineCommands.length > 0 ? chunk.xyArray : null,
            lineCommands,
            triangleSource: triangleCommands.length > 0 ? chunk.trianglesArray ?? null : null,
            triangleCommands,
            origin: [chunk.origin[0], chunk.origin[1]],
            worldOrigin: [this.cameraAdapter.getState().worldOrigin[0], this.cameraAdapter.getState().worldOrigin[1]],
            positionCodec: chunk.positionCodec,
            globalOrderMax: globalOrderMax!,
            visible: chunkGroup.visible,
            active: true,
            promoted: false,
            pages: new Set(),
            styleRefs: [],
          };
        }
        const chunkRenderOrder = Math.min(...mergedCommands.map((command) =>
          command.firstGlobalOrderIndex ?? command.renderOrder));
        const lineBatch = lineCommands.length > 0
          ? createCadV2MultiDrawLineBatch(
            chunk.xyArray,
            lineCommands,
            isLight,
            this.isMonochrome,
            this.layerVisibility,
            true,
            globalOrderMax,
            chunkRenderOrder,
            chunk.positionCodec,
          )
          : null;
        const lineweightMesh = lineBatch && this.isLineweight && lineCommands.some((command) => command.lineweightMm > 1e-4)
          ? createCadV2BatchedLineweightMesh(
            (lineBatch.userData as { instances: CadV2BatchedLineInstance[] }).instances,
            chunk.xyArray,
            isLight,
            this.isMonochrome,
            this.layerVisibility,
            true,
            getCadV2ViewportResolution(this.renderer),
            chunk.positionCodec,
          )
          : null;
        if (lineBatch) {
          const batchData = lineBatch.userData as {
            instances: CadV2BatchedLineInstance[];
            lineweightMeshes: Array<{ instanceIds: number[]; mesh: THREE.Mesh }>;
            lineBatchRebuild: CadV2LineBatchRebuild;
          };
          if (lineweightMesh) {
            lineweightMesh.renderOrder = chunkRenderOrder;
            lineweightMesh.userData.lineBatchRebuild = batchData.lineBatchRebuild;
            chunkGroup.add(lineweightMesh);
            disposeUnregisteredGroup(Object.assign(new THREE.Group(), { children: [lineBatch] }));
          } else {
            chunkGroup.add(lineBatch);
            if (this.isLineweight) {
              batchData.instances.forEach((instance, instanceId) => {
                if (instance.lineweightMm <= 1e-4) return;
                const mesh = createCadV2SingleLineweightMesh(instance, chunk.xyArray, chunk.positionCodec);
                if (!mesh) return;
                mesh.name = instance.layer;
                mesh.renderOrder = instance.renderOrder;
                mesh.visible = this.layerVisibility.get(instance.layer) ?? true;
                chunkGroup.add(mesh);
                lineBatch.setVisibleAt(instanceId, false);
                batchData.lineweightMeshes.push({ instanceIds: [instanceId], mesh });
              });
            }
          }
        }
        if (triangleCommands.length > 0) {
          chunkGroup.add(createCadV2MultiDrawTriangleBatch(
            chunk.trianglesArray!,
            triangleCommands,
            isLight,
            this.isMonochrome,
            this.layerVisibility,
            true,
            globalOrderMax,
            chunkRenderOrder,
          ));
        }
        painterDepthBatchesInstalled = true;
        usesPainterDepthBatch = true;
        if (typeof batchDiagnostics === "function") {
          batchDiagnostics({
            chunkId: chunk.chunkId,
            instanceCount: mergedCommands.length,
            painterDepthEvaluated: true,
            painterDepthBatch: true,
            lineInstanceCount: lineCommands.length,
            triangleInstanceCount: triangleCommands.length,
          });
        }
      } else if (typeof batchDiagnostics === "function") {
        batchDiagnostics({
          chunkId: chunk.chunkId,
          painterDepthEvaluated: true,
          painterDepthBatch: false,
          painterDepthFallbackReasons,
        });
      }

      for (let cmdIdx = 0; !painterDepthBatchesInstalled && cmdIdx < mergedCommands.length;) {
        const cmd = mergedCommands[cmdIdx];
        const isMultiDrawTriangleCandidate = (candidate: typeof cmd) => Boolean(
          supportsMultiDraw && shareTrianglePositionSource && candidate.kind === "triangle" &&
          candidate.globalOrderIsContiguous && candidate.firstGlobalOrderIndex !== null &&
          candidate.lastGlobalOrderIndex !== null && candidate.alpha === 1 &&
          candidate.totalVertices % 3 === 0 && getContiguousVertexSpan(candidate.runs),
        );
        if (isMultiDrawTriangleCandidate(cmd)) {
          const run = [cmd];
          while (cmdIdx + run.length < mergedCommands.length) {
            const next = mergedCommands[cmdIdx + run.length];
            const previous = run[run.length - 1]!;
            if (!isMultiDrawTriangleCandidate(next) || previous.lastGlobalOrderIndex === null ||
                next.firstGlobalOrderIndex !== previous.lastGlobalOrderIndex + 1) break;
            run.push(next);
          }
          if (run.length > 1) {
            const triangleBatch = createCadV2MultiDrawTriangleBatch(
              chunk.trianglesArray!,
              run as CadV2BatchedLineRange[],
              isLight,
              this.isMonochrome,
              this.layerVisibility,
            );
            chunkGroup.add(triangleBatch);
            const batchDiagnostics = typeof window !== "undefined"
              ? (window as any).__cadV2BatchDiagnostics
              : null;
            if (typeof batchDiagnostics === "function") {
              batchDiagnostics({ chunkId: chunk.chunkId, instanceCount: run.length });
            }
            cmdIdx += run.length;
            continue;
          }
        }
        const isMultiDrawLineCandidate = (candidate: typeof cmd) => Boolean(
          supportsMultiDraw && shareLinePositionSource && candidate.kind === "line" &&
          candidate.globalOrderIsContiguous && candidate.firstGlobalOrderIndex !== null &&
          candidate.lastGlobalOrderIndex !== null && candidate.alpha === 1 && !candidate.dashStyle &&
          getContiguousVertexSpan(candidate.runs),
        );
        if (isMultiDrawLineCandidate(cmd)) {
          const run = [cmd];
          while (cmdIdx + run.length < mergedCommands.length) {
            const next = mergedCommands[cmdIdx + run.length];
            const previous = run[run.length - 1]!;
            if (!isMultiDrawLineCandidate(next) || previous.lastGlobalOrderIndex === null ||
                next.firstGlobalOrderIndex !== previous.lastGlobalOrderIndex + 1) break;
            run.push(next);
          }
          if (run.length > 1) {
            const subruns: CadV2BatchedLineRange[][] = [];
            let currentSubrun: CadV2BatchedLineRange[] = [];
            let currentIsWeighted: boolean | null = null;
            let currentEndVertex: number | null = null;
            for (const command of run as CadV2BatchedLineRange[]) {
              const span = getContiguousVertexSpan(command.runs);
              const isWeighted = command.lineweightMm > 1e-4;
              if (
                currentSubrun.length > 0 &&
                (currentIsWeighted !== isWeighted || !span || currentEndVertex !== span.startVertex)
              ) {
                subruns.push(currentSubrun);
                currentSubrun = [];
                currentEndVertex = null;
              }
              currentSubrun.push(command);
              currentIsWeighted = isWeighted;
              currentEndVertex = span?.endVertex ?? null;
            }
            if (currentSubrun.length > 0) subruns.push(currentSubrun);

            for (const subrun of subruns) {
              const batch = createCadV2MultiDrawLineBatch(
                chunk.xyArray,
                subrun,
                isLight,
                this.isMonochrome,
                this.layerVisibility,
                false,
                0,
                undefined,
                chunk.positionCodec,
              );
              const batchData = batch.userData as {
                instances: CadV2BatchedLineInstance[];
                source: CadV2PositionArray;
                lineweightMeshes: Array<{ instanceIds: number[]; mesh: THREE.Mesh }>;
                lineBatchRebuild: CadV2LineBatchRebuild;
              };
              const isWeightedRun = subrun[0]!.lineweightMm > 1e-4;
              let replacedByLineweightMesh = false;
              if (this.isLineweight && isWeightedRun) {
                const mesh = createCadV2BatchedLineweightMesh(
                  batchData.instances,
                  batchData.source,
                  isLight,
                  this.isMonochrome,
                  this.layerVisibility,
                  false,
                  getCadV2ViewportResolution(this.renderer),
                  chunk.positionCodec,
                );
                if (mesh) {
                  mesh.userData.lineBatchRebuild = batchData.lineBatchRebuild;
                  chunkGroup.add(mesh);
                  disposeUnregisteredGroup(Object.assign(new THREE.Group(), { children: [batch] }));
                  replacedByLineweightMesh = true;
                }
              }
              if (!replacedByLineweightMesh) {
                chunkGroup.add(batch);
                if (this.isLineweight && isWeightedRun) {
                  const instanceIds = batchData.instances.map((_, index) => index);
                  batchData.instances.forEach((instance, instanceId) => {
                    const singleMesh = createCadV2SingleLineweightMesh(instance, batchData.source, chunk.positionCodec);
                    if (!singleMesh) return;
                    singleMesh.name = instance.layer;
                    singleMesh.renderOrder = instance.renderOrder;
                    singleMesh.visible = this.layerVisibility.get(instance.layer) ?? true;
                    chunkGroup.add(singleMesh);
                    batch.setVisibleAt(instanceId, false);
                    batchData.lineweightMeshes.push({ instanceIds: [instanceId], mesh: singleMesh });
                  });
                }
              }
              const batchDiagnostics = typeof window !== "undefined"
                ? (window as any).__cadV2BatchDiagnostics
                : null;
              if (typeof batchDiagnostics === "function") {
                batchDiagnostics({ chunkId: chunk.chunkId, instanceCount: subrun.length });
              }
            }
            cmdIdx += run.length;
            continue;
          }
        }
        if (cmd.totalVertices === 0) {
          cmdIdx++;
          continue;
        }

        let r = cmd.color[0] ?? 0.9;
        let g = cmd.color[1] ?? 0.9;
        let b = cmd.color[2] ?? 0.9;
        const isAci7 = cmd.isAci7;

        if (cmd.kind === "line") {
          const xy = chunk.xyArray;
          // CAD V2 scene coordinates are 2D; the WebGL vertex fetch supplies z=0 for this vec3 shader input.
          const pos = selectOrPackVertexRanges(xy, cmd.runs, cmd.totalVertices, 2, shareLinePositionSource);
          const lineDistances = cmd.dashStyle
            ? selectOrPackVertexRanges(
              chunk.pathDistancesArray ?? new Float32Array(),
              cmd.runs,
              cmd.totalVertices,
              1,
              true,
            )
            : null;
          if (lineDistances && (!chunk.pathDistancesArray || chunk.pathDistancesArray.length < xy.length / 2)) {
            throw new Error(`DASHED draw command in chunk ${chunk.chunkId} requires aligned PATH_DISTANCE values`);
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
          setCadV2Position2D(geom, pos);
          if (lineDistances) geom.setAttribute("lineDistance", new THREE.BufferAttribute(lineDistances, 1));
          const matColor = createThreeColor(r, g, b);
          const materialOptions = {
            color: matColor,
            transparent: cmd.alpha !== undefined && cmd.alpha < 1,
            opacity: cmd.alpha ?? 1,
            depthTest: false,
            depthWrite: false,
          };
          const multiTermPattern = cmd.dashStyle?.pattern;
          const mat = multiTermPattern
            ? new THREE.ShaderMaterial({
                transparent: materialOptions.transparent,
                depthTest: false,
                depthWrite: false,
                uniforms: {
                  uColor: { value: matColor },
                  uOpacity: { value: materialOptions.opacity },
                  uPattern: { value: new Float32Array([...multiTermPattern, ...Array(12 - multiTermPattern.length).fill(0)]) },
                  uPatternCount: { value: multiTermPattern.length },
                  uPeriod: { value: multiTermPattern.reduce((sum, term) => sum + Math.abs(term), 0) },
                },
                vertexShader: `attribute float lineDistance;
                  varying float vPathDistance;
                  void main() {
                    vPathDistance = lineDistance;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                  }`,
                fragmentShader: `uniform vec3 uColor;
                  uniform float uOpacity;
                  uniform float uPattern[12];
                  uniform int uPatternCount;
                  uniform float uPeriod;
                  varying float vPathDistance;
                  void main() {
                    float phase = mod(vPathDistance, uPeriod);
                    float edge = 0.0;
                    bool draw = false;
                    for (int i = 0; i < 12; i++) {
                      if (i >= uPatternCount) break;
                      edge += abs(uPattern[i]);
                      if (phase < edge) { draw = uPattern[i] > 0.0; break; }
                    }
                    if (!draw) discard;
                    gl_FragColor = vec4(uColor, uOpacity);
                    #include <tonemapping_fragment>
                    #include <colorspace_fragment>
                  }`,
              })
            : cmd.dashStyle
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
          (lines as any).frustumCulled = true;
          lines.name = cmd.layer;
          lines.renderOrder = cmd.renderOrder;
          const layerVis = this.layerVisibility.get(cmd.layer) ?? true;
          lines.visible = layerVis;
          (lines as any).userData = {
            isLineCenterline: true,
            lineweightMm: cmd.lineweightMm,
            layer: cmd.layer,
            originalColor: [cmd.color[0], cmd.color[1], cmd.color[2]],
            isAci7,
            isDashed: Boolean(cmd.dashStyle),
          };
          (lines as any).userData.positionCodec = chunk.positionCodec;
          chunkGroup.add(applyCadV2PositionCodec(lines, chunk.positionCodec));

          // Lineweight expansion is generated only while the user has it enabled.
          if (this.isLineweight) {
            const thickMesh = createLineweightMesh(lines);
            if (thickMesh) {
              chunkGroup.add(thickMesh);
              suppressCenterlineForLineweight(lines);
            }
          }
        } else if (cmd.kind === "triangle" && chunk.trianglesArray) {
          const tri = chunk.trianglesArray;
          const pos = selectOrPackVertexRanges(tri, cmd.runs, cmd.totalVertices, 2, shareTrianglePositionSource);

          if (isLight && !this.isMonochrome && isAci7) {
            r = 0.08; g = 0.08; b = 0.08;
          }
          if (this.isMonochrome) {
            r = isLight ? 0.08 : 0.95;
            g = isLight ? 0.08 : 0.95;
            b = isLight ? 0.08 : 0.95;
          }

          const geom = new THREE.BufferGeometry();
          setCadV2Position2D(geom, pos);
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
          (mesh as any).frustumCulled = true;
          mesh.name = cmd.layer;
          mesh.renderOrder = cmd.renderOrder;
          mesh.visible = this.layerVisibility.get(cmd.layer) ?? true;
          chunkGroup.add(mesh);
        } else if (cmd.kind === "wipeout" && chunk.trianglesArray) {
          const tri = chunk.trianglesArray;
          const pos = selectOrPackVertexRanges(tri, cmd.runs, cmd.totalVertices, 2, shareTrianglePositionSource);

          const geom = new THREE.BufferGeometry();
          setCadV2Position2D(geom, pos);
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
        cmdIdx++;
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

          const groupPos = selectOrPackVertexRanges(xy, group.runs, group.totalVertices, 2);

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
          setCadV2Position2D(subGeom, groupPos);

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
          (subLines as any).frustumCulled = true;
          subLines.name = group.layer;
          subLines.renderOrder = baseOrder + rIdx;
          subLines.visible = this.layerVisibility.get(group.layer) ?? true;
          chunkGroup.add(applyCadV2PositionCodec(subLines, chunk.positionCodec));
        }
      } else if (lineCount > 0) {
        const pos2D = chunk.xyArray;

        const geometry = new THREE.BufferGeometry();
        setCadV2Position2D(geometry, pos2D);

        const material = new THREE.LineBasicMaterial({
          color: 0xffffff,
          transparent: true,
          opacity: 1,
          depthTest: false,
          depthWrite: false,
        });
        (material as any).userData = { originalColor: [1, 1, 1] };

        const lineSegments = new THREE.LineSegments(geometry, material);
        (lineSegments as any).frustumCulled = true;
        lineSegments.name = "0";
        lineSegments.renderOrder = baseOrder;
        chunkGroup.add(applyCadV2PositionCodec(lineSegments, chunk.positionCodec));
      }

      // Varsa üçgenleri de ekle
      if (chunk.trianglesArray && chunk.trianglesArray.length > 0) {
        const triGeom = new THREE.BufferGeometry();
        const triPos = chunk.trianglesArray;
        setCadV2Position2D(triGeom, triPos);
        const triMat = new THREE.MeshBasicMaterial({
          color: 0xcccccc,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 1,
          depthTest: false,
          depthWrite: false,
        });
        const triMesh = new THREE.Mesh(triGeom, triMat);
        (triMesh as any).frustumCulled = true;
        triMesh.renderOrder = baseOrder + 5000;
        chunkGroup.add(triMesh);
      }
    }

    this.scene.add(chunkGroup);
    resourceLease = this.resourceOwnershipLedger.acquire({
      ownerScene: this.resourceOwnerScene,
      generation: this.resourceOwnerGeneration,
      chunkId: chunk.chunkId,
    }, collectChunkOwnedResources(chunkGroup));
    const loadedItem: LoadedChunkRecord = {
      origin: chunk.origin,
      group: chunkGroup,
      usesPainterDepthBatch,
      ...(painterPageChunk ? { painterPageChunk } : {}),
      painterPageMeshes: [],
      resourceLease,
    };
    this.loadedChunks.set(chunk.chunkId, loadedItem);
    this.cameraRelativeChunkIds.add(chunk.chunkId);
    if (painterPageChunk) this.queuePainterPageChunk(painterPageChunk);
    if (usesPainterDepthBatch) this.nonPainterDepthChunkIds.delete(chunk.chunkId);
    else this.nonPainterDepthChunkIds.add(chunk.chunkId);
    this.updateObjectSortPolicy();
    this.requestChunkMutationRender();
    } catch (error) {
      this.scene.remove(chunkGroup);
      if (this.loadedChunks.get(chunk.chunkId)?.group === chunkGroup) {
        this.loadedChunks.delete(chunk.chunkId);
        this.cameraRelativeChunkIds.delete(chunk.chunkId);
        this.nonPainterDepthChunkIds.delete(chunk.chunkId);
        this.updateObjectSortPolicy();
      }
      if (resourceLease) resourceLease.release();
      else disposeUnregisteredGroup(chunkGroup);
      throw error;
    }
  }

  public removeSceneChunk(chunkId: string): void {
    const item = this.loadedChunks.get(chunkId);
    if (!item) return;

    this.retirePainterPageChunk(item.painterPageChunk);
    item.painterPageMeshes = [];
    this.disposeChunkGroup(item);
    this.loadedChunks.delete(chunkId);
    this.cameraRelativeChunkIds.delete(chunkId);
    this.nonPainterDepthChunkIds.delete(chunkId);
    this.updateObjectSortPolicy();
    this.requestChunkMutationRender();
  }

  /** Rebuilds a chunk while keeping its current draw alive until the replacement is complete. */
  public replaceSceneChunkGeometry(chunk: UnpackedSceneChunk): boolean {
    const previous = this.loadedChunks.get(chunk.chunkId);
    if (!previous) return false;

    // addSceneChunk removes an existing map entry. Keep the old group attached to the scene,
    // build the replacement synchronously, then retire the old group before the next RAF.
    if (previous.painterPageChunk) {
      previous.painterPageChunk.visible = false;
      this.pendingPainterPageChunks = this.pendingPainterPageChunks.filter((pending) => pending !== previous.painterPageChunk);
      this.updatePainterPageChunkVisibility(previous.painterPageChunk);
    }
    this.loadedChunks.delete(chunk.chunkId);
    this.cameraRelativeChunkIds.delete(chunk.chunkId);
    this.nonPainterDepthChunkIds.delete(chunk.chunkId);
    try {
      this.addSceneChunk(chunk);
      const replacement = this.loadedChunks.get(chunk.chunkId);
      if (!replacement) {
        this.loadedChunks.set(chunk.chunkId, previous);
        this.cameraRelativeChunkIds.add(chunk.chunkId);
        if (previous.painterPageChunk) {
          previous.painterPageChunk.visible = previous.group.visible;
          this.updatePainterPageChunkVisibility(previous.painterPageChunk);
          if (!previous.painterPageChunk.promoted) this.queuePainterPageChunk(previous.painterPageChunk);
        }
        if (!previous.usesPainterDepthBatch) this.nonPainterDepthChunkIds.add(chunk.chunkId);
        this.updateObjectSortPolicy();
        return false;
      }
      this.retirePainterPageChunk(previous.painterPageChunk);
      previous.painterPageMeshes = [];
      this.disposeChunkGroup(previous);
      this.invalidate();
      return true;
    } catch (error) {
      const partial = this.loadedChunks.get(chunk.chunkId);
      if (partial && partial !== previous) this.removeSceneChunk(chunk.chunkId);
      if (!this.loadedChunks.has(chunk.chunkId)) {
        this.loadedChunks.set(chunk.chunkId, previous);
        this.cameraRelativeChunkIds.add(chunk.chunkId);
        if (previous.painterPageChunk) {
          previous.painterPageChunk.visible = previous.group.visible;
          this.updatePainterPageChunkVisibility(previous.painterPageChunk);
          if (!previous.painterPageChunk.promoted) this.queuePainterPageChunk(previous.painterPageChunk);
        }
        if (!previous.usesPainterDepthBatch) this.nonPainterDepthChunkIds.add(chunk.chunkId);
        this.updateObjectSortPolicy();
      }
      throw error;
    }
  }

  private disposeChunkGroup(item: { group: THREE.Group; resourceLease?: { release: () => void } }): void {
    this.scene.remove(item.group);
    item.resourceLease?.release();
  }

  /** Binds the renderer's resource leases to the authoritative scene and host generation. */
  public setResourceOwner(ownerScene: string, generation: number): void {
    if (!ownerScene || !Number.isSafeInteger(generation) || generation < 0) {
      throw new Error("Invalid CAD renderer owner scene or generation");
    }
    if (ownerScene === this.resourceOwnerScene && generation === this.resourceOwnerGeneration) return;
    this.clearChunks();
    this.resourceOwnerScene = ownerScene;
    this.resourceOwnerGeneration = generation;
  }

  public getResourceOwnershipSnapshot(): CadV2ResourceOwnershipSnapshotEntry[] {
    return this.resourceOwnershipLedger.getSnapshot();
  }

  /** Returns source backing stores retained by the renderer without copying them. */
  public getSharedChunkCpuBufferBytes(chunk: UnpackedSceneChunk): number {
    const group = this.loadedChunks.get(chunk.chunkId)?.group;
    if (!group) return 0;
    const sourceBuffers = new Set<ArrayBufferLike>();
    for (const view of [chunk.xyArray, chunk.drawRunsArray, chunk.trianglesArray, chunk.pathDistancesArray, chunk.curveDataArray]) {
      if (view) sourceBuffers.add(view.buffer);
    }
    const sharedBuffers = new Set<ArrayBufferLike>();
    visitRenderObjects(group, (renderable) => {
      if (!renderable.geometry) return;
      const geometry = renderable.geometry as THREE.BufferGeometry & { index?: THREE.BufferAttribute };
      for (const attribute of Object.values(geometry.attributes) as Array<any>) {
        const data = attribute?.data ?? attribute;
        const view = attribute?.array ?? data?.array;
        if (ArrayBuffer.isView(view) && sourceBuffers.has(view.buffer)) {
          sharedBuffers.add(view.buffer);
        }
      }
      const index = geometry.index;
      if (index && ArrayBuffer.isView(index.array) && sourceBuffers.has(index.array.buffer)) {
        sharedBuffers.add(index.array.buffer);
      }
    });
    let bytes = 0;
    for (const buffer of sharedBuffers) bytes += buffer.byteLength;
    return bytes;
  }

  /** Counts pending painter-page source buffers retained outside the owned geometry estimate. */
  public getAdditionalRetainedChunkCpuBytes(chunk: UnpackedSceneChunk): number {
    const item = this.loadedChunks.get(chunk.chunkId);
    const page = item?.painterPageChunk;
    if (!item || !page) return 0;

    const pageSourceBuffers = new Set<ArrayBufferLike>();
    if (page.lineSource) pageSourceBuffers.add(page.lineSource.buffer);
    if (page.triangleSource) pageSourceBuffers.add(page.triangleSource.buffer);

    const groupBuffers = new Set<ArrayBufferLike>();
    visitRenderObjects(item.group, (renderable) => {
      if (!renderable.geometry) return;
      const geometry = renderable.geometry as THREE.BufferGeometry & { index?: THREE.BufferAttribute };
      for (const attribute of Object.values(geometry.attributes) as Array<any>) {
        const data = attribute?.data ?? attribute;
        const view = attribute?.array ?? data?.array;
        if (ArrayBuffer.isView(view)) groupBuffers.add(view.buffer);
      }
      const index = geometry.index;
      if (index && ArrayBuffer.isView(index.array)) groupBuffers.add(index.array.buffer);
    });

    let bytes = 0;
    for (const buffer of pageSourceBuffers) {
      if (!groupBuffers.has(buffer)) bytes += buffer.byteLength;
    }
    const retainedPageMetadataBytes = JSON.stringify({
      lineCommands: page.lineCommands,
      triangleCommands: page.triangleCommands,
      origin: page.origin,
      worldOrigin: page.worldOrigin,
      positionCodec: page.positionCodec,
      globalOrderMax: page.globalOrderMax,
    }).length * 4 + 128;
    return bytes + retainedPageMetadataBytes;
  }

  private refreshChunkResourceLease(chunkId: string, item: LoadedChunkRecord): void {
    const resourcesByObject = new Map<object, CadV2OwnedResourceInput>();
    for (const resource of collectChunkOwnedResources(item.group)) {
      resourcesByObject.set(resource.resource, resource);
    }
    for (const mesh of item.painterPageMeshes ?? []) {
      for (const resource of collectChunkOwnedResources(mesh)) {
        resourcesByObject.set(resource.resource, resource);
      }
    }
    const resources = Array.from(resourcesByObject.values());
    const nextLease = this.resourceOwnershipLedger.acquire({
      ownerScene: this.resourceOwnerScene,
      generation: this.resourceOwnerGeneration,
      chunkId,
    }, resources);
    for (const resource of resources) {
      this.resourceOwnershipLedger.updateResourceByteEstimate(resource.resource, resource.byteEstimate);
    }
    const previousLease = item.resourceLease;
    item.resourceLease = nextLease;
    previousLease?.release();
  }

  public clearChunks(): void {
    const chunks = Array.from(this.loadedChunks.values());
    this.pendingPainterPageChunks = [];
    if (chunks.length === 0) return;

    // Every painter page is retired by this operation, so rewriting each style's
    // visibility before removing its last owner only adds work proportional to
    // the total number of styles in the scene.
    for (const item of chunks) {
      this.retirePainterPageChunk(item.painterPageChunk, false, false);
      item.painterPageMeshes = [];
      this.disposeChunkGroup(item);
    }

    this.loadedChunks.clear();
    this.cameraRelativeChunkIds.clear();
    this.nonPainterDepthChunkIds.clear();
    this.updateObjectSortPolicy();
    this.requestChunkMutationRender();
  }

  public hasChunk(chunkId: string): boolean {
    return this.loadedChunks.has(chunkId);
  }

  /** Counts one resident chunk independently so replacement peak can include both groups. */
  public getChunkResourceMemoryEstimate(chunkId: string): ReturnType<typeof estimateThreeGroupBufferBytes> | null {
    const item = this.loadedChunks.get(chunkId);
    if (!item) return null;
    const estimate = estimateThreeGroupBufferBytes(item.group);
    const seenPages = new Set<THREE.Mesh>();
    for (const mesh of item.painterPageMeshes ?? []) {
      if (seenPages.has(mesh)) continue;
      seenPages.add(mesh);
      const pageEstimate = estimateThreeGroupBufferBytes(mesh);
      estimate.cpuResidentBytes += pageEstimate.cpuResidentBytes;
      estimate.gpuBufferBytesEstimate += pageEstimate.gpuBufferBytesEstimate;
      estimate.geometryCount += pageEstimate.geometryCount;
    }
    return estimate;
  }

  public getLoadedChunkIds(): Set<string> {
    return new Set(this.loadedChunks.keys());
  }

  /** Counts loaded geometry backing arrays and the corresponding WebGL buffer-size estimate. */
  public getResourceMemoryEstimate(): ReturnType<typeof estimateThreeGroupBufferBytes> & { loadedChunkCount: number } {
    const estimate = this.resourceOwnershipLedger.getAggregateByteEstimate();
    return {
      ...estimate,
      geometryCount: this.resourceOwnershipLedger.getResourceCount("geometry"),
      loadedChunkCount: this.loadedChunks.size,
    };
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
      const visible = chunkLayout === this.activeLayoutId && isChunkVisibleInCamera(
        this.chunkBounds.get(chunkId),
        camera
      );
      item.group.visible = visible;
      if (item.painterPageChunk && item.painterPageChunk.visible !== visible) {
        item.painterPageChunk.visible = visible;
        this.updatePainterPageChunkVisibility(item.painterPageChunk);
      }
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
    this.updateObjectSortPolicy();
    this.invalidate();
  }

  private updateObjectSortPolicy(): void {
    const depthBufferAvailable = this.renderer.getContext().getContextAttributes()?.depth === true;
    const canSkipSort = canSkipCadV2ObjectSort({
      loadedChunkCount: this.loadedChunks.size,
      nonPainterDepthChunkCount: this.nonPainterDepthChunkIds.size,
      hasAuxiliaryObjects: this.contentGroup.children.length > 0,
      depthBufferAvailable,
    });
    this.renderer.sortObjects = !canSkipSort;
    if (this.lastReportedSortObjects === this.renderer.sortObjects) return;
    this.lastReportedSortObjects = this.renderer.sortObjects;

    const report = typeof window !== "undefined"
      ? (window as any).__cadV2RendererSortDiagnostics
      : null;
    if (typeof report === "function") {
      report({
        sortObjects: this.renderer.sortObjects,
        depthBufferAvailable,
        loadedChunkCount: this.loadedChunks.size,
        nonPainterDepthChunkCount: this.nonPainterDepthChunkIds.size,
        hasAuxiliaryObjects: this.contentGroup.children.length > 0,
      });
    }
  }

  /**
   * Katman görünürlüğünü dinamik olarak aç/kapat (Katman Paneli)
   */
  public setLayerVisibility(layerId: string, visible: boolean): void {
    this.layerVisibility.set(layerId, visible);
    for (const chunk of Array.from(this.loadedChunks.values())) {
      for (const child of chunk.group.children) {
        const batchData = (child as any).userData?.cadV2MultiDrawLineBatch
          ? (child as any).userData as {
            instances: Array<{ layer: string; lineweightMm: number }>;
              lineweightMeshes?: Array<{ instanceIds: number[]; mesh: THREE.Mesh }>;
          }
          : null;
        if (batchData) {
          const batch = child as CadV2BatchedMesh;
          for (let instanceId = 0; instanceId < batchData.instances.length; instanceId++) {
            const instance = batchData.instances[instanceId]!;
            if (instance.layer === layerId) {
              batch.setVisibleAt(instanceId, visible && !(this.isLineweight && instance.lineweightMm > 1e-4));
            }
          }
          for (const lineweight of batchData.lineweightMeshes ?? []) {
            setCadV2BatchedLineweightLayerVisibility(lineweight.mesh, layerId, visible);
          }
          continue;
        }
        if ((child as any).userData?.lineBatchRebuild && (child as any).userData?.isBatchedLineweightMesh) {
          setCadV2BatchedLineweightLayerVisibility(child as THREE.Mesh, layerId, visible);
          continue;
        }
        if (child.name === layerId) {
          const u = (child as any).userData;
          if (u?.isLineweightMesh) {
            child.visible = visible && this.isLineweight;
          } else {
            child.visible = visible && !u?.lineweightSuppressed;
          }
        }
      }
    }
    this.updatePainterPageThemes();
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
        if ((child as any).userData?.cadV2MultiDrawLineBatch) {
          this.updateCadV2BatchLineColors(child as CadV2BatchedMesh, enabled, isLight);
          continue;
        }
        if ((child as any).userData?.isBatchedLineweightMesh) {
          updateCadV2BatchedLineweightStyles(child as THREE.Mesh, enabled, isLight);
          continue;
        }
        if ((child as any).userData?.isWipeout) {
          // Wipeout maskeleri monokrom mürekkep rengine dönüşmez
          continue;
        }
        const material = (child as any).material;
        const color = material?.color ?? material?.uniforms?.uColor?.value;
        if (color) {
          if (enabled) {
            color.setHex(monoHex);
          } else {
            const childData = (child as any).userData;
            const materialData = material?.userData;
            const orig = childData?.originalColor ?? materialData?.originalColor ?? [0.9, 0.9, 0.9];
            const isAci7 = (childData?.isAci7 ?? materialData?.isAci7) === true;
            let [r, g, b] = orig;
            if (isLight && isAci7) {
              r = 0.08;
              g = 0.08;
              b = 0.08;
            }
            applyThreeColor(color, r, g, b);
          }
          material.needsUpdate = true;
        }
      }
    }
    this.updatePainterPageThemes();
    this.invalidate();
  }

  private updateCadV2BatchLineColors(batch: CadV2BatchedMesh, monochrome: boolean, isLight: boolean): void {
    const instances = (batch.userData as any)?.instances as Array<{
      color: [number, number, number];
      isAci7: boolean;
    }> | undefined;
    if (!instances) return;
    for (let instanceId = 0; instanceId < instances.length; instanceId++) {
      const instance = instances[instanceId]!;
      let [r, g, b] = instance.color;
      if (monochrome) r = g = b = isLight ? 0.08 : 0.95;
      else if (isLight && instance.isAci7) r = g = b = 0.08;
      batch.setColorAt(instanceId, createThreeColor(r, g, b));
    }
  }

  /**
   * Çizgi kalınlığı modunu aç/kapat (LWT Toggle)
   */
  public setLineweight(enabled: boolean, reservedCpuBytes = 0): boolean {
    if (!Number.isFinite(reservedCpuBytes) || reservedCpuBytes < 0) return false;
    if (enabled === this.isLineweight) {
      const current = this.getLoadedGeometryEstimate();
      const withinBudget = evaluateCadV2ResourceBudget(
        current.cpuResidentBytes + reservedCpuBytes,
        current.gpuBufferBytesEstimate,
        CAD_V2_CPU_RESIDENT_BUDGET_BYTES,
        CAD_V2_GPU_BUFFER_BUDGET_BYTES,
      ).withinBudget;
      if (!withinBudget) return false;
      return true;
    }

    if (enabled) {
      const addedMeshes: Array<{ chunkId: string; item: LoadedChunkRecord; line: THREE.LineSegments; mesh: THREE.Mesh }> = [];
      const addedBatchMeshes: Array<{
        chunkId: string;
        item: LoadedChunkRecord;
        batch: CadV2BatchedMesh;
        mesh: THREE.Mesh;
        index: number;
      }> = [];
      for (const [chunkId, item] of this.loadedChunks) {
        for (const child of item.group.children) {
          const batchData = (child as any).userData?.cadV2MultiDrawLineBatch
            ? (child as any).userData as {
              instances: Array<{
                layer: string;
                color: [number, number, number];
                isAci7: boolean;
                lineweightMm: number;
                renderOrder: number;
                firstVertex: number;
                vertexCount: number;
              }>;
              source: CadV2PositionArray;
              positionCodec?: CadV2PositionCodec;
              lineweightMeshes: Array<{ instanceIds: number[]; mesh: THREE.Mesh }>;
              lineBatchRebuild: CadV2LineBatchRebuild;
              painterDepth?: boolean;
            }
            : null;
          if (batchData) {
            const batch = child as CadV2BatchedMesh;
            if (batchData.instances.some((instance) => instance.lineweightMm > 1e-4)) {
              const mesh = createCadV2BatchedLineweightMesh(
                batchData.instances,
                batchData.source,
                this.isLightBackground(),
                this.isMonochrome,
                this.layerVisibility,
                batchData.painterDepth === true,
                getCadV2ViewportResolution(this.renderer),
                batchData.positionCodec,
              );
              if (!mesh) continue;
              const index = item.group.children.indexOf(child);
              mesh.userData.lineBatchRebuild = batchData.lineBatchRebuild;
              mesh.userData.lineBatchIndex = index;
              item.group.add(mesh);
              item.group.remove(batch);
              addedBatchMeshes.push({ chunkId, item, batch, mesh, index });
            }
            continue;
          }
          const line = child as THREE.LineSegments;
          const lineData = (line as any).userData;
          if (!lineData?.isLineCenterline || lineData.lineweightMm <= 1e-4) continue;
          const mesh = createLineweightMesh(line, lineData.positionCodec as CadV2PositionCodec | undefined);
          if (!mesh) continue;
          mesh.visible = this.layerVisibility.get(mesh.name) ?? true;
          item.group.add(mesh);
          suppressCenterlineForLineweight(line);
          addedMeshes.push({ chunkId, item, line, mesh });
        }
      }

      const candidate = this.getLoadedGeometryEstimate();
      const withinBudget = evaluateCadV2ResourceBudget(
        candidate.cpuResidentBytes + reservedCpuBytes,
        candidate.gpuBufferBytesEstimate,
        CAD_V2_CPU_RESIDENT_BUDGET_BYTES,
        CAD_V2_GPU_BUFFER_BUDGET_BYTES,
      ).withinBudget;
      if (!withinBudget) {
        for (const { item, line, mesh } of addedMeshes) {
          item.group.remove(mesh);
          const layerVisible = this.layerVisibility.get(line.name) ?? true;
          restoreCenterlineAfterLineweight(line, layerVisible);
          mesh.geometry.dispose();
          const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
          for (const material of materials) material.dispose();
        }
        for (const { item, batch, mesh, index } of addedBatchMeshes) {
          item.group.remove(mesh);
          disposeCadV2LineweightMesh(mesh);
          insertCadV2ObjectAt(item.group, batch, index);
        }
        return false;
      }

      const changed = new Set([...addedMeshes, ...addedBatchMeshes].map(({ chunkId }) => chunkId));
      for (const chunkId of changed) {
        const item = this.loadedChunks.get(chunkId);
        if (item) this.refreshChunkResourceLease(chunkId, item);
      }
      this.isLineweight = true;
    } else {
      this.isLineweight = false;
      const changed: Array<[string, LoadedChunkRecord]> = [];
      for (const [chunkId, item] of this.loadedChunks) {
        for (const child of [...item.group.children]) {
          const lineBatchRebuild = (child as any).userData?.lineBatchRebuild as CadV2LineBatchRebuild | undefined;
          if (lineBatchRebuild) {
            const index = Number.isSafeInteger((child as any).userData?.lineBatchIndex)
              ? (child as any).userData.lineBatchIndex as number
              : item.group.children.length;
            const replacement = createCadV2MultiDrawLineBatch(
              lineBatchRebuild.source,
              lineBatchRebuild.commands,
              this.isLightBackground(),
              this.isMonochrome,
              this.layerVisibility,
              lineBatchRebuild.painterDepth,
              lineBatchRebuild.globalOrderMax,
              lineBatchRebuild.renderOrder,
              lineBatchRebuild.positionCodec,
            );
            item.group.remove(child);
            insertCadV2ObjectAt(item.group, replacement, index);
            changed.push([chunkId, item]);
            continue;
          }
        }
        for (const child of [...item.group.children]) {
          const batchData = (child as any).userData?.cadV2MultiDrawLineBatch
            ? (child as any).userData as {
              instances: Array<{ layer: string }>;
              lineweightMeshes: Array<{ instanceIds: number[]; mesh: THREE.Mesh }>;
            }
            : null;
          if (!batchData) continue;
          const batch = child as CadV2BatchedMesh;
          for (const { instanceIds, mesh } of batchData.lineweightMeshes) {
            item.group.remove(mesh);
            for (const instanceId of instanceIds) {
              batch.setVisibleAt(instanceId, this.layerVisibility.get(batchData.instances[instanceId]!.layer) ?? true);
            }
          }
          if (batchData.lineweightMeshes.length > 0) {
            batchData.lineweightMeshes = [];
            changed.push([chunkId, item]);
          }
        }
        const thickMeshes = item.group.children.filter((child) => (child as any).userData?.isLineweightMesh);
        if (thickMeshes.length === 0) continue;
        for (const mesh of thickMeshes) item.group.remove(mesh);
        for (const child of item.group.children) {
          const line = child as THREE.LineSegments;
          if (!(line as any).userData?.isLineCenterline) continue;
          restoreCenterlineAfterLineweight(line, this.layerVisibility.get(line.name) ?? true);
        }
        changed.push([chunkId, item]);
      }
      for (const [chunkId, item] of changed) this.refreshChunkResourceLease(chunkId, item);
    }
    this.updatePainterPageThemes();
    this.invalidate();
    return true;
  }

  private getLoadedGeometryEstimate(): ReturnType<typeof estimateThreeGroupBufferBytes> {
    const resourcesByObject = new Map<object, CadV2OwnedResourceInput>();
    for (const item of this.loadedChunks.values()) {
      for (const root of [item.group, ...(item.painterPageMeshes ?? [])]) {
        for (const resource of collectChunkOwnedResources(root)) {
          resourcesByObject.set(resource.resource, resource);
        }
      }
    }
    let cpuResidentBytes = 0;
    let gpuBufferBytesEstimate = 0;
    let geometryCount = 0;
    for (const resource of resourcesByObject.values()) {
      cpuResidentBytes += resource.byteEstimate.cpuResidentBytes;
      gpuBufferBytesEstimate += resource.byteEstimate.gpuBufferBytesEstimate;
      if (resource.kind === "geometry") geometryCount++;
    }
    return { cpuResidentBytes, gpuBufferBytesEstimate, geometryCount };
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
        if ((child as any).userData?.cadV2MultiDrawLineBatch) {
          if (wasLight !== isLight || this.isMonochrome) {
            this.updateCadV2BatchLineColors(child as CadV2BatchedMesh, this.isMonochrome, isLight);
          }
          continue;
        }
        if ((child as any).userData?.isBatchedLineweightMesh) {
          if (wasLight !== isLight || this.isMonochrome) {
            updateCadV2BatchedLineweightStyles(child as THREE.Mesh, this.isMonochrome, isLight);
          }
          continue;
        }
        // Wipeout maskeleri arka plan rengiyle güncellenir
        if ((child as any).userData?.isWipeout && (child as any).material) {
          ((child as any).material as THREE.MeshBasicMaterial).color.setHex(colorHex);
          ((child as any).material as THREE.MeshBasicMaterial).needsUpdate = true;
          continue;
        }

        if (wasLight !== isLight || this.isMonochrome) {
          const monoHex = isLight ? 0x111111 : 0xffffff;
          const material = (child as any).material;
          const materialColor = material?.color ?? material?.uniforms?.uColor?.value;
          if (materialColor) {
            if (this.isMonochrome) {
              materialColor.setHex(monoHex);
            } else {
              const childData = (child as any).userData;
              const materialData = material?.userData;
              const orig = childData?.originalColor ?? materialData?.originalColor ?? [0.9, 0.9, 0.9];
              const isAci7 = (childData?.isAci7 ?? materialData?.isAci7) === true;
              let [r, g, b] = orig;
              if (isLight && isAci7) {
                r = 0.08;
                g = 0.08;
                b = 0.08;
              }
              applyThreeColor(materialColor, r, g, b);
            }
            material.needsUpdate = true;
          }
        }

      }
    }
    this.updatePainterPageThemes();
    this.invalidate();
  }

  public reapplyBackgroundColorAfterContextRestore(): void {
    this.renderer.setClearColor(this.backgroundColorHex, 1);
  }

  public resize(width: number, height: number): void {
    if (this.isDisposed || width <= 0 || height <= 0) return;
    this.renderer.setSize(width, height, false);
    const resolution = getCadV2ViewportResolution(this.renderer);
    for (const item of this.loadedChunks.values()) {
      for (const child of item.group.children) {
        if ((child as any).userData?.isBatchedLineweightMesh) {
          updateCadV2BatchedLineweightResolution(child as THREE.Mesh, resolution);
        }
      }
    }
    for (const page of this.painterRenderPages) {
      if (page.kind !== "line") continue;
      const uniform = (page.mesh.material as THREE.ShaderMaterial)?.uniforms?.uCadV2ViewportResolution;
      if (uniform?.value?.set) uniform.value.set(Math.max(1, resolution[0]), Math.max(1, resolution[1]));
    }
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
    this.renderedFrameGate.dispose();
    this.chunkMutationRenderScheduler?.dispose();

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
