import fs from "node:fs";
import { parseDxfToCanonical } from "../../src/lib/cad-v2/decode/dxf-adapter";
import { compileCanonicalToScene } from "../../src/lib/cad-v2/compile/scene-compiler";

async function main() {
  console.log("=== INSPECTING SÜHEYLA KARA DXF ===");
  const dxfPath = "C:\\Users\\hsyn\\Desktop\\SÜHEYLA KARA STATİK (HAFİF) - Kopya.dxf";
  const buf = fs.readFileSync(dxfPath);
  const canonical = await parseDxfToCanonical(buf);
  console.log("Canonical entities:", canonical.modelSpaceEntities.length);
  const compiled = compileCanonicalToScene(canonical);
  const modelLayout = compiled.manifest.layouts.find(l => l.layoutId === "Model" || l.sourceName === "Model");
  console.log("Model Layout BBox:", modelLayout?.bbox);
  console.log("Chunks count:", compiled.manifest.chunks.length);
  if (compiled.manifest.chunks.length > 0) {
    console.log("Sample chunk 0 bounds:", compiled.manifest.chunks[0].bbox);
    console.log("Sample chunk 1 bounds:", compiled.manifest.chunks[1].bbox);
  }
}

main().catch(console.error);
