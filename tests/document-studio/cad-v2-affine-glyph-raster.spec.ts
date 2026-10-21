import { expect, test, type Page } from "@playwright/test";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import { cleanupUploadedCadFixtures, signInAdmin, uploadCadPreviewV2Fixture } from "./cad-test-helpers";

type CompiledRasterScene = {
  sceneId: string;
  manifest: Record<string, any>;
  chunks: Map<string, Buffer>;
};

function makeAffineGlyphRasterScenes(): CompiledRasterScene[] {
  const output = execFileSync(process.execPath, ["--import", "tsx", "tests/cad-v2/r07-affine-glyph-raster-scenes.ts"], {
    cwd: process.cwd(), encoding: "utf8", timeout: 15_000, windowsHide: true, maxBuffer: 2 * 1024 * 1024,
  });
  const compiled = JSON.parse(output) as {
    scenes: Array<{
      sceneId: string;
      manifest: Record<string, any>;
      chunks: Array<{ chunkId: string; chunkBase64: string }>;
    }>;
  };
  return compiled.scenes.map((scene) => ({
    sceneId: scene.sceneId,
    manifest: scene.manifest,
    chunks: new Map(scene.chunks.map(({ chunkId, chunkBase64 }) => [chunkId, Buffer.from(chunkBase64, "base64")])),
  }));
}

async function captureRedRaster(page: Page) {
  const canvas = page.locator("canvas").first();
  const screenshot = await canvas.screenshot();
  const sampled = await page.evaluate(async (pngBase64) => {
    const image = new Image();
    image.src = `data:image/png;base64,${pngBase64}`;
    await image.decode();
    const sample = document.createElement("canvas");
    sample.width = image.naturalWidth;
    sample.height = image.naturalHeight;
    const context = sample.getContext("2d");
    if (!context) throw new Error("Could not sample the WebGL canvas screenshot");
    context.drawImage(image, 0, 0);
    const pixels = context.getImageData(0, 0, sample.width, sample.height).data;
    let redPixels = 0;
    let maskChecksum = 2166136261;
    for (let pixel = 0; pixel < pixels.length / 4; pixel++) {
      const offset = pixel * 4;
      if (pixels[offset]! > 80 && pixels[offset]! > pixels[offset + 1]! * 1.6 + 20 &&
          pixels[offset]! > pixels[offset + 2]! * 1.6 + 20) {
        redPixels++;
        maskChecksum = Math.imul(maskChecksum ^ pixel, 16777619);
      }
    }
    return { width: sample.width, height: sample.height, redPixels, maskChecksum: maskChecksum >>> 0 };
  }, screenshot.toString("base64"));
  return { ...sampled, screenshotSha256: crypto.createHash("sha256").update(screenshot).digest("hex") };
}

test.describe("CAD V2 R07-F — nested affine SHX curve raster", () => {
  test.afterEach(async ({ page }) => {
    if (process.env.CAD_V2_PRESERVE_TEST_FIXTURES === "1") return;
    await cleanupUploadedCadFixtures(page);
  });

  test("curved SHAPE glyph raster is invariant to Model and paper viewport chunk partition", async ({ page }) => {
    await signInAdmin(page);
    const scenes = makeAffineGlyphRasterScenes();
    expect(scenes).toHaveLength(2);
    const [singleScene, splitScene] = scenes;
    if (!singleScene || !splitScene) throw new Error("Expected single and split compiler output for the affine SHX glyph fixture");

    const chunksForLayout = (scene: CompiledRasterScene, layoutId: string) =>
      scene.manifest.chunks.filter((chunk: { layoutId: string }) => chunk.layoutId === layoutId);
    const singleModelChunks = chunksForLayout(singleScene, "Model");
    const splitModelChunks = chunksForLayout(splitScene, "Model");
    const singlePaperChunks = chunksForLayout(singleScene, "SHEET");
    const splitPaperChunks = chunksForLayout(splitScene, "SHEET");
    expect(singleScene.manifest.qualityStatus).toBe("exact");
    expect(splitScene.manifest.qualityStatus).toBe("exact");
    expect(singleScene.manifest.diagnosticsSummary.diagnosticCodes).toEqual([]);
    expect(splitScene.manifest.diagnosticsSummary.diagnosticCodes).toEqual([]);
    expect(singleScene.manifest.layouts.map((layout: { layoutId: string }) => layout.layoutId)).toEqual(["Model", "SHEET"]);
    expect(singleModelChunks).toHaveLength(1);
    expect(splitModelChunks.length).toBeGreaterThan(1);
    expect(singlePaperChunks).toHaveLength(1);
    expect(splitPaperChunks.length).toBeGreaterThan(1);

    const { fileId: singleFileId } = await uploadCadPreviewV2Fixture(page, "known-geometry-measurements");
    const { fileId: splitFileId } = await uploadCadPreviewV2Fixture(page, "known-geometry-measurements");
    const scenesById = new Map(scenes.map((scene) => [scene.sceneId, scene]));
    const scenesByFileId = new Map([[singleFileId, singleScene], [splitFileId, splitScene]]);

    await page.route("**/api/dokumantasyon/cad-v2/prepare", async (route) => {
      const request = route.request().postDataJSON() as { fileId?: string };
      const scene = request.fileId ? scenesByFileId.get(request.fileId) : undefined;
      if (!scene) {
        await route.fulfill({ status: 404, contentType: "application/json", body: JSON.stringify({ error: "R07 glyph fixture not found" }) });
        return;
      }
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({
        status: "ready", sceneId: scene.sceneId, viewSessionId: `vs_${scene.sceneId}`,
        sourceVersionKey: scene.manifest.sourceVersionKey,
      }) });
    });
    await page.route("**/api/dokumantasyon/cad-v2/scenes/*/manifest", async (route) => {
      const sceneId = new URL(route.request().url()).pathname.split("/").at(-2)!;
      const scene = scenesById.get(sceneId);
      if (!scene) {
        await route.fulfill({ status: 404, contentType: "application/json", body: JSON.stringify({ error: "R07 glyph scene not found" }) });
        return;
      }
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(scene.manifest) });
    });
    await page.route("**/api/dokumantasyon/cad-v2/scenes/*/chunks/*", async (route) => {
      const pathParts = new URL(route.request().url()).pathname.split("/");
      const scene = scenesById.get(pathParts.at(-3)!);
      const chunk = scene?.chunks.get(pathParts.at(-1)!);
      if (!chunk) {
        await route.fulfill({ status: 404, contentType: "application/json", body: JSON.stringify({ error: "R07 glyph chunk not found" }) });
        return;
      }
      await route.fulfill({ status: 200, contentType: "application/octet-stream", body: chunk });
    });
    await page.route("**/api/dokumantasyon/cad-v2/view-sessions/*/heartbeat", async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ status: "ok" }) });
    });

    const captureLayout = async (fileId: string, layoutId: "Model" | "SHEET") => {
      await page.goto(`/dokumantasyon/dosya/${fileId}?cadEngine=v2`);
      const picker = page.getByRole("combobox", { name: "Pafta seçimi" });
      await expect(picker).toBeVisible({ timeout: 60_000 });
      await expect(picker).toHaveValue("Model");
      const canvas = page.locator("canvas").first();
      await expect(canvas).toBeVisible();
      await expect(page.getByText("Varlık:")).toBeVisible({ timeout: 60_000 });
      let raster = await captureRedRaster(page);
      await expect.poll(async () => {
        raster = await captureRedRaster(page);
        return raster.redPixels;
      }, { timeout: 15_000 }).toBeGreaterThan(20);
      if (layoutId === "SHEET") {
        const modelRaster = raster;
        await picker.selectOption({ label: "R07 affine curved SHX" });
        await expect(picker).toHaveValue("R07 affine curved SHX");
        await expect.poll(async () => {
          raster = await captureRedRaster(page);
          return raster.screenshotSha256;
        }, { timeout: 15_000 }).not.toBe(modelRaster.screenshotSha256);
        await expect.poll(async () => {
          raster = await captureRedRaster(page);
          return raster.redPixels;
        }, { timeout: 15_000 }).toBeGreaterThan(20);
      }
      return raster;
    };

    const singleModelRaster = await captureLayout(singleFileId, "Model");
    const splitModelRaster = await captureLayout(splitFileId, "Model");
    expect(singleModelRaster.redPixels).toBeGreaterThan(20);
    expect(splitModelRaster.redPixels).toBe(singleModelRaster.redPixels);
    expect(splitModelRaster.maskChecksum).toBe(singleModelRaster.maskChecksum);
    expect(splitModelRaster.screenshotSha256).toBe(singleModelRaster.screenshotSha256);

    const singlePaperRaster = await captureLayout(singleFileId, "SHEET");
    const splitPaperRaster = await captureLayout(splitFileId, "SHEET");
    expect(splitPaperRaster.redPixels).toBe(singlePaperRaster.redPixels);
    expect(splitPaperRaster.maskChecksum).toBe(singlePaperRaster.maskChecksum);
    expect(splitPaperRaster.screenshotSha256).toBe(singlePaperRaster.screenshotSha256);

    console.log("R07-F nested affine curved SHX glyph WebGL chunk and paper viewport raster parity PASS: " + JSON.stringify({
      chunks: {
        model: [singleModelChunks.length, splitModelChunks.length],
        paper: [singlePaperChunks.length, splitPaperChunks.length],
      },
      modelRaster: singleModelRaster,
      paperRaster: singlePaperRaster,
    }));
  });
});
