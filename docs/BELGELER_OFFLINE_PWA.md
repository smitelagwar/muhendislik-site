# Belgeler PWA — sürüm 2 / operasyon ve güvenlik

## Kapsam
Yalnız /belgeler ve beş form stüdyosu; \`public/belgeler-sw.js\` dar kapsamlı bir SW'dir. İlk kullanımdan önce internetteyken katalogdan **Çevrimdışı kullanıma hazırla** tamamlanmalıdır; hazır olma ancak gerçek PDF.js canvas testinden sonra gösterilir. PDF şablonları, yerel fontlar ve gerekli dinamik JS saklanır; /api, /b, kişisel PDF çıktıları ve CAD/DWG/DXF hiçbir zaman cache'e alınmaz. Ana site PWA kapsamına girmez.

## Kişisel veri ve kayıt
Mevcut, read-back doğrulamalı **2.000 ms localStorage taslağı** değişmeden kalmıştır. Yeni IndexedDB \`belgeler-offline-share-v1/intents\` yalnız kullanıcı tarafından açıkça istenen sunucu paylaşımının **belge türünü, şema/fingerprint özetini, idempotent istek kimliğini, tekrar kanıtını, zamanını ve işleme durumunu** tutar. Kişisel form verileri ikinci bir kopya olarak kuyruğa yazılmaz. Bu veriler de cihazda yereldir; gizli/özel tarayıcı, kota, iOS data eviction durumunda kalıcılık garanti değildir.

## Paylaşım
Offline "Bağlantı gelince paylaş" niyeti cihazda tutulur ama **gerçek URL oluşturulmaz**. Uygulama açık ve görünürken iki başarılı cache-dışı \`/belgeler-connectivity.txt\` probe sonrası kullanıcıdaki güncel form içeriğinin SHA-256 özeti ve şeması eşleşirse mevcut /api/belgeler/paylasim API'sine gidilir. Önce /islem/{clientRequestId} ile sonucu sorgulanır; aynı clientRequestId/replayProof tekrar kullanılır. Yanıt/HTTP-kimlik/kota hatası kullanıcıya gösterilir; eski belge değişmişse kuyruğun otomatik gönderimi engellenir. Aynı doküman ID için atomik IDB iş kaydı ve lease iki sekmede tek mantıksal niyet sağlar. Background Sync veya Push kullanılmaz. İşlem başarıyla sonuçlanmadan "Link hazır" söylenmez.

## Kurulum ve yenileme
Android Chrome uygunsa tarayıcı prompt'u ile kurulum yapılır; Safari/iOS'ta Paylaş → Ana Ekrana Ekle. Normal sekme de çalışır. SW sürümü değiştirilirken \`belgeler-offline-vN\` artırılır. Sayfa kullanıcı onayı olmadan \`skipWaiting\` ile yeniden yüklenmez. Eski kaynaklar açık sekme için bir süre tutulur; temizlik ile taslaklar asla toplu silinmez. Uygulama açıkken otomatik güncelleme mümkün değilse kullanıcı yeniden açar. 
## Temizlik / geri dönüş
**Çevrimdışı dosyaları sil** yalnız \`belgeler-offline-*\` Cache Storage'ı temizler; taslak, PDF çıktısı veya IndexedDB'deki paylaşımlar silinmez. Bekleyen istek ayrıca share dialog içinde iptal edilir; aktif server işleminde iptal tuşu kapalıdır. \`NEXT_PUBLIC_BELGELER_OFFLINE_PWA=0\` yeni kayıtları engeller; eski worker kontrolünde farklı build'te geri alma için telafi SW gerekebilir. Cache'te PII aranmalı; /api/* ve /b/* no-store kuralı sürekli korunmalıdır.

## Kabul
TypeScript + ESLint + production build + gerçek offline 5/5 PDF raster testi + çevrimdışı outbox/çift gönderim testi + form değişikliği engelleme + cache temizlik/draft koruma + mobil Chromium ve WebKit. Gerçek fiziksel cihaz testi bağlanamıyorsa yapılmış gibi gösterilmez. Aşama 3 başlamadan GitHub CI sonuçları PASS olmalı. Preview ve Production deploy Aşama 3'tedir.
