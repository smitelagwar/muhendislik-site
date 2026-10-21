const fs = require('fs');
const { getFile } = require('./src/lib/dokumantasyon/files');
const { getLocalStorageDir } = require('./src/lib/dokumantasyon/local-store');
const { getLibreDwgService } = require('./src/lib/cad-v2/decode/libredwg-service');

async function main() {
  const file = await getFile('dc3aa019-28a2-4035-b6f1-2636199f62ee');
  const buf = fs.readFileSync(getLocalStorageDir() + '/' + file.blob_url.replace('local:', ''));
  const svc = getLibreDwgService();
  const rawDb = await svc.parseDwg(buf);
  const layers = rawDb.tables?.LAYER?.entries || [];
  console.log('Total layers:', layers.length);
  for (const l of layers) {
    if (l.name.includes('697D') || l.name.includes('Defpoints') || l.name.includes('TARAMA')) {
      console.log('LAYER:', l.name, 'flag:', l.flag, 'flags:', l.flags, 'frozen:', l.frozen, 'off:', l.off, 'color:', l.color, 'colorIndex:', l.colorIndex);
    }
  }
}
main().catch(console.error);
