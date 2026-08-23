import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const fail = (message) => {
  console.error(`GATE: FAIL — ${message}`);
  process.exitCode = 1;
};

const packageJson = JSON.parse(await readFile(resolve(root, "package.json"), "utf8"));
const expectedDependencies = {
  "@mlightcad/cad-simple-viewer": "1.6.0",
  "@mlightcad/data-model": "1.13.0",
  "@mlightcad/libredwg-converter": "3.13.0",
};

for (const [name, version] of Object.entries(expectedDependencies)) {
  if (packageJson.dependencies?.[name] !== version) {
    fail(`${name} must be pinned to ${version}; found ${packageJson.dependencies?.[name] ?? "missing"}`);
  }
}

const adapterPath = resolve(root, "src/lib/dokumantasyon/cad-upstream/adapter.ts");
const syncPath = resolve(root, "scripts/sync-cad-upstream-assets.mjs");
const adapter = await readFile(adapterPath, "utf8");
const syncScript = await readFile(syncPath, "utf8");

const requiredAdapterTokens = [
  'import("@mlightcad/cad-simple-viewer")',
  'import("@mlightcad/data-model")',
  'import("@mlightcad/libredwg-converter")',
  "AcDbLibreDwgConverter",
  "checkWebworkerReadiness",
  "areWorkersReady",
  "openDocument",
  "this.manager.destroy()",
  "/cad-upstream/libredwg-parser-worker.js",
  "/cad-upstream/mtext-renderer-worker.js",
];
for (const token of requiredAdapterTokens) {
  if (!adapter.includes(token)) fail(`adapter contract token missing: ${token}`);
}

const forbiddenAdapterTokens = [
  'import("dxf-viewer")',
  'from "dxf-viewer"',
  "dxf-fidelity-audit",
  "dxf-stage3-fidelity",
  "dxf-stage4-fidelity",
  "dwg-dxf-conversion-worker",
  "aps-adapter",
];
for (const token of forbiddenAdapterTokens) {
  if (adapter.includes(token)) fail(`adapter must remain upstream-only; found forbidden coupling: ${token}`);
}

for (const file of [
  "mtext-renderer-worker.js",
  "libredwg-parser-worker.js",
  "libredwg-web.wasm",
]) {
  if (!syncScript.includes(file)) fail(`asset sync is missing ${file}`);
  const generated = resolve(root, "public/cad-upstream", file);
  const generatedStat = await stat(generated).catch(() => null);
  if (!generatedStat?.isFile() || generatedStat.size <= 0) {
    fail(`generated upstream asset missing or empty: public/cad-upstream/${file}`);
  }
}

const prebuild = packageJson.scripts?.prebuild ?? "";
const predev = packageJson.scripts?.predev ?? "";
if (!prebuild.includes("sync-cad-upstream-assets.mjs")) {
  fail("prebuild must synchronize upstream CAD assets");
}
if (!predev.includes("sync-cad-upstream-assets.mjs")) {
  fail("predev must synchronize upstream CAD assets");
}

if (!process.exitCode) {
  console.log("GATE: PASS — Stage 3 upstream adapter contract is isolated and build-ready.");
}
