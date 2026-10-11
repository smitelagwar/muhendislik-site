# PDF Studio V5 — Kapanış ve Doğrulama Raporu (A6 + A7 + A8)

> [!NOTE]
> `07-acik-maddeler.md` (A7) kapsamındaki otomatik maddeler (`O1`–`O5`) doğrulanmıştır; O6 fiziksel cihaz kontrolü kullanıcıda, H23 gerçek yazdırma önizlemesi başsız ortamda doğrulanamaz. A8 kapanış doğrulamaları §2 ve `08-son-kapanis.md` §3'te kayıtlıdır.

## 1. H1–H24 Hata Durum ve Kanıt Tablosu

| ID | Önem | Özet | Durum | Kanıt (Test / Doğrulama) |
|----|------|------|-------|--------------------------|
| H1 | P0 | Sekme gizlenip geri gelince `governor` bütçesinin 0 kalması ve beyaz sayfa | Çözüldü | `tests/pdf-v4/v5-a1-bellek.spec.ts` → `sekme gizle-göster sonrası bütçe geri gelir ve tuvaller dolu`, `tests/pdf-v4/s13-visibility-memory.spec.ts` (desktop & mobile), `tests/pdf-v4/unit/engine.test.ts` |
| H2 | P0 | `Governor.setVisible` çağrılmadığı için ekrandaki tile'ların silinmesi | Çözüldü | `tests/pdf-v4/v5-a1-bellek.spec.ts` → `ekrandaki tile'lar zorla tahliyede kurtarılır`, `tests/pdf-v4/unit/engine.test.ts` |
| H3 | P0 | Karışık boyutlu belgede (A4+A3) zoom-in'de sayfanın yatayda ekran dışına çıkması | Çözüldü | `tests/pdf-v4/v5-a2-zoom-yerlesim.spec.ts` → `karisik-60: tüm boyutlar yüklenince sayfa 1 yatayda görünür`, `karisik-60: klavye zoom ×4 boyunca geçerli sayfa ekranda ve dolu`, `tests/pdf-v4/s02-keyboard-zoom.spec.ts` |
| H4 | P0 | `viewRect` null iken tüm sayfanın tile'lanması ve sayfa içi kaydırmada yeni tile istenmemesi | Çözüldü | `tests/pdf-v4/v5-a2-zoom-yerlesim.spec.ts` → `a0-vektor: yüksek zoomda sayfa içi kaydırma yeni tile çizer, tüm sayfa tile'lanmaz`, `tests/pdf-v4/s07-large-format.spec.ts` |
| H5 | P0 | Tile başına `setGenerations([...prev])` nedeniyle `Maximum update depth exceeded` | Çözüldü | `tests/pdf-v4/v5-a1-bellek.spec.ts` → `yüksek zoomda 'Maximum update depth' hatası yok` |
| H6 | P1 | Döndürünce motorun yeniden yaratılması ve konumun 1. sayfaya sıfırlanması | Çözüldü | `tests/pdf-v4/v5-a2-zoom-yerlesim.spec.ts` → `döndürme konumu ve motoru korur`, `tests/pdf-v4/unit/engine.test.ts` |
| H7 | P1 | Tile/backdrop anahtarında `rotation` olmaması nedeniyle eski yön görüntüsünün gelmesi | Çözüldü | `tests/pdf-v4/v5-a2-zoom-yerlesim.spec.ts` → `döndürme sonrası görüntü yönü doğru` |
| H8 | P1 | `Ctrl+Shift+-` (`_` / `NumpadSubtract`) saat yönü tersi döndürmenin çalışmaması | Çözüldü | `tests/pdf-v4/v5-a3-klavye-gezinme.spec.ts` → `1. Ctrl+Shift+- saat yönü tersi döndürür` |
| H9 | P1 | v4'te `#pdf-page-N` olmadığı için scrubber ve `offsetRatio` kaydının çalışmaması | Çözüldü | `tests/pdf-v4/v5-a3-klavye-gezinme.spec.ts` → `5. scrubber sürüklerken görünüm kayar`, `6. okuma konumu sayfa içi oran ile kaydedilir ve yeniden açılınca geri gelir` |
| H10 | P1 | Aramada sonraki eşleşmenin eşleşme kutusuna (`scrollToRect`) kaymaması | Çözüldü | `tests/pdf-v4/v5-a3-klavye-gezinme.spec.ts` → `8. arama: sonraki eşleşme ekranda` |
| H11 | P1 | Arama efektinin `scrollToPage` bağımlılığı yüzünden kenar çubuğu/gece modunda sıfırlanması | Çözüldü | `tests/pdf-v4/v5-a3-klavye-gezinme.spec.ts` → `9. arama sürerken kenar çubuğu açmak konumu bozmaz` |
| H12 | P1 | Geri/ileri geçmişinin ham `scrollTop` saklaması ve zoom sonrası yanlış yere dönmesi | Çözüldü | `tests/pdf-v4/v5-a3-klavye-gezinme.spec.ts` → `7. geri geçmişi zoom sonrası doğru yere döner` |
| H13 | P1 | Dokunmatik kaydırmanın tek/çift dokunma sayılması (araç çubuğu titremesi ve yanlış zoom) | Çözüldü | `tests/pdf-v4/v5m-a4-dokunmatik.spec.ts` → `1. kaydırma jesti araç çubuğunu değiştirmez`, `2. gerçek tek dokunma araç çubuğunu gizler/gösterir`, `3. iki ardışık kaydırma zoom yapmaz`, `4. çift dokunma hâlâ yakınlaştırır` |
| H14 | P2 | Pinch sırasında lastik bant (`overshoot`) davranışının `clampScale` ile kesilmesi | Çözüldü | `tests/pdf-v4/v5m-a4-dokunmatik.spec.ts` → `5. pinch lastik bant: jest ortasında aşım, bırakınca sınıra döner`, `tests/pdf-v4/unit/engine.test.ts` |
| H15 | P2 | `Space`, `PageUp`/`PageDown`, oklar, `Home`/`End` klavye gezinme ve basılı `Space` el aracı | Çözüldü | `tests/pdf-v4/v5-a3-klavye-gezinme.spec.ts` → `2. PageDown/PageUp/Space/oklar kaydırır (odak body iken)`, `3. Space basılı tutma el aracını açar, sayfa kaydırmaz` |
| H16 | P2 | Klavye zoom'un imleç belge üzerindeyken animasyonsuz olması | Çözüldü | `tests/pdf-v4/v5-a3-klavye-gezinme.spec.ts` → `4. klavye zoom imleç belge üzerindeyken animasyonlu ve çıpa sabit` |
| H17 | P2 | `PdfPageHost` unmount'ta `pageProxy.cleanup()` çağrılmaması | Çözüldü | `tests/pdf-v4/s08-memory-leak.spec.ts` (desktop & mobile), `src/components/dokumantasyon/studio/pdf/engine/pdf-page-host.tsx` |
| H18 | P2 | Tile/backdrop render hatasının sessiz yutulması ve yeniden deneme olmaması | Çözüldü | `tests/pdf-v4/v5-a1-bellek.spec.ts` → `render hatasında 2 yeniden deneme sonrası retry düğmesi çıkar ve tıklanınca kurtarır`, `src/components/dokumantasyon/studio/pdf/engine/pdf-page-host.tsx` |
| H19 | P2 | `maxScaleForHeight` hesabının her `clampScale` çağrısında tekrarlanması | Çözüldü | `tests/pdf-v4/unit/engine.test.ts` (`maxScale-cache`), `tests/pdf-v4/s14-10k-pages.spec.ts` |
| H20 | P2 | Düşük zoomda `visibleRange` sayfa sayısının sınırsız olması | Çözüldü | `tests/pdf-v4/v5-a5-uyum.spec.ts` → `düşük zoomda mount edilen sayfa sayısı sınırlı`, `tests/pdf-v4/unit/engine.test.ts` (`range-cap`) |
| H21 | P2 | v4'te `getFitScale` hesabının geçerli sayfa yerine hep 1. sayfa boyutunu kullanması | Çözüldü | `tests/pdf-v4/v5-a5-uyum.spec.ts` → `fit-width karışık boyutlu belgede geçerli sayfaya göre`, `tests/pdf-v4/s12-fit-width-scroll.spec.ts` |
| H22 | P3 | Monitör/tarayıcı zoom değişiminde `devicePixelRatio` değerinin güncellenmemesi | Çözüldü | `tests/pdf-v4/v5-a5-uyum.spec.ts` → `DPR değişince tile çözünürlüğü güncellenir` |
| H23 | P3 | Yazdırma iframe'inin `0×0` ve `visibility:hidden` olması, blob'un erken silinmesi | Kısmen (DOM sözleşmesi doğrulandı; gerçek yazdırma önizlemesi başsız ortamda doğrulanamaz) | `tests/pdf-v4/v5-a5-uyum.spec.ts` → `yazdırma iframe'i gizli değil` + Elle Kontrol #7 |
| H24 | P3 | `engine.onScroll` zamanlayıcısının aktif jest sırasında `scheduler`'ı `idle` yapması | Çözüldü | `tests/pdf-v4/unit/engine.test.ts` (`gesture-guard`), `tests/pdf-v4/v5m-a4-dokunmatik.spec.ts` |

---

## 2. Kapı Sonuçları ve Baseline Karşılaştırması

### 2.1 Statik ve Birim Kapılar
- `npx tsc -p tsconfig.next.json --noEmit --incremental false` → **GEÇTİ** (0 hata).
- `npx tsc --noEmit --incremental false` → **repo geneli başarısız** (exit 2); tanılar üretilmiş `.next-playwright-*`, arşiv `docs/pdf-viewer-v4/ekler/**` ve değişmemiş CAD / Drive testlerindedir. Güncel PDF V5 kaynak ve test yollarında **0 TypeScript tanısı**.
- `npm run check:pdf-v2:unit` → **GEÇTİ** (7/7).
- `npm run check:pdf-v3:unit` → **GEÇTİ** (tümü geçti).
- `npm run check:pdf-v4:unit` → **GEÇTİ** (14/14).
- A8.3 lint kapsamı (`08-son-kapanis.md` dosya listesi) → **0 hata / 4 uyarı**; A8.3 öncesinde 0 hata / 17 uyarıydı. Kalan 4 uyarı `75dbf79` öncesi koddan geliyor (`pdfDoc`/`pageProxy` ve yazdırma `any` tipleri, eski immutability disable yönergesi; `git blame` ile doğrulandı). A7'deki tam repo lint sonucu **333 hata / 535 uyarı** idi; bu eski repo-geneli borç A8 kapsamı dışında.

### 2.2 Production Derleme ve Gate (`report-baseline.md` Karşılaştırması)
- `npm run build` → **GEÇTİ** (exit code 0).
- `npm run check:pdf-v4:gate` → **79 / 79 GEÇTİ** (`desktop`, `mobile`, `compat`, `webkit` projelerinin tamamında **0 bütçe ihlali**, A8.5'te `4.9dk`).
- A8.1 S10 flaky doğrulaması: `npm run build` ardından `PLAYWRIGHT_PRODUCTION_SERVER=1 npx playwright test -c playwright.pdf-v4.config.ts --project=compat tests/pdf-v4/s10-compat.spec.ts --repeat-each=15 --reporter=line` → **15 / 15 GEÇTİ**; ilk tekil gate hatası yeniden üretilemedi, kod değişikliği yapılmadı. `openError` değeri `firstError` olarak kayda alınır.
  - **Baseline (`docs/pdf-viewer-v4/report-baseline.md`) karşılaştırması:** Baseline raporunda S1–S14 genelinde toplam **109 bütçe ihlali** bulunuyordu (`S1 scrollTopPx: 306 → 0`, `S1 mountedPages: 1000 → ≤15`, `S2/S3/S5 anchorDriftPx: 59–406px → ≤1.5px`, `S7 sharpRatio: 0.4 → ≥0.95`, `S11 topAnchorFyDelta: 0.091 → ≤0.01`, `S12 zoomPercentChanges: 11 → 0`, `S13 canvasBytesMBHidden: 292.1 MB / 43.1 MB → ≤24 MB / ≤16 MB`, `S14 gapP95Ms: 183.5 ms → ≤40 ms`). V5 + A7 sonrasında `check:pdf-v4:gate` içindeki **79 testin tamamı 0 ihlalle geçti**.
- `npm run check:pdf-v4:gate:mobile-slow` (4× CPU yavaşlatmalı `mobile-throttled` profili) → **30 / 30 GEÇTİ** (A8.5'te `2.4dk`, **0 bütçe ihlali**, `budgets.json` gevşetilmeden).
  - **A7.2'de çözülen S5 `mobile-slow` kök nedenleri:**
    1. `div.placeholder` üzerinde `pointer-events-none` olmaması nedeniyle, 4000 çizgili ağır A1 sayfası (Sayfa 18) henüz `"empty"` iken başlayan `touchstart` olayının `e.target`'ı `div.placeholder`'a bağlanıyor; 30–60ms sonra backdrop tamamlanıp `div.placeholder` DOM'dan sökülünce W3C Touch Events standardı gereği kalan `touchmove`/`touchend` olayları kopuk düğüme gidip `scroller`'a ulaşmıyordu (`div.placeholder`'a `pointer-events-none` eklendi).
    2. `scrollToFraction(page, 0.3)` sonrasında ekran dışındaki overscan sayfalarının (Sayfa 16, 17, 20) görünür ağır Sayfa 18 ile aynı `getPage` ve `scheduler` `cls: 1, dist: 1` önceliğine girip 2 eşzamanlı slotu doldurması engellendi (görünür sayfalar hemen, ekran dışı overscan sayfalar `25ms` gecikmeyle ve `dist + 100` ile kuyruğa alındı).
    3. Jest bitiminde `endPinch` → `setLiveScale` tarafından yapılan programatik `scrollTop` değişiminin bir sonraki karede ürettiği doğal `scroll` olayının `engine` içinde `scheduler`'ı `80–160ms` boyunca `"scrolling"` durumuna sokup `cls: 1.5` keskin tile işlerini durdurması ve `viewTick` ile aktif tile render'larını iptal etmesi 250ms jest-sonrası korumasıyla (`now - this.gestureAt < 250`) önlendi.
    4. `<PdfPageOverlays>` katmanının yalnızca ilk keskin nesil hazır olduğunda (`pageState === "rendered" || generations.some((g) => g.isReady)`) mount edilmesi sağlanarak ekran dışı backdrop sayfalarının `streamTextContent` ile PDF.js worker'ını tıkaması engellendi ve `data-page-state` özniteliği tuval çizildiği anda senkron güncellendi.

### 2.3 E2E Regresyon Paketleri
- `tests/pdf-v4/v5-a1-bellek.spec.ts`, `v5-a2-zoom-yerlesim.spec.ts`, `v5-a3-klavye-gezinme.spec.ts`, `v5-a5-uyum.spec.ts` (`--project=desktop`) → **22 / 22 GEÇTİ** (H18 otomatik testi dahil).
- `tests/pdf-v4/v5m-a4-dokunmatik.spec.ts` (`--project=mobile`) → **5 / 5 GEÇTİ**.
- A8.5 birleşik Chromium regresyonu (`pdf-viewer-v3-invariants`, `pdf-viewer-toolbar-parity`, `pdf-viewer-v2`) → **11 passed, 3 skipped/fixme, 0 failed**. V3 değişmezleri ve toolbar parity **11/11** geçti; v2'de 4 test geçti, `75dbf79`'da da kırmızı olduğu A7.1'de kanıtlanan 3 eski test `test.fixme` olarak işaretlidir.

---

## 3. Çalıştırılamayanlar

- **H23 gerçek tarayıcı yazdırma diyaloğu / önizlemesi:** Başsız (headless) Playwright ortamında işletim sistemi yazdırma önizleme penceresi pikselleri okunamadığından iframe DOM/CSS görünürlük sözleşmesi (`width >= 100px`, `height >= 100px`, `visibility !== "hidden"`, `display !== "none"`) otomatik testle doğrulandı; gerçek yazdırma önizlemesi aşağıdaki elle kontrol listesinde yer almaktadır.

---

## 4. Elle Cihaz Kontrol Listesi (Kullanıcı İçin)

> Kullanıcı tarafından yapılacak; push sonrası Production'da doğrula.

1. **Masaüstü Chrome — Sekme Dönüşü (H1):** PDF aç → başka sekmeye geç, 30 sn sonra dön → sayfalar dolu mu; hızlıca kaydır.
2. **Karışık Boyutlu Belgede Yüksek Zoom (H2, H3, H4, H5):** A4+A3 karışık belgede `Ctrl++` ile `%500`'e çık; sayfa ekranda mı; sayfa içinde kaydır.
3. **Döndürmede Konum Korunumu (H6, H7, H8):** Sayfa 10'dayken `Ctrl+Shift++` / `Ctrl+Shift+-` → konum korunuyor mu.
4. **Klavye Gezinme ve El Aracı (H15, H16):** `Boşluk`, `PageUp`/`PageDown`, oklar, `Home`/`End`; `Boşluk` basılı tutup sürükle (el aracı).
5. **Arama ve Eşleşmeye Kaydırma (H10, H11):** Aynı sayfada birden çok eşleşme → `Ctrl+G` ile eşleşmeye kayıyor mu; arama açıkken `F4`.
6. **Telefon (Android + iPhone Safari) Dokunmatik Jestler (H13, H14, H24):** Kaydır → araç çubuğu titremiyor mu; tek dokunma gizle/göster; çift dokunma zoom; pinch sınırda lastik.
7. **Yazdırma (Chrome Masaüstü — H23):** Yazdır → önizleme boş değil mi. (H23 başsız ortamda doğrulanamaz.)
8. **Çoklu Monitör / DPR Değişimi (H22):** Windows'ta farklı DPR'li ikinci monitöre pencere taşı → bulanıklık/keskinlik.

---

## 5. 11.10.2026 A7 Sonu Çalışma Ağacı Doğrulaması (Tarihsel)

- `npm run build` ve `npx tsc -p tsconfig.next.json --noEmit --incremental false` → **GEÇTİ**.
- `npm run check:pdf-v2:unit`, `npm run check:pdf-v3:unit`, `npm run check:pdf-v4:unit` → **GEÇTİ**.
- `npm run check:pdf-v4:gate` → ilk tam koşuda 78/79 (S10 bir kez açılış hatası verdi); S10 tek başına 3/3 ve ikinci tam koşu **79/79 GEÇTİ**. Test artık `openPdf` hatasını sonuç kaydına ekler.
- `npm run check:pdf-v4:gate:mobile-slow` → **30/30 GEÇTİ**.
- Tam PDF v2/v3 regresyon koşusu → **11 geçti, 3 başarısız**. Başarısızlar A7.1'de `75dbf79` ana dalında da kanıtlanan v2 vurgu hizalama, karışık boyut ve Rotate=90 kusurlarıdır; v3 değişmezleri ve toolbar parity testleri geçti.
- `npm run lint -- --max-warnings=9999` ve genel `npx tsc --noEmit --incremental false` repo genelinde temiz değil; yukarıdaki kapsam dışı tanılar nedeniyle bu planın değişen PDF V5 yollarında hata olmadığı ayrıca doğrulandı.
