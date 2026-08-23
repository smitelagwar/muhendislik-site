import { copyFile, mkdir, stat } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outputDir = join(root, "public", "cad-upstream");

const assets = [
  {
    source: join(
      root,
      "node_modules",
      "@mlightcad",
      "cad-simple-viewer",
      "dist",
      "mtext-renderer-worker.js"
    ),
    target: join(outputDir, "mtext-renderer-worker.js"),
  },
  {
    source: join(
      root,
      "node_modules",
      "@mlightcad",
      "libredwg-converter",
      "dist",
      "libredwg-parser-worker.js"
    ),
    target: join(outputDir, "libredwg-parser-worker.js"),
  },
  {
    source: join(
      root,
      "node_modules",
      "@mlightcad",
      "libredwg-converter",
      "dist",
      "libredwg-web.wasm"
    ),
    target: join(outputDir, "libredwg-web.wasm"),
  },
];

await mkdir(outputDir, { recursive: true });

for (const asset of assets) {
  const sourceStat = await stat(asset.source).catch(() => null);
  if (!sourceStat?.isFile() || sourceStat.size <= 0) {
    throw new Error(`Required CAD upstream asset is missing: ${asset.source}`);
  }
  await copyFile(asset.source, asset.target);
  const targetStat = await stat(asset.target);
  if (targetStat.size !== sourceStat.size) {
    throw new Error(`CAD upstream asset copy size mismatch: ${asset.target}`);
  }
  console.log(
    `[cad-upstream] synced ${asset.target.slice(root.length + 1)} (${targetStat.size} bytes)`
  );
}
