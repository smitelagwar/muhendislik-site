import { expect, test, type Locator, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { inflateSync } from "node:zlib";

const FIXTURE = "stage2-lineweight-fidelity.dxf";
const FIXTURE_DIR = path.resolve(process.cwd(), "tests", "fixtures", "dxf");
type Rgb = [number, number, number];

type RuntimeSnapshot = {
  origin: { x: number; y: number } | null;
  camera: {
    left: number;
    right: number;
    top: number;
    bottom: number;
    zoom: number;
    position: { x: number; y: number; z: number };
  } | null;
};

type LineweightSnapshot = {
  enabled: boolean;
  sourceLineObjectCount: number;
  supportedLineObjectCount: number;
  unsupportedLineObjectCount: number;
  segmentCount: number;
  distinctLineweights: number[];
  minDisplayPx: number | null;
  maxDisplayPx: number | null;
  overlayObjectCount: number;
};

type DecodedPng = {
  width: number;
  height: number;
  channels: number;
  pixels: Buffer;
};

async function login(page: Page) {
  const response = await page.request.post("/api/dokumantasyon/giris", {
    data: { username: "admin", password: "admin" },
  });
  const payload = await response.json().catch(() => ({}));
  expect(response.ok(), payload.error || `DXF Stage 2 login failed (${response.status()})`).toBeTruthy();
}

async function uploadFixture(page: Page): Promise<string> {
  const buffer = await readFile(path.join(FIXTURE_DIR, FIXTURE));
  const response = await page.request.post("/api/dokumantasyon/upload/local", {
    multipart: {
      file: { name: `stage2-${Date.now()}-${FIXTURE}`, mimeType: "application/dxf", buffer },
      pathname: `dok_storage/dxf-stage2-${Date.now()}-${Math.random().toString(36).slice(2)}-${FIXTURE}`,
    },
  });
  const payload = await response.json();
  expect(response.ok(), payload.error || "DXF Stage 2 fixture upload failed").toBeTruthy();
  return payload.file.id as string;
}

function assertBuffer(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function paeth(left: number, up: number, upperLeft: number): number {
  const p = left + up - upperLeft;
  const pa = Math.abs(p - left);
  const pb = Math.abs(p - up);
  const pc = Math.abs(p - upperLeft);
  if (pa <= pb && pa <= pc) return left;
  if (pb <= pc) return up;
  return upperLeft;
}

function decodePng(png: Buffer): DecodedPng {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  assertBuffer(png.subarray(0, 8).equals(signature), "Screenshot is not PNG");

  let offset = 8;
  let width = 0;
  let height = 0;
  let bitDepth = 0;
  let colorType = -1;
  let interlace = -1;
  const idat: Buffer[] = [];

  while (offset + 12 <= png.length) {
    const length = png.readUInt32BE(offset);
    const type = png.subarray(offset + 4, offset + 8).toString("ascii");
    const start = offset + 8;
    const end = start + length;
    assertBuffer(end + 4 <= png.length, `Invalid PNG ${type} chunk`);
    const data = png.subarray(start, end);

    if (type === "IHDR") {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      bitDepth = data[8];
      colorType = data[9];
      interlace = data[12];
    } else if (type === "IDAT") {
      idat.push(data);
    } else if (type === "IEND") {
      break;
    }
    offset = end + 4;
  }

  assertBuffer(width > 0 && height > 0, "PNG dimensions invalid");
  assertBuffer(bitDepth === 8 && interlace === 0, "Unexpected PNG format");
  const channels = colorType === 6 ? 4 : colorType === 2 ? 3 : 0;
  assertBuffer(channels > 0, `Unsupported PNG color type ${colorType}`);

  const raw = inflateSync(Buffer.concat(idat));
  const stride = width * channels;
  const pixels = Buffer.alloc(stride * height);
  let source = 0;

  for (let y = 0; y < height; y += 1) {
    const filter = raw[source++];
    const row = y * stride;
    const previous = (y - 1) * stride;
    for (let x = 0; x < stride; x += 1) {
      const value = raw[source + x];
      const left = x >= channels ? pixels[row + x - channels] : 0;
      const up = y > 0 ? pixels[previous + x] : 0;
      const upperLeft = y > 0 && x >= channels ? pixels[previous + x - channels] : 0;
      let decoded = value;
      if (filter === 1) decoded += left;
      else if (filter === 2) decoded += up;
      else if (filter === 3) decoded += Math.floor((left + up) / 2);
      else if (filter === 4) decoded += paeth(left, up, upperLeft);
      else if (filter !== 0) throw new Error(`Unsupported PNG filter ${filter}`);
      pixels[row + x] = decoded & 0xff;
    }
    source += stride;
  }

  return { width, height, channels, pixels };
}

async function surfaceScreenshot(page: Page, surface: Locator): Promise<DecodedPng> {
  const box = await surface.boundingBox();
  assertBuffer(box !== null, "DXF surface bounds missing");
  return decodePng(await page.screenshot({
    animations: "disabled",
    clip: {
      x: Math.max(0, box.x),
      y: Math.max(0, box.y),
      width: box.width,
      height: box.height,
    },
  }));
}

function countInkPixels(image: DecodedPng): number {
  let count = 0;
  for (let pixel = 0; pixel < image.width * image.height; pixel += 1) {
    const offset = pixel * image.channels;
    const red = image.pixels[offset];
    const green = image.pixels[offset + 1];
    const blue = image.pixels[offset + 2];
    if (Math.max(red, green, blue) >= 70) count += 1;
  }
  return count;
}

function countStronglyColoredPixels(image: DecodedPng): number {
  let count = 0;
  for (let pixel = 0; pixel < image.width * image.height; pixel += 1) {
    const offset = pixel * image.channels;
    const red = image.pixels[offset];
    const green = image.pixels[offset + 1];
    const blue = image.pixels[offset + 2];
    const max = Math.max(red, green, blue);
    const min = Math.min(red, green, blue);
    if (max >= 70 && max - min >= 30) count += 1;
  }
  return count;
}

function modelToPixel(snapshot: RuntimeSnapshot, image: DecodedPng, x: number, y: number) {
  assertBuffer(snapshot.origin !== null && snapshot.camera !== null, "DXF camera/origin snapshot missing");
  const camera = snapshot.camera;
  const zoom = camera.zoom || 1;
  const localX = x - snapshot.origin.x;
  const localY = y - snapshot.origin.y;
  const left = camera.position.x + camera.left / zoom;
  const right = camera.position.x + camera.right / zoom;
  const bottom = camera.position.y + camera.bottom / zoom;
  const top = camera.position.y + camera.top / zoom;
  return {
    x: ((localX - left) / (right - left)) * (image.width - 1),
    y: ((top - localY) / (top - bottom)) * (image.height - 1),
  };
}

function rgbAt(image: DecodedPng, x: number, y: number): Rgb {
  const px = Math.max(0, Math.min(image.width - 1, Math.round(x)));
  const py = Math.max(0, Math.min(image.height - 1, Math.round(y)));
  const offset = (py * image.width + px) * image.channels;
  return [image.pixels[offset], image.pixels[offset + 1], image.pixels[offset + 2]];
}

function colorDistance(left: Rgb, right: Rgb): number {
  return Math.max(
    Math.abs(left[0] - right[0]),
    Math.abs(left[1] - right[1]),
    Math.abs(left[2] - right[2])
  );
}

function bestRgbNear(image: DecodedPng, point: { x: number; y: number }, expected: Rgb, radius = 4): Rgb {
  let best = rgbAt(image, point.x, point.y);
  let distance = colorDistance(best, expected);
  for (let y = -radius; y <= radius; y += 1) {
    for (let x = -radius; x <= radius; x += 1) {
      const candidate = rgbAt(image, point.x + x, point.y + y);
      const next = colorDistance(candidate, expected);
      if (next < distance) {
        best = candidate;
        distance = next;
      }
    }
  }
  return best;
}

function expectModelColor(
  image: DecodedPng,
  snapshot: RuntimeSnapshot,
  model: { x: number; y: number },
  expected: Rgb,
  label: string,
  tolerance = 40
) {
  const point = modelToPixel(snapshot, image, model.x, model.y);
  const actual = bestRgbNear(image, point, expected);
  expect(colorDistance(actual, expected), `${label}: ${actual.join(",")} vs ${expected.join(",")}`).toBeLessThanOrEqual(tolerance);
}

async function lineweightSnapshot(page: Page): Promise<LineweightSnapshot> {
  const output = page.getByTestId("cad-dxf-lineweight-snapshot");
  await expect(output).toBeAttached({ timeout: 30_000 });
  return JSON.parse((await output.textContent()) || "{}") as LineweightSnapshot;
}

test.describe("DXF Stage 2 render controls", () => {
  test.skip(({ browserName }) => browserName !== "chromium", "DXF renderer evidence is gated in Chromium.");

  test("source/monochrome and hairline/lineweight are independent without CAD-state loss", async ({ page }, testInfo) => {
    test.setTimeout(120_000);
    await page.setViewportSize({ width: 1280, height: 820 });
    await login(page);
    const fileId = await uploadFixture(page);
    await page.goto(`/dokumantasyon/dosya/${fileId}`);

    const viewer = page.getByTestId("cad-dxf-viewer");
    const surface = page.getByTestId("cad-dxf-canvas");
    const canvas = surface.locator("canvas").first();
    const colorToggle = page.getByTestId("cad-dxf-color-mode-toggle");
    const lineweightToggle = page.getByTestId("cad-dxf-lineweight-toggle");

    await expect(viewer).toBeVisible();
    await expect(canvas).toBeVisible();
    await expect(colorToggle).toBeEnabled({ timeout: 30_000 });
    await expect(lineweightToggle).toBeEnabled({ timeout: 30_000 });
    await expect(colorToggle).toHaveAttribute("data-mode", "true-color");
    await expect(lineweightToggle).toHaveAttribute("data-mode", "hairline");
    await expect(canvas).toHaveAttribute("data-dxf-color-mode", "true-color");
    await expect(canvas).toHaveAttribute("data-dxf-lineweight-mode", "hairline");

    const runtimeNode = page.getByTestId("cad-dxf-runtime-snapshot");
    const layerNode = page.getByTestId("cad-dxf-layer-snapshot");
    await expect(runtimeNode).toBeAttached();
    await expect(layerNode).toBeAttached();
    const runtimeBefore = await runtimeNode.textContent();
    const layersBefore = await layerNode.textContent();
    const runtime = JSON.parse(runtimeBefore || "{}") as RuntimeSnapshot;

    await canvas.evaluate((element) => {
      element.dataset.stage2StableCanvas = "true";
    });

    const initialLineweight = await lineweightSnapshot(page);
    expect(initialLineweight.enabled).toBe(false);
    expect(initialLineweight.unsupportedLineObjectCount).toBe(0);
    expect(initialLineweight.supportedLineObjectCount).toBeGreaterThanOrEqual(7);
    expect(initialLineweight.distinctLineweights).toEqual(expect.arrayContaining([13, 18, 25, 35, 50, 70]));
    expect(initialLineweight.minDisplayPx).not.toBeNull();
    expect(initialLineweight.maxDisplayPx).not.toBeNull();
    expect(initialLineweight.maxDisplayPx!).toBeGreaterThan(initialLineweight.minDisplayPx!);

    const sourceHairline = await surfaceScreenshot(page, surface);
    const sourceHairlineInk = countInkPixels(sourceHairline);
    expect(countStronglyColoredPixels(sourceHairline)).toBeGreaterThan(100);
    expectModelColor(sourceHairline, runtime, { x: 50, y: 60 }, [0, 255, 255], "OVER_B must remain the top coincident line", 80);

    await lineweightToggle.click();
    await expect(lineweightToggle).toHaveAttribute("data-mode", "source");
    await expect(lineweightToggle).toHaveAttribute("aria-pressed", "true");
    await expect(canvas).toHaveAttribute("data-dxf-lineweight-mode", "source");
    await page.waitForTimeout(120);

    const sourceLineweight = await surfaceScreenshot(page, surface);
    const sourceLineweightInk = countInkPixels(sourceLineweight);
    expect(sourceLineweightInk, "source lineweight must visibly increase rasterized line area").toBeGreaterThan(sourceHairlineInk * 1.15);
    const enabledSnapshot = await lineweightSnapshot(page);
    expect(enabledSnapshot.enabled).toBe(true);
    expect(enabledSnapshot.overlayObjectCount).toBeGreaterThan(0);
    expect(enabledSnapshot.overlayObjectCount).toBeLessThanOrEqual(enabledSnapshot.supportedLineObjectCount);

    await colorToggle.click();
    await expect(colorToggle).toHaveAttribute("data-mode", "monochrome");
    await expect(canvas).toHaveAttribute("data-dxf-color-mode", "monochrome");
    await expect(canvas).toHaveCSS("filter", "none");
    await page.waitForTimeout(120);

    const monochromeLineweight = await surfaceScreenshot(page, surface);
    expect(countStronglyColoredPixels(monochromeLineweight), "monochrome mode must be renderer-level neutral output").toBeLessThanOrEqual(2);
    expect((await lineweightSnapshot(page)).enabled).toBe(true);

    await lineweightToggle.click();
    await expect(lineweightToggle).toHaveAttribute("data-mode", "hairline");
    await expect(canvas).toHaveAttribute("data-dxf-lineweight-mode", "hairline");
    await page.waitForTimeout(120);

    const monochromeHairline = await surfaceScreenshot(page, surface);
    expect(countStronglyColoredPixels(monochromeHairline)).toBeLessThanOrEqual(2);
    expect(countInkPixels(monochromeHairline), "hairline must reduce line raster area after LWT is disabled")
      .toBeLessThan(countInkPixels(monochromeLineweight) * 0.92);

    await colorToggle.click();
    await expect(colorToggle).toHaveAttribute("data-mode", "true-color");
    await expect(canvas).toHaveAttribute("data-dxf-color-mode", "true-color");
    await expect(canvas).toHaveAttribute("data-stage2-stable-canvas", "true");
    expect(await runtimeNode.textContent(), "camera/runtime state changed while switching render modes").toBe(runtimeBefore);
    expect(await layerNode.textContent(), "layer state changed while switching render modes").toBe(layersBefore);

    await page.getByRole("button", { name: "Katmanlar" }).click();
    const overB = page.getByTestId("cad-dxf-layer-OVER_B");
    await expect(overB).toHaveAttribute("data-visible", "true");
    await overB.click();
    await expect(overB).toHaveAttribute("data-visible", "false");
    await page.waitForTimeout(80);

    const underOverlap = await surfaceScreenshot(page, surface);
    expectModelColor(underOverlap, runtime, { x: 50, y: 60 }, [255, 0, 255], "OVER_A must remain under the coincident OVER_B entity", 80);

    await overB.click();
    await expect(overB).toHaveAttribute("data-visible", "true");
    expect(await layerNode.textContent(), "coincident-layer visibility did not restore exactly").toBe(layersBefore);

    await testInfo.attach("dxf-stage2-render-controls.png", { body: await page.screenshot({ animations: "disabled" }), contentType: "image/png" });
  });

  test("render controls remain usable without horizontal overflow on mobile", async ({ page }) => {
    test.setTimeout(120_000);
    await page.setViewportSize({ width: 390, height: 844 });
    await login(page);
    const fileId = await uploadFixture(page);
    await page.goto(`/dokumantasyon/dosya/${fileId}`);

    const viewer = page.getByTestId("cad-dxf-viewer");
    const canvas = page.getByTestId("cad-dxf-canvas").locator("canvas").first();
    const colorToggle = page.getByTestId("cad-dxf-color-mode-toggle");
    const lineweightToggle = page.getByTestId("cad-dxf-lineweight-toggle");

    await expect(viewer).toBeVisible();
    await expect(colorToggle).toBeEnabled({ timeout: 30_000 });
    await expect(lineweightToggle).toBeEnabled({ timeout: 30_000 });

    const metrics = await viewer.evaluate((element) => ({
      scrollWidth: element.scrollWidth,
      clientWidth: element.clientWidth,
    }));
    expect(metrics.scrollWidth, "DXF viewer horizontally overflows at 390px").toBeLessThanOrEqual(metrics.clientWidth + 1);

    for (const control of [colorToggle, lineweightToggle]) {
      const box = await control.boundingBox();
      expect(box).not.toBeNull();
      expect(box!.x).toBeGreaterThanOrEqual(0);
      expect(box!.x + box!.width).toBeLessThanOrEqual(390);
    }

    await lineweightToggle.click();
    await expect(canvas).toHaveAttribute("data-dxf-lineweight-mode", "source");
    await colorToggle.click();
    await expect(canvas).toHaveAttribute("data-dxf-color-mode", "monochrome");
    await expect(canvas).toHaveCSS("filter", "none");
  });
});
