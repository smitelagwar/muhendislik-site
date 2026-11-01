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

// 0x1406908a9 is at RVA 0x6908a9
// Let's find function start by scanning backwards for 0xcc or function prologue
const rawOff = rvaToFileOffset(0x6908a9);
const peekBuf = Buffer.alloc(0x300);
fs.readSync(fd, peekBuf, 0, 0x300, rawOff - 0x100);

let funcStartRva = 0x6908a9;
for (let p = 0x100; p >= 0; p--) {
  // Check for CC int3 or C3 ret or standard prologue (48 89 / 48 83 / 55 push rbp)
  if (peekBuf[p] === 0xcc || peekBuf[p] === 0xc3) {
    funcStartRva = 0x6908a9 - 0x100 + p + 1;
    break;
  }
}

const funcStartVa = imageBase + BigInt(funcStartRva);
console.log(`CRC function estimated start: RVA 0x${funcStartRva.toString(16)}, VA 0x${funcStartVa.toString(16)}`);

// Disassemble/dump 128 bytes from funcStart
const funcBytes = Buffer.alloc(256);
fs.readSync(fd, funcBytes, 0, 256, rvaToFileOffset(funcStartRva));
console.log('Function hex:', funcBytes.subarray(0, 80).toString('hex'));

// Now search .text for CALLs to funcStartVa
console.log(`\nSearching for CALLs to CRC function (RVA 0x${funcStartRva.toString(16)})...`);
const textSec = sections.find(s => s.name === '.text');
const textBuf = Buffer.alloc(textSec.rawSize);
fs.readSync(fd, textBuf, 0, textSec.rawSize, textSec.rawPtr);

for (let i = 0; i < textBuf.length - 5; i++) {
  if (textBuf[i] === 0xe8) {
    const disp32 = textBuf.readInt32LE(i + 1);
    const rva = textSec.virtAddr + i;
    const targetRva = rva + 5 + disp32;
    if (targetRva === funcStartRva || Math.abs(targetRva - funcStartRva) < 0x20) {
      const callerVa = imageBase + BigInt(rva);
      console.log(`CALL from VA: 0x${callerVa.toString(16)} (RVA: 0x${rva.toString(16)}) -> 0x${(imageBase + BigInt(targetRva)).toString(16)}`);
    }
  }
}

fs.closeSync(fd);
