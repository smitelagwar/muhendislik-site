import { chromium } from "playwright";
import path from "node:path";

async function main() {
  const browser = await chromium.launch({
    headless: true,
    args: [
      "--ignore-gpu-blocklist",
      "--enable-webgl",
      "--enable-webgl2",
      "--use-gl=angle",
      "--use-angle=swiftshader",
      "--in-process-gpu",
      "--disable-gpu-sandbox",
    ],
  });

  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  console.log("Navigating to Suheyla Kara DXF...");
  await page.goto("http://127.0.0.1:3000/dokumantasyon/dosya/ce39e43d-b018-4dc9-809e-650fc24ed278?cadEngine=v2");

  // Wait for ready/degraded phase
  const v2Host = page.locator("[data-cad-v2-host='true']").first();
  await v2Host.waitFor({ state: "visible", timeout: 30000 });

  console.log("Waiting for scene loading...");
  await page.waitForTimeout(15000);

  const diag = await page.evaluate(() => {
    const r = (window as unknown).__cadRenderer;
    if (!r) return { error: "No __cadRenderer" };

    const cam = r.camera;
    const camAdapter = r.cameraAdapter?.getState?.();
    const activeLayout = r.getActiveLayout();

    const layerCounts: Record<string, { count: number; visible: boolean; sampleColor: unknown }> = {};
    let totalMeshes = 0;
    let visibleMeshes = 0;
    let totalVertices = 0;

    r.scene.traverse((obj: unknown) => {
      if (obj.isMesh || obj.isLine || obj.isLineSegments) {
        totalMeshes++;
        if (obj.visible) visibleMeshes++;
        const layer = obj.userData?.layer || obj.name || "unknown";
        const vCount = obj.geometry?.attributes?.position?.count || 0;
        totalVertices += vCount;
        if (!layerCounts[layer]) {
          const col = obj.material?.color ? [obj.material.color.r, obj.material.color.g, obj.material.color.b] : null;
          layerCounts[layer] = { count: 0, visible: obj.visible, sampleColor: col };
        }
        layerCounts[layer].count += vCount;
      }
    });

    return {
      activeLayout,
      totalMeshes,
      visibleMeshes,
      totalVertices,
      camera: {
        pos: [cam.position.x, cam.position.y, cam.position.z],
        zoom: cam.zoom,
      },
      cameraAdapter: camAdapter,
      topLayers: Object.entries(layerCounts).sort((a, b) => b[1].count - a[1].count).slice(0, 15),
    };
  });

  console.log("Suheyla Scene Diagnostics:", JSON.stringify(diag, null, 2));

  // Take screenshot
  const screenshotPath = path.resolve(process.cwd(), "tests/visual-inspection/screenshots/suheyla_dxf_debug.png");
  await page.screenshot({ path: screenshotPath });
  console.log("Screenshot saved to:", screenshotPath);

  await browser.close();
}

main().catch(console.error);
