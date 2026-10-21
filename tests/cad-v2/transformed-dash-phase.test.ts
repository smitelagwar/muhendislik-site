import assert from "node:assert/strict";
import type { CadCanonicalDocument, CadLineEntity } from "../../src/lib/cad-v2/canonical/types";
import { compileCanonicalToScene } from "../../src/lib/cad-v2/compile/scene-compiler";
import { parseSceneChunk, SceneTag } from "../../src/lib/cad-v2/protocol/binary-protocol";

const line: CadLineEntity = { type: "LINE", handle: "SOURCE", layer: "0", order: BigInt(1),
  start: [0, 0], end: [100, 0], linetype: "DASH", lineweightMm: 0 };
const base: CadCanonicalDocument = {
  sourceVersionKey: "transformed-dash", sourceSha256: "transformed-dash",
  acadVersion: "AC1032", codepage: "UTF-8", units: 4, measurement: 1,
  layers: { "0": { id: "0", name: "0", visible: true, frozen: false, locked: false,
    color: { method: "aci", aci: 7 }, lineweightMm: 0, linetypeName: "DASH" } },
  linetypes: { DASH: { id: "DASH", name: "DASH", pattern: [10, -10], totalLength: 20 } },
  textStyles: {}, blocks: {}, layouts: {}, viewports: {}, paperSpaceEntities: {},
  diagnostics: [], modelSpaceEntities: [],
};
function decode(doc: CadCanonicalDocument, layoutId: string, maxPrimitivesPerChunk?: number) {
  const scene = compileCanonicalToScene(doc, {
    sceneId: `transformed_${layoutId}_${maxPrimitivesPerChunk ?? "single"}`,
    maxPrimitivesPerChunk,
  });
  return scene.manifest.chunks.filter((ref) => ref.layoutId === layoutId).flatMap((ref) => {
    const sections = parseSceneChunk(scene.chunks.get(ref.chunkId)!).sections;
    const origin = sections.get(SceneTag.ORIGIN)!.data as Float64Array;
    const xy = sections.get(SceneTag.XY)!.data as Float32Array;
    const path = sections.get(SceneTag.PATH_DISTANCE)!.data as Float32Array;
    const segments = [];
    for (let index = 0; index < path.length; index += 2) {
      segments.push({
        x0: origin[0]! + xy[index * 2]!,
        y0: origin[1]! + xy[index * 2 + 1]!,
        x1: origin[0]! + xy[index * 2 + 2]!,
        y1: origin[1]! + xy[index * 2 + 3]!,
        d0: path[index]!, d1: path[index + 1]!,
      });
    }
    return segments;
  });
}
const mirrored: CadCanonicalDocument = {
  ...base,
  blocks: { MIRROR: { name: "MIRROR", basePoint: [0, 0], entities: [line] } },
  modelSpaceEntities: [{ type: "INSERT", handle: "MIRROR_1", layer: "0", order: BigInt(1),
    blockName: "MIRROR", insertionPoint: [200, 0], scale: [-2, 1, 1], rotationRad: 0 }],
};
const mirroredSingle = decode(mirrored, "Model");
assert.deepEqual(decode(mirrored, "Model", 1), mirroredSingle);
assert.equal(mirroredSingle.length, 5);
for (let index = 0; index < mirroredSingle.length; index++) {
  const segment = mirroredSingle[index]!;
  assert.equal(segment.x0, 200 - 40 * index);
  assert.equal(segment.x1, 180 - 40 * index);
  assert.equal(segment.d0, 20 * index);
  assert.equal(segment.d1, 20 * index + 10);
}

const sheetLayout = { SHEET: { id: "SHEET", name: "SHEET", isModelSpace: false,
  bbox: [40, 50, 160, 150] as [number, number, number, number] } };
const viewport: CadCanonicalDocument = {
  ...base,
  layouts: sheetLayout,
  modelSpaceEntities: [line],
  viewports: { VP: { id: "VP", layoutId: "SHEET", center: [100, 100], width: 120, height: 100,
    viewCenter: [50, 0], viewHeight: 50, frozenLayers: [] } },
};
const viewportSingle = decode(viewport, "SHEET");
assert.deepEqual(decode(viewport, "SHEET", 1), viewportSingle);
assert.deepEqual(viewportSingle.map(({ d0, d1 }) => [d0, d1]), [[20, 30], [40, 50], [60, 70]]);
assert.deepEqual(viewportSingle.map(({ x0, x1 }) => [x0, x1]), [[40, 60], [80, 100], [120, 140]]);
assert.ok(viewportSingle.every(({ y0, y1 }) => y0 === 100 && y1 === 100));

const paper: CadCanonicalDocument = {
  ...base, layouts: sheetLayout,
  paperSpaceEntities: { SHEET: [{ ...line, handle: "PAPER", start: [0, 100], end: [100, 100],
    linetypeScale: 2 }] },
};
const paperSingle = decode(paper, "SHEET");
assert.deepEqual(decode(paper, "SHEET", 1), paperSingle);
assert.deepEqual(paperSingle.map(({ d0, d1 }) => [d0, d1]), [[0, 100]]);
const paperScene = compileCanonicalToScene(paper, { sceneId: "direct_paper_scaled", layoutId: "SHEET" });
const paperMeta = parseSceneChunk(paperScene.chunks.get(paperScene.manifest.chunks[0]!.chunkId)!)
  .sections.get(SceneTag.META)!.data as Uint8Array;
const paperCommands = JSON.parse(new TextDecoder().decode(paperMeta)) as {
  drawCommands: Array<{ dashStyle?: { dashSize: number; gapSize: number } }>;
};
assert.deepEqual(paperCommands.drawCommands[0]?.dashStyle, { dashSize: 20, gapSize: 20 });
console.log("PASS: mirrored INSERT 1/5, clipped 2x paper viewport 1/3, direct paper phase");
