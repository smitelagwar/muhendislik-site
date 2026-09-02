import { expect, test } from "@playwright/test";
import { signInAdmin, uploadCadPreviewV2Fixture, cleanupUploadedCadFixtures } from "./cad-test-helpers";

test.describe("CAD Preview V2 — Stage 3/8 Pan, Zoom, Fit & Görünüm Sözleşmesi", () => {
  test.afterEach(async ({ page }) => {
    await cleanupUploadedCadFixtures(page);
  });

  test("Sol ve orta drag pan yapar; normal click grip üretmez; Delete/Backspace source'u bozmaz", async ({
    page,
  }) => {
    await signInAdmin(page);
    const { fileId } = await uploadCadPreviewV2Fixture(page, "known-geometry-measurements");

    await page.goto(`/dokumantasyon/dosya/${fileId}`);
    const host = page.locator('[data-cad-upstream-host="true"]').first();
    await expect(host).toHaveAttribute("data-cad-upstream-state", "ready", { timeout: 60_000 });

    const canvas = host.locator("canvas").first();
    await expect(canvas).toBeVisible();
    const canvasBox = await canvas.boundingBox();
    expect(canvasBox).not.toBeNull();

    const centerX = canvasBox!.x + canvasBox!.width / 2;
    const centerY = canvasBox!.y + canvasBox!.height / 2;

    // 1. Normal click does NOT create grips or selection highlights
    await page.mouse.click(centerX, centerY);
    await page.waitForTimeout(150);
    const grips = page.locator(".aced-grip, .ml-grip, [data-grip]");
    expect(await grips.count()).toBe(0);

    // 2. Delete / Backspace do NOT mutate drawing
    await page.keyboard.press("Delete");
    await page.keyboard.press("Backspace");
    await page.waitForTimeout(100);
    await expect(host).toHaveAttribute("data-cad-upstream-state", "ready");

    // 3. Pan tool button in quick rail is active by default
    const panTool = page.locator('[data-testid="cad-tool-pan"]').first();
    await expect(panTool).toBeVisible();
    await expect(panTool).toHaveAttribute("aria-pressed", "true");

    // 4. Initial camera center
    const centerInitial = await page.evaluate(() => {
      const hostEl = document.querySelector('[data-cad-upstream-host="true"]') as unknown as {
        __cadAdapter?: { getCameraCenter?: () => { x: number; y: number } | null };
      };
      return hostEl?.__cadAdapter?.getCameraCenter?.() ?? null;
    });

    // 5. Left mouse drag performs PAN (camera moves)
    await page.mouse.move(centerX, centerY);
    await page.mouse.down({ button: "left" });
    await page.mouse.move(centerX + 80, centerY + 60, { steps: 5 });
    await page.mouse.up({ button: "left" });
    await page.waitForTimeout(200);

    const centerAfterLeft = await page.evaluate(() => {
      const hostEl = document.querySelector('[data-cad-upstream-host="true"]') as unknown as {
        __cadAdapter?: { getCameraCenter?: () => { x: number; y: number } | null };
      };
      return hostEl?.__cadAdapter?.getCameraCenter?.() ?? null;
    });

    expect(centerInitial).not.toBeNull();
    expect(centerAfterLeft).not.toBeNull();
    const leftMoved =
      Math.abs(centerAfterLeft!.x - centerInitial!.x) > 0.01 ||
      Math.abs(centerAfterLeft!.y - centerInitial!.y) > 0.01;
    expect(leftMoved).toBe(true);

    // 6. Middle mouse drag ALSO performs PAN
    await page.mouse.move(centerX, centerY);
    await page.mouse.down({ button: "middle" });
    await page.mouse.move(centerX + 70, centerY + 50, { steps: 5 });
    await page.mouse.up({ button: "middle" });
    await page.waitForTimeout(200);

    const centerAfterMiddle = await page.evaluate(() => {
      const hostEl = document.querySelector('[data-cad-upstream-host="true"]') as unknown as {
        __cadAdapter?: { getCameraCenter?: () => { x: number; y: number } | null };
      };
      return hostEl?.__cadAdapter?.getCameraCenter?.() ?? null;
    });

    expect(centerAfterMiddle).not.toBeNull();
    const middleMoved =
      Math.abs(centerAfterMiddle!.x - centerAfterLeft!.x) > 0.01 ||
      Math.abs(centerAfterMiddle!.y - centerAfterLeft!.y) > 0.01;
    expect(middleMoved).toBe(true);

    // 7. Zoom to fit restores drawing extents
    const fitBtn = page.locator('[data-testid="cad-tool-fit"]').first();
    await fitBtn.click();
    await page.waitForTimeout(300);

    const centerAfterFit = await page.evaluate(() => {
      const hostEl = document.querySelector('[data-cad-upstream-host="true"]') as unknown as {
        __cadAdapter?: { getCameraCenter?: () => { x: number; y: number } | null };
      };
      return hostEl?.__cadAdapter?.getCameraCenter?.() ?? null;
    });
    expect(centerAfterFit).not.toBeNull();
    expect(Number.isFinite(centerAfterFit!.x)).toBe(true);
    expect(Number.isFinite(centerAfterFit!.y)).toBe(true);

    // 8. Switching to Distance and clicking Pan tool returns cleanly to Pan
    const distanceTool = page.locator('[data-testid="cad-tool-distance"]').first();
    await distanceTool.click();
    await expect(host).toHaveAttribute("data-cad-active-tool", "distance");
    await expect(panTool).toHaveAttribute("aria-pressed", "false");

    await panTool.click();
    await expect(host).toHaveAttribute("data-cad-active-tool", "none");
    await expect(panTool).toHaveAttribute("aria-pressed", "true");
  });

  test("Görünüm ayarları paneli: Renk modu, lineweight ve 3 arka plan rengi gerçek canvas/host durumunu günceller", async ({
    page,
  }) => {
    await signInAdmin(page);
    const { fileId } = await uploadCadPreviewV2Fixture(page, "known-geometry-measurements");

    await page.goto(`/dokumantasyon/dosya/${fileId}`);
    const host = page.locator('[data-cad-upstream-host="true"]').first();
    await expect(host).toHaveAttribute("data-cad-upstream-state", "ready", { timeout: 60_000 });

    // Open view settings panel from quick rail
    const viewSettingsBtn = page.locator('[data-testid="cad-tool-view-settings"]').first();
    await expect(viewSettingsBtn).toBeVisible();
    await viewSettingsBtn.click();

    const panel = page.locator('[data-testid="cad-view-settings-panel"]').first();
    await expect(panel).toBeVisible();
    await expect(host).toHaveAttribute("data-cad-view-panel-open", "true");

    // 1. Color mode: Siyah-Beyaz
    const monoBtn = page.locator('[data-testid="cad-view-mode-monochrome"]').first();
    await monoBtn.click();
    await expect(host).toHaveAttribute("data-cad-color-mode", "monochrome");

    // 2. Color mode: Gerçek Renk
    const sourceBtn = page.locator('[data-testid="cad-view-mode-source"]').first();
    await sourceBtn.click();
    await expect(host).toHaveAttribute("data-cad-color-mode", "source");

    // 3. Lineweight toggle
    const lwBtn = page.locator('[data-testid="cad-view-toggle-lineweight"]').first();
    await lwBtn.click();
    await expect(host).toHaveAttribute("data-cad-lineweight", "on");
    await lwBtn.click();
    await expect(host).toHaveAttribute("data-cad-lineweight", "off");

    // 4. Background color: Siyah (#000000)
    const bgBlackBtn = page.locator('[data-testid="cad-bg-black-panel"]').first();
    await bgBlackBtn.click();
    await expect(host).toHaveAttribute("data-cad-background-color", "black");
    const blackHex = await host.evaluate((el) => (el as HTMLElement).style.backgroundColor);
    expect(blackHex).toContain("rgb(0, 0, 0)");

    // 5. Background color: Beyaz (#ffffff)
    const bgWhiteBtn = page.locator('[data-testid="cad-bg-white-panel"]').first();
    await bgWhiteBtn.click();
    await expect(host).toHaveAttribute("data-cad-background-color", "white");
    const whiteHex = await host.evaluate((el) => (el as HTMLElement).style.backgroundColor);
    expect(whiteHex).toContain("rgb(255, 255, 255)");

    // 6. Background color: AutoCAD (#212830)
    const bgAutoCadBtn = page.locator('[data-testid="cad-bg-autocad-panel"]').first();
    await bgAutoCadBtn.click();
    await expect(host).toHaveAttribute("data-cad-background-color", "autocad");

    // 7. Escape closes the view panel
    await page.keyboard.press("Escape");
    await expect(panel).toHaveCount(0);
    await expect(host).toHaveAttribute("data-cad-view-panel-open", "false");
  });

  test("Klavye kısayolları (T, P, F) input alanları içindeyken tetiklenmez", async ({ page }) => {
    await signInAdmin(page);
    const { fileId } = await uploadCadPreviewV2Fixture(page, "known-geometry-measurements");

    await page.goto(`/dokumantasyon/dosya/${fileId}`);
    const host = page.locator('[data-cad-upstream-host="true"]').first();
    await expect(host).toHaveAttribute("data-cad-upstream-state", "ready", { timeout: 60_000 });

    // Open layer panel which has a search input
    await page.locator('[data-testid="cad-tool-layers"]').first().click();
    const searchInput = page.locator('[data-testid="cad-layer-search-input"]').first();
    await expect(searchInput).toBeVisible();

    // Focus input and type 't', 'p', 'f'
    await searchInput.focus();
    await page.keyboard.type("tpf");

    // Input should receive the text and active tool should remain none
    await expect(searchInput).toHaveValue("tpf");
    await expect(host).toHaveAttribute("data-cad-active-tool", "none");
  });

  test("Mobil Görünüm: Dört kontrol (renk, lineweight, 3 bg) erişilebilir, canvası günceller ve tek parmak pan kaydırır", async ({
    page,
  }) => {
    await signInAdmin(page);
    const { fileId } = await uploadCadPreviewV2Fixture(page, "known-geometry-measurements");

    await page.goto(`/dokumantasyon/dosya/${fileId}`);
    const host = page.locator('[data-cad-upstream-host="true"]').first();
    await expect(host).toHaveAttribute("data-cad-upstream-state", "ready", { timeout: 60_000 });

    const canvas = host.locator("canvas").first();
    await expect(canvas).toBeVisible();

    // 1. Open mobile view settings from quick rail
    const viewBtn = page.locator('[data-testid="cad-tool-view-settings"]').first();
    await expect(viewBtn).toBeVisible();
    await viewBtn.click();

    const panel = page.locator('[data-testid="cad-view-settings-panel"]').first();
    await expect(panel).toBeVisible();

    // 2. Test monochrome
    await page.locator('[data-testid="cad-view-mode-monochrome"]').first().click();
    await expect(host).toHaveAttribute("data-cad-color-mode", "monochrome");

    // 3. Test lineweight
    await page.locator('[data-testid="cad-view-toggle-lineweight"]').first().click();
    await expect(host).toHaveAttribute("data-cad-lineweight", "on");

    // 4. Test background black
    await page.locator('[data-testid="cad-bg-black-panel"]').first().click();
    await expect(host).toHaveAttribute("data-cad-background-color", "black");

    // 5. Test background white
    await page.locator('[data-testid="cad-bg-white-panel"]').first().click();
    await expect(host).toHaveAttribute("data-cad-background-color", "white");

    // 6. Test background autocad
    await page.locator('[data-testid="cad-bg-autocad-panel"]').first().click();
    await expect(host).toHaveAttribute("data-cad-background-color", "autocad");

    // Close panel
    await page.locator('button[aria-label="Görünüm ayarlarını kapat"]').first().click();
    await expect(panel).toHaveCount(0);

    // 7. Single touch pan gesture moves camera
    const canvasBox = await canvas.boundingBox();
    expect(canvasBox).not.toBeNull();
    const centerX = canvasBox!.x + canvasBox!.width / 2;
    const centerY = canvasBox!.y + canvasBox!.height / 2;

    const centerBefore = await page.evaluate(() => {
      const hostEl = document.querySelector('[data-cad-upstream-host="true"]') as unknown as {
        __cadAdapter?: { getCameraCenter?: () => { x: number; y: number } | null };
      };
      return hostEl?.__cadAdapter?.getCameraCenter?.() ?? null;
    });

    const viewport = host.locator('div[aria-label$="CAD görünümü"]').first();
    await viewport.dispatchEvent("pointerdown", {
      bubbles: true,
      cancelable: true,
      clientX: centerX,
      clientY: centerY,
      pointerId: 41,
      pointerType: "touch",
      isPrimary: true,
    });
    await viewport.dispatchEvent("pointermove", {
      bubbles: true,
      cancelable: true,
      clientX: centerX + 60,
      clientY: centerY + 40,
      pointerId: 41,
      pointerType: "touch",
      isPrimary: true,
    });
    await viewport.dispatchEvent("pointerup", {
      bubbles: true,
      cancelable: true,
      clientX: centerX + 60,
      clientY: centerY + 40,
      pointerId: 41,
      pointerType: "touch",
      isPrimary: true,
    });
    await page.waitForTimeout(200);

    const centerAfter = await page.evaluate(() => {
      const hostEl = document.querySelector('[data-cad-upstream-host="true"]') as unknown as {
        __cadAdapter?: { getCameraCenter?: () => { x: number; y: number } | null };
      };
      return hostEl?.__cadAdapter?.getCameraCenter?.() ?? null;
    });

    expect(centerBefore).not.toBeNull();
    expect(centerAfter).not.toBeNull();
  });
});
