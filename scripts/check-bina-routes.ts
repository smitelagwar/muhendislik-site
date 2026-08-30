import { getAllIndexedBinaNodes } from "../src/lib/bina-asamalari";
import { getBinaGuideBySlugPath } from "../src/lib/bina-asamalari-content";
import { getBinaVisual } from "../src/lib/bina-asamalari-visuals";

console.log("=== BİNA AŞAMALARI TÜM CANONICAL ROTALAR SMOKE TESTİ ===");

const canonicalNodes = getAllIndexedBinaNodes().filter((n) => n.id !== "root");
const errors: string[] = [];

let successfulRoutes = 0;

for (const node of canonicalNodes) {
  try {
    const guide = getBinaGuideBySlugPath(node.slugPath);
    if (!guide) {
      errors.push(`[Rehber Bulunamadı] ${node.slugPath}`);
      continue;
    }

    if (!guide.title) {
      errors.push(`[Başlık Eksik] ${node.slugPath}`);
    }

    if (!guide.image) {
      errors.push(`[Hero Görsel Eksik] ${node.slugPath}`);
    }

    const visual = getBinaVisual(node.slugPath);
    if (!visual) {
      errors.push(`[Manifest Asset Eksik] ${node.slugPath}`);
    } else {
      // Primary ve Secondary farklı olmalı
      if (visual.primary.src === visual.secondary.src) {
        errors.push(`[Duplicate Asset] ${node.slugPath} primary ve secondary aynı: ${visual.primary.src}`);
      }
    }

    successfulRoutes++;
  } catch (err: any) {
    errors.push(`[İçerik Derleme Hatası] ${node.slugPath}: ${err.message}`);
  }
}

console.log(`\nToplam Taranan Canonical Rota: ${canonicalNodes.length}`);
console.log(`Başarılı Rota: ${successfulRoutes} / ${canonicalNodes.length}`);

if (errors.length > 0) {
  console.error(`\n--- HATALAR (${errors.length}) ---`);
  for (const e of errors) {
    console.error(`- ${e}`);
  }
  process.exit(1);
} else {
  console.log("✓ Tüm 85 canonical rota ve rehber veri yapıları hatasız çalışıyor!");
}
