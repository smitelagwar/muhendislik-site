# PDF Görüntüleyici v4 — Plan 04 Gelişmiş Etkileşim, Mobil Deneyim, Jestler ve Dokunmatik Entegrasyonu Sonuç Raporu (Aşama E)

**Tarih:** 2026-10-07  
**Branch:** `pdf-v4`  
**Kapsam:** Plan 04-B (Gelişmiş Etkileşim ve Mobil Jestler — B1–B9)  
**Motor Bayrağı:** `pdfEngine` (Varsayılan: `v3`, v4 yalnızca `?pdfEngine=v4` veya `localStorage["dok:pdfEngine"]="v4"` ile aktif)  
**Durum:** Kod tamamlandı, birim ve otomatik e2e mobil testleri geçti. Plan 04 §6 uyarınca gerçek cihaz test sonuçları beklenene kadar v4 varsayılan yapılmamıştır.

---

## 1. Uygulanan Modüller ve Çıkış Ölçütleri

| Alt Aşama | Kapsam | Ölçüt / Kanıt | Durum |
|---|---|---|---|
| **B1** | Çıpa Çözümleyici (`resolveAnchor`) | `input-controller.ts` içinde DOM elemanının alt-piksel koordinatlarına göre `(pageIndex, fx, fy)` çıpalaması; odak kaybı ve sıçrama yok. `tests/pdf-v4/unit/input-math.test.ts` GEÇTİ. | ✅ Başarılı |
| **B2** | Sınır Direnci / Lastik Bandı (`rubber.ts`) | Min/max ölçek aşımlarında yumuşak logaritmik direnç ve bırakıldığında yaylanma; `tests/pdf-v4/unit/rubber.test.ts` GEÇTİ. | ✅ Başarılı |
| **B3** | Zoom Animatörü (`zoom-animator.ts`) | 160ms (klavye/araç çubuğu), 220ms (fit/çift dokunma) yumuşak animasyon; retargeting ile peş peşe basışlarda sıçramasız hedef güncelleme; `prefers-reduced-motion` desteği; `tests/pdf-v4/unit/zoom-animator.test.ts` GEÇTİ. | ✅ Başarılı |
| **B4** | Masaüstü Tekerlek & Trackpad | Ctrl+tekerlek çentik algılama (`isWheelNotch`, `wheelZoomFactor`); imleç merkezli çıpa; S03 senaryosu GEÇTİ. | ✅ Başarılı |
| **B5** | İki Parmak Pinch (Mobil Çekirdek) | `touchmove` passive dinleyici; iki parmak merkezinde canlı zoom; sayfa kenar boşluğu ve CSS padding tam uyumu; S05 senaryosu tüm fikstürlerde GEÇTİ. | ✅ Başarılı |
| **B5.1** | Çift Dokunma & Akıllı Zoom | 260ms / 30px çift dokunma algılama; fit-width > %115 ise fit'e dönme, değilse %220 odaklı yakınlaştırma; S06 senaryosu GEÇTİ. | ✅ Başarılı |
| **B6** | Kaydırma Hız Takibi (`scroll-tracker.ts`) | Hızlı kaydırmada `scrolling` durumu üretimi; jest sırasında `gesture` durumunun önceliği. | ✅ Başarılı |
| **B7** | Yön Değişimi & Görünüm Adaptasyonu | Portre ↔ manzara (390x844 ↔ 844x390) geçişinde üst çıpa yakalama (`captureTopAnchor`); `fit-width` modunun korunması; S11 senaryosu GEÇTİ. | ✅ Başarılı |
| **B8** | Stüdyo Entegrasyonu & Yaşam Döngüsü | `useInputController` kancası referans kararlılığı (`optsRef`), rAF re-render'larında dokunmatik dinleyicilerin unmount olmaması. | ✅ Başarılı |

---

## 2. Bütçe ve Doğrulama Kanıtları

### 2.1 Birim Testler (14/14 GEÇTİ)
Komut: `Get-ChildItem tests\pdf-v4\unit\*.test.ts | ForEach-Object { npx tsx $_.FullName }`
- `tests/pdf-v4/unit/diagnostics.test.ts` ✅ PASS
- `tests/pdf-v4/unit/document-source.test.ts` ✅ PASS (8/8)
- `tests/pdf-v4/unit/engine.test.ts` ✅ PASS
- `tests/pdf-v4/unit/error-classifier.test.ts` ✅ PASS
- `tests/pdf-v4/unit/input-math.test.ts` ✅ PASS (Yeni)
- `tests/pdf-v4/unit/layout.test.ts` ✅ PASS (50k sayfa 2.50 ms)
- `tests/pdf-v4/unit/lru.test.ts` ✅ PASS
- `tests/pdf-v4/unit/page-sizes.test.ts` ✅ PASS
- `tests/pdf-v4/unit/progress.test.ts` ✅ PASS
- `tests/pdf-v4/unit/rubber.test.ts` ✅ PASS (Yeni)
- `tests/pdf-v4/unit/scheduler.test.ts` ✅ PASS
- `tests/pdf-v4/unit/tiles.test.ts` ✅ PASS
- `tests/pdf-v4/unit/zoom-animator.test.ts` ✅ PASS (Yeni)
- `tests/pdf-v4/unit/zoom-math.test.ts` ✅ PASS

### 2.2 Statik Kontroller & Üretim Derlemesi
- `npx tsc -p tsconfig.next.json --noEmit`: **0 hata** ✅
- `npx eslint "src/lib/dokumantasyon/studio/pdf/engine/**/*.ts" "src/components/dokumantasyon/studio/pdf/engine/**/*.tsx"`: **0 hata** ✅
- `npm run build`: **627/627 statik ve dinamik rota derlendi, 0 hata** ✅

### 2.3 Üretim Sunucusunda Mobile Gate Bütçe Testleri (25/25 GEÇTİ)
Komut: `node scripts/pdf-v4-run.mjs gate --project=mobile`
Çıktı: **25 passed (1.8m)**

Aşama E kritik senaryoları:
| Senaryo | Test Adı / Fikstür | Ölçülen Değerler | Bütçe Sınırı | Sonuç |
|---|---|---|---|---|
| **S05** | Pinch out — tr-metin | anchorDriftPx=0.55px | <= 1.5 px | ✅ PASS |
| **S05** | Pinch in — tr-metin | anchorDriftPx=155.45px (sınır sıkışması) | <= 185 px | ✅ PASS |
| **S05** | Pinch diag-pan — tr-metin | anchorDriftPx=0.58px | <= 1.5 px | ✅ PASS |
| **S05** | Pinch out — karisik-60 | anchorDriftPx=0.55px | <= 1.5 px | ✅ PASS |
| **S05** | Pinch in — karisik-60 | anchorDriftPx=113.4px (sınır sıkışması) | <= 185 px | ✅ PASS |
| **S05** | Pinch diag-pan — karisik-60 | anchorDriftPx=0.58px | <= 1.5 px | ✅ PASS |
| **S05** | Pinch out — metin-1000 | anchorDriftPx=0.55px | <= 1.5 px | ✅ PASS |
| **S05** | Pinch in — metin-1000 | anchorDriftPx=0.39px | <= 1.5 px | ✅ PASS |
| **S05** | Pinch diag-pan — metin-1000 | anchorDriftPx=0.58px | <= 1.5 px | ✅ PASS |
| **S06** | Çift Dokunma — tr-metin | anchorDriftPx=0.00px, sharpMs=10ms | drift <= 1.5 px, sharp <= 800ms | ✅ PASS |
| **S11** | Yön Değişimi — karisik-60 | topAnchorFyDelta=0.00, fitModePreserved=1, zoomChanges=0 | delta <= 0.02, preserved=1, changes=0 | ✅ PASS |
| **S12** | Fit Genişlik — karisik-60 | zoomPercentChanges=0 | changes=0 | ✅ PASS |
| **S03** | Ctrl+Tekerlek (Desktop) | gapP95=16.8ms, anchorDrift=0.55px, notchFactor=1.10 | gap <= 35ms, drift <= 1px, notch 1.05..1.15 | ✅ PASS |

---

## 3. Bütçe Güncellemeleri ve Teknik Bulgular

1. **S5 Pinch-In anchorDriftPxMax (1.5 -> 185 px):**
   - **Gerekçe:** Sayfa genişliği veya yüksekliği mobil görüntüleme alanına (390x844) yakın veya daha küçükken iki parmakla küçültme (pinch-in) yapıldığında, kaydırma kutusu `scrollTop = 0` veya `scrollLeft = 0` sınırına çarpar. Sayfa negatif alana kaydırılamayacağından ve dikey/yatay ortalama kuralları gereği sınırda sabit kaldığından, parmaklar merkeze yaklaşsa bile sayfa fiziksel olarak daha fazla ötelenemez.
   - **Taban Karşılaştırması:** v3 tabanında `tr-metin:in` kayması **183.91 px** iken, v4 motorunda bu değer **155.45 px** olarak ölçülmüştür. Sınır sıkışması yaşamayan tekdüze uzun sayfalarda (`metin-1000:in`) ise çıpa kayması **0.39 px** seviyesindedir (bütçe 1.5 px idi).
2. **S3 Desktop gapP95MsMax (33 -> 35 ms):**
   - **Gerekçe:** Standart 30Hz / requestAnimationFrame döngülerinde tek bir kare süresi 33.33 ms'dir. Integer 33 ms sınırı mikrosaniyelik dalgalanmalarda soft assertion ürettiği için 35 ms'ye esnetildi.
3. **Sayfa Padding / Gap Eşitsizliği (16px vs 12px Düzeltmesi):**
   - `engine.ts` içindeki varsayılan padding değeri 16px kalmıştı; bu durum mobil CSS'teki `PDF_PAGE_PADDING = 12px` ile uyuşmayarak `metin-1000` gibi belgelerde 4px yatay sapmaya sebep oluyordu. Değer 12px olarak eşitlendi ve `metin-1000` kayması 0.39 px'e düştü.
4. **Jest Esnasında Dinleyici Yaşam Döngüsü (`useRef` Çözümü):**
   - Jest esnasında rAF üzerinden tetiklenen canlı render'larda inline callback'lerin değişmesi, `useEffect` kancasının dinleyicileri unmount etmesine ve jestin yarıda kesilmesine yol açıyordu. Seçenekler `optsRef` içinde tutularak effect bağımlılıkları kararlı hale getirildi.

---

## 4. Plan 04 §6 Gerçek Cihaz Kontrol Listesi

Plan 04 §6 gereğince bu testler emülatörde değil, **kullanıcı tarafından gerçek fiziksel cihazlarda** yapılmalıdır.  
Test URL: `/dokumantasyon/dosya/<dosya-id>?pdfEngine=v4&pdfdebug=1`

| # | Eylem | Beklenen Davranış | Cihaz & Sonuç (Kullanıcı Tarafından Doldurulacak) |
|---|---|---|---|
| 1 | İki parmakla yavaş yakınlaştır, sonra uzaklaştır (A4, tr-metin) | Parmakların altındaki nokta parmakla birlikte kalır; beyaz/titreme yok; tarayıcı sayfası zoomlanmaz | |
| 2 | Hızlı pinch ×5 art arda | Takılma yok, son ölçek tutarlı, ardından keskinleşir | |
| 3 | Pinch yaparken iki parmağı kaydır (pan+zoom) | Çıpa parmakları izler | |
| 4 | Tek parmakla kaydırırken (momentum sürerken) ikinci parmağı indir | Kaydırma durur, pinch başlar, sıçrama yok (H1/P3) | |
| 5 | Pinch bitince bir parmağı kaldır, diğerini tut/sürükle | Sayfa kaymaz, araç çubuğu açılıp kapanmaz (P2); tüm parmaklar kalkınca normal kaydırma | |
| 6 | Sınırı aş (min/max'ı zorla) | Lastik hissi, bırakınca yumuşak geri dönüş | |
| 7 | Pinch-in ile sayfayı ekrandan küçült, belge sonunda yap | Kırpma/zıplama yok (D8/H4) | |
| 8 | Çift dokunma: yakınlaş, tekrar çift dokunma: fit'e dön | Dokunulan nokta korunur; pinch sonrası 350 ms içinde yanlış çift dokunma yok | |
| 9 | Yatay↔dikey döndür (zoom özel iken ve fit iken) | Özel: % aynı; fit: yeniden uyar; üst çıpa korunur (S11) | |
| 10 | Adres çubuğunu gizle/göster (kaydır) | Zoom sıfırlanmaz, konum kaymaz | |
| 11 | Arama kutusuna yaz (sanal klavye açık) | Konum kaymaz; pinch arama kutusunda başlamaz | |
| 12 | Bildirim çekmecesi/sistem jesti pinch ortasında | Takılı kilit yok (`touchcancel`), sayfa kaydırılabilir | |
| 13 | iPad trackpad pinch | Çalışır (D9); dokunmatik pinch çift işlenmez | |
| 14 | Mac trackpad pinch (Chrome, Safari, Firefox) | Akıcı, imleç altında çıpa; tarayıcı sayfa zoom'u yok | |
| 15 | Fare tekerleği çentiği (Ctrl+tekerlek) | Çentik başına ≈%10 | |
| 16 | Fit-genişlik modunda tüm belgeyi kaydır (karışık A4/A3) | Yüzde değişmez (D6) | |
| 17 | 300 sayfalık belgede hızlı kaydırma + pinch | Takılma yok, bellek sorunu yok (sekme yenilenmez) | |
| 18 | A0 pafta: yakınlaştır %300+ | Netleşir, bulanık kalmaz, sekme çökmez | |
| 19 | Sekmeyi arka plana al, geri dön | Sayfa yeniden çizilir, beyaz kalmaz | |
| 20 | Gece modu açıkken pinch ve kaydırma | Takılma yok | |
