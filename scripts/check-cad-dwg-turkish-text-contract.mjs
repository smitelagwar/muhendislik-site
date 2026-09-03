#!/usr/bin/env node
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import fontkit from "@pdf-lib/fontkit";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

console.log("[check-cad-dwg-turkish-text-contract] Validating DWG Turkish text and Serif font resolution contract...");

// Manifest yükleme ve resolve fonksiyonu
const manifestRaw = await readFile(join(root, "src", "lib", "dokumantasyon", "cad-font-manifest.json"), "utf8");
const manifest = JSON.parse(manifestRaw);
const aliasMap = new Map();
for (const item of manifest) {
  for (const name of item.names) {
    aliasMap.set(name.trim().toLowerCase(), item);
  }
}
function resolveCadFont(name) {
  if (!name) return null;
  return aliasMap.get(name.trim().toLowerCase()) ?? null;
}

// 1. Font Glif Doğrulaması: IBMPlexSerif-Regular tüm Türkçe karakterleri ve metinleri eksiksiz desteklemeli
{
  const serifPath = join(root, "public", "fonts", "IBMPlexSerif-Regular.ttf");
  assert.ok(existsSync(serifPath), "IBMPlexSerif-Regular.ttf dosyası public/fonts içinde bulunmalıdır");
  const font = fontkit.create(readFileSync(serifPath));

  const targetSample = "BALKON döş: seramik kaplama dvr: sıva üzeri yalıtım boya tvn: sıva üzeri tavan boyası 10.50 m² 180 230 435";
  for (const ch of targetSample) {
    const glyph = font.glyphForCodePoint(ch.codePointAt(0));
    assert.ok(
      glyph && glyph.id !== 0,
      `IBMPlexSerif-Regular içinde hedef karakter glifi eksik: '${ch}' (0x${ch.codePointAt(0).toString(16)})`
    );
  }
}
console.log("  [1/4] IBMPlexSerif-Regular hedef metin ('BALKON', 'döş', 'sıva', 'yalıtım', 'boyası') glifleri doğrulandı.");

// 2. Registry Eşleme Doğrulaması: 'Times roman', 'romant', 'times new roman' -> IBMPlexSerif-Regular
{
  const testStyles = ["Times roman", "times roman", "times_roman", "times new roman", "times new roman tur", "times new roman tur_1_18", "romant", "serif"];
  for (const style of testStyles) {
    const res = resolveCadFont(style);
    assert.ok(res !== null, `Stil çözümlenemedi: ${style}`);
    assert.equal(res.file, "IBMPlexSerif-Regular.ttf", `${style} -> IBMPlexSerif-Regular.ttf olmalıdır`);
    assert.equal(res.type, "mesh", `${style} mesh tipi olmalıdır (dolu poligon gövde)`);
  }
}
console.log("  [2/4] 'Times roman' ve türevlerinin IBMPlexSerif-Regular mesh fontuna çözümlenmesi doğrulandı.");

// 3. Registry Eşleme Doğrulaması: 'arialbd.ttf' -> Arial-Bold.ttf
{
  const boldRes = resolveCadFont("arialbd.ttf");
  assert.ok(boldRes !== null, "arialbd.ttf çözümlenemedi");
  assert.equal(boldRes.file, "Arial-Bold.ttf");
  assert.equal(boldRes.type, "mesh");
}
console.log("  [3/4] 'arialbd.ttf' ve Bold alias'larının Arial-Bold mesh fontuna çözümlenmesi doğrulandı.");

// 4. DWG Dosyası Varsa Canlı Entegrasyon Kontrolü
const candidateDwgPaths = [
  "C:\\Users\\hsyn\\Downloads\\1 ve 2.kat dwg.dwg",
  "C:\\Users\\hsyn\\Downloads\\1 ve 2.kat dwg (1).dwg",
];
const dwgPath = candidateDwgPaths.find((p) => existsSync(p));

if (dwgPath) {
  const { LibreDwg, createModule } = await import("@mlightcad/libredwg-web");
  const wasmModule = await createModule();
  const libreDwg = new LibreDwg(wasmModule);
  const fileContent = readFileSync(dwgPath);
  const dataPtr = libreDwg.dwg_read_data(fileContent.buffer, 0);
  assert.ok(dataPtr, "LibreDWG DWG verisini okuyamadı");

  const db = libreDwg.convert(dataPtr);
  assert.ok(db && Array.isArray(db.entities), "DWG entity listesi alınamadı");

  let foundBalkon = false;
  let foundDos = false;
  let foundSiva = false;
  let targetStyleResolved = false;

  for (const ent of db.entities) {
    if (ent.type === "TEXT" || ent.type === "MTEXT") {
      if (ent.text?.includes("BALKON")) {
        foundBalkon = true;
        if (ent.styleName === "Times roman") {
          const resolved = resolveCadFont(ent.styleName);
          assert.equal(resolved?.file, "IBMPlexSerif-Regular.ttf");
          targetStyleResolved = true;
        }
      }
      if (ent.text?.includes("döş: seramik")) foundDos = true;
      if (ent.text?.includes("sıva üzeri")) foundSiva = true;
    }
  }

  assert.ok(foundBalkon, "DWG içinde 'BALKON' metni bulunamadı");
  assert.ok(foundDos, "DWG içinde 'döş: seramik' Türkçe metni bulunamadı");
  assert.ok(foundSiva, "DWG içinde 'sıva üzeri' Türkçe metni bulunamadı");
  assert.ok(targetStyleResolved, "'Times roman' stili IBMPlexSerif-Regular fontuna çözümlenmelidir");

  console.log(`  [4/4] Gerçek DWG (${dwgPath}) LibreDWG ile test edildi: Türkçe metinler ve stiller %100 doğrulandı.`);
} else {
  console.log("  [4/4] Yerel DWG fixture dosyası bulunamadı, adım atlandı.");
}

console.log("[check-cad-dwg-turkish-text-contract] OK: Tüm DWG Türkçe metin ve font kontratları başarıyla geçti.");
