"use client";

import React, { useEffect, useId, useRef } from "react";
import Link from "next/link";
import { Edit3, Eye, Folder, Share2, Trash2, X } from "lucide-react";
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
}

export function MobileDetailsSheet({ selectedItem, onClose, onShare, onRename, onDelete }: MobileDetailsSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const titleId = useId();

  useEffect(() => {
    if (!selectedItem) return;
    previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
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
      document.body.style.overflow = previousOverflow;
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
    <div className="fixed inset-0 z-50 flex items-end bg-black/55 lg:hidden" onMouseDown={onClose}>
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onMouseDown={(event) => event.stopPropagation()}
        className={`max-h-[min(82dvh,44rem)] w-full overflow-y-auto rounded-t-3xl border border-border/80 p-4 shadow-2xl outline-none ${styles.mobileSheetSafeArea} ${styles.details}`}
      >
        <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-muted-foreground/30" />
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border bg-secondary/40">
              {isFile ? getFileIcon(file!.extension) : <Folder className="h-6 w-6 text-amber-500" />}
            </div>
            <div className="min-w-0">
              <h2 id={titleId} className="truncate text-sm font-bold text-foreground">{name}</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">{extension}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-muted-foreground hover:bg-secondary hover:text-foreground" aria-label="Detayları kapat">
            <X className="h-5 w-5" />
          </button>
        </div>

        <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3 rounded-2xl border border-border/70 bg-secondary/20 p-3 text-xs">
          <div><dt className="text-muted-foreground">Boyut</dt><dd className="mt-1 font-medium text-foreground">{isFile ? formatBytes(Number(file!.size_bytes)) : "—"}</dd></div>
          <div><dt className="text-muted-foreground">Güncelleme</dt><dd className="mt-1 font-medium text-foreground">{formatDate(updatedAt)}</dd></div>
        </dl>

        <div className="mt-4 grid grid-cols-2 gap-2">
          {isFile && (
            <Button asChild className="col-span-2 h-11 bg-amber-500 text-zinc-950 hover:bg-amber-400">
              <Link href={`/dokumantasyon/dosya/${file!.id}`}><Eye className="h-4 w-4" />Önizle</Link>
            </Button>
          )}
          <Button variant="outline" className="h-11" onClick={() => { onShare({ id, type: selectedItem.type, name, size: isFile ? Number(file!.size_bytes) : undefined }); onClose(); }}><Share2 className="h-4 w-4" />Paylaş</Button>
          <Button variant="outline" className="h-11" onClick={() => { onRename({ id, type: selectedItem.type, name }); onClose(); }}><Edit3 className="h-4 w-4" />Adlandır</Button>
          <Button variant="outline" className="h-11 border-red-500/30 text-red-500 hover:bg-red-500/10 hover:text-red-500" onClick={() => { onDelete({ id, type: selectedItem.type, name }); onClose(); }}><Trash2 className="h-4 w-4" />Sil</Button>
        </div>
      </div>
    </div>
  );
}
