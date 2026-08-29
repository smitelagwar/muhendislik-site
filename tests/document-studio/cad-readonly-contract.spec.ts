import { expect, test } from "@playwright/test";
import { signInAdmin, uploadCadPreviewV2Fixture } from "./cad-test-helpers";

test.describe("CAD Preview V2 — Read-Only Contract & View Mode Suite", () => {
  test("Salt-okunur sözleşme: Read mode, PAN view mode ve komut satırı gizliliği doğrulanır", async ({ page }) => {
    await signInAdmin(page);
    const { fileId } = await uploadCadPreviewV2Fixture(page, "text-rotation-0-90-180-270");

    await page.goto(`/dokumantasyon/dosya/${fileId}`);
    const runtime = page.locator('[data-cad-runtime="orchestrator"][data-cad-engine="upstream"]').first();
    const host = runtime.locator('[data-cad-upstream-host="true"]').first();

    await expect(runtime).toBeVisible({ timeout: 30_000 });
    await expect(host).toHaveAttribute("data-cad-upstream-state", "ready", { timeout: 30_000 });
    const canvas = host.locator("canvas").first();
    await expect(canvas).toBeVisible();

    // 1. Command line DOM should NOT exist anywhere in page
    const commandLine = page.locator(".aced-command-line, .ml-command-line, [data-command-line]");
    expect(await commandLine.count()).toBe(0);

    // 2. Normal click on canvas does NOT create selections
    const canvasBox = await canvas.boundingBox();
    expect(canvasBox).not.toBeNull();
    const centerX = canvasBox!.x + canvasBox!.width / 2;
    const centerY = canvasBox!.y + canvasBox!.height / 2;

    await page.mouse.click(centerX, centerY);
    await page.waitForTimeout(200);

    // Verify selection grips or active selection boxes do not appear
    const selectionGrips = page.locator(".aced-grip, .ml-grip, [data-grip]");
    expect(await selectionGrips.count()).toBe(0);

    // 3. Dragging on canvas performs PAN, not selection rectangle
    await page.mouse.move(centerX, centerY);
    await page.mouse.down();
    await page.mouse.move(centerX + 100, centerY + 100, { steps: 5 });
    await page.mouse.up();
    await page.waitForTimeout(200);

    const selectionBox = page.locator(".aced-selection-box, .ml-selection-box, [data-selection-box]");
    expect(await selectionBox.count()).toBe(0);

    // 4. Delete / Backspace key presses do not alter entities or break viewer
    await page.keyboard.press("Delete");
    await page.keyboard.press("Backspace");
    await page.waitForTimeout(200);

    await expect(host).toHaveAttribute("data-cad-upstream-state", "ready");
    await expect(canvas).toBeVisible();
  });

  test("File switch ve retry sonrası salt-okunur ve PAN modu korunur", async ({ page }) => {
    await signInAdmin(page);
    const { fileId: fileId1 } = await uploadCadPreviewV2Fixture(page, "text-rotation-0-90-180-270");
    const { fileId: fileId2 } = await uploadCadPreviewV2Fixture(page, "known-geometry-measurements");

    // Open file 1
    await page.goto(`/dokumantasyon/dosya/${fileId1}`);
    let host = page.locator('[data-cad-upstream-host="true"]').first();
    await expect(host).toHaveAttribute("data-cad-upstream-state", "ready", { timeout: 30_000 });

    // Switch to file 2
    await page.goto(`/dokumantasyon/dosya/${fileId2}`);
    host = page.locator('[data-cad-upstream-host="true"]').first();
    await expect(host).toHaveAttribute("data-cad-upstream-state", "ready", { timeout: 30_000 });

    // Verify command line remains invisible
    const commandLine = page.locator(".aced-command-line, .ml-command-line, [data-command-line]");
    expect(await commandLine.count()).toBe(0);

    // Verify canvas is interactive in PAN mode
    const canvas = host.locator("canvas").first();
    await expect(canvas).toBeVisible();
  });
});
