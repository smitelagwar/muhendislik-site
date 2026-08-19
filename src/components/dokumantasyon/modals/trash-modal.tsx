"use client";

import { useState, useEffect } from "react";
import { Trash2, X, Loader2, RotateCcw, AlertTriangle, Folder, HardDrive } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DokTrashItem } from "@/lib/dokumantasyon/types";
import { formatBytes, formatDate, getFileIcon } from "../ui-helpers";

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

  useEffect(() => {
    if (isOpen) {
      setConfirmEmpty(false);
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
    try {
      const endpoint =
        item.type === "folder"
          ? `/api/dokumantasyon/folders/${item.id}/restore`
          : `/api/dokumantasyon/files/${item.id}/restore`;

      const res = await fetch(endpoint, { method: "POST" });
      if (res.ok) {
        setItems((prev) => prev.filter((i) => i.id !== item.id));
        onRefreshExplorer();
      }
    } catch (err) {
      console.error("Geri yükleme hatası:", err);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handlePermanentDelete = async (item: DokTrashItem) => {
    if (!confirm(`"${item.name}" kalıcı olarak silinsin mi? Bu işlem geri alınamaz!`)) {
      return;
    }

    setActionLoadingId(item.id);
    try {
      const endpoint =
        item.type === "folder"
          ? `/api/dokumantasyon/trash/folders/${item.id}`
          : `/api/dokumantasyon/trash/files/${item.id}`;

      const res = await fetch(endpoint, { method: "DELETE" });
      if (res.ok) {
        setItems((prev) => prev.filter((i) => i.id !== item.id));
      }
    } catch (err) {
      console.error("Kalıcı silme hatası:", err);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleEmptyTrash = async () => {
    setEmptyLoading(true);
    try {
      const res = await fetch("/api/dokumantasyon/trash/empty", { method: "POST" });
      if (res.ok) {
        setItems([]);
        setConfirmEmpty(false);
      }
    } catch (err) {
      console.error("Çöp kutusunu boşaltma hatası:", err);
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
    >
      <div className="w-full max-w-3xl rounded-xl border border-border bg-card p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2 font-bold text-foreground">
            <Trash2 className="h-5 w-5 text-red-500" />
            <span>Çöp Kutusu ({items.length} Öğe)</span>
          </div>

          <div className="flex items-center gap-2">
            {items.length > 0 && !confirmEmpty && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setConfirmEmpty(true)}
                className="gap-1 text-xs text-red-500 border-red-500/30 hover:bg-red-500/10"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Çöp Kutusunu Boşalt</span>
              </Button>
            )}

            {confirmEmpty && (
              <div className="flex items-center gap-1.5">
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={handleEmptyTrash}
                  disabled={emptyLoading}
                  className="gap-1 text-xs"
                >
                  {emptyLoading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <AlertTriangle className="h-3.5 w-3.5" />
                  )}
                  <span>Evet, Tümünü Kalıcı Sil</span>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setConfirmEmpty(false)}
                  className="text-xs"
                >
                  Vazgeç
                </Button>
              </div>
            )}

            <button
              onClick={onClose}
              className="rounded p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Liste */}
        <div className="mt-4 max-h-[60vh] space-y-2 overflow-y-auto pr-1">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              <span>Çöp kutusu yükleniyor...</span>
            </div>
          ) : items.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              Çöp kutusu boş.
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-lg border border-border bg-background p-3 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0 pr-2">
                  {item.type === "folder" ? (
                    <Folder className="h-5 w-5 shrink-0 text-amber-500" />
                  ) : (
                    <div className="shrink-0">{getFileIcon("", "")}</div>
                  )}

                  <div className="min-w-0">
                    <div className="font-medium text-foreground text-sm truncate">
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
                    className="gap-1 text-xs border-border hover:bg-amber-500/10 hover:text-amber-500"
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
                    className="gap-1 text-xs text-red-500 hover:bg-red-500/10 hover:text-red-600"
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
