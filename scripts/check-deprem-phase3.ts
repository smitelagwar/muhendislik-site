import fs from "node:fs";
import path from "node:path";
import { parseBlocks } from "../src/lib/article-blocks";
import { getArticleBySlug } from "../src/lib/articles-data";
import { DEPREM_CONTENT_AUTHOR, getArticleAuthorPresentation } from "../src/lib/content-author";
import { DEPREM_PHASE3_ARTICLES, DEPREM_PHASE3_SLUGS } from "../src/lib/deprem-phase3-articles";
import { DEPREM_PILOT_SLUGS } from "../src/lib/deprem-pilot-articles";
import { getDepremRolloutVisualPath } from "../src/lib/deprem-rollout";
import { TS500_SLUGS } from "../src/lib/ts500-content";

const ROOT = process.cwd();
const BATCH_1_SLUGS = [
  "tbdy-bks-dts-bys-belirleme",
  "tbdy-performans-hedefleri-dd-sh-kh-go",
  "tbdy-kutle-kaynagi-hareketli-yuk-katilimi",
  "tbdy-rijit-yari-rijit-diyafram",
] as const;
const BATCH_2_SLUGS = [
  "tbdy-esdeger-deprem-yuku-uygulanma-sinirlari",
  "tbdy-yeterli-mod-modal-kutle-katilimi",
  "tbdy-modal-taban-kesme-olceklendirme",
  "tbdy-yuzde-100-yuzde-30-birlesimi",
] as const;
const EXPECTED_SLUGS = [...BATCH_1_SLUGS, ...BATCH_2_SLUGS] as const;

type ExpectedSlug = (typeof EXPECTED_SLUGS)[number];

const errors: string[] = [];
const assert = (condition: unknown, message: string) => {
  if (!condition) errors.push(message);
};

assert(DEPREM_PHASE3_ARTICLES.length === EXPECTED_SLUGS.length, `FAZ 3 ilk iki batch toplam ${EXPECTED_SLUGS.length} makale içermeli.`);
assert(DEPREM_PHASE3_SLUGS.size === EXPECTED_SLUGS.length, "FAZ 3 source-of-truth slug kümesinde tekrar/eksik kayıt var.");
for (const slug of EXPECTED_SLUGS) assert(DEPREM_PHASE3_SLUGS.has(slug), `FAZ 3 source-of-truth slug eksik: ${slug}`);

const assemblerSource = fs.readFileSync(path.join(ROOT, "src/lib/articles-data.ts"), "utf8");
const phase3ApplyIndex = assemblerSource.indexOf("applyDepremPhase3Override(pilotArticle)");
const rolloutApplyIndex = assemblerSource.indexOf("applyDepremRolloutEnhancement(phase3Article)");
assert(phase3ApplyIndex >= 0, "Runtime assembler FAZ 3 override katmanını uygulamıyor.");
assert(rolloutApplyIndex > phase3ApplyIndex, "Runtime sırası teknik FAZ 3 gövdesi -> rollout enhancement olmalı.");
assert(assemblerSource.includes("getDepremPhase3ContentSignature()"), "Makale cache signature FAZ 3 içeriğini izlemiyor.");

const phase3AggregatorSource = fs.readFileSync(path.join(ROOT, "src/lib/deprem-phase3-articles.ts"), "utf8");
assert(phase3AggregatorSource.includes("DEPREM_PHASE3_BATCH_1_ARTICLES"), "FAZ 3 aggregator batch 1'i toplamıyor.");
assert(phase3AggregatorSource.includes("DEPREM_PHASE3_BATCH_2_ARTICLES"), "FAZ 3 aggregator batch 2'yi toplamıyor.");
assert(fs.existsSync(path.join(ROOT, "src/lib/deprem-phase3-batch1.ts")), "FAZ 3 batch 1 modülü bulunamadı.");
assert(fs.existsSync(path.join(ROOT, "src/lib/deprem-phase3-batch2.ts")), "FAZ 3 batch 2 modülü bulunamadı.");

const inventorySource = fs.readFileSync(path.join(ROOT, "scripts/generate-deprem-content-inventory.ts"), "utf8");
assert(inventorySource.includes('const PHASE3_PATH = "src/lib/deprem-phase3-articles.ts"'), "Inventory FAZ 3 canonical aggregator yolunu tanımıyor.");
assert(inventorySource.includes('kind: "deprem-phase3-articles"'), "Inventory FAZ 3 source-of-truth türünü raporlamıyor.");

const requiredTokens: Record<ExpectedSlug, string[]> = {
  "tbdy-bks-dts-bys-belirleme": ["Tablo 3.1", "Tablo 3.2", "Tablo 3.3", "SDS < 0.33", "BYS = 4", "SOURCE_VALUE"],
  "tbdy-performans-hedefleri-dd-sh-kh-go": ["Tablo 3.4", "Tablo 3.5", "DD-4 → KK", "DD-1 → GÖ", "DGT", "ŞGDT"],
  "tbdy-kutle-kaynagi-hareketli-yuk-katilimi": ["Denklem (4.16)", "Tablo 4.3", "0.80", "0.60", "0.30", "876.66"],
  "tbdy-rijit-yari-rijit-diyafram": ["4.5.6.2", "4.5.6.3", "4.5.7.2", "A2/A3", "2B sonlu eleman", "Geçiş katı"],
  "tbdy-esdeger-deprem-yuku-uygulanma-sinirlari": ["Tablo 4.4", "ηbi ≤ 2.0", "BYS ≥ 4", "BYS ≥ 5", "BYS ≥ 6", "B2 — Komşu Katlar Arası Rijitlik Düzensizliği"],
  "tbdy-yeterli-mod-modal-kutle-katilimi": ["Denklem (4.30)", "%95", "%3", "YM = 18", "taban kesme kuvveti modal etkin kütleleri"],
  "tbdy-modal-taban-kesme-olceklendirme": ["Denklem (4.31)", "γE = 0.90", "γE = 0.80", "βtE ≥ 1", "1.143", "üst bölüm"],
  "tbdy-yuzde-100-yuzde-30-birlesimi": ["Denklem (4.9)", "+EX + 0.30EY", "+0.30EX + EY", "8 işaret kombinasyonunun", "4.8.3.2(b)", "eşzamanlı"],
};

const expectedFormulaContract: Partial<Record<ExpectedSlug, { label: string; symbols: number }>> = {
  "tbdy-kutle-kaynagi-hareketli-yuk-katilimi": { label: "4.16", symbols: 6 },
  "tbdy-yeterli-mod-modal-kutle-katilimi": { label: "4.30", symbols: 4 },
  "tbdy-modal-taban-kesme-olceklendirme": { label: "4.31", symbols: 4 },
  "tbdy-yuzde-100-yuzde-30-birlesimi": { label: "4.9", symbols: 3 },
};

for (const configured of DEPREM_PHASE3_ARTICLES) {
  const slug = configured.slug as ExpectedSlug;
  assert(!TS500_SLUGS.has(configured.slug), `FAZ 3 override TS500 kapsamına taşmış: ${configured.slug}`);
  assert(!DEPREM_PILOT_SLUGS.has(configured.slug), `FAZ 3 source-of-truth pilot ile çakışıyor: ${configured.slug}`);
  assert(configured.sections.length >= 6, `Profesyonel teknik gövde için bölüm sayısı yetersiz: ${configured.slug}`);
  assert(configured.references.length >= 2, `En az iki resmî AFAD referansı bekleniyor: ${configured.slug}`);
  assert(configured.references.some((ref) => ref.href?.includes("TBDY_2018.pdf")), `AFAD TBDY PDF referansı eksik: ${configured.slug}`);
  assert(configured.references.some((ref) => ref.href?.includes("turkiye-bina-deprem-yonetmeligi")), `AFAD TBDY resmî sayfa referansı eksik: ${configured.slug}`);

  const configuredText = configured.sections.map((section) => `${section.title}\n${section.content}`).join("\n");
  assert(!configuredText.includes("Kapsam ve karar\n"), `C3 jenerik bölüm başlığı kaldı: ${configured.slug}`);
  assert(!configuredText.includes("Proje kontrol sırası\n"), `C3 jenerik bölüm başlığı kaldı: ${configured.slug}`);
  assert(!/[�ÃÄÅÂ]/.test(configuredText), `Encoding şüphesi: ${configured.slug}`);
  assert(!configuredText.includes("/deprem-yonetmelik/araclar/"), `Eski araç route'u FAZ 3 gövdesinde kaldı: ${configured.slug}`);
  for (const token of requiredTokens[slug] ?? []) {
    assert(configuredText.includes(token), `Zorunlu teknik içerik işareti eksik (${token}): ${configured.slug}`);
  }

  const article = getArticleBySlug(configured.slug);
  assert(Boolean(article), `Runtime makalesi bulunamadı: ${configured.slug}`);
  if (!article) continue;

  assert(article.sectionId === "deprem-yonetmelik", `Yanlış sectionId: ${article.slug}`);
  assert(article.seriesId === "tbdy", `İlk iki FAZ 3 batch TBDY Analiz serisinde olmalı: ${article.slug}`);
  assert(article.author === DEPREM_CONTENT_AUTHOR.name, `Canonical yazar uygulanmadı: ${article.slug}`);
  assert(article.authorTitle === "", `Canonical authorTitle boş olmalı: ${article.slug}`);
  assert(getArticleAuthorPresentation(article).monogram === DEPREM_CONTENT_AUTHOR.monogram, `HG monogram uygulanmadı: ${article.slug}`);
  assert(article.updatedAt === "25 Ağustos 2026", `updatedAt beklenenden farklı: ${article.slug}`);
  assert(article.sections.length === configured.sections.length, `Runtime bölüm sayısı FAZ 3 gövdesiyle uyuşmuyor: ${article.slug}`);
  assert(article.sections[0]?.content.startsWith(configured.sections[0]?.content.trim() ?? ""), `Runtime ilk bölüm FAZ 3 gövdesinden gelmiyor: ${article.slug}`);
  for (let index = 0; index < configured.sections.length; index += 1) {
    assert(article.sections[index]?.id === configured.sections[index]?.id, `Runtime section id override edilmedi (${index}): ${article.slug}`);
    assert(article.sections[index]?.title === configured.sections[index]?.title, `Runtime section title override edilmedi (${index}): ${article.slug}`);
  }

  const cover = getDepremRolloutVisualPath(article.slug, "cover");
  const diagram = getDepremRolloutVisualPath(article.slug, "diagram");
  assert(article.image === cover, `Mevcut rollout cover korunmadı: ${article.slug}`);
  const blocks = article.sections.flatMap((section) => parseBlocks(section.content));
  const figure = blocks.find((block) => block.type === "image" && block.src === diagram);
  assert(Boolean(figure), `Mevcut rollout body figure korunmadı: ${article.slug}`);
  if (figure?.type === "image") {
    assert(Boolean(figure.alt.trim()), `Body figure alt eksik: ${article.slug}`);
    assert(Boolean(figure.caption.trim()), `Body figure caption eksik: ${article.slug}`);
    assert(Boolean(figure.sourceNote.trim()), `Body figure source note eksik: ${article.slug}`);
    assert(figure.lightbox, `Body figure lightbox kontratı bozuldu: ${article.slug}`);
  }

  const formulaBlocks = blocks.filter((block) => block.type === "formula");
  const formulaContract = expectedFormulaContract[slug];
  if (formulaContract) {
    assert(formulaBlocks.length === 1, `Tek semantik FormulaBlock bekleniyor: ${article.slug}`);
    const formula = formulaBlocks[0];
    if (formula?.type === "formula") {
      assert(formula.label.includes(formulaContract.label), `Denklem etiketi ${formulaContract.label}'i göstermiyor: ${article.slug}`);
      assert(formula.symbols.length === formulaContract.symbols, `Denklem sembol/birim tanımları eksik: ${article.slug}`);
      assert(formula.symbols.every((symbol) => symbol.symbol && symbol.description && symbol.unit), `Denklem sembol/birim semantiği eksik: ${article.slug}`);
    }
  } else {
    assert(formulaBlocks.length === 0, `Değer katmayan formül bloğu eklenmiş: ${article.slug}`);
  }
}

if (errors.length > 0) {
  console.error("Deprem FAZ 3 ilk iki batch kontrolü başarısız:\n");
  for (const error of [...new Set(errors)]) console.error(`- ${error}`);
  process.exit(1);
}

console.log(JSON.stringify({
  status: "ok",
  phase: "FAZ 3",
  completedBatches: 2,
  batchSizes: { 1: BATCH_1_SLUGS.length, 2: BATCH_2_SLUGS.length },
  articles: EXPECTED_SLUGS.length,
  slugs: EXPECTED_SLUGS,
  sourceOfTruth: "src/lib/deprem-phase3-articles.ts",
  sourceModules: ["src/lib/deprem-phase3-batch1.ts", "src/lib/deprem-phase3-batch2.ts"],
  runtimeOrder: "topic seed -> phase3 technical override -> rollout enhancement -> author normalization",
  c3GenericBodyRemainingInCompletedBatches: 0,
  officialSourceProfile: "AFAD TBDY 2018 PDF + AFAD official regulation page",
  visualContract: "existing unique rollout cover + body figure preserved",
  ts500Touched: false,
}, null, 2));
