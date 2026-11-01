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
const codeBuf = Buffer.alloc(0x200);
fs.readSync(fd, codeBuf, 0, 0x200, rawStart);

console.log('Bytes at 0x14073c170:');
console.log(codeBuf.subarray(0, 64).toString('hex'));

for (let i = 0; i < 128; i++) {
  const b = codeBuf[i];
  const va = 0x14073c170n + BigInt(i);
  if (b === 0xe8) {
    const disp32 = codeBuf.readInt32LE(i + 1);
    const targetVa = va + 5n + BigInt(disp32);
    console.log(`0x${va.toString(16)}: CALL rel32 -> 0x${targetVa.toString(16)}`);
  }
}

fs.closeSync(fd);
