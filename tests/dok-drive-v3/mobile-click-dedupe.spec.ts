// ============================================================================
// DÖKÜMANTASYON DRIVE V3.1 — MOBILE POINTERUP + CLICK DEDUPE TESTİ
// ============================================================================

import { test, expect } from "@playwright/test";
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

  test("3. Aynı item için peş peşe token'lar doğru sırayla tüketilir", () => {
    armSyntheticClickSuppression("item-repeat", 1_000, 500);
    armSyntheticClickSuppression("item-repeat", 1_000, 500);

    expect(consumeSyntheticClickSuppression("item-repeat", 1_100)).toBe(true);
    expect(consumeSyntheticClickSuppression("item-repeat", 1_100)).toBe(true);
    expect(consumeSyntheticClickSuppression("item-repeat", 1_100)).toBe(false);
  });

  test("4. clearSyntheticClickSuppressions tüm aktif token'ları temizler", () => {
    armSyntheticClickSuppression("item-x", 1_000, 5_000);
    armSyntheticClickSuppression("item-y", 1_000, 5_000);

    clearSyntheticClickSuppressions();

    expect(consumeSyntheticClickSuppression("item-x", 1_050)).toBe(false);
    expect(consumeSyntheticClickSuppression("item-y", 1_050)).toBe(false);
  });

  test("5. Tanımsız veya boş item id için tüketim false döner", () => {
    expect(consumeSyntheticClickSuppression("non-existent")).toBe(false);
  });
});
