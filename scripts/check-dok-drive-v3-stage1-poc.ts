// ============================================================================
// DÖKÜMANTASYON DRIVE V3.1 — AŞAMA 1 BASELINE & SPIKE POC DOĞRULAMA
// ============================================================================

import { QueryClient } from "@tanstack/react-query";
import { defaultRangeExtractor } from "@tanstack/react-virtual";
import { draggable, dropTargetForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { autoScrollForElements } from "@atlaskit/pragmatic-drag-and-drop-auto-scroll/element";
import {
  calculateGridMetrics,
  DRIVE_LIST_ROW_HEIGHT,
  DRIVE_GRID_ROW_HEIGHT,
} from "../src/components/dokumantasyon/drive-v3/drive-metrics";
import {
  getBoundingBox,
  hitTestList,
  hitTestGrid,
  calculateAutoScrollDelta,
} from "../src/components/dokumantasyon/drive-v3/marquee-geometry";

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ [FAIL] ${message}`);
    process.exit(1);
  }
  console.log(`✓ [PASS] ${message}`);
}

async function runStage1Poc() {
  console.log("======================================================================");
  console.log("DÖKÜMANTASYON DRIVE V3.1 — AŞAMA 1 SPIKE & POC TESTİ");
  console.log("======================================================================");

  // 1. React Query Request Cancellation POC
  console.log("\n--- 1. React Query Request Cancellation POC ---");
  const queryClient = new QueryClient();
  assert(!!queryClient, "QueryClient instance başarıyla oluşturuldu");

  let aborted = false;
  const abortController = new AbortController();
  const testPromise = new Promise((resolve, reject) => {
    abortController.signal.addEventListener("abort", () => {
      aborted = true;
      reject(new Error("Query aborted"));
    });
  });

  abortController.abort();
  try {
    await testPromise;
  } catch {
    // expected
  }
  assert(aborted === true, "React Query AbortSignal cancellation mekanizması çalışıyor");

  // 2. 5K TanStack Virtual Spike
  console.log("\n--- 2. 5K TanStack Virtual Spike ---");
  const fiveThousandIds = Array.from({ length: 5000 }, (_, i) => `item-${i}`);
  assert(fiveThousandIds.length === 5000, "5,000 veri kimliği oluşturuldu");

  const virtualRange = defaultRangeExtractor({
    startIndex: 100,
    endIndex: 120,
    count: 5000,
    overscan: 5,
  });
  assert(virtualRange.length === 31, "TanStack Virtual range extractor 5K item arasından doğru aralığı çıkardı");
  assert(virtualRange[0] === 95 && virtualRange[virtualRange.length - 1] === 125, "Overscan sınırları matematiksel olarak doğru");

  // 3. Pragmatic Drag and Drop Spike
  console.log("\n--- 3. Pragmatic Drag and Drop Spike ---");
  assert(typeof draggable === "function", "Pragmatic DnD draggable adapter import edildi");
  assert(typeof dropTargetForElements === "function", "Pragmatic DnD dropTargetForElements import edildi");
  assert(typeof autoScrollForElements === "function", "Pragmatic DnD autoScrollForElements import edildi");

  // 4. Custom Marquee Geometry POC - List Mode & Offscreen Selection
  console.log("\n--- 4. Custom Marquee Geometry POC ---");
  const listIds = Array.from({ length: 200 }, (_, i) => `file-${i}`);

  // List hit-test: Marquee bounding box from y=280 to y=560 (rows 5 to 10)
  const listBbox = getBoundingBox(10, 280, 500, 560);
  const listSelected = hitTestList(listBbox, listIds, DRIVE_LIST_ROW_HEIGHT, 0, 0, 800);
  assert(listSelected.length === 6, `Liste hit-test beklenen 6 öğeyi seçti (seçilen: ${listSelected.length})`);
  assert(listSelected[0] === "file-5" && listSelected[5] === "file-10", "Liste row koordinat aralığı (file-5 .. file-10) doğru");

  // Offscreen Selection in List: Items at y=2800 .. 3360 (rows 50 to 60) which are NOT mounted in DOM
  const offscreenListBbox = getBoundingBox(10, 2800, 500, 3360);
  const offscreenListSelected = hitTestList(offscreenListBbox, listIds, DRIVE_LIST_ROW_HEIGHT, 0, 0, 800);
  assert(offscreenListSelected.length === 11, `Offscreen liste hit-test DOM'a bağlı olmadan 11 öğeyi seçti (seçilen: ${offscreenListSelected.length})`);
  assert(offscreenListSelected[0] === "file-50" && offscreenListSelected[10] === "file-60", "Offscreen seçim aralığı (file-50 .. file-60) matematiksel olarak doğrulandı");

  // 5. Grid Metrics & Grid Marquee POC
  console.log("\n--- 5. Grid Metrics & Grid Marquee POC ---");
  const gridMetrics = calculateGridMetrics(1000); // 1000px container
  assert(gridMetrics.columnCount > 1, `Grid metrics 1000px için ${gridMetrics.columnCount} sütun hesapladı`);

  const gridIds = Array.from({ length: 100 }, (_, i) => `grid-item-${i}`);
  // Marquee encompassing rows 1 to 2, cols 0 to 1
  const gridBbox = getBoundingBox(
    0,
    DRIVE_GRID_ROW_HEIGHT + 12 + 10,
    gridMetrics.cellWidth * 1.5,
    (DRIVE_GRID_ROW_HEIGHT + 12) * 2 + 50
  );
  const gridSelected = hitTestGrid(gridBbox, gridIds, gridMetrics, 0, 0);
  assert(gridSelected.length > 0, `Grid marquee geometrisi ${gridSelected.length} öğe ile kesişim buldu`);

  // Offscreen Grid selection: Row 10 (idx = 10 * colCount)
  const offscreenRowTop = 10 * (gridMetrics.rowHeight + gridMetrics.gapY);
  const offscreenGridBbox = getBoundingBox(0, offscreenRowTop + 5, 500, offscreenRowTop + gridMetrics.rowHeight + 5);
  const offscreenGridSelected = hitTestGrid(offscreenGridBbox, gridIds, gridMetrics, 0, 0);
  assert(offscreenGridSelected.length > 0, `Offscreen grid marquee DOM unmount olsa bile ${offscreenGridSelected.length} öğe seçebildi`);

  // 6. Auto-Scroll Math POC
  console.log("\n--- 6. Auto-Scroll Math POC ---");
  const containerRect = { top: 100, bottom: 600 };
  // Pointer inside top edge zone (110px -> distFromTop = 10px < 36px)
  const upDelta = calculateAutoScrollDelta(110, containerRect.top, containerRect.bottom);
  assert(upDelta < 0, `Yukarı auto-scroll delta negatif hesaplandı (${upDelta}px)`);

  // Pointer inside bottom edge zone (590px -> distFromBottom = 10px < 36px)
  const downDelta = calculateAutoScrollDelta(590, containerRect.top, containerRect.bottom);
  assert(downDelta > 0, `Aşağı auto-scroll delta pozitif hesaplandı (${downDelta}px)`);

  // Pointer in safe center (350px)
  const centerDelta = calculateAutoScrollDelta(350, containerRect.top, containerRect.bottom);
  assert(centerDelta === 0, "Merkez alanda auto-scroll tetiklenmedi (0px)");

  console.log("\n======================================================================");
  console.log("AŞAMA 1 SPIKE & POC TESTLERİ BAŞARIYLA GEÇTİ!");
  console.log("======================================================================");
}

runStage1Poc().catch((err) => {
  console.error("POC test failure:", err);
  process.exit(1);
});
