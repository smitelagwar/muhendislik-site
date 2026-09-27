import { expect, test, type Page, type TestInfo } from "@playwright/test";
import { deflateSync } from "node:zlib";

async function login(page: Page) {
  await page.goto("/dokumantasyon");
  await page.getByLabel("Kullanıcı Adı").fill("admin");
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

test("mobile image viewer: pinch focal point, pinch→pan, rotate/flip and request stability", async ({ page }, testInfo: TestInfo) => {
  test.skip(testInfo.project.name !== "mobile-chromium", "Mobil pinch acceptance only runs on the Pixel 7 project.");
  test.setTimeout(120_000);

  await login(page);
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

  await dispatchTouchPointer(page, "pointerdown", 101, p1Start.x, p1Start.y, true);
  await dispatchTouchPointer(page, "pointerdown", 102, p2Start.x, p2Start.y, false);
  await dispatchTouchPointer(page, "pointermove", 101, midpoint.x - 80, midpoint.y, true);
  await dispatchTouchPointer(page, "pointermove", 102, midpoint.x + 80, midpoint.y, false);
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
    await dispatchTouchPointer(page, "pointerdown", pointerId, midpoint.x, midpoint.y, true);
    await dispatchTouchPointer(page, "pointerup", pointerId, midpoint.x, midpoint.y, true);
    await page.waitForTimeout(70);
  }
  await expect(page.locator("[data-zoom-mode='fit']").first()).toBeVisible();

  await page.getByRole("button", { name: "Görsel ek işlemleri" }).click();
  await page.getByRole("menuitem", { name: "Sağa döndür" }).click();
  await expect(page.locator("[data-rotation='90']").first()).toBeVisible();

  await page.getByRole("button", { name: "Görsel ek işlemleri" }).click();
  await page.getByRole("menuitem", { name: "Yatay aynala" }).click();
  await expect(page.locator("[data-flip-h='true']").first()).toBeVisible();

  const rotatedStart = await readCamera(page);
  await dispatchTouchPointer(page, "pointerdown", 301, midpoint.x - 35, midpoint.y, true);
  await dispatchTouchPointer(page, "pointerdown", 302, midpoint.x + 35, midpoint.y, false);
  await dispatchTouchPointer(page, "pointermove", 301, midpoint.x - 70, midpoint.y, true);
  await dispatchTouchPointer(page, "pointermove", 302, midpoint.x + 70, midpoint.y, false);
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

  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(100);
  expect((await readCamera(page)).scale).toBeGreaterThan(0);

  page.off("request", requestListener);
  expect(repeatImageRequests).toBe(0);
});

test("desktop image viewer regression: toolbar, wheel, mouse pan and transforms", async ({ page }, testInfo: TestInfo) => {
  test.skip(testInfo.project.name !== "chromium", "Desktop regression runs only on Desktop Chromium.");
  test.setTimeout(90_000);

  await login(page);
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
  const buttonZoom = await readCamera(page);
  expect(buttonZoom.scale).toBeGreaterThan(initial.scale);

  const box = await viewport.boundingBox();
  if (!box) throw new Error("Desktop image viewport box unavailable.");
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.keyboard.down("Control");
  await page.mouse.wheel(0, -120);
  await page.keyboard.up("Control");
  await page.waitForTimeout(50);
  const wheelZoom = await readCamera(page);
  expect(wheelZoom.scale).toBeGreaterThan(buttonZoom.scale);

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
  expect(reset.scale).toBe(1);
  expect(reset.rotation).toBe(0);
  expect(reset.flipH).toBe("false");
  expect(reset.flipV).toBe("false");
});
