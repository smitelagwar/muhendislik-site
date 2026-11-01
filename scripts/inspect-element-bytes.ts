import fs from 'fs';
import { parseIde10 } from '../src/lib/hsyncad/ide-import/index.ts';

const filePath = 'C:\\Users\\hsyn\\Desktop\\SON\\7_KAT_5000M2_BINA.ide10';
const buf = fs.readFileSync(filePath);
const project = parseIde10(buf.buffer, '7_KAT_5000M2_BINA.ide10');

console.log(`Format: ${project.format}`);
console.log(`Byte length: ${project.byteLength}`);
console.log(`Floors: ${project.floors.length}`);
console.log(`Elements: ${project.elements.length}`);

for (const floor of project.floors) {
  console.log(`Floor: "${floor.name}", elevation: ${floor.elevation}, height: ${floor.height}, sourceOffset: 0x${floor.sourceOffset.toString(16)}, endOffset: 0x${floor.endOffset.toString(16)}`);
}

// Inspect first 3 elements of each type: column, beam, slab, wall, axis
const types = ['column', 'beam', 'slab', 'wall', 'axis'];
for (const t of types) {
  const el = project.elements.find(e => e.type === t);
  if (el) {
    console.log(`\n=== Sample ${t} element ===`);
    console.log(`ID: ${el.id}, name: "${el.name}", primitiveType: ${el.primitiveType}`);
    console.log(`sourceOffset (nameOffset): 0x${el.sourceOffset.toString(16)}`);
    console.log(`nativeZ: ${el.nativeZ}, width: ${el.width}, rotation: ${el.rotation}, lateralOffset: ${el.lateralOffset}`);
    console.log(`Points count: ${el.points.length}`);
  }
}
