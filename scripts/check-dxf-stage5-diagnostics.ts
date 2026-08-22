import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { auditDxfText, getDxfStage2BlockingIssues } from "../src/lib/dokumantasyon/dxf-fidelity-audit";
import { auditDxfStage3, getDxfStage3BlockingIssues } from "../src/lib/dokumantasyon/dxf-stage3-fidelity";
import { auditDxfStage4, getDxfStage4BlockingIssues } from "../src/lib/dokumantasyon/dxf-stage4-fidelity";
import { buildDxfStage5DiagnosticsReport } from "../src/lib/dokumantasyon/dxf-stage5-diagnostics";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const encoding = {
  encoding: "utf-8",
  source: "acad-version" as const,
  acadVersion: "AC1027",
  codePage: null,
  isBinary: false,
  warnings: [],
};

async function reportFor(name: string) {
  const text = await readFile(path.join(root, "tests", "fixtures", "dxf", name), "utf8");
  const audit = auditDxfText(text);
  const stage3 = auditDxfStage3(text);
  const stage4 = auditDxfStage4(text);
  return buildDxfStage5DiagnosticsReport({
    encoding,
    audit,
    stage3,
    stage4,
    stage2BlockingIssues: getDxfStage2BlockingIssues(audit),
    stage3BlockingIssues: getDxfStage3BlockingIssues(stage3),
    stage4BlockingIssues: getDxfStage4BlockingIssues(stage4),
  });
}

const geometryReport = await reportFor("stage4-geometry-layers.dxf");
assert.equal(geometryReport.status, "warning");
assert.equal(geometryReport.blockingCount, 0);
assert.ok(geometryReport.warningCount > 0);
assert.ok(geometryReport.items.some((item) => item.id === "hidden-layers" && item.severity === "info"));
assert.ok(geometryReport.items.some((item) => item.id === "linetype-fallback" && item.category === "geometry"));
assert.ok(geometryReport.items.some((item) => item.id === "polyline-width"));
assert.ok(geometryReport.items.some((item) => item.id === "paper-space"));

const riskyReport = await reportFor("stage4-risky-geometry.dxf");
assert.equal(riskyReport.status, "blocked");
assert.ok(riskyReport.blockingCount > 0);
assert.ok(riskyReport.items.some((item) => item.id === "spline-blocking" && item.severity === "blocking"));
assert.ok(riskyReport.items.some((item) => item.id === "hatch-blocking" && item.severity === "blocking"));

const textReport = await reportFor("stage3-text-mtext.dxf");
assert.equal(textReport.status, "warning");
assert.ok(textReport.items.some((item) => item.id === "text-style-risk" && item.category === "text"));
assert.ok(textReport.items.some((item) => item.id === "mtext-fraction"));

const dimensionReport = await reportFor("stage3-dimensions.dxf");
assert.equal(dimensionReport.status, "blocked");
assert.ok(dimensionReport.items.some((item) => item.id === "dimension-blocking" && item.category === "dimension"));

const viewerSource = await readFile(
  path.join(root, "src", "components", "dokumantasyon", "preview", "cad-viewer.tsx"),
  "utf8"
);
const panelSource = await readFile(
  path.join(root, "src", "components", "dokumantasyon", "preview", "dxf-diagnostics-panel.tsx"),
  "utf8"
);
assert.match(viewerSource, /buildDxfStage5DiagnosticsReport/);
assert.match(viewerSource, /DxfDiagnosticsButton/);
assert.match(viewerSource, /DxfDiagnosticsPanel/);
assert.match(viewerSource, /setDiagnosticsOpen\(true\)/);
assert.match(viewerSource, /Orijinal dosyayı indir/);
assert.doesNotMatch(viewerSource, /cad-dxf-fidelity-warning/);
assert.match(panelSource, /cad-dxf-diagnostics-toggle/);
assert.match(panelSource, /cad-dxf-diagnostics-panel/);
assert.match(panelSource, /max-h-\[38vh\]/);

console.log("DXF Stage 5 structured diagnostics checks passed.");
