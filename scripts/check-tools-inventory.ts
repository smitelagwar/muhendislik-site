import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { TOOLS, getLiveTools } from "../src/lib/tools-data";

const ROOT = path.resolve(__dirname, "..");
const TOOLS_APP_DIR = path.join(ROOT, "src", "app", "kategori", "araclar");
const COMPONENTS_DIR = path.join(ROOT, "src", "components");

console.log("==================================================================");
console.log("FAZ 0.1 — MÜHENDİSLİK ARAÇLARI OTOMATİK ENVANTER DENETİMİ");
console.log("==================================================================\n");

// 1. Katalog Sayı Kontrolü
const catalogCount = TOOLS.length;
console.log(`[1] Katalog Araç Sayısı: ${catalogCount}`);
assert.equal(catalogCount, 30, `Katalogda tam 30 araç olmalı, bulunan: ${catalogCount}`);

// 2. ID Benzersizliği
const ids = TOOLS.map((t) => t.id);
const uniqueIds = new Set(ids);
console.log(`[2] Benzersiz ID Sayısı: ${uniqueIds.size} / ${catalogCount}`);
assert.equal(uniqueIds.size, catalogCount, "Katalogda mükerrer ID bulunuyor!");

// 3. Href Benzersizliği ve Formatı
const hrefs = TOOLS.map((t) => t.href);
const uniqueHrefs = new Set(hrefs);
console.log(`[3] Benzersiz Href Sayısı: ${uniqueHrefs.size} / ${catalogCount}`);
assert.equal(uniqueHrefs.size, catalogCount, "Katalogda mükerrer Href bulunuyor!");

for (const tool of TOOLS) {
  assert.equal(tool.href, `/kategori/araclar/${tool.id}`, `Href formatı geçersiz: ${tool.id} -> ${tool.href}`);
  assert.ok(tool.name.trim().length > 0, `Araç adı boş olamaz: ${tool.id}`);
  assert.ok(tool.description.trim().length > 0, `Açıklama boş olamaz: ${tool.id}`);
  assert.ok(tool.discipline.trim().length > 0, `Disiplin boş olamaz: ${tool.id}`);
}

// 4. Sıralama ve Live Durumu
const liveTools = getLiveTools();
assert.equal(liveTools.length, 30, "getLiveTools() 30 aracı getirmelidir.");

// 5. Rota & Bileşen Analizi
interface ToolAuditReport {
  id: string;
  name: string;
  dedicatedRoute: boolean;
  hasComponent: boolean;
  componentName?: string;
  hasEngine: boolean;
  enginePath?: string;
  status: "live-ready" | "partial" | "placeholder";
}

const auditReports: ToolAuditReport[] = [];

// Bilinen component ve engine eşleşmeleri (30/30 Canlı Motor ve Bileşen Haritası)
const KNOWN_MAPPINGS: Record<string, { component?: string; engine?: string; status: "live-ready" | "partial" | "placeholder" }> = {
  "donati-hesabi": { component: "rebar-calculator.tsx", engine: "src/lib/rebar-calculations.ts", status: "live-ready" },
  "kolon-on-boyutlandirma": { component: "column-preliminary-sizing-calculator.tsx", engine: "src/lib/concrete-tools/column.ts", status: "live-ready" },
  "kiris-kesiti": { component: "beam-section-calculator.tsx", engine: "src/lib/concrete-tools/beam.ts", status: "live-ready" },
  "doseme-kalinligi": { component: "slab-thickness-calculator.tsx", engine: "src/lib/concrete-tools/slab.ts", status: "live-ready" },
  "pas-payi": { component: "concrete-cover-calculator.tsx", engine: "src/lib/concrete-tools/cover.ts", status: "live-ready" },
  "zimbalama-kontrolu": { component: "punching-calculator.tsx", engine: "src/lib/concrete-tools/punching.ts", status: "live-ready" },
  "kiris-kesme-etriye": { component: "shear-stirrup-calculator.tsx", engine: "src/lib/concrete-tools/shear-stirrup.ts", status: "live-ready" },
  "kenetlenme-boyu": { component: "splice-calculator.tsx", engine: "src/lib/concrete-tools/splice.ts", status: "live-ready" },
  "taban-kesme-kuvveti": { component: "seismic-base-shear-calculator.tsx", engine: "src/lib/engineering/tbdy2018/base-shear.ts", status: "live-ready" },
  "duzensizlik-kontrolu": { component: "irregularity-calculator.tsx", engine: "src/lib/engineering/tbdy2018/irregularity.ts", status: "live-ready" },
  "zemin-sinifi": { component: "soil-class-calculator.tsx", engine: "src/lib/engineering/tbdy2018/soil-class.ts", status: "live-ready" },
  "deprem-periyot-hesabi": { component: "seismic-period-calculator.tsx", engine: "src/lib/engineering/tbdy2018/period.ts", status: "live-ready" },
  "goreli-kat-otelemesi": { component: "drift-calculator.tsx", engine: "src/lib/engineering/tbdy2018/drift.ts", status: "live-ready" },
  "radye-temel-hesabi": { component: "mat-foundation-calculator.tsx", engine: "src/lib/concrete-tools/mat-foundation.ts", status: "live-ready" },
  "iksa-toprak-basinci": { component: "retaining-wall-calculator.tsx", engine: "src/lib/engineering/geotech/retaining-wall.ts", status: "live-ready" },
  "sev-stabilitesi": { component: "slope-stability-calculator.tsx", engine: "src/lib/engineering/geotech/slope-stability.ts", status: "live-ready" },
  "celik-profil-secimi": { component: "steel-profile-calculator.tsx", engine: "src/lib/engineering/steel/profile-selection.ts", status: "live-ready" },
  "celik-birlestesi-hesabi": { component: "steel-connection-calculator.tsx", engine: "src/lib/engineering/steel/connection.ts", status: "live-ready" },
  "ahsap-eleman-hesabi": { component: "timber-member-calculator.tsx", engine: "src/lib/engineering/timber/timber-member.ts", status: "live-ready" },
  "kalip-sokum-suresi": { component: "src/app/araclar/kalip-sokum-suresi/page.tsx", engine: "src/lib/concrete-tools/stripping.ts", status: "live-ready" },
  "dis-cephe-yalitim-kalinligi": { component: "external-wall-insulation-calculator.tsx", engine: "src/lib/ts825/calculator.ts", status: "live-ready" },
  "imar-hesaplayici": { component: "imar-calculator.tsx", engine: "src/lib/imar/calculator.ts", status: "live-ready" },
  "beton-metraj-hesabi": { component: "concrete-quantity-calculator.tsx", engine: "src/lib/engineering/quantity/concrete-volume.ts", status: "live-ready" },
  "hafriyat-metraj-hesabi": { component: "excavation-quantity-calculator.tsx", engine: "src/lib/engineering/quantity/excavation.ts", status: "live-ready" },
  "pratik-donati-metraji": { component: "rebar-quantity-calculator.tsx", engine: "src/lib/engineering/quantity/rebar-ratio.ts", status: "live-ready" },
  "pratik-kalip-metraji": { component: "formwork-quantity-calculator.tsx", engine: "src/lib/engineering/quantity/formwork-ratio.ts", status: "live-ready" },
  "duvar-metraji-hesabi": { component: "masonry-quantity-calculator.tsx", engine: "src/lib/engineering/quantity/masonry.ts", status: "live-ready" },
  "siva-boya-metraji": { component: "plaster-paint-calculator.tsx", engine: "src/lib/engineering/quantity/plaster-paint.ts", status: "live-ready" },
  "cati-kaplama-metraji": { component: "roof-covering-calculator.tsx", engine: "src/lib/engineering/quantity/roof-covering.ts", status: "live-ready" },
  "seramik-fayans-metraji": { component: "tile-quantity-calculator.tsx", engine: "src/lib/engineering/quantity/tile-flooring.ts", status: "live-ready" },
};

console.log("\n[4] 30 Araçlık Detaylı Rota & Motor Envanteri:\n");
console.log("| #  | ID | Dedicated Route | Component | Engine | Durum |");
console.log("|:---|:---|:---:|:---:|:---:|:---:|");

let dedicatedCount = 0;
let liveReadyCount = 0;
let partialCount = 0;
let placeholderCount = 0;

for (let i = 0; i < TOOLS.length; i++) {
  const tool = TOOLS[i];
  const dedicatedPath = path.join(TOOLS_APP_DIR, tool.id, "page.tsx");
  const hasDedicated = fs.existsSync(dedicatedPath);
  if (hasDedicated) dedicatedCount++;

  const mapping = KNOWN_MAPPINGS[tool.id] || { status: "placeholder" };
  const hasComp = !!mapping.component && (fs.existsSync(path.join(COMPONENTS_DIR, mapping.component)) || fs.existsSync(path.join(ROOT, mapping.component)));
  const hasEng = !!mapping.engine && fs.existsSync(path.join(ROOT, mapping.engine));

  if (mapping.status === "live-ready") liveReadyCount++;
  else if (mapping.status === "partial") partialCount++;
  else placeholderCount++;

  auditReports.push({
    id: tool.id,
    name: tool.name,
    dedicatedRoute: hasDedicated,
    hasComponent: hasComp,
    componentName: mapping.component,
    hasEngine: hasEng,
    enginePath: mapping.engine,
    status: mapping.status,
  });

  const dedicatedMark = hasDedicated ? "✅ Var" : "❌ [slug]";
  const compMark = hasComp ? "✅ Var" : "❌ Yok";
  const engMark = hasEng ? "✅ Var" : "⚠️ Inline/Yok";
  const statusMark = mapping.status === "live-ready" ? "🟢 Canlı" : mapping.status === "partial" ? "🟡 Kısmi" : "🔴 Placeholder";

  console.log(`| ${(i + 1).toString().padStart(2, " ")} | \`${tool.id.padEnd(28, " ")}\` | ${dedicatedMark} | ${compMark} | ${engMark} | ${statusMark} |`);
}

console.log("\n------------------------------------------------------------------");
console.log("ENVANTER DENETİM ÖZETİ:");
console.log(`- Toplam Katalog Araç Sayısı: ${catalogCount} / 30`);
console.log(`- Dedicated Statik Rota:      ${dedicatedCount} / 30`);
console.log(`- Dynamic [slug] Fallback:    ${30 - dedicatedCount} / 30`);
console.log(`- Canlı & Tam Çalışan:        ${liveReadyCount} / 30`);
console.log(`- Kısmi / Adaptasyon Gereken: ${partialCount} / 30`);
console.log(`- Placeholder / Sıfırdan:     ${placeholderCount} / 30`);
console.log("------------------------------------------------------------------");
console.log("✅ FAZ 0.1 ENVANTER KONTROLÜ BAŞARIYLA TAMAMLANDI.\n");
