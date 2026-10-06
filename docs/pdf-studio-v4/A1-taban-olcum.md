# A1 — Taban ve Kırmızı-Önce Testler

**Amaç:** Hiçbir üretim kodu değiştirmeden (a) mevcut durumun yeşil/kırmızı tabanını kaydet, (b) A2–A4'ün düzelteceği hataları kanıtlayan testleri yaz.
**Bu aşamada `src/` altında tek satır değişmez.** Yalnız `tests/` ve `docs/pdf-studio-v4/BASELINE.md`.

## Önce oku
1. `tests/document-studio/pdf-viewer-v3-invariants.spec.ts` — PDF'in nasıl açıldığını (giriş, fixture, `data-testid`'ler, bekleme yardımcıları) **aynen** öğren. Yeni spec bunu kopyalar/import eder; kendi açma yöntemi icat etme.
2. `tests/document-studio/cad-test-helpers.ts` ve `scripts/generate-pdf-fixtures.mjs` — fixture PDF'lerin yeri ve üretimi.
3. `playwright.config.ts` — `webServer`, projeler (`chromium`, `mobile-chromium`), timeout'lar.

## Adım 1 — Taban ölçümü
Sırayla çalıştır, her birinin geçen/kalan sayısını `docs/pdf-studio-v4/BASELINE.md` tablosuna yaz (komut, tarih, sonuç, kalan test adları):

```powershell
npx tsc --noEmit --incremental false
npm run check:pdf-v2:unit
npm run check:pdf-v3:unit
npx playwright test --config=playwright.config.ts tests/document-studio/pdf-viewer-v3-invariants.spec.ts --project=chromium
npx playwright test --config=playwright.config.ts tests/document-studio/pdf-viewer-v2-faz-g.spec.ts --project=chromium
```
Zaten kırmızı olan testler **bu işin suçu değildir**; "önceden kırmızı" diye işaretle, düzeltmeye çalışma.

## Adım 2 — Yeni test dosyaları
Oluştur: `tests/document-studio/pdf-v4-helpers.ts` (yalnız v3 spec'indeki açma yardımcısını dışa aktaran ince sarmalayıcı) ve `tests/document-studio/pdf-v4-stabilite.spec.ts`.

### T1 — Eski tarayıcı simülasyonu (A2 düzeltir)
Yeni Chromium'da eski tarayıcıyı, pdf.js'in ihtiyaç duyduğu yeni API'leri **silerek** taklit et. (Not: init script yalnız ana iş parçacığını etkiler; worker polyfill'i bu testle doğrulanamaz — bu sınırlama rapora yazılır, A2'de ek statik kontrol var.)

```ts
const ESKI_TARAYICI_TAKLIDI = () => {
  const sil = (hedef: object, ad: string) => {
    try {
      delete (hedef as Record<string, unknown>)[ad];
    } catch {
      /* silinemeyen API yok sayılır */
    }
  };
  sil(Promise, "withResolvers");
  sil(Promise, "try");
  sil(RegExp, "escape");
  sil(Math, "sumPrecise");
  sil(Map.prototype, "getOrInsertComputed");
  sil(WeakMap.prototype, "getOrInsertComputed");
  sil(Uint8Array, "fromBase64");
  sil(Uint8Array.prototype, "toBase64");
  sil(globalThis, "Float16Array");
};
```
Test: `await page.addInitScript(ESKI_TARAYICI_TAKLIDI)` → PDF'i aç → `[data-testid="pdf-page-1"]` `data-page-state="rendered"` olmalı (en çok 20 sn) ve sayfada `pageerror` olmamalı.
**Beklenen taban:** KIRMIZI (modern build). Yeşil çıkarsa: PDF.js bu API'leri sessizce başka yoldan çözüyor demektir; testi rapora "kırmızı vermedi" diye yaz, A2'yi yine uygula (statik kontrol devrede).

### T2 — Açılışta başlangıç konumu (B9)
PDF'i aç, sayfa 1 `rendered` olunca: `pdf-scroll-viewport` `scrollTop` değerini oku. Masaüstünde `scrollTop === 0`; mobil (`mobile-chromium`) projede `scrollTop === 0` ve `pdf-page-1`'in üst kenarı toolbar altından görünür olmalı (`pageRect.top >= toolbarRect.bottom - 2`).
Sonucu (kırmızı/yeşil) BASELINE.md'ye yaz. Yeşilse B9 "kapandı" olarak raporlanır, A4'te ilgili madde atlanır.

### T3 — Lease yenilenince yeniden yüklenmeme (A3 düzeltir)
`accessUrl` prop'unu test içinde değiştirmek zor olduğundan **ağ düzeyinde** simüle et: PDF açıkken `page.evaluate` ile `window.__pdfDocYuklemeSayaci`'nı OKUMA yapma (böyle bir şey yok). Bunun yerine şunu yap:
1. PDF'i aç ve sayfa 3'e kaydır (`scrollTop` değerini not al).
2. `page.route('**/api/dokumantasyon/**', ...)` ile erişim/lease yenileme yanıtını değiştirmeden **istek sayısını say**.
3. Uygulamanın lease yenileme tetikleyicisi 60 sn'lik interval olduğundan testi hızlandırmak için `page.clock.install()` / `page.clock.fastForward(61_000)` kullan (Playwright ≥1.45). Lease süresi bitmeye 120 sn'den azsa yenileme tetiklenir; fixture lease'i değilse (yerel dosya `isLocal`: yenileme yok) bu test **atlanır** (`test.skip` + neden) ve yerine T3-birim sürümü A3'te yazılır.
Beklenen taban: yenileme olursa `pdf-viewer-status` (spinner) görünür → KIRMIZI. Yenileme tetiklenemiyorsa `skip` ve nedeni rapor.

### T4 — Çok sayfalı belgede getPage sayısı (A4 düzeltir)
`page.addInitScript` ile `window.__getPageCagri = 0` tanımla; PDF yüklendikten sonra `window.pdfjsLib`'in `PDFDocumentProxy.prototype.getPage`'ini **sarmalayıp** sayacı artıran bir script ekle (`pdfjsLib` yüklendiğinde `getDocument(...).promise` sonucundan prototip yakalanır — yardımcıda `page.evaluate` ile belge açıldıktan sonra değil, **ilk `getDocument` çağrısını sarmalayarak** yap). 150+ sayfalık fixture ile: sayfa 1'de beklerken `__getPageCagri` ≤ 40 olmalı.
Beklenen taban: KIRMIZI (≈ sayfa sayısı kadar). 150+ sayfalık fixture yoksa `scripts/generate-pdf-fixtures.mjs` içindeki üreticiyi **yalnız test yardımcısında** çağıracak şekilde (`pdf-lib` ile 160 boş sayfa) bellekte üret ve `page.route` ile sun; üretim koduna dokunma.

### T5 — Yüksek zoomda canvas bellek tavanı (A4 düzeltir)
`mobile-chromium` projesinde PDF aç, zoom'u en yüksek değere getir (toolbar `%` menüsü / `data-testid` için kaynağı oku), `pdf-queue` boşalınca (`[data-pdf-viewer-state="idle"]`) tüm `canvas[data-testid^="pdf-page-canvas-"]` için `width*height` toplamını hesapla. Beklenen: toplam ≤ 24 000 000 piksel. Taban muhtemelen KIRMIZI.

## Kapı (A1 için)
- Yeni spec dosyası TypeScript'te derlenir (`tsc` yeşil).
- T1–T5'in her biri için taban sonucu (kırmızı/yeşil/skip + neden) BASELINE.md'de.
- `git diff --stat` yalnız `tests/` ve `docs/pdf-studio-v4/` gösterir. `src/` değişmişse **geri al**.

## Rapor
Standart şablon (00-OKU-ONCE.md §4). "Kırmızı kanıtı" bölümüne T1–T5'in sonucunu yaz.
