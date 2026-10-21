import assert from "node:assert/strict";
import { BlockTransformer } from "../../src/lib/cad-v2/compile/block-transformer";
import type { CadBlockDefinition, CadInsertEntity, CadLineEntity } from "../../src/lib/cad-v2/canonical/types";

const block: CadBlockDefinition = {
  name: "STREAM_FIXTURE",
  basePoint: [0, 0],
  entities: [
    { type: "LINE", handle: "L1", layer: "0", order: 1n, start: [0, 0], end: [10, 0] },
    { type: "LINE", handle: "L2", layer: "0", order: 2n, start: [0, 1], end: [10, 1] },
  ] as CadLineEntity[],
};
const insert: CadInsertEntity = {
  type: "INSERT",
  handle: "I1",
  layer: "0",
  order: 10n,
  blockName: "STREAM_FIXTURE",
  insertionPoint: [5, 7],
  scale: [1, 1, 1],
  rotationRad: 0,
};
const transformer = new BlockTransformer({ blocks: { [block.name]: block }, layers: {} });

const materialized = transformer.expandInsert(insert);
const expected = transformer.getLastResult()!.drawItems.map((draw) => ({
  kind: draw.kind,
  item: draw.item,
}));
const streamed: Array<{ kind: string; item: object }> = [];
const result = transformer.expandInsertWithSink(insert, (kind, item) => streamed.push({ kind, item }));

assert.equal(result.drawItems.length, 0, "streamed expansion must not retain one draw wrapper per primitive");
assert.equal(result.segments.length, materialized.length, "glyph and dimension processing retains the source segment references");
assert.equal(streamed.length, expected.length, "every expanded primitive is streamed exactly once");
assert.deepEqual(streamed.map(({ kind, item }) => ({ kind, x0: (item as { x0: number }).x0, y0: (item as { y0: number }).y0 })),
  expected.map(({ kind, item }) => ({ kind, x0: (item as { x0: number }).x0, y0: (item as { y0: number }).y0 })),
  "streaming preserves visitor order and transformed coordinates");
assert.equal(streamed[0]!.item, result.segments[0], "streaming hands the compiler the visitor's segment object without cloning it");

process.stdout.write("block transformer streaming retention and parity PASS\n");
