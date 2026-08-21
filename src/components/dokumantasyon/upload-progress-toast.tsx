"use client";

import { Upload, X, CheckCircle2, AlertCircle, Loader2, RotateCw } from "lucide-react";
import { formatBytes } from "./ui-helpers";

export interface UploadQueueItem {
  id: string;
  name: string;
  size: number;
  progress: number; // 0 to 100
  status: "queued" | "authorizing" | "uploading" | "finalizing" | "confirming_metadata" | "completed" | "error";
  errorMessage?: string;
  file?: File;
  targetFolderId?: string | null;
  relativePath?: string;
}

interface UploadProgressToastProps {
  queue: UploadQueueItem[];
  onDismiss: () => void;
  onRetry: (itemId: string) => void;
}

export function UploadProgressToast({ queue, onDismiss, onRetry }: UploadProgressToastProps) {
  if (queue.length === 0) return null;

  const isAllDone = queue.every(
    (item) => item.status === "completed" || item.status === "error"
  );

  const completedCount = queue.filter((i) => i.status === "completed").length;
  const errorCount = queue.filter((i) => i.status === "error").length;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Yükleme durumu"
      className="fixed bottom-6 right-6 z-50 w-full max-w-sm rounded-xl border border-border bg-card/95 p-4 shadow-2xl backdrop-blur-md"
    >
      <div className="flex items-center justify-between border-b border-border/60 pb-2.5">
        <div className="flex items-center gap-2">
          {isAllDone ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          ) : (
            <Upload className="h-4 w-4 animate-bounce text-amber-500" />
          )}
          <span className="text-xs font-bold text-foreground">
            {isAllDone
              ? `Yükleme Tamamlandı (${completedCount}/${queue.length}${errorCount > 0 ? `, ${errorCount} Hata` : ""})`
              : `Dosyalar Yükleniyor (${completedCount}/${queue.length})...`}
          </span>
        </div>
        {isAllDone && (
          <button
            onClick={onDismiss}
            aria-label="Yükleme listesini kapat"
            className="rounded p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <div className="mt-3 max-h-48 space-y-2.5 overflow-y-auto pr-1">
        {queue.map((item) => (
          <div key={item.id} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="truncate max-w-[200px] font-medium text-foreground">
                {item.name}
              </span>
              <span className="text-[11px] text-muted-foreground">
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
              className="relative h-1.5 w-full overflow-hidden rounded-full bg-secondary"
            >
              <div
                className={`h-full transition-all duration-300 ${
                  item.status === "error"
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
            <div className="flex items-center justify-between text-[10px]">
              {item.status === "queued" && (
                <span className="text-muted-foreground">Sırada...</span>
              )}
              {item.status === "authorizing" && (
                <span className="flex items-center gap-1 text-amber-500 font-medium">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span>Yükleme yetkisi alınıyor...</span>
                </span>
              )}
              {item.status === "uploading" && (
                <span className="flex items-center gap-1 text-amber-500 font-medium">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span>Yükleniyor (%{item.progress})</span>
                </span>
              )}
              {item.status === "finalizing" && (
                <span className="flex items-center gap-1 text-blue-500 font-medium">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span>Kaydediliyor...</span>
                </span>
              )}
              {item.status === "confirming_metadata" && (
                <span className="flex items-center gap-1 text-blue-500 font-medium">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span>Liste kaydı doğrulanıyor...</span>
                </span>
              )}
              {item.status === "completed" && (
                <span className="text-emerald-500 font-medium">Tamamlandı</span>
              )}
              {item.status === "error" && (
                <>
                  <span role="alert" className="flex min-w-0 items-center gap-1 text-red-500 font-medium">
                    <AlertCircle className="h-3 w-3 shrink-0" />
                    <span className="truncate">{item.errorMessage || "Hata oluştu"}</span>
                  </span>
                  {item.file && (
                    <button type="button" onClick={() => onRetry(item.id)} className="inline-flex min-h-8 items-center gap-1 rounded px-1.5 font-semibold text-amber-500 hover:bg-amber-500/10">
                      <RotateCw className="h-3 w-3" /> Tekrar dene
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
