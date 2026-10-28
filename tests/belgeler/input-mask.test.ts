import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { maskPhone, maskDate } from "../../src/lib/belge-input-mask";

describe("Belge Stüdyosu — Input Masking Testleri", () => {
  describe("Telefon Maskeleme (maskPhone)", () => {
    it("Boş, nötr ve geçersiz girişleri güvenli karşılamalıdır", () => {
      assert.equal(maskPhone(""), "");
      assert.equal(maskPhone("   "), "");
      assert.equal(maskPhone("-"), "-");
      assert.equal(maskPhone("abc"), "");
    });

    it("05XX ile başlayan Türk cep numaralarını adım adım biçimlendirmelidir", () => {
      assert.equal(maskPhone("0"), "0");
      assert.equal(maskPhone("05"), "05");
      assert.equal(maskPhone("0566"), "0566");
      assert.equal(maskPhone("05661"), "0566 1");
      assert.equal(maskPhone("0566123"), "0566 123");
      assert.equal(maskPhone("05661234"), "0566 123 4");
      assert.equal(maskPhone("056612345"), "0566 123 45");
      assert.equal(maskPhone("0566123456"), "0566 123 45 6");
      assert.equal(maskPhone("05661234567"), "0566 123 45 67");
    });

    it("11 haneden fazla girildiğinde fazlalığı kesmelidir", () => {
      assert.equal(maskPhone("056612345679999"), "0566 123 45 67");
    });

    it("10 haneli (5XX...) mobil numara girilirse başına 0 ekleyerek maskelemelidir", () => {
      assert.equal(maskPhone("5661234567"), "0566 123 45 67");
    });

    it("Uluslararası +90 veya 90 ile yapıştırılan numaraları normalize etmelidir", () => {
      assert.equal(maskPhone("+90 566 123 45 67"), "0566 123 45 67");
      assert.equal(maskPhone("905661234567"), "0566 123 45 67");
    });

    it("hasTelPrefix seçeneği ile 'Tel: 05XX XXX XX XX' formatı üretmelidir", () => {
      assert.equal(maskPhone("05661234567", { hasTelPrefix: true }), "Tel: 0566 123 45 67");
      assert.equal(maskPhone("Tel: 0566 123 45 67", { hasTelPrefix: true }), "Tel: 0566 123 45 67");
      assert.equal(maskPhone("", { hasTelPrefix: true }), "");
    });
  });

  describe("Tarih Maskeleme (maskDate)", () => {
    it("Boş ve nötr girişleri korumalıdır", () => {
      assert.equal(maskDate(""), "");
      assert.equal(maskDate("  "), "");
      assert.equal(maskDate("-"), "-");
    });

    it("Rakamlar girildikçe adım adım GG.AA.YYYY formatlamalıdır", () => {
      assert.equal(maskDate("1"), "1");
      assert.equal(maskDate("16"), "16");
      assert.equal(maskDate("160"), "16.0");
      assert.equal(maskDate("1608"), "16.08");
      assert.equal(maskDate("16082"), "16.08.2");
      assert.equal(maskDate("160820"), "16.08.20");
      assert.equal(maskDate("1608202"), "16.08.202");
      assert.equal(maskDate("16082026"), "16.08.2026");
    });

    it("8 haneden fazlasını kesmelidir", () => {
      assert.equal(maskDate("160820269999"), "16.08.2026");
    });

    it("Kullanıcı kendisi nokta yazdığında çift nokta yapmamalıdır", () => {
      assert.equal(maskDate("16."), "16.");
      assert.equal(maskDate("16.08."), "16.08.");
      assert.equal(maskDate("16.08.2026"), "16.08.2026");
    });

    it("Farklı ayıraçlarla (/ veya -) yapıştırılan tarihleri GG.AA.YYYY yapmalıdır", () => {
      assert.equal(maskDate("16/08/2026"), "16.08.2026");
      assert.equal(maskDate("16-08-2026"), "16.08.2026");
    });

    it("Tek haneden sonra nokta girilirse (1. veya 01.5.) otomatik 0 eklemelidir", () => {
      assert.equal(maskDate("1."), "01.");
      assert.equal(maskDate("01.5."), "01.05.");
    });
  });
});
