/// <reference lib="webworker" />

import {
  convertAndValidateDwgToDxf,
  DwgConversionError,
  DWG_BROWSER_DXF_HARD_LIMIT_BYTES,
  DWG_BROWSER_INITIAL_DXF_BUFFER_BYTES,
  DWG_BROWSER_SOURCE_HARD_LIMIT_BYTES,
} from "../../../lib/dokumantasyon/dwg";

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
      fallback: true,
      errorCode: "INVALID_WORKER_REQUEST",
      errorMessage: "DWG worker geçerli bir ArrayBuffer alamadı.",
    });
    return;
  }

  if (buffer.byteLength === 0 || buffer.byteLength > DWG_BROWSER_SOURCE_HARD_LIMIT_BYTES) {
    scope.postMessage({
      requestId,
      ok: false,
      fallback: true,
      errorCode: "WORKER_SOURCE_LIMIT_EXCEEDED",
      errorMessage: "DWG browser güvenlik bütçesinin dışında.",
      sourceBytes: buffer.byteLength,
      elapsedMs: Math.round(performance.now() - startedAt),
    });
    return;
  }

  try {
    const { conversion, validation } = await convertAndValidateDwgToDxf(buffer, {
      initialOutputBytes: DWG_BROWSER_INITIAL_DXF_BUFFER_BYTES,
      maxOutputBytes: DWG_BROWSER_DXF_HARD_LIMIT_BYTES,
    });

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

    if (conversion.dxfBytes.byteLength > DWG_BROWSER_DXF_HARD_LIMIT_BYTES) {
      scope.postMessage({
        requestId,
        ok: false,
        fallback: true,
        errorCode: "WORKER_DXF_OUTPUT_LIMIT_EXCEEDED",
        errorMessage: "Üretilen DXF browser güvenlik bütçesini aştı.",
        dxfBytes: conversion.dxfBytes.byteLength,
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
        sourceBytes: conversion.inspection.sourceBytes,
        dxfBytes: exactBytes.byteLength,
        elapsedMs: Math.round(performance.now() - startedAt),
        dxfBuffer,
      },
      [dxfBuffer]
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const errorCode =
      error instanceof DwgConversionError && error.code === "OUTPUT_LIMIT_EXCEEDED"
        ? "WORKER_DXF_OUTPUT_LIMIT_EXCEEDED"
        : /DXF subclass|_Layout|class metadata|Cannot access '.+' before initialization/i.test(message)
          ? "WORKER_CLASS_NAME_CONTRACT_FAILED"
          : "WORKER_CONVERSION_FAILED";

    scope.postMessage({
      requestId,
      ok: false,
      fallback: true,
      errorCode,
      errorMessage: message,
      elapsedMs: Math.round(performance.now() - startedAt),
    });
  }
};

export {};
