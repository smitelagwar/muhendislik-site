import { CadV2WorkerClient } from "../../src/lib/cad-v2/worker/worker-client";

type SentMessage = { message: any; transfer: Transferable[] };

class MockWorker {
  static instance: MockWorker | null = null;
  static respondReady = true;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: ErrorEvent) => void) | null = null;
  messages: SentMessage[] = [];
  terminated = false;

  constructor(_url: string, _options?: WorkerOptions) {
    MockWorker.instance = this;
  }

  postMessage(message: any, transfer: Transferable[] = []): void {
    this.messages.push({ message, transfer });
    if (message.kind === "ping") {
      if (MockWorker.respondReady) queueMicrotask(() => this.respond(message, "ready", { pong: true }));
      return;
    }
    if (message.kind === "load-chunk") {
      queueMicrotask(() => this.respond(message, "chunk", {
        chunkId: message.payload.chunkId,
        origin: [0, 0],
        xyArray: new Float32Array([0, 0, 1, 1]),
        drawRunsArray: null,
        curveDataArray: new Float32Array([1, 2, 3, 4]),
        meta: { curveSourceRefs: [{ curveId: "curve-1", firstVertex: 0, vertexCount: 2 }] },
        vertexCount: 2,
        workerRefinementSourceCache: { retained: true, evictedChunkIds: [] },
      }));
      return;
    }
    if (message.kind === "refine-curves") {
      queueMicrotask(() => {
        if (!message.payload.curveDataBuffer) {
          this.respond(message, "error", {
            requestId: message.payload.requestId,
            error: `REFINEMENT_SOURCE_CACHE_MISS:${message.payload.chunkId}`,
          });
          return;
        }
        this.respond(message, "refined-curves", {
          requestId: message.payload.requestId,
          result: { intervals: [], totalSegments: 0, totalOutputBytes: 0, errorBoundMet: true },
        });
      });
    }
    if (message.kind === "refine-hatches") {
      queueMicrotask(() => this.respond(message, "refined-hatches", {
        requestId: message.payload.requestId,
        chunkId: message.payload.chunkId,
        result: { status: "refined", errorBoundMet: true, reason: undefined,
          verticesWorld: new Float64Array([0, 0, 1, 0, 0, 1]), requestedErrorWorld: 0.0025,
          measuredBoundaryErrorWorld: 0.001, triangleCount: 1 },
      }));
    }
  }

  terminate(): void {
    this.terminated = true;
  }

  private respond(request: any, kind: string, payload: any): void {
    this.onmessage?.({ data: {
      protocolVersion: 1,
      viewSessionId: request.viewSessionId,
      generation: request.generation,
      sourceVersionKey: request.sourceVersionKey,
      kind,
      payload,
    } } as MessageEvent);
  }
}

function assert(condition: boolean, message: string): void {
  if (!condition) {
    console.error(`FAIL: ${message}`);
    process.exitCode = 1;
    throw new Error(message);
  }
  console.log(`PASS: ${message}`);
}

async function runWorkerClientRefinementTests(): Promise<void> {
  const globalObject = globalThis as any;
  const hadWindow = Object.prototype.hasOwnProperty.call(globalObject, "window");
  const previousWindow = globalObject.window;
  const hadWorker = Object.prototype.hasOwnProperty.call(globalObject, "Worker");
  const previousWorker = globalObject.Worker;
  let client: CadV2WorkerClient | null = null;
  let delayedReadyTimer: ReturnType<typeof setTimeout> | null = null;

  try {
    globalObject.window = {};
    globalObject.Worker = MockWorker;
    client = new CadV2WorkerClient("session-1", "source-1");
    const transferredChunkBuffer = new ArrayBuffer(8);
    const loaded = await client.loadChunk("chunk-1", transferredChunkBuffer);
    const workerSourceSidecarBytes = loaded.curveDataArray!.byteLength +
      JSON.stringify(loaded.meta!.curveSourceRefs).length * 2;
    assert(loaded.workerRefinementSourceCache === undefined, "worker cache bookkeeping is removed before chunk reaches host callers");
    assert(await client.getCurveRefinementWorkerSourceBytes(loaded) === workerSourceSidecarBytes,
      "worker source accounting uses the exact retained entry bytes, not cache capacity");
    const unrelatedLoaded = await client.loadChunk("chunk-unrelated", new ArrayBuffer(8));
    const unrelatedWorkerSourceSidecarBytes = unrelatedLoaded.curveDataArray!.byteLength +
      JSON.stringify(unrelatedLoaded.meta!.curveSourceRefs).length * 2;
    assert(await client.getCurveRefinementWorkerSourceBytes(loaded) === workerSourceSidecarBytes,
      `curve preflight excludes unrelated evictable worker entries (${unrelatedWorkerSourceSidecarBytes} bytes)`);
    const chunkLoadsBeforeDuplicateTransfer = MockWorker.instance!.messages.filter(({ message }) => message.kind === "load-chunk").length;
    let duplicateTransferRejected = false;
    try {
      await client.loadChunk("chunk-1-reused-buffer", transferredChunkBuffer);
    } catch (error) {
      duplicateTransferRejected = error instanceof Error && error.message.includes("already transferred");
    }
    assert(duplicateTransferRejected, "a transferred chunk buffer cannot be submitted to another worker load");
    assert(MockWorker.instance!.messages.filter(({ message }) => message.kind === "load-chunk").length === chunkLoadsBeforeDuplicateTransfer,
      "rejected duplicate transfer does not create a second worker owner");

    const result = await client.refineCurves(loaded, {
      targetErrorCssPixels: 0.25,
      unitsPerCssPixel: 0.01,
      maxTransformSingularValue: 1,
    });
    assert(await client.getCurveRefinementWorkerSourceBytes(loaded) === workerSourceSidecarBytes,
      "a cache miss removes the stale entry before accounting for its inline retry");
    const sent = MockWorker.instance!.messages.filter(({ message }) => message.kind === "refine-curves");
    assert(result.errorBoundMet && sent.length === 2, "cache miss retries refinement once with bounded inline source");
    assert(sent[0]!.message.payload.curveDataBuffer === undefined && sent[0]!.transfer.length === 0,
      "known cache hit first sends no analytic source or transfer buffer");
    assert(sent[1]!.message.payload.curveDataBuffer instanceof ArrayBuffer && sent[1]!.transfer.length === 1,
      "cache miss fallback transfers one bounded curve buffer");
    assert(typeof sent[1]!.message.payload.curveSourceRefsJson === "string" &&
      sent[1]!.message.payload.curveSourceRefs === undefined,
    "fallback sends compact refs JSON instead of a cloned object graph");
    const hatchSource = { handle: "H1", layer: "FILL", order: "1", isSolid: true, loops: [] };
    const hatchResult = await client.refineHatchFill("chunk-1", hatchSource, {
      targetErrorCssPixels: 0.25, unitsPerCssPixel: 0.01, maxTransformSingularValue: 1,
    });
    const hatchMessage = MockWorker.instance!.messages.find(({ message }) => message.kind === "refine-hatches");
    assert(hatchResult.status === "refined" && hatchResult.verticesWorld instanceof Float64Array,
      "worker client resolves source HATCH mesh result as Float64 world geometry");
    assert(hatchMessage?.message.payload.hatchSourceJson === JSON.stringify(hatchSource),
      "worker client sends the bounded HATCH source as a serialized sidecar");
    assert((client as any).readyTimeout === null, "worker ready response clears the startup fallback timer");
    client.dispose();
    assert(await client.getCurveRefinementWorkerSourceBytes(loaded) === 0, "dispose clears worker-side source memory accounting");
    assert(MockWorker.instance!.terminated, "dispose terminates the worker after refinement completes");

    MockWorker.respondReady = false;
    client = new CadV2WorkerClient("session-late-ready", "source-late-ready");
    const lateReadyWorker = MockWorker.instance!;
    const ping = lateReadyWorker.messages.find(({ message }) => message.kind === "ping")!;
    delayedReadyTimer = setTimeout(() => {
      (lateReadyWorker as any).respond(ping.message, "ready", { pong: true });
    }, 20);
    const preflightSourceBytes = await client.getCurveRefinementWorkerSourceBytes(loaded);
    assert(preflightSourceBytes === workerSourceSidecarBytes,
      "preflight waits for late worker readiness and counts the inline curve source that refinement will send");
    const lateReadyResult = await client.refineCurves(loaded, {
      targetErrorCssPixels: 0.25,
      unitsPerCssPixel: 0.01,
      maxTransformSingularValue: 1,
    });
    const lateReadyRefinement = MockWorker.instance!.messages.find(({ message }) => message.kind === "refine-curves")!;
    const sentCurveSourceBytes = (lateReadyRefinement.message.payload.curveDataBuffer as ArrayBuffer).byteLength +
      lateReadyRefinement.message.payload.curveSourceRefsJson.length * 2;
    assert(lateReadyResult.errorBoundMet && sentCurveSourceBytes === preflightSourceBytes,
      "late-ready refinement sends exactly the worker source bytes accounted by preflight");
    if (delayedReadyTimer) clearTimeout(delayedReadyTimer);
    delayedReadyTimer = null;
    client.dispose();

    MockWorker.respondReady = false;
    client = new CadV2WorkerClient("session-pending", "source-pending");
    const pendingLoad = client.loadChunk("chunk-pending", new ArrayBuffer(4));
    client.dispose();
    let disposedLoadRejected = false;
    try {
      await pendingLoad;
    } catch (error) {
      disposedLoadRejected = error instanceof Error && error.message.includes("disposed");
    }
    assert(disposedLoadRejected, "dispose during startup releases and rejects a waiting chunk load");
    assert((client as any).readyTimeout === null, "dispose clears the startup fallback timer");
  } finally {
    if (delayedReadyTimer) clearTimeout(delayedReadyTimer);
    client?.dispose();
    if (hadWindow) globalObject.window = previousWindow;
    else delete globalObject.window;
    if (hadWorker) globalObject.Worker = previousWorker;
    else delete globalObject.Worker;
  }
}

void runWorkerClientRefinementTests().catch((error) => {
  console.error("WorkerClient refinement test failed:", error);
  process.exitCode = 1;
});
