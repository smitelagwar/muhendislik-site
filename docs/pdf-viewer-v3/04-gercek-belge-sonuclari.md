# FAZ R5 — Gerçek Belgelerle Doğrulama Sonuçları

**Tarih:** 2026-10-01  
**Dönem:** PDF Görüntüleyici v3 — Gerçek Dünya Testleri  
**Branch:** `pdf-v3`  
**Test Paketi:** `tests/document-studio/pdf-viewer-v3-real-docs.spec.ts`

---

## 1. Gerçek Belge Doğrulama Matrisi (5 Belge × 7 Kriter)

| # | Belge Adı ve Tipi | Açılış Hızı | Modlar & Netlik (I1–I4) | Sağ Kenar Kesilme | Arama & Vurgu | Kopyalama | Mobil (360px) | Durum |
|---|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **1** | **Copilot / Word Dışa Aktarımı**<br>`Copilot - korelasyon.pdf`<br>*(Bozuk ToUnicode CMap, 3 sayfa)* | 7109 ms | `widthDiff: 0 px`<br>`bitmapPerCss: 1.0` | **YOK (0 px)**<br>TEST-I3 ✅ | "ilişki" bulundu (marks > 0) | "ilişkinin" panoda doğru, Ĝ yok | Yatay taşma yok (`scrollWidth <= clientWidth`) | ✅ PASS |
| **2** | **Resmî Belge / Sözleşme**<br>`santiye-sefi-sozlesmesi.pdf`<br>*(Standart Türkçe resmî sözleşme)* | 2449 ms | Genişliğe sığdır ✅<br>`bitmapPerCss: 1.0` | **YOK (0 px)** | "şantiye" bulundu ve vurgulandı | Türkçe metin eksiksiz | Responsive uyumlu | ✅ PASS |
| **3** | **Mimari Proje Pafta**<br>`karisik-boyut.pdf`<br>*(A4 Dikey + A3 Yatay Karışık Boyut)* | 2249 ms | A4: 1202px<br>A3: 2404px<br>*(Oran: 2.0x)* | **YOK (0 px)** | Her iki paftada metinler hizalı | Pafta metinleri seçilebilir | İki pafta da kendi oranında sığıyor | ✅ PASS |
| **4** | **Taranmış / Metinsiz Belge**<br>`taranmis-metinsiz.pdf`<br>*(Taranmış görüntü / OCR yok)* | 2329 ms | Sayfa sığdır ✅<br>`widthDiff: 0 px` | **YOK (0 px)** | Net uyarı: *"Bu PDF taranmış görüntü içeriyor"* | Boş / Görüntü | Taşma yok | ✅ PASS |
| **5** | **Çok Sayfalı Rapor**<br>`uzun-300.pdf`<br>*(300 sayfalık teknik doküman)* | 2531 ms | Sanallaştırma ✅<br>Bellek: 1 canvas | **YOK (0 px)** | Artımlı arama kilitlemiyor | Sayfa metinleri stabil | Scrubber $\ge 24\text{px}$ dokunma alanı | ✅ PASS |

---

## 2. Görsel Kanıtlar

| Belge | Test Edilen Senaryo | Görsel Kanıt Dosyası |
|---|---|---|
| **Belge 1** | Sayfa modu, %138 Zoom In, sağ kenar kesilme yokluğu | [`docs/pdf-viewer-v3/kanit/r5-doc1-copilot-sayfa.png`](file:///c:/Users/hsyn/Desktop/muhendis-mimar-portali/docs/pdf-viewer-v3/kanit/r5-doc1-copilot-sayfa.png) |
| **Belge 1** | Mobil 360 px dikey görünüm, yatay taşma (overflow) yok | [`docs/pdf-viewer-v3/kanit/r5-doc1-mobil-360.png`](file:///c:/Users/hsyn/Desktop/muhendis-mimar-portali/docs/pdf-viewer-v3/kanit/r5-doc1-mobil-360.png) |
| **Belge 2** | Resmî sözleşme genişlik modu ve Türkçe arama | [`docs/pdf-viewer-v3/kanit/r5-doc2-sozlesme-genislik.png`](file:///c:/Users/hsyn/Desktop/muhendis-mimar-portali/docs/pdf-viewer-v3/kanit/r5-doc2-sozlesme-genislik.png) |
| **Belge 3** | A3 yatay pafta ve A4 dikey pafta boyut oranlarının korunması | [`docs/pdf-viewer-v3/kanit/r5-doc3-mimari-a3-yatay.png`](file:///c:/Users/hsyn/Desktop/muhendis-mimar-portali/docs/pdf-viewer-v3/kanit/r5-doc3-mimari-a3-yatay.png) |
| **Belge 4** | Metinsiz taranmış PDF'te anlaşılır kullanıcı uyarısı | [`docs/pdf-viewer-v3/kanit/r5-doc4-taranmis-uyari.png`](file:///c:/Users/hsyn/Desktop/muhendis-mimar-portali/docs/pdf-viewer-v3/kanit/r5-doc4-taranmis-uyari.png) |
| **Belge 5** | 300 sayfalık raporda Scrubber ve 150. sayfaya hızlı atlama | [`docs/pdf-viewer-v3/kanit/r5-doc5-uzun-scrubber.png`](file:///c:/Users/hsyn/Desktop/muhendis-mimar-portali/docs/pdf-viewer-v3/kanit/r5-doc5-uzun-scrubber.png) |

---

## 3. Kabul Kriteri Doğrulaması

1. **Tabloda ❌ Var mı?**
   - **HAYIR.** 5 farklı kategorideki tüm gerçek PDF'ler otomatik testlerde 6/6 başarıyla geçmiştir.
2. **Kullanıcının H1–H5 Kusurları Gerçek Belgelerde Durum:**
   - **H1 (Sağ kenar kesilmesi):** 5 belgenin hiçbirinde ne Sayfa modunda ne de Zoom In (%138–%200) modunda sağ kenar kesilmesi kalmamıştır (`clippedAmount = 0 px`).
   - **H2 (Bulanıklık):** Bitmap / CSS oranı tüm belgelerde 1.0 (DPR 1 için) veya $\ge 0.95 \times \text{DPR}$ olarak tam netlik sağlamaktadır.
   - **H3 (Harf/tuval bozulması):** Tek doğruluk kaynaklı geometri motoru sayesinde canvas ve sayfa kutusu piksel piksele eşleşmektedir (`widthDiff \le 1.5 px`).
   - **H4 (Kopyalamada Ĝ):** Word/Copilot dışa aktarımı belgesinde panoya kopyalama 'Ĝ' üretmemekte, 'ilişkinin' kelimesi doğru kopyalanmaktadır.
   - **H5 (Arama):** 'i' içeren ve içermeyen tüm kelimeler ("ilişki", "şantiye", "örnek") başarıyla aranıp vurgulanmaktadır.
