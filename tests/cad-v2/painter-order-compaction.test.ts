import assert from "node:assert/strict";
import {
  CAD_V2_PAINTER_DEPTH_MAX_ORDER,
  createPainterOrderIndex,
} from "../../src/lib/cad-v2/painter-order-compaction";

const redLine = { kind: "line", order: 1n, layer: "A", color: [1, 0, 0] } as const;
const blueLine = { kind: "line", order: 2n, layer: "A", color: [0, 0, 1] } as const;
const sameStyleLaterEntity = { ...redLine, order: 2n } as const;
const solidFill = { kind: "triangle", order: 2n, layer: "FILL", color: [0, 1, 0] } as const;
const otherFill = { kind: "triangle", order: 2n, layer: "OTHER", color: [0, 1, 0] } as const;
const wipeout = { kind: "wipeout", order: 2n, layer: "MASK", color: [0, 0, 0] } as const;
const redLineOrder3 = { ...redLine, order: 3n } as const;
const phaseBearingLine = { ...redLineOrder3, pathDistanceRequired: true } as const;

const primitives = [
  redLine,
  { ...redLine, x0: 1 },
  sameStyleLaterEntity,
  blueLine,
  solidFill,
  { ...solidFill, x0: 2 },
  otherFill,
  wipeout,
  { ...wipeout, x0: 1 },
  redLineOrder3,
  phaseBearingLine,
].map((primitive) => ({ ...primitive, color: primitive.color as [number, number, number] })) as any[];

const order = createPainterOrderIndex(primitives);
assert.equal(order.compacted, true, "repeated same-style source primitives compact into one painter rank");
assert.equal(order.runCount, 9, "source entities, styles, primitive kinds, masks, and path-phase groups keep separate ranks");
assert.equal(order.globalOrderMax, 8, "renderer depth range reflects painter groups, not tessellated segment count");
assert.deepEqual(primitives.map((_, index) => order.orderIndexForSourceIndex(index)),
  [0, 0, 1, 2, 3, 3, 4, 5, 6, 7, 8],
  "compaction preserves each entity boundary and source order while sharing ranks within one tessellated entity");
assert.equal(order.orderIndexForSourceIndex(-1), null, "negative source indexes are rejected");
assert.equal(order.orderIndexForSourceIndex(primitives.length), null, "out-of-range source indexes are rejected");
assert.equal(CAD_V2_PAINTER_DEPTH_MAX_ORDER, 4_000_000,
  "painter-depth precision policy remains unchanged by metadata compaction");

console.log("painter-order compaction PASS");
