import type { ArticleData } from "./articles-data";
import { DEPREM_PHASE7_BATCH_1_ARTICLES } from "./deprem-phase7-batch1";
import { DEPREM_PHASE7_BATCH_2_ARTICLES } from "./deprem-phase7-batch2";
import { DEPREM_PHASE7_BATCH_3_ARTICLES } from "./deprem-phase7-batch3";

export const DEPREM_PHASE7_ARTICLES = [
  ...DEPREM_PHASE7_BATCH_1_ARTICLES,
  ...DEPREM_PHASE7_BATCH_2_ARTICLES,
  ...DEPREM_PHASE7_BATCH_3_ARTICLES,
] as const;

const PHASE7_BY_SLUG = new Map(DEPREM_PHASE7_ARTICLES.map((article) => [article.slug, article] as const));

export const DEPREM_PHASE7_SLUGS = new Set(DEPREM_PHASE7_ARTICLES.map((article) => article.slug));

export function applyDepremPhase7Override(article: ArticleData): ArticleData {
  const override = PHASE7_BY_SLUG.get(article.slug);
  if (!override) return article;
  return { ...article, ...override, quote: undefined };
}

export function getDepremPhase7ContentSignature(): string {
  return DEPREM_PHASE7_ARTICLES
    .map((article) => `${article.slug}:${article.updatedAt}:${article.sections.length}:${article.readTime}`)
    .join("|");
}
