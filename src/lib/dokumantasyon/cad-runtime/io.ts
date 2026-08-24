"use client";

export class CadRuntimeIoError extends Error {
  constructor(public readonly code: string, message: string) {
    super(message);
    this.name = "CadRuntimeIoError";
  }
}

export async function fetchCadWithDeadline(
  input: RequestInfo | URL,
  init: RequestInit,
  parentSignal: AbortSignal,
  timeoutMs: number,
  timeoutCode: string
): Promise<Response> {
  const controller = new AbortController();
  let timedOut = false;
  const forwardAbort = () => controller.abort(parentSignal.reason);

  if (parentSignal.aborted) {
    forwardAbort();
  } else {
    parentSignal.addEventListener("abort", forwardAbort, { once: true });
  }

  const timer = window.setTimeout(() => {
    timedOut = true;
    controller.abort(timeoutCode);
  }, timeoutMs);

  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } catch (error) {
    if (timedOut) {
      throw new CadRuntimeIoError(timeoutCode, `İstek ${timeoutMs} ms sınırını aştı.`);
    }
    throw error;
  } finally {
    window.clearTimeout(timer);
    parentSignal.removeEventListener("abort", forwardAbort);
  }
}

export async function readCadResponseWithinLimit(
  response: Response,
  maxBytes: number,
  limitCode: string
): Promise<ArrayBuffer> {
  const declared = response.headers.get("Content-Length");
  const declaredLength = declared ? Number(declared) : Number.NaN;

  if (Number.isFinite(declaredLength) && declaredLength > maxBytes) {
    throw new CadRuntimeIoError(limitCode, `Yanıt ${declaredLength} bayt ile browser sınırını aşıyor.`);
  }

  if (!response.body) {
    const buffer = await response.arrayBuffer();
    if (buffer.byteLength <= 0 || buffer.byteLength > maxBytes) {
      throw new CadRuntimeIoError(limitCode, `Yanıt boyutu geçersiz: ${buffer.byteLength} bayt.`);
    }
    return buffer;
  }

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!value?.byteLength) continue;
      totalBytes += value.byteLength;
      if (totalBytes > maxBytes) {
        await reader.cancel(limitCode);
        throw new CadRuntimeIoError(limitCode, `Streaming yanıt ${maxBytes} bayt sınırını aştı.`);
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  if (totalBytes <= 0) {
    throw new CadRuntimeIoError(limitCode, "Yanıt boş.");
  }

  const merged = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return merged.buffer;
}

export function convertedDxfDisplayName(displayName: string): string {
  return displayName.replace(/\.dwg$/iu, "") + ".dxf";
}
