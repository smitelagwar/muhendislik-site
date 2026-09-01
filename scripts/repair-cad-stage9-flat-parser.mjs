import { readFileSync, writeFileSync } from "node:fs";

const adapterPath = "src/lib/dokumantasyon/cad-upstream/adapter.ts";
const source = readFileSync(adapterPath, "utf8");

const legacyProbe = `        if (typeof f?.atSubclassData !== "function") {
          return origEntityDxfIn.call(this, filer as never);
        }

        const hasAcDbEntity = f.atSubclassData("AcDbEntity");
        if (hasAcDbEntity) {
          return origEntityDxfIn.call(this, filer as never);
        }
`;

const safeProbe = `        if (typeof f?.peekItem !== "function") {
          return origEntityDxfIn.call(this, filer as never);
        }

        // atSubclassData() is a consuming parser operation in mlightcad. Calling it
        // merely to detect a subclass can advance a flat/R12 DXF cursor all the way
        // past entity-specific fields and leave openDocument() stuck in parse-convert.
        // Inspect the current token without consuming it; let the native parser own
        // real 100/AcDbEntity records, and keep flat entities on the compatibility path.
        const nextItem = f.peekItem();
        const hasAcDbEntity =
          Number(nextItem?.code) === 100 && String(nextItem?.value) === "AcDbEntity";
        if (hasAcDbEntity) {
          return origEntityDxfIn.call(this, filer as never);
        }
`;

if (source.includes(safeProbe)) {
  console.log("Stage 9 flat DXF parser repair already applied.");
  process.exit(0);
}

if (!source.includes(legacyProbe)) {
  throw new Error("Stage 9 flat DXF parser repair target not found; adapter changed unexpectedly.");
}

writeFileSync(adapterPath, source.replace(legacyProbe, safeProbe), "utf8");
console.log("Stage 9 flat DXF parser cursor repair applied.");
