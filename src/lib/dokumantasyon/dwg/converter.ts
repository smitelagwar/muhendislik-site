import type { CadDocument } from "@node-projects/acad-ts";
import { normalizeDiagnostics, notificationMessage } from "./diagnostics";
import { loadAcadTsEngine, type AcadTsEngine } from "./engine";
import { assertConvertibleDwg, inspectDwgBytes } from "./inspect";
import { DWG_DXF_CONVERTER_SIGNATURE, DWG_DXF_PROFILE } from "./signature";
import {
  DwgConversionError,
  type DwgConversionOptions,
  type DwgConversionResult,
  type DxfEnvelopeInspection,
} from "./types";

const DEFAULT_INITIAL_OUTPUT_BYTES = 4 * 1024 * 1024;
const DEFAULT_MAX_OUTPUT_BYTES = 256 * 1024 * 1024;
const MIN_OUTPUT_LIMIT_BYTES = 1024;

function toUint8Array(source: Uint8Array | ArrayBuffer): Uint8Array {
  return source instanceof Uint8Array ? source : new Uint8Array(source);
}

function exactArrayBuffer(source: Uint8Array): ArrayBuffer {
  const copy = new Uint8Array(source.byteLength);
  copy.set(source);
  return copy.buffer;
}

function usedUint8Length(buffer: Uint8Array): number {
  for (let index = buffer.length - 1; index >= 0; index -= 1) {
    if (buffer[index] !== 0) return index + 1;
  }
  return 0;
}

function asciiSlice(bytes: Uint8Array, start: number, end: number): string {
  let value = "";
  const boundedStart = Math.max(0, start);
  const boundedEnd = Math.min(bytes.length, end);
  for (let index = boundedStart; index < boundedEnd; index += 1) {
    value += String.fromCharCode(bytes[index]);
  }
  return value;
}

export function inspectDxfEnvelope(bytes: Uint8Array): DxfEnvelopeInspection {
  const head = asciiSlice(bytes, 0, Math.min(bytes.length, 8192));
  const tail = asciiSlice(bytes, Math.max(0, bytes.length - 4096), bytes.length);
  const hasSection = /\bSECTION\b/.test(head);
  const hasHeader = /\bHEADER\b/.test(head);
  const hasEof = /\bEOF\b/.test(tail);
  return {
    hasSection,
    hasHeader,
    hasEof,
    valid: bytes.byteLength > 0 && hasSection && hasHeader && hasEof,
  };
}

function countCollection(value: unknown): number {
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
  const iteratorFactory = candidate[Symbol.iterator];
  if (typeof iteratorFactory === "function") {
    const iterator = iteratorFactory.call(candidate);
    let count = 0;
    while (!iterator.next().done) count += 1;
    return count;
  }
  return 0;
}

function createReaderConfiguration(acad: AcadTsEngine) {
  const configuration = new acad.DwgReaderConfiguration();
  const profile = DWG_DXF_PROFILE.reader;
  configuration.failsafe = profile.failsafe;
  configuration.keepUnknownEntities = profile.keepUnknownEntities;
  configuration.keepUnknownNonGraphicalObjects = profile.keepUnknownNonGraphicalObjects;
  configuration.crcCheck = profile.crcCheck;
  configuration.readSummaryInfo = profile.readSummaryInfo;
  return configuration;
}

function createWriterConfiguration(acad: AcadTsEngine) {
  const configuration = new acad.DxfWriterConfiguration();
  const profile = DWG_DXF_PROFILE.writer;
  configuration.writeAllHeaderVariables = profile.writeAllHeaderVariables;
  configuration.writeOptionalValues = profile.writeOptionalValues;
  configuration.closeStream = profile.closeStream;
  configuration.resetDxfClasses = profile.resetDxfClasses;
  configuration.updateDimensionsInBlocks = profile.updateDimensionsInBlocks;
  configuration.updateDimensionsInModel = profile.updateDimensionsInModel;
  configuration.writeXData = profile.writeXData;
  configuration.writeXRecords = profile.writeXRecords;
  configuration.writeShapes = profile.writeShapes;
  return configuration;
}

function normalizePositiveInteger(value: number | undefined, fallback: number, name: string): number {
  const resolved = value ?? fallback;
  if (!Number.isFinite(resolved) || resolved < MIN_OUTPUT_LIMIT_BYTES) {
    throw new RangeError(`${name} must be a finite integer >= ${MIN_OUTPUT_LIMIT_BYTES}.`);
  }
  return Math.floor(resolved);
}

function writeAsciiDxf(
  acad: AcadTsEngine,
  document: CadDocument,
  sourceBytes: number,
  writeMessages: string[],
  options: DwgConversionOptions
): { bytes: Uint8Array; capacityBytes: number; attempts: number } {
  const maxOutputBytes = normalizePositiveInteger(
    options.maxOutputBytes,
    DEFAULT_MAX_OUTPUT_BYTES,
    "maxOutputBytes"
  );
  const requestedInitial = normalizePositiveInteger(
    options.initialOutputBytes,
    DEFAULT_INITIAL_OUTPUT_BYTES,
    "initialOutputBytes"
  );
  const sourceScaled = Math.min(maxOutputBytes, Math.max(MIN_OUTPUT_LIMIT_BYTES, sourceBytes * 4));
  let capacity = Math.min(maxOutputBytes, Math.max(requestedInitial, sourceScaled));
  let attempts = 0;

  while (true) {
    attempts += 1;
    const target = new Uint8Array(capacity);
    try {
      acad.DxfWriter.writeToStream(
        target,
        document,
        false,
        createWriterConfiguration(acad),
        (_sender, event) => writeMessages.push(notificationMessage(event))
      );
      const usedBytes = usedUint8Length(target);
      return {
        bytes: target.slice(0, usedBytes),
        capacityBytes: capacity,
        attempts,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const bufferTooSmall = /DXF output buffer is too small|buffer is too small/i.test(message);
      if (!bufferTooSmall) {
        throw new DwgConversionError("WRITE_FAILED", `DWG to DXF write failed: ${message}`, {
          cause: error,
        });
      }
      if (capacity >= maxOutputBytes) {
        throw new DwgConversionError(
          "OUTPUT_LIMIT_EXCEEDED",
          `DXF output exceeded the configured ${maxOutputBytes}-byte limit.`,
          { cause: error }
        );
      }
      capacity = Math.min(maxOutputBytes, capacity * 2);
    }
  }
}

export async function convertDwgToDxf(
  input: Uint8Array | ArrayBuffer,
  options: DwgConversionOptions = {}
): Promise<DwgConversionResult> {
  const source = toUint8Array(input);
  const inspection = inspectDwgBytes(source);
  assertConvertibleDwg(inspection);

  const acad = await loadAcadTsEngine();
  const readMessages: string[] = [];
  const writeMessages: string[] = [];
  let document: CadDocument;

  try {
    document = acad.DwgReader.readFromStreamWithConfig(
      exactArrayBuffer(source),
      createReaderConfiguration(acad),
      (_sender, event) => readMessages.push(notificationMessage(event))
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new DwgConversionError("READ_FAILED", `DWG read failed: ${message}`, {
      inspection,
      cause: error,
    });
  }

  const output = writeAsciiDxf(acad, document, source.byteLength, writeMessages, options);
  const dxfEnvelope = inspectDxfEnvelope(output.bytes);
  if (!dxfEnvelope.valid) {
    throw new DwgConversionError(
      "INVALID_DXF_ENVELOPE",
      "DXF writer returned bytes without a complete SECTION/HEADER/EOF envelope.",
      { inspection }
    );
  }

  return {
    signature: DWG_DXF_CONVERTER_SIGNATURE,
    profile: DWG_DXF_PROFILE,
    inspection,
    dxfBytes: output.bytes,
    dxfEnvelope,
    diagnostics: normalizeDiagnostics(readMessages, writeMessages),
    stats: {
      sourceBytes: source.byteLength,
      outputBytes: output.bytes.byteLength,
      outputCapacityBytes: output.capacityBytes,
      outputAttempts: output.attempts,
      entityCount: countCollection(document.modelSpace?.entities),
      layerCount: countCollection(document.layers),
      blockCount: countCollection(document.blockRecords),
    },
  };
}
