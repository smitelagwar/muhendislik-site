import { parseBlocks } from "../src/lib/article-blocks";
import { getArticleBySlug } from "../src/lib/articles-data";
import { DEPREM_PILOT_SLUGS } from "../src/lib/deprem-pilot-articles";
import {
  DEPREM_ROLLOUT_ARTICLES,
  DEPREM_ROLLOUT_BATCH_1,
  DEPREM_ROLLOUT_BATCH_1_SLUGS,
  DEPREM_ROLLOUT_BATCH_2,
  DEPREM_ROLLOUT_BATCH_2_SLUGS,
  DEPREM_ROLLOUT_SLUGS,
  getDepremRolloutVisualPath,
} from "../src/lib/deprem-rollout";
import { renderDepremVisualSvg } from "../src/lib/deprem-visual";
import { TS500_SLUGS } from "../src/lib/ts500-content";

const EXPECTED_BATCH_1 = [
  "tbdy-2018-betonarme-analiz",
  "kisa-kolon-etkisi-tbdy-2018",
  "tbdy-2018-dogrusal-olmayan-tasarim",
  "tbdy-2018-guclu-kolon-kontrolu",
  "tbdy-2018-duzensizlikler-rehberi",
  "tbdy-2018-sismik-izolasyon",
  "tbdy-deprem-yer-hareketi-duzeyleri",
  "tbdy-afad-ss-s1-okuma",
  "tbdy-yerel-zemin-sinifi-spektrum",
  "tbdy-tasarim-spektrumu-cizimi",
  "tbdy-r-d-dayanim-fazlaligi",
  "tbdy-bina-onem-katsayisi",
] as const;

const EXPECTED_BATCH_2 = [
  "tbdy-suneklik-duzeyi-sistem-farki",
  "tbdy-mod-birlesim-srss-cqc",
  "tbdy-goreli-kat-otelenmesi",
  "tbdy-dismerkezlik-kurali",
  "tbdy-bodrum-katli-binalar",
  "tbdy-cati-agirligi-yuk-azaltma",
  "tbdy-p-delta-ikinci-mertebe",
  "turkiyede-tarihsel-depremler-ve-yonetmelik-evrimi",
  "1999-marmara-depreminden-cikarilan-muhendislik-dersleri",
  "betonarme-perde-tasarimi-depremde-tip-ve-boyutlandirma-kurallari",
  "duzensiz-binalarda-dinamik-analiz-zorunlulugu",
  "deprem-yuku-ile-ruzgar-yuku-kombinasyonu",
] as const;

const errors: string[] = [];

function assert(condition: unknown, message: string) {
  if (!condition) errors.push(message);
}

function validateExpectedBatch(
  batch: number,
  expected: readonly string[],
  actualSpecs: readonly { slug: string }[],
  actualSlugs: Set<string>,
) {
  assert(actualSpecs.length === expected.length, `Batch ${batch} tam olarak ${expected.length} makale içermeli.`);
  assert(actualSlugs.size === expected.length, `Batch ${batch} slug listesinde tekrar/eksik kayıt var.`);
  for (const slug of expected) assert(actualSlugs.has(slug), `Batch ${batch} slug eksik: ${slug}`);
}

validateExpectedBatch(1, EXPECTED_BATCH_1, DEPREM_ROLLOUT_BATCH_1, DEPREM_ROLLOUT_BATCH_1_SLUGS);
validateExpectedBatch(2, EXPECTED_BATCH_2, DEPREM_ROLLOUT_BATCH_2, DEPREM_ROLLOUT_BATCH_2_SLUGS);
assert(DEPREM_ROLLOUT_SLUGS.size === DEPREM_ROLLOUT_ARTICLES.length, "Rollout genel listesinde tekrar slug var.");

const uniqueCovers = new Set<string>();
const uniqueDiagrams = new Set<string>();

for (const spec of DEPREM_ROLLOUT_ARTICLES) {
  const article = getArticleBySlug(spec.slug);
  assert(Boolean(article), `Runtime makalesi bulunamadı: ${spec.slug}`);
  if (!article) continue;

  assert(article.sectionId === "deprem-yonetmelik", `Yanlış sectionId: ${article.slug}`);
  assert(!TS500_SLUGS.has(article.slug), `Rollout TS500'e temas ediyor: ${article.slug}`);
  assert(!DEPREM_PILOT_SLUGS.has(article.slug), `Rollout pilotla çakışıyor: ${article.slug}`);
  assert(article.updatedAt === "25 Ağustos 2026", `updatedAt uygulanmadı: ${article.slug}`);

  if (spec.referenceProfile === "preserve") {
    assert((article.references?.length ?? 0) >= 1, `Korunacak mevcut kaynakça bulunamadı: ${article.slug}`);
  } else {
    assert((article.references?.length ?? 0) >= 2, `En az iki resmi referans bekleniyor: ${article.slug}`);
    assert(article.references?.some((ref) => ref.href?.includes("TBDY_2018.pdf")), `TBDY PDF referansı eksik: ${article.slug}`);
    assert(article.references?.some((ref) => ref.href?.includes("turkiye-bina-deprem-yonetmeligi")), `AFAD TBDY sayfası eksik: ${article.slug}`);
    if (spec.referenceProfile === "tbdy-hazard") {
      assert(article.references?.some((ref) => ref.href?.includes("turkiye-deprem-tehlike-haritasi")), `AFAD tehlike haritası referansı eksik: ${article.slug}`);
    }
  }

  const cover = getDepremRolloutVisualPath(article.slug, "cover");
  const diagram = getDepremRolloutVisualPath(article.slug, "diagram");
  assert(article.image === cover, `Dinamik cover uygulanmadı: ${article.slug}`);
  assert(!uniqueCovers.has(cover), `Cover yolu tekrar ediyor: ${cover}`);
  assert(!uniqueDiagrams.has(diagram), `Diagram yolu tekrar ediyor: ${diagram}`);
  uniqueCovers.add(cover);
  uniqueDiagrams.add(diagram);

  const blocks = article.sections.flatMap((section) => parseBlocks(section.content));
  const figure = blocks.find((block) => block.type === "image" && block.src === diagram);
  assert(Boolean(figure), `Rollout teknik figure bulunamadı: ${article.slug}`);
  if (figure?.type === "image") {
    assert(Boolean(figure.alt), `Figure alt metni eksik: ${article.slug}`);
    assert(Boolean(figure.caption), `Figure caption eksik: ${article.slug}`);
    assert(figure.figureNumber === "R1", `Figure numarası R1 olmalı: ${article.slug}`);
    assert(Boolean(figure.note), `Figure notu eksik: ${article.slug}`);
    assert(Boolean(figure.sourceNote), `Figure kaynak notu eksik: ${article.slug}`);
    assert(figure.sourceNote.includes("türetilmiş kontrol şeması"), `Figure provenance açık değil: ${article.slug}`);
    assert(figure.lightbox, `Figure lightbox açık olmalı: ${article.slug}`);
  }

  for (const asset of ["cover", "diagram"] as const) {
    const svg = renderDepremVisualSvg(spec, asset);
    assert(svg.startsWith("<svg"), `SVG başlangıcı geçersiz: ${article.slug}/${asset}`);
    assert(svg.includes('xmlns="http://www.w3.org/2000/svg"'), `SVG xmlns eksik: ${article.slug}/${asset}`);
    assert(!/<script|<foreignObject|javascript:/i.test(svg), `SVG güvenlik kontratı ihlali: ${article.slug}/${asset}`);
    assert(svg.includes("<title"), `SVG erişilebilir title eksik: ${article.slug}/${asset}`);
  }
}

if (errors.length > 0) {
  console.error("Deprem rollout kontrolü başarısız:\n");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(JSON.stringify({
  status: "ok",
  batches: [1, 2],
  articles: DEPREM_ROLLOUT_ARTICLES.length,
  batch1: DEPREM_ROLLOUT_BATCH_1.length,
  batch2: DEPREM_ROLLOUT_BATCH_2.length,
  uniqueCovers: uniqueCovers.size,
  uniqueDiagrams: uniqueDiagrams.size,
  ts500Touched: false,
  pilotOverlap: false,
}, null, 2));
