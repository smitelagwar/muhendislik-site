// ============================================================================
// DÖKÜMANTASYON DRIVE V3.1 — CLIPBOARD COPY / CUT / PASTE SPEC
// ============================================================================

import { test, expect } from "@playwright/test";
import {
  CommandRegistry,
  CommandContext,
  CommandTargetItem,
} from "../../src/components/dokumantasyon/drive-v3/command-registry";

test.describe("Drive V3.1 — Clipboard (Copy, Cut, Paste) Workflow", () => {
  test("1. Copy işlemi panoyu 'copy' modunda doldurur ve paste'e izin verir", async () => {
    const registry = new CommandRegistry();
    let clipboard: { mode: "copy" | "cut"; items: CommandTargetItem[] } | null = null;

    registry.register("copy", (ctx) => {
      clipboard = { mode: "copy", items: ctx.selectedItems };
    });

    const fileItem: CommandTargetItem = {
      id: "file-doc-1",
      type: "file",
      name: "StatikRapor.pdf",
    };

    const ctx: CommandContext = {
      currentFolderId: "root",
      selectedIds: new Set([fileItem.id]),
      selectedItems: [fileItem],
      totalItemCount: 1,
      isTrashView: false,
      isPendingOperation: false,
    };

    expect(registry.canExecute("copy", ctx)).toBe(true);
    await registry.execute("copy", ctx);

    expect(clipboard).not.toBeNull();
    expect(clipboard?.mode).toBe("copy");
    expect(clipboard?.items[0].id).toBe("file-doc-1");

    // Şimdi paste kontrolü
    const targetFolderCtx: CommandContext = {
      currentFolderId: "folder-target",
      selectedIds: new Set(),
      selectedItems: [],
      totalItemCount: 0,
      isTrashView: false,
      isPendingOperation: false,
      clipboardState: clipboard,
    };

    expect(registry.canExecute("paste", targetFolderCtx)).toBe(true);
  });

  test("2. Cut işlemi panoyu 'cut' modunda doldurur ve paste sonrası pano temizlenir", async () => {
    const registry = new CommandRegistry();
    let clipboard: { mode: "copy" | "cut"; items: CommandTargetItem[] } | null = null;
    let movedItems: { ids: string[]; target: string | null } | null = null;

    registry.register("cut", (ctx) => {
      clipboard = { mode: "cut", items: ctx.selectedItems };
    });

    registry.register("paste", async (ctx) => {
      if (!ctx.clipboardState) return;
      if (ctx.clipboardState.mode === "cut") {
        movedItems = {
          ids: ctx.clipboardState.items.map((i) => i.id),
          target: ctx.currentFolderId,
        };
        clipboard = null;
      }
    });

    const folderItem: CommandTargetItem = {
      id: "folder-sub-1",
      type: "folder",
      name: "Mimari Çizimler",
    };

    const cutCtx: CommandContext = {
      currentFolderId: "root",
      selectedIds: new Set([folderItem.id]),
      selectedItems: [folderItem],
      totalItemCount: 1,
      isTrashView: false,
      isPendingOperation: false,
    };

    expect(registry.canExecute("cut", cutCtx)).toBe(true);
    await registry.execute("cut", cutCtx);

    expect(clipboard?.mode).toBe("cut");

    // Hedef klasöre paste
    const pasteCtx: CommandContext = {
      currentFolderId: "folder-proje-b",
      selectedIds: new Set(),
      selectedItems: [],
      totalItemCount: 5,
      isTrashView: false,
      isPendingOperation: false,
      clipboardState: clipboard,
    };

    expect(registry.canExecute("paste", pasteCtx)).toBe(true);
    await registry.execute("paste", pasteCtx);

    expect(movedItems).toEqual({
      ids: ["folder-sub-1"],
      target: "folder-proje-b",
    });
    expect(clipboard).toBeNull();
  });

  test("3. Pending (oluşturuluyor) öğeler panoya kopyalanamaz veya kesilemez", () => {
    const registry = new CommandRegistry();

    const pendingItem: CommandTargetItem = {
      id: "pending:temp-99",
      type: "folder",
      name: "Yeni Klasör",
      pending: true,
    };

    const ctx: CommandContext = {
      currentFolderId: "root",
      selectedIds: new Set([pendingItem.id]),
      selectedItems: [pendingItem],
      totalItemCount: 1,
      isTrashView: false,
      isPendingOperation: false,
    };

    expect(registry.canExecute("copy", ctx)).toBe(false);
    expect(registry.canExecute("cut", ctx)).toBe(false);
  });

  test("4. Çöp kutusuna (trash view) yapıştırma kesinlikle engellenir", () => {
    const registry = new CommandRegistry();

    const trashCtx: CommandContext = {
      currentFolderId: null,
      selectedIds: new Set(),
      selectedItems: [],
      totalItemCount: 2,
      isTrashView: true,
      isPendingOperation: false,
      clipboardState: {
        mode: "copy",
        items: [{ id: "file-1", type: "file", name: "proje.dwg" }],
      },
    };

    expect(registry.canExecute("paste", trashCtx)).toBe(false);
  });
});
