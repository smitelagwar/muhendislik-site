import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { build } from "esbuild";

const require = createRequire(import.meta.url);
const shxCommonJsEntry = require.resolve("@mlightcad/shx-parser");
const shxEsmEntry = path.join(path.dirname(shxCommonJsEntry), "index.es.js");
const rootSrc = path.resolve(import.meta.dirname, "../../src");

if (!fs.existsSync(shxEsmEntry)) {
  throw new Error(`@mlightcad/shx-parser ESM entry not found: ${shxEsmEntry}`);
}

await build({
  entryPoints: ["src/index.ts", "src/compiler-child-entry.ts"],
  bundle: true,
  alias: { "@mlightcad/shx-parser": shxEsmEntry, "@": rootSrc },
  platform: "node",
  format: "esm",
  target: "node24",
  outdir: "dist",
});
