import fs from "node:fs";
import path from "node:path";
import { parseBlocks } from "../src/lib/article-blocks";
import { getArticleList } from "../src/lib/articles-data";
import { DEPREM_CONTENT_AUTHOR, getArticleAuthorPresentation, normalizeDepremContentAuthor } from "../src/lib/content-author";
import { DEPREM_SERIES } from "../src/lib/deprem-series";
import { TOOLS } from "../src/lib/tools-data";
import { TS500_SLUGS } from "../src/lib/ts500-content";

const errors: string[] = [];
const assert = (condition: unknown, message: string) => {
  if (!condition) errors.push(message);
};

const sampleArticle = normalizeDepremContentAuthor({
  sectionId: "deprem-yonetmelik",
  author: "Eski Yazar",
  authorTitle: "Eski Unvan",
});
const samplePresentation = getArticleAuthorPresentation(sampleArticle);
assert(sampleArticle.author === "İnşaat Mühendisi Hüseyin GÜNAYDIN", "Canonical deprem author string yanlış.");
assert(sampleArticle.authorTitle === "", "Canonical author profesyonel unvanı ikinci kez render edilebilir.");
assert(samplePresentation.monogram === "HG", "Canonical monogram HG değil.");

const parsed = parseBlocks(`> [!MÜHENDİSLİK] Tasarım kararı
> Rijitlik kabulleri model davranışını değiştirir.

![Perde ve çerçeve yük aktarımı](/images/test.svg)
*Perde–çerçeve sisteminde yatay yük aktarımının şematik gösterimi.*
{figure: 2 | note: Çizim ölçekli değildir. | source: TBDY 2018 | lightbox: true}

\`\`\`formula
@label: Denklem 1
VtE = mt * SaR(Tp)
@symbol: VtE | Eşdeğer deprem yükü taban kesme kuvveti | kN
@symbol: mt | Toplam bina kütlesi | t
@symbol: SaR(Tp) | Azaltılmış tasarım spektral ivmesi | m/s²
\`\`\``);

const callout = parsed.find((block) => block.type === "callout");
assert(callout?.type === "callout" && callout.tone === "engineering" && callout.title === "Tasarım kararı", "Semantik mühendislik callout parserı başarısız.");

const figure = parsed.find((block) => block.type === "image");
assert(figure?.type === "image" && figure.figureNumber === "2", "Figure number metadata parserı başarısız.");
assert(figure?.type === "image" && Boolean(figure.alt) && Boolean(figure.caption), "Figure alt/caption parserı başarısız.");
assert(figure?.type === "image" && figure.note.includes("ölçekli") && figure.sourceNote === "TBDY 2018" && figure.lightbox, "Figure note/source/lightbox parserı başarısız.");

const formula = parsed.find((block) => block.type === "formula");
assert(formula?.type === "formula" && formula.expression.includes("VtE"), "Formula expression parserı başarısız.");
assert(formula?.type === "formula" && formula.symbols.length === 3 && formula.symbols.every((item) => item.symbol && item.description && item.unit), "Formula sembol/birim semantiği başarısız.");

const articles = getArticleList().filter((article) => article.sectionId === "deprem-yonetmelik");
const targetArticles = articles.filter((article) => !TS500_SLUGS.has(article.slug));
assert(articles.length === 164, `Etkin deprem makale sayısı 164 değil: ${articles.length}`);
assert([...TS500_SLUGS].filter((slug) => articles.some((article) => article.slug === slug)).length === 21, "Etkin TS500 sayısı 21 değil.");
assert(targetArticles.length === 143, `TS500 dışı hedef sayısı 143 değil: ${targetArticles.length}`);

for (const article of articles) {
  const presentation = getArticleAuthorPresentation(article);
  assert(article.author === DEPREM_CONTENT_AUTHOR.name, `Runtime canonical author uygulanmadı: ${article.slug}`);
  assert(article.authorTitle === "", `Runtime authorTitle duplicate credential riski: ${article.slug}`);
  assert(presentation.monogram === DEPREM_CONTENT_AUTHOR.monogram, `Runtime HG monogram uygulanmadı: ${article.slug}`);
}

const validToolHrefs = new Set(TOOLS.map((tool) => tool.href));
for (const series of DEPREM_SERIES) {
  assert(!series.relatedToolHref || validToolHrefs.has(series.relatedToolHref), `Seri CTA gerçek araca gitmiyor: ${series.id} -> ${series.relatedToolHref}`);
}

const articleClientSource = fs.readFileSync(path.resolve(process.cwd(), "src/components/article-client.tsx"), "utf8");
assert(articleClientSource.includes("getArticleAuthorPresentation"), "ArticleClient merkezi author presentation kullanmıyor.");
assert(!articleClientSource.includes('article.author.split(" ")'), "ArticleClient eski otomatik monogram üretimini hâlâ içeriyor.");
assert(articleClientSource.includes("FormulaBlock"), "Ortak FormulaBlock renderer yok.");
assert(articleClientSource.includes("ArticleFigure"), "Ortak ArticleFigure renderer yok.");
const articlePageSource = fs.readFileSync(path.resolve(process.cwd(), "src/app/[slug]/page.tsx"), "utf8");
assert(articlePageSource.includes("getDepremSeriesForArticle"), "Makale sayfası deprem seri CTA ilişkisini kullanmıyor.");
assert(articlePageSource.includes("hideToolPromos={hideToolPromos}"), "İlişkili aracı olmayan deprem serilerinde promosyonlar gizlenmiyor.");

const oldRoute = "/deprem-yonetmelik/araclar/";
for (const file of ["src/lib/deprem-series.ts", "src/components/deprem/AraclarGrid.tsx"]) {
  const source = fs.readFileSync(path.resolve(process.cwd(), file), "utf8");
  assert(!source.includes(oldRoute), `Eski araç route kalıbı kaldı: ${file}`);
}

if (errors.length > 0) {
  console.error("[deprem altyapı kontrolü] Hatalar:");
  for (const error of [...new Set(errors)]) console.error(`- ${error}`);
  process.exit(1);
}

console.log("[deprem altyapı kontrolü] PASS — author/HG, figure, formula, callout, tool CTA ve route altyapısı doğrulandı.");
