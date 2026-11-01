import fs from 'fs';

const filePath = 'C:\\Users\\hsyn\\Desktop\\SON\\7_KAT_5000M2_BINA.ide10';
const fd = fs.openSync(filePath, 'r');

// Read the first 400 KB of the file
const size = 0x45000;
const buf = Buffer.alloc(size);
fs.readSync(fd, buf, 0, size, 0);

console.log('=== IDE FILE SKELETON MAPPER ===');
console.log('Header Signature (0..73):', JSON.stringify(buf.toString('ascii', 0, 74)));
console.log('Version (74..77):', buf.readUInt32LE(74));
console.log('Demo/Encoded Flag (78):', buf[78]);
console.log('File Length in Header (79..82):', buf.readUInt32LE(79));
console.log('Stored CRC32 (83..86):', '0x' + buf.readUInt32LE(83).toString(16));
console.log('Trailing byte (87):', buf[87]);

// Find all CP1254 strings between 88 and 0x3f99b (first floor)
console.log('\n--- Strings in Project Info & Pre-Storey Block (88 .. 0x3f99b) ---');
for (let p = 88; p < 0x3f99b; p++) {
  const len = buf.readUInt32LE(p);
  if (len >= 2 && len <= 128 && p + 4 + len <= size && buf[p + 3 + len] === 0) {
    let printable = true;
    for (let j = p + 4; j < p + 3 + len; j++) {
      if (buf[j] < 32 || buf[j] === 127 || buf[j] === 255) {
        printable = false;
        break;
      }
    }
    if (printable) {
      const str = buf.toString('latin1', p + 4, p + 3 + len);
      // check if followed by typical IDE tags or floats
      console.log(`0x${p.toString(16)} (len: ${len}): "${str}"`);
    }
  }
}

fs.closeSync(fd);
