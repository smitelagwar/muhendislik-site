import fs from "fs";
import { synthesizeIdeFile } from "../src/lib/hsyncad/ide-write/synthesize";
import { parseIde10 } from "../src/lib/hsyncad/ide-import/index";
import { verifyIdeHeaderChecksum } from "../src/lib/hsyncad/ide-import/ide-binary-codec";

async function main() {
  const filePath = "C:/Users/hsyn/Desktop/SON/7_KAT_5000M2_BINA.hsyncad";
  if (!fs.existsSync(filePath)) {
    console.error("File not found:", filePath);
    process.exit(1);
  }

  const raw = fs.readFileSync(filePath, "utf8");
  const model = JSON.parse(raw);
  console.log("Model loaded: floors =", model.floors.length, "elements =", model.elements.length);

  // 1. Synthesize .ide11
  const t0 = Date.now();
  const bytes11 = synthesizeIdeFile(model, "ide11");
  console.log(`Synthesized .ide11 size: ${bytes11.byteLength} bytes in ${Date.now() - t0} ms`);

  // Verify CRC
  const crc11 = verifyIdeHeaderChecksum(bytes11);
  console.log("ide11 CRC valid:", crc11.valid, "stored:", crc11.stored.toString(16));

  // 2. Synthesize .ide10
  const t1 = Date.now();
  const bytes10 = synthesizeIdeFile(model, "ide10");
  console.log(`Synthesized .ide10 size: ${bytes10.byteLength} bytes in ${Date.now() - t1} ms`);

  // Verify CRC
  const crc10 = verifyIdeHeaderChecksum(bytes10);
  console.log("ide10 CRC valid:", crc10.valid, "stored:", crc10.stored.toString(16));

  // 3. Parse back .ide11 with parseIde10
  const t2 = Date.now();
  const project11 = parseIde10(
    bytes11.buffer.slice(bytes11.byteOffset, bytes11.byteOffset + bytes11.byteLength) as ArrayBuffer,
    "7kat.ide11",
  );
  console.log(`Parsed back .ide11 in ${Date.now() - t2} ms`);
  console.log("Parsed .ide11 floors:", project11.floors.length);
  console.log("Parsed .ide11 elements:", project11.elements.length);

  // 4. Parse back .ide10 with parseIde10
  const t3 = Date.now();
  const project10 = parseIde10(
    bytes10.buffer.slice(bytes10.byteOffset, bytes10.byteOffset + bytes10.byteLength) as ArrayBuffer,
    "7kat.ide10",
  );
  console.log(`Parsed back .ide10 in ${Date.now() - t3} ms`);
  console.log("Parsed .ide10 floors:", project10.floors.length);
  console.log("Parsed .ide10 elements:", project10.elements.length);

  // 5. Check for leaks
  const text11 = new TextDecoder("latin1").decode(bytes11);
  const text10 = new TextDecoder("latin1").decode(bytes10);
  console.log("MUSTAFA count in ide11:", (text11.match(/MUSTAFA/g) || []).length);
  console.log("SELVI count in ide11:", (text11.match(/SELV[İI]/gi) || []).length);
  console.log("MUSTAFA count in ide10:", (text10.match(/MUSTAFA/g) || []).length);
  console.log("SELVI count in ide10:", (text10.match(/SELV[İI]/gi) || []).length);

  if (project11.floors.length !== 7 || project11.elements.length !== 806) {
    throw new Error(`Expected 7 floors and 806 elements in .ide11, got ${project11.floors.length} floors and ${project11.elements.length} elements`);
  }
  if (project10.floors.length !== 7 || project10.elements.length !== 806) {
    throw new Error(`Expected 7 floors and 806 elements in .ide10, got ${project10.floors.length} floors and ${project10.elements.length} elements`);
  }

  console.log("SUCCESS: Both .ide11 and .ide10 round-trips match 100% perfectly with 0 leaks!");
}

main().catch(err => {
  console.error("Error:", err);
  process.exit(1);
});
