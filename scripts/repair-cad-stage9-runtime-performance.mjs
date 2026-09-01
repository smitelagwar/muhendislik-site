import { readFileSync, writeFileSync } from "node:fs";

const adapterPath = "src/lib/dokumantasyon/cad-upstream/adapter.ts";
const assetsPath = "scripts/sync-cad-upstream-assets.mjs";

let adapter = readFileSync(adapterPath, "utf8");
let assets = readFileSync(assetsPath, "utf8");
let adapterChanged = false;
let assetsChanged = false;

function replaceAdapter(needle, replacement, label) {
  if (adapter.includes(replacement)) return;
  if (!adapter.includes(needle)) {
    throw new Error(`Stage 9 runtime-performance adapter anchor missing: ${label}`);
  }
  adapter = adapter.replace(needle, replacement);
  adapterChanged = true;
}

function replaceAssets(needle, replacement, label) {
  if (assets.includes(replacement)) return;
  if (!assets.includes(needle)) {
    throw new Error(`Stage 9 runtime-performance asset anchor missing: ${label}`);
  }
  assets = assets.replace(needle, replacement);
  assetsChanged = true;
}

// The isolated runtime is a large browser-native ESM graph. Keep class names for
// MLightCAD reflection/debugging, but minify syntax/identifiers so Chromium has
// materially less JavaScript to parse/evaluate before the first frame.
replaceAssets(
  "  minify: false,",
  "  minify: true,",
  "minify isolated runtime"
);

// Remove the accidental unused manifest path introduced while splitting the
// runtime graph. The canonical manifest remains /cad-upstream/fonts/fonts.json.
if (assets.includes('const fontsManifestPath = join(fontsOutputDir, "fonts", "fonts.json");\n')) {
  assets = assets.replace(
    'const fontsManifestPath = join(fontsOutputDir, "fonts", "fonts.json");\n',
    ""
  );
  assetsChanged = true;
}

replaceAdapter(
  `  static async create(options: CadUpstreamCreateOptions): Promise<CadUpstreamAdapter> {\n    const Viewer = await loadViewerModule();`,
  `  static async create(options: CadUpstreamCreateOptions): Promise<CadUpstreamAdapter> {\n    const markCreatePhase = (phase: string) => {\n      const host =\n        options.container.closest<HTMLElement>('[data-cad-upstream-host="true"]') ??\n        options.container;\n      host.setAttribute("data-cad-create-phase", phase);\n    };\n\n    markCreatePhase("runtime-load");\n    const Viewer = await loadViewerModule();\n    markCreatePhase("runtime-ready");`,
  "create phase runtime markers"
);

replaceAdapter(
  `    Viewer.AcApSettingManager.instance.isShowCommandLine = false;\n    Viewer.AcApSettingManager.instance.isShowRibbon = false;\n    Viewer.AcApSettingManager.instance.isShowToolbar = false;`,
  `    markCreatePhase("viewer-settings");\n    Viewer.AcApSettingManager.instance.isShowCommandLine = false;\n    Viewer.AcApSettingManager.instance.isShowRibbon = false;\n    Viewer.AcApSettingManager.instance.isShowToolbar = false;`,
  "viewer settings marker"
);

replaceAdapter(
  `    Viewer.acedApplyUiTheme(\n      options.theme ?? "dark",\n      options.busyIndicatorHost ?? options.container\n    );\n\n    const manager = Viewer.AcApDocManager.createInstance({`,
  `    markCreatePhase("theme-apply");\n    Viewer.acedApplyUiTheme(\n      options.theme ?? "dark",\n      options.busyIndicatorHost ?? options.container\n    );\n\n    markCreatePhase("manager-create");\n    const manager = Viewer.AcApDocManager.createInstance({`,
  "theme and manager markers"
);

replaceAdapter(
  `      useMainThreadDraw: options.useMainThreadDraw ?? false,`,
  `      // Production Chromium can stall during worker-backed renderer bootstrap\n      // before React timers get a chance to tick. Keep the first Stage 9 viewport\n      // deterministic on the main renderer unless an explicit caller overrides it.\n      useMainThreadDraw: options.useMainThreadDraw ?? true,`,
  "main-thread renderer default"
);

replaceAdapter(
  `    if (!manager) {\n      throw new CadUpstreamAdapterError(`,
  `    markCreatePhase("manager-ready");\n\n    if (!manager) {\n      throw new CadUpstreamAdapterError(`,
  "manager ready marker"
);

replaceAdapter(
  `    const adapter = new CadUpstreamAdapter(manager, Viewer, options.container);`,
  `    markCreatePhase("adapter-ready");\n    const adapter = new CadUpstreamAdapter(manager, Viewer, options.container);`,
  "adapter ready marker"
);

if (!adapter.includes('data-cad-create-phase')) {
  throw new Error("Stage 9 runtime-performance repair did not install startup phase markers.");
}
if (!adapter.includes("useMainThreadDraw: options.useMainThreadDraw ?? true")) {
  throw new Error("Stage 9 runtime-performance repair did not default to main-thread drawing.");
}
if (!assets.includes("  minify: true,")) {
  throw new Error("Stage 9 runtime-performance repair did not minify the isolated runtime.");
}

if (adapterChanged) writeFileSync(adapterPath, adapter, "utf8");
if (assetsChanged) writeFileSync(assetsPath, assets, "utf8");

console.log(
  `Stage 9 runtime startup repair applied: adapter=${adapterChanged ? "changed" : "stable"}, assets=${assetsChanged ? "changed" : "stable"}.`
);
