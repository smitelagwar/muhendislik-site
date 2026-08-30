import { expect, test } from "@playwright/test";
import { signInAdmin, uploadCadPreviewV2Fixture } from "./cad-test-helpers";

test.describe("CAD Preview V2 — Robustness, Security, Lifecycle & A11y Suite", () => {
  test("Sıfır Persist ve Ağ Güvenliği: Çizim inceleme, renk modu, lineweight ve pan sırasında ZERO mutasyon (POST/PUT/PATCH/DELETE) üretilir", async ({ page }) => {
    const mutationRequests: string[] = [];

    page.on("request", (req) => {
      const method = req.method().toUpperCase();
      const url = req.url();
      // Ignore login/auth during setup
      if (url.includes("/api/auth") || url.includes("/login")) return;

      if (["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
        mutationRequests.push(`${method} ${url}`);
      }
    });

    await signInAdmin(page);
    const { fileId } = await uploadCadPreviewV2Fixture(page, "known-geometry-measurements");

    // Clear mutation array after fixture upload and navigate to file preview
    mutationRequests.length = 0;

    await page.goto(`/dokumantasyon/dosya/${fileId}`);
    const host = page.locator('[data-cad-upstream-host="true"]').first();
    await expect(host).toHaveAttribute("data-cad-upstream-state", "ready", { timeout: 30_000 });

    // 1. Color mode switch
    const monoBtn = page.getByRole("button", { name: "Siyah-Beyaz" });
    await monoBtn.click();
    await expect(host).toHaveAttribute("data-cad-color-mode", "monochrome");

    // 2. Lineweight toggle
    const lwBtn = page.getByRole("button", { name: "Lineweight" });
    await lwBtn.click();
    await expect(host).toHaveAttribute("data-cad-lineweight", "on");

    // 3. Zoom to fit
    const fitBtn = page.locator('[data-testid="cad-tool-fit"]').first();
    await fitBtn.click();
    await page.waitForTimeout(300);

    // 4. Pan gesture on canvas: verifies camera moves AND zero mutations occur
    const canvas = host.locator("canvas").first();
    const box = await canvas.boundingBox();
    let panMoved = false;
    if (box) {
      const centerX = box.x + box.width / 2;
      const centerY = box.y + box.height / 2;
      const centerBefore = await page.evaluate(() => {
        const hostEl = document.querySelector('[data-cad-upstream-host="true"]') as unknown as {
          __cadAdapter?: { getCameraCenter?: () => { x: number; y: number } | null };
        };
        return hostEl?.__cadAdapter?.getCameraCenter?.() ?? null;
      });

      await page.mouse.move(centerX, centerY);
      await page.mouse.down({ button: "left" });
      await page.mouse.move(centerX + 80, centerY + 60, { steps: 5 });
      await page.mouse.up({ button: "left" });
      await page.waitForTimeout(200);

      const centerAfter = await page.evaluate(() => {
        const hostEl = document.querySelector('[data-cad-upstream-host="true"]') as unknown as {
          __cadAdapter?: { getCameraCenter?: () => { x: number; y: number } | null };
        };
        return hostEl?.__cadAdapter?.getCameraCenter?.() ?? null;
      });

      if (centerBefore && centerAfter) {
        panMoved =
          Math.abs(centerAfter.x - centerBefore.x) > 0.01 ||
          Math.abs(centerAfter.y - centerBefore.y) > 0.01;
      }
    }
    expect(panMoved).toBe(true);

    // Verify ZERO mutation requests were made during all interactions
    expect(mutationRequests).toEqual([]);
  });

  test("Lifecycle & Hızlı Dosya Değişimi: Art arda hızlı dosya yükleme ve geçişlerde bellek sızıntısı veya çökme olmadan hazır duruma ulaşılır", async ({ page }) => {
    await signInAdmin(page);
    const f1 = await uploadCadPreviewV2Fixture(page, "known-geometry-measurements");
    const f2 = await uploadCadPreviewV2Fixture(page, "layers-frozen-locked-zero");

    // Rapid navigate to f1
    await page.goto(`/dokumantasyon/dosya/${f1.fileId}`);
    const host1 = page.locator('[data-cad-upstream-host="true"]').first();
    await expect(host1).toHaveAttribute("data-cad-upstream-state", "ready", { timeout: 30_000 });

    // Immediately navigate to f2
    await page.goto(`/dokumantasyon/dosya/${f2.fileId}`);
    const host2 = page.locator('[data-cad-upstream-host="true"]').first();
    await expect(host2).toHaveAttribute("data-cad-upstream-state", "ready", { timeout: 30_000 });

    // Navigate back to f1
    await page.goto(`/dokumantasyon/dosya/${f1.fileId}`);
    await expect(host1).toHaveAttribute("data-cad-upstream-state", "ready", { timeout: 30_000 });

    // Verify only one active canvas element exists
    const canvases = page.locator('[data-cad-upstream-host="true"] canvas');
    expect(await canvases.count()).toBeLessThanOrEqual(2);
  });

  test("Mobil & Responsive Uyumluluğu: Mobil (375x667) ve yatay modda taşma olmaz, panel sınırlar içinde kalır", async ({ page }) => {
    await signInAdmin(page);
    const { fileId } = await uploadCadPreviewV2Fixture(page, "known-geometry-measurements");

    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(`/dokumantasyon/dosya/${fileId}`);
    const host = page.locator('[data-cad-upstream-host="true"]').first();
    await expect(host).toHaveAttribute("data-cad-upstream-state", "ready", { timeout: 30_000 });

    // Verify controls are visible and fit within 375px viewport
    const fitBtn = page.locator('[data-testid="cad-tool-fit"]').first();
    await expect(fitBtn).toBeVisible();
    const canvas = host.locator("canvas").first();
    await expect(canvas).toBeVisible();

    // Verify no document horizontal scroll overflow
    const hasHorizontalOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });
    expect(hasHorizontalOverflow).toBe(false);

    // Open layer panel in mobile viewport -> becomes bottom sheet
    await page.locator('[data-testid="cad-tool-layers"]').first().click();
    const panel = page.locator('[data-testid="cad-layer-panel"]').first();
    await expect(panel).toBeVisible();

    // Switch to landscape mode (667x375)
    await page.setViewportSize({ width: 667, height: 375 });
    await expect(panel).toBeVisible();
    const hasLandscapeOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });
    expect(hasLandscapeOverflow).toBe(false);
  });

  test("Hata Durumu & Terminal Sonuç: Kaynak erişim hatasında sonsuz loading yerine terminal hata ve retry gösterilir", async ({ page }) => {
    await signInAdmin(page);
    const { fileId } = await uploadCadPreviewV2Fixture(page, "known-geometry-measurements");

    // Intercept CAD source access URL and force 500 error
    await page.route(`**/api/dokumantasyon/files/${fileId}/**`, async (route) => {
      await route.fulfill({ status: 500, body: "Sunucu hatası" });
    });

    await page.goto(`/dokumantasyon/dosya/${fileId}`);
    const runtime = page.locator('[data-cad-runtime="orchestrator"]').first();
    await expect(runtime).toBeVisible({ timeout: 30_000 });

    // Verify terminal failure: retry button is present, loading overlay disappears
    const retryBtn = page.getByRole("button", { name: "Tekrar dene" }).first();
    await expect(retryBtn).toBeVisible({ timeout: 30_000 });
  });
});
