// ============================================================================
// CAD V2 COMPILER SERVICE — MAIN ENTRY POINT (G11, D09)
// ============================================================================

import { startDurableCadV2WorkerLoop } from "../../../src/lib/cad-v2/worker/durable-worker";

export { CompilerSupervisor } from "./supervisor";
export { runCompileChild } from "./compiler-child";

if (process.env.CAD_V2_DURABLE_WORKER === "true") {
  const controller = new AbortController();
  const stop = () => controller.abort();
  process.once("SIGTERM", stop);
  process.once("SIGINT", stop);
  await startDurableCadV2WorkerLoop({ signal: controller.signal });
} else {
  console.log("[CAD V2 Compiler Service] Hazır (Node 24.15.0 Linux Container Runtime).");
}
