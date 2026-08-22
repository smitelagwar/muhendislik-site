import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  auditDxfStage4,
  getDxfStage4BlockingIssues,
  getDxfStage4Warnings,
  normalizeDxfForStage4Rendering,
  validateDxfStage4ViewerSnapshot,
} from "../src/lib/dokumantasyon/dxf-stage4-fidelity";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

async function readFixture(name: string) {
  return readFile(path.join(root, "tests", "fixtures", "dxf", name), "utf8");
}

async function main() {
  const geometryFixture = await readFixture("stage4-geometry-layers.dxf");
  const geometryAudit = auditDxfStage4(geometryFixture);
  assert.equal(geometryAudit.layerDefinitionCount, 5);
  assert.equal(geometryAudit.activeLayerCount, 3);
  assert.deepEqual(geometryAudit.activeLayers, ["0", "DASH_LAYER", "LOCKED"]);
  assert.equal(geometryAudit.offLayerCount, 1);
  assert.deepEqual(geometryAudit.offLayers, ["OFF_LAYER"]);
  assert.equal(geometryAudit.frozenLayerCount, 1);
  assert.deepEqual(geometryAudit.frozenLayers, ["FROZEN"]);
  assert.equal(geometryAudit.lockedLayerCount, 1);
  assert.equal(geometryAudit.missingLayerReferenceCount, 0);
  assert.equal(geometryAudit.nonContinuousLinetypeEntityCount, 1);
  assert.deepEqual(geometryAudit.nonContinuousLinetypes, ["DASHED"]);
  assert.equal(geometryAudit.bulgedPolylineCount, 1);
  assert.equal(geometryAudit.widthPolylineCount, 1);
  assert.equal(geometryAudit.splineCount, 1);
  assert.equal(geometryAudit.fitPointOnlySplineCount, 0);
  assert.equal(geometryAudit.weightedSplineCount, 0);
  assert.equal(geometryAudit.closedOrPeriodicSplineCount, 0);
  assert.equal(geometryAudit.nonDefaultOcsSplineCount, 0);
  assert.equal(geometryAudit.malformedSplineCount, 0);
  assert.equal(geometryAudit.hatchCount, 1);
  assert.equal(geometryAudit.patternedHatchCount, 0);
  assert.equal(geometryAudit.gradientHatchCount, 0);
  assert.equal(geometryAudit.emptyBoundaryHatchCount, 0);
  assert.equal(geometryAudit.unsupportedHatchEdgeTypeCount, 0);
  assert.equal(geometryAudit.degenerateCurveCount, 0);
  assert.equal(geometryAudit.modelSpaceGeometryCount, 7);
  assert.equal(geometryAudit.visibleModelSpaceGeometryCount, 5);
  assert.equal(geometryAudit.paperSpaceGeometryCount, 1);
  assert.equal(getDxfStage4BlockingIssues(geometryAudit).length, 0);

  const geometryWarnings = getDxfStage4Warnings(geometryAudit).join("\n");
  assert.match(geometryWarnings, /OFF_LAYER/);
  assert.match(geometryWarnings, /frozen layer/i);
  assert.match(geometryWarnings, /DASHED/);
  assert.match(geometryWarnings, /polyline width/);
  assert.match(geometryWarnings, /paper-space/);

  const normalized = normalizeDxfForStage4Rendering(geometryFixture);
  assert.equal(normalized.offLayersFrozenForRendering, 1);
  const normalizedAudit = auditDxfStage4(normalized.text);
  assert.equal(normalizedAudit.offLayerCount, 1);
  assert.equal(normalizedAudit.frozenLayerCount, 2);
  assert.deepEqual(normalizedAudit.frozenLayers, ["FROZEN", "OFF_LAYER"]);
  assert.equal(normalizedAudit.activeLayerCount, 3);

  const validViewer = validateDxfStage4ViewerSnapshot(geometryAudit, {
    viewport: { width: 1000, height: 500 },
    bounds: { minX: 0, maxX: 100, minY: 0, maxY: 80 },
    origin: { x: 0, y: 0 },
    camera: {
      left: -88,
      right: 88,
      top: 44,
      bottom: -44,
      zoom: 1,
      position: { x: 50, y: 40, z: 1 },
    },
    layers: ["0", "DASH_LAYER", "LOCKED"],
  });
  assert.deepEqual(validViewer.blockingIssues, []);
  assert.deepEqual(validViewer.warnings, []);

  const invalidViewer = validateDxfStage4ViewerSnapshot(geometryAudit, {
    viewport: { width: 1000, height: 500 },
    bounds: { minX: 0, maxX: 100, minY: 0, maxY: 80 },
    origin: { x: 0, y: 0 },
    camera: {
      left: -50,
      right: 50,
      top: 25,
      bottom: -25,
      zoom: 1,
      position: { x: 0, y: 0, z: 1 },
    },
    layers: ["0", "DASH_LAYER"],
  });
  assert.match(invalidViewer.blockingIssues.join("\n"), /kamera merkezi/);
  assert.match(invalidViewer.blockingIssues.join("\n"), /Aktif DXF layer/);

  const riskyFixture = await readFixture("stage4-risky-geometry.dxf");
  const riskyAudit = auditDxfStage4(riskyFixture);
  assert.equal(riskyAudit.splineCount, 5);
  assert.equal(riskyAudit.fitPointOnlySplineCount, 1);
  assert.equal(riskyAudit.weightedSplineCount, 1);
  assert.equal(riskyAudit.closedOrPeriodicSplineCount, 1);
  assert.equal(riskyAudit.nonDefaultOcsSplineCount, 1);
  assert.equal(riskyAudit.malformedSplineCount, 1);
  assert.equal(riskyAudit.hatchCount, 3);
  assert.equal(riskyAudit.patternedHatchCount, 2);
  assert.equal(riskyAudit.gradientHatchCount, 1);
  assert.equal(riskyAudit.emptyBoundaryHatchCount, 1);
  assert.equal(riskyAudit.unsupportedHatchEdgeTypeCount, 1);
  assert.equal(riskyAudit.modelSpaceGeometryCount, 8);
  assert.equal(riskyAudit.visibleModelSpaceGeometryCount, 8);

  const riskyBlocking = getDxfStage4BlockingIssues(riskyAudit).join("\n");
  assert.match(riskyBlocking, /fit-point/);
  assert.match(riskyBlocking, /weighted\/rational/);
  assert.match(riskyBlocking, /closed\/periodic/);
  assert.match(riskyBlocking, /SPLINE non-default extrusion\/OCS/);
  assert.match(riskyBlocking, /control-point\/degree\/knot/);
  assert.match(riskyBlocking, /gradient HATCH/);
  assert.match(riskyBlocking, /HATCH boundary/);

  const viewerSource = await readFile(
    path.join(root, "src", "components", "dokumantasyon", "preview", "cad-viewer.tsx"),
    "utf8"
  );
  assert.match(viewerSource, /auditDxfStage4\(dxfText\)/);
  assert.match(viewerSource, /normalizeDxfForStage4Rendering\(stage3Normalization\.text\)/);
  assert.match(viewerSource, /getDxfStage4BlockingIssues\(stage4Audit\)/);
  assert.match(viewerSource, /suppressPaperSpace:\s*true/);
  assert.match(viewerSource, /renderContainer\.clientWidth < 2/);
  assert.match(viewerSource, /validateDxfStage4ViewerSnapshot\(stage4Audit/);
  assert.match(viewerSource, /GetCamera/);
  assert.match(viewerSource, /GetLayers/);
  assert.match(viewerSource, /new Blob\(\[stage4Normalization\.text\]/);

  console.log("DXF Stage 4 geometry/layer/bounds/viewport fidelity checks passed.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
