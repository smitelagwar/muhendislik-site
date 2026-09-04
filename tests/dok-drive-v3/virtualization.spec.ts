// ============================================================================
// DÖKÜMANTASYON DRIVE V3.1 — VIRTUALIZATION & DOM BUDGET TESTİ
// ============================================================================

import { test, expect } from "@playwright/test";
import {
  calculateVirtualWindow,
  calculateAnchorScrollTop,
} from "../../src/components/dokumantasyon/drive-v3/virtual-scroll";
import {
  calculateGridMetrics,
  DRIVE_LIST_ROW_HEIGHT,
  DRIVE_GRID_ROW_HEIGHT,
} from "../../src/components/dokumantasyon/drive-v3/drive-metrics";

test.describe("Drive V3.1 — Virtualization & DOM Budget", () => {
  test("1. 5000 item veri kümesinde sanal liste DOM budget < 250 tutar", () => {
    const itemCount = 5000;
    const containerHeight = 800;
    const windowResult = calculateVirtualWindow({
      itemCount,
      itemHeight: DRIVE_LIST_ROW_HEIGHT,
      scrollTop: 3000,
      containerHeight,
      overscan: 6,
    });

    // 800px / 56px ≈ 15 satır + 12 overscan = ~27 DOM düğümü
    expect(windowResult.virtualCount).toBeLessThan(250);
    expect(windowResult.totalHeight).toBe(itemCount * DRIVE_LIST_ROW_HEIGHT);
    expect(windowResult.startIndex).toBeGreaterThan(0);
    expect(windowResult.endIndex).toBeLessThanOrEqual(itemCount);
  });

  test("2. 5000 item veri kümesinde sanal grid DOM budget < 250 kart tutar", () => {
    const itemCount = 5000;
    const columnCount = 4;
    const rowCount = Math.ceil(itemCount / columnCount);
    const containerHeight = 800;

    const windowResult = calculateVirtualWindow({
      itemCount: rowCount,
      itemHeight: DRIVE_GRID_ROW_HEIGHT,
      scrollTop: 4800,
      containerHeight,
      overscan: 4,
    });

    const mountedCards = windowResult.virtualCount * columnCount;
    expect(mountedCards).toBeLessThan(250);
    expect(windowResult.totalHeight).toBe(rowCount * DRIVE_GRID_ROW_HEIGHT);
  });

  test("3. 10.000 extreme item ölçeğinde bile DOM budget katı bir şekilde < 250 kalır", () => {
    const extremeCount = 10000;
    const containerHeight = 900;

    const listResult = calculateVirtualWindow({
      itemCount: extremeCount,
      itemHeight: DRIVE_LIST_ROW_HEIGHT,
      scrollTop: 250000,
      containerHeight,
      overscan: 8,
    });

    expect(listResult.virtualCount).toBeLessThan(250);
    expect(listResult.totalHeight).toBe(extremeCount * DRIVE_LIST_ROW_HEIGHT);
  });

  test("4. Responsive resize sonrası anchor satır ve scroll pozisyonu korunur", () => {
    // 4 kolondan 3 kolona geçiş (örneğin 1440px -> 1024px)
    const oldMetrics = { columnCount: 4, rowHeight: DRIVE_GRID_ROW_HEIGHT };
    const newMetrics = { columnCount: 3, rowHeight: DRIVE_GRID_ROW_HEIGHT };
    const oldScrollTop = 800; // row index 5, first item = 20

    const newScrollTop = calculateAnchorScrollTop({
      oldScrollTop,
      oldMetrics,
      newMetrics,
    });

    // 16. öğe 3 kolonda 5. satırdadır -> 5 * 180 = 900 + 80 = 980px
    expect(newScrollTop).toBe(980);
  });
});
