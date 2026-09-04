// ============================================================================
// DÖKÜMANTASYON DRIVE V3.1 — COMMAND CONTRACT & ACTION MATRIX SPEC
// ============================================================================

import { test, expect } from "@playwright/test";
import {
  CommandRegistry,
  COMMAND_DEFINITIONS,
  CommandId,
  CommandContext,
} from "../../src/components/dokumantasyon/drive-v3/command-registry";

test.describe("Drive V3.1 — Command Contract & Action Matrix", () => {
  const EXPECTED_COMMANDS: CommandId[] = [
    "new-folder",
    "upload-files",
    "upload-folder",
    "open",
    "preview",
    "download",
    "rename",
    "move",
    "trash",
    "restore",
    "delete-forever",
    "star",
    "unstar",
    "share",
    "details",
    "search",
    "select-all",
    "clear-selection",
    "refresh",
    "change-view",
    "change-sort",
    "open-trash",
    "open-active-shares",
    "copy",
    "cut",
    "paste",
  ];

  test("1. Tüm 26 komutun tanımı eksiksiz mevcuttur", () => {
    expect(EXPECTED_COMMANDS.length).toBe(26);
    for (const cmdId of EXPECTED_COMMANDS) {
      expect(COMMAND_DEFINITIONS[cmdId]).toBeDefined();
      expect(COMMAND_DEFINITIONS[cmdId].id).toBe(cmdId);
      expect(COMMAND_DEFINITIONS[cmdId].label).toBeTruthy();
    }
  });

  test("2. Boş alan bağlamında (hiçbir öğe seçili değil) canExecute kuralları geçerlidir", () => {
    const registry = new CommandRegistry();
    const emptyContext: CommandContext = {
      currentFolderId: null,
      selectedIds: new Set(),
      selectedItems: [],
      totalItemCount: 10,
      isTrashView: false,
      isPendingOperation: false,
    };

    expect(registry.canExecute("new-folder", emptyContext)).toBe(true);
    expect(registry.canExecute("upload-files", emptyContext)).toBe(true);
    expect(registry.canExecute("select-all", emptyContext)).toBe(true);
    expect(registry.canExecute("clear-selection", emptyContext)).toBe(false);
    expect(registry.canExecute("rename", emptyContext)).toBe(false);
    expect(registry.canExecute("move", emptyContext)).toBe(false);
    expect(registry.canExecute("trash", emptyContext)).toBe(false);
    expect(registry.canExecute("copy", emptyContext)).toBe(false);
    expect(registry.canExecute("cut", emptyContext)).toBe(false);
    expect(registry.canExecute("paste", emptyContext)).toBe(false);
  });

  test("3. Tekil ve çoklu seçimde canExecute izinleri ve kısıtları", () => {
    const registry = new CommandRegistry();

    // Single item
    const singleContext: CommandContext = {
      currentFolderId: "root",
      selectedIds: new Set(["f1"]),
      selectedItems: [{ id: "f1", type: "file", name: "proje.dwg" }],
      totalItemCount: 10,
      isTrashView: false,
      isPendingOperation: false,
    };

    expect(registry.canExecute("rename", singleContext)).toBe(true);
    expect(registry.canExecute("open", singleContext)).toBe(true);
    expect(registry.canExecute("copy", singleContext)).toBe(true);
    expect(registry.canExecute("cut", singleContext)).toBe(true);
    expect(registry.canExecute("trash", singleContext)).toBe(true);

    // Multi item
    const multiContext: CommandContext = {
      currentFolderId: "root",
      selectedIds: new Set(["f1", "f2"]),
      selectedItems: [
        { id: "f1", type: "file", name: "p1.dwg" },
        { id: "f2", type: "folder", name: "Klasör" },
      ],
      totalItemCount: 10,
      isTrashView: false,
      isPendingOperation: false,
    };

    expect(registry.canExecute("rename", multiContext)).toBe(false);
    expect(registry.canExecute("open", multiContext)).toBe(false);
    expect(registry.canExecute("move", multiContext)).toBe(true);
    expect(registry.canExecute("trash", multiContext)).toBe(true);
    expect(registry.canExecute("copy", multiContext)).toBe(true);
    expect(registry.canExecute("cut", multiContext)).toBe(true);
  });

  test("4. Pending öğelerde open, rename, move, trash, copy, cut kesinlikle engellenir", () => {
    const registry = new CommandRegistry();
    const pendingContext: CommandContext = {
      currentFolderId: "root",
      selectedIds: new Set(["pending:123"]),
      selectedItems: [{ id: "pending:123", type: "folder", name: "Oluşturuluyor...", pending: true }],
      totalItemCount: 10,
      isTrashView: false,
      isPendingOperation: false,
    };

    expect(registry.canExecute("open", pendingContext)).toBe(false);
    expect(registry.canExecute("rename", pendingContext)).toBe(false);
    expect(registry.canExecute("move", pendingContext)).toBe(false);
    expect(registry.canExecute("trash", pendingContext)).toBe(false);
    expect(registry.canExecute("copy", pendingContext)).toBe(false);
    expect(registry.canExecute("cut", pendingContext)).toBe(false);
  });

  test("5. Çöp kutusu görünümünde mutasyon kuralları", () => {
    const registry = new CommandRegistry();
    const trashContext: CommandContext = {
      currentFolderId: null,
      selectedIds: new Set(["f-del-1"]),
      selectedItems: [{ id: "f-del-1", type: "file", name: "eski.pdf" }],
      totalItemCount: 1,
      isTrashView: true,
      isPendingOperation: false,
    };

    expect(registry.canExecute("new-folder", trashContext)).toBe(false);
    expect(registry.canExecute("upload-files", trashContext)).toBe(false);
    expect(registry.canExecute("trash", trashContext)).toBe(false);
    expect(registry.canExecute("copy", trashContext)).toBe(false);
    expect(registry.canExecute("cut", trashContext)).toBe(false);
    expect(registry.canExecute("restore", trashContext)).toBe(true);
    expect(registry.canExecute("delete-forever", trashContext)).toBe(true);
  });

  test("6. Tüm komutlar başarıyla execute edilir ve cleanup unregister eder", async () => {
    const registry = new CommandRegistry();
    const executed = new Set<string>();

    const unregisters = EXPECTED_COMMANDS.map((id) =>
      registry.register(id, async () => {
        executed.add(id);
      })
    );

    for (const cmdId of EXPECTED_COMMANDS) {
      const ctx: CommandContext = {
        currentFolderId: "root",
        selectedIds: new Set(["i1"]),
        selectedItems: [{ id: "i1", type: "file", name: "test.pdf" }],
        totalItemCount: 5,
        isTrashView: cmdId === "restore" || cmdId === "delete-forever",
        isPendingOperation: false,
        clipboardState: cmdId === "paste" ? { mode: "copy", items: [{ id: "i1", type: "file", name: "test.pdf" }] } : undefined,
      };
      await registry.execute(cmdId, ctx);
      expect(executed.has(cmdId)).toBe(true);
    }

    expect(executed.size).toBe(26);

    // Test cleanup
    unregisters[0]();
    expect(registry.isRegistered(EXPECTED_COMMANDS[0])).toBe(false);
  });
});
