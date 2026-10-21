import assert from "node:assert/strict";
import type { CadCanonicalDocument, CadEntity } from "../../src/lib/cad-v2/canonical/types";
import { compileCanonicalToScene } from "../../src/lib/cad-v2/compile/scene-compiler";
import { parseSceneChunk, SceneTag } from "../../src/lib/cad-v2/protocol/binary-protocol";

function documentWith(entity: CadEntity, pattern: number[]): CadCanonicalDocument {
  return {
    sourceVersionKey: "r07-multi-term", sourceSha256: "r07-multi-term",
    acadVersion: "AC1032", codepage: "UTF-8", units: 4, measurement: 1,
    layers: { "0": { id: "0", name: "0", visible: true, frozen: false, locked: false,
      color: { method: "aci", aci: 7 }, lineweightMm: 0, linetypeName: "R07" } },
    linetypes: { R07: { id: "R07", name: "R07", pattern,
      totalLength: pattern.reduce((sum, term) => sum + Math.abs(term), 0) } },
    textStyles: {}, blocks: {}, layouts: {}, viewports: {}, paperSpaceEntities: {},
    diagnostics: [], modelSpaceEntities: [entity],
  };
}

function decoded(scene: ReturnType<typeof compileCanonicalToScene>) {
  return scene.manifest.chunks.map((ref) => {
    const sections = parseSceneChunk(scene.chunks.get(ref.chunkId)!).sections;
    const path = sections.get(SceneTag.PATH_DISTANCE)?.data as Float32Array | undefined;
    const meta = JSON.parse(new TextDecoder().decode(sections.get(SceneTag.META)!.data as Uint8Array)) as {
      drawCommands: Array<{ kind: string; dashStyle?: { dashSize: number; gapSize: number; pattern?: number[] } }>;
    };
    return { ref, path: Array.from(path ?? []), commands: meta.drawCommands };
  });
}

const X = 1_000_000_000;
const Y = -1_000_000_000;
const center = [24, -8, 8, -8];
const longLine: CadEntity = { handle: "R07_LONG_LINE", type: "LINE", layer: "0",
  order: BigInt(1), start: [X, Y], end: [X + 12_000, Y], linetype: "R07" };
const lineChunks = decoded(compileCanonicalToScene(documentWith(longLine, center), { sceneId: "r07_long_center" }));
assert.ok(lineChunks.length >= 3, "12,000-unit direct line crosses spatial chunks");
assert.ok(lineChunks.every(({ commands }) => commands.some((cmd) =>
  JSON.stringify(cmd.dashStyle?.pattern) === JSON.stringify(center))),
"every spatial LINE chunk carries the same multi-term shader pattern");
const linePath = lineChunks.flatMap(({ path }) => path);
assert.equal(linePath[0], 0);
assert.equal(linePath.at(-1), 12_000);
for (let index = 2; index < linePath.length; index += 2) {
  assert.ok(Math.abs(linePath[index]! - linePath[index - 1]!) < 1e-3,
    `LINE chunk seam ${index / 2} keeps cumulative PATH_DISTANCE`);
}

const polyline: CadEntity = { handle: "R07_POLY", type: "LWPOLYLINE", layer: "0", order: BigInt(1),
  vertices: [0, 31, 62, 93, 124, 155, 184].map((x) => ({ x, y: 0 })),
  isClosed: false, plinegen: true, linetype: "R07" };
const polySingle = decoded(compileCanonicalToScene(documentWith(polyline, center), { sceneId: "r07_poly_single" }));
const polySplit = decoded(compileCanonicalToScene(documentWith(polyline, center), {
  sceneId: "r07_poly_split", maxPrimitivesPerChunk: 1,
}));
const expectedPath = [0, 31, 31, 62, 62, 93, 93, 124, 124, 155, 155, 184];
assert.deepEqual(polySingle.flatMap(({ path }) => path), expectedPath);
assert.deepEqual(polySplit.flatMap(({ path }) => path), expectedPath);
assert.equal(polySingle.length, 1);
assert.equal(polySplit.length, 6);
assert.ok(polySplit.every(({ commands }) => commands.every((cmd) =>
  JSON.stringify(cmd.dashStyle?.pattern) === JSON.stringify(center))),
"CENTER phase metadata is invariant under one versus six polyline chunks");

const leadingGap = [-8, 24, -8, 8];
const gapChunk = decoded(compileCanonicalToScene(documentWith(longLine, leadingGap), {
  sceneId: "r07_leading_gap",
}));
assert.ok(gapChunk.every(({ commands }) => commands.some((cmd) =>
  JSON.stringify(cmd.dashStyle?.pattern) === JSON.stringify(leadingGap))),
"a leading gap is retained as a shader phase term");
const phantom = [32, -6, 6, -6, 6, -6];
const phantomChunks = decoded(compileCanonicalToScene(documentWith(polyline, phantom), {
  sceneId: "r07_phantom_six_term", maxPrimitivesPerChunk: 1,
}));
assert.deepEqual(phantomChunks.flatMap(({ path }) => path), expectedPath);
assert.ok(phantomChunks.every(({ commands }) => commands.every((cmd) =>
  JSON.stringify(cmd.dashStyle?.pattern) === JSON.stringify(phantom))),
"six-term PHANTOM path uses the same cumulative shader phase across chunks");

for (const [label, entity, pattern] of [
  ["dot", longLine, [0, -8]],
  ["wide", { ...longLine, lineweightMm: 0.5 }, center],
  ["closed", { ...polyline, isClosed: true }, center],
] as const) {
  const chunks = decoded(compileCanonicalToScene(documentWith(entity as CadEntity, [...pattern]), {
    sceneId: `r07_cpu_${label}`,
  }));
  assert.ok(chunks.every(({ commands }) => commands.every((cmd) => cmd.dashStyle === undefined)),
    `${label} profile stays on the explicit CPU geometry path`);
}

console.log(`PASS: R07 multi-term PATH_DISTANCE compiler/binary phase; long=${lineChunks.length}, poly=1/6`);
