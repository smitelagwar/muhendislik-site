import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { getBelgeShareSecret } from "./config";
import type { BelgeShareEnvironment } from "./types";

export const BROWSER_ID_COOKIE_NAME = "belge_share_browser_v1";
export const BROWSER_ID_COOKIE_PATH = "/api/belgeler/paylasim";
export const BROWSER_ID_LIFETIME_SECONDS = 365 * 24 * 60 * 60;

const BROWSER_ID_VERSION = "v1";
const RENEWAL_WINDOW_SECONDS = 30 * 24 * 60 * 60;
const MAX_CLOCK_SKEW_SECONDS = 5 * 60;
const ISTANBUL_TIME_ZONE = "Europe/Istanbul";

interface ParsedBrowserCookie {
  id: string;
  issuedAtSeconds: number;
  expiresAtSeconds: number;
}

export interface BrowserIdentityScope {
  ownerHash: string;
  environmentKey: BelgeShareEnvironment;
  host: string;
}

export interface BrowserIdentityBootstrap {
  status: "existing" | "issued" | "renewed";
  cookieValue: string | null;
  expiresAt: Date | null;
}

export interface IstanbulQuotaWindow {
  quotaDay: string;
  resetAt: Date;
}

function base64Url(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString("base64url");
}

function signCookiePayload(payload: string, secret: string): string {
  return createHmac("sha256", secret)
    .update("belge-share-browser-cookie:v1\0", "utf8")
    .update(payload, "utf8")
    .digest("base64url");
}

function sealCookie(id: string, now: Date, secret: string): { value: string; expiresAt: Date } {
  const issuedAtSeconds = Math.floor(now.getTime() / 1000);
  const expiresAtSeconds = issuedAtSeconds + BROWSER_ID_LIFETIME_SECONDS;
  const payload = `${BROWSER_ID_VERSION}.${id}.${issuedAtSeconds}.${expiresAtSeconds}`;
  return {
    value: `${payload}.${signCookiePayload(payload, secret)}`,
    expiresAt: new Date(expiresAtSeconds * 1000),
  };
}

function readCookieValue(request: Request): string | null {
  const cookieHeader = request.headers.get("cookie");
  if (!cookieHeader) return null;
  const matches = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .filter((part) => part.startsWith(`${BROWSER_ID_COOKIE_NAME}=`));
  if (matches.length !== 1) return null;
  return matches[0]!.slice(BROWSER_ID_COOKIE_NAME.length + 1) || null;
}

function parseAndVerifyCookie(value: string, now: Date, secret: string): ParsedBrowserCookie | null {
  const parts = value.split(".");
  if (parts.length !== 5 || parts[0] !== BROWSER_ID_VERSION) return null;

  const [, id, issuedAtText, expiresAtText, receivedSignature] = parts;
  if (!id || !/^[A-Za-z0-9_-]{43}$/.test(id) || !receivedSignature || !/^[A-Za-z0-9_-]{43}$/.test(receivedSignature)) {
    return null;
  }
  const idBytes = Buffer.from(id, "base64url");
  if (idBytes.byteLength !== 32 || base64Url(idBytes) !== id) return null;

  const issuedAtSeconds = Number(issuedAtText);
  const expiresAtSeconds = Number(expiresAtText);
  const nowSeconds = Math.floor(now.getTime() / 1000);
  if (
    !Number.isSafeInteger(issuedAtSeconds) ||
    !Number.isSafeInteger(expiresAtSeconds) ||
    issuedAtSeconds > nowSeconds + MAX_CLOCK_SKEW_SECONDS ||
    expiresAtSeconds <= nowSeconds ||
    expiresAtSeconds <= issuedAtSeconds ||
    expiresAtSeconds - issuedAtSeconds > BROWSER_ID_LIFETIME_SECONDS
  ) {
    return null;
  }

  const payload = `${BROWSER_ID_VERSION}.${id}.${issuedAtSeconds}.${expiresAtSeconds}`;
  const expectedSignature = Buffer.from(signCookiePayload(payload, secret), "base64url");
  const actualSignature = Buffer.from(receivedSignature, "base64url");
  if (
    base64Url(actualSignature) !== receivedSignature ||
    expectedSignature.byteLength !== actualSignature.byteLength ||
    !timingSafeEqual(expectedSignature, actualSignature)
  ) {
    return null;
  }

  return { id, issuedAtSeconds, expiresAtSeconds };
}

function getRequestHost(request: Request): string | null {
  try {
    const host = new URL(request.url).hostname.toLowerCase();
    return host || null;
  } catch {
    return null;
  }
}

export function getBelgeShareEnvironmentKey(): BelgeShareEnvironment {
  const vercelEnvironment = process.env.VERCEL_ENV;
  if (vercelEnvironment === "production" || vercelEnvironment === "preview") return vercelEnvironment;
  if (vercelEnvironment === "development") return "development";
  if (process.env.VERCEL) return "preview";
  if (process.env.NODE_ENV === "production") return "production";
  if (process.env.NODE_ENV === "development") return "development";
  return "local";
}

function createOwnerHash(id: string, host: string, environmentKey: BelgeShareEnvironment, secret: string): string {
  return createHmac("sha256", secret)
    .update("belge-share-owner:v1\0", "utf8")
    .update(environmentKey, "utf8")
    .update("\0", "utf8")
    .update(host, "utf8")
    .update("\0", "utf8")
    .update(id, "utf8")
    .digest("hex");
}

function getIstanbulDateParts(date: Date): { year: number; month: number; day: number; hour: number; minute: number; second: number } {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: ISTANBUL_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const values = new Map(parts.map((part) => [part.type, part.value]));
  return {
    year: Number(values.get("year")),
    month: Number(values.get("month")),
    day: Number(values.get("day")),
    hour: Number(values.get("hour")),
    minute: Number(values.get("minute")),
    second: Number(values.get("second")),
  };
}

function getZonedMidnight(year: number, month: number, day: number): Date {
  const targetUtc = Date.UTC(year, month - 1, day, 0, 0, 0);
  let candidate = targetUtc;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const local = getIstanbulDateParts(new Date(candidate));
    const representedUtc = Date.UTC(local.year, local.month - 1, local.day, local.hour, local.minute, local.second);
    candidate += targetUtc - representedUtc;
  }
  return new Date(candidate);
}

export function getIstanbulQuotaWindow(now: Date = new Date()): IstanbulQuotaWindow {
  const local = getIstanbulDateParts(now);
  const year = String(local.year).padStart(4, "0");
  const month = String(local.month).padStart(2, "0");
  const day = String(local.day).padStart(2, "0");
  const nextDay = new Date(Date.UTC(local.year, local.month - 1, local.day + 1));
  const resetAt = getZonedMidnight(nextDay.getUTCFullYear(), nextDay.getUTCMonth() + 1, nextDay.getUTCDate());
  return { quotaDay: `${year}-${month}-${day}`, resetAt };
}

export function getBrowserIdentity(request: Request, now: Date = new Date()): BrowserIdentityScope | null {
  const cookieValue = readCookieValue(request);
  if (!cookieValue) return null;
  const host = getRequestHost(request);
  if (!host) return null;
  const secret = getBelgeShareSecret();
  const parsed = parseAndVerifyCookie(cookieValue, now, secret);
  if (!parsed) return null;
  const environmentKey = getBelgeShareEnvironmentKey();
  return {
    ownerHash: createOwnerHash(parsed.id, host, environmentKey, secret),
    environmentKey,
    host,
  };
}

export function bootstrapBrowserIdentity(request: Request, now: Date = new Date()): BrowserIdentityBootstrap {
  const host = getRequestHost(request);
  if (!host) throw new TypeError("Geçerli istek ana bilgisayarı gerekli.");
  const secret = getBelgeShareSecret();
  const cookieValue = readCookieValue(request);
  const parsed = cookieValue ? parseAndVerifyCookie(cookieValue, now, secret) : null;
  if (parsed) {
    const remainingSeconds = parsed.expiresAtSeconds - Math.floor(now.getTime() / 1000);
    if (remainingSeconds > RENEWAL_WINDOW_SECONDS) {
      return { status: "existing", cookieValue: null, expiresAt: new Date(parsed.expiresAtSeconds * 1000) };
    }
    const renewed = sealCookie(parsed.id, now, secret);
    return { status: "renewed", cookieValue: renewed.value, expiresAt: renewed.expiresAt };
  }

  const issued = sealCookie(base64Url(randomBytes(32)), now, secret);
  return { status: "issued", cookieValue: issued.value, expiresAt: issued.expiresAt };
}

export function serializeBrowserIdentityCookie(value: string, expiresAt: Date, request: Request, now: Date = new Date()): string {
  const maxAgeSeconds = Math.max(0, Math.floor((expiresAt.getTime() - now.getTime()) / 1000));
  const requestUrl = new URL(request.url);
  const host = requestUrl.hostname.toLowerCase();
  const loopbackHost = host === "localhost" || host.endsWith(".localhost") || host === "127.0.0.1" || host === "::1";
  const deployed = process.env.VERCEL_ENV === "production" || process.env.VERCEL_ENV === "preview" || (Boolean(process.env.VERCEL) && !loopbackHost);
  const secure = deployed || requestUrl.protocol === "https:" || (process.env.NODE_ENV === "production" && !loopbackHost);
  const attributes = [
    `${BROWSER_ID_COOKIE_NAME}=${value}`,
    `Path=${BROWSER_ID_COOKIE_PATH}`,
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${maxAgeSeconds}`,
    `Expires=${expiresAt.toUTCString()}`,
  ];
  if (secure) attributes.push("Secure");
  return attributes.join("; ");
}
