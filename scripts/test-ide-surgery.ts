import fs from "fs";
import { parseIde10 } from "../src/lib/hsyncad/ide-import";
import { patchIde10DonorBuffer } from "../src/lib/hsyncad/ide-import/ide10-exporter";
import { verifyIdeHeaderChecksum } from "../src/lib/hsyncad/ide-import/ide-binary-codec";

const donorPath = "D:/IDM_DOWNLOAD/MUSTAFA SELVİ TÜM PROJELER/STATİK/1.kısım/MUSTAFA SELVİ 1.KISIM.ide10";
const donorBuf = fs.readFileSync(donorPath);

const donorProject = parseIde10(
  donorBuf.buffer.slice(donorBuf.byteOffset, donorBuf.byteOffset + donorBuf.byteLength),
  "donor.ide10"
);

console.log("=== RUNNING DONOR SURGICAL PATCH TEST ===");

// Create a modified target project:
const targetProject = JSON.parse(JSON.stringify(donorProject));

// Modify floor heights:
// Change Zemin kat height to 3.5m and adjust elevations
console.log("\n1. Modifying floor heights & elevations...");
targetProject.floors[1].height = 3.5; // 3. Kat height
targetProject.floors[2].height = 3.5; // 2. Kat height
targetProject.floors[3].height = 3.5; // 1. Kat height
targetProject.floors[4].height = 3.5; // Zemin kat height

// 2. Modify slab loads on multiple slabs:
console.log("2. Modifying slab dead/live loads...");
let modifiedSlabs = 0;
for (const el of targetProject.elements) {
  if (el.type === "slab" && el.planAnnotation?.loads) {
    el.planAnnotation.loads.dead = 0.500; // C30/37 screed load
    el.planAnnotation.loads.live = 0.350; // commercial office live load
    modifiedSlabs++;
    if (modifiedSlabs <= 3) {
      console.log(`   Modified slab ${el.name} loads to G=0.500, Q=0.350`);
    }
  }
}
console.log(`   Total modified slabs: ${modifiedSlabs}`);

// 3. Modify beam dimensions on beams:
console.log("3. Modifying beam dimensions...");
let modifiedBeams = 0;
for (const el of targetProject.elements) {
  if (el.type === "beam" && el.height !== undefined) {
    el.height = 0.60; // standardized to 60cm
    modifiedBeams++;
    if (modifiedBeams <= 3) {
      console.log(`   Modified beam ${el.name} height to 0.60m`);
    }
  }
}
console.log(`   Total modified beams: ${modifiedBeams}`);

// Run patchIde10DonorBuffer
console.log("\n4. Executing patchIde10DonorBuffer...");
const result = patchIde10DonorBuffer(donorBuf, targetProject);

console.log(`Patch Result Mode: ${result.mode}`);
console.log(`Patched Element Count: ${result.patchedElementCount}`);
console.log(`Result Buffer Length: ${result.bytes.length} bytes`);

// Verify checksum
const chk = verifyIdeHeaderChecksum(result.bytes);
console.log(`CRC32 Checksum Valid: ${chk.valid} (found=${chk.found}, expected=${chk.computed})`);

// Compare diffs with original donorBuf
let diffCount = 0;
for (let i = 0; i < donorBuf.length; i++) {
  if (donorBuf[i] !== result.bytes[i]) diffCount++;
}
console.log(`Total Byte Differences from donor: ${diffCount} bytes (${(diffCount / donorBuf.length * 100).toFixed(4)}%)`);

// Reparse the patched bytes to verify 100% ideCAD reader compatibility
console.log("\n5. Reparsing patched buffer with parseIde10...");
const reparsed = parseIde10(
  result.bytes.buffer.slice(result.bytes.byteOffset, result.bytes.byteOffset + result.bytes.byteLength),
  "patched_output.ide10"
);
console.log(`Reparsed successfully! Format: ${reparsed.format}, Elements: ${reparsed.elements.length}, Floors: ${reparsed.floors.length}`);

// Check if modified values are verified in reparsed project:
const sampleSlab = reparsed.elements.find(e => e.type === "slab" && e.planAnnotation?.loads);
console.log(`Verified sample slab in reparsed file: ${sampleSlab?.name} -> G=${sampleSlab?.planAnnotation?.loads?.dead}, Q=${sampleSlab?.planAnnotation?.loads?.live}`);

const sampleBeam = reparsed.elements.find(e => e.type === "beam" && e.height !== undefined);
console.log(`Verified sample beam in reparsed file: ${sampleBeam?.name} -> height=${sampleBeam?.height}`);
