import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { evaluateFieldGuidance } from "../../src/components/belge-field-guidance";
import { DOCUMENT_EDITABLE_FIELDS } from "../../src/lib/document-field-contracts";
import type { BelgeDocumentId } from "../../src/lib/belge-studio-inline-field-map";

describe("ASAMA_07 — Belge Field Guidance & Evaluator Test Suite", () => {
  const allDocIds: BelgeDocumentId[] = [
    "beton-dokum-tutanagi",
    "insaat-ruhsati-dilekcesi",
    "santiye-sefi-istifa-dilekcesi",
    "santiye-sefi-sozlesmesi",
    "santiye-sefi-taahhutnamesi",
  ];

  it("1. Boş, undefined, null ve nötr '-' değerler için tüm belgelerde sıfır uyarı üretilmeli", () => {
    for (const docId of allDocIds) {
      const fieldKeys = DOCUMENT_EDITABLE_FIELDS[docId];
      for (const key of fieldKeys) {
        assert.equal(evaluateFieldGuidance(docId, key, ""), null, `${docId}:${key} boş değer null dönmeli`);
        assert.equal(evaluateFieldGuidance(docId, key, "   "), null, `${docId}:${key} boşluk null dönmeli`);
        assert.equal(evaluateFieldGuidance(docId, key, "-"), null, `${docId}:${key} '-' nötr değer null dönmeli`);
        assert.equal(evaluateFieldGuidance(docId, key, undefined), null, `${docId}:${key} undefined null dönmeli`);
      }
    }
  });

  it("2. Nominal serbest metin alanlarında standart uzunlukta sıfır uyarı ve sıfır regex kısıtı olmalı", () => {
    // Örnek serbest alanlar: unvan, ad_soyad, belediye_adi, mahalle
    const samples: Array<[BelgeDocumentId, string, string]> = [
      ["insaat-ruhsati-dilekcesi", "belediye_adi", "Çankaya Belediyesi İmar Müdürlüğü"],
      ["insaat-ruhsati-dilekcesi", "unvan", "Yapı Müteahhidi ve İnşaat Müh."],
      ["santiye-sefi-istifa-dilekcesi", "hitap_1", "YAPI DENETİM KURULUŞUNA"],
      ["santiye-sefi-sozlesmesi", "mahalle", "Aşağı Ayrancı Mah."],
      ["santiye-sefi-taahhutnamesi", "ilgili_idare", "Mamak Belediyesi"],
    ];

    for (const [docId, key, val] of samples) {
      const res = evaluateFieldGuidance(docId, key, val);
      assert.equal(res, null, `${docId}:${key} serbest metin uyarısız kalmalı`);
    }
  });

  it("3. İstifa Dilekçesi adres_deger: ASAMA_06B genişletilmiş eşikleri (130, 220) ile dürüst rehberlik", () => {
    const docId = "santiye-sefi-istifa-dilekcesi";
    const fieldKey = "adres_deger";

    // 100 karakter: 225x36 pt çok satırlı şablonda rahatça sığar -> null
    const text100 = "A".repeat(100);
    assert.equal(evaluateFieldGuidance(docId, fieldKey, text100), null);

    // 140 karakter: possible eşiği (130) aşar -> info
    const text140 = "B".repeat(140);
    const res140 = evaluateFieldGuidance(docId, fieldKey, text140);
    assert.ok(res140 !== null);
    assert.equal(res140?.severity, "info");
    assert.equal(res140?.source, "readability");

    // 230 karakter: serious eşiği (220) aşar -> warning
    const text230 = "C".repeat(230);
    const res230 = evaluateFieldGuidance(docId, fieldKey, text230);
    assert.ok(res230 !== null);
    assert.equal(res230?.severity, "warning");
    assert.equal(res230?.source, "readability");
  });

  it("4. Taahhütname dar tek satırlı adres alanları: fiziksel punto küçülmesini kullanıcıya açıkça bildirmeli", () => {
    const docId = "santiye-sefi-taahhutnamesi";
    const fieldKey = "adres"; // [65, 110]

    // 40 karakter: nominal 5 pt font sığar
    assert.equal(evaluateFieldGuidance(docId, fieldKey, "A".repeat(40)), null);

    // 75 karakter: possible eşiği -> info
    const res75 = evaluateFieldGuidance(docId, fieldKey, "A".repeat(75));
    assert.ok(res75 !== null);
    assert.equal(res75?.severity, "info");
    assert.ok(res75?.message.includes("tek satırlı dar alanda"));

    // 120 karakter: serious eşiği -> warning
    const res120 = evaluateFieldGuidance(docId, fieldKey, "A".repeat(120));
    assert.ok(res120 !== null);
    assert.equal(res120?.severity, "warning");
    assert.ok(res120?.message.includes("okunması zorlaşacaktır"));
  });

  it("5. Sözleşme açık adres (170 x 11.5 pt tablo hücresi): [50, 80] eşikleri", () => {
    const docId = "santiye-sefi-sozlesmesi";
    const fieldKey = "adres";

    assert.equal(evaluateFieldGuidance(docId, fieldKey, "Kızılay Mah. No:12"), null);

    const res60 = evaluateFieldGuidance(docId, fieldKey, "A".repeat(60));
    assert.ok(res60 !== null);
    assert.equal(res60?.severity, "info");

    const res90 = evaluateFieldGuidance(docId, fieldKey, "A".repeat(90));
    assert.ok(res90 !== null);
    assert.equal(res90?.severity, "warning");
  });

  it("6. T.C. Kimlik No: yazım esnasında erken gürültü yapmama ve onay/blur sonrası doğru checksum rehberliği", () => {
    const docId = "santiye-sefi-istifa-dilekcesi";
    const fieldKey = "tc_deger";

    // Rakam dışı karakter girildiğinde: derhal format uyarısı
    const resNonDigit = evaluateFieldGuidance(docId, fieldKey, "12345abcde1");
    assert.ok(resNonDigit !== null);
    assert.equal(resNonDigit?.code, "tckn-non-digit");

    // İlk rakam 0 ise: derhal format uyarısı
    const resZero = evaluateFieldGuidance(docId, fieldKey, "01234567890");
    assert.ok(resZero !== null);
    assert.equal(resZero?.code, "tckn-first-zero");

    // 5 hane girildiğinde (kullanıcı henüz yazıyor):
    // blur/submit OLMADAN -> null (sessiz, erken saldırmaz)
    const resTyping = evaluateFieldGuidance(docId, fieldKey, "12345", { isTouched: false, isBlurOrSubmitted: false });
    assert.equal(resTyping, null);

    // blur/submit OLDUĞUNDA -> 11 hane uyarısı
    const resBlurred = evaluateFieldGuidance(docId, fieldKey, "12345", { isTouched: true });
    assert.ok(resBlurred !== null);
    assert.equal(resBlurred?.code, "tckn-length");

    // 11 hane hatalı checksum girildiğinde:
    // Yazarken -> sessiz
    const resTypingBadChecksum = evaluateFieldGuidance(docId, fieldKey, "11111111111", { isTouched: false, isBlurOrSubmitted: false });
    assert.equal(resTypingBadChecksum, null);

    // Blur veya popover onayı sırasında -> checksum uyarısı
    const resBlurredBadChecksum = evaluateFieldGuidance(docId, fieldKey, "11111111111", { isBlurOrSubmitted: true });
    assert.ok(resBlurredBadChecksum !== null);
    assert.equal(resBlurredBadChecksum?.code, "tckn-checksum");

    // Geçerli TCKN (ör. 10000000146):
    const resValid = evaluateFieldGuidance(docId, fieldKey, "10000000146", { isBlurOrSubmitted: true });
    assert.equal(resValid, null);
  });

  it("7. Takvim Tarihi: GG.AA.YYYY formatı ve artık yıl doğrulaması", () => {
    const docId = "insaat-ruhsati-dilekcesi";
    const fieldKey = "tarih";

    assert.equal(evaluateFieldGuidance(docId, fieldKey, "17.10.2026"), null);
    assert.equal(evaluateFieldGuidance(docId, fieldKey, "29.02.2024"), null); // 2024 artık yıl

    // Geçersiz artık yıl (2025 Şubat 29 çekmez)
    const resLeap = evaluateFieldGuidance(docId, fieldKey, "29.02.2025");
    assert.ok(resLeap !== null);
    assert.equal(resLeap?.code, "date-leap-year");

    // Hatalı format
    const resBadFormat = evaluateFieldGuidance(docId, fieldKey, "2026-10-17");
    assert.ok(resBadFormat !== null);
    assert.equal(resBadFormat?.code, "date-format");
  });

  it("8. Telefon Numarası: Yerel, ulusal ve +90 öneklerini bozmadan kabul etmeli", () => {
    const docId = "insaat-ruhsati-dilekcesi";
    const fieldKey = "tel";

    assert.equal(evaluateFieldGuidance(docId, fieldKey, "0532 123 45 67"), null);
    assert.equal(evaluateFieldGuidance(docId, fieldKey, "+90 532 123 45 67"), null);
    assert.equal(evaluateFieldGuidance(docId, fieldKey, "Tel: 0312 234 56 78"), null);

    // Belirgin biçim hatası
    const resBadPhone = evaluateFieldGuidance(docId, fieldKey, "1234");
    assert.ok(resBadPhone !== null);
    assert.equal(resBadPhone?.code, "phone-length");
  });

  it("9. Aylık Brüt Ücret (P Tipi Sözleşme): Geçerli formatları kabul edip belirgin hatada uyarmalı", () => {
    const docId = "santiye-sefi-sozlesmesi";
    const fieldKey = "ucret";

    assert.equal(evaluateFieldGuidance(docId, fieldKey, "40.000,00 TL"), null);
    assert.equal(evaluateFieldGuidance(docId, fieldKey, "50000 TL"), null);

    const resNoDigits = evaluateFieldGuidance(docId, fieldKey, "On Bin Lira");
    assert.ok(resNoDigits !== null);
    assert.equal(resNoDigits?.code, "price-no-digits");
  });

  it("10. Popover ve Sol Form arasında aynı saf evaluator sonucu dönmeli", () => {
    const testCases: Array<[BelgeDocumentId, string, string]> = [
      ["santiye-sefi-istifa-dilekcesi", "adres_deger", "A".repeat(150)],
      ["santiye-sefi-istifa-dilekcesi", "tc_deger", "11111111110"],
      ["santiye-sefi-sozlesmesi", "sozlesme_tarihi", "29.02.2025"],
      ["insaat-ruhsati-dilekcesi", "tel", "0532 111 22 33"],
      ["santiye-sefi-taahhutnamesi", "yapi_adresi", "B".repeat(110)],
    ];

    for (const [docId, key, val] of testCases) {
      // Popover değerlendirmesi (isBlurOrSubmitted: true)
      const popoverRes = evaluateFieldGuidance(docId, key, val, { isBlurOrSubmitted: true });
      // Sol form blur değerlendirmesi (isTouched: true)
      const leftFormRes = evaluateFieldGuidance(docId, key, val, { isTouched: true });

      assert.deepEqual(popoverRes, leftFormRes, `${docId}:${key} Popover ve Sol form tam tutarlı olmalı`);
    }
  });
});
