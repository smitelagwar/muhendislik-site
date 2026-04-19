import { getBinaGuideBreadcrumbs } from "@/lib/bina-asamalari-content";
import type { BinaGuideData } from "@/lib/bina-asamalari-content/types";
import type { ArticleData } from "@/lib/articles-data";
import {
  getSiteSectionForArticle,
  getSiteSectionHrefForArticle,
} from "@/lib/site-sections";
import type { RouteBreadcrumb } from "@/lib/route-metadata";

export interface ContentNavigationContext {
  breadcrumbs: RouteBreadcrumb[];
  backLink: {
    title: string;
    href: string;
  };
}

export function buildArticleNavigation(article: ArticleData): ContentNavigationContext {
  const section = getSiteSectionForArticle(article);
  const sectionHref = getSiteSectionHrefForArticle(article);
  const sectionTitle = section?.title ?? "Konu Haritası";

  return {
    breadcrumbs: [
      { title: "Ana Sayfa", href: "/" },
      { title: sectionTitle, href: sectionHref },
      { title: article.title, href: `/${article.slug}` },
    ],
    backLink: {
      title: sectionTitle,
      href: sectionHref,
    },
  };
}

export function buildBinaGuideNavigation(guide: BinaGuideData): ContentNavigationContext {
  const breadcrumbs = getBinaGuideBreadcrumbs(guide.slugPath);
  const parentBreadcrumb = breadcrumbs[breadcrumbs.length - 2] ?? {
    title: "Bina Aşamaları",
    href: "/kategori/bina-asamalari",
  };

  return {
    breadcrumbs,
    backLink: {
      title: parentBreadcrumb.title,
      href: parentBreadcrumb.href,
    },
  };
}
