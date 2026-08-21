"use client";

import { useState } from "react";
import { Trash2, X, Loader2, AlertTriangle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DeleteConfirmModalProps {
  isOpen: boolean;
  item: { id: string; name: string; type: "file" | "folder" } | null;
  selectedCount?: number;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export function DeleteConfirmModal({
  isOpen,
  item,
  selectedCount,
  onClose,
  onConfirm,
}: DeleteConfirmModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setLoading(true);
    setError(null);
    try {
      await onConfirm();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Silme işlemi başarısız oldu.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const title = selectedCount && selectedCount > 1
    ? `${selectedCount} Öğeyi Çöp Kutusuna Taşı`
    : `${item?.name || "Öğe"} Çöp Kutusuna Taşınsın mı?`;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
    >
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2 font-bold text-red-500">
            <Trash2 className="h-5 w-5" />
            <span>Çöp Kutusuna Taşı</span>
          </div>
          <button
            onClick={onClose}
            className="rounded p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 space-y-4">
          {error && (
            <div role="alert" className="flex items-center gap-2 rounded border border-red-500/30 bg-red-500/10 p-2.5 text-xs text-red-500">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <p className="text-sm text-foreground font-medium">{title}</p>

          <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-600 dark:text-amber-400">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-semibold">Önemli Paylaşım Uyarısı:</span>
                <p>
                  Bu öğe aktif paylaşım bağlantılarında bulunuyorsa bu bağlantılar güvenlik gereği derhal iptal edilecektir.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={loading}
            >
              İptal
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleConfirm}
              disabled={loading}
              className="bg-red-600 font-semibold text-white hover:bg-red-500"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                  <span>Siliniyor...</span>
                </>
              ) : (
                <span>Çöp Kutusuna Taşı</span>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
