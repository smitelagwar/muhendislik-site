import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { auditDxfText, getDxfStage2BlockingIssues } from "../src/lib/dokumantasyon/dxf-fidelity-audit";
import {
  auditDxfReleaseHardening,
  getDxfReleaseHardeningBlockingIssues,
} from "../src/lib/dokumantasyon/dxf-release-hardening";
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
  const releaseHardening = auditDxfReleaseHardening(text);
  return buildDxfStage5DiagnosticsReport({
    encoding,
    audit,
    stage3,
    stage4,
    releaseHardening,
    stage2BlockingIssues: getDxfStage2BlockingIssues(audit),
    stage3BlockingIssues: getDxfStage3BlockingIssues(stage3),
    stage4BlockingIssues: getDxfStage4BlockingIssues(stage4),
    releaseHardeningBlockingIssues: getDxfReleaseHardeningBlockingIssues(releaseHardening),
  });
}

async function main() {
  const geometryReport = await reportFor("stage4-geometry-layers.dxf");
  assert.equal(geometryReport.status, "clean");
  assert.equal(geometryReport.blockingCount, 0);
  assert.equal(geometryReport.warningCount, 0);
  assert.ok(geometryReport.items.some((item) => item.id === "hidden-layers" && item.severity === "info"));
  assert.ok(!geometryReport.items.some((item) => item.id === "linetype-fallback"));
  assert.ok(!geometryReport.items.some((item) => item.id === "polyline-width"));
  assert.ok(geometryReport.items.some((item) => item.id === "paper-space"));

  const wideReport = await reportFor("stage3-wide-polylines.dxf");
  assert.equal(wideReport.status, "clean");
  assert.equal(wideReport.blockingCount, 0);
  assert.equal(wideReport.warningCount, 0);
  assert.ok(!wideReport.items.some((item) => item.id === "linetype-fallback" || item.id === "polyline-width"));
  assert.ok(!wideReport.items.some((item) => item.id === "polyline-width-invalid"));

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

  const unsupportedReport = await reportFor("unsupported-annotations.dxf");
  assert.equal(unsupportedReport.status, "blocked");
  assert.ok(unsupportedReport.items.some((item) => item.id === "unsupported-entities" && item.severity === "blocking"));

  const missingBlockReport = await reportFor("missing-block-only.dxf");
  assert.equal(missingBlockReport.status, "blocked");
  assert.ok(missingBlockReport.items.some((item) => item.id === "missing-blocks" && item.severity === "blocking"));

  const ocsReport = await reportFor("ocs-arc-circle.dxf");
  assert.equal(ocsReport.status, "blocked");
  assert.ok(ocsReport.items.some((item) => item.id === "ocs-hardening" && item.severity === "blocking"));

  const suppressedUnsupportedReport = await reportFor("suppressed-unsupported.dxf");
  assert.equal(suppressedUnsupportedReport.status, "clean");
  assert.equal(suppressedUnsupportedReport.blockingCount, 0);
  assert.equal(suppressedUnsupportedReport.warningCount, 0);
  assert.ok(suppressedUnsupportedReport.items.some((item) => item.id === "unsupported-entities-suppressed" && item.severity === "info"));

  const viewerSource = await readFile(
    path.join(root, "src", "components", "dokumantasyon", "preview", "cad-viewer.tsx"),
    "utf8"
  );
  const panelSource = await readFile(
    path.join(root, "src", "components", "dokumantasyon", "preview", "dxf-diagnostics-panel.tsx"),
    "utf8"
  );
  assert.match(viewerSource, /buildDxfStage5DiagnosticsReport/);
  assert.match(viewerSource, /auditDxfReleaseHardening\(dxfText\)/);
  assert.match(viewerSource, /DxfDiagnosticsButton/);
  assert.match(viewerSource, /DxfDiagnosticsPanel/);
  assert.match(viewerSource, /setDiagnosticsOpen\(true\)/);
  assert.match(viewerSource, /Orijinal dosyayı indir/);
  assert.match(viewerSource, /cad-dxf-runtime-snapshot/);
  assert.doesNotMatch(viewerSource, /cad-dxf-fidelity-warning/);

  assert.match(panelSource, /const showDiagnostics = report\.status !== "clean"/);
  assert.match(panelSource, /cad-dxf-diagnostics-toggle/);
  assert.match(panelSource, /data-status=\{report\.status\}/);
  assert.match(panelSource, /cad-dxf-diagnostics-panel/);
  assert.match(panelSource, /fixed right-2 top-24/);
  assert.match(panelSource, /max-h-\[60vh\]/);
  assert.match(panelSource, /item\.severity !== "info"/);
  assert.match(panelSource, /Teknik bilgiler/);
  assert.doesNotMatch(panelSource, /Denetim temiz/);
  assert.doesNotMatch(panelSource, /SummaryCell/);

  console.log("DXF Stage 5 structured diagnostics checks passed.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
