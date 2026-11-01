import fs from 'fs';

const exePath = 'C:\\Program Files\\ideCAD\\ideCAD Statik 11 Deneme\\ideCAD_Statik_11_Deneme.exe';
const fd = fs.openSync(exePath, 'r');

const headerBuf = Buffer.alloc(4096);
fs.readSync(fd, headerBuf, 0, 4096, 0);
const peOffset = headerBuf.readUInt32LE(0x3C);
const optHeaderOffset = peOffset + 24;
const imageBase = headerBuf.readBigUInt64LE(optHeaderOffset + 24);
const rsrcDirRva = headerBuf.readUInt32LE(optHeaderOffset + 112 + 16); // Resource Directory

const numSections = headerBuf.readUInt16LE(peOffset + 6);
const optHeaderSize = headerBuf.readUInt16LE(peOffset + 20);
const sectionHeadersOffset = peOffset + 24 + optHeaderSize;
const sections = [];
for (let i = 0; i < numSections; i++) {
  const secBuf = headerBuf.subarray(sectionHeadersOffset + i * 40, sectionHeadersOffset + (i + 1) * 40);
  const name = secBuf.toString('ascii', 0, 8).replace(/\0+$/, '');
  const virtAddr = secBuf.readUInt32LE(12);
  const virtSize = secBuf.readUInt32LE(8);
  const rawPtr = secBuf.readUInt32LE(20);
  const rawSize = secBuf.readUInt32LE(16);
  sections.push({ name, virtAddr, virtSize, rawPtr, rawSize });
}

function rvaToFileOffset(rva) {
  for (const sec of sections) {
    if (rva >= sec.virtAddr && rva < sec.virtAddr + sec.virtSize) return sec.rawPtr + (rva - sec.virtAddr);
  }
  return null;
}

const rsrcSec = sections.find(s => s.name === '.rsrc');
console.log('rsrcDirRva: 0x' + rsrcDirRva.toString(16), 'rawPtr: 0x' + rsrcSec.rawPtr.toString(16));

// In .rsrc, directory entries are relative to the root of the resource section
const rsrcBaseFileOff = rsrcSec.rawPtr;

function readResourceDir(dirOff, depth = 0) {
  const dirBuf = Buffer.alloc(16);
  fs.readSync(fd, dirBuf, 0, 16, rsrcBaseFileOff + dirOff);
  const numNamed = dirBuf.readUInt16LE(12);
  const numId = dirBuf.readUInt16LE(14);
  const entries = [];
  const entriesBuf = Buffer.alloc((numNamed + numId) * 8);
  fs.readSync(fd, entriesBuf, 0, entriesBuf.length, rsrcBaseFileOff + dirOff + 16);

  for (let i = 0; i < numNamed + numId; i++) {
    const nameOrId = entriesBuf.readUInt32LE(i * 8);
    const dataOrSubDir = entriesBuf.readUInt32LE(i * 8 + 4);
    const isSubDir = (dataOrSubDir & 0x80000000) !== 0;
    const offset = dataOrSubDir & 0x7fffffff;
    entries.push({ nameOrId, isSubDir, offset });
  }
  return entries;
}

// Find RT_STRING (ID = 6)
const rootEntries = readResourceDir(0);
const stringEntry = rootEntries.find(e => !e.isNamed && e.nameOrId === 6);
if (stringEntry) {
  console.log('Found RT_STRING dir at offset 0x' + stringEntry.offset.toString(16));
  const blockEntries = readResourceDir(stringEntry.offset);
  console.log(`Found ${blockEntries.length} string blocks`);

  for (const block of blockEntries) {
    const blockId = block.nameOrId;
    // Check if this block contains our IDs (521 -> block 33, etc.)
    if (blockId >= 32 && blockId <= 40) {
      // Get language dir
      const langEntries = readResourceDir(block.offset);
      for (const lang of langEntries) {
        // Data entry
        const dataBuf = Buffer.alloc(16);
        fs.readSync(fd, dataBuf, 0, 16, rsrcBaseFileOff + lang.offset);
        const dataRva = dataBuf.readUInt32LE(0);
        const dataSize = dataBuf.readUInt32LE(4);
        const dataFileOff = rvaToFileOffset(dataRva);

        const stringsBuf = Buffer.alloc(dataSize);
        fs.readSync(fd, stringsBuf, 0, dataSize, dataFileOff);

        let p = 0;
        for (let i = 0; i < 16; i++) {
          const stringId = (blockId - 1) * 16 + i;
          if (p >= stringsBuf.length) break;
          const len = stringsBuf.readUInt16LE(p);
          p += 2;
          if (len > 0) {
            const str = stringsBuf.toString('utf16le', p, p + len * 2);
            p += len * 2;
            console.log(`String ID ${stringId} (0x${stringId.toString(16)}): "${str}"`);
          }
        }
      }
    }
  }
}

fs.closeSync(fd);
