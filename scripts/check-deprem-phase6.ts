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
const OTOPARK_BATCH_3_C3_SLUGS = [
  "otopark-kullanim-turune-gore-minimum-alan-hesabi",
  "otopark-rampa-egimi-genislik-donus-yaricapi",
  "otopark-kapali-havalandirma-co-konsantrasyonu",
  "otopark-yapisal-yuk-kombinasyonlari-arac-deprem",
  "otopark-elektrikli-arac-sarj-mevzuati",
] as const;
const ASANSOR_BATCH_4_C3_SLUGS = [
  "asansor-boslugu-boyutlandirma-kapasite-alan-tablosu",
  "asansor-makine-daireli-ve-dairesiz-sistemler",
  "asansor-guvenlik-aksesuarlari-ve-periyodik-bakim-zorunlulugu",
  "asansor-deprem-sirasinda-otomatik-park-ozelligi",
] as const;
const ENGELSIZ_BATCH_5_C3_SLUGS = [
  "engelsiz-tekerlekli-sandalye-manevra-alani-koridor-genislikleri",
  "engelsiz-rampa-egimi-korkuluk-yuzey-standartlari",
  "engelsiz-wc-asansor-kapi-boyutlari",
  "engelsiz-yapi-ruhsatinda-uyum-kontrolu",
] as const;

const IMAR_C3_SLUGS = [...IMAR_BATCH_1_C3_SLUGS, ...IMAR_BATCH_2_C3_SLUGS] as const;
const PHASE6_C3_SLUGS = [...IMAR_C3_SLUGS, ...OTOPARK_BATCH_3_C3_SLUGS, ...ASANSOR_BATCH_4_C3_SLUGS, ...ENGELSIZ_BATCH_5_C3_SLUGS] as const;
type Phase6C3Slug = (typeof PHASE6_C3_SLUGS)[number];
const IMAR_SET = new Set<string>(IMAR_C3_SLUGS);
const OTOPARK_SET = new Set<string>(OTOPARK_BATCH_3_C3_SLUGS);
const ASANSOR_SET = new Set<string>(ASANSOR_BATCH_4_C3_SLUGS);
const ENGELSIZ_SET = new Set<string>(ENGELSIZ_BATCH_5_C3_SLUGS);
const C1_IMAR_PILOT = "imar-taks-kaks-emsal-hesabi" as const;

const requiredTokens: Record<Phase6C3Slug, string[]> = {
  "imar-kat-yuksekligi-bina-yuksekligi-farki": ["Madde 28", "Madde 57", "3,60 m", "4,00 m", "4,50 m", "2,60 m", "ortometrik", "1 Temmuz 2026", "Mühendislik kontrol listesi"],
  "imar-bahce-mesafeleri-on-arka-yan-bahce-kurallari": ["Madde 23", "5,00 m", "3,00 m", "0,50 m", "60,50 m", "15,00 m", "ortometrik", "1,50 m", "Mühendislik kontrol listesi"],
  "imar-cekme-kat-asma-kat-kosullari": ["14 Ocak 2026", "33137", "1/3", "2,40 m", "3,00 m", "5,50 m", "çekme kat", "1 Temmuz 2026", "Mühendislik kontrol listesi"],
  "imar-bodrum-kat-mevzuati-teknik-hacim-iskan-taban-alani": ["Madde 22", "teknik hacim", "1 Temmuz 2026", "33297", "asansör", "Mühendislik kontrol listesi"],
  "imar-balkon-cikma-sacak-emsal-disi-sartlari": ["1,50 m", "%20", "Madde 22", "1 Temmuz 2026", "pergola", "Mühendislik kontrol listesi"],
  "imar-ruhsat-sureci-basvurudan-iskan-kadar": ["Madde 54", "Madde 55", "Madde 57", "Madde 64", "Madde 65", "2 yıl", "30 gün", "Mühendislik kontrol listesi"],
  "imar-parsel-tevhid-ifraz-prosedurleri": ["Madde 15", "Madde 16", "Madde 7", "30 gün", "15 gün", "TAKS", "KAKS", "Mühendislik kontrol listesi"],
  "imar-plan-notu-celiskisi-uygulama-onceligi": ["plan paftası", "plan notları", "plan raporu", "1/1000", "22 Ocak 2026", "33145", "Mühendislik kontrol listesi"],
  "otopark-kullanim-turune-gore-minimum-alan-hesabi": ["Ek-1", "20 m²", "80 m²", "120 m²", "180 m²", "85 m²", "27 Aralık 2025", "Mühendislik kontrol listesi"],
  "otopark-rampa-egimi-genislik-donus-yaricapi": ["%15", "%20", "2,75 m", "2,10 m", "4,90 m", "6,00 m", "6,50 m", "Mühendislik kontrol listesi"],
  "otopark-kapali-havalandirma-co-konsantrasyonu": ["Madde 60", "%5", "600 m²", "2.000 m²", "10 hava değişimi", "CO", "Mühendislik kontrol listesi"],
  "otopark-yapisal-yuk-kombinasyonlari-arac-deprem": ["TS 498", "TBDY 2018", "hareketli yük", "deprem kütlesi", "yük yolu", "Mühendislik kontrol listesi"],
  "otopark-elektrikli-arac-sarj-mevzuati": ["%5", "%10", "20", "30.000 m²", "70.000 m²", "Şarj Hizmeti Yönetmeliği", "23 Mart 2026", "33202", "Mühendislik kontrol listesi"],
  "asansor-boslugu-boyutlandirma-kapasite-alan-tablosu": ["Madde 34", "1 Temmuz 2026", "kat adedi 3", "4 ve daha fazla", "1,20 m", "1,80 m²", "0,90 m", "2,52 m²", "1,10 m", "Mühendislik kontrol listesi"],
  "asansor-makine-daireli-ve-dairesiz-sistemler": ["MRL", "MR", "2014/33/AB", "TS EN 81 serisi", "ayda en az bir", "kuyu", "bakım", "Mühendislik kontrol listesi"],
  "asansor-guvenlik-aksesuarlari-ve-periyodik-bakim-zorunlulugu": ["ayda en az bir", "yılda en az bir", "yeşil", "mavi", "sarı", "kırmızı", "60 gün", "120 gün", "5 Ağustos 2025", "32977", "Mühendislik kontrol listesi"],
  "asansor-deprem-sirasinda-otomatik-park-ozelligi": ["TS EN 81-77", "deprem sensörü", "kontrol panosu", "TS EN 81-73", "sismik", "yangın", "yeniden devreye alma", "Mühendislik kontrol listesi"],
  "engelsiz-tekerlekli-sandalye-manevra-alani-koridor-genislikleri": ["Madde 5", "150 cm × 150 cm", "150 cm", "220 cm", "net", "kesintisiz", "2026", "Mühendislik kontrol listesi"],
  "engelsiz-rampa-egimi-korkuluk-yuzey-standartlari": ["1:12", "%8", "1:14", "%7", "1:16", "%6", "1:20", "%5", "100 cm", "150 cm × 150 cm", "90 cm", "70 cm", "110 cm", "Mühendislik kontrol listesi"],
  "engelsiz-wc-asansor-kapi-boyutlari": ["90 cm", "150 cm", "1,20 m", "1,80 m²", "120 cm", "Madde 5/22", "Mühendislik kontrol listesi"],
  "engelsiz-yapi-ruhsatinda-uyum-kontrolu": ["Madde 5/20", "5/22", "4708", "2026/1", "ERDEM", "Erişilebilirlik Belgesi", "Mühendislik kontrol listesi"],
};

const requiredSourceFragments: Record<Phase6C3Slug, string[]> = {
  "imar-kat-yuksekligi-bina-yuksekligi-farki": ["planl-_alanlar_-mar", "20260114-1.htm", "20260701-7.htm", "planli-alanlar-imar-yonetmeligi-nde-degisiklik-yapildi-305960", "20230812-2.htm"],
  "imar-bahce-mesafeleri-on-arka-yan-bahce-kurallari": ["planl-_alanlar_-mar", "20260114-1.htm", "20260701-7.htm", "planli-alanlar-imar-yonetmeligi-nde-degisiklik-yapildi-305960"],
  "imar-cekme-kat-asma-kat-kosullari": ["planl-_alanlar_-mar", "20260114-1.htm", "20260701-7.htm", "planli-alanlar-imar-yonetmeligi-nde-degisiklik-yapildi-305960"],
  "imar-bodrum-kat-mevzuati-teknik-hacim-iskan-taban-alani": ["planl-_alanlar_-mar", "20260114-1.htm", "20260701-7.htm", "planli-alanlar-imar-yonetmeligi-nde-degisiklik-yapildi-305960"],
  "imar-balkon-cikma-sacak-emsal-disi-sartlari": ["planl-_alanlar_-mar", "20260114-1.htm", "20260701-7.htm", "planli-alanlar-imar-yonetmeligi-nde-degisiklik-yapildi-305960"],
  "imar-ruhsat-sureci-basvurudan-iskan-kadar": ["planl-_alanlar_-mar", "20260701-7.htm", "yapi-ruhsati-yapi-kullanma"],
  "imar-parsel-tevhid-ifraz-prosedurleri": ["planl-_alanlar_-mar", "1.5.3194"],
  "imar-plan-notu-celiskisi-uygulama-onceligi": ["planl-_alanlar_-mar", "mpgm.csb.gov.tr", "20260122-2.htm"],
  "otopark-kullanim-turune-gore-minimum-alan-hesabi": ["20180222-7.htm", "20210325-12.htm", "20251227-6.htm"],
  "otopark-rampa-egimi-genislik-donus-yaricapi": ["20180222-7.htm", "20210325-12.htm"],
  "otopark-kapali-havalandirma-co-konsantrasyonu": ["20180222-7.htm", "20090909-10.htm", "Binalar-n-Yang-n-Korunmas"],
  "otopark-yapisal-yuk-kombinasyonlari-arac-deprem": ["20180222-7.htm", "TBDY_2018.pdf", "turkiye-bina-deprem-yonetmeligi"],
  "otopark-elektrikli-arac-sarj-mevzuati": ["20210325-12.htm", "20220402-2.htm", "20260323-4.htm"],
  "asansor-boslugu-boyutlandirma-kapasite-alan-tablosu": ["20160629-21.htm", "20260701-7.htm"],
  "asansor-makine-daireli-ve-dairesiz-sistemler": ["20160629-21.htm", "20190406-1.htm"],
  "asansor-guvenlik-aksesuarlari-ve-periyodik-bakim-zorunlulugu": ["20190406-1.htm", "20180504-1.htm", "20250805-1.htm"],
  "asansor-deprem-sirasinda-otomatik-park-ozelligi": ["20160629-21.htm", "20250505133528-84464-84507.pdf", "turkiye-bina-deprem-yonetmeligi"],
  "engelsiz-tekerlekli-sandalye-manevra-alani-koridor-genislikleri": ["mevzuatNo=23722", "59960", "202721", "278489"],
  "engelsiz-rampa-egimi-korkuluk-yuzey-standartlari": ["mevzuatNo=23722", "59960", "202721", "278489"],
  "engelsiz-wc-asansor-kapi-boyutlari": ["mevzuatNo=23722", "59960", "202721", "278489"],
  "engelsiz-yapi-ruhsatinda-uyum-kontrolu": ["mevzuatNo=23722", "MevzuatNo=4708", "mevzuatNo=18614", "278489"],
};

const errors: string[] = [];
const assert = (condition: unknown, message: string) => { if (!condition) errors.push(message); };
const lower = (value: string) => value.toLocaleLowerCase("tr-TR");
const textOf = (sections: { title: string; content: string }[]) => sections.map((section) => `${section.title}\n${section.content}`).join("\n");
const hasDepthSignal = (text: string, signal: string) => signal === "yanlış" ? text.includes("yanlış") || text.includes("hatal") : text.includes(lower(signal));
const isOfficialSource = (href: string) => ["csb.gov.tr", "resmigazete.gov.tr", "afad.gov.tr", ".bel.tr", "aile.gov.tr", "mevzuat.gov.tr"].some((domain) => href.includes(domain));
const expectedSeries = (slug: string) => IMAR_SET.has(slug) ? "imar" : OTOPARK_SET.has(slug) ? "otopark" : ASANSOR_SET.has(slug) ? "asansor" : ENGELSIZ_SET.has(slug) ? "engelsiz" : null;

assert(DEPREM_PHASE6_ARTICLES.length === 21, `FAZ 6 C3 override sayısı 21 olmalı; bulunan ${DEPREM_PHASE6_ARTICLES.length}.`);
assert(DEPREM_PHASE6_SLUGS.size === 21, "FAZ 6 source-of-truth slug kümesinde tekrar/eksik kayıt var.");
for (const slug of PHASE6_C3_SLUGS) assert(DEPREM_PHASE6_SLUGS.has(slug), `FAZ 6 C3 slug eksik: ${slug}`);
assert(DEPREM_PILOT_SLUGS.has(C1_IMAR_PILOT), `FAZ 2 C1 İmar pilotu bulunamadı: ${C1_IMAR_PILOT}`);
assert(!DEPREM_PHASE6_SLUGS.has(C1_IMAR_PILOT), `C1 İmar pilotu FAZ 6 tarafından tekrar sahiplenilmiş: ${C1_IMAR_PILOT}`);

const allArticles = getArticleList();
const allSlugs = new Set(allArticles.map((article) => article.slug));
const targetCounts = Object.fromEntries(["imar", "otopark", "asansor", "engelsiz"].map((seriesId) => [seriesId, allArticles.filter((article) => article.seriesId === seriesId).length]));
assert(targetCounts.imar === 9, `İmar hedefi 9 olmalı; bulunan ${targetCounts.imar}.`);
assert(targetCounts.otopark === 5, `Otopark hedefi 5 olmalı; bulunan ${targetCounts.otopark}.`);
assert(targetCounts.asansor === 4, `Asansör hedefi 4 olmalı; bulunan ${targetCounts.asansor}.`);
assert(targetCounts.engelsiz === 4, `Engelsiz hedefi 4 olmalı; bulunan ${targetCounts.engelsiz}.`);

const qualityScores: Record<string, { classification: "C1" | "C3"; technicalAccuracyAndCoverage: number; officialSourceAccuracy: number; professionalDepth: number; visualQuality: number; tableExampleQuality: number; linkMetadataAuthorAccessibility: number; staticSubtotal: number }> = {};

for (const slug of PHASE6_C3_SLUGS) {
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
  assert(hrefs.every(isOfficialSource), `FAZ 6 resmî/kamu kaynak profili dışına çıkılmış: ${slug}`);

  const configuredText = textOf(configured.sections);
  const configuredLower = lower(configuredText);
  for (const token of requiredTokens[slug]) assert(configuredLower.includes(lower(token)), `FAZ 6 teknik işareti eksik (${token}): ${slug}`);
  assert(!/[�ÃÄÅÂ]/.test(configuredText), `Encoding şüphesi: ${slug}`);
  assert(!configuredText.includes("/deprem-yonetmelik/araclar/"), `Eski araç route'u FAZ 6 gövdesinde kaldı: ${slug}`);
  for (const signal of ["proje", "kontrol", "yanlış", "Mühendislik kontrol listesi"]) assert(hasDepthSignal(configuredLower, signal), `FAZ 6 profesyonel derinlik sinyali eksik (${signal}): ${slug}`);
  assert(configuredText.includes("|---"), `FAZ 6 teknik tablo bulunamadı: ${slug}`);
  assert(/\d/.test(configuredText), `FAZ 6 ölçülebilir teknik girdi bulunamadı: ${slug}`);

  const article = getArticleBySlug(slug);
  assert(Boolean(article), `FAZ 6 runtime makalesi bulunamadı: ${slug}`);
  if (!article) continue;
  const series = expectedSeries(slug);
  assert(article.sectionId === "deprem-yonetmelik", `Yanlış sectionId: ${slug}`);
  assert(article.seriesId === series, `FAZ 6 slug yanlış seride: ${slug} -> ${article.seriesId ?? "yok"}, beklenen ${series}`);
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

  const technicalOk = requiredTokens[slug].every((token) => configuredLower.includes(lower(token)));
  const sourcesOk = fragments.every((fragment) => hrefs.some((href) => href.includes(fragment)));
  const depthOk = ["proje", "kontrol", "yanlış", "mühendislik kontrol listesi"].every((signal) => hasDepthSignal(configuredLower, signal));
  const tableExampleOk = configuredText.includes("|---") && /\d/.test(configuredText);
  const metadataOk = Boolean(configured.seoTitle.trim() && configured.seoDescription.trim()) && article.author === DEPREM_CONTENT_AUTHOR.name && getArticleAuthorPresentation(article).monogram === DEPREM_CONTENT_AUTHOR.monogram && (article.relatedSlugs ?? []).every((relatedSlug) => allSlugs.has(relatedSlug)) && !/[�ÃÄÅÂ]/.test(configuredText);
  const score = { classification: "C3" as const, technicalAccuracyAndCoverage: technicalOk ? 25 : 0, officialSourceAccuracy: sourcesOk ? 15 : 0, professionalDepth: depthOk ? 15 : 0, visualQuality: coverOk && Boolean(figure) && figureMetadataOk ? 15 : 0, tableExampleQuality: tableExampleOk ? 10 : 0, linkMetadataAuthorAccessibility: metadataOk ? 10 : 0, staticSubtotal: 0 };
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
  const sourceOk = (pilot.references?.some((ref) => ref.href?.includes("planl-_alanlar_-mar")) ?? false) && (pilot.references?.some((ref) => ref.href?.includes("planli-alanlar-imar-yonetmeligi-nde-degisiklik-yapildi-305960")) ?? false);
  const technicalOk = pilot.sections.length >= 4 && ["TAKS", "KAKS", "1.000 m²", "1.500 m²", "1 Temmuz 2026"].every((token) => pilotLower.includes(lower(token)));
  const depthOk = ["parsel", "plan notu", "çekme mesafeleri", "ön kontrol"].every((signal) => pilotLower.includes(lower(signal)));
  const visualOk = pilot.image === pilotCover && Boolean(pilotFigure) && pilotFigureOk;
  const tableOk = pilotText.includes("```formula") && /\d/.test(pilotText);
  const metadataOk = pilot.author === DEPREM_CONTENT_AUTHOR.name && getArticleAuthorPresentation(pilot).monogram === DEPREM_CONTENT_AUTHOR.monogram && (pilot.relatedSlugs ?? []).every((relatedSlug) => allSlugs.has(relatedSlug));
  assert(pilot.seriesId === "imar" && pilot.updatedAt === "25 Ağustos 2026", "C1 İmar pilot seri/tarih kontratı bozuldu.");
  assert(!DEPREM_PHASE6_SLUGS.has(C1_IMAR_PILOT), "C1 İmar pilot FAZ 6 source-of-truth tarafından eziliyor.");
  assert(technicalOk && sourceOk && visualOk && tableOk && metadataOk, "C1 İmar pilot teknik/kaynak/görsel kontratı bozuldu.");
  const pilotScore = { classification: "C1" as const, technicalAccuracyAndCoverage: technicalOk ? 25 : 0, officialSourceAccuracy: sourceOk ? 15 : 0, professionalDepth: depthOk ? 15 : 0, visualQuality: visualOk ? 15 : 0, tableExampleQuality: tableOk ? 10 : 0, linkMetadataAuthorAccessibility: metadataOk ? 10 : 0, staticSubtotal: 0 };
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
  completedBatches: 5,
  phase6Overrides: DEPREM_PHASE6_ARTICLES.length,
  phase2C1CarryForward: [C1_IMAR_PILOT],
  completedArticles: 22,
  targetArticles: 22,
  remaining: 0,
  batch5C3Slugs: ENGELSIZ_BATCH_5_C3_SLUGS,
  sourceOfTruth: "src/lib/deprem-phase6-articles.ts + preserved FAZ 2 C1 İmar pilot",
  officialSourceProfile: "İmar + Otopark + Asansör + Engelsiz Tasarım: ilgili Resmî Gazete/Mevzuat Bilgi Sistemi/Bakanlık birincil kaynak zincirleri",
  visualContract: "21 rollout unique cover/body figure + 1 preserved FAZ 2 pilot unique cover/body figure",
  qualityScoreContract: "static subtotal >=80/90 + responsive layout QA 10/10 => final >=90/100; hard-fail assertions mandatory",
  qualityScores,
  seriesCoverage: { imar: 9, otopark: 5, asansor: 4, engelsiz: 4 },
  targetCoverage: { imar: 9, otopark: 5, asansor: 4, engelsiz: 4, total: 22 },
  ts500Touched: false,
}, null, 2));
