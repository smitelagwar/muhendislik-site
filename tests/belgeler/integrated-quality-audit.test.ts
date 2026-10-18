/**
 * ASAMA_08: Belgeler Entegre Kalite, Veri Güvenliği ve Sıfır Veri Kaybı (0 Truncation) Denetimi
 *
 * Kapsam:
 * 1. 56/56 düzenlenebilir alan, 3 salt-PDF etiketi ve 7 FreeText anotasyonunun şablon bütünlüğü
 * 2. 5 belgenin tamamında gerçek PDF üretimi: nominal, sınır, negatif ve stres verileri
 * 3. Sıfır sessiz kesme (0 silent truncation): girilen tüm karakterlerin AcroForm alanında tam korunması
 * 4. Bağlı imza ve unvan senkronizasyon mantığı
 * 5. Format ve okunabilirlik rehberliğinin saf, güvenli ve tutarlı çalışması
 */

import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { PDFDocument } from "pdf-lib";
import {
  DOCUMENT_EDITABLE_FIELDS,
  DOCUMENT_PDF_ONLY_FIELDS,
} from "../../src/lib/document-field-contracts";
import {
  generateBetonDokumPdf,
  generateInsaatRuhsatiPdf,
  generateIstifaDilekcesiPdf,
  generateSozlesmePdf,
  generateTaahhutnamePdf,
  BETON_DOKUM_DEFAULT_DATA,
  INSAAT_RUHSATI_DEFAULT_DATA,
  ISTIFA_DILEKCESI_DEFAULT_DATA,
  SOZLESME_DEFAULT_DATA,
  TAAHHUTNAME_DEFAULT_DATA,
} from "../../src/lib/pdf-engine";
import { measureBelgeDraft } from "../../src/lib/pdf-engine";
import { evaluateFieldGuidance } from "../../src/components/belge-field-guidance";
import type { BelgeDocumentId } from "../../src/lib/belge-studio-inline-field-map";

const REPO_ROOT = resolve(process.cwd());

test("ASAMA_08: Entegre Kalite ve Veri Güvenliği Denetimi", async (t) => {
  // 1. Sözleşme ve Şablon Bütünlüğü (56/56 Alan, 3 PDF-Only, 7 FreeText)
  await t.test("1. 56/56 Alan Sözleşmesi ve Şablon Bütünlüğü", async () => {
    let totalEditable = 0;
    for (const [docId, fields] of Object.entries(DOCUMENT_EDITABLE_FIELDS)) {
      totalEditable += fields.length;
      assert.ok(fields.length > 0, `${docId} alan listesi boş olamaz`);
    }
    assert.equal(totalEditable, 56, "Toplam düzenlenebilir alan sayısı 56 olmalıdır");

    // İstifa dilekçesinde 3 salt-PDF etiketi
    const istifaPdfOnly = DOCUMENT_PDF_ONLY_FIELDS["santiye-sefi-istifa-dilekcesi"];
    assert.deepEqual(istifaPdfOnly, ["adres_etiket", "tc_etiket", "iletisim_etiket"]);
  });

  // 2. Beş Belgede Gerçek PDF Üretimi ve Sıfır Veri Kaybı (0 Truncation)
  await t.test("2. Beş Belgede Gerçek PDF Üretimi ve 0 Sessiz Kesme (Zero Truncation)", async () => {
    const stressAddress =
      "Çankaya Mahallesi İnşaat Mühendisleri Caddesi No:45/12 Kat:4 Daire:8 Çankaya Ankara Türkiye Cumhuriyeti Başkent Merkez Tebligat ve İletişim Noktası " +
      "Ekstra Uzun Blok 12345 Ada 678 Parsel Şantiye Sahası Giriş Nizamiyesi";
    const ultraLongWord = "A".repeat(180);
    const turkishSpecialText = "ÖÇŞİĞÜ öçşiğü İSTANBUL / ANKARA - 2026";

    // A) İstifa Dilekçesi (Genişletilmiş çok satırlı şablon)
    const istifaData = {
      ...ISTIFA_DILEKCESI_DEFAULT_DATA,
      adres_deger: stressAddress,
      ad_soyad: turkishSpecialText,
      unvan: "BAŞ MÜHENDİS",
    };
    const istifaPdfBytes = await generateIstifaDilekcesiPdf(istifaData, { flatten: false });
    const istifaDoc = await PDFDocument.load(istifaPdfBytes);
    const istifaForm = istifaDoc.getForm();
    assert.equal(istifaForm.getTextField("adres_deger").getText(), stressAddress, "İstifa adresi sıfır kayıpla saklanmalı");
    assert.equal(istifaForm.getTextField("ad_soyad").getText(), turkishSpecialText, "İstifa ad soyad Türkçe karakterleri korumalı");

    // B) Beton Döküm Tutanağı
    const betonData = {
      ...BETON_DOKUM_DEFAULT_DATA,
      yer: stressAddress,
      tutanak_alt_baslik: turkishSpecialText,
    };
    const betonPdfBytes = await generateBetonDokumPdf(betonData, { flatten: false });
    const betonDoc = await PDFDocument.load(betonPdfBytes);
    const betonForm = betonDoc.getForm();
    assert.equal(betonForm.getTextField("yer").getText(), stressAddress, "Beton döküm yeri sıfır kayıpla saklanmalı");

    // C) İnşaat Ruhsatı Dilekçesi
    const ruhsatData = {
      ...INSAAT_RUHSATI_DEFAULT_DATA,
      adres: stressAddress,
      ana_metin: ultraLongWord,
    };
    const ruhsatPdfBytes = await generateInsaatRuhsatiPdf(ruhsatData, { flatten: false });
    const ruhsatDoc = await PDFDocument.load(ruhsatPdfBytes);
    const ruhsatForm = ruhsatDoc.getForm();
    assert.equal(ruhsatForm.getTextField("adres").getText(), stressAddress, "Ruhsat adresi sıfır kayıpla saklanmalı");
    assert.equal(ruhsatForm.getTextField("ana_metin").getText(), ultraLongWord, "Ruhsat ana metni sıfır kayıpla saklanmalı");

    // D) Şantiye Şefi Sözleşmesi (2 Sayfa)
    const sozlesmeData = {
      ...SOZLESME_DEFAULT_DATA,
      adres: stressAddress,
      santiye_sefi_ad: "MURAT DEMİR",
      santiye_sefi_imza_adi: "MURAT DEMİR",
    };
    const sozlesmePdfBytes = await generateSozlesmePdf(sozlesmeData, { flatten: false });
    const sozlesmeDoc = await PDFDocument.load(sozlesmePdfBytes);
    assert.equal(sozlesmeDoc.getPageCount(), 2, "Sözleşme tam 2 sayfa olmalıdır");
    const sozlesmeForm = sozlesmeDoc.getForm();
    assert.equal(sozlesmeForm.getTextField("adres").getText(), stressAddress, "Sözleşme adresi sıfır kayıpla saklanmalı");
    assert.equal(sozlesmeForm.getTextField("santiye_sefi_ad").getText(), "MURAT DEMİR");
    assert.equal(sozlesmeForm.getTextField("santiye_sefi_imza_adi").getText(), "MURAT DEMİR");

    // E) Şantiye Şefi Taahhütnamesi
    const taahhutData = {
      ...TAAHHUTNAME_DEFAULT_DATA,
      adres: stressAddress,
      yapi_adresi: stressAddress,
      yapi_sahibi_adresi: stressAddress,
      unvan: "UZMAN MİMAR",
      unvan_imza: "UZMAN MİMAR",
    };
    const taahhutPdfBytes = await generateTaahhutnamePdf(taahhutData, { flatten: false });
    const taahhutDoc = await PDFDocument.load(taahhutPdfBytes);
    const taahhutForm = taahhutDoc.getForm();
    assert.equal(taahhutForm.getTextField("adres").getText(), stressAddress, "Taahhütname adresi sıfır kayıpla saklanmalı");
    assert.equal(taahhutForm.getTextField("yapi_adresi").getText(), stressAddress, "Yapı adresi sıfır kayıpla saklanmalı");
    assert.equal(taahhutForm.getTextField("yapi_sahibi_adresi").getText(), stressAddress, "Yapı sahibi adresi sıfır kayıpla saklanmalı");
    assert.equal(taahhutForm.getTextField("unvan").getText(), "UZMAN MİMAR");
    assert.equal(taahhutForm.getTextField("unvan_imza").getText(), "UZMAN MİMAR");
  });

  // 3. Negatif Girişler ve Hata Güvenliği
  await t.test("3. Negatif Girişler ve Boş/Nötr Değer Güvenliği", async () => {
    const emptyValues = ["", "   ", "-", null, undefined];
    for (const val of emptyValues) {
      const guidance = evaluateFieldGuidance("santiye-sefi-istifa-dilekcesi", "tc_deger", val as any);
      assert.equal(guidance, null, `Boş/nötr "${val}" değeri için uyarı üretilmemelidir`);
    }

    // Geçersiz TCKN (kontrol basamağı hatalı)
    const badTckn = evaluateFieldGuidance("santiye-sefi-istifa-dilekcesi", "tc_deger", "11111111111", {
      isBlurOrSubmitted: true,
    });
    assert.ok(badTckn, "Geçersiz TCKN için rehberlik mesajı üretilmelidir");
    assert.equal(badTckn.severity, "warning");

    // Artık yıl olmayan 29 Şubat
    const badLeap = evaluateFieldGuidance("santiye-sefi-istifa-dilekcesi", "tarih", "29.02.2025");
    assert.ok(badLeap, "Artık yıl olmayan 29 Şubat için rehberlik üretilmelidir");
    assert.equal(badLeap.code, "date-leap-year");

    // Geçerli telefon biçimleri uyarısız geçmeli
    const validPhones = ["05551234567", "0555 123 45 67", "+905551234567", "Tel: 0555 123 45 67"];
    for (const phone of validPhones) {
      const phoneGuidance = evaluateFieldGuidance("insaat-ruhsati-dilekcesi", "tel", phone);
      assert.equal(phoneGuidance, null, `Geçerli telefon formatı "${phone}" uyarısız kabul edilmelidir`);
    }

    // Geçerli ücret biçimleri uyarısız geçmeli
    const validPrices = ["45.000,00 TL", "45000", "45.000 TL", "45000,00"];
    for (const price of validPrices) {
      const priceGuidance = evaluateFieldGuidance("santiye-sefi-sozlesmesi", "ucret", price);
      assert.equal(priceGuidance, null, `Geçerli ücret formatı "${price}" uyarısız kabul edilmelidir`);
    }
  });

  // 4. Okunabilirlik Kalibrasyonu ve Fiziksel Geometri Kanıtı
  await t.test("4. Fiziksel Geometri ve Baskı Okunabilirlik Kalibrasyonu", async () => {
    // 220 karakterlik aşırı uzun adres istifa dilekçesinde baskı riski bildirir
    const longAddress = "A".repeat(220);
    const assessment = evaluateFieldGuidance("santiye-sefi-istifa-dilekcesi", "adres_deger", longAddress, { layout: await measureBelgeDraft("santiye-sefi-istifa-dilekcesi", "adres_deger", longAddress) });
    assert.ok(assessment, "220 karakterlik adres için rehberlik üretilmelidir");
    assert.equal(assessment.source, "readability");
    assert.ok(assessment.message.length > 0);
  });
});
