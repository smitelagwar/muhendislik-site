import type { ArticleData } from "./articles-data";
import { DEPREM_PHASE5_BATCH_1_ARTICLES } from "./deprem-phase5-batch1";
import { DEPREM_PHASE5_BATCH_2_ARTICLES } from "./deprem-phase5-batch2";
import { DEPREM_PHASE5_BATCH_3_ARTICLES } from "./deprem-phase5-batch3";
import { DEPREM_PHASE5_BATCH_4_ARTICLES } from "./deprem-phase5-batch4";
import { DEPREM_PHASE5_BATCH_5_ARTICLES } from "./deprem-phase5-batch5";

export const DEPREM_PHASE5_ARTICLES = [
  ...DEPREM_PHASE5_BATCH_1_ARTICLES,
  ...DEPREM_PHASE5_BATCH_2_ARTICLES,
  ...DEPREM_PHASE5_BATCH_3_ARTICLES,
  ...DEPREM_PHASE5_BATCH_4_ARTICLES,
  ...DEPREM_PHASE5_BATCH_5_ARTICLES,
] as const;

const PHASE5_BY_SLUG = new Map(DEPREM_PHASE5_ARTICLES.map((article) => [article.slug, article] as const));

export const DEPREM_PHASE5_SLUGS = new Set(DEPREM_PHASE5_ARTICLES.map((article) => article.slug));

export function applyDepremPhase5Override(article: ArticleData): ArticleData {
  const override = PHASE5_BY_SLUG.get(article.slug);
  if (!override) return article;

  return {
    ...article,
    ...override,
    quote: undefined,
  };
}

export function getDepremPhase5ContentSignature(): string {
  return DEPREM_PHASE5_ARTICLES
    .map((article) => `${article.slug}:${article.updatedAt}:${article.sections.length}:${article.readTime}`)
    .join("|");
}
