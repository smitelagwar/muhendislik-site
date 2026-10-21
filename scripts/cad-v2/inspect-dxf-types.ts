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

  const foundTypes = new Set<string>();

  for (const item of rawEntities) {
    const ent = typeof item === "string" ? db.openEntityForRead(item) as unknown : item;
    if (!ent) continue;
    const type = (ent.dxfTypeName || "").toUpperCase();
    if (foundTypes.has(type)) continue;
    foundTypes.add(type);

    console.log(`\n=== TYPE: ${type} ===`);
    if (type === "LINE") {
      console.log("startPoint:", ent.startPoint, "start:", ent.start, "_geo:", ent._geo);
    } else if (type === "CIRCLE") {
      console.log("center:", ent.center, "radius:", ent.radius, "_geo:", ent._geo);
    } else if (type === "ARC") {
      console.log("center:", ent.center, "radius:", ent.radius, "startAngle:", ent.startAngle, "endAngle:", ent.endAngle);
    } else if (type === "HATCH") {
      console.log("HATCH keys:", Object.keys(ent));
      console.log("HATCH loopCount:", ent.loopCount ?? ent.numLoops?.() ?? ent.numberOfLoops);
      console.log("HATCH _loops:", ent._loops ?? ent._geo);
    }
  }
}

main().catch(console.error);
