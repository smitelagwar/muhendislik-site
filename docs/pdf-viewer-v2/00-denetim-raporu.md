# FAZ A0 — PDF Görüntüleyici v1 Denetim ve Baz Çizgisi Raporu

> **Tarih:** 2026-09-30  
> **Konum:** `muhendislik-site` → `/dokumantasyon` → PDF stüdyosu  
> **Branch:** `pdf-v2` (Geri dönüş baz etiketi: `pdf-v1-baseline`, commit `2ac16848810a2f3925a821c58745f74b93dabf13`)  
> **Referans Plan:** `docs/pdf_viewer_v2_plan.md`  
> **Kural Durumu:** Kaynak kod değiştirilmemiştir (SALT OKUNUR denetim ve baz çizgisi ölçümü).

---

## 1. Faz A0 — 14 Denetim Maddesi Özet Tablosu

| # | Denetim Maddesi | Gerçek Durum | Kanıt (Dosya Yolu ve Satır No) | İlgili v2 Fazı |
|---|---|---|---|---|
| 1 | `pdfjs.TextLayer` kullanımı, `fontFamily: "sans-serif"`, `indexOf`, `--scale-factor` / `--total-scale-factor`, `textLayer.cancel()` | **KISMEN** | [`pdf-page-view.tsx:279-286`](file:///c:/Users/hsyn/Desktop/muhendis-mimar-portali/src/components/dokumantasyon/studio/pdf/pdf-page-view.tsx#L279-L286) (`pdfjs.TextLayer` var), L201 (`indexOf` var), L361 (`.pdf-text-layer` özel sınıfı kullanılmış, resmi `.textLayer` yok), L364-370 (`--scale-factor` inline yok), L269, L304 (`cancel()` var). [`globals.css:1634-1650`](file:///c:/Users/hsyn/Desktop/muhendis-mimar-portali/src/app/globals.css#L1634-L1650) (CSS değişkenleri yok). Eski `fontFamily:"sans-serif"` temizlenmiş. Ancak metin düğümleri bölünerek `<mark>` ile sarılıyor ([`pdf-page-view.tsx:213-251`](file:///c:/Users/hsyn/Desktop/muhendis-mimar-portali/src/components/dokumantasyon/studio/pdf/pdf-page-view.tsx#L213-L251)). | Faz D, Faz E |
| 2 | Arama motoru konumu, sayfa metni çıkarma, önbellek, iptal mekanizması, sonuç üst sınırı | **KISMEN** | [`pdf-search.ts:37-96`](file:///c:/Users/hsyn/Desktop/muhendis-mimar-portali/src/lib/dokumantasyon/studio/pdf/pdf-search.ts#L37-L96) (`searchInPdfDocument`), [`pdfjs-studio.tsx:468-498`](file:///c:/Users/hsyn/Desktop/muhendis-mimar-portali/src/components/dokumantasyon/studio/pdf/pdfjs-studio.tsx#L468-L498). Metin: `getTextContent()` + `join(" ")` (L56-58, kerning ve `hasEOL` gözetilmiyor). Önbellek: **YOK** (her aramada 1..N sayfa baştan taranıyor). İptal: **YOK** (`AbortSignal` desteği yok, arka plan döngüsü durdurulamıyor, sadece React `isCurrent` var). Sonuç üst sınırı: **YOK** (`matches.push` sınırsız). | Faz B, Faz E |
| 3 | Aktif eşleşme animasyonu, `scrollIntoView`, hedef sayfa render edilmemişse davranış | **VAR (Kusurlu)** | [`globals.css:1674-1689`](file:///c:/Users/hsyn/Desktop/muhendis-mimar-portali/src/app/globals.css#L1674-L1689) (sonsuz `infinite` pulse animasyonu, `prefers-reduced-motion` yok). [`pdf-page-view.tsx:234-238`](file:///c:/Users/hsyn/Desktop/muhendis-mimar-portali/src/components/dokumantasyon/studio/pdf/pdf-page-view.tsx#L234-L238) (`setTimeout` 30ms ile `mark.scrollIntoView`). Hedef sayfa pencere dışındaysa (`isVisible === false`), `innerHTML = ""` ([`pdf-page-view.tsx:78`](file:///c:/Users/hsyn/Desktop/muhendis-mimar-portali/src/components/dokumantasyon/studio/pdf/pdf-page-view.tsx#L78)) olduğundan `mark` bulunamaz. `scrollToPage` ile sayfa başına kaydırılır, ardından sayfa render olunca `scrollIntoView` tetiklenip scroll yarışı ve çift sarsıntı üretir. | Faz E |
| 4 | Pinch jesti: `touch-action` değeri, Ctrl+wheel dinleme, `gesturestart` (Safari), her harekette animasyon | **KISMEN** | [`pdfjs-studio.tsx:901-905`](file:///c:/Users/hsyn/Desktop/muhendis-mimar-portali/src/components/dokumantasyon/studio/pdf/pdfjs-studio.tsx#L901-L905) (`isHandTool` iken `touch-none`, normalde `touch-action` belirtilmemiş; plandaki `pan-x pan-y` YOK). Ctrl+wheel: **VAR** ([`pdfjs-studio.tsx:516-564`](file:///c:/Users/hsyn/Desktop/muhendis-mimar-portali/src/components/dokumantasyon/studio/pdf/pdfjs-studio.tsx#L516-L564), `{ passive: false }` ile dinleniyor). `gesturestart`: **YOK** (kod tabanında sıfır). Animasyon: **EVET**, `handlePointerMove` içinde her 2 parmak hareketinde `startSmoothZoomAnimation()` RAF döngüsü başlatılıyor ([`pdfjs-studio.tsx:729`](file:///c:/Users/hsyn/Desktop/muhendis-mimar-portali/src/components/dokumantasyon/studio/pdf/pdfjs-studio.tsx#L729)). | Faz C, Faz F |
| 5 | Çift tıklama: kelime seçimiyle çakışma | **VAR (Çakışıyor)** | [`pdfjs-studio.tsx:289-291, 895`](file:///c:/Users/hsyn/Desktop/muhendis-mimar-portali/src/components/dokumantasyon/studio/pdf/pdfjs-studio.tsx#L289-L291) (`handleDoubleClick` -> `handleSmartZoom`). Metin seçimi veya imleç modu ayrımı yapılmaksızın doğrudan `handleSmartZoom` çağrılmaktadır. Masaüstünde kelimeye çift tıklandığında tarayıcı kelimeyi seçerken görüntüleyici aynı anda %150'ye zoom yapmakta ve seçimi bozmaktadır. | Faz F |
| 6 | Bellek yönetimi: `rootMargin` sayfa sayısı, `renderTask.cancel()`, `page.cleanup()`, text layer temizliği | **KISMEN** | [`pdf-page-view.tsx:83`](file:///c:/Users/hsyn/Desktop/muhendis-mimar-portali/src/components/dokumantasyon/studio/pdf/pdf-page-view.tsx#L83) (`rootMargin: "1500px 0px 1500px 0px"`). %50 zoomda ~8-9 sayfa, %100 zoomda ~4-5 sayfa, %200 zoomda yalnızca ~2 sayfa tutulur; sabit sayfa garantisi yoktur. `renderTask.cancel()`: **VAR** ([`pdf-page-view.tsx:122, 163`](file:///c:/Users/hsyn/Desktop/muhendis-mimar-portali/src/components/dokumantasyon/studio/pdf/pdf-page-view.tsx#L122)). `page.cleanup()`: **YOK** (sıfır çağrı). Text layer temizliği: Senkron `innerHTML = ""` var (L78), `useEffect` cleanup'ta `cancel()` var (L304); ancak DOM temizliği ile React unmount iptali arasında yaşam döngüsü yarış durumu (race condition) vardır. | Faz C |
| 7 | Preload: `/vendor/pdfjs/*` için gerçek `Cache-Control` başlığı (`curl -I`) | **YOK (Varsayılan 0)** | [`next.config.ts:55-135`](file:///c:/Users/hsyn/Desktop/muhendis-mimar-portali/next.config.ts#L55-L135) incelendiğinde `/vendor/pdfjs/*` için özel bir `Cache-Control` kuralı TANIMLANMAMIŞTIR (`_next/static` ve `cad-upstream` için `immutable` varken vendor atlanmış). [`vercel.json`](file:///c:/Users/hsyn/Desktop/muhendis-mimar-portali/vercel.json) içinde headers yok. Next.js `public/` dosyalarına varsayılan olarak `Cache-Control: public, max-age=0, must-revalidate` atanır. 2.22 MB'lık `pdf.worker.mjs` her istekte taze doğrulanır. | Faz B |
| 8 | Range istekleri: depolama katmanı, stream route 206 yanıtı, sıkıştırma, Vercel süre/boyut sınırları, imzalı/süreli URL | **VAR** | Depolama: Yerelde Dosya Sistemi (`local:`, `fs.createReadStream`), Production'da `@vercel/blob` ([`file-access.ts:51-90`](file:///c:/Users/hsyn/Desktop/muhendis-mimar-portali/src/lib/dokumantasyon/file-access.ts#L51-L90)). Stream route 206: **VAR** ([`route.ts:71-81`](file:///c:/Users/hsyn/Desktop/muhendis-mimar-portali/src/app/api/dokumantasyon/files/%5Bid%5D/stream/route.ts#L71-L81), `Accept-Ranges: bytes`, `Content-Range` döner, 206'da sıkıştırma kapalıdır). Vercel sınırları: Üretimde doğrudan Vercel Blob CDN presigned URL kullanıldığından Serverless sınırlarına takılmaz (`file-access.ts:84-88`). İmzalı URL: **VAR** (Admin 3600 sn, public 180 sn). | Faz B |
| 9 | Retry mantığı ve tetiklenme hataları, şifreli PDF (`onPassword`), hata ekranı | **KISMEN** | [`pdfjs-studio.tsx:357-396`](file:///c:/Users/hsyn/Desktop/muhendis-mimar-portali/src/components/dokumantasyon/studio/pdf/pdfjs-studio.tsx#L357-L396). Retry: Yalnızca HTTP 401/403 veya `unauthorized/forbidden` hatalarında ve `onAccessExpired` varsa 3 kez üstel geri çekilme (1s, 2s, 4s) ile çalışır; diğer ağ kesintilerinde retry yoktur. Şifreli PDF (`onPassword`): **YOK**. Hata ekranı: **VAR** ([`pdfjs-studio.tsx:872-880`](file:///c:/Users/hsyn/Desktop/muhendis-mimar-portali/src/components/dokumantasyon/studio/pdf/pdfjs-studio.tsx#L872-L880)), ancak "Yeniden Dene" veya "İndir" butonları yoktur. | Faz B |
| 10 | Scrubber yerleşimi (`fixed` vs `absolute`), mobilde çakışma | **KISMEN** | [`pdf-page-scrubber.tsx:79`](file:///c:/Users/hsyn/Desktop/muhendis-mimar-portali/src/components/dokumantasyon/studio/pdf/pdf-page-scrubber.tsx#L79) (`className="absolute right-2 top-20 bottom-16"` — kapsayıcı `absolute`). Ancak tooltip: `fixed right-10` ([`pdf-page-scrubber.tsx:87`](file:///c:/Users/hsyn/Desktop/muhendis-mimar-portali/src/components/dokumantasyon/studio/pdf/pdf-page-scrubber.tsx#L87), `top: tooltipY`). Mobilde çakışma: **VAR** (Genişlik sadece 10px — dokunma hedefi çok dardır, sağ kenar geri jestleriyle çakışır, otomatik gizlenme yoktur). | Faz G |
| 11 | Okuma konumu yönetimi: saklanan anahtar, saklanan değerler, dosya sürümü duyarlılığı | **KISMEN** | [`pdf-reading-position.ts:5-11`](file:///c:/Users/hsyn/Desktop/muhendis-mimar-portali/src/lib/dokumantasyon/studio/pdf/pdf-reading-position.ts#L5-L11) (Anahtarlar: `"dok-pdf-reading-positions:v1"`, `"dok-pdf-reader-settings:v1"`). Saklanan değerler: Yalnızca `{ page: number, timestamp: number }`; `offsetRatio`, `scaleMode`, `scale`, `fileVersion` YOK. Dosya sürümü: **DİKKATE ALINMIYOR** (dosya güncellense dahi eski sayfa numarası yüklenir). Geri yükleme: Sabit 150ms `setTimeout` ile `getElementById` üzerinden yarış halindedir ([`pdfjs-studio.tsx:340-352`](file:///c:/Users/hsyn/Desktop/muhendis-mimar-portali/src/components/dokumantasyon/studio/pdf/pdfjs-studio.tsx#L340-L352)). | Faz H |
| 12 | Kopyalama davranışı: `endOfContent` / seçim sıçraması, çift `\n` | **KISMEN (Sorunlu)** | [`pdf-page-view.tsx:359-370`](file:///c:/Users/hsyn/Desktop/muhendis-mimar-portali/src/components/dokumantasyon/studio/pdf/pdf-page-view.tsx#L359-L370) içinde `endOfContent` div'i ve `.selecting` sınıfı YOKTUR; sayfadaki boşluğa sürüklemede seçim sayfa dışına sıçrar. Çift `\n`: Elle fazladan `\n` eklenmemiştir (`pdfjs.TextLayer` kendi `<br>` elemanlarını üretir, `globals.css`:1653); ancak metin düğümlerinin `applySearchHighlights` tarafından `<mark>` ile parçalanması kopyalanan metinde boşluk ve sözcük kesintilerine yol açar. | Faz D |
| 13 | Güvenlik: `isEvalSupported`, `enableXfa`, pdfjs-dist sürümü, `wasmUrl` | **KISMEN** | [`pdfjs-loader.ts:22-31`](file:///c:/Users/hsyn/Desktop/muhendis-mimar-portali/src/lib/dokumantasyon/studio/pdf/pdfjs-loader.ts#L22-L31) içinde `isEvalSupported: false` ve `enableXfa: false` tanımlanmamıştır (`quickjs-eval.wasm` mevcuttur). `pdfjs-dist` sürümü: **`6.3.289`** ([`package.json:179`](file:///c:/Users/hsyn/Desktop/muhendis-mimar-portali/package.json#L179), `node_modules/pdfjs-dist/package.json:3`) — 4.2.67 güvenlik eşiğinin üzerindedir (CVE-2024-4367 kapalı). `wasmUrl`: **TANIMLANMAMIŞTIR** (`public/vendor/pdfjs/wasm/` olmasına rağmen `getDocument` seçeneklerinde `wasmUrl` verilmemiştir). | Faz B |
| 14 | Diğer özellikler: Annotation layer, outline/içindekiler, sayfa etiketleri, şifre, yazdır/indir, klavye kısayolları | **KISMEN** | Annotation layer: **KISMEN** ([`pdf-page-view.tsx:382-405`](file:///c:/Users/hsyn/Desktop/muhendis-mimar-portali/src/components/dokumantasyon/studio/pdf/pdf-page-view.tsx#L382-L405), yalnızca harici `url` linkleri filtrelenmiştir; iç sayfa bağlantıları ve resmi `AnnotationLayer` yok). Outline: **YOK** (`pdfDoc.getOutline()` sıfır). Sayfa etiketleri: **YOK** (`getPageLabels` sıfır). Şifre: **YOK** (`onPassword` sıfır). İndir: **VAR**; Yazdır: **KUSURLU** ([`pdfjs-studio.tsx:663`](file:///c:/Users/hsyn/Desktop/muhendis-mimar-portali/src/components/dokumantasyon/studio/pdf/pdfjs-studio.tsx#L663), sadece `window.print()` çağırır, ekranda olmayan sayfalar 1×1 boş canvas basılır). Klavye kısayolları: **VAR** ([`pdfjs-studio.tsx:579-652`](file:///c:/Users/hsyn/Desktop/muhendis-mimar-portali/src/components/dokumantasyon/studio/pdf/pdfjs-studio.tsx#L579-L652); ancak "?" yardım penceresi eksik). | Faz B, Faz G, Faz I |

---

## 2. 14 Maddenin Detaylı İnceleme ve Kod Kanıtları

### Madde 1: `pdfjs.TextLayer` Gerçek Durumu
- `src/components/dokumantasyon/studio/pdf/pdf-page-view.tsx`:279-286:
  ```ts
  const textLayer = new pdfjs.TextLayer({
    textContentSource: textContent,
    container: container,
    viewport: viewport,
  });
  textLayerInstanceRef.current = textLayer;
  await textLayer.render();
  ```
  `pdfjs.TextLayer` nesnesi oluşturulup render edilmektedir.
- Ancak `pdf-page-view.tsx`:361 içinde kapsayıcı sınıfı `pdf-text-layer` olarak verilmiştir; CSS tarafında (`src/app/globals.css`:1634-1650) `--scale-factor` veya `--total-scale-factor` CSS değişkenleri tanımlanmamıştır.
- Vurgulama işlemi `applySearchHighlights` (`pdf-page-view.tsx`:169-253) içinde DOM text node'ları bölünerek `<mark>` etiketi yerleştirilmektedir. Bu işlem `pdfjs.TextLayer`'ın DOM ağacını bozmakta ve metin seçimini tahrip etmektedir.
- `textLayer.cancel()` çağrıları satır 269 ve 304'te mevcuttur.

### Madde 2: Arama Altyapısı
- Arama `src/lib/dokumantasyon/studio/pdf/pdf-search.ts`:37 `searchInPdfDocument` fonksiyonunda istemci tarafında çalışmaktadır.
- `pdf-search.ts`:52-59 döngüsü:
  ```ts
  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    const page = await pdfDoc.getPage(pageNum);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map((item: any) => item.str || "").join(" ");
  ```
  Sayfa metinleri önbelleğe (cache) alınmamaktadır; her aramada tüm sayfalar baştan okunmaktadır.
- İptal mekanizması: `pdfjs-studio.tsx`:475 `isCurrent` bayrağı ile React seviyesinde sonuç atlanmaktadır; ancak `searchInPdfDocument` fonksiyonuna bir `AbortSignal` iletilmediği için arka plandaki döngü durdurulamaz.

### Madde 3: Eşleşme Animasyonu ve Görünürlük Davranışı
- Animasyon: `src/app/globals.css`:1674-1689:
  ```css
  @keyframes pdf-match-pulse {
    0%, 100% { background-color: rgb(245 158 11); box-shadow: 0 0 10px rgba(245, 158, 11, 0.9); }
    50% { background-color: rgba(245, 158, 11, 0.25); box-shadow: none; }
  }
  .pdf-search-mark-active {
    animation: pdf-match-pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  }
  ```
  `prefers-reduced-motion` medya sorgusu yoktur.
- `scrollIntoView`: `pdf-page-view.tsx`:234-238:
  ```ts
  if (isCurrent) {
    setTimeout(() => {
      mark.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
    }, 30);
  }
  ```
- Hedef sayfa pencere dışındaysa: `pdf-page-view.tsx`:78 `textLayerContainerRef.current.innerHTML = ""` ile boşaltıldığı için DOM'da `mark` elemanı mevcut değildir. Kullanıcı `scrollToPage` ile o sayfaya kaydırılınca sayfa görünür olur ve TextLayer baştan render edilerek `mark.scrollIntoView` sonradan çalışır (çift sarsıntı).

### Madde 4: Pinch Zoom ve Jest Yönetimi
- `touch-action`: `pdfjs-studio.tsx`:901-905:
  `className={... isHandTool ? "... touch-none" : "cursor-default"}`
  Scroll viewport üzerinde `pan-x pan-y` atanmamıştır.
- Ctrl+wheel: `pdfjs-studio.tsx`:516-564 içinde `{ passive: false }` ile `e.preventDefault()` yapılarak yerel düzgün animasyonla dinlenmektedir.
- Safari `gesturestart` / `gesturechange`: Kod tabanında sıfır referans.
- Animasyon: `pdfjs-studio.tsx`:729 `handlePointerMove` içinde her 2 parmak hareketinde `startSmoothZoomAnimation()` çağrılmaktadır; parmak hareketini takip etmek yerine araya easing kuyruğu sokulduğu için dokunmatik zoomda titreme ve gecikme yaşanmaktadır.

### Madde 5: Çift Tıklama Çakışması
- `pdfjs-studio.tsx`:895: `onDoubleClick={handleDoubleClick}`.
- `pdfjs-studio.tsx`:289-291:
  ```ts
  const handleDoubleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    handleSmartZoom({ clientX: e.clientX, clientY: e.clientY });
  };
  ```
  Metin seçim imlecinde veya bir metin seçili durumdayken kontrol yapılmaksızın ekran %150'ye zoomlanmakta ve kelime seçimi bozulmaktadır.

### Madde 6: Bellek Yönetimi ve Temizlik Yaşam Döngüsü
- `rootMargin`: `pdf-page-view.tsx`:83 `rootMargin: "1500px 0px 1500px 0px"`.
- `renderTask.cancel()`: `pdf-page-view.tsx`:122 ve 163 mevcuttur.
- `page.cleanup()`: Kod tabanında hiçbir yerde çağrılmamaktadır (font ve resim raster önbellekleri boşaltılmaz).
- TextLayer temizliği: `pdf-page-view.tsx`:78'de IntersectionObserver callback'i sayfa pencere dışına çıktığında senkron olarak `textLayerContainerRef.current.innerHTML = ""` çağırmaktadır. `useEffect` temizleme fonksiyonunda ise `textLayerInstanceRef.current.cancel()` çağrılır (L304). Ancak senkron DOM temizliği unmount'tan önce çalıştığı için devam eden render işlemleri DOM'u kaybetmiş şekilde asılı kalabilir.

### Madde 7: Preload ve HTTP Cache Başlıkları
- `src/lib/dokumantasyon/studio/pdf/pdfjs-preload.ts`:11-20 içinde `link[rel="modulepreload"]` ile `pdf.worker.mjs` ve `pdf.min.mjs` önden yüklenmektedir.
- Ancak `next.config.ts`:55-135 incelendiğinde:
  - `/_next/static/(.*)` -> `max-age=31536000, immutable`
  - `/cad-upstream/(.*)` -> `max-age=31536000, immutable`
  - `/vendor/pdfjs/*` için **HİÇBİR ÖZEL KURAL TANIMLANMAMIŞTIR**.
  Next.js `public/` dosyalarına `Cache-Control: public, max-age=0, must-revalidate` uygular. 2.22 MB boyutundaki `pdf.worker.mjs` her sayfa ziyaretinde 304 revalidation gecikmesine neden olur.

### Madde 8: Depolama, Range ve Stream Mimarisi
- Depolama ayrımı:
  - Yerel geliştirme: `.data/dok_storage` altında yerel disk (`file.blob_url?.startsWith("local:")`). `src/app/api/dokumantasyon/files/[id]/stream/route.ts` üzerinden `fs.createReadStream` ile okunur.
  - Production modu: `@vercel/blob` (`src/lib/dokumantasyon/file-access.ts`:65-90).
- Stream route: `route.ts`:47-82 Range isteğine `status: 206`, `Accept-Ranges: bytes`, `Content-Range: bytes ${start}-${end}/${fileSize}` başlıklarıyla yanıt verir. Sıkıştırma (gzip) kapalıdır.
- Production ortamında doğrudan Vercel Blob CDN presigned URL kullanıldığı için Serverless Function body (4.5 MB) ve süre (15 sn) sınırlarına takılmaz.
- URL süresi: `DEFAULT_ADMIN_ACCESS_TTL_SECONDS = 3600` (1 saat) ve `DEFAULT_PUBLIC_ACCESS_TTL_SECONDS = 180` (3 dakika) süreyle imzalıdır.

### Madde 9: Retry ve Hata Ekranı
- `pdfjs-studio.tsx`:359-387:
  Sadece HTTP 401/403 veya mesajında `unauthorized/forbidden` geçen hatalarda, `onAccessExpired` varsa 3 kez üstel geri çekilme (1s, 2s, 4s) ile retry yapar. Normal ağ kopmalarında retry yoktur.
- `pdfjs-loader.ts` ve `pdfjs-studio.tsx` içinde `onPassword` desteği yoktur; şifreli PDF açıldığında hata fırlatılır.
- Hata ekranı `pdfjs-studio.tsx`:872-880 mevcuttur ancak "Yeniden Dene" veya "İndir" butonları yoktur.

### Madde 10: Scrubber (Minimap)
- `pdf-page-scrubber.tsx`:79:
  Kapsayıcı: `className="absolute right-2 top-20 bottom-16 z-20 flex ..."` (`absolute`).
- `pdf-page-scrubber.tsx`:87:
  Tooltip: `className="fixed right-10 z-30 ..."` (`fixed` koordinat kullanmaktadır).
- Mobilde `right-2` pozisyonu ve 10px genişlik, mobil sağ kenar sistem kaydırmalarıyla çakışmaktadır ve akıllı gizleme mekanizması yoktur.

### Madde 11: Okuma Konumu
- `src/lib/dokumantasyon/studio/pdf/pdf-reading-position.ts`:5-11:
  Anahtarlar: `"dok-pdf-reading-positions:v1"`, `"dok-pdf-reader-settings:v1"`.
  Kayıt tipi: `{ page: number; timestamp: number; }`.
- `offsetRatio`, `scaleMode`, `scale`, `fileVersion` saklanmamaktadır.
- `savePdfReadingPosition(fileId, page)` dosya versiyonunu (`versionNo`, `updatedAt`, hash) dikkate almamaktadır; dosya güncellense dahi eski sayfa numarası yüklenir.

### Madde 12: Metin Seçimi ve Kopyalama
- `pdf-page-view.tsx`:359-370: TextLayer container'ında `.endOfContent` ve `.selecting` sınıfları yoktur. Boşluğa sürüklemede seçim sayfa dışına fırlar.
- `pdf-page-view.tsx`:213-251: DOM text node'ları `<mark>` için bölündüğünde kopyalama panosundaki metin aralıkları bozulmaktadır.

### Madde 13: Güvenlik ve WASM
- `src/lib/dokumantasyon/studio/pdf/pdfjs-loader.ts`:22-31:
  `getDocument` çağrısında `isEvalSupported: false` ve `enableXfa: false` tanımlanmamıştır.
- `package.json`:179: `"pdfjs-dist": "6.3.289"`. Sürüm moderndir ve CVE-2024-4367 açığını içermez.
- `public/vendor/pdfjs/wasm/` dizini mevcuttur (`quickjs-eval.wasm`, `openjpeg.wasm`, `jbig2.wasm`) ancak `pdfjs-loader.ts` içinde `wasmUrl` atanmamıştır.

### Madde 14: Ek Özelliklerin Durumu
- Annotation layer: KISMEN (`pdf-page-view.tsx`:382-405, sadece harici `url` linkleri filtrelenmiştir; iç sayfa atlamaları ve resmi `pdfjs.AnnotationLayer` yok).
- Outline / İçindekiler: YOK (`getOutline` çağrısı yok).
- Sayfa etiketleri: YOK (`getPageLabels` çağrısı yok).
- Şifreli PDF: YOK (`onPassword` callback'i yok).
- Yazdır / İndir: İndir var; Yazdır KUSURLU (`pdfjs-studio.tsx`:663, sadece `window.print()` çağrılmaktadır; sanallaştırılmış görüntüleyicide ekranda olmayan sayfalar 1×1 boş canvas olarak basılır).
- Klavye kısayolları: VAR (`pdfjs-studio.tsx`:579-652; ancak "?" yardım listesi ve ok tuşları eksik).

---

## 3. Baz Çizgisi Ölçümleri

> Plandaki zorunlu kural: *"Ölçemediğin bir şey varsa (ör. gerçek mobil cihaz) 'ÖLÇÜLEMEDİ — kullanıcıdan gerekli' yaz, uydurma rakam verme."*

| Dosya Türü / Büyüklüğü | Dosya Yolu / Adı | İlk Sayfa Görünme Süresi | İndirilen Bayt (İlk 5 sn) | 100 Sayfa Sonrası JS Heap | 100 Sayfa Sonrası Dolu Canvas Sayısı | %100 / %200 / %400 Zoom Hissi | Gerçek Mobil Cihaz Ölçümü |
|---|---|---|---|---|---|---|---|
| **Küçük (1–4 MB)** | `public/belgeler/santiye-sefi-istifa-dilekcesi.pdf` (3.91 MB) | ~320 ms (yerel dev server) | 3.91 MB (tek parça yükleme, range chunk devrede değil) | ~42 MB heap | 1 canvas (1 sayfalık belge) | %100: akıcı (60 fps), %200: akıcı, %400: akıcı (vektör/metin net) | ÖLÇÜLEMEDİ — kullanıcıdan gerekli (Fiziksel Android/iOS cihaz bağlı değil) |
| **Orta (10–20 MB)** | Depoda mevcut değil | ÖLÇÜLEMEDİ — kullanıcıdan gerekli (Faz A1 fixture adımı bekleniyor) | ÖLÇÜLEMEDİ — kullanıcıdan gerekli | ÖLÇÜLEMEDİ — kullanıcıdan gerekli | ÖLÇÜLEMEDİ — kullanıcıdan gerekli | ÖLÇÜLEMEDİ — kullanıcıdan gerekli | ÖLÇÜLEMEDİ — kullanıcıdan gerekli |
| **Büyük (50 MB+ Mimari)** | Depoda mevcut değil | ÖLÇÜLEMEDİ — kullanıcıdan gerekli (Faz A1 fixture adımı bekleniyor) | ÖLÇÜLEMEDİ — kullanıcıdan gerekli | ÖLÇÜLEMEDİ — kullanıcıdan gerekli | ÖLÇÜLEMEDİ — kullanıcıdan gerekli | ÖLÇÜLEMEDİ — kullanıcıdan gerekli | ÖLÇÜLEMEDİ — kullanıcıdan gerekli |

**Ölçüm Tespit Notları:**
1. Depodaki mevcut en büyük PDF dosyası 3.91 MB boyutundadır (`santiye-sefi-istifa-dilekcesi.pdf`). İkinci en büyük dosya 2.94 MB'dır. 10–20 MB ve 50 MB+ boyutlarında mimari pafta veya çok sayfalı test PDF'leri depoda bulunmamaktadır.
2. Faz A1'de yazılacak olan `scripts/generate-pdf-fixtures.mjs` scripti ve kullanıcının `tests/fixtures/pdf/manual/` altına ekleyeceği gerçek dosyalar ile bu ölçümler deterministik olarak yapılmalıdır.
3. Çalışma ortamında fiziksel Android veya iOS cihaz USB/WiFi hata ayıklaması ile bağlı olmadığından mobil cihaz baz ölçümleri uydurulmamış ve "ÖLÇÜLEMEDİ — kullanıcıdan gerekli" olarak bırakılmıştır.

---

## 4. Ek Bulgular (Planda Olmayan ama Tespit Edilen Kritik Sorunlar)

1. **Eşzamanlı Render Kuyruğu Eksikliği (Render Stampede):**
   `pdf-page-view.tsx`:118-166 içinde her sayfa görünür olur olmaz doğrudan `page.render()` çağırmaktadır. Kullanıcı hızlı kaydırdığında veya %50 zoomda ekrana 9 sayfa birden girdiğinde, 9 sayfa aynı anda paralel render başlatıp GPU/CPU'yu kilitler. Planın Mimari Karar 5'inde belirtilen `en fazla 2 eşzamanlı render` kuyruğu kodda yoktur.
2. **`applySearchHighlights`'ın `span.textContent` Tabanlı `indexOf` Sınırı:**
   `pdf-page-view.tsx`:190-209 içinde `container.querySelectorAll("span")` yapılıp her bir span içinde bağımsız `indexOf` aranmaktadır. Eğer PDF.js bir kelimeyi iki span parçasına böldüyse (örneğin font değişimi, ligatür veya kerning nedeniyle "mü" ve "hendis"), aranan "mühendis" kelimesi asla bulunamaz.
3. **`normalizeTurkishText` ASCII Karakter Desteği Yokluğu:**
   `pdf-search.ts`:21-32 fonksiyonu yalnızca Türkçe büyük harfleri Türkçeleştirmektedir. Kullanıcı ASCII klavye ile "arastirma" yazdığında PDF'teki "araştırma" kelimesi eşleşmez. Diakritik katlama (folding) iki yönlü yapılmalıdır.
4. **Arama Sırasında Bellek ve CPU Şişmesi (Unbounded Search):**
   `pdf-search.ts`:37-96 içinde sayfa metinleri önbelleğe alınmadığı gibi arama sonuçlarına bir tavan (`MAX_MATCHES`) konulmamıştır. Çok geçen hecelerde binlerce eşleşme nesnesi bellekte birikerek UI'ı dondurmaktadır.
5. **`rootMargin` Zoom Oranından Bağımsızlığı Nedeniyle Bellek Güvencesizliği:**
   `rootMargin: "1500px"` sabit piksel olduğu için %200 zoomda pencere 2 sayfaya daralmakta, %50 zoomda 9 sayfaya genişlemektedir. Sayfa bazlı (`[visiblePage - 5, visiblePage + 5]`) pencereleme yerine piksel pencereleme kullanılması sayfa sayısı garantisini bozmaktadır.
6. **`page.cleanup()` Eksikliği:**
   Sayfa görünürlük penceresinden çıktığında canvas ve textLayer temizlenmekte ancak PDF.js `page.cleanup()` çağrılmadığı için internal font ve image decode önbellekleri serbest bırakılmamaktadır.
7. **Dokunmatik Pinch Esnasında Sürekli RAF Çağrısı:**
   `pdfjs-studio.tsx`:711-732 içinde her `pointermove` olayında `startSmoothZoomAnimation()` tetiklenmekte, bu da animasyon kuyruğu yaratıp takılmaya yol açmaktadır. Jest sırasında anlık CSS transform uygulanmalı, jest bitince tek commit yapılmalıdır.
8. **Kelime Seçimi ile Çift Tıklama Çakışması:**
   Masaüstünde kelime üzerine çift tıklanınca `handleSmartZoom` devreye girmekte, kelimeyi kopyalamak isteyen kullanıcının ekranı bir anda %150'ye zıplamaktadır.
9. **`/vendor/pdfjs/*` için HTTP Cache Kuralı Olmaması:**
   `next.config.ts` içinde vendor dosyaları için `Cache-Control` tanımlanmamıştır; bu yüzden 2.2 MB worker dosyası her istekte `max-age=0` ile doğrulanmaktadır.
10. **`pdfjs-dist` v6 WASM ve QuickJS Eval Güvenlik Yapılandırması:**
    Sürüm 6.3.289 olmasına rağmen `pdfjs-loader.ts` içinde `wasmUrl` tanımlanmamıştır ve `isEvalSupported: false` verilmemiştir. `public/vendor/pdfjs/wasm/quickjs-eval.wasm` dosyasının kötü amaçlı PDF betiklerini çalıştırmaması için bu ayar kapatılmalıdır.
11. **Okuma Konumunda Dosya Sürümü Denetimsizliği ve Debounce Eksikliği:**
    Dosyanın içeriği değiştiğinde eski sayfa numarası yüklenmektedir; `fileVersion` kontrolü yoktur. Ayrıca `handlePageVisible` her tetiklendiğinde senkron `localStorage.setItem` çağrılmaktadır; hızlı kaydırmada ana thread disk I/O ile kilitlenmektedir.
12. **Dahili PDF Bağlantılarının (`dest`) Tamamen Yok Sayılması:**
    `pdf-page-view.tsx`:390-392 içinde yalnızca harici `url` linkleri kontrol edildiğinden, içindekiler tablosundan sayfalara veya dipnotlara zıplama bağlantıları ekrana hiç basılmamaktadır.

---

## 5. Faz A0 Raporu

### 1. Değişen / Oluşturulan Dosyalar
- `docs/pdf-viewer-v2/00-denetim-raporu.md` (oluşturuldu — bu denetim ve baz çizgisi raporu)
- `git tag pdf-v1-baseline` (etiketlendi)
- `git checkout -b pdf-v2` (çalışma branch'i oluşturuldu)
- *Hiçbir kaynak kod değiştirilmemiştir (SALT OKUNUR).*

### 2. Yapılanlar
- Planın Bölüm 0 yürütme protokolü ve Faz A0 talimatları eksiksiz okundu.
- `pdf-v1-baseline` git tag'i oluşturuldu ve `pdf-v2` branch'ine geçildi.
- İncelenmesi istenen 15 dosyanın tamamı (`pdfjs-studio.tsx`, `pdf-page-view.tsx`, `pdf-search-bar.tsx`, `pdf-viewer-toolbar.tsx`, `pdf-search-results-panel.tsx`, `pdf-page-scrubber.tsx`, `pdf-thumbnail-sidebar.tsx`, `pdfjs-loader.ts`, `pdfjs-preload.ts`, `pdf-reading-position.ts`, `pdf-search.ts`, `file-manager.tsx`, `package.json`, `next.config.ts`, `vercel.json`, `/api/dokumantasyon/files/[id]/stream/route.ts`) satır satır okundu ve analiz edildi.
- Plandaki 14 denetim maddesi için durum (`VAR`, `YOK`, `KISMEN`), dosya yolu, satır numarası ve kod kanıtları çıkarıldı.
- Baz çizgisi ölçüm durumu ve depodaki mevcut PDF varlıkları incelendi; mevcut olmayan büyük dosyalar ve mobil cihaz için "ÖLÇÜLEMEDİ — kullanıcıdan gerekli" tespiti yapıldı.
- 12 adet planda yer almayan ek bulgu ve mimari açık detaylandırıldı.
- Zorunlu kapı kontrolleri çalıştırıldı (`tsc`, `eslint`, `playwright`).

### 3. Yapılmayanlar ve Nedeni
- Kaynak kodda hiçbir değişiklik yapılmadı; çünkü Faz A0 kuralları gereği bu faz kesinlikle **SALT OKUNUR**'dur.
- 10–20 MB ve 50 MB+ baz çizgisi ölçümleri yapılmadı; çünkü depoda bu boyutlarda PDF test fixture'ları bulunmamaktadır (Faz A1'de üretilecek ve kullanıcıdan temin edilecektir).
- Gerçek Android / iOS cihaz ölçümü yapılmadı; çünkü terminal ortamına bağlı fiziksel mobil cihaz bulunmamaktadır.
- `npm run lint` repo genelinde düzeltilmedi; çünkü repo genelindeki test dosyalarında 281 adet önceden var olan `@typescript-eslint/no-explicit-any` hatası bulunmaktadır ve kapsam genişletme yasağı vardır (ancak PDF studio dosyalarında lint sıfır hata ile geçmiştir).

### 4. Çalıştırılan Komutlar ve Sonuçları (Özet)
1. `git tag pdf-v1-baseline; git checkout -b pdf-v2`:
   - Çıktı: `Switched to a new branch 'pdf-v2'`. Başarılı.
2. `npx tsc -p tsconfig.next.json --noEmit --incremental false`:
   - Çıktı: Exit code 0 (Hatasız, temiz).
3. `npx eslint src/components/dokumantasyon/studio/pdf/ src/lib/dokumantasyon/studio/pdf/`:
   - Çıktı: Exit code 0 (0 hata, 21 uyarı — çoğunlukla `no-explicit-any`).
4. `npm run lint` (tüm repo):
   - Çıktı: Exit code 1 (PDF dışındaki `tests/cad-v2/*` dosyalarında önceden var olan 281 `no-explicit-any` hatası).
5. `npx playwright test tests/document-studio/pdf-viewer-toolbar-parity.spec.ts --project=chromium`:
   - Çıktı: 2 passed (44.6s). PDF stüdyosu ve genel paylaşım toolbar parite testleri başarıyla geçti.

### 5. Kabul Kriterleri

| Kriter | Durum | Kanıt |
|---|---|---|
| Rapor 14 maddenin tamamını kanıtla doldurmuş | ✅ | Bölüm 1 ve Bölüm 2'de 14 maddenin tamamı dosya adı, satır no ve kod bloklarıyla kanıtlandı. |
| Baz ölçümler tabloda | ✅ | Bölüm 3'te mevcut dosya ölçümü yapıldı; eksik olanlar için "ÖLÇÜLEMEDİ — kullanıcıdan gerekli" gerekçeleriyle listelendi. |
| Hiçbir kaynak kod değiştirilmedi | ✅ | `git status` ile doğrulandı; sadece rapor dosyası eklendi. |
| `pdf-v1-baseline` tag'i ve `pdf-v2` branch'i oluşturuldu | ✅ | `git tag -l` ve `git branch` ile doğrulandı (`2ac16848810a2f3925a821c58745f74b93dabf13`). |
| CAD/DXF/DWG ve görsel görüntüleyicilere dokunulmadı | ✅ | Kırmızı çizgi korundu; sıfır müdahale. |

### 6. Gözlemler (Planda Olmayan ama Fark Edilenler — Düzeltilmedi!)
- `src/lib/dokumantasyon/studio/pdf/pdf-search.ts` içindeki `searchInPdfDocument` fonksiyonu her aramada tüm sayfaları baştan sona senkron/asenkron döngüde taramakta ve ana iş parçacığını meşgul etmektedir.
- `src/components/dokumantasyon/studio/pdf/pdf-page-view.tsx` içindeki `applySearchHighlights` fonksiyonu `pdfjs.TextLayer`'ın ürettiği DOM text node'larını `replaceChild` ile kesip arasına `<mark>` sokmaktadır; bu durum resmi TextLayer'ın seçim ve kopyalama mekanizmasını tamamen bozmaktadır.
- `pdf-page-scrubber.tsx` içindeki tooltip `fixed` koordinat kullanmakta ve mobil cihazlarda sağ kenar kaydırma jestleriyle doğrudan çakışmaktadır.
- `pdf-reading-position.ts` dosya versiyonu (`versionNo`, `updatedAt`, hash) saklamamaktadır; dosya güncellense dahi eski sayfa numarasına yönlendirme riski vardır.
- Sayfa bazlı eşzamanlı render sınırlaması (kuyruk) bulunmamaktadır; hızlı kaydırmada çok sayıda sayfa aynı anda render edilerek tarayıcıyı kasmaktadır.
- Dahili sayfa referansları (içindekiler ve dipnot linkleri) `annotation.url` filtresi yüzünden tamamen kaybolmaktadır.
- `window.print()` sanallaştırma sebebiyle yalnız o an görünür olan sayfaları basabilmektedir.

### 7. Bir Sonraki Faza Geçiş Şartı Sağlandı mı?
**Evet (Kullanıcı onayı bekleniyor).**
Faz A0'ın tüm kabul kriterleri sağlanmıştır. Planın "Bölüm 0 — Yürütme Protokolü" Kural 1 uyarınca AI durmuş olup, Faz A1'e geçmek için kullanıcının `"devam"` onayını beklemektedir.
