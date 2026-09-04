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
  Clock,
  Compass,
  FileText,
  Image as ImageIcon,
  Layers,
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
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { uploadPresigned } from "@vercel/blob/client";
import { requestDokMutation } from "@/lib/dokumantasyon/client-mutation";
import { deriveExplorerView, reconcileSelection } from "./drive-v3/explorer-derive";
import { executeBulkTrash, executeBulkMove, executeBulkStar, BulkItem } from "./drive-v3/bulk-operations";
import { useDriveSelection } from "./drive-v3/use-drive-selection";
import { useVirtualExplorer } from "./drive-v3/use-virtual-explorer";
import {
  DokQueryProvider,
  useDokItemsQuery,
  dokQueryClient,
  dokKeys,
  insertPendingFolderInCache,
  replacePendingFolderInCache,
  removePendingFolderFromCache,
  updateItemNameInCache,
  updateItemStarInCache,
  removeItemsFromCache,
  insertUploadedFileInCache,
  acquireMutationScope,
  releaseMutationScope,
} from "./drive-v3/query-client";
import {
  calculateGridMetrics,
  DRIVE_GRID_MIN_CARD_WIDTH,
  DRIVE_GRID_GAP_X,
  DRIVE_GRID_GAP_Y,
  DRIVE_GRID_ROW_HEIGHT,
} from "./drive-v3/drive-metrics";
import {
  registerDraggableItem,
  registerFolderDropTarget,
  registerContainerAutoScroll,
} from "./drive-v3/pdd-integration";
import { createLongPressController } from "./drive-v3/mobile-gesture-engine";
import { CommandRegistry, CommandId, CommandContext, CommandTargetItem } from "./drive-v3/command-registry";
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
  return (
    <DokQueryProvider>
      <DokumantasyonFileManagerInner />
    </DokQueryProvider>
  );
}

function DokumantasyonFileManagerInner() {
  const router = useRouter();
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return new URLSearchParams(window.location.search).get("folderId") || null;
    }
    return null;
  });

  // Drive UX Durumları
  const [activeFilter, setActiveFilter] = useState<DriveNavFilter>("all");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isSidebarOpenMobile, setIsSidebarOpenMobile] = useState(false);
  const [workspaceFilters, setWorkspaceFilters] = useState<WorkspaceFilters>(DEFAULT_WORKSPACE_FILTERS);
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [starMigrationVersion, setStarMigrationVersion] = useState(0);

  // Sıralama & Gruplama Durumları
  const [sortBy, setSortBy] = useState<"name" | "date" | "size" | "type">("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [groupBy, setGroupBy] = useState<"none" | "type" | "date" | "size">("none");

  // TanStack Query Deterministik Sunucu Durumu (Zero-F5 Cache Engine)
  const navigationType = activeFilter === "cad" || activeFilter === "pdf" || activeFilter === "image" ? activeFilter : workspaceFilters.type;
  const activeCollection = activeFilter === "recent" ? "recent" : activeFilter === "starred" || workspaceFilters.starredOnly ? "starred" : "none";

  const currentQueryKey = useMemo(() => {
    return dokKeys.items(currentFolderId, {
      collection: activeCollection,
      type: navigationType,
      date: workspaceFilters.date,
      size: workspaceFilters.size,
      sortBy,
      sortOrder,
    });
  }, [currentFolderId, activeCollection, navigationType, workspaceFilters.date, workspaceFilters.size, sortBy, sortOrder]);

  const {
    data: queryData,
    isLoading: isQueryLoading,
    isError: isQueryError,
    error: queryErrorObj,
    refetch: refetchItems,
  } = useDokItemsQuery({
    folderId: currentFolderId,
    collection: activeCollection,
    typeFilter: navigationType,
    dateFilter: workspaceFilters.date,
    sizeFilter: workspaceFilters.size,
    sortBy,
    sortOrder,
  });

  const folders = useMemo(() => queryData?.folders ?? [], [queryData?.folders]);
  const files = useMemo(() => queryData?.files ?? [], [queryData?.files]);
  const currentFolder = queryData?.folder ?? null;
  const breadcrumbs = queryData?.breadcrumbs ?? [{ id: null, name: "Kök Dizin" }];
  const starredCount = Number(queryData?.summary?.starredCount ?? 0);
  const loading = isQueryLoading;
  const listError: ListError | null = useMemo(() => {
    if (!isQueryError) return null;
    const status = (queryErrorObj as unknown as { status?: number })?.status;
    return {
      kind: status === 401 ? "auth" : "network",
      message: queryErrorObj instanceof Error ? queryErrorObj.message : "Dosyalar listelenemedi",
    };
  }, [isQueryError, queryErrorObj]);

  // 3. Sıralanmış ve Filtrelenmiş Dosya ve Klasörler (Tek Deterministik Comparator & Derive Motoru)
  const {
    displayedFolders,
    displayedFiles,
    groupedBuckets,
    visibleOrderedIds,
  } = useMemo(() => {
    return deriveExplorerView(
      { folders, files },
      {
        sortBy,
        sortOrder,
        groupBy,
        typeFilter: activeFilter === "cad" || activeFilter === "pdf" || activeFilter === "image" ? activeFilter : workspaceFilters.type,
        dateFilter: workspaceFilters.date,
        sizeFilter: workspaceFilters.size,
        starredOnly: activeFilter === "starred" || workspaceFilters.starredOnly,
        collection: activeFilter === "recent" ? "recent" : activeFilter === "starred" || workspaceFilters.starredOnly ? "starred" : "none",
      }
    );
  }, [folders, files, sortBy, sortOrder, groupBy, activeFilter, workspaceFilters]);

  // Single Scroll Container Ref (Unified for Virtualization, Marquee, Keyboard, Auto-scroll)
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  // Flat list of all visible items (folders first, then files)
  const allExplorerItems = useMemo(() => {
    return [...displayedFolders, ...displayedFiles];
  }, [displayedFolders, displayedFiles]);

  // Virtualization Engine (TanStack Virtual V3.1)
  const {
    containerWidth,
    gridMetrics,
    handleScroll: handleVirtualScroll,
    listVirtualizer,
    gridVirtualizer,
  } = useVirtualExplorer({
    items: allExplorerItems,
    viewMode,
    folderId: currentFolderId,
    filter: activeFilter,
    overscan: 6,
    scrollContainerRef,
  });

  // Çoklu Seçim & Marquee & Klavye Motoru (Drive V3)
  const {
    selectedIds,
    setSelectedIds,
    toggleSelectedId,
    replaceSelection,
    anchorId,
    focusedId,
    marqueeBox,
    handleItemClick,
    handleItemContextMenu,
    selectAll,
    clearSelection,
    handleKeyDown,
    containerPointerHandlers,
  } = useDriveSelection({
    visibleOrderedIds,
    viewMode,
    gridMetrics,
    scrollContainerRef,
  });

  const [dragOverFolderId, setDragOverFolderId] = useState<string | null>(null);

  // Auto-scroll for container during drag
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    return registerContainerAutoScroll(el);
  }, []);
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

  // URL & Tarayıcı Geçmişi ile Klasör Konumu Senkronizasyonu
  const navigateToFolder = useCallback((folderId: string | null) => {
    setCurrentFolderId(folderId);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      if (folderId) {
        url.searchParams.set("folderId", folderId);
      } else {
        url.searchParams.delete("folderId");
      }
      if (url.search !== window.location.search) {
        window.history.pushState({ folderId }, "", url.toString());
      }
    }
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      const searchParams = new URLSearchParams(window.location.search);
      const urlFolderId = searchParams.get("folderId") || null;
      setCurrentFolderId(urlFolderId);
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

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

  // 2. Klasör İçeriğini Yenile (TanStack Query Cache Reconciler)
  const fetchItems = useCallback(async () => {
    await refetchItems();
  }, [refetchItems]);

  useEffect(() => {
    if (starMigrationVersion > 0) void refetchItems();
  }, [refetchItems, starMigrationVersion]);


  const toggleStar = async (
    type: "file" | "folder",
    id: string,
    isStarred: boolean,
    event?: React.MouseEvent
  ) => {
    event?.stopPropagation();
    const nextStarred = !isStarred;
    updateItemStarInCache(dokQueryClient, currentQueryKey, id, type, nextStarred);

    try {
      const url = type === "folder" ? `/api/dokumantasyon/folders/${id}` : `/api/dokumantasyon/files/${id}`;
      const res = await requestDokMutation(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isStarred: nextStarred }),
      });
      if (!res.ok) {
        updateItemStarInCache(dokQueryClient, currentQueryKey, id, type, isStarred);
        setActionError(res.message);
      }
    } catch {
      updateItemStarInCache(dokQueryClient, currentQueryKey, id, type, isStarred);
      setActionError("Yıldız durumu güncellenemedi.");
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

  const handleDropOnFolder = useCallback(
    async (items: BulkItem[], targetFolderId: string) => {
      try {
        const result = await executeBulkMove(items, targetFolderId);
        if (result.succeeded.length > 0) {
          await fetchItems();
        }
        if (result.failed.length > 0) {
          setActionError(`${result.failed.length} öğe taşınamadı.`);
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Taşıma işlemi başarısız.";
        setActionError(msg);
      }
    },
    [fetchItems]
  );

  const allSelectedItems: BulkItem[] = useMemo(() => {
    return Array.from(selectedIds).map((id) => {
      const folder = folders.find((f) => f.id === id);
      return { id, type: (folder ? "folder" : "file") as "file" | "folder" };
    });
  }, [selectedIds, folders, files]);

  const pddCleanupsRef = useRef<Map<string, () => void>>(new Map());

  const setFolderNodeRef = useCallback(
    (node: HTMLElement | null, folder: DokFolder) => {
      const existing = pddCleanupsRef.current.get(folder.id);
      if (existing) {
        existing();
        pddCleanupsRef.current.delete(folder.id);
      }
      if (!node) return;

      const cleanupDraggable = registerDraggableItem({
        element: node,
        item: { id: folder.id, type: "folder" },
        selectedIds,
        allSelectedItems,
        onSelectSingle: (id) => replaceSelection([id]),
      });

      const cleanupDrop = registerFolderDropTarget({
        element: node,
        targetFolderId: folder.id,
        onDropItems: handleDropOnFolder,
        onDragStateChange: (isOver) => {
          setDragOverFolderId(isOver ? folder.id : null);
        },
      });

      pddCleanupsRef.current.set(folder.id, () => {
        cleanupDraggable();
        cleanupDrop();
      });
    },
    [selectedIds, allSelectedItems, replaceSelection, handleDropOnFolder]
  );

  const setFileNodeRef = useCallback(
    (node: HTMLElement | null, file: DokFile) => {
      const existing = pddCleanupsRef.current.get(file.id);
      if (existing) {
        existing();
        pddCleanupsRef.current.delete(file.id);
      }
      if (!node) return;

      const cleanupDraggable = registerDraggableItem({
        element: node,
        item: { id: file.id, type: "file" },
        selectedIds,
        allSelectedItems,
        onSelectSingle: (id) => replaceSelection([id]),
      });

      pddCleanupsRef.current.set(file.id, cleanupDraggable);
    },
    [selectedIds, allSelectedItems, replaceSelection]
  );

  useEffect(() => {
    return () => {
      pddCleanupsRef.current.forEach((c) => c());
      pddCleanupsRef.current.clear();
    };
  }, []);

  // ============================================================================
  // MOBILE GESTURE ENGINE — STALE STATE SHIELD (MUTABLE LATEST REFS)
  // ============================================================================
  const selectedIdsRef = useRef(selectedIds);
  selectedIdsRef.current = selectedIds;

  const navigateToFolderRef = useRef(navigateToFolder);
  navigateToFolderRef.current = navigateToFolder;

  const routerRef = useRef(router);
  routerRef.current = router;

  const longPressControllersRef = useRef<Map<string, ReturnType<typeof createLongPressController>>>(new Map());

  const getItemGestureHandlers = useCallback(
    (id: string, type: "file" | "folder", file?: DokFile) => {
      let controller = longPressControllersRef.current.get(id);
      if (!controller) {
        controller = createLongPressController({
          id,
          delayMs: 500,
          moveThresholdPx: 8,
          isSelectionModeActive: selectedIdsRef.current.size > 0,
          onLongPressTrigger: (itemId) => {
            toggleSelectedId(itemId);
          },
          onSingleTap: (itemId) => {
            // ALWAYS read the freshest selection state to avoid stale closure
            if (selectedIdsRef.current.size > 0) {
              toggleSelectedId(itemId);
            } else {
              if (type === "folder") {
                navigateToFolderRef.current(itemId);
              } else if (file) {
                routerRef.current.push(`/dokumantasyon/dosya/${file.id}`);
              }
            }
          },
        });
        longPressControllersRef.current.set(id, controller);
      }
      return {
        onPointerDown: controller.handlePointerDown,
        onPointerMove: controller.handlePointerMove,
        onPointerUp: controller.handlePointerUp,
        onPointerCancel: controller.handlePointerCancel,
      };
    },
    [toggleSelectedId]
  );

  // ============================================================================
  // COMMAND REGISTRY & UNIFIED ACTION DISPATCHER (DRIVE V3.1)
  // ============================================================================
  const commandRegistryRef = useRef(new CommandRegistry());
  const [clipboardState, setClipboardState] = useState<{ mode: "copy" | "cut"; items: CommandTargetItem[] } | null>(null);

  const getCommandContext = useCallback((): CommandContext => {
    const selectedItems: CommandTargetItem[] = Array.from(selectedIds).map((id) => {
      const folder = folders.find((f) => f.id === id);
      if (folder) {
        return {
          id: folder.id,
          type: "folder" as const,
          name: folder.name,
          starred: Boolean(folder.starred_at),
          pending: Boolean(folder.pending),
          parentId: folder.parent_id,
        };
      }
      const file = files.find((f) => f.id === id);
      return {
        id,
        type: "file" as const,
        name: file?.display_name || "Dosya",
        size: file ? Number(file.size_bytes) : 0,
        starred: Boolean(file?.starred_at),
        pending: false,
        parentId: file?.folder_id || null,
      };
    });

    return {
      currentFolderId,
      selectedIds,
      selectedItems,
      totalItemCount: allExplorerItems.length,
      isTrashView: isTrashOpen,
      viewMode,
      sortBy,
      sortOrder,
      isPendingOperation: false,
      clipboardState,
    };
  }, [folders, files, currentFolderId, selectedIds, allExplorerItems.length, isTrashOpen, viewMode, sortBy, sortOrder, clipboardState]);

  const executeCommand = useCallback(
    async (id: CommandId, payload?: unknown): Promise<boolean> => {
      const ctx = getCommandContext();
      return commandRegistryRef.current.execute(id, ctx, payload);
    },
    [getCommandContext]
  );

  // Register All Command Handlers
  useEffect(() => {
    const registry = commandRegistryRef.current;
    const cleanups: Array<() => void> = [];

    cleanups.push(registry.register("new-folder", () => {
      setIsNewFolderOpen(true);
    }));

    cleanups.push(registry.register("upload-files", () => {
      fileInputRef.current?.click();
    }));

    cleanups.push(registry.register("open", (ctx) => {
      if (ctx.selectedItems.length !== 1) return;
      const target = ctx.selectedItems[0];
      if (target.type === "folder") {
        navigateToFolder(target.id);
      } else {
        router.push(`/dokumantasyon/dosya/${target.id}`);
      }
    }));

    cleanups.push(registry.register("preview", (ctx) => {
      if (ctx.selectedItems.length !== 1) return;
      const target = ctx.selectedItems[0];
      if (target.type === "file") {
        router.push(`/dokumantasyon/dosya/${target.id}`);
      }
    }));

    cleanups.push(registry.register("download", (ctx) => {
      const fileItems = ctx.selectedItems.filter((i) => i.type === "file");
      fileItems.forEach((item) => {
        const fileObj = files.find((f) => f.id === item.id);
        if (fileObj) void handleDownload(fileObj);
      });
    }));

    cleanups.push(registry.register("rename", (ctx) => {
      if (ctx.selectedItems.length === 1) {
        setRenameItem({
          id: ctx.selectedItems[0].id,
          name: ctx.selectedItems[0].name,
          type: ctx.selectedItems[0].type,
        });
      }
    }));

    cleanups.push(registry.register("move", (ctx) => {
      if (ctx.selectedItems.length > 0) {
        const itemsToMove: DriveItem[] = ctx.selectedItems.map((i) => ({
          id: i.id,
          name: i.name,
          type: i.type,
          parentId: i.parentId ?? null,
        }));
        setMoveItems(itemsToMove);
      }
    }));

    cleanups.push(registry.register("trash", (ctx) => {
      if (ctx.selectedItems.length === 1) {
        setDeleteItem({
          id: ctx.selectedItems[0].id,
          name: ctx.selectedItems[0].name,
          type: ctx.selectedItems[0].type,
        });
      } else if (ctx.selectedItems.length > 1) {
        setIsMultiDeleteOpen(true);
      }
    }));

    cleanups.push(registry.register("star", async (ctx) => {
      for (const item of ctx.selectedItems) {
        await toggleStar(item.type, item.id, false);
      }
    }));

    cleanups.push(registry.register("unstar", async (ctx) => {
      for (const item of ctx.selectedItems) {
        await toggleStar(item.type, item.id, true);
      }
    }));

    cleanups.push(registry.register("share", (ctx) => {
      if (ctx.selectedItems.length === 1) {
        handleOpenShareSingle(ctx.selectedItems[0]);
      } else if (ctx.selectedItems.length > 1) {
        handleOpenShareSelected();
      }
    }));

    cleanups.push(registry.register("details", () => {
      setIsDetailsOpen((prev) => !prev);
    }));

    cleanups.push(registry.register("search", () => {
      setIsSearchOpen(true);
    }));

    cleanups.push(registry.register("select-all", () => {
      selectAll();
    }));

    cleanups.push(registry.register("clear-selection", () => {
      clearSelection();
    }));

    cleanups.push(registry.register("refresh", async () => {
      await refetchItems();
    }));

    cleanups.push(registry.register("change-view", (_ctx, payload) => {
      if (payload === "list" || payload === "grid") {
        setViewMode(payload);
      } else {
        setViewMode((prev) => (prev === "list" ? "grid" : "list"));
      }
    }));

    cleanups.push(registry.register("copy", (ctx) => {
      if (ctx.selectedItems.length > 0) {
        setClipboardState({ mode: "copy", items: ctx.selectedItems });
      }
    }));

    cleanups.push(registry.register("cut", (ctx) => {
      if (ctx.selectedItems.length > 0) {
        setClipboardState({ mode: "cut", items: ctx.selectedItems });
      }
    }));

    cleanups.push(registry.register("paste", async (ctx) => {
      if (!ctx.clipboardState || ctx.clipboardState.items.length === 0) return;
      const { mode, items } = ctx.clipboardState;
      if (mode === "cut") {
        const bulkItems: BulkItem[] = items.map((i) => ({ id: i.id, type: i.type }));
        await executeBulkMove(bulkItems, ctx.currentFolderId);
        setClipboardState(null);
        await refetchItems();
      } else {
        await refetchItems();
      }
    }));

    return () => {
      cleanups.forEach((c) => c());
    };
  }, [
    allSelectedItems,
    files,
    currentFolderId,
    navigateToFolder,
    router,
    selectAll,
    clearSelection,
    refetchItems,
    setViewMode,
  ]);

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
  const handleSort = (field: "name" | "date" | "size" | "type") => {
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
  };

  const allItemIds = visibleOrderedIds;

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
    selectedIds.forEach((id: string) => {
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
    const ids: string[] = Array.from(selectedIds);
    if (ids.length === 0) return;

    const itemsToTrash: BulkItem[] = ids.map((id) => {
      const folder = folders.find((f) => f.id === id);
      return { id, type: (folder ? "folder" : "file") as "file" | "folder" };
    });

    const result = await executeBulkTrash(itemsToTrash);

    if (result.succeeded.length > 0) await fetchItems();
    setSelectedIds(new Set(result.failed.map((f) => f.id)));

    if (result.failed.length > 0) {
      throw new Error(`${ids.length} öğeden ${result.failed.length}'si silinemedi. Başarısız öğeler seçili bırakıldı.`);
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

    // Concurrency limit: 3 active uploads concurrently
    const concurrency = 3;
    let nextIndex = 0;
    const workers = Array.from({ length: Math.min(concurrency, queueItems.length) }, async () => {
      while (nextIndex < queueItems.length) {
        const item = queueItems[nextIndex++];
        if (item) {
          await runQueueItem(item);
        }
      }
    });

    await Promise.all(workers);
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
      if (dialogIsOpen) return;

      const isCtrl = event.ctrlKey || event.metaKey;

      if (event.key === "/" && !isCtrl && !event.altKey) {
        event.preventDefault();
        void executeCommand("search");
      } else if (event.key === "Delete" && selectedIds.size > 0) {
        event.preventDefault();
        void executeCommand("trash");
      } else if (event.key === "Escape" && selectedIds.size > 0) {
        event.preventDefault();
        void executeCommand("clear-selection");
      } else if (event.key === "Enter" && selectedIds.size === 1) {
        event.preventDefault();
        void executeCommand("open");
      } else if (event.key === "F2" && selectedIds.size === 1) {
        event.preventDefault();
        void executeCommand("rename");
      } else if (isCtrl && event.key.toLowerCase() === "c" && selectedIds.size > 0) {
        event.preventDefault();
        void executeCommand("copy");
      } else if (isCtrl && event.key.toLowerCase() === "x" && selectedIds.size > 0) {
        event.preventDefault();
        void executeCommand("cut");
      } else if (isCtrl && event.key.toLowerCase() === "v") {
        event.preventDefault();
        void executeCommand("paste");
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [deleteItem, executeCommand, isCreateShareOpen, isFilterSheetOpen, isMultiDeleteOpen, isNewFolderOpen, isSearchOpen, isTrashOpen, moveItems.length, renameItem, selectedIds.size]);

  // ============================================================================
  // VIRTUALIZED & SHARED ROW / CARD RENDERERS
  // ============================================================================
  const renderFolderRow = (folder: DokFolder, style?: React.CSSProperties) => {
    const isSelected = selectedIds.has(folder.id);
    const isStarred = Boolean(folder.starred_at);

    return (
      <div
        key={folder.id}
        ref={(node) => setFolderNodeRef(node, folder)}
        data-testid="dok-folder-row"
        data-folder-id={folder.id}
        onClick={(e) => handleItemClick(folder.id, e)}
        onDoubleClick={() => navigateToFolder(folder.id)}
        onContextMenu={(e) => handleItemContextMenu(folder.id, e)}
        {...getItemGestureHandlers(folder.id, "folder")}
        style={style}
        className={`grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-2 px-3 py-3 text-sm cursor-pointer sm:grid-cols-12 sm:gap-x-0 sm:px-4 sm:py-3.5 select-none touch-pan-y ${styles.virtualRow} ${
          dragOverFolderId === folder.id ? styles.dragOverFolder : ""
        } ${
          isSelected ? `${styles.virtualRowSelected} bg-amber-500/15 border-l-2 border-amber-500` : "hover:bg-white/60 dark:hover:bg-white/[0.05]"
        } ${focusedId === folder.id ? styles.virtualRowFocused : ""}`}
      >
        <div className="col-span-2 flex min-w-0 items-center gap-2 sm:col-span-6 sm:gap-3 sm:pr-2">
          <button
            onClick={(e) => handleToggleSelect(folder.id, e)}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground sm:h-auto sm:w-auto"
            aria-label="Klasör Seç"
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
            <span className="block truncate font-bold text-foreground">{folder.name}</span>
            <span className="mt-0.5 block text-[11px] text-muted-foreground sm:hidden">Klasör • {formatDate(folder.updated_at || folder.created_at)}</span>
          </div>
        </div>

        <div className="hidden sm:col-span-2 sm:block text-xs text-muted-foreground font-mono">
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
                aria-label="Klasör İşlemleri"
                data-folder-name={folder.name}
              >
                <MoreVertical className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-card/95 border-border shadow-2xl rounded-xl backdrop-blur-md">
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenShareSingle({ id: folder.id, name: folder.name, type: "folder" });
                }}
                className="flex items-center gap-2 cursor-pointer text-xs rounded-lg"
              >
                <Share2 className="h-3.5 w-3.5 text-amber-500" />
                <span>Link Oluştur</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  setRenameItem({ id: folder.id, name: folder.name, type: "folder" });
                }}
                className="flex items-center gap-2 cursor-pointer text-xs text-blue-500 focus:text-blue-500 rounded-lg"
              >
                <Edit3 className="h-3.5 w-3.5 text-blue-500" />
                <span>Yeniden Adlandır</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  setMoveItems([{ id: folder.id, name: folder.name, type: "folder", parentId: folder.parent_id }]);
                }}
                className="flex items-center gap-2 cursor-pointer text-xs text-purple-500 focus:text-purple-500 rounded-lg"
              >
                <Move className="h-3.5 w-3.5 text-purple-500" />
                <span>Taşı</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => void toggleStar("folder", folder.id, isStarred, e)}
                className="flex items-center gap-2 cursor-pointer text-xs rounded-lg"
              >
                <Star className={`h-3.5 w-3.5 ${isStarred ? "fill-amber-400 text-amber-400" : "text-amber-400"}`} />
                <span>{isStarred ? "Yıldızı Kaldır" : "Yıldızla"}</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  setDeleteItem({ id: folder.id, name: folder.name, type: "folder" });
                }}
                className="flex items-center gap-2 cursor-pointer text-xs text-red-500 focus:text-red-500 focus:bg-red-500/10 rounded-lg font-medium"
              >
                <Trash2 className="h-3.5 w-3.5 text-red-500" />
                <span>Çöp Kutusuna At</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    );
  };

  const renderFileRow = (file: DokFile, style?: React.CSSProperties) => {
    const isSelected = selectedIds.has(file.id);
    const isStarred = Boolean(file.starred_at);

    return (
      <div
        key={file.id}
        ref={(node) => setFileNodeRef(node, file)}
        data-testid="dok-file-row"
        data-file-id={file.id}
        data-extension={file.extension}
        onClick={(e) => handleItemClick(file.id, e)}
        onDoubleClick={() => router.push(`/dokumantasyon/dosya/${file.id}`)}
        onContextMenu={(e) => handleItemContextMenu(file.id, e)}
        {...getItemGestureHandlers(file.id, "file", file)}
        style={style}
        className={`grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-2 px-3 py-3 text-sm cursor-pointer sm:grid-cols-12 sm:gap-x-0 sm:px-4 sm:py-3.5 select-none touch-pan-y ${styles.virtualRow} ${
          isSelected ? `${styles.virtualRowSelected} bg-amber-500/15 border-l-2 border-amber-500` : "hover:bg-white/60 dark:hover:bg-white/[0.05]"
        } ${focusedId === file.id ? styles.virtualRowFocused : ""}`}
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
            aria-label={isStarred ? "Yıldızı kaldır" : "Yıldızla"}
            className="hidden shrink-0 text-muted-foreground hover:text-amber-400 sm:block"
          >
            <Star
              className={`h-4 w-4 ${isStarred ? "fill-amber-400 text-amber-400" : ""}`}
            />
          </button>

          {getFileIcon(file.extension)}

          <div className="min-w-0">
            <Link
              href={`/dokumantasyon/dosya/${file.id}`}
              onClick={(e) => e.stopPropagation()}
              className="block truncate font-bold text-foreground hover:text-amber-500 hover:underline"
            >
              {file.display_name}
            </Link>
            <span className="mt-0.5 block text-[11px] text-muted-foreground sm:hidden">
              {formatBytes(Number(file.size_bytes))} • {formatDate(file.updated_at || file.created_at)}
            </span>
          </div>
        </div>

        <div className="hidden sm:col-span-2 sm:block text-xs text-muted-foreground font-mono">
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
                data-file-name={file.display_name}
              >
                <MoreVertical className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-card/95 border-border shadow-2xl rounded-xl backdrop-blur-md">
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(`/dokumantasyon/dosya/${file.id}`);
                }}
                className="flex items-center gap-2 cursor-pointer text-xs rounded-lg"
              >
                <Eye className="h-3.5 w-3.5 text-blue-500" />
                <span>Önizle / Studio</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  void handleDownload(file);
                }}
                className="flex items-center gap-2 cursor-pointer text-xs rounded-lg"
              >
                <Download className="h-3.5 w-3.5 text-emerald-500" />
                <span>İndir</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenShareSingle({ id: file.id, name: file.display_name, type: "file" });
                }}
                className="flex items-center gap-2 cursor-pointer text-xs rounded-lg"
              >
                <Share2 className="h-3.5 w-3.5 text-amber-500" />
                <span>Link Oluştur</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  setRenameItem({ id: file.id, name: file.display_name, type: "file" });
                }}
                className="flex items-center gap-2 cursor-pointer text-xs text-blue-500 focus:text-blue-500 rounded-lg"
              >
                <Edit3 className="h-3.5 w-3.5 text-blue-500" />
                <span>Yeniden Adlandır</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  setMoveItems([{ id: file.id, name: file.display_name, type: "file", parentId: file.folder_id }]);
                }}
                className="flex items-center gap-2 cursor-pointer text-xs text-purple-500 focus:text-purple-500 rounded-lg"
              >
                <Move className="h-3.5 w-3.5 text-purple-500" />
                <span>Taşı</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => void toggleStar("file", file.id, isStarred, e)}
                className="flex items-center gap-2 cursor-pointer text-xs rounded-lg"
              >
                <Star className={`h-3.5 w-3.5 ${isStarred ? "fill-amber-400 text-amber-400" : "text-amber-400"}`} />
                <span>{isStarred ? "Yıldızı Kaldır" : "Yıldızla"}</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
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
  };

  const renderFolderCard = (folder: DokFolder, style?: React.CSSProperties) => {
    const isSelected = selectedIds.has(folder.id);
    const isStarred = Boolean(folder.starred_at);

    return (
      <div
        key={folder.id}
        ref={(node) => setFolderNodeRef(node, folder)}
        data-testid="dok-folder-card"
        data-folder-id={folder.id}
        onClick={(e) => handleItemClick(folder.id, e)}
        onDoubleClick={() => navigateToFolder(folder.id)}
        onContextMenu={(e) => handleItemContextMenu(folder.id, e)}
        {...getItemGestureHandlers(folder.id, "folder")}
        style={style}
        className={`group relative flex min-h-40 flex-col justify-between rounded-2xl p-3.5 cursor-pointer select-none touch-pan-y ${styles.card} ${styles.virtualCard} ${
          dragOverFolderId === folder.id ? styles.dragOverFolder : ""
        } ${
          isSelected ? `${styles.virtualCardSelected} border-amber-500 ring-2 ring-amber-500/40` : ""
        } ${focusedId === folder.id ? styles.virtualCardFocused : ""}`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={(e) => handleToggleSelect(folder.id, e)}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded text-muted-foreground hover:bg-secondary hover:text-foreground"
              aria-label="Klasör Seç"
            >
              {isSelected ? (
                <CheckSquare className="h-4 w-4 text-amber-500" />
              ) : (
                <Square className="h-4 w-4" />
              )}
            </button>
            <Folder className="h-6 w-6 text-amber-500" />
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => void toggleStar("folder", folder.id, isStarred, e)}
              aria-label={isStarred ? "Yıldızı kaldır" : "Yıldızla"}
              className="flex h-7 w-7 items-center justify-center rounded text-muted-foreground hover:text-amber-400"
            >
              <Star className={`h-3.5 w-3.5 ${isStarred ? "fill-amber-400 text-amber-400" : ""}`} />
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  onClick={(e) => e.stopPropagation()}
                  className="flex h-7 w-7 items-center justify-center rounded text-muted-foreground hover:bg-secondary hover:text-foreground"
                  aria-label="Klasör İşlemleri"
                >
                  <MoreVertical className="h-3.5 w-3.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-card/95 border-border shadow-2xl rounded-xl backdrop-blur-md">
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenShareSingle({ id: folder.id, name: folder.name, type: "folder" });
                  }}
                  className="flex items-center gap-2 cursor-pointer text-xs rounded-lg"
                >
                  <Share2 className="h-3.5 w-3.5 text-amber-500" />
                  <span>Link Oluştur</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    setRenameItem({ id: folder.id, name: folder.name, type: "folder" });
                  }}
                  className="flex items-center gap-2 cursor-pointer text-xs text-blue-500 focus:text-blue-500 rounded-lg"
                >
                  <Edit3 className="h-3.5 w-3.5 text-blue-500" />
                  <span>Yeniden Adlandır</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    setMoveItems([{ id: folder.id, name: folder.name, type: "folder", parentId: folder.parent_id }]);
                  }}
                  className="flex items-center gap-2 cursor-pointer text-xs text-purple-500 focus:text-purple-500 rounded-lg"
                >
                  <Move className="h-3.5 w-3.5 text-purple-500" />
                  <span>Taşı</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => void toggleStar("folder", folder.id, isStarred, e)}
                  className="flex items-center gap-2 cursor-pointer text-xs rounded-lg"
                >
                  <Star className={`h-3.5 w-3.5 ${isStarred ? "fill-amber-400 text-amber-400" : "text-amber-400"}`} />
                  <span>{isStarred ? "Yıldızı Kaldır" : "Yıldızla"}</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteItem({ id: folder.id, name: folder.name, type: "folder" });
                  }}
                  className="flex items-center gap-2 cursor-pointer text-xs text-red-500 focus:text-red-500 focus:bg-red-500/10 rounded-lg font-medium"
                >
                  <Trash2 className="h-3.5 w-3.5 text-red-500" />
                  <span>Çöp Kutusuna At</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="mt-3 min-w-0">
          <span className="block line-clamp-2 text-xs font-bold text-foreground">{folder.name}</span>
          <span className="mt-1 block text-[10px] text-muted-foreground">Klasör</span>
        </div>
      </div>
    );
  };

  const renderFileCard = (file: DokFile, style?: React.CSSProperties) => {
    const isSelected = selectedIds.has(file.id);
    const isStarred = Boolean(file.starred_at);

    return (
      <div
        key={file.id}
        ref={(node) => setFileNodeRef(node, file)}
        data-testid="dok-file-card"
        data-file-id={file.id}
        data-extension={file.extension}
        onClick={(e) => handleItemClick(file.id, e)}
        onDoubleClick={() => router.push(`/dokumantasyon/dosya/${file.id}`)}
        onContextMenu={(e) => handleItemContextMenu(file.id, e)}
        {...getItemGestureHandlers(file.id, "file", file)}
        style={style}
        className={`group relative flex min-h-40 flex-col justify-between rounded-2xl p-3.5 cursor-pointer select-none touch-pan-y ${styles.card} ${styles.virtualCard} ${
          isSelected ? `${styles.virtualCardSelected} border-amber-500 ring-2 ring-amber-500/40` : ""
        } ${focusedId === file.id ? styles.virtualCardFocused : ""}`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={(e) => handleToggleSelect(file.id, e)}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded text-muted-foreground hover:bg-secondary hover:text-foreground"
              aria-label="Dosya Seç"
            >
              {isSelected ? (
                <CheckSquare className="h-4 w-4 text-amber-500" />
              ) : (
                <Square className="h-4 w-4" />
              )}
            </button>
            <div className="flex h-7 w-7 items-center justify-center">
              {getFileIcon(file.extension)}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => void toggleStar("file", file.id, isStarred, e)}
              aria-label={isStarred ? "Yıldızı kaldır" : "Yıldızla"}
              className="flex h-7 w-7 items-center justify-center rounded text-muted-foreground hover:text-amber-400"
            >
              <Star className={`h-3.5 w-3.5 ${isStarred ? "fill-amber-400 text-amber-400" : ""}`} />
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  onClick={(e) => e.stopPropagation()}
                  className="flex h-7 w-7 items-center justify-center rounded text-muted-foreground hover:bg-secondary hover:text-foreground"
                  aria-label="Dosya İşlemleri"
                >
                  <MoreVertical className="h-3.5 w-3.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-card/95 border-border shadow-2xl rounded-xl backdrop-blur-md">
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/dokumantasyon/dosya/${file.id}`);
                  }}
                  className="flex items-center gap-2 cursor-pointer text-xs rounded-lg"
                >
                  <Eye className="h-3.5 w-3.5 text-blue-500" />
                  <span>Önizle / Studio</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    void handleDownload(file);
                  }}
                  className="flex items-center gap-2 cursor-pointer text-xs rounded-lg"
                >
                  <Download className="h-3.5 w-3.5 text-emerald-500" />
                  <span>İndir</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenShareSingle({ id: file.id, name: file.display_name, type: "file" });
                  }}
                  className="flex items-center gap-2 cursor-pointer text-xs rounded-lg"
                >
                  <Share2 className="h-3.5 w-3.5 text-amber-500" />
                  <span>Link Oluştur</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    setRenameItem({ id: file.id, name: file.display_name, type: "file" });
                  }}
                  className="flex items-center gap-2 cursor-pointer text-xs text-blue-500 focus:text-blue-500 rounded-lg"
                >
                  <Edit3 className="h-3.5 w-3.5 text-blue-500" />
                  <span>Yeniden Adlandır</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    setMoveItems([{ id: file.id, name: file.display_name, type: "file", parentId: file.folder_id }]);
                  }}
                  className="flex items-center gap-2 cursor-pointer text-xs text-purple-500 focus:text-purple-500 rounded-lg"
                >
                  <Move className="h-3.5 w-3.5 text-purple-500" />
                  <span>Taşı</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => void toggleStar("file", file.id, isStarred, e)}
                  className="flex items-center gap-2 cursor-pointer text-xs rounded-lg"
                >
                  <Star className={`h-3.5 w-3.5 ${isStarred ? "fill-amber-400 text-amber-400" : "text-amber-400"}`} />
                  <span>{isStarred ? "Yıldızı Kaldır" : "Yıldızla"}</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
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

        <div className="mt-3 min-w-0">
          <Link
            href={`/dokumantasyon/dosya/${file.id}`}
            onClick={(e) => e.stopPropagation()}
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
  };

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
            if (f !== "all" && currentFolderId) navigateToFolder(null);
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
                if (filter !== "all" && currentFolderId) navigateToFolder(null);
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

      {/* 2. Ana Çalışma Alanı (Center Content) — BUG-3 FIX: overflow-hidden → min-h-0 */}
      <div className="flex min-w-0 min-h-0 flex-1 flex-col">
        {/* Üst Gezinti ve Kontrol Çubuğu */}
        <div className={`flex min-w-0 flex-wrap items-center justify-between gap-2 border-b p-2.5 sm:gap-3 sm:p-3 ${styles.commandBar}`}>
          {/* Breadcrumb ve Mobil Menü */}
          <div className="flex min-w-fit flex-1 items-center gap-1.5 text-xs sm:text-sm">
            <Button
              size="sm"
              variant="ghost"
              ref={mobileMenuButtonRef}
              onClick={() => setIsSidebarOpenMobile((m) => !m)}
              className="h-10 w-10 shrink-0 p-0 rounded-xl hover:bg-secondary lg:hidden"
              aria-expanded={isSidebarOpenMobile}
              aria-controls="dok-mobile-sidebar"
              aria-label="Dokümantasyon menüsünü aç"
            >
              <Menu className="h-4 w-4" />
            </Button>

            <button
              onClick={() => {
                setActiveFilter("all");
                navigateToFolder(null);
              }}
              className="hidden items-center gap-1.5 font-medium text-muted-foreground transition-colors hover:text-foreground sm:flex"
            >
              <HardDrive className="h-4 w-4 text-amber-500 shrink-0" />
              <span>Kök Dizin</span>
            </button>

            {currentFolderId && breadcrumbs.length > 1 && (
              <button
                onClick={() => navigateToFolder(breadcrumbs[breadcrumbs.length - 2]?.id ?? null)}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-muted-foreground hover:bg-secondary hover:text-foreground sm:hidden"
                aria-label="Üst klasöre git"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            )}

            <div className="flex min-w-0 items-center gap-1 sm:hidden">
              <HardDrive className="h-3.5 w-3.5 shrink-0 text-amber-500" />
              <span className="shrink-0 text-muted-foreground">Kök</span>
              {breadcrumbs.length > 2 && <span className="text-muted-foreground/60">/ …</span>}
              {breadcrumbs.length > 1 && (
                <span className="truncate font-bold text-foreground">/ {breadcrumbs[breadcrumbs.length - 1].name}</span>
              )}
            </div>

            <div className="hidden min-w-0 items-center gap-1.5 sm:flex">
              {breadcrumbs.length <= 4 ? (
                breadcrumbs.slice(1).map((b, idx) => (
                  <React.Fragment key={b.id || idx}>
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
                    <button
                      onClick={() => navigateToFolder(b.id)}
                      className={`transition-colors hover:text-foreground truncate max-w-[140px] sm:max-w-xs ${
                        idx === breadcrumbs.length - 2
                          ? "font-bold text-foreground"
                          : "text-muted-foreground"
                      }`}
                    >
                      {b.name}
                    </button>
                  </React.Fragment>
                ))
              ) : (
                <>
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
                  <span className="text-muted-foreground/60 font-medium">…</span>
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
                  <button
                    onClick={() => navigateToFolder(breadcrumbs[breadcrumbs.length - 2].id)}
                    className="transition-colors hover:text-foreground truncate max-w-[120px] text-muted-foreground"
                  >
                    {breadcrumbs[breadcrumbs.length - 2].name}
                  </button>
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
                  <button
                    onClick={() => navigateToFolder(breadcrumbs[breadcrumbs.length - 1].id)}
                    className="transition-colors hover:text-foreground truncate max-w-[160px] font-bold text-foreground"
                  >
                    {breadcrumbs[breadcrumbs.length - 1].name}
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Sağ Kontroller: Tümünü Seç, Seçilenleri Sil, Sırala, Grupla, Arama, Filtre, Yükle, Yeni Klasör, Görünüm Modu */}
          <div className="flex shrink-0 flex-wrap items-center gap-1.5 sm:gap-2">
            {/* Tümünü Seç / Seçimi Kaldır Butonu */}
            {allItemIds.length > 0 && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleToggleSelectAll}
                className={`h-10 border-border/80 text-xs hover:bg-secondary rounded-xl px-2.5 sm:px-3 gap-1.5 transition-all ${
                  isAllSelected ? "border-amber-500/50 bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold shadow-sm" : ""
                }`}
                title={isAllSelected ? "Tüm seçimleri temizle" : "Mevcut dizindeki tüm dosya ve klasörleri seç"}
              >
                {isAllSelected ? (
                  <CheckSquare className="h-4 w-4 text-amber-500" />
                ) : (
                  <Square className="h-4 w-4 text-muted-foreground" />
                )}
                <span className="hidden md:inline">{isAllSelected ? "Seçimi Kaldır" : "Tümünü Seç"}</span>
                <span className="inline-flex rounded-full bg-secondary px-1.5 py-0.2 text-[10px] font-mono text-muted-foreground font-semibold">
                  {allItemIds.length}
                </span>
              </Button>
            )}

            {/* Seçilenleri Sil Butonu (Seçim Varsa Görünür) */}
            {selectedIds.size > 0 && (
              <Button
                size="sm"
                variant="destructive"
                onClick={() => void executeCommand("trash")}
                className="h-10 gap-1.5 px-3 text-xs font-bold rounded-xl shadow-md animate-in fade-in bg-red-600 hover:bg-red-500 text-white"
                title="Seçili öğeleri çöp kutusuna taşı"
              >
                <Trash2 className="h-4 w-4" />
                <span>Seçilenleri Sil ({selectedIds.size})</span>
              </Button>
            )}

            {/* Sıralama Açılır Menüsü */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-10 border-border/80 text-xs hover:bg-secondary rounded-xl px-2.5 sm:px-3 gap-1.5"
                  title="Sıralama Seçenekleri"
                >
                  <ArrowUpDown className="h-3.5 w-3.5 text-amber-500" />
                  <span className="hidden sm:inline font-medium">Sırala</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-card/95 border-border shadow-2xl rounded-xl backdrop-blur-md">
                <div className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  İsme Göre
                </div>
                <DropdownMenuItem
                  onClick={() => { setSortBy("name"); setSortOrder("asc"); }}
                  className={`flex items-center justify-between cursor-pointer text-xs rounded-lg ${sortBy === "name" && sortOrder === "asc" ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold" : ""}`}
                >
                  <span>İsim (A → Z)</span>
                  {sortBy === "name" && sortOrder === "asc" && <span className="font-bold">✓</span>}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => { setSortBy("name"); setSortOrder("desc"); }}
                  className={`flex items-center justify-between cursor-pointer text-xs rounded-lg ${sortBy === "name" && sortOrder === "desc" ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold" : ""}`}
                >
                  <span>İsim (Z → A)</span>
                  {sortBy === "name" && sortOrder === "desc" && <span className="font-bold">✓</span>}
                </DropdownMenuItem>

                <DropdownMenuSeparator className="bg-border/60" />
                <div className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Tarihe Göre
                </div>
                <DropdownMenuItem
                  onClick={() => { setSortBy("date"); setSortOrder("desc"); }}
                  className={`flex items-center justify-between cursor-pointer text-xs rounded-lg ${sortBy === "date" && sortOrder === "desc" ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold" : ""}`}
                >
                  <span>En Yeni İlk</span>
                  {sortBy === "date" && sortOrder === "desc" && <span className="font-bold">✓</span>}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => { setSortBy("date"); setSortOrder("asc"); }}
                  className={`flex items-center justify-between cursor-pointer text-xs rounded-lg ${sortBy === "date" && sortOrder === "asc" ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold" : ""}`}
                >
                  <span>En Eski İlk</span>
                  {sortBy === "date" && sortOrder === "asc" && <span className="font-bold">✓</span>}
                </DropdownMenuItem>

                <DropdownMenuSeparator className="bg-border/60" />
                <div className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Boyuta Göre
                </div>
                <DropdownMenuItem
                  onClick={() => { setSortBy("size"); setSortOrder("desc"); }}
                  className={`flex items-center justify-between cursor-pointer text-xs rounded-lg ${sortBy === "size" && sortOrder === "desc" ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold" : ""}`}
                >
                  <span>Büyük → Küçük</span>
                  {sortBy === "size" && sortOrder === "desc" && <span className="font-bold">✓</span>}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => { setSortBy("size"); setSortOrder("asc"); }}
                  className={`flex items-center justify-between cursor-pointer text-xs rounded-lg ${sortBy === "size" && sortOrder === "asc" ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold" : ""}`}
                >
                  <span>Küçük → Büyük</span>
                  {sortBy === "size" && sortOrder === "asc" && <span className="font-bold">✓</span>}
                </DropdownMenuItem>

                <DropdownMenuSeparator className="bg-border/60" />
                <DropdownMenuItem
                  onClick={() => { setSortBy("type"); setSortOrder("asc"); }}
                  className={`flex items-center justify-between cursor-pointer text-xs rounded-lg ${sortBy === "type" ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold" : ""}`}
                >
                  <span>Türe Göre (Uzantı A-Z)</span>
                  {sortBy === "type" && <span className="font-bold">✓</span>}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Gruplama Açılır Menüsü */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  className={`h-10 border-border/80 text-xs hover:bg-secondary rounded-xl px-2.5 sm:px-3 gap-1.5 ${
                    groupBy !== "none" ? "border-amber-500/50 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold" : ""
                  }`}
                  title="Gruplama Seçenekleri"
                >
                  <Layers className="h-3.5 w-3.5 text-amber-500" />
                  <span className="hidden sm:inline font-medium">Grupla</span>
                  {groupBy !== "none" && (
                    <span className="flex h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-card/95 border-border shadow-2xl rounded-xl backdrop-blur-md">
                <DropdownMenuItem
                  onClick={() => setGroupBy("none")}
                  className={`flex items-center justify-between cursor-pointer text-xs rounded-lg ${groupBy === "none" ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold" : ""}`}
                >
                  <span>Gruplama Yok</span>
                  {groupBy === "none" && <span className="font-bold">✓</span>}
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-border/60" />
                <DropdownMenuItem
                  onClick={() => setGroupBy("type")}
                  className={`flex items-center justify-between cursor-pointer text-xs rounded-lg ${groupBy === "type" ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold" : ""}`}
                >
                  <span>Türe Göre (CAD, PDF, vb.)</span>
                  {groupBy === "type" && <span className="font-bold">✓</span>}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setGroupBy("date")}
                  className={`flex items-center justify-between cursor-pointer text-xs rounded-lg ${groupBy === "date" ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold" : ""}`}
                >
                  <span>Tarihe Göre (Bugün, Bu Ay)</span>
                  {groupBy === "date" && <span className="font-bold">✓</span>}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setGroupBy("size")}
                  className={`flex items-center justify-between cursor-pointer text-xs rounded-lg ${groupBy === "size" ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold" : ""}`}
                >
                  <span>Boyuta Göre (&gt;100MB, &lt;5MB)</span>
                  {groupBy === "size" && <span className="font-bold">✓</span>}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsSearchOpen(true)}
              className="h-10 border-border/80 text-xs hover:bg-secondary rounded-xl px-2.5 sm:px-3 gap-2"
            >
              <Search className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="hidden sm:inline font-medium">Ara...</span>
              <kbd className="hidden lg:inline-flex h-4 items-center rounded border border-border bg-secondary/80 px-1 text-[10px] font-mono font-medium text-muted-foreground">
                /
              </kbd>
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsFilterSheetOpen(true)}
              className={`h-10 border-border/80 text-xs hover:bg-secondary rounded-xl px-2.5 sm:px-3 gap-1.5 ${
                activeFilterLabels.length > 0 ? "border-amber-500/50 bg-amber-500/10 text-amber-500 font-semibold" : ""
              }`}
              aria-label="Dosya filtreleri"
            >
              <SlidersHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="hidden sm:inline font-medium">Filtre</span>
              {activeFilterLabels.length > 0 && (
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-zinc-950">
                  {activeFilterLabels.length}
                </span>
              )}
            </Button>

            <Button
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="h-10 shrink-0 bg-amber-500 px-3 text-xs font-bold text-zinc-950 hover:bg-amber-400 rounded-xl gap-1.5 shadow-sm"
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
                className="h-10 border-border/80 text-xs hover:bg-secondary rounded-xl px-2.5 sm:px-3 gap-1.5"
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
              className="hidden h-10 gap-1.5 border-border/80 text-xs font-semibold hover:bg-secondary rounded-xl lg:inline-flex px-3"
            >
              <FolderPlus className="h-4 w-4 text-amber-500" />
              <span>Yeni Klasör</span>
            </Button>

            <div className="hidden items-center rounded-xl border border-border/80 bg-secondary/40 p-0.5 sm:flex">
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs transition-all ${
                  viewMode === "list"
                    ? "bg-card text-foreground shadow-sm font-bold border border-border/60"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                title="Liste Görünümü"
                aria-label="Liste Görünümü"
              >
                <ListIcon className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs transition-all ${
                  viewMode === "grid"
                    ? "bg-card text-foreground shadow-sm font-bold border border-border/60"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                title="Kart (Grid) Görünümü"
                aria-label="Kart (Grid) Görünümü"
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
            </div>

            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsDetailsOpen((d) => !d)}
              className={`hidden h-10 w-10 p-0 rounded-xl lg:inline-flex ${
                isDetailsOpen ? "bg-amber-500/20 text-amber-500" : "text-muted-foreground hover:text-foreground"
              }`}
              title="Öğe Bilgi ve Detay Çekmecesi"
            >
              <Info className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {activeFilterLabels.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto border-b border-border/60 px-3 py-2 text-[11px] text-muted-foreground sm:px-4">
            <span className="shrink-0 font-semibold">Etkin filtreler:</span>
            {activeFilterLabels.map((label) => (
              <span key={label} className="shrink-0 rounded-full bg-secondary px-2.5 py-1 text-foreground font-medium border border-border/60">
                {label}
              </span>
            ))}
            <button
              type="button"
              onClick={() => {
                setActiveFilter("all");
                setWorkspaceFilters(DEFAULT_WORKSPACE_FILTERS);
              }}
              className="shrink-0 font-bold text-amber-500 hover:underline"
            >
              Temizle
            </button>
          </div>
        )}

        {/* Çoklu Seçim Yüzen Aksiyon Çubuğu */}
        {selectedIds.size > 0 && (
          <div className={`fixed inset-x-2 bottom-2 z-[60] flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-amber-500/40 bg-card/95 px-4 py-2.5 text-xs font-medium text-foreground shadow-2xl backdrop-blur-xl animate-in fade-in lg:inset-x-auto lg:bottom-3 ${styles.mobileSelectionBar}`}>
            <div className="flex items-center gap-2 sm:gap-2.5">
              <CheckSquare className="h-4 w-4 text-amber-500" />
              <span className="font-bold text-amber-500 font-mono text-sm">{selectedIds.size}</span>
              <span className="font-semibold">/ {allItemIds.length} öğe seçildi</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleToggleSelectAll}
                className="h-9 gap-1.5 border-border text-xs hover:bg-secondary rounded-xl"
              >
                {isAllSelected ? "Seçimi Kaldır" : "Tümünü Seç"}
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={() => void executeCommand("move")}
                className="h-9 gap-1.5 border-purple-500/40 px-3 text-xs text-purple-500 hover:bg-purple-500/10 rounded-xl"
              >
                <Move className="h-3.5 w-3.5" />
                <span>Taşı</span>
              </Button>

              <Button
                size="sm"
                onClick={() => void executeCommand("share")}
                className="h-9 gap-1.5 bg-amber-500 px-3 text-xs font-bold text-zinc-950 hover:bg-amber-400 rounded-xl shadow-sm"
              >
                <Link2 className="h-3.5 w-3.5" />
                <span>Link Oluştur</span>
              </Button>

              <Button
                size="sm"
                variant="destructive"
                onClick={() => void executeCommand("trash")}
                className="h-9 gap-1.5 px-3 text-xs rounded-xl font-bold bg-red-600 hover:bg-red-500 text-white"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Seçilenleri Sil ({selectedIds.size})</span>
              </Button>

              <Button
                size="sm"
                variant="ghost"
                onClick={() => void executeCommand("clear-selection")}
                className="hidden h-9 text-xs sm:inline-flex rounded-xl"
              >
                Seçimi Temizle
              </Button>
            </div>
          </div>
        )}

        {/* Kalıcı Depolama Yapılandırma Uyarısı */}
        {configError && (
          <div className="mx-4 mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-red-400 flex items-start gap-3 shadow-sm">
            <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5 text-red-400" />
            <div className="space-y-1 text-xs">
              <div className="font-bold text-sm text-red-300">Kalıcı Depolama Yapılandırma Hatası</div>
              <div>{configError}</div>
              <div className="text-muted-foreground">Veri kaybını önlemek için yükleme ve değiştirme işlemleri güvenlik amacıyla durdurulmuştur.</div>
            </div>
          </div>
        )}

        {actionError && (
          <div role="alert" className="mx-4 mt-4 flex items-start justify-between gap-3 rounded-2xl border border-red-500/30 bg-red-500/10 p-3.5 text-xs text-red-300 shadow-sm">
            <span>{actionError}</span>
            <button type="button" onClick={() => setActionError(null)} className="shrink-0 font-semibold text-red-200 hover:text-foreground">Kapat</button>
          </div>
        )}

        {/* Ana İçerik Alanı: Liste veya Grid */}
        <div
          ref={scrollContainerRef}
          tabIndex={0}
          onKeyDown={handleKeyDown}
          onScroll={handleVirtualScroll}
          {...containerPointerHandlers}
          className={`relative flex-1 overflow-auto p-3 sm:p-4 outline-none select-none min-h-[300px] ${selectedIds.size > 0 ? "pb-28 sm:pb-28 lg:pb-28" : "pb-4"} ${styles.viewport}`}
        >
          {/* Sanal Marquee Seçim Kutusu (Windows Explorer Mavi Dikdörtgen) */}
          {marqueeBox && (
            <div
              data-testid="dok-marquee-box"
              className="pointer-events-none absolute z-50 rounded-sm border border-blue-500/90 bg-blue-500/20 shadow-[0_0_12px_rgba(59,130,246,0.15)] transition-none"
              style={{
                left: marqueeBox.left,
                top: marqueeBox.top,
                width: marqueeBox.width,
                height: marqueeBox.height,
              }}
            />
          )}
          {listError ? (
            <div role="alert" className="mx-auto flex max-w-lg flex-col items-center justify-center py-24 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-red-500/30 bg-red-500/10 text-red-500 mb-2">
                <AlertTriangle className="h-8 w-8" />
              </div>
              <h2 className="mt-4 text-base font-bold text-foreground">
                {listError.kind === "auth" ? "Oturum gerekli" : "Dosyalar listelenemedi"}
              </h2>
              <p className="mt-2 text-xs text-muted-foreground max-w-sm">{listError.message}</p>
              <p className="mt-1 text-xs text-muted-foreground">Konum: {breadcrumbs.map((item) => item.name).join(" / ")}</p>
              {listError.kind !== "auth" && (
                <Button size="sm" variant="outline" onClick={fetchItems} className="mt-5 rounded-xl">
                  Tekrar dene
                </Button>
              )}
            </div>
          ) : loading ? (
            <div className="flex flex-col items-center justify-center py-28 text-muted-foreground gap-3">
              <Loader2 className="h-9 w-9 animate-spin text-amber-500" />
              <span className="text-sm font-semibold text-foreground">Dosyalar listeleniyor...</span>
            </div>
          ) : displayedFolders.length === 0 && displayedFiles.length === 0 ? (
            /* Bağlama Duyarlı Zengin Boş Durumlar */
            <div className="flex flex-col items-center justify-center py-24 text-center max-w-md mx-auto">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-border/80 bg-secondary/40 text-muted-foreground shadow-sm">
                {activeFilter === "starred" ? (
                  <Star className="h-8 w-8 text-amber-400" />
                ) : activeFilter === "recent" ? (
                  <Clock className="h-8 w-8 text-blue-400" />
                ) : activeFilter === "cad" ? (
                  <Compass className="h-8 w-8 text-cyan-400" />
                ) : activeFilter === "pdf" ? (
                  <FileText className="h-8 w-8 text-red-400" />
                ) : activeFilter === "image" ? (
                  <ImageIcon className="h-8 w-8 text-emerald-400" />
                ) : (
                  <Folder className="h-8 w-8 text-amber-500/80" />
                )}
              </div>
              <h3 className="mt-4 text-base font-bold text-foreground">
                {activeFilter === "starred"
                  ? "Henüz Yıldızlı Dosyanız Yok"
                  : activeFilter === "recent"
                  ? "Henüz Açılan Bir Dosya Yok"
                  : activeFilter === "cad"
                  ? "AutoCAD Çizimi Bulunamadı"
                  : activeFilter === "pdf"
                  ? "PDF Dokümanı Bulunamadı"
                  : activeFilter === "image"
                  ? "Görsel Dosyası Bulunamadı"
                  : activeFilterLabels.length > 0
                  ? "Filtreleme Kriterine Uygun Dosya Yok"
                  : "Bu Klasör Henüz Boş"}
              </h3>
              <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                {activeFilter === "starred"
                  ? "Sık kullandığınız dosya ve klasörleri hızlı erişim için yıldızlayabilirsiniz."
                  : activeFilter === "recent"
                  ? "Document Studio'da görüntülediğiniz dosyalar burada otomatik olarak listelenir."
                  : activeFilterLabels.length > 0
                  ? "Arama veya filtre kriterlerinizi değiştirerek tekrar deneyebilirsiniz."
                  : "Bu klasöre yeni dosya yükleyebilir veya alt klasör oluşturabilirsiniz."}
              </p>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                {activeFilterLabels.length > 0 ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setActiveFilter("all");
                      setWorkspaceFilters(DEFAULT_WORKSPACE_FILTERS);
                    }}
                    className="rounded-xl text-xs"
                  >
                    Filtreleri Temizle
                  </Button>
                ) : (
                  <>
                    <Button
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      className="gap-2 bg-amber-500 text-xs font-bold text-zinc-950 hover:bg-amber-400 rounded-xl shadow-sm px-4"
                    >
                      <Upload className="h-3.5 w-3.5" />
                      <span>Dosya Yükle</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setIsNewFolderOpen(true)}
                      className="gap-2 text-xs font-semibold rounded-xl px-4"
                    >
                      <FolderPlus className="h-3.5 w-3.5 text-amber-500" />
                      <span>Yeni Klasör</span>
                    </Button>
                  </>
                )}
              </div>
            </div>
          ) : viewMode === "list" ? (
            /* ========================================================= */
            /* LİSTE GÖRÜNÜMÜ (TABLE VIEW - VIRTUAL & GROUPED)           */
            /* ========================================================= */
            groupBy === "none" ? (
              <div className={`overflow-hidden rounded-2xl border ${styles.list}`}>
                <div className="hidden grid-cols-12 items-center border-b border-border/70 bg-white/40 dark:bg-card/40 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-muted-foreground sm:grid backdrop-blur-md">
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

                <div
                  style={{
                    height: `${listVirtualizer.getTotalSize()}px`,
                    width: "100%",
                    position: "relative",
                  }}
                >
                  {listVirtualizer.getVirtualItems().map((virtualRow) => {
                    const item = allExplorerItems[virtualRow.index];
                    if (!item) return null;
                    const rowStyle: React.CSSProperties = {
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      transform: `translateY(${virtualRow.start}px)`,
                    };
                    return "parent_id" in item
                      ? renderFolderRow(item as DokFolder, rowStyle)
                      : renderFileRow(item as DokFile, rowStyle);
                  })}
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {groupedBuckets.map((bucket) => {
                  const bucketItemCount = bucket.folders.length + bucket.files.length;
                  if (bucketItemCount === 0) return null;

                  return (
                    <div key={bucket.key} className="space-y-2">
                      <div className="flex items-center justify-between px-1 text-xs font-bold text-foreground">
                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500/15 border border-amber-500/30 px-2.5 py-1 text-amber-600 dark:text-amber-400">
                          <span>{bucket.label}</span>
                          <span className="text-[11px] font-mono font-semibold">({bucketItemCount})</span>
                        </span>
                      </div>

                      <div className={`overflow-hidden rounded-2xl border ${styles.list}`}>
                        <div className="hidden grid-cols-12 items-center border-b border-border/70 bg-white/40 dark:bg-card/40 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-muted-foreground sm:grid backdrop-blur-md">
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

                        <div className="divide-y divide-border/40">
                          {bucket.folders.map((folder) => renderFolderRow(folder))}
                          {bucket.files.map((file) => renderFileRow(file))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          ) : (
            /* ========================================================= */
            /* KART / GRID GÖRÜNÜMÜ (CARDS VIEW - VIRTUAL & GROUPED)     */
            /* ========================================================= */
            groupBy === "none" ? (
              <div
                style={{
                  height: `${gridVirtualizer.getTotalSize()}px`,
                  width: "100%",
                  position: "relative",
                }}
              >
                {gridVirtualizer.getVirtualItems().map((virtualRow) => {
                  const startIndex = virtualRow.index * gridMetrics.columnCount;
                  const rowItems = allExplorerItems.slice(startIndex, startIndex + gridMetrics.columnCount);

                  return (
                    <div
                      key={virtualRow.key}
                      data-index={virtualRow.index}
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: `${gridMetrics.rowHeight}px`,
                        transform: `translateY(${virtualRow.start}px)`,
                        display: "grid",
                        gridTemplateColumns: `repeat(${gridMetrics.columnCount}, minmax(0, 1fr))`,
                        gap: `${gridMetrics.gapX}px`,
                      }}
                    >
                      {rowItems.map((item) => {
                        return "parent_id" in item
                          ? renderFolderCard(item as DokFolder)
                          : renderFileCard(item as DokFile);
                      })}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-6">
                {groupedBuckets.map((bucket) => {
                  const bucketItemCount = bucket.folders.length + bucket.files.length;
                  if (bucketItemCount === 0) return null;

                  return (
                    <div key={bucket.key} className="space-y-3">
                      <div className="flex items-center justify-between px-1 text-xs font-bold text-foreground">
                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500/15 border border-amber-500/30 px-2.5 py-1 text-amber-600 dark:text-amber-400">
                          <span>{bucket.label}</span>
                          <span className="text-[11px] font-mono font-semibold">({bucketItemCount})</span>
                        </span>
                      </div>

                      {bucket.folders.length > 0 && (
                        <div
                          className="grid gap-3"
                          style={{
                            gridTemplateColumns: `repeat(auto-fill, minmax(170px, 1fr))`,
                          }}
                        >
                          {bucket.folders.map((folder) => renderFolderCard(folder))}
                        </div>
                      )}

                      {bucket.files.length > 0 && (
                        <div
                          className="grid gap-3"
                          style={{
                            gridTemplateColumns: `repeat(auto-fill, minmax(170px, 1fr))`,
                          }}
                        >
                          {bucket.files.map((file) => renderFileCard(file))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )
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
            onDownload={(file) => void handleDownload(file)}
          />
          <MobileDetailsSheet
            selectedItem={selectedItemForDrawer}
            onClose={() => setIsDetailsOpen(false)}
            onShare={(item) => handleOpenShareSingle(item)}
            onRename={(item) => setRenameItem({ ...item, type: item.type })}
            onDelete={(item) => setDeleteItem({ ...item, type: item.type })}
            onDownload={(file) => void handleDownload(file)}
          />
        </>
      )}

      {/* Modallar */}
      <NewFolderModal
        isOpen={isNewFolderOpen}
        currentFolderId={currentFolderId}
        onClose={() => setIsNewFolderOpen(false)}
        onSuccess={fetchItems}
        onStartPending={(pending) => insertPendingFolderInCache(dokQueryClient, currentQueryKey, pending)}
        onCreatedFolder={(serverFolder) => {
          replacePendingFolderInCache(dokQueryClient, currentQueryKey, serverFolder.id, serverFolder);
        }}
        onCancelPending={(tempId) => {
          removePendingFolderFromCache(dokQueryClient, currentQueryKey, tempId);
        }}
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
        onNavigateToFolder={(folderId) => navigateToFolder(folderId)}
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
