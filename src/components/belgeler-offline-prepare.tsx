"use client";
import { useEffect, useState, useSyncExternalStore } from "react";
import { CheckCircle2, DownloadCloud, RefreshCw, WifiOff } from "lucide-react";
import {
  prepareBelgelerOffline,
  readOfflineReady,
  type PreparationProgress,
} from "@/lib/belgeler-offline-client";

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
  const [progress, setProgress] = useState<PreparationProgress | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    if (available) void readOfflineReady().then(setReady);
    const recheck = () => { if (available) void readOfflineReady().then(setReady); };
    window.addEventListener("pageshow", recheck);
    return () => window.removeEventListener("pageshow", recheck);
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
    </div>
  );
}
