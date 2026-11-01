import fs from 'fs';

const filePath = 'C:\\Users\\hsyn\\Desktop\\SON\\7_KAT_5000M2_BINA.ide10';
const fd = fs.openSync(filePath, 'r');

// Read Floor 0 bytes (0x3f990 .. 0x4a730)
const start = 0x3f990;
const length = 0x4a730 - 0x3f990;
const buf = Buffer.alloc(length);
fs.readSync(fd, buf, 0, length, start);

console.log('=== FLOOR 0 STRUCTURE (0x3f990 to 0x4a730) ===');
console.log('Floor 0 Header at 0x3f99b:');
console.log(buf.subarray(0, 64).toString('hex'));

// At 0x3f997 (offset 7 in buf): length of floor name
const nameLen = buf.readUInt32LE(7);
const name = buf.toString('latin1', 11, 11 + nameLen - 1);
console.log(`Floor Name: "${name}" (len: ${nameLen})`);

const at = 11 + nameLen - 1; // end of name (after null)
// elevation is at + length, height is at + length + 8 in parseIde10
// in parseIde10: at = i + 4 where i was name length offset
// so elevation is at 7 + 4 + nameLen = 11 + nameLen
const elev = buf.readDoubleLE(11 + nameLen);
const height = buf.readDoubleLE(11 + nameLen + 8);
console.log(`Elevation: ${elev}, Height: ${height}`);

// Now let's see what follows elevation and height
const postHeaderOff = 11 + nameLen + 16;
console.log(`Post-header bytes at offset 0x${(start + postHeaderOff).toString(16)}:`);
console.log(buf.subarray(postHeaderOff, postHeaderOff + 64).toString('hex'));

// Scan for all elements inside this floor block!
// In parseIde10: candidates have color bracketed around 1,000,000,000 at at + length
const KNOWN_TYPES = { 2: "wall", 4: "column", 5: "beam", 6: "axis", 7: "slab", 13: "slabHole", 17: "wall", 40: "stair", 44: "line", 45: "slabEdge", 123: "section", 128: "band" };

const elementsInFloor = [];
for (let p = 0; p < length - 64; p++) {
  // primitiveType check
  const primType = buf.readUInt32LE(p);
  if (KNOWN_TYPES[primType]) {
    const ptCount = buf.readUInt32LE(p + 4);
    if (ptCount >= 1 && ptCount <= 200) {
      const tail = p + 8 + ptCount * 16;
      if (tail + 40 < length) {
        const nativeId = buf.readUInt32LE(tail);
        const nativeZ = buf.readDoubleLE(tail + 4);
        const width = buf.readDoubleLE(tail + 12);
        const layerId = buf.readUInt32LE(tail + 20);
        if (nativeId > 0 && Math.abs(nativeZ) < 1000 && width >= 0 && width < 1000) {
          elementsInFloor.push({
            fileOff: '0x' + (start + p).toString(16),
            relOff: p,
            primType,
            typeName: KNOWN_TYPES[primType],
            ptCount,
            nativeId,
            nativeZ,
            width,
            layerId
          });
        }
      }
    }
  }
}

console.log(`\nFound ${elementsInFloor.length} element geometries in Floor 0:`);
for (const el of elementsInFloor.slice(0, 15)) {
  console.log(`${el.fileOff}: Type ${el.primType} (${el.typeName}), pts: ${el.ptCount}, id: ${el.nativeId}, w: ${el.width}`);
}

fs.closeSync(fd);
