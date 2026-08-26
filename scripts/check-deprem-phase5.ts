import { parseBlocks } from "../src/lib/article-blocks";
import { getArticleBySlug, getArticleList } from "../src/lib/articles-data";
import { DEPREM_CONTENT_AUTHOR, getArticleAuthorPresentation } from "../src/lib/content-author";
import { DEPREM_PHASE3_SLUGS } from "../src/lib/deprem-phase3-articles";
import { DEPREM_PHASE4_SLUGS } from "../src/lib/deprem-phase4-articles";
import { DEPREM_PHASE5_ARTICLES, DEPREM_PHASE5_SLUGS } from "../src/lib/deprem-phase5-articles";
import { DEPREM_PILOT_SLUGS } from "../src/lib/deprem-pilot-articles";
import { getDepremRolloutVisualPath } from "../src/lib/deprem-rollout";
import { TS500_SLUGS } from "../src/lib/ts500-content";

const FIRE_C3_SLUGS = [
  "byy-bina-kullanim-siniflari-tehlike-kategorileri",
  "tasiyici-sistemlerin-yangina-dayanim-suresi-r30-r60-r90-r120",
  "sprinkler-sistemi-zorunluluk-sinirlari",
  "duman-tahliyesi-mekanik-ve-dogal-sistemler",
  "kacis-merdiveni-tasarim-kriterleri",
  "yangin-kapisi-dosleme-duvar-gecis-detaylari",
  "yangin-algilama-ve-ihbar-sistemi-gereksinimleri",
  "yuksek-binalarda-ozel-yangin-onlemleri-bolum-9",
  "bodrum-otopark-mutfak-yangin-uygulamalari",
] as const;
const ISG_BATCH_4_SLUGS = [
  "isg-santiye-guvenlik-plani-zorunlu-icerik",
  "isg-uzmani-gorevlendirme-tehlike-sinifi-isci-sayisi",
  "isg-yuksekte-calisma-ve-iskele-guvenligi",
  "isg-kazi-guvenligi-iksa-tasarimi-ve-kontrol",
  "isg-beton-dokumunde-topraklama-ve-elektrik-guvenligi",
] as const;
const CEVRE_BATCH_5_SLUGS = [
  "cevre-ced-zorunlulugu-proje-buyuklugu-esikleri",
  "cevre-insaat-atigi-yonetimi-yonetmeligi",
  "cevre-gurultu-ve-toz-santiye-yukumlulukleri",
  "cevre-yagmur-suyu-kirliligi-ve-santiye-filtrasyonu",
] as const;
const PHASE5_C3_SLUGS = [...FIRE_C3_SLUGS, ...ISG_BATCH_4_SLUGS, ...CEVRE_BATCH_5_SLUGS] as const;
type Phase5C3Slug = (typeof PHASE5_C3_SLUGS)[number];
const FIRE_SET = new Set<string>(FIRE_C3_SLUGS);
const ISG_SET = new Set<string>(ISG_BATCH_4_SLUGS);
const CEVRE_SET = new Set<string>(CEVRE_BATCH_5_SLUGS);
const C1_FIRE_PILOT = "yangin-bolmesi-koridoru-kacis-yolu-boyutlandirma" as const;
const EXCAVATION_SLUG = "isg-kazi-guvenligi-iksa-tasarimi-ve-kontrol" as const;
const CED_SLUG = "cevre-ced-zorunlulugu-proje-buyuklugu-esikleri" as const;

const requiredTokens: Record<Phase5C3Slug, string[]> = {
  "byy-bina-kullanim-siniflari-tehlike-kategorileri": ["Madde 8", "Madde 18", "Madde 19", "Ek-1/A", "Ek-1/B", "Ek-1/C", "30 dakika", "126 m²", "su ve pompa kapasitesi", "Mühendislik kontrol listesi"],
  "tasiyici-sistemlerin-yangina-dayanim-suresi-r30-r60-r90-r120": ["Madde 20", "Ek-3/B", "Ek-3/C", "R30", "R60", "R90", "R120", "REI", "30,50 m", "İzin verilmez", "Teknik sorumluluk", "Mühendislik kontrol listesi"],
  "sprinkler-sistemi-zorunluluk-sinirlari": ["Madde 96", "30,50 m", "51,50 m", "600 m²", "21,50 m", "2000 m²", "1000 m²", "TS EN 12259", "TS EN 12845", "Teknik sorumluluk", "Mühendislik kontrol listesi"],
  "duman-tahliyesi-mekanik-ve-dogal-sistemler": ["Madde 85", "Madde 86", "Madde 87", "Madde 89", "30,50 m", "51,50 m", "50 Pa", "60 dakika", "yangın damperi", "Teknik sorumluluk", "Mühendislik kontrol listesi"],
  "kacis-merdiveni-tasarim-kriterleri": ["Madde 38", "Madde 39", "Madde 40", "Madde 41", "120 dakika", "90 dakika", "10 m", "15 m", "210 cm", "175 mm", "250 mm", "Teknik sorumluluk", "Mühendislik kontrol listesi"],
  "yangin-kapisi-dosleme-duvar-gecis-detaylari": ["Madde 25", "Madde 47", "80 cm", "200 cm", "60 dakika", "90 dakika", "120 dakika", "firestop", "duman sızdırmaz", "Teknik sorumluluk", "Mühendislik kontrol listesi"],
  "yangin-algilama-ve-ihbar-sistemi-gereksinimleri": ["Madde 74", "Madde 75", "Madde 76", "Ek-7", "TS EN 54", "TS EN 54-14", "60 m", "110 cm", "130 cm", "Danıştay", "su akış anahtarı", "Teknik sorumluluk", "Mühendislik kontrol listesi"],
  "yuksek-binalarda-ozel-yangin-onlemleri-bolum-9": ["21,50 m", "30,50 m", "51,50 m", "1,8 m²", "6 m²", "10 m²", "120 dakika", "90 dakika", "açık kaçış merdiveni", "acil durum asansörü", "Teknik sorumluluk", "Mühendislik kontrol listesi"],
  "bodrum-otopark-mutfak-yangin-uygulamalari": ["Madde 57", "Madde 60", "Madde 88", "600 m²", "2.000 m²", "10 hava değişimi", "100", "davlumbaz", "gaz algılama", "otomatik söndürme", "Teknik sorumluluk", "Mühendislik kontrol listesi"],
  "isg-santiye-guvenlik-plani-zorunlu-icerik": ["sağlık ve güvenlik planı", "6 ana başlık", "30 iş günü", "20 çalışan", "500 yevmiye", "sağlık ve güvenlik koordinatörü", "Mühendislik kontrol listesi"],
  "isg-uzmani-gorevlendirme-tehlike-sinifi-isci-sayisi": ["6331", "NACE", "10 dakika", "20 dakika", "40 dakika", "1000", "500", "250", "OSGB", "Mühendislik kontrol listesi"],
  "isg-yuksekte-calisma-ve-iskele-guvenligi": ["seviye farkı", "toplu korunma", "1 metre", "125 kilogram", "15 santimetre", "47 santimetre", "TS EN 12810-1", "25,5 metre", "statik hesap", "Mühendislik kontrol listesi"],
  "isg-kazi-guvenligi-iksa-tasarimi-ve-kontrol": ["zemin", "şev", "statik hesabı", "iksa", "yeraltı hizmetleri", "fazla yük", "su", "titreşim", "deformasyon", "iş durdurma", "Mühendislik kontrol listesi"],
  "isg-beton-dokumunde-topraklama-ve-elektrik-guvenligi": ["300 mA", "30 mA", "topraklama", "etiketleme-kilitleme", "LOTO", "geçici elektrik", "beton pompası", "Mühendislik kontrol listesi"],
  "cevre-ced-zorunlulugu-proje-buyuklugu-esikleri": ["2026/4", "5 Mart 2026", "33187", "Ek-1", "Ek-2", "ÇED Raporu Hazırlanmalıdır", "ÇED Olumlu", "200 konut", "proje tarihinde", "Mühendislik kontrol listesi"],
  "cevre-insaat-atigi-yonetimi-yonetmeligi": ["18.03.2004", "25406", "Madde 9", "Madde 23", "2 tondan fazla", "Atık taşıma ve kabul", "ayrı toplamak", "izinli", "taslak", "Mühendislik kontrol listesi"],
  "cevre-gurultu-ve-toz-santiye-yukumlulukleri": ["30 Kasım 2022", "32029", "100 dBC", "10:00-22:00", "TS ISO 1996-1", "TS ISO 1996-2", "TS 13633", "TS 13883", "yıkım", "toz", "Mühendislik kontrol listesi"],
  "cevre-yagmur-suyu-kirliligi-ve-santiye-filtrasyonu": ["Su Kirliliği Kontrolü Yönetmeliği", "31.12.2004", "25687", "yağmur suyu hattı", "atıksu", "çöktürme", "sediment", "beton yıkama", "19 Mayıs 2026", "Mogan", "Mühendislik kontrol listesi"],
};

const isgSourceFragments: Record<(typeof ISG_BATCH_4_SLUGS)[number], string[]> = {
  "isg-santiye-guvenlik-plani-zorunlu-icerik": ["saglik-ve-guvenlik-plani", "yapi_i", "6331_isgkanunu"],
  "isg-uzmani-gorevlendirme-tehlike-sinifi-isci-sayisi": ["sikca-sorulan-sorular", "6331_isgkanunu", "in%C5%9Faat-sekt"],
  "isg-yuksekte-calisma-ve-iskele-guvenligi": ["yuksekte-calisma", "cephe-iskelelerinde-tip-proje", "in%C5%9Faat-sekt"],
  "isg-kazi-guvenligi-iksa-tasarimi-ve-kontrol": ["kazi-isleri", "yapi_i", "6331_isgkanunu"],
  "isg-beton-dokumunde-topraklama-ve-elektrik-guvenligi": ["elektrik-isleri", "is-ekipmanlari", "6331_isgkanunu"],
};
const cevreSourceFragments: Record<(typeof CEVRE_BATCH_5_SLUGS)[number], string[]> = {
  "cevre-ced-zorunlulugu-proje-buyuklugu-esikleri": ["20220729-2.htm", "20260305-3.htm", "ced-yonetmeligi-uygulamalarina-dair-genelge-304302", "moeucc-esmf"],
  "cevre-insaat-atigi-yonetimi-yonetmeligi": ["yonetmelikler-440", "insaat-ve-yikinti-atiklari-ile-ilgili-mevzuat-ve-uygulamalar", "taslaklar-443"],
  "cevre-gurultu-ve-toz-santiye-yukumlulukleri": ["20221130-1.htm", "cygm.csb.gov.tr", "20211013-1.htm"],
  "cevre-yagmur-suyu-kirliligi-ve-santiye-filtrasyonu": ["su-k-rl-l-g--kontrolu-yonetmel-g", "yonetmelikler-440", "mogan-golundeki-kirlilige-ceza"],
};

const errors: string[] = [];
const assert = (condition: unknown, message: string) => { if (!condition) errors.push(message); };
const textOf = (sections: { title: string; content: string }[]) => sections.map((section) => `${section.title}\n${section.content}`).join("\n");
const lower = (value: string) => value.toLocaleLowerCase("tr-TR");

assert(DEPREM_PHASE5_ARTICLES.length === 18, `FAZ 5 C3 override sayısı 18 olmalı; bulunan ${DEPREM_PHASE5_ARTICLES.length}.`);
assert(DEPREM_PHASE5_SLUGS.size === 18, "FAZ 5 C3 source-of-truth slug kümesinde tekrar/eksik kayıt var.");
for (const slug of PHASE5_C3_SLUGS) assert(DEPREM_PHASE5_SLUGS.has(slug), `FAZ 5 C3 slug eksik: ${slug}`);
assert(DEPREM_PILOT_SLUGS.has(C1_FIRE_PILOT), `FAZ 2 C1 Yangın pilotu bulunamadı: ${C1_FIRE_PILOT}`);
assert(!DEPREM_PHASE5_SLUGS.has(C1_FIRE_PILOT), `C1 pilot FAZ 5 override ile tekrar sahiplenilmiş: ${C1_FIRE_PILOT}`);

const allArticles = getArticleList();
const allSlugs = new Set(allArticles.map((article) => article.slug));
const targetCounts = Object.fromEntries(["yangin", "isg", "cevre"].map((seriesId) => [seriesId, allArticles.filter((article) => article.seriesId === seriesId).length]));
assert(targetCounts.yangin === 10, `Yangın hedefi 10 olmalı; bulunan ${targetCounts.yangin}.`);
assert(targetCounts.isg === 5, `İSG hedefi 5 olmalı; bulunan ${targetCounts.isg}.`);
assert(targetCounts.cevre === 4, `Çevre hedefi 4 olmalı; bulunan ${targetCounts.cevre}.`);

const qualityScores: Record<string, { classification: "C1" | "C3"; technicalAccuracyAndCoverage: number; officialSourceAccuracy: number; professionalDepth: number; visualQuality: number; tableExampleQuality: number; linkMetadataAuthorAccessibility: number; staticSubtotal: number }> = {};

for (const slug of PHASE5_C3_SLUGS) {
  const configured = DEPREM_PHASE5_ARTICLES.find((article) => article.slug === slug);
  assert(Boolean(configured), `FAZ 5 source-of-truth makalesi bulunamadı: ${slug}`);
  if (!configured) continue;
  const isFire = FIRE_SET.has(slug);
  const isIsg = ISG_SET.has(slug);
  const isCevre = CEVRE_SET.has(slug);
  assert(Number(isFire) + Number(isIsg) + Number(isCevre) === 1, `FAZ 5 seri sınıflaması belirsiz: ${slug}`);
  assert(!TS500_SLUGS.has(slug), `FAZ 5 TS500 kapsamına taşmış: ${slug}`);
  assert(!DEPREM_PILOT_SLUGS.has(slug), `FAZ 5 C3 pilot ile çakışıyor: ${slug}`);
  assert(!DEPREM_PHASE3_SLUGS.has(slug) && !DEPREM_PHASE4_SLUGS.has(slug), `FAZ 5 önceki faz source-of-truth ile çakışıyor: ${slug}`);
  assert(configured.sections.length >= 6, `FAZ 5 profesyonel bölüm sayısı yetersiz: ${slug}`);
  const minReferences = isFire || slug === CED_SLUG ? 4 : 3;
  assert(configured.references.length >= minReferences, `FAZ 5 doğrulanabilir referans sayısı yetersiz: ${slug}`);

  const hrefs = configured.references.map((ref) => ref.href ?? "");
  let sourcesOk = false;
  if (isFire) {
    sourcesOk = hrefs.some((href) => href.includes("mevzuat.gov.tr"))
      && hrefs.some((href) => href.includes("meslekihizmetler.csb.gov.tr/haberler/binalarin-yangindan-korunmasi-hakkinda-yonetmelik-kilavuzu"))
      && hrefs.some((href) => href.includes("20260507112134.pdf"))
      && hrefs.some((href) => href.includes("20250701-9.pdf"));
    assert(sourcesOk, `Yangın resmî kaynak profili eksik: ${slug}`);
    assert(!hrefs.some((href) => href.includes("20250328093036.pdf")), `Eski Mart 2025 yangın kılavuzu kaldı: ${slug}`);
  } else if (isIsg) {
    const fragments = isgSourceFragments[slug as (typeof ISG_BATCH_4_SLUGS)[number]];
    sourcesOk = hrefs.every((href) => href.includes("csgb.gov.tr")) && fragments.every((fragment) => hrefs.some((href) => href.includes(fragment)));
    assert(hrefs.every((href) => href.includes("csgb.gov.tr")), `İSG kaynağı resmî ÇSGB alanında değil: ${slug}`);
    for (const fragment of fragments) assert(hrefs.some((href) => href.includes(fragment)), `İSG resmî kaynak işareti eksik (${fragment}): ${slug}`);
    assert(!hrefs.some((href) => href.includes("MevzuatNo=200712937")), `İSG makalesine Yangın kaynak profili taşınmış: ${slug}`);
  } else {
    const fragments = cevreSourceFragments[slug as (typeof CEVRE_BATCH_5_SLUGS)[number]];
    const officialDomainsOk = hrefs.every((href) => href.includes("csb.gov.tr") || href.includes("resmigazete.gov.tr"));
    sourcesOk = officialDomainsOk && fragments.every((fragment) => hrefs.some((href) => href.includes(fragment)));
    assert(officialDomainsOk, `Çevre kaynağı resmî ÇŞİDB/Resmî Gazete alanında değil: ${slug}`);
    for (const fragment of fragments) assert(hrefs.some((href) => href.includes(fragment)), `Çevre resmî kaynak işareti eksik (${fragment}): ${slug}`);
  }

  const configuredText = textOf(configured.sections);
  const configuredLower = lower(configuredText);
  for (const token of requiredTokens[slug]) assert(configuredLower.includes(lower(token)), `FAZ 5 teknik işareti eksik (${token}): ${slug}`);
  assert(!/[�ÃÄÅÂ]/.test(configuredText), `Encoding şüphesi: ${slug}`);
  assert(!configuredText.includes("/deprem-yonetmelik/araclar/"), `Eski araç route'u FAZ 5 gövdesinde kaldı: ${slug}`);
  assert(!configuredText.includes("Mevzuat kapsamı ve kritik eşikler\n") && !configuredText.includes("Proje ve saha için minimum kontrol zinciri\n"), `Jenerik normalizer başlığı kaldı: ${slug}`);
  const depthSignals = isFire ? ["proje", "sorumluluk", "yanlış", "kontrol listesi"] : isIsg ? ["risk", "kontrol", "sorumluluk", "kontrol listesi"] : ["kontrol", "sorumluluk", "yanlış", "kontrol listesi"];
  for (const signal of depthSignals) assert(configuredLower.includes(signal), `Profesyonel derinlik sinyali eksik (${signal}): ${slug}`);
  assert(configuredText.includes("|---"), `Gerçek teknik tablo bulunamadı: ${slug}`);
  const measurableOk = /\d/.test(configuredText) || (slug === EXCAVATION_SLUG && ["statik hesabı", "deformasyon", "iş durdurma"].every((token) => configuredLower.includes(token)));
  assert(measurableOk, `Sayısal veya tanımlı ölçülebilir kontrol girdisi bulunamadı: ${slug}`);

  if (slug === "yangin-algilama-ve-ihbar-sistemi-gereksinimleri") {
    assert(configuredText.includes("iptal") && configuredText.includes("eski") && configuredText.includes("güncel konsolide"), "Ek-7 Danıştay iptal/güncel konsolide ayrımı açık değil.");
  }
  if (slug === "cevre-insaat-atigi-yonetimi-yonetmeligi") {
    assert(configuredLower.includes("taslak") && configured.references.some((ref) => ref.href?.includes("taslaklar-443")), "Çevre atık makalesinde yürürlük/taslak ayrımı yok.");
  }
  if (slug === "cevre-gurultu-ve-toz-santiye-yukumlulukleri") {
    assert(configuredLower.includes("yıkım") && configuredLower.includes("genel inşaat"), "Gürültü/toz makalesinde yıkım-standart kapsam ayrımı açık değil.");
  }

  const article = getArticleBySlug(slug);
  assert(Boolean(article), `FAZ 5 runtime makalesi bulunamadı: ${slug}`);
  if (!article) continue;
  const expectedSeries = isFire ? "yangin" : isIsg ? "isg" : "cevre";
  assert(article.sectionId === "deprem-yonetmelik", `Yanlış sectionId: ${slug}`);
  assert(article.seriesId === expectedSeries, `FAZ 5 C3 slug yanlış seride: ${slug} -> ${article.seriesId ?? "yok"}`);
  assert(article.author === DEPREM_CONTENT_AUTHOR.name && article.authorTitle === "", `Canonical yazar uygulanmadı: ${slug}`);
  assert(getArticleAuthorPresentation(article).monogram === DEPREM_CONTENT_AUTHOR.monogram, `HG monogram uygulanmadı: ${slug}`);
  assert(article.updatedAt === "26 Ağustos 2026", `updatedAt beklenenden farklı: ${slug}`);
  assert(article.sections.length === configured.sections.length, `Runtime bölüm sayısı source-of-truth ile uyuşmuyor: ${slug}`);
  assert((article.relatedSlugs ?? []).every((relatedSlug) => allSlugs.has(relatedSlug)), `Geçersiz related slug var: ${slug}`);

  const cover = getDepremRolloutVisualPath(slug, "cover");
  const diagram = getDepremRolloutVisualPath(slug, "diagram");
  const coverOk = article.image === cover && article.image !== "/covers/yonetmelik.svg";
  const blocks = article.sections.flatMap((section) => parseBlocks(section.content));
  const figure = blocks.find((block) => block.type === "image" && block.src === diagram);
  const figureMetadataOk = figure?.type === "image" ? Boolean(figure.alt.trim() && figure.caption.trim() && figure.sourceNote.trim() && figure.lightbox) : false;
  assert(coverOk, `Benzersiz rollout cover uygulanmadı: ${slug}`);
  assert(Boolean(figure) && figureMetadataOk, `Bilgi taşıyan rollout body figure/metadata bulunamadı: ${slug}`);
  assert(blocks.filter((block) => block.type === "formula").length === 0, `FAZ 5 C3 gövdesinde gereksiz FormulaBlock bulundu: ${slug}`);

  const technicalOk = requiredTokens[slug].every((token) => configuredLower.includes(lower(token)));
  const depthOk = depthSignals.every((signal) => configuredLower.includes(signal));
  const tableExampleOk = configuredText.includes("|---") && measurableOk;
  const metadataOk = Boolean(configured.seoTitle.trim() && configured.seoDescription.trim()) && article.author === DEPREM_CONTENT_AUTHOR.name && getArticleAuthorPresentation(article).monogram === DEPREM_CONTENT_AUTHOR.monogram && (article.relatedSlugs ?? []).every((relatedSlug) => allSlugs.has(relatedSlug)) && !/[�ÃÄÅÂ]/.test(configuredText);
  const score = {
    classification: "C3" as const,
    technicalAccuracyAndCoverage: technicalOk ? 25 : 0,
    officialSourceAccuracy: sourcesOk ? 15 : 0,
    professionalDepth: depthOk ? 15 : 0,
    visualQuality: coverOk && Boolean(figure) && figureMetadataOk ? 15 : 0,
    tableExampleQuality: tableExampleOk ? 10 : 0,
    linkMetadataAuthorAccessibility: metadataOk ? 10 : 0,
    staticSubtotal: 0,
  };
  score.staticSubtotal = score.technicalAccuracyAndCoverage + score.officialSourceAccuracy + score.professionalDepth + score.visualQuality + score.tableExampleQuality + score.linkMetadataAuthorAccessibility;
  qualityScores[slug] = score;
  assert(score.staticSubtotal >= 80, `FAZ 5 statik kalite skoru 80/90 altı: ${slug} -> ${score.staticSubtotal}/90`);
}

const pilot = getArticleBySlug(C1_FIRE_PILOT);
assert(Boolean(pilot), `FAZ 2 C1 pilot runtime makalesi bulunamadı: ${C1_FIRE_PILOT}`);
if (pilot) {
  const pilotText = textOf(pilot.sections);
  const pilotLower = lower(pilotText);
  const pilotCover = "/images/deprem-pilots/yangin-bolmesi-koridoru-kacis-yolu-boyutlandirma-cover.svg";
  const pilotDiagram = "/images/deprem-pilots/yangin-bolmesi-koridoru-kacis-yolu-boyutlandirma-diagram.svg";
  const pilotBlocks = pilot.sections.flatMap((section) => parseBlocks(section.content));
  const pilotFigure = pilotBlocks.find((block) => block.type === "image" && block.src === pilotDiagram);
  const figureOk = pilotFigure?.type === "image" ? Boolean(pilotFigure.alt.trim() && pilotFigure.caption.trim() && pilotFigure.sourceNote.trim() && pilotFigure.lightbox) : false;
  const sourceOk = (pilot.references?.some((ref) => ref.href?.includes("20260507112134.pdf")) ?? false) && (pilot.references?.some((ref) => ref.href?.includes("emo.org.tr")) ?? false);
  const technicalOk = pilot.sections.length >= 4 && ["Madde 33", "kullanıcı yükü", "yangın bölmesi", "80 cm"].every((token) => pilotLower.includes(lower(token)));
  const depthOk = ["kullanıcı yükü", "dar boğaz", "güzergâh", "proje sorumluluğu"].every((signal) => pilotLower.includes(signal));
  const visualOk = pilot.image === pilotCover && Boolean(pilotFigure) && figureOk;
  const tableOk = pilotText.includes("|---") && /\d/.test(pilotText);
  const metadataOk = pilot.author === DEPREM_CONTENT_AUTHOR.name && getArticleAuthorPresentation(pilot).monogram === DEPREM_CONTENT_AUTHOR.monogram && (pilot.relatedSlugs ?? []).every((relatedSlug) => allSlugs.has(relatedSlug));
  assert(pilot.seriesId === "yangin" && pilot.updatedAt === "25 Ağustos 2026", "C1 Yangın pilot seri/tarih kontratı bozuldu.");
  assert(pilot.author === DEPREM_CONTENT_AUTHOR.name && pilot.authorTitle === "", "C1 pilot canonical yazar uygulanmadı.");
  assert(technicalOk && sourceOk && visualOk && tableOk && metadataOk, "C1 Yangın pilot teknik/kaynak/görsel kontratı bozuldu.");
  const pilotScore = { classification: "C1" as const, technicalAccuracyAndCoverage: technicalOk ? 25 : 0, officialSourceAccuracy: sourceOk ? 15 : 0, professionalDepth: depthOk ? 15 : 0, visualQuality: visualOk ? 15 : 0, tableExampleQuality: tableOk ? 10 : 0, linkMetadataAuthorAccessibility: metadataOk ? 10 : 0, staticSubtotal: 0 };
  pilotScore.staticSubtotal = pilotScore.technicalAccuracyAndCoverage + pilotScore.officialSourceAccuracy + pilotScore.professionalDepth + pilotScore.visualQuality + pilotScore.tableExampleQuality + pilotScore.linkMetadataAuthorAccessibility;
  qualityScores[C1_FIRE_PILOT] = pilotScore;
  assert(pilotScore.staticSubtotal >= 80, `C1 Yangın pilot kalite skoru 80/90 altı: ${pilotScore.staticSubtotal}/90`);
}

if (errors.length) {
  console.error("Deprem FAZ 5 kontrolü başarısız:\n");
  for (const error of [...new Set(errors)]) console.error(`- ${error}`);
  process.exit(1);
}

console.log(JSON.stringify({
  status: "ok",
  phase: "FAZ 5",
  completedBatches: 5,
  phase5Overrides: DEPREM_PHASE5_ARTICLES.length,
  phase2C1CarryForward: [C1_FIRE_PILOT],
  completedArticles: 19,
  targetArticles: 19,
  remaining: 0,
  batch5Slugs: CEVRE_BATCH_5_SLUGS,
  classifications: { ...Object.fromEntries(PHASE5_C3_SLUGS.map((slug) => [slug, "C3"])), [C1_FIRE_PILOT]: "C1" },
  sourceOfTruth: "src/lib/deprem-phase5-articles.ts + preserved FAZ 2 C1 Yangın pilot",
  officialSourceProfile: "Yangın: güncel BYKHY + ÇŞİDB Mayıs 2026 kılavuzu; İSG: ÇSGB/Güvenli İnşaat + 6331; Çevre: 2026 ÇED zinciri + yürürlükte hafriyat/atık, gürültü/yıkım ve su kirliliği ÇŞİDB/Resmî Gazete kaynakları",
  visualContract: "18 rollout unique cover/body figure + 1 preserved FAZ 2 pilot unique cover/body figure",
  qualityScoreContract: "static subtotal >=80/90 + responsive layout QA 10/10 => final >=90/100; hard-fail assertions mandatory",
  qualityScores,
  seriesCoverage: { yangin: 10, isg: 5, cevre: 4 },
  targetCoverage: { yangin: 10, isg: 5, cevre: 4, total: 19 },
  ts500Touched: false,
}, null, 2));
