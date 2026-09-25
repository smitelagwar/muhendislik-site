import type { CadCanonicalDocument, CadInsertEntity, CadLwPolylineEntity } from "../../src/lib/cad-v2/canonical/types";
import { compileCanonicalToScene } from "../../src/lib/cad-v2/compile/scene-compiler";
import { parseSceneChunk, SceneTag } from "../../src/lib/cad-v2/protocol/binary-protocol";

const profile = {
  start: [0, 0] as [number, number],
  end: [40, 0] as [number, number],
  bulge: 1,
  inner: {
    basePoint: [0, 0] as [number, number],
    insertionPoint: [0, 0] as [number, number],
    scale: [0.7, 1.05, 1] as [number, number, number],
    rotationRad: 0.2,
  },
  outer: {
    basePoint: [0, 0] as [number, number],
    insertionPoint: [0, 0] as [number, number],
    scale: [-0.9, 0.75, 1] as [number, number, number],
    rotationRad: 0.35,
  },
};

const polyline: CadLwPolylineEntity = {
  handle: "F07_NESTED_RUNTIME_BULGE",
  type: "LWPOLYLINE",
  layer: "0",
  order: 1n,
  isClosed: false,
  vertices: [
    { x: profile.start[0], y: profile.start[1], bulge: profile.bulge },
    { x: profile.end[0], y: profile.end[1] },
  ],
};
const innerInsert: CadInsertEntity = {
  handle: "F07_BULGE_INNER_INSERT",
  type: "INSERT",
  layer: "0",
  order: 1n,
  blockName: "F07_BULGE_LEAF",
  insertionPoint: profile.inner.insertionPoint,
  scale: profile.inner.scale,
  rotationRad: profile.inner.rotationRad,
};
const outerInsert: CadInsertEntity = {
  handle: "F07_BULGE_OUTER_INSERT",
  type: "INSERT",
  layer: "0",
  order: 2n,
  blockName: "F07_BULGE_BRANCH",
  insertionPoint: profile.outer.insertionPoint,
  scale: profile.outer.scale,
  rotationRad: profile.outer.rotationRad,
};
const document: CadCanonicalDocument = {
  sourceVersionKey: "f07-nested-transformed-bulge-raster-v1",
  sourceSha256: "f07-nested-transformed-bulge-raster-v1",
  acadVersion: "AC1032",
  codepage: "UTF-8",
  units: 4,
  measurement: 1,
  layers: {
    "0": {
      id: "0",
      name: "0",
      visible: true,
      frozen: false,
      locked: false,
      color: { method: "rgb", rgb: [30, 90, 220] },
      lineweightMm: 0,
      linetypeName: "CONTINUOUS",
    },
  },
  linetypes: {},
  textStyles: {},
  blocks: {
    F07_BULGE_BRANCH: {
      name: "F07_BULGE_BRANCH",
      basePoint: profile.outer.basePoint,
      entities: [innerInsert],
    },
    F07_BULGE_LEAF: {
      name: "F07_BULGE_LEAF",
      basePoint: profile.inner.basePoint,
      entities: [polyline],
    },
  },
  layouts: {},
  viewports: {},
  paperSpaceEntities: {},
  diagnostics: [],
  modelSpaceEntities: [outerInsert],
};

const scene = compileCanonicalToScene(document, {
  sceneId: "scene_f07_nested_transformed_bulge_raster",
  targetCurveErrorCssPixels: 8,
  unitsPerCssPixel: 1,
  maxTransformSingularValue: 1,
});
const curveSourceRefs: Array<{ sourceType: string; sourceHandle: string }> = [];
for (const chunkRef of scene.manifest.chunks) {
  const bytes = scene.chunks.get(chunkRef.chunkId);
  if (!bytes) throw new Error("Compiler did not return chunk " + chunkRef.chunkId);
  const metadataBytes = parseSceneChunk(bytes).sections.get(SceneTag.META)?.data as Uint8Array | undefined;
  if (!metadataBytes) continue;
  const metadata = JSON.parse(new TextDecoder().decode(metadataBytes)) as {
    curveSourceRefs?: Array<{ sourceType: string; sourceHandle: string }>;
  };
  curveSourceRefs.push(...(metadata.curveSourceRefs ?? []));
}
if (!curveSourceRefs.some((ref) => ref.sourceType === "BULGE" && ref.sourceHandle === polyline.handle)) {
  throw new Error("Compiled scene omitted the nested BULGE refinement source sidecar");
}

process.stdout.write(JSON.stringify({
  sceneId: scene.manifest.sceneId,
  manifest: scene.manifest,
  chunks: Array.from(scene.chunks, ([chunkId, bytes]) => ({
    chunkId,
    chunkBase64: Buffer.from(bytes).toString("base64"),
  })),
  curveSourceRefs,
  profile,
}));
