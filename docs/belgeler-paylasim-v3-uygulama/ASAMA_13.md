# ASAMA_13 — Bütünleşik yerel release kapısı

**Durum: PASS — YEREL_TAMAMLANDI.** Release/deploy yetkisi verilmedi; ASAMA_14’e geçiş için bu rapor ve STATE güncellendi. Üretime hazır olma veya yayın yetkisi anlamına gelmez.

- Tarih: 2026-10-24 (Europe/Istanbul)
- Branch / HEAD: `main` / `04048e50fd02e50c1c9ea783acec2d7383f516b4` (HEAD değişmedi)
- Taze production build: `.next-stage13-isolated`, build ID `TANJ6q1sDUCaKkaVKq3i9`; gerçek HTTP/browser testleri bu artifact üzerinde çalıştı.
- Gerçek PostgreSQL: izole Neon, yalnız Vercel `development` yapılandırması; migration schema version 9. İki ayrı `pg_backend_pid` ile doğrulandı.
- Gerçek depolama: private Vercel Blob, yalnız test için; E2E sırasında belge PDF’leri oluşturuldu/okundu/iptal edildi. PostgreSQL/Blob test verisi son koşudan sonra temizlendi. Başlangıçta oluşturulan ek Blob store boş ve bağlantısız olarak duruyor; çalışan test store yalnız `development` environment’ına bağlı.
- GitHub fetch/write, commit, push: **0**. Vercel Preview/Production ayarı veya deployment: **0**. ASAMA_14/15 kapasite, eski deployment, cihaz ve yayın kapıları açık.
- Bir önceki kayıttaki başarısız, credential’sız E2E denemeleri tarihsel log olarak kaldı; aşağıdaki PASS sonuçları ayrı, son build ve izole gerçek servislerle alındı.

## Yerel kalite kapıları

| Kontrol | Sonuç | Kanıt |
| --- | --- | --- |
| `npm run check:belgeler-pdf` | 432/432 geçti; 0 fail, 0 skip | `ASAMA_13_pdf.log` |
| Runtime TypeScript | PASS, exit 0 | `ASAMA_13_live_tsc.log` |
| Değişen aşama TS/JS dosyaları ESLint | PASS, 0 error / 0 warning | `ASAMA_13_live_lint.log` |
| `npm run check:tools` | PASS; araç browser smoke 30/30 | `ASAMA_13_tools.log` |
| Taze `npm run build` | PASS; build ID `TANJ6q1sDUCaKkaVKq3i9` | `ASAMA_13_live_build.log` |
| Taslak / inline odak / form görünümü regresyonları | 25/25 geçti; 0 fail, 0 skip | `ASAMA_13_regressions.log` |
| PDF okuyucu v2 smoke | 4 geçti, 0 fail; 3 mevcut `fixme` skip | `ASAMA_13_pdfViewer.log` |
| Ana site kabuğu ve eski `/p` bulunmayan link | 1/1 geçti | `ASAMA_13_shell.log` |
| Mobil gezinme kabuğu | 1/1 geçti; 0 skip | `ASAMA_13_mobileShell.log` |
| Paylaşım API ve Origin regresyonları | 48/48 geçti; 0 skip | `ASAMA_13_origin_and_api_tests.log` |
| `git diff --check` | PASS | exit 0 |

## Gerçek PostgreSQL + private Blob browser kabulü

| Test | Sonuç | Kanıt |
| --- | --- | --- |
| Beş belge × 1366, 390 ve 320 px; create → private PDF görüntüleme → revoke | 15/15 geçti; 0 fail, 0 skip | `ASAMA_13_share_live_all.log` |
| K01: ilk linkin PDF SHA-256’ı ikinci, değişen içerikli linkten önce/sonra sabit; ikinci PDF farklı; kota 2/50 | 1/1 geçti | `ASAMA_13_live_k01k02.log` |
| K02: gerçek SQL 49 + 1 reserved, 50 finalize, 51 ret; iki sekme aynı kotayı paylaşır; aynı NAT adresindeki ayrı Chromium browser kendi 0/50 → 1/50 kotasını kullanır | PASS | `ASAMA_13_postgres_live.log`, `ASAMA_13_live_k01k02.log` |
| K03: iki backend connection üzerinden 100 ayrı ID; 50 rezervasyon/finalize, 50 kota ret. Aynı ID’nin 100 paralel tekrarı tek rezervasyon ve tek kullanılan hak | PASS | `ASAMA_13_postgres_live.log` |
| K05: render failure iadesi bir kez; upload/finalize hatasında silme teyidine dek byte borcu; kayıp finalize yanıtı çift sayım yapmaz | PASS | `ASAMA_13_postgres_live.log` |
| Byte kapasitesi: iki rezervasyon kabul, üçüncüsü ret; başarısızlık/silme sonrası byte iadesi | PASS | `ASAMA_13_postgres_live.log` |
| K19: taze production build, gerçek Neon schema 9 ve private Blob’la tarayıcı create/view/revoke | PASS | `ASAMA_13_live_build.log`, `ASAMA_13_share_live_all.log` |

Neon testi geliştirme environment’ındaki izole veritabanının yalnız `development` satırları olduğunu reset öncesi doğruladı; iki PostgreSQL backend PID’si ayrıydı. Test koşusu sonunda link, quota, obligation ve Blob test verileri temizlendi. Son rapor `ASAMA_13_postgres_live.log` içindeki ölçümleri ve temizlik öncesi test sayımlarını içerir.

## Kabul matrisi ve açık riskler

- K01, K02, K03, K05, K17 ve K19 için zorunlu ASAMA_13 gerçek entegrasyon kanıtı PASS. Kalan yerel/unit/API/browser sözleşmeleri ilgili ASAMA_02–12 kanıtları ile bu taze build kontrolleri üzerinden değerlendirildi.
- P1 işlev/güvenlik kapısı: **açık P1 yok**. N01 (gerçek SQL atomikliği) ve F23 (K01/K02 ürün kabuli) kapandı. F09, 1.66 pt’ye düşebilen uzun sözleşme alanı için mevcut **P2 okunabilirlik uyarısı** olarak açık tutuldu; yeni eşik uydurulmadı.
- Firefox/WebKit ve fiziksel Android/iOS: NOT_RUN. Üretim kapasite/fiyat/bütçe ölçümü, eski deployment writer/cron erişimi ve production/Preview uyumu: ASAMA_14/15 kapısı.
- Önceki denetimde bir Vercel OIDC değeri araç çıktısında görünmüştü. Bu koşuda OIDC değeri boş gölgelendi ve kullanılmadı; geçmiş değerin sahibi uzaktaki işleme başlamadan önce onu yenilemeli/geçersiz kılmalıdır. Değer bu kanıtlara eklenmedi.
- Kullanıcıya ait belge veya üretim verisi kullanılmadı. Sentetik tarayıcı verileri ve geçici test kayıtları raporlarda gizli token/proof/URL olmadan tutuldu.

## Sonraki aşama

`ASAMA_13: PASS`, `execution_status: YEREL_TAMAMLANDI`, `next_stage: ASAMA_14`. ASAMA_14 kapasite ve sürüm adayı hazırlığıdır; ASAMA_15 yalnız açık `yayınla` komutuyla başlar.
