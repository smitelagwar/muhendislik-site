import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { encodeWebGlRgbaBase64ToPng, measureRaster, readRasterPixel } from "../document-studio/cad-v2-l11-raster-metrics";

const { PNG } = require("pngjs") as {
  PNG: { sync: { write(input: { width: number; height: number; data: Buffer }): Buffer } };
};

const width = 144;
const height = 100;
const transparentPixels = Buffer.alloc(width * height * 4);
const transparentCanvas = PNG.sync.write({ width, height, data: transparentPixels });
assert.deepEqual(measureRaster(transparentCanvas), {
  width,
  height,
  foregroundPixelCount: 0,
  occupiedCellCount: 0,
  hasSubstantiveContent: false,
}, "a fully transparent canvas is blank, not drawing content");

const sparseNoisePixels = Buffer.alloc(width * height * 4);
for (const [x, y] of [[8, 8], [9, 8], [10, 8], [132, 82], [133, 82], [134, 82]]) {
  const offset = (y * width + x) * 4;
  sparseNoisePixels[offset] = 255;
  sparseNoisePixels[offset + 1] = 255;
  sparseNoisePixels[offset + 2] = 255;
  sparseNoisePixels[offset + 3] = 255;
}
const sparseNoiseCanvas = PNG.sync.write({ width, height, data: sparseNoisePixels });
const sparseNoiseRaster = measureRaster(sparseNoiseCanvas);
assert.equal(sparseNoiseRaster.foregroundPixelCount, 6);
assert.equal(sparseNoiseRaster.occupiedCellCount, 2);
assert.equal(sparseNoiseRaster.hasSubstantiveContent, false,
  "a few isolated pixels on an otherwise blank canvas are not rendered drawing content");

const r003SparseRaster = measureRaster(readFileSync("tests/fixtures/cad-v2-l11/r003-sparse-first-raster.png"));
assert.equal(r003SparseRaster.foregroundPixelCount, 146,
  "the saved R003 browser failure must retain its observed foreground-pixel signature");
assert.equal(r003SparseRaster.occupiedCellCount, 7,
  "the saved R003 browser failure must retain its observed occupied-cell signature");
assert.equal(r003SparseRaster.hasSubstantiveContent, false,
  "the real R003 sparse-noise frame must never qualify as rendered drawing content");

const drawingPixels = Buffer.alloc(width * height * 4);
for (let y = 35; y < 65; y++) {
  for (let x = 55; x < 89; x++) {
    const offset = (y * width + x) * 4;
    drawingPixels[offset] = 255;
    drawingPixels[offset + 1] = 255;
    drawingPixels[offset + 2] = 255;
    drawingPixels[offset + 3] = 255;
  }
}
const drawingCanvas = PNG.sync.write({ width, height, data: drawingPixels });
const drawingRaster = measureRaster(drawingCanvas);
assert.ok(drawingRaster.foregroundPixelCount > 0);
assert.ok(drawingRaster.occupiedCellCount > 0);
assert.equal(drawingRaster.hasSubstantiveContent, true,
  "a visible multi-cell drawing raster must qualify as substantive content");

const webGlBottomUp = Buffer.from([
  255, 0, 0, 255, 0, 255, 0, 255,
  0, 0, 255, 255, 255, 255, 255, 255,
]);
const webGlPng = encodeWebGlRgbaBase64ToPng(webGlBottomUp.toString("base64"), 2, 2);
assert.deepEqual(readRasterPixel(webGlPng, 0, 0), [0, 0, 255, 255],
  "WebGL bottom-up rows must be flipped into PNG top-down rows");
assert.deepEqual(readRasterPixel(webGlPng, 1, 0), [255, 255, 255, 255]);
assert.deepEqual(readRasterPixel(webGlPng, 0, 1), [255, 0, 0, 255]);
assert.throws(() => encodeWebGlRgbaBase64ToPng("AAAA", 2, 2), /does not match/,
  "incomplete pixel readbacks must fail closed instead of becoming false raster evidence");

console.log("PASS: L11 raster gate distinguishes transparent canvas from visible drawing pixels");
