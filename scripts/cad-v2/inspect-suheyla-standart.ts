import fs from "node:fs";
import { parseDxfToCanonical } from "../../src/lib/cad-v2/decode/dxf-adapter";

async function main() {
  const buf = fs.readFileSync("C:/Users/hsyn/Desktop/SÜHEYLA KARA STATİK (HAFİF) - Kopya.dxf");
  const doc = await parseDxfToCanonical(buf);

  const standartEnts = doc.modelSpaceEntities.filter(e => e.layer === "Standart");
  console.log("Entities on 'Standart' count:", standartEnts.length);

  const types: Record<string, number> = {};
  for (const ent of standartEnts) {
    types[ent.type] = (types[ent.type] || 0) + 1;
  }
  console.log("Types on 'Standart':", types);
  console.log("Sample entity on 'Standart':", standartEnts[0]);
}

main().catch(console.error);
