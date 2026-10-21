const fs = require('fs');
const buf = fs.readFileSync('.data/cad-v2-scenes/scene_eb64656a3c3d911a7d11c906/chunk_model_058.bin');
const str = buf.toString('utf8');
const matches = str.match(/"layer":"([^"]+)"/g);
console.log('Unique layers in chunk 58:', [...new Set(matches)]);
