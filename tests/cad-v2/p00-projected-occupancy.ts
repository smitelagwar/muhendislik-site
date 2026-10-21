import type { UnpackedSceneChunk } from "../../src/workers/cad-v2/cad-v2-scene-worker";

export interface P00ViewportProjection {
  width: number;
  height: number;
  center: [number, number];
  unitsPerCssPixel: number;
  paddingCssPixels?: number;
}

type Point = [number, number];

function markSegment(cells: Set<number>, a: Point, b: Point, gridSize: number, radiusX = 0, radiusY = 0): void {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const epsilon = 1e-10;
  const minColumn = Math.max(0, Math.floor(Math.min(a[0], b[0]) - radiusX));
  const maxColumn = Math.min(gridSize - 1, Math.floor(Math.min(gridSize, Math.max(a[0], b[0]) + radiusX)));
  const minRow = Math.max(0, Math.floor(Math.min(a[1], b[1]) - radiusY));
  const maxRow = Math.min(gridSize - 1, Math.floor(Math.min(gridSize, Math.max(a[1], b[1]) + radiusY)));
  if (minColumn > maxColumn || minRow > maxRow) return;

  const intersectsCell = (column: number, row: number): boolean => {
    const left = column - radiusX;
    const right = column + 1 + radiusX;
    const top = row - radiusY;
    const bottom = row + 1 + radiusY;
    let start = 0;
    let end = 1;
    const clip = (p: number, q: number): boolean => {
      if (Math.abs(p) <= epsilon) return q >= -epsilon;
      const ratio = q / p;
      if (p < 0) {
        if (ratio > end + epsilon) return false;
        if (ratio > start) start = ratio;
      } else {
        if (ratio < start - epsilon) return false;
        if (ratio < end) end = ratio;
      }
      return true;
    };
    if (!clip(-dx, a[0] - left) || !clip(dx, right - a[0]) ||
        !clip(-dy, a[1] - top) || !clip(dy, bottom - a[1]) || start > end + epsilon) return false;
    if (radiusX === 0 && radiusY === 0) {
      if (end - start <= epsilon) {
        const x = a[0] + dx * ((start + end) / 2);
        const y = a[1] + dy * ((start + end) / 2);
        return Math.min(gridSize - 1, Math.max(0, Math.floor(x))) === column &&
          Math.min(gridSize - 1, Math.max(0, Math.floor(y))) === row;
      }
      if (column < gridSize - 1 && Math.abs(dx) <= epsilon && Math.abs(a[0] - right) <= epsilon) return false;
      if (row < gridSize - 1 && Math.abs(dy) <= epsilon && Math.abs(a[1] - bottom) <= epsilon) return false;
    }
    return true;
  };

  for (let row = minRow; row <= maxRow; row++) {
    for (let column = minColumn; column <= maxColumn; column++) {
      if (intersectsCell(column, row)) cells.add(row * gridSize + column);
    }
  }
}

function pointInTriangle(point: Point, triangle: [Point, Point, Point]): boolean {
  const [a, b, c] = triangle;
  const cross = (p1: Point, p2: Point, p3: Point) =>
    (p2[0] - p1[0]) * (p3[1] - p1[1]) - (p2[1] - p1[1]) * (p3[0] - p1[0]);
  const d1 = cross(a, b, point);
  const d2 = cross(b, c, point);
  const d3 = cross(c, a, point);
  const hasNegative = d1 < -1e-9 || d2 < -1e-9 || d3 < -1e-9;
  const hasPositive = d1 > 1e-9 || d2 > 1e-9 || d3 > 1e-9;
  return !(hasNegative && hasPositive);
}

function segmentsIntersect(a: Point, b: Point, c: Point, d: Point): boolean {
  const orient = (p: Point, q: Point, r: Point) =>
    (q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0]);
  const onSegment = (p: Point, q: Point, r: Point) =>
    q[0] >= Math.min(p[0], r[0]) - 1e-9 && q[0] <= Math.max(p[0], r[0]) + 1e-9 &&
    q[1] >= Math.min(p[1], r[1]) - 1e-9 && q[1] <= Math.max(p[1], r[1]) + 1e-9;
  const o1 = orient(a, b, c);
  const o2 = orient(a, b, d);
  const o3 = orient(c, d, a);
  const o4 = orient(c, d, b);
  if (((o1 > 0 && o2 < 0) || (o1 < 0 && o2 > 0)) && ((o3 > 0 && o4 < 0) || (o3 < 0 && o4 > 0))) return true;
  return (Math.abs(o1) <= 1e-9 && onSegment(a, c, b)) ||
    (Math.abs(o2) <= 1e-9 && onSegment(a, d, b)) ||
    (Math.abs(o3) <= 1e-9 && onSegment(c, a, d)) ||
    (Math.abs(o4) <= 1e-9 && onSegment(c, b, d));
}

function triangleIntersectsCell(triangle: [Point, Point, Point], column: number, row: number): boolean {
  const left = column;
  const top = row;
  const right = column + 1;
  const bottom = row + 1;
  const inCell = (point: Point) => point[0] >= left - 1e-9 && point[0] <= right + 1e-9 &&
    point[1] >= top - 1e-9 && point[1] <= bottom + 1e-9;
  if (triangle.some(inCell)) return true;
  const corners: Point[] = [[left, top], [right, top], [right, bottom], [left, bottom]];
  if (corners.some((corner) => pointInTriangle(corner, triangle))) return true;
  const cellEdges: Array<[Point, Point]> = [
    [corners[0]!, corners[1]!], [corners[1]!, corners[2]!],
    [corners[2]!, corners[3]!], [corners[3]!, corners[0]!],
  ];
  for (let edge = 0; edge < 3; edge++) {
    const a = triangle[edge]!;
    const b = triangle[(edge + 1) % 3]!;
    if (cellEdges.some(([c, d]) => segmentsIntersect(a, b, c, d))) return true;
  }
  return false;
}

function markTriangle(cells: Set<number>, triangle: [Point, Point, Point], gridSize: number): void {
  const minColumn = Math.max(0, Math.floor(Math.min(...triangle.map((point) => point[0]))));
  const maxColumn = Math.min(gridSize - 1, Math.floor(Math.min(gridSize, Math.max(...triangle.map((point) => point[0])))));
  const minRow = Math.max(0, Math.floor(Math.min(...triangle.map((point) => point[1]))));
  const maxRow = Math.min(gridSize - 1, Math.floor(Math.min(gridSize, Math.max(...triangle.map((point) => point[1])))));
  if (minColumn > maxColumn || minRow > maxRow) return;
  for (let row = minRow; row <= maxRow; row++) {
    for (let column = minColumn; column <= maxColumn; column++) {
      if (triangleIntersectsCell(triangle, column, row)) cells.add(row * gridSize + column);
    }
  }
}

/**
 * Test-only coarse screen occupancy from compiled chunk primitives. Stroke paths
 * use exact segment/cell clipping and triangle fills use triangle/cell intersection.
 * Current drawCommands and renderer-compatible legacy layerRuns/raw arrays are
 * included. Dash fragments, wipeout subtraction, layer visibility and final GPU
 * pixels are intentionally outside this estimate.
 */
export function projectP00ChunkOccupancy(
  chunk: UnpackedSceneChunk,
  viewport: P00ViewportProjection,
  gridSize: number,
  lineExpansionCssPixels = 0,
): Set<number> {
  if (!Number.isInteger(gridSize) || gridSize < 1 || !(viewport.width > 0) || !(viewport.height > 0) || !(viewport.unitsPerCssPixel > 0)) {
    throw new Error("Projected occupancy needs a positive viewport scale and integer grid size.");
  }
  const cells = new Set<number>();
  const padding = Math.max(0, viewport.paddingCssPixels ?? 1);
  const lineRadiusCssPixels = Math.max(0, lineExpansionCssPixels);
  const lineRadiusX = lineRadiusCssPixels * gridSize / (viewport.width + 2 * padding);
  const lineRadiusY = lineRadiusCssPixels * gridSize / (viewport.height + 2 * padding);
  const project = (localX: number, localY: number): Point => {
    const screenX = viewport.width / 2 + (chunk.origin[0] + localX - viewport.center[0]) / viewport.unitsPerCssPixel;
    const screenY = viewport.height / 2 - (chunk.origin[1] + localY - viewport.center[1]) / viewport.unitsPerCssPixel;
    return [
      (screenX + padding) / (viewport.width + 2 * padding) * gridSize,
      (screenY + padding) / (viewport.height + 2 * padding) * gridSize,
    ];
  };
  const drawCommands = Array.isArray(chunk.meta?.drawCommands) ? chunk.meta.drawCommands as Array<{
    kind: "line" | "triangle" | "wipeout";
    firstVertex: number;
    vertexCount: number;
  }> : [];

  const markLineRun = (firstVertex: number, vertexCount: number) => {
    const first = Math.max(0, firstVertex);
    const end = Math.min(chunk.xyArray.length / 2, first + vertexCount);
    for (let vertex = first; vertex + 1 < end; vertex += 2) {
      const startOffset = vertex * 2;
      markSegment(cells,
        project(chunk.xyArray[startOffset]!, chunk.xyArray[startOffset + 1]!),
        project(chunk.xyArray[startOffset + 2]!, chunk.xyArray[startOffset + 3]!), gridSize, lineRadiusX, lineRadiusY);
    }
  };
  const markTriangleRun = (firstVertex: number, vertexCount: number) => {
    if (!chunk.trianglesArray) return;
    const first = Math.max(0, firstVertex);
    const end = Math.min(chunk.trianglesArray.length / 2, first + vertexCount);
    for (let vertex = first; vertex + 2 < end; vertex += 3) {
      const offset = vertex * 2;
      const triangle: [Point, Point, Point] = [
        project(chunk.trianglesArray[offset]!, chunk.trianglesArray[offset + 1]!),
        project(chunk.trianglesArray[offset + 2]!, chunk.trianglesArray[offset + 3]!),
        project(chunk.trianglesArray[offset + 4]!, chunk.trianglesArray[offset + 5]!),
      ];
      markTriangle(cells, triangle, gridSize);
    }
  };

  if (drawCommands.length > 0) {
    for (const command of drawCommands) {
      if (command.kind === "line") markLineRun(command.firstVertex, command.vertexCount);
      else if (command.kind === "triangle") markTriangleRun(command.firstVertex, command.vertexCount);
      // Wipeouts are masks; counting their triangles as visible ink would invert occupancy.
    }
  } else {
    const legacyLayerRuns = Array.isArray(chunk.meta?.layerRuns) ? chunk.meta.layerRuns as Array<{
      firstVertex: number;
      vertexCount: number;
    }> : [];
    if (legacyLayerRuns.length > 0) {
      for (const run of legacyLayerRuns) markLineRun(run.firstVertex, run.vertexCount);
    } else if (chunk.xyArray.length > 0) {
      // CadV2Renderer's oldest fallback renders all xyArray vertices as line segments.
      markLineRun(0, chunk.xyArray.length / 2);
    }
    if (chunk.trianglesArray && chunk.trianglesArray.length > 0) {
      // The renderer draws the whole triangle array when command metadata is absent.
      markTriangleRun(0, chunk.trianglesArray.length / 2);
    }
  }
  return cells;
}
