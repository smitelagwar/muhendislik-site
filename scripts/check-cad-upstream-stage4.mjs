import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const fail = (message) => {
  console.error(`GATE: FAIL — ${message}`);
  process.exitCode = 1;
};

const host = await readFile(
  resolve(root, "src/components/dokumantasyon/preview/cad-upstream-viewer.tsx"),
  "utf8"
);
const shell = await readFile(
  resolve(root, "src/components/dokumantasyon/preview/file-preview-shell.tsx"),
  "utf8"
);

const requiredHostTokens = [
  "CadUpstreamAdapter",
  "CadUpstreamAdapterError",
  "AbortController",
  "MutationObserver",
  "document.documentElement",
  "matchMedia",
  "adapter.applyTheme",
  "previousCadUpstreamTeardown",
  "adapter.destroy()",
  "onReady?.()",
  "onViewerFailure?.(reason)",
  "Tekrar dene",
  'data-cad-upstream-host="true"',
];

for (const token of requiredHostTokens) {
  if (!host.includes(token)) fail(`Stage 4 host contract token missing: ${token}`);
}

const forbiddenHostTokens = [
  'import("dxf-viewer")',
  'from "dxf-viewer"',
  "DxfViewer",
  "dxf-fidelity-audit",
  "dxf-stage3-fidelity",
  "dxf-stage4-fidelity",
  "dwg-dxf-conversion-worker",
  "ApsDwgViewer",
  "AcApPluginManager",
  "cad-simple-ui-plugin",
  "createObjectURL",
  "window.open",
  "requestFullscreen",
];

for (const token of forbiddenHostTokens) {
  if (host.includes(token)) fail(`Stage 4 host must preserve upstream/site boundaries; found: ${token}`);
}

if (!shell.includes('import("./cad-viewer")')) {
  fail("FilePreviewShell no longer points at the frozen production DokCadViewer");
}
if (shell.includes("DokCadUpstreamViewer")) {
  fail("Stage 4 must not switch production CAD runtime before Stage 5 orchestration");
}

if (!process.exitCode) {
  console.log("GATE: PASS — Stage 4 site host preserves upstream semantics and production routing.");
}
