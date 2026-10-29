"use client";
import { useEffect, useState, useSyncExternalStore } from "react";
import { CheckCircle2, DownloadCloud, RefreshCw, WifiOff, Smartphone, Trash2 } from "lucide-react";
import {
  prepareBelgelerOffline,
  readOfflineReady,
  clearBelgelerOfflineFiles,
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
  const [error, setError] = useState("");
  useEffect(() => {
    if (available) void readOfflineReady().then(setReady);
    const recheck = () => { if (available) void readOfflineReady().then(setReady); };
    window.addEventListener("pageshow", recheck);
    const handler = (event: Event) => { event.preventDefault(); setInstallPrompt(event as InstallPrompt); };
    window.addEventListener("beforeinstallprompt", handler);
    let alive=true;
    void navigator.serviceWorker.getRegistration("/belgeler").then(reg=>{
      if(!reg||!alive)return;
      setUpdateWaiting(Boolean(reg.waiting));
      reg.addEventListener("updatefound",()=>{const incoming=reg.installing;
        incoming?.addEventListener("statechange",()=>{if(incoming.state==="installed" && navigator.serviceWorker.controller && alive)setUpdateWaiting(true)})});
    }).catch(()=>{});
    return () => {alive=false;window.removeEventListener("pageshow", recheck);
      window.removeEventListener("beforeinstallprompt",handler);};
  }, [available]);
  if (!available) return null;
  const busy = progress?.state === "loading" || progress?.state === "verifying";
  async function prepare() {
    setError("");
    setReady(false);
    setProgress({ state: "loading", detail: "Hazırlanıyor...", completed: 0, total: 1 });
    try {
      await prepareBelgelerOffline(setProgress);
      setReady(true);
      try { await navigator.storage?.persist?.(); } catch { /* Browser may deny persistent storage. */ }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Hazırlama başarısız oldu.");
      setProgress({ state: "failed", detail: "Eksik dosyalar var — yeniden deneyin.", completed: 0, total: 1 });
    }
  }
  return (
    <div data-testid="belgeler-offline-prepare" className="flex flex-col items-start gap-1.5">
      <button
        type="button"
        disabled={busy}
        onClick={() => void prepare()}
        className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-border bg-background/75 px-3 text-xs font-semibold text-foreground shadow-sm transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 disabled:cursor-wait disabled:opacity-60"
      >
        {busy ? <RefreshCw className="h-4 w-4 animate-spin" /> :
          ready ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> :
          <DownloadCloud className="h-4 w-4" />}
        {busy ? "Çevrimdışı hazırlanıyor" : ready ? "Çevrimdışı hazır" : "Çevrimdışı kullanıma hazırla"}
      </button>
      <p role="status" aria-live="polite" className="max-w-[300px] text-[11px] leading-4 text-muted-foreground">
        {busy && progress ? progress.detail + " (" + progress.completed + "/" + progress.total + ")" :
          error ? <span className="text-red-600 dark:text-red-400">{error}</span> :
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
