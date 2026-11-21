// ============================================================================
// DÖKÜMANTASYON DRIVE V5 — GERİ AL (UNDO) YIĞINI, TOAST & CTRL+Z DİNLEYİCİSİ
// ============================================================================

"use client";

import { useCallback, useEffect, useRef } from "react";
import { useToast } from "@/components/toast-provider";

export type UndoTargetItem = {
  id: string;
  type: "file" | "folder";
};

export type UndoMoveItem = UndoTargetItem & {
  previousParentId: string | null;
};

export interface UndoRenameParams {
  id: string;
  type: "file" | "folder";
  previousName: string;
  newName: string;
  toastMessage?: string;
}

interface UndoEntry {
  id: string;
  expiresAt: number;
  undo: () => Promise<void>;
}

export interface UseUndoToastOptions {
  onRefresh: () => void | Promise<void>;
  disabled?: boolean;
  ttlMs?: number;
}

const DEFAULT_UNDO_TTL_MS = 8500;

function isEditableElement(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  if (target.isContentEditable) return true;
  return Boolean(target.closest("[contenteditable='true']"));
}

/**
 * Çöp kutusuna taşıma, klasör taşıma ve yeniden adlandırma işlemleri için
 * 7-10 sn aktif Undo Toast ve Ctrl+Z / Cmd+Z geri alma yığını yönetir.
 */
export function useUndoToast({
  onRefresh,
  disabled = false,
  ttlMs = DEFAULT_UNDO_TTL_MS,
}: UseUndoToastOptions) {
  const { showToast } = useToast();
  const stackRef = useRef<UndoEntry[]>([]);
  const inFlightRef = useRef(false);
  const seqRef = useRef(1);

  const executeEntry = useCallback(async (entryId?: string) => {
    if (inFlightRef.current) return false;
    const now = Date.now();
    stackRef.current = stackRef.current.filter((entry) => entry.expiresAt > now);

    let targetIndex = -1;
    if (entryId) {
      targetIndex = stackRef.current.findIndex((entry) => entry.id === entryId);
    } else if (stackRef.current.length > 0) {
      targetIndex = stackRef.current.length - 1;
    }
    if (targetIndex < 0) return false;

    const [entry] = stackRef.current.splice(targetIndex, 1);
    inFlightRef.current = true;
    try {
      await entry.undo();
      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Geri alma işlemi başarısız oldu.";
      showToast(msg, "error");
      return false;
    } finally {
      inFlightRef.current = false;
    }
  }, [showToast]);

  const pushEntry = useCallback(
    (toastMessage: string, undoFn: () => Promise<void>) => {
      const id = `undo-${seqRef.current++}`;
      const entry: UndoEntry = {
        id,
        expiresAt: Date.now() + ttlMs,
        undo: undoFn,
      };
      stackRef.current = [
        ...stackRef.current.filter((item) => item.expiresAt > Date.now()),
        entry,
      ];
      showToast(toastMessage, "info", {
        actionLabel: "Geri Al",
        onAction: () => {
          void executeEntry(id);
        },
        durationMs: ttlMs,
        actionTestId: "dok-toast-undo",
      });
    },
    [executeEntry, showToast, ttlMs]
  );

  const pushUndoTrash = useCallback(
    (items: UndoTargetItem[], toastMessage?: string) => {
      if (items.length === 0) return;
      const snapshot = items.map((item) => ({ id: item.id, type: item.type }));
      const label = toastMessage || `${snapshot.length} öğe çöp kutusuna taşındı`;

      pushEntry(label, async () => {
        const res = await fetch("/api/dokumantasyon/bulk/restore", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items: snapshot }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data.error || "Öğeler geri yüklenemedi.");
        }
        await onRefresh();
        showToast(`${snapshot.length} öğe geri yüklendi`, "success");
      });
    },
    [onRefresh, pushEntry, showToast]
  );

  const pushUndoMove = useCallback(
    (moves: UndoMoveItem[], targetFolderLabel?: string, toastMessage?: string) => {
      if (moves.length === 0) return;
      const snapshot = moves.map((m) => ({
        id: m.id,
        type: m.type,
        previousParentId: m.previousParentId ?? null,
      }));
      const label =
        toastMessage ||
        (targetFolderLabel
          ? `${snapshot.length} öğe '${targetFolderLabel}' klasörüne taşındı`
          : `${snapshot.length} öğe taşındı`);

      pushEntry(label, async () => {
        const grouped = new Map<string, { targetFolderId: string | null; items: UndoTargetItem[] }>();
        for (const item of snapshot) {
          const key = item.previousParentId ?? "__root__";
          const bucket = grouped.get(key) ?? {
            targetFolderId: item.previousParentId,
            items: [],
          };
          bucket.items.push({ id: item.id, type: item.type });
          grouped.set(key, bucket);
        }

        for (const group of grouped.values()) {
          const res = await fetch("/api/dokumantasyon/bulk/move", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              items: group.items,
              targetFolderId: group.targetFolderId,
            }),
          });
          const data = await res.json().catch(() => ({}));
          if (!res.ok) {
            throw new Error(data.error || "Taşıma işlemi geri alınamadı.");
          }
        }

        await onRefresh();
        showToast(`${snapshot.length} öğe eski konumuna taşındı`, "success");
      });
    },
    [onRefresh, pushEntry, showToast]
  );

  const pushUndoRename = useCallback(
    ({ id, type, previousName, newName, toastMessage }: UndoRenameParams) => {
      if (!previousName || previousName === newName) return;
      const label = toastMessage || "Ad güncellendi";

      pushEntry(label, async () => {
        const endpoint =
          type === "file"
            ? `/api/dokumantasyon/files/${encodeURIComponent(id)}`
            : `/api/dokumantasyon/folders/${encodeURIComponent(id)}`;
        const payload = type === "file" ? { displayName: previousName } : { name: previousName };

        const res = await fetch(endpoint, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data.error || "Adlandırma geri alınamadı.");
        }

        await onRefresh();
        showToast("Ad geri alındı", "success");
      });
    },
    [onRefresh, pushEntry, showToast]
  );

  const undoLast = useCallback(() => executeEntry(), [executeEntry]);

  const clearUndoStack = useCallback(() => {
    stackRef.current = [];
  }, []);

  useEffect(() => {
    if (disabled) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat || e.shiftKey || e.altKey) return;
      if (!(e.ctrlKey || e.metaKey)) return;
      if (e.key.toLowerCase() !== "z") return;
      if (isEditableElement(e.target) || isEditableElement(document.activeElement)) return;

      const now = Date.now();
      const hasActive = stackRef.current.some((entry) => entry.expiresAt > now);
      if (!hasActive) return;

      e.preventDefault();
      void executeEntry();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [disabled, executeEntry]);

  return {
    pushUndoTrash,
    pushUndoMove,
    pushUndoRename,
    undoLast,
    clearUndoStack,
  };
}
