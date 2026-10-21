import fs from "node:fs";
import { parseDxfToCanonical } from "../../src/lib/cad-v2/decode/dxf-adapter";
import { compileCanonicalToScene } from "../../src/lib/cad-v2/compile/scene-compiler";

async function main() {
  const dxfPath = "C:\\Users\\hsyn\\Desktop\\kalip_plani_zeminkat.dxf";
  const buf = fs.readFileSync(dxfPath);
  const canonical = await parseDxfToCanonical(buf);
  const compiled = compileCanonicalToScene(canonical);

  console.log("Manifest chunks count:", compiled.manifest.chunks.length);
  for (const chunkSummary of compiled.manifest.chunks) {
    console.log(`Chunk ${chunkSummary.chunkId}: bounds=${JSON.stringify(chunkSummary.bbox)}, layers=${JSON.stringify(chunkSummary.layers)}`);
  }
}

main().catch(console.error);
