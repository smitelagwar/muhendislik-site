# ASAMA_06 — HTTP doğrulama, sınırlar ve canonical paylaşım alan adı

**Sonuç: PASS (yerel kapı).** 2026-10-23, Europe/Istanbul. HEAD: 04048e50fd02e50c1c9ea783acec2d7383f516b4.

## Uygulama

- Create isteğinde Origin ve Host eşleşmesi, JSON content type, exact üst seviye/body field allowlist'i, düz values nesnesi, belgeye özgü string alanları ve canonical 256-bit request/token değerleri doğrulanıyor. View/manage token biçimi DB sorgusundan önce reddediliyor.
- JSON gövdesi en fazla 64 KiB olarak UTF-8 baytları üzerinden stream okunuyor. Gerçek stream, Content-Length yalanı, 64 KiB sınırı, timeout ve aşımda stream cancel davranışları sınandı.
- İzin verilen alanların dışında kalan sabit PDF etiketleri için generator çıktısı sınandı; sahte istemci etiketleri yerine PDF profilindeki onaylı değerler korunuyor.
- API başarı/hata/405/OPTIONS/HEAD yanıtlarına ortak no-store/no-referrer/nosniff/noindex ve korelasyon başlıkları eklendi. Hatalar sabit kod/mesaj/korelasyon zarfı kullanıyor; sunucu logları kategori, süre ve korelasyon ID'siyle sınırlı.
- WAF HTML 403/429, Retry-After, bozuk JSON, 503, abort ve offline sonuçları istemci yardımcılarında ayrıştırılıyor. 429 Retry-After değeri İstanbul günlük kota resetAt - serverNow farkından üretilip HTTP yanıta taşınıyor; sabit 900 saniye kaldırıldı.
- Production canonical origin ve tam eşleşen Preview allowlist'iyle mutlak paylaşım URL'si üretiliyor; hook sunucunun URL'sini tarayıcı origin'iyle yeniden yazmıyor.
- PDF HEAD route'u Blob gövdesi okumadan DB metadata'sıyla başlık döndürüyor. Node runtime/maxDuration ve production route trace'inde 5 şablon + 4 font doğrulandı.

## Doğrulama

- node docs/belgeler-paylasim-v3-uygulama/run-stage06-tests.mjs — **160/160 PASS**, 41 suite, **0 FAIL, 0 SKIP**, izole Memory/PGlite adaptörleri.
- node docs/belgeler-paylasim-v3-uygulama/run-stage06-runtime-tsc.mjs — **PASS**, exit 0.
- node docs/belgeler-paylasim-v3-uygulama/run-stage06-lint.mjs — **PASS**, exit 0.
- node docs/belgeler-paylasim-v3-uygulama/run-stage06-prod-trace.mjs — yerel production build **PASS**, exit 0; route trace'inde 9/9 gerekli asset bulundu.
- git diff --check — **PASS**, exit 0.

Komut raporları ve tam test/build çıktıları bu klasördeki ASAMA_06_*.(json|log|tap) dosyalarındadır. Önceki iki test/lint/tsc denemesi ASAMA_06_attempt01_* ve ASAMA_06_attempt02_* dosyalarında ayrı tutuldu; final sonuçlar yerine kullanılmıyor.

## Kalan kapılar ve sınırlar

- F15'in /b HTML/referrer ve izole viewer kabuk kabulü ASAMA_11'de tamamlanacak.
- F20 için Vercel'in production trusted forwarded-header zinciri bu yerel çalışmada doğrulanmadı; ASAMA_14 dış kapısı olarak açık.
- N15'in runtime PDF parse/page/AcroForm kontrolü ASAMA_12'de; bu aşamada safe hata mesajı kapsamı uygulandı.
- Gerçek Chromium/Firefox/WebKit, Vercel Preview/Production, private Blob runtime, platform WAF davranışı, gerçek Neon ayrı bağlantı concurrency'si, production eski writer/cron erişimi ve kapasite/fiyat ölçümü çalıştırılmadı. Bunlar release kapısıdır; yerel mock/PGlite sonuçları olarak raporlanmadı.
- Remote fetch/write, commit, push ve deployment yapılmadı. Üretim verisi kullanılmadı.

Sonraki tek aşama ASAMA_07'dir. ASAMA_07 başlatılmadı.
