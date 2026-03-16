import { getArticles } from "@/lib/articles-data";
import { getAllBinaGuidePaths } from "@/lib/bina-asamalari-content";
import type { MetadataRoute } from "next";
import { resolveSiteUrl } from "@/lib/site-config";

export default function sitemap(): MetadataRoute.Sitemap {
  const articles = getArticles();
  const staticRoutes = [
    { pathname: "/", changeFrequency: "daily" as const, priority: 1 },
    { pathname: "/konu-haritasi", changeFrequency: "weekly" as const, priority: 0.7 },
    { pathname: "/kategori/araclar", changeFrequency: "weekly" as const, priority: 0.8 },
    { pathname: "/kategori/bina-asamalari", changeFrequency: "weekly" as const, priority: 0.75 },
    { pathname: "/kategori/araclar/donati-hesabi", changeFrequency: "monthly" as const, priority: 0.7 },
    { pathname: "/kategori/araclar/kolon-on-boyutlandirma", changeFrequency: "monthly" as const, priority: 0.7 },
    { pathname: "/kategori/araclar/kiris-kesiti", changeFrequency: "monthly" as const, priority: 0.7 },
    { pathname: "/kategori/araclar/doseme-kalinligi", changeFrequency: "monthly" as const, priority: 0.7 },
    { pathname: "/kategori/araclar/pas-payi", changeFrequency: "monthly" as const, priority: 0.7 },
    { pathname: "/kategori/araclar/dis-cephe-yalitim-kalinligi", changeFrequency: "monthly" as const, priority: 0.7 },
    { pathname: "/kategori/araclar/imar-hesaplayici", changeFrequency: "monthly" as const, priority: 0.7 },
    { pathname: "/kategori/araclar/kalip-sokum-suresi", changeFrequency: "monthly" as const, priority: 0.7 },
    { pathname: "/hakkimizda", changeFrequency: "monthly" as const, priority: 0.5 },
    { pathname: "/iletisim", changeFrequency: "monthly" as const, priority: 0.5 },
    { pathname: "/gizlilik", changeFrequency: "monthly" as const, priority: 0.4 },
    { pathname: "/kullanim-kosullari", changeFrequency: "monthly" as const, priority: 0.4 },
  ];

  const articleEntries: MetadataRoute.Sitemap = Object.keys(articles).map((slug) => ({
    url: resolveSiteUrl(slug),
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.8,
  }));
  const binaGuideEntries: MetadataRoute.Sitemap = getAllBinaGuidePaths().map((slugPath) => ({
    url: resolveSiteUrl(`/kategori/bina-asamalari/${slugPath}`),
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.72,
  }));

  return [
    ...staticRoutes.map((route) => ({
      url: resolveSiteUrl(route.pathname),
      lastModified: new Date(),
      changeFrequency: route.changeFrequency,
      priority: route.priority,
    })),
    ...articleEntries,
    ...binaGuideEntries,
  ];
}
