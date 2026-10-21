import assert from "node:assert/strict";
import {
  CAD_V2_OVERVIEW_GRID_CSS_PIXELS,
  CAD_V2_OVERVIEW_MAX_SOURCE_SEGMENT_CSS_PIXELS,
  CAD_V2_OVERVIEW_REPRESENTATIVE_SEGMENT_CSS_PIXELS,
  compactCadV2OverviewLinework,
} from "../../src/lib/cad-v2/worker/overview-linework-compaction";

const source = new Float32Array([
  0.001, 0.001, 0.021, 0.001,
  0.005, 0.012, 0.025, 0.012,
  0, 0, 1, 0,
  2, 2, 2.01, 2,
  3, 3, 3.01, 3,
  4, 4, 4.01, 4,
]);
const commands = [
  { kind: "line", layer: "A", color: [1, 0, 0] as [number, number, number], firstVertex: 0, vertexCount: 6, alpha: 1, lineweightMm: 0.29 },
  { kind: "line", layer: "B", color: [0, 1, 0] as [number, number, number], firstVertex: 6, vertexCount: 2, alpha: 1, dashStyle: { dashSize: 1, gapSize: 1 } },
  { kind: "line", layer: "C", color: [0, 0, 1] as [number, number, number], firstVertex: 8, vertexCount: 2, alpha: 1, pathDistanceRequired: true },
  { kind: "line", layer: "D", color: [1, 1, 0] as [number, number, number], firstVertex: 10, vertexCount: 2, alpha: 0.5 },
];

const result = compactCadV2OverviewLinework(source, commands, 1);
assert.equal(result.collapsedSegmentCount, 2, "only the two same-cell, subpixel opaque solid segments collapse");
assert.equal(result.retainedSegmentCount, 1, "the long solid segment retains both original endpoints");
assert.equal(result.representativePointCount, 1, "duplicate subpixel strokes in one command share one representative point");
assert.equal(result.xyArray.length / 2, 10, "one representative line, one exact long segment, and three protected segments remain");
assert.deepEqual(result.drawCommands.map((command) => command.kind), ["line", "line", "line", "line"]);
assert.deepEqual(result.drawCommands.map((command) => command.layer), ["A", "B", "C", "D"]);
assert.deepEqual(result.drawCommands.map((command) => command.vertexCount), [4, 2, 2, 2]);
assert.equal(result.maxCenterlineDeviationCssPixels,
  CAD_V2_OVERVIEW_MAX_SOURCE_SEGMENT_CSS_PIXELS / 2 +
  Math.SQRT2 * CAD_V2_OVERVIEW_GRID_CSS_PIXELS / 2 +
  CAD_V2_OVERVIEW_REPRESENTATIVE_SEGMENT_CSS_PIXELS / 2);
assert.ok(result.maxCenterlineDeviationCssPixels * 4 < 0.25,
  "the representative centerline remains under 0.25 CSS px through fourfold zoom");
assert.equal(CAD_V2_OVERVIEW_GRID_CSS_PIXELS, 0.03125);
assert.equal(CAD_V2_OVERVIEW_MAX_SOURCE_SEGMENT_CSS_PIXELS, 0.0625);

const adjacentRankSource = new Float32Array([
  0.001, 0.001, 0.011, 0.001,
  0.002, 0.002, 0.012, 0.002,
]);
const adjacentRankCommands = [
  { kind: "line", layer: "A", color: [1, 0, 0] as [number, number, number], firstVertex: 0, vertexCount: 2,
    alpha: 1, lineweightMm: 0.29, globalOrderIndex: 0, globalOrderEndIndex: 0 },
  { kind: "line", layer: "A", color: [1, 0, 0] as [number, number, number], firstVertex: 2, vertexCount: 2,
    alpha: 1, lineweightMm: 0.29, globalOrderIndex: 1, globalOrderEndIndex: 1 },
];
const adjacentRanks = compactCadV2OverviewLinework(adjacentRankSource, adjacentRankCommands, 1);
assert.equal(adjacentRanks.representativePointCount, 1,
  "adjacent opaque same-style painter ranks share a bounded overview representative");
assert.equal(adjacentRanks.drawCommands.length, 1,
  "an uninterrupted same-style rank run becomes one overview draw command");
assert.deepEqual([
  adjacentRanks.drawCommands[0]?.globalOrderIndex,
  adjacentRanks.drawCommands[0]?.globalOrderEndIndex,
], [0, 1], "overview coalescing preserves the complete source painter-rank interval");

const rankGapCommands = adjacentRankCommands.map((command, index) => ({
  ...command,
  globalOrderIndex: index === 0 ? 0 : 2,
  globalOrderEndIndex: index === 0 ? 0 : 2,
}));
const rankGap = compactCadV2OverviewLinework(adjacentRankSource, rankGapCommands, 1);
assert.equal(rankGap.representativePointCount, 2,
  "a gap in painter order prevents merging strokes that happen to share a raster cell");
assert.equal(rankGap.drawCommands.length, 2,
  "separated painter ranks retain independent overview draw commands");

const invalidRange = compactCadV2OverviewLinework(source, [
  { ...commands[0]!, firstVertex: 1 },
], 1);
assert.equal(invalidRange.xyArray, source, "incomplete or overlapping source ranges fail closed to exact geometry");
assert.equal(invalidRange.collapsedSegmentCount, 0);

const invalidScale = compactCadV2OverviewLinework(source, commands, Number.NaN);
assert.equal(invalidScale.xyArray, source, "an invalid camera scale preserves exact source geometry");
assert.equal(invalidScale.collapsedSegmentCount, 0);

console.log("CAD V2 overview linework compaction RED/GREEN target checks passed.");
