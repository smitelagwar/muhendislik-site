import { readFileSync, writeFileSync } from "node:fs";

const testPath = "tests/document-studio/cad-dxf.spec.ts";
let source = readFileSync(testPath, "utf8");
let changed = false;

function replaceOnce(needle, replacement, label) {
  if (source.includes(replacement)) return;
  if (!source.includes(needle)) {
    throw new Error(`Stage 9 DXF smoke fixture repair anchor missing: ${label}`);
  }
  source = source.replace(needle, replacement);
  changed = true;
}

replaceOnce(
  `    "0", "SECTION", "2", "TABLES", "0", "TABLE", "2", "LAYER", "70", "2",\n    "0", "LAYER", "2", "0", "70", "0", "62", "7", "6", "CONTINUOUS",\n    "0", "LAYER", "2", "KALIP", "70", "0", "62", "2", "6", "CONTINUOUS",`,
  `    "0", "SECTION", "2", "TABLES", "0", "TABLE", "2", "LAYER", "70", "2",\n    "0", "LAYER", "100", "AcDbSymbolTableRecord", "2", "0", "70", "0",\n    "100", "AcDbLayerTableRecord", "62", "7", "6", "CONTINUOUS",\n    "0", "LAYER", "100", "AcDbSymbolTableRecord", "2", "KALIP", "70", "0",\n    "100", "AcDbLayerTableRecord", "62", "2", "6", "CONTINUOUS",`,
  "AC1027 layer records"
);

replaceOnce(
  `function line(x1: number, y1: number, x2: number, y2: number): string {\n  return ["0", "LINE", "8", "KALIP", "10", String(x1), "20", String(y1), "11", String(x2), "21", String(y2)].join("\\n");\n}`,
  `function line(x1: number, y1: number, x2: number, y2: number): string {\n  return [\n    "0", "LINE",\n    "100", "AcDbEntity",\n    "8", "KALIP",\n    "100", "AcDbLine",\n    "10", String(x1), "20", String(y1), "30", "0",\n    "11", String(x2), "21", String(y2), "31", "0",\n  ].join("\\n");\n}`,
  "AC1027 LINE entity"
);

replaceOnce(
  `      "0\\nCIRCLE\\n8\\nKALIP\\n10\\n525\\n20\\n400\\n40\\n120",\n      "0\\nTEXT\\n8\\nKALIP\\n10\\n40\\n20\\n730\\n40\\n45\\n1\\nKALIP PLANI",`,
  `      "0\\nCIRCLE\\n100\\nAcDbEntity\\n8\\nKALIP\\n100\\nAcDbCircle\\n10\\n525\\n20\\n400\\n30\\n0\\n40\\n120",\n      "0\\nTEXT\\n100\\nAcDbEntity\\n8\\nKALIP\\n100\\nAcDbText\\n10\\n40\\n20\\n730\\n30\\n0\\n40\\n45\\n1\\nKALIP PLANI",`,
  "AC1027 CIRCLE and TEXT entities"
);

if (!source.includes('"100", "AcDbLine"')) {
  throw new Error("Stage 9 DXF smoke fixture repair did not install LINE subclass markers.");
}
if (!source.includes('"100", "AcDbLayerTableRecord"')) {
  throw new Error("Stage 9 DXF smoke fixture repair did not install LAYER subclass markers.");
}

if (changed) {
  writeFileSync(testPath, source, "utf8");
  console.log("Stage 9 DXF smoke fixtures normalized to valid AC1027 subclass records.");
} else {
  console.log("Stage 9 DXF smoke fixtures already normalized.");
}
