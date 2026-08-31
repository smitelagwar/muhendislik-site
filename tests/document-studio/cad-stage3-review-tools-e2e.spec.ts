import { expect, test, type Page } from "@playwright/test";

import {
  cleanupUploadedCadFixtures,
  signInAdmin,
  uploadCadPreviewV2Fixture,
} from "./cad-test-helpers";

type ReviewDoc = {
  items: Array<{
    id: string;
    type: string;
    status?: string;
    text?: string;
    title?: string;
    comment?: string;
    rotationDeg?: number;
    style: {
      color: string;
      strokeWidth: number;
      lineDash?: string;
      opacity?: number;
      fillColor?: string;
      fillOpacity?: number;
      fontSize?: number;
    };
  }>;
};

async function openWorkspace(page: Page) {
  await signInAdmin(page);
  const { fileId } = await uploadCadPreviewV2Fixture(page, "text-rotation-0-90-180-270");
  await page.goto(`/dokumantasyon/dosya/${fileId}`);

  const host = page.locator('[data-cad-upstream-host="true"]').first();
  await expect(host).toHaveAttribute("data-cad-upstream-state", "ready", { timeout: 30_000 });
  await expect(page.getByTestId("cad-studio-ribbon")).toBeVisible();
  const canvas = host.locator("canvas").first();
  await expect(canvas).toBeVisible();
  await page.waitForTimeout(200);
  return { fileId, host, canvas };
}

async function reviewDoc(page: Page, fileId: string): Promise<ReviewDoc | null> {
  return page.evaluate((id) => {
    const raw = window.localStorage.getItem(`dok_cad_review_v1_${id}`);
    return raw ? (JSON.parse(raw) as ReviewDoc) : null;
  }, fileId);
}

async function canvasBox(page: Page, canvas: ReturnType<Page["locator"]>) {
  const box = await canvas.boundingBox();
  expect(box).not.toBeNull();
  return box!;
}

async function drawStroke(page: Page, canvas: ReturnType<Page["locator"]>) {
  const box = await canvasBox(page, canvas);
  await page.mouse.move(box.x + box.width * 0.3, box.y + box.height * 0.4);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.42, box.y + box.height * 0.48, { steps: 8 });
  await page.mouse.move(box.x + box.width * 0.52, box.y + box.height * 0.43, { steps: 8 });
  await page.mouse.up();
}

async function dragShape(
  page: Page,
  canvas: ReturnType<Page["locator"]>,
  start: [number, number],
  end: [number, number]
) {
  const box = await canvasBox(page, canvas);
  await page.mouse.move(box.x + box.width * start[0], box.y + box.height * start[1]);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * end[0], box.y + box.height * end[1], { steps: 8 });
  await page.mouse.up();
}

async function clickCanvas(
  page: Page,
  canvas: ReturnType<Page["locator"]>,
  xRatio: number,
  yRatio: number
) {
  const box = await canvasBox(page, canvas);
  await page.mouse.click(box.x + box.width * xRatio, box.y + box.height * yRatio);
}

test.describe("CAD Stage 3 — review tools browser acceptance", () => {
  test.afterEach(async ({ page }) => {
    await cleanupUploadedCadFixtures(page);
  });

  test("Kalem split caret: Custom HEX + 5px + dashed gerçek stroke'a bağlanır, Undo/Redo çalışır", async ({ page }) => {
    const { fileId, canvas } = await openWorkspace(page);

    const main = page.getByTestId("cad-tool-stroke");
    const caret = page.getByTestId("cad-tool-stroke-style-trigger");
    await expect(main).toHaveAttribute("data-cad-active", "false");

    await caret.click();
    await expect(page.getByTestId("cad-tool-stroke-style-trigger-content")).toBeVisible();
    await expect(main).toHaveAttribute("data-cad-active", "false");

    const hex = page.getByTestId("cad-pencil-color-hex");
    await hex.fill("#12AB34");
    await page.getByTestId("cad-pencil-color-apply").click();
    await page.getByTestId("cad-pencil-width-5").click();
    await page.getByTestId("cad-pencil-line-dashed").click();
    await page.getByTestId("cad-pencil-opacity").fill("80");

    await expect(page.locator('[data-cad-line-width-preview="5"]')).toHaveCSS("height", "5px");
    await expect(page.locator('[data-cad-line-style-preview="dashed"] line')).toHaveAttribute("stroke-dasharray", "9 5");

    await page.keyboard.press("Escape");
    await main.click();
    await expect(main).toHaveAttribute("data-cad-active", "true");

    await drawStroke(page, canvas);

    await expect.poll(async () => (await reviewDoc(page, fileId))?.items.filter((item) => item.type === "stroke").length).toBe(1);
    let document = await reviewDoc(page, fileId);
    let stroke = document!.items.find((item) => item.type === "stroke")!;
    expect(stroke.style.color.toLowerCase()).toBe("#12ab34");
    expect(stroke.style.strokeWidth).toBe(5);
    expect(stroke.style.lineDash).toBe("dashed");
    expect(stroke.style.opacity).toBeCloseTo(0.8, 4);

    await page.getByTestId("cad-tool-undo").click();
    await expect.poll(async () => (await reviewDoc(page, fileId))?.items.filter((item) => item.type === "stroke").length).toBe(0);

    await page.getByTestId("cad-tool-redo").click();
    await expect.poll(async () => (await reviewDoc(page, fileId))?.items.filter((item) => item.type === "stroke").length).toBe(1);
    document = await reviewDoc(page, fileId);
    stroke = document!.items.find((item) => item.type === "stroke")!;
    expect(stroke.style.strokeWidth).toBe(5);
  });

  test("Şekil fill gerçek state olur ve Select ile seçili review item property menüsünden düzenlenir", async ({ page }) => {
    const { fileId, canvas } = await openWorkspace(page);

    await page.getByTestId("cad-tool-shapes-dropdown").click();
    await page.getByTestId("cad-tool-shape-rect").click();
    await page.getByTestId("cad-shape-fill-20").click();
    await page.getByTestId("cad-shape-fill-color-preset-3b82f6").click();
    await page.keyboard.press("Escape");

    await dragShape(page, canvas, [0.58, 0.34], [0.75, 0.52]);
    await expect.poll(async () => (await reviewDoc(page, fileId))?.items.filter((item) => item.type === "shape").length).toBe(1);

    let document = await reviewDoc(page, fileId);
    const shape = document!.items.find((item) => item.type === "shape")!;
    expect(shape.style.fillOpacity).toBeCloseTo(0.2, 4);
    expect(shape.style.fillColor?.toLowerCase()).toBe("#3b82f6");

    await page.getByTestId("cad-tool-select").click();
    const shapeOverlay = page.locator(`[data-review-id="${shape.id}"] rect`).first();
    await expect(shapeOverlay).toBeVisible();
    await shapeOverlay.click();

    await expect(page.getByTestId("cad-studio-ribbon")).toHaveAttribute("data-cad-selection-style-mode", "true");
    await page.getByTestId("cad-tool-shapes-dropdown").click();
    await expect(page.getByTestId("cad-selected-style-mode")).toBeVisible();
    await page.getByTestId("cad-shape-color-hex").fill("#AA22CC");
    await page.getByTestId("cad-shape-color-apply").click();
    await page.getByTestId("cad-shape-width-5").click();

    await expect.poll(async () => {
      const latest = await reviewDoc(page, fileId);
      return latest?.items.find((item) => item.id === shape.id)?.style.color.toLowerCase();
    }).toBe("#aa22cc");

    document = await reviewDoc(page, fileId);
    const changed = document!.items.find((item) => item.id === shape.id)!;
    expect(changed.style.strokeWidth).toBe(5);
  });

  test("Metin, Callout ve Pin native prompt açmadan inline editor/composer ile kaydedilir", async ({ page }) => {
    const { fileId, canvas } = await openWorkspace(page);
    let browserDialogs = 0;
    page.on("dialog", async (dialog) => {
      browserDialogs += 1;
      await dialog.dismiss();
    });

    await page.getByTestId("cad-tool-text").click();
    await clickCanvas(page, canvas, 0.3, 0.25);
    await expect(page.getByTestId("cad-inline-review-editor")).toBeVisible();
    await page.getByTestId("cad-inline-editor-text").fill("STATİK KONTROL");
    await page.getByTestId("cad-inline-editor-font-20").click();
    await page.getByTestId("cad-inline-bg-dark").click();
    await page.getByTestId("cad-inline-editor-rotation-45").click();
    await page.getByTestId("cad-inline-editor-save").click();

    await expect.poll(async () => (await reviewDoc(page, fileId))?.items.filter((item) => item.type === "text").length).toBe(1);
    let document = await reviewDoc(page, fileId);
    const text = document!.items.find((item) => item.type === "text")!;
    expect(text.text).toBe("STATİK KONTROL");
    expect(text.rotationDeg).toBe(45);
    expect(text.style.fontSize).toBe(20);
    expect(text.style.fillColor?.toLowerCase()).toBe("#111827");
    expect((text.style.fillOpacity ?? 0)).toBeGreaterThanOrEqual(0.8);

    await page.getByTestId("cad-tool-callout-style-trigger").click();
    await page.getByTestId("cad-callout-direction-right").click();
    await page.keyboard.press("Escape");
    await page.getByTestId("cad-tool-callout").click();
    await dragShape(page, canvas, [0.4, 0.62], [0.58, 0.7]);
    await expect(page.getByTestId("cad-inline-review-editor")).toBeVisible();
    await page.getByTestId("cad-inline-editor-text").fill("KİRİŞ REVİZYONU");
    await page.getByTestId("cad-inline-editor-save").click();
    await expect.poll(async () => (await reviewDoc(page, fileId))?.items.filter((item) => item.type === "callout").length).toBe(1);

    await page.getByTestId("cad-tool-pin").click();
    await clickCanvas(page, canvas, 0.72, 0.68);
    await expect(page.getByTestId("cad-inline-review-editor")).toBeVisible();
    await page.getByTestId("cad-inline-editor-title").fill("Aks Kontrolü");
    await page.getByTestId("cad-inline-editor-comment").fill("Aks kesişimi yeniden kontrol edilsin");
    await page.getByTestId("cad-inline-editor-status-question").click();
    await page.getByTestId("cad-inline-editor-save").click();

    await expect.poll(async () => (await reviewDoc(page, fileId))?.items.filter((item) => item.type === "comment_pin").length).toBe(1);
    document = await reviewDoc(page, fileId);
    const pin = document!.items.find((item) => item.type === "comment_pin")!;
    expect(pin.title).toBe("Aks Kontrolü");
    expect(pin.comment).toBe("Aks kesişimi yeniden kontrol edilsin");
    expect(pin.status).toBe("question");
    expect(browserDialogs).toBe(0);
  });

  test("Silgi 28px seçeneği markup siler, Undo geri getirir; clear-all destructive confirm ister", async ({ page }) => {
    const { fileId, canvas } = await openWorkspace(page);

    await page.getByTestId("cad-tool-stroke").click();
    await drawStroke(page, canvas);
    await expect.poll(async () => (await reviewDoc(page, fileId))?.items.filter((item) => item.type === "stroke").length).toBe(1);

    const document = await reviewDoc(page, fileId);
    const stroke = document!.items.find((item) => item.type === "stroke")!;
    const strokePath = page.locator(`[data-review-id="${stroke.id}"] path`).first();
    await expect(strokePath).toBeVisible();
    const pathBox = await strokePath.boundingBox();
    expect(pathBox).not.toBeNull();

    await page.getByTestId("cad-tool-eraser-style-trigger").click();
    await page.getByTestId("cad-eraser-radius-28").click();
    await page.keyboard.press("Escape");
    await page.getByTestId("cad-tool-eraser").click();
    await page.mouse.click(pathBox!.x + pathBox!.width / 2, pathBox!.y + pathBox!.height / 2);

    await expect.poll(async () => (await reviewDoc(page, fileId))?.items.filter((item) => item.type === "stroke").length).toBe(0);
    await page.getByTestId("cad-tool-undo").click();
    await expect.poll(async () => (await reviewDoc(page, fileId))?.items.filter((item) => item.type === "stroke").length).toBe(1);

    await page.getByTestId("cad-tool-eraser-style-trigger").click();
    await page.getByTestId("cad-eraser-clear-all").click();
    await expect(page.getByTestId("cad-clear-markup-dialog")).toBeVisible();
    await page.getByTestId("cad-clear-markup-confirm").click();
    await expect.poll(async () => (await reviewDoc(page, fileId))?.items.length).toBe(0);

    await page.getByTestId("cad-tool-undo").click();
    await expect.poll(async () => (await reviewDoc(page, fileId))?.items.filter((item) => item.type === "stroke").length).toBe(1);
  });
});
