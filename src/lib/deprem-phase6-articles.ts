import type { ArticleData } from "./articles-data";
import { DEPREM_PHASE6_BATCH_1_ARTICLES } from "./deprem-phase6-batch1";
import { DEPREM_PHASE6_BATCH_2_ARTICLES } from "./deprem-phase6-batch2";
import { DEPREM_PHASE6_BATCH_3_ARTICLES } from "./deprem-phase6-batch3";
import { DEPREM_PHASE6_BATCH_4_ARTICLES } from "./deprem-phase6-batch4";
import { DEPREM_PHASE6_BATCH_5_ARTICLES } from "./deprem-phase6-batch5";

// Master-plan source order is fixed: İmar -> Otopark -> Asansör -> Engelsiz Tasarım.
// The preserved FAZ 2 C1 İmar pilot remains outside these FAZ 6 C3 overrides.
export const DEPREM_PHASE6_ARTICLES = [
  ...DEPREM_PHASE6_BATCH_1_ARTICLES,
  ...DEPREM_PHASE6_BATCH_2_ARTICLES,
  ...DEPREM_PHASE6_BATCH_3_ARTICLES,
  ...DEPREM_PHASE6_BATCH_4_ARTICLES,
  ...DEPREM_PHASE6_BATCH_5_ARTICLES,
] as const;

const PHASE6_BY_SLUG = new Map(DEPREM_PHASE6_ARTICLES.map((article) => [article.slug, article] as const));

export const DEPREM_PHASE6_SLUGS = new Set(DEPREM_PHASE6_ARTICLES.map((article) => article.slug));

export function applyDepremPhase6Override(article: ArticleData): ArticleData {
  const override = PHASE6_BY_SLUG.get(article.slug);
  if (!override) return article;

  return {
    ...article,
    ...override,
    quote: undefined,
  };
}

export function getDepremPhase6ContentSignature(): string {
  return DEPREM_PHASE6_ARTICLES
    .map((article) => `${article.slug}:${article.updatedAt}:${article.sections.length}:${article.readTime}`)
    .join("|");
}
