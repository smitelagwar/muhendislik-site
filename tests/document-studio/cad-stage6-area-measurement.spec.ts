import { test, expect } from "@playwright/test";
import {
  signInAdmin,
  uploadCadPreviewV2Fixture,
  cleanupUploadedCadFixtures,
} from "./cad-test-helpers";

test.describe("CAD Preview V2 — Stage 6/8 Alan Ölçümü: Türkçe Komut Akışı & Gerçek Sayısal Oracle", () => {
  test.beforeEach(async ({ context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  });

  test.afterEach(async ({ page }) => {
    await cleanupUploadedCadFixtures(page);
  });

  test("Desktop: Dört nokta seçimi + Enter ile alan ölçümü tamamlanır, 12.000.000 oracle'ı UI overlay'inde doğrulanır", async ({
    page,
    isMobile,
  }) => {
    test.skip(Boolean(isMobile), "Masaüstü fare ve klavye testi yalnızca masaüstü tarayıcılarda çalışır");
    await signInAdmin(page);
    const { fileId } = await uploadCadPreviewV2Fixture(page, "known-geometry-measurements");

    await page.goto(`/dokumantasyon/dosya/${fileId}`);
    const host = page.locator('[data-cad-upstream-host="true"]').first();
    await expect(host).toHaveAttribute("data-cad-upstream-state", "ready", { timeout: 30_000 });

    const canvas = host.locator("canvas").first();
    await expect(canvas).toBeVisible();

    // 1. Activate Area Tool via Quick Rail
    const areaBtn = page.locator('[data-testid="cad-tool-area"]').first();
    await expect(areaBtn).toBeVisible();
    await areaBtn.click();

    await expect(host).toHaveAttribute("data-cad-active-tool", "area");
    await expect(host).toHaveAttribute("data-cad-area-phase", "awaiting-first");

    // Status shows 1st point prompt in Turkish
    const status = page.locator('[data-testid="cad-area-status"]').first();
    await expect(status).toBeVisible();
    await expect(status).toContainText("1. noktayı seçin");

    // 2. Resolve known rectangle (0,0) -> (3000,0) -> (3000,4000) -> (0,4000)
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
      const p2 = adapter?.projectWorldPoint?.({ x: 3000, y: 0 }) ?? null;
      const p3 = adapter?.projectWorldPoint?.({ x: 3000, y: 4000 }) ?? null;
      const p4 = adapter?.projectWorldPoint?.({ x: 0, y: 4000 }) ?? null;
      return { p1, p2, p3, p4 };
    });

    expect(points.p1).not.toBeNull();
    expect(points.p2).not.toBeNull();
    expect(points.p3).not.toBeNull();
    expect(points.p4).not.toBeNull();

    const canvasBox = await canvas.boundingBox();
    expect(canvasBox).not.toBeNull();

    const p1Screen = { x: canvasBox!.x + points.p1!.x, y: canvasBox!.y + points.p1!.y };
    const p2Screen = { x: canvasBox!.x + points.p2!.x, y: canvasBox!.y + points.p2!.y };
    const p3Screen = { x: canvasBox!.x + points.p3!.x, y: canvasBox!.y + points.p3!.y };
    const p4Screen = { x: canvasBox!.x + points.p4!.x, y: canvasBox!.y + points.p4!.y };

    const clickPoint = async (x: number, y: number) => {
      await page.mouse.move(x, y);
      await page.waitForTimeout(50);
      await page.mouse.click(x, y);
    };

    // Point 1 click
    await clickPoint(p1Screen.x, p1Screen.y);
    await expect(host).toHaveAttribute("data-cad-area-phase", "awaiting-next");
    await expect(status).toContainText("2. noktayı seçin");
    await expect(page.locator('[data-cad-area-vertex="0"]').first()).toBeVisible();

    // Point 2 click
    await clickPoint(p2Screen.x, p2Screen.y);
    await expect(page.locator('[data-cad-area-vertex="1"]').first()).toBeVisible();

    // Move to point 3: rubber-band and live preview fill appear
    await page.mouse.move(p3Screen.x, p3Screen.y);
    await expect(page.locator('[data-cad-area-rubber-band="true"]').first()).toBeAttached();
    await expect(page.locator('[data-cad-area-preview="true"]').first()).toBeAttached();

    // Point 3 click
    await clickPoint(p3Screen.x, p3Screen.y);
    await expect(page.locator('[data-cad-area-vertex="2"]').first()).toBeVisible();
    // Finish button appears in status banner
    await expect(page.locator('[data-testid="cad-area-finish-btn"]').first()).toBeVisible();

    // Point 4 click
    await clickPoint(p4Screen.x, p4Screen.y);
    await expect(page.locator('[data-cad-area-vertex="3"]').first()).toBeVisible();

    // Press Enter to complete measurement
    await page.keyboard.press("Enter");

    // Tool resets to none
    await expect(host).toHaveAttribute("data-cad-active-tool", "none");
    await expect(host).toHaveAttribute("data-cad-area-phase", "inactive");

    // Completed overlay appears with polygon and centroid badge
    const completedOverlay = page.locator('[data-cad-area-complete="true"]').first();
    await expect(completedOverlay).toBeVisible({ timeout: 5000 });
    await expect(completedOverlay.locator('[data-cad-area-polygon="true"]').first()).toBeVisible();

    // UI text must match 12.000.000 and drawing units
    const labelText = await completedOverlay.locator("text").textContent();
    expect(labelText).toMatch(/12[.,]?000[.,]?000/);
    expect(labelText).toContain("çizim birimi²");

    // Clear button clears measurements
    const clearBtn = page.locator('[data-testid="cad-tool-clear"]').first();
    await clearBtn.click();
    await expect(completedOverlay).not.toBeVisible();
  });

  test("Escape, Backspace ve buton toggle ile alan ölçümü temiz biçimde yönetilir", async ({
    page,
  }) => {
    await signInAdmin(page);
    const { fileId } = await uploadCadPreviewV2Fixture(page, "known-geometry-measurements");

    await page.goto(`/dokumantasyon/dosya/${fileId}`);
    const host = page.locator('[data-cad-upstream-host="true"]').first();
    await expect(host).toHaveAttribute("data-cad-upstream-state", "ready", { timeout: 30_000 });

    const canvas = host.locator("canvas").first();
    const canvasBox = await canvas.boundingBox();
    expect(canvasBox).not.toBeNull();

    // 1. Activate Area Tool via shortcut 'A'
    await page.keyboard.press("a");
    await expect(host).toHaveAttribute("data-cad-active-tool", "area");
    await expect(host).toHaveAttribute("data-cad-area-phase", "awaiting-first");

    // Place point 1
    await page.mouse.click(canvasBox!.x + 100, canvasBox!.y + 100);
    await expect(host).toHaveAttribute("data-cad-area-phase", "awaiting-next");
    await expect(page.locator('[data-cad-area-vertex="0"]').first()).toBeVisible();

    // Place point 2
    await page.mouse.click(canvasBox!.x + 200, canvasBox!.y + 100);
    await expect(page.locator('[data-cad-area-vertex="1"]').first()).toBeVisible();

    // Backspace: removes point 2
    await page.keyboard.press("Backspace");
    await expect(page.locator('[data-cad-area-vertex="1"]')).not.toBeVisible();
    await expect(page.locator('[data-cad-area-vertex="0"]').first()).toBeVisible();

    // Escape: cleanly cancels measurement
    await page.keyboard.press("Escape");
    await expect(host).toHaveAttribute("data-cad-active-tool", "none");
    await expect(host).toHaveAttribute("data-cad-area-phase", "inactive");
    await expect(page.locator('[data-cad-area-vertex="0"]')).not.toBeVisible();
    await expect(page.locator('[data-cad-area-active="true"]')).not.toBeVisible();
    await expect(page.locator('[data-cad-area-complete="true"]')).not.toBeVisible();

    // Re-activate and toggle off with tool button
    const areaBtn = page.locator('[data-testid="cad-tool-area"]').first();
    await areaBtn.click();
    await expect(host).toHaveAttribute("data-cad-active-tool", "area");

    await areaBtn.click();
    await expect(host).toHaveAttribute("data-cad-active-tool", "none");
    await expect(host).toHaveAttribute("data-cad-area-phase", "inactive");
  });

  test("Mobil: Dokunmatik seçim ve 'Bitir' butonu ile alan ölçümü tamamlanır", async ({
    page,
  }) => {
    await signInAdmin(page);
    const { fileId } = await uploadCadPreviewV2Fixture(page, "known-geometry-measurements");

    await page.goto(`/dokumantasyon/dosya/${fileId}`);
    const host = page.locator('[data-cad-upstream-host="true"]').first();
    await expect(host).toHaveAttribute("data-cad-upstream-state", "ready", { timeout: 30_000 });

    const canvas = host.locator("canvas").first();
    const canvasBox = await canvas.boundingBox();
    expect(canvasBox).not.toBeNull();

    // Activate Area Tool
    const areaBtn = page.locator('[data-testid="cad-tool-area"]').first();
    await areaBtn.click();
    await expect(host).toHaveAttribute("data-cad-active-tool", "area");

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
      const p2 = adapter?.projectWorldPoint?.({ x: 3000, y: 0 }) ?? null;
      const p3 = adapter?.projectWorldPoint?.({ x: 3000, y: 4000 }) ?? null;
      const p4 = adapter?.projectWorldPoint?.({ x: 0, y: 4000 }) ?? null;
      return { p1, p2, p3, p4 };
    });

    const p1Screen = { x: canvasBox!.x + points.p1!.x, y: canvasBox!.y + points.p1!.y };
    const p2Screen = { x: canvasBox!.x + points.p2!.x, y: canvasBox!.y + points.p2!.y };
    const p3Screen = { x: canvasBox!.x + points.p3!.x, y: canvasBox!.y + points.p3!.y };
    const p4Screen = { x: canvasBox!.x + points.p4!.x, y: canvasBox!.y + points.p4!.y };

    const viewport = host.locator('div[aria-label$="CAD görünümü"]').first();
    const tapPoint = async (x: number, y: number) => {
      await viewport.dispatchEvent("pointerdown", {
        bubbles: true,
        cancelable: true,
        clientX: x,
        clientY: y,
        pointerId: 77,
        pointerType: "touch",
        isPrimary: true,
      });
      await page.waitForTimeout(40);
      await viewport.dispatchEvent("pointerup", {
        bubbles: true,
        cancelable: true,
        clientX: x,
        clientY: y,
        pointerId: 77,
        pointerType: "touch",
        isPrimary: true,
      });
    };

    // Tap the 4 vertices
    await tapPoint(p1Screen.x, p1Screen.y);
    await expect(host).toHaveAttribute("data-cad-area-phase", "awaiting-next");

    await tapPoint(p2Screen.x, p2Screen.y);
    await tapPoint(p3Screen.x, p3Screen.y);
    await tapPoint(p4Screen.x, p4Screen.y);

    // Tap "Bitir" button in the status banner
    const finishBtn = page.locator('[data-testid="cad-area-finish-btn"]').first();
    await expect(finishBtn).toBeVisible();
    await finishBtn.click();

    // Completed overlay appears and tool resets to none
    await expect(host).toHaveAttribute("data-cad-active-tool", "none");
    const completedOverlay = page.locator('[data-cad-area-complete="true"]').first();
    await expect(completedOverlay).toBeVisible();

    const labelText = await completedOverlay.locator("text").textContent();
    expect(labelText).toMatch(/12[.,]?000[.,]?000/);
    expect(labelText).toContain("çizim birimi²");
  });
});
