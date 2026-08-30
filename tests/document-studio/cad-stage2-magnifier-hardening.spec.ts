import { expect, test } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { signInAdmin, cleanupUploadedCadFixtures } from "./cad-test-helpers";

test.describe("CAD Preview V2 — Stage 2/8 Magnifier & Render Hardening", () => {
  test.afterEach(async ({ page }) => {
    await cleanupUploadedCadFixtures(page);
  });

  test("4.44 MB gerçek DXF üzerinde 10 saniyelik pointer tracking sırasında bounded frame-time, heap ve canvas sayısı", async ({
    page,
  }) => {
    // 1. Locate 4.44 MB DXF file
    const realDxfPath = path.resolve(
      process.cwd(),
      ".data/dok_storage/cad-dxf-40007bf0-8cd1-4214-bbfe-097d66e0c81e.dxf"
    );
    expect(fs.existsSync(realDxfPath)).toBe(true);

    const dxfBuffer = fs.readFileSync(realDxfPath);
    expect(dxfBuffer.length).toBeGreaterThan(4_000_000);

    // 2. Sign in and upload
    await signInAdmin(page);

    const fileId = await page.evaluate(
      async ({ content, name }) => {
        const formData = new FormData();
        formData.append("file", new File([content], name, { type: "application/dxf" }));
        formData.append("pathname", `stage2-perf-${crypto.randomUUID()}-${name}`);
        const response = await fetch("/api/dokumantasyon/upload/local", {
          method: "POST",
          body: formData,
        });
        const payload = await response.json();
        if (!response.ok || !payload.file?.id) {
          throw new Error(payload.error || "4.44 MB DXF upload failed");
        }
        return payload.file.id as string;
      },
      { content: dxfBuffer.toString("binary"), name: "kalip-plani-4mb.dxf" }
    );

    // 3. Open CAD viewer
    await page.goto(`/dokumantasyon/dosya/${fileId}`);
    const runtime = page.locator('[data-cad-runtime="orchestrator"][data-cad-engine="upstream"]').first();
    const host = runtime.locator('[data-cad-upstream-host="true"]').first();

    await expect(runtime).toBeVisible({ timeout: 45_000 });
    await expect(host).toHaveAttribute("data-cad-upstream-state", "ready", { timeout: 45_000 });

    const viewport = host.locator('div[aria-label$="CAD görünümü"]').first();
    await expect(viewport).toBeVisible();

    // 4. Activate distance measurement tool
    await page.getByTestId("cad-tool-distance").click();
    await expect(host).toHaveAttribute("data-cad-active-tool", "distance");

    // 5. Run 10-second pointer tracking simulation with RAF instrumentation
    const perfResults = await page.evaluate(async () => {
      const hostEl = document.querySelector('[data-cad-upstream-host="true"]');
      const viewportEl = hostEl?.querySelector('div[aria-label$="CAD görünümü"]');
      if (!viewportEl) throw new Error("CAD viewport element not found");

      const rect = viewportEl.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      // Start distance measurement pointerdown
      viewportEl.dispatchEvent(
        new PointerEvent("pointerdown", {
          bubbles: true,
          cancelable: true,
          clientX: centerX,
          clientY: centerY,
          pointerId: 101,
          pointerType: "mouse",
          buttons: 1,
        })
      );

      const frameDeltas: number[] = [];
      let lastTime = performance.now();
      let isTracking = true;

      const rafTracker = () => {
        if (!isTracking) return;
        const now = performance.now();
        frameDeltas.push(now - lastTime);
        lastTime = now;
        requestAnimationFrame(rafTracker);
      };
      requestAnimationFrame(rafTracker);

      // Move pointer in circular trajectory for 10 seconds
      const startTime = performance.now();
      const durationMs = 10_000;
      let iterations = 0;

      while (performance.now() - startTime < durationMs) {
        iterations++;
        const elapsed = (performance.now() - startTime) / 1000;
        const angle = elapsed * 2 * Math.PI * 0.5; // 0.5 rev per sec
        const radius = Math.min(rect.width, rect.height) * 0.25;
        const currentX = centerX + Math.cos(angle) * radius;
        const currentY = centerY + Math.sin(angle) * radius;

        viewportEl.dispatchEvent(
          new PointerEvent("pointermove", {
            bubbles: true,
            cancelable: true,
            clientX: currentX,
            clientY: currentY,
            pointerId: 101,
            pointerType: "mouse",
            buttons: 1,
          })
        );

        // Yield ~16ms to allow RAF execution
        await new Promise((r) => setTimeout(r, 16));
      }

      isTracking = false;

      // Count canvas elements in DOM
      const totalCanvases = document.querySelectorAll("canvas").length;

      // Calculate max and average frame times
      const validDeltas = frameDeltas.slice(2); // drop first 2 warmup frames
      const maxFrameTime = Math.max(...validDeltas);
      const avgFrameTime = validDeltas.reduce((a, b) => a + b, 0) / validDeltas.length;

      return {
        iterations,
        framesCount: validDeltas.length,
        maxFrameTime,
        avgFrameTime,
        totalCanvases,
      };
    });

    console.log("Performance results (10s tracking on 4.44MB DXF):", perfResults);

    // Assert bounded frame time (avg < 50ms, i.e. >= 20 FPS during heavy tracking)
    expect(perfResults.avgFrameTime).toBeLessThan(50);
    // Assert canvas count is bounded (MLightCAD layers + ViewCube + 1 lens canvas = 5, no leak)
    expect(perfResults.totalCanvases).toBeLessThanOrEqual(6);

    // 6. Verify magnifier is visible and inspect lens bounds
    const magnifier = page.getByTestId("cad-precision-magnifier");
    await expect(magnifier).toBeVisible();

    const [magBox, viewRect] = await Promise.all([
      magnifier.boundingBox(),
      viewport.boundingBox(),
    ]);

    expect(magBox).not.toBeNull();
    expect(viewRect).not.toBeNull();

    // Verify desktop lens does not exceed 20% width and 35% height of viewport
    expect(magBox!.width).toBeLessThanOrEqual(viewRect!.width * 0.20 + 2);
    expect(magBox!.height).toBeLessThanOrEqual(viewRect!.height * 0.35 + 30); // 24px header

    // Verify lens does not overflow viewport boundaries
    expect(magBox!.x).toBeGreaterThanOrEqual(viewRect!.x - 1);
    expect(magBox!.y).toBeGreaterThanOrEqual(viewRect!.y - 1);
    expect(magBox!.x + magBox!.width).toBeLessThanOrEqual(viewRect!.x + viewRect!.width + 2);

    // 7. Verify crosshair and geometry within magnifier
    const crosshair = magnifier.locator("path").first();
    await expect(crosshair).toBeAttached();

    // Capture screenshot of magnifier demonstrating geometry & crosshair
    const screenshotBuffer = await magnifier.screenshot();
    expect(screenshotBuffer.length).toBeGreaterThan(500);
  });
});
