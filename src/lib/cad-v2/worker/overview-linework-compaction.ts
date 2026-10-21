export interface CadV2OverviewLineCommand {
  kind: string;
  firstVertex: number;
  vertexCount: number;
  globalOrderIndex?: number;
  globalOrderEndIndex?: number;
  alpha?: number;
  dashStyle?: unknown;
  pathDistanceRequired?: boolean;
  [key: string]: unknown;
}

export interface CadV2OverviewLineworkResult {
  xyArray: Float32Array;
  drawCommands: CadV2OverviewLineCommand[];
  collapsedSegmentCount: number;
  retainedSegmentCount: number;
  representativePointCount: number;
  maxCenterlineDeviationCssPixels: number;
  remappedPreservedVertexRanges?: Array<{ firstVertex: number; vertexCount: number }>;
  remappedPathDistancesArray?: Float32Array;
}

export interface CadV2OverviewPreservedVertexRange {
  firstVertex: number;
  vertexCount: number;
}

export const CAD_V2_OVERVIEW_MAX_SOURCE_SEGMENT_CSS_PIXELS = 0.0625;
export const CAD_V2_OVERVIEW_GRID_CSS_PIXELS = CAD_V2_OVERVIEW_MAX_SOURCE_SEGMENT_CSS_PIXELS / 2;
export const CAD_V2_OVERVIEW_REPRESENTATIVE_SEGMENT_CSS_PIXELS = 0.018;
export const CAD_V2_OVERVIEW_MAX_ZOOM_FACTOR = 4;
export const CAD_V2_OVERVIEW_MAX_COMBINED_ERROR_AT_SUPPORTED_ZOOM_CSS_PIXELS = 0.25;
export const CAD_V2_OVERVIEW_MAX_COMBINED_ERROR_CSS_PIXELS =
  CAD_V2_OVERVIEW_MAX_COMBINED_ERROR_AT_SUPPORTED_ZOOM_CSS_PIXELS / CAD_V2_OVERVIEW_MAX_ZOOM_FACTOR;

function canCompactOverviewLineCommand(command: CadV2OverviewLineCommand): boolean {
  return command.kind === "line" && (command.alpha ?? 1) === 1 &&
    !(command.dashStyle && typeof command.dashStyle === "object") &&
    command.pathDistanceRequired !== true;
}

function sameOverviewLineStyle(left: CadV2OverviewLineCommand, right: CadV2OverviewLineCommand): boolean {
  const leftColor = left.color;
  const rightColor = right.color;
  if (!Array.isArray(leftColor) || !Array.isArray(rightColor) || leftColor.length !== 3 || rightColor.length !== 3) {
    return false;
  }
  return left.layer === right.layer &&
    (left.isAci7 === true) === (right.isAci7 === true) &&
    Math.abs(Number(left.lineweightMm ?? 0) - Number(right.lineweightMm ?? 0)) < 1e-4 &&
    leftColor[0] === rightColor[0] && leftColor[1] === rightColor[1] && leftColor[2] === rightColor[2];
}

function canJoinOverviewPainterRanks(left: CadV2OverviewLineCommand, right: CadV2OverviewLineCommand): boolean {
  if (!canCompactOverviewLineCommand(left) || !canCompactOverviewLineCommand(right) ||
      !sameOverviewLineStyle(left, right)) return false;
  const leftFirst = Number.isSafeInteger(left.globalOrderIndex) ? left.globalOrderIndex! : null;
  const leftLastValue = left.globalOrderEndIndex ?? left.globalOrderIndex;
  const leftLast = Number.isSafeInteger(leftLastValue) ? leftLastValue! : null;
  const rightFirst = Number.isSafeInteger(right.globalOrderIndex) ? right.globalOrderIndex! : null;
  const rightLastValue = right.globalOrderEndIndex ?? right.globalOrderIndex;
  const rightLast = Number.isSafeInteger(rightLastValue) ? rightLastValue! : null;
  if (leftFirst === null && leftLast === null && rightFirst === null && rightLast === null) return true;
  if (leftFirst === null || leftLast === null || rightFirst === null || rightLast === null ||
      leftLast < leftFirst || rightLast < rightFirst) return false;
  return rightFirst === leftLast || rightFirst === leftLast + 1;
}

/**
 * Replaces opaque, solid, subpixel line segments with pixel-space representative points.
 * Each point is snapped to a grid cell; long, dashed, transparent, and phase-bearing lines
 * remain exact. Input ranges must cover the complete XY array without overlap or gaps.
 */
export function compactCadV2OverviewLinework(
  source: Float32Array,
  drawCommands: readonly CadV2OverviewLineCommand[],
  unitsPerCssPixel: number,
  maxCenterlineDeviationCssPixels = CAD_V2_OVERVIEW_MAX_SOURCE_SEGMENT_CSS_PIXELS / 2 +
    Math.SQRT2 * CAD_V2_OVERVIEW_GRID_CSS_PIXELS / 2 + CAD_V2_OVERVIEW_REPRESENTATIVE_SEGMENT_CSS_PIXELS / 2,
  preservedVertexRanges: readonly CadV2OverviewPreservedVertexRange[] = [],
  sourcePathDistances?: Float32Array | null,
): CadV2OverviewLineworkResult {
  const unchanged = (): CadV2OverviewLineworkResult => ({
    xyArray: source,
    drawCommands: drawCommands.map((command) => ({ ...command })),
    collapsedSegmentCount: 0,
    retainedSegmentCount: 0,
    representativePointCount: 0,
    maxCenterlineDeviationCssPixels: 0,
  });
  if (!Number.isFinite(unitsPerCssPixel) || unitsPerCssPixel <= 0 || source.length % 2 !== 0) return unchanged();

  const lineCommands = drawCommands.filter((command) => command.kind === "line");
  if (lineCommands.length === 0) return unchanged();
  const ranges = lineCommands.map((command) => ({
    start: command.firstVertex,
    end: command.firstVertex + command.vertexCount,
  })).sort((a, b) => a.start - b.start);
  let expectedFirstVertex = 0;
  for (const range of ranges) {
    if (!Number.isSafeInteger(range.start) || !Number.isSafeInteger(range.end) ||
        range.start !== expectedFirstVertex || range.end <= range.start ||
        range.end > source.length / 2 || (range.start % 2) !== 0 || ((range.end - range.start) % 2) !== 0) {
      return unchanged();
    }
    expectedFirstVertex = range.end;
  }
  if (expectedFirstVertex !== source.length / 2) return unchanged();

  const preservedSegments = new Uint8Array(source.length / 4);
  for (const range of preservedVertexRanges) {
    const endVertex = range.firstVertex + range.vertexCount;
    if (!Number.isSafeInteger(range.firstVertex) || !Number.isSafeInteger(range.vertexCount) ||
        range.firstVertex < 0 || range.vertexCount <= 0 || (range.firstVertex % 2) !== 0 ||
        (range.vertexCount % 2) !== 0 || endVertex > source.length / 2) {
      return unchanged();
    }
    for (let segment = range.firstVertex / 2; segment < endVertex / 2; segment++) {
      preservedSegments[segment] = 1;
    }
  }

  const defaultDeviationCssPixels = CAD_V2_OVERVIEW_MAX_SOURCE_SEGMENT_CSS_PIXELS / 2 +
    Math.SQRT2 * CAD_V2_OVERVIEW_GRID_CSS_PIXELS / 2 + CAD_V2_OVERVIEW_REPRESENTATIVE_SEGMENT_CSS_PIXELS / 2;
  const targetDeviationCssPixels = Number.isFinite(maxCenterlineDeviationCssPixels)
    ? Math.max(0, Math.min(defaultDeviationCssPixels, maxCenterlineDeviationCssPixels))
    : defaultDeviationCssPixels;
  const precisionScale = defaultDeviationCssPixels > 0 ? targetDeviationCssPixels / defaultDeviationCssPixels : 0;
  if (precisionScale <= 0) return unchanged();

  const sourceLengthCssPixels = CAD_V2_OVERVIEW_MAX_SOURCE_SEGMENT_CSS_PIXELS * precisionScale;
  const gridSizeCssPixels = CAD_V2_OVERVIEW_GRID_CSS_PIXELS * precisionScale;
  const representativeSegmentCssPixels = CAD_V2_OVERVIEW_REPRESENTATIVE_SEGMENT_CSS_PIXELS * precisionScale;
  const gridSizeWorld = gridSizeCssPixels * unitsPerCssPixel;
  const representativeHalfLengthWorld = representativeSegmentCssPixels * unitsPerCssPixel / 2;
  const output: number[] = [];
  const remappedPathDistances: number[] | null = sourcePathDistances ? [] : null;
  const rewritten: CadV2OverviewLineCommand[] = [];
  const sourceToOutputVertex = preservedVertexRanges.length > 0 ? new Map<number, number>() : null;
  let collapsedSegmentCount = 0;
  let retainedSegmentCount = 0;
  let representativePointCount = 0;

  const commandGroups: CadV2OverviewLineCommand[][] = [];
  for (const command of drawCommands) {
    const previousGroup = commandGroups[commandGroups.length - 1];
    const previousCommand = previousGroup?.[previousGroup.length - 1];
    if (previousCommand && canJoinOverviewPainterRanks(previousCommand, command)) {
      previousGroup!.push(command);
    } else {
      commandGroups.push([command]);
    }
  }

  for (const group of commandGroups) {
    const command = group[0]!;
    if (command.kind !== "line") {
      rewritten.push({ ...command });
      continue;
    }

    const mayCompact = group.every(canCompactOverviewLineCommand);
    const representatives = new Map<string, [number, number]>();
    const retained: number[] = [];
    for (const sourceCommand of group) {
      const first = sourceCommand.firstVertex * 2;
      const end = (sourceCommand.firstVertex + sourceCommand.vertexCount) * 2;
      for (let index = first; index < end; index += 4) {
        const x0 = source[index]!;
        const y0 = source[index + 1]!;
        const x1 = source[index + 2]!;
        const y1 = source[index + 3]!;
        const valuesAreFinite = Number.isFinite(x0) && Number.isFinite(y0) &&
          Number.isFinite(x1) && Number.isFinite(y1);
        const mustPreserve = preservedSegments[index / 4] === 1;
        const segmentLengthCssPixels = valuesAreFinite
          ? Math.hypot(x1 - x0, y1 - y0) / unitsPerCssPixel
          : Number.POSITIVE_INFINITY;

        if (mustPreserve || !mayCompact || segmentLengthCssPixels >= sourceLengthCssPixels ||
            !Number.isFinite(gridSizeWorld) || gridSizeWorld <= 0) {
          retained.push(index, index + 1, index + 2, index + 3);
          if (!mustPreserve && mayCompact && segmentLengthCssPixels >= sourceLengthCssPixels) retainedSegmentCount++;
          continue;
        }

        const midpointX = (x0 + x1) / 2;
        const midpointY = (y0 + y1) / 2;
        const cellX = Math.round(midpointX / gridSizeWorld);
        const cellY = Math.round(midpointY / gridSizeWorld);
        if (!Number.isSafeInteger(cellX) || !Number.isSafeInteger(cellY)) {
          retained.push(index, index + 1, index + 2, index + 3);
          continue;
        }
        const key = `${cellX}:${cellY}`;
        if (!representatives.has(key)) {
          representatives.set(key, [cellX * gridSizeWorld, cellY * gridSizeWorld]);
        }
        collapsedSegmentCount++;
      }
    }

    if (representatives.size > 0 || retained.length > 0) {
      const firstVertex = output.length / 2;
      for (const [centerX, centerY] of representatives.values()) {
        output.push(centerX - representativeHalfLengthWorld, centerY,
          centerX + representativeHalfLengthWorld, centerY);
        remappedPathDistances?.push(0, 0);
      }
      const vertexCount = representatives.size * 2 + retained.length / 2;
      for (let retainedIndex = 0; retainedIndex < retained.length; retainedIndex += 4) {
        const firstRetainedVertex = output.length / 2;
        for (let vertexOffset = 0; vertexOffset < 2; vertexOffset++) {
          const sourceOffset = retained[retainedIndex + vertexOffset * 2]!;
          sourceToOutputVertex?.set(sourceOffset / 2, firstRetainedVertex + vertexOffset);
          output.push(source[sourceOffset]!, source[sourceOffset + 1]!);
          remappedPathDistances?.push(sourcePathDistances?.[sourceOffset / 2] ?? 0);
        }
      }
      const mergedCommand = { ...command, firstVertex, vertexCount };
      const firstOrder = command.globalOrderIndex;
      const lastCommand = group[group.length - 1]!;
      const lastOrder = lastCommand.globalOrderEndIndex ?? lastCommand.globalOrderIndex;
      if (firstOrder !== undefined && lastOrder !== undefined) {
        mergedCommand.globalOrderIndex = firstOrder;
        mergedCommand.globalOrderEndIndex = lastOrder;
      }
      rewritten.push(mergedCommand);
      representativePointCount += representatives.size;
    }
  }

  if (collapsedSegmentCount === 0) return unchanged();
  let remappedPreservedVertexRanges: Array<{ firstVertex: number; vertexCount: number }> | undefined;
  if (preservedVertexRanges.length > 0) {
    remappedPreservedVertexRanges = [];
    for (const range of preservedVertexRanges) {
      const firstVertex = sourceToOutputVertex?.get(range.firstVertex);
      if (firstVertex === undefined) return unchanged();
      for (let offset = 1; offset < range.vertexCount; offset++) {
        if (sourceToOutputVertex?.get(range.firstVertex + offset) !== firstVertex + offset) return unchanged();
      }
      remappedPreservedVertexRanges.push({ firstVertex, vertexCount: range.vertexCount });
    }
  }
  return {
    xyArray: new Float32Array(output),
    drawCommands: rewritten,
    collapsedSegmentCount,
    retainedSegmentCount,
    representativePointCount,
    maxCenterlineDeviationCssPixels: sourceLengthCssPixels / 2 + Math.SQRT2 * gridSizeCssPixels / 2 +
      representativeSegmentCssPixels / 2,
    ...(remappedPathDistances ? { remappedPathDistancesArray: new Float32Array(remappedPathDistances) } : {}),
    ...(remappedPreservedVertexRanges ? { remappedPreservedVertexRanges } : {}),
  };
}
