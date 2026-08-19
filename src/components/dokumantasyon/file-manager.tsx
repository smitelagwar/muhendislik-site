// ============================================================================
// DÖKÜMANTASYON MODÜLÜ — GELİŞMİŞ DOSYA YÖNETİCİSİ (DRIVE / MEGA UX)
// ============================================================================

"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
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
  Eye,
  ExternalLink,
  Download,
  LayoutGrid,
  List as ListIcon,
  Info,
  Star,
  Compass,
  FileText,
  Image as ImageIcon,
  Menu,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { DokFile, DokFolder, DokBreadcrumbItem } from "@/lib/dokumantasyon/types";
import { formatBytes, formatDate, getFileIcon } from "./ui-helpers";
import { DriveSidebar, DriveNavFilter } from "./drive-sidebar";
import { DriveDetailsDrawer } from "./drive-details-drawer";
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
  const router = useRouter();
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [currentFolder, setCurrentFolder] = useState<DokFolder | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<DokBreadcrumbItem[]>([
    { id: null, name: "Kök Dizin" },
  ]);
  const [folders, setFolders] = useState<DokFolder[]>([]);
  const [files, setFiles] = useState<DokFile[]>([]);
  const [loading, setLoading] = useState(true);

  // Drive UX Durumları
  const [activeFilter, setActiveFilter] = useState<DriveNavFilter>("all");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isSidebarOpenMobile, setIsSidebarOpenMobile] = useState(false);
  const [starredIds, setStarredIds] = useState<Set<string>>(new Set());

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
  const [configError, setConfigError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1. Yıldızlıları LocalStorage'dan Oku
  useEffect(() => {
    try {
      const saved = localStorage.getItem("dok_starred_items");
      if (saved) {
        setStarredIds(new Set(JSON.parse(saved)));
      }
    } catch {
      // Hata durumunda yut
    }
  }, []);

  const toggleStar = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setStarredIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      try {
        localStorage.setItem("dok_starred_items", JSON.stringify(Array.from(next)));
      } catch {}
      return next;
    });
  };

  // 2. Klasör İçeriğini Getir
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
        setConfigError(null);
        setCurrentFolder(data.folder || null);
        setBreadcrumbs(data.breadcrumbs || [{ id: null, name: "Kök Dizin" }]);
        setFolders(data.folders || []);
        setFiles(data.files || []);
        setSelectedIds(new Set());
      } else if (res.status === 503 || data.code?.includes("CONFIGURED") || data.code?.includes("FORBIDDEN")) {
        setConfigError(data.error || "Dökümantasyon kalıcı depolama altyapısı hazır değil.");
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

  // 3. Filtrelenmiş Dosya ve Klasörler
  const displayedFolders = useMemo(() => {
    if (activeFilter === "all") return folders;
    if (activeFilter === "starred") return folders.filter((f) => starredIds.has(f.id));
    return []; // CAD, PDF, Image ve Recent modlarında sadece dosyalar gösterilir
  }, [folders, activeFilter, starredIds]);

  const displayedFiles = useMemo(() => {
    let result = files;

    if (activeFilter === "starred") {
      result = result.filter((f) => starredIds.has(f.id));
    } else if (activeFilter === "cad") {
      result = result.filter((f) => f.extension === ".dwg" || f.extension === ".dxf");
    } else if (activeFilter === "pdf") {
      result = result.filter((f) => f.extension === ".pdf");
    } else if (activeFilter === "image") {
      result = result.filter((f) => [".png", ".jpg", ".jpeg", ".webp"].includes(f.extension));
    } else if (activeFilter === "recent") {
      result = [...result].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    return result;
  }, [files, activeFilter, starredIds]);

  // Toplam İstatistikler
  const totalSizeBytes = useMemo(() => {
    return files.reduce((acc, f) => acc + Number(f.size_bytes), 0);
  }, [files]);

  // 4. Detay Paneli İçin Seçili Öğe
  const selectedItemForDrawer = useMemo(() => {
    if (selectedIds.size === 0) return null;
    const firstId = Array.from(selectedIds)[0];
    const folder = folders.find((f) => f.id === firstId);
    if (folder) return { type: "folder" as const, folder };
    const file = files.find((f) => f.id === firstId);
    if (file) return { type: "file" as const, file };
    return null;
  }, [selectedIds, folders, files]);

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
    if (!isDetailsOpen) setIsDetailsOpen(true);
  };

  const allItemIds = [...displayedFolders.map((f) => f.id), ...displayedFiles.map((f) => f.id)];
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
      const folder = folders.find((f) => f.id === id);
      const endpoint = folder
        ? `/api/dokumantasyon/folders/${id}`
        : `/api/dokumantasyon/files/${id}`;
      await fetch(endpoint, { method: "DELETE" });
    }
    fetchItems();
  };

  // 5. Dosya Yükleme Süreci
  const uploadFiles = async (fileList: FileList | File[]) => {
    const filesToUpload = Array.from(fileList);
    if (filesToUpload.length === 0) return;

    const newQueueItems: UploadQueueItem[] = filesToUpload.map((f, i) => ({
      id: `${Date.now()}_${i}_${f.name}`,
      name: f.name,
      size: f.size,
      progress: 0,
      status: "pending",
    }));

    setUploadQueue((prev) => [...prev, ...newQueueItems]);

    for (let i = 0; i < filesToUpload.length; i++) {
      const file = filesToUpload[i];
      const queueId = newQueueItems[i].id;

      setUploadQueue((prev) =>
        prev.map((item) =>
          item.id === queueId ? { ...item, status: "uploading", progress: 10 } : item
        )
      );

      try {
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

        if (!tokenRes.ok) {
          const errData = await tokenRes.json();
          throw new Error(errData.error || "Upload token alınamadı.");
        }

        const tokenData = await tokenRes.json();

        if (tokenData.isLocalMode) {
          const formData = new FormData();
          formData.append("file", file);
          formData.append("pathname", tokenData.pathname);
          formData.append("folderId", currentFolderId || "null");

          setUploadQueue((prev) =>
            prev.map((item) =>
              item.id === queueId ? { ...item, progress: 60 } : item
            )
          );

          const localRes = await fetch("/api/dokumantasyon/upload/local", {
            method: "POST",
            body: formData,
          });

          if (!localRes.ok) {
            const errData = await localRes.json();
            throw new Error(errData.error || "Yerel yükleme başarısız.");
          }
        } else {
          // Vercel Blob Üretim Ortamı
          setUploadQueue((prev) =>
            prev.map((item) =>
              item.id === queueId ? { ...item, progress: 40 } : item
            )
          );

          const blob = await put(tokenData.pathname, file, {
            access: "public",
            token: tokenData.clientToken,
          });

          setUploadQueue((prev) =>
            prev.map((item) =>
              item.id === queueId ? { ...item, progress: 85 } : item
            )
          );

          const finalizeRes = await fetch("/api/dokumantasyon/upload/finalize", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              blobUrl: blob.url,
              blobPathname: blob.pathname,
              displayName: file.name,
              sizeBytes: file.size,
              mimeType: file.type || "application/octet-stream",
              folderId: currentFolderId,
              intentToken: tokenData.intentToken,
            }),
          });

          if (!finalizeRes.ok) {
            const errData = await finalizeRes.json();
            throw new Error(errData.error || "Kayıt tamamlanamadı.");
          }
        }

        setUploadQueue((prev) =>
          prev.map((item) =>
            item.id === queueId ? { ...item, status: "completed", progress: 100 } : item
          )
        );
      } catch (err: unknown) {
        console.error("Yükleme hatası:", err);
        setUploadQueue((prev) =>
          prev.map((item) =>
            item.id === queueId
              ? {
                  ...item,
                  status: "error",
                  error: err instanceof Error ? err.message : "Yüklenemedi",
                }
              : item
          )
        );
      }
    }

    fetchItems();
  };

  // Sürükle-Bırak Olayları
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
      uploadFiles(e.dataTransfer.files);
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className="relative flex h-full min-h-[750px] w-full rounded-2xl border border-border bg-background shadow-xl overflow-hidden"
    >
      {/* Gizli Dosya Girişi */}
      <input
        type="file"
        ref={fileInputRef}
        multiple
        onChange={(e) => e.target.files && uploadFiles(e.target.files)}
        className="hidden"
      />

      {/* Sürükle-Bırak Overlay */}
      {isDraggingOver && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-amber-500/10 backdrop-blur-sm border-2 border-dashed border-amber-500 rounded-2xl">
          <UploadCloud className="h-16 w-16 text-amber-500 animate-bounce" />
          <p className="mt-4 text-base font-bold text-foreground">
            Dosyaları buraya bırakın
          </p>
          <p className="text-xs text-muted-foreground">
            {currentFolder ? `"${currentFolder.name}" klasörüne yüklenecek` : "Kök dizine yüklenecek"}
          </p>
        </div>
      )}

      {/* 1. Sol Gezinti Çubuğu (Drive Sidebar) */}
      <div className="hidden lg:block">
        <DriveSidebar
          activeFilter={activeFilter}
          onFilterChange={(f) => {
            setActiveFilter(f);
            if (f !== "all" && currentFolderId) setCurrentFolderId(null);
          }}
          onNewFolder={() => setIsNewFolderOpen(true)}
          onUploadClick={() => fileInputRef.current?.click()}
          onOpenActiveShares={() => setIsActiveSharesOpen(true)}
          onOpenTrash={() => setIsTrashOpen(true)}
          totalFilesCount={files.length}
          totalFoldersCount={folders.length}
          totalSizeBytes={totalSizeBytes}
          starredCount={starredIds.size}
        />
      </div>

      {/* 2. Ana Çalışma Alanı (Center Content) */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Üst Gezinti ve Kontrol Çubuğu */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 bg-card/40 p-4">
          {/* Breadcrumb ve Mobil Menü */}
          <div className="flex items-center gap-2 overflow-x-auto text-xs sm:text-sm">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsSidebarOpenMobile((m) => !m)}
              className="lg:hidden h-8 w-8 p-0"
            >
              <Menu className="h-4 w-4" />
            </Button>

            <button
              onClick={() => {
                setActiveFilter("all");
                setCurrentFolderId(null);
              }}
              className="flex items-center gap-1.5 font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <HardDrive className="h-4 w-4 text-amber-500 shrink-0" />
              <span>Kök Dizin</span>
            </button>

            {breadcrumbs.slice(1).map((b, idx) => (
              <React.Fragment key={b.id || idx}>
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />
                <button
                  onClick={() => setCurrentFolderId(b.id)}
                  className={`transition-colors hover:text-foreground truncate max-w-[120px] sm:max-w-xs ${
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

          {/* Sağ Kontroller: Arama, Görünüm Modu, Detay Toggle */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsSearchOpen(true)}
              className="h-8 gap-1.5 border-border/80 text-xs hover:bg-secondary"
            >
              <Search className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="hidden sm:inline">Ara...</span>
            </Button>

            <div className="flex items-center rounded-lg border border-border/80 bg-secondary/30 p-0.5">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setViewMode("list")}
                className={`h-7 w-7 p-0 ${viewMode === "list" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}
                title="Liste Görünümü"
              >
                <ListIcon className="h-3.5 w-3.5" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setViewMode("grid")}
                className={`h-7 w-7 p-0 ${viewMode === "grid" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}
                title="Kart (Grid) Görünümü"
              >
                <LayoutGrid className="h-3.5 w-3.5" />
              </Button>
            </div>

            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsDetailsOpen((d) => !d)}
              className={`h-8 w-8 p-0 ${isDetailsOpen ? "bg-amber-500/20 text-amber-500" : "text-muted-foreground hover:text-foreground"}`}
              title="Öğe Bilgi ve Detay Çekmecesi"
            >
              <Info className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Çoklu Seçim Yüzen Aksiyon Çubuğu */}
        {selectedIds.size > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-amber-500/30 bg-amber-500/10 px-4 py-2 text-xs font-medium text-foreground animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckSquare className="h-4 w-4 text-amber-500" />
              <span className="font-bold">{selectedIds.size}</span>
              <span>öğe seçildi</span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={handleOpenShareSelected}
                className="h-7 gap-1.5 bg-amber-500 text-xs font-bold text-zinc-950 hover:bg-amber-400"
              >
                <Link2 className="h-3.5 w-3.5" />
                <span>Link Oluştur</span>
              </Button>

              <Button
                size="sm"
                variant="destructive"
                onClick={() => setIsMultiDeleteOpen(true)}
                className="h-7 gap-1 text-xs"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Sil</span>
              </Button>

              <Button
                size="sm"
                variant="ghost"
                onClick={() => setSelectedIds(new Set())}
                className="h-7 text-xs"
              >
                Temizle
              </Button>
            </div>
          </div>
        )}

        {/* Kalıcı Depolama Yapılandırma Uyarısı */}
        {configError && (
          <div className="mx-4 mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-400 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5 text-red-400" />
            <div className="space-y-1 text-xs">
              <div className="font-bold text-sm text-red-300">Kalıcı Depolama Yapılandırma Hatası</div>
              <div>{configError}</div>
              <div className="text-muted-foreground">Veri kaybını önlemek için yükleme ve değiştirme işlemleri güvenlik amacıyla durdurulmuştur.</div>
            </div>
          </div>
        )}

        {/* Ana İçerik Alanı: Liste veya Grid */}
        <div className="flex-1 overflow-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center py-24 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin mr-3 text-amber-500" />
              <span className="text-sm font-medium">Dosyalar listeleniyor...</span>
            </div>
          ) : displayedFolders.length === 0 && displayedFiles.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-border bg-secondary/40 text-muted-foreground">
                <Folder className="h-8 w-8 text-muted-foreground/60" />
              </div>
              <p className="mt-4 text-sm font-bold text-foreground">
                {activeFilter === "starred"
                  ? "Henüz yıldızlı dosya yok."
                  : activeFilter === "cad"
                  ? "CAD çizimi bulunamadı."
                  : "Bu klasör boş."}
              </p>
              <p className="mt-1 text-xs text-muted-foreground max-w-sm">
                Yeni bir dosya yükleyebilir veya sol menüden hızlı filtreleri kullanabilirsiniz.
              </p>
              <Button
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="mt-4 gap-1.5 bg-amber-500 text-xs font-bold text-zinc-950 hover:bg-amber-400"
              >
                <Upload className="h-3.5 w-3.5" />
                <span>Dosya Yükle</span>
              </Button>
            </div>
          ) : viewMode === "list" ? (
            /* ========================================================= */
            /* LİSTE GÖRÜNÜMÜ (TABLE VIEW)                               */
            /* ========================================================= */
            <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
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

              <div className="divide-y divide-border/50">
                {/* Klasörler */}
                {displayedFolders.map((folder) => {
                  const isSelected = selectedIds.has(folder.id);
                  const isStarred = starredIds.has(folder.id);

                  return (
                    <div
                      key={folder.id}
                      onClick={() => setCurrentFolderId(folder.id)}
                      className={`grid grid-cols-12 items-center px-4 py-3 text-sm transition-colors cursor-pointer ${
                        isSelected ? "bg-amber-500/10" : "hover:bg-secondary/60"
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

                        <button
                          onClick={(e) => toggleStar(folder.id, e)}
                          className="text-muted-foreground hover:text-amber-400 shrink-0"
                        >
                          <Star
                            className={`h-4 w-4 ${isStarred ? "fill-amber-400 text-amber-400" : ""}`}
                          />
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
                              className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48 bg-card border-border shadow-xl">
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

                {/* Dosyalar */}
                {displayedFiles.map((file) => {
                  const isSelected = selectedIds.has(file.id);
                  const isStarred = starredIds.has(file.id);

                  return (
                    <div
                      key={file.id}
                      onClick={() => router.push(`/dokumantasyon/dosya/${file.id}`)}
                      className={`grid grid-cols-12 items-center px-4 py-3 text-sm transition-colors cursor-pointer ${
                        isSelected ? "bg-amber-500/10" : "hover:bg-secondary/60"
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

                        <button
                          onClick={(e) => toggleStar(file.id, e)}
                          className="text-muted-foreground hover:text-amber-400 shrink-0"
                        >
                          <Star
                            className={`h-4 w-4 ${isStarred ? "fill-amber-400 text-amber-400" : ""}`}
                          />
                        </button>

                        <span className="shrink-0">{getFileIcon(file.extension)}</span>

                        <span className="font-medium text-foreground truncate max-w-[200px] sm:max-w-xs hover:text-amber-500">
                          {file.display_name}
                        </span>
                      </div>

                      <div className="hidden sm:col-span-2 sm:block text-xs font-mono text-muted-foreground">
                        {formatBytes(Number(file.size_bytes))}
                      </div>

                      <div className="col-span-3 hidden md:block text-xs text-muted-foreground">
                        {formatDate(file.updated_at || file.created_at)}
                      </div>

                      <div className="col-span-4 flex items-center justify-end sm:col-span-4 md:col-span-1">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              onClick={(e) => e.stopPropagation()}
                              className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48 bg-card border-border shadow-xl">
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/dokumantasyon/dosya/${file.id}`);
                              }}
                              className="flex items-center gap-2 cursor-pointer text-xs font-medium text-amber-500 focus:text-amber-500"
                            >
                              <Eye className="h-3.5 w-3.5 text-amber-500" />
                              <span>Önizle</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                window.open(`/dokumantasyon/dosya/${file.id}`, "_blank");
                              }}
                              className="flex items-center gap-2 cursor-pointer text-xs"
                            >
                              <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                              <span>Yeni Sekmede Aç</span>
                            </DropdownMenuItem>
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
            </div>
          ) : (
            /* ========================================================= */
            /* KART / GRID GÖRÜNÜMÜ (CARDS VIEW)                         */
            /* ========================================================= */
            <div className="space-y-6">
              {/* Klasör Kartları */}
              {displayedFolders.length > 0 && (
                <div>
                  <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Klasörler ({displayedFolders.length})
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    {displayedFolders.map((folder) => {
                      const isSelected = selectedIds.has(folder.id);
                      const isStarred = starredIds.has(folder.id);

                      return (
                        <div
                          key={folder.id}
                          onClick={() => setCurrentFolderId(folder.id)}
                          className={`group relative flex flex-col justify-between rounded-xl border p-3 cursor-pointer transition-all hover:shadow-md ${
                            isSelected
                              ? "border-amber-500 bg-amber-500/10"
                              : "border-border bg-card hover:border-border/80 hover:bg-secondary/40"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <Folder className="h-7 w-7 text-amber-500" />
                            <button
                              onClick={(e) => toggleStar(folder.id, e)}
                              className="text-muted-foreground hover:text-amber-400"
                            >
                              <Star className={`h-3.5 w-3.5 ${isStarred ? "fill-amber-400 text-amber-400" : ""}`} />
                            </button>
                          </div>

                          <span className="mt-3 text-xs font-bold text-foreground truncate">
                            {folder.name}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Dosya Kartları */}
              {displayedFiles.length > 0 && (
                <div>
                  <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Dosyalar ({displayedFiles.length})
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    {displayedFiles.map((file) => {
                      const isSelected = selectedIds.has(file.id);
                      const isStarred = starredIds.has(file.id);

                      return (
                        <div
                          key={file.id}
                          onClick={() => router.push(`/dokumantasyon/dosya/${file.id}`)}
                          className={`group relative flex flex-col justify-between rounded-xl border p-3 cursor-pointer transition-all hover:shadow-md ${
                            isSelected
                              ? "border-amber-500 bg-amber-500/10"
                              : "border-border bg-card hover:border-border/80 hover:bg-secondary/40"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="shrink-0">{getFileIcon(file.extension)}</span>
                            <button
                              onClick={(e) => toggleStar(file.id, e)}
                              className="text-muted-foreground hover:text-amber-400"
                            >
                              <Star className={`h-3.5 w-3.5 ${isStarred ? "fill-amber-400 text-amber-400" : ""}`} />
                            </button>
                          </div>

                          <div className="mt-3 space-y-1">
                            <span className="text-xs font-bold text-foreground truncate block group-hover:text-amber-500">
                              {file.display_name}
                            </span>
                            <span className="text-[10px] font-mono text-muted-foreground block">
                              {formatBytes(Number(file.size_bytes))}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 3. Sağ Detay Çekmecesi (Info Drawer) */}
      {isDetailsOpen && (
        <DriveDetailsDrawer
          selectedItem={selectedItemForDrawer}
          onClose={() => setIsDetailsOpen(false)}
          onPreview={(fileId) => router.push(`/dokumantasyon/dosya/${fileId}`)}
          onShare={(item) => handleOpenShareSingle(item)}
          onRename={(item) => setRenameItem({ ...item, type: item.type })}
          onDelete={(item) => setDeleteItem({ ...item, type: item.type })}
        />
      )}

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
