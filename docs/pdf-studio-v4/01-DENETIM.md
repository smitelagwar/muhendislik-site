# 01 — Denetim Bulguları (kod okunarak çıkarıldı)

Güven düzeyleri: **[KANIT]** = kodda/dosyada doğrudan görüldü. **[ÖN-ÖLÇÜM]** = önceki bir oturumda ölçüldü, A1/A2'de testle yeniden doğrulanacak. **[HİPOTEZ]** = koddan şüpheleniliyor, A1'de ölçülmeden düzeltilmez.

## Mimari özet [KANIT]
- Giriş: `preview/pdf-viewer.tsx` → `studio/pdf/pdfjs-studio.tsx` (1884 satır, tüm durum burada).
- Sayfa: `pdf-page-view.tsx` (canvas çift tampon + resmi `TextLayer` + vurgu katmanı + link katmanı).
- Zoom/pinch: `use-zoom-gestures.ts` (içerik CSS transform → commit → yeniden render). Pan/çift tık: `pdf-gesture-engine.ts`.
- Kuyruk: `pdf-render-queue.ts` (öncelik = aktif sayfaya uzaklık). Geometri: `pdf-geometry.ts`.
- Yükleme: `pdfjs-loader.ts` (ortak singleton worker). pdf.js: `public/vendor/pdfjs/pdf.min.mjs` + `pdf.worker.mjs`, `src/lib/pdfjs-client.ts` ile yüklenir (5 `/belgeler` stüdyosu da aynı yükleyiciyi kullanır).
- **Karar: mimari korunur.** Resmi `PDFViewer` sınıfına geçiş yapılmaz (1900 satırlık testli kodun yeniden yazımı, zayıf uygulayıcı için kabul edilemez risk). Resmi viewer'dan yalnız fikir alınır (piksel bütçesi, ölçek yuvarlama, ayrık boyut ölçümü).

## Bulgular

### B1 — Modern pdf.js build'i eski tarayıcıda çalışmıyor [KANIT + ÖN-ÖLÇÜM]
`public/vendor/pdfjs/pdf.min.mjs` (458 705 bayt) = `node_modules/pdfjs-dist/build/pdf.min.mjs` ile aynı boyut; yani **modern** build. Bu build ve `pdf_viewer.mjs` polyfill'siz şu API'leri kullanıyor: `Map.prototype.getOrInsertComputed`, `Promise.try`, `Promise.withResolvers`, `Float16Array`, `Math.sumPrecise`, `RegExp.escape`, `Uint8Array.fromBase64/toBase64`. Legacy build'lerde aynı dosyalarda `core-js` polyfill'i var (`legacy/build/pdf.min.mjs` içinde `core-js` geçiyor, modern'de yok). Önceki oturum Chromium 141'de sayfa çizilemediğini ölçtü. → **A2**.
Ek tuzak: `/vendor/pdfjs/(.*)` için `Cache-Control: immutable, 1 yıl` ([next.config.ts](file:///c:/Users/hsyn/Desktop/muhendis-mimar-portali/next.config.ts)). Dosya adı aynı kalarak içerik değişirse eski ziyaretçiler **1 yıl** eski build'de kalır → URL'ye sürüm parametresi şart.

### B2 — Arka plan lease yenilemesi okurken belgeyi yeniden yüklüyor [KANIT]
`document-studio-shell.tsx`: 60 sn'lik interval, lease bitmeye 120 sn kala `refreshCurrentLease()` → `setCurrentLease` → `accessUrl` prop'u değişir. `pdfjs-studio.tsx` yükleme `useEffect`'inin bağımlılığında `accessUrl` var (≈satır 801) ve efekt başında `setLoading(true)` yapıyor; render alanı `!loading && pdfDoc &&` koşuluna bağlı → **okuma sırasında ekran spinner'a döner, tüm sayfa DOM'u yok olur, konum 80–230 ms'lik zamanlayıcılarla geri sarılmaya çalışılır.** Ayrıca cleanup belgeyi `destroy()` ediyor. → **A3**.
Tamamlayıcı: `disableAutoFetch: true` ile küçük belgede bile sayfalar Range ile isteniyor; lease dolduktan sonra yeni parçalar 401/403 alır ve sayfalar sessizce boş kalır (hata yalnız `console.warn`). → **A3 + A4**.

### B3 — Yerel stream route'u Range'i hatalı işliyor [KANIT]
`src/app/api/dokumantasyon/files/[id]/stream/route.ts`:
- `bytes=-500` (sonek) ayrıştırılamıyor (`NaN`).
- `end >= fileSize` ise 416 dönüyor; standart gereği `end` dosya sonuna **kırpılmalı**.
- Aralıksız istekte `fs.readFileSync` tüm dosyayı belleğe alıyor; istemci iptalinde akış kapanmıyor.
→ **A3**.

### B4 — Tüm sayfalar her zaman `getPage` + `getAnnotations` çağırıyor [KANIT]
`pdf-page-view.tsx` "1. PDF Sayfasını…" efekti `isWithinWindow` ile **kapılı değil**: 500 sayfalık belgede açılışta 500 `getPage`, 500 `getAnnotations`, 500 IntersectionObserver. Yalnız canvas/text layer pencere ile sınırlı. → **A4**.

### B5 — Karışık boyutlu belgede yerleşim zıplaması [KANIT + HİPOTEZ]
Ölçülmemiş sayfalar `firstPageSize` ile yerleşiyor; gerçek boyut sayfa görününce gelince yükseklik değişiyor, `handleDimensionsMeasured` scroll'u sayfa-başına düzeltiyor. Paftalı (A4/A3 karışık) belgede kaydırma çubuğu ve `scrollRatio` kayıtları oynuyor. → **A4** (arka planda toplu boyut ölçümü).

### B6 — Telefon bellek bütçesi sınırı aşıyor [KANIT + HESAP]
Sabit pencere `PAGE_WINDOW_N = 5` (11 sayfa). Dokunmatikte piksel bütçesi 6 M ama `computePageGeometry` `outputScale` tabanı **1.0**: bütçe aşılsa bile bitmap = CSS boyutu. Dokunmatik azami zoom %300 → ölçek 4 → A4 = 595×842×16 ≈ **8 M piksel/sayfa**. Çift tampon (geçici ikinci canvas) ile birlikte iOS Safari'de ~10–20 sayfa × 32 MB → sekme çökmesi riski. → **A4**.

### B7 — Render hatasında sayfa sonsuza dek "rendering" [KANIT]
`pdf-page-view.tsx` hata callback'i yalnız `console.warn`. Kullanıcı yeniden deneyemez; iOS canvas bellek kaybında (boş canvas) kurtarma yok. → **A4**.

### B8 — Yazdırma yalnız gizli iframe + `contentWindow.print()` [KANIT]
iOS Safari ve bazı Android tarayıcılarda çalışmaz; hata yakalanınca `window.print()` **tüm uygulamayı** yazdırır. → **A6**.

### B9 — Açılışta ilk sayfa yaklaşık 300 px aşağıda başlıyor [ÖN-ÖLÇÜM, HİPOTEZ]
Önceki oturum belirtti; kodda sayfa 1 için `scrollTo` yapılmıyor. Neden `scrollContainer` padding'i / `scrollbar-gutter` / `restorePosition` olabilir. **A1'de testle ölçülür**; gerçekse A4'te düzeltilir, değilse not düşülüp kapatılır.

### B10 — Zoom/pinch [HİPOTEZ, kodda net kusur görülmedi]
`use-zoom-gestures.ts` mantığı tutarlı (sayfa-uzayı çıpası, `data-zooming`, kuyruklu zoom). Gözlenen sorun kullanıcıdan geliyor ("zoom kararsızlığı, mobil gesture") — kök neden ölçülmeden kodlanmaz. **A5 = ölçüm tabanlı**: invariant testleri yazılır, kırmızı çıkan neyse o düzeltilir.

## Bilinen kapsam dışı (bu plan yapmaz)
Resmi `PDFViewer` göçü, annotation editing, form doldurma, sayfa küçük resimlerinin sanal listesi, OCR, sunucu tarafı PDF dönüştürme.
