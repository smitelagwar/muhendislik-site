import assert from "node:assert/strict";
import type { CadCanonicalDocument, CadLineEntity } from "../../src/lib/cad-v2/canonical/types";
import { compileCanonicalToScene } from "../../src/lib/cad-v2/compile/scene-compiler";
import { parseSceneChunk, SceneTag } from "../../src/lib/cad-v2/protocol/binary-protocol";

const rowY = [0, 5_000, 10_000];
const sourceLines = Array.from({ length: 40 }, (_, index) => ({
  handle: `L${index + 1}`,
  order: BigInt(index + 1),
  start: [0, rowY[index % rowY.length]!] as [number, number],
  end: [12_000, rowY[index % rowY.length]!] as [number, number],
  lineweightMm: 0,
}));
const document: CadCanonicalDocument = {
  sourceVersionKey: "spatial-painter-packing-v1",
  sourceSha256: "spatial-painter-packing-v1",
  acadVersion: "AC1032",
  codepage: "UTF-8",
  units: 4,
  measurement: 1,
  layers: { "0": { id: "0", name: "0", visible: true, frozen: false, locked: false, color: { method: "aci", aci: 7 }, lineweightMm: 0, linetypeName: "CONTINUOUS" } },
  linetypes: {}, textStyles: {}, blocks: {}, layouts: {}, viewports: {}, paperSpaceEntities: {}, diagnostics: [],
  modelSpaceEntities: sourceLines.map((line) => ({ type: "LINE", layer: "0", ...line } as CadLineEntity)),
};

const scene = compileCanonicalToScene(document, { sceneId: "spatial-painter-packing" });
assert.ok(scene.manifest.chunks.length <= 12,
  `order-safe spatial packing should reduce 120 interleaved line slices to at most 12 chunks; got ${scene.manifest.chunks.length}`);

const actualSegments: string[] = [];
for (const chunk of scene.manifest.chunks) {
  assert.ok(Math.max(chunk.bbox[2] - chunk.bbox[0], chunk.bbox[3] - chunk.bbox[1]) <= 4_096.001,
    "packed chunks stay inside the existing 4,096-unit spatial bound");
  const parsed = parseSceneChunk(scene.chunks.get(chunk.chunkId)!);
  const origin = parsed.sections.get(SceneTag.ORIGIN)!.data as Float64Array;
  const xy = parsed.sections.get(SceneTag.XY)!.data as Float32Array;
  const metadata = JSON.parse(new TextDecoder().decode(parsed.sections.get(SceneTag.META)!.data as Uint8Array)) as {
    globalOrderMax: number;
    drawCommands: Array<{ globalOrderIndex?: number }>;
  };
  assert.ok(metadata.drawCommands.length > 0 && metadata.drawCommands.every((command) =>
    Number.isSafeInteger(command.globalOrderIndex) && command.globalOrderIndex! >= 0 && command.globalOrderIndex! < sourceLines.length),
  "every spatially reordered command retains its exact source painter rank");
  for (let offset = 0; offset < xy.length; offset += 4) {
    const values = [
      origin[0]! + xy[offset]!, origin[1]! + xy[offset + 1]!,
      origin[0]! + xy[offset + 2]!, origin[1]! + xy[offset + 3]!,
    ].map((value) => Math.round(value * 1_000) / 1_000);
    actualSegments.push(values.join(","));
  }
}

const expectedSegments = sourceLines.flatMap((line) => [0, 4_000, 8_000].map((startX) =>
  [startX, line.start[1], startX + 4_000, line.start[1]].join(",")));
assert.deepEqual(actualSegments.sort(), expectedSegments.sort(),
  "spatial packing keeps every source line slice byte-for-byte equivalent in world coordinates");
assert.equal(scene.manifest.qualityStatus, "exact", "reordering geometry into spatial batches does not degrade source quality");
console.log(`spatial-painter-packing: PASS (${sourceLines.length * 3} exact line slices packed into ${scene.manifest.chunks.length} bounded chunks)`);
