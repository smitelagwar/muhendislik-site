import { chromium } from "playwright";

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
  await page.goto("http://127.0.0.1:3000/dokumantasyon/dosya/ce39e43d-b018-4dc9-809e-650fc24ed278?cadEngine=v2");
  await page.waitForTimeout(15000);

  const coords = await page.evaluate(() => {
    const r = (window as unknown).__cadRenderer;
    const camAdapter = r.cameraAdapter?.getState?.();
    const THREE = (window as unknown).THREE;

    let worldMinX = Infinity, worldMinY = Infinity, worldMaxX = -Infinity, worldMaxY = -Infinity;

    r.scene.traverse((obj: unknown) => {
      if ((obj.isMesh || obj.isLine || obj.isLineSegments) && obj.visible) {
        const parentPos = obj.parent?.position || { x: 0, y: 0 };
        const geom = obj.geometry;
        geom.computeBoundingBox?.();
        const b = geom.boundingBox;
        if (b) {
          const x0 = b.min.x + parentPos.x;
          const y0 = b.min.y + parentPos.y;
          const x1 = b.max.x + parentPos.x;
          const y1 = b.max.y + parentPos.y;
          worldMinX = Math.min(worldMinX, x0);
          worldMinY = Math.min(worldMinY, y0);
          worldMaxX = Math.max(worldMaxX, x1);
          worldMaxY = Math.max(worldMaxY, y1);
        }
      }
    });

    // Camera viewport in Three.js coordinates
    const cam = r.camera;
    return {
      renderedWorldBounds: [worldMinX, worldMinY, worldMaxX, worldMaxY],
      cameraOrtho: {
        left: cam.left,
        right: cam.right,
        top: cam.top,
        bottom: cam.bottom,
        near: cam.near,
        far: cam.far,
        pos: [cam.position.x, cam.position.y, cam.position.z],
      },
      cameraAdapter: camAdapter,
    };
  });

  console.log("Coordinate comparison:", JSON.stringify(coords, null, 2));

  await browser.close();
}

main().catch(console.error);
