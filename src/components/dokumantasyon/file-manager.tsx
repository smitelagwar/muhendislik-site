// ============================================================================
// DÖKÜMANTASYON MODÜLÜ — GELİŞMİŞ DOSYA YÖNETİCİSİ (DRIVE / MEGA UX)
// ============================================================================

"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MotionConfig, motion } from "framer-motion";
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
  ChevronDown,
  Loader2,
  CheckSquare,
  Square,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
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
  RefreshCw,
  HelpCircle,
  X,
} from "lucide-react";
import { useToast } from "@/components/toast-provider";
import { Button } from "@/components/ui/button";
import { DokFile, DokFolder, DokBreadcrumbItem } from "@/lib/dokumantasyon/types";
import { formatBytes, formatDate } from "./ui-helpers";
import { FileTypeIcon, FolderIcon, resolveFileIconKind } from "./file-icons";
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
import { UploadProgressToast } from "./upload-progress-toast";
import { WorkspaceFilterSheet, WorkspaceFilters } from "./workspace-filter-sheet";
import { makeFolderUploadPlan, FolderUploadEntry } from "@/lib/dokumantasyon/folder-upload";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useDokUploadSession } from "./drive-v3/workspace-session";
import { requestDokMutation } from "@/lib/dokumantasyon/client-mutation";
import { deriveExplorerView, reconcileSelection } from "./drive-v3/explorer-derive";
import { executeBulkTrash, executeBulkMove, executeBulkStar, executeBulkCopy, BulkItem } from "./drive-v3/bulk-operations";
import { ClipboardBar, type ClipboardState } from "./drive-v3/clipboard-bar";
import { DriveContextMenu } from "./drive-v3/context-menu";
import { ShortcutsModal } from "./drive-v3/shortcuts-modal";
import { ExplorerSkeleton, TopFetchingBar } from "./drive-v3/explorer-skeleton";
import { FilterChipsBar, type FilterChipKey } from "./drive-v3/filter-chips-bar";
import { WorkspaceStatusBar } from "./drive-v3/workspace-status-bar";
import { DriveCheckbox } from "./drive-v3/drive-checkbox";
import { SelectionDock } from "./drive-v3/selection-dock";
import { ExplorerToolbar, type ExplorerDensity } from "./drive-v3/explorer-toolbar";
import { ExplorerFolderItem, ExplorerFileItem } from "./drive-v3/explorer-row-card";
import { QuickLookModal } from "./drive-v3/quick-look-modal";
import { CommandPalette, type PaletteCommand } from "./drive-v3/command-palette";
import { useUndoToast, type UndoMoveItem } from "./drive-v3/use-undo-toast";
import { useDriveSelection } from "./drive-v3/use-drive-selection";
import { useVirtualExplorer } from "./drive-v3/use-virtual-explorer";
import {
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
import { useMobileExplorer } from "./drive-v3/use-mobile-explorer";
import { MOBILE_EXPLORER_QUERY, resolveExplorerActivation, type ItemActivationSource } from "./drive-v3/explorer-activation";

import { CommandRegistry, CommandId, CommandContext, CommandTargetItem } from "./drive-v3/command-registry";
import { triggerCadIntentPreload } from "@/lib/dokumantasyon/cad-runtime/preload";
import { triggerPdfIntentPreload } from "@/lib/dokumantasyon/studio/pdf/pdfjs-preload";
import styles from "./dok-workspace.module.css";
import mobileStyles from "./mobile-workspace.module.css";
import { usePhonePresentation } from "./drive-v3/use-phone-presentation";
import { useWorkspaceHistory } from "./drive-v3/use-workspace-history";
import { MobileExplorer } from "./mobile-explorer";
import { MobileWorkspaceBar, MobileWorkspacePanel, MobileItemPanel, MobileSiteLinks, type MobileSurface } from "./mobile-workspace-controls";
import { MobileSearch } from "./mobile-search";
import { OverlayPortal } from "./drive-v3/overlay-portal";

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

function reconcileWorkspaceFilters(
  source: "sidebar" | "sheet",
  payload: DriveNavFilter | WorkspaceFilters,
  currentFilters: WorkspaceFilters
): { activeFilter: DriveNavFilter; filters: WorkspaceFilters; clearQuickQuery?: boolean } {
  if (source === "sidebar") {
    const nav = payload as DriveNavFilter;
    if (nav === "all") {
      return {
        activeFilter: "all",
        filters: { ...DEFAULT_WORKSPACE_FILTERS },
        clearQuickQuery: true,
      };
    }
    if (nav === "recent") {
      return {
        activeFilter: "recent",
        filters: { ...currentFilters, type: "all", starredOnly: false, scope: "all" },
      };
    }
    if (nav === "starred") {
      return {
        activeFilter: "starred",
        filters: { ...currentFilters, type: "all", starredOnly: true, scope: "all" },
      };
    }
    return {
      activeFilter: nav,
      filters: { ...currentFilters, type: nav, starredOnly: false },
    };
  }

  const next = payload as WorkspaceFilters;
  if (next.starredOnly) {
    return { activeFilter: "starred", filters: next };
  }
  if (next.type === "cad" || next.type === "pdf" || next.type === "image" || next.type === "document" || next.type === "other") {
    return { activeFilter: next.type, filters: next };
  }
  return { activeFilter: "all", filters: next };
}

export function DokumantasyonFileManager() {
  return <DokumantasyonFileManagerInner />;
}

function DokumantasyonFileManagerInner() {
  const router = useRouter();
  const { showToast } = useToast();
  const isMobileExplorer = useMobileExplorer();
  const isPhone = usePhonePresentation();
  const [mobileSurface, setMobileSurface] = useState<MobileSurface>(null);
  const [mobileItem, setMobileItem] = useState<DokFile | DokFolder | null>(null);
  const [mobileQuery, setMobileQuery] = useState("");
  const [mobileDetail, setMobileDetail] = useState<DokFile | DokFolder | null>(null);
  const phoneMoreRef = useRef<HTMLButtonElement>(null);
  const lastPointerTypeRef = useRef("mouse");
  const selectionModeButtonRef = useRef<HTMLButtonElement>(null);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      const sp = new URLSearchParams(window.location.search);
      return sp.get("folderId") || sp.get("folder") || null;
    }
    return null;
  });

  // Drive UX Durumları
  const [activeFilter, setActiveFilter] = useState<DriveNavFilter>("all");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [density, setDensity] = useState<ExplorerDensity>("comfortable");
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isSidebarOpenMobile, setIsSidebarOpenMobile] = useState(false);
  const [workspaceFilters, setWorkspaceFilters] = useState<WorkspaceFilters>(DEFAULT_WORKSPACE_FILTERS);
  const [quickQuery, setQuickQuery] = useState("");
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [quickLookFile, setQuickLookFile] = useState<DokFile | null>(null);
  const [inlineRenameItem, setInlineRenameItem] = useState<{
    id: string;
    type: "file" | "folder";
  } | null>(null);
  const [navHistory, setNavHistory] = useState<{
    past: Array<string | null>;
    future: Array<string | null>;
  }>({ past: [], future: [] });
  const [sidebarTreeRefreshKey, setSidebarTreeRefreshKey] = useState(0);
  const prefsHydratedRef = useRef(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [starMigrationVersion, setStarMigrationVersion] = useState(0);
  const [starPopId, setStarPopId] = useState<string | null>(null);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  // Sıralama & Gruplama Durumları
  const [sortBy, setSortBy] = useState<"name" | "date" | "size" | "type">("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [groupBy, setGroupBy] = useState<"none" | "type" | "date" | "size">("none");

  // TanStack Query Deterministik Sunucu Durumu (Zero-F5 Cache Engine)
  const navigationType =
    activeFilter === "cad" ||
    activeFilter === "pdf" ||
    activeFilter === "image" ||
    activeFilter === "document" ||
    activeFilter === "other"
      ? activeFilter
      : workspaceFilters.type;
  const activeCollection = activeFilter === "recent" ? "recent" : activeFilter === "starred" || workspaceFilters.starredOnly ? "starred" : "none";
  const effectiveScope = activeCollection !== "none" ? "all" : workspaceFilters.scope;

  const currentQueryKey = useMemo(() => {
    return dokKeys.items(currentFolderId, {
      collection: activeCollection,
      type: navigationType,
      date: workspaceFilters.date,
      size: workspaceFilters.size,
      scope: effectiveScope,
      sortBy,
      sortOrder,
    });
  }, [currentFolderId, activeCollection, navigationType, workspaceFilters.date, workspaceFilters.size, effectiveScope, sortBy, sortOrder]);

  const {
    data: queryData,
    isLoading: isQueryLoading,
    isFetching: isQueryFetching,
    isError: isQueryError,
    error: queryErrorObj,
    refetch: refetchItems,
  } = useDokItemsQuery({
    folderId: currentFolderId,
    collection: activeCollection,
    typeFilter: navigationType,
    dateFilter: workspaceFilters.date,
    sizeFilter: workspaceFilters.size,
    scope: effectiveScope,
    sortBy,
    sortOrder,
  });

  const folders = useMemo(() => queryData?.folders ?? [], [queryData?.folders]);
  const files = useMemo(() => queryData?.files ?? [], [queryData?.files]);
  const currentFolder = queryData?.folder ?? null;
  const breadcrumbs = queryData?.breadcrumbs ?? [{ id: null, name: "Kök Dizin" }];
  const starredCount = Number(queryData?.summary?.starredCount ?? 0);
  const summaryStarredCount = starredCount;
  const summaryTotalFiles = Number(queryData?.summary?.totalFiles ?? files.length);
  const summaryTotalFolders = Number(queryData?.summary?.totalFolders ?? folders.length);
  const summaryTotalSizeBytes = Number(
    queryData?.summary?.totalSizeBytes ??
      files.reduce((acc, f) => acc + Number(f.size_bytes), 0)
  );
  const summaryCategoryCounts = queryData?.summary?.categoryCounts;
  const summaryTrashCount = Number(queryData?.summary?.trashCount ?? 0);
  const summaryActiveSharesCount = Number(queryData?.summary?.activeSharesCount ?? 0);
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
        searchQuery: quickQuery,
      }
    );
  }, [folders, files, sortBy, sortOrder, groupBy, activeFilter, workspaceFilters, quickQuery]);

  // Otomatik agresif preload kaldırıldı — Kullanıcı niyetine (hover/touch) bağlı intent preload korunur.

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
    listRowHeight: !isMobileExplorer && density === "compact" ? 44 : 56,
    scrollContainerRef,
    enabled: !isPhone,
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
    isGrouped: groupBy !== "none",
  });

  const [dragOverFolderId, setDragOverFolderId] = useState<string | null>(null);
  const [dragOverBreadcrumbId, setDragOverBreadcrumbId] = useState<string | null>(null);

  // A3 — Açık Mobil Seçim Modu
  // Normal mod: tap → aç/klasöre gir
  // Selection mode: tap → toggle seçim
  const [isMobileSelectionMode, setIsMobileSelectionMode] = useState(false);

  // Selection modunu kapat ve seçimi temizle
  const exitMobileSelectionMode = () => {
    setIsMobileSelectionMode(false);
    clearSelection();
    requestAnimationFrame(() => (phoneMoreRef.current || selectionModeButtonRef.current)?.focus({ preventScroll: true }));
  };


  // Breakpoint değiştiğinde eski seçim oturumu her iki yönde de kapanır.
  useEffect(() => {
    const media = window.matchMedia(MOBILE_EXPLORER_QUERY);
    const resetMode = () => { setIsMobileSelectionMode(false); clearSelection(); };
    media.addEventListener("change", resetMode);
    return () => media.removeEventListener("change", resetMode);
  }, [clearSelection]);

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

  const [mobileSearchItem, setMobileSearchItem] = useState<DokFile | null>(null);
  const [mobileUploadOpen, setMobileUploadOpen] = useState(false);
  const historySnapshot = { shareResult, shareItemsToProcess, mobileUploadOpen, mobileSearchItem, selectionIds: Array.from(selectedIds), currentFolderId, mobileSurface, mobileItem, mobileDetail, mobileQuery, isMobileSelectionMode, isSearchOpen, isNewFolderOpen, renameItem, moveItems, deleteItem, isMultiDeleteOpen, isCreateShareOpen, isTrashOpen, isActiveSharesOpen, viewMode, sortBy, sortOrder, groupBy, workspaceFilters, activeFilter };
  const historyDepth = (isMobileSelectionMode || isSearchOpen ? 1 : 0) + (shareResult || mobileUploadOpen || mobileSearchItem || mobileSurface || mobileItem || mobileDetail || isNewFolderOpen || renameItem || moveItems.length || deleteItem || isMultiDeleteOpen || isCreateShareOpen || isTrashOpen || isActiveSharesOpen ? 1 : 0);
  useWorkspaceHistory(historySnapshot, historyDepth, value => {
    setShareResult(value.shareResult); setShareItemsToProcess(value.shareItemsToProcess); setMobileUploadOpen(value.mobileUploadOpen); setMobileSearchItem(value.mobileSearchItem); setSelectedIds(new Set(value.selectionIds)); setCurrentFolderId(value.currentFolderId); setMobileSurface(value.mobileSurface); setMobileItem(value.mobileItem); setMobileDetail(value.mobileDetail); setMobileQuery(value.mobileQuery);
    setIsMobileSelectionMode(value.isMobileSelectionMode); if(!value.isMobileSelectionMode) clearSelection(); setIsSearchOpen(value.isSearchOpen); setIsNewFolderOpen(value.isNewFolderOpen); setRenameItem(value.renameItem); setMoveItems(value.moveItems); setDeleteItem(value.deleteItem); setIsMultiDeleteOpen(value.isMultiDeleteOpen); setIsCreateShareOpen(value.isCreateShareOpen); setIsTrashOpen(value.isTrashOpen); setIsActiveSharesOpen(value.isActiveSharesOpen);
    setViewMode(value.viewMode); setSortBy(value.sortBy); setSortOrder(value.sortOrder); setGroupBy(value.groupBy); setWorkspaceFilters(value.workspaceFilters); setActiveFilter(value.activeFilter);
  }, isPhone);

  // Yükleme Sırası ve Sürükle-Bırak
  const { queue: uploadQueue, manager: uploadManager } = useDokUploadSession();
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [configError, setConfigError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mobileMenuButtonRef = useRef<HTMLButtonElement>(null);
  const mobileSidebarRef = useRef<HTMLDivElement>(null);
  const [supportsFolderUpload, setSupportsFolderUpload] = useState(false);

  // URL & Tarayıcı Geçmişi ile Klasör Konumu Senkronizasyonu + ←/→ Geçmiş
  const syncUrlFolder = useCallback((folderId: string | null) => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    if (folderId) {
      url.searchParams.set("folderId", folderId);
    } else {
      url.searchParams.delete("folderId");
    }
    url.searchParams.delete("folder");
    if (url.search !== window.location.search) {
      window.history.pushState({ folderId }, "", url.toString());
    }
  }, []);

  const navigateToFolder = useCallback(
    (folderId: string | null, options?: { recordHistory?: boolean }) => {
      const recordHistory = options?.recordHistory ?? true;
      setInlineRenameItem(null);
      if (recordHistory && folderId !== currentFolderId) {
        setNavHistory((prev) => ({
          past: [...prev.past.slice(-24), currentFolderId],
          future: [],
        }));
      }
      setCurrentFolderId(folderId);
      syncUrlFolder(folderId);
    },
    [currentFolderId, syncUrlFolder]
  );

  const handleHistoryBack = useCallback(() => {
    if (navHistory.past.length === 0) return;
    const previous = navHistory.past[navHistory.past.length - 1];
    setNavHistory({
      past: navHistory.past.slice(0, -1),
      future: [currentFolderId, ...navHistory.future.slice(0, 24)],
    });
    setCurrentFolderId(previous);
    syncUrlFolder(previous);
  }, [currentFolderId, navHistory, syncUrlFolder]);

  const handleHistoryForward = useCallback(() => {
    if (navHistory.future.length === 0) return;
    const next = navHistory.future[0];
    setNavHistory({
      past: [...navHistory.past.slice(-24), currentFolderId],
      future: navHistory.future.slice(1),
    });
    setCurrentFolderId(next);
    syncUrlFolder(next);
  }, [currentFolderId, navHistory, syncUrlFolder]);

  // localStorage Tercih Kalıcılığı (dok_workspace_prefs_v5)
  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const raw = localStorage.getItem("dok_workspace_prefs_v5");
        if (raw) {
          const parsed = JSON.parse(raw) as {
            viewMode?: string;
            density?: string;
            detailsOpen?: boolean;
          };
          if (parsed.viewMode === "list" || parsed.viewMode === "grid") {
            setViewMode(parsed.viewMode);
          }
          if (parsed.density === "comfortable" || parsed.density === "compact") {
            setDensity(parsed.density);
          }
          if (typeof parsed.detailsOpen === "boolean") {
            setIsDetailsOpen(parsed.detailsOpen);
          }
        }
      } catch {
        // Geçersiz localStorage verisi yoksayılır
      } finally {
        prefsHydratedRef.current = true;
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!prefsHydratedRef.current) return;
    try {
      localStorage.setItem(
        "dok_workspace_prefs_v5",
        JSON.stringify({ viewMode, density, detailsOpen: isDetailsOpen })
      );
    } catch {
      // Depolama kotası aşımı yoksayılır
    }
  }, [viewMode, density, isDetailsOpen]);

  useEffect(() => {
    const handlePopState = () => {
      const searchParams = new URLSearchParams(window.location.search);
      const urlFolderId = searchParams.get("folderId") || searchParams.get("folder") || null;
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
    const timer = window.setTimeout(() => setSupportsFolderUpload(supported), 0);
    return () => window.clearTimeout(timer);
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
    setSidebarTreeRefreshKey((k) => k + 1);
  }, [refetchItems]);

  const { pushUndoTrash, pushUndoMove, pushUndoRename } = useUndoToast({
    onRefresh: fetchItems,
    disabled:
      isSearchOpen ||
      isCommandPaletteOpen ||
      quickLookFile !== null ||
      isNewFolderOpen ||
      renameItem !== null ||
      moveItems.length > 0 ||
      deleteItem !== null ||
      isMultiDeleteOpen ||
      isCreateShareOpen ||
      isTrashOpen ||
      isFilterSheetOpen ||
      isActiveSharesOpen ||
      isShortcutsOpen ||
      inlineRenameItem !== null,
  });

  const buildUndoMoveSnapshot = useCallback(
    (items: BulkItem[]): UndoMoveItem[] => {
      return items.map((item) => {
        if (item.type === "folder") {
          const found = folders.find((f) => f.id === item.id);
          return {
            id: item.id,
            type: "folder",
            previousParentId: found ? found.parent_id : currentFolderId,
          };
        }
        const found = files.find((f) => f.id === item.id);
        return {
          id: item.id,
          type: "file",
          previousParentId: found ? found.folder_id : currentFolderId,
        };
      });
    },
    [folders, files, currentFolderId]
  );

  const handleCommitInlineRename = useCallback(
    async (item: { id: string; type: "file" | "folder"; oldName: string }, nextName: string) => {
      setInlineRenameItem(null);
      if (!nextName || nextName === item.oldName) return;
      updateItemNameInCache(dokQueryClient, currentQueryKey, item.id, item.type, nextName);
      const endpoint =
        item.type === "folder"
          ? `/api/dokumantasyon/folders/${item.id}`
          : `/api/dokumantasyon/files/${item.id}`;
      const res = await requestDokMutation(endpoint, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          item.type === "folder" ? { name: nextName } : { displayName: nextName }
        ),
      });
      if (!res.ok) {
        updateItemNameInCache(dokQueryClient, currentQueryKey, item.id, item.type, item.oldName);
        setActionError(res.message);
        showToast(res.message, "error");
        return;
      }
      pushUndoRename({
        id: item.id,
        type: item.type,
        previousName: item.oldName,
        newName: nextName,
      });
      await fetchItems();
    },
    [currentQueryKey, fetchItems, pushUndoRename, showToast]
  );

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
    setStarPopId(id);
    window.setTimeout(() => setStarPopId((prev) => (prev === id ? null : prev)), 320);
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
      } else {
        showToast(nextStarred ? "Yıldızlılara eklendi" : "Yıldız kaldırıldı", "info");
        void refetchItems();
      }
    } catch {
      updateItemStarInCache(dokQueryClient, currentQueryKey, id, type, isStarred);
      setActionError("Yıldız durumu güncellenemedi.");
    }
  };

  const handleNavigationFilter = (filter: DriveNavFilter) => {
    const reconciled = reconcileWorkspaceFilters("sidebar", filter, workspaceFilters);
    setActiveFilter(reconciled.activeFilter);
    setWorkspaceFilters(reconciled.filters);
    if (reconciled.clearQuickQuery) {
      setQuickQuery("");
    }
  };

  const handleDropOnFolder = useCallback(
    async (items: BulkItem[], targetFolderId: string | null) => {
      try {
        const snapshot = buildUndoMoveSnapshot(items);
        const result = await executeBulkMove(items, targetFolderId);
        if (result.succeeded.length > 0) {
          const targetFolder = targetFolderId
            ? folders.find((f) => f.id === targetFolderId)?.name
            : "Kök Dizin";
          const succeededSet = new Set(
            result.succeeded.map((s) =>
              typeof s === "string" ? s : (s as unknown as { id: string }).id
            )
          );
          pushUndoMove(
            snapshot.filter((s) => succeededSet.has(s.id)),
            targetFolder
          );
          await fetchItems();
        }
        if (result.failed.length > 0) {
          const msg = `${items.length} öğeden ${result.failed.length} tanesi taşınamadı`;
          setActionError(msg);
          showToast(msg, "error");
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Taşıma işlemi başarısız.";
        setActionError(msg);
        showToast(msg, "error");
      }
    },
    [buildUndoMoveSnapshot, fetchItems, folders, pushUndoMove, showToast]
  );

  const handleSidebarDropToStarred = useCallback(
    async (items: BulkItem[]) => {
      if (items.length === 0) return;
      items.forEach((i) => {
        updateItemStarInCache(dokQueryClient, currentQueryKey, i.id, i.type, true);
      });
      const result = await executeBulkStar(items, true);
      if (result.succeeded.length > 0) {
        showToast(`${result.succeeded.length} öğe yıldızlılara eklendi`, "info");
        await fetchItems();
      }
      if (result.failed.length > 0) {
        showToast(`${result.failed.length} öğe yıldızlanamadı`, "error");
        await fetchItems();
      }
    },
    [currentQueryKey, fetchItems, showToast]
  );

  const handleSidebarDropToTrash = useCallback(
    async (items: BulkItem[]) => {
      if (items.length === 0) return;
      const result = await executeBulkTrash(items);
      if (result.succeeded.length > 0) {
        const succeededSet = new Set(result.succeeded);
        pushUndoTrash(
          items.filter((i) => succeededSet.has(i.id)),
          `${result.succeeded.length} öğe çöp kutusuna taşındı`
        );
        await fetchItems();
      }
      if (result.failed.length > 0) {
        showToast(`${result.failed.length} öğe çöpe taşınamadı`, "error");
      }
    },
    [fetchItems, pushUndoTrash, showToast]
  );

  const breadcrumbDropCleanupsRef = useRef<Map<string, () => void>>(new Map());
  const setBreadcrumbDropRef = useCallback(
    (node: HTMLElement | null, folderId: string | null) => {
      const key = folderId ?? "__root__";
      const existing = breadcrumbDropCleanupsRef.current.get(key);
      if (existing) {
        existing();
        breadcrumbDropCleanupsRef.current.delete(key);
      }
      if (!node || isMobileExplorer || folderId === currentFolderId) return;

      const cleanup = registerFolderDropTarget({
        element: node,
        targetFolderId: key,
        onDropItems: (items, targetKey) => {
          void handleDropOnFolder(items, targetKey === "__root__" ? null : targetKey);
        },
        onDragStateChange: (isOver) => {
          setDragOverBreadcrumbId(isOver ? key : null);
        },
      });
      breadcrumbDropCleanupsRef.current.set(key, cleanup);
    },
    [isMobileExplorer, currentFolderId, handleDropOnFolder]
  );

  useEffect(() => {
    return () => {
      breadcrumbDropCleanupsRef.current.forEach((c) => c());
      breadcrumbDropCleanupsRef.current.clear();
    };
  }, []);

  const allSelectedItems: BulkItem[] = useMemo(() => {
    return Array.from(selectedIds).map((id) => {
      const folder = folders.find((f) => f.id === id);
      return { id, type: (folder ? "folder" : "file") as "file" | "folder" };
    });
  }, [selectedIds, folders, files]);

  const selectedIdsRef = useRef(selectedIds);
  const allSelectedItemsRef = useRef(allSelectedItems);
  useEffect(() => {
    selectedIdsRef.current = selectedIds;
    allSelectedItemsRef.current = allSelectedItems;
  }, [selectedIds, allSelectedItems]);

  const pddNodesRef = useRef<Map<string, HTMLElement>>(new Map());
  const pddCleanupsRef = useRef<Map<string, () => void>>(new Map());

  const setFolderNodeRef = useCallback(
    (node: HTMLElement | null, folder: DokFolder) => {
      const currentNode = pddNodesRef.current.get(folder.id);
      if (currentNode === node) return;

      const existing = pddCleanupsRef.current.get(folder.id);
      if (existing) {
        existing();
        pddCleanupsRef.current.delete(folder.id);
        pddNodesRef.current.delete(folder.id);
      }
      if (!node || isMobileExplorer) return;

      pddNodesRef.current.set(folder.id, node);
      const cleanupDraggable = registerDraggableItem({
        element: node,
        item: { id: folder.id, type: "folder" },
        getSelectedIds: () => selectedIdsRef.current,
        getAllSelectedItems: () => allSelectedItemsRef.current,
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
    [replaceSelection, handleDropOnFolder, isMobileExplorer]
  );

  const setFileNodeRef = useCallback(
    (node: HTMLElement | null, file: DokFile) => {
      const currentNode = pddNodesRef.current.get(file.id);
      if (currentNode === node) return;

      const existing = pddCleanupsRef.current.get(file.id);
      if (existing) {
        existing();
        pddCleanupsRef.current.delete(file.id);
        pddNodesRef.current.delete(file.id);
      }
      if (!node || isMobileExplorer) return;

      pddNodesRef.current.set(file.id, node);
      const cleanupDraggable = registerDraggableItem({
        element: node,
        item: { id: file.id, type: "file" },
        getSelectedIds: () => selectedIdsRef.current,
        getAllSelectedItems: () => allSelectedItemsRef.current,
        onSelectSingle: (id) => replaceSelection([id]),
      });

      pddCleanupsRef.current.set(file.id, cleanupDraggable);
    },
    [replaceSelection, isMobileExplorer]
  );

  useEffect(() => {
    return () => {
      pddCleanupsRef.current.forEach((c) => c());
      pddCleanupsRef.current.clear();
      pddNodesRef.current.clear();
    };
  }, []);

  // Auto-scroll for container during drag
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    return registerContainerAutoScroll(el);
  }, []);

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

  const queueUploadEntries = async (entries: Array<{ file: File; folderId: string | null; relativePath?: string }>) => {
    uploadManager.enqueue(entries.map(entry => ({ file: entry.file, targetFolderId: entry.folderId, relativePath: entry.relativePath })));
  };
  const uploadFiles = async (fileList: FileList | File[]) => {
    await queueUploadEntries(Array.from(fileList).map(file => ({ file, folderId: currentFolderId })));
  };
  const handleRetryUpload = async (itemId: string) => { uploadManager.retryItem(itemId); };

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

  // ============================================================================
  // COMMAND REGISTRY & UNIFIED ACTION DISPATCHER (DRIVE V3.1)
  // ============================================================================
  const commandRegistryRef = useRef(new CommandRegistry());
  const [clipboardState, setClipboardState] = useState<ClipboardState | null>(null);
  const [isPasting, setIsPasting] = useState(false);
  const [contextMenuState, setContextMenuState] = useState<{
    isOpen: boolean;
    x: number;
    y: number;
    targetItem: CommandTargetItem | null;
  }>({ isOpen: false, x: 0, y: 0, targetItem: null });

  const cutItemIds = useMemo(() => {
    if (clipboardState?.mode !== "cut") return new Set<string>();
    return new Set(clipboardState.items.map((item) => item.id));
  }, [clipboardState]);

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
        extension: file?.extension || file?.display_name.split(".").pop() || "",
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
      if (id === "select-all" && isMobileExplorer && !isMobileSelectionMode) {
        return false;
      }
      const ctx = getCommandContext();
      return commandRegistryRef.current.execute(id, ctx, payload);
    },
    [getCommandContext, isMobileExplorer, isMobileSelectionMode]
  );

  // Register All 27 Command Handlers
  useEffect(() => {
    const registry = commandRegistryRef.current;
    const cleanups: Array<() => void> = [];

    cleanups.push(registry.register("new-folder", () => {
      setIsNewFolderOpen(true);
    }));

    cleanups.push(registry.register("upload-files", () => {
      fileInputRef.current?.click();
    }));

    cleanups.push(registry.register("upload-folder", () => {
      openFolderPicker();
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

    cleanups.push(registry.register("open-cad-v2", (ctx) => {
      if (ctx.selectedItems.length !== 1) return;
      const target = ctx.selectedItems[0];
      if (target.type === "file") {
        router.push(`/dokumantasyon/dosya/${target.id}?cadEngine=v2`);
      }
    }));

    cleanups.push(registry.register("preview", (ctx) => {
      if (ctx.selectedItems.length !== 1) return;
      const target = ctx.selectedItems[0];
      if (target.type === "file") {
        const fileObj = files.find((f) => f.id === target.id);
        if (fileObj) {
          setQuickLookFile(fileObj);
        } else {
          router.push(`/dokumantasyon/dosya/${target.id}`);
        }
      }
    }));

    cleanups.push(registry.register("download", (ctx) => {
      const fileItems = ctx.selectedItems.filter((i) => i.type === "file");
      if (fileItems.length === 0) {
        showToast("Klasörler doğrudan indirilemez; lütfen en az bir dosya seçin.", "info");
        return;
      }
      fileItems.forEach((item) => {
        const fileObj = files.find((f) => f.id === item.id);
        if (fileObj) void handleDownload(fileObj);
      });
    }));

    cleanups.push(registry.register("rename", (ctx) => {
      if (ctx.selectedItems.length === 1) {
        const target = ctx.selectedItems[0];
        if (!isMobileExplorer && viewMode === "list") {
          setInlineRenameItem({ id: target.id, type: target.type });
          return;
        }
        setRenameItem({
          id: target.id,
          name: target.name,
          type: target.type,
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

    cleanups.push(registry.register("restore", () => {
      setIsTrashOpen(true);
    }));

    cleanups.push(registry.register("delete-forever", () => {
      setIsTrashOpen(true);
    }));

    cleanups.push(registry.register("star", async (ctx) => {
      if (ctx.selectedItems.length === 0) return;
      const bulkItems: BulkItem[] = ctx.selectedItems.map((i) => ({ id: i.id, type: i.type }));
      ctx.selectedItems.forEach((i) => {
        updateItemStarInCache(dokQueryClient, currentQueryKey, i.id, i.type, true);
      });
      const result = await executeBulkStar(bulkItems, true);
      if (result.succeeded.length > 0) {
        showToast(
          result.succeeded.length === 1
            ? "Yıldızlılara eklendi"
            : `${result.succeeded.length} öğe yıldızlılara eklendi`,
          "info"
        );
        void refetchItems();
      }
      if (result.failed.length > 0) {
        showToast(`${ctx.selectedItems.length} öğeden ${result.failed.length} tanesi yıldızlanamadı`, "error");
        void refetchItems();
      }
    }));

    cleanups.push(registry.register("unstar", async (ctx) => {
      if (ctx.selectedItems.length === 0) return;
      const bulkItems: BulkItem[] = ctx.selectedItems.map((i) => ({ id: i.id, type: i.type }));
      ctx.selectedItems.forEach((i) => {
        updateItemStarInCache(dokQueryClient, currentQueryKey, i.id, i.type, false);
      });
      const result = await executeBulkStar(bulkItems, false);
      if (result.succeeded.length > 0) {
        showToast(
          result.succeeded.length === 1
            ? "Yıldız kaldırıldı"
            : `${result.succeeded.length} öğeden yıldız kaldırıldı`,
          "info"
        );
        void refetchItems();
      }
      if (result.failed.length > 0) {
        showToast(`${ctx.selectedItems.length} öğeden ${result.failed.length} tanesinin yıldızı kaldırılamadı`, "error");
        void refetchItems();
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
      // Strict mobil sözleşme: command palette/harici dispatcher da Seç modu
      // kapalıyken görünmez bir seçim oturumu başlatamaz.
      if (isMobileExplorer && !isMobileSelectionMode) return;
      selectAll();
    }));

    cleanups.push(registry.register("clear-selection", () => {
      clearSelection();
    }));

    cleanups.push(registry.register("refresh", async () => {
      await refetchItems();
      showToast("Çalışma alanı yenilendi", "info");
    }));

    cleanups.push(registry.register("change-view", (_ctx, payload) => {
      if (payload === "list" || payload === "grid") {
        setViewMode(payload);
      } else {
        setViewMode((prev) => (prev === "list" ? "grid" : "list"));
      }
    }));

    cleanups.push(registry.register("change-sort", (_ctx, payload) => {
      const p = payload as { sortBy?: "name" | "date" | "size" | "type"; sortOrder?: "asc" | "desc" } | undefined;
      if (p?.sortBy) setSortBy(p.sortBy);
      if (p?.sortOrder) setSortOrder(p.sortOrder);
    }));

    cleanups.push(registry.register("open-trash", () => {
      setIsTrashOpen(true);
    }));

    cleanups.push(registry.register("open-active-shares", () => {
      setIsActiveSharesOpen(true);
    }));

    cleanups.push(registry.register("copy", (ctx) => {
      if (ctx.selectedItems.length > 0) {
        setClipboardState({ mode: "copy", items: ctx.selectedItems });
        showToast(`${ctx.selectedItems.length} öğe panoya kopyalandı`, "info");
      }
    }));

    cleanups.push(registry.register("cut", (ctx) => {
      if (ctx.selectedItems.length > 0) {
        setClipboardState({ mode: "cut", items: ctx.selectedItems });
        showToast(`${ctx.selectedItems.length} öğe kesildi`, "info");
      }
    }));

    cleanups.push(registry.register("paste", async (ctx) => {
      if (!ctx.clipboardState || ctx.clipboardState.items.length === 0) return;
      const { mode, items } = ctx.clipboardState;
      const bulkItems: BulkItem[] = items.map((i) => ({ id: i.id, type: i.type }));
      setIsPasting(true);
      try {
        const result =
          mode === "cut"
            ? await executeBulkMove(bulkItems, ctx.currentFolderId)
            : await executeBulkCopy(bulkItems, ctx.currentFolderId);

        if (result.succeeded.length > 0) {
          if (mode === "cut") {
            const succeededSet = new Set(
            result.succeeded.map((s) =>
              typeof s === "string" ? s : (s as unknown as { id: string }).id
            )
          );
            const cutUndoItems: UndoMoveItem[] = items
              .filter((i) => succeededSet.has(i.id))
              .map((orig) => ({
                id: orig.id,
                type: orig.type,
                previousParentId: orig.parentId ?? null,
              }));
            pushUndoMove(cutUndoItems, currentFolder?.name || "Kök Dizin", `${result.succeeded.length} öğe taşındı`);
            setClipboardState(null);
          } else {
            showToast(`${result.succeeded.length} öğe yapıştırıldı`, "success");
          }
          await fetchItems();
        }
        if (result.failed.length > 0) {
          const msg = `${bulkItems.length} öğeden ${result.failed.length} tanesi yapıştırılamadı — seçili bırakıldı`;
          setActionError(msg);
          showToast(msg, "error");
          setSelectedIds(new Set(result.failed.map((f) => f.id)));
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Yapıştırma işlemi başarısız.";
        setActionError(msg);
        showToast(msg, "error");
      } finally {
        setIsPasting(false);
      }
    }));

    return () => {
      cleanups.forEach((c) => c());
    };
  }, [
    allSelectedItems,
    files,
    currentFolderId,
    currentQueryKey,
    navigateToFolder,
    router,
    selectAll,
    clearSelection,
    setSelectedIds,
    refetchItems,
    setViewMode,
    isMobileExplorer,
    isMobileSelectionMode,
    showToast,
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

  // 4. Detay Paneli İçin Seçili Öğeler & Klasör Özeti
  const selectedItemForDrawer = useMemo(() => {
    if (selectedIds.size === 0) return null;
    const firstId = Array.from(selectedIds)[0];
    const folder = folders.find((f) => f.id === firstId);
    if (folder) return { type: "folder" as const, folder };
    const file = files.find((f) => f.id === firstId);
    if (file) return { type: "file" as const, file };
    return null;
  }, [selectedIds, folders, files]);

  const drawerSelectedEntries = useMemo(() => {
    const entries: Array<{ id: string; type: "file" | "folder"; file?: DokFile; folder?: DokFolder }> = [];
    selectedIds.forEach((id) => {
      const folder = folders.find((f) => f.id === id);
      if (folder) {
        entries.push({ id, type: "folder", folder });
        return;
      }
      const file = files.find((f) => f.id === id);
      if (file) {
        entries.push({ id, type: "file", file });
      }
    });
    return entries;
  }, [selectedIds, folders, files]);

  const drawerFolderSummary = useMemo(() => ({
    foldersCount: displayedFolders.length,
    filesCount: displayedFiles.length,
    totalSizeBytes: displayedFiles.reduce((acc, f) => acc + Number(f.size_bytes), 0),
    files: displayedFiles,
  }), [displayedFolders, displayedFiles]);

  const selectedSizeBytes = useMemo(() => {
    let total = 0;
    selectedIds.forEach((id) => {
      const file = files.find((f) => f.id === id);
      if (file) total += Number(file.size_bytes);
    });
    return total;
  }, [selectedIds, files]);

  const selectedHasFile = useMemo(() => {
    for (const id of selectedIds) {
      if (files.some((f) => f.id === id)) return true;
    }
    return false;
  }, [selectedIds, files]);

  const allSelectedStarred = useMemo(() => {
    if (selectedIds.size === 0) return false;
    for (const id of selectedIds) {
      const folder = folders.find((f) => f.id === id);
      if (folder) {
        if (!folder.starred_at) return false;
        continue;
      }
      const file = files.find((f) => f.id === id);
      if (!file || !file.starred_at) return false;
    }
    return true;
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
  const allItemIds = visibleOrderedIds;

  const isAllSelected =
    allItemIds.length > 0 && allItemIds.every((id) => selectedIds.has(id));

  const handleToggleSelectAll = () => {
    if (isMobileExplorer && !isMobileSelectionMode) return;
    if (isAllSelected) {
      setSelectedIds(new Set());
    } else {
      replaceSelection(allItemIds);
    }
  };

  const handleInvertSelection = useCallback(() => {
    if (isMobileExplorer && !isMobileSelectionMode) return;
    const inverted = allItemIds.filter((id) => !selectedIds.has(id));
    replaceSelection(inverted);
  }, [allItemIds, isMobileExplorer, isMobileSelectionMode, replaceSelection, selectedIds]);

  // Çoklu Silme
  const handleMultiDeleteConfirm = async () => {
    const ids: string[] = Array.from(selectedIds);
    if (ids.length === 0) return;

    const itemsToTrash: BulkItem[] = ids.map((id) => {
      const folder = folders.find((f) => f.id === id);
      return { id, type: (folder ? "folder" : "file") as "file" | "folder" };
    });

    const result = await executeBulkTrash(itemsToTrash);

    if (result.succeeded.length > 0) {
      const succeededSet = new Set(result.succeeded);
      pushUndoTrash(
        itemsToTrash.filter((i) => succeededSet.has(i.id)),
        `${result.succeeded.length} öğe çöp kutusuna taşındı`
      );
      await fetchItems();
    }
    setSelectedIds(new Set(result.failed.map((f) => f.id)));

    if (result.failed.length > 0) {
      showToast(`${ids.length} öğeden ${result.failed.length} tanesi başarısız oldu — seçili bırakıldı`, "error");
      throw new Error(`${ids.length} öğeden ${result.failed.length}'si silinemedi. Başarısız öğeler seçili bırakıldı.`);
    }
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
    const reconciled = reconcileWorkspaceFilters("sheet", filters, workspaceFilters);
    setWorkspaceFilters(reconciled.filters);
    setActiveFilter(reconciled.activeFilter);
  };

  const handleRemoveFilterChip = (key: FilterChipKey) => {
    if (key === "collection") {
      setActiveFilter("all");
      setWorkspaceFilters((prev) => ({
        ...prev,
        starredOnly: false,
        scope: "current",
      }));
      return;
    }
    if (key === "type") {
      const next = { ...workspaceFilters, type: "all" as const };
      setWorkspaceFilters(next);
      if (activeFilter === "cad" || activeFilter === "pdf" || activeFilter === "image") {
        setActiveFilter("all");
      }
      return;
    }
    if (key === "date") {
      setWorkspaceFilters((prev) => ({ ...prev, date: "all" }));
      return;
    }
    if (key === "size") {
      setWorkspaceFilters((prev) => ({ ...prev, size: "all" }));
      return;
    }
    if (key === "scope") {
      setWorkspaceFilters((prev) => ({ ...prev, scope: "current" }));
      return;
    }
    if (key === "starred") {
      setWorkspaceFilters((prev) => ({ ...prev, starredOnly: false }));
      if (activeFilter === "starred") setActiveFilter("all");
      return;
    }
    if (key === "search") {
      setQuickQuery("");
    }
  };

  const handleClearAllFilters = () => {
    setActiveFilter("all");
    setWorkspaceFilters(DEFAULT_WORKSPACE_FILTERS);
    setQuickQuery("");
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (isMobileExplorer) return;
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea, select, [contenteditable='true']")) return;
      const dialogIsOpen =
        isSearchOpen ||
        isCommandPaletteOpen ||
        quickLookFile !== null ||
        inlineRenameItem !== null ||
        isNewFolderOpen ||
        renameItem !== null ||
        moveItems.length > 0 ||
        deleteItem !== null ||
        isMultiDeleteOpen ||
        isCreateShareOpen ||
        isTrashOpen ||
        isFilterSheetOpen ||
        isActiveSharesOpen ||
        isShortcutsOpen ||
        shareResult !== null;
      if (dialogIsOpen) return;

      const isCtrl = event.ctrlKey || event.metaKey;
      const lowerKey = event.key.toLowerCase();

      if (isCtrl && !event.shiftKey && !event.altKey && lowerKey === "k") {
        event.preventDefault();
        setIsCommandPaletteOpen(true);
      } else if (event.altKey && !isCtrl && event.key === "ArrowLeft") {
        event.preventDefault();
        handleHistoryBack();
      } else if (event.altKey && !isCtrl && event.key === "ArrowRight") {
        event.preventDefault();
        handleHistoryForward();
      } else if ((event.key === "/" && !isCtrl && !event.altKey) || (isCtrl && event.shiftKey && lowerKey === "f")) {
        event.preventDefault();
        void executeCommand("search");
      } else if (event.key === "?" && !isCtrl && !event.altKey) {
        event.preventDefault();
        setIsShortcutsOpen(true);
      } else if (!isCtrl && !event.altKey && event.shiftKey && lowerKey === "n") {
        event.preventDefault();
        void executeCommand("new-folder");
      } else if (isCtrl && !event.shiftKey && !event.altKey && lowerKey === "u") {
        event.preventDefault();
        void executeCommand("upload-files");
      } else if (isCtrl && !event.shiftKey && !event.altKey && lowerKey === "d" && selectedIds.size > 0) {
        event.preventDefault();
        void executeCommand("download");
      } else if (isCtrl && !event.shiftKey && !event.altKey && lowerKey === "a") {
        event.preventDefault();
        void executeCommand("select-all");
      } else if (event.altKey && !isCtrl && lowerKey === "s" && selectedIds.size > 0) {
        event.preventDefault();
        void executeCommand("share");
      } else if (!isCtrl && !event.altKey && !event.shiftKey && lowerKey === "s" && selectedIds.size > 0) {
        event.preventDefault();
        void executeCommand(allSelectedStarred ? "unstar" : "star");
      } else if (!isCtrl && !event.altKey && !event.shiftKey && lowerKey === "m" && selectedIds.size > 0) {
        event.preventDefault();
        void executeCommand("move");
      } else if (!isCtrl && !event.altKey && !event.shiftKey && lowerKey === "v") {
        event.preventDefault();
        void executeCommand("change-view");
      } else if (!isCtrl && !event.altKey && !event.shiftKey && lowerKey === "i") {
        event.preventDefault();
        void executeCommand("details");
      } else if (!isCtrl && !event.altKey && !event.shiftKey && lowerKey === "r") {
        event.preventDefault();
        void executeCommand("refresh");
      } else if (!isCtrl && !event.altKey && !event.shiftKey && (event.key === " " || lowerKey === "p") && selectedIds.size === 1) {
        event.preventDefault();
        void executeCommand("preview");
      } else if (event.key === "Delete" && selectedIds.size > 0) {
        event.preventDefault();
        void executeCommand("trash");
      } else if (event.key === "Escape") {
        if (contextMenuState.isOpen) {
          event.preventDefault();
          setContextMenuState((prev) => ({ ...prev, isOpen: false }));
        } else if (selectedIds.size > 0 || clipboardState !== null) {
          event.preventDefault();
          void executeCommand("clear-selection");
          setClipboardState(null);
        }
      } else if (event.key === "Enter" && selectedIds.size === 1) {
        event.preventDefault();
        void executeCommand("open");
      } else if (event.key === "F2" && selectedIds.size === 1) {
        event.preventDefault();
        void executeCommand("rename");
      } else if (isCtrl && lowerKey === "c" && selectedIds.size > 0) {
        event.preventDefault();
        void executeCommand("copy");
      } else if (isCtrl && lowerKey === "x" && selectedIds.size > 0) {
        event.preventDefault();
        void executeCommand("cut");
      } else if (isCtrl && lowerKey === "v" && clipboardState !== null && clipboardState.items.length > 0) {
        event.preventDefault();
        void executeCommand("paste");
      }
    };
    window.addEventListener("keydown", onKeyDown);
    const onCaptureCtrlK = (event: KeyboardEvent) => {
      if (isMobileExplorer) return;
      if ((event.ctrlKey || event.metaKey) && !event.shiftKey && !event.altKey && event.key.toLowerCase() === "k") {
        const target = event.target as HTMLElement | null;
        if (target?.closest("input, textarea, select, [contenteditable='true']")) return;
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        setIsCommandPaletteOpen(true);
      }
    };
    window.addEventListener("keydown", onCaptureCtrlK, { capture: true });
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keydown", onCaptureCtrlK, { capture: true });
    };
  }, [
    isMobileExplorer,
    deleteItem,
    executeCommand,
    handleHistoryBack,
    handleHistoryForward,
    isCommandPaletteOpen,
    quickLookFile,
    inlineRenameItem,
    isCreateShareOpen,
    isFilterSheetOpen,
    isMultiDeleteOpen,
    isNewFolderOpen,
    isSearchOpen,
    isTrashOpen,
    isActiveSharesOpen,
    isShortcutsOpen,
    shareResult,
    moveItems.length,
    renameItem,
    selectedIds.size,
    allSelectedStarred,
    contextMenuState.isOpen,
    clipboardState,
  ]);

  // Sistem Panosundan Ctrl+V Ekran Görüntüsü / Dosya Yükleme
  const onPasteHandlerRef = useRef<(event: ClipboardEvent) => void>(() => {});
  useEffect(() => {
    onPasteHandlerRef.current = (event: ClipboardEvent) => {
      if (isMobileExplorer) return;
      if (clipboardState !== null && clipboardState.items.length > 0) return;
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea, select, [contenteditable='true']")) return;
      const dialogIsOpen =
        isSearchOpen ||
        isCommandPaletteOpen ||
        quickLookFile !== null ||
        inlineRenameItem !== null ||
        isNewFolderOpen ||
        renameItem !== null ||
        moveItems.length > 0 ||
        deleteItem !== null ||
        isMultiDeleteOpen ||
        isCreateShareOpen ||
        isTrashOpen ||
        isFilterSheetOpen ||
        isActiveSharesOpen ||
        isShortcutsOpen ||
        shareResult !== null;
      if (dialogIsOpen) return;

      const pastedFiles = Array.from(event.clipboardData?.files ?? []);
      if (pastedFiles.length === 0) return;
      event.preventDefault();

      const now = new Date();
      const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}-${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}${String(now.getSeconds()).padStart(2, "0")}`;
      const normalized = pastedFiles.map((file, idx) => {
        if (!file.name || file.name === "image.png") {
          const suffix = pastedFiles.length > 1 ? `-${idx + 1}` : "";
          return new File([file], `ekran-goruntusu-${stamp}${suffix}.png`, {
            type: file.type || "image/png",
          });
        }
        return file;
      });
      showToast(`Panodan ${normalized.length} dosya yükleniyor...`, "info");
      void uploadFiles(normalized);
    };
  });

  useEffect(() => {
    const onPaste = (event: ClipboardEvent) => onPasteHandlerRef.current(event);
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, []);

  const paletteCommands: PaletteCommand[] = useMemo(
    () => [
      {
        id: "new-folder",
        label: "Yeni Klasör Oluştur",
        shortcut: "Shift+N",
        keywords: "klasor yeni ekle",
        onExecute: () => setIsNewFolderOpen(true),
      },
      {
        id: "upload",
        label: "Dosya Yükle",
        shortcut: "Ctrl+U",
        keywords: "yukle upload dosya",
        onExecute: () => fileInputRef.current?.click(),
      },
      {
        id: "toggle-view",
        label: viewMode === "list" ? "Kart (Grid) Görünümüne Geç" : "Liste Görünümüne Geç",
        shortcut: "V",
        keywords: "gorunum liste grid kart",
        onExecute: () => setViewMode((v) => (v === "list" ? "grid" : "list")),
      },
      {
        id: "toggle-density",
        label: density === "comfortable" ? "Yoğunluğu Sıkışık Yap" : "Yoğunluğu Rahat Yap",
        keywords: "yogunluk compact comfortable satir",
        onExecute: () => setDensity((d) => (d === "comfortable" ? "compact" : "comfortable")),
      },
      {
        id: "group-type",
        label: "Türe Göre Grupla",
        keywords: "grupla tur",
        onExecute: () => setGroupBy("type"),
      },
      {
        id: "group-date",
        label: "Tarihe Göre Grupla",
        keywords: "grupla tarih",
        onExecute: () => setGroupBy("date"),
      },
      {
        id: "group-none",
        label: "Gruplamayı Kaldır",
        keywords: "gruplama kaldir temizle",
        onExecute: () => setGroupBy("none"),
      },
      {
        id: "open-trash",
        label: "Çöp Kutusunu Aç",
        keywords: "cop kutusu silinenler",
        onExecute: () => setIsTrashOpen(true),
      },
      {
        id: "open-shares",
        label: "Aktif Paylaşımlar",
        keywords: "paylasim linkler",
        onExecute: () => setIsActiveSharesOpen(true),
      },
      {
        id: "toggle-details",
        label: isDetailsOpen ? "Detay Çekmecesini Kapat" : "Detay Çekmecesini Aç",
        shortcut: "I",
        keywords: "detay bilgi panel",
        onExecute: () => setIsDetailsOpen((d) => !d),
      },
      {
        id: "select-all",
        label: "Tümünü Seç",
        shortcut: "Ctrl+A",
        keywords: "sec hepsi tumu",
        onExecute: () => selectAll(),
      },
      {
        id: "shortcuts",
        label: "Klavye Kısayolları",
        shortcut: "?",
        keywords: "kisayol yardim",
        onExecute: () => setIsShortcutsOpen(true),
      },
    ],
    [density, isDetailsOpen, selectAll, viewMode]
  );

  // ============================================================================
  // VIRTUALIZED & SHARED ROW / CARD RENDERERS
  // ============================================================================
  const toCommandTargetItem = (item: DokFile | DokFolder): CommandTargetItem => {
    if ("parent_id" in item) {
      return {
        id: item.id,
        type: "folder",
        name: item.name,
        starred: Boolean(item.starred_at),
        pending: Boolean(item.pending),
        parentId: item.parent_id,
      };
    }
    return {
      id: item.id,
      type: "file",
      name: item.display_name,
      extension: item.extension || item.display_name.split(".").pop() || "",
      size: Number(item.size_bytes),
      starred: Boolean(item.starred_at),
      pending: false,
      parentId: item.folder_id,
    };
  };

  const activateItem = (item: DokFile | DokFolder, source: ItemActivationSource, event: React.MouseEvent) => {
    event.stopPropagation();
    if (source === "double" && event.target instanceof Element &&
        event.target.closest("button, a, [role='menuitem']")) return;
    const pointerType = (event.nativeEvent as PointerEvent).pointerType || lastPointerTypeRef.current;
    const action = resolveExplorerActivation({
      source, mobile: isMobileExplorer, selectionMode: isMobileSelectionMode,
      pointerType,
    });
    if (action !== "link") event.preventDefault();
    if (action === "toggle") toggleSelectedId(item.id);
    if (action === "desktop-select") handleItemClick(item.id, event);
    if (action === "desktop-context") {
      handleItemContextMenu(item.id, event);
      setContextMenuState({
        isOpen: true,
        x: event.clientX,
        y: event.clientY,
        targetItem: toCommandTargetItem(item),
      });
    }
    if (action === "open" || action === "link") {
      if ("parent_id" in item) navigateToFolder(item.id);
      else {
        triggerCadIntentPreload(item.extension);
        triggerPdfIntentPreload(item.extension);
        if (action === "open") router.push(`/dokumantasyon/dosya/${item.id}`);
      }
    }
  };

  const renderFolderItem = (
    folder: DokFolder,
    mode: "list" | "grid",
    style?: React.CSSProperties
  ) => (
    <ExplorerFolderItem
      key={folder.id}
      folder={folder}
      viewMode={mode}
      density={density}
      style={style}
      isSelected={selectedIds.has(folder.id)}
      isFocused={focusedId === folder.id}
      isCut={cutItemIds.has(folder.id)}
      isDragOver={dragOverFolderId === folder.id}
      isStarPop={starPopId === folder.id}
      isMobileExplorer={isMobileExplorer}
      isMobileSelectionMode={isMobileSelectionMode}
      isRenaming={
        mode === "list" &&
        inlineRenameItem?.type === "folder" &&
        inlineRenameItem.id === folder.id
      }
      setNodeRef={setFolderNodeRef}
      onActivate={activateItem}
      onToggleStar={(t, id, starred, e) => void toggleStar(t, id, starred, e)}
      onNavigateFolder={(id) => navigateToFolder(id)}
      onOpenShare={(f) =>
        handleOpenShareSingle({ id: f.id, name: f.name, type: "folder" })
      }
      onOpenRename={(f) => {
        if (!isMobileExplorer && mode === "list") {
          setInlineRenameItem({ id: f.id, type: "folder" });
        } else {
          setRenameItem({ id: f.id, name: f.name, type: "folder" });
        }
      }}
      onCommitInlineRename={(f, nextName) =>
        void handleCommitInlineRename(
          { id: f.id, type: "folder", oldName: f.name },
          nextName
        )
      }
      onCancelInlineRename={() => setInlineRenameItem(null)}
      onOpenMove={(f) =>
        setMoveItems([
          { id: f.id, name: f.name, type: "folder", parentId: f.parent_id },
        ])
      }
      onOpenDelete={(f) =>
        setDeleteItem({ id: f.id, name: f.name, type: "folder" })
      }
    />
  );

  const renderFileItem = (
    file: DokFile,
    mode: "list" | "grid",
    style?: React.CSSProperties
  ) => (
    <ExplorerFileItem
      key={file.id}
      file={file}
      viewMode={mode}
      density={density}
      style={style}
      isSelected={selectedIds.has(file.id)}
      isFocused={focusedId === file.id}
      isCut={cutItemIds.has(file.id)}
      isStarPop={starPopId === file.id}
      isMobileExplorer={isMobileExplorer}
      isMobileSelectionMode={isMobileSelectionMode}
      isRenaming={
        mode === "list" &&
        inlineRenameItem?.type === "file" &&
        inlineRenameItem.id === file.id
      }
      setNodeRef={setFileNodeRef}
      onActivate={activateItem}
      onPointerPreload={(ext) => {
        triggerCadIntentPreload(ext);
        triggerPdfIntentPreload(ext);
      }}
      onToggleStar={(t, id, starred, e) => void toggleStar(t, id, starred, e)}
      onOpenStudio={(fileId, cadEngine) => {
        router.push(
          cadEngine === "v2"
            ? `/dokumantasyon/dosya/${fileId}?cadEngine=v2`
            : `/dokumantasyon/dosya/${fileId}`
        );
      }}
      onQuickLook={(f) => setQuickLookFile(f)}
      onDownload={(f) => void handleDownload(f)}
      onOpenShare={(f) =>
        handleOpenShareSingle({
          id: f.id,
          name: f.display_name,
          type: "file",
          size: Number(f.size_bytes),
        })
      }
      onOpenRename={(f) => {
        if (!isMobileExplorer && mode === "list") {
          setInlineRenameItem({ id: f.id, type: "file" });
        } else {
          setRenameItem({ id: f.id, name: f.display_name, type: "file" });
        }
      }}
      onCommitInlineRename={(f, nextName) =>
        void handleCommitInlineRename(
          { id: f.id, type: "file", oldName: f.display_name },
          nextName
        )
      }
      onCancelInlineRename={() => setInlineRenameItem(null)}
      onOpenMove={(f) =>
        setMoveItems([
          {
            id: f.id,
            name: f.display_name,
            type: "file",
            parentId: f.folder_id,
          },
        ])
      }
      onOpenDelete={(f) =>
        setDeleteItem({ id: f.id, name: f.display_name, type: "file" })
      }
    />
  );

  const renderFolderRow = (folder: DokFolder, style?: React.CSSProperties) =>
    renderFolderItem(folder, "list", style);
  const renderFileRow = (file: DokFile, style?: React.CSSProperties) =>
    renderFileItem(file, "list", style);
  const renderFolderCard = (folder: DokFolder, style?: React.CSSProperties) =>
    renderFolderItem(folder, "grid", style);
  const renderFileCard = (file: DokFile, style?: React.CSSProperties) =>
    renderFileItem(file, "grid", style);

  return (
    <MotionConfig reducedMotion="user">
    <div
      data-mobile-selection-mode={isMobileSelectionMode}
      onPointerDownCapture={(e) => { lastPointerTypeRef.current = e.pointerType; }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative flex min-h-0 lg:h-full w-full overflow-hidden rounded-2xl border border-border/80 ${styles.workspace}`}
    >
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {isMobileSelectionMode ? `Seçim modu açık. ${selectedIds.size} öğe seçildi.` : ""}
      </div>
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
      <div className="hidden lg:block lg:h-full lg:min-h-0">
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
          totalFilesCount={summaryTotalFiles}
          totalFoldersCount={summaryTotalFolders}
          totalSizeBytes={summaryTotalSizeBytes}
          starredCount={summaryStarredCount}
          categoryCounts={summaryCategoryCounts}
          trashCount={summaryTrashCount}
          activeSharesCount={summaryActiveSharesCount}
          currentFolderId={currentFolderId}
          onSelectFolder={(folderId) => navigateToFolder(folderId)}
          onDropToFolder={(items, targetId) => void handleDropOnFolder(items, targetId)}
          onDropToStarred={(items) => void handleSidebarDropToStarred(items)}
          onDropToTrash={(items) => void handleSidebarDropToTrash(items)}
          treeRefreshKey={sidebarTreeRefreshKey}
          className={`${styles.sidebar} lg:h-full`}
        />
      </div>

      {!isPhone && isSidebarOpenMobile && (
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
              totalFilesCount={summaryTotalFiles}
              totalFoldersCount={summaryTotalFolders}
              totalSizeBytes={summaryTotalSizeBytes}
              starredCount={summaryStarredCount}
              categoryCounts={summaryCategoryCounts}
              trashCount={summaryTrashCount}
              activeSharesCount={summaryActiveSharesCount}
              currentFolderId={currentFolderId}
              onSelectFolder={(folderId) => {
                navigateToFolder(folderId);
                setIsSidebarOpenMobile(false);
              }}
              onDropToFolder={(items, targetId) => void handleDropOnFolder(items, targetId)}
              onDropToStarred={(items) => void handleSidebarDropToStarred(items)}
              onDropToTrash={(items) => void handleSidebarDropToTrash(items)}
              treeRefreshKey={sidebarTreeRefreshKey}
              className="h-full w-full border-r border-border bg-card"
              onNavigate={() => setIsSidebarOpenMobile(false)}
            />
          </div>
        </div>
      )}

      {/* 2. Ana Çalışma Alanı (Center Content) — BUG-3 FIX: overflow-hidden → min-h-0 */}
      <div className="flex min-w-0 min-h-0 flex-1 flex-col">
        {isPhone ? <>
          <MobileWorkspaceBar title={currentFolder?.name || "Dosyalar"} hasParent={!!currentFolderId} selection={isMobileSelectionMode} count={selectedIds.size} allSelected={isAllSelected}
            onBack={() => navigateToFolder(breadcrumbs[breadcrumbs.length - 2]?.id ?? null)} onDrawer={() => setMobileSurface("drawer")} onSearch={() => setIsSearchOpen(true)} onSurface={setMobileSurface}
            onSelectAll={handleToggleSelectAll} onExit={exitMobileSelectionMode} moreRef={phoneMoreRef}/>
          {activeFilterLabels.length > 0 && !isMobileSelectionMode && <div className={mobileStyles.summary}><button className={mobileStyles.icon} onClick={() => setMobileSurface("settings")}>{activeFilterLabels.length} filtre etkin</button><button className={mobileStyles.icon} onClick={() => { setActiveFilter("all"); setWorkspaceFilters(DEFAULT_WORKSPACE_FILTERS); }}>Temizle</button></div>}
        </> : <>
        {/* Üst Gezinti ve Kontrol Çubuğu (UX V5 ExplorerToolbar) */}
        <div className={`flex min-w-0 items-center gap-2 border-b px-2.5 py-2 sm:px-3.5 sm:py-2.5 ${styles.commandBar}`}>
          <Button
            size="sm"
            variant="ghost"
            ref={mobileMenuButtonRef}
            onClick={() => setIsSidebarOpenMobile((m) => !m)}
            className="h-9 w-9 shrink-0 p-0 rounded-xl hover:bg-secondary lg:hidden"
            aria-expanded={isSidebarOpenMobile}
            aria-controls="dok-mobile-sidebar"
            aria-label="Dokümantasyon menüsünü aç"
          >
            <Menu className="h-4 w-4" />
          </Button>

          {(allItemIds.length > 0 || isMobileSelectionMode) && (
            <Button
              ref={selectionModeButtonRef}
              data-testid="dok-selection-mode"
              size="sm"
              variant="outline"
              className="lg:hidden min-h-11 rounded-xl shrink-0"
              aria-pressed={isMobileSelectionMode}
              aria-label={isMobileSelectionMode ? "Seçim modundan çık" : "Seçim moduna gir"}
              onClick={() => (isMobileSelectionMode ? exitMobileSelectionMode() : setIsMobileSelectionMode(true))}
            >
              {isMobileSelectionMode ? "✕" : <CheckSquare className="h-4 w-4" />}
              <span>{isMobileSelectionMode ? "Çık" : "Seç"}</span>
            </Button>
          )}
          {isMobileExplorer && isMobileSelectionMode && (
            <span className="text-xs font-semibold shrink-0" data-testid="dok-selection-count">
              {selectedIds.size} öğe seçildi
            </span>
          )}

          <div className={`${isMobileExplorer && isMobileSelectionMode ? "hidden" : "flex"} min-w-0 flex-1`}>
            <ExplorerToolbar
              breadcrumbs={breadcrumbs}
              onNavigateFolder={(id) => {
                if (id === null && (activeFilter === "recent" || activeFilter === "starred")) {
                  handleNavigationFilter("all");
                }
                navigateToFolder(id);
              }}
              setBreadcrumbDropRef={setBreadcrumbDropRef}
              dragOverBreadcrumbId={dragOverBreadcrumbId}
              canGoBack={navHistory.past.length > 0}
              canGoForward={navHistory.future.length > 0}
              onBack={handleHistoryBack}
              onForward={handleHistoryForward}
              quickQuery={quickQuery}
              onQuickQueryChange={setQuickQuery}
              onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
              sortBy={sortBy}
              sortOrder={sortOrder}
              onSortChange={handleSort}
              groupBy={groupBy}
              onGroupChange={setGroupBy}
              activeFilterCount={activeFilterLabels.length}
              onOpenFilterSheet={() => setIsFilterSheetOpen(true)}
              supportsFolderUpload={supportsFolderUpload}
              onUploadFiles={() => fileInputRef.current?.click()}
              onUploadFolder={openFolderPicker}
              onCreateFolder={() => setIsNewFolderOpen(true)}
              density={density}
              onDensityChange={setDensity}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              isRefreshing={isQueryFetching}
              onRefresh={() => void executeCommand("refresh")}
              isDetailsOpen={isDetailsOpen}
              onToggleDetails={() => setIsDetailsOpen((d) => !d)}
            />
          </div>
        </div>

        <FilterChipsBar
          typeFilter={navigationType}
          dateFilter={workspaceFilters.date}
          sizeFilter={workspaceFilters.size}
          scope={workspaceFilters.scope}
          starredOnly={workspaceFilters.starredOnly}
          collection={activeCollection}
          searchQuery={quickQuery}
          resultCount={allExplorerItems.length}
          onRemoveFilter={handleRemoveFilterChip}
          onClearAll={handleClearAllFilters}
        />

        </>}
        <div className="px-3 pt-2 sm:px-4 empty:hidden">
          <ClipboardBar
            clipboardState={clipboardState}
            canPaste={Boolean(clipboardState && clipboardState.items.length > 0 && !isTrashOpen)}
            isPasting={isPasting}
            onPaste={() => void executeCommand("paste")}
            onClear={() => setClipboardState(null)}
          />
        </div>
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

        <TopFetchingBar visible={isQueryFetching && !loading} />

        {/* Ana İçerik Alanı: Liste veya Grid */}
        <div
          ref={scrollContainerRef}
          tabIndex={0}
          data-testid="dok-explorer-viewport"
          onContextMenu={(e) => {
            if (isMobileExplorer) return;
            const pt = (e.nativeEvent as PointerEvent).pointerType || lastPointerTypeRef.current;
            if (pt === "touch" || pt === "pen") return;
            e.preventDefault();
            setContextMenuState({
              isOpen: true,
              x: e.clientX,
              y: e.clientY,
              targetItem: null,
            });
          }}
          onKeyDown={(e) => {
            if (!isMobileExplorer) { handleKeyDown(e); return; }
            if (e.key === "Escape" && isMobileSelectionMode) { e.preventDefault(); exitMobileSelectionMode(); }
            if (isMobileSelectionMode && (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "a") { e.preventDefault(); selectAll(); }
          }}
          onScroll={handleVirtualScroll}
          {...(isMobileExplorer ? {} : containerPointerHandlers)}
          className={`relative flex-1 overflow-auto p-3 sm:p-4 pb-4 outline-none select-none min-h-[300px] ${styles.viewport}`}
        >
          {/* Sanal Marquee Seçim Kutusu (Warm Amber Glass + Canlı Sayaç) */}
          {marqueeBox && (
            <div
              data-testid="dok-marquee-box"
              className="pointer-events-none absolute z-50 rounded-md border border-amber-500/85 bg-amber-500/15 shadow-[0_0_16px_rgba(245,158,11,0.18)] transition-none"
              style={{
                left: marqueeBox.left,
                top: marqueeBox.top,
                width: marqueeBox.width,
                height: marqueeBox.height,
              }}
            >
              {marqueeBox.width >= 24 && marqueeBox.height >= 24 && selectedIds.size > 0 && (
                <span className="absolute -bottom-6 right-0 rounded-full bg-amber-500 px-1.5 py-0.5 font-mono text-[10px] font-bold text-zinc-950 shadow-sm">
                  {selectedIds.size} öğe
                </span>
              )}
            </div>
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
            <ExplorerSkeleton viewMode={viewMode} />
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
                  : activeFilterLabels.length > 0 || quickQuery.trim().length > 0
                  ? "Filtreleme Kriterine Uygun Dosya Yok"
                  : "Bu Klasör Henüz Boş"}
              </h3>
              <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                {activeFilter === "starred"
                  ? "Sık kullandığınız dosya ve klasörleri hızlı erişim için yıldızlayabilirsiniz."
                  : activeFilter === "recent"
                  ? "Document Studio'da görüntülediğiniz dosyalar burada otomatik olarak listelenir."
                  : activeFilterLabels.length > 0 || quickQuery.trim().length > 0
                  ? "Arama veya filtre kriterlerinizi değiştirerek tekrar deneyebilirsiniz."
                  : "Bu klasöre yeni dosya yükleyebilir veya alt klasör oluşturabilirsiniz."}
              </p>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                {activeFilterLabels.length > 0 || quickQuery.trim().length > 0 ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleClearAllFilters}
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
          ) : isPhone ? (
            <MobileExplorer items={allExplorerItems} buckets={groupedBuckets} grouped={groupBy !== "none"} view={viewMode} selectedIds={selectedIds} cutItemIds={cutItemIds} selection={isMobileSelectionMode} scrollRef={scrollContainerRef} onActivate={activateItem} onMore={setMobileItem} persistenceKey={`${currentFolderId || "root"}:${activeFilter}`} />
          ) : viewMode === "list" ? (
            /* ========================================================= */
            /* LİSTE GÖRÜNÜMÜ (TABLE VIEW - VIRTUAL & GROUPED)           */
            /* ========================================================= */
            groupBy === "none" ? (
              <div className={`overflow-hidden rounded-2xl border ${styles.list}`}>
                <div className="hidden grid-cols-12 items-center border-b border-border/70 bg-white/40 dark:bg-card/40 px-4 py-2 text-xs font-bold uppercase tracking-wider text-muted-foreground sm:grid backdrop-blur-md">
                  <div className="col-span-8 flex items-center gap-2.5 sm:col-span-6 md:col-span-5">
                    <DriveCheckbox
                      checked={isAllSelected}
                      indeterminate={selectedIds.size > 0 && !isAllSelected}
                      onClick={handleToggleSelectAll}
                      ariaLabel={isAllSelected ? "Tüm seçimleri kaldır" : "Tümünü seç"}
                      dataTestId="dok-select-all"
                    />
                    <button
                      onClick={() => handleSort("name")}
                      className={`flex items-center gap-1 transition-colors hover:text-foreground ${sortBy === "name" ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground"}`}
                    >
                      <span>İsim</span>
                      {sortBy === "name" ? (
                        sortOrder === "asc" ? <ArrowUp className="h-3 w-3 transition-transform duration-200" /> : <ArrowDown className="h-3 w-3 transition-transform duration-200" />
                      ) : (
                        <ArrowUpDown className="h-3 w-3 opacity-60" />
                      )}
                    </button>
                  </div>

                  <div className="hidden sm:col-span-2 sm:flex sm:justify-end">
                    <button
                      onClick={() => handleSort("size")}
                      className={`flex items-center gap-1 transition-colors hover:text-foreground ${sortBy === "size" ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground"}`}
                    >
                      <span>Boyut</span>
                      {sortBy === "size" ? (
                        sortOrder === "asc" ? <ArrowUp className="h-3 w-3 transition-transform duration-200" /> : <ArrowDown className="h-3 w-3 transition-transform duration-200" />
                      ) : (
                        <ArrowUpDown className="h-3 w-3 opacity-60" />
                      )}
                    </button>
                  </div>

                  <div className="col-span-2 hidden md:flex md:justify-end">
                    <button
                      onClick={() => handleSort("date")}
                      className={`flex items-center gap-1 transition-colors hover:text-foreground ${sortBy === "date" ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground"}`}
                    >
                      <span>Değiştirilme</span>
                      {sortBy === "date" ? (
                        sortOrder === "asc" ? <ArrowUp className="h-3 w-3 transition-transform duration-200" /> : <ArrowDown className="h-3 w-3 transition-transform duration-200" />
                      ) : (
                        <ArrowUpDown className="h-3 w-3 opacity-60" />
                      )}
                    </button>
                  </div>

                  <div className="col-span-4 text-right sm:col-span-2 md:col-span-3">
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
                    return <div key={virtualRow.key} style={rowStyle}>
                      {"parent_id" in item ? renderFolderRow(item as DokFolder) : renderFileRow(item as DokFile)}
                    </div>;
                  })}
                </div>
              </div>
            ) : (
              <div className={`overflow-hidden rounded-2xl border ${styles.list}`}>
                {/* Tek Sticky Üst Sütun Başlığı */}
                <div className="sticky top-0 z-20 hidden grid-cols-12 items-center border-b border-border/70 bg-card/90 px-4 py-2 text-xs font-bold uppercase tracking-wider text-muted-foreground sm:grid backdrop-blur-md">
                  <div className="col-span-8 flex items-center gap-2.5 sm:col-span-6 md:col-span-5">
                    <DriveCheckbox
                      checked={isAllSelected}
                      indeterminate={selectedIds.size > 0 && !isAllSelected}
                      onClick={handleToggleSelectAll}
                      ariaLabel={isAllSelected ? "Tüm seçimleri kaldır" : "Tümünü seç"}
                      dataTestId="dok-select-all"
                    />
                    <button
                      onClick={() => handleSort("name")}
                      className={`flex items-center gap-1 transition-colors hover:text-foreground ${sortBy === "name" ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground"}`}
                    >
                      <span>İsim</span>
                      {sortBy === "name" ? (
                        sortOrder === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                      ) : (
                        <ArrowUpDown className="h-3 w-3 opacity-60" />
                      )}
                    </button>
                  </div>
                  <div className="hidden sm:col-span-2 sm:flex sm:justify-end">
                    <button
                      onClick={() => handleSort("size")}
                      className={`flex items-center gap-1 transition-colors hover:text-foreground ${sortBy === "size" ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground"}`}
                    >
                      <span>Boyut</span>
                      {sortBy === "size" ? (
                        sortOrder === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                      ) : (
                        <ArrowUpDown className="h-3 w-3 opacity-60" />
                      )}
                    </button>
                  </div>
                  <div className="col-span-2 hidden md:flex md:justify-end">
                    <button
                      onClick={() => handleSort("date")}
                      className={`flex items-center gap-1 transition-colors hover:text-foreground ${sortBy === "date" ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground"}`}
                    >
                      <span>Değiştirilme</span>
                      {sortBy === "date" ? (
                        sortOrder === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                      ) : (
                        <ArrowUpDown className="h-3 w-3 opacity-60" />
                      )}
                    </button>
                  </div>
                  <div className="col-span-4 text-right sm:col-span-2 md:col-span-3">
                    <span>İşlem</span>
                  </div>
                </div>

                {groupedBuckets.map((bucket) => {
                  const bucketItemCount = bucket.folders.length + bucket.files.length;
                  if (bucketItemCount === 0) return null;
                  const isCollapsed = collapsedGroups.has(bucket.key);
                  const bucketIds = [...bucket.folders.map((f) => f.id), ...bucket.files.map((f) => f.id)];
                  const allGroupSelected = bucketIds.length > 0 && bucketIds.every((id) => selectedIds.has(id));
                  const groupSizeBytes = bucket.files.reduce((acc, f) => acc + Number(f.size_bytes), 0);

                  return (
                    <div key={bucket.key} className="border-b border-border/50 last:border-b-0">
                      <div
                        data-testid="dok-group-header"
                        data-group-key={bucket.key}
                        className="flex items-center justify-between gap-2 bg-secondary/40 px-3 py-2 text-xs font-bold text-foreground sm:px-4"
                      >
                        <button
                          type="button"
                          aria-expanded={!isCollapsed}
                          onClick={() => {
                            setCollapsedGroups((prev) => {
                              const next = new Set(prev);
                              if (next.has(bucket.key)) next.delete(bucket.key);
                              else next.add(bucket.key);
                              return next;
                            });
                          }}
                          className="inline-flex items-center gap-2 rounded-lg px-1.5 py-1 text-left hover:bg-secondary/70 transition-colors"
                        >
                          <ChevronDown className={`h-3.5 w-3.5 text-amber-500 transition-transform duration-200 ${isCollapsed ? "-rotate-90" : ""}`} />
                          <span className="text-amber-700 dark:text-amber-400">{bucket.label}</span>
                          <span className="rounded-full bg-amber-500/15 px-1.5 py-0.5 font-mono text-[10px] text-amber-700 dark:text-amber-300">
                            {bucketItemCount}
                          </span>
                          {groupSizeBytes > 0 && (
                            <span className="hidden font-mono text-[11px] font-normal text-muted-foreground sm:inline">
                              · {formatBytes(groupSizeBytes)}
                            </span>
                          )}
                        </button>

                        <button
                          type="button"
                          data-no-marquee
                          onClick={() => {
                            setSelectedIds((prev) => {
                              const next = new Set(prev);
                              if (allGroupSelected) {
                                bucketIds.forEach((id) => next.delete(id));
                              } else {
                                bucketIds.forEach((id) => next.add(id));
                              }
                              return next;
                            });
                          }}
                          className="rounded-lg border border-border/70 bg-background/70 px-2.5 py-1 text-[11px] font-semibold text-muted-foreground transition-colors hover:border-amber-500/40 hover:text-foreground"
                        >
                          {allGroupSelected ? "Seçimi Kaldır" : "Grubu Seç"}
                        </button>
                      </div>

                      {!isCollapsed && (
                        <div className="divide-y divide-border/40">
                          {bucket.folders.map((folder) => renderFolderRow(folder))}
                          {bucket.files.map((file) => renderFileRow(file))}
                        </div>
                      )}
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
                        alignItems: "start",
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
                  const isCollapsed = collapsedGroups.has(bucket.key);
                  const bucketIds = [...bucket.folders.map((f) => f.id), ...bucket.files.map((f) => f.id)];
                  const allGroupSelected = bucketIds.length > 0 && bucketIds.every((id) => selectedIds.has(id));
                  const groupSizeBytes = bucket.files.reduce((acc, f) => acc + Number(f.size_bytes), 0);

                  return (
                    <div key={bucket.key} className="space-y-3">
                      <div
                        data-testid="dok-group-header"
                        data-group-key={bucket.key}
                        className="sticky top-0 z-10 flex items-center justify-between gap-2 rounded-xl border border-border/60 bg-card/85 px-3 py-2 text-xs font-bold text-foreground backdrop-blur-md"
                      >
                        <button
                          type="button"
                          aria-expanded={!isCollapsed}
                          onClick={() => {
                            setCollapsedGroups((prev) => {
                              const next = new Set(prev);
                              if (next.has(bucket.key)) next.delete(bucket.key);
                              else next.add(bucket.key);
                              return next;
                            });
                          }}
                          className="inline-flex items-center gap-2 rounded-lg px-1 py-0.5 text-left hover:bg-secondary/60 transition-colors"
                        >
                          <ChevronDown className={`h-3.5 w-3.5 text-amber-500 transition-transform duration-200 ${isCollapsed ? "-rotate-90" : ""}`} />
                          <span className="text-amber-700 dark:text-amber-400">{bucket.label}</span>
                          <span className="rounded-full bg-amber-500/15 px-1.5 py-0.5 font-mono text-[10px] text-amber-700 dark:text-amber-300">
                            {bucketItemCount}
                          </span>
                          {groupSizeBytes > 0 && (
                            <span className="hidden font-mono text-[11px] font-normal text-muted-foreground sm:inline">
                              · {formatBytes(groupSizeBytes)}
                            </span>
                          )}
                        </button>

                        <button
                          type="button"
                          data-no-marquee
                          onClick={() => {
                            setSelectedIds((prev) => {
                              const next = new Set(prev);
                              if (allGroupSelected) {
                                bucketIds.forEach((id) => next.delete(id));
                              } else {
                                bucketIds.forEach((id) => next.add(id));
                              }
                              return next;
                            });
                          }}
                          className="rounded-lg border border-border/70 bg-background/70 px-2.5 py-1 text-[11px] font-semibold text-muted-foreground transition-colors hover:border-amber-500/40 hover:text-foreground"
                        >
                          {allGroupSelected ? "Seçimi Kaldır" : "Grubu Seç"}
                        </button>
                      </div>

                      {!isCollapsed && (
                        <div
                          className="grid gap-3"
                          style={{
                            gridTemplateColumns: `repeat(auto-fill, minmax(170px, 1fr))`,
                          }}
                        >
                          {bucket.folders.map((folder) => renderFolderCard(folder))}
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
        {/* A6 — Seçim Aksiyon Dock'u (Normal Layout — Overlay Değil) */}
        {isPhone && (
          <UploadProgressToast
            compact
            expanded={mobileUploadOpen}
            onExpandedChange={setMobileUploadOpen}
            queue={uploadQueue}
            onDismiss={() => uploadManager.clearFinished()}
            onRetry={handleRetryUpload}
            onCancel={(id) => {
              uploadManager.cancel(id);
              showToast("Yükleme iptal edildi", "info");
            }}
            onRetryFailed={() => uploadManager.retryFailed()}
          />
        )}
        {selectedIds.size > 0 && (!isMobileExplorer || isMobileSelectionMode) && (
          <SelectionDock
            selectedCount={selectedIds.size}
            selectedSizeBytes={selectedSizeBytes}
            selectedHasFile={selectedHasFile}
            allSelectedStarred={allSelectedStarred}
            onClearSelection={() => {
              if (isMobileExplorer) {
                exitMobileSelectionMode();
              } else {
                clearSelection();
              }
            }}
            onInvertSelection={handleInvertSelection}
            onDownload={() => void executeCommand("download")}
            onToggleStar={() =>
              void executeCommand(allSelectedStarred ? "unstar" : "star")
            }
            onCopy={() => void executeCommand("copy")}
            onCut={() => void executeCommand("cut")}
            onMove={() => void executeCommand("move")}
            onShare={() => void executeCommand("share")}
            onTrash={() => void executeCommand("trash")}
          />
        )}

        {!isPhone && (
          <WorkspaceStatusBar
            foldersCount={displayedFolders.length}
            filesCount={displayedFiles.length}
            totalSizeBytes={drawerFolderSummary.totalSizeBytes}
            visibleCount={allExplorerItems.length}
            totalCount={folders.length + files.length}
            hasActiveFilters={activeFilterLabels.length > 0 || quickQuery.trim().length > 0}
            selectedCount={selectedIds.size}
            selectedSizeBytes={selectedSizeBytes}
            hideSelectionPill={selectedIds.size > 0}
            sortBy={sortBy}
            sortOrder={sortOrder}
            groupBy={groupBy}
            onOpenShortcuts={() => setIsShortcutsOpen(true)}
          />
        )}

      </div>

      {/* 3. Sağ Detay Çekmecesi (Info Drawer) */}
      {isDetailsOpen && (
        <>
          <DriveDetailsDrawer
            selectedItem={selectedItemForDrawer}
            selectedItems={drawerSelectedEntries}
            currentFolderName={currentFolder?.name || "Kök Dizin"}
            folderSummary={drawerFolderSummary}
            onClose={() => setIsDetailsOpen(false)}
            onShare={(item) => handleOpenShareSingle(item)}
            onRename={(item) => setRenameItem({ ...item, type: item.type })}
            onDelete={(item) => setDeleteItem({ ...item, type: item.type })}
            onDownload={(file) => void handleDownload(file)}
            onBulkShare={() => void executeCommand("share")}
            onBulkMove={() => void executeCommand("move")}
            onBulkDelete={() => void executeCommand("trash")}
            onClearSelection={clearSelection}
            onQuickLook={(f) => setQuickLookFile(f)}
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
        onCreatedFolder={(tempId, serverFolder) => {
          replacePendingFolderInCache(dokQueryClient, currentQueryKey, tempId, serverFolder);
          showToast(`Yeni klasör oluşturuldu: ${serverFolder.name}`, "success");
        }}
        onCancelPending={(tempId) => {
          removePendingFolderFromCache(dokQueryClient, currentQueryKey, tempId);
        }}
      />

      <RenameModal
        isOpen={renameItem !== null}
        item={renameItem}
        onClose={() => setRenameItem(null)}
        onSuccess={() => {
          showToast("Ad güncellendi", "success");
          void fetchItems();
        }}
      />

      <MoveModal
        isOpen={moveItems.length > 0}
        items={moveItems}
        onClose={() => setMoveItems([])}
        onSuccess={() => {
          showToast(`${moveItems.length} öğe taşındı`, "success");
          void fetchItems();
        }}
        onPartialFailure={(failedIds) => {
          setSelectedIds(new Set(failedIds));
          showToast(`${failedIds.length} öğe taşınamadı — seçili bırakıldı`, "error");
        }}
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
          pushUndoTrash(
            [{ id: deleteItem.id, type: deleteItem.type }],
            "1 öğe çöp kutusuna taşındı"
          );
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
        isOpen={isSearchOpen && !isPhone}
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
        matchCount={allExplorerItems.length}
      />

      <ShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />

      {!isPhone && (
        <QuickLookModal
          isOpen={quickLookFile !== null}
          file={quickLookFile}
          files={displayedFiles}
          onClose={() => setQuickLookFile(null)}
          onSelectFile={(f) => setQuickLookFile(f)}
          onDownload={(f) => void handleDownload(f)}
          onShare={(f) =>
            handleOpenShareSingle({
              id: f.id,
              name: f.display_name,
              type: "file",
              size: Number(f.size_bytes),
            })
          }
          onToggleStar={(f) =>
            void toggleStar("file", f.id, Boolean(f.starred_at))
          }
          onOpenStudio={(fileId, cadEngine) => {
            setQuickLookFile(null);
            router.push(
              cadEngine === "v2"
                ? `/dokumantasyon/dosya/${fileId}?cadEngine=v2`
                : `/dokumantasyon/dosya/${fileId}`
            );
          }}
        />
      )}

      {!isPhone && (
        <CommandPalette
          isOpen={isCommandPaletteOpen}
          onClose={() => setIsCommandPaletteOpen(false)}
          commands={paletteCommands}
          recentFiles={displayedFiles.slice(0, 5)}
          onNavigateFolder={(id) => navigateToFolder(id)}
          onOpenFile={(f) => router.push(`/dokumantasyon/dosya/${f.id}`)}
          onQuickLookFile={(f) => setQuickLookFile(f)}
        />
      )}

      {!isPhone && (
        <DriveContextMenu
          isOpen={contextMenuState.isOpen}
          x={contextMenuState.x}
          y={contextMenuState.y}
          context={getCommandContext()}
          targetItem={contextMenuState.targetItem}
          canExecute={(id) => commandRegistryRef.current.canExecute(id, getCommandContext())}
          onExecute={(id) => void executeCommand(id)}
          onInvertSelection={handleInvertSelection}
          onClose={() => setContextMenuState((prev) => ({ ...prev, isOpen: false }))}
          supportsFolderUpload={supportsFolderUpload}
        />
      )}

      {isPhone && <>
        <MobileWorkspacePanel surface={mobileSurface} onSurface={setMobileSurface} onUpload={() => fileInputRef.current?.click()} onFolderUpload={supportsFolderUpload ? openFolderPicker : undefined} onNewFolder={() => setIsNewFolderOpen(true)} onSelect={() => setIsMobileSelectionMode(true)} onRefresh={() => void fetchItems()} moreRef={phoneMoreRef}
          settings={{ view: viewMode, sortBy, sortOrder, groupBy, filters: workspaceFilters }} onApply={v => { setViewMode(v.view); setSortBy(v.sortBy); setSortOrder(v.sortOrder); setGroupBy(v.groupBy); handleWorkspaceFiltersChange(v.filters); }}>
          <DriveSidebar activeFilter={activeFilter} onFilterChange={filter => { handleNavigationFilter(filter); if (filter !== "all" && currentFolderId) navigateToFolder(null); setMobileSurface(null); }} onNewFolder={() => setIsNewFolderOpen(true)} onUploadClick={() => fileInputRef.current?.click()} onOpenActiveShares={() => {setMobileSurface(null);setIsActiveSharesOpen(true);}} onOpenTrash={() => {setMobileSurface(null);setIsTrashOpen(true);}} totalFilesCount={summaryTotalFiles} totalFoldersCount={summaryTotalFolders} totalSizeBytes={summaryTotalSizeBytes} starredCount={summaryStarredCount} categoryCounts={summaryCategoryCounts} trashCount={summaryTrashCount} activeSharesCount={summaryActiveSharesCount} className="!w-full !p-0" compact />
          <MobileSiteLinks breadcrumbs={breadcrumbs} onNavigate={id => { setMobileSurface(null); navigateToFolder(id); }}/>
        </MobileWorkspacePanel>
        <MobileItemPanel item={mobileItem} onClose={() => setMobileItem(null)} onAction={(action,item) => {
          const folder = "parent_id" in item;
          const target = { id:item.id, name:folder ? item.name : item.display_name, type:folder ? "folder" as const : "file" as const, parentId:folder ? item.parent_id : item.folder_id };
          if(action==="open") { if(folder) navigateToFolder(item.id); else router.push(`/dokumantasyon/dosya/${item.id}`); }
          else if(action==="open-v2") { router.push(`/dokumantasyon/dosya/${item.id}?cadEngine=v2`); }
          else if(action==="download" && !folder) void handleDownload(item as DokFile);
          else if(action==="share") handleOpenShareSingle(target);
          else if(action==="rename") setRenameItem(target);
          else if(action==="move") setMoveItems([target]);
          else if(action==="trash") setDeleteItem(target);
          else if(action==="star") void toggleStar(target.type,item.id,Boolean(item.starred_at));
          else if(action==="details") setMobileDetail(item);
        }}/>
        <OverlayPortal isOpen={!!mobileDetail} onClose={() => setMobileDetail(null)} title="Öğe detayları" presentation="sheet"><div className={mobileStyles.panel}><h2>{mobileDetail ? ("parent_id" in mobileDetail ? mobileDetail.name : mobileDetail.display_name) : ""}</h2><p className="break-words">{mobileDetail ? formatDate(mobileDetail.updated_at) : ""}</p>{mobileDetail && !("parent_id" in mobileDetail) && <p>{formatBytes(mobileDetail.size_bytes)}</p>}</div></OverlayPortal>
        {isSearchOpen && <MobileSearch menu={mobileSearchItem} onMenu={setMobileSearchItem} query={mobileQuery} onQuery={setMobileQuery} onClose={() => setIsSearchOpen(false)} onOpen={file => router.push(`/dokumantasyon/dosya/${file.id}`)} onFolder={id => { setIsSearchOpen(false); navigateToFolder(id); }}/>}
      </>}
      {/* Yükleme İlerleme Bildirimi */}
      {!isPhone && (
        <UploadProgressToast
          queue={uploadQueue}
          onDismiss={() => uploadManager.clearFinished()}
          onRetry={(itemId) => void handleRetryUpload(itemId)}
          onCancel={(itemId) => {
            uploadManager.cancel(itemId);
            showToast("Yükleme iptal edildi", "info");
          }}
          onRetryFailed={() => uploadManager.retryFailed()}
        />
      )}
    </div>
    </MotionConfig>
  );
}
