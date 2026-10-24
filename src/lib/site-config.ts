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

function normalizeBelgeShareOrigin(value: string, environment: "production" | "preview"): string {
  const origin = normalizePublicOrigin(value);
  const parsed = new URL(origin);
  const isLocalhost = parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1";
  if (parsed.protocol !== "https:" || isLocalhost) {
    throw new PublicSiteOriginError(`${environment} belge paylaşım adresi HTTPS kullanmalıdır.`);
  }
  return origin;
}

function isBase64Url32(value: string): boolean {
  if (!/^[A-Za-z0-9_-]{43}$/.test(value)) return false;
  try {
    const normalized = value.replace(/-/g, "+").replace(/_/g, "/") + "=";
    const decoded = atob(normalized);
    const canonical = btoa(decoded).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
    return decoded.length === 32 && canonical === value;
  } catch {
    return false;
  }
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

export function buildBelgeShareUrl(rawToken: string): string {
  if (!isBase64Url32(rawToken)) {
    throw new PublicSiteOriginError("Belge share token is not URL-safe.");
  }

  return new URL(`/b/${rawToken}`, getBelgeSharePublicOrigin()).toString();
}

/**
 * Share URLs always use the canonical production host. Isolated previews must
 * opt into one exact HTTPS origin that also appears in the explicit allowlist.
 */
export function getBelgeSharePublicOrigin(): string {
  if (process.env.VERCEL_ENV === "preview") {
    // CLI ile oluşturulan her Preview benzersiz bir VERCEL_URL alır. Açık bir
    // Preview ayarı yoksa yalnız Vercel'in güvenilir sistem değişkeni aynı
    // dağıtımın tek-host canonical adresi ve allowlist'i olarak kullanılır.
    const platformPreviewOrigin = process.env.VERCEL === "1" && process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : undefined;
    const previewUrl = process.env.BELGE_SHARE_PREVIEW_URL ?? platformPreviewOrigin;
    const allowedRaw = process.env.BELGE_SHARE_PREVIEW_ORIGINS ?? platformPreviewOrigin;
    if (!previewUrl || !allowedRaw) {
      throw new PublicSiteOriginError("Belge paylaşım Preview adresi allowlist ile yapılandırılmamış.");
    }
    const previewOrigin = normalizeBelgeShareOrigin(previewUrl, "preview");
    const allowedOrigins = allowedRaw.split(",").map((value) => normalizeBelgeShareOrigin(value.trim(), "preview"));
    if (!allowedOrigins.includes(previewOrigin)) {
      throw new PublicSiteOriginError("Belge paylaşım Preview adresi allowlist içinde değil.");
    }
    const productionValue = process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_PROJECT_PRODUCTION_URL;
    if (productionValue && previewOrigin === normalizeBelgeShareOrigin(productionValue, "production")) {
      throw new PublicSiteOriginError("Preview belge paylaşım adresi production adresi olamaz.");
    }
    return previewOrigin;
  }

  const isVercelProduction = process.env.VERCEL_ENV === "production" ||
    (process.env.NODE_ENV === "production" && process.env.VERCEL === "1");
  if (isVercelProduction) {
    const canonical = process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_PROJECT_PRODUCTION_URL;
    if (!canonical) throw new PublicSiteOriginError("Production canonical belge paylaşım adresi yapılandırılmamış.");
    return normalizeBelgeShareOrigin(canonical, "production");
  }

  if (process.env.NODE_ENV === "production") {
    const canonical = process.env.NEXT_PUBLIC_SITE_URL;
    if (!canonical) throw new PublicSiteOriginError("Production canonical belge paylaşım adresi yapılandırılmamış.");
    return normalizeBelgeShareOrigin(canonical, "production");
  }

  return "http://localhost:3000";
}
