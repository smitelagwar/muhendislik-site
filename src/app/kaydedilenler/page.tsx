import type { Metadata } from "next";
import { SavedItemsClient } from "@/components/kaydedilenler/saved-items-client";
import { getArticleList } from "@/lib/articles-data";
import { buildSeoMetadata } from "@/lib/seo";

export const metadata: Metadata = buildSeoMetadata({
  title: "Kaydedilen İçerikler",
  description: "Yer imine eklediğiniz makale ve rehberleri tek sayfada yönetin.",
  pathname: "/kaydedilenler",
});

export default function SavedItemsPage() {
  const articles = Object.fromEntries(
    getArticleList().map((article) => [
      article.slug,
      {
        slug: article.slug,
        title: article.title,
        description: article.description,
        category: article.category,
      },
    ]),
  );

  return <SavedItemsClient articles={articles} />;
}
