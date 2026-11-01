import fs from 'fs';

const filePath = 'C:\\Users\\hsyn\\Desktop\\SON\\7_KAT_5000M2_BINA.ide10';
const fd = fs.openSync(filePath, 'r');

// Gap between 0x40417 (name of P43) and 0x41978 (start of P44 geometry)
const gapStart = 0x40417;
const gapLen = 0x41978 - gapStart;
const buf = Buffer.alloc(gapLen);
fs.readSync(fd, buf, 0, gapLen, gapStart);

console.log(`=== GAP BETWEEN ELEMENT 6129634 AND 6129635 (${gapLen} bytes) ===`);
console.log('Start (0x40417): Name and attributes');
// Name length at 0 is at 0x40413
// buf[0..] is nameOffset in parseIde10
console.log('Hex dump of first 128 bytes after nameOffset:');
console.log(buf.subarray(0, 128).toString('hex'));

// Find any strings in this gap
for (let p = 0; p < gapLen - 8; p++) {
  const len = buf.readUInt32LE(p);
  if (len >= 2 && len <= 100 && p + 4 + len <= gapLen && buf[p + 3 + len] === 0) {
    let printable = true;
    for (let j = p + 4; j < p + 3 + len; j++) {
      if (buf[j] < 32 || buf[j] === 127 || buf[j] === 255) { printable = false; break; }
    }
    if (printable) {
      console.log(`String at gap offset 0x${p.toString(16)} (file: 0x${(gapStart + p).toString(16)}): "${buf.toString('latin1', p + 4, p + 3 + len)}"`);
    }
  }
}

fs.closeSync(fd);
