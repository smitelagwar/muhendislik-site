import { DEPREM_TOPIC_ARTICLES } from "./deprem-topic-articles";
import {
  DEPREM_ROLLOUT_ARTICLES,
  getDepremRolloutSpec,
  type DepremRolloutSpec,
} from "./deprem-rollout";
import { DEPREM_TECHNICAL_VISUAL_REGISTRY_SLUGS } from "./deprem-visual-rollout-registry";

const TOPIC_ARTICLE_BY_SLUG = new Map(DEPREM_TOPIC_ARTICLES.map((article) => [article.slug, article] as const));

/**
 * The legacy deprem rollout predates the canonical 164-topic inventory and
 * does not contain every newer topic. Technical visuals must still resolve a
 * stable spec for those canonical topics without silently dropping the route.
 */
export function getDepremVisualSpec(slug: string): DepremRolloutSpec | undefined {
  const legacy = getDepremRolloutSpec(slug);
  if (legacy) return legacy;
  if (!DEPREM_TECHNICAL_VISUAL_REGISTRY_SLUGS.has(slug)) return undefined;

  const article = TOPIC_ARTICLE_BY_SLUG.get(slug);
  if (!article) return undefined;

  return {
    slug,
    batch: 99,
    headline: article.title,
    eyebrow: "TEKNİK GÖRSEL",
    steps: ["Konu girdisi", "Mühendislik davranışı", "Kontrol"],
    referenceProfile: "preserve",
    visualLayout: "flow",
  };
}

export const DEPREM_VISUAL_STATIC_SLUGS = Array.from(
  new Set([
    ...DEPREM_ROLLOUT_ARTICLES.map((spec) => spec.slug),
    ...DEPREM_TECHNICAL_VISUAL_REGISTRY_SLUGS,
  ]),
);
