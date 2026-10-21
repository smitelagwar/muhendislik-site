import fs from "node:fs";
import { parseDxfToCanonical } from "../../src/lib/cad-v2/decode/dxf-adapter";

async function main() {
  const buf = fs.readFileSync("C:/Users/hsyn/Desktop/kalip_plani_zeminkat.dxf");
  const doc = await parseDxfToCanonical(buf);

  for (let i = 0; i < doc.modelSpaceEntities.length; i++) {
    const ent = doc.modelSpaceEntities[i];
    const s = JSON.stringify(ent, (k, v) => typeof v === "bigint" ? v.toString() : v);
    if (s.includes("-38.42") || s.includes("-38")) {
      console.log(`Entity ${i} (${ent.type}) on layer '${ent.layer}':`, ent);
    }
  }
}

main().catch(console.error);
