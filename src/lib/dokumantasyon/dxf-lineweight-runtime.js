import * as three from "three";
import { DxfViewer as InternalViewerClass } from "dxf-viewer/src/DxfViewer.js";
import {
  DXF_LINEWEIGHT_BY_LAYER,
  lineweightHundredthsMmToCssPixels,
  resolveDxfLineweightHundredthsMm,
} from "./dxf-lineweight-source";

const LINE_SEGMENTS = 1;
const INDEXED_LINES = 2;
const BLOCK_INSTANCE = 5;
const POINT_INSTANCE = 6;
const PATCH_FLAG = "__muhendislikDxfLineweightPatchV3";
const LINEWEIGHT_VALUE_KEY = "__dxfLineweightHundredthsMm";
const LINEWEIGHT_SOURCE_KEY = "__dxfLineweightSourceValue";
const LINEWEIGHT_UNSUPPORTED_KEY = "__dxfLineweightUnsupported";
const LINEWEIGHT_OVERLAY_KEY = "__dxfLineweightOverlay";
export const DXF_LINEWEIGHT_READY_EVENT = "cad-dxf-lineweight-ready";

const runtimeStates = new WeakMap();
const viewerRegistry = new WeakMap();

function isLineGeometryType(type) {
  return type === LINE_SEGMENTS || type === INDEXED_LINES;
}

function batchObjectCount(batch) {
  if (batch.chunks?.length) return batch.chunks.length;
  if (batch.verticesOffset !== undefined || batch.transformsOffset !== undefined) return 1;
  return 0;
}

function layerLineweights(scene) {
  if (scene.lineweightLayers) return scene.lineweightLayers;
  const layers = {};
  for (const layer of scene.layers ?? []) {
    if (layer.lineweight !== undefined) layers[layer.name] = layer.lineweight;
  }
  return layers;
}

function resolveBatchLineweight(scene, key, instanceKey = null) {
  const effectiveLayer = instanceKey?.layerName ?? key.layerName ?? null;
  return resolveDxfLineweightHundredthsMm({
    value: key.lineweight ?? DXF_LINEWEIGHT_BY_LAYER,
    layerName: effectiveLayer,
    layers: layerLineweights(scene),
    defaultLineweight: scene.lineweightDefault,
    byBlockValue: instanceKey?.lineweight,
  });
}

function metadataForLoadedBatch(scene, batch) {
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
  const metadata = [];
  const definitionBatches = (scene.batches ?? []).filter((candidate) => {
    const type = candidate.key.geometryType;
    return candidate.key.blockName === blockName && type !== BLOCK_INSTANCE && type !== POINT_INSTANCE;
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

  if (batch.verticesOffset !== undefined) metadata.push(null);
  return metadata;
}

function tagLoadedLineObjects(added, metadata) {
  if (added.length !== metadata.length) {
    for (const object of added) {
      if (object.isLineSegments) object.userData[LINEWEIGHT_UNSUPPORTED_KEY] = true;
    }
    return;
  }

  for (let index = 0; index < added.length; index += 1) {
    const object = added[index];
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

function taggedLineObjects(viewer) {
  const lines = [];
  viewer.GetScene().traverse((object) => {
    if (!object.isLineSegments || object.userData?.[LINEWEIGHT_OVERLAY_KEY]) return;
    lines.push(object);
  });
  return lines;
}

function segmentCount(line) {
  const geometry = line.geometry;
  const position = geometry.getAttribute("position");
  if (!position) return 0;
  const base = geometry.index ? Math.floor(geometry.index.count / 2) : Math.floor(position.count / 2);
  if (!geometry.isInstancedBufferGeometry) return base;
  const count = Number.isFinite(geometry.instanceCount) ? Math.max(0, geometry.instanceCount) : 0;
  return base * count;
}

function materialColor(object) {
  const material = Array.isArray(object.material) ? object.material[0] : object.material;
  const value = material?.uniforms?.color?.value;
  if (value instanceof three.Color) return value.clone();
  if (value && typeof value === "object" && "r" in value && "g" in value && "b" in value) {
    return new three.Color().setRGB(value.r, value.g, value.b);
  }
  return new three.Color(0xffffff);
}

function shaderSource(instanced) {
  const instanceAttributes = instanced
    ? `in vec3 instanceTransform0;\nin vec3 instanceTransform1;`
    : "";
  const transformFunction = instanced
    ? `vec2 applyInstance(vec2 point) {\n  return mat2(instanceTransform0[0], instanceTransform1[0], instanceTransform0[1], instanceTransform1[1]) * point + vec2(instanceTransform0[2], instanceTransform1[2]);\n}`
    : `vec2 applyInstance(vec2 point) { return point; }`;

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
  float len = length(deltaPx);
  vec2 normal = len > 0.0001 ? vec2(-deltaPx.y, deltaPx.x) / len : vec2(0.0, 1.0);
  vec4 clip = mix(startClip, endClip, position.x);
  vec2 offsetNdc = normal * position.y * lineWidth / max(viewport, vec2(1.0));
  clip.xy += offsetNdc * clip.w;
  gl_Position = clip;
}`,
    fragment: `
precision highp float;
precision highp int;
uniform vec3 color;
out vec4 fragColor;
void main() { fragColor = vec4(color, 1.0); }`,
  };
}

function createWideOverlay(line, widthCssPx) {
  const sourceGeometry = line.geometry;
  const position = sourceGeometry.getAttribute("position");
  if (!position) return null;

  const index = sourceGeometry.index;
  const indexCount = index?.count ?? position.count;
  if (indexCount < 2) return null;

  const starts = [];
  const ends = [];
  const corners = [];
  const quadCorners = [[0, -1], [1, -1], [1, 1], [0, -1], [1, 1], [0, 1]];

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

  if (instanced) {
    overlayGeometry.setAttribute("instanceTransform0", sourceGeometry.getAttribute("instanceTransform0"));
    overlayGeometry.setAttribute("instanceTransform1", sourceGeometry.getAttribute("instanceTransform1"));
    overlayGeometry.instanceCount = sourceGeometry.instanceCount;
  }

  const shaders = shaderSource(instanced);
  const material = new three.RawShaderMaterial({
    uniforms: {
      color: { value: materialColor(line) },
      lineWidth: { value: widthCssPx },
      viewport: { value: new three.Vector2(1, 1) },
    },
    vertexShader: shaders.vertex,
    fragmentShader: shaders.fragment,
    depthTest: false,
    depthWrite: false,
    glslVersion: three.GLSL3,
    side: three.DoubleSide,
  });

  const overlay = new three.Mesh(overlayGeometry, material);
  overlay.frustumCulled = false;
  overlay.matrixAutoUpdate = false;
  overlay.renderOrder = 10;
  overlay.userData[LINEWEIGHT_OVERLAY_KEY] = true;
  line.add(overlay);
  return overlay;
}

function viewportSize(viewer) {
  const canvas = viewer.GetRenderer?.()?.domElement;
  return {
    width: Math.max(1, canvas?.clientWidth ?? 1),
    height: Math.max(1, canvas?.clientHeight ?? 1),
  };
}

export function updateDxfLineweightViewport(viewer) {
  const state = runtimeStates.get(viewer);
  if (!state) return;
  const { width, height } = viewportSize(viewer);
  for (const overlay of state.overlays.values()) {
    overlay.material.uniforms.viewport.value.set(width, height);
  }
}

export function syncDxfLineweightOverlayColors(viewer) {
  const state = runtimeStates.get(viewer);
  if (!state) return;
  for (const [line, overlay] of state.overlays) {
    overlay.material.uniforms.color.value.copy(materialColor(line));
  }
}

function snapshot(viewer, state) {
  const lines = taggedLineObjects(viewer);
  const distinct = new Set();
  let supportedLineObjectCount = 0;
  let unsupportedLineObjectCount = 0;
  let totalSegments = 0;
  let minDisplayPx = null;
  let maxDisplayPx = null;

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

export function initializeDxfLineweightRuntime(viewer) {
  let state = runtimeStates.get(viewer);
  if (!state) {
    state = { enabled: false, overlays: new Map() };
    runtimeStates.set(viewer, state);
  }
  return snapshot(viewer, state);
}

export function setDxfLineweightEnabled(viewer, enabled) {
  let state = runtimeStates.get(viewer);
  if (!state) {
    state = { enabled: false, overlays: new Map() };
    runtimeStates.set(viewer, state);
  }

  if (enabled) {
    for (const line of taggedLineObjects(viewer)) {
      const resolved = line.userData?.[LINEWEIGHT_VALUE_KEY];
      if (typeof resolved !== "number" || line.userData?.[LINEWEIGHT_UNSUPPORTED_KEY] === true) continue;
      let overlay = state.overlays.get(line);
      if (!overlay) {
        overlay = createWideOverlay(line, lineweightHundredthsMmToCssPixels(resolved));
        if (overlay) state.overlays.set(line, overlay);
      }
      if (overlay) overlay.visible = true;
    }
  } else {
    for (const overlay of state.overlays.values()) overlay.visible = false;
  }

  state.enabled = enabled;
  updateDxfLineweightViewport(viewer);
  syncDxfLineweightOverlayColors(viewer);
  viewer.Render();
  return snapshot(viewer, state);
}

export function getDxfLineweightSnapshot(viewer) {
  const state = runtimeStates.get(viewer) ?? { enabled: false, overlays: new Map() };
  return snapshot(viewer, state);
}

export function disposeDxfLineweightRuntime(viewer) {
  const state = runtimeStates.get(viewer);
  if (!state) return;
  for (const [line, overlay] of state.overlays) {
    line.remove(overlay);
    overlay.geometry.dispose();
    overlay.material.dispose();
  }
  state.overlays.clear();
  runtimeStates.delete(viewer);
}

export function getDxfLineweightViewerForRoot(root) {
  const container = root.querySelector('[data-testid="cad-dxf-canvas"]');
  return container ? viewerRegistry.get(container) ?? null : null;
}

function installPatchSynchronously() {
  const prototype = InternalViewerClass.prototype;
  if (prototype[PATCH_FLAG]) return;

  const upstreamLoadBatch = prototype._LoadBatch;
  prototype._LoadBatch = function (scene, batch) {
    const before = this.scene.children.length;
    upstreamLoadBatch.call(this, scene, batch);
    const added = this.scene.children.slice(before);
    if (added.length) tagLoadedLineObjects(added, metadataForLoadedBatch(scene, batch));
  };

  const upstreamLoad = prototype.Load;
  prototype.Load = async function (params) {
    await upstreamLoad.call(this, params);
    viewerRegistry.set(this.domContainer, this);
    const initial = initializeDxfLineweightRuntime(this);
    this.domContainer.dispatchEvent(new CustomEvent(DXF_LINEWEIGHT_READY_EVENT, {
      bubbles: true,
      detail: initial,
    }));
  };

  const upstreamRender = prototype.Render;
  prototype.Render = function () {
    updateDxfLineweightViewport(this);
    syncDxfLineweightOverlayColors(this);
    upstreamRender.call(this);
  };

  const upstreamDestroy = prototype.Destroy;
  prototype.Destroy = function () {
    disposeDxfLineweightRuntime(this);
    viewerRegistry.delete(this.domContainer);
    upstreamDestroy.call(this);
  };

  prototype[PATCH_FLAG] = true;
}

export function installDxfLineweightViewerPatch() {
  installPatchSynchronously();
}

installPatchSynchronously();
