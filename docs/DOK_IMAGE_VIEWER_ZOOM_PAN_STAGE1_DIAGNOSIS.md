# Dokümantasyon Görsel Görüntüleyici — Aşama 1 Teşhisi

Tarih: 28 Eylül 2026  
Plan: `Muhendislik_Sitesi_Gorsel_Viewer_Stabil_Zoom_Pan_9_Asamali_Plan.md` (Aşama 1)  
Doğrulama tabanı: `main`, `4b51ebe`  
Kapsam: salt-okunur kod incelemesi ve yerel davranış teşhisi. Görüntüleyici davranışında değişiklik ve deploy yapılmadı.

## Çağrı zinciri

1. `src/components/dokumantasyon/file-manager.tsx` içindeki dosya açma yolları `/dokumantasyon/dosya/[fileId]` rotasına gider (ör. satır 669, 685, 1298 ve 1702).
2. `src/app/dokumantasyon/dosya/[fileId]/page.tsx`, `getAdminFileAccess(fileId)` ile dosya ve `previewKind` bilgisini alıp `DocumentStudioShell`'e aktarır.
3. `src/lib/dokumantasyon/preview-capabilities.ts`, `.jpg`, `.jpeg`, `.png` ve `.webp` uzantılarını `image` türüne eşler.
4. `src/components/dokumantasyon/studio/document-studio-shell.tsx`, `image` türünü dinamik olarak `src/components/dokumantasyon/preview/image-viewer.tsx` içindeki `DokImageViewer` bileşenine yollar.
5. Aynı viewer, `src/components/dokumantasyon/preview/file-preview-shell.tsx` ve public paylaşımda `src/components/dokumantasyon/public/public-preview-modal.tsx` tarafından da kullanılır. Ana dosya rotası full-viewport Document Studio'dur; public paylaşım yolu modal içindedir.

## Mevcut viewer mimarisi

- Tek ana görsel bileşeni `DokImageViewer`'dır (`preview/image-viewer.tsx:34`). Doğal boyutlar `img.onLoad` ile state'e alınır (`:54`); boyutlar gelmeden fit hesabı yapılmaz.
- Zoom seviyesi `scale` state'inde, fit/custom modu `isFitMode` state'inde tutulur. Fit hesabı gerçek viewport'un `clientWidth/clientHeight` değerlerinden sabit padding çıkarır; sonucu 0,20–1,00 aralığında tutup iki ondalığa yuvarlar (`:67–81`). `ResizeObserver` yalnız fit modundayken bu hesabı yeniler (`:90–98`).
- Render boyutları `naturalWidth/Height * scale` ile hesaplanır; ölçek CSS `transform: scale(...)` ile uygulanmaz. Görselin genişlik/yüksekliği ve etrafındaki wrapper boyutu değişir (`:170`, `:334–346`). Görsel `origin-center` ve merkezî konumlandırma kullanır; cursor/finger anchor hesabı yoktur.
- Pan ayrı bir transform state'i değildir: viewport `scrollLeft/scrollTop` değerleri değiştirilir. Pointer down her pointer türünde drag başlatır (mouse için yalnız primary button filtresi vardır), pointer move ise ortak başlangıç koordinatından scroll yazar (`:145–168`). `pointermove` sırasında React state setter kullanılmaz; drag başlangıç/bitişinde kullanılır.
- Wheel dinleyicisi native ve `{ passive: false }` kaydedilir (`:127–142`), ancak yalnız `Ctrl` veya `Meta` basılıyken `preventDefault` çağırır. Her wheel event'inde `deltaY` büyüklüğü ve `deltaMode` dikkate alınmadan sabit `+/-0,15` uygulanır (`:132–136`). Toolbar zoom adımları `+/-0,20`'dir (`:198`, `:213`). Custom zoom 0,10–5,00 ile sınırlıdır ve iki ondalığa yuvarlanır (`:100–105`).
- `resetView` ölçeği `1,00` yapıp custom moda geçirir; ayrı “Sığdır” komutu fit modunu açıp ölçüyü yeniden hesaplar (`:109–120`, `:220–225`). Bu nedenle yüzde göstergesindeki reset, fit/reset ile aynı davranış değildir.
- Viewport `touch-none` kullanır ve Pointer Events dinler (`:303–308`). İki pointer için aktif-pointer haritası, pinch başlangıç mesafesi veya midpoint hesabı yoktur. Mobil parmak hareketleri aynı scroll/pan yoluna girer; özel pinch zoom uygulanmaz.
- `getBoundingClientRect()` wheel/pointer handler'larında çağrılmaz. Ölçüm fit sırasında `clientWidth/clientHeight` ile yapılır. `transform 0.15s` geçişi rotation/flip transform'una aittir; zoom boyut değişikliği üzerinden yapıldığı için bu geçiş zoom ölçeğini yumuşatmıyor (`:173–176`, `:345–346`).

## Yerel yeniden üretim

Geçici bir Playwright teşhis testi Chromium'da çalıştırıldı; geniş (2400×1000), küçük (96×64) ve dikey (700×2400) PNG fixture'ları yerel yükleme endpoint'iyle açıldı. Geçici test dosyası çalışmadan sonra kaldırıldı. Son teşhis koşusu geçti (`1 passed`, 45,6 sn). Mobil ölçümler Chromium CDP touch emülasyonu ve planın 390×844, 412×915, 768×1024 viewport boyutlarıyla yapıldı; fiziksel trackpad/telefon kullanılmadı.

| Senaryo | Gözlem |
|---|---|
| Masaüstü 1365×768, 2400×1000 yatay görsel | Fit değeri %54. Normal wheel değeri değiştirmedi. İmleç konumunda Ctrl-wheel %54'ten %69'a geçti; imlecin altındaki aynı görsel noktası yaklaşık **71 px yatay, 67 px dikey** kaydı. |
| Wheel hassasiyeti | Tek `deltaY=-1000` eventi %69'dan %84'e geçti. Sonraki beş `deltaY=-20` eventi %84'ten %159'a geçti. Kod her event'e sabit adım verdiği için event büyüklüğü ve sıklığı aynı matematikte temsil edilmiyor. |
| Masaüstü pan / reset | Zoom %159 iken drag sonrası viewport scroll'u `(0,0)`'dan `(273,133)`'e geçti; pan çalışıyor. “100%” komutu `%100` custom moda, “Sığdır” `%54` fit moda döndü. |
| Telefon 390×844 | Fit modu %20'de kaldı; görsel 480 px genişlikteydi ve 390 px viewport'a sığmadı. İki parmak açıklığını artırıp midpoint'i taşıma zoom'u değiştirmedi (%20); viewport `scrollLeft` 0'dan 122'ye çıktı ve görüntü sola kaydı. |
| Telefon 412×915 | Fit hâlâ %20 ve görsel 480 px geniş. Önceki pan offset'i viewport değişiminden sonra korundu (`scrollLeft=100`); görselin sol kısmı ekranda değildi. |
| Tablet 768×1024 | Fit %29, görsel 696 px genişlikte ortalı. İki parmak hareketi zoom seviyesini değiştirmedi; sayfa scroll'u ve browser visual viewport scale'i 1 kaldı. |
| Boyut uçları | 96×64 küçük görsel %100'de merkezlendi. 700×2400 dikey görsel %25'e sığdı (175×600 px). |

## Kök neden sınıflandırması

1. **Cursor anchor kayması:** Zoom noktası wheel koordinatlarından hesaplanmıyor; görsel boyutları merkezden değişiyor. Ölçümde aynı görsel noktası cursor'dan yaklaşık 71×67 px uzaklaştı.
2. **Ayrı zoom ve pan temsilleri:** Zoom `scale` ile görsel ölçüsünü değiştiriyor, pan viewport scroll'unu değiştiriyor. Ortak `offsetX/offsetY/zoom` transform modeli yok.
3. **Wheel ölçekleme:** Sıradan wheel zoom yapmıyor. Ctrl/Meta-wheel delta büyüklüğünü yok sayıp event başına sabit adım uyguluyor.
4. **Pinch davranışı eksik:** `touch-action:none` browser gesture'ını kapatıyor; özel iki-pointer pinch motoru olmadığından parmak hareketi pan/scroll olarak yorumlanıyor.
5. **Fit tabanı ve resize:** Fit ölçeğinin %20 alt sınırı dar ekranda görselin gerçekten sığmasını engelleyebiliyor. Pan, fit modunu custom moda çevirmediği için resize sonrasında fit hesabı scroll offset'ini sıfırlamıyor; 390→412 ölçümünde içerik kesildi.
6. **Reset/floating-point sözleşmesi:** Zoom iki ondalıkta yuvarlanıyor; planın float hassasiyeti beklentisiyle uyuşmuyor. 100% komutu fit değil doğal boyuta yakın `scale=1` görünümünü seçiyor.

Stale scale closure, pointer başına React render, her harekette layout ölçümü, image-load öncesi fit ve passive wheel listener sorunu ölçümlerde kök neden olarak görünmedi: scale setter fonksiyonel güncelleme kullanıyor; pointermove doğrudan scroll yazıyor; ölçüm event handler'larında yapılmıyor; fit natural ölçüler `onLoad` sonrasında hesaplanıyor; wheel listener passive olmayan biçimde ekleniyor. `transform-origin:center` vardır, ancak ölçekleme CSS transform ile yapılmadığı için anchor kaymasının doğrudan sebebi merkezî yeniden boyutlandırma ve anchor matematiğinin bulunmamasıdır.

## Aşama 1 sonucu

- Gerçek file → route → preview-kind → viewer zinciri belirlendi.
- Desktop ve üç mobil/tablet viewport'ta sorun yerelde ölçüldü; küçük, geniş ve dikey görseller açıldı.
- Kök nedenler kaynak dosya ve davranış seviyesinde sınıflandırıldı.
- Uygulama kodu değiştirilmedi, test dosyası kalıcı eklenmedi ve Vercel deploy yapılmadı.

## Aşama 2 — Ortak zoom/pan çekirdeği

`src/lib/dokumantasyon/image-viewer-transform.ts` React ve DOM'dan bağımsız mantıksal `{ zoom, offsetX, offsetY }` transform modelini ve `MIN_ZOOM=1`, `MAX_ZOOM=8` sınırlarını tanımlar. `calculateBaseScale` ve `calculateFitTransform` başlangıçta sığdırma/merkezlemeyi, `zoomAroundPoint` anchor korumalı zoom'u, `clampTransform` görünür alan sınırlarını, `panBy` ise pan adımını hesaplar. Kesirli değerler yuvarlanmaz; sıfır, eksik ve sonlu olmayan ölçüler güvenli sonlu sonuçlara normalize edilir.

`tests/dokumantasyon/image-viewer-transform.test.ts`, fit merkezlemesi, merkez/sol üst/sağ alt anchor zoom, zoom round-trip, küçük ve büyük görsel clamp'i, min/max zoom, pan, kesirli hassasiyet ve bozuk ölçülerde sonlu sonuçları doğrular. Test komutu `npm run check:dokumantasyon:image-viewer-transform` şeklindedir.

Aşama 2 snapshot'ında hedefli test, TypeScript ve ESLint kontrolleri geçti. O aşama tamamlandığında `DokImageViewer` eski state/scroll modelini kullanıyordu ve yeni çekirdek henüz bağlanmamıştı. Vercel deploy veya uzak Git yazımı yapılmadı.

## Aşama 3 — Masaüstü zoom ve pan

`src/components/dokumantasyon/preview/image-viewer.tsx`, fit, wheel, toolbar ve pan için ortak `{ zoom, offsetX, offsetY }` state'ini kullanır. Render edilen görsel çerçevesi viewport koordinatlarında mutlak konumlanır; scroll offset'leri artık pan state'i değildir. Döndürülmüş görsel için ölçüler fit hesabında yönelime göre çevrilir.

Wheel dinleyicisi viewport üstündeki bütün wheel event'lerini aynı `zoomAroundPoint` hattına alır ve tarayıcı sayfa scroll'unu engeller. `deltaMode` pixel/line/page olarak normalize edilir (line için 16 CSS px, page için viewport yüksekliği); event başına delta ±150 CSS px, zoom çarpanı da 0,8–1,25 aralığında tutulur. Böylece çok büyük tek event doğrudan maksimum zoom'a sıçramaz. Anchor `clientX/clientY` ile viewport'un `getBoundingClientRect()` konumundan hesaplanır. Ctrl/Meta işaretli pinch benzeri wheel event'i de aynı hattan geçer; fiziksel trackpad donanımında event şekli ayrıca doğrulanmadı.

Toolbar zoom, viewport merkezini anchor alarak 1,2 çarpanıyla çalışır; “Sığdır” ve görünüm sıfırlama `calculateFitTransform` kullanır. Yalnız birincil mouse düğmesiyle ve zoom 1'den büyükken pan başlatılır. Pointer capture drag'in viewport dışına taşınca sürmesini sağlar; `panBy` sonucu requestAnimationFrame başına en fazla bir kez React state'e aktarılır. Cursor fit seviyesinde zoom-in, yakınlaştırmada grab, sürüklemede grabbing durumuna geçer.

Playwright masaüstü smoke testi `npm run check:dokumantasyon:phase3` ile geçti (1 test). Akış cursor anchor, line/page ve ctrlKey wheel event'leri, toolbar merkez anchor'ı, drag, hızlı yön değişimi, min/max zoom, fit, döndürme/resize ve dosya rotasından çıkıp yeniden açınca fit'e dönüşü kapsar. Saf matematik testi, tam TypeScript kontrolü ve hedefli ESLint de geçti.

Public paylaşım modalı için ayrıca denenen Playwright adımında “Önizle” eylemi modalı açmadığından modal özelinde kapat/aç smoke'u doğrulanamadı; ana DokImageViewer route'undaki unmount/reopen reset'i doğrulandı. Deploy veya uzak Git yazımı yapılmadı.

## Aşama 4 — Mobil pinch ve touch pan

`DokImageViewer` aktif touch pointer'larını `Map` içinde izler ve en fazla ilk iki parmağı gesture'a alır; üçüncü ve sonraki pointer'lar kaldırılana kadar yok sayılır. İki pointer pinch başlarken uzaklık, midpoint ve ortak transform snapshot'ı alınır. Her hareket başlangıç transform'una göre pinch zoom'unu ve midpoint'in ekran hareketini birleştirir; sonuç `panBy`/`clampTransform` üzerinden sınırlandırılır ve requestAnimationFrame ile yayınlanır. Pinch pointer'larından biri kalktığında kalan pointer'ın mevcut koordinatı pan tabanı yapılır; tek parmakla pan sırasında ani sıçrama önlenir. Fit seviyesinin üzerindeki touch drag, aynı transform'u pan eder.

Viewport içindeki kısa, 32 CSS px toleranslı çift dokunuş 300 ms içinde eşleşir: fit seviyesinde dokunulan noktaya 2× zoom, yakınlaştırılmış görünümde fit'e dönüş uygulanır. `touch-action: none` yalnız görüntüleme viewport'unda kullanılır. Pointer capture, up/cancel/lost-capture ve unmount temizliği etkileşimi sınırlar.

Mobil Playwright kabul testi `tests/document-studio/image-viewer-mobile.spec.ts` dosyasına eklendi ve `npm run check:dokumantasyon:image-viewer-mobile` komutuyla geçti. Chromium touch emülasyonunda 390×844, 412×915 ve 768×1024 ölçülerinin her birinde pinch-in/out, pinch midpoint hareketi, tek parmakla pan, double tap ve portrait→landscape→portrait fit davranışı denendi. Ek olarak 8× üst sınır, üçüncü pointer'ın yok sayılması, iptal sonrası yeni pan, 768 px tablette iki yatay clamp kenarı doğrulandı.

Chromium CDP `Input.dispatchTouchEvent` sözleşmesi tek bir `touchEnd` çağrısında tüm aktif temas noktalarını bitirir; bu nedenle gerçek CDP touch akışı pinch'ten kalan tek parmağa geçişi tek pointer kaldırma biçiminde üretemez. Bu geçiş için test, React bileşenine sentetik Pointer Events sırası göndererek kalan parmağın yeniden tabanlanmasını ve pan hareketini ayrıca doğrular; pointer capture API'leri yalnız bu sentetik senaryoda no-op yapılır. Fiziksel telefon/tablet testi yapılmadı; mobil sonuçlar emülasyon kapsamındadır.

Mobil testten sonra masaüstü regresyonu `npm run check:dokumantasyon:phase3` (1 test), transform çekirdeği `npm run check:dokumantasyon:image-viewer-transform`, tam TypeScript kontrolü ve hedefli ESLint geçti. Vercel deploy veya uzak Git yazımı yapılmadı.

## Aşama 5 — Responsive toolbar ve erişilebilirlik

Görsel toolbar mobilde 56 px yüksekliğe çıkarıldı; dar ekranda yalnız çözünürlük metni 360 px altında gizlenir. Zoom eksi/yüzde/artı, Sığdır ve ek işlemler kontrollerinin görünür hit alanı en az 44×44 CSS px olur. Sağ/sol padding `safe-area-inset-*` değerlerini dikkate alır. Toolbar boyutu, görüntüleme viewport'undan ayrı kalır; `ResizeObserver` gerçek kullanılabilir alanı ölçer.

Zoom göstergesi tam sayı fit yüzdesini gösterir (100% = sığdır, 200% = fit'in 2 katı) ve erişilebilir adı bu anlamı açıklar. Zoom out minimumda, zoom in maksimumda native disabled olur. Zoom-in/out düğmelerinin adları kullanıcı dilindedir; `aria-pressed` yalnız gerçek toggle komutlarında bulunur. Mevcut focus-visible halkaları korunur, ek işlemler menüsü klavye ile açılıp Escape ile kapanır. Görsel dönüş animasyonu `prefers-reduced-motion: reduce` etkin olduğunda kapatılır. Viewer özel klavye kısayolu eklenmedi; form alanlarına tuş yakalama davranışı yoktur.

Mobil Playwright akışı 320, 390 ve 412 px genişliklerde toolbar taşmasını ve görünür düğme boyutlarını denetler; 390 px public share sayfasında yatay taşma olmadığını da kontrol eder. Zoom kontrollerinin klavyeyle çalışması, Tab focus görünürlüğü, menü Escape davranışı ve reduced-motion CSS tercihi doğrulanır. Test gerçek public paylaşım sayfasından görsel önizleme modalını açıp Escape ile kapatmayı da kapsar. `PublicPreviewModal` Escape kapatmasını sağlar; kodda ayrı bir focus trap bulunmadığından bu aşamada yeni focus trap eklenmedi.

`npm run check:dokumantasyon:image-viewer-mobile` ve güncellenmiş `npm run check:dokumantasyon:phase3` geçti (her biri 1 test). Tam TypeScript ve hedefli ESLint geçti. Safe-area CSS'i Chromium emülasyonunda kontrol edildi; gerçek çentikli cihazda fiziksel ölçüm yapılmadı. Vercel deploy veya uzak Git yazımı yapılmadı.

## Aşama 6 — Resize, görsel yükleme, lifecycle ve performans

Görsel oturumu `imageIdentity` ile anahtarlanır. Dosya/sürüm/paylaşım öğesi değiştiğinde component yeniden kurulur; önceki zoom, pointer map, gesture, ResizeObserver ve rAF state'i yeni görsele taşınmaz. Yükleme state'i ayrıca kaynak URL ve retry numarasıyla etiketlenir. `img.decode()` tamamlandıktan sonra doğal genişlik ve yükseklik pozitif değilse hata gösterilir. Geç gelen eski load/error event'leri ref ile filtrelenir; unmount olmuş viewer'ın decode sonucu da state'i güncellemez. Yeni URL yüklenirken önceki doğal ölçüler frame'de kullanılmaz.

ResizeObserver fit durumunda yeniden fit uygular; zoom durumunda görsel merkezinin viewport merkezine göre farkını koruyup yeni sınırlara clamp eder. Wheel anchor rect'i ölçüm/resize sırasında cache'lenir ve scroll/resize/orientation event'lerinde geçersizleştirilir. Wheel zoom da dahil gesture transform'ları rAF kuyruğunda birleştirilir. Render edilen frame'in zoom/pan hareketi `translate3d` ve `scale` ile yapılır; gesture sırasında `left`, `top`, `width` ve `height` yazılmaz. `will-change: transform` yalnız aktif drag/pinch boyunca ayarlanır. Unmount cleanup bekleyen frame'i iptal edip pointer/gesture/ölçüm state'ini temizler.

Güncellenmiş `npm run check:dokumantasyon:phase3` desktop akışı geçti: 60 RAF adımında sekizer wheel event'i, fit ölçüleri, zoomlu orientation resize, route unmount/reopen ve 900×1400 ikinci görsel açılışı doğrulandı. `npm run check:dokumantasyon:image-viewer-mobile` pinch, pan, double tap ve portrait/landscape akışında geçti. Transform birim testi, tam TypeScript, hedefli ESLint ve `git diff --check` geçti. Testler Chromium üzerinde çalıştı; fiziksel mobil cihaz kullanılmadı. Vercel deploy, commit veya uzak Git yazımı yapılmadı.

## Aşama 7 — Otomatik testler ve regresyon koruması

`tests/dokumantasyon/image-viewer-transform.test.ts`, geçerli ve bozuk ölçüler ile sınır ve sonlu olmayan zoom girişlerinde `MIN_ZOOM ≤ zoom ≤ MAX_ZOOM`, sonlu offset ve sonlu renderScale invariant'larını denetler. Kesirli bir image point için anchor zoom aynı screen coordinate'ını korur; aynı anchor'da 1× → 2× → 1× round-trip başlangıç offset'lerine floating-point toleransı içinde döner.

`tests/document-studio/phase3.spec.ts` gerçek dosya→Document Studio akışında ilk image stream yanıtını bozuk PNG ile değiştirerek hata kartını ve “Tekrar dene” yolunu çalıştırır; ikinci stream'de doğal ölçüleri doğrular. Aynı akış özgün görsel indirmesini, wheel sırasında `window`/document scroll değerlerinin değişmemesini, burst zoom/pan/fit ve dosyayı kapatıp yeniden açınca fit başlangıcını denetler. `tests/document-studio/image-viewer-mobile.spec.ts` yeniden çalıştırılarak pinch-in/out, midpoint, pan, çift dokunma, resize, toolbar ve public preview modalını Escape ile kapatma doğrulandı.

Dosya türü regresyonlarında PDF overflow testi, legacy DXF fallback worker render testi ve APS yapılandırılmadığında DWG'nin kontrollü hata/indirme yolu geçti. PDF testindeki login adımı zaten açık admin oturumunu da kabul edecek şekilde düzeltildi; 44 px sınırı, `pdf-viewer-toolbar` kaynak kodundaki `h-12` yüksekliğiyle uyumlu 48 px üst sınıra çekildi. DWG kontrolü gerçek DWG render servisini değil, yapılandırılmamış APS terminal hata yolunu kapsar. DXF testi render kabulünden geçti; logda CAD font preload istekleri için ayrıca yerel `fetch` uyarısı görüldü.

Önizleme capability registry'sinde video türü veya video uzantısı tanımlı değildir; bu nedenle test edilecek video preview yolu yoktur. Mobil test Chromium CDP touch emülasyonu kullanır; pinch'ten tek parmağa geçiş bileşene gönderilen sentetik Pointer Events ile sınanır. Fiziksel telefon/tablet kullanılmadı.

Son doğrulama komutları: `npm run check:dokumantasyon:image-viewer-transform`, `npm run check:dokumantasyon:phase3`, `npm run check:dokumantasyon:image-viewer-mobile`, PDF overflow için `npx playwright test --config=playwright.config.ts tests/document-studio/stage1.spec.ts --grep "PDF overflow"`, DXF fallback için `npx playwright test --config=playwright.config.ts tests/document-studio/cad-dxf.spec.ts --grep "legacy DXF fallback worker"` ve DWG terminal hata yolu için `npx playwright test --config=playwright.config.ts tests/document-studio/cad-dwg-aps.spec.ts` geçti. Vercel deploy, commit veya uzak Git yazımı yapılmadı.

## Aşama 8 — Yerel final QA ve temizlik

`npm run build` production derlemesi geçti ve 627 statik sayfa üretildi. Build sırasında `src/app/opengraph-image.tsx` içindeki mevcut Satori `zIndex` stilleri için üç desteklenmiyor uyarısı çıktı; derlemeyi engellemedi ve görsel viewer dosyalarından kaynaklanmıyor. `npx tsc -p tsconfig.next.json --noEmit --incremental false`, `npm run check:dokumantasyon:image-viewer-transform`, `git diff --check` ve viewer ile ilgili kaynak/test dosyalarını kapsayan hedefli ESLint temiz geçti. `AGENTS.md` içine Next dev tarafından eklenen geçici yönerge bloğu test sonrası kaldırıldı; dosya tracked içerikle aynı.

`npm run check:dokumantasyon:phase3` hem dev sunucusunda hem build sonrası `PLAYWRIGHT_PRODUCTION_SERVER=1` ile production sunucusunda geçti. Masaüstü akışı 1600×800 yatay, 900×1400 dikey ve 120×80 küçük görseli; hata/tekrar dene/indir; hızlı wheel ve yön değişimleri; toolbar zoom; drag ve pointer capture'ın viewport dışına taşmasını; min/max/fit, döndürme ve orientation resize; dosyayı kapatıp yeniden açma ve 20 kez reopen döngüsünü kapsar. Console/page runtime error assertion'ları temizdi. Hata fixture'ı ilk navigasyondan önce kurulur ve açık kullanıcı retry eylemine dek bozuk yanıt verir; resize kontrolü de sabit zoom değerini değil gerçek frame/viewport merkez hizasını bekler.

Üretim browser ölçümü 20 reopen sırasında `raf=61/1006ms` (yaklaşık 60 FPS), `longTasks=0`, `heapDelta=-7MB`, `layoutDelta=192`, `recalcStyleDelta=662` verdi. Dev sunucusunda aynı test `raf=49/1027ms`, `longTasks=17`, en uzun görev `224ms`, `heapDelta=-14MB`, `layoutDelta=189`, `recalcStyleDelta=773` ölçtü. Bu fark sadece yerel Playwright ve `next dev` koşullarına ait; production browser turunda uzun görev raporlanmadı. `npm run check:dokumantasyon:image-viewer-mobile` 390×844, 412×915, 768×1024 ve ek dar toolbar ölçüsünde geçti; pinch, pinch+pan, çift dokunma, tek parmak pan, toolbar ve yön değişimi Chromium touch emülasyonuyla doğrulandı. Fiziksel cihaz kullanılmadı.

Repo genel lint kapısı temiz sonuç vermedi: `npm run lint`, `.next-*` çıktı/cache klasörlerini tararken kullanışlı çıktı üretmediği için durduruldu; `npx eslint src tests scripts` 279 hata ve 397 uyarıyla mevcut repo genelinde başarısız oldu. Viewer kapsamındaki hedefli ESLint temizdir. `npm ls --depth=0` iki opsiyonel platform paketini (`@emnapi/runtime`, `@img/sharp-wasm32`) extraneous olarak bildirdi; `npm prune --dry-run` değişiklik gerektirmediğini söyledi. Dolayısıyla yerel build, viewer QA ve hedefli kalite kontrolleri geçti; repo genel lint sonucu mevcut borç olarak açık kalıyor. Stage 9 production deploy başlatılmadı; commit veya uzak Git yazımı yapılmadı.
