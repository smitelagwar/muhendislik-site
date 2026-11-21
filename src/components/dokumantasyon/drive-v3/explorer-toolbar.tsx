"use client";

import React from "react";
import { MotionConfig, motion } from "framer-motion";
import {
  ArrowDownUp,
  ArrowLeft,
  ArrowRight,
  ChevronRight,
  FolderPlus,
  FolderUp,
  Home,
  Info,
  Layers,
  LayoutGrid,
  List,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Rows3,
  Search,
  SlidersHorizontal,
  Upload,
  X,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type {
  ExplorerGroupBy,
  ExplorerSortBy,
  ExplorerSortOrder,
} from "./explorer-derive";

export interface ToolbarBreadcrumbItem {
  id: string | null;
  name: string;
}

export type ExplorerDensity = "comfortable" | "compact";
export type ExplorerViewMode = "list" | "grid";

export interface ExplorerToolbarProps {
  breadcrumbs: ToolbarBreadcrumbItem[];
  onNavigateFolder: (folderId: string | null) => void;
  setBreadcrumbDropRef?: (node: HTMLElement | null, folderId: string | null) => void;
  dragOverBreadcrumbId?: string | null;

  canGoBack: boolean;
  canGoForward: boolean;
  onBack: () => void;
  onForward: () => void;

  quickQuery: string;
  onQuickQueryChange: (value: string) => void;
  onOpenCommandPalette: () => void;

  sortBy: ExplorerSortBy;
  sortOrder: ExplorerSortOrder;
  onSortChange: (sortBy: ExplorerSortBy) => void;

  groupBy: ExplorerGroupBy;
  onGroupChange: (groupBy: ExplorerGroupBy) => void;

  activeFilterCount: number;
  onOpenFilterSheet: () => void;

  supportsFolderUpload?: boolean;
  onUploadFiles: () => void;
  onUploadFolder?: () => void;
  onCreateFolder: () => void;

  density: ExplorerDensity;
  onDensityChange: (density: ExplorerDensity) => void;

  viewMode: ExplorerViewMode;
  onViewModeChange: (viewMode: ExplorerViewMode) => void;

  isRefreshing?: boolean;
  onRefresh: () => void;

  isDetailsOpen: boolean;
  onToggleDetails: () => void;
}

const SORT_OPTIONS: Array<{ value: ExplorerSortBy; label: string }> = [
  { value: "name", label: "İsme Göre" },
  { value: "date", label: "Tarihe Göre" },
  { value: "size", label: "Boyuta Göre" },
  { value: "type", label: "Türe Göre" },
];

const GROUP_OPTIONS: Array<{ value: ExplorerGroupBy; label: string }> = [
  { value: "none", label: "Gruplama Yok" },
  { value: "type", label: "Türe Göre" },
  { value: "date", label: "Tarihe Göre" },
  { value: "size", label: "Boyuta Göre" },
];

export function ExplorerToolbar({
  breadcrumbs,
  onNavigateFolder,
  setBreadcrumbDropRef,
  dragOverBreadcrumbId,
  canGoBack,
  canGoForward,
  onBack,
  onForward,
  quickQuery,
  onQuickQueryChange,
  onOpenCommandPalette,
  sortBy,
  sortOrder,
  onSortChange,
  groupBy,
  onGroupChange,
  activeFilterCount,
  onOpenFilterSheet,
  supportsFolderUpload = false,
  onUploadFiles,
  onUploadFolder,
  onCreateFolder,
  density,
  onDensityChange,
  viewMode,
  onViewModeChange,
  isRefreshing = false,
  onRefresh,
  isDetailsOpen,
  onToggleDetails,
}: ExplorerToolbarProps) {
  const rootCrumb = breadcrumbs[0] ?? { id: null, name: "Kök Dizin" };
  const hasCollapsedCrumbs = breadcrumbs.length > 3;
  const collapsedCrumbs = hasCollapsedCrumbs
    ? breadcrumbs.slice(1, breadcrumbs.length - 2)
    : [];
  const trailingCrumbs =
    breadcrumbs.length <= 1
      ? []
      : hasCollapsedCrumbs
        ? breadcrumbs.slice(breadcrumbs.length - 2)
        : breadcrumbs.slice(1);

  return (
    <MotionConfig reducedMotion="user">
      <div className="flex w-full min-w-0 items-center justify-between gap-2">
        {/* 1. Sol Bölge — Gezinti & Geçmiş + Breadcrumb */}
        <div className="flex min-w-0 flex-1 items-center gap-1.5">
          <div className="flex shrink-0 items-center gap-0.5 rounded-xl border border-border/70 bg-background/60 p-0.5">
            <button
              type="button"
              onClick={onBack}
              disabled={!canGoBack}
              aria-label="Geri"
              title="Geri (Alt+←)"
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:pointer-events-none disabled:opacity-35"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={onForward}
              disabled={!canGoForward}
              aria-label="İleri"
              title="İleri (Alt+→)"
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:pointer-events-none disabled:opacity-35"
            >
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <nav
            data-breadcrumb
            aria-label="Klasör yolu"
            className="flex min-w-0 flex-1 items-center gap-1 overflow-hidden text-xs"
          >
            <button
              type="button"
              ref={(node) => setBreadcrumbDropRef?.(node, rootCrumb.id)}
              onClick={() => onNavigateFolder(rootCrumb.id)}
              className={`inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg px-2 font-medium transition-colors hover:bg-secondary/80 hover:text-foreground ${
                breadcrumbs.length === 1
                  ? "font-bold text-foreground"
                  : "text-muted-foreground"
              } ${
                dragOverBreadcrumbId === rootCrumb.id && rootCrumb.id !== null
                  ? "bg-amber-500/20 text-amber-600 ring-1 ring-amber-500/50 dark:text-amber-300"
                  : ""
              }`}
            >
              <Home className="h-3.5 w-3.5 text-amber-500" />
              <span className="hidden sm:inline truncate max-w-[120px]">
                {rootCrumb.name}
              </span>
            </button>

            {hasCollapsedCrumbs && (
              <>
                <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      aria-label="Gizlenen üst klasörler"
                      title="Üst klasörlere atla"
                      className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary/80 hover:text-foreground"
                    >
                      <MoreHorizontal className="h-3.5 w-3.5" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="start"
                    className="w-52 rounded-xl border-border bg-card/95 backdrop-blur-md shadow-2xl"
                  >
                    {collapsedCrumbs.map((crumb) => (
                      <DropdownMenuItem
                        key={crumb.id ?? crumb.name}
                        onClick={() => onNavigateFolder(crumb.id)}
                        className="cursor-pointer rounded-lg text-xs"
                      >
                        <span className="truncate">{crumb.name}</span>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}

            {trailingCrumbs.map((crumb, idx) => {
              const isLast = idx === trailingCrumbs.length - 1;
              const isDragOver =
                crumb.id !== null && dragOverBreadcrumbId === crumb.id;

              return (
                <React.Fragment key={crumb.id ?? `${crumb.name}-${idx}`}>
                  <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
                  <button
                    type="button"
                    ref={(node) => setBreadcrumbDropRef?.(node, crumb.id)}
                    onClick={() => onNavigateFolder(crumb.id)}
                    aria-current={isLast ? "page" : undefined}
                    className={`inline-flex h-8 min-w-0 items-center rounded-lg px-2 transition-colors hover:bg-secondary/80 hover:text-foreground ${
                      isLast
                        ? "truncate font-bold text-foreground"
                        : "max-w-[140px] truncate font-medium text-muted-foreground"
                    } ${
                      isDragOver
                        ? "bg-amber-500/20 text-amber-600 ring-1 ring-amber-500/50 dark:text-amber-300"
                        : ""
                    }`}
                  >
                    <span className="truncate">{crumb.name}</span>
                  </button>
                </React.Fragment>
              );
            })}
          </nav>
        </div>

        {/* 2. Orta Bölge — Birleşik Arama & Süzgeç + Ctrl+K Tetikleyicisi */}
        <div className="relative hidden md:flex shrink-0 items-center">
          <Search className="pointer-events-none absolute left-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            value={quickQuery}
            onChange={(e) => onQuickQueryChange(e.target.value)}
            data-testid="dok-inline-filter"
            placeholder="Listede süz..."
            aria-label="Mevcut görünümde hızlı süz"
            className="h-9 w-28 lg:w-32 xl:w-36 2xl:w-48 rounded-xl border border-border/80 bg-background/70 pl-8 pr-16 text-xs text-foreground placeholder:text-muted-foreground focus:border-amber-500/60 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
          />
          {quickQuery && (
            <button
              type="button"
              onClick={() => onQuickQueryChange("")}
              aria-label="Hızlı süzgeci temizle"
              className="absolute right-11 flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground"
            >
              <X className="h-3 w-3" />
            </button>
          )}
          <button
            type="button"
            onClick={onOpenCommandPalette}
            aria-label="Ara... (Komut Paleti)"
            title="Komut Paleti & Global Arama (Ctrl+K)"
            className="absolute right-1.5 inline-flex h-6 items-center gap-0.5 rounded-md border border-border/80 bg-secondary/80 px-1.5 font-mono text-[10px] font-medium text-muted-foreground transition-colors hover:border-amber-500/40 hover:text-foreground"
          >
            ⌘K
          </button>
        </div>

        {/* 3. Sağ Bölge — Görünüm & Eylem */}
        <div className="flex shrink-0 items-center gap-1.5">
          {/* Sırala */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label="Sırala"
                title="Sıralama ölçütü"
                className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-border/80 bg-background/60 px-2.5 text-xs font-medium text-foreground transition-colors hover:bg-secondary"
              >
                <ArrowDownUp className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="hidden 2xl:inline">Sırala</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-48 rounded-xl border-border bg-card/95 backdrop-blur-md shadow-2xl"
            >
              {SORT_OPTIONS.map((opt) => {
                const active = sortBy === opt.value;
                return (
                  <DropdownMenuItem
                    key={opt.value}
                    onClick={() => onSortChange(opt.value)}
                    className={`flex cursor-pointer items-center justify-between rounded-lg text-xs ${
                      active
                        ? "bg-amber-500/15 font-bold text-amber-600 dark:text-amber-400"
                        : ""
                    }`}
                  >
                    <span>{opt.label}</span>
                    {active && (
                      <span className="font-mono text-[10px]">
                        {sortOrder === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Grupla */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label="Grupla"
                title="Gruplama ölçütü"
                className={`inline-flex h-9 items-center gap-1.5 rounded-xl border border-border/80 bg-background/60 px-2.5 text-xs font-medium transition-colors hover:bg-secondary ${
                  groupBy !== "none"
                    ? "border-amber-500/45 bg-amber-500/10 text-amber-700 dark:text-amber-300"
                    : "text-foreground"
                }`}
              >
                <Layers className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="hidden 2xl:inline">Grupla</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-48 rounded-xl border-border bg-card/95 backdrop-blur-md shadow-2xl"
            >
              {GROUP_OPTIONS.map((opt) => {
                const active = groupBy === opt.value;
                return (
                  <DropdownMenuItem
                    key={opt.value}
                    onClick={() => onGroupChange(opt.value)}
                    className={`flex cursor-pointer items-center justify-between rounded-lg text-xs ${
                      active
                        ? "bg-amber-500/15 font-bold text-amber-600 dark:text-amber-400"
                        : ""
                    }`}
                  >
                    <span>{opt.label}</span>
                    {active && <span className="font-bold">✓</span>}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Filtre */}
          <button
            type="button"
            onClick={onOpenFilterSheet}
            aria-label="Dosya filtreleri"
            className={`inline-flex h-9 items-center gap-1.5 rounded-xl border px-2.5 text-xs font-medium transition-colors hover:bg-secondary ${
              activeFilterCount > 0
                ? "border-amber-500/50 bg-amber-500/10 font-semibold text-amber-700 dark:text-amber-300"
                : "border-border/80 bg-background/60 text-foreground"
            }`}
          >
            <SlidersHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="hidden 2xl:inline">Filtre</span>
            {activeFilterCount > 0 && (
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-zinc-950">
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* + Yeni Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label="Yeni"
                className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-xl bg-amber-500 px-3 text-xs font-bold text-zinc-950 shadow-sm transition-colors hover:bg-amber-400"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Yeni</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-48 rounded-xl border-border bg-card/95 backdrop-blur-md shadow-2xl"
            >
              <DropdownMenuItem
                onClick={onUploadFiles}
                className="cursor-pointer gap-2 rounded-lg text-xs"
              >
                <Upload className="h-3.5 w-3.5 text-amber-500" />
                <span>Dosya Yükle</span>
              </DropdownMenuItem>
              {supportsFolderUpload && onUploadFolder && (
                <DropdownMenuItem
                  onClick={onUploadFolder}
                  className="cursor-pointer gap-2 rounded-lg text-xs"
                >
                  <FolderUp className="h-3.5 w-3.5 text-amber-500" />
                  <span>Klasör Yükle</span>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator className="bg-border/60" />
              <DropdownMenuItem
                onClick={() => window.setTimeout(onCreateFolder, 0)}
                className="cursor-pointer gap-2 rounded-lg text-xs"
              >
                <FolderPlus className="h-3.5 w-3.5 text-amber-500" />
                <span>Yeni Klasör</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Yoğunluk */}
          <button
            type="button"
            onClick={() =>
              onDensityChange(density === "comfortable" ? "compact" : "comfortable")
            }
            aria-label={`Satır yoğunluğu: ${density === "comfortable" ? "Rahat" : "Sıkışık"}`}
            title={`Yoğunluk: ${density === "comfortable" ? "Rahat" : "Sıkışık"} (değiştirmek için tıkla)`}
            className={`hidden sm:inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border/80 bg-background/60 transition-colors hover:bg-secondary ${
              density === "compact"
                ? "border-amber-500/45 bg-amber-500/10 text-amber-700 dark:text-amber-300"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Rows3 className="h-3.5 w-3.5" />
          </button>

          {/* Liste / Grid LayoutId Pil */}
          <div
            role="group"
            aria-label="Görünüm modu"
            className="relative flex h-9 items-center rounded-xl border border-border/80 bg-background/60 p-0.5"
          >
            {(
              [
                { mode: "list" as const, icon: List, label: "Liste Görünümü" },
                { mode: "grid" as const, icon: LayoutGrid, label: "Kart (Grid) Görünümü" },
              ] as const
            ).map(({ mode, icon: Icon, label }) => {
              const active = viewMode === mode;
              return (
                <button
                  key={mode}
                  type="button"
                  onClick={() => onViewModeChange(mode)}
                  aria-label={label}
                  aria-pressed={active}
                  className={`relative z-10 inline-flex h-7 w-7 items-center justify-center rounded-lg transition-colors ${
                    active
                      ? "text-zinc-950"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="dok-view-mode-pill"
                      transition={{ type: "spring", stiffness: 450, damping: 32 }}
                      className="absolute inset-0 -z-10 rounded-lg bg-amber-500 shadow-sm"
                    />
                  )}
                  <Icon className="h-3.5 w-3.5" />
                </button>
              );
            })}
          </div>

          {/* Yenile */}
          <button
            type="button"
            data-testid="dok-refresh-btn"
            onClick={onRefresh}
            title="Yenile (R)"
            aria-label="Çalışma alanını yenile"
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border/80 bg-background/60 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${
                isRefreshing ? "animate-spin text-amber-500" : ""
              }`}
            />
          </button>

          {/* Bilgi / Detay Çekmecesi */}
          <button
            type="button"
            onClick={onToggleDetails}
            aria-label="Detay panelini aç/kapat"
            aria-pressed={isDetailsOpen}
            title="Öğe Bilgi ve Detay Çekmecesi"
            className={`inline-flex h-9 w-9 items-center justify-center rounded-xl border transition-colors hover:bg-secondary ${
              isDetailsOpen
                ? "border-amber-500/50 bg-amber-500/15 text-amber-700 dark:text-amber-300"
                : "border-border/80 bg-background/60 text-muted-foreground hover:text-foreground"
            }`}
          >
            <Info className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </MotionConfig>
  );
}
