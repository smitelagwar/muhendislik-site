import fs from "fs";
import { parseIde10 } from "../src/lib/hsyncad/ide-import";
import { exportIde11Binary } from "../src/lib/hsyncad/ide-export";
import { verifyIdeHeaderChecksum } from "../src/lib/hsyncad/ide-import/ide-binary-codec";

const trialPath = "C:/Users/hsyn/Desktop/MUSTAFA SELVİ 1.KISIM.ide11trial";
const donorPath = "D:/IDM_DOWNLOAD/MUSTAFA SELVİ TÜM PROJELER/STATİK/1.kısım/MUSTAFA SELVİ 1.KISIM.ide10";

console.log("=== TESTING IDE11 EXPORT ===");

const trialBytes = fs.readFileSync(trialPath);
const donorBytes = fs.readFileSync(donorPath);

const trialProject = parseIde10(
  trialBytes.buffer.slice(trialBytes.byteOffset, trialBytes.byteOffset + trialBytes.byteLength),
  "trial.ide11trial"
);

console.log(`Trial format: ${trialProject.format}, floors: ${trialProject.floors.length}, elements: ${trialProject.elements.length}`);

const ide11Bytes = exportIde11Binary(trialBytes, trialProject, donorBytes);
console.log(`Exported ide11 bytes length: ${ide11Bytes.length}`);

const chk = verifyIdeHeaderChecksum(ide11Bytes);
console.log(`Checksum valid: ${chk.valid}, formatVersion: ${new DataView(ide11Bytes.buffer).getUint32(74, true)}`);

// Parse the generated ide11
const reparsed11 = parseIde10(
  ide11Bytes.buffer.slice(ide11Bytes.byteOffset, ide11Bytes.byteOffset + ide11Bytes.byteLength),
  "exported.ide11"
);
console.log(`Reparsed ide11 format: ${reparsed11.format}, elements: ${reparsed11.elements.length}, beam sections restored: ${reparsed11.elements.filter(e => e.type === "beam" && e.sectionLabel).length}`);
