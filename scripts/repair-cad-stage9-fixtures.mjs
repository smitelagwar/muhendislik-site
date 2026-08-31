import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";

const fixtureDir = "tests/fixtures/cad-preview-v2";
const manifestPath = `${fixtureDir}/manifest.ts`;

function createLineRectangleDxf(insunits, width, height) {
  const line = (x1, y1, x2, y2) => [
    "0", "LINE", "8", "GEOMETRY",
    "10", String(x1), "20", String(y1),
    "11", String(x2), "21", String(y2),
  ];

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
    ...line(0, 0, width, 0),
    ...line(width, 0, width, height),
    ...line(width, height, 0, height),
    ...line(0, height, 0, 0),
    "0", "ENDSEC", "0", "EOF",
  ].join("\n") + "\n";
}

const fixtures = [
  {
    fileName: "known-geometry-measurements.dxf",
    content: createLineRectangleDxf(4, 3000, 4000),
  },
  {
    fileName: "stage9-area-20m2.dxf",
    content: createLineRectangleDxf(4, 5000, 4000),
  },
  {
    fileName: "stage9-unitless-calibration.dxf",
    content: createLineRectangleDxf(0, 400, 600),
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
  console.log(`Stage 9 LINE fixture ready: ${fixture.fileName} ${bytes.length} bytes ${sha256}`);
}

writeFileSync(manifestPath, manifest, "utf8");
console.log("Stage 9 LINE-only DXF fixtures repaired and manifest integrity refreshed.");
