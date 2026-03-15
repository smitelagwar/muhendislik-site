const DEFAULT_SITE_URL = "https://your-project-name.vercel.app";

function normalizeSiteUrl(url: string) {
  return url.replace(/\/+$/, "");
}

export const SITE_NAME = "İnşa Blog";
export const SITE_DEFAULT_TITLE = `${SITE_NAME} | Mühendisler ve Mimarlar`;
export const SITE_TITLE_TEMPLATE = `%s | ${SITE_NAME}`;
export const SITE_DESCRIPTION =
  "İnşaat mühendisleri ve mimarlar için teknik bilgi, hesap araçları, saha rehberleri ve uygulamaya dönük içerikler.";
export const SITE_URL = normalizeSiteUrl(process.env.NEXT_PUBLIC_SITE_URL || DEFAULT_SITE_URL);
export const DEFAULT_OG_IMAGE_PATH = "/kalip-sokumu-hero.png";

export function isAbsoluteUrl(value: string) {
  return /^https?:\/\//i.test(value);
}

export function resolveSiteUrl(pathname = "/") {
  if (isAbsoluteUrl(pathname)) {
    return pathname;
  }

  return `${SITE_URL}${pathname.startsWith("/") ? pathname : `/${pathname}`}`;
}

export function resolveMediaUrl(src?: string | null) {
  if (!src) {
    return undefined;
  }

  return resolveSiteUrl(src);
}

export function isVercelProduction() {
  return process.env.VERCEL_ENV === "production";
}
