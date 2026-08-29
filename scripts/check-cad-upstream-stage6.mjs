import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relative) => readFile(path.join(root, relative), "utf8");
const fail = (message) => { throw new Error(message); };
const assert = (condition, message) => { if (!condition) fail(message); };

const [adapter, host, orchestrator, pkgText] = await Promise.all([
  read("src/lib/dokumantasyon/cad-upstream/adapter.ts"),
  read("src/components/dokumantasyon/preview/cad-upstream-viewer.tsx"),
  read("src/components/dokumantasyon/preview/cad-runtime-orchestrator.tsx"),
  read("package.json"),
]);
const pkg = JSON.parse(pkgText);

assert(pkg.dependencies?.["@mlightcad/cad-simple-viewer"] === "1.6.2", "cad-simple-viewer exact pin 1.6.2 olmalı");
assert(pkg.dependencies?.["@mlightcad/data-model"] === "1.14.2", "data-model exact pin 1.14.2 olmalı");
assert(pkg.dependencies?.["@mlightcad/libredwg-converter"] === "3.14.2", "libredwg-converter exact pin 3.14.2 olmalı");

// The Stage 6 gate originally asserted the first monochrome CSS prototype
// (`grayscale(1) brightness(0)`). Main later intentionally replaced it with
// contrast-preserving source/monochrome rendering. Guard the current public
// adapter contract rather than pinning an obsolete visual implementation.
for (const token of [
  'CadUpstreamDisplayMode = "source" | "monochrome"',
  'grayscale(100%) invert(100%) contrast(150%) brightness(1.2)',
  'grayscale(100%) contrast(150%)',
  'this.sourceCanvasFilter',
  'this.manager.curView',
  'db.lwdisplay = visible',
  'refreshEntitiesForLineWeightChange',
]) {
  assert(adapter.includes(token), `Stage 6 adapter contract eksik: ${token}`);
}

for (const forbidden of ["._scene", "dxf-viewer", "parseDwg", "DWG_DXF_WORKER_ASSET_URL"]) {
  assert(!adapter.includes(forbidden), `Stage 6 adapter upstream sınırını aşıyor: ${forbidden}`);
}

for (const token of [
  "Gerçek Renk",
  "Siyah-Beyaz",
  "Lineweight",
  "data-cad-color-mode",
  "data-cad-lineweight",
]) {
  assert(host.includes(token), `Stage 6 host kontrolü eksik: ${token}`);
}

for (const forbidden of ["share", "download", "fullscreen", "dxf-viewer", "aps-dwg-viewer"]) {
  assert(!host.toLowerCase().includes(forbidden), `Stage 6 host sorumluluğu fazla geniş: ${forbidden}`);
}

const engineOrder = ["fast-resolving", "upstream", "current-fallback", "aps"];
let cursor = 0;
for (const engine of engineOrder) {
  const index = orchestrator.indexOf(`\"${engine}\"`, cursor);
  assert(index >= 0, `Stage 5 runtime motoru bulunamadı: ${engine}`);
  cursor = index + engine.length;
}

console.log("Stage 6 exact upstream pins: PASS");
console.log("Stage 6 current fidelity controls: PASS");
console.log("Stage 6 anti-fork / ownership contract: PASS");
console.log("Stage 6 runtime order preservation: PASS");
console.log("GATE: PASS — Aşama 6 fidelity contract güncel runtime ile uyumlu.");
