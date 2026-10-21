import fs from "node:fs";
import { parseDxfToCanonical } from "../../src/lib/cad-v2/decode/dxf-adapter";

async function main() {
  const buf = fs.readFileSync("C:/Users/hsyn/Desktop/kalip_plani_zeminkat.dxf");
  const doc = await parseDxfToCanonical(buf);

  console.log("Searching primitives near [0, 0]...");
  for (let i = 0; i < doc.modelSpaceEntities.length; i++) {
    const ent = doc.modelSpaceEntities[i];
    if (ent.type === "LINE") {
      if (Math.hypot(ent.start[0], ent.start[1]) < 100 || Math.hypot(ent.end[0], ent.end[1]) < 100) {
        console.log(`Entity ${i} LINE on '${ent.layer}': start=${ent.start}, end=${ent.end}`);
      }
    } else if (ent.type === "LWPOLYLINE") {
      for (const v of ent.vertices) {
        if (Math.hypot(v.x, v.y) < 100) {
          console.log(`Entity ${i} LWPOLYLINE on '${ent.layer}' vertex near 0: [${v.x}, ${v.y}], total vertices=${ent.vertices.length}`);
          break;
        }
      }
    } else if (ent.type === "TEXT" || ent.type === "MTEXT") {
      if (Math.hypot(ent.insertionPoint[0], ent.insertionPoint[1]) < 100) {
        console.log(`Entity ${i} ${ent.type} on '${ent.layer}': text="${ent.text}", pt=${ent.insertionPoint}`);
      }
    }
  }
}

main().catch(console.error);
