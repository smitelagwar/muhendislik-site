import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";

const root = process.cwd();
const contractPath = resolve(root, "src/lib/dokumantasyon/cad-review/export-contract.ts");
const dialogPath = resolve(root, "src/components/dokumantasyon/preview/cad-export-dialog.tsx");
const ribbonPath = resolve(root, "src/components/dokumantasyon/preview/cad-studio-ribbon.tsx");
const imagePath = resolve(root, "src/lib/dokumantasyon/cad-review/export-image.ts");
const jsonPath = resolve(root, "src/lib/dokumantasyon/cad-review/export-json.ts");

const [dialogSource, ribbonSource, imageSource, jsonSource] = await Promise.all([
  readFile(dialogPath, "utf8"),
  readFile(ribbonPath, "utf8"),
  readFile(imagePath, "utf8"),
  readFile(jsonPath, "utf8"),
]);

for (const text of [
  "İşaretlemeleri DXF Olarak İndir",
  "Ölçüm, yorum, şekil ve eskiz katmanları",
  "Orijinal CAD Dosyasını İndir",
  "PNG · Geçerli Görünüm",
  "PDF · İnceleme Sayfası",
]) {
  assert.ok(dialogSource.includes(text), `Export dialog metni eksik: ${text}`);
}

for (const text of ["Ölçümler", "Yorumlar", "Şekiller", "Serbest çizimler"]) {
  assert.ok(dialogSource.includes(text), `Export filtresi eksik: ${text}`);
}

assert.ok(ribbonSource.includes("İşaretlemeleri DXF Olarak İndir"));
assert.ok(ribbonSource.includes("Orijinal CAD Dosyasını İndir"));
assert.ok(!ribbonSource.includes("Revizyonlu DXF İndir"));
assert.ok(!ribbonSource.includes("Çizim ve review öğeleri"));
assert.ok(ribbonSource.includes("onOpenExportDialog ?? onDownloadDxf"));

assert.ok(dialogSource.includes("normalizeReviewDxfInsunits"));
assert.ok(dialogSource.includes("assertReviewDxfStructure"));
assert.ok(dialogSource.includes("resolveCadSourceUnitContext"));
assert.ok(dialogSource.includes("reviewDxfFileName(sourceFileName)"));
assert.ok(dialogSource.includes("exportCanvasToPdfBlob"));
assert.ok(dialogSource.includes("data-cad-review-overlay"));
assert.ok(imageSource.includes('from "jspdf"'));
assert.ok(imageSource.includes('pdf.output("blob")'));
assert.ok(imageSource.includes('type: "application/pdf"'));
assert.ok(jsonSource.includes('from "./export-contract"'));

// Import the dependency-free Stage 6 contract with Node's TS type stripping.
// This command is deterministic and does not require a browser or deployment.
const contract = await import(pathToFileURL(contractPath).href);

const mk = (type, extra = {}) => ({
  id: `${type}-id`,
  type,
  status: "open",
  ...extra,
});

const fixture = [
  mk("distance"),
  mk("chain_distance"),
  mk("area"),
  mk("comment_pin"),
  mk("text"),
  mk("callout"),
  mk("shape"),
  mk("stroke"),
];

assert.deepEqual(
  contract.filterReviewItems(fixture, {
    includeMeasurements: true,
    includeComments: false,
    includeShapes: false,
    includeSketches: false,
  }).map((item) => item.type),
  ["distance", "chain_distance", "area"]
);
assert.deepEqual(
  contract.filterReviewItems(fixture, {
    includeMeasurements: false,
    includeComments: true,
    includeShapes: false,
    includeSketches: false,
  }).map((item) => item.type),
  ["comment_pin", "text", "callout"]
);
assert.deepEqual(
  contract.filterReviewItems(fixture, {
    includeMeasurements: false,
    includeComments: false,
    includeShapes: true,
    includeSketches: false,
  }).map((item) => item.type),
  ["shape"]
);
assert.deepEqual(
  contract.filterReviewItems(fixture, {
    includeMeasurements: false,
    includeComments: false,
    includeShapes: false,
    includeSketches: true,
  }).map((item) => item.type),
  ["stroke"]
);

assert.equal(contract.reviewDxfFileName("proje.dwg"), "proje_review.dxf");
assert.equal(contract.reviewDxfFileName("proje.dxf"), "proje_review.dxf");
assert.equal(contract.dxfInsunitsCodeForSourceUnit("unitless"), 0);
assert.equal(contract.dxfInsunitsCodeForSourceUnit("mm"), 4);
assert.equal(contract.dxfInsunitsCodeForSourceUnit("cm"), 5);
assert.equal(contract.dxfInsunitsCodeForSourceUnit("m"), 6);

const minimalDxf = [
  "0", "SECTION", "2", "HEADER", "9", "$INSUNITS", "70", "6", "0", "ENDSEC",
  "0", "SECTION", "2", "TABLES", "0", "ENDSEC",
  "0", "SECTION", "2", "BLOCKS", "0", "ENDSEC",
  "0", "SECTION", "2", "ENTITIES", "0", "ENDSEC", "0", "EOF",
].join("\n");

for (const [unit, code] of [["unitless", "0"], ["mm", "4"], ["cm", "5"], ["m", "6"]]) {
  const normalized = contract.normalizeReviewDxfInsunits(minimalDxf, unit);
  assert.ok(normalized.includes(`$INSUNITS\n70\n${code}`), `$INSUNITS ${unit} için yanlış`);
  contract.assertReviewDxfStructure(normalized);
}

assert.throws(() => contract.normalizeReviewDxfInsunits("0\nEOF", "m"), /\$INSUNITS/);
assert.throws(() => contract.assertReviewDxfStructure("0\nEOF"), /group-code|bölümü|satırları/i);

console.log("CAD Stage 6 export contract: PASS");
