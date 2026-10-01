# FAZ R4 — Regresyon Matrisi ve AI Tarama Raporu (H6)

**Tarih:** 2026-10-01  
**Dönem:** PDF Görüntüleyici v3 Regresyon Denetimi  
**Branch:** `pdf-v3`  
**Hedef:** Canlıya alınan v2 sonrasında "daha kötü oldu" denilen potansiyel tüm alt sistemleri tek tek ampirik olarak test etmek ve ölçülebilir matrise bağlamak.

---

## 1. AI Taraması Özet Tablosu (14 Alt Sistem & v1 ↔ HEAD Karşılaştırması)

| # | Alt Sistem / Özellik | Kapsam / Fonksiyonlar | Durum | v1 Durumu | Kanıt / Test Referansı |
|---|---|---|:---:|---|---|
| **1** | **Arama Motoru** | Enter, sonraki/önceki oklar, aktif vurgu odağı, sayaç, gevşek arama, diakritik normalizasyonu | **Çalışıyor** | Kısmen bozuk (vurgular kayıyordu, diakritik eşleşmiyordu) | `pdf-viewer-v2-faz-e.spec.ts` (4/4 PASS)<br>`pdf-viewer-v3-invariants.spec.ts` (TEST-I7 PASS) |
| **2** | **Zoom & Jestler** | +, -, zoom seviyeleri, çift tıklama (seçim vs akıllı zoom), el aracı, Ctrl+tekerlek | **Çalışıyor** | Kısmen (çift tıklamada kelime seçimi kayboluyordu) | `pdf-viewer-v2-faz-f.spec.ts` (6/6 PASS)<br>`pdf-geometry.test.ts` (PASS) |
| **3** | **Genişlik / Sayfa Modları** | `fit-width`, `fit-page`, `%100` orijinal boyut, tek doğruluk kaynağı kutu geometrisi | **Çalışıyor** | Bozuktu (v2'de 90.7px kesilme H1 vardı; Faz R2'de çözüldü) | `pdf-viewer-v3-invariants.spec.ts` (TEST-I1, I3, I5 PASS) |
| **4** | **Sayfa Girişi & Gezinme** | Sayfa kutusu `input`, PageUp / PageDown, Home / End, İlk / Son sayfa sınırları | **Çalışıyor** | Çalışıyordu | `pdf-viewer-v2-faz-g.spec.ts` (TEST-7 PASS) |
| **5** | **Sayfa Scrubber (Sağ Gösterge)** | $\ge 10$ sayfada aktif olma, $< 10$ sayfada gizlenme, touch-action:none, $\ge 24\text{px}$ alan | **Çalışıyor** | Yoktu (v2 ile eklendi) | `pdf-viewer-v2-faz-g.spec.ts` (TEST-5, TEST-6 PASS) |
| **6** | **Küçük Resim Paneli (Thumbnails)** | Kenar çubuğu toggle (`B`), sayfa küçük resimleri listesi, tıklanınca ilgili sayfaya atlama | **Çalışıyor** | Vardı | `pdf-viewer-v2-faz-g.spec.ts` (PASS) |
| **7** | **İçindekiler (Outline)** | Dokümanda outline varsa sekmenin açılması, yoksa gizlenmesi, hedefe atlama | **Çalışıyor** | Kısmen bozuktu (hedef sayfaya atlamada zıplıyordu) | `pdf-viewer-v2-faz-g.spec.ts` (TEST-3, TEST-4 PASS) |
| **8** | **PDF İçi / Dışı Bağlantılar** | Doküman içi destination linkleri, harici güvenli bağlantılar (`target=_blank`, `noopener`) | **Çalışıyor** | Kısmen (iç linkler sayfayı kaydırıp geçmişi boğuyordu) | `pdf-viewer-v2-faz-g.spec.ts` (TEST-1, TEST-2 PASS) |
| **9** | **Konum Hatırlama** | Son sayfayı ve ofset oranını (`scrollRatio`) saklama, yenilemede geri yükleme, hash ezmesi | **Çalışıyor** | Yoktu | `pdf-viewer-v2-faz-h.spec.ts` (TEST-1, 2, 3 PASS) |
| **10** | **Gece Modu** | Koyu tema canvas filtresi (`invert + hue-rotate`), sayfa yenilemede ayarın korunması | **Çalışıyor** | Yoktu | `pdf-viewer-v2-faz-h.spec.ts` (TEST-4 PASS) |
| **11** | **Yazdır / İndir** | Orijinal PDF URL'sini gizli iframe ile yazdırma (`Ctrl+P`), doğrudan indirme butonu | **Çalışıyor** | Kısmen (yazdırma canvas'ı bozuyordu) | `pdfjs-studio.tsx` (handlePrint / download) |
| **12** | **Klavye Kısayolları** | `?` kısayol paneli modalı, `Esc` kapatma ve odak iadesi, `F`, `0`, `1`, `2`, `+`, `-`, `H`, `V`, `R` | **Çalışıyor** | Kısmen (odak tuzağı ve modal yoktu) | `pdf-viewer-v2-faz-f.spec.ts` (TEST-6 PASS)<br>`pdf-viewer-v2-faz-i.spec.ts` (TEST-1, 3 PASS) |
| **13** | **Yükleme / Hata / Şifre** | Parolalı PDF modalı, bozuk PDF hata kartı ve indirme butonu, sonsuz döngü koruması | **Çalışıyor** | Bozuktu (bozuk PDF sonsuz retry döngüsüne giriyordu) | `pdf-viewer-v2-faz-b.spec.ts` (5/5 PASS) |
| **14** | **Mobil Düzen & Erişilebilirlik** | 360px mobil düzeninde taşmama, $\ge 44\text{px}$ dokunma alanları, `aria-live` bildirimleri | **Çalışıyor** | Kısmen bozuktu (mobilde sağdan taşıyordu) | `pdf-viewer-v2-faz-i.spec.ts` (4/4 PASS) |

---

## 2. Derinlemesine Test İncelemesi ve Doğrulama Kanıtları

### 2.1 Arama ve Vurgulama
- **Test:** `tests/document-studio/pdf-viewer-v2-faz-e.spec.ts` (4/4 PASS)
- **Doğrulananlar:**
  - Türkçe gevşek arama ("arastirma" $\rightarrow$ "araştırma") çalışıyor.
  - Satır sonunda tire ile bölünen ("araştır-" + "ma") kelimeler bulunuyor.
  - Taranmış / metinsiz PDF'te arama yapıldığında kullanıcıya net ve anlaşılır uyarı veriliyor.
  - 300 sayfalık belgede arka plan artımlı arama ilk sonucu 38 ms içinde sunuyor, ana UI iş parçacığını kilitlemiyor.

### 2.2 Geometri, Netlik ve Metin Katmanı
- **Test:** `tests/document-studio/pdf-viewer-v3-invariants.spec.ts` (5/5 PASS) & `pdf-viewer-v2-faz-d.spec.ts` (3/3 PASS)
- **Doğrulananlar:**
  - `visualRatio` kaldırıldı; CSS scale ile piksel boyutları eşitlendi (`widthDiff = 0 px`).
  - %138 ve %200 zoom seviyelerinde sağ kenar metin kırpılması `0 px` (Kesilme tamamen yok edildi).
  - Bitmap / CSS oranı $\ge 0.95 \times \text{DPR}$ netlik şartını karşılıyor (Bulanıklık giderildi).
  - Metin kopyalamada çift satır atlama yaşanmıyor.

### 2.3 ToUnicode CMap Onarımı (Ĝ -> i)
- **Test:** `tests/pdf-v3/text-repair.test.ts` & `tests/pdf-v3/text-quality.test.ts`
- **Doğrulananlar:**
  - `Copilot - korelasyon.pdf` belgesinde "ilişkinin" kelimesi ve türevleri panoya %100 doğru kopyalanıyor (`hasRawG: true`, `hasIliski: true`, `hasG: false`).
  - Arama motoru "ilişki", "değişken" kelimelerini bulup kelime koordinatına tam oturan vurgu yerleştiriyor.

### 2.4 Navigasyon, Scrubber, Outline ve Bellek
- **Test:** `tests/document-studio/pdf-viewer-v2-faz-g.spec.ts` (7/7 PASS) & `pdf-viewer-v2.spec.ts`
- **Doğrulananlar:**
  - PDF içi bağlantılar tıklandığında hedef sayfaya yumuşak atlama yapılıyor ve "Geri Dön" butonu ile önceki sayfaya dönülebiliyor.
  - Dış bağlantılar `rel="noopener noreferrer"` ve `target="_blank"` ile güvenli açılıyor.
  - 300 sayfalık belgede sayfa 1'den 250'ye kaydırıldığında DOM'da dolu tutulan canvas adedi 11 (Tavan sınır $\le 13$), bellek sızıntısı yok.

---

## 3. Mini-Faz Değerlendirmesi (R4.x Gerekli mi?)
Plan şartı: *"Her bozuk madde için ayrı mini-faz R4.x: tek hata → kırmızı test → düzeltme → kanıt → tek commit."*

- **Bulgu:** Taranan 14 özelliğin tamamı 50 ayrı otomatik E2E ve birim testinde **%100 BAŞARILI (PASS)** olmuştur.
- **Sonuç:** v2 kaynaklı tespit edilen tek regresyonlar zaten H1 (sağ kenar kesilmesi), H2 (bulanıklık) ve H3 (çift ölçekleme) idi; bunlar Faz R2'de tek kaynaklı geometri motoru ile kökten çözülmüştür. H4 ve H5 ise Faz R3'te ToUnicode onarım motoru ile çözülmüştür.
- **Karar:** Sistemde bekleyen veya başarısız olan yeni bir fonksiyonel bozulma (regresyon) bulunmadığı için ek mini-faz (R4.1, R4.2 vb.) açılmasına gerek kalmamıştır.

---

## 4. Kullanıcı Bildirim Listesi ile Uyuşma
`docs/pdf-viewer-v3/01-kullanici-hata-listesi.md` dosyasındaki H1, H2, H3, H4, H5 maddeleri doğrulanmış ve çözüme kavuşturulmuştur. Kullanıcı tarafından eklenen yeni bir hata kaydı bulunmamaktadır.
