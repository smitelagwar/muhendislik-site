import { unzlibSync } from "three/addons/libs/fflate.module.js";

function adler32(bytes: Uint8Array) {
  let a = 1, b = 0;
  for (let start = 0; start < bytes.length; start += 5552) {
    const end = Math.min(bytes.length, start + 5552);
    for (let i = start; i < end; i++) { a += bytes[i]; b += a; }
    a %= 65521; b %= 65521;
  }
  return ((b << 16) | a) >>> 0;
}

export function inflateIdeZlib(compressed: Uint8Array, rawLength: number) {
  // One extra byte detects streams that exceed the declared size.
  const raw = unzlibSync(compressed, { out: new Uint8Array(rawLength + 1) });
  const view = new DataView(compressed.buffer, compressed.byteOffset, compressed.byteLength);
  if (raw.length !== rawLength || adler32(raw) !== view.getUint32(compressed.byteLength - 4, false)) {
    throw new Error("IDE zlib verisi kayıtlı boyut veya Adler32 sağlamasını karşılamıyor.");
  }
  return raw;
}
