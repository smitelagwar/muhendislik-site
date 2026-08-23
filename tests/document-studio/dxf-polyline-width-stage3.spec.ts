import { expect, test, type Locator, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { inflateSync } from "node:zlib";

const FIXTURE = "stage3-wide-polylines.dxf";
const FIXTURE_DIR = path.resolve(process.cwd(), "tests", "fixtures", "dxf");

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
  expect(response.ok(), payload.error || `DXF Stage 3 login failed (${response.status()})`).toBeTruthy();
}

async function uploadFixture(page: Page): Promise<string> {
  const buffer = await readFile(path.join(FIXTURE_DIR, FIXTURE));
  const response = await page.request.post("/api/dokumantasyon/upload/local", {
    multipart: {
      file: { name: `stage3-${Date.now()}-${FIXTURE}`, mimeType: "application/dxf", buffer },
      pathname: `dok_storage/dxf-stage3-${Date.now()}-${Math.random().toString(36).slice(2)}-${FIXTURE}`,
    },
  });
  const payload = await response.json();
  expect(response.ok(), payload.error || "DXF Stage 3 fixture upload failed").toBeTruthy();
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

async function surfaceScreenshot(surface: Locator): Promise<DecodedPng> {
  return decodePng(await surface.screenshot({ animations: "disabled" }));
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

function isInk(image: DecodedPng, x: number, y: number): boolean {
  if (x < 0 || y < 0 || x >= image.width || y >= image.height) return false;
  const offset = (Math.round(y) * image.width + Math.round(x)) * image.channels;
  return Math.max(image.pixels[offset], image.pixels[offset + 1], image.pixels[offset + 2]) >= 60;
}

function verticalInkRows(
  image: DecodedPng,
  snapshot: RuntimeSnapshot,
  model: { x: number; y: number },
  radiusX = 3,
  radiusY = 35
): number {
  const center = modelToPixel(snapshot, image, model.x, model.y);
  let count = 0;
  for (let y = Math.round(center.y) - radiusY; y <= Math.round(center.y) + radiusY; y += 1) {
    let rowHasInk = false;
    for (let x = Math.round(center.x) - radiusX; x <= Math.round(center.x) + radiusX; x += 1) {
      if (isInk(image, x, y)) {
        rowHasInk = true;
        break;
      }
    }
    if (rowHasInk) count += 1;
  }
  return count;
}

test.describe("DXF CAD Stage 3 physical polyline width", () => {
  test.skip(({ browserName }) => browserName !== "chromium", "DXF renderer evidence is gated in Chromium.");

  test("wide polyline geometry stays physical while lineweight and color modes remain independent", async ({ page }, testInfo) => {
    test.setTimeout(120_000);
    await page.setViewportSize({ width: 1280, height: 820 });
    await login(page);
    const fileId = await uploadFixture(page);
    await page.goto(`/dokumantasyon/dosya/${fileId}`);

    const viewer = page.getByTestId("cad-dxf-viewer");
    const surface = page.getByTestId("cad-dxf-canvas");
    const canvas = surface.locator("canvas").first();
    const lineweightToggle = page.getByTestId("cad-dxf-lineweight-toggle");
    const colorToggle = page.getByTestId("cad-dxf-color-mode-toggle");
    const runtimeNode = page.getByTestId("cad-dxf-runtime-snapshot");

    await expect(viewer).toBeVisible();
    await expect(canvas).toBeVisible();
    await expect(lineweightToggle).toBeEnabled({ timeout: 30_000 });
    await expect(colorToggle).toBeEnabled({ timeout: 30_000 });
    await expect(runtimeNode).toBeAttached({ timeout: 30_000 });

    const runtime = JSON.parse((await runtimeNode.textContent()) || "{}") as RuntimeSnapshot;
    const hairline = await surfaceScreenshot(surface);
    const wideHairlineRows = verticalInkRows(hairline, runtime, { x: 10, y: 0 });
    const normalHairlineRows = verticalInkRows(hairline, runtime, { x: 10, y: 80 });
    expect(wideHairlineRows, "constant width=2 polyline must render as a visible band").toBeGreaterThan(3);
    expect(normalHairlineRows).toBeGreaterThan(0);

    await lineweightToggle.click();
    await expect(lineweightToggle).toHaveAttribute("data-mode", "source");
    await expect(canvas).toHaveAttribute("data-dxf-lineweight-mode", "source");
    await page.waitForTimeout(150);

    const sourceLineweight = await surfaceScreenshot(surface);
    const wideSourceRows = verticalInkRows(sourceLineweight, runtime, { x: 10, y: 0 });
    const normalSourceRows = verticalInkRows(sourceLineweight, runtime, { x: 10, y: 80 });
    expect(Math.abs(wideSourceRows - wideHairlineRows), "physical polyline width changed when display lineweight toggled")
      .toBeLessThanOrEqual(2);
    expect(normalSourceRows, "ordinary LINE must prove that source lineweight mode is active")
      .toBeGreaterThan(normalHairlineRows);

    await colorToggle.click();
    await expect(colorToggle).toHaveAttribute("data-mode", "monochrome");
    await expect(canvas).toHaveAttribute("data-dxf-color-mode", "monochrome");
    await page.waitForTimeout(150);

    const monochrome = await surfaceScreenshot(surface);
    const wideMonochromeRows = verticalInkRows(monochrome, runtime, { x: 10, y: 0 });
    expect(Math.abs(wideMonochromeRows - wideSourceRows), "monochrome mode changed physical polyline geometry")
      .toBeLessThanOrEqual(2);

    await testInfo.attach("dxf-stage3-wide-polyline.png", {
      body: await page.screenshot({ animations: "disabled" }),
      contentType: "image/png",
    });
  });
});
