import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { measureBelgeDraft } from "../../src/lib/pdf-engine";
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

  it("3. Aynı karakter sayısında farklı glif genişlikleri gerçek puntodan değerlendirilir", async () => {
    const id = "santiye-sefi-istifa-dilekcesi";
    const wide = "W".repeat(50);
    const narrow = "i".repeat(50);
    const wideLayout = await measureBelgeDraft(id, "adres_deger", wide);
    const narrowLayout = await measureBelgeDraft(id, "adres_deger", narrow);
    assert.ok(wideLayout.fontSize < 7);
    assert.equal(narrowLayout.fontSize, 8);
    assert.equal(evaluateFieldGuidance(id, "adres_deger", wide, { layout: wideLayout })?.severity, "warning");
    assert.equal(evaluateFieldGuidance(id, "adres_deger", narrow, { layout: narrowLayout }), null);
  });

  it("4. Taahhütname küçük puntolu metin için gerçek baskı uyarısı verir", async () => {
    const value = "W".repeat(120);
    const layout = await measureBelgeDraft("santiye-sefi-taahhutnamesi", "adres", value);
    const result = evaluateFieldGuidance("santiye-sefi-taahhutnamesi", "adres", value, { layout });
    assert.equal(result?.severity, "warning");
    assert.ok(result?.message.includes(layout.fontSize.toFixed(2)));
  });

  it("5. Sözleşme şirket unvanının 4 pt'ye düşmesi risk yok sayılamaz; eski ölçüm yeni değere uygulanmaz", async () => {
    const value = "ÖRNEK İNŞAAT MÜHENDİSLİK MİMARLIK SANAYİ VE TİCARET LİMİTED ŞİRKETİ";
    const layout = await measureBelgeDraft("santiye-sefi-sozlesmesi", "muteahhit_unvan", value);
    assert.ok(layout.fontSize < 4.1);
    assert.equal(evaluateFieldGuidance("santiye-sefi-sozlesmesi", "muteahhit_unvan", value, { layout })?.severity, "warning");
    assert.equal(evaluateFieldGuidance("santiye-sefi-sozlesmesi", "muteahhit_unvan", "KISA", { layout }), null);
    const invalidPhone = "0532 ".repeat(40);
    const phoneLayout = await measureBelgeDraft("santiye-sefi-taahhutnamesi", "telefon", invalidPhone);
    assert.equal(evaluateFieldGuidance("santiye-sefi-taahhutnamesi", "telefon", invalidPhone, { layout: phoneLayout })?.source, "readability");
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
