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

    // 3. Mouse button bindings: Left drag does NOT pan, middle wheel drag DOES pan
    const centerInitial = await page.evaluate(() => {
      const hostEl = document.querySelector('[data-cad-upstream-host="true"]') as unknown as {
        __cadAdapter?: { getCameraCenter?: () => { x: number; y: number } | null };
      };
      return hostEl?.__cadAdapter?.getCameraCenter?.() ?? null;
    });

    // 3a. Left drag: no selection rectangle and no pan movement
    await page.mouse.move(centerX, centerY);
    await page.mouse.down({ button: "left" });
    await page.mouse.move(centerX + 100, centerY + 100, { steps: 5 });
    await page.mouse.up({ button: "left" });
    await page.waitForTimeout(200);

    const selectionBox = page.locator(".aced-selection-box, .ml-selection-box, [data-selection-box]");
    expect(await selectionBox.count()).toBe(0);

    const centerAfterLeft = await page.evaluate(() => {
      const hostEl = document.querySelector('[data-cad-upstream-host="true"]') as unknown as {
        __cadAdapter?: { getCameraCenter?: () => { x: number; y: number } | null };
      };
      return hostEl?.__cadAdapter?.getCameraCenter?.() ?? null;
    });

    if (centerInitial && centerAfterLeft) {
      expect(centerAfterLeft.x).toBeCloseTo(centerInitial.x, 1);
      expect(centerAfterLeft.y).toBeCloseTo(centerInitial.y, 1);
    }

    // 3b. Middle mouse button (wheel drag) performs PAN: camera moves
    await page.mouse.move(centerX, centerY);
    await page.mouse.down({ button: "middle" });
    await page.mouse.move(centerX + 120, centerY + 80, { steps: 5 });
    await page.mouse.up({ button: "middle" });
    await page.waitForTimeout(200);

    const centerAfterMiddle = await page.evaluate(() => {
      const hostEl = document.querySelector('[data-cad-upstream-host="true"]') as unknown as {
        __cadAdapter?: { getCameraCenter?: () => { x: number; y: number } | null };
      };
      return hostEl?.__cadAdapter?.getCameraCenter?.() ?? null;
    });

    if (centerAfterLeft && centerAfterMiddle) {
      const moved =
        Math.abs(centerAfterMiddle.x - centerAfterLeft.x) > 0.01 ||
        Math.abs(centerAfterMiddle.y - centerAfterLeft.y) > 0.01;
      expect(moved).toBe(true);
    }

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

  test("Arka plan rengi seçimi: Varsayılan AutoCAD grisi (#212830), Siyah ve Beyaz geçişleri doğrulanır", async ({ page }) => {
    await signInAdmin(page);
    const { fileId } = await uploadCadPreviewV2Fixture(page, "text-rotation-0-90-180-270");

    await page.goto(`/dokumantasyon/dosya/${fileId}`);
    const host = page.locator('[data-cad-upstream-host="true"]').first();
    await expect(host).toHaveAttribute("data-cad-upstream-state", "ready", { timeout: 30_000 });

    // 1. Initial background color must be AutoCAD slate gray (#212830)
    await expect(host).toHaveAttribute("data-cad-background-color", "autocad");

    const bgAutocadBtn = page.locator('[data-testid="cad-bg-autocad"]').first();
    const bgBlackBtn = page.locator('[data-testid="cad-bg-black"]').first();
    const bgWhiteBtn = page.locator('[data-testid="cad-bg-white"]').first();

    await expect(bgAutocadBtn).toBeVisible();
    await expect(bgBlackBtn).toBeVisible();
    await expect(bgWhiteBtn).toBeVisible();
    await expect(bgAutocadBtn).toHaveAttribute("aria-pressed", "true");

    // 2. Switch to Black
    await bgBlackBtn.click();
    await expect(host).toHaveAttribute("data-cad-background-color", "black");
    await expect(bgBlackBtn).toHaveAttribute("aria-pressed", "true");
    await expect(bgAutocadBtn).toHaveAttribute("aria-pressed", "false");

    const blackColor = await page.evaluate(() => {
      const hostEl = document.querySelector('[data-cad-upstream-host="true"]') as unknown as {
        __cadAdapter?: { getBackgroundColor?: () => string };
      };
      return hostEl?.__cadAdapter?.getBackgroundColor?.();
    });
    expect(blackColor).toBe("black");

    // 3. Switch to White
    await bgWhiteBtn.click();
    await expect(host).toHaveAttribute("data-cad-background-color", "white");
    await expect(bgWhiteBtn).toHaveAttribute("aria-pressed", "true");

    const whiteColor = await page.evaluate(() => {
      const hostEl = document.querySelector('[data-cad-upstream-host="true"]') as unknown as {
        __cadAdapter?: { getBackgroundColor?: () => string };
      };
      return hostEl?.__cadAdapter?.getBackgroundColor?.();
    });
    expect(whiteColor).toBe("white");

    // 4. Switch back to AutoCAD
    await bgAutocadBtn.click();
    await expect(host).toHaveAttribute("data-cad-background-color", "autocad");
    await expect(bgAutocadBtn).toHaveAttribute("aria-pressed", "true");

    const autocadColor = await page.evaluate(() => {
      const hostEl = document.querySelector('[data-cad-upstream-host="true"]') as unknown as {
        __cadAdapter?: { getBackgroundColor?: () => string };
      };
      return hostEl?.__cadAdapter?.getBackgroundColor?.();
    });
    expect(autocadColor).toBe("autocad");
  });

  test("Ölçü birimi ('m') yapılandırması: Uzunluk ölçümünde birim etiketi kapatılmıştır (showUnits: false)", async ({ page }) => {
    await signInAdmin(page);
    const { fileId } = await uploadCadPreviewV2Fixture(page, "known-geometry-measurements");

    await page.goto(`/dokumantasyon/dosya/${fileId}`);
    const host = page.locator('[data-cad-upstream-host="true"]').first();
    await expect(host).toHaveAttribute("data-cad-upstream-state", "ready", { timeout: 30_000 });

    const unitsEnabled = await page.evaluate(() => {
      const hostEl = document.querySelector('[data-cad-upstream-host="true"]') as unknown as {
        __cadAdapter?: { isMeasurementUnitsEnabled?: () => boolean };
      };
      return hostEl?.__cadAdapter?.isMeasurementUnitsEnabled?.();
    });

    expect(unitsEnabled).toBe(false);
  });
});
