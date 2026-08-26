import { parseBlocks } from "../src/lib/article-blocks";
import { getArticleBySlug, getArticleList } from "../src/lib/articles-data";
import { DEPREM_CONTENT_AUTHOR, getArticleAuthorPresentation } from "../src/lib/content-author";
import { DEPREM_PHASE3_SLUGS } from "../src/lib/deprem-phase3-articles";
import { DEPREM_PHASE4_SLUGS } from "../src/lib/deprem-phase4-articles";
import { DEPREM_PHASE5_SLUGS } from "../src/lib/deprem-phase5-articles";
import { DEPREM_PHASE6_ARTICLES, DEPREM_PHASE6_SLUGS } from "../src/lib/deprem-phase6-articles";
import { DEPREM_PILOT_SLUGS } from "../src/lib/deprem-pilot-articles";
import { getDepremRolloutVisualPath } from "../src/lib/deprem-rollout";
import { TS500_SLUGS } from "../src/lib/ts500-content";

const IMAR_BATCH_1_C3_SLUGS = [
  "imar-kat-yuksekligi-bina-yuksekligi-farki",
  "imar-bahce-mesafeleri-on-arka-yan-bahce-kurallari",
  "imar-cekme-kat-asma-kat-kosullari",
] as const;

const IMAR_BATCH_2_C3_SLUGS = [
  "imar-bodrum-kat-mevzuati-teknik-hacim-iskan-taban-alani",
  "imar-balkon-cikma-sacak-emsal-disi-sartlari",
  "imar-ruhsat-sureci-basvurudan-iskan-kadar",
  "imar-parsel-tevhid-ifraz-prosedurleri",
  "imar-plan-notu-celiskisi-uygulama-onceligi",
] as const;

const IMAR_C3_SLUGS = [...IMAR_BATCH_1_C3_SLUGS, ...IMAR_BATCH_2_C3_SLUGS] as const;
type ImarC3Slug = (typeof IMAR_C3_SLUGS)[number];
const C1_IMAR_PILOT = "imar-taks-kaks-emsal-hesabi" as const;

const requiredTokens: Record<ImarC3Slug, string[]> = {
  "imar-kat-yuksekligi-bina-yuksekligi-farki": [
    "Madde 28", "Madde 57", "3,60 m", "4,00 m", "4,50 m", "2,60 m", "ortometrik", "1 Temmuz 2026", "Mühendislik kontrol listesi",
  ],
  "imar-bahce-mesafeleri-on-arka-yan-bahce-kurallari": [
    "Madde 23", "5,00 m", "3,00 m", "0,50 m", "60,50 m", "15,00 m", "ortometrik", "1,50 m", "Mühendislik kontrol listesi",
  ],
  "imar-cekme-kat-asma-kat-kosullari": [
    "14 Ocak 2026", "33137", "1/3", "2,40 m", "3,00 m", "5,50 m", "çekme kat", "1 Temmuz 2026", "Mühendislik kontrol listesi",
  ],
  "imar-bodrum-kat-mevzuati-teknik-hacim-iskan-taban-alani": [
    "Madde 22", "teknik hacim", "1 Temmuz 2026", "33297", "asansör", "Mühendislik kontrol listesi",
  ],
  "imar-balkon-cikma-sacak-emsal-disi-sartlari": [
    "1,50 m", "%20", "Madde 22", "1 Temmuz 2026", "pergola", "Mühendislik kontrol listesi",
  ],
  "imar-ruhsat-sureci-basvurudan-iskan-kadar": [
    "Madde 54", "Madde 55", "Madde 57", "Madde 64", "Madde 65", "2 yıl", "30 gün", "Mühendislik kontrol listesi",
  ],
  "imar-parsel-tevhid-ifraz-prosedurleri": [
    "Madde 15", "Madde 16", "Madde 7", "30 gün", "15 gün", "TAKS", "KAKS", "Mühendislik kontrol listesi",
  ],
  "imar-plan-notu-celiskisi-uygulama-onceligi": [
    "plan paftası", "plan notları", "plan raporu", "1/1000", "22 Ocak 2026", "33145", "Mühendislik kontrol listesi",
  ],
};

const requiredSourceFragments: Record<ImarC3Slug, string[]> = {
  "imar-kat-yuksekligi-bina-yuksekligi-farki": [
    "planl-_alanlar_-mar", "20260114-1.htm", "20260701-7.htm", "planli-alanlar-imar-yonetmeligi-nde-degisiklik-yapildi-305960", "20230812-2.htm",
  ],
  "imar-bahce-mesafeleri-on-arka-yan-bahce-kurallari": [
    "planl-_alanlar_-mar", "20260114-1.htm", "20260701-7.htm", "planli-alanlar-imar-yonetmeligi-nde-degisiklik-yapildi-305960",
  ],
  "imar-cekme-kat-asma-kat-kosullari": [
    "planl-_alanlar_-mar", "20260114-1.htm", "20260701-7.htm", "planli-alanlar-imar-yonetmeligi-nde-degisiklik-yapildi-305960",
  ],
  "imar-bodrum-kat-mevzuati-teknik-hacim-iskan-taban-alani": [
    "planl-_alanlar_-mar", "20260114-1.htm", "20260701-7.htm", "planli-alanlar-imar-yonetmeligi-nde-degisiklik-yapildi-305960",
  ],
  "imar-balkon-cikma-sacak-emsal-disi-sartlari": [
    "planl-_alanlar_-mar", "20260114-1.htm", "20260701-7.htm", "planli-alanlar-imar-yonetmeligi-nde-degisiklik-yapildi-305960",
  ],
  "imar-ruhsat-sureci-basvurudan-iskan-kadar": [
    "planl-_alanlar_-mar", "20260701-7.htm", "yapi-ruhsati-yapi-kullanma",
  ],
  "imar-parsel-tevhid-ifraz-prosedurleri": [
    "planl-_alanlar_-mar", "1.5.3194",
  ],
  "imar-plan-notu-celiskisi-uygulama-onceligi": [
    "planl-_alanlar_-mar", "mpgm.csb.gov.tr", "20260122-2.htm",
  ],
};

const errors: string[] = [];
const assert = (condition: unknown, message: string) => { if (!condition) errors.push(message); };
const lower = (value: string) => value.toLocaleLowerCase("tr-TR");
const textOf = (sections: { title: string; content: string }[]) => sections.map((section) => `${section.title}\n${section.content}`).join("\n");

assert(DEPREM_PHASE6_ARTICLES.length === 8, `FAZ 6 İmar C3 override sayısı 8 olmalı; bulunan ${DEPREM_PHASE6_ARTICLES.length}.`);
assert(DEPREM_PHASE6_SLUGS.size === 8, "FAZ 6 source-of-truth slug kümesinde tekrar/eksik kayıt var.");
for (const slug of IMAR_C3_SLUGS) assert(DEPREM_PHASE6_SLUGS.has(slug), `FAZ 6 İmar C3 slug eksik: ${slug}`);
assert(DEPREM_PILOT_SLUGS.has(C1_IMAR_PILOT), `FAZ 2 C1 İmar pilotu bulunamadı: ${C1_IMAR_PILOT}`);
assert(!DEPREM_PHASE6_SLUGS.has(C1_IMAR_PILOT), `C1 İmar pilotu FAZ 6 tarafından tekrar sahiplenilmiş: ${C1_IMAR_PILOT}`);

const allArticles = getArticleList();
const allSlugs = new Set(allArticles.map((article) => article.slug));
const targetCounts = Object.fromEntries(["imar", "otopark", "asansor", "engelsiz"].map((seriesId) => [seriesId, allArticles.filter((article) => article.seriesId === seriesId).length]));
assert(targetCounts.imar === 9, `İmar hedefi 9 olmalı; bulunan ${targetCounts.imar}.`);
assert(targetCounts.otopark === 5, `Otopark hedefi 5 olmalı; bulunan ${targetCounts.otopark}.`);
assert(targetCounts.asansor === 4, `Asansör hedefi 4 olmalı; bulunan ${targetCounts.asansor}.`);
assert(targetCounts.engelsiz === 4, `Engelsiz hedefi 4 olmalı; bulunan ${targetCounts.engelsiz}.`);

const qualityScores: Record<string, {
  classification: "C1" | "C3";
  technicalAccuracyAndCoverage: number;
  officialSourceAccuracy: number;
  professionalDepth: number;
  visualQuality: number;
  tableExampleQuality: number;
  linkMetadataAuthorAccessibility: number;
  staticSubtotal: number;
}> = {};

for (const slug of IMAR_C3_SLUGS) {
  const configured = DEPREM_PHASE6_ARTICLES.find((article) => article.slug === slug);
  assert(Boolean(configured), `FAZ 6 source-of-truth makalesi bulunamadı: ${slug}`);
  if (!configured) continue;

  assert(!TS500_SLUGS.has(slug), `FAZ 6 TS500 kapsamına taşmış: ${slug}`);
  assert(!DEPREM_PILOT_SLUGS.has(slug), `FAZ 6 C3 pilot ile çakışıyor: ${slug}`);
  assert(!DEPREM_PHASE3_SLUGS.has(slug) && !DEPREM_PHASE4_SLUGS.has(slug) && !DEPREM_PHASE5_SLUGS.has(slug), `FAZ 6 önceki faz source-of-truth ile çakışıyor: ${slug}`);
  assert(configured.sections.length >= 7, `FAZ 6 profesyonel bölüm sayısı yetersiz: ${slug}`);
  assert(configured.references.length >= 2, `FAZ 6 doğrulanabilir referans sayısı yetersiz: ${slug}`);

  const hrefs = configured.references.map((ref) => ref.href ?? "");
  const fragments = requiredSourceFragments[slug];
  for (const fragment of fragments) assert(hrefs.some((href) => href.includes(fragment)), `FAZ 6 resmî kaynak işareti eksik (${fragment}): ${slug}`);
  assert(hrefs.every((href) => href.includes("csb.gov.tr") || href.includes("resmigazete.gov.tr")), `FAZ 6 resmî kaynak profili dışına çıkılmış: ${slug}`);

  const configuredText = textOf(configured.sections);
  const configuredLower = lower(configuredText);
  for (const token of requiredTokens[slug]) assert(configuredLower.includes(lower(token)), `FAZ 6 teknik işareti eksik (${token}): ${slug}`);
  assert(!/[�ÃÄÅÂ]/.test(configuredText), `Encoding şüphesi: ${slug}`);
  assert(!configuredText.includes("/deprem-yonetmelik/araclar/"), `Eski araç route'u FAZ 6 gövdesinde kaldı: ${slug}`);
  for (const signal of ["proje", "kontrol", "yanlış", "Mühendislik kontrol listesi"]) {
    assert(configuredLower.includes(lower(signal)), `FAZ 6 profesyonel derinlik sinyali eksik (${signal}): ${slug}`);
  }
  assert(configuredText.includes("|---"), `FAZ 6 teknik tablo bulunamadı: ${slug}`);
  assert(/\d/.test(configuredText), `FAZ 6 ölçülebilir teknik girdi bulunamadı: ${slug}`);

  const article = getArticleBySlug(slug);
  assert(Boolean(article), `FAZ 6 runtime makalesi bulunamadı: ${slug}`);
  if (!article) continue;
  assert(article.sectionId === "deprem-yonetmelik", `Yanlış sectionId: ${slug}`);
  assert(article.seriesId === "imar", `FAZ 6 İmar slug yanlış seride: ${slug} -> ${article.seriesId ?? "yok"}`);
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
  assert(coverOk, `FAZ 6 benzersiz rollout cover uygulanmadı: ${slug}`);
  assert(Boolean(figure) && figureMetadataOk, `FAZ 6 rollout body figure/metadata bulunamadı: ${slug}`);
  assert(blocks.filter((block) => block.type === "formula").length === 0, `FAZ 6 İmar gövdesinde gereksiz FormulaBlock bulundu: ${slug}`);

  const technicalOk = requiredTokens[slug].every((token) => configuredLower.includes(lower(token)));
  const sourcesOk = fragments.every((fragment) => hrefs.some((href) => href.includes(fragment)));
  const depthOk = ["proje", "kontrol", "yanlış", "mühendislik kontrol listesi"].every((signal) => configuredLower.includes(lower(signal)));
  const tableExampleOk = configuredText.includes("|---") && /\d/.test(configuredText);
  const metadataOk = Boolean(configured.seoTitle.trim() && configured.seoDescription.trim())
    && article.author === DEPREM_CONTENT_AUTHOR.name
    && getArticleAuthorPresentation(article).monogram === DEPREM_CONTENT_AUTHOR.monogram
    && (article.relatedSlugs ?? []).every((relatedSlug) => allSlugs.has(relatedSlug))
    && !/[�ÃÄÅÂ]/.test(configuredText);
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
  assert(score.staticSubtotal >= 80, `FAZ 6 statik kalite skoru 80/90 altı: ${slug} -> ${score.staticSubtotal}/90`);
}

const pilot = getArticleBySlug(C1_IMAR_PILOT);
assert(Boolean(pilot), `FAZ 2 C1 İmar pilot runtime makalesi bulunamadı: ${C1_IMAR_PILOT}`);
if (pilot) {
  const pilotText = textOf(pilot.sections);
  const pilotLower = lower(pilotText);
  const pilotCover = "/images/deprem-pilots/imar-taks-kaks-emsal-hesabi-cover.svg";
  const pilotDiagram = "/images/deprem-pilots/imar-taks-kaks-emsal-hesabi-diagram.svg";
  const pilotBlocks = pilot.sections.flatMap((section) => parseBlocks(section.content));
  const pilotFigure = pilotBlocks.find((block) => block.type === "image" && block.src === pilotDiagram);
  const pilotFigureOk = pilotFigure?.type === "image" ? Boolean(pilotFigure.alt.trim() && pilotFigure.caption.trim() && pilotFigure.sourceNote.trim() && pilotFigure.lightbox) : false;
  const sourceOk = (pilot.references?.some((ref) => ref.href?.includes("planl-_alanlar_-mar")) ?? false)
    && (pilot.references?.some((ref) => ref.href?.includes("planli-alanlar-imar-yonetmeligi-nde-degisiklik-yapildi-305960")) ?? false);
  const technicalOk = pilot.sections.length >= 4 && ["TAKS", "KAKS", "1.000 m²", "1.500 m²", "1 Temmuz 2026"].every((token) => pilotLower.includes(lower(token)));
  const depthOk = ["parsel", "plan notu", "çekme mesafeleri", "ön kontrol"].every((signal) => pilotLower.includes(lower(signal)));
  const visualOk = pilot.image === pilotCover && Boolean(pilotFigure) && pilotFigureOk;
  const tableOk = pilotText.includes("```formula") && /\d/.test(pilotText);
  const metadataOk = pilot.author === DEPREM_CONTENT_AUTHOR.name
    && getArticleAuthorPresentation(pilot).monogram === DEPREM_CONTENT_AUTHOR.monogram
    && (pilot.relatedSlugs ?? []).every((relatedSlug) => allSlugs.has(relatedSlug));
  assert(pilot.seriesId === "imar" && pilot.updatedAt === "25 Ağustos 2026", "C1 İmar pilot seri/tarih kontratı bozuldu.");
  assert(!DEPREM_PHASE6_SLUGS.has(C1_IMAR_PILOT), "C1 İmar pilot FAZ 6 source-of-truth tarafından eziliyor.");
  assert(technicalOk && sourceOk && visualOk && tableOk && metadataOk, "C1 İmar pilot teknik/kaynak/görsel kontratı bozuldu.");
  const pilotScore = {
    classification: "C1" as const,
    technicalAccuracyAndCoverage: technicalOk ? 25 : 0,
    officialSourceAccuracy: sourceOk ? 15 : 0,
    professionalDepth: depthOk ? 15 : 0,
    visualQuality: visualOk ? 15 : 0,
    tableExampleQuality: tableOk ? 10 : 0,
    linkMetadataAuthorAccessibility: metadataOk ? 10 : 0,
    staticSubtotal: 0,
  };
  pilotScore.staticSubtotal = pilotScore.technicalAccuracyAndCoverage + pilotScore.officialSourceAccuracy + pilotScore.professionalDepth + pilotScore.visualQuality + pilotScore.tableExampleQuality + pilotScore.linkMetadataAuthorAccessibility;
  qualityScores[C1_IMAR_PILOT] = pilotScore;
  assert(pilotScore.staticSubtotal >= 80, `C1 İmar pilot kalite skoru 80/90 altı: ${pilotScore.staticSubtotal}/90`);
}

if (errors.length) {
  console.error("Deprem FAZ 6 kontrolü başarısız:\n");
  for (const error of [...new Set(errors)]) console.error(`- ${error}`);
  process.exit(1);
}

console.log(JSON.stringify({
  status: "ok",
  phase: "FAZ 6",
  completedBatches: 2,
  phase6Overrides: DEPREM_PHASE6_ARTICLES.length,
  phase2C1CarryForward: [C1_IMAR_PILOT],
  completedArticles: 9,
  targetArticles: 22,
  remaining: 13,
  batch1C3Slugs: IMAR_BATCH_1_C3_SLUGS,
  batch2C3Slugs: IMAR_BATCH_2_C3_SLUGS,
  classifications: { ...Object.fromEntries(IMAR_C3_SLUGS.map((slug) => [slug, "C3"])), [C1_IMAR_PILOT]: "C1" },
  sourceOfTruth: "src/lib/deprem-phase6-articles.ts + preserved FAZ 2 C1 İmar pilot",
  officialSourceProfile: "İmar: Planlı Alanlar İmar Yönetmeliği + 3194 sayılı İmar Kanunu + Mekânsal Planlar Yapım Yönetmeliği + 2026 resmî değişiklik zinciri",
  visualContract: "8 rollout unique cover/body figure + 1 preserved FAZ 2 pilot unique cover/body figure",
  qualityScoreContract: "static subtotal >=80/90 + responsive layout QA 10/10 => final >=90/100; hard-fail assertions mandatory",
  qualityScores,
  seriesCoverage: { imar: 9, otopark: 0, asansor: 0, engelsiz: 0 },
  targetCoverage: { imar: 9, otopark: 5, asansor: 4, engelsiz: 4, total: 22 },
  ts500Touched: false,
}, null, 2));
