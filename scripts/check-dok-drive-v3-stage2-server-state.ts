// ============================================================================
// DÖKÜMANTASYON DRIVE V3.1 — AŞAMA 2 SERVER-STATE & NO-F5 DOĞRULAMA
// ============================================================================

import { QueryClient } from "@tanstack/react-query";
import { DokFile, DokFolder } from "../src/lib/dokumantasyon/types";
import {
  deriveExplorerView,
  reconcileSelection,
  DeriveExplorerOptions,
} from "../src/components/dokumantasyon/drive-v3/explorer-derive";
import {
  dokKeys,
  insertPendingFolderInCache,
  replacePendingFolderInCache,
  removePendingFolderFromCache,
  updateItemNameInCache,
  updateItemStarInCache,
  insertUploadedFileInCache,
  removeItemsFromCache,
  DokItemsResponse,
} from "../src/components/dokumantasyon/drive-v3/query-client";

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ [FAIL] ${message}`);
    process.exit(1);
  }
  console.log(`✓ [PASS] ${message}`);
}

async function runStage2Tests() {
  console.log("======================================================================");
  console.log("DÖKÜMANTASYON DRIVE V3.1 — AŞAMA 2 SERVER-STATE & NO-F5 TESTLERİ");
  console.log("======================================================================");

  const queryClient = new QueryClient();
  const folderId = "folder-root";
  const params = { sortBy: "name", order: "asc" };
  const queryKey = dokKeys.items(folderId, params);

  const initialData: DokItemsResponse = {
    folder: null,
    breadcrumbs: [{ id: null, name: "Kök Dizin" }],
    folders: [
      { id: "f-1", name: "Alpha", created_at: "2026-01-01T10:00:00Z" },
      { id: "f-3", name: "Gamma", created_at: "2026-01-03T10:00:00Z" },
    ],
    files: [
      { id: "file-1", display_name: "Mimari.dwg", extension: ".dwg", size_bytes: 1024, created_at: "2026-01-01T11:00:00Z" },
    ],
    summary: { totalFiles: 1, totalSizeBytes: 1024, starredCount: 0 },
  };

  queryClient.setQueryData(queryKey, initialData);

  // 1. Yeni Klasör Optimistic Insert & Sorting (NO unshift, NO F5)
  console.log("\n--- 1. Create Success & Deterministic Sort (No F5) ---");
  const tempId = "pending:uuid-beta";
  const pendingFolder: DokFolder = {
    id: tempId,
    name: "Beta",
    created_at: new Date().toISOString(),
  };

  insertPendingFolderInCache(queryClient, queryKey, pendingFolder);
  const cacheAfterInsert = queryClient.getQueryData<DokItemsResponse>(queryKey)!;
  assert(cacheAfterInsert.folders.length === 3, "Pending klasör raw cache'e eklendi");

  // View derive: Beta is alphabetically between Alpha and Gamma -> MUST BE at index 1!
  const defaultOptions: DeriveExplorerOptions = {
    sortBy: "name",
    sortOrder: "asc",
    groupBy: "none",
  };
  const view1 = deriveExplorerView(cacheAfterInsert, defaultOptions);
  assert(
    view1.displayedFolders[0].name === "Alpha" &&
    view1.displayedFolders[1].name === "Beta" &&
    view1.displayedFolders[2].name === "Gamma",
    "Yeni klasör 'Beta' unshift edilmedi; alfabetik sıralamadaki doğru yeri (Alpha, Beta, Gamma) aldı"
  );
  assert(view1.visibleOrderedIds[1] === tempId, "visibleOrderedIds listesinde pending folder doğru indekste");

  // Server confirms creation
  const serverFolder: DokFolder = {
    id: "f-2",
    name: "Beta",
    created_at: "2026-01-02T10:00:00Z",
  };
  replacePendingFolderInCache(queryClient, queryKey, tempId, serverFolder);
  const cacheAfterConfirm = queryClient.getQueryData<DokItemsResponse>(queryKey)!;
  const view2 = deriveExplorerView(cacheAfterConfirm, defaultOptions);
  assert(view2.displayedFolders[1].id === "f-2", "Server id (f-2) pending id yerine atomik geçti");
  assert(view2.visibleOrderedIds.includes("f-2") && !view2.visibleOrderedIds.includes(tempId), "visibleOrderedIds server ID ile güncellendi");

  // 2. Create Response Lost / 500 Error Rollback
  console.log("\n--- 2. Create Error & Clean Rollback ---");
  const failTempId = "pending:uuid-fail";
  insertPendingFolderInCache(queryClient, queryKey, { id: failTempId, name: "Zeta" });
  removePendingFolderFromCache(queryClient, queryKey, failTempId);
  const cacheAfterRollback = queryClient.getQueryData<DokItemsResponse>(queryKey)!;
  const viewRollback = deriveExplorerView(cacheAfterRollback, defaultOptions);
  assert(!viewRollback.visibleOrderedIds.includes(failTempId), "Hata alan oluşturma isteği cache'ten ve görünümden temizlendi");

  // 3. Optimistic Rename
  console.log("\n--- 3. Optimistic Rename ---");
  updateItemNameInCache(queryClient, queryKey, "f-2", "folder", "Beta Yenilendi");
  const cacheAfterRename = queryClient.getQueryData<DokItemsResponse>(queryKey)!;
  const viewRename = deriveExplorerView(cacheAfterRename, defaultOptions);
  assert(viewRename.displayedFolders.find((f) => f.id === "f-2")?.name === "Beta Yenilendi", "Klasör adı cache'te anında güncellendi");

  // 4. Rapid Star Toggle & Summary Count
  console.log("\n--- 4. Rapid Star Toggle & Summary Count ---");
  updateItemStarInCache(queryClient, queryKey, "file-1", "file", true);
  let cacheStar = queryClient.getQueryData<DokItemsResponse>(queryKey)!;
  assert(cacheStar.summary?.starredCount === 1, "Yıldızlı sayısı 1'e yükseldi");
  assert(!!cacheStar.files[0].starred_at, "Dosya starred_at zaman damgası aldı");

  updateItemStarInCache(queryClient, queryKey, "file-1", "file", false);
  cacheStar = queryClient.getQueryData<DokItemsResponse>(queryKey)!;
  assert(cacheStar.summary?.starredCount === 0, "Yıldızlı sayısı geri 0'a indi");
  assert(!cacheStar.files[0].starred_at, "Dosya starred_at temizlendi");

  // 5. Background Refresh Selection Preservation (CRITICAL)
  console.log("\n--- 5. Background Refresh Selection Preservation ---");
  const currentSelection = new Set(["f-1", "file-1"]);
  // Background refetch occurs: visible items: f-1, f-2, file-1
  const refreshedVisibleIds = ["f-1", "f-2", "file-1"];
  const preservedSelection = reconcileSelection(currentSelection, refreshedVisibleIds);
  assert(preservedSelection.size === 2, "Arka plan yenilemesinde seçim kaybolmadı (2/2)");
  assert(preservedSelection.has("f-1") && preservedSelection.has("file-1"), "Seçili öğeler f-1 ve file-1 korundu");

  // If item was removed on server, only that removed item is pruned
  const removedVisibleIds = ["f-1", "f-2"]; // file-1 was deleted by another session
  const reconciledSelection = reconcileSelection(currentSelection, removedVisibleIds);
  assert(reconciledSelection.size === 1 && reconciledSelection.has("f-1"), "Silinen öğe seçimden temizlendi, mevcut olan f-1 korundu");

  // 6. Upload Finalize Insert (No F5)
  console.log("\n--- 6. Upload Finalize Insert (No F5) ---");
  const newUploadedFile: DokFile = {
    id: "file-new-123",
    display_name: "StatikRapor.pdf",
    extension: ".pdf",
    size_bytes: 2048,
    created_at: new Date().toISOString(),
  };
  insertUploadedFileInCache(queryClient, queryKey, newUploadedFile);
  const cacheAfterUpload = queryClient.getQueryData<DokItemsResponse>(queryKey)!;
  const viewUpload = deriveExplorerView(cacheAfterUpload, defaultOptions);
  assert(viewUpload.visibleOrderedIds.includes("file-new-123"), "Yüklenen dosya F5 gerekmeden anında listede göründü");
  assert(cacheAfterUpload.summary?.totalFiles === 2, "Toplam dosya sayısı 2 oldu");

  // 7. Date & Name Sort Consistency with Pending Folder
  console.log("\n--- 7. Date vs Name Sort Consistency with Pending Folder ---");
  const dateDescOptions: DeriveExplorerOptions = {
    sortBy: "date",
    sortOrder: "desc",
    groupBy: "none",
  };
  const viewDate = deriveExplorerView(cacheAfterUpload, dateDescOptions);
  // Alpha (Jan 1), Beta (Jan 2), Gamma (Jan 3) -> Date desc: Gamma (f-3), Beta (f-2), Alpha (f-1)
  assert(
    viewDate.displayedFolders[0].id === "f-3" &&
    viewDate.displayedFolders[1].id === "f-2" &&
    viewDate.displayedFolders[2].id === "f-1",
    "Tarihe göre sıralamada comparator tutarlı davrandı (Gamma, Beta, Alpha)"
  );

  console.log("\n======================================================================");
  console.log("AŞAMA 2 SERVER-STATE & NO-F5 TESTLERİ BAŞARIYLA GEÇTİ!");
  console.log("======================================================================");
}

runStage2Tests().catch((err) => {
  console.error("Stage 2 test failure:", err);
  process.exit(1);
});
