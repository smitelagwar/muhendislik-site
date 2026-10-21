import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import path from "node:path";
import { chromium, type Browser } from "@playwright/test";
import type { CadCanonicalDocument } from "../../src/lib/cad-v2/canonical/types";
import { compileCanonicalToScene } from "../../src/lib/cad-v2/compile/scene-compiler";

async function main(): Promise<void> {
  let browser: Browser | null = null;
  let server: Server | null = null;
  let exitCode = 0;
  try {
    const workerSource = await fs.readFile(path.resolve("public/cad-v2/cad-v2-scene-worker.js"), "utf8");
    server = createServer((request, response) => {
      if (request.url === "/cad-v2-scene-worker.js") {
        response.writeHead(200, { "content-type": "text/javascript; charset=utf-8", "cache-control": "no-store" });
        response.end(workerSource);
        return;
      }
      response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
      response.end("<!doctype html><html><body>V2 worker acceptance</body></html>");
    });
    await new Promise<void>((resolve, reject) => {
      server!.once("error", reject);
      server!.listen(0, "127.0.0.1", resolve);
    });
    const serverAddress = server.address() as AddressInfo;
    const doc: CadCanonicalDocument = {
      sourceVersionKey: "f07-worker-browser-source", sourceSha256: "f07-worker-browser-source",
      acadVersion: "AC1032", codepage: "UTF-8", units: 4, measurement: 1,
      layers: { L: { id: "L", name: "L", visible: true, frozen: false, locked: false,
        color: { method: "rgb", rgb: [30, 90, 220] }, lineweightMm: 0.25, linetypeName: "CONTINUOUS" } },
      linetypes: {}, textStyles: {}, blocks: {}, layouts: {}, viewports: {}, paperSpaceEntities: {}, diagnostics: [],
      modelSpaceEntities: [
        { handle: "C1", type: "CIRCLE", layer: "L", order: BigInt(1), center: [40, -30], radius: 15 },
        { handle: "HATCH1", type: "HATCH", layer: "L", order: BigInt(3), patternName: "SOLID", isSolid: true,
          solidFill: true, hatchStyle: 0, loops: [{ isPolyline: false, isClosed: true, edges: [
            { type: "ARC", center: [0, 0], radius: 10, startAngleRad: 0, endAngleRad: Math.PI / 2, ccw: true },
            { type: "LINE", start: [0, 10], end: [10, 0] },
          ] }] },
        {
          handle: "PERIODIC1", type: "SPLINE", layer: "L", order: BigInt(2), degree: 3,
          controlPoints: [[15, 0], [0, 15], [-15, 0], [0, -15], [15, 0], [0, 15], [-15, 0]],
          knots: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
          weights: [1, 0.7, 1.2, 0.9, 1, 0.7, 1.2], isPeriodic: true, isRational: true,
        },
      ],
    };
    const scene = compileCanonicalToScene(doc, { sceneId: "scene_f07_worker_browser" });
    const chunkRef = scene.manifest.chunks.find((chunk) => chunk.layoutId === "Model");
    assert.ok(chunkRef, "compile fixture produced a model chunk");
    const chunkBase64 = Buffer.from(scene.chunks.get(chunkRef.chunkId)!).toString("base64");

    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto(`http://127.0.0.1:${serverAddress.port}/`, { timeout: 8000 });
    const browserWorkerProgram = `(async ({ bytesBase64, chunkId }) => {
      return await new Promise((resolve, reject) => {
        const worker = new Worker("/cad-v2-scene-worker.js", { type: "module" });
        let stage = "ready";
        let initialResult = null;
        let loadedChunk = null;
        let hatchResult = null;
        let workerCacheRetainedSource = false;
        const timer = setTimeout(() => fail(new Error("V2 worker refinement browser timeout")), 5000);
        const fail = (error) => {
          clearTimeout(timer);
          worker.terminate();
          reject(error);
        };
        worker.onerror = (event) => fail(new Error([event.message, event.filename, event.lineno, event.error?.stack].filter(Boolean).join(" | ") || "V2 worker runtime error"));
        worker.onmessage = (event) => {
          const message = event.data;
          if (message.kind === "error") return fail(new Error(message.payload?.error || "V2 worker returned error"));
          if (stage === "ready" && message.kind === "ready") {
            stage = "chunk";
            const bytes = Uint8Array.from(atob(bytesBase64), (character) => character.charCodeAt(0));
            worker.postMessage({ protocolVersion: 1, viewSessionId: "browser-f07", generation: 1,
              sourceVersionKey: "f07-worker-browser-source", kind: "load-chunk", payload: { chunkId, chunkBuffer: bytes.buffer } }, [bytes.buffer]);
            return;
          }
          if (stage === "chunk" && message.kind === "chunk") {
            workerCacheRetainedSource = message.payload.workerRefinementSourceCache?.retained === true;
            const periodicSourceRefs = message.payload.meta?.curveSourceRefs?.filter((ref) =>
              ref.sourceType === "SPLINE" && ref.sourceHandle === "PERIODIC1" && ref.splineSource);
            if (!(message.payload.curveDataArray instanceof Float32Array) || !periodicSourceRefs?.length) {
              return fail(new Error("Worker did not return analytic source data"));
            }
            loadedChunk = message.payload;
            if (!Array.isArray(loadedChunk.meta?.hatchFillSources) || loadedChunk.meta.hatchFillSources.length !== 1) {
              return fail(new Error("Worker chunk omitted bounded source-backed solid HATCH metadata"));
            }
            stage = "refined";
            worker.postMessage({ protocolVersion: 1, viewSessionId: "browser-f07", generation: 1,
              sourceVersionKey: "f07-worker-browser-source", kind: "refine-curves",
              payload: { chunkId, requestId: "browser-refine-1", targetErrorCssPixels: 0.25,
                unitsPerCssPixel: 0.01, maxTransformSingularValue: 1 } });
            return;
          }
          if (stage === "refined" && message.kind === "refined-curves") {
            const interval = message.payload.result.intervals.find((candidate) =>
              candidate.sourceType === "SPLINE" && candidate.sourceHandle === "PERIODIC1");
            initialResult = {
              sourceRefCount: message.payload.result.intervals.length,
              errorBoundMet: message.payload.result.errorBoundMet,
              segmentCount: interval?.segmentCount,
              sourceSegmentCount: interval?.sourceSegmentCount,
              coordinatesAreFloat32: interval?.coordinates instanceof Float32Array,
              outputBytes: message.payload.result.totalOutputBytes,
            };
            stage = "hatch-refined";
            const hatchSource = loadedChunk.meta.hatchFillSources[0];
            worker.postMessage({ protocolVersion: 1, viewSessionId: "browser-f07", generation: 1,
              sourceVersionKey: "f07-worker-browser-source", kind: "refine-hatches",
              payload: { chunkId, requestId: "browser-hatch-refine-1", hatchSourceJson: JSON.stringify(hatchSource.source),
                targetErrorCssPixels: 0.25, unitsPerCssPixel: 0.01, maxTransformSingularValue: 1 } });
            return;
          }
          if (stage === "hatch-refined" && message.kind === "refined-hatches") {
            const result = message.payload.result;
            hatchResult = { status: result.status, errorBoundMet: result.errorBoundMet,
              verticesAreFloat64: result.verticesWorld instanceof Float64Array,
              triangleCount: result.triangleCount, measuredErrorWorld: result.measuredBoundaryErrorWorld };
            stage = "cancelled";
            worker.postMessage({ protocolVersion: 1, viewSessionId: "browser-f07", generation: 2,
              sourceVersionKey: "f07-worker-browser-source", kind: "cancel" });
            return;
          }
          if (stage === "cancelled" && message.kind === "cancelled") {
            stage = "stale";
            worker.postMessage({ protocolVersion: 1, viewSessionId: "browser-f07", generation: 1,
              sourceVersionKey: "f07-worker-browser-source", kind: "refine-curves",
              payload: { chunkId, requestId: "stale-refine", targetErrorCssPixels: 0.25,
                unitsPerCssPixel: 0.01, maxTransformSingularValue: 1 } });
            setTimeout(() => {
              if (stage !== "stale") return;
              stage = "refined-current-generation";
              const curveDataBuffer = new Float32Array(loadedChunk.curveDataArray).buffer;
              worker.postMessage({ protocolVersion: 1, viewSessionId: "browser-f07", generation: 2,
                sourceVersionKey: "f07-worker-browser-source", kind: "refine-curves",
                payload: { chunkId: "evicted-chunk", requestId: "current-refine", targetErrorCssPixels: 0.25,
                  unitsPerCssPixel: 0.01, maxTransformSingularValue: 1, curveDataBuffer,
                  curveSourceRefs: loadedChunk.meta.curveSourceRefs, fallbackVertexCount: loadedChunk.vertexCount } }, [curveDataBuffer]);
            }, 50);
            return;
          }
          if (stage === "stale" && message.kind === "refined-curves" && message.payload.requestId === "stale-refine") {
            return fail(new Error("Worker emitted an old-generation refinement result"));
          }
          if (stage === "refined-current-generation" && message.kind === "refined-curves" && message.payload.requestId === "current-refine") {
            stage = "inline-json-fallback";
            const curveDataBuffer = new Float32Array(loadedChunk.curveDataArray).buffer;
            worker.postMessage({ protocolVersion: 1, viewSessionId: "browser-f07", generation: 2,
              sourceVersionKey: "f07-worker-browser-source", kind: "refine-curves",
              payload: { chunkId: "evicted-chunk-json", requestId: "json-fallback", targetErrorCssPixels: 0.25,
                unitsPerCssPixel: 0.01, maxTransformSingularValue: 1, curveDataBuffer,
                curveSourceRefsJson: JSON.stringify(loadedChunk.meta.curveSourceRefs),
                fallbackVertexCount: loadedChunk.vertexCount } }, [curveDataBuffer]);
            return;
          }
          if (stage === "inline-json-fallback" && message.kind === "refined-curves" && message.payload.requestId === "json-fallback") {
            clearTimeout(timer);
            const answer = { ...initialResult, hatchResult, stage: message.kind, staleGenerationDropped: true,
              workerCacheRetainedSource,
              currentGenerationInlineSourceFallback: message.payload.result.intervals.length > 0,
              currentGenerationErrorBoundMet: message.payload.result.errorBoundMet,
              inlineJsonSourceFallback: message.payload.result.errorBoundMet && message.payload.result.intervals.length > 0 };
            worker.terminate();
            resolve(answer);
          }
        };
        worker.postMessage({ protocolVersion: 1, viewSessionId: "browser-f07", generation: 1,
          sourceVersionKey: "f07-worker-browser-source", kind: "ping" });
      });
    })(${JSON.stringify({ bytesBase64: chunkBase64, chunkId: chunkRef.chunkId })})`;
    const result = await page.evaluate(browserWorkerProgram) as {
      stage: string;
      sourceRefCount: number;
      errorBoundMet: boolean;
      segmentCount: number;
      sourceSegmentCount: number;
      coordinatesAreFloat32: boolean;
      outputBytes: number;
      hatchResult: { status: string; errorBoundMet: boolean; verticesAreFloat64: boolean; triangleCount: number; measuredErrorWorld: number };
      staleGenerationDropped: boolean;
      workerCacheRetainedSource: boolean;
      currentGenerationInlineSourceFallback: boolean;
      currentGenerationErrorBoundMet: boolean;
      inlineJsonSourceFallback: boolean;
    };

    assert.equal(result.stage, "refined-curves", "real browser worker handled source load and curve refinement");
    assert.equal(result.errorBoundMet, true, "worker refinement met the bounded CSS error target");
    assert.equal(result.coordinatesAreFloat32, true, "worker transferred refinement vertices as Float32Array");
    assert.ok(result.segmentCount > result.sourceSegmentCount, "fine-view worker result refined beyond initial tessellation");
    assert.ok(result.outputBytes > 0, "worker returned bounded output allocations");
    assert.equal(result.hatchResult.status, "refined", "real browser worker remeshed the retained source HATCH");
    assert.equal(result.hatchResult.errorBoundMet, true, "worker HATCH boundary stays within its world-space target");
    assert.equal(result.hatchResult.verticesAreFloat64, true, "worker transfers world-space HATCH mesh as Float64Array");
    assert.ok(result.hatchResult.triangleCount > 0 && result.hatchResult.measuredErrorWorld <= 0.0025);
    assert.equal(result.staleGenerationDropped, true, "worker ignores a request from a generation superseded by cancel");
    assert.equal(result.workerCacheRetainedSource, true, "worker reports retained analytic source for cache-hit refinement");
    assert.equal(result.currentGenerationInlineSourceFallback, true, "a bounded inline sidecar fallback survives LRU eviction");
    assert.equal(result.currentGenerationErrorBoundMet, true, "current generation inline fallback still meets the bounded error target");
    assert.equal(result.inlineJsonSourceFallback, true, "bounded JSON-string sidecar survives worker transfer");
    console.log("F07 real-browser periodic SPLINE load → cached refine → array/JSON inline fallbacks PASS:", JSON.stringify(result));
  } catch (error) {
    console.error("F07 real-browser worker refinement FAILED:", error);
    exitCode = 1;
  } finally {
    if (browser) {
      try { await browser.close(); } catch (error) { console.error("Browser close failed:", error); }
    }
    if (server) {
      try { await new Promise<void>((resolve) => server!.close(() => resolve())); }
      catch (error) { console.error("Test HTTP server close failed:", error); }
    }
    process.exit(exitCode);
  }
}

void main();
