import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { detectDxfEncoding } from "../src/lib/dokumantasyon/dxf-encoding";
import { auditDxfText, getDxfStage2BlockingIssues } from "../src/lib/dokumantasyon/dxf-fidelity-audit";
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
  { fixture: "stage3-text-mtext.dxf", expectedStatus: "warning", requiredCategories: ["text"] },
  { fixture: "stage4-geometry-layers.dxf", expectedStatus: "warning", requiredCategories: ["layer", "geometry", "viewport"] },
  { fixture: "stage2-block-transforms.dxf", expectedStatus: "blocked", requiredCategories: ["block", "renderer"] },
  { fixture: "stage2-ocs-insert.dxf", expectedStatus: "blocked", requiredCategories: ["block", "renderer"] },
  { fixture: "stage3-dimensions.dxf", expectedStatus: "blocked", requiredCategories: ["dimension", "renderer"] },
  { fixture: "stage4-risky-geometry.dxf", expectedStatus: "blocked", requiredCategories: ["geometry", "renderer"] },
];

const observed: Array<{ fixture: string; status: ExpectedStatus; warnings: number; blocking: number }> = [];

for (const row of releaseMatrix) {
  const text = await readFile(path.join(fixtureDir, row.fixture), "utf8");
  const bytes = new TextEncoder().encode(text);
  const encoding = detectDxfEncoding(bytes);
  const audit = auditDxfText(text);
  const stage3 = auditDxfStage3(text);
  const stage4 = auditDxfStage4(text);
  const stage2BlockingIssues = getDxfStage2BlockingIssues(audit);
  const stage3BlockingIssues = getDxfStage3BlockingIssues(stage3);
  const stage4BlockingIssues = getDxfStage4BlockingIssues(stage4);
  const report = buildDxfStage5DiagnosticsReport({
    encoding,
    audit,
    stage3,
    stage4,
    stage2BlockingIssues,
    stage3BlockingIssues,
    stage4BlockingIssues,
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
for (const fixture of ["geometry-basic.dxf", "stage3-text-mtext.dxf", "stage4-geometry-layers.dxf", "stage3-dimensions.dxf", "stage4-risky-geometry.dxf"]) {
  assert.match(browserSpec, new RegExp(fixture.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), `browser gate must cover ${fixture}`);
}
assert.match(browserSpec, /cad-dxf-diagnostics-toggle/);
assert.match(browserSpec, /cad-dxf-diagnostics-panel/);
assert.match(browserSpec, /cad-dxf-canvas/);
assert.match(browserSpec, /Orijinal dosyayı indir/);
assert.match(browserSpec, /width:\s*390,\s*height:\s*844/);
assert.match(browserSpec, /page\.screenshot/);

const playwrightConfig = await readFile(path.join(root, "playwright.config.ts"), "utf8");
assert.match(playwrightConfig, /DOK_ALLOW_LOCAL_STORAGE:\s*"true"/);
assert.match(playwrightConfig, /workers:\s*1/);

const stage3Source = await readFile(path.join(root, "src", "lib", "dokumantasyon", "dxf-stage3-fidelity.ts"), "utf8");
assert.match(stage3Source, /record\.section !== "ENTITIES" \|\| record\.type !== "DIMENSION"/);
assert.match(stage3Source, /\(\?<\!\\\\\)\\\\S/);

console.table(observed);
console.log("DXF Stage 6 release matrix and browser-gate contract checks passed.");
