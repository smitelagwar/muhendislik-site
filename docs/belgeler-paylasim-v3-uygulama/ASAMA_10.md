# ASAMA_10 — Salt-okunur viewer, mobil geometri ve kaynak yaşam döngüsü

**PASS — yerel kapı.** Tarih: 2026-10-23 Europe/Istanbul. HEAD: `04048e50fd02e50c1c9ea783acec2d7383f516b4`.

## Değişiklikler

- `viewer-session.ts`: abort edilen fetch; saklanan loadingTask/document; render cancel ve promise settle; seri canvas çizimi; async getPage sonrası generation kontrolü; token/retry öncesi eski teardown; document transport ve canvas backing store temizliği.
- Kurulu PDF.js 6.3.289 kaynak/types incelemesi `PDFDocumentProxy.destroy()` metodunun olmadığını doğruladı. Desteklenen `document.cleanup()` + `loadingTask.destroy()` kullanıldı. GetDocument'a dışarıdan verilen ortak worker'ın task tarafından sahiplenilmediği kurulu kaynakta doğrulandı; browser'da aynı worker kimliği ve sıfır worker destroy ile sınandı.
- `viewer-geometry.ts`: A4 sabiti kaldırıldı. Gerçek PDF viewport'u, genişlik/sayfa fit, manuel zoom, 8M pixel / 32 MB RGBA bütçesi ve 8.192px eksen sınırı. Zoom etiketi gerçek CSS ölçeğini gösterir; yüksek DPR backing bütçesi CSS geometrisini değiştirmez.
- Viewer: mobil fit, iki parmak pinch ve tek parmak pan, ResizeObserver/DPR değişimi, erişilebilir 44px kontroller, sarılan toolbar, light/dark/reduced-motion, görünür yükleme/çizim retry ve gerçek expiry tarihi.
- Token değişimi regresyonu eski “hazır” durumuyla yeni boş canvas'ın görünmesini yakaladı. Hazır sonucu session/page/zoom/ölçüyle eşleştirildi; yeni regresyon geçti.
- Yeni form/annotation/URI/scripting katmanı açılmadı. Ekran okuyucu açıklaması yalnız görsel canvas'ın belge metnini okutmadığını belirtir.

## Doğrulama

| Komut | Sonuç | Kanıt |
|---|---|---|
| `node docs/belgeler-paylasim-v3-uygulama/run-stage10-checks.mjs tests` | 23/23 PASS, 4 suite, 0 fail/skip | `ASAMA_10_tests.json`, `.tap` |
| `node docs/belgeler-paylasim-v3-uygulama/run-stage10-browser.mjs` | 21/21 PASS, 0 unhandled page error | `ASAMA_10_browser.json` |
| `node docs/belgeler-paylasim-v3-uygulama/run-stage10-checks.mjs runtime-tsc` | PASS | `ASAMA_10_runtime-tsc.json`, `.log` |
| `node docs/belgeler-paylasim-v3-uygulama/run-stage10-checks.mjs lint` | PASS, 0 error/warning | `ASAMA_10_lint.json`, `.log` |
| `git diff --check` + aşama dosyalarında whitespace taraması | PASS | `ASAMA_10_diff-check.log` |
| `node docs/belgeler-paylasim-v3-uygulama/run-stage10-manifest.mjs` | SHA-256 manifest | `ASAMA_10_changes.json` |

Browser testi gerçek komponenti esbuild ile derleyip gerçek yerel PDF.js/worker ve `pdf-lib` ile oluşturulan 400×600 / 800×400 sentetik PDF'leri kullanır. Next route, DB veya Blob backend doğrulaması değildir. 320/390/768/1366 × DPR1/2/3, 1/2 sayfa, fit/page/zoom oranları, sol/üst erişim, blue-marker piksel oracle'ı, gerçek CDP touch pinch/pan, HTTP503 ve render fault/retry, token değişimi ve fetch abort sınanır. Dark tema/resize sonrasında render'ın bitmesi beklenir; yalnız sınır çizgisinin görünmesi içerik PASS sayılmaz.

30 mount/unmount sonu: **0 loading/document/render task**, maksimum aynı anda render **1**, ortak worker kimliği aynı ve worker destroy **0**. Backing pixel tepe değeri **7.998.376**. Post-GC main-thread JS heap **4.722.452 → 5.313.648 byte** (+591.196; 12 MiB eşik altında), DOM node **10 → 68**; sıfır heap artışı iddia edilmez. Bu ölçüm tüm tarayıcı süreçlerinin/GPU'nun bellek ölçümü değildir. Her döngüde aktif sahiplik sayaçları sıfıra iner.

Görsel kanıtlar `ASAMA_10_320_light.png`, `ASAMA_10_320_dark.png`, `ASAMA_10_390_light.png` dosyalarıdır; 320px toolbar sarılması, fit ve iki tema görsel olarak incelendi. React best practices incelemesi hook cleanup, türetilmiş hazır durumu, sabit ortak worker, klavye/aria-live ve istemci sınırını kapsadı.

## Kapsam sınırı

Yerel bulgular **F06, F08, F19** kapandı. Fiziksel Android/iOS, Firefox/WebKit, gerçek Blob/Neon, Next `/b` kabuk entegrasyonu ve production build **NOT_RUN** (sonraki 11/13/14 kapıları). Yeni commit, push, remote fetch, deployment veya canlı cron çalıştırılmadı. Önceki aşama değişiklikleri korundu.

Sonraki tek aşama **ASAMA_11**; bu aşama başlatılmadı.
