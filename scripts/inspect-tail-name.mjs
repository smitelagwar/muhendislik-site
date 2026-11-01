import fs from 'fs';

const filePath = 'C:\\Users\\hsyn\\Desktop\\SON\\7_KAT_5000M2_BINA.ide10';
const fd = fs.openSync(filePath, 'r');

const buf = Buffer.alloc(512);
fs.readSync(fd, buf, 0, 512, 0x8a949f0);

console.log('Hex around 0x8a94a00:');
console.log(buf.subarray(0, 128).toString('hex'));

const len = buf.readUInt32LE(16);
const str = buf.toString('latin1', 20, 20 + len - 1);
console.log(`At 0x8a94a00, len: ${len}, string: "${str}"`);

fs.closeSync(fd);
