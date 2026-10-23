import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  extractFieldFocusRects,
  reduceFieldFocus,
  INITIAL_FOCUS_STATE,
  type PdfDocumentLike,
} from "../../src/lib/belge-field-focus";

describe("D00 Kırmızı Başlangıç — B01 & B06 Doğrulama Testleri", () => {
  it("B06: Aynı sayfada yinelenen widget alanı rects haritasından tamamen reddedilmelidir", async () => {
    const mockPdf: PdfDocumentLike = {
      numPages: 1,
      getPage: async () => ({
        getViewport: () => ({
          width: 600,
          height: 800,
          convertToViewportRectangle: (r: number[]) => r,
        }),
        getAnnotations: async () => [
          {
            id: "ann-1",
            fieldName: "yer",
            subtype: "Widget",
            fieldType: "Tx",
            rect: [100, 200, 300, 250],
          },
          {
            id: "ann-2",
            fieldName: "yer",
            subtype: "Widget",
            fieldType: "Tx",
            rect: [150, 250, 350, 300],
          },
        ],
      }),
    };

    const res = await extractFieldFocusRects(mockPdf, "beton-dokum-tutanagi");
    // Beklenen: Çakışan/çift alan güvenle reddedilmeli ve rects içinde 'yer' bulunmamalıdır.
    // Mevcut durum (KIRMIZI): 'yer' rects içinde kalıyor, sadece ilk rect dönüyor!
    assert.equal(
      res.rects["yer"],
      undefined,
      "Aynı sayfada yinelenen 'yer' alanı rects içinde yer almamalıdır (B06)"
    );
  });

  it("B06: Normalize koordinatlarda left + width <= 1 ve top + height <= 1 kesin olarak sağlanmalıdır", async () => {
    const mockPdf: PdfDocumentLike = {
      numPages: 1,
      getPage: async () => ({
        getViewport: () => ({
          width: 1000,
          height: 1000,
          convertToViewportRectangle: (r: number[]) => r,
        }),
        getAnnotations: async () => [
          {
            id: "ann-overflow",
            fieldName: "yer",
            subtype: "Widget",
            fieldType: "Tx",
            rect: [990, 100, 1010, 120], // left=0.99, width=0.02 -> 1.01
          },
        ],
      }),
    };

    const res = await extractFieldFocusRects(mockPdf, "beton-dokum-tutanagi");
    const rect = res.rects["yer"];
    if (rect) {
      assert.ok(
        rect.left + rect.width <= 1.0,
        `left + width (${rect.left + rect.width}) 1.0 değerini aşmamalıdır (B06)`
      );
    }
  });

  it("B01: Toolbar veya form dışı geçiş (FORM_BLUR) sonrası aynı alana odaklanıldığında yeni focusEventId üretilmelidir", () => {
    // 1. Alana odaklanıldı
    const s1 = reduceFieldFocus(INITIAL_FOCUS_STATE, { type: "FOCUS", fieldKey: "yer" });
    assert.equal(s1.focusEventId, 1);
    assert.equal(s1.isFormFocused, true);

    // 1b. Aynı alanda yazarken/tıklarken focusEventId artmamalıdır
    const s_same = reduceFieldFocus(s1, { type: "FOCUS", fieldKey: "yer" });
    assert.equal(s_same.focusEventId, 1);
    assert.equal(s_same, s1);

    // 2. Toolbar'a veya dışarı geçildi (FORM_BLUR: fieldKey korunur, form odağı false olur)
    const s_blurred = reduceFieldFocus(s1, { type: "FORM_BLUR" });
    assert.equal(s_blurred.fieldKey, "yer");
    assert.equal(s_blurred.isFormFocused, false);

    // 3. Kullanıcı tekrar AYNI alana odaklandı
    const s2 = reduceFieldFocus(s_blurred, { type: "FOCUS", fieldKey: "yer" });

    // Beklenen: Toolbar'dan sonra aynı alana gerçek tıklama yeni bir focus olayı olmalıdır.
    assert.equal(s2.fieldKey, "yer");
    assert.equal(s2.isFormFocused, true);
    assert.ok(
      s2.focusEventId > s1.focusEventId,
      "Toolbar sonrası aynı alana tekrar odaklanıldığında focusEventId artmalıdır (B01)"
    );
  });

  it("İptal kimliği yeni alan seçimlerinde korunur ve sonraki iptalde monoton artar", () => {
    let state = reduceFieldFocus(INITIAL_FOCUS_STATE, { type: "FOCUS", fieldKey: "yer" });
    state = reduceFieldFocus(state, { type: "CLEAR_SELECTION" });
    const firstClear = state.clearEventId;
    state = reduceFieldFocus(state, { type: "FOCUS", fieldKey: "tarih" });
    assert.equal(state.clearEventId, firstClear);
    state = reduceFieldFocus(state, { type: "SET_FIELD", fieldKey: "yer" });
    assert.equal(state.clearEventId, firstClear);
    state = reduceFieldFocus(state, { type: "CLEAR_SELECTION" });
    assert.equal(state.clearEventId, (firstClear ?? 0) + 1);
  });
});
