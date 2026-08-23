/// <reference lib="webworker" />

import { convertAndValidateDwgToDxf } from "@/lib/dokumantasyon/dwg";

const scope = self as DedicatedWorkerGlobalScope;

interface ConversionRequest {
  requestId: string;
  buffer: ArrayBuffer;
}

interface WorkerIssue {
  code: string;
  severity: "warning" | "blocking";
  message: string;
}

function issueSummary(issues: WorkerIssue[]): WorkerIssue[] {
  return issues.slice(0, 24).map((issue) => ({
    code: issue.code,
    severity: issue.severity,
    message: issue.message,
  }));
}

scope.onmessage = async (event: MessageEvent<ConversionRequest>) => {
  const requestId = event.data?.requestId;
  const buffer = event.data?.buffer;
  const startedAt = performance.now();

  if (!requestId || !(buffer instanceof ArrayBuffer)) {
    scope.postMessage({
      requestId: requestId || "unknown",
      ok: false,
      errorCode: "INVALID_WORKER_REQUEST",
      errorMessage: "DWG worker geçerli bir ArrayBuffer alamadı.",
    });
    return;
  }

  try {
    const { conversion, validation } = await convertAndValidateDwgToDxf(buffer);

    if (validation.decision === "REJECT") {
      scope.postMessage({
        requestId,
        ok: false,
        fallback: true,
        errorCode: "FIDELITY_REJECTED",
        errorMessage: "Hızlı DWG→DXF dönüşümü fidelity denetiminden geçmedi.",
        decision: validation.decision,
        issues: issueSummary(validation.issues),
        elapsedMs: Math.round(performance.now() - startedAt),
      });
      return;
    }

    // Always transfer an owned, exact-size buffer. This avoids retaining a larger
    // adaptive writer buffer and makes the postMessage transfer zero-copy.
    const exactBytes = conversion.dxfBytes.slice();
    const dxfBuffer = exactBytes.buffer;

    scope.postMessage(
      {
        requestId,
        ok: true,
        decision: validation.decision,
        issues: issueSummary(validation.issues),
        diagnostics: conversion.diagnostics.slice(0, 24),
        sourceBytes: conversion.inspection.byteLength,
        dxfBytes: exactBytes.byteLength,
        elapsedMs: Math.round(performance.now() - startedAt),
        dxfBuffer,
      },
      [dxfBuffer]
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    scope.postMessage({
      requestId,
      ok: false,
      fallback: true,
      errorCode: /DXF subclass|_Layout|class metadata/i.test(message)
        ? "WORKER_CLASS_NAME_CONTRACT_FAILED"
        : "WORKER_CONVERSION_FAILED",
      errorMessage: message,
      elapsedMs: Math.round(performance.now() - startedAt),
    });
  }
};

export {};
