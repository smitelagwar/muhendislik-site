import assert from "node:assert/strict";
import { test } from "node:test";
import { buildStairAreaSurface, deriveUniformStairSchedule, evaluateStairExpression, type StairSurfaceResult } from "./stair-geometry";

const polygon = [{ x: 0, y: 0 }, { x: 4, y: 0 }, { x: 4, y: 2 }, { x: 0, y: 2 }];
const hole = [{ x: 1.5, y: .5 }, { x: 2.5, y: .5 }, { x: 2.5, y: 1.5 }, { x: 1.5, y: 1.5 }];
function surface(result: StairSurfaceResult) { if (result.status !== "surface") throw new Error((result as { reason?: string }).reason ?? "surface expected"); return result; }
function horizontalArea(positions: number[]) {
  let area = 0;
  for (let i = 0; i < positions.length; i += 9) {
    if (Math.abs(positions[i + 2] - positions[i + 5]) > 1e-8 || Math.abs(positions[i + 2] - positions[i + 8]) > 1e-8) continue;
    area += Math.abs((positions[i + 3] - positions[i]) * (positions[i + 7] - positions[i + 1]) - (positions[i + 4] - positions[i + 1]) * (positions[i + 6] - positions[i])) / 2;
  }
  return area;
}

test("native arithmetic supports Unicode variable names and refuses execution/unknowns", () => {
  assert.ok(Math.abs(evaluateStairExpression("(L1+L2)*W", { L1: 2.4, L2: 1.2, W: 1.2 })! - 4.32) < 1e-12);
  assert.equal(evaluateStairExpression("ALAN_1_YÜKSEKLİĞİ-0.1", { ALAN_1_YÜKSEKLİĞİ: 1.5 }), 1.4);
  assert.equal(evaluateStairExpression("COS(60)*2", {}), null);
  assert.ok(Math.abs(evaluateStairExpression("COS(60)*2", {}, { angleUnit: "degrees" })! - 1) < 1e-12);
  assert.ok(Math.abs(evaluateStairExpression("COS(PI)*2", {}, { angleUnit: "radians" })! + 2) < 1e-12);
  assert.equal(evaluateStairExpression("MIN(4,2)+MAX(1,3)", {}), 5);
  for (const text of ["process.exit()", "globalThis.x=1", "constructor(1)", "unknown+1", "1/0", "1;2", "(2+3", "ABS(1,2)"]) assert.equal(evaluateStairExpression(text, {}), null, text);
});

test("documented top-tread count distinguishes seven risers from eight", () => {
  const checked = deriveUniformStairSchedule({ mode: "count", count: 7, topTread: true, elevation: 3, totalRise: 1.4, coatingAdjustments: "zero" });
  const unchecked = deriveUniformStairSchedule({ mode: "count", count: 7, topTread: false, elevation: 3, totalRise: 1.4, coatingAdjustments: "zero" });
  assert.equal(checked?.riserCount, 7); assert.equal(checked?.treadCount, 6);
  assert.equal(unchecked?.riserCount, 8); assert.equal(unchecked?.treadCount, 7);
  assert.ok(Math.abs(checked!.levels.at(-1)! - 4.2) < 1e-12);
  assert.ok(Math.abs(unchecked!.levels.at(-1)! - 4.225) < 1e-12);
  assert.equal(checked?.endElevation, 4.4); assert.equal(unchecked?.endElevation, 4.4);
  assert.equal(deriveUniformStairSchedule({ mode: "count", count: 0, topTread: true, elevation: 0, totalRise: 1.4, coatingAdjustments: "zero" }), null);
});

test("landing caps preserve openings for either source-ring winding", () => {
  for (const outer of [polygon, polygon.toReversed()]) for (const opening of [hole, hole.toReversed()]) {
    const result = surface(buildStairAreaSurface({ polygon: outer, holes: [opening], kind: "landing", elevation: 3 }));
    assert.ok(Math.abs(horizontalArea(result.mesh.positions) - 7) < 1e-10);
    assert.equal(result.mesh.source, "parametric-derived");
    for (let i = 2; i < result.mesh.positions.length; i += 3) assert.equal(result.mesh.positions[i], 3);
  }
});

test("flight strips retain footprint area and split risers around an opening", () => {
  const result = surface(buildStairAreaSurface({ polygon, holes: [hole], kind: "flight", elevation: 0, travel: [{ x: 0, y: 1 }, { x: 4, y: 1 }], stations: [0, .25, .5, .75, 1], levels: [.2, .4, .6, .8], startElevation: 0, endElevation: 1 }));
  assert.ok(Math.abs(horizontalArea(result.mesh.positions) - 7) < 1e-10);
  const centerRiserPaths = result.planPaths.filter(points => points.every(p => Math.abs(p.x - 2) < 1e-10));
  assert.equal(centerRiserPaths.length, 2);
  assert.ok(centerRiserPaths.every(points => points.every(p => p.y <= .5 || p.y >= 1.5)));
  assert.ok(result.mesh.positions.every(Number.isFinite));
});

test("concave flight boundaries retain disconnected cross-section segments", () => {
  const uShape = [{ x: 0, y: 0 }, { x: 4, y: 0 }, { x: 4, y: 4 }, { x: 3, y: 4 }, { x: 3, y: 1 }, { x: 1, y: 1 }, { x: 1, y: 4 }, { x: 0, y: 4 }];
  const result = surface(buildStairAreaSurface({ polygon: uShape, kind: "flight", elevation: 0, travel: [{ x: 2, y: 0 }, { x: 2, y: 4 }], stations: [0, .5, 1], levels: [.2, .4] }));
  assert.ok(Math.abs(horizontalArea(result.mesh.positions) - 10) < 1e-10);
  assert.equal(result.planPaths.length, 2);
  assert.ok(result.planPaths.every(points => points.every(p => p.x <= 1 || p.x >= 3)));
});

test("unresolved automatic tread placement and out-of-domain guides remain unsupported", () => {
  assert.equal(buildStairAreaSurface({ polygon, kind: "flight", elevation: 0 }).status, "unsupported");
  assert.equal(buildStairAreaSurface({ polygon, kind: "flight", elevation: 0, travel: [{ x: 1, y: 1 }, { x: 3, y: 1 }], stations: [0, 1], levels: [1] }).status, "unsupported");
  assert.equal(buildStairAreaSurface({ polygon, kind: "flight", elevation: 0, travel: [{ x: 0, y: 1 }, { x: 4, y: 1 }], stations: [0, .5, .5, 1], levels: [1, 2, 3] }).status, "unsupported");
  assert.equal(buildStairAreaSurface({ polygon, kind: "landing", elevation: Infinity }).status, "unsupported");
});
