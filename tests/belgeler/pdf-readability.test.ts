import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  generateBelgeDocument,
  measureBelgeDraft,
  ISTIFA_DILEKCESI_DEFAULT_DATA,
  generateSozlesmePdf,
  SOZLESME_DEFAULT_DATA,
  generateTaahhutnamePdf,
  TAAHHUTNAME_DEFAULT_DATA,
  generateInsaatRuhsatiPdf,
  INSAAT_RUHSATI_DEFAULT_DATA,
  generateBetonDokumPdf,
  BETON_DOKUM_DEFAULT_DATA,
} from "../../src/lib/pdf-engine";
import {
  assessFieldReadability,
  inspectPdfFieldAppearance,
  CRITICAL_READABILITY_GEOMETRIES,
} from "../../src/lib/belgeler-pdf-readability";

describe("ASAMA_06 & ASAMA_06B: Gerçek PDF Basım Okunabilirliği ve Geometri Kanıt Testleri", () => {
  // ---------------------------------------------------------------------------
  // 1. İstifa Dilekçesi adres_deger (225 x 36 pt Çok Satırlı) İyileştirme Kanıtı
  // ---------------------------------------------------------------------------
  describe("İstifa Dilekçesi: adres_deger (225 x 36 pt Çok Satırlı İyileştirilmiş) Gerçek PDF Çıktısı", () => {
    const addressTestCases = [
      {
        name: "Varsayılan (48 karakter)",
        text: ISTIFA_DILEKCESI_DEFAULT_DATA.adres_deger!,
        expectedRisk: "none" as const,
        expectedMinFont: 7.8, // 8.0 pt nominal
      },
      {
        name: "60 karakter",
        text: "Örnek Mahallesi Mühendisler Caddesi No:12/4 Çankaya / ANKARA",
        expectedRisk: "none" as const,
        expectedMinFont: 7.8, // 8.0 pt nominal (eski şablonda 6.0 pt idi)
      },
      {
        name: "84 karakter",
        text: "Fenerbahçe Mahallesi Bağdat Caddesi No: 120/4 Kadıköy / İstanbul Türkiye Cumhuriyeti",
        expectedRisk: "none" as const,
        expectedMinFont: 7.8, // 8.0 pt nominal (eski şablonda 4.0 pt / 3.12 pt idi - %100 iyileşme!)
      },
      {
        name: "122 karakter",
        text: "Çankaya Mahallesi İnönü Caddesi No: 45/A Daire: 12 Kat: 3 Posta Kodu: 06540 Çankaya / Ankara (Gazi Üniversitesi Karşısı)",
        expectedRisk: "none" as const,
        expectedMinFont: 7.8, // 8.0 pt nominal (eski şablonda 3.0 pt / 2.15 pt idi - %166 iyileşme!)
      },
      {
        name: "212 karakter",
        text: "Atatürk Mahallesi Cumhuriyet Bulvarı No: 1245 Kat: 8 Daire: 34 Blok: B Giriş: 2 Posta Kodu: 34758 Ataşehir / İstanbul Türkiye Cumhuriyeti (Metro İstasyonu Yanı, Belediye Binası Arkası, Sağlık Ocağı Karşısı)",
        expectedRisk: "none" as const,
        expectedMinFont: 6.8, // 7.0 pt (eski şablonda 1.35 pt idi - %418 iyileşme!)
      },
      {
        name: "220 karakter tek kelime",
        text: "A".repeat(220),
        expectedRisk: "serious" as const,
        expectedMinFont: 1.0,
      },
    ];

    for (const tc of addressTestCases) {
      it(`Gerçek PDF üretiminde tam veri korunmalı ve yüksek okunabilirlik doğrulanmalıdır: ${tc.name}`, async () => {
        // Gerçek PDF üretimi
        const generated = await generateBelgeDocument("santiye-sefi-istifa-dilekcesi", {
          ...ISTIFA_DILEKCESI_DEFAULT_DATA,
          adres_deger: tc.text,
        });

        const pdfBytes = generated.bytes;
        // Üretilen PDF'in incelenmesi
        const inspection = await inspectPdfFieldAppearance(pdfBytes, "adres_deger");

        // 1. TAM VERİ KORUNMASI: Sıfır veri kesme/truncation
        assert.equal(
          inspection.storedLength,
          tc.text.length,
          `PDF AcroField içine tam metin (${tc.text.length} karakter) eksiksiz yazılmalıdır.`
        );
        assert.equal(inspection.storedValue, tc.text);

        // 2. FİZİKSEL WIDGET GEOMETRİSİ (ASAMA_06B İyileştirmesi)
        assert.equal(inspection.isMultiline, true, "adres_deger alanı iyileştirilmiş şablonda multiline: true olmalıdır.");
        assert.ok(
          Math.abs(inspection.rect.width - 225.0) < 5.0,
          `Widget genişliği ~225 pt olmalıdır (gerçek: ${inspection.rect.width}).`
        );
        assert.ok(
          Math.abs(inspection.rect.height - 36.0) < 5.0,
          `Widget yüksekliği ~36 pt olmalıdır (gerçek: ${inspection.rect.height}).`
        );

        // 3. FONT PUNTO YÜKSEK OKUNABİLİRLİK KANITI
        assert.ok(
          inspection.appearanceFontSizePt !== null && inspection.appearanceFontSizePt > 0,
          "DA içinde geçerli bir font boyutu bulunmalıdır."
        );
        assert.ok(
          inspection.appearanceFontSizePt >= tc.expectedMinFont - 0.2,
          `Font boyutu (${inspection.appearanceFontSizePt} pt) beklenen minimum değerden (${tc.expectedMinFont} pt) küçük olamaz.`
        );

        // Eski şablonun aksine, 84 ve 122 karakterde font boyutu asla 4 pt veya altına düşmez; >= 7.8 pt kalır
        if (tc.text.length <= 125) {
          assert.ok(
            inspection.appearanceFontSizePt >= 7.8,
            `125 karaktere kadar adres metni nominal fonta (~8.0 pt) yakın kalmalıdır (gerçek: ${inspection.appearanceFontSizePt} pt).`
          );
        }

        // 4. RUNTIME OKUNABİLİRLİK DEĞERLENDİRİCİSİ TUTARLILIĞI
        const assessment = assessFieldReadability(
          "santiye-sefi-istifa-dilekcesi",
          "adres_deger",
          tc.text, generated.layouts.adres_deger
        );
        assert.equal(assessment.risk, tc.expectedRisk);
      });
    }
  });

  // ---------------------------------------------------------------------------
  // 2. Diğer Dört Belgedeki Adres ve Yer Alanlarının Geometrisi
  // ---------------------------------------------------------------------------
  describe("Diğer Dört Belgedeki Adres ve Yer Alanlarının Fiziksel Özellikleri", () => {
    it("Sözleşme adres alanı (170 x 12 pt, 9.5 pt font) tek satırlıdır", async () => {
      const pdfBytes = await generateSozlesmePdf(SOZLESME_DEFAULT_DATA);
      const inspection = await inspectPdfFieldAppearance(pdfBytes, "adres");

      assert.equal(inspection.isMultiline, false);
      assert.ok(
        Math.abs(inspection.rect.width - 170.0) < 5.0,
        `Sözleşme adres alanı ~170 pt olmalıdır (gerçek: ${inspection.rect.width}).`
      );

      // Kısa adres sözleşmenin gövdesiyle aynı puntoda basılır.
      assert.equal(inspection.appearanceFontSizePt, 9.5);

      // Runtime değerlendirmesi
      const shortAssessment = assessFieldReadability(
        "santiye-sefi-sozlesmesi",
        "adres",
        "Atatürk Cad. No:10",
        await measureBelgeDraft("santiye-sefi-sozlesmesi", "adres", "Atatürk Cad. No:10")
      );
      assert.equal(shortAssessment.risk, "none");
    });

    it("Taahhütname adres alanları (~310-325 pt, 10.2 pt yükseklik, 9 pt font) tek satırlıdır", async () => {
      const pdfBytes = await generateTaahhutnamePdf(TAAHHUTNAME_DEFAULT_DATA);

      for (const fieldKey of ["adres", "yapi_adresi", "yapi_sahibi_adresi"]) {
        const inspection = await inspectPdfFieldAppearance(pdfBytes, fieldKey);
        assert.equal(inspection.isMultiline, false);
        assert.ok(
          inspection.rect.height < 12.0,
          `${fieldKey} alanı düşük yükseklikli tek satırdır (< 12 pt, gerçek: ${inspection.rect.height}).`
        );
        assert.equal(
          inspection.appearanceFontSizePt,
          9.0,
          `${fieldKey} üretilen PDF'de etiketle aynı 9 pt fonta sahip olmalıdır.`
        );
      }
    });

    it("İnşaat Ruhsatı adres alanı (451 x 44 pt) gerçek çok satırlı (multiline) alandır", async () => {
      const pdfBytes = await generateInsaatRuhsatiPdf(INSAAT_RUHSATI_DEFAULT_DATA);
      const inspection = await inspectPdfFieldAppearance(pdfBytes, "adres");

      assert.equal(inspection.isMultiline, true, "Ruhsat adres alanı multiline: true olmalıdır.");
      assert.ok(inspection.rect.width > 400, "Genişlik tam sayfa genişliğindedir (>400 pt).");
      assert.ok(inspection.rect.height > 30, "Yükseklik çok satırlı metne uygundur (>30 pt).");
      assert.equal(inspection.appearanceFontSizePt, 10.5);
    });

    it("Beton Döküm Tutanağı yer alanı (352.28 x 36 pt) çok satırlı alandır", async () => {
      const pdfBytes = await generateBetonDokumPdf(BETON_DOKUM_DEFAULT_DATA);
      const inspection = await inspectPdfFieldAppearance(pdfBytes, "yer");

      assert.equal(inspection.isMultiline, true);
      assert.ok(inspection.rect.width > 300, "Beton döküm yer alanı geniştir (>300 pt).");
      assert.ok(inspection.rect.height > 30, "Yükseklik çok satırlı metne uygundur (>30 pt).");
      assert.equal(inspection.appearanceFontSizePt, 9.0);
    });
  });

  // ---------------------------------------------------------------------------
  // 3. Kalibrasyon ve Güvenilirlik Sözleşmesi
  // ---------------------------------------------------------------------------
  describe("Kalibrasyon ve Güvenilirlik Sözleşmesi", () => {
    it("Tüm kritik geometriler CRITICAL_READABILITY_GEOMETRIES içinde tanımlı olmalıdır", () => {
      assert.ok(CRITICAL_READABILITY_GEOMETRIES["santiye-sefi-istifa-dilekcesi:adres_deger"]);
      assert.ok(CRITICAL_READABILITY_GEOMETRIES["santiye-sefi-taahhutnamesi:adres"]);
      assert.ok(CRITICAL_READABILITY_GEOMETRIES["santiye-sefi-taahhutnamesi:yapi_adresi"]);
      assert.ok(CRITICAL_READABILITY_GEOMETRIES["santiye-sefi-taahhutnamesi:yapi_sahibi_adresi"]);
      assert.ok(CRITICAL_READABILITY_GEOMETRIES["santiye-sefi-sozlesmesi:adres"]);
      assert.ok(CRITICAL_READABILITY_GEOMETRIES["insaat-ruhsati-dilekcesi:adres"]);
      assert.ok(CRITICAL_READABILITY_GEOMETRIES["beton-dokum-tutanagi:yer"]);
    });

    it("Ölçümü henüz olmayan alan için tahmini güvence verilmemelidir", () => {
      const res = assessFieldReadability("beton-dokum-tutanagi", "tutanak_alt_baslik", "Başlık");
      assert.equal(res.risk, "unknown");
      assert.equal(res.code, "readability-awaiting-layout");
      assert.equal(res.message, null);
    });

    it("assessFieldReadability çağrıları sıfır yan etki üretir ve < 1 ms hızında çalışır", () => {
      const start = performance.now();
      for (let i = 0; i < 500; i++) {
        assessFieldReadability(
          "santiye-sefi-istifa-dilekcesi",
          "adres_deger",
          "Uzun Örnek Adres Metni 12345"
        );
      }
      const duration = performance.now() - start;
      assert.ok(duration < 100, `500 değerlendirme ${duration.toFixed(2)} ms sürdü (hızlı olmalıdır).`);
    });
  });
});
