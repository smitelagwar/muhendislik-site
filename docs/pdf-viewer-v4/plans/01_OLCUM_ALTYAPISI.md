# Plan 01 — Ölçüm Altyapısı (önce ölç, sonra düzelt)

> **Uygulayıcı:** Luna. **Bağımlılık:** yok. **Boyut:** S–M (kod hazır, kopyalanır).
> Önce `00_DENETIM_VE_YOL_HARITASI.md` §7 "ortak kurallar"ı oku.
> **Amaç:** Her sonraki planın "bitti" demesi tartışma değil **sayı** olsun. Bu plan ürün koduna neredeyse dokunmaz.

## 0. Bu planda yazman gereken kod YOK, kopyalanacak hazır kod var

`ekler-hazir-kod.zip` repo kökü yapısını birebir yansıtır. İçindekiler:

| Dosya | Ne işe yarar |
|---|---|
| `playwright.pdf-v4.config.ts` | Ayrı Playwright konfigürasyonu: `desktop`, `mobile`, `compat`, `webkit` projeleri. Ana config'in `webServer`'ını devralır. Video/trace kapalı (ölçümü bozar). |
| `scripts/pdf-v4-run.mjs` | Windows/macOS/Linux'ta aynı çalışan başlatıcı (`baseline` / `gate`, `--prod`, `--cpu=4`). |
| `scripts/generate-pdf-fixtures-v4.mjs` | 5 yeni test PDF'i üretir: `a0-vektor` (A0, 30k çizgi), `karisik-60` (A4/A3/A1 karışık), `metin-1000` (1000 sayfa), `tarama-a3` (raster), `linkli-300`. Çıktı `.test-data/pdf-v4-fixtures/` (git'e girmez). |
| `scripts/pdf-v4-report.mjs` | Son koşuyu bütçe + taban ile karşılaştıran tablo; `--write-baseline`. |
| `scripts/pdfjs-compat-polyfills.mjs` | pdf.js legacy için gereken 3 polyfill (**Plan 02 bunu kullanır**, bkz. §5). |
| `tests/pdf-v4/helpers/*.ts` | Kare örnekleyici, görünüm/çıpa/keskinlik ölçerleri, CDP pinch, tekerlek, bütçe kapısı, uyumluluk simülasyonu. |
| `tests/pdf-v4/budgets.json` | Bütçeler (senaryo × profil). |
| `tests/pdf-v4/s01 s02 s04 s05 s07 s10*.spec.ts` | Yazılmış 6 senaryo (+ düzenek kendini doğrulama testi). |
| `src/lib/dokumantasyon/studio/pdf/pdf-debug-stats.ts` + `src/components/dokumantasyon/studio/pdf/pdf-debug-hud.tsx` | `?pdfdebug=1` ile gerçek telefonda fps / uzun görev / canvas MB / heap gösteren HUD. |

**Bu kodun durumu (dürüst not):** `tsc` ile tip kontrolünden geçti. `s10-selftest` (düzenek kendini doğrulama) sandbox'ta koştu ve geçti. `s01` bir fixture'da uçtan uca koştu ve D3'ü (açılışta scrollTop=305) yakaladı. `s02` bir kez koştu; ölçüm yerleşmeyi beklemiyordu, bu `waitZoomSettled` ile düzeltildi ama düzeltme yeniden koşturulmadı. `s04`, `s05`, `s07`, `s10-compat` **yalnızca tip kontrolünden geçti, hiç koşturulmadı**. İlk koşuda küçük seçici/zamanlama hataları çıkabilir; düzeltmek senin işin, ama **bütçeyi gevşeterek değil, testi düzelterek**.

## 1. Adımlar

### 1.1 Dosyaları kopyala
`ekler/` içindekileri repo köküne aynı yollarla kopyala. Mevcut dosyanın üzerine yazılan bir şey olmamalı (hepsi yeni). Doğrula: `npx tsc --noEmit -p tsconfig.json` (test dosyaları kök tsconfig kapsamındaysa) ya da `npx tsc --noEmit --skipLibCheck --esModuleInterop --target ES2022 --moduleResolution node --module commonjs --types node --lib ES2022,DOM tests/pdf-v4/**/*.ts`.

### 1.2 `package.json` script'leri (yalnızca ekle)
```json
"generate:pdf-fixtures-v4": "node scripts/generate-pdf-fixtures-v4.mjs",
"check:pdf-v4:baseline": "node scripts/pdf-v4-run.mjs baseline --prod",
"check:pdf-v4:gate": "node scripts/pdf-v4-run.mjs gate",
"check:pdf-v4:gate:mobile-slow": "node scripts/pdf-v4-run.mjs gate --cpu=4 --project=mobile",
"check:pdf-v4:compat": "node scripts/pdf-v4-run.mjs baseline --project=compat",
"check:pdf-v4:report": "node scripts/pdf-v4-report.mjs"
```

### 1.3 Ürün koduna 3 küçük dokunuş
1. `src/components/dokumantasyon/studio/pdf/pdfjs-studio.tsx`, kök `<div ... data-pdf-viewer-state={viewerState}` satırı (≈1535): hemen altına `data-pdf-engine="v3"` ekle. (Plan 03 bunu `"v4"` yapacak.)
2. Aynı dosyada import et ve kök div'in içine koy:
   ```tsx
   import { PdfDebugHud, usePdfDebugFlag } from "./pdf-debug-hud";
   // bileşen gövdesinde:
   const debugHud = usePdfDebugFlag();
   // JSX'te kök div'in son çocuğu olarak:
   {debugHud && <PdfDebugHud />}
   ```
   (`usePdfDebugFlag` `useSyncExternalStore` kullanır, SSR'da `false` döner, hidrasyon uyuşmazlığı çıkarmaz.)
3. **Test sözleşmesini bozma.** Aşağıdaki nitelikler yeni motorda da (Plan 03) aynen kalır, harness bunlara bağlıdır:

| Nitelik | Anlamı |
|---|---|
| `data-testid="pdf-scroll-viewport"` | kaydırma kabı |
| `[data-page=N]`, `[data-page-number=N]` | sayfa sarmalayıcı; `getBoundingClientRect()` gerçek (transform dahil) kutuyu verir |
| `data-page-state` | v3: `rendering`/`rendered`. v4: `empty`/`backdrop`/`rendered`. Harness `rendering` ve `empty`'yi **boş** sayar; `backdrop` boş değildir (bulanık ama içerik var) |
| `canvas[data-layer="backdrop"\|"sharp"]` | v4'te; v3'te nitelik yok, o canvas "keskin" sayılır |
| `[data-pdf-viewer-state]` | `idle`/`loading`/`rendering` |
| `[data-zooming]` | jest sürerken kökte/kapta bulunur |
| `[data-pdf-engine]` | `v3` / `v4` |

### 1.4 Taban ölçümü al
```bash
npm run build
npx playwright install chromium webkit
npm run check:pdf-v4:baseline                       # desktop + mobile + compat + webkit; bütçe UYGULANMAZ
node scripts/pdf-v4-run.mjs baseline --prod --cpu=4 --project=mobile   # orta seviye telefon
npm run check:pdf-v4:report                         # tabloyu gör
node scripts/pdf-v4-report.mjs --write-baseline     # docs/pdf-viewer-v4/baseline.json
```
`baseline.json`'u commit'le. Beklenen kırmızılar (denetimden): S1 `scrollTopPx≈305`, S2/S4 uzun görev ve boş kare, S5 `anchorDrift` ölçülür, S7 `canvasMaxMP>16` ve `sharpMs=∞` (A0'da yüksek zoom), S10 `firstPageRendered=0` (Chromium 141 ve altında) veya `inkPixels=0`. **Bunlar bulgudur, hata değil.** Rakamları rapora yaz, yorum ekleme.

### 1.5 Üretim derlemesi kuralı
`gate` modu `PLAYWRIGHT_PRODUCTION_SERVER=1` olmadan **bilerek hata fırlatır** (dev derleme 3–10× yavaş, bütçe anlamsız). Sessizce geçen kapı kapı değildir. Baseline dev'de de alınabilir; rapor satırında `build=dev` görünür.

## 2. Senaryolar ve bütçeler

Bütçe anahtarı `<metrik>Max` (≤) veya `<metrik>Min` (≥); profil `desktop` (1366×800, DPR2), `mobile` (390×844, DPR3), `mobile-throttled` (`--cpu=4`). Bütçede olup ölçülmeyen metrik **hata**dır. Bütçeler başlangıç hedefidir; fiziksel olarak ulaşılamıyorsa **sessizce gevşetme**: raporla, kullanıcı karar versin.

| ID | Senaryo | Fixture | Yazıldı mı | Yeşile çeviren plan |
|---|---|---|---|---|
| S1 | Açılış: scrollTop≤1, ilk sayfa süresi, keskinleşme, ilk yük uzun görev, canvas ≤16 MP | tr-metin, karisik-60, metin-1000, a0-vektor, tarama-a3 | ✅ | 02 (scrollTop), 03 (diğerleri) |
| S2 | Klavye zoom ×3 in, ×6 out, ×3 in: boş kare 0, uzun görev, kare aralığı, çıpa kayması ≤1 px, keskinleşme | karisik-60, metin-1000 | ✅ | 03 |
| S3 | Ctrl+tekerlek: 40 küçük kesirli delta (trackpad) ve tek çentik (±100). Çentik başına zoom çarpanı 1,05–1,15 | karisik-60 | ❌ yaz | 04 |
| S4 | Hızlı kaydırma 40×900 px: kare p95/max, uzun görev, durunca boş sayfa kalmama süresi, mount sayısı ≤9 | metin-1000, karisik-60 | ✅ | 03 |
| S5 | Pinch out / in / çapraz+pan: çıpa ≤1,5 px, tarayıcı zoom'u değişmez, ölçek oranı parmak oranı ±3% | tr-metin, karisik-60, metin-1000 | ✅ | 03 + 04 |
| S6 | Çift dokunma yakınlaştır, tekrar çift dokunma fit'e dön | tr-metin | ❌ yaz | 04 |
| S7 | Büyük format: her zoom düzeyinde canvas ≤16 MP, bellek ≤160/80 MB, keskin oran ≥0,95 | a0-vektor, tarama-a3 | ✅ | 03 |
| S8 | 100 zoom döngüsü + kaydırma: heap büyümesi ≤30 MB, canvas belleği sınırlı, mount ≤9 | karisik-60 | ❌ yaz | 03 |
| S9 | Lease yenilenince belge yeniden yüklenmez, scroll kaymaz | karisik-60 | ❌ yaz | 02 |
| S10 | Uyumluluk simülasyonu: eski API'lerle ilk sayfa çizilir **ve metin pikselleri var** | tr-metin | ✅ (+selftest) | 02 |
| S11 | Yön değişimi (390×844 → 844×390): üst çıpa korunur; **özel zoom'da % değişmez, fit modunda mod korunur** (% yeniden hesaplanır) | karisik-60 | ❌ yaz | 04 |
| S12 | Fit-genişlik modunda tüm belgeyi kaydır: araç çubuğundaki % hiç değişmez (D6) | karisik-60 | ❌ yaz | 04 |
| S13 | Sekme gizlenince (`visibilitychange`) canvas belleği ≤24/16 MB'a iner | karisik-60 | ❌ yaz | 03 |
| S14 | Küçük resim paneli açıkken hızlı kaydırma: p95 ≤40 ms (D15) | metin-1000 | ❌ yaz | 03 |

### Yazılacak senaryoların adım listesi (S1/S2 şablonunu kullan)

- **S3** `ctrlWheel(page, cx, cy, Array(40).fill(-1.7))` (trackpad pinch) sonra `ctrlWheel(page, cx, cy, [-100])` (çentik). Çentik çarpanı = `genişlik(sonra)/genişlik(önce)` (çıpa sayfası). Metrikler: `blankFrames`, `gapP95Ms`, `anchorDriftPx`, `notchFactor`.
- **S6** `doubleTap(page, 195, 420)` → `waitZoomSettled` → çıpa kayması; tekrar `doubleTap` → genişlik başlangıca ±1 px dönmeli (`fitReturnErrorPx`).
- **S8** `heapMB(cdp)` başlangıçta; 100 tur (`keyZoom in 2`, `keyZoom out 2`, her 10 turda bir `wheelScroll`, her 5 turda `waitSharp`); sonda yine `heapMB`. `heapGrowthMB`, `canvasStats().bytesMB`, `viewInfo().mountedPages`.
- **S9** (üç kademe):
  1. **Birim testi (zorunlu):** Plan 02 K2'nin saf fonksiyonu (belge kaynağı kimliği + bayt çekme) `tsx` ile test edilir: lease URL'i değişince kimlik aynı kalır.
  2. **E2E (önerilir):** yerel modda `isLocal=true` olduğundan 60 sn'lik yenileme döngüsü hiç çalışmaz. Bu yüzden Plan 02 K2'de kabuğa küçük bir test kancası eklenir: `localStorage["dok:testHooks"]==="1"` ise `window.__dokRefreshLease = () => refreshCurrentLease()`. Test: `addInitScript` ile bayrağı koy → belgeyi aç → `page.route("**/api/dokumantasyon/files/*/access", ...)` ile yanıttaki `accessUrl`'in sonuna `?lease=2` ekle → `__dokRefreshLease()` çağır → örnekleyici `reloads===0`, `scrollTop` farkı ≤1 px, `blankFrames===0`. Bugünkü kodda `reloads≥1` çıkmalı (D2'yi kanıtlar).
- **S11** İki ayrı koşu (aynı fixture, önce 390×844):
  1. **Özel zoom:** `keyZoom in 2` ile özel zoom'a al; önce `readZoomPercent` ve üst çıpa `fy` (görünüm üst çizgisinin içinde bulunduğu sayfa ve sayfa-içi oran) kaydet → `page.setViewportSize({width:844,height:390})` → `waitZoomSettled`. Metrikler: `topAnchorFyDelta` (aynı sayfada |fy farkı|), `customZoomPercentChange` (beklenen 0).
  2. **Fit-genişlik:** fit-genişlik moduna al; aynı çevirmeyi yap. Metrikler: `topAnchorFyDelta`, `fitModePreserved` (araç çubuğu modu hâlâ fit-genişlik ise 1, değilse 0). Yüzdenin değişmesi bu koşuda **normaldir** (yeni genişliğe göre yeniden hesaplanır).
- **S12** Fit-genişlik moduna al; `wheelScroll` ile belgeyi 40 adımda sonuna kadar kaydır; her adımda `readZoomPercent`; değişim sayısı `zoomPercentChanges`.
- **S13** `document.hidden=true`, `visibilityState='hidden'` tanımla (`Object.defineProperty`), `visibilitychange` olayı gönder, 1,5 sn bekle, `canvasStats().bytesMB`.
- **S14** `[data-testid="pdf-outline-toggle-btn"]` ile paneli aç, S4 gibi kaydır, `gapP95Ms`.

## 3. Uyumluluk testi (D1/D16) nasıl çalışır, neden böyle

Playwright'ın Chromium'u çok yeni; "eski tarayıcı"yı gerçekten çalıştıramayız. Bu yüzden **API silme** yöntemi: `tests/pdf-v4/helpers/compat.ts` taban = **Chrome/Edge 110, Firefox 115, Safari/iOS 16.4** sonrasında eklenen yerleşikleri siler (`Promise.withResolvers`, `ArrayBuffer.prototype.transfer`, `Set` yöntemleri, `Promise.try`, `Float16Array`, `Uint8Array.fromBase64/toHex`, `Map.prototype.getOrInsertComputed`, `Math.sumPrecise`, …):

- **Ana iş parçacığı:** `context.addInitScript`.
- **Worker:** worker dosyasının başına `import "/__compat-prelude.mjs"` eklenir (route ile). **Dikkat:** dosya başına düz ifade koymak işe yaramaz, ES modüllerinde importlar önce çalışır. Silme, worker'ın kendi importlarından (polyfill dosyası) önce olmalı.

**Ölçüm sonuçları (sandbox, Chromium 141, `tr-metin` sayfa 1 + `getTextContent`):**

| Silinen API | modern build | legacy build (düz) | legacy + `pdfjs-compat-polyfills.mjs` |
|---|---|---|---|
| hiçbiri | ❌ `getOrInsertComputed is not a function` (Chrome 141'de bile) | ✅ | ✅ |
| `Promise.withResolvers` | ❌ | ❌ hata | ✅ |
| `ReadableStream[Symbol.asyncIterator]` | ❌ | ❌ `e is not async iterable` | ✅ |
| `ArrayBuffer.prototype.transfer` / `transferToFixedLength` | ❌ | ❌ **hatasız boş metin**: sayfa "çizildi" ama glifler yok (worker font bilgisini `transferToFixedLength` ile derliyor) | ✅ |
| `Map getOrInsert*`, `Promise.try`, `Float16Array`, `Uint8Array base64`, `Math.sumPrecise`, `Set` yöntemleri, `URL.canParse`, `Object.groupBy`, … | ❌ | ✅ | ✅ |
| Tümü (taban Chrome 110) | ❌ | ❌ | ✅ |

**Sonuç:** legacy build tek başına yetmez; 3 küçük polyfill gerekir (Plan 02 K1). Ve **"ilk sayfa rendered" kontrolü yetmez**: legacy build'de `transferToFixedLength` yoksa sayfa beyaz kalıp yine de `rendered` olur. Bu yüzden S10 `inkPixels≥3000` ölçer (sayfadaki koyu piksel sayısı).

`s10-selftest.spec.ts` bu düzeneğin kendi doğruluğunu sınar: modern build silinmiş API'lerle **çökmeli**, legacy + polyfill **çizmeli**. Modern çökmüyorsa S10 hiçbir şey yakalamıyordur ve test kırmızı verir. Bunu her pdf.js güncellemesinde koştur.

## 4. Gerçek cihaz kontrol listesi (elle; Luna yapamaz, kullanıcı yapar)

Sandbox ve CI **gerçek dokunma ekranı, iOS Safari, Samsung Internet, düşük bellek** davranışını göremez. `?pdfdebug=1` ile HUD açıp sayıları ekran görüntüsüyle kaydet.

| Cihaz / tarayıcı | Mutlaka dene |
|---|---|
| iPhone Safari (iOS 17 ve en yeni) | `karisik-60` pinch out/in, 3 kez art arda; `a0-vektor` yüksek zoom; döndür; uygulamaya geri dön (sekme değişimi sonrası beyaz sayfa var mı) |
| iPad Safari + (varsa) trackpad | Trackpad pinch (D9), iki parmak pinch, Split View'da yeniden boyutlandırma |
| Android Chrome (orta seviye cihaz) | `metin-1000` hızlı kaydırma, `a0-vektor`, düşük bellekte sekme çökmesi |
| Samsung Internet | Açılış (D1 en çok burada), pinch |
| macOS Safari, Firefox | Trackpad pinch, Ctrl+tekerlek, klavye zoom |
| Eski cihaz (iOS 16.x veya Android ≤ Chrome 110 varsa) | Açılış + metin görünüyor mu |

Her satırda şunları not et: açıldı mı, metin var mı, pinch'te çıpa kayması gözle var mı, yanıp sönme var mı, HUD'da `canvas` MB ve `maxFrameGap`.

## 5. Çıkış ölçütü

- [ ] Hazır kod repoya kopyalandı, `tsc` temiz, `npm run lint` temiz (yeni dosyalar için).
- [ ] `s10-selftest` geçiyor.
- [ ] `check:pdf-v4:baseline` (production derleme) tüm projelerde koştu, `docs/pdf-viewer-v4/baseline.json` commit'lendi.
- [ ] Çalışmayan veya hatalı bulunan test dosyası **düzeltildi** ve raporda hangisinin ne yüzden düzeltildiği yazıldı (bütçe gevşetilmedi).
- [ ] S3, S6, S8, S9, S11, S12, S13, S14 yazıldı (S13/S14 Plan 03'e kadar kırmızı olabilir; S9 birim testi Plan 02'de).
- [ ] Rapor: taban tablo (`check:pdf-v4:report` çıktısı) ve beklenen kırmızılar listesi.
- [ ] Ürün koduna yalnızca §1.3'teki 3 dokunuş yapıldı. CAD/DXF/DWG, görsel, Markdown görüntüleyicilere dokunulmadı.
