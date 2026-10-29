"use client";
import { PDFJS_BASE, PDFJS_MAIN, PDFJS_POLYFILLS, PDFJS_WORKER } from "@/lib/pdfjs-paths";

const READY_KEY = "belgeler:pwa:ready:v1"; // only anonymous installation metadata
const JOURNAL_KEY = "belgeler:pwa:preparation:v3";
const OFFLINE_VERSION = "belgeler-offline-v4";
const PAGE_CACHE = OFFLINE_VERSION + "-pages";
const ASSET_CACHE = OFFLINE_VERSION + "-assets";
const PREPARATION_STEPS = 5; // five raster checks, not the number of documents
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
type ReadyStamp = { version: 1; scripts: string; routes: number; checkedAt: number };
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
async function cachedResource(path:string,kind:"pdf"|"page"|"asset"):Promise<boolean> {
  if(!("caches" in window))return false;
  const cache=await caches.open(kind==="page"?PAGE_CACHE:ASSET_CACHE);
  const response=await cache.match(new URL(path,location.origin).pathname);
  if(!response || response.status!==200 || response.redirected)return false;
  const contentType=(response.headers.get("content-type")||"").toLowerCase();
  if(kind==="page"&&!contentType.includes("text/html"))return false;
  if(kind==="pdf"&&!(/pdf|octet-stream/.test(contentType)))return false;
  if(kind==="asset"&&contentType.includes("text/html"))return false;
  try{
    const body=await response.clone().arrayBuffer();
    if(body.byteLength<8)return false;
    if(kind==="pdf"&&new TextDecoder().decode(body.slice(0,5))!=="%PDF-")return false;
    return true;
  }catch{return false}
}
export async function readOfflineReady():Promise<boolean> {
  if(!validEnvironment()||!("caches" in window))return false;
  try{
    const raw=localStorage.getItem(READY_KEY);
    if(!raw)return false;
    const stamp=JSON.parse(raw) as ReadyStamp & {offlineVersion?:string};
    if(stamp.offlineVersion!==OFFLINE_VERSION || stamp.version!==1 ||
       stamp.routes!==ROUTES.length || !stamp.scripts ||
       !compatibleScriptSignatures(stamp.scripts,buildScriptSignature()))return false;
    // Every currently loaded Next chunk must be in the offline asset cache,
    // including those injected only after hydration or a normal F5.
    // Verify deterministic public HTML dependencies instead of the changing
    // script-tag list appended during hydration, F5, or Next prefetch.
    for (const url of await requiredNextAssets(false))
      if (!(await cachedResource(url, "asset"))) return false;
    for(const url of ROUTES)if(!(await cachedResource(url,"page")))return false;
    for(const url of CORE)if(!(await cachedResource(url,url.endsWith(".pdf")?"pdf":"asset")))return false;
    return true;
  }catch{return false}
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
    if (!await cachedResource(path, "asset")) {
      onProgress("Uygulama kaynakları tamamlanıyor");
      await fetchCore(path);
    }
  }
}

async function fetchCore(url:string):Promise<void> {
  const kind=url.endsWith(".pdf")?"pdf":"asset";
  if(await cachedResource(url,kind))return; // a fully verified previous chunk survives background termination
  const controller=new AbortController();
  const timeout=setTimeout(()=>controller.abort(),25000);
  try{
    const response=await fetch(url,{signal:controller.signal,cache:"reload"});
    if(!response.ok||response.redirected)throw new Error("Kaynak indirilemedi: "+url);
    const buffer=await response.arrayBuffer();
    const bytes=new Uint8Array(buffer);
    if(bytes.byteLength<8)throw new Error("Boş kaynak: "+url);
    if(kind==="pdf"&&new TextDecoder().decode(bytes.slice(0,5))!=="%PDF-")
      throw new Error("PDF imzası doğrulanamadı: "+url);
    const contentType=(response.headers.get("content-type")||"").toLowerCase();
    if(kind==="asset"&&contentType.includes("text/html"))
      throw new Error("Kaynak yerine HTML döndü: "+url);

    // Service Worker may return a valid response without successfully writing it
    // (e.g. on mobile after a background/foreground transition). Do not rely on
    // that implicit write: persist each verified, public, same-origin CORE file
    // explicitly before marking the step complete. Only this allowlisted CORE
    // loop calls fetchCore; no drafts or user-generated PDFs are stored here.
    const cache=await caches.open(ASSET_CACHE);
    const key=new URL(url,location.origin).pathname;
    if(!(await cachedResource(url,kind))){
      const headers=new Headers({
        "Content-Type":kind==="pdf"?"application/pdf":contentType||"application/octet-stream",
      });
      try{
        await cache.put(key,new Response(buffer,{status:200,headers}));
      }catch(cause){
        const quota=cause instanceof Error&&cause.name==="QuotaExceededError";
        throw new Error((quota
          ?"Cihazın çevrimdışı depolama alanı dolu: "
          :"Tarayıcı dosyayı çevrimdışı depolamaya yazamadı: ")+url);
      }
    }
    if(!(await cachedResource(url,kind)))
      throw new Error("Önbellek doğrulaması başarısız: "+url);
  }finally{clearTimeout(timeout)}
}
function renderStarted(frame: HTMLIFrameElement): boolean {
  try {
    const doc = frame.contentDocument;
    const preview = doc?.querySelector<HTMLElement>("[data-testid='belge-studio-preview-canvas']");
    const canvas = preview?.querySelector<HTMLCanvasElement>("canvas");
    // Form validation/toasts elsewhere in the studio must not invalidate a
    // successfully painted PDF. The canvas becomes visible only after commit.
    return !!canvas && canvas.width > 200 && canvas.height > 200 &&
      canvas.style.opacity === "1" && preview?.getAttribute("aria-busy") !== "true" &&
      !preview?.querySelector("[role='alert']");
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
    // Complex two-page forms can need extra time after a cold start. This is a
    // bounded validation timeout, not a false success on an unpainted canvas.
    const deadline = Date.now() + (cacheOnly ? 45000 : 35000);
    while (Date.now() < deadline) {
      if (renderStarted(frame)) return;
      await new Promise(resolve => setTimeout(resolve, 250));
    }
    throw new Error("PDF önizleme doğrulanamadı: " + path + (cacheOnly ? " (önbellek testi)" : ""));
  } finally {
    frame.remove();
  }
}
async function loadCatalog():Promise<void> {
  const frame=document.createElement("iframe");
  frame.title="Çevrimdışı katalog hazırlığı";
  frame.setAttribute("aria-hidden","true");
  frame.style.cssText="position:fixed;left:-200vw;top:0;width:800px;height:700px;opacity:0;pointer-events:none";
  try{
    await new Promise<void>((resolve,reject)=>{
      const timer=setTimeout(()=>reject(new Error("Katalog yükleme zaman aşımı")),25000);
      frame.onload=()=>{clearTimeout(timer);resolve()};
      frame.onerror=()=>{clearTimeout(timer);reject(new Error("Katalog yüklenemedi"))};
      frame.src="/belgeler?__belgeler_prepare=1";
      document.body.appendChild(frame);
    });
  }finally{frame.remove()}
}
async function runPreparation(onProgress:(p:PreparationProgress)=>void):Promise<void> {
  if(!validEnvironment())throw new Error("HTTPS veya Service Worker desteği yok.");
  if(!navigator.onLine)throw new Error("Bağlantı bekleniyor; gelince eksik dosyalardan devam edilecek.");
  const network=(navigator as Navigator & {connection?:{saveData?:boolean;effectiveType?:string}}).connection;
  if(network?.saveData||network?.effectiveType==="2g")
    throw new Error("Veri tasarrufu veya çok yavaş ağ etkin. Wi-Fi ile devam edin.");
  const registration=await registerBelgelerOffline();
  if(!registration)throw new Error("Çevrimdışı hizmet kaydedilemedi.");
  const worker = await waitForControl(registration);
  const version = await readControllerVersion(worker);
  if (version !== OFFLINE_VERSION) {
    throw new Error(registration.waiting ?
      "Yeni çevrimdışı sürüm hazır. Önce 'Yeni sürüme geç' seçeneğini kullanın." :
      "Eski çevrimdışı hizmet çalışıyor. Yeni sürüm tamamlanınca tekrar deneyin.");
  }
  const total=CORE.length+ROUTES.length+PREPARATION_STEPS+1;
  let completed=0;
  const update=(state:PreparationProgress["state"],detail:string)=>{
    saveJournal(state,completed,total);onProgress({state,detail,completed,total})
  };
  update("loading","İndirilen dosyalar kontrol ediliyor");
  for(let i=0;i<CORE.length;i++){
    const url=CORE[i];
    await fetchCore(url);
    completed++;
    update("loading","Şablonlar ve PDF kaynakları hazırlanıyor");
  }
  for(const path of ROUTES) {
    if(!await cachedResource(path,"page")){
      if(path==="/belgeler")await loadCatalog();
      else await openAndInspect(path,false);
    }
    if(!await cachedResource(path,"page"))throw new Error("Belge sayfası önbelleğe alınamadı: "+path);
    completed++;
    update("loading","Belgeler hazırlanıyor");
  }
  for(const path of ROUTES.slice(1)){
    update("verifying","PDF önizlemeleri ağ kullanmadan sınanıyor");
    try {await openAndInspect(path,true)}
    catch(err){
      if(!navigator.onLine)throw err;
      // Cached page may have been interrupted while its JS was loading. Refresh just this page.
      await (await caches.open(PAGE_CACHE)).delete(new URL(path,location.origin).pathname);
      await openAndInspect(path,false);
      await openAndInspect(path,true);
    }
    completed++;
    update("verifying","PDF çizimi doğrulandı");
  }
  await ensureNextAssets(detail => update("verifying", detail));
  completed++;
  for(const path of ROUTES)if(!await cachedResource(path,"page"))throw new Error("Eksik belge HTML: "+path);
  for(const url of CORE)if(!await cachedResource(url,url.endsWith(".pdf")?"pdf":"asset"))
    throw new Error("Eksik PDF kaynağı: "+url);
  const scripts=buildScriptSignature();
  if(!scripts)throw new Error("Next.js kaynak sürümü doğrulanamadı.");
  localStorage.setItem(READY_KEY,JSON.stringify({
    version:1,offlineVersion:OFFLINE_VERSION,scripts,routes:ROUTES.length,checkedAt:Date.now()
  }));
  if(!await readOfflineReady())throw new Error("Önbellek bütünlük kontrolü başarısız.");
  update("ready","5 belgenin çevrimdışı PDF testi başarılı. Bu cihaz hazır.");
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
