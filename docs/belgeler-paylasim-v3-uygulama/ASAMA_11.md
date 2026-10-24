# ASAMA_11 — İzole kabuk, erişim durumları, HTTP ve HEAD

**PASS — yerel aşama kapısı.** Tarih: 2026-10-23 Europe/Istanbul. Branch `main`, HEAD `04048e50fd02e50c1c9ea783acec2d7383f516b4`. Önceki aşamaların bekleyen değişiklikleri korundu.

## Uygulananlar

- **F07 yeniden üretildi ve düzeltildi.** Gerçek Next istemci router'ında normal sayfa → `/b` geçişinde Navbar/Footer/GlobalOverlays kalıyordu; doğrudan `/b` → normal sayfa geçişinde kabuk geri gelmiyordu. Önceki root layout ve middleware kaynakları `.txt` kanıtında, üç baseline kontrolü `ASAMA_11_next-before.json` içinde kayıtlıdır. Bu baseline PASS, kusurun beklenildiği gibi gözlenmesi anlamındadır.
- `src/components/site-shell.tsx`, kabuğu `usePathname()` ile güncel rotaya göre seçer. Server root layout ve server `children` korunur; Footer server slot'udur (mevcut Footer görsel çıktı vermediğinden test kopyasında mount işaretçisiyle izlenir). `/b` altında site navbar/overlays/sonner yok; normal sayfada kabuk geri gelir. Dar istemci sınırı dışında site taşınmadı.
- Root `headers()` ve yalnız `x-pathname` enjekte eden `src/middleware.ts` kaldırıldı. Proxy eklemek gerekmedi. Kurulu Next 16.4.2 `layout.md` pathname bölümü, `use-pathname.md`, `headers.md`, `headers` config rehberi, metadata merge ve not-found/status rehberleri okundu. Kullanılmayan middleware'i proxy'ye dönüştürmek yerine kaldırmak mevcut görevi çözdü.
- `/b/[token]` için geçersiz, bulunamadı, iptal, süresi doldu, hazırlanıyor ve hizmete erişilemiyor ekranları eklendi. Pending/DB kesintisinde yeniden deneme; render fault'ta route'a özel izole error boundary vardır. Hata metni ham error, token veya DB ayrıntısı içermez. Ekran görüntüleri 390px genişlikte görsel olarak incelendi.
- DB transport hataları `DATABASE_UNAVAILABLE` 503'e çevrilir; “belge bulunamadı” yapılmaz. `revokedAt` kontrolünün purge/expiry önceliği korunur (**F32 NOT_A_BUG**, yeni regresyonla korundu).
- PDF API Blob null, başarısız upstream response veya exception için 502; eksik Blob yapılandırmasında 503 verir. HEAD yalnız DB/lifecycle ve kayıt metadata'sını okur: Blob factory/GET/stream açmaz. Bu yüzden storage kesintisinde kayıt ready ise HEAD=200 ve GET=502 olabilir. Range isteği tam 200 akış döndürür; Accept-Ranges/Content-Range veya 206 iddiası yoktur.
- `/b/:path*` ve paylaşım API'si için `private, no-store`, `no-referrer`, `noindex/noarchive`, `nosniff` korunur. Gerçek Next sunucusunda genel site Referrer-Policy kuralının route helper başlığını ezdiği gözlendi; API'ye özel config kuralıyla düzeltildi. Yalnız route fonksiyonunu çağıran unit test bu kusuru yakalamıyordu.
- Token layout metadata'sı canonical/OpenGraph/Twitter'ı bastırır; genel başlık ve no-referrer/noindex/nofollow/noarchive/nosnippet uygular. Root dosya tabanlı `opengraph-image.tsx` dahil test edildi. Browser isteklerinde token içeren referer ve cihaz sessionStorage geçmişinde token yoktur. Uygulama hata logları yalnız sabit kategori/süre/correlation id taşır.

## HTTP sözleşmesi

| Durum | HTML GET/HEAD | PDF GET | PDF HEAD |
|---|---|---|---|
| Ready | 200 viewer | 200 | 200 metadata, boş body |
| Unknown | 200 durum ekranı | 404 | 404 boş body |
| Revoked / expired | 200 durum ekranı | 410 | 410 boş body |
| Pending | 200 hazırlanıyor | 425 + Retry-After | 425 + Retry-After, boş body |
| DB ulaşılamıyor | 200 hizmet kesintisi | 503 | 503 boş body |
| Storage eksik / exception | Viewer GET hatası görünür | 502 | Ready DB kaydıysa 200 |
| Beklenmeyen server render fault | 500 error boundary (ölçülen) | — | — |

HTML durum ekranları bilinçli **200**'dür; JSX'te iptal ekranı döndürmek HTTP 410 kanıtı sayılmadı. Kurulu Next native `notFound()` ile streaming öncesi 404 / başladıktan sonra 200 seçeneklerini belgeler; burada açık durum ekranı seçildi. Gerçek HTML unmatched 404 ve render fault 500 başlıkları ayrıca sınandı.

## Yeni çalıştırılan doğrulamalar

| Komut | Sonuç | Kanıt |
|---|---|---|
| `node docs/belgeler-paylasim-v3-uygulama/run-stage11-checks.mjs tests` | **24/24 PASS**, 4 suite, 0 fail / 0 skip | `ASAMA_11_tests.json`, `.tap` |
| `node docs/belgeler-paylasim-v3-uygulama/run-stage11-next.mjs --production` | **39/39 PASS**, 0 fail / 0 skip | `ASAMA_11_next-after-production.json`, `.log` |
| `node docs/belgeler-paylasim-v3-uygulama/run-stage11-next.mjs --baseline` | 3/3 beklenen baseline gözlemi | `ASAMA_11_next-before.json`, `.log` |
| `node docs/belgeler-paylasim-v3-uygulama/run-stage11-next.mjs --baseline --build` | Dar before build PASS | `ASAMA_11_next-before-build.json`, `.log` |
| `node docs/belgeler-paylasim-v3-uygulama/run-stage11-checks.mjs runtime-tsc` | PASS; bütün runtime kaynaklarına typecheck | `ASAMA_11_runtime-tsc.json`, `.log` |
| `node docs/belgeler-paylasim-v3-uygulama/run-stage11-checks.mjs lint` | PASS, 0 error / 0 warning | `ASAMA_11_lint.json`, `.log` |
| `git diff --check` + yeni aşama dosyaları whitespace taraması | PASS | `ASAMA_11_diff-check.log` |
| SHA-256 dosya manifesti | Kaynak, kanıt ve silinen middleware listesi | `ASAMA_11_changes.json` |

Production entegrasyonu gerçek Next 16.4.2 `build --webpack` + `start`, gerçek root/layout/komponent/route/service kaynakları ve Chromium router'ı kullanır. Ürün kaynakları geçici bir dizine kopyalanır; **yalnız kopyada** izole read ve Blob adaptörleri kurulur, sentetik PDF kullanılır. `.env` kopyalanmaz; cloud/secret env adları temizlenir; hiçbir DB/Blob yazma yolu yoktur. Bu bir gerçek Neon/private Blob testi değildir. Kopya ürün kaynaklarının hash'leri JSON'da kayıtlıdır.

Doğrudan, prefetch, client navigation (yedi durum), geri/ileri, reload, normal siteye dönüş ve error boundary kontrol edildi. HTML 200/404/500, API 200/400/404/405/410/425/502/503 ve OPTIONS 204 üzerinde başlıklar; HEAD boş body; Blob'a dokunmadan metadata; Range tam 200; robots disallow ve token/referrer gizliliği sınandı. Ready viewer'da gerçek PDF.js canvas'ın görünür render'ı beklendi. Görsel kanıt: `ASAMA_11_unavailable_mobile.png`, `ASAMA_11_error_boundary.png`.

## Dinamik root ölçümü ve sınırlar

Dar fixture build karşılaştırmasında `/` ve `/stage11-normal`, root `headers()` varken **ƒ dynamic**, kaldırılınca **○ static** oldu. `/b/[token]` ve PDF route **ƒ dynamic** kaldı. Bu nedensellik ölçümüdür; bütün sitenin kaç route'unun statikleştiği veya tam release build sonucu değildir. Bütün uygulamanın build/route envanteri ASAMA_13 kapısındadır.

İlk development kontrolünde Next dev `Cache-Control`'ü `no-store` yaptı; private başlık assert'i FAIL verdi. `ASAMA_11_development-probe.*` bu bulguyu korur. Tam başlık kabulü production server üzerinde yapıldı. Fixture'ın ilk build'i test kopyasına dahil edilmeyen CAD kaynakları nedeniyle typecheck'te durdu; fixture include'u yalnız app girişleri ve transitif import'lara daraltıldı, repo runtime typecheck ayrıca geçti. Metadata testi yeni layout konumuna taşındı. React purity lint'i server erişim ölçümünü component dışındaki async helper'a taşıyarak giderildi. Son PASS dosyaları düzeltme sonrası yeniden çalıştırıldı; ara başarısızlıklar PASS sayılmadı.

React best practices incelemesi: kabuk render sırasında türetilir, senkronizasyon effect'i yoktur; server children client'a taşınmaz; hata/metadata sade ve token bağımsızdır; 44px yeniden deneme düğmesi ve anlamlı başlık vardır. Geniş refactor veya yeni hook kaynağı eklenmedi.

**NOT_RUN:** gerçek Neon/Blob, Vercel runtime/deploy, platform access log ayarı, fiziksel Android/iOS, Firefox/WebKit, bütün uygulamanın release build'i (ASAMA_13). Test skip=0; bu dış doğrulamalar skip gibi gizlenmedi. Açık ASAMA_11 engeli yok. Yeni commit/push/fetch/deploy veya canlı cron çalıştırılmadı.

Sonraki tek aşama **ASAMA_12**. Başlatılmadı.
