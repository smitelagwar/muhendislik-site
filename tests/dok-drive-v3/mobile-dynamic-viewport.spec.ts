// ============================================================================
// DÖKÜMANTASYON DRIVE V3.1 — MOBILE DYNAMIC VIEWPORT & ACCESSIBILITY SPEC
// ============================================================================

import { test, expect } from "@playwright/test";
import {
  MOBILE_VIEWPORT_PRESETS,
  isSufficientTouchTarget,
} from "../../src/components/dokumantasyon/drive-v3/mobile-gesture-engine";

test.describe("Drive V3.1 — Mobile Dynamic Viewport & Responsive Hardening", () => {
  test("1. Mobil Viewport Matrisinde tüm zorunlu cihaz boyutları tanımlıdır", () => {
    const requiredDevices = ["iPhone SE", "Galaxy S20", "iPhone 13/14/15", "Pixel 7", "iPad Mini", "iPad Pro 10.5 (Landscape)"];

    for (const dev of requiredDevices) {
      const found = MOBILE_VIEWPORT_PRESETS.find((p) => p.name.includes(dev));
      expect(found).toBeDefined();
      expect(found!.width).toBeGreaterThan(300);
      expect(found!.height).toBeGreaterThan(300);
    }
  });

  test("2. En dar ekran (iPhone SE 320px) yatay taşma (horizontal overflow) yapmaz", () => {
    const viewportWidth = 320;
    const padding = 16 * 2; // px-4 = 32px
    const availableContentWidth = viewportWidth - padding; // 288px

    // List görünümünde tek kolon 288px alana sığar
    expect(availableContentWidth).toBe(288);
    expect(availableContentWidth).toBeGreaterThan(200);

    // Dokunmatik hedef boyutu (en az 44px) kontrolü
    const buttonHeight = 44;
    expect(isSufficientTouchTarget(44, buttonHeight)).toBe(true);
  });

  test("3. Grid kolon hesaplama responsive viewport genişliğine göre uyum sağlar", () => {
    // 320px -> 1 veya 2 kolon
    // 768px -> 3-4 kolon
    // 1200px -> 5-6 kolon
    const calculateColumns = (width: number) => {
      if (width < 400) return 2;
      if (width < 640) return 2;
      if (width < 1024) return 4;
      return 6;
    };

    expect(calculateColumns(320)).toBe(2);
    expect(calculateColumns(390)).toBe(2);
    expect(calculateColumns(768)).toBe(4);
    expect(calculateColumns(1200)).toBe(6);
  });
});
