import type { ArticleData } from "./articles-data";
import { DEPREM_PHASE4_BATCH_1_ARTICLES } from "./deprem-phase4-batch1";
import { DEPREM_PHASE4_BATCH_2_ARTICLES } from "./deprem-phase4-batch2";
import { DEPREM_PHASE4_BATCH_3_ARTICLES } from "./deprem-phase4-batch3";
import { DEPREM_PHASE4_BATCH_4_ARTICLES } from "./deprem-phase4-batch4";

export const DEPREM_PHASE4_ARTICLES = [
  ...DEPREM_PHASE4_BATCH_1_ARTICLES,
  ...DEPREM_PHASE4_BATCH_2_ARTICLES,
  ...DEPREM_PHASE4_BATCH_3_ARTICLES,
  ...DEPREM_PHASE4_BATCH_4_ARTICLES,
] as const;

const PHASE4_BY_SLUG = new Map(DEPREM_PHASE4_ARTICLES.map((article) => [article.slug, article] as const));

export const DEPREM_PHASE4_SLUGS = new Set(DEPREM_PHASE4_ARTICLES.map((article) => article.slug));

export function applyDepremPhase4Override(article: ArticleData): ArticleData {
  const override = PHASE4_BY_SLUG.get(article.slug);
  if (!override) return article;

  return {
    ...article,
    ...override,
    quote: undefined,
  };
}

export function getDepremPhase4ContentSignature(): string {
  return DEPREM_PHASE4_ARTICLES
    .map((article) => `${article.slug}:${article.updatedAt}:${article.sections.length}:${article.readTime}`)
    .join("|");
}
