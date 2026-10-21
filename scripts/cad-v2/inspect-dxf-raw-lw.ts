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
    if ((ent.dxfTypeName || "").toUpperCase() === "LWPOLYLINE") {
      console.log("ent.numberOfVertices:", typeof ent.numberOfVertices === "function" ? ent.numberOfVertices() : ent.numberOfVertices);
      console.log("ent.closed:", typeof ent.closed === "function" ? ent.closed() : ent.closed);
      console.log("ent.isClosed:", ent.isClosed);
      console.log("ent._geo keys:", Object.keys(ent._geo || {}));
      console.log("ent._geo:", ent._geo);
      const geoProto = Object.getPrototypeOf(ent._geo || {});
      console.log("ent._geo proto:", Object.getOwnPropertyNames(geoProto));
      for (const m of Object.getOwnPropertyNames(geoProto)) {
        if (m.toLowerCase().includes("bulge") || m.toLowerCase().includes("width") || m.toLowerCase().includes("point")) {
          console.log(`  _geo.${m}`);
        }
      }
      break;
    }
  }
}

main().catch(console.error);
