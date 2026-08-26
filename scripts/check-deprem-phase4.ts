import { parseBlocks } from "../src/lib/article-blocks";
import { getArticleBySlug, getArticleList } from "../src/lib/articles-data";
import { DEPREM_CONTENT_AUTHOR, getArticleAuthorPresentation } from "../src/lib/content-author";
import { DEPREM_PHASE3_SLUGS } from "../src/lib/deprem-phase3-articles";
import { DEPREM_PHASE4_ARTICLES, DEPREM_PHASE4_SLUGS } from "../src/lib/deprem-phase4-articles";
import { DEPREM_PILOT_SLUGS } from "../src/lib/deprem-pilot-articles";
import { getDepremRolloutVisualPath } from "../src/lib/deprem-rollout";
import { TS500_SLUGS } from "../src/lib/ts500-content";

const BATCH_1_SLUGS = [
  "mevcut-bina-riskli-yapi-ve-bolum-15-farki",
  "mevcut-bina-bilgi-duzeyleri",
  "mevcut-bina-tasiyici-rolove-hasar-belgeleme",
  "mevcut-bina-karot-beton-dayanimi",
] as const;

type Batch1Slug = (typeof BATCH_1_SLUGS)[number];

const requiredTokens: Record<Batch1Slug, string[]> = {
  "mevcut-bina-riskli-yapi-ve-bolum-15-farki": [
    "6306",
    "Ek-2",
    "15.1.6",
    "15.1.7",
    "riskli yapı tespiti",
    "performans",
    "Mühendislik kontrol listesi",
  ],
  "mevcut-bina-bilgi-duzeyleri": [
    "15.2.2",
    "BKS=3",
    "0.75",
    "1.00",
    "Tablo 15.1",
    "15.2.12",
    "Mühendislik kontrol listesi",
  ],
  "mevcut-bina-tasiyici-rolove-hasar-belgeleme": [
    "15.2.1.2",
    "inceleme çukuru",
    "kısa kolon",
    "derz",
    "15.1.6",
    "kat + aks + eleman",
    "Mühendislik kontrol listesi",
  ],
  "mevcut-bina-karot-beton-dayanimi": [
    "15.2.4.3",
    "15.2.5.3",
    "100 mm",
    "400 m²",
    "0.85 × ortalama",
    "%75",
    "TS EN 12504-1",
    "Mühendislik kontrol listesi",
  ],
};

const errors: string[] = [];
const assert = (condition: unknown, message: string) => {
  if (!condition) errors.push(message);
};

assert(DEPREM_PHASE4_ARTICLES.length === 4, `FAZ 4 Batch 1 override sayısı 4 olmalı; bulunan ${DEPREM_PHASE4_ARTICLES.length}.`);
assert(DEPREM_PHASE4_SLUGS.size === 4, "FAZ 4 source-of-truth slug kümesinde tekrar/eksik kayıt var.");
for (const slug of BATCH_1_SLUGS) assert(DEPREM_PHASE4_SLUGS.has(slug), `FAZ 4 Batch 1 slug eksik: ${slug}`);

const allArticles = getArticleList();
const targetCounts = {
  "mevcut-guclendirme": allArticles.filter((article) => article.seriesId === "mevcut-guclendirme").length,
  "su-zemin": allArticles.filter((article) => article.seriesId === "su-zemin").length,
  "yapi-denetimi": allArticles.filter((article) => article.seriesId === "yapi-denetimi").length,
};
assert(targetCounts["mevcut-guclendirme"] === 13, `Mevcut bina/güçlendirme hedefi 13 olmalı; bulunan ${targetCounts["mevcut-guclendirme"]}.`);
assert(targetCounts["su-zemin"] === 11, `Zemin/temel/su hedefi 11 olmalı; bulunan ${targetCounts["su-zemin"]}.`);
assert(targetCounts["yapi-denetimi"] === 8, `Yapı denetimi/malzeme hedefi 8 olmalı; bulunan ${targetCounts["yapi-denetimi"]}.`);

for (const slug of BATCH_1_SLUGS) {
  const configured = DEPREM_PHASE4_ARTICLES.find((article) => article.slug === slug);
  assert(Boolean(configured), `FAZ 4 Batch 1 source-of-truth makalesi bulunamadı: ${slug}`);
  if (!configured) continue;

  assert(!TS500_SLUGS.has(slug), `FAZ 4 TS500 kapsamına taşmış: ${slug}`);
  assert(!DEPREM_PILOT_SLUGS.has(slug), `FAZ 4 pilot ile çakışıyor: ${slug}`);
  assert(!DEPREM_PHASE3_SLUGS.has(slug), `FAZ 4 FAZ 3 source-of-truth ile çakışıyor: ${slug}`);
  assert(configured.sections.length >= 6, `FAZ 4 profesyonel bölüm sayısı yetersiz: ${slug}`);
  assert(configured.references.length >= 2, `FAZ 4 doğrulanabilir referans sayısı yetersiz: ${slug}`);
  assert(configured.references.some((ref) => ref.href?.includes("TBDY_2018.pdf")), `AFAD TBDY PDF referansı eksik: ${slug}`);
  assert(configured.references.some((ref) => ref.href?.includes("turkiye-bina-deprem-yonetmeligi")), `AFAD TBDY resmî sayfa referansı eksik: ${slug}`);

  if (slug === "mevcut-bina-riskli-yapi-ve-bolum-15-farki") {
    assert(configured.references.some((ref) => ref.href?.includes("kdb.gov.tr")), "Riskli yapı makalesinde Kentsel Dönüşüm Başkanlığı resmî kaynağı eksik.");
    assert(configured.references.some((ref) => ref.href?.includes("yonetmel-k---7.5.16849")), "Riskli yapı makalesinde 6306 Uygulama Yönetmeliği resmî PDF kaynağı eksik.");
  }

  const configuredText = configured.sections.map((section) => `${section.title}\n${section.content}`).join("\n");
  assert(!configuredText.includes("Kapsam ve karar\n"), `C3 jenerik bölüm başlığı kaldı: ${slug}`);
  assert(!configuredText.includes("Proje kontrol sırası\n"), `C3 jenerik kontrol başlığı kaldı: ${slug}`);
  assert(!/[�ÃÄÅÂ]/.test(configuredText), `Encoding şüphesi: ${slug}`);
  assert(!configuredText.includes("/deprem-yonetmelik/araclar/"), `Eski araç route'u FAZ 4 gövdesinde kaldı: ${slug}`);
  for (const token of requiredTokens[slug]) assert(configuredText.includes(token), `FAZ 4 teknik işareti eksik (${token}): ${slug}`);

  const article = getArticleBySlug(slug);
  assert(Boolean(article), `FAZ 4 runtime makalesi bulunamadı: ${slug}`);
  if (!article) continue;

  assert(article.sectionId === "deprem-yonetmelik", `Yanlış sectionId: ${slug}`);
  assert(article.seriesId === "mevcut-guclendirme", `FAZ 4 Batch 1 seriesId mevcut-guclendirme olmalı: ${slug}`);
  assert(article.author === DEPREM_CONTENT_AUTHOR.name, `Canonical yazar uygulanmadı: ${slug}`);
  assert(article.authorTitle === "", `Canonical authorTitle boş olmalı: ${slug}`);
  assert(getArticleAuthorPresentation(article).monogram === DEPREM_CONTENT_AUTHOR.monogram, `HG monogram uygulanmadı: ${slug}`);
  assert(article.updatedAt === "26 Ağustos 2026", `updatedAt beklenenden farklı: ${slug}`);
  assert(article.sections.length === configured.sections.length, `Runtime bölüm sayısı FAZ 4 gövdesiyle uyuşmuyor: ${slug}`);
  assert(article.sections[0]?.content.startsWith(configured.sections[0]?.content.trim() ?? ""), `Runtime ilk bölüm FAZ 4 gövdesinden gelmiyor: ${slug}`);

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
  assert(blocks.filter((block) => block.type === "formula").length === 0, `FAZ 4 Batch 1'de gereksiz FormulaBlock bulundu: ${slug}`);
}

if (errors.length > 0) {
  console.error("Deprem FAZ 4 Batch 1 kontrolü başarısız:\n");
  for (const error of [...new Set(errors)]) console.error(`- ${error}`);
  process.exit(1);
}

console.log(JSON.stringify({
  status: "ok",
  phase: "FAZ 4",
  completedBatches: 1,
  phase4Overrides: DEPREM_PHASE4_ARTICLES.length,
  targetArticles: 32,
  remaining: 28,
  batch1Slugs: BATCH_1_SLUGS,
  classification: Object.fromEntries(BATCH_1_SLUGS.map((slug) => [slug, "C3"])),
  sourceOfTruth: "src/lib/deprem-phase4-articles.ts",
  officialSourceProfile: "AFAD TBDY 2018 Bölüm 15 + Kentsel Dönüşüm Başkanlığı/6306 resmî kaynakları",
  visualContract: "existing unique rollout cover + body figure preserved",
  seriesCoverage: { "mevcut-guclendirme": 4, "su-zemin": 0, "yapi-denetimi": 0 },
  targetCoverage: { "mevcut-guclendirme": 13, "su-zemin": 11, "yapi-denetimi": 8, total: 32 },
  ts500Touched: false,
}, null, 2));
