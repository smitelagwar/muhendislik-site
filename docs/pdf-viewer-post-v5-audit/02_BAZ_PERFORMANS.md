# PDF Görüntüleyici — A2 Performans Baseline

## Karar ve kapsam

- A2: GECTI. Ürün kaynak kodunda performans değişikliği yapılmadı.
- Kaynak HEAD: 2c0b68209ae2e4e691b832e5957fbb4cd2e0e6d9; dal: codex/pdf-post-v5-audit-20261014.
- Production build exit 0; BUILD_ID jbTgjGuh4aPtcKXnsM1QU. Tam Playwright listesi 79 test; full run 79 passed / 0 failed / 0 skipped, 50 ölçüm satırı.
- Hedefli S1/S4/S5/S8 altkümesi beş ayrı run’da 7/7 geçti; 35 tekrar testi ve 7 grup için n=5 ölçüm.
- A0’da performans koşusu yoktu; önce/sonra performans kıyası yapılmadı.
- Desteklenen Chromium profile’larında 194/194 budget kontrolü geçti. Rapor scriptinin iki WebKit satırını yanlışlıkla desktop budget’ı ile kıyaslaması aşağıda kayıtlı.

## Ortam

| Alan | Değer |
|---|---|
| Build | Next 16.3.6 / webpack; .next-pdf-a2-retry; ID jbTgjGuh4aPtcKXnsM1QU |
| Worker/vendor | Build preflight başarılı; PDF.js v6.3.289, 205 dosya, vendor --check exit 0 |
| Makine | Windows 10 Pro 19045; AMD Ryzen 5 7600, 6 çekirdek / 12 mantıksal; 30.9 GiB RAM; Dengeli güç planı |
| Runtime | Node 24.15.0; npm 11.12.1; Playwright 1.62.1; Chromium 151.0.7922.34 (revision 1234); WebKit revision 2336 |
| Desktop profili | Chromium 1366×800, DPR 2; CPU 1× |
| Mobil profili | Pixel 7 emülasyonu, Chromium 390×844, DPR 3; fiziksel cihaz değil |
| WebKit profili | Desktop Safari/WebKit 1280×720, DPR 2; smoke-only |
| Ağ | 127.0.0.1:3217 production server, loopback PDF fixture’ı, yapay throttle yok |
| Veri | Yalnız sentetik test fixture’ları; .data seed yoktu ve kopyalanmadı; production/veri erişimi yok |

TTFR, upload tamamlandıktan sonra navigasyondan ilk data-page-state=rendered durumuna kadardır; saf ağ TTFB’si değildir. Sharp ayrı ölçülür. Worker startup, HTTP cache soğuk/sıcak durumu ve upload süresi ayrıştırılmadı. n=5 tekrarlar arasında p95 üretilmedi; tabloda her koşunun iç kare örnekleminden gelen gapP95Ms ham değerinin medyanı verilir.

## Tam production-baseline ölçümleri

Run: 20261014-173918-2c0b682-baseline-06. Gerçek test listesi: desktop 39, mobile 30, compat 3, WebKit 7 = 79.

| Senaryo | Profil / fixture | Ölçüm özeti | Bütçe |
|---|---|---|---|
| S1 Açılış | Desktop; tr-metin, karisik-60, metin-1000, A0, tarama-A3 | TTFR 900, 869, 869, 1398, 883 ms; sharp max 14 ms | ≤2500 ms, geçti |
| S1 Açılış | Mobile; aynı fixture’lar | TTFR 871, 877, 872, 2681, 874 ms; A0 sharp 17 ms | ≤3500 ms, geçti |
| S2 Klavye zoom | Desktop / mobile; karisik-60 ve metin-1000 | Blank 0; gap max 50.1 / 83.2 ms; anchor drift max 0.94 / 1.32 px | Profil budget’ları geçti |
| S3 Ctrl-wheel | Desktop / karisik-60 | gapP95 16.8 ms; anchor 0.38 px; notch 1.10 | 35 ms / 1 px / 1.05–1.15; geçti |
| S4 Hızlı kaydırma | Desktop / mobile | gapP95 max 16.8 ms; gap max 33.3 / 33.4 ms; blank settle max 2 / 13 ms; mounted max 3 / 8 | Profil budget’ları geçti |
| S4 Hızlı kaydırma | WebKit smoke | gapP95 151 / 145 ms; blank settle 95 / 64 ms | Bilgilendirici; WebKit budget’ı yok |
| S5 Pinch | Mobile; 3 fixture × 3 jest | Blank 0; browser zoom/scale error 0; en yüksek tek koşu anchor drift 155.4 px (tr-metin pinch-in) | ≤185 px, geçti; pinch-in n=1 |
| S6 Double-tap | Mobile / tr-metin | Anchor 0.45 px; blank 0; fit error 0 px | Geçti |
| S7 Büyük format | Desktop A0 / tarama-A3 | Canvas 10 MP / 40.5 MB; sharp ratio 1; blank 0 | ≤16 MP / 160 MB; geçti |
| S7 Büyük format | Mobile A0 / tarama-A3 | Canvas 0.3–1.7 MP / 23.7–30.4 MB; sharp ratio 1.5; blank 0 | ≤16 MP / 80 MB; geçti |
| S8 Bellek | Desktop / mobile; karisik-60 | 20 zoom döngüsü heap +1.2 / +4.5 MB; canvas 97.6 / 50.7 MB; mount 3 / 8 | Heap ≤30 MB, canvas/page bütçeleri geçti |
| S9 Lease | Desktop / karisik-60 | Reload 0; scroll drift 0; blank 0 | Geçti |
| S10 Worker | Compat / tr-metin | first page 1; inkPixels 55,035; pageErrors 0; worker prelude 1 | Geçti |
| S11–S12 | Mobile yön değişimi + fit-width; desktop/mobile | Anchor delta 0; fit korundu; zoom yüzde değişimi 0 | Geçti |
| S13 Gizli sekme | Desktop / mobile | Hidden canvas 1.9 / 10.9 MB | ≤24 / ≤16 MB, geçti |
| S14 Thumbnail | Desktop / metin-1000 | gapP95 / max 16.8 / 16.8 ms | ≤40 / ≤250 ms, geçti |

## Beş hedefli tekrar — ham / medyan / min–maks

Her koşu 7/7 passed ve kendi JSONL dosyasına alındı. Beş koşudan p95 hesaplanmadı.

| Grup / metrik | Ham değerler | Medyan | Min–maks |
|---|---|---:|---:|
| S1 desktop A0 TTFR (ms) | 1430, 1401, 1420, 1430, 1424 | 1424 | 1401–1430 |
| S1 mobile A0 TTFR (ms) | 2662, 2648, 2628, 2608, 2678 | 2648 | 2608–2678 |
| S1 desktop A0 sharp (ms) | 3, 5, 13, 8, 12 | 8 | 3–13 |
| S1 mobile A0 sharp (ms) | 17, 24, 27, 32, 19 | 24 | 17–32 |
| S4 desktop metin-1000 gapP95 (ms) | 16.7, 16.7, 16.8, 16.7, 16.8 | 16.7 | 16.7–16.8 |
| S4 mobile metin-1000 gapP95 (ms) | 16.8, 16.7, 16.8, 16.8, 16.7 | 16.8 | 16.7–16.8 |
| S4 mobile metin-1000 blank settle (ms) | 5, 11, 4, 8, 15 | 8 | 4–15 |
| S5 mobile karisik-60 pinch-out drift (px) | 0.57, 0.57, 0.57, 0.57, 0.57 | 0.57 | 0.57–0.57 |
| S5 mobile karisik-60 pinch-out sharp (ms) | 11, 20, 2, 1, 20 | 11 | 1–20 |
| S8 desktop karisik-60 heap growth (MB) | 1.3, 1.3, 1.3, 1.3, 1.3 | 1.3 | 1.3–1.3 |
| S8 mobile karisik-60 heap growth (MB) | 4.8, 3.1, 3.1, 3.2, 3.0 | 3.1 | 3.0–4.8 |
| S8 mobile karisik-60 canvas (MB) | 50.7, 50.7, 54.2, 51.0, 45.4 | 50.7 | 45.4–54.2 |

## Run ve fixture kanıtı

- Tam run: 20261014-173918-2c0b682-baseline-06; 50 JSONL satırı.
- Beş tekrar: 20261014-173320-2c0b682-baseline-01, 20261014-173441-2c0b682-baseline-02, 20261014-173548-2c0b682-baseline-03, 20261014-173655-2c0b682-baseline-04, 20261014-173801-2c0b682-baseline-05; her biri 7 satır.
- Altı run JSONL dosyası toplam 23,449 byte; test-results toplamı koşu sonrasında 1,351,767 byte (A1’den kalan ekran görüntüleri dahil).
- V4 fixture SHA-256: a0-vektor 4ce70a47af31e0b620db8c8acefc30c073f83225f13bf43c6c1315607d380a21; karisik-60 a2368426188b500902711b90f45cf66ba66488b3ac590a22f7e61dde0f005c4d; metin-1000 1a018f3cee6cc11c73eba9ada2767856da383a9b4d6e5ec1b25d735291976dad; tarama-a3 098a12843cf20b58b69dbd19f1acde1fec8360d69c4d3ce6e000a601344c6c7a; linkli-300 1d72dc21b8d5f6c2871b629adfe1f489a80d8f696577617a081d6ea37fbcf409.
- Koşu sırasında üretilen tr-metin.pdf SHA-256: a51bf4ef270ea0552aef94b2adbfac99f10f415eafad000836c10cb9dfedcb5d. Takipli fixture sonradan HEAD içeriğine geri alındı.
- Beş tekrarın tüm ham metrikleri ve dosya SHA’ları [A2 baseline JSON özetinde](kanit/baseline-20261014-173918-2c0b682-baseline-06.json); full-run raporu [PDF v4 rapor çıktısı](kanit/pdf-v4-report-20261014-173918-2c0b682-baseline-06.md). docs/pdf-viewer-v4/baseline.json değiştirilmedi; --write-baseline kullanılmadı.

## Rapor ayrımı ve optimizasyon kararı

npm run check:pdf-v4:report exit 1 verdi: rapor aracı project=webkit bilgisini filtrelemeden S4 WebKit p95 değerlerini desktop S4 ≤50 ms eşiğiyle karşılaştırıyor. Playwright config WebKit’i smoke-only olarak belirtiyor; gate modunda recordAndGate WebKit budget’ı uygulamadan dönüyor. Bu nedenle araç raporunda 35 WebKit karşılaştırması ve iki kırmızı bilgi satırı var; desteklenen Chromium profillerindeki 194 budget kontrolünün tamamı geçti, ölçülmeyen budget metrik yok.

Ayrıca pdf-v4-run.mjs sabit .next/BUILD_ID kontrol ettiği için özel NEXT_DIST_DIR ile exit 2 verdi. Önceki .next/dev önbelleğini korumak için build .next-pdf-a2-retry dizininde alındı; testler aynı PDF config’i doğrudan, PLAYWRIGHT_PRODUCTION_SERVER=1 ve bu build diziniyle çalıştırıldı. .next/dev değişmedi.

Takip edilecek üç ölçüm adayı:

1. WebKit S4 gapP95 145–151 ms ve blank settle 64–95 ms; smoke olduğu için tekrar ölçülmeden darboğaz sayılmaz.
2. S5 tr-metin pinch-in anchor drift 155.4/185 px tek örnek; pinch-in tekrarı olmadan gesture kodu değiştirilmemeli.
3. Mobile A0 S1 TTFR n=5 medyanı 2648 ms / 3500 ms budget; upload sonrası route-to-render süresidir, bileşenleri ayrıştırılmadan optimizasyon gerekçesi değildir.

Bu sinyaller henüz doğrulanmış darboğaz değildir. **Optimizasyon gerekçesi bulunmadı.** A3’te Range/lease/worker kararlılık ve güvenlik kapsamına devam edilebilir. Performans kazanımı iddia edilmez.

**A2 GECTI. A3 yalnız kullanıcının sonraki tek devam talimatıyla başlatılır.**
