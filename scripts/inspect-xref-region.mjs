import fs from 'fs';

const exePath = 'C:\\Program Files\\ideCAD\\ideCAD Statik 11 Deneme\\ideCAD_Statik_11_Deneme.exe';
const fd = fs.openSync(exePath, 'r');

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

function rvaToFileOffset(rva) {
  for (const sec of sections) {
    if (rva >= sec.virtAddr && rva < sec.virtAddr + sec.virtSize) {
      return sec.rawPtr + (rva - sec.virtAddr);
    }
  }
  return null;
}

function vaToFileOffset(va) {
  const rva = Number(BigInt(va) - imageBase);
  return rvaToFileOffset(rva);
}

// Inspect around 0x1409889b9 (RVA 0x9889b9)
console.log('--- Inspecting Code at RVA 0x988900 to 0x988B00 ---');
const rawStart = rvaToFileOffset(0x988900);
const codeBuf = Buffer.alloc(0x600);
fs.readSync(fd, codeBuf, 0, 0x600, rawStart);

// Let's search for calls and string refs in this block
for (let i = 0; i < codeBuf.length - 5; i++) {
  const rva = 0x988900 + i;
  const va = imageBase + BigInt(rva);
  const b = codeBuf[i];

  // Call rel32: E8 [disp32]
  if (b === 0xe8) {
    const disp32 = codeBuf.readInt32LE(i + 1);
    const targetRva = rva + 5 + disp32;
    const targetVa = va + 5n + BigInt(disp32);
    // Find what function this target is if possible
    console.log(`0x${va.toString(16)}: CALL rel32 -> 0x${targetVa.toString(16)} (RVA 0x${targetRva.toString(16)})`);
  }

  // JMP / Jcc rel32: E9 [disp32] / 0F 8x [disp32]
  if (b === 0xe9) {
    const disp32 = codeBuf.readInt32LE(i + 1);
    const targetVa = va + 5n + BigInt(disp32);
    console.log(`0x${va.toString(16)}: JMP rel32 -> 0x${targetVa.toString(16)}`);
  }

  // RIP-relative references
  if (b === 0x48 && (codeBuf[i + 2] & 0xc7) === 0x05) {
    const disp32 = codeBuf.readInt32LE(i + 3);
    const targetVa = va + 7n + BigInt(disp32);
    const targetFileOff = vaToFileOffset(targetVa);
    let strPreview = '';
    if (targetFileOff) {
      const peekBuf = Buffer.alloc(64);
      fs.readSync(fd, peekBuf, 0, 64, targetFileOff);
      strPreview = peekBuf.toString('ascii', 0, 48).replace(/[\r\n\0]/g, ' ');
    }
    console.log(`0x${va.toString(16)}: [RIP ref] -> 0x${targetVa.toString(16)} | "${strPreview}"`);
  }
}

fs.closeSync(fd);
