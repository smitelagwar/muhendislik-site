// PDF v4 ölçüm fixture'ları. Çıktı: .test-data/pdf-v4-fixtures/ (git'e girmez).
// Kullanım: node scripts/generate-pdf-fixtures-v4.mjs [--force]
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { fileURLToPath } from "node:url";
import { PDFDocument, PDFName, StandardFonts, rgb } from "pdf-lib";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outDir = path.join(root, ".test-data", "pdf-v4-fixtures");
const force = process.argv.includes("--force");
fs.mkdirSync(outDir, { recursive: true });

const A4 = [595.28, 841.89];
const A3L = [1190.55, 841.89];
const A1 = [1683.78, 2383.94];
const A0 = [2383.94, 3370.39];

// Deterministik sozde-rastgele (mulberry32): her kosuda ayni cikti.
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function skip(name) {
  const p = path.join(outDir, name);
  if (!force && fs.existsSync(p)) {
    console.log(`= ${name} (var, atlandı)`);
    return true;
  }
  return false;
}
function save(name, bytes) {
  fs.writeFileSync(path.join(outDir, name), bytes);
  console.log(`+ ${name}  ${(bytes.length / 1048576).toFixed(2)} MB`);
}

function drawLines(page, [w, h], count, r, thick) {
  for (let i = 0; i < count; i++) {
    const x = r() * w, y = r() * h;
    const len = 10 + r() * 140;
    const ang = r() * Math.PI * 2;
    const g = 0.05 + r() * 0.5;
    page.drawLine({
      start: { x, y },
      end: { x: x + Math.cos(ang) * len, y: y + Math.sin(ang) * len },
      thickness: thick[0] + r() * (thick[1] - thick[0]),
      color: rgb(g, g, g),
    });
  }
}

// 1) a0-vektor.pdf — 1 sayfa A0, 30.000 ince çizgi + 400 etiket (pafta benzeri)
async function a0Vektor() {
  if (skip("a0-vektor.pdf")) return;
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const page = doc.addPage(A0);
  const r = rng(7);
  drawLines(page, A0, 30000, r, [0.2, 0.6]);
  for (let i = 0; i < 400; i++) {
    page.drawText(`K${String(i).padStart(3, "0")}-${Math.floor(r() * 900 + 100)}`, {
      x: 40 + r() * (A0[0] - 200), y: 40 + r() * (A0[1] - 100), size: 8 + r() * 6, font, color: rgb(0, 0, 0.4),
    });
  }
  page.drawRectangle({ x: 20, y: 20, width: A0[0] - 40, height: A0[1] - 40, borderWidth: 1.2, borderColor: rgb(0, 0, 0) });
  save("a0-vektor.pdf", await doc.save());
}

// 2) karisik-60.pdf — A4 dikey / A3 yatay / A1 karışık
async function karisik60() {
  if (skip("karisik-60.pdf")) return;
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const r = rng(11);
  for (let i = 0; i < 60; i++) {
    const kind = i % 6;
    const size = kind === 4 ? A3L : kind === 5 ? A1 : A4;
    const p = doc.addPage(size);
    p.drawText(`Sayfa ${i + 1} / 60  (${kind === 4 ? "A3 yatay" : kind === 5 ? "A1" : "A4"})`, { x: 40, y: size[1] - 50, size: 18, font });
    if (kind < 4) {
      for (let l = 0; l < 44; l++)
        p.drawText(`Satir ${l + 1}: betonarme eleman kesit hesabi ve donati yerlesimi ornek metni ${i + 1}.`, { x: 40, y: size[1] - 90 - l * 16, size: 10, font });
    } else {
      drawLines(p, size, kind === 5 ? 4000 : 800, r, [0.2, 0.8]);
    }
  }
  save("karisik-60.pdf", await doc.save());
}

// 3) metin-1000.pdf — 1000 sayfa A4 metin (sanallaştırma / O(N) testi)
async function metin1000() {
  if (skip("metin-1000.pdf")) return;
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  for (let i = 0; i < 1000; i++) {
    const p = doc.addPage(A4);
    p.drawText(`Sayfa ${i + 1}`, { x: 40, y: A4[1] - 50, size: 16, font });
    for (let l = 0; l < 48; l++)
      p.drawText(`s${i + 1}.${l + 1} Deprem yonetmeligi hesap adimi ve aciklama satiri, uzun belge performans testi.`, { x: 40, y: A4[1] - 80 - l * 15, size: 9, font });
  }
  save("metin-1000.pdf", await doc.save());
}

// --- küçük PNG kodlayıcı (bağımlılıksız): 8 bit gri ---
const crcTable = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}
function encodeGrayPng(w, h, pixel) {
  const raw = Buffer.alloc((w + 1) * h);
  for (let y = 0; y < h; y++) {
    raw[y * (w + 1)] = 0; // filtre yok
    for (let x = 0; x < w; x++) raw[y * (w + 1) + 1 + x] = pixel(x, y);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; ihdr[9] = 0; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr), chunk("IDAT", zlib.deflateSync(raw, { level: 6 })), chunk("IEND", Buffer.alloc(0)),
  ]);
}

// 4) tarama-a3.pdf — 6 sayfa A3 dikey, 150 dpi gri raster (tarama benzeri, metinsiz)
async function taramaA3() {
  if (skip("tarama-a3.pdf")) return;
  const doc = await PDFDocument.create();
  const W = 1754, H = 2480; // A3 @150dpi? (A3 = 11.69x16.54in → 1754x2481)
  const r = rng(23);
  const noise = new Uint8Array(W * 64);
  for (let i = 0; i < noise.length; i++) noise[i] = (r() * 8) | 0;
  const png = encodeGrayPng(W, H, (x, y) => {
    const bar = ((y >> 5) % 4 === 0 && (x >> 4) % 3 !== 0) ? 70 : 0; // metin satırı benzeri koyu şeritler
    return 232 + noise[(y % 64) * W + x] - bar;
  });
  const img = await doc.embedPng(png);
  for (let i = 0; i < 6; i++) {
    const p = doc.addPage([841.89, 1190.55]);
    p.drawImage(img, { x: 0, y: 0, width: 841.89, height: 1190.55 });
  }
  save("tarama-a3.pdf", await doc.save());
}

// 5) linkli-300.pdf — 300 sayfa, sayfa başına 3 bağlantı (iç + dış), annotation yükü
async function linkli300() {
  if (skip("linkli-300.pdf")) return;
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const pages = [];
  for (let i = 0; i < 300; i++) pages.push(doc.addPage(A4));
  pages.forEach((p, i) => {
    p.drawText(`Baglantili sayfa ${i + 1}`, { x: 40, y: A4[1] - 50, size: 16, font });
    const annots = [];
    for (let k = 0; k < 3; k++) {
      const target = pages[(i + 1 + k * 37) % 300];
      const y = A4[1] - 120 - k * 40;
      p.drawText(`-> sayfa ${((i + 1 + k * 37) % 300) + 1}`, { x: 40, y, size: 11, font, color: rgb(0.1, 0.3, 0.8) });
      annots.push(doc.context.register(doc.context.obj({
        Type: "Annot", Subtype: "Link", Rect: [38, y - 4, 160, y + 12], Border: [0, 0, 0],
        Dest: [target.ref, PDFName.of("XYZ"), null, null, null],
      })));
    }
    p.node.set(PDFName.of("Annots"), doc.context.obj(annots));
  });
  save("linkli-300.pdf", await doc.save());
}

await a0Vektor();
await karisik60();
await metin1000();
await taramaA3();
await linkli300();
console.log("Fixture dizini:", outDir);
