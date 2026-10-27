import assert from "node:assert/strict";
import fs from "node:fs";
import { getArticleList } from "../src/lib/articles-data";
import { TBDY_STAGE2_ARTICLES } from "../src/lib/tbdy-stage2-articles";
import { TBDY_ARTICLE_INDEX, TBDY_CHAPTERS } from "../src/lib/tbdy-guide";
import { buildDepremArticleSummaries, filterDepremArticleSummaries } from "../src/lib/deprem-series";
const list=getArticleList(), slugs=new Set(list.map(a=>a.slug));
assert.equal(slugs.size,list.length,"Duplicate article slugs");
assert.equal(TBDY_STAGE2_ARTICLES.length,11);
assert.equal(TBDY_CHAPTERS.length,17);
const covered=new Set(Object.entries(TBDY_ARTICLE_INDEX).filter(([slug])=>slugs.has(slug)).flatMap(([,m])=>m.chapters));
for(let n=1;n<=17;n++)assert.ok(covered.has(n),"Chapter missing: "+n);
for(const article of TBDY_STAGE2_ARTICLES){
 const meta=TBDY_ARTICLE_INDEX[article.slug];
 assert.ok(meta,"No guide index: "+article.slug);
 assert.ok(slugs.has(article.slug),"No published article: "+article.slug);
 assert.ok(article.sections.length>=4,"Shallow article: "+article.slug);
 assert.ok(article.references?.some(x=>x.href?.includes("afad.gov.tr")),"No AFAD reference");
 assert.ok(fs.existsSync("public"+article.image),"No unique cover: "+article.image);
 const img="/tbdy-stage2/"+article.slug+"/diagram.svg";
 assert.ok(fs.existsSync("public"+img),"No diagram: "+img);
 assert.ok(article.sections.some(x=>x.content.includes(img)),"Unlinked figure "+article.slug);
 for(const n of article.relatedSlugs)asse¶»§q«^