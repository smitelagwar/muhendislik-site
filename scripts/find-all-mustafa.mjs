import fs from 'fs';

const filePath = 'C:\\Users\\hsyn\\Desktop\\SON\\7_KAT_5000M2_BINA.ide10';
const fd = fs.openSync(filePath, 'r');
const stat = fs.fstatSync(fd);

const chunkSize = 16 * 1024 * 1024;
const buf = Buffer.alloc(chunkSize + 1024);

console.log(`Searching for "MUSTAFA" and "SELV" in ${filePath} (${(stat.size / 1024 / 1024).toFixed(1)} MB)...`);

for (let offset = 0; offset < stat.size; offset += chunkSize) {
  const bytesToRead = Math.min(chunkSize + 1024, stat.size - offset);
  fs.readSync(fd, buf, 0, bytesToRead, offset);

  let idx = buf.indexOf('MUSTAFA', 0, 'latin1');
  while (idx !== -1 && idx < chunkSize) {
    const fileOff = offset + idx;
    console.log(`Found "MUSTAFA" at file offset: 0x${fileOff.toString(16)} (${fileOff})`);
    idx = buf.indexOf('MUSTAFA', idx + 1, 'latin1');
  }

  let idx2 = buf.indexOf('SELV', 0, 'latin1');
  while (idx2 !== -1 && idx2 < chunkSize) {
    const fileOff = offset + idx2;
    console.log(`Found "SELV" at file offset: 0x${fileOff.toString(16)} (${fileOff})`);
    idx2 = buf.indexOf('SELV', idx2 + 1, 'latin1');
  }
}

fs.closeSync(fd);
