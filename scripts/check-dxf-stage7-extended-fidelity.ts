import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { auditDxfReleaseHardening, getDxfReleaseHardeningBlockingIssues } from "../src/lib/dokumantasyon/dxf-release-hardening";
import { auditDxfStage4, getDxfStage4BlockingIssues } from "../src/lib/dokumantasyon/dxf-stage4-fidelity";

type Pair = { code: number; value: string };
type RecordData = { section: string | null; type: string; pairs: Pair[]; blockName: string | null };
type Point2 = { x: number; y: number };

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const fixtureDir = path.join(root, "tests", "fixtures", "dxf");

function parsePairs(text: string): Pair[] {
  const lines = text.replace(/\r\n?/g, "\n").split("\n");
  const pairs: Pair[] = [];
  for (let index = 0; index + 1 < lines.length; index += 2) {
    const code = Number.parseInt(lines[index].trim(), 10);
    if (Number.isFinite(code)) pairs.push({ code, value: lines[index + 1].trim() });
  }
  return pairs;
}

function value(record: RecordData, code: number): string | null {
  return record.pairs.find((pair) => pair.code === code)?.value ?? null;
}

function values(record: RecordData, code: number): string[] {
  return record.pairs.filter((pair) => pair.code === code).map((pair) => pair.value);
}

function parseRecords(text: string): RecordData[] {
  const pairs = parsePairs(text);
  const records: RecordData[] = [];
  let section: string | null = null;
  let type: string | null = null;
  let recordPairs: Pair[] = [];
  let blockName: string | null = null;

  const flush = () => {
    if (!type) return;
    const normalizedType = type.toUpperCase();
    records.push({
      section,
      type: normalizedType,
      pairs: recordPairs,
      blockName: section === "BLOCKS" && normalizedType !== "BLOCK" && normalizedType !== "ENDBLK" ? blockName : null,
    });
    if (section === "BLOCKS" && normalizedType === "BLOCK") {
      blockName = recordPairs.find((pair) => pair.code === 2)?.value ?? null;
    } else if (section === "BLOCKS" && normalizedType === "ENDBLK") {
      blockName = null;
    }
  };

  for (let index = 0; index < pairs.length; index += 1) {
    const pair = pairs[index];
    const normalized = pair.value.toUpperCase();
    if (pair.code === 0 && normalized === "SECTION") {
      flush();
      type = null;
      recordPairs = [];
      blockName = null;
      section = pairs[index + 1]?.code === 2 ? pairs[index + 1].value.toUpperCase() : null;
      continue;
    }
    if (pair.code === 0 && normalized === "ENDSEC") {
      flush();
      type = null;
      recordPairs = [];
      blockName = null;
      section = null;
      continue;
    }
    if (pair.code === 0) {
      flush();
      type = normalized;
      recordPairs = [pair];
      continue;
    }
    if (type) recordPairs.push(pair);
  }
  flush();
  return records;
}

function lwPolylineVertices(record: RecordData): Array<Point2 & { bulge: number }> {
  const result: Array<Point2 & { bulge: number }> = [];
  let current: (Point2 & { bulge: number }) | null = null;
  for (const pair of record.pairs) {
    if (pair.code === 10) {
      if (current) result.push(current);
      current = { x: Number(pair.value), y: Number.NaN, bulge: 0 };
    } else if (pair.code === 20 && current && Number.isNaN(current.y)) {
      current.y = Number(pair.value);
    } else if (pair.code === 42 && current) {
      current.bulge = Number(pair.value);
    }
  }
  if (current) result.push(current);
  return result;
}

function normalizeAngle(angle: number): number {
  const twoPi = Math.PI * 2;
  return ((angle % twoPi) + twoPi) % twoPi;
}

function angleOnSweep(angle: number, start: number, sweep: number): boolean {
  const a = normalizeAngle(angle);
  const s = normalizeAngle(start);
  if (sweep >= 0) return normalizeAngle(a - s) <= sweep + 1e-9;
  return normalizeAngle(s - a) <= -sweep + 1e-9;
}

function bulgeArcBounds(start: Point2, end: Point2, bulge: number) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const chord = Math.hypot(dx, dy);
  assert.ok(chord > 0 && Math.abs(bulge) > 1e-12, "bulge bounds require a non-degenerate arc");
  const sweep = 4 * Math.atan(bulge);
  const midX = (start.x + end.x) / 2;
  const midY = (start.y + end.y) / 2;
  const leftX = -dy / chord;
  const leftY = dx / chord;
  const centerOffset = chord * (1 - bulge * bulge) / (4 * bulge);
  const centerX = midX + leftX * centerOffset;
  const centerY = midY + leftY * centerOffset;
  const radius = chord * (1 + bulge * bulge) / (4 * Math.abs(bulge));
  const startAngle = Math.atan2(start.y - centerY, start.x - centerX);
  const points: Point2[] = [start, end];
  for (const cardinal of [0, Math.PI / 2, Math.PI, Math.PI * 1.5]) {
    if (angleOnSweep(cardinal, startAngle, sweep)) {
      points.push({ x: centerX + radius * Math.cos(cardinal), y: centerY + radius * Math.sin(cardinal) });
    }
  }
  return {
    minX: Math.min(...points.map((point) => point.x)),
    maxX: Math.max(...points.map((point) => point.x)),
    minY: Math.min(...points.map((point) => point.y)),
    maxY: Math.max(...points.map((point) => point.y)),
  };
}

async function fixture(name: string) {
  return readFile(path.join(fixtureDir, name), "utf8");
}

async function main() {
  const largeText = await fixture("stage7-large-coordinate-bulge.dxf");
  const largeRecords = parseRecords(largeText);
  const largePolyline = largeRecords.find((record) => record.section === "ENTITIES" && record.type === "LWPOLYLINE");
  assert.ok(largePolyline, "large-coordinate fixture must contain a LWPOLYLINE");
  const bulges = values(largePolyline, 42).map(Number);
  assert.equal(bulges.filter((bulge) => bulge > 0).length, 2);
  assert.equal(bulges.filter((bulge) => bulge < 0).length, 1);
  assert.ok((Number(value(largePolyline, 70) ?? 0) & 1) !== 0, "bulge fixture must be closed");
  assert.ok(Math.abs(bulges.at(-1) ?? 0) > 0, "closed polyline final->first segment must carry a bulge");
  const coordinateValues = largeRecords
    .filter((record) => record.section === "ENTITIES")
    .flatMap((record) => [10, 11, 20, 21].flatMap((code) => values(record, code).map(Number)))
    .filter(Number.isFinite);
  assert.ok(Math.max(...coordinateValues.map(Math.abs)) > 4_000_000, "fixture must exercise active survey-scale coordinates");
  const largeStage4 = auditDxfStage4(largeText);
  assert.equal(largeStage4.bulgedPolylineCount, 1);
  assert.equal(largeStage4.visibleModelSpaceGeometryCount, 3);
  assert.deepEqual(getDxfStage4BlockingIssues(largeStage4), []);
  assert.deepEqual(getDxfReleaseHardeningBlockingIssues(auditDxfReleaseHardening(largeText)), []);

  const signedText = await fixture("stage7-bulge-signs.dxf");
  const signedPolylines = parseRecords(signedText).filter((record) => record.section === "ENTITIES" && record.type === "LWPOLYLINE");
  assert.equal(signedPolylines.length, 3);
  const positiveVertices = lwPolylineVertices(signedPolylines[0]);
  const negativeVertices = lwPolylineVertices(signedPolylines[1]);
  const closedVertices = lwPolylineVertices(signedPolylines[2]);
  assert.equal(positiveVertices[0].bulge > 0, true);
  assert.equal(negativeVertices[0].bulge < 0, true);
  assert.ok((Number(value(signedPolylines[2], 70) ?? 0) & 1) !== 0);
  assert.ok(Math.abs(closedVertices.at(-1)?.bulge ?? 0) > 0, "closing segment must use final vertex bulge");
  const positiveBounds = bulgeArcBounds(positiveVertices[0], positiveVertices[1], positiveVertices[0].bulge);
  const negativeBounds = bulgeArcBounds(negativeVertices[0], negativeVertices[1], negativeVertices[0].bulge);
  assert.ok(Math.abs(positiveBounds.minY - (-20.7106781187)) < 1e-6);
  assert.ok(Math.abs(negativeBounds.maxY - 120.7106781187) < 1e-6);
  const signedStage4 = auditDxfStage4(signedText);
  assert.equal(signedStage4.bulgedPolylineCount, 3);
  assert.equal(signedStage4.visibleModelSpaceGeometryCount, 3);
  assert.deepEqual(getDxfStage4BlockingIssues(signedStage4), []);
  assert.deepEqual(getDxfReleaseHardeningBlockingIssues(auditDxfReleaseHardening(signedText)), []);

  const colorText = await fixture("stage7-color-hatch.dxf");
  const colorRecords = parseRecords(colorText);
  const trueLayer = colorRecords.find((record) => record.section === "TABLES" && record.type === "LAYER" && value(record, 2) === "TRUE_LAYER");
  assert.equal(Number(value(trueLayer as RecordData, 420)), 65280);
  const byLayerLine = colorRecords.find((record) => record.section === "ENTITIES" && record.type === "LINE" && value(record, 8) === "ACI_LAYER");
  assert.equal(Number(value(byLayerLine as RecordData, 62)), 256);
  const trueColorLine = colorRecords.find((record) => record.section === "ENTITIES" && record.type === "LINE" && value(record, 8) === "TRUE_LAYER");
  assert.equal(Number(value(trueColorLine as RecordData, 420)), 255);
  const byBlockLine = colorRecords.find((record) => record.section === "BLOCKS" && record.type === "LINE" && record.blockName === "COLOR_BLOCK");
  assert.equal(Number(value(byBlockLine as RecordData, 62)), 0);
  const hatch = colorRecords.find((record) => record.section === "ENTITIES" && record.type === "HATCH");
  assert.equal(Number(value(hatch as RecordData, 91)), 2);
  assert.deepEqual(values(hatch as RecordData, 92).map(Number), [7, 2]);
  const colorStage4 = auditDxfStage4(colorText);
  assert.equal(colorStage4.hatchCount, 1);
  assert.equal(colorStage4.patternedHatchCount, 0);
  assert.equal(colorStage4.visibleModelSpaceGeometryCount, 4);
  assert.deepEqual(getDxfStage4BlockingIssues(colorStage4), []);
  const colorHardening = auditDxfReleaseHardening(colorText);
  assert.equal(colorHardening.reachableBlockCount, 1);
  assert.deepEqual(getDxfReleaseHardeningBlockingIssues(colorHardening), []);

  const browserSpec = await readFile(path.join(root, "tests", "document-studio", "dxf-release.spec.ts"), "utf8");
  assert.match(browserSpec, /stage7-large-coordinate-bulge\.dxf/);
  assert.match(browserSpec, /stage7-bulge-signs\.dxf/);
  assert.match(browserSpec, /stage7-color-hatch\.dxf/);
  assert.match(browserSpec, /expectForegroundGeometrySignal/);
  assert.match(browserSpec, /cad-dxf-runtime-snapshot/);
  assert.match(browserSpec, /-20\.710678/);
  assert.match(browserSpec, /120\.710678/);
  assert.match(browserSpec, /spanX/);
  assert.match(browserSpec, /spanY/);

  console.log("DXF extended large-coordinate/bulge/color/hatch fidelity checks passed.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
