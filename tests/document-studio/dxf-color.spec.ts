import { expect, test, type Locator, type Page, type TestInfo } from "@playwright/test";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { inflateSync } from "node:zlib";

const FIXTURE = "stage5-color-fidelity.dxf";
const DXF_FIXTURE_DIR = path.resolve(process.cwd(), "tests", "fixtures", "dxf");

type RuntimeSnapshot = {
  bounds: { minX: number; maxX: number; minY: number; maxY: number } | null;
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

type DecodedPng = { width: number; height: number; channels: number; pixels: Buffer };
type Rgb = [number, number, number];

async function login(page: Page) {
  await page.goto("/dokumantasyon");
  await page.getByLabel("Kullanıcı Adı").fill("admin");
  await page.locator("input#password").fill("admin");
  const responsePromise = page.waitForResponse(
    (response) => response.url().includes("/api/dokumantasyon/giris") && response.request().method() === "POST"
  );
  await page.getByRole("button", { name: "Giriş Yap" }).click();
  expect((await responsePromise).status()).toBe(200);
}

async function uploadFixture(page: Page): Promise<string> {
  const buffer = await readFile(path.join(DXF_FIXTURE_DIR, FIXTURE));
  const response = await page.request.post("/api/dokumantasyon/upload/local", {
    multipart: {
      file: { name: `color-${FIXTURE}`, mimeType: "application/dxf", buffer },
      pathname: `dok_storage/dxf-color-${Date.now()}-${Math.random().toString(36).slice(2)}-${FIXTURE}`,
    },
  });
  const payload = await response.json();
  expect(response.ok(), payload.error || "DXF color fixture upload failed").toBeTruthy();
  return payload.file.id as string;
}

async function runtimeSnapshot(page: Page): Promise<RuntimeSnapshot> {
  const node = page.getByTestId("cad-dxf-runtime-snapshot");
  await expect(node).toBeAttached({ timeout: 30_000 });
  return JSON.parse((await node.textContent()) || "{}") as RuntimeSnapshot;
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
  assertBuffer(png.subarray(0, 8).equals(signature), "Canvas screenshot is not PNG");

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

function rgbAt(image: DecodedPng, x: number, y: number): Rgb {
  const clampedX = Math.max(0, Math.min(image.width - 1, Math.round(x)));
  const clampedY = Math.max(0, Math.min(image.height - 1, Math.round(y)));
  const offset = (clampedY * image.width + clampedX) * image.channels;
  return [image.pixels[offset], image.pixels[offset + 1], image.pixels[offset + 2]];
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

function colorDistance(actual: Rgb, expected: Rgb): number {
  return Math.max(
    Math.abs(actual[0] - expected[0]),
    Math.abs(actual[1] - expected[1]),
    Math.abs(actual[2] - expected[2])
  );
}

function bestRgbNear(image: DecodedPng, x: number, y: number, expected: Rgb, radius = 4): Rgb {
  let best = rgbAt(image, x, y);
  let bestDistance = colorDistance(best, expected);
  for (let dy = -radius; dy <= radius; dy += 1) {
    for (let dx = -radius; dx <= radius; dx += 1) {
      const candidate = rgbAt(image, x + dx, y + dy);
      const distance = colorDistance(candidate, expected);
      if (distance < bestDistance) {
        best = candidate;
        bestDistance = distance;
      }
    }
  }
  return best;
}

function expectModelRgb(
  image: DecodedPng,
  snapshot: RuntimeSnapshot,
  point: { x: number; y: number },
  expected: Rgb,
  label: string,
  tolerance = 32
): Rgb {
  const pixel = modelToPixel(snapshot, image, point.x, point.y);
  const actual = bestRgbNear(image, pixel.x, pixel.y, expected);
  expect(colorDistance(actual, expected), `${label} color ${actual.join(",")} vs ${expected.join(",")}`).toBeLessThanOrEqual(tolerance);
  return actual;
}

function countNearRgb(image: DecodedPng, expected: Rgb, tolerance = 40): number {
  let count = 0;
  const step = Math.max(1, Math.floor((image.width * image.height) / 300_000));
  for (let pixel = 0; pixel < image.width * image.height; pixel += step) {
    const offset = pixel * image.channels;
    const actual: Rgb = [image.pixels[offset], image.pixels[offset + 1], image.pixels[offset + 2]];
    if (colorDistance(actual, expected) <= tolerance) count += 1;
  }
  return count;
}

function countStronglyColoredPixels(image: DecodedPng, channelSpread = 10): number {
  let count = 0;
  const step = Math.max(1, Math.floor((image.width * image.height) / 300_000));
  for (let pixel = 0; pixel < image.width * image.height; pixel += step) {
    const offset = pixel * image.channels;
    const red = image.pixels[offset];
    const green = image.pixels[offset + 1];
    const blue = image.pixels[offset + 2];
    const max = Math.max(red, green, blue);
    const min = Math.min(red, green, blue);
    if (max > 45 && max - min > channelSpread) count += 1;
  }
  return count;
}

function countBrightNeutralPixels(image: DecodedPng, minimum = 170, channelSpread = 8): number {
  let count = 0;
  const step = Math.max(1, Math.floor((image.width * image.height) / 300_000));
  for (let pixel = 0; pixel < image.width * image.height; pixel += step) {
    const offset = pixel * image.channels;
    const red = image.pixels[offset];
    const green = image.pixels[offset + 1];
    const blue = image.pixels[offset + 2];
    const max = Math.max(red, green, blue);
    const min = Math.min(red, green, blue);
    if (min >= minimum && max - min <= channelSpread) count += 1;
  }
  return count;
}

async function compositedSurfaceScreenshot(page: Page, surface: Locator): Promise<Buffer> {
  const box = await surface.boundingBox();
  assertBuffer(box !== null, "DXF surface bounds missing");
  return page.screenshot({
    animations: "disabled",
    clip: {
      x: Math.max(0, box.x),
      y: Math.max(0, box.y),
      width: box.width,
      height: box.height,
    },
  });
}

async function attach(page: Page, testInfo: TestInfo, name: string) {
  await testInfo.attach(name, { body: await page.screenshot({ animations: "disabled" }), contentType: "image/png" });
}

test.describe("DXF Stage 5 color fidelity", () => {
  test.skip(({ browserName }) => browserName !== "chromium", "DXF color evidence is gated in Chromium.");

  test("true-color and monochrome modes preserve CAD state and restore source colors", async ({ page }, testInfo) => {
    test.setTimeout(120_000);
    await page.setViewportSize({ width: 1200, height: 800 });
    await login(page);
    const fileId = await uploadFixture(page);
    await page.goto(`/dokumantasyon/dosya/${fileId}`);

    await expect(page.getByTestId("cad-dxf-viewer")).toBeVisible();
    await expect(page.getByRole("heading", { name: "DXF açılamadı" })).toBeHidden();
    await expect(page.getByTestId("cad-dxf-diagnostics-toggle")).toContainText(/Denetim temiz|uyarı/);

    const surface = page.getByTestId("cad-dxf-canvas");
    const canvas = surface.locator("canvas").first();
    const modeToggle = page.getByTestId("cad-dxf-color-mode-toggle");
    await expect(canvas).toBeVisible();
    await expect(modeToggle).toHaveAttribute("data-mode", "true-color");
    await expect(modeToggle).toContainText("Gerçek Renk");

    const snapshot = await runtimeSnapshot(page);
    const runtimeBefore = await page.getByTestId("cad-dxf-runtime-snapshot").textContent();
    const layerBefore = await page.getByTestId("cad-dxf-layer-snapshot").textContent();
    const trueColorImage = decodePng(await compositedSurfaceScreenshot(page, surface));

    const sampled = {
      byLayerAciRed: expectModelRgb(trueColorImage, snapshot, { x: 10, y: 10 }, [255, 0, 0], "BYLAYER ACI red"),
      layerTrueGreen: expectModelRgb(trueColorImage, snapshot, { x: 40, y: 10 }, [0, 255, 0], "layer TrueColor green"),
      entityTrueBlue: expectModelRgb(trueColorImage, snapshot, { x: 70, y: 10 }, [0, 0, 255], "entity TrueColor blue"),
      byBlockMagenta: expectModelRgb(trueColorImage, snapshot, { x: 100, y: 10 }, [255, 0, 255], "BYBLOCK/INSERT magenta"),
      blackContrast: expectModelRgb(trueColorImage, snapshot, { x: 160, y: 10 }, [255, 255, 255], "black-on-dark contrast inversion", 40),
    };

    const signatures = Object.values(sampled).map((rgb) => rgb.map((channel) => Math.round(channel / 24)).join(":"));
    expect(new Set(signatures).size, "independent DXF colors must not collapse to monochrome").toBeGreaterThanOrEqual(4);
    expect(countNearRgb(trueColorImage, [0, 255, 255]), "cyan TEXT pixels").toBeGreaterThan(4);
    expect(countNearRgb(trueColorImage, [255, 255, 0]), "yellow DIMENSION pixels").toBeGreaterThan(4);
    expect(countStronglyColoredPixels(trueColorImage), "true-color mode must contain chromatic pixels").toBeGreaterThan(20);

    await modeToggle.click();
    await expect(modeToggle).toHaveAttribute("data-mode", "monochrome");
    await expect(modeToggle).toContainText("Siyah-Beyaz");
    await expect(canvas).toHaveAttribute("data-dxf-color-mode", "monochrome");
    await expect(canvas).toHaveCSS("filter", /grayscale\(1\)/);
    await page.waitForTimeout(180);

    const monochromeImage = decodePng(await compositedSurfaceScreenshot(page, surface));
    expect(countStronglyColoredPixels(monochromeImage), "monochrome mode must remove chromatic pixels").toBeLessThanOrEqual(2);
    expect(countBrightNeutralPixels(monochromeImage), "monochrome mode must retain visible bright CAD linework").toBeGreaterThan(20);
    expect(await page.getByTestId("cad-dxf-runtime-snapshot").textContent(), "camera/runtime state changed on color mode toggle").toBe(runtimeBefore);
    expect(await page.getByTestId("cad-dxf-layer-snapshot").textContent(), "layer state changed on color mode toggle").toBe(layerBefore);

    await attach(page, testInfo, "dxf-stage1-monochrome-mode.png");

    await modeToggle.click();
    await expect(modeToggle).toHaveAttribute("data-mode", "true-color");
    await expect(canvas).toHaveAttribute("data-dxf-color-mode", "true-color");
    await expect(canvas).toHaveCSS("filter", "none");
    await page.waitForTimeout(180);

    const restoredImage = decodePng(await compositedSurfaceScreenshot(page, surface));
    expectModelRgb(restoredImage, snapshot, { x: 10, y: 10 }, [255, 0, 0], "restored BYLAYER red");
    expectModelRgb(restoredImage, snapshot, { x: 40, y: 10 }, [0, 255, 0], "restored layer green");
    expectModelRgb(restoredImage, snapshot, { x: 70, y: 10 }, [0, 0, 255], "restored entity blue");
    expectModelRgb(restoredImage, snapshot, { x: 100, y: 10 }, [255, 0, 255], "restored BYBLOCK magenta");
    expect(countNearRgb(restoredImage, [0, 255, 255]), "restored cyan TEXT pixels").toBeGreaterThan(4);
    expect(countNearRgb(restoredImage, [255, 255, 0]), "restored yellow DIMENSION pixels").toBeGreaterThan(4);
    expect(await page.getByTestId("cad-dxf-runtime-snapshot").textContent()).toBe(runtimeBefore);
    expect(await page.getByTestId("cad-dxf-layer-snapshot").textContent()).toBe(layerBefore);

    const darkPoint = modelToPixel(snapshot, trueColorImage, 130, 10);
    const darkSample = rgbAt(trueColorImage, darkPoint.x, darkPoint.y);
    console.log("DXF color mode samples:", JSON.stringify({ ...sampled, darkSample }));

    await attach(page, testInfo, "dxf-stage1-true-color-restored.png");
  });

  test("color mode control remains reachable without horizontal overflow on mobile", async ({ page }, testInfo) => {
    test.setTimeout(120_000);
    await page.setViewportSize({ width: 390, height: 844 });
    await login(page);
    const fileId = await uploadFixture(page);
    await page.goto(`/dokumantasyon/dosya/${fileId}`);

    const viewer = page.getByTestId("cad-dxf-viewer");
    const canvas = page.getByTestId("cad-dxf-canvas").locator("canvas").first();
    const modeToggle = page.getByTestId("cad-dxf-color-mode-toggle");
    await expect(viewer).toBeVisible();
    await expect(canvas).toBeVisible();
    await expect(page.getByTestId("cad-dxf-diagnostics-toggle")).toContainText(/Denetim temiz|uyarı/);
    await runtimeSnapshot(page);
    await expect(modeToggle).toBeVisible();

    const metrics = await viewer.evaluate((element) => ({
      scrollWidth: element.scrollWidth,
      clientWidth: element.clientWidth,
    }));
    expect(metrics.scrollWidth, "DXF viewer horizontally overflows at 390px").toBeLessThanOrEqual(metrics.clientWidth + 1);

    const box = await modeToggle.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(390);

    await modeToggle.click();
    await expect(modeToggle).toHaveAttribute("data-mode", "monochrome");
    await expect(canvas).toHaveAttribute("data-dxf-color-mode", "monochrome");
    await modeToggle.click();
    await expect(modeToggle).toHaveAttribute("data-mode", "true-color");

    await attach(page, testInfo, "dxf-stage1-color-mode-mobile.png");
  });
});
