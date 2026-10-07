# Plan 05: Deneyim, dayanıklılık ve mühendislik özellikleri

> **Amaç:** "Daha iyi bir PDF deneyimi için her türlü düşün" talebinin geri kalanı. Plan 02–04 **doğruluk, hız ve stabilite** işlerini kapsıyor; bu plan **hissi** (açılış, geri bildirim, hata toparlama) ve **bu siteye özgü değeri** (mühendislik çizimleri: katmanlar, ölçüm, pafta gezinmesi) kapsar.
> **Bağımlılık:** Dalga 1 maddelerinin çoğu bağımsız, küçük ve hemen yapılabilir. Dalga 2–3 maddeleri Plan 03'ün motoruna (`PdfEngine`) yaslanır.
> **Dürüstlük notu:** Bu plan "öner + tasarla" niteliğinde; **hiçbir madde sandbox'ta çalıştırılmadı**. Her madde "değer / maliyet / risk" ile etiketli, kullanıcı hangilerini istediğini seçer. Luna **seçilmeyen madde yapmaz**, kapsamı kendi başına genişletmez.

---

## 0. Önceliklendirme

| Dalga | Madde | Değer | Maliyet | Risk | Bağımlılık |
|---|---|---|---|---|---|
| **1** | W1 Açılış: ilerleme çubuğu + iskelet + hızlı ön ısıtma | Yüksek | S | Düşük | 02 |
| 1 | W2 Hata sınıfları + ErrorBoundary + kurtarma | Yüksek | M | Düşük | 02 |
| 1 | W3 Yazdırma: bayt'tan (iOS dahil) | Yüksek | S | Düşük | 02 |
| 1 | W4 "Kaldığın yerden devam" bildirimi | Orta | S | Düşük | — |
| 1 | W5 Kayan sayfa göstergesi (hızlı kaydırmada "12 / 300") | Orta | S | Düşük | 03 (`page` olayı) veya v3 |
| 1 | W6 Tanılama bilgisini kopyala | Yüksek (gerçek cihaz yok!) | S | Düşük | 02 |
| 1 | W7 Erişilebilirlik temeli | Orta | S | Düşük | — |
| 1 | W8 Güvenlik/yapılandırma denetimi (CSP, wasm, betik) | Orta | S | Düşük | 02 |
| **2** | W9 Fit "mıknatısı" (yakın değerde fit'e yapış) | Orta | S | Düşük | 04 |
| 2 | W10 Akıllı blok zoom (çift dokunma = metin sütununa sığdır) | Orta | M | Düşük | 04 |
| 2 | W11 El aracı ataleti | Düşük | S | Düşük | 03 |
| 2 | W12 Paftada mini harita (kuşbakışı) | Yüksek (büyük format) | M | Orta | 03 |
| 2 | W13 Alan yakınlaştırma (marquee zoom) | Orta | S | Düşük | 04 |
| 2 | W14 Paylaş / indir iyileştirmesi | Düşük | S | Düşük | — |
| **3** | W15 PDF katmanları (OCG) paneli | **Yüksek (CAD çıktıları)** | M | Orta | 03 |
| 3 | W16 Ölçek kalibrasyonu + ölçüm aracı (uzunluk, alan) | **Yüksek (mühendislik)** | L | Orta | 03 |
| 3 | W17 Çizim küçük resmi/yer imi kısayolları, sayfa etiketleri | Orta | S | Düşük | 03 |
| **4** | W18 Kalıcı bayt önbelleği (anında yeniden açma) | Orta | M | **Gizlilik** | 02 |
| 4 | W19 İki sayfa / tek sayfa modu | Düşük | L | Orta | 03 |

S ≈ yarım gün, M ≈ 1–2 gün, L ≈ 3+ gün (Luna için "tek oturumda" değil, ayrı bir plan).
**Önerim:** Dalga 1 tamamı, sonra W12 + W15 + W16 (siteye özgü fark). W18 yalnızca gizlilik kararından sonra.

---

# DALGA 1

## W1. Açılış deneyimi

**Bugün (kodu okudum):** `pdfjs-preload.ts` zaten modülü ve paylaşılan worker'ı ısıtıyor (veri tasarrufu/2G koşullu) ✅. `pdf-document-source` (Plan 02) `onProgress` veriyor ama arayüzde kullanılmıyor.

Yapılacaklar:
1. **İlerleme:** `viewerState==="loading"` iken durum alanına (`data-testid="pdf-viewer-status"`, satır ~1675) belirsiz çubuk yerine **gerçek yüzde** (`loaded/total`; toplam bilinmiyorsa belirsiz çubuk). Metin: "Belge indiriliyor… %42". Ardından "Sayfalar hazırlanıyor…" (boyut batch'i, Plan 03 P3.2).
2. **İskelet:** Boyutlar gelene dek ilk sayfa oranında (A4 varsayımı, sonra gerçek) boş beyaz sayfa kutusu + numara; `empty` durumu (Plan 03 sözleşmesi). **Boş ekran + dönen simge yerine gerçek sayfa kutusu**: algılanan hız artar.
3. **Ön ısıtma genişletme:** Dosya listesi sayfasında (belge kartı) `pointerenter`/`focus`/`touchstart` ve **kart görünür olunca (IntersectionObserver, idle)** `preloadPdfJsCode()` çağır; `shouldAllowPdfPreload()` kuralları aynen (veri tasarrufu saygısı). Ek: `PDFJS_MAIN`, `PDFJS_POLYFILLS`, `PDFJS_WORKER` için `fetch(url, { priority: "low" })` ile HTTP önbelleğini ısıt (modül/worker adresleri sürümlü ve `immutable`, Plan 02).
4. **Açıldıktan sonra boşta çalışma:** `requestIdleCallback` ile ilk 3 sayfanın backdrop'u (Plan 03 sınıf 3) ve sonraki 2 sayfanın boyutu/sayfa nesnesi. Kullanıcı sayfa 2'ye geçtiğinde beyaz görmez.
5. **Yavaş ağ:** `navigator.connection.effectiveType` `3g` ise tam yükleme eşiği (24 MB) 12 MB'a iner, büyük dosyada aralık (range) modu daha erken devreye girer (Plan 02 `FULL_FETCH_LIMIT_BYTES` ayarlanabilir sabit; yalnızca bu koşulda). *(Varsayım: efektif tip güvenilir değil; yalnızca `saveData` ve `2g/3g` için.)*
6. **İlk sayfa önceliği:** `getDocument` sonrası ilk render istekleri sınıf 0; sayfa boyutu batch'i **ilk 25 sayfa** gelince ekranı göster (Plan 03).

**Ölçüt:** S1 `ttfrMs` taban ± gürültü içinde veya daha iyi; yükleme ekranında yüzde hiç geri gitmez (birim test: `onProgress` monoton).

## W2. Hata sınıfları, ErrorBoundary ve kurtarma

**Bugün:** hata ekranları var (şifre, bozuk dosya, yeniden dene düğmeleri). Eksikler: ağ kopması vs süre dolması vs bellek vs tarayıcı desteği ayrımı; React çökmesinde beyaz ekran; sayfa düzeyinde hata yok.

Hata sınıfları (`PdfErrorKind`): `network` (çevrimdışı/zaman aşımı), `expired` (401/403 yenileme 3 denemeden sonra), `corrupt`, `password`, `unsupported` (Plan 02 canary/polyfill başarısız), `memory` (tahsis hatası tekrarlıyor, Plan 03 `allocFailures≥3`), `render` (sayfa düzeyi), `unknown`.

Her sınıf için **ne söylenir, ne yapılır**:

| Sınıf | Mesaj (kısa) | Eylemler |
|---|---|---|
| network | "Bağlantı kesildi. Bağlanınca devam edeceğiz." | Otomatik yeniden dene (`online` olayı + 2/4/8 sn), **konum korunur** |
| expired | "Oturum süresi doldu, yenileniyor…" | Sessiz yenile (Plan 02); başarısızsa "Yeniden dene" |
| corrupt | mevcut metin | İndir (mevcut) |
| unsupported | "Bu tarayıcı PDF'yi güvenli çizemiyor." | İndir + "Tarayıcınızı güncelleyin" + tanılama kopyala (W6) |
| memory | "Bu cihazda belge çok büyük. Yakınlaştırmayı azalttık." | Ölçek üst sınırını düşür (`maxScale ×0.6`), kalite uyarısı; geri alınabilir |
| render | küçük rozet: "Bu sayfa çizilemedi · Yeniden dene" | Yalnızca o sayfa, backdrop görünür kalır |

`PdfViewerErrorBoundary` (yeni, `src/components/dokumantasyon/studio/pdf/pdf-error-boundary.tsx`):

```tsx
export class PdfViewerErrorBoundary extends React.Component<{ children: React.ReactNode; onReset?: () => void; fileId: string },
  { err: Error | null }> {
  state = { err: null as Error | null };
  static getDerivedStateFromError(err: Error) { return { err }; }
  componentDidCatch(err: Error, info: React.ErrorInfo) { recordPdfError("react", err, info.componentStack); } // W6 halka tamponu
  render() {
    if (!this.state.err) return this.props.children;
    return (
      <div role="alert" data-testid="pdf-crash" className="…">
        <p>Görüntüleyici beklenmedik şekilde durdu. Okuma konumunuz korundu.</p>
        <button onClick={() => { this.setState({ err: null }); this.props.onReset?.(); }}>Yeniden yükle</button>
        <button onClick={…indir}>Dosyayı indir</button>
      </div>
    );
  }
}
```

- Konum her zaman `sessionStorage`'a da yazılır (`dok:pos:${fileId}`, mevcut kalıcı kayıt zaten var; **çökme** ve **sekme yenilemesi (iOS bellek öldürmesi)** için senkron yazım: `pagehide`/`visibilitychange:hidden` içinde son konum). Açılışta kayıt varsa W4 bildirimi.
- `window.addEventListener("unhandledrejection"/"error")` yalnızca **PDF modülü açıkken** dinlenir, `RenderingCancelledException`/`AbortException` filtrelenir, halka tamponuna yazılır.
- Yeniden deneme: aynı belge anahtarı + `reloadKey++` (Plan 02 `document identity`).

**Ölçüt:** Birim: sınıf eşleme tablosu (HTTP 403→`expired`, `fetch` TypeError→`network`, `PasswordException`→`password`, `InvalidPDFException`→`corrupt`). E2E: `page.context().setOffline(true)` → bağlantı mesajı, `setOffline(false)` → otomatik devam, konum aynı.

## W3. Yazdırma (bayt'tan, iOS dahil)

**Bugün (okudum, `handlePrint`, satır 1259):** gizli `iframe`'e `accessUrl` yükleyip `print()` çağırıyor. Sorunlar: (a) `accessUrl` **imzalı ve süreli**; süre dolmuşsa iframe boş/hata sayfası yazdırır; (b) iOS Safari'de iframe içi `print()` güvenilmez (genelde tüm sayfayı veya boşu yazdırır); (c) tarayıcının gömülü PDF görüntüleyicisi iframe'de her zaman yüklenmeyebilir (mobil Chrome).

Yapılacak:

```ts
async function printPdfBytes(getBytes: () => Promise<Uint8Array>, opts: { ios: boolean }) {
  const bytes = await getBytes();                                  // Plan 02 pdf-document-source: ≤24MB ise zaten bellekte
  const url = URL.createObjectURL(new Blob([bytes], { type: "application/pdf" }));
  if (opts.ios || !("print" in window)) { window.open(url, "_blank", "noopener"); setTimeout(() => URL.revokeObjectURL(url), 60_000); return; } // kullanıcı tarayıcının PDF'inden yazdırır
  const f = document.createElement("iframe");
  Object.assign(f.style, { position: "fixed", right: "0", bottom: "0", width: "0", height: "0", border: "0", visibility: "hidden" });
  f.onload = () => { try { f.contentWindow?.focus(); f.contentWindow?.print(); } catch { window.open(url, "_blank", "noopener"); } };
  f.src = url; document.body.appendChild(f);
  const cleanup = () => { f.remove(); URL.revokeObjectURL(url); };
  window.addEventListener("afterprint", cleanup, { once: true }); setTimeout(cleanup, 5 * 60_000);
}
```

- `ios` algısı: `/iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)`.
- Bayt kaynağı: `pdf-document-source` tam yükleme yaptıysa o `Uint8Array`; aralık (range) modundaysa **istek anında** tam indir (ilerleme göstergesiyle, "Yazdırma için hazırlanıyor…"), lease yenileme mantığı aynı.
- Bellek: pdf.js `getDocument({data})`'ya verilen tampon worker'a transfer edilip boşalır; bu yüzden yazdırma için bayt'ları **saklama**, yazdırma anında yeniden indir (nadir işlem, bellek tasarrufu).
- v4 sanal liste nedeniyle `window.print()` (iframe başarısız) yedeği yalnızca mount edilmiş sayfaları yazdırır → yedek **kaldırılır**, onun yerine yeni sekmede açma kullanılır. `print:hidden` sınıfları kalır.

**Ölçüt:** E2E (Playwright, masaüstü): print düğmesi → `iframe` blob URL ile oluşur (`page.on("popup")` veya DOM kontrolü); lease süresi dolmuş senaryoda (test kancası) yine çalışır. iOS: gerçek cihaz kontrol listesi.

## W4. "Kaldığın yerden devam" bildirimi

Konum geri yükleme zaten var. Eksik: kullanıcı neden sayfa 87'de olduğunu anlamıyor.

- Açılışta kayıtlı sayfa > 1 ise 5 sn'lik, engellemeyen bildirim (`role="status"`): "**Sayfa 87**'den devam ediliyor · **Baştan başla**". "Baştan başla" `engine.scrollToPage(1)` + kayıt silme.
- Aynı oturumda aynı belge için ikinci açılışta gösterme (sessionStorage bayrağı).
- Ekran okuyucu için live region'a yaz.

## W5. Kayan sayfa göstergesi

Hızlı kaydırma/scrubber sürüklemesi sırasında ekran ortasının üstünde "12 / 300" hapı:
- Görünür: `scrolling` durumu (hız > 1500 px/sn, Plan 04 B6) veya scrubber aktif; kaybolur: 800 ms sessizlikten sonra (opacity geçişi 150 ms).
- Kaynak: `engine.getCurrentPage()` (aynı fonksiyon, M9 uyumsuzluğu yok). v3 yolunda `currentPage` state'i.
- `pointer-events:none`, `aria-hidden="true"` (anons değil; W7 ayrı live region).
- Mobilde güvenli alan: `top: calc(env(safe-area-inset-top) + araç çubuğu)`.
- Maliyet: yalnızca metin düğümü güncellemesi; React state yerine `ref.textContent` (kaydırma sırasında React render'ı yok).

## W6. Tanılama bilgisini kopyala

**Neden bu kritik:** Gerçek cihaz laboratuvarı yok; kullanıcı telefonunda bir sorun görünce bana/Luna'ya neyin olduğunu anlatamaz. Tek dokunuşla panoya JSON.

`collectPdfDiagnostics()` (yeni, `src/lib/dokumantasyon/studio/pdf/pdf-diagnostics.ts`):

```ts
export interface PdfDiagnostics {
  at: string; app: { build: string | undefined; engine: "v3" | "v4" };
  pdfjs: { version: string; build: "legacy"; polyfills: Record<string, boolean>; canary: { ok: boolean; ink: number } | null };
  device: { ua: string; dpr: number; screen: [number, number]; coarse: boolean; deviceMemory?: number; cores: number; touchPoints: number; online: boolean; saveData?: boolean; effectiveType?: string };
  doc: { numPages?: number; sizeBytes?: number; mode?: "full" | "range"; rotation?: number; scale?: number; mountedPages?: number };
  memory: { sharpMB?: number; backdropMB?: number; jsHeapMB?: number; allocFailures: number };
  errors: Array<{ t: number; kind: string; msg: string }>;          // son 20, mesajlar kısaltılmış, URL'ler kaldırılmış
  perf: { longTasksLast60s: number; maxFrameGapMs?: number };
}
```

- Halka tamponu `recordPdfError(kind, err)`: `msg` içindeki URL'ler (`https?://…`) ve `token=` sorgusu **temizlenir**; erişim URL'si/lease belirteci asla yazılmaz.
- Kullanıcı verisi gizliliği: belge adı/içeriği **yok**; `fileId` yok. Panoya kopyalanır, **hiçbir yere gönderilmez**.
- Arayüz: araç çubuğu "⋯" menüsünde **Tanılama bilgisini kopyala** (her zaman var, gizli değil) + kopyalandı bildirimi. `?pdfdebug=1` HUD'ında da düğme.
- `PdfDiagnostics.pdfjs.polyfills`: `compat-polyfills.mjs`'nin ana iş parçacığı/worker bayrakları (`withResolvers`, `transfer`, …) ve canary sonucu (Plan 02) aynen.

**Ölçüt:** Birim: URL ve `token` temizliği (5 örnek dizgi), halka tamponu 20 ile sınırlı. E2E: düğme → pano içeriği JSON, `pdfjs.version === PDFJS_VERSION`.

## W7. Erişilebilirlik temeli

- Kaydırma alanı: `role="document"` + `aria-label={pdfViewerStrings.viewer}` (mevcut dizgi), odak halkası görünür (`focus-visible`), `tabIndex=0` mevcut.
- **Canlı bölge** (görsel gizli): sayfa değişince `Sayfa N / M` (800 ms debounce, kaydırma sırasında değil; yalnızca klavye/scrubber/gezinme ile değişimde). Zoom değişince `%125` (settle'dan sonra).
- Tüm araç çubuğu düğmeleri `aria-label` (mevcut dizgiler var), dokunmatik hedef ≥ 44×44 px (mobil; `pdf-viewer-toolbar.tsx` boyutlarını Lighthouse/axe ile kontrol et).
- `prefers-reduced-motion`: zoom animasyonu 0 ms (Plan 04 `ZoomAnimator.reduced`), kayan gösterge geçişi yok.
- Yüksek karşıtlık: odak ve seçili sayfa vurgusu yalnızca renge bağlı olmasın (kenarlık + simge).
- Metin katmanı gerçek metni taşır (ekran okuyucu için); `aria-hidden` verme. Mount edilmemiş sayfalar okunamaz → canlı bölgede "Sayfa N'ye git" ile sayfa getirilebilir (mevcut sayfa kutusu).
- **Ölçüt:** `@axe-core/playwright` ile (zaten yoksa **ekleme**; mevcut bir a11y testi varsa onu çalıştır) kritik/ciddi ihlal yok; yoksa elle kontrol listesi.

## W8. Güvenlik ve yapılandırma denetimi

Hızlı, kod okuma + tek kontrol:
1. **CSP:** `grep -n "Content-Security-Policy" next.config.ts vercel.json` — bu depoda **bulunmadı** (kontrol ettim). Bir CSP eklenirse: `worker-src 'self' blob:`, `script-src` içinde pdf.js WASM (jbig2/openjpeg/qcms) için **`'wasm-unsafe-eval'`**; yoksa taranmış PDF'lerde görüntüler sessizce çözülmez. Bu bir **uyarı notu**, bu planda CSP eklenmez.
2. **pdf.js seçenekleri:** `getDocument` çağrısında `isEvalSupported: false` (canary zaten bunu doğruluyor, ana yükleyicide de yoksa ekle), `enableScripting: false` (varsayılan; açıkça yaz), `stopAtErrors: false` (varsayılan).
3. **`isSafePdfUrl`** (mevcut) lease URL'sini doğruluyor ✅; blob URL'leri W3'te oluşturulup `revokeObjectURL` ile kapatılıyor.
4. **Bağlantılar:** PDF içi dış bağlantılar `rel="noopener noreferrer"` + `target="_blank"` + yalnızca `http(s):`, `mailto:` şemaları (`javascript:`/`data:` engelli). `pdf-page-view.tsx` ek açıklama katmanındaki bağlantı işleyicisini **oku ve doğrula** (satır ~520–642; ben bu bölümü ayrıntılı incelemedim).
5. **Önbellek başlığı:** Plan 02 ile versiyonlu vendor; `/vendor/pdfjs/(.*)` immutable doğru.
6. **Bağımlılık:** `package.json`'da `pdfjs-dist` sabit sürüm (Plan 02 `--check`); `npm audit --omit=dev` raporu bilgi amaçlı (otomatik düzeltme **yapma**).

**Ölçüt:** Rapor `docs/pdf-viewer-v4/05-guvenlik-notlari.md` (bulgu listesi, hiçbiri açıksa neden).

---

# DALGA 2 (Plan 03/04 sonrası)

## W9. Fit mıknatısı

Pinch/tekerlek sonunda ölçek **fit-width (veya fit-page) ölçeğinin ±%3'ü içindeyse** o ölçeğe yapış ve modu fit olarak işaretle (160 ms animasyon). Acrobat benzeri "tam sığdı" hissi. Yalnızca etkileşim **sonunda** (`settle`), sırasında değil. Kapatma: Alt/Option basılıyken yapışma yok (masaüstü). Mobil: hafif `navigator.vibrate(5)` (varsa, Android; iOS yok sayılır) **yok** — titreşim önerilmez, bırakıldı.
**Ölçüt:** birim: `snapToFit(scale, fit, tol)` saf; E2E: S5 sonrası fit'e ±%2 yakınken `zoomMode==="fit-width"`.

## W10. Akıllı blok zoom

Çift dokunma bugün "fit × 2,2". Daha iyisi: dokunulan **metin sütununun genişliğine** sığdır.

```ts
function blockWidthAt(overlayRoot: HTMLElement, pageRect: DOMRect, clientX: number, clientY: number): { left: number; right: number } | null {
  const spans = [...overlayRoot.querySelectorAll<HTMLElement>(".textLayer span")];
  const near = spans.filter((s) => { const r = s.getBoundingClientRect(); return r.width > 0 && Math.abs((r.top + r.bottom) / 2 - clientY) < 140 && r.bottom > pageRect.top && r.top < pageRect.bottom; });
  if (near.length < 3) return null;
  let left = Infinity, right = -Infinity;
  for (const s of near) { const r = s.getBoundingClientRect(); left = Math.min(left, r.left); right = Math.max(right, r.right); }
  return right - left > 40 ? { left, right } : null;
}
// hedef ölçek = mevcutÖlçek × (viewW × 0.94) / (right − left); çıpa = bloğun sol kenarı hizalı, dokunulan satır dikeyde sabit
```
Yoksa (taranmış/metinsiz) mevcut 2,2× kuralı. Hedef ölçek `[fit×1.2, maxScale]` içinde kırpılır. İkinci çift dokunma fit'e döner.
**Risk:** çok sütunlu/tablo sayfalarda kötü blok; 140 px dikey pencere ve `near.length≥3` koruması. Birim test: sahte span dikdörtgenleriyle (saf kısım ayrılmış).

## W11. El aracı ataleti
Fare/kalem sürüklemesi bırakılınca hız ortalaması (son 100 ms) ile sönümlenen kaydırma (`v *= 0.95^(dt/16.7)`, eşik 0,02 px/ms). Sürükleme sırasında `scheduler` `scrolling` durumu (Plan 04 B6) otomatik. Dokunmatikte **yerel** kaydırma kullanılır (atalet zaten var), bu madde yalnızca masaüstü el aracı içindir.

## W12. Paftada mini harita

Büyük format (A1/A0) veya zoom > fit×2 iken köşede 120×~170 px kuşbakışı: sayfa küçük resmi (Plan 03 backdrop'tan, **ek render yok**) + görünür dikdörtgen çerçevesi; sürüklenince `engine.scrollToRect`. Mobilde varsayılan **kapalı** (ekran küçük), araç çubuğunda aç/kapa. Çok sayfalı belgede yalnızca **geçerli sayfa**.
- Konum: sağ alt, scrubber ve güvenli alanla çakışmayacak şekilde (`bottom: calc(env(safe-area-inset-bottom)+12px)`).
- Dikdörtgen güncellemesi: `engine.subscribe("scale"|"page")` + scroll rAF; DOM yazımı doğrudan (React render yok).
- Erişilebilirlik: `aria-hidden`, klavye için `Ctrl+Shift+M` açma/kapama (kısayol çakışması: Plan 04 B8 listesiyle kontrol).
**Ölçüt:** S7 sırasında mini harita açıkken kare aralığı bütçesi aşılmaz (aynı bütçe).

## W13. Alan yakınlaştırma (marquee)
Araç çubuğunda büyüteç aracı veya `Ctrl+Shift+Z`; fareyle dikdörtgen çiz → `engine` üzerinden o dikdörtgeni görünüme sığdır (`animator.animate`, 220 ms, çıpa dikdörtgen merkezi). Mobilde yok (pinch var). Esc ile çık.

## W14. Paylaş / indir
- Mobilde `navigator.share({ files })` varsa (dosya paylaşımı desteği `navigator.canShare({files})` ile sınanır) "Paylaş" menü öğesi; yoksa gösterme. Bayt'ı W3'teki gibi indir.
- İndir düğmesi mevcut: dosya adı korunur (`Content-Disposition` yoksa istemci adı), `download` özniteliği ile; lease süresi dolmuşsa önce yenile (Plan 02).

---

# DALGA 3 (mühendislik değeri)

## W15. PDF katmanları (OCG / isteğe bağlı içerik)

AutoCAD/Revit/Civil3D çıktılarında PDF **katmanları** (mimari/statik/tesisat) yaygın. Acrobat'ta katman paneliyle aç/kapa yapılır; bu en çok fark yaratan mühendislik özelliklerinden biri. pdf.js destekler.

API (pdf.js 6.3.289 tiplerinde **doğrula**: `node_modules/pdfjs-dist/types/src/display/api.d.ts`, `optional_content_config.d.ts`):

```ts
const ocg = await pdfDoc.getOptionalContentConfig({ intent: "display" });   // grup yoksa boş/tek
const groups = [...ocg];                    // [[id, { name, visible, ... }], ...] (yapıyı doğrula)
const order = ocg.getOrder();               // hiyerarşi (yoksa null)
ocg.setVisibility(id, false);               // aç/kapa
// render: page.render({ ..., optionalContentConfigPromise: Promise.resolve(ocg) })
```

Tasarım:
- Yan panel sekmesi **Katmanlar** (yalnızca `groups.length > 0` ise görünür). Her grup için onay kutusu; "Tümünü göster/gizle".
- **Önbellek geçersizleme:** Plan 03 parça anahtarına `ocgRev` ekle (`t:${doc}:${page}:${gen}:${ocgRev}:${col}:${row}`); toggle → `ocgRev++` → yeni nesil (eski nesil CSS ile görünür kalır, titreme yok) → backdrop de `ocgRev`'e bağlı yeniden çizilir (sınıf 1).
- Hepsi `optionalContentConfigPromise` ile **aynı `ocg` nesnesi** üzerinden: sayfa konakları, küçük resimler ve backdrop aynı yapılandırmayı kullanmalı (aksi halde küçük resimler farklı görünür).
- Durum kalıcılığı: belge başına `localStorage["dok:ocg:${fileId}:${version}"] = { hidden: [id,...] }`; açılışta uygula. (Kullanıcıya özel, sunucuya gitmez.)
- Yazdırma/indirme **orijinal dosyayı** verir; katman durumunu yansıtmaz (panelde not: "Yazdırma özgün dosyadır").
- Arama (metin katmanı) gizli katmandaki metni de bulabilir: pdf.js davranışı; panel notu gereksiz, ama bilinen sınır olarak dokümante et.

**Ölçüt:** Fixture: iki katmanlı bir PDF üret (`pdf-lib` ile OCG ekleme güç; **alternatif:** `pdf-lib` ile elle `OCProperties` + `/OC` işaretli iki içerik akışı yaz, ya da kullanıcıdan gerçek bir CAD PDF'i iste → `tests/pdf-v4/fixtures/` **ekleme**, yalnızca yerel test). Test: katman gizlenince ilgili bölgenin pikselleri beyaza döner (S7 piksel yardımcıları).
**Risk:** `getOptionalContentConfig` imzası/dönüşü sürümde farklı çıkabilir; Luna önce tipi okuyup küçük bir deneme betiğiyle (`tsx`) doğrular. Karmaşık `/OCMD` (üyelik) ifadeleri pdf.js'in işine bırakılır.

## W16. Ölçek kalibrasyonu ve ölçüm aracı

Mühendislik çizimlerinde "bu iki nokta arası kaç metre?" sorusu günlük iş. Acrobat'ın Ölçüm aracına karşılık.

**Model (kalıcı, ölçek-bağımsız):** tüm noktalar **PDF kullanıcı uzayında (pt)** saklanır: `viewport.convertToPdfPoint(x, y)`; böylece zoom/döndürme/DPR değişse de doğru kalır.

```ts
interface Calibration { page: number; metersPerPt: number; label: string }        // "1:100" veya "2 nokta kalibrasyonu"
interface Measurement { id: string; page: number; kind: "length" | "area"; pts: [number, number][] }
const dist = (a: [number, number], b: [number, number]) => Math.hypot(a[0] - b[0], a[1] - b[1]);
const polyLen = (p: [number, number][]) => p.slice(1).reduce((s, q, i) => s + dist(p[i], q), 0);
const polyArea = (p: [number, number][]) => Math.abs(p.reduce((s, q, i) => { const r = p[(i + 1) % p.length]; return s + (q[0] * r[1] - r[0] * q[1]); }, 0)) / 2;
// metre = polyLen * metersPerPt;  m² = polyArea * metersPerPt²
```

Kalibrasyon yolları:
1. **İki nokta:** kullanıcı bilinen bir mesafeyi (ör. aks aralığı) tıklar, gerçek uzunluğu (m) girer → `metersPerPt = L / dist(p1,p2)`.
2. **Ölçek oranı:** "1:50, 1:100…" seçimi + kâğıt boyutu varsayımı: `1 pt = 1/72 inç = 0,000352778 m (kâğıtta)`; `metersPerPt = 0.000352778 × ölçekPayda`. **Uyarı:** PDF'in gerçekten 1:1 kâğıt boyutunda (A1 paftası A1 olarak) dışa aktarıldığı varsayımına dayanır; küçültülmüş çıktılarda yanlış çıkar → arayüzde "Doğrulamak için bilinen bir ölçüyle kontrol edin" notu; iki nokta yöntemi **önerilen** yöntemdir.
3. Pafta `UserUnit` (PDF `/UserUnit`) varsa: pdf.js `page.userUnit` verir (**doğrula**); `metersPerPt` ön değeri buna göre.

Arayüz:
- Araç çubuğunda **Ölçüm** aracı (ayrı mod; el/seçim ile birlikte Plan 04 B8 kısayol listesine `M` ekle, çakışma kontrolü). Mobilde dokunarak nokta koy, **büyüteç halkası** (parmağın altı görünsün; v1'de basit: nokta koyma 12 px yukarı kaydırılmış önizleme çizgisi).
- Çizim: sayfa konağının `overlays` katmanında **tek `<svg>`** (`viewBox` = render ölçeği; konumlar `convertToViewportPoint` ile). Ölçek değişince CSS ile birlikte ölçeklenir (nesil kabı içinde), çizgi kalınlığı `vector-effect: non-scaling-stroke`.
- Çıktı: uzunluk "12,34 m", alan "56,7 m²", toplam; **kopyala** düğmesi (metin).
- Saklama: `localStorage["dok:measure:${fileId}:${version}"]` (kalibrasyon + ölçümler, en çok 200 öğe). Sunucuya gitmez; paylaşılmaz (açıkça belirt).
- Snap: metin/çizgi uçlarına yapışma **yok** (v1). İsteğe bağlı v2: pdf.js `getOperatorList` ile vektör uç noktaları (ağır; kapsam dışı).
- Doğruluk sınırı: ekran hassasiyeti ≈ 1 piksel / zoom; en iyi sonuç için yakınlaştırarak ölçmeyi öner.

**Ölçüt:** Birim: `polyLen/polyArea/ metersPerPt` (bilinen üçgen/kare), döndürme 90° sonrası pt uzayı sabit, `convertToPdfPoint` gidiş-dönüş. E2E: iki nokta kalibrasyonu + üçüncü nokta ölçümü ±%0,5.
**Risk:** Kullanıcı yanlış ölçeğe güvenip kararlar verebilir → her ölçüm çıktısında kalibrasyon kaynağı ("2 nokta kalibrasyonu: 10,00 m" / "1:100 varsayımı") görünür; "bu araç yaklaşık ölçüm içindir" notu.

## W17. Sayfa etiketleri ve yer imleri
- PDF sayfa etiketleri (`pdfDoc.getPageLabels()`): "iv", "A-101" gibi etiketler araç çubuğu kutusunda (mevcut `pageLabel` dizgisi var, kullanımını doğrula) ve küçük resimlerde.
- Çizim setlerinde sayfa başlığına göre arama için yer imi (outline) paneli mevcut; yerel **kullanıcı yer imleri** (sayfa + konum + not) `localStorage`'da, küçük resim panelinde rozet. (Kapsam: S.)

---

# DALGA 4 (isteğe bağlı, karar gerekir)

## W18. Kalıcı bayt önbelleği
Aynı belgeyi tekrar açınca indirme yok (`Cache Storage` veya IndexedDB; anahtar `fileId+version`, LRU 150 MB, 7 gün). **Gizlilik kararı kullanıcıya aittir:** belgeler hassas olabilir (sözleşme, taahhütname); cihazda saklanması paylaşılan bilgisayarlarda risk. Önerilen koşullar: **varsayılan kapalı**, kullanıcı ayarıyla açılır, çıkışta (oturum kapatma) tamamen silinir, şifreli PDF'ler saklanmaz. Luna bu maddeyi **kullanıcı onayı olmadan başlatmaz**.

## W19. İki sayfa / tek sayfa modu
Plan 03 yerleşim modeli `computeLayout`'u çok sütuna genişletmek ister (`columns`, `pairFirst`); sayfa-yerel çıpa modeli bunu destekler ama fit/çıpa/arama/küçük resim etkileşimlerinin hepsini etkiler. **Ayrı plan** olarak ele alınmalı; bu plan kapsamında yapılmaz.

---

## 1. Araştırılıp **önerilmeyen** fikirler (kayıt için)

| Fikir | Neden önerilmiyor |
|---|---|
| Render'ı `OffscreenCanvas` ile Worker'a taşımak | pdf.js `render()` yürütmesi çağrıldığı iş parçacığında çalışır; resmi, kararlı bir Worker-render yolu yok (özel fork gerekir). Bakım yükü yüksek, kazanç belirsiz. Plan 03 zamanlayıcısı + parça render zaten ana iş parçacığı kesintisini sınırlıyor. |
| Service Worker ile PDF/vendor önbelleği | Vendor dosyalar sürümlü + `immutable` (HTTP önbelleği yeterli); PDF'ler imzalı, süreli URL (SW önbelleği güvenlik ve tutarlılık riski). |
| `react-pdf`/başka kütüphaneye geçiş | Mevcut özel görüntüleyici metin/arama/vurgu/ek açıklama katmanlarını içeriyor; geçiş kazanımdan büyük regresyon riski. |
| PDF.js'i `pdf_viewer` (resmi viewer bileşenleri) ile değiştirmek | Aynı gerekçe; ayrıca mevcut Acrobat tarzı arayüzle uyum maliyeti. **Referans olarak** parça render ve gutter fikirleri zaten alındı. |
| Zoom'da titreşim (`navigator.vibrate`) | iOS desteklemez, Android'de de rahatsız edici; değeri düşük. |

## 2. Karar bekleyen sorular (kullanıcıya)

1. W18 (kalıcı önbellek) istenir mi, hangi gizlilik koşullarıyla?
2. W16 ölçüm aracı için hedef: yalnızca uzunluk mu, alan da mı? Kalibrasyon yöntemi: iki nokta yeterli mi?
3. W15 için elinizde gerçek CAD PDF örneği var mı? (Test fixture'ı için; yoksa sentetik fixture ile ilerlenir, ama gerçek dosya doğrulaması daha değerli.)
4. Mobilde zoom üst sınırı 300% kalsın mı yoksa gerçek cihaz ölçümünden sonra 400%'e çıkarılsın mı?
5. Fit semantiği (Plan 04 A3: referans sayfa, kaydırmada zoom sabit) beklentinize uyuyor mu?

## 3. Çıkış ölçütü

- Seçilen her madde için kendi **Ölçüt** satırı sağlanmış ve `docs/pdf-viewer-v4/05-sonuc.md` içinde kanıt (test çıktısı veya cihaz notu) var.
- Dalga 1 maddeleri tamamlandığında Plan 01 bütçeleri **bozulmamış** (S1, S2, S4 gate'i yeniden yeşil).
- Seçilmeyen/ertelenen maddeler raporda "yapılmadı, neden" olarak listelenmiş.
