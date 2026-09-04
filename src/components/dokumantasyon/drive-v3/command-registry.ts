// ============================================================================
// DÖKÜMANTASYON DRIVE V3.1 — COMMAND REGISTRY & UNIFIED ACTION DISPATCHER
// ============================================================================

import { DokFile, DokFolder } from "@/lib/dokumantasyon/types";

export type CommandId =
  | "new-folder"
  | "upload-files"
  | "upload-folder"
  | "open"
  | "preview"
  | "download"
  | "rename"
  | "move"
  | "trash"
  | "restore"
  | "delete-forever"
  | "star"
  | "unstar"
  | "share"
  | "details"
  | "search"
  | "select-all"
  | "clear-selection"
  | "refresh"
  | "change-view"
  | "change-sort"
  | "open-trash"
  | "open-active-shares";

export type CommandTargetItem = {
  id: string;
  type: "file" | "folder";
  name: string;
  size?: number;
  starred?: boolean;
  pending?: boolean;
};

export type CommandContext = {
  currentFolderId: string | null;
  selectedIds: Set<string>;
  selectedItems: CommandTargetItem[];
  totalItemCount: number;
  isTrashView?: boolean;
  viewMode?: "list" | "grid";
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  isPendingOperation?: boolean;
};

export type CommandHandler = (context: CommandContext, payload?: unknown) => void | Promise<void>;

export interface CommandDefinition {
  id: CommandId;
  label: string;
  shortcut?: string;
  requiresSelection?: boolean;
  allowMulti?: boolean;
  canExecute: (context: CommandContext) => boolean;
}

export const COMMAND_DEFINITIONS: Record<CommandId, CommandDefinition> = {
  "new-folder": {
    id: "new-folder",
    label: "Yeni Klasör",
    canExecute: (ctx) => !ctx.isTrashView && !ctx.isPendingOperation,
  },
  "upload-files": {
    id: "upload-files",
    label: "Dosya Yükle",
    canExecute: (ctx) => !ctx.isTrashView && !ctx.isPendingOperation,
  },
  "upload-folder": {
    id: "upload-folder",
    label: "Klasör Yükle",
    canExecute: (ctx) => !ctx.isTrashView && !ctx.isPendingOperation,
  },
  open: {
    id: "open",
    label: "Aç",
    shortcut: "Enter",
    requiresSelection: true,
    allowMulti: false,
    canExecute: (ctx) =>
      ctx.selectedItems.length === 1 &&
      !ctx.selectedItems[0].pending &&
      !ctx.isTrashView,
  },
  preview: {
    id: "preview",
    label: "Önizle",
    shortcut: "Space",
    requiresSelection: true,
    allowMulti: false,
    canExecute: (ctx) =>
      ctx.selectedItems.length === 1 &&
      ctx.selectedItems[0].type === "file" &&
      !ctx.selectedItems[0].pending,
  },
  download: {
    id: "download",
    label: "İndir",
    requiresSelection: true,
    allowMulti: true,
    canExecute: (ctx) =>
      ctx.selectedItems.length >= 1 &&
      ctx.selectedItems.some((i) => i.type === "file" && !i.pending),
  },
  rename: {
    id: "rename",
    label: "Yeniden Adlandır",
    shortcut: "F2",
    requiresSelection: true,
    allowMulti: false,
    canExecute: (ctx) =>
      ctx.selectedItems.length === 1 &&
      !ctx.selectedItems[0].pending &&
      !ctx.isTrashView &&
      !ctx.isPendingOperation,
  },
  move: {
    id: "move",
    label: "Taşı",
    requiresSelection: true,
    allowMulti: true,
    canExecute: (ctx) =>
      ctx.selectedItems.length >= 1 &&
      ctx.selectedItems.every((i) => !i.pending) &&
      !ctx.isTrashView &&
      !ctx.isPendingOperation,
  },
  trash: {
    id: "trash",
    label: "Çöp Kutusuna Taşı",
    shortcut: "Delete",
    requiresSelection: true,
    allowMulti: true,
    canExecute: (ctx) =>
      ctx.selectedItems.length >= 1 &&
      ctx.selectedItems.every((i) => !i.pending) &&
      !ctx.isTrashView &&
      !ctx.isPendingOperation,
  },
  restore: {
    id: "restore",
    label: "Geri Yükle",
    requiresSelection: true,
    allowMulti: true,
    canExecute: (ctx) =>
      Boolean(ctx.isTrashView) &&
      ctx.selectedItems.length >= 1 &&
      !ctx.isPendingOperation,
  },
  "delete-forever": {
    id: "delete-forever",
    label: "Kalıcı Olarak Sil",
    requiresSelection: true,
    allowMulti: true,
    canExecute: (ctx) =>
      Boolean(ctx.isTrashView) &&
      ctx.selectedItems.length >= 1 &&
      !ctx.isPendingOperation,
  },
  star: {
    id: "star",
    label: "Yıldızla",
    requiresSelection: true,
    allowMulti: true,
    canExecute: (ctx) =>
      ctx.selectedItems.length >= 1 &&
      ctx.selectedItems.every((i) => !i.pending) &&
      !ctx.isTrashView,
  },
  unstar: {
    id: "unstar",
    label: "Yıldızı Kaldır",
    requiresSelection: true,
    allowMulti: true,
    canExecute: (ctx) =>
      ctx.selectedItems.length >= 1 &&
      ctx.selectedItems.every((i) => !i.pending) &&
      !ctx.isTrashView,
  },
  share: {
    id: "share",
    label: "Paylaş",
    requiresSelection: true,
    allowMulti: true,
    canExecute: (ctx) =>
      ctx.selectedItems.length >= 1 &&
      ctx.selectedItems.some((i) => i.type === "file" && !i.pending) &&
      !ctx.isTrashView &&
      !ctx.isPendingOperation,
  },
  details: {
    id: "details",
    label: "Ayrıntılar",
    canExecute: (ctx) => !ctx.isTrashView,
  },
  search: {
    id: "search",
    label: "Ara...",
    shortcut: "/",
    canExecute: () => true,
  },
  "select-all": {
    id: "select-all",
    label: "Tümünü Seç",
    shortcut: "Ctrl+A",
    canExecute: (ctx) => ctx.totalItemCount > 0,
  },
  "clear-selection": {
    id: "clear-selection",
    label: "Seçimi Kaldır",
    shortcut: "Escape",
    canExecute: (ctx) => ctx.selectedIds.size > 0,
  },
  refresh: {
    id: "refresh",
    label: "Yenile",
    canExecute: (ctx) => !ctx.isPendingOperation,
  },
  "change-view": {
    id: "change-view",
    label: "Görünümü Değiştir",
    canExecute: () => true,
  },
  "change-sort": {
    id: "change-sort",
    label: "Sıralamayı Değiştir",
    canExecute: () => true,
  },
  "open-trash": {
    id: "open-trash",
    label: "Çöp Kutusunu Aç",
    canExecute: () => true,
  },
  "open-active-shares": {
    id: "open-active-shares",
    label: "Aktif Paylaşımları Aç",
    canExecute: () => true,
  },
};

export class CommandRegistry {
  private handlers = new Map<CommandId, CommandHandler>();

  register(id: CommandId, handler: CommandHandler): () => void {
    this.handlers.set(id, handler);
    return () => {
      this.handlers.delete(id);
    };
  }

  canExecute(id: CommandId, context: CommandContext): boolean {
    const def = COMMAND_DEFINITIONS[id];
    if (!def) return false;
    return def.canExecute(context);
  }

  async execute(id: CommandId, context: CommandContext, payload?: unknown): Promise<boolean> {
    if (!this.canExecute(id, context)) {
      return false;
    }
    const handler = this.handlers.get(id);
    if (!handler) {
      console.warn(`[CommandRegistry] Handler not registered for command: ${id}`);
      return false;
    }
    await handler(context, payload);
    return true;
  }

  isRegistered(id: CommandId): boolean {
    return this.handlers.has(id);
  }
}
