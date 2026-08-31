import { expect, test } from "@playwright/test";

import {
  cleanupUploadedCadFixtures,
  signInAdmin,
  uploadCadPreviewV2Fixture,
} from "./cad-test-helpers";

async function openCadWorkspace(page: import("@playwright/test").Page) {
  await signInAdmin(page);
  const { fileId } = await uploadCadPreviewV2Fixture(page, "text-rotation-0-90-180-270");

  await page.goto(`/dokumantasyon/dosya/${fileId}`);
  const host = page.locator('[data-cad-upstream-host="true"]').first();
  await expect(host).toHaveAttribute("data-cad-upstream-state", "ready", { timeout: 30_000 });
  await expect(page.getByTestId("cad-studio-ribbon")).toBeVisible();

  return { host };
}

function expectInsideViewport(
  box: { x: number; y: number; width: number; height: number },
  viewport: { width: number; height: number }
) {
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.y).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(viewport.width);
  expect(box.y + box.height).toBeLessThanOrEqual(viewport.height);
}

test.describe("CAD Stage 2 — Ribbon browser acceptance", () => {
  test.afterEach(async ({ page }) => {
    await cleanupUploadedCadFixtures(page);
  });

  test("split main/caret ayrımı, collision, Escape focus dönüşü ve ghost-click koruması", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 900, height: 640 });
    const { host } = await openCadWorkspace(page);

    const pinMain = page.getByTestId("cad-tool-pin");
    const pinCaret = page.getByTestId("cad-tool-pin-style-trigger");
    const pinMenu = page.getByTestId("cad-tool-pin-style-trigger-content");

    await pinCaret.scrollIntoViewIfNeeded();
    await expect(pinMain).not.toHaveAttribute("aria-pressed", "true");

    await pinCaret.focus();
    await page.keyboard.press("Enter");
    await expect(pinMenu).toBeVisible();
    await expect(pinMain).not.toHaveAttribute("aria-pressed", "true");

    const menuBox = await pinMenu.boundingBox();
    const viewport = page.viewportSize();
    expect(menuBox).not.toBeNull();
    expect(viewport).not.toBeNull();
    expectInsideViewport(menuBox!, viewport!);

    await page.keyboard.press("Escape");
    await expect(pinMenu).toBeHidden();
    await expect(pinCaret).toBeFocused();

    await pinMain.click();
    await expect(pinMain).toHaveAttribute("aria-pressed", "true");

    await pinCaret.click();
    await expect(pinMenu).toBeVisible();

    let promptCount = 0;
    page.on("dialog", async (dialog) => {
      promptCount += 1;
      await dialog.dismiss();
    });

    const canvas = host.locator("canvas").first();
    await expect(canvas).toBeVisible();
    const canvasBox = await canvas.boundingBox();
    expect(canvasBox).not.toBeNull();

    const x = canvasBox!.x + canvasBox!.width * 0.55;
    const y = canvasBox!.y + canvasBox!.height * 0.7;

    // İlk pointer dizisi yalnızca menüyü kapatmalı; alttaki pin aracı tetiklenmemeli.
    await page.mouse.click(x, y);
    await expect(pinMenu).toBeHidden();
    await page.waitForTimeout(100);
    expect(promptCount).toBe(0);

    // Sonraki bilinçli canvas tıklaması normal araca ulaşmalı; guard tek pointer dizisiyle sınırlı kalmalı.
    await page.mouse.click(x + 18, y + 12);
    await expect.poll(() => promptCount).toBe(1);
  });

  test("desktop ribbon hedefleri 36 px standardını korur", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await openCadWorkspace(page);

    const fit = page.getByTestId("cad-tool-fit");
    const box = await fit.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeGreaterThanOrEqual(35);
    expect(box!.width).toBeLessThanOrEqual(37);
    expect(box!.height).toBeGreaterThanOrEqual(35);
    expect(box!.height).toBeLessThanOrEqual(37);
  });
});

test.describe("CAD Stage 2 — coarse pointer touch targets", () => {
  test.use({
    viewport: { width: 1024, height: 768 },
    hasTouch: true,
    isMobile: true,
    deviceScaleFactor: 2,
  });

  test.afterEach(async ({ page }) => {
    await cleanupUploadedCadFixtures(page);
  });

  test("icon ve split caret hedefleri en az 44×44 px olur", async ({ page }) => {
    await openCadWorkspace(page);

    expect(await page.evaluate(() => window.matchMedia("(pointer: coarse)").matches)).toBe(true);

    for (const testId of ["cad-tool-fit", "cad-display-lineweight", "cad-tool-shapes-dropdown"]) {
      const target = page.getByTestId(testId);
      await target.scrollIntoViewIfNeeded();
      const box = await target.boundingBox();
      expect(box, testId).not.toBeNull();
      expect(box!.width, `${testId} width`).toBeGreaterThanOrEqual(44);
      expect(box!.height, `${testId} height`).toBeGreaterThanOrEqual(44);
    }
  });
});
