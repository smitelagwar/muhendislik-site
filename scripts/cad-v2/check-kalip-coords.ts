import fs from "node:fs";
import { parseDxfToCanonical } from "../../src/lib/cad-v2/decode/dxf-adapter";

async function main() {
  const buf = fs.readFileSync("C:/Users/hsyn/Desktop/kalip_plani_zeminkat.dxf");
  const doc = await parseDxfToCanonical(buf);

  const layerBounds: Record<string, [number, number, number, number]> = {};

  const updateBounds = (layer: string, x: number, y: number) => {
    if (!layerBounds[layer]) {
      layerBounds[layer] = [x, y, x, y];
    } else {
      layerBounds[layer][0] = Math.min(layerBounds[layer][0], x);
      layerBounds[layer][1] = Math.min(layerBounds[layer][1], y);
      layerBounds[layer][2] = Math.max(layerBounds[layer][2], x);
      layerBounds[layer][3] = Math.max(layerBounds[layer][3], y);
    }
  };

  for (const ent of doc.modelSpaceEntities) {
    if (ent.type === "LINE") {
      updateBounds(ent.layer, ent.start[0], ent.start[1]);
      updateBounds(ent.layer, ent.end[0], ent.end[1]);
    } else if (ent.type === "LWPOLYLINE") {
      for (const v of ent.vertices) {
        updateBounds(ent.layer, v.x, v.y);
      }
    } else if (ent.type === "CIRCLE") {
      updateBounds(ent.layer, ent.center[0] - ent.radius, ent.center[1] - ent.radius);
      updateBounds(ent.layer, ent.center[0] + ent.radius, ent.center[1] + ent.radius);
    } else if (ent.type === "TEXT" || ent.type === "MTEXT") {
      updateBounds(ent.layer, ent.insertionPoint[0], ent.insertionPoint[1]);
    }
  }

  console.log("Entities on Layer Kiriş:");
  const kirisEntities = doc.modelSpaceEntities.filter(e => e.layer === "Kiriş");
  const kirisTypes: Record<string, number> = {};
  for (const ent of kirisEntities) {
    kirisTypes[ent.type] = (kirisTypes[ent.type] || 0) + 1;
  }
  console.log("Types on Kiriş:", kirisTypes);
  console.log("Sample Kiriş vertices:", kirisEntities[0].type === "LWPOLYLINE" ? (kirisEntities[0] as unknown).vertices?.slice(0, 3) : "not polyline");
}

main().catch(console.error);
