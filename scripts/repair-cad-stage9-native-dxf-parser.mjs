import { readFileSync, writeFileSync } from "node:fs";

const adapterPath = "src/lib/dokumantasyon/cad-upstream/adapter.ts";
let source = readFileSync(adapterPath, "utf8");
let changed = false;

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
  changed = true;
}

function replaceOnce(needle, replacement, label) {
  if (source.includes(replacement)) return;
  if (!source.includes(needle)) {
    throw new Error(`Stage 9 native DXF repair anchor missing: ${label}`);
  }
  source = source.replace(needle, replacement);
  changed = true;
}

replaceOnce(
  `    const Viewer = await loadViewerModule();\n    await registerLibreDwgConverter();\n\n    const workersReachable = await Viewer.AcApDocManager.checkWebworkerReadiness(\n      CAD_UPSTREAM_WORKER_URLS\n    );\n    if (!workersReachable) {\n      throw new CadUpstreamAdapterError(\n        "worker-unavailable",\n        "MLightCAD DWG/MTEXT worker dosyalarına erişilemiyor."\n      );\n    }`,
  `    const Viewer = await loadViewerModule();\n\n    // Do not perform network worker preflights while creating the generic CAD\n    // host. DXF uses the native buffered parser and must not wait on DWG/MTEXT\n    // HEAD probes. DWG registers/probes its worker stack lazily in open().`,
  "defer create-time worker setup"
);

replaceOnce(
  `      webworkerFileUrls: CAD_UPSTREAM_WORKER_URLS,\n      checkWorkersOnInit: true,`,
  `      webworkerFileUrls: CAD_UPSTREAM_WORKER_URLS,\n      checkWorkersOnInit: false,`,
  "disable manager init worker probe"
);

replaceOnce(
  `    if (!(await manager.areWorkersReady())) {\n      await manager.destroy();\n      throw new CadUpstreamAdapterError(\n        "worker-unavailable",\n        "MLightCAD worker readiness kontrolü başarısız."\n      );\n    }\n\n    const adapter = new CadUpstreamAdapter(manager, Viewer, options.container);`,
  `    const adapter = new CadUpstreamAdapter(manager, Viewer, options.container);`,
  "remove create-time manager worker probe"
);

replaceOnce(
  `    options.onPhase?.("verify-workers", "CAD worker dosyaları doğrulanıyor");\n    if (!(await this.manager.areWorkersReady())) {\n      throw new CadUpstreamAdapterError(\n        "worker-unavailable",\n        "MLightCAD worker dosyaları çizim açılmadan önce doğrulanamadı."\n      );\n    }`,
  `    // Native DXF parsing is fully buffered and does not require the DWG parser\n    // worker readiness probe. In production, HEAD-based worker verification can\n    // stall before a valid DXF reaches the parser, so only gate DWG on workers\n    // and keep that probe bounded.\n    if (extension === ".dwg") {\n      options.onPhase?.("verify-workers", "CAD worker dosyaları doğrulanıyor");\n      await registerLibreDwgConverter();\n      const workersReady = await Promise.race([\n        this.manager.areWorkersReady(),\n        new Promise<boolean>((resolve) => window.setTimeout(() => resolve(false), 4_000)),\n      ]);\n      if (!workersReady) {\n        throw new CadUpstreamAdapterError(\n          "worker-unavailable",\n          "MLightCAD worker dosyaları çizim açılmadan önce doğrulanamadı."\n        );\n      }\n    }`,
  "DXF worker-readiness bypass"
);

replaceOnce(
  `    options.onPhase?.("fetch-source", "Çizim dosyası indiriliyor");\n    const bytes = await fetchCadSource(options.accessUrl, options.signal);\n\n    const isDwg = extension.includes("dwg");`,
  `    options.onPhase?.("fetch-source", "Çizim dosyası indiriliyor");\n    const bytes = await fetchCadSource(options.accessUrl, options.signal);\n\n    // Reject obviously truncated DXF before entering the upstream parser. Some\n    // malformed token streams can otherwise leave a parser progress loop alive\n    // instead of producing the controlled recovery UI expected by the studio.\n    if (extension === ".dxf" && bytes.byteLength < 64) {\n      throw new CadUpstreamAdapterError(\n        "corrupt-truncated",\n        \`Eksik veya hasarlı dosya içeriği (\${bytes.byteLength} B). Çizim dosyası beklenenden önce sonlanmış.\`\n      );\n    }\n\n    const isDwg = extension.includes("dwg");`,
  "truncated DXF preflight"
);

if (source.includes("dataModel.AcDbEntity.prototype.dxfInFields = function")) {
  throw new Error("Stage 9 native DXF parser repair left the entity parser monkeypatch active.");
}
if (!source.includes('if (extension === ".dwg")')) {
  throw new Error("Stage 9 DXF repair did not bypass the worker readiness probe for DXF.");
}
if (!source.includes("await registerLibreDwgConverter();")) {
  throw new Error("Stage 9 DXF repair did not keep lazy DWG converter registration.");
}
if (!source.includes('if (extension === ".dxf" && bytes.byteLength < 64)')) {
  throw new Error("Stage 9 DXF repair did not install the truncated-file preflight.");
}
if (!source.includes("checkWorkersOnInit: false")) {
  throw new Error("Stage 9 DXF repair left the create-time worker check enabled.");
}
if (source.includes("const workersReachable = await Viewer.AcApDocManager.checkWebworkerReadiness")) {
  throw new Error("Stage 9 DXF repair left the static worker preflight enabled.");
}

if (changed) {
  writeFileSync(adapterPath, source, "utf8");
  console.log("Stage 9 native DXF parser, lazy DWG workers, and corrupt-file recovery repair applied.");
} else {
  console.log("Stage 9 native DXF release repair already applied.");
}
