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
`function createDxf(entities: string[]): string {
  return [
    "0", "SECTION", "2", "HEADER", "9", "$ACADVER", "1", "AC1027", "0", "ENDSEC",
    "0", "SECTION", "2", "TABLES", "0", "TABLE", "2", "LAYER", "70", "2",
    "0", "LAYER", "2", "0", "70", "0", "62", "7", "6", "CONTINUOUS",
    "0", "LAYER", "2", "KALIP", "70", "0", "62", "2", "6", "CONTINUOUS",
    "0", "ENDTAB", "0", "ENDSEC", "0", "SECTION", "2", "ENTITIES",
    ...entities,
    "0", "ENDSEC", "0", "EOF",
  ].join("\\n");
}

function line(x1: number, y1: number, x2: number, y2: number): string {
  return ["0", "LINE", "8", "KALIP", "10", String(x1), "20", String(y1), "11", String(x2), "21", String(y2)].join("\\n");
}`,
`let nextDxfHandle = 0x100;

function takeDxfHandle(): string {
  return (nextDxfHandle++).toString(16).toUpperCase();
}

function createDxf(entities: string[]): string {
  return [
    "0", "SECTION", "2", "HEADER",
    "9", "$ACADVER", "1", "AC1027",
    "9", "$HANDSEED", "5", "FFFFFF",
    "0", "ENDSEC",
    "0", "SECTION", "2", "TABLES",
    "0", "TABLE", "2", "LAYER", "70", "2",
    "0", "LAYER", "5", "10", "100", "AcDbSymbolTableRecord", "100", "AcDbLayerTableRecord",
    "2", "0", "70", "0", "62", "7", "6", "CONTINUOUS", "290", "1", "370", "-3",
    "0", "LAYER", "5", "11", "100", "AcDbSymbolTableRecord", "100", "AcDbLayerTableRecord",
    "2", "KALIP", "70", "0", "62", "2", "6", "CONTINUOUS", "290", "1", "370", "-3",
    "0", "ENDTAB", "0", "ENDSEC",
    "0", "SECTION", "2", "ENTITIES",
    ...entities,
    "0", "ENDSEC", "0", "EOF",
  ].join("\\n");
}

function line(x1: number, y1: number, x2: number, y2: number): string {
  return [
    "0", "LINE", "5", takeDxfHandle(),
    "100", "AcDbEntity", "8", "KALIP",
    "100", "AcDbLine",
    "10", String(x1), "20", String(y1), "30", "0",
    "11", String(x2), "21", String(y2), "31", "0",
  ].join("\\n");
}

function circle(cx: number, cy: number, radius: number): string {
  return [
    "0", "CIRCLE", "5", takeDxfHandle(),
    "100", "AcDbEntity", "8", "KALIP",
    "100", "AcDbCircle",
    "10", String(cx), "20", String(cy), "30", "0", "40", String(radius),
  ].join("\\n");
}

function text(x: number, y: number, height: number, value: string): string {
  return [
    "0", "TEXT", "5", takeDxfHandle(),
    "100", "AcDbEntity", "8", "KALIP",
    "100", "AcDbText",
    "10", String(x), "20", String(y), "30", "0",
    "40", String(height), "1", value, "7", "Standard",
  ].join("\\n");
}`,
  "canonical AC1027 document and entity records"
);

replaceOnce(
`      "0\\nCIRCLE\\n8\\nKALIP\\n10\\n525\\n20\\n400\\n40\\n120",
      "0\\nTEXT\\n8\\nKALIP\\n10\\n40\\n20\\n730\\n40\\n45\\n1\\nKALIP PLANI",`,
`      circle(525, 400, 120),
      text(40, 730, 45, "KALIP PLANI"),`,
  "canonical CIRCLE/TEXT helpers"
);

// Compatibility with an earlier Stage 9 repair that may already have added
// subclass markers but not handles/HANDSEED. If the canonical replacement above
// did not match, upgrade those partially-normalized forms as well.
if (!source.includes('"9", "$HANDSEED", "5", "FFFFFF"')) {
  const partialStart = source.indexOf("function createDxf(entities: string[]): string {");
  const patternedStart = source.indexOf("function createPatternedDxf(): string {");
  if (partialStart < 0 || patternedStart < 0 || patternedStart <= partialStart) {
    throw new Error("Stage 9 DXF smoke canonicalization could not locate fixture helpers.");
  }
  const canonicalHelpers = `let nextDxfHandle = 0x100;\n\nfunction takeDxfHandle(): string {\n  return (nextDxfHandle++).toString(16).toUpperCase();\n}\n\nfunction createDxf(entities: string[]): string {\n  return [\n    \"0\", \"SECTION\", \"2\", \"HEADER\",\n    \"9\", \"$ACADVER\", \"1\", \"AC1027\",\n    \"9\", \"$HANDSEED\", \"5\", \"FFFFFF\",\n    \"0\", \"ENDSEC\",\n    \"0\", \"SECTION\", \"2\", \"TABLES\",\n    \"0\", \"TABLE\", \"2\", \"LAYER\", \"70\", \"2\",\n    \"0\", \"LAYER\", \"5\", \"10\", \"100\", \"AcDbSymbolTableRecord\", \"100\", \"AcDbLayerTableRecord\",\n    \"2\", \"0\", \"70\", \"0\", \"62\", \"7\", \"6\", \"CONTINUOUS\", \"290\", \"1\", \"370\", \"-3\",\n    \"0\", \"LAYER\", \"5\", \"11\", \"100\", \"AcDbSymbolTableRecord\", \"100\", \"AcDbLayerTableRecord\",\n    \"2\", \"KALIP\", \"70\", \"0\", \"62\", \"2\", \"6\", \"CONTINUOUS\", \"290\", \"1\", \"370\", \"-3\",\n    \"0\", \"ENDTAB\", \"0\", \"ENDSEC\",\n    \"0\", \"SECTION\", \"2\", \"ENTITIES\",\n    ...entities,\n    \"0\", \"ENDSEC\", \"0\", \"EOF\",\n  ].join(\"\\n\");\n}\n\nfunction line(x1: number, y1: number, x2: number, y2: number): string {\n  return [\n    \"0\", \"LINE\", \"5\", takeDxfHandle(),\n    \"100\", \"AcDbEntity\", \"8\", \"KALIP\",\n    \"100\", \"AcDbLine\",\n    \"10\", String(x1), \"20\", String(y1), \"30\", \"0\",\n    \"11\", String(x2), \"21\", String(y2), \"31\", \"0\",\n  ].join(\"\\n\");\n}\n\nfunction circle(cx: number, cy: number, radius: number): string {\n  return [\n    \"0\", \"CIRCLE\", \"5\", takeDxfHandle(),\n    \"100\", \"AcDbEntity\", \"8\", \"KALIP\",\n    \"100\", \"AcDbCircle\",\n    \"10\", String(cx), \"20\", String(cy), \"30\", \"0\", \"40\", String(radius),\n  ].join(\"\\n\");\n}\n\nfunction text(x: number, y: number, height: number, value: string): string {\n  return [\n    \"0\", \"TEXT\", \"5\", takeDxfHandle(),\n    \"100\", \"AcDbEntity\", \"8\", \"KALIP\",\n    \"100\", \"AcDbText\",\n    \"10\", String(x), \"20\", String(y), \"30\", \"0\",\n    \"40\", String(height), \"1\", value, \"7\", \"Standard\",\n  ].join(\"\\n\");\n}\n\n`;
  source = source.slice(0, partialStart) + canonicalHelpers + source.slice(patternedStart);
  source = source.replace(
    /\s*"0\\nCIRCLE[^"]*",\n\s*"0\\nTEXT[^"]*",/,
    `\n      circle(525, 400, 120),\n      text(40, 730, 45, "KALIP PLANI"),`
  );
  source = source.replace(
    /\s*"0\\nCIRCLE\\n100\\nAcDbEntity[^"]*",\n\s*"0\\nTEXT\\n100\\nAcDbEntity[^"]*",/,
    `\n      circle(525, 400, 120),\n      text(40, 730, 45, "KALIP PLANI"),`
  );
  changed = true;
}

if (!source.includes('"9", "$HANDSEED", "5", "FFFFFF"')) {
  throw new Error("Stage 9 DXF smoke fixture repair did not install HANDSEED.");
}
if (!source.includes('"0", "LINE", "5", takeDxfHandle()')) {
  throw new Error("Stage 9 DXF smoke fixture repair did not install unique entity handles.");
}
if (!source.includes('"100", "AcDbLayerTableRecord"')) {
  throw new Error("Stage 9 DXF smoke fixture repair did not install LAYER subclass markers.");
}

if (changed) {
  writeFileSync(testPath, source, "utf8");
  console.log("Stage 9 DXF smoke fixtures normalized to canonical handled AC1027 records.");
} else {
  console.log("Stage 9 DXF smoke fixtures already canonical.");
}
