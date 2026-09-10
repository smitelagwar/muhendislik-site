// ============================================================================
// DÖKÜMANTASYON DRIVE V3.1 — MOBILE GESTURE & EXPLICIT SELECTION SPEC
// ============================================================================

import { test, expect } from "@playwright/test";
import {
  createLongPressController,
  isSufficientTouchTarget,
  MOBILE_VIEWPORT_PRESETS,
} from "../../src/components/dokumantasyon/drive-v3/mobile-gesture-engine";

test.describe("Drive V3.1 — Mobile Gesture & Explicit Selection Contract", () => {
  test("1. Normal tap (<500ms) open/navigate eylemini yalnız bir kez tetikler", async () => {
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

    controller.handlePointerDown({ clientX: 100, clientY: 100, pointerType: "touch" });
    expect(controller.getState()).toBe("pressing");

    await new Promise((r) => setTimeout(r, 50));
    controller.handlePointerUp();

    expect(controller.getState()).toBe("idle");
    expect(openedId).toBe("folder-1");
    expect(selectedId).toBeNull();
  });

  test("2. Long-press seçim başlatmaz ve dosyayı açmaz", async () => {
    let openedId: string | null = null;
    let selectedId: string | null = null;

    const controller = createLongPressController({
      id: "file-1",
      delayMs: 40,
      moveThresholdPx: 8,
      onLongPressTrigger: (id) => {
        selectedId = id;
      },
      onSingleTap: (id) => {
        openedId = id;
      },
    });

    controller.handlePointerDown({ clientX: 100, clientY: 100, pointerType: "touch" });
    await new Promise((r) => setTimeout(r, 80));

    expect(controller.getState()).toBe("cancelled");
    expect(selectedId).toBeNull();
    expect(openedId).toBeNull();

    controller.handlePointerUp();
    expect(controller.getState()).toBe("idle");
    expect(selectedId).toBeNull();
    expect(openedId).toBeNull();
  });

  test("3. Checkbox, menu ve link gibi child kontroller parent row gesture'ını başlatmaz", () => {
    let opened = false;
    let selected = false;

    const controller = createLongPressController({
      id: "interactive-child-item",
      onLongPressTrigger: () => {
        selected = true;
      },
      onSingleTap: () => {
        opened = true;
      },
    });

    const interactiveTarget = {
      closest: (selector: string) => (selector.includes("button") ? {} : null),
    } as unknown as EventTarget;

    controller.handlePointerDown({
      clientX: 50,
      clientY: 50,
      pointerType: "touch",
      target: interactiveTarget,
    });
    controller.handlePointerUp();

    expect(controller.getState()).toBe("idle");
    expect(opened).toBe(false);
    expect(selected).toBe(false);
  });

  test("4. 8px üzerindeki parmak hareketi scroll kabul edilir; seçim/açma üretmez", async () => {
    let opened = false;
    let selected = false;

    const controller = createLongPressController({
      id: "item-scroll",
      delayMs: 150,
      moveThresholdPx: 8,
      onLongPressTrigger: () => {
        selected = true;
      },
      onSingleTap: () => {
        opened = true;
      },
    });

    controller.handlePointerDown({ clientX: 100, clientY: 100, pointerType: "touch" });
    controller.handlePointerMove({ clientX: 100, clientY: 115 });
    expect(controller.getState()).toBe("cancelled");

    await new Promise((r) => setTimeout(r, 200));
    controller.handlePointerUp();

    expect(opened).toBe(false);
    expect(selected).toBe(false);
    expect(controller.getState()).toBe("idle");
  });

  test("5. WCAG touch target ve mobil viewport matrisi korunur", () => {
    expect(isSufficientTouchTarget(44, 44)).toBe(true);
    expect(isSufficientTouchTarget(48, 48)).toBe(true);
    expect(isSufficientTouchTarget(40, 44)).toBe(false);
    expect(isSufficientTouchTarget(44, 30)).toBe(false);
    expect(MOBILE_VIEWPORT_PRESETS.length).toBeGreaterThanOrEqual(7);
  });
});
