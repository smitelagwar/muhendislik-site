import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";

const fixtureDir = "tests/fixtures/cad-preview-v2";
const manifestPath = `${fixtureDir}/manifest.ts`;

function createFlatDxf(insunits, lineEnd, rectangle) {
  const [lineX, lineY] = lineEnd;
  const [rectX, rectY] = rectangle;
  return [
    "0", "SECTION", "2", "HEADER",
    "9", "$ACADVER", "1", "AC1027",
    "9", "$INSUNITS", "70", String(insunits),
    "0", "ENDSEC",
    "0", "SECTION", "2", "TABLES",
    "0", "TABLE", "2", "LAYER", "70", "2",
    "0", "LAYER", "2", "0", "70", "0", "62", "7", "6", "CONTINUOUS",
    "0", "LAYER", "2", "GEOMETRY", "70", "0", "62", "1", "6", "CONTINUOUS",
    "0", "ENDTAB", "0", "ENDSEC",
    "0", "SECTION", "2", "ENTITIES",
    "0", "LINE", "8", "GEOMETRY",
    "10", "0", "20", "0", "11", String(lineX), "21", String(lineY),
    "0", "LWPOLYLINE", "8", "GEOMETRY", "90", "4", "70", "1",
    "10", "0", "20", "0",
    "10", String(rectX), "20", "0",
    "10", String(rectX), "20", String(rectY),
    "10", "0", "20", String(rectY),
    "0", "ENDSEC", "0", "EOF",
  ].join("\n") + "\n";
}

const fixtures = [
  {
    fileName: "known-geometry-measurements.dxf",
    content: createFlatDxf(4, [3000, 4000], [3000, 4000]),
  },
  {
    fileName: "stage9-area-20m2.dxf",
    content: createFlatDxf(4, [5000, 4000], [5000, 4000]),
  },
  {
    fileName: "stage9-unitless-calibration.dxf",
    content: createFlatDxf(0, [100, 0], [400, 600]),
  },
];

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

let manifest = readFileSync(manifestPath, "utf8");

for (const fixture of fixtures) {
  const path = `${fixtureDir}/${fixture.fileName}`;
  writeFileSync(path, fixture.content, "utf8");

  const bytes = Buffer.from(fixture.content, "utf8");
  const sha256 = createHash("sha256").update(bytes).digest("hex");
  const pattern = new RegExp(
    `(fileName: "${escapeRegExp(fixture.fileName)}",\\n\\s+sha256: ")[^"]+(",\\n\\s+sizeBytes: )\\d+`,
    "m"
  );
  if (!pattern.test(manifest)) {
    throw new Error(`Stage 9 fixture manifest entry missing: ${fixture.fileName}`);
  }
  manifest = manifest.replace(pattern, `$1${sha256}$2${bytes.length}`);
  console.log(`Stage 9 fixture ready: ${fixture.fileName} ${bytes.length} bytes ${sha256}`);
}

writeFileSync(manifestPath, manifest, "utf8");
console.log("Stage 9 flat DXF fixtures repaired and manifest integrity refreshed.");
