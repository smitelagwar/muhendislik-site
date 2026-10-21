import fs from "node:fs";
import { parseDxfToCanonical } from "../../src/lib/cad-v2/decode/dxf-adapter";
import { compileCanonicalToScene } from "../../src/lib/cad-v2/compile/scene-compiler";

async function inspectKalip() {
  console.log("=== INSPECTING kalip_plani_zeminkat.dxf ===");
  const dxfPath = "C:\\Users\\hsyn\\Desktop\\kalip_plani_zeminkat.dxf";
  const buf = fs.readFileSync(dxfPath);
  const canonical = await parseDxfToCanonical(buf);

  console.log("Canonical File Details:");
  console.log("- Entities Count:", canonical.modelSpaceEntities.length);
  console.log("- Layers Count:", Object.keys(canonical.layers).length);
  for (const [name, l] of Object.entries(canonical.layers)) {
    console.log(`  Layer '${name}': color=${JSON.stringify(l.color)}, visible=${l.visible}, frozen=${l.frozen}`);
  }

  const typeCounts: Record<string, number> = {};
  const layerCounts: Record<string, number> = {};
  for (const ent of canonical.modelSpaceEntities) {
    typeCounts[ent.type] = (typeCounts[ent.type] || 0) + 1;
    layerCounts[ent.layer] = (layerCounts[ent.layer] || 0) + 1;
  }
  console.log("- Entity Types:", typeCounts);
  console.log("- Entities Per Layer:", layerCounts);

  // Compile scene
  const compiled = compileCanonicalToScene(canonical);
  console.log("\nCompiled Scene Details:");
  console.log("- Layouts:", compiled.manifest.layouts);
  console.log("- Chunks Count:", compiled.manifest.chunks.length);
  console.log("- Total Primitives:", compiled.manifest.chunks.reduce((s, c) => s + c.primitiveCount, 0));
  
  // Model BBox
  const modelLayout = compiled.manifest.layouts.find(l => l.name === "Model");
  console.log("- Model BBox:", modelLayout?.bbox);
}

async function inspectSuheyla() {
  console.log("\n=== INSPECTING SÜHEYLA KARA STATİK (HAFİF) - Kopya.dxf ===");
  const dxfPath = "C:\\Users\\hsyn\\Desktop\\SÜHEYLA KARA STATİK (HAFİF) - Kopya.dxf";
  const buf = fs.readFileSync(dxfPath);
  const canonical = await parseDxfToCanonical(buf);

  console.log("Canonical File Details:");
  console.log("- Entities Count:", canonical.modelSpaceEntities.length);
  console.log("- Layers Count:", Object.keys(canonical.layers).length);

  console.log("- Model Entities:", canonical.modelSpaceEntities.length);

  // Compile scene
  const compiled = compileCanonicalToScene(canonical);
  const modelLayout = compiled.manifest.layouts.find(l => l.name === "Model");
  console.log("- Model BBox:", modelLayout?.bbox);
  console.log("- Chunks Count:", compiled.manifest.chunks.length);
  console.log("- Total Primitives in Manifest:", compiled.manifest.chunks.reduce((s, c) => s + c.primitiveCount, 0));
}

async function main() {
  await inspectKalip();
  await inspectSuheyla();
}

main().catch(console.error);
