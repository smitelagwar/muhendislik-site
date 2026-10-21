import fs from "fs";
import { getFile } from "@/lib/dokumantasyon/files";
import { getLocalStorageDir } from "@/lib/dokumantasyon/local-store";
import { parseDwgToCanonical } from "@/lib/cad-v2/decode/dwg-adapter";

async function main() {
  const buf = fs.readFileSync("C:/Users/hsyn/Desktop/1 ve 2.kat dwg.dwg");
  const doc = await parseDwgToCanonical(buf, { fileName: "1 ve 2.kat dwg.dwg" });
  const leftEntities: unknown[] = [];
  const xs: number[] = [];
  for (const ent of doc.modelSpaceEntities) {
    if (ent.type === "INSERT") {
      xs.push((ent as unknown).insertionPoint[0]);
    } else if (ent.type === "LINE") {
      xs.push((ent as unknown).start[0]);
    }
  }
  const { compileCanonicalToScene } = await import("@/lib/cad-v2/compile/scene-compiler");
  const compiled = compileCanonicalToScene(doc, { layoutId: "Model" });
  console.log("NEW Compiled manifest layouts:", compiled.manifest.layouts);
  return;
  // @ts-expect-error Package ESM declarations do not expose this dynamic import yet.
  const { LibreDwg, Dwg_File_Type } = await import("@mlightcad/libredwg-web");
  const dwg = await LibreDwg.create();
  const ptr = dwg.dwg_read_data(buf, Dwg_File_Type.DWG);
  const rawDb = dwg.convert(ptr);
  dwg.dwg_free(ptr);
  const { computeInsertMatrix, transformPoint2D } = await import("@/lib/cad-v2/compile/coordinate-transform");
  for (const ent of rawDb.entities || []) {
    if (ent.name === "*U37") {
      console.log("ALL FIELDS OF *U37:", Object.keys(ent).map(k => `${k}: ${JSON.stringify((ent as unknown)[k])}`));
      break;
    }
  }
  console.log("V1 parsed successfully!");
  const v1Layers = v1Db.tables?.layerTable?.entries || [];
  console.log("V1 layer count:", v1Layers.length);
  for (const l of v1Layers) {
    if (l.name?.includes("697D") || l.isOff || l.isFrozen || l.name?.includes("FRN")) {
      console.log(`V1 LAYER: ${l.name}: isOff=${l.isOff}, isFrozen=${l.isFrozen}, isLocked=${l.isLocked}, color=${JSON.stringify(l.color)}`);
    }
  }
}
main().catch(console.error);
