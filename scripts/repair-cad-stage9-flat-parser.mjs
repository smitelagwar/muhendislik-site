import { readFileSync, writeFileSync } from "node:fs";

const adapterPath = "src/lib/dokumantasyon/cad-upstream/adapter.ts";
const source = readFileSync(adapterPath, "utf8");

const startMarker = `    // DXF R12 / Flat DXF desteği: 100 AcDbEntity alt sınıf etiketi olmayan DXF'lerde`;
const endMarker = "    // 2. Dolu Font ve Yüksek Kalite Metin Render Altyapısı";
const replacement = `    // Flat/R12 DXF compatibility intentionally stays on the native MLightCAD parser.\n    // A global AcDbEntity.dxfInFields override can consume or stall the DXF filer cursor\n    // before entity-specific fields are parsed, leaving openDocument() in parse-convert.\n    // Stage 9 release smoke covers flat LINE DXF plus the full CAD Preview V2 matrix.\n\n`;

if (source.includes(replacement.trim())) {
  console.log("Stage 9 native flat DXF parser repair already applied.");
  process.exit(0);
}

const start = source.indexOf(startMarker);
const end = source.indexOf(endMarker, start + startMarker.length);
if (start < 0 || end < 0 || end <= start) {
  throw new Error("Stage 9 flat DXF parser override block not found; adapter changed unexpectedly.");
}

const block = source.slice(start, end);
if (!block.includes("dataModel.AcDbEntity?.prototype?.dxfInFields") || !block.includes("origEntityDxfIn")) {
  throw new Error("Refusing parser repair: target block does not contain the expected AcDbEntity override.");
}

writeFileSync(adapterPath, source.slice(0, start) + replacement + source.slice(end), "utf8");
console.log("Stage 9 global AcDbEntity DXF override removed; native parser retained.");
