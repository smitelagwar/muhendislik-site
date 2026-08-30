import fs from "fs";
import path from "path";
import crypto from "crypto";
import { getAllIndexedBinaNodes } from "../src/lib/bina-asamalari";
import { BINA_VISUALS } from "../src/lib/bina-asamalari-visuals";

console.log("=== BİNA GÖRSEL SİSTEMİ DOĞRULAMA V2 (check:bina-visuals) ===");

const isStrict = process.argv.includes("--strict") || process.env.STRICT_VISUAL_CHECK === "true";
const canonicalNodes = getAllIndexedBinaNodes().filter((n) => n.id !== "root");

const errors: string[] = [];
const warnings: string[] = [];

let publishedPrimaryCount = 0;
let publishedSecondaryCount = 0;
let pendingPrimaryCount = 0;
let pendingSecondaryCount = 0;
let legacySvgPrimaryCount = 0;
let legacySvgSecondaryCount = 0;
let duplicatePairCount = 0;

function sha256File(filePath: string): string {
  const fileBuffer = fs.readFileSync(filePath);
  return crypto.createHash("sha256").update(fileBuffer).digest("hex");
}

for (const node of canonicalNodes) {
  const visual = BINA_VISUALS[node.slugPath];

  if (!visual) {
    errors.push(`[Eksik Manifest] Canonical düğüm manifestte bulunamadı: ${node.slugPath}`);
    continue;
  }

  // 1. PRIMARY KONTROLLERİ
  if (!visual.primary || !visual.primary.src) {
    errors.push(`[Eksik Primary] ${node.slugPath} için primary tanımlanmamış.`);
  } else {
    const primaryPath = path.resolve(process.cwd(), "public", visual.primary.src.replace(/^\//, ""));
    const primaryExists = fs.existsSync(primaryPath);

    if (visual.primary.src.endsWith(".svg")) {
      legacySvgPrimaryCount++;
      if (isStrict) {
        errors.push(`[Legacy Primary SVG] ${node.slugPath} halen SVG kullanıyor: ${visual.primary.src}`);
      }
    } else if (visual.primary.src.endsWith(".webp")) {
      if (primaryExists) {
        publishedPrimaryCount++;
      } else {
        pendingPrimaryCount++;
        if (isStrict) {
          errors.push(`[Eksik Primary Dosyası] Dosya diskte mevcut değil: ${primaryPath}`);
        }
      }
    }

    if (!visual.primary.altTr || visual.primary.altTr.trim().length < 5) {
      errors.push(`[Geçersiz Primary Alt Metin] ${node.slugPath} için primary alt metin yetersiz.`);
    }

    if (!visual.primary.visualPurpose || visual.primary.visualPurpose.trim().length < 10) {
      errors.push(`[Eksik Primary visualPurpose] ${node.slugPath} için visualPurpose yetersiz.`);
    }
  }

  // 2. SECONDARY KONTROLLERİ
  if (!visual.secondary || !visual.secondary.src) {
    errors.push(`[Eksik Secondary] ${node.slugPath} için secondary tanımlanmamış.`);
  } else {
    const secondaryPath = path.resolve(process.cwd(), "public", visual.secondary.src.replace(/^\//, ""));
    const secondaryExists = fs.existsSync(secondaryPath);

    if (visual.secondary.src.endsWith(".svg")) {
      legacySvgSecondaryCount++;
      if (isStrict) {
        errors.push(`[Legacy Secondary SVG] ${node.slugPath} halen SVG kullanıyor: ${visual.secondary.src}`);
      }
    } else if (visual.secondary.src.endsWith(".webp")) {
      if (secondaryExists) {
        publishedSecondaryCount++;
      } else {
        pendingSecondaryCount++;
        if (isStrict) {
          errors.push(`[Eksik Secondary Dosyası] Dosya diskte mevcut değil: ${secondaryPath}`);
        }
      }
    }

    if (!visual.secondary.altTr || visual.secondary.altTr.trim().length < 5) {
      errors.push(`[Geçersiz Secondary Alt Metin] ${node.slugPath} için secondary alt metin yetersiz.`);
    }

    if (!visual.secondary.visualPurpose || visual.secondary.visualPurpose.trim().length < 10) {
      errors.push(`[Eksik Secondary visualPurpose] ${node.slugPath} için visualPurpose yetersiz.`);
    }
  }

  // 3. ÇİFT DOSYA / DUPLICATE KONTROLLERİ
  if (visual.primary && visual.secondary) {
    if (visual.primary.src === visual.secondary.src) {
      duplicatePairCount++;
      errors.push(`[Duplicate Src] Primary ve Secondary aynı dosya yoluna işaret ediyor: ${node.slugPath} -> ${visual.primary.src}`);
    }

    const primaryPath = path.resolve(process.cwd(), "public", visual.primary.src.replace(/^\//, ""));
    const secondaryPath = path.resolve(process.cwd(), "public", visual.secondary.src.replace(/^\//, ""));

    if (fs.existsSync(primaryPath) && fs.existsSync(secondaryPath)) {
      const hash1 = sha256File(primaryPath);
      const hash2 = sha256File(secondaryPath);
      if (hash1 === hash2) {
        duplicatePairCount++;
        errors.push(`[Duplicate Binary Hash] Primary ve Secondary aynı ikili içeriğe sahip: ${node.slugPath}`);
      }
    }
  }
}

console.log(`\n--- DURUM ÖZETİ ---`);
console.log(`Toplam Canonical Düğüm:       ${canonicalNodes.length}`);
console.log(`Manifest V2 Kayıt Sayısı:      ${Object.keys(BINA_VISUALS).length}`);
console.log(`Diskte Mevcut Primary WebP:    ${publishedPrimaryCount} / ${canonicalNodes.length}`);
console.log(`Diskte Mevcut Secondary WebP:  ${publishedSecondaryCount} / ${canonicalNodes.length}`);
console.log(`Üretim Bekleyen Primary WebP:  ${pendingPrimaryCount}`);
console.log(`Üretim Bekleyen Secondary WebP:${pendingSecondaryCount}`);
console.log(`Legacy SVG (Primary):          ${legacySvgPrimaryCount}`);
console.log(`Legacy SVG (Secondary):        ${legacySvgSecondaryCount}`);
console.log(`Aynı Dosya / Hash Duplicate:   ${duplicatePairCount}`);

if (warnings.length > 0) {
  console.log("\n--- UYARILAR ---");
  for (const w of warnings) {
    console.log(`- ${w}`);
  }
}

if (errors.length > 0) {
  console.error(`\n--- HATALAR (${errors.length}) ---`);
  for (const e of errors) {
    console.error(`- ${e}`);
  }
  if (isStrict) {
    console.error(`\n[STRICT MOD] Hatalar nedeniyle doğrulama başarısız.`);
    process.exit(1);
  } else {
    console.log(`\n[BİLGİ] Standart modda manifest ve veri sözleşmesi doğrulandı. Strict mod için: --strict`);
  }
} else {
  console.log("\n✓ Tüm canonical düğümler Manifest V2 veri sözleşmesine tam uygun!");
}
