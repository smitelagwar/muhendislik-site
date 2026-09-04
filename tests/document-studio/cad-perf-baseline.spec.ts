import { expect, test, type Page } from "@playwright/test";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import {
  signInAdmin,
  uploadCadPreviewV2Fixture,
  cleanupUploadedCadFixtures,
  mockDwgFastCacheHit,
  mockDwgFastCacheMiss,
} from "./cad-test-helpers";
import type { CadPerfReport } from "../../src/lib/dokumantasyon/cad-runtime/perf";

interface FixtureBenchmarkResult {
  fixtureId: string;
  fixtureName: string;
  format: "dxf" | "dwg";
  sizeBytes: number;
  engine: string;
  totalToReadyMs: number;
  phases: Record<string, number>;
  longTasks: Array<{ startTime: number; durationMs: number }>;
  network: {
    workerJsBytes: number;
    wasmBytes: number;
    fontsBytes: number;
    sourceBytes: number;
    totalTransferredBytes: number;
  };
  canvasState: {
    width: number;
    height: number;
    isWebGLValid: boolean;
  };
}

const benchmarkResults: Record<string, FixtureBenchmarkResult> = {};

async function uploadRealFileFixture(
  page: Page,
  filePath: string,
  fileName: string,
  mimeType: string
): Promise<string> {
  const content = fs.readFileSync(filePath);
  const base64 = content.toString("base64");
  const pathname = `cad-perf-${crypto.randomUUID()}-${fileName}`;

  const fileId = await page.evaluate(
    async ({ base64, name, type, pathname }) => {
      const binary = atob(base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      const formData = new FormData();
      formData.append("file", new File([bytes], name, { type }));
      formData.append("pathname", pathname);
      const response = await fetch("/api/dokumantasyon/upload/local", {
        method: "POST",
        body: formData,
      });
      const payload = await response.json();
      if (!response.ok || !payload.file?.id) {
        throw new Error(payload.error || "Dosya yuklenemedi");
      }
      return payload.file.id as string;
    },
    { base64, name: fileName, type: mimeType, pathname }
  );

  return fileId;
}

async function runFixtureBenchmark(
  page: Page,
  options: {
    fixtureId: string;
    fixtureName: string;
    format: "dxf" | "dwg";
    fileId: string;
    sizeBytes: number;
    timeoutMs?: number;
    setupRoute?: () => Promise<void>;
  }
): Promise<FixtureBenchmarkResult> {
  const networkMetrics = {
    workerJsBytes: 0,
    wasmBytes: 0,
    fontsBytes: 0,
    sourceBytes: 0,
    totalTransferredBytes: 0,
  };

  page.on("response", (res) => {
    const url = res.url();
    const size = Number(res.headers()["content-length"] || 0);
    networkMetrics.totalTransferredBytes += size;

    if (url.includes("-worker.js")) {
      networkMetrics.workerJsBytes += size;
    } else if (url.includes(".wasm")) {
      networkMetrics.wasmBytes += size;
    } else if (url.includes("/fonts/")) {
      networkMetrics.fontsBytes += size;
    } else if (url.includes("/api/dokumantasyon/files/") || url.includes("dok_storage")) {
      networkMetrics.sourceBytes += size;
    }
  });

  if (options.setupRoute) {
    await options.setupRoute();
  }

  const navStart = Date.now();
  await page.goto(`/dokumantasyon/dosya/${options.fileId}`);

  const runtime = page.locator('[data-cad-runtime="orchestrator"]').first();
  await expect(runtime).toBeVisible({ timeout: options.timeoutMs || 60_000 });

  const host = runtime.locator('[data-cad-upstream-host="true"]').first();
  await expect(host).toHaveAttribute("data-cad-upstream-state", "ready", {
    timeout: options.timeoutMs || 60_000,
  });

  const canvas = host.locator("canvas").first();
  await expect(canvas).toBeVisible({ timeout: 15_000 });

  const canvasState = await canvas.evaluate((el: HTMLCanvasElement) => {
    const gl =
      (el.getContext("webgl2") || el.getContext("webgl")) as WebGLRenderingContext | null;
    return {
      width: el.width,
      height: el.height,
      isWebGLValid: Boolean(gl && !gl.isContextLost()),
    };
  });

  const perfReport = await page.evaluate(() => {
    return (window as unknown as { __cadPerfReport?: CadPerfReport }).__cadPerfReport || null;
  });

  const wallClockMs = Date.now() - navStart;
  const totalToReadyMs = perfReport?.totalTimeToReadyMs ?? wallClockMs;

  const result: FixtureBenchmarkResult = {
    fixtureId: options.fixtureId,
    fixtureName: options.fixtureName,
    format: options.format,
    sizeBytes: options.sizeBytes,
    engine: "upstream",
    totalToReadyMs,
    phases: perfReport?.phases || {},
    longTasks: perfReport?.longTasks || [],
    network: networkMetrics,
    canvasState,
  };

  benchmarkResults[options.fixtureId] = result;
  return result;
}

test.describe("CAD Runtime Performance Baseline — Desktop & Mobile Suite", () => {
  test.afterEach(async ({ page }) => {
    await cleanupUploadedCadFixtures(page);
  });

  test("Fixture Matrisi: CAD-A'dan CAD-G'ye Runtime Waterfall ve Network Olcumu", async ({
    page,
  }) => {
    test.setTimeout(180_000);
    await signInAdmin(page);

    // CAD-A: DXF Temel (known-geometry-measurements)
    const { fileId: cadAId, manifest: cadAManifest } = await uploadCadPreviewV2Fixture(
      page,
      "known-geometry-measurements"
    );
    const resA = await runFixtureBenchmark(page, {
      fixtureId: "CAD-A",
      fixtureName: cadAManifest.fileName,
      format: "dxf",
      fileId: cadAId,
      sizeBytes: cadAManifest.sizeBytes,
    });
    expect(resA.canvasState.isWebGLValid).toBe(true);
    expect(resA.totalToReadyMs).toBeGreaterThan(0);

    // CAD-B: DXF Layout / Paperspace (multi-layout-model-paperspace)
    const { fileId: cadBId, manifest: cadBManifest } = await uploadCadPreviewV2Fixture(
      page,
      "multi-layout-model-paperspace"
    );
    const resB = await runFixtureBenchmark(page, {
      fixtureId: "CAD-B",
      fixtureName: cadBManifest.fileName,
      format: "dxf",
      fileId: cadBId,
      sizeBytes: cadBManifest.sizeBytes,
    });
    expect(resB.canvasState.isWebGLValid).toBe(true);

    // CAD-G: DXF Turkce / MTEXT Oracle (text-turkish-unicode)
    const { fileId: cadGId, manifest: cadGManifest } = await uploadCadPreviewV2Fixture(
      page,
      "text-turkish-unicode"
    );
    const resG = await runFixtureBenchmark(page, {
      fixtureId: "CAD-G",
      fixtureName: cadGManifest.fileName,
      format: "dxf",
      fileId: cadGId,
      sizeBytes: cadGManifest.sizeBytes,
    });
    expect(resG.canvasState.isWebGLValid).toBe(true);

    // CAD-E: DWG Fast-cache HIT (cached DXF ile hizli acilis)
    const knownDxfContent = fs.readFileSync(
      path.resolve(process.cwd(), "tests/fixtures/cad-preview-v2/known-geometry-measurements.dxf")
    );
    const { fileId: cadEId } = await uploadCadPreviewV2Fixture(
      page,
      "known-geometry-measurements"
    );
    const resE = await runFixtureBenchmark(page, {
      fixtureId: "CAD-E",
      fixtureName: "cached-derivative.dwg",
      format: "dwg",
      fileId: cadEId,
      sizeBytes: knownDxfContent.length,
      setupRoute: async () => {
        await mockDwgFastCacheHit(page, cadEId, knownDxfContent);
      },
    });
    expect(resE.canvasState.isWebGLValid).toBe(true);

    // CAD-F: DWG Fast-cache MISS (fast-cache olumsuz, upstream DWG acilisi)
    const sampleDwgPath = path.resolve(
      process.cwd(),
      "eklediklerim/ornek_dosyalar/kiris_acilimlari_tum_katlar.dwg"
    );
    if (fs.existsSync(sampleDwgPath)) {
      const cadFId = await uploadRealFileFixture(
        page,
        sampleDwgPath,
        "kiris_acilimlari_tum_katlar.dwg",
        "application/acad"
      );
      const resF = await runFixtureBenchmark(page, {
        fixtureId: "CAD-F",
        fixtureName: "kiris_acilimlari_tum_katlar.dwg (cache miss)",
        format: "dwg",
        fileId: cadFId,
        sizeBytes: fs.statSync(sampleDwgPath).size,
        timeoutMs: 90_000,
        setupRoute: async () => {
          await mockDwgFastCacheMiss(page, cadFId);
        },
      });
      expect(resF.canvasState.isWebGLValid).toBe(true);
    }

    // Sonuclari diske kaydet
    const outDir = path.resolve(process.cwd(), "docs/cad-dxf-engine");
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(
      path.join(outDir, "cad-perf-baseline.json"),
      JSON.stringify(benchmarkResults, null, 2),
      "utf8"
    );
  });

  test("WebGL & Teardown 10x Stres Dongusu (Sifir WebGL Context Kaybi ve Sizinti Kontrolu)", async ({
    page,
  }) => {
    await signInAdmin(page);

    const { fileId: fileA } = await uploadCadPreviewV2Fixture(
      page,
      "known-geometry-measurements"
    );
    const { fileId: fileB } = await uploadCadPreviewV2Fixture(
      page,
      "text-rotation-0-90-180-270"
    );

    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });

    for (let cycle = 1; cycle <= 10; cycle++) {
      const targetFile = cycle % 2 === 1 ? fileA : fileB;
      await page.goto(`/dokumantasyon/dosya/${targetFile}`);

      const runtime = page.locator('[data-cad-runtime="orchestrator"]').first();
      await expect(runtime).toBeVisible({ timeout: 30_000 });

      const host = runtime.locator('[data-cad-upstream-host="true"]').first();
      await expect(host).toHaveAttribute("data-cad-upstream-state", "ready", {
        timeout: 30_000,
      });

      const canvas = host.locator("canvas");
      await expect(canvas).toHaveCount(1);

      const isValid = await canvas.first().evaluate((el: HTMLCanvasElement) => {
        const gl =
          (el.getContext("webgl2") || el.getContext("webgl")) as WebGLRenderingContext | null;
        return Boolean(gl && !gl.isContextLost() && el.width > 0 && el.height > 0);
      });

      expect(isValid).toBe(true);
    }

    // WebGL context hatasi olmamali
    const webglErrors = consoleErrors.filter(
      (err) =>
        err.includes("webglcontextlost") ||
        err.includes("CONTEXT_LOST_WEBGL") ||
        err.includes("Error creating WebGL context")
    );
    expect(webglErrors.length).toBe(0);
  });
});
