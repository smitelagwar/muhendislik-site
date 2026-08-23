import { DwgReader, DxfWriter } from "@node-projects/acad-ts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const UPSTREAM_COMMIT = "15b87c1ca2784fca623c44a6836f723e77411fd8";
const SUPPORTED_FIXTURES = new Set([
  "AC1014",
  "AC1015",
  "AC1018",
  "AC1021",
  "AC1024",
  "AC1027",
  "AC1032",
]);
const MIN_DXF_BUFFER_BYTES = 4 * 1024 * 1024;
const MAX_DXF_BUFFER_BYTES = 32 * 1024 * 1024;

type ReaderStatic = (
  stream: ArrayBuffer,
  notification?: ((sender: unknown, event: unknown) => void) | null
) => unknown;

type WriterStatic = (
  stream: Uint8Array,
  document: unknown,
  binary?: boolean,
  configuration?: unknown,
  notification?: ((sender: unknown, event: unknown) => void) | null
) => void;

function roundMs(value: number) {
  return Math.round(value * 100) / 100;
}

function countCollection(value: unknown) {
  if (!value || typeof value !== "object") return 0;
  const candidate = value as {
    length?: number;
    size?: number;
    count?: number;
    [Symbol.iterator]?: () => Iterator<unknown>;
  };
  if (typeof candidate.length === "number") return candidate.length;
  if (typeof candidate.size === "number") return candidate.size;
  if (typeof candidate.count === "number") return candidate.count;
  if (typeof candidate[Symbol.iterator] === "function") {
    let count = 0;
    for (const _item of candidate as Iterable<unknown>) count += 1;
    return count;
  }
  return 0;
}

function notificationMessage(event: unknown) {
  if (!event || typeof event !== "object") return String(event ?? "");
  const candidate = event as Record<string, unknown>;
  const message = candidate.message ?? candidate.Message ?? candidate.error ?? candidate.Error;
  return typeof message === "string" ? message : JSON.stringify(event);
}

function usedUint8Length(buffer: Uint8Array) {
  for (let index = buffer.length - 1; index >= 0; index -= 1) {
    if (buffer[index] !== 0) return index + 1;
  }
  return 0;
}

function memorySnapshot() {
  const value = process.memoryUsage();
  return {
    rss: value.rss,
    heapUsed: value.heapUsed,
    external: value.external,
    arrayBuffers: value.arrayBuffers,
  };
}

function resolveReader() {
  const Reader = DwgReader as unknown as {
    readFromStream?: ReaderStatic;
    ReadFromStream?: ReaderStatic;
  };
  const read = Reader.readFromStream ?? Reader.ReadFromStream;
  if (typeof read !== "function") {
    throw new Error("DwgReader readFromStream/ReadFromStream API not found");
  }
  return read;
}

function resolveWriter() {
  const Writer = DxfWriter as unknown as {
    writeToStream?: WriterStatic;
    WriteToStream?: WriterStatic;
  };
  const write = Writer.writeToStream ?? Writer.WriteToStream;
  if (typeof write !== "function") {
    throw new Error("DxfWriter writeToStream/WriteToStream API not found");
  }
  return write;
}

function writeAsciiDxfAdaptive(document: unknown, sourceBytes: number, warnings: string[]) {
  const write = resolveWriter();
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

function isPreviewEnvironment() {
  return process.env.VERCEL_ENV === "preview";
}

export async function GET(request: Request) {
  if (!isPreviewEnvironment()) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const url = new URL(request.url);
  const fixture = (url.searchParams.get("fixture") ?? "AC1032").toUpperCase();
  if (!SUPPORTED_FIXTURES.has(fixture)) {
    return Response.json(
      { error: "Unsupported fixture", supported: [...SUPPORTED_FIXTURES] },
      { status: 400 }
    );
  }

  const sourceUrl = `https://raw.githubusercontent.com/node-projects/acad-ts/${UPSTREAM_COMMIT}/samples/sample_${fixture}.dwg`;
  const totalStarted = performance.now();
  const fetchStarted = performance.now();
  const response = await fetch(sourceUrl, { cache: "no-store" });
  if (!response.ok) {
    return Response.json(
      { error: "Fixture fetch failed", status: response.status, fixture },
      { status: 502 }
    );
  }
  const source = await response.arrayBuffer();
  const fetchMs = performance.now() - fetchStarted;
  const sourceBytes = source.byteLength;
  const sourceView = new Uint8Array(source);
  const magic = String.fromCharCode(...sourceView.subarray(0, 6));

  const memoryBefore = memorySnapshot();
  const readWarnings: string[] = [];
  const writeWarnings: string[] = [];
  const read = resolveReader();

  const readStarted = performance.now();
  const document = read.call(
    DwgReader,
    source,
    (_sender, event) => readWarnings.push(notificationMessage(event))
  ) as {
    modelSpace?: { entities?: unknown };
    layers?: unknown;
    blockRecords?: unknown;
    blocks?: unknown;
  };
  const readMs = performance.now() - readStarted;
  const memoryAfterRead = memorySnapshot();

  const entityCount = countCollection(document?.modelSpace?.entities);
  const layerCount = countCollection(document?.layers);
  const blockCount = countCollection(document?.blockRecords ?? document?.blocks);

  const writeStarted = performance.now();
  const output = writeAsciiDxfAdaptive(document, sourceBytes, writeWarnings);
  const writeMs = performance.now() - writeStarted;
  const memoryAfterWrite = memorySnapshot();
  const totalMs = performance.now() - totalStarted;

  return Response.json({
    phase: 1,
    fixture,
    sourceCommit: UPSTREAM_COMMIT,
    runtime: {
      node: process.version,
      vercelEnv: process.env.VERCEL_ENV ?? null,
      vercelRegion: process.env.VERCEL_REGION ?? null,
    },
    magic,
    sourceBytes,
    entityCount,
    layerCount,
    blockCount,
    timings: {
      fetchMs: roundMs(fetchMs),
      readMs: roundMs(readMs),
      writeMs: roundMs(writeMs),
      conversionMs: roundMs(readMs + writeMs),
      totalMs: roundMs(totalMs),
    },
    output,
    warnings: {
      read: [...new Set(readWarnings)].slice(0, 50),
      write: [...new Set(writeWarnings)].slice(0, 50),
    },
    memory: {
      before: memoryBefore,
      afterRead: memoryAfterRead,
      afterWrite: memoryAfterWrite,
    },
  });
}
