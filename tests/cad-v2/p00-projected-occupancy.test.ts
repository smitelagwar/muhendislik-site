import assert from "node:assert/strict";
import test from "node:test";
import type { UnpackedSceneChunk } from "../../src/workers/cad-v2/cad-v2-scene-worker";
import { projectP00ChunkOccupancy } from "./p00-projected-occupancy";

function chunk(options: {
  xy?: number[];
  triangles?: number[];
  commands?: Array<{ kind: "line" | "triangle" | "wipeout"; firstVertex: number; vertexCount: number }>;
  layerRuns?: Array<{ firstVertex: number; vertexCount: number }>;
  origin?: [number, number];
}): UnpackedSceneChunk {
  return {
    chunkId: "test",
    origin: options.origin ?? [0, 0],
    xyArray: new Float32Array(options.xy ?? []),
    drawRunsArray: null,
    trianglesArray: options.triangles ? new Float32Array(options.triangles) : null,
    pathDistancesArray: null,
    curveDataArray: null,
    meta: options.commands ? { drawCommands: options.commands }
      : options.layerRuns ? { layerRuns: options.layerRuns }
        : null,
    vertexCount: (options.xy?.length ?? 0) / 2,
  };
}

const viewport = { width: 100, height: 100, center: [0, 0] as [number, number], unitsPerCssPixel: 1 };

test("projected stroke occupancy follows camera axes and clips outside geometry", () => {
  const sceneChunk = chunk({
    xy: [-40, 0, 40, 0, -80, -80, -60, -60],
    commands: [{ kind: "line", firstVertex: 0, vertexCount: 4 }],
  });
  const occupied = projectP00ChunkOccupancy(sceneChunk, viewport, 10);
  assert.deepEqual([...occupied].sort((a, b) => a - b), [51, 52, 53, 54, 55, 56, 57, 58]);
});

test("projected stroke occupancy keeps short cell crossings that sparse samples miss", () => {
  const sceneChunk = chunk({
    // In projected cell space this line is y = x - 0.01. It crosses cell
    // (column 5, row 4) for only 0.01 cell units, between the old 4x samples.
    xy: [-0.1, 0.11, 10, -9.99],
    commands: [{ kind: "line", firstVertex: 0, vertexCount: 2 }],
  });
  const tightViewport = {
    width: 10,
    height: 10,
    center: [0, 0] as [number, number],
    unitsPerCssPixel: 1,
    paddingCssPixels: 0,
  };
  const occupied = projectP00ChunkOccupancy(sceneChunk, tightViewport, 10);
  assert(occupied.has(45), "the short crossing in row 4, column 5 should be included");
});

test("projected triangle occupancy includes fill cells beyond its edges", () => {
  const sceneChunk = chunk({
    triangles: [-30, -30, 30, -30, -30, 30],
    commands: [{ kind: "triangle", firstVertex: 0, vertexCount: 3 }],
  });
  const occupied = projectP00ChunkOccupancy(sceneChunk, viewport, 10);
  assert(occupied.size >= 10, `expected filled triangle cells, got ${occupied.size}`);
  assert(occupied.has(73), "an interior cell should be occupied by the fill");
});

test("wipeout masks are excluded from positive ink occupancy", () => {
  const sceneChunk = chunk({
    triangles: [-30, -30, 30, -30, -30, 30],
    commands: [{ kind: "wipeout", firstVertex: 0, vertexCount: 3 }],
  });
  assert.equal(projectP00ChunkOccupancy(sceneChunk, viewport, 10).size, 0);
});

test("local chunk coordinates include the Float64 world origin", () => {
  const sceneChunk = chunk({
    origin: [20, 0],
    xy: [-5, 0, 5, 0],
    commands: [{ kind: "line", firstVertex: 0, vertexCount: 2 }],
  });
  const occupied = projectP00ChunkOccupancy(sceneChunk, viewport, 10);
  assert(occupied.has(56));
  assert(occupied.has(57));
});

test("legacy renderer layerRuns contribute projected stroke occupancy", () => {
  const sceneChunk = chunk({
    xy: [-20, 0, 20, 0, -80, -80, -60, -60],
    layerRuns: [{ firstVertex: 0, vertexCount: 2 }],
  });
  assert.deepEqual([...projectP00ChunkOccupancy(sceneChunk, viewport, 10)].sort((a, b) => a - b), [53, 54, 55, 56]);
});

test("optional one-pixel stroke expansion accounts for strokes along cell boundaries", () => {
  const sceneChunk = chunk({
    xy: [0, -20, 0, 20],
    commands: [{ kind: "line", firstVertex: 0, vertexCount: 2 }],
  });
  const centerline = projectP00ChunkOccupancy(sceneChunk, viewport, 10);
  const expanded = projectP00ChunkOccupancy(sceneChunk, viewport, 10, 1);
  for (const row of [3, 4, 5, 6]) {
    assert(centerline.has(row * 10 + 5));
    assert(!centerline.has(row * 10 + 4));
    assert(expanded.has(row * 10 + 4), `expanded line should occupy adjacent boundary cell on row ${row}`);
  }
});

test("old raw line and triangle arrays match renderer fallback occupancy", () => {
  const sceneChunk = chunk({
    xy: [-20, 0, 20, 0],
    triangles: [-30, -30, 30, -30, -30, 30],
  });
  const occupied = projectP00ChunkOccupancy(sceneChunk, viewport, 10);
  for (const cell of [53, 54, 55, 56, 73]) assert(occupied.has(cell), `expected legacy fallback cell ${cell}`);
});

console.log("  ✓ P00 projected primitive occupancy cases PASS");
