import { parseBlocks } from "../src/lib/article-blocks";
import { getArticleBySlug, getArticleList } from "../src/lib/articles-data";
import { DEPREM_CONTENT_AUTHOR, getArticleAuthorPresentation } from "../src/lib/content-author";
import { DEPREM_PHASE3_SLUGS } from "../src/lib/deprem-phase3-articles";
import { DEPREM_PHASE4_SLUGS } from "../src/lib/deprem-phase4-articles";
import { DEPREM_PHASE5_SLUGS } from "../src/lib/deprem-phase5-articles";
import { DEPREM_PHASE6_SLUGS } from "../src/lib/deprem-phase6-articles";
import { DEPREM_PHASE7_ARTICLES, DEPREM_PHASE7_SLUGS } from "../src/lib/deprem-phase7-articles";
import { DEPREM_PILOT_SLUGS } from "../src/lib/deprem-pilot-articles";
import { getDepremRolloutVisualPath } from "../src/lib/deprem-rollout";
import { TS500_SLUGS } from "../src/lib/ts500-content";

const BEP_SLUGS = [
  "bep-isi-yalitim-u-degeri-yogusma-kontrolu",
  "bep-ts-825-yontemi-isi-kaybi-hesabi",
  "bep-enerji-kimlik-belgesi-a-g-siniflandirma",
  "bep-yenilenebilir-enerji-zorunlulugu-1000m2",
  "bep-yazilimi-hesaplama-akisi",
  "bep-isil-kopru-detaylari-ve-cozum-yontemleri",
] as const;

const ACOUSTIC_SLUGS = ["akustik-ts-en-iso-12354-ile-yalitim-hesabi"] as const;

const EUROCODE_SLUGS = [
  "eurocode-ts-en-1990-yuk-kombinasyonlari-ve-guvenlik-katsayilari",
  "eurocode-ts-en-1991-1-1-hareketli-yukler-bolume-gore-degerler",
  "eurocode-ts-en-1991-1-3-kar-yuku-hesabi-bolge-haritasi-ile",
  "eurocode-ts-en-1991-1-4-ruzgar-yuku-hesabi-turkiye-bolgeleri",
  "eurocode-ts-en-1992-1-1-ec2-ts-500-ile-karsilastirmali-analiz",
] as const;

const PHASE7_SLUGS = [...BEP_SLUGS, ...ACOUSTIC_SLUGS, ...EUROCODE_SLUGS] as const;
type Phase7Slug = (typeof PHASE7_SLUGS)[number];

const requiredTokens: Record<Phase7Slug, string[]> = {
  "bep-isi-yalitim-u-degeri-yogusma-kontrolu": ["R_i = d_i / λ_i", "U = 1 / R_T", "yoğuşma", "1 Nisan 2025", "Mühendislik kontrol listesi"],
  "bep-ts-825-yontemi-isi-kaybi-hesabi": ["H_T", "Σ(U_i A_i)", "30 Haziran 2025", "730", "Mühendislik kontrol listesi"],
  "bep-enerji-kimlik-belgesi-a-g-siniflandirma": ["A–G", "BEP-TR", "16 Mayıs 2026", "en az B", "en az C", "Mühendislik kontrol listesi"],
  "bep-yenilenebilir-enerji-zorunlulugu-1000m2": ["ruhsat tarihi", "BEP-TR", "1000m2", "54.000 kWh/yıl", "Mühendislik kontrol listesi"],
  "bep-yazilimi-hesaplama-akisi": ["BEP-TR", "referans bina", "730", "1 Ocak 2027", "10.000 m²", "Mühendislik kontrol listesi"],
  "bep-isil-kopru-detaylari-ve-cozum-yontemleri": ["ψ", "Σ(ψ_k l_k)", "0,96 W/K", "Mühendislik kontrol listesi"],
  "akustik-ts-en-iso-12354-ile-yalitim-hesabi": ["Madde 16", "TS EN 12354-1", "Rw", "DnT", "L'nT,w", "yanal iletim", "Mühendislik kontrol listesi"],
  "eurocode-ts-en-1990-yuk-kombinasyonlari-ve-guvenlik-katsayilari": ["EN 1990", "ULS", "SLS", "γ", "ψ0", "National Annex", "Mühendislik kontrol listesi"],
  "eurocode-ts-en-1991-1-1-hareketli-yukler-bolume-gore-degerler": ["EN 1991-1-1", "q_k", "Q_k", "40 kN", "Ulusal Ek", "Mühendislik kontrol listesi"],
  "eurocode-ts-en-1991-1-3-kar-yuku-hesabi-bolge-haritasi-ile": ["EN 1991-1-3", "s = μ_i · C_e · C_t · s_k", "0,96 kN/m²", "Ulusal Ek", "Mühendislik kontrol listesi"],
  "eurocode-ts-en-1991-1-4-ruzgar-yuku-hesabi-turkiye-bolgeleri": ["EN 1991-1-4", "v_b", "q_p(z)", "c_pe", "c_pi", "-1,12 kN/m²", "Mühendislik kontrol listesi"],
  "eurocode-ts-en-1992-1-1-ec2-ts-500-ile-karsilastirmali-analiz": ["EN 1992", "TS 500", "ULS", "SLS", "zımbalama", "TBDY", "Mühendislik kontrol listesi"],
};

const errors: string[] = [];
const assert = (condition: unknown, message: string) => { if (!condition) errors.push(message); };
const lower = (value: string) => value.toLocaleLowerCase("tr-TR");
const textOf = (sections: { title: string; content: string }[]) => sections.map((item) => `${item.title}\n${item.content}`).join("\n");
const hasDepthSignal = (text: string, signal: string) => signal === "yanlış" ? text.includes("yanlış") || text.includes("hatal") : text.includes(lower(signal));
const isOfficialSource = (href: string) => ["mevzuat.gov.tr", "resmigazete.gov.tr", "csb.gov.tr", "europa.eu"].some((domain) => href.includes(domain));
const expectedSeries = (slug: string) => (BEP_SLUGS as readonly string[]).includes(slug) ? "bep" : (ACOUSTIC_SLUGS as readonly string[]).includes(slug) ? "akustik" : (EUROCODE_SLUGS as readonly string[]).includes(slug) ? "eurocode" : null;

assert(DEPREM_PHASE7_ARTICLES.length === 12, `FAZ 7 C3 override sayısı 12 olmalı; bulunan ${DEPREM_PHASE7_ARTICLES.length}.`);
assert(DEPREM_PHASE7_SLUGS.size === 12, "FAZ 7 source-of-truth slug kümesinde tekrar/eksik kayıt var.");
for (const slug of PHASE7_SLUGS) assert(DEPREM_PHASE7_SLUGS.has(slug), `FAZ 7 slug eksik: ${slug}`);

const allArticles = getArticleList();
const allSlugs = new Set(allArticles.map((article) => article.slug));
const targetCounts = Object.fromEntries(["bep", "akustik", "eurocode"].map((seriesId) => [seriesId, allArticles.filter((article) => article.seriesId === seriesId).length]));
assert(targetCounts.bep === 6, `BEP hedefi 6 olmalı; bulunan ${targetCounts.bep}.`);
assert(targetCounts.akustik === 1, `Akustik hedefi 1 olmalı; bulunan ${targetCounts.akustik}.`);
assert(targetCounts.eurocode === 5, `Eurocode hedefi 5 olmalı; bulunan ${targetCounts.eurocode}.`);

const qualityScores: Record<string, {
  classification: "C3";
  technicalAccuracyAndCoverage: number;
  officialSourceAccuracy: number;
  professionalDepth: number;
  visualQuality: number;
  tableExampleQuality: number;
  linkMetadataAuthorAccessibility: number;
  staticSubtotal: number;
}> = {};

for (const slug of PHASE7_SLUGS) {
  const configured = DEPREM_PHASE7_ARTICLES.find((article) => article.slug === slug);
  assert(Boolean(configured), `FAZ 7 source-of-truth makalesi bulunamadı: ${slug}`);
  if (!configured) continue;

  assert(!TS500_SLUGS.has(slug), `FAZ 7 TS500 kapsamına taşmış: ${slug}`);
  assert(!DEPREM_PILOT_SLUGS.has(slug), `FAZ 7 pilot ile çakışıyor: ${slug}`);
  assert(!DEPREM_PHASE3_SLUGS.has(slug) && !DEPREM_PHASE4_SLUGS.has(slug) && !DEPREM_PHASE5_SLUGS.has(slug) && !DEPREM_PHASE6_SLUGS.has(slug), `FAZ 7 önceki faz source-of-truth ile çakışıyor: ${slug}`);
  assert(configured.sections.length >= 7, `FAZ 7 profesyonel bölüm sayısı yetersiz: ${slug}`);
  assert(configured.references.length >= 2, `FAZ 7 referans sayısı yetersiz: ${slug}`);

  const hrefs = configured.references.map((ref) => ref.href ?? "");
  assert(hrefs.every(isOfficialSource), `FAZ 7 resmî kaynak profili dışına çıkılmış: ${slug}`);
  const text = textOf(configured.sections);
  const textLower = lower(text);
  for (const token of requiredTokens[slug]) assert(textLower.includes(lower(token)), `FAZ 7 teknik işareti eksik (${token}): ${slug}`);
  for (const signal of ["proje", "kontrol", "yanlış", "Mühendislik kontrol listesi"]) assert(hasDepthSignal(textLower, signal), `FAZ 7 profesyonel derinlik sinyali eksik (${signal}): ${slug}`);
  assert(text.includes("|---"), `FAZ 7 teknik tablo bulunamadı: ${slug}`);
  assert(/\d/.test(text), `FAZ 7 ölçülebilir teknik girdi bulunamadı: ${slug}`);
  assert(!/[�ÃÄÅÂ]/.test(text), `Encoding şüphesi: ${slug}`);
  assert(!text.includes("/deprem-yonetmelik/araclar/"), `Eski araç route'u FAZ 7 gövdesinde kaldı: ${slug}`);

  const article = getArticleBySlug(slug);
  assert(Boolean(article), `FAZ 7 runtime makalesi bulunamadı: ${slug}`);
  if (!article) continue;
  assert(article.sectionId === "deprem-yonetmelik", `Yanlış sectionId: ${slug}`);
  assert(article.seriesId === expectedSeries(slug), `FAZ 7 slug yanlış seride: ${slug} -> ${article.seriesId ?? "yok"}`);
  assert(article.author === DEPREM_CONTENT_AUTHOR.name && article.authorTitle === "", `Canonical yazar uygulanmadı: ${slug}`);
  assert(getArticleAuthorPresentation(article).monogram === DEPREM_CONTENT_AUTHOR.monogram, `HG monogram uygulanmadı: ${slug}`);
  assert(article.updatedAt === "26 Ağustos 2026", `updatedAt beklenenden farklı: ${slug}`);
  assert(article.sections.length === configured.sections.length, `Runtime bölüm sayısı source-of-truth ile uyuşmuyor: ${slug}`);
  assert((article.relatedSlugs ?? []).every((relatedSlug) => allSlugs.has(relatedSlug)), `Geçersiz related slug var: ${slug}`);

  const cover = getDepremRolloutVisualPath(slug, "cover");
  const diagram = getDepremRolloutVisualPath(slug, "diagram");
  const coverOk = article.image === cover && article.image !== "/covers/yonetmelik.svg";
  const blocks = article.sections.flatMap((item) => parseBlocks(item.content));
  const figure = blocks.find((block) => block.type === "image" && block.src === diagram);
  const figureOk = figure?.type === "image" ? Boolean(figure.alt.trim() && figure.caption.trim() && figure.sourceNote.trim() && figure.lightbox) : false;
  assert(coverOk, `FAZ 7 benzersiz rollout cover uygulanmadı: ${slug}`);
  assert(Boolean(figure) && figureOk, `FAZ 7 rollout body figure/metadata bulunamadı: ${slug}`);

  const technicalOk = requiredTokens[slug].every((token) => textLower.includes(lower(token)));
  const sourcesOk = hrefs.length >= 2 && hrefs.every(isOfficialSource);
  const depthOk = ["proje", "kontrol", "yanlış", "mühendislik kontrol listesi"].every((signal) => hasDepthSignal(textLower, signal));
  const tableOk = text.includes("|---") && /\d/.test(text);
  const metadataOk = Boolean(configured.seoTitle.trim() && configured.seoDescription.trim()) && article.author === DEPREM_CONTENT_AUTHOR.name && getArticleAuthorPresentation(article).monogram === DEPREM_CONTENT_AUTHOR.monogram && (article.relatedSlugs ?? []).every((relatedSlug) => allSlugs.has(relatedSlug)) && !/[�ÃÄÅÂ]/.test(text);

  const score = {
    classification: "C3" as const,
    technicalAccuracyAndCoverage: technicalOk ? 25 : 0,
    officialSourceAccuracy: sourcesOk ? 15 : 0,
    professionalDepth: depthOk ? 15 : 0,
    visualQuality: coverOk && Boolean(figure) && figureOk ? 15 : 0,
    tableExampleQuality: tableOk ? 10 : 0,
    linkMetadataAuthorAccessibility: metadataOk ? 10 : 0,
    staticSubtotal: 0,
  };
  score.staticSubtotal = score.technicalAccuracyAndCoverage + score.officialSourceAccuracy + score.professionalDepth + score.visualQuality + score.tableExampleQuality + score.linkMetadataAuthorAccessibility;
  qualityScores[slug] = score;
  assert(score.staticSubtotal >= 80, `FAZ 7 statik kalite skoru 80/90 altı: ${slug} -> ${score.staticSubtotal}/90`);
}

if (errors.length) {
  console.error("Deprem FAZ 7 kontrolü başarısız:\n");
  for (const error of [...new Set(errors)]) console.error(`- ${error}`);
  process.exit(1);
}

console.log(JSON.stringify({
  status: "ok",
  phase: "FAZ 7",
  completedBatches: 3,
  phase7Overrides: DEPREM_PHASE7_ARTICLES.length,
  completedArticles: 12,
  targetArticles: 12,
  remaining: 0,
  sourceOfTruth: "src/lib/deprem-phase7-articles.ts",
  officialSourceProfile: "BEP/TS825: Mevzuat Bilgi Sistemi + Resmî Gazete + ÇŞİDB; Akustik: Mevzuat Bilgi Sistemi + Resmî Gazete; Eurocode: European Commission JRC",
  visualContract: "12 rollout unique cover/body figure",
  qualityScoreContract: "static subtotal >=80/90 + responsive layout QA 10/10 => final >=90/100",
  qualityScores,
}, null, 2));
