"use client";

import { useState, useEffect } from "react";
import { FolderInput, X, Loader2, AlertCircle, Folder, HardDrive } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DokFolder } from "@/lib/dokumantasyon/types";
import { requestDokMutation } from "@/lib/dokumantasyon/client-mutation";

interface MoveModalProps {
  isOpen: boolean;
  items: Array<{ id: string; name: string; type: "file" | "folder"; parentId: string | null }>;
  onClose: () => void;
  onSuccess: () => void;
  onPartialFailure?: (failedIds: string[]) => void;
}

export function MoveModal({
  isOpen,
  items,
  onClose,
  onSuccess,
  onPartialFailure,
}: MoveModalProps) {
  const [folders, setFolders] = useState<DokFolder[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchingFolders, setFetchingFolders] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setSelectedFolderId(null);
      void fetchAvailableFolders();
    }
  }, [isOpen]);

  const fetchAvailableFolders = async () => {
    setFetchingFolders(true);
    try {
      // Kök ve alt klasörleri getir
      const res = await fetch("/api/dokumantasyon/folders/tree");
      const data = await res.json();
      if (res.ok && data.folders) {
        setFolders(data.folders);
      }
    } catch {
      setError("Klasör listesi yüklenemedi.");
    } finally {
      setFetchingFolders(false);
    }
  };

  if (!isOpen || items.length === 0) return null;

  const handleMove = async () => {
    if (loading) return;

    setLoading(true);
    setError(null);

    try {
      const failedIds: string[] = [];
      let movedCount = 0;

      for (const item of items) {
        // Aynı hedefe yeniden taşıma sessizce isim çoğaltmamalıdır.
        if (item.parentId === selectedFolderId) continue;
        const endpoint = item.type === "folder" ? `/api/dokumantasyon/folders/${item.id}` : `/api/dokumantasyon/files/${item.id}`;
        const body = item.type === "folder" ? { parentId: selectedFolderId } : { folderId: selectedFolderId };
        const result = await requestDokMutation(endpoint, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        if (result.ok) movedCount += 1;
        else failedIds.push(item.id);
      }

      if (movedCount > 0) await onSuccess();
      if (failedIds.length > 0) {
        onPartialFailure?.(failedIds);
        setError(`${items.length} öğeden ${failedIds.length}'si taşınamadı. Başarısız öğeler seçili bırakıldı.`);
        return;
      }

      onClose();
    } catch {
      setError("Bağlantı hatası oluştu.");
    } finally {
      setLoading(false);
    }
  };

  // Mevcut klasör ve döngüye girecek klasörleri filtrele
  const selectedFolderIds = new Set(items.filter((item) => item.type === "folder").map((item) => item.id));
  const filteredFolders = folders.filter((folder) => !selectedFolderIds.has(folder.id));
  const itemLabel = items.length === 1 ? items[0].name : `${items.length} öğe`;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Öğeleri taşı"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
    >
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2 font-bold text-foreground">
            <FolderInput className="h-5 w-5 text-amber-500" />
            <span>{itemLabel} Öğesini Taşı</span>
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
            <div className="flex items-center gap-2 rounded border border-red-500/30 bg-red-500/10 p-2.5 text-xs text-red-500">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <p className="text-xs text-muted-foreground">Hedef klasörü seçin:</p>

          <div className="max-h-60 space-y-1.5 overflow-y-auto rounded-lg border border-border bg-background p-2">
            {/* Kök Dizin Seçeneği */}
            <button
              type="button"
              onClick={() => setSelectedFolderId(null)}
              className={`flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-sm transition-colors ${
                selectedFolderId === null
                  ? "bg-amber-500/20 font-semibold text-foreground border border-amber-500/40"
                  : "hover:bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              <HardDrive className="h-4 w-4 text-amber-500" />
              <span>Kök Dizin (Root)</span>
            </button>

            {fetchingFolders ? (
              <div className="flex items-center justify-center py-4 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                <span className="text-xs">Klasörler taranıyor...</span>
              </div>
            ) : (
              filteredFolders.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setSelectedFolderId(f.id)}
                  className={`flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-sm transition-colors ${
                    selectedFolderId === f.id
                      ? "bg-amber-500/20 font-semibold text-foreground border border-amber-500/40"
                      : "hover:bg-secondary text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Folder className="h-4 w-4 text-amber-500" />
                  <span className="truncate">{f.name}</span>
                </button>
              ))
            )}
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
              onClick={handleMove}
              disabled={loading || items.every((item) => item.parentId === selectedFolderId)}
              className="bg-amber-500 font-semibold text-zinc-950 hover:bg-amber-400"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Taşınıyor...</span>
                </>
              ) : (
                <span>Buraya Taşı</span>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
