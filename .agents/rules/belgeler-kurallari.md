# Belgeler & Canlı PDF Stüdyosu Geliştirme Kuralları

Bu kural dosyası, Mühendis Mimar Portalı'nın **Belgeler (`/belgeler`)** modülü üzerinde çalışacak tüm yapay zeka ajanları ve geliştiriciler için bağlayıcı kuralları tanımlar.

Detaylı teknik mimari ve adım adım yeni belge ekleme rehberi için [docs/BELGELER_SISTEMI.md](file:///c:/Users/hsyn/Desktop/muhendis-mimar-portali/docs/BELGELER_SISTEMI.md) dosyasını inceleyin.

---

## 1. PDF & AcroForm Yönetimi (Değişmez Kurallar)

1. **Hayalet Yazı / Leke Önleme (AP & DV Temizliği):**
   - PDF şablonlarında form alanları doldurulurken veya temizlenirken, `pdf-lib` içerisinde sadece field dict'i değil, `field.acroField.getWidgets()` içindeki her bir widget annotation'ın `AP` (Appearance Stream) ve `DV` (Default Value) dictionary kayıtları **kesinlikle silinmelidir.** Aksi takdirde boşaltılan alanlarda leke ve hayalet metinler belirir.

2. **Font Kalınlıkları:**
   - Gövde metinleri, açıklamalar ve sonuç/talep cümleleri **daima Regular (Arial-Regular)** font ile yazılmalıdır; kalın (bold) yapılmamalıdır.
   - Sadece başlıklar, kurum isimleri, ad-soyad ve tarih gibi alanlar **Bold (Arial-Bold)** olmalıdır.
   - `pdf-engine.ts` içindeki `FIELD_SPECS`'te `bold: false` ve `bold: true` ayrımları doğru belirtilmelidir.

3. **Metin Hizalama (Quadding - Q):**
   - Paragraf ve adresler `q: 0` (sola yaslı), başlık ve isimler `q: 1` (ortalı), imza alanları `q: 2` (sağa yaslı) olmalıdır.

4. **Yazılımsal İfadelerin Temizliği:**
   - Başlıklarda veya butonlarda `(AcroForm)`, `(PDF Engine)` gibi yazılımsal ve teknik ifadeler kesinlikle kullanılmamalıdır.

---

## 2. Kullanıcı Arayüzü & Stüdyo Standartları

1. **Zero Window Scroll (100vh Tam Sayfa):**
   - Masaüstü görünümünde tarayıcının ana gövdesinde dikey kaydırma çubuğu çıkmamalıdır. Sol form paneli kendi içinde scroll olmalı (`overflow-y-auto`), sağ PDF önizlemesi dikeyde ekrana tam sığmalıdır.

2. **Anlık Zoom (60fps - Yeniden Derleme Yok):**
   - Zoom seviyesi değiştirildiğinde (butonlar veya `Ctrl + Mouse Wheel`) PDF yeniden compile edilmemeli (`syncStatus: 'updating'` yapılmamalıdır). Önbelleğe alınmış PDF.js belgesi üzerinden anlık canvas render yapılmalıdır.

3. **Yerel Sıfırlama Butonları:**
   - Her form kutucuğunun yanında, alan değeri varsayılandan farklıysa beliren `↺ Sıfırla` butonu olmalıdır; varsayılana dönüldüğünde buton otomatik gizlenmelidir.

4. **Kullanıcıyı Engellemeyen Validasyon:**
   - Karakter sınırı vb. kurallarda (örn. YİBF 7 hane kuralı) kullanıcı uyarılmalı ve alan kırmızıya dönmeli, ancak **yazması asla engellenmemelidir.**

5. **Standart 5 Aksiyon:**
   - `Sıfırla`, `Temizle`, `Boş Form`, `Yazdır` ve `Doldurulmuş PDF'i İndir` butonları tüm stüdyolarda yer almalıdır.

6. **Mobil Deneyim:**
   - Mobil ekranlarda segmented tab switcher (`Form Alanları` / `Canlı PDF Önizle`) bulunmalıdır.
