import { expect, test, type Page, type TestInfo } from "@playwright/test";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { inflateSync } from "node:zlib";

const FIXTURE = "lineweight-display.dxf";
const DXF_FIXTURE_DIR = path.resolve(process.cwd(), "tests", "fixtures", "dxf");

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
type DecodedPng = { width: number; height: number; channels: number; pixels: Buffer };

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
      file: { name: `lineweight-${FIXTURE}`, mimeType: "application/dxf", buffer },
      pathname: `dok_storage/dxf-lineweight-${Date.now()}-${Math.random().toString(36).slice(2)}-${FIXTURE}`,
    },
  });
  const payload = await response.json();
  expect(response.ok(), payload.error || "DXF lineweight fixture upload failed").toBeTruthy();
  return payload.file.id as string;
}

async function runtimeSnapshot(page: Page): Promise<RuntimeSnapshot> {
  const output = page.getByTestId("cad-dxf-runtime-snapshot");
  await expect(output).toBeAttached({ timeout: 30_000 });
  return JSON.parse((await output.textContent()) || "{}") as RuntimeSnapshot;
}

async function lineweightSnapshot(page: Page): Promise<LineweightSnapshot> {
  const output = page.getByTestId("cad-dxf-lineweight-snapshot");
  await expect(output).toBeAttached({ timeout: 30_000 });
  return JSON.parse((await output.textContent()) || "{}") as LineweightSnapshot;
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

function foregroundAt(image: DecodedPng, x: number, y: number): boolean {
  const clampedX = Math.max(0, Math.min(image.width - 1, Math.round(x)));
  const clampedY = Math.max(0, Math.min(image.height - 1, Math.round(y)));
  const offset = (clampedY * image.width + clampedX) * image.channels;
  const red = image.pixels[offset];
  const green = image.pixels[offset + 1];
  const blue = image.pixels[offset + 2];
  return Math.max(red, green, blue) >= 45;
}

function horizontalLineThickness(
  image: DecodedPng,
  snapshot: RuntimeSnapshot,
  modelX: number,
  modelY: number,
  searchRadius = 12
): number {
  const pixel = modelToPixel(snapshot, image, modelX, modelY);
  const rows: boolean[] = [];
  for (let dy = -searchRadius; dy <= searchRadius; dy += 1) {
    let hit = false;
    for (let dx = -2; dx <= 2; dx += 1) {
      if (foregroundAt(image, pixel.x + dx, pixel.y + dy)) {
        hit = true;
        break;
      }
    }
    rows.push(hit);
  }

  let best = 0;
  let current = 0;
  for (const hit of rows) {
    if (hit) {
      current += 1;
      best = Math.max(best, current);
    } else {
      current = 0;
    }
  }
  return best;
}

async function attach(page: Page, testInfo: TestInfo, name: string) {
  await testInfo.attach(name, { body: await page.screenshot({ animations: "disabled" }), contentType: "image/png" });
}

test.describe("DXF lineweight display", () => {
  test.skip(({ browserName }) => browserName !== "chromium", "DXF lineweight evidence is gated in Chromium.");

  test("LWT resolves source/BYLAYER/BYBLOCK widths without changing camera, layers or zoom thickness", async ({ page }, testInfo) => {
    test.setTimeout(120_000);
    await page.setViewportSize({ width: 1200, height: 800 });
    await login(page);
    const fileId = await uploadFixture(page);
    await page.goto(`/dokumantasyon/dosya/${fileId}`);

    const viewer = page.getByTestId("cad-dxf-viewer");
    const canvas = page.getByTestId("cad-dxf-canvas").locator("canvas").first();
    const toggle = page.getByTestId("cad-dxf-lineweight-toggle");
    await expect(viewer).toBeVisible();
    await expect(canvas).toBeVisible();
    await expect(page.getByRole("heading", { name: "DXF açılamadı" })).toBeHidden();
    await expect(toggle).toBeEnabled({ timeout: 30_000 });
    await expect(toggle).toHaveAttribute("data-mode", "off");

    const sourceSnapshot = await lineweightSnapshot(page);
    expect(sourceSnapshot.enabled).toBeFalsy();
    expect(sourceSnapshot.unsupportedLineObjectCount, "fixture must have no partial LWT rendering").toBe(0);
    expect(sourceSnapshot.supportedLineObjectCount).toBeGreaterThanOrEqual(5);
    expect(sourceSnapshot.segmentCount).toBeGreaterThanOrEqual(5);
    for (const expected of [13, 35, 50, 70, 100]) expect(sourceSnapshot.distinctLineweights).toContain(expected);
    expect(sourceSnapshot.maxDisplayPx ?? 0).toBeGreaterThan(sourceSnapshot.minDisplayPx ?? 0);

    const cameraBefore = await page.getByTestId("cad-dxf-runtime-snapshot").textContent();
    const layersBefore = await page.getByTestId("cad-dxf-layer-snapshot").textContent();
    const runtimeBefore = await runtimeSnapshot(page);
    const offImage = decodePng(await canvas.screenshot({ animations: "disabled" }));
    const offThin = horizontalLineThickness(offImage, runtimeBefore, 60, 10);
    const offThick = horizontalLineThickness(offImage, runtimeBefore, 60, 50);
    const offExplicit = horizontalLineThickness(offImage, runtimeBefore, 60, 70);
    expect(Math.max(offThin, offThick, offExplicit) - Math.min(offThin, offThick, offExplicit), "LWT-off lines should use the same thin renderer width").toBeLessThanOrEqual(2);

    await toggle.click();
    await expect(toggle).toHaveAttribute("data-mode", "on");
    await expect(toggle).toContainText("Lineweight: Açık");
    const enabledSnapshot = await lineweightSnapshot(page);
    expect(enabledSnapshot.enabled).toBeTruthy();
    expect(enabledSnapshot.overlayObjectCount).toBeGreaterThanOrEqual(5);
    expect(enabledSnapshot.unsupportedLineObjectCount).toBe(0);
    expect(await page.getByTestId("cad-dxf-runtime-snapshot").textContent(), "camera changed when enabling LWT").toBe(cameraBefore);
    expect(await page.getByTestId("cad-dxf-layer-snapshot").textContent(), "layer state changed when enabling LWT").toBe(layersBefore);

    const onImage = decodePng(await canvas.screenshot({ animations: "disabled" }));
    const onThin = horizontalLineThickness(onImage, runtimeBefore, 60, 10);
    const onMedium = horizontalLineThickness(onImage, runtimeBefore, 60, 30);
    const onThick = horizontalLineThickness(onImage, runtimeBefore, 60, 50);
    const onExplicit = horizontalLineThickness(onImage, runtimeBefore, 60, 70);
    const onBlock = horizontalLineThickness(onImage, runtimeBefore, 60, 90);
    expect(onExplicit, `explicit 1.00mm line remained ${onExplicit}px`).toBeGreaterThanOrEqual(onThin + 2);
    expect(onThick, `0.70mm BYLAYER line remained ${onThick}px`).toBeGreaterThan(onThin);
    expect(onMedium).toBeGreaterThanOrEqual(onThin);
    expect(onBlock, "BYBLOCK INSERT lineweight was not visible").toBeGreaterThan(onThin);

    await attach(page, testInfo, "dxf-lineweight-on.png");

    await page.getByRole("button", { name: "Katmanlar" }).click();
    const thickLayer = page.getByTestId("cad-dxf-layer-LW_THICK");
    await expect(thickLayer).toHaveAttribute("data-visible", "true");
    await thickLayer.click();
    await expect(thickLayer).toHaveAttribute("data-visible", "false");
    const hiddenImage = decodePng(await canvas.screenshot({ animations: "disabled" }));
    expect(horizontalLineThickness(hiddenImage, runtimeBefore, 60, 50), "hidden layer left a lineweight overlay behind").toBe(0);
    await thickLayer.click();
    await expect(thickLayer).toHaveAttribute("data-visible", "true");
    await page.getByRole("button", { name: "Katman panelini kapat" }).click();

    const snapshotTextBeforeZoom = await page.getByTestId("cad-dxf-runtime-snapshot").textContent();
    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();
    await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
    await page.mouse.wheel(0, -420);
    await expect(page.getByTestId("cad-dxf-runtime-snapshot")).not.toHaveText(snapshotTextBeforeZoom || "", { timeout: 10_000 });
    const runtimeAfterZoom = await runtimeSnapshot(page);
    const zoomedImage = decodePng(await canvas.screenshot({ animations: "disabled" }));
    const zoomedExplicit = horizontalLineThickness(zoomedImage, runtimeAfterZoom, 60, 70);
    expect(Math.abs(zoomedExplicit - onExplicit), `screen-space LWT changed from ${onExplicit}px to ${zoomedExplicit}px after zoom`).toBeLessThanOrEqual(2);

    const colorToggle = page.getByTestId("cad-dxf-color-mode-toggle");
    await colorToggle.click();
    await expect(colorToggle).toHaveAttribute("data-mode", "monochrome");
    await expect(toggle).toHaveAttribute("data-mode", "on");
    expect((await lineweightSnapshot(page)).enabled).toBeTruthy();
    await colorToggle.click();
    await expect(colorToggle).toHaveAttribute("data-mode", "true-color");

    await toggle.click();
    await expect(toggle).toHaveAttribute("data-mode", "off");
    const disabledSnapshot = await lineweightSnapshot(page);
    expect(disabledSnapshot.enabled).toBeFalsy();
    expect(disabledSnapshot.overlayObjectCount).toBeGreaterThanOrEqual(5);
    expect(await page.getByTestId("cad-dxf-layer-snapshot").textContent()).toBe(layersBefore);

    await attach(page, testInfo, "dxf-lineweight-off-restored.png");
  });

  test("LWT and color controls remain reachable at 390px without horizontal overflow", async ({ page }, testInfo) => {
    test.setTimeout(120_000);
    await page.setViewportSize({ width: 390, height: 844 });
    await login(page);
    const fileId = await uploadFixture(page);
    await page.goto(`/dokumantasyon/dosya/${fileId}`);

    const viewer = page.getByTestId("cad-dxf-viewer");
    const lwt = page.getByTestId("cad-dxf-lineweight-toggle");
    const color = page.getByTestId("cad-dxf-color-mode-toggle");
    await expect(viewer).toBeVisible();
    await expect(lwt).toBeEnabled({ timeout: 30_000 });
    await expect(color).toBeVisible();
    await lineweightSnapshot(page);

    const metrics = await viewer.evaluate((element) => ({ scrollWidth: element.scrollWidth, clientWidth: element.clientWidth }));
    expect(metrics.scrollWidth, "DXF viewer horizontally overflows with LWT at 390px").toBeLessThanOrEqual(metrics.clientWidth + 1);

    for (const control of [lwt, color]) {
      const box = await control.boundingBox();
      expect(box).not.toBeNull();
      expect(box!.x).toBeGreaterThanOrEqual(0);
      expect(box!.x + box!.width).toBeLessThanOrEqual(390);
    }

    await lwt.click();
    await expect(lwt).toHaveAttribute("data-mode", "on");
    await color.click();
    await expect(color).toHaveAttribute("data-mode", "monochrome");
    expect((await lineweightSnapshot(page)).enabled).toBeTruthy();

    await attach(page, testInfo, "dxf-lineweight-mobile.png");
  });
});
