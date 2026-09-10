// ============================================================================
// DÖKÜMANTASYON DRIVE V3.1 — MOBILE POINTERUP + CLICK DEDUPE TESTİ
// ============================================================================

import { test, expect } from "@playwright/test";
import { createLongPressController } from "../../src/components/dokumantasyon/drive-v3/mobile-gesture-engine";
import {
  armSyntheticClickSuppression,
  clearSyntheticClickSuppressions,
  consumeSyntheticClickSuppression,
} from "../../src/components/dokumantasyon/drive-v3/mobile-click-suppression";

test.describe("Drive V3.1 — Mobile synthetic click dedupe", () => {
  test.beforeEach(() => {
    clearSyntheticClickSuppressions();
  });

  test("1. Bir suppression token yalnız bir click tüketir", () => {
    armSyntheticClickSuppression("item-1", 1_000, 1_000);

    expect(consumeSyntheticClickSuppression("item-1", 1_500)).toBe(true);
    expect(consumeSyntheticClickSuppression("item-1", 1_500)).toBe(false);
  });

  test("2. Token yalnız kendi item id'sini bastırır ve TTL sonrası geçersizdir", () => {
    armSyntheticClickSuppression("item-A", 1_000, 250);

    expect(consumeSyntheticClickSuppression("item-B", 1_100)).toBe(false);
    expect(consumeSyntheticClickSuppression("item-A", 1_251)).toBe(false);
  });

  test("3. Hızlı touch tap tekil aksiyonu bir kez çalıştırır ve sonraki click'i bastırır", () => {
    let tapCount = 0;
    let longPressCount = 0;

    const controller = createLongPressController({
      id: "fast-touch-item",
      delayMs: 500,
      moveThresholdPx: 8,
      onLongPressTrigger: () => {
        longPressCount += 1;
      },
      onSingleTap: () => {
        tapCount += 1;
      },
    });

    controller.handlePointerDown({ clientX: 20, clientY: 30, pointerType: "touch" });
    controller.handlePointerUp();

    expect(tapCount).toBe(1);
    expect(longPressCount).toBe(0);
    expect(consumeSyntheticClickSuppression("fast-touch-item")).toBe(true);
    expect(consumeSyntheticClickSuppression("fast-touch-item")).toBe(false);
  });

  test("4. Long-press sonrası release de compatibility click'i bastırır", async () => {
    let tapCount = 0;
    let longPressCount = 0;

    const controller = createLongPressController({
      id: "long-touch-item",
      delayMs: 25,
      moveThresholdPx: 8,
      onLongPressTrigger: () => {
        longPressCount += 1;
      },
      onSingleTap: () => {
        tapCount += 1;
      },
    });

    controller.handlePointerDown({ clientX: 40, clientY: 50, pointerType: "touch" });
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(longPressCount).toBe(1);
    expect(tapCount).toBe(0);

    controller.handlePointerUp();

    expect(consumeSyntheticClickSuppression("long-touch-item")).toBe(true);
    expect(consumeSyntheticClickSuppression("long-touch-item")).toBe(false);
  });

  test("5. Scroll olarak iptal edilen gesture hayalet click'i bastırır ama tap/selection çalıştırmaz", () => {
    let tapCount = 0;
    let longPressCount = 0;

    const controller = createLongPressController({
      id: "scroll-touch-item",
      delayMs: 500,
      moveThresholdPx: 8,
      onLongPressTrigger: () => {
        longPressCount += 1;
      },
      onSingleTap: () => {
        tapCount += 1;
      },
    });

    controller.handlePointerDown({ clientX: 100, clientY: 100, pointerType: "touch" });
    controller.handlePointerMove({ clientX: 100, clientY: 120 });
    controller.handlePointerUp();

    expect(tapCount).toBe(0);
    expect(longPressCount).toBe(0);
    expect(consumeSyntheticClickSuppression("scroll-touch-item")).toBe(true);
    expect(consumeSyntheticClickSuppression("scroll-touch-item")).toBe(false);
  });
});
