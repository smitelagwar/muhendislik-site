# PDF V5 Sonrası Denetim — Kod ve CI Bulguları

## A0 kaynak haritası

Bu belge A0’da okunan güncel kaynak ve test yollarının haritasıdır. CI job/loglarının güncel durumu, A1’de ayrıca doğrulanacaktır.

| Alan | Kaynak | A0’da doğrulanan davranış |
|---|---|---|
| PDF source / Range / lease | src/lib/dokumantasyon/studio/pdf/pdf-document-source.ts | A0’da kod değişikliği veya protokol hükmü verilmedi; V4 unit paketi belge-source testlerini çalıştırdı. |
| PDF worker ve viewer | src/lib/dokumantasyon/studio/pdf/pdfjs-loader.ts, src/components/dokumantasyon/studio/pdf/pdfjs-studio.tsx | Kaynak haritasına alındı; davranış/regresyon denetimi sonraki aşamalarda. |
| Render host / scheduler | src/components/dokumantasyon/studio/pdf/engine/pdf-page-host.tsx, src/lib/dokumantasyon/studio/pdf/engine/engine.ts | A0’da ürün kodu değiştirilmedi. |
| Yerel stream | src/app/api/dokumantasyon/files/[id]/stream/route.ts | A0’da auth/Range sonucu iddia edilmedi; A3 test matrisi için kapsamda. |
| Playwright veri izolasyonu | tests/document-studio/cad-test-env-setup.ts, cad-test-env-teardown.ts | Setup, mevcut .data DB/storage’ını kopyalar; teardown yalnız active-test-dir alt klasörünü kaldırır ve lock dosyasına da dokunur. |
| PDF V4 ölçüm helper’ı | tests/pdf-v4/helpers/viewer.ts | Fixture upload’dan sonra timer başlar; rota navigasyonu sonrası ilk rendered sayfa TTFR sonudur. |
| PDF V4 config / runner | playwright.pdf-v4.config.ts, playwright.config.ts, scripts/pdf-v4-run.mjs | PDF config temel webServer ve setup/teardown ayarını devralır. runner baseline modunda üretim sunucusunu --prod ile seçebilir. |
| Fixture üretimi | scripts/generate-pdf-fixtures-v4.mjs | Deterministik PDF’leri .test-data/pdf-v4-fixtures içine üretir. |
| Baseline sonuç yazımı | scripts/pdf-v4-report.mjs, scripts/pdf-v4-run.mjs | A0’da rapor/JSONL performans run’ı yapılmadı; append ve rapor seçimi A2’de incelenecek. |

## A0 bulguları

1. Yerel main checkout, origin/main’in bir commit gerisindeydi. origin/main SHA planın referans SHA’sı ile aynıydı; audit worktree bu SHA’dan açıldı.
2. Ana checkout’taki .data deposunda 1,417 dosya bulunuyor ve içerikleri A0’da açığa çıkarılmadı. Tamamen sentetik olduğu kanıtlanmadı. İzole worktree’de .data yok; A0 birim testi bu yüzden mevcut yerel veriyi kopyalamadı.
3. cad-test-env-setup.ts seed kopyalama davranışı sonraki Playwright çalışmaları için önemli güvenlik önkoşuludur. Gelecek browser çalışmaları bu izole checkout’ta, .data yokluğunu ve etkin DOK_LOCAL_DATA_DIR yolunu doğrulayarak yürütülmelidir.
4. İlk test kurulumu 21 npm audit advisory’si bildirdi (5 low, 2 moderate, 13 high, 1 critical). Bu yalnız npm ci özeti olarak kaydedildi; audit yapılmadı veya paket güncellenmedi.
5. A0 komutu npm run check:pdf-v4:unit başarılı oldu. Tam güncel CI/log incelemesi A1’de yapılacak.

## A1 için açık araştırma

- 11.10.2026 CI kaynaklarının güncel HEAD’de yeniden üretilebilirliğini ve ilk hata satırlarını kontrol et.
- PDF kapsamlı blokajı, PDF açılışını etkileyen entegrasyon sorununu ve bağımsız repo borcunu ayır.
- PDF V2/V3/V4 birim/test kapılarını güncel kaynakla eşleştir; test skip/fixme durumlarını doğrula.
- Test sunucusu, port, fixture ve çıktı dizini izolasyonunu incele.
- A0 bulguları ürün hatası veya PDF performans baseline’ı olarak yorumlanmamalıdır.

## A1 bulguları — 2026-10-14

- GitHub run `38169148289` aynı baseline SHA’da bir hedefli lint hatası (`pdf-viewer-v2.spec.ts:156:53 no-explicit-any`) ve repo geneli informational typecheck’te 158 TS hatası verdi. Hedefli lint hatası yerelde RED→GREEN düzeltildi. Genel TS hataları ağırlıkla eski CAD scriptleri ve arşiv belgelerindeki örneklerdir; runtime Next typecheck’i geçti.
- GitHub run `38169148292` içindeki üç mobil browser job’unda yalnız `Mobil list / Normal body tap` URL beklentisi 8 saniyede kök listede kaldı; artifact DOM’unda `application/pdf` fixture ve `/file-000` link’i bulunuyordu. Yerel tam iPhone WebKit Drive koşusunda aynı ilk navigasyon 7,9 saniyede geçti. Varsayılan 8s `expect` süresi yalnız bu URL assertion’ında 20s yapıldı; rota ve tek `history.pushState` kontrolleri korunarak final diff ile mobil matris 18/18, WebKit Drive grubu 47 geçti ve 1 gerçek-touch senaryosu SKIP oldu. Tarihsel GitHub Actions sonucu FAIL olarak kalır; güncel worktree için remote CI yeniden çalıştırılmadı.
- Yerel hedefli runtime typecheck ve V2/V3/V4 unit komutlarının exit code’ları ile eksik fixture atlamaları, `fixme` eşlemesi, runner izolasyonu ve CI ayrıntıları `asama-raporlari/A1.md` ile `kanit/a1-ci-20261014-2c0b682.json` içinde kayıtlıdır.
- A0’da bu belgenin hash’i `e9ffab170f1a80e052a4599c62bba879a4e283ffefbe4edf7c5bf05ad1802fe9` idi. A0 kanıtının özgün içeriği `kanit/a0-code-ci-snapshot.md` altında aynen arşivlendi.

**A0 ürün kodu değişikliği:** Yok.
