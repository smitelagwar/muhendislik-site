import type { Metadata } from "next";
import { Bookmark } from "lucide-react";
import { SavedItemsClient } from "@/components/kaydedilenler/saved-items-client";
import { SitePageHeader, SitePageShell } from "@/components/site-page";
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

  return (
    <SitePageShell width="content">
      <SitePageHeader
        eyebrow="Kişisel çalışma alanı"
        title="Kaydedilen içerikler"
        description="Yer imine eklediğiniz makale ve rehberleri tek listede yönetin ve kaldığınız yerden devam edin."
        icon={<Bookmark className="h-6 w-6" />}
      />
      <SavedItemsClient articles={articles} />
    </SitePageShell>
  );
}
