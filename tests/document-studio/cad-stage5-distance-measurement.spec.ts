import { expect, test } from "@playwright/test";
import {
  signInAdmin,
  uploadCadPreviewV2Fixture,
  cleanupUploadedCadFixtures,
} from "./cad-test-helpers";

test.describe("CAD Preview V2 — Stage 5/8 Mesafe Ölçümü: Hassas, Doğrulanmış UX", () => {
  test.afterEach(async ({ page }) => {
    await cleanupUploadedCadFixtures(page);
  });

  test("Desktop: İki tıklama ile mesafe ölçümü tamamlanır, 3-4-5 fixture sonucu UI overlay'inde 5.000 / 5000 olarak doğrulanır", async ({
    page,
    isMobile,
  }) => {
    test.skip(Boolean(isMobile), "Masaüstü fare ve hover testi yalnızca masaüstü tarayıcılarda çalışır");
    await signInAdmin(page);
    const { fileId } = await uploadCadPreviewV2Fixture(page, "known-geometry-measurements");

    await page.goto(`/dokumantasyon/dosya/${fileId}`);
    const host = page.locator('[data-cad-upstream-host="true"]').first();
    await expect(host).toHaveAttribute("data-cad-upstream-state", "ready", { timeout: 30_000 });

    const canvas = host.locator("canvas").first();
    await expect(canvas).toBeVisible();

    // 1. Activate distance tool from left quick rail
    const distBtn = page.locator('[data-testid="cad-tool-distance"]').first();
    await distBtn.click();
    await expect(host).toHaveAttribute("data-cad-active-tool", "distance");
    await expect(host).toHaveAttribute("data-cad-distance-phase", "awaiting-first");

    // Status instruction visible
    const status = page.locator('[data-testid="cad-distance-status"]').first();
    await expect(status).toBeVisible();
    await expect(status).toContainText("1. noktayı seçin");

    // 2. Click near first endpoint (0, 0) of known geometry
    // In known-geometry-measurements.dxf, L_MEASURE_1 is from (0,0) to (3000, 4000)
    // We can evaluate canvas bounds and project the CAD points
    const points = await page.evaluate(() => {
      const hostEl = document.querySelector('[data-cad-upstream-host="true"]') as unknown as {
        __cadAdapter?: {
          projectWorldPoint?: (p: { x: number; y: number }) => { x: number; y: number } | null;
        };
      };
      const containerEl = document.querySelector("[aria-label$='CAD görünümü']") as unknown as {
        __cadAdapter?: {
          projectWorldPoint?: (p: { x: number; y: number }) => { x: number; y: number } | null;
        };
      };
      const adapter = hostEl?.__cadAdapter || containerEl?.__cadAdapter;
      const p1 = adapter?.projectWorldPoint?.({ x: 0, y: 0 }) ?? null;
      const p2 = adapter?.projectWorldPoint?.({ x: 3000, y: 4000 }) ?? null;
      return { p1, p2 };
    });

    expect(points.p1).not.toBeNull();
    expect(points.p2).not.toBeNull();

    const canvasBox = await canvas.boundingBox();
    expect(canvasBox).not.toBeNull();

    const p1ScreenX = canvasBox!.x + points.p1!.x;
    const p1ScreenY = canvasBox!.y + points.p1!.y;
    const p2ScreenX = canvasBox!.x + points.p2!.x;
    const p2ScreenY = canvasBox!.y + points.p2!.y;

    // First click: commits point 1 (0, 0)
    await page.mouse.click(p1ScreenX, p1ScreenY);
    await expect(host).toHaveAttribute("data-cad-distance-phase", "awaiting-second");

    // Status updates for point 2
    await expect(status).toContainText("2. noktayı seçin");

    // Hover near second point shows rubber band
    await page.mouse.move(p2ScreenX - 5, p2ScreenY - 5);
    await page.mouse.move(p2ScreenX, p2ScreenY, { steps: 5 });
    const rubberBand = page.locator('[data-cad-distance-rubber-band="true"]').first();
    await expect(rubberBand).toBeVisible({ timeout: 15_000 });

    // Second click: commits point 2 (3000, 4000) and completes measurement
    await page.mouse.click(p2ScreenX, p2ScreenY);


    // Completed measurement overlay appears
    const completedOverlay = page.locator('[data-cad-distance-complete="true"]').first();
    await expect(completedOverlay).toBeVisible({ timeout: 5000 });

    // The text on the completed overlay must show 5.000 or 5000 (3-4-5 triangle hypotenuse!)
    const labelText = await completedOverlay.locator("text").textContent();
    expect(labelText).toMatch(/5[.,]?000/);

    // Active tool returns to none or pan
    await expect(host).toHaveAttribute("data-cad-active-tool", "none");

    // 3. Test Clear button: clears overlay while keeping drawing intact
    const clearBtn = page.locator('[data-testid="cad-tool-clear"]').first();
    await clearBtn.click();
    await expect(page.locator('[data-cad-distance-complete="true"]')).toHaveCount(0);
    await expect(canvas).toBeVisible();
    await expect(host).toHaveAttribute("data-cad-upstream-state", "ready");
  });

  test("Escape ve buton tekrarı aktif ölçümü temiz biçimde iptal eder", async ({ page }) => {
    await signInAdmin(page);
    const { fileId } = await uploadCadPreviewV2Fixture(page, "known-geometry-measurements");

    await page.goto(`/dokumantasyon/dosya/${fileId}`);
    const host = page.locator('[data-cad-upstream-host="true"]').first();
    await expect(host).toHaveAttribute("data-cad-upstream-state", "ready", { timeout: 30_000 });

    const distBtn = page.locator('[data-testid="cad-tool-distance"]').first();

    // 1. Activate distance tool
    await distBtn.click();
    await expect(host).toHaveAttribute("data-cad-active-tool", "distance");

    // 2. Click once on canvas
    const canvas = host.locator("canvas").first();
    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();
    await page.mouse.click(box!.x + 100, box!.y + 100);

    // 3. Press Escape -> cancelled cleanly
    await page.keyboard.press("Escape");
    await expect(host).toHaveAttribute("data-cad-active-tool", "none");
    await expect(page.locator('[data-testid="cad-distance-status"]')).toHaveCount(0);

    // 4. Activate again and toggle button off
    await distBtn.click();
    await expect(host).toHaveAttribute("data-cad-active-tool", "distance");
    await distBtn.click();
    await expect(host).toHaveAttribute("data-cad-active-tool", "none");
  });

  test("Mobil: Kısa tap doğrudan nokta koyar, iki tap ile ölçüm tamamlanır", async ({ page }) => {
    await signInAdmin(page);
    const { fileId } = await uploadCadPreviewV2Fixture(page, "known-geometry-measurements");

    await page.goto(`/dokumantasyon/dosya/${fileId}`);
    const host = page.locator('[data-cad-upstream-host="true"]').first();
    await expect(host).toHaveAttribute("data-cad-upstream-state", "ready", { timeout: 30_000 });

    const canvas = host.locator("canvas").first();
    const canvasBox = await canvas.boundingBox();
    expect(canvasBox).not.toBeNull();

    // Start distance tool
    await page.locator('[data-testid="cad-tool-distance"]').first().click();
    await expect(host).toHaveAttribute("data-cad-active-tool", "distance");

    const viewport = host.locator('div[aria-label$="CAD görünümü"]').first();

    // Short tap 1 (< 100ms)
    await viewport.dispatchEvent("pointerdown", {
      bubbles: true,
      cancelable: true,
      clientX: canvasBox!.x + 100,
      clientY: canvasBox!.y + 100,
      pointerId: 61,
      pointerType: "touch",
      isPrimary: true,
    });
    await page.waitForTimeout(50);
    await viewport.dispatchEvent("pointerup", {
      bubbles: true,
      cancelable: true,
      clientX: canvasBox!.x + 100,
      clientY: canvasBox!.y + 100,
      pointerId: 61,
      pointerType: "touch",
      isPrimary: true,
    });

    await expect(host).toHaveAttribute("data-cad-distance-phase", "awaiting-second");

    // Short tap 2
    await viewport.dispatchEvent("pointerdown", {
      bubbles: true,
      cancelable: true,
      clientX: canvasBox!.x + 200,
      clientY: canvasBox!.y + 200,
      pointerId: 62,
      pointerType: "touch",
      isPrimary: true,
    });
    await page.waitForTimeout(50);
    await viewport.dispatchEvent("pointerup", {
      bubbles: true,
      cancelable: true,
      clientX: canvasBox!.x + 200,
      clientY: canvasBox!.y + 200,
      pointerId: 62,
      pointerType: "touch",
      isPrimary: true,
    });

    // Completed measurement appears
    await expect(page.locator('[data-cad-distance-complete="true"]')).toHaveCount(1);
    await expect(host).toHaveAttribute("data-cad-active-tool", "none");
  });
});
