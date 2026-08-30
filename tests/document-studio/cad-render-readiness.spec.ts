import { expect, test } from "@playwright/test";
import {
  signInAdmin,
  uploadCadPreviewV2Fixture,
  cleanupUploadedCadFixtures,
} from "./cad-test-helpers";
import {
  resolveCadPreviewCapabilities,
  resolveCadReviewCapabilities,
} from "../../src/lib/dokumantasyon/cad-runtime/capabilities";

test.describe("CAD Review Workspace V1 — Stage 1 Render Readiness, Capabilities & Resilience", () => {

  test.afterEach(async ({ page }) => {
    await cleanupUploadedCadFixtures(page);
  });

  test("Granular Review Capabilities sözleşmesi ve geriye uyumluluk doğrulaması", async () => {
    // 1. Upstream review capabilities
    const upstream = resolveCadReviewCapabilities("upstream");
    expect(upstream.readOnly).toBe(true);
    expect(upstream.worldTransform).toBe(true);
    expect(upstream.stableViewEvents).toBe(true);
    expect(upstream.activeLayoutIdentity).toBe(true);
    expect(upstream.entityTraversal).toBe(true);
    expect(upstream.textExtraction).toBe(true);
    expect(upstream.entityBounds).toBe(true);
    expect(upstream.snap).toBe(true);
    expect(upstream.reviewOverlay).toBe(true);
    expect(upstream.reviewSelection).toBe(true);
    expect(upstream.originalDownload).toBe(true);
    expect(upstream.composedRasterExport).toBe(true);
    expect(upstream.reviewDxfExport).toBe(true);
    expect(upstream.combinedDxfExport).toBe(false);
    expect(upstream.trueDwgExport).toBe(false);

    // 2. Legacy review capabilities
    const legacy = resolveCadReviewCapabilities("legacy");
    expect(legacy.readOnly).toBe(true);
    expect(legacy.worldTransform).toBe(false);
    expect(legacy.snap).toBe(false);
    expect(legacy.reviewOverlay).toBe(false);
    expect(legacy.originalDownload).toBe(true);

    // 3. APS review capabilities
    const aps = resolveCadReviewCapabilities("aps");
    expect(aps.readOnly).toBe(true);
    expect(aps.worldTransform).toBe(false);
    expect(aps.reviewOverlay).toBe(false);
    expect(aps.originalDownload).toBe(true);

    // 4. Backward-compatible preview capabilities
    const previewUpstream = resolveCadPreviewCapabilities("upstream");
    expect(previewUpstream.distanceMeasure).toBe(true);
    expect(previewUpstream.areaMeasure).toBe(true);
    expect(previewUpstream.layers).toBe(true);
    expect(previewUpstream.fit).toBe(true);
  });

  test("Gerçek DXF açılışında CadRenderReadinessSnapshot tanı doğrulaması", async ({ page }) => {
    await signInAdmin(page);
    const { fileId } = await uploadCadPreviewV2Fixture(page, "known-geometry-measurements");

    await page.goto(`/dokumantasyon/dosya/${fileId}`);

    const runtime = page.locator('[data-cad-runtime="orchestrator"][data-cad-engine="upstream"]').first();
    const host = runtime.locator('[data-cad-upstream-host="true"]').first();

    await expect(runtime).toBeVisible({ timeout: 30_000 });
    await expect(host).toHaveAttribute("data-cad-upstream-state", "ready", { timeout: 30_000 });

    // Host adapter readiness snapshot evaluation
    const readiness = await host.evaluate((el: HTMLElement) => {
      const adapter = (el as unknown as { __cadAdapter?: { getRenderReadinessSnapshot?: () => unknown } }).__cadAdapter;
      if (!adapter || typeof adapter.getRenderReadinessSnapshot !== "function") {
        return null;
      }
      return adapter.getRenderReadinessSnapshot() as {
        isReady: boolean;
        isIdle: boolean;
        entityCount: number;
        hasFiniteBounds: boolean;
        bounds: { min: { x: number; y: number }; max: { x: number; y: number } } | null;
        cameraValid: boolean;
        webglContextLost: boolean;
        viewport: { clientWidth: number; clientHeight: number };
      };
    });

    expect(readiness).not.toBeNull();
    expect(readiness!.isReady).toBe(true);
    expect(readiness!.isIdle).toBe(true);
    expect(readiness!.entityCount).toBeGreaterThan(0);


    expect(readiness!.hasFiniteBounds).toBe(true);
    expect(readiness!.bounds).not.toBeNull();
    expect(readiness!.bounds!.max.x).toBeGreaterThanOrEqual(readiness!.bounds!.min.x);
    expect(readiness!.bounds!.max.y).toBeGreaterThanOrEqual(readiness!.bounds!.min.y);
    expect(readiness!.cameraValid).toBe(true);
    expect(readiness!.webglContextLost).toBe(false);
    expect(readiness!.viewport.clientWidth).toBeGreaterThan(100);
    expect(readiness!.viewport.clientHeight).toBeGreaterThan(100);
  });

  test("Bounded teardown ve destroy güvencesi: Adapter destroy çağrısı takılmadan tamamlanır", async ({
    page,
  }) => {
    await signInAdmin(page);
    const { fileId } = await uploadCadPreviewV2Fixture(page, "known-geometry-measurements");

    await page.goto(`/dokumantasyon/dosya/${fileId}`);
    const host = page.locator('[data-cad-upstream-host="true"]').first();
    await expect(host).toHaveAttribute("data-cad-upstream-state", "ready", { timeout: 30_000 });

    const destroyElapsedMs = await host.evaluate(async (el: HTMLElement) => {
      const adapter = (el as unknown as { __cadAdapter?: { destroy?: () => Promise<void> } }).__cadAdapter;
      if (!adapter || typeof adapter.destroy !== "function") return -1;
      const start = performance.now();
      await adapter.destroy();
      return performance.now() - start;
    });

    expect(destroyElapsedMs).toBeGreaterThanOrEqual(0);

    expect(destroyElapsedMs).toBeLessThan(3500); // 3.5 saniye altında bounded tamamlanmalı
  });
});
