import test from "node:test";
import assert from "node:assert/strict";
import { createIdeDataView, decodeIdeNumericBlock, hasIdeEncodedNumbers } from "./numeric-codec";

const vectors = [
  ["b6b96b004019a068", 0], ["a4f78a24c568efbe", 3],
  ["1db33396643674b8", 13.5], ["33ed9728fb8a2229", 10.5],
  ["852db5ebcd4c587a", 1.6],
] as const;
function carrier() {
  const bytes = new Uint8Array(160), raw = new DataView(bytes.buffer);
  raw.setUint32(74, 211220, true); raw.setUint8(78, 1);
  return { bytes, raw };
}

test("native encoded float64 matches five independently established project values", () => {
  for (const [cipher, value] of vectors) {
    const { bytes } = carrier(); bytes.set(Buffer.from(cipher, "hex"), 96);
    const before = bytes.slice(), view = createIdeDataView(bytes.buffer);
    const expected = new Uint8Array(8); new DataView(expected.buffer).setFloat64(0, value, true);
    assert.deepEqual(decodeIdeNumericBlock(view, 96), expected);
    assert.equal(view.getFloat64(96, true), value);
    assert.equal(view.getFloat64(96), new DataView(expected.buffer).getFloat64(0));
    assert.deepEqual(bytes, before);
  }
});

test("adapter preserves raw integers, float32, unaligned offsets and DataView range checks", () => {
  const { bytes, raw } = carrier(); bytes.set(Buffer.from(vectors[1][0], "hex"), 97);
  raw.setUint32(110, 0x12345678, true); raw.setFloat32(115, 2.5, true);
  const view = createIdeDataView(bytes.buffer);
  assert.equal(view.getFloat64(97, true), 3);
  assert.equal(view.getUint32(110, true), 0x12345678);
  assert.equal(view.getFloat32(115, true), 2.5);
  assert.throws(() => view.getFloat64(153, true), RangeError);
  assert.throws(() => view.getFloat64(-1, true), RangeError);
  assert.throws(() => view.getFloat64(Infinity, true), RangeError);
});

test("encoding choice follows the supported native header rather than a filename or weak number heuristic", () => {
  const { bytes, raw } = carrier(); assert.equal(hasIdeEncodedNumbers(bytes.buffer), true);
  raw.setUint32(74, 211221, true);
  assert.equal(hasIdeEncodedNumbers(bytes.buffer), false);
  assert.throws(() => createIdeDataView(bytes.buffer), /kodlama sürümü/);
  raw.setUint8(78, 0); raw.setFloat64(96, -2.5, true);
  assert.equal(createIdeDataView(bytes.buffer).getFloat64(96, true), -2.5);
  assert.doesNotThrow(() => createIdeDataView(new ArrayBuffer(10)));
});
