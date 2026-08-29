import { expect, test } from "@playwright/test";
import {
  signInAdmin,
  uploadCadPreviewV2Fixture,
  forceUpstreamUnavailable,
} from "./cad-test-helpers";
import { CAD_PREVIEW_V2_MANIFEST } from "../fixtures/cad-preview-v2/manifest";

test.describe("CAD Preview V2 — Contract & Oracle Suite", () => {
  test("Manifest bütünlüğü ve SHA-256 doğruluk denetimi", async () => {
    const keys = Object.keys(CAD_PREVIEW_V2_MANIFEST);
    expect(keys.length).toBeGreaterThanOrEqual(7);

    for (const key of keys) {
      const item = CAD_PREVIEW_V2_MANIFEST[key];
      expect(item.id).toBe(key);
      expect(item.sha256).toMatch(/^[0-9a-f]{64}$/);
      expect(item.sizeBytes).toBeGreaterThan(0);
      expect(item.expectedEngine).toBe("upstream");
    }
  });

  test("Sayısal Geometri ve Ölçüm Oracle'ı (Known Geometry Oracle)", async ({ page }) => {
    await signInAdmin(page);
    const { fileId, manifest } = await uploadCadPreviewV2Fixture(page, "known-geometry-measurements");

    await page.goto(`/dokumantasyon/dosya/${fileId}`);
    const runtime = page.locator('[data-cad-runtime="orchestrator"][data-cad-engine="upstream"]').first();
    const host = runtime.locator('[data-cad-upstream-host="true"]').first();

    await expect(runtime).toBeVisible({ timeout: 30_000 });
    await expect(host).toHaveAttribute("data-cad-upstream-state", "ready", { timeout: 30_000 });

    // Mathematical verification of measurement oracle definitions
    const distanceMeasure = manifest.measurements?.find((m) => m.type === "distance");
    const areaMeasure = manifest.measurements?.find((m) => m.type === "area");

    expect(distanceMeasure).toBeDefined();
    expect(areaMeasure).toBeDefined();

    // Verify distance: sqrt((3000-0)^2 + (4000-0)^2) = 5000
    const [p1, p2] = distanceMeasure!.points;
    const computedDistance = Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
    expect(Math.abs(computedDistance - distanceMeasure!.expectedValue)).toBeLessThanOrEqual(distanceMeasure!.tolerance);

    // Verify area of rectangle: 3000 * 4000 = 12,000,000
    const pts = areaMeasure!.points;
    let computedArea = 0;
    for (let i = 0; i < pts.length; i++) {
      const j = (i + 1) % pts.length;
      computedArea += pts[i].x * pts[j].y;
      computedArea -= pts[j].x * pts[i].y;
    }
    computedArea = Math.abs(computedArea) / 2;
    expect(Math.abs(computedArea - areaMeasure!.expectedValue)).toBeLessThanOrEqual(areaMeasure!.tolerance);
  });

  test("Katman Oracle'ı: Layer 0, on, off, frozen ve locked katman durumları doğrulanır", async ({ page }) => {
    await signInAdmin(page);
    const { fileId, manifest } = await uploadCadPreviewV2Fixture(page, "layers-frozen-locked-zero");

    await page.goto(`/dokumantasyon/dosya/${fileId}`);
    const runtime = page.locator('[data-cad-runtime="orchestrator"][data-cad-engine="upstream"]').first();
    const host = runtime.locator('[data-cad-upstream-host="true"]').first();

    await expect(runtime).toBeVisible({ timeout: 30_000 });
    await expect(host).toHaveAttribute("data-cad-upstream-state", "ready", { timeout: 30_000 });

    expect(manifest.layers).toBeDefined();
    expect(manifest.layers!.length).toBe(5);

    const layer0 = manifest.layers!.find((l) => l.name === "0");
    const activeLayer = manifest.layers!.find((l) => l.name === "ACTIVE_VISIBLE");
    const offLayer = manifest.layers!.find((l) => l.name === "SOURCE_OFF");
    const frozenLayer = manifest.layers!.find((l) => l.name === "FROZEN_LAYER");
    const lockedLayer = manifest.layers!.find((l) => l.name === "LOCKED_LAYER");

    expect(layer0?.expectedVisible).toBe(true);
    expect(activeLayer?.expectedVisible).toBe(true);
    expect(offLayer?.expectedVisible).toBe(false);
    expect(frozenLayer?.expectedFrozen).toBe(true);
    expect(lockedLayer?.expectedLocked).toBe(true);
  });

  test("Upstream devre dışı kaldığında legacy fallback tetiklenir", async ({ page }) => {
    await forceUpstreamUnavailable(page);
    await signInAdmin(page);
    const { fileId } = await uploadCadPreviewV2Fixture(page, "text-rotation-0-90-180-270");

    await page.goto(`/dokumantasyon/dosya/${fileId}`);
    const fallbackRuntime = page.locator('[data-cad-runtime="orchestrator"][data-cad-engine="legacy"]').first();
    await expect(fallbackRuntime).toBeVisible({ timeout: 30_000 });
  });
});
