import fs from 'fs';

const filePath = 'C:\\Users\\hsyn\\Desktop\\SON\\7_KAT_5000M2_BINA.ide10';
const buf = fs.readFileSync(filePath);
const bytes = new Uint8Array(buf.buffer);
const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);

const names = new Set();
const prefixes = {};

for (let i = 24; i < bytes.length - 24; i++) {
  const length = view.getUint32(i, true);
  if (length < 2 || length > 40 || i + 4 + length + 20 > bytes.length || bytes[i + 3 + length] !== 0) continue;
  const at = i + 4;
  if (at < 21) continue;
  const color = view.getUint32(at + length, true);
  if (color < 999999000 || color > 1000001000) continue;

  const name = Buffer.from(buf.buffer, at, length - 1).toString('latin1');
  names.add(name);
  const prefix = name.replace(/\d+.*$/, '') || 'numbers';
  prefixes[prefix] = (prefixes[prefix] || 0) + 1;
}

console.log('Unique name count:', names.size);
console.log('Prefixes histogram:', prefixes);
console.log('Sample names (first 40):', Array.from(names).slice(0, 40));
