import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_FORM_SCALE,
  DEFAULT_FORM_VIEW_STATE,
  FORM_SCALE_PRESETS,
  fitsOnBothAxes,
  formatScaleLabel,
  safeParseFormViewState,
  sanitizeManualScale,
} from "../../src/lib/belge-studio-form-view";

describe("ASAMA_03: Belge Stüdyosu Form Görünümü Saf Politika Testleri", () => {
  it("1. FORM_SCALE_PRESETS yalnız 1.00, 0.90, 1.10, 1.25 değerlerini içermelidir", () => {
    assert.deepEqual(FORM_SCALE_PRESETS, [1.00, 0.90, 1.10, 1.25]);
    assert.equal(DEFAULT_FORM_SCALE, 1.00);
  });

  it("2. sanitizeManualScale geçerli presetleri korumalı, geçersizleri 1.00 yapmalıdır", () => {
    // Geçerli değerler
    assert.equal(sanitizeManualScale(0.90), 0.90);
    assert.equal(sanitizeManualScale(1.00), 1.00);
    assert.equal(sanitizeManualScale(1.10), 1.10);
    assert.equal(sanitizeManualScale(1.25), 1.25);

    // Küsüratlı yakın değerler
    assert.equal(sanitizeManualScale(0.901), 0.90);
    assert.equal(sanitizeManualScale(1.249), 1.25);

    // Geçersiz veya tehlikeli değerler
    assert.equal(sanitizeManualScale(0.50), DEFAULT_FORM_SCALE);
    assert.equal(sanitizeManualScale(2.00), DEFAULT_FORM_SCALE);
    assert.equal(sanitizeManualScale(0), DEFAULT_FORM_SCALE);
    assert.equal(sanitizeManualScale(-1), DEFAULT_FORM_SCALE);
    assert.equal(sanitizeManualScale(NaN), DEFAULT_FORM_SCALE);
    assert.equal(sanitizeManualScale(Infinity), DEFAULT_FORM_SCALE);
    assert.equal(sanitizeManualScale("1.00"), DEFAULT_FORM_SCALE);
    assert.equal(sanitizeManualScale(null), DEFAULT_FORM_SCALE);
    assert.equal(sanitizeManualScale(undefined), DEFAULT_FORM_SCALE);
  });

  it("3. safeParseFormViewState versiyon 3 ve allowlist doğrulamasını tam uygulamalıdır", () => {
    // Geçerli kayıt
    const valid = {
      version: 3,
      mode: "manual",
      manualScale: 1.10,
      manualDensity: "compact",
    };
    const parsedValid = safeParseFormViewState(valid);
    assert.deepEqual(parsedValid, {
      version: 3,
      mode: "manual",
      manualScale: 1.10,
      manualDensity: "compact",
    });

    // Fit modu
    const fitState = {
      version: 3,
      mode: "fit",
      manualScale: 1.00,
      manualDensity: "normal",
    };
    assert.equal(safeParseFormViewState(fitState)?.mode, "fit");

    // Eski veya farklı versiyon (ör. v1, v2) reddedilmeli
    assert.equal(safeParseFormViewState({ version: 2, mode: "manual" }), null);
    assert.equal(safeParseFormViewState({ version: 1 }), null);
    assert.equal(safeParseFormViewState({}), null);
    assert.equal(safeParseFormViewState(null), null);
    assert.equal(safeParseFormViewState("invalid-string"), null);
    assert.equal(safeParseFormViewState([1, 2, 3]), null);

    // Kirli / sızan kişisel veriler ayıklanmalı
    const dirty = {
      version: 3,
      mode: "manual",
      manualScale: 0.90,
      manualDensity: "normal",
      tc_kimlik: "12345678901",
      pdf_bytes: "JVBERi0xLjQK...",
      document_content: "Gizli Sözleşme Metni",
    };
    const cleaned = safeParseFormViewState(dirty);
    assert.deepEqual(cleaned, {
      version: 3,
      mode: "manual",
      manualScale: 0.90,
      manualDensity: "normal",
    });
    const dirtyCleaned = cleaned as Record<string, unknown> | null;
    assert.equal(dirtyCleaned?.tc_kimlik, undefined);
    assert.equal(dirtyCleaned?.pdf_bytes, undefined);
  });

  it("4. formatScaleLabel doğru yüzde metinleri üretmelidir", () => {
    assert.equal(formatScaleLabel(0.90), "%90");
    assert.equal(formatScaleLabel(1.00), "%100");
    assert.equal(formatScaleLabel(1.10), "%110");
    assert.equal(formatScaleLabel(1.25), "%125");
  });

  it("5. DEFAULT_FORM_VIEW_STATE güvenli başlangıç ilkelerini karşılamalıdır", () => {
    assert.equal(DEFAULT_FORM_VIEW_STATE.version, 3);
    assert.equal(DEFAULT_FORM_VIEW_STATE.mode, "manual");
    assert.equal(DEFAULT_FORM_VIEW_STATE.manualScale, 1.00);
    assert.equal(DEFAULT_FORM_VIEW_STATE.manualDensity, "normal");
  });

  describe("ASAMA_04: fitsOnBothAxes İki Eksenli Geometri ve Tolerans Testleri", () => {
    it("6. Sığan içerikte true dönmelidir", () => {
      const viewport = { clientWidth: 400, clientHeight: 600 };
      const content = {
        scrollWidth: 380,
        scrollHeight: 550,
        firstCardTop: 0,
        lastCardBottom: 550,
      };
      assert.equal(fitsOnBothAxes(viewport, content), true);
    });

    it("7. 2px piksel toleransı sınırında true dönmelidir", () => {
      const viewport = { clientWidth: 400, clientHeight: 600 };
      const content = {
        scrollWidth: 402, // +2px tolerans
        scrollHeight: 602, // +2px tolerans
        firstCardTop: -1, // tolerans içinde
        lastCardBottom: 602,
      };
      assert.equal(fitsOnBothAxes(viewport, content), true);
    });

    it("8. Toleransı aşan dikey taşmada false dönmelidir", () => {
      const viewport = { clientWidth: 400, clientHeight: 600 };
      const content = {
        scrollWidth: 380,
        scrollHeight: 605, // +5px taşma
        firstCardTop: 0,
        lastCardBottom: 605,
      };
      assert.equal(fitsOnBothAxes(viewport, content), false);
    });

    it("9. Toleransı aşan yatay taşmada false dönmelidir", () => {
      const viewport = { clientWidth: 400, clientHeight: 600 };
      const content = {
        scrollWidth: 405, // +5px taşma
        scrollHeight: 500,
        firstCardTop: 0,
        lastCardBottom: 500,
      };
      assert.equal(fitsOnBothAxes(viewport, content), false);
    });

    it("10. Son kart ekran dışına taştığında (lastCardBottom > viewport) false dönmelidir", () => {
      const viewport = { clientWidth: 400, clientHeight: 600 };
      const content = {
        scrollWidth: 380,
        scrollHeight: 590, // scrollHeight küçük görünse bile
        firstCardTop: 0,
        lastCardBottom: 620, // kart ekran dışında!
      };
      assert.equal(fitsOnBothAxes(viewport, content), false);
    });

    it("11. 0px veya gizli viewport durumunda güvenle false dönmelidir", () => {
      assert.equal(
        fitsOnBothAxes(
          { clientWidth: 0, clientHeight: 0 },
          { scrollWidth: 100, scrollHeight: 100, firstCardTop: 0, lastCardBottom: 100 }
        ),
        false
      );
    });
  });
});
