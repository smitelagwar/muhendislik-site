"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  X,
  Eye,
  Share2,
  Download,
  Edit3,
  Trash2,
  FolderOpen,
  Layers,
  Move,
  Star,
  Clock,
  RefreshCw,
  Upload,
  RotateCcw,
  Link2,
  Link2Off,
  Activity,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { DokActivityEvent, DokFile, DokFolder } from "@/lib/dokumantasyon/types";
import { getFileCategory } from "@/lib/dokumantasyon/file-categories";
import { formatBytes, formatDate } from "./ui-helpers";
import { FileTypeIcon, FolderIcon } from "./file-icons";
import styles from "./dok-workspace.module.css";

export interface DrawerSelectedEntry {
  id: string;
  type: "file" | "folder";
  file?: DokFile;
  folder?: DokFolder;
}

export interface DrawerFolderSummary {
  foldersCount: number;
  filesCount: number;
  totalSizeBytes: number;
  files: DokFile[];
}

interface DriveDetailsDrawerProps {
  selectedItem: {
    type: "file" | "folder";
    file?: DokFile;
    folder?: DokFolder;
  } | null;
  selectedItems?: DrawerSelectedEntry[];
  currentFolderName?: string;
  folderSummary?: DrawerFolderSummary;
  onClose: () => void;
  onShare: (item: { id: string; type: "file" | "folder"; name: string; size?: number }) => void;
  onRename: (item: { id: string; type: "file" | "folder"; name: string }) => void;
  onDelete: (item: { id: string; type: "file" | "folder"; name: string }) => void;
  onDownload?: (file: DokFile) => void;
  onBulkShare?: () => void;
  onBulkMove?: () => void;
  onBulkDelete?: () => void;
  onClearSelection?: () => void;
}

type DrawerTab = "info" | "activity";

function formatRelativeTime(isoDate: string): string {
  const ts = new Date(isoDate).getTime();
  if (!Number.isFinite(ts)) return isoDate;
  const diffSec = Math.max(0, Math.floor((Date.now() - ts) / 1000));
  if (diffSec < 60) return "Az önce";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} dk önce`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour} sa önce`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 7) return `${diffDay} gün önce`;
  return formatDate(isoDate);
}

function getActivityMeta(action: DokActivityEvent["action"]): {
  label: string;
  colorClass: string;
  icon: React.ReactNode;
} {
  switch (action) {
    case "upload":
      return {
        label: "Yüklendi",
        colorClass: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
        icon: <Upload className="h-3.5 w-3.5" />,
      };
    case "rename":
      return {
        label: "Adlandırıldı",
        colorClass: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
        icon: <Edit3 className="h-3.5 w-3.5" />,
      };
    case "move":
      return {
        label: "Taşındı",
        colorClass: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30",
        icon: <Move className="h-3.5 w-3.5" />,
      };
    case "trash":
      return {
        label: "Çöpe gönderildi",
        colorClass: "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30",
        icon: <Trash2 className="h-3.5 w-3.5" />,
      };
    case "restore":
      return {
        label: "Geri yüklendi",
        colorClass: "bg-teal-500/15 text-teal-600 dark:text-teal-400 border-teal-500/30",
        icon: <RotateCcw className="h-3.5 w-3.5" />,
      };
    case "share_create":
      return {
        label: "Paylaşım oluşturuldu",
        colorClass: "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/30",
        icon: <Link2 className="h-3.5 w-3.5" />,
      };
    case "share_revoke":
      return {
        label: "Paylaşım iptal edildi",
        colorClass: "bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/30",
        icon: <Link2Off className="h-3.5 w-3.5" />,
      };
  }
}

export function DriveDetailsDrawer({
  selectedItem,
  selectedItems,
  currentFolderName = "Kök Dizin",
  folderSummary,
  onClose,
  onShare,
  onRename,
  onDelete,
  onDownload,
  onBulkShare,
  onBulkMove,
  onBulkDelete,
  onClearSelection,
}: DriveDetailsDrawerProps) {
  const [activeTab, setActiveTab] = useState<DrawerTab>("info");
  const [events, setEvents] = useState<DokActivityEvent[]>([]);
  const [isLoadingActivity, setIsLoadingActivity] = useState(false);
  const [activityError, setActivityError] = useState<string | null>(null);

  const loadActivity = useCallback(async (signal?: AbortSignal) => {
    await Promise.resolve();
    if (signal?.aborted) return;
    setIsLoadingActivity(true);
    setActivityError(null);
    try {
      const res = await fetch("/api/dokumantasyon/activity", { signal });
      if (!res.ok) {
        throw new Error("Etkinlik kaydı alınamadı.");
      }
      const data = (await res.json()) as { events?: DokActivityEvent[] };
      if (!signal?.aborted) {
        setEvents(Array.isArray(data.events) ? data.events : []);
      }
    } catch (error: unknown) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      if (!signal?.aborted) {
        setActivityError("Etkinlik geçmişi yüklenemedi.");
      }
    } finally {
      if (!signal?.aborted) {
        setIsLoadingActivity(false);
      }
    }
  }, []);

  useEffect(() => {
    if (activeTab !== "activity") return;
    const controller = new AbortController();
    async function run() {
      await loadActivity(controller.signal);
    }
    void run();
    return () => controller.abort();
  }, [activeTab, loadActivity]);

  // Çoklu / Tekil / Sıfır seçim durum çözümlemesi
  const multiItems = selectedItems && selectedItems.length > 1 ? selectedItems : null;
  const singleResolved =
    selectedItem ?? (selectedItems && selectedItems.length === 1 ? selectedItems[0] : null);

  const multiStats = useMemo(() => {
    if (!multiItems) return null;
    let folderCount = 0;
    let fileCount = 0;
    let totalBytes = 0;
    for (const entry of multiItems) {
      if (entry.type === "folder") {
        folderCount += 1;
      } else {
        fileCount += 1;
        totalBytes += Number(entry.file?.size_bytes ?? 0);
      }
    }
    return {
      totalCount: multiItems.length,
      folderCount,
      fileCount,
      totalBytes,
    };
  }, [multiItems]);

  const folderDistribution = useMemo(() => {
    const files = folderSummary?.files ?? [];
    let cad = 0;
    let pdf = 0;
    let image = 0;
    let other = 0;
    for (const f of files) {
      const cat = getFileCategory(f.extension || f.display_name);
      if (cat === "cad") cad += 1;
      else if (cat === "pdf") pdf += 1;
      else if (cat === "image") image += 1;
      else other += 1;
    }
    const total = cad + pdf + image + other;
    return { cad, pdf, image, other, total };
  }, [folderSummary]);

  const renderSingleInfo = () => {
    if (!singleResolved) return null;
    const isFile = singleResolved.type === "file" && !!singleResolved.file;
    const file = singleResolved.file;
    const folder = singleResolved.folder;
    if (isFile && !file) return null;
    if (!isFile && !folder) return null;

    const displayName = isFile ? file!.display_name : folder!.name;
    const sizeBytes = isFile ? Number(file!.size_bytes) : 0;
    const createdAt = isFile ? file!.created_at : folder!.created_at;
    const updatedAt = isFile ? file!.updated_at : folder!.updated_at;
    const lastOpenedAt = isFile ? file!.last_opened_at : null;
    const isStarred = isFile ? Boolean(file!.starred_at) : Boolean(folder!.starred_at);
    const extension = isFile ? file!.extension : "Klasör";

    return (
      <>
        <div className="my-4 flex flex-col items-center justify-center rounded-2xl border border-border/80 bg-secondary/30 p-5 text-center shadow-inner">
          {isFile ? (
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-card border border-border/80 shadow-md">
              <FileTypeIcon extension={file!.extension} mimeType={file!.mime_type} size="detail" />
            </div>
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 shadow-sm">
              <FolderIcon size="detail" />
            </div>
          )}

          <h4 className="mt-3 text-xs font-bold text-foreground break-all line-clamp-2">
            {displayName}
          </h4>
          <div className="mt-1.5 flex flex-wrap items-center justify-center gap-1.5">
            <span className="inline-flex items-center rounded-full bg-secondary/80 border border-border/60 px-2.5 py-0.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider font-mono">
              {extension}
            </span>
            {isStarred && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400">
                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                Yıldızlı
              </span>
            )}
          </div>
        </div>

        {/* Hızlı Eylem Butonları */}
        <div className="grid grid-cols-2 gap-2 border-b border-border/60 pb-4">
          {isFile && (
            <>
              <Button
                asChild
                size="sm"
                className="gap-1.5 bg-amber-500 text-xs font-bold text-zinc-950 hover:bg-amber-400 rounded-xl h-9 shadow-sm"
              >
                <Link href={`/dokumantasyon/dosya/${file!.id}`}>
                  <Eye className="h-3.5 w-3.5" />
                  <span>Önizle</span>
                </Link>
              </Button>

              {onDownload && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onDownload(file!)}
                  className="gap-1.5 text-xs border-border/80 hover:bg-secondary rounded-xl h-9 font-semibold"
                >
                  <Download className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>İndir</span>
                </Button>
              )}
            </>
          )}

          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              onShare({
                id: isFile ? file!.id : folder!.id,
                type: singleResolved.type,
                name: displayName,
                size: sizeBytes,
              })
            }
            className="gap-1.5 text-xs border-border/80 hover:bg-secondary rounded-xl h-9 font-semibold"
          >
            <Share2 className="h-3.5 w-3.5 text-blue-500" />
            <span>Paylaş</span>
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              onRename({
                id: isFile ? file!.id : folder!.id,
                type: singleResolved.type,
                name: displayName,
              })
            }
            className="gap-1.5 text-xs border-border/80 hover:bg-secondary rounded-xl h-9 font-semibold"
          >
            <Edit3 className="h-3.5 w-3.5 text-amber-500" />
            <span>Adlandır</span>
          </Button>
        </div>

        {/* Metadata Listesi */}
        <div className="mt-4 space-y-3 text-xs">
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80">
              Boyut
            </span>
            <p className="font-mono text-foreground font-bold">
              {isFile ? formatBytes(sizeBytes) : "—"}
            </p>
          </div>

          <div className="space-y-0.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80">
              Oluşturulma Tarihi
            </span>
            <p className="text-foreground font-medium">{formatDate(createdAt)}</p>
          </div>

          <div className="space-y-0.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80">
              Son Güncelleme
            </span>
            <p className="text-foreground font-medium">{formatDate(updatedAt || createdAt)}</p>
          </div>

          {lastOpenedAt && (
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80">
                Son Açılma
              </span>
              <p className="text-foreground font-medium">{formatDate(lastOpenedAt)}</p>
            </div>
          )}
        </div>

        {/* Silme Butonu */}
        <div className="mt-auto pt-4 border-t border-border/60">
          <Button
            size="sm"
            variant="ghost"
            onClick={() =>
              onDelete({
                id: isFile ? file!.id : folder!.id,
                type: singleResolved.type,
                name: displayName,
              })
            }
            className="w-full justify-center gap-1.5 text-xs text-red-500 hover:bg-red-500/10 hover:text-red-500 rounded-xl h-9 font-semibold"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Çöp Kutusuna Gönder</span>
          </Button>
        </div>
      </>
    );
  };

  const renderMultiInfo = () => {
    if (!multiStats) return null;
    const summaryParts: string[] = [];
    if (multiStats.folderCount > 0) summaryParts.push(`${multiStats.folderCount} klasör`);
    if (multiStats.fileCount > 0) summaryParts.push(`${multiStats.fileCount} dosya`);

    return (
      <>
        <div className="my-4 flex flex-col items-center justify-center rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 text-center shadow-inner">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/20 border border-amber-500/30 text-amber-600 dark:text-amber-400 shadow-sm">
            <Layers className="h-7 w-7" />
          </div>
          <h4 className="mt-3 text-sm font-bold text-foreground">
            {multiStats.totalCount} öğe seçili
          </h4>
          <p className="mt-1 text-xs text-muted-foreground">
            {summaryParts.join(", ")}
          </p>
          <span className="mt-2 inline-flex items-center rounded-full bg-card/80 border border-border/70 px-2.5 py-0.5 text-[11px] font-mono font-bold text-amber-600 dark:text-amber-400">
            {formatBytes(multiStats.totalBytes)}
          </span>
        </div>

        <div className="space-y-2">
          {onBulkShare && (
            <Button
              size="sm"
              className="w-full justify-start gap-2 bg-amber-500 text-xs font-bold text-zinc-950 hover:bg-amber-400 rounded-xl h-9"
              onClick={onBulkShare}
            >
              <Share2 className="h-3.5 w-3.5" />
              <span>Seçilenleri Paylaş</span>
            </Button>
          )}
          {onBulkMove && (
            <Button
              size="sm"
              variant="outline"
              className="w-full justify-start gap-2 text-xs rounded-xl h-9 font-semibold"
              onClick={onBulkMove}
            >
              <Move className="h-3.5 w-3.5 text-blue-500" />
              <span>Klasöre Taşı</span>
            </Button>
          )}
          {onBulkDelete && (
            <Button
              size="sm"
              variant="outline"
              className="w-full justify-start gap-2 text-xs text-red-500 hover:bg-red-500/10 hover:text-red-500 border-red-500/30 rounded-xl h-9 font-semibold"
              onClick={onBulkDelete}
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Çöp Kutusuna Gönder</span>
            </Button>
          )}
        </div>

        {onClearSelection && (
          <div className="mt-auto pt-4 border-t border-border/60">
            <Button
              size="sm"
              variant="ghost"
              onClick={onClearSelection}
              className="w-full text-xs text-muted-foreground hover:text-foreground rounded-xl h-9"
            >
              Seçimi Temizle
            </Button>
          </div>
        )}
      </>
    );
  };

  const renderFolderOverview = () => {
    const foldersCount = folderSummary?.foldersCount ?? 0;
    const filesCount = folderSummary?.filesCount ?? 0;
    const totalSizeBytes = folderSummary?.totalSizeBytes ?? 0;
    const { cad, pdf, image, other, total } = folderDistribution;

    return (
      <>
        <div className="my-4 flex flex-col items-center justify-center rounded-2xl border border-border/80 bg-secondary/30 p-5 text-center shadow-inner">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/15 border border-amber-500/25 text-amber-500 shadow-sm">
            <FolderOpen className="h-7 w-7" />
          </div>
          <h4 className="mt-3 text-xs font-bold text-foreground break-words line-clamp-2">
            {currentFolderName}
          </h4>
          <span className="mt-1 text-[11px] text-muted-foreground">
            Klasör Özeti
          </span>
        </div>

        <div className="space-y-3 text-xs">
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl border border-border/60 bg-secondary/30 p-2.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Klasör
              </span>
              <p className="mt-0.5 font-mono text-sm font-bold text-foreground">
                {foldersCount}
              </p>
            </div>
            <div className="rounded-xl border border-border/60 bg-secondary/30 p-2.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Dosya
              </span>
              <p className="mt-0.5 font-mono text-sm font-bold text-foreground">
                {filesCount}
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-border/60 bg-secondary/30 p-2.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Toplam Boyut
            </span>
            <p className="mt-0.5 font-mono text-sm font-bold text-amber-600 dark:text-amber-400">
              {formatBytes(totalSizeBytes)}
            </p>
          </div>

          {total > 0 && (
            <div className="rounded-xl border border-border/60 bg-secondary/30 p-3 space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Tür Dağılımı
              </span>
              <div className="flex h-2 w-full overflow-hidden rounded-full bg-secondary">
                {cad > 0 && (
                  <div style={{ width: `${(cad / total) * 100}%` }} className="bg-cyan-500" />
                )}
                {pdf > 0 && (
                  <div style={{ width: `${(pdf / total) * 100}%` }} className="bg-red-500" />
                )}
                {image > 0 && (
                  <div style={{ width: `${(image / total) * 100}%` }} className="bg-emerald-500" />
                )}
                {other > 0 && (
                  <div style={{ width: `${(other / total) * 100}%` }} className="bg-amber-500/80" />
                )}
              </div>
              <div className="grid grid-cols-2 gap-1 text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-cyan-500" />
                  CAD: <strong className="font-mono text-foreground">{cad}</strong>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-red-500" />
                  PDF: <strong className="font-mono text-foreground">{pdf}</strong>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  Görsel: <strong className="font-mono text-foreground">{image}</strong>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-amber-500/80" />
                  Diğer: <strong className="font-mono text-foreground">{other}</strong>
                </span>
              </div>
            </div>
          )}
        </div>

        <p className="mt-auto pt-4 text-[11px] text-muted-foreground text-center border-t border-border/60">
          Detay görmek için bir dosya veya klasör seçin.
        </p>
      </>
    );
  };

  const renderActivityTab = () => {
    return (
      <div className="flex min-h-0 flex-1 flex-col pt-3">
        <div className="mb-2.5 flex items-center justify-between">
          <span className="text-[11px] font-semibold text-muted-foreground">
            Son İşlemler
          </span>
          <button
            type="button"
            onClick={() => void loadActivity()}
            disabled={isLoadingActivity}
            className="inline-flex items-center gap-1 rounded-lg border border-border/70 px-2 py-1 text-[11px] font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors disabled:opacity-50"
            aria-label="Etkinliği yenile"
          >
            <RefreshCw className={`h-3 w-3 ${isLoadingActivity ? "animate-spin" : ""}`} />
            <span>Yenile</span>
          </button>
        </div>

        <div className="flex-1 space-y-2 overflow-y-auto pr-1">
          {activityError && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-600 dark:text-red-400">
              {activityError}
            </div>
          )}

          {!isLoadingActivity && !activityError && events.length === 0 && (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/70 p-6 text-center">
              <Clock className="h-6 w-6 text-muted-foreground/60" />
              <p className="mt-2 text-xs font-medium text-muted-foreground">
                Henüz kayıtlı etkinlik yok.
              </p>
            </div>
          )}

          {events.map((ev) => {
            const meta = getActivityMeta(ev.action);
            return (
              <div
                key={ev.id}
                className="flex items-start gap-2.5 rounded-xl border border-border/60 bg-secondary/25 p-2.5 text-xs"
              >
                <span
                  className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border ${meta.colorClass}`}
                >
                  {meta.icon}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-foreground truncate">
                    {ev.display_name || "İsimsiz öğe"}
                  </p>
                  <div className="mt-0.5 flex items-center justify-between gap-2 text-[10px] text-muted-foreground">
                    <span>{meta.label}</span>
                    <span className="shrink-0 font-mono">{formatRelativeTime(ev.created_at)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <motion.aside
      initial={{ x: 24, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
      className={`hidden w-80 shrink-0 flex-col border-l border-border/70 bg-card/60 p-4 select-none lg:flex ${styles.details}`}
    >
      {/* 1. Başlık ve Kapat Butonu */}
      <div className="flex items-center justify-between border-b border-border/60 pb-3">
        <div className="flex items-center gap-1 rounded-xl bg-secondary/60 p-1">
          <button
            type="button"
            data-testid="dok-drawer-tab-info"
            onClick={() => setActiveTab("info")}
            className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors ${
              activeTab === "info"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Info className="h-3.5 w-3.5 text-amber-500" />
            <span>Bilgi</span>
          </button>
          <button
            type="button"
            data-testid="dok-drawer-tab-activity"
            onClick={() => setActiveTab("activity")}
            className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors ${
              activeTab === "activity"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Activity className="h-3.5 w-3.5 text-blue-500" />
            <span>Etkinlik</span>
          </button>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
          aria-label="Kapat"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* 2. Sekme İçeriği */}
      {activeTab === "activity" ? (
        renderActivityTab()
      ) : (
        <div className="flex min-h-0 flex-1 flex-col">
          {multiStats
            ? renderMultiInfo()
            : singleResolved
              ? renderSingleInfo()
              : renderFolderOverview()}
        </div>
      )}
    </motion.aside>
  );
}
