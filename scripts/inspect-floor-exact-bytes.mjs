import fs from 'fs';

const filePath = 'C:\\Users\\hsyn\\Desktop\\SON\\7_KAT_5000M2_BINA.ide10';
const buf = fs.readFileSync(filePath);
const bytes = new Uint8Array(buf.buffer);
const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);

// Check Floor 0 header at 0x3f997
const f0_off = 0x3f997;
const f0_len = view.getUint32(f0_off, true);
console.log('Floor 0 length:', f0_len);
const f0_name = Buffer.from(bytes.subarray(f0_off + 4, f0_off + 3 + f0_len)).toString('latin1');
console.log('Floor 0 name:', f0_name);

const data = f0_off + 4 + f0_len;
console.log('Elevation:', view.getFloat64(data, true));
console.log('Height:', view.getFloat64(data + 8, true));
console.log('Ordinal:', view.getInt32(data + 16, true));
console.log('Flag (data+20):', view.getUint32(data + 20, true));
console.log('Marker (data+24):', '0x' + view.getUint32(data + 24, true).toString(16));

const viewport = data + (view.getUint32(74, true) >= 211150 ? 4 : 0);
console.log('viewScale:', view.getFloat64(viewport + 28, true));
for (let j = 0; j < 4; j++) {
  console.log(`coord ${j}:`, view.getFloat64(viewport + 36 + j * 16, true), view.getFloat64(viewport + 44 + j * 16, true));
}

// Find title string
const decoder = new TextDecoder("windows-1254");
for (let p = data + 100; p < Math.min(bytes.length - 165, data + 1800); p++) {
  const l = view.getUint32(p, true);
  if (l >= 1 && l <= 161 && p + 4 + l <= bytes.length && bytes[p + 3 + l] === 0) {
    const text = decoder.decode(bytes.subarray(p + 4, p + 3 + l));
    if (text.includes('TAVANI')) {
      console.log(`Found title string at 0x${p.toString(16)}: "${text}"`);
    }
  }
}

// Check Floor 1 header at 0x4a720
const f1_off = 0x4a71c; // length prefix offset
const f1_len = view.getUint32(f1_off, true);
console.log('\nFloor 1 length prefix at 0x' + f1_off.toString(16) + ':', f1_len);
const f1_name = Buffer.from(bytes.subarray(f1_off + 4, f1_off + 3 + f1_len)).toString('latin1');
console.log('Floor 1 name:', f1_name);
console.log('Bytes preceding Floor 1 (template check):');
console.log(Buffer.from(bytes.subarray(f1_off - 16, f1_off + 4)).toString('hex'));
console.log('Preceding text:', Buffer.from(bytes.subarray(f1_off - 16, f1_off)).toString('latin1'));
