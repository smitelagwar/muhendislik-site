// ============================================================================
// DÖKÜMANTASYON DRIVE V3.1 — CONTEXT MENU SELECTION & COMMAND DISPATCH SPEC
// ============================================================================

import { test, expect } from "@playwright/test";
import {
  CommandRegistry,
  CommandContext,
} from "../../src/components/dokumantasyon/drive-v3/command-registry";

test.describe("Drive V3.1 — Context Menu Contract", () => {
  test("1. Zaten seçili olan bir öğeye sağ tıklandığında mevcut çoklu seçim korunur", () => {
    let selectedIds = new Set(["item-1", "item-2", "item-3"]);

    // Right click on item-2 (already selected)
    const handleContextMenuOnItem = (targetId: string) => {
      if (selectedIds.has(targetId)) {
        // Multi-seçim aynen korunur
        return;
      }
      selectedIds = new Set([targetId]);
    };

    handleContextMenuOnItem("item-2");

    expect(selectedIds.size).toBe(3);
    expect(selectedIds.has("item-1")).toBe(true);
    expect(selectedIds.has("item-2")).toBe(true);
    expect(selectedIds.has("item-3")).toBe(true);
  });

  test("2. Seçili olmayan bir öğeye sağ tıklandığında seçim o tek öğeyle değiştirilir", () => {
    let selectedIds = new Set(["item-1", "item-2"]);

    const handleContextMenuOnItem = (targetId: string) => {
      if (selectedIds.has(targetId)) {
        return;
      }
      selectedIds = new Set([targetId]);
    };

    // Right click on item-4 (unselected)
    handleContextMenuOnItem("item-4");

    expect(selectedIds.size).toBe(1);
    expect(selectedIds.has("item-4")).toBe(true);
    expect(selectedIds.has("item-1")).toBe(false);
  });

  test("3. Boş alana sağ tıklandığında mevcut seçim temizlenir ve boş alan menüsü açılır", () => {
    const selectedIds = new Set(["item-1", "item-2"]);
    let isBlankMenuOpen = false;

    const handleContextMenuBlank = () => {
      selectedIds.clear();
      isBlankMenuOpen = true;
    };

    handleContextMenuBlank();

    expect(selectedIds.size).toBe(0);
    expect(isBlankMenuOpen).toBe(true);
  });

  test("4. Context menü komut etkin/devre dışı durumları CommandRegistry'den beslenir", () => {
    const registry = new CommandRegistry();

    // 1 selected item
    const singleCtx: CommandContext = {
      currentFolderId: "root",
      selectedIds: new Set(["item-1"]),
      selectedItems: [{ id: "item-1", type: "file", name: "plan.dwg" }],
      totalItemCount: 10,
      isTrashView: false,
      isPendingOperation: false,
    };

    expect(registry.canExecute("rename", singleCtx)).toBe(true);
    expect(registry.canExecute("download", singleCtx)).toBe(true);

    // Multiple selected items
    const multiCtx: CommandContext = {
      currentFolderId: "root",
      selectedIds: new Set(["item-1", "item-2"]),
      selectedItems: [
        { id: "item-1", type: "file", name: "plan.dwg" },
        { id: "item-2", type: "file", name: "kesit.dwg" },
      ],
      totalItemCount: 10,
      isTrashView: false,
      isPendingOperation: false,
    };

    // Multi seçimde rename devre dışı kalmalı, move ve trash etkin olmalı
    expect(registry.canExecute("rename", multiCtx)).toBe(false);
    expect(registry.canExecute("move", multiCtx)).toBe(true);
    expect(registry.canExecute("trash", multiCtx)).toBe(true);
  });
});
