import test from "node:test";
import assert from "node:assert/strict";
import {
  IDE_201094_MAGIC,
  buildIde201094EmptySlotFrame,
  buildIde201094Frame,
  inflateIde201094Stream,
  scanIde201094Streams,
  writeIde201094Stream,
} from "./ide-zlib";

/** Deterministic LCG so the "random payload" tests are reproducible (TDD, no flaky runs). */
function pseudoRandomBytes(length: number, seed: number): Uint8Array {
  const out = new Uint8Array(length);
  let state = (seed >>> 0) || 0x2f6e2b1;
  for (let i = 0; i < length; i++) {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    out[i] = (state >>> 23) & 0xff;
  }
  return out;
}

test("writeIde201094Stream frame is read back by scanIde201094Streams (T-F3.1 a)", () => {
  const raw = pseudoRandomBytes(64, 1);
  const target = new Uint8Array(256);
  const end = writeIde201094Stream(target, 0, raw);
  assert.ok(end > 12, "frame must be longer than its 12-byte header");

  const view = new DataView(target.buffer, target.byteOffset, target.byteLength);
  assert.equal(view.getUint32(0, true), IDE_201094_MAGIC);
  assert.equal(view.getUint32(4, true), end - 12);
  assert.equal(view.getUint32(8, true), raw.length);

  const streams = scanIde201094Streams(target);
  assert.equal(streams.length, 1);
  assert.equal(streams[0].offset, 0);
  assert.equal(streams[0].payloadOffset, 12);
  assert.equal(streams[0].compressedLength, end - 12);
  assert.equal(streams[0].rawLength, raw.length);
  assert.equal(streams[0].endOffset, end);
});

test("written 201094 frame roundtrips byte-identical (T-F3.1 b)", () => {
  const raw = pseudoRandomBytes(500, 2);
  const frame = buildIde201094Frame(raw);
  assert.equal(frame.length, 12 + new DataView(frame.buffer).getUint32(4, true));

  const streams = scanIde201094Streams(frame);
  assert.equal(streams.length, 1);
  const inflated = inflateIde201094Stream(frame, streams[0]);
  assert.equal(inflated.length, raw.length);
  assert.deepEqual(Array.from(inflated), Array.from(raw));
});

test("empty-slot frame writes rawLen=4 with four zero bytes (T-F3.1 c, gramer §2.2/§16)", () => {
  const frame = buildIde201094EmptySlotFrame();
  const streams = scanIde201094Streams(frame);
  assert.equal(streams.length, 1);
  assert.equal(streams[0].rawLength, 4);
  const inflated = inflateIde201094Stream(frame, streams[0]);
  assert.deepEqual(Array.from(inflated), [0, 0, 0, 0]);

  // Gramer §16 also documents 16-byte zero slots (152 döşeme yuvası).
  const slabSlot = buildIde201094EmptySlotFrame(16);
  const slabStreams = scanIde201094Streams(slabSlot);
  assert.equal(slabStreams.length, 1);
  assert.equal(slabStreams[0].rawLength, 16);
  const slabRaw = inflateIde201094Stream(slabSlot, slabStreams[0]);
  assert.equal(slabRaw.length, 16);
  assert.ok(Array.from(slabRaw).every((b) => b === 0));
});

test("multiple frames written back-to-back are all scanned (T-F3.1 d)", () => {
  const first = pseudoRandomBytes(100, 3);
  const second = pseudoRandomBytes(200, 4);
  const target = new Uint8Array(1024);
  const endFirst = writeIde201094Stream(target, 0, first);
  const endSecond = writeIde201094Stream(target, endFirst, second);

  const streams = scanIde201094Streams(target);
  assert.equal(streams.length, 2);
  assert.equal(streams[0].offset, 0);
  assert.equal(streams[0].endOffset, endFirst);
  assert.equal(streams[1].offset, endFirst);
  assert.equal(streams[1].endOffset, endSecond);
  assert.deepEqual(
    Array.from(inflateIde201094Stream(target, streams[0])),
    Array.from(first),
  );
  assert.deepEqual(
    Array.from(inflateIde201094Stream(target, streams[1])),
    Array.from(second),
  );
});

test("13.564 B node-record size class roundtrips byte-identical (T-F3.1 e)", () => {
  const raw = pseudoRandomBytes(13_564, 5);
  const frame = buildIde201094Frame(raw);
  const streams = scanIde201094Streams(frame);
  assert.equal(streams.length, 1);
  assert.equal(streams[0].rawLength, 13_564);
  const inflated = inflateIde201094Stream(frame, streams[0]);
  assert.deepEqual(Array.from(inflated), Array.from(raw));
});

test("roundtrip identity is independent of the zlib level (T-F3.1 seviye notu)", () => {
  const raw = pseudoRandomBytes(300, 6);
  for (const level of [0, 1, 2, 3, 4, 5, 6]) {
    const frame = buildIde201094Frame(raw, { level });
    const streams = scanIde201094Streams(frame);
    assert.equal(streams.length, 1, `level ${level} frame must be scannable`);
    assert.deepEqual(
      Array.from(inflateIde201094Stream(frame, streams[0])),
      Array.from(raw),
      `level ${level} roundtrip must be byte-identical`,
    );
  }
});
