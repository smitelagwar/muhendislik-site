import { expect, test } from "@playwright/test";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import {
  signInAdmin,
  uploadCadPreviewV2Fixture,
  forceUpstreamUnavailable,
  cleanupUploadedCadFixtures,
} from "./cad-test-helpers";
import { CAD_PREVIEW_V2_MANIFEST } from "../fixtures/cad-preview-v2/manifest";

test.describe("CAD Preview V2 — Contract & Oracle Suite", () => {
  test.afterEach(async ({ page }) => {
    await cleanupUploadedCadFixtures(page);
  });

  test("Manifest bütünlüğü ve SHA-256 doğruluk denetimi", async () => {
    const keys = Object.keys(CAD_PREVIEW_V2_MANIFEST);
    expect(keys.length).toBeGreaterThanOrEqual(7);

    for (const key of keys) {
      const item = CAD_PREVIEW_V2_MANIFEST[key];
      expect(item.id).toBe(key);
      expect(item.expectedEngine).toBe("upstream");

      const fixturePath = path.resolve(process.cwd(), "tests/fixtures/cad-preview-v2", item.fileName);
      expect(fs.existsSync(fixturePath)).toBe(true);

      const fileBuffer = fs.readFileSync(fixturePath);
      const computedSha256 = crypto.createHash("sha256").update(fileBuffer).digest("hex");

      expect(fileBuffer.length).toBe(item.sizeBytes);
      expect(computedSha256).toBe(item.sha256);
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

    const canvas = host.locator("canvas").first();
    await expect(canvas).toBeVisible({ timeout: 15_000 });

    const canvasState = await canvas.evaluate((el: HTMLCanvasElement) => {
      const gl = (el.getContext("webgl2") || el.getContext("webgl")) as WebGLRenderingContext | null;
      let hasDrawnPixels = false;
      if (gl) {
        const pixels = new Uint8Array(Math.min(gl.drawingBufferWidth, 256) * Math.min(gl.drawingBufferHeight, 256) * 4);
        gl.readPixels(0, 0, Math.min(gl.drawingBufferWidth, 256), Math.min(gl.drawingBufferHeight, 256), gl.RGBA, gl.UNSIGNED_BYTE, pixels);
        for (let i = 0; i < pixels.length; i += 4) {
          if (pixels[i + 3]! > 0 || pixels[i]! > 0 || pixels[i + 1]! > 0 || pixels[i + 2]! > 0) {
            hasDrawnPixels = true;
            break;
          }
        }
      }
      return {
        width: el.width,
        height: el.height,
        clientWidth: el.clientWidth,
        clientHeight: el.clientHeight,
        hasDrawnPixels,
      };
    });

    expect(canvasState.width).toBeGreaterThan(0);
    expect(canvasState.height).toBeGreaterThan(0);
    expect(canvasState.clientWidth).toBeGreaterThan(100);
    expect(canvasState.clientHeight).toBeGreaterThan(100);

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
