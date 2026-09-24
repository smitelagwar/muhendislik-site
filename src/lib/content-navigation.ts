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

  if (!section) {
    return {
      breadcrumbs: [
        { title: "Ana Sayfa", href: "/" },
        { title: article.title, href: `/${article.slug}` },
      ],
      backLink: {
        title: "Ana Sayfa",
        href: "/",
      },
    };
  }

  return {
    breadcrumbs: [
      { title: "Ana Sayfa", href: "/" },
      { title: section.title, href: sectionHref },
      { title: article.title, href: `/${article.slug}` },
    ],
    backLink: {
      title: section.title,
      href: sectionHref,
    },
  };
}

export function buildBinaGuideNavigation(guide: BinaGuideData): ContentNavigationContext {
  const breadcrumbs = getBinaGuideBreadcrumbs(guide.slugPath);
  const parentBreadcrumb = breadcrumbs[breadcrumbs.length - 2] ?? {
    title: "Ana Sayfa",
    href: "/",
  };

  return {
    breadcrumbs,
    backLink: {
      title: parentBreadcrumb.title,
      href: parentBreadcrumb.href,
    },
  };
}
