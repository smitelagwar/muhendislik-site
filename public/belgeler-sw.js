/* Belgeler PWA / stage 1. Scope is /belgeler, never the full portal. */
"use strict";
const VERSION = "belgeler-offline-v4";
const PAGE_CACHE = VERSION + "-pages";
const ASSET_CACHE = VERSION + "-assets";
const OFFLINE_PAGE = "/belgeler-offline.html";
const ROUTES = new Set([
  "/belgeler",
  "/belgeler/beton-dokum-tutanagi",
  "/belgeler/santiye-sefi-taahhutnamesi",
  "/belgeler/santiye-sefi-istifa-dilekcesi",
  "/belgeler/insaat-ruhsati-dilekcesi",
  "/belgeler/santiye-sefi-sozlesmesi"
]);
const PDF = /^\/belgeler\/(?:beton-dokum-tutanagi|santiye-sefi-taahhutnamesi|santiye-sefi-istifa-dilekcesi|insaat-ruhsati-dilekcesi|santiye-sefi-sozlesmesi)\.pdf$/;
const FONTS = /^\/fonts\/(?:Arial-(?:Bold|Regular)|IBMPlexSerif-(?:Bold|Regular))\.ttf$/;
const PDFJS = /^\/vendor\/pdfjs\/v[\d.]+\/(?:pdf\.min\.mjs|compat-polyfills\.mjs|worker-entry\.mjs|pdf\.worker\.min\.mjs|(?:cmaps|standard_fonts|wasm|iccs)\/[A-Za-z0-9_.-]+)$/;
const INSTALL_ASSETS = new Set([OFFLINE_PAGE, "/belgeler-pwa.webmanifest", "/icon.svg"]);
function pathOf(url) { return new URL(url).pathname.replace(/\/$/, "") || "/"; }
function allowedPage(path) { return ROUTES.has(path.replace(/\/$/, "")); }
function allowedAsset(path) {
  const nextAsset = path.startsWith("/_next/static/") &&
    !/^\/_next\/static\/chunks\/app\/(?!belgeler\/|layout-|error-|page-)/.test(path);
  return nextAsset || PDF.test(path) || FONTS.test(path) ||
    PDFJS.test(path) || INSTALL_ASSETS.has(path) ||
    /^\/belgeler-pwa-icon\/(?:180|192|512)$/.test(path);
}
function safeRequest(req) {
  const url = new URL(req.url);
  if (url.origin !== self.location.origin || req.method !== "GET" || req.headers.has("range")) return false;
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/b/") || url.pathname.startsWith("/_next/data/")) return false;
  if (req.headers.has("rsc") || req.headers.has("next-router-prefetch") ||
      req.headers.has("next-router-state-tree") || url.searchParams.has("_rsc")) return false;
  return true;
}
function cacheable(response, kind) {
  if (!response || !response.ok || response.status !== 200 || response.type === "opaque" ||
      response.redirected || response.headers.has("set-cookie")) return false;
  const cc = response.headers.get("cache-control") || "";
  if (/\b(?:private|no-store)\b/i.test(cc)) return false;
  const ct = (response.headers.get("content-type") || "").toLowerCase();
  if (kind === "page" || kind === "offline") return ct.includes("text/html");
  if (kind === "pdf") return ct.includes("pdf") || ct.includes("octet-stream");
  if (kind === "script") return ct.includes("javascript") || ct.includes("text/plain");
  return !ct.includes("text/html");
}
async function put(cacheName, key, response, kind) {
  if (!cacheable(response, kind)) return;
  if (kind === "pdf") {
    const b = await response.clone().arrayBuffer();
    const head = new TextDecoder().decode(b.slice(0, 5));
    if (head !== "%PDF-") return;
  }
  await (await caches.open(cacheName)).put(key, response.clone());
}
function keyFor(path) { return new Request(self.location.origin + path); }
async function legacyMatch(name, key) {
  // caches.open() creates the namespace: avoid recreating a deleted generation
  // just because a navigation missed the current cache.
  if (!(await caches.keys()).includes(name)) return undefined;
  return (await caches.open(name)).match(key);
}
async function pageHandler(request, path) {
  const key = keyFor(path);
  const abort = new AbortController();
  const timer = setTimeout(() => abort.abort(), 3500);
  try {
    const response = await fetch(request, { signal: abort.signal });
    clearTimeout(timer);
    if (cacheable(response, "page")) {
      await put(PAGE_CACHE, key, response, "page").catch(() => {});
      return response;
    }
    if (response.ok) return response;
  } catch (_) { clearTimeout(timer); }
  // Prefer the newly verified generation. Keep v3 as an offline-only fallback
  // during the upgrade; never let cache insertion order choose HTML versions.
  const old = await (await caches.open(PAGE_CACHE)).match(key) ||
    await legacyMatch("belgeler-offline-v3-pages", key);
  if (old) return old;
  return await caches.match(OFFLINE_PAGE) ||
    new Response("Çevrimdışı içerik henüz hazırlanmadı.", { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
async function assetHandler(request, path) {
  const key = keyFor(path);
  const old = await (await caches.open(ASSET_CACHE)).match(key) ||
    await legacyMatch("belgeler-offline-v3-assets", key);
  if (old) return old;
  const result = await fetch(request);
  const kind = PDF.test(path) ? "pdf" : /\.(?:js|mjs)$/.test(path) ? "script" : "asset";
  await put(ASSET_CACHE, key, result, kind).catch(() => {});
  return result;
}
async function testClient(event) {
  const url = new URL(event.request.url);
  if (url.origin === self.location.origin && url.searchParams.has("__belgeler_cache_test")) return true;
  if (!event.clientId) return false;
  try {
    const client = await self.clients.get(event.clientId);
    return !!client && new URL(client.url).searchParams.has("__belgeler_cache_test") &&
      allowedPage(pathOf(client.url));
  } catch (_) { return false; }
}
self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(ASSET_CACHE);
    const response = await fetch(OFFLINE_PAGE, { cache: "no-store" });
    if (!cacheable(response, "offline")) throw new Error("Offline fallback HTML could not be cached");
    await cache.put(OFFLINE_PAGE, response);
    // Deliberately do NOT skipWaiting: a live form must not be reloaded.
  })());
});
self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim()); // Older caches remain for in-flight HTML/chunks.
});
self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  const path = pathOf(request.url);
  if (url.origin !== self.location.origin || request.method !== "GET") return;
  if (request.headers.has("range") || request.headers.has("rsc") ||
      request.headers.has("next-router-prefetch") || request.headers.has("next-router-state-tree") ||
      url.searchParams.has("_rsc") || path.startsWith("/_next/data/")) return;
  // The offline self-test runs in a short-lived same-origin iframe and never talks to the network.
  event.respondWith((async () => {
    const selfTest = await testClient(event);
    if (selfTest) {
      if (request.mode === "navigate" && allowedPage(path)) {
        return await (await caches.open(request.mode === "navigate" ? PAGE_CACHE : ASSET_CACHE)).match(keyFor(path)) || Response.error();
      }
      if (allowedAsset(path)) return await caches.match(keyFor(path)) || Response.error();
      return Response.error();
    }
    if (!safeRequest(request)) return fetch(request);
    if (request.mode === "navigate" && allowedPage(path)) return pageHandler(request, path);
    if (allowedAsset(path)) return assetHandler(request, path);
    return fetch(request);
  })());
});
self.addEventListener("message", (event) => {
  if (!event.source || !event.source.url ||
      new URL(event.source.url).origin !== self.location.origin ||
      !allowedPage(pathOf(event.source.url))) return;
  const message = event.data || {};
  if (message.type === "GET_VERSION") {
    if (event.ports[0]) event.ports[0].postMessage({ version: VERSION });
  } else if (message.type === "CLEAR_OFFLINE_CACHES") {
    event.waitUntil((async () => {
      const names = await caches.keys();
      await Promise.all(names.filter((name) => name.startsWith("belgeler-offline-")).map((name) => caches.delete(name)));
      event.ports[0]?.postMessage({ ok: true });
    })());
  } else if (message.type === "ACTIVATE_UPDATE") {
    self.skipWaiting();
  }
});
