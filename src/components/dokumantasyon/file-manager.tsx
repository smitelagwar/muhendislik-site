"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Folder,
  FolderPlus,
  Upload,
  Link2,
  Trash2,
  Search,
  MoreVertical,
  Edit3,
  Move,
  HardDrive,
  ChevronRight,
  Loader2,
  CheckSquare,
  Square,
  ArrowUpDown,
  UploadCloud,
  Share2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { DokFile, DokFolder, DokBreadcrumbItem } from "@/lib/dokumantasyon/types";
import { formatBytes, formatDate, getFileIcon } from "./ui-helpers";
import { NewFolderModal } from "./modals/new-folder-modal";
import { RenameModal } from "./modals/rename-modal";
import { MoveModal } from "./modals/move-modal";
import { DeleteConfirmModal } from "./modals/delete-confirm-modal";
import { SearchModal } from "./modals/search-modal";
import { TrashModal } from "./modals/trash-modal";
import { CreateShareModal } from "./modals/create-share-modal";
import { ShareResultModal } from "./modals/share-result-modal";
import { ActiveSharesModal } from "./modals/active-shares-modal";
import { UploadProgressToast, UploadQueueItem } from "./upload-progress-toast";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { put } from "@vercel/blob/client";

export function DokumantasyonFileManager() {
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [currentFolder, setCurrentFolder] = useState<DokFolder | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<DokBreadcrumbItem[]>([
    { id: null, name: "Kök Dizin" },
  ]);
  const [folders, setFolders] = useState<DokFolder[]>([]);
  const [files, setFiles] = useState<DokFile[]>([]);
  const [loading, setLoading] = useState(true);

  // Sıralama
  const [sortBy, setSortBy] = useState<"name" | "date" | "size">("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Çoklu Seçim
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Modallar
  const [isNewFolderOpen, setIsNewFolderOpen] = useState(false);
  const [renameItem, setRenameItem] = useState<{
    id: string;
    name: string;
    type: "file" | "folder";
  } | null>(null);
  const [moveItem, setMoveItem] = useState<{
    id: string;
    name: string;
    type: "file" | "folder";
  } | null>(null);
  const [deleteItem, setDeleteItem] = useState<{
    id: string;
    name: string;
    type: "file" | "folder";
  } | null>(null);
  const [isMultiDeleteOpen, setIsMultiDeleteOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isTrashOpen, setIsTrashOpen] = useState(false);

  // Share Modalları
  const [isCreateShareOpen, setIsCreateShareOpen] = useState(false);
  const [shareItemsToProcess, setShareItemsToProcess] = useState<
    Array<{ id: string; type: "file" | "folder"; name?: string; size?: number }>
  >([]);
  const [shareResult, setShareResult] = useState<{
    shareUrl: string;
    rawToken: string;
    expiresAt: string;
    totalFiles: number;
    totalSizeBytes: number;
    title?: string | null;
  } | null>(null);
  const [isActiveSharesOpen, setIsActiveSharesOpen] = useState(false);

  // Yükleme Sırası ve Sürükle-Bırak
  const [uploadQueue, setUploadQueue] = useState<UploadQueueItem[]>([]);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Klasör İçeriğini Getir
  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const url = new URL("/api/dokumantasyon/items", window.location.origin);
      if (currentFolderId) url.searchParams.set("folderId", currentFolderId);
      url.searchParams.set("sortBy", sortBy);
      url.searchParams.set("order", sortOrder);

      const res = await fetch(url.toString());
      const data = await res.json();

      if (res.ok) {
        setCurrentFolder(data.folder || null);
        setBreadcrumbs(data.breadcrumbs || [{ id: null, name: "Kök Dizin" }]);
        setFolders(data.folders || []);
        setFiles(data.files || []);
        setSelectedIds(new Set());
      }
    } catch (err) {
      console.error("Dosyalar yüklenirken hata:", err);
    } finally {
      setLoading(false);
    }
  }, [currentFolderId, sortBy, sortOrder]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // Sıralama Değiştir
  const handleSort = (field: "name" | "date" | "size") => {
    if (sortBy === field) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  // Çoklu Seçim İşlemleri
  const handleToggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const allItemIds = [...folders.map((f) => f.id), ...files.map((f) => f.id)];
  const isAllSelected =
    allItemIds.length > 0 && allItemIds.every((id) => selectedIds.has(id));

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(allItemIds));
    }
  };

  // Seçili Öğelerden Paylaşım Modalı Aç
  const handleOpenShareSelected = () => {
    const items: Array<{ id: string; type: "file" | "folder"; name?: string; size?: number }> = [];
    selectedIds.forEach((id) => {
      const folder = folders.find((f) => f.id === id);
      if (folder) {
        items.push({ id: folder.id, type: "folder", name: folder.name });
      } else {
        const file = files.find((f) => f.id === id);
        if (file) {
          items.push({ id: file.id, type: "file", name: file.display_name, size: Number(file.size_bytes) });
        }
      }
    });

    if (items.length > 0) {
      setShareItemsToProcess(items);
      setIsCreateShareOpen(true);
    }
  };

  // Tekil Öğeden Paylaşım Modalı Aç
  const handleOpenShareSingle = (item: { id: string; type: "file" | "folder"; name: string; size?: number }) => {
    setShareItemsToProcess([item]);
    setIsCreateShareOpen(true);
  };

  // Çoklu Silme
  const handleMultiDeleteConfirm = async () => {
    const ids = Array.from(selectedIds);
    for (const id of ids) {
      const isFolder = folders.some((f) => f.id === id);
      const endpoint = isFolder
        ? `/api/dokumantasyon/folders/${id}`
        : `/api/dokumantasyon/files/${id}`;

      await fetch(endpoint, { method: "DELETE" });
    }
    fetchItems();
  };

  // Dosya Yükleme Yürütücüsü (Direct Client -> Private Blob)
  const processUploadFiles = async (filesToUpload: FileList | File[]) => {
    const newQueueItems: UploadQueueItem[] = Array.from(filesToUpload).map((f) => ({
      id: crypto.randomUUID(),
      name: f.name,
      size: f.size,
      progress: 0,
      status: "pending",
    }));

    setUploadQueue((prev) => [...prev, ...newQueueItems]);

    for (let i = 0; i < filesToUpload.length; i++) {
      const file = filesToUpload[i];
      const queueId = newQueueItems[i].id;

      try {
        setUploadQueue((prev) =>
          prev.map((item) =>
            item.id === queueId ? { ...item, status: "uploading", progress: 20 } : item
          )
        );

        const tokenRes = await fetch("/api/dokumantasyon/upload/token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            filename: file.name,
            size: file.size,
            mimeType: file.type || "application/octet-stream",
            folderId: currentFolderId,
          }),
        });

        const tokenData = await tokenRes.json();
        if (!tokenRes.ok) {
          throw new Error(tokenData.error || "Token üretilemedi.");
        }

        if (tokenData.isLocalMode) {
          setUploadQueue((prev) =>
            prev.map((item) =>
              item.id === queueId ? { ...item, status: "uploading", progress: 60 } : item
            )
          );

          const formData = new FormData();
          formData.append("file", file);
          formData.append("pathname", tokenData.pathname);
          formData.append("folderId", currentFolderId || "null");

          const localRes = await fetch("/api/dokumantasyon/upload/local", {
            method: "POST",
            body: formData,
          });

          if (!localRes.ok) {
            const errData = await localRes.json().catch(() => ({}));
            throw new Error(errData.error || "Yerel dosya yükleme başarısız.");
          }

          setUploadQueue((prev) =>
            prev.map((item) =>
              item.id === queueId ? { ...item, status: "completed", progress: 100 } : item
            )
          );
        } else {
          setUploadQueue((prev) =>
            prev.map((item) =>
              item.id === queueId ? { ...item, progress: 60 } : item
            )
          );

          const newBlob = await put(tokenData.pathname, file, {
            access: "private",
            token: tokenData.clientToken,
          });

          setUploadQueue((prev) =>
            prev.map((item) =>
              item.id === queueId ? { ...item, status: "finalizing", progress: 90 } : item
            )
          );

          const finalizeRes = await fetch("/api/dokumantasyon/upload/finalize", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              blobUrl: newBlob.url,
              blobPathname: newBlob.pathname,
              displayName: file.name,
              sizeBytes: file.size,
              mimeType: file.type || "application/octet-stream",
              folderId: currentFolderId,
            }),
          });

          if (!finalizeRes.ok) {
            const finData = await finalizeRes.json();
            throw new Error(finData.error || "Veritabanı kaydı tamamlanamadı.");
          }

          setUploadQueue((prev) =>
            prev.map((item) =>
              item.id === queueId ? { ...item, status: "completed", progress: 100 } : item
            )
          );
        }
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : "Yükleme hatası";
        setUploadQueue((prev) =>
          prev.map((item) =>
            item.id === queueId
              ? { ...item, status: "error", errorMessage: errorMsg }
              : item
          )
        );
      }
    }

    fetchItems();
  };

  // Drag & Drop Olayları
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processUploadFiles(e.dataTransfer.files);
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className="relative space-y-4"
    >
      {/* Sürükle Bırak Overlay */}
      {isDraggingOver && (
        <div className="absolute inset-0 z-40 flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-amber-500 bg-background/90 backdrop-blur-sm">
          <UploadCloud className="h-12 w-12 animate-bounce text-amber-500" />
          <p className="mt-2 text-base font-bold text-foreground">
            Dosyaları Buraya Bırakın
          </p>
          <p className="text-xs text-muted-foreground">
            Dosyalar doğrudan güvenli Private Blob depolamasına yüklenecektir.
          </p>
        </div>
      )}

      {/* Gizli File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            processUploadFiles(e.target.files);
            e.target.value = "";
          }
        }}
      />

      {/* Araç Çubuğu (Toolbar) */}
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card/60 p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
        {/* Breadcrumb Gezintisi */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs font-medium sm:text-sm">
          <button
            onClick={() => setCurrentFolderId(null)}
            className="flex items-center gap-1 text-muted-foreground transition-colors hover:text-foreground"
          >
            <HardDrive className="h-4 w-4 text-amber-500" />
            <span>Kök Dizin</span>
          </button>

          {breadcrumbs.slice(1).map((b, idx) => (
            <React.Fragment key={b.id || idx}>
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/60" />
              <button
                onClick={() => setCurrentFolderId(b.id)}
                className={`transition-colors hover:text-foreground ${
                  idx === breadcrumbs.length - 2
                    ? "font-bold text-foreground"
                    : "text-muted-foreground"
                }`}
              >
                {b.name}
              </button>
            </React.Fragment>
          ))}
        </div>

        {/* Aksiyon Düğmeleri */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsSearchOpen(true)}
            className="gap-1.5 border-border text-xs"
            aria-label="Dosya ara"
          >
            <Search className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="hidden sm:inline">Ara...</span>
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsNewFolderOpen(true)}
            className="gap-1.5 border-border text-xs font-semibold hover:border-amber-500/40"
          >
            <FolderPlus className="h-4 w-4 text-amber-500" />
            <span>Yeni Klasör</span>
          </Button>

          <Button
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            className="gap-1.5 bg-amber-500 text-xs font-semibold text-zinc-950 hover:bg-amber-400"
          >
            <Upload className="h-4 w-4" />
            <span>Dosya Yükle</span>
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsActiveSharesOpen(true)}
            className="gap-1.5 border-border text-xs font-semibold text-blue-500 hover:bg-blue-500/10"
          >
            <Link2 className="h-4 w-4" />
            <span>Aktif Linkler</span>
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsTrashOpen(true)}
            className="gap-1.5 border-border text-xs font-semibold text-muted-foreground hover:text-red-500"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Çöp Kutusu</span>
          </Button>
        </div>
      </div>

      {/* Çoklu Seçim Yüzen Aksiyon Çubuğu */}
      {selectedIds.size > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs font-medium text-foreground sm:px-4 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2">
            <CheckSquare className="h-4 w-4 text-amber-500" />
            <span className="font-bold">{selectedIds.size}</span>
            <span>öğe seçildi</span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={handleOpenShareSelected}
              className="gap-1.5 bg-amber-500 text-xs font-semibold text-zinc-950 hover:bg-amber-400"
            >
              <Link2 className="h-3.5 w-3.5" />
              <span>Link Oluştur</span>
            </Button>

            <Button
              size="sm"
              variant="destructive"
              onClick={() => setIsMultiDeleteOpen(true)}
              className="gap-1 text-xs"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Sil</span>
            </Button>

            <Button
              size="sm"
              variant="ghost"
              onClick={() => setSelectedIds(new Set())}
              className="text-xs"
            >
              Temizle
            </Button>
          </div>
        </div>
      )}

      {/* Dosya ve Klasör Tablosu / Listesi */}
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        {/* Tablo Başlığı */}
        <div className="grid grid-cols-12 items-center border-b border-border/80 bg-secondary/40 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <div className="col-span-8 flex items-center gap-3 sm:col-span-6">
            <button
              onClick={handleToggleSelectAll}
              className="text-muted-foreground hover:text-foreground"
              aria-label="Tümünü seç"
            >
              {isAllSelected ? (
                <CheckSquare className="h-4 w-4 text-amber-500" />
              ) : (
                <Square className="h-4 w-4" />
              )}
            </button>

            <button
              onClick={() => handleSort("name")}
              className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
            >
              <span>İsim</span>
              <ArrowUpDown className="h-3 w-3" />
            </button>
          </div>

          <div className="hidden sm:col-span-2 sm:block">
            <button
              onClick={() => handleSort("size")}
              className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
            >
              <span>Boyut</span>
              <ArrowUpDown className="h-3 w-3" />
            </button>
          </div>

          <div className="col-span-3 hidden md:block">
            <button
              onClick={() => handleSort("date")}
              className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
            >
              <span>Değiştirilme</span>
              <ArrowUpDown className="h-3 w-3" />
            </button>
          </div>

          <div className="col-span-4 text-right sm:col-span-4 md:col-span-1">
            <span>İşlem</span>
          </div>
        </div>

        {/* Liste Gövdesi */}
        {loading ? (
          <div className="flex items-center justify-center py-20 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span className="text-sm">Öğeler yükleniyor...</span>
          </div>
        ) : folders.length === 0 && files.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full border border-border bg-secondary/50 text-muted-foreground">
              <Folder className="h-6 w-6" />
            </div>
            <p className="mt-3 text-sm font-semibold text-foreground">
              Bu klasör henüz boş.
            </p>
            <p className="mt-1 text-xs text-muted-foreground max-w-sm">
              Yeni bir klasör oluşturabilir veya dosyalarınızı buraya sürükleyip bırakabilirsiniz.
            </p>
            <Button
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="mt-4 gap-1.5 bg-amber-500 text-xs font-semibold text-zinc-950 hover:bg-amber-400"
            >
              <Upload className="h-3.5 w-3.5" />
              <span>Dosya Seç</span>
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {/* Klasör Satırları */}
            {folders.map((folder) => {
              const isSelected = selectedIds.has(folder.id);

              return (
                <div
                  key={folder.id}
                  onClick={() => setCurrentFolderId(folder.id)}
                  className={`grid grid-cols-12 items-center px-4 py-3 text-sm transition-colors cursor-pointer ${
                    isSelected
                      ? "bg-amber-500/10"
                      : "hover:bg-secondary/60"
                  }`}
                >
                  <div className="col-span-8 flex items-center gap-3 sm:col-span-6 min-w-0 pr-2">
                    <button
                      onClick={(e) => handleToggleSelect(folder.id, e)}
                      className="text-muted-foreground hover:text-foreground shrink-0"
                    >
                      {isSelected ? (
                        <CheckSquare className="h-4 w-4 text-amber-500" />
                      ) : (
                        <Square className="h-4 w-4" />
                      )}
                    </button>
                    <Folder className="h-5 w-5 shrink-0 text-amber-500" />
                    <span className="font-medium text-foreground truncate max-w-[200px] sm:max-w-xs">
                      {folder.name}
                    </span>
                  </div>

                  <div className="hidden sm:col-span-2 sm:block text-xs text-muted-foreground">
                    —
                  </div>

                  <div className="col-span-3 hidden md:block text-xs text-muted-foreground">
                    {formatDate(folder.updated_at || folder.created_at)}
                  </div>

                  <div className="col-span-4 flex items-center justify-end sm:col-span-4 md:col-span-1">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          onClick={(e) => e.stopPropagation()}
                          className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground focus:outline-none focus:ring-1 focus:ring-amber-500"
                          aria-label="Klasör menüsü"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" side="bottom" sideOffset={6} className="w-48 bg-card border-border shadow-xl">
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenShareSingle({ id: folder.id, name: folder.name, type: "folder" });
                          }}
                          className="flex items-center gap-2 cursor-pointer text-xs"
                        >
                          <Share2 className="h-3.5 w-3.5 text-amber-500" />
                          <span>Link Oluştur</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            setRenameItem({ id: folder.id, name: folder.name, type: "folder" });
                          }}
                          className="flex items-center gap-2 cursor-pointer text-xs text-blue-500 focus:text-blue-500"
                        >
                          <Edit3 className="h-3.5 w-3.5 text-blue-500" />
                          <span>Yeniden Adlandır</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            setMoveItem({ id: folder.id, name: folder.name, type: "folder" });
                          }}
                          className="flex items-center gap-2 cursor-pointer text-xs text-purple-500 focus:text-purple-500"
                        >
                          <Move className="h-3.5 w-3.5 text-purple-500" />
                          <span>Taşı</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteItem({ id: folder.id, name: folder.name, type: "folder" });
                          }}
                          className="flex items-center gap-2 cursor-pointer text-xs text-red-500 focus:text-red-500 focus:bg-red-500/10"
                        >
                          <Trash2 className="h-3.5 w-3.5 text-red-500" />
                          <span>Çöp Kutusuna At</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              );
            })}

            {/* Dosya Satırları */}
            {files.map((file) => {
              const isSelected = selectedIds.has(file.id);

              return (
                <div
                  key={file.id}
                  className={`grid grid-cols-12 items-center px-4 py-3 text-sm transition-colors ${
                    isSelected ? "bg-amber-500/10" : "hover:bg-secondary/40"
                  }`}
                >
                  <div className="col-span-8 flex items-center gap-3 sm:col-span-6 min-w-0 pr-2">
                    <button
                      onClick={(e) => handleToggleSelect(file.id, e)}
                      className="text-muted-foreground hover:text-foreground shrink-0"
                    >
                      {isSelected ? (
                        <CheckSquare className="h-4 w-4 text-amber-500" />
                      ) : (
                        <Square className="h-4 w-4" />
                      )}
                    </button>
                    <div className="shrink-0">{getFileIcon(file.extension, file.mime_type)}</div>
                    <span className="font-medium text-foreground truncate max-w-[200px] sm:max-w-xs">
                      {file.display_name}
                    </span>
                  </div>

                  <div className="hidden sm:col-span-2 sm:block text-xs text-muted-foreground">
                    {formatBytes(file.size_bytes)}
                  </div>

                  <div className="col-span-3 hidden md:block text-xs text-muted-foreground">
                    {formatDate(file.created_at)}
                  </div>

                  <div className="col-span-4 flex items-center justify-end sm:col-span-4 md:col-span-1">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          onClick={(e) => e.stopPropagation()}
                          className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground focus:outline-none focus:ring-1 focus:ring-amber-500"
                          aria-label="Dosya menüsü"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" side="bottom" sideOffset={6} className="w-48 bg-card border-border shadow-xl">
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenShareSingle({
                              id: file.id,
                              name: file.display_name,
                              type: "file",
                              size: Number(file.size_bytes),
                            });
                          }}
                          className="flex items-center gap-2 cursor-pointer text-xs"
                        >
                          <Share2 className="h-3.5 w-3.5 text-amber-500" />
                          <span>Link Oluştur</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            setRenameItem({ id: file.id, name: file.display_name, type: "file" });
                          }}
                          className="flex items-center gap-2 cursor-pointer text-xs text-blue-500 focus:text-blue-500"
                        >
                          <Edit3 className="h-3.5 w-3.5 text-blue-500" />
                          <span>Yeniden Adlandır</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            setMoveItem({ id: file.id, name: file.display_name, type: "file" });
                          }}
                          className="flex items-center gap-2 cursor-pointer text-xs text-purple-500 focus:text-purple-500"
                        >
                          <Move className="h-3.5 w-3.5 text-purple-500" />
                          <span>Taşı</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteItem({ id: file.id, name: file.display_name, type: "file" });
                          }}
                          className="flex items-center gap-2 cursor-pointer text-xs text-red-500 focus:text-red-500 focus:bg-red-500/10"
                        >
                          <Trash2 className="h-3.5 w-3.5 text-red-500" />
                          <span>Çöp Kutusuna At</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modallar */}
      <NewFolderModal
        isOpen={isNewFolderOpen}
        currentFolderId={currentFolderId}
        onClose={() => setIsNewFolderOpen(false)}
        onSuccess={fetchItems}
      />

      <RenameModal
        isOpen={renameItem !== null}
        item={renameItem}
        onClose={() => setRenameItem(null)}
        onSuccess={fetchItems}
      />

      <MoveModal
        isOpen={moveItem !== null}
        item={moveItem}
        currentFolderId={currentFolderId}
        onClose={() => setMoveItem(null)}
        onSuccess={fetchItems}
      />

      <DeleteConfirmModal
        isOpen={deleteItem !== null}
        item={deleteItem}
        onClose={() => setDeleteItem(null)}
        onConfirm={async () => {
          if (!deleteItem) return;
          const endpoint =
            deleteItem.type === "folder"
              ? `/api/dokumantasyon/folders/${deleteItem.id}`
              : `/api/dokumantasyon/files/${deleteItem.id}`;
          await fetch(endpoint, { method: "DELETE" });
          fetchItems();
        }}
      />

      <DeleteConfirmModal
        isOpen={isMultiDeleteOpen}
        item={null}
        selectedCount={selectedIds.size}
        onClose={() => setIsMultiDeleteOpen(false)}
        onConfirm={handleMultiDeleteConfirm}
      />

      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onNavigateToFolder={(folderId) => setCurrentFolderId(folderId)}
      />

      <TrashModal
        isOpen={isTrashOpen}
        onClose={() => setIsTrashOpen(false)}
        onRefreshExplorer={fetchItems}
      />

      {/* Share Modalları */}
      <CreateShareModal
        isOpen={isCreateShareOpen}
        selectedItems={shareItemsToProcess}
        onClose={() => setIsCreateShareOpen(false)}
        onSuccess={(res) => {
          setShareResult(res);
        }}
      />

      <ShareResultModal
        isOpen={shareResult !== null}
        result={shareResult}
        onClose={() => setShareResult(null)}
      />

      <ActiveSharesModal
        isOpen={isActiveSharesOpen}
        onClose={() => setIsActiveSharesOpen(false)}
      />

      {/* Yükleme İlerleme Bildirimi */}
      <UploadProgressToast
        queue={uploadQueue}
        onDismiss={() => setUploadQueue([])}
      />
    </div>
  );
}
