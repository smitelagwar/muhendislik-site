import fs from 'fs';

const filePath = 'C:\\Users\\hsyn\\Desktop\\SON\\7_KAT_5000M2_BINA.ide10';
const fd = fs.openSync(filePath, 'r');
const stat = fs.fstatSync(fd);

// Read chunks to find primitiveType === 4
const chunkSize = 4 * 1024 * 1024;
const buf = Buffer.alloc(chunkSize);

let foundCol = null;

for (let offset = 0x3f990; offset < 0x2000000; offset += chunkSize - 4096) {
  const bytesToRead = Math.min(chunkSize, stat.size - offset);
  fs.readSync(fd, buf, 0, bytesToRead, offset);

  for (let p = 0; p < bytesToRead - 100; p++) {
    if (buf.readUInt32LE(p) === 4) { // primitiveType: 4 (column)
      const ptCount = buf.readUInt32LE(p + 4);
      if (ptCount >= 4 && ptCount <= 8) { // columns usually have 4 points (polygon)
        const tail = p + 8 + ptCount * 16;
        if (tail + 40 < bytesToRead) {
          const nativeId = buf.readUInt32LE(tail);
          const nativeZ = buf.readDoubleLE(tail + 4);
          const width = buf.readDoubleLE(tail + 12);
          const layerId = buf.readUInt32LE(tail + 20);
          if (nativeId > 0 && Math.abs(nativeZ) < 1000 && width >= 0 && width < 100) {
            foundCol = {
              fileOff: '0x' + (offset + p).toString(16),
              ptCount,
              nativeId,
              nativeZ,
              width,
              layerId,
              offset: offset + p
            };
            break;
          }
        }
      }
    }
  }
  if (foundCol) break;
}

if (foundCol) {
  console.log('Found Column at file offset:', foundCol.fileOff);
  console.log(foundCol);

  // Read 1024 bytes around this column
  const colBuf = Buffer.alloc(1024);
  fs.readSync(fd, colBuf, 0, 1024, foundCol.offset);

  // Find strings
  for (let p = 0; p < 1024 - 8; p++) {
    const l = colBuf.readUInt32LE(p);
    if (l >= 2 && l <= 50 && p + 4 + l <= 1024 && colBuf[p + 3 + l] === 0) {
      const s = colBuf.toString('latin1', p + 4, p + 3 + l);
      console.log(`String at +0x${p.toString(16)} (0x${(foundCol.offset + p).toString(16)}): "${s}"`);
    }
  }
} else {
  console.log('No column found in the scanned range');
}

fs.closeSync(fd);
