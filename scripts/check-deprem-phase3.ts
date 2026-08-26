import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { parseBlocks } from "../src/lib/article-blocks";
import { getArticleBySlug } from "../src/lib/articles-data";
import { DEPREM_CONTENT_AUTHOR, getArticleAuthorPresentation } from "../src/lib/content-author";
import { DEPREM_PHASE3_ARTICLES, DEPREM_PHASE3_SLUGS } from "../src/lib/deprem-phase3-articles";
import { DEPREM_PILOT_SLUGS } from "../src/lib/deprem-pilot-articles";
import { getDepremRolloutVisualPath } from "../src/lib/deprem-rollout";
import { TS500_SLUGS } from "../src/lib/ts500-content";

const ROOT = process.cwd();
const LEGACY_CONTRACT = path.join(ROOT, "scripts/check-deprem-phase3-first13.ts");
const TEMP_CONTRACT = path.join(ROOT, "scripts/.check-deprem-phase3-first13.runtime.ts");
const LEGACY_IMPORT = 'import { DEPREM_PHASE3_ARTICLES, DEPREM_PHASE3_SLUGS } from "../src/lib/deprem-phase3-articles";';
const LEGACY_ALIAS_IMPORT = 'import { DEPREM_PHASE3_ARTICLES as DEPREM_PHASE3_ALL_ARTICLES } from "../src/lib/deprem-phase3-articles";';
const LEGACY_ANCHOR = 'import { TS500_SLUGS } from "../src/lib/ts500-content";';
const LEGACY_ROLLOUT_INDEX = 'const rolloutApplyIndex = assemblerSource.indexOf("applyDepremRolloutEnhancement(phase3Article)");';
const PHASE4_ROLLOUT_INDEX = 'const rolloutApplyIndex = assemblerSource.indexOf("applyDepremRolloutEnhancement(phase4Article)");';

function runFirst13FrozenContract() {
  const source = fs.readFileSync(LEGACY_CONTRACT, "utf8");
  if (!source.includes(LEGACY_IMPORT) || !source.includes(LEGACY_ANCHOR) || !source.includes(LEGACY_ROLLOUT_INDEX)) {
    throw new Error("FAZ 3 ilk 13 batch donmuş kontratı beklenen import/runtime yapısında değil.");
  }

  const adapted = source
    .replace(LEGACY_IMPORT, LEGACY_ALIAS_IMPORT)
    .replace(LEGACY_ROLLOUT_INDEX, PHASE4_ROLLOUT_INDEX)
    .replace(
      LEGACY_ANCHOR,
      `${LEGACY_ANCHOR}\n\nconst DEPREM_PHASE3_ARTICLES = DEPREM_PHASE3_ALL_ARTICLES.slice(0, 52);\nconst DEPREM_PHASE3_SLUGS = new Set(DEPREM_PHASE3_ARTICLES.map((article) => article.slug));`,
    );

  fs.writeFileSync(TEMP_CONTRACT, adapted, "utf8");
  try {
    execFileSync("npx", ["tsx", TEMP_CONTRACT], { cwd: ROOT, stdio: "pipe" });
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new Error(`FAZ 3 ilk 13 batch donmuş kontratı başarısız: ${detail}`);
  } finally {
    fs.rmSync(TEMP_CONTRACT, { force: true });
  }
}

runFirst13FrozenContract();

const BATCH_14_SLUGS = [
  "duzensiz-binalarda-dinamik-analiz-zorunlulugu",
  "deprem-yuku-ile-ruzgar-yuku-kombinasyonu",
  "deprem-sigortasi-dask-ve-muhendislik-baglantisi",
  "yatay-yuk-tasima-sistemleri-cerceve-perde-cekirdek",
] as const;

type Batch14Slug = (typeof BATCH_14_SLUGS)[number];

const PHASE2_C1_CARRY_FORWARD = [
  { slug: "tbdy-etkin-kesit-rijitlikleri", seriesId: "tbdy" },
  { slug: "tbdy-betonarme-bag-kirisli-perde", seriesId: "tbdy-betonarme" },
] as const;

const requiredTokens: Record<Batch14Slug, string[]> = {
  "duzensiz-binalarda-dinamik-analiz-zorunlulugu": [
    "3.6.2.1",
    "4.6.2.1",
    "Tablo 4.4",
    "ηbi ≤ 2.0",
    "BYS ≥ 4",
    "BYS ≥ 5",
    "BYS ≥ 6",
    "A2",
    "A3",
    "membran",
    "her bina için zorunlu değildir",
    "SOURCE_VALUE",
  ],
  "deprem-yuku-ile-ruzgar-yuku-kombinasyonu": [
    "4.4.4",
    "Denklem (4.11)",
    "Denklem (4.12)",
    "yatay zemin itkisi",
    "rüzgâr",
    "E + W",
    "eşzamanlı",
    "zarf",
    "SOURCE_VALUE",
  ],
  "deprem-sigortasi-dask-ve-muhendislik-baglantisi": [
    "6305",
    "Zorunlu Deprem Sigortası",
    "maddi zarar",
    "yapısal performans",
    "yapısal güvenlik belgesi değildir",
    "TBDY",
    "mühendislik değerlendirmesi",
  ],
  "yatay-yuk-tasima-sistemleri-cerceve-perde-cekirdek": [
    "Tablo 4.1",
    "A11",
    "R = 8",
    "D = 3",
    "A12",
    "A13",
    "A14",
    "A15",
    "Denklem (4.2)",
    "%40",
    "%75",
    "çekirdek",
    "bağ kirişli",
    "SOURCE_VALUE",
  ],
};

const errors: string[] = [];
const assert = (condition: unknown, message: string) => {
  if (!condition) errors.push(message);
};

assert(DEPREM_PHASE3_ARTICLES.length === 56, `FAZ 3 override sayısı 56 olmalı; bulunan ${DEPREM_PHASE3_ARTICLES.length}.`);
assert(DEPREM_PHASE3_SLUGS.size === 56, "FAZ 3 source-of-truth slug kümesinde tekrar/eksik kayıt var.");
assert(new Set([...DEPREM_PHASE3_SLUGS, ...PHASE2_C1_CARRY_FORWARD.map((item) => item.slug)]).size === 58, "FAZ 3 nihai hedef kapsamı 58 benzersiz makale olmalı.");
for (const slug of BATCH_14_SLUGS) assert(DEPREM_PHASE3_SLUGS.has(slug), `FAZ 3 Batch 14 slug eksik: ${slug}`);
for (const item of PHASE2_C1_CARRY_FORWARD) {
  assert(DEPREM_PILOT_SLUGS.has(item.slug), `FAZ 2 C1 carry-forward pilot bulunamadı: ${item.slug}`);
  assert(!(DEPREM_PHASE3_SLUGS as Set<string>).has(item.slug), `C1 pilot gereksiz yere FAZ 3 source-of-truth'a kopyalanmış: ${item.slug}`);
}

const batch14Source = fs.readFileSync(path.join(ROOT, "src/lib/deprem-phase3-batch14.ts"), "utf8");
assert(batch14Source.includes("DEPREM_PHASE3_BATCH_14_ARTICLES"), "Batch 14 aggregator export'u eksik.");
const phase3AggregatorSource = fs.readFileSync(path.join(ROOT, "src/lib/deprem-phase3-articles.ts"), "utf8");
assert(phase3AggregatorSource.includes("DEPREM_PHASE3_BATCH_14_ARTICLES"), "FAZ 3 aggregator Batch 14'ü toplamıyor.");

for (const slug of BATCH_14_SLUGS) {
  const configured = DEPREM_PHASE3_ARTICLES.find((article) => article.slug === slug);
  assert(Boolean(configured), `Batch 14 source-of-truth makalesi bulunamadı: ${slug}`);
  if (!configured) continue;

  assert(!TS500_SLUGS.has(slug), `Batch 14 TS500 kapsamına taşmış: ${slug}`);
  assert(!DEPREM_PILOT_SLUGS.has(slug), `Batch 14 pilot ile çakışıyor: ${slug}`);
  assert(configured.sections.length >= 6, `Batch 14 profesyonel bölüm sayısı yetersiz: ${slug}`);
  assert(configured.references.length >= 2, `Batch 14 doğrulanabilir referans sayısı yetersiz: ${slug}`);
  assert(configured.references.some((ref) => ref.href?.includes("TBDY_2018.pdf")), `AFAD TBDY PDF referansı eksik: ${slug}`);
  assert(configured.references.some((ref) => ref.href?.includes("turkiye-bina-deprem-yonetmeligi")), `AFAD TBDY resmî sayfa referansı eksik: ${slug}`);

  if (slug === "deprem-sigortasi-dask-ve-muhendislik-baglantisi") {
    assert(configured.references.some((ref) => ref.href?.includes("dask.gov.tr/tr/teminat-ve-kapsami")), "DASK teminat/kapsam resmî kaynağı eksik.");
    assert(configured.references.some((ref) => ref.href?.includes("dask.gov.tr/tr/kanun")), "6305 sayılı Kanun için DASK resmî kaynağı eksik.");
  }

  const configuredText = configured.sections.map((section) => `${section.title}\n${section.content}`).join("\n");
  assert(!configuredText.includes("Kapsam ve karar\n"), `C3 jenerik bölüm başlığı kaldı: ${slug}`);
  assert(!configuredText.includes("Proje kontrol sırası\n"), `C3 jenerik bölüm başlığı kaldı: ${slug}`);
  assert(!/[�ÃÄÅÂ]/.test(configuredText), `Encoding şüphesi: ${slug}`);
  assert(!configuredText.includes("/deprem-yonetmelik/araclar/"), `Eski araç route'u Batch 14 gövdesinde kaldı: ${slug}`);
  for (const token of requiredTokens[slug]) assert(configuredText.includes(token), `Batch 14 teknik işareti eksik (${token}): ${slug}`);

  const article = getArticleBySlug(slug);
  assert(Boolean(article), `Batch 14 runtime makalesi bulunamadı: ${slug}`);
  if (!article) continue;
  assert(article.sectionId === "deprem-yonetmelik", `Yanlış sectionId: ${slug}`);
  assert(article.seriesId === "tbdy", `Batch 14 seriesId tbdy olmalı: ${slug}`);
  assert(article.author === DEPREM_CONTENT_AUTHOR.name, `Canonical yazar uygulanmadı: ${slug}`);
  assert(article.authorTitle === "", `Canonical authorTitle boş olmalı: ${slug}`);
  assert(getArticleAuthorPresentation(article).monogram === DEPREM_CONTENT_AUTHOR.monogram, `HG monogram uygulanmadı: ${slug}`);
  assert(article.updatedAt === "25 Ağustos 2026", `updatedAt beklenenden farklı: ${slug}`);
  assert(article.sections.length === configured.sections.length, `Runtime bölüm sayısı Batch 14 gövdesiyle uyuşmuyor: ${slug}`);
  assert(article.sections[0]?.content.startsWith(configured.sections[0]?.content.trim() ?? ""), `Runtime ilk bölüm Batch 14 gövdesinden gelmiyor: ${slug}`);

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
  assert(blocks.filter((block) => block.type === "formula").length === 0, `Batch 14'te gereksiz FormulaBlock bulundu: ${slug}`);
}

for (const item of PHASE2_C1_CARRY_FORWARD) {
  const article = getArticleBySlug(item.slug);
  assert(Boolean(article), `C1 carry-forward runtime makalesi bulunamadı: ${item.slug}`);
  if (!article) continue;
  assert(article.seriesId === item.seriesId, `C1 carry-forward seriesId yanlış: ${item.slug}`);
  assert(article.author === DEPREM_CONTENT_AUTHOR.name, `C1 carry-forward canonical yazar uygulanmadı: ${item.slug}`);
  assert(article.authorTitle === "", `C1 carry-forward authorTitle boş olmalı: ${item.slug}`);
  assert(getArticleAuthorPresentation(article).monogram === DEPREM_CONTENT_AUTHOR.monogram, `C1 carry-forward HG monogram uygulanmadı: ${item.slug}`);
  assert(article.updatedAt === "25 Ağustos 2026", `C1 carry-forward updatedAt farklı: ${item.slug}`);
  assert(article.sections.length >= 4, `C1 pilot teknik gövdesi yetersiz: ${item.slug}`);
  assert((article.references?.length ?? 0) >= 2, `C1 pilot referansları yetersiz: ${item.slug}`);
}

const phase3SeriesCoverage = DEPREM_PHASE3_ARTICLES.reduce(
  (acc, configured) => {
    const article = getArticleBySlug(configured.slug);
    if (article?.seriesId === "tbdy") acc.tbdy += 1;
    if (article?.seriesId === "tbdy-betonarme") acc["tbdy-betonarme"] += 1;
    return acc;
  },
  { tbdy: 0, "tbdy-betonarme": 0 },
);
assert(phase3SeriesCoverage.tbdy === 35, `FAZ 3 tbdy override sayısı 35 olmalı; bulunan ${phase3SeriesCoverage.tbdy}.`);
assert(phase3SeriesCoverage["tbdy-betonarme"] === 21, `FAZ 3 tbdy-betonarme override sayısı 21 olmalı; bulunan ${phase3SeriesCoverage["tbdy-betonarme"]}.`);

if (errors.length > 0) {
  console.error("Deprem FAZ 3 nihai 58/58 kontrolü başarısız:\n");
  for (const error of [...new Set(errors)]) console.error(`- ${error}`);
  process.exit(1);
}

console.log(JSON.stringify({
  status: "ok",
  phase: "FAZ 3",
  completedBatches: 14,
  phase3Overrides: 56,
  phase2C1CarryForward: PHASE2_C1_CARRY_FORWARD.map((item) => item.slug),
  targetArticles: 58,
  remaining: 0,
  batch14Slugs: BATCH_14_SLUGS,
  sourceOfTruth: "src/lib/deprem-phase3-articles.ts + two preserved FAZ 2 C1 pilots",
  c3GenericBodyRemainingInCompletedBatches: 0,
  pilotCollisionCount: 0,
  officialSourceProfile: "AFAD TBDY 2018 + AFAD/Resmî Gazete tarihsel kaynakları + AFAD/İPKB 1999 kaynakları + DASK/6305 resmî kaynakları",
  visualContract: "existing unique rollout cover + body figure preserved",
  seriesCoverage: phase3SeriesCoverage,
  targetCoverage: { tbdy: 36, "tbdy-betonarme": 22, total: 58 },
  ts500Touched: false,
}, null, 2));
