"use client";

import { useState, useEffect, useMemo } from "react";
import { Trash2, Loader2, RotateCcw, AlertTriangle, Folder } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DokTrashItem } from "@/lib/dokumantasyon/types";
import { formatBytes, formatDate } from "../ui-helpers";
import { FileTypeIcon } from "../file-icons";
import { requestDokMutation } from "@/lib/dokumantasyon/client-mutation";
import { OverlayPortal } from "../drive-v3/overlay-portal";
import { executeBulkRestore } from "../drive-v3/bulk-operations";

interface TrashModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefreshExplorer: () => void;
}

function getFileExtension(fileName: string): string {
  const dotIndex = fileName.lastIndexOf(".");
  if (dotIndex <= 0 || dotIndex === fileName.length - 1) return "";
  return fileName.slice(dotIndex + 1).toLowerCase();
}

export function TrashModal({
  isOpen,
  onClose,
  onRefreshExplorer,
}: TrashModalProps) {
  const [items, setItems] = useState<DokTrashItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [emptyLoading, setEmptyLoading] = useState(false);
  const [confirmEmpty, setConfirmEmpty] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setConfirmEmpty(false);
      setConfirmDeleteId(null);
      setConfirmBulkDelete(false);
      setSelectedIds(new Set());
      setError(null);
      void fetchTrashItems();
    }
  }, [isOpen]);

  const fetchTrashItems = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/dokumantasyon/trash");
      const data = await res.json();
      if (res.ok) {
        setItems(data.items || []);
      } else {
        setError("Çöp kutusu listelenemedi.");
      }
    } catch {
      setError("Çöp kutusu yüklenirken bağlantı hatası oluştu.");
    } finally {
      setLoading(false);
    }
  };

  const selectedItems = useMemo(
    () => items.filter((item) => selectedIds.has(item.id)),
    [items, selectedIds]
  );

  const allSelected = items.length > 0 && selectedIds.size === items.length;

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
      setConfirmBulkDelete(false);
    } else {
      setSelectedIds(new Set(items.map((i) => i.id)));
    }
  };

  const toggleSelectItem = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setConfirmBulkDelete(false);
  };

  const handleRestore = async (item: DokTrashItem) => {
    setActionLoadingId(item.id);
    setConfirmDeleteId(null);
    setError(null);
    try {
      const endpoint =
        item.type === "folder"
          ? `/api/dokumantasyon/folders/${item.id}/restore`
          : `/api/dokumantasyon/files/${item.id}/restore`;

      const result = await requestDokMutation(endpoint, { method: "POST" });
      if (result.ok) {
        setItems((prev) => prev.filter((i) => i.id !== item.id));
        setSelectedIds((prev) => {
          const next = new Set(prev);
          next.delete(item.id);
          return next;
        });
        toast.success(`"${item.name}" geri yüklendi.`);
        onRefreshExplorer();
      } else {
        setError(result.message);
      }
    } finally {
      setActionLoadingId(null);
    }
  };

  const handlePermanentDelete = async (item: DokTrashItem) => {
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
        setSelectedIds((prev) => {
          const next = new Set(prev);
          next.delete(item.id);
          return next;
        });
        setConfirmDeleteId(null);
        toast.success(`"${item.name}" kalıcı olarak silindi.`);
      } else {
        setError(result.message);
      }
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleBulkRestore = async () => {
    if (selectedItems.length === 0 || bulkLoading) return;
    setBulkLoading(true);
    setConfirmBulkDelete(false);
    setError(null);
    try {
      const result = await executeBulkRestore(
        selectedItems.map((i) => ({ id: i.id, type: i.type }))
      );
      if (result.succeeded.length > 0) {
        const succeededSet = new Set(result.succeeded);
        setItems((prev) => prev.filter((i) => !succeededSet.has(i.id)));
        setSelectedIds((prev) => {
          const next = new Set(prev);
          for (const id of succeededSet) next.delete(id);
          return next;
        });
        onRefreshExplorer();
        toast.success(`${result.succeeded.length} öğe geri yüklendi.`);
      }
      if (result.failed.length > 0) {
        setError(`${result.failed.length} öğe geri yüklenemedi.`);
      }
    } finally {
      setBulkLoading(false);
    }
  };

  const handleBulkPermanentDelete = async () => {
    if (selectedItems.length === 0 || bulkLoading) return;
    setBulkLoading(true);
    setError(null);
    try {
      const outcomes = await Promise.allSettled(
        selectedItems.map(async (item) => {
          const endpoint =
            item.type === "folder"
              ? `/api/dokumantasyon/trash/folders/${item.id}`
              : `/api/dokumantasyon/trash/files/${item.id}`;
          const res = await requestDokMutation(endpoint, { method: "DELETE" });
          return { id: item.id, ok: res.ok };
        })
      );

      const deletedIds = new Set<string>();
      let failedCount = 0;
      for (const outcome of outcomes) {
        if (outcome.status === "fulfilled" && outcome.value.ok) {
          deletedIds.add(outcome.value.id);
        } else {
          failedCount++;
        }
      }

      if (deletedIds.size > 0) {
        setItems((prev) => prev.filter((i) => !deletedIds.has(i.id)));
        setSelectedIds((prev) => {
          const next = new Set(prev);
          for (const id of deletedIds) next.delete(id);
          return next;
        });
        toast.success(`${deletedIds.size} öğe kalıcı olarak silindi.`);
      }
      if (failedCount > 0) {
        setError(`${failedCount} öğe kalıcı olarak silinemedi.`);
      }
      setConfirmBulkDelete(false);
    } finally {
      setBulkLoading(false);
    }
  };

  const handleEmptyTrash = async () => {
    setEmptyLoading(true);
    setError(null);
    try {
      const result = await requestDokMutation("/api/dokumantasyon/trash/empty", { method: "POST" });
      if (result.ok) {
        setItems([]);
        setSelectedIds(new Set());
        setConfirmEmpty(false);
        toast.success("Çöp kutusu tamamen boşaltıldı.");
      } else {
        setError(result.message);
      }
    } finally {
      setEmptyLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <OverlayPortal isOpen={isOpen} onClose={onClose} title="Çöp Kutusu">
      <div
        data-testid="dok-dialog-content"
        className="w-full max-w-3xl rounded-2xl border border-border/80 bg-card/95 p-6 shadow-2xl backdrop-blur-xl"
      >
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-3.5 pr-10">
          <div className="flex items-center gap-2.5 font-bold text-foreground">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-500/10 text-red-500 border border-red-500/20">
              <Trash2 className="h-4 w-4" />
            </div>
            <span className="text-base">Çöp Kutusu ({items.length} Öğe)</span>
          </div>

          <div className="flex items-center gap-2">
            {items.length > 0 && !confirmEmpty && (
              <Button
                type="button"
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
                  type="button"
                  size="sm"
                  variant="destructive"
                  onClick={handleEmptyTrash}
                  disabled={emptyLoading}
                  className="gap-1.5 text-xs rounded-xl h-9 font-bold"
                >
                  {emptyLoading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin motion-reduce:animate-none" />
                  ) : (
                    <AlertTriangle className="h-3.5 w-3.5" />
                  )}
                  <span>Tümünü Kalıcı Sil</span>
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setConfirmEmpty(false)}
                  className="text-xs rounded-xl h-9"
                >
                  Vazgeç
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Toplu Seçim Çubuğu */}
        {!loading && items.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border/70 bg-background/60 px-3 py-2 text-xs">
            <label className="flex cursor-pointer items-center gap-2 font-medium text-foreground">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={toggleSelectAll}
                className="h-4 w-4 rounded accent-amber-500"
              />
              <span>Tümünü Seç ({selectedIds.size}/{items.length})</span>
            </label>

            {selectedIds.size > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={bulkLoading}
                  onClick={handleBulkRestore}
                  className="h-8 gap-1 rounded-xl border-amber-500/40 text-xs text-amber-600 dark:text-amber-400 hover:bg-amber-500/10"
                >
                  {bulkLoading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin motion-reduce:animate-none" />
                  ) : (
                    <RotateCcw className="h-3.5 w-3.5" />
                  )}
                  <span>Seçilenleri Geri Yükle ({selectedIds.size})</span>
                </Button>

                {!confirmBulkDelete ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    disabled={bulkLoading}
                    onClick={() => setConfirmBulkDelete(true)}
                    className="h-8 gap-1 rounded-xl text-xs text-red-500 hover:bg-red-500/10"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Seçilenleri Kalıcı Sil</span>
                  </Button>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      disabled={bulkLoading}
                      onClick={handleBulkPermanentDelete}
                      className="h-8 rounded-xl text-xs font-bold"
                    >
                      Kalıcı Silmeyi Onayla ({selectedIds.size})
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={bulkLoading}
                      onClick={() => setConfirmBulkDelete(false)}
                      className="h-8 rounded-xl text-xs"
                    >
                      Vazgeç
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {error && (
          <div role="alert" className="mt-4 flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-500">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Liste */}
        <div className="mt-4 max-h-[55vh] space-y-2 overflow-y-auto pr-1">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
              <Loader2 className="h-7 w-7 animate-spin motion-reduce:animate-none text-amber-500" />
              <span className="text-xs">Çöp kutusu yükleniyor...</span>
            </div>
          ) : items.length === 0 ? (
            <div className="py-16 text-center text-sm text-muted-foreground">
              Çöp kutusu boş.
            </div>
          ) : (
            items.map((item) => {
              const isSelected = selectedIds.has(item.id);
              const isConfirmingDelete = confirmDeleteId === item.id;
              const isBusy = actionLoadingId === item.id || bulkLoading;

              return (
                <div
                  key={item.id}
                  className={`flex flex-col gap-2 rounded-xl border p-3 transition-all shadow-sm sm:flex-row sm:items-center sm:justify-between ${
                    isSelected
                      ? "border-amber-500/50 bg-amber-500/5"
                      : "border-border/70 bg-background/70 hover:border-border hover:bg-card"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 pr-2">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelectItem(item.id)}
                      aria-label={`${item.name} seç`}
                      className="h-4 w-4 shrink-0 rounded accent-amber-500"
                    />

                    {item.type === "folder" ? (
                      <Folder className="h-5 w-5 shrink-0 text-amber-500" />
                    ) : (
                      <div className="shrink-0">
                        <FileTypeIcon extension={getFileExtension(item.name)} size={20} />
                      </div>
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

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                    {isConfirmingDelete ? (
                      <>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => handlePermanentDelete(item)}
                          disabled={isBusy}
                          className="gap-1 text-xs rounded-xl h-8 font-bold"
                        >
                          {actionLoadingId === item.id && (
                            <Loader2 className="h-3.5 w-3.5 animate-spin motion-reduce:animate-none" />
                          )}
                          <span>Onayla</span>
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setConfirmDeleteId(null)}
                          disabled={isBusy}
                          className="text-xs rounded-xl h-8"
                        >
                          Vazgeç
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleRestore(item)}
                          disabled={isBusy}
                          className="gap-1 text-xs border-border/80 hover:bg-amber-500/10 hover:text-amber-500 rounded-xl h-8"
                        >
                          {actionLoadingId === item.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin motion-reduce:animate-none" />
                          ) : (
                            <RotateCcw className="h-3.5 w-3.5" />
                          )}
                          <span className="hidden sm:inline">Geri Yükle</span>
                        </Button>

                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setConfirmDeleteId(item.id)}
                          disabled={isBusy}
                          className="gap-1 text-xs text-red-500 hover:bg-red-500/10 hover:text-red-600 rounded-xl h-8"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span className="hidden sm:inline">Kalıcı Sil</span>
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </OverlayPortal>
  );
}
