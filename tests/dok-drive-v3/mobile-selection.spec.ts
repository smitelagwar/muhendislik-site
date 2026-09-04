// ============================================================================
// DÖKÜMANTASYON DRIVE V3.1 — MOBILE SELECTION & STALE CLOSURE SPEC
// ============================================================================

import { test, expect } from "@playwright/test";
import {
  createLongPressController,
  isSufficientTouchTarget,
  MOBILE_VIEWPORT_PRESETS,
} from "../../src/components/dokumantasyon/drive-v3/mobile-gesture-engine";

test.describe("Drive V3.1 — Mobile Gesture & Stale Closure Defense", () => {
  test("1. Normal tap (<500ms) seçim yokken open/navigate eylemini tetikler", async () => {
    let openedId: string | null = null;
    let selectedId: string | null = null;

    const controller = createLongPressController({
      id: "folder-1",
      delayMs: 500,
      moveThresholdPx: 8,
      onLongPressTrigger: (id) => {
        selectedId = id;
      },
      onSingleTap: (id) => {
        openedId = id;
      },
    });

    // Touch down
    controller.handlePointerDown({ clientX: 100, clientY: 100, pointerType: "touch" });
    expect(controller.getState()).toBe("pressing");

    // Touch up at 100ms (fast tap)
    await new Promise((r) => setTimeout(r, 100));
    controller.handlePointerUp();

    expect(controller.getState()).toBe("idle");
    expect(openedId).toBe("folder-1");
    expect(selectedId).toBeNull();
  });

  test("2. Long-press (~500ms) seçim modunu tetikler ve açma yapmaz", async () => {
    let openedId: string | null = null;
    let selectedId: string | null = null;

    const controller = createLongPressController({
      id: "file-1",
      delayMs: 150, // Test hızlandırması için 150ms
      moveThresholdPx: 8,
      onLongPressTrigger: (id) => {
        selectedId = id;
      },
      onSingleTap: (id) => {
        openedId = id;
      },
    });

    controller.handlePointerDown({ clientX: 100, clientY: 100, pointerType: "touch" });
    expect(controller.getState()).toBe("pressing");

    // Wait until long-press fires
    await new Promise((r) => setTimeout(r, 200));
    expect(controller.getState()).toBe("triggered");
    expect(selectedId).toBe("file-1");

    // Finger released after trigger
    controller.handlePointerUp();
    expect(controller.getState()).toBe("idle");
    expect(openedId).toBeNull(); // Dosya ASLA açılmamalı
  });

  test("3. Stale Closure Kalkanı: Item A önceden oluşturulmuş olsa bile, seçim modu aktifleştiğinde tap A'yı açmaz, seçimi toggle eder", async () => {
    // Simulating file-manager's mutable ref pattern:
    const selectedIdsRef = { current: new Set<string>() };
    const openedItems: string[] = [];
    const toggledItems: string[] = [];

    const handleSingleTap = (id: string) => {
      // file-manager.tsx içindeki en taze ref okuma mantığı
      if (selectedIdsRef.current.size > 0) {
        toggledItems.push(id);
        if (selectedIdsRef.current.has(id)) {
          selectedIdsRef.current.delete(id);
        } else {
          selectedIdsRef.current.add(id);
        }
      } else {
        openedItems.push(id);
      }
    };

    // Controller A oluşturuluyor (seçim boşken)
    const controllerA = createLongPressController({
      id: "item-A",
      delayMs: 150,
      onLongPressTrigger: (id) => {
        selectedIdsRef.current.add(id);
        toggledItems.push(id);
      },
      onSingleTap: handleSingleTap,
    });

    // Controller B oluşturuluyor
    const controllerB = createLongPressController({
      id: "item-B",
      delayMs: 150,
      onLongPressTrigger: (id) => {
        selectedIdsRef.current.add(id);
        toggledItems.push(id);
      },
      onSingleTap: handleSingleTap,
    });

    // 1. Kullanıcı item B'ye long press yapar -> selection mode aktifleşir
    controllerB.handlePointerDown({ clientX: 100, clientY: 200, pointerType: "touch" });
    await new Promise((r) => setTimeout(r, 200));
    controllerB.handlePointerUp();

    expect(selectedIdsRef.current.has("item-B")).toBe(true);
    expect(toggledItems).toContain("item-B");
    expect(openedItems.length).toBe(0);

    // 2. Kullanıcı şimdi item A'ya normal tap yapar
    controllerA.handlePointerDown({ clientX: 100, clientY: 100, pointerType: "touch" });
    await new Promise((r) => setTimeout(r, 50));
    controllerA.handlePointerUp();

    // KRİTİK DOĞRULAMA: item A AÇILMAMALI, çoklu seçime eklenmeli!
    expect(openedItems).not.toContain("item-A");
    expect(selectedIdsRef.current.has("item-A")).toBe(true);
    expect(selectedIdsRef.current.has("item-B")).toBe(true);
    expect(selectedIdsRef.current.size).toBe(2);

    // 3. Kullanıcı item A'ya bir kez daha tap yapar -> seçimden çıkmalı
    controllerA.handlePointerDown({ clientX: 100, clientY: 100, pointerType: "touch" });
    await new Promise((r) => setTimeout(r, 50));
    controllerA.handlePointerUp();

    expect(selectedIdsRef.current.has("item-A")).toBe(false);
    expect(selectedIdsRef.current.has("item-B")).toBe(true);
  });

  test("4. 8px üzerinde parmak hareketi (scroll) long-press'i iptal eder", async () => {
    let triggered = false;

    const controller = createLongPressController({
      id: "item-scroll",
      delayMs: 150,
      moveThresholdPx: 8,
      onLongPressTrigger: () => {
        triggered = true;
      },
      onSingleTap: () => {},
    });

    controller.handlePointerDown({ clientX: 100, clientY: 100, pointerType: "touch" });

    // 15px dikey kaydırma (kullanıcı sayfayı kaydırıyor)
    controller.handlePointerMove({ clientX: 100, clientY: 115 });
    expect(controller.getState()).toBe("cancelled");

    await new Promise((r) => setTimeout(r, 200));
    expect(triggered).toBe(false);
  });

  test("5. WCAG 2.5.5 touch target ve mobil presetleri doğrulanır", () => {
    expect(isSufficientTouchTarget(44, 44)).toBe(true);
    expect(isSufficientTouchTarget(48, 48)).toBe(true);
    expect(isSufficientTouchTarget(40, 44)).toBe(false);
    expect(isSufficientTouchTarget(44, 30)).toBe(false);

    expect(MOBILE_VIEWPORT_PRESETS.length).toBeGreaterThanOrEqual(7);
  });
});
