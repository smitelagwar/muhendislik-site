import fs from "node:fs";

async function main() {
  const { AcDbDatabase, AcDbNativeDxfConverter, acdbAssignWorkingDatabase } = await import("@mlightcad/data-model");
  const buf = fs.readFileSync("C:/Users/hsyn/Desktop/SÜHEYLA KARA STATİK (HAFİF) - Kopya.dxf");
  const db = new AcDbDatabase();
  acdbAssignWorkingDatabase(db);
  const converter = new AcDbNativeDxfConverter();
  await converter.read(new Uint8Array(buf) as unknown, db);

  const layerTable = (db as unknown).tables?.layerTable;
  const records = layerTable.newIterator ? layerTable.newIterator().toArray() : (layerTable.records || []);

  for (const rec of records.slice(0, 10)) {
    console.log(`Layer '${rec.name}': color=`, rec.color);
    if (rec.color) {
      console.log(`  red=${rec.color.red}, green=${rec.color.green}, blue=${rec.color.blue}, colorIndex=${rec.color.colorIndex}`);
    }
  }
}

main().catch(console.error);
