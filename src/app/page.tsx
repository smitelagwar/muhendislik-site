import type { Metadata } from "next";
import { getArticles } from "@/lib/articles-data";
import HomeClient from "@/components/home-client";
import { buildHomeMetadata } from "@/lib/seo";

export const metadata: Metadata = buildHomeMetadata();

export default function Home() {
  const articlesRecord = getArticles();
  const allArticles = Object.values(articlesRecord).reverse();

  return <HomeClient allArticles={allArticles} />;
}
