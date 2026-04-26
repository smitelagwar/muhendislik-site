import type { Metadata } from "next";
import { getArticleList } from "@/lib/articles-data";
import HomeClient from "@/components/home-client";
import type { HomeArticle } from "@/components/home-types";
import { buildHomeMetadata } from "@/lib/seo";

export const metadata: Metadata = buildHomeMetadata();

export default function Home() {
  const allArticles: HomeArticle[] = getArticleList()
    .reverse()
    .map((article) => ({
      title: article.title,
      slug: article.slug,
      sectionId: article.sectionId,
      category: article.category,
      categoryColor: article.categoryColor,
      description: article.description,
      image: article.image,
      author: article.author,
      date: article.date,
      readTime: article.readTime,
    }));

  return <HomeClient allArticles={allArticles} />;
}
