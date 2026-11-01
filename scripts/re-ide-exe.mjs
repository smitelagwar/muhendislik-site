import fs from 'fs';

const exePath = 'C:\\Program Files\\ideCAD\\ideCAD Statik 11 Deneme\\ideCAD_Statik_11_Deneme.exe';
const fd = fs.openSync(exePath, 'r');
const stat = fs.fstatSync(fd);

// Read PE header to map file offsets to RVAs
const headerBuf = Buffer.alloc(4096);
fs.readSync(fd, headerBuf, 0, 4096, 0);
const peOffset = headerBuf.readUInt32LE(0x3C);
const numSections = headerBuf.readUInt16LE(peOffset + 6);
const optHeaderSize = headerBuf.readUInt16LE(peOffset + 20);
const imageBase = headerBuf.readBigUInt64LE(peOffset + 24 + 24);

const sectionHeadersOffset = peOffset + 24 + optHeaderSize;
const sections = [];
for (let i = 0; i < numSections; i++) {
  const secBuf = headerBuf.subarray(sectionHeadersOffset + i * 40, sectionHeadersOffset + (i + 1) * 40);
  const name = secBuf.toString('ascii', 0, 8).replace(/\0+$/, '');
  const virtSize = secBuf.readUInt32LE(8);
  const virtAddr = secBuf.readUInt32LE(12);
  const rawSize = secBuf.readUInt32LE(16);
  const rawPtr = secBuf.readUInt32LE(20);
  sections.push({ name, virtAddr, virtSize, rawPtr, rawSize });
}

function fileOffsetToRva(fileOffset) {
  for (const sec of sections) {
    if (fileOffset >= sec.rawPtr && fileOffset < sec.rawPtr + sec.rawSize) {
      const rva = sec.virtAddr + (fileOffset - sec.rawPtr);
      const va = imageBase + BigInt(rva);
      return { section: sec.name, rva: '0x' + rva.toString(16), va: '0x' + va.toString(16) };
    }
  }
  return null;
}

console.log('ImageBase: 0x' + imageBase.toString(16));
console.log('Scanning for targets in ' + exePath + ' (' + (stat.size / (1024 * 1024)).toFixed(1) + ' MB)...');

const chunkSize = 16 * 1024 * 1024;
const buf = Buffer.alloc(chunkSize + 4096);

const stringTargets = [
  'IDE BUILDING DESIGNER PROJECT FILE',
  'Ver 4 SubVer 00',
  'Copyright IDE YAPI',
  'ideCAD',
  'CArchive',
  'CFile',
  '.ide11',
  '.ide10',
];

const foundStrings = [];

for (let offset = 0; offset < stat.size; offset += chunkSize) {
  const bytesToRead = Math.min(chunkSize + 4096, stat.size - offset);
  fs.readSync(fd, buf, 0, bytesToRead, offset);
  
  for (const t of stringTargets) {
    // ASCII
    let idx = buf.indexOf(t, 0, 'ascii');
    while (idx !== -1 && idx < chunkSize) {
      const fileOff = offset + idx;
      const mapping = fileOffsetToRva(fileOff);
      foundStrings.push({ type: 'ASCII', target: t, fileOff: '0x' + fileOff.toString(16), mapping });
      idx = buf.indexOf(t, idx + 1, 'ascii');
    }
    // UTF16LE
    const tBuf = Buffer.from(t, 'utf16le');
    let idx16 = buf.indexOf(tBuf);
    while (idx16 !== -1 && idx16 < chunkSize) {
      const fileOff = offset + idx16;
      const mapping = fileOffsetToRva(fileOff);
      foundStrings.push({ type: 'UTF16', target: t, fileOff: '0x' + fileOff.toString(16), mapping });
      idx16 = buf.indexOf(tBuf, idx16 + 1);
    }
  }
}

console.log('\n--- Found Strings ---');
for (const s of foundStrings) {
  if (s.target !== 'ideCAD' || foundStrings.filter(x => x.target === 'ideCAD').indexOf(s) < 5) {
    console.log(`[${s.type}] "${s.target}" at File: ${s.fileOff}, RVA: ${s.mapping?.rva}, VA: ${s.mapping?.va} (${s.mapping?.section})`);
  }
}
console.log(`Total string matches: ${foundStrings.length}`);

// Look for CRC32 constant: 0xedb88320 (LE: 20 83 b8 ed)
console.log('\n--- Searching for CRC32 polynomial (0xedb88320) ---');
const crcPoly = Buffer.from([0x20, 0x83, 0xb8, 0xed]);
for (let offset = 0; offset < stat.size; offset += chunkSize) {
  const bytesToRead = Math.min(chunkSize + 4096, stat.size - offset);
  fs.readSync(fd, buf, 0, bytesToRead, offset);
  let idx = buf.indexOf(crcPoly);
  while (idx !== -1 && idx < chunkSize) {
    const fileOff = offset + idx;
    const mapping = fileOffsetToRva(fileOff);
    console.log(`CRC32 0xedb88320 at File: 0x${fileOff.toString(16)}, RVA: ${mapping?.rva}, VA: ${mapping?.va} (${mapping?.section})`);
    idx = buf.indexOf(crcPoly, idx + 1);
  }
}

// Look for version constants: 201094 (0x31176 LE: 76 11 03 00) and 211220 (0x33914 LE: 14 39 03 00)
console.log('\n--- Searching for Version constants (201094 and 211220) ---');
const v10Buf = Buffer.from([0x76, 0x11, 0x03, 0x00]);
const v11Buf = Buffer.from([0x14, 0x39, 0x03, 0x00]);

for (let offset = 0; offset < stat.size; offset += chunkSize) {
  const bytesToRead = Math.min(chunkSize + 4096, stat.size - offset);
  fs.readSync(fd, buf, 0, bytesToRead, offset);
  
  let idx10 = buf.indexOf(v10Buf);
  while (idx10 !== -1 && idx10 < chunkSize) {
    const fileOff = offset + idx10;
    const mapping = fileOffsetToRva(fileOff);
    if (mapping?.section === '.text' || mapping?.section === '.rdata') {
      console.log(`v10 (201094) at File: 0x${fileOff.toString(16)}, RVA: ${mapping?.rva}, VA: ${mapping?.va} (${mapping?.section})`);
    }
    idx10 = buf.indexOf(v10Buf, idx10 + 1);
  }

  let idx11 = buf.indexOf(v11Buf);
  while (idx11 !== -1 && idx11 < chunkSize) {
    const fileOff = offset + idx11;
    const mapping = fileOffsetToRva(fileOff);
    if (mapping?.section === '.text' || mapping?.section === '.rdata') {
      console.log(`v11 (211220) at File: 0x${fileOff.toString(16)}, RVA: ${mapping?.rva}, VA: ${mapping?.va} (${mapping?.section})`);
    }
    idx11 = buf.indexOf(v11Buf, idx11 + 1);
  }
}

// Look for code references (XREFs) to the header strings in .text
console.log('\n--- Searching for XREFs in .text to 0x1451f2b00 ("IDE BUILDING...") ---');
const textSec = sections.find(s => s.name === '.text');
const textBuf = Buffer.alloc(textSec.rawSize);
fs.readSync(fd, textBuf, 0, textSec.rawSize, textSec.rawPtr);

// Target VA: 0x1451f2b00
const targetVa = 0x1451f2b00n;
const targetVaAlt = 0x1451f12c2n; // "Ver 4 SubVer 00"

for (let i = 0; i < textBuf.length - 7; i++) {
  // Check common x86_64 RIP-relative LEA / MOV:
  // 48 8d 0d [disp32] -> lea rcx, [rip + disp32]
  // 48 8d 15 [disp32] -> lea rdx, [rip + disp32]
  // 4c 8d 05 [disp32] -> lea r8, [rip + disp32]
  // 4c 8d 0d [disp32] -> lea r9, [rip + disp32]
  // 48 8d ...
  const b0 = textBuf[i];
  const b1 = textBuf[i + 1];
  const b2 = textBuf[i + 2];

  // Any 7-byte instruction with REX.W prefix (0x48, 0x4c) and ModR/M [rip + disp32] (b2 & 0xC7 == 0x05)
  if ((b0 === 0x48 || b0 === 0x4c) && (b2 & 0xc7) === 0x05) {
    const disp32 = textBuf.readInt32LE(i + 3);
    const instrVa = imageBase + BigInt(textSec.virtAddr + i);
    const target = instrVa + 7n + BigInt(disp32);
    if (target === targetVa || target === targetVaAlt) {
      console.log(`Found RIP-relative ref at code VA: 0x${instrVa.toString(16)} (RVA: 0x${(textSec.virtAddr + i).toString(16)}), opcode: ${textBuf.subarray(i, i + 7).toString('hex')}, target: 0x${target.toString(16)}`);
    }
  }

  // Any 6-byte instruction without REX prefix (e.g. 8d 05 [disp32] or 8b 05 [disp32])
  if ((b1 & 0xc7) === 0x05) {
    const disp32 = textBuf.readInt32LE(i + 2);
    const instrVa = imageBase + BigInt(textSec.virtAddr + i);
    const target = instrVa + 6n + BigInt(disp32);
    if (target === targetVa || target === targetVaAlt) {
      console.log(`Found 6-byte RIP ref at code VA: 0x${instrVa.toString(16)} (RVA: 0x${(textSec.virtAddr + i).toString(16)}), opcode: ${textBuf.subarray(i, i + 6).toString('hex')}, target: 0x${target.toString(16)}`);
    }
  }
}

fs.closeSync(fd);
