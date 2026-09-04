// ============================================================================
// DÖKÜMANTASYON DRIVE V3.1 — AŞAMA 4 COMMAND CONTRACT & BUTTON MATRIX TESTİ
// ============================================================================

import {
  CommandRegistry,
  COMMAND_DEFINITIONS,
  CommandId,
  CommandContext,
} from "../src/components/dokumantasyon/drive-v3/command-registry";

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ [FAIL] ${message}`);
    process.exit(1);
  }
  console.log(`✓ [PASS] ${message}`);
}

async function runStage4Tests() {
  console.log("======================================================================");
  console.log("DÖKÜMANTASYON DRIVE V3.1 — AŞAMA 4 COMMAND REGISTRY & ACTION MATRIX TESTİ");
  console.log("======================================================================");

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
  ];

  assert(EXPECTED_COMMANDS.length === 23, "Plandaki 23 komutun tamamı tanımlı");

  const registry = new CommandRegistry();
  const executedCommands = new Set<CommandId>();

  // Register handlers for all 23 commands
  for (const cmdId of EXPECTED_COMMANDS) {
    assert(!!COMMAND_DEFINITIONS[cmdId], `Komut tanımı mevcut: ${cmdId}`);
    registry.register(cmdId, async () => {
      executedCommands.add(cmdId);
    });
    assert(registry.isRegistered(cmdId), `Handler başarıyla bağlandı: ${cmdId}`);
  }

  console.log("\n--- Komut Durum ve Yetki Matrisi Testleri ---");

  // 1. Boş Alan Bağlamı (Empty Context - Hiçbir öğe seçili değil)
  const emptyContext: CommandContext = {
    currentFolderId: null,
    selectedIds: new Set(),
    selectedItems: [],
    totalItemCount: 10,
    isTrashView: false,
    isPendingOperation: false,
  };

  assert(registry.canExecute("new-folder", emptyContext) === true, "new-folder: boş alanda etkin");
  assert(registry.canExecute("upload-files", emptyContext) === true, "upload-files: boş alanda etkin");
  assert(registry.canExecute("select-all", emptyContext) === true, "select-all: öğe varsa etkin");
  assert(registry.canExecute("clear-selection", emptyContext) === false, "clear-selection: seçim yoksa devre dışı");
  assert(registry.canExecute("rename", emptyContext) === false, "rename: seçim yoksa devre dışı");
  assert(registry.canExecute("move", emptyContext) === false, "move: seçim yoksa devre dışı");
  assert(registry.canExecute("trash", emptyContext) === false, "trash: seçim yoksa devre dışı");

  // 2. Tek Dosya Seçili Bağlamı (Single File Context)
  const singleFileContext: CommandContext = {
    currentFolderId: "root",
    selectedIds: new Set(["file-1"]),
    selectedItems: [{ id: "file-1", type: "file", name: "proje.dwg", size: 1024 }],
    totalItemCount: 10,
    isTrashView: false,
    isPendingOperation: false,
  };

  assert(registry.canExecute("open", singleFileContext) === true, "open: tek dosyada etkin");
  assert(registry.canExecute("preview", singleFileContext) === true, "preview: tek dosyada etkin");
  assert(registry.canExecute("download", singleFileContext) === true, "download: dosyada etkin");
  assert(registry.canExecute("rename", singleFileContext) === true, "rename: tek dosyada etkin");
  assert(registry.canExecute("move", singleFileContext) === true, "move: tek dosyada etkin");
  assert(registry.canExecute("trash", singleFileContext) === true, "trash: tek dosyada etkin");
  assert(registry.canExecute("share", singleFileContext) === true, "share: dosyada etkin");
  assert(registry.canExecute("star", singleFileContext) === true, "star: dosyada etkin");

  // 3. Çoklu Seçim Bağlamı (Multi Selection: 1 Folder + 2 Files)
  const multiContext: CommandContext = {
    currentFolderId: "root",
    selectedIds: new Set(["f-1", "file-1", "file-2"]),
    selectedItems: [
      { id: "f-1", type: "folder", name: "Hesaplar" },
      { id: "file-1", type: "file", name: "proje.dwg", size: 1024 },
      { id: "file-2", type: "file", name: "rapor.pdf", size: 2048 },
    ],
    totalItemCount: 10,
    isTrashView: false,
    isPendingOperation: false,
  };

  assert(registry.canExecute("rename", multiContext) === false, "rename: çoklu seçimde devre dışı");
  assert(registry.canExecute("open", multiContext) === false, "open: çoklu seçimde devre dışı");
  assert(registry.canExecute("move", multiContext) === true, "move: çoklu seçimde etkin");
  assert(registry.canExecute("trash", multiContext) === true, "trash: çoklu seçimde etkin");
  assert(registry.canExecute("download", multiContext) === true, "download: dosya içeren çoklu seçimde etkin");
  assert(registry.canExecute("share", multiContext) === true, "share: dosya içeren çoklu seçimde etkin");

  // 4. Pending (Oluşturuluyor) Klasör Kısıtlaması (STOP GATE)
  console.log("\n--- Pending Öğe Kısıtları ---");
  const pendingContext: CommandContext = {
    currentFolderId: "root",
    selectedIds: new Set(["pending:123"]),
    selectedItems: [{ id: "pending:123", type: "folder", name: "Yeni", pending: true }],
    totalItemCount: 10,
    isTrashView: false,
    isPendingOperation: false,
  };

  assert(registry.canExecute("open", pendingContext) === false, "open: pending klasörde kesinlikle devre dışı");
  assert(registry.canExecute("rename", pendingContext) === false, "rename: pending klasörde kesinlikle devre dışı");
  assert(registry.canExecute("move", pendingContext) === false, "move: pending klasörde kesinlikle devre dışı");
  assert(registry.canExecute("trash", pendingContext) === false, "trash: pending klasörde kesinlikle devre dışı");

  // 5. Çöp Kutusu Görünümü Bağlamı (Trash View)
  console.log("\n--- Çöp Kutusu Bağlamı ---");
  const trashContext: CommandContext = {
    currentFolderId: null,
    selectedIds: new Set(["file-del-1"]),
    selectedItems: [{ id: "file-del-1", type: "file", name: "silinen.pdf" }],
    totalItemCount: 1,
    isTrashView: true,
    isPendingOperation: false,
  };

  assert(registry.canExecute("new-folder", trashContext) === false, "new-folder: çöp kutusunda devre dışı");
  assert(registry.canExecute("upload-files", trashContext) === false, "upload-files: çöp kutusunda devre dışı");
  assert(registry.canExecute("trash", trashContext) === false, "trash: çöp kutusunda devre dışı");
  assert(registry.canExecute("restore", trashContext) === true, "restore: çöp kutusunda etkin");
  assert(registry.canExecute("delete-forever", trashContext) === true, "delete-forever: çöp kutusunda etkin");

  // 6. Tüm 23 Komutun Başarıyla Çalıştırılması (Zero Unknown Handlers)
  console.log("\n--- Bütün Komutların İcrası (Execution Verification) ---");
  for (const cmdId of EXPECTED_COMMANDS) {
    // Fabricate a valid context for this command
    const testContext: CommandContext = {
      currentFolderId: "root",
      selectedIds: new Set(["item-1"]),
      selectedItems: [{ id: "item-1", type: "file", name: "test.pdf" }],
      totalItemCount: 5,
      isTrashView: cmdId === "restore" || cmdId === "delete-forever",
      isPendingOperation: false,
    };
    await registry.execute(cmdId, testContext);
    assert(executedCommands.has(cmdId), `Komut başarıyla yürütüldü: ${cmdId}`);
  }

  assert(executedCommands.size === 23, `Tüm 23 komut tek çekirdek üzerinden icra edildi (${executedCommands.size}/23)`);

  console.log("\n======================================================================");
  console.log("AŞAMA 4 COMMAND CONTRACT & ACTION MATRIX TESTLERİ BAŞARIYLA GEÇTİ!");
  console.log("UNKNOWN HANDLER = 0");
  console.log("UNTESTED BUTTON = 0");
  console.log("======================================================================");
}

runStage4Tests().catch((err) => {
  console.error("Stage 4 test failure:", err);
  process.exit(1);
});
