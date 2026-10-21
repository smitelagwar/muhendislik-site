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

  await page.goto("http://127.0.0.1:3000/dokumantasyon/dosya/bcec9dd8-39f3-44ca-9625-2c9fedddb5cf?cadEngine=v2");
  await page.waitForTimeout(6000);

  const sceneInspection = await page.evaluate(() => {
    const r = (window as unknown).__cadRenderer;
    const THREE = (window as unknown).THREE;
    const details: unknown[] = [];

    let totalMeshes = 0;
    let visibleMeshes = 0;

    r.scene.traverse((obj: unknown) => {
      if (obj.isMesh || obj.isLine || obj.isLineSegments) {
        totalMeshes++;
        if (obj.visible) visibleMeshes++;
        const geom = obj.geometry;
        geom.computeBoundingBox?.();
        const bbox = geom.boundingBox;
        const color = obj.material?.color ? [obj.material.color.r, obj.material.color.g, obj.material.color.b] : null;
        details.push({
          type: obj.type,
          name: obj.name,
          layer: obj.userData?.layer || obj.name,
          visible: obj.visible,
          color,
          opacity: obj.material?.opacity,
          bbox: bbox ? [bbox.min.x, bbox.min.y, bbox.max.x, bbox.max.y] : null,
          vertexCount: geom.attributes?.position?.count,
        });
      }
    });

    return {
      totalMeshes,
      visibleMeshes,
      activeLayout: r.getActiveLayout(),
      details,
    };
  });

  console.log("Total Meshes:", sceneInspection.totalMeshes, "Visible:", sceneInspection.visibleMeshes);
  console.log("Active Layout:", sceneInspection.activeLayout);
  for (const d of sceneInspection.details) {
    console.log(`- [${d.layer}] visible=${d.visible} count=${d.vertexCount} color=${JSON.stringify(d.color)} bbox=${JSON.stringify(d.bbox)}`);
  }

  await browser.close();
}

main().catch(console.error);
