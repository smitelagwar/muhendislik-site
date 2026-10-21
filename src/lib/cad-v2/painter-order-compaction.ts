export const CAD_V2_PAINTER_DEPTH_MAX_ORDER = 4_000_000;

const MAX_COMPACT_PAINTER_ORDER_RUNS = 250_000;

type PainterOrderPrimitive = {
  kind: "line" | "triangle" | "wipeout";
  order?: bigint;
  layer: string;
  color: readonly [number, number, number];
  isAci7?: boolean;
  alpha?: number;
  lineweightMm?: number;
  pathDistanceRequired?: boolean;
  dashStyle?: { dashSize: number; gapSize: number; pattern?: readonly number[] };
  hatchFillSource?: { handle: string; order: string | bigint };
};

type PainterOrderRun = { firstSourceIndex: number; lastSourceIndex: number; orderIndex: number };

export interface PainterOrderIndex {
  globalOrderMax: number;
  compacted: boolean;
  runCount: number;
  orderIndexForSourceIndex(sourceIndex: number): number | null;
}

function sameDashPattern(left: readonly number[] | undefined, right: readonly number[] | undefined): boolean {
  if (left === right) return true;
  if (!left || !right || left.length !== right.length) return false;
  for (let index = 0; index < left.length; index++) {
    if (left[index] !== right[index]) return false;
  }
  return true;
}

function samePainterOrderRun(left: PainterOrderPrimitive, right: PainterOrderPrimitive): boolean {
  if (left.kind === "line" && right.kind === "line") {
    return left.order === right.order &&
      left.layer === right.layer &&
      (left.isAci7 === true) === (right.isAci7 === true) &&
      Math.abs((left.lineweightMm ?? 0) - (right.lineweightMm ?? 0)) < 1e-4 &&
      Math.abs((left.alpha ?? 1) - (right.alpha ?? 1)) < 1e-4 &&
      Math.abs(left.color[0] - right.color[0]) < 1e-4 &&
      Math.abs(left.color[1] - right.color[1]) < 1e-4 &&
      Math.abs(left.color[2] - right.color[2]) < 1e-4 &&
      left.dashStyle?.dashSize === right.dashStyle?.dashSize &&
      left.dashStyle?.gapSize === right.dashStyle?.gapSize &&
      sameDashPattern(left.dashStyle?.pattern, right.dashStyle?.pattern) &&
      (left.pathDistanceRequired === true) === (right.pathDistanceRequired === true);
  }

  if (left.kind === "triangle" && right.kind === "triangle") {
    return left.order === right.order &&
      left.layer === right.layer &&
      (left.isAci7 === true) === (right.isAci7 === true) &&
      Math.abs((left.alpha ?? 1) - (right.alpha ?? 1)) < 1e-4 &&
      Math.abs(left.color[0] - right.color[0]) < 1e-4 &&
      Math.abs(left.color[1] - right.color[1]) < 1e-4 &&
      Math.abs(left.color[2] - right.color[2]) < 1e-4 &&
      left.hatchFillSource?.handle === right.hatchFillSource?.handle &&
      left.hatchFillSource?.order === right.hatchFillSource?.order;
  }

  // Wipeouts are ordering masks, so each one keeps a distinct rank.
  return false;
}

export function createPainterOrderIndex(primitives: readonly PainterOrderPrimitive[]): PainterOrderIndex {
  const sourceCount = primitives.length;
  const identity = (): PainterOrderIndex => ({
    globalOrderMax: Math.max(0, sourceCount - 1),
    compacted: false,
    runCount: sourceCount,
    orderIndexForSourceIndex(sourceIndex) {
      return Number.isSafeInteger(sourceIndex) && sourceIndex >= 0 && sourceIndex < sourceCount
        ? sourceIndex
        : null;
    },
  });

  if (sourceCount === 0) return identity();

  const runs: PainterOrderRun[] = [];
  let runStart = 0;
  for (let index = 1; index < sourceCount; index++) {
    if (samePainterOrderRun(primitives[index - 1]!, primitives[index]!)) continue;
    runs.push({ firstSourceIndex: runStart, lastSourceIndex: index - 1, orderIndex: runs.length });
    if (runs.length > MAX_COMPACT_PAINTER_ORDER_RUNS) return identity();
    runStart = index;
  }
  runs.push({ firstSourceIndex: runStart, lastSourceIndex: sourceCount - 1, orderIndex: runs.length });
  if (runs.length > MAX_COMPACT_PAINTER_ORDER_RUNS) return identity();

  return {
    globalOrderMax: Math.max(0, runs.length - 1),
    compacted: runs.length < sourceCount,
    runCount: runs.length,
    orderIndexForSourceIndex(sourceIndex) {
      if (!Number.isSafeInteger(sourceIndex) || sourceIndex < 0 || sourceIndex >= sourceCount) return null;
      let low = 0;
      let high = runs.length - 1;
      while (low <= high) {
        const middle = low + ((high - low) >> 1);
        const run = runs[middle]!;
        if (sourceIndex < run.firstSourceIndex) high = middle - 1;
        else if (sourceIndex > run.lastSourceIndex) low = middle + 1;
        else return run.orderIndex;
      }
      return null;
    },
  };
}
