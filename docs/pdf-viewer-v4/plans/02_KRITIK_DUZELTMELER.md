# Plan 02 — Kritik Düzeltmeler (uyumluluk, kararlı açılış, doğru konum)

> **Uygulayıcı:** Luna. **Bağımlılık:** Plan 01 bitmiş ve `baseline.json` alınmış olmalı.
> **Kapsam:** D1, D2, D3, D10, D12, D13. Bu plan **tek başına yayınlanabilir** ve en büyük kazanç/risk oranına sahiptir.
> **Sıra:** K1 → K2 → K3 → K4. Her K'nın "Çıkış ölçütü" sağlanmadan sonrakine geçme.
> Hazır kod `ekler-hazir-kod.zip` içinde (Plan 01'in zip'i güncellendi; yeni dosyalar §0'da).

## 0. Hazır dosyalar (kopyala, yeniden yazma)

| Dosya | Durum |
|---|---|
| `scripts/sync-pdfjs-vendor.mjs` | Sandbox'ta çalıştırıldı: üretim + `--check` geçti (205 dosya, vendor 7,2 → 5,8 MB) |
| `scripts/pdfjs-compat-polyfills.mjs` | Chromium'da API silinerek ölçüldü (Plan 01 §3) |
| `src/lib/pdfjs-paths.ts` | Sync script bunu **otomatik üretir**; elle düzenleme |
| `src/lib/dokumantasyon/studio/pdf/pdf-document-source.ts` | Saf TS, pdf.js'e bağımlı değil. `tests/pdf-v4/unit/document-source.test.ts` ile **8/8 geçti** (Node) |
| `tests/pdf-v4/unit/document-source.test.ts` | `npx tsx tests/pdf-v4/unit/document-source.test.ts` |
| `src/lib/dokumantasyon/studio/pdf/pdf-canary.ts` | Tip kontrolünden geçti; kanarya PDF'i Chromium'da ölçüldü (sağlam ≈2038 koyu piksel, bozuk ortam 0). Uygulama içinde koşturulmadı |

`@/` yolları kullanan dosyalar uygulamanın tsconfig'iyle derlenir.

---

## K1 — Uyumluluk: legacy build + 3 polyfill + sürümlü vendor (D1, D12)

### Sorun (ölçüldü)
Vendor'daki modern `pdf.min.mjs` Chrome <145, Firefox <144, Safari <26.2, Samsung Internet'te `getOrInsertComputed is not a function` ile **hiç çizmiyor** (küresel ≈%18). Legacy build tek başına yetmez: `Promise.withResolvers`, `ArrayBuffer.prototype.transfer/transferToFixedLength`, `ReadableStream[Symbol.asyncIterator]` yoksa ya hata verir ya da **hatasız boş metin** çizer. Ayrıca `/vendor/pdfjs/*` 1 yıl `immutable` iken ana dosya ile worker aynı yolda: sürüm yükseltince eski önbellekle karışıp "API version does not match Worker version" çıkar.

### Hedef mimari
```
public/vendor/pdfjs/v6.3.289/
  pdf.min.mjs            ← legacy/build/pdf.min.mjs
  pdf.worker.min.mjs     ← legacy/build/pdf.worker.min.mjs (1,3 MB; eski 2,2 MB'lık pdf.worker.mjs yerine)
  compat-polyfills.mjs   ← scripts/pdfjs-compat-polyfills.mjs
  worker-entry.mjs       ← import "./compat-polyfills.mjs"; import "./pdf.worker.min.mjs";
  cmaps/ standard_fonts/ wasm/ iccs/ LICENSE manifest.json
```
Ana iş parçacığı: önce `compat-polyfills.mjs`, sonra `pdf.min.mjs` import edilir. Worker: `workerSrc = worker-entry.mjs` (importlar sırayla çalışır: önce polyfill, sonra worker). Sürüm klasörde olduğu için `immutable` önbellek **doğru**; `vercel.json` ve `next.config.ts` kalıpları (`/vendor/pdfjs/(.*)`) yeni yolu zaten kapsar, **header değişikliği gerekmez**.

### Adımlar
1. **Sürümü sabitle:** `npm i -E pdfjs-dist@6.3.289` (package.json'da `^`/`~` olmasın). Script bunu zorlar.
2. **Dosyaları kopyala** (`sync-pdfjs-vendor.mjs`, `pdfjs-compat-polyfills.mjs`). `package.json`:
   ```json
   "sync:pdfjs": "node scripts/sync-pdfjs-vendor.mjs",
   "prebuild": "<mevcut prebuild> && node scripts/sync-pdfjs-vendor.mjs --check"
   ```
3. `npm run sync:pdfjs` → `public/vendor/pdfjs/v6.3.289/` oluşur, **eski dosyalar silinir**, `src/lib/pdfjs-paths.ts` yazılır. (`image_decoders/` bilerek kopyalanmaz: kodda referansı yok; bir yerde gerekirse `grep -rn image_decoders src` ile doğrula.)
4. **`src/lib/pdfjs-client.ts`** — yükleme bloğunu şu hâle getir:
   ```ts
   import { PDFJS_MAIN, PDFJS_POLYFILLS, PDFJS_WORKER } from "@/lib/pdfjs-paths";
   // ...
   if (!pdfJsPromise) {
     pdfJsPromise = (async () => {
       await import(/* webpackIgnore: true */ PDFJS_POLYFILLS); // ana iş parçacığı polyfill'i, pdf.js'ten ÖNCE
       const pdfjs = (await import(/* webpackIgnore: true */ PDFJS_MAIN)) as BrowserPdfJs;
       pdfjs.GlobalWorkerOptions.workerSrc = PDFJS_WORKER;
       window.pdfjsLib = pdfjs;
       return pdfjs;
     })().catch((error) => { pdfJsPromise = null; throw error; });
   }
   ```
   (Mevcut kodda `moduleUrl` değişkeni + `webpackIgnore` kalıbı var; aynı kalıbı koru.)
5. **`pdfjs-loader.ts`** → `createSecurePdfLoadingTask` içindeki üç sabit yolu `PDFJS_CMAPS`, `PDFJS_FONTS`, `PDFJS_WASM` ile değiştir ve `iccUrl: PDFJS_ICCS` ekle (parametre pdf.js 6 tiplerinde var).
6. **5 stüdyo** (`insaat-ruhsati-studio`, `beton-dokum-studio`, `taahhutname-studio`, `sozlesme-studio`, `istifa-studio` `.tsx`, `src/components/`): `cMapUrl: "/vendor/pdfjs/cmaps/"` → `PDFJS_CMAPS`, `standardFontDataUrl: "/vendor/pdfjs/standard_fonts/"` → `PDFJS_FONTS` (import: `@/lib/pdfjs-paths`). Başka değişiklik yapma.
7. **Eski yola bağlı script/testleri güncelle:**
   - `scripts/check-dokumantasyon-studio-all.mjs`, `...-stage2-v3.mjs`, `...-stage3.mjs`: `includes("/vendor/pdfjs/pdf.min.mjs")` → `pdfjsClientContent.includes("PDFJS_MAIN")` ve ayrıca `src/lib/pdfjs-paths.ts` içinde `"/vendor/pdfjs/v"` geçtiğini doğrula.
   - `tests/document-studio/pdf-viewer-v2-faz-b.spec.ts` TEST 1: istek yolunu `PDFJS_MAIN` yap (immutable beklentisi aynen kalır) ve **yeni test**: `/vendor/pdfjs/pdf.min.mjs` (eski yol) **404** dönmeli.
   - `tests/pdf-v3/text-quality.test.ts:22`: `"public/vendor/pdfjs/standard_fonts"` → `` `public/vendor/pdfjs/v${PDFJS_VERSION}/standard_fonts` ``.
8. **Uyumsuz tarayıcı UI'ı** (`pdfjs-studio.tsx`, `strings.ts`):
   - `errorType` birleşimine `"unsupported"` ekle (satır ≈146).
   - Yükleme `catch`'inde (satır ≈709) **ilk** kontrol olarak: `err` bir modül yükleme hatası (`SyntaxError`, `TypeError: Failed to fetch dynamically imported module`) ya da mesajı `/is not a function|is not defined|not async iterable/i` ise `setErrorType("unsupported")`, retry yok.
   - Hata ekranında (satır ≈1701–1740 bloğu) `unsupported` için iki düğme: **İndir** (`onDownload`) ve **Yeni sekmede aç** (`window.open(accessUrl, "_blank", "noopener")`). `strings.ts`: `unsupportedBrowser: "Bu tarayıcı sürümü PDF görüntüleyiciyi desteklemiyor. Dosyayı indirip cihazınızdaki PDF uygulamasında açabilirsiniz."`
9. **Açılış kanaryası** (sessiz boş metin hatasına karşı): `pdfjs-studio.tsx` içinde bileşen mount olunca bir kez
   ```ts
   useEffect(() => {
     let alive = true;
     void runPdfCanary().then((r) => { if (alive && !r.ok) setCompatWarning(true); });
     return () => { alive = false; };
   }, []);
   ```
   `compatWarning` true ise araç çubuğunun altında kapatılabilir bir şerit: "Bu tarayıcıda metin eksik görünebilir. Sorun yaşarsanız dosyayı indirin." + İndir düğmesi. Belge **engellenmez** (grafikler çalışıyor olabilir). Sonucu `pdfStats.set("canary", r.ok ? "ok" : "FAIL:" + (r.error ?? r.ink))` ile HUD'a yaz.

### Çıkış ölçütü (K1)
- [ ] `node scripts/sync-pdfjs-vendor.mjs --check` temiz; `public/vendor/pdfjs/` içinde yalnızca `v6.3.289/` var.
- [ ] `npx tsc --noEmit` ve `npm run lint` temiz; **hiçbir** kaynakta `"/vendor/pdfjs/pdf` düz yolu kalmadı (`grep -rn "vendor/pdfjs" src scripts tests` yalnızca `pdfjs-paths.ts` ve test/şablon açıklamalarında).
- [ ] `npm run check:pdf-v4:compat` → **S10 yeşil** (`firstPageRendered=1`, `inkPixels≥3000`, `pageErrors=0`, `workerPreludeSeen=1`) ve `s10-selftest` yeşil.
- [ ] Beş stüdyonun üretim akışı (örn. sözleşme PDF önizleme) elle bir kez açıldı ve görüntülendi (rapora not).
- [ ] S1 koşturuldu; `scrollTopPx` hâlâ kırmızı olabilir (K3), diğer metrikler bozulmadı.
- [ ] Mevcut `check:pdf-v2:*`, `check:pdf-v3:*` ve `check:dokumantasyon:*` komutları yeşil.

---

## K2 — Belge kararlılığı: lease yenilenince belge yeniden yüklenmesin (D2)

### Sorun
`document-studio-shell.tsx` ≤120 sn kala lease'i yeniler → `accessUrl` prop'u değişir → `pdfjs-studio.tsx` yükleme `useEffect`'i (≈582–798, bağımlılık dizisi `[accessUrl, onAccessExpired, fileId, reloadKey, currentFileVersion, updateZoomState]`) belgeyi `destroy` edip baştan açar. Okuyan kullanıcı görünümünü kaybeder. Ayrıca `onAccessExpired`/`updateZoomState` gibi bir callback'in kimliği değişse de aynı yeniden yükleme olur (gizli tehlike).

### Çözüm
Belge **kimliği** = `fileId + currentFileVersion + reloadKey`. URL kimliğin parçası değildir. Bayt'lar bir kez, o anki URL ile alınır (`pdf-document-source.ts`): ≤24 MB tamamen indirilir (`getDocument({data})`), daha büyükte (sunucu Range destekliyorsa) özel aralık aktarımı her isteği o anki URL ile yapar. 401/403'te yeni lease istenir (3 deneme, üstel bekleme). Böylece lease ömrü ne olursa olsun belge açıkken URL'e ihtiyaç kalmaz (küçük belge) ya da her istekte taze URL kullanılır (büyük belge).

### Adımlar
1. **Yükleyiciye ekle** (`pdfjs-loader.ts`):
   ```ts
   import { openPdfSource, type PdfSourceCallbacks, type RangeTransportCtor, type RangeTransportLike } from "./pdf-document-source";
   import { PDFJS_CMAPS, PDFJS_FONTS, PDFJS_ICCS, PDFJS_WASM } from "@/lib/pdfjs-paths";

   export async function createPdfLoadingTaskFromLease(cb: PdfSourceCallbacks, options?: SecurePdfLoadingOptions) {
     const pdfjs = await loadSecurePdfJs();
     if (!pdfjs) throw new Error("PDF.js başlatılamadı.");
     const source = await openPdfSource(cb, pdfjs.PDFDataRangeTransport as unknown as RangeTransportCtor<RangeTransportLike>);
     let worker: unknown;
     try { worker = options?.useSharedWorker === false ? undefined : await getSharedPdfWorker(pdfjs); } catch { worker = undefined; }
     const common = {
       cMapUrl: PDFJS_CMAPS, cMapPacked: true, standardFontDataUrl: PDFJS_FONTS, wasmUrl: PDFJS_WASM, iccUrl: PDFJS_ICCS,
       isEvalSupported: false, disableAutoFetch: options?.disableAutoFetch ?? true,
       ...(worker ? { worker } : {}),
     };
     const params = source.kind === "data"
       ? { ...common, data: source.data }
       : { ...common, range: source.transport, length: source.length, rangeChunkSize: options?.rangeChunkSize ?? 262144 };
     const task = pdfjs.getDocument(params as Parameters<typeof pdfjs.getDocument>[0]);
     if (options?.onPassword) task.onPassword = options.onPassword;
     return task;
   }
   ```
   Eski `createSecurePdfLoadingTask(url, …)` **kalsın** (başka çağıranlar var).
2. **`pdfjs-studio.tsx`**:
   - Bileşen gövdesinde (mevcut `applyFitModeRef` kalıbıyla aynı):
     ```ts
     const accessUrlRef = useRef(accessUrl); accessUrlRef.current = accessUrl;
     const onAccessExpiredRef = useRef(onAccessExpired); onAccessExpiredRef.current = onAccessExpired;
     const updateZoomStateRef = useRef(updateZoomState); updateZoomStateRef.current = updateZoomState;
     ```
   - Yükleme `useEffect`'inde `createSecurePdfLoadingTask(accessUrl, …)` çağrısını şununla değiştir:
     ```ts
     const abort = new AbortController();           // effect cleanup'ında abort.abort()
     const task = await createPdfLoadingTaskFromLease({
       getUrl: () => accessUrlRef.current,
       refresh: () => onAccessExpiredRef.current?.() ?? Promise.resolve(null),
       onProgress: ({ loaded, total }) => { if (isMounted && loaded >= 0) setLoadProgress({ loaded, total }); },
       onRefreshing: (a) => { if (isMounted) setIsRefreshingAccess(a); },
       onFatal: (err) => { if (isMounted) { setErrorType("network"); setError(err instanceof Error ? err.message : pdfViewerStrings.genericLoadError); } },
       signal: abort.signal,
     }, { onPassword: /* mevcut onPassword aynen */ });
     ```
   - Effect gövdesinde `updateZoomState(...)` → `updateZoomStateRef.current(...)`.
   - **Bağımlılık dizisi:** `[fileId, reloadKey, currentFileVersion]` (başka hiçbir şey yok; `accessUrl`, `onAccessExpired`, `updateZoomState` **çıkarılır**).
   - `catch` içindeki eski `isExpiredAccess` / `onAccessExpired` retry bloğunu (≈745–767) **sil**: yeniden deneme artık kaynakta. `PdfSourceError`'ı sınıfla: `kind==="http" && status===404` → `missing`; `kind==="http"` (401/403 tükendi) → `network` + `accessRefreshError`; `too-large` → `network` + "PDF çok büyük"; `aborted` → sessizce çık. `retryCountRef` kullanımı (`handleRetry` dahil) sadeleşebilir.
   - Cleanup'a `abort.abort()` ekle.
3. **Kabuk (`document-studio-shell.tsx`)**: değişiklik gerekmiyor. Sadece test kancası ekle (Plan 01 S9 için), `refreshCurrentLease` tanımından sonra:
   ```ts
   useEffect(() => {
     if (typeof window === "undefined" || localStorage.getItem("dok:testHooks") !== "1") return;
     (window as unknown as { __dokRefreshLease?: () => Promise<unknown> }).__dokRefreshLease = () => refreshCurrentLease();
   }, [refreshCurrentLease]);
   ```
4. **Test:** Plan 01 §2 S9 (birim + e2e). Önce e2e'yi **mevcut kodda** koştur: `reloads≥1` görmelisin (D2 kanıtı); sonra düzeltmeden sonra `0`.
5. `retry` düğmesi (`handleRetry`) `reloadKey`'i artırarak belgeyi bilerek yeniden açar; bu davranış kalır.

### Çıkış ölçütü (K2)
- [ ] `tests/pdf-v4/unit/document-source.test.ts` 8/8 yeşil (hazır).
- [ ] S9 e2e: lease yenileme sonrası `reloads===0`, `scrollDriftPx≤1`, `blankFrames===0`; düzeltme öncesi `reloads≥1` kanıtı rapora eklendi.
- [ ] Elle: 30 MB'tan büyük bir PDF (varsa) Range ile açılıyor; küçük PDF indirme çubuğu ilerliyor; ağ kesilip geri gelince hata ekranı düzgün.
- [ ] Parola korumalı PDF (fixture varsa) hâlâ modal açıyor.
- [ ] Mevcut `pdf-viewer-v2-faz-b.spec.ts` (yükleme hattı testleri) yeşil; kırılan assertion varsa "yeni mimariye göre" güncellendi ve gerekçesi yazıldı.

---

## K3 — Doğru açılış konumu ve deterministik geri yükleme (D3, D13)

### Sorun (ölçüldü, M5)
Belge sayfa başında değil **≈305 px aşağıda** açılıyor. Neden: fit-genişlik `zoomTo` ile uygulanıyor; `useZoomGestures` varsayılan çıpası **görünüm merkezi** (`use-zoom-gestures.ts` satır 193). `scrollTop=0` iken ölçek 1,2 → 2,23 olunca merkez çıpası sayfayı yukarı iter: `(368−12)×(2,2302/1,2)+12−368 ≈ 305,6`. Ayrıca sayfalar önce yanlış ölçekte çizilip sonra yeniden çiziliyor (açılışta yanıp sönme), geri yükleme `setTimeout(80/150/100)` ile yapılıyor ve hedef sayfadan önceki sayfaların boyutu henüz bilinmediğinde yanlış yere gidiyor.

### Adımlar
1. **Üstteyken üstü çıpala** (`use-zoom-gestures.ts` satır 193):
   ```ts
   const rect = el.getBoundingClientRect();
   const atTop = el.scrollTop <= 1 && o.x == null && o.y == null; // varsayılan (merkez) çıpa yalnızca belge ortasındayken
   begin(o.x ?? rect.left + rect.width / 2, o.y ?? (atTop ? rect.top : rect.top + rect.height / 2));
   ```
   Tekerlek/pinch/çift dokunma açık koordinat verdiği için etkilenmez. Birim test: `scrollTop=0` iken fit uygula → `scrollTop` hâlâ 0 (`tests/pdf-v4` içinde S1 zaten ölçer).
2. **`viewReady` kapısı** (`pdfjs-studio.tsx`): ilk fit ölçeği hesaplanana (konteyner genişliği ≥ 2 px ve `getFitScale` null değil) kadar `PdfPageView` listesini **mount etme** (yer tutucu yüksekliği `firstPageSize` ile hesaplanmış boş sütun göster). Fit uygulanınca `viewReady=true`. Böylece sayfalar bir kez, doğru ölçekte çizilir. `viewReady` yalnızca ilk belge yüklemesinde false→true olur; sonraki zoom'lar etkilenmez.
3. **Konum geri yükleme (setTimeout yok):** Yükleme `effect`'inde (≈685–706) hedef sayfa `N>1` ise, `restore` yazılmadan önce **1..N sayfaların boyutlarını** topla:
   ```ts
   async function readPageSizes(doc: PDFDocumentProxy, upTo: number): Promise<Record<number, { width: number; height: number }>> {
     const out: Record<number, { width: number; height: number }> = {};
     for (let i = 1; i <= upTo; i += 40) {
       const batch = Array.from({ length: Math.min(40, upTo - i + 1) }, (_, k) => i + k);
       const pages = await Promise.all(batch.map((n) => doc.getPage(n)));
       pages.forEach((p, k) => { const v = p.getViewport({ scale: 1, rotation: p.rotate || 0 }); out[batch[k]] = { width: v.width, height: v.height }; });
     }
     return out;
   }
   ```
   (ölçüm M8: 300 sayfa ≈ 17–36 ms.) Sonucu `setPageDimensions` ile **toplu** yaz, `pendingRestoreRef.current = { page, ratio }` ata. Sonra `useLayoutEffect`/`requestAnimationFrame` zinciri:
   ```ts
   function applyRestore(frame = 0, lastTop = -1) {
     const r = pendingRestoreRef.current, c = scrollContainerRef.current;
     if (!r || !c) return;
     const el = document.getElementById(`pdf-page-${r.page}`);
     if (el) {
       const top = Math.max(el.offsetTop + r.ratio * el.clientHeight - 16, 0);
       c.scrollTo({ top, behavior: "auto" });
       if (Math.abs(top - lastTop) < 1 || frame >= 10) { pendingRestoreRef.current = null; return; } // 2 kare aynı → bitti
       requestAnimationFrame(() => applyRestore(frame + 1, top));
     } else if (frame < 10) requestAnimationFrame(() => applyRestore(frame + 1, lastTop));
   }
   ```
   `viewReady && pageDimensions hazır` olunca bir kez çağır; kullanıcı bu sırada tekerlek/dokunma ile kaydırırsa (`wheel`/`touchstart`) `pendingRestoreRef.current=null` yap (kullanıcı kontrolü önceliklidir). `#page=` URL özelliği ve kayıtlı konum önceliği (`urlHashPage > savedRecord > 1`) aynen kalır.
4. Geri yükleme yalnızca `page>1 || offsetRatio>0` iken çalışır; aksi hâlde belge **hiç kaydırılmaz** (`scrollTop=0`).

### Çıkış ölçütü (K3)
- [ ] **S1 yeşil:** tüm fixture'larda `scrollTopPx≤1` (önceden 305).
- [ ] Açılışta sayfanın yanlış ölçekte çizilip yeniden çizilmediği HUD/örnekleyici ile doğrulandı (`S1 sharpMs` ve ilk çizimden sonra `data-render-scale` değişmiyor).
- [ ] Kayıtlı konum testi (varsa mevcut `pdf-viewer-v2-faz-h.spec.ts`) yeşil; `karisik-boyut.pdf` ile 5. sayfaya `#page=5` açılış: hedef sayfa görünüm üstünde (±2 px), 10 kez tekrarlandığında aynı.
- [ ] Kullanıcı açılışta kaydırırsa geri yükleme onu geri çekmiyor (elle kontrol).
- [ ] Fit ve pinch davranışı bozulmadı: `check:pdf-v3:invariants` yeşil.

---

## K4 — Tarayıcıyı bozan kısayollar (D10)

Handler `pdfjs-studio.tsx` ≈1289–1456. `Ctrl+R` tarayıcıyı yeniler, `Ctrl+D` yer imi, `Ctrl+B`/`Ctrl+L` tarayıcı işlevleri; viewer bunları `preventDefault` ile çalmış (`strings.ts` hatta `rotateClockwise` "Ctrl+R", `downloadPdfShortcut` "Ctrl+D" yazıyor).

1. **Kaldır:** `mod && key === "r"` (döndür), `mod && key === "d"` (indir), `mod && key === "b"`, `mod && key === "l"` dallarını sil. Döndürme zaten `Ctrl+Shift++` / `Ctrl+Shift+-` (Acrobat'ın kısayolu) ile var; indirme araç çubuğundaki düğmeden.
2. `strings.ts` metinlerinden `(Ctrl+R)` ve `(Ctrl+D)` ifadelerini çıkar; kısayol modalındaki (`pdf-shortcuts-modal.tsx`) listeyi aynı şekilde güncelle.
3. **Kapsam:** tuş işleyici yalnızca odak görüntüleyicinin içindeyken ya da `document.activeElement === document.body` iken çalışsın (`rootRef.current?.contains(document.activeElement) || document.activeElement === document.body`); giriş alanları zaten `interactive` ile dışlanıyor. `Ctrl+P` yalnızca gerçek PDF yazdırma uygulanmışsa yakalansın, değilse tarayıcıya bırak.
4. Kalan kısayollar (`Ctrl+F`, `Ctrl+G`, `Ctrl+0/1/2`, `Ctrl+±`, `F4`, `Alt+←/→`, `Ctrl+Shift+S`, `Home/End`, ok tuşları, `H`, `V`, `Esc`, `?`) aynen kalır.

### Çıkış ölçütü (K4)
- [ ] `grep -n 'key === "r"\|key === "d"\|key === "b"\|key === "l"' pdfjs-studio.tsx` çıktısı boş (mod koşullu dallar için).
- [ ] Mevcut kısayol testleri (`pdf-viewer-v2-faz-*.spec.ts`, `pdf-viewer-toolbar-parity.spec.ts`) güncellenmiş beklentilerle yeşil. Silinen kısayolu bekleyen test varsa testi kaldır ve raporda yaz.

---

## Plan 02 genel çıkış ve rapor

- [ ] K1–K4 çıkış ölçütleri tamam; her biri için kanıt (komut çıktısı veya rapor tablosu).
- [ ] `npm run check:pdf-v4:report` çıktısı: S1, S9, S10 yeşil; diğer senaryolar `baseline.json`'dan **kötüleşmedi**.
- [ ] `npm run lint`, `npx tsc --noEmit`, `npm run build`, mevcut `check:pdf-v2/v3` ve `check:dokumantasyon:*` yeşil.
- [ ] Tek checkpoint commit (`feat(pdf): legacy pdf.js + lease-bağımsız açılış + doğru açılış konumu`), `AGENTS.md`'ye uygun.
- [ ] Rapora **dürüst sınırlar**: gerçek cihaz testi yapılmadı (kullanıcı Plan 01 §4 listesini çalıştıracak), eski tarayıcı yalnızca API silme simülasyonuyla doğrulandı.
