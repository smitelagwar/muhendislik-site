"use client";
import { PDFJS_BASE, PDFJS_MAIN, PDFJS_POLYFILLS, PDFJS_WORKER } from "@/lib/pdfjs-paths";

const READY_KEY = "belgeler:pwa:ready:v2"; // anonymous verified package metadata
const JOURNAL_KEY = "belgeler:pwa:preparation:v3";
const OFFLINE_VERSION = "belgeler-offline-v5";
const PAGE_CACHE = OFFLINE_VERSION + "-pages";
const ASSET_CACHE = OFFLINE_VERSION + "-assets";
const META_CACHE = OFFLINE_VERSION + "-meta";
const READY_MARKER = "/belgeler-offline-v5-ready";
let activePreparation: Promise<void> | null = null;
export type PreparationJournal = {
  version: 3; status: "loading"|"verifying"|"paused";
  completed: number; total: number; updatedAt: number; scripts: string;
};
export function readPreparationJournal(): PreparationJournal | null {
  try {
    const raw=localStorage.getItem(JOURNAL_KEY);
    if(!raw)return null;
    const value=JSON.parse(raw) as PreparationJournal;
    if(value.version!==3 || typeof value.scripts!=="string" ||
       !Number.isFinite(value.updatedAt) || value.total<1 ||
       value.completed < 0 || value.completed > value.total ||
       !compatibleScriptSignatures(value.scripts,buildScriptSignature())) return null;
    return value;
  }catch{return null}
}
function saveJournal(state: PreparationProgress["state"], completed:number,total:number) {
  if(state==="ready"){localStorage.removeItem(JOURNAL_KEY);return}
  if(state==="failed")state="paused";
  try {localStorage.setItem(JOURNAL_KEY,JSON.stringify({
    version:3,status:state,completed,total,updatedAt:Date.now(),scripts:buildScriptSignature()
  } satisfies PreparationJournal))}catch{/* storage denied: cache is still authoritative */}
}
export function pausePreparationJournal():void {
  const item=readPreparationJournal();
  if(item)saveJournal("paused",item.completed,item.total);
}

const ROUTES = [
  "/belgeler",
  "/belgeler/beton-dokum-tutanagi",
  "/belgeler/santiye-sefi-taahhutnamesi",
  "/belgeler/santiye-sefi-istifa-dilekcesi",
  "/belgeler/insaat-ruhsati-dilekcesi",
  "/belgeler/santiye-sefi-sozlesmesi",
] as const;
const PDF_PATHS = ROUTES.slice(1).map(path => path + ".pdf");
const CORE = [
  ...PDF_PATHS,
  "/fonts/Arial-Bold.ttf", "/fonts/Arial-Regular.ttf",
  "/fonts/IBMPlexSerif-Bold.ttf", "/fonts/IBMPlexSerif-Regular.ttf",
  PDFJS_MAIN, PDFJS_POLYFILLS, PDFJS_WORKER, PDFJS_BASE + "/pdf.worker.min.mjs",
] as const;

export type PreparationProgress = { state: "loading" | "verifying" | "paused" | "ready" | "failed"; detail: string; completed: number; total: number };
type ReadyStamp = { version: 2; offlineVersion: string; manifestKey: string; buildAnchor: string; assets: string[]; routes: number; checkedAt: number };
function buildScriptSignature(): string {
  // Hash-addressed Next chunks change across deployments. A stale stamp can never claim new HTML is ready.
  if (typeof document === "undefined") return "";
  return [...document.querySelectorAll<HTMLScriptElement>("script[src*='/_next/static/']")]
    .map(tag => new URL(tag.src).pathname).sort().join("|");
}
/** Next.js can append additional script tags after hydration. The same build
 * therefore has a different script *list* before/after F5. Strict equality
 * produces a false "not ready". Preserve mismatched-build protection while
 * permitting an ordered-in-time subset of the same hash-named chunks.
 */
function compatibleScriptSignatures(saved: string, current: string): boolean {
  const first = saved.split("|").filter(Boolean);
  const second = current.split("|").filter(Boolean);
  if (!first.length || !second.length) return false;
  const a = new Set(first), b = new Set(second);
  return first.every(item => b.has(item)) || second.every(item => a.has(item));
}
function validEnvironment(): boolean {
  return typeof window !== "undefined" && ("serviceWorker" in navigator) &&
    window.isSecureContext && process.env.NODE_ENV === "production" &&
    process.env.NEXT_PUBLIC_BELGELER_OFFLINE_PWA !== "0";
}
export async function registerBelgelerOffline(): Promise<ServiceWorkerRegistration | null> {
  if (!validEnvironment()) return null;
  return navigator.serviceWorker.register("/belgeler-sw.js", { scope: "/belgeler", updateViaCache: "none" });
}
/** Match the *specific* Belgeler registration, not navigator.serviceWorker.ready:
 * ready can resolve to the separate root homepage registration.
 * Listeners are installed before the first check to avoid lost activation events.
 */
async function waitForControl(registration: ServiceWorkerRegistration): Promise<ServiceWorker> {
  const expectedScope = new URL("/belgeler", location.origin).href;
  if (registration.scope !== expectedScope && registration.scope !== expectedScope + "/")
    throw new Error("Belgeler hizmetinin kapsamı beklenenden farklı.");
  const current = () => {
    const active = registration.active;
    const controller = navigator.serviceWorker.controller;
    return active?.state === "activated" && controller?.scriptURL === active.scriptURL &&
      controller.scriptURL.endsWith("/belgeler-sw.js") ? controller : null;
  };
  const immediate = current();
  if (immediate) return immediate;
  return new Promise<ServiceWorker>((resolve, reject) => {
    let completed = false;
    const installed = new Set<ServiceWorker>();
    const timeout = window.setTimeout(() => finish(new Error(
      registration.waiting ? "Yeni çevrimdışı sürüm hazır. Önce 'Yeni sürüme geç' seçeneğini kullanın." :
      "Belgeler hizmeti henüz sayfanın kontrolünü alamadı. İndirme başlamadı; yeniden deneyebilirsiniz."
    )), 18000);
    const onState = () => { const found = current(); if (found) finish(undefined, found); };
    const onUpdate = () => { bind(registration.installing); onState(); };
    function bind(worker: ServiceWorker | null) {
      if (!worker || installed.has(worker)) return;
      installed.add(worker);
      worker.addEventListener("statechange", onState);
    }
    function finish(error?: Error, worker?: ServiceWorker) {
      if (completed) return;
      completed = true;
      clearTimeout(timeout);
      navigator.serviceWorker.removeEventListener("controllerchange", onState);
      registration.removeEventListener("updatefound", onUpdate);
      for (const item of installed) item.removeEventListener("statechange", onState);
      if (error) reject(error);
      else resolve(worker!);
    }
    navigator.serviceWorker.addEventListener("controllerchange", onState);
    registration.addEventListener("updatefound", onUpdate);
    bind(registration.installing);
    bind(registration.waiting);
    bind(registration.active);
    onState();
  });
}
async function readControllerVersion(worker: ServiceWorker): Promise<string> {
  return await new Promise<string>((resolve, reject) => {
    const channel = new MessageChannel();
    const timer = window.setTimeout(() => {
      channel.port1.close();
      channel.port2.close();
      reject(new Error("Çevrimdışı hizmet sürümü yanıt vermedi."));
    }, 6000);
    channel.port1.onmessage = (event: MessageEvent<{version?: string}>) => {
      window.clearTimeout(timer);
      channel.port1.close();
      channel.port2.close();
      resolve(event.data?.version || "");
    };
    try { worker.postMessage({type:"GET_VERSION"}, [channel.port2]); }
    catch (error) {
      window.clearTimeout(timer);
      channel.port1.close(); channel.port2.close();
      reject(error);
    }
  });
}
type ResourceKind = "pdf" | "page" | "asset";
async function cachedResource(path: string, kind: ResourceKind, deep = false): Promise<boolean> {
  if (!("caches" in window)) return false;
  const cache = await caches.open(kind === "page" ? PAGE_CACHE : ASSET_CACHE);
  const response = await cache.match(new URL(path, location.origin).pathname);
  if (!response || response.status !== 200 || response.redirected) return false;
  const ct = (response.headers.get("content-type") || "").toLowerCase();
  if (kind === "page" && !ct.includes("text/html")) return false;
  if (kind === "pdf" && !/pdf|octet-stream/.test(ct)) return false;
  if (kind === "asset" && ct.includes("text/html")) return false;
  if (!deep) return true; // Never load every PDF/Next chunk into RAM on F5.
  try {
    const bytes = await response.arrayBuffer();
    if (bytes.byteLength < 8) return false;
    if (kind === "pdf" && new TextDecoder().decode(bytes.slice(0, 5)) !== "%PDF-") return false;
    if (kind === "page" && !new TextDecoder().decode(bytes.slice(0, 1024)).includes("<html")) return false;
    return true;
  } catch { return false; }
}

/** Only stable webpack/app-shell chunks identify the live build. No mutable DOM subset test. */
function buildAnchor(): string {
  const scripts = buildScriptSignature().split("|").filter(Boolean);
  const stable = scripts.filter(path =>
    /\/_next\/static\/chunks\/(?:main-app|webpack|app\/layout-|app\/belgeler\/page-)/.test(path));
  return stable.join("|") || scripts.find(path => /\/_next\/static\/chunks\//.test(path)) || "";
}
function manifestHash(value: string): string {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i++) hash = Math.imul(hash ^ value.charCodeAt(i), 16777619);
  return (hash >>> 0).toString(16).padStart(8, "0");
}
export async function readOfflineReady(): Promise<boolean> {
  if (!validEnvironment() || !("caches" in window)) return false;
  try {
    const raw = localStorage.getItem(READY_KEY);
    if (!raw) return false;
    const stamp = JSON.parse(raw) as ReadyStamp;
    const anchor = buildAnchor();
    if (stamp.version !== 2 || stamp.offlineVersion !== OFFLINE_VERSION ||
        stamp.routes !== ROUTES.length || !stamp.manifestKey ||
        !stamp.buildAnchor || !anchor || stamp.buildAnchor !== anchor ||
        !Array.isArray(stamp.assets) || !stamp.assets.length) return false;
    const marker = await (await caches.open(META_CACHE)).match(READY_MARKER);
    if (!marker || !marker.ok || (await marker.text()) !== stamp.manifestKey) return false;
    const expectedKey = manifestHash([OFFLINE_VERSION, stamp.buildAnchor,
      ...ROUTES, ...stamp.assets].join("|"));
    if (expectedKey !== stamp.manifestKey) return false;
    // Lightweight existence/type checks. Every entry was deeply verified on insertion.
    for (const url of ROUTES) if (!(await cachedResource(url, "page"))) return false;
    for (const url of stamp.assets)
      if (!(await cachedResource(url, url.endsWith(".pdf") ? "pdf" : "asset"))) return false;
    return true;
  } catch { return false; }
}

/** Gather public build assets required by the six cached HTML documents.
 * Modern Next.js may inject or preload chunks asynchronously, so the initial
 * catalog's script tags alone cannot represent the full offline build.
 */
async function requiredNextAssets(includeCurrentScripts = true): Promise<string[]> {
  // DOM scripts change on every Next hydration. Only cached HTML is the stable
  // offline contract; include live scripts when warming, never as an F5 gate.
  const paths = new Set(includeCurrentScripts ? buildScriptSignature().split("|").filter(Boolean) : []);
  const cache = await caches.open(PAGE_CACHE);
  for (const route of ROUTES) {
    const response = await cache.match(new URL(route, location.origin).pathname);
    if (!response) continue;
    const doc = new DOMParser().parseFromString(await response.text(), "text/html");
    for (const node of doc.querySelectorAll<HTMLScriptElement | HTMLLinkElement>("script[src], link[href]")) {
      const source = node.getAttribute("src") || node.getAttribute("href");
      if (!source) continue;
      try {
        const uri = new URL(source, location.origin);
        if (uri.origin === location.origin && uri.pathname.startsWith("/_next/static/"))
          paths.add(uri.pathname);
      } catch { /* malformed reference is not a cache target */ }
    }
  }
  return [...paths].filter(path => path.startsWith("/_next/static/")).sort();
}
async function ensureNextAssets(onProgress:(detail:string)=>void): Promise<void> {
  const paths = await requiredNextAssets();
  for (const path of paths) {
    if (!await cachedResource(path, "asset", true)) {
      onProgress("Uygulama kaynakları tamamlanıyor");
      await fetchCore(path);
    }
  }
}

class PreparationError extends Error {
  constructor(readonly code: string, readonly url: string, message: string) {
    super(message + ": " + url);
    this.name = "PreparationError";
  }
}
async function downloadResource(url: string, kind: ResourceKind): Promise<void> {
  const cacheName = kind === "page" ? PAGE_CACHE : ASSET_CACHE;
  const key = new URL(url, location.origin).pathname;
  // A preparation-only query bypasses the SW's legacy cache and never stores RSC.
  const target = new URL(url, location.origin);
  target.searchParams.set("__belgeler_prepare", "1");
  let last: Error = new Error("Kaynak indirilemedi: " + key);
  for (let attempt = 0; attempt < 3; attempt++) {
    if (!navigator.onLine) throw new PreparationError("OFFLINE", key, "İnternet bağlantısı bekleniyor");
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 35000);
    try {
      const response = await fetch(target.href, {
        signal: controller.signal, cache: "reload", credentials: "omit",
        headers: kind === "page" ? { Accept: "text/html" } : undefined,
      });
      if (response.redirected || response.status !== 200) {
        const code = response.redirected ? "REDIRECT" : "HTTP_" + response.status;
        throw new PreparationError(code, key, "Sunucu geçerli kaynak döndürmedi");
      }
      const cc = response.headers.get("cache-control") || "";
      if (/\b(?:private|no-store)\b/i.test(cc) || response.headers.has("set-cookie"))
        throw new PreparationError("PRIVATE", key, "Özel içerik çevrimdışı kaydedilemez");
      const ct = (response.headers.get("content-type") || "").toLowerCase();
      if ((kind === "page" && !ct.includes("text/html")) ||
          (kind === "pdf" && !/pdf|octet-stream/.test(ct)) ||
          (kind === "asset" && ct.includes("text/html")))
        throw new PreparationError("MIME", key, "Yanlış dosya türü");
      const buffer = await response.arrayBuffer();
      if (buffer.byteLength < 8) throw new PreparationError("EMPTY", key, "Boş kaynak");
      if (kind === "pdf" && new TextDecoder().decode(buffer.slice(0, 5)) !== "%PDF-")
        throw new PreparationError("PDF", key, "PDF imzası geçersiz");
      if (kind === "page") {
        const html = new TextDecoder().decode(buffer);
        if (!/<html\b/i.test(html) || !html.includes("/_next/static/"))
          throw new PreparationError("HTML", key, "Belge HTML içeriği eksik");
      }
      const cache = await caches.open(cacheName);
      try {
        await cache.put(key, new Response(buffer, {
          status: 200,
          headers: { "Content-Type": kind === "pdf" ? "application/pdf" :
            kind === "page" ? "text/html; charset=utf-8" : ct || "application/octet-stream" },
        }));
      } catch (cause) {
        const quota = cause instanceof Error && cause.name === "QuotaExceededError";
        throw new PreparationError(quota ? "QUOTA" : "STORAGE", key,
          quota ? "Cihazda çevrimdışı depolama alanı dolu" : "Tarayıcı kaydı tamamlayamadı");
      }
      if (!(await cachedResource(url, kind, true)))
        throw new PreparationError("CORRUPT", key, "Kaydedilen kaynak doğrulanamadı");
      return;
    } catch (cause) {
      const error = cause instanceof Error ? cause : new Error(String(cause));
      last = error.name === "AbortError" ?
        new PreparationError("TIMEOUT", key, "Bağlantı zaman aşımına uğradı") : error;
      const code = last instanceof PreparationError ? last.code : "NETWORK";
      if (["QUOTA", "STORAGE", "PRIVATE", "REDIRECT", "MIME", "PDF", "HTML", "EMPTY", "CORRUPT"].includes(code) ||
          /^HTTP_4(?!08|29)/.test(code) || attempt === 2) break;
      await new Promise(resolve => window.setTimeout(resolve, 700 * (attempt + 1)));
    } finally { window.clearTimeout(timer); }
  }
  throw last;
}
async function fetchCore(url: string, reuseCached = true): Promise<void> {
  const kind: ResourceKind = url.endsWith(".pdf") ? "pdf" : "asset";
  if (reuseCached && await cachedResource(url, kind, true)) return;
  await downloadResource(url, kind);
}
async function fetchPage(path: string, reuseCached: boolean): Promise<void> {
  if (reuseCached && await cachedResource(path, "page", true)) return;
  await downloadResource(path, "page");
}


async function runPreparation(onProgress: (p: PreparationProgress) => void): Promise<void> {
  if (!validEnvironment()) throw new Error("HTTPS veya Service Worker desteği yok.");
  if (!navigator.onLine) throw new Error("Bağlantı bekleniyor; gelince eksik dosyalardan devam edilecek.");
  const network = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
  if (network?.saveData || network?.effectiveType === "2g")
    throw new Error("Veri tasarrufu veya çok yavaş ağ etkin. Wi-Fi ile devam edin.");
  const previousJournal = readPreparationJournal();
  const previousStamp = (() => {
    try { return JSON.parse(localStorage.getItem(READY_KEY) || "null") as ReadyStamp | null; }
    catch { return null; }
  })();
  const anchor = buildAnchor();
  if (!anchor) throw new Error("Next.js uygulama sürümü henüz belirlenemedi. Sayfayı yenileyip tekrar deneyin.");
  const reuseCached = !!previousJournal || previousStamp?.buildAnchor === anchor;
  // Core resources are individually verified by content before being skipped.
  // A partial journal can be lost during a mobile F5; its valid v5 bytes survive.
  const registration = await registerBelgelerOffline();
  if (!registration) throw new Error("Çevrimdışı hizmet kaydedilemedi.");
  const worker = await waitForControl(registration);
  const version = await readControllerVersion(worker);
  if (version !== OFFLINE_VERSION) {
    throw new Error(registration.waiting ?
      "Yeni çevrimdışı sürüm hazır. Önce 'Yeni sürüme geç' seçeneğini kullanın." :
      "Eski çevrimdışı hizmet çalışıyor. Yeni sürüm tamamlanınca tekrar deneyin.");
  }
  const total = CORE.length + ROUTES.length + 1;
  let completed = 0;
  const update = (state: PreparationProgress["state"], detail: string) => {
    saveJournal(state, completed, total);
    onProgress({ state, detail, completed, total });
  };
  update("loading", "PDF kaynakları hazırlanıyor");
  for (const url of CORE) {
    await fetchCore(url, true);
    completed++;
    update("loading", "Şablonlar ve PDF kaynakları hazırlanıyor");
  }
  // First page after 13/20: explicit public HTML fetch, no hidden 1024x768 iframe.
  for (const path of ROUTES) {
    update("loading", "Belge HTML sayfaları hazırlanıyor");
    await fetchPage(path, reuseCached);
    completed++;
    update("loading", "Belge sayfaları kaydedildi");
  }
  update("verifying", "Uygulama dosyaları tamamlanıyor");
  await ensureNextAssets(detail => update("verifying", detail));
  completed++;
  const assets = [...new Set([...CORE, ...await requiredNextAssets()])].sort();
  for (const path of ROUTES)
    if (!(await cachedResource(path, "page", true)))
      throw new Error("Kaydedilen belge HTML eksik: " + path);
  for (const url of assets)
    if (!(await cachedResource(url, url.endsWith(".pdf") ? "pdf" : "asset")))
      throw new Error("Kaydedilen kaynak eksik: " + url);
  const manifestKey = manifestHash([OFFLINE_VERSION, anchor, ...ROUTES, ...assets].join("|"));
  const stamp: ReadyStamp = {
    version: 2, offlineVersion: OFFLINE_VERSION, manifestKey, buildAnchor: anchor,
    assets, routes: ROUTES.length, checkedAt: Date.now(),
  };
  try {
    // The marker is the last durable write: the SW ignores partial v5 resources.
    localStorage.setItem(READY_KEY, JSON.stringify(stamp));
    await (await caches.open(META_CACHE)).put(READY_MARKER, new Response(manifestKey, {
      headers: { "Content-Type": "text/plain" },
    }));
    if (!await readOfflineReady()) throw new Error("Önbellek bütünlük kontrolü başarısız.");
  } catch (cause) {
    localStorage.removeItem(READY_KEY);
    await (await caches.open(META_CACHE)).delete(READY_MARKER);
    throw cause;
  }
  update("ready", "5 belge kaydedildi. Tam çevrimdışı PDF testi yayın öncesi E2E'de yapılacaktır.");
}

export async function prepareBelgelerOffline(onProgress:(p:PreparationProgress)=>void):Promise<void> {
  if(activePreparation)return activePreparation;
  const perform=async()=>{
    const locks=(navigator as Navigator & {locks?:LockManager}).locks;
    if(locks){
      await locks.request("belgeler-offline-prepare",{ifAvailable:true},async lock=>{
        if(!lock)throw new Error("Başka sekmede hazırlanıyor. Bu sekmeye dönün veya biraz sonra devam edin.");
        await runPreparation(onProgress)
      });
    }else{
      // Fallback for engines without Web Locks. Expiring best-effort tab lease;
      // cache verification is idempotent even if two tabs race.
      const key="belgeler:pwa:lock";
      const token=String(Date.now())+":"+Math.random().toString(36).slice(2);
      const previous=localStorage.getItem(key);
      if(previous){
        try{
          const data=JSON.parse(previous) as {until:number};
          if(data.until>Date.now())throw new Error("Başka sekmede hazırlık sürüyor.");
        }catch(e){if(e instanceof Error&&e.message.includes("Başka sekmede"))throw e}
      }
      localStorage.setItem(key,JSON.stringify({token,until:Date.now()+120_000}));
      const refresh=window.setInterval(()=>{try{localStorage.setItem(key,JSON.stringify({token,until:Date.now()+120_000}))}catch{}},8000);
      try{await runPreparation(onProgress)}finally{
        clearInterval(refresh);
        try{if(JSON.parse(localStorage.getItem(key)||"{}").token===token)localStorage.removeItem(key)}catch{}
      }
    }
  };
  activePreparation=perform().finally(()=>{activePreparation=null});
  return activePreparation;
}
/** Clear and preparation share the same Web Lock across tabs. No unrelated drafts,
 * queue or root-home cache is touched. The previous offline generation is also
 * explicitly removed only when the user requests deletion.
 */
export async function clearBelgelerOfflineFiles(): Promise<void> {
  const clear = async () => {
    localStorage.removeItem(READY_KEY);
    localStorage.removeItem("belgeler:pwa:ready:v1");
    localStorage.removeItem(JOURNAL_KEY);
    const names = await caches.keys();
    const targets = names.filter(name => name.startsWith("belgeler-offline-"));
    for (const name of targets) {
      if (!await caches.delete(name)) throw new Error("Önbellek temizlenemedi: " + name);
    }
    const remaining = (await caches.keys()).filter(name => name.startsWith("belgeler-offline-"));
    if (remaining.length) throw new Error("Bazı çevrimdışı dosyalar silinemedi.");
  };
  const locks = (navigator as Navigator & {locks?: LockManager}).locks;
  if (locks) await locks.request("belgeler-offline-prepare", clear);
  else if (activePreparation) {
    await activePreparation.catch(() => {});
    await clear();
  } else await clear();
}
