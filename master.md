# Mühendis Mimar Portalı — Değişmez Arayüz Kuralları

Bu dosya, site genelinde korunması gereken ürün ve arayüz kararlarını kaydeder. Tasarım yenilemeleri bu kuralları geçersiz kılamaz.

## Tema kontrolü

- Açık/koyu tema kontrolü, mevcut animasyonlu ay–güneş switch tasarımı olarak tüm sitede korunmalıdır.
- Tema kontrolü sade ikon düğmesine, metin düğmesine veya başka bir kontrol tipine dönüştürülmemelidir.
- Masaüstü navigasyonu ve mobil menüde aynı `ModeToggle` bileşeni kullanılmalıdır.
- Görsel yenilemeler switch'in davranışını, ay–güneş metaforunu veya temel görünümünü değiştirmemelidir.

## Tasarım sistemi

- Ana tasarım dili teknik, sade ve modern olmalıdır.
- Amber ana eylem/vurgu; mavi bilgi, bağlantı ve ikincil vurgu rengidir.
- Açık ve koyu tema birlikte ele alınmalı; mobil görünüm ve klavye erişilebilirliği korunmalıdır.
- Hesap araçlarının formülleri ve sayısal davranışı yalnızca görsel yenileme amacıyla değiştirilmemelidir.

## Ana sayfa kayan logosu

- Ana sayfada, geniş masaüstü ekranlarında kullanıcı sayfayı aşağı kaydırdığında navbar logosunun sol kenardaki sabit büyük logoya dönüşmesi korunmalıdır.
- Kayan logo davranışı, geçiş animasyonu, navbar logosuyla karşılıklı görünürlük yönetimi ve açık/koyu zemin kontrast uyarlaması kaldırılmamalı veya devre dışı bırakılmamalıdır.
- Mobil ve dar masaüstü görünümlerinde kayan logo alan kaplamamalı; navbar logosu normal şekilde görünür kalmalıdır.
- Ana sayfa yeniden tasarımlarında `HomeScrollLogo` bileşenine ve ilgili `homeLogoFloating` durumuna dokunulmamalıdır.

## Belgeler & Canlı PDF Stüdyosu Sistemi

Belgeler (`/belgeler`) modülüne yeni bir resmi evrak/şablon ekleneceğinde veya mevcut stüdyolarda geliştirme yapılacağında **[docs/BELGELER_SISTEMI.md](docs/BELGELER_SISTEMI.md)** ve **[.agents/rules/belgeler-kurallari.md](.agents/rules/belgeler-kurallari.md)** dosyalarındaki mimari standartlara uyulmalıdır:

1. **Hayalet Leke ve Yazı Önleme:** AcroForm alanları temizlendiğinde veya doldurulduğunda, `pdf-engine.ts` içinde hem field'dan hem de `field.acroField.getWidgets()` içindeki her widget'tan `AP` (Appearance Stream) ve `DV` (Default Value) kayıtları temizlenmelidir.
2. **Font Ayrımı:** Gövde metinleri ve açıklamalar **daima Regular (Arial-Regular)**; başlıklar, ad-soyad ve kurum isimleri **Bold (Arial-Bold)** olmalıdır.
3. **Masaüstü Dış Kaydırmasız Düzen (Zero Window Scroll):** Stüdyolar masaüstünde `100vh` tam ekran görünümüne oturmalı; tarayıcı penceresinde dış kaydırma çubuğu çıkmamalı, sol form kendi içinde kaymalı, sağ PDF tam sığmalıdır.
4. **Anlık Zoom (60fps):** Zoom butonları veya `Ctrl + Mouse Wheel` ile yakınlaştırma yapılırken PDF sıfırdan derlenmemeli, önbellekteki PDF.js dokümanı anlık olarak canvas'a yeniden çizilmelidir.
5. **Kullanıcıyı Engellemeyen Validasyon:** Karakter sınırlarında (örn. YİBF >7 hane) kullanıcı uyarılmalı ve input kırmızıya dönmeli ancak **yazması asla engellenmemelidir.**
6. **Yalın Başlıklar:** Son kullanıcı arayüzünde `(AcroForm)` gibi yazılımsal terimler kesinlikle kullanılmamalıdır.

