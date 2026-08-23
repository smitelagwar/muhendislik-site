import { DxfViewer as InternalViewerClass } from "dxf-viewer/src/DxfViewer.js";

const PATCH_FLAG = "__muhendislikDxfRenderStylePatchV1";
const COLOR_MODE_KEY = "__muhendislikDxfColorMode";
const SOURCE_MODE = "source";
const MONOCHROME_MODE = "monochrome";
const viewerRegistry = new WeakMap();

function linearColor(component) {
  return component <= 0.03928
    ? component / 12.92
    : Math.pow((component + 0.055) / 1.055, 2.4);
}

function luminance(color) {
  const r = linearColor(((color & 0xff0000) >>> 16) / 255);
  const g = linearColor(((color & 0x00ff00) >>> 8) / 255);
  const b = linearColor((color & 0x0000ff) / 255);
  return r * 0.2126 + g * 0.7152 + b * 0.0722;
}

function resolvedMode(viewer) {
  return viewer[COLOR_MODE_KEY] === MONOCHROME_MODE ? MONOCHROME_MODE : SOURCE_MODE;
}

function monochromeColor(viewer) {
  return luminance(viewer.clearColor ?? 0x000000) > 0.5 ? 0x000000 : 0xffffff;
}

function displayColor(viewer, sourceColor) {
  return resolvedMode(viewer) === MONOCHROME_MODE ? monochromeColor(viewer) : sourceColor;
}

function updateMaterialColors(viewer) {
  const materials = viewer.materials;
  if (!materials?.each) return;
  materials.each((entry) => {
    const sourceColor = entry?.key?.color;
    const uniform = entry?.material?.uniforms?.color;
    if (typeof sourceColor !== "number" || !uniform?.value?.setHex) return;
    uniform.value.setHex(displayColor(viewer, sourceColor));
  });
}

export function setDxfColorMode(viewer, mode) {
  if (mode !== SOURCE_MODE && mode !== MONOCHROME_MODE) {
    throw new Error(`Desteklenmeyen DXF renk modu: ${mode}`);
  }
  viewer[COLOR_MODE_KEY] = mode;
  updateMaterialColors(viewer);
  viewer.Render();
  return mode;
}

export function getDxfColorMode(viewer) {
  return resolvedMode(viewer);
}

export function getDxfRenderStyleCapabilities() {
  return {
    sourceColors: true,
    monochrome: true,
    colorModeRequiresReload: false,
  };
}

export function getDxfRenderStyleViewerForRoot(root) {
  const container = root.querySelector('[data-testid="cad-dxf-canvas"]');
  return container ? viewerRegistry.get(container) ?? null : null;
}

function installPatchSynchronously() {
  const prototype = InternalViewerClass.prototype;
  if (prototype[PATCH_FLAG]) return;

  const upstreamTransformColor = prototype._TransformColor;
  prototype._TransformColor = function (color) {
    const mode = resolvedMode(this);
    if (mode === SOURCE_MODE) return color;
    if (mode === MONOCHROME_MODE) return monochromeColor(this);
    return upstreamTransformColor.call(this, color);
  };

  const upstreamLoad = prototype.Load;
  prototype.Load = async function (params) {
    this[COLOR_MODE_KEY] ??= SOURCE_MODE;
    await upstreamLoad.call(this, params);
    viewerRegistry.set(this.domContainer, this);
    updateMaterialColors(this);
  };

  const upstreamDestroy = prototype.Destroy;
  prototype.Destroy = function () {
    viewerRegistry.delete(this.domContainer);
    upstreamDestroy.call(this);
  };

  prototype.SetColorMode = function (mode) {
    return setDxfColorMode(this, mode);
  };
  prototype.GetColorMode = function () {
    return getDxfColorMode(this);
  };
  prototype.GetRenderStyleCapabilities = function () {
    return getDxfRenderStyleCapabilities();
  };

  prototype[PATCH_FLAG] = true;
}

export function installDxfRenderStyleViewerPatch() {
  installPatchSynchronously();
}

installPatchSynchronously();
