import type { CadCanonicalDocument } from "../../src/lib/cad-v2/canonical/types";
import { compileCanonicalToScene } from "../../src/lib/cad-v2/compile/scene-compiler";

const document: CadCanonicalDocument = {
  sourceVersionKey: "f07-compiled-dash-webgl-v2",
  sourceSha256: "f07-compiled-dash-webgl-v2",
  acadVersion: "AC1032",
  codepage: "UTF-8",
  units: 4,
  measurement: 1,
  layers: {
    DASH: {
      id: "DASH",
      name: "DASH",
      visible: true,
      frozen: false,
      locked: false,
      color: { method: "rgb", rgb: [255, 0, 0] },
      lineweightMm: 0,
      linetypeName: "DASHED",
    },
  },
  linetypes: {
    DASHED: { id: "DASHED", name: "DASHED", pattern: [24, -16], totalLength: 40 },
  },
  textStyles: {},
  blocks: {},
  layouts: {},
  viewports: {},
  paperSpaceEntities: {},
  diagnostics: [],
  modelSpaceEntities: [{
    type: "LWPOLYLINE",
    handle: "F07-DASH-LINE",
    layer: "DASH",
    linetype: "DASHED",
    vertices: [0, 31, 62, 93, 124, 155, 184].map((x) => ({ x, y: 0 })),
    isClosed: false,
    plinegen: true,
    order: BigInt(1),
  }],
};

const centerDocument: CadCanonicalDocument = {
  ...document,
  sourceVersionKey: "f07-compiled-center-webgl-v2",
  sourceSha256: "f07-compiled-center-webgl-v2",
  linetypes: { CENTER_TEST: { id: "CENTER_TEST", name: "CENTER_TEST",
    pattern: [24, -8, 8, -8], totalLength: 48 } },
  layers: { DASH: { ...document.layers.DASH!, linetypeName: "CENTER_TEST" } },
  modelSpaceEntities: document.modelSpaceEntities.map((entity) => ({ ...entity, linetype: "CENTER_TEST" })),
};

const curvedDocument: CadCanonicalDocument = {
  ...document,
  sourceVersionKey: "f07-analytic-bulge-webgl-v1",
  sourceSha256: "f07-analytic-bulge-webgl-v1",
  linetypes: { DASHDOT: { id: "DASHDOT", name: "DASHDOT", pattern: [10, -5, 0, -5], totalLength: 20 } },
  layers: { DASH: { ...document.layers.DASH!, linetypeName: "DASHDOT" } },
  modelSpaceEntities: [{
    type: "LWPOLYLINE", handle: "F07-CURVED-CLOSED", layer: "DASH", linetype: "DASHDOT",
    vertices: [{ x: 0, y: 0, bulge: 1 }, { x: 100, y: 0 }, { x: 100, y: 75 }],
    isClosed: true, plinegen: true, lineweightMm: 0, order: BigInt(1),
  }],
};

const wideDocument: CadCanonicalDocument = {
  ...document,
  sourceVersionKey: "f07-wide-dash-webgl-v1",
  sourceSha256: "f07-wide-dash-webgl-v1",
  modelSpaceEntities: [{
    type: "LINE", handle: "F07-WIDE-DASH", layer: "DASH", linetype: "DASHED",
    start: [0, 0], end: [184, 0], lineweightMm: 4, order: BigInt(1),
  }],
};

const sourceTransformLine: CadCanonicalDocument["modelSpaceEntities"][number] = {
  type: "LINE", handle: "R07-SOURCE-TRANSFORM", layer: "DASH", linetype: "DASHED",
  start: [0, 0], end: [100, 0], lineweightMm: 0, order: BigInt(1),
};
const mirroredDocument: CadCanonicalDocument = {
  ...document,
  sourceVersionKey: "f07-mirrored-source-dash-v1", sourceSha256: "f07-mirrored-source-dash-v1",
  linetypes: { DASHED: { id: "DASHED", name: "DASHED", pattern: [10, -10], totalLength: 20 } },
  blocks: { MIRROR: { name: "MIRROR", basePoint: [0, 0], entities: [sourceTransformLine] } },
  modelSpaceEntities: [{ type: "INSERT", handle: "R07-MIRROR", layer: "DASH",
    blockName: "MIRROR", insertionPoint: [200, 0], scale: [-2, 1, 1],
    rotationRad: 0, order: BigInt(1) }],
};
const viewportDocument: CadCanonicalDocument = {
  ...document,
  sourceVersionKey: "f07-viewport-source-dash-v1", sourceSha256: "f07-viewport-source-dash-v1",
  linetypes: { DASHED: { id: "DASHED", name: "DASHED", pattern: [10, -10], totalLength: 20 } },
  modelSpaceEntities: [sourceTransformLine],
  layouts: { SHEET: { id: "SHEET", name: "SHEET", isModelSpace: false, bbox: [40, 50, 160, 150] } },
  viewports: { VP: { id: "VP", layoutId: "SHEET", center: [100, 100], width: 120,
    height: 100, viewCenter: [50, 0], viewHeight: 50, frozenLayers: [] } },
};

const scenes = [
  compileCanonicalToScene(document, { sceneId: "scene_f07_compiled_dash_single" }),
  compileCanonicalToScene(document, { sceneId: "scene_f07_compiled_dash_split", maxPrimitivesPerChunk: 1 }),
  compileCanonicalToScene(centerDocument, { sceneId: "scene_r07_compiled_center_single" }),
  compileCanonicalToScene(centerDocument, { sceneId: "scene_r07_compiled_center_split", maxPrimitivesPerChunk: 1 }),
  compileCanonicalToScene(curvedDocument, { sceneId: "scene_r07_analytic_bulge_single" }),
  compileCanonicalToScene(curvedDocument, { sceneId: "scene_r07_analytic_bulge_split", maxPrimitivesPerChunk: 1 }),
  compileCanonicalToScene(wideDocument, { sceneId: "scene_r07_wide_dash_single" }),
  compileCanonicalToScene(wideDocument, { sceneId: "scene_r07_wide_dash_split", maxPrimitivesPerChunk: 1 }),
  compileCanonicalToScene(mirroredDocument, { sceneId: "scene_r07_mirrored_dash_single" }),
  compileCanonicalToScene(mirroredDocument, { sceneId: "scene_r07_mirrored_dash_split", maxPrimitivesPerChunk: 1 }),
  compileCanonicalToScene(viewportDocument, { sceneId: "scene_r07_viewport_dash_single", layoutId: "SHEET" }),
  compileCanonicalToScene(viewportDocument, { sceneId: "scene_r07_viewport_dash_split", layoutId: "SHEET", maxPrimitivesPerChunk: 1 }),
];

const serializedScenes = scenes.map((scene) => {
  const chunkRefs = scene.manifest.chunks;
  if (chunkRefs.length === 0) throw new Error(`Compiled DASHED fixture ${scene.manifest.sceneId} did not produce a chunk`);
  const chunks = chunkRefs.map((chunkRef) => {
    const chunkBytes = scene.chunks.get(chunkRef.chunkId);
    if (!chunkBytes) throw new Error(`Compiled DASHED Model chunk ${chunkRef.chunkId} bytes are missing`);
    return { chunkId: chunkRef.chunkId, chunkBase64: Buffer.from(chunkBytes).toString("base64") };
  });

  return {
    sceneId: scene.manifest.sceneId,
    sourceVersionKey: scene.manifest.sourceVersionKey,
    manifest: {
      ...scene.manifest,
      createdAt: "2026-09-24T00:00:00.000Z",
      // Pad only the viewport bounds so both compiled variants have the same pixel scale in Chromium.
      layouts: scene.manifest.layouts.map((layout) => layout.layoutId === "Model"
        ? { ...layout, bbox: scene.manifest.sceneId.includes("analytic_bulge") ? [-20, -70, 120, 100] : [0, -20, 200, 20] }
        : layout),
    },
    chunks,
  };
});

process.stdout.write(JSON.stringify({ scenes: serializedScenes }));
