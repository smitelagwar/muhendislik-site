"use client";
import { PDFJS_BASE, PDFJS_MAIN, PDFJS_POLYFILLS, PDFJS_WORKER } from "@/lib/pdfjs-paths";

const READY_KEY = "belgeler:pwa:ready:v1"; // no personal information
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

export type PreparationProgress = { state: "loading" | "verifying" | "ready" | "failed"; detail: string; completed: number; total: number };
type ReadyStamp = { version: 1; scripts: string; routes: number; checkedAt: number };
function buildScriptSignature(): string {
  // Hash-addressed Next chunks change across deployments. A stale stamp can never claim new HTML is ready.
  if (typeof document === "undefined") return "";
  return [...document.querySelectorAll<HTMLScriptElement>("script[src*='/_next/static/']")]
    .map(tag => new URL(tag.src).pathname).sort().join("|");
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
async function waitForControl(): Promise<void> {
  if (navigator.serviceWorker.controller) return;
  await Promise.race([
    new Promise<void>((resolve) => {
      const handler = () => { navigator.serviceWorker.removeEventListener("controllerchange", handler); resolve(); };
      navigator.serviceWorker.addEventListener("controllerchange", handler, { once: true });
    }),
    new Promise<never>((_, reject) => setTimeout(() => reject(new Error("Çevrimdışı hizmet etkinleşmedi. Sayfayı yeniden açıp deneyin.")), 12000))
  ]);
}
async function isCached(url: string): Promise<boolean> {
  if (!("caches" in window)) return false;
  return !!(await caches.match(new URL(url, location.origin).pathname));
}
export async function readOfflineReady(): Promise<boolean> {
  if (!validEnvironment() || !("caches" in window)) return false;
  try {
    const raw = localStorage.getItem(READY_KEY);
    if (!raw) return false;
    const stamp = JSON.parse(raw) as ReadyStamp;
    if (stamp.version !== 1 || stamp.routes !== ROUTES.length ||
        !stamp.scripts || stamp.scripts !== buildScriptSignature()) return false;
    for (const url of [...ROUTES, ...CORE]) if (!(await isCached(url))) return false;
    return true;
  } catch { return false; }
}
async function fetchCore(url: string): Promise<void> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);
  try {
    const response = await fetch(url, { signal: controller.signal, cache: "reload" });
    if (!response.ok || response.redirected) throw new Error("Kaynak indirilemedi: " + url);
    const bytes = new Uint8Array(await response.arrayBuffer());
    if (bytes.length < 8) throw new Error("Boş kaynak: " + url);
    if (url.endsWith(".pdf") && new TextDecoder().decode(bytes.slice(0, 5)) !== "%PDF-") {
      throw new Error("PDF imzası doğrulanamadı: " + url);
    }
    if (!(await isCached(url))) throw new Error("Önbelleğe alınamadı: " + url);
  } finally { clearTimeout(timeout); }
}
function renderStarted(frame: HTMLIFrameElement): boolean {
  try {
    const doc = frame.contentDocument;
    const canvas = doc?.querySelector<HTMLCanvasElement>("[data-testid='belge-studio-preview-canvas'] canvas");
    return !!canvas && canvas.width > 200 && canvas.height > 200 &&
      !doc?.querySelector("[role='alert']"); // no silent success on a PDF render error
  } catch { return false; }
}
async function openAndInspect(path: string, cacheOnly: boolean): Promise<void> {
  const frame = document.createElement("iframe");
  frame.title = cacheOnly ? "Çevrimdışı PDF doğrulaması" : "Belge kaynaklarını hazırlama";
  frame.setAttribute("aria-hidden", "true");
  frame.tabIndex = -1;
  // Non-zero viewport is essential: PDF.js does not render in display:none frames.
  frame.style.cssText = "position:fixed;top:0;left:-200vw;width:1024px;height:768px;opacity:0;pointer-events:none;border:0";
  frame.src = path + (cacheOnly ? "?__belgeler_cache_test=1" : "?__belgeler_prepare=1");
  document.body.appendChild(frame);
  try {
    const deadline = Date.now() + 25000;
    while (Date.now() < deadline) {
      if (renderStarted(frame)) return;
      await new Promise(resolve => setTimeout(resolve, 250));
    }
    throw new Error("PDF önizleme doğrulanamadı: " + path + (cacheOnly ? " (önbellek testi)" : ""));
  } finally {
    frame.remove();
  }
}
export async function prepareBelgelerOffline(onProgress: (p: PreparationProgress) => void): Promise<void> {
  if (!validEnvironment()) throw new Error("Bu tarayıcıda PWA desteği kullanılamıyor. HTTPS ve güncel tarayıcı gereklidir.");
  if (!navigator.onLine) throw new Error("İlk hazırlama için internet bağlantısı gerekiyor.");
  const network = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
  if (network?.saveData || network?.effectiveType === "2g") {
    throw new Error("Veri tasarrufu veya çok yavaş ağ etkin. Wi-Fi ile tekrar deneyin.");
  }
  localStorage.removeItem(READY_KEY);
  const registration = await registerBelgelerOffline();
  if (!registration) throw new Error("Çevrimdışı hizmet kaydedilemedi.");
  await navigator.serviceWorker.ready;
  await waitForControl();
  const total = CORE.length + ROUTES.length * 2 + 1;
  let completed = 0;
  const update = (state: PreparationProgress["state"], detail: string) => onProgress({ state, detail, completed, total });
  update("loading", "PDF şablonları ve yazı tipleri indiriliyor");
  // Low-concurrency, bounded downloads; no CAD, DWG, simulation or private document assets.
  for (let i = 0; i < CORE.length; i += 2) {
    await Promise.all(CORE.slice(i, i + 2).map(fetchCore));
    completed += Math.min(2, CORE.length - i);
    update("loading", "Belgelerin ortak kaynakları hazırlanıyor");
  }
  for (const path of ROUTES) {
    // Catalog has no PDF canvas.
    if (path === "/belgeler") {
      // Cached by this controlled navigation, not via an RSC/prefetch request.
      const frame = document.createElement("iframe");
      frame.style.cssText = "position:fixed;left:-200vw;top:0;width:800px;height:700px;opacity:0;pointer-events:none";
      frame.src = path + "?__belgeler_prepare=1";
      document.body.appendChild(frame);
      try {
        await new Promise<void>((resolve, reject) => {
          const timer = setTimeout(() => reject(new Error("Katalog yükleme zaman aşımı")), 20000);
          frame.onload = () => { clearTimeout(timer); resolve(); };
          frame.onerror = () => { clearTimeout(timer); reject(new Error("Katalog yüklenemedi")); };
        });
      } finally { frame.remove(); }
    } else {
      update("loading", "PDF motoru yükleniyor: " + path.split("/").pop());
      await openAndInspect(path, false);
    }
    if (!(await isCached(path))) throw new Error("Belge HTML önbelleğe alınamadı: " + path);
    completed++;
    update("loading", "Belge sayfaları hazırlanıyor");
  }
  for (const path of ROUTES.slice(1)) {
    update("verifying", "İnternet kullanmadan PDF kontrol ediliyor");
    await openAndInspect(path, true); // Service Worker serves only cached resources to this iframe.
    completed++;
  }
  if (!(await isCached("/belgeler"))) throw new Error("Katalog çevrimdışı testine hazırlanamadı");
  completed++;
  for (const url of [...ROUTES, ...CORE]) if (!(await isCached(url))) throw new Error("Önbellek kaynağı eksik: " + url);
  const scripts = buildScriptSignature();
  if (!scripts) throw new Error("Next.js statik varlık sürümü belirlenemedi.");
  localStorage.setItem(READY_KEY, JSON.stringify({ version: 1, scripts, routes: ROUTES.length, checkedAt: Date.now() } satisfies ReadyStamp));
  if (!(await readOfflineReady())) throw new Error("Son hazırlık kontrolü başarısız oldu");
  update("ready", "5 belgenin çevrimdışı PDF testi başarılı. Bu cihaz hazır.");
}
export async function clearBelgelerOfflineFiles(): Promise<void> {
  localStorage.removeItem(READY_KEY);
  const names = await caches.keys();
  await Promise.all(names.filter(name => name.startsWith("belgeler-offline-")).map(name => caches.delete(name)));
  // Never delete localStorage draft keys, sharing records, or other portal assets.
}
