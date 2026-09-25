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

const scenes = [
  compileCanonicalToScene(document, { sceneId: "scene_f07_compiled_dash_single" }),
  compileCanonicalToScene(document, { sceneId: "scene_f07_compiled_dash_split", maxPrimitivesPerChunk: 1 }),
];

const serializedScenes = scenes.map((scene) => {
  const chunkRefs = scene.manifest.chunks.filter((chunk) => chunk.layoutId === "Model");
  if (chunkRefs.length === 0) throw new Error(`Compiled DASHED fixture ${scene.manifest.sceneId} did not produce a Model chunk`);
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
        ? { ...layout, bbox: [0, -20, 200, 20] }
        : layout),
    },
    chunks,
  };
});

process.stdout.write(JSON.stringify({ scenes: serializedScenes }));
