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

> *(Not: Mevcut göreviniz `/belgeler` sayfası veya PDF stüdyosu ile ilgili DEĞİLSE bu bölümü ve referans verilen dosyaları okumanıza gerek yoktur.)*

Belgeler modülünde çalışacak yapay zeka ajanları ve geliştiriciler için yaşanmış tecrübeler, hata çözümleri ve tavsiyeler **[docs/BELGELER_SISTEMI.md](docs/BELGELER_SISTEMI.md)** ve **[.agents/rules/belgeler-kurallari.md](.agents/rules/belgeler-kurallari.md)** dosyalarında derlenmiştir. 

**Özet Tecrübe Notları:**
1. **Leke ve Hayalet Yazı:** AcroForm temizleme işlemlerinde hem field hem de `field.acroField.getWidgets()` seviyesinde `AP` ve `DV` akışları temizlenmelidir (leke kalmaması için).
2. **Font Dengesi:** Gövde metinleri `Arial-Regular` (ince), başlık ve isimler `Arial-Bold` olmalıdır.
3. **Masaüstü Düzende Dış Kaydırma:** Stüdyolarda dış pencere scroll'u yerine, sol form paneli kendi içinde kaymalı (`overflow-y-auto`), sağ PDF ise dikeyde tam sayfaya sığmalıdır.
4. **Anlık Zoom (60fps):** Yakınlaştırmada PDF yeniden derlenmemeli, önbellekteki PDF.js dokümanı üzerinden sadece canvas anlık çizilmelidir.
5. **Kullanıcıyı Engellemeyen Validasyon:** Belirli hane kurallarında (örn. YİBF >7 hane) kullanıcı uyarılmalı ancak yazması engellenmemelidir.


