import { CALCULATIONS_HUB_HREF, getCalculationPages } from "@/lib/calculation-pages";
import { isUserVisibleSiteSection, SITE_SECTIONS } from "@/lib/site-sections";
import { TOOLS_HUB_HREF, getLiveTools } from "@/lib/tools-data";

export interface RouteBreadcrumb {
  title: string;
  href: string;
}

export type RouteFallbackBehavior = "parent" | "hub";

export interface RouteMetadata {
  route: string;
  canonicalRoute: string;
  parentRoute: string;
  hubRoute: string;
  breadcrumbLabel: string;
  backLabel: string;
  fallbackBehavior: RouteFallbackBehavior;
  breadcrumbs: RouteBreadcrumb[];
  ancestorRoutes: string[];
  aliases?: string[];
}

export interface BackNavigationTarget {
  href: string;
  useHistory: boolean;
}

export interface ResolveBackNavigationOptions {
  previousInternalPath?: string | null;
  referrer?: string | null;
}

export const LAST_INTERNAL_PATH_KEY = "muhendislik-site:last-internal-path";

const HOME_BREADCRUMB: RouteBreadcrumb = { title: "Ana Sayfa", href: "/" };
const CALCULATIONS_BREADCRUMB: RouteBreadcrumb = {
  title: "Hesaplamalar",
  href: CALCULATIONS_HUB_HREF,
};
const TOOLS_BREADCRUMB: RouteBreadcrumb = { title: "Araçlar", href: TOOLS_HUB_HREF };
const TECHNICAL_GUIDE_ROOT = "/rehber";
const BELGELER_ROUTE = "/belgeler";
const BELGELER_BREADCRUMB: RouteBreadcrumb = {
  title: "Belgeler",
  href: BELGELER_ROUTE,
};

const CALCULATION_PAGE_BY_HREF = new Map(
  getCalculationPages().map((page) => [page.href, page] as const),
);
const TOOL_PAGE_BY_HREF = new Map(getLiveTools().map((tool) => [tool.href, tool] as const));
const SECTION_BY_HREF = new Map(
  SITE_SECTIONS.filter((section) => isUserVisibleSiteSection(section.id)).map((section) => [section.href, section] as const),
);

function normalizePathname(pathname: string) {
  if (!pathname || pathname === "/") {
    return "/";
  }

  const trimmed = pathname.replace(/\/+$/, "");
  return trimmed || "/";
}

function slugToTitle(slug: string) {
  return slug
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toLocaleUpperCase("tr-TR") + part.slice(1))
    .join(" ");
}

function normalizeCandidatePath(candidate: string | null | undefined) {
  if (!candidate) {
    return null;
  }

  if (candidate.startsWith("/")) {
    return normalizePathname(candidate);
  }

  if (typeof window === "undefined") {
    return null;
  }

  try {
    const url = new URL(candidate, window.location.origin);
    if (url.origin !== window.location.origin) {
      return null;
    }

    return normalizePathname(url.pathname);
  } catch {
    return null;
  }
}

function buildMetadata({
  route,
  canonicalRoute = route,
  parentRoute,
  hubRoute = parentRoute,
  breadcrumbLabel,
  backLabel,
  fallbackBehavior = "parent",
  breadcrumbs,
  aliases,
}: {
  route: string;
  canonicalRoute?: string;
  parentRoute: string;
  hubRoute?: string;
  breadcrumbLabel: string;
  backLabel: string;
  fallbackBehavior?: RouteFallbackBehavior;
  breadcrumbs: RouteBreadcrumb[];
  aliases?: string[];
}): RouteMetadata {
  const normalizedRoute = normalizePathname(route);
  const normalizedCanonicalRoute = normalizePathname(canonicalRoute);
  const normalizedParentRoute = normalizePathname(parentRoute);
  const normalizedHubRoute = normalizePathname(hubRoute);
  const normalizedBreadcrumbs = breadcrumbs.map((item) => ({
    ...item,
    href: normalizePathname(item.href),
  }));
  const ancestorRoutes = [
    ...new Set(
      normalizedBreadcrumbs
        .slice(0, -1)
        .map((item) => item.href)
        .concat(normalizedParentRoute, normalizedHubRoute)
        .filter((href) => href !== normalizedRoute),
    ),
  ];

  return {
    route: normalizedRoute,
    canonicalRoute: normalizedCanonicalRoute,
    parentRoute: normalizedParentRoute,
    hubRoute: normalizedHubRoute,
    breadcrumbLabel,
    backLabel,
    fallbackBehavior,
    breadcrumbs: normalizedBreadcrumbs,
    ancestorRoutes,
    aliases,
  };
}

function resolveCalculationMetadata(pathname: string) {
  if (pathname === CALCULATIONS_HUB_HREF) {
    return buildMetadata({
      route: pathname,
      parentRoute: "/",
      hubRoute: CALCULATIONS_HUB_HREF,
      breadcrumbLabel: "Hesaplamalar",
      backLabel: "Ana Sayfa",
      breadcrumbs: [HOME_BREADCRUMB, CALCULATIONS_BREADCRUMB],
    });
  }

  const calculationPage = CALCULATION_PAGE_BY_HREF.get(pathname);
  if (!calculationPage) {
    return null;
  }

  return buildMetadata({
    route: pathname,
    parentRoute: CALCULATIONS_HUB_HREF,
    hubRoute: CALCULATIONS_HUB_HREF,
    breadcrumbLabel: calculationPage.title,
    backLabel: "Hesaplamalar",
    breadcrumbs: [
      HOME_BREADCRUMB,
      CALCULATIONS_BREADCRUMB,
      { title: calculationPage.title, href: calculationPage.href },
    ],
  });
}

function resolveToolMetadata(pathname: string) {
  if (pathname === TOOLS_HUB_HREF || pathname === "/araclar") {
    return buildMetadata({
      route: pathname,
      canonicalRoute: TOOLS_HUB_HREF,
      parentRoute: "/",
      hubRoute: TOOLS_HUB_HREF,
      breadcrumbLabel: "Araçlar",
      backLabel: "Ana Sayfa",
      breadcrumbs: [HOME_BREADCRUMB, TOOLS_BREADCRUMB],
      aliases: pathname === "/araclar" ? [TOOLS_HUB_HREF] : ["/araclar"],
    });
  }

  const canonicalToolPath = pathname.startsWith("/araclar/")
    ? pathname.replace(/^\/araclar\//, "/kategori/araclar/")
    : pathname;
  const toolPage = TOOL_PAGE_BY_HREF.get(canonicalToolPath);
  if (!toolPage) {
    return null;
  }

  return buildMetadata({
    route: pathname,
    canonicalRoute: toolPage.href,
    parentRoute: TOOLS_HUB_HREF,
    hubRoute: TOOLS_HUB_HREF,
    breadcrumbLabel: toolPage.name,
    backLabel: "Araçlar",
    breadcrumbs: [
      HOME_BREADCRUMB,
      TOOLS_BREADCRUMB,
      { title: toolPage.name, href: toolPage.href },
    ],
    aliases: pathname === toolPage.href ? [toolPage.href.replace(/^\/kategori/, "")] : [toolPage.href],
  });
}

function resolveTechnicalGuideMetadata(pathname: string) {
  if (!pathname.startsWith(`${TECHNICAL_GUIDE_ROOT}/`)) {
    return null;
  }

  const slugParts = pathname.slice(TECHNICAL_GUIDE_ROOT.length + 1).split("/").filter(Boolean);
  if (slugParts.length === 0) {
    return null;
  }

  const parentParts = slugParts.slice(0, -1);
  const parentRoute =
    parentParts.length > 0 ? `${TECHNICAL_GUIDE_ROOT}/${parentParts.join("/")}` : "/";
  const breadcrumbs = [
    HOME_BREADCRUMB,
    ...slugParts.map((part, index) => ({
      title: slugToTitle(part),
      href: `${TECHNICAL_GUIDE_ROOT}/${slugParts.slice(0, index + 1).join("/")}`,
    })),
  ];

  return buildMetadata({
    route: pathname,
    parentRoute,
    hubRoute: parentRoute,
    breadcrumbLabel: slugToTitle(slugParts[slugParts.length - 1] ?? "Rehber"),
    backLabel:
      parentParts.length > 0
        ? slugToTitle(parentParts[parentParts.length - 1])
        : "Ana Sayfa",
    breadcrumbs,
  });
}

function resolveSectionMetadata(pathname: string) {
  const section = SECTION_BY_HREF.get(pathname);
  if (!section) {
    return null;
  }

  return buildMetadata({
    route: pathname,
    parentRoute: "/",
    hubRoute: pathname,
    breadcrumbLabel: section.title,
    backLabel: "Ana Sayfa",
    breadcrumbs: [HOME_BREADCRUMB, { title: section.title, href: section.href }],
  });
}

function resolveBelgelerMetadata(pathname: string) {
  if (pathname === BELGELER_ROUTE) {
    return buildMetadata({
      route: pathname,
      parentRoute: "/",
      hubRoute: BELGELER_ROUTE,
      breadcrumbLabel: "Belgeler ve Şablonlar",
      backLabel: "Ana Sayfa",
      breadcrumbs: [HOME_BREADCRUMB, BELGELER_BREADCRUMB],
    });
  }
  return null;
}

export function resolveRouteMetadata(pathname: string): RouteMetadata | null {
  const normalizedPath = normalizePathname(pathname);

  if (normalizedPath === "/") {
    return null;
  }

  return (
    resolveCalculationMetadata(normalizedPath) ??
    resolveToolMetadata(normalizedPath) ??
    resolveBelgelerMetadata(normalizedPath) ??
    resolveTechnicalGuideMetadata(normalizedPath) ??
    resolveSectionMetadata(normalizedPath)
  );
}

function getSafeHistoryCandidate(metadata: RouteMetadata, options?: ResolveBackNavigationOptions) {
  const previousPath = normalizeCandidatePath(options?.previousInternalPath);
  if (previousPath && metadata.ancestorRoutes.includes(previousPath)) {
    return previousPath;
  }

  const referrerPath = normalizeCandidatePath(options?.referrer);
  if (referrerPath && metadata.ancestorRoutes.includes(referrerPath)) {
    return referrerPath;
  }

  return null;
}

export function resolveBackNavigationTarget(
  pathname: string,
  options?: ResolveBackNavigationOptions,
): BackNavigationTarget | null {
  const metadata = resolveRouteMetadata(pathname);
  if (!metadata) {
    return null;
  }

  const safeHistoryTarget = getSafeHistoryCandidate(metadata, options);
  const href =
    metadata.fallbackBehavior === "hub" ? metadata.hubRoute : metadata.parentRoute;

  return {
    href,
    useHistory: Boolean(safeHistoryTarget && safeHistoryTarget !== metadata.route),
  };
}
