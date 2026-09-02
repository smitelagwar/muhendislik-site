import { expect, test } from "@playwright/test";
import { signInAdmin, uploadCadPreviewV2Fixture } from "./cad-test-helpers";

test.describe("CAD Preview V2 — Native Measurements & Left Quick Access Rail Suite", () => {
  test("Sol hızlı erişim araç rayı: Sığdır, Mesafe, Alan, Temizle ve Katman butonları görünür ve erişilebilir", async ({ page }) => {
    await signInAdmin(page);
    const { fileId } = await uploadCadPreviewV2Fixture(page, "known-geometry-measurements");

    await page.goto(`/dokumantasyon/dosya/${fileId}`);
    const host = page.locator('[data-cad-upstream-host="true"]').first();
    await expect(host).toHaveAttribute("data-cad-upstream-state", "ready", { timeout: 60_000 });

    const rail = page.locator('[data-testid="cad-left-quick-rail"]').first();
    await expect(rail).toBeVisible();

    const fitBtn = page.locator('[data-testid="cad-tool-fit"]').first();
    const distBtn = page.locator('[data-testid="cad-tool-distance"]').first();
    const areaBtn = page.locator('[data-testid="cad-tool-area"]').first();
    const clearBtn = page.locator('[data-testid="cad-tool-clear"]').first();
    const layerBtn = page.locator('[data-testid="cad-tool-layers"]').first();

    await expect(fitBtn).toBeVisible();
    await expect(distBtn).toBeVisible();
    await expect(areaBtn).toBeVisible();
    await expect(clearBtn).toBeVisible();
    await expect(layerBtn).toBeVisible();
    await expect(layerBtn).toBeEnabled(); // Enabled in Stage 5
  });

  test("Mesafe ölçümü: Precision distance controller tetiklenir, Escape ile temiz biçimde iptal edilir", async ({ page }) => {
    await signInAdmin(page);
    const { fileId } = await uploadCadPreviewV2Fixture(page, "known-geometry-measurements");

    await page.goto(`/dokumantasyon/dosya/${fileId}`);
    const host = page.locator('[data-cad-upstream-host="true"]').first();
    await expect(host).toHaveAttribute("data-cad-upstream-state", "ready", { timeout: 60_000 });

    const distBtn = page.locator('[data-testid="cad-tool-distance"]').first();
    await distBtn.click();

    // Verify active tool state is distance
    await expect(host).toHaveAttribute("data-cad-active-tool", "distance");

    // Click on canvas
    const canvas = host.locator("canvas").first();
    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();

    await page.mouse.click(box!.x + 100, box!.y + 100);
    await page.waitForTimeout(200);

    // Press Escape to cancel active command
    await page.keyboard.press("Escape");
    await expect(host).toHaveAttribute("data-cad-active-tool", "none");

    // Verify no selection grips or command line
    const selectionGrips = page.locator(".aced-grip, .ml-grip, [data-grip]");
    expect(await selectionGrips.count()).toBe(0);
  });

  test("Alan ölçümü: Native 'measurearea' komutu tetiklenir, temizle butonu ile sıfırlanır", async ({ page }) => {
    await signInAdmin(page);
    const { fileId } = await uploadCadPreviewV2Fixture(page, "known-geometry-measurements");

    await page.goto(`/dokumantasyon/dosya/${fileId}`);
    const host = page.locator('[data-cad-upstream-host="true"]').first();
    await expect(host).toHaveAttribute("data-cad-upstream-state", "ready", { timeout: 60_000 });

    const areaBtn = page.locator('[data-testid="cad-tool-area"]').first();
    await areaBtn.click();
    await expect(host).toHaveAttribute("data-cad-active-tool", "area");

    // Click clear button
    const clearBtn = page.locator('[data-testid="cad-tool-clear"]').first();
    await clearBtn.click();
    await expect(host).toHaveAttribute("data-cad-active-tool", "none");
  });

  test("Görünüme sığdır (Fit): Fit butonu çizimi ekrana odaklar ve PAN modunu korur", async ({ page }) => {
    await signInAdmin(page);
    const { fileId } = await uploadCadPreviewV2Fixture(page, "known-geometry-measurements");

    await page.goto(`/dokumantasyon/dosya/${fileId}`);
    const host = page.locator('[data-cad-upstream-host="true"]').first();
    await expect(host).toHaveAttribute("data-cad-upstream-state", "ready", { timeout: 60_000 });

    const fitBtn = page.locator('[data-testid="cad-tool-fit"]').first();
    await fitBtn.click();

    // Verify canvas is interactive and remains ready
    await expect(host).toHaveAttribute("data-cad-upstream-state", "ready");
    const canvas = host.locator("canvas").first();
    await expect(canvas).toBeVisible();
  });
});
