import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { DOCUMENT_EDITABLE_FIELDS } from "../../src/lib/document-field-contracts";
import {
  DOCUMENT_FIELD_POLICIES,
  getFieldGuidance,
  validateTcKimlikNo,
  validateDate,
  validatePhone,
  validateYibf,
  validatePrice,
} from "../../src/lib/belgeler-field-guidance";
import type { BelgeDocumentId } from "../../src/lib/belge-studio-inline-field-map";

describe("ASAMA_05: Belgeler Saf ve Esnek Alan Kalite Kuralları", () => {
  // 1. 56/56 Alan Sözleşmesi Kapsama Testi
  it("Bölüm 4'teki 56 alanın tamamı kayıt defterinde (DOCUMENT_FIELD_POLICIES) tam eşlenmiş olmalıdır", () => {
    const docIds = Object.keys(DOCUMENT_EDITABLE_FIELDS) as BelgeDocumentId[];
    assert.equal(docIds.length, 5, "Tam 5 resmî belge stüdyosu bulunmalıdır.");

    let totalPolicyFields = 0;
    for (const docId of docIds) {
      const contractFields = DOCUMENT_EDITABLE_FIELDS[docId];
      const policyFields = DOCUMENT_FIELD_POLICIES[docId];

      assert.ok(policyFields, `${docId} için politika nesnesi tanımlı olmalıdır.`);
      const policyKeys = Object.keys(policyFields);
      assert.equal(
        policyKeys.length,
        contractFields.length,
        `${docId} alan sayısı sözleşmeyle (${contractFields.length}) eşit olmalıdır.`
      );

      for (const fieldKey of contractFields) {
        assert.ok(
          (policyFields as Record<string, unknown>)[fieldKey],
          `${docId} belgesindeki "${fieldKey}" alanı politika kayıt defterinde mevcut olmalıdır.`
        );
      }

      totalPolicyFields += policyKeys.length;
    }

    assert.equal(totalPolicyFields, 56, "Politika defterinde tam 56 alan bulunmalıdır.");
  });

  it("Sözleşme harici bilinmeyen alan veya belge sorgulandığında güvenli uyarı döndürmelidir", () => {
    // Bilinmeyen belge
    const invalidDoc = getFieldGuidance("bilinmeyen-belge" as BelgeDocumentId, "tarih", "01.05.2026");
    assert.ok(invalidDoc);
    assert.equal(invalidDoc.code, "unknown-document");

    // Bilinmeyen alan
    const invalidField = getFieldGuidance("beton-dokum-tutanagi", "olmayan_alan", "değer");
    assert.ok(invalidField);
    assert.equal(invalidField.code, "unknown-field");
  });

  // 2. T.C. Kimlik Numarası (K Tipi) Testleri
  describe("T.C. Kimlik Numarası Doğrulama (K Tipi)", () => {
    it("Algoritmik olarak geçerli TCKN örnekleri null (uyarısız) dönmelidir", () => {
      // 11111111110: odd=5, even=4, d10 = (7*5 - 4)%10 = 31%10 = 1. d11 = sum(1..10)%10 = 10%10 = 0.
      assert.equal(validateTcKimlikNo("11111111110"), null);
      // Başka geçerli sentetik örnek: 10000000146
      // d1..d9: 1,0,0,0,0,0,0,0,1 -> odd=2, even=0. d10 = (7*2 - 0)%10 = 14%10 = 4. sum10 = 6 -> d11 = 6.
      assert.equal(validateTcKimlikNo("10000000146"), null);
      assert.equal(validateTcKimlikNo("  10000000146  "), null, "Baştaki ve sondaki boşluklar tolere edilmelidir.");
    });

    it("Boş ve nötr '-' değerleri için uyarı üretilmemelidir (kullanıcıyı baştan uyarıya boğmama)", () => {
      assert.equal(validateTcKimlikNo(""), null);
      assert.equal(validateTcKimlikNo("   "), null);
      assert.equal(validateTcKimlikNo("-"), null);
    });

    it("Rakam harici karakterler 'tckn-non-digit' koduyla uyarılmalıdır", () => {
      const res = validateTcKimlikNo("1000000014A");
      assert.ok(res);
      assert.equal(res.code, "tckn-non-digit");
      assert.equal(res.severity, "warning");
    });

    it("11 haneden farklı uzunluklar 'tckn-length' koduyla uyarılmalıdır", () => {
      const resShort = validateTcKimlikNo("12345");
      assert.ok(resShort);
      assert.equal(resShort.code, "tckn-length");

      const resLong = validateTcKimlikNo("123456789012");
      assert.ok(resLong);
      assert.equal(resLong.code, "tckn-length");
    });

    it("0 ile başlayan TCKN 'tckn-first-zero' koduyla uyarılmalıdır", () => {
      const res = validateTcKimlikNo("01111111110");
      assert.ok(res);
      assert.equal(res.code, "tckn-first-zero");
    });

    it("Kontrol basamakları tutarsız olan değerler 'tckn-checksum' koduyla uyarılmalıdır", () => {
      const res = validateTcKimlikNo("12345678901");
      assert.ok(res);
      assert.equal(res.code, "tckn-checksum");
    });
  });

  // 3. Takvim Tarihi (F Tipi) Testleri
  describe("Takvim Tarihi Doğrulama (F Tipi)", () => {
    it("Geçerli tarihler null (uyarısız) dönmelidir", () => {
      assert.equal(validateDate("01.05.2026"), null);
      assert.equal(validateDate("15/08/2026"), null);
      assert.equal(validateDate("31-12-2025"), null);
      assert.equal(validateDate("29.02.2024"), null, "2024 artık yıldır, 29 Şubat geçerlidir.");
      assert.equal(validateDate("  01.05.2026  "), null);
    });

    it("Boş ve nötr '-' değerleri için uyarı üretilmemelidir", () => {
      assert.equal(validateDate(""), null);
      assert.equal(validateDate("   "), null);
      assert.equal(validateDate("-"), null);
    });

    it("Artık yıl olmayan yıllarda 29 Şubat 'date-leap-year' uyarısı vermelidir", () => {
      const res2025 = validateDate("29.02.2025");
      assert.ok(res2025);
      assert.equal(res2025.code, "date-leap-year");
      assert.ok(res2025.message.includes("28 gündür"));

      const res2026 = validateDate("29.02.2026");
      assert.ok(res2026);
      assert.equal(res2026.code, "date-leap-year");
    });

    it("30 çeken aylarda 31 girildiğinde 'date-day-range' uyarısı vermelidir", () => {
      const resNisan = validateDate("31.04.2026");
      assert.ok(resNisan);
      assert.equal(resNisan.code, "date-day-range");
      assert.ok(resNisan.message.includes("Nisan ayı 30 gündür"));

      const resEylul = validateDate("31.09.2026");
      assert.ok(resEylul);
      assert.equal(resEylul.code, "date-day-range");
    });

    it("Sıfırıncı gün veya geçersiz ay numarası uyarılmalıdır", () => {
      const resGun = validateDate("00.01.2026");
      assert.ok(resGun);
      assert.equal(resGun.code, "date-day-range");

      const resAy = validateDate("15.13.2026");
      assert.ok(resAy);
      assert.equal(resAy.code, "date-month-range");
    });

    it("Hatalı biçimler 'date-format' ile yönlendirilmelidir", () => {
      const res = validateDate("2026.05.01");
      assert.ok(res);
      assert.equal(res.code, "date-format");
    });
  });

  // 4. Telefon Numarası (T Tipi) Testleri
  describe("Telefon Numarası Doğrulama (T Tipi)", () => {
    it("Örnek ve yaygın Türk telefon formatları null (uyarısız) dönmelidir", () => {
      assert.equal(validatePhone("0566 666 66 66"), null, "Varsayılan örnek format desteklenmelidir.");
      assert.equal(validatePhone("05551234567"), null);
      assert.equal(validatePhone("5551234567"), null);
      assert.equal(validatePhone("+90 555 123 45 67"), null);
      assert.equal(validatePhone("Tel: 0555 123 45 67"), null, "Tel: öneki ayıklanmalıdır.");
      assert.equal(validatePhone("GSM: (0532) 123-4567"), null);
      assert.equal(validatePhone("(0212) 234 56 78"), null, "Sabit hatlar reddedilmemelidir.");
    });

    it("Boş ve nötr '-' değerleri için uyarı üretilmemelidir", () => {
      assert.equal(validatePhone(""), null);
      assert.equal(validatePhone("   "), null);
      assert.equal(validatePhone("-"), null);
    });

    it("Harf içeren numaralar 'phone-invalid-characters' uyarısı vermelidir", () => {
      const res = validatePhone("0555 abc 45 67");
      assert.ok(res);
      assert.equal(res.code, "phone-invalid-characters");
    });

    it("Çok kısa veya çok uzun numaralar 'phone-length' uyarısı vermelidir", () => {
      const resShort = validatePhone("0555 12");
      assert.ok(resShort);
      assert.equal(resShort.code, "phone-length");

      const resLong = validatePhone("0555 123 45 67 89 01");
      assert.ok(resLong);
      assert.equal(resLong.code, "phone-length");
    });
  });

  // 5. YİBF Numarası (Y Tipi) Testleri
  describe("YİBF Numarası Doğrulama (Y Tipi)", () => {
    it("Tam 7 haneli rakam YİBF değerleri null dönmelidir", () => {
      assert.equal(validateYibf("1234567"), null);
      assert.equal(validateYibf("7654321"), null);
    });

    it("Boş ve '-' değerleri null dönmelidir", () => {
      assert.equal(validateYibf(""), null);
      assert.equal(validateYibf("-"), null);
    });

    it("7 haneli olmayan veya özel formatlı değerler yumuşak 'info' uyarısı vermelidir (silinmez/engellenmez)", () => {
      const res = validateYibf("AB-123/45");
      assert.ok(res);
      assert.equal(res.code, "yibf-format-info");
      assert.equal(res.severity, "info");
      assert.ok(res.message.includes("7 haneli"));
    });
  });

  // 6. Para / Ücret (P Tipi) Testleri
  describe("Ücret / Para Doğrulama (P Tipi)", () => {
    it("Geçerli para formatları null dönmelidir", () => {
      assert.equal(validatePrice("40.000,00 TL"), null);
      assert.equal(validatePrice("40.000 TL"), null);
      assert.equal(validatePrice("40000"), null);
      assert.equal(validatePrice("40000,00"), null);
      assert.equal(validatePrice("150.000,50 TL"), null);
    });

    it("Boş ve '-' değerleri null dönmelidir", () => {
      assert.equal(validatePrice(""), null);
      assert.equal(validatePrice("-"), null);
    });

    it("Negatif ücret tutarları 'price-negative' uyarısı vermelidir", () => {
      const res = validatePrice("-40000");
      assert.ok(res);
      assert.equal(res.code, "price-negative");
      assert.equal(res.severity, "warning");
    });

    it("Çoklu virgüllü veya anlamsız girişler 'price-format' uyarısı vermelidir", () => {
      const res = validatePrice("40,000,00");
      assert.ok(res);
      assert.equal(res.code, "price-format");
    });
  });

  // 7. Serbest Nominal Metin Alanları (N Tipi) Testleri
  describe("Serbest Nominal Metin Alanları (N Tipi - Sıfır Yanlış Alarm)", () => {
    it("N tipi alanlar için serbest Türkçe ve teknik metinler sıfır uyarı (null) üretmelidir", () => {
      const nominalFields = [
        { doc: "beton-dokum-tutanagi", field: "yer", val: "Kadıköy Şantiyesi Ada: 345 Parsel: 6" },
        { doc: "insaat-ruhsati-dilekcesi", field: "belediye_adi", val: "KADIKÖY BELEDİYE BAŞKANLIĞI" },
        { doc: "insaat-ruhsati-dilekcesi", field: "ana_metin", val: "Yukarıda bilgileri yazılı parselde inşaat yapmak istiyorum..." },
        { doc: "santiye-sefi-istifa-dilekcesi", field: "adres_deger", val: "Fenerbahçe Mah. Bağdat Cad. No: 120/4 Kadıköy / İstanbul" },
        { doc: "santiye-sefi-sozlesmesi", field: "mahalle", val: "Fenerbahçe Mahallesi" },
        { doc: "santiye-sefi-taahhutnamesi", field: "pafta_ada_parsel", val: "Pafta: 12, Ada: 345, Parsel: 6" },
      ] as const;

      for (const item of nominalFields) {
        const res = getFieldGuidance(item.doc as BelgeDocumentId, item.field, item.val);
        assert.equal(
          res,
          null,
          `"${item.doc}" belgesindeki "${item.field}" N alanı için sahte format uyarısı üretilmemelidir.`
        );
      }
    });

    it("Boş, kısa, uzun ve özel karakterli nominal metinler güvenle korunmalıdır", () => {
      assert.equal(getFieldGuidance("beton-dokum-tutanagi", "tutanak_alt_baslik", ""), null);
      assert.equal(getFieldGuidance("beton-dokum-tutanagi", "tutanak_alt_baslik", "-"), null);
      assert.equal(
        getFieldGuidance(
          "beton-dokum-tutanagi",
          "tutanak_alt_baslik",
          "Çok Uzun Başlık: Özel Proje / 2026 Yılı 1. Etap Şantiye Dökümü & İnceleme"
        ),
        null
      );
    });
  });
});
