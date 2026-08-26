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

const BATCH_2_SLUGS = [
  "mevcut-bina-donati-tespiti-korozyon",
  "mevcut-bina-beklenen-dayanim-bilgi-katsayisi",
  "mevcut-bina-sunek-gevrek-hasar-siniflamasi",
  "mevcut-bina-dogrusal-degerlendirme-sinirlari",
] as const;

const BATCH_3_SLUGS = [
  "kolon-guclendirme-yontemleri-cfrp-ve-beton-mantolu",
  "guclendirme-betonarme-perde-eklenmesi",
  "guclendirme-temel-sistemi-yuk-aktarimi",
] as const;

const BATCH_4_SLUGS = [
  "mevcut-binalarin-deprem-guvenligi-nasil-degerlendirilir",
  "hasarli-bina-tespiti-yesil-sari-kirmizi-etiket-sistemi",
] as const;

const BATCH_5_SLUGS = [
  "zemin-temel-etudu-rapor-kategorileri",
  "zemin-raporu-verilerinin-yapi-modeline-aktarimi",
  "temel-tasima-gucu-oturma-kontrolu",
  "temel-kayma-devrilme-guvenligi",
] as const;

const PHASE4_SLUGS = [...BATCH_1_SLUGS, ...BATCH_2_SLUGS, ...BATCH_3_SLUGS, ...BATCH_4_SLUGS, ...BATCH_5_SLUGS] as const;
type Phase4Slug = (typeof PHASE4_SLUGS)[number];
const SU_ZEMIN_SLUGS = new Set<string>(BATCH_5_SLUGS);

const requiredTokens: Record<Phase4Slug, string[]> = {
  "mevcut-bina-riskli-yapi-ve-bolum-15-farki": ["6306", "Ek-2", "15.1.6", "15.1.7", "riskli yapı tespiti", "performans", "Mühendislik kontrol listesi"],
  "mevcut-bina-bilgi-duzeyleri": ["15.2.2", "BKS=3", "0.75", "1.00", "Tablo 15.1", "15.2.12", "Mühendislik kontrol listesi"],
  "mevcut-bina-tasiyici-rolove-hasar-belgeleme": ["15.2.1.2", "inceleme çukuru", "kısa kolon", "derz", "15.1.6", "kat + aks + eleman", "Mühendislik kontrol listesi"],
  "mevcut-bina-karot-beton-dayanimi": ["15.2.4.3", "15.2.5.3", "100 mm", "400 m²", "0.85 × ortalama", "%75", "TS EN 12504-1", "Mühendislik kontrol listesi"],
  "mevcut-bina-donati-tespiti-korozyon": ["15.2.4.2", "15.2.5.2", "%5", "%20", "%30", "%15", "donatı gerçekleşme katsayısı", "korozyon", "1.00", "Mühendislik kontrol listesi"],
  "mevcut-bina-beklenen-dayanim-bilgi-katsayisi": ["mevcut malzeme dayanımı", "15.2.3", "15.2.12", "0.75", "1.00", "malzeme katsayıları", "mevcut çelik dayanımı", "Mühendislik kontrol listesi"],
  "mevcut-bina-sunek-gevrek-hasar-siniflamasi": ["15.5.2.2", "Ve", "gevrek", "Sınırlı Hasar", "Kontrollü Hasar", "Göçme Öncesi Hasar", "15.3.3", "en fazla hasar gören kesit", "Mühendislik kontrol listesi"],
  "mevcut-bina-dogrusal-degerlendirme-sinirlari": ["15.5.3.1", "BYS < 5", "B3 düzensizliği", "EKO", "3'ten büyük", "5'ten büyük", "Σ(Vi × EKOi) / ΣVi", "15.6", "Mühendislik kontrol listesi"],
  "kolon-guclendirme-yontemleri-cfrp-ve-beton-mantolu": ["15.10.1", "15.10.2", "100 mm", "0.9", "eğilme kapasitesi", "EK 15B", "0.004", "0.50", "2.5", "Mühendislik kontrol listesi"],
  "guclendirme-betonarme-perde-eklenmesi": ["15.10.5.1", "16 mm", "10 katı", "400 mm", "7.6.5", "16.7", "16.8", "sürtünme kesmesi", "Mühendislik kontrol listesi"],
  "guclendirme-temel-sistemi-yuk-aktarimi": ["15.9.3.2", "15.10.5", "Et ≤ Rt", "16.7.3.1", "%30", "16.8.1.1", "taşıma gücü", "yatayda kayma", "Mühendislik kontrol listesi"],
  "mevcut-binalarin-deprem-guvenligi-nasil-degerlendirilir": ["15.1.6", "15.2.1.2", "15.2.12", "0.75", "1.00", "15.4.1", "I = 1.0", "15.5", "15.6", "Tablo 3.4", "Mühendislik kontrol listesi"],
  "hasarli-bina-tespiti-yesil-sari-kirmizi-etiket-sistemi": ["7663", "7269", "gözlemsel", "performansını ve riskini", "Hasarsız", "Az Hasarlı", "Orta Hasarlı", "Ağır Hasarlı", "Yıkık", "Acil Yıktırılacak", "Kesin hasar tespiti", "itiraz hasar tespiti", "15.1.6", "Mühendislik kontrol listesi"],
  "zemin-temel-etudu-rapor-kategorileri": ["Kategori 1", "Kategori 2", "Kategori 3", "16.4.3", "en az 2 adet sismik ölçü", "VS30 > 360 m/s", "16.2.2.1", "16.2.2.2", "300 m²", "1.5 katı", "%10", "Mühendislik kontrol listesi"],
  "zemin-raporu-verilerinin-yapi-modeline-aktarimi": ["16.2.2.1", "16.2.2.2", "Veri Raporu", "Geoteknik Rapor", "ZA–ZF", "SDS = SS × FS", "SD1 = S1 × F1", "ZF", "16.5", "16.7.3.1", "4.10.3", "Mühendislik kontrol listesi"],
  "temel-tasima-gucu-oturma-kontrolu": ["16.7.1.1", "Et ≤ Rt", "16.8.1.1", "16.8.3.1", "qo ≤ qt", "1.4", "1.1", "oturma", "yerdeğiştirme", "Mühendislik kontrol listesi"],
  "temel-kayma-devrilme-guvenligi": ["16.7.3.2", "16.7.3.3", "%30", "16.8.4.1", "Vth ≤ Rth + 0.3 Rpt", "1.1", "1.4", "temel taban basıncı", "Mühendislik kontrol listesi"],
};

const errors: string[] = [];
const assert = (condition: unknown, message: string) => { if (!condition) errors.push(message); };

assert(DEPREM_PHASE4_ARTICLES.length === 17, `FAZ 4 override sayısı 17 olmalı; bulunan ${DEPREM_PHASE4_ARTICLES.length}.`);
assert(DEPREM_PHASE4_SLUGS.size === 17, "FAZ 4 source-of-truth slug kümesinde tekrar/eksik kayıt var.");
for (const slug of PHASE4_SLUGS) assert(DEPREM_PHASE4_SLUGS.has(slug), `FAZ 4 slug eksik: ${slug}`);

const allArticles = getArticleList();
const targetCounts = {
  "mevcut-guclendirme": allArticles.filter((article) => article.seriesId === "mevcut-guclendirme").length,
  "su-zemin": allArticles.filter((article) => article.seriesId === "su-zemin").length,
  "yapi-denetimi": allArticles.filter((article) => article.seriesId === "yapi-denetimi").length,
};
assert(targetCounts["mevcut-guclendirme"] === 13, `Mevcut bina/güçlendirme hedefi 13 olmalı; bulunan ${targetCounts["mevcut-guclendirme"]}.`);
assert(targetCounts["su-zemin"] === 11, `Zemin/temel/su hedefi 11 olmalı; bulunan ${targetCounts["su-zemin"]}.`);
assert(targetCounts["yapi-denetimi"] === 8, `Yapı denetimi/malzeme hedefi 8 olmalı; bulunan ${targetCounts["yapi-denetimi"]}.`);

for (const slug of PHASE4_SLUGS) {
  const configured = DEPREM_PHASE4_ARTICLES.find((article) => article.slug === slug);
  assert(Boolean(configured), `FAZ 4 source-of-truth makalesi bulunamadı: ${slug}`);
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
  if (slug === "hasarli-bina-tespiti-yesil-sari-kirmizi-etiket-sistemi") {
    assert(configured.references.some((ref) => ref.href?.includes("Hasar_Tespit_Genelgesi_ve_Ekleri.pdf")), "Hasar tespit makalesinde AFAD 7663 Genelge PDF kaynağı eksik.");
    assert(configured.references.some((ref) => ref.href?.includes("afet-hasarlari-tespiti-dairesi-mevzuati")), "Hasar tespit makalesinde ÇŞİDB güncel afet hasar mevzuatı sayfası eksik.");
  }
  if (slug === "zemin-temel-etudu-rapor-kategorileri") {
    assert(configured.references.some((ref) => ref.href?.includes("zemin-ve-temel-etudu-uygulama-esaslari")), "Etüt kategorileri makalesinde ÇŞİDB resmî Tebliğ sayfası eksik.");
    assert(configured.references.some((ref) => ref.href?.includes("20210217-4.htm")), "Etüt kategorileri makalesinde 2021 Resmî Gazete değişikliği eksik.");
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

  const expectedSeries = SU_ZEMIN_SLUGS.has(slug) ? "su-zemin" : "mevcut-guclendirme";
  assert(article.sectionId === "deprem-yonetmelik", `Yanlış sectionId: ${slug}`);
  assert(article.seriesId === expectedSeries, `FAZ 4 seriesId ${expectedSeries} olmalı: ${slug}`);
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
  assert(blocks.filter((block) => block.type === "formula").length === 0, `FAZ 4 Batch 1-5'te gereksiz FormulaBlock bulundu: ${slug}`);
}

if (errors.length > 0) {
  console.error("Deprem FAZ 4 Batch 1-5 kontrolü başarısız:\n");
  for (const error of [...new Set(errors)]) console.error(`- ${error}`);
  process.exit(1);
}

console.log(JSON.stringify({
  status: "ok",
  phase: "FAZ 4",
  completedBatches: 5,
  phase4Overrides: DEPREM_PHASE4_ARTICLES.length,
  targetArticles: 32,
  remaining: 15,
  batch1Slugs: BATCH_1_SLUGS,
  batch2Slugs: BATCH_2_SLUGS,
  batch3Slugs: BATCH_3_SLUGS,
  batch4Slugs: BATCH_4_SLUGS,
  batch5Slugs: BATCH_5_SLUGS,
  batch5Classification: Object.fromEntries(BATCH_5_SLUGS.map((slug) => [slug, "C3"])),
  sourceOfTruth: "src/lib/deprem-phase4-articles.ts",
  officialSourceProfile: "AFAD TBDY 2018 Bölüm 2/16 + ÇŞİDB Zemin ve Temel Etüdü Tebliği + 17.02.2021 Resmî Gazete değişikliği",
  visualContract: "existing unique rollout cover + body figure preserved",
  seriesCoverage: { "mevcut-guclendirme": 13, "su-zemin": 4, "yapi-denetimi": 0 },
  targetCoverage: { "mevcut-guclendirme": 13, "su-zemin": 11, "yapi-denetimi": 8, total: 32 },
  ts500Touched: false,
}, null, 2));
