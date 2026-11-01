import fs from 'fs';

const filePath = 'C:\\Users\\hsyn\\Desktop\\SON\\7_KAT_5000M2_BINA.ide10';
const buf = fs.readFileSync(filePath);
const bytes = new Uint8Array(buf.buffer);
const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);

console.log('Searching for columns (primitiveType === 4)...');

let foundCount = 0;
for (let i = 24; i < bytes.length - 24; i++) {
  const length = view.getUint32(i, true);
  if (length < 1 || length > 100 || i + 4 + length + 20 > bytes.length || bytes[i + 3 + length] !== 0) continue;

  const at = i + 4;
  if (at < 21) continue;
  const color = view.getUint32(at + length, true);
  if (color < 999999000 || color > 1000001000) continue;

  const bbox = [0, 1, 2, 3].map(j => view.getFloat32(at - 21 + j * 4, true));
  if (bbox[2] < bbox[0] || bbox[3] < bbox[1]) continue;

  const name = Buffer.from(buf.buffer, at, length - 1).toString('latin1');
  const bboxOffset = at - 21;

  for (let p = bboxOffset - 36; p >= Math.max(0, bboxOffset - 2000); p--) {
    const primitiveType = view.getUint32(p, true);
    if (primitiveType !== 4) continue;
    const count = view.getUint32(p + 4, true);
    if (count < 1 || count > 100) continue;

    const tail = p + 8 + count * 16;
    if (tail + 40 > at) continue;

    const nativeId = view.getUint32(tail, true);
    const nativeZ = view.getFloat64(tail + 4, true);
    const width = view.getFloat64(tail + 12, true);
    const layerId = view.getUint32(tail + 20, true);

    if (nativeId > 0 && Math.abs(nativeZ) < 1000 && width >= 0 && width < 1000) {
      let cursor = tail + 24;
      let valid = true;
      let rotation = 0;
      for (let list = 0; list < 3; list++) {
        if (cursor + 4 > bboxOffset) { valid = false; break; }
        const l = view.getUint32(cursor, true);
        cursor += 4;
        if (cursor + l * 4 > bboxOffset) { valid = false; break; }
        cursor += l * 4;
        if (list === 0) {
          rotation = view.getFloat64(cursor, true);
          cursor += 8;
        }
      }
      if (!valid || cursor + 8 !== bboxOffset) continue;
      const lateralOffset = view.getFloat64(cursor, true);

      console.log(`Found Column "${name}":`);
      console.log(`  primitiveType: ${primitiveType}, count: ${count}`);
      console.log(`  geometryOffset: 0x${p.toString(16)}, bboxOffset: 0x${bboxOffset.toString(16)}, nameOffset: 0x${at.toString(16)}`);
      console.log(`  nativeId: ${nativeId}, width: ${width}, nativeZ: ${nativeZ}, rotation: ${rotation}, lateralOffset: ${lateralOffset}`);
      console.log(`  BBox: [${bbox.join(', ')}]`);
      
      const pts = [];
      for (let j = 0; j < count; j++) {
        pts.push({ x: view.getFloat64(p + 8 + j * 16, true), y: view.getFloat64(p + 16 + j * 16, true) });
      }
      console.log(`  Points (${count}):`, pts);

      foundCount++;
      if (foundCount >= 3) break;
    }
  }
  if (foundCount >= 3) break;
}
