import fs from 'fs';

const filePath = 'C:\\Users\\hsyn\\Desktop\\SON\\7_KAT_5000M2_BINA.ide10';
const fd = fs.openSync(filePath, 'r');

const buf = Buffer.alloc(2048);
fs.readSync(fd, buf, 0, 2048, 0x24400);

console.log('Bytes from 0x24400 to 0x24600:');
for (let p = 0; p < 512; p += 4) {
  const fileOff = 0x24400 + p;
  const len = buf.readUInt32LE(p);
  if (len >= 2 && len <= 128 && p + 4 + len <= 2048 && buf[p + 3 + len] === 0) {
    let printable = true;
    for (let j = p + 4; j < p + 3 + len; j++) {
      if (buf[j] < 32 || buf[j] === 127 || buf[j] === 255) {
        printable = false;
        break;
      }
    }
    if (printable) {
      const s = buf.toString('latin1', p + 4, p + 3 + len);
      console.log(`0x${fileOff.toString(16)} (len: ${len}): "${s}"`);
    }
  }
}

// Show the surrounding hex bytes around 0x24505
const relOff = 0x24505 - 0x24400;
console.log('\nHex around 0x24505:');
console.log(buf.subarray(relOff - 16, relOff + 36).toString('hex'));

fs.closeSync(fd);
