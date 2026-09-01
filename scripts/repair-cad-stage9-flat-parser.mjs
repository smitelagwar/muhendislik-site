import { readFileSync, writeFileSync } from "node:fs";

const adapterPath = "src/lib/dokumantasyon/cad-upstream/adapter.ts";
let source = readFileSync(adapterPath, "utf8");
let changed = false;

const startMarker = `    // DXF R12 / Flat DXF desteği: 100 AcDbEntity alt sınıf etiketi olmayan DXF'lerde`;
const endMarker = "    // 2. Dolu Font ve Yüksek Kalite Metin Render Altyapısı";
const parserReplacement = `    // Flat/R12 DXF compatibility intentionally stays on the native MLightCAD parser.\n    // A global AcDbEntity.dxfInFields override can consume or stall the DXF filer cursor\n    // before entity-specific fields are parsed, leaving openDocument() in parse-convert.\n\n`;

if (!source.includes(parserReplacement.trim())) {
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker, start + startMarker.length);
  if (start < 0 || end < 0 || end <= start) {
    throw new Error("Stage 9 flat DXF parser override block not found; adapter changed unexpectedly.");
  }
  const block = source.slice(start, end);
  if (!block.includes("dataModel.AcDbEntity?.prototype?.dxfInFields") || !block.includes("origEntityDxfIn")) {
    throw new Error("Refusing parser repair: target block does not contain the expected AcDbEntity override.");
  }
  source = source.slice(0, start) + parserReplacement + source.slice(end);
  changed = true;
}

const enhancedLoader = `    viewerModulePromise = import("@mlightcad/cad-simple-viewer")\n      .then(async (Viewer) => {\n        await initializeCadEngineEnhancements(Viewer);\n        return Viewer;\n      })\n      .catch((error) => {`;
const nativeLoader = `    viewerModulePromise = import("@mlightcad/cad-simple-viewer").catch((error) => {`;

if (source.includes(enhancedLoader)) {
  source = source.replace(enhancedLoader, nativeLoader);
  changed = true;
} else if (!source.includes(nativeLoader)) {
  throw new Error("Stage 9 viewer loader repair target not found; adapter changed unexpectedly.");
}

const progressiveOpen = `    const openOptions: AcApOpenDatabaseOptions = {\n      minimumChunkSize: 1000,\n      progressiveRendering: true,\n      ...(options.databaseOptions ?? {}),\n      mode: this.Viewer.AcEdOpenMode.Read,\n    };`;
const safeOpen = `    const openOptions: AcApOpenDatabaseOptions = {\n      minimumChunkSize: isDwg ? 1000 : Math.max(64, Math.min(1000, bytes.byteLength)),\n      // Small and ordinary DXF sources are already fully buffered above. Running them\n      // through MLightCAD's progressive chunk path can leave openDocument() waiting in\n      // parse-convert when the whole file is smaller than the progressive chunk size.\n      progressiveRendering: isDwg,\n      ...(options.databaseOptions ?? {}),\n      mode: this.Viewer.AcEdOpenMode.Read,\n    };`;

if (source.includes(progressiveOpen)) {
  source = source.replace(progressiveOpen, safeOpen);
  changed = true;
} else if (!source.includes(safeOpen)) {
  throw new Error("Stage 9 openDocument option repair target not found; adapter changed unexpectedly.");
}

if (!changed) {
  console.log("Stage 9 native DXF parser/open repair already applied.");
  process.exit(0);
}

writeFileSync(adapterPath, source, "utf8");
console.log("Stage 9 native MLightCAD loader retained; DXF progressive parsing disabled for buffered files.");
