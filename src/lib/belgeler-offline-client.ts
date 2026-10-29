"use client";
import { PDFJS_BASE, PDFJS_MAIN, PDFJS_POLYFILLS, PDFJS_WORKER } from "@/lib/pdfjs-paths";

const READY_KEY = "belgeler:pwa:ready:v1"; // only anonymous installation metadata
const JOURNAL_KEY = "belgeler:pwa:preparation:v3";
const OFFLINE_VERSION = "belgeler-offline-v3";
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
       !Number.isFinite(value.updatedAt) || value.total<1) return null;
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
  const isBelgeWorker=()=>navigator.serviceWorker.controller?.scriptURL.endsWith("/belgeler-sw.js")===true;
  if(isBelgeWorker())return;
  await new Promise<void>((resolve,reject)=>{
    const timeout=window.setTimeout(()=>{
      cleanup();reject(new Error("Belgeler PWA hizmeti etkinleşmedi. Sayfayı yeniden açıp deneyin."));
    },12000);
    const interval=window.setInterval(check,250);
    function cleanup(){
      clearTimeout(timeout);clearInterval(interval);
      navigator.serviceWorker.removeEventListener("controllerchange",check);
    }
    function check(){if(isBelgeWorker()){cleanup();resolve()}}
    navigator.serviceWorker.addEventListener("controllerchange",check);
    check();
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
       stamp.scripts!==buildScriptSignature())return false;
    for(const url of ROUTES)if(!(await cachedResource(url,"page")))return false;
    for(const url of CORE)if(!(await cachedResource(url,url.endsWith(".pdf")?"pdf":"asset")))return false;
    return true;
  }catch{return false}
}
async function fetchCore(url:string):Promise<void> {
  const kind=url.endsWith(".pdf")?"pdf":"asset";
  if(await cachedResource(url,kind))return; // a fully verified previous chunk survives background termination
  const controller=new AbortController();
  const timeout=setTimeout(()=>controller.abort(),25000);
  try{
    const response=await fetch(url,{signal:controller.signal,cache:"reload"});
    if(!response.ok||response.redirected)throw new Error("Kaynak indirilemedi: "+url);
    const bytes=new Uint8Array(await response.arrayBuffer());
    if(bytes.byteLength<8)throw new Error("Boş kaynak: "+url);
    if(kind==="pdf"&&new TextDecoder().decode(bytes.slice(0,5))!=="%PDF-")
      throw new Error("PDF imzası doğrulanamadı: "+url);
    if(!(await cachedResource(url,kind)))
      throw new Error("Önbelleğe alınamadı: "+url);
  }finally{clearTimeout(timeout)}
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
  await navigator.serviceWorker.ready;
  await waitForControl();
  // An installed old worker may still control an active editor. Never mix the old cached HTML
  // with this build. User needs the existing 'Yeni sürüme geç' action to activate the waiting worker.
  const worker=navigator.serviceWorker.controller;
  if(!worker)throw new Error("PWA hizmeti henüz kontrolü almadı. Sayfayı yeniden açın.");
  const version=await new Promise<string>((resolve,reject)=>{
    const channel=new MessageChannel();
    const timer=setTimeout(()=>{channel.port1.close();reject(new Error("Servis sürümü okunamadı"))},6000);
    channel.port1.onmessage=(e:MessageEvent<{version?:string}>)=>{
      clearTimeout(timer);channel.port1.close();resolve(e.data?.version||"")
    };
    worker.postMessage({type:"GET_VERSION"},[channel.port2]);
  });
  if(version!==OFFLINE_VERSION)throw new Error("Yeni çevrimdışı sürüm bekliyor. Belgeler'de 'Yeni sürüme geç' seçeneğini kullanın.");
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
export async function clearBelgelerOfflineFiles(): Promise<void> {
  localStorage.removeItem(READY_KEY);
  localStorage.removeItem(JOURNAL_KEY);
  const names = await caches.keys();
  await Promise.all(names.filter(name => name.startsWith("belgeler-offline-")).map(name => caches.delete(name)));
  // Never delete localStorage draft keys, sharing records, or other portal assets.
}
