import fs from "node:fs";

async function main() {
  const { AcDbDatabase, AcDbNativeDxfConverter, acdbAssignWorkingDatabase } = await import("@mlightcad/data-model");
  const buf = fs.readFileSync("C:/Users/hsyn/Desktop/kalip_plani_zeminkat.dxf");
  const db = new AcDbDatabase();
  acdbAssignWorkingDatabase(db);
  const converter = new AcDbNativeDxfConverter();
  await converter.read(new Uint8Array(buf) as unknown, db);

  const modelSpace = db.tables?.blockTable?.modelSpace as unknown;
  const rawEntities: unknown[] = modelSpace.newIterator ? modelSpace.newIterator().toArray() : [];

  for (const item of rawEntities) {
    const ent = typeof item === "string" ? db.openEntityForRead(item) as unknown : item;
    if (!ent) continue;
    if ((ent.dxfTypeName || "").toUpperCase() === "MTEXT") {
      console.log("Raw MTEXT found!");
      console.log("Keys:", Object.keys(ent));
      console.log("ent.position:", ent.position);
      console.log("ent.location:", ent.location);
      console.log("ent.insertionPoint:", ent.insertionPoint);
      console.log("ent._location:", ent._location);
      console.log("ent._position:", ent._position);
      console.log("ent._geo:", ent._geo);
      console.log("Proto:", Object.getOwnPropertyNames(Object.getPrototypeOf(ent)));
      for (const m of Object.getOwnPropertyNames(Object.getPrototypeOf(ent))) {
        if (m.toLowerCase().includes("pos") || m.toLowerCase().includes("point") || m.toLowerCase().includes("loc")) {
          console.log(`  Proto ${m}:`, typeof ent[m] === "function" ? ent[m]() : ent[m]);
        }
      }
      break;
    }
  }
}

main().catch(console.error);
