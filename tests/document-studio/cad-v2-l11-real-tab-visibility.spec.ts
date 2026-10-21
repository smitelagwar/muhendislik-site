import { expect, test } from "@playwright/test";
import crypto from "node:crypto";
import { uploadCadPreviewV2Fixture, signInAdmin } from "./cad-test-helpers";
import { buildSceneChunk, SceneScalarType, SceneTag } from "../../src/lib/cad-v2/protocol/binary-protocol";

const { PNG } = require("pngjs") as {
  PNG: { sync: { read(bytes: Buffer): { width: number; height: number; data: Uint8Array } } };
};

function makeVisibilityScene() {
  const sceneId = "scene_l11_real_tab_visibility";
  const bbox: [number, number, number, number] = [-20, -20, 20, 20];
  const meta = new TextEncoder().encode(JSON.stringify({
    layoutId: "Model", chunkIndex: 0,
    drawCommands: [{ kind: "line", layer: "L11_VISIBILITY", color: [1, 0.05, 0.05], firstVertex: 0, vertexCount: 2, globalOrderIndex: 0, lineweightMm: 0.5 }],
  }));
  const chunk = buildSceneChunk([
    { tag: SceneTag.META, scalarType: SceneScalarType.U8, componentCount: 1, elementCount: meta.length, data: meta },
    { tag: SceneTag.ORIGIN, scalarType: SceneScalarType.F64, componentCount: 2, elementCount: 1, data: new Float64Array([0, 0]) },
    { tag: SceneTag.XY, scalarType: SceneScalarType.F32, componentCount: 2, elementCount: 2, data: new Float32Array([-18, 0, 18, 0]) },
  ]);
  const sha256 = crypto.createHash("sha256").update(chunk).digest("hex");
  return {
    sceneId,
    chunk,
    manifest: {
      schemaVersion: 1, sceneId, sourceVersionKey: "l11-real-tab-visibility", sourceSha256: "l11-real-tab-visibility",
      renderAbi: "three172-cad2d-v2", qualityStatus: "exact",
      diagnosticsSummary: { unknownEntityCount: 0, unknownObjectCount: 0, missingFontCount: 0, missingDependencyCount: 0, diagnosticCodes: [] },
      layouts: [{ layoutId: "Model", sourceName: "Model", kind: "model", bbox, units: 4 }],
      chunks: [{ chunkId: "chunk_l11_visibility", layoutId: "Model", chunkIndex: 0, bbox, byteLength: chunk.byteLength, sha256, maxHatchFillEncodedGeometryErrorWorld: 0 }],
    },
  };
}

async function measureRaster(png: Buffer) {
  const image = PNG.sync.read(png);
  const corners = [[0, 0], [image.width - 1, 0], [0, image.height - 1], [image.width - 1, image.height - 1]];
  const background = corners.map(([x, y]) => {
    const offset = (y * image.width + x) * 4;
    return [image.data[offset]!, image.data[offset + 1]!, image.data[offset + 2]!];
  })[0]!;
  let foregroundPixelCount = 0;
  for (let offset = 0; offset < image.data.length; offset += 4) {
    const delta = Math.max(Math.abs(image.data[offset]! - background[0]!), Math.abs(image.data[offset + 1]! - background[1]!), Math.abs(image.data[offset + 2]! - background[2]!));
    if (image.data[offset + 3]! >= 250 && delta >= 16) foregroundPixelCount++;
  }
  return { width: image.width, height: image.height, foregroundPixelCount };
}

test("L11 gerçek Chrome pencere background→restore 20 döngüde host ve rasterı korur", async ({ page, browser }, testInfo) => {
  test.setTimeout(180_000);
  await signInAdmin(page);
  const { fileId } = await uploadCadPreviewV2Fixture(page, "known-geometry-measurements", "l11-real-tab-visibility.dxf");
  const scene = makeVisibilityScene();
  let prepareCount = 0;
  let chunkCount = 0;
  await page.addInitScript(() => {
    const visibilityHistory: DocumentVisibilityState[] = [];
    Object.defineProperty(window, "__l11VisibilityHistory", { configurable: false, value: visibilityHistory });
    document.addEventListener("visibilitychange", () => visibilityHistory.push(document.visibilityState));
  });
  await page.route("**/api/dokumantasyon/cad-v2/prepare", async (route) => {
    prepareCount++;
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ status: "ready", sceneId: scene.sceneId, viewSessionId: "vs_l11_real_tab_visibility", sourceVersionKey: "l11-real-tab-visibility" }) });
  });
  await page.route("**/api/dokumantasyon/cad-v2/view-sessions/*/heartbeat", async (route) => route.fulfill({ status: 200, contentType: "application/json", body: "{}" }));
  await page.route("**/api/dokumantasyon/cad-v2/view-sessions/*", async (route) => route.fulfill({ status: 200, contentType: "application/json", body: "{}" }));
  await page.route(`**/api/dokumantasyon/cad-v2/scenes/${scene.sceneId}/manifest`, async (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(scene.manifest) }));
  await page.route(`**/api/dokumantasyon/cad-v2/scenes/${scene.sceneId}/chunks/*`, async (route) => {
    chunkCount++;
    await route.fulfill({ status: 200, contentType: "application/octet-stream", body: Buffer.from(scene.chunk) });
  });

  await page.goto(`/dokumantasyon/dosya/${fileId}?cadEngine=v2`);
  await expect(page.getByText("Varlık:")).toBeVisible();
  await expect(page.locator('[data-v2-phase="ready"]')).toHaveCount(1);
  const canvas = page.locator("canvas").last();
  await expect(canvas).toBeVisible();
  const before = await measureRaster(await canvas.screenshot());
  expect(before.foregroundPixelCount, "CAD canvas must contain the fixture line before tab switching").toBeGreaterThan(0);

  const browserCdp = await browser.newBrowserCDPSession();
  let browserWindowId: number | null = null;
  try {
    const targets = await browserCdp.send("Target.getTargets") as {
      targetInfos?: Array<{ targetId: string; type: string; url: string }>;
    };
    const target = targets.targetInfos?.find((item) => item.type === "page" && item.url === page.url());
    if (!target) throw new Error("Playwright page target was not found for Chrome window lifecycle testing.");
    const window = await browserCdp.send("Browser.getWindowForTarget", { targetId: target.targetId }) as { windowId: number };
    browserWindowId = window.windowId;
    for (let cycle = 1; cycle <= 20; cycle++) {
      await browserCdp.send("Browser.setWindowBounds", {
        windowId: browserWindowId,
        bounds: { windowState: "minimized" },
      });
      await expect.poll(() => page.evaluate(() => document.visibilityState), { timeout: 10_000 })
        .toBe("hidden");
      await browserCdp.send("Browser.setWindowBounds", {
        windowId: browserWindowId,
        bounds: { windowState: "normal" },
      });
      await expect.poll(() => page.evaluate(() => document.visibilityState), { timeout: 10_000 })
        .toBe("visible");
      await expect(page.locator('[data-v2-phase="ready"]')).toHaveCount(1);
    }
  } finally {
    if (browserWindowId !== null) {
      await browserCdp.send("Browser.setWindowBounds", {
        windowId: browserWindowId,
        bounds: { windowState: "normal" },
      }).catch(() => {});
    }
    await browserCdp.detach();
  }
  await expect(page.locator('[data-v2-phase="ready"]')).toHaveCount(1);
  const after = await measureRaster(await canvas.screenshot());
  expect(after.foregroundPixelCount, "CAD canvas must retain a non-empty raster after tab resume").toBeGreaterThan(0);
  expect(prepareCount).toBe(1);
  expect(chunkCount).toBe(1);
  const history = await page.evaluate(() => (window as unknown as { __l11VisibilityHistory: DocumentVisibilityState[] }).__l11VisibilityHistory);
  expect(history.filter((state) => state === "hidden").length).toBeGreaterThanOrEqual(20);
  expect(history.filter((state) => state === "visible").length).toBeGreaterThanOrEqual(20);
  await testInfo.attach("real-chrome-window-lifecycle-evidence.json", { body: JSON.stringify({ cycles: 20, mechanism: "Chrome Browser.setWindowBounds minimized/normal", hiddenEvents: history.filter((state) => state === "hidden").length, visibleEvents: history.filter((state) => state === "visible").length, prepareCount, chunkCount, before, after }, null, 2), contentType: "application/json" });
});
