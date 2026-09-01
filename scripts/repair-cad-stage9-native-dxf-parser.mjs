import { readFileSync, writeFileSync } from "node:fs";

const adapterPath = "src/lib/dokumantasyon/cad-upstream/adapter.ts";
let source = readFileSync(adapterPath, "utf8");

const startMarker = "    // DXF R12 / Flat DXF desteği:";
const endMarker = "    // 2. Dolu Font ve Yüksek Kalite Metin Render Altyapısı";
const nativeMarker = "    // Stage 9: DXF entity parsing stays on MLightCAD's native data-model implementation.";

if (!source.includes(nativeMarker)) {
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker);
  if (start < 0 || end < 0 || end <= start) {
    throw new Error("Stage 9 native DXF parser repair anchors are missing.");
  }

  source =
    source.slice(0, start) +
    nativeMarker + "\n" +
    "    // Release fixtures use valid AC1027 subclass records; mutating AcDbEntity.dxfInFields\n" +
    "    // at runtime can create parser-state/prototype hazards in optimized production bundles.\n\n" +
    source.slice(end);

  writeFileSync(adapterPath, source, "utf8");
  console.log("Stage 9 native MLightCAD DXF parser restored; runtime entity monkeypatch removed.");
} else {
  console.log("Stage 9 native MLightCAD DXF parser already restored.");
}

const finalSource = readFileSync(adapterPath, "utf8");
if (finalSource.includes("dataModel.AcDbEntity.prototype.dxfInFields = function")) {
  throw new Error("Stage 9 native DXF parser repair left the entity parser monkeypatch active.");
}
