import fs from "node:fs";
import path from "node:path";
import { parseBlocks } from "../src/lib/article-blocks";
import { getArticleList } from "../src/lib/articles-data";
import { DEPREM_CONTENT_AUTHOR, getArticleAuthorPresentation } from "../src/lib/content-author";
import { DEPREM_TOPIC_ARTICLES } from "../src/lib/deprem-topic-articles";
import {
  DEPREM_SERIES,
  getDepremSeriesIdForArticle,
  type DepremSeriesId,
} from "../src/lib/deprem-series";
import { TOOLS } from "../src/lib/tools-data";
import { TS500_SLUGS } from "../src/lib/ts500-content";

const EXPECTED_TOTAL = 175;
const EXPECTED_TOPIC_COUNT = 56;
const EXPECTED_TS500_COUNT = 21;
const EXPECTED_TARGET_COUNT = 154;
const OLD_TOOL_ROUTE = "/deprem-yonetmelik/araclar/";
const GENERIC_COVER_PATTERNS = [/\/covers\/yonetmelik\.svg$/i, /placeholder/i, /generic/i, /default/i];

const EXPECTED_SERIES_COUNTS: Record<DepremSeriesId, number> = {
  tbdy: 47,
  "tbdy-betonarme": 22,
  ts500: 21,
  "mevcut-guclendirme": 13,
  "yapi-denetimi": 8,
  yangin: 10,
  otopark: 5,
  imar: 9,
  bep: 6,
  "su-zemin": 11,
  engelsiz: 4,
  eurocode: 5,
  akustik: 1,
  asansor: 4,
  isg: 5,
  cevre: 4,
};

const articles = getArticleList();
const depremArticles = articles.filter((article) => article.sectionId === "deprem-yonetmelik");
const targetArticles = depremArticles.filter((article) => !TS500_SLUGS.has(article.slug));
const structuralErrors: string[] = [];
const warnings: string[] = [];
const allSlugs = new Set(articles.map((arti¶»§q«^