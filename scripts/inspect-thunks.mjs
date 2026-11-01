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

// 0x1445df740 is at RVA 0x45df740
const raw40 = rvaToFileOffset(0x45df740);
const b40 = Buffer.alloc(32);
fs.readSync(fd, b40, 0, 32, raw40);
console.log('Bytes at 0x1445df740:');
console.log(b40.toString('hex'));

// 0x1445df752 is at RVA 0x45df752
const raw52 = rvaToFileOffset(0x45df752);
const b52 = Buffer.alloc(32);
fs.readSync(fd, b52, 0, 32, raw52);
console.log('Bytes at 0x1445df752:');
console.log(b52.toString('hex'));

// Check if these are JMP [RIP + disp32] (import thunk FF 25 ...)
if (b40[0] === 0xff && b40[1] === 0x25) {
  const disp32 = b40.readInt32LE(2);
  const targetVa = 0x1445df740n + 6n + BigInt(disp32);
  console.log(`0x1445df740 is JMP [0x${targetVa.toString(16)}]`);
}

if (b52[0] === 0xff && b52[1] === 0x25) {
  const disp32 = b52.readInt32LE(2);
  const targetVa = 0x1445df752n + 6n + BigInt(disp32);
  console.log(`0x1445df752 is JMP [0x${targetVa.toString(16)}]`);
}

fs.closeSync(fd);
