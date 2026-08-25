import type { ArticleData } from "./articles-data";
import { DEPREM_PHASE3_ARTICLES as DEPREM_PHASE3_BATCH_1_ARTICLES } from "./deprem-phase3-batch1";
import { DEPREM_PHASE3_BATCH_2_ARTICLES } from "./deprem-phase3-batch2";
import { DEPREM_PHASE3_BATCH_3_ARTICLES } from "./deprem-phase3-batch3";
import { DEPREM_PHASE3_BATCH_4_ARTICLES } from "./deprem-phase3-batch4";
import { DEPREM_PHASE3_BATCH_5_ARTICLES } from "./deprem-phase3-batch5";

export const DEPREM_PHASE3_ARTICLES = [
  ...DEPREM_PHASE3_BATCH_1_ARTICLES,
  ...DEPREM_PHASE3_BATCH_2_ARTICLES,
  ...DEPREM_PHASE3_BATCH_3_ARTICLES,
  ...DEPREM_PHASE3_BATCH_4_ARTICLES,
  ...DEPREM_PHASE3_BATCH_5_ARTICLES,
] as const;

const PHASE3_BY_SLUG = new Map(DEPREM_PHASE3_ARTICLES.map((article) => [article.slug, article] as const));

export const DEPREM_PHASE3_SLUGS = new Set(DEPREM_PHASE3_ARTICLES.map((article) => article.slug));

export function applyDepremPhase3Override(article: ArticleData): ArticleData {
  const override = PHASE3_BY_SLUG.get(article.slug);
  if (!override) return article;

  return {
    ...article,
    ...override,
    quote: undefined,
  };
}

export function getDepremPhase3ContentSignature(): string {
  return DEPREM_PHASE3_ARTICLES
    .map((article) => `${article.slug}:${article.updatedAt}:${article.sections.length}:${article.readTime}`)
    .join("|");
}
