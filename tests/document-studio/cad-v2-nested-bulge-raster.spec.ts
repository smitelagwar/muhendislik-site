import { expect, test, type Page } from "@playwright/test";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import { cleanupUploadedCadFixtures, signInAdmin, uploadCadPreviewV2Fixture } from "./cad-test-helpers";

type BulgeRuntimeProfile = {
  start: [number, number];
  end: [number, number];
  bulge: number;
  inner: { basePoint: [number, number]; insertionPoint: [number, number]; scale: [number, number, number]; rotationRad: number };
  outer: { basePoint: [number, number]; insertionPoint: [number, number]; scale: [number, number, number]; rotationRad: number };
};

function applyIndependentInsertTransform(
  point: [number, number],
  transform: BulgeRuntimeProfile["inner"],
): [number, number] {
  const x = (point[0] - transform.basePoint[0]) * transform.scale[0];
  const y = (point[1] - transform.basePoint[1]) * transform.scale[1];
  const cosine = Math.cos(transform.rotationRad);
  const sine = Math.sin(transform.rotationRad);
  return [
    transform.insertionPoint[0] + cosine * x - sine * y,
    transform.insertionPoint[1] + sine * x + cosine * y,
  ];
}

function makeIndependentNestedBulgeSamples(profile: BulgeRuntimeProfile, sampleCount = 4096): [number, number][] {
  const dx = profile.end[0] - profile.start[0];
  const dy = profile.end[1] - profile.start[1];
  const chordLength = Math.hypot(dx, dy);
  const midpoint: [number, number] = [(profile.start[0] + profile.end[0]) / 2, (profile.start[1] + profile.end[1]) / 2];
  const centerOffset = chordLength * (1 - profile.bulge * profile.bulge) / (4 * profile.bulge);
  const center: [number, number] = [
    midpoint[0] - dy / chordLength * centerOffset,
    midpoint[1] + dx / chordLength * centerOffset,
  ];
  const radius = Math.hypot(profile.start[0] - center[0], profile.start[1] - center[1]);
  const startAngle = Math.atan2(profile.start[1] - center[1], profile.start[0] - center[0]);
  const sweep = 4 * Math.atan(profile.bulge);
  const points: [number, number][] = [];
  for (let sample = 0; sample <= sampleCount; sample++) {
    const angle = startAngle + sweep * sample / sampleCount;
    const localPoint: [number, number] = [
      center[0] + radius * Math.cos(angle),
      center[1] + radius * Math.sin(angle),
    ];
    points.push(applyIndependentInsertTransform(
      applyIndependentInsertTransform(localPoint, profile.inner),
      profile.outer,
    ));
  }
  return points;
}

function makeNestedBulgeRuntimeScene() {
  const output = execFileSync(process.execPath, [
    "--import", "tsx", "tests/cad-v2/f07-nested-bulge-runtime-scene.ts",
  ], {
    cwd: process.cwd(),
    encoding: "utf8",
    timeout: 30_000,
    windowsHide: true,
    maxBuffer: 4 * 1024 * 1024,
  });
  const compiled = JSON.parse(output) as {
    sceneId: string;
    manifest: { sceneId: string; sourceVersionKey: string; chunks: Array<{ chunkId: string; layoutId: string }> };
    chunks: Array<{ chunkId: string; chunkBase64: string }>;
    profile: BulgeRuntimeProfile;
    curveSourceRefs: Array<{ sourceType: string; sourceHandle: string }>;
  };
  const scene = {
    sceneId: compiled.sceneId,
    manifest: compiled.manifest,
    chunks: new Map(compiled.chunks.map(({ chunkId, chunkBase64 }) => [chunkId, Buffer.from(chunkBase64, "base64")])),
  };
  return {
    scene,
    curveSourceRefs: compiled.curveSourceRefs,
    profile: compiled.profile,
    sourcePoints: makeIndependentNestedBulgeSamples(compiled.profile),
  };
}

async function configureNestedBulgePage(
  page: Page,
  scene: ReturnType<typeof makeNestedBulgeRuntimeScene>["scene"],
  sessionId: string,
): Promise<void> {
  await page.addInitScript(() => {
    const state = {
      targetErrors: [] as number[],
      refinedReplies: 0,
      maxLineVertexCount: 0,
      bulgeSourceRefs: 0,
    };
    (window as Window & { __cadV2F07NestedBulge?: typeof state }).__cadV2F07NestedBulge = state;

    const NativeWorker = window.Worker;
    window.Worker = new Proxy(NativeWorker, {
      construct(target, args, newTarget) {
        const worker = Reflect.construct(target, args, newTarget) as Worker;
        worker.addEventListener("message", (event) => {
          const message = event.data as {
            kind?: string;
            payload?: { meta?: { curveSourceRefs?: Array<{ sourceType?: string }> } };
          };
          if (message.kind === "refined-curves") state.refinedReplies++;
          if (message.kind === "chunk") {
            state.bulgeSourceRefs = message.payload?.meta?.curveSourceRefs
              ?.filter((ref) => ref.sourceType === "BULGE").length ?? 0;
          }
        });
        return worker;
      },
    });

    const nativePostMessage = Worker.prototype.postMessage as unknown as (
      this: Worker,
      message: unknown,
      transferOrOptions?: Transferable[] | StructuredSerializeOptions,
    ) => void;
    function instrumentedPostMessage(this: Worker, message: unknown, transfer: Transferable[]): void;
    function instrumentedPostMessage(this: Worker, message: unknown, options?: StructuredSerializeOptions): void;
    function instrumentedPostMessage(
      this: Worker,
      message: unknown,
      transferOrOptions?: Transferable[] | StructuredSerializeOptions,
    ): void {
      if (message && typeof message === "object" && (message as { kind?: string }).kind === "refine-curves") {
        const target = (message as { payload?: { targetErrorCssPixels?: number } }).payload?.targetErrorCssPixels;
        if (typeof target === "number") state.targetErrors.push(target);
      }
      return nativePostMessage.call(this, message, transferOrOptions);
    }
    Worker.prototype.postMessage = instrumentedPostMessage;

    const nativeDrawArrays = WebGL2RenderingContext.prototype.drawArrays;
    WebGL2RenderingContext.prototype.drawArrays = function(mode: number, first: number, count: number) {
      if (mode === 0x0001) state.maxLineVertexCount = Math.max(state.maxLineVertexCount, count);
      return nativeDrawArrays.call(this, mode, first, count);
    };
  });

  await page.route("**/api/dokumantasyon/cad-v2/prepare", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        status: "ready",
        sceneId: scene.manifest.sceneId,
        viewSessionId: sessionId,
        sourceVersionKey: scene.manifest.sourceVersionKey,
      }),
    });
  });
  await page.route("**/api/dokumantasyon/cad-v2/view-sessions/" + sessionId + "/heartbeat", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ expiresAt: Date.now() + 180_000 }),
    });
  });
  await page.route("**/api/dokumantasyon/cad-v2/scenes/" + scene.manifest.sceneId + "/manifest", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(scene.manifest) });
  });
  await page.route("**/api/dokumantasyon/cad-v2/scenes/" + scene.manifest.sceneId + "/chunks/*", async (route) => {
    const chunkId = new URL(route.request().url()).pathname.split("/").at(-1)!;
    const chunk = scene.chunks.get(chunkId);
    if (!chunk) {
      await route.fulfill({
        status: 404,
        contentType: "application/json",
        body: JSON.stringify({ error: "F07 nested BULGE chunk not found" }),
      });
      return;
    }
    await route.fulfill({ status: 200, contentType: "application/octet-stream", body: Buffer.from(chunk) });
  });
}

async function measureNestedBulgeRasterError({
  screenshotBase64,
  sourcePoints,
  camera,
}: {
  screenshotBase64: string;
  sourcePoints: [number, number][];
  camera: { x: number; y: number; k: number };
}) {
  const image = new Image();
  image.src = "data:image/png;base64," + screenshotBase64;
  await image.decode();
  const canvas = document.createElement("canvas");
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Cannot sample nested BULGE WebGL screenshot");
  context.drawImage(image, 0, 0);

  const input = document.querySelector<HTMLElement>('[aria-label="CAD V2 Çizim Etkileşim Alanı"]');
  if (!input) throw new Error("CAD camera input surface is missing");
  const width = input.clientWidth;
  const height = input.clientHeight;
  const scaleX = image.naturalWidth / width;
  const scaleY = image.naturalHeight / height;
  const sourceSamples = sourcePoints.map(([worldX, worldY]) => ({
    x: camera.x + worldX * camera.k,
    y: camera.y - worldY * camera.k,
  }));
  const bounds = {
    minX: Math.min(...sourceSamples.map((point) => point.x)),
    minY: Math.min(...sourceSamples.map((point) => point.y)),
    maxX: Math.max(...sourceSamples.map((point) => point.x)),
    maxY: Math.max(...sourceSamples.map((point) => point.y)),
  };
  const xStart = Math.max(0, Math.floor((bounds.minX - 12) * scaleX));
  const xEnd = Math.min(canvas.width, Math.ceil((bounds.maxX + 12) * scaleX));
  const yStart = Math.max(0, Math.floor((bounds.minY - 12) * scaleY));
  const yEnd = Math.min(canvas.height, Math.ceil((bounds.maxY + 12) * scaleY));
  const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
  const rendered: Array<{ x: number; y: number }> = [];
  let maximumRenderedToSourceCssPixels = 0;
  for (let y = yStart; y < yEnd; y++) {
    for (let x = xStart; x < xEnd; x++) {
      const offset = (y * canvas.width + x) * 4;
      const red = pixels[offset]!;
      const green = pixels[offset + 1]!;
      const blue = pixels[offset + 2]!;
      if (!(blue > 80 && blue > red * 1.3 && blue > green * 1.05)) continue;
      const point = { x: (x + 0.5) / scaleX, y: (y + 0.5) / scaleY };
      rendered.push(point);
      let nearest = Number.POSITIVE_INFINITY;
      for (const source of sourceSamples) nearest = Math.min(nearest, Math.hypot(point.x - source.x, point.y - source.y));
      maximumRenderedToSourceCssPixels = Math.max(maximumRenderedToSourceCssPixels, nearest);
    }
  }

  let maximumSourceToRenderedCssPixels = 0;
  for (const source of sourceSamples) {
    let nearest = Number.POSITIVE_INFINITY;
    for (const point of rendered) nearest = Math.min(nearest, Math.hypot(point.x - source.x, point.y - source.y));
    maximumSourceToRenderedCssPixels = Math.max(maximumSourceToRenderedCssPixels, nearest);
  }
  return {
    renderedPixelCount: rendered.length,
    sourceSampleCount: sourceSamples.length,
    maximumRenderedToSourceCssPixels,
    maximumSourceToRenderedCssPixels,
    sourceBoundsCssPixels: bounds,
    camera,
    cssWidth: width,
    cssHeight: height,
    imageWidth: image.naturalWidth,
    imageHeight: image.naturalHeight,
  };
}

test.describe("CAD V2 F07 — nested transformed BULGE rendered-error cell", () => {
  test.afterEach(async ({ page }) => {
    if (process.env.CAD_V2_PRESERVE_TEST_FIXTURES === "1") return;
    await cleanupUploadedCadFixtures(page);
  });

  test("runtime-refined nested mirrored BULGE stays inside an independent raster envelope at DPR2", async ({ browser, page }) => {
    test.setTimeout(150_000);
    await signInAdmin(page);
    const { fileId } = await uploadCadPreviewV2Fixture(page, "known-geometry-measurements");
    const fixture = makeNestedBulgeRuntimeScene();
    expect(fixture.curveSourceRefs.length).toBeGreaterThan(0);
    expect(fixture.curveSourceRefs.every((ref) => ref.sourceType === "BULGE")).toBe(true);
    expect(fixture.curveSourceRefs.some((ref) => ref.sourceHandle === "F07_NESTED_RUNTIME_BULGE")).toBe(true);

    const context = await browser.newContext({
      baseURL: new URL(page.url()).origin,
      deviceScaleFactor: 2,
      viewport: { width: 1280, height: 720 },
      storageState: await page.context().storageState(),
    });
    try {
      const bulgePage = await context.newPage();
      const sessionId = "vs_f07_nested_transformed_bulge_dpr2";
      await configureNestedBulgePage(bulgePage, fixture.scene, sessionId);
      await bulgePage.goto("/dokumantasyon/dosya/" + fileId + "?cadEngine=v2", { timeout: 45_000 });
      const canvas = bulgePage.locator("canvas").first();
      await expect(canvas).toBeVisible({ timeout: 60_000 });
      await expect(bulgePage.getByText("Varlık:")).toBeVisible({ timeout: 60_000 });

      const readState = () => bulgePage.evaluate(() => {
        const state = (window as Window & {
          __cadV2F07NestedBulge?: {
            targetErrors: number[];
            refinedReplies: number;
            maxLineVertexCount: number;
            bulgeSourceRefs: number;
          };
        }).__cadV2F07NestedBulge;
        if (!state) throw new Error("F07 nested BULGE instrumentation is missing");
        return {
          targetErrors: [...state.targetErrors],
          refinedReplies: state.refinedReplies,
          maxLineVertexCount: state.maxLineVertexCount,
          bulgeSourceRefs: state.bulgeSourceRefs,
        };
      });
      const waitForQuiet = async (minimumRequests: number, label: string) => {
        await expect.poll(async () => {
          const state = await readState();
          return state.targetErrors.length >= minimumRequests &&
            state.targetErrors.at(-1) === 0.25 &&
            state.refinedReplies === state.targetErrors.length &&
            state.maxLineVertexCount > 2 &&
            state.bulgeSourceRefs > 0;
        }, { timeout: 30_000, intervals: [100, 250, 500, 1000] }).toBe(true);
        let snapshot = await readState();
        let stableIntervals = 0;
        for (let attempt = 0; attempt < 8 && stableIntervals < 2; attempt++) {
          await bulgePage.waitForTimeout(350);
          const next = await readState();
          stableIntervals = JSON.stringify(next) === JSON.stringify(snapshot) ? stableIntervals + 1 : 0;
          snapshot = next;
        }
        expect(stableIntervals, label + " must settle with no pending worker replies").toBeGreaterThanOrEqual(2);
        expect(snapshot.refinedReplies).toBe(snapshot.targetErrors.length);
        expect(snapshot.targetErrors.at(-1)).toBe(0.25);
        return snapshot;
      };

      const initialState = await waitForQuiet(1, "initial nested BULGE refinement");
      const rasterContext = await bulgePage.evaluate(() => {
        const canvasElement = document.querySelector("canvas");
        const input = document.querySelector<HTMLElement & { __zoom?: { x: number; y: number; k: number } }>(
          '[aria-label="CAD V2 Çizim Etkileşim Alanı"]',
        );
        if (!canvasElement || !input?.__zoom) throw new Error("F07 nested BULGE canvas/camera is missing");
        return {
          devicePixelRatio: window.devicePixelRatio,
          cssWidth: canvasElement.clientWidth,
          cssHeight: canvasElement.clientHeight,
          drawingBufferWidth: canvasElement.width,
          drawingBufferHeight: canvasElement.height,
          camera: { ...input.__zoom },
        };
      });
      expect(rasterContext.devicePixelRatio).toBe(2);
      expect(rasterContext.drawingBufferWidth).toBe(rasterContext.cssWidth * 2);
      expect(rasterContext.drawingBufferHeight).toBe(rasterContext.cssHeight * 2);

      const readFrameHash = async () => crypto.createHash("sha256")
        .update(await canvas.screenshot({ scale: "device" })).digest("hex");
      const beforeZoomHash = await readFrameHash();
      const beforeZoomState = await readState();
      await bulgePage.getByRole("button", { name: "Uzaklaştır (-)" }).click();
      await expect(bulgePage.getByText("80%")).toBeVisible();
      await expect.poll(readFrameHash, { timeout: 5_000 }).not.toBe(beforeZoomHash);
      const cameraAfterZoom = await bulgePage.evaluate(() => {
        const input = document.querySelector<HTMLElement & { __zoom?: { x: number; y: number; k: number } }>(
          '[aria-label="CAD V2 Çizim Etkileşim Alanı"]',
        );
        if (!input?.__zoom) throw new Error("F07 nested BULGE camera is missing after zoom-out");
        return { ...input.__zoom };
      });
      expect(cameraAfterZoom.k / rasterContext.camera.k).toBeCloseTo(0.8, 6);
      const zoomState = await waitForQuiet(beforeZoomState.targetErrors.length + 1, "80% nested BULGE zoom-out refinement");

      const panCssPixels = { x: 24, y: 12 };
      const input = bulgePage.getByLabel("CAD V2 Çizim Etkileşim Alanı");
      const bounds = await input.boundingBox();
      expect(bounds).not.toBeNull();
      const beforePanHash = await readFrameHash();
      await bulgePage.mouse.move(bounds!.x + bounds!.width / 2, bounds!.y + bounds!.height / 2);
      await bulgePage.mouse.down();
      await bulgePage.mouse.move(
        bounds!.x + bounds!.width / 2 + panCssPixels.x,
        bounds!.y + bounds!.height / 2 + panCssPixels.y,
        { steps: 4 },
      );
      await bulgePage.mouse.up();
      await expect.poll(readFrameHash, { timeout: 5_000 }).not.toBe(beforePanHash);
      const cameraAfterPan = await bulgePage.evaluate(() => {
        const surface = document.querySelector<HTMLElement & { __zoom?: { x: number; y: number; k: number } }>(
          '[aria-label="CAD V2 Çizim Etkileşim Alanı"]',
        );
        if (!surface?.__zoom) throw new Error("F07 nested BULGE camera is missing after pan");
        return { ...surface.__zoom };
      });
      expect(cameraAfterPan.x - cameraAfterZoom.x).toBeCloseTo(panCssPixels.x, 6);
      expect(cameraAfterPan.y - cameraAfterZoom.y).toBeCloseTo(panCssPixels.y, 6);
      expect(cameraAfterPan.k).toBeCloseTo(cameraAfterZoom.k, 12);
      await bulgePage.waitForTimeout(700);
      const afterPanState = await readState();
      expect(afterPanState).toEqual(zoomState);

      const screenshot = await canvas.screenshot({ scale: "device" });
      const rasterError = await bulgePage.evaluate(measureNestedBulgeRasterError, {
        screenshotBase64: screenshot.toString("base64"),
        sourcePoints: fixture.sourcePoints,
        camera: cameraAfterPan,
      });
      expect(rasterError.imageWidth).toBe(rasterContext.cssWidth * 2);
      expect(rasterError.imageHeight).toBe(rasterContext.cssHeight * 2);
      expect(rasterError.renderedPixelCount).toBeGreaterThan(100);
      expect(rasterError.sourceSampleCount).toBe(4097);
      expect(rasterError.sourceBoundsCssPixels.minX).toBeGreaterThanOrEqual(0);
      expect(rasterError.sourceBoundsCssPixels.minY).toBeGreaterThanOrEqual(0);
      expect(rasterError.sourceBoundsCssPixels.maxX).toBeLessThan(rasterContext.cssWidth);
      expect(rasterError.sourceBoundsCssPixels.maxY).toBeLessThan(rasterContext.cssHeight);
      expect(rasterError.maximumRenderedToSourceCssPixels,
        "Nested mirrored BULGE WebGL pixels exceeded the independent analytic-arc envelope: " + JSON.stringify(rasterError))
        .toBeLessThanOrEqual(1.25);
      expect(rasterError.maximumSourceToRenderedCssPixels,
        "Independent nested BULGE samples had an uncovered WebGL raster gap: " + JSON.stringify(rasterError))
        .toBeLessThanOrEqual(1.25);
      console.log("F07 nested mirrored BULGE DPR2 runtime raster envelope PASS: " + JSON.stringify({
        initialState,
        rasterContext,
        cameraAfterZoom,
        cameraAfterPan,
        zoomState,
        afterPanState,
        rasterError,
      }));
    } finally {
      await context.close();
    }
  });
});
