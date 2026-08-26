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

const BATCH_2_SLUGS = [
  "duman-tahliyesi-mekanik-ve-dogal-sistemler",
  "kacis-merdiveni-tasarim-kriterleri",
  "yangin-kapisi-dosleme-duvar-gecis-detaylari",
  "yangin-algilama-ve-ihbar-sistemi-gereksinimleri",
] as const;

const PHASE5_SLUGS = [...BATCH_1_SLUGS, ...BATCH_2_SLUGS] as const;
type Phase5Slug = (typeof PHASE5_SLUGS)[number];

const requiredTokens: Record<Phase5Slug, string[]> = {
  "byy-bina-kullanim-siniflari-tehlike-kategorileri": ["Madde 8", "Madde 18", "Madde 19", "Ek-1/A", "Ek-1/B", "Ek-1/C", "30 dakika", "126 m²", "su ve pompa kapasitesi", "Mühendislik kontrol listesi"],
  "tasiyici-sistemlerin-yangina-dayanim-suresi-r30-r60-r90-r120": ["Madde 20", "Ek-3/B", "Ek-3/C", "R30", "R60", "R90", "R120", "REI", "30,50 m", "İzin verilmez", "Teknik sorumluluk", "Mühendislik kontrol listesi"],
  "sprinkler-sistemi-zorunluluk-sinirlari": ["Madde 96", "30,50 m", "51,50 m", "600 m²", "21,50 m", "2000 m²", "1000 m²", "TS EN 12259", "TS EN 12845", "Teknik sorumluluk", "Mühendislik kontrol listesi"],
  "duman-tahliyesi-mekanik-ve-dogal-sistemler": ["Madde 85", "Madde 86", "Madde 87", "Madde 89", "30,50 m", "51,50 m", "50 Pa", "60 dakika", "yangın damperi", "Teknik sorumluluk", "Mühendislik kontrol listesi"],
  "kacis-merdiveni-tasarim-kriterleri": ["Madde 38", "Madde 39", "Madde 40", "Madde 41", "120 dakika", "90 dakika", "10 m", "15 m", "210 cm", "175 mm", "250 mm", "Teknik sorumluluk", "Mühendislik kontrol listesi"],
  "yangin-kapisi-dosleme-duvar-gecis-detaylari": ["Madde 25", "Madde 47", "80 cm", "200 cm", "60 dakika", "90 dakika", "120 dakika", "firestop", "duman sızdırmaz", "Teknik sorumluluk", "Mühendislik kontrol listesi"],
  "yangin-algilama-ve-ihbar-sistemi-gereksinimleri": ["Madde 74", "Madde 75", "Madde 76", "Ek-7", "TS EN 54", "TS EN 54-14", "60 m", "110 cm", "130 cm", "Danıştay", "su akış anahtarı", "Teknik sorumluluk", "Mühendislik kontrol listesi"],
};

const depthSignals: Record<Phase5Slug, string[]> = Object.fromEntries(
  PHASE5_SLUGS.map((slug) => [slug, ["proje", "sorumluluk", "yanlış", "kontrol listesi"]]),
) as Record<Phase5Slug, string[]>;

const errors: string[] = [];
const assert = (condition: unknown, message: string) => { if (!condition) errors.push(message); };

assert(DEPREM_PHASE5_ARTICLES.length === 7, `FAZ 5 override sayısı 7 olmalı; bulunan ${DEPREM_PHASE5_ARTICLES.length}.`);
assert(DEPREM_PHASE5_SLUGS.size === 7, "FAZ 5 source-of-truth slug kümesinde tekrar/eksik kayıt var.");
for (const slug of PHASE5_SLUGS) assert(DEPREM_PHASE5_SLUGS.has(slug), `FAZ 5 slug eksik: ${slug}`);

const allArticles = getArticleList();
const allSlugs = new Set(allArticles.map((article) => article.slug));
const targetCounts = {
  yangin: allArticles.filter((article) => article.seriesId === "yangin").length,
  isg: allArticles.filter((article) => article.seriesId === "isg").length,
  cevre: allArticles.filter((article) => article.seriesId === "cevre").length,
};
assert(targetCounts.yangin === 10, `Yangın hedefi 10 olmalı; bulunan ${targetCounts.yangin}.`);
assert(targetCounts.isg === 5, `İSG hedefi 5 olmalı; bulunan ${targetCounts.isg}.`);
assert(targetCounts.cevre === 4, `Çevre hedefi 4 olmalı; bulunan ${targetCounts.cevre}.`);

const qualityScores: Record<string, {
  technicalAccuracyAndCoverage: number;
  officialSourceAccuracy: number;
  professionalDepth: number;
  visualQuality: number;
  tableExampleQuality: number;
  linkMetadataAuthorAccessibility: number;
  staticSubtotal: number;
}> = {};

for (const slug of PHASE5_SLUGS) {
  const configured = DEPREM_PHASE5_ARTICLES.find((article) => article.slug === slug);
  assert(Boolean(configured), `FAZ 5 source-of-truth makalesi bulunamadı: ${slug}`);
  if (!configured) continue;

  assert(!TS500_SLUGS.has(slug), `FAZ 5 TS500 kapsamına taşmış: ${slug}`);
  assert(!DEPREM_PILOT_SLUGS.has(slug), `FAZ 5 pilot ile çakışıyor: ${slug}`);
  assert(!DEPREM_PHASE3_SLUGS.has(slug), `FAZ 5 FAZ 3 source-of-truth ile çakışıyor: ${slug}`);
  assert(!DEPREM_PHASE4_SLUGS.has(slug), `FAZ 5 FAZ 4 source-of-truth ile çakışıyor: ${slug}`);
  assert(configured.sections.length >= 6, `FAZ 5 profesyonel bölüm sayısı yetersiz: ${slug}`);
  assert(configured.references.length >= 4, `FAZ 5 doğrulanabilir referans sayısı yetersiz: ${slug}`);

  const hasRegulation = configured.references.some((ref) => ref.href?.includes("mevzuat.gov.tr"));
  const hasGuideAnnouncement = configured.references.some((ref) => ref.href?.includes("meslekihizmetler.csb.gov.tr/haberler/binalarin-yangindan-korunmasi-hakkinda-yonetmelik-kilavuzu"));
  const hasVerifiedGuidePdf = configured.references.some((ref) => ref.href?.includes("webdosya.csb.gov.tr") && ref.href.includes("20250328093036.pdf"));
  const hasCorrect2025Amendment = configured.references.some((ref) => ref.href?.includes("resmigazete.gov.tr") && ref.href.includes("20250701-9.pdf"));
  assert(hasRegulation, `Yangın Yönetmeliği Mevzuat Bilgi Sistemi kaynağı eksik: ${slug}`);
  assert(hasGuideAnnouncement, `Bakanlık yangın kılavuzu duyurusu eksik: ${slug}`);
  assert(hasVerifiedGuidePdf, `Doğrulanmış Bakanlık yangın kılavuzu PDF kaynağı eksik: ${slug}`);
  assert(hasCorrect2025Amendment, `1 Temmuz 2025 / 32943 / Karar 10026 Resmî Gazete kaynağı eksik: ${slug}`);
  assert(!configured.references.some((ref) => ref.href?.includes("20250701-1.pdf")), `Yanlış 1 Temmuz 2025 Resmî Gazete dosyası kullanılıyor: ${slug}`);

  const configuredText = configured.sections.map((section) => `${section.title}\n${section.content}`).join("\n");
  const configuredTextLower = configuredText.toLocaleLowerCase("tr-TR");
  assert(!configuredText.includes("Mevzuat kapsamı ve kritik eşikler\n"), `FAZ 5 jenerik normalizer başlığı kaldı: ${slug}`);
  assert(!configuredText.includes("Proje ve saha için minimum kontrol zinciri\n"), `FAZ 5 jenerik normalizer kontrol başlığı kaldı: ${slug}`);
  assert(!configuredText.includes("Sık hata ve teknik sonuç\n"), `FAZ 5 jenerik normalizer hata başlığı kaldı: ${slug}`);
  assert(!/[�ÃÄÅÂ]/.test(configuredText), `Encoding şüphesi: ${slug}`);
  assert(!configuredText.includes("/deprem-yonetmelik/araclar/"), `Eski araç route'u FAZ 5 gövdesinde kaldı: ${slug}`);
  for (const token of requiredTokens[slug]) assert(configuredText.includes(token), `FAZ 5 teknik işareti eksik (${token}): ${slug}`);
  for (const signal of depthSignals[slug]) assert(configuredTextLower.includes(signal), `FAZ 5 profesyonel derinlik sinyali eksik (${signal}): ${slug}`);
  assert(configuredText.includes("|---"), `FAZ 5 gerçek teknik tablo bulunamadı: ${slug}`);
  assert(/\d/.test(configuredText), `FAZ 5 sayısal/ölçülebilir kontrol girdisi bulunamadı: ${slug}`);
  assert(Boolean(configured.seoTitle.trim()) && Boolean(configured.seoDescription.trim()) && Boolean(configured.description.trim()), `FAZ 5 metadata eksik: ${slug}`);

  if (slug === "yangin-algilama-ve-ihbar-sistemi-gereksinimleri") {
    assert(configuredText.includes("iptal"), "Ek-7 Danıştay iptal notu açıkça yazılmalı.");
    assert(configuredText.includes("eski") && configuredText.includes("güncel konsolide"), "Ek-7 için eski tablo/güncel konsolide ayrımı açık değil.");
  }

  const article = getArticleBySlug(slug);
  assert(Boolean(article), `FAZ 5 runtime makalesi bulunamadı: ${slug}`);
  if (!article) continue;
  assert(article.sectionId === "deprem-yonetmelik", `Yanlış sectionId: ${slug}`);
  assert(article.seriesId === "yangin", `FAZ 5 tamamlanan slug yangin serisinde olmalı: ${slug}`);
  assert(article.author === DEPREM_CONTENT_AUTHOR.name && article.authorTitle === "", `Canonical yazar uygulanmadı: ${slug}`);
  assert(getArticleAuthorPresentation(article).monogram === DEPREM_CONTENT_AUTHOR.monogram, `HG monogram uygulanmadı: ${slug}`);
  assert(article.updatedAt === "26 Ağustos 2026", `updatedAt beklenenden farklı: ${slug}`);
  assert(article.sections.length === configured.sections.length, `Runtime bölüm sayısı source-of-truth ile uyuşmuyor: ${slug}`);
  assert(article.sections[0]?.content.startsWith(configured.sections[0]?.content.trim() ?? ""), `Runtime ilk bölüm FAZ 5 gövdesinden gelmiyor: ${slug}`);
  assert((article.relatedSlugs ?? []).every((relatedSlug) => allSlugs.has(relatedSlug)), `Geçersiz related slug var: ${slug}`);

  const cover = getDepremRolloutVisualPath(slug, "cover");
  const diagram = getDepremRolloutVisualPath(slug, "diagram");
  const coverOk = article.image === cover;
  assert(coverOk, `Mevcut rollout cover korunmadı: ${slug}`);
  const blocks = article.sections.flatMap((section) => parseBlocks(section.content));
  const figure = blocks.find((block) => block.type === "image" && block.src === diagram);
  const figureOk = Boolean(figure);
  assert(figureOk, `Mevcut rollout body figure korunmadı: ${slug}`);
  let figureMetadataOk = false;
  if (figure?.type === "image") {
    figureMetadataOk = Boolean(figure.alt.trim()) && Boolean(figure.caption.trim()) && Boolean(figure.sourceNote.trim()) && figure.lightbox;
    assert(figureMetadataOk, `Body figure metadata/lightbox eksik: ${slug}`);
  }
  assert(blocks.filter((block) => block.type === "formula").length === 0, `FAZ 5 C3 gövdesinde gereksiz FormulaBlock bulundu: ${slug}`);

  const technicalOk = configured.sections.length >= 6 && requiredTokens[slug].every((token) => configuredText.includes(token));
  const sourcesOk = hasRegulation && hasGuideAnnouncement && hasVerifiedGuidePdf && hasCorrect2025Amendment;
  const depthOk = depthSignals[slug].every((signal) => configuredTextLower.includes(signal));
  const visualOk = coverOk && figureOk && figureMetadataOk;
  const tableExampleOk = configuredText.includes("|---") && /\d/.test(configuredText);
  const metadataOk = Boolean(configured.seoTitle.trim())
    && Boolean(configured.seoDescription.trim())
    && article.author === DEPREM_CONTENT_AUTHOR.name
    && getArticleAuthorPresentation(article).monogram === DEPREM_CONTENT_AUTHOR.monogram
    && (article.relatedSlugs ?? []).every((relatedSlug) => allSlugs.has(relatedSlug))
    && !/[�ÃÄÅÂ]/.test(configuredText)
    && !configuredText.includes("/deprem-yonetmelik/araclar/");

  const score = {
    technicalAccuracyAndCoverage: technicalOk ? 25 : 0,
    officialSourceAccuracy: sourcesOk ? 15 : 0,
    professionalDepth: depthOk ? 15 : 0,
    visualQuality: visualOk ? 15 : 0,
    tableExampleQuality: tableExampleOk ? 10 : 0,
    linkMetadataAuthorAccessibility: metadataOk ? 10 : 0,
    staticSubtotal: 0,
  };
  score.staticSubtotal = score.technicalAccuracyAndCoverage + score.officialSourceAccuracy + score.professionalDepth + score.visualQuality + score.tableExampleQuality + score.linkMetadataAuthorAccessibility;
  qualityScores[slug] = score;
  assert(score.staticSubtotal >= 80, `FAZ 5 statik kalite skoru 80/90 altı; render layout 10 puanıyla toplam 90'a ulaşamaz: ${slug} -> ${score.staticSubtotal}/90`);
}

if (errors.length > 0) {
  console.error("Deprem FAZ 5 kontrolü başarısız:\n");
  for (const error of [...new Set(errors)]) console.error(`- ${error}`);
  process.exit(1);
}

console.log(JSON.stringify({
  status: "ok",
  phase: "FAZ 5",
  completedBatches: 2,
  phase5Overrides: DEPREM_PHASE5_ARTICLES.length,
  completedArticles: 7,
  targetArticles: 19,
  remaining: 12,
  batch2Slugs: BATCH_2_SLUGS,
  classifications: Object.fromEntries(PHASE5_SLUGS.map((slug) => [slug, "C3"])),
  sourceOfTruth: "src/lib/deprem-phase5-articles.ts",
  officialSourceProfile: "Mevzuat Bilgi Sistemi BYKHY + doğrulanmış ÇŞİDB Yangın Yönetmeliği Kılavuzu + 1 Temmuz 2025 / 32943 / Karar 10026 Resmî Gazete",
  visualContract: "unique rollout cover + information-bearing body figure preserved",
  qualityScoreContract: "Master Plan v2: static subtotal >=80/90 + responsive layout QA 10/10 => final quality score >=90/100; hard-fail assertions mandatory",
  qualityScores,
  seriesCoverage: { yangin: 7, isg: 0, cevre: 0 },
  targetCoverage: { yangin: 10, isg: 5, cevre: 4, total: 19 },
  ts500Touched: false,
}, null, 2));
