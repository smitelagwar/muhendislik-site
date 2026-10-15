import { expect, test, type Page, type TestInfo } from "@playwright/test";
import { deflateSync } from "node:zlib";

async function ensureAuthenticated(page: Page) {
  await page.goto("/dokumantasyon", { waitUntil: "domcontentloaded" });

  const username = page.getByLabel("Kullanıcı Adı");
  const loginVisible = await username
    .waitFor({ state: "visible", timeout: 1500 })
    .then(() => true)
    .catch(() => false);

  // Production runtime test modunda fixture ortamı admin oturumunu doğrudan
  // sağlayabilir. Login formu yalnız gerçekten görünüyorsa kimlik doğrula.
  if (!loginVisible) {
    await expect(page.getByRole("heading", { name: "Dokümantasyon Modülü" })).toBeVisible({
      timeout: 8000,
    });
    return;
  }

  await username.fill("admin");
  await page.locator("input#password").fill("admin");
  const responsePromise = page.waitForResponse(
    (response) =>
      response.url().includes("/api/dokumantasyon/giris") &&
      response.request().method() === "POST"
  );
  await page.getByRole("button", { name: "Giriş Yap" }).click();
  const response = await responsePromise;
  expect(response.ok()).toBeTruthy();
}

function crc32(buffer: Buffer): number {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type: string, data: Buffer): Buffer {
  const typeBuffer = Buffer.from(type, "ascii");
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const checksum = Buffer.alloc(4);
  checksum.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), 0);
  return Buffer.concat([length, typeBuffer, data, checksum]);
}

function createSolidGrayPng(width: number, height: number): Buffer {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 0;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const rowLength = width + 1;
  const raw = Buffer.alloc(rowLength * height);
  for (let row = 0; row < height; row += 1) {
    const rowStart = row * rowLength;
    raw[rowStart] = 0;
    raw.fill(160, rowStart + 1, rowStart + rowLength);
  }

  return Buffer.concat([
    signature,
    pngChunk("IHDR", ihdr),
    pngChunk("IDAT", deflateSync(raw, { level: 9 })),
    pngChunk("IEND", Buffer.alloc(0)),
  ]);
}

function createQuadrantPng(width = 40, height = 30): Buffer {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const rowLength = width * 4 + 1;
  const raw = Buffer.alloc(rowLength * height);
  const colors = {
    topLeft: [255, 0, 0, 255],
    topRight: [0, 255, 0, 255],
    bottomLeft: [0, 0, 255, 255],
    bottomRight: [255, 255, 0, 255],
  };

  for (let y = 0; y < height; y += 1) {
    const rowStart = y * rowLength;
    raw[rowStart] = 0;
    for (let x = 0; x < width; x += 1) {
      const color =
        y < height / 2
          ? x < width / 2 ? colors.topLeft : colors.topRight
          : x < width / 2 ? colors.bottomLeft : colors.bottomRight;
      const pixelStart = rowStart + 1 + x * 4;
      raw.set(color, pixelStart);
    }
  }

  return Buffer.concat([
    signature,
    pngChunk("IHDR", ihdr),
    pngChunk("IDAT", deflateSync(raw, { level: 9 })),
    pngChunk("IEND", Buffer.alloc(0)),
  ]);
}

async function uploadImage(page: Page, name: string, buffer: Buffer) {
  const base64 = buffer.toString("base64");
  return page.evaluate(async ({ name, base64 }) => {
    const bytes = Uint8Array.from(atob(base64), (character) =>
      character.charCodeAt(0)
    );
    const formData = new FormData();
    formData.append("file", new File([bytes], name, { type: "image/png" }));
    formData.append(
      "pathname",
      `dok_storage/image-viewer-${crypto.randomUUID()}-${name}`
    );

    const response = await fetch("/api/dokumantasyon/upload/local", {
      method: "POST",
      body: formData,
    });
    const payload = await response.json();
    if (!response.ok || !payload.file?.id) {
      throw new Error(payload.error || "Image viewer fixture upload failed");
    }
    return payload.file.id as string;
  }, { name, base64 });
}

async function installImageExportCapture(page: Page) {
  await page.evaluate(() => {
    const originalCreateObjectURL = URL.createObjectURL.bind(URL);
    URL.createObjectURL = (object: Blob | MediaSource) => {
      if (object instanceof Blob && object.type === "image/png") {
        const target = window as Window & { __imageViewerExportBlob?: Blob };
        target.__imageViewerExportBlob = object;
      }
      return originalCreateObjectURL(object);
    };
  });
}

async function downloadAndInspectPng(
  page: Page,
  expectedFilename: string,
  downloadButton = page.getByTestId("image-viewer-transformed-download")
) {
  const downloadPromise = page.waitForEvent("download");
  await downloadButton.click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe(expectedFilename);
  expect(await download.failure()).toBeNull();

  return page.evaluate(async () => {
    const blob = (window as Window & { __imageViewerExportBlob?: Blob })
      .__imageViewerExportBlob;
    if (!blob) throw new Error("İndirilecek dönüştürülmüş PNG yakalanamadı.");

    const bitmap = await createImageBitmap(blob);
    const canvas = document.createElement("canvas");
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("PNG kabul testi için canvas oluşturulamadı.");
    context.drawImage(bitmap, 0, 0);

    const sample = (x: number, y: number) =>
      Array.from(context.getImageData(x, y, 1, 1).data).slice(0, 3);
    const result = {
      type: blob.type,
      width: bitmap.width,
      height: bitmap.height,
      corners: {
        topLeft: sample(Math.floor(bitmap.width / 4), Math.floor(bitmap.height / 4)),
        topRight: sample(Math.floor((bitmap.width * 3) / 4), Math.floor(bitmap.height / 4)),
        bottomLeft: sample(Math.floor(bitmap.width / 4), Math.floor((bitmap.height * 3) / 4)),
        bottomRight: sample(
          Math.floor((bitmap.width * 3) / 4),
          Math.floor((bitmap.height * 3) / 4)
        ),
      },
    };
    bitmap.close();
    return result;
  });
}

async function readCamera(page: Page) {
  return page.locator("[data-scale][data-camera-x]").first().evaluate((element) => ({
    scale: Number(element.getAttribute("data-scale")),
    x: Number(element.getAttribute("data-camera-x")),
    y: Number(element.getAttribute("data-camera-y")),
    mode: element.getAttribute("data-zoom-mode"),
    rotation: Number(element.getAttribute("data-rotation")),
    flipH: element.getAttribute("data-flip-h"),
    flipV: element.getAttribute("data-flip-v"),
  }));
}

async function dispatchTouchPointer(
  page: Page,
  type: "pointerdown" | "pointermove" | "pointerup",
  pointerId: number,
  x: number,
  y: number,
  isPrimary: boolean
) {
  await page.getByTestId("image-viewer-viewport").dispatchEvent(type, {
    pointerId,
    pointerType: "touch",
    isPrimary,
    clientX: x,
    clientY: y,
    button: 0,
    buttons: type === "pointerup" ? 0 : 1,
    bubbles: true,
  });
}

async function dispatchTouchTap(page: Page, pointerId: number, x: number, y: number) {
  await page.getByTestId("image-viewer-viewport").evaluate(
    (viewport, point) => {
      const pointerInit = {
        pointerId: point.pointerId,
        pointerType: "touch",
        isPrimary: true,
        clientX: point.x,
        clientY: point.y,
        button: 0,
        buttons: 1,
        bubbles: true,
      };
      viewport.dispatchEvent(new PointerEvent("pointerdown", pointerInit));
      viewport.dispatchEvent(
        new PointerEvent("pointerup", { ...pointerInit, buttons: 0 })
      );
    },
    { pointerId, x, y }
  );
}

async function dispatchTouchSequence(
  page: Page,
  sequence: Array<{
    type: "pointerdown" | "pointermove" | "pointerup";
    pointerId: number;
    x: number;
    y: number;
    isPrimary: boolean;
  }>
) {
  await page.getByTestId("image-viewer-viewport").evaluate(
    (viewport, actions) => {
      for (const action of actions) {
        viewport.dispatchEvent(
          new PointerEvent(action.type, {
            pointerId: action.pointerId,
            pointerType: "touch",
            isPrimary: action.isPrimary,
            clientX: action.x,
            clientY: action.y,
            button: 0,
            buttons: action.type === "pointerup" ? 0 : 1,
            bubbles: true,
          })
        );
      }
    },
    sequence
  );
}

test("mobile image viewer: pinch focal point, pinch→pan, rotate/flip and request stability", async ({ page }, testInfo: TestInfo) => {
  test.skip(testInfo.project.name !== "mobile-chromium", "Mobil pinch acceptance only runs on the Pixel 7 project.");
  test.setTimeout(120_000);

  await ensureAuthenticated(page);
  const imageId = await uploadImage(
    page,
    "image-viewer-large-4344x5792.png",
    createSolidGrayPng(4344, 5792)
  );

  await page.goto(`/dokumantasyon/dosya/${imageId}`);
  const viewport = page.getByTestId("image-viewer-viewport");
  const image = page.getByTestId("image-viewer-image");
  await expect(viewport).toBeVisible();
  await expect(image).toBeVisible();
  await expect(page.getByText("4344 × 5792 px", { exact: true })).toBeVisible();

  const zoomOutBox = await page
    .locator('[data-command-id="image.zoom.out"]')
    .boundingBox();
  expect(zoomOutBox?.height).toBeGreaterThanOrEqual(44);

  const imageSrc = await image.getAttribute("src");
  expect(imageSrc).toBeTruthy();
  const absoluteImageSrc = await page.evaluate(
    (src) => new URL(src!, window.location.href).href,
    imageSrc
  );
  let repeatImageRequests = 0;
  const requestListener = (request: { url(): string }) => {
    if (request.url() === absoluteImageSrc) repeatImageRequests += 1;
  };
  page.on("request", requestListener);

  const box = await viewport.boundingBox();
  if (!box) throw new Error("Image viewport box unavailable.");

  const initial = await readCamera(page);
  expect(initial.mode).toBe("fit");
  expect(initial.scale).toBeGreaterThan(0.02);
  expect(initial.scale).toBeLessThan(0.2);

  const midpoint = {
    x: box.x + box.width / 2 + 35,
    y: box.y + box.height / 2 - 55,
  };
  const p1Start = { x: midpoint.x - 40, y: midpoint.y };
  const p2Start = { x: midpoint.x + 40, y: midpoint.y };

  await dispatchTouchSequence(page, [
    { type: "pointerdown", pointerId: 101, x: p1Start.x, y: p1Start.y, isPrimary: true },
    { type: "pointerdown", pointerId: 102, x: p2Start.x, y: p2Start.y, isPrimary: false },
    { type: "pointermove", pointerId: 101, x: midpoint.x - 80, y: midpoint.y, isPrimary: true },
    { type: "pointermove", pointerId: 102, x: midpoint.x + 80, y: midpoint.y, isPrimary: false },
  ]);
  await page.waitForTimeout(50);

  const afterPinch = await readCamera(page);
  expect(afterPinch.scale).toBeGreaterThan(initial.scale * 1.7);
  expect(afterPinch.mode).toBe("custom");

  const localMidpoint = {
    x: midpoint.x - box.x,
    y: midpoint.y - box.y,
  };
  const viewportCenter = { x: box.width / 2, y: box.height / 2 };
  const beforeAnchor = {
    x: (localMidpoint.x - viewportCenter.x - initial.x) / initial.scale,
    y: (localMidpoint.y - viewportCenter.y - initial.y) / initial.scale,
  };
  const afterAnchor = {
    x: (localMidpoint.x - viewportCenter.x - afterPinch.x) / afterPinch.scale,
    y: (localMidpoint.y - viewportCenter.y - afterPinch.y) / afterPinch.scale,
  };
  const focalDriftPx = Math.hypot(
    (afterAnchor.x - beforeAnchor.x) * afterPinch.scale,
    (afterAnchor.y - beforeAnchor.y) * afterPinch.scale
  );
  expect(focalDriftPx).toBeLessThanOrEqual(10);

  await dispatchTouchPointer(page, "pointerup", 102, midpoint.x + 80, midpoint.y, false);
  const beforePan = await readCamera(page);
  await dispatchTouchPointer(page, "pointermove", 101, midpoint.x - 20, midpoint.y + 35, true);
  await page.waitForTimeout(50);
  const afterPan = await readCamera(page);
  expect(Math.hypot(afterPan.x - beforePan.x, afterPan.y - beforePan.y)).toBeGreaterThan(20);
  await dispatchTouchPointer(page, "pointerup", 101, midpoint.x - 20, midpoint.y + 35, true);

  // Custom zoom durumunda double tap tekrar fit'e dönmeli.
  for (const pointerId of [201, 202]) {
    await dispatchTouchTap(page, pointerId, midpoint.x, midpoint.y);
    await page.waitForTimeout(70);
  }
  await expect(page.locator("[data-zoom-mode='fit']").first()).toBeVisible();

  await page.getByRole("button", { name: "Görsel ek işlemleri" }).click();
  await page.getByRole("menuitem", { name: "Sağa döndür" }).click();
  await expect(page.locator("[data-rotation='90']").first()).toBeVisible();
  await expect(page.getByTestId("image-viewer-transformed-download")).toBeVisible();

  await page.getByRole("button", { name: "Görsel ek işlemleri" }).click();
  await page.getByRole("menuitem", { name: "Yatay aynala" }).click();
  await expect(page.locator("[data-flip-h='true']").first()).toBeVisible();
  await expect(page.getByTestId("image-viewer-transformed-download")).toBeVisible();

  const rotatedStart = await readCamera(page);
  await dispatchTouchSequence(page, [
    { type: "pointerdown", pointerId: 301, x: midpoint.x - 35, y: midpoint.y, isPrimary: true },
    { type: "pointerdown", pointerId: 302, x: midpoint.x + 35, y: midpoint.y, isPrimary: false },
    { type: "pointermove", pointerId: 301, x: midpoint.x - 70, y: midpoint.y, isPrimary: true },
    { type: "pointermove", pointerId: 302, x: midpoint.x + 70, y: midpoint.y, isPrimary: false },
  ]);
  await page.waitForTimeout(50);
  const rotatedPinch = await readCamera(page);
  expect(rotatedPinch.scale).toBeGreaterThan(rotatedStart.scale * 1.5);
  await dispatchTouchPointer(page, "pointerup", 302, midpoint.x + 70, midpoint.y, false);
  await dispatchTouchPointer(page, "pointerup", 301, midpoint.x - 70, midpoint.y, true);

  await page.setViewportSize({ width: 844, height: 390 });
  await page.waitForTimeout(100);
  const landscape = await readCamera(page);
  expect(landscape.scale).toBeGreaterThan(0);
  const overflow = await page.evaluate(() => ({
    width: document.documentElement.scrollWidth,
    client: document.documentElement.clientWidth,
  }));
  expect(overflow.width).toBeLessThanOrEqual(overflow.client);

  await page.setViewportSize({ width: 768, height: 1024 });
  await page.waitForTimeout(100);
  const tabletZoomOutBox = await page
    .locator('[data-command-id="image.zoom.out"]')
    .boundingBox();
  expect(tabletZoomOutBox?.height).toBeGreaterThanOrEqual(44);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(100);
  expect((await readCamera(page)).scale).toBeGreaterThan(0);
  await expect(page.getByTestId("image-viewer-transformed-download")).toBeVisible();
  const transformedDownloadBox = await page
    .getByTestId("image-viewer-transformed-download")
    .boundingBox();
  expect(transformedDownloadBox?.height).toBeGreaterThanOrEqual(44);

  await page.setViewportSize({ width: 320, height: 720 });
  const narrowMobileOverflow = await page.evaluate(() => ({
    width: document.documentElement.scrollWidth,
    client: document.documentElement.clientWidth,
  }));
  expect(narrowMobileOverflow.width).toBeLessThanOrEqual(narrowMobileOverflow.client);
  await expect(page.getByTestId("image-viewer-transformed-download")).toBeHidden();
  await page.getByRole("button", { name: "Görsel ek işlemleri" }).click();
  await expect(
    page.getByRole("menuitem", { name: "Düzenlenmiş görseli indir" })
  ).toBeVisible();

  page.off("request", requestListener);
  expect(repeatImageRequests).toBe(0);
});

test("dönüşüm sonrası araç panelinden indirilen PNG yönü ve tam çözünürlüğü korur", async ({ page }, testInfo: TestInfo) => {
  test.skip(testInfo.project.name !== "chromium", "Dışa aktarma kabulü masaüstü Chromium'da çalışır.");
  test.setTimeout(90_000);

  await ensureAuthenticated(page);
  const imageId = await uploadImage(
    page,
    "image-viewer-transform-quadrants.png",
    createQuadrantPng()
  );
  await page.goto(`/dokumantasyon/dosya/${imageId}`);
  await expect(page.getByTestId("image-viewer-image")).toBeVisible();
  await expect(page.getByTestId("image-viewer-transformed-download")).toHaveCount(0);
  await installImageExportCapture(page);

  const untransformed = await downloadAndInspectPng(
    page,
    "image-viewer-transform-quadrants_duzenlenmis.png",
    page.locator('[data-command-id="image.download"]')
  );
  expect({ width: untransformed.width, height: untransformed.height }).toEqual({
    width: 40,
    height: 30,
  });
  expect(untransformed.corners).toEqual({
    topLeft: [255, 0, 0],
    topRight: [0, 255, 0],
    bottomLeft: [0, 0, 255],
    bottomRight: [255, 255, 0],
  });

  await page.locator('[data-command-id="image.rotate.cw"]').click();
  await expect(page.getByTestId("image-viewer-transformed-download")).toBeVisible();
  await expect(page.getByTestId("image-viewer-transformed-download")).toHaveText(
    "Düzenlenmiş görseli indir"
  );
  const desktopToolbarOverflow = await page.evaluate(() => ({
    width: document.documentElement.scrollWidth,
    client: document.documentElement.clientWidth,
  }));
  expect(desktopToolbarOverflow.width).toBeLessThanOrEqual(desktopToolbarOverflow.client);
  const rotated = await downloadAndInspectPng(page, "image-viewer-transform-quadrants_duzenlenmis.png");
  expect(rotated.type).toBe("image/png");
  expect({ width: rotated.width, height: rotated.height }).toEqual({ width: 30, height: 40 });
  expect(rotated.corners).toEqual({
    topLeft: [0, 0, 255],
    topRight: [255, 0, 0],
    bottomLeft: [255, 255, 0],
    bottomRight: [0, 255, 0],
  });

  await page.locator('[data-command-id="image.flip.horizontal"]').click();
  const rotatedAndFlipped = await downloadAndInspectPng(
    page,
    "image-viewer-transform-quadrants_duzenlenmis.png"
  );
  expect({ width: rotatedAndFlipped.width, height: rotatedAndFlipped.height }).toEqual({
    width: 30,
    height: 40,
  });
  expect(rotatedAndFlipped.corners).toEqual({
    topLeft: [255, 255, 0],
    topRight: [0, 255, 0],
    bottomLeft: [0, 0, 255],
    bottomRight: [255, 0, 0],
  });

  await page.locator('[data-command-id="image.zoom.100"]').click();
  await expect(page.getByTestId("image-viewer-transformed-download")).toHaveCount(0);
  await page.locator('[data-command-id="image.flip.horizontal"]').click();
  const horizontallyFlipped = await downloadAndInspectPng(
    page,
    "image-viewer-transform-quadrants_duzenlenmis.png"
  );
  expect({ width: horizontallyFlipped.width, height: horizontallyFlipped.height }).toEqual({
    width: 40,
    height: 30,
  });
  expect(horizontallyFlipped.corners).toEqual({
    topLeft: [0, 255, 0],
    topRight: [255, 0, 0],
    bottomLeft: [255, 255, 0],
    bottomRight: [0, 0, 255],
  });

  await page.locator('[data-command-id="image.flip.horizontal"]').click();
  await page.locator('[data-command-id="image.flip.vertical"]').click();
  const verticallyFlipped = await downloadAndInspectPng(
    page,
    "image-viewer-transform-quadrants_duzenlenmis.png"
  );
  expect({ width: verticallyFlipped.width, height: verticallyFlipped.height }).toEqual({
    width: 40,
    height: 30,
  });
  expect(verticallyFlipped.corners).toEqual({
    topLeft: [0, 0, 255],
    topRight: [255, 255, 0],
    bottomLeft: [255, 0, 0],
    bottomRight: [0, 255, 0],
  });

  await page.locator('[data-command-id="image.flip.vertical"]').click();
  await expect(page.getByTestId("image-viewer-transformed-download")).toHaveCount(0);
  await page.locator('[data-command-id="image.rotate.ccw"]').click();
  const rotatedLeft = await downloadAndInspectPng(
    page,
    "image-viewer-transform-quadrants_duzenlenmis.png"
  );
  expect({ width: rotatedLeft.width, height: rotatedLeft.height }).toEqual({
    width: 30,
    height: 40,
  });
  expect(rotatedLeft.corners).toEqual({
    topLeft: [0, 255, 0],
    topRight: [255, 255, 0],
    bottomLeft: [255, 0, 0],
    bottomRight: [0, 0, 255],
  });
});

test("desktop image viewer toolbar: left rail collapses, preserves the camera, and responds to resize/fullscreen", async ({ page }, testInfo: TestInfo) => {
  test.skip(testInfo.project.name !== "chromium", "Desktop toolbar layout runs only on Desktop Chromium.");
  test.setTimeout(90_000);

  await page.setViewportSize({ width: 1440, height: 900 });
  await ensureAuthenticated(page);
  const imageId = await uploadImage(
    page,
    "image-viewer-rail-layout.png",
    createSolidGrayPng(1600, 800)
  );

  await page.goto("/dokumantasyon/dosya/" + imageId);
  const header = page.getByTestId("image-viewer-header");
  const toolbar = page.getByTestId("image-viewer-toolbar");
  const viewport = page.getByTestId("image-viewer-viewport");
  const collapseToggle = page.getByTestId("image-viewer-toolbar-collapse");
  await expect(page.getByTestId("image-viewer-image")).toBeVisible();
  await expect(header).toBeVisible();
  await expect(page.getByTestId("image-viewer-file-name")).toContainText(
    "image-viewer-rail-layout.png"
  );
  await expect(toolbar).toHaveCSS("flex-direction", "column");
  await expect(collapseToggle).toHaveAttribute("aria-expanded", "true");
  await expect(page.getByRole("button", { name: "Sağa döndür" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Yatay aynala" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Dikey aynala" })).toBeVisible();

  const headerBox = await header.boundingBox();
  const expandedToolbarBox = await toolbar.boundingBox();
  const expandedViewportBox = await viewport.boundingBox();
  if (!headerBox || !expandedToolbarBox || !expandedViewportBox) {
    throw new Error("Desktop image viewer layout boxes are unavailable.");
  }
  expect(expandedToolbarBox.x).toBe(0);
  expect(expandedToolbarBox.y).toBeCloseTo(headerBox.y + headerBox.height, 0);
  expect(expandedToolbarBox.width).toBe(224);
  expect(expandedViewportBox.x).toBeCloseTo(expandedToolbarBox.width, 0);
  expect(expandedViewportBox.y).toBeCloseTo(headerBox.y + headerBox.height, 0);

  const initialFit = await readCamera(page);
  await collapseToggle.click();
  await expect(collapseToggle).toHaveAttribute("aria-expanded", "false");
  await expect.poll(async () => (await toolbar.boundingBox())?.width ?? 0).toBe(64);
  await expect.poll(async () => Math.abs((await readCamera(page)).scale - initialFit.scale))
    .toBeGreaterThan(0.02);
  await expect(page.getByRole("button", { name: "Sağa döndür" })).toBeVisible();
  const collapsedViewportBox = await viewport.boundingBox();
  if (!collapsedViewportBox) throw new Error("Collapsed image viewport box is unavailable.");
  expect(collapsedViewportBox.x).toBe(64);

  const collapsedFit = await readCamera(page);
  await page.locator('[data-command-id="image.zoom.in"]').click();
  await expect.poll(async () => (await readCamera(page)).scale / collapsedFit.scale)
    .toBeCloseTo(1.25, 2);
  const zoomed = await readCamera(page);
  const zoomedViewportBox = await viewport.boundingBox();
  if (!zoomedViewportBox) throw new Error("Zoomed image viewport box is unavailable.");
  await page.mouse.move(
    zoomedViewportBox.x + zoomedViewportBox.width / 2,
    zoomedViewportBox.y + zoomedViewportBox.height / 2
  );
  await page.mouse.down();
  await page.mouse.move(
    zoomedViewportBox.x + zoomedViewportBox.width / 2 + 60,
    zoomedViewportBox.y + zoomedViewportBox.height / 2,
    { steps: 4 }
  );
  await page.mouse.up();
  await expect.poll(async () => Math.abs((await readCamera(page)).x - zoomed.x))
    .toBeGreaterThan(20);
  const customCamera = await readCamera(page);

  await collapseToggle.click();
  await expect(collapseToggle).toHaveAttribute("aria-expanded", "true");
  await expect.poll(async () => (await toolbar.boundingBox())?.width ?? 0).toBe(224);
  await expect.poll(async () => Math.abs((await readCamera(page)).scale - customCamera.scale))
    .toBeLessThan(0.01);
  await expect.poll(async () => Math.abs((await readCamera(page)).x - customCamera.x))
    .toBeLessThan(1.5);

  await page.locator('[data-command-id="image.rotate.cw"]').click();
  const transformedDownload = page.getByTestId("image-viewer-transformed-download");
  await expect(transformedDownload).toBeVisible();
  await collapseToggle.click();
  await expect.poll(async () => (await toolbar.boundingBox())?.width ?? 0).toBe(64);
  const collapsedRailBox = await toolbar.boundingBox();
  const collapsedDownloadBox = await transformedDownload.boundingBox();
  if (!collapsedRailBox || !collapsedDownloadBox) {
    throw new Error("Collapsed rail download control box is unavailable.");
  }
  expect(collapsedDownloadBox.x).toBeGreaterThanOrEqual(collapsedRailBox.x);
  expect(collapsedDownloadBox.x + collapsedDownloadBox.width)
    .toBeLessThanOrEqual(collapsedRailBox.x + collapsedRailBox.width);
  await expect(transformedDownload).toHaveAccessibleName("Düzenlenmiş görseli indir");
  await collapseToggle.click();
  await expect.poll(async () => (await toolbar.boundingBox())?.width ?? 0).toBe(224);

  await page.setViewportSize({ width: 1010, height: 800 });
  await expect(toolbar).toHaveCSS("flex-direction", "row");
  await expect(collapseToggle).toBeHidden();
  await expect(page.getByTestId("image-viewer-more-menu-trigger")).toBeVisible();
  const tabletLayout = await page.evaluate(() => ({
    width: document.documentElement.scrollWidth,
    client: document.documentElement.clientWidth,
  }));
  expect(tabletLayout.width).toBeLessThanOrEqual(tabletLayout.client);

  await page.setViewportSize({ width: 1280, height: 800 });
  await expect(toolbar).toHaveCSS("flex-direction", "column");
  await expect(collapseToggle).toBeVisible();
  await expect.poll(async () => (await toolbar.boundingBox())?.width ?? 0).toBe(224);

  const fullscreenToggle = page.getByTestId("image-viewer-fullscreen-toggle");
  await fullscreenToggle.click();
  await expect.poll(() => page.evaluate(() => Boolean(document.fullscreenElement))).toBe(true);
  await expect(toolbar).toBeVisible();
  await expect(toolbar).toHaveCSS("flex-direction", "column");
  await fullscreenToggle.click();
  await expect.poll(() => page.evaluate(() => Boolean(document.fullscreenElement))).toBe(false);
});

test("desktop image viewer regression: toolbar, wheel, mouse pan and transforms", async ({ page }, testInfo: TestInfo) => {
  test.skip(testInfo.project.name !== "chromium", "Desktop regression runs only on Desktop Chromium.");
  test.setTimeout(90_000);

  await ensureAuthenticated(page);
  const imageId = await uploadImage(
    page,
    "image-viewer-desktop-1600x1200.png",
    createSolidGrayPng(1600, 1200)
  );

  await page.goto(`/dokumantasyon/dosya/${imageId}`);
  const viewport = page.getByTestId("image-viewer-viewport");
  const image = page.getByTestId("image-viewer-image");
  await expect(image).toBeVisible();

  const initial = await readCamera(page);
  await page.locator('[data-command-id="image.zoom.in"]').click();
  await page.waitForFunction(
    (initialScale) => {
      const scale = Number(document.querySelector<HTMLElement>("[data-scale]")?.dataset.scale);
      return Number.isFinite(scale) && Math.abs(scale / initialScale - 1.25) < 0.005;
    },
    initial.scale,
    { timeout: 3000 }
  );
  const buttonZoom = await readCamera(page);
  expect(buttonZoom.scale).toBeGreaterThan(initial.scale);
  expect(buttonZoom.scale / initial.scale).toBeCloseTo(1.25, 2);

  const box = await viewport.boundingBox();
  if (!box) throw new Error("Desktop image viewport box unavailable.");
  const anchorLocal = { x: box.width / 2, y: box.height * 0.35 };
  const anchorClient = { x: box.x + anchorLocal.x, y: box.y + anchorLocal.y };
  const imagePointBeforeWheel = {
    x: (anchorLocal.x - box.width / 2 - buttonZoom.x) / buttonZoom.scale,
    y: (anchorLocal.y - box.height / 2 - buttonZoom.y) / buttonZoom.scale,
  };
  const pageScrollBeforeWheel = await page.evaluate(() => window.scrollY);
  await page.mouse.move(anchorClient.x, anchorClient.y);
  await page.mouse.wheel(0, -120);
  await page.waitForTimeout(50);
  const wheelZoom = await readCamera(page);
  expect(wheelZoom.scale).toBeGreaterThan(buttonZoom.scale);
  expect(await page.evaluate(() => window.scrollY)).toBe(pageScrollBeforeWheel);
  const imagePointAfterWheel = {
    x: (anchorLocal.x - box.width / 2 - wheelZoom.x) / wheelZoom.scale,
    y: (anchorLocal.y - box.height / 2 - wheelZoom.y) / wheelZoom.scale,
  };
  const wheelAnchorDriftPx = Math.hypot(
    (imagePointAfterWheel.x - imagePointBeforeWheel.x) * wheelZoom.scale,
    (imagePointAfterWheel.y - imagePointBeforeWheel.y) * wheelZoom.scale
  );
  expect(wheelAnchorDriftPx).toBeLessThanOrEqual(1.5);

  const beforePan = await readCamera(page);
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + 80, box.y + box.height / 2 + 40, { steps: 4 });
  await page.mouse.up();
  await page.waitForTimeout(50);
  const afterPan = await readCamera(page);
  expect(Math.hypot(afterPan.x - beforePan.x, afterPan.y - beforePan.y)).toBeGreaterThan(20);

  await page.locator('[data-command-id="image.rotate.cw"]').click();
  await expect(page.locator("[data-rotation='90']").first()).toBeVisible();

  await page.locator('[data-command-id="image.flip.horizontal"]').click();
  await expect(page.locator("[data-flip-h='true']").first()).toBeVisible();

  await page.locator('[data-command-id="image.zoom.fit"]').click();
  await expect(page.locator("[data-zoom-mode='fit']").first()).toBeVisible();

  await page.locator('[data-command-id="image.zoom.100"]').click();
  const reset = await readCamera(page);
  expect(reset.mode).toBe("fit");
  expect(reset.scale).toBeCloseTo(initial.scale, 3);
  expect(reset.rotation).toBe(0);
  expect(reset.flipH).toBe("false");
  expect(reset.flipV).toBe("false");
});
