import { parseBlocks } from "../src/lib/article-blocks";
import { getArticleBySlug, getArticleList } from "../src/lib/articles-data";
import { DEPREM_CONTENT_AUTHOR, getArticleAuthorPresentation } from "../src/lib/content-author";
import { DEPREM_PHASE3_SLUGS } from "../src/lib/deprem-phase3-articles";
import { DEPREM_PHASE4_SLUGS } from "../src/lib/deprem-phase4-articles";
import { DEPREM_PHASE5_ARTICLES, DEPREM_PHASE5_SLUGS } from "../src/lib/deprem-phase5-articles";
import { DEPREM_PILOT_SLUGS } from "../src/lib/deprem-pilot-articles";
import { getDepremRolloutVisualPath } from "../src/lib/deprem-rollout";
import { TS500_SLUGS } from "../src/lib/ts500-content";

const BATCH_1_SLUGS = [
  "byy-bina-kullanim-siniflari-tehlike-kategorileri",
  "tasiyici-sistemlerin-yangina-dayanim-suresi-r30-r60-r90-r120",
  "sprinkler-sistemi-zorunluluk-sinirlari",
] as const;

type Phase5Slug = (typeof BATCH_1_SLUGS)[number];

const requiredTokens: Record<Phase5Slug, string[]> = {
  "byy-bina-kullanim-siniflari-tehlike-kategorileri": [
    "Madde 8",
    "Madde 18",
    "Madde 19",
    "Ek-1/A",
    "Ek-1/B",
    "Ek-1/C",
    "30 dakika",
    "126 m²",
    "su ve pompa kapasitesi",
    "Mühendislik kontrol listesi",
  ],
  "tasiyici-sistemlerin-yangina-dayanim-suresi-r30-r60-r90-r120": [
    "Madde 20",
    "Ek-3/B",
    "Ek-3/C",
    "R30",
    "R60",
    "R90",
    "R120",
    "REI",
    "30,50 m",
    "İzin verilmez",
    "Mühendislik kontrol listesi",
  ],
  "sprinkler-sistemi-zorunluluk-sinirlari": [
    "Madde 96",
    "30,50 m",
    "51,50 m",
    "600 m²",
    "21,50 m",
    "2000 m²",
    "1000 m²",
    "TS EN 12259",
    "TS EN 12845",
    "30 dakika",
    "60 dakika",
    "90 dakika",
    "Mühendislik kontrol listesi",
  ],
};

const errors: string[] = [];
const assert = (condition: unknown, message: string) => { if (!condition) errors.push(message); };

assert(DEPREM_PHASE5_ARTICLES.length === 3, `FAZ 5 override sayısı 3 olmalı; bulunan ${DEPREM_PHASE5_ARTICLES.length}.`);
assert(DEPREM_PHASE5_SLUGS.size === 3, "FAZ 5 source-of-truth slug kümesinde tekrar/eksik kayıt var.");
for (const slug of BATCH_1_SLUGS) assert(DEPREM_PHASE5_SLUGS.has(slug), `FAZ 5 Batch 1 slug eksik: ${slug}`);

const allArticles = getArticleList();
const targetCounts = {
  yangin: allArticles.filter((article) => article.seriesId === "yangin").length,
  isg: allArticles.filter((article) => article.seriesId === "isg").length,
  cevre: allArticles.filter((article) => article.seriesId === "cevre").length,
};
assert(targetCounts.yangin === 10, `Yangın hedefi 10 olmalı; bulunan ${targetCounts.yangin}.`);
assert(targetCounts.isg === 5, `İSG hedefi 5 olmalı; bulunan ${targetCounts.isg}.`);
assert(targetCounts.cevre === 4, `Çevre hedefi 4 olmalı; bulunan ${targetCounts.cevre}.`);

for (const slug of BATCH_1_SLUGS) {
  const configured = DEPREM_PHASE5_ARTICLES.find((article) => article.slug === slug);
  assert(Boolean(configured), `FAZ 5 source-of-truth makalesi bulunamadı: ${slug}`);
  if (!configured) continue;

  assert(!TS500_SLUGS.has(slug), `FAZ 5 TS500 kapsamına taşmış: ${slug}`);
  assert(!DEPREM_PILOT_SLUGS.has(slug), `FAZ 5 pilot ile çakışıyor: ${slug}`);
  assert(!DEPREM_PHASE3_SLUGS.has(slug), `FAZ 5 FAZ 3 source-of-truth ile çakışıyor: ${slug}`);
  assert(!DEPREM_PHASE4_SLUGS.has(slug), `FAZ 5 FAZ 4 source-of-truth ile çakışıyor: ${slug}`);
  assert(configured.sections.length >= 6, `FAZ 5 profesyonel bölüm sayısı yetersiz: ${slug}`);
  assert(configured.references.length >= 4, `FAZ 5 doğrulanabilir referans sayısı yetersiz: ${slug}`);
  assert(configured.references.some((ref) => ref.href?.includes("mevzuat.gov.tr")), `Yangın Yönetmeliği Mevzuat Bilgi Sistemi kaynağı eksik: ${slug}`);
  assert(configured.references.some((ref) => ref.href?.includes("binalarin-yangindan-korunmasi-hakkinda-yonetmelik-kilavuzu")), `Bakanlık yangın kılavuzu duyurusu eksik: ${slug}`);
  assert(configured.references.some((ref) => ref.href?.includes("Binalar-n-Yang-n-Korunmas-Hakk-nda-Y-netmelik-K-lavuzu")), `Bakanlık yangın kılavuzu PDF kaynağı eksik: ${slug}`);
  assert(configured.references.some((ref) => ref.href?.includes("20250701-1.pdf")), `2025 BYKHY değişiklik kaynağı eksik: ${slug}`);

  const configuredText = configured.sections.map((section) => `${section.title}\n${section.content}`).join("\n");
  assert(!configuredText.includes("Mevzuat kapsamı ve kritik eşikler\n"), `FAZ 5 jenerik normalizer başlığı kaldı: ${slug}`);
  assert(!configuredText.includes("Proje ve saha için minimum kontrol zinciri\n"), `FAZ 5 jenerik normalizer kontrol başlığı kaldı: ${slug}`);
  assert(!configuredText.includes("Sık hata ve teknik sonuç\n"), `FAZ 5 jenerik normalizer hata başlığı kaldı: ${slug}`);
  assert(!/[�ÃÄÅÂ]/.test(configuredText), `Encoding şüphesi: ${slug}`);
  assert(!configuredText.includes("/deprem-yonetmelik/araclar/"), `Eski araç route'u FAZ 5 gövdesinde kaldı: ${slug}`);
  for (const token of requiredTokens[slug]) assert(configuredText.includes(token), `FAZ 5 teknik işareti eksik (${token}): ${slug}`);

  const article = getArticleBySlug(slug);
  assert(Boolean(article), `FAZ 5 runtime makalesi bulunamadı: ${slug}`);
  if (!article) continue;

  assert(article.sectionId === "deprem-yonetmelik", `Yanlış sectionId: ${slug}`);
  assert(article.seriesId === "yangin", `FAZ 5 Batch 1 seriesId yangin olmalı: ${slug}`);
  assert(article.author === DEPREM_CONTENT_AUTHOR.name, `Canonical yazar uygulanmadı: ${slug}`);
  assert(article.authorTitle === "", `Canonical authorTitle boş olmalı: ${slug}`);
  assert(getArticleAuthorPresentation(article).monogram === DEPREM_CONTENT_AUTHOR.monogram, `HG monogram uygulanmadı: ${slug}`);
  assert(article.updatedAt === "26 Ağustos 2026", `updatedAt beklenenden farklı: ${slug}`);
  assert(article.sections.length === configured.sections.length, `Runtime bölüm sayısı FAZ 5 gövdesiyle uyuşmuyor: ${slug}`);
  assert(article.sections[0]?.content.startsWith(configured.sections[0]?.content.trim() ?? ""), `Runtime ilk bölüm FAZ 5 gövdesinden gelmiyor: ${slug}`);

  const cover = getDepremRolloutVisualPath(slug, "cover");
  const diagram = getDepremRolloutVisualPath(slug, "diagram");
  assert(article.image === cover, `Mevcut rollout cover korunmadı: ${slug}`);
  const blocks = article.sections.flatMap((section) => parseBlocks(section.content));
  const figure = blocks.find((block) => block.type === "image" && block.src === diagram);
  assert(Boolean(figure), `Mevcut rollout body figure korunmadı: ${slug}`);
  if (figure?.type === "image") {
    assert(Boolean(figure.alt.trim()), `Body figure alt eksik: ${slug}`);
    assert(Boolean(figure.caption.trim()), `Body figure caption eksik: ${slug}`);
    assert(Boolean(figure.sourceNote.trim()), `Body figure source note eksik: ${slug}`);
    assert(figure.lightbox, `Body figure lightbox kontratı bozuldu: ${slug}`);
  }
  assert(blocks.filter((block) => block.type === "formula").length === 0, `FAZ 5 Batch 1 C3 gövdelerinde gereksiz FormulaBlock bulundu: ${slug}`);
}

if (errors.length > 0) {
  console.error("Deprem FAZ 5 Batch 1 kontrolü başarısız:\n");
  for (const error of [...new Set(errors)]) console.error(`- ${error}`);
  process.exit(1);
}

console.log(JSON.stringify({
  status: "ok",
  phase: "FAZ 5",
  completedBatches: 1,
  phase5Overrides: DEPREM_PHASE5_ARTICLES.length,
  completedArticles: 3,
  targetArticles: 19,
  remaining: 16,
  batch1Slugs: BATCH_1_SLUGS,
  batch1Classification: Object.fromEntries(BATCH_1_SLUGS.map((slug) => [slug, "C3"])),
  sourceOfTruth: "src/lib/deprem-phase5-articles.ts",
  officialSourceProfile: "Mevzuat Bilgi Sistemi BYKHY + ÇŞİDB Yangın Yönetmeliği Kılavuzu + 1 Temmuz 2025 Resmî Gazete değişikliği",
  visualContract: "existing unique rollout cover + body figure preserved",
  seriesCoverage: { yangin: 3, isg: 0, cevre: 0 },
  targetCoverage: { yangin: 10, isg: 5, cevre: 4, total: 19 },
  ts500Touched: false,
}, null, 2));
