import fs from 'fs';

const exePath = 'C:\\Program Files\\ideCAD\\ideCAD Statik 11 Deneme\\ideCAD_Statik_11_Deneme.exe';
const fd = fs.openSync(exePath, 'r');

const headerBuf = Buffer.alloc(4096);
fs.readSync(fd, headerBuf, 0, 4096, 0);
const peOffset = headerBuf.readUInt32LE(0x3C);
const optHeaderOffset = peOffset + 24;
const optMagic = headerBuf.readUInt16LE(optHeaderOffset);
const imageBase = headerBuf.readBigUInt64LE(optHeaderOffset + 24);

// Data Directory for Imports is at optHeaderOffset + (optMagic === 0x20b ? 112 + 8 : 96 + 8) -> offset 120 (Import Table)
const importDirRva = headerBuf.readUInt32LE(optHeaderOffset + 112 + 8);
const importDirSize = headerBuf.readUInt32LE(optHeaderOffset + 112 + 12);

const numSections = headerBuf.readUInt16LE(peOffset + 6);
const optHeaderSize = headerBuf.readUInt16LE(peOffset + 20);
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

console.log('Import Dir RVA: 0x' + importDirRva.toString(16) + ', Size: 0x' + importDirSize.toString(16));

// Target IAT VAs: 0x144946e58 (RVA 0x4946e58), 0x144946e60 (RVA 0x4946e60)
const targetRva1 = 0x4946e58;
const targetRva2 = 0x4946e60;

let descOffset = rvaToFileOffset(importDirRva);
while (true) {
  const descBuf = Buffer.alloc(20);
  fs.readSync(fd, descBuf, 0, 20, descOffset);
  const origFirstThunk = descBuf.readUInt32LE(0);
  const nameRva = descBuf.readUInt32LE(12);
  const firstThunk = descBuf.readUInt32LE(16);
  if (!firstThunk && !nameRva) break;

  const dllNameBuf = Buffer.alloc(128);
  fs.readSync(fd, dllNameBuf, 0, 128, rvaToFileOffset(nameRva));
  const dllName = dllNameBuf.toString('ascii').split('\0')[0];

  // Walk thunks
  let thunkRva = origFirstThunk || firstThunk;
  let iatRva = firstThunk;
  let thunkFileOff = rvaToFileOffset(thunkRva);

  while (true) {
    const entryBuf = Buffer.alloc(8);
    fs.readSync(fd, entryBuf, 0, 8, thunkFileOff);
    const val = entryBuf.readBigUInt64LE(0);
    if (!val) break;

    if (iatRva === targetRva1 || iatRva === targetRva2) {
      if ((val & 0x8000000000000000n) === 0n) {
        const hintNameRva = Number(val & 0x7ffffffffn);
        const hnBuf = Buffer.alloc(128);
        fs.readSync(fd, hnBuf, 0, 128, rvaToFileOffset(hintNameRva));
        const hint = hnBuf.readUInt16LE(0);
        const funcName = hnBuf.toString('ascii', 2).split('\0')[0];
        console.log(`Match for IAT 0x${(imageBase + BigInt(iatRva)).toString(16)} (RVA 0x${iatRva.toString(16)}): DLL: ${dllName}, Function: ${funcName} (Hint: ${hint})`);
      } else {
        const ordinal = val & 0xffffn;
        console.log(`Match for IAT 0x${(imageBase + BigInt(iatRva)).toString(16)} (RVA 0x${iatRva.toString(16)}): DLL: ${dllName}, Ordinal: ${ordinal}`);
      }
    }

    thunkFileOff += 8;
    iatRva += 8;
  }

  descOffset += 20;
}

fs.closeSync(fd);
