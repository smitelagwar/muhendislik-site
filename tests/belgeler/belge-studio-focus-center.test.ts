import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  calculateBelgeFieldCenterScroll,
  calculateFocusPadding,
  easeOutCubic,
  calculatePaddingCompensation,
  isPreviewFittedToViewport,
  isPreviewWidthFitted,
} from "../../src/lib/belge-studio-focus-center";

describe("ASAMA_03: belge-studio-focus-center — Saf Matematik ve Odak Merkezleme Hesapları", () => {
  describe("1. calculateBelgeFieldCenterScroll", () => {
    it("Çerçeve merkezindeki alan için doğru hedef kaydırma koordinatlarını üretmelidir", () => {
      const container = {
        left: 100,
        top: 50,
        clientWidth: 800,
        clientHeight: 600,
        clientLeft: 0,
        clientTop: 0,
        scrollLeft: 200,
        scrollTop: 150,
        scrollWidth: 2000,
        scrollHeight: 3000,
      };

      // Frame is placed inside container
      const frame = {
        left: 200,
        top: 100,
        width: 1000,
        height: 1400,
      };

      // Field is at exact center of frame: center is at (0.5, 0.5)
      const fieldRect = {
        left: 0.45,
        top: 0.45,
        width: 0.1,
        height: 0.1,
      };

      const result = calculateBelgeFieldCenterScroll({
        container,
        frame,
        fieldRect,
      });

      // fieldCenter: x = 200 + 0.5 * 1000 = 700. y = 100 + 0.5 * 1400 = 800.
      assert.equal(result.fieldCenterX, 700);
      assert.equal(result.fieldCenterY, 800);

      // viewportCenter: x = 100 + 400 = 500. y = 50 + 300 = 350.
      assert.equal(result.viewportCenterX, 500);
      assert.equal(result.viewportCenterY, 350);

      // deltaX = 700 - 500 = 200. deltaY = 800 - 350 = 450.
      assert.equal(result.deltaX, 200);
      assert.equal(result.deltaY, 450);

      // targetScroll: scrollLeft(200) + deltaX(200) = 400. scrollTop(150) + deltaY(450) = 600.
      assert.equal(result.targetScrollLeft, 400);
      assert.equal(result.targetScrollTop, 600);
      assert.equal(result.isAlreadyCentered, false);
    });

    it("Merkez sapması <= 2px olan alan için isAlreadyCentered true dönmelidir", () => {
      const container = {
        left: 0,
        top: 0,
        clientWidth: 1000,
        clientHeight: 800,
        clientLeft: 0,
        clientTop: 0,
        scrollLeft: 0,
        scrollTop: 0,
        scrollWidth: 1000,
        scrollHeight: 800,
      };

      const frame = {
        left: 0,
        top: 0,
        width: 1000,
        height: 800,
      };

      // Center is at (501, 399) -> dx = 1, dy = -1 <= 2px
      const fieldRect = {
        left: 0.499,
        top: 0.49625,
        width: 0.004,
        height: 0.005,
      };

      const result = calculateBelgeFieldCenterScroll({
        container,
        frame,
        fieldRect,
      });

      assert.ok(Math.abs(result.deltaX) <= 2);
      assert.ok(Math.abs(result.deltaY) <= 2);
      assert.equal(result.isAlreadyCentered, true);
    });

    it("Mobil alt sayfa örtüşmesi (sheetOverlap) dikey görünür alanı yukarı kaydırmalıdır", () => {
      const container = {
        left: 0,
        top: 0,
        clientWidth: 400,
        clientHeight: 800,
        clientLeft: 0,
        clientTop: 0,
        scrollLeft: 0,
        scrollTop: 0,
        scrollWidth: 400,
        scrollHeight: 1600,
      };

      const frame = {
        left: 0,
        top: 0,
        width: 400,
        height: 1600,
      };

      const fieldRect = {
        left: 0.1,
        top: 0.1,
        width: 0.8,
        height: 0.05,
      };

      // 200px bottom sheet
      const resultWithOverlap = calculateBelgeFieldCenterScroll({
        container,
        frame,
        fieldRect,
        sheetOverlap: 200,
      });

      // Without overlap: viewportCenterY = 400.
      // With 200px overlap: effective client height = 600, viewportCenterY = 300.
      assert.equal(resultWithOverlap.viewportCenterY, 300);
      assert.equal(resultWithOverlap.fieldCenterY, 200);
      assert.equal(resultWithOverlap.deltaY, -100);
    });
    it("lockHorizontal true iken deltaX=0 olmalı ve targetScrollLeft container.scrollLeft değerini korumalıdır", () => {
      const container = {
        left: 0,
        top: 0,
        clientWidth: 800,
        clientHeight: 600,
        clientLeft: 0,
        clientTop: 0,
        scrollLeft: 50,
        scrollTop: 100,
        scrollWidth: 800,
        scrollHeight: 2000,
      };

      const frame = {
        left: 0,
        top: 0,
        width: 800,
        height: 2000,
      };

      // Field is at x = 0.2 (left-aligned)
      const fieldRect = {
        left: 0.2,
        top: 0.4,
        width: 0.1,
        height: 0.1,
      };

      const result = calculateBelgeFieldCenterScroll({
        container,
        frame,
        fieldRect,
        lockHorizontal: true,
      });

      // Horizontal lock ensures zero deltaX and zero scrollLeft change
      assert.equal(result.deltaX, 0);
      assert.equal(result.targetScrollLeft, 50);

      // Vertical calculation still operates normally
      // fieldCenterY = 0 + (0.4 + 0.05) * 2000 = 900
      // viewportCenterY = 300
      // deltaY = 900 - 300 = 600
      assert.equal(result.deltaY, 600);
      assert.equal(result.targetScrollTop, 700);
    });
  });

  describe("2. calculateFocusPadding", () => {
    it("Konteyner genişlik ve yüksekliği kadar güvenli hareket boşluğu üretmelidir", () => {
      const padding = calculateFocusPadding(1200, 800);
      assert.equal(padding.padX, 1200);
      assert.equal(padding.padY, 800);
    });

    it("Çok küçük boyutlarda dahi en az 8px koruması sağlamalıdır", () => {
      const padding = calculateFocusPadding(5, 5);
      assert.equal(padding.padX, 8);
      assert.equal(padding.padY, 8);
    });

    it("lockHorizontal true iken padX=0 olmalıdır (yatay sıçrama engeli)", () => {
      const padding = calculateFocusPadding(1200, 800, { lockHorizontal: true });
      assert.equal(padding.padX, 0);
      assert.equal(padding.padY, 800);
    });
  });

  describe("3. easeOutCubic", () => {
    it("t=0 için 0, t=1 için 1 dönmeli ve monoton artmalıdır", () => {
      assert.equal(easeOutCubic(0), 0);
      assert.equal(easeOutCubic(1), 1);

      let prev = -1;
      for (let i = 0; i <= 20; i++) {
        const val = easeOutCubic(i / 20);
        assert.ok(val >= prev, `Monoton olmalı: ${val} >= ${prev}`);
        prev = val;
      }
    });

    it("Yumuşak yavaşlama (ease-out) profiline sahip olmalıdır (ilk yarıda > 0.5 yol almalıdır)", () => {
      const mid = easeOutCubic(0.5);
      // At t=0.5, 1 - (0.5)^3 = 0.875 > 0.5 (fast start, gradual deceleration)
      assert.equal(mid, 0.875);
    });
  });

  describe("4. calculatePaddingCompensation", () => {
    it("Çerçeve pozisyonundaki yer değiştirmeyi kompanse etmek için doğru delta üretmelidir", () => {
      const prevFrame = { left: 50, top: 40 };
      const newFrame = { left: 350, top: 240 };

      const compensation = calculatePaddingCompensation(prevFrame, newFrame);
      assert.equal(compensation.shiftX, 300);
      assert.equal(compensation.shiftY, 200);
    });
  });

  describe("5. reduceFieldFocus RECENTER sözleşmesi", () => {
    it("Aynı alana RECENTER çağrıldığında centerRequestId artmalı, focusEventId değişmemelidir", async () => {
      const { reduceFieldFocus, INITIAL_FOCUS_STATE } = await import(
        "../../src/lib/belge-field-focus"
      );

      // Focus on 'yer'
      const state1 = reduceFieldFocus(INITIAL_FOCUS_STATE, {
        type: "FOCUS",
        fieldKey: "yer",
      });
      assert.equal(state1.fieldKey, "yer");
      assert.equal(state1.focusEventId, 1);
      assert.equal(state1.centerRequestId, undefined);

      // Re-center on 'yer'
      const state2 = reduceFieldFocus(state1, {
        type: "RECENTER",
        fieldKey: "yer",
      });
      assert.equal(state2.fieldKey, "yer");
      assert.equal(state2.focusEventId, 1); // Not changed
      assert.equal(state2.centerRequestId, 1);

      // Re-center again
      const state3 = reduceFieldFocus(state2, {
        type: "RECENTER",
        fieldKey: "yer",
      });
      assert.equal(state3.centerRequestId, 2);
      assert.equal(state3.focusEventId, 1);

      // RECENTER on different field when 'yer' is focused should be no-op
      const state4 = reduceFieldFocus(state3, {
        type: "RECENTER",
        fieldKey: "tarih",
      });
      assert.equal(state4.centerRequestId, 2);
    });
  });

  describe("6. isPreviewFittedToViewport & isPreviewWidthFitted", () => {
    it("Önizleme hem en hem boy olarak sığıyorsa isPreviewFittedToViewport true dönmelidir", () => {
      // Container 1000x800, Frame 600x750 -> Fits
      assert.equal(isPreviewFittedToViewport(600, 750, 1000, 800), true);
      // Container 1000x800, Frame 1005x750 -> Fits within 8px tolerance
      assert.equal(isPreviewFittedToViewport(1005, 750, 1000, 800), true);
      // Container 1000x800, Frame 1020x750 -> Exceeds tolerance
      assert.equal(isPreviewFittedToViewport(1020, 750, 1000, 800), false);
      // Container 1000x800, Frame 600x850 -> Exceeds height
      assert.equal(isPreviewFittedToViewport(600, 850, 1000, 800), false);
    });

    it("Önizleme yatayda sığıyorsa isPreviewWidthFitted true dönmelidir", () => {
      // Container 900, Frame 880 -> Fits
      assert.equal(isPreviewWidthFitted(880, 900), true);
      // Container 900, Frame 903 -> Fits within 4px tolerance
      assert.equal(isPreviewWidthFitted(903, 900), true);
      // Container 900, Frame 910 -> Exceeds tolerance
      assert.equal(isPreviewWidthFitted(910, 900), false);
      // Container 900, Frame 1200 -> Exceeds tolerance (high zoom)
      assert.equal(isPreviewWidthFitted(1200, 900), false);
    });
  });
});
