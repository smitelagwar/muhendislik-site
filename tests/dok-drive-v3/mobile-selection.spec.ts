// ============================================================================
// DÖKÜMANTASYON DRIVE V3.1 — MOBILE GESTURE & EXPLICIT SELECTION SPEC
// ============================================================================
// A7: createLongPressController kaldırıldı. Mobil seçim açık "Seç" modu ile
// yönetilmektedir.

import { test, expect } from "@playwright/test";
import {
  isSufficientTouchTarget,
  MOBILE_VIEWPORT_PRESETS,
} from "../../src/components/dokumantasyon/drive-v3/mobile-ui-contract";

test.describe("Drive V3.1 — Mobile Gesture & Explicit Selection Contract", () => {
  test("1. Geliştirilmiş dokunmatik hedef alanı sözleşmesi (44x44px)", () => {
    expect(isSufficientTouchTarget(44, 44)).toBe(true);
    expect(isSufficientTouchTarget(48, 48)).toBe(true);
    expect(isSufficientTouchTarget(40, 44)).toBe(false);
    expect(isSufficientTouchTarget(44, 30)).toBe(false);
    expect(isSufficientTouchTarget(32, 32)).toBe(false);
  });

  test("2. Mobil viewport profilleri en az 7 kritik ekranı kapsar", () => {
    expect(MOBILE_VIEWPORT_PRESETS.length).toBeGreaterThanOrEqual(7);
    const names = MOBILE_VIEWPORT_PRESETS.map((p) => p.name);
    expect(names).toContain("iPhone SE");
    expect(names).toContain("Galaxy S20");
    expect(names).toContain("iPhone 13/14/15");
    expect(names).toContain("Pixel 7");
    expect(names).toContain("iPad Mini");
  });

  test("3. Tüm mobil viewport profilleri pozitif boyutlara sahiptir", () => {
    for (const preset of MOBILE_VIEWPORT_PRESETS) {
      expect(preset.width).toBeGreaterThan(0);
      expect(preset.height).toBeGreaterThan(0);
      expect(["portrait", "landscape"]).toContain(preset.orientation);
    }
  });

  test("4. 320px minimum genişlik (iPhone SE) profili mevcuttur", () => {
    const compact = MOBILE_VIEWPORT_PRESETS.find((p) => p.width === 320);
    expect(compact).toBeDefined();
    expect(compact?.name).toBe("iPhone SE");
  });
});

import { resolveExplorerActivation, type ItemActivationSource, type ExplorerAction } from "../../src/components/dokumantasyon/drive-v3/explorer-activation";
const cases: [ItemActivationSource, boolean, boolean, string, ExplorerAction][] = [
  ["body", true, false, "touch", "open"], ["name", true, false, "touch", "link"],
  ["body", true, true, "touch", "toggle"], ["name", true, true, "touch", "toggle"],
  ["select-control", true, false, "touch", "ignore"], ["select-control", true, true, "touch", "toggle"],
  ["double", true, true, "touch", "ignore"], ["double", true, false, "mouse", "ignore"],
  ["context", true, false, "touch", "ignore"], ["context", false, false, "touch", "ignore"],
  ["context", false, false, "pen", "ignore"], ["double", false, false, "pen", "ignore"],
  ["body", false, false, "mouse", "desktop-select"], ["name", false, false, "mouse", "link"],
  ["double", false, false, "mouse", "open"], ["context", false, false, "mouse", "desktop-context"],
];
for (const [source, mobile, selectionMode, pointerType, result] of cases) {
  test(`Etkinleştirme ${source}/${mobile}/${selectionMode}/${pointerType}: ${result}`, () => {
    expect(resolveExplorerActivation({ source, mobile, selectionMode, pointerType })).toBe(result);
  });
}
