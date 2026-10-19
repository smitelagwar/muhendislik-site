import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  computeKeyboardInset,
  findInlineFieldAtPoint,
  getInlineFieldInputProps,
  getInlineFieldRevealDelta,
  orderInlineFields,
} from "../../src/lib/belge-inline-mobile";
import type { InlineFieldDescriptor } from "../../src/lib/belge-studio-inline-field-map";

function field(key: string, left: number, top: number, width: number, height: number, readOnly = false): InlineFieldDescriptor {
  return {
    fieldKey: key,
    documentId: "beton-dokum-tutanagi",
    pageNumber: 1,
    pdfRect: [0, 0, 1, 1],
    viewportRect: { left, top, width, height, right: left + width, bottom: top + height },
    readOnly,
    multiline: false,
    label: key,
  };
}

describe("Mobil PDF düzenleme saf yardımcıları", () => {
  it("iç isabet ve 44px tolerans", () => {
    const a = field("a", 10, 10, 100, 12);
    assert.equal(findInlineFieldAtPoint([a], 50, 15)?.fieldKey, "a");
    assert.equal(findInlineFieldAtPoint([a], 50, 30)?.fieldKey, "a");
    assert.equal(findInlineFieldAtPoint([a], 50, 40), null);
  });

  it("iki alan arasında en yakın kenar kazanır", () => {
    const a = field("a", 10, 10, 100, 12);
    const b = field("b", 10, 40, 100, 12);
    assert.equal(findInlineFieldAtPoint([a, b], 50, 30)?.fieldKey, "a");
    assert.equal(findInlineFieldAtPoint([a, b], 50, 33)?.fieldKey, "b");
  });

  it("iç isabette küçük alan önceliklidir; salt okunur atlanır; büyük alan genişletilmez", () => {
    const big = field("big", 0, 0, 200, 100);
    const small = field("small", 50, 50, 20, 10);
    assert.equal(findInlineFieldAtPoint([big, small], 55, 55)?.fieldKey, "small");
    assert.equal(findInlineFieldAtPoint([field("ro", 0, 0, 50, 10, true)], 10, 5), null);
    assert.equal(findInlineFieldAtPoint([field("c", 0, 0, 100, 50)], 50, 55), null);
  });

  it("okuma sırası: üstten alta, aynı satırda soldan sağa", () => {
    const ordered = orderInlineFields([field("r2", 200, 100, 10, 10), field("r1", 10, 102, 10, 10), field("top", 300, 50, 10, 10)]);
    assert.deepEqual(ordered.map((f) => f.fieldKey), ["top", "r1", "r2"]);
  });

  it("klavye boşluğu", () => {
    assert.equal(computeKeyboardInset({ innerHeight: 844, viewportHeight: 500, viewportOffsetTop: 0, viewportScale: 1 }), 344);
    assert.equal(computeKeyboardInset({ innerHeight: 844, viewportHeight: 500, viewportOffsetTop: 100, viewportScale: 1 }), 244);
    assert.equal(computeKeyboardInset({ innerHeight: 844, viewportHeight: 500, viewportOffsetTop: 0, viewportScale: 1.5 }), 0);
    assert.equal(computeKeyboardInset({ innerHeight: 500, viewportHeight: 600, viewportOffsetTop: 0, viewportScale: 1 }), 0);
  });

  it("görünür bölgeye kaydırma farkı", () => {
    const visible = { top: 100, bottom: 500, left: 0, right: 390 };
    assert.deepEqual(getInlineFieldRevealDelta({ field: { top: 520, bottom: 540, left: 20, right: 60 }, visible }), { dx: 0, dy: 52 });
    assert.deepEqual(getInlineFieldRevealDelta({ field: { top: 50, bottom: 70, left: 20, right: 60 }, visible }), { dx: 0, dy: -62 });
    assert.deepEqual(getInlineFieldRevealDelta({ field: { top: 200, bottom: 220, left: 20, right: 60 }, visible }), { dx: 0, dy: 0 });
    assert.deepEqual(getInlineFieldRevealDelta({ field: { top: 90, bottom: 600, left: 20, right: 60 }, visible }), { dx: 0, dy: -22 });
    assert.deepEqual(getInlineFieldRevealDelta({ field: { top: 200, bottom: 220, left: 380, right: 420 }, visible }), { dx: 42, dy: 0 });
  });

  it("alan klavye tipleri sol formla aynıdır", () => {
    assert.equal(getInlineFieldInputProps("santiye-sefi-sozlesmesi", "ada").inputMode, "numeric");
    assert.deepEqual(getInlineFieldInputProps("santiye-sefi-istifa-dilekcesi", "iletisim_deger"), { inputMode: "tel", autoComplete: "tel", autoCapitalize: "off" });
    assert.equal(getInlineFieldInputProps("insaat-ruhsati-dilekcesi", "adres").autoComplete, "street-address");
    assert.deepEqual(getInlineFieldInputProps("beton-dokum-tutanagi", "tutanak_alt_baslik"), { inputMode: "text", autoComplete: "off", autoCapitalize: "sentences" });
  });
});
