import type { ArticleData } from "./articles-data";
import { DEPREM_PHASE7_BATCH_1_ARTICLES } from "./deprem-phase7-batch1";
import { DEPREM_PHASE7_BATCH_2_ARTICLES } from "./deprem-phase7-batch2";
import { DEPREM_PHASE7_BATCH_3_ARTICLES } from "./deprem-phase7-batch3";

// FAZ 7 source-of-truth order is fixed: BEP/TS 825 -> Akustik -> Eurocode.
// Existing public article slugs remain canonical; Phase 7 enriches them in place.
export const DEPREM_PHASE7_ARTICLES = [
  ...DEPREM_PHASE7_BATCH_1_ARTICLES,
  ...DEPREM_PHASE7_BATCH_2_ARTICLES,
  ...DEPREM_PHASE7_BATCH_3_ARTICLES,
] as const;

const PHASE7_BY_SLUG = new Map(DEPREM_PHASE7_ARTICLES.map((article) => [article.slug, article] as const));

export const DEPREM_PHASE7_SLUGS = new Set(DEPREM_PHASE7_ARTICLES.map((article) => article.slug));

export const PHASE7_C1_VISUAL_CARRY_FORWARD = {
  slug: "bep-isi-yalitim-u-degeri-yogusma-kontrolu",
  cover: "/images/deprem-pilots/bep-isi-yalitim-u-degeri-yogusma-kontrolu-cover.svg",
  diagram: "/images/deprem-pilots/bep-isi-yalitim-u-degeri-yogusma-kontrolu-diagram.svg",
} as const;

const PHASE7_C1_VISUAL_FIGURE = [
  `![TS 825 U değeri ve yoğuşma için teknik kontrol şeması](${PHASE7_C1_VISUAL_CARRY_FORWARD.diagram})`,
  "*Katmanlı duvarda sıcaklık ve buhar basıncı davranışını, FAZ 7 teknik gövdesi içinde korunan pilot şemayla birlikte okuyun.*",
  "{figure:1 | note:Şema fiziksel kontrol mantığını özetler; lisanslı TS 825 hesabının yerine geçmez. | source:FAZ 2 pilot teknik görseli — TS 825 ısı ve nem hesabı yaklaşımı | lightbox:true}",
].join("\n");

export function applyDepremPhase7Override(article: ArticleData): ArticleData {
  const override = PHASE7_BY_SLUG.get(article.slug);
  if (!override) return article;

  const merged: ArticleData = { ...article, ...override, quote: undefined };
  if (article.slug !== PHASE7_C1_VISUAL_CARRY_FORWARD.slug) return merged;

  const sections = merged.sections.map((section, index) =>
    index === 0
      ? { ...section, content: `${section.content.trim()}\n\n${PHASE7_C1_VISUAL_FIGURE}` }
      : section,
  );

  return {
    ...merged,
    image: PHASE7_C1_VISUAL_CARRY_FORWARD.cover,
    sections,
  };
}

export function getDepremPhase7ContentSignature(): string {
  return DEPREM_PHASE7_ARTICLES
    .map((article) => `${article.slug}:${article.updatedAt}:${article.sections.length}:${article.readTime}`)
    .join("|");
}
