import type { UnpackedSceneChunk } from "../../../workers/cad-v2/cad-v2-scene-worker";
import type { CurveRefinementResult, RefinedCurveInterval } from "./curve-refinement";

type DrawCommand = {
  kind: "line" | "triangle" | "wipeout";
  firstVertex: number;
  vertexCount: number;
  [key: string]: unknown;
};

/** Builds a fresh fallback-compatible chunk. The input is never mutated. */
export function applyCurveRefinementsToChunk(
  source: UnpackedSceneChunk,
  result: CurveRefinementResult,
): UnpackedSceneChunk {
  const refinements = result.intervals
    .filter((item): item is RefinedCurveInterval & { coordinates: Float32Array } =>
      item.status === "refined" && item.errorBoundMet && item.coordinates instanceof Float32Array && item.segmentCount > 0)
    .sort((a, b) => a.firstVertex - b.firstVertex);
  if (refinements.length === 0) return source;

  const commands = (source.meta?.drawCommands ?? []) as DrawCommand[];
  const sourceVertexCount = source.xyArray.length / 2;
  let previousEnd = 0;
  for (const item of refinements) {
    if (!Number.isFinite(item.requestedErrorCssPixels) || item.requestedErrorCssPixels <= 0 ||
        !Number.isFinite(item.conservativeErrorCssPixels) || item.conservativeErrorCssPixels < 0 ||
        item.conservativeErrorCssPixels > item.requestedErrorCssPixels * (1 + 1e-12) ||
        !item.coordinates.every(Number.isFinite)) {
      throw new Error(`Curve ${item.curveId} has an invalid refined screen-space error result`);
    }
    const end = item.firstVertex + item.vertexCount;
    if (!Number.isSafeInteger(item.firstVertex) || !Number.isSafeInteger(item.vertexCount) ||
        item.firstVertex < previousEnd || item.firstVertex < 0 || end > sourceVertexCount ||
        item.vertexCount !== item.sourceSegmentCount * 2 || item.coordinates.length !== (item.segmentCount + 1) * 2) {
      throw new Error(`Invalid refinement span for curve ${item.curveId}`);
    }
    const owner = commands.filter((cmd) => cmd.kind === "line" &&
      cmd.firstVertex <= item.firstVertex && cmd.firstVertex + cmd.vertexCount >= end);
    if (owner.length !== 1) throw new Error(`Curve ${item.curveId} does not belong to exactly one line draw command`);
    previousEnd = end;
  }

  const pieces: Float32Array[] = [];
  const pathPieces: Float32Array[] = [];
  const deltas: Array<{ start: number; end: number; delta: number }> = [];
  let cursor = 0;
  for (const item of refinements) {
    const start = item.firstVertex;
    const end = start + item.vertexCount;
    pieces.push(source.xyArray.subarray(cursor * 2, start * 2));
    if (source.pathDistancesArray) pathPieces.push(source.pathDistancesArray.subarray(cursor, start));
    const segments = new Float32Array(item.segmentCount * 4);
    const pathSegments = source.pathDistancesArray ? new Float32Array(item.segmentCount * 2) : null;
    const pathStart = source.pathDistancesArray?.[start] ?? 0;
    const pathEnd = source.pathDistancesArray?.[end - 1] ?? pathStart;
    const refinedSegmentLengths = new Float64Array(item.segmentCount);
    let refinedLength = 0;
    for (let index = 0; index < item.segmentCount; index++) {
      const from = index * 2;
      const to = (index + 1) * 2;
      const length = Math.hypot(
        item.coordinates[to]! - item.coordinates[from]!,
        item.coordinates[to + 1]! - item.coordinates[from + 1]!,
      );
      refinedSegmentLengths[index] = length;
      refinedLength += length;
    }
    // Keep the source span's total phase fixed, but distribute intermediate values
    // by the emitted polyline's actual chord lengths rather than segment count.
    let refinedDistance = 0;
    for (let index = 0; index < item.segmentCount; index++) {
      const from = index * 2;
      const to = (index + 1) * 2;
      const output = index * 4;
      segments[output] = item.coordinates[from]!;
      segments[output + 1] = item.coordinates[from + 1]!;
      segments[output + 2] = item.coordinates[to]!;
      segments[output + 3] = item.coordinates[to + 1]!;
      if (pathSegments) {
        const phaseAtStart = refinedLength > 0
          ? pathStart + (pathEnd - pathStart) * refinedDistance / refinedLength
          : pathStart + (pathEnd - pathStart) * index / item.segmentCount;
        refinedDistance += refinedSegmentLengths[index]!;
        const phaseAtEnd = index === item.segmentCount - 1
          ? pathEnd
          : refinedLength > 0
            ? pathStart + (pathEnd - pathStart) * refinedDistance / refinedLength
            : pathStart + (pathEnd - pathStart) * (index + 1) / item.segmentCount;
        pathSegments[index * 2] = phaseAtStart;
        pathSegments[index * 2 + 1] = phaseAtEnd;
      }
    }
    pieces.push(segments);
    if (pathSegments) pathPieces.push(pathSegments);
    deltas.push({ start, end, delta: segments.length / 2 - item.vertexCount });
    cursor = end;
  }
  pieces.push(source.xyArray.subarray(cursor * 2));
  if (source.pathDistancesArray) pathPieces.push(source.pathDistancesArray.subarray(cursor));

  const newLength = pieces.reduce((sum, piece) => sum + piece.length, 0);
  const xyArray = new Float32Array(newLength);
  let xyOffset = 0;
  for (const piece of pieces) {
    xyArray.set(piece, xyOffset);
    xyOffset += piece.length;
  }
  let pathDistancesArray = source.pathDistancesArray;
  if (source.pathDistancesArray) {
    pathDistancesArray = new Float32Array(pathPieces.reduce((sum, piece) => sum + piece.length, 0));
    let pathOffset = 0;
    for (const piece of pathPieces) {
      pathDistancesArray.set(piece, pathOffset);
      pathOffset += piece.length;
    }
  }

  const shiftBefore = (vertex: number): number => deltas.reduce((shift, span) => span.end <= vertex ? shift + span.delta : shift, 0);
  const shiftedCommands = commands.map((command) => {
    // Line and triangle firstVertex indices address separate typed-array buffers.
    if (command.kind !== "line") return command;
    const start = command.firstVertex;
    const end = start + command.vertexCount;
    const contained = deltas.filter((span) => span.start >= start && span.end <= end);
    const overlaps = deltas.some((span) => span.start < end && span.end > start && !(span.start >= start && span.end <= end));
    if (overlaps) throw new Error("A curve refinement crosses a draw-command boundary");
    return {
      ...command,
      firstVertex: start + shiftBefore(start),
      vertexCount: command.vertexCount + contained.reduce((sum, span) => sum + span.delta, 0),
    };
  });

  return {
    ...source,
    xyArray,
    pathDistancesArray,
    vertexCount: xyArray.length / 2,
    meta: source.meta ? { ...source.meta, drawCommands: shiftedCommands } : source.meta,
  };
}
