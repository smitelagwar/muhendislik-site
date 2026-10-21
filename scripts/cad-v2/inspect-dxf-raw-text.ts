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
    if ((ent.dxfTypeName || "").toUpperCase() === "TEXT") {
      console.log("Raw TEXT found!");
      console.log("position:", ent.position);
      console.log("location:", ent.location);
      console.log("insertionPoint:", ent.insertionPoint);
      console.log("alignmentPoint:", ent.alignmentPoint);
      console.log("secondAlignmentPoint:", ent.secondAlignmentPoint);
      console.log("_position:", ent._position);
      console.log("_location:", ent._location);
      console.log("_alignmentPoint:", ent._alignmentPoint);
      break;
    }
  }
}

main().catch(console.error);
