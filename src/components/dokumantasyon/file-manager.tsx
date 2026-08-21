// ============================================================================
// DÖKÜMANTASYON MODÜLÜ — GELİŞMİŞ DOSYA YÖNETİCİSİ (DRIVE / MEGA UX)
// ============================================================================

"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
  ChevronLeft,
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
  Menu,
  AlertTriangle,
  SlidersHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { DokFile, DokFolder, DokBreadcrumbItem } from "@/lib/dokumantasyon/types";
import { formatBytes, formatDate, getFileIcon } from "./ui-helpers";
import { DriveSidebar, DriveNavFilter } from "./drive-sidebar";
import { DriveDetailsDrawer } from "./drive-details-drawer";
import { MobileDetailsSheet } from "./mobile-details-sheet";
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
import { WorkspaceFilterSheet, WorkspaceFilters } from "./workspace-filter-sheet";
import { makeFolderUploadPlan, FolderUploadEntry } from "@/lib/dokumantasyon/folder-upload";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { uploadPresigned } from "@vercel/blob/client";
import { requestDokMutation } from "@/lib/dokumantasyon/client-mutation";
import { useDokSelection } from "./hooks/use-dok-selection";
import styles from "./dok-workspace.module.css";

type DriveItem = { id: string; name: string; type: "file" | "folder"; parentId: string | null; size?: number };

type ListError = {
  kind: "auth" | "network" | "server";
  message: string;
};

const DEFAULT_WORKSPACE_FILTERS: WorkspaceFilters = {
  type: "all",
  date: "all",
  size: "all",
  scope: "current",
  starredOnly: false,
};

export function DokumantasyonFileManager() {
  const router = useRouter();
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [currentFolder, setCurrentFolder] = useState<DokFolder | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<DokBreadcrumbItem[]>([{ id: null, name: "Kök Dizin" }]);
  const [folders, setFolders] = useState<DokFolder[]>([]);
  const [files, setFiles] = useState<DokFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState<ListError | null>(null);
  // Drive UX Durumları
  const [activeFilter, setActiveFilter] = useState<DriveNavFilter>("all");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isSidebarOpenMobile, setIsSidebarOpenMobile] = useState(false);
  const [workspaceFilters, setWorkspaceFilters] = useState<WorkspaceFilters>(DEFAULT_WORKSPACE_FILTERS);
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [starredCount, setStarredCount] = useState(0);
  const [actionError, setActionError] = useState<string | null>(null);
  const [starMigrationVersion, setStarMigrationVersion] = useState(0);

  // Sıralama
  const [sortBy, setSortBy] = useState<"name" | "date" | "size">("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Çoklu Seçim
  const { selectedIds, setSelectedIds, toggleSelectedId, replaceSelection } = useDokSelection();
  // Modallar
  const [isNewFolderOpen, setIsNewFolderOpen] = useState(false);
  const [renameItem, setRenameItem] = useState<{
    id: string;
    name: string;
    type: "file" | "folder";
  } | null>(null);
  const [moveItems, setMoveItems] = useState<DriveItem[]>([]);
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
  const mobileMenuButtonRef = useRef<HTMLButtonElement>(null);
  const mobileSidebarRef = useRef<HTMLDivElement>(null);
  const [supportsFolderUpload, setSupportsFolderUpload] = useState(false);

  // Eski local yıldızlar yalnız ilk başarılı server migration'da taşınır.
  useEffect(() => {
    try {
      if (localStorage.getItem("dok_starred_items_migrated_v1")) return;
      const saved = JSON.parse(localStorage.getItem("dok_starred_items") || "[]");
      if (!Array.isArray(saved) || saved.length === 0) {
        localStorage.setItem("dok_starred_items_migrated_v1", "1");
        return;
      }
      void requestDokMutation("/api/dokumantasyon/stars/migrate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: saved.filter((id): id is string => typeof id === "string") }),
      }).then((result) => {
        if (result.ok) {
          localStorage.setItem("dok_starred_items_migrated_v1", "1");
          setStarMigrationVersion((version) => version + 1);
        }
      });
    } catch {
      // Eski tarayıcı verisi geçersizse server state'i değiştirilmez.
    }
  }, []);

  useEffect(() => {
    const input = document.createElement("input");
    const supported = "webkitdirectory" in input;
    setSupportsFolderUpload(supported);
  }, []);

  useEffect(() => {
    if (!isSidebarOpenMobile) return;

    const previousOverflow = document.body.style.overflow;
    const menuButton = mobileMenuButtonRef.current;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsSidebarOpenMobile(false);
    };

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", closeOnEscape);
    window.setTimeout(() => mobileSidebarRef.current?.focus(), 0);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", closeOnEscape);
      menuButton?.focus();
    };
  }, [isSidebarOpenMobile]);

  // 2. Klasör İçeriğini Getir
  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const url = new URL("/api/dokumantasyon/items", window.location.origin);
      if (currentFolderId) url.searchParams.set("folderId", currentFolderId);
      url.searchParams.set("sortBy", sortBy);
      url.searchParams.set("order", sortOrder);
      const navigationType = activeFilter === "cad" || activeFilter === "pdf" || activeFilter === "image" ? activeFilter : workspaceFilters.type;
      const collection = activeFilter === "recent" ? "recent" : activeFilter === "starred" || workspaceFilters.starredOnly ? "starred" : "none";
      url.searchParams.set("type", navigationType);
      url.searchParams.set("date", workspaceFilters.date);
      url.searchParams.set("size", workspaceFilters.size);
      url.searchParams.set("scope", workspaceFilters.scope);
      url.searchParams.set("collection", collection);

      const res = await fetch(url.toString());
      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        setConfigError(null);
        setListError(null);
        setCurrentFolder(data.folder || null);
        setBreadcrumbs(data.breadcrumbs || [{ id: null, name: "Kök Dizin" }]);
        setFolders(data.folders || []);
        setFiles(data.files || []);
        setStarredCount(Number(data.summary?.starredCount || 0));
        setSelectedIds(new Set());
      } else if (res.status === 503 || data.code?.includes("CONFIGURED") || data.code?.includes("FORBIDDEN")) {
        setConfigError(data.error || "Dökümantasyon kalıcı depolama altyapısı hazır değil.");
        setListError(null);
        setFolders([]);
        setFiles([]);
      } else if (res.status === 401) {
        setConfigError(null);
        setFolders([]);
        setFiles([]);
        setListError({ kind: "auth", message: data.error || "Oturumunuz sona erdi. Giriş sayfasına yönlendiriliyorsunuz." });
        router.refresh();
      } else {
        setConfigError(null);
        setFolders([]);
        setFiles([]);
        setListError({ kind: "server", message: data.error || "Dosyalar şu anda listelenemiyor." });
      }
    } catch (err) {
      console.error("Dosyalar yüklenirken hata:", err);
      setConfigError(null);
      setFolders([]);
      setFiles([]);
      setListError({
        kind: "network",
        message: navigator.onLine
          ? "Ağ bağlantısı kurulamadı. Lütfen tekrar deneyin."
          : "Çevrimdışısınız. Bağlantınızı kontrol edip tekrar deneyin.",
      });
    } finally {
      setLoading(false);
    }
  }, [activeFilter, currentFolderId, router, setSelectedIds, sortBy, sortOrder, workspaceFilters]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  useEffect(() => {
    if (starMigrationVersion > 0) void fetchItems();
  }, [fetchItems, starMigrationVersion]);

  const toggleStar = async (
    type: "file" | "folder",
    id: string,
    isStarred: boolean,
    event: React.MouseEvent
  ) => {
    event.stopPropagation();
    const nextStarredAt = isStarred ? null : new Date().toISOString();
    const updateState = (starredAt: string | null) => {
      if (type === "file") {
        setFiles((previous) => previous.map((file) => file.id === id ? { ...file, starred_at: starredAt } : file));
      } else {
        setFolders((previous) => previous.map((folder) => folder.id === id ? { ...folder, starred_at: starredAt } : folder));
      }
    };

    updateState(nextStarredAt);
    setStarredCount((count) => Math.max(0, count + (isStarred ? -1 : 1)));
    const endpoint = type === "file" ? `/api/dokumantasyon/files/${id}` : `/api/dokumantasyon/folders/${id}`;
    const result = await requestDokMutation(endpoint, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ starred: !isStarred }),
    });
    if (!result.ok) {
      updateState(isStarred ? new Date().toISOString() : null);
      setStarredCount((count) => Math.max(0, count + (isStarred ? 1 : -1)));
      setActionError(result.message);
    }
  };

  const handleNavigationFilter = (filter: DriveNavFilter) => {
    setActiveFilter(filter);
    if (filter === "cad" || filter === "pdf" || filter === "image") {
      setWorkspaceFilters((filters) => ({ ...filters, type: filter }));
    } else if (filter === "all") {
      setWorkspaceFilters((filters) => ({ ...filters, type: "all", starredOnly: false }));
    } else if (filter === "starred") {
      setWorkspaceFilters((filters) => ({ ...filters, starredOnly: true }));
    }
  };

  // 3. Filtrelenmiş Dosya ve Klasörler
  const displayedFolders = useMemo(() => {
    return folders;
  }, [folders]);

  const displayedFiles = useMemo(() => {
    return files;
  }, [files]);

  // Toplam İstatistikler
  const totalSizeBytes = useMemo(() => {
    return files.reduce((acc, f) => acc + Number(f.size_bytes), 0);
  }, [files]);

  const activeFilterLabels = useMemo(() => {
    const labels: string[] = [];
    if (activeFilter === "recent") labels.push("Son açılanlar");
    if (activeFilter === "starred" || workspaceFilters.starredOnly) labels.push("Yıldızlı");
    const activeType = activeFilter === "cad" ? "CAD" : activeFilter === "pdf" ? "PDF" : activeFilter === "image" ? "Görsel" : workspaceFilters.type === "other" ? "Diğer" : workspaceFilters.type === "all" ? null : workspaceFilters.type.toUpperCase();
    if (activeType) labels.push(activeType);
    if (workspaceFilters.date !== "all") labels.push(workspaceFilters.date === "today" ? "Son 24 saat" : workspaceFilters.date === "week" ? "Son 7 gün" : "Son 30 gün");
    if (workspaceFilters.size !== "all") labels.push(workspaceFilters.size === "small" ? "5 MB altı" : workspaceFilters.size === "medium" ? "5–100 MB" : "100 MB üstü");
    if (workspaceFilters.scope === "all") labels.push("Tüm klasörler");
    return labels;
  }, [activeFilter, workspaceFilters]);

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
    toggleSelectedId(id);
    if (!isDetailsOpen) setIsDetailsOpen(true);
  };

  const allItemIds = [...displayedFolders.map((f) => f.id), ...displayedFiles.map((f) => f.id)];
  const isAllSelected =
    allItemIds.length > 0 && allItemIds.every((id) => selectedIds.has(id));

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds(new Set());
    } else {
      replaceSelection(allItemIds);
    }
  };

  const getSelectedDriveItems = (): DriveItem[] => {
    const items: DriveItem[] = [];
    selectedIds.forEach((id) => {
      const folder = folders.find((candidate) => candidate.id === id);
      if (folder) {
        items.push({ id: folder.id, type: "folder", name: folder.name, parentId: folder.parent_id });
        return;
      }
      const file = files.find((candidate) => candidate.id === id);
      if (file) {
        items.push({ id: file.id, type: "file", name: file.display_name, parentId: file.folder_id, size: Number(file.size_bytes) });
      }
    });
    return items;
  };

  // Seçili Öğelerden Paylaşım Modalı Aç
  const handleOpenShareSelected = () => {
    const items = getSelectedDriveItems();

    if (items.length > 0) {
      setShareItemsToProcess(items);
      setIsCreateShareOpen(true);
    }
  };

  const handleOpenMoveSelected = () => {
    const items = getSelectedDriveItems();
    if (items.length > 0) setMoveItems(items);
  };

  // Tekil Öğeden Paylaşım Modalı Aç
  const handleOpenShareSingle = (item: { id: string; type: "file" | "folder"; name: string; size?: number }) => {
    setShareItemsToProcess([item]);
    setIsCreateShareOpen(true);
  };

  const handleDownload = async (file: DokFile) => {
    const result = await requestDokMutation<{ accessUrl?: string }>(`/api/dokumantasyon/files/${file.id}/access`);
    if (!result.ok || !result.data.accessUrl) {
      setActionError(result.ok ? "İndirme bağlantısı oluşturulamadı." : result.message);
      return;
    }
    const link = document.createElement("a");
    link.href = result.data.accessUrl;
    link.download = file.display_name;
    link.rel = "noopener";
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  // Çoklu Silme
  const handleMultiDeleteConfirm = async () => {
    const ids = Array.from(selectedIds);
    const failedIds: string[] = [];
    let completedCount = 0;

    for (const id of ids) {
      const folder = folders.find((f) => f.id === id);
      const endpoint = folder
        ? `/api/dokumantasyon/folders/${id}`
        : `/api/dokumantasyon/files/${id}`;
      const result = await requestDokMutation(endpoint, { method: "DELETE" });
      if (result.ok) {
        completedCount += 1;
      } else {
        failedIds.push(id);
      }
    }

    if (completedCount > 0) await fetchItems();
    setSelectedIds(new Set(failedIds));

    if (failedIds.length > 0) {
      throw new Error(`${ids.length} öğeden ${failedIds.length}'si silinemedi. Başarısız öğeler seçili bırakıldı.`);
    }
  };

  const waitForUploadMetadata = async (pathname: string) => {
    const retryDelays = [250, 500, 750, 1_000, 1_500, 2_000];

    for (const delay of retryDelays) {
      await new Promise((resolve) => window.setTimeout(resolve, delay));
      const result = await requestDokMutation<{ finalized?: boolean }>(
        `/api/dokumantasyon/upload/status?pathname=${encodeURIComponent(pathname)}`
      );

      if (result.ok && result.data.finalized) return;
      if (!result.ok && (result.code === "HTTP_401" || result.code === "HTTP_403")) {
        throw new Error(result.message);
      }
    }

    throw new Error("Dosya depoya yüklendi ancak liste kaydı doğrulanamadı. Lütfen listeyi yenileyin.");
  };

  const runQueueItem = async (item: UploadQueueItem) => {
    if (!item.file) return;
    const file = item.file;
    const targetFolderId = item.targetFolderId || null;

    setUploadQueue((previous) => previous.map((queueItem) => queueItem.id === item.id ? { ...queueItem, status: "authorizing", progress: 5, errorMessage: undefined } : queueItem));
    try {
      const intentResult = await requestDokMutation<{
        isLocalMode?: boolean;
        pathname: string;
        handleUploadUrl?: string;
        intentToken: string;
        mimeType?: string;
      }>("/api/dokumantasyon/upload/intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: file.name,
          size: file.size,
          mimeType: file.type || "application/octet-stream",
          folderId: targetFolderId,
        }),
      });
      if (!intentResult.ok) throw new Error(intentResult.message);
      const tokenData = intentResult.data;

      if (tokenData.isLocalMode) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("pathname", tokenData.pathname);
        formData.append("folderId", targetFolderId || "null");
        setUploadQueue((previous) => previous.map((queueItem) => queueItem.id === item.id ? { ...queueItem, progress: 60 } : queueItem));
        const localResult = await requestDokMutation("/api/dokumantasyon/upload/local", { method: "POST", body: formData });
        if (!localResult.ok) throw new Error(localResult.message);
      } else {
        if (!tokenData.handleUploadUrl) throw new Error("Yükleme kontrol uç noktası bulunamadı.");
        setUploadQueue((previous) => previous.map((queueItem) => queueItem.id === item.id ? { ...queueItem, status: "uploading", progress: 10 } : queueItem));
        await uploadPresigned(tokenData.pathname, file, {
          access: "private",
          handleUploadUrl: tokenData.handleUploadUrl,
          clientPayload: JSON.stringify({ intentToken: tokenData.intentToken }),
          contentType: tokenData.mimeType,
          multipart: file.size >= 5 * 1024 * 1024,
          onUploadProgress: ({ percentage }) => {
            setUploadQueue((previous) => previous.map((queueItem) => queueItem.id === item.id ? { ...queueItem, progress: Math.min(90, Math.max(10, Math.round(percentage * 0.8 + 10))) } : queueItem));
          },
        });
        setUploadQueue((previous) => previous.map((queueItem) => queueItem.id === item.id ? { ...queueItem, status: "finalizing", progress: 92 } : queueItem));
      }

      setUploadQueue((previous) => previous.map((queueItem) => queueItem.id === item.id ? { ...queueItem, status: "confirming_metadata", progress: 96 } : queueItem));
      await waitForUploadMetadata(tokenData.pathname);
      setUploadQueue((previous) => previous.map((queueItem) => queueItem.id === item.id ? { ...queueItem, status: "completed", progress: 100 } : queueItem));
    } catch (error: unknown) {
      console.error("Yükleme hatası:", error);
      const errorMessage = error instanceof Error ? error.message : "Yüklenemedi";
      setUploadQueue((previous) => previous.map((queueItem) => queueItem.id === item.id ? { ...queueItem, status: "error", errorMessage } : queueItem));
    }
  };

  const queueUploadEntries = async (entries: Array<{ file: File; folderId: string | null; relativePath?: string }>) => {
    if (entries.length === 0) return;
    const queueItems: UploadQueueItem[] = entries.map((entry, index) => ({
      id: `${Date.now()}_${index}_${entry.file.name}`,
      name: entry.file.name,
      size: entry.file.size,
      progress: 0,
      status: "queued",
      file: entry.file,
      targetFolderId: entry.folderId,
      relativePath: entry.relativePath,
    }));
    setUploadQueue((previous) => [...previous, ...queueItems]);
    for (const item of queueItems) await runQueueItem(item);
    await fetchItems();
  };

  // 5. Dosya Yükleme Süreci
  const uploadFiles = async (fileList: FileList | File[]) => {
    await queueUploadEntries(Array.from(fileList).map((file) => ({ file, folderId: currentFolderId })));
  };

  const handleRetryUpload = async (itemId: string) => {
    const item = uploadQueue.find((queueItem) => queueItem.id === itemId);
    if (!item?.file || item.status !== "error") return;
    await runQueueItem(item);
    await fetchItems();
  };

  const uploadFolder = async (fileList: FileList | File[]) => {
    const createdFolderIds: string[] = [];
    try {
      const plan = makeFolderUploadPlan(fileList);
      if (plan.length === 0) return;
      const treeResponse = await fetch("/api/dokumantasyon/folders/tree");
      const treePayload = await treeResponse.json().catch(() => ({}));
      if (!treeResponse.ok) throw new Error(treePayload.error || "Klasör ağacı yüklenemedi.");

      const knownFolders = new Map<string, string>();
      for (const folder of treePayload.folders as DokFolder[]) {
        knownFolders.set(`${folder.parent_id || "root"}:${folder.name.toLocaleLowerCase("tr")}`, folder.id);
      }
      const sortedDirectoryPaths = [...new Set(plan.map((entry) => entry.directories.join("/")).filter(Boolean))]
        .sort((left, right) => left.split("/").length - right.split("/").length);
      const directoryIds = new Map<string, string | null>([["", currentFolderId]]);

      for (const directoryPath of sortedDirectoryPaths) {
        const segments = directoryPath.split("/");
        const parentPath = segments.slice(0, -1).join("/");
        const parentId = directoryIds.get(parentPath);
        if (parentId === undefined) throw new Error("Klasör hiyerarşisi çözümlenemedi.");
        const name = segments[segments.length - 1];
        const knownId = knownFolders.get(`${parentId || "root"}:${name.toLocaleLowerCase("tr")}`);
        if (knownId) {
          directoryIds.set(directoryPath, knownId);
          continue;
        }
        const result = await requestDokMutation<{ folder: DokFolder }>("/api/dokumantasyon/folders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, parentId }),
        });
        if (!result.ok) throw new Error(result.message);
        directoryIds.set(directoryPath, result.data.folder.id);
        knownFolders.set(`${parentId || "root"}:${name.toLocaleLowerCase("tr")}`, result.data.folder.id);
        createdFolderIds.push(result.data.folder.id);
      }

      await queueUploadEntries(plan.map((entry: FolderUploadEntry) => ({
        file: entry.file,
        folderId: directoryIds.get(entry.directories.join("/")) || currentFolderId,
        relativePath: entry.relativePath,
      })));
    } catch (error: unknown) {
      // Dosya yüklemesine başlanmadan hiyerarşi kurulamazsa, bu çağrının oluşturduğu boş klasörleri geri al.
      await Promise.all([...createdFolderIds].reverse().map((id) => requestDokMutation(`/api/dokumantasyon/folders/${id}`, { method: "DELETE" })));
      const message = error instanceof Error ? error.message : "Klasör yüklenemedi.";
      setActionError(`${message} Oluşturulan boş klasörler geri alındı.`);
      await fetchItems();
    }
  };

  const openFolderPicker = () => {
    if (!supportsFolderUpload) {
      setActionError("Bu tarayıcı klasör seçimini desteklemiyor. Birden çok dosya seçerek yüklemeye devam edebilirsiniz.");
      return;
    }
    // İkinci kalıcı file input'u P0 upload otomasyonunu ve form semantiğini bozmasın.
    const input = document.createElement("input");
    input.type = "file";
    input.multiple = true;
    input.setAttribute("webkitdirectory", "");
    input.setAttribute("directory", "");
    input.addEventListener("change", () => {
      if (input.files) void uploadFolder(input.files);
      input.remove();
    }, { once: true });
    input.addEventListener("cancel", () => input.remove(), { once: true });
    document.body.appendChild(input);
    input.click();
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
      void uploadFiles(e.dataTransfer.files);
    }
  };

  const handleWorkspaceFiltersChange = (filters: WorkspaceFilters) => {
    setWorkspaceFilters(filters);
    if (filters.starredOnly) setActiveFilter("starred");
    else if (activeFilter === "starred" || activeFilter === "cad" || activeFilter === "pdf" || activeFilter === "image") setActiveFilter("all");
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (window.innerWidth < 1024) return;
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea, select, [contenteditable='true']")) return;
      const dialogIsOpen = isSearchOpen || isNewFolderOpen || renameItem !== null || moveItems.length > 0 || deleteItem !== null || isMultiDeleteOpen || isCreateShareOpen || isTrashOpen || isFilterSheetOpen;
      if (event.key === "/" && !event.ctrlKey && !event.metaKey && !event.altKey) {
        event.preventDefault();
        setIsSearchOpen(true);
      } else if (event.key === "Delete" && selectedIds.size > 0 && !dialogIsOpen) {
        event.preventDefault();
        setIsMultiDeleteOpen(true);
      } else if (event.key === "Escape" && selectedIds.size > 0 && !dialogIsOpen) {
        setSelectedIds(new Set());
      } else if (event.key === "Enter" && selectedIds.size === 1 && !dialogIsOpen) {
        const selectedFile = files.find((file) => selectedIds.has(file.id));
        if (selectedFile) {
          event.preventDefault();
          router.push(`/dokumantasyon/dosya/${selectedFile.id}`);
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [deleteItem, files, isCreateShareOpen, isFilterSheetOpen, isMultiDeleteOpen, isNewFolderOpen, isSearchOpen, isTrashOpen, moveItems.length, renameItem, router, selectedIds, setSelectedIds]);

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative flex min-h-[calc(100dvh-10rem)] w-full overflow-hidden rounded-2xl border border-border/80 sm:min-h-[calc(100dvh-11rem)] ${styles.workspace}`}
    >
      {/* Gizli Dosya Girişi */}
      <input
        type="file"
        ref={fileInputRef}
        multiple
        onChange={(e) => {
          if (e.target.files) void uploadFiles(e.target.files);
          e.currentTarget.value = "";
        }}
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
            handleNavigationFilter(f);
            if (f !== "all" && currentFolderId) setCurrentFolderId(null);
          }}
          onNewFolder={() => setIsNewFolderOpen(true)}
          onUploadClick={() => fileInputRef.current?.click()}
          onOpenActiveShares={() => setIsActiveSharesOpen(true)}
          onOpenTrash={() => setIsTrashOpen(true)}
          totalFilesCount={files.length}
          totalFoldersCount={folders.length}
          totalSizeBytes={totalSizeBytes}
          starredCount={starredCount}
          className={styles.sidebar}
        />
      </div>

      {isSidebarOpenMobile && (
        <div className="fixed inset-0 z-50 lg:hidden" onClick={() => setIsSidebarOpenMobile(false)}>
          <div aria-hidden="true" className="absolute inset-0 bg-black/55" />
          <div
            ref={mobileSidebarRef}
            id="dok-mobile-sidebar"
            role="dialog"
            aria-modal="true"
            aria-label="Dokümantasyon gezintisi"
            tabIndex={-1}
            onClick={(event) => event.stopPropagation()}
            className={`relative z-10 h-full w-72 max-w-[86vw] shadow-2xl outline-none ${styles.sidebar}`}
          >
            <DriveSidebar
              activeFilter={activeFilter}
              onFilterChange={(filter) => {
                handleNavigationFilter(filter);
                if (filter !== "all" && currentFolderId) setCurrentFolderId(null);
              }}
              onNewFolder={() => setIsNewFolderOpen(true)}
              onUploadClick={() => fileInputRef.current?.click()}
              onOpenActiveShares={() => setIsActiveSharesOpen(true)}
              onOpenTrash={() => setIsTrashOpen(true)}
              totalFilesCount={files.length}
              totalFoldersCount={folders.length}
              totalSizeBytes={totalSizeBytes}
              starredCount={starredCount}
              className="h-full w-full border-r border-border bg-card"
              onNavigate={() => setIsSidebarOpenMobile(false)}
            />
          </div>
        </div>
      )}

      {/* 2. Ana Çalışma Alanı (Center Content) */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Üst Gezinti ve Kontrol Çubuğu */}
        <div className={`flex min-w-0 items-center gap-2 border-b p-2.5 sm:gap-3 sm:p-3 ${styles.commandBar}`}>
          {/* Breadcrumb ve Mobil Menü */}
          <div className="flex min-w-0 flex-1 items-center gap-1 text-xs sm:text-sm">
            <Button
              size="sm"
              variant="ghost"
              ref={mobileMenuButtonRef}
              onClick={() => setIsSidebarOpenMobile((m) => !m)}
              className="h-11 w-11 shrink-0 p-0 lg:hidden"
              aria-expanded={isSidebarOpenMobile}
              aria-controls="dok-mobile-sidebar"
              aria-label="Dokümantasyon menüsünü aç"
            >
              <Menu className="h-4 w-4" />
            </Button>

            <button
              onClick={() => {
                setActiveFilter("all");
                setCurrentFolderId(null);
              }}
              className="hidden items-center gap-1.5 font-medium text-muted-foreground transition-colors hover:text-foreground sm:flex"
            >
              <HardDrive className="h-4 w-4 text-amber-500 shrink-0" />
              <span>Kök Dizin</span>
            </button>

            {currentFolderId && breadcrumbs.length > 1 && (
              <button
                onClick={() => setCurrentFolderId(breadcrumbs[breadcrumbs.length - 2]?.id ?? null)}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground sm:hidden"
                aria-label="Üst klasöre git"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            )}

            <div className="flex min-w-0 items-center gap-1.5 sm:hidden">
              <HardDrive className="h-4 w-4 shrink-0 text-amber-500" />
              <span className="shrink-0 text-muted-foreground">Kök</span>
              {breadcrumbs.length > 2 && <span className="text-muted-foreground/60">/ …</span>}
              {breadcrumbs.length > 1 && (
                <span className="truncate font-semibold text-foreground">/ {breadcrumbs[breadcrumbs.length - 1].name}</span>
              )}
            </div>

            <div className="hidden min-w-0 items-center gap-2 sm:flex">
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
          </div>

          {/* Sağ Kontroller: Arama, Görünüm Modu, Detay Toggle */}
          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsSearchOpen(true)}
              className="h-11 w-11 border-border/80 p-0 text-xs hover:bg-secondary sm:h-9 sm:w-auto sm:px-3"
            >
              <Search className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="hidden sm:inline">Ara...</span>
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsFilterSheetOpen(true)}
              className="h-11 w-11 border-border/80 p-0 text-xs hover:bg-secondary sm:h-9 sm:w-auto sm:px-3"
              aria-label="Dosya filtreleri"
            >
              <SlidersHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="hidden sm:inline">Filtre</span>
            </Button>

            <Button
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="h-11 w-11 shrink-0 bg-amber-500 p-0 text-zinc-950 hover:bg-amber-400 sm:h-9 sm:w-auto sm:px-3"
              aria-label="Dosya yükle"
            >
              <Upload className="h-4 w-4" />
              <span className="hidden sm:inline">Yükle</span>
            </Button>

            {supportsFolderUpload && (
              <Button
                size="sm"
                variant="outline"
                onClick={openFolderPicker}
                className="h-11 w-11 border-border/80 p-0 text-xs hover:bg-secondary sm:h-9 sm:w-auto sm:px-3"
                aria-label="Klasör yükle"
              >
                <Folder className="h-4 w-4 text-amber-500" />
                <span className="hidden sm:inline">Klasör</span>
              </Button>
            )}

            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsNewFolderOpen(true)}
              className="hidden h-9 gap-1.5 border-border/80 text-xs lg:inline-flex"
            >
              <FolderPlus className="h-3.5 w-3.5 text-amber-500" />
              <span>Klasör</span>
            </Button>

            <div className="hidden items-center rounded-lg border border-border/80 bg-secondary/30 p-0.5 sm:flex">
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
              className={`hidden h-8 w-8 p-0 lg:inline-flex ${isDetailsOpen ? "bg-amber-500/20 text-amber-500" : "text-muted-foreground hover:text-foreground"}`}
              title="Öğe Bilgi ve Detay Çekmecesi"
            >
              <Info className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {activeFilterLabels.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto border-b border-border/60 px-3 py-2 text-[11px] text-muted-foreground sm:px-4">
            <span className="shrink-0 font-semibold">Etkin filtreler:</span>
            {activeFilterLabels.map((label) => <span key={label} className="shrink-0 rounded-full bg-secondary px-2 py-1 text-foreground">{label}</span>)}
            <button
              type="button"
              onClick={() => {
                setActiveFilter("all");
                setWorkspaceFilters(DEFAULT_WORKSPACE_FILTERS);
              }}
              className="shrink-0 font-semibold text-amber-500 hover:underline"
            >
              Temizle
            </button>
          </div>
        )}

        {/* Çoklu Seçim Yüzen Aksiyon Çubuğu */}
        {selectedIds.size > 0 && (
          <div className={`fixed inset-x-2 bottom-2 z-[60] flex items-center justify-between gap-2 rounded-xl border border-amber-500/30 bg-card/95 px-3 py-2 text-xs font-medium text-foreground shadow-xl backdrop-blur-lg animate-in fade-in lg:static lg:rounded-none lg:border-x-0 lg:border-t-0 lg:bg-amber-500/10 lg:px-4 lg:shadow-none ${styles.mobileSelectionBar}`}>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <CheckSquare className="h-4 w-4 text-amber-500" />
              <span className="font-bold">{selectedIds.size}</span>
              <span>öğe seçildi</span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleOpenMoveSelected}
                className="h-10 gap-1.5 border-purple-500/40 px-2 text-xs text-purple-500 hover:bg-purple-500/10 lg:h-7"
              >
                <Move className="h-3.5 w-3.5" />
                <span>Taşı</span>
              </Button>

              <Button
                size="sm"
                onClick={handleOpenShareSelected}
                className="h-10 gap-1.5 bg-amber-500 px-2 text-xs font-bold text-zinc-950 hover:bg-amber-400 lg:h-7"
              >
                <Link2 className="h-3.5 w-3.5" />
                <span>Link Oluştur</span>
              </Button>

              <Button
                size="sm"
                variant="destructive"
                onClick={() => setIsMultiDeleteOpen(true)}
                className="h-10 gap-1 px-2 text-xs lg:h-7"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Sil</span>
              </Button>

              <Button
                size="sm"
                variant="ghost"
                onClick={() => setSelectedIds(new Set())}
                className="hidden h-10 text-xs sm:inline-flex lg:h-7"
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

        {actionError && (
          <div role="alert" className="mx-4 mt-4 flex items-start justify-between gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">
            <span>{actionError}</span>
            <button type="button" onClick={() => setActionError(null)} className="shrink-0 font-semibold text-red-200 hover:text-foreground">Kapat</button>
          </div>
        )}

        {/* Ana İçerik Alanı: Liste veya Grid */}
        <div className={`flex-1 overflow-auto p-3 pb-24 sm:p-4 sm:pb-24 lg:pb-4 ${styles.viewport}`}>
          {listError ? (
            <div role="alert" className="mx-auto flex max-w-lg flex-col items-center justify-center py-24 text-center">
              <AlertTriangle className="h-9 w-9 text-red-500" />
              <h2 className="mt-4 text-sm font-bold text-foreground">
                {listError.kind === "auth" ? "Oturum gerekli" : "Dosyalar listelenemedi"}
              </h2>
              <p className="mt-2 text-xs text-muted-foreground">{listError.message}</p>
              <p className="mt-1 text-xs text-muted-foreground">Konum: {breadcrumbs.map((item) => item.name).join(" / ")}</p>
              {listError.kind !== "auth" && (
                <Button size="sm" variant="outline" onClick={fetchItems} className="mt-4">
                  Tekrar dene
                </Button>
              )}
            </div>
          ) : loading ? (
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
                  : activeFilter === "recent"
                  ? "Henüz açılmış dosya yok."
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
            <div className={`overflow-hidden rounded-2xl border ${styles.list}`}>
              <div className="hidden grid-cols-12 items-center border-b border-border/80 bg-secondary/40 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground sm:grid">
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
                  const isStarred = Boolean(folder.starred_at);

                  return (
                    <div
                      key={folder.id}
                      onClick={() => setCurrentFolderId(folder.id)}
                      className={`grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-2 px-3 py-3 text-sm transition-colors cursor-pointer sm:grid-cols-12 sm:gap-x-0 sm:px-4 sm:py-3 ${
                        isSelected ? "bg-amber-500/10" : "hover:bg-secondary/60"
                      }`}
                    >
                      <div className="col-span-2 flex min-w-0 items-center gap-2 sm:col-span-6 sm:gap-3 sm:pr-2">
                        <button
                          onClick={(e) => handleToggleSelect(folder.id, e)}
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground sm:h-auto sm:w-auto"
                        >
                          {isSelected ? (
                            <CheckSquare className="h-4 w-4 text-amber-500" />
                          ) : (
                            <Square className="h-4 w-4" />
                          )}
                        </button>

                        <button
                          onClick={(e) => void toggleStar("folder", folder.id, isStarred, e)}
                          aria-label={isStarred ? "Yıldızı kaldır" : "Yıldızla"}
                          className="hidden shrink-0 text-muted-foreground hover:text-amber-400 sm:block"
                        >
                          <Star
                            className={`h-4 w-4 ${isStarred ? "fill-amber-400 text-amber-400" : ""}`}
                          />
                        </button>

                        <Folder className="h-5 w-5 shrink-0 text-amber-500" />
                        <div className="min-w-0">
                          <span className="block truncate font-medium text-foreground">{folder.name}</span>
                          <span className="mt-0.5 block text-[11px] text-muted-foreground sm:hidden">Klasör • {formatDate(folder.updated_at || folder.created_at)}</span>
                        </div>
                      </div>

                      <div className="hidden sm:col-span-2 sm:block text-xs text-muted-foreground">
                        —
                      </div>

                      <div className="col-span-3 hidden md:block text-xs text-muted-foreground">
                        {formatDate(folder.updated_at || folder.created_at)}
                      </div>

                      <div className="col-span-1 flex items-center justify-end sm:col-span-4 md:col-span-1">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              onClick={(e) => e.stopPropagation()}
                              className="flex h-11 w-11 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground sm:h-auto sm:w-auto sm:p-1.5"
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
                                setMoveItems([{ id: folder.id, name: folder.name, type: "folder", parentId: folder.parent_id }]);
                              }}
                              className="flex items-center gap-2 cursor-pointer text-xs text-purple-500 focus:text-purple-500"
                            >
                              <Move className="h-3.5 w-3.5 text-purple-500" />
                              <span>Taşı</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => void toggleStar("folder", folder.id, isStarred, e)}
                              className="flex items-center gap-2 cursor-pointer text-xs"
                            >
                              <Star className={`h-3.5 w-3.5 ${isStarred ? "fill-amber-400 text-amber-400" : "text-amber-400"}`} />
                              <span>{isStarred ? "Yıldızı Kaldır" : "Yıldızla"}</span>
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
                  const isStarred = Boolean(file.starred_at);

                  return (
                    <div
                      key={file.id}
                      className={`grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-2 px-3 py-3 text-sm transition-colors sm:grid-cols-12 sm:gap-x-0 sm:px-4 sm:py-3 ${
                        isSelected ? "bg-amber-500/10" : "hover:bg-secondary/60"
                      }`}
                    >
                      <div className="col-span-2 flex min-w-0 items-center gap-2 sm:col-span-6 sm:gap-3 sm:pr-2">
                        <button
                          onClick={(e) => handleToggleSelect(file.id, e)}
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground sm:h-auto sm:w-auto"
                          aria-label="Dosya Seç"
                        >
                          {isSelected ? (
                            <CheckSquare className="h-4 w-4 text-amber-500" />
                          ) : (
                            <Square className="h-4 w-4" />
                          )}
                        </button>

                        <button
                          onClick={(e) => void toggleStar("file", file.id, isStarred, e)}
                          className="hidden shrink-0 text-muted-foreground hover:text-amber-400 sm:block"
                          aria-label={isStarred ? "Yıldızı kaldır" : "Yıldızla"}
                        >
                          <Star
                            className={`h-4 w-4 ${isStarred ? "fill-amber-400 text-amber-400" : ""}`}
                          />
                        </button>

                        <Link
                          href={`/dokumantasyon/dosya/${file.id}`}
                          className="flex items-center gap-3 min-w-0 flex-1 group/link"
                        >
                          <span className="shrink-0">{getFileIcon(file.extension)}</span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate font-medium text-foreground group-hover/link:text-amber-500 group-hover/link:underline">{file.display_name}</span>
                            <span className="mt-0.5 block text-[11px] text-muted-foreground sm:hidden">{file.extension.toUpperCase()} • {formatBytes(Number(file.size_bytes))} • {formatDate(file.updated_at || file.created_at)}</span>
                          </span>
                        </Link>
                      </div>

                      <div className="hidden sm:col-span-2 sm:block text-xs font-mono text-muted-foreground">
                        {formatBytes(Number(file.size_bytes))}
                      </div>

                      <div className="col-span-3 hidden md:block text-xs text-muted-foreground">
                        {formatDate(file.updated_at || file.created_at)}
                      </div>

                      <div className="col-span-1 flex items-center justify-end sm:col-span-4 md:col-span-1">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              onClick={(e) => e.stopPropagation()}
                              className="flex h-11 w-11 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground sm:h-auto sm:w-auto sm:p-1.5"
                              aria-label="Dosya İşlemleri"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48 bg-card border-border shadow-xl">
                            <DropdownMenuItem asChild>
                              <Link
                                href={`/dokumantasyon/dosya/${file.id}`}
                                className="flex items-center gap-2 cursor-pointer text-xs font-medium text-amber-500 focus:text-amber-500"
                              >
                                <Eye className="h-3.5 w-3.5 text-amber-500" />
                                <span>Önizle</span>
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link
                                href={`/dokumantasyon/dosya/${file.id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 cursor-pointer text-xs"
                              >
                                <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                                <span>Yeni Sekmede Aç</span>
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(event) => {
                                event.stopPropagation();
                                void handleDownload(file);
                              }}
                              className="flex items-center gap-2 cursor-pointer text-xs"
                            >
                              <Download className="h-3.5 w-3.5 text-muted-foreground" />
                              <span>İndir</span>
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
                                setMoveItems([{ id: file.id, name: file.display_name, type: "file", parentId: file.folder_id }]);
                              }}
                              className="flex items-center gap-2 cursor-pointer text-xs text-purple-500 focus:text-purple-500"
                            >
                              <Move className="h-3.5 w-3.5 text-purple-500" />
                              <span>Taşı</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => void toggleStar("file", file.id, isStarred, e)}
                              className="flex items-center gap-2 cursor-pointer text-xs"
                            >
                              <Star className={`h-3.5 w-3.5 ${isStarred ? "fill-amber-400 text-amber-400" : "text-amber-400"}`} />
                              <span>{isStarred ? "Yıldızı Kaldır" : "Yıldızla"}</span>
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
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-[repeat(auto-fill,minmax(170px,1fr))] xl:grid-cols-[repeat(auto-fill,minmax(190px,1fr))]">
                    {displayedFolders.map((folder) => {
                      const isSelected = selectedIds.has(folder.id);
                      const isStarred = Boolean(folder.starred_at);

                      return (
                        <div
                          key={folder.id}
                          onClick={() => setCurrentFolderId(folder.id)}
                          className={`group relative flex min-h-40 flex-col justify-between rounded-2xl border p-3.5 transition-all hover:shadow-md cursor-pointer ${styles.card} ${
                            isSelected
                              ? "border-amber-500 bg-amber-500/10"
                              : "border-border bg-card hover:border-border/80 hover:bg-secondary/40"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <Folder className="h-7 w-7 text-amber-500" />
                            <button
                              onClick={(e) => void toggleStar("folder", folder.id, isStarred, e)}
                              aria-label={isStarred ? "Yıldızı kaldır" : "Yıldızla"}
                              className="text-muted-foreground hover:text-amber-400"
                            >
                              <Star className={`h-3.5 w-3.5 ${isStarred ? "fill-amber-400 text-amber-400" : ""}`} />
                            </button>
                          </div>

                          <div className="mt-3 min-w-0">
                            <span className="block line-clamp-2 text-xs font-bold text-foreground">{folder.name}</span>
                            <span className="mt-1 block text-[10px] text-muted-foreground">Klasör</span>
                          </div>
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
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-[repeat(auto-fill,minmax(170px,1fr))] xl:grid-cols-[repeat(auto-fill,minmax(190px,1fr))]">
                    {displayedFiles.map((file) => {
                      const isSelected = selectedIds.has(file.id);
                      const isStarred = Boolean(file.starred_at);

                      return (
                        <div
                          key={file.id}
                          className={`group relative flex min-h-40 flex-col justify-between rounded-2xl border p-3.5 transition-all hover:shadow-md ${styles.card} ${
                            isSelected
                              ? "border-amber-500 bg-amber-500/10"
                              : "border-border bg-card hover:border-border/80 hover:bg-secondary/40"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <Link
                              href={`/dokumantasyon/dosya/${file.id}`}
                              className="shrink-0"
                            >
                              {getFileIcon(file.extension)}
                            </Link>
                            <button
                              onClick={(e) => void toggleStar("file", file.id, isStarred, e)}
                              aria-label={isStarred ? "Yıldızı kaldır" : "Yıldızla"}
                              className="text-muted-foreground hover:text-amber-400"
                            >
                              <Star className={`h-3.5 w-3.5 ${isStarred ? "fill-amber-400 text-amber-400" : ""}`} />
                            </button>
                          </div>

                          <div className="mt-3 min-w-0 space-y-1">
                            <Link
                              href={`/dokumantasyon/dosya/${file.id}`}
                              className="block line-clamp-2 text-xs font-bold text-foreground hover:text-amber-500 hover:underline"
                            >
                              {file.display_name}
                            </Link>
                            <span className="block text-[10px] font-mono text-muted-foreground">
                              {file.extension.toUpperCase()} • {formatBytes(Number(file.size_bytes))}
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
        <>
          <DriveDetailsDrawer
            selectedItem={selectedItemForDrawer}
            onClose={() => setIsDetailsOpen(false)}
            onShare={(item) => handleOpenShareSingle(item)}
            onRename={(item) => setRenameItem({ ...item, type: item.type })}
            onDelete={(item) => setDeleteItem({ ...item, type: item.type })}
          />
          <MobileDetailsSheet
            selectedItem={selectedItemForDrawer}
            onClose={() => setIsDetailsOpen(false)}
            onShare={(item) => handleOpenShareSingle(item)}
            onRename={(item) => setRenameItem({ ...item, type: item.type })}
            onDelete={(item) => setDeleteItem({ ...item, type: item.type })}
          />
        </>
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
        isOpen={moveItems.length > 0}
        items={moveItems}
        onClose={() => setMoveItems([])}
        onSuccess={fetchItems}
        onPartialFailure={(failedIds) => setSelectedIds(new Set(failedIds))}
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
            const result = await requestDokMutation(endpoint, { method: "DELETE" });
            if (!result.ok) throw new Error(result.message);
            await fetchItems();
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

      <WorkspaceFilterSheet
        isOpen={isFilterSheetOpen}
        filters={workspaceFilters}
        onChange={handleWorkspaceFiltersChange}
        onClose={() => setIsFilterSheetOpen(false)}
      />

      {/* Yükleme İlerleme Bildirimi */}
      <UploadProgressToast
        queue={uploadQueue}
        onDismiss={() => setUploadQueue([])}
        onRetry={(itemId) => void handleRetryUpload(itemId)}
      />
    </div>
  );
}
