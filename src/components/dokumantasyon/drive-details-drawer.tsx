"use client";

import React from "react";
import Link from "next/link";
import {
  X,
  Eye,
  Share2,
  Download,
  Edit3,
  Trash2,
  Calendar,
  HardDrive,
  Folder,
  Layers,
  FileCode,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { DokFile, DokFolder } from "@/lib/dokumantasyon/types";
import { formatBytes, formatDate, getFileIcon } from "./ui-helpers";
import styles from "./dok-workspace.module.css";

interface DriveDetailsDrawerProps {
  selectedItem: {
    type: "file" | "folder";
    file?: DokFile;
    folder?: DokFolder;
  } | null;
  onClose: () => void;
  onShare: (item: { id: string; type: "file" | "folder"; name: string; size?: number }) => void;
  onRename: (item: { id: string; type: "file" | "folder"; name: string }) => void;
  onDelete: (item: { id: string; type: "file" | "folder"; name: string }) => void;
}

export function DriveDetailsDrawer({
  selectedItem,
  onClose,
  onShare,
  onRename,
  onDelete,
}: DriveDetailsDrawerProps) {
  if (!selectedItem) return null;

  const isFile = selectedItem.type === "file" && !!selectedItem.file;
  const file = selectedItem.file;
  const folder = selectedItem.folder;

  const displayName = isFile ? file!.display_name : folder!.name;
  const sizeBytes = isFile ? Number(file!.size_bytes) : 0;
  const createdAt = isFile ? file!.created_at : folder!.created_at;
  const updatedAt = isFile ? file!.updated_at : folder!.updated_at;
  const extension = isFile ? file!.extension : "Klasör";

  return (
    <aside className={`hidden w-80 shrink-0 flex-col border-l border-border/70 bg-card/60 p-4 select-none lg:flex ${styles.details}`}>
      {/* 1. Başlık ve Kapat Butonu */}
      <div className="flex items-center justify-between border-b border-border/60 pb-3">
        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Öğe Detayları
        </span>
        <button
          onClick={onClose}
          className="rounded-lg p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
          aria-label="Kapat"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* 2. Görsel / İkon Alanı */}
      <div className="my-4 flex flex-col items-center justify-center rounded-xl border border-border/80 bg-secondary/30 p-6 text-center">
        {isFile ? (
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-card border border-border shadow-sm">
            {getFileIcon(file!.extension)}
          </div>
        ) : (
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500">
            <Folder className="h-8 w-8" />
          </div>
        )}

        <h4 className="mt-3 text-xs font-bold text-foreground break-all line-clamp-2">
          {displayName}
        </h4>
        <span className="mt-1 inline-flex items-center rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold text-muted-foreground uppercase">
          {extension}
        </span>
      </div>

      {/* 3. Hızlı Eylem Butonları */}
      <div className="grid grid-cols-2 gap-2 border-b border-border/60 pb-4">
        {isFile && (
          <Button
            asChild
            size="sm"
            className="col-span-2 gap-1.5 bg-amber-500 text-xs font-bold text-zinc-950 hover:bg-amber-400 shadow-sm"
          >
            <Link
              href={`/dokumantasyon/dosya/${file!.id}`}
            >
              <Eye className="h-3.5 w-3.5" />
              <span>Önizle</span>
            </Link>
          </Button>
        )}

        <Button
          size="sm"
          variant="outline"
          onClick={() =>
            onShare({
              id: isFile ? file!.id : folder!.id,
              type: selectedItem.type,
              name: displayName,
              size: sizeBytes,
            })
          }
          className="gap-1 text-xs border-border/80 hover:bg-secondary"
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
              type: selectedItem.type,
              name: displayName,
            })
          }
          className="gap-1 text-xs border-border/80 hover:bg-secondary"
        >
          <Edit3 className="h-3.5 w-3.5 text-amber-500" />
          <span>Adlandır</span>
        </Button>
      </div>

      {/* 4. Metadata Listesi */}
      <div className="mt-4 space-y-3 text-xs">
        <div className="space-y-1">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Boyut
          </span>
          <p className="font-mono text-foreground font-medium">
            {isFile ? formatBytes(sizeBytes) : "—"}
          </p>
        </div>

        <div className="space-y-1">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Oluşturulma Tarihi
          </span>
          <p className="text-foreground">{formatDate(createdAt)}</p>
        </div>

        <div className="space-y-1">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Son Güncelleme
          </span>
          <p className="text-foreground">{formatDate(updatedAt || createdAt)}</p>
        </div>
      </div>

      {/* 5. Silme Butonu */}
      <div className="mt-auto pt-4 border-t border-border/60">
        <Button
          size="sm"
          variant="ghost"
          onClick={() =>
            onDelete({
              id: isFile ? file!.id : folder!.id,
              type: selectedItem.type,
              name: displayName,
            })
          }
          className="w-full justify-center gap-1.5 text-xs text-red-500 hover:bg-red-500/10 hover:text-red-500"
        >
          <Trash2 className="h-3.5 w-3.5" />
          <span>Çöp Kutusuna Gönder</span>
        </Button>
      </div>
    </aside>
  );
}
