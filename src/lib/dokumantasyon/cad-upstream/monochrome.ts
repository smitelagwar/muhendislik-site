/**
 * @file monochrome.ts
 * @description Pure CAD-aware monochrome ink resolution and Three.js material color override.
 * Aligned with AutoCAD `monochrome.ctb` behavior: renders all visible geometry in high-contrast
 * monochrome ink according to the current canvas background, preserving source transparency,
 * lineweights, linetypes, wipeouts/masks, and enabling 100% lossless restoration to source colors.
 */

export type CadMonochromeBackground = "autocad" | "black" | "white" | string;

export interface CadSourceColorSnapshot {
  colorHex?: number;
  emissiveHex?: number;
  uColorHex?: number;
  uStartColorHex?: number;
  uEndColorHex?: number;
}

/**
 * Resolves the monochrome ink color (hex number) based on the CAD canvas background.
 * - White background (`white` or 0xffffff): Pure Black ink (`0x000000`).
 * - Dark backgrounds (`autocad`, `black`, or dark hex): Pure White ink (`0xffffff`).
 *
 * NOTE: The decision is strictly bound to the CAD canvas background option,
 * NEVER to the web application theme.
 */
export function resolveMonochromeInkColor(
  backgroundOption: CadMonochromeBackground,
  customBgNumeric?: number
): number {
  if (backgroundOption === "white" || customBgNumeric === 0xffffff) {
    return 0x000000;
  }
  return 0xffffff;
}

/**
 * Determines whether a material is eligible for monochrome ink override.
 * - Background fills and wipeouts (`isBackgroundFill === true`) must NOT be colored
 *   with ink, as they mask underlying geometry with the canvas background.
 * - Materials without color or shader color uniforms are skipped.
 */
export function isMonochromeEligible(material: unknown): boolean {
  if (!material || typeof material !== "object") {
    return false;
  }
  const mat = material as {
    userData?: { isBackgroundFill?: boolean };
    color?: { set?: unknown };
    uniforms?: { u_color?: unknown; u_startColor?: unknown };
  };

  if (mat.userData?.isBackgroundFill === true) {
    return false;
  }

  const hasColor = Boolean(mat.color || mat.uniforms?.u_color || mat.uniforms?.u_startColor);
  return hasColor;
}

/**
 * Captures the current source color state of a material before monochrome override.
 */
export function captureSourceColor(material: unknown): CadSourceColorSnapshot | null {
  if (!material || typeof material !== "object") {
    return null;
  }
  const mat = material as {
    color?: { getHex?: () => number };
    emissive?: { getHex?: () => number };
    uniforms?: {
      u_color?: { value?: { getHex?: () => number } };
      u_startColor?: { value?: { getHex?: () => number } };
      u_endColor?: { value?: { getHex?: () => number } };
    };
  };

  const snapshot: CadSourceColorSnapshot = {};
  let captured = false;

  if (mat.color && typeof mat.color.getHex === "function") {
    snapshot.colorHex = mat.color.getHex();
    captured = true;
  }
  if (mat.emissive && typeof mat.emissive.getHex === "function") {
    snapshot.emissiveHex = mat.emissive.getHex();
    captured = true;
  }
  if (mat.uniforms) {
    if (mat.uniforms.u_color?.value && typeof mat.uniforms.u_color.value.getHex === "function") {
      snapshot.uColorHex = mat.uniforms.u_color.value.getHex();
      captured = true;
    }
    if (mat.uniforms.u_startColor?.value && typeof mat.uniforms.u_startColor.value.getHex === "function") {
      snapshot.uStartColorHex = mat.uniforms.u_startColor.value.getHex();
      captured = true;
    }
    if (mat.uniforms.u_endColor?.value && typeof mat.uniforms.u_endColor.value.getHex === "function") {
      snapshot.uEndColorHex = mat.uniforms.u_endColor.value.getHex();
      captured = true;
    }
  }

  return captured ? snapshot : null;
}

/**
 * Applies monochrome ink color to a Three.js material or array of materials.
 * Stores original color in `userData._cadSourceColor` on first call.
 * If MaterialUtil (AcTrMaterialUtil) is provided, uses it for uniform-aware updates.
 */
export function applyMonochromeToMaterial(
  material: unknown,
  inkColor: number,
  MaterialUtil?: { setMaterialColor: (mat: unknown, color: unknown) => void }
): boolean {
  if (!material) return false;

  if (Array.isArray(material)) {
    let anyApplied = false;
    for (const item of material) {
      if (applyMonochromeToMaterial(item, inkColor, MaterialUtil)) {
        anyApplied = true;
      }
    }
    return anyApplied;
  }

  if (!isMonochromeEligible(material)) {
    return false;
  }

  const mat = material as {
    userData?: Record<string, unknown>;
    color?: { set: (c: unknown) => void };
    emissive?: { set: (c: unknown) => void };
    uniforms?: {
      u_color?: { value?: { set: (c: unknown) => void } };
      u_startColor?: { value?: { set: (c: unknown) => void } };
      u_endColor?: { value?: { set: (c: unknown) => void } };
    };
    needsUpdate?: boolean;
  };

  if (!mat.userData) {
    mat.userData = {};
  }

  // Preserve original source color snapshot only if not already saved
  if (mat.userData._cadSourceColor === undefined) {
    const snapshot = captureSourceColor(mat);
    if (snapshot) {
      mat.userData._cadSourceColor = snapshot;
    }
  }
  mat.userData._cadMonochromeApplied = true;

  if (MaterialUtil?.setMaterialColor && typeof MaterialUtil.setMaterialColor === "function") {
    MaterialUtil.setMaterialColor(mat, inkColor);
  } else {
    if (mat.color && typeof mat.color.set === "function") {
      mat.color.set(inkColor);
    }
    if (mat.emissive && typeof mat.emissive.set === "function") {
      mat.emissive.set(inkColor);
    }
    if (mat.uniforms) {
      if (mat.uniforms.u_color?.value && typeof mat.uniforms.u_color.value.set === "function") {
        mat.uniforms.u_color.value.set(inkColor);
      }
      if (mat.uniforms.u_startColor?.value && typeof mat.uniforms.u_startColor.value.set === "function") {
        mat.uniforms.u_startColor.value.set(inkColor);
      }
      if (mat.uniforms.u_endColor?.value && typeof mat.uniforms.u_endColor.value.set === "function") {
        mat.uniforms.u_endColor.value.set(inkColor);
      }
    }
  }

  mat.needsUpdate = true;
  return true;
}

/**
 * Restores original source color to a material from `userData._cadSourceColor`.
 */
export function restoreSourceMaterialColor(
  material: unknown,
  MaterialUtil?: { setMaterialColor: (mat: unknown, color: unknown) => void }
): boolean {
  if (!material) return false;

  if (Array.isArray(material)) {
    let anyRestored = false;
    for (const item of material) {
      if (restoreSourceMaterialColor(item, MaterialUtil)) {
        anyRestored = true;
      }
    }
    return anyRestored;
  }

  const mat = material as {
    userData?: Record<string, unknown>;
    color?: { set: (c: unknown) => void };
    emissive?: { set: (c: unknown) => void };
    uniforms?: {
      u_color?: { value?: { set: (c: unknown) => void } };
      u_startColor?: { value?: { set: (c: unknown) => void } };
      u_endColor?: { value?: { set: (c: unknown) => void } };
    };
    needsUpdate?: boolean;
  };

  if (!mat.userData || mat.userData._cadSourceColor === undefined) {
    return false;
  }

  const snapshot = mat.userData._cadSourceColor as CadSourceColorSnapshot;

  if (MaterialUtil?.setMaterialColor && typeof MaterialUtil.setMaterialColor === "function" && snapshot.colorHex !== undefined) {
    MaterialUtil.setMaterialColor(mat, snapshot.colorHex);
  } else {
    if (snapshot.colorHex !== undefined && mat.color?.set) {
      mat.color.set(snapshot.colorHex);
    }
    if (snapshot.emissiveHex !== undefined && mat.emissive?.set) {
      mat.emissive.set(snapshot.emissiveHex);
    }
    if (mat.uniforms) {
      if (snapshot.uColorHex !== undefined && mat.uniforms.u_color?.value?.set) {
        mat.uniforms.u_color.value.set(snapshot.uColorHex);
      }
      if (snapshot.uStartColorHex !== undefined && mat.uniforms.u_startColor?.value?.set) {
        mat.uniforms.u_startColor.value.set(snapshot.uStartColorHex);
      }
      if (snapshot.uEndColorHex !== undefined && mat.uniforms.u_endColor?.value?.set) {
        mat.uniforms.u_endColor.value.set(snapshot.uEndColorHex);
      }
    }
  }

  delete mat.userData._cadSourceColor;
  delete mat.userData._cadMonochromeApplied;
  mat.needsUpdate = true;
  return true;
}

/**
 * Traverses both the style manager caches and the internal scene graph of an AcTrView2d,
 * applying the given monochrome ink color to all eligible materials.
 */
export function applyMonochromeToSceneAndManagers(options: {
  curView: unknown;
  inkColor: number;
  MaterialUtil?: { setMaterialColor: (mat: unknown, color: unknown) => void };
}): { processedCount: number } {
  const { curView, inkColor, MaterialUtil } = options;
  if (!curView || typeof curView !== "object") {
    return { processedCount: 0 };
  }

  const view = curView as {
    renderer?: { styleManager?: { pointMgr?: { cache?: Record<string, unknown> }; lineMgr?: { cache?: Record<string, unknown> }; fillMgr?: { cache?: Record<string, unknown> } } };
    styleManager?: { pointMgr?: { cache?: Record<string, unknown> }; lineMgr?: { cache?: Record<string, unknown> }; fillMgr?: { cache?: Record<string, unknown> } };
    internalScene?: { traverse?: (cb: (obj: unknown) => void) => void };
    cadScene?: { internalScene?: { traverse?: (cb: (obj: unknown) => void) => void } };
    _scene?: { internalScene?: { traverse?: (cb: (obj: unknown) => void) => void } };
    isDirty?: boolean;
    activeLayoutView?: { isDirty?: boolean };
  };

  const processed = new Set<unknown>();
  let count = 0;

  const handleMaterial = (mat: unknown) => {
    if (!mat || processed.has(mat)) return;
    processed.add(mat);
    if (applyMonochromeToMaterial(mat, inkColor, MaterialUtil)) {
      count++;
    }
  };

  // 1. Traverse StyleManager caches
  const styleMgr = view.renderer?.styleManager ?? view.styleManager;
  if (styleMgr) {
    if (styleMgr.pointMgr?.cache) {
      for (const mat of Object.values(styleMgr.pointMgr.cache)) {
        handleMaterial(mat);
      }
    }
    if (styleMgr.lineMgr?.cache) {
      for (const mat of Object.values(styleMgr.lineMgr.cache)) {
        handleMaterial(mat);
      }
    }
    if (styleMgr.fillMgr?.cache) {
      for (const mat of Object.values(styleMgr.fillMgr.cache)) {
        handleMaterial(mat);
      }
    }
  }

  // 2. Traverse Scene graph (catches unbatched or custom drawables)
  const scene = view.internalScene ?? view.cadScene?.internalScene ?? view._scene?.internalScene;
  if (scene && typeof scene.traverse === "function") {
    scene.traverse((obj: unknown) => {
      const o = obj as { material?: unknown };
      if (o?.material) {
        if (Array.isArray(o.material)) {
          for (const m of o.material) {
            handleMaterial(m);
          }
        } else {
          handleMaterial(o.material);
        }
      }
    });
  }

  view.isDirty = true;
  if (view.activeLayoutView) {
    view.activeLayoutView.isDirty = true;
  }

  return { processedCount: count };
}

/**
 * Traverses both the style manager caches and the internal scene graph of an AcTrView2d,
 * restoring original source colors from saved snapshots.
 */
export function restoreSourceColorsToSceneAndManagers(options: {
  curView: unknown;
  MaterialUtil?: { setMaterialColor: (mat: unknown, color: unknown) => void };
}): { restoredCount: number } {
  const { curView, MaterialUtil } = options;
  if (!curView || typeof curView !== "object") {
    return { restoredCount: 0 };
  }

  const view = curView as {
    renderer?: { styleManager?: { pointMgr?: { cache?: Record<string, unknown> }; lineMgr?: { cache?: Record<string, unknown> }; fillMgr?: { cache?: Record<string, unknown> } } };
    styleManager?: { pointMgr?: { cache?: Record<string, unknown> }; lineMgr?: { cache?: Record<string, unknown> }; fillMgr?: { cache?: Record<string, unknown> } };
    internalScene?: { traverse?: (cb: (obj: unknown) => void) => void };
    cadScene?: { internalScene?: { traverse?: (cb: (obj: unknown) => void) => void } };
    _scene?: { internalScene?: { traverse?: (cb: (obj: unknown) => void) => void } };
    isDirty?: boolean;
    activeLayoutView?: { isDirty?: boolean };
  };

  const processed = new Set<unknown>();
  let count = 0;

  const handleMaterial = (mat: unknown) => {
    if (!mat || processed.has(mat)) return;
    processed.add(mat);
    if (restoreSourceMaterialColor(mat, MaterialUtil)) {
      count++;
    }
  };

  // 1. Traverse StyleManager caches
  const styleMgr = view.renderer?.styleManager ?? view.styleManager;
  if (styleMgr) {
    if (styleMgr.pointMgr?.cache) {
      for (const mat of Object.values(styleMgr.pointMgr.cache)) {
        handleMaterial(mat);
      }
    }
    if (styleMgr.lineMgr?.cache) {
      for (const mat of Object.values(styleMgr.lineMgr.cache)) {
        handleMaterial(mat);
      }
    }
    if (styleMgr.fillMgr?.cache) {
      for (const mat of Object.values(styleMgr.fillMgr.cache)) {
        handleMaterial(mat);
      }
    }
  }

  // 2. Traverse Scene graph
  const scene = view.internalScene ?? view.cadScene?.internalScene ?? view._scene?.internalScene;
  if (scene && typeof scene.traverse === "function") {
    scene.traverse((obj: unknown) => {
      const o = obj as { material?: unknown };
      if (o?.material) {
        if (Array.isArray(o.material)) {
          for (const m of o.material) {
            handleMaterial(m);
          }
        } else {
          handleMaterial(o.material);
        }
      }
    });
  }

  view.isDirty = true;
  if (view.activeLayoutView) {
    view.activeLayoutView.isDirty = true;
  }

  return { restoredCount: count };
}
