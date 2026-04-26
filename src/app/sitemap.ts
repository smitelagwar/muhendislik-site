import { getArticleList } from "@/lib/articles-data";
import { getAllBinaGuidePaths } from "@/lib/bina-asamalari-content";
import { PUBLISHED_AT_ISO } from "@/lib/bina-asamalari-content/builders";
import { getCalculationPages } from "@/lib/calculation-pages";
import type { MetadataRoute } from "next";
import { resolveSiteUrl } from "@/lib/site-config";
import { SITE_SECTIONS } from "@/lib/site-sections";
import { parseLocalizedDateToDate } from "@/lib/seo";
import { getLiveTools } from "@/lib/tools-data";

export default function sitemap(): MetadataRoute.Sitemap {
  const articles = getArticleList();
  const staticDate = new Date(PUBLISHED_AT_ISO);
  const categoryRoutes = SITE_SECTIONS
    .filter((section) => !["araclar", "bina-asamalari"].includes(section.id))
    .map((section) => ({
      pathname: section.href,
      changeFrequency: "weekly" as const,
      priority: section.id === "deprem-yonetmelik" ? 0.85 : 0.72,
    }));
  const staticRoutes = [
    { pathname: "/", changeFrequency: "daily" as const, priority: 1 },
    { pathname: "/konu-haritasi", changeFrequency: "weekly" as const, priority: 0.7 },
    { pathname: "/hesaplamalar", changeFrequency: "weekly" as const, priority: 0.85 },
    { pathname: "/kategori/araclar", changeFrequency: "weekly" as const, priority: 0.8 },
    { pathname: "/kategori/bina-asamalari", changeFrequency: "weekly" as const, priority: 0.75 },
    { pathname: "/hakkimizda", changeFrequency: "monthly" as const, priority: 0.5 },
    { pathname: "/iletisim", changeFrequency: "monthly" as const, priority: 0.5 },
    { pathname: "/gizlilik", changeFrequency: "monthly" as const, priority: 0.4 },
    { pathname: "/kullanim-kosullari", changeFrequency: "monthly" as const, priority: 0.4 },
  ];
  const calculationEntries: MetadataRoute.Sitemap = getCalculationPages().map((page) => ({
    url: resolveSiteUrl(page.href),
    lastModified: staticDate,
    changeFrequency: "weekly",
    priority: page.href === "/hesaplamalar/insaat-maliyeti" ? 0.86 : 0.8,
  }));
  const toolEntries: MetadataRoute.Sitemap = getLiveTools().map((tool) => ({
    url: resolveSiteUrl(tool.href),
    lastModified: staticDate,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  const articleEntries: MetadataRoute.Sitemap = articles.map((article) => ({
    url: resolveSiteUrl(article.slug),
    lastModified: parseLocalizedDateToDate(article.updatedAt ?? article.date) ?? staticDate,
    changeFrequency: "weekly",
    priority: 0.8,
  }));
  const binaGuideEntries: MetadataRoute.Sitemap = getAllBinaGuidePaths().map((slugPath) => ({
    url: resolveSiteUrl(`/kategori/bina-asamalari/${slugPath}`),
    lastModified: staticDate,
    changeFrequency: "weekly",
    priority: 0.72,
  }));

  return [
    ...staticRoutes.map((route) => ({
      url: resolveSiteUrl(route.pathname),
      lastModified: staticDate,
      changeFrequency: route.changeFrequency,
      priority: route.priority,
    })),
    ...categoryRoutes.map((route) => ({
      url: resolveSiteUrl(route.pathname),
      lastModified: staticDate,
      changeFrequency: route.changeFrequency,
      priority: route.priority,
    })),
    ...calculationEntries,
    ...toolEntries,
    ...articleEntries,
    ...binaGuideEntries,
  ];
}
