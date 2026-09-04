"use client";

import { useState, useEffect, useMemo } from "react";
import { FolderInput, X, Loader2, AlertCircle, Folder, HardDrive } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DokFolder } from "@/lib/dokumantasyon/types";
import { requestDokMutation } from "@/lib/dokumantasyon/client-mutation";
import { OverlayPortal } from "../drive-v3/overlay-portal";
import { executeBulkMove } from "../drive-v3/bulk-operations";

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

  // Taşınan klasörlerin kendileri ve tüm alt soyları (descendants) hedef olamaz.
  const invalidTargetFolderIds = useMemo(() => {
    const invalidIds = new Set<string>(
      items.filter((item) => item.type === "folder").map((item) => item.id)
    );

    let addedMore = true;
    while (addedMore) {
      addedMore = false;
      for (const folder of folders) {
        if (folder.parent_id && invalidIds.has(folder.parent_id) && !invalidIds.has(folder.id)) {
          invalidIds.add(folder.id);
          addedMore = true;
        }
      }
    }

    return invalidIds;
  }, [items, folders]);

  const filteredFolders = useMemo(() => {
    return folders.filter((folder) => !invalidTargetFolderIds.has(folder.id));
  }, [folders, invalidTargetFolderIds]);

  const itemLabel = items.length === 1 ? items[0].name : `${items.length} öğe`;

  if (!isOpen || items.length === 0) return null;

  const handleMove = async () => {
    if (loading) return;

    setLoading(true);
    setError(null);

    try {
      const itemsToMove = items.filter((item) => item.parentId !== selectedFolderId);
      if (itemsToMove.length === 0) {
        onClose();
        return;
      }

      const result = await executeBulkMove(
        itemsToMove.map((i) => ({ id: i.id, type: i.type })),
        selectedFolderId
      );

      if (result.succeeded.length > 0) await onSuccess();
      if (result.failed.length > 0) {
        onPartialFailure?.(result.failed.map((f) => f.id));
        setError(`${items.length} öğeden ${result.failed.length}'si taşınamadı. Başarısız öğeler seçili bırakıldı.`);
        return;
      }

      onClose();
    } catch {
      setError("Bağlantı hatası oluştu.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <OverlayPortal isOpen={isOpen} onClose={onClose}>
      {/* z-[90] overlay standard */}
      <div
        data-testid="dok-dialog-content"
        className="w-full max-w-md rounded-2xl border border-border/80 bg-card/95 p-6 shadow-2xl backdrop-blur-xl z-[90]"
      >
        <div className="flex items-center justify-between border-b border-border/60 pb-3.5">
          <div className="flex items-center gap-2.5 font-bold text-foreground">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-500/10 text-purple-500 border border-purple-500/20">
              <FolderInput className="h-4 w-4" />
            </div>
            <span className="text-base truncate max-w-[280px]">{itemLabel} Öğesini Taşı</span>
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
            <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-500">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Hedef klasörü seçin:</p>

          <div className="max-h-60 space-y-1.5 overflow-y-auto rounded-xl border border-border bg-background/80 p-2 shadow-inner">
            {/* Kök Dizin Seçeneği */}
            <button
              type="button"
              onClick={() => setSelectedFolderId(null)}
              className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-xs transition-all ${
                selectedFolderId === null
                  ? "bg-amber-500/15 font-bold text-amber-600 dark:text-amber-400 border border-amber-500/30 shadow-sm"
                  : "hover:bg-secondary/60 text-muted-foreground hover:text-foreground border border-transparent font-medium"
              }`}
            >
              <HardDrive className="h-4 w-4 text-amber-500 shrink-0" />
              <span>Kök Dizin (Root)</span>
            </button>

            {fetchingFolders ? (
              <div className="flex items-center justify-center py-6 text-muted-foreground gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-amber-500" />
                <span className="text-xs">Klasörler taranıyor...</span>
              </div>
            ) : (
              filteredFolders.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setSelectedFolderId(f.id)}
                  className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-xs transition-all ${
                    selectedFolderId === f.id
                      ? "bg-amber-500/15 font-bold text-amber-600 dark:text-amber-400 border border-amber-500/30 shadow-sm"
                      : "hover:bg-secondary/60 text-muted-foreground hover:text-foreground border border-transparent font-medium"
                  }`}
                >
                  <Folder className="h-4 w-4 text-amber-500 shrink-0" />
                  <span className="truncate">{f.name}</span>
                </button>
              ))
            )}
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
              onClick={handleMove}
              disabled={loading || items.every((item) => item.parentId === selectedFolderId)}
              className="bg-amber-500 font-bold text-zinc-950 hover:bg-amber-400 rounded-xl h-10 px-5 text-xs shadow-sm"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                  <span>Taşınıyor...</span>
                </>
              ) : (
                <span>Buraya Taşı</span>
              )}
            </Button>
          </div>
        </div>
      </div>
    </OverlayPortal>
  );
}
