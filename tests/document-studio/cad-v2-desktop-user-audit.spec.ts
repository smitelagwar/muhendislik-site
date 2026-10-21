import { expect, test, type Locator, type Page } from "@playwright/test";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { signInAdmin } from "./cad-test-helpers";

type CanvasRasterRoiMetrics = {
  width: number;
  height: number;
  foregroundPixelCount: number;
  roiForegroundPixelCounts: number[];
};

type ProductionDataSnapshot = {
  databaseSha256: string | null;
  fileIds: string[];
  folderIds: string[];
  files: string[];
};

let sourceDatabaseBefore: ProductionDataSnapshot | null = null;

function snapshotProductionData(): ProductionDataSnapshot {
  const sourceDataDir = path.resolve(process.cwd(), ".data");
  const dbPath = path.join(sourceDataDir, "dok_db.json");
  let databaseSha256: string | null = null;
  let fileIds: string[] = [];
  let folderIds: string[] = [];
  if (fs.existsSync(dbPath)) {
    const bytes = fs.readFileSync(dbPath);
    const parsed = JSON.parse(bytes.toString("utf8"));
    databaseSha256 = crypto.createHash("sha256").update(bytes).digest("hex");
    fileIds = (parsed.files || []).map((file: { id?: string }) => file.id ?? "").sort();
    folderIds = (parsed.folders || []).map((folder: { id?: string }) => folder.id ?? "").sort();
  }

  const files: string[] = [];
  const visit = (dir: string) => {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const absolute = path.join(dir, entry.name);
      if (entry.isDirectory()) visit(absolute);
      else if (entry.isFile()) {
        const stat = fs.statSync(absolute);
        files.push(`${path.relative(sourceDataDir, absolute)}\0${stat.size}\0${stat.mtimeMs}`);
      }
    }
  };
  visit(sourceDataDir);
  files.sort();
  return { databaseSha256, fileIds, folderIds, files };
}

function getExpectedSourceSha256(fileId: string): string {
  const dataDir = path.resolve(process.env.DOK_LOCAL_DATA_DIR || "");
  const dbPath = path.join(dataDir, "dok_db.json");
  const parsed = JSON.parse(fs.readFileSync(dbPath, "utf8"));
  const record = (parsed.files || []).find((file: { id?: string }) => file.id === fileId);
  if (!record?.blob_pathname || typeof record.blob_pathname !== "string") {
    throw new Error(`Isolated test DB has no storage path for CAD file ${fileId}.`);
  }
  const relativePath = record.blob_pathname.replace(/^local:/, "");
  const sourcePath = path.resolve(dataDir, relativePath);
  const relativeSource = path.relative(dataDir, sourcePath);
  if (!relativeSource || relativeSource === ".." || relativeSource.startsWith(`..${path.sep}`) || path.isAbsolute(relativeSource)) {
    throw new Error(`CAD source path escapes isolated test storage: ${record.blob_pathname}`);
  }
  return crypto.createHash("sha256").update(fs.readFileSync(sourcePath)).digest("hex");
}

async function measureCanvasRasterRois(page: Page, canvas: Locator): Promise<CanvasRasterRoiMetrics> {
  const png = await canvas.screenshot();
  return page.evaluate(async (pngBase64) => {
    const image = new Image();
    image.src = `data:image/png;base64,${pngBase64}`;
    await image.decode();
    const pixelsCanvas = document.createElement("canvas");
    pixelsCanvas.width = image.naturalWidth;
    pixelsCanvas.height = image.naturalHeight;
    const context = pixelsCanvas.getContext("2d", { willReadFrequently: true });
    if (!context || pixelsCanvas.width <= 0 || pixelsCanvas.height <= 0) {
      throw new Error("CAD canvas raster screenshot could not be decoded.");
    }
    context.drawImage(image, 0, 0);
    const pixels = context.getImageData(0, 0, pixelsCanvas.width, pixelsCanvas.height).data;
    const patchSize = Math.min(8, pixelsCanvas.width, pixelsCanvas.height);
    const backgroundCounts = new Map<string, { rgba: number[]; count: number }>();
    const corners = [
      [0, 0], [pixelsCanvas.width - patchSize, 0],
      [0, pixelsCanvas.height - patchSize], [pixelsCanvas.width - patchSize, pixelsCanvas.height - patchSize],
    ];
    for (const [left, top] of corners) {
      for (let y = top!; y < top! + patchSize; y++) {
        for (let x = left!; x < left! + patchSize; x++) {
          const offset = (y * pixelsCanvas.width + x) * 4;
          const rgba = [pixels[offset]!, pixels[offset + 1]!, pixels[offset + 2]!, pixels[offset + 3]!];
          const key = rgba.join(",");
          const previous = backgroundCounts.get(key);
          backgroundCounts.set(key, { rgba, count: (previous?.count ?? 0) + 1 });
        }
      }
    }
    const background = Array.from(backgroundCounts.values()).sort((a, b) => b.count - a.count)[0]!.rgba;
    const gridSize = 4;
    const roiForegroundPixelCounts = new Array<number>(gridSize * gridSize).fill(0);
    let foregroundPixelCount = 0;
    for (let y = 0; y < pixelsCanvas.height; y++) {
      for (let x = 0; x < pixelsCanvas.width; x++) {
        const offset = (y * pixelsCanvas.width + x) * 4;
        const colorDelta = Math.max(
          Math.abs(pixels[offset]! - background[0]!),
          Math.abs(pixels[offset + 1]! - background[1]!),
          Math.abs(pixels[offset + 2]! - background[2]!),
        );
        const alpha = pixels[offset + 3]!;
        if (alpha === 0 || (colorDelta < 64 && alpha >= 250)) continue;
        foregroundPixelCount++;
        const column = Math.min(gridSize - 1, Math.floor(x / pixelsCanvas.width * gridSize));
        const row = Math.min(gridSize - 1, Math.floor(y / pixelsCanvas.height * gridSize));
        roiForegroundPixelCounts[row * gridSize + column] += 1;
      }
    }
    return { width: pixelsCanvas.width, height: pixelsCanvas.height, foregroundPixelCount, roiForegroundPixelCounts };
  }, png.toString("base64"));
}

// 5 Masaüstü CAD Projesi
const DESKTOP_CAD_FILES = [
  {
    id: "eaf08496-5d17-48a0-99c1-8895ade19c20",
    name: "1 ve 2.kat dwg.dwg",
    format: "DWG",
    expectedLayouts: ["Model", "Layout1", "Layout2"],
  },
  {
    id: "deecc9ce-6438-44a1-b2e7-b60e1135ca09",
    name: "kalip_plani_zeminkat.dxf",
    format: "DXF",
    expectedLayouts: ["Model", "Layout1"],
  },
  {
    id: "17611705-1dcd-4740-8399-cddee29d9803",
    name: "mustafa selvimimariiiii.dwg",
    format: "DWG",
    expectedLayouts: ["Model", "Layout1", "Layout2"],
  },
  {
    id: "2b642224-ece9-49a4-b02e-45d67b6ba1fa",
    name: "SÜHEYLA KARA STATİK (HAFİF) - Kopya.dwg",
    format: "DWG",
    expectedLayouts: ["Model", "Layout1", "Layout2"],
  },
  {
    id: "c3b47f50-6cfc-4b87-9e57-5097d8a1500d",
    name: "SÜHEYLA KARA STATİK (HAFİF) - Kopya.dxf",
    format: "DXF",
    expectedLayouts: ["Model", "Layout1", "Layout2"],
  },
] as const;

test.describe("CAD V2 Gerçek Kullanıcı Masaüstü CAD Dosyaları Test Paketi", () => {
  test.beforeAll(async () => {
    const pointerFile = path.join(process.cwd(), ".test-data", "active-test-dir.txt");
    if (!fs.existsSync(pointerFile)) throw new Error("Desktop audit için run-level .test-data dizini bulunamadı.");
    const targetDir = path.resolve(fs.readFileSync(pointerFile, "utf8").trim());
    const expectedRunDir = process.env.DOK_LOCAL_DATA_DIR?.trim();
    const sourceDataDir = path.resolve(process.cwd(), ".data");
    const testDataRoot = path.resolve(process.cwd(), ".test-data");
    const relativeRunPath = path.relative(testDataRoot, targetDir);
    if (!relativeRunPath || relativeRunPath === ".." || relativeRunPath.startsWith(`..${path.sep}`) || path.isAbsolute(relativeRunPath)) {
      throw new Error(`Desktop audit run directory .test-data dışında: ${targetDir}`);
    }
    if (expectedRunDir && path.resolve(expectedRunDir) !== targetDir) {
      throw new Error("Desktop audit process ve active-test-dir farklı test depolarını gösteriyor.");
    }
    if (targetDir === sourceDataDir) throw new Error("Desktop audit production .data dizinine yazmayı reddetti.");

    if (!fs.existsSync(path.join(targetDir, "dok_db.json"))) {
      throw new Error(`Playwright server/test storage was not seeded before browser startup: ${targetDir}`);
    }
    sourceDatabaseBefore = snapshotProductionData();
  });

  test.afterAll(async () => {
    if (sourceDatabaseBefore) expect(snapshotProductionData()).toEqual(sourceDatabaseBefore);
  });

  test("Büyük DWG ilk gerçek WebGL frame'i çizdiğinde yükleme perdesi kalkar ve aktarım durumu görünür kalır", async ({ page }, testInfo) => {
    const sampleDurationMs = Number.parseInt(process.env.CAD_V2_STREAM_PROFILE_MS ?? "5000", 10);
    const trackLargeArrayFilters = process.env.CAD_V2_TRACK_LARGE_FILTERS !== "0";
    const requireBudgetPressure = process.env.CAD_V2_REQUIRE_BUDGET_PRESSURE === "1";
    test.setTimeout(sampleDurationMs + 90_000);
    let navigationStartedAt = 0;
    const networkMilestones: Array<{ endpoint: string; status: number; elapsedMs: number }> = [];
    const chunkRequestCounts = new Map<string, number>();
    const rendererBudgetRejections: Array<Record<string, unknown>> = [];
    const postInteractionChunkRequests: Array<{ chunkId: string; elapsedMs: number }> = [];
    const postInteractionChunkResponses: Array<{ chunkId: string; status: number; elapsedMs: number }> = [];
    let viewportActionStartedAt: number | null = null;
    let requestCountAtFirstBudgetRejection: number | null = null;
    let chunkRequestsFiveSecondsAfterRejection: number | null = null;
    page.on("console", (message) => {
      const text = message.text();
      if (!text.startsWith("[CAD_V2_BUDGET_REJECTION] ")) return;
      const event = JSON.parse(text.slice("[CAD_V2_BUDGET_REJECTION] ".length)) as Record<string, unknown>;
      rendererBudgetRejections.push(event);
      requestCountAtFirstBudgetRejection ??= Array.from(chunkRequestCounts.values()).reduce((total, count) => total + count, 0);
      console.log("[CAPTURED BIG DWG BUDGET REJECTION]", JSON.stringify({
        event,
        chunkRequestsSoFar: requestCountAtFirstBudgetRejection,
      }));
      if (rendererBudgetRejections.length === 1) {
        setTimeout(() => {
          chunkRequestsFiveSecondsAfterRejection = Array.from(chunkRequestCounts.values()).reduce((total, count) => total + count, 0);
          console.log("[BIG DWG REQUESTS FIVE SECONDS AFTER BUDGET REJECTION]", JSON.stringify({
            requestCountAtRejection: requestCountAtFirstBudgetRejection,
            requestCountAfterFiveSeconds: chunkRequestsFiveSecondsAfterRejection,
          }));
        }, 5_000);
      }
    });
    page.on("request", (request) => {
      const url = new URL(request.url());
      if (url.pathname.includes("/api/dokumantasyon/cad-v2/") && url.pathname.includes("/chunks/")) {
        const chunkId = decodeURIComponent(url.pathname.split("/").at(-1) ?? "");
        chunkRequestCounts.set(chunkId, (chunkRequestCounts.get(chunkId) ?? 0) + 1);
        if (viewportActionStartedAt !== null) {
          postInteractionChunkRequests.push({ chunkId, elapsedMs: Date.now() - viewportActionStartedAt });
        }
        if (!networkMilestones.some((item) => item.endpoint === "chunk-request")) {
          networkMilestones.push({ endpoint: "chunk-request", status: 0, elapsedMs: Date.now() - navigationStartedAt });
        }
      }
    });
    page.on("response", (response) => {
      const url = new URL(response.url());
      if (!url.pathname.includes("/api/dokumantasyon/cad-v2/")) return;
      const endpoint = url.pathname.endsWith("/prepare")
        ? "prepare"
        : url.pathname.endsWith("/manifest")
          ? "manifest"
          : url.pathname.includes("/chunks/")
            ? "chunk"
            : null;
      if (endpoint === "chunk" && viewportActionStartedAt !== null) {
        postInteractionChunkResponses.push({
          chunkId: decodeURIComponent(url.pathname.split("/").at(-1) ?? ""),
          status: response.status(),
          elapsedMs: Date.now() - viewportActionStartedAt,
        });
      }
      if (endpoint && (endpoint !== "chunk" || !networkMilestones.some((item) => item.endpoint === "chunk"))) {
        networkMilestones.push({ endpoint, status: response.status(), elapsedMs: Date.now() - navigationStartedAt });
      }
    });
    await page.addInitScript((trackLargeArrayFilters) => {
      const testWindow = window as Window & {
        __cadV2ResourceDiagnostics?: (event: Record<string, unknown>) => void;
        __cadV2ResourceDiagnosticEvents?: Array<Record<string, unknown>>;
        __cadV2FirstBudgetRejectionLogged?: boolean;
        __cadV2ResourceDiagnosticSummary?: {
          startCount: number;
          outcomeCount: number;
          acceptedCount: number;
          rejectedCount: number;
          acceptedChunkIds: string[];
          latestCpuResidentBytes: number | null;
          latestGpuBufferBytes: number | null;
          latestStatus: string | null;
          firstRejection: Record<string, unknown> | null;
          latestAcceptedOutcome: Record<string, unknown> | null;
          retryTargetChunkId: string | null;
          retryAcceptedOutcome: Record<string, unknown> | null;
        };
        __cadV2ViewportSummary?: { count: number; last: Record<string, unknown> | null };
        __cadV2LargeArrayFilterMetrics?: { calls: number; visitedItems: number; callSites: string[] };
      };
      testWindow.__cadV2ResourceDiagnosticEvents = [];
      testWindow.__cadV2ResourceDiagnosticSummary = {
        startCount: 0,
        outcomeCount: 0,
        acceptedCount: 0,
        rejectedCount: 0,
        acceptedChunkIds: [],
        latestCpuResidentBytes: null,
        latestGpuBufferBytes: null,
        latestStatus: null,
        firstRejection: null,
        latestAcceptedOutcome: null,
        retryTargetChunkId: null,
        retryAcceptedOutcome: null,
      };
      testWindow.__cadV2ViewportSummary = { count: 0, last: null };
      testWindow.__cadV2ResourceDiagnostics = (event) => {
        const summary = testWindow.__cadV2ResourceDiagnosticSummary!;
        if (event.type === "chunk-load-start") summary.startCount++;
        if (event.type === "chunk-load-outcome") {
          summary.outcomeCount++;
          summary.latestStatus = typeof event.status === "string" ? event.status : null;
          summary.latestCpuResidentBytes = typeof event.cpuResidentBytes === "number" ? event.cpuResidentBytes : summary.latestCpuResidentBytes;
          summary.latestGpuBufferBytes = typeof event.gpuBufferBytesEstimate === "number" ? event.gpuBufferBytesEstimate : summary.latestGpuBufferBytes;
          if (event.status === "accepted") {
            summary.acceptedCount++;
            if (typeof event.chunkId === "string") summary.acceptedChunkIds.push(event.chunkId);
            summary.latestAcceptedOutcome = event;
            if (event.chunkId === summary.retryTargetChunkId) summary.retryAcceptedOutcome = event;
          }
          if (event.status === "rejected") {
            summary.rejectedCount++;
            summary.firstRejection ??= event;
            if (!testWindow.__cadV2FirstBudgetRejectionLogged) {
              testWindow.__cadV2FirstBudgetRejectionLogged = true;
              console.log("[CAD_V2_BUDGET_REJECTION]", JSON.stringify(event));
            }
          }
        }
        if (event.type === "viewport-snapshot") {
          const viewport = testWindow.__cadV2ViewportSummary!;
          viewport.count++;
          viewport.last = event;
        }
        if (testWindow.__cadV2ResourceDiagnosticEvents!.length < 200) {
          testWindow.__cadV2ResourceDiagnosticEvents!.push(event);
        }
      };
      const largeArrayFilterMetrics = { calls: 0, visitedItems: 0, callSites: [] as string[] };
      testWindow.__cadV2LargeArrayFilterMetrics = largeArrayFilterMetrics;
      if (trackLargeArrayFilters) {
        Array.prototype.filter = new Proxy(Array.prototype.filter, {
          apply(target, thisArg: unknown, args: unknown[]) {
            if (Array.isArray(thisArg) && thisArg.length >= 10_000) {
              largeArrayFilterMetrics.calls++;
              largeArrayFilterMetrics.visitedItems += thisArg.length;
              largeArrayFilterMetrics.callSites.push(new Error().stack?.split("\n").slice(2, 6).join("\n") ?? "stack unavailable");
            }
            return Reflect.apply(target, thisArg, args);
          },
        });
      }
    }, trackLargeArrayFilters);
    await signInAdmin(page);
    navigationStartedAt = Date.now();
    await page.goto("/dokumantasyon/dosya/17611705-1dcd-4740-8399-cddee29d9803?cadEngine=v2", {
      waitUntil: "domcontentloaded",
      timeout: 60_000,
    });

    const interactionArea = page.getByLabel("CAD V2 Çizim Etkileşim Alanı");
    await expect(interactionArea).toBeVisible({ timeout: 60_000 });
    const loadedProgress = page.getByText(/Görünür parçalar aktarılıyor \(([1-9]\d*)\/(\d+)\)\.\.\./);
    await expect(loadedProgress).toBeVisible({ timeout: 60_000 });

    const progressText = await loadedProgress.innerText();
    const progressCounts = progressText.match(/\((\d+)\/(\d+)\)/);
    expect(progressCounts, "accepted chunk progress is reported").not.toBeNull();
    expect(Number(progressCounts![2]), "the fixture must exercise the large visible Model set").toBeGreaterThan(10_000);
    expect(Number(progressCounts![1]), "at least one chunk was accepted before the rest completed").toBeGreaterThan(0);
    await page.evaluate(() => {
      const testWindow = window as Window & { __cadV2LargeArrayFilterMetrics?: { calls: number; visitedItems: number; callSites: string[] } };
      if (testWindow.__cadV2LargeArrayFilterMetrics) {
        testWindow.__cadV2LargeArrayFilterMetrics.calls = 0;
        testWindow.__cadV2LargeArrayFilterMetrics.visitedItems = 0;
        testWindow.__cadV2LargeArrayFilterMetrics.callSites.length = 0;
      }
    });

    await expect(page.getByTestId("cad-v2-streaming-progress")).toBeVisible({ timeout: 5_000 });
    await expect(page.getByTestId("cad-v2-blocking-loading-overlay")).toHaveCount(0);

    const canvas = page.locator("#document-studio-shell canvas").first();
    const raster = await measureCanvasRasterRois(page, canvas);
    expect(raster.foregroundPixelCount, "the first accepted frame must contain rendered CAD pixels").toBeGreaterThan(0);
    await new Promise((resolve) => setTimeout(resolve, sampleDurationMs));
    const postSampleRead = await Promise.race([
      page.evaluate(() => {
        const testWindow = window as Window & {
          __cadV2LargeArrayFilterMetrics?: { calls: number; visitedItems: number; callSites: string[] };
          __cadV2ResourceDiagnosticSummary?: Record<string, unknown>;
        };
        return {
          sustainedProgressText: document.querySelector<HTMLElement>('[data-testid="cad-v2-streaming-progress"]')?.innerText ?? "streaming-status-not-visible",
          largeArrayFilterMetrics: testWindow.__cadV2LargeArrayFilterMetrics ?? { calls: -1, visitedItems: -1 },
          resourceSummary: testWindow.__cadV2ResourceDiagnosticSummary ?? null,
          visibleBudgetWarning: document.body.innerText.includes("Bellek bütçesi nedeniyle görünür alanda"),
        };
      }).then((value) => ({ status: "responsive" as const, value }), (error: unknown) => ({ status: "failed" as const, error: String(error) })),
      new Promise<{ status: "timeout" }>((resolve) => setTimeout(() => resolve({ status: "timeout" }), 10_000)),
    ]);
    if (postSampleRead.status !== "responsive") {
      console.log("[BIG DWG POST-SAMPLE NODE EVIDENCE]", JSON.stringify({
        status: postSampleRead.status,
        error: postSampleRead.status === "failed" ? postSampleRead.error : undefined,
        rendererBudgetRejections,
        requestCountAtFirstBudgetRejection,
        chunkRequestsFiveSecondsAfterRejection,
        chunkRequestCount: Array.from(chunkRequestCounts.values()).reduce((total, count) => total + count, 0),
      }));
      throw new Error("The browser DOM did not respond within 10s after the large-DWG sample.");
    }
    const { sustainedProgressText, largeArrayFilterMetrics, resourceSummary } = postSampleRead.value;
    console.log("[BIG DWG LARGE ARRAY FILTER CALLS]", JSON.stringify(largeArrayFilterMetrics));
    if (trackLargeArrayFilters) {
      expect(largeArrayFilterMetrics.calls, "progress updates must not rescan the full 18k visible-chunk list").toBeLessThanOrEqual(2);
    }
    console.log("[BIG DWG BUDGET PRESSURE SAMPLE]", JSON.stringify({
      sustainedProgressText,
      sampleDurationMs,
      resourceSummary: resourceSummary && {
        startCount: resourceSummary.startCount,
        outcomeCount: resourceSummary.outcomeCount,
        acceptedCount: resourceSummary.acceptedCount,
        rejectedCount: resourceSummary.rejectedCount,
        latestAcceptedOutcome: resourceSummary.latestAcceptedOutcome,
        firstRejection: resourceSummary.firstRejection,
      },
      uniqueChunkRequestCount: chunkRequestCounts.size,
      duplicateChunkRequestCount: Array.from(chunkRequestCounts.values()).reduce((total, count) => total + Math.max(0, count - 1), 0),
      networkMilestones,
    }));
    expect(resourceSummary, "the large-DWG sample exposes chunk resource outcomes").not.toBeNull();
    expect(Array.from(chunkRequestCounts.values()).reduce((total, count) => total + Math.max(0, count - 1), 0),
      "a second visible-batch callback does not refetch work reserved by the active batch").toBeLessThanOrEqual(6);
    expect(Number(resourceSummary!.startCount) - Number(resourceSummary!.outcomeCount),
      "after admission pressure, only the bounded in-flight cohort may remain unresolved").toBeLessThanOrEqual(6);
    if (requireBudgetPressure) {
      expect(Number(resourceSummary!.rejectedCount), "the fixed-budget sample reaches renderer admission pressure").toBeGreaterThan(0);
    }
    let degradedRaster: CanvasRasterRoiMetrics | null = null;
    if (Number(resourceSummary!.rejectedCount) > 0) {
      await expect(page.getByText(/Bellek bütçesi nedeniyle görünür alanda \d+ parça atlandı/),
        "unstarted visible chunks are reported as deferred and the view remains explicitly partial").toBeVisible();
      degradedRaster = await measureCanvasRasterRois(page, canvas);
      expect(degradedRaster.foregroundPixelCount, "the degraded view remains interactive and keeps rendered CAD content").toBeGreaterThan(0);

      const rejectedChunkId = String(rendererBudgetRejections[0]?.chunkId ?? "");
      expect(rejectedChunkId, "the renderer rejection identifies the deferred chunk to retry").not.toBe("");
      const rejectedBBox = rendererBudgetRejections[0]?.chunkBBox as number[] | undefined;
      expect(rejectedBBox?.length, "the rejected chunk diagnostic includes its spatial bbox").toBe(4);
      expect(chunkRequestsFiveSecondsAfterRejection, "budget rejection pauses the visible queue until a capacity opportunity").toBe(requestCountAtFirstBudgetRejection);
      await page.evaluate((chunkId) => {
        const testWindow = window as Window & {
          __cadV2ResourceDiagnosticSummary?: { retryTargetChunkId: string | null };
        };
        if (testWindow.__cadV2ResourceDiagnosticSummary) {
          testWindow.__cadV2ResourceDiagnosticSummary.retryTargetChunkId = chunkId;
        }
      }, rejectedChunkId);

      const viewportBeforeInteraction = await page.evaluate(() => {
        const testWindow = window as Window & {
          __cadV2ViewportSummary?: { count: number; last: Record<string, unknown> | null };
          __cadV2ResourceDiagnosticSummary?: Record<string, unknown>;
        };
        return {
          viewport: testWindow.__cadV2ViewportSummary ?? null,
          resources: testWindow.__cadV2ResourceDiagnosticSummary ?? null,
        };
      });
      expect(viewportBeforeInteraction.viewport?.last, "a real initial viewport snapshot is available").not.toBeNull();
      const initialViewport = viewportBeforeInteraction.viewport!.last!;
      const initialCamera = initialViewport.cameraState as { center?: number[]; unitsPerCssPixel?: number };
      const initialViewportBBox = initialViewport.viewportBBox as number[];
      expect(initialCamera.center?.length, "the viewport snapshot includes the actual camera center").toBe(2);
      expect(initialCamera.unitsPerCssPixel, "the viewport snapshot includes camera scale").toBeGreaterThan(0);
      expect(initialViewportBBox?.length, "the viewport snapshot includes the actual world-space viewport").toBe(4);
      const targetWorldX = (Math.max(rejectedBBox[0], initialViewportBBox[0]!) + Math.min(rejectedBBox[2], initialViewportBBox[2]!)) / 2;
      const targetWorldY = (Math.max(rejectedBBox[1], initialViewportBBox[1]!) + Math.min(rejectedBBox[3], initialViewportBBox[3]!)) / 2;
      const canvasBox = await canvas.boundingBox();
      expect(canvasBox, "the WebGL canvas has a measurable browser viewport").not.toBeNull();
      const targetX = canvasBox!.x + canvasBox!.width / 2 + (targetWorldX - initialCamera.center![0]!) / initialCamera.unitsPerCssPixel!;
      const targetY = canvasBox!.y + canvasBox!.height / 2 - (targetWorldY - initialCamera.center![1]!) / initialCamera.unitsPerCssPixel!;
      expect(targetX).toBeGreaterThan(canvasBox!.x);
      expect(targetX).toBeLessThan(canvasBox!.x + canvasBox!.width);
      expect(targetY).toBeGreaterThan(canvasBox!.y);
      expect(targetY).toBeLessThan(canvasBox!.y + canvasBox!.height);

      viewportActionStartedAt = Date.now();
      await page.mouse.move(targetX, targetY);
      await page.mouse.wheel(0, -600);
      await page.mouse.wheel(0, -600);
      await page.mouse.wheel(0, -600);
      await page.mouse.wheel(0, -600);
      await page.mouse.wheel(0, -600);
      await page.mouse.wheel(0, -600);
      await page.mouse.wheel(0, -600);
      await page.mouse.wheel(0, -600);
      await page.mouse.wheel(0, -600);
      await page.waitForFunction((countBefore) => {
        const testWindow = window as Window & { __cadV2ViewportSummary?: { count: number } };
        return (testWindow.__cadV2ViewportSummary?.count ?? 0) > countBefore;
      }, viewportBeforeInteraction.viewport!.count, { timeout: 15_000 });
      const zoomViewport = await page.evaluate(() => {
        const testWindow = window as Window & { __cadV2ViewportSummary?: { count: number; last: Record<string, unknown> | null } };
        return testWindow.__cadV2ViewportSummary ?? null;
      });
      const zoomCamera = zoomViewport?.last?.cameraState as { unitsPerCssPixel?: number } | undefined;
      expect(zoomCamera?.unitsPerCssPixel, "the browser wheel gesture changes the camera scale").toBeLessThan(initialCamera.unitsPerCssPixel!);

      const panEndX = Math.min(canvasBox!.x + canvasBox!.width - 16, targetX + 12);
      const panEndY = Math.min(canvasBox!.y + canvasBox!.height - 16, targetY + 8);
      await page.mouse.move(targetX, targetY);
      await page.mouse.down({ button: "middle" });
      await page.mouse.move(panEndX, panEndY, { steps: 6 });
      await page.mouse.up({ button: "middle" });
      await page.waitForFunction((countBefore) => {
        const testWindow = window as Window & { __cadV2ViewportSummary?: { count: number } };
        return (testWindow.__cadV2ViewportSummary?.count ?? 0) > countBefore;
      }, zoomViewport?.count ?? 0, { timeout: 15_000 });
      const retriedChunkAccepted = await page.waitForFunction((chunkId) => {
        const testWindow = window as Window & {
          __cadV2ResourceDiagnosticSummary?: { acceptedChunkIds?: string[] };
        };
        const acceptedOutcome = (testWindow.__cadV2ResourceDiagnosticSummary as {
          retryAcceptedOutcome?: { chunkId?: string; status?: string };
        } | undefined)?.retryAcceptedOutcome;
        return acceptedOutcome?.chunkId === chunkId && acceptedOutcome.status === "accepted";
      }, rejectedChunkId, { timeout: 30_000 }).then(() => true, () => false);
      if (!retriedChunkAccepted) {
        const failedRetrySnapshot = await page.evaluate((chunkId) => {
          const testWindow = window as Window & {
            __cadV2ViewportSummary?: { count: number; last: Record<string, unknown> | null };
            __cadV2ResourceDiagnosticSummary?: {
              acceptedCount?: number;
              rejectedCount?: number;
              latestStatus?: string | null;
              latestCpuResidentBytes?: number | null;
              latestGpuBufferBytes?: number | null;
              acceptedChunkIds?: string[];
              firstRejection?: Record<string, unknown> | null;
            };
          };
          const summary = testWindow.__cadV2ResourceDiagnosticSummary;
          return {
            viewport: testWindow.__cadV2ViewportSummary ?? null,
            resources: summary && {
              acceptedCount: summary.acceptedCount,
              rejectedCount: summary.rejectedCount,
              latestStatus: summary.latestStatus,
              latestCpuResidentBytes: summary.latestCpuResidentBytes,
              latestGpuBufferBytes: summary.latestGpuBufferBytes,
              rejectedChunkAccepted: summary.acceptedChunkIds?.includes(chunkId) ?? false,
              firstRejection: summary.firstRejection,
            },
          };
        }, rejectedChunkId).catch((error: unknown) => ({ error: String(error) }));
        const retryEvidence = {
          rejectedChunkId,
          targetWorld: [targetWorldX, targetWorldY],
          postInteractionChunkRequests,
          postInteractionChunkResponses,
          zoomSnapshot: zoomViewport?.last ?? null,
          failedRetrySnapshot,
        };
        fs.writeFileSync(testInfo.outputPath("pan-zoom-retry-evidence.json"), JSON.stringify(retryEvidence, null, 2));
        console.log("[BIG DWG PAN/ZOOM RETRY DID NOT ACCEPT]", JSON.stringify(retryEvidence));
        throw new Error(`Deferred chunk retry did not accept ${rejectedChunkId} within 30s after zoom and pan.`);
      }
      await expect.poll(() => postInteractionChunkResponses.some((item) => item.chunkId === rejectedChunkId && item.status === 200), {
        message: "the exact budget-rejected chunk is fetched again successfully after pan/zoom creates capacity",
        timeout: 10_000,
      }).toBe(true);

      const viewportAfterInteraction = await page.evaluate(() => {
        const testWindow = window as Window & {
          __cadV2ViewportSummary?: { count: number; last: Record<string, unknown> | null };
          __cadV2ResourceDiagnosticSummary?: Record<string, unknown>;
        };
        return {
          viewport: testWindow.__cadV2ViewportSummary ?? null,
          resources: testWindow.__cadV2ResourceDiagnosticSummary ?? null,
        };
      });
      const zoomSnapshot = zoomViewport?.last ?? {};
      const panSnapshot = viewportAfterInteraction.viewport?.last ?? {};
      const capacityOpportunityCount = [zoomSnapshot, panSnapshot]
        .reduce((count, snapshot) => count + Number(snapshot.capacityOpportunity === true), 0);
      expect(capacityOpportunityCount, "zoom or pan makes at least one accepted chunk invisible and opens a measured capacity opportunity").toBeGreaterThan(0);
      const retryAcceptedOutcome = (viewportAfterInteraction.resources as { retryAcceptedOutcome?: Record<string, unknown> } | null)?.retryAcceptedOutcome;
      expect(retryAcceptedOutcome, "the retry has an accepted renderer outcome").not.toBeNull();
      expect(Number(retryAcceptedOutcome!.cpuResidentBytes), "accepted retry remains within the fixed CPU budget").toBeLessThanOrEqual(Number(retryAcceptedOutcome!.cpuBudgetBytes));
      expect(Number(retryAcceptedOutcome!.gpuBufferBytesEstimate), "accepted retry remains within the fixed GPU budget").toBeLessThanOrEqual(Number(retryAcceptedOutcome!.gpuBudgetBytes));
      const retryEvidence = {
        rejectedChunkId,
        targetWorld: [targetWorldX, targetWorldY],
        requestCountBeforeRetry: requestCountAtFirstBudgetRejection,
        requestCountFiveSecondsAfterRejection: chunkRequestsFiveSecondsAfterRejection,
        interactionRequests: postInteractionChunkRequests,
        interactionResponses: postInteractionChunkResponses,
        zoomViewport: zoomSnapshot,
        panViewport: panSnapshot,
        capacityOpportunityCount,
        retryAcceptedOutcome,
      };
      fs.writeFileSync(testInfo.outputPath("pan-zoom-retry-evidence.json"), JSON.stringify(retryEvidence, null, 2));
      console.log("[BIG DWG PAN/ZOOM DEFERRED RETRY]", JSON.stringify(retryEvidence));
    }
    const rendererEvents = await page.evaluate(() => {
      const testWindow = window as Window & { __cadV2ResourceDiagnosticEvents?: Array<Record<string, unknown>> };
      const events = testWindow.__cadV2ResourceDiagnosticEvents ?? [];
      const starts = new Map(events
        .filter((event) => event.type === "chunk-load-start")
        .map((event) => [Number(event.loadId), Number(event.observedAtMs)]));
      const outcomes = events.filter((event) => event.type === "chunk-load-outcome");
      const cycleDurations = outcomes
        .map((event) => Number(event.observedAtMs) - (starts.get(Number(event.loadId)) ?? Number(event.observedAtMs)))
        .sort((a, b) => a - b);
      const percentile = (fraction: number) => cycleDurations.length
        ? cycleDurations[Math.min(cycleDurations.length - 1, Math.floor(cycleDurations.length * fraction))]
        : null;
      const accepted = outcomes.filter((event) => event.status === "accepted");
      const chunkResources = performance.getEntriesByType("resource")
        .filter((entry) => entry.name.includes("/scenes/") && entry.name.includes("/chunks/"))
        .map((entry) => entry.duration)
        .sort((a, b) => a - b);
      return {
        timeOrigin: performance.timeOrigin,
        eventCounts: Object.fromEntries([...new Set(events.map((event) => String(event.type)))].map((type) =>
          [type, events.filter((event) => event.type === type).length])),
        acceptedOutcomeCount: accepted.length,
        rejectedOutcomeCount: outcomes.filter((event) => event.status === "rejected").length,
        outcomeCycleP50Ms: percentile(0.5),
        outcomeCycleP95Ms: percentile(0.95),
        latestCpuResidentBytes: accepted.at(-1)?.cpuResidentBytes ?? null,
        latestGpuBufferBytes: accepted.at(-1)?.gpuBufferBytesEstimate ?? null,
        latestCpuBudgetBytes: accepted.at(-1)?.cpuBudgetBytes ?? null,
        chunkResourceCount: chunkResources.length,
        chunkResourceP50Ms: chunkResources.length ? chunkResources[Math.floor(chunkResources.length * 0.5)] : null,
        chunkResourceP95Ms: chunkResources.length ? chunkResources[Math.min(chunkResources.length - 1, Math.floor(chunkResources.length * 0.95))] : null,
        firstChunkStartMs: events.find((event) => event.type === "chunk-load-start")?.observedAtMs ?? null,
        firstChunkOutcome: events.find((event) => event.type === "chunk-load-outcome") ?? null,
      };
    });
    console.log("[BIG DWG FIRST FRAME TIMING]", JSON.stringify({
      elapsedMs: Date.now() - navigationStartedAt,
      firstProgressText: progressText,
      sustainedProgressText,
      networkMilestones,
      foregroundPixelCount: raster.foregroundPixelCount,
      degradedForegroundPixelCount: degradedRaster?.foregroundPixelCount ?? null,
      degradedRoiForegroundPixelCounts: degradedRaster?.roiForegroundPixelCounts ?? null,
      largeArrayFilterMetrics,
      resourceSummary,
      rendererEvents,
    }));
  });

  for (const item of DESKTOP_CAD_FILES) {
    test(`[${item.format}] ${item.name} açma, etkileşim, pafta ve katman doğrulama`, async ({ page }) => {
      test.setTimeout(120_000);
      // 1. Konsol hatalarını dinle
      const consoleErrors: string[] = [];
      const expectedSourceSha256 = getExpectedSourceSha256(item.id);
      const apiFlowEvidence: string[] = [];
      const captureTasks: Promise<void>[] = [];
      const chunkResponses: string[] = [];
      let chunkResponseCount = 0;
      let preparedSceneId: string | null = null;
      page.on("console", (msg) => {
        if (msg.type() === "error") {
          const text = msg.text();
          if (!text.includes("Download the React DevTools") && !text.includes("favicon.ico")) {
            consoleErrors.push(text);
          }
        }
      });
      page.on("response", (response) => {
        const task = (async () => {
          const url = new URL(response.url());
          const parts = url.pathname.split("/").filter(Boolean);
          const method = response.request().method();
          const isPrepare = method === "POST" && parts.at(-1) === "prepare";
          const manifestIndex = parts.lastIndexOf("manifest");
          const chunkIndex = parts.lastIndexOf("chunks");
          if (isPrepare && response.url().includes("/cad-v2/")) {
            const body = response.ok() ? await response.json().catch((error) => ({ captureError: String(error) })) : {};
            preparedSceneId = typeof body.sceneId === "string" ? body.sceneId : null;
            apiFlowEvidence.push(`prepare ${response.status()} ${JSON.stringify({ status: body.status, fileId: body.fileId, sourceVersionKey: body.sourceVersionKey, jobId: body.jobId, sceneId: body.sceneId, viewSessionId: body.viewSessionId })}`);
          } else if (manifestIndex >= 0 && response.url().includes("/cad-v2/")) {
            const body = response.ok() ? await response.json().catch((error) => ({ captureError: String(error) })) : {};
            apiFlowEvidence.push(`manifest ${response.status()} ${JSON.stringify({ sceneId: body.sceneId, sourceVersionKey: body.sourceVersionKey, sourceSha256: body.sourceSha256, chunkCount: body.chunks?.length, modelChunkCount: body.chunks?.filter((chunk: { layoutId?: string }) => chunk.layoutId === "Model").length, chunk004: body.chunks?.find((chunk: { chunkId?: string }) => chunk.chunkId === "chunk_model_004")?.byteLength, qualityStatus: body.qualityStatus, captureError: body.captureError })}`);
          } else if (chunkIndex >= 0 && response.url().includes("/cad-v2/")) {
            chunkResponseCount++;
            if (chunkResponses.length < 12) chunkResponses.push(`${response.status()} ${parts[chunkIndex + 1] ?? "unknown"}`);
          }
        })();
        captureTasks.push(task);
      });

      // 2. Admin girişi yap
      await signInAdmin(page);
      const interactionArea = page.getByLabel("CAD V2 Çizim Etkileşim Alanı");

      // 3. Dosyayı CAD V2 motoruyla aç
      const fileUrl = `/dokumantasyon/dosya/${item.id}?cadEngine=v2`;
      await page.goto(fileUrl, { waitUntil: "domcontentloaded", timeout: 60_000 });

      // 4. Etkileşim alanı ve MOTOR V2 footer'ının yüklenmesini bekle
      await expect(interactionArea).toBeVisible({ timeout: 60_000 });

      const footer = page.locator("footer").filter({ hasText: "MOTOR V2" });
      await expect(footer).toBeVisible({ timeout: 60_000 });

      // 5. Durum çubuğu (footer) ve MOTOR V2 rozetinin doğrulanması
      await expect(footer).toContainText("MOTOR V2");
      await expect(footer).toContainText("%");
      const footerText = await footer.innerText().catch(() => "");
      console.log(`[FOOTER STATE - ${item.name}]:`, footerText.replace(/\s+/g, " ").trim());

      // 6. Canvas elemanının ve WebGL bağlamının doğrulanması
      const canvas = page.locator("#document-studio-shell canvas").first();
      await expect(canvas).toBeVisible({ timeout: 10_000 });

      const canvasDims = await canvas.evaluate((el: HTMLCanvasElement) => ({
        width: el.width,
        height: el.height,
        clientWidth: el.clientWidth,
        clientHeight: el.clientHeight,
      }));
      expect(canvasDims.width).toBeGreaterThan(0);
      expect(canvasDims.height).toBeGreaterThan(0);

      // 7. Kamera Etkileşimi: Zoom In, Zoom Out, Fit (Toolbar)
      const zoomInBtn = page.locator('button[title="Yakınlaştır (+)"]');
      const zoomOutBtn = page.locator('button[title="Uzaklaştır (-)"]');
      const fitBtn = page.locator('button[title="Çizimi Sığdır (F)"]');

      await expect(zoomInBtn).toBeVisible({ timeout: 5_000 });
      await zoomInBtn.click();
      await page.waitForTimeout(150);

      await expect(zoomOutBtn).toBeVisible({ timeout: 5_000 });
      await zoomOutBtn.click();
      await page.waitForTimeout(150);

      await expect(fitBtn).toBeVisible({ timeout: 5_000 });
      await fitBtn.click();
      await page.waitForTimeout(200);

      // Independent image-space smoke: derive non-background pixels from the real
      // canvas and require source entities plus distributed content ROIs in at
      // least one expected Model/Layout view.
      const rasterCanvas = page.locator("#document-studio-shell canvas").first();
      const layoutSelect = page.locator('select[aria-label="Pafta seçimi"]');
      const hasLayoutSelect = await layoutSelect.isVisible({ timeout: 2_000 }).catch(() => false);
      const expectedViews = Array.from(new Set(["Model", ...item.expectedLayouts.filter((layout) => layout !== "Model")]));
      const viewEvidence: Array<{ layout: string; entityCount: number; foregroundPixelCount: number; occupiedRoiIds: number[] }> = [];
      let acceptedContentView: string | null = null;

      for (const layout of expectedViews) {
        if (layout !== "Model") {
          if (!hasLayoutSelect) continue;
          await layoutSelect.selectOption({ value: layout });
          await page.waitForTimeout(500);
          await fitBtn.click();
          await page.waitForTimeout(200);
        }

        const footerTextForView = await footer.innerText();
        const entityCountText = footerTextForView.match(/Varlık:\s*([\d.,]+)/)?.[1];
        expect(entityCountText, `${item.name}/${layout}: source entity count is displayed`).toBeDefined();
        const entityCount = Number(entityCountText!.replace(/[.,\s]/g, ""));
        const observedRaster = await measureCanvasRasterRois(page, rasterCanvas);
        const occupiedRoiIds = observedRaster.roiForegroundPixelCounts
          .map((count, roiId) => count >= 3 ? roiId : -1)
          .filter((roiId) => roiId >= 0);
        const occupiedRows = new Set(occupiedRoiIds.map((roiId) => Math.floor(roiId / 4)));
        const occupiedColumns = new Set(occupiedRoiIds.map((roiId) => roiId % 4));
        const roiPass = entityCount > 0 && observedRaster.foregroundPixelCount > 64 &&
          occupiedRoiIds.length >= 3 && occupiedRows.size >= 2 && occupiedColumns.size >= 2;
        viewEvidence.push({ layout, entityCount, foregroundPixelCount: observedRaster.foregroundPixelCount, occupiedRoiIds });
        console.log(`[RASTER ROI - ${item.name}/${layout}]`, JSON.stringify(viewEvidence[viewEvidence.length - 1]));
        if (roiPass) {
          acceptedContentView = layout;
          break;
        }
      }

      await Promise.all(captureTasks);
      type LocalSceneManifest = {
        sceneId?: string;
        sourceVersionKey?: string;
        sourceSha256?: string;
        chunks?: Array<{ layoutId?: string; chunkId?: string; byteLength?: number }>;
        qualityStatus?: string;
      };
      let localSceneManifest: LocalSceneManifest | null = null;
      if (preparedSceneId && /^scene_[a-z0-9]+$/i.test(preparedSceneId)) {
        const manifestPath = path.join(process.env.DOK_LOCAL_DATA_DIR || "", "cad-v2-scenes", preparedSceneId, "manifest.json");
        if (fs.existsSync(manifestPath)) localSceneManifest = JSON.parse(fs.readFileSync(manifestPath, "utf8")) as LocalSceneManifest;
      }
      console.log(`[CAD API FLOW - ${item.name}] ${apiFlowEvidence.join(" | ")} | chunkResponses=${chunkResponseCount} sample=${chunkResponses.join(",")} | storedManifest=${JSON.stringify(localSceneManifest ? { sceneId: localSceneManifest.sceneId, sourceVersionKey: localSceneManifest.sourceVersionKey, sourceSha256: localSceneManifest.sourceSha256, chunkCount: localSceneManifest.chunks?.length, modelChunkCount: localSceneManifest.chunks?.filter((chunk: { layoutId?: string }) => chunk.layoutId === "Model").length, chunk004: localSceneManifest.chunks?.find((chunk: { chunkId?: string }) => chunk.chunkId === "chunk_model_004")?.byteLength, qualityStatus: localSceneManifest.qualityStatus } : null)}`);
      const loadedManifest = apiFlowEvidence.find((entry) => entry.startsWith("manifest 200 "));
      expect(loadedManifest, `${item.name}: browser must retrieve an HTTP 200 scene manifest; ${apiFlowEvidence.join(" | ")}`).toBeDefined();
      expect(localSceneManifest, `${item.name}: prepare scene manifest must exist in isolated storage; scene=${preparedSceneId}`).not.toBeNull();
      expect(localSceneManifest?.sceneId).toBe(preparedSceneId);
      expect(localSceneManifest?.sourceSha256, `${item.name}: stored scene source SHA must match the isolated source file.`).toBe(expectedSourceSha256);

      expect(acceptedContentView, `${item.name}: no expected Model/Layout view produced entity-backed distributed raster content; ${JSON.stringify(viewEvidence)}`)
        .not.toBeNull();
      if (hasLayoutSelect && await layoutSelect.inputValue() !== "Model") {
        await layoutSelect.selectOption({ value: "Model" });
        await page.waitForTimeout(500);
        await fitBtn.click();
        await page.waitForTimeout(200);
      }

      // 8. Fare Tekerleği ile Zoom & Sürükleme (Pan) Etkileşimi
      const box = await interactionArea.boundingBox();
      if (box) {
        // Mouse wheel zoom
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
        await page.mouse.wheel(0, -120); // Zoom in
        await page.waitForTimeout(200);
        await page.mouse.wheel(0, 120);  // Zoom out
        await page.waitForTimeout(200);

        // Middle mouse drag / pan
        await page.mouse.down({ button: "middle" });
        await page.mouse.move(box.x + box.width / 2 + 50, box.y + box.height / 2 + 30);
        await page.mouse.up({ button: "middle" });
        await page.waitForTimeout(200);
      }

      // 9. Pafta (Layout) Değiştirme
      if (hasLayoutSelect) {
        // İkinci paftaya geç
        await layoutSelect.selectOption({ index: 1 });
        await page.waitForTimeout(500);

        // Tekrar Model paftasına dön
        await layoutSelect.selectOption({ value: "Model" });
        await page.waitForTimeout(500);
      }

      // 10. Katman Paneli Açma ve Kontrol
      const layerBtn = page.locator('button[title="Katmanlar"]');
      await expect(layerBtn).toBeVisible({ timeout: 5_000 });
      await layerBtn.click();

      const layerSearchInput = page.getByPlaceholder("Katman ara...");
      await expect(layerSearchInput).toBeVisible({ timeout: 5_000 });

      // Katman panelini kapat
      await layerBtn.click();
      await page.waitForTimeout(200);

      // 11. Görünüm Ayarları Paneli Kontrolü
      const settingsBtn = page.locator('button[title="Görünüm Ayarları"]');
      await expect(settingsBtn).toBeVisible({ timeout: 5_000 });
      await settingsBtn.click();

      const settingsTitle = page.getByText("Görünüm Ayarları", { exact: true });
      await expect(settingsTitle).toBeVisible({ timeout: 5_000 });

      // Paneli kapat
      await settingsBtn.click();
      await page.waitForTimeout(200);

      // 12. Hata Bütünlüğü: Kritik WebGL veya uncaught crash olmamalı
      const criticalErrors = consoleErrors.filter((e) =>
        e.includes("CONTEXT_LOST") ||
        e.includes("Uncaught Error") ||
        e.includes("TypeError") ||
        e.includes("WebGL: INVALID")
      );
      expect(criticalErrors).toEqual([]);
    });
  }
});
