import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  buildBelgeFilename,
  turkishToAscii,
  isValidCalendarDate,
  parseBelgeDateToIso,
  sanitizeBelgeNamePart,
  formatYibfPart,
} from "../../src/lib/belge-filename";
import {
  BETON_DOKUM_DEFAULT_DATA,
  TAAHHUTNAME_DEFAULT_DATA,
  ISTIFA_DILEKCESI_DEFAULT_DATA,
  INSAAT_RUHSATI_DEFAULT_DATA,
  SOZLESME_DEFAULT_DATA,
} from "../../src/lib/pdf-engine";

describe("ASAMA_02: Belge Akıllı Dosya Adı Çekirdeği Birim Testleri", () => {
  const fixedNow = new Date("2026-10-23T12:00:00Z"); // Europe/Istanbul: 2026-10-23

  describe("1. Türkçe Karakter ve ASCII Dönüşümü", () => {
    it("Türkçe İ/ı, ğ/Ğ, ü/Ü, ş/Ş, ö/Ö, ç/Ç karakterlerini doğru dönüştürmelidir", () => {
      assert.strictEqual(turkishToAscii("İsmail Işık"), "Ismail Isik");
      assert.strictEqual(turkishToAscii("Çetin Şahin"), "Cetin Sahin");
      assert.strictEqual(turkishToAscii("Özgür Ünal"), "Ozgur Unal");
      assert.strictEqual(turkishToAscii("GÜNAYDIN"), "GUNAYDIN");
      assert.strictEqual(turkishToAscii("günaydın"), "gunaydin");
    });
  });

  describe("2. Takvim ve Tarih Ayrıştırma (parseBelgeDateToIso)", () => {
    it("Geçerli GG.AA.YYYY, GG/AA/YYYY, GG-AA-YYYY ve YYYY-AA-GG formatlarını ISO'ya çevirmelidir", () => {
      assert.strictEqual(parseBelgeDateToIso("23.10.2026", fixedNow), "2026-10-23");
      assert.strictEqual(parseBelgeDateToIso("23/10/2026", fixedNow), "2026-10-23");
      assert.strictEqual(parseBelgeDateToIso("23-10-2026", fixedNow), "2026-10-23");
      assert.strictEqual(parseBelgeDateToIso("2026-10-23", fixedNow), "2026-10-23");
      assert.strictEqual(parseBelgeDateToIso("5.8.2026", fixedNow), "2026-08-05");
    });

    it("Artık yıllarda 29 Şubat'ı geçerli kabul etmelidir", () => {
      assert.strictEqual(isValidCalendarDate(2024, 2, 29), true);
      assert.strictEqual(parseBelgeDateToIso("29.02.2024", fixedNow), "2024-02-29");
    });

    it("Takvimde olmayan tarihleri (31.02.2026, 31.04.2026) geçersiz sayıp now gününe düşmelidir", () => {
      assert.strictEqual(isValidCalendarDate(2026, 2, 31), false);
      assert.strictEqual(isValidCalendarDate(2025, 2, 29), false);
      assert.strictEqual(isValidCalendarDate(2026, 4, 31), false);

      // 31.02.2026 -> fallback to Europe/Istanbul now (2026-10-23)
      assert.strictEqual(parseBelgeDateToIso("31.02.2026", fixedNow), "2026-10-23");
      assert.strictEqual(parseBelgeDateToIso("31.04.2026", fixedNow), "2026-10-23");
    });

    it("Boş, tanımsız veya geçersiz metinlerde Europe/Istanbul now tarihini kullanmalıdır", () => {
      assert.strictEqual(parseBelgeDateToIso("", fixedNow), "2026-10-23");
      assert.strictEqual(parseBelgeDateToIso("   ", fixedNow), "2026-10-23");
      assert.strictEqual(parseBelgeDateToIso(undefined, fixedNow), "2026-10-23");
      assert.strictEqual(parseBelgeDateToIso("gecersiz-tarih", fixedNow), "2026-10-23");
    });
  });

  describe("3. Güvenlik, Temizlik ve Uzunluk Sınırları", () => {
    it("Dizin geçişi (../../etc/passwd) ve yol ayırıcıları temizlemelidir", () => {
      const sanitized = sanitizeBelgeNamePart("../../etc/passwd");
      assert.strictEqual(sanitized.includes("/"), false);
      assert.strictEqual(sanitized.includes("\\"), false);
      assert.strictEqual(sanitized.includes(".."), false);
      assert.strictEqual(sanitized, "etc-passwd");
    });

    it("Emoji ve özel karakterleri temizlemelidir", () => {
      assert.strictEqual(sanitizeBelgeNamePart("🏗️ Ahmet 🚧 Yılmaz 👷"), "Ahmet-Yilmaz");
      assert.strictEqual(sanitizeBelgeNamePart("<<<Deneme>>>"), "Deneme");
      assert.strictEqual(sanitizeBelgeNamePart(""), "");
    });

    it("200 karakterlik aşırı uzun ismi 40 karaktere güvenle sınırlamalıdır", () => {
      const longName = "A".repeat(200);
      const sanitized = sanitizeBelgeNamePart(longName, 40);
      assert.strictEqual(sanitized.length, 40);
    });

    it("Çift .pdf uzantısını engellemelidir", () => {
      const sanitized = sanitizeBelgeNamePart("Ahmet-Yilmaz.pdf");
      assert.strictEqual(sanitized, "Ahmet-Yilmaz");
      const filename = buildBelgeFilename("santiye-sefi-taahhutnamesi", {
        santiye_sefi_ad_soyad: "Ahmet-Yilmaz.pdf",
        tarih: "23.10.2026",
      });
      assert.strictEqual(filename.endsWith(".pdf.pdf"), false);
      assert.strictEqual(filename, "Taahhutname_Ahmet-Yilmaz_2026-10-23.pdf");
    });

    it("Toplam dosya adı azami 100 karakteri (.pdf dahil) aşmamalıdır", () => {
      const hugeName = "Cok-Uzun-Bir-Mimar-Muhendis-Ismi-Burada-Yazilmis-Olsun";
      const filename = buildBelgeFilename("santiye-sefi-taahhutnamesi", {
        santiye_sefi_ad_soyad: hugeName,
        tarih: "23.10.2026",
      });
      assert.ok(filename.length <= 100, `Dosya adı 100 karakteri aştı: ${filename.length}`);
      assert.ok(filename.endsWith(".pdf"));
    });
  });

  describe("4. Beton Döküm YİBF Formatlama", () => {
    it("YİBF numarasını doğru formatlamalıdır", () => {
      assert.strictEqual(formatYibfPart("1234567"), "YIBF-1234567");
      assert.strictEqual(formatYibfPart("YIBF-1234567"), "YIBF-1234567");
      assert.strictEqual(formatYibfPart("yibf 9876543"), "YIBF-9876543");
    });

    it("Boş veya geçersiz YİBF değerinde boş string dönmelidir", () => {
      assert.strictEqual(formatYibfPart(""), "");
      assert.strictEqual(formatYibfPart("   "), "");
      assert.strictEqual(formatYibfPart("---"), "");
      assert.strictEqual(formatYibfPart(undefined), "");
    });
  });

  describe("5. 5 Belge x Varsayılan Veriler ve Örnek Kişi Adı Atlaması", () => {
    it("Taahhütname: varsayılan verideki örnek kişi adı (Hüseyin GÜNAYDIN) atlanmalı, belge tarihi korunmalıdır", () => {
      const filename = buildBelgeFilename("santiye-sefi-taahhutnamesi", TAAHHUTNAME_DEFAULT_DATA, fixedNow);
      assert.strictEqual(filename, "Taahhutname_2026-08-16.pdf");
    });

    it("Taahhütname: kullanıcı özel ad girdiğinde isim eklenmelidir", () => {
      const filename = buildBelgeFilename(
        "santiye-sefi-taahhutnamesi",
        { ...TAAHHUTNAME_DEFAULT_DATA, santiye_sefi_ad_soyad: "Ahmet Yılmaz" },
        fixedNow
      );
      assert.strictEqual(filename, "Taahhutname_Ahmet-Yilmaz_2026-08-16.pdf");
    });

    it("İstifa Dilekçesi: varsayılan örnek kişi adı atlanmalı, özel adda dosya adına eklenmelidir", () => {
      const defaultFilename = buildBelgeFilename("santiye-sefi-istifa-dilekcesi", ISTIFA_DILEKCESI_DEFAULT_DATA, fixedNow);
      assert.strictEqual(defaultFilename, "Istifa-Dilekcesi_2025-12-29.pdf");

      const customFilename = buildBelgeFilename(
        "santiye-sefi-istifa-dilekcesi",
        { ...ISTIFA_DILEKCESI_DEFAULT_DATA, ad_soyad: "Mehmet Çelik" },
        fixedNow
      );
      assert.strictEqual(customFilename, "Istifa-Dilekcesi_Mehmet-Celik_2025-12-29.pdf");
    });

    it("İnşaat Ruhsatı: varsayılan örnek kişi adı atlanmalı, özel adda dosya adına eklenmelidir", () => {
      const defaultFilename = buildBelgeFilename("insaat-ruhsati-dilekcesi", INSAAT_RUHSATI_DEFAULT_DATA, fixedNow);
      assert.strictEqual(defaultFilename, "Ruhsat-Dilekcesi_2023-12-08.pdf");

      const customFilename = buildBelgeFilename(
        "insaat-ruhsati-dilekcesi",
        { ...INSAAT_RUHSATI_DEFAULT_DATA, ad_soyad: "Ayşe Özdemir" },
        fixedNow
      );
      assert.strictEqual(customFilename, "Ruhsat-Dilekcesi_Ayse-Ozdemir_2023-12-08.pdf");
    });

    it("Hizmet Sözleşmesi: varsayılan örnek adı atlanmalı, sozlesme_tarihi ISO formatlanmalıdır", () => {
      const defaultFilename = buildBelgeFilename("santiye-sefi-sozlesmesi", SOZLESME_DEFAULT_DATA, fixedNow);
      assert.strictEqual(defaultFilename, "Hizmet-Sozlesmesi_2026-05-01.pdf");

      const customFilename = buildBelgeFilename(
        "santiye-sefi-sozlesmesi",
        { ...SOZLESME_DEFAULT_DATA, santiye_sefi_ad: "Kemal Sunal" },
        fixedNow
      );
      assert.strictEqual(customFilename, "Hizmet-Sozlesmesi_Kemal-Sunal_2026-05-01.pdf");
    });

    it("Beton Döküm Tutanağı: YİBF numarası ve tarih doğru bağlanmalıdır", () => {
      const defaultFilename = buildBelgeFilename("beton-dokum-tutanagi", BETON_DOKUM_DEFAULT_DATA, fixedNow);
      assert.strictEqual(defaultFilename, "Beton-Tutanagi_YIBF-1234567_2026-08-10.pdf");

      const customFilename = buildBelgeFilename(
        "beton-dokum-tutanagi",
        { ...BETON_DOKUM_DEFAULT_DATA, yibf: "7654321" },
        fixedNow
      );
      assert.strictEqual(customFilename, "Beton-Tutanagi_YIBF-7654321_2026-08-10.pdf");

      const emptyYibfFilename = buildBelgeFilename(
        "beton-dokum-tutanagi",
        { ...BETON_DOKUM_DEFAULT_DATA, yibf: "" },
        fixedNow
      );
      assert.strictEqual(emptyYibfFilename, "Beton-Tutanagi_2026-08-10.pdf");
    });
  });
});
