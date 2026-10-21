import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import type { CadCanonicalDocument, CadLineEntity } from "../../src/lib/cad-v2/canonical/types";
import { modelSpaceViewBoundsFromExtents, resolveModelSpaceViewBounds } from "../../src/lib/cad-v2/canonical/model-space-view-bounds";
import { compileCanonicalToScene } from "../../src/lib/cad-v2/compile/scene-compiler";
import { parseDwgToCanonical } from "../../src/lib/cad-v2/decode/dwg-adapter";
import { parseDxfModelSpaceViewBounds } from "../../src/lib/cad-v2/decode/dxf-model-space-view-bounds";

const nativeViewBounds = [0, 0, 1_000, 1_000] as const;
const document = {
  sourceVersionKey: "native-model-space-view-bounds-v1",
  sourceSha256: "native-model-space-view-bounds-fixture",
  acadVersion: "AC1032",
  codepage: "ANSI_1254",
  units: 4,
  measurement: 1,
  layers: {
    "0": {
      id: "0", name: "0", visible: true, frozen: false, locked: false,
      color: { method: "aci", aci: 7 }, lineweightMm: 0, linetypeName: "Continuous",
    },
  },
  linetypes: {},
  textStyles: {},
  blocks: {},
  layouts: {},
  viewports: {},
  paperSpaceEntities: {},
  diagnostics: [],
  modelSpaceViewBounds: nativeViewBounds,
  modelSpaceEntities: [
    { type: "LINE", handle: "IN_EXTENTS", layer: "0", order: 1n, start: [100, 100], end: [900, 900] },
    { type: "LINE", handle: "OUTSIDE_NATIVE_EXTENTS", layer: "0", order: 2n, start: [-300_000, 250_000], end: [-299_900, 250_100] },
  ] as CadLineEntity[],
} as unknown as CadCanonicalDocument;

const compiled = compileCanonicalToScene(document, {
  sceneId: "scene_native_model_space_view_bounds",
  layoutId: "Model",
  maxPrimitivesPerChunk: 1,
});

async function main() {
  assert.deepEqual(modelSpaceViewBoundsFromExtents(
    { x: 0, y: -10, z: Number.POSITIVE_INFINITY },
    { x: 1_000, y: 10, z: Number.NEGATIVE_INFINITY },
  ), [0, -10, 1_000, 10], "valid XY native extents remain usable despite unrelated invalid Z coordinates");
  assert.equal(modelSpaceViewBoundsFromExtents({ x: 10, y: 0 }, { x: 0, y: 10 }), undefined,
    "reversed native extents are rejected");
  assert.deepEqual(resolveModelSpaceViewBounds([2_000, 2_000, 3_000, 3_000], [-300_000, 100, 900, 250_100]),
    [-300_000, 100, 900, 250_100], "nonoverlapping stale source extents fall back to compiled geometry");

  assert.deepEqual(compiled.manifest.layouts[0]?.bbox, nativeViewBounds,
    "Model layout fit bounds prefer validated source native extents over parser-expanded block outliers");
  const chunkBounds = compiled.manifest.chunks.map((chunk) => chunk.bbox);
  assert.equal(Math.min(...chunkBounds.map((bbox) => bbox[0])), -300_000,
    "using native view bounds must preserve remote geometry in independently addressable chunks");
  assert.equal(Math.max(...chunkBounds.map((bbox) => bbox[2])), 900,
    "chunk metadata keeps the source geometry maximum rather than clipping it to the native view");

  const dxfHeader = [
    "0", "SECTION", "2", "HEADER", "9", "$EXTMIN", "10", "0", "20", "-10", "30", "0",
    "9", "$EXTMAX", "10", "1000", "20", "10", "30", "0", "0", "ENDSEC", "0", "EOF", "",
  ].join("\n");
  assert.deepEqual(await parseDxfModelSpaceViewBounds(Buffer.from(dxfHeader, "ascii")), [0, -10, 1_000, 10],
    "DXF $EXTMIN/$EXTMAX are retained as Model fit bounds");

  const r003Path = path.join(process.cwd(), "eklediklerim", "ornek_dosyalar", "MUSTAFA SELVİ 1.KISIM STATİK.dwg");
  const r003Bytes = fs.readFileSync(r003Path);
  assert.equal(createHash("sha256").update(r003Bytes).digest("hex"),
    "8ff5680fa4f9d570fed738def92bc6ca8149fde1b5aed9e0a495dd2baaf521e6",
    "native-extents integration fixture is the verified R003 source");
  const r003 = await parseDwgToCanonical(r003Bytes, {
    sourceVersionKey: "r003-native-model-space-view-bounds",
    sourceSha256: "8ff5680fa4f9d570fed738def92bc6ca8149fde1b5aed9e0a495dd2baaf521e6",
  });
  assert.deepEqual(r003.modelSpaceViewBounds, [
    2231.426023350486,
    -3593.400889016325,
    85269.23521938325,
    5868.745600167706,
  ], "R003 DWG adapter forwards its native 2D model extents and ignores the malformed Z range");
  assert.ok(r003.modelSpaceEntities.some((entity) => entity.type === "INSERT" && entity.insertionPoint[0] < -100_000),
    "R003 source entities outside native initial extents remain in canonical data");

  console.log("native model-space view bounds regression: PASS");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
