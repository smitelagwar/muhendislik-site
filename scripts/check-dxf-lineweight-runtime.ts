import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import {
  auditDxfLineweightSource,
  DXF_LINEWEIGHT_BY_BLOCK,
  DXF_LINEWEIGHT_BY_LAYER,
  DXF_LINEWEIGHT_DEFAULT,
  lineweightHundredthsMmToCssPixels,
  resolveDxfLineweightHundredthsMm,
} from "../src/lib/dokumantasyon/dxf-lineweight-source";

const root = process.cwd();
const fixturePath = path.join(root, "tests", "fixtures", "dxf", "lineweight-display.dxf");
const workerPath = path.join(root, "src", "components", "dokumantasyon", "preview", "dxf-viewer-worker.ts");
const runtimePath = path.join(root, "src", "lib", "dokumantasyon", "dxf-lineweight-runtime.ts");
const uiPath = path.join(root, "src", "components", "dokumantasyon", "preview", "dxf-diagnostics-panel.tsx");

const [fixture, worker, runtime, ui] = await Promise.all([
  readFile(fixturePath, "utf8"),
  readFile(workerPath, "utf8"),
  readFile(runtimePath, "utf8"),
  readFile(uiPath, "utf8"),
]);

const audit = auditDxfLineweightSource(fixture);
assert.equal(audit.defaultLineweight, 25, "$LWDEFAULT must be preserved");
assert.equal(audit.layerRecordCount, 5, "fixture layer table drifted");
assert.equal(audit.layerLineweightCount, 5, "layer group-370 values must be audited");
assert.deepEqual(
  { thin: audit.layers.LW_THIN, medium: audit.layers.LW_MEDIUM, thick: audit.layers.LW_THICK, block: audit.layers.LW_BLOCK },
  { thin: 13, medium: 35, thick: 70, block: 50 },
  "source layer lineweights changed"
);
assert.equal(audit.entityLineweightValueCount, 6, "entity/block lineweight coverage drifted");
assert.deepEqual(audit.invalidLineweightValues, [], "fixture must not contain invalid lineweights");

const resolve = (value: number, layerName: string, byBlockValue?: number) => resolveDxfLineweightHundredthsMm({
  value,
  layerName,
  layers: audit.layers,
  defaultLineweight: audit.defaultLineweight,
  byBlockValue,
});
assert.equal(resolve(DXF_LINEWEIGHT_BY_LAYER, "LW_THIN"), 13, "BYLAYER thin resolution failed");
assert.equal(resolve(DXF_LINEWEIGHT_BY_LAYER, "LW_THICK"), 70, "BYLAYER thick resolution failed");
assert.equal(resolve(DXF_LINEWEIGHT_BY_BLOCK, "LW_BLOCK", 50), 50, "BYBLOCK INSERT resolution failed");
assert.equal(resolve(DXF_LINEWEIGHT_DEFAULT, "0"), 25, "DEFAULT lineweight resolution failed");
assert.equal(resolve(100, "0"), 100, "explicit entity lineweight resolution failed");

const px13 = lineweightHundredthsMmToCssPixels(13);
const px35 = lineweightHundredthsMmToCssPixels(35);
const px70 = lineweightHundredthsMmToCssPixels(70);
const px100 = lineweightHundredthsMmToCssPixels(100);
assert(px13 >= 1, "thin lineweight must remain visible");
assert(px13 < px35 && px35 < px70 && px70 < px100, "screen-space LWT mapping must preserve source ordering");
assert(px100 <= 9, "screen-space LWT mapping must stay bounded");

assert.match(worker, /auditDxfLineweightSource/);
assert.match(worker, /BatchingKey/);
assert.match(worker, /__dxfLineweightContext/);
assert.match(worker, /lineweightDefault/);
assert.match(runtime, /_LoadBatch/);
assert.match(runtime, /InstancedBufferGeometry/);
assert.match(runtime, /lineWidth/);
assert.match(runtime, /DXF_LINEWEIGHT_READY_EVENT/);
assert.match(ui, /cad-dxf-lineweight-toggle/);
assert.match(ui, /Lineweight: \{enabled \? "Açık" : "Kapalı"\}/);

console.log("DXF source/BYLAYER/BYBLOCK/DEFAULT lineweight runtime checks passed.");
