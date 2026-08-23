import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { normalizeDxfForStage4Rendering } from "../src/lib/dokumantasyon/dxf-stage4-fidelity";
import { normalizeDxfLayersForInteractiveControl } from "../src/lib/dokumantasyon/dxf-layer-runtime";

const root = path.resolve(process.cwd());
const dxfRoot = path.join(root, "node_modules", "dxf-viewer");
const marker = "MUHENDISLIK_DXF_STAGE1";

for (const relativePath of [
  "src/parser/DxfParser.js",
  "src/BatchingKey.js",
  "src/MaterialKey.js",
  "src/DxfScene.js",
  "src/DxfViewer.js",
  "src/index.d.ts",
]) {
  const source = fs.readFileSync(path.join(dxfRoot, relativePath), "utf8");
  assert.ok(source.includes(marker), `${relativePath} Stage 1 patch marker içermiyor.`);
}

const fixture = `0
SECTION
2
HEADER
9
$LWDEFAULT
370
25
0
ENDSEC
0
SECTION
2
TABLES
0
TABLE
2
LAYER
70
2
0
LAYER
2
0
70
0
62
7
6
CONTINUOUS
370
25
0
LAYER
2
A
70
0
62
2
6
CONTINUOUS
370
50
0
ENDTAB
0
ENDSEC
0
SECTION
2
ENTITIES
0
LINE
5
10
8
A
62
1
370
-2
10
0
20
0
30
0
11
100
21
0
31
0
0
LINE
5
11
8
A
62
1
370
25
10
0
20
0
30
0
11
100
21
0
31
0
0
LINE
5
12
8
A
420
65280
370
-3
10
0
20
25
30
0
11
100
21
25
31
0
0
ENDSEC
0
EOF
`;

function countEntityType(text: string, type: string): number {
  const lines = text.replace(/\r\n?/g, "\n").split("\n");
  let count = 0;
  for (let index = 0; index + 1 < lines.length; index += 2) {
    if (lines[index].trim() === "0" && lines[index + 1].trim().toUpperCase() === type) count += 1;
  }
  return count;
}

function entityGroupValues(text: string, type: string, code: number): number[] {
  const lines = text.replace(/\r\n?/g, "\n").split("\n");
  const values: number[] = [];
  let active = false;
  for (let index = 0; index + 1 < lines.length; index += 2) {
    const group = Number.parseInt(lines[index].trim(), 10);
    const value = lines[index + 1].trim();
    if (group === 0) {
      active = value.toUpperCase() === type;
      continue;
    }
    if (active && group === code) values.push(Number(value));
  }
  return values;
}

const stage4 = normalizeDxfForStage4Rendering(fixture);
const interactive = normalizeDxfLayersForInteractiveControl(stage4.text);

assert.equal(countEntityType(fixture, "LINE"), 3, "Fixture üç ayrı LINE entity içermeli.");
assert.equal(countEntityType(stage4.text, "LINE"), 3, "Stage 4 normalizasyonu coincident LINE entity silmemeli.");
assert.equal(countEntityType(interactive.text, "LINE"), 3, "Interactive layer normalizasyonu coincident LINE entity silmemeli.");
assert.deepEqual(entityGroupValues(interactive.text, "LINE", 370), [-2, 25, -3], "Entity lineweight kodları render kopyasında aynen korunmalı.");
assert.deepEqual(entityGroupValues(interactive.text, "LINE", 62), [1, 1], "ACI entity renkleri render kopyasında korunmalı.");
assert.deepEqual(entityGroupValues(interactive.text, "LINE", 420), [65280], "TrueColor render kopyasında korunmalı.");

const parserUrl = pathToFileURL(path.join(dxfRoot, "src/parser/DxfParser.js")).href;
const sceneUrl = pathToFileURL(path.join(dxfRoot, "src/DxfScene.js")).href;
const keyUrl = pathToFileURL(path.join(dxfRoot, "src/BatchingKey.js")).href;
const [{ default: DxfParser }, { DxfScene }, { BatchingKey }] = await Promise.all([
  import(parserUrl),
  import(sceneUrl),
  import(keyUrl),
]);

const parser = new DxfParser();
const parsed = parser.parseSync(interactive.text);
assert.equal(parsed.tables.layer.layers.A.lineweight, 50, "LAYER group 370 parser tarafından korunmalı.");
assert.deepEqual(parsed.entities.map((entity: { lineweight?: number }) => entity.lineweight), [-2, 25, -3], "Entity 370 değerleri parser'da korunmalı.");
assert.equal(parsed.entities[2].color, 65280, "TrueColor parser'da kaynak değerini korumalı.");

const scene = new DxfScene({ sceneOptions: { suppressPaperSpace: true } });
await scene.Build(parsed, []);
const serialized = scene.scene as {
  defaultLineweight: number;
  batches: Array<{ key: { geometryType: number; lineweight: number; color: number }; verticesSize?: number }>;
  layers: Array<{ name: string; lineweight: number }>;
};

assert.equal(serialized.defaultLineweight, 25, "$LWDEFAULT sahneye taşınmalı.");
assert.equal(serialized.layers.find((layer) => layer.name === "A")?.lineweight, 50, "Layer lineweight sahne metadata'sında bulunmalı.");
const lineBatches = serialized.batches.filter((batch) => batch.key.geometryType === BatchingKey.GeometryType.LINES);
const lineweights = lineBatches.map((batch) => batch.key.lineweight).sort((a, b) => a - b);
assert.ok(lineweights.includes(25), "Explicit/default 0.25 mm lineweight batch anahtarında bulunmalı.");
assert.ok(lineweights.includes(50), "BYLAYER 0.50 mm lineweight batch anahtarında bulunmalı.");
assert.equal(lineBatches.reduce((total, batch) => total + (batch.verticesSize ?? 0), 0), 12, "Üç LINE entity'nin altı endpoint'i korunmalı; coincident çizgiler deduplicate edilmemeli.");

const key25 = new BatchingKey("A", null, BatchingKey.GeometryType.LINES, 0xff0000, 0, 25);
const key50 = new BatchingKey("A", null, BatchingKey.GeometryType.LINES, 0xff0000, 0, 50);
assert.notEqual(key25.Compare(key50), 0, "Farklı lineweight değerleri aynı render batch anahtarına düşmemeli.");

const viewerSource = fs.readFileSync(path.join(dxfRoot, "src/DxfViewer.js"), "utf8");
assert.ok(viewerSource.includes('colorMode = options.colorMode ?? "source"'), "Kaynak renk modu varsayılan olmalı.");
assert.ok(viewerSource.includes("SetColorMode(mode)"), "Runtime source/monochrome renk geçiş API'si bulunmalı.");
assert.ok(viewerSource.includes("lineweightMetadata: true"), "Viewer lineweight metadata capability bildirmeli.");
assert.ok(viewerSource.includes("lineweightRasterization: false"), "Henüz fiziksel kalınlık çizilmiyorsa capability bunu dürüstçe bildirmeli.");

console.log("DXF Stage 1 doğrulandı: kaynak renkleri, lineweight semantiği ve coincident geometri korunuyor.");
