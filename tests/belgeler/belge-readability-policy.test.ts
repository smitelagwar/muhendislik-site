import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_BELGE_READABILITY, UI_SCALE_PRESETS,
  normalizeScale, parseBelgeReadability, sanitizeBelgeReadability,
} from "../../src/lib/belge-studio-readability";

describe("Belge erişilebilirlik ölçeği — güvenli saf politika", () => {
  it("hızlı önayarlar geniş çalışma ihtiyaçlarını kapsar", () => {
    assert.deepEqual(UI_SCALE_PRESETS, [90, 100, 115, 125, 150, 175, 200]);
  });
  it("arayüz ölçeğini 5'lik adımlara ve güvenli aralığa sabitler", () => {
    assert.equal(normalizeScale(113, 90, 200, 5, 100), 115);
    assert.equal(normalizeScale(205, 90, 200, 5, 100), 200);
    assert.equal(normalizeScale(45, 90, 200, 5, 100), 90);
    assert.equal(normalizeScale(NaN, 90, 200, 5, 100), 100);
    assert.equal(normalizeScale("200", 90, 200, 5, 100), 100);
  });
  it("okunabilirlik seçeneklerini bağımsız tutar", () => {
    assert.deepEqual(sanitizeBelgeReadability({
      uiScale: 175, textScale: 160, highContrast: true,
      comfortableReading: true, largeTargets: true,
    }), {
      uiScale: 175, textScale: 160, highContrast: true,
      comfortableReading: true, largeTargets: true,
    });
    assert.equal(DEFAULT_BELGE_READABILITY.uiScale, 100);
    assert.equal(DEFAULT_BELGE_READABILITY.textScale, 100);
  });
  it("sadece sürümlü ve izinli alanları depodan okur", () => {
    const parsed = parseBelgeReadability({
      version: 1, uiScale: 157, textScale: 195, highContrast: true,
      comfortableReading: true, largeTargets: false,
      tcKimlik: "11111111111", pdfBytes: "fake-pdf",
    });
    assert.deepEqual(parsed, {
      uiScale: 155, textScale: 200, highContrast: true,
      comfortableReading: true, largeTargets: false,
    });
    assert.equal(Object.hasOwn(parsed ?? {}, "tcKimlik"), false);
    assert.equal(Object.hasOwn(parsed ?? {}, "pdfBytes"), false);
    assert.equal(parseBelgeReadability({ version: 2, uiScale: 180 }), null);
    assert.equal(parseBelgeReadability([]), null);
    assert.equal(parseBelgeReadability(null), null);
  });
  it("bozulmuş seçimlerde varsayılana döner", () => {
    assert.deepEqual(parseBelgeReadability({
      version: 1, uiScale: Infinity, textScale: undefined, highContrast: "true",
    }), { ...DEFAULT_BELGE_READABILITY });
  });
});
