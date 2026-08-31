"use client";

import React, { useEffect, useId, useRef } from "react";
import Link from "next/link";
import { Download, Edit3, Eye, Folder, Share2, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DokFile, DokFolder } from "@/lib/dokumantasyon/types";
import { formatBytes, formatDate, getFileIcon } from "./ui-helpers";
import styles from "./dok-workspace.module.css";

interface MobileDetailsSheetProps {
  selectedItem: { type: "file" | "folder"; file?: DokFile; folder?: DokFolder } | null;
  onClose: () => void;
  onShare: (item: { id: string; type: "file" | "folder"; name: string; size?: number }) => void;
  onRename: (item: { id: string; type: "file" | "folder"; name: string }) => void;
  onDelete: (item: { id: string; type: "file" | "folder"; name: string }) => void;
  onDownload?: (file: DokFile) => void;
}

export function MobileDetailsSheet({ selectedItem, onClose, onShare, onRename, onDelete, onDownload }: MobileDetailsSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const titleId = useId();

  useEffect(() => {
    if (!selectedItem) return;
    const isMobile = typeof window !== "undefined" && window.matchMedia("(max-width: 1023px)").matches;
    if (!isMobile) return;

    previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    // BUG-5 FIX: previousOverflow'u ref'te sakla — unexpected unmount'ta da temizlenir
    const previousOverflow = document.body.style.overflow;
    const previousOverscroll = document.body.style.overscrollBehavior;
    document.body.style.overflow = "hidden";
    document.body.style.overscrollBehavior = "none";
    const focusSheet = window.setTimeout(() => sheetRef.current?.focus(), 0);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key !== "Tab" || !sheetRef.current) return;
      const focusable = Array.from(sheetRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ));
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      window.clearTimeout(focusSheet);
      // Her zaman geri yükle — route değişimi, hata, unmount dahil
      document.body.style.overflow = previousOverflow;
      document.body.style.overscrollBehavior = previousOverscroll;
      document.removeEventListener("keydown", onKeyDown);
      previousFocusRef.current?.focus();
    };
  }, [onClose, selectedItem]);

  if (!selectedItem) return null;
  const isFile = selectedItem.type === "file" && !!selectedItem.file;
  const file = selectedItem.file;
  const folder = selectedItem.folder;
  const id = isFile ? file!.id : folder!.id;
  const name = isFile ? file!.display_name : folder!.name;
  const extension = isFile ? file!.extension.toUpperCase() : "KLASÖR";
  const updatedAt = isFile ? file!.updated_at || file!.created_at : folder!.updated_at || folder!.created_at;

  return (
    <div className="fixed inset-0 z-[70] flex items-end bg-black/60 backdrop-blur-sm lg:hidden animate-in fade-in" onMouseDown={onClose}>
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onMouseDown={(event) => event.stopPropagation()}
        className={`max-h-[min(84dvh,46rem)] w-full overflow-y-auto rounded-t-3xl border-t border-x border-border/80 bg-card/95 p-5 shadow-2xl backdrop-blur-xl outline-none ${styles.mobileSheetSafeArea} ${styles.details}`}
      >
        <div className="mx-auto mb-3.5 h-1.5 w-12 rounded-full bg-muted-foreground/30" />
        <div className="flex items-start justify-between gap-3 pb-2">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-border/80 bg-secondary/40 shadow-sm">
              {isFile ? getFileIcon(file!.extension) : <Folder className="h-6 w-6 text-amber-500" />}
            </div>
            <div className="min-w-0">
              <h2 id={titleId} className="truncate text-sm font-bold text-foreground">{name}</h2>
              <p className="mt-0.5 text-xs text-muted-foreground font-mono font-semibold">{extension}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
            aria-label="Detayları kapat"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 rounded-2xl border border-border/70 bg-secondary/20 p-3.5 text-xs shadow-inner">
          <div>
            <dt className="text-muted-foreground font-medium">Boyut</dt>
            <dd className="mt-1 font-bold text-foreground font-mono">{isFile ? formatBytes(Number(file!.size_bytes)) : "—"}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground font-medium">Güncelleme</dt>
            <dd className="mt-1 font-medium text-foreground">{formatDate(updatedAt)}</dd>
          </div>
        </dl>

        <div className="mt-5 grid grid-cols-2 gap-2.5">
          {isFile && (
            <>
              <Button asChild className="h-11 bg-amber-500 font-bold text-zinc-950 hover:bg-amber-400 rounded-xl shadow-sm">
                <Link href={`/dokumantasyon/dosya/${file!.id}`}><Eye className="h-4 w-4" />Önizle</Link>
              </Button>
              {onDownload && (
                <Button variant="outline" className="h-11 rounded-xl font-semibold border-border/80" onClick={() => { onDownload(file!); onClose(); }}>
                  <Download className="h-4 w-4" />İndir
                </Button>
              )}
            </>
          )}
          <Button variant="outline" className={`h-11 rounded-xl font-semibold border-border/80 ${!isFile ? "col-span-1" : ""}`} onClick={() => { onShare({ id, type: selectedItem.type, name, size: isFile ? Number(file!.size_bytes) : undefined }); onClose(); }}><Share2 className="h-4 w-4 text-blue-500" />Paylaş</Button>
          <Button variant="outline" className={`h-11 rounded-xl font-semibold border-border/80 ${!isFile ? "col-span-1" : ""}`} onClick={() => { onRename({ id, type: selectedItem.type, name }); onClose(); }}><Edit3 className="h-4 w-4 text-amber-500" />Adlandır</Button>
          <Button variant="outline" className="col-span-2 h-11 border-red-500/30 text-red-500 hover:bg-red-500/10 hover:text-red-500 rounded-xl font-semibold" onClick={() => { onDelete({ id, type: selectedItem.type, name }); onClose(); }}><Trash2 className="h-4 w-4" />Sil</Button>
        </div>
      </div>
    </div>
  );
}
