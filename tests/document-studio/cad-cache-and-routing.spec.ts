import { expect, test } from "@playwright/test";
import {
  signInAdmin,
  uploadCadPreviewV2Fixture,
  uploadCustomDwgFixture,
} from "./cad-test-helpers";
import { readFileSync } from "fs";
import { resolve } from "path";

test.describe("CAD Preview V2 — Cache HIT/MISS & Primary Tool Surface Routing Suite", () => {
  test("DWG Cache HIT Yolu: /dwg-dxf cached-DXF döndüğünde DokCadUpstreamViewer açılır, araç yüzeyi ve yetenekler tam kalır", async ({ page }) => {
    let dwgDxfRequestCount = 0;
    const dxfFixturePath = resolve(process.cwd(), "tests/fixtures/cad-preview-v2/known-geometry-measurements.dxf");
    const dxfBuffer = readFileSync(dxfFixturePath);

    await signInAdmin(page);
    const fileId = await uploadCustomDwgFixture(page, "ornek-mimari-proje.dwg");

    // Mock Cache HIT endpoint
    await page.route(`**/api/dokumantasyon/files/${fileId}/dwg-dxf`, async (route) => {
      dwgDxfRequestCount += 1;
      await route.fulfill({
        status: 200,
        headers: {
          "Content-Type": "application/dxf",
          "X-DWG-DXF-Decision": "PASS",
        },
        body: dxfBuffer,
      });
    });

    await page.goto(`/dokumantasyon/dosya/${fileId}`);

    const runtime = page.locator('[data-cad-runtime="orchestrator"]').first();
    await expect(runtime).toBeVisible({ timeout: 30_000 });

    // Assert DOM markers for Cache HIT
    await expect(runtime).toHaveAttribute("data-cad-engine", "upstream", { timeout: 30_000 });
    await expect(runtime).toHaveAttribute("data-cad-source", "cached-dxf", { timeout: 30_000 });

    // Assert request count is bounded and expected
    expect(dwgDxfRequestCount).toBeGreaterThanOrEqual(1);
    expect(dwgDxfRequestCount).toBeLessThanOrEqual(2);

    // Assert capabilities
    const capabilitiesJson = await runtime.getAttribute("data-cad-capabilities");
    expect(capabilitiesJson).not.toBeNull();
    const capabilities = JSON.parse(capabilitiesJson!);
    expect(capabilities.readOnly).toBe(true);
    expect(capabilities.distanceMeasure).toBe(true);
    expect(capabilities.areaMeasure).toBe(true);
    expect(capabilities.layers).toBe(true);
    expect(capabilities.fit).toBe(true);

    // Assert upstream viewer reaches ready state
    const host = runtime.locator('[data-cad-upstream-host="true"]').first();
    await expect(host).toHaveAttribute("data-cad-upstream-state", "ready", { timeout: 30_000 });
  });

  test("DWG Cache MISS Yolu: /dwg-dxf 404 döndüğünde orijinal DWG upstream yoluna aktarılır ve aynı araç yüzeyi korunur", async ({ page }) => {
    let dwgDxfRequestCount = 0;

    await signInAdmin(page);
    const fileId = await uploadCustomDwgFixture(page, "ornek-statik-proje.dwg");

    // Mock Cache MISS endpoint
    await page.route(`**/api/dokumantasyon/files/${fileId}/dwg-dxf`, async (route) => {
      dwgDxfRequestCount += 1;
      await route.fulfill({
        status: 404,
        contentType: "application/json",
        body: JSON.stringify({ error: "CACHE_MISS" }),
      });
    });

    await page.goto(`/dokumantasyon/dosya/${fileId}`);

    const runtime = page.locator('[data-cad-runtime="orchestrator"]').first();
    await expect(runtime).toBeVisible({ timeout: 30_000 });

    // Assert DOM markers for Cache MISS -> original-dwg upstream
    await expect(runtime).toHaveAttribute("data-cad-engine", "upstream", { timeout: 30_000 });
    await expect(runtime).toHaveAttribute("data-cad-source", "original-dwg", { timeout: 30_000 });

    // Assert request count is bounded and expected
    expect(dwgDxfRequestCount).toBeGreaterThanOrEqual(1);
    expect(dwgDxfRequestCount).toBeLessThanOrEqual(2);

    // Assert capabilities are identical on MISS path
    const capabilitiesJson = await runtime.getAttribute("data-cad-capabilities");
    expect(capabilitiesJson).not.toBeNull();
    const capabilities = JSON.parse(capabilitiesJson!);
    expect(capabilities.readOnly).toBe(true);
    expect(capabilities.distanceMeasure).toBe(true);
    expect(capabilities.areaMeasure).toBe(true);
    expect(capabilities.layers).toBe(true);
    expect(capabilities.fit).toBe(true);
  });

  test("Doğrudan DXF Yolu: DXF dosyası doğrudan upstream motorda açılır", async ({ page }) => {
    await signInAdmin(page);
    const { fileId } = await uploadCadPreviewV2Fixture(page, "known-geometry-measurements");

    await page.goto(`/dokumantasyon/dosya/${fileId}`);
    const runtime = page.locator('[data-cad-runtime="orchestrator"]').first();
    await expect(runtime).toBeVisible({ timeout: 30_000 });

    await expect(runtime).toHaveAttribute("data-cad-engine", "upstream");
    await expect(runtime).toHaveAttribute("data-cad-source", "original-dxf");
    const host = runtime.locator('[data-cad-upstream-host="true"]').first();
    await expect(host).toHaveAttribute("data-cad-upstream-state", "ready", { timeout: 30_000 });
  });
});
