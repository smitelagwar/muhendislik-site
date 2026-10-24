# ASAMA_05 — Atomik 50/gün ve fiziksel byte muhasebesi

**Sonuç: PASS (yerel kapı).** 2026-10-23, Europe/Istanbul.

## Uygulama

- Anonim browser başına İstanbul takvim gününde 50 başarılı benzersiz yeni link sınırı eklendi. `used` ve `reserved` sayaçları ayrıdır; aynı request-id replay'i yeni hak tüketmez, başarısız işlem hakkı yalnız bir kez bırakır.
- Migration 008 günlük ledger'ı ve her Blob pathname için silinene kadar kalan fiziksel byte yükümlülüğünü ekler; eski başarılı geçmiş ve legacy Blob borçları muhafazakâr biçimde backfill edilir.
- SQL rezervasyon/finalize/refund/revoke/silme geçişleri atomiktir. Kısa global kapasite mutasyonları DB guard satırında sıralanır; render/Blob PUT sırasında transaction veya SQL kilidi tutulmaz.
- PDF'nin gerçek boyutu commit edilir. PUT sonucu belirsizse veya fiziksel silme başarısızsa byte yükümlülüğü kapasitede kalır; Blob silme onayı gelince bırakılır.
- Production global günlük ve depolama limitleri açık kapasite kararıyla ayarlanmalıdır. Değer yoksa production güvenli 503 verir; yerel 200/gün ve 1 GiB yalnız test varsayımıdır.

## Doğrulama

- `node docs/belgeler-paylasim-v3-uygulama/run-stage05-tests.mjs` — 148/148 test PASS; API, cleanup, browser bootstrap, eski aşama regresyonları, Stage 05 Memory ve PGlite SQL senaryoları.
- `node docs/belgeler-paylasim-v3-uygulama/run-stage05-runtime-tsc.mjs` — TypeScript PASS.
- `node docs/belgeler-paylasim-v3-uygulama/run-stage05-lint.mjs` — ESLint PASS.
- `git diff --check` — PASS.

Test çıktıları bu klasörde `ASAMA_05_tests.tap/json`, `ASAMA_05_runtime-tsc.log/json` ve `ASAMA_05_lint.log/json` dosyalarındadır. Kaynak/test/evidence-runner içerik özeti `ASAMA_05_changes.json` içindedir.

## Açık dış kapılar

- Ayrı gerçek Neon/PostgreSQL bağlantılarıyla yarış testi yapılmadı; PGlite testleri SQL davranışını doğrular, gerçek DB concurrency PASS iddiası değildir.
- Preview/Production DB, Vercel Blob, canlı veri, gerçek tarayıcı motorları, kapasite/fiyat değerlendirmesi ve production build çalıştırılmadı.
- Bu sınırlar release kapısıdır; ASAMA_13/14 öncesinde doğrulanmalıdır. Sonraki yerel aşama ASAMA_06'dır.

Remote write, commit, push ve deployment yapılmadı. Çalışma yalnız ASAMA_05 ile sınırlı tutuldu.
