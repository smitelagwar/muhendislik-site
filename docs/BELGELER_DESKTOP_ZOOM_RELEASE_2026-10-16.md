# Belgeler masaüstü zoom ve kontrol düzeni — 16 Ekim 2026

## Kapsam

Belgeler kataloğu ve beş bağımsız PDF stüdyosu: beton döküm, inşaat ruhsatı, istifa, sözleşme ve taahhütname. Çalışma dalı `internal-belgeler-mobil-pdf-hardening`.

## Düzeltilen davranışlar

- React `onWheel` yerine önizleme yüzeyinde `{ passive: false }` yerel dinleyici kullanılır. Ctrl/Cmd + tekerlek PDF ölçeğini değiştirir; tarayıcı zoom olayı iptal edilir. Normal tekerlek panel içinde kaydırma yapar.
- Ardışık zoom hesabı son çizilmiş raster ölçeğini kullanır. İmleç/parmak çıpası panelin viewport ve kaydırma koordinatlarıyla korunur; yüzde gösterimi tam sayıdır.
- PDF araçları tüm ekranlarda en az 44×44 px hedef kullanır. Sayfa gezinme, yakınlaştırma, sığdırma ve yeni sekme eylemleri tutarlı gruplardadır.
- `BelgeStudioActions` beş stüdyonun ortak, sürekli erişilebilir alt eylem çubuğudur. Masaüstünde form eylemleri solda, çıktı eylemleri sağdadır. Mobilde ek eylemler Radix menüsünde, önizleme ve indirme doğrudan erişimdedir. Büyük metin ayarında iki satırlı düzen kullanılır.
- Gizlenen PDF panelindeki canvas artık üst bileşenin `visibility` değerini geçersiz kılamaz; hazırlık görünümü `opacity` ile yönetilir. Form/önizleme geçişinde PDF'in form üzerine çıkması engellenir.
- Kısa/yatay ekranda PDF alanının minimum yüksekliği taşma üretmez. Form değişikliği iki sayfalı belgenin açık sayfasını korur.
- `.playwright-mcp/` deployment kaynaklarından dışlanır.

## Yerel doğrulama

- `npm run build`: PASS; Next.js runtime TypeScript ve 627 statik sayfa üretimi başarılı.
- Değişen runtime bileşenleri ve Belgeler testlerinin tip kontrolü: PASS.
- İlgili TS/TSX kaynakları ve test dosyası için ESLint: PASS, 0 hata/uyarı.
- `node --import tsx tests/belgeler/viewer-helpers.test.ts`: PASS.
- `tests/site-audit/belgeler-mobile-studio.spec.ts`, `chromium-desktop-1920` + `chromium-mobile-390`: 31 PASS. Diğer ekran projesine ait 31 kopya koşul gereği atlandı. Masaüstü testleri her belgeyi 1024/1366/1920 genişlikte; mobil testler 320/360/390/414/768 ve 844×390 yatay ölçülerde inceler. Paket WebKit kritik akışını da çalıştırır.
- Gerçek `page.mouse.wheel` + Control girdisiyle `defaultPrevented=true`, artan/azalan PDF ölçeği, sabit `innerWidth` ve `devicePixelRatio` doğrulandı. Pasif listener uyarısı yok.
- Son büyük metin yerleşimi sonrası 320px/%200 metin, sıfırlama/geri alma ve yazdırma testleri: 3 PASS.
- Son production bundle üzerinde beş stüdyoda Ctrl+tekerlek ve geçerli `%PDF-` indirme; 320px menü, Escape ile odak dönüşü, gizli canvas ve %200 metin: PASS; 0 runtime/console error.
- Light/dark, masaüstü, 320px, %200 metin ve yatay ekran görüntüleri gözle incelendi.

## Genel depo kontrolünün sınırı

Genel `npx tsc --noEmit --incremental false`, görev dışındaki arşiv belge ve CAD/test scriptlerinde hata verir. Örnekler: `docs/pdf-viewer-v4/ekler/playwright.pdf-v4.config.ts` eksik import, `scripts/cad-v2/check-kalip-coords.ts` unknown nesne erişimi ve `tests/document-studio/cad-v2-layout-viewport.spec.ts` tip uyuşmazlıkları. Bu nedenle genel kontrol PASS olarak raporlanmaz. Production runtime kontrolü ve görev kapsamındaki tip kontrolleri başarılıdır.

Önceki yayın sırasında görülen bağımlılık güvenlik uyarıları için paket sürümü/lockfile değişikliği yapılmadı. Bu çalışma PDF etkileşimi ve kontrol yerleşiminin doğrulanmış yayınıdır.

## Yayın yöntemi

Kaynaklar tek `[skip ci]` checkpoint ile korumalı internal dalında saklanır. Kullanıcının açık production talebi için CLI üzerinden production hedefli build hazırlanır; build READY olduktan sonra aynı artifact üzerinde masaüstü zoom, PDF indirme ve mobil eylem smoke kontrolü yapılır ve production alan adına promote edilir. Böylece ek Preview veya yeniden build üretilmez. Gerçek dağıtım durumu ve kaynak commit'i Vercel kayıtlarından doğrulanır.
