import { test, expect, type Page } from "@playwright/test";
import path from "node:path";
import fs from "node:fs";

async function waitForStudioReady(page: Page, route: string) {
  await page.goto(route, { waitUntil: "domcontentloaded", timeout: 30_000 });
  const studio = page.locator('[data-studio-locked="true"]:visible').last();
  await expect(studio).toBeVisible({ timeout: 20_000 });
  const toolbar = studio.locator('[data-testid="belge-studio-preview-toolbar"]');
  await expect(toolbar).toBeVisible({ timeout: 10_000 });
  const canvas = studio.locator('[data-testid="belge-studio-preview-canvas"] canvas').first();
  await expect(canvas).toBeVisible({ timeout: 15_000 });
  await expect(canvas).toHaveCSS("opacity", "1", { timeout: 15_000 });
  return { studio, toolbar, canvas };
}

test.describe("ASAMA_03: İki Eksende Tam Merkezli Form Alanı Navigasyonu ve Zoom Değişmezliği", () => {
  const outputDir = path.resolve(process.cwd(), "test-results/asama03-focus-center");

  test.beforeAll(() => {
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
  });

  test("1. %250 Zoom: Form alanına odaklanma alanı tam merkeze (<=8px) getirmeli ve zoom invariant (%250) kalmalıdır", async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 768 });
    const { studio, toolbar } = await waitForStudioReady(page, "/belgeler/santiye-sefi-taahhutnamesi");

    // Zoom to ~250% first
    const inBtn = toolbar.locator('button[aria-label="Yakınlaştır"]');
    for (let i = 0; i < 6; i++) {
      await inBtn.click();
      await page.waitForTimeout(60);
    }

    const zoomBefore = await page.evaluate(() => {
      const el = document.querySelector('[data-testid="belge-studio-zoom-level"]');
      return parseInt(el?.textContent?.replace("%", "") || "100", 10);
    });
    expect(zoomBefore).toBeGreaterThanOrEqual(200);

    // Focus on yapi_sahibi_adresi
    const input = studio.locator("#taahhutname-yapi_sahibi_adresi");
    await input.focus();

    const highlight = studio.locator('[data-testid="belge-field-focus-highlight"]');
    await expect(highlight).toBeVisible({ timeout: 5000 });

    // Wait for smooth 280ms scroll animation + settle
    await page.waitForTimeout(450);

    const delta = await page.evaluate(() => {
      const container = document.querySelector('[data-testid="belge-studio-preview-canvas"]')!;
      const hl = document.querySelector('[data-testid="belge-field-focus-highlight"]')!;
      const cRect = container.getBoundingClientRect();
      const hRect = hl.getBoundingClientRect();
      const viewportCenterX = cRect.left + container.clientLeft + container.clientWidth / 2;
      const viewportCenterY = cRect.top + container.clientTop + container.clientHeight / 2;
      const highlightCenterX = hRect.left + hRect.width / 2;
      const highlightCenterY = hRect.top + hRect.height / 2;
      return {
        dx: Math.abs(highlightCenterX - viewportCenterX),
        dy: Math.abs(highlightCenterY - viewportCenterY),
        zoomText: document.querySelector('[data-testid="belge-studio-zoom-level"]')?.textContent,
      };
    });

    // Zoom MUST be invariant
    expect(delta.zoomText).toBe(`%${zoomBefore}`);

    // Field geometric center must match viewport center within <= 8px tolerance
    expect(delta.dx).toBeLessThanOrEqual(8);
    expect(delta.dy).toBeLessThanOrEqual(8);

    await page.screenshot({
      path: path.join(outputDir, "focus-stage03-01-zoom250-center.png"),
    });
  });

  test("2. %400 Uç Zoom: Sıralı alan seçimlerinde (Yapı Adresi -> İmza Unvanı) XY pan ve zoom=%400 korunmalıdır", async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 768 });
    const { studio, toolbar } = await waitForStudioReady(page, "/belgeler/santiye-sefi-taahhutnamesi");

    // Click zoom in up to 400%
    const inBtn = toolbar.locator('button[aria-label="Yakınlaştır"]');
    for (let i = 0; i < 15; i++) {
      const isMax = await inBtn.isDisabled();
      if (isMax) break;
      await inBtn.click();
      await page.waitForTimeout(50);
    }

    const zoom400 = await page.evaluate(() => {
      const el = document.querySelector('[data-testid="belge-studio-zoom-level"]');
      return parseInt(el?.textContent?.replace("%", "") || "100", 10);
    });
    expect(zoom400).toBe(400);

    // Focus on yapi_adresi
    const input1 = studio.locator("#taahhutname-yapi_adresi");
    await input1.focus();
    await page.waitForTimeout(450);

    const delta1 = await page.evaluate(() => {
      const container = document.querySelector('[data-testid="belge-studio-preview-canvas"]')!;
      const hl = document.querySelector('[data-testid="belge-field-focus-highlight"]')!;
      const cRect = container.getBoundingClientRect();
      const hRect = hl.getBoundingClientRect();
      const viewportCenterX = cRect.left + container.clientLeft + container.clientWidth / 2;
      const viewportCenterY = cRect.top + container.clientTop + container.clientHeight / 2;
      return {
        dx: Math.abs(hRect.left + hRect.width / 2 - viewportCenterX),
        dy: Math.abs(hRect.top + hRect.height / 2 - viewportCenterY),
        zoomText: document.querySelector('[data-testid="belge-studio-zoom-level"]')?.textContent,
      };
    });
    expect(delta1.zoomText).toBe("%400");
    expect(delta1.dx).toBeLessThanOrEqual(8);
    expect(delta1.dy).toBeLessThanOrEqual(8);

    // Now switch focus to yapi_sahibi_adresi at bottom of page
    const input2 = studio.locator("#taahhutname-yapi_sahibi_adresi");
    await input2.focus();
    await page.waitForTimeout(450);

    const delta2 = await page.evaluate(() => {
      const container = document.querySelector('[data-testid="belge-studio-preview-canvas"]')!;
      const hl = document.querySelector('[data-testid="belge-field-focus-highlight"]')!;
      const cRect = container.getBoundingClientRect();
      const hRect = hl.getBoundingClientRect();
      const viewportCenterX = cRect.left + container.clientLeft + container.clientWidth / 2;
      const viewportCenterY = cRect.top + container.clientTop + container.clientHeight / 2;
      return {
        dx: Math.abs(hRect.left + hRect.width / 2 - viewportCenterX),
        dy: Math.abs(hRect.top + hRect.height / 2 - viewportCenterY),
        zoomText: document.querySelector('[data-testid="belge-studio-zoom-level"]')?.textContent,
      };
    });
    expect(delta2.zoomText).toBe("%400");
    expect(delta2.dx).toBeLessThanOrEqual(8);
    expect(delta2.dy).toBeLessThanOrEqual(8);

    await page.screenshot({
      path: path.join(outputDir, "focus-stage03-02-zoom400-center.png"),
    });
  });

  test("3. Tuş vuruşlarında scroll olmamalı, manuel kaydırma sonrası aynı alana tekrar tıklama yeniden merkezlemelidir", async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 768 });
    const { studio, toolbar } = await waitForStudioReady(page, "/belgeler/santiye-sefi-taahhutnamesi");

    const inBtn = toolbar.locator('button[aria-label="Yakınlaştır"]');
    for (let i = 0; i < 5; i++) {
      await inBtn.click();
      await page.waitForTimeout(50);
    }

    const input = studio.locator("#taahhutname-yapi_sahibi");
    await input.focus();
    await page.waitForTimeout(450);

    // User manually scrolls the preview container away
    await page.evaluate(() => {
      const container = document.querySelector('[data-testid="belge-studio-preview-canvas"]')!;
      container.scrollTop += 220;
      container.scrollLeft += 100;
    });

    const scrollManual = await page.evaluate(() => {
      const container = document.querySelector('[data-testid="belge-studio-preview-canvas"]')!;
      return { top: container.scrollTop, left: container.scrollLeft };
    });

    // Type inside input: writing letters MUST NOT trigger re-centering scroll!
    await input.pressSequentially(" ABC");
    await page.waitForTimeout(200);

    const scrollAfterTyping = await page.evaluate(() => {
      const container = document.querySelector('[data-testid="belge-studio-preview-canvas"]')!;
      return { top: container.scrollTop, left: container.scrollLeft };
    });
    expect(scrollAfterTyping.top).toBe(scrollManual.top);
    expect(scrollAfterTyping.left).toBe(scrollManual.left);

    // Re-click the same input intentionally: MUST re-center!
    await input.click();
    await page.waitForTimeout(450);

    const delta = await page.evaluate(() => {
      const container = document.querySelector('[data-testid="belge-studio-preview-canvas"]')!;
      const hl = document.querySelector('[data-testid="belge-field-focus-highlight"]')!;
      const cRect = container.getBoundingClientRect();
      const hRect = hl.getBoundingClientRect();
      const viewportCenterX = cRect.left + container.clientLeft + container.clientWidth / 2;
      const viewportCenterY = cRect.top + container.clientTop + container.clientHeight / 2;
      return {
        dx: Math.abs(hRect.left + hRect.width / 2 - viewportCenterX),
        dy: Math.abs(hRect.top + hRect.height / 2 - viewportCenterY),
      };
    });
    expect(delta.dx).toBeLessThanOrEqual(8);
    expect(delta.dy).toBeLessThanOrEqual(8);

    await page.screenshot({
      path: path.join(outputDir, "focus-stage03-03-reclick-center.png"),
    });
  });

  test("4. prefers-reduced-motion: Animasyonsuz anında merkezleme (<=2px) ve zoom korunumu", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.setViewportSize({ width: 1366, height: 768 });
    const { studio, toolbar } = await waitForStudioReady(page, "/belgeler/santiye-sefi-taahhutnamesi");

    const inBtn = toolbar.locator('button[aria-label="Yakınlaştır"]');
    for (let i = 0; i < 4; i++) {
      await inBtn.click();
      await page.waitForTimeout(60);
    }

    await page.waitForFunction(() => {
      const el = document.querySelector('[data-testid="belge-studio-zoom-level"]');
      return el?.textContent !== "%100";
    });

    const input = studio.locator("#taahhutname-yapi_sahibi_adresi");
    await input.focus();

    const highlight = studio.locator('[data-testid="belge-field-focus-highlight"]');
    await expect(highlight).toBeVisible({ timeout: 5000 });
    await page.waitForTimeout(300);

    const delta = await page.evaluate(() => {
      const container = document.querySelector('[data-testid="belge-studio-preview-canvas"]')!;
      const hl = document.querySelector('[data-testid="belge-field-focus-highlight"]')!;
      const cRect = container.getBoundingClientRect();
      const hRect = hl.getBoundingClientRect();
      const viewportCenterX = cRect.left + container.clientLeft + container.clientWidth / 2;
      const viewportCenterY = cRect.top + container.clientTop + container.clientHeight / 2;
      return {
        dx: Math.abs(hRect.left + hRect.width / 2 - viewportCenterX),
        dy: Math.abs(hRect.top + hRect.height / 2 - viewportCenterY),
        scrollLeft: container.scrollLeft,
        scrollTop: container.scrollTop,
        padLeft: getComputedStyle(document.querySelector('.belge-preview-surface')!).paddingLeft,
      };
    });

    expect(delta.dx).toBeLessThanOrEqual(2);
    expect(delta.dy).toBeLessThanOrEqual(2);

    await page.screenshot({
      path: path.join(outputDir, "focus-stage03-04-reduced-motion-center.png"),
    });
  });
});
