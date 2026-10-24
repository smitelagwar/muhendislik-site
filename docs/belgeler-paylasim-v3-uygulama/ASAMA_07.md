# ASAMA_07 — Yeni revizyon, kota ve hata durumlarıyla paylaşım penceresi

**Sonuç: PASS (yerel kapı).** 2026-10-23, Europe/Istanbul. HEAD: `04048e50fd02e50c1c9ea783acec2d7383f516b4`.

## Uygulama

- Paylaşım isteği, tıklama anındaki allowlist form değerleri ve PDF revision bilgisiyle eşleştiriliyor. Tek seferlik işlem kilidi aynı anda gelen çift tıklamayı durduruyor; form değiştiğinde bekleyen işlem önce aynı proof/request ile çözülüyor ve yeni içerik yeni request ID alıyor.
- Reload kurtarma kaydı form verisi taşımıyor; yalnız request/proof, belge, revision, digest ve zaman tutuyor. Bağlantı penceresini kapatmak backend işlemini iptal etmiş sayılmıyor. Aynı formun kayıp yanıtı status endpoint'inden yeniden yükleniyor.
- Beş stüdyo `isReady` ve mevcut PDF revision değerini bağlıyor. Eski bağlantı/form farkı ve aynı form için ayrı yeni bağlantı eylemi görünür; kopyalama ücretsiz ve başarılı paylaşım formu sıfırlamıyor.
- Kota yalnız sunucu yanıtından gösteriliyor. Used/reserved ayrımı, history sayısından bağımsız sayaç, reset/focus yenilemesi, cookie unavailable, WAF HTML, quota 429 ve capacity 503 ayrı durumlar olarak ele alınıyor. Son yenileme hatası mevcut kota bilgisinin yanında gösteriliyor.
- Oluşturma, aktif/geçmiş iptal ve kopyalama hataları aynı assertive `aria-live` alanında görünür. Clipboard reddinde salt-okunur elle kopyalama alanı seçiliyor. Dialog kapanınca odak açan kontrole dönüyor; dialog yüksekliği mobil ekrana sığıyor.
- B01/B02/B03 tarayıcı kontrolleri ve F09/F13/F24 yerel UI kontrolleri eklendi. 320px görünümde yatay taşma yok; görünür işlemler en az 44×44.

## Doğrulama

- `node docs/belgeler-paylasim-v3-uygulama/run-stage07-tests.mjs` — **165/165 PASS**, 42 suite, **0 FAIL, 0 SKIP**; izole test adaptörleri.
- `node docs/belgeler-paylasim-v3-uygulama/run-stage07-runtime-tsc.mjs` — **PASS**, exit 0.
- `node docs/belgeler-paylasim-v3-uygulama/run-stage07-lint.mjs` — **PASS**, exit 0.
- `node docs/belgeler-paylasim-v3-uygulama/run-stage07-browser.mjs` — **PASS**, Chromium/Playwright ile 36/36 kontrol; yerel Next UI ve Playwright route mock'ları. Beş mock başarı isteğinin request ID'leri ayrı; dört farklı payload digest'i görüldü; kayıp yanıt ve değiştirilmiş form senaryolarında eski ID farklı payload ile tekrar gönderilmedi.
- `git diff --check` — **PASS**, exit 0.

Komut, test çıktısı ve ayrıntılı tarayıcı kontrol listesi `ASAMA_07_*.json`, `.log` ve `.tap` dosyalarındadır. `ASAMA_07_changes.json`, bu aşamanın değişen dosyaları için SHA-256 manifestidir; STATE manifestin kendi kendine referans vermemesi için hash dışında tutulur.

## Kalan kapılar ve sınırlar

- Tarayıcı API'leri mock edildi; gerçek Neon/PostgreSQL concurrency, Vercel private Blob/runtime, platform WAF, gerçek takvim günü reseti ve Preview/Production ortamı denenmedi.
- Firefox/WebKit ve fiziksel Android/iOS kabulü çalıştırılmadı. 320px mobil pencere yerel Chromium'da doğrulandı.
- Production build V3 planında ASAMA_13 kapısındadır; kapasite/fiyat ve eski deployment writer/cron uyumu sonraki release kapılarında kalır.
- ASAMA_08 başlatılmadı. Remote fetch/write, commit, push ve deployment yapılmadı.

Sonraki tek aşama **ASAMA_08**'dir.
