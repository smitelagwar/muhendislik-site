// ============================================================================
// DÖKÜMANTASYON DRIVE V3.1 — SCROLL RESTORATION & PERSISTENCE TESTİ
// ============================================================================

import { test, expect } from "@playwright/test";
import {
  getScrollPersistenceKey,
  saveScrollPosition,
  restoreScrollPosition,
  calculateAnchorScrollTop,
} from "../../src/components/dokumantasyon/drive-v3/virtual-scroll";

test.describe("Drive V3.1 — Scroll Restoration & Persistence", () => {
  test("1. Deterministik anahtar folder, filter ve viewMode'a göre tekildir", () => {
    const key1 = getScrollPersistenceKey("folder-1", "all", "list");
    const key2 = getScrollPersistenceKey("folder-1", "all", "grid");
    const key3 = getScrollPersistenceKey("folder-2", "all", "list");
    const key4 = getScrollPersistenceKey("folder-1", "recent", "list");

    expect(key1).not.toBe(key2);
    expect(key1).not.toBe(key3);
    expect(key1).not.toBe(key4);
    expect(key1).toBe("dok_scroll_folder-1_all_list");
  });

  test("2. Kaydedilen scroll pozisyonu doğru geri yüklenir", () => {
    const key = "dok_scroll_v3:test-folder:all:list";
    saveScrollPosition(key, 1540);

    const restored = restoreScrollPosition(key);
    expect(restored).toBe(1540);
  });

  test("3. Olmayan veya geçersiz anahtar için 0 döner", () => {
    const nonExistent = restoreScrollPosition("dok_scroll_v3:does-not-exist:all:list");
    expect(nonExistent).toBe(0);
  });

  test("4. Viewport daralmasında (4 col -> 2 col) ilk görünür öğe anchor satırında tutulur", () => {
    const oldMetrics = { columnCount: 4, rowHeight: 160 };
    const newMetrics = { columnCount: 2, rowHeight: 160 };
    // Satır 10 (1600px). 10 * 4 = 40. öğe ekranda ilk öğe.
    const oldScrollTop = 1600;

    const newScrollTop = calculateAnchorScrollTop({
      oldScrollTop,
      oldMetrics,
      newMetrics,
    });

    // 40. öğe 2 kolonda Math.floor(40 / 2) = 20. satırdadır. 20 * 160 = 3200px
    expect(newScrollTop).toBe(3200);
  });
});
