import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { normalizeParsedDxfDimensionColors } from "../src/lib/dokumantasyon/dxf-dimension-color-normalization";
import { auditDxfReleaseHardening, getDxfReleaseHardeningBlockingIssues } from "../src/lib/dokumantasyon/dxf-release-hardening";
import { auditDxfStage3, getDxfStage3BlockingIssues } from "../src/lib/dokumantasyon/dxf-stage3-fidelity";
import { auditDxfStage4, getDxfStage4BlockingIssues } from "../src/lib/dokumantasyon/dxf-stage4-fidelity";

type Pair = { code: number; value: string };
type RecordData = { section: string | null; type: string; pairs: Pair[]; blockName: string | null };

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function parsePairs(text: string): Pair[] {
  const lines = text.replace(/\r\n?/g, "\n").split("\n");
  const pairs: Pair[] = [];
  for (let index = 0; index + 1 < lines.length; index += 2) {
    const code = Number.parseInt(lines[index].trim(), 10);
    if (Number.isFinite(code)) pairs.push({ code, value: lines[index + 1].trim() });
  }
  return pairs;
}

function value(record: RecordData | undefined, code: number): string | null {
  return record?.pairs.find((pair) => pair.code === code)?.value ?? null;
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

async function main() {
  const fixturePath = path.join(root, "tests", "fixtures", "dxf", "stage5-color-fidelity.dxf");
  const text = await readFile(fixturePath, "utf8");
  const records = parseRecords(text);

  const layers = records.filter((record) => record.section === "TABLES" && record.type === "LAYER");
  const aciRed = layers.find((record) => value(record, 2) === "ACI_RED");
  const trueGreen = layers.find((record) => value(record, 2) === "TRUE_GREEN");
  assert.equal(Number(value(aciRed, 62)), 1, "ACI_RED must use ACI 1");
  assert.equal(Number(value(trueGreen, 420)), 0x00ff00, "TRUE_GREEN must carry layer TrueColor");

  const topHatches = records.filter((record) => record.section === "ENTITIES" && record.type === "HATCH");
  assert.equal(topHatches.length, 5, "fixture must contain five top-level solid color swatches");
  assert.ok(topHatches.some((record) => value(record, 8) === "ACI_RED" && Number(value(record, 62)) === 256));
  assert.ok(topHatches.some((record) => value(record, 8) === "TRUE_GREEN" && Number(value(record, 62)) === 256));
  assert.ok(topHatches.some((record) => Number(value(record, 420)) === 0x0000ff));
  assert.ok(topHatches.some((record) => Number(value(record, 420)) === 0x202020));
  assert.ok(topHatches.some((record) => Number(value(record, 420)) === 0x000000));

  const blockHatch = records.find(
    (record) => record.section === "BLOCKS" && record.type === "HATCH" && record.blockName === "COLOR_BLOCK"
  );
  assert.equal(Number(value(blockHatch, 62)), 0, "block swatch must exercise BYBLOCK");

  const insert = records.find((record) => record.section === "ENTITIES" && record.type === "INSERT");
  assert.equal(value(insert, 2), "COLOR_BLOCK");
  assert.equal(Number(value(insert, 62)), 6, "INSERT must resolve BYBLOCK to ACI 6");

  const textEntity = records.find((record) => record.section === "ENTITIES" && record.type === "TEXT");
  assert.equal(Number(value(textEntity, 420)), 0x00ffff, "TEXT must carry explicit cyan TrueColor");

  const dimension = records.find((record) => record.section === "ENTITIES" && record.type === "DIMENSION");
  assert.equal(Number(value(dimension, 62)), 2, "DIMENSION entity carries ACI 2 as a secondary source color signal");
  const dimStyle = records.find(
    (record) => record.section === "TABLES" && record.type === "DIMSTYLE" && value(record, 2) === "STANDARD"
  );
  assert.equal(Number(value(dimStyle, 176)), 2, "DIMCLRD must make the dimension line ACI 2/yellow");
  assert.equal(Number(value(dimStyle, 177)), 2, "DIMCLRE must make extension lines ACI 2/yellow");
  assert.equal(Number(value(dimStyle, 178)), 2, "DIMCLRT must make dimension text ACI 2/yellow");

  // Lock the worker-only compatibility normalization independently from the browser test. Upstream
  // stores DIMSTYLE colors as raw ACI integers even though its scene consumes them as RGB values.
  const parsedProbe = {
    tables: {
      dimstyle: {
        dimStyles: {
          STANDARD: { DIMCLRD: 2, DIMCLRE: 0, DIMCLRT: 256 },
        },
      },
    },
    entities: [
      {
        type: "DIMENSION",
        xdata: {
          ACAD: {
            DSTYLE: {
              values: [
                { code: 1070, value: 176 },
                { code: 1070, value: 5 },
              ],
            },
          },
        },
      },
    ],
  };
  const normalization = normalizeParsedDxfDimensionColors(parsedProbe);
  assert.equal(parsedProbe.tables.dimstyle.dimStyles.STANDARD.DIMCLRD, 0xffff00, "ACI 2 must become RGB yellow");
  assert.equal(parsedProbe.tables.dimstyle.dimStyles.STANDARD.DIMCLRE, null, "BYBLOCK must defer to resolved entity/block color");
  assert.equal(parsedProbe.tables.dimstyle.dimStyles.STANDARD.DIMCLRT, null, "BYLAYER must defer to resolved entity/layer color");
  assert.equal(parsedProbe.entities[0].xdata.ACAD.DSTYLE.values[1].value, 0x0000ff, "DSTYLE ACI override must use the same palette");
  assert.deepEqual(normalization, {
    styleColorCount: 3,
    overrideColorCount: 1,
    inheritedColorCount: 2,
    invalidColorCount: 0,
  });
  assert.deepEqual(normalizeParsedDxfDimensionColors(parsedProbe), {
    styleColorCount: 0,
    overrideColorCount: 0,
    inheritedColorCount: 0,
    invalidColorCount: 0,
  }, "normalization must be idempotent for the same parsed DXF object");

  assert.deepEqual(getDxfStage3BlockingIssues(auditDxfStage3(text)), []);
  assert.deepEqual(getDxfStage4BlockingIssues(auditDxfStage4(text)), []);
  assert.deepEqual(getDxfReleaseHardeningBlockingIssues(auditDxfReleaseHardening(text)), []);

  const browserSpec = await readFile(path.join(root, "tests", "document-studio", "dxf-color.spec.ts"), "utf8");
  assert.match(browserSpec, /stage5-color-fidelity\.dxf/);
  assert.match(browserSpec, /expectModelRgb/);
  assert.match(browserSpec, /255,\s*0,\s*0/);
  assert.match(browserSpec, /0,\s*255,\s*0/);
  assert.match(browserSpec, /0,\s*0,\s*255/);
  assert.match(browserSpec, /255,\s*0,\s*255/);
  assert.match(browserSpec, /255,\s*255,\s*0/);

  const workerSource = await readFile(
    path.join(root, "src", "components", "dokumantasyon", "preview", "dxf-viewer-worker.ts"),
    "utf8"
  );
  assert.match(workerSource, /normalizeParsedDxfDimensionColors\(dxf\)/);

  console.log("DXF Stage 5 color fidelity checks passed.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
