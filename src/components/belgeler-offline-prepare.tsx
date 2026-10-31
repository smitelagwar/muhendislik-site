"use client";
import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import { CheckCircle2, DownloadCloud, RefreshCw, WifiOff, Smartphone, Trash2, ChevronDown, X } from "lucide-react";
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
  if (typeof window === "undefined" || !window.isSecureContext ||
    process.env.NODE_ENV !== "production" || process.env.NEXT_PUBLIC_BELGELER_OFFLINE_PWA === "0")
    return false;
  try {
    return typeof navigator.serviceWorker?.register === "function" &&
      typeof window.caches?.open === "function";
  } catch {
    return false;
  }
}
function getServerSupport() { return false; }

/** Deliberately placed on the catalog, not in the document studio toolbar. */
export function BelgelerOfflinePrepare() {
  const available = useSyncExternalStore(subscribeSupport, getSupport, getServerSupport);
  const [ready, setReady] = useState(false);
  const [checking, setChecking] = useState(true);
  const [starting, setStarting] = useState(false);
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
  const [detailsOpen, setDetailsOpen] = useState(false);
  const detailsId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const statusButtonRef = useRef<HTMLButtonElement>(null);
  const mobileButtonRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!detailsOpen) return;
    const handleOutside = (event: PointerEvent) => {
      if (event.target instanceof Node && !rootRef.current?.contains(event.target)) setDetailsOpen(false);
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setDetailsOpen(false);
        (window.matchMedia("(max-width: 639px)").matches ? mobileButtonRef.current : statusButtonRef.current)?.focus();
      }
    };
    document.addEventListener("pointerdown", handleOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("pointerdown", handleOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [detailsOpen]);
  useEffect(() => {
    let alive = true;
    let checkSerial = 0;
    let pending = false;
    const refreshState = async () => {
      if (!available || runningRef.current || pending) return;
      pending = true;
      const serial = ++checkSerial;
      try {
        const valid = await readOfflineReady();
        if (!alive || serial !== checkSerial || runningRef.current) return;
        setReady(valid);
        if (valid) {
          setProgress(null);
          setError("");
        } else {
          const journal = readPreparationJournal();
          if (journal && journal.completed > 0) {
            setProgress({ state:"paused", detail:"Eksik kaynaklar korunuyor", completed:journal.completed, total:journal.total });
            window.dispatchEvent(new Event("belgeler-resume-preparation"));
          } else {
            setProgress(null);
          }
        }
      } finally {
        pending = false;
        if (alive && serial === checkSerial) setChecking(false);
      }
    };
    if (available) void refreshState();
    else queueMicrotask(() => { if (alive) setChecking(false); });
    const recheck = () => { if (!runningRef.current) void refreshState(); };
    window.addEventListener("pageshow", recheck);
    const onStorage = (event: StorageEvent) => {
      if (event.key === "belgeler:pwa:ready:v1" || event.key === "belgeler:pwa:ready:v2" || event.key === "belgeler:pwa:preparation:v3")
        recheck();
    };
    window.addEventListener("storage", onStorage);
    const handler = (event: Event) => { event.preventDefault(); setInstallPrompt(event as InstallPrompt); };
    window.addEventListener("beforeinstallprompt", handler);
    if ("serviceWorker" in navigator) {
      void navigator.serviceWorker.getRegistration("/belgeler").then(reg => {
        if (!reg || !alive) return;
        setUpdateWaiting(Boolean(reg.waiting));
        reg.addEventListener("updatefound", () => {
          const incoming = reg.installing;
          incoming?.addEventListener("statechange", () => {
            if (incoming.state === "installed" && navigator.serviceWorker.controller && alive)
              setUpdateWaiting(true);
          });
        });
      }).catch(() => {});
    }
    return () => {
      alive = false;
      ++checkSerial;
      window.removeEventListener("pageshow", recheck);
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, [available]);
  useEffect(()=>{
    if(!available)return;
    let scheduled:number | undefined;
    const resume=()=>{
      if(checking||ready||document.visibilityState!=="visible"||!navigator.onLine||runningRef.current)return;
      const stored=readPreparationJournal();
      if(!stored || stored.completed < 1)return;
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
  },[available,checking,ready]);
  const busy = starting || progress?.state === "loading" || progress?.state === "verifying";
  async function prepare(auto=false) {
    if(runningRef.current)return;
    if(auto && resumeAttemptRef.current>=3)return;
    runningRef.current=true;
    setStarting(true);
    if(auto)resumeAttemptRef.current++;
    else resumeAttemptRef.current=0;
    setError("");
    setReady(false);
    const journal=readPreparationJournal();
    // Worker activation is not a downloaded resource. Do not show a fictitious 0/1.
    setProgress(journal && journal.completed > 0
      ? {state:"paused", detail:"Önceki dosyalar doğrulanıyor", completed:journal.completed,total:journal.total}
      : null);
    try {
      await prepareBelgelerOffline(setProgress);
      setReady(true);
      resumeAttemptRef.current=0;
      try { await navigator.storage?.persist?.(); } catch { /* Browser may deny persistent storage. */ }
    } catch (cause) {
      const message=cause instanceof Error?cause.message:"Hazırlama duraklatıldı.";
      setError(message);
      const state=readPreparationJournal();
      setProgress(state && state.completed > 0
        ? {state:"paused",detail:"İndirilen kaynaklar korundu",completed:state.completed,total:state.total}
        : null);
      // When a pending fetch times out during background suspension, schedule a bounded
      // retry on foreground. Never loop endlessly if browser storage is unavailable.
      if(auto && resumeAttemptRef.current<3 && document.visibilityState==="visible" && navigator.onLine){
        window.setTimeout(()=>window.dispatchEvent(new Event("belgeler-resume-preparation")),
          2000*resumeAttemptRef.current);
      }
    }finally{
      runningRef.current=false;
      setStarting(false);
      // If the browser suspended an active request, focus may already have fired
      // while it was in flight. Retry once it settles, using cached completed assets.
      if(pendingResumeRef.current && document.visibilityState==="visible"){
        pendingResumeRef.current=false;
        window.setTimeout(()=>window.dispatchEvent(new Event("belgeler-resume-preparation")),900);
      }
    }
  }
  return (
    <div ref={rootRef} data-testid="belgeler-offline-prepare" className="relative inline-flex max-w-full items-center">
      {/* A persistent mobile entry point, even when the in-app browser does not support PWA.
          Tap opens details; it never silently starts a large download. */}
      <button
        type="button"
        ref={mobileButtonRef}
        data-testid="belgeler-offline-mobile-trigger"
        aria-label={ready ? "Çevrimdışı belgeler hazır. Ayrıntıları aç" :
          !available ? "Çevrimdışı kullanım desteklenmiyor. Ayrıntıları aç" :
          busy ? "Çevrimdışı belgeler hazırlanıyor. Ayrıntıları aç" :
          "Çevrimdışı belgeler. Ayrıntıları aç"}
        title="Çevrimdışı belgeler"
        aria-controls={detailsId}
        aria-expanded={detailsOpen}
        onClick={() => setDetailsOpen(open => !open)}
        className={`relative inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border shadow-sm backdrop-blur-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 sm:hidden ${
          ready
            ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
            : !available
              ? "border-black/10 bg-white/70 text-muted-foreground dark:border-white/15 dark:bg-white/10"
              : error || progress?.state === "paused"
                ? "border-amber-500/35 bg-amber-500/15 text-amber-700 dark:text-amber-300"
                : "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300"
        }`}
      >
        {(checking && available) || busy
          ? <RefreshCw className="h-5 w-5 animate-spin motion-reduce:animate-none" aria-hidden="true" />
          : ready
            ? <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
            : !available || progress?.state === "paused"
              ? <WifiOff className="h-5 w-5" aria-hidden="true" />
              : <DownloadCloud className="h-5 w-5" aria-hidden="true" />}
        <span aria-hidden="true" className={`absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full ring-2 ring-background ${
          ready ? "bg-emerald-500" : error || !available ? "bg-zinc-400" : "bg-amber-500"
        }`} />
        {updateWaiting && <span aria-hidden="true" className="absolute -bottom-0.5 -left-0.5 h-2 w-2 rounded-full bg-amber-500 ring-2 ring-background" />}
      </button>
      <div className="hidden max-w-full items-center overflow-hidden rounded-xl border border-black/10 bg-white/75 shadow-sm backdrop-blur-xl dark:border-white/15 dark:bg-white/[0.07] sm:inline-flex">
        <button ref={statusButtonRef} data-testid="belgeler-offline-desktop-primary" type="button" disabled={busy || checking}
          onClick={() => !available || ready ? setDetailsOpen(open => !open) : void prepare(false)}
          className="inline-flex min-h-11 min-w-0 items-center gap-2 px-3 text-xs font-semibold text-foreground transition-colors hover:bg-black/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-amber-500 disabled:cursor-progress dark:hover:bg-white/10">
          {busy || (checking && available) ? <RefreshCw className="h-4 w-4 shrink-0 animate-spin motion-reduce:animate-none text-amber-600" /> :
            ready ? <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" /> :
            !available ? <WifiOff className="h-4 w-4 shrink-0 text-muted-foreground" /> :
            progress?.state === "paused" ? <WifiOff className="h-4 w-4 shrink-0 text-amber-600" /> :
            <DownloadCloud className="h-4 w-4 shrink-0" />}
          <span className="truncate">
            {!available ? "Çevrimdışı desteklenmiyor" : checking ? "Çevrimdışı kontrol ediliyor" : busy ? "Çevrimdışı hazırlanıyor" : ready ? "Çevrimdışı hazır" :
              progress?.state === "paused" ? "Eksik indirmeye devam et" : error ? "Yeniden dene" : "Çevrimdışı kullanıma hazırla"}
          </span>
          {busy && progress && <span aria-hidden="true" className="shrink-0 rounded-md bg-amber-500/10 px-1.5 py-0.5 tabular-nums text-[10px] text-amber-700 dark:text-amber-300">{progress.completed}/{progress.total}</span>}
        </button>
        <span aria-hidden="true" className="h-5 w-px shrink-0 bg-black/10 dark:bg-white/15" />
        <button type="button" aria-label="Çevrimdışı ayrıntılarını göster" aria-expanded={detailsOpen}
          aria-controls={detailsId} onClick={() => setDetailsOpen(open => !open)}
          className="relative inline-flex min-h-11 min-w-10 shrink-0 items-center justify-center text-muted-foreground transition-colors hover:bg-black/[0.04] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-amber-500 dark:hover:bg-white/10">
          <ChevronDown className={"h-4 w-4 transition-transform duration-200 motion-reduce:transition-none " + (detailsOpen ? "rotate-180" : "")} />
          {updateWaiting && <span title="Yeni sürüm mevcut" className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-amber-500" />}
        </button>
      </div>
      <span role="status" aria-live="polite" className="sr-only">
        {!available ? "Bu tarayıcı çevrimdışı kaydetmeyi desteklemiyor veya özellik kapalı." : checking ? "Çevrimdışı dosyalar kontrol ediliyor." : busy && progress ? progress.detail + " (" + progress.completed + "/" + progress.total + ")" :
          error ? error :
          progress?.state === "paused" ? "İndirme duraklatıldı; yeniden devam edilebilir." :
          ready ? "5 belge çevrimdışı kullanılabilir." : "Çevrimdışı hazırlama için internet gerekir."}
      </span>
      {detailsOpen && (
        <div id={detailsId} role="region" aria-label="Çevrimdışı belgeler seçenekleri"
          data-testid="belgeler-offline-details"
          className="absolute right-0 top-[calc(100%+10px)] z-[120] w-[min(320px,calc(100vw-2.5rem))] max-h-[min(70vh,420px)] overflow-y-auto rounded-2xl border border-black/10 bg-white/95 p-4 text-foreground shadow-[0_18px_60px_rgba(0,0,0,0.16)] backdrop-blur-2xl dark:border-white/15 dark:bg-zinc-900/95 ">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold">Çevrimdışı belgeler</h2>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                {!available ? "Bu tarayıcıda çevrimdışı kaydetme desteklenmiyor veya bu özellik kapalı. Sayfayı güncel Chrome ya da Safari tarayıcısında normal sekmede açmayı deneyin." :
                  ready ? "5 belge bu cihazda internet olmadan açılabilir ve PDF olarak indirilebilir." :
                  busy ? "Belgeler cihazınıza kaydediliyor." :
                  "Belgeleri internet yokken kullanmak için bir kez hazırlayın."}
              </p>
            </div>
            <button type="button" aria-label="Ayrıntıları kapat"
              onClick={() => { setDetailsOpen(false); (window.matchMedia("(max-width: 639px)").matches ? mobileButtonRef.current : statusButtonRef.current)?.focus(); }}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-muted-foreground hover:bg-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 dark:hover:bg-white/10">
              <X className="h-4 w-4" />
            </button>
          </div>
          {busy && progress && (
            <div className="mt-3 space-y-2" aria-label="İndirme ilerlemesi">
              <div className="flex justify-between gap-2 text-xs text-muted-foreground">
                <span>{progress.detail}</span>
                <span className="shrink-0 tabular-nums">{progress.completed}/{progress.total}</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-black/10 dark:bg-white/15">
                <div className="h-full rounded-full bg-amber-500 transition-[width] motion-reduce:transition-none"
                  style={{width: String(Math.min(100, Math.max(0, progress.total ? progress.completed / progress.total * 100 : 0))) + "%"}} />
              </div>
            </div>
          )}
          {error && <p role="alert" className="mt-3 rounded-lg bg-amber-500/10 p-2.5 text-xs leading-5 text-amber-800 dark:text-amber-300">{error} — İndirilen dosyalar korunuyor.</p>}
          {progress?.state === "paused" && !error && <p className="mt-3 text-xs text-amber-700 dark:text-amber-300">İndirme duraklatıldı. Eksik dosyalardan devam edilebilir.</p>}
          <div className="mt-3 flex flex-col gap-2 border-t border-black/10 pt-3 dark:border-white/10">
            {available && !ready && !busy && !checking && (
              <button type="button" onClick={() => void prepare(false)}
                className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-amber-500 px-3 text-xs font-bold text-zinc-950 hover:bg-amber-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500">
                <DownloadCloud className="h-4 w-4" />{progress?.state === "paused" ? "Eksik indirmeye devam et" : "Şimdi indir"}
              </button>
            )}
            {!standalone && installPrompt && (
              <button type="button" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-border px-3 text-xs font-medium hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                onClick={() => {void installPrompt.prompt().then(() => installPrompt.userChoice).finally(() => setInstallPrompt(null));}}>
                <Smartphone className="h-4 w-4" /> Ana ekrana yükle
              </button>
            )}
            {isIos && !standalone && <p className="text-xs leading-5 text-muted-foreground">iOS: Paylaş → Ana Ekrana Ekle</p>}
            {updateWaiting && (
              <button type="button" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-amber-500 px-3 text-xs font-semibold hover:bg-amber-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                onClick={() => {if(!window.confirm("Yeni sürüme geçmek için sayfa yeniden açılacak. Belgeler stüdyosundaki taslağınızı kaydettiğinizden emin olun."))return;
                  void navigator.serviceWorker.getRegistration("/belgeler").then(reg=>{
                    if(!reg?.waiting)return;
                    navigator.serviceWorker.addEventListener("controllerchange",()=>{if(sessionStorage.getItem("belgeler:pwa:updated")!=="yes"){
                      sessionStorage.setItem("belgeler:pwa:updated","yes");window.location.reload();}}, {once:true});
                    reg.waiting.postMessage({type:"ACTIVATE_UPDATE"});
                  });}}>
                <RefreshCw className="h-4 w-4" /> Yeni sürüme geç
              </button>
            )}
            {ready && (
              <button type="button" className="inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-xs font-medium text-muted-foreground hover:bg-red-500/10 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 dark:hover:text-red-400"
                onClick={() => {if(!window.confirm("Yalnız çevrimdışı dosyalar silinecek. Kaydedilmiş taslaklar korunacak. Devam edilsin mi?"))return;
                  void clearBelgelerOfflineFiles().then(()=>{setReady(false);setDetailsOpen(false);setProgress(null);setError("");}).catch(()=>setError("Önbellek silinemedi."));}}>
                <Trash2 className="h-4 w-4" /> Çevrimdışı dosyaları sil
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
