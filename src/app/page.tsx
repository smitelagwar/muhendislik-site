import { getArticles } from "@/lib/articles-data";
import HomeClient from "@/components/home-client";

export default function Home() {
  const articlesRecord = getArticles();
  const allArticles = Object.values(articlesRecord).reverse();

  return <HomeClient allArticles={allArticles} />;
}
