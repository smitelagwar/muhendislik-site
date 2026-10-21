import assert from "node:assert/strict";
import fs from "node:fs";
import { CadDiagnosticCode } from "../../src/lib/cad-v2/canonical/diagnostics";
import { parseDxfToCanonical } from "../../src/lib/cad-v2/decode/dxf-adapter";

const malformedInputs = [
  ["empty input", Buffer.alloc(0)],
  ["truncated after HEADER", Buffer.from("0\nSECTION\n2\nHEADER\n9\n$ACADVER\n1\nAC1027\n", "ascii")],
  ["missing EOF", Buffer.from("0\nSECTION\n2\nENTITIES\n0\nLINE\n5\nL001\n10\n0\n20\n0\n11\n1\n21\n1\n0\nENDSEC\n", "ascii")],
  ["malformed group code", Buffer.from("0\nSECTION\n2\nHEADER\nnot-a-code\nvalue\n0\nENDSEC\n0\nEOF\n", "ascii")],
  ["truncated binary sentinel", Buffer.from("AutoCAD Binary DXF\r\n\x1a\0", "binary")],
  ["binary section without EOF", Buffer.from("AutoCAD Binary DXF\r\n\x1a\0\0\0SECTION\0", "binary")],
] as const;

const windows1254Bytes: Record<string, number> = {
  "Ğ": 0xd0, "İ": 0xdd, "Ş": 0xde, "Ö": 0xd6, "Ü": 0xdc, "Ç": 0xc7,
  "ğ": 0xf0, "ı": 0xfd, "ş": 0xfe, "ö": 0xf6, "ü": 0xfc, "ç": 0xe7,
};
function encodeWindows1254(value: string): Buffer {
  return Buffer.from([...value].map((character) => {
    if (windows1254Bytes[character] !== undefined) return windows1254Bytes[character]!;
    const codepoint = character.codePointAt(0)!;
    if (codepoint > 0x7f) throw new Error(`Test fixture has no Windows-1254 byte for U+${codepoint.toString(16)}`);
    return codepoint;
  }));
}

async function run() {
  for (const [label, bytes] of malformedInputs) {
    await assert.rejects(
      parseDxfToCanonical(bytes, { sourceVersionKey: `l07-invalid-${label.replaceAll(" ", "-")}` }),
      /DXF.*(?:invalid|incomplete|truncated|structure)/i,
      `${label} must be rejected instead of becoming a clean empty scene`,
    );
  }
  const fixturePath = new URL("../fixtures/cad-preview-v2/known-geometry-measurements.dxf", import.meta.url);
  const baseFixture = fs.readFileSync(fixturePath, "utf8");
  const extraTextEntities = [
    ["0", "TEXT", "5", "T_L07_UTF8", "100", "AcDbEntity", "8", "0", "100", "AcDbText", "10", "10", "20", "10", "30", "0", "40", "2.5", "1", "ĞİŞÖÜÇ ğışöüç", "50", "0", "7", "Standard"].join("\n"),
    ["0", "TEXT", "5", "T_L07_ESCAPE", "100", "AcDbEntity", "8", "0", "100", "AcDbText", "10", "10", "20", "20", "30", "0", "40", "2.5", "1", "\\U+011E\\U+0130\\U+015E\\U+00D6\\U+00DC\\U+00C7", "50", "0", "7", "Standard"].join("\n"),
  ].join("\n");
  const fixtureWithTurkishText = baseFixture.replace(/0\r?\nENDSEC\r?\n0\r?\nEOF\s*$/, `${extraTextEntities}\n0\nENDSEC\n0\nEOF\n`);
  assert.notEqual(fixtureWithTurkishText, baseFixture, "the valid fixture must accept injected Turkish TEXT sentinels");
  const validDocument = await parseDxfToCanonical(Buffer.from(fixtureWithTurkishText, "utf8"));
  assert(validDocument.modelSpaceEntities.length > 0, "a structurally valid ASCII DXF must keep reaching the decoder");
  assert(validDocument.modelSpaceEntities.some((entity) => entity.type === "TEXT" && entity.text === "ĞİŞÖÜÇ ğışöüç"), "UTF-8 Turkish glyph sequences must survive ASCII DXF decode");
  assert(validDocument.modelSpaceEntities.some((entity) => entity.type === "TEXT" && entity.text === "\\U+011E\\U+0130\\U+015E\\U+00D6\\U+00DC\\U+00C7"), "DXF Unicode escape sequences must survive decode for font-stage interpretation");

  const cp1254Fixture = baseFixture
    .replace("9\n$ACADVER\n1\nAC1027", "9\n$ACADVER\n1\nAC1027\n9\n$DWGCODEPAGE\n3\nANSI_1254")
    .replace(/0\r?\nENDSEC\r?\n0\r?\nEOF\s*$/, [
      "0", "TEXT", "5", "T_L07_CP1254", "100", "AcDbEntity", "8", "0", "100", "AcDbText",
      "10", "10", "20", "30", "30", "0", "40", "2.5", "1", "L07_CP1254_SENTINEL", "50", "0", "7", "Standard",
      "0", "ENDSEC", "0", "EOF", "",
    ].join("\n"));
  const cp1254Ascii = Buffer.from(cp1254Fixture, "ascii");
  const sentinel = Buffer.from("L07_CP1254_SENTINEL", "ascii");
  const sentinelOffset = cp1254Ascii.indexOf(sentinel);
  assert(sentinelOffset >= 0, "CP1254 source text sentinel must be present before byte substitution");
  const cp1254Bytes = Buffer.concat([
    cp1254Ascii.subarray(0, sentinelOffset),
    encodeWindows1254("ĞİŞÖÜÇ ğışöüç"),
    cp1254Ascii.subarray(sentinelOffset + sentinel.length),
  ]);
  const cp1254Document = await parseDxfToCanonical(cp1254Bytes, { sourceVersionKey: "l07-dxf-ansi-1254" });
  assert(cp1254Document.modelSpaceEntities.some((entity) => entity.type === "TEXT" && entity.text === "ĞİŞÖÜÇ ğışöüç"),
    `ANSI_1254 DXF source bytes must map Turkish characters without replacement glyphs; parsed=${JSON.stringify(cp1254Document.modelSpaceEntities.filter((entity) => entity.type === "TEXT").map((entity) => entity.text))}`);
  assert.equal(cp1254Document.codepage, "ANSI_1254", "declared source codepage must be retained in canonical metadata");
  const unknownCodepageBytes = Buffer.from(cp1254Bytes);
  const cp1254Label = Buffer.from("ANSI_1254", "ascii");
  const cp1254LabelOffset = unknownCodepageBytes.indexOf(cp1254Label);
  assert(cp1254LabelOffset >= 0, "declared codepage bytes must be found for unsupported-codepage control");
  Buffer.from("ANSI_9999", "ascii").copy(unknownCodepageBytes, cp1254LabelOffset);
  const unknownCodepageDoc = await parseDxfToCanonical(unknownCodepageBytes, { sourceVersionKey: "l07-dxf-unsupported-codepage" });
  assert(unknownCodepageDoc.diagnostics.some((diagnostic) => diagnostic.code === CadDiagnosticCode.UNSUPPORTED_DXF_CODEPAGE),
    "unsupported non-ASCII source codepage must be visible as a degraded diagnostic");
  process.stdout.write(`L07 malformed DXF structure / codepage: PASS (${malformedInputs.length} invalid cases)\n`);
}

run().catch((error) => { process.stderr.write(`${error instanceof Error ? error.stack ?? error.message : String(error)}\n`); process.exitCode = 1; });
