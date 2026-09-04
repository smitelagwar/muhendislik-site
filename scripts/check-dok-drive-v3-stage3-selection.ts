// ============================================================================
// DÖKÜMANTASYON DRIVE V3.1 — AŞAMA 3 SELECTION ENGINE & MARQUEE DOĞRULAMA
// ============================================================================

import {
  selectionReducer,
  INITIAL_SELECTION_STATE,
  DriveSelectionState,
} from "../src/components/dokumantasyon/drive-v3/selection-reducer";
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

async function runStage3Tests() {
  console.log("======================================================================");
  console.log("DÖKÜMANTASYON DRIVE V3.1 — AŞAMA 3 SELECTION ENGINE & MARQUEE TESTİ");
  console.log("======================================================================");

  const visible100 = Array.from({ length: 100 }, (_, i) => `item-${i}`);

  // 1. Normal Desktop Click
  console.log("\n--- 1. Normal Desktop Click ---");
  let state = selectionReducer(INITIAL_SELECTION_STATE, {
    type: "CLICK_ITEM",
    id: "item-5",
    isCtrl: false,
    isShift: false,
    visibleOrderedIds: visible100,
  });
  assert(state.selectedIds.size === 1 && state.selectedIds.has("item-5"), "Tek click sadece o öğeyi seçti");
  assert(state.anchorId === "item-5", "Anchor item-5 oldu");
  assert(state.focusedId === "item-5", "Focus item-5 oldu");

  // 2. Ctrl/Cmd + Click (Additive Toggle)
  console.log("\n--- 2. Ctrl/Cmd + Click (Additive Toggle) ---");
  state = selectionReducer(state, {
    type: "CLICK_ITEM",
    id: "item-10",
    isCtrl: true,
    isShift: false,
    visibleOrderedIds: visible100,
  });
  assert(state.selectedIds.size === 2 && state.selectedIds.has("item-5") && state.selectedIds.has("item-10"), "Ctrl+click yeni öğeyi ekledi (2 öğe)");

  state = selectionReducer(state, {
    type: "CLICK_ITEM",
    id: "item-5",
    isCtrl: true,
    isShift: false,
    visibleOrderedIds: visible100,
  });
  assert(state.selectedIds.size === 1 && !state.selectedIds.has("item-5") && state.selectedIds.has("item-10"), "Ctrl+click seçili öğeyi toggle ederek kaldırdı");

  // 3. Shift + Click Range Selection
  console.log("\n--- 3. Shift + Click Range Selection ---");
  // Set anchor at item-2
  state = selectionReducer(state, {
    type: "CLICK_ITEM",
    id: "item-2",
    isCtrl: false,
    isShift: false,
    visibleOrderedIds: visible100,
  });
  // Shift click item-6 -> items 2, 3, 4, 5, 6 (5 items)
  state = selectionReducer(state, {
    type: "CLICK_ITEM",
    id: "item-6",
    isCtrl: false,
    isShift: true,
    visibleOrderedIds: visible100,
  });
  assert(state.selectedIds.size === 5, "Shift click 2'den 6'ya 5 öğelik range seçti");
  assert(
    state.selectedIds.has("item-2") &&
    state.selectedIds.has("item-3") &&
    state.selectedIds.has("item-4") &&
    state.selectedIds.has("item-5") &&
    state.selectedIds.has("item-6"),
    "Range aralığındaki tüm öğeler seçildi"
  );
  assert(state.anchorId === "item-2", "Anchor item-2 olarak korundu");
  assert(state.focusedId === "item-6", "Focus item-6'ya ilerledi");

  // 4. Grid Shift Selection Semantics (Row-Major Linear, NOT Bounding Box)
  console.log("\n--- 4. Grid Shift Selection (Row-Major Linear) ---");
  // In Grid, anchor is item-3, Shift-click item-10:
  // Must select 3, 4, 5, 6, 7, 8, 9, 10
  state = selectionReducer(state, {
    type: "CLICK_ITEM",
    id: "item-3",
    isCtrl: false,
    isShift: false,
    visibleOrderedIds: visible100,
  });
  state = selectionReducer(state, {
    type: "CLICK_ITEM",
    id: "item-10",
    isCtrl: false,
    isShift: true,
    visibleOrderedIds: visible100,
  });
  assert(state.selectedIds.size === 8, "Grid Shift-click 3..10 arasında row-major 8 öğe seçti");
  for (let i = 3; i <= 10; i++) {
    assert(state.selectedIds.has(`item-${i}`), `item-${i} seçildi`);
  }

  // 5. Filtered Range Pruning (Hidden items are NEVER selected)
  console.log("\n--- 5. Filtered Range Pruning ---");
  // Say item-4 and item-5 were filtered out by search/extension filter
  const filteredUniverse = ["item-1", "item-2", "item-3", "item-6", "item-7"];
  state = selectionReducer(INITIAL_SELECTION_STATE, {
    type: "CLICK_ITEM",
    id: "item-2",
    isCtrl: false,
    isShift: false,
    visibleOrderedIds: filteredUniverse,
  });
  state = selectionReducer(state, {
    type: "CLICK_ITEM",
    id: "item-7",
    isCtrl: false,
    isShift: true,
    visibleOrderedIds: filteredUniverse,
  });
  assert(!state.selectedIds.has("item-4") && !state.selectedIds.has("item-5"), "Filtreyle gizlenmiş öğeler (item-4, item-5) Shift seçiminde ASLA seçilmedi");
  assert(state.selectedIds.size === 4, "Yalnızca görünür evrendeki 4 öğe seçildi (item-2, 3, 6, 7)");

  // 6. Right-Click Semantics (Preserve Multi-Selection vs Replace Single)
  console.log("\n--- 6. Right-Click Semantics ---");
  // Current selection: items [item-2, item-3, item-6, item-7]
  state = selectionReducer(state, {
    type: "RIGHT_CLICK_ITEM",
    id: "item-3", // Already selected
  });
  assert(state.selectedIds.size === 4, "Seçili öğeye sağ tıklandığında çoklu seçim korundu");
  assert(state.focusedId === "item-3", "Focus sağ tıklanan öğeye geçti");

  state = selectionReducer(state, {
    type: "RIGHT_CLICK_ITEM",
    id: "item-1", // Unselected
  });
  assert(state.selectedIds.size === 1 && state.selectedIds.has("item-1"), "Seçili olmayan öğeye sağ tıklandığında seçim temizlenip yalnız o öğe seçildi");

  // 7. Keyboard Navigation (100 items)
  console.log("\n--- 7. Keyboard Navigation ---");
  // Start at item-0
  state = selectionReducer(INITIAL_SELECTION_STATE, {
    type: "CLICK_ITEM",
    id: "item-0",
    isCtrl: false,
    isShift: false,
    visibleOrderedIds: visible100,
  });
  // ArrowDown in list (col = 1)
  state = selectionReducer(state, {
    type: "KEYBOARD_NAV",
    key: "ArrowDown",
    isShift: false,
    isCtrl: false,
    visibleOrderedIds: visible100,
    columnCount: 1,
  });
  assert(state.focusedId === "item-1" && state.selectedIds.has("item-1"), "ArrowDown focus ve seçimi item-1'e ilerletti");

  // Shift + ArrowDown (range expansion)
  state = selectionReducer(state, {
    type: "KEYBOARD_NAV",
    key: "ArrowDown",
    isShift: true,
    isCtrl: false,
    visibleOrderedIds: visible100,
    columnCount: 1,
  });
  assert(state.selectedIds.size === 2 && state.selectedIds.has("item-1") && state.selectedIds.has("item-2"), "Shift+ArrowDown range'i item-2'ye genişletti");

  // Ctrl + A (Select All 100)
  state = selectionReducer(state, {
    type: "SELECT_ALL",
    visibleOrderedIds: visible100,
  });
  assert(state.selectedIds.size === 100, "Ctrl+A tüm 100 öğeyi seçti");

  // 8. Virtual Marquee Offscreen Selection (CRITICAL STOP GATE)
  console.log("\n--- 8. Virtual Marquee Offscreen Selection (STOP GATE) ---");
  // Marquee dragged from row 10 to row 70 (y = 560 to 3920)
  // These items are far below viewport and UNMOUNTED from DOM!
  const listBbox = getBoundingBox(0, 560, 800, 3920);
  const marqueeHitIds = hitTestList(listBbox, visible100, DRIVE_LIST_ROW_HEIGHT, 0, 0, 800);
  assert(marqueeHitIds.length === 61, `Offscreen sanal marquee DOM olmadan 61 öğe seçti (seçilen: ${marqueeHitIds.length})`);
  assert(marqueeHitIds[0] === "item-10" && marqueeHitIds[60] === "item-70", "Offscreen seçim sınırları item-10 .. item-70 olarak doğrulandı");

  // Marquee update in state machine
  state = selectionReducer(INITIAL_SELECTION_STATE, {
    type: "MARQUEE_UPDATE",
    hitIds: marqueeHitIds,
    isAdditive: false,
    initialSelection: new Set(),
  });
  assert(state.selectedIds.size === 61, "Sanal marquee seçimi state machine'e atomik yazıldı");

  // Additive Marquee (Ctrl held during drag)
  const additiveHits = ["item-80", "item-81"];
  state = selectionReducer(state, {
    type: "MARQUEE_UPDATE",
    hitIds: additiveHits,
    isAdditive: true,
    initialSelection: state.selectedIds,
  });
  assert(state.selectedIds.size === 63 && state.selectedIds.has("item-80"), "Ctrl ile marquee sürükleme mevcut seçime eklendi (63 öğe)");

  // 9. Auto-scroll Delta Edge Zone Verification
  console.log("\n--- 9. Auto-Scroll Delta Edge Zone Verification ---");
  const viewportRect = { top: 0, bottom: 500 };
  const topEdgeDelta = calculateAutoScrollDelta(10, viewportRect.top, viewportRect.bottom);
  assert(topEdgeDelta < 0, `Üst kenarda auto-scroll yukarı (${topEdgeDelta}px)`);

  const bottomEdgeDelta = calculateAutoScrollDelta(490, viewportRect.top, viewportRect.bottom);
  assert(bottomEdgeDelta > 0, `Alt kenarda auto-scroll aşağı (${bottomEdgeDelta}px)`);

  console.log("\n======================================================================");
  console.log("AŞAMA 3 SELECTION ENGINE & MARQUEE TESTLERİ BAŞARIYLA GEÇTİ!");
  console.log("======================================================================");
}

runStage3Tests().catch((err) => {
  console.error("Stage 3 test failure:", err);
  process.exit(1);
});
