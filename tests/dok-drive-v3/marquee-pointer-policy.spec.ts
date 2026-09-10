// ============================================================================
// DÖKÜMANTASYON DRIVE V3.1 — MARQUEE POINTER POLICY TESTİ
// ============================================================================

import { test, expect } from "@playwright/test";
import {
  canStartMarquee,
  isActiveMarqueePointer,
} from "../../src/components/dokumantasyon/drive-v3/marquee-pointer-policy";

test.describe("Drive V3.1 — Marquee Pointer Policy", () => {
  test("touch primary pointer marquee başlatamaz", () => {
    expect(canStartMarquee("touch", 0)).toBe(false);
  });

  test("pen primary pointer marquee başlatamaz", () => {
    expect(canStartMarquee("pen", 0)).toBe(false);
  });

  test("yalnız primary left mouse marquee başlatabilir", () => {
    expect(canStartMarquee("mouse", 0)).toBe(true);
    expect(canStartMarquee("mouse", 1)).toBe(false);
    expect(canStartMarquee("mouse", 2)).toBe(false);
  });

  test("aktif marquee yalnız onu başlatan aynı mouse pointer tarafından yönetilir", () => {
    const activePointerId = 17;

    expect(isActiveMarqueePointer("mouse", 17, activePointerId)).toBe(true);
    expect(isActiveMarqueePointer("mouse", 18, activePointerId)).toBe(false);
    expect(isActiveMarqueePointer("touch", 17, activePointerId)).toBe(false);
    expect(isActiveMarqueePointer("pen", 17, activePointerId)).toBe(false);
    expect(isActiveMarqueePointer("mouse", 17, null)).toBe(false);
  });
});
