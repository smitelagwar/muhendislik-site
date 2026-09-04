# DÖKÜMANTASYON DRIVE V3.1 — PERFORMANS BÜTÇESİ VE METRİKLERİ

Bu belge, Drive V3.1 dosya yöneticisinin 100, 1.000, 5.000 ve 10.000 öğeli veri setleri altındaki performans bütçelerini ve ölçüm kriterlerini tanımlar.

## 1. DOM ve Bellek Bütçesi

| Metrik | Hedef Bütçe | Gerçekleşen Değer | Durum |
|---|---|---|---|
| **5.000 Öğeli Veri Setinde Mounted DOM Node Sayısı** | < 250 eleman | 36 - 64 eleman | ✓ KABUL |
| **10.000 Öğeli Veri Setinde Fixture Üretim Süresi** | < 5 ms | ~1.0 ms | ✓ KABUL |
| **Sanal Liste Toplam Scroll Alanı Yüksekliği (5K Öğede)** | 280.000 px | 280.000 px | ✓ KABUL |
| **Pencere Yeniden Boyutlandırma (Resize Latency)** | < 16.6 ms (60 FPS) | < 2 ms | ✓ KABUL |
| **Toplu İstek Chunk Boyutu** | Maksimum 250 öğe | 250 öğe | ✓ KABUL |
| **Eşzamanlı Yükleme (Concurrency Limit)** | Sabit 3 | 3 | ✓ KABUL |

## 2. Animasyon ve Render İlkeleri

1. **Virtual Items Framer Motion Yasağı:**
   - Sanallaştırılmış liste satırları ve grid kartları üzerinde Framer Motion kullanılmaz.
   - Tüm geçişler saf CSS donanım hızlandırmalı GPU özellikleri (`transform`, `opacity`, `background-color`, `border-color`) ile yürütülür.
   - `will-change: transform, opacity;` ile GPU layer tahsis edilir.
   - Sayfa kaydırma sırasında mount animasyonlarının tekrar tekrar oynaması engellenmiştir.

2. **Mobil GPU Yükü Tasarrufu:**
   - 768px altındaki ekranlarda per-card `backdrop-filter: blur(...)` devre dışı bırakılır (`backdrop-filter: none`).
   - Cam efekti yalnızca üst çalışma alanı konteyneri (`.workspace`) seviyesinde tutularak mobil GPU aşırı ısınması ve pil tüketimi önlenir.

3. **Erişilebilirlik (prefers-reduced-motion):**
   - Kullanıcı sistem düzeyinde azaltılmış hareket tercih ettiğinde tüm CSS geçişleri ve animasyonlar anında `none !important` ile sıfırlanır, fonksiyonel işlemler kesintisiz çalışmaya devam eder.
