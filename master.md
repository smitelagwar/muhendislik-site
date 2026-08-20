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

## 🔒 Dökümantasyon Modülü Kuralı (ZORUNLU)

Bu projede `/dokumantasyon` altında çalışan; tek admin girişli, özel dosya/klasör saklama, süreli paylaşım linki üretme ve `/p/[token]` üzerinden kontrollü indirme sağlayan ayrı bir Dökümantasyon modülü vardır.

**Yalnızca Dökümantasyon modülüyle doğrudan ilgili bir görev geldiğinde**, kod değişikliğine başlamadan önce proje kökündeki `dokumantasyon.md` dosyasını baştan sona oku. Oradaki güncel mimari, veri, güvenlik ve test kurallarını uygula. Görev tamamlandığında `dokumantasyon.md` dosyasını gerçek değişikliklerle güncelle.

Dökümantasyon kapsamına giren örnek işler:

- `/dokumantasyon` admin ekranı ve login/session,
- Dökümantasyon dosya/klasör DB ve Blob işlemleri,
- süreli share linkleri,
- `/p/[token]` public paylaşım sayfası,
- Dökümantasyon download/ZIP API'leri,
- Dökümantasyon güvenlik, backup ve migration işleri.

**Bu kural sitenin diğer bölümleri için geçerli değildir.** Ana Sayfa, Mevzuat, Hesaplamalar, Araçlar, Bina Aşamaları, `/belgeler` ve PDF stüdyoları gibi Dökümantasyon dışı işlerde sırf bu dosya var diye `dokumantasyon.md` okuma.

`/belgeler` ile `/dokumantasyon` birbirinden ayrı sistemlerdir.

## 🚀 Vercel CLI & Canlı / Preview Dağıtım ve Test Kuralları

Proje Vercel CLI ile `muhendislik-site` (`huseying5713-2819s-projects`) projesine kalıcı olarak bağlanmıştır (`vercel link`). CLI kimlik doğrulaması (`vercel whoami`, `vercel list`, `vercel env ls`) tamamlanmıştır.

### Dağıtım ve Test İlkeleri:
1. **Preview ve Smoke Testleri Atlama:** Görev/plan adımlarında belirtilen Vercel Preview ve Production smoke testlerini ASLA atlama.
2. **Otonom Preview Oluşturma:** Test ve doğrulama için Preview gerekiyorsa ajan doğrudan CLI ile preview oluşturmalı (`vercel`), dönen canlı URL'i kontrol etmeli ve smoke testleri gerçekleştirmelidir.
3. **Canlı/Preview Doğrulama:**
   - DB / Neon, Blob depolama ve Auth/Admin gibi backend değişkenlerinin Vercel ortamlarında (`Production, Preview`) eksiksiz olduğunu `vercel env ls` ile teyit et.
   - İhtiyaç halinde yerel env dosyasını güncellemek için `vercel env pull .env.local` kullan.
   - Dağıtım sonrası ilgili URL üzerinde kritik rotaların (Ana sayfa, `/dokumantasyon`, `/belgeler`, `/p/[token]` vb.) HTTP durum kodlarını ve arayüz/API yanıtlarını doğrula.
4. **Temel CLI Komutları:**
   - `vercel whoami` : Kullanıcı ve oturum durumu
   - `vercel list` : Son deploy durumları ve URL'leri
   - `vercel env ls` : Ortam değişkeni listesi
   - `vercel` : Yeni preview dağıtımı
   - `vercel --prod` : Doğrudan production dağıtımı (gerektiğinde)
   - `vercel logs <deployment-url>` : Canlı log analizi

