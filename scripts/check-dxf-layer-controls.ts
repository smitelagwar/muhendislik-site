import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildDxfLayerRuntimeSnapshot,
  fitVisibleDxfLayers,
  initializeDxfLayerRuntime,
  normalizeDxfLayersForInteractiveControl,
  resetDxfLayersToSource,
  setAllDxfLayersVisible,
  setDxfLayerVisible,
  type DxfLayerRuntimeViewer,
} from "../src/lib/dokumantasyon/dxf-layer-runtime";
import { auditDxfStage4, normalizeDxfForStage4Rendering } from "../src/lib/dokumantasyon/dxf-stage4-fidelity";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function position(points: Array<[number, number]>) {
  return {
    count: points.length,
    getX: (index: number) => points[index][0],
    getY: (index: number) => points[index][1],
  };
}

async function main() {
  const fixture = await readFile(path.join(root, "tests", "fixtures", "dxf", "stage4-layer-interaction.dxf"), "utf8");
  const sourceAudit = auditDxfStage4(fixture);
  assert.deepEqual(sourceAudit.activeLayers, ["0", "ACTIVE_B"]);
  assert.deepEqual(sourceAudit.offLayers, ["OFF_LAYER"]);
  assert.deepEqual(sourceAudit.frozenLayers, ["FROZEN_LAYER"]);
  assert.equal(sourceAudit.visibleModelSpaceGeometryCount, 2);

  const stage4 = normalizeDxfForStage4Rendering(fixture);
  assert.equal(stage4.offLayersFrozenForRendering, 1);
  const interactive = normalizeDxfLayersForInteractiveControl(stage4.text);
  assert.equal(interactive.unfrozenLayerCount, 2, "source frozen + normalized off layer should both enter interactive scene");
  const renderAudit = auditDxfStage4(interactive.text);
  assert.deepEqual(renderAudit.offLayers, ["OFF_LAYER"], "negative source color must remain traceable");
  assert.deepEqual(renderAudit.frozenLayers, [], "interactive render copy must retain frozen geometry in scene");

  let renderCount = 0;
  let fitArgs: Array<number | undefined> | null = null;
  const internalLayers = new Map([
    ["0", { objects: [{ visible: true, geometry: { attributes: { position: position([[0, 0], [100, 0]]) } } }] }],
    ["ACTIVE_B", { objects: [{ visible: true, geometry: { attributes: { position: position([[0, 50], [100, 50]]) } } }] }],
    ["OFF_LAYER", { objects: [{ visible: true, geometry: { attributes: { position: position([[1000, 0], [1100, 0]]) } } }] }],
    ["FROZEN_LAYER", { objects: [{ visible: true, geometry: { attributes: { position: position([[-1000, 0], [-900, 0]]) } } }] }],
  ]);
  const viewer: DxfLayerRuntimeViewer = {
    layers: internalLayers,
    GetLayers: () => [
      { name: "0", displayName: "0", color: 0xffffff },
      { name: "ACTIVE_B", displayName: "ACTIVE_B", color: 0xff00ff },
      { name: "OFF_LAYER", displayName: "OFF_LAYER", color: 0xff0000 },
      { name: "FROZEN_LAYER", displayName: "FROZEN_LAYER", color: 0x00ff00 },
    ],
    ShowLayer: (name, show) => {
      for (const object of internalLayers.get(name)?.objects ?? []) object.visible = show;
      renderCount += 1;
    },
    Render: () => {
      renderCount += 1;
    },
    FitView: (...args) => {
      fitArgs = args;
    },
  };

  let layers = initializeDxfLayerRuntime(viewer, sourceAudit);
  assert.equal(renderCount, 1, "initial source visibility should batch into one render");
  let snapshot = buildDxfLayerRuntimeSnapshot(layers);
  assert.deepEqual(snapshot.visibleLayerNames, ["0", "ACTIVE_B"]);
  assert.deepEqual(snapshot.hiddenLayerNames, ["FROZEN_LAYER", "OFF_LAYER"]);
  assert.deepEqual(snapshot.visibleBounds, { minX: 0, maxX: 100, minY: 0, maxY: 50 });

  layers = setDxfLayerVisible(viewer, layers, "OFF_LAYER", true);
  snapshot = buildDxfLayerRuntimeSnapshot(layers);
  assert.deepEqual(snapshot.visibleBounds, { minX: 0, maxX: 1100, minY: 0, maxY: 50 });
  const fitted = fitVisibleDxfLayers(viewer, layers, 0.1);
  assert.deepEqual(fitted, snapshot.visibleBounds);
  assert.deepEqual(fitArgs, [0, 1100, 0, 50, 0.1]);

  layers = setDxfLayerVisible(viewer, layers, "FROZEN_LAYER", true);
  snapshot = buildDxfLayerRuntimeSnapshot(layers);
  assert.deepEqual(snapshot.visibleBounds, { minX: -1000, maxX: 1100, minY: 0, maxY: 50 });

  layers = setAllDxfLayersVisible(viewer, layers, false);
  snapshot = buildDxfLayerRuntimeSnapshot(layers);
  assert.equal(snapshot.allHidden, true);
  assert.equal(snapshot.visibleBounds, null);

  layers = resetDxfLayersToSource(viewer, layers);
  snapshot = buildDxfLayerRuntimeSnapshot(layers);
  assert.deepEqual(snapshot.visibleLayerNames, ["0", "ACTIVE_B"]);
  assert.deepEqual(snapshot.visibleBounds, { minX: 0, maxX: 100, minY: 0, maxY: 50 });

  const viewerSource = await readFile(
    path.join(root, "src", "components", "dokumantasyon", "preview", "cad-viewer.tsx"),
    "utf8"
  );
  assert.match(viewerSource, /normalizeDxfLayersForInteractiveControl\(stage4Normalization\.text\)/);
  assert.match(viewerSource, /initializeDxfLayerRuntime\(viewer, stage4Audit\)/);
  assert.match(viewerSource, /fitVisibleDxfLayers/);
  assert.match(viewerSource, /cad-dxf-layer-snapshot/);
  assert.match(viewerSource, /label="Katmanlar"/);

  console.log("DXF interactive layer runtime checks passed.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
