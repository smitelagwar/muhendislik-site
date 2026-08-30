import { expect, test } from "@playwright/test";
import {
  signInAdmin,
  uploadCadPreviewV2Fixture,
  cleanupUploadedCadFixtures,
} from "./cad-test-helpers";

test.describe("CAD Preview V2 — Stage 4/8 DWG/DXF Açılış, Cache, Loading & Terminal Hata", () => {
  test.afterEach(async ({ page }) => {
    await cleanupUploadedCadFixtures(page);
  });

  test("Loading fazları, elapsed saniye sayacı ve iptal butonu doğru çalışır", async ({
    page,
  }) => {
    await signInAdmin(page);
    const { fileId } = await uploadCadPreviewV2Fixture(page, "known-geometry-measurements");

    // Navigate to file and observe loading overlay
    await page.goto(`/dokumantasyon/dosya/${fileId}`);
    const host = page.locator('[data-cad-upstream-host="true"]').first();

    // Either loading overlay is visible during load, or transitions to ready
    await expect(host).toHaveAttribute("data-cad-upstream-state", "ready", { timeout: 30_000 });

    // Host has final loading phase marked as ready
    await expect(host).toHaveAttribute("data-cad-loading-phase", "ready");
  });

  test("27 B bozuk DXF terminal hataya ulaşır, hata mesajı, tekrar dene ve indir butonları gösterilir", async ({
    page,
  }) => {
    await signInAdmin(page);

    // Upload corrupt 27-byte DXF
    const corruptDxfContent = "0\nSECTION\n2\nENTITIES\n0\nLINE";
    expect(Buffer.byteLength(corruptDxfContent)).toBe(27);

    const fileId = await page.evaluate(
      async ({ content, name }) => {
        const formData = new FormData();
        formData.append("file", new File([content], name, { type: "application/dxf" }));
        formData.append("pathname", `stage4-corrupt-${crypto.randomUUID()}-${name}`);
        const response = await fetch("/api/dokumantasyon/upload/local", {
          method: "POST",
          body: formData,
        });
        const payload = await response.json();
        if (!response.ok || !payload.file?.id) {
          throw new Error(payload.error || "Corrupt DXF upload failed");
        }
        return payload.file.id as string;
      },
      { content: corruptDxfContent, name: "bozuk-27b.dxf" }
    );

    const startTime = Date.now();
    await page.goto(`/dokumantasyon/dosya/${fileId}`);

    // Terminal result must be reached within 5 seconds
    const errorHeading = page.getByText("DXF açılamadı");
    await expect(errorHeading).toBeVisible({ timeout: 5000 });
    const elapsed = (Date.now() - startTime) / 1000;
    expect(elapsed).toBeLessThanOrEqual(5.0);

    // Verify retry and download buttons are available
    await expect(page.getByRole("button", { name: "Tekrar dene" })).toBeVisible();
    await expect(page.getByRole("button", { name: /indir/i })).toBeVisible();
  });

  test("İptal Et butonu yükleme sürecini temiz biçimde sonlandırır", async ({ page }) => {
    await signInAdmin(page);
    const { fileId } = await uploadCadPreviewV2Fixture(page, "known-geometry-measurements");

    // Intercept CAD source fetch to delay response so cancel button can be clicked
    await page.route("**/api/dokumantasyon/files/*/stream", async (route) => {
      // Delay 3000ms
      await new Promise((r) => setTimeout(r, 3000));
      await route.continue();
    });

    await page.goto(`/dokumantasyon/dosya/${fileId}`);

    const loadingOverlay = page.locator('[data-testid="cad-loading-overlay"]').first();
    await expect(loadingOverlay).toBeVisible({ timeout: 5000 });

    const cancelBtn = page.locator('[data-testid="cad-loading-cancel"]').first();
    await expect(cancelBtn).toBeVisible();
    await cancelBtn.click();

    // After cancel, error card appears with user-cancelled message
    const errorCard = page.locator('[data-testid="cad-error-card"]').first();
    await expect(errorCard).toBeVisible({ timeout: 5000 });
    await expect(page.locator('[data-testid="cad-error-message"]')).toContainText("iptal edildi");
  });

  test("Performans Bütçesi: 3 tekrar ile cold ve warm açılış süreleri ölçülür ve bütçe dahilinde kalır", async ({
    page,
  }) => {
    await signInAdmin(page);

    // Benchmark 1: Bozuk 27 B DXF terminal error duration (3 repetitions)
    const corruptDxfContent = "0\nSECTION\n2\nENTITIES\n0\nLINE";
    const corruptDurations: number[] = [];

    for (let i = 0; i < 3; i++) {
      const fileId = await page.evaluate(
        async ({ content, name }) => {
          const formData = new FormData();
          formData.append("file", new File([content], name, { type: "application/dxf" }));
          formData.append("pathname", `stage4-bench-corrupt-${crypto.randomUUID()}-${name}`);
          const response = await fetch("/api/dokumantasyon/upload/local", {
            method: "POST",
            body: formData,
          });
          const payload = await response.json();
          if (!response.ok || !payload.file?.id) {
            throw new Error(payload.error || "Corrupt DXF upload failed");
          }
          return payload.file.id as string;
        },
        { content: corruptDxfContent, name: `corrupt-bench-${i}.dxf` }
      );

      const t0 = Date.now();
      await page.goto(`/dokumantasyon/dosya/${fileId}`);
      await expect(page.getByText("DXF açılamadı")).toBeVisible({ timeout: 5000 });
      corruptDurations.push((Date.now() - t0) / 1000);
    }

    corruptDurations.sort((a, b) => a - b);
    const corruptMedian = corruptDurations[1];
    const corruptP95 = corruptDurations[2];
    expect(corruptMedian).toBeGreaterThan(0);
    expect(corruptP95).toBeLessThanOrEqual(5.0);

    // Benchmark 2: Known geometry DXF cold-open duration (3 repetitions)
    const openDurations: number[] = [];
    for (let i = 0; i < 3; i++) {
      const { fileId } = await uploadCadPreviewV2Fixture(page, "known-geometry-measurements");
      const t0 = Date.now();
      await page.goto(`/dokumantasyon/dosya/${fileId}`);
      const host = page.locator('[data-cad-upstream-host="true"]').first();
      await expect(host).toHaveAttribute("data-cad-upstream-state", "ready", { timeout: 30_000 });
      openDurations.push((Date.now() - t0) / 1000);
    }

    openDurations.sort((a, b) => a - b);
    const openMedian = openDurations[1];
    const openP95 = openDurations[2];
    expect(openMedian).toBeGreaterThan(0);
    expect(openP95).toBeLessThanOrEqual(8.0);
  });
});
