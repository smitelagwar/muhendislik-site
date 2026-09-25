import { expect, test, type Page } from "@playwright/test";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import { uploadCadPreviewV2Fixture, signInAdmin, cleanupUploadedCadFixtures } from "./cad-test-helpers";
import { buildSceneChunk, parseSceneChunk, SceneScalarType, SceneTag } from "../../src/lib/cad-v2/protocol/binary-protocol";

function makeBrowserAcceptanceScene() {
  const sceneId = "scene_f06_browser_layout_acceptance";
  const bbox: [number, number, number, number] = [-50, -50, 50, 50];
  const createChunk = (layoutId: string, xy: number[], color: [number, number, number]) => {
    const meta = new TextEncoder().encode(JSON.stringify({
      layoutId,
      chunkIndex: layoutId === "Model" ? 0 : 1,
      drawCommands: [{ kind: "line", layer: "GEOMETRY", color, firstVertex: 0, vertexCount: 2, lineweightMm: 0.5 }],
    }));
    return buildSceneChunk([
      { tag: SceneTag.META, scalarType: SceneScalarType.U8, componentCount: 1, elementCount: meta.length, data: meta },
      { tag: SceneTag.ORIGIN, scalarType: SceneScalarType.F64, componentCount: 2, elementCount: 1, data: new Float64Array([0, 0]) },
      { tag: SceneTag.XY, scalarType: SceneScalarType.F32, componentCount: 2, elementCount: 2, data: new Float32Array(xy) },
    ]);
  };
  const chunks = new Map([
    ["chunk_100", createChunk("Model", [-40, 0, 40, 0], [1, 0.1, 0.1])],
    ["chunk_200", createChunk("SHEET_A", [0, -40, 0, 40], [0.1, 0.8, 1])],
  ]);
  const manifest = {
    schemaVersion: 1,
    sceneId,
    sourceVersionKey: "f06-browser-layout-fixture",
    sourceSha256: "f06-browser-layout-fixture",
    renderAbi: "three172-cad2d-v2",
    qualityStatus: "exact",
    diagnosticsSummary: { unknownEntityCount: 0, unknownObjectCount: 0, missingFontCount: 0, missingDependencyCount: 0, diagnosticCodes: [] },
    layouts: [
      { layoutId: "Model", sourceName: "Model", kind: "model", bbox, units: 4 },
      { layoutId: "SHEET_A", sourceName: "SHEET_A", kind: "paper", bbox, units: 4 },
    ],
    chunks: Array.from(chunks, ([chunkId, bytes]) => ({
      chunkId,
      byteLength: bytes.byteLength,
      sha256: crypto.createHash("sha256").update(bytes).digest("hex"),
      layoutId: chunkId === "chunk_100" ? "Model" : "SHEET_A",
    })),
  };
  return { sceneId, chunks, manifest };
}

function makeBrowserCurveRefinementScene() {
  const sceneId = "scene_f07_camera_curve_refinement";
  const bbox: [number, number, number, number] = [-50, -50, 50, 50];
  const layoutId = "Model";
  const meta = new TextEncoder().encode(JSON.stringify({
    layoutId,
    chunkIndex: 0,
    drawCommands: [{ kind: "line", layer: "CURVE", color: [0.2, 0.75, 1], firstVertex: 0, vertexCount: 2, order: 0, lineweightMm: 0 }],
    curveSourceRefs: [{
      curveId: "F07-CAMERA-ARC", sourceHandle: "F07A1", sourceType: "ARC", firstSegmentIndex: 0,
      segmentCount: 1, curveRecordIndex: 0, firstVertex: 0, vertexCount: 2,
    }],
  }));
  const chunk = buildSceneChunk([
    { tag: SceneTag.META, scalarType: SceneScalarType.U8, componentCount: 1, elementCount: meta.length, data: meta },
    { tag: SceneTag.ORIGIN, scalarType: SceneScalarType.F64, componentCount: 2, elementCount: 1, data: new Float64Array([0, 0]) },
    { tag: SceneTag.XY, scalarType: SceneScalarType.F32, componentCount: 2, elementCount: 2, data: new Float32Array([40, 0, 0, 40]) },
    { tag: SceneTag.DRAW_RUNS, scalarType: SceneScalarType.U32, componentCount: 8, elementCount: 1, data: new Uint32Array([0, 0, 2, 0, 0, 0, 0, 0]) },
    { tag: SceneTag.PATH_DISTANCE, scalarType: SceneScalarType.F32, componentCount: 1, elementCount: 2, data: new Float32Array([0, 20 * Math.PI]) },
    { tag: SceneTag.CURVE_DATA, scalarType: SceneScalarType.F32, componentCount: 8, elementCount: 1, data: new Float32Array([0, 0, 40, 0, 0, 40, 0, Math.PI / 2]) },
  ]);
  const chunks = new Map([["chunk_f07_curve", chunk]]);
  const manifest = {
    schemaVersion: 1,
    sceneId,
    sourceVersionKey: "f07-camera-curve-source",
    sourceSha256: "f07-camera-curve-source",
    renderAbi: "three172-cad2d-v2",
    qualityStatus: "exact",
    diagnosticsSummary: { unknownEntityCount: 0, unknownObjectCount: 0, missingFontCount: 0, missingDependencyCount: 0, diagnosticCodes: [] },
    layouts: [{ layoutId, sourceName: layoutId, kind: "model", bbox, units: 4 }],
    chunks: [{ chunkId: "chunk_f07_curve", byteLength: chunk.byteLength, sha256: crypto.createHash("sha256").update(chunk).digest("hex"), layoutId }],
  };
  return { sceneId, chunks, manifest };
}

function makeBrowserEllipseRefinementScene() {
  const sceneId = "scene_f07_runtime_ellipse_refinement";
  const layoutId = "Model";
  const bbox: [number, number, number, number] = [-50, -50, 50, 50];
  const semimajor = 40;
  const semiminor = 24;
  const meta = new TextEncoder().encode(JSON.stringify({
    layoutId,
    chunkIndex: 0,
    drawCommands: [{ kind: "line", layer: "ELLIPSE", color: [0.2, 0.75, 1], firstVertex: 0, vertexCount: 2, order: 0, lineweightMm: 0 }],
    curveSourceRefs: [{
      curveId: "F07-RUNTIME-ELLIPSE", sourceHandle: "F07E1", sourceType: "ELLIPSE", firstSegmentIndex: 0,
      segmentCount: 1, curveRecordIndex: 0, firstVertex: 0, vertexCount: 2,
    }],
  }));
  let quarterArcLength = 0;
  const integrationIntervals = 1024;
  for (let i = 0; i <= integrationIntervals; i++) {
    const parameter = (i / integrationIntervals) * Math.PI / 2;
    const speed = Math.hypot(semimajor * Math.sin(parameter), semiminor * Math.cos(parameter));
    quarterArcLength += speed * (i === 0 || i === integrationIntervals ? 1 : i % 2 === 0 ? 2 : 4);
  }
  quarterArcLength *= (Math.PI / 2 / integrationIntervals) / 3;
  const chunk = buildSceneChunk([
    { tag: SceneTag.META, scalarType: SceneScalarType.U8, componentCount: 1, elementCount: meta.length, data: meta },
    { tag: SceneTag.ORIGIN, scalarType: SceneScalarType.F64, componentCount: 2, elementCount: 1, data: new Float64Array([0, 0]) },
    { tag: SceneTag.XY, scalarType: SceneScalarType.F32, componentCount: 2, elementCount: 2, data: new Float32Array([semimajor, 0, 0, semiminor]) },
    { tag: SceneTag.DRAW_RUNS, scalarType: SceneScalarType.U32, componentCount: 8, elementCount: 1, data: new Uint32Array([0, 0, 2, 0, 0, 0, 0, 0]) },
    { tag: SceneTag.PATH_DISTANCE, scalarType: SceneScalarType.F32, componentCount: 1, elementCount: 2, data: new Float32Array([0, quarterArcLength]) },
    { tag: SceneTag.CURVE_DATA, scalarType: SceneScalarType.F32, componentCount: 8, elementCount: 1, data: new Float32Array([0, 0, semimajor, 0, 0, semiminor, 0, Math.PI / 2]) },
  ]);
  const chunks = new Map([["chunk_f07_ellipse", chunk]]);
  const manifest = {
    schemaVersion: 1,
    sceneId,
    sourceVersionKey: "f07-runtime-ellipse-source",
    sourceSha256: "f07-runtime-ellipse-source",
    renderAbi: "three172-cad2d-v2",
    qualityStatus: "exact",
    diagnosticsSummary: { unknownEntityCount: 0, unknownObjectCount: 0, missingFontCount: 0, missingDependencyCount: 0, diagnosticCodes: [] },
    layouts: [{ layoutId, sourceName: layoutId, kind: "model", bbox, units: 4 }],
    chunks: [{ chunkId: "chunk_f07_ellipse", byteLength: chunk.byteLength, sha256: crypto.createHash("sha256").update(chunk).digest("hex"), layoutId }],
  };
  return { sceneId, chunks, manifest, semimajor, semiminor };
}

async function configureF07EllipseRefinementPage(
  page: Page,
  scene: ReturnType<typeof makeBrowserEllipseRefinementScene>,
  sessionId: string,
): Promise<void> {
  await page.addInitScript(() => {
    const state = { targetErrors: [] as number[], refinedReplies: 0, maxLineVertexCount: 0 };
    (window as Window & { __cadV2F07Ellipse?: typeof state }).__cadV2F07Ellipse = state;

    const NativeWorker = window.Worker;
    window.Worker = new Proxy(NativeWorker, {
      construct(target, args, newTarget) {
        const worker = Reflect.construct(target, args, newTarget) as Worker;
        worker.addEventListener("message", (event) => {
          if ((event.data as { kind?: string })?.kind === "refined-curves") state.refinedReplies++;
        });
        return worker;
      },
    });

    const nativePostMessage = Worker.prototype.postMessage;
    Worker.prototype.postMessage = function(message: unknown, transfer?: Transferable[]) {
      if (message && typeof message === "object" && (message as { kind?: string }).kind === "refine-curves") {
        const targetError = (message as { payload?: { targetErrorCssPixels?: number } }).payload?.targetErrorCssPixels;
        if (typeof targetError === "number") state.targetErrors.push(targetError);
      }
      return nativePostMessage.call(this, message, transfer ?? []);
    };

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
      body: JSON.stringify({ status: "ready", sceneId: scene.sceneId, viewSessionId: sessionId, sourceVersionKey: scene.manifest.sourceVersionKey }),
    });
  });
  await page.route(`**/api/dokumantasyon/cad-v2/view-sessions/${sessionId}/heartbeat`, async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ expiresAt: Date.now() + 180_000 }) });
  });
  await page.route(`**/api/dokumantasyon/cad-v2/scenes/${scene.sceneId}/manifest`, async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(scene.manifest) });
  });
  await page.route(`**/api/dokumantasyon/cad-v2/scenes/${scene.sceneId}/chunks/*`, async (route) => {
    const chunkId = new URL(route.request().url()).pathname.split("/").at(-1)!;
    const chunk = scene.chunks.get(chunkId);
    if (!chunk) {
      await route.fulfill({ status: 404, contentType: "application/json", body: JSON.stringify({ error: "F07 ELLIPSE fixture chunk not found" }) });
      return;
    }
    await route.fulfill({ status: 200, contentType: "application/octet-stream", body: Buffer.from(chunk) });
  });
}

async function measureF07ArcRasterError({
  screenshotBase64,
  zoomFactor,
  panCssPixels = { x: 0, y: 0 },
  clipArcToViewport = false,
}: {
  screenshotBase64: string;
  zoomFactor: number;
  panCssPixels?: { x: number; y: number };
  clipArcToViewport?: boolean;
}) {
  const image = new Image();
  image.src = "data:image/png;base64," + screenshotBase64;
  await image.decode();
  const sampleCanvas = document.createElement("canvas");
  sampleCanvas.width = image.naturalWidth;
  sampleCanvas.height = image.naturalHeight;
  const context = sampleCanvas.getContext("2d");
  if (!context) throw new Error("Could not read the presented WebGL pixels");
  context.drawImage(image, 0, 0);

  const input = document.querySelector<HTMLElement>('[aria-label="CAD V2 Çizim Etkileşim Alanı"]');
  if (!input) throw new Error("CAD camera input surface is missing");
  const width = input.clientWidth;
  const height = input.clientHeight;
  const margin = Math.min(32, 0.1 * Math.min(width, height));
  const fitUnitsPerCssPixel = Math.max(
    100 / Math.max(1, width - 2 * margin),
    100 / Math.max(1, height - 2 * margin),
  );
  const unitsPerCssPixel = fitUnitsPerCssPixel / zoomFactor;
  const radiusCssPixels = 40 / unitsPerCssPixel;
  const centerX = width / 2 + panCssPixels.x;
  const centerY = height / 2 + panCssPixels.y;
  const minimumArcAngle = clipArcToViewport && centerX + radiusCssPixels > width
    ? Math.acos(Math.max(-1, Math.min(1, (width - centerX) / radiusCssPixels)))
    : 0;
  const maximumArcAngle = clipArcToViewport && centerY - radiusCssPixels < 0
    ? Math.asin(Math.max(0, Math.min(1, centerY / radiusCssPixels)))
    : Math.PI / 2;
  if (minimumArcAngle >= maximumArcAngle) throw new Error("The analytic F07 arc is outside the camera viewport");
  const scaleX = image.naturalWidth / width;
  const scaleY = image.naturalHeight / height;
  const pixels = context.getImageData(0, 0, sampleCanvas.width, sampleCanvas.height).data;
  // Element screenshots include page controls layered over the canvas. Restrict the
  // sample to a 16 CSS px padded analytic-arc envelope to exclude those controls.
  const visibleArcStart = {
    x: centerX + radiusCssPixels * Math.cos(minimumArcAngle),
    y: centerY - radiusCssPixels * Math.sin(minimumArcAngle),
  };
  const visibleArcEnd = {
    x: centerX + radiusCssPixels * Math.cos(maximumArcAngle),
    y: centerY - radiusCssPixels * Math.sin(maximumArcAngle),
  };
  const xStart = Math.max(0, Math.floor((visibleArcEnd.x - 16) * scaleX));
  const xEnd = Math.min(sampleCanvas.width, Math.ceil((visibleArcStart.x + 16) * scaleX));
  const yStart = Math.max(0, Math.floor((visibleArcEnd.y - 16) * scaleY));
  const yEnd = Math.min(sampleCanvas.height, Math.ceil((visibleArcStart.y + 16) * scaleY));
  let bluePixelCount = 0;
  let maximumArcDistanceCssPixels = 0;
  let furthestBluePixel: { x: number; y: number; closestX: number; closestY: number } | null = null;
  const bluePixelCenters: Array<{ x: number; y: number }> = [];
  const blueBounds = { minX: xEnd, minY: yEnd, maxX: -1, maxY: -1 };
  for (let y = yStart; y < yEnd; y++) {
    for (let x = xStart; x < xEnd; x++) {
      const offset = (y * sampleCanvas.width + x) * 4;
      const red = pixels[offset]!;
      const green = pixels[offset + 1]!;
      const blue = pixels[offset + 2]!;
      if (!(blue > 80 && blue > red * 1.3 && blue > green * 1.05)) continue;
      bluePixelCount++;
      blueBounds.minX = Math.min(blueBounds.minX, x);
      blueBounds.minY = Math.min(blueBounds.minY, y);
      blueBounds.maxX = Math.max(blueBounds.maxX, x);
      blueBounds.maxY = Math.max(blueBounds.maxY, y);

      const cssX = (x + 0.5) / scaleX;
      const cssY = (y + 0.5) / scaleY;
      bluePixelCenters.push({ x: cssX, y: cssY });
      const dx = cssX - centerX;
      const dy = centerY - cssY;
      const angle = Math.max(0, Math.min(Math.PI / 2, Math.atan2(dy, dx)));
      const closestX = centerX + radiusCssPixels * Math.cos(angle);
      const closestY = centerY - radiusCssPixels * Math.sin(angle);
      const distanceCssPixels = Math.hypot(cssX - closestX, cssY - closestY);
      if (distanceCssPixels > maximumArcDistanceCssPixels) {
        maximumArcDistanceCssPixels = distanceCssPixels;
        furthestBluePixel = { x: cssX, y: cssY, closestX, closestY };
      }
    }
  }
  const sourceArcSampleCount = Math.ceil(radiusCssPixels * (maximumArcAngle - minimumArcAngle) / 0.5);
  let maximumSourceArcToPixelDistanceCssPixels = 0;
  for (let sample = 0; sample <= sourceArcSampleCount; sample++) {
    const angle = minimumArcAngle + sample / sourceArcSampleCount * (maximumArcAngle - minimumArcAngle);
    const sourceX = centerX + radiusCssPixels * Math.cos(angle);
    const sourceY = centerY - radiusCssPixels * Math.sin(angle);
    let nearestPixelDistance = Number.POSITIVE_INFINITY;
    for (const pixel of bluePixelCenters) {
      nearestPixelDistance = Math.min(nearestPixelDistance, Math.hypot(pixel.x - sourceX, pixel.y - sourceY));
    }
    maximumSourceArcToPixelDistanceCssPixels = Math.max(
      maximumSourceArcToPixelDistanceCssPixels,
      nearestPixelDistance,
    );
  }
  return {
    bluePixelCount,
    maximumArcDistanceCssPixels,
    maximumSourceArcToPixelDistanceCssPixels,
    furthestBluePixel,
    blueBounds,
    unitsPerCssPixel,
    visibleArcAngles: [minimumArcAngle, maximumArcAngle],
    cameraWidth: width,
    cameraHeight: height,
    imageWidth: image.naturalWidth,
    imageHeight: image.naturalHeight,
  };
}

async function measureF07EllipseRasterError({
  screenshotBase64,
  semimajor,
  semiminor,
  zoomFactor = 1,
  panCssPixels = { x: 0, y: 0 },
}: {
  screenshotBase64: string;
  semimajor: number;
  semiminor: number;
  zoomFactor?: number;
  panCssPixels?: { x: number; y: number };
}) {
  const image = new Image();
  image.src = "data:image/png;base64," + screenshotBase64;
  await image.decode();
  const sampleCanvas = document.createElement("canvas");
  sampleCanvas.width = image.naturalWidth;
  sampleCanvas.height = image.naturalHeight;
  const context = sampleCanvas.getContext("2d");
  if (!context) throw new Error("Could not read the presented WebGL ellipse pixels");
  context.drawImage(image, 0, 0);

  const input = document.querySelector<HTMLElement>('[aria-label="CAD V2 Çizim Etkileşim Alanı"]');
  if (!input) throw new Error("CAD camera input surface is missing");
  const width = input.clientWidth;
  const height = input.clientHeight;
  const margin = Math.min(32, 0.1 * Math.min(width, height));
  const fitUnitsPerCssPixel = Math.max(
    100 / Math.max(1, width - 2 * margin),
    100 / Math.max(1, height - 2 * margin),
  );
  const unitsPerCssPixel = fitUnitsPerCssPixel / zoomFactor;
  const centerX = width / 2 + panCssPixels.x;
  const centerY = height / 2 + panCssPixels.y;
  const radiusXCssPixels = semimajor / unitsPerCssPixel;
  const radiusYCssPixels = semiminor / unitsPerCssPixel;
  const scaleX = image.naturalWidth / width;
  const scaleY = image.naturalHeight / height;
  const pixels = context.getImageData(0, 0, sampleCanvas.width, sampleCanvas.height).data;
  const xStart = Math.max(0, Math.floor((centerX - 16) * scaleX));
  const xEnd = Math.min(sampleCanvas.width, Math.ceil((centerX + radiusXCssPixels + 16) * scaleX));
  const yStart = Math.max(0, Math.floor((centerY - radiusYCssPixels - 16) * scaleY));
  const yEnd = Math.min(sampleCanvas.height, Math.ceil((centerY + 16) * scaleY));
  const renderedPixelCenters: Array<{ x: number; y: number }> = [];
  const ellipseSamples: Array<{ x: number; y: number }> = [];
  const sampleCount = 4096;
  let maximumRenderedToSourceDistanceCssPixels = 0;
  for (let sample = 0; sample <= sampleCount; sample++) {
    const parameter = sample / sampleCount * Math.PI / 2;
    const sourceX = centerX + radiusXCssPixels * Math.cos(parameter);
    const sourceY = centerY - radiusYCssPixels * Math.sin(parameter);
    ellipseSamples.push({ x: sourceX, y: sourceY });
  }

  const blueBounds = { minX: xEnd, minY: yEnd, maxX: -1, maxY: -1 };
  for (let y = yStart; y < yEnd; y++) {
    for (let x = xStart; x < xEnd; x++) {
      const offset = (y * sampleCanvas.width + x) * 4;
      const red = pixels[offset]!;
      const green = pixels[offset + 1]!;
      const blue = pixels[offset + 2]!;
      if (!(blue > 80 && blue > red * 1.3 && blue > green * 1.05)) continue;
      blueBounds.minX = Math.min(blueBounds.minX, x);
      blueBounds.minY = Math.min(blueBounds.minY, y);
      blueBounds.maxX = Math.max(blueBounds.maxX, x);
      blueBounds.maxY = Math.max(blueBounds.maxY, y);
      const renderedX = (x + 0.5) / scaleX;
      const renderedY = (y + 0.5) / scaleY;
      renderedPixelCenters.push({ x: renderedX, y: renderedY });
      let nearestSourceDistance = Number.POSITIVE_INFINITY;
      for (const source of ellipseSamples) {
        nearestSourceDistance = Math.min(nearestSourceDistance, Math.hypot(renderedX - source.x, renderedY - source.y));
      }
      maximumRenderedToSourceDistanceCssPixels = Math.max(maximumRenderedToSourceDistanceCssPixels, nearestSourceDistance);
    }
  }

  let maximumSourceToRenderedDistanceCssPixels = 0;
  for (const source of ellipseSamples) {
    let nearestRenderedDistance = Number.POSITIVE_INFINITY;
    for (const rendered of renderedPixelCenters) {
      nearestRenderedDistance = Math.min(nearestRenderedDistance, Math.hypot(rendered.x - source.x, rendered.y - source.y));
    }
    maximumSourceToRenderedDistanceCssPixels = Math.max(maximumSourceToRenderedDistanceCssPixels, nearestRenderedDistance);
  }

  return {
    bluePixelCount: renderedPixelCenters.length,
    maximumRenderedToSourceDistanceCssPixels,
    maximumSourceToRenderedDistanceCssPixels,
    blueBounds,
    unitsPerCssPixel,
    visibleSourceAngles: [0, Math.PI / 2],
    cameraWidth: width,
    cameraHeight: height,
    imageWidth: image.naturalWidth,
    imageHeight: image.naturalHeight,
    analyticSampleCount: ellipseSamples.length,
  };
}

function makeBrowserSplineRefinementScene() {
  const sceneId = "scene_f07_runtime_spline_refinement";
  const layoutId = "Model";
  const bbox: [number, number, number, number] = [-50, -50, 50, 50];
  const controlPoints: [number, number][] = [[-34, -18], [-15, 40], [17, -38], [34, 22]];
  const weights = [1, 0.7, 1.25, 0.9];
  const meta = new TextEncoder().encode(JSON.stringify({
    layoutId,
    chunkIndex: 0,
    drawCommands: [{ kind: "line", layer: "SPLINE", color: [0.2, 0.75, 1], firstVertex: 0, vertexCount: 2, order: 0, lineweightMm: 0 }],
    curveSourceRefs: [{
      curveId: "F07-RUNTIME-SPLINE", sourceHandle: "F07S1", sourceType: "SPLINE", firstSegmentIndex: 0,
      segmentCount: 1, curveRecordIndex: 0, firstVertex: 0, vertexCount: 2,
      splineSource: { controlPoints, weights },
    }],
  }));
  const chunk = buildSceneChunk([
    { tag: SceneTag.META, scalarType: SceneScalarType.U8, componentCount: 1, elementCount: meta.length, data: meta },
    { tag: SceneTag.ORIGIN, scalarType: SceneScalarType.F64, componentCount: 2, elementCount: 1, data: new Float64Array([0, 0]) },
    { tag: SceneTag.XY, scalarType: SceneScalarType.F32, componentCount: 2, elementCount: 2, data: new Float32Array([...controlPoints[0]!, ...controlPoints[3]!]) },
    { tag: SceneTag.DRAW_RUNS, scalarType: SceneScalarType.U32, componentCount: 8, elementCount: 1, data: new Uint32Array([0, 0, 2, 0, 0, 0, 0, 0]) },
    { tag: SceneTag.PATH_DISTANCE, scalarType: SceneScalarType.F32, componentCount: 1, elementCount: 2, data: new Float32Array([0, 100]) },
    { tag: SceneTag.CURVE_DATA, scalarType: SceneScalarType.F32, componentCount: 8, elementCount: 1, data: new Float32Array([0, 0, 0, 0, 0, 0, 0, 1]) },
  ]);
  const chunks = new Map([["chunk_f07_spline", chunk]]);
  const manifest = {
    schemaVersion: 1,
    sceneId,
    sourceVersionKey: "f07-runtime-spline-source",
    sourceSha256: "f07-runtime-spline-source",
    renderAbi: "three172-cad2d-v2",
    qualityStatus: "exact",
    diagnosticsSummary: { unknownEntityCount: 0, unknownObjectCount: 0, missingFontCount: 0, missingDependencyCount: 0, diagnosticCodes: [] },
    layouts: [{ layoutId, sourceName: layoutId, kind: "model", bbox, units: 4 }],
    chunks: [{ chunkId: "chunk_f07_spline", byteLength: chunk.byteLength, sha256: crypto.createHash("sha256").update(chunk).digest("hex"), layoutId }],
  };
  return { sceneId, chunks, manifest, controlPoints, weights };
}

async function configureF07SplineRefinementPage(
  page: Page,
  scene: ReturnType<typeof makeBrowserSplineRefinementScene>,
  sessionId: string,
): Promise<void> {
  await page.addInitScript(() => {
    const state = { targetErrors: [] as number[], refinedReplies: 0, maxLineVertexCount: 0 };
    (window as Window & { __cadV2F07Spline?: typeof state }).__cadV2F07Spline = state;

    const NativeWorker = window.Worker;
    window.Worker = new Proxy(NativeWorker, {
      construct(target, args, newTarget) {
        const worker = Reflect.construct(target, args, newTarget) as Worker;
        worker.addEventListener("message", (event) => {
          if ((event.data as { kind?: string })?.kind === "refined-curves") state.refinedReplies++;
        });
        return worker;
      },
    });

    const nativePostMessage = Worker.prototype.postMessage;
    Worker.prototype.postMessage = function(message: unknown, transfer?: Transferable[]) {
      if (message && typeof message === "object" && (message as { kind?: string }).kind === "refine-curves") {
        const targetError = (message as { payload?: { targetErrorCssPixels?: number } }).payload?.targetErrorCssPixels;
        if (typeof targetError === "number") state.targetErrors.push(targetError);
      }
      return nativePostMessage.call(this, message, transfer ?? []);
    };

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
      body: JSON.stringify({ status: "ready", sceneId: scene.sceneId, viewSessionId: sessionId, sourceVersionKey: scene.manifest.sourceVersionKey }),
    });
  });
  await page.route(`**/api/dokumantasyon/cad-v2/view-sessions/${sessionId}/heartbeat`, async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ expiresAt: Date.now() + 180_000 }) });
  });
  await page.route("**/api/dokumantasyon/cad-v2/scenes/" + scene.sceneId + "/manifest", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(scene.manifest) });
  });
  await page.route("**/api/dokumantasyon/cad-v2/scenes/" + scene.sceneId + "/chunks/*", async (route) => {
    const chunkId = new URL(route.request().url()).pathname.split("/").at(-1)!;
    const chunk = scene.chunks.get(chunkId);
    if (!chunk) {
      await route.fulfill({ status: 404, contentType: "application/json", body: JSON.stringify({ error: "F07 SPLINE fixture chunk not found" }) });
      return;
    }
    await route.fulfill({ status: 200, contentType: "application/octet-stream", body: Buffer.from(chunk) });
  });
}

async function measureF07SplineRasterError({
  screenshotBase64,
  controlPoints,
  weights,
  camera,
}: {
  screenshotBase64: string;
  controlPoints: [number, number][];
  weights: number[];
  camera: { x: number; y: number; k: number };
}) {
  const image = new Image();
  image.src = "data:image/png;base64," + screenshotBase64;
  await image.decode();
  const sampleCanvas = document.createElement("canvas");
  sampleCanvas.width = image.naturalWidth;
  sampleCanvas.height = image.naturalHeight;
  const context = sampleCanvas.getContext("2d");
  if (!context) throw new Error("Could not read the presented WebGL spline pixels");
  context.drawImage(image, 0, 0);

  const input = document.querySelector<HTMLElement>('[aria-label="CAD V2 Çizim Etkileşim Alanı"]');
  if (!input) throw new Error("CAD camera input surface is missing");
  const width = input.clientWidth;
  const height = input.clientHeight;
  const unitsPerCssPixel = 1 / camera.k;
  const scaleX = image.naturalWidth / width;
  const scaleY = image.naturalHeight / height;
  const sourceSampleCount = 4096;
  const sourceSamples: Array<{ x: number; y: number }> = [];
  const sourceBounds = { minX: Number.POSITIVE_INFINITY, minY: Number.POSITIVE_INFINITY, maxX: Number.NEGATIVE_INFINITY, maxY: Number.NEGATIVE_INFINITY };

  // Independent rational Bernstein evaluation of the single cubic span.
  for (let sample = 0; sample <= sourceSampleCount; sample++) {
    const t = sample / sourceSampleCount;
    const oneMinusT = 1 - t;
    const basis = [oneMinusT ** 3, 3 * oneMinusT ** 2 * t, 3 * oneMinusT * t ** 2, t ** 3];
    let weightedX = 0;
    let weightedY = 0;
    let totalWeight = 0;
    for (let index = 0; index < 4; index++) {
      const factor = basis[index]! * weights[index]!;
      weightedX += controlPoints[index]![0] * factor;
      weightedY += controlPoints[index]![1] * factor;
      totalWeight += factor;
    }
    const point = {
      x: camera.x + (weightedX / totalWeight) * camera.k,
      y: camera.y - (weightedY / totalWeight) * camera.k,
    };
    sourceSamples.push(point);
    sourceBounds.minX = Math.min(sourceBounds.minX, point.x);
    sourceBounds.minY = Math.min(sourceBounds.minY, point.y);
    sourceBounds.maxX = Math.max(sourceBounds.maxX, point.x);
    sourceBounds.maxY = Math.max(sourceBounds.maxY, point.y);
  }

  const pixels = context.getImageData(0, 0, sampleCanvas.width, sampleCanvas.height).data;
  const xStart = Math.max(0, Math.floor((sourceBounds.minX - 16) * scaleX));
  const xEnd = Math.min(sampleCanvas.width, Math.ceil((sourceBounds.maxX + 16) * scaleX));
  const yStart = Math.max(0, Math.floor((sourceBounds.minY - 16) * scaleY));
  const yEnd = Math.min(sampleCanvas.height, Math.ceil((sourceBounds.maxY + 16) * scaleY));
  const renderedPixels: Array<{ x: number; y: number }> = [];
  const renderedBounds = { minX: xEnd, minY: yEnd, maxX: -1, maxY: -1 };
  let maximumRenderedToSourceDistanceCssPixels = 0;
  for (let y = yStart; y < yEnd; y++) {
    for (let x = xStart; x < xEnd; x++) {
      const offset = (y * sampleCanvas.width + x) * 4;
      const red = pixels[offset]!;
      const green = pixels[offset + 1]!;
      const blue = pixels[offset + 2]!;
      if (!(blue > 80 && blue > red * 1.3 && blue > green * 1.05)) continue;
      renderedBounds.minX = Math.min(renderedBounds.minX, x);
      renderedBounds.minY = Math.min(renderedBounds.minY, y);
      renderedBounds.maxX = Math.max(renderedBounds.maxX, x);
      renderedBounds.maxY = Math.max(renderedBounds.maxY, y);
      const rendered = { x: (x + 0.5) / scaleX, y: (y + 0.5) / scaleY };
      renderedPixels.push(rendered);
      let nearestSource = Number.POSITIVE_INFINITY;
      for (const source of sourceSamples) nearestSource = Math.min(nearestSource, Math.hypot(rendered.x - source.x, rendered.y - source.y));
      maximumRenderedToSourceDistanceCssPixels = Math.max(maximumRenderedToSourceDistanceCssPixels, nearestSource);
    }
  }

  let maximumSourceToRenderedDistanceCssPixels = 0;
  for (const source of sourceSamples) {
    let nearestRendered = Number.POSITIVE_INFINITY;
    for (const rendered of renderedPixels) nearestRendered = Math.min(nearestRendered, Math.hypot(rendered.x - source.x, rendered.y - source.y));
    maximumSourceToRenderedDistanceCssPixels = Math.max(maximumSourceToRenderedDistanceCssPixels, nearestRendered);
  }
  return {
    bluePixelCount: renderedPixels.length,
    maximumRenderedToSourceDistanceCssPixels,
    maximumSourceToRenderedDistanceCssPixels,
    renderedBounds,
    sourceBounds,
    unitsPerCssPixel,
    camera,
    cameraWidth: width,
    cameraHeight: height,
    imageWidth: image.naturalWidth,
    imageHeight: image.naturalHeight,
    independentSourceSampleCount: sourceSamples.length,
  };
}

function makeBrowserVisibleDashScenes() {
  const output = execFileSync(process.execPath, ["--import", "tsx", "tests/cad-v2/f07-dash-render-scene.ts"], {
    cwd: process.cwd(),
    encoding: "utf8",
    timeout: 15_000,
    windowsHide: true,
    maxBuffer: 2 * 1024 * 1024,
  });
  const compiled = JSON.parse(output) as {
    scenes: Array<{
      sceneId: string;
      manifest: Record<string, any>;
      chunks: Array<{ chunkId: string; chunkBase64: string }>;
    }>;
  };
  return compiled.scenes.map((scene) => {
    const chunks = new Map(scene.chunks.map(({ chunkId, chunkBase64 }) => [chunkId, Buffer.from(chunkBase64, "base64")]));
    const modelChunks = scene.manifest.chunks
      .filter((chunkRef: { layoutId: string }) => chunkRef.layoutId === "Model")
      .map((chunkRef: { chunkId: string }) => {
        const chunk = chunks.get(chunkRef.chunkId);
        if (!chunk) throw new Error(`Compiler output is missing chunk ${chunkRef.chunkId}`);
        const parsed = parseSceneChunk(chunk);
        const encodedPathDistance = parsed.sections.get(SceneTag.PATH_DISTANCE)?.data as Float32Array | undefined;
        if (!encodedPathDistance) throw new Error(`Compiler chunk ${chunkRef.chunkId} is missing PATH_DISTANCE`);
        const metadata = parsed.sections.get(SceneTag.META)?.data as Uint8Array | undefined;
        if (!metadata) throw new Error(`Compiler chunk ${chunkRef.chunkId} is missing META`);
        const meta = JSON.parse(new TextDecoder().decode(metadata)) as {
          drawCommands?: Array<{ kind: string; vertexCount: number; dashStyle?: { dashSize: number; gapSize: number } }>;
        };
        return { pathDistanceValues: Array.from(encodedPathDistance), drawCommands: meta.drawCommands ?? [] };
      });
    return {
      sceneId: scene.sceneId,
      manifest: scene.manifest,
      chunks,
      pathDistanceValues: modelChunks.flatMap((chunk) => chunk.pathDistanceValues),
      dashDrawCommands: modelChunks.flatMap((chunk) => chunk.drawCommands.filter((command) => command.kind === "line")),
    };
  });
}

test.describe("CAD V2 F06 — real browser layout picker", () => {
  test.afterEach(async ({ page }) => {
    if (process.env.CAD_V2_PRESERVE_TEST_FIXTURES === "1") return;
    await cleanupUploadedCadFixtures(page);
  });

  test("pafta seçimi WebGL host içindeki aktif layout chunk'larını değiştirir", async ({ page }) => {
    await signInAdmin(page);
    const { fileId } = await uploadCadPreviewV2Fixture(page, "known-geometry-measurements");
    const scene = makeBrowserAcceptanceScene();
    const sceneId = scene.sceneId;
    const sessionId = "vs_f06_browser_layout_acceptance";

    await page.route("**/api/dokumantasyon/cad-v2/prepare", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ status: "ready", sceneId, viewSessionId: sessionId, sourceVersionKey: scene.manifest.sourceVersionKey }),
      });
    });
    await page.route(`**/api/dokumantasyon/cad-v2/scenes/${sceneId}/manifest`, async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(scene.manifest) });
    });
    await page.route(`**/api/dokumantasyon/cad-v2/scenes/${sceneId}/chunks/*`, async (route) => {
      const chunkId = new URL(route.request().url()).pathname.split("/").at(-1)!;
      const chunk = scene.chunks.get(chunkId);
      if (!chunk) {
        await route.fulfill({ status: 404, contentType: "application/json", body: JSON.stringify({ error: "fixture chunk not found" }) });
        return;
      }
      await route.fulfill({ status: 200, contentType: "application/octet-stream", body: Buffer.from(chunk) });
    });

    await page.goto(`/dokumantasyon/dosya/${fileId}?cadEngine=v2`);
    const picker = page.getByRole("combobox", { name: "Pafta seçimi" });
    await expect(picker).toBeVisible({ timeout: 60_000 });
    await expect(picker).toHaveValue("Model");

    const canvas = page.locator("canvas").first();
    await expect(canvas).toBeVisible();
    // Browser compositor screenshot is the oracle here: WebGL's default drawing buffer
    // may be cleared after presentation when preserveDrawingBuffer is false.
    const readFrame = async () => crypto.createHash("sha256").update(await canvas.screenshot()).digest("hex");

    let modelFrame = "";
    await expect.poll(async () => {
      modelFrame = await readFrame();
      return modelFrame;
    }, { timeout: 15_000 }).not.toBe("");

    await picker.selectOption("SHEET_A");
    await expect(picker).toHaveValue("SHEET_A");
    await expect.poll(readFrame, { timeout: 15_000 }).not.toBe(modelFrame);
    await expect(page.getByText("Varlık:")).toBeVisible();
  });

  test("canlı zoom, stale yanıt ve aynı bucket pan davranışını doğrular", async ({ page }) => {
    await signInAdmin(page);
    const { fileId } = await uploadCadPreviewV2Fixture(page, "known-geometry-measurements");
    const scene = makeBrowserCurveRefinementScene();
    const sessionId = "vs_f07_camera_curve_refinement";

    await page.route("**/api/dokumantasyon/cad-v2/prepare", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ status: "ready", sceneId: scene.sceneId, viewSessionId: sessionId, sourceVersionKey: scene.manifest.sourceVersionKey }),
      });
    });
    await page.route(`**/api/dokumantasyon/cad-v2/scenes/${scene.sceneId}/manifest`, async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(scene.manifest) });
    });
    await page.route(`**/api/dokumantasyon/cad-v2/scenes/${scene.sceneId}/chunks/*`, async (route) => {
      const chunkId = new URL(route.request().url()).pathname.split("/").at(-1)!;
      const chunk = scene.chunks.get(chunkId);
      if (!chunk) {
        await route.fulfill({ status: 404, contentType: "application/json", body: JSON.stringify({ error: "F07 fixture chunk not found" }) });
        return;
      }
      await route.fulfill({ status: 200, contentType: "application/octet-stream", body: Buffer.from(chunk) });
    });

    await page.addInitScript(() => {
      const heldResponses: MessageEvent[] = [];
      let deliverResponse: ((event: MessageEvent) => void) | null = null;
      const state = {
        refinementRequests: 0,
        targetErrors: [] as number[],
        heldRefinementResponses: 0,
        maxLineVertexCount: 0,
        releaseNextRefinementResponse: () => {
          const event = heldResponses.shift();
          if (!event || !deliverResponse) throw new Error("No held F07 refinement response is available");
          state.heldRefinementResponses = heldResponses.length;
          deliverResponse(event);
        },
      };
      (window as Window & { __cadV2F07?: typeof state }).__cadV2F07 = state;
      const NativeWorker = window.Worker;
      window.Worker = new Proxy(NativeWorker, {
        construct(target, args, newTarget) {
          const worker = Reflect.construct(target, args, newTarget) as Worker;
          let onmessage: ((this: Worker, event: MessageEvent) => unknown) | null = null;
          Object.defineProperty(worker, "onmessage", {
            configurable: true,
            get: () => onmessage,
            set: (handler: ((this: Worker, event: MessageEvent) => unknown) | null) => { onmessage = handler; },
          });
          deliverResponse = (event) => { onmessage?.call(worker, event); };
          worker.addEventListener("message", (event) => {
            if ((event.data as { kind?: string })?.kind === "refined-curves") {
              heldResponses.push(event);
              state.heldRefinementResponses = heldResponses.length;
              return;
            }
            onmessage?.call(worker, event);
          });
          return worker;
        },
      });
      const workerPostMessage = Worker.prototype.postMessage;
      Worker.prototype.postMessage = function(message: unknown, transfer?: Transferable[]) {
        if (message && typeof message === "object") {
          const kind = (message as { kind?: string }).kind;
          if (kind === "refine-curves") {
            state.refinementRequests++;
            const target = (message as { payload?: { targetErrorCssPixels?: number } }).payload?.targetErrorCssPixels;
            if (typeof target === "number") state.targetErrors.push(target);
          }
        }
        return workerPostMessage.call(this, message, transfer ?? []);
      };
      const drawArrays = WebGL2RenderingContext.prototype.drawArrays;
      WebGL2RenderingContext.prototype.drawArrays = function(mode: number, first: number, count: number) {
        if (mode === 0x0001) state.maxLineVertexCount = Math.max(state.maxLineVertexCount, count);
        return drawArrays.call(this, mode, first, count);
      };
    });

    await page.goto(`/dokumantasyon/dosya/${fileId}?cadEngine=v2`);
    const canvas = page.locator("canvas").first();
    const readFrame = async () => crypto.createHash("sha256").update(await canvas.screenshot()).digest("hex");
    const dragDrawing = async () => {
      const input = page.getByLabel("CAD V2 Çizim Etkileşim Alanı");
      const bounds = await input.boundingBox();
      expect(bounds).not.toBeNull();
      await page.mouse.move(bounds!.x + bounds!.width / 2, bounds!.y + bounds!.height / 2);
      await page.mouse.down();
      await page.mouse.move(bounds!.x + bounds!.width / 2 + 48, bounds!.y + bounds!.height / 2 + 24, { steps: 4 });
      await page.mouse.up();
      return { x: 48, y: 24 };
    };
    await expect(canvas).toBeVisible({ timeout: 60_000 });
    await expect(page.getByText("Varlık:")).toBeVisible({ timeout: 60_000 });
    await expect.poll(() => page.evaluate(() => (window as Window & { __cadV2F07?: { refinementRequests: number; maxLineVertexCount: number } }).__cadV2F07?.maxLineVertexCount ?? 0),
      { timeout: 15_000 }).toBeGreaterThanOrEqual(2);

    // Let the initial fit camera settle through both profiles before measuring user zoom behavior.
    let initialCameraStable = false;
    for (let attempt = 0; attempt < 5 && !initialCameraStable; attempt++) {
      await expect.poll(() => page.evaluate(() => (window as Window & { __cadV2F07?: { heldRefinementResponses: number } }).__cadV2F07?.heldRefinementResponses ?? 0),
        { timeout: 15_000 }).toBeGreaterThan(0);
      await page.evaluate(() => {
        const state = (window as Window & { __cadV2F07?: { heldRefinementResponses: number; releaseNextRefinementResponse: () => void } }).__cadV2F07!;
        while (state.heldRefinementResponses > 0) state.releaseNextRefinementResponse();
      });
      await page.waitForTimeout(750);
      const snapshot = await page.evaluate(() => (window as Window & { __cadV2F07?: { refinementRequests: number; heldRefinementResponses: number; targetErrors: number[] } }).__cadV2F07!);
      const lastProfileIsIdle = snapshot.targetErrors.at(-1) === 0.25;
      if (snapshot.heldRefinementResponses === 0 && lastProfileIsIdle) {
        await page.waitForTimeout(750);
        const quietSnapshot = await page.evaluate(() => (window as Window & { __cadV2F07?: { refinementRequests: number; heldRefinementResponses: number } }).__cadV2F07!);
        initialCameraStable = quietSnapshot.heldRefinementResponses === 0 && quietSnapshot.refinementRequests === snapshot.refinementRequests;
      }
    }
    expect(initialCameraStable, "initial fit refinement should settle at idle profile before the zoom oracle").toBe(true);
    const settledRefinement = await page.evaluate(() =>
      (window as Window & { __cadV2F07?: { targetErrors: number[]; maxLineVertexCount: number } }).__cadV2F07!);
    expect(settledRefinement.targetErrors.at(-1)).toBe(0.25);
    expect(settledRefinement.maxLineVertexCount).toBeGreaterThan(2);

    const renderedArcError = await page.evaluate(measureF07ArcRasterError, {
      screenshotBase64: (await canvas.screenshot()).toString("base64"),
      zoomFactor: 1,
    });
    expect(renderedArcError.bluePixelCount).toBeGreaterThan(50);
    // The independent quarter-circle projection must contain the rasterized one-pixel
    // WebGL line within the 0.25 CSS px refinement budget plus a 1 px raster envelope.
    expect(renderedArcError.maximumArcDistanceCssPixels,
      `rendered arc pixels exceeded the projected source envelope: ${JSON.stringify(renderedArcError)}`)
      .toBeLessThanOrEqual(1.25);
    expect(renderedArcError.maximumSourceArcToPixelDistanceCssPixels,
      `projected source arc had a raster coverage gap: ${JSON.stringify(renderedArcError)}`)
      .toBeLessThanOrEqual(1.25);
    console.log(`F07 runtime-refined WebGL arc pixel envelope PASS: ${JSON.stringify(renderedArcError)}`);

    const zoomOutBaseline = await page.evaluate(() => {
      const state = (window as Window & { __cadV2F07?: { refinementRequests: number; targetErrors: number[] } }).__cadV2F07!;
      return { refinementRequests: state.refinementRequests, targetErrorCount: state.targetErrors.length };
    });
    await page.getByRole("button", { name: "Uzaklaştır (-)" }).click();
    await expect(page.getByText("80%")).toBeVisible();
    let zoomOutRefinementStable = false;
    for (let attempt = 0; attempt < 5 && !zoomOutRefinementStable; attempt++) {
      await expect.poll(() => page.evaluate(() =>
        (window as Window & { __cadV2F07?: { heldRefinementResponses: number } }).__cadV2F07!.heldRefinementResponses,
      ), { timeout: 15_000 }).toBeGreaterThan(0);
      await page.evaluate(() => {
        const state = (window as Window & { __cadV2F07?: { heldRefinementResponses: number; releaseNextRefinementResponse: () => void } }).__cadV2F07!;
        while (state.heldRefinementResponses > 0) state.releaseNextRefinementResponse();
      });
      await page.waitForTimeout(750);
      const snapshot = await page.evaluate((baseline) => {
        const state = (window as Window & { __cadV2F07?: { refinementRequests: number; heldRefinementResponses: number; targetErrors: number[] } }).__cadV2F07!;
        return {
          refinementRequests: state.refinementRequests,
          heldRefinementResponses: state.heldRefinementResponses,
          targetErrors: state.targetErrors.slice(baseline),
        };
      }, zoomOutBaseline.targetErrorCount);
      const idleProfileApplied = snapshot.targetErrors.includes(0.75) && snapshot.targetErrors.at(-1) === 0.25;
      if (snapshot.heldRefinementResponses === 0 && idleProfileApplied) {
        await page.waitForTimeout(750);
        const quietSnapshot = await page.evaluate(() =>
          (window as Window & { __cadV2F07?: { refinementRequests: number; heldRefinementResponses: number } }).__cadV2F07!);
        zoomOutRefinementStable = quietSnapshot.heldRefinementResponses === 0 &&
          quietSnapshot.refinementRequests === snapshot.refinementRequests;
      }
    }
    expect(zoomOutRefinementStable, "80% zoom should settle after all transient and idle refinement responses").toBe(true);
    const zoomOutState = await page.evaluate((baseline) => {
      const state = (window as Window & { __cadV2F07?: { refinementRequests: number; targetErrors: number[]; heldRefinementResponses: number } }).__cadV2F07!;
      return {
        refinementRequests: state.refinementRequests,
        targetErrors: state.targetErrors.slice(baseline),
        heldRefinementResponses: state.heldRefinementResponses,
      };
    }, zoomOutBaseline.targetErrorCount);
    expect(zoomOutState.refinementRequests).toBeGreaterThan(zoomOutBaseline.refinementRequests);
    expect(zoomOutState.targetErrors).toContain(0.75);
    expect(zoomOutState.targetErrors.at(-1)).toBe(0.25);
    expect(zoomOutState.heldRefinementResponses).toBe(0);
    const zoomedOutArcError = await page.evaluate(measureF07ArcRasterError, {
      screenshotBase64: (await canvas.screenshot()).toString("base64"),
      zoomFactor: 0.8,
    });
    expect(zoomedOutArcError.bluePixelCount).toBeGreaterThan(50);
    expect(zoomedOutArcError.maximumArcDistanceCssPixels,
      `80% zoom rendered arc pixels exceeded the projected source envelope: ${JSON.stringify(zoomedOutArcError)}`)
      .toBeLessThanOrEqual(1.25);
    expect(zoomedOutArcError.maximumSourceArcToPixelDistanceCssPixels,
      `80% zoom projected source arc had a raster coverage gap: ${JSON.stringify(zoomedOutArcError)}`)
      .toBeLessThanOrEqual(1.25);
    console.log(`F07 80% runtime-refined WebGL arc pixel envelope PASS: ${JSON.stringify(zoomedOutArcError)}`);

    const beforeFitFrame = await readFrame();
    await page.getByRole("button", { name: "Çizimi Sığdır (F)" }).click();
    await expect(page.getByText("100%")).toBeVisible();
    await expect.poll(readFrame, { timeout: 5_000 }).not.toBe(beforeFitFrame);
    await page.waitForTimeout(250);

    const zoomProfileBaseline = await page.evaluate(() => {
      const state = (window as Window & { __cadV2F07?: { refinementRequests: number; targetErrors: number[] } }).__cadV2F07!;
      return { refinementRequests: state.refinementRequests, targetErrorCount: state.targetErrors.length };
    });
    await page.getByRole("button", { name: "Yakınlaştır (+)" }).click();
    await expect(page.getByText("125%")).toBeVisible();
    let zoomRefinementStable = false;
    for (let attempt = 0; attempt < 5 && !zoomRefinementStable; attempt++) {
      await expect.poll(() => page.evaluate(() =>
        (window as Window & { __cadV2F07?: { heldRefinementResponses: number } }).__cadV2F07!.heldRefinementResponses,
      ), { timeout: 15_000 }).toBeGreaterThan(0);
      await page.evaluate(() => {
        const state = (window as Window & { __cadV2F07?: { heldRefinementResponses: number; releaseNextRefinementResponse: () => void } }).__cadV2F07!;
        while (state.heldRefinementResponses > 0) state.releaseNextRefinementResponse();
      });
      await page.waitForTimeout(750);
      const snapshot = await page.evaluate((baseline) => {
        const state = (window as Window & { __cadV2F07?: { refinementRequests: number; heldRefinementResponses: number; targetErrors: number[] } }).__cadV2F07!;
        return {
          refinementRequests: state.refinementRequests,
          heldRefinementResponses: state.heldRefinementResponses,
          targetErrors: state.targetErrors.slice(baseline),
        };
      }, zoomProfileBaseline.targetErrorCount);
      const idleProfileApplied = snapshot.targetErrors.includes(0.75) && snapshot.targetErrors.at(-1) === 0.25;
      if (snapshot.heldRefinementResponses === 0 && idleProfileApplied) {
        await page.waitForTimeout(750);
        const quietSnapshot = await page.evaluate(() =>
          (window as Window & { __cadV2F07?: { refinementRequests: number; heldRefinementResponses: number } }).__cadV2F07!);
        zoomRefinementStable = quietSnapshot.heldRefinementResponses === 0 &&
          quietSnapshot.refinementRequests === snapshot.refinementRequests;
      }
    }
    expect(zoomRefinementStable, "125% zoom should settle after all transient and idle refinement responses").toBe(true);
    const zoomProfileState = await page.evaluate((baseline) => {
      const state = (window as Window & { __cadV2F07?: { refinementRequests: number; targetErrors: number[]; heldRefinementResponses: number; maxLineVertexCount: number } }).__cadV2F07!;
      return {
        refinementRequests: state.refinementRequests,
        targetErrors: state.targetErrors.slice(baseline),
        heldRefinementResponses: state.heldRefinementResponses,
        maxLineVertexCount: state.maxLineVertexCount,
      };
    }, zoomProfileBaseline.targetErrorCount);
    expect(zoomProfileState.refinementRequests).toBeGreaterThan(zoomProfileBaseline.refinementRequests);
    expect(zoomProfileState.targetErrors).toContain(0.75);
    expect(zoomProfileState.targetErrors.at(-1)).toBe(0.25);
    expect(zoomProfileState.heldRefinementResponses).toBe(0);
    expect(zoomProfileState.maxLineVertexCount).toBeGreaterThan(2);
    const zoomedArcError = await page.evaluate(measureF07ArcRasterError, {
      screenshotBase64: (await canvas.screenshot()).toString("base64"),
      zoomFactor: 1.25,
    });
    expect(zoomedArcError.bluePixelCount).toBeGreaterThan(50);
    expect(zoomedArcError.maximumArcDistanceCssPixels,
      `125% zoom rendered arc pixels exceeded the projected source envelope: ${JSON.stringify(zoomedArcError)}`)
      .toBeLessThanOrEqual(1.25);
    expect(zoomedArcError.maximumSourceArcToPixelDistanceCssPixels,
      `125% zoom projected source arc had a raster coverage gap: ${JSON.stringify(zoomedArcError)}`)
      .toBeLessThanOrEqual(1.25);
    console.log(`F07 125% runtime-refined WebGL arc pixel envelope PASS: ${JSON.stringify(zoomedArcError)}`);

    const panBaseline = await page.evaluate(() => {
      const state = (window as Window & { __cadV2F07?: { refinementRequests: number; targetErrors: number[] } }).__cadV2F07!;
      return { refinementRequests: state.refinementRequests, targetErrorCount: state.targetErrors.length };
    });
    const beforeMeasuredPanFrame = await readFrame();
    const panCssPixels = await dragDrawing();
    await expect.poll(readFrame, { timeout: 5_000 }).not.toBe(beforeMeasuredPanFrame);
    await page.waitForTimeout(750);
    let panRefinementStable = false;
    for (let attempt = 0; attempt < 5 && !panRefinementStable; attempt++) {
      const snapshot = await page.evaluate((baseline) => {
        const state = (window as Window & { __cadV2F07?: { refinementRequests: number; heldRefinementResponses: number; targetErrors: number[] } }).__cadV2F07!;
        return {
          refinementRequests: state.refinementRequests,
          heldRefinementResponses: state.heldRefinementResponses,
          targetErrors: state.targetErrors.slice(baseline),
          lastTargetError: state.targetErrors.at(-1),
        };
      }, panBaseline.targetErrorCount);
      if (snapshot.heldRefinementResponses > 0) {
        await page.evaluate(() => {
          const state = (window as Window & { __cadV2F07?: { heldRefinementResponses: number; releaseNextRefinementResponse: () => void } }).__cadV2F07!;
          while (state.heldRefinementResponses > 0) state.releaseNextRefinementResponse();
        });
      }
      await page.waitForTimeout(750);
      const settledSnapshot = await page.evaluate((baseline) => {
        const state = (window as Window & { __cadV2F07?: { refinementRequests: number; heldRefinementResponses: number; targetErrors: number[] } }).__cadV2F07!;
        return {
          refinementRequests: state.refinementRequests,
          heldRefinementResponses: state.heldRefinementResponses,
          targetErrors: state.targetErrors.slice(baseline),
          lastTargetError: state.targetErrors.at(-1),
        };
      }, panBaseline.targetErrorCount);
      const idleProfileRetained = settledSnapshot.lastTargetError === 0.25 &&
        (settledSnapshot.refinementRequests === panBaseline.refinementRequests ||
          (settledSnapshot.targetErrors.includes(0.75) && settledSnapshot.targetErrors.at(-1) === 0.25));
      if (settledSnapshot.heldRefinementResponses === 0 && idleProfileRetained) {
        await page.waitForTimeout(750);
        const quietSnapshot = await page.evaluate(() => {
          const state = (window as Window & { __cadV2F07?: { refinementRequests: number; heldRefinementResponses: number; targetErrors: number[] } }).__cadV2F07!;
          return {
            refinementRequests: state.refinementRequests,
            heldRefinementResponses: state.heldRefinementResponses,
            lastTargetError: state.targetErrors.at(-1),
          };
        });
        panRefinementStable = quietSnapshot.heldRefinementResponses === 0 &&
          quietSnapshot.refinementRequests === settledSnapshot.refinementRequests &&
          quietSnapshot.lastTargetError === 0.25;
      }
    }
    expect(panRefinementStable, "panned 125% view should retain or settle at the idle refinement profile").toBe(true);
    const panRefinementState = await page.evaluate((baseline) => {
      const state = (window as Window & { __cadV2F07?: { refinementRequests: number; targetErrors: number[]; heldRefinementResponses: number } }).__cadV2F07!;
      return {
        refinementRequests: state.refinementRequests,
        targetErrors: state.targetErrors.slice(baseline),
        heldRefinementResponses: state.heldRefinementResponses,
        lastTargetError: state.targetErrors.at(-1),
      };
    }, panBaseline.targetErrorCount);
    expect(panRefinementState.refinementRequests).toBeGreaterThanOrEqual(panBaseline.refinementRequests);
    if (panRefinementState.refinementRequests > panBaseline.refinementRequests) {
      expect(panRefinementState.targetErrors).toContain(0.75);
      expect(panRefinementState.targetErrors.at(-1)).toBe(0.25);
    }
    expect(panRefinementState.lastTargetError).toBe(0.25);
    expect(panRefinementState.heldRefinementResponses).toBe(0);
    const pannedArcError = await page.evaluate(measureF07ArcRasterError, {
      screenshotBase64: (await canvas.screenshot()).toString("base64"),
      zoomFactor: 1.25,
      panCssPixels,
    });
    expect(pannedArcError.bluePixelCount).toBeGreaterThan(50);
    expect(pannedArcError.maximumArcDistanceCssPixels).toBeLessThanOrEqual(1.25);
    expect(pannedArcError.maximumSourceArcToPixelDistanceCssPixels).toBeLessThanOrEqual(1.25);
    console.log("F07 panned 125% runtime-refined WebGL arc pixel envelope PASS: " + JSON.stringify(pannedArcError));

    await page.evaluate(() => {
      const state = (window as Window & { __cadV2F07?: { refinementRequests: number; targetErrors: number[] } }).__cadV2F07!;
      state.refinementRequests = 0;
      state.targetErrors.length = 0;
    });

    const beforeZoom = await page.evaluate(() => (window as Window & { __cadV2F07?: { refinementRequests: number; maxLineVertexCount: number; targetErrors: number[] } }).__cadV2F07!);
    await page.getByRole("button", { name: "Yakınlaştır (+)" }).click();
    await expect(page.getByText("156%")).toBeVisible();
    await expect.poll(() => page.evaluate(() => (window as Window & { __cadV2F07?: { refinementRequests: number; maxLineVertexCount: number } }).__cadV2F07!),
      { timeout: 15_000 }).toMatchObject({ refinementRequests: beforeZoom.refinementRequests + 1 });
    expect(await page.evaluate((baselineCount) => (window as Window & { __cadV2F07?: { targetErrors: number[] } }).__cadV2F07!.targetErrors.slice(baselineCount), beforeZoom.targetErrors.length))
      .toEqual([0.75]);
    await expect.poll(() => page.evaluate(() => (window as Window & { __cadV2F07?: { heldRefinementResponses: number } }).__cadV2F07?.heldRefinementResponses ?? 0),
      { timeout: 15_000 }).toBe(1);
    await page.getByRole("button", { name: "Yakınlaştır (+)" }).click();
    await expect(page.getByText("195%")).toBeVisible();
    await page.evaluate(() => (window as Window & { __cadV2F07?: { releaseNextRefinementResponse: () => void } }).__cadV2F07!.releaseNextRefinementResponse());
    await expect.poll(() => page.evaluate(() => (window as Window & { __cadV2F07?: { refinementRequests: number } }).__cadV2F07?.refinementRequests ?? 0),
      { timeout: 15_000 }).toBe(beforeZoom.refinementRequests + 2);
    await expect.poll(() => page.evaluate(() => (window as Window & { __cadV2F07?: { heldRefinementResponses: number } }).__cadV2F07?.heldRefinementResponses ?? 0),
      { timeout: 15_000 }).toBe(1);
    expect(await page.evaluate(() => (window as Window & { __cadV2F07?: { maxLineVertexCount: number } }).__cadV2F07!.maxLineVertexCount))
      .toBe(beforeZoom.maxLineVertexCount);
    await page.evaluate(() => (window as Window & { __cadV2F07?: { releaseNextRefinementResponse: () => void } }).__cadV2F07!.releaseNextRefinementResponse());
    await expect.poll(() => page.evaluate(() => (window as Window & { __cadV2F07?: { refinementRequests: number; maxLineVertexCount: number } }).__cadV2F07?.maxLineVertexCount ?? 0),
      { timeout: 15_000 }).toBe(beforeZoom.maxLineVertexCount);
    const transientVertexCount = await page.evaluate(() => (window as Window & { __cadV2F07?: { maxLineVertexCount: number } }).__cadV2F07!.maxLineVertexCount);
    await page.waitForTimeout(400);
    const beforeIdlePanFrame = await readFrame();
    const transientPanCssPixels = await dragDrawing();
    await expect.poll(readFrame, { timeout: 5_000 }).not.toBe(beforeIdlePanFrame);
    await page.waitForTimeout(300);
    expect(await page.evaluate(() => (window as Window & { __cadV2F07?: { refinementRequests: number } }).__cadV2F07!.refinementRequests))
      .toBe(beforeZoom.refinementRequests + 2);
    await expect.poll(() => page.evaluate(() => (window as Window & { __cadV2F07?: { refinementRequests: number } }).__cadV2F07?.refinementRequests ?? 0),
      { timeout: 15_000 }).toBe(beforeZoom.refinementRequests + 3);
    await expect.poll(() => page.evaluate(() => (window as Window & { __cadV2F07?: { heldRefinementResponses: number } }).__cadV2F07?.heldRefinementResponses ?? 0),
      { timeout: 15_000 }).toBe(1);
    expect(await page.evaluate((baselineCount) => (window as Window & { __cadV2F07?: { targetErrors: number[] } }).__cadV2F07!.targetErrors.slice(baselineCount), beforeZoom.targetErrors.length))
      .toEqual([0.75, 0.75, 0.25]);
    expect(await page.evaluate(() => (window as Window & { __cadV2F07?: { maxLineVertexCount: number } }).__cadV2F07!.maxLineVertexCount))
      .toBe(transientVertexCount);
    await page.evaluate(() => (window as Window & { __cadV2F07?: { releaseNextRefinementResponse: () => void } }).__cadV2F07!.releaseNextRefinementResponse());
    await expect.poll(() => page.evaluate(() => (window as Window & { __cadV2F07?: { maxLineVertexCount: number } }).__cadV2F07?.maxLineVertexCount ?? 0),
      { timeout: 15_000 }).toBeGreaterThan(transientVertexCount);

    const beforePanFrame = await readFrame();
    const finalPanCssPixels = await dragDrawing();
    await expect.poll(readFrame, { timeout: 5_000 }).not.toBe(beforePanFrame);
    expect(await page.evaluate(() => (window as Window & { __cadV2F07?: { refinementRequests: number } }).__cadV2F07!.refinementRequests))
      .toBe(beforeZoom.refinementRequests + 3);
    await expect(page.getByText("195%")).toBeVisible();
    const settledHighZoomState = await page.evaluate(() => {
      const state = (window as Window & { __cadV2F07?: { targetErrors: number[]; heldRefinementResponses: number; maxLineVertexCount: number } }).__cadV2F07!;
      return {
        lastTargetError: state.targetErrors.at(-1),
        heldRefinementResponses: state.heldRefinementResponses,
        maxLineVertexCount: state.maxLineVertexCount,
      };
    });
    expect(settledHighZoomState.lastTargetError).toBe(0.25);
    expect(settledHighZoomState.heldRefinementResponses).toBe(0);
    expect(settledHighZoomState.maxLineVertexCount).toBeGreaterThan(transientVertexCount);
    const finalD3ZoomTransform = await page.evaluate(() => {
      const input = document.querySelector<HTMLElement & { __zoom?: { x: number; y: number; k: number } }>(
        '[aria-label="CAD V2 Çizim Etkileşim Alanı"]',
      );
      const transform = input?.__zoom;
      if (!input || !transform) return null;
      const width = input.clientWidth;
      const height = input.clientHeight;
      const margin = Math.min(32, 0.1 * Math.min(width, height));
      const fitUnitsPerCssPixel = Math.max(100 / Math.max(1, width - 2 * margin), 100 / Math.max(1, height - 2 * margin));
      return { x: transform.x, y: transform.y, k: transform.k, width, height, fitUnitsPerCssPixel };
    });
    const highZoomPanOffset = {
      x: panCssPixels.x * 1.25 * 1.25 + transientPanCssPixels.x + finalPanCssPixels.x,
      y: panCssPixels.y * 1.25 * 1.25 + transientPanCssPixels.y + finalPanCssPixels.y,
    };
    expect(finalD3ZoomTransform).not.toBeNull();
    expect(finalD3ZoomTransform!.x).toBeCloseTo(finalD3ZoomTransform!.width / 2 + highZoomPanOffset.x, 6);
    expect(finalD3ZoomTransform!.y).toBeCloseTo(finalD3ZoomTransform!.height / 2 + highZoomPanOffset.y, 6);
    expect(finalD3ZoomTransform!.k).toBeCloseTo(1.953125 / finalD3ZoomTransform!.fitUnitsPerCssPixel, 6);
    const highZoomArcError = await page.evaluate(measureF07ArcRasterError, {
      screenshotBase64: (await canvas.screenshot()).toString("base64"),
      zoomFactor: 1.953125,
      panCssPixels: highZoomPanOffset,
      clipArcToViewport: true,
    });
    console.log("F07 panned 195% runtime-refined visible WebGL arc envelope PASS: " +
      JSON.stringify({ highZoomPanOffset, settledHighZoomState, finalD3ZoomTransform, highZoomArcError }));
    expect(highZoomArcError.bluePixelCount).toBeGreaterThan(50);
    expect(highZoomArcError.maximumArcDistanceCssPixels).toBeLessThanOrEqual(1.25);
    expect(highZoomArcError.maximumSourceArcToPixelDistanceCssPixels).toBeLessThanOrEqual(1.25);

    const lowZoomBaseline = await page.evaluate(() => {
      const state = (window as Window & { __cadV2F07?: { refinementRequests: number; targetErrors: number[] } }).__cadV2F07!;
      return { refinementRequests: state.refinementRequests, targetErrorCount: state.targetErrors.length };
    });
    const zoomOutButton = page.getByRole("button", { name: "Uzaklaştır (-)" });
    const zoomOutFrame = await readFrame();
    for (const expectedZoom of ["156%", "125%", "100%", "80%"] as const) {
      await zoomOutButton.click();
      await expect(page.getByText(expectedZoom)).toBeVisible();
    }
    await expect.poll(readFrame, { timeout: 5_000 }).not.toBe(zoomOutFrame);
    await expect.poll(() => page.evaluate((baseline) =>
      (window as Window & { __cadV2F07?: { refinementRequests: number } }).__cadV2F07!.refinementRequests > baseline,
    lowZoomBaseline.refinementRequests), { timeout: 20_000 }).toBe(true);

    let lowZoomIdleSnapshot: {
      refinementRequests: number;
      targetErrors: number[];
      heldRefinementResponses: number;
      maxLineVertexCount: number;
    } | null = null;
    for (let attempt = 0; attempt < 5 && !lowZoomIdleSnapshot; attempt++) {
      const pending = await page.evaluate(() =>
        (window as Window & { __cadV2F07?: { heldRefinementResponses: number } }).__cadV2F07!.heldRefinementResponses,
      );
      if (pending > 0) {
        await page.evaluate(() => {
          const state = (window as Window & { __cadV2F07?: { heldRefinementResponses: number; releaseNextRefinementResponse: () => void } }).__cadV2F07!;
          while (state.heldRefinementResponses > 0) state.releaseNextRefinementResponse();
        });
      }
      await page.waitForTimeout(350);
      const snapshot = await page.evaluate((baseline) => {
        const state = (window as Window & { __cadV2F07?: {
          refinementRequests: number; targetErrors: number[]; heldRefinementResponses: number; maxLineVertexCount: number;
        } }).__cadV2F07!;
        return {
          refinementRequests: state.refinementRequests,
          targetErrors: state.targetErrors.slice(baseline),
          heldRefinementResponses: state.heldRefinementResponses,
          maxLineVertexCount: state.maxLineVertexCount,
        };
      }, lowZoomBaseline.targetErrorCount);
      const idleProfileApplied = snapshot.targetErrors.includes(0.75) && snapshot.targetErrors.at(-1) === 0.25;
      if (snapshot.heldRefinementResponses === 0 && idleProfileApplied) {
        await page.waitForTimeout(350);
        const confirmation = await page.evaluate((baseline) => {
          const state = (window as Window & { __cadV2F07?: {
            refinementRequests: number; targetErrors: number[]; heldRefinementResponses: number; maxLineVertexCount: number;
          } }).__cadV2F07!;
          return {
            refinementRequests: state.refinementRequests,
            targetErrors: state.targetErrors.slice(baseline),
            heldRefinementResponses: state.heldRefinementResponses,
            maxLineVertexCount: state.maxLineVertexCount,
          };
        }, lowZoomBaseline.targetErrorCount);
        if (JSON.stringify(confirmation) === JSON.stringify(snapshot)) lowZoomIdleSnapshot = confirmation;
      }
    }
    expect(lowZoomIdleSnapshot, "80% DPR1 ARC refinement should settle at 0.25 CSS px with no pending replies").not.toBeNull();

    const cameraAt80 = await page.evaluate(() => {
      const input = document.querySelector<HTMLElement & { __zoom?: { x: number; y: number; k: number } }>(
        '[aria-label="CAD V2 Çizim Etkileşim Alanı"]',
      );
      if (!input?.__zoom) throw new Error("F07 DPR1 ARC camera is missing at 80%");
      const margin = Math.min(32, 0.1 * Math.min(input.clientWidth, input.clientHeight));
      const fitUnitsPerCssPixel = Math.max(
        100 / Math.max(1, input.clientWidth - 2 * margin),
        100 / Math.max(1, input.clientHeight - 2 * margin),
      );
      return { ...input.__zoom, width: input.clientWidth, height: input.clientHeight, fitUnitsPerCssPixel };
    });
    expect(cameraAt80.k * cameraAt80.fitUnitsPerCssPixel).toBeCloseTo(0.8, 6);
    expect(cameraAt80.x - cameraAt80.width / 2).toBeCloseTo(highZoomPanOffset.x * 0.8 ** 4, 6);
    expect(cameraAt80.y - cameraAt80.height / 2).toBeCloseTo(highZoomPanOffset.y * 0.8 ** 4, 6);

    const lowZoomPanCssPixels = { x: 48, y: 24 };
    const lowZoomPanInput = page.getByLabel("CAD V2 Çizim Etkileşim Alanı");
    const lowZoomPanBounds = await lowZoomPanInput.boundingBox();
    expect(lowZoomPanBounds).not.toBeNull();
    const frameBeforeLowZoomPan = await readFrame();
    await page.mouse.move(
      lowZoomPanBounds!.x + lowZoomPanBounds!.width / 2,
      lowZoomPanBounds!.y + lowZoomPanBounds!.height / 2,
    );
    await page.mouse.down();
    await page.mouse.move(
      lowZoomPanBounds!.x + lowZoomPanBounds!.width / 2 + lowZoomPanCssPixels.x,
      lowZoomPanBounds!.y + lowZoomPanBounds!.height / 2 + lowZoomPanCssPixels.y,
      { steps: 4 },
    );
    await page.mouse.up();
    await expect.poll(readFrame, { timeout: 5_000 }).not.toBe(frameBeforeLowZoomPan);
    const cameraAfter80Pan = await page.evaluate(() => {
      const input = document.querySelector<HTMLElement & { __zoom?: { x: number; y: number; k: number } }>(
        '[aria-label="CAD V2 Çizim Etkileşim Alanı"]',
      );
      if (!input?.__zoom) throw new Error("F07 DPR1 ARC camera is missing after its 80% pan");
      return { ...input.__zoom, width: input.clientWidth, height: input.clientHeight };
    });
    expect(cameraAfter80Pan.x - cameraAt80.x).toBeCloseTo(lowZoomPanCssPixels.x, 6);
    expect(cameraAfter80Pan.y - cameraAt80.y).toBeCloseTo(lowZoomPanCssPixels.y, 6);
    expect(cameraAfter80Pan.k).toBeCloseTo(cameraAt80.k, 12);
    const lowZoomPanState = await page.evaluate((baseline) => {
      const state = (window as Window & { __cadV2F07?: {
        refinementRequests: number; targetErrors: number[]; heldRefinementResponses: number; maxLineVertexCount: number;
      } }).__cadV2F07!;
      return {
        refinementRequests: state.refinementRequests,
        targetErrors: state.targetErrors.slice(baseline),
        heldRefinementResponses: state.heldRefinementResponses,
        maxLineVertexCount: state.maxLineVertexCount,
      };
    }, lowZoomBaseline.targetErrorCount);
    await page.waitForTimeout(350);
    const lowZoomPanQuietConfirmation = await page.evaluate((baseline) => {
      const state = (window as Window & { __cadV2F07?: {
        refinementRequests: number; targetErrors: number[]; heldRefinementResponses: number; maxLineVertexCount: number;
      } }).__cadV2F07!;
      return {
        refinementRequests: state.refinementRequests,
        targetErrors: state.targetErrors.slice(baseline),
        heldRefinementResponses: state.heldRefinementResponses,
        maxLineVertexCount: state.maxLineVertexCount,
      };
    }, lowZoomBaseline.targetErrorCount);
    expect(lowZoomPanQuietConfirmation, "same-bucket 80% DPR1 ARC pan must not schedule additional refinement")
      .toEqual(lowZoomPanState);
    expect(lowZoomPanQuietConfirmation.refinementRequests).toBe(lowZoomIdleSnapshot!.refinementRequests);
    expect(lowZoomPanQuietConfirmation.heldRefinementResponses).toBe(0);
    expect(lowZoomPanQuietConfirmation.targetErrors.at(-1)).toBe(0.25);
    expect(lowZoomPanQuietConfirmation.maxLineVertexCount).toBeGreaterThan(2);

    const lowZoomPanOffset = {
      x: cameraAfter80Pan.x - cameraAfter80Pan.width / 2,
      y: cameraAfter80Pan.y - cameraAfter80Pan.height / 2,
    };
    const lowZoomArcError = await page.evaluate(measureF07ArcRasterError, {
      screenshotBase64: (await canvas.screenshot()).toString("base64"),
      zoomFactor: 0.8,
      panCssPixels: lowZoomPanOffset,
      clipArcToViewport: true,
    });
    expect(lowZoomArcError.cameraWidth).toBe(cameraAfter80Pan.width);
    expect(lowZoomArcError.cameraHeight).toBe(cameraAfter80Pan.height);
    expect(lowZoomArcError.imageWidth).toBe(cameraAfter80Pan.width);
    expect(lowZoomArcError.imageHeight).toBe(cameraAfter80Pan.height);
    expect(lowZoomArcError.visibleArcAngles[1]).toBeGreaterThan(lowZoomArcError.visibleArcAngles[0]);
    expect(lowZoomArcError.bluePixelCount).toBeGreaterThan(50);
    expect(lowZoomArcError.maximumArcDistanceCssPixels,
      "80% panned DPR1 ARC pixels exceeded the projected visible-source envelope: " + JSON.stringify(lowZoomArcError))
      .toBeLessThanOrEqual(1.25);
    expect(lowZoomArcError.maximumSourceArcToPixelDistanceCssPixels,
      "80% panned DPR1 ARC source samples had a raster coverage gap: " + JSON.stringify(lowZoomArcError))
      .toBeLessThanOrEqual(1.25);
    console.log("F07 80% panned DPR1 runtime-refined ARC pixel envelope PASS: " + JSON.stringify({
      lowZoomPanCssPixels, cameraAt80, cameraAfter80Pan, lowZoomIdleSnapshot, lowZoomPanQuietConfirmation, lowZoomArcError,
    }));
  });

  test("runtime-refined ARC raster error is bounded at device pixel ratio 2", async ({ browser, page }) => {
    await signInAdmin(page);
    const { fileId } = await uploadCadPreviewV2Fixture(page, "known-geometry-measurements");
    const scene = makeBrowserCurveRefinementScene();
    const sessionId = "vs_f07_camera_curve_refinement_dpr2";
    const context = await browser.newContext({
      baseURL: new URL(page.url()).origin,
      deviceScaleFactor: 2,
      viewport: { width: 1280, height: 720 },
      storageState: await page.context().storageState(),
    });

    try {
      const dprPage = await context.newPage();
      await dprPage.addInitScript(() => {
        const state = {
          targetErrors: [] as number[],
          refinedReplies: 0,
          maxLineVertexCount: 0,
        };
        (window as Window & { __cadV2F07Dpr2?: typeof state }).__cadV2F07Dpr2 = state;

        const NativeWorker = window.Worker;
        window.Worker = new Proxy(NativeWorker, {
          construct(target, args, newTarget) {
            const worker = Reflect.construct(target, args, newTarget) as Worker;
            worker.addEventListener("message", (event) => {
              if ((event.data as { kind?: string })?.kind === "refined-curves") state.refinedReplies++;
            });
            return worker;
          },
        });

        const nativePostMessage = Worker.prototype.postMessage;
        Worker.prototype.postMessage = function(message: unknown, transfer?: Transferable[]) {
          if (message && typeof message === "object" && (message as { kind?: string }).kind === "refine-curves") {
            const targetError = (message as { payload?: { targetErrorCssPixels?: number } }).payload?.targetErrorCssPixels;
            if (typeof targetError === "number") state.targetErrors.push(targetError);
          }
          return nativePostMessage.call(this, message, transfer ?? []);
        };

        const nativeDrawArrays = WebGL2RenderingContext.prototype.drawArrays;
        WebGL2RenderingContext.prototype.drawArrays = function(mode: number, first: number, count: number) {
          if (mode === 0x0001) state.maxLineVertexCount = Math.max(state.maxLineVertexCount, count);
          return nativeDrawArrays.call(this, mode, first, count);
        };
      });

      await dprPage.route("**/api/dokumantasyon/cad-v2/prepare", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ status: "ready", sceneId: scene.sceneId, viewSessionId: sessionId, sourceVersionKey: scene.manifest.sourceVersionKey }),
        });
      });
      await dprPage.route(`**/api/dokumantasyon/cad-v2/scenes/${scene.sceneId}/manifest`, async (route) => {
        await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(scene.manifest) });
      });
      await dprPage.route(`**/api/dokumantasyon/cad-v2/scenes/${scene.sceneId}/chunks/*`, async (route) => {
        const chunkId = new URL(route.request().url()).pathname.split("/").at(-1)!;
        const chunk = scene.chunks.get(chunkId);
        if (!chunk) {
          await route.fulfill({ status: 404, contentType: "application/json", body: JSON.stringify({ error: "F07 DPR2 fixture chunk not found" }) });
          return;
        }
        await route.fulfill({ status: 200, contentType: "application/octet-stream", body: Buffer.from(chunk) });
      });

      await dprPage.goto(`/dokumantasyon/dosya/${fileId}?cadEngine=v2`);
      const canvas = dprPage.locator("canvas").first();
      await expect(canvas).toBeVisible({ timeout: 60_000 });
      await expect(dprPage.getByText("Varlık:")).toBeVisible({ timeout: 60_000 });
      await expect.poll(async () => dprPage.evaluate(() => {
        const state = (window as Window & { __cadV2F07Dpr2?: { targetErrors: number[]; refinedReplies: number; maxLineVertexCount: number } }).__cadV2F07Dpr2;
        return Boolean(state && state.targetErrors.at(-1) === 0.25 &&
          state.refinedReplies >= state.targetErrors.length && state.maxLineVertexCount > 2);
      }), { timeout: 30_000, intervals: [100, 250, 500, 1000] }).toBe(true);

      await dprPage.waitForTimeout(350);
      const quietBefore = await dprPage.evaluate(() => {
        const state = (window as Window & { __cadV2F07Dpr2?: { targetErrors: number[]; refinedReplies: number; maxLineVertexCount: number } }).__cadV2F07Dpr2!;
        return { targetErrors: [...state.targetErrors], refinedReplies: state.refinedReplies, maxLineVertexCount: state.maxLineVertexCount };
      });
      await dprPage.waitForTimeout(350);
      const quietAfter = await dprPage.evaluate(() => {
        const state = (window as Window & { __cadV2F07Dpr2?: { targetErrors: number[]; refinedReplies: number; maxLineVertexCount: number } }).__cadV2F07Dpr2!;
        return { targetErrors: [...state.targetErrors], refinedReplies: state.refinedReplies, maxLineVertexCount: state.maxLineVertexCount };
      });
      expect(quietAfter).toEqual(quietBefore);
      expect(quietAfter.targetErrors.at(-1)).toBe(0.25);

      const rasterContext = await dprPage.evaluate(() => {
        const canvasElement = document.querySelector("canvas");
        if (!canvasElement) throw new Error("F07 DPR2 canvas is missing");
        return {
          devicePixelRatio: window.devicePixelRatio,
          cssWidth: canvasElement.clientWidth,
          cssHeight: canvasElement.clientHeight,
          drawingBufferWidth: canvasElement.width,
          drawingBufferHeight: canvasElement.height,
        };
      });
      expect(rasterContext.devicePixelRatio).toBe(2);
      expect(rasterContext.drawingBufferWidth).toBe(rasterContext.cssWidth * 2);
      expect(rasterContext.drawingBufferHeight).toBe(rasterContext.cssHeight * 2);

      const screenshot = await canvas.screenshot({ scale: "device" });
      const rasterError = await dprPage.evaluate(measureF07ArcRasterError, {
        screenshotBase64: screenshot.toString("base64"),
        zoomFactor: 1,
      });
      expect(rasterError.imageWidth).toBe(rasterError.cameraWidth * 2);
      expect(rasterError.imageHeight).toBe(rasterError.cameraHeight * 2);
      expect(rasterError.bluePixelCount).toBeGreaterThan(100);
      expect(rasterError.maximumArcDistanceCssPixels,
        `DPR2 rendered arc pixels exceeded the projected source envelope: ${JSON.stringify(rasterError)}`)
        .toBeLessThanOrEqual(1.25);
      expect(rasterError.maximumSourceArcToPixelDistanceCssPixels,
        `DPR2 projected source arc had a raster coverage gap: ${JSON.stringify(rasterError)}`)
        .toBeLessThanOrEqual(1.25);
      console.log(`F07 DPR2 runtime-refined WebGL arc pixel envelope PASS: ${JSON.stringify({ rasterContext, quietAfter, rasterError })}`);

      const panInput = dprPage.getByLabel("CAD V2 Çizim Etkileşim Alanı");
      const panBounds = await panInput.boundingBox();
      expect(panBounds).not.toBeNull();
      const cameraBeforePan = await dprPage.evaluate(() => {
        const input = document.querySelector<HTMLElement & { __zoom?: { x: number; y: number; k: number } }>(
          '[aria-label="CAD V2 Çizim Etkileşim Alanı"]',
        );
        if (!input?.__zoom) throw new Error("F07 DPR2 D3 camera transform is missing");
        return { ...input.__zoom };
      });
      const frameBeforePan = crypto.createHash("sha256").update(await canvas.screenshot()).digest("hex");
      const panCssPixels = { x: 48, y: 24 };
      await dprPage.mouse.move(panBounds!.x + panBounds!.width / 2, panBounds!.y + panBounds!.height / 2);
      await dprPage.mouse.down();
      await dprPage.mouse.move(
        panBounds!.x + panBounds!.width / 2 + panCssPixels.x,
        panBounds!.y + panBounds!.height / 2 + panCssPixels.y,
        { steps: 4 },
      );
      await dprPage.mouse.up();
      await expect.poll(async () => crypto.createHash("sha256").update(await canvas.screenshot()).digest("hex"),
        { timeout: 5_000 }).not.toBe(frameBeforePan);

      const cameraAfterPan = await dprPage.evaluate(() => {
        const input = document.querySelector<HTMLElement & { __zoom?: { x: number; y: number; k: number } }>(
          '[aria-label="CAD V2 Çizim Etkileşim Alanı"]',
        );
        if (!input?.__zoom) throw new Error("F07 DPR2 D3 camera transform is missing after pan");
        return { ...input.__zoom };
      });
      expect(cameraAfterPan.x - cameraBeforePan.x).toBeCloseTo(panCssPixels.x, 6);
      expect(cameraAfterPan.y - cameraBeforePan.y).toBeCloseTo(panCssPixels.y, 6);
      expect(cameraAfterPan.k).toBeCloseTo(cameraBeforePan.k, 12);

      let panQuiet = false;
      let panQuietSnapshot = { targetErrors: [] as number[], refinedReplies: 0, maxLineVertexCount: 0 };
      for (let attempt = 0; attempt < 5 && !panQuiet; attempt++) {
        await dprPage.waitForTimeout(350);
        const snapshot = await dprPage.evaluate(() => {
          const state = (window as Window & { __cadV2F07Dpr2?: { targetErrors: number[]; refinedReplies: number; maxLineVertexCount: number } }).__cadV2F07Dpr2!;
          return { targetErrors: [...state.targetErrors], refinedReplies: state.refinedReplies, maxLineVertexCount: state.maxLineVertexCount };
        });
        if (snapshot.refinedReplies >= snapshot.targetErrors.length && snapshot.targetErrors.at(-1) === 0.25) {
          await dprPage.waitForTimeout(350);
          const quiet = await dprPage.evaluate(() => {
            const state = (window as Window & { __cadV2F07Dpr2?: { targetErrors: number[]; refinedReplies: number; maxLineVertexCount: number } }).__cadV2F07Dpr2!;
            return { targetErrors: [...state.targetErrors], refinedReplies: state.refinedReplies, maxLineVertexCount: state.maxLineVertexCount };
          });
          if (JSON.stringify(quiet) === JSON.stringify(snapshot)) {
            panQuiet = true;
            panQuietSnapshot = quiet;
          }
        }
      }
      expect(panQuiet, "panned DPR2 ARC should retain the applied idle refinement and settle with no pending replies").toBe(true);
      expect(panQuietSnapshot.maxLineVertexCount).toBeGreaterThan(2);
      const pannedRasterError = await dprPage.evaluate(measureF07ArcRasterError, {
        screenshotBase64: (await canvas.screenshot({ scale: "device" })).toString("base64"),
        zoomFactor: 1,
        panCssPixels,
      });
      expect(pannedRasterError.imageWidth).toBe(rasterError.imageWidth);
      expect(pannedRasterError.imageHeight).toBe(rasterError.imageHeight);
      expect(pannedRasterError.bluePixelCount).toBeGreaterThan(100);
      expect(pannedRasterError.maximumArcDistanceCssPixels,
        `panned DPR2 rendered arc pixels exceeded the projected source envelope: ${JSON.stringify(pannedRasterError)}`)
        .toBeLessThanOrEqual(1.25);
      expect(pannedRasterError.maximumSourceArcToPixelDistanceCssPixels,
        `panned DPR2 projected source arc had a raster coverage gap: ${JSON.stringify(pannedRasterError)}`)
        .toBeLessThanOrEqual(1.25);
      console.log(`F07 panned DPR2 runtime-refined WebGL arc pixel envelope PASS: ${JSON.stringify({ panCssPixels, cameraBeforePan, cameraAfterPan, panQuietSnapshot, pannedRasterError })}`);

      const waitForDpr2ArcRefinementIdle = async (minimumTargetCount: number, description: string) => {
        await expect.poll(async () => dprPage.evaluate((minimumCount) => {
          const state = (window as Window & { __cadV2F07Dpr2?: { targetErrors: number[]; refinedReplies: number } }).__cadV2F07Dpr2;
          return Boolean(state && state.targetErrors.length >= minimumCount && state.targetErrors.at(-1) === 0.25 &&
            state.refinedReplies >= state.targetErrors.length);
        }, minimumTargetCount), { timeout: 20_000, intervals: [100, 250, 500, 1000] }).toBe(true);

        let quiet = false;
        let quietSnapshot = await dprPage.evaluate(() => {
          const state = (window as Window & { __cadV2F07Dpr2?: { targetErrors: number[]; refinedReplies: number; maxLineVertexCount: number } }).__cadV2F07Dpr2!;
          return { targetErrors: [...state.targetErrors], refinedReplies: state.refinedReplies, maxLineVertexCount: state.maxLineVertexCount };
        });
        for (let attempt = 0; attempt < 5 && !quiet; attempt++) {
          await dprPage.waitForTimeout(350);
          const current = await dprPage.evaluate(() => {
            const state = (window as Window & { __cadV2F07Dpr2?: { targetErrors: number[]; refinedReplies: number; maxLineVertexCount: number } }).__cadV2F07Dpr2!;
            return { targetErrors: [...state.targetErrors], refinedReplies: state.refinedReplies, maxLineVertexCount: state.maxLineVertexCount };
          });
          if (current.refinedReplies >= current.targetErrors.length && current.targetErrors.at(-1) === 0.25) {
            await dprPage.waitForTimeout(350);
            const confirmation = await dprPage.evaluate(() => {
              const state = (window as Window & { __cadV2F07Dpr2?: { targetErrors: number[]; refinedReplies: number; maxLineVertexCount: number } }).__cadV2F07Dpr2!;
              return { targetErrors: [...state.targetErrors], refinedReplies: state.refinedReplies, maxLineVertexCount: state.maxLineVertexCount };
            });
            if (JSON.stringify(confirmation) === JSON.stringify(current)) {
              quiet = true;
              quietSnapshot = confirmation;
            }
          }
        }
        expect(quiet, description + " must settle at 0.25 CSS px with no outstanding replies").toBe(true);
        return quietSnapshot;
      };

      const zoomButton = dprPage.getByRole("button", { name: "Yakınlaştır (+)" });
      let highZoomQuiet = panQuietSnapshot;
      for (const expectedZoom of ["125%", "156%", "195%"] as const) {
        const baselineTargetCount = await dprPage.evaluate(() => {
          const state = (window as Window & { __cadV2F07Dpr2?: { targetErrors: number[] } }).__cadV2F07Dpr2!;
          return state.targetErrors.length;
        });
        await zoomButton.click();
        await expect(dprPage.getByText(expectedZoom)).toBeVisible();
        highZoomQuiet = await waitForDpr2ArcRefinementIdle(
          baselineTargetCount + 1,
          expectedZoom + " DPR2 ARC zoom refinement",
        );
      }

      const cameraAfter195Zoom = await dprPage.evaluate(() => {
        const input = document.querySelector<HTMLElement & { __zoom?: { x: number; y: number; k: number } }>(
          '[aria-label="CAD V2 Çizim Etkileşim Alanı"]',
        );
        if (!input?.__zoom) throw new Error("F07 DPR2 ARC camera transform is missing at 195%");
        return { ...input.__zoom };
      });
      expect(cameraAfter195Zoom.k / cameraBeforePan.k).toBeCloseTo(1.953125, 6);
      expect(cameraAfter195Zoom.x).toBeCloseTo(
        rasterContext.cssWidth / 2 + (cameraAfterPan.x - rasterContext.cssWidth / 2) * 1.953125, 6,
      );
      expect(cameraAfter195Zoom.y).toBeCloseTo(
        rasterContext.cssHeight / 2 + (cameraAfterPan.y - rasterContext.cssHeight / 2) * 1.953125, 6,
      );
      expect(highZoomQuiet.targetErrors.at(-1)).toBe(0.25);
      expect(highZoomQuiet.refinedReplies).toBe(highZoomQuiet.targetErrors.length);

      const highZoomPanCssPixels = { x: 48, y: 24 };
      const frameBeforeHighZoomPan = crypto.createHash("sha256")
        .update(await canvas.screenshot({ scale: "device" })).digest("hex");
      await dprPage.mouse.move(panBounds!.x + panBounds!.width / 2, panBounds!.y + panBounds!.height / 2);
      await dprPage.mouse.down();
      await dprPage.mouse.move(
        panBounds!.x + panBounds!.width / 2 + highZoomPanCssPixels.x,
        panBounds!.y + panBounds!.height / 2 + highZoomPanCssPixels.y,
        { steps: 4 },
      );
      await dprPage.mouse.up();
      const readHighZoomDeviceFrame = async () => crypto.createHash("sha256")
        .update(await canvas.screenshot({ scale: "device" })).digest("hex");
      await expect.poll(readHighZoomDeviceFrame, { timeout: 5_000 }).not.toBe(frameBeforeHighZoomPan);
      const cameraAfter195Pan = await dprPage.evaluate(() => {
        const input = document.querySelector<HTMLElement & { __zoom?: { x: number; y: number; k: number } }>(
          '[aria-label="CAD V2 Çizim Etkileşim Alanı"]',
        );
        if (!input?.__zoom) throw new Error("F07 DPR2 ARC camera transform is missing after its 195% pan");
        return { ...input.__zoom };
      });
      expect(cameraAfter195Pan.x - cameraAfter195Zoom.x).toBeCloseTo(highZoomPanCssPixels.x, 6);
      expect(cameraAfter195Pan.y - cameraAfter195Zoom.y).toBeCloseTo(highZoomPanCssPixels.y, 6);
      expect(cameraAfter195Pan.k).toBeCloseTo(cameraAfter195Zoom.k, 12);
      const highZoomPanQuiet = await waitForDpr2ArcRefinementIdle(
        highZoomQuiet.targetErrors.length,
        "panned 195% DPR2 ARC refinement",
      );
      expect(highZoomPanQuiet.maxLineVertexCount).toBeGreaterThan(2);

      const highZoomPanOffset = {
        x: cameraAfter195Pan.x - rasterContext.cssWidth / 2,
        y: cameraAfter195Pan.y - rasterContext.cssHeight / 2,
      };
      expect(highZoomPanOffset.x).toBeCloseTo(panCssPixels.x * 1.953125 + highZoomPanCssPixels.x, 6);
      expect(highZoomPanOffset.y).toBeCloseTo(panCssPixels.y * 1.953125 + highZoomPanCssPixels.y, 6);
      const highZoomRasterError = await dprPage.evaluate(measureF07ArcRasterError, {
        screenshotBase64: (await canvas.screenshot({ scale: "device" })).toString("base64"),
        zoomFactor: 1.953125,
        panCssPixels: highZoomPanOffset,
        clipArcToViewport: true,
      });
      expect(highZoomRasterError.imageWidth).toBe(rasterContext.drawingBufferWidth);
      expect(highZoomRasterError.imageHeight).toBe(rasterContext.drawingBufferHeight);
      expect(highZoomRasterError.bluePixelCount).toBeGreaterThan(100);
      expect(highZoomRasterError.visibleArcAngles[1]).toBeGreaterThan(highZoomRasterError.visibleArcAngles[0]);
      expect(highZoomRasterError.maximumArcDistanceCssPixels,
        "195% panned DPR2 ARC pixels exceeded the projected visible-source envelope: " + JSON.stringify(highZoomRasterError))
        .toBeLessThanOrEqual(1.25);
      expect(highZoomRasterError.maximumSourceArcToPixelDistanceCssPixels,
        "195% panned DPR2 ARC source samples had a raster coverage gap: " + JSON.stringify(highZoomRasterError))
        .toBeLessThanOrEqual(1.25);
      console.log("F07 195% panned DPR2 runtime-refined ARC pixel envelope PASS: " + JSON.stringify({
        highZoomPanCssPixels, cameraAfter195Zoom, cameraAfter195Pan, highZoomPanQuiet, highZoomRasterError,
      }));
    } finally {
      await context.close();
    }
  });

  test("runtime-refined ELLIPSE raster error is bounded by an independent parametric oracle", async ({ browser, page }) => {
    await signInAdmin(page);
    const { fileId } = await uploadCadPreviewV2Fixture(page, "known-geometry-measurements");
    const scene = makeBrowserEllipseRefinementScene();
    const sceneChunk = scene.chunks.get("chunk_f07_ellipse");
    if (!sceneChunk) throw new Error("F07 ELLIPSE fixture chunk was not created");
    const metaSection = parseSceneChunk(sceneChunk).sections.get(SceneTag.META)?.data as Uint8Array | undefined;
    if (!metaSection) throw new Error("F07 ELLIPSE fixture metadata was not encoded");
    const fixtureMeta = JSON.parse(new TextDecoder().decode(metaSection)) as {
      curveSourceRefs: Array<{ sourceType: string; curveRecordIndex: number; firstVertex: number; vertexCount: number }>;
    };
    expect(fixtureMeta.curveSourceRefs).toEqual([{
      curveId: "F07-RUNTIME-ELLIPSE", sourceHandle: "F07E1", sourceType: "ELLIPSE", firstSegmentIndex: 0,
      segmentCount: 1, curveRecordIndex: 0, firstVertex: 0, vertexCount: 2,
    }]);

    const context = await browser.newContext({
      baseURL: new URL(page.url()).origin,
      deviceScaleFactor: 1,
      viewport: { width: 1280, height: 720 },
      storageState: await page.context().storageState(),
    });
    try {
      const ellipsePage = await context.newPage();
      await configureF07EllipseRefinementPage(ellipsePage, scene, "vs_f07_runtime_ellipse");

      await ellipsePage.goto(`/dokumantasyon/dosya/${fileId}?cadEngine=v2`);
      const canvas = ellipsePage.locator("canvas").first();
      await expect(canvas).toBeVisible({ timeout: 60_000 });
      await expect(ellipsePage.getByText("Varlık:")).toBeVisible({ timeout: 60_000 });
      await expect.poll(() => ellipsePage.evaluate(() => {
        const state = (window as Window & { __cadV2F07Ellipse?: { targetErrors: number[]; refinedReplies: number; maxLineVertexCount: number } }).__cadV2F07Ellipse;
        return Boolean(state && state.targetErrors.includes(0.25) &&
          state.refinedReplies >= state.targetErrors.length && state.maxLineVertexCount > 2);
      }), { timeout: 30_000, intervals: [100, 250, 500, 1000] }).toBe(true);

      await ellipsePage.waitForTimeout(350);
      const quietBefore = await ellipsePage.evaluate(() => {
        const state = (window as Window & { __cadV2F07Ellipse?: { targetErrors: number[]; refinedReplies: number; maxLineVertexCount: number } }).__cadV2F07Ellipse!;
        return { targetErrors: [...state.targetErrors], refinedReplies: state.refinedReplies, maxLineVertexCount: state.maxLineVertexCount };
      });
      await ellipsePage.waitForTimeout(350);
      const quietAfter = await ellipsePage.evaluate(() => {
        const state = (window as Window & { __cadV2F07Ellipse?: { targetErrors: number[]; refinedReplies: number; maxLineVertexCount: number } }).__cadV2F07Ellipse!;
        return { targetErrors: [...state.targetErrors], refinedReplies: state.refinedReplies, maxLineVertexCount: state.maxLineVertexCount };
      });
      expect(quietAfter).toEqual(quietBefore);
      expect(quietAfter.targetErrors.at(-1)).toBe(0.25);
      expect(quietAfter.refinedReplies).toBe(quietAfter.targetErrors.length);

      const rasterContext = await ellipsePage.evaluate(() => {
        const canvasElement = document.querySelector("canvas");
        if (!canvasElement) throw new Error("F07 ELLIPSE canvas is missing");
        return {
          devicePixelRatio: window.devicePixelRatio,
          cssWidth: canvasElement.clientWidth,
          cssHeight: canvasElement.clientHeight,
          drawingBufferWidth: canvasElement.width,
          drawingBufferHeight: canvasElement.height,
        };
      });
      expect(rasterContext.devicePixelRatio).toBe(1);
      expect(rasterContext.drawingBufferWidth).toBe(rasterContext.cssWidth);
      expect(rasterContext.drawingBufferHeight).toBe(rasterContext.cssHeight);

      const screenshot = await canvas.screenshot({ scale: "device" });
      const rasterError = await ellipsePage.evaluate(measureF07EllipseRasterError, {
        screenshotBase64: screenshot.toString("base64"),
        semimajor: scene.semimajor,
        semiminor: scene.semiminor,
      });
      expect(rasterError.bluePixelCount).toBeGreaterThan(100);
      expect(rasterError.maximumRenderedToSourceDistanceCssPixels,
        `ELLIPSE raster pixels exceeded the independent parametric source envelope: ${JSON.stringify(rasterError)}`)
        .toBeLessThanOrEqual(1.25);
      expect(rasterError.maximumSourceToRenderedDistanceCssPixels,
        `ELLIPSE source samples had a raster coverage gap: ${JSON.stringify(rasterError)}`)
        .toBeLessThanOrEqual(1.25);
      console.log(`F07 runtime-refined ELLIPSE raster envelope PASS: ${JSON.stringify({ rasterContext, quietAfter, rasterError })}`);

      const waitForRefinementIdle = async (minimumTargetCount: number, description: string) => {
        await expect.poll(() => ellipsePage.evaluate((minimumCount) => {
          const state = (window as Window & { __cadV2F07Ellipse?: { targetErrors: number[]; refinedReplies: number } }).__cadV2F07Ellipse;
          return Boolean(state && state.targetErrors.length >= minimumCount && state.targetErrors.at(-1) === 0.25 &&
            state.refinedReplies >= state.targetErrors.length);
        }, minimumTargetCount), { timeout: 20_000, intervals: [100, 250, 500, 1000] }).toBe(true);

        let quiet = false;
        let quietSnapshot = await ellipsePage.evaluate(() => {
          const state = (window as Window & { __cadV2F07Ellipse?: { targetErrors: number[]; refinedReplies: number; maxLineVertexCount: number } }).__cadV2F07Ellipse!;
          return { targetErrors: [...state.targetErrors], refinedReplies: state.refinedReplies, maxLineVertexCount: state.maxLineVertexCount };
        });
        for (let attempt = 0; attempt < 5 && !quiet; attempt++) {
          await ellipsePage.waitForTimeout(350);
          const current = await ellipsePage.evaluate(() => {
            const state = (window as Window & { __cadV2F07Ellipse?: { targetErrors: number[]; refinedReplies: number; maxLineVertexCount: number } }).__cadV2F07Ellipse!;
            return { targetErrors: [...state.targetErrors], refinedReplies: state.refinedReplies, maxLineVertexCount: state.maxLineVertexCount };
          });
          if (current.refinedReplies >= current.targetErrors.length && current.targetErrors.at(-1) === 0.25) {
            await ellipsePage.waitForTimeout(350);
            const confirmation = await ellipsePage.evaluate(() => {
              const state = (window as Window & { __cadV2F07Ellipse?: { targetErrors: number[]; refinedReplies: number; maxLineVertexCount: number } }).__cadV2F07Ellipse!;
              return { targetErrors: [...state.targetErrors], refinedReplies: state.refinedReplies, maxLineVertexCount: state.maxLineVertexCount };
            });
            if (JSON.stringify(confirmation) === JSON.stringify(current)) {
              quiet = true;
              quietSnapshot = confirmation;
            }
          }
        }
        expect(quiet, description + " must settle at 0.25 CSS px with no outstanding replies").toBe(true);
        return quietSnapshot;
      };

      const zoomButton = ellipsePage.getByRole("button", { name: "Yakınlaştır (+)" });
      const cameraBeforeZoom = await ellipsePage.evaluate(() => {
        const input = document.querySelector<HTMLElement & { __zoom?: { x: number; y: number; k: number } }>(
          '[aria-label="CAD V2 Çizim Etkileşim Alanı"]',
        );
        if (!input?.__zoom) throw new Error("F07 DPR1 ELLIPSE D3 camera transform is missing before zoom");
        return { ...input.__zoom };
      });
      let settledRefinement = quietAfter;
      for (const expectedZoom of ["125%", "156%"] as const) {
        const baseline = await ellipsePage.evaluate(() => {
          const state = (window as Window & { __cadV2F07Ellipse?: { targetErrors: number[] } }).__cadV2F07Ellipse!;
          return state.targetErrors.length;
        });
        await zoomButton.click();
        await expect(ellipsePage.getByText(expectedZoom)).toBeVisible();
        settledRefinement = await waitForRefinementIdle(baseline + 1, expectedZoom + " DPR1 ELLIPSE zoom refinement");
      }
      expect(settledRefinement.targetErrors.at(-1)).toBe(0.25);
      expect(settledRefinement.refinedReplies).toBe(settledRefinement.targetErrors.length);

      const cameraAfterZoom = await ellipsePage.evaluate(() => {
        const input = document.querySelector<HTMLElement & { __zoom?: { x: number; y: number; k: number } }>(
          '[aria-label="CAD V2 Çizim Etkileşim Alanı"]',
        );
        if (!input?.__zoom) throw new Error("F07 DPR1 ELLIPSE D3 camera transform is missing at 156%");
        return { ...input.__zoom };
      });
      expect(cameraAfterZoom.k / cameraBeforeZoom.k).toBeCloseTo(1.5625, 6);
      expect(cameraAfterZoom.x).toBeCloseTo(rasterContext.cssWidth / 2, 6);
      expect(cameraAfterZoom.y).toBeCloseTo(rasterContext.cssHeight / 2, 6);

      const panCssPixels = { x: 48, y: 24 };
      const panInput = ellipsePage.getByLabel("CAD V2 Çizim Etkileşim Alanı");
      const panBounds = await panInput.boundingBox();
      expect(panBounds).not.toBeNull();
      const frameBeforePan = crypto.createHash("sha256").update(await canvas.screenshot({ scale: "device" })).digest("hex");
      await ellipsePage.mouse.move(panBounds!.x + panBounds!.width / 2, panBounds!.y + panBounds!.height / 2);
      await ellipsePage.mouse.down();
      await ellipsePage.mouse.move(
        panBounds!.x + panBounds!.width / 2 + panCssPixels.x,
        panBounds!.y + panBounds!.height / 2 + panCssPixels.y,
        { steps: 4 },
      );
      await ellipsePage.mouse.up();
      const readDeviceFrame = async () => crypto.createHash("sha256")
        .update(await canvas.screenshot({ scale: "device" })).digest("hex");
      await expect.poll(readDeviceFrame, { timeout: 5_000 }).not.toBe(frameBeforePan);
      const cameraAfterPan = await ellipsePage.evaluate(() => {
        const input = document.querySelector<HTMLElement & { __zoom?: { x: number; y: number; k: number } }>(
          '[aria-label="CAD V2 Çizim Etkileşim Alanı"]',
        );
        if (!input?.__zoom) throw new Error("F07 DPR1 ELLIPSE D3 camera transform is missing after pan");
        return { ...input.__zoom };
      });
      expect(cameraAfterPan.x - cameraAfterZoom.x).toBeCloseTo(panCssPixels.x, 6);
      expect(cameraAfterPan.y - cameraAfterZoom.y).toBeCloseTo(panCssPixels.y, 6);
      expect(cameraAfterPan.k).toBeCloseTo(cameraAfterZoom.k, 12);
      const panQuiet = await waitForRefinementIdle(settledRefinement.targetErrors.length, "panned 156% DPR1 ELLIPSE refinement");
      expect(panQuiet.maxLineVertexCount).toBeGreaterThan(2);

      const pannedScreenshot = await canvas.screenshot({ scale: "device" });
      const pannedRasterError = await ellipsePage.evaluate(measureF07EllipseRasterError, {
        screenshotBase64: pannedScreenshot.toString("base64"),
        semimajor: scene.semimajor,
        semiminor: scene.semiminor,
        zoomFactor: 1.5625,
        panCssPixels,
      });
      expect(pannedRasterError.imageWidth).toBe(rasterContext.cssWidth);
      expect(pannedRasterError.imageHeight).toBe(rasterContext.cssHeight);
      expect(pannedRasterError.bluePixelCount).toBeGreaterThan(100);
      expect(pannedRasterError.maximumRenderedToSourceDistanceCssPixels,
        "156% panned DPR1 ELLIPSE rendered pixels exceeded the independent parametric source envelope: " + JSON.stringify(pannedRasterError))
        .toBeLessThanOrEqual(1.25);
      expect(pannedRasterError.maximumSourceToRenderedDistanceCssPixels,
        "156% panned DPR1 ELLIPSE source samples had a raster coverage gap: " + JSON.stringify(pannedRasterError))
        .toBeLessThanOrEqual(1.25);
      console.log("F07 156% panned DPR1 runtime-refined ELLIPSE pixel envelope PASS: " + JSON.stringify({
        panCssPixels, cameraBeforeZoom, cameraAfterZoom, cameraAfterPan, panQuiet, pannedRasterError,
      }));

      const highZoomBaseline = await ellipsePage.evaluate(() => {
        const state = (window as Window & { __cadV2F07Ellipse?: { targetErrors: number[] } }).__cadV2F07Ellipse!;
        return state.targetErrors.length;
      });
      await zoomButton.click();
      await expect(ellipsePage.getByText("195%")).toBeVisible();
      const highZoomQuiet = await waitForRefinementIdle(highZoomBaseline + 1, "195% DPR1 ELLIPSE zoom refinement");
      const cameraAfter195Zoom = await ellipsePage.evaluate(() => {
        const input = document.querySelector<HTMLElement & { __zoom?: { x: number; y: number; k: number } }>(
          '[aria-label="CAD V2 Çizim Etkileşim Alanı"]',
        );
        if (!input?.__zoom) throw new Error("F07 DPR1 ELLIPSE D3 camera transform is missing at 195%");
        return { ...input.__zoom };
      });
      expect(cameraAfter195Zoom.k / cameraBeforeZoom.k).toBeCloseTo(1.953125, 6);
      expect(cameraAfter195Zoom.x).toBeCloseTo(
        rasterContext.cssWidth / 2 + (cameraAfterPan.x - rasterContext.cssWidth / 2) * 1.25, 6,
      );
      expect(cameraAfter195Zoom.y).toBeCloseTo(
        rasterContext.cssHeight / 2 + (cameraAfterPan.y - rasterContext.cssHeight / 2) * 1.25, 6,
      );
      expect(highZoomQuiet.targetErrors.at(-1)).toBe(0.25);
      expect(highZoomQuiet.refinedReplies).toBe(highZoomQuiet.targetErrors.length);

      const highZoomPanPixels = { x: -10, y: -5 };
      const frameBeforeHighZoomPan = crypto.createHash("sha256")
        .update(await canvas.screenshot({ scale: "device" })).digest("hex");
      await ellipsePage.mouse.move(panBounds!.x + panBounds!.width / 2, panBounds!.y + panBounds!.height / 2);
      await ellipsePage.mouse.down();
      await ellipsePage.mouse.move(
        panBounds!.x + panBounds!.width / 2 + highZoomPanPixels.x,
        panBounds!.y + panBounds!.height / 2 + highZoomPanPixels.y,
        { steps: 4 },
      );
      await ellipsePage.mouse.up();
      const readHighZoomFrame = async () => crypto.createHash("sha256")
        .update(await canvas.screenshot({ scale: "device" })).digest("hex");
      await expect.poll(readHighZoomFrame, { timeout: 5_000 }).not.toBe(frameBeforeHighZoomPan);
      const cameraAfter195Pan = await ellipsePage.evaluate(() => {
        const input = document.querySelector<HTMLElement & { __zoom?: { x: number; y: number; k: number } }>(
          '[aria-label="CAD V2 Çizim Etkileşim Alanı"]',
        );
        if (!input?.__zoom) throw new Error("F07 DPR1 ELLIPSE D3 camera transform is missing after the 195% pan");
        return { ...input.__zoom };
      });
      expect(cameraAfter195Pan.x - cameraAfter195Zoom.x).toBeCloseTo(highZoomPanPixels.x, 6);
      expect(cameraAfter195Pan.y - cameraAfter195Zoom.y).toBeCloseTo(highZoomPanPixels.y, 6);
      expect(cameraAfter195Pan.k).toBeCloseTo(cameraAfter195Zoom.k, 12);
      const highZoomPanQuiet = await waitForRefinementIdle(
        highZoomQuiet.targetErrors.length,
        "panned 195% DPR1 ELLIPSE refinement",
      );
      expect(highZoomPanQuiet.maxLineVertexCount).toBeGreaterThan(2);

      const highZoomPanOffset = {
        x: cameraAfter195Pan.x - rasterContext.cssWidth / 2,
        y: cameraAfter195Pan.y - rasterContext.cssHeight / 2,
      };
      const highZoomPanScreenshot = await canvas.screenshot({ scale: "device" });
      const highZoomPanRasterError = await ellipsePage.evaluate(measureF07EllipseRasterError, {
        screenshotBase64: highZoomPanScreenshot.toString("base64"),
        semimajor: scene.semimajor,
        semiminor: scene.semiminor,
        zoomFactor: 1.953125,
        panCssPixels: highZoomPanOffset,
      });
      expect(highZoomPanRasterError.imageWidth).toBe(rasterContext.cssWidth);
      expect(highZoomPanRasterError.imageHeight).toBe(rasterContext.cssHeight);
      expect(highZoomPanRasterError.bluePixelCount).toBeGreaterThan(100);
      expect(highZoomPanRasterError.maximumRenderedToSourceDistanceCssPixels,
        "195% panned DPR1 ELLIPSE pixels exceeded the independent parametric source envelope: " + JSON.stringify(highZoomPanRasterError))
        .toBeLessThanOrEqual(1.25);
      expect(highZoomPanRasterError.maximumSourceToRenderedDistanceCssPixels,
        "195% panned DPR1 ELLIPSE source samples had a raster coverage gap: " + JSON.stringify(highZoomPanRasterError))
        .toBeLessThanOrEqual(1.25);
      console.log("F07 195% panned DPR1 runtime-refined ELLIPSE pixel envelope PASS: " + JSON.stringify({
        highZoomPanPixels, cameraAfter195Zoom, cameraAfter195Pan, highZoomPanQuiet, highZoomPanRasterError,
      }));

      const zoomOutBaseline = await ellipsePage.evaluate(() => {
        const state = (window as Window & { __cadV2F07Ellipse?: { targetErrors: number[] } }).__cadV2F07Ellipse!;
        return state.targetErrors.length;
      });
      const zoomOutButton = ellipsePage.getByRole("button", { name: "Uzaklaştır (-)" });
      const frameBeforeZoomOut = await readHighZoomFrame();
      for (const expectedZoom of ["156%", "125%", "100%", "80%"] as const) {
        await zoomOutButton.click();
        await expect(ellipsePage.getByText(expectedZoom)).toBeVisible();
      }
      await expect.poll(readHighZoomFrame, { timeout: 5_000 }).not.toBe(frameBeforeZoomOut);
      const cameraAfter80Zoom = await ellipsePage.evaluate(() => {
        const input = document.querySelector<HTMLElement & { __zoom?: { x: number; y: number; k: number } }>(
          '[aria-label="CAD V2 Çizim Etkileşim Alanı"]',
        );
        if (!input?.__zoom) throw new Error("F07 DPR1 ELLIPSE D3 camera is missing at 80%");
        return { ...input.__zoom };
      });
      expect(cameraAfter80Zoom.k / cameraBeforeZoom.k).toBeCloseTo(0.8, 6);
      const zoomOutPanOffset = {
        x: cameraAfter80Zoom.x - rasterContext.cssWidth / 2,
        y: cameraAfter80Zoom.y - rasterContext.cssHeight / 2,
      };
      expect(zoomOutPanOffset.x).toBeCloseTo(
        (cameraAfter195Pan.x - rasterContext.cssWidth / 2) * 0.8 ** 4, 6,
      );
      expect(zoomOutPanOffset.y).toBeCloseTo(
        (cameraAfter195Pan.y - rasterContext.cssHeight / 2) * 0.8 ** 4, 6,
      );
      const zoomOutQuiet = await waitForRefinementIdle(zoomOutBaseline + 1, "80% DPR1 ELLIPSE zoom-out refinement");

      const final80PanPixels = { x: -10, y: -5 };
      const frameBefore80Pan = await readHighZoomFrame();
      await ellipsePage.mouse.move(panBounds!.x + panBounds!.width / 2, panBounds!.y + panBounds!.height / 2);
      await ellipsePage.mouse.down();
      await ellipsePage.mouse.move(
        panBounds!.x + panBounds!.width / 2 + final80PanPixels.x,
        panBounds!.y + panBounds!.height / 2 + final80PanPixels.y,
        { steps: 4 },
      );
      await ellipsePage.mouse.up();
      await expect.poll(readHighZoomFrame, { timeout: 5_000 }).not.toBe(frameBefore80Pan);
      const cameraAfter80Pan = await ellipsePage.evaluate(() => {
        const input = document.querySelector<HTMLElement & { __zoom?: { x: number; y: number; k: number } }>(
          '[aria-label="CAD V2 Çizim Etkileşim Alanı"]',
        );
        if (!input?.__zoom) throw new Error("F07 DPR1 ELLIPSE D3 camera is missing after its 80% pan");
        return { ...input.__zoom };
      });
      expect(cameraAfter80Pan.x - cameraAfter80Zoom.x).toBeCloseTo(final80PanPixels.x, 6);
      expect(cameraAfter80Pan.y - cameraAfter80Zoom.y).toBeCloseTo(final80PanPixels.y, 6);
      expect(cameraAfter80Pan.k).toBeCloseTo(cameraAfter80Zoom.k, 12);
      const final80PanQuietSnapshot = await ellipsePage.evaluate(() => {
        const state = (window as Window & { __cadV2F07Ellipse?: { targetErrors: number[]; refinedReplies: number; maxLineVertexCount: number } }).__cadV2F07Ellipse!;
        return { targetErrors: [...state.targetErrors], refinedReplies: state.refinedReplies, maxLineVertexCount: state.maxLineVertexCount };
      });
      await ellipsePage.waitForTimeout(350);
      const final80PanQuietConfirmation = await ellipsePage.evaluate(() => {
        const state = (window as Window & { __cadV2F07Ellipse?: { targetErrors: number[]; refinedReplies: number; maxLineVertexCount: number } }).__cadV2F07Ellipse!;
        return { targetErrors: [...state.targetErrors], refinedReplies: state.refinedReplies, maxLineVertexCount: state.maxLineVertexCount };
      });
      expect(final80PanQuietConfirmation, "80% same-bucket DPR1 ELLIPSE pan must not request more refinement")
        .toEqual(final80PanQuietSnapshot);
      expect(final80PanQuietConfirmation).toEqual(zoomOutQuiet);
      expect(final80PanQuietConfirmation.refinedReplies).toBe(final80PanQuietConfirmation.targetErrors.length);
      expect(final80PanQuietConfirmation.targetErrors.at(-1)).toBe(0.25);
      expect(final80PanQuietConfirmation.maxLineVertexCount).toBeGreaterThan(2);

      const final80PanOffset = {
        x: cameraAfter80Pan.x - rasterContext.cssWidth / 2,
        y: cameraAfter80Pan.y - rasterContext.cssHeight / 2,
      };
      expect(final80PanOffset.x).toBeCloseTo(zoomOutPanOffset.x + final80PanPixels.x, 6);
      expect(final80PanOffset.y).toBeCloseTo(zoomOutPanOffset.y + final80PanPixels.y, 6);
      const final80PanScreenshot = await canvas.screenshot({ scale: "device" });
      const final80PanRasterError = await ellipsePage.evaluate(measureF07EllipseRasterError, {
        screenshotBase64: final80PanScreenshot.toString("base64"),
        semimajor: scene.semimajor,
        semiminor: scene.semiminor,
        zoomFactor: 0.8,
        panCssPixels: final80PanOffset,
      });
      expect(final80PanRasterError.imageWidth).toBe(rasterContext.drawingBufferWidth);
      expect(final80PanRasterError.imageHeight).toBe(rasterContext.drawingBufferHeight);
      expect(final80PanRasterError.bluePixelCount).toBeGreaterThan(100);
      expect(final80PanRasterError.analyticSampleCount).toBe(4097);
      expect(final80PanRasterError.visibleSourceAngles[1]).toBeGreaterThan(final80PanRasterError.visibleSourceAngles[0]);
      expect(final80PanRasterError.maximumRenderedToSourceDistanceCssPixels,
        "80% panned DPR1 ELLIPSE pixels exceeded the independent parametric source envelope: " + JSON.stringify(final80PanRasterError))
        .toBeLessThanOrEqual(1.25);
      expect(final80PanRasterError.maximumSourceToRenderedDistanceCssPixels,
        "80% panned DPR1 ELLIPSE source samples had a raster coverage gap: " + JSON.stringify(final80PanRasterError))
        .toBeLessThanOrEqual(1.25);
      console.log("F07 80% panned DPR1 runtime-refined ELLIPSE pixel envelope PASS: " + JSON.stringify({
        final80PanPixels, cameraAfter80Zoom, cameraAfter80Pan, zoomOutQuiet, final80PanQuietConfirmation, final80PanRasterError,
      }));
    } finally {
      await context.close();
    }
  });

  test("runtime-refined SPLINE raster error is bounded by an independent rational Bernstein oracle", async ({ browser, page }) => {
    await signInAdmin(page);
    const { fileId } = await uploadCadPreviewV2Fixture(page, "known-geometry-measurements");
    const scene = makeBrowserSplineRefinementScene();
    const sceneChunk = scene.chunks.get("chunk_f07_spline");
    if (!sceneChunk) throw new Error("F07 SPLINE fixture chunk was not created");
    const metaSection = parseSceneChunk(sceneChunk).sections.get(SceneTag.META)?.data as Uint8Array | undefined;
    if (!metaSection) throw new Error("F07 SPLINE fixture metadata was not encoded");
    const fixtureMeta = JSON.parse(new TextDecoder().decode(metaSection)) as {
      curveSourceRefs: Array<{
        sourceType: string;
        curveRecordIndex: number;
        firstVertex: number;
        vertexCount: number;
        splineSource?: { controlPoints: [number, number][]; weights: number[] };
      }>;
    };
    expect(fixtureMeta.curveSourceRefs).toEqual([{
      curveId: "F07-RUNTIME-SPLINE", sourceHandle: "F07S1", sourceType: "SPLINE", firstSegmentIndex: 0,
      segmentCount: 1, curveRecordIndex: 0, firstVertex: 0, vertexCount: 2,
      splineSource: { controlPoints: scene.controlPoints, weights: scene.weights },
    }]);

    const context = await browser.newContext({
      baseURL: new URL(page.url()).origin,
      deviceScaleFactor: 1,
      viewport: { width: 1280, height: 720 },
      storageState: await page.context().storageState(),
    });
    try {
      const splinePage = await context.newPage();
      await configureF07SplineRefinementPage(splinePage, scene, "vs_f07_runtime_spline");
      await splinePage.goto("/dokumantasyon/dosya/" + fileId + "?cadEngine=v2");
      const canvas = splinePage.locator("canvas").first();
      await expect(canvas).toBeVisible({ timeout: 60_000 });
      await expect(splinePage.getByText("Varlık:")).toBeVisible({ timeout: 60_000 });
      await expect.poll(() => splinePage.evaluate(() => {
        const state = (window as Window & { __cadV2F07Spline?: { targetErrors: number[]; refinedReplies: number; maxLineVertexCount: number } }).__cadV2F07Spline;
        return Boolean(state && state.targetErrors.at(-1) === 0.25 &&
          state.refinedReplies >= state.targetErrors.length && state.maxLineVertexCount > 2);
      }), { timeout: 30_000, intervals: [100, 250, 500, 1000] }).toBe(true);

      await splinePage.waitForTimeout(350);
      const quietBefore = await splinePage.evaluate(() => {
        const state = (window as Window & { __cadV2F07Spline?: { targetErrors: number[]; refinedReplies: number; maxLineVertexCount: number } }).__cadV2F07Spline!;
        return { targetErrors: [...state.targetErrors], refinedReplies: state.refinedReplies, maxLineVertexCount: state.maxLineVertexCount };
      });
      await splinePage.waitForTimeout(350);
      const quietAfter = await splinePage.evaluate(() => {
        const state = (window as Window & { __cadV2F07Spline?: { targetErrors: number[]; refinedReplies: number; maxLineVertexCount: number } }).__cadV2F07Spline!;
        return { targetErrors: [...state.targetErrors], refinedReplies: state.refinedReplies, maxLineVertexCount: state.maxLineVertexCount };
      });
      expect(quietAfter).toEqual(quietBefore);
      expect(quietAfter.targetErrors.at(-1)).toBe(0.25);
      expect(quietAfter.refinedReplies).toBe(quietAfter.targetErrors.length);
      expect(quietAfter.maxLineVertexCount).toBeGreaterThan(2);

      const rasterContext = await splinePage.evaluate(() => {
        const canvasElement = document.querySelector("canvas");
        const input = document.querySelector<HTMLElement & { __zoom?: { x: number; y: number; k: number } }>(
          '[aria-label="CAD V2 Çizim Etkileşim Alanı"]',
        );
        if (!canvasElement || !input?.__zoom) throw new Error("F07 SPLINE canvas/camera is missing");
        return {
          devicePixelRatio: window.devicePixelRatio,
          cssWidth: canvasElement.clientWidth,
          cssHeight: canvasElement.clientHeight,
          drawingBufferWidth: canvasElement.width,
          drawingBufferHeight: canvasElement.height,
          camera: { ...input.__zoom },
        };
      });
      expect(rasterContext.devicePixelRatio).toBe(1);
      expect(rasterContext.drawingBufferWidth).toBe(rasterContext.cssWidth);
      expect(rasterContext.drawingBufferHeight).toBe(rasterContext.cssHeight);
      expect(rasterContext.camera.k).toBeCloseTo(6.08, 6);
      expect(rasterContext.camera.x).toBeCloseTo(rasterContext.cssWidth / 2, 6);
      expect(rasterContext.camera.y).toBeCloseTo(rasterContext.cssHeight / 2, 6);

      const screenshot = await canvas.screenshot({ scale: "device" });
      const rasterError = await splinePage.evaluate(measureF07SplineRasterError, {
        screenshotBase64: screenshot.toString("base64"),
        controlPoints: scene.controlPoints,
        weights: scene.weights,
        camera: rasterContext.camera,
      });
      expect(rasterError.imageWidth).toBe(rasterContext.cssWidth);
      expect(rasterError.imageHeight).toBe(rasterContext.cssHeight);
      expect(rasterError.bluePixelCount).toBeGreaterThan(100);
      expect(rasterError.independentSourceSampleCount).toBe(4097);
      expect(rasterError.maximumRenderedToSourceDistanceCssPixels,
        "runtime-refined SPLINE pixels exceeded the independent rational Bernstein source envelope: " + JSON.stringify(rasterError))
        .toBeLessThanOrEqual(1.25);
      expect(rasterError.maximumSourceToRenderedDistanceCssPixels,
        "independent rational Bernstein SPLINE samples had a raster coverage gap: " + JSON.stringify(rasterError))
        .toBeLessThanOrEqual(1.25);
      console.log("F07 runtime-refined rational SPLINE raster envelope PASS: " + JSON.stringify({
        rasterContext, quietAfter, rasterError,
      }));

      const readSplineState = async () => splinePage.evaluate(() => {
        const state = (window as Window & {
          __cadV2F07Spline?: { targetErrors: number[]; refinedReplies: number; maxLineVertexCount: number };
        }).__cadV2F07Spline;
        if (!state) throw new Error("F07 DPR1 SPLINE worker instrumentation is missing");
        return { targetErrors: [...state.targetErrors], refinedReplies: state.refinedReplies, maxLineVertexCount: state.maxLineVertexCount };
      });
      const waitForSplineQuiet = async (description: string, previousTargetCount?: number) => {
        await expect.poll(async () => {
          const state = await readSplineState();
          return (previousTargetCount === undefined || state.targetErrors.length > previousTargetCount) &&
            state.targetErrors.at(-1) === 0.25 && state.refinedReplies === state.targetErrors.length &&
            state.maxLineVertexCount > 2;
        }, { timeout: 30_000, intervals: [100, 250, 500, 1000] }).toBe(true);
        let quietSnapshot = await readSplineState();
        let quiet = false;
        let stableIntervals = 0;
        for (let attempt = 0; attempt < 8 && stableIntervals < 2; attempt++) {
          await splinePage.waitForTimeout(350);
          const next = await readSplineState();
          if (JSON.stringify(next) === JSON.stringify(quietSnapshot)) stableIntervals++;
          else stableIntervals = 0;
          quietSnapshot = next;
        }
        quiet = stableIntervals === 2;
        expect(quiet, description + " must settle with no pending refinement reply").toBe(true);
        expect(quietSnapshot.refinedReplies).toBe(quietSnapshot.targetErrors.length);
        expect(quietSnapshot.targetErrors.at(-1)).toBe(0.25);
        return quietSnapshot;
      };

      let highZoomState = quietAfter;
      let highZoomCamera = rasterContext.camera;
      const zoomButton = splinePage.getByRole("button", { name: "Yakınlaştır (+)" });
      for (const expectedZoom of ["125%", "156%", "195%"] as const) {
        const baseline = await readSplineState();
        await zoomButton.click();
        await expect(splinePage.getByText(expectedZoom)).toBeVisible();
        highZoomState = await waitForSplineQuiet("DPR1 SPLINE " + expectedZoom, baseline.targetErrors.length);
        const camera = await splinePage.evaluate(() => {
          const input = document.querySelector<HTMLElement & { __zoom?: { x: number; y: number; k: number } }>(
            '[aria-label="CAD V2 Çizim Etkileşim Alanı"]',
          );
          if (!input?.__zoom) throw new Error("F07 DPR1 SPLINE D3 camera is missing after zoom");
          return { ...input.__zoom };
        });
        expect(camera.k / highZoomCamera.k).toBeCloseTo(1.25, 6);
        expect(camera.x).toBeCloseTo(rasterContext.cssWidth / 2, 6);
        expect(camera.y).toBeCloseTo(rasterContext.cssHeight / 2, 6);
        expect(highZoomState.targetErrors.length).toBeGreaterThan(baseline.targetErrors.length);
        highZoomCamera = camera;
      }
      expect(highZoomCamera.k / rasterContext.camera.k).toBeCloseTo(1.953125, 6);

      const highZoomPanCssPixels = { x: 48, y: 24 };
      const panInput = splinePage.getByLabel("CAD V2 Çizim Etkileşim Alanı");
      const panBounds = await panInput.boundingBox();
      expect(panBounds).not.toBeNull();
      const frameBeforeHighZoomPan = crypto.createHash("sha256")
        .update(await canvas.screenshot({ scale: "device" })).digest("hex");
      await splinePage.mouse.move(panBounds!.x + panBounds!.width / 2, panBounds!.y + panBounds!.height / 2);
      await splinePage.mouse.down();
      await splinePage.mouse.move(
        panBounds!.x + panBounds!.width / 2 + highZoomPanCssPixels.x,
        panBounds!.y + panBounds!.height / 2 + highZoomPanCssPixels.y,
        { steps: 4 },
      );
      await splinePage.mouse.up();
      const readDpr1SplineDeviceFrame = async () => crypto.createHash("sha256")
        .update(await canvas.screenshot({ scale: "device" })).digest("hex");
      await expect.poll(readDpr1SplineDeviceFrame, { timeout: 5_000 }).not.toBe(frameBeforeHighZoomPan);
      const cameraAfterHighZoomPan = await splinePage.evaluate(() => {
        const input = document.querySelector<HTMLElement & { __zoom?: { x: number; y: number; k: number } }>(
          '[aria-label="CAD V2 Çizim Etkileşim Alanı"]',
        );
        if (!input?.__zoom) throw new Error("F07 DPR1 SPLINE D3 camera is missing after high-zoom pan");
        return { ...input.__zoom };
      });
      expect(cameraAfterHighZoomPan.x - highZoomCamera.x).toBeCloseTo(highZoomPanCssPixels.x, 6);
      expect(cameraAfterHighZoomPan.y - highZoomCamera.y).toBeCloseTo(highZoomPanCssPixels.y, 6);
      expect(cameraAfterHighZoomPan.k).toBeCloseTo(highZoomCamera.k, 12);
      const highZoomPanState = await waitForSplineQuiet("same-bucket 195% DPR1 SPLINE pan");
      expect(highZoomPanState).toEqual(highZoomState);

      const highZoomPanScreenshot = await canvas.screenshot({ scale: "device" });
      const highZoomPanRasterError = await splinePage.evaluate(measureF07SplineRasterError, {
        screenshotBase64: highZoomPanScreenshot.toString("base64"),
        controlPoints: scene.controlPoints,
        weights: scene.weights,
        camera: cameraAfterHighZoomPan,
      });
      expect(highZoomPanRasterError.imageWidth).toBe(rasterContext.drawingBufferWidth);
      expect(highZoomPanRasterError.imageHeight).toBe(rasterContext.drawingBufferHeight);
      expect(highZoomPanRasterError.bluePixelCount).toBeGreaterThan(100);
      expect(highZoomPanRasterError.independentSourceSampleCount).toBe(4097);
      expect(highZoomPanRasterError.sourceBounds.minX).toBeGreaterThanOrEqual(0);
      expect(highZoomPanRasterError.sourceBounds.minY).toBeGreaterThanOrEqual(0);
      expect(highZoomPanRasterError.sourceBounds.maxX).toBeLessThan(rasterContext.cssWidth);
      expect(highZoomPanRasterError.sourceBounds.maxY).toBeLessThan(rasterContext.cssHeight);
      expect(highZoomPanRasterError.maximumRenderedToSourceDistanceCssPixels,
        "195% panned DPR1 SPLINE pixels exceeded the independent rational Bernstein envelope: " + JSON.stringify(highZoomPanRasterError))
        .toBeLessThanOrEqual(1.25);
      expect(highZoomPanRasterError.maximumSourceToRenderedDistanceCssPixels,
        "195% panned DPR1 SPLINE source samples had a raster coverage gap: " + JSON.stringify(highZoomPanRasterError))
        .toBeLessThanOrEqual(1.25);
      console.log("F07 195% panned DPR1 runtime-refined rational SPLINE raster envelope PASS: " + JSON.stringify({
        highZoomPanCssPixels, highZoomCamera, cameraAfterHighZoomPan, highZoomPanState, highZoomPanRasterError,
      }));

      const zoomOutBaseline = await readSplineState();
      const zoomOutButton = splinePage.getByRole("button", { name: "Uzaklaştır (-)" });
      const frameBeforeSplineZoomOut = await readDpr1SplineDeviceFrame();
      for (const expectedZoom of ["156%", "125%", "100%", "80%"] as const) {
        await zoomOutButton.click();
        await expect(splinePage.getByText(expectedZoom)).toBeVisible();
      }
      await expect.poll(readDpr1SplineDeviceFrame, { timeout: 5_000 }).not.toBe(frameBeforeSplineZoomOut);
      const cameraAfter80Zoom = await splinePage.evaluate(() => {
        const input = document.querySelector<HTMLElement & { __zoom?: { x: number; y: number; k: number } }>(
          '[aria-label="CAD V2 Çizim Etkileşim Alanı"]',
        );
        if (!input?.__zoom) throw new Error("F07 DPR1 SPLINE D3 camera is missing at 80%");
        return { ...input.__zoom };
      });
      expect(cameraAfter80Zoom.k / rasterContext.camera.k).toBeCloseTo(0.8, 6);
      const zoomedOutPanOffset = {
        x: cameraAfter80Zoom.x - rasterContext.cssWidth / 2,
        y: cameraAfter80Zoom.y - rasterContext.cssHeight / 2,
      };
      expect(zoomedOutPanOffset.x).toBeCloseTo(
        (cameraAfterHighZoomPan.x - rasterContext.cssWidth / 2) * 0.8 ** 4, 6,
      );
      expect(zoomedOutPanOffset.y).toBeCloseTo(
        (cameraAfterHighZoomPan.y - rasterContext.cssHeight / 2) * 0.8 ** 4, 6,
      );
      const zoomOutQuiet = await waitForSplineQuiet("80% DPR1 SPLINE zoom-out refinement", zoomOutBaseline.targetErrors.length);

      const final80PanCssPixels = { x: -10, y: -5 };
      const frameBeforeFinal80Pan = await readDpr1SplineDeviceFrame();
      await splinePage.mouse.move(panBounds!.x + panBounds!.width / 2, panBounds!.y + panBounds!.height / 2);
      await splinePage.mouse.down();
      await splinePage.mouse.move(
        panBounds!.x + panBounds!.width / 2 + final80PanCssPixels.x,
        panBounds!.y + panBounds!.height / 2 + final80PanCssPixels.y,
        { steps: 4 },
      );
      await splinePage.mouse.up();
      await expect.poll(readDpr1SplineDeviceFrame, { timeout: 5_000 }).not.toBe(frameBeforeFinal80Pan);
      const cameraAfter80Pan = await splinePage.evaluate(() => {
        const input = document.querySelector<HTMLElement & { __zoom?: { x: number; y: number; k: number } }>(
          '[aria-label="CAD V2 Çizim Etkileşim Alanı"]',
        );
        if (!input?.__zoom) throw new Error("F07 DPR1 SPLINE D3 camera is missing after its 80% pan");
        return { ...input.__zoom };
      });
      expect(cameraAfter80Pan.x - cameraAfter80Zoom.x).toBeCloseTo(final80PanCssPixels.x, 6);
      expect(cameraAfter80Pan.y - cameraAfter80Zoom.y).toBeCloseTo(final80PanCssPixels.y, 6);
      expect(cameraAfter80Pan.k).toBeCloseTo(cameraAfter80Zoom.k, 12);
      const final80PanSnapshot = await readSplineState();
      await splinePage.waitForTimeout(350);
      const final80PanQuietSnapshot = await readSplineState();
      expect(final80PanQuietSnapshot, "80% same-bucket DPR1 pan must not schedule another SPLINE refinement")
        .toEqual(final80PanSnapshot);
      expect(final80PanQuietSnapshot).toEqual(zoomOutQuiet);
      expect(final80PanQuietSnapshot.refinedReplies).toBe(final80PanQuietSnapshot.targetErrors.length);
      expect(final80PanQuietSnapshot.targetErrors.at(-1)).toBe(0.25);

      const final80PanScreenshot = await canvas.screenshot({ scale: "device" });
      const final80PanRasterError = await splinePage.evaluate(measureF07SplineRasterError, {
        screenshotBase64: final80PanScreenshot.toString("base64"),
        controlPoints: scene.controlPoints,
        weights: scene.weights,
        camera: cameraAfter80Pan,
      });
      expect(final80PanRasterError.imageWidth).toBe(rasterContext.drawingBufferWidth);
      expect(final80PanRasterError.imageHeight).toBe(rasterContext.drawingBufferHeight);
      expect(final80PanRasterError.bluePixelCount).toBeGreaterThan(100);
      expect(final80PanRasterError.independentSourceSampleCount).toBe(4097);
      expect(final80PanRasterError.sourceBounds.minX).toBeGreaterThanOrEqual(0);
      expect(final80PanRasterError.sourceBounds.minY).toBeGreaterThanOrEqual(0);
      expect(final80PanRasterError.sourceBounds.maxX).toBeLessThan(rasterContext.cssWidth);
      expect(final80PanRasterError.sourceBounds.maxY).toBeLessThan(rasterContext.cssHeight);
      expect(final80PanRasterError.maximumRenderedToSourceDistanceCssPixels,
        "80% panned DPR1 SPLINE pixels exceeded the independent rational Bernstein envelope: " + JSON.stringify(final80PanRasterError))
        .toBeLessThanOrEqual(1.25);
      expect(final80PanRasterError.maximumSourceToRenderedDistanceCssPixels,
        "80% panned DPR1 SPLINE source samples had a raster coverage gap: " + JSON.stringify(final80PanRasterError))
        .toBeLessThanOrEqual(1.25);
      console.log("F07 80% panned DPR1 runtime-refined rational SPLINE raster envelope PASS: " + JSON.stringify({
        final80PanCssPixels, cameraAfter80Zoom, cameraAfter80Pan, zoomOutQuiet, final80PanQuietSnapshot, final80PanRasterError,
      }));
    } finally {
      await context.close();
    }
  });
  test("runtime-refined SPLINE pan raster error is bounded at DPR2", async ({ browser, page }) => {
    await signInAdmin(page);
    const { fileId } = await uploadCadPreviewV2Fixture(page, "known-geometry-measurements");
    const scene = makeBrowserSplineRefinementScene();
    const sceneChunk = scene.chunks.get("chunk_f07_spline");
    if (!sceneChunk) throw new Error("F07 DPR2 SPLINE fixture chunk was not created");
    const metadata = parseSceneChunk(sceneChunk).sections.get(SceneTag.META)?.data as Uint8Array | undefined;
    if (!metadata) throw new Error("F07 DPR2 SPLINE source metadata was not encoded");
    const fixtureMeta = JSON.parse(new TextDecoder().decode(metadata)) as {
      curveSourceRefs: Array<{ sourceType: string; splineSource?: { controlPoints: [number, number][]; weights: number[] } }>;
    };
    expect(fixtureMeta.curveSourceRefs[0]).toMatchObject({
      sourceType: "SPLINE",
      splineSource: { controlPoints: scene.controlPoints, weights: scene.weights },
    });

    const context = await browser.newContext({
      baseURL: new URL(page.url()).origin,
      deviceScaleFactor: 2,
      viewport: { width: 1280, height: 720 },
      storageState: await page.context().storageState(),
    });
    try {
      const splinePage = await context.newPage();
      await configureF07SplineRefinementPage(splinePage, scene, "vs_f07_runtime_spline_dpr2_pan");
      await splinePage.goto("/dokumantasyon/dosya/" + fileId + "?cadEngine=v2");
      const canvas = splinePage.locator("canvas").first();
      await expect(canvas).toBeVisible({ timeout: 60_000 });
      await expect(splinePage.getByText("Varlık:")).toBeVisible({ timeout: 60_000 });

      const readState = async () => splinePage.evaluate(() => {
        const state = (window as Window & {
          __cadV2F07Spline?: { targetErrors: number[]; refinedReplies: number; maxLineVertexCount: number };
        }).__cadV2F07Spline;
        if (!state) throw new Error("F07 DPR2 SPLINE worker instrumentation is missing");
        return { targetErrors: [...state.targetErrors], refinedReplies: state.refinedReplies, maxLineVertexCount: state.maxLineVertexCount };
      });
      const waitForQuiet = async (description: string, afterTargetCount = 0) => {
        await expect.poll(async () => {
          const state = await readState();
          return state.targetErrors.length > afterTargetCount && state.targetErrors.at(-1) === 0.25 &&
            state.refinedReplies === state.targetErrors.length && state.maxLineVertexCount > 2;
        }, { timeout: 30_000, intervals: [100, 250, 500, 1000] }).toBe(true);
        let quietSnapshot = await readState();
        let quiet = false;
        for (let attempt = 0; attempt < 5 && !quiet; attempt++) {
          await splinePage.waitForTimeout(350);
          const next = await readState();
          if (JSON.stringify(next) === JSON.stringify(quietSnapshot)) quiet = true;
          quietSnapshot = next;
        }
        expect(quiet, description + " should remain stable with no pending replies").toBe(true);
        expect(quietSnapshot.refinedReplies).toBe(quietSnapshot.targetErrors.length);
        expect(quietSnapshot.targetErrors.at(-1)).toBe(0.25);
        return quietSnapshot;
      };

      const beforePanQuiet = await waitForQuiet("DPR2 SPLINE fit refinement");
      const rasterContext = await splinePage.evaluate(() => {
        const canvasElement = document.querySelector("canvas");
        const input = document.querySelector<HTMLElement & { __zoom?: { x: number; y: number; k: number } }>(
          '[aria-label="CAD V2 Çizim Etkileşim Alanı"]',
        );
        if (!canvasElement || !input?.__zoom) throw new Error("F07 DPR2 SPLINE canvas/camera is missing");
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
      expect(rasterContext.camera.k).toBeCloseTo(6.08, 6);
      expect(rasterContext.camera.x).toBeCloseTo(rasterContext.cssWidth / 2, 6);
      expect(rasterContext.camera.y).toBeCloseTo(rasterContext.cssHeight / 2, 6);

      const panCssPixels = { x: 48, y: 24 };
      const panInput = splinePage.getByLabel("CAD V2 Çizim Etkileşim Alanı");
      const panBounds = await panInput.boundingBox();
      expect(panBounds).not.toBeNull();
      const frameBeforePan = crypto.createHash("sha256").update(await canvas.screenshot({ scale: "device" })).digest("hex");
      await splinePage.mouse.move(panBounds!.x + panBounds!.width / 2, panBounds!.y + panBounds!.height / 2);
      await splinePage.mouse.down();
      await splinePage.mouse.move(
        panBounds!.x + panBounds!.width / 2 + panCssPixels.x,
        panBounds!.y + panBounds!.height / 2 + panCssPixels.y,
        { steps: 4 },
      );
      await splinePage.mouse.up();
      const readDeviceFrame = async () => crypto.createHash("sha256")
        .update(await canvas.screenshot({ scale: "device" })).digest("hex");
      await expect.poll(readDeviceFrame, { timeout: 5_000 }).not.toBe(frameBeforePan);

      const cameraAfterPan = await splinePage.evaluate(() => {
        const input = document.querySelector<HTMLElement & { __zoom?: { x: number; y: number; k: number } }>(
          '[aria-label="CAD V2 Çizim Etkileşim Alanı"]',
        );
        if (!input?.__zoom) throw new Error("F07 DPR2 SPLINE camera is missing after pan");
        return { ...input.__zoom };
      });
      expect(cameraAfterPan.x - rasterContext.camera.x).toBeCloseTo(panCssPixels.x, 6);
      expect(cameraAfterPan.y - rasterContext.camera.y).toBeCloseTo(panCssPixels.y, 6);
      expect(cameraAfterPan.k).toBeCloseTo(rasterContext.camera.k, 12);
      const panQuiet = await waitForQuiet("panned DPR2 SPLINE refinement");

      const screenshot = await canvas.screenshot({ scale: "device" });
      const rasterError = await splinePage.evaluate(measureF07SplineRasterError, {
        screenshotBase64: screenshot.toString("base64"),
        controlPoints: scene.controlPoints,
        weights: scene.weights,
        camera: cameraAfterPan,
      });
      expect(rasterError.imageWidth).toBe(rasterContext.drawingBufferWidth);
      expect(rasterError.imageHeight).toBe(rasterContext.drawingBufferHeight);
      expect(rasterError.bluePixelCount).toBeGreaterThan(100);
      expect(rasterError.independentSourceSampleCount).toBe(4097);
      expect(rasterError.maximumRenderedToSourceDistanceCssPixels,
        "DPR2 panned SPLINE pixels exceeded the independent rational Bernstein envelope: " + JSON.stringify(rasterError))
        .toBeLessThanOrEqual(1.25);
      expect(rasterError.maximumSourceToRenderedDistanceCssPixels,
        "DPR2 panned SPLINE source samples had a raster gap: " + JSON.stringify(rasterError))
        .toBeLessThanOrEqual(1.25);
      console.log("F07 panned DPR2 runtime-refined rational SPLINE raster envelope PASS: " + JSON.stringify({
        panCssPixels, rasterContext, cameraAfterPan, beforePanQuiet, panQuiet, rasterError,
      }));

      const zoomBaseline = await readState();
      await splinePage.getByRole("button", { name: "Yakınlaştır (+)" }).click();
      await expect(splinePage.getByText("125%")).toBeVisible();
      const zoomQuiet = await waitForQuiet("125% DPR2 SPLINE zoom refinement", zoomBaseline.targetErrors.length);
      const cameraAfterZoom = await splinePage.evaluate(() => {
        const input = document.querySelector<HTMLElement & { __zoom?: { x: number; y: number; k: number } }>(
          '[aria-label="CAD V2 Çizim Etkileşim Alanı"]',
        );
        if (!input?.__zoom) throw new Error("F07 DPR2 SPLINE D3 camera is missing after zoom");
        return { ...input.__zoom };
      });
      expect(cameraAfterZoom.k / cameraAfterPan.k).toBeCloseTo(1.25, 6);
      expect(cameraAfterZoom.x).toBeCloseTo(rasterContext.cssWidth / 2 + panCssPixels.x * 1.25, 6);
      expect(cameraAfterZoom.y).toBeCloseTo(rasterContext.cssHeight / 2 + panCssPixels.y * 1.25, 6);
      expect(zoomQuiet.refinedReplies).toBe(zoomQuiet.targetErrors.length);
      expect(zoomQuiet.targetErrors.at(-1)).toBe(0.25);

      const zoomPanCssPixels = { x: 48, y: 24 };
      const frameBeforeZoomPan = await readDeviceFrame();
      await splinePage.mouse.move(panBounds!.x + panBounds!.width / 2, panBounds!.y + panBounds!.height / 2);
      await splinePage.mouse.down();
      await splinePage.mouse.move(
        panBounds!.x + panBounds!.width / 2 + zoomPanCssPixels.x,
        panBounds!.y + panBounds!.height / 2 + zoomPanCssPixels.y,
        { steps: 4 },
      );
      await splinePage.mouse.up();
      await expect.poll(readDeviceFrame, { timeout: 5_000 }).not.toBe(frameBeforeZoomPan);
      const cameraAfterZoomPan = await splinePage.evaluate(() => {
        const input = document.querySelector<HTMLElement & { __zoom?: { x: number; y: number; k: number } }>(
          '[aria-label="CAD V2 Çizim Etkileşim Alanı"]',
        );
        if (!input?.__zoom) throw new Error("F07 DPR2 SPLINE D3 camera is missing after zoom-pan");
        return { ...input.__zoom };
      });
      expect(cameraAfterZoomPan.x - cameraAfterZoom.x).toBeCloseTo(zoomPanCssPixels.x, 6);
      expect(cameraAfterZoomPan.y - cameraAfterZoom.y).toBeCloseTo(zoomPanCssPixels.y, 6);
      expect(cameraAfterZoomPan.k).toBeCloseTo(cameraAfterZoom.k, 12);
      const zoomedPanOffset = {
        x: cameraAfterZoomPan.x - rasterContext.cssWidth / 2,
        y: cameraAfterZoomPan.y - rasterContext.cssHeight / 2,
      };
      expect(zoomedPanOffset.x).toBeCloseTo(panCssPixels.x * 1.25 + zoomPanCssPixels.x, 6);
      expect(zoomedPanOffset.y).toBeCloseTo(panCssPixels.y * 1.25 + zoomPanCssPixels.y, 6);
      const zoomPanQuiet = await waitForQuiet("panned 125% DPR2 SPLINE refinement");
      const zoomPanScreenshot = await canvas.screenshot({ scale: "device" });
      const zoomPanRasterError = await splinePage.evaluate(measureF07SplineRasterError, {
        screenshotBase64: zoomPanScreenshot.toString("base64"),
        controlPoints: scene.controlPoints,
        weights: scene.weights,
        camera: cameraAfterZoomPan,
      });
      expect(zoomPanRasterError.imageWidth).toBe(rasterContext.drawingBufferWidth);
      expect(zoomPanRasterError.imageHeight).toBe(rasterContext.drawingBufferHeight);
      expect(zoomPanRasterError.bluePixelCount).toBeGreaterThan(100);
      expect(zoomPanRasterError.independentSourceSampleCount).toBe(4097);
      expect(zoomPanRasterError.maximumRenderedToSourceDistanceCssPixels,
        "125% panned DPR2 SPLINE pixels exceeded the independent rational Bernstein envelope: " + JSON.stringify(zoomPanRasterError))
        .toBeLessThanOrEqual(1.25);
      expect(zoomPanRasterError.maximumSourceToRenderedDistanceCssPixels,
        "125% panned DPR2 SPLINE source samples had a raster coverage gap: " + JSON.stringify(zoomPanRasterError))
        .toBeLessThanOrEqual(1.25);
      expect(zoomPanQuiet.refinedReplies).toBe(zoomPanQuiet.targetErrors.length);
      expect(zoomPanQuiet.targetErrors.at(-1)).toBe(0.25);
      console.log("F07 125% panned DPR2 runtime-refined rational SPLINE raster envelope PASS: " + JSON.stringify({
        zoomBaseline, zoomQuiet, cameraAfterZoom, zoomPanCssPixels, cameraAfterZoomPan, zoomPanQuiet, zoomPanRasterError,
      }));

      const highZoomBaseline = await readState();
      await splinePage.getByRole("button", { name: "Yakınlaştır (+)" }).click();
      await expect(splinePage.getByText("156%")).toBeVisible();
      const highZoomQuiet = await waitForQuiet("156% DPR2 SPLINE zoom refinement", highZoomBaseline.targetErrors.length);
      const cameraAfterHighZoom = await splinePage.evaluate(() => {
        const input = document.querySelector<HTMLElement & { __zoom?: { x: number; y: number; k: number } }>(
          '[aria-label="CAD V2 Çizim Etkileşim Alanı"]',
        );
        if (!input?.__zoom) throw new Error("F07 DPR2 SPLINE D3 camera is missing after 156% zoom");
        return { ...input.__zoom };
      });
      expect(cameraAfterHighZoom.k / cameraAfterZoomPan.k).toBeCloseTo(1.25, 6);
      expect(cameraAfterHighZoom.x).toBeCloseTo(
        rasterContext.cssWidth / 2 + zoomedPanOffset.x * 1.25, 6,
      );
      expect(cameraAfterHighZoom.y).toBeCloseTo(
        rasterContext.cssHeight / 2 + zoomedPanOffset.y * 1.25, 6,
      );
      expect(highZoomQuiet.refinedReplies).toBe(highZoomQuiet.targetErrors.length);
      expect(highZoomQuiet.targetErrors.at(-1)).toBe(0.25);

      const highZoomPanCssPixels = { x: 48, y: 24 };
      const frameBeforeHighZoomPan = await readDeviceFrame();
      await splinePage.mouse.move(panBounds!.x + panBounds!.width / 2, panBounds!.y + panBounds!.height / 2);
      await splinePage.mouse.down();
      await splinePage.mouse.move(
        panBounds!.x + panBounds!.width / 2 + highZoomPanCssPixels.x,
        panBounds!.y + panBounds!.height / 2 + highZoomPanCssPixels.y,
        { steps: 4 },
      );
      await splinePage.mouse.up();
      await expect.poll(readDeviceFrame, { timeout: 5_000 }).not.toBe(frameBeforeHighZoomPan);
      const cameraAfterHighZoomPan = await splinePage.evaluate(() => {
        const input = document.querySelector<HTMLElement & { __zoom?: { x: number; y: number; k: number } }>(
          '[aria-label="CAD V2 Çizim Etkileşim Alanı"]',
        );
        if (!input?.__zoom) throw new Error("F07 DPR2 SPLINE D3 camera is missing after 156% pan");
        return { ...input.__zoom };
      });
      expect(cameraAfterHighZoomPan.x - cameraAfterHighZoom.x).toBeCloseTo(highZoomPanCssPixels.x, 6);
      expect(cameraAfterHighZoomPan.y - cameraAfterHighZoom.y).toBeCloseTo(highZoomPanCssPixels.y, 6);
      expect(cameraAfterHighZoomPan.k).toBeCloseTo(cameraAfterHighZoom.k, 12);
      const highZoomPanOffset = {
        x: cameraAfterHighZoomPan.x - rasterContext.cssWidth / 2,
        y: cameraAfterHighZoomPan.y - rasterContext.cssHeight / 2,
      };
      expect(highZoomPanOffset.x).toBeCloseTo(zoomedPanOffset.x * 1.25 + highZoomPanCssPixels.x, 6);
      expect(highZoomPanOffset.y).toBeCloseTo(zoomedPanOffset.y * 1.25 + highZoomPanCssPixels.y, 6);
      const highZoomPanQuiet = await waitForQuiet("panned 156% DPR2 SPLINE refinement");
      const highZoomPanScreenshot = await canvas.screenshot({ scale: "device" });
      const highZoomPanRasterError = await splinePage.evaluate(measureF07SplineRasterError, {
        screenshotBase64: highZoomPanScreenshot.toString("base64"),
        controlPoints: scene.controlPoints,
        weights: scene.weights,
        camera: cameraAfterHighZoomPan,
      });
      expect(highZoomPanRasterError.imageWidth).toBe(rasterContext.drawingBufferWidth);
      expect(highZoomPanRasterError.imageHeight).toBe(rasterContext.drawingBufferHeight);
      expect(highZoomPanRasterError.bluePixelCount).toBeGreaterThan(100);
      expect(highZoomPanRasterError.independentSourceSampleCount).toBe(4097);
      expect(highZoomPanRasterError.sourceBounds.minX).toBeGreaterThanOrEqual(0);
      expect(highZoomPanRasterError.sourceBounds.minY).toBeGreaterThanOrEqual(0);
      expect(highZoomPanRasterError.sourceBounds.maxX).toBeLessThan(rasterContext.cssWidth);
      expect(highZoomPanRasterError.sourceBounds.maxY).toBeLessThan(rasterContext.cssHeight);
      expect(highZoomPanRasterError.maximumRenderedToSourceDistanceCssPixels,
        "156% panned DPR2 SPLINE pixels exceeded the independent rational Bernstein envelope: " + JSON.stringify(highZoomPanRasterError))
        .toBeLessThanOrEqual(1.25);
      expect(highZoomPanRasterError.maximumSourceToRenderedDistanceCssPixels,
        "156% panned DPR2 SPLINE source samples had a raster coverage gap: " + JSON.stringify(highZoomPanRasterError))
        .toBeLessThanOrEqual(1.25);
      expect(highZoomPanQuiet.refinedReplies).toBe(highZoomPanQuiet.targetErrors.length);
      expect(highZoomPanQuiet.targetErrors.at(-1)).toBe(0.25);
      console.log("F07 156% panned DPR2 runtime-refined rational SPLINE raster envelope PASS: " + JSON.stringify({
        highZoomBaseline, highZoomQuiet, cameraAfterHighZoom, highZoomPanCssPixels,
        cameraAfterHighZoomPan, highZoomPanQuiet, highZoomPanRasterError,
      }));

      const ultraZoomBaseline = await readState();
      const frameBefore195Zoom = await readDeviceFrame();
      await splinePage.getByRole("button", { name: "Yakınlaştır (+)" }).click();
      await expect(splinePage.getByText("195%")).toBeVisible();
      const ultraZoomQuiet = await waitForQuiet("195% DPR2 SPLINE zoom refinement", ultraZoomBaseline.targetErrors.length);
      await expect.poll(readDeviceFrame, { timeout: 5_000 }).not.toBe(frameBefore195Zoom);
      const cameraAfter195Zoom = await splinePage.evaluate(() => {
        const input = document.querySelector<HTMLElement & { __zoom?: { x: number; y: number; k: number } }>(
          '[aria-label="CAD V2 Çizim Etkileşim Alanı"]',
        );
        if (!input?.__zoom) throw new Error("F07 DPR2 SPLINE D3 camera is missing after 195% zoom");
        return { ...input.__zoom };
      });
      expect(cameraAfter195Zoom.k / cameraAfterHighZoomPan.k).toBeCloseTo(1.25, 6);
      expect(cameraAfter195Zoom.x).toBeCloseTo(
        rasterContext.cssWidth / 2 + highZoomPanOffset.x * 1.25, 6,
      );
      expect(cameraAfter195Zoom.y).toBeCloseTo(
        rasterContext.cssHeight / 2 + highZoomPanOffset.y * 1.25, 6,
      );
      expect(ultraZoomQuiet.refinedReplies).toBe(ultraZoomQuiet.targetErrors.length);
      expect(ultraZoomQuiet.targetErrors.at(-1)).toBe(0.25);
      const ultraZoomScreenshot = await canvas.screenshot({ scale: "device" });
      const ultraZoomRasterError = await splinePage.evaluate(measureF07SplineRasterError, {
        screenshotBase64: ultraZoomScreenshot.toString("base64"),
        controlPoints: scene.controlPoints,
        weights: scene.weights,
        camera: cameraAfter195Zoom,
      });
      expect(ultraZoomRasterError.imageWidth).toBe(rasterContext.drawingBufferWidth);
      expect(ultraZoomRasterError.imageHeight).toBe(rasterContext.drawingBufferHeight);
      expect(ultraZoomRasterError.bluePixelCount).toBeGreaterThan(100);
      expect(ultraZoomRasterError.independentSourceSampleCount).toBe(4097);
      expect(ultraZoomRasterError.sourceBounds.minX).toBeGreaterThanOrEqual(0);
      expect(ultraZoomRasterError.sourceBounds.minY).toBeGreaterThanOrEqual(0);
      expect(ultraZoomRasterError.sourceBounds.maxX).toBeLessThan(rasterContext.cssWidth);
      expect(ultraZoomRasterError.sourceBounds.maxY).toBeLessThan(rasterContext.cssHeight);
      expect(ultraZoomRasterError.maximumRenderedToSourceDistanceCssPixels,
        "195% DPR2 SPLINE pixels exceeded the independent rational Bernstein envelope: " + JSON.stringify(ultraZoomRasterError))
        .toBeLessThanOrEqual(1.25);
      expect(ultraZoomRasterError.maximumSourceToRenderedDistanceCssPixels,
        "195% DPR2 SPLINE source samples had a raster coverage gap: " + JSON.stringify(ultraZoomRasterError))
        .toBeLessThanOrEqual(1.25);
      console.log("F07 195% DPR2 runtime-refined rational SPLINE raster envelope PASS: " + JSON.stringify({
        ultraZoomBaseline, ultraZoomQuiet, cameraAfter195Zoom, ultraZoomRasterError,
      }));

      const final195PanCssPixels = { x: -10, y: -5 };
      const frameBeforeFinal195Pan = await readDeviceFrame();
      await splinePage.mouse.move(panBounds!.x + panBounds!.width / 2, panBounds!.y + panBounds!.height / 2);
      await splinePage.mouse.down();
      await splinePage.mouse.move(
        panBounds!.x + panBounds!.width / 2 + final195PanCssPixels.x,
        panBounds!.y + panBounds!.height / 2 + final195PanCssPixels.y,
        { steps: 4 },
      );
      await splinePage.mouse.up();
      await expect.poll(readDeviceFrame, { timeout: 5_000 }).not.toBe(frameBeforeFinal195Pan);
      const cameraAfterFinal195Pan = await splinePage.evaluate(() => {
        const input = document.querySelector<HTMLElement & { __zoom?: { x: number; y: number; k: number } }>(
          '[aria-label="CAD V2 Çizim Etkileşim Alanı"]',
        );
        if (!input?.__zoom) throw new Error("F07 DPR2 SPLINE camera is missing after its 195% pan");
        return { ...input.__zoom };
      });
      expect(cameraAfterFinal195Pan.x - cameraAfter195Zoom.x).toBeCloseTo(final195PanCssPixels.x, 6);
      expect(cameraAfterFinal195Pan.y - cameraAfter195Zoom.y).toBeCloseTo(final195PanCssPixels.y, 6);
      expect(cameraAfterFinal195Pan.k).toBeCloseTo(cameraAfter195Zoom.k, 12);
      const final195PanOffset = {
        x: cameraAfterFinal195Pan.x - rasterContext.cssWidth / 2,
        y: cameraAfterFinal195Pan.y - rasterContext.cssHeight / 2,
      };
      expect(final195PanOffset.x).toBeCloseTo(highZoomPanOffset.x * 1.25 + final195PanCssPixels.x, 6);
      expect(final195PanOffset.y).toBeCloseTo(highZoomPanOffset.y * 1.25 + final195PanCssPixels.y, 6);

      let final195PanQuiet = false;
      let final195PanQuietSnapshot = await readState();
      for (let attempt = 0; attempt < 5 && !final195PanQuiet; attempt++) {
        await splinePage.waitForTimeout(350);
        const next = await readState();
        if (JSON.stringify(next) === JSON.stringify(final195PanQuietSnapshot)) final195PanQuiet = true;
        final195PanQuietSnapshot = next;
      }
      expect(final195PanQuiet, "panned 195% DPR2 SPLINE should not schedule another refinement reply").toBe(true);
      expect(final195PanQuietSnapshot.targetErrors).toEqual(ultraZoomQuiet.targetErrors);
      expect(final195PanQuietSnapshot.refinedReplies).toBe(ultraZoomQuiet.refinedReplies);
      expect(final195PanQuietSnapshot.refinedReplies).toBe(final195PanQuietSnapshot.targetErrors.length);
      expect(final195PanQuietSnapshot.targetErrors.at(-1)).toBe(0.25);
      expect(final195PanQuietSnapshot.maxLineVertexCount).toBe(ultraZoomQuiet.maxLineVertexCount);

      const final195PanScreenshot = await canvas.screenshot({ scale: "device" });
      const final195PanRasterError = await splinePage.evaluate(measureF07SplineRasterError, {
        screenshotBase64: final195PanScreenshot.toString("base64"),
        controlPoints: scene.controlPoints,
        weights: scene.weights,
        camera: cameraAfterFinal195Pan,
      });
      expect(final195PanRasterError.imageWidth).toBe(rasterContext.drawingBufferWidth);
      expect(final195PanRasterError.imageHeight).toBe(rasterContext.drawingBufferHeight);
      expect(final195PanRasterError.bluePixelCount).toBeGreaterThan(100);
      expect(final195PanRasterError.independentSourceSampleCount).toBe(4097);
      expect(final195PanRasterError.sourceBounds.minX).toBeGreaterThanOrEqual(0);
      expect(final195PanRasterError.sourceBounds.minY).toBeGreaterThanOrEqual(0);
      expect(final195PanRasterError.sourceBounds.maxX).toBeLessThan(rasterContext.cssWidth);
      expect(final195PanRasterError.sourceBounds.maxY).toBeLessThan(rasterContext.cssHeight);
      expect(final195PanRasterError.maximumRenderedToSourceDistanceCssPixels,
        "195% panned DPR2 SPLINE pixels exceeded the independent rational Bernstein envelope: " + JSON.stringify(final195PanRasterError))
        .toBeLessThanOrEqual(1.25);
      expect(final195PanRasterError.maximumSourceToRenderedDistanceCssPixels,
        "195% panned DPR2 SPLINE source samples had a raster coverage gap: " + JSON.stringify(final195PanRasterError))
        .toBeLessThanOrEqual(1.25);
      console.log("F07 195% panned DPR2 runtime-refined rational SPLINE raster envelope PASS: " + JSON.stringify({
        final195PanCssPixels, cameraAfter195Zoom, cameraAfterFinal195Pan, final195PanQuietSnapshot, final195PanRasterError,
      }));

      const zoomOutBaseline = await readState();
      const zoomOutButton = splinePage.getByRole("button", { name: "Uzaklaştır (-)" });
      const frameBeforeSplineZoomOut = await readDeviceFrame();
      for (const expectedZoom of ["156%", "125%", "100%", "80%"] as const) {
        await zoomOutButton.click();
        await expect(splinePage.getByText(expectedZoom)).toBeVisible();
      }
      await expect.poll(readDeviceFrame, { timeout: 5_000 }).not.toBe(frameBeforeSplineZoomOut);
      const cameraAfter80Zoom = await splinePage.evaluate(() => {
        const input = document.querySelector<HTMLElement & { __zoom?: { x: number; y: number; k: number } }>(
          '[aria-label="CAD V2 Çizim Etkileşim Alanı"]',
        );
        if (!input?.__zoom) throw new Error("F07 DPR2 SPLINE D3 camera is missing at 80%");
        return { ...input.__zoom };
      });
      expect(cameraAfter80Zoom.k / rasterContext.camera.k).toBeCloseTo(0.8, 6);
      const zoomedOutPanOffset = {
        x: cameraAfter80Zoom.x - rasterContext.cssWidth / 2,
        y: cameraAfter80Zoom.y - rasterContext.cssHeight / 2,
      };
      expect(zoomedOutPanOffset.x).toBeCloseTo(final195PanOffset.x * 0.8 ** 4, 6);
      expect(zoomedOutPanOffset.y).toBeCloseTo(final195PanOffset.y * 0.8 ** 4, 6);
      const zoomOutQuiet = await waitForQuiet("80% DPR2 SPLINE zoom-out refinement", zoomOutBaseline.targetErrors.length);

      const final80PanCssPixels = { x: -10, y: -5 };
      const frameBeforeFinal80Pan = await readDeviceFrame();
      await splinePage.mouse.move(panBounds!.x + panBounds!.width / 2, panBounds!.y + panBounds!.height / 2);
      await splinePage.mouse.down();
      await splinePage.mouse.move(
        panBounds!.x + panBounds!.width / 2 + final80PanCssPixels.x,
        panBounds!.y + panBounds!.height / 2 + final80PanCssPixels.y,
        { steps: 4 },
      );
      await splinePage.mouse.up();
      await expect.poll(readDeviceFrame, { timeout: 5_000 }).not.toBe(frameBeforeFinal80Pan);
      const cameraAfter80Pan = await splinePage.evaluate(() => {
        const input = document.querySelector<HTMLElement & { __zoom?: { x: number; y: number; k: number } }>(
          '[aria-label="CAD V2 Çizim Etkileşim Alanı"]',
        );
        if (!input?.__zoom) throw new Error("F07 DPR2 SPLINE D3 camera is missing after its 80% pan");
        return { ...input.__zoom };
      });
      expect(cameraAfter80Pan.x - cameraAfter80Zoom.x).toBeCloseTo(final80PanCssPixels.x, 6);
      expect(cameraAfter80Pan.y - cameraAfter80Zoom.y).toBeCloseTo(final80PanCssPixels.y, 6);
      expect(cameraAfter80Pan.k).toBeCloseTo(cameraAfter80Zoom.k, 12);
      const final80PanOffset = {
        x: cameraAfter80Pan.x - rasterContext.cssWidth / 2,
        y: cameraAfter80Pan.y - rasterContext.cssHeight / 2,
      };
      expect(final80PanOffset.x).toBeCloseTo(zoomedOutPanOffset.x + final80PanCssPixels.x, 6);
      expect(final80PanOffset.y).toBeCloseTo(zoomedOutPanOffset.y + final80PanCssPixels.y, 6);

      const final80PanSnapshot = await readState();
      await splinePage.waitForTimeout(350);
      const final80PanQuietSnapshot = await readState();
      expect(final80PanQuietSnapshot, "80% same-bucket pan must not schedule another SPLINE refinement").toEqual(final80PanSnapshot);
      expect(final80PanQuietSnapshot.targetErrors).toEqual(zoomOutQuiet.targetErrors);
      expect(final80PanQuietSnapshot.refinedReplies).toBe(final80PanQuietSnapshot.targetErrors.length);
      expect(final80PanQuietSnapshot.targetErrors.at(-1)).toBe(0.25);

      const final80PanScreenshot = await canvas.screenshot({ scale: "device" });
      const final80PanRasterError = await splinePage.evaluate(measureF07SplineRasterError, {
        screenshotBase64: final80PanScreenshot.toString("base64"),
        controlPoints: scene.controlPoints,
        weights: scene.weights,
        camera: cameraAfter80Pan,
      });
      expect(final80PanRasterError.imageWidth).toBe(rasterContext.drawingBufferWidth);
      expect(final80PanRasterError.imageHeight).toBe(rasterContext.drawingBufferHeight);
      expect(final80PanRasterError.bluePixelCount).toBeGreaterThan(100);
      expect(final80PanRasterError.independentSourceSampleCount).toBe(4097);
      expect(final80PanRasterError.sourceBounds.minX).toBeGreaterThanOrEqual(0);
      expect(final80PanRasterError.sourceBounds.minY).toBeGreaterThanOrEqual(0);
      expect(final80PanRasterError.sourceBounds.maxX).toBeLessThan(rasterContext.cssWidth);
      expect(final80PanRasterError.sourceBounds.maxY).toBeLessThan(rasterContext.cssHeight);
      expect(final80PanRasterError.maximumRenderedToSourceDistanceCssPixels,
        "80% panned DPR2 SPLINE pixels exceeded the independent rational Bernstein envelope: " + JSON.stringify(final80PanRasterError))
        .toBeLessThanOrEqual(1.25);
      expect(final80PanRasterError.maximumSourceToRenderedDistanceCssPixels,
        "80% panned DPR2 SPLINE source samples had a raster coverage gap: " + JSON.stringify(final80PanRasterError))
        .toBeLessThanOrEqual(1.25);
      console.log("F07 80% panned DPR2 runtime-refined rational SPLINE raster envelope PASS: " + JSON.stringify({
        final80PanCssPixels, cameraAfter80Zoom, cameraAfter80Pan, zoomOutQuiet, final80PanQuietSnapshot, final80PanRasterError,
      }));
    } finally {
      await context.close();
    }
  });

  test("runtime-refined ELLIPSE raster error is bounded after a DPR2 pan", async ({ browser, page }) => {
    await signInAdmin(page);
    const { fileId } = await uploadCadPreviewV2Fixture(page, "known-geometry-measurements");
    const scene = makeBrowserEllipseRefinementScene();
    const context = await browser.newContext({
      baseURL: new URL(page.url()).origin,
      deviceScaleFactor: 2,
      viewport: { width: 1280, height: 720 },
      storageState: await page.context().storageState(),
    });

    try {
      const ellipsePage = await context.newPage();
      await configureF07EllipseRefinementPage(ellipsePage, scene, "vs_f07_runtime_ellipse_dpr2_pan");
      await ellipsePage.goto(`/dokumantasyon/dosya/${fileId}?cadEngine=v2`);
      const canvas = ellipsePage.locator("canvas").first();
      await expect(canvas).toBeVisible({ timeout: 60_000 });
      await expect(ellipsePage.getByText("Varlık:")).toBeVisible({ timeout: 60_000 });
      await expect.poll(() => ellipsePage.evaluate(() => {
        const state = (window as Window & { __cadV2F07Ellipse?: { targetErrors: number[]; refinedReplies: number; maxLineVertexCount: number } }).__cadV2F07Ellipse;
        return Boolean(state && state.targetErrors.includes(0.25) &&
          state.refinedReplies >= state.targetErrors.length && state.maxLineVertexCount > 2);
      }), { timeout: 30_000, intervals: [100, 250, 500, 1000] }).toBe(true);

      await ellipsePage.waitForTimeout(350);
      const quietBefore = await ellipsePage.evaluate(() => {
        const state = (window as Window & { __cadV2F07Ellipse?: { targetErrors: number[]; refinedReplies: number; maxLineVertexCount: number } }).__cadV2F07Ellipse!;
        return { targetErrors: [...state.targetErrors], refinedReplies: state.refinedReplies, maxLineVertexCount: state.maxLineVertexCount };
      });
      await ellipsePage.waitForTimeout(350);
      const quietAfter = await ellipsePage.evaluate(() => {
        const state = (window as Window & { __cadV2F07Ellipse?: { targetErrors: number[]; refinedReplies: number; maxLineVertexCount: number } }).__cadV2F07Ellipse!;
        return { targetErrors: [...state.targetErrors], refinedReplies: state.refinedReplies, maxLineVertexCount: state.maxLineVertexCount };
      });
      expect(quietAfter).toEqual(quietBefore);
      expect(quietAfter.targetErrors.at(-1)).toBe(0.25);
      expect(quietAfter.refinedReplies).toBe(quietAfter.targetErrors.length);

      const rasterContext = await ellipsePage.evaluate(() => {
        const canvasElement = document.querySelector("canvas");
        if (!canvasElement) throw new Error("F07 DPR2 ELLIPSE canvas is missing");
        return {
          devicePixelRatio: window.devicePixelRatio,
          cssWidth: canvasElement.clientWidth,
          cssHeight: canvasElement.clientHeight,
          drawingBufferWidth: canvasElement.width,
          drawingBufferHeight: canvasElement.height,
        };
      });
      expect(rasterContext.devicePixelRatio).toBe(2);
      expect(rasterContext.drawingBufferWidth).toBe(rasterContext.cssWidth * 2);
      expect(rasterContext.drawingBufferHeight).toBe(rasterContext.cssHeight * 2);

      const panInput = ellipsePage.getByLabel("CAD V2 Çizim Etkileşim Alanı");
      const panBounds = await panInput.boundingBox();
      expect(panBounds).not.toBeNull();
      const cameraBeforePan = await ellipsePage.evaluate(() => {
        const input = document.querySelector<HTMLElement & { __zoom?: { x: number; y: number; k: number } }>(
          '[aria-label="CAD V2 Çizim Etkileşim Alanı"]',
        );
        if (!input?.__zoom) throw new Error("F07 DPR2 ELLIPSE D3 camera transform is missing");
        return { ...input.__zoom };
      });
      const panCssPixels = { x: 48, y: 24 };
      const frameBeforePan = crypto.createHash("sha256").update(await canvas.screenshot({ scale: "device" })).digest("hex");
      await ellipsePage.mouse.move(panBounds!.x + panBounds!.width / 2, panBounds!.y + panBounds!.height / 2);
      await ellipsePage.mouse.down();
      await ellipsePage.mouse.move(
        panBounds!.x + panBounds!.width / 2 + panCssPixels.x,
        panBounds!.y + panBounds!.height / 2 + panCssPixels.y,
        { steps: 4 },
      );
      await ellipsePage.mouse.up();
      const readDeviceFrame = async () => crypto.createHash("sha256")
        .update(await canvas.screenshot({ scale: "device" })).digest("hex");
      await expect.poll(readDeviceFrame, { timeout: 5_000 }).not.toBe(frameBeforePan);

      const cameraAfterPan = await ellipsePage.evaluate(() => {
        const input = document.querySelector<HTMLElement & { __zoom?: { x: number; y: number; k: number } }>(
          '[aria-label="CAD V2 Çizim Etkileşim Alanı"]',
        );
        if (!input?.__zoom) throw new Error("F07 DPR2 ELLIPSE D3 camera transform is missing after pan");
        return { ...input.__zoom };
      });
      expect(cameraAfterPan.x - cameraBeforePan.x).toBeCloseTo(panCssPixels.x, 6);
      expect(cameraAfterPan.y - cameraBeforePan.y).toBeCloseTo(panCssPixels.y, 6);
      expect(cameraAfterPan.k).toBeCloseTo(cameraBeforePan.k, 12);

      let panQuiet = false;
      let panQuietSnapshot = quietAfter;
      for (let attempt = 0; attempt < 5 && !panQuiet; attempt++) {
        await ellipsePage.waitForTimeout(350);
        const snapshot = await ellipsePage.evaluate(() => {
          const state = (window as Window & { __cadV2F07Ellipse?: { targetErrors: number[]; refinedReplies: number; maxLineVertexCount: number } }).__cadV2F07Ellipse!;
          return { targetErrors: [...state.targetErrors], refinedReplies: state.refinedReplies, maxLineVertexCount: state.maxLineVertexCount };
        });
        if (snapshot.refinedReplies >= snapshot.targetErrors.length && snapshot.targetErrors.at(-1) === 0.25) {
          await ellipsePage.waitForTimeout(350);
          const quiet = await ellipsePage.evaluate(() => {
            const state = (window as Window & { __cadV2F07Ellipse?: { targetErrors: number[]; refinedReplies: number; maxLineVertexCount: number } }).__cadV2F07Ellipse!;
            return { targetErrors: [...state.targetErrors], refinedReplies: state.refinedReplies, maxLineVertexCount: state.maxLineVertexCount };
          });
          if (JSON.stringify(quiet) === JSON.stringify(snapshot)) {
            panQuiet = true;
            panQuietSnapshot = quiet;
          }
        }
      }
      expect(panQuiet, "panned DPR2 ELLIPSE should retain idle refinement with no pending replies").toBe(true);
      expect(panQuietSnapshot.maxLineVertexCount).toBeGreaterThan(2);

      const screenshot = await canvas.screenshot({ scale: "device" });
      const rasterError = await ellipsePage.evaluate(measureF07EllipseRasterError, {
        screenshotBase64: screenshot.toString("base64"),
        semimajor: scene.semimajor,
        semiminor: scene.semiminor,
        panCssPixels,
      });
      expect(rasterError.imageWidth).toBe(rasterContext.cssWidth * 2);
      expect(rasterError.imageHeight).toBe(rasterContext.cssHeight * 2);
      expect(rasterError.bluePixelCount).toBeGreaterThan(100);
      expect(rasterError.maximumRenderedToSourceDistanceCssPixels,
        `DPR2 panned ELLIPSE pixels exceeded the independent parametric source envelope: ${JSON.stringify(rasterError)}`)
        .toBeLessThanOrEqual(1.25);
      expect(rasterError.maximumSourceToRenderedDistanceCssPixels,
        `DPR2 panned ELLIPSE source samples had a raster coverage gap: ${JSON.stringify(rasterError)}`)
        .toBeLessThanOrEqual(1.25);
      console.log(`F07 panned DPR2 runtime-refined ELLIPSE pixel envelope PASS: ${JSON.stringify({ panCssPixels, cameraBeforePan, cameraAfterPan, rasterContext, panQuietSnapshot, rasterError })}`);

      const zoomBaseline = await ellipsePage.evaluate(() => {
        const state = (window as Window & { __cadV2F07Ellipse?: { targetErrors: number[]; refinedReplies: number } }).__cadV2F07Ellipse!;
        return { targetCount: state.targetErrors.length, refinedReplies: state.refinedReplies };
      });
      await ellipsePage.getByRole("button", { name: "Yakınlaştır (+)" }).click();
      await expect(ellipsePage.getByText("125%")).toBeVisible();
      await expect.poll(() => ellipsePage.evaluate((baseline) => {
        const state = (window as Window & { __cadV2F07Ellipse?: { targetErrors: number[]; refinedReplies: number } }).__cadV2F07Ellipse!;
        return state.targetErrors.length > baseline.targetCount && state.targetErrors.at(-1) === 0.25 &&
          state.refinedReplies >= state.targetErrors.length;
      }, zoomBaseline), { timeout: 20_000 }).toBe(true);

      let zoomQuiet = false;
      let zoomQuietSnapshot = panQuietSnapshot;
      for (let attempt = 0; attempt < 5 && !zoomQuiet; attempt++) {
        await ellipsePage.waitForTimeout(350);
        const snapshot = await ellipsePage.evaluate(() => {
          const state = (window as Window & { __cadV2F07Ellipse?: { targetErrors: number[]; refinedReplies: number; maxLineVertexCount: number } }).__cadV2F07Ellipse!;
          return { targetErrors: [...state.targetErrors], refinedReplies: state.refinedReplies, maxLineVertexCount: state.maxLineVertexCount };
        });
        if (snapshot.refinedReplies >= snapshot.targetErrors.length && snapshot.targetErrors.at(-1) === 0.25) {
          await ellipsePage.waitForTimeout(350);
          const quiet = await ellipsePage.evaluate(() => {
            const state = (window as Window & { __cadV2F07Ellipse?: { targetErrors: number[]; refinedReplies: number; maxLineVertexCount: number } }).__cadV2F07Ellipse!;
            return { targetErrors: [...state.targetErrors], refinedReplies: state.refinedReplies, maxLineVertexCount: state.maxLineVertexCount };
          });
          if (JSON.stringify(quiet) === JSON.stringify(snapshot)) {
            zoomQuiet = true;
            zoomQuietSnapshot = quiet;
          }
        }
      }
      expect(zoomQuiet, "125% DPR2 ELLIPSE refinement should settle after its idle response").toBe(true);
      expect(zoomQuietSnapshot.maxLineVertexCount).toBeGreaterThan(2);
      const cameraAfterZoom = await ellipsePage.evaluate(() => {
        const input = document.querySelector<HTMLElement & { __zoom?: { x: number; y: number; k: number } }>(
          '[aria-label="CAD V2 Çizim Etkileşim Alanı"]',
        );
        if (!input?.__zoom) throw new Error("F07 DPR2 ELLIPSE D3 camera transform is missing at 125%");
        return { ...input.__zoom };
      });
      expect(cameraAfterZoom.k / cameraAfterPan.k).toBeCloseTo(1.25, 6);
      expect(cameraAfterZoom.x).toBeCloseTo(rasterContext.cssWidth / 2 + panCssPixels.x * 1.25, 6);
      expect(cameraAfterZoom.y).toBeCloseTo(rasterContext.cssHeight / 2 + panCssPixels.y * 1.25, 6);

      const zoomPanCssPixels = { x: 48, y: 24 };
      const frameBeforeZoomPan = await readDeviceFrame();
      await ellipsePage.mouse.move(panBounds!.x + panBounds!.width / 2, panBounds!.y + panBounds!.height / 2);
      await ellipsePage.mouse.down();
      await ellipsePage.mouse.move(
        panBounds!.x + panBounds!.width / 2 + zoomPanCssPixels.x,
        panBounds!.y + panBounds!.height / 2 + zoomPanCssPixels.y,
        { steps: 4 },
      );
      await ellipsePage.mouse.up();
      await expect.poll(readDeviceFrame, { timeout: 5_000 }).not.toBe(frameBeforeZoomPan);
      const cameraAfterZoomPan = await ellipsePage.evaluate(() => {
        const input = document.querySelector<HTMLElement & { __zoom?: { x: number; y: number; k: number } }>(
          '[aria-label="CAD V2 Çizim Etkileşim Alanı"]',
        );
        if (!input?.__zoom) throw new Error("F07 DPR2 ELLIPSE D3 camera transform is missing after 125% pan");
        return { ...input.__zoom };
      });
      expect(cameraAfterZoomPan.x - cameraAfterZoom.x).toBeCloseTo(zoomPanCssPixels.x, 6);
      expect(cameraAfterZoomPan.y - cameraAfterZoom.y).toBeCloseTo(zoomPanCssPixels.y, 6);
      expect(cameraAfterZoomPan.k).toBeCloseTo(cameraAfterZoom.k, 12);
      const zoomedPanOffset = {
        x: cameraAfterZoomPan.x - rasterContext.cssWidth / 2,
        y: cameraAfterZoomPan.y - rasterContext.cssHeight / 2,
      };
      expect(zoomedPanOffset.x).toBeCloseTo(panCssPixels.x * 1.25 + zoomPanCssPixels.x, 6);
      expect(zoomedPanOffset.y).toBeCloseTo(panCssPixels.y * 1.25 + zoomPanCssPixels.y, 6);

      let zoomPanQuiet = false;
      let zoomPanQuietSnapshot = zoomQuietSnapshot;
      for (let attempt = 0; attempt < 5 && !zoomPanQuiet; attempt++) {
        await ellipsePage.waitForTimeout(350);
        const snapshot = await ellipsePage.evaluate(() => {
          const state = (window as Window & { __cadV2F07Ellipse?: { targetErrors: number[]; refinedReplies: number; maxLineVertexCount: number } }).__cadV2F07Ellipse!;
          return { targetErrors: [...state.targetErrors], refinedReplies: state.refinedReplies, maxLineVertexCount: state.maxLineVertexCount };
        });
        if (snapshot.refinedReplies >= snapshot.targetErrors.length && snapshot.targetErrors.at(-1) === 0.25) {
          await ellipsePage.waitForTimeout(350);
          const quiet = await ellipsePage.evaluate(() => {
            const state = (window as Window & { __cadV2F07Ellipse?: { targetErrors: number[]; refinedReplies: number; maxLineVertexCount: number } }).__cadV2F07Ellipse!;
            return { targetErrors: [...state.targetErrors], refinedReplies: state.refinedReplies, maxLineVertexCount: state.maxLineVertexCount };
          });
          if (JSON.stringify(quiet) === JSON.stringify(snapshot)) {
            zoomPanQuiet = true;
            zoomPanQuietSnapshot = quiet;
          }
        }
      }
      expect(zoomPanQuiet, "panned 125% DPR2 ELLIPSE should retain idle refinement with no pending replies").toBe(true);
      const zoomedScreenshot = await canvas.screenshot({ scale: "device" });
      const zoomedRasterError = await ellipsePage.evaluate(measureF07EllipseRasterError, {
        screenshotBase64: zoomedScreenshot.toString("base64"),
        semimajor: scene.semimajor,
        semiminor: scene.semiminor,
        zoomFactor: 1.25,
        panCssPixels: zoomedPanOffset,
      });
      expect(zoomedRasterError.imageWidth).toBe(rasterContext.cssWidth * 2);
      expect(zoomedRasterError.imageHeight).toBe(rasterContext.cssHeight * 2);
      expect(zoomedRasterError.bluePixelCount).toBeGreaterThan(100);
      expect(zoomedRasterError.maximumRenderedToSourceDistanceCssPixels,
        `125% panned DPR2 ELLIPSE pixels exceeded the independent source envelope: ${JSON.stringify(zoomedRasterError)}`)
        .toBeLessThanOrEqual(1.25);
      expect(zoomedRasterError.maximumSourceToRenderedDistanceCssPixels,
        `125% panned DPR2 ELLIPSE source samples had a raster gap: ${JSON.stringify(zoomedRasterError)}`)
        .toBeLessThanOrEqual(1.25);
      console.log(`F07 125% panned DPR2 runtime-refined ELLIPSE pixel envelope PASS: ${JSON.stringify({ zoomedPanOffset, cameraAfterZoom, cameraAfterZoomPan, zoomPanQuietSnapshot, zoomedRasterError })}`);

      const zoomOutBaseline = await ellipsePage.evaluate(() => {
        const state = (window as Window & { __cadV2F07Ellipse?: { targetErrors: number[]; refinedReplies: number } }).__cadV2F07Ellipse!;
        return { targetCount: state.targetErrors.length, refinedReplies: state.refinedReplies };
      });
      const zoomOutButton = ellipsePage.getByRole("button", { name: "Uzaklaştır (-)" });
      const frameBeforeZoomOut = await readDeviceFrame();
      await zoomOutButton.click();
      await expect(ellipsePage.getByText("100%")).toBeVisible();
      await zoomOutButton.click();
      await expect(ellipsePage.getByText("80%")).toBeVisible();
      await expect.poll(() => ellipsePage.evaluate((baseline) => {
        const state = (window as Window & { __cadV2F07Ellipse?: { targetErrors: number[]; refinedReplies: number } }).__cadV2F07Ellipse!;
        return state.targetErrors.length > baseline.targetCount && state.targetErrors.at(-1) === 0.25 &&
          state.refinedReplies >= state.targetErrors.length;
      }, zoomOutBaseline), { timeout: 20_000, intervals: [100, 250, 500, 1000] }).toBe(true);
      await expect.poll(readDeviceFrame, { timeout: 5_000 }).not.toBe(frameBeforeZoomOut);

      let zoomOutQuiet = false;
      let zoomOutQuietSnapshot = zoomPanQuietSnapshot;
      for (let attempt = 0; attempt < 5 && !zoomOutQuiet; attempt++) {
        await ellipsePage.waitForTimeout(350);
        const snapshot = await ellipsePage.evaluate(() => {
          const state = (window as Window & { __cadV2F07Ellipse?: { targetErrors: number[]; refinedReplies: number; maxLineVertexCount: number } }).__cadV2F07Ellipse!;
          return { targetErrors: [...state.targetErrors], refinedReplies: state.refinedReplies, maxLineVertexCount: state.maxLineVertexCount };
        });
        if (snapshot.refinedReplies >= snapshot.targetErrors.length && snapshot.targetErrors.at(-1) === 0.25) {
          await ellipsePage.waitForTimeout(350);
          const quiet = await ellipsePage.evaluate(() => {
            const state = (window as Window & { __cadV2F07Ellipse?: { targetErrors: number[]; refinedReplies: number; maxLineVertexCount: number } }).__cadV2F07Ellipse!;
            return { targetErrors: [...state.targetErrors], refinedReplies: state.refinedReplies, maxLineVertexCount: state.maxLineVertexCount };
          });
          if (JSON.stringify(quiet) === JSON.stringify(snapshot)) {
            zoomOutQuiet = true;
            zoomOutQuietSnapshot = quiet;
          }
        }
      }
      expect(zoomOutQuiet, "80% DPR2 ELLIPSE refinement should settle with no pending replies").toBe(true);
      expect(zoomOutQuietSnapshot.maxLineVertexCount).toBeGreaterThan(2);

      const cameraAfterZoomOut = await ellipsePage.evaluate(() => {
        const input = document.querySelector<HTMLElement & { __zoom?: { x: number; y: number; k: number } }>(
          '[aria-label="CAD V2 Çizim Etkileşim Alanı"]',
        );
        if (!input?.__zoom) throw new Error("F07 DPR2 ELLIPSE D3 camera transform is missing at 80%");
        return { ...input.__zoom };
      });
      expect(cameraAfterZoomOut.k / cameraBeforePan.k).toBeCloseTo(0.8, 6);
      const zoomedOutPanOffset = {
        x: cameraAfterZoomOut.x - rasterContext.cssWidth / 2,
        y: cameraAfterZoomOut.y - rasterContext.cssHeight / 2,
      };
      expect(zoomedOutPanOffset.x).toBeCloseTo(zoomedPanOffset.x * (0.8 / 1.25), 6);
      expect(zoomedOutPanOffset.y).toBeCloseTo(zoomedPanOffset.y * (0.8 / 1.25), 6);

      const zoomedOutScreenshot = await canvas.screenshot({ scale: "device" });
      const zoomedOutRasterError = await ellipsePage.evaluate(measureF07EllipseRasterError, {
        screenshotBase64: zoomedOutScreenshot.toString("base64"),
        semimajor: scene.semimajor,
        semiminor: scene.semiminor,
        zoomFactor: 0.8,
        panCssPixels: zoomedOutPanOffset,
      });
      expect(zoomedOutRasterError.imageWidth).toBe(rasterContext.cssWidth * 2);
      expect(zoomedOutRasterError.imageHeight).toBe(rasterContext.cssHeight * 2);
      expect(zoomedOutRasterError.bluePixelCount).toBeGreaterThan(100);
      expect(zoomedOutRasterError.maximumRenderedToSourceDistanceCssPixels,
        "80% panned DPR2 ELLIPSE pixels exceeded the independent parametric source envelope: " + JSON.stringify(zoomedOutRasterError))
        .toBeLessThanOrEqual(1.25);
      expect(zoomedOutRasterError.maximumSourceToRenderedDistanceCssPixels,
        "80% panned DPR2 ELLIPSE source samples had a raster coverage gap: " + JSON.stringify(zoomedOutRasterError))
        .toBeLessThanOrEqual(1.25);
      console.log("F07 80% panned DPR2 runtime-refined ELLIPSE pixel envelope PASS: " + JSON.stringify({
        zoomedOutPanOffset, cameraAfterZoomOut, zoomOutQuietSnapshot, zoomedOutRasterError,
      }));

      const zoomInBaseline = await ellipsePage.evaluate(() => {
        const state = (window as Window & { __cadV2F07Ellipse?: { targetErrors: number[]; refinedReplies: number } }).__cadV2F07Ellipse!;
        return { targetCount: state.targetErrors.length, refinedReplies: state.refinedReplies };
      });
      const zoomInButton = ellipsePage.getByRole("button", { name: "Yakınlaştır (+)" });
      const frameBeforeZoomIn = await readDeviceFrame();
      for (const expectedZoom of ["100%", "125%", "156%"] as const) {
        const zoomStepBaseline = await ellipsePage.evaluate(() => {
          const state = (window as Window & { __cadV2F07Ellipse?: { targetErrors: number[] } }).__cadV2F07Ellipse!;
          return { targetCount: state.targetErrors.length };
        });
        await zoomInButton.click();
        await expect(ellipsePage.getByText(expectedZoom)).toBeVisible();
        const expectedZoomScale = expectedZoom === "156%" ? 1.5625 : Number.parseFloat(expectedZoom) / 100;
        try {
          await expect.poll(() => ellipsePage.evaluate(({ baselineTargetCount, expectedScale, fitScale }) => {
            const input = document.querySelector<HTMLElement & { __zoom?: { x: number; y: number; k: number } }>(
              '[aria-label="CAD V2 Çizim Etkileşim Alanı"]',
            );
            const state = (window as Window & {
              __cadV2F07Ellipse?: { targetErrors: number[]; refinedReplies: number };
            }).__cadV2F07Ellipse;
            return Boolean(input?.__zoom && state &&
              Math.abs(input.__zoom.k / fitScale - expectedScale) < 1e-6 &&
              state.targetErrors.length > baselineTargetCount &&
              state.targetErrors.at(-1) === 0.25 &&
              state.refinedReplies >= state.targetErrors.length);
          }, {
            baselineTargetCount: zoomStepBaseline.targetCount,
            expectedScale: expectedZoomScale,
            fitScale: cameraBeforePan.k,
          }), { timeout: 20_000, intervals: [100, 250, 500, 1000] }).toBe(true);
        } catch (error) {
          const diagnostic = await ellipsePage.evaluate(() => {
            const input = document.querySelector<HTMLElement & { __zoom?: { x: number; y: number; k: number } }>(
              '[aria-label="CAD V2 Çizim Etkileşim Alanı"]',
            );
            const state = (window as Window & {
              __cadV2F07Ellipse?: { targetErrors: number[]; refinedReplies: number };
            }).__cadV2F07Ellipse;
            return {
              camera: input?.__zoom,
              targetErrors: state?.targetErrors,
              refinedReplies: state?.refinedReplies,
            };
          });
          throw new Error(`ELLIPSE zoom step ${expectedZoom} did not settle; expected scale=${expectedZoomScale}, fit k=${cameraBeforePan.k}, target baseline=${zoomStepBaseline.targetCount}, observed=${JSON.stringify(diagnostic)}; ${error instanceof Error ? error.message : String(error)}`);
        }
      }
      await expect.poll(() => ellipsePage.evaluate((baseline) => {
        const state = (window as Window & { __cadV2F07Ellipse?: { targetErrors: number[]; refinedReplies: number } }).__cadV2F07Ellipse!;
        return state.targetErrors.length > baseline.targetCount && state.targetErrors.at(-1) === 0.25 &&
          state.refinedReplies >= state.targetErrors.length;
      }, zoomInBaseline), { timeout: 20_000, intervals: [100, 250, 500, 1000] }).toBe(true);
      await expect.poll(readDeviceFrame, { timeout: 5_000 }).not.toBe(frameBeforeZoomIn);

      let zoomInQuiet = false;
      let zoomInQuietSnapshot = zoomOutQuietSnapshot;
      for (let attempt = 0; attempt < 5 && !zoomInQuiet; attempt++) {
        await ellipsePage.waitForTimeout(350);
        const snapshot = await ellipsePage.evaluate(() => {
          const state = (window as Window & { __cadV2F07Ellipse?: { targetErrors: number[]; refinedReplies: number; maxLineVertexCount: number } }).__cadV2F07Ellipse!;
          return { targetErrors: [...state.targetErrors], refinedReplies: state.refinedReplies, maxLineVertexCount: state.maxLineVertexCount };
        });
        if (snapshot.refinedReplies >= snapshot.targetErrors.length && snapshot.targetErrors.at(-1) === 0.25) {
          await ellipsePage.waitForTimeout(350);
          const quiet = await ellipsePage.evaluate(() => {
            const state = (window as Window & { __cadV2F07Ellipse?: { targetErrors: number[]; refinedReplies: number; maxLineVertexCount: number } }).__cadV2F07Ellipse!;
            return { targetErrors: [...state.targetErrors], refinedReplies: state.refinedReplies, maxLineVertexCount: state.maxLineVertexCount };
          });
          if (JSON.stringify(quiet) === JSON.stringify(snapshot)) {
            zoomInQuiet = true;
            zoomInQuietSnapshot = quiet;
          }
        }
      }
      expect(zoomInQuiet, "156% DPR2 ELLIPSE refinement should settle with no pending replies").toBe(true);
      expect(zoomInQuietSnapshot.maxLineVertexCount).toBeGreaterThan(2);

      const cameraAfterZoomIn156 = await ellipsePage.evaluate(() => {
        const input = document.querySelector<HTMLElement & { __zoom?: { x: number; y: number; k: number } }>(
          '[aria-label="CAD V2 Çizim Etkileşim Alanı"]',
        );
        if (!input?.__zoom) throw new Error("F07 DPR2 ELLIPSE D3 camera transform is missing at 156%");
        return { ...input.__zoom };
      });
      expect(cameraAfterZoomIn156.k / cameraBeforePan.k).toBeCloseTo(1.5625, 6);
      const zoomedIn156PanOffset = {
        x: cameraAfterZoomIn156.x - rasterContext.cssWidth / 2,
        y: cameraAfterZoomIn156.y - rasterContext.cssHeight / 2,
      };
      expect(zoomedIn156PanOffset.x).toBeCloseTo(zoomedOutPanOffset.x * (1.5625 / 0.8), 6);
      expect(zoomedIn156PanOffset.y).toBeCloseTo(zoomedOutPanOffset.y * (1.5625 / 0.8), 6);

      const zoomedIn156Screenshot = await canvas.screenshot({ scale: "device" });
      const zoomedIn156RasterError = await ellipsePage.evaluate(measureF07EllipseRasterError, {
        screenshotBase64: zoomedIn156Screenshot.toString("base64"),
        semimajor: scene.semimajor,
        semiminor: scene.semiminor,
        zoomFactor: 1.5625,
        panCssPixels: zoomedIn156PanOffset,
      });
      expect(zoomedIn156RasterError.imageWidth).toBe(rasterContext.cssWidth * 2);
      expect(zoomedIn156RasterError.imageHeight).toBe(rasterContext.cssHeight * 2);
      expect(zoomedIn156RasterError.bluePixelCount).toBeGreaterThan(100);
      expect(zoomedIn156RasterError.maximumRenderedToSourceDistanceCssPixels,
        "156% panned DPR2 ELLIPSE pixels exceeded the independent parametric source envelope: " + JSON.stringify(zoomedIn156RasterError))
        .toBeLessThanOrEqual(1.25);
      expect(zoomedIn156RasterError.maximumSourceToRenderedDistanceCssPixels,
        "156% panned DPR2 ELLIPSE source samples had a raster coverage gap: " + JSON.stringify(zoomedIn156RasterError))
        .toBeLessThanOrEqual(1.25);
      console.log("F07 156% panned DPR2 runtime-refined ELLIPSE pixel envelope PASS: " + JSON.stringify({
        zoomedIn156PanOffset, cameraAfterZoomIn156, zoomInQuietSnapshot, zoomedIn156RasterError,
      }));

      const highZoomPanInput = ellipsePage.getByLabel("CAD V2 Çizim Etkileşim Alanı");
      const highZoomPanBounds = await highZoomPanInput.boundingBox();
      expect(highZoomPanBounds).not.toBeNull();
      const highZoomPanStart = {
        x: highZoomPanBounds!.x + highZoomPanBounds!.width / 2,
        y: highZoomPanBounds!.y + highZoomPanBounds!.height / 2,
      };
      const cameraBeforeHighZoomPan = cameraAfterZoomIn156;
      const frameBeforeHighZoomPan = await readDeviceFrame();
      await ellipsePage.mouse.move(highZoomPanStart.x, highZoomPanStart.y);
      await ellipsePage.mouse.down();
      await ellipsePage.mouse.move(highZoomPanStart.x - 10, highZoomPanStart.y - 5, { steps: 4 });
      await ellipsePage.mouse.up();
      await expect.poll(readDeviceFrame, { timeout: 5_000 }).not.toBe(frameBeforeHighZoomPan);
      const cameraAfterHighZoomPan = await ellipsePage.evaluate(() => {
        const input = document.querySelector<HTMLElement & { __zoom?: { x: number; y: number; k: number } }>(
          '[aria-label="CAD V2 Çizim Etkileşim Alanı"]',
        );
        if (!input?.__zoom) throw new Error("F07 DPR2 ELLIPSE camera is missing after the 195% preparation pan");
        return { ...input.__zoom };
      });
      expect(cameraAfterHighZoomPan.x - cameraBeforeHighZoomPan.x).toBeCloseTo(-10, 6);
      expect(cameraAfterHighZoomPan.y - cameraBeforeHighZoomPan.y).toBeCloseTo(-5, 6);
      expect(cameraAfterHighZoomPan.k).toBeCloseTo(cameraBeforeHighZoomPan.k, 12);

      const ultraZoomBaseline = await ellipsePage.evaluate(() => {
        const state = (window as Window & { __cadV2F07Ellipse?: { targetErrors: number[]; refinedReplies: number } }).__cadV2F07Ellipse!;
        return { targetCount: state.targetErrors.length, refinedReplies: state.refinedReplies };
      });
      const frameBefore195Zoom = await readDeviceFrame();
      await ellipsePage.getByRole("button", { name: "Yakınlaştır (+)" }).click();
      await expect(ellipsePage.getByText("195%")).toBeVisible();
      await expect.poll(() => ellipsePage.evaluate(({ baselineTargetCount, baselineReplies, fitScale }) => {
        const input = document.querySelector<HTMLElement & { __zoom?: { x: number; y: number; k: number } }>(
          '[aria-label="CAD V2 Çizim Etkileşim Alanı"]',
        );
        const state = (window as Window & {
          __cadV2F07Ellipse?: { targetErrors: number[]; refinedReplies: number };
        }).__cadV2F07Ellipse;
        return Boolean(input?.__zoom && state &&
          Math.abs(input.__zoom.k / fitScale - 1.953125) < 1e-6 &&
          state.targetErrors.length > baselineTargetCount &&
          state.refinedReplies > baselineReplies &&
          state.targetErrors.at(-1) === 0.25 &&
          state.refinedReplies >= state.targetErrors.length);
      }, {
        baselineTargetCount: ultraZoomBaseline.targetCount,
        baselineReplies: ultraZoomBaseline.refinedReplies,
        fitScale: cameraBeforePan.k,
      }), { timeout: 20_000, intervals: [100, 250, 500, 1000] }).toBe(true);
      await expect.poll(readDeviceFrame, { timeout: 5_000 }).not.toBe(frameBefore195Zoom);

      let ultraZoomQuiet = false;
      let ultraZoomQuietSnapshot = zoomInQuietSnapshot;
      for (let attempt = 0; attempt < 5 && !ultraZoomQuiet; attempt++) {
        await ellipsePage.waitForTimeout(350);
        const snapshot = await ellipsePage.evaluate(() => {
          const state = (window as Window & { __cadV2F07Ellipse?: { targetErrors: number[]; refinedReplies: number; maxLineVertexCount: number } }).__cadV2F07Ellipse!;
          return { targetErrors: [...state.targetErrors], refinedReplies: state.refinedReplies, maxLineVertexCount: state.maxLineVertexCount };
        });
        if (snapshot.refinedReplies >= snapshot.targetErrors.length && snapshot.targetErrors.at(-1) === 0.25) {
          await ellipsePage.waitForTimeout(350);
          const quiet = await ellipsePage.evaluate(() => {
            const state = (window as Window & { __cadV2F07Ellipse?: { targetErrors: number[]; refinedReplies: number; maxLineVertexCount: number } }).__cadV2F07Ellipse!;
            return { targetErrors: [...state.targetErrors], refinedReplies: state.refinedReplies, maxLineVertexCount: state.maxLineVertexCount };
          });
          if (JSON.stringify(quiet) === JSON.stringify(snapshot)) {
            ultraZoomQuiet = true;
            ultraZoomQuietSnapshot = quiet;
          }
        }
      }
      expect(ultraZoomQuiet, "195% DPR2 ELLIPSE refinement should settle with no pending replies").toBe(true);
      expect(ultraZoomQuietSnapshot.targetErrors.at(-1)).toBe(0.25);
      expect(ultraZoomQuietSnapshot.refinedReplies).toBe(ultraZoomQuietSnapshot.targetErrors.length);
      expect(ultraZoomQuietSnapshot.maxLineVertexCount).toBeGreaterThan(2);

      const cameraAfter195Zoom = await ellipsePage.evaluate(() => {
        const input = document.querySelector<HTMLElement & { __zoom?: { x: number; y: number; k: number } }>(
          '[aria-label="CAD V2 Çizim Etkileşim Alanı"]',
        );
        if (!input?.__zoom) throw new Error("F07 DPR2 ELLIPSE D3 camera transform is missing at 195%");
        return { ...input.__zoom };
      });
      expect(cameraAfter195Zoom.k / cameraBeforePan.k).toBeCloseTo(1.953125, 6);
      const ultraZoomPanOffset = {
        x: cameraAfter195Zoom.x - rasterContext.cssWidth / 2,
        y: cameraAfter195Zoom.y - rasterContext.cssHeight / 2,
      };
      expect(ultraZoomPanOffset.x).toBeCloseTo(
        (cameraAfterHighZoomPan.x - rasterContext.cssWidth / 2) * 1.25, 6,
      );
      expect(ultraZoomPanOffset.y).toBeCloseTo(
        (cameraAfterHighZoomPan.y - rasterContext.cssHeight / 2) * 1.25, 6,
      );
      const highZoomUnitsPerCssPixel = 0.16447368421052633 / 1.953125;
      expect(cameraAfter195Zoom.x + scene.semimajor / highZoomUnitsPerCssPixel)
        .toBeLessThan(rasterContext.cssWidth);
      expect(cameraAfter195Zoom.y - scene.semiminor / highZoomUnitsPerCssPixel).toBeGreaterThan(0);

      const ultraZoomScreenshot = await canvas.screenshot({ scale: "device" });
      const ultraZoomRasterError = await ellipsePage.evaluate(measureF07EllipseRasterError, {
        screenshotBase64: ultraZoomScreenshot.toString("base64"),
        semimajor: scene.semimajor,
        semiminor: scene.semiminor,
        zoomFactor: 1.953125,
        panCssPixels: ultraZoomPanOffset,
      });
      expect(ultraZoomRasterError.imageWidth).toBe(rasterContext.cssWidth * 2);
      expect(ultraZoomRasterError.imageHeight).toBe(rasterContext.cssHeight * 2);
      expect(ultraZoomRasterError.bluePixelCount).toBeGreaterThan(100);
      expect(ultraZoomRasterError.maximumRenderedToSourceDistanceCssPixels,
        "195% DPR2 ELLIPSE pixels exceeded the independent parametric source envelope: " + JSON.stringify(ultraZoomRasterError))
        .toBeLessThanOrEqual(1.25);
      expect(ultraZoomRasterError.maximumSourceToRenderedDistanceCssPixels,
        "195% DPR2 ELLIPSE source samples had a raster coverage gap: " + JSON.stringify(ultraZoomRasterError))
        .toBeLessThanOrEqual(1.25);
      console.log("F07 195% panned DPR2 runtime-refined ELLIPSE pixel envelope PASS: " + JSON.stringify({
        ultraZoomPanOffset, cameraAfterHighZoomPan, cameraAfter195Zoom, ultraZoomQuietSnapshot, ultraZoomRasterError,
      }));

      const final195PanCssPixels = { x: -10, y: -5 };
      const frameBeforeFinal195Pan = await readDeviceFrame();
      await ellipsePage.mouse.move(highZoomPanStart.x, highZoomPanStart.y);
      await ellipsePage.mouse.down();
      await ellipsePage.mouse.move(
        highZoomPanStart.x + final195PanCssPixels.x,
        highZoomPanStart.y + final195PanCssPixels.y,
        { steps: 4 },
      );
      await ellipsePage.mouse.up();
      await expect.poll(readDeviceFrame, { timeout: 5_000 }).not.toBe(frameBeforeFinal195Pan);
      const cameraAfterFinal195Pan = await ellipsePage.evaluate(() => {
        const input = document.querySelector<HTMLElement & { __zoom?: { x: number; y: number; k: number } }>(
          '[aria-label="CAD V2 Çizim Etkileşim Alanı"]',
        );
        if (!input?.__zoom) throw new Error("F07 DPR2 ELLIPSE camera is missing after its 195% pan");
        return { ...input.__zoom };
      });
      expect(cameraAfterFinal195Pan.x - cameraAfter195Zoom.x).toBeCloseTo(final195PanCssPixels.x, 6);
      expect(cameraAfterFinal195Pan.y - cameraAfter195Zoom.y).toBeCloseTo(final195PanCssPixels.y, 6);
      expect(cameraAfterFinal195Pan.k).toBeCloseTo(cameraAfter195Zoom.k, 12);
      const final195PanOffset = {
        x: cameraAfterFinal195Pan.x - rasterContext.cssWidth / 2,
        y: cameraAfterFinal195Pan.y - rasterContext.cssHeight / 2,
      };
      expect(final195PanOffset.x).toBeCloseTo(ultraZoomPanOffset.x + final195PanCssPixels.x, 6);
      expect(final195PanOffset.y).toBeCloseTo(ultraZoomPanOffset.y + final195PanCssPixels.y, 6);
      expect(cameraAfterFinal195Pan.x).toBeGreaterThan(0);
      expect(cameraAfterFinal195Pan.x + scene.semimajor / highZoomUnitsPerCssPixel)
        .toBeLessThan(rasterContext.cssWidth);
      expect(cameraAfterFinal195Pan.y - scene.semiminor / highZoomUnitsPerCssPixel).toBeGreaterThan(0);
      expect(cameraAfterFinal195Pan.y).toBeLessThan(rasterContext.cssHeight);

      const refinementAfterFinal195Pan = await ellipsePage.evaluate(() => {
        const state = (window as Window & {
          __cadV2F07Ellipse?: { targetErrors: number[]; refinedReplies: number; maxLineVertexCount: number };
        }).__cadV2F07Ellipse!;
        return { targetErrors: [...state.targetErrors], refinedReplies: state.refinedReplies, maxLineVertexCount: state.maxLineVertexCount };
      });
      await ellipsePage.waitForTimeout(350);
      const final195PanQuietSnapshot = await ellipsePage.evaluate(() => {
        const state = (window as Window & {
          __cadV2F07Ellipse?: { targetErrors: number[]; refinedReplies: number; maxLineVertexCount: number };
        }).__cadV2F07Ellipse!;
        return { targetErrors: [...state.targetErrors], refinedReplies: state.refinedReplies, maxLineVertexCount: state.maxLineVertexCount };
      });
      await ellipsePage.waitForTimeout(350);
      const final195PanQuietConfirmation = await ellipsePage.evaluate(() => {
        const state = (window as Window & {
          __cadV2F07Ellipse?: { targetErrors: number[]; refinedReplies: number; maxLineVertexCount: number };
        }).__cadV2F07Ellipse!;
        return { targetErrors: [...state.targetErrors], refinedReplies: state.refinedReplies, maxLineVertexCount: state.maxLineVertexCount };
      });
      expect(final195PanQuietSnapshot).toEqual(ultraZoomQuietSnapshot);
      expect(final195PanQuietConfirmation).toEqual(final195PanQuietSnapshot);
      expect(refinementAfterFinal195Pan).toEqual(ultraZoomQuietSnapshot);
      expect(final195PanQuietSnapshot.refinedReplies).toBe(final195PanQuietSnapshot.targetErrors.length);
      expect(final195PanQuietSnapshot.targetErrors.at(-1)).toBe(0.25);

      const final195PanScreenshot = await canvas.screenshot({ scale: "device" });
      const final195PanRasterError = await ellipsePage.evaluate(measureF07EllipseRasterError, {
        screenshotBase64: final195PanScreenshot.toString("base64"),
        semimajor: scene.semimajor,
        semiminor: scene.semiminor,
        zoomFactor: 1.953125,
        panCssPixels: final195PanOffset,
      });
      expect(final195PanRasterError.imageWidth).toBe(rasterContext.drawingBufferWidth);
      expect(final195PanRasterError.imageHeight).toBe(rasterContext.drawingBufferHeight);
      expect(final195PanRasterError.analyticSampleCount).toBe(4097);
      expect(final195PanRasterError.bluePixelCount).toBeGreaterThan(100);
      expect(final195PanRasterError.maximumRenderedToSourceDistanceCssPixels,
        "195% DPR2 ELLIPSE pixels after final real pan exceeded the independent parametric source envelope: " + JSON.stringify(final195PanRasterError))
        .toBeLessThanOrEqual(1.25);
      expect(final195PanRasterError.maximumSourceToRenderedDistanceCssPixels,
        "195% DPR2 ELLIPSE source samples after final real pan had a raster coverage gap: " + JSON.stringify(final195PanRasterError))
        .toBeLessThanOrEqual(1.25);
      console.log("F07 195% DPR2 ELLIPSE raster after an additional real pan PASS: " + JSON.stringify({
        final195PanCssPixels, cameraAfterFinal195Pan, final195PanOffset, final195PanQuietSnapshot,
        final195PanQuietConfirmation, final195PanRasterError,
      }));
    } finally {
      await context.close();
    }
  });

  test("compiler-produced DASHED WebGL output is invariant to chunk partition", async ({ page }) => {
    await signInAdmin(page);
    const { fileId: singleChunkFileId } = await uploadCadPreviewV2Fixture(page, "known-geometry-measurements");
    const { fileId: splitChunkFileId } = await uploadCadPreviewV2Fixture(page, "known-geometry-measurements");
    // The fixture is compiled in a bounded child process to keep compiler ESM loading
    // separate from Playwright's test discovery. PATH_DISTANCE is sent to LineDashedMaterial.
    const scenes = makeBrowserVisibleDashScenes();
    expect(scenes).toHaveLength(2);
    const [singleChunkScene, splitChunkScene] = scenes;
    if (!singleChunkScene || !splitChunkScene) throw new Error("Expected both compiled DASHED scene variants");
    const expectedPathDistance = [0, 31, 31, 62, 62, 93, 93, 124, 124, 155, 155, 184];
    expect(singleChunkScene.manifest.chunks.filter((chunk: { layoutId: string }) => chunk.layoutId === "Model")).toHaveLength(1);
    expect(splitChunkScene.manifest.chunks.filter((chunk: { layoutId: string }) => chunk.layoutId === "Model")).toHaveLength(6);
    expect(singleChunkScene.pathDistanceValues).toEqual(expectedPathDistance);
    expect(splitChunkScene.pathDistanceValues).toEqual(expectedPathDistance);
    expect(singleChunkScene.dashDrawCommands).toHaveLength(1);
    expect(singleChunkScene.dashDrawCommands[0]).toMatchObject({ vertexCount: 12, dashStyle: { dashSize: 24, gapSize: 16 } });
    expect(splitChunkScene.dashDrawCommands).toHaveLength(6);
    expect(splitChunkScene.dashDrawCommands.every((command: { vertexCount: number; dashStyle?: { dashSize: number; gapSize: number } }) =>
      command.vertexCount === 2 && command.dashStyle?.dashSize === 24 && command.dashStyle.gapSize === 16)).toBe(true);
    const scenesById = new Map(scenes.map((scene) => [scene.sceneId, scene]));
    const scenesByFileId = new Map([
      [singleChunkFileId, singleChunkScene],
      [splitChunkFileId, splitChunkScene],
    ]);

    await page.route("**/api/dokumantasyon/cad-v2/prepare", async (route) => {
      const request = route.request().postDataJSON() as { fileId?: string };
      const scene = request.fileId ? scenesByFileId.get(request.fileId) : undefined;
      if (!scene) {
        await route.fulfill({ status: 404, contentType: "application/json", body: JSON.stringify({ error: "F07 dash fixture file not found" }) });
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ status: "ready", sceneId: scene.sceneId, viewSessionId: `vs_${scene.sceneId}`, sourceVersionKey: scene.manifest.sourceVersionKey }),
      });
    });
    await page.route("**/api/dokumantasyon/cad-v2/scenes/*/manifest", async (route) => {
      const sceneId = new URL(route.request().url()).pathname.split("/").at(-2)!;
      const scene = scenesById.get(sceneId);
      if (!scene) {
        await route.fulfill({ status: 404, contentType: "application/json", body: JSON.stringify({ error: "F07 dash fixture scene not found" }) });
        return;
      }
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(scene.manifest) });
    });
    await page.route("**/api/dokumantasyon/cad-v2/scenes/*/chunks/*", async (route) => {
      const pathParts = new URL(route.request().url()).pathname.split("/");
      const scene = scenesById.get(pathParts.at(-3)!);
      const chunkId = pathParts.at(-1)!;
      const chunk = scene?.chunks.get(chunkId);
      if (!chunk) {
        await route.fulfill({ status: 404, contentType: "application/json", body: JSON.stringify({ error: "F07 dash fixture chunk not found" }) });
        return;
      }
      await route.fulfill({ status: 200, contentType: "application/octet-stream", body: Buffer.from(chunk) });
    });

    const readDashPixels = async () => {
      const canvas = page.locator("canvas").first();
      const screenshot = await canvas.screenshot();
      const stats = await page.evaluate(async (pngBase64) => {
        const image = new Image();
        image.src = `data:image/png;base64,${pngBase64}`;
        await image.decode();
        const sampleCanvas = document.createElement("canvas");
        sampleCanvas.width = image.naturalWidth;
        sampleCanvas.height = image.naturalHeight;
        const context = sampleCanvas.getContext("2d");
        if (!context) throw new Error("Could not create a pixel-sampling canvas for the WebGL screenshot");
        context.drawImage(image, 0, 0);
        const { width, height } = sampleCanvas;
        const pixels = context.getImageData(0, 0, width, height).data;
        const redByColumn = new Array<boolean>(width).fill(false);
        const centerY = Math.floor(height / 2);
        for (let x = 0; x < width; x++) {
          for (let y = Math.max(0, centerY - 10); y <= Math.min(height - 1, centerY + 10); y++) {
            const offset = (y * width + x) * 4;
            const red = pixels[offset]!;
            const green = pixels[offset + 1]!;
            const blue = pixels[offset + 2]!;
            if (red > 80 && red > green * 1.6 + 20 && red > blue * 1.6 + 20) {
              redByColumn[x] = true;
              break;
            }
          }
        }
        const runs: Array<[number, number]> = [];
        let runStart = -1;
        for (let x = 0; x < width; x++) {
          if (redByColumn[x] && runStart < 0) runStart = x;
          if (!redByColumn[x] && runStart >= 0) {
            runs.push([runStart, x - 1]);
            runStart = -1;
          }
        }
        if (runStart >= 0) runs.push([runStart, width - 1]);
        const redPixelColumns = redByColumn.reduce((count, red) => count + Number(red), 0);
        const gaps = runs.slice(1).map((run, index) => run[0] - runs[index]![1] - 1);
        return { width, height, redPixelColumns, runs, gaps };
      }, screenshot.toString("base64"));
      return { ...stats, screenshotSha256: crypto.createHash("sha256").update(screenshot).digest("hex") };
    };

    const readScenePixels = async (fileId: string) => {
      await page.goto(`/dokumantasyon/dosya/${fileId}?cadEngine=v2`);
      const canvas = page.locator("canvas").first();
      await expect(canvas).toBeVisible({ timeout: 60_000 });
      await expect(page.getByText("Varlık:")).toBeVisible({ timeout: 60_000 });
      let pixelStats = await readDashPixels();
      await expect.poll(async () => {
        pixelStats = await readDashPixels();
        return pixelStats.runs.length;
      }, { timeout: 15_000 }).toBeGreaterThanOrEqual(4);
      expect(pixelStats.redPixelColumns).toBeGreaterThan(100);
      expect(pixelStats.runs).toHaveLength(5);
      expect(pixelStats.gaps).toHaveLength(4);
      expect(Math.min(...pixelStats.gaps)).toBeGreaterThan(8);
      return pixelStats;
    };

    const singleChunkPixels = await readScenePixels(singleChunkFileId);
    const splitChunkPixels = await readScenePixels(splitChunkFileId);
    expect(splitChunkPixels.screenshotSha256).toBe(singleChunkPixels.screenshotSha256);
    expect(splitChunkPixels.runs).toEqual(singleChunkPixels.runs);
    expect(splitChunkPixels.gaps).toEqual(singleChunkPixels.gaps);
    console.log("F07 PATH_DISTANCE LineDashedMaterial WebGL phase acceptance PASS: " + JSON.stringify({
      pathDistanceValues: singleChunkScene.pathDistanceValues,
      drawCommands: singleChunkScene.dashDrawCommands,
      singleChunk: { chunks: 1, runs: singleChunkPixels.runs, gaps: singleChunkPixels.gaps, screenshotSha256: singleChunkPixels.screenshotSha256 },
      splitChunks: { chunks: 6, runs: splitChunkPixels.runs, gaps: splitChunkPixels.gaps, screenshotSha256: splitChunkPixels.screenshotSha256 },
    }));
  });

  test("runtime-refined ELLIPSE raster stays bounded when DPR3 is capped to a DPR2 drawing buffer", async ({ browser, page }) => {
    await signInAdmin(page);
    const { fileId } = await uploadCadPreviewV2Fixture(page, "known-geometry-measurements");
    const scene = makeBrowserEllipseRefinementScene();
    const context = await browser.newContext({
      baseURL: new URL(page.url()).origin,
      deviceScaleFactor: 3,
      viewport: { width: 1280, height: 720 },
      storageState: await page.context().storageState(),
    });

    try {
      const ellipsePage = await context.newPage();
      await configureF07EllipseRefinementPage(ellipsePage, scene, "vs_f07_ellipse_dpr3_buffer_cap");
      await ellipsePage.goto(`/dokumantasyon/dosya/${fileId}?cadEngine=v2`);

      const canvas = ellipsePage.locator("canvas").first();
      await expect(canvas).toBeVisible({ timeout: 60_000 });
      await expect(ellipsePage.getByText("Varlık:")).toBeVisible({ timeout: 60_000 });
      await expect.poll(() => ellipsePage.evaluate(() => {
        const state = (window as Window & { __cadV2F07Ellipse?: { targetErrors: number[]; refinedReplies: number; maxLineVertexCount: number } }).__cadV2F07Ellipse;
        return Boolean(state && state.targetErrors.at(-1) === 0.25 &&
          state.refinedReplies >= state.targetErrors.length && state.maxLineVertexCount > 2);
      }), { timeout: 30_000, intervals: [100, 250, 500, 1000] }).toBe(true);

      const rasterContext = await ellipsePage.evaluate(() => {
        const canvasElement = document.querySelector("canvas");
        if (!canvasElement) throw new Error("F07 DPR3 ELLIPSE canvas is missing");
        return {
          devicePixelRatio: window.devicePixelRatio,
          cssWidth: canvasElement.clientWidth,
          cssHeight: canvasElement.clientHeight,
          drawingBufferWidth: canvasElement.width,
          drawingBufferHeight: canvasElement.height,
        };
      });
      expect(rasterContext.devicePixelRatio).toBe(3);
      expect(rasterContext.drawingBufferWidth).toBe(rasterContext.cssWidth * 2);
      expect(rasterContext.drawingBufferHeight).toBe(rasterContext.cssHeight * 2);

      const panInput = ellipsePage.getByLabel("CAD V2 Çizim Etkileşim Alanı");
      const panBounds = await panInput.boundingBox();
      expect(panBounds).not.toBeNull();
      const cameraBeforePan = await ellipsePage.evaluate(() => {
        const input = document.querySelector<HTMLElement & { __zoom?: { x: number; y: number; k: number } }>(
          '[aria-label="CAD V2 Çizim Etkileşim Alanı"]',
        );
        if (!input?.__zoom) throw new Error("F07 DPR3 ELLIPSE camera transform is missing");
        return { ...input.__zoom };
      });
      const refinementBeforePan = await ellipsePage.evaluate(() => {
        const state = (window as Window & { __cadV2F07Ellipse?: { targetErrors: number[]; refinedReplies: number; maxLineVertexCount: number } }).__cadV2F07Ellipse!;
        return { targetErrors: [...state.targetErrors], refinedReplies: state.refinedReplies, maxLineVertexCount: state.maxLineVertexCount };
      });
      const frameBeforePan = crypto.createHash("sha256").update(await canvas.screenshot()).digest("hex");
      const panCssPixels = { x: -10, y: -5 };
      await ellipsePage.mouse.move(panBounds!.x + panBounds!.width / 2, panBounds!.y + panBounds!.height / 2);
      await ellipsePage.mouse.down();
      await ellipsePage.mouse.move(
        panBounds!.x + panBounds!.width / 2 + panCssPixels.x,
        panBounds!.y + panBounds!.height / 2 + panCssPixels.y,
        { steps: 4 },
      );
      await ellipsePage.mouse.up();
      await expect.poll(async () => crypto.createHash("sha256").update(await canvas.screenshot()).digest("hex"),
        { timeout: 5_000 }).not.toBe(frameBeforePan);

      const cameraAfterPan = await ellipsePage.evaluate(() => {
        const input = document.querySelector<HTMLElement & { __zoom?: { x: number; y: number; k: number } }>(
          '[aria-label="CAD V2 Çizim Etkileşim Alanı"]',
        );
        if (!input?.__zoom) throw new Error("F07 DPR3 ELLIPSE camera transform is missing after pan");
        return { ...input.__zoom };
      });
      expect(cameraAfterPan.x - cameraBeforePan.x).toBeCloseTo(panCssPixels.x, 6);
      expect(cameraAfterPan.y - cameraBeforePan.y).toBeCloseTo(panCssPixels.y, 6);
      expect(cameraAfterPan.k).toBeCloseTo(cameraBeforePan.k, 12);

      await ellipsePage.waitForTimeout(350);
      const refinementAfterPan = await ellipsePage.evaluate(() => {
        const state = (window as Window & { __cadV2F07Ellipse?: { targetErrors: number[]; refinedReplies: number; maxLineVertexCount: number } }).__cadV2F07Ellipse!;
        return { targetErrors: [...state.targetErrors], refinedReplies: state.refinedReplies, maxLineVertexCount: state.maxLineVertexCount };
      });
      expect(refinementAfterPan).toEqual(refinementBeforePan);

      const screenshot = await canvas.screenshot({ scale: "device" });
      const rasterError = await ellipsePage.evaluate(measureF07EllipseRasterError, {
        screenshotBase64: screenshot.toString("base64"),
        semimajor: scene.semimajor,
        semiminor: scene.semiminor,
        zoomFactor: 1,
        panCssPixels,
      });
      expect(rasterError.imageWidth).toBe(rasterError.cameraWidth * 3);
      expect(rasterError.imageHeight).toBe(rasterError.cameraHeight * 3);
      expect(rasterError.bluePixelCount).toBeGreaterThan(50);
      expect(rasterError.maximumRenderedToSourceDistanceCssPixels,
        "DPR3 rendered ELLIPSE pixels exceeded the projected source envelope: " + JSON.stringify(rasterError))
        .toBeLessThanOrEqual(1.25);
      expect(rasterError.maximumSourceToRenderedDistanceCssPixels,
        "DPR3 projected ELLIPSE source samples had a raster coverage gap: " + JSON.stringify(rasterError))
        .toBeLessThanOrEqual(1.25);
      console.log("F07 DPR3 runtime-refined ELLIPSE with DPR2 drawing-buffer cap PASS: " + JSON.stringify({
        rasterContext, cameraBeforePan, cameraAfterPan, refinementAfterPan, rasterError,
      }));
    } finally {
      await context.close();
    }
  });

  test("runtime-refined rational SPLINE stays bounded at DPR3 buffer cap after 80% zoom and pan", async ({ browser, page }) => {
    await signInAdmin(page);
    const { fileId } = await uploadCadPreviewV2Fixture(page, "known-geometry-measurements");
    const scene = makeBrowserSplineRefinementScene();
    const context = await browser.newContext({
      baseURL: new URL(page.url()).origin,
      deviceScaleFactor: 3,
      viewport: { width: 1280, height: 720 },
      storageState: await page.context().storageState(),
    });

    try {
      const splinePage = await context.newPage();
      await configureF07SplineRefinementPage(splinePage, scene, "vs_f07_spline_dpr3_80_pan");
      await splinePage.goto(`/dokumantasyon/dosya/${fileId}?cadEngine=v2`);

      const canvas = splinePage.locator("canvas").first();
      await expect(canvas).toBeVisible({ timeout: 60_000 });
      await expect(splinePage.getByText("Varlık:")).toBeVisible({ timeout: 60_000 });

      const readSplineState = () => splinePage.evaluate(() => {
        const state = (window as Window & {
          __cadV2F07Spline?: { targetErrors: number[]; refinedReplies: number; maxLineVertexCount: number };
        }).__cadV2F07Spline;
        if (!state) throw new Error("F07 DPR3 SPLINE worker instrumentation is missing");
        return { targetErrors: [...state.targetErrors], refinedReplies: state.refinedReplies, maxLineVertexCount: state.maxLineVertexCount };
      });
      const waitForSplineQuiet = async (minimumTargetCount: number, description: string) => {
        await expect.poll(async () => {
          const state = await readSplineState();
          return state.targetErrors.length >= minimumTargetCount && state.targetErrors.at(-1) === 0.25 &&
            state.refinedReplies === state.targetErrors.length && state.maxLineVertexCount > 2;
        }, { timeout: 30_000, intervals: [100, 250, 500, 1000] }).toBe(true);

        let snapshot = await readSplineState();
        let stableIntervals = 0;
        for (let attempt = 0; attempt < 8 && stableIntervals < 2; attempt++) {
          await splinePage.waitForTimeout(350);
          const next = await readSplineState();
          stableIntervals = JSON.stringify(next) === JSON.stringify(snapshot) ? stableIntervals + 1 : 0;
          snapshot = next;
        }
        expect(stableIntervals, description + " must settle without pending refinement replies").toBeGreaterThanOrEqual(2);
        expect(snapshot.refinedReplies).toBe(snapshot.targetErrors.length);
        expect(snapshot.targetErrors.at(-1)).toBe(0.25);
        return snapshot;
      };

      const initialState = await waitForSplineQuiet(1, "initial DPR3 SPLINE refinement");
      const rasterContext = await splinePage.evaluate(() => {
        const canvasElement = document.querySelector("canvas");
        const input = document.querySelector<HTMLElement & { __zoom?: { x: number; y: number; k: number } }>(
          '[aria-label="CAD V2 Çizim Etkileşim Alanı"]',
        );
        if (!canvasElement || !input?.__zoom) throw new Error("F07 DPR3 SPLINE canvas/camera is missing");
        return {
          devicePixelRatio: window.devicePixelRatio,
          cssWidth: canvasElement.clientWidth,
          cssHeight: canvasElement.clientHeight,
          drawingBufferWidth: canvasElement.width,
          drawingBufferHeight: canvasElement.height,
          camera: { ...input.__zoom },
        };
      });
      expect(rasterContext.devicePixelRatio).toBe(3);
      expect(rasterContext.drawingBufferWidth).toBe(rasterContext.cssWidth * 2);
      expect(rasterContext.drawingBufferHeight).toBe(rasterContext.cssHeight * 2);

      const readDeviceFrame = async () => crypto.createHash("sha256")
        .update(await canvas.screenshot({ scale: "device" })).digest("hex");
      const frameBeforeZoomOut = await readDeviceFrame();
      const zoomBaseline = await readSplineState();
      await splinePage.getByRole("button", { name: "Uzaklaştır (-)" }).click();
      await expect(splinePage.getByText("80%")).toBeVisible();
      await expect.poll(readDeviceFrame, { timeout: 5_000 }).not.toBe(frameBeforeZoomOut);

      const cameraAfterZoomOut = await splinePage.evaluate(() => {
        const input = document.querySelector<HTMLElement & { __zoom?: { x: number; y: number; k: number } }>(
          '[aria-label="CAD V2 Çizim Etkileşim Alanı"]',
        );
        if (!input?.__zoom) throw new Error("F07 DPR3 SPLINE camera is missing after 80% zoom-out");
        return { ...input.__zoom };
      });
      expect(cameraAfterZoomOut.k / rasterContext.camera.k).toBeCloseTo(0.8, 6);
      const zoomOutState = await waitForSplineQuiet(zoomBaseline.targetErrors.length + 1, "80% DPR3 SPLINE zoom-out refinement");

      const panCssPixels = { x: -10, y: -5 };
      const panInput = splinePage.getByLabel("CAD V2 Çizim Etkileşim Alanı");
      const panBounds = await panInput.boundingBox();
      expect(panBounds).not.toBeNull();
      const frameBeforePan = await readDeviceFrame();
      await splinePage.mouse.move(panBounds!.x + panBounds!.width / 2, panBounds!.y + panBounds!.height / 2);
      await splinePage.mouse.down();
      await splinePage.mouse.move(
        panBounds!.x + panBounds!.width / 2 + panCssPixels.x,
        panBounds!.y + panBounds!.height / 2 + panCssPixels.y,
        { steps: 4 },
      );
      await splinePage.mouse.up();
      await expect.poll(readDeviceFrame, { timeout: 5_000 }).not.toBe(frameBeforePan);

      const cameraAfterPan = await splinePage.evaluate(() => {
        const input = document.querySelector<HTMLElement & { __zoom?: { x: number; y: number; k: number } }>(
          '[aria-label="CAD V2 Çizim Etkileşim Alanı"]',
        );
        if (!input?.__zoom) throw new Error("F07 DPR3 SPLINE camera is missing after pan");
        return { ...input.__zoom };
      });
      expect(cameraAfterPan.x - cameraAfterZoomOut.x).toBeCloseTo(panCssPixels.x, 6);
      expect(cameraAfterPan.y - cameraAfterZoomOut.y).toBeCloseTo(panCssPixels.y, 6);
      expect(cameraAfterPan.k).toBeCloseTo(cameraAfterZoomOut.k, 12);
      await splinePage.waitForTimeout(350);
      const stateAfterPan = await readSplineState();
      expect(stateAfterPan).toEqual(zoomOutState);

      const screenshot = await canvas.screenshot({ scale: "device" });
      const rasterError = await splinePage.evaluate(measureF07SplineRasterError, {
        screenshotBase64: screenshot.toString("base64"),
        controlPoints: scene.controlPoints,
        weights: scene.weights,
        camera: cameraAfterPan,
      });
      expect(rasterError.imageWidth).toBe(rasterContext.cssWidth * 3);
      expect(rasterError.imageHeight).toBe(rasterContext.cssHeight * 3);
      expect(rasterError.bluePixelCount).toBeGreaterThan(100);
      expect(rasterError.independentSourceSampleCount).toBe(4097);
      expect(rasterError.sourceBounds.minX).toBeGreaterThanOrEqual(0);
      expect(rasterError.sourceBounds.minY).toBeGreaterThanOrEqual(0);
      expect(rasterError.sourceBounds.maxX).toBeLessThan(rasterContext.cssWidth);
      expect(rasterError.sourceBounds.maxY).toBeLessThan(rasterContext.cssHeight);
      expect(rasterError.maximumRenderedToSourceDistanceCssPixels,
        "80% panned DPR3 SPLINE pixels exceeded the independent rational Bernstein envelope: " + JSON.stringify(rasterError))
        .toBeLessThanOrEqual(1.25);
      expect(rasterError.maximumSourceToRenderedDistanceCssPixels,
        "80% panned DPR3 SPLINE source samples had a raster coverage gap: " + JSON.stringify(rasterError))
        .toBeLessThanOrEqual(1.25);
      console.log("F07 80% panned DPR3 runtime-refined rational SPLINE raster envelope PASS: " + JSON.stringify({
        initialState, rasterContext, cameraAfterZoomOut, cameraAfterPan, zoomOutState, stateAfterPan, rasterError,
      }));
    } finally {
      await context.close();
    }
  });
});
