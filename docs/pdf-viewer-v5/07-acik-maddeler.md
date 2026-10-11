# PDF Studio V5 — Açık Maddeler ve Düzeltme Planı (A7)

> `06-sonuc.md` raporundaki açık maddeler bu plan (`A7.1`–`A7.5`) kapsamında incelenmiş, düzeltilmiş ve doğrulanmıştır.

## 1. Planda yapılamayan / doğrulanamayan maddelerin son durumu

| # | Madde | Durum | Sonuç ve Kanıt |
|---|-------|-------|----------------|
| O1 | `npm run check:pdf-v4:gate:mobile-slow` → S5 pinch `karisik-60` ve `metin-1000` `blankFrames` / `diag-pan` | **Çözüldü (A8.5: 30/30 GEÇTİ)** | `budgets.json` gevşetilmeden `check:pdf-v4:gate:mobile-slow` A8.5'te 30/30, `check:pdf-v4:gate` 79/79 ve 0 bütçe ihlaliyle geçti. |
| O2 | `pdf-viewer-v2.spec.ts` 3 eski kırmızı test (vurgu hizalama, karışık boyut oranı, Rotate=90) | **İzole edildi (3 fixme)** | `75dbf79` üzerinde de kırmızı oldukları A7.1'de kanıtlandı. A8.4'te `test.fixme` yapıldı; v2 paketi 4 passed, 3 skipped/fixme, 0 failed. |
| O3 | H18 (render hatası → yeniden deneme + `pdf-page-retry-N` düğmesi) | **Çözüldü (Test Eklendi)** | `tests/pdf-v4/v5-a1-bellek.spec.ts` içine 4. test (`render hatasında 2 yeniden deneme sonrası retry düğmesi çıkar ve tıklanınca kurtarır`) eklendi ve geçti. |
| O4 | H23 yazdırma önizlemesi | **Başsız ortamda doğrulanamaz** | Iframe DOM/CSS sözleşmesi (`v5-a5-uyum.spec.ts`) otomatik doğrulandı; gerçek önizleme Elle Kontrol #7'de. |
| O5 | `npm run lint` tam koşusu | **V5 kapsamı 0 hata; 4 eski uyarı kaldı** | A8.3 lint kapsamı 17 uyarıdan 4'e indi; kalan 4 uyarının kaynak satırları `75dbf79` öncesi commit'lerde (`git blame`). A7 tam repo lint'i 333 hata / 535 uyarı göstermişti; repo geneli borç bu kapsama alınmadı. |
| O6 | Elle cihaz kontrolleri (8 madde, `06-sonuc.md` §4) | **Kullanıcıda** | Android / iPhone Safari / çift monitör. |

## 2. Uygulanan A7 adımları ve bulgular

### A7.1 — O2: `pdf-viewer-v2.spec.ts` `git stash` doğrulaması (Tamamlandı)
- V5 değişiklikleri `git stash push` ile kenara alınıp `main` (`75dbf79`) üzerinde `npx playwright test --config=playwright.config.ts tests/document-studio/pdf-viewer-v2.spec.ts --project=chromium` çalıştırıldı.
- Sonuç: `main` üzerinde de birebir aynı 3 test (`1. Vurgu Hizalama`, `4. Karışık Boyut`, `5. Döndürülmüş Sayfa`) başarısız, diğer 4 test başarılı oldu; ardından `git stash pop` ile çalışma ağacı geri yüklendi.

### A7.2 — O1: S5 `mobile-slow` (`blankFrames` ve `diag-pan`) kök neden analizi ve düzeltmesi (Tamamlandı)
- **Kök Neden 1 (`div.placeholder` dokunma hedefi kopması):** `pdf-page-host.tsx` içindeki `pageState === "empty"` yer tutucu `div.placeholder` öğesinde `pointer-events-none` yoktu. `karisik-60` Sayfa 18 (4000 çizgili ağır A1) henüz `"empty"` iken başlayan `touchstart` olayının `e.target` düğümü `div.placeholder` oluyor; 30–60ms sonra backdrop çizimi bitip `div.placeholder` DOM'dan kaldırılınca W3C Touch Events standardı gereği sonraki tüm `touchmove` ve `touchend` olayları kopuk düğüme gönderiliyor ve `scroller`'a hiç ulaşmıyordu (`scaleRatioError` ve `scheduler`'ın `"gesture"` durumunda asılı kalıp `sharpMs=∞` olması). `div.placeholder`'a `pointer-events-none` eklendi.
- **Kök Neden 2 (Görünür ağır sayfanın ekran dışı overscan sayfalarıyla yarışması):** `scrollToFraction(page, 0.3)` sonrasında `currentPage` 19 olduğunda, ekran dışındaki hafif A4 Sayfa 20 (`|20-19|=1`) ile ekranda görünen ağır A1 Sayfa 18 (`|18-19|=1`) aynı `getPage` ve `cls: 1, dist: 1` önceliğine sahipti. `pdf-page-host.tsx` içinde `getPage` çağrısı görünür sayfalar için anında, ekran dışı overscan sayfalar için `25ms` gecikmeli yapıldı; Backdrop işlerinde görünür sayfalara `dist: 0..N`, ekran dışı sayfalara `dist: 100 + N` verildi.
- **Kök Neden 3 (Jest bitimindeki programatik `scroll` olayının keskin tile çizimini iptal etmesi):** `endPinch` sonunda `setLiveScale` ile yapılan `scrollTop` değişimi bir sonraki karede tarayıcı `scroll` olayı tetikliyor; `engine.onScroll` `scheduler`'ı `"scrolling"` durumuna geçirip `cls: 1.5` keskin tile işlerini 80–160ms durduruyor ve `view` olayıyla `viewTick`'i artırarak Sayfa 18'in devam eden tile çizimlerini iptal ediyordu. `engine.settleScale()`, `engine.setInteraction()` ve `engine.onScroll()` içine 250ms jest-sonrası programatik kaydırma koruması eklendi.
- **Kök Neden 4 (`data-page-state` senkronizasyonu ve `<PdfPageOverlays>` zamanlaması):** Tuval çizildiği anda `boxRef.current.setAttribute("data-page-state", ...)` doğrudan güncellendi; `<PdfPageOverlays>` yalnızca ilk keskin nesil hazır olduğunda (`pageState === "rendered" || generations.some((g) => g.isReady)`) mount edilerek ekran dışı backdrop sayfalarının `streamTextContent` ile worker'ı meşgul etmesi önlendi.
- **Doğrulama:**
  - `npm run check:pdf-v4:gate:mobile-slow` → **30 passed (2.6m)**
  - `npm run check:pdf-v4:gate` → **79 passed (5.0m)**

### A7.3 — O3: H18 otomatik testi (Tamamlandı)
- `tests/pdf-v4/v5-a1-bellek.spec.ts` dosyasına 4. test eklendi: `window.__failDraw = true` ile `CanvasRenderingContext2D.prototype.drawImage` sentetik hata fırlatacak şekilde sarmalandı; `[data-testid^="pdf-page-retry-"]` düğmesinin görünür olduğu ve tıklandığında sayfanın `data-page-state="rendered"` durumuna kurtarıldığı doğrulandı (`4 passed`).

### A7.4 — O5: Plan komutuyla lint (Tamamlandı)
- `npm run lint -- --max-warnings=9999` çalıştırıldı. PDF V5 kapsamında değişen/eklenen kod dosyalarında **0 hata / 42 uyarı** doğrulandı. Repo geneli sonuç **333 hata / 535 uyarı**; bu plan dışındaki mevcut dosyalardadır.

### A7.5 — Kapanış (Tamamlandı)
- `06-sonuc.md` ve `07-acik-maddeler.md` gerçek koşu sonuçlarıyla güncellendi.

### 11.10.2026 — Güncel çalışma ağacı tekrar doğrulaması
- Production build ve runtime TypeScript kapısı geçti; PDF v2/v3/v4 birim kapıları geçti.
- Tam `check:pdf-v4:gate` ikinci koşuda 79/79, `check:pdf-v4:gate:mobile-slow` 30/30 geçti. İlk tam koşudaki tek S10 hatası tek başına tekrar üretilemedi; S10 testi gelecekteki teşhis için `openPdf` hata metnini kaydedecek şekilde iyileştirildi.
- PDF v2/v3 regresyonunda 11/14 test geçti. Üç başarısız v2 testi `75dbf79` ana dalı üzerinde A7.1'de zaten kanıtlanmış kusurlarla aynı; v3 ve toolbar parity testleri geçti.
- O6 (gerçek Android/iPhone Safari, yazdırma önizlemesi ve ikinci monitör) hâlâ kullanıcı cihazında elle doğrulanmalı.
