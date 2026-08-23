import { expect, test, type Locator, type Page, type TestInfo } from "@playwright/test";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { inflateSync } from "node:zlib";

const DXF_FIXTURE_DIR = path.resolve(process.cwd(), "tests", "fixtures", "dxf");
const DESKTOP = { width: 1440, height: 900 };
const MOBILE = { width: 390, height: 844 };
const BULGE_TESSELLATION_BOUNDS_TOLERANCE = 0.5;

type RuntimeSnapshot = {
  viewport: { width: number; height: number };
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
  layers: string[];
};

type TextRenderEvidence = {
  source: {
    renderCandidateTextRecords: number;
    candidateByType: { TEXT: number; MTEXT: number; ATTRIB: number; ATTDEF: number };
  };
  parsed: {
    available: boolean;
    totalTextRecords: number;
    topLevelTextRecords: number;
    blockTextRecords: number;
  } | null;
  fontProbes: Array<{ url: string; ok: boolean; status: number | null; bytes: number }>;
  rendererMissingChars: boolean | null;
  parserLossCount: number;
  status: "no-text" | "ok" | "warning" | "blocking";
  issues: string[];
};

type DecodedPng = {
  width: number;
  height: number;
  channels: number;
  pixels: Buffer;
};

async function login(page: Page) {
  await page.goto("/dokumantasyon");
  const username = page.getByLabel("Kullanıcı Adı");
  if (await username.count() === 0 || !(await username.isVisible().catch(() => false))) {
    return;
  }
  await username.fill("admin");
  await page.locator("input#password").fill("admin");
  const responsePromise = page.waitForResponse(
    (response) => response.url().includes("/api/dokumantasyon/giris") && response.request().method() === "POST"
  );
  await page.getByRole("button", { name: "Giriş Yap" }).click();
  const response = await responsePromise;
  expect(response.status(), `admin login failed: ${await response.text()}`).toBe(200);
  await expect(username).toBeHidden();
}

async function uploadDxf(page: Page, fixtureName: string): Promise<string> {
  const buffer = await readFile(path.join(DXF_FIXTURE_DIR, fixtureName));
  const response = await page.request.post("/api/dokumantasyon/upload/local", {
    multipart: {
      file: {
        name: `release-${fixtureName}`,
        mimeType: "application/dxf",
        buffer,
      },
      pathname: `dok_storage/dxf-release-${Date.now()}-${Math.random().toString(36).slice(2)}-${fixtureName}`,
    },
  });
  const payload = await response.json();
  expect(response.ok(), payload.error || `DXF upload failed for ${fixtureName}`).toBeTruthy();
  expect(payload.file?.id, `DXF upload returned no file id for ${fixtureName}`).toBeTruthy();
  return payload.file.id as string;
}

async function openDxf(page: Page, fileId: string) {
  await page.goto(`/dokumantasyon/dosya/${fileId}`);
  await expect(page.getByTestId("cad-dxf-viewer")).toBeVisible();
}

async function expectNoHorizontalOverflow(page: Page) {
  const geometry = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(geometry.scrollWidth, "DXF page-level horizontal overflow").toBeLessThanOrEqual(geometry.clientWidth);
}

async function getRuntimeSnapshot(page: Page): Promise<RuntimeSnapshot> {
  const output = page.getByTestId("cad-dxf-runtime-snapshot");
  await expect(output).toBeAttached();
  const raw = await output.textContent();
  expect(raw, "DXF runtime snapshot should contain JSON").toBeTruthy();
  return JSON.parse(raw || "{}") as RuntimeSnapshot;
}

async function getTextRenderEvidence(page: Page): Promise<TextRenderEvidence> {
  const output = page.getByTestId("cad-dxf-text-render-evidence");
  await expect(output).toBeAttached();
  const raw = await output.textContent();
  expect(raw, "DXF text render evidence should contain JSON").toBeTruthy();
  return JSON.parse(raw || "{}") as TextRenderEvidence;
}

function paethPredictor(left: number, up: number, upperLeft: number): number {
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
  assertBuffer(png.subarray(0, 8).equals(signature), "Canvas screenshot is not a PNG");

  let offset = 8;
  let width = 0;
  let height = 0;
  let bitDepth = 0;
  let colorType = -1;
  let interlace = -1;
  const idatChunks: Buffer[] = [];

  while (offset + 12 <= png.length) {
    const length = png.readUInt32BE(offset);
    const type = png.subarray(offset + 4, offset + 8).toString("ascii");
    const dataStart = offset + 8;
    const dataEnd = dataStart + length;
    assertBuffer(dataEnd + 4 <= png.length, `Invalid PNG ${type} chunk length`);
    const data = png.subarray(dataStart, dataEnd);

    if (type === "IHDR") {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      bitDepth = data[8];
      colorType = data[9];
      interlace = data[12];
    } else if (type === "IDAT") {
      idatChunks.push(data);
    } else if (type === "IEND") {
      break;
    }
    offset = dataEnd + 4;
  }

  assertBuffer(width > 0 && height > 0, "PNG has invalid dimensions");
  assertBuffer(bitDepth === 8, `Unsupported PNG bit depth ${bitDepth}`);
  assertBuffer(interlace === 0, "Interlaced PNG is not supported by the DXF visual assertion");
  const channels = colorType === 6 ? 4 : colorType === 2 ? 3 : colorType === 4 ? 2 : colorType === 0 ? 1 : 0;
  assertBuffer(channels > 0, `Unsupported PNG color type ${colorType}`);
  assertBuffer(idatChunks.length > 0, "PNG contains no IDAT data");

  const inflated = inflateSync(Buffer.concat(idatChunks));
  const stride = width * channels;
  const expectedBytes = height * (stride + 1);
  assertBuffer(inflated.length >= expectedBytes, "PNG scanline data is truncated");
  const pixels = Buffer.alloc(stride * height);
  let sourceOffset = 0;

  for (let y = 0; y < height; y += 1) {
    const filter = inflated[sourceOffset];
    sourceOffset += 1;
    const rowOffset = y * stride;
    const previousRowOffset = (y - 1) * stride;

    for (let x = 0; x < stride; x += 1) {
      const raw = inflated[sourceOffset + x];
      const left = x >= channels ? pixels[rowOffset + x - channels] : 0;
      const up = y > 0 ? pixels[previousRowOffset + x] : 0;
      const upperLeft = y > 0 && x >= channels ? pixels[previousRowOffset + x - channels] : 0;
      let value: number;
      switch (filter) {
        case 0:
          value = raw;
          break;
        case 1:
          value = raw + left;
          break;
        case 2:
          value = raw + up;
          break;
        case 3:
          value = raw + Math.floor((left + up) / 2);
          break;
        case 4:
          value = raw + paethPredictor(left, up, upperLeft);
          break;
        default:
          throw new Error(`Unsupported PNG filter ${filter}`);
      }
      pixels[rowOffset + x] = value & 0xff;
    }
    sourceOffset += stride;
  }

  return { width, height, channels, pixels };
}

function assertBuffer(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function rgbAt(image: DecodedPng, pixelIndex: number): [number, number, number] {
  const offset = pixelIndex * image.channels;
  if (image.channels === 1 || image.channels === 2) {
    const gray = image.pixels[offset];
    return [gray, gray, gray];
  }
  return [image.pixels[offset], image.pixels[offset + 1], image.pixels[offset + 2]];
}

function countForegroundPixels(image: DecodedPng): number {
  const cornerIndices = [
    0,
    image.width - 1,
    (image.height - 1) * image.width,
    image.width * image.height - 1,
  ];
  const corners = cornerIndices.map((index) => rgbAt(image, index));
  const background = corners
    .map((rgb, index) => ({
      rgb,
      matches: corners.filter((candidate) =>
        Math.abs(candidate[0] - rgb[0]) + Math.abs(candidate[1] - rgb[1]) + Math.abs(candidate[2] - rgb[2]) <= 6
      ).length,
      index,
    }))
    .sort((a, b) => b.matches - a.matches || a.index - b.index)[0].rgb;

  const totalPixels = image.width * image.height;
  const stridePixels = Math.max(1, Math.floor(totalPixels / 120_000));
  let foreground = 0;
  for (let pixel = 0; pixel < totalPixels; pixel += stridePixels) {
    const [r, g, b] = rgbAt(image, pixel);
    const delta = Math.abs(r - background[0]) + Math.abs(g - background[1]) + Math.abs(b - background[2]);
    if (delta > 18) foreground += 1;
  }
  return foreground;
}

async function expectForegroundGeometrySignal(canvas: Locator) {
  await expect.poll(async () => {
    const png = await canvas.screenshot({ animations: "disabled" });
    return countForegroundPixels(decodePng(png));
  }, {
    message: "DXF compositor screenshot should contain foreground geometry, not only a blank canvas",
    timeout: 12_000,
  }).toBeGreaterThan(8);
}

async function expectRenderableCanvas(page: Page, requireForeground = true) {
  const canvasHost = page.getByTestId("cad-dxf-canvas");
  await expect(canvasHost).toBeVisible();
  const canvas = canvasHost.locator("canvas").first();
  await expect(canvas).toBeVisible();
  await expect.poll(async () => canvas.evaluate((element) => ({
    width: (element as HTMLCanvasElement).width,
    height: (element as HTMLCanvasElement).height,
  }))).toMatchObject({ width: expect.any(Number), height: expect.any(Number) });
  const size = await canvas.evaluate((element) => ({
    width: (element as HTMLCanvasElement).width,
    height: (element as HTMLCanvasElement).height,
  }));
  expect(size.width).toBeGreaterThan(100);
  expect(size.height).toBeGreaterThan(100);
  await expect(page.getByRole("heading", { name: "DXF açılamadı" })).toBeHidden();
  await getRuntimeSnapshot(page);
  if (requireForeground) await expectForegroundGeometrySignal(canvas);
}

async function expectBlockedDxf(page: Page, fixtureName: string, evidenceText: RegExp | string) {
  await page.goto("/dokumantasyon");
  const fileId = await uploadDxf(page, fixtureName);
  await openDxf(page, fileId);
  await expect(page.getByRole("heading", { name: "DXF açılamadı" })).toBeVisible();
  await expect(page.getByText(/fidelity engeli/i)).toBeVisible();
  const panel = page.getByTestId("cad-dxf-diagnostics-panel");
  await expect(panel).toBeVisible();
  await expect(panel.locator('[data-severity="blocking"]')).not.toHaveCount(0);
  await expect(panel).toContainText(evidenceText);
  const download = page.getByRole("button", { name: "Orijinal dosyayı indir" });
  await expect(download).toBeVisible();
  await expect(page.getByTestId("cad-dxf-runtime-snapshot")).toHaveCount(0);
}

async function attachEvidence(page: Page, testInfo: TestInfo, name: string) {
  await testInfo.attach(name, {
    body: await page.screenshot({ animations: "disabled" }),
    contentType: "image/png",
  });
}

test.describe("DXF Stage 6 release fidelity gate", () => {
  test.skip(({ browserName }) => browserName !== "chromium", "DXF WebGL release gate is deterministic in Chromium; cross-browser UI coverage remains in release.spec.ts.");

  test("clean and warning DXFs reach ready state with actionable diagnostics on desktop and mobile", async ({ page }, testInfo) => {
    test.setTimeout(240_000);
    await page.setViewportSize(DESKTOP);
    await login(page);

    const cleanId = await uploadDxf(page, "geometry-basic.dxf");
    await openDxf(page, cleanId);
    await expectRenderableCanvas(page);
    const cleanToggle = page.getByTestId("cad-dxf-diagnostics-toggle");
    await expect(cleanToggle).toContainText("Denetim temiz");
    await cleanToggle.click();
    await expect(page.getByTestId("cad-dxf-diagnostics-panel")).toBeVisible();
    await expect(page.getByTestId("cad-dxf-diagnostics-panel").locator('[data-severity="blocking"]')).toHaveCount(0);
    await attachEvidence(page, testInfo, "dxf-clean-desktop.png");

    await page.goto("/dokumantasyon");
    const largeId = await uploadDxf(page, "stage7-large-coordinate-bulge.dxf");
    await openDxf(page, largeId);
    await expectRenderableCanvas(page);
    const largeSnapshot = await getRuntimeSnapshot(page);
    expect(largeSnapshot.origin).not.toBeNull();
    expect(Math.abs(largeSnapshot.origin?.x ?? 0)).toBeGreaterThan(100_000);
    expect(Math.abs(largeSnapshot.origin?.y ?? 0)).toBeGreaterThan(1_000_000);
    expect(largeSnapshot.bounds).not.toBeNull();
    const spanX = (largeSnapshot.bounds?.maxX ?? 0) - (largeSnapshot.bounds?.minX ?? 0);
    const spanY = (largeSnapshot.bounds?.maxY ?? 0) - (largeSnapshot.bounds?.minY ?? 0);
    expect(spanX).toBeGreaterThan(50);
    expect(spanX).toBeLessThan(500);
    expect(spanY).toBeGreaterThan(30);
    expect(spanY).toBeLessThan(500);
    expect(largeSnapshot.layers).toContain("0");
    await attachEvidence(page, testInfo, "dxf-large-coordinate-bulge.png");

    await page.goto("/dokumantasyon");
    const signedBulgeId = await uploadDxf(page, "stage7-bulge-signs.dxf");
    await openDxf(page, signedBulgeId);
    await expectRenderableCanvas(page);
    const signedBulgeSnapshot = await getRuntimeSnapshot(page);
    expect(signedBulgeSnapshot.bounds).not.toBeNull();
    expect(signedBulgeSnapshot.bounds?.minX ?? Number.NaN).toBeCloseTo(0, 3);
    expect(signedBulgeSnapshot.bounds?.maxX ?? Number.NaN).toBeCloseTo(200, 3);
    const renderedMinY = signedBulgeSnapshot.bounds?.minY ?? Number.NaN;
    const renderedMaxY = signedBulgeSnapshot.bounds?.maxY ?? Number.NaN;
    // dxf-viewer tessellates arcs at a default 10-degree target angle. The sampled scene bounds
    // therefore approximate the analytical extrema; require the correct bulge direction and keep
    // the approximation tightly bounded without forcing production to tessellate 10x more arcs.
    expect(renderedMinY).toBeLessThan(-20);
    expect(renderedMaxY).toBeGreaterThan(120);
    expect(Math.abs(renderedMinY - (-20.710678))).toBeLessThan(BULGE_TESSELLATION_BOUNDS_TOLERANCE);
    expect(Math.abs(renderedMaxY - 120.710678)).toBeLessThan(BULGE_TESSELLATION_BOUNDS_TOLERANCE);
    await attachEvidence(page, testInfo, "dxf-signed-closed-bulge.png");

    await page.goto("/dokumantasyon");
    const colorHatchId = await uploadDxf(page, "stage7-color-hatch.dxf");
    await openDxf(page, colorHatchId);
    await expectRenderableCanvas(page);
    const colorSnapshot = await getRuntimeSnapshot(page);
    expect(colorSnapshot.layers).toEqual(expect.arrayContaining(["0", "ACI_LAYER", "TRUE_LAYER"]));
    await expect(page.getByTestId("cad-dxf-diagnostics-toggle")).toContainText("Denetim temiz");
    await attachEvidence(page, testInfo, "dxf-color-hatch.png");

    await page.goto("/dokumantasyon");
    const geometryWarningId = await uploadDxf(page, "stage4-geometry-layers.dxf");
    await openDxf(page, geometryWarningId);
    await expectRenderableCanvas(page);
    const warningToggle = page.getByTestId("cad-dxf-diagnostics-toggle");
    await expect(warningToggle).toContainText("uyarı");
    await warningToggle.click();
    const warningPanel = page.getByTestId("cad-dxf-diagnostics-panel");
    await expect(warningPanel).toBeVisible();
    await expect(warningPanel).toContainText("Layer");
    await expect(warningPanel).toContainText("Geometri");
    await expect(warningPanel).toContainText("Görünüm");
    await expect(warningPanel.locator('[data-severity="blocking"]')).toHaveCount(0);
    const panelHeight = await warningPanel.evaluate((element) => element.getBoundingClientRect().height);
    expect(panelHeight).toBeLessThanOrEqual(DESKTOP.height * 0.38 + 4);
    await attachEvidence(page, testInfo, "dxf-warning-desktop.png");

    await page.setViewportSize(MOBILE);
    await expectNoHorizontalOverflow(page);
    await expect(warningPanel).toBeVisible();
    const mobilePanelHeight = await warningPanel.evaluate((element) => element.getBoundingClientRect().height);
    expect(mobilePanelHeight).toBeLessThanOrEqual(MOBILE.height * 0.38 + 4);
    await attachEvidence(page, testInfo, "dxf-warning-mobile.png");

    await page.setViewportSize(DESKTOP);
    await page.goto("/dokumantasyon");
    const textId = await uploadDxf(page, "stage3-text-mtext.dxf");
    await openDxf(page, textId);
    await expectRenderableCanvas(page);
    const textEvidence = await getTextRenderEvidence(page);
    expect(textEvidence.source.renderCandidateTextRecords).toBe(3);
    expect(textEvidence.source.candidateByType).toMatchObject({ TEXT: 2, MTEXT: 1, ATTRIB: 0, ATTDEF: 0 });
    expect(textEvidence.parsed?.available).toBe(true);
    expect(textEvidence.parsed?.totalTextRecords).toBe(3);
    expect(textEvidence.parserLossCount).toBe(0);
    expect(textEvidence.fontProbes).toHaveLength(2);
    expect(textEvidence.fontProbes.every((font) => font.ok && font.status === 200 && font.bytes > 1024)).toBe(true);
    expect(textEvidence.rendererMissingChars).not.toBe(true);
    expect(textEvidence.status).toBe("warning");
    const textSummary = page.getByTestId("cad-dxf-text-evidence");
    await expect(textSummary).toContainText("kaynak 3");
    await expect(textSummary).toContainText("parser 3");
    await expect(textSummary).toContainText("font 2/2");
    const textToggle = page.getByTestId("cad-dxf-diagnostics-toggle");
    await expect(textToggle).toContainText("uyarı");
    await textToggle.click();
    await expect(page.getByTestId("cad-dxf-diagnostics-panel")).toContainText("Yazı");
    await attachEvidence(page, testInfo, "dxf-text-source-parser-font.png");
  });

  test("unsupported entities, missing blocks and arbitrary OCS fail closed before renderer success", async ({ page }, testInfo) => {
    test.setTimeout(180_000);
    await page.setViewportSize(DESKTOP);
    await login(page);

    await expectBlockedDxf(page, "unsupported-annotations.dxf", /LEADER|MLEADER/);
    await attachEvidence(page, testInfo, "dxf-blocked-unsupported.png");

    await expectBlockedDxf(page, "missing-block-only.dxf", "MISSING_DETAIL");
    await attachEvidence(page, testInfo, "dxf-blocked-missing-block.png");

    await expectBlockedDxf(page, "ocs-arc-circle.dxf", /OCS|extrusion/i);
    await attachEvidence(page, testInfo, "dxf-blocked-ocs.png");
  });

  test("known incomplete dimension, spline and hatch cases fail closed instead of reporting success", async ({ page }, testInfo) => {
    test.setTimeout(180_000);
    await page.setViewportSize(DESKTOP);
    await login(page);

    const dimensionId = await uploadDxf(page, "stage3-dimensions.dxf");
    await openDxf(page, dimensionId);
    await expect(page.getByRole("heading", { name: "DXF açılamadı" })).toBeVisible();
    await expect(page.getByText(/fidelity engeli/i)).toBeVisible();
    await expect(page.getByRole("button", { name: "Orijinal dosyayı indir" })).toBeVisible();
    const dimensionPanel = page.getByTestId("cad-dxf-diagnostics-panel");
    await expect(dimensionPanel).toBeVisible();
    await expect(dimensionPanel.locator('[data-severity="blocking"]')).not.toHaveCount(0);
    await expect(dimensionPanel).toContainText("Ölçü");
    await attachEvidence(page, testInfo, "dxf-blocked-dimension.png");

    await page.goto("/dokumantasyon");
    const riskyGeometryId = await uploadDxf(page, "stage4-risky-geometry.dxf");
    await openDxf(page, riskyGeometryId);
    await expect(page.getByRole("heading", { name: "DXF açılamadı" })).toBeVisible();
    const riskyToggle = page.getByTestId("cad-dxf-diagnostics-toggle");
    await expect(riskyToggle).toContainText("engel");
    const riskyPanel = page.getByTestId("cad-dxf-diagnostics-panel");
    await expect(riskyPanel).toBeVisible();
    await expect(riskyPanel).toContainText("SPLINE");
    await expect(riskyPanel).toContainText("HATCH");
    await expect(riskyPanel.locator('[data-severity="blocking"]')).not.toHaveCount(0);
    await expect(page.getByRole("button", { name: "Orijinal dosyayı indir" })).toBeVisible();

    await page.setViewportSize(MOBILE);
    await expectNoHorizontalOverflow(page);
    const download = page.getByRole("button", { name: "Orijinal dosyayı indir" });
    await download.scrollIntoViewIfNeeded();
    await expect(download).toBeVisible();
    const retry = page.getByRole("button", { name: "Tekrar dene" });
    await retry.scrollIntoViewIfNeeded();
    await expect(retry).toBeVisible();
    await attachEvidence(page, testInfo, "dxf-blocked-geometry-mobile.png");
  });
});