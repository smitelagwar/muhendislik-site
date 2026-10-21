const { PNG } = require("pngjs") as {
  PNG: {
    sync: {
      read(buffer: Buffer): { width: number; height: number; data: Uint8Array };
      write(input: { width: number; height: number; data: Buffer }): Buffer;
    };
  };
};

export function encodeWebGlRgbaBase64ToPng(base64: string, width: number, height: number): Buffer {
  if (!Number.isSafeInteger(width) || width < 1 || !Number.isSafeInteger(height) || height < 1) {
    throw new RangeError(`WebGL raster dimensions must be positive integers; received ${width}x${height}.`);
  }
  const bottomUp = Buffer.from(base64, "base64");
  const expectedBytes = width * height * 4;
  if (bottomUp.length !== expectedBytes) {
    throw new RangeError(`WebGL RGBA byte count ${bottomUp.length} does not match ${width}x${height}x4 (${expectedBytes}).`);
  }
  const rowBytes = width * 4;
  const topDown = Buffer.allocUnsafe(expectedBytes);
  for (let row = 0; row < height; row++) {
    const sourceOffset = (height - 1 - row) * rowBytes;
    bottomUp.copy(topDown, row * rowBytes, sourceOffset, sourceOffset + rowBytes);
  }
  return PNG.sync.write({ width, height, data: topDown });
}

export function measureRaster(pngBytes: Buffer) {
  const image = PNG.sync.read(pngBytes);
  const cornerSize = Math.min(8, image.width, image.height);
  const backgrounds = new Map<string, { rgb: [number, number, number]; count: number }>();
  for (const [left, top] of [
    [0, 0], [image.width - cornerSize, 0], [0, image.height - cornerSize],
    [image.width - cornerSize, image.height - cornerSize],
  ]) {
    for (let y = top; y < top + cornerSize; y++) {
      for (let x = left; x < left + cornerSize; x++) {
        const offset = (y * image.width + x) * 4;
        const rgb: [number, number, number] = [image.data[offset]!, image.data[offset + 1]!, image.data[offset + 2]!];
        const key = rgb.join(",");
        const previous = backgrounds.get(key);
        backgrounds.set(key, { rgb, count: (previous?.count ?? 0) + 1 });
      }
    }
  }
  const background = Array.from(backgrounds.values()).sort((left, right) => right.count - left.count)[0]!.rgb;
  const cells = new Uint32Array(20 * 20);
  let foregroundPixelCount = 0;
  for (let y = 0; y < image.height; y++) {
    for (let x = 0; x < image.width; x++) {
      const offset = (y * image.width + x) * 4;
      const alpha = image.data[offset + 3]!;
      const delta = Math.max(
        Math.abs(image.data[offset]! - background[0]),
        Math.abs(image.data[offset + 1]! - background[1]),
        Math.abs(image.data[offset + 2]! - background[2]),
      );
      if (alpha < 8 || delta < 16) continue;
      foregroundPixelCount++;
      const column = Math.min(19, Math.floor(x / image.width * 20));
      const row = Math.min(19, Math.floor(y / image.height * 20));
      cells[row * 20 + column]++;
    }
  }
  const occupiedCellCount = Array.from(cells).filter((count) => count >= 3).length;
  // Calibrated against the real R002 v73 diagnostic raster (4,469 pixels / 34 cells)
  // and the saved R003 false-positive frame (146 pixels / 7 cells). Scale the pixel
  // floor with canvas area; keep the spatial floor fixed on the 20x20 occupancy grid.
  const minimumSubstantivePixelCount = Math.max(1, Math.ceil(image.width * image.height * 1_000 / (1_440 * 852)));
  return {
    width: image.width,
    height: image.height,
    foregroundPixelCount,
    occupiedCellCount,
    hasSubstantiveContent: foregroundPixelCount >= minimumSubstantivePixelCount && occupiedCellCount >= 8,
  };
}

export function readRasterPixel(pngBytes: Buffer, x: number, y: number): [number, number, number, number] {
  const image = PNG.sync.read(pngBytes);
  if (!Number.isInteger(x) || !Number.isInteger(y) || x < 0 || y < 0 || x >= image.width || y >= image.height) {
    throw new RangeError(`Raster pixel ${x},${y} is outside ${image.width}x${image.height}.`);
  }
  const offset = (y * image.width + x) * 4;
  return [image.data[offset]!, image.data[offset + 1]!, image.data[offset + 2]!, image.data[offset + 3]!];
}
