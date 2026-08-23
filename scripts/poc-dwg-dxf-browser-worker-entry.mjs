import { DwgReader, DxfWriter } from "@node-projects/acad-ts";

const MIN_DXF_BUFFER_BYTES = 4 * 1024 * 1024;
const MAX_DXF_BUFFER_BYTES = 128 * 1024 * 1024;

function countCollection(value) {
  if (!value) return 0;
  if (typeof value.length === "number") return value.length;
  if (typeof value.size === "number") return value.size;
  if (typeof value.count === "number") return value.count;
  if (typeof value[Symbol.iterator] === "function") {
    let count = 0;
    for (const _item of value) count += 1;
    return count;
  }
  return 0;
}

function notificationMessage(event) {
  if (!event || typeof event !== "object") return String(event ?? "");
  const message = event.message ?? event.Message ?? event.error ?? event.Error;
  return typeof message === "string" ? message : JSON.stringify(event);
}

function usedUint8Length(buffer) {
  for (let index = buffer.length - 1; index >= 0; index -= 1) {
    if (buffer[index] !== 0) return index + 1;
  }
  return 0;
}

function resolveRead() {
  const read = DwgReader.readFromStream ?? DwgReader.ReadFromStream;
  if (typeof read !== "function") throw new Error("DwgReader read API not found");
  return read;
}

function resolveWrite() {
  const write = DxfWriter.writeToStream ?? DxfWriter.WriteToStream;
  if (typeof write !== "function") throw new Error("DxfWriter write API not found");
  return write;
}

function writeAsciiDxfAdaptive(document, sourceBytes, warnings) {
  const write = resolveWrite();
  let capacity = Math.max(MIN_DXF_BUFFER_BYTES, sourceBytes * 4);
  let attempts = 0;

  while (capacity <= MAX_DXF_BUFFER_BYTES) {
    attempts += 1;
    const target = new Uint8Array(capacity);
    try {
      write.call(
        DxfWriter,
        target,
        document,
        false,
        undefined,
        (_sender, event) => warnings.push(notificationMessage(event))
      );
      return {
        outputBytes: usedUint8Length(target),
        outputCapacityBytes: capacity,
        outputAttempts: attempts,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (!/buffer is too small|too small/i.test(message) || capacity === MAX_DXF_BUFFER_BYTES) {
        throw error;
      }
      capacity = Math.min(capacity * 2, MAX_DXF_BUFFER_BYTES);
    }
  }

  throw new Error(`DXF output exceeded ${MAX_DXF_BUFFER_BYTES} bytes`);
}

self.onmessage = (event) => {
  const { requestId, buffer } = event.data ?? {};
  const started = performance.now();

  try {
    if (!(buffer instanceof ArrayBuffer)) throw new Error("Worker expected an ArrayBuffer");
    const bytes = new Uint8Array(buffer);
    const magic = String.fromCharCode(...bytes.subarray(0, 6));
    const readWarnings = [];
    const writeWarnings = [];
    const read = resolveRead();

    const readStarted = performance.now();
    const document = read.call(
      DwgReader,
      buffer,
      (_sender, notification) => readWarnings.push(notificationMessage(notification))
    );
    const readMs = performance.now() - readStarted;

    const entityCount = countCollection(document?.modelSpace?.entities);
    const layerCount = countCollection(document?.layers);
    const blockCount = countCollection(document?.blockRecords ?? document?.blocks);

    const writeStarted = performance.now();
    const output = writeAsciiDxfAdaptive(document, bytes.byteLength, writeWarnings);
    const writeMs = performance.now() - writeStarted;

    self.postMessage({
      requestId,
      ok: true,
      magic,
      sourceBytes: bytes.byteLength,
      readMs,
      writeMs,
      totalMs: performance.now() - started,
      entityCount,
      layerCount,
      blockCount,
      readWarnings: [...new Set(readWarnings)].slice(0, 50),
      writeWarnings: [...new Set(writeWarnings)].slice(0, 50),
      ...output,
    });
  } catch (error) {
    self.postMessage({
      requestId,
      ok: false,
      totalMs: performance.now() - started,
      error: error instanceof Error ? error.stack || error.message : String(error),
    });
  }
};
