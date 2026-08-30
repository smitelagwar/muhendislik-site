import fs from "fs";
import path from "path";
import { getAllIndexedBinaNodes } from "../src/lib/bina-asamalari";
import { BINA_VISUALS } from "../src/lib/bina-asamalari-visuals";

console.log("=== BİNA GÖRSEL SİSTEMİ DOĞRULAMA (check:bina-visuals) ===");

const canonicalNodes = getAllIndexedBinaNodes().filter((n) => n.id !== "root");
const errors: string[] = [];
const warnings: string[] = [];
let webpCount = 0;
let svgCount = 0;

for (const node of canonicalNodes) {
  const visual = BINA_VISUALS[node.slugPath];

  if (!visual) {
    errors.push(`[Eksik Manifest] Canonical düğüm manifestte bulunamadı: ${node.slugPath}`);
    continue;
  }

  // Card asset varlığı
  if (!visual.card) {
    errors.push(`[Eksik Card Yolu] ${node.slugPath} için card alanı tanımlanmamış.`);
  } else {
    const publicPath = path.resolve(process.cwd(), "public", visual.card.replace(/^\//, ""));
    if (!fs.existsSync(publicPath)) {
      errors.push(`[Asset Bulunamadı] Dosya mevcut değil: ${publicPath} (düğüm: ${node.slugPath})`);
    } else {
      if (visual.card.endsWith(".webp")) {
        webpCount++;
      } else if (visual.card.endsWith(".svg")) {
        svgCount++;
      }
    }
  }

  // Hero asset varlığı (varsa)
  if (visual.hero) {
    const heroPath = path.resolve(process.cwd(), "public", visual.hero.replace(/^\//, ""));
    if (!fs.existsSync(heroPath)) {
      errors.push(`[Hero Bulunamadı] Dosya mevcut değil: ${heroPath} (düğüm: ${node.slugPath})`);
    }
  }

  // Diagram asset varlığı (varsa)
  if (visual.diagram) {
    const diagPath = path.resolve(process.cwd(), "public", visual.diagram.replace(/^\//, ""));
    if (!fs.existsSync(diagPath)) {
      errors.push(`[Diagram Bulunamadı] Dosya mevcut değil: ${diagPath} (düğüm: ${node.slugPath})`);
    }
  }

  // Alt metin kontrolü
  if (!visual.altTr || visual.altTr.trim().length < 5) {
    errors.push(`[Geçersiz Alt Metin] ${node.slugPath} için alt metin yetersiz veya boş: "${visual.altTr}"`);
  }

  // visualPurpose kontrolü
  if (!visual.visualPurpose || visual.visualPurpose.trim().length < 10) {
    errors.push(`[Eksik visualPurpose] ${node.slugPath} için visualPurpose yetersiz.`);
  }
}

console.log(`\nToplam Canonical Düğüm: ${canonicalNodes.length}`);
console.log(`Manifest Kayıt Sayısı: ${Object.keys(BINA_VISUALS).length}`);
console.log(`Modern WebP Asset Kullanan: ${webpCount}`);
console.log(`Geçiş Aşamasında SVG Kullanan: ${svgCount}`);

if (warnings.length > 0) {
  console.log("\n--- UYARILAR ---");
  for (const w of warnings) {
    console.log(`- ${w}`);
  }
}

if (errors.length > 0) {
  console.error("\n--- HATALAR ---");
  for (const e of errors) {
    console.error(`- ${e}`);
  }
  console.error(`\nToplam ${errors.length} hata tespit edildi.`);
  process.exit(1);
} else {
  console.log("\n✓ Tüm canonical düğümler manifestte ve dosyaları eksiksiz mevcut!");
}
