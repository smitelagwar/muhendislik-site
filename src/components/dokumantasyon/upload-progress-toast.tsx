"use client";

import { Upload, X, CheckCircle2, AlertCircle, Loader2, RotateCw, Ban } from "lucide-react";
import { formatBytes } from "./ui-helpers";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { OverlayPortal } from "./drive-v3/overlay-portal";

export interface UploadQueueItem {
  id: string;
  name: string;
  size: number;
  progress: number; // 0 to 100
  status: "queued" | "authorizing" | "uploading" | "finalizing" | "confirming_metadata" | "completed" | "error" | "cancelled";
  errorMessage?: string;
  file?: File;
  targetFolderId?: string | null;
  relativePath?: string;
}

interface UploadProgressToastProps {
  compact?: boolean;
  embedded?: boolean;
  expanded?: boolean;
  onExpandedChange?: (open: boolean) => void;
  queue: UploadQueueItem[];
  onDismiss: () => void;
  onRetry: (itemId: string) => void;
  onCancel?: (itemId: string) => void;
  onRetryFailed?: () => void;
}

const ACTIVE_STATUSES = new Set<UploadQueueItem["status"]>([
  "queued",
  "authorizing",
  "uploading",
  "finalizing",
  "confirming_metadata",
]);

export function UploadProgressToast({
  queue,
  onDismiss,
  onRetry,
  onCancel,
  onRetryFailed,
  compact = false,
  embedded = false,
  expanded: controlledExpanded,
  onExpandedChange,
}: UploadProgressToastProps) {
  const [localExpanded, setLocalExpanded] = useState(false);
  const expanded = controlledExpanded ?? localExpanded;
  const setExpanded = onExpandedChange ?? setLocalExpanded;

  const isAllDone =
    queue.length > 0 &&
    queue.every(
      (item) => item.status === "completed" || item.status === "error" || item.status === "cancelled"
    );

  const completedCount = queue.filter((i) => i.status === "completed").length;
  const errorCount = queue.filter((i) => i.status === "error" || i.status === "cancelled").length;
  const retryableCount = queue.filter((i) => (i.status === "error" || i.status === "cancelled") && Boolean(i.file)).length;

  const prevAllDoneRef = useRef<boolean>(isAllDone);

  useEffect(() => {
    if (embedded) return;
    if (queue.length === 0) {
      prevAllDoneRef.current = false;
      return;
    }
    if (!prevAllDoneRef.current && isAllDone) {
      if (errorCount > 0) {
        toast.error(`Yükleme tamamlandı: ${completedCount} başarılı, ${errorCount} hatalı/iptal.`);
      } else {
        toast.success(`${completedCount} dosya başarıyla yüklendi.`);
      }
    }
    prevAllDoneRef.current = isAllDone;
  }, [embedded, queue.length, isAllDone, completedCount, errorCount]);

  if (queue.length === 0) return null;

  const handleRetryAllFailed = () => {
    if (onRetryFailed) {
      onRetryFailed();
      return;
    }
    for (const item of queue) {
      if ((item.status === "error" || item.status === "cancelled") && item.file) {
        onRetry(item.id);
      }
    }
  };

  if (compact) return <div className="shrink-0 border-t border-border bg-card" data-testid="dok-upload-summary">
    <button type="button" className="flex min-h-11 w-full items-center gap-2 px-3 text-left text-sm" onClick={() => setExpanded(true)}>
      <Upload size={18} aria-hidden />
      <span role="status">{isAllDone ? "Yüklemeler" : "Yükleniyor"}: {completedCount}/{queue.length}{errorCount ? ` · ${errorCount} hata` : ""}</span>
      <span className="ml-auto">Detaylar</span>
    </button>
    <OverlayPortal isOpen={expanded} onClose={() => setExpanded(false)} title="Yükleme durumu" presentation="sheet">
      <div className="pt-12">
        <UploadProgressToast
          queue={queue}
          onRetry={onRetry}
          onCancel={onCancel}
          onRetryFailed={onRetryFailed}
          onDismiss={() => { setExpanded(false); onDismiss(); }}
          embedded
        />
      </div>
    </OverlayPortal>
  </div>;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Yükleme durumu"
      className={embedded ? "w-full bg-card p-4" : "fixed bottom-20 right-4 z-[100] w-full max-w-sm rounded-2xl border border-border/80 bg-card/95 p-4 shadow-2xl backdrop-blur-xl animate-in slide-in-from-bottom-4 motion-reduce:animate-none sm:right-6 sm:bottom-20"}
    >
      <div className="flex items-center justify-between gap-2 border-b border-border/60 pb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          {isAllDone ? (
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          ) : (
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
              <Upload className="h-4 w-4 animate-bounce motion-reduce:animate-none" />
            </div>
          )}
          <span className="truncate text-xs font-bold text-foreground">
            {isAllDone
              ? `Yükleme Tamamlandı (${completedCount}/${queue.length}${errorCount > 0 ? `, ${errorCount} Hata` : ""})`
              : `Dosyalar Yükleniyor (${completedCount}/${queue.length})...`}
          </span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {retryableCount > 0 && (
            <button
              type="button"
              onClick={handleRetryAllFailed}
              className="inline-flex h-7 items-center gap-1 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2 text-[11px] font-bold text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 transition-colors"
            >
              <RotateCw className="h-3 w-3" />
              <span>Tümünü Tekrar Dene</span>
            </button>
          )}
          {isAllDone && (
            <button
              type="button"
              onClick={onDismiss}
              aria-label="Yükleme listesini kapat"
              className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      <div className="mt-3.5 max-h-48 space-y-3 overflow-y-auto pr-1">
        {queue.map((item) => {
          const isActive = ACTIVE_STATUSES.has(item.status);
          const isFailed = item.status === "error" || item.status === "cancelled";

          return (
            <div key={item.id} className="space-y-1.5 rounded-xl border border-border/60 bg-background/60 p-2.5 shadow-inner">
              <div className="flex items-center justify-between text-xs">
                <span className="truncate max-w-[200px] font-bold text-foreground">
                  {item.name}
                </span>
                <span className="text-[11px] font-mono text-muted-foreground">
                  {formatBytes(item.size)}
                </span>
              </div>

              {item.relativePath && item.relativePath !== item.name && (
                <p className="truncate text-[10px] text-muted-foreground" title={item.relativePath}>
                  {item.relativePath}
                </p>
              )}

              {/* İlerleme Çubuğu */}
              <div
                role="progressbar"
                aria-label={`${item.name} yükleme ilerlemesi`}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={item.status === "completed" ? 100 : item.progress}
                className="relative h-2 w-full overflow-hidden rounded-full bg-secondary/80 shadow-inner"
              >
                <div
                  className={`h-full transition-all duration-300 motion-reduce:transition-none rounded-full ${
                    isFailed
                      ? "bg-red-500"
                      : item.status === "completed"
                      ? "bg-emerald-500"
                      : "bg-amber-500"
                  }`}
                  style={{
                    width:
                      item.status === "completed"
                        ? "100%"
                        : `${Math.max(5, item.progress)}%`,
                  }}
                />
              </div>

              {/* Durum Metni */}
              <div className="flex items-center justify-between gap-2 text-[11px] pt-0.5">
                {item.status === "queued" && (
                  <span className="text-muted-foreground font-medium">Sırada...</span>
                )}
                {item.status === "authorizing" && (
                  <span className="flex items-center gap-1 text-amber-500 font-semibold">
                    <Loader2 className="h-3 w-3 animate-spin motion-reduce:animate-none" />
                    <span>Yükleme yetkisi alınıyor...</span>
                  </span>
                )}
                {item.status === "uploading" && (
                  <span className="flex items-center gap-1 text-amber-500 font-semibold">
                    <Loader2 className="h-3 w-3 animate-spin motion-reduce:animate-none" />
                    <span>Yükleniyor (%{item.progress})</span>
                  </span>
                )}
                {item.status === "finalizing" && (
                  <span className="flex items-center gap-1 text-blue-500 font-semibold">
                    <Loader2 className="h-3 w-3 animate-spin motion-reduce:animate-none" />
                    <span>Kaydediliyor...</span>
                  </span>
                )}
                {item.status === "confirming_metadata" && (
                  <span className="flex items-center gap-1 text-blue-500 font-semibold">
                    <Loader2 className="h-3 w-3 animate-spin motion-reduce:animate-none" />
                    <span>Doğrulanıyor...</span>
                  </span>
                )}
                {item.status === "completed" && (
                  <span className="text-emerald-500 font-bold">Tamamlandı</span>
                )}
                {isActive && onCancel && (
                  <button
                    type="button"
                    onClick={() => onCancel(item.id)}
                    aria-label={`${item.name} yüklemesini iptal et`}
                    className="inline-flex min-h-7 items-center gap-1 rounded-lg px-2 font-semibold text-red-500 hover:bg-red-500/10 text-xs"
                  >
                    <Ban className="h-3 w-3" /> İptal Et
                  </button>
                )}
                {isFailed && (
                  <>
                    <span role="alert" className="flex min-w-0 items-center gap-1 text-red-500 font-semibold">
                      <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{item.errorMessage || (item.status === "cancelled" ? "İptal edildi" : "Hata oluştu")}</span>
                    </span>
                    {item.file && (
                      <button type="button" onClick={() => onRetry(item.id)} className="inline-flex min-h-7 shrink-0 items-center gap-1 rounded-lg px-2 font-bold text-amber-500 hover:bg-amber-500/10 text-xs">
                        <RotateCw className="h-3 w-3" /> Tekrar dene
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
