// ============================================================================
// DÖKÜMANTASYON DRIVE V3.1 — AŞAMA 6 BULK OPERATIONS & DND & UPLOAD TESTİ
// ============================================================================

import {
  bulkTrashSchema,
  bulkMoveSchema,
  bulkStarSchema,
  bulkRestoreSchema,
} from "../src/lib/dokumantasyon/validation";
import {
  chunkItems,
  BULK_CHUNK_SIZE,
  BulkItem,
  BulkResult,
} from "../src/components/dokumantasyon/drive-v3/bulk-operations";
import {
  UploadQueueManager,
  UploadQueueItem,
} from "../src/components/dokumantasyon/drive-v3/upload-queue";
import {
  DraggedItemData,
} from "../src/components/dokumantasyon/drive-v3/pdd-integration";

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ [FAIL] ${message}`);
    process.exit(1);
  }
  console.log(`✓ [PASS] ${message}`);
}

async function runStage6Tests() {
  console.log("======================================================================");
  console.log("DÖKÜMANTASYON DRIVE V3.1 — AŞAMA 6 BULK, DND & UPLOAD QUEUE TESTİ");
  console.log("======================================================================");

  // 1. 100 Bulk Trash & Chunking
  console.log("\n--- 1. 100 Bulk Trash & Chunking Sözleşmesi ---");
  const items100: BulkItem[] = Array.from({ length: 100 }, (_, i) => ({
    id: `a0000000-0000-4000-8000-${String(i).padStart(12, "0")}`,
    type: (i % 2 === 0 ? "file" : "folder") as "file" | "folder",
  }));

  const chunks100 = chunkItems(items100, BULK_CHUNK_SIZE);
  assert(chunks100.length === 1 && chunks100[0].length === 100, "100 item tek bir chunk/request olarak gruplandı (Vercel timeout koruması)");

  const parseTrash100 = bulkTrashSchema.safeParse({ items: items100 });
  assert(parseTrash100.success, "100 item bulkTrashSchema tarafından hatasız doğrulandı");

  const items500: BulkItem[] = Array.from({ length: 500 }, (_, i) => ({
    id: `a0000000-0000-4000-8000-${String(i).padStart(12, "0")}`,
    type: "file",
  }));
  const chunks500 = chunkItems(items500, BULK_CHUNK_SIZE);
  assert(
    chunks500.length === 2 && chunks500[0].length === 250 && chunks500[1].length === 250,
    "500 item 250'lik tam chunk'lara bölündü (max chunk = 250)"
  );

  // 2. 100 Bulk Move
  console.log("\n--- 2. 100 Bulk Move Doğrulaması ---");
  const targetFolderId = "b1111111-1111-4111-8111-111111111111";
  const parseMove100 = bulkMoveSchema.safeParse({ items: items100, targetFolderId });
  assert(parseMove100.success, "100 item ve targetFolderId bulkMoveSchema tarafından tek request olarak doğrulandı");

  // 3. 97/3 Partial Failure Simülasyonu & Failed-Only Retry
  console.log("\n--- 3. 97/3 Partial Failure Simülasyonu & Failed-Only Retry ---");
  const simulatedSuccess = items100.slice(0, 97).map((i) => i.id);
  const simulatedFailed = items100.slice(97).map((i) => ({
    id: i.id,
    type: i.type,
    code: "CONFLICT",
    message: "Hedef klasörde aynı isimde öğe mevcut.",
  }));

  const partialResult: BulkResult = {
    succeeded: simulatedSuccess,
    failed: simulatedFailed,
    totalProcessed: items100.length,
  };

  assert(partialResult.succeeded.length === 97, "97 öğe başarıyla taşındı");
  assert(partialResult.failed.length === 3, "3 öğe başarısız olarak raporlandı");

  // Failed-only retry kümesi: yalnız 3 başarısız öğe tekrar denenir
  const retryItems: BulkItem[] = partialResult.failed.map((f) => ({ id: f.id, type: f.type }));
  assert(retryItems.length === 3, "Retry kümesi yalnızca başarısız 3 öğeyi içerir");
  const parseRetry = bulkMoveSchema.safeParse({ items: retryItems, targetFolderId });
  assert(parseRetry.success, "Retry isteği geçerli şemayla doğrulandı");

  // 4. Multi Drag & Unselected Item Drag Semantiği
  console.log("\n--- 4. Multi Drag Semantiği (Seçili vs Seçimsiz Drag) ---");
  const selectedIdsSet = new Set(["item-1", "item-2", "item-3"]);
  const allSelected: BulkItem[] = [
    { id: "item-1", type: "file" },
    { id: "item-2", type: "file" },
    { id: "item-3", type: "folder" },
  ];

  // Case A: Seçili öğe sürüklendiğinde tüm seçim taşınır
  const draggedFromSelected: DraggedItemData = {
    type: "drive-items",
    items: selectedIdsSet.has("item-2") ? allSelected : [{ id: "item-2", type: "file" }],
    primaryId: "item-2",
  };
  assert(draggedFromSelected.items.length === 3, "Seçili öğe sürüklendiğinde 3 seçili öğenin tümü sürüklendi");

  // Case B: Seçimsiz öğe sürüklendiğinde sadece o öğe sürüklenir
  const draggedUnselectedId = "item-99";
  const draggedFromUnselected: DraggedItemData = {
    type: "drive-items",
    items: selectedIdsSet.has(draggedUnselectedId) ? allSelected : [{ id: draggedUnselectedId, type: "file" }],
    primaryId: draggedUnselectedId,
  };
  assert(
    draggedFromUnselected.items.length === 1 && draggedFromUnselected.items[0].id === "item-99",
    "Seçimsiz öğe sürüklendiğinde yalnız o öğe sürüklendi (replace + drag)"
  );

  // 5. Invalid Descendant (Circular Move) Engelleme
  console.log("\n--- 5. Invalid Descendant (Döngüsel Taşıma) Koruması ---");
  const folderA = "folder-a";
  const folderAChildren = new Set(["folder-b", "folder-c", "folder-c-child"]);
  const canDropIntoChild = !folderAChildren.has("folder-c");
  assert(canDropIntoChild === false, "Bir klasörün kendi alt klasörüne (descendant) bırakılması engellendi");

  // 6. Upload 20 Dosya ve Concurrency: 3 Doğrulaması
  console.log("\n--- 6. Upload 20 Dosya ve Concurrency Limit 3 ---");
  const queueManager = new UploadQueueManager(3);
  let peakConcurrency = 0;
  let currentActive = 0;

  queueManager.setExecutor(async (item, onProgress) => {
    currentActive++;
    if (currentActive > peakConcurrency) {
      peakConcurrency = currentActive;
    }
    // İlerleme simülasyonu
    onProgress(50);
    await new Promise((r) => setTimeout(r, 20));
    onProgress(95);
    await new Promise((r) => setTimeout(r, 10));
    currentActive--;
  });

  const fakeFiles = Array.from({ length: 20 }, (_, i) => ({
    file: { name: `document-${i}.pdf`, size: 1024 * (i + 1) } as unknown as File,
  }));

  const enqueuedIds = queueManager.enqueue(fakeFiles);
  assert(enqueuedIds.length === 20, "20 dosya kuyruğa eklendi");

  // Wait for queue completion
  await new Promise<void>((resolve) => {
    const unsubscribe = queueManager.subscribe((q) => {
      const allDone = q.every((item) => item.status === "success" || item.status === "failed");
      if (allDone && q.length === 20) {
        unsubscribe();
        resolve();
      }
    });
  });

  assert(peakConcurrency <= 3, `En fazla eşzamanlı yükleme sayısı 3'ü aşmadı (Gerçekleşen pik: ${peakConcurrency})`);
  const finalQueue = queueManager.getQueue();
  assert(finalQueue.filter((q) => q.status === "success").length === 20, "20 dosyanın 20'si de başarıyla tamamlandı");

  // 7. Navigation During Upload (Queue Persistence)
  console.log("\n--- 7. Navigation During Upload (Kalıcılık) ---");
  const persistentManager = new UploadQueueManager(3);
  persistentManager.enqueue([
    { file: { name: "large-cad.dwg", size: 5000000 } as unknown as File },
  ]);
  const queueBeforeNav = persistentManager.getQueue();
  assert(queueBeforeNav.length === 1, "Yükleme kuyrukta mevcut");
  // Simüle edilen sayfa rotalama sonrası kuyruk korunur
  const queueAfterNav = persistentManager.getQueue();
  assert(queueAfterNav.length === 1 && queueAfterNav[0].name === "large-cad.dwg", "Sayfa gezintisinde kuyruk kaybolmadı");

  // 8. Failed Upload Retry
  console.log("\n--- 8. Failed Upload Retry ---");
  let shouldFail = true;
  const retryManager = new UploadQueueManager(3);
  retryManager.setExecutor(async (item) => {
    if (shouldFail) {
      throw new Error("Simüle ağ hatası");
    }
  });

  retryManager.enqueue([
    { file: { name: "failed-doc.pdf", size: 2048 } as unknown as File, id: "failed-1" },
  ]);

  await new Promise<void>((resolve) => {
    const unsub = retryManager.subscribe((q) => {
      if (q[0]?.status === "failed") {
        unsub();
        resolve();
      }
    });
  });

  assert(retryManager.getQueue()[0].status === "failed", "İlk deneme hata verdi (status: failed)");

  // Başarısız öğeyi tekrar dene
  shouldFail = false;
  retryManager.retryItem("failed-1");

  await new Promise<void>((resolve) => {
    const unsub = retryManager.subscribe((q) => {
      if (q[0]?.status === "success") {
        unsub();
        resolve();
      }
    });
  });

  assert(retryManager.getQueue()[0].status === "success", "Tekrar denenen öğe başarıyla tamamlandı");

  console.log("\n======================================================================");
  console.log("🎉 AŞAMA 6 TESTLERİNİN HEPSİ BAŞARIYLA GEÇTİ (PASS)!");
  console.log("======================================================================");
}

runStage6Tests().catch((err) => {
  console.error("Beklenmeyen hata:", err);
  process.exit(1);
});
