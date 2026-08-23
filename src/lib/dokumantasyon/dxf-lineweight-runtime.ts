import * as three from "three";
import {
  DXF_LINEWEIGHT_BY_LAYER,
  lineweightHundredthsMmToCssPixels,
  resolveDxfLineweightHundredthsMm,
} from "./dxf-lineweight-source";

const LINE_SEGMENTS = 1;
const INDEXED_LINES = 2;
const BLOCK_INSTANCE = 5;
const POINT_INSTANCE = 6;
const PATCH_FLAG = "__muhendislikDxfLineweightPatchV1";
const LINEWEIGHT_VALUE_KEY = "__dxfLineweightHundredthsMm";
const LINEWEIGHT_SOURCE_KEY = "__dxfLineweightSourceValue";
const LINEWEIGHT_UNSUPPORTED_KEY = "__dxfLineweightUnsupported";
const LINEWEIGHT_OVERLAY_KEY = "__dxfLineweightOverlay";

type SerializedLayer = { name: string; lineweight?: number };
type SerializedBatchKey = {
  blockName?: string | null;
  geometryType?: number | null;
  layerName?: string | null;
  lineweight?: number;
};
type SerializedBatch = {
  key: SerializedBatchKey;
  chunks?: unknown[];
  verticesOffset?: number;
  transformsOffset?: number;
};
type SerializedScene = {
  batches?: SerializedBatch[];
  layers?: SerializedLayer[];
  lineweightDefault?: number;
  lineweightLayers?: Record<string, number>;
};

type InternalDxfViewer = {
  scene: three.Scene;
  GetScene: () => three.Scene;
  GetRenderer?: () => three.WebGLRenderer | null;
  Render: () => void;
};
type InternalDxfViewerPrototype = {
  [PATCH_FLAG]?: boolean;
  _LoadBatch: (this: InternalDxfViewer, scene: SerializedScene, batch: SerializedBatch) => void;
};

type TaggedLineObject = three.LineSegments & {
  userData: Record<string, unknown>;
};

type OverlayMaterial = three.RawShaderMaterial & {
  uniforms: {
    color: { value: three.Color };
    lineWidth: { value: number };
    viewport: { value: three.Vector2 };
  };
};

type OverlayMesh = three.Mesh<three.BufferGeometry, OverlayMaterial> & {
  userData: Record<string, unknown>;
};

interface RuntimeState {
  enabled: boolean;
  overlays: Map<TaggedLineObject, OverlayMesh>;
}

export interface DxfLineweightViewerLike {
  GetScene: () => unknown;
  GetRenderer?: () => unknown;
  Render: () => void;
}

export interface DxfLineweightRuntimeSnapshot {
  enabled: boolean;
  sourceLineObjectCount: number;
  supportedLineObjectCount: number;
  unsupportedLineObjectCount: number;
  segmentCount: number;
  distinctLineweights: number[];
  minDisplayPx: number | null;
  maxDisplayPx: number | null;
  overlayObjectCount: number;
}

const runtimeStates = new WeakMap<object, RuntimeState>();

function isLineGeometryType(type: number | null | undefined): boolean {
  return type === LINE_SEGMENTS || type === INDEXED_LINES;
}

function batchObjectCount(batch: SerializedBatch): number {
  if (batch.chunks && batch.chunks.length > 0) return batch.chunks.length;
  if (batch.verticesOffset !== undefined || batch.transformsOffset !== undefined) return 1;
  return 0;
}

function layerLineweights(scene: SerializedScene): Record<string, number> {
  if (scene.lineweightLayers) return scene.lineweightLayers;
  const layers: Record<string, number> = {};
  for (const layer of scene.layers ?? []) {
    if (layer.lineweight !== undefined) layers[layer.name] = layer.lineweight;
  }
  return layers;
}

function resolveBatchLineweight(
  scene: SerializedScene,
  key: SerializedBatchKey,
  instanceKey?: SerializedBatchKey | null
): number {
  const effectiveLayer = instanceKey?.layerName ?? key.layerName ?? null;
  return resolveDxfLineweightHundredthsMm({
    value: key.lineweight ?? DXF_LINEWEIGHT_BY_LAYER,
    layerName: effectiveLayer,
    layers: layerLineweights(scene),
    defaultLineweight: scene.lineweightDefault,
    byBlockValue: instanceKey?.lineweight,
  });
}

function metadataForLoadedBatch(
  scene: SerializedScene,
  batch: SerializedBatch
): Array<{ resolved: number; source: number } | null> {
  const key = batch.key;
  const geometryType = key.geometryType;

  if (geometryType !== BLOCK_INSTANCE && geometryType !== POINT_INSTANCE) {
    const count = batchObjectCount(batch);
    if (!isLineGeometryType(geometryType)) return Array.from({ length: count }, () => null);
    const source = key.lineweight ?? DXF_LINEWEIGHT_BY_LAYER;
    const resolved = resolveBatchLineweight(scene, key);
    return Array.from({ length: count }, () => ({ resolved, source }));
  }

  const blockName = key.blockName;
  if (!blockName) return [];
  const metadata: Array<{ resolved: number; source: number } | null> = [];
  const definitionBatches = (scene.batches ?? []).filter((candidate) => {
    const candidateType = candidate.key.geometryType;
    return candidate.key.blockName === blockName &&
      candidateType !== BLOCK_INSTANCE &&
      candidateType !== POINT_INSTANCE;
  });

  for (const definition of definitionBatches) {
    const count = batchObjectCount(definition);
    if (!isLineGeometryType(definition.key.geometryType)) {
      metadata.push(...Array.from({ length: count }, () => null));
      continue;
    }
    const source = definition.key.lineweight ?? DXF_LINEWEIGHT_BY_LAYER;
    const resolved = resolveBatchLineweight(scene, definition.key, key);
    metadata.push(...Array.from({ length: count }, () => ({ resolved, source })));
  }

  // POINT_INSTANCE can append its dot geometry after block-shape objects.
  if (batch.verticesOffset !== undefined) metadata.push(null);
  return metadata;
}

function tagLoadedLineObjects(
  added: three.Object3D[],
  metadata: Array<{ resolved: number; source: number } | null>
) {
  if (added.length !== metadata.length) {
    for (const object of added) {
      if ((object as TaggedLineObject).isLineSegments) {
        (object as TaggedLineObject).userData[LINEWEIGHT_UNSUPPORTED_KEY] = true;
      }
    }
    return;
  }

  for (let index = 0; index < added.length; index += 1) {
    const object = added[index] as TaggedLineObject;
    if (!object.isLineSegments) continue;
    const item = metadata[index];
    if (!item) {
      object.userData[LINEWEIGHT_UNSUPPORTED_KEY] = true;
      continue;
    }
    object.userData[LINEWEIGHT_VALUE_KEY] = item.resolved;
    object.userData[LINEWEIGHT_SOURCE_KEY] = item.source;
    delete object.userData[LINEWEIGHT_UNSUPPORTED_KEY];
  }
}

/**
 * dxf-viewer serializes batch keys from the worker but does not expose them on the final Three.js
 * objects. Patch only the internal batch-load seam so supported line objects retain the resolved
 * source lineweight as metadata. Geometry and materials are unchanged while LWT is off.
 */
export async function installDxfLineweightViewerPatch(): Promise<void> {
  // @ts-expect-error dxf-viewer internal module intentionally has no public declaration file.
  const internalModule = await import("dxf-viewer/src/DxfViewer.js") as {
    DxfViewer: { prototype: InternalDxfViewerPrototype };
  };
  const prototype = internalModule.DxfViewer.prototype;
  if (prototype[PATCH_FLAG]) return;

  const upstreamLoadBatch = prototype._LoadBatch;
  prototype._LoadBatch = function (this: InternalDxfViewer, scene: SerializedScene, batch: SerializedBatch) {
    const before = this.scene.children.length;
    upstreamLoadBatch.call(this, scene, batch);
    const added = this.scene.children.slice(before);
    if (added.length === 0) return;
    tagLoadedLineObjects(added, metadataForLoadedBatch(scene, batch));
  };
  prototype[PATCH_FLAG] = true;
}

function taggedLineObjects(viewer: DxfLineweightViewerLike): TaggedLineObject[] {
  const scene = viewer.GetScene() as three.Scene;
  const lines: TaggedLineObject[] = [];
  scene.traverse((object) => {
    const line = object as TaggedLineObject;
    if (!line.isLineSegments) return;
    if (line.userData?.[LINEWEIGHT_OVERLAY_KEY]) return;
    lines.push(line);
  });
  return lines;
}

function segmentCount(line: TaggedLineObject): number {
  const geometry = line.geometry;
  const position = geometry.getAttribute("position");
  if (!position) return 0;
  const base = geometry.index ? Math.floor(geometry.index.count / 2) : Math.floor(position.count / 2);
  if (!geometry.isInstancedBufferGeometry) return base;
  const instanceCount = Number.isFinite(geometry.instanceCount) ? Math.max(0, geometry.instanceCount) : 0;
  return base * instanceCount;
}

function lineColor(line: TaggedLineObject): three.Color {
  const material = Array.isArray(line.material) ? line.material[0] : line.material;
  const uniforms = (material as three.RawShaderMaterial | undefined)?.uniforms as
    | { color?: { value?: unknown } }
    | undefined;
  const value = uniforms?.color?.value;
  if (value instanceof three.Color) return value.clone();
  if (value && typeof value === "object" && "r" in value && "g" in value && "b" in value) {
    const rgb = value as { r: number; g: number; b: number };
    return new three.Color().setRGB(rgb.r, rgb.g, rgb.b);
  }
  return new three.Color(0xffffff);
}

function shaderSource(instanced: boolean) {
  const instanceAttributes = instanced
    ? `
      in vec3 instanceTransform0;
      in vec3 instanceTransform1;
    `
    : "";
  const transformFunction = instanced
    ? `
      vec2 applyInstance(vec2 point) {
        return mat2(instanceTransform0[0], instanceTransform1[0],
                    instanceTransform0[1], instanceTransform1[1]) * point +
               vec2(instanceTransform0[2], instanceTransform1[2]);
      }
    `
    : `
      vec2 applyInstance(vec2 point) { return point; }
    `;

  return {
    vertex: `
      precision highp float;
      precision highp int;
      in vec3 position;
      in vec2 segmentStart;
      in vec2 segmentEnd;
      ${instanceAttributes}
      uniform mat4 modelViewMatrix;
      uniform mat4 projectionMatrix;
      uniform vec2 viewport;
      uniform float lineWidth;
      ${transformFunction}
      void main() {
        vec2 start = applyInstance(segmentStart);
        vec2 end = applyInstance(segmentEnd);
        vec4 startClip = projectionMatrix * modelViewMatrix * vec4(start, 0.0, 1.0);
        vec4 endClip = projectionMatrix * modelViewMatrix * vec4(end, 0.0, 1.0);
        vec2 startNdc = startClip.xy / startClip.w;
        vec2 endNdc = endClip.xy / endClip.w;
        vec2 deltaPx = (endNdc - startNdc) * max(viewport, vec2(1.0));
        float segmentLength = length(deltaPx);
        vec2 normal = segmentLength > 0.0001
          ? vec2(-deltaPx.y, deltaPx.x) / segmentLength
          : vec2(0.0, 1.0);
        vec4 clip = mix(startClip, endClip, position.x);
        vec2 offsetNdc = normal * position.y * lineWidth / max(viewport, vec2(1.0));
        clip.xy += offsetNdc * clip.w;
        gl_Position = clip;
      }
    `,
    fragment: `
      precision highp float;
      precision highp int;
      uniform vec3 color;
      out vec4 fragColor;
      void main() {
        fragColor = vec4(color, 1.0);
      }
    `,
  };
}

function createWideOverlay(line: TaggedLineObject, widthCssPx: number): OverlayMesh | null {
  const sourceGeometry = line.geometry;
  const position = sourceGeometry.getAttribute("position");
  if (!position) return null;

  const index = sourceGeometry.index;
  const indexCount = index?.count ?? position.count;
  if (indexCount < 2) return null;

  const starts: number[] = [];
  const ends: number[] = [];
  const corners: number[] = [];
  const quadCorners: ReadonlyArray<readonly [number, number]> = [
    [0, -1], [1, -1], [1, 1],
    [0, -1], [1, 1], [0, 1],
  ];

  for (let cursor = 0; cursor + 1 < indexCount; cursor += 2) {
    const startIndex = index ? index.getX(cursor) : cursor;
    const endIndex = index ? index.getX(cursor + 1) : cursor + 1;
    const startX = position.getX(startIndex);
    const startY = position.getY(startIndex);
    const endX = position.getX(endIndex);
    const endY = position.getY(endIndex);
    if (Math.abs(startX - endX) < Number.EPSILON && Math.abs(startY - endY) < Number.EPSILON) continue;

    for (const [along, side] of quadCorners) {
      corners.push(along, side, 0);
      starts.push(startX, startY);
      ends.push(endX, endY);
    }
  }

  if (corners.length === 0) return null;
  const instanced = sourceGeometry.isInstancedBufferGeometry &&
    Boolean(sourceGeometry.getAttribute("instanceTransform0")) &&
    Boolean(sourceGeometry.getAttribute("instanceTransform1"));
  const overlayGeometry = instanced ? new three.InstancedBufferGeometry() : new three.BufferGeometry();
  overlayGeometry.setAttribute("position", new three.Float32BufferAttribute(corners, 3));
  overlayGeometry.setAttribute("segmentStart", new three.Float32BufferAttribute(starts, 2));
  overlayGeometry.setAttribute("segmentEnd", new three.Float32BufferAttribute(ends, 2));

  if (instanced && overlayGeometry.isInstancedBufferGeometry) {
    const transform0 = sourceGeometry.getAttribute("instanceTransform0");
    const transform1 = sourceGeometry.getAttribute("instanceTransform1");
    overlayGeometry.setAttribute("instanceTransform0", transform0);
    overlayGeometry.setAttribute("instanceTransform1", transform1);
    overlayGeometry.instanceCount = sourceGeometry.instanceCount;
  }

  const shaders = shaderSource(instanced);
  const material = new three.RawShaderMaterial({
    uniforms: {
      color: { value: lineColor(line) },
      lineWidth: { value: widthCssPx },
      viewport: { value: new three.Vector2(1, 1) },
    },
    vertexShader: shaders.vertex,
    fragmentShader: shaders.fragment,
    depthTest: false,
    depthWrite: false,
    glslVersion: three.GLSL3,
    side: three.DoubleSide,
  }) as OverlayMaterial;

  const overlay = new three.Mesh(overlayGeometry, material) as OverlayMesh;
  overlay.frustumCulled = false;
  overlay.matrixAutoUpdate = false;
  overlay.renderOrder = 10;
  overlay.userData[LINEWEIGHT_OVERLAY_KEY] = true;
  line.add(overlay);
  return overlay;
}

function viewportSize(viewer: DxfLineweightViewerLike): { width: number; height: number } {
  const renderer = viewer.GetRenderer?.() as three.WebGLRenderer | null | undefined;
  const canvas = renderer?.domElement;
  return {
    width: Math.max(1, canvas?.clientWidth ?? 1),
    height: Math.max(1, canvas?.clientHeight ?? 1),
  };
}

export function updateDxfLineweightViewport(viewer: DxfLineweightViewerLike): void {
  const state = runtimeStates.get(viewer as object);
  if (!state) return;
  const { width, height } = viewportSize(viewer);
  for (const overlay of state.overlays.values()) {
    overlay.material.uniforms.viewport.value.set(width, height);
  }
}

function snapshot(viewer: DxfLineweightViewerLike, state: RuntimeState): DxfLineweightRuntimeSnapshot {
  const lines = taggedLineObjects(viewer);
  const distinct = new Set<number>();
  let supportedLineObjectCount = 0;
  let unsupportedLineObjectCount = 0;
  let totalSegments = 0;
  let minDisplayPx: number | null = null;
  let maxDisplayPx: number | null = null;

  for (const line of lines) {
    const resolved = line.userData?.[LINEWEIGHT_VALUE_KEY];
    if (typeof resolved !== "number" || line.userData?.[LINEWEIGHT_UNSUPPORTED_KEY] === true) {
      unsupportedLineObjectCount += 1;
      continue;
    }
    supportedLineObjectCount += 1;
    totalSegments += segmentCount(line);
    distinct.add(resolved);
    const display = lineweightHundredthsMmToCssPixels(resolved);
    minDisplayPx = minDisplayPx === null ? display : Math.min(minDisplayPx, display);
    maxDisplayPx = maxDisplayPx === null ? display : Math.max(maxDisplayPx, display);
  }

  return {
    enabled: state.enabled,
    sourceLineObjectCount: lines.length,
    supportedLineObjectCount,
    unsupportedLineObjectCount,
    segmentCount: totalSegments,
    distinctLineweights: [...distinct].sort((a, b) => a - b),
    minDisplayPx,
    maxDisplayPx,
    overlayObjectCount: state.overlays.size,
  };
}

export function initializeDxfLineweightRuntime(
  viewer: DxfLineweightViewerLike
): DxfLineweightRuntimeSnapshot {
  let state = runtimeStates.get(viewer as object);
  if (!state) {
    state = { enabled: false, overlays: new Map() };
    runtimeStates.set(viewer as object, state);
  }
  return snapshot(viewer, state);
}

export function setDxfLineweightEnabled(
  viewer: DxfLineweightViewerLike,
  enabled: boolean
): DxfLineweightRuntimeSnapshot {
  let state = runtimeStates.get(viewer as object);
  if (!state) {
    state = { enabled: false, overlays: new Map() };
    runtimeStates.set(viewer as object, state);
  }

  if (enabled) {
    for (const line of taggedLineObjects(viewer)) {
      const resolved = line.userData?.[LINEWEIGHT_VALUE_KEY];
      if (typeof resolved !== "number" || line.userData?.[LINEWEIGHT_UNSUPPORTED_KEY] === true) continue;
      let overlay = state.overlays.get(line);
      if (!overlay) {
        overlay = createWideOverlay(line, lineweightHundredthsMmToCssPixels(resolved)) ?? undefined;
        if (overlay) state.overlays.set(line, overlay);
      }
      if (overlay) overlay.visible = true;
    }
  } else {
    for (const overlay of state.overlays.values()) overlay.visible = false;
  }

  state.enabled = enabled;
  updateDxfLineweightViewport(viewer);
  viewer.Render();
  return snapshot(viewer, state);
}

export function disposeDxfLineweightRuntime(viewer: DxfLineweightViewerLike): void {
  const state = runtimeStates.get(viewer as object);
  if (!state) return;
  for (const [line, overlay] of state.overlays) {
    line.remove(overlay);
    overlay.geometry.dispose();
    overlay.material.dispose();
  }
  state.overlays.clear();
  runtimeStates.delete(viewer as object);
}
