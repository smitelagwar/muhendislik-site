"use client";

import { useState, useEffect, useMemo } from "react";
import { FolderInput, Loader2, AlertCircle, Folder, HardDrive, Search, CornerDownRight } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DokFolder } from "@/lib/dokumantasyon/types";
import { OverlayPortal } from "../drive-v3/overlay-portal";
import { executeBulkMove } from "../drive-v3/bulk-operations";

interface MoveModalProps {
  isOpen: boolean;
  items: Array<{ id: string; name: string; type: "file" | "folder"; parentId: string | null }>;
  onClose: () => void;
  onSuccess: () => void;
  onPartialFailure?: (failedIds: string[]) => void;
}

interface FolderTreeNode {
  folder: DokFolder;
  depth: number;
  pathLabel: string;
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
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetchingFolders, setFetchingFolders] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setSelectedFolderId(null);
      setSearchQuery("");
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

  const folderTreeNodes = useMemo<FolderTreeNode[]>(() => {
    const validFolders = folders.filter((f) => !invalidTargetFolderIds.has(f.id));
    const validIds = new Set(validFolders.map((f) => f.id));
    const childrenByParent = new Map<string | null, DokFolder[]>();

    for (const folder of validFolders) {
      const parentKey = folder.parent_id && validIds.has(folder.parent_id) ? folder.parent_id : null;
      const list = childrenByParent.get(parentKey) ?? [];
      list.push(folder);
      childrenByParent.set(parentKey, list);
    }

    for (const list of childrenByParent.values()) {
      list.sort((a, b) => a.name.localeCompare(b.name, "tr"));
    }

    const flattened: FolderTreeNode[] = [];
    const visited = new Set<string>();

    const walk = (parentId: string | null, depth: number, parentPath: string) => {
      const children = childrenByParent.get(parentId) ?? [];
      for (const child of children) {
        if (visited.has(child.id)) continue;
        visited.add(child.id);
        const pathLabel = parentPath ? `${parentPath} / ${child.name}` : child.name;
        flattened.push({ folder: child, depth, pathLabel });
        walk(child.id, depth + 1, pathLabel);
      }
    };

    walk(null, 0, "");
    return flattened;
  }, [folders, invalidTargetFolderIds]);

  const visibleNodes = useMemo(() => {
    const q = searchQuery.trim().toLocaleLowerCase("tr");
    if (!q) return folderTreeNodes;
    return folderTreeNodes.filter(
      (node) =>
        node.folder.name.toLocaleLowerCase("tr").includes(q) ||
        node.pathLabel.toLocaleLowerCase("tr").includes(q)
    );
  }, [folderTreeNodes, searchQuery]);

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

      const targetName =
        selectedFolderId === null
          ? "Kök Dizin"
          : folders.find((f) => f.id === selectedFolderId)?.name || "seçili klasör";
      toast.success(`${itemsToMove.length} öğe "${targetName}" konumuna taşındı.`);
      onClose();
    } catch {
      setError("Bağlantı hatası oluştu.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <OverlayPortal isOpen={isOpen} onClose={onClose} title={`${itemLabel} Öğesini Taşı`}>
      {/* z-[90] overlay standard */}
      <div
        data-testid="dok-dialog-content"
        className="w-full max-w-md rounded-2xl border border-border/80 bg-card/95 p-6 shadow-2xl backdrop-blur-xl z-[90]"
      >
        <div className="flex items-center border-b border-border/60 pb-3.5 pr-10">
          <div className="flex items-center gap-2.5 font-bold text-foreground">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-purple-500/10 text-purple-500 border border-purple-500/20">
              <FolderInput className="h-4 w-4" />
            </div>
            <span className="text-base truncate max-w-[280px]">{itemLabel} Öğesini Taşı</span>
          </div>
        </div>

        <div className="mt-4 space-y-3.5">
          {error && (
            <div role="alert" className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-500">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Hedef klasör ara..."
              aria-label="Hedef klasör ara"
              className="w-full rounded-xl border border-input bg-background/80 py-2 pl-9 pr-3 text-xs text-foreground focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 shadow-sm"
            />
          </div>

          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Hedef klasörü seçin:</p>

          <div className="max-h-60 space-y-1 overflow-y-auto rounded-xl border border-border bg-background/80 p-2 shadow-inner">
            {/* Kök Dizin Seçeneği */}
            {!searchQuery.trim() && (
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
            )}

            {fetchingFolders ? (
              <div className="flex items-center justify-center py-6 text-muted-foreground gap-2">
                <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none text-amber-500" />
                <span className="text-xs">Klasörler taranıyor...</span>
              </div>
            ) : visibleNodes.length === 0 ? (
              <div className="py-6 text-center text-xs text-muted-foreground">
                Eşleşen klasör bulunamadı.
              </div>
            ) : (
              visibleNodes.map(({ folder, depth, pathLabel }) => {
                const isSearching = Boolean(searchQuery.trim());
                const indentPx = isSearching ? 12 : 12 + Math.min(depth, 6) * 16;

                return (
                  <button
                    key={folder.id}
                    type="button"
                    onClick={() => setSelectedFolderId(folder.id)}
                    style={{ paddingLeft: `${indentPx}px` }}
                    className={`flex w-full items-center gap-2 rounded-xl pr-3 py-2 text-left text-xs transition-all ${
                      selectedFolderId === folder.id
                        ? "bg-amber-500/15 font-bold text-amber-600 dark:text-amber-400 border border-amber-500/30 shadow-sm"
                        : "hover:bg-secondary/60 text-muted-foreground hover:text-foreground border border-transparent font-medium"
                    }`}
                  >
                    {!isSearching && depth > 0 && (
                      <CornerDownRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
                    )}
                    <Folder className="h-4 w-4 text-amber-500 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate">{folder.name}</div>
                      {isSearching && pathLabel !== folder.name && (
                        <div className="truncate text-[10px] text-muted-foreground">{pathLabel}</div>
                      )}
                    </div>
                  </button>
                );
              })
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
                  <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none mr-1.5" />
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
