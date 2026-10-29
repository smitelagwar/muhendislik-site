# Belgeler çevrimdışı PWA — 1. aşama uygulama notları

**Temel commit:** a86724e82ac37665e06d58c9845e8a05cd9f8ff2  
**Çalışma dalı:** feat/belgeler-offline-pwa-stage1-20261029  
**Kapsam:** Yalnız /belgeler ve mevcut beş stüdyo. Production deploy yok.

## Değişmeyen sözleşmeler

- PDF motoruna, PDF.js render davranışına, 2.000 ms otomatik taslak motoruna ve tüm mevcut form alanı şemalarına dokunulmaz.
- Mevcut taslaklar localStorage'da kalır. Background Sync, yeni share API veya bulut senkronu eklenmez.
- Hazırlık butonu kataloğa eklenir. İlk kurulum internet gerektirir; toplu indirme ancak kullanıcı tıklarsa başlar.
- Üçüncü taraf içerikleri, /api/*, /b/*, /dokumantasyon, hsynCAD, CAD/DWG/DXF, simülasyonlar ve kullanıcıya özel PDF'ler asla Cache Storage'a alınmaz.

## Mimarinin özü

- \`public/belgeler-sw.js\`: Navigasyon için network-first + bounded fallback; yalnız izinli anonim HTML, hash'li Next statikleri, beş ham PDF, PDF.js ve PDF font varlıklarını cache'ler. RSC/prefetch ve özel endpoint'ler atlanır.
- \`src/lib/belgeler-offline-client.ts\`: Açık kullanıcı eylemiyle 5 formu sırayla gerçek PDF.js canvas çizimine kadar yükler. Ardından kısa ömürlü, SW'nin yalnız **cache'ten** yanıt verdiği iframe'de PDF çizimini yeniden doğrular. Bu deneme gerçek donanımın uçak modu testinin yerini tamamen tutmaz.
- \`src/app/belgeler/layout.tsx\`: HTML DOM sarıcısı olmadan, yalnız Belgeler rotalarına PWA manifest metadata'sı ve kayıt bileşeni ekler.
- \`src/components/belgeler-offline-runtime.tsx\`: Prod/HTTPS ortamında idle SW kaydı. Offline iken internal Next.js RSC geçişi yerine tam sayfa Belgeler navigasyonu.
- \`public/belgeler-pwa.webmanifest\` ve \`/belgeler-pwa-icon/{180,192,512}\`: Belgeler'e özgü kurulum kimliği.
- Gizli alan değerleri SW/cache URL'lerine taşınmaz; durumu bildiren kayıt sadece sürüm ve kontrol sonucu tutar.

## Hazır olma şartı ve sınırlamalar

- Katalog dahil altı HTML rotası, zorunlu PDF/font/PDF.js dosyaları ve gerçek canvas oluşturma denetimleri geçmeden \`Çevrimdışı hazır\` sunulmaz.
- Cache'in silinmesi, tarayıcı özel modu veya kota aşımı sonrası yeniden hazırlama gerekir. PWA kurulumu tek başına çevrimdışı hazır olmak demek değildir.
- iOS/Safari/Android telefonlarda ağın gerçekten kapatılması ve uygulamanın soğuk açılış testi ayrıca yapılmalıdır.
- Bu aşama **paylaşım kuyruğunu içermez**; ikinci aşama içerir. İnternet yokken sunucu Paylaş bağlantısı oluşturulmaz.
- Mevcut SW önceki sürümünü iptal etmeden kod güncellemesi yükleme kuralı korunur. İkinci aşamada kurulum/yenileme iletişimi ve bağlantı durum paneli olgunlaştırılır.

## Testler ve kabul

- \`npx tsx --test tests/belgeler/offline-pwa-scope.test.ts\`
- \`npx tsc -p tsconfig.next.json --noEmit\`
- \`npm run build\`
- \`npx playwright test --config=playwright.site.config.ts tests/site-audit/belgeler-offline-pwa-stage1.spec.ts --project=chromium-desktop-1366\`
- Eski regresyonlar: \`npm run check:belgeler-pdf\`, Belgeler'e özgü mobil/masaüstü tarayıcı testleri.
- Bu dosyadaki kanıtlar ancak çalışan CI sonuçları geldikten sonra PASS olarak işaretlenmelidir. CI çalıştırılmadan kalite kapısı tamamlandı diye rapor edilmez.

## Rollback / kill switch

- Yeni build'de \`NEXT_PUBLIC_BELGELER_OFFLINE_PWA=0\` çevrimdışı kaydı kapatır. Runtime PWA kaydını ve yalnız \`belgeler-offline-*\` cache'lerini siler, taslaklara dokunmaz.
- Kullanıcıda eski SW hâlâ etkin ve eski HTML sunuluyorsa önceki sürümün kendini silen telafi \`belgeler-sw.js\` koduyla güncellenmesi gerekebilir. Tek başına feature-flag sıfırlaması her eski SW'yi hemen kaldırmayı garanti etmez.
- GitHub dalı ayrı olduğundan yalnız bu dalın commit'leri geri alınabilir. \`main\` veya Vercel Production bu aşamada değiştirilmez.
