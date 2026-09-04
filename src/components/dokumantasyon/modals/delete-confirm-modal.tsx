"use client";

import { useState } from "react";
import { Trash2, X, Loader2, AlertTriangle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OverlayPortal } from "../drive-v3/overlay-portal";

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
    <OverlayPortal isOpen={isOpen} onClose={onClose}>
      <div
        data-testid="dok-dialog-content"
        className="w-full max-w-md rounded-2xl border border-border/80 bg-card/95 p-6 shadow-2xl backdrop-blur-xl"
      >
        <div className="flex items-center justify-between border-b border-border/60 pb-3.5">
          <div className="flex items-center gap-2.5 font-bold text-red-500">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-500/10 text-red-500 border border-red-500/20">
              <Trash2 className="h-4 w-4" />
            </div>
            <span className="text-base">Çöp Kutusuna Taşı</span>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 space-y-4">
          {error && (
            <div role="alert" className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-500">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <p className="text-sm text-foreground font-semibold leading-snug">{title}</p>

          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-xs text-amber-600 dark:text-amber-400">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-bold">Önemli Paylaşım Uyarısı:</span>
                <p className="text-muted-foreground leading-relaxed">
                  Bu öğe aktif paylaşım bağlantılarında bulunuyorsa bu bağlantılar güvenlik gereği derhal iptal edilecektir.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="rounded-xl h-10 px-4 text-xs font-medium border-border/80"
            >
              İptal
            </Button>
            <Button
              type="button"
              onClick={handleConfirm}
              disabled={loading}
              className="bg-red-600 font-bold text-white hover:bg-red-500 rounded-xl h-10 px-5 text-xs shadow-sm"
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
    </OverlayPortal>
  );
}
