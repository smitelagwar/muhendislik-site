"use client";

import { useState, useEffect } from "react";
import { Trash2, X, Loader2, RotateCcw, AlertTriangle, Folder } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DokTrashItem } from "@/lib/dokumantasyon/types";
import { formatBytes, formatDate, getFileIcon } from "../ui-helpers";
import { requestDokMutation } from "@/lib/dokumantasyon/client-mutation";

interface TrashModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefreshExplorer: () => void;
}

export function TrashModal({
  isOpen,
  onClose,
  onRefreshExplorer,
}: TrashModalProps) {
  const [items, setItems] = useState<DokTrashItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [emptyLoading, setEmptyLoading] = useState(false);
  const [confirmEmpty, setConfirmEmpty] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setConfirmEmpty(false);
      setError(null);
      fetchTrashItems();
    }
  }, [isOpen]);

  const fetchTrashItems = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/dokumantasyon/trash");
      const data = await res.json();
      if (res.ok) {
        setItems(data.items || []);
      }
    } catch (err) {
      console.error("Çöp kutusu listeleme hatası:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (item: DokTrashItem) => {
    setActionLoadingId(item.id);
    setError(null);
    try {
      const endpoint =
        item.type === "folder"
          ? `/api/dokumantasyon/folders/${item.id}/restore`
          : `/api/dokumantasyon/files/${item.id}/restore`;

      const result = await requestDokMutation(endpoint, { method: "POST" });
      if (result.ok) {
        setItems((prev) => prev.filter((i) => i.id !== item.id));
        onRefreshExplorer();
      } else {
        setError(result.message);
      }
    } finally {
      setActionLoadingId(null);
    }
  };

  const handlePermanentDelete = async (item: DokTrashItem) => {
    if (!confirm(`"${item.name}" kalıcı olarak silinsin mi? Bu işlem geri alınamaz!`)) {
      return;
    }

    setActionLoadingId(item.id);
    setError(null);
    try {
      const endpoint =
        item.type === "folder"
          ? `/api/dokumantasyon/trash/folders/${item.id}`
          : `/api/dokumantasyon/trash/files/${item.id}`;

      const result = await requestDokMutation(endpoint, { method: "DELETE" });
      if (result.ok) {
        setItems((prev) => prev.filter((i) => i.id !== item.id));
      } else {
        setError(result.message);
      }
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleEmptyTrash = async () => {
    setEmptyLoading(true);
    setError(null);
    try {
      const result = await requestDokMutation("/api/dokumantasyon/trash/empty", { method: "POST" });
      if (result.ok) {
        setItems([]);
        setConfirmEmpty(false);
      } else {
        setError(result.message);
      }
    } finally {
      setEmptyLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 p-4 backdrop-blur-md animate-in fade-in"
    >
      <div className="w-full max-w-3xl rounded-2xl border border-border/80 bg-card/95 p-6 shadow-2xl backdrop-blur-xl">
        <div className="flex items-center justify-between border-b border-border/60 pb-3.5">
          <div className="flex items-center gap-2.5 font-bold text-foreground">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-500/10 text-red-500 border border-red-500/20">
              <Trash2 className="h-4 w-4" />
            </div>
            <span className="text-base">Çöp Kutusu ({items.length} Öğe)</span>
          </div>

          <div className="flex items-center gap-2">
            {items.length > 0 && !confirmEmpty && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setConfirmEmpty(true)}
                className="gap-1.5 text-xs text-red-500 border-red-500/30 hover:bg-red-500/10 rounded-xl h-9"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Çöp Kutusunu Boşalt</span>
              </Button>
            )}

            {confirmEmpty && (
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={handleEmptyTrash}
                  disabled={emptyLoading}
                  className="gap-1.5 text-xs rounded-xl h-9 font-bold"
                >
                  {emptyLoading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <AlertTriangle className="h-3.5 w-3.5" />
                  )}
                  <span>Tümünü Kalıcı Sil</span>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setConfirmEmpty(false)}
                  className="text-xs rounded-xl h-9"
                >
                  Vazgeç
                </Button>
              </div>
            )}

            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {error && (
          <div role="alert" className="mt-4 flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-500">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Liste */}
        <div className="mt-4 max-h-[60vh] space-y-2 overflow-y-auto pr-1">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
              <Loader2 className="h-7 w-7 animate-spin text-amber-500" />
              <span className="text-xs">Çöp kutusu yükleniyor...</span>
            </div>
          ) : items.length === 0 ? (
            <div className="py-16 text-center text-sm text-muted-foreground">
              Çöp kutusu boş.
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-xl border border-border/70 bg-background/70 p-3 transition-all hover:border-border hover:bg-card shadow-sm"
              >
                <div className="flex items-center gap-3 min-w-0 pr-2">
                  {item.type === "folder" ? (
                    <Folder className="h-5 w-5 shrink-0 text-amber-500" />
                  ) : (
                    <div className="shrink-0">{getFileIcon("", "")}</div>
                  )}

                  <div className="min-w-0">
                    <div className="font-medium text-foreground text-sm truncate max-w-sm">
                      {item.name}
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      {item.type === "folder" ? "Klasör" : formatBytes(item.size_bytes)} • Silinme: {formatDate(item.deleted_at)}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRestore(item)}
                    disabled={actionLoadingId === item.id}
                    className="gap-1 text-xs border-border/80 hover:bg-amber-500/10 hover:text-amber-500 rounded-xl h-8"
                  >
                    {actionLoadingId === item.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <RotateCcw className="h-3.5 w-3.5" />
                    )}
                    <span className="hidden sm:inline">Geri Yükle</span>
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handlePermanentDelete(item)}
                    disabled={actionLoadingId === item.id}
                    className="gap-1 text-xs text-red-500 hover:bg-red-500/10 hover:text-red-600 rounded-xl h-8"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Kalıcı Sil</span>
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
