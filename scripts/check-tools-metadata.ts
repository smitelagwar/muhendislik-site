import fs from 'node:fs';
import path from 'node:path';
import { TOOLS } from '../src/lib/tools-data';
import { TOOL_REGISTRY } from '../src/lib/tool-registry';
import { TOOL_EVIDENCE_REQUIREMENTS } from '../src/lib/tool-evidence-manifest';
import { TOOLS_PUBLIC_METADATA } from '../src/lib/tool-public-meta';

console.log('==================================================================');
console.log('MÜHENDİSLİK ARAÇLARI V2 — METADATA CROSS-CHECK CI DENETİMİ');
console.log('==================================================================\n');

const toolIds = Object.keys(TOOLS_PUBLIC_METADATA);
const errors: string[] = [];

// 1. Araç sayısı kontrolü
if (toolIds.length !== 30) {
  errors.push('[HATA] Beklenen 30 araç yerine ' + toolIds.length + ' araç metadata kaydı bulundu!');
} else {
  console.log('✓ [1/7] Araç Sayısı Doğrulandı: 30 / 30');
}

// 2. Duplicate id kontrolü
const uniqueIds = new Set(toolIds);
if (uniqueIds.size !== toolIds.length) {
  errors.push('[HATA] Metadata içinde mükerrer (duplicate) tool ID tespit edildi!');
} else {
  console.log('✓ [2/7] Benzersiz ID Kontrolü: 30 benzersiz kayıt');
}

// 3. tools-data.ts ve tool-registry.ts eşleşmesi
for (const tool of TOOLS) {
  if (!TOOLS_PUBLIC_METADATA[tool.id]) {
    errors.push('[HATA] tools-data.ts içerisindeki ' + tool.id + ' public metadata içerisinde bulunamadı!');
  }
}
for (const [id] of Object.entries(TOOL_REGISTRY)) {
  if (!TOOLS_PUBLIC_METADATA[id]) {
    errors.push('[HATA] tool-registry.ts içerisindeki ' + id + ' public metadata içerisinde bulunamadı!');
  }
}
console.log('✓ [3/7] tools-data.ts ve tool-registry.ts ID Bütünlüğü Sağlandı');

// 4. Tier ve Evidence Manifest Eşleşmesi
for (const [id, meta] of Object.entries(TOOLS_PUBLIC_METADATA)) {
  const evidence = TOOL_EVIDENCE_REQUIREMENTS[id];
  if (!evidence) {
    errors.push('[HATA] ' + id + ' için tool-evidence-manifest.ts kaydı bulunamadı!');
    continue;
  }
  if ((meta.tier === 'C' && evidence.tier !== 'C') || (meta.tier !== 'C' && evidence.tier === 'C')) {
    errors.push('[HATA] ' + id + ' Tier uyuşmazlığı: Public=' + meta.tier + ', Evidence=' + evidence.tier);
  }
}
console.log('✓ [4/7] Evidence Tier Uyumu Doğrulandı');

// 5. Source Labels ve Kapsam Doluluğu
for (const [id, meta] of Object.entries(TOOLS_PUBLIC_METADATA)) {
  if (meta.tier === 'A' || meta.tier === 'B') {
    if (!meta.sourceLabels || meta.sourceLabels.length === 0) {
      errors.push('[HATA] Tier ' + meta.tier + ' araç ' + id + ' için sourceLabels boş olamaz!');
    }
  }
  if (!meta.scope || meta.scope.length === 0) {
    errors.push('[HATA] ' + id + ' için scope alanı boş olamaz!');
  }
  if (!meta.limitations || meta.limitations.length === 0) {
    errors.push('[HATA] ' + id + ' için limitations alanı boş olamaz!');
  }
}
console.log('✓ [5/7] Scope, Limitations ve SourceLabels Alanları Eksiksiz');

// 6. Fiziksel Dosya Varlığı Kontrolü
const projectRoot = process.cwd();
for (const [id, evidence] of Object.entries(TOOL_EVIDENCE_REQUIREMENTS)) {
  const compFullPath = path.join(projectRoot, evidence.componentPath);
  const engFullPath = path.join(projectRoot, evidence.enginePath);

  if (!fs.existsSync(compFullPath)) {
    errors.push('[HATA] ' + id + ' component dosyası diskte bulunamadı: ' + evidence.componentPath);
  }
  if (!fs.existsSync(engFullPath)) {
    errors.push('[HATA] ' + id + ' engine dosyası diskte bulunamadı: ' + evidence.enginePath);
  }
}
console.log('✓ [6/7] 30/30 Component ve Engine Dosyası Diskte Doğrulandı');

// 7. Sonuç Raporu
console.log('------------------------------------------------------------------');
if (errors.length > 0) {
  console.error('❌ METADATA CROSS-CHECK BAŞARISIZ! (' + errors.length + ' Hata):');
  errors.forEach((err) => console.error('  - ' + err));
  process.exit(1);
} else {
  console.log('✅ METADATA CROSS-CHECK CI KONTROLÜ %100 BAŞARIYLA GEÇTİ (0 HATA).');
  console.log('==================================================================');
}
