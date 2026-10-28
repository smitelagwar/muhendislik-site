import assert from "node:assert/strict";
import fs from "node:fs";
import { getArticleList } from "../src/lib/articles-data";
import { TBDY_STAGE2_ARTICLES } from "../src/lib/tbdy-stage2-articles";
import { TBDY_ARTICLE_INDEX, TBDY_CHAPTERS } from "../src/lib/tbdy-guide";
import { buildDepremArticleSummaries, filterDepremArticleSummaries } from "../src/lib/deprem-series";

const list = getArticleList();
const slugs = new Set(list.map((article) => article.slug));
assert.equal(slugs.size, list.length, "Yinelenen makale slug bulundu.");
assert.equal(TBDY_STAGE2_ARTICLES.length, 11, "11 yeni rehber bekleniyor.");
assert.equal(TBDY_CHAPTERS.length, 17, "17 bölüm dizini gerekli.");
const chapters = new Set(Object.entries(TBDY_ARTICLE_INDEX)
  .filter(([slug]) => slugs.has(slug))
  .flatMap(([, meta]) => meta.chapters));
for (let n = 1; n <= 17; n++) {
  assert.ok(chapters.has(n), "Bölüm bulunamadı: " + n);
}
for (const article of TBDY_STAGE2_ARTICLES) {
  assert.ok(slugs.has(article.slug), "Makale listesinde eksik: " + article.slug);
  assert.ok(TBDY_ARTICLE_INDEX[article.slug], "Bölüm haritası eksik: " + article.slug);
  assert.ok(article.sections.length >= 4, "Yetersiz bölüm sayısı: " + article.slug);
  assert.ok(article.references?.some((ref) => ref.href?.includes("afad.gov.tr")), "AFAD kaynağı eksik: " + article.slug);
  assert.ok(fs.existsSync("public" + article.image), "Kapak bulunamadı: " + article.image);
  const figure = "/tbdy-stage2/" + article.slug + "/diagram.svg";
  assert.ok(fs.existsSync("public" + figure), "Şema bulunamadı: " + figure);
  assert.ok(article.sections.some((section) => section.content.includes(figure)), "Şema içerikte yok: " + article.slug);
  for (const related of article.relatedSlugs) {
    assert.ok(slugs.has(related), "Kırık ilişkili bağlantı: " + related);
  }
}
const summaries = buildDepremArticleSummaries(list.filter((article) => article.sectionId === "deprem-yonetmelik"));
for (const query of ["6.2","8.4","10.3","12.4","13.6","16.5","2.5.2"]) {
  assert.ok(filterDepremArticleSummaries(summaries, {seriesId: "all",query}).length > 0, "Arama bulunamadı: " + query);
}
console.log("TBDY aşama 2: 17 bölüm, 11 rehber, 22 SVG, bağlantı ve arama doğrulandı.");