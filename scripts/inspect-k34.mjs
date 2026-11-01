import fs from 'fs';

const filePath = 'C:\\Users\\hsyn\\Desktop\\SON\\7_KAT_5000M2_BINA.ide10';
const fd = fs.openSync(filePath, 'r');
const buf = Buffer.alloc(512);
fs.readSync(fd, buf, 0, 512, 0x14f549);

const nameLen = 4;
console.log('Color at +4:', buf.readUInt32LE(nameLen));
for (let i = 0; i < 400; i++) {
  const l = buf.readUInt32LE(i);
  if (l >= 2 && l <= 16 && i + 4 + l <= 512 && buf[i + 3 + l] === 0) {
    const s = buf.toString('latin1', i + 4, i + 3 + l);
    if (s.includes('/')) {
      console.log(`Section label at relative offset +${i}: ${s} (len: ${l})`);
    }
  }
}
const heightOff = nameLen + 266;
console.log(`Height float64 at +${heightOff}:`, buf.readDoubleLE(heightOff));
fs.closeSync(fd);
