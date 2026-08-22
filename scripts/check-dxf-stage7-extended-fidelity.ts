import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { auditDxfReleaseHardening, getDxfReleaseHardeningBlockingIssues } from "../src/lib/dokumantasyon/dxf-release-hardening";
import { auditDxfStage4, getDxfStage4BlockingIssues } from "../src/lib/dokumantasyon/dxf-stage4-fidelity";

type Pair = { code: number; value: string };
type RecordData = { section: string | null; type: string; pairs: Pair[]; blockName: string | null };

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
  assert.match(browserSpec, /stage7-color-hatch\.dxf/);
  assert.match(browserSpec, /expectForegroundGeometrySignal/);
  assert.match(browserSpec, /cad-dxf-runtime-snapshot/);
  assert.match(browserSpec, /spanX/);
  assert.match(browserSpec, /spanY/);

  console.log("DXF extended large-coordinate/bulge/color/hatch fidelity checks passed.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
