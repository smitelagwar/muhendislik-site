import { readFileSync, writeFileSync } from "node:fs";

const adapterPath = "src/lib/dokumantasyon/cad-upstream/adapter.ts";
let source = readFileSync(adapterPath, "utf8");
let changed = false;

function replaceOnce(needle, replacement, label) {
  if (source.includes(replacement)) return;
  if (!source.includes(needle)) {
    throw new Error(`Stage 9 runtime repair anchor missing: ${label}`);
  }
  source = source.replace(needle, replacement);
  changed = true;
}

replaceOnce(
  `type CadSimpleViewerModule = typeof import("@mlightcad/cad-simple-viewer");\n\nlet viewerModulePromise: Promise<CadSimpleViewerModule> | null = null;\nlet libreDwgRegistrationPromise: Promise<void> | null = null;\nlet engineEnhancementsInitialized = false;`,
  `type CadSimpleViewerModule = typeof import("@mlightcad/cad-simple-viewer");\ntype CadBundledRuntimeModule = {\n  Viewer: CadSimpleViewerModule;\n  dataModel: typeof import("@mlightcad/data-model");\n  mtextRenderer: typeof import("@mlightcad/mtext-renderer");\n  threeRenderer: typeof import("@mlightcad/three-renderer");\n  libreDwg: typeof import("@mlightcad/libredwg-converter");\n};\n\nconst CAD_UPSTREAM_RUNTIME_URL = "/cad-upstream/mlightcad-runtime.js";\nlet runtimeModulePromise: Promise<CadBundledRuntimeModule> | null = null;\nlet viewerModulePromise: Promise<CadSimpleViewerModule> | null = null;\nlet libreDwgRegistrationPromise: Promise<void> | null = null;\nlet engineEnhancementsInitialized = false;`,
  "runtime type and singleton state"
);

replaceOnce(
  `async function initializeCadEngineEnhancements(Viewer: CadSimpleViewerModule): Promise<void> {\n  if (engineEnhancementsInitialized) return;\n  engineEnhancementsInitialized = true;\n\n  // 1. Ölçü birimini ("m", "mm") kaldırma: AutoCAD gibi doğrudan sayı gösterimi`,
  `async function initializeCadEngineEnhancements(runtime: CadBundledRuntimeModule): Promise<void> {\n  if (engineEnhancementsInitialized) return;\n  engineEnhancementsInitialized = true;\n  const { Viewer } = runtime;\n\n  // 1. Ölçü birimini ("m", "mm") kaldırma: AutoCAD gibi doğrudan sayı gösterimi`,
  "enhancement runtime argument"
);

replaceOnce(
  `  try {\n    const [dataModel, mtextRenderer, threeRenderer] = await Promise.all([\n      import("@mlightcad/data-model"),\n      import("@mlightcad/mtext-renderer"),\n      import("@mlightcad/three-renderer"),\n    ]);`,
  `  try {\n    // These namespaces come from the same isolated ESM graph as Viewer.\n    // Do not import peer packages through Next here; production chunk splitting can\n    // otherwise patch/register a different singleton/prototype than openDocument uses.\n    const { dataModel, mtextRenderer, threeRenderer } = runtime;`,
  "enhancement peer imports"
);

replaceOnce(
  `        if (typeof f?.atSubclassData !== "function") {\n          return origEntityDxfIn.call(this, filer as never);\n        }\n\n        const hasAcDbEntity = f.atSubclassData("AcDbEntity");\n        if (hasAcDbEntity) {\n          return origEntityDxfIn.call(this, filer as never);\n        }`,
  `        if (typeof f?.peekItem !== "function") {\n          return origEntityDxfIn.call(this, filer as never);\n        }\n\n        // atSubclassData() consumes the filer while probing. For flat/R12-style\n        // entities inspect the next token without advancing; the native parser owns\n        // real AcDbEntity subclass records and this compatibility path owns flat ones.\n        const nextItem = f.peekItem();\n        const hasAcDbEntity =\n          Number(nextItem?.code) === 100 && String(nextItem?.value) === "AcDbEntity";\n        if (hasAcDbEntity) {\n          return origEntityDxfIn.call(this, filer as never);\n        }`,
  "non-consuming flat DXF probe"
);

const oldLoader = `async function loadViewerModule(): Promise<CadSimpleViewerModule> {\n  if (!viewerModulePromise) {\n    viewerModulePromise = import("@mlightcad/cad-simple-viewer")\n      .then(async (Viewer) => {\n        await initializeCadEngineEnhancements(Viewer);\n        return Viewer;\n      })\n      .catch((error) => {\n        viewerModulePromise = null;\n        throw error;\n      });\n  }\n  return viewerModulePromise;\n}`;
const repairedLoader = `async function loadCadRuntimeModule(): Promise<CadBundledRuntimeModule> {\n  if (!runtimeModulePromise) {\n    const runtimeUrl = CAD_UPSTREAM_RUNTIME_URL;\n    runtimeModulePromise = import(/* webpackIgnore: true */ runtimeUrl)\n      .then((runtime) => {\n        const candidate = runtime as unknown as CadBundledRuntimeModule;\n        if (!candidate?.Viewer?.AcApDocManager || !candidate?.dataModel?.AcDbDatabase) {\n          throw new Error("MLightCAD isolated runtime bundle is invalid.");\n        }\n        return candidate;\n      })\n      .catch((error) => {\n        runtimeModulePromise = null;\n        throw error;\n      });\n  }\n  return runtimeModulePromise;\n}\n\nasync function loadViewerModule(): Promise<CadSimpleViewerModule> {\n  if (!viewerModulePromise) {\n    viewerModulePromise = loadCadRuntimeModule()\n      .then(async (runtime) => {\n        await initializeCadEngineEnhancements(runtime);\n        return runtime.Viewer;\n      })\n      .catch((error) => {\n        viewerModulePromise = null;\n        throw error;\n      });\n  }\n  return viewerModulePromise;\n}`;
replaceOnce(oldLoader, repairedLoader, "browser-native MLightCAD loader");

const oldRegistration = `async function registerLibreDwgConverter(): Promise<void> {\n  if (!libreDwgRegistrationPromise) {\n    libreDwgRegistrationPromise = Promise.all([\n      import("@mlightcad/data-model"),\n      import("@mlightcad/libredwg-converter"),\n    ])\n      .then(([dataModel, libreDwg]) => {\n        const converter = new libreDwg.AcDbLibreDwgConverter({\n          convertByEntityType: false,\n          useWorker: true,\n          parserWorkerUrl: CAD_UPSTREAM_WORKER_URLS.dwgParser,\n        });\n        dataModel.AcDbDatabaseConverterManager.instance.register(\n          dataModel.AcDbFileType.DWG,\n          converter\n        );\n      })\n      .catch((error) => {\n        libreDwgRegistrationPromise = null;\n        throw error;\n      });\n  }\n  return libreDwgRegistrationPromise;\n}`;
const repairedRegistration = `async function registerLibreDwgConverter(): Promise<void> {\n  if (!libreDwgRegistrationPromise) {\n    libreDwgRegistrationPromise = loadCadRuntimeModule()\n      .then(({ dataModel, libreDwg }) => {\n        const converter = new libreDwg.AcDbLibreDwgConverter({\n          convertByEntityType: false,\n          useWorker: true,\n          parserWorkerUrl: CAD_UPSTREAM_WORKER_URLS.dwgParser,\n        });\n        dataModel.AcDbDatabaseConverterManager.instance.register(\n          dataModel.AcDbFileType.DWG,\n          converter\n        );\n      })\n      .catch((error) => {\n        libreDwgRegistrationPromise = null;\n        throw error;\n      });\n  }\n  return libreDwgRegistrationPromise;\n}`;
replaceOnce(oldRegistration, repairedRegistration, "shared runtime LibreDWG registration");

replaceOnce(
  `    const openOptions: AcApOpenDatabaseOptions = {\n      minimumChunkSize: 1000,\n      progressiveRendering: true,\n      ...(options.databaseOptions ?? {}),\n      mode: this.Viewer.AcEdOpenMode.Read,\n    };`,
  `    const openOptions: AcApOpenDatabaseOptions = {\n      minimumChunkSize: isDwg ? 1000 : Math.max(64, Math.min(1000, bytes.byteLength)),\n      // DXF is fully buffered above and the native converter runs on the main thread.\n      // Keep progressive chunking for DWG only; ordinary DXF uses one deterministic\n      // module graph and the converter's own time-budgeted UI yields.\n      progressiveRendering: isDwg,\n      ...(options.databaseOptions ?? {}),\n      mode: this.Viewer.AcEdOpenMode.Read,\n    };`,
  "DXF open options"
);

if (!source.includes('const CAD_UPSTREAM_RUNTIME_URL = "/cad-upstream/mlightcad-runtime.js";')) {
  throw new Error("Stage 9 runtime repair did not install the isolated runtime URL.");
}
if (!source.includes("webpackIgnore: true")) {
  throw new Error("Stage 9 runtime repair did not keep the runtime outside Next bundling.");
}
if (source.includes('f.atSubclassData("AcDbEntity")')) {
  throw new Error("Stage 9 runtime repair left the consuming flat-DXF probe active.");
}

if (changed) {
  writeFileSync(adapterPath, source, "utf8");
  console.log("Stage 9 isolated MLightCAD runtime + non-consuming DXF compatibility repair applied.");
} else {
  console.log("Stage 9 isolated MLightCAD runtime repair already applied.");
}
