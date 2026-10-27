import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { getArticleList } from "../src/lib/articles-data";
import { buildDepremArticleSummaries, filterDepremArticleSummaries } from "../src/lib/deprem-series";
import { TBDY_ARTICLE_INDEX, TBDY_CHAPTERS, TBDY_TOPICS, getTBDYArticleMeta } from "../src/lib/tbdy-guide";

const list = getArticleList();
const summaries = buildDepremArticleSummaries(list.filter((article) => article.sectionId === "deprem-yonetmelik"));
const analyzed = summaries.filter((article) => article.seriesId === "tbdy");
assert.equal(TBDY_TOPICS.length, 7, "Yedi teknik konu grubu bekleniyor");
assert.equal(TBDY_CHAPTERS.length, 17, "Yönetmelik 1–17 bölüm dizini eksiksiz olmalı");
assert.deepEqual(TBDY_CHAPTERS.map((c) => c.number), Array.from({ length: 17 }, (_, i) => i + 1));
assert.ok(analyzed.length >= 36, "TBDY analiz yazılarında beklenmeyen kayıp");
for (const summary of analyzed) {
  const meta = getTBDYArticleMeta(summary.slug);
  assert.ok(meta, "Dizinde olmayan TBDY yazısı: " + summary.slug);
  assert.ok(meta.chapters.every((chapter) => chapter >= 1 && chapter <= 17), "Geçersiz bölüm: " + summary.slug);
}
for (const slug of Object.keys(TBDY_ARTICLE_INDEX)) {
  assert.ok(list.some((article) => article.slug === slug), "Bağlantı hedefi bulunamadı: " + slug);
}
for (const topic of TBDY_TOPICS) {
  assert.ok(Object.values(TBDY_ARTICLE_INDEX).some((meta) => meta.topic === topic.id), "Boş konu grubu: " + topic.id);
}
for (const keyword of ["3.6", "4.5.8", "diyafram"]) {
  const result = filterDepremArticleSummaries(summaries, { seriesId: "all", query: keyword });
  assert.ok(result.length > 0, "Madde / terim araması çalışmıyor: " + keyword);
}
for (const [slug, asset] of [
  ["tbdy-tasarim-spektrumu-cizimi", "spektrum-akisi.svg"],
  ["tbdy-bks-dts-bys-belirleme", "siniflandirma-akisi.svg"],
  ["tbdy-2018-duzensizlikler-rehberi", "a1-b2-duzensizlik.svg"],
  ["tbdy-2018-betonarme-analiz", "modelleme-akisi.svg"],
]) {
  assert.ok(fs.existsSync(path.join(process.cwd(), "public/tbdy-guide", asset)), "Eksik SVG: " + asset);
  assert.ok(list.find((article) => article.slug === slug)?.sections.some((section) => section.content.includes(asset)), "Makale içi SVG kayıp: " + slug);
}
console.log("TBDY aşama 1: " + analyzed.length + " analiz yazısı, 7 konu ve 17 bölüm; dizin/arama/şema kontrolleri geçti.");
