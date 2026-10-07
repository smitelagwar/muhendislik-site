# PDF Görüntüleyici v4: Denetim Raporu ve Yol Haritası

> **Önce bunu oku.** Bu dosya denetim sonucunu, ölçüm kanıtlarını ve diğer 5 plan dosyasının sırasını içerir.
> Plan dosyaları: `01_OLCUM_ALTYAPISI.md` → `02_KRITIK_DUZELTMELER.md` → `03_MOTOR_YERLESIM_RENDER.md` → `04_ETKILESIM_VE_MOBIL.md` → `05_DENEYIM_VE_OZELLIKLER.md`
> Hazır kod: `ekler-hazir-kod.zip` (ölçüm düzeneği, polyfill, vendor senkron betiği, belge kaynağı, canary, birim testler; kopyalanacak, yeniden yazılmayacak).

## 1. Kısa sonuç

Luna, v3 planının **kullanıcıya görünen özelliklerinin** büyük kısmını uygulamış: Acrobat tarzı araç çubuğu, zoom ön ayarları, kısayollar, küçük resimler, yer imleri, arama, el aracı, çift dokunma, kaydırma çubuğu, döndürme, gece modu, konum hatırlama, şifre ve hata ekranları. Bu işler çalışıyor.

Plana **sadık kalınmayan** yer motor mimarisi. v3'ün geometri çekirdeği (`computeTops`, `usePageSizes`, `useCurrentPage`) yazılmamış, sayfalar hâlâ DOM akışında ve `IntersectionObserver` ile yönetiliyor. `PageSlot` için `memo` ve gesture sırasında mount dondurma da yok. Asıl risklerin hepsi bu katmandan çıkıyor.

Ölçümde **zoom sırasında beyaz kare (titreme) görmedim**: çift tampon çalışıyor. Mobil pinch emülasyonunda çıpa kayması yok. Yani ilk iki talebin görünür kısmı büyük ölçüde düzelmiş. Ama dört sorun var ve ikisi sizin "kusursuz, ultra stabil, uyumlu" hedefinizi doğrudan bozuyor:

1. **Uyumluluk:** Vendor edilen pdf.js 6.3.289 "modern" build'i eski tarayıcılarda sayfayı hiç çizemiyor. Bunu ölçtüm.
2. **Büyük format PDF (pafta):** Tam sayfa canvas yaklaşımı A0/A1 sayfalarda yüksek zoom'da çöküyor veya sessizce bulanıklaşıyor. Bunu da ölçtüm.
3. **Ana iş parçacığı bloklanması:** Zoom ve kaydırmada 0,4–1,8 saniyelik takılmalar var. Sayfa sayısıyla artıyor.
4. **Açılış konumu:** Belge sayfanın başında değil, yaklaşık 305 px aşağıda açılıyor.

## 2. Nasıl denetledim ve neyi göremedim

- **Kod:** `smitelagwar/muhendislik-site`, tek commit `db8b67e` ("feat(pdf-studio): Acrobat zoom and navigation"). PDF ile ilgili yaklaşık 7.400 satırı okudum.
- **Ölçüm:** Repo'nun kopyasını sandbox'ta dev modunda çalıştırdım (2 vCPU, 8 GB RAM). Chromium 141, masaüstü 1366×800 DPR2 ve mobil emülasyon 390×844 DPR3 kullandım. Fixture'lar `uzun-300.pdf`, `karisik-boyut.pdf`, `tr-metin.pdf` ve benim ürettiğim bir A0 vektör PDF.
- **Sandbox'ta pdf.js değişikliği:** Modern build Chromium 141'de render edemediği için kopyada legacy build'e geçtim. Aşağıdaki "uygulama ölçümleri" legacy build ile alındı.
- **Canlı site:** `muhendislik-site.vercel.app` shell'den açılmıyor (proxy 403). WebFetch ile yalnızca ana sayfayı okuyabildim (Next.js). Canlı sitede PDF denemesi yapmadım.
- **Yapamadıklarım:** Gerçek iOS Safari ve Android cihaz testi, WebKit motoru, üretim (production) derlemesi ölçümü. Dev build olduğu için **mutlak süreler şişkin**, ama oransal sonuçlar geçerli. Bu yüzden her ölçümün yanında "kanıt" ve "varsayım" ayrımı var.

## 3. v3 planına sadakat tablosu

| v3 maddesi | Durum | Not |
|---|---|---|
| Zoom modları, %100 = 96/72, ön ayarlar | ✅ | `pdf-zoom-math.ts` |
| Pencere boyutu değişince fit koruma | ✅ | ResizeObserver, genişlik ≥2px, 150ms, `data-zooming` koruması |
| Gesture hook: çıpa, animasyon, çift dokunma, tek dokunma | ✅ | `use-zoom-gestures.ts` |
| Araç çubuğu, sayfa kutusu, zoom listesi | ✅ | |
| Kısayollar | ✅ + ⚠ | Plan dışı `Ctrl+R/D/B` da kapılmış (bkz. D10) |
| Küçük resimler (sanal), yer imleri, bağlantılar, geri/ileri | ✅ | |
| Arama (vurgu, diakritik, tam kelime) | ✅ | Plandan daha ileri |
| El aracı, Space, kaydırma çubuğu, tek dokunma ile çubuk gizleme | ✅ | |
| Döndür, gece modu, tam ekran, konum hatırlama, şifre, hata | ✅ | |
| **Geometri çekirdeği** (`computeTops`, `pageAt`) | ❌ | DOM akışı + `offsetTop` kullanılıyor |
| **`usePageSizes`** (kademeli boyut okuma) | ❌ | Her `PdfPageView` kendi `getPage` + `getAnnotations` çağrısını yapıyor |
| **`useCurrentPage`** (görünüm ortası) | ❌ | Sayfa başına `IntersectionObserver`, eşik %20 |
| `PageSlot` `memo` + gesture sırasında mount dondurma | ❌ | `memo(` hiç yok; sabit ±5 sayfa penceresi |
| Bellek bütçesi (`safeDpr`) | ◐ | Bütçe var (mobil 6 MP, masaüstü 16 MP) ama **taban 1,0** olduğu için aşılıyor (D4) |
| Fit modu "sayfa boyutuna uyum" | ◐ | Fit, **aktif sayfaya bağlı**: A4→A3'e kaydırınca zoom kendiliğinden değişiyor (D6) |
| Konum geri yükleme | ◐ | `setTimeout` (80/150/100 ms) ile, deterministik değil (D13) |
| FAZ 7 (iki sayfa/tek sayfa), marquee zoom | ❌ | Opsiyoneldi |
| Test | ◐ | Birim ve e2e var; gerçek cihaz, WebKit, büyük format ve performans bütçesi testi yok |

## 4. Ölçüm kanıtları

Kodları ve komut dosyaları sandbox'ta duruyor. Plan 01 bunları repo içine taşıyan test altyapısını tarif ediyor.

### Uyumluluk (M1–M2)
- **M1.** Vendor edilen `pdf.min.mjs`, resmi modern build ile **bayt bayt aynı** (`cmp`). İçinde `Map.prototype.getOrInsertComputed` (17 yer), `Promise.try`, `Math.sumPrecise`, `Uint8Array.fromBase64` gibi yeni API'ler var.
- **M2.** Chromium 141'de modern build ile `page.render` **hata verdi**: `TypeError: this[#Yr].getOrInsertComputed is not a function`. Aynı sayfa legacy build ile çizildi. Legacy build ana dosyada +60 KB, worker'da +52 KB (min hâlleri 518.555 / 1.317.034 bayt; modern 458.705 / 1.265.413).
- **M2b (sonradan, daha ince bulgu).** Legacy build **tek başına yetmiyor**. Eski tarayıcıyı API silerek taklit ettiğimde: `Promise.withResolvers` yoksa legacy yükleme hata veriyor; `ArrayBuffer.prototype.transfer` / `transferToFixedLength` yoksa **hata vermeden metin glifleri boş çiziliyor** (sayfa "çizildi" görünüyor, koyu piksel 0). Yani `rendered` durumuna bakan test bunu yakalayamaz. Çözüm Plan 02'de: üç polyfill (`withResolvers`, `transfer`+`transferToFixedLength`, `ReadableStream[Symbol.asyncIterator]`) hem ana iş parçacığında hem worker'da (`worker-entry.mjs` önce polyfill, sonra worker), açılışta **canary render** (gömülü küçük bir PDF'te metin pikseli say) ve testlerde **mürekkep (koyu piksel) sayımı**. Desteklenen taban: Chrome/Edge 110, Firefox 115, Safari/iOS 16.4.
- caniuse'a göre `getOrInsertComputed` desteği: Chrome 145, Edge 145, Firefox 144, Safari ve iOS Safari 26.2, Chrome Android 154, Samsung Internet desteklemiyor. **Küresel destek %82,28**: kullanıcıların yaklaşık %18'inde modern build'de PDF hiç açılmıyor olabilir. Başka açık kaynak projeler de aynı hatayı yaşayıp legacy build'e geçmiş (kaynaklar sonda).
- Aynı yükleyiciyi 5 belge üretim stüdyosu (`insaat-ruhsati`, `beton-dokum`, `taahhutname`, `sozlesme`, `istifa`) da kullanıyor, hepsi etkileniyor.

### Büyük format ve bellek (M3–M4)
- **M3.** Masaüstü Chromium'da canvas sınırı: 128,5 MP çizilebildi, 357 MP (A0 @ %500) **çizilemedi**. iOS Safari tek canvas sınırı ~16,7 MP (react-pdf issue #1149) ve toplam canvas belleği sınırlı.
- **M3 (uygulama, A0, DPR2):** %100'de bitmap 16,8 MP ve CSS 14,3 MP, yani retina ekranda **1,08 px/CSS** (yerel 2,0 yerine, bulanık). %200: 57 MP. %300: 128,5 MP. %400: 228,5 MP (RGBA ≈ 914 MB, tek sayfa için). **%500'de render hiç tamamlanmadı**, canvas %400 çözünürlüğünde gerilip kaldı (sessiz bulanıklık).
- **M4. Bölgesel (tile) render çalışıyor.** A0 sayfada 512 px'lik tile'lar tam sayfaya göre çok hızlı:

  | Zoom | Tam sayfa | Tile (bölge) |
  |---|---|---|
  | %100 | 407 ms | 164 ms |
  | %200 | 767 ms | 105 ms |
  | %300 | 1574 ms | 118 ms |
  | %500 | çizilemiyor | 183 ms |

  Bölge çıktıları metin sayfasında **piksel-birebir** (`maxDiff=0`). İnce çizgili vektör sayfada tile kenarında piksellerin %2,9–4,1'i farklı (iç bölgede %0,2–0,5) → tile'lara **2 px taşma payı (gutter)** gerekiyor. `cancel()` → `RenderingCancelledException`; iptalden sonra yeniden render ve 2 eşzamanlı render sorunsuz.

### Etkileşim ve performans (M5–M9)
- **M5. Açılış konumu.** `tr-metin`, `karisik-boyut`, `uzun-300` açılışında `scrollTop` = 305–306 px (sayfa başlığı kesik). Tek sayfalı A0'da 0. Sebep doğrulandı: fit-width, `zoomTo` ile **viewport merkezine çıpalanıyor**. Formül `(368−12) × (2,2302/1,2) + 12 − 368 ≈ 305,6`, gözlenenle birebir.
- **M6. Ana iş parçacığı** (dev, 2 vCPU):
  - 2 sayfalık belgede Ctrl+tekerlek ×40: 18 takılan kare, en uzun kare aralığı 617 ms, en uzun görev 387 ms. Klavye ile 6 zoom adımı: 27 takılan kare, 550 ms.
  - **300 sayfalık belgede hızlı kaydırma** (40×900 px): 86 karenin 85'i takılan, en uzun aralık **1783 ms**, en uzun görev **1538 ms**. Tek zoom adımı: 1267 ms aralık, 981 ms görev.
  - Bu rakamlar dev build'e ait. Yine de **sayfa sayısıyla büyümesi** gerçek bir O(N) iş olduğunu gösteriyor.
  - Aynı testlerde **beyaz kare = 0**. Ama ana iş parçacığı bloklandığında kareler örneklenemiyor, bu yüzden "beyaz kare yok" sonucu kesin değil.
- **M7. Mobil emülasyon** (Chromium, iPhone UA, DPR3): pinch-out 0,615→2,665, çıpa kayması ≤0,5 px, tarayıcı zoom'u değişmedi, beyaz kare 0, uzun görev 2–3 adet (en fazla 513 ms, 300 sayfada). Çift dokunma kayması 0,5 px. **Gerçek iOS/Android'de test yok**, pinch-in ve belge sonunda pinch denemesi sandbox'ta başarısız oldu (girdi viewport dışına düştü), yapılmadı.
- **M8.** `getPage + getAnnotations` ×300 sayfa: 17–36 ms. Yani şüphelendiğim pdf.js maliyeti **değil**; sorun React yeniden render ve durum akışı.
- **M9.** Toolbar sayfa kutusu 19 gösterirken görünür sayfa 20 (IO tabanlı sayfa tespiti).

### Yalnızca koddan çıkan bulgular (sandbox'ta test edilemedi)
- **Lease yeniden yükleme:** `document-studio-shell.tsx` her 60 sn'de lease süresini kontrol edip bitmeden ≤120 sn kala `setCurrentLease` çağırıyor. `accessUrl` değişince `pdfjs-studio.tsx` yükleme `useEffect`'i (satır ~582–798) **belgeyi yok edip baştan yüklüyor**. Okurken tüm görünüm yeniden yüklenir. Yerel modda lease olmadığı için sandbox'ta görülmedi.
- **Önbellek başlığı:** `/vendor/pdfjs/*` hem `next.config.ts` hem `vercel.json`'da 1 yıl `immutable`. Ana dosya ve worker aynı yolda. pdf.js güncellenirse eski önbellekteki dosya ile yeni worker karışıp "API version does not match Worker version" hatası olur.
- **Dokunma dinleyicisi:** `touchmove` her zaman `{passive:false}` (`use-zoom-gestures.ts`). Ana iş parçacığı meşgulken tek parmak kaydırma bile tarayıcıdan beklenebilir (**varsayım**, Chrome davranışı).
- **Pinch-in taşma kırpması:** İçerik `transform: scale(<1)` ile küçülürken kaydırılabilir alan küçülür, tarayıcı `scrollTop`'u kırpabilir (**varsayım**, gerçek cihazda doğrulanmalı).
- **iPad trackpad:** `isTouchDevice = "ontouchstart" in window` doğruysa `gesturestart/change/end` yalnızca `preventDefault` edilip ihmal ediliyor, iPad'de trackpad pinch çalışmaz.
- **Fare tekerleği çentiği:** `Math.max(-30, Math.min(30, deltaY))` → `exp(0.3)` ≈ **%35 zoom** (tek çentik). `calculateWheelZoomFactor` (0,0035) tanımlı ama hook'ta kullanılmıyor, kod tekrarı var.

## 5. Öncelikli hata listesi

| ID | Öncelik | Konu | Kanıt | Plan |
|---|---|---|---|---|
| D1 | P0 | Modern pdf.js eski tarayıcıda hiç çizmiyor (%~18 kullanıcı) | M1–M2, ölçüm | 02 |
| D2 | P0 | Lease yenilenince belge yeniden yükleniyor | Kod | 02 |
| D3 | P0 | Belge ~305 px aşağıda açılıyor | M5, ölçüm | 02 |
| D4 | P1 | Büyük format: bellek, canvas sınırı, bulanıklık | M3–M4, ölçüm | 03 |
| D5 | P1 | O(N) ana iş parçacığı işi: 0,4–1,8 sn takılma | M6, ölçüm | 03 |
| D6 | P1 | Fit modu kaydırırken zoom'u değiştiriyor | Kod | 04 |
| D7 | P1 | `touchmove` her zaman non-passive | Kod, varsayım | 04 |
| D8 | P1 | Pinch-in'de scroll kırpması | Varsayım | 04 |
| D9 | P2 | iPad trackpad pinch çalışmıyor | Kod | 04 |
| D10 | P2 | `Ctrl+R/D/B` kısayolları tarayıcıyı bozuyor | Kod | 02 |
| D11 | P2 | Fare çentiği %35 zoom | Kod | 04 |
| D12 | P2 | Vendor önbellek (immutable) + sürüm karışması | Kod | 02 |
| D13 | P2 | Konum geri yükleme `setTimeout` ile | Kod | 02 |
| D14 | P3 | Gece modu CSS filtresi büyük canvas'ta pahalı olabilir | Varsayım | 03 |
| D15 | P3 | Küçük resimler render kuyruğunu atlıyor, sayfayla yarışıyor | Kod | 03 |
| D16 | P2 | CI uyumluluğu yakalayamaz (Playwright ^1.62 Chromium büyük olasılıkla modern API'yi içeriyor) | Varsayım | 01 |
| D17 | P2 | Yazdırma süreli `accessUrl`'yi iframe'e veriyor: süre dolunca boş; iOS Safari'de iframe `print()` güvenilmez | Kod | 05 (W3) |
| D18 | P2 | 5 üretim stüdyosu `/vendor/pdfjs/cmaps/` gibi **sürümsüz** yollar kullanıyor, `wasmUrl`/`iccUrl` yok (taranmış/JPX görüntü riski) | Kod | 02 (K1) |
| D19 | P3 | Tarayıcı öğe yüksekliği sınırı (Firefox ≈17,9 M px): çok sayfa × yüksek zoom'da kaydırma bozulur, denetim yok | Bilgi + hesap | 03 (P3.8) |

## 6. Plan dosyaları ve sıra

| Sıra | Dosya | Amaç | Boyut | Bağımlılık |
|---|---|---|---|---|
| 1 | `01_OLCUM_ALTYAPISI.md` | Ölçüm düzeneği, fixture'lar, bütçeler, **taban sayılar** | M | yok |
| 2 | `02_KRITIK_DUZELTMELER.md` | D1, D2, D3, D10, D12, D13, D18 | M | 01 (taban ölçüm için) |
| 3a | `04_ETKILESIM_VE_MOBIL.md` **yalnız 04-A** | D6, D9, D11 (v3 yolunda küçük yamalar) | S | yok (02'den sonra rahat) |
| 3b | `05_DENEYIM_VE_OZELLIKLER.md` **Dalga 1** | Açılış, hata kurtarma, yazdırma, tanılama, a11y (D17) | M | 02 |
| 4 | `03_MOTOR_YERLESIM_RENDER.md` | D4, D5, D14, D15, D19: yerleşim, sanallaştırma, parça (tile) render, bellek | L | 02 |
| 5 | `04_ETKILESIM_VE_MOBIL.md` **04-B** | D7, D8: pinch, tekerlek, animasyon, yön değişimi (v4 motoru) | M | 03 |
| 6 | `05_DENEYIM_VE_OZELLIKLER.md` Dalga 2–3 | Mini harita, katmanlar (OCG), ölçüm aracı (**seçilenler**) | M–L | 03, 04 |

**Önerilen yürütme sırası:** 01 → 02 → (04-A + 05 Dalga 1, paralel yapılabilir) → 03 → 04-B → gerçek cihaz kontrol listesi (04 §6) → 05 seçilenler. Bayrak `pdfEngine` varsayılan **v3** kalır; v4 yalnızca 04 §6 doldurulup gate yeşil olduktan sonra varsayılan yapılır.

Plan 02 tek başına yayınlanabilir ve **en büyük kazanç/risk oranı** orada. Plan 03 en büyük iş. Plan 04'ün B kısmı 03'ün motoruna (`PdfEngine`) kurulu olduğu için ondan sonra gelir; A kısmı (D6, D9, D11) bağımsızdır. Plan 05 bir menüdür: Dalga 1 önerilir, Dalga 2–3'ten **kullanıcı seçer**; Luna seçilmeyeni yapmaz.

## 7. Luna için ortak kurallar

1. **Çalışma biçimi:** `AGENTS.md`'ye uy. Yerelde test et, `pdf-v4` branch'inde çalış, her plan sonunda **tek anlamlı checkpoint commit**. Uzaktan yazıyorsan `[skip ci]`. `main`'e yarım iş atma.
2. **Next.js:** `AGENTS.md` uyarısı geçerli, Next 16.3.6. `next.config.ts` veya route/header değişikliğinden önce `node_modules/next/dist/docs/` içindeki ilgili sayfayı oku.
3. **Önce ölç:** Plan 01'i bitirip taban sayıları `docs/pdf-viewer-v4/baseline.json`'a yaz. Her plan sonunda aynı senaryoları tekrar koş, bütçeyi geçemeyen iş "bitti" sayılmaz.
4. **Özellik bayrağı:** Plan 03'ün yeni motoru `pdfEngine` bayrağıyla açılır (varsayılan eski motor), gerekirse tek satırla geri alınır. Eski motoru silme kararı kullanıcıya aittir.
5. **Kırmızı çizgi:** CAD/DXF/DWG, görsel ve Markdown görüntüleyicilere **dokunma**.
6. **Token tasarrufu:** Tüm dosyayı değil, önce `grep -n '^## ' <plan>.md` ile bölüm satırlarını bul, yalnızca çalıştığın bölümü `sed -n 'BAŞ,BİTp'` ile oku. Mevcut dosyaları yamala, baştan yazma. Her plan bölümünün sonundaki **Çıkış ölçütü** sağlanmadan sonraki bölüme geçme.
7. **Kapsam kuralı:** Plan 05 bir menüdür; kullanıcının seçmediği maddeyi yapma. Plan dışı "iyileştirme" için önce kullanıcıya sor.
8. **Dürüstlük kuralı:** Bir madde çalışmıyorsa ya da ölçüt sağlanmıyorsa raporda açıkça yaz. "Tamamlandı" demeden önce ilgili senaryoların çıktısını ekle.

## 8. Bilinmeyenler

- **Kodun durumu (dürüst özet):** `ekler-hazir-kod.zip` içindeki dosyaların hepsi TypeScript derlemesinden geçti; `pdf-document-source` birim testleri (8/8) ve polyfill selftest'i çalıştı; S1 uçtan uca, S2 bir kez koştu; S4, S5, S7 ve uyumluluk spec'leri yalnızca derlendi, çalıştırılmadı. Plan 03, 04 ve 05'teki kod parçaları **tasarım taslağıdır**, repoda çalıştırılmadı.
- **Mobil hipotezler (04'te H1–H4):** Pinch sırasında kaydırma kilidinin (`overflow:hidden`) iOS/Android'de beklendiği gibi çalışması sandbox'ta doğrulanamadı; 04 §6 gerçek cihaz kontrol listesi bu yüzden **zorunlu çıkış koşulu**, Plan B hazır.
- **Gerçek CAD PDF'i:** Katman (OCG) ve ölçüm özellikleri için elde gerçek bir çizim PDF'i yoktu; sentetik fixture ile ilerlenir veya kullanıcıdan örnek istenir.

- Gerçek iOS Safari, Android Chrome, Samsung Internet davranışı doğrulanmadı. Plan 01'de bunu kapatacak bir **gerçek cihaz kontrol listesi** var, kullanıcının elle çalıştırması gerekir.
- Canlı sitedeki lease süreleri ve Supabase/Blob imzalı URL ömrü bilinmiyor. D2 çözümü ömürden bağımsız tasarlandı.
- Playwright'ın bundled Chromium sürümü sandbox'taki ile aynı değil; uyumluluk testi bu yüzden API silme yöntemiyle yazıldı (Plan 01).

## Kaynaklar

- [caniuse: Map getOrInsertComputed](https://caniuse.com/mdn-javascript_builtins_map_getorinsertcomputed)
- [midgard PR #1424: legacy build'e geçiş (pdf.js 6 modern build hatası)](https://github.com/charliebeckstrand/midgard/pull/1424)
- [react-pdf issue #1149: iOS canvas 16.777.216 piksel sınırı](https://github.com/wojtekmaj/react-pdf/issues/1149)
- [pqina: Safari toplam canvas bellek sınırı](https://pqina.nl/blog/total-canvas-memory-use-exceeds-the-maximum-limit/)
- [pdf.js tartışma #19770: titremesiz yeniden boyutlandırma (eski canvas'ı CSS ile ölçekle, yenisini arka planda çiz)](https://github.com/mozilla/pdf.js/discussions/19770)
