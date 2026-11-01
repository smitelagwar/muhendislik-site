import fs from 'fs';

const filePath = 'C:\\Users\\hsyn\\Desktop\\SON\\7_KAT_5000M2_BINA.ide10';
const fd = fs.openSync(filePath, 'r');

const start = 0x40699;
const len = 0x41978 - start;
const buf = Buffer.alloc(len);
fs.readSync(fd, buf, 0, len, start);

console.log(`Analyzing block from 0x40699 to 0x41978 (${len} bytes)...`);

for (let p = 0; p < len - 8; p++) {
  const l = buf.readUInt32LE(p);
  if (l >= 2 && l <= 100 && p + 4 + l <= len && buf[p + 3 + l] === 0) {
    let printable = true;
    for (let j = p + 4; j < p + 3 + l; j++) {
      if (buf[j] < 32 || buf[j] === 127 || buf[j] === 255) { printable = false; break; }
    }
    if (printable) {
      console.log(`String at 0x${(start + p).toString(16)}: "${buf.toString('latin1', p + 4, p + 3 + l)}"`);
    }
  }
}

// Check for float arrays or integers
console.log('\nChecking sub-blocks:');
for (let p = 0; p < len - 16; p += 4) {
  // Check if there is an embedded count or tag
  const tag = buf.readUInt32LE(p);
  if (tag === 0x4327 || tag === 0x6129634) {
    console.log(`Tag 0x${tag.toString(16)} at offset 0x${(start + p).toString(16)}`);
  }
}

fs.closeSync(fd);
