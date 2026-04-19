import { CALCULATIONS_HUB_HREF, getCalculationPages } from "@/lib/calculation-pages";
import { SITE_SECTIONS } from "@/lib/site-sections";
import { TOOLS_HUB_HREF, getLiveTools } from "@/lib/tools-data";

export interface RouteBreadcrumb {
  title: string;
  href: string;
}

export interface RouteMetadata {
  route: string;
  parentRoute: string;
  backLabel: string;
  breadcrumbs: RouteBreadcrumb[];
}

export interface BackNavigationTarget {
  href: string;
  useHistory: boolean;
}

export const LAST_INTERNAL_PATH_KEY = "muhendislik-site:last-internal-path";

const HOME_BREADCRUMB: RouteBreadcrumb = { title: "Ana Sayfa", href: "/" };
const CALCULATIONS_BREADCRUMB: RouteBreadcrumb = {
  title: "Hesaplamalar",
  href: CALCULATIONS_HUB_HREF,
};
const TOOLS_BREADCRUMB: RouteBreadcrumb = { title: "Araçlar", href: TOOLS_HUB_HREF };
const SITE_MAP_BREADCRUMB: RouteBreadcrumb = { title: "Site Haritası", href: "/konu-haritasi" };

const CALCULATION_TITLES: Record<string, string> = {
  "/hesaplamalar/insaat-maliyeti": "İnşaat Maliyeti Analizi",
  "/hesaplamalar/tahmini-insaat-alani": "Tahmini İnşaat Alanı",
  "/hesaplamalar/resmi-birim-maliyet-2026": "Resmî Birim Maliyet 2026",
};

const TOOL_TITLES: Record<string, string> = {
  "/kategori/araclar/donati-hesabi": "Donatı Hesabı",
  "/kategori/araclar/kolon-on-boyutlandirma": "Kolon Ön Boyutlandırma",
  "/kategori/araclar/kiris-kesiti": "Kiriş Kesiti",
  "/kategori/araclar/doseme-kalinligi": "Döşeme Kalınlığı",
  "/kategori/araclar/pas-payi": "Pas Payı",
  "/kategori/araclar/kalip-sokum-suresi": "Kalıp Söküm Süresi",
  "/kategori/araclar/dis-cephe-yalitim-kalinligi": "Dış Cephe Yalıtım Kalınlığı",
  "/kategori/araclar/imar-hesaplayici": "İmar Hesaplayıcı",
};

const SECTION_TITLES: Record<string, string> = {
  "/kategori/araclar": "Araçlar",
  "/kategori/bina-asamalari": "Bina Aşamaları",
  "/kategori/yapi-tasarimi": "Yapı Tasarımı",
  "/kategori/deprem-yonetmelik": "Deprem ve Yönetmelikler",
  "/kategori/geoteknik": "Geoteknik ve Zemin",
  "/kategori/santiye": "Şantiye ve Uygulama",
  "/kategori/malzeme": "Malzeme Bilgisi",
  "/kategori/surdurulebilirlik": "Sürdürülebilirlik ve Sertifikasyon",
};

const CALCULATION_PAGE_BY_HREF = new Map(
  getCalculationPages().map((page) => [page.href, page] as const)
);
const TOOL_PAGE_BY_HREF = new Map(getLiveTools().map((tool) => [tool.href, tool] as const));
const SECTION_BY_HREF = new Map(SITE_SECTIONS.map((section) => [section.href, section] as const));

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

export function resolveRouteMetadata(pathname: string): RouteMetadata | null {
  const normalizedPath = normalizePathname(pathname);

  if (normalizedPath === CALCULATIONS_HUB_HREF) {
    return {
      route: normalizedPath,
      parentRoute: "/",
      backLabel: "Ana sayfa",
      breadcrumbs: [HOME_BREADCRUMB, CALCULATIONS_BREADCRUMB],
    };
  }

  const calculationPage = CALCULATION_PAGE_BY_HREF.get(normalizedPath);
  if (calculationPage) {
    const title = CALCULATION_TITLES[calculationPage.href] ?? calculationPage.title;
    return {
      route: normalizedPath,
      parentRoute: CALCULATIONS_HUB_HREF,
      backLabel: "Hesaplamalar",
      breadcrumbs: [HOME_BREADCRUMB, CALCULATIONS_BREADCRUMB, { title, href: calculationPage.href }],
    };
  }

  if (normalizedPath === TOOLS_HUB_HREF || normalizedPath === "/araclar") {
    return {
      route: normalizedPath,
      parentRoute: "/",
      backLabel: "Ana sayfa",
      breadcrumbs: [HOME_BREADCRUMB, TOOLS_BREADCRUMB],
    };
  }

  const toolPage =
    TOOL_PAGE_BY_HREF.get(normalizedPath) ??
    TOOL_PAGE_BY_HREF.get(normalizedPath.replace(/^\/araclar\//, "/kategori/araclar/"));
  if (toolPage) {
    const title = TOOL_TITLES[toolPage.href] ?? toolPage.name;
    return {
      route: normalizedPath,
      parentRoute: TOOLS_HUB_HREF,
      backLabel: "Araçlar",
      breadcrumbs: [HOME_BREADCRUMB, TOOLS_BREADCRUMB, { title, href: toolPage.href }],
    };
  }

  if (normalizedPath.startsWith("/kategori/bina-asamalari/")) {
    const detailSlug = normalizedPath.split("/").filter(Boolean).at(-1) ?? "";

    return {
      route: normalizedPath,
      parentRoute: "/kategori/bina-asamalari",
      backLabel: "Bina Aşamaları",
      breadcrumbs: [
        HOME_BREADCRUMB,
        { title: "Bina Aşamaları", href: "/kategori/bina-asamalari" },
        { title: slugToTitle(detailSlug), href: normalizedPath },
      ],
    };
  }

  if (normalizedPath === "/kategori/bina-asamalari") {
    return {
      route: normalizedPath,
      parentRoute: "/konu-haritasi",
      backLabel: "Konu haritası",
      breadcrumbs: [HOME_BREADCRUMB, { title: "Bina Aşamaları", href: normalizedPath }],
    };
  }

  const section = SECTION_BY_HREF.get(normalizedPath);
  if (section) {
    const title = SECTION_TITLES[section.href] ?? section.title;
    return {
      route: normalizedPath,
      parentRoute: "/konu-haritasi",
      backLabel: "Konu haritası",
      breadcrumbs: [HOME_BREADCRUMB, SITE_MAP_BREADCRUMB, { title, href: section.href }],
    };
  }

  return null;
}

export function resolveBackNavigationTarget(
  pathname: string,
  previousInternalPath?: string | null
): BackNavigationTarget | null {
  const metadata = resolveRouteMetadata(pathname);

  if (!metadata) {
    return null;
  }

  const normalizedPreviousPath = previousInternalPath ? normalizePathname(previousInternalPath) : null;

  return {
    href: metadata.parentRoute,
    useHistory: Boolean(
      normalizedPreviousPath &&
        normalizedPreviousPath === metadata.parentRoute &&
        normalizedPreviousPath !== metadata.route
    ),
  };
}
