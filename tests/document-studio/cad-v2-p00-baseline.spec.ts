import { expect, test, type Browser, type CDPSession, type Locator, type Page } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { closeSync, mkdtempSync, openSync, readFileSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { cleanupUploadedCadFixtures, signInAdmin, uploadRealCadBinaryFixture } from "./cad-test-helpers";
import { unpackSceneChunk } from "../../src/workers/cad-v2/cad-v2-scene-worker";
import { prioritizeChunksByViewportCoverage } from "../../src/lib/cad-v2/cache/chunk-spatial-scheduler";
import { projectP00ChunkOccupancy } from "../cad-v2/p00-projected-occupancy";

const p00TempDirectories = new Set<string>();

const p00CompilerScript = `
import fs from "node:fs";
import path from "node:path";
import { performance } from "node:perf_hooks";
import { createHash } from "node:crypto";
import { parseDwgToCanonical } from "./src/lib/cad-v2/decode/dwg-adapter.ts";
import { compileCanonicalToScene } from "./src/lib/cad-v2/compile/scene-compiler.ts";

const [sourcePath, outputDir] = process.argv.slice(1);
const sourceBytes = fs.readFileSync(sourcePath);
const sourceSha256 = createHash("sha256").update(sourceBytes).digest("hex");
const decodeStarted = performance.now();
const canonical = await parseDwgToCanonical(sourceBytes, {
  sourceSha256,
  sourceVersionKey: "p00-r001-" + sourceSha256,
});
const afterDecode = performance.now();
const afterDecodeMemory = process.memoryUsage();
const compileStarted = performance.now();
const compiled = compileCanonicalToScene(canonical);
const afterCompile = performance.now();
const afterCompileMemory = process.memoryUsage();
const chunksDir = path.join(outputDir, "chunks");
fs.mkdirSync(chunksDir, { recursive: true });
const chunkFiles = [];
let index = 0;
for (const [chunkId, bytes] of Array.from(compiled.chunks.entries()).sort(([a], [b]) => a.localeCompare(b))) {
  const fileName = "chunk-" + String(index++).padStart(4, "0") + ".bin";
  fs.writeFileSync(path.join(chunksDir, fileName), Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength));
  chunkFiles.push({ chunkId, fileName, byteLength: bytes.byteLength });
}
const modelSpaceHandles = Array.from(new Set(canonical.modelSpaceEntities
  .map((entity) => typeof entity.handle === "string" ? entity.handle.toUpperCase() : null)
  .filter(Boolean)));
const metadata = {
  sourceSha256,
  sourceSizeBytes: sourceBytes.byteLength,
  canonicalEntityCount: canonical.modelSpaceEntities.length,
  modelSpaceHandles,
  manifest: compiled.manifest,
  chunkFiles,
  phasesMs: { decode: afterDecode - decodeStarted, sceneCompile: afterCompile - compileStarted },
  processMemorySamples: {
    afterDecode: { rssBytes: afterDecodeMemory.rss, heapUsedBytes: afterDecodeMemory.heapUsed },
    afterCompile: { rssBytes: afterCompileMemory.rss, heapUsedBytes: afterCompileMemory.heapUsed },
  },
};
fs.writeFileSync(path.join(outputDir, "metadata.json"), JSON.stringify(metadata), "utf8");
console.log(JSON.stringify({ sourceSha256, chunks: chunkFiles.length, canonicalEntities: metadata.canonicalEntityCount, phasesMs: metadata.phasesMs }));
`;

type P00CompiledManifest = {
  sceneId: string;
  sourceSha256: string;
  sourceVersionKey: string;
  chunks: Array<{
    chunkId: string;
    sha256: string;
    byteLength: number;
    layoutId?: string;
    bbox?: [number, number, number, number];
  }>;
  [key: string]: unknown;
};

type P00CompiledFixture = {
  sourceSha256: string;
  sourceSizeBytes: number;
  canonicalEntityCount: number;
  modelSpaceHandles: string[];
  manifest: P00CompiledManifest;
  chunkFiles: Array<{ chunkId: string; fileName: string; byteLength: number }>;
  phasesMs: Record<string, number>;
  processMemorySamples: Record<string, { rssBytes: number; heapUsedBytes: number }>;
};

function compileP00Fixture(sourcePath: string, outputDir: string): { fixture: P00CompiledFixture; log: string } {
  const logPath = path.join(outputDir, "compile.log");
  const logFd = openSync(logPath, "w");
  try {
    execFileSync("node", ["--import", "tsx", "--input-type=module", "-e", p00CompilerScript, sourcePath, outputDir], {
      cwd: process.cwd(),
      stdio: ["ignore", logFd, logFd],
      timeout: 180_000,
      windowsHide: true,
    });
  } finally {
    closeSync(logFd);
  }
  const fixture = JSON.parse(readFileSync(path.join(outputDir, "metadata.json"), "utf8")) as P00CompiledFixture;
  return { fixture, log: readFileSync(logPath, "utf8") };
}

type P00Roi = {
  id: string;
  worldBBoxEstimate?: [number, number, number, number];
  handles?: string[];
};

type P00HostResourceEvent = {
  type: "chunk-load-start" | "chunk-load-outcome" | "chunk-evicted" | "viewport-snapshot";
  chunkId?: string;
  loadId?: number;
  status?: "accepted" | "rejected" | "stale-visibility";
  reason?: string;
  triggerChunkId?: string | null;
  triggerLoadId?: number | null;
  visibleSetRevision?: number;
  observedAtMs?: number;
  attemptCount?: number;
  rejectionResources?: string[];
  chunkVertexCount?: number;
  geometryCpuBytesAdded?: number;
  candidateCpuBytes?: number;
  incomingUnpackedCpuBytes?: number;
  candidateRefinementSourceBytes?: number;
  sharedRendererSourceBytes?: number;
  candidateUniqueRefinementSourceBytes?: number;
  retainedRefinementSourceBytesIfAccepted?: number;
  candidateGpuBufferBytes?: number;
  cpuResidentBytes?: number;
  cpuBudgetBytes?: number;
  gpuBufferBytesEstimate?: number;
  gpuBudgetBytes?: number;
  evictedChunkIds?: string[];
  layoutId?: string;
  cameraState?: {
    center: [number, number];
    width: number;
    height: number;
    unitsPerCssPixel: number;
  };
  viewportBBox?: [number, number, number, number] | null;
  visibleChunkCount?: number;
};

type RunSample = {
  label: "first-open" | "warm-reopen" | "projected-grid-replay" | "viewport-grid-replay" |
    "baseline-paced-replay" | "projected-grid-paced-replay" | "viewport-grid-paced-replay" |
    "baseline-paced-12-replay" | "projected-grid-paced-12-replay" | "viewport-grid-paced-12-replay" |
    "baseline-paced-18-replay" | "projected-grid-paced-18-replay" | "viewport-grid-paced-18-replay";
  apiRequests: string[];
  chunkIds: string[];
  chunkBytes: number;
  testOnlyReplayOrder: string[] | null;
  testOnlyPacedCaptureTarget: number | null;
  testOnlyPacedUnrankedChunkIds: string[];
  pendingChunkResponses?: number;
  hostResourceEvents?: P00HostResourceEvent[];
  firstContentFrameRaster?: {
    width: number;
    height: number;
    backgroundRgba: [number, number, number, number];
    foregroundPixelCount: number;
    occupiedCellCount: number;
    occupiedCellIds: number[];
    cellPixelThreshold: number;
    colorDeltaThreshold: number;
    acceptedChunkCountAtCapture: number;
    acceptedChunkIdsAtCapture: string[];
    drawCallCountAtCapture: number;
    capturedAtPerformanceMs: number;
    framebufferIsDefault: boolean;
  } | null;
  initialViewport?: P00ViewportSnapshot;
  screenshotViewport?: P00ViewportSnapshot;
  initialChunkRequestCount?: number;
  initialChunkBytes?: number;
  initialChunkIds?: string[];
  initialRouteRequestIds?: string[];
  initialHostResourceEvents?: P00HostResourceEvent[];
  initialSettleDiagnostics?: {
    attempts: number;
    stableSamples: number;
    pendingRouteResponses: number;
    pendingHostLoadIds: number[];
  };
  initialVisibleChunksSettledMs?: number;
  hostInteractiveMs?: number;
  qualityWarningText?: string | null;
  budgetSkippedChunkCount?: number | null;
  twoFrameCheckpointMs?: number;
  loadedVertexCount?: number;
  canvas?: { width: number; height: number };
  canvasCssBox?: {
    canvas: { left: number; top: number; width: number; height: number };
    overlay: { left: number; top: number; width: number; height: number } | null;
    devicePixelRatio: number;
  };
  canvasSha256?: string;
  browserMetrics?: Record<string, number>;
  glTelemetry?: Record<string, unknown>;
  chromiumProcessRss?: Record<string, unknown>;
  rasterOccupancy?: {
    width: number;
    height: number;
    backgroundRgba: [number, number, number, number];
    foregroundPixelCount: number;
    occupiedCellCount: number;
    occupiedCellIds: number[];
    cellPixelThreshold: number;
    minimumForegroundPixelCountSweep: Array<{
      minimumForegroundPixelCount: number;
      occupiedCellCount: number;
      occupiedCellIds: number[];
    }>;
    viewportWidthCss: number;
    viewportHeightCss: number;
    paddingCssPixels: number;
    colorDeltaThreshold: number;
    thresholdSweep: Array<{
      colorDeltaThreshold: number;
      foregroundPixelCount: number;
      occupiedCellCount: number;
      occupiedCellIds: number[];
    }>;
    gridSweep: Array<{
      gridSize: number;
      thresholdSweep: Array<{
        colorDeltaThreshold: number;
        foregroundPixelCount: number;
        occupiedCellCount: number;
        occupiedCellIds: number[];
        occupiedCellPixelCounts: Array<{ cellId: number; pixelCount: number }>;
      }>;
    }>;
  };
};

type P00ViewportSnapshot = {
  layoutId: string;
  cameraState: NonNullable<P00HostResourceEvent["cameraState"]>;
  viewportBBox: [number, number, number, number];
  visibleChunkCount: number;
};

function sha256(bytes: Uint8Array | Buffer | string): string {
  return createHash("sha256").update(bytes).digest("hex");
}

function boxesOverlap(a: number[], b: number[]): boolean {
  return a[0] <= b[2] && a[2] >= b[0] && a[1] <= b[3] && a[3] >= b[1];
}

async function readPageMetrics(page: Page): Promise<Record<string, number>> {
  const session = await page.context().newCDPSession(page);
  try {
    await session.send("Performance.enable");
    const result = await session.send("Performance.getMetrics") as {
      metrics: Array<{ name: string; value: number }>;
    };
    const all = Object.fromEntries(result.metrics.map((metric) => [metric.name, metric.value]));
    return Object.fromEntries(
      ["JSHeapUsedSize", "JSHeapTotalSize", "Nodes", "JSEventListeners", "TaskDuration", "LayoutCount"]
        .flatMap((name) => typeof all[name] === "number" ? [[name, all[name]]] : []),
    );
  } finally {
    await session.detach().catch(() => {});
  }
}

async function readChromiumProcessRss(session: CDPSession): Promise<Record<string, unknown>> {
  if (process.platform !== "win32") {
    return { available: false, reason: `Windows process working-set reader is unavailable on ${process.platform}` };
  }
  try {
    const result = await session.send("SystemInfo.getProcessInfo") as {
      processInfo: Array<{ id: number; type: string; cpuTime: number }>;
    };
    const processInfo = result.processInfo.filter((item) => Number.isInteger(item.id));
    const processIds = Array.from(new Set(processInfo.map((item) => item.id)));
    if (processIds.length === 0) return { available: false, reason: "CDP returned no process IDs" };
    const script = `$processIds=@(${processIds.join(",")}); $rows=@(Get-Process -Id $processIds -ErrorAction SilentlyContinue | ForEach-Object { [pscustomobject]@{ id=[int]$_.Id; name=$_.ProcessName; workingSetBytes=[long]$_.WorkingSet64 } }); ConvertTo-Json -InputObject $rows -Compress`;
    const stdout = execFileSync("powershell.exe", ["-NoProfile", "-Command", script], {
      encoding: "utf8",
      timeout: 8_000,
      windowsHide: true,
    }).trim();
    const raw = stdout ? JSON.parse(stdout) as Array<{ id: number; name: string; workingSetBytes: number }> | { id: number; name: string; workingSetBytes: number } : [];
    const rows = Array.isArray(raw) ? raw : [raw];
    const byId = new Map(rows.map((row) => [row.id, row]));
    return {
      available: true,
      note: "Per-process working sets; summing them can double-count shared pages.",
      processes: processInfo.flatMap((item) => {
        const row = byId.get(item.id);
        return row ? [{ type: item.type, pid: item.id, workingSetBytes: row.workingSetBytes }] : [];
      }),
    };
  } catch (error) {
    return {
      available: false,
      reason: error instanceof Error ? error.message.slice(0, 240) : String(error),
    };
  }
}

async function measureP00CanvasRasterOccupancy(
  page: Page,
  pngBytes: Buffer,
  gridSizes: number[],
  viewport: { widthCss: number; heightCss: number; paddingCssPixels: number },
) {
  return page.evaluate(async ({ pngBase64, gridSizes, viewport }) => {
    const image = new Image();
    image.src = `data:image/png;base64,${pngBase64}`;
    await image.decode();
    const canvas = document.createElement("canvas");
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context || canvas.width <= 0 || canvas.height <= 0) throw new Error("Could not decode the captured CAD canvas PNG.");
    context.drawImage(image, 0, 0);
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
    const patchSize = Math.min(8, canvas.width, canvas.height);
    const backgroundCounts = new Map<string, { color: [number, number, number, number]; count: number }>();
    for (const [left, top] of [[0, 0], [canvas.width - patchSize, 0], [0, canvas.height - patchSize], [canvas.width - patchSize, canvas.height - patchSize]]) {
      for (let y = top; y < top + patchSize; y++) {
        for (let x = left; x < left + patchSize; x++) {
          const offset = (y * canvas.width + x) * 4;
          const color: [number, number, number, number] = [pixels[offset]!, pixels[offset + 1]!, pixels[offset + 2]!, pixels[offset + 3]!];
          const key = color.join(",");
          const previous = backgroundCounts.get(key);
          backgroundCounts.set(key, { color, count: (previous?.count ?? 0) + 1 });
        }
      }
    }
    const backgroundRgba = Array.from(backgroundCounts.values()).sort((a, b) => b.count - a.count)[0]!.color;
    const colorDeltaThresholds = [8, 16, 32, 64];
    const cellPixelCountsByGridSize = new Map(gridSizes.map((gridSize) => [gridSize,
      new Map(colorDeltaThresholds.map((threshold) => [threshold, new Uint32Array(gridSize * gridSize)])),
    ]));
    const foregroundPixelCountsByThreshold = new Map(colorDeltaThresholds.map((threshold) => [threshold, 0]));
    for (let y = 0; y < canvas.height; y++) {
      for (let x = 0; x < canvas.width; x++) {
        const offset = (y * canvas.width + x) * 4;
        const alpha = pixels[offset + 3]!;
        const delta = Math.max(
          Math.abs(pixels[offset]! - backgroundRgba[0]),
          Math.abs(pixels[offset + 1]! - backgroundRgba[1]),
          Math.abs(pixels[offset + 2]! - backgroundRgba[2]),
        );
        if (alpha > 0) {
          const rasterCssX = (x + 0.5) * viewport.widthCss / canvas.width;
          const rasterCssY = (y + 0.5) * viewport.heightCss / canvas.height;
          for (const threshold of colorDeltaThresholds) {
            if (delta >= threshold || alpha < 250) {
              foregroundPixelCountsByThreshold.set(threshold, foregroundPixelCountsByThreshold.get(threshold)! + 1);
              for (const gridSize of gridSizes) {
                const column = Math.min(gridSize - 1, Math.max(0, Math.floor((rasterCssX + viewport.paddingCssPixels) /
                  (viewport.widthCss + 2 * viewport.paddingCssPixels) * gridSize)));
                const paddedRow = Math.min(gridSize - 1, Math.max(0, Math.floor((rasterCssY + viewport.paddingCssPixels) /
                  (viewport.heightCss + 2 * viewport.paddingCssPixels) * gridSize)));
                cellPixelCountsByGridSize.get(gridSize)!.get(threshold)![paddedRow * gridSize + column]++;
              }
            }
          }
        }
      }
    }
    const cellPixelThreshold = 3;
    const gridSweep = gridSizes.map((gridSize) => ({
      gridSize,
      thresholdSweep: colorDeltaThresholds.map((colorDeltaThreshold) => {
        const cellPixelCounts = cellPixelCountsByGridSize.get(gridSize)!.get(colorDeltaThreshold)!;
        const occupiedCellIds: number[] = [];
        for (let index = 0; index < cellPixelCounts.length; index++) {
          if (cellPixelCounts[index]! >= cellPixelThreshold) occupiedCellIds.push(index);
        }
        return {
          colorDeltaThreshold,
          foregroundPixelCount: foregroundPixelCountsByThreshold.get(colorDeltaThreshold)!,
          occupiedCellCount: occupiedCellIds.length,
          occupiedCellIds,
          occupiedCellPixelCounts: occupiedCellIds.map((cellId) => ({ cellId, pixelCount: cellPixelCounts[cellId]! })),
        };
      }),
    }));
    const thresholdSweep = gridSweep.find((grid) => grid.gridSize === 20)?.thresholdSweep;
    if (!thresholdSweep) throw new Error("P00 raster grid sweep must include the 20x20 comparison grid.");
    const defaultThreshold = thresholdSweep.find((result) => result.colorDeltaThreshold === 16)!;
    const primaryCellPixelCounts = cellPixelCountsByGridSize.get(20)!.get(16)!;
    const minimumForegroundPixelCountSweep = [1, 2, 3, 4, 6, 10].map((minimumForegroundPixelCount) => {
      const occupiedCellIds = Array.from(primaryCellPixelCounts, (pixelCount, cellId) =>
        pixelCount >= minimumForegroundPixelCount ? cellId : -1).filter((cellId) => cellId >= 0);
      return { minimumForegroundPixelCount, occupiedCellCount: occupiedCellIds.length, occupiedCellIds };
    });
    return {
      width: canvas.width,
      height: canvas.height,
      backgroundRgba,
      foregroundPixelCount: defaultThreshold.foregroundPixelCount,
      occupiedCellCount: defaultThreshold.occupiedCellCount,
      occupiedCellIds: defaultThreshold.occupiedCellIds,
      cellPixelThreshold,
      minimumForegroundPixelCountSweep,
      viewportWidthCss: viewport.widthCss,
      viewportHeightCss: viewport.heightCss,
      paddingCssPixels: viewport.paddingCssPixels,
      colorDeltaThreshold: defaultThreshold.colorDeltaThreshold,
      thresholdSweep,
      gridSweep,
    };
  }, { pngBase64: pngBytes.toString("base64"), gridSizes, viewport });
}

async function captureP00CanvasOnlyScreenshot(page: Page, canvas: Locator): Promise<Buffer> {
  await canvas.evaluate((element) => element.setAttribute("data-p00-raster-capture", "true"));
  const captureStyle = await page.addStyleTag({
    content: "body * { visibility: hidden !important; } canvas[data-p00-raster-capture='true'] { visibility: visible !important; }",
  });
  try {
    const visibleOverlayCount = await page.evaluate(() => {
      const target = document.querySelector("canvas[data-p00-raster-capture='true']");
      if (!target) throw new Error("P00 raster capture target disappeared before screenshot.");
      return Array.from(document.body.querySelectorAll("*"))
        .filter((element) => element !== target && !element.contains(target) && getComputedStyle(element).visibility !== "hidden")
        .length;
    });
    if (visibleOverlayCount !== 0) throw new Error(`P00 canvas-only screenshot still has ${visibleOverlayCount} visible overlay elements.`);
    await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
    return await canvas.screenshot();
  } finally {
    await captureStyle.evaluate((style) => style.parentNode?.removeChild(style));
    await canvas.evaluate((element) => element.removeAttribute("data-p00-raster-capture"));
  }
}

async function sampleP00CanvasCellPixels(
  page: Page,
  pngBytes: Buffer,
  cellIds: number[],
  viewport: { widthCss: number; heightCss: number; paddingCssPixels: number },
) {
  return page.evaluate(async ({ pngBase64, cellIds, viewport }) => {
    const image = new Image();
    image.src = `data:image/png;base64,${pngBase64}`;
    await image.decode();
    const canvas = document.createElement("canvas");
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context || canvas.width <= 0 || canvas.height <= 0) throw new Error("Could not decode the P00 canvas PNG for cell-pixel provenance.");
    context.drawImage(image, 0, 0);
    const data = context.getImageData(0, 0, canvas.width, canvas.height).data;
    const patchSize = Math.min(8, canvas.width, canvas.height);
    const backgroundCounts = new Map<string, { rgba: [number, number, number, number]; count: number }>();
    for (const [left, top] of [[0, 0], [canvas.width - patchSize, 0], [0, canvas.height - patchSize], [canvas.width - patchSize, canvas.height - patchSize]]) {
      for (let y = top; y < top + patchSize; y++) {
        for (let x = left; x < left + patchSize; x++) {
          const offset = (y * canvas.width + x) * 4;
          const rgba: [number, number, number, number] = [data[offset]!, data[offset + 1]!, data[offset + 2]!, data[offset + 3]!];
          const key = rgba.join(",");
          const previous = backgroundCounts.get(key);
          backgroundCounts.set(key, { rgba, count: (previous?.count ?? 0) + 1 });
        }
      }
    }
    const background = Array.from(backgroundCounts.values()).sort((a, b) => b.count - a.count)[0]!.rgba;
    const targetIds = new Set(cellIds);
    const points: Array<{ cellId: number; cssX: number; cssY: number; channelDelta: number }> = [];
    const gridSize = 20;
    for (let y = 0; y < canvas.height; y++) {
      for (let x = 0; x < canvas.width; x++) {
        const offset = (y * canvas.width + x) * 4;
        const alpha = data[offset + 3]!;
        const channelDelta = Math.max(
          Math.abs(data[offset]! - background[0]),
          Math.abs(data[offset + 1]! - background[1]),
          Math.abs(data[offset + 2]! - background[2]),
        );
        if (alpha === 0 || (channelDelta < 16 && alpha >= 250)) continue;
        const cssX = (x + 0.5) * viewport.widthCss / canvas.width;
        const cssY = (y + 0.5) * viewport.heightCss / canvas.height;
        const column = Math.min(gridSize - 1, Math.max(0, Math.floor((cssX + viewport.paddingCssPixels) /
          (viewport.widthCss + 2 * viewport.paddingCssPixels) * gridSize)));
        const row = Math.min(gridSize - 1, Math.max(0, Math.floor((cssY + viewport.paddingCssPixels) /
          (viewport.heightCss + 2 * viewport.paddingCssPixels) * gridSize)));
        const cellId = row * gridSize + column;
        if (targetIds.has(cellId)) points.push({ cellId, cssX, cssY, channelDelta });
      }
    }
    return { width: canvas.width, height: canvas.height, background, points };
  }, { pngBase64: pngBytes.toString("base64"), cellIds, viewport });
}

function traceP00RasterCellSources(args: {
  pixels: Array<{ cellId: number; cssX: number; cssY: number; channelDelta: number }>;
  cellIds: number[];
  acceptedChunkIds: Set<string>;
  modelChunks: P00CompiledFixture["manifest"]["chunks"];
  compiledChunks: ReadonlyMap<string, Uint8Array>;
  viewport: {
    width: number;
    height: number;
    center: [number, number];
    unitsPerCssPixel: number;
    paddingCssPixels?: number;
  };
}) {
  type Point = [number, number];
  type Primitive = {
    kind: "line" | "triangle";
    chunkId: string;
    layer: string;
    commandIndex: number;
    firstVertex: number;
    vertexCount: number;
    lineweightMm?: number;
    points: Point[];
  };
  const gridSize = 20;
  const padding = Math.max(0, args.viewport.paddingCssPixels ?? 1);
  const pixelSamplesByCell = new Map<number, typeof args.pixels>();
  for (const pixel of args.pixels) {
    const group = pixelSamplesByCell.get(pixel.cellId) ?? [];
    group.push(pixel);
    pixelSamplesByCell.set(pixel.cellId, group);
  }
  const cellRects = new Map(args.cellIds.map((cellId) => {
    const row = Math.floor(cellId / gridSize);
    const column = cellId % gridSize;
    const cellWidth = (args.viewport.width + 2 * padding) / gridSize;
    const cellHeight = (args.viewport.height + 2 * padding) / gridSize;
    return [cellId, {
      minX: column * cellWidth - padding - 16,
      maxX: (column + 1) * cellWidth - padding + 16,
      minY: row * cellHeight - padding - 16,
      maxY: (row + 1) * cellHeight - padding + 16,
    }] as const;
  }));
  const primitivesByCell = new Map(args.cellIds.map((cellId) => [cellId, [] as Primitive[]]));
  const project = (chunkOrigin: [number, number], x: number, y: number): Point => [
    args.viewport.width / 2 + (chunkOrigin[0] + x - args.viewport.center[0]) / args.viewport.unitsPerCssPixel,
    args.viewport.height / 2 - (chunkOrigin[1] + y - args.viewport.center[1]) / args.viewport.unitsPerCssPixel,
  ];
  const overlapsExpandedCell = (points: Point[], cellId: number): boolean => {
    const rect = cellRects.get(cellId)!;
    return Math.max(...points.map((point) => point[0])) >= rect.minX && Math.min(...points.map((point) => point[0])) <= rect.maxX &&
      Math.max(...points.map((point) => point[1])) >= rect.minY && Math.min(...points.map((point) => point[1])) <= rect.maxY;
  };

  for (const manifestChunk of args.modelChunks) {
    if (!args.acceptedChunkIds.has(manifestChunk.chunkId)) continue;
    const bytes = args.compiledChunks.get(manifestChunk.chunkId);
    if (!bytes) continue;
    const chunk = unpackSceneChunk(manifestChunk.chunkId, bytes);
    const drawCommands = Array.isArray(chunk.meta?.drawCommands) ? chunk.meta.drawCommands as Array<{
      kind: "line" | "triangle" | "wipeout";
      layer?: string;
      firstVertex: number;
      vertexCount: number;
      lineweightMm?: number;
    }> : [];
    for (let commandIndex = 0; commandIndex < drawCommands.length; commandIndex++) {
      const command = drawCommands[commandIndex]!;
      if (command.kind === "line") {
        const first = Math.max(0, command.firstVertex);
        const end = Math.min(chunk.xyArray.length / 2, first + command.vertexCount);
        for (let vertex = first; vertex + 1 < end; vertex += 2) {
          const offset = vertex * 2;
          const points: Point[] = [
            project(chunk.origin, chunk.xyArray[offset]!, chunk.xyArray[offset + 1]!),
            project(chunk.origin, chunk.xyArray[offset + 2]!, chunk.xyArray[offset + 3]!),
          ];
          for (const cellId of args.cellIds) {
            if (overlapsExpandedCell(points, cellId)) primitivesByCell.get(cellId)!.push({
              kind: "line", chunkId: chunk.chunkId, layer: command.layer ?? "", commandIndex,
              firstVertex: vertex, vertexCount: 2, lineweightMm: command.lineweightMm, points,
            });
          }
        }
      } else if (command.kind === "triangle" && chunk.trianglesArray) {
        const first = Math.max(0, command.firstVertex);
        const end = Math.min(chunk.trianglesArray.length / 2, first + command.vertexCount);
        for (let vertex = first; vertex + 2 < end; vertex += 3) {
          const offset = vertex * 2;
          const points: Point[] = [
            project(chunk.origin, chunk.trianglesArray[offset]!, chunk.trianglesArray[offset + 1]!),
            project(chunk.origin, chunk.trianglesArray[offset + 2]!, chunk.trianglesArray[offset + 3]!),
            project(chunk.origin, chunk.trianglesArray[offset + 4]!, chunk.trianglesArray[offset + 5]!),
          ];
          for (const cellId of args.cellIds) {
            if (overlapsExpandedCell(points, cellId)) primitivesByCell.get(cellId)!.push({
              kind: "triangle", chunkId: chunk.chunkId, layer: command.layer ?? "", commandIndex,
              firstVertex: vertex, vertexCount: 3, points,
            });
          }
        }
      }
    }
  }

  const pointSegmentDistance = (point: Point, a: Point, b: Point): number => {
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const lengthSquared = dx * dx + dy * dy;
    const t = lengthSquared > 0 ? Math.max(0, Math.min(1, ((point[0] - a[0]) * dx + (point[1] - a[1]) * dy) / lengthSquared)) : 0;
    return Math.hypot(point[0] - (a[0] + t * dx), point[1] - (a[1] + t * dy));
  };
  const pointTriangleDistance = (point: Point, triangle: Point[]): number => {
    const [a, b, c] = triangle as [Point, Point, Point];
    const cross = (p: Point, q: Point, r: Point) => (q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0]);
    const signs = [cross(a, b, point), cross(b, c, point), cross(c, a, point)];
    if (!(signs.some((value) => value < -1e-8) && signs.some((value) => value > 1e-8))) return 0;
    return Math.min(pointSegmentDistance(point, a, b), pointSegmentDistance(point, b, c), pointSegmentDistance(point, c, a));
  };

  return args.cellIds.map((cellId) => {
    const pixelSamples = pixelSamplesByCell.get(cellId) ?? [];
    const primitives = primitivesByCell.get(cellId) ?? [];
    let nearestOverall: { distanceCssPx: number; source: Omit<Primitive, "points"> } | null = null;
    const nearestDistances = pixelSamples.map((pixel) => {
      let nearestForPixel: { distanceCssPx: number; source: Omit<Primitive, "points"> } | null = null;
      const point: Point = [pixel.cssX, pixel.cssY];
      for (const primitive of primitives) {
        const distanceCssPx = primitive.kind === "line"
          ? pointSegmentDistance(point, primitive.points[0]!, primitive.points[1]!)
          : pointTriangleDistance(point, primitive.points);
        if (!nearestForPixel || distanceCssPx < nearestForPixel.distanceCssPx) {
          const { points: _points, ...source } = primitive;
          nearestForPixel = { distanceCssPx, source };
        }
      }
      if (nearestForPixel && (!nearestOverall || nearestForPixel.distanceCssPx < nearestOverall.distanceCssPx)) nearestOverall = nearestForPixel;
      return nearestForPixel?.distanceCssPx ?? null;
    });
    const measuredDistances = nearestDistances.filter((value): value is number => value !== null);
    return {
      cellId,
      foregroundPixelSamples: pixelSamples.length,
      nearbyProjectedPrimitiveCountWithin16CssPx: primitives.length,
      pixelsWithin1CssPxOfProjectedPrimitive: measuredDistances.filter((distance) => distance <= 1).length,
      minimumDistanceCssPx: measuredDistances.length ? Math.min(...measuredDistances) : null,
      maximumNearestDistanceCssPx: measuredDistances.length ? Math.max(...measuredDistances) : null,
      nearestProjectedSource: nearestOverall ? {
        distanceCssPx: Math.round(nearestOverall.distanceCssPx * 1000) / 1000,
        ...nearestOverall.source,
      } : null,
    };
  });
}

test.describe("CAD V2 F08 — P00 gerçek R001 browser ölçümü", () => {
  test.afterEach(async ({ page }) => {
    await cleanupUploadedCadFixtures(page);
    const tempRoot = path.resolve(tmpdir());
    for (const tempDirectory of p00TempDirectories) {
      const resolved = path.resolve(tempDirectory);
      const relative = path.relative(tempRoot, resolved);
      if (relative.startsWith("..") || path.isAbsolute(relative)) throw new Error("P00 fixture cleanup target escaped the OS temp directory");
      rmSync(resolved, { recursive: true, force: true });
      p00TempDirectories.delete(tempDirectory);
    }
  });

  test("R001 cold/warm host, ROI chunk coverage, heap/RSS, WebGL upload ve pan/zoom yanıtı", async ({ page, browser }) => {
    // Full 284-chunk R001 coverage includes cold, warm, and paced viewport replays.
    // Keep the acceptance thresholds unchanged while allowing the complete run and teardown.
    const releaseRepeatCountForTimeout = Number(process.env.CAD_V2_L11_BROWSER_RELEASE_REPEAT_COUNT ?? "0");
    test.setTimeout(releaseRepeatCountForTimeout >= 30 ? 1_500_000 : 720_000);
    await signInAdmin(page);
    await page.setViewportSize({ width: 1440, height: 900 });

    const gpuInfoSession = await browser.newBrowserCDPSession();
    try {
      const { gpu } = await gpuInfoSession.send("SystemInfo.getInfo");
      console.log("[P00_GPU_BACKEND] " + JSON.stringify({
        auxAttributes: {
          displayType: gpu.auxAttributes.displayType,
          glRenderer: gpu.auxAttributes.glRenderer,
          glVendor: gpu.auxAttributes.glVendor,
          glVersion: gpu.auxAttributes.glVersion,
          glWsVendor: gpu.auxAttributes.glWsVendor,
          glWsVersion: gpu.auxAttributes.glWsVersion,
          inProcessGpu: gpu.auxAttributes.inProcessGpu,
        },
        devices: gpu.devices.map((device) => ({
          deviceString: device.deviceString,
          driverVendor: device.driverVendor,
          driverVersion: device.driverVersion,
          active: (device as typeof device & { active?: boolean }).active ?? null,
        })),
        featureStatus: gpu.featureStatus,
      }));
    } finally {
      await gpuInfoSession.detach();
    }

    const sourcePath = path.resolve(process.cwd(), "eklediklerim/ornek_dosyalar/1 ve 2.kat dwg.dwg");
    const sourceBytes = readFileSync(sourcePath);
    const sourceSha256 = sha256(sourceBytes);
    const sourceSizeBytes = statSync(sourcePath).size;
    expect(sourceBytes.byteLength).toBe(sourceSizeBytes);

    const fixtureDirectory = mkdtempSync(path.join(tmpdir(), "cad-v2-p00-r001-"));
    p00TempDirectories.add(fixtureDirectory);
    const compileLogPath = path.join(fixtureDirectory, "compile.log");
    const compileLogFd = openSync(compileLogPath, "w");
    try {
      execFileSync("node", ["--import", "tsx", "--input-type=module", "-e", p00CompilerScript, sourcePath, fixtureDirectory], {
        cwd: process.cwd(),
        stdio: ["ignore", compileLogFd, compileLogFd],
        timeout: 180_000,
        windowsHide: true,
      });
    } finally {
      closeSync(compileLogFd);
    }
    const compilerLog = readFileSync(compileLogPath, "utf8");
    const p00Fixture = JSON.parse(readFileSync(path.join(fixtureDirectory, "metadata.json"), "utf8")) as P00CompiledFixture;
    const compiled = {
      manifest: p00Fixture.manifest,
      chunks: new Map(p00Fixture.chunkFiles.map(({ chunkId, fileName }) => [
        chunkId,
        readFileSync(path.join(fixtureDirectory, "chunks", fileName)),
      ])),
    };
    const sourceHandles = new Set(p00Fixture.modelSpaceHandles);
    expect(p00Fixture.sourceSizeBytes).toBe(sourceSizeBytes);
    expect(p00Fixture.sourceSha256).toBe(sourceSha256);
    expect(compiled.manifest.sourceSha256).toBe(sourceSha256);
    expect(compiled.manifest.chunks.length).toBe(compiled.chunks.size);

    const sortedChunkEntries = Array.from(compiled.chunks.entries()).sort(([a], [b]) => a.localeCompare(b));
    const compiledSceneSha256 = sha256(sortedChunkEntries.map(([id, bytes]) => `${id}:${sha256(bytes)}\n`).join(""));
    const manifestSha256 = sha256(JSON.stringify(compiled.manifest));
    const p00ProfilePath = path.resolve(process.cwd(), "motor_v2/evidence/fidelity-v3/P00/reference-profile.json");
    const p00Profile = JSON.parse(readFileSync(p00ProfilePath, "utf8")) as {
      profileVersion: string;
      status: string;
      autoCadOracle: { status: string };
      semanticR001RoiList: P00Roi[];
    };
    const modelChunks = compiled.manifest.chunks.filter((chunk) => chunk.layoutId === "Model" && chunk.bbox);
    const roiCoverage = p00Profile.semanticR001RoiList.map((roi) => {
      const candidateChunks = roi.worldBBoxEstimate
        ? modelChunks.filter((chunk) => boxesOverlap(chunk.bbox!, roi.worldBBoxEstimate!))
        : [];
      const handles = (roi.handles ?? []).filter((handle) => /^[0-9a-f]+$/i.test(handle));
      return {
        id: roi.id,
        candidateChunkCount: candidateChunks.length,
        candidateChunkSetSha256: sha256(candidateChunks.map((chunk) => `${chunk.chunkId}:${chunk.sha256}\n`).sort().join("")),
        sourceHandlesPresent: handles.filter((handle) => sourceHandles.has(handle.toUpperCase())),
        sourceHandleCountChecked: handles.length,
      };
    });

    const fileId = await uploadRealCadBinaryFixture(page, sourcePath, "1 ve 2.kat dwg.dwg");
    const canvasScreenshots = new Map<RunSample["label"], Buffer>();
    const runs: RunSample[] = [];
    let activeRun: RunSample | null = null;
    const runForRequest = new WeakMap<object, RunSample>();
    let replayChunkOrder: string[] | null = null;
    let paceAcceptedTierCapture = false;
    let pacedAcceptedTarget = 0;
    let releasePacedTierResponses: (() => void) | null = null;
    let pacedTierCapturePromise: Promise<void> = Promise.resolve();
    let sessionCount = 0;
    page.on("request", (request) => {
      if (activeRun) runForRequest.set(request, activeRun);
      if (activeRun && new URL(request.url()).pathname.includes("/api/dokumantasyon/cad-v2/")) {
        activeRun.apiRequests.push(`${request.method()} ${new URL(request.url()).pathname}`);
      }
    });
    page.on("console", (message) => {
      if (message.type() === "debug" && message.text().startsWith("__CAD_V2_P00_CAPTURED_ACCEPTED_TIER__:")) {
        releasePacedTierResponses?.();
      }
    });

    await page.route("**/api/dokumantasyon/cad-v2/prepare", async (route) => {
      sessionCount++;
      const request = route.request().postDataJSON() as { expectedSourceVersionKey?: string };
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          status: "ready",
          sceneId: compiled.manifest.sceneId,
          viewSessionId: `vs_f08_p00_browser_${sessionCount}`,
          sourceVersionKey: request.expectedSourceVersionKey ?? compiled.manifest.sourceVersionKey,
        }),
      });
    });
    await page.route("**/api/dokumantasyon/cad-v2/view-sessions/*/heartbeat", async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ expiresAt: Date.now() + 180_000 }) });
    });
    await page.route("**/api/dokumantasyon/cad-v2/view-sessions/*", async (route) => {
      await route.fulfill({ status: 204, body: "" });
    });
    await page.route(`**/api/dokumantasyon/cad-v2/scenes/${compiled.manifest.sceneId}/manifest`, async (route) => {
      const requestRun = runForRequest.get(route.request()) ?? activeRun;
      const runReplayOrder = requestRun ? requestRun.testOnlyReplayOrder : replayChunkOrder;
      const manifest = runReplayOrder
        ? (() => {
            const rank = new Map(runReplayOrder.map((chunkId, index) => [chunkId, index]));
            return {
              ...compiled.manifest,
              // validateSceneManifest prefers indexPages over flat chunks when both are populated.
              // This test-only replay deliberately exercises the reordered flat list.
              indexPages: [],
              chunks: [...compiled.manifest.chunks].sort((a, b) =>
                (rank.get(a.chunkId) ?? Number.MAX_SAFE_INTEGER) - (rank.get(b.chunkId) ?? Number.MAX_SAFE_INTEGER) ||
                a.chunkId.localeCompare(b.chunkId)),
            };
          })()
        : compiled.manifest;
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(manifest) });
    });
    await page.route(`**/api/dokumantasyon/cad-v2/scenes/${compiled.manifest.sceneId}/chunks/*`, async (route) => {
      const chunkId = new URL(route.request().url()).pathname.split("/").at(-1)!;
      const requestRun = runForRequest.get(route.request()) ?? activeRun;
      if (requestRun) {
        requestRun.chunkIds.push(chunkId);
        requestRun.pendingChunkResponses = (requestRun.pendingChunkResponses ?? 0) + 1;
      }
      try {
        const bytes = compiled.chunks.get(chunkId);
        if (!bytes) {
          await route.fulfill({ status: 404, contentType: "application/json", body: JSON.stringify({ error: `P00 chunk not found: ${chunkId}` }) });
          return;
        }
        if (requestRun) requestRun.chunkBytes += bytes.byteLength;
        if (requestRun && requestRun.testOnlyPacedCaptureTarget !== null) {
          const candidateRank = requestRun.testOnlyReplayOrder?.indexOf(chunkId) ?? -1;
          if (candidateRank < 0 && !requestRun.testOnlyPacedUnrankedChunkIds.includes(chunkId)) {
            requestRun.testOnlyPacedUnrankedChunkIds.push(chunkId);
            console.warn("[P00_PACED_UNRANKED_CHUNK] " + JSON.stringify({
              label: requestRun.label,
              chunkId,
              replayOrderCount: requestRun.testOnlyReplayOrder?.length ?? 0,
            }));
          }
          // Unranked requests belong after the exact tier; the framebuffer's accepted-ID assertion
          // remains the hard guard against an unexpected chunk entering the captured tier.
          const pacingRank = candidateRank < 0 ? Number.MAX_SAFE_INTEGER : candidateRank;
          // Keep post-target candidates behind a test-only release barrier until the exact framebuffer capture.
          if (pacingRank >= requestRun.testOnlyPacedCaptureTarget) await pacedTierCapturePromise;
          const delayMs = pacingRank < 6 ? pacingRank * 12 : 250;
          if (delayMs > 0) await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
        await route.fulfill({
          status: 200,
          contentType: "application/octet-stream",
          body: Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength),
        });
      } finally {
        if (requestRun) requestRun.pendingChunkResponses = Math.max(0, (requestRun.pendingChunkResponses ?? 1) - 1);
      }
    });

    await page.addInitScript(() => {
      const requestedCaptureTarget = Number(window.sessionStorage.getItem("p00CaptureAcceptedTarget"));
      const firstContentFrameCaptureAcceptedTarget = Number.isInteger(requestedCaptureTarget) && requestedCaptureTarget > 0
        ? requestedCaptureTarget
        : 1;
      const state = {
        startedAt: performance.now(),
        firstDrawAt: null as number | null,
        firstAcceptedAt: null as number | null,
        firstDrawAfterFirstAcceptedAt: null as number | null,
        firstContentFrameCaptureAcceptedTarget,
        firstContentFrameCaptureScheduled: false,
        firstContentFrameCapture: null as null | {
          width: number;
          height: number;
          pixels: Uint8Array;
          capturedAtPerformanceMs: number;
          acceptedChunkCountAtCapture: number;
          acceptedChunkIdsAtCapture: string[];
          drawCallCountAtCapture: number;
          framebufferIsDefault: boolean;
        },
        firstContentFrameCaptureError: null as string | null,
        multiDrawBatchObjectCount: 0,
        multiDrawBatchInstanceCount: 0,
        painterDepthBatchChunkCount: 0,
        painterDepthLineInstanceCount: 0,
        painterDepthTriangleInstanceCount: 0,
        painterDepthEvaluatedChunkCount: 0,
        painterDepthFallbackReasons: {} as Record<string, number>,
        drawCalls: 0,
        acceptedChunkCount: 0,
        measureDrawFrames: false,
        previousDrawFrameAt: null as number | null,
        measuredRafTimestamp: null as number | null,
        drawOccurredDuringMeasuredRaf: false,
        drawCallsDuringMeasuredRaf: 0,
        multiDrawCallsDuringMeasuredRaf: 0,
        measuredDrawCallCounts: [] as number[],
        measuredDirectDrawCallCounts: [] as number[],
        measuredMultiDrawCallCounts: [] as number[],
        drawFrameIntervalsMs: [] as number[],
        drawFrameCallbackDurationsMs: [] as number[],
        bufferDataCalls: 0,
        bufferDataBytes: 0,
        webglMultiDrawSupported: null as boolean | null,
        longTaskSupported: false,
        longTasks: [] as Array<{ startTime: number; duration: number }>,
        pendingInputAt: null as number | null,
        pendingInputDrawCount: 0,
        pendingInputKind: "",
        inputToDrawMs: [] as number[],
        inputKinds: [] as string[],
        hostResourceEvents: [] as P00HostResourceEvent[],
        dragActive: false,
        dragSampleStarted: false,
      };
      Object.defineProperty(window, "__cadP00", { value: state, configurable: true });
      const nativeRequestAnimationFrame = window.requestAnimationFrame.bind(window);
      window.requestAnimationFrame = (callback: FrameRequestCallback) => nativeRequestAnimationFrame((timestamp) => {
        const measuring = state.measureDrawFrames;
        const callbackStartedAt = measuring ? performance.now() : null;
        if (measuring && state.measuredRafTimestamp !== timestamp) {
          state.measuredRafTimestamp = timestamp;
          state.drawOccurredDuringMeasuredRaf = false;
          state.drawCallsDuringMeasuredRaf = 0;
          state.multiDrawCallsDuringMeasuredRaf = 0;
        }
        callback.call(window, timestamp);
        if (!measuring || !state.drawOccurredDuringMeasuredRaf || state.previousDrawFrameAt === timestamp) return;
        state.measuredDrawCallCounts.push(state.drawCallsDuringMeasuredRaf);
        state.measuredDirectDrawCallCounts.push(state.drawCallsDuringMeasuredRaf - state.multiDrawCallsDuringMeasuredRaf);
        state.measuredMultiDrawCallCounts.push(state.multiDrawCallsDuringMeasuredRaf);
        if (callbackStartedAt !== null) state.drawFrameCallbackDurationsMs.push(performance.now() - callbackStartedAt);
        if (state.previousDrawFrameAt !== null && state.drawFrameIntervalsMs.length < 20_000) {
          state.drawFrameIntervalsMs.push(timestamp - state.previousDrawFrameAt);
        }
        state.previousDrawFrameAt = timestamp;
      });
      Object.defineProperty(window, "__cadV2ResourceDiagnostics", {
        value: (event: P00HostResourceEvent) => {
          state.hostResourceEvents.push(event);
          if (event.type === "chunk-load-outcome" && event.status === "accepted") {
            state.acceptedChunkCount++;
          }
          if (event.type === "chunk-load-outcome" && event.status === "accepted" && state.firstAcceptedAt === null) {
            state.firstAcceptedAt = event.observedAtMs ?? performance.now();
          }
        },
        configurable: true,
      });
      Object.defineProperty(window, "__cadV2BatchDiagnostics", {
        value: (event: {
          instanceCount?: number;
          painterDepthBatch?: boolean;
          painterDepthEvaluated?: boolean;
          painterDepthFallbackReasons?: string[];
          lineInstanceCount?: number;
          triangleInstanceCount?: number;
        }) => {
          if (event.painterDepthEvaluated) {
            state.painterDepthEvaluatedChunkCount++;
            if (event.painterDepthBatch) {
              state.painterDepthBatchChunkCount++;
              state.painterDepthLineInstanceCount += event.lineInstanceCount ?? 0;
              state.painterDepthTriangleInstanceCount += event.triangleInstanceCount ?? 0;
            } else {
              for (const reason of event.painterDepthFallbackReasons ?? []) {
                state.painterDepthFallbackReasons[reason] = (state.painterDepthFallbackReasons[reason] ?? 0) + 1;
              }
            }
            return;
          }
          state.multiDrawBatchObjectCount++;
          state.multiDrawBatchInstanceCount += event.instanceCount ?? 0;
        },
        configurable: true,
      });

      const viewerCanvasCache = new WeakMap<HTMLCanvasElement, boolean>();
      const isViewerCanvas = (gl: { canvas?: HTMLCanvasElement | OffscreenCanvas }): boolean => {
        const canvas = gl.canvas;
        if (!(canvas instanceof HTMLCanvasElement)) return false;
        const cached = viewerCanvasCache.get(canvas);
        if (cached !== undefined) return cached;
        const isViewer = canvas.dataset.p00Target === "true" || Boolean(canvas.closest("#document-studio-shell"));
        viewerCanvasCache.set(canvas, isViewer);
        return isViewer;
      };
      const recordDraw = (gl: { canvas?: HTMLCanvasElement | OffscreenCanvas }, isMultiDraw = false) => {
        if (!isViewerCanvas(gl)) return;
        if (state.webglMultiDrawSupported === null) {
          state.webglMultiDrawSupported = Boolean((gl as WebGLRenderingContext).getExtension("WEBGL_multi_draw"));
        }
        if (state.measureDrawFrames) {
          state.drawOccurredDuringMeasuredRaf = true;
          state.drawCallsDuringMeasuredRaf++;
          if (isMultiDraw) state.multiDrawCallsDuringMeasuredRaf++;
          return;
        }
        const now = performance.now();
        state.drawCalls++;
        if (state.firstDrawAt === null) state.firstDrawAt = now;
        if (state.firstAcceptedAt !== null && state.firstDrawAfterFirstAcceptedAt === null) {
          state.firstDrawAfterFirstAcceptedAt = now;
        }
        if (state.pendingInputAt !== null && state.drawCalls > state.pendingInputDrawCount) {
          state.inputToDrawMs.push(now - state.pendingInputAt);
          state.inputKinds.push(state.pendingInputKind);
          state.pendingInputAt = null;
          state.pendingInputKind = "";
        }
      };
      const recordInput = (kind: string) => {
        if (state.pendingInputAt !== null) return;
        state.pendingInputAt = performance.now();
        state.pendingInputDrawCount = state.drawCalls;
        state.pendingInputKind = kind;
      };
      const constructors = [
        (window as unknown as { WebGLRenderingContext?: { prototype: Record<string, unknown> } }).WebGLRenderingContext,
        (window as unknown as { WebGL2RenderingContext?: { prototype: Record<string, unknown> } }).WebGL2RenderingContext,
      ].filter(Boolean) as Array<{ prototype: Record<string, unknown> }>;
      for (const constructor of constructors) {
        const proto = constructor.prototype;
        const nativeGetExtension = proto.getExtension as ((name: string) => unknown) | undefined;
        if (nativeGetExtension) {
          proto.getExtension = function (this: WebGLRenderingContext, name: string) {
            const extension = nativeGetExtension.call(this, name);
            if (name !== "WEBGL_multi_draw" || !extension || !isViewerCanvas(this)) return extension;
            const gl = this;
            return new Proxy(extension as object, {
              get(target, property, receiver) {
                const value = Reflect.get(target, property, receiver) as unknown;
                if (typeof value !== "function" || typeof property !== "string" || !property.startsWith("multiDraw")) {
                  return value;
                }
                return (...args: unknown[]) => {
                  recordDraw(gl, true);
                  return value.apply(target, args);
                };
              },
            });
          };
        }
        for (const name of ["drawArrays", "drawElements", "drawArraysInstanced", "drawElementsInstanced"]) {
          const original = proto[name] as ((...args: unknown[]) => unknown) | undefined;
          if (!original || !Object.prototype.hasOwnProperty.call(proto, name)) continue;
          proto[name] = function (this: { canvas?: HTMLCanvasElement }, ...args: unknown[]) {
            const captureFirstContentDrawAtTarget = !state.measureDrawFrames && state.firstAcceptedAt !== null &&
              state.acceptedChunkCount >= state.firstContentFrameCaptureAcceptedTarget &&
              !state.firstContentFrameCaptureScheduled;
            recordDraw(this);
            const result = original.apply(this, args);
            if (captureFirstContentDrawAtTarget) {
              state.firstContentFrameCaptureScheduled = true;
              const gl = this as unknown as {
                drawingBufferWidth: number;
                drawingBufferHeight: number;
                RGBA: number;
                UNSIGNED_BYTE: number;
                FRAMEBUFFER_BINDING: number;
                DRAW_FRAMEBUFFER_BINDING?: number;
                getParameter(parameter: number): unknown;
                readPixels(x: number, y: number, width: number, height: number, format: number, type: number, pixels: Uint8Array): void;
              };
              queueMicrotask(() => {
                try {
                  const width = gl.drawingBufferWidth;
                  const height = gl.drawingBufferHeight;
                  if (width <= 0 || height <= 0) throw new Error("WebGL drawing buffer has an empty size.");
                  const pixels = new Uint8Array(width * height * 4);
                  gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
                  const capturedAtPerformanceMs = performance.now();
                  const acceptedChunkIdsAtCapture = state.hostResourceEvents.filter((event) =>
                    event.type === "chunk-load-outcome" && event.status === "accepted" &&
                    typeof event.observedAtMs === "number" && event.observedAtMs <= capturedAtPerformanceMs)
                    .map((event) => event.chunkId).filter((chunkId): chunkId is string => Boolean(chunkId));
                  const framebufferBinding = gl.DRAW_FRAMEBUFFER_BINDING ?? gl.FRAMEBUFFER_BINDING;
                  state.firstContentFrameCapture = {
                    width,
                    height,
                    pixels,
                    capturedAtPerformanceMs,
                    acceptedChunkCountAtCapture: acceptedChunkIdsAtCapture.length,
                    acceptedChunkIdsAtCapture,
                    drawCallCountAtCapture: state.drawCalls,
                    framebufferIsDefault: gl.getParameter(framebufferBinding) === null,
                  };
                  console.debug(`__CAD_V2_P00_CAPTURED_ACCEPTED_TIER__:${state.firstContentFrameCapture.acceptedChunkCountAtCapture}`);
                } catch (error) {
                  state.firstContentFrameCaptureError = error instanceof Error ? error.message : String(error);
                }
              });
            }
            return result;
          };
        }
        const originalBufferData = proto.bufferData as ((...args: unknown[]) => unknown) | undefined;
        if (originalBufferData && Object.prototype.hasOwnProperty.call(proto, "bufferData")) {
          proto.bufferData = function (this: { canvas?: HTMLCanvasElement }, ...args: unknown[]) {
            if (isViewerCanvas(this)) {
              state.bufferDataCalls++;
              const data = args[1];
              if (typeof data === "number") state.bufferDataBytes += data;
              else if (data instanceof ArrayBuffer) state.bufferDataBytes += data.byteLength;
              else if (ArrayBuffer.isView(data)) state.bufferDataBytes += data.byteLength;
            }
            return originalBufferData.apply(this, args);
          };
        }
      }

      const markViewerCanvas = () => {
        document.querySelectorAll<HTMLCanvasElement>("#document-studio-shell canvas").forEach((canvas) => {
          canvas.dataset.p00Target = "true";
        });
      };
      if (document.documentElement) {
        new MutationObserver(() => {
          markViewerCanvas();
        }).observe(document.documentElement, { childList: true, subtree: true });
        markViewerCanvas();
      }
      document.addEventListener("wheel", (event) => {
        const target = event.target;
        if (!state.measureDrawFrames && target instanceof Element &&
            target.closest('[aria-label="CAD V2 Çizim Etkileşim Alanı"]')) recordInput("wheel");
      }, true);
      document.addEventListener("click", (event) => {
        const target = event.target;
        if (!(target instanceof Element)) return;
        const button = target.closest('button[title="Yakınlaştır (+)"], button[title="Uzaklaştır (-)"]');
        if (button) recordInput(button.getAttribute("title") === "Yakınlaştır (+)" ? "zoom-in" : "zoom-out");
      }, true);
      document.addEventListener("pointerdown", (event) => {
        const target = event.target;
        if (target instanceof Element && target.closest('[aria-label="CAD V2 Çizim Etkileşim Alanı"]')) {
          state.dragActive = true;
          state.dragSampleStarted = false;
        }
      }, true);
      document.addEventListener("pointermove", (event) => {
        if (state.dragActive && !state.dragSampleStarted && event.buttons !== 0) {
          state.dragSampleStarted = true;
          recordInput("pan");
        }
      }, true);
      document.addEventListener("pointerup", () => { state.dragActive = false; }, true);

      if (typeof PerformanceObserver !== "undefined" && PerformanceObserver.supportedEntryTypes.includes("longtask")) {
        state.longTaskSupported = true;
        try {
          new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              if (state.longTasks.length < 200) state.longTasks.push({ startTime: entry.startTime, duration: entry.duration });
            }
          }).observe({ type: "longtask", buffered: true });
        } catch {
          state.longTaskSupported = false;
        }
      }
    });

    const browserCdp = await browser.newBrowserCDPSession();
    const sampleRss = () => readChromiumProcessRss(browserCdp);
    const fileUrl = `/dokumantasyon/dosya/${fileId}?cadEngine=v2`;

    const openAndSample = async (
      label: RunSample["label"],
      reopen: boolean,
      framebufferCaptureAcceptedTarget = 1,
      retainRunSample = true,
    ): Promise<RunSample> => {
      const sample: RunSample = {
        label,
        apiRequests: [],
        chunkIds: [],
        chunkBytes: 0,
        testOnlyReplayOrder: replayChunkOrder ? [...replayChunkOrder] : null,
        testOnlyPacedCaptureTarget: paceAcceptedTierCapture ? pacedAcceptedTarget : null,
        testOnlyPacedUnrankedChunkIds: [],
        hostResourceEvents: [],
      };
      if (retainRunSample) runs.push(sample);
      activeRun = sample;
      const startedAt = performance.now();
      if (framebufferCaptureAcceptedTarget > 1) {
        await page.evaluate((target) => window.sessionStorage.setItem("p00CaptureAcceptedTarget", String(target)), framebufferCaptureAcceptedTarget);
      }
      if (reopen) await page.reload({ waitUntil: "domcontentloaded", timeout: 60_000 });
      else await page.goto(fileUrl, { waitUntil: "domcontentloaded", timeout: 60_000 });

      const input = page.getByLabel("CAD V2 Çizim Etkileşim Alanı");
      await expect(input).toBeVisible({ timeout: 60_000 });
      const v2Footer = page.locator("footer").filter({ hasText: "MOTOR V2" });
      await expect(v2Footer).toBeVisible({ timeout: 60_000 });
      await expect.poll(async () => {
        const text = await v2Footer.innerText().catch(() => "");
        const match = text.match(/Varlık:\s*([\d,.]+)/);
        return match ? Number(match[1].replace(/\D/g, "")) : 0;
      }, { timeout: 90_000 }).toBeGreaterThan(0);

      let previousCount = -1;
      let stableSamples = 0;
      let attempts = 0;
      let pendingHostLoadIds: number[] = [];
      let pendingRouteResponses = 0;
      for (; attempts < 100 && stableSamples < 5; attempts++) {
        const count = sample.chunkIds.length;
        const hostLoadState = await page.evaluate(() => {
          const events = (window as unknown as { __cadP00: { hostResourceEvents: P00HostResourceEvent[] } }).__cadP00.hostResourceEvents;
          const started = new Set<number>();
          const completed = new Set<number>();
          for (const event of events) {
            if (typeof event.loadId !== "number") continue;
            if (event.type === "chunk-load-start") started.add(event.loadId);
            else if (event.type === "chunk-load-outcome") completed.add(event.loadId);
          }
          return { pendingLoadIds: Array.from(started).filter((loadId) => !completed.has(loadId)) };
        });
        pendingHostLoadIds = hostLoadState.pendingLoadIds;
        pendingRouteResponses = sample.pendingChunkResponses ?? 0;
        if (count === previousCount && pendingRouteResponses === 0 && pendingHostLoadIds.length === 0) stableSamples++;
        else stableSamples = 0;
        previousCount = count;
        await page.waitForTimeout(100);
      }
      sample.initialSettleDiagnostics = {
        attempts,
        stableSamples,
        pendingRouteResponses,
        pendingHostLoadIds,
      };
      if (stableSamples < 5) {
        throw new Error(`P00 initial chunk sample did not settle: ${JSON.stringify(sample.initialSettleDiagnostics)}`);
      }
      sample.initialRouteRequestIds = [...sample.chunkIds];
      sample.initialChunkIds = Array.from(new Set(sample.initialRouteRequestIds)).sort();
      sample.initialChunkRequestCount = sample.initialRouteRequestIds.length;
      sample.initialChunkBytes = sample.chunkBytes;
      sample.initialHostResourceEvents = await page.evaluate(() =>
        (window as unknown as { __cadP00: { hostResourceEvents: P00HostResourceEvent[] } }).__cadP00.hostResourceEvents.slice());
      const statusText = await v2Footer.innerText();
      const entityMatch = statusText.match(/Varlık:\s*([\d,.]+)/);
      // The host status bar currently labels total loaded vertex count as "Varlık".
      sample.loadedVertexCount = entityMatch ? Number(entityMatch[1].replace(/\D/g, "")) : 0;
      sample.initialVisibleChunksSettledMs = performance.now() - startedAt;

      await expect(page.locator('button[title="Yakınlaştır (+)"]')).toBeVisible({ timeout: 8_000 });
      sample.hostInteractiveMs = performance.now() - startedAt;
      sample.qualityWarningText = await page.getByTestId("cad-v2-quality-warning").textContent().catch(() => null);
      const skippedMatch = sample.qualityWarningText?.match(/(\d+)\s+parça atlandı/i);
      sample.budgetSkippedChunkCount = skippedMatch ? Number(skippedMatch[1]) : null;

      const canvas = page.locator("#document-studio-shell canvas").first();
      await expect(canvas).toBeVisible({ timeout: 8_000 });
      sample.canvas = await canvas.evaluate((element) => {
        const htmlCanvas = element as HTMLCanvasElement;
        return { width: htmlCanvas.width, height: htmlCanvas.height };
      });
      await page.waitForTimeout(800);
      await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
      sample.twoFrameCheckpointMs = performance.now() - startedAt;
      sample.browserMetrics = await readPageMetrics(page);
      sample.glTelemetry = await page.evaluate(() => {
        const state = (window as unknown as { __cadP00: {
          startedAt: number; firstDrawAt: number | null; firstAcceptedAt: number | null;
          firstDrawAfterFirstAcceptedAt: number | null; drawCalls: number;
          bufferDataCalls: number; bufferDataBytes: number; longTaskSupported: boolean;
          longTasks: Array<{ startTime: number; duration: number }>;
          inputToDrawMs: number[]; inputKinds: string[]; firstContentFrameCaptureError: string | null;
        } }).__cadP00;
        return {
          firstDrawAfterDocumentStartMs: state.firstDrawAt === null ? null : state.firstDrawAt - state.startedAt,
          firstAcceptedAtPerformanceMs: state.firstAcceptedAt,
          firstDrawAfterFirstAcceptedAt: state.firstDrawAfterFirstAcceptedAt,
          drawCalls: state.drawCalls,
          bufferDataCalls: state.bufferDataCalls,
          bufferDataUploadCallBytesEstimate: state.bufferDataBytes,
          longTaskSupported: state.longTaskSupported,
          longTasks: state.longTasks,
          inputToDrawMs: state.inputToDrawMs,
          inputKinds: state.inputKinds,
          firstContentFrameCaptureError: state.firstContentFrameCaptureError,
        };
      });
      sample.chromiumProcessRss = await sampleRss();
      sample.hostResourceEvents = await page.evaluate(() =>
        (window as unknown as { __cadP00: { hostResourceEvents: P00HostResourceEvent[] } }).__cadP00.hostResourceEvents.slice());
      const viewportEvents = sample.hostResourceEvents.filter((event) => event.type === "viewport-snapshot");
      const toViewportSnapshot = (event: P00HostResourceEvent | undefined): P00ViewportSnapshot | undefined => {
        if (!event?.layoutId || !event.cameraState || !event.viewportBBox || event.visibleChunkCount === undefined) return undefined;
        return {
          layoutId: event.layoutId,
          cameraState: event.cameraState,
          viewportBBox: event.viewportBBox,
          visibleChunkCount: event.visibleChunkCount,
        };
      };
      sample.initialViewport = toViewportSnapshot(viewportEvents[0]);
      sample.screenshotViewport = toViewportSnapshot(viewportEvents.at(-1));
      sample.firstContentFrameRaster = await page.evaluate(({ viewportWidthCss, viewportHeightCss }) => {
        const state = (window as unknown as { __cadP00: {
          firstContentFrameCapture: {
            width: number;
            height: number;
            pixels: Uint8Array;
            capturedAtPerformanceMs: number;
            acceptedChunkCountAtCapture: number;
            acceptedChunkIdsAtCapture: string[];
            drawCallCountAtCapture: number;
            framebufferIsDefault: boolean;
          } | null;
        } }).__cadP00;
        const capture = state.firstContentFrameCapture;
        if (!capture) return null;
        const { width, height, pixels } = capture;
        const patchSize = Math.min(8, width, height);
        const backgroundCounts = new Map<string, { color: [number, number, number, number]; count: number }>();
        for (const [left, top] of [[0, 0], [width - patchSize, 0], [0, height - patchSize], [width - patchSize, height - patchSize]]) {
          for (let y = top; y < top + patchSize; y++) {
            for (let x = left; x < left + patchSize; x++) {
              const offset = (y * width + x) * 4;
              const color: [number, number, number, number] = [pixels[offset]!, pixels[offset + 1]!, pixels[offset + 2]!, pixels[offset + 3]!];
              const key = color.join(",");
              const previous = backgroundCounts.get(key);
              backgroundCounts.set(key, { color, count: (previous?.count ?? 0) + 1 });
            }
          }
        }
        const backgroundRgba = Array.from(backgroundCounts.values()).sort((a, b) => b.count - a.count)[0]!.color;
        const cellCounts = new Uint32Array(20 * 20);
        let foregroundPixelCount = 0;
        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
            const offset = (y * width + x) * 4;
            const alpha = pixels[offset + 3]!;
            const delta = Math.max(
              Math.abs(pixels[offset]! - backgroundRgba[0]),
              Math.abs(pixels[offset + 1]! - backgroundRgba[1]),
              Math.abs(pixels[offset + 2]! - backgroundRgba[2]),
            );
            if (alpha === 0 || (delta < 16 && alpha >= 250)) continue;
            foregroundPixelCount++;
            const rasterCssX = (x + 0.5) * viewportWidthCss / width;
            const rasterCssY = (height - y - 0.5) * viewportHeightCss / height;
            const column = Math.min(19, Math.max(0, Math.floor((rasterCssX + 1) / (viewportWidthCss + 2) * 20)));
            const row = Math.min(19, Math.max(0, Math.floor((rasterCssY + 1) / (viewportHeightCss + 2) * 20)));
            cellCounts[row * 20 + column]++;
          }
        }
        const occupiedCellIds = Array.from(cellCounts, (count, cellId) => count >= 3 ? cellId : -1).filter((cellId) => cellId >= 0);
        return {
          width,
          height,
          backgroundRgba,
          foregroundPixelCount,
          occupiedCellCount: occupiedCellIds.length,
          occupiedCellIds,
          cellPixelThreshold: 3,
          colorDeltaThreshold: 16,
          acceptedChunkCountAtCapture: capture.acceptedChunkCountAtCapture,
          acceptedChunkIdsAtCapture: capture.acceptedChunkIdsAtCapture,
          drawCallCountAtCapture: capture.drawCallCountAtCapture,
          capturedAtPerformanceMs: capture.capturedAtPerformanceMs,
          framebufferIsDefault: capture.framebufferIsDefault,
        };
      }, {
        viewportWidthCss: sample.initialViewport?.cameraState.width ?? 1440,
        viewportHeightCss: sample.initialViewport?.cameraState.height ?? 852,
      });
      if (!sample.firstContentFrameRaster) throw new Error(`P00 ${label} has no first-content-frame WebGL readback.`);
      expect(sample.firstContentFrameRaster.framebufferIsDefault).toBe(true);
      expect(sample.firstContentFrameRaster.acceptedChunkCountAtCapture).toBeGreaterThan(0);
      const canvasScreenshot = await captureP00CanvasOnlyScreenshot(page, canvas);
      sample.canvasSha256 = sha256(canvasScreenshot);
      sample.canvasCssBox = await canvas.evaluate((element) => {
        const toBox = (node: Element | null) => {
          if (!node) return null;
          const rect = node.getBoundingClientRect();
          return { left: rect.left, top: rect.top, width: rect.width, height: rect.height };
        };
        return {
          canvas: toBox(element)!,
          overlay: toBox(document.querySelector('[aria-label="CAD V2 Çizim Etkileşim Alanı"]')),
          devicePixelRatio: window.devicePixelRatio,
        };
      });
      canvasScreenshots.set(label, canvasScreenshot);
      return sample;
    };

    try {
      const first = await openAndSample("first-open", false);
      const warm = await openAndSample("warm-reopen", true);
      const warmPostOpenSnapshot = {
        apiRequestCount: warm.apiRequests.length,
        chunkRequestCount: warm.chunkIds.length,
        chunkBytes: warm.chunkBytes,
      };

      const input = page.getByLabel("CAD V2 Çizim Etkileşim Alanı");
      const zoomIn = page.locator('button[title="Yakınlaştır (+)"]');
      const zoomOut = page.locator('button[title="Uzaklaştır (-)"]');
      const interactionNetworkSamples: Array<{
        action: string;
        apiRequestCount: number;
        chunkRequestCount: number;
        uniqueChunkCount: number;
        requestsForWarmFetchedChunks: number;
        bytesForWarmFetchedChunks: number;
        chunkBytes: number;
        chunkIdSetSha256: string;
        resourceDecisionCounts: {
          loadStarts: number;
          previouslyRejectedRetry: number;
          previouslyRejectedRetryAccepted: number;
          previouslyRejectedRetryRejected: number;
          acceptedThenEvictedRefetch: number;
          acceptedThenEvictedRefetchAccepted: number;
          acceptedThenEvictedRefetchRejected: number;
          previouslyAcceptedWithoutObservedEviction: number;
          firstOrUnknown: number;
          acceptedOutcomes: number;
          rejectedOutcomes: number;
          staleVisibilityOutcomes: number;
          evictionCountByReason: Record<string, number>;
          outcomesWithoutObservedStart: number;
        };
      }> = [];
      const warmFetchedChunkIds = new Set(warm.chunkIds);
      const warmChunkSize = new Map(Array.from(warmFetchedChunkIds, (chunkId) => [chunkId, compiled.chunks.get(chunkId)?.byteLength ?? 0]));
      const resourceStateByChunk = new Map<string, "accepted" | "rejected" | "evicted" | "stale-visibility">();
      const observedLoadIds = new Set<number>();
      const interactionOriginByLoadId = new Map<number, "rejected" | "evicted" | "accepted" | "first">();
      const applyResourceEvents = (events: P00HostResourceEvent[], counts?: (typeof interactionNetworkSamples)[number]["resourceDecisionCounts"]) => {
        for (const event of events) {
          if (event.type === "chunk-load-start" && event.chunkId) {
            const previousState = resourceStateByChunk.get(event.chunkId);
            if (counts) {
              counts.loadStarts++;
              if (previousState === "rejected") counts.previouslyRejectedRetry++;
              else if (previousState === "evicted") counts.acceptedThenEvictedRefetch++;
              else if (previousState === "accepted") counts.previouslyAcceptedWithoutObservedEviction++;
              else counts.firstOrUnknown++;
            }
            if (typeof event.loadId === "number") {
              observedLoadIds.add(event.loadId);
              if (counts) {
                interactionOriginByLoadId.set(
                  event.loadId,
                  previousState === "rejected" || previousState === "evicted" ||
                    previousState === "accepted" ? previousState : "first",
                );
              }
            }
          } else if (event.type === "chunk-load-outcome" && event.chunkId) {
            if (counts && typeof event.loadId === "number" && !observedLoadIds.has(event.loadId)) {
              counts.outcomesWithoutObservedStart++;
            }
            const interactionOrigin = typeof event.loadId === "number"
              ? interactionOriginByLoadId.get(event.loadId)
              : undefined;
            if (typeof event.loadId === "number") {
              observedLoadIds.delete(event.loadId);
              interactionOriginByLoadId.delete(event.loadId);
            }
            if (event.status === "accepted") {
              if (counts) counts.acceptedOutcomes++;
              if (counts && interactionOrigin === "rejected") counts.previouslyRejectedRetryAccepted++;
              if (counts && interactionOrigin === "evicted") counts.acceptedThenEvictedRefetchAccepted++;
              resourceStateByChunk.set(event.chunkId, "accepted");
            } else if (event.status === "rejected") {
              if (counts) counts.rejectedOutcomes++;
              if (counts && interactionOrigin === "rejected") counts.previouslyRejectedRetryRejected++;
              if (counts && interactionOrigin === "evicted") counts.acceptedThenEvictedRefetchRejected++;
              resourceStateByChunk.set(event.chunkId, "rejected");
            } else if (event.status === "stale-visibility") {
              if (counts) counts.staleVisibilityOutcomes++;
              resourceStateByChunk.set(event.chunkId, "stale-visibility");
            }
          } else if (event.type === "chunk-evicted" && event.chunkId) {
            if (counts) {
              const reason = event.reason ?? "unspecified";
              counts.evictionCountByReason[reason] = (counts.evictionCountByReason[reason] ?? 0) + 1;
            }
            if (resourceStateByChunk.get(event.chunkId) === "accepted") resourceStateByChunk.set(event.chunkId, "evicted");
          }
        }
      };
      applyResourceEvents(warm.hostResourceEvents ?? []);
      const warmHostEventCount = warm.hostResourceEvents?.length ?? 0;
      const hostEventsAtInteractionStart = await page.evaluate(() =>
        (window as unknown as { __cadP00: { hostResourceEvents: P00HostResourceEvent[] } }).__cadP00.hostResourceEvents.slice());
      applyResourceEvents(hostEventsAtInteractionStart.slice(warmHostEventCount));
      const captureTraffic = async (action: string, before: { apiRequests: number; chunkRequests: number; chunkBytes: number; resourceEventCount: number }) => {
        await page.waitForTimeout(750);
        let previousCount = warm.chunkIds.length;
        let unchangedSamples = 0;
        for (let attempt = 0; attempt < 35 && unchangedSamples < 10; attempt++) {
          await page.waitForTimeout(100);
          const count = warm.chunkIds.length;
          if (count === previousCount) unchangedSamples++;
          else unchangedSamples = 0;
          previousCount = count;
        }
        const chunkIds = warm.chunkIds.slice(before.chunkRequests);
        const newResourceEvents = await page.evaluate((offset) =>
          (window as unknown as { __cadP00: { hostResourceEvents: P00HostResourceEvent[] } }).__cadP00.hostResourceEvents.slice(offset),
        before.resourceEventCount);
        const distinctIds = Array.from(new Set(chunkIds)).sort();
        let requestsForWarmFetchedChunks = 0;
        let bytesForWarmFetchedChunks = 0;
        for (const chunkId of chunkIds) {
          if (warmFetchedChunkIds.has(chunkId)) {
            requestsForWarmFetchedChunks++;
            bytesForWarmFetchedChunks += warmChunkSize.get(chunkId) ?? 0;
          }
        }
        const resourceDecisionCounts = {
          loadStarts: 0,
          previouslyRejectedRetry: 0,
          previouslyRejectedRetryAccepted: 0,
          previouslyRejectedRetryRejected: 0,
          acceptedThenEvictedRefetch: 0,
          acceptedThenEvictedRefetchAccepted: 0,
          acceptedThenEvictedRefetchRejected: 0,
          previouslyAcceptedWithoutObservedEviction: 0,
          firstOrUnknown: 0,
          acceptedOutcomes: 0,
          rejectedOutcomes: 0,
          staleVisibilityOutcomes: 0,
          evictionCountByReason: {} as Record<string, number>,
          outcomesWithoutObservedStart: 0,
        };
        applyResourceEvents(newResourceEvents, resourceDecisionCounts);
        interactionNetworkSamples.push({
          action,
          apiRequestCount: warm.apiRequests.length - before.apiRequests,
          chunkRequestCount: chunkIds.length,
          uniqueChunkCount: distinctIds.length,
          requestsForWarmFetchedChunks,
          bytesForWarmFetchedChunks,
          chunkBytes: warm.chunkBytes - before.chunkBytes,
          chunkIdSetSha256: sha256(distinctIds.join("\n")),
          resourceDecisionCounts,
        });
      };
      const takeInteractionSnapshot = async () => ({
        apiRequests: warm.apiRequests.length,
        chunkRequests: warm.chunkIds.length,
        chunkBytes: warm.chunkBytes,
        resourceEventCount: await page.evaluate(() =>
          (window as unknown as { __cadP00: { hostResourceEvents: P00HostResourceEvent[] } }).__cadP00.hostResourceEvents.length),
      });
      await expect(zoomIn).toBeVisible({ timeout: 8_000 });
      await expect(zoomOut).toBeVisible({ timeout: 8_000 });
      const interactionStartSnapshot = {
        apiRequestCount: warm.apiRequests.length,
        chunkRequestCount: warm.chunkIds.length,
        chunkBytes: warm.chunkBytes,
        resourceEventCount: hostEventsAtInteractionStart.length,
      };
      for (let i = 0; i < 4; i++) {
        const before = await page.evaluate(() => (window as any).__cadP00.inputToDrawMs.length);
        const trafficBefore = await takeInteractionSnapshot();
        await zoomIn.click({ timeout: 8_000 });
        await expect.poll(() => page.evaluate(() => (window as any).__cadP00.inputToDrawMs.length), { timeout: 5_000 }).toBeGreaterThan(before);
        await captureTraffic(`zoom-in-${i + 1}`, trafficBefore);
      }
      for (let i = 0; i < 4; i++) {
        const before = await page.evaluate(() => (window as any).__cadP00.inputToDrawMs.length);
        const trafficBefore = await takeInteractionSnapshot();
        await zoomOut.click({ timeout: 8_000 });
        await expect.poll(() => page.evaluate(() => (window as any).__cadP00.inputToDrawMs.length), { timeout: 5_000 }).toBeGreaterThan(before);
        await captureTraffic(`zoom-out-${i + 1}`, trafficBefore);
      }
      const inputBox = await input.boundingBox();
      if (!inputBox) throw new Error("P00 camera input overlay bounding box is unavailable");
      for (let i = 0; i < 3; i++) {
        const before = await page.evaluate(() => (window as any).__cadP00.inputToDrawMs.length);
        const trafficBefore = await takeInteractionSnapshot();
        const x = inputBox.x + inputBox.width * 0.5;
        const y = inputBox.y + inputBox.height * 0.5;
        await page.mouse.move(x, y);
        await page.mouse.down();
        await page.mouse.move(x + 34, y + 22, { steps: 3 });
        await page.mouse.up();
        await expect.poll(() => page.evaluate(() => (window as any).__cadP00.inputToDrawMs.length), { timeout: 5_000 }).toBeGreaterThan(before);
        await captureTraffic(`pan-${i + 1}`, trafficBefore);
      }
      const wheelBurstTrafficBefore = await takeInteractionSnapshot();
      const drawFrameIntervalsMs = await page.evaluate(async () => {
        const state = (window as any).__cadP00;
        const input = document.querySelector('[aria-label="CAD V2 Çizim Etkileşim Alanı"]');
        if (!input) throw new Error("P00 wheel burst could not find the CAD interaction surface.");
        const rect = input.getBoundingClientRect();
        state.measureDrawFrames = true;
        state.previousDrawFrameAt = null;
        state.measuredRafTimestamp = null;
        state.drawOccurredDuringMeasuredRaf = false;
        state.drawCallsDuringMeasuredRaf = 0;
        state.multiDrawCallsDuringMeasuredRaf = 0;
        state.measuredDrawCallCounts.length = 0;
        state.measuredDirectDrawCallCounts.length = 0;
        state.measuredMultiDrawCallCounts.length = 0;
        state.drawFrameIntervalsMs.length = 0;
        state.drawFrameCallbackDurationsMs.length = 0;
        for (let index = 0; index < 60; index++) {
          input.dispatchEvent(new WheelEvent("wheel", {
            deltaY: index % 2 === 0 ? 120 : -120,
            clientX: rect.left + rect.width / 2,
            clientY: rect.top + rect.height / 2,
            bubbles: true,
            cancelable: true,
          }));
          await new Promise((resolve) => window.setTimeout(resolve, 8));
        }
        await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
        state.measureDrawFrames = false;
        return {
          intervalsMs: state.drawFrameIntervalsMs as number[],
          callbackDurationsMs: state.drawFrameCallbackDurationsMs as number[],
          drawCallsPerFrame: state.measuredDrawCallCounts as number[],
          directDrawCallsPerFrame: state.measuredDirectDrawCallCounts as number[],
          multiDrawCallsPerFrame: state.measuredMultiDrawCallCounts as number[],
        };
      });
      await captureTraffic("wheel-burst", wheelBurstTrafficBefore);

      const interactions = await page.evaluate((drawFrameMeasurements) => {
        const state = (window as unknown as { __cadP00: {
          inputToDrawMs: number[]; inputKinds: string[]; longTasks: Array<{ startTime: number; duration: number }>;
        } }).__cadP00;
        return { inputToDrawMs: state.inputToDrawMs, inputKinds: state.inputKinds, longTasks: state.longTasks,
          drawFrameIntervalsMs: drawFrameMeasurements.intervalsMs,
          drawFrameCallbackDurationsMs: drawFrameMeasurements.callbackDurationsMs,
          drawCallsPerFrame: drawFrameMeasurements.drawCallsPerFrame,
          directDrawCallsPerFrame: drawFrameMeasurements.directDrawCallsPerFrame,
          multiDrawCallsPerFrame: drawFrameMeasurements.multiDrawCallsPerFrame };
      }, drawFrameIntervalsMs);
      const firstScreenshot = canvasScreenshots.get(first.label);
      const warmScreenshot = canvasScreenshots.get(warm.label);
      if (!firstScreenshot || !warmScreenshot) throw new Error("P00 cold/warm canvas screenshots were not retained for post-interaction raster analysis.");
      const rasterViewport = (sample: RunSample) => {
        const camera = (sample.screenshotViewport ?? sample.initialViewport)?.cameraState;
        if (!camera) throw new Error(`P00 ${sample.label} screenshot is missing a camera snapshot.`);
        return { widthCss: camera.width, heightCss: camera.height, paddingCssPixels: 1 };
      };
      const browserReleaseRepeatCount = Number(process.env.CAD_V2_L11_BROWSER_RELEASE_REPEAT_COUNT ?? "0");
      let browserReleaseBenchmark: null | {
        status: "PASS" | "FAIL";
        repeatCountPerCondition: number;
        fixtureMode: string;
        coldHostOpen: {
          p50Ms: number; p95Ms: number; maxMs: number; nonEmptyRasterRepeats: number;
          interactionFrameIntervalsMs: { sampleCount: number; p50: number | null; p95: number | null; max: number | null };
          interactionFrameP95Ms: { p50: number | null; p95: number | null; max: number | null; runsAbove20Ms: number };
          interactionInputToDrawMs: { sampleCount: number; p50: number | null; p95: number | null; max: number | null };
          interactionInputP95Ms: { p50: number | null; p95: number | null; max: number | null; runsAbove100Ms: number };
          interactionCallbackP95Ms: { sampleCount: number; p50: number | null; p95: number | null; max: number | null };
          interactionLongTasks: { count: number; maxDurationMs: number };
          firstAcceptedDrawReadback: { nonEmptyRepeats: number; medianAcceptedToReadbackMs: number | null };
          interactionLoadsTerminal: boolean;
        };
        warmHostReopen: {
          p50Ms: number; p95Ms: number; maxMs: number; nonEmptyRasterRepeats: number;
          interactionFrameIntervalsMs: { sampleCount: number; p50: number | null; p95: number | null; max: number | null };
          interactionFrameP95Ms: { p50: number | null; p95: number | null; max: number | null; runsAbove20Ms: number };
          interactionInputToDrawMs: { sampleCount: number; p50: number | null; p95: number | null; max: number | null };
          interactionInputP95Ms: { p50: number | null; p95: number | null; max: number | null; runsAbove100Ms: number };
          interactionCallbackP95Ms: { sampleCount: number; p50: number | null; p95: number | null; max: number | null };
          interactionLongTasks: { count: number; maxDurationMs: number };
          firstAcceptedDrawReadback: { nonEmptyRepeats: number; medianAcceptedToReadbackMs: number | null };
          interactionLoadsTerminal: boolean;
        };
        fetchedSetAndCanvasRepeatability: boolean;
      } = null;
      if (browserReleaseRepeatCount > 0) {
        expect(Number.isInteger(browserReleaseRepeatCount) && browserReleaseRepeatCount >= 30,
          "L11 browser release benchmark requires at least 30 complete repeats per condition")
          .toBe(true);
        const coldHostOpenMs: number[] = [];
        const warmHostReopenMs: number[] = [];
        const fetchedSetHashes: string[] = [];
        const canvasHashes: string[] = [];
        const coldInteractionSamples: Array<{
          frameP95Ms: number | null; inputP95Ms: number | null; callbackP95Ms: number | null;
          firstReadbackForegroundPixels: number; acceptedToReadbackMs: number | null; loadsTerminal: boolean;
          frameIntervalsMs: number[]; inputToDrawMs: number[]; callbackDurationsMs: number[];
          longTaskCount: number; maxLongTaskMs: number;
        }> = [];
        const warmInteractionSamples: typeof coldInteractionSamples = [];
        const repeatCounts = { coldHostOpen: 0, warmHostReopen: 0 };
        const releaseQuantile = (values: number[], q: number) => {
          const finite = values.filter(Number.isFinite).sort((a, b) => a - b);
          return finite.length === 0 ? null : finite[Math.min(finite.length - 1, Math.ceil(q * finite.length) - 1)];
        };
        const summarizeReleaseDistribution = (values: Array<number | null>) => {
          const finite = values.filter((value): value is number => typeof value === "number" && Number.isFinite(value));
          return {
            p50: releaseQuantile(finite, 0.5),
            p95: releaseQuantile(finite, 0.95),
            max: finite.length > 0 ? Math.max(...finite) : null,
          };
        };
        const measureReleaseInteraction = async (firstReadbackForegroundPixels: number) => {
          const startEventCount = await page.evaluate(() => (window as any).__cadP00.hostResourceEvents.length as number);
          const inputStart = await page.evaluate(() => (window as any).__cadP00.inputToDrawMs.length as number);
          const zoomIn = page.locator('button[title="Yakınlaştır (+)"]');
          const zoomOut = page.locator('button[title="Uzaklaştır (-)"]');
          await expect(zoomIn, "L11 release interaction requires a visible zoom-in control").toBeVisible();
          await expect(zoomOut, "L11 release interaction requires a visible zoom-out control").toBeVisible();
          await zoomIn.click();
          await expect.poll(() => page.evaluate(() => (window as any).__cadP00.inputToDrawMs.length), { timeout: 5_000 })
            .toBeGreaterThan(inputStart);
          const afterZoomIn = await page.evaluate(() => (window as any).__cadP00.inputToDrawMs.length as number);
          await zoomOut.click();
          await expect.poll(() => page.evaluate(() => (window as any).__cadP00.inputToDrawMs.length), { timeout: 5_000 })
            .toBeGreaterThan(afterZoomIn);
          const interactionMetrics = await page.evaluate(async (firstInputIndex) => {
            const state = (window as any).__cadP00;
            const longTaskStart = state.longTasks.length;
            state.measureDrawFrames = true;
            state.previousDrawFrameAt = null;
            state.measuredRafTimestamp = null;
            state.drawOccurredDuringMeasuredRaf = false;
            state.drawCallsDuringMeasuredRaf = 0;
            state.multiDrawCallsDuringMeasuredRaf = 0;
            state.measuredDrawCallCounts.length = 0;
            state.measuredDirectDrawCallCounts.length = 0;
            state.measuredMultiDrawCallCounts.length = 0;
            state.drawFrameIntervalsMs.length = 0;
            state.drawFrameCallbackDurationsMs.length = 0;
            const input = document.querySelector('[aria-label="CAD V2 Çizim Etkileşim Alanı"]');
            if (!input) throw new Error("L11 release interaction cannot find the CAD surface.");
            const rect = input.getBoundingClientRect();
            for (let index = 0; index < 60; index++) {
              input.dispatchEvent(new WheelEvent("wheel", {
                deltaY: index % 2 === 0 ? 120 : -120,
                clientX: rect.left + rect.width / 2,
                clientY: rect.top + rect.height / 2,
                bubbles: true,
                cancelable: true,
              }));
              await new Promise((resolve) => window.setTimeout(resolve, 8));
            }
            await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
            state.measureDrawFrames = false;
            return {
              frameIntervalsMs: [...state.drawFrameIntervalsMs] as number[],
              callbackDurationsMs: [...state.drawFrameCallbackDurationsMs] as number[],
              inputToDrawMs: state.inputToDrawMs.slice(firstInputIndex) as number[],
              newLongTaskDurationsMs: state.longTasks.slice(longTaskStart).map((task: { duration: number }) => task.duration) as number[],
              firstAcceptedAt: state.firstAcceptedAt as number | null,
              firstContentReadbackAt: state.firstContentFrameCapture?.capturedAtPerformanceMs as number | undefined,
            };
          }, inputStart);
          const frameP95Ms = releaseQuantile(interactionMetrics.frameIntervalsMs, 0.95);
          const inputP95Ms = releaseQuantile(interactionMetrics.inputToDrawMs, 0.95);
          const callbackP95Ms = releaseQuantile(interactionMetrics.callbackDurationsMs, 0.95);
          expect(frameP95Ms, "L11 release interaction must produce CAD draw-frame samples").not.toBeNull();
          expect(inputP95Ms, "L11 release interaction must produce input-to-draw samples").not.toBeNull();
          const acceptedToReadbackMs = typeof interactionMetrics.firstAcceptedAt === "number" &&
            typeof interactionMetrics.firstContentReadbackAt === "number"
            ? interactionMetrics.firstContentReadbackAt - interactionMetrics.firstAcceptedAt
            : null;
          let stableSamples = 0;
          let previousEventCount = -1;
          let pendingHostLoads: number[] = [];
          for (let attempt = 0; attempt < 60 && stableSamples < 5; attempt++) {
            const state = await page.evaluate(() => {
              const events = (window as any).__cadP00.hostResourceEvents as P00HostResourceEvent[];
              const started = new Set<number>();
              const completed = new Set<number>();
              for (const event of events) {
                if (typeof event.loadId !== "number") continue;
                if (event.type === "chunk-load-start") started.add(event.loadId);
                else if (event.type === "chunk-load-outcome") completed.add(event.loadId);
              }
              return {
                eventCount: events.length,
                pendingLoadIds: Array.from(started).filter((loadId) => !completed.has(loadId)),
              };
            });
            pendingHostLoads = state.pendingLoadIds;
            const pendingRoutes = activeRun?.pendingChunkResponses ?? 0;
            if (state.eventCount === previousEventCount && pendingRoutes === 0 && pendingHostLoads.length === 0) stableSamples++;
            else stableSamples = 0;
            previousEventCount = state.eventCount;
            await page.waitForTimeout(100);
          }
          const interactionEvents = await page.evaluate((offset) =>
            (window as any).__cadP00.hostResourceEvents.slice(offset) as P00HostResourceEvent[], startEventCount);
          const interactionStarts = interactionEvents.filter((event) => event.type === "chunk-load-start").length;
          const interactionOutcomes = interactionEvents.filter((event) => event.type === "chunk-load-outcome").length;
          const loadsTerminal = stableSamples >= 5 && pendingHostLoads.length === 0 &&
            (activeRun?.pendingChunkResponses ?? 0) === 0 && interactionStarts === interactionOutcomes;
          expect(loadsTerminal, "L11 release interaction requests must settle with terminal host outcomes").toBe(true);
          return {
            frameP95Ms,
            inputP95Ms,
            callbackP95Ms,
            firstReadbackForegroundPixels,
            acceptedToReadbackMs,
            loadsTerminal,
            frameIntervalsMs: interactionMetrics.frameIntervalsMs,
            inputToDrawMs: interactionMetrics.inputToDrawMs,
            callbackDurationsMs: interactionMetrics.callbackDurationsMs,
            longTaskCount: interactionMetrics.newLongTaskDurationsMs.length,
            maxLongTaskMs: Math.max(0, ...interactionMetrics.newLongTaskDurationsMs),
          };
        };
        const measureReleaseRepeat = async (label: "first-open" | "warm-reopen", reopen: boolean): Promise<number> => {
          const sample = await openAndSample(label, reopen, 1, false);
          const screenshot = canvasScreenshots.get(label);
          if (!screenshot) throw new Error(`L11 repeat ${label} has no settled canvas screenshot.`);
          const raster = await measureP00CanvasRasterOccupancy(page, screenshot, [20], rasterViewport(sample));
          expect(sample.initialChunkRequestCount, `L11 ${label} must request all viewport-scene chunks`).toBeGreaterThan(0);
          expect(raster.foregroundPixelCount, `L11 ${label} settled canvas must contain visible ink`).toBeGreaterThan(0);
          expect(raster.occupiedCellCount, `L11 ${label} settled canvas must occupy viewport cells`).toBeGreaterThan(0);
          const outcomes = (sample.initialHostResourceEvents ?? []).filter((event) =>
            event.type === "chunk-load-outcome" &&
            (event.status === "accepted" || event.status === "rejected" || event.status === "stale-visibility"));
          expect(outcomes.length, `L11 ${label} all initial chunk requests must have terminal outcomes`)
            .toBe(sample.initialChunkRequestCount);
          const accepted = outcomes.filter((event) => event.status === "accepted");
          const rejected = outcomes.filter((event) => event.status === "rejected");
          for (const event of accepted) {
            expect(event.cpuResidentBytes, `L11 ${label} ${event.chunkId} accepted CPU estimate`).toBeLessThanOrEqual(event.cpuBudgetBytes!);
            expect(event.gpuBufferBytesEstimate, `L11 ${label} ${event.chunkId} accepted GPU estimate`).toBeLessThanOrEqual(event.gpuBudgetBytes!);
          }
          if (rejected.length > 0) expect(sample.qualityWarningText).toMatch(/kısmi/i);
          const firstReadback = sample.firstContentFrameRaster;
          if (!firstReadback) throw new Error(`L11 ${label} has no first accepted-draw framebuffer diagnostic.`);
          const interactionSample = await measureReleaseInteraction(firstReadback.foregroundPixelCount);
          if (label === "first-open") coldInteractionSamples.push(interactionSample);
          else warmInteractionSamples.push(interactionSample);
          fetchedSetHashes.push(sha256((sample.initialChunkIds ?? []).join("\n")));
          canvasHashes.push(sample.canvasSha256 ?? "");
          if (label === "first-open") repeatCounts.coldHostOpen++;
          else repeatCounts.warmHostReopen++;
          return sample.initialVisibleChunksSettledMs ?? Number.NaN;
        };
        for (let repeat = 0; repeat < browserReleaseRepeatCount; repeat++) {
          coldHostOpenMs.push(await measureReleaseRepeat("first-open", false));
          warmHostReopenMs.push(await measureReleaseRepeat("warm-reopen", true));
        }
        const summarizeReleaseTimes = (values: number[], rasterRepeats: number) => {
          const sorted = [...values].sort((a, b) => a - b);
          return {
            p50Ms: sorted[Math.floor((sorted.length - 1) * 0.5)]!,
            p95Ms: sorted[Math.ceil((sorted.length - 1) * 0.95)]!,
            maxMs: sorted.at(-1)!,
            nonEmptyRasterRepeats: rasterRepeats,
          };
        };
        const summarizeReleaseInteractions = (samples: typeof coldInteractionSamples) => {
          const frameIntervals = summarizeReleaseDistribution(samples.flatMap((sample) => sample.frameIntervalsMs));
          const inputToDraw = summarizeReleaseDistribution(samples.flatMap((sample) => sample.inputToDrawMs));
          const frameP95 = summarizeReleaseDistribution(samples.map((sample) => sample.frameP95Ms));
          const inputP95 = summarizeReleaseDistribution(samples.map((sample) => sample.inputP95Ms));
          const callbackP95 = summarizeReleaseDistribution(samples.map((sample) => sample.callbackP95Ms));
          const callbackDurations = summarizeReleaseDistribution(samples.flatMap((sample) => sample.callbackDurationsMs));
          const readbackDelays = samples
            .map((sample) => sample.acceptedToReadbackMs)
            .filter((value): value is number => typeof value === "number" && Number.isFinite(value));
          return {
            interactionFrameIntervalsMs: {
              sampleCount: samples.reduce((total, sample) => total + sample.frameIntervalsMs.length, 0),
              ...frameIntervals,
            },
            interactionFrameP95Ms: {
              ...frameP95,
              runsAbove20Ms: samples.filter((sample) => sample.frameP95Ms === null || sample.frameP95Ms > 20).length,
            },
            interactionInputToDrawMs: {
              sampleCount: samples.reduce((total, sample) => total + sample.inputToDrawMs.length, 0),
              ...inputToDraw,
            },
            interactionInputP95Ms: {
              ...inputP95,
              runsAbove100Ms: samples.filter((sample) => sample.inputP95Ms === null || sample.inputP95Ms > 100).length,
            },
            interactionCallbackP95Ms: { ...callbackP95, sampleCount: samples.length },
            interactionLongTasks: {
              count: samples.reduce((total, sample) => total + sample.longTaskCount, 0),
              maxDurationMs: Math.max(0, ...samples.map((sample) => sample.maxLongTaskMs)),
            },
            firstAcceptedDrawReadback: {
              nonEmptyRepeats: samples.filter((sample) => sample.firstReadbackForegroundPixels > 0).length,
              medianAcceptedToReadbackMs: releaseQuantile(readbackDelays, 0.5),
            },
            interactionLoadsTerminal: samples.length === browserReleaseRepeatCount && samples.every((sample) => sample.loadsTerminal),
          };
        };
        const coldInteractionSummary = summarizeReleaseInteractions(coldInteractionSamples);
        const warmInteractionSummary = summarizeReleaseInteractions(warmInteractionSamples);
        const interactionAcceptancePass =
          coldInteractionSummary.interactionFrameP95Ms.runsAbove20Ms === 0 &&
          warmInteractionSummary.interactionFrameP95Ms.runsAbove20Ms === 0 &&
          coldInteractionSummary.interactionInputP95Ms.runsAbove100Ms === 0 &&
          warmInteractionSummary.interactionInputP95Ms.runsAbove100Ms === 0 &&
          coldInteractionSummary.interactionLoadsTerminal &&
          warmInteractionSummary.interactionLoadsTerminal;
        browserReleaseBenchmark = {
          status: interactionAcceptancePass ? "PASS" : "FAIL",
          repeatCountPerCondition: browserReleaseRepeatCount,
          fixtureMode: "R001 compiled once into an isolated in-memory route fixture; each repeat remounts a fresh host against that immutable scene, verifies non-empty settled raster, then measures a 60-event alternating wheel-zoom interaction. Settled timing excludes cold source fetch/compile; accepted-draw readback is diagnostic and not a compositor-presented first meaningful frame.",
          coldHostOpen: {
            ...summarizeReleaseTimes(coldHostOpenMs, repeatCounts.coldHostOpen),
            ...coldInteractionSummary,
          },
          warmHostReopen: {
            ...summarizeReleaseTimes(warmHostReopenMs, repeatCounts.warmHostReopen),
            ...warmInteractionSummary,
          },
          fetchedSetAndCanvasRepeatability: new Set(fetchedSetHashes).size === 1 && new Set(canvasHashes).size === 1,
        };
        expect(browserReleaseBenchmark.fetchedSetAndCanvasRepeatability,
          "L11 30-run browser sample must keep the same fetched set and settled canvas")
          .toBe(true);
        console.log(`F08 L11 browser release benchmark: ${JSON.stringify(browserReleaseBenchmark)}`);
        expect(browserReleaseBenchmark.status,
          "L11 30-run cold and warm browser release interactions must meet desktop draw p95, input p95, and terminal request criteria")
          .toBe("PASS");
      }
      first.rasterOccupancy = await measureP00CanvasRasterOccupancy(page, firstScreenshot, [5, 10, 20], rasterViewport(first));
      warm.rasterOccupancy = await measureP00CanvasRasterOccupancy(page, warmScreenshot, [5, 10, 20], rasterViewport(warm));
      const quantile = (values: number[], q: number) => {
        if (values.length === 0) return null;
        const sorted = [...values].sort((a, b) => a - b);
        return sorted[Math.min(sorted.length - 1, Math.ceil(q * sorted.length) - 1)];
      };
      const drawFrameP95Ms = quantile(interactions.drawFrameIntervalsMs, 0.95);
      const drawFrameCallbackDurationP95Ms = quantile(interactions.drawFrameCallbackDurationsMs, 0.95);
      const summarizeResourceAcceptance = (sample: RunSample) => {
        const outcomes = (sample.hostResourceEvents ?? []).filter((event) => event.type === "chunk-load-outcome");
        const accepted = outcomes.filter((event) => event.status === "accepted");
        const rejected = outcomes.filter((event) => event.status === "rejected");
        const sumCost = (events: P00HostResourceEvent[], key: keyof P00HostResourceEvent) =>
          events.reduce((total, event) => total + (typeof event[key] === "number" ? event[key] as number : 0), 0);
        return {
          requestCount: sample.initialChunkRequestCount,
          outcomeCount: outcomes.length,
          acceptedCount: accepted.length,
          rejectedCount: rejected.length,
          staleCount: outcomes.filter((event) => event.status === "stale-visibility").length,
          rejectionResources: rejected.reduce<Record<string, number>>((counts, event) => {
            for (const resource of event.rejectionResources ?? []) counts[resource] = (counts[resource] ?? 0) + 1;
            return counts;
          }, {}),
          acceptedVertexCount: accepted.reduce((total, event) => total + (event.chunkVertexCount ?? 0), 0),
          rejectedVertexCount: rejected.reduce((total, event) => total + (event.chunkVertexCount ?? 0), 0),
          acceptedCosts: {
            geometryCpuBytesAdded: sumCost(accepted, "geometryCpuBytesAdded"),
            incomingUnpackedCpuBytes: sumCost(accepted, "incomingUnpackedCpuBytes"),
            candidateRefinementSourceBytes: sumCost(accepted, "candidateRefinementSourceBytes"),
            sharedRendererSourceBytes: sumCost(accepted, "sharedRendererSourceBytes"),
            candidateUniqueRefinementSourceBytes: sumCost(accepted, "candidateUniqueRefinementSourceBytes"),
            retainedRefinementSourceBytesIfAccepted: sumCost(accepted, "retainedRefinementSourceBytesIfAccepted"),
            candidateCpuBytes: sumCost(accepted, "candidateCpuBytes"),
            maxCandidateCpuBytes: Math.max(0, ...accepted.map((event) => event.candidateCpuBytes ?? 0)),
          },
          rejectedCosts: {
            geometryCpuBytesAdded: sumCost(rejected, "geometryCpuBytesAdded"),
            incomingUnpackedCpuBytes: sumCost(rejected, "incomingUnpackedCpuBytes"),
            candidateRefinementSourceBytes: sumCost(rejected, "candidateRefinementSourceBytes"),
            sharedRendererSourceBytes: sumCost(rejected, "sharedRendererSourceBytes"),
            candidateUniqueRefinementSourceBytes: sumCost(rejected, "candidateUniqueRefinementSourceBytes"),
            retainedRefinementSourceBytesIfAccepted: sumCost(rejected, "retainedRefinementSourceBytesIfAccepted"),
            candidateCpuBytes: sumCost(rejected, "candidateCpuBytes"),
            maxCandidateCpuBytes: Math.max(0, ...rejected.map((event) => event.candidateCpuBytes ?? 0)),
          },
          maxCpuResidentBytes: Math.max(0, ...outcomes.map((event) => event.cpuResidentBytes ?? 0)),
          maxGpuBufferBytesEstimate: Math.max(0, ...outcomes.map((event) => event.gpuBufferBytesEstimate ?? 0)),
          cpuBudgetBytes: outcomes.find((event) => Number.isFinite(event.cpuBudgetBytes))?.cpuBudgetBytes ?? null,
          gpuBudgetBytes: outcomes.find((event) => Number.isFinite(event.gpuBudgetBytes))?.gpuBudgetBytes ?? null,
        };
      };
      console.log(`F08 P00 traversal raster hashes: ${JSON.stringify({
        firstOpen: first.canvasSha256,
        warmReopen: warm.canvasSha256,
        baseline: "f678aa8078b1367b0423e845cc2b4e3176c23858b2d1d7276ef032cc8f86fad0",
      })}`);
      console.log(`F08 P00 resource acceptance before timing gate: ${JSON.stringify({
        firstOpen: {
          loadedVertexCount: first.loadedVertexCount,
          budgetSkippedChunkCount: first.budgetSkippedChunkCount,
          qualityWarningText: first.qualityWarningText,
          initialChunkRequestCount: first.initialChunkRequestCount,
          initialChunkBytes: first.initialChunkBytes,
          initialVisibleChunksSettledMs: first.initialVisibleChunksSettledMs,
          resourceAcceptance: summarizeResourceAcceptance(first),
        },
        warmReopen: {
          loadedVertexCount: warm.loadedVertexCount,
          budgetSkippedChunkCount: warm.budgetSkippedChunkCount,
          qualityWarningText: warm.qualityWarningText,
          initialChunkRequestCount: warm.initialChunkRequestCount,
          initialChunkBytes: warm.initialChunkBytes,
          initialVisibleChunksSettledMs: warm.initialVisibleChunksSettledMs,
          resourceAcceptance: summarizeResourceAcceptance(warm),
        },
      })}`);
      console.log(`F08 P00 CAD draw frame burst: ${JSON.stringify({
        sampleCount: interactions.drawFrameIntervalsMs.length,
        p50Ms: quantile(interactions.drawFrameIntervalsMs, 0.5),
        p95Ms: drawFrameP95Ms,
        maxMs: interactions.drawFrameIntervalsMs.length ? Math.max(...interactions.drawFrameIntervalsMs) : null,
        callbackDurationP50Ms: quantile(interactions.drawFrameCallbackDurationsMs, 0.5),
        callbackDurationP95Ms: drawFrameCallbackDurationP95Ms,
        callbackDurationMaxMs: interactions.drawFrameCallbackDurationsMs.length ? Math.max(...interactions.drawFrameCallbackDurationsMs) : null,
        drawCallsPerFrameP50: quantile(interactions.drawCallsPerFrame, 0.5),
        drawCallsPerFrameP95: quantile(interactions.drawCallsPerFrame, 0.95),
        drawCallsPerFrameMax: interactions.drawCallsPerFrame.length ? Math.max(...interactions.drawCallsPerFrame) : null,
        directDrawCallsPerFrameP50: quantile(interactions.directDrawCallsPerFrame, 0.5),
        directDrawCallsPerFrameP95: quantile(interactions.directDrawCallsPerFrame, 0.95),
        multiDrawCallsPerFrameP50: quantile(interactions.multiDrawCallsPerFrame, 0.5),
        multiDrawCallsPerFrameP95: quantile(interactions.multiDrawCallsPerFrame, 0.95),
        multiDrawBatchObjectCount: await page.evaluate(() => (window as any).__cadP00.multiDrawBatchObjectCount),
        multiDrawBatchInstanceCount: await page.evaluate(() => (window as any).__cadP00.multiDrawBatchInstanceCount),
        painterDepthBatchChunkCount: await page.evaluate(() => (window as any).__cadP00.painterDepthBatchChunkCount),
        painterDepthLineInstanceCount: await page.evaluate(() => (window as any).__cadP00.painterDepthLineInstanceCount),
        painterDepthTriangleInstanceCount: await page.evaluate(() => (window as any).__cadP00.painterDepthTriangleInstanceCount),
        painterDepthEvaluatedChunkCount: await page.evaluate(() => (window as any).__cadP00.painterDepthEvaluatedChunkCount),
        painterDepthFallbackReasons: await page.evaluate(() => (window as any).__cadP00.painterDepthFallbackReasons),
        valuesMs: interactions.drawFrameIntervalsMs,
        longTaskCount: interactions.longTasks.length,
        longTaskMaxMs: Math.max(0, ...interactions.longTasks.map((task) => task.duration)),
        webglMultiDrawSupported: await page.evaluate(() => (window as any).__cadP00.webglMultiDrawSupported),
      })}`);
      expect(interactions.drawFrameIntervalsMs.length, "P00 must measure actual CAD WebGL-draw frame intervals during interaction")
        .toBeGreaterThan(20);
      expect(drawFrameP95Ms, "Desktop CAD WebGL-draw frame interval p95 target is 20 ms").not.toBeNull();
      expect(drawFrameP95Ms!, "Desktop CAD WebGL-draw frame interval p95 target is 20 ms").toBeLessThanOrEqual(20);
      const actualRois = roiCoverage.map((roi) => {
        const candidateIds = new Set(modelChunks
          .filter((chunk) => p00Profile.semanticR001RoiList.find((item) => item.id === roi.id)?.worldBBoxEstimate
            && boxesOverlap(chunk.bbox!, p00Profile.semanticR001RoiList.find((item) => item.id === roi.id)!.worldBBoxEstimate!))
          .map((chunk) => chunk.chunkId));
        const fetched = warm.initialChunkIds!.filter((chunkId) => candidateIds.has(chunkId));
        return { ...roi, initiallyFetchedChunkCount: fetched.length, initiallyFetchedChunkIds: fetched };
      });
      const projectedGridSize = 20;
      const projectedOccupancyByChunk = new Map<string, Set<number>>();
      const projectedOccupancyByGridSize = new Map([5, 10, 20].map((gridSize) => [gridSize, new Map<string, Set<number>>() ]));
      const centerlineRadiiCssPixels = [0.25, 0.5, 0.75, 1] as const;
      const projectedByCenterlineRadius = new Map(centerlineRadiiCssPixels.map((radius) => [radius, new Map<string, Set<number>>() ]));
      const projectionSourceCounts = {
        modelChunks: 0,
        drawCommandChunks: 0,
        legacyLayerRunChunks: 0,
        legacyRawArrayChunks: 0,
        emptyChunks: 0,
      };
      const projectionViewport = first.screenshotViewport ?? first.initialViewport;
      if (projectionViewport) {
        const camera = projectionViewport.cameraState;
        const projection = {
          width: camera.width,
          height: camera.height,
          center: camera.center,
          unitsPerCssPixel: camera.unitsPerCssPixel,
          paddingCssPixels: 1,
        };
        for (const manifestChunk of modelChunks) {
          const bytes = compiled.chunks.get(manifestChunk.chunkId);
          if (!bytes) continue;
          const unpacked = unpackSceneChunk(manifestChunk.chunkId, bytes);
          projectionSourceCounts.modelChunks++;
          const hasDrawCommands = Array.isArray(unpacked.meta?.drawCommands) && unpacked.meta.drawCommands.length > 0;
          const legacyLayerRuns = Array.isArray(unpacked.meta?.layerRuns) ? unpacked.meta.layerRuns : [];
          if (hasDrawCommands) projectionSourceCounts.drawCommandChunks++;
          else if (legacyLayerRuns.length > 0) projectionSourceCounts.legacyLayerRunChunks++;
          else if (unpacked.xyArray.length > 0 || (unpacked.trianglesArray?.length ?? 0) > 0) projectionSourceCounts.legacyRawArrayChunks++;
          else projectionSourceCounts.emptyChunks++;
          for (const gridSize of [5, 10, 20]) {
            const occupancy = projectP00ChunkOccupancy(unpacked, projection, gridSize);
            if (occupancy.size > 0) projectedOccupancyByGridSize.get(gridSize)!.set(manifestChunk.chunkId, occupancy);
            if (gridSize === projectedGridSize && occupancy.size > 0) projectedOccupancyByChunk.set(manifestChunk.chunkId, occupancy);
          }
          for (const radius of centerlineRadiiCssPixels) {
            const expandedOccupancy = projectP00ChunkOccupancy(unpacked, projection, projectedGridSize, radius);
            if (expandedOccupancy.size > 0) projectedByCenterlineRadius.get(radius)!.set(manifestChunk.chunkId, expandedOccupancy);
          }
        }
      }
      const summarizeRun = (sample: RunSample) => {
        const gl = sample.glTelemetry as {
          firstDrawAfterDocumentStartMs: number | null;
          firstAcceptedAtPerformanceMs: number | null;
          firstDrawAfterFirstAcceptedAt: number | null;
          drawCalls: number;
          bufferDataCalls: number;
          bufferDataUploadCallBytesEstimate: number;
          longTaskSupported: boolean;
          longTasks: Array<{ startTime: number; duration: number }>;
        };
        const longTasks = gl.longTasks;
        const resourceEvents = sample.hostResourceEvents ?? [];
        const outcomes = resourceEvents.filter((event) => event.type === "chunk-load-outcome");
        const acceptedOutcomes = outcomes.filter((event) => event.status === "accepted");
        const rejectedOutcomes = outcomes.filter((event) => event.status === "rejected");
        const summarizeByteCosts = (values: number[]) => {
          const sorted = values.filter(Number.isFinite).sort((a, b) => a - b);
          if (sorted.length === 0) return { count: 0, minBytes: null, p50Bytes: null, p90Bytes: null, maxBytes: null, totalBytes: 0 };
          return {
            count: sorted.length,
            minBytes: sorted[0]!,
            p50Bytes: sorted[Math.floor((sorted.length - 1) * 0.5)]!,
            p90Bytes: sorted[Math.floor((sorted.length - 1) * 0.9)]!,
            maxBytes: sorted[sorted.length - 1]!,
            totalBytes: sorted.reduce((total, value) => total + value, 0),
          };
        };
        const evictionsByReason = resourceEvents.filter((event) => event.type === "chunk-evicted")
          .reduce<Record<string, number>>((counts, event) => {
            const reason = event.reason ?? "unspecified";
            counts[reason] = (counts[reason] ?? 0) + 1;
            return counts;
          }, {});
        const admissionCandidates = outcomes
          .filter((event) => event.status === "accepted" || event.status === "rejected")
          .map((event) => ({
            chunkId: event.chunkId ?? "",
            manifestBytes: event.chunkId ? compiled.chunks.get(event.chunkId)?.byteLength : undefined,
            vertices: event.chunkVertexCount,
            geometryCpuBytes: event.geometryCpuBytesAdded,
            incomingCpuBytes: event.incomingUnpackedCpuBytes,
            retainedSourceCpuBytes: event.candidateRefinementSourceBytes,
            gpuBytes: event.candidateGpuBufferBytes,
          }));
        const summarizeBboxRoiChunkCoverage = (selectedIds: Set<string>) => roiCoverage.map((roi) => {
          const roiDefinition = p00Profile.semanticR001RoiList.find((item) => item.id === roi.id);
          const candidateIds = roiDefinition?.worldBBoxEstimate
            ? modelChunks.filter((chunk) => boxesOverlap(chunk.bbox!, roiDefinition.worldBBoxEstimate!))
              .map((chunk) => chunk.chunkId)
            : [];
          const selectedCount = candidateIds.filter((chunkId) => selectedIds.has(chunkId)).length;
          return {
            roiId: roi.id,
            candidateChunkCount: candidateIds.length,
            selectedChunkCount: selectedCount,
            selectedPercent: candidateIds.length === 0 ? null : Math.round((selectedCount / candidateIds.length) * 1000) / 10,
          };
        });
        const summarizeBudgetRejectedCoverage = () => {
          const rejectedChunkIds = new Set(rejectedOutcomes.flatMap((event) => event.chunkId ? [event.chunkId] : []));
          const acceptedChunkIds = new Set(acceptedOutcomes.flatMap((event) => event.chunkId ? [event.chunkId] : []));
          const modelChunkById = new Map(modelChunks.map((chunk) => [chunk.chunkId, chunk]));
          const rejectedEventsByChunkId = new Map<string, P00HostResourceEvent[]>();
          for (const event of rejectedOutcomes) {
            if (!event.chunkId) continue;
            const events = rejectedEventsByChunkId.get(event.chunkId) ?? [];
            events.push(event);
            rejectedEventsByChunkId.set(event.chunkId, events);
          }
          const chunksByProjectedCell = projectedGridCells.map((cell) => {
            const candidateChunkIds = Array.from(cell.candidateIds).sort();
            const rejectedIds = candidateChunkIds.filter((chunkId) => rejectedChunkIds.has(chunkId));
            const acceptedIds = candidateChunkIds.filter((chunkId) => acceptedChunkIds.has(chunkId));
            return {
              cellIndex: cell.index,
              row: Math.floor(cell.index / projectedGridSize),
              column: cell.index % projectedGridSize,
              candidateChunkCount: candidateChunkIds.length,
              acceptedChunkCount: acceptedIds.length,
              rejectedChunkCount: rejectedIds.length,
              rejectedChunkIds: rejectedIds,
            };
          }).filter((cell) => cell.rejectedChunkCount > 0);
          const roiMapping = p00Profile.semanticR001RoiList.map((roi) => {
            const candidates = roi.worldBBoxEstimate
              ? modelChunks.filter((chunk) => boxesOverlap(chunk.bbox!, roi.worldBBoxEstimate!)).map((chunk) => chunk.chunkId)
              : [];
            const roiSourceHandles = (roi.handles ?? []).filter((handle) => /^[0-9a-f]+$/i.test(handle));
            const rejectedIds = candidates.filter((chunkId) => rejectedChunkIds.has(chunkId));
            return {
              roiId: roi.id,
              mappingStatus: roi.worldBBoxEstimate ? "bbox-estimate" : "unmapped-no-world-bbox",
              candidateChunkCount: roi.worldBBoxEstimate ? candidates.length : null,
              acceptedChunkCount: roi.worldBBoxEstimate ? candidates.filter((chunkId) => acceptedChunkIds.has(chunkId)).length : null,
              rejectedChunkCount: roi.worldBBoxEstimate ? rejectedIds.length : null,
              rejectedChunkIds: roi.worldBBoxEstimate ? rejectedIds : [],
              profileHandleCount: roiSourceHandles.length,
              sourceHandleMappingStatus: roiSourceHandles.length > 0 ? "handle-present-but-not-bound-to-chunk" : "no-valid-profile-handles",
            };
          });
          const rejectedChunkMap = Array.from(rejectedChunkIds).sort().map((chunkId) => {
            const chunk = modelChunkById.get(chunkId);
            const events = rejectedEventsByChunkId.get(chunkId) ?? [];
            const roiIds = p00Profile.semanticR001RoiList
              .filter((roi) => roi.worldBBoxEstimate && chunk?.bbox && boxesOverlap(chunk.bbox, roi.worldBBoxEstimate))
              .map((roi) => roi.id);
            const rejectionResources = Array.from(new Set(events.flatMap((event) => event.rejectionResources ?? []))).sort();
            return {
              chunkId,
              projectedCellIds: Array.from(projectedOccupancyByChunk.get(chunkId) ?? []).sort((a, b) => a - b),
              bboxRoiIds: roiIds,
              rejectionResources,
              candidateCpuBytes: events.find((event) => typeof event.candidateCpuBytes === "number")?.candidateCpuBytes ?? null,
              candidateGpuBufferBytes: events.find((event) => typeof event.candidateGpuBufferBytes === "number")?.candidateGpuBufferBytes ?? null,
            };
          });
          const rejectedChunksWithProjectedOccupancy = rejectedChunkMap.filter((chunk) => chunk.projectedCellIds.length > 0).length;
          const rejectedChunksWithBboxRoi = rejectedChunkMap.filter((chunk) => chunk.bboxRoiIds.length > 0).length;
          return {
            rejectedOutcomeCount: rejectedOutcomes.length,
            uniqueRejectedChunkCount: rejectedChunkIds.size,
            acceptedUniqueChunkCount: acceptedChunkIds.size,
            visibleModelChunkCount: modelChunks.length,
            uniqueRejectedChunkIds: Array.from(rejectedChunkIds).sort(),
            projectedGrid: {
              candidateOccupiedCellCount: projectedGridCells.length,
              cellsWithRejectedChunks: chunksByProjectedCell.length,
              cellsWithOnlyRejectedCandidates: chunksByProjectedCell.filter((cell) => cell.acceptedChunkCount === 0).length,
              rejectedChunksWithProjectedOccupancy,
              rejectedChunksWithoutProjectedOccupancy: rejectedChunkIds.size - rejectedChunksWithProjectedOccupancy,
              byCell: chunksByProjectedCell,
            },
            bboxRoiMapping: {
              mappedRejectedChunkCount: rejectedChunksWithBboxRoi,
              rejectedChunksOutsideMappedBboxRois: rejectedChunkIds.size - rejectedChunksWithBboxRoi,
              rois: roiMapping,
            },
            rejectedChunkMap,
            limitation: "Projected-cell occupancy and ROI bbox intersections are test-only geometry proxies. ROI entries without worldBBoxEstimate cannot be assigned chunk IDs; profile handles are not tied to chunks by this mapping. No semantic or AutoCAD coverage is implied.",
          };
        };
        const viewportGridSizes = [5, 10, 20] as const;
        const buildViewportGridCells = (gridSize: number) => {
          const viewport = sample.initialViewport?.viewportBBox;
          if (!viewport) return [] as Array<{ roiId: string; candidateIds: Set<string> }>;
          const [minX, minY, maxX, maxY] = viewport;
          const cellWidth = (maxX - minX) / gridSize;
          const cellHeight = (maxY - minY) / gridSize;
          if (!(cellWidth > 0) || !(cellHeight > 0)) return [];
          const cells: Array<{ roiId: string; candidateIds: Set<string> }> = [];
          for (let row = 0; row < gridSize; row++) {
            for (let column = 0; column < gridSize; column++) {
              const cellBBox = [
                minX + column * cellWidth,
                minY + row * cellHeight,
                minX + (column + 1) * cellWidth,
                minY + (row + 1) * cellHeight,
              ];
              const candidateIds = new Set(modelChunks
                .filter((chunk) => boxesOverlap(chunk.bbox!, cellBBox))
                .map((chunk) => chunk.chunkId));
              if (candidateIds.size > 0) cells.push({ roiId: `${row}:${column}`, candidateIds });
            }
          }
          return cells;
        };
        const viewportGridCellsBySize = new Map<number, Array<{ roiId: string; candidateIds: Set<string> }>>(
          viewportGridSizes.map((gridSize) => [gridSize, buildViewportGridCells(gridSize)]),
        );
        const summarizeViewportGridCoverageBySize = (selectedIds: Set<string>) => Object.fromEntries(
          viewportGridSizes.map((gridSize) => {
            const gridCells = viewportGridCellsBySize.get(gridSize) ?? [];
            const selectedCellCount = gridCells.filter((cell) =>
              Array.from(cell.candidateIds).some((chunkId) => selectedIds.has(chunkId)),
            ).length;
            return [gridSize, {
              columns: gridSize,
              rows: gridSize,
              viewportBBox: sample.initialViewport?.viewportBBox ?? null,
              visibleChunkCount: sample.initialViewport?.visibleChunkCount ?? null,
              candidateCellCount: gridCells.length,
              selectedCellCount,
              selectedPercent: gridCells.length === 0 ? null : Math.round((selectedCellCount / gridCells.length) * 1000) / 10,
            }];
          }),
        );
        const sparseRoiPriorityTargets = roiCoverage
          .filter((roi) => roi.candidateChunkCount > 0 && roi.candidateChunkCount < modelChunks.length * 0.1)
          .map((roi) => ({ roiId: roi.id, candidateChunkCount: roi.candidateChunkCount }));
        const projectedGridCells = Array.from({ length: projectedGridSize * projectedGridSize }, (_, index) => ({
          index,
          roiId: `${Math.floor(index / projectedGridSize)}:${index % projectedGridSize}`,
          candidateIds: new Set(modelChunks.flatMap((chunk) => projectedOccupancyByChunk.get(chunk.chunkId)?.has(index) ? [chunk.chunkId] : [])),
        })).filter((cell) => cell.candidateIds.size > 0);
        const summarizeProjectedGridCoverage = (selectedIds: Set<string>) => {
          const selectedCellCount = projectedGridCells.filter((cell) =>
            Array.from(cell.candidateIds).some((chunkId) => selectedIds.has(chunkId)),
          ).length;
          return {
            columns: projectedGridSize,
            rows: projectedGridSize,
            candidateCellCount: projectedGridCells.length,
            selectedCellCount,
            selectedPercent: projectedGridCells.length === 0 ? null : Math.round((selectedCellCount / projectedGridCells.length) * 1000) / 10,
          };
        };
        const bboxGrid20 = viewportGridCellsBySize.get(projectedGridSize) ?? [];
        const projectedCellIds = new Set(projectedGridCells.map((cell) => cell.roiId));
        const bboxCandidateCellIds = new Set(bboxGrid20.map((cell) => cell.roiId));
        const bboxOnlyCellCount = bboxGrid20.filter((cell) => !projectedCellIds.has(cell.roiId)).length;
        const projectedOnlyCellCount = projectedGridCells.filter((cell) => !bboxCandidateCellIds.has(cell.roiId)).length;
        const acceptedIds = new Set(acceptedOutcomes.flatMap((event) => event.chunkId ? [event.chunkId] : []));
        const firstContentFrameAt = gl.firstDrawAfterFirstAcceptedAt;
        const firstContentFrameAcceptedIds = new Set(resourceEvents
          .filter((event) => event.type === "chunk-load-outcome" && event.status === "accepted" && event.chunkId &&
            typeof firstContentFrameAt === "number" && typeof event.observedAtMs === "number" && event.observedAtMs <= firstContentFrameAt)
          .map((event) => event.chunkId!));
        const acceptedProjectedCellIds = new Set(projectedGridCells
          .filter((cell) => Array.from(cell.candidateIds).some((chunkId) => acceptedIds.has(chunkId)))
          .map((cell) => cell.index));
        const rasterCellIdsByThreshold = new Map((sample.rasterOccupancy?.thresholdSweep ?? []).map((raster) => [
          raster.colorDeltaThreshold,
          new Set(raster.occupiedCellIds),
        ]));
        const rasterCellIds = rasterCellIdsByThreshold.get(16) ?? new Set(sample.rasterOccupancy?.occupiedCellIds ?? []);
        const sharedRasterProjectedCellCount = Array.from(acceptedProjectedCellIds).filter((cellId) => rasterCellIds.has(cellId)).length;
        const projectedRasterByThreshold = (sample.rasterOccupancy?.thresholdSweep ?? []).map((raster) => {
          const thresholdCellIds = rasterCellIdsByThreshold.get(raster.colorDeltaThreshold) ?? new Set<number>();
          return {
            colorDeltaThreshold: raster.colorDeltaThreshold,
            rasterOccupiedCellCount: thresholdCellIds.size,
            sharedCellCount: Array.from(acceptedProjectedCellIds).filter((cellId) => thresholdCellIds.has(cellId)).length,
            rasterOnlyCellCount: Array.from(thresholdCellIds).filter((cellId) => !acceptedProjectedCellIds.has(cellId)).length,
            projectedOnlyCellCount: Array.from(acceptedProjectedCellIds).filter((cellId) => !thresholdCellIds.has(cellId)).length,
            rasterForegroundPixelCount: raster.foregroundPixelCount,
          };
        });
        const projectedRasterByGridSize = [5, 10, 20].map((gridSize) => {
          const occupancyByChunk = projectedOccupancyByGridSize.get(gridSize)!;
          const candidateCellIds = new Set(Array.from(occupancyByChunk.values()).flatMap((cells) => Array.from(cells)));
          const acceptedCellIds = new Set(Array.from(occupancyByChunk.entries())
            .filter(([chunkId]) => acceptedIds.has(chunkId))
            .flatMap(([, cells]) => Array.from(cells)));
          const rasterGrid = sample.rasterOccupancy?.gridSweep.find((grid) => grid.gridSize === gridSize);
          return {
            gridSize,
            candidateProjectedCellCount: candidateCellIds.size,
            acceptedProjectedCellCount: acceptedCellIds.size,
            byColorDeltaThreshold: (rasterGrid?.thresholdSweep ?? []).map((raster) => {
              const thresholdCellIds = new Set(raster.occupiedCellIds);
              return {
                colorDeltaThreshold: raster.colorDeltaThreshold,
                rasterOccupiedCellCount: thresholdCellIds.size,
                sharedCellCount: Array.from(acceptedCellIds).filter((cellId) => thresholdCellIds.has(cellId)).length,
                rasterOnlyCellCount: Array.from(thresholdCellIds).filter((cellId) => !acceptedCellIds.has(cellId)).length,
                projectedOnlyCellCount: Array.from(acceptedCellIds).filter((cellId) => !thresholdCellIds.has(cellId)).length,
              };
            }),
          };
        });
        const centerlineRadiusSweepAt20x20 = centerlineRadiiCssPixels.map((radius) => {
          const occupancyByChunk = projectedByCenterlineRadius.get(radius)!;
          const candidateCellIds = new Set(Array.from(occupancyByChunk.values()).flatMap((cells) => Array.from(cells)));
          const acceptedCellIds = new Set(Array.from(occupancyByChunk.entries())
            .filter(([chunkId]) => acceptedIds.has(chunkId))
            .flatMap(([, cells]) => Array.from(cells)));
          const rasterCellIds = new Set(sample.rasterOccupancy?.gridSweep
            .find((grid) => grid.gridSize === projectedGridSize)?.thresholdSweep
            .find((threshold) => threshold.colorDeltaThreshold === 16)?.occupiedCellIds ?? []);
          return {
            centerlineRadiusCssPixels: radius,
            candidateProjectedCellCount: candidateCellIds.size,
            acceptedProjectedCellCount: acceptedCellIds.size,
            rasterOccupiedCellCount: rasterCellIds.size,
            sharedCellCount: Array.from(acceptedCellIds).filter((cellId) => rasterCellIds.has(cellId)).length,
            rasterOnlyCellIds: Array.from(rasterCellIds).filter((cellId) => !acceptedCellIds.has(cellId)).sort((a, b) => a - b),
            projectedOnlyCellIds: Array.from(acceptedCellIds).filter((cellId) => !rasterCellIds.has(cellId)).sort((a, b) => a - b),
            rasterOnlyCellCount: Array.from(rasterCellIds).filter((cellId) => !acceptedCellIds.has(cellId)).length,
            projectedOnlyCellCount: Array.from(acceptedCellIds).filter((cellId) => !rasterCellIds.has(cellId)).length,
          };
        });
        const quarterRadiusAcceptedCellIds = new Set(Array.from(projectedByCenterlineRadius.get(0.25)!.entries())
          .filter(([chunkId]) => acceptedIds.has(chunkId))
          .flatMap(([, cells]) => Array.from(cells)));
        const cellPixelCountSensitivityAt20x20 = (sample.rasterOccupancy?.minimumForegroundPixelCountSweep ?? []).map((raster) => {
          const rasterCellIds = new Set(raster.occupiedCellIds);
          return {
            minimumForegroundPixelCount: raster.minimumForegroundPixelCount,
            rasterOccupiedCellCount: rasterCellIds.size,
            centerlineSharedCellCount: Array.from(acceptedProjectedCellIds).filter((cellId) => rasterCellIds.has(cellId)).length,
            centerlineRasterOnlyCellCount: Array.from(rasterCellIds).filter((cellId) => !acceptedProjectedCellIds.has(cellId)).length,
            centerlineProjectedOnlyCellCount: Array.from(acceptedProjectedCellIds).filter((cellId) => !rasterCellIds.has(cellId)).length,
            quarterPixelRadiusSharedCellCount: Array.from(quarterRadiusAcceptedCellIds).filter((cellId) => rasterCellIds.has(cellId)).length,
            quarterPixelRadiusRasterOnlyCellCount: Array.from(rasterCellIds).filter((cellId) => !quarterRadiusAcceptedCellIds.has(cellId)).length,
            quarterPixelRadiusProjectedOnlyCellCount: Array.from(quarterRadiusAcceptedCellIds).filter((cellId) => !rasterCellIds.has(cellId)).length,
          };
        });
        const simulateAdmissionOrder = (order: "vertex-per-cpu-byte" | "lowest-cpu-cost" | "smallest-manifest-chunk-first" | "sparse-roi-representative-then-vertex-per-cpu-byte" | "sparse-roi-marginal-coverage-per-cpu-byte" | "camera-grid-5-marginal-coverage-per-cpu-byte" | "camera-grid-10-marginal-coverage-per-cpu-byte" | "camera-grid-20-marginal-coverage-per-cpu-byte" | "camera-projected-20-marginal-coverage-per-cpu-byte") => {
          const cpuBudgetBytes = outcomes.find((event) => typeof event.cpuBudgetBytes === "number")?.cpuBudgetBytes;
          const gpuBudgetBytes = outcomes.find((event) => typeof event.gpuBudgetBytes === "number")?.gpuBudgetBytes;
          if (typeof cpuBudgetBytes !== "number" || typeof gpuBudgetBytes !== "number" ||
            admissionCandidates.length === 0 || admissionCandidates.some((candidate) =>
              !candidate.chunkId || typeof candidate.vertices !== "number" ||
              typeof candidate.manifestBytes !== "number" ||
              typeof candidate.geometryCpuBytes !== "number" || typeof candidate.incomingCpuBytes !== "number" ||
              typeof candidate.retainedSourceCpuBytes !== "number" || typeof candidate.gpuBytes !== "number")) {
            return { available: false as const, reason: "Per-chunk costs or budgets are incomplete." };
          }
          const totalCpuEstimate = (candidate: typeof admissionCandidates[number]) =>
            candidate.geometryCpuBytes! + candidate.incomingCpuBytes! + candidate.retainedSourceCpuBytes!;
          const vertexYieldOrder = [...admissionCandidates].sort((a, b) => {
            const density = (b.vertices! / Math.max(1, totalCpuEstimate(b))) - (a.vertices! / Math.max(1, totalCpuEstimate(a)));
            return density || totalCpuEstimate(a) - totalCpuEstimate(b) || a.chunkId.localeCompare(b.chunkId);
          });
          const sparseRoiTargets = p00Profile.semanticR001RoiList.flatMap((roi) => {
            if (!roi.worldBBoxEstimate) return [];
            const candidateIds = new Set(modelChunks
              .filter((chunk) => boxesOverlap(chunk.bbox!, roi.worldBBoxEstimate!))
              .map((chunk) => chunk.chunkId));
            if (candidateIds.size === 0 || candidateIds.size >= modelChunks.length * 0.1) return [];
            return [{ roiId: roi.id, candidateIds }];
          }).sort((a, b) => a.candidateIds.size - b.candidateIds.size || a.roiId.localeCompare(b.roiId));
          const cameraGridSize = order === "camera-grid-5-marginal-coverage-per-cpu-byte" ? 5
            : order === "camera-grid-10-marginal-coverage-per-cpu-byte" ? 10
              : order === "camera-grid-20-marginal-coverage-per-cpu-byte" ? 20
                : null;
          const isProjectedGridOrder = order === "camera-projected-20-marginal-coverage-per-cpu-byte";
          const marginalPriorityTargets = isProjectedGridOrder
            ? projectedGridCells
            : cameraGridSize !== null
              ? viewportGridCellsBySize.get(cameraGridSize) ?? []
              : order === "sparse-roi-marginal-coverage-per-cpu-byte"
                ? sparseRoiTargets
                : [];
          const sparseRoiSeedIds = new Set<string>();
          const sparseRoiSeedDetails: Array<{ roiId: string; targetRoiIds: string[]; chunkId: string; vertices: number; estimatedCpuBytes: number }> = [];
          if (order === "sparse-roi-representative-then-vertex-per-cpu-byte") {
            for (const target of sparseRoiTargets) {
              const existingSeed = sparseRoiSeedDetails.find((seed) => target.candidateIds.has(seed.chunkId));
              if (existingSeed) {
                existingSeed.targetRoiIds.push(target.roiId);
                continue;
              }
              const representative = vertexYieldOrder.find((candidate) =>
                target.candidateIds.has(candidate.chunkId) && !sparseRoiSeedIds.has(candidate.chunkId));
              if (!representative) continue;
              sparseRoiSeedIds.add(representative.chunkId);
              sparseRoiSeedDetails.push({
                roiId: target.roiId,
                targetRoiIds: [target.roiId],
                chunkId: representative.chunkId,
                vertices: representative.vertices!,
                estimatedCpuBytes: totalCpuEstimate(representative),
              });
            }
          }
          const candidates = order === "sparse-roi-representative-then-vertex-per-cpu-byte"
            ? [
                ...sparseRoiSeedDetails.flatMap((seed) => {
                  const candidate = admissionCandidates.find((item) => item.chunkId === seed.chunkId);
                  return candidate ? [candidate] : [];
                }),
                ...vertexYieldOrder.filter((candidate) => !sparseRoiSeedIds.has(candidate.chunkId)),
            ]
            : order === "sparse-roi-marginal-coverage-per-cpu-byte"
              ? vertexYieldOrder
              : cameraGridSize !== null
                ? vertexYieldOrder
            : [...admissionCandidates].sort((a, b) => {
              if (order === "smallest-manifest-chunk-first") {
                return a.manifestBytes! - b.manifestBytes! || a.chunkId.localeCompare(b.chunkId);
              }
              if (order === "vertex-per-cpu-byte") {
                return vertexYieldOrder.indexOf(a) - vertexYieldOrder.indexOf(b);
              }
              return totalCpuEstimate(a) - totalCpuEstimate(b) || b.vertices! - a.vertices! || a.chunkId.localeCompare(b.chunkId);
            });
          let residentGeometryCpuBytes = 0;
          let retainedSourceCpuBytes = 0;
          let gpuBytes = 0;
          let acceptedVertices = 0;
          let acceptedChunks = 0;
          const orderedChunkIds: string[] = [];
          const acceptedChunkIds = new Set<string>();
          const marginalPriorityCoveredCounts = new Map(marginalPriorityTargets.map((target) => [target.roiId, 0]));
          const admitCandidate = (candidate: typeof admissionCandidates[number]) => {
            const candidateResidentCpuBytes = residentGeometryCpuBytes + retainedSourceCpuBytes + candidate.geometryCpuBytes!;
            if (candidateResidentCpuBytes + candidate.incomingCpuBytes! > cpuBudgetBytes ||
              gpuBytes + candidate.gpuBytes! > gpuBudgetBytes) return;
            residentGeometryCpuBytes += candidate.geometryCpuBytes!;
            gpuBytes += candidate.gpuBytes!;
            if (retainedSourceCpuBytes + candidate.retainedSourceCpuBytes! <= 32 * 1024 * 1024) {
              retainedSourceCpuBytes += candidate.retainedSourceCpuBytes!;
            }
            acceptedVertices += candidate.vertices!;
            acceptedChunks++;
            acceptedChunkIds.add(candidate.chunkId);
            for (const target of marginalPriorityTargets) {
              if (target.candidateIds.has(candidate.chunkId)) {
                marginalPriorityCoveredCounts.set(target.roiId, (marginalPriorityCoveredCounts.get(target.roiId) ?? 0) + 1);
              }
            }
          };
          if (order === "sparse-roi-marginal-coverage-per-cpu-byte" || cameraGridSize !== null || isProjectedGridOrder) {
            const pending = new Map(admissionCandidates.map((candidate) => [candidate.chunkId, candidate]));
            while (pending.size > 0) {
              let bestCandidate: typeof admissionCandidates[number] | undefined;
              let bestCoveragePerCpuByte = 0;
              let bestMarginalCoverage = 0;
              for (const candidate of pending.values()) {
                const marginalCoverage = marginalPriorityTargets.reduce((gain, target) => {
                  const coveredCount = marginalPriorityCoveredCounts.get(target.roiId) ?? 0;
                  return gain + (target.candidateIds.has(candidate.chunkId) && coveredCount < target.candidateIds.size
                    ? 1 / target.candidateIds.size
                    : 0);
                }, 0);
                const coveragePerCpuByte = marginalCoverage / Math.max(1, totalCpuEstimate(candidate));
                const candidateYield = candidate.vertices! / Math.max(1, totalCpuEstimate(candidate));
                const bestYield = bestCandidate ? bestCandidate.vertices! / Math.max(1, totalCpuEstimate(bestCandidate)) : -1;
                if (coveragePerCpuByte > bestCoveragePerCpuByte ||
                  (coveragePerCpuByte === bestCoveragePerCpuByte && marginalCoverage > bestMarginalCoverage) ||
                  (coveragePerCpuByte === bestCoveragePerCpuByte && marginalCoverage === bestMarginalCoverage && candidateYield > bestYield) ||
                  (coveragePerCpuByte === bestCoveragePerCpuByte && marginalCoverage === bestMarginalCoverage && candidateYield === bestYield &&
                    bestCandidate && candidate.chunkId.localeCompare(bestCandidate.chunkId) < 0)) {
                  bestCandidate = candidate;
                  bestCoveragePerCpuByte = coveragePerCpuByte;
                  bestMarginalCoverage = marginalCoverage;
                }
              }
              const candidate = bestCoveragePerCpuByte > 0
                ? bestCandidate
                : vertexYieldOrder.find((item) => pending.has(item.chunkId));
              if (!candidate) break;
              pending.delete(candidate.chunkId);
              orderedChunkIds.push(candidate.chunkId);
              admitCandidate(candidate);
            }
          } else {
            for (const candidate of candidates) {
              orderedChunkIds.push(candidate.chunkId);
              admitCandidate(candidate);
            }
          }
          return {
            available: true as const,
            policy: order,
            orderedChunkIds,
            acceptedChunks,
            acceptedVertices,
            sparseRoiSeedDetails: sparseRoiSeedDetails.map((seed) => ({
              ...seed,
              admitted: acceptedChunkIds.has(seed.chunkId),
            })),
            sparseRoiSeedCandidateCount: sparseRoiSeedIds.size,
            sparseRoiTargetCount: sparseRoiTargets.length,
            residentGeometryCpuBytes,
            retainedSourceCpuBytes,
            summedCandidateGpuBytes: gpuBytes,
            bboxRoiChunkCoverage: summarizeBboxRoiChunkCoverage(acceptedChunkIds),
            cameraViewportGridCoverageBySize: summarizeViewportGridCoverageBySize(acceptedChunkIds),
            projectedPrimitiveGridCoverage: summarizeProjectedGridCoverage(acceptedChunkIds),
            cpuBudgetBytes,
            gpuBudgetBytes,
          };
        };
        return {
          loadedVertexCount: sample.loadedVertexCount,
          initialSettleDiagnostics: sample.initialSettleDiagnostics ?? null,
          initialViewport: sample.initialViewport ?? null,
          screenshotViewport: sample.screenshotViewport ?? null,
          rasterOccupancy: sample.rasterOccupancy ? {
            width: sample.rasterOccupancy.width,
            height: sample.rasterOccupancy.height,
            backgroundRgba: sample.rasterOccupancy.backgroundRgba,
            foregroundPixelCount: sample.rasterOccupancy.foregroundPixelCount,
            occupiedCellCount: sample.rasterOccupancy.occupiedCellCount,
            cellPixelThreshold: sample.rasterOccupancy.cellPixelThreshold,
            viewportWidthCss: sample.rasterOccupancy.viewportWidthCss,
            viewportHeightCss: sample.rasterOccupancy.viewportHeightCss,
            paddingCssPixels: sample.rasterOccupancy.paddingCssPixels,
            colorDeltaThreshold: sample.rasterOccupancy.colorDeltaThreshold,
            thresholdSweep: sample.rasterOccupancy.thresholdSweep.map(({ colorDeltaThreshold, foregroundPixelCount, occupiedCellCount }) => ({
              colorDeltaThreshold,
              foregroundPixelCount,
              occupiedCellCount,
            })),
            gridSweep: sample.rasterOccupancy.gridSweep.map(({ gridSize, thresholdSweep }) => ({
              gridSize,
              thresholdSweep: thresholdSweep.map(({ colorDeltaThreshold, foregroundPixelCount, occupiedCellCount }) => ({
                colorDeltaThreshold,
                foregroundPixelCount,
                occupiedCellCount,
              })),
            })),
          } : null,
          initialVisibleChunksSettledMs: sample.initialVisibleChunksSettledMs,
          hostInteractiveMs: sample.hostInteractiveMs,
          qualityWarningText: sample.qualityWarningText,
          resourceDecisions: {
            loadStarts: resourceEvents.filter((event) => event.type === "chunk-load-start").length,
            accepted: acceptedOutcomes.length,
            rejected: rejectedOutcomes.length,
            budgetRejectedCoverage: sample.label === "first-open" ? summarizeBudgetRejectedCoverage() : undefined,
            staleVisibility: outcomes.filter((event) => event.status === "stale-visibility").length,
            rejectionCauseCounts: {
              cpu: rejectedOutcomes.filter((event) => event.rejectionResources?.includes("cpu")).length,
              gpu: rejectedOutcomes.filter((event) => event.rejectionResources?.includes("gpu")).length,
              both: rejectedOutcomes.filter((event) => event.rejectionResources?.includes("cpu") && event.rejectionResources?.includes("gpu")).length,
            },
            vertexDecisionTotals: {
              accepted: acceptedOutcomes.reduce((total, event) => total + (event.chunkVertexCount ?? 0), 0),
              rejected: rejectedOutcomes.reduce((total, event) => total + (event.chunkVertexCount ?? 0), 0),
            },
            firstContentFrame: {
              firstAcceptedAtPerformanceMs: gl.firstAcceptedAtPerformanceMs,
              firstDrawAfterFirstAcceptedAt: firstContentFrameAt,
              firstDrawAfterFirstAcceptedDelayMs: typeof firstContentFrameAt === "number" && typeof gl.firstAcceptedAtPerformanceMs === "number"
                ? firstContentFrameAt - gl.firstAcceptedAtPerformanceMs
                : null,
              acceptedChunkCount: firstContentFrameAcceptedIds.size,
              projectedPrimitiveGridCoverage: summarizeProjectedGridCoverage(firstContentFrameAcceptedIds),
              bboxRoiChunkCoverage: summarizeBboxRoiChunkCoverage(firstContentFrameAcceptedIds),
            },
            admissionOrderWhatIf: {
              sparseRoiPriorityModel: {
                candidateChunkFractionUpperBoundExclusive: 0.1,
                targets: sparseRoiPriorityTargets,
                roiWeighting: "Each target ROI has total weight 1; an intersecting candidate chunk contributes 1 / candidateChunkCount until that ROI's candidate set is fully selected.",
                score: "Sum of marginal target weights divided by estimated CPU bytes; ties prefer more marginal coverage, then vertex yield per CPU byte, then chunk ID.",
                fallback: "When no sparse target has remaining marginal coverage, use vertex yield per estimated CPU byte.",
              },
              cameraViewportGridPriorityModel: {
                gridSizes: viewportGridSizes,
                viewportBBox: sample.initialViewport?.viewportBBox ?? null,
                candidateCellCountBySize: Object.fromEntries(viewportGridSizes.map((gridSize) => [gridSize, viewportGridCellsBySize.get(gridSize)?.length ?? 0])),
                targetDefinition: "Each cell intersected by at least one Model chunk bbox inside the measured initial camera viewport is a target cell; cells without candidate geometry are excluded from the denominator.",
                cellWeighting: "Each target cell has total weight 1; an intersecting candidate chunk contributes 1 / candidateChunkCount until the cell is represented.",
                score: "Sum of remaining cell weights divided by estimated CPU bytes; ties prefer marginal cell count, then vertex yield per CPU byte, then chunk ID.",
                fallback: "When all candidate cells are represented, use vertex yield per estimated CPU byte.",
                limitation: "Bbox-cell intersection is compared with a test-only projection of compiled stroke segments and fill triangles. The projection does not apply dash gaps, wipeout subtraction, layer visibility, paint overlap, anti-aliasing or the final GPU raster; it is not pixel fidelity, readability or semantic importance.",
              },
              projectedPrimitiveGridModel: {
                gridSize: projectedGridSize,
                candidateCellCount: projectedGridCells.length,
                bboxCandidateCellCount: bboxGrid20.length,
                bboxOnlyCellCount,
                bboxOnlyPercent: bboxGrid20.length === 0 ? null : Math.round((bboxOnlyCellCount / bboxGrid20.length) * 1000) / 10,
                projectedOnlyCellCount,
                targetDefinition: "20x20 cells aligned to the host's 1 CSS px padded world viewport, occupied by compiled drawCommands or renderer-compatible legacy layerRuns/raw line and triangle arrays from at least one Model chunk; cell occupancy is coarse and chunk-specific.",
                rendererCompatibleProjectionSourceCounts: projectionSourceCounts,
                score: "Sum of remaining projected cell weights divided by estimated CPU bytes; ties prefer marginal cell count, then vertex yield per CPU byte, then chunk ID.",
                limitation: "Exact centerline-segment/cell intersections and triangle-cell overlap are geometric estimates before final draw behavior. Dash phase, wipeout subtraction, layer visibility, renderer lineweight width, occlusion/order, anti-aliasing, text readability and AutoCAD parity are not modeled.",
              },
                projectedRasterComparison: {
                rasterOccupiedCellCount: rasterCellIds.size,
                acceptedProjectedCellCount: acceptedProjectedCellIds.size,
                sharedCellCount: sharedRasterProjectedCellCount,
                rasterOnlyCellCount: Array.from(rasterCellIds).filter((cellId) => !acceptedProjectedCellIds.has(cellId)).length,
                projectedOnlyCellCount: Array.from(acceptedProjectedCellIds).filter((cellId) => !rasterCellIds.has(cellId)).length,
                rasterForegroundPixelCount: sample.rasterOccupancy?.foregroundPixelCount ?? null,
                rasterOnlyCellDetails: (() => {
                  const rasterCells = sample.rasterOccupancy?.gridSweep
                    .find((grid) => grid.gridSize === projectedGridSize)?.thresholdSweep
                    .find((threshold) => threshold.colorDeltaThreshold === 16);
                  const pixelsByCell = new Map(rasterCells?.occupiedCellPixelCounts.map(({ cellId, pixelCount }) => [cellId, pixelCount]) ?? []);
                  return Array.from(rasterCells?.occupiedCellIds ?? [])
                    .filter((cellId) => !acceptedProjectedCellIds.has(cellId))
                    .map((cellId) => {
                      const projectedCell = projectedGridCells.find((cell) => cell.index === cellId);
                      const candidateChunkIds = Array.from(projectedCell?.candidateIds ?? []).sort();
                      return {
                        cellId,
                        row: Math.floor(cellId / projectedGridSize),
                        column: cellId % projectedGridSize,
                        foregroundPixelCount: pixelsByCell.get(cellId) ?? 0,
                        candidateProjectedChunkCount: candidateChunkIds.length,
                        acceptedProjectedChunkCount: candidateChunkIds.filter((chunkId) => acceptedIds.has(chunkId)).length,
                      };
                    });
                })(),
                backgroundRgba: sample.rasterOccupancy?.backgroundRgba ?? null,
                cellPixelThreshold: sample.rasterOccupancy?.cellPixelThreshold ?? null,
                colorDeltaThreshold: sample.rasterOccupancy?.colorDeltaThreshold ?? null,
                byColorDeltaThreshold: projectedRasterByThreshold,
                byGridSize: projectedRasterByGridSize,
                centerlineRadiusSweepAt20x20,
                cellPixelCountSensitivityAt20x20,
                note: "Raster is the actual partial host frame. Cell membership needs three pixels differing from corner background by at least the tested RGB-channel delta (8, 16, 32, or 64); coarse occupancy is not pixel-fidelity scoring.",
              },
              actual: {
                acceptedChunks: acceptedOutcomes.length,
                acceptedVertices: acceptedOutcomes.reduce((total, event) => total + (event.chunkVertexCount ?? 0), 0),
                bboxRoiChunkCoverage: summarizeBboxRoiChunkCoverage(new Set(acceptedOutcomes.flatMap((event) => event.chunkId ? [event.chunkId] : []))),
                cameraViewportGridCoverageBySize: summarizeViewportGridCoverageBySize(new Set(acceptedOutcomes.flatMap((event) => event.chunkId ? [event.chunkId] : []))),
                projectedPrimitiveGridCoverage: summarizeProjectedGridCoverage(new Set(acceptedOutcomes.flatMap((event) => event.chunkId ? [event.chunkId] : []))),
              },
              greedyVertexYieldPerEstimatedCpuByte: simulateAdmissionOrder("vertex-per-cpu-byte"),
              greedyLowestEstimatedCpuCost: simulateAdmissionOrder("lowest-cpu-cost"),
              greedySmallestManifestChunkFirst: simulateAdmissionOrder("smallest-manifest-chunk-first"),
              sparseRoiRepresentativeThenVertexYield: simulateAdmissionOrder("sparse-roi-representative-then-vertex-per-cpu-byte"),
              sparseRoiMarginalCoveragePerCpuByte: simulateAdmissionOrder("sparse-roi-marginal-coverage-per-cpu-byte"),
              cameraViewportGrid5MarginalCoveragePerCpuByte: simulateAdmissionOrder("camera-grid-5-marginal-coverage-per-cpu-byte"),
              cameraViewportGrid10MarginalCoveragePerCpuByte: simulateAdmissionOrder("camera-grid-10-marginal-coverage-per-cpu-byte"),
              cameraViewportGrid20MarginalCoveragePerCpuByte: simulateAdmissionOrder("camera-grid-20-marginal-coverage-per-cpu-byte"),
              cameraProjectedPrimitiveGrid20MarginalCoveragePerCpuByte: simulateAdmissionOrder("camera-projected-20-marginal-coverage-per-cpu-byte"),
              limitations: "Counterfactual only: estimated geometry/source costs start at zero and omit renderer fixed overhead, shared backing stores between chunks, and concurrent completion order. Reordering may change measured geometry costs. Sparse bbox ROI means fewer than 10% of model chunks intersect the provisional profile bbox; the score uses profile boxes, not the current camera viewport. One selected representative is not full ROI coverage. A higher vertex count or bbox coverage does not prove viewport readability or native fidelity.",
            },
            geometryCpuCosts: {
              accepted: summarizeByteCosts(acceptedOutcomes.flatMap((event) => typeof event.geometryCpuBytesAdded === "number" ? [event.geometryCpuBytesAdded] : [])),
              rejected: summarizeByteCosts(rejectedOutcomes.flatMap((event) => typeof event.geometryCpuBytesAdded === "number" ? [event.geometryCpuBytesAdded] : [])),
            },
            acceptedCandidateCosts: {
              cpuBytes: summarizeByteCosts(acceptedOutcomes.flatMap((event) => typeof event.candidateCpuBytes === "number" ? [event.candidateCpuBytes] : [])),
              gpuBufferBytes: summarizeByteCosts(acceptedOutcomes.flatMap((event) => typeof event.candidateGpuBufferBytes === "number" ? [event.candidateGpuBufferBytes] : [])),
            },
            rejectedCandidateCosts: {
              cpuBytes: summarizeByteCosts(rejectedOutcomes.flatMap((event) => typeof event.candidateCpuBytes === "number" ? [event.candidateCpuBytes] : [])),
              gpuBufferBytes: summarizeByteCosts(rejectedOutcomes.flatMap((event) => typeof event.candidateGpuBufferBytes === "number" ? [event.candidateGpuBufferBytes] : [])),
            },
            evictionsByReason,
            peakAcceptedResidentCpuBytes: Math.max(0, ...acceptedOutcomes.flatMap((event) => typeof event.cpuResidentBytes === "number" ? [event.cpuResidentBytes] : [])),
            peakRejectedCandidateCpuBytes: Math.max(0, ...rejectedOutcomes.flatMap((event) => typeof event.cpuResidentBytes === "number" ? [event.cpuResidentBytes] : [])),
            cpuBudgetBytes: outcomes.find((event) => typeof event.cpuBudgetBytes === "number")?.cpuBudgetBytes ?? null,
            peakAcceptedResidentGpuBufferBytesEstimate: Math.max(0, ...acceptedOutcomes.flatMap((event) => typeof event.gpuBufferBytesEstimate === "number" ? [event.gpuBufferBytesEstimate] : [])),
            peakRejectedCandidateGpuBufferBytesEstimate: Math.max(0, ...rejectedOutcomes.flatMap((event) => typeof event.gpuBufferBytesEstimate === "number" ? [event.gpuBufferBytesEstimate] : [])),
            gpuBudgetBytes: outcomes.find((event) => typeof event.gpuBudgetBytes === "number")?.gpuBudgetBytes ?? null,
          },
          budgetSkippedChunkCount: sample.budgetSkippedChunkCount,
          twoFrameCheckpointMs: sample.twoFrameCheckpointMs,
          canvas: sample.canvas,
          canvasSha256: sample.canvasSha256,
          initialVisibleChunks: {
            requestCount: sample.initialChunkRequestCount,
            uniqueCount: sample.initialChunkIds?.length ?? 0,
            bytes: sample.initialChunkBytes,
            setSha256: sha256((sample.initialChunkIds ?? []).join("\n")),
          },
          browserMetrics: sample.browserMetrics,
          glTelemetry: {
            firstDrawAfterDocumentStartMs: gl.firstDrawAfterDocumentStartMs,
            drawCalls: gl.drawCalls,
            bufferDataCalls: gl.bufferDataCalls,
            bufferDataUploadCallBytesEstimate: gl.bufferDataUploadCallBytesEstimate,
            longTaskSupported: gl.longTaskSupported,
            longTaskCount: longTasks.length,
            maxLongTaskMs: Math.max(0, ...longTasks.map((task) => task.duration)),
          },
          chromiumProcessRss: sample.chromiumProcessRss,
        };
      };
      const roiSummary = actualRois.map(({ initiallyFetchedChunkIds, sourceHandlesPresent, ...roi }) => ({
        ...roi,
        sourceHandlesPresentCount: sourceHandlesPresent.length,
        initiallyFetchedChunkSetSha256: sha256(initiallyFetchedChunkIds.join("\n")),
      }));
      const postInteractionNetwork = {
        apiRequestCount: warm.apiRequests.length - interactionStartSnapshot.apiRequestCount,
        chunkRequestCount: warm.chunkIds.length - interactionStartSnapshot.chunkRequestCount,
        chunkBytes: warm.chunkBytes - interactionStartSnapshot.chunkBytes,
      };
      const sampledInteractionTraffic = interactionNetworkSamples.reduce((total, sample) => ({
        apiRequestCount: total.apiRequestCount + sample.apiRequestCount,
        chunkRequestCount: total.chunkRequestCount + sample.chunkRequestCount,
        requestsForWarmFetchedChunks: total.requestsForWarmFetchedChunks + sample.requestsForWarmFetchedChunks,
        bytesForWarmFetchedChunks: total.bytesForWarmFetchedChunks + sample.bytesForWarmFetchedChunks,
        chunkBytes: total.chunkBytes + sample.chunkBytes,
      }), { apiRequestCount: 0, chunkRequestCount: 0, requestsForWarmFetchedChunks: 0, bytesForWarmFetchedChunks: 0, chunkBytes: 0 });
      const interactionTrafficBetweenSamples = {
        apiRequestCount: postInteractionNetwork.apiRequestCount - sampledInteractionTraffic.apiRequestCount,
        chunkRequestCount: postInteractionNetwork.chunkRequestCount - sampledInteractionTraffic.chunkRequestCount,
        chunkBytes: postInteractionNetwork.chunkBytes - sampledInteractionTraffic.chunkBytes,
      };
      const interactionResourceDecisions = interactionNetworkSamples.reduce((total, sample) => {
        const current = sample.resourceDecisionCounts;
        total.loadStarts += current.loadStarts;
        total.previouslyRejectedRetry += current.previouslyRejectedRetry;
        total.previouslyRejectedRetryAccepted += current.previouslyRejectedRetryAccepted;
        total.previouslyRejectedRetryRejected += current.previouslyRejectedRetryRejected;
        total.acceptedThenEvictedRefetch += current.acceptedThenEvictedRefetch;
        total.acceptedThenEvictedRefetchAccepted += current.acceptedThenEvictedRefetchAccepted;
        total.acceptedThenEvictedRefetchRejected += current.acceptedThenEvictedRefetchRejected;
        total.previouslyAcceptedWithoutObservedEviction += current.previouslyAcceptedWithoutObservedEviction;
        total.firstOrUnknown += current.firstOrUnknown;
        total.acceptedOutcomes += current.acceptedOutcomes;
        total.rejectedOutcomes += current.rejectedOutcomes;
        total.staleVisibilityOutcomes += current.staleVisibilityOutcomes;
        total.outcomesWithoutObservedStart += current.outcomesWithoutObservedStart;
        for (const [reason, count] of Object.entries(current.evictionCountByReason)) {
          total.evictionCountByReason[reason] = (total.evictionCountByReason[reason] ?? 0) + count;
        }
        return total;
      }, {
        loadStarts: 0,
        previouslyRejectedRetry: 0,
        previouslyRejectedRetryAccepted: 0,
        previouslyRejectedRetryRejected: 0,
        acceptedThenEvictedRefetch: 0,
        acceptedThenEvictedRefetchAccepted: 0,
        acceptedThenEvictedRefetchRejected: 0,
        previouslyAcceptedWithoutObservedEviction: 0,
        firstOrUnknown: 0,
        acceptedOutcomes: 0,
        rejectedOutcomes: 0,
        staleVisibilityOutcomes: 0,
        outcomesWithoutObservedStart: 0,
        evictionCountByReason: {} as Record<string, number>,
      });
      const warmOpenTailNetwork = {
        apiRequestCount: interactionStartSnapshot.apiRequestCount - warmPostOpenSnapshot.apiRequestCount,
        chunkRequestCount: interactionStartSnapshot.chunkRequestCount - warmPostOpenSnapshot.chunkRequestCount,
        chunkBytes: interactionStartSnapshot.chunkBytes - warmPostOpenSnapshot.chunkBytes,
      };
      const interactionChunkIds = warm.chunkIds.slice(interactionStartSnapshot.chunkRequestCount);
      const uniqueInteractionChunkIds = new Set(interactionChunkIds);
      const interactionChunkIdsNotSeenDuringWarmOpen = Array.from(uniqueInteractionChunkIds)
        .filter((chunkId) => !warmFetchedChunkIds.has(chunkId));
      const firstOpenInitialChunkIds = new Set(first.initialChunkIds ?? []);
      const warmReopenInitialChunkIds = new Set(warm.initialChunkIds ?? []);
      const firstOpenOnlyChunkIds = Array.from(firstOpenInitialChunkIds)
        .filter((chunkId) => !warmReopenInitialChunkIds.has(chunkId)).sort();
      const warmReopenOnlyChunkIds = Array.from(warmReopenInitialChunkIds)
        .filter((chunkId) => !firstOpenInitialChunkIds.has(chunkId)).sort();
      const changedRequestIds = new Set([...firstOpenOnlyChunkIds, ...warmReopenOnlyChunkIds]);
      const summarizeInitialResourceEvents = (sample: RunSample) => {
        const events = sample.initialHostResourceEvents ?? [];
        return {
          eventCounts: events.reduce<Record<string, number>>((counts, event) => {
            counts[event.type] = (counts[event.type] ?? 0) + 1;
            if (event.type === "chunk-load-outcome" && event.status) counts[`outcome:${event.status}`] = (counts[`outcome:${event.status}`] ?? 0) + 1;
            return counts;
          }, {}),
          changedChunkEvents: events.filter((event) =>
            (event.chunkId && changedRequestIds.has(event.chunkId)) ||
            (event.evictedChunkIds ?? []).some((chunkId) => changedRequestIds.has(chunkId))
          ).map((event) => ({
            type: event.type,
            chunkId: event.chunkId,
            loadId: event.loadId,
            status: event.status,
            reason: event.reason,
            triggerChunkId: event.triggerChunkId,
            visibleSetRevision: event.visibleSetRevision,
            rejectionResources: event.rejectionResources,
            evictedChunkIds: event.evictedChunkIds,
            candidateCpuBytes: event.candidateCpuBytes,
            candidateGpuBufferBytes: event.candidateGpuBufferBytes,
            cpuResidentBytes: event.cpuResidentBytes,
          })),
        };
      };

      const report = {
        profileVersion: p00Profile.profileVersion,
        profileStatus: p00Profile.status,
        autoCadOracle: p00Profile.autoCadOracle.status,
        source: { id: "R001", sizeBytes: sourceSizeBytes, sha256: sourceSha256 },
        browserReleaseBenchmark,
        compilerLogEvidence: compilerLog.split(/\r?\n/).filter((line) => /libredwg|error|\b68\b/i.test(line)).slice(0, 8),
        canonicalEntityCount: p00Fixture.canonicalEntityCount,
        compilePhasesMs: p00Fixture.phasesMs,
        nodeProcessMemorySamples: p00Fixture.processMemorySamples,
        scene: {
          sceneId: compiled.manifest.sceneId,
          chunkCount: compiled.chunks.size,
          totalChunkBytes: Array.from(compiled.chunks.values()).reduce((sum, bytes) => sum + bytes.byteLength, 0),
          manifestSha256,
          compiledSceneSha256,
          roiCoverage: roiSummary,
        },
        firstOpen: summarizeRun(first),
        warmReopen: summarizeRun(warm),
        repeatability: {
          initialFetchedChunkSetStable: JSON.stringify(first.initialChunkIds) === JSON.stringify(warm.initialChunkIds),
          canvasScreenshotSha256Stable: first.canvasSha256 === warm.canvasSha256,
          initialFetchedChunkSetDifference: {
            firstOpenRequestCount: first.initialChunkRequestCount,
            warmReopenRequestCount: warm.initialChunkRequestCount,
            firstOpenUniqueCount: first.initialChunkIds?.length ?? 0,
            warmReopenUniqueCount: warm.initialChunkIds?.length ?? 0,
            firstOpenOnlyChunkIds,
            warmReopenOnlyChunkIds,
            firstOpenInitialResourceEvents: summarizeInitialResourceEvents(first),
            warmReopenInitialResourceEvents: summarizeInitialResourceEvents(warm),
          },
          sourceHashPreservedByCompiler: compiled.manifest.sourceSha256 === sourceSha256,
          manifestSha256,
          compiledSceneSha256,
        },
        panZoomInputToNextWebGlDrawMs: {
          sampleCount: interactions.inputToDrawMs.length,
          p50: quantile(interactions.inputToDrawMs, 0.5),
          p95: quantile(interactions.inputToDrawMs, 0.95),
          values: interactions.inputToDrawMs,
          kinds: interactions.inputKinds,
          definition: "Input event to first subsequent WebGL draw call; not GPU presentation or display latency.",
        },
        panZoomWebGlDrawFrameIntervalMs: {
          sampleCount: interactions.drawFrameIntervalsMs.length,
          p50: quantile(interactions.drawFrameIntervalsMs, 0.5),
          p95: drawFrameP95Ms,
          max: interactions.drawFrameIntervalsMs.length ? Math.max(...interactions.drawFrameIntervalsMs) : null,
          values: interactions.drawFrameIntervalsMs,
          targetMs: 20,
          targetMet: drawFrameP95Ms !== null && drawFrameP95Ms <= 20,
          definition: "Intervals between requestAnimationFrame callbacks that performed at least one CAD viewer WebGL draw during a 60-event wheel burst; compositor presentation and GPU completion are not measured.",
        },
        panZoomWebGlDrawFrameCallbackDurationMs: {
          sampleCount: interactions.drawFrameCallbackDurationsMs.length,
          p50: quantile(interactions.drawFrameCallbackDurationsMs, 0.5),
          p95: drawFrameCallbackDurationP95Ms,
          max: interactions.drawFrameCallbackDurationsMs.length
            ? Math.max(...interactions.drawFrameCallbackDurationsMs) : null,
          definition: "Synchronous duration of a requestAnimationFrame callback that issued a CAD WebGL draw; excludes compositor presentation and GPU completion.",
        },
        interactionLongTasks: {
          count: interactions.longTasks.length,
          maxDurationMs: Math.max(0, ...interactions.longTasks.map((task) => task.duration)),
        },
        interactionNetworkSamples,
        interactionTrafficBetweenSamples,
        interactionResourceDecisions: {
          ...interactionResourceDecisions,
          networkChunkRequests: postInteractionNetwork.chunkRequestCount,
          loadStartsMinusNetworkRequests: interactionResourceDecisions.loadStarts - postInteractionNetwork.chunkRequestCount,
          terminalOutcomes: interactionResourceDecisions.acceptedOutcomes + interactionResourceDecisions.rejectedOutcomes + interactionResourceDecisions.staleVisibilityOutcomes,
          loadStartsWithoutOutcome: interactionResourceDecisions.loadStarts - interactionResourceDecisions.acceptedOutcomes - interactionResourceDecisions.rejectedOutcomes - interactionResourceDecisions.staleVisibilityOutcomes,
        },
        warmOpenTailNetwork,
        networkDuringPanZoom: postInteractionNetwork,
        interactionRefetches: {
          requestsForChunksFetchedDuringWarmOpen: sampledInteractionTraffic.requestsForWarmFetchedChunks,
          bytesForChunksFetchedDuringWarmOpen: sampledInteractionTraffic.bytesForWarmFetchedChunks,
          uniqueChunkIdsFetchedDuringWarmOpen: warmFetchedChunkIds.size,
          uniqueChunkIdsRequestedDuringInteractions: uniqueInteractionChunkIds.size,
          uniqueInteractionChunkIdsNotSeenDuringWarmOpen: interactionChunkIdsNotSeenDuringWarmOpen.length,
        },
        limitations: [
          "This browser sample measures the current parser output; it is not clean-decode or AutoCAD semantic acceptance. Prior R001 decoder suites report LibreDWG error 68.",
          "WebGL bufferData byte total is upload-call volume, not live GPU residency or physical GPU allocation.",
          "JSHeapUsedSize is a Chromium page metric; process RSS is per-process Windows working set and shared pages can be double-counted.",
          "Host resource events expose temporary admission estimates and cache reasons; they are estimates, not physical GPU allocation or a whole-process peak measurement.",
          "P00 ROI coverage is bbox-to-chunk fetch mapping; without the native AutoCAD oracle it is not visual/semantic ROI parity.",
          "The 5x5, 10x10, and 20x20 camera grids count chunk-bbox intersections inside the measured initial viewport; cells without candidate chunks are excluded, and coarse cell occupancy is not pixel coverage, line density, readability, or semantic importance.",
          "The additional projected occupancy samples compiled stroke centerlines, tests fill-triangle intersections and optionally expands centerlines by a diagnostic CSS-pixel radius. It omits dash gaps, wipeout subtraction, layer visibility, overlap/paint order, anti-aliasing and GPU pixels; expanded masks are geometry proxies, not the renderer lineweight model or raster/AutoCAD fidelity.",
          "Raster occupancy compares the actual partial Chromium canvas screenshot against its sampled corner background. It counts occupied 20x20 cells, not pixel-level visual similarity; R001 still reports LibreDWG error 68.",
          "The early accepted-draw WebGL raster uses one synchronous default-framebuffer readPixels after the first accepted draw task. It can be empty before visible geometry is issued and is diagnostic only; non-empty settled canvas screenshot/raster gates remain required. It is not a compositor-presented screenshot, can stall the browser/GPU, and may perturb chunk-delivery timing.",
        ],
      };

      expect(first.loadedVertexCount).toBeGreaterThan(0);
      expect(warm.loadedVertexCount).toBeGreaterThan(0);
      expect(first.initialViewport?.viewportBBox).toHaveLength(4);
      expect(first.initialViewport?.visibleChunkCount).toBeGreaterThan(0);
      expect(first.screenshotViewport?.viewportBBox).toHaveLength(4);
      expect(first.screenshotViewport?.visibleChunkCount).toBeGreaterThan(0);
      expect(warm.initialViewport?.viewportBBox).toHaveLength(4);
      expect(first.initialViewport?.cameraState).toEqual(warm.initialViewport?.cameraState);
      expect(first.screenshotViewport?.cameraState).toEqual(warm.screenshotViewport?.cameraState);
      expect(projectedOccupancyByChunk.size).toBeGreaterThan(0);
      expect(first.rasterOccupancy?.foregroundPixelCount).toBeGreaterThan(0);
      expect(first.rasterOccupancy?.occupiedCellCount).toBeGreaterThan(0);
      expect(first.rasterOccupancy?.paddingCssPixels).toBe(1);
      expect(first.rasterOccupancy?.viewportWidthCss).toBe(first.screenshotViewport?.cameraState.width);
      expect(first.rasterOccupancy?.viewportHeightCss).toBe(first.screenshotViewport?.cameraState.height);
      expect(first.rasterOccupancy?.occupiedCellIds).toEqual(warm.rasterOccupancy?.occupiedCellIds);
      expect(first.rasterOccupancy?.thresholdSweep.map(({ colorDeltaThreshold, occupiedCellIds }) => [colorDeltaThreshold, occupiedCellIds]))
        .toEqual(warm.rasterOccupancy?.thresholdSweep.map(({ colorDeltaThreshold, occupiedCellIds }) => [colorDeltaThreshold, occupiedCellIds]));
      expect(first.rasterOccupancy?.gridSweep.map(({ gridSize, thresholdSweep }) => [gridSize, thresholdSweep.map(({ colorDeltaThreshold, occupiedCellIds }) => [colorDeltaThreshold, occupiedCellIds])]))
        .toEqual(warm.rasterOccupancy?.gridSweep.map(({ gridSize, thresholdSweep }) => [gridSize, thresholdSweep.map(({ colorDeltaThreshold, occupiedCellIds }) => [colorDeltaThreshold, occupiedCellIds])]));
      expect(first.initialChunkIds?.length).toBeGreaterThan(0);
      expect(warm.initialChunkIds?.length).toBeGreaterThan(0);
      expect(interactions.inputToDrawMs.length).toBe(11);
      for (const sample of [first, warm]) {
        const outcomes = (sample.hostResourceEvents ?? []).filter((event) =>
          event.type === "chunk-load-outcome" && (event.status === "accepted" || event.status === "rejected"));
        const accepted = outcomes.filter((event) => event.status === "accepted");
        const rejected = outcomes.filter((event) => event.status === "rejected");
        for (const event of accepted) {
          expect(event.cpuResidentBytes, `${sample.label} ${event.chunkId} accepted CPU estimate`).toBeDefined();
          expect(event.cpuBudgetBytes, `${sample.label} ${event.chunkId} CPU budget`).toBeDefined();
          expect(event.cpuResidentBytes).toBeLessThanOrEqual(event.cpuBudgetBytes!);
          expect(event.gpuBufferBytesEstimate, `${sample.label} ${event.chunkId} accepted GPU estimate`).toBeDefined();
          expect(event.gpuBudgetBytes, `${sample.label} ${event.chunkId} GPU budget`).toBeDefined();
          expect(event.gpuBufferBytesEstimate).toBeLessThanOrEqual(event.gpuBudgetBytes!);
        }
        for (const event of rejected) {
          expect(event.rejectionResources?.length, `${sample.label} ${event.chunkId} rejected resource reason`).toBeGreaterThan(0);
          const cpuOverBudget = typeof event.cpuResidentBytes === "number" && typeof event.cpuBudgetBytes === "number" &&
            event.cpuResidentBytes > event.cpuBudgetBytes;
          const gpuOverBudget = typeof event.gpuBufferBytesEstimate === "number" && typeof event.gpuBudgetBytes === "number" &&
            event.gpuBufferBytesEstimate > event.gpuBudgetBytes;
          expect(
            (event.rejectionResources?.includes("cpu") && cpuOverBudget) ||
              (event.rejectionResources?.includes("gpu") && gpuOverBudget),
            `${sample.label} ${event.chunkId} rejected candidate must exceed its declared budget`,
          ).toBe(true);
        }
        if (rejected.length > 0 || (sample.budgetSkippedChunkCount ?? 0) > 0) {
          expect(sample.qualityWarningText).toMatch(/kısmi/i);
        }
      }
      const resourceSummary = (sample: RunSample) => {
        const runSummary = summarizeRun(sample);
        const summary = runSummary.resourceDecisions;
        const compactPolicy = (policy: {
          acceptedChunks?: number;
          acceptedVertices?: number;
          bboxRoiChunkCoverage?: Array<{ roiId: string; candidateChunkCount: number; selectedChunkCount: number }>;
          sparseRoiSeedDetails?: Array<{ roiId: string; targetRoiIds: string[]; chunkId: string; vertices: number; estimatedCpuBytes: number; admitted: boolean }>;
          cameraViewportGridCoverageBySize?: Record<string, { candidateCellCount: number; selectedCellCount: number }>;
          projectedPrimitiveGridCoverage?: { candidateCellCount: number; selectedCellCount: number };
        }) => ({
          acceptedChunks: policy.acceptedChunks,
          acceptedVertices: policy.acceptedVertices,
          bboxRoiCoverage: policy.bboxRoiChunkCoverage?.filter((roi) => roi.candidateChunkCount > 0)
            .map((roi) => `${roi.roiId}:${roi.selectedChunkCount}/${roi.candidateChunkCount}`),
          sparseRoiSeeds: policy.sparseRoiSeedDetails?.map((seed) => `${seed.targetRoiIds.join("+")}:${seed.chunkId}:${seed.admitted ? "admitted" : "skipped"}`),
          viewportGridCoverage: policy.cameraViewportGridCoverageBySize
            ? Object.entries(policy.cameraViewportGridCoverageBySize)
              .map(([size, coverage]) => `${size}x${size}:${coverage.selectedCellCount}/${coverage.candidateCellCount}`)
            : undefined,
          projectedPrimitiveCoverage: policy.projectedPrimitiveGridCoverage
            ? `${policy.projectedPrimitiveGridCoverage.selectedCellCount}/${policy.projectedPrimitiveGridCoverage.candidateCellCount}`
            : undefined,
        });
        return {
          testOnlyPacedUnrankedChunkIds: sample.testOnlyPacedUnrankedChunkIds,
          requestOrderHead: sample.chunkIds.slice(0, 16),
          admissionOutcomeOrderHead: (sample.hostResourceEvents ?? [])
            .filter((event) => event.type === "chunk-load-outcome" && (event.status === "accepted" || event.status === "rejected"))
            .map((event) => event.chunkId)
            .filter((chunkId): chunkId is string => Boolean(chunkId))
            .slice(0, 16),
          firstVisibleContentFrame: summary.firstContentFrame,
          firstContentFrameFramebufferRaster: sample.firstContentFrameRaster ? {
            ...sample.firstContentFrameRaster,
            captureDelayAfterFirstAcceptedMs: typeof summary.firstContentFrame.firstAcceptedAtPerformanceMs === "number"
              ? sample.firstContentFrameRaster.capturedAtPerformanceMs - summary.firstContentFrame.firstAcceptedAtPerformanceMs
              : null,
          } : null,
          actualBudgetPeakEstimates: {
            acceptedResidentCpuBytes: summary.peakAcceptedResidentCpuBytes,
            rejectedCandidateCpuBytes: summary.peakRejectedCandidateCpuBytes,
            cpuBudgetBytes: summary.cpuBudgetBytes,
            acceptedResidentGpuBufferBytesEstimate: summary.peakAcceptedResidentGpuBufferBytesEstimate,
            rejectedCandidateGpuBufferBytesEstimate: summary.peakRejectedCandidateGpuBufferBytesEstimate,
            gpuBudgetBytes: summary.gpuBudgetBytes,
          },
          settledMs: runSummary.initialVisibleChunksSettledMs,
          hostInteractiveMs: runSummary.hostInteractiveMs,
          loadedVertexCount: runSummary.loadedVertexCount,
          budgetSkippedChunkCount: runSummary.budgetSkippedChunkCount,
          initialVisibleChunks: runSummary.initialVisibleChunks,
          canvasSha256: runSummary.canvasSha256,
          initialViewport: runSummary.initialViewport,
          screenshotViewport: runSummary.screenshotViewport,
          rasterOccupancy: runSummary.rasterOccupancy,
          projectedPrimitiveGridModel: summary.admissionOrderWhatIf.projectedPrimitiveGridModel,
          projectedRasterComparison: summary.admissionOrderWhatIf.projectedRasterComparison,
          actual: compactPolicy(summary.admissionOrderWhatIf.actual),
          greedyVertexYieldPerEstimatedCpuByte: compactPolicy(summary.admissionOrderWhatIf.greedyVertexYieldPerEstimatedCpuByte),
          greedyLowestEstimatedCpuCost: compactPolicy(summary.admissionOrderWhatIf.greedyLowestEstimatedCpuCost),
          greedySmallestManifestChunkFirst: compactPolicy(summary.admissionOrderWhatIf.greedySmallestManifestChunkFirst),
          sparseRoiRepresentativeThenVertexYield: compactPolicy(summary.admissionOrderWhatIf.sparseRoiRepresentativeThenVertexYield),
          sparseRoiMarginalCoveragePerCpuByte: compactPolicy(summary.admissionOrderWhatIf.sparseRoiMarginalCoveragePerCpuByte),
          cameraViewportGrid5MarginalCoveragePerCpuByte: compactPolicy(summary.admissionOrderWhatIf.cameraViewportGrid5MarginalCoveragePerCpuByte),
          cameraViewportGrid10MarginalCoveragePerCpuByte: compactPolicy(summary.admissionOrderWhatIf.cameraViewportGrid10MarginalCoveragePerCpuByte),
          cameraViewportGrid20MarginalCoveragePerCpuByte: compactPolicy(summary.admissionOrderWhatIf.cameraViewportGrid20MarginalCoveragePerCpuByte),
          cameraProjectedPrimitiveGrid20MarginalCoveragePerCpuByte: compactPolicy(summary.admissionOrderWhatIf.cameraProjectedPrimitiveGrid20MarginalCoveragePerCpuByte),
        };
      };
      const rasterDiagnosticSummary = async (sample: RunSample) => {
        const runSummary = summarizeRun(sample);
        const admission = runSummary.resourceDecisions.admissionOrderWhatIf;
        const rasterOnlyCells = admission.projectedRasterComparison.rasterOnlyCellDetails;
        const viewport = sample.screenshotViewport?.cameraState;
        const screenshot = canvasScreenshots.get(sample.label);
        if (!viewport || !screenshot) throw new Error(`P00 ${sample.label} is missing the raster provenance inputs.`);
        const expansionSweep = admission.projectedRasterComparison.centerlineRadiusSweepAt20x20;
        const smallestRadiusProjectedOnlyIds = expansionSweep[0]?.projectedOnlyCellIds ?? [];
        const targetCellIds = [...new Set([
          ...rasterOnlyCells.map((cell: { cellId: number }) => cell.cellId),
          ...smallestRadiusProjectedOnlyIds,
        ])];
        const rasterPixels = await sampleP00CanvasCellPixels(page, screenshot, targetCellIds, {
          widthCss: viewport.width,
          heightCss: viewport.height,
          paddingCssPixels: 1,
        });
        const acceptedChunkIds = new Set((sample.hostResourceEvents ?? [])
          .filter((event) => event.type === "chunk-load-outcome" && event.status === "accepted" && event.chunkId)
          .map((event) => event.chunkId!));
        const rasterAndProjectedOnlyPixelSourceTrace = traceP00RasterCellSources({
          pixels: rasterPixels.points,
          cellIds: targetCellIds,
          acceptedChunkIds,
          modelChunks,
          compiledChunks: compiled.chunks,
          viewport: {
            width: viewport.width,
            height: viewport.height,
            center: viewport.center,
            unitsPerCssPixel: viewport.unitsPerCssPixel,
            paddingCssPixels: 1,
          },
        });
        return {
          screenshotCameraMatchesInitial: JSON.stringify(sample.screenshotViewport?.cameraState) === JSON.stringify(sample.initialViewport?.cameraState),
          canvasCssBox: sample.canvasCssBox ?? null,
          rendererCompatibleProjectionSourceCounts: admission.projectedPrimitiveGridModel.rendererCompatibleProjectionSourceCounts,
          candidateProjectedCellCount: admission.projectedPrimitiveGridModel.candidateCellCount,
          acceptedProjectedCellCount: admission.projectedRasterComparison.acceptedProjectedCellCount,
          thresholds: admission.projectedRasterComparison.byColorDeltaThreshold,
          gridSizes: admission.projectedRasterComparison.byGridSize,
          centerlineRadiusSweepAt20x20: admission.projectedRasterComparison.centerlineRadiusSweepAt20x20,
          cellPixelCountSensitivityAt20x20: admission.projectedRasterComparison.cellPixelCountSensitivityAt20x20,
          rasterOnlyCellDetails: rasterOnlyCells,
          radiusSweepProjectedOnlyCellIds: smallestRadiusProjectedOnlyIds,
          rasterAndProjectedOnlyPixelSourceTrace,
        };
      };
      const firstOpenSummary = summarizeRun(first);
      console.log(`F08 P00 initial budget rejection spatial coverage: ${JSON.stringify(firstOpenSummary.resourceDecisions.budgetRejectedCoverage)}`);
      if (!first.initialViewport) throw new Error("P00 initial open did not capture the viewport used for scheduler admission.");
      const visibleAdmissionCandidates = compiled.manifest.chunks.filter((chunk) =>
        chunk.layoutId === first.initialViewport!.layoutId &&
        (!chunk.bbox || boxesOverlap(chunk.bbox, first.initialViewport!.viewportBBox)));
      const prioritizedVisibleChunks = prioritizeChunksByViewportCoverage(
        visibleAdmissionCandidates,
        first.initialViewport.viewportBBox,
      );
      const visibleAdmissionIds = new Set(prioritizedVisibleChunks.map((chunk) => chunk.chunkId));
      const productionSchedulerOrder = [
        ...prioritizedVisibleChunks.map((chunk) => chunk.chunkId),
        ...compiled.manifest.chunks.filter((chunk) => !visibleAdmissionIds.has(chunk.chunkId)).map((chunk) => chunk.chunkId),
      ];
      const initialStartedOrder = (first.initialHostResourceEvents ?? [])
        .filter((event) => event.type === "chunk-load-start")
        .map((event) => event.chunkId).filter((chunkId): chunkId is string => Boolean(chunkId));
      expect(initialStartedOrder.slice(0, 12), "Actual first-open host admission order matches bbox coverage priority")
        .toEqual(productionSchedulerOrder.slice(0, 12));
      const projectedGridPlan = firstOpenSummary.resourceDecisions.admissionOrderWhatIf.cameraProjectedPrimitiveGrid20MarginalCoveragePerCpuByte;
      if (!projectedGridPlan.available || !projectedGridPlan.orderedChunkIds.length) {
        throw new Error("P00 projected-grid replay has no complete test-only chunk order.");
      }
      replayChunkOrder = projectedGridPlan.orderedChunkIds;
      const projectedGridReplay = await openAndSample("projected-grid-replay", true);
      const assertReplayInitialPrefix = (sample: RunSample, expected: string[]) => {
        const observedRequests = sample.chunkIds.slice(0, expected.length);
        const observedOutcomes = sample.hostResourceEvents
          ?.filter((event) => event.type === "chunk-load-outcome" && (event.status === "accepted" || event.status === "rejected"))
          .map((event) => event.chunkId).filter((chunkId): chunkId is string => Boolean(chunkId)).slice(0, expected.length) ?? [];
        expect(observedRequests).toEqual(expected);
        expect(observedOutcomes).toEqual(expected);
      };
      assertReplayInitialPrefix(projectedGridReplay, productionSchedulerOrder.slice(0, 12));
      expect(projectedGridReplay.initialViewport?.cameraState).toEqual(first.initialViewport?.cameraState);
      expect(projectedGridReplay.hostResourceEvents?.filter((event) => event.type === "chunk-load-outcome").length).toBeGreaterThan(0);
      projectedGridReplay.rasterOccupancy = await measureP00CanvasRasterOccupancy(
        page,
        canvasScreenshots.get(projectedGridReplay.label)!,
        [5, 10, 20],
        rasterViewport(projectedGridReplay),
      );
      const viewportGridPlan = summarizeRun(first).resourceDecisions.admissionOrderWhatIf.cameraViewportGrid20MarginalCoveragePerCpuByte;
      if (!viewportGridPlan.available || !viewportGridPlan.orderedChunkIds.length) {
        throw new Error("P00 viewport-grid replay has no complete test-only chunk order.");
      }
      replayChunkOrder = viewportGridPlan.orderedChunkIds;
      const viewportGridReplay = await openAndSample("viewport-grid-replay", true);
      assertReplayInitialPrefix(viewportGridReplay, productionSchedulerOrder.slice(0, 12));
      expect(viewportGridReplay.initialViewport?.cameraState).toEqual(first.initialViewport?.cameraState);
      expect(viewportGridReplay.hostResourceEvents?.filter((event) => event.type === "chunk-load-outcome").length).toBeGreaterThan(0);
      viewportGridReplay.rasterOccupancy = await measureP00CanvasRasterOccupancy(
        page,
        canvasScreenshots.get(viewportGridReplay.label)!,
        [5, 10, 20],
        rasterViewport(viewportGridReplay),
      );
      // Controlled response pacing must use the real host order; alternate manifest orders
      // are normalized by the production viewport scheduler before requests are issued.
      const baselineManifestOrder = productionSchedulerOrder;
      const openPacedReplay = async (
        label: RunSample["label"],
        order: string[],
        captureAcceptedChunkCount = 6,
      ): Promise<RunSample> => {
        replayChunkOrder = order;
        pacedAcceptedTarget = captureAcceptedChunkCount;
        paceAcceptedTierCapture = true;
        pacedTierCapturePromise = new Promise<void>((resolve) => {
          releasePacedTierResponses = resolve;
        });
        let sample: RunSample;
        try {
          sample = await openAndSample(label, true, captureAcceptedChunkCount);
        } finally {
          releasePacedTierResponses?.();
          releasePacedTierResponses = null;
          pacedTierCapturePromise = Promise.resolve();
          paceAcceptedTierCapture = false;
          pacedAcceptedTarget = 0;
        }
        const tierOrder = order.slice(0, captureAcceptedChunkCount);
        const tierChunkIds = new Set(tierOrder);
        expect(sample.chunkIds.filter((chunkId) => tierChunkIds.has(chunkId)).slice(0, captureAcceptedChunkCount)).toEqual(tierOrder);
        expect(sample.firstContentFrameRaster?.acceptedChunkCountAtCapture).toBe(captureAcceptedChunkCount);
        expect(sample.firstContentFrameRaster?.acceptedChunkIdsAtCapture).toEqual(tierOrder);
        expect(sample.hostResourceEvents
          ?.filter((event) => event.type === "chunk-load-outcome" && (event.status === "accepted" || event.status === "rejected"))
          .map((event) => event.chunkId).filter((chunkId): chunkId is string => Boolean(chunkId)).slice(0, captureAcceptedChunkCount))
          .toEqual(tierOrder);
        expect(sample.initialViewport?.cameraState).toEqual(first.initialViewport?.cameraState);
        expect(sample.hostResourceEvents?.filter((event) => event.type === "chunk-load-outcome").length).toBeGreaterThan(0);
        sample.rasterOccupancy = await measureP00CanvasRasterOccupancy(
          page,
          canvasScreenshots.get(sample.label)!,
          [5, 10, 20],
          rasterViewport(sample),
        );
        return sample;
      };
      const baselinePacedReplay = await openPacedReplay("baseline-paced-replay", baselineManifestOrder);
      const projectedGridPacedReplay = await openPacedReplay("projected-grid-paced-replay", productionSchedulerOrder);
      const viewportGridPacedReplay = await openPacedReplay("viewport-grid-paced-replay", productionSchedulerOrder);
      const baselinePaced12Replay = await openPacedReplay("baseline-paced-12-replay", baselineManifestOrder, 12);
      const projectedGridPaced12Replay = await openPacedReplay("projected-grid-paced-12-replay", productionSchedulerOrder, 12);
      const viewportGridPaced12Replay = await openPacedReplay("viewport-grid-paced-12-replay", productionSchedulerOrder, 12);
      const baselinePaced18Replay = await openPacedReplay("baseline-paced-18-replay", baselineManifestOrder, 18);
      const projectedGridPaced18Replay = await openPacedReplay("projected-grid-paced-18-replay", productionSchedulerOrder, 18);
      const viewportGridPaced18Replay = await openPacedReplay("viewport-grid-paced-18-replay", productionSchedulerOrder, 18);
      const rasterDiagnosticSamples = await Promise.all([
        rasterDiagnosticSummary(first),
        rasterDiagnosticSummary(warm),
        rasterDiagnosticSummary(projectedGridReplay),
        rasterDiagnosticSummary(viewportGridReplay),
        rasterDiagnosticSummary(baselinePacedReplay),
        rasterDiagnosticSummary(projectedGridPacedReplay),
        rasterDiagnosticSummary(viewportGridPacedReplay),
        rasterDiagnosticSummary(baselinePaced12Replay),
        rasterDiagnosticSummary(projectedGridPaced12Replay),
        rasterDiagnosticSummary(viewportGridPaced12Replay),
        rasterDiagnosticSummary(baselinePaced18Replay),
        rasterDiagnosticSummary(projectedGridPaced18Replay),
        rasterDiagnosticSummary(viewportGridPaced18Replay),
      ]);
      console.log(`F08 P00 projected/raster alignment: ${JSON.stringify({ firstOpen: rasterDiagnosticSamples[0], warmReopen: rasterDiagnosticSamples[1], projectedGridReplay: rasterDiagnosticSamples[2], viewportGridReplay: rasterDiagnosticSamples[3], baselinePacedReplay: rasterDiagnosticSamples[4], projectedGridPacedReplay: rasterDiagnosticSamples[5], viewportGridPacedReplay: rasterDiagnosticSamples[6] })}`);
      console.log(`F08 P00 admission-order counterfactual: ${JSON.stringify({ firstOpen: resourceSummary(first), warmReopen: resourceSummary(warm) })}`);
      console.log(`F08 P00 projected-grid cold replay: ${JSON.stringify({
        testOnlyManifestOrder: {
          candidateCount: projectedGridPlan.orderedChunkIds.length,
          orderSha256: sha256(projectedGridPlan.orderedChunkIds.join("\n")),
          firstSixteenChunkIds: projectedGridPlan.orderedChunkIds.slice(0, 16),
        },
        baseline: resourceSummary(first),
        replay: resourceSummary(projectedGridReplay),
      })}`);
      console.log(`F08 P00 viewport-grid cold replay: ${JSON.stringify({
        testOnlyManifestOrder: {
          candidateCount: viewportGridPlan.orderedChunkIds.length,
          orderSha256: sha256(viewportGridPlan.orderedChunkIds.join("\n")),
          firstSixteenChunkIds: viewportGridPlan.orderedChunkIds.slice(0, 16),
        },
        baseline: resourceSummary(first),
        projectedGridReplay: resourceSummary(projectedGridReplay),
        replay: resourceSummary(viewportGridReplay),
      })}`);
      console.log(`F08 P00 first-tier paced replay: ${JSON.stringify({
        testOnlyResponsePacing: {
          firstTierChunkCount: 6,
          firstTierDelayMsByRank: 12,
          remainderDelayMs: 250,
          framebufferCaptureAcceptedTarget: 6,
        },
        baseline: resourceSummary(baselinePacedReplay),
        projectedGrid: resourceSummary(projectedGridPacedReplay),
        viewportGrid: resourceSummary(viewportGridPacedReplay),
      })}`);
      console.log(`F08 P00 twelve-accepted paced replay: ${JSON.stringify({
        testOnlyResponsePacing: {
          firstTierChunkCount: 6,
          firstTierDelayMsByRank: 12,
          remainderDelayMs: 250,
          framebufferCaptureAcceptedTarget: 12,
        },
        baseline: resourceSummary(baselinePaced12Replay),
        projectedGrid: resourceSummary(projectedGridPaced12Replay),
        viewportGrid: resourceSummary(viewportGridPaced12Replay),
      })}`);
      console.log(`F08 P00 eighteen-accepted paced replay: ${JSON.stringify({
        testOnlyResponsePacing: {
          firstTierChunkCount: 6,
          firstTierDelayMsByRank: 12,
          remainderDelayMs: 250,
          framebufferCaptureAcceptedTarget: 18,
        },
        baseline: resourceSummary(baselinePaced18Replay),
        projectedGrid: resourceSummary(projectedGridPaced18Replay),
        viewportGrid: resourceSummary(viewportGridPaced18Replay),
      })}`);
      console.log(`F08 P00 R001 browser sample: ${JSON.stringify(report)}`);
    } finally {
      activeRun = null;
      await browserCdp.detach().catch(() => {});
      if (p00TempDirectories.has(fixtureDirectory)) {
        const resolved = path.resolve(fixtureDirectory);
        const relative = path.relative(path.resolve(tmpdir()), resolved);
        if (relative.startsWith("..") || path.isAbsolute(relative)) throw new Error("P00 fixture cleanup target escaped the OS temp directory");
        rmSync(resolved, { recursive: true, force: true });
        p00TempDirectories.delete(fixtureDirectory);
      }
    }
  });
});
