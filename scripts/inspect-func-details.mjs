import fs from 'fs';

const exePath = 'C:\\Program Files\\ideCAD\\ideCAD Statik 11 Deneme\\ideCAD_Statik_11_Deneme.exe';
const fd = fs.openSync(exePath, 'r');

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

const rawStart = rvaToFileOffset(0x73c170);
const codeBuf = Buffer.alloc(0x400);
fs.readSync(fd, codeBuf, 0, 0x400, rawStart);

console.log('--- Disassembly / Analysis of 0x14073c170 ---');
for (let i = 0; i < codeBuf.length - 8; i++) {
  const rva = 0x73c170 + i;
  const va = imageBase + BigInt(rva);
  const b0 = codeBuf[i];

  // Call
  if (b0 === 0xe8) {
    const disp32 = codeBuf.readInt32LE(i + 1);
    const targetVa = va + 5n + BigInt(disp32);
    console.log(`0x${va.toString(16)}: CALL 0x${targetVa.toString(16)} (RVA 0x${(rva + 5 + disp32).toString(16)})`);
  }

  // RIP-relative instructions (48 8d / 48 8b / 4c 8d etc.)
  if ((b0 === 0x48 || b0 === 0x4c || b0 === 0x8b || b0 === 0x8d) && (codeBuf[i + 2] & 0xc7) === 0x05) {
    const disp32 = codeBuf.readInt32LE(i + 3);
    const targetVa = va + 7n + BigInt(disp32);
    console.log(`0x${va.toString(16)}: RIP-ref [disp: 0x${disp32.toString(16)}] -> 0x${targetVa.toString(16)}`);
  }

  // Look for immediate values or offsets: 88, 74, 83, 79
  // cmp / mov with 88 or 74
  if (codeBuf[i] === 0x83 && (codeBuf[i + 1] & 0x38) === 0x38 && codeBuf[i + 2] === 88) {
    console.log(`0x${va.toString(16)}: CMP reg, 88`);
  }
}

fs.closeSync(fd);
