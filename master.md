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
