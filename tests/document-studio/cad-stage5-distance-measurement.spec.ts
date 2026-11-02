import { expect, test } from "@playwright/test";
import {
  signInAdmin,
  uploadCadPreviewV2Fixture,
  cleanupUploadedCadFixtures,
} from "./cad-test-helpers";

test.describe("CAD V1 — Mesafe: Stage 04 single review item, source units and gesture regression", () => {
  test.afterEach(async ({ page }) => {
    await cleanupUploadedCadFixtures(page);
  });

  test("Desktop: raw 5000-mm mesafe tek review item olarak 5,00 m etiketlenir, undo/redo/F5/clear tutarlı", async ({
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
      const adapter = (window as unknown as {
        __cadAdapter?: {
          projectWorldPoint: (p: { x: number; y: number }) => { x: number; y: number } | null;
        };
      }).__cadAdapter;
      return {
        p1: adapter?.projectWorldPoint?.({ x: 0, y: 0 }) ?? null,
        p2: adapter?.projectWorldPoint?.({ x: 3000, y: 4000 }) ?? null,
      };
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

    // Fixture INSUNITS=4 (mm). World length 5000 must display as 5,00 m.
    // Do not weaken the oracle to allow a wrong "5000 m" display.
    const labelText = await completedOverlay.locator("text").textContent();
    expect(labelText).toContain("5,00 m");
    await expect(page.locator('[data-cad-distance-complete="true"]')).toHaveCount(1);
    await expect(page.locator('[data-review-type="distance"]')).toHaveCount(0); // no double renderer

    const saved = await page.evaluate((id) => {
      const raw = window.localStorage.getItem(`dok_cad_review_v1_${id}`);
      return raw ? JSON.parse(raw) : null;
    }, fileId) as { items?: Array<{ type: string; measuredLength?: number; measurementContext?: { sourceUnit: string } }> } | null;
    const stored = saved?.items?.filter((item) => item.type === "distance") ?? [];
    expect(stored).toHaveLength(1);
    expect(stored[0]?.measuredLength).toBe(5000); // raw world unchanged
    expect(stored[0]?.measurementContext?.sourceUnit).toBe("mm");

    await expect(host).toHaveAttribute("data-cad-active-tool", "none");
    const undo = page.locator('[data-testid="cad-tool-undo"]').first();
    const redo = page.locator('[data-testid="cad-tool-redo"]').first();
    await undo.click();
    await expect(page.locator('[data-cad-distance-complete="true"]')).toHaveCount(0);
    await redo.click();
    await expect(page.locator('[data-cad-distance-complete="true"]')).toHaveCount(1);

    // Browser local recovery; real remote-server persistence is a separate gate.
    await page.reload();
    const reloadedHost = page.locator('[data-cad-upstream-host="true"]').first();
    await expect(reloadedHost).toHaveAttribute("data-cad-upstream-state", "ready", { timeout: 30_000 });
    await expect(page.locator('[data-cad-distance-complete="true"]')).toHaveCount(1);

    // One clear command removes completed measurement and remains undoable.
    const clearBtn = page.locator('[data-testid="cad-tool-clear"]').first();
    await clearBtn.click();
    await expect(page.locator('[data-cad-distance-complete="true"]')).toHaveCount(0);
    await expect(reloadedHost.locator("canvas").first()).toBeVisible();
    await expect(reloadedHost).toHaveAttribute("data-cad-upstream-state", "ready");
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
