import type { CadHatchEntity, CadHatchLoop } from "../canonical/types";
import { GeometryCompiler } from "../compile/geometry-compiler";
import type { UnpackedSceneChunk } from "../../../workers/cad-v2/cad-v2-scene-worker";

export interface RuntimeHatchFillSource {
  handle: string;
  layer: string;
  order: string | bigint;
  loops: CadHatchLoop[];
  hatchStyle?: number;
  isSolid?: boolean;
  solidFill?: boolean;
}

export interface RuntimeHatchFillRefinementOptions {
  targetErrorCssPixels: number;
  unitsPerCssPixel: number;
  maxTransformSingularValue: number;
  maxCurveSegments?: number;
  maxBoundaryElements?: number;
  maxOutputTriangles?: number;
}

export interface RuntimeHatchFillRefinementResult {
  status: "refined" | "degraded";
  reason?: "invalid-source" | "unsupported-pattern" | "source-cap" | "segment-cap" | "invalid-curve" | "empty-fill";
  verticesWorld: Float64Array | null;
  requestedErrorWorld: number;
  measuredBoundaryErrorWorld: number;
  triangleCount: number;
  errorBoundMet: boolean;
}

export interface AppliedRuntimeHatchFillRefinement {
  chunk: UnpackedSceneChunk;
  encodedErrorWorld: number;
}

const DEFAULT_MAX_CURVE_SEGMENTS = 16_384;
const MAX_RUNTIME_CURVE_SEGMENTS = 16_384;
const MAX_RUNTIME_BOUNDARY_ELEMENTS = 16_384;
const MAX_RUNTIME_OUTPUT_TRIANGLES = 32_768;

function finitePositive(value: number): boolean {
  return Number.isFinite(value) && value > 0;
}

function countBoundaryElements(loops: readonly CadHatchLoop[]): number {
  let total = 0;
  for (const loop of loops) {
    if (Array.isArray(loop.vertices)) total += loop.vertices.length;
    if (Array.isArray(loop.edges)) {
      total += loop.edges.length;
      for (const edge of loop.edges) {
        if (edge.type === "SPLINE") total += edge.controlPoints.length + edge.knots.length + (edge.weights?.length ?? 0);
      }
    }
  }
  return total;
}

/** Bounded source HATCH remeshing for the worker. The output remains Float64 world geometry. */
export function refineRuntimeHatchFill(
  source: RuntimeHatchFillSource,
  options: RuntimeHatchFillRefinementOptions,
): RuntimeHatchFillRefinementResult {
  if (!source || !options) return degraded("invalid-source", 0);
  const maxCurveSegments = options.maxCurveSegments ?? DEFAULT_MAX_CURVE_SEGMENTS;
  const maxBoundaryElements = options.maxBoundaryElements ?? MAX_RUNTIME_BOUNDARY_ELEMENTS;
  const maxOutputTriangles = options.maxOutputTriangles ?? MAX_RUNTIME_OUTPUT_TRIANGLES;
  if (!source || typeof source.handle !== "string" || !source.handle || typeof source.layer !== "string" ||
      !source.layer || !Array.isArray(source.loops) || source.loops.length === 0 ||
      !(typeof source.order === "bigint" || typeof source.order === "string" && /^\d+$/.test(source.order)) ||
      source.loops.some((loop) => !loop || typeof loop.isPolyline !== "boolean")) {
    return degraded("invalid-source", 0);
  }
  if (!(source.isSolid === true || source.solidFill === true)) return degraded("unsupported-pattern", 0);
  let boundaryElementCount: number;
  try {
    boundaryElementCount = countBoundaryElements(source.loops);
  } catch {
    return degraded("invalid-source", 0);
  }
  if (!Number.isSafeInteger(maxCurveSegments) || maxCurveSegments < 1 || maxCurveSegments > MAX_RUNTIME_CURVE_SEGMENTS ||
      !Number.isSafeInteger(maxBoundaryElements) || maxBoundaryElements < 1 || maxBoundaryElements > MAX_RUNTIME_BOUNDARY_ELEMENTS ||
      !Number.isSafeInteger(maxOutputTriangles) || maxOutputTriangles < 1 || maxOutputTriangles > MAX_RUNTIME_OUTPUT_TRIANGLES ||
      boundaryElementCount > maxBoundaryElements) {
    return degraded("source-cap", 0);
  }
  if (!finitePositive(options.targetErrorCssPixels) || !finitePositive(options.unitsPerCssPixel) ||
      !finitePositive(options.maxTransformSingularValue)) {
    return degraded("invalid-source", 0);
  }

  const requestedErrorWorld = options.targetErrorCssPixels * options.unitsPerCssPixel /
    options.maxTransformSingularValue;
  if (!finitePositive(requestedErrorWorld)) return degraded("invalid-source", 0);

  const entity: CadHatchEntity = {
    handle: source.handle,
    type: "HATCH",
    layer: source.layer,
    order: typeof source.order === "bigint" ? source.order : BigInt(source.order),
    patternName: "SOLID",
    isSolid: true,
    solidFill: true,
    hatchStyle: source.hatchStyle,
    loops: source.loops,
  };
  let remeshed: ReturnType<typeof GeometryCompiler.triangulateHatch>;
  try {
    remeshed = GeometryCompiler.triangulateHatch(entity, maxCurveSegments, requestedErrorWorld);
  } catch {
    return degraded("invalid-source", requestedErrorWorld);
  }
  const triangleCount = remeshed.mesh?.vertices.length ? remeshed.mesh.vertices.length / 6 : 0;
  if (remeshed.invalidCurveGeometry) return degraded("invalid-curve", requestedErrorWorld, remeshed.maxBoundaryTessellationErrorWorld);
  if (remeshed.refinementLimitReached || remeshed.maxBoundaryTessellationErrorWorld > requestedErrorWorld * (1 + 1e-12)) {
    return degraded("segment-cap", requestedErrorWorld, remeshed.maxBoundaryTessellationErrorWorld, triangleCount);
  }
  if (!remeshed.mesh?.vertices.length) return degraded("empty-fill", requestedErrorWorld, remeshed.maxBoundaryTessellationErrorWorld);
  if (triangleCount > maxOutputTriangles) {
    return degraded("source-cap", requestedErrorWorld, remeshed.maxBoundaryTessellationErrorWorld, triangleCount);
  }
  if (!remeshed.mesh.vertices.every(Number.isFinite)) return degraded("invalid-source", requestedErrorWorld);

  return {
    status: "refined",
    verticesWorld: remeshed.mesh.vertices,
    requestedErrorWorld,
    measuredBoundaryErrorWorld: remeshed.maxBoundaryTessellationErrorWorld,
    triangleCount,
    errorBoundMet: true,
  };
}

/** Atomically replaces exactly one isolated HATCH triangle command; source chunk remains untouched. */
export function applyRuntimeHatchFillRefinementToChunk(
  sourceChunk: UnpackedSceneChunk,
  sourceId: string,
  result: RuntimeHatchFillRefinementResult,
): AppliedRuntimeHatchFillRefinement {
  const verticesWorld = result.verticesWorld;
  if (result.status !== "refined" || !result.errorBoundMet || !(verticesWorld instanceof Float64Array) ||
      verticesWorld.length === 0 || verticesWorld.length % 6 !== 0 || !verticesWorld.every(Number.isFinite) ||
      !finitePositive(result.requestedErrorWorld) || !Number.isFinite(result.measuredBoundaryErrorWorld) ||
      result.measuredBoundaryErrorWorld < 0) {
    throw new Error("Runtime HATCH result is not a complete, finite triangle mesh");
  }
  if (!sourceChunk.trianglesArray || !sourceChunk.meta || !Array.isArray(sourceChunk.meta.hatchFillSources) ||
      !sourceChunk.meta.hatchFillSources.some((entry: { sourceId?: unknown }) => entry?.sourceId === sourceId)) {
    throw new Error(`Runtime HATCH source ${sourceId} is not retained by chunk ${sourceChunk.chunkId}`);
  }
  const commands = sourceChunk.meta.drawCommands as Array<{
    kind: "line" | "triangle" | "wipeout";
    firstVertex: number;
    vertexCount: number;
    hatchSourceId?: string;
    [key: string]: unknown;
  }> | undefined;
  if (!Array.isArray(commands)) throw new Error("Runtime HATCH chunk has no draw-command table");
  const owners = commands.filter((command) => command.hatchSourceId === sourceId);
  if (owners.length !== 1 || owners[0]!.kind !== "triangle") {
    throw new Error(`Runtime HATCH source ${sourceId} must own exactly one isolated triangle command`);
  }
  const owner = owners[0]!;
  const sourceVertexCount = sourceChunk.trianglesArray.length / 2;
  const start = owner.firstVertex;
  const end = start + owner.vertexCount;
  if (!Number.isSafeInteger(start) || !Number.isSafeInteger(owner.vertexCount) || start < 0 ||
      owner.vertexCount < 3 || owner.vertexCount % 3 !== 0 || end > sourceVertexCount) {
    throw new Error(`Runtime HATCH source ${sourceId} has an invalid triangle span`);
  }

  const replacement = new Float32Array(verticesWorld.length);
  let quantizationErrorSquared = 0;
  for (let index = 0; index < verticesWorld.length; index += 2) {
    const worldX = verticesWorld[index]!;
    const worldY = verticesWorld[index + 1]!;
    const localX = Math.fround(worldX - sourceChunk.origin[0]);
    const localY = Math.fround(worldY - sourceChunk.origin[1]);
    if (!Number.isFinite(localX) || !Number.isFinite(localY)) throw new Error("Runtime HATCH output cannot be encoded as chunk-local Float32");
    quantizationErrorSquared = Math.max(quantizationErrorSquared,
      (worldX - (sourceChunk.origin[0] + localX)) ** 2 + (worldY - (sourceChunk.origin[1] + localY)) ** 2);
    replacement[index] = localX;
    replacement[index + 1] = localY;
  }
  const encodedErrorWorld = result.measuredBoundaryErrorWorld + Math.sqrt(quantizationErrorSquared);
  if (!Number.isFinite(encodedErrorWorld) || encodedErrorWorld > result.requestedErrorWorld * (1 + 1e-12)) {
    throw new Error("Runtime HATCH boundary and Float32 encoding exceed the requested world-space error");
  }

  const prefix = sourceChunk.trianglesArray.subarray(0, start * 2);
  const suffix = sourceChunk.trianglesArray.subarray(end * 2);
  const trianglesArray = new Float32Array(prefix.length + replacement.length + suffix.length);
  trianglesArray.set(prefix, 0);
  trianglesArray.set(replacement, prefix.length);
  trianglesArray.set(suffix, prefix.length + replacement.length);
  const deltaVertices = replacement.length / 2 - owner.vertexCount;
  const shiftedCommands = commands.map((command) => {
    if (command.kind === "line") return command;
    const commandStart = command.firstVertex;
    const commandEnd = commandStart + command.vertexCount;
    if (command === owner) return { ...command, vertexCount: command.vertexCount + deltaVertices };
    if (commandStart < end && commandEnd > start) {
      throw new Error("Runtime HATCH replacement overlaps another triangle draw command");
    }
    return commandStart >= end ? { ...command, firstVertex: commandStart + deltaVertices } : command;
  });
  const triangleRuns = shiftedCommands.filter((command) => command.kind !== "line").map((command) => ({
    layer: command.layer,
    color: command.color,
    firstVertex: command.firstVertex,
    vertexCount: command.vertexCount,
    isWipeout: command.kind === "wipeout",
    alpha: command.alpha,
    isAci7: command.isAci7,
  }));

  return {
    chunk: {
      ...sourceChunk,
      trianglesArray,
      meta: { ...sourceChunk.meta, drawCommands: shiftedCommands, triangleRuns },
    },
    encodedErrorWorld,
  };
}

function degraded(
  reason: NonNullable<RuntimeHatchFillRefinementResult["reason"]>,
  requestedErrorWorld: number,
  measuredBoundaryErrorWorld = 0,
  triangleCount = 0,
): RuntimeHatchFillRefinementResult {
  return {
    status: "degraded",
    reason,
    verticesWorld: null,
    requestedErrorWorld,
    measuredBoundaryErrorWorld,
    triangleCount,
    errorBoundMet: false,
  };
}
