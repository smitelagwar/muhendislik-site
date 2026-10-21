import fs from "node:fs";

async function main() {
  const { AcDbDatabase, AcDbNativeDxfConverter } = await import("@mlightcad/data-model");
  const buf = fs.readFileSync("C:/Users/hsyn/Desktop/kalip_plani_zeminkat.dxf");
  const db = new AcDbDatabase();
  const converter = new AcDbNativeDxfConverter();
  converter.convert(buf, db);

  const blockTable = db.blockTable;
  const modelSpace = blockTable.get("*Model_Space");

  let sampleLw: unknown = null;
  const iter = modelSpace.newIterator();
  while (!iter.done()) {
    const ent = iter.entity();
    if (ent.dxfName === "LWPOLYLINE" || ent.isKindOf?.("AcDbPolyline") || ent.type === "LWPOLYLINE") {
      sampleLw = ent;
      break;
    }
    iter.step();
  }

  if (!sampleLw) {
    console.log("No LWPOLYLINE found with that name, inspecting entity types:");
    const iter2 = modelSpace.newIterator();
    const types = new Set<string>();
    while (!iter2.done()) {
      const ent = iter2.entity();
      types.add(ent.dxfName || ent.className || ent.constructor.name);
      iter2.step();
    }
    console.log("Types:", Array.from(types));
    return;
  }

  console.log("Sample LWPOLYLINE found!");
  console.log("Keys:", Object.keys(sampleLw));
  console.log("dxfName:", sampleLw.dxfName);
  console.log("className:", sampleLw.className);
  console.log("vertices prop:", sampleLw.vertices);
  console.log("numVerts:", sampleLw.numVerts?.() ?? sampleLw.numVerts);
  console.log("Proto methods:", Object.getOwnPropertyNames(Object.getPrototypeOf(sampleLw)));
}

main().catch(console.error);
