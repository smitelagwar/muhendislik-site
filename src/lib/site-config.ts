const DEFAULT_SITE_URL = "https://muhendislik-site.vercel.app";

function normalizeSiteUrl(url: string) {
  return url.replace(/\/+$/, "");
}

export const SITE_NAME = "İnşa Blog";
export const SITE_DEFAULT_TITLE = `${SITE_NAME} | Mühendis ve mimarlar için teknik portal`;
export const SITE_TITLE_TEMPLATE = `%s | ${SITE_NAME}`;
export const SITE_DESCRIPTION =
  "İnşaat mühendisleri ve mimarlar için teknik bilgi, hesap araçları, saha rehberleri ve uygulamaya dönük içerikler.";
export const SITE_URL = normalizeSiteUrl(process.env.NEXT_PUBLIC_SITE_URL || DEFAULT_SITE_URL);
export const DEFAULT_OG_IMAGE_PATH = "/opengraph-image";

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

export class PublicSiteOriginError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PublicSiteOriginError";
  }
}

function normalizePublicOrigin(value: string): string {
  const candidate = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  let origin: URL;
  try {
    origin = new URL(candidate);
  } catch {
    throw new PublicSiteOriginError("Canonical public site URL is invalid.");
  }

  if (origin.pathname !== "/" || origin.search || origin.hash) {
    throw new PublicSiteOriginError("Canonical public site URL must be an origin without a path.");
  }

  const isProduction = process.env.NODE_ENV === "production";
  const isLocalhost = origin.hostname === "localhost" || origin.hostname === "127.0.0.1";
  if (isProduction && (origin.protocol !== "https:" || isLocalhost)) {
    throw new PublicSiteOriginError("Production public site URL must use HTTPS and cannot be localhost.");
  }

  return origin.origin;
}

export function getPublicSiteOrigin(): string {
  const configuredOrigin = process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (configuredOrigin) return normalizePublicOrigin(configuredOrigin);

  if (process.env.NODE_ENV !== "production") {
    return "http://localhost:3000";
  }

  throw new PublicSiteOriginError("Production canonical public site URL is not configured.");
}

export function buildPublicShareUrl(rawToken: string): string {
  if (!/^[A-Za-z0-9_-]{32,}$/.test(rawToken)) {
    throw new PublicSiteOriginError("Share token is not URL-safe.");
  }

  return new URL(`/p/${rawToken}`, getPublicSiteOrigin()).toString();
}
