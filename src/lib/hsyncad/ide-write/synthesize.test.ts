import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { synthesizeIdeFile } from "./synthesize";
import { createDemoModel } from "../model";
import { parseIde10 } from "../ide-import/index";
import { verifyIdeHeaderChecksum } from "../ide-import/ide-binary-codec";
import { IDE10_VERSION, IDE11_VERSION } from "./format-constants";

test("synthesizes valid .ide10 binary with correct CRC32 and parses back", () => {
  const model = createDemoModel();
  model.name = "Test 4x4 Yapi Modeli";

  // 1. Synthesize .ide10
  const bytes = synthesizeIdeFile(model, "ide10");
  assert.ok(bytes.byteLength > 1000, "Synthesized bytes must be > 1KB");

  // 2. Check header properties
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  assert.equal(view.getUint32(74, true), IDE10_VERSION);
  assert.equal(bytes[78], 0, "encodedFlag must be 0 (native)");
  assert.equal(view.getUint32(79, true), bytes.byteLength);

  // 3. Verify CRC32 checksum
  const crcCheck = verifyIdeHeaderChecksum(bytes);
  assert.equal(crcCheck.valid, true, "Payload CRC32 must match header stored checksum");

  // 4. Parse back using parseIde10
  const project = parseIde10(
    bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer,
    "synthesized.ide10",
  );

  assert.equal(project.floors.length, 1);
  assert.equal(project.floors[0].name, "Zemin kat");
  assert.equal(project.floors[0].elevation, 0);
  assert.equal(project.floors[0].height, 3);

  // Verify decoded elements
  assert.ok(project.elements.length >= 10, `Expected at least 10 elements, got ${project.elements.length}`);
  const colCount = project.elements.filter(e => e.type === "column").length;
  const beamCount = project.elements.filter(e => e.type === "beam").length;
  const wallCount = project.elements.filter(e => e.type === "wall").length;
  const slabCount = project.elements.filter(e => e.type === "slab").length;
  const axisCount = project.elements.filter(e => e.type === "axis").length;

  assert.equal(colCount, 4, "Must decode 4 columns");
  assert.equal(beamCount, 4, "Must decode 4 beams");
  assert.equal(wallCount, 1, "Must decode 1 wall");
  assert.equal(slabCount, 1, "Must decode 1 slab");
  assert.equal(axisCount, 4, "Must decode 4 axes");
});

test("synthesizes valid .ide11 binary with correct CRC32 and parses back", () => {
  const model = createDemoModel();
  model.name = "Test v11 Modeli";

  // 1. Synthesize .ide11
  const bytes = synthesizeIdeFile(model, "ide11");

  // 2. Check header properties
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  assert.equal(view.getUint32(74, true), IDE11_VERSION);
  assert.equal(bytes[78], 0);
  assert.equal(view.getUint32(79, true), bytes.byteLength);

  // 3. Verify CRC32 checksum
  const crcCheck = verifyIdeHeaderChecksum(bytes);
  assert.equal(crcCheck.valid, true);

  // 4. Parse back
  const project = parseIde10(
    bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer,
    "synthesized.ide11",
  );

  assert.equal(project.floors.length, 1);
  assert.equal(project.floors[0].name, "Zemin kat");
  assert.equal(project.elements.length, 14);
});

test("anti-leak test: no donor string leakage in synthesized binary", () => {
  const model = createDemoModel();
  model.name = "Özgün Bina";

  const bytes = synthesizeIdeFile(model, "ide11");
  const text = new TextDecoder("latin1").decode(bytes);

  assert.equal(text.includes("MUSTAFA"), false, "Must NOT contain MUSTAFA");
  assert.equal(text.includes("SELVİ"), false, "Must NOT contain SELVİ");
  assert.equal(text.includes("SELVI"), false, "Must NOT contain SELVI");
});

test("multi-storey model synthesis and floor assignment", () => {
  const model = createDemoModel();
  model.floors.push({
    id: "floor-1",
    name: "1. Kat",
    elevation: 3.0,
    height: 3.0,
  });

  // Add a column and beam to floor 1
  model.elements.push({
    id: "col-f1",
    name: "S101",
    type: "column",
    floorId: "floor-1",
    materialId: "concrete",
    layer: "Kolonlar",
    position: { x: 0, y: 0 },
    width: 0.5,
    depth: 0.5,
    height: 3.0,
  });

  const bytes = synthesizeIdeFile(model, "ide10");
  const project = parseIde10(
    bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer,
    "multi.ide10",
  );

  assert.equal(project.floors.length, 2);
  assert.equal(project.floors[0].name, "Zemin kat");
  assert.equal(project.floors[1].name, "1. Kat");
  assert.equal(project.floors[1].elevation, 3.0);

  const f1Elements = project.elements.filter(e => e.floorId === "ide-floor-1");
  assert.equal(f1Elements.length, 1);
  assert.equal(f1Elements[0].name, "S101");
});

test("real-world Mustafa Selvi round-trip synthesis (1273 elements)", () => {
  const configPath = path.join(process.cwd(), ".data/hsyncad/ide-examples.json");
  if (!fs.existsSync(configPath)) return;
  const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
  const samplePath = config["mustafa-selvi-1"];
  if (!fs.existsSync(samplePath)) return;

  const buf = fs.readFileSync(samplePath);
  const orig = parseIde10(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer, "mustafa.ide10");
  assert.ok(orig.floors.length >= 6, "Original must have at least 6 floors");
  assert.ok(orig.elements.length >= 1000, "Original must have > 1000 elements");

  // Synthesize both ide11 and ide10 without crash
  const bytes11 = synthesizeIdeFile(orig, "ide11");
  const bytes10 = synthesizeIdeFile(orig, "ide10");

  assert.ok(bytes11.byteLength > 200_000, "ide11 output size must be > 200KB");
  assert.ok(bytes10.byteLength > 200_000, "ide10 output size must be > 200KB");

  const crc11 = verifyIdeHeaderChecksum(bytes11);
  assert.equal(crc11.valid, true, "ide11 CRC32 must be valid");
  const crc10 = verifyIdeHeaderChecksum(bytes10);
  assert.equal(crc10.valid, true, "ide10 CRC32 must be valid");

  // Parse back
  const reparsed11 = parseIde10(bytes11.buffer.slice(bytes11.byteOffset, bytes11.byteOffset + bytes11.byteLength) as ArrayBuffer, "synth.ide11");
  assert.equal(reparsed11.floors.length, orig.floors.length, "Floor counts must match exactly");
  assert.ok(reparsed11.elements.length >= orig.elements.length * 0.95, "At least 95% elements must survive round-trip");
});
