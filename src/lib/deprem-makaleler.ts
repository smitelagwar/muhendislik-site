import { getArticleList } from "./articles-data";
import { buildDepremArticleSummaries, sortDepremArticleSummaries } from "./deprem-series";

export interface LegacyDepremMakale {
  slug: string;
  baslik: string;
  ozet: string;
  etiketler: string[];
  okumaSuresi: number;
  tarih: string;
  oneCikar: boolean;
  resim: string;
}

const allArticles = getArticleList();
const depremSummaries = sortDepremArticleSummaries(
  buildDepremArticleSummaries(allArticles.filter((article) => article.sectionId === "deprem-yonetmelik")),
  new Map(allArticles.map((article, index) => [article.slug, index] as const)),
);

export const depremMakaleler: LegacyDepremMakale[] = depremSummaries.map((article, index) => ({
  slug: article.slug,
  baslik: article.title,
  ozet: article.description,
  etiketler: article.keywords,
  okumaSuresi: Number.parseInt(article.readTime, 10) || 0,
  tarih: article.date,
  oneCikar: index < 3,
  resim: article.image,
}));
