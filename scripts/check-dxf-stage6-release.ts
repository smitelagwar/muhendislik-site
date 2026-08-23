import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { detectDxfEncoding } from "../src/lib/dokumantasyon/dxf-encoding";
import { auditDxfText, getDxfStage2BlockingIssues } from "../src/lib/dokumantasyon/dxf-fidelity-audit";
import {
  auditDxfLinetypeSource,
  collectDxfSimpleLinetypes,
  enrichParsedDxfLinetypes,
  expandDxfSimpleLinetypePath,
  resolveDxfLinetypeScale,
  type DxfLinetypeParsedDxf,
} from "../src/lib/dokumantasyon/dxf-linetype-rendering";
import {
  auditDxfReleaseHardening,
  getDxfReleaseHardeningBlockingIssues,
} from "../src/lib/dokumantasyon/dxf-release-hardening";
import { auditDxfStage3, getDxfStage3BlockingIssues } from "../src/lib/dokumantasyon/dxf-stage3-fidelity";
import { auditDxfStage4, getDxfStage4BlockingIssues } from "../src/lib/dokumantasyon/dxf-stage4-fidelity";
import { buildDxfStage5DiagnosticsReport, type DxfDiagnosticCategory } from "../src/lib/dokumantasyon/dxf-stage5-diagnostics";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const fixtureDir = path.join(root, "tests", "fixtures", "dxf");

type ExpectedStatus = "clean" | "warning" | "blocked";
type MatrixRow = {
  fixture: string;
  expectedStatus: ExpectedStatus;
  requiredCategories?: DxfDiagnosticCategory[];
};

const releaseMatrix: MatrixRow[] = [
  { fixture: "geometry-basic.dxf", expectedStatus: "clean" },
  { fixture: "stage7-large-coordinate-bulge.dxf", expectedStatus: "clean" },
  { fixture: "stage7-bulge-signs.dxf", expectedStatus: "clean" },
  { fixture: "stage7-color-hatch.dxf", expectedStatus: "clean" },
  { fixture: "suppressed-unsupported.dxf", expectedStatus: "clean", requiredCategories: ["structure", "layer"] },
  { fixture: "stage3-text-mtext.dxf", expectedStatus: "warning", requiredCategories: ["text"] },
  { fixture: "stage4-geometry-layers.dxf", expectedStatus: "clean", requiredCategories: ["layer", "viewport"] },
  { fixture: "stage3-wide-polylines.dxf", expectedStatus: "clean" },
  { fixture: "unsupported-annotations.dxf", expectedStatus: "blocked", requiredCategories: ["structure", "renderer"] },
  { fixture: "missing-block-only.dxf", expectedStatus: "blocked", requiredCategories: ["block", "renderer"] },
  { fixture: "ocs-arc-circle.dxf", expectedStatus: "blocked", requiredCategories: ["geometry", "renderer"] },
  { fixture: "stage2-block-transforms.dxf", expectedStatus: "blocked", requiredCategories: ["block", "renderer"] },
  { fixture: "stage2-ocs-insert.dxf", expectedStatus: "blocked", requiredCategories: ["geometry", "renderer"] },
  { fixture: "stage3-dimensions.dxf", expectedStatus: "blocked", requiredCategories: ["dimension", "renderer"] },
  { fixture: "stage4-risky-geometry.dxf", expectedStatus: "blocked", requiredCategories: ["geometry", "renderer"] },
];

function checkCadStage2LinetypeContract(): void {
  const source = [
    "0", "SECTION", "2", "HEADER", "9", "$LTSCALE", "40", "2", "0", "ENDSEC",
    "0", "SECTION", "2", "TABLES", "0", "TABLE", "2", "LAYER", "70", "2",
    "0", "LAYER", "2", "0", "70", "0", "62", "7", "6", "CONTINUOUS",
    "0", "LAYER", "2", "AKS", "70", "0", "62", "1", "6", "CENTER",
    "0", "ENDTAB", "0", "ENDSEC", "0", "EOF",
  ].join("\n");
  const sourceAudit = auditDxfLinetypeSource(source);
  assert.equal(sourceAudit.globalScale, 2);
  assert.equal(sourceAudit.layers.AKS, "CENTER");
  assert.equal(resolveDxfLinetypeScale(sourceAudit.globalScale, 0.5), 1);

  const parsed: DxfLinetypeParsedDxf = {
    tables: {
      layer: { layers: { "0": { name: "0" }, AKS: { name: "AKS" } } },
      lineType: {
        lineTypes: {
          CONTINUOUS: { name: "CONTINUOUS", pattern: [] },
          DASHED: { name: "DASHED", pattern: [6, -3], patternLength: 9 },
          CENTER: { name: "CENTER", pattern: [12, -3, 3, -3], patternLength: 21 },
          HIDDEN: { name: "HIDDEN", pattern: [4, -2], patternLength: 6 },
        },
      },
    },
  };
  enrichParsedDxfLinetypes(parsed, sourceAudit);
  assert.equal(parsed.tables?.layer?.layers?.AKS.lineType, "CENTER");
  const definitions = collectDxfSimpleLinetypes(parsed);
  assert.deepEqual(definitions.DASHED.pattern, [6, -3]);
  assert.deepEqual(definitions.CENTER.pattern, [12, -3, 3, -3]);
  assert.deepEqual(definitions.HIDDEN.pattern, [4, -2]);

  const expanded = expandDxfSimpleLinetypePath({
    vertices: [{ x: 0, y: 0 }, { x: 8, y: 0 }, { x: 20, y: 0 }],
    pattern: [6, -3],
  });
  const ranges = [] as Array<[number, number]>;
  for (let index = 0; index + 1 < expanded.lineVertices.length; index += 2) {
    ranges.push([expanded.lineVertices[index].x, expanded.lineVertices[index + 1].x]);
  }
  assert.deepEqual(ranges, [[0, 6], [9, 15], [18, 20]], "linetype phase must continue across polyline vertices");
}

async function main() {
  checkCadStage2LinetypeContract();
  const observed: Array<{ fixture: string; status: ExpectedStatus; warnings: number; blocking: number }> = [];

  for (const row of releaseMatrix) {
    const text = await readFile(path.join(fixtureDir, row.fixture), "utf8");
    const bytes = new TextEncoder().encode(text);
    const encoding = detectDxfEncoding(bytes);
    const audit = auditDxfText(text);
    const stage3 = auditDxfStage3(text);
    const stage4 = auditDxfStage4(text);
    const releaseHardening = auditDxfReleaseHardening(text);
    const stage2BlockingIssues = getDxfStage2BlockingIssues(audit);
    const stage3BlockingIssues = getDxfStage3BlockingIssues(stage3);
    const stage4BlockingIssues = getDxfStage4BlockingIssues(stage4);
    const releaseHardeningBlockingIssues = getDxfReleaseHardeningBlockingIssues(releaseHardening);
    const report = buildDxfStage5DiagnosticsReport({
      encoding,
      audit,
      stage3,
      stage4,
      releaseHardening,
      stage2BlockingIssues,
      stage3BlockingIssues,
      stage4BlockingIssues,
      releaseHardeningBlockingIssues,
    });

    assert.equal(report.status, row.expectedStatus, `${row.fixture} release status changed`);
    if (row.expectedStatus === "blocked") {
      assert.ok(report.blockingCount > 0, `${row.fixture} must fail closed`);
    } else {
      assert.equal(report.blockingCount, 0, `${row.fixture} must remain renderable`);
    }

    for (const category of row.requiredCategories ?? []) {
      assert.ok(report.items.some((item) => item.category === category), `${row.fixture} must expose ${category} diagnostics`);
    }

    observed.push({
      fixture: row.fixture,
      status: report.status,
      warnings: report.warningCount,
      blocking: report.blockingCount,
    });
  }

  const browserSpec = await readFile(path.join(root, "tests", "document-studio", "dxf-release.spec.ts"), "utf8");
  for (const fixture of [
    "geometry-basic.dxf",
    "stage7-large-coordinate-bulge.dxf",
    "stage7-bulge-signs.dxf",
    "stage7-color-hatch.dxf",
    "stage3-text-mtext.dxf",
    "stage4-geometry-layers.dxf",
    "unsupported-annotations.dxf",
    "missing-block-only.dxf",
    "ocs-arc-circle.dxf",
    "stage3-dimensions.dxf",
    "stage4-risky-geometry.dxf",
  ]) {
    assert.match(browserSpec, new RegExp(fixture.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), `browser gate must cover ${fixture}`);
  }
  assert.match(browserSpec, /cad-dxf-diagnostics-toggle/);
  assert.match(browserSpec, /cad-dxf-diagnostics-panel/);
  assert.match(browserSpec, /cad-dxf-canvas/);
  assert.match(browserSpec, /cad-dxf-runtime-snapshot/);
  assert.match(browserSpec, /Orijinal dosyayı indir/);
  assert.match(browserSpec, /width:\s*390,\s*height:\s*844/);
  assert.match(browserSpec, /page\.screenshot/);
  assert.match(browserSpec, /foreground/i);

  const workerSource = await readFile(
    path.join(root, "src", "components", "dokumantasyon", "preview", "dxf-viewer-worker.ts"),
    "utf8"
  );
  assert.match(workerSource, /scenePrototype\._GetLineType = function/);
  assert.match(workerSource, /scenePrototype\._ProcessLineSegments = function/);
  assert.match(workerSource, /scenePrototype\._ProcessPolyline = function/);
  assert.match(workerSource, /expandDxfSimpleLinetypePath/);
  assert.match(workerSource, /DXF_LINETYPE_MAX_RENDER_PRIMITIVES/);
  assert.match(workerSource, /normalizeParsedDxfWidePolylines/);
  assert.match(workerSource, /polylineWidthRenderAudit/);

  const playwrightConfig = await readFile(path.join(root, "playwright.config.ts"), "utf8");
  assert.match(playwrightConfig, /DOK_ALLOW_LOCAL_STORAGE:\s*"true"/);
  assert.match(playwrightConfig, /workers:\s*1/);

  const stage3Source = await readFile(path.join(root, "src", "lib", "dokumantasyon", "dxf-stage3-fidelity.ts"), "utf8");
  assert.match(stage3Source, /record\.section !== "ENTITIES" \|\| record\.type !== "DIMENSION"/);
  assert.match(stage3Source, /\(\?<\!\\\\\)\\\\S/);

  console.table(observed);
  console.log("DXF Stage 6 release matrix, CAD Stage 2 linetype contract and browser-gate checks passed.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});