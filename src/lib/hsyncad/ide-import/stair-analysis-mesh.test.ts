import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { deflateSync, inflateSync } from "node:zlib";
import { readIdeStairAnalysisSurface } from "./stair-analysis-mesh";

const sample = "D:/IDM_DOWNLOAD/SÜHEYLA KARA PROJELER/STATİK/218 ada 50 parsel STATİK.ide10";
// Independently recorded first M01 cache locations, tied to the source hash in
// index.test.ts. The fixture is copied into memory; no source writes occur.
const sourceOffset = 6452774, connectivityOffset = 6463673;
const bbox = [19.5, 9.633151054382324, 25.5, 10.833151817321777];

test("native stair cache rejects checksum damage, truncation and invalid connectivity", { skip: !existsSync(sample) }, () => {
  const source = readFileSync(sample);
  const compressedLength = source.readUInt32LE(connectivityOffset - 8);
  const fixture = Buffer.from(source.subarray(sourceOffset, connectivityOffset + compressedLength));
  const connectivity = connectivityOffset - sourceOffset;
  const read = (bytes: Uint8Array, end = bytes.length) => readIdeStairAnalysisSurface(bytes, new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength), 0, end, bbox);
  const surface = read(fixture);
  assert.ok(surface);
  assert.equal(surface.mesh.sourceNodeCount, 336);
  assert.equal(surface.mesh.sourceFaceCount, 276);

  const damagedChecksum = Buffer.from(fixture);
  damagedChecksum[damagedChecksum.length - 1] ^= 0x01;
  assert.equal(read(damagedChecksum), undefined);
  assert.equal(read(fixture.subarray(0, fixture.length - 1)), undefined);
  assert.equal(read(fixture, fixture.length - 1), undefined, "record bounds must not be crossed");

  const raw = inflateSync(fixture.subarray(connectivity));
  raw.writeUInt32LE(336, 4); // First face points one past the native node table.
  const encoded = deflateSync(raw); // Valid compression and checksum isolate connectivity validation.
  const invalidConnectivity = Buffer.concat([fixture.subarray(0, connectivity), encoded]);
  invalidConnectivity.writeUInt32LE(encoded.length, connectivity - 8);
  assert.equal(read(invalidConnectivity), undefined);

  const wrongLength = Buffer.from(fixture);
  wrongLength.writeUInt32LE(raw.length - 1, connectivity - 4);
  assert.equal(read(wrongLength), undefined);

  const wrongCount = Buffer.from(fixture);
  wrongCount.writeUInt32LE(25_001, 4);
  assert.equal(read(wrongCount), undefined, "node allocation cap must reject excessive counts");
  const outsideBounds = Buffer.from(fixture);
  outsideBounds.writeFloatLE(100, 8);
  assert.equal(read(outsideBounds), undefined);
});
