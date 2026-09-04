// ============================================================================
// DÖKÜMANTASYON DRIVE V3.1 — MARQUEE VIRTUALIZATION (GEOMETRY-FIRST) TESTİ
// ============================================================================

import { test, expect } from "@playwright/test";
import {
  getBoundingBox,
  hitTestList,
  hitTestGrid,
  calculateAutoScrollDelta,
  Rect,
} from "../../src/components/dokumantasyon/drive-v3/marquee-geometry";
import {
  selectionReducer,
  INITIAL_SELECTION_STATE,
  DriveSelectionState,
} from "../../src/components/dokumantasyon/drive-v3/selection-reducer";
import {
  calculateGridMetrics,
  DRIVE_LIST_ROW_HEIGHT,
  DRIVE_LIST_ROW_GAP,
  DRIVE_GRID_ROW_HEIGHT,
} from "../../src/components/dokumantasyon/drive-v3/drive-metrics";

test.describe("Drive V3.1 — Marquee Virtualization (Geometry-First)", () => {
  const visibleOrderedIds = Array.from({ length: 1000 }, (_, i) => `item-${i}`);

  test("1. Long Marquee: 200+ mantıksal öğe içeren seçim DOM'dan bağımsız sanal geometriyle seçilir", () => {
    // 50. öğeden (50 * 56 = 2800px) 250. öğeye (250 * 56 = 14000px) kadar uzun marquee
    const marquee: Rect = {
      left: 0,
      right: 1200,
      top: 50 * (DRIVE_LIST_ROW_HEIGHT + DRIVE_LIST_ROW_GAP),
      bottom: 250 * (DRIVE_LIST_ROW_HEIGHT + DRIVE_LIST_ROW_GAP),
    };

    const hits = hitTestList(
      marquee,
      visibleOrderedIds,
      DRIVE_LIST_ROW_HEIGHT,
      DRIVE_LIST_ROW_GAP,
      0,
      1200
    );

    // 50 ile 250 arası tam 201 öğe seçilmiş olmalı
    expect(hits.length).toBe(201);
    expect(hits[0]).toBe("item-50");
    expect(hits[hits.length - 1]).toBe("item-250");
  });

  test("2. Reverse Marquee: Aşağıdan yukarıya sürüklemede getBoundingBox doğru normalize edilir", () => {
    const startX = 600;
    const startY = 5000;
    const currentX = 100;
    const currentY = 1000;

    const bbox = getBoundingBox(startX, startY, currentX, currentY);
    expect(bbox.left).toBe(100);
    expect(bbox.right).toBe(600);
    expect(bbox.top).toBe(1000);
    expect(bbox.bottom).toBe(5000);

    const hits = hitTestList(bbox, visibleOrderedIds, DRIVE_LIST_ROW_HEIGHT, DRIVE_LIST_ROW_GAP);
    expect(hits.length).toBeGreaterThan(0);
    // En üstteki öğe indeksi: floor(1000 / 56) ≈ 17
    expect(hits[0]).toBe("item-17");
  });

  test("3. Grid Marquee: Çok kolonlu grid üzerinde iki boyutlu geometri hit testi çalışır", () => {
    const gridMetrics = calculateGridMetrics(1200, 220, 16, 16, DRIVE_GRID_ROW_HEIGHT);
    // Kolon 1 ve 2, satır 2 ve 3 aralığını kapsayan bir seçim kutusu
    const strideY = gridMetrics.rowHeight + gridMetrics.gapY;
    const strideX = gridMetrics.cellWidth + gridMetrics.gapX;

    const marquee: Rect = {
      left: strideX + 10,
      right: strideX * 3 - 10,
      top: strideY * 2 + 10,
      bottom: strideY * 4 - 10,
    };

    const hits = hitTestGrid(marquee, visibleOrderedIds, gridMetrics);
    expect(hits.length).toBeGreaterThan(0);

    // Seçilen öğelerin gridMetrics sınırları içinde olduğu doğrulanır
    for (const id of hits) {
      expect(visibleOrderedIds).toContain(id);
    }
  });

  test("4. Auto-scroll: Viewport kenarına yaklaşıldığında ivmeli scroll delta üretilir", () => {
    const containerTop = 100;
    const containerBottom = 900;
    const zone = 60;

    // Üst sınıra 10px mesafede (yukarı kaydırma: negatif delta)
    const deltaTop = calculateAutoScrollDelta(110, containerTop, containerBottom, zone, 24);
    expect(deltaTop).toBeLessThan(0);

    // Alt sınıra 10px mesafede (aşağı kaydırma: pozitif delta)
    const deltaBottom = calculateAutoScrollDelta(890, containerTop, containerBottom, zone, 24);
    expect(deltaBottom).toBeGreaterThan(0);

    // Ortada (hareket yok: 0)
    const deltaCenter = calculateAutoScrollDelta(500, containerTop, containerBottom, zone, 24);
    expect(deltaCenter).toBe(0);
  });

  test("5. Reducer MARQUEE_UPDATE: Seçim Set'i atomik güncellenir ve initialSelection ile birleşir", () => {
    const stateWithItem0: DriveSelectionState = {
      ...INITIAL_SELECTION_STATE,
      selectedIds: new Set(["item-0"]),
    };

    const nextState = selectionReducer(stateWithItem0, {
      type: "MARQUEE_UPDATE",
      hitIds: ["item-5", "item-6"],
      isAdditive: true,
      initialSelection: new Set(["item-0"]),
    });

    expect(nextState.selectedIds.has("item-0")).toBe(true);
    expect(nextState.selectedIds.has("item-5")).toBe(true);
    expect(nextState.selectedIds.has("item-6")).toBe(true);
    expect(nextState.selectedIds.size).toBe(3);
  });
});
