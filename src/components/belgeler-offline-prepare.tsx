"use client";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { CheckCircle2, DownloadCloud, RefreshCw, WifiOff, Smartphone, Trash2 } from "lucide-react";
import {
  prepareBelgelerOffline,
  readOfflineReady,
  clearBelgelerOfflineFiles,
  readPreparationJournal,
  pausePreparationJournal,
  type PreparationProgress,
} from "@/lib/belgeler-offline-client";

interface InstallPrompt extends Event { prompt: () => Promise<void>; userChoice: Promise<{outcome:string}> }
function subscribeSupport() { return () => {}; }
function getSupport() {
  return typeof window !== "undefined" && "serviceWorker" in navigator && "caches" in window &&
    window.isSecureContext && process.env.NODE_ENV === "production" &&
    process.env.NEXT_PUBLIC_BELGELER_OFFLINE_PWA !== "0";
}
function getServerSupport() { return false; }

/** Deliberately placed on the catalog, not in the document studio toolbar. */
export function BelgelerOfflinePrepare() {
  const available = useSyncExternalStore(subscribeSupport, getSupport, getServerSupport);
  const [ready, setReady] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<InstallPrompt | null>(null);
  const isIos = useSyncExternalStore(subscribeSupport,
    () => /iPhone|iPad|iPod/.test(navigator.userAgent), getServerSupport);
  const standalone = useSyncExternalStore(subscribeSupport,
    () => window.matchMedia("(display-mode: standalone)").matches ||
      Boolean((navigator as Navigator & {standalone?:boolean}).standalone), getServerSupport);
  const [updateWaiting, setUpdateWaiting] = useState(false);
  const [progress, setProgress] = useState<PreparationProgress | null>(null);
  const runningRef = useRef(false);
  const pendingResumeRef = useRef(false);
  const resumeAttemptRef=useRef(0);
  const [error, setError] = useState("");
  useEffect(() => {
    if (available){
      void readOfflineReady().then(setReady);
      // Resumption is invoked asynchronously after hydration, never during render.
      const journal=readPreparationJournal();
      if(journal) {
        queueMicrotask(()=>setProgress({state:"paused",detail:"Kesilen hazırlık bulundu — devam ediliyor",
          completed:journal.completed,total:journal.total}));
        queueMicrotask(()=>void window.dispatchEvent(new Event("belgeler-resume-preparation")));
      }
    }
    const recheck = () => { if (available) void readOfflineReady().then(setReady); };
    window.addEventListener("pageshow", recheck);
    const handler = (event: Event) => { event.preventDefault(); setInstallPrompt(event as InstallPrompt); };
    window.addEventListener("beforeinstallprompt", handler);
    let alive=true;
    if (!("serviceWorker" in navigator)) return () => { window.removeEventListener("pageshow",recheck); window.removeEventListener("beforeinstallprompt",handler); };
    void navigator.serviceWorker.getRegistration("/belgeler").then(reg=>{
      if(!reg||!alive)return;
      setUpdateWaiting(Boolean(reg.waiting));
      reg.addEventListener("updatefound",()=>{const incoming=reg.installing;
        incoming?.addEventListener("statechange",()=>{if(incoming.state==="installed" && navigator.serviceWorker.controller && alive)setUpdateWaiting(true)})});
    }).catch(()=>{});
    return () => {alive=false;window.removeEventListener("pageshow", recheck);
      window.removeEventListener("beforeinstallprompt",handler);};
  }, [available]);
  useEffect(()=>{
    if(!available)return;
    let scheduled:number | undefined;
    const resume=()=>{
      if(document.visibilityState!=="visible"||!navigator.onLine||runningRef.current)return;
      if(!readPreparationJournal())return;
      if(scheduled)window.clearTimeout(scheduled);
      scheduled=window.setTimeout(()=>{
        if(runningRef.current||document.visibilityState!=="visible"||!navigator.onLine)return;
        void prepare(true);
      },450);
    };
    const visibility=()=>{
      if(document.visibilityState==="hidden"){
        if(runningRef.current)pendingResumeRef.current=true;
        pausePreparationJournal(); // Does NOT abort an in-flight network request.
      }else{resume()}
    };
    document.addEventListener("visibilitychange",visibility);
    window.addEventListener("focus",resume);
    window.addEventListener("pageshow",resume);
    window.addEventListener("online",resume);
    window.addEventListener("belgeler-resume-preparation",resume);
    const early=window.setTimeout(resume,650);
    return()=>{
      window.clearTimeout(early);if(scheduled)window.clearTimeout(scheduled);
      document.removeEventListener("visibilitychange",visibility);
      window.removeEventListener("focus",resume);
      window.removeEventListener("pageshow",resume);
      window.removeEventListener("online",resume);
      window.removeEventListener("belgeler-resume-preparation",resume);
    };
  },[available]);
  if (!available) return null;
  const busy = progress?.state === "loading" || progress?.state === "verifying";
  async function prepare(auto=false) {
    if(runningRef.current)return;
    if(auto && resumeAttemptRef.current>=3)return;
    runningRef.current=true;
    if(auto)resumeAttemptRef.current++;
    else resumeAttemptRef.current=0;
    setError("");
    setReady(false);
    const journal=readPreparationJournal();
    setProgress({ state: "loading", detail: journal?"Eksik dosyalardan devam ediliyor":"Hazırlanıyor...",
      completed:journal?.completed??0, total:journal?.total??1 });
    try {
      await prepareBelgelerOffline(setProgress);
      setReady(true);
      resumeAttemptRef.current=0;
      try { await navigator.storage?.persist?.(); } catch { /* Browser may deny persistent storage. */ }
    } catch (cause) {
      const message=cause instanceof Error?cause.message:"Hazırlama duraklatıldı.";
      setError(message);
      const state=readPreparationJournal();
      setProgress({state:"paused",detail:"Duraklatıldı — internet gelince ya da uygulamaya dönünce devam edilecek",
        completed:state?.completed??0,total:state?.total??1});
      // When a pending fetch times out during background suspension, schedule a bounded
      // retry on foreground. Never loop endlessly if browser storage is unavailable.
      if(auto && resumeAttemptRef.current<3 && document.visibilityState==="visible" && navigator.onLine){
        window.setTimeout(()=>window.dispatchEvent(new Event("belgeler-resume-preparation")),
          2000*resumeAttemptRef.current);
      }
    }finally{
      runningRef.current=false;
      // If the browser suspended an active request, focus may already have fired
      // while it was in flight. Retry once it settles, using cached completed assets.
      if(pendingResumeRef.current && document.visibilityState==="visible"){
        pendingResumeRef.current=false;
        window.setTimeout(()=>window.dispatchEvent(new Event("belgeler-resume-preparation")),900);
      }
    }
  }
  return (
    <div data-testid="belgeler-offline-prepare" className="flex flex-col items-start gap-1.5">
      <button
        type="button"
        disabled={busy}
        onClick={() => void prepare(false)}
        className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-border bg-background/75 px-3 text-xs font-semibold text-foreground shadow-sm transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 disabled:cursor-wait disabled:opacity-60"
      >
        {busy ? <RefreshCw className="h-4 w-4 animate-spin" /> :
          ready ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> :
          <DownloadCloud className="h-4 w-4" />}
        {busy ? "Çevrimdışı hazırlanıyor" : ready ? "Çevrimdışı hazır" :
          progress?.state==="paused" ? "Eksik indirmeye devam et" : "Çevrimdışı kullanıma hazırla"}
      </button>
      <p role="status" aria-live="polite" className="max-w-[300px] text-[11px] leading-4 text-muted-foreground">
        {busy && progress ? progress.detail + " (" + progress.completed + "/" + progress.total + ")" :
          error ? <span className="text-amber-700 dark:text-amber-300">{error} — İndirilen dosyalar korunuyor.</span> :
          progress?.state==="paused" ? "Duraklatıldı. Geri dönünce eksik dosyalardan devam edilir." :
          ready ? "5 belge bu cihazda internet olmadan açılıp PDF olarak indirilebilir." :
          <><WifiOff className="mr-1 inline h-3 w-3" />İlk hazırlık için internet gerekir.</>}
      </p>
      <div className="flex flex-wrap gap-2">
        {!standalone && installPrompt && (
          <button type="button" className="rounded-lg border border-border px-2 py-1 text-[11px]"
            onClick={() => {void installPrompt.prompt().then(()=>installPrompt.userChoice).finally(()=>setInstallPrompt(null))}}>
            <Smartphone className="mr-1 inline h-3 w-3" /> Ana ekrana yükle
          </button>
        )}
        {isIos && !standalone && <span className="text-[11px] text-muted-foreground">iOS: Paylaş → Ana Ekrana Ekle</span>}
        {ready && <button type="button" className="inline-flex items-center rounded-lg border border-border px-2 py-1 text-[11px]"
          onClick={() => {if(!window.confirm("Yalnız çevrimdışı dosyalar silinecek. Kaydedilmiş taslaklar korunacak. Devam edilsin mi?"))return;
            void clearBelgelerOfflineFiles().then(()=>setReady(false)).catch(()=>setError("Önbellek silinemedi."))}}>
          <Trash2 className="mr-1 h-3 w-3" /> Çevrimdışı dosyaları sil
        </button>}
        {updateWaiting && <button type="button" className="rounded-lg border border-amber-500 px-2 py-1 text-[11px]"
          onClick={() => {if(!window.confirm("Yeni sürüme geçmek için sayfa yeniden açılacak. Belgeler stüdyosundaki taslağınızı kaydettiğinizden emin olun."))return;
            void navigator.serviceWorker.getRegistration("/belgeler").then(reg=>{
              if(!reg?.waiting)return;
              navigator.serviceWorker.addEventListener("controllerchange",()=>{if(sessionStorage.getItem("belgeler:pwa:updated")!=="yes"){
                sessionStorage.setItem("belgeler:pwa:updated","yes");window.location.reload();}}, {once:true});
              reg.waiting.postMessage({type:"ACTIVATE_UPDATE"});
            })}}>
          Yeni sürüme geç
        </button>}
      </div>
    </div>
  );
}
