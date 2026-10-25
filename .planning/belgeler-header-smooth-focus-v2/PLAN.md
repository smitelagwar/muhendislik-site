# BELGELER — Üst Bar, Akıcı PDF Geçişi ve Seçilen Alanı Kesin Merkezleme
## Gemini 3.8 Flash (Medium) için 4 aşamalı, gözden geçirilmiş nihai uygulama planı

**Plan ID:** `BELGE-HEADER-SMOOTH-FIT-FOCUS-CENTER-20261025`  
**Revizyon:** `2.0` — önceki `BELGELER_UST_BAR_SVG_VE_AKICI_SIGDIRMA_4_ASAMALI_PLAN.md` planının **yerine geçer**; önceki plandaki koruma kuralları kaybolmaz.  
**Planlama tarihi / saat dilimi:** 25.10.2026 — `Europe/Istanbul`  
**Plan durumu:** `PLAN_HAZIR`. **Uygulama durumu:** uygulayıcı yerelde tespit edecek; daha önce kodlanmış aşamaları kanıt olmadan `BASLAMADI`ya veya `TAMAMLANDI`ya döndürme.  
**Hedef:** Windows yerel projesinde çalışan **Gemini 3.8 Flash**, **Medium** thinking. Model kimliği resmî Google dokümanında `gemini-3.8-flash` ve `low/medium/high` seviyeleriyle yer alıyor; kullanılan IDE oturumundaki gerçek seçimi ayrıca kontrol et.  
**Repo:** https://github.com/smitelagwar/muhendislik-site  
**Öncelikli canlı rota:** https://muhendislik-site.vercel.app/belgeler/santiye-sefi-taahhutnamesi  
**Görev türü:** Mevcut çalışan **Belgeler / PDF stüdyosu** sisteminin UX ve koordinat/animasyon iyileştirmesi. **PDF üretim motorunu değiştirme görevi değildir.**

---

## 0. Mutlaka okunacak kullanıcı isteği

Bu planın üç birbirine bağlı amacı vardır:

1. **Üst bar:** Kullanıcının PDFgear referansına benzer şekilde uygun büyüklükte SVG ikonları **üstte**, kısa açıklama metinlerini **altta** göster. Yeni sekme ve PDF'ye odaklan dâhil işlevsel eylemler görsel bakımdan aynı aileye ait olsun. Bunu belge stüdyosu için ideal ölçülerde, rahat, ölçülü ve mevcut masaüstü alanını gereksiz tüketmeden yap. Merkezdeki `− | %zoom | +` grubu yatay yerinden kaymamalı.
2. **Sığdırma:** `Sığdır` ve `Genişliğe Sığdır` düğmeleri arasındaki PDF görüntüsü `snap`/sert zıplama yerine akıcı hareket etsin. PDF.js yeniden rasterize olduğunda beyaz flaş, ikinci zıplama, bulanıklığın kalıcılaşması veya PDF hotspot sapması olmasın.
3. **YENİ — seçili PDF alanı her zaman ortalansın:** Sol formda ör. **İmza Alanı Unvanı** seçilince PDF'nin karşılık gelen alanı *zaten ekranda olsa dahi* belgenin **görüntüleme paneli (scrollport) merkezine** taşınsın. %100, %255, %278, %400 ve ara değerler dâhil **mevcut yakınlaştırma oranı değişmesin**. Dikey **ve** yatay yönde kontrollü kaydırma kullanılsın. Alan yalnızca vurgulanıp kenarda bırakılmasın; mümkünse tam ortaya gelsin. Fiziksel kaydırma sınırı yeterli değilse, PDF boyutunu değiştirmeden yalnız odaklama işlemi için gerekli **geçici boş kaydırma mesafesi** yaratılarak merkeze gerçekten ulaşılabilsin.

**Önemli hedef cümlesi:** *"Hangi doldurulabilir alanı seçersem seçeyim, mevcut zoom korunarak PDF önizleme alanının tam ortasında olmasını istiyorum."* Merkez, tüm tarayıcı penceresi veya sol form değil, **sağ PDF panelinin görünür içerik alanının merkezi**dir. Formdan/toolbar'dan yer çalınmaz.

### Ekran görüntülerinin doğru okunması

- **Yeni görsel 1:** `%255` zoom civarında `İmza Alanı Unvanı` vurgulanıyor fakat zaten ekranda olduğu için PDF kaymıyor — **istenmeyen durum**.
- **Yeni görsel 2:** `%278` civarında aşağı kaydırılmış PDF'de alt bölüm görünür; kullanıcı merkezlemeye benzer sonucu elle sağlamış — **otomatik olmalı**.
- **Yeni görsel 3:** `%400` zoom'da hem dikey hem yatay taşma mevcut; ör. `Yapı Adresi` gibi geniş alanlar seçildiğinde ilgili alanın **dikdörtgen merkezi**, görünür sağ panelin merkezine taşınmalı; uzun kutunun tamamının görünmesi zorunlu değil, **ölçeği asla düşürme**.
- **Önceki referanslar:** Mevcut yatay üst bar ve PDFgear'ın üstte büyük ikon/altta etiket düzeni. Referans görüntü bir taklit hedefi değil, kullanılabilirlik yönü gösterir.

---

## 1. Önceki v1 planın eleştirisi — düzeltilen zayıflıklar

| V1 sorunu / eksik | V2 kararı ve ölçülebilir çözüm |
|---|---|
| **Alan odaklama ayrı bir davranış gibi ele alınmamıştı.** | Ayrı **ASAMA_03**: mevcut `performReveal()` görünürlük yerine deterministik merkez hesabı yapacak. |
| Yalnız `scrollIntoView` / `scrollBy(smooth)` yetebilir sanılabilirdi. | **Yetersiz:** alan görünürse eski fonksiyon erken dönüyor; uçlarda fiziksel scroll sınırı var. Doğrudan merkez koordinatı + gerektiğinde geçici scroll boşluğu zorunlu. |
| Fit animasyonu ve alan odaklama aynı anda başlarsa yarış çıkabilir. | İki işlemin **tek scroll sahibi** olacak; fit/zoom, field-focus, elle pan/wheel, sayfa değişimi için açık öncelik/iptal sözleşmesi. |
| V1'de “hotspot aynı anda ölçeklensin” ilkesi doğru fakat canvas'ın ayrı transform'u ve `renderedToken` kapılarıyla entegrasyon yetersiz belirgindi. | Geçici görsel ölçek ve gerçek PDF raster devri ayrı tanımlandı; overlay hit test'i yalnız koordinat güncelken açık. |
| Ekranda ara kare görünse bile sonuçta PDF zıplayabilir. | **Başlangıç–ara–bitiş** konum/ölçek karşılaştırması, son raster devir anında `< 2px` görsel fark hedefi; stale render kontrollü. |
| Merkez zoom grubu uzun araç etiketlerinde yatay kayabilir. | Başlığın sol ve sağ gerçek genişlikleri test edilecek; yeterli alan yoksa ikincil eylemler menüye inecek, merkez grubu çakışmayacak. |
| Orijinal planın 3. aşaması genel responsive testlerine ayrılmıştı. | Responsive testleri ve yayını **ASAMA_04**'e alarak bir aşamayı doğrudan kullanıcının yeni ana ihtiyacına ayırdım. |
| “Sığdır” sırasında `%100` ve `Genişliğe Sığdır` mod geçişinde odak/pan pozisyonu belirsizdi. | Fit komutu görünümü yönetir, **kendi hedefi** uygulanır. Yeni form alanı seçimi sonradan gelirse, zoom sabitlenince merkeze götürülür. Kullanıcı manuel pan/zoom yaparsa merkezleme ona karşı mücadele etmez. |
| Yeni davranışın etkileşim ayrıntıları testle sabit değildi. | %50/%100/%255/%278/%400, ilk/son satır, en sağ/sol kutu, aynı alanı tekrar seçme, çok sayfa, modal, pinch, klavye, reduced-motion, uzun textarea test matrisi. |

**Öncelik sıralaması:** (1) kullanıcı verisi ve PDF doğruluğu, (2) tıklama/hotspot geometrisi, (3) odak merkezlemesinin matematiksel doğruluğu, (4) animasyon estetiği, (5) mikro süslemeler. İyi görünmek için doğru çalışan bir sistemi bozmak yasak.

---

## 2. Kaynak araştırması ve gerçek mimari

### 2.1 Doğrulananlar

GitHub `main` son incelenen SHA: `b5a7c5ab2eec417b61457b543e77e2f43766462b` (25.10.2026, commit: `feat(belgeler): pdf onizlemesine genislige sigdir butonu eklendi`). Aşağıdaki dosyaların içeriği GitHub üzerinden incelendi:

- `PROJECT.md`, `AGENTS.md`, `GEMINI.md`, `.agents/rules/belgeler-kurallari.md`, `.agents/rules/test-ve-otomasyon-standardi.md`.
- `src/components/belge-studio-unified-header.tsx`: ortak masaüstü `lg:h-16` header; zoom toolbar `createPortal` ile orta slotta. Mobil özel başlık/çekmece.
- `src/components/belge-studio-preview-toolbar.tsx`: `Sığdır`, `Genişliğe Sığdır`, yeni sekme, odak; 17px civarı SVG ve yatay metin; zoom merkezi ayrı sütun.
- `src/components/belge-studio-icons.tsx`: mevcut SVG ikon bileşenleri (fit-page, fit-width, zoom, external, focus vb.).
- `src/components/belge-studio-pdf-preview.tsx`: `handleFit`, `handleFitWidth`, `renderPage`, buffer canvas, render/revision token, `fieldFocusRects`, `performReveal`, `pendingRevealRectRef`, `lastRevealedEventIdRef`, sayfa ve mobil kontrol yolları.
- `src/lib/belge-studio-zoom.ts`: fit width hesaplaması, %50–%400 zoom sınırları, raster limitleri ve scroll anchor hesapları.
- `src/lib/belge-field-focus.ts`, `src/hooks/use-belge-field-focus.ts`: PDF alanları için **normalize [0..1]** geometri; `focusEventId` gerçek yeni odakta artıyor; aynı odaklı alana yeniden tıklamak yeni olay oluşturmuyor; kullanıcı yazdıkça zıplamayı engelliyor.
- `src/app/globals.css`, `src/lib/belge-studio-layout.ts`: `.belge-preview-surface` ve `.belge-preview-frame` grid/centering/scroll düzeni; müdahale bu scope'ta kalmalı.
- `tests/site-audit/belgeler-field-focus-regressions.spec.ts` ve mevcut `tests/belgeler/*`, `tests/site-audit/belgeler-unified-header-*.spec.ts`, `belgeler-pdf-focus-mode.spec.ts` vb. var.

**Somut kök neden:** `performReveal()` alanın ve scrollport'un dikdörtgenlerini `getInlineFieldRevealDelta(...)` ile karşılaştırıyor ve `dx === 0 && dy === 0` ise hiçbir şey yapmadan dönüyor. Bu yöntem **“alan görünür olsun”** içindir; **“alanı merkeze getir”** değildir. Kullanıcının 1. ekran görüntüsündeki davranış koddaki bu kararın doğrudan sonucudur. `renderPage` içinde pending-focus, yalnız geçerli PDF/render token ve ilgili `focusEventId` eşleşince açılıyor; bu güvenlik korunmalı.

**Diğer önemli gerçekler:**

- `.belge-preview-surface` `grid`, `width:max-content`, `min-width:100%`, `place-items:center`, `padding:8px` kullanıyor. `.belge-preview-frame` sayfayı içeriyor ve `margin:auto`. Bu yüzden sadece `scrollLeft = target` hesaplamak **her zaman** yeterli değil; merkezleme için hiç scroll alanı olmayabilir.
- PDF tuvali, alan vurgusu ve inline edit katmanı aynı `frame` altında. `canvas.style.transform` ile geçici zoom, üst katmanların koordinatları güncellenmeden kalırsa sapma riski doğuyor.
- Mevcut hotspot aktivasyonu `renderedToken`, `canvasTransformNone` ve `localStatus` gibi kontrollerle sınırlandırılmış. Bu koruma **kaldırılmamalı**.
- `useBelgeFieldFocus` tekilleştirmesi sayesinde her harfe basışta yeni merkezleme yapılmıyor. **Bunu koru.** İstenen yeni odak veya tekrar-seçim eylemidir, metin her değiştiğinde scroll animasyonu değildir.

### 2.2 Varsayımlar ve yerelde doğrulanacaklar

- **Varsayım:** İyileştirme bütün **beş** belge stüdyosuna ortak bileşen üzerinden uygulanır; salt-okunur paylaşım görüntüleyicisi kapsam dışıdır.
- **Yerelde doğrula:** Çalışma ağacı HEAD'i, eski planın uygulandıysa hangi aşamalara kadar işlendiği, mevcut değişiklikler, test tabanı, yeni üst bar çalışması veya sonradan eklenmiş focus/zoom değişiklikleri. Kullanıcının ekran görüntüsündeki %255/%278/%400 durumları doğrudan canlı yürütme kanıtı yerine **gözlenen kullanıcı örneği** olarak kullanılsın.
- **Yerelde doğrula:** `docs/BELGELER_SISTEMI.md`, `.agents/rules/ecc-kurallari.md`, diğer görevle ilgili kurallar, gerçek test seçicileri, cihaz/dpi ve mevcut geçerli modlar.
- **Kapsam sınırı:** Planlama sırasında **repo dosyası yazılmadı, test çalıştırılmadı, production deploy yapılmadı**. Bu belgede yazan uygulama/test sonuçları hedeflerdir, yapılmış işler değildir.

### 2.3 Kaynaklar

- Repo: https://github.com/smitelagwar/muhendislik-site
- İncelenen odak kodu: https://github.com/smitelagwar/muhendislik-site/blob/main/src/components/belge-studio-pdf-preview.tsx
- Fit hesapları: https://github.com/smitelagwar/muhendislik-site/blob/main/src/lib/belge-studio-zoom.ts
- Form odak sözleşmesi: https://github.com/smitelagwar/muhendislik-site/blob/main/src/lib/belge-field-focus.ts
- Google Gemini modeli: https://ai.google.dev/gemini-api/docs/models/gemini-3.8-flash
- Google thinking seviyeleri: https://ai.google.dev/gemini-api/docs/thinking
- `Element.scrollTo()` API: https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollTo

---

## 3. Değiştirilemez koruma sözleşmesi

1. **Zoom sabitliği:** Alan seçimi, merkeze alma, vurgulama **asla** `setZoomLevel`, `zoomRef.current`, `setFitMode` veya PDF'ye yeniden render talimatı veremez. Odaklamanın tek görsel eylemi **scroll** (ve gerekirse scroll mesafesi için çevresel padding) olacak. `%255` seçilmeden önce/sonra `%255`; `%400` da `%400`.
2. **Sadece sağ panel:** `window.scrollTo`, tüm stüdyo köküne `scrollIntoView`, sol form scroll pozisyonuna müdahale, browser zoom veya tüm sayfaya CSS scale **yok**. Kullanıcının sol form girişi aynı kalacak.
3. **PDF doğruluğu:** `src/lib/pdf-engine.ts`, fontlar, alan değerleri, form şablonları, çıktı PDF kalitesi/flatten/paylaşım sözleşmesi, taslak ve kullanıcı içerikleri değişmeyecek.
4. **Hotspot uyumu:** PDF üzerindeki input vurguları ve inline edit kutuları gerçek PDF koordinatına sadık kalacak; sayfa dışı boş padding **normalleştirilmiş PDF geometry'ye eklenmeyecek**.
5. **Eşzamanlılık:** Her animasyonun token/iptal mantığı olacak; eski seçim, eski sayfa, eski PDF revizyonu yeni odak veya fit isteğini geri alamayacak.
6. **İstenmeyen hareket yok:** Yazarken her keypress veya autosave sonrası zıplama yok; kullanıcı elle sürükler, wheel yapar, pinch yapar veya sayfa değiştirirse programatik odak scroll'u bırakır. Yeni field click/focus olayı bir sonraki merkezlemeyi başlatabilir.
7. **Erişilebilirlik:** `prefers-reduced-motion: reduce` altında doğru merkeze **anında** geç. Klavye odağı korunur. Focus ring, ekran okuyucu etiketleri, visible/error feedback bozulmaz.
8. **Kaynak ekonomisi:** Yeni zoom kütüphanesi, animation dependency, PDF render sistemi değişimi, background task/deploy döngüsü yok.
9. **Yayın:** İlk 3 aşama **yerel**. 4. aşama gerekli kalite kapısı geçildikten sonra mevcut yerel geliştirme standardına uygun tek meaningfull commit + `main` push ve Vercel production doğrulaması. Başka kullanıcının çalışmasını ezme.

---

## 4. Kesin tasarım kararları

### 4.1 Masaüstü üst bar

- Bilinen desktop eylemler (`Sığdır`, `Genişliğe Sığdır`, `Yeni Sekme`, `PDF'ye Odaklan` / `Formu Göster`) için **SVG üstte, metin altta**. SVG ~22–24px, görünür etiket 11–12px. Ana eylemler 44px'den küçük tıklama yüzeyi taşımayacak; toplam masaüstü bar yüksekliği yaklaşık 76–82px'i geçmesin, dar ekranlarda uyarlansın.
- **Zoom ayrı** simetrik merkez biriminde (`−  %...  +`); zoom grubunun *görünür panel/header koordinatına göre* x merkezi stabil. Hata/taslak badge uzunluğunda kayma yok.
- `Genişliğe Sığdır` metni gerekirse kontrollü iki satır, diğerlerini ezmeden; buton etiketleri tek baseline. `Yeni Sekme` ikonunun altında da kısa isim bulunur.
- Koyu/açık tema ve mevcut amber vurgusu; `fitMode` aktifliği `aria-pressed`, hover, focus ring. PDFgear'ı birebir kopyalama. Mobil header yüksekliği, çekmece ve zoom pill korunur.
- Yalnız göreve özel CSS selector'ları; global `button`, `svg`, `header` veya `canvas` kuralını değiştirme.

### 4.2 Fit/width-fit animasyonu

- Tek `startFitTransition(mode)` koordinatörü: `page` hedefi mevcut %100 fit davranışı, `width` hedefi mevcut `calculateBelgeFitWidthZoom(...)`. Kullanılan yüzde **mutlak yüzde**, yalnız görsel ara-frame interpolation ve raster isteği son hedefe göre çalışır.
- 220–280ms (varsayılan **240ms**) `ease-in-out`, overshoot yok. Mevcut bitmap'ten başlanır; ağır PDF.js render **her animasyon karesinde değil, hedefte**; hedef raster hazır olunca aynı görsel ölçüde swap; eski çizim sonradan üstte belirmez.
- Yalnız `canvas`ı değil, render sırasında bağıntılı frame/overlay geometrisini de hesaba al. İhtiyaç varsa küçük görsel iç katman eklenir fakat DOM ref ve hit test güvenliği korunur. Güncel olmayan interaktif overlay kısa süre pasif olabilir; animasyon biter bitmez geri açılır.
- Geçiş sırasında ve sonunda çevresel **focus padding** ile çatışma varsa fit komutu önce focus-scroll sahibini iptal eder, ek scroll mesafesini güvenle sıfırlar veya yeni fit geometrisine uyarlar; genişliğe sığdır modunda yatay scrollbar çıkmaz.

### 4.3 **Yeni ana karar: iki eksende tam merkezli form alanı navigasyonu**

**Görsel hedef:** Seçilen alanın (PDF koordinatlarındaki normalize dikdörtgenin) **geometrik merkez noktası**, sağ önizleme scrollport'unun *gerçek içerik merkezine* taşınacak. Form alanının vurgusu hareket bitince de doğru yerde kalır. Zoom'a dokunulmaz.

**Hesap algoritması** (`rect.left/top/width/height` PDF sayfasına normalize):

```ts
// scrollOwner = sağ PDF'nin gerçek scroll container'ı (containerRef)
// frame = gerçek PDF sayfa frame'i (frameRef)
// Her seçimde GEÇERLİ sayfa + geçerli render ölçüleriyle ölç.
const vr = scrollOwner.getBoundingClientRect();
const fr = frame.getBoundingClientRect();
const cxField = fr.left + (rect.left + rect.width / 2) * fr.width;
const cyField = fr.top  + (rect.top  + rect.height / 2) * fr.height;
const cxViewport = vr.left + scrollOwner.clientLeft + scrollOwner.clientWidth / 2;
const cyViewport = vr.top + scrollOwner.clientTop + scrollOwner.clientHeight / 2;
const desiredLeft = scrollOwner.scrollLeft + (cxField - cxViewport);
const desiredTop  = scrollOwner.scrollTop  + (cyField - cyViewport);
// Ardından fiziksel scroll aralığı ve gerekiyorsa focus-only ekstra alanı yönet.
```

**Gerekli üç önemli kural:**

1. **Görünürlük erken çıkışı YASAK:** Alan zaten ekranda görünse bile `getInlineFieldRevealDelta()` davranışındaki `dx===0 && dy===0 => return` merkezi hedef yerine geçmez. Merkez farkı küçükse (örn. `<= 2px`) no-op; değilse merkezle.
2. **Zoom değişmez:** `zoomLevel`, `fitMode`, `page` ve PDF revision yalnız seçimden ötürü değişmez. Yeni sayfaya ait alan seçilirse **yalnız gerekli sayfa navigasyonu** yapılır; ilgili sayfa gerçekten render/geometry-ready olduktan sonra merkezle.
3. **Scroll sınırı çözülür:** PDF sayfası kenarı yakınsa veya %100'de sayfa viewport'tan küçükse, normal `scrollTop`/`scrollLeft` aralığı gerçek merkezi imkânsız kılabilir. Bu durumda **PDF'yi küçültmek veya PDF geometrisini değiştirmek yerine**, sadece sağ PDF'nin scroll-content/surface katmanına geçici, görünmez olmayan fakat zararsız **boş kaydırma çevresi** sağla. Örneğin `focus-centering` modunda hesaplanan minimum güvenli `padding-inline` / `padding-block` veya eşdeğer scroll spacer'larıyla ilk ve son satırın, sol/sağ en uç alanın merkezlenmesine izin ver. Bu ekstra alan *PDF sınırları ve hotspot koordinat sisteminin dışında* kalmalı; scrollbar geometrisi ve frame hizası doğru korunmalı.

**Padding yaklaşımında zorunlu detay:**

- Gerçek CSS düzene bak: `surface(grid, max-content, min-width:100%)` ve `frame(margin:auto)` nedeniyle padding değiştirmek PDF'yi kaydırabilir. Dolayısıyla **(a)** önceki frame konumu + scroll'u ölç, **(b)** yalnız gerekli focus scroll alanını koy, **(c)** yeni frame konumuna göre scroll'u **aynı frame içinde anlık kompanse ederek** görüntünün zıplamasını engelle, **(d)** layout oturduktan sonra geçerli konumu *yeniden ölçüp* hedef scroll'u animasyonla uygula. İki aşamalı layout okuması kabul edilebilir ama animasyonun her karesinde sürekli layout okumak yok. `overflow-anchor` veya `scroll-behavior` CSS çakışmalarına dikkat et.
- Tek basit ve yeterli çözüm isteniyor: **Focus-active** iken her eksende yaklaşık `viewportSize / 2` kadar dış scroll mesafesi, sayfanın köşesindeki **alan merkezi** için bile yeterlidir. Ancak bu yaklaşımı kör biçimde genel `padding:50%` ile yapma; `%` CSS hesaplama referansı şaşabilir. **Ölçülen CSS piksel değeriyle** ve *yalnız gerekli yönde* uygulamak, gerekirse eşdeğer dengeleme kullanmak tercih edilir. Geçici boşluk hiçbir zaman baskı/PDF output'una yansımaz. Dar mobilde alt sheet kapladığı gerçek viewport doğru hesaplanır.
- PDF küçültüldüğünde sayfa viewport'tan küçük olabilir; bu durumda merkezleme için page frame'in kenarında gerekirse görünür boşluk olması **bilinçli** ve kabul edilebilir. Kaydırma sonrası alan merkezi gerçek scrollport merkezinde olmalıdır.
- Alan genişliği viewport'tan büyükse kutunun tamamı sığmayabilir; **geometrik merkez** hedeflenir. Hiçbir koşulda “kutuyu sığdır” amaçlı zoom ayarı yapılmaz.
- Etkileşim tamamlanınca boş alanın yaşam döngüsü yönetilir: yeni seçim yeniden kullanabilir; açık seçim kaldırıldığında/fit/page değişiminde cleanup olur. **Cleanup da** görüntünün aniden başka yere atlamasına yol açmamalı; mümkün olan okuma konumunu koruyacak anchor/scroll kompanse et; erişilemeyen fiziksel koordinatta kalan konum sınırına en az değişimle dön.

**Scroll animasyonu tercihi:** Tek `scrollTo({left: target, top: target, behavior: reduceMotion ? 'instant' : 'smooth'})` çağrısı, modern tarayıcıda iki ekseni birlikte yönetecek basit yoldur. Native `smooth` davranışı test edilen tarayıcıda süre kontrolünü veya yeni seçim iptalini yeterince sağlamıyorsa **yalnız bu scope'ta**, istek kimliğiyle yönetilen `requestAnimationFrame` 250–360ms `ease-out` XY animasyonu kullan. İki ayrı aynı anda scroll animatörü kurma. Kullanıcı müdahalesinde son kalan animasyon frame'i eski hedefe zorla geri dönmeyecek. Reduced-motion 'da süre = 0.

**Seçim/odak olay sözleşmesi:**

- Normal `focusEventId` yeni alana odaklanıldığında çalışır. **Yazı yazarken her tuşta merkezleme kesinlikle yok.**
- Aynı seçili input’a *yeniden bilinçli tıklama* yapılınca merkeze geri dönme isteği için mevcut `useBelgeFieldFocus` reducer'ını keypress üzerinde zorlamadan, gerektiğinde `onPointerDownCapture` (ve klavye erişimi için gerçek tekrar-aktivasyon) ile **ayrı `centerRequestId`** veya eşdeğer dar kapsamlı sinyal tasarla. Aynı inputun sırf re-render yüzünden tekrar merkezlenmesi yasak.
- Aynı alana tıkla ve başka bir alana tıkla eylemleri, mobil form sekme navigasyonu, Page 1→2 alanı seçimi desteklensin. Sayfa yüklenmemişse **pending intent** doğru `documentId + fieldKey + page + focusEventId/centerRequestId + PDF revision` ile bekletilsin; render tamamlandığında stale ise at.
- Geometrisi **gerçekten bulunamayan** veya belirsiz/çift annotation içeren alan için hayalî PDF konumu uydurma. Mevcut güvenli uyarı/vurgu-yok davranışını koru; nedeni test/raporda belirt. Gerçekte PDF üzerinde doldurulabilir ve doğru eşleştirilmiş tüm alanlar merkezleme kabul kapsamındadır.
- PDF üzerinde doğrudan inline düzenleme açıldığında **alanı seçmek** mevcut edit popover/alt-sheet tasarımını bozmamalı. Varsayılan olarak sol form input seçiminden doğan merkezleme uygulanır; sağ PDF üstündeki hotspot'u tıklamak sırf bu özellik için beklenmedik yatay/dikey pan başlatmaz (gerekirse ayrı ve test edilmiş kural). Mobil sheet'teki `reveal` eski **görünür kılma** semantiğini korur; klavye üstüne alanı kaydırmak için mevcut `getInlineFieldRevealDelta` hâlâ kullanılabilir. Bir yöntemi bütün odak/keyboard akışlarına körce yayma.

**Koordinat ve yarış güvenliği:**

- Tek bir scroll owner olsun. **Yeni form alanı seçimi**, önceki programatik center hareketini iptal ederek yeni hedefe gider. `scroll` olayı hem kod hem kullanıcı kaynaklı olabildiğinden yalnız `scroll` event gelmesini manuel iptal sayma; `wheel`/`pointerdown`/`touchstart`/`keydown` gibi gerçek kullanıcı niyetini ayır. Aynı fiziksel tıklamanın hem `focusEventId` hem tekrar-aktivasyon sinyali üretmesi halinde tek merkezleme isteğine **dedupe** et. **Manuel pan/touch/tekerlek/scrollbar sürükleme** programatik hareketi iptal eder; animasyon bitmiş olsa da kullanıcı hareketine karşı otomatik geri çekme yok.
- **Fit/width-fit veya manual zoom:** Devam eden merkezleme animasyonunu durdur; zoom değişiminin kendi anchor sözleşmesini uygula. Kullanıcı zoom'u bitirdikten sonra alan *yeniden* seçilirse yeni zoomda merkeze git. Kullanıcı aktif alanı seçtiği anda fit hâlâ sürüyorsa, fit'in son geçerli geometrisi hazır olur olmaz **en yeni** field intent'ini merkeze uygula; eski frame ölçüsüyle hareket etme.
- **Yeni sayfa, PDF revision, modal unmount, form reset/clear, Escape, mobil sheet açılıp kapanması, orientation/resize**: geçersiz pending hareketleri temizle; gerekirse en yeni geçerli seçim için bir kez merkez hesapla. `ResizeObserver` üzerinden sonsuz padding↔scrollbar döngüsü yok.
- **Vurgu koordinatlarının doğruluğu**: mevcut `fieldFocusRects` normalize sayfa koordinatları, `BelgeStudioFieldFocusLayer`, `BelgeStudioInlineEditLayer` ve `renderedToken` kontratı korunur. Boş çevresel padding PDF frame içine eklenmez. Render revision/pinching sırasında sahte/yanlış highlight yok.

---

## 5. Dört aşama ve teslim ölçütleri

| Aşama | Hedef | Somut tamamlanma kanıtı |
|---|---|---|
| **ASAMA_01** | Güncel durumu/önceki plan ilerlemesini denetle + SVG ikon üst/etiket alt header | Ortak üst bar ekran görüntüsü, zoom merkez ölçümü, beş stüdyo ve mobil regresyon |
| **ASAMA_02** | Kesintisiz `Sığdır` / `Genişliğe Sığdır` animasyonu | %255→fit→width→fit hızlı zincirde tek akış, PDF/overlay doğru, mevcut kalite kapıları |
| **ASAMA_03** | **Yeni:** Alanı zoom değiştirmeden PDF panelinde **her zaman XY merkeze** getir | Görünür alan, %400, uç köşeler, başka sayfa; ±8px hedef, scroll boşluğu, iptal kuralları |
| **ASAMA_04** | Responsive/a11y/perf, tüm 5 stüdyo regresyon, tek kontrollü yayın | Test kanıtları; yalnız hepsi geçerse tek atomic push, Vercel Ready, canlı smoke |

---

## ASAMA_01 — Gerçek baseline + profesyonel üst bar

**Amaç:** Mevcut geliştirmeyi bozmadan PDFgear esinli kompakt fakat belirgin SVG dikey araç düzenini kur; yeni merkezleme ihtiyacını test edilebilir gereksinim olarak kaydet. Bu aşamada focus algoritmasını veya PDF render zincirini yeniden yazma.

**Giriş:** `PROJECT.md` → `AGENTS.md` → `GEMINI.md` → `.agents/rules/belgeler-kurallari.md`, `test-ve-otomasyon-standardi.md`, `ecc-kurallari.md` (GEMINI/ECC aktiflik kuralına göre) → ilgili `docs/BELGELER_SISTEMI.md` ve gerçek kaynak. `git status --short`, `git rev-parse HEAD`, branch, önceki plan/state okunur. Yerel kod v1'deki HEAD'den ileriyse yürürlükteki gerçek kod baz alınır; eski planın uygulanmış kısımları gereksiz yere yeniden yazılmaz.

**Kapsam (mevcut dosyalar):** `src/components/belge-studio-unified-header.tsx`, `belge-studio-preview-toolbar.tsx`, `belge-studio-icons.tsx`, `src/app/globals.css`, `src/lib/belge-studio-layout.ts` (gerekliyse), mevcut header testleri. Diğer 4 stüdyo aynı ortak toolbar'dan etkilenir; her birine kopya toolbar oluşturma.

**Uygulama sırası:**

1. Masaüstü ve mobil baseline screenshot/ölçü: 1366×768, 1920×1080, 390×844. Yerelde fit butonları ve %400 yakınlaştırma, form `İmza Alanı Unvanı` tıklaması kaydedilir. Test edilemeyen kısım açıkça not edilir.
2. Mevcut `BelgeFitPageIcon`, `BelgeFitWidthIcon`, `BelgeOpenExternalIcon`, `BelgePdfFocus*`, `BelgeZoom*` SVG'lerini tek optik dilde normalize et; `viewBox`/stroke/currentColor/DOM boyutu. Her komut için 22–24px ikon (dar bar sınırlı), altında kısa etiket. `Yeni Sekme` ve odak eyleminin de görünür metni olmalı.
3. Ortak `preview-tool-button` sadece stüdyo toolbar'ında, erişilebilir ve tıklanabilir. Etiketler biçim olarak eş; hover/pressed/focus durumunda layout değişmez. Aktif fit modu doğru `aria-pressed` durumuna sahiptir; `fitMode === 'page'` iken `%100` kontrolü mevcut sözleşmeye göre doğru ayrıştırılır.
4. Zoom grubunun gerçek x-merkezini (header/preview kontrol referansına göre) ölç; sol belge başlığı uzadığında, sağda hata/taslak görünürken ve dar 1024px'te kaymasını/üst üste binmesini engelle. Öncelik sırası: zoom merkezi → asıl fit kontrolleri → yeni sekme/odak gibi ikincil eylemler menüde. Mobil çekmecesi ve mobil zoom pill hiç bozulmaz.
5. Bar yüksekliği laptopta PDF alanını gereksiz daraltmasın; desktop 76–82px üst limit hedefi, 1024/1280 breakpoint tasarımı esnek. Bütün komutlarda klavye focus halkası ve en az 44px etkileşim alanı.
6. Yalnız ilgili header testlerini ve CSS görsel kontrolünü çalıştır. Önceki planın 1. aşaması zaten uygulanıp başarı kanıtı varsa **diff ve kontrollerle teyit et**, aynı işi yeniden yazma; revizyon state'e gerekçeli biçimde kaydet.

**Kabul:** 5 belge stüdyosunda tasarım doğru; 1366 ve 1920'de ikon üst/etiket alt; zoom gözle/ölçümle ortalı (±2px hedef); mobilde taşma yok; PDF/form davranışı aynı. `ASAMA_02` başlamadan **dur**.

**Hata/geri dönüş:** Responsive çakışmada yanlış global CSS'i büyütmek yerine scoped sınıfı geri al/uyarla; ilgisiz CSS, PDF motoru, taslak koduna dokunma. Engelde `ENGELLI` durum kaydet.

---

## ASAMA_02 — Fit animasyonu, bitmap devir ve koordinat koruma

**Amaç:** Fit düğmeleri gerçekten **yumuşak tek hareket** oluştursun; son raster değişimi görünmeden tamamlansın.

**Giriş:** ASAMA_01 kabul edildi (ya da eşdeğer önceki yerel uygulama/testleri kanıtlandı). Fit handler baseline kaydedildi.

**Kapsam:** `belge-studio-pdf-preview.tsx`, `belge-studio-zoom.ts`, gerektiğinde **yeni** küçük bir `use-belge-fit-transition.ts`, sadece scoped CSS ve testler. **`pdf-engine.ts`, pdfjs worker değiştirilmez.**

**Uygulama sırası:**

1. `handleFit`/`handleFitWidth` için ortak komut; nihai zoom/fit hesapları aynen korunur (`Sığdır` %100; `width` mevcut hesap). `fitMode`, scroll owner, raster token ve mevcut render state ile çalışır. Aynı hedefte gereksiz raster tekrar yok.
2. Mevcut PDF bitmap'i görünür tutulur; ~240ms ease-in-out transform geçişi yapılır. **Her frame PDF.js render etme, React render/DOM ölçüsü spam yapma.** Gerekliyse görünür katmanın ref'i güvenli biçimde ayrılır; `frame` içindeki vurgu/inline edit asla farklı koordinata terk edilmez.
3. PDF.js buffer hedef zoom rasterini hazırlayınca token/revision ve en son talep doğrulanır; görsel olarak aynı boyut/konumda swap; geçici transform temizlenir. `renderPage` içindeki 90ms delay geçişin ortasında aniden bitmap değiştirmemeli. Render başarısızsa doğru eski resim/hata yolu; beyaz boş bırakma yok.
4. Scroll pozisyonu animasyonla tutarlı: fit-page sayfanın bütünü için doğal pozisyonuna; fit-width okunmakta olan PDF bölgesinin bağıl merkezini mümkün olduğunca korur. Yatay taşma asla oluşmamalı. Daha önce focus padding varsa komutun hedefi ile çakışmayacak şekilde anchor koruyarak temizle/yeniden ayarla.
5. Fit → fit, fit → manuel +/- / Ctrl+wheel, fit → pinch, fit → page change, fit → veri revizyonu senaryolarında eski RAF/render iptal. Son seçilen komut kazanır; event listener/timer leak yok. `prefers-reduced-motion` için doğrudan doğru nihai hedef.
6. Mevcut kaliteli vurgular ve inline düzenleme koordinatlarını koru. Animasyon sırasında geometri geçici güncel değilse hotspot hit test'i kapalı olur, sonunda açılır. Beş belge PDF şablonu aynı davranışı kullanır.

**Test / kabul:** `%255 → Sığdır → Genişliğe Sığdır` ve hızlı tersleri; `%400 → Sığdır`, en-boy değişimi, 50/100/400 sınırı, mobile menüden fit. En az başlangıç/ara/son kare veya kısa video karşılaştırması. Bitişte son raster devir görselinde beklenmeyen >2px konum sıçraması yok; metin net; tüm hotspotlar doğru. `npx tsc --noEmit --incremental false` + dar kapsam lint/unit/Playwright. Başarısızsa akıcı animasyon özelliğini güvenle devre dışı bırak, çalışan eski fit'i koru; aşamayı tamamlandı ilan etme. **ASAMA_03 öncesinde dur.**

---

## ASAMA_03 — Yeni özellik: Alanı mevcut zoom'da XY tam ortalama

**Amaç:** Her form odak/aktif seçiminde, ilgili PDF alanının **dikdörtgen orta noktasını** sağ PDF'nin **görünür merkezine** getirmek. Alanın görünür olması yeterli değil. Dikey/yatay pan, scroll limit genişletmesi ve yarış güvenliği birlikte çözülsün.

**Giriş:** ASAMA_02'nin geçiş/scroll sahibi kararlı. Var olan `fieldFocusRects` doğru ve PDF render token kontrolü çalışıyor.

**Mevcut hedef dosyalar:** `src/components/belge-studio-pdf-preview.tsx`, `src/hooks/use-belge-field-focus.ts` (aynı alana bilinçli tekrar tıklama ihtiyacı için minimum kapsam), `src/lib/belge-field-focus.ts`, `src/app/globals.css`, `src/lib/belge-studio-layout.ts` (gerekirse). **Yeni dosya (yalnız gerçekten ortak pure math avantajı varsa):** `src/lib/belge-studio-focus-center.ts`, buna karşılık `tests/belgeler/belge-studio-focus-center.test.ts`; ilgili Playwright testine yeni testler.

**Uygulama sırası:**

1. **Eski `performReveal` davranışını ayır:** Sol formun PDF alanı seçimi için **`centerFocusedField`**, mobil sheet/keyboard için gerektiğinde kalan eski **`revealFieldInVisibleArea`**. `getInlineFieldRevealDelta` fonksiyonunu her yerde merkezlemeye çevirmek yok. Yeni seçimden gelen `focusEventId`, render revision, sayfa kontrolü korunacak.
2. **Saf matematik:** Normalize `FieldFocusRect`'ten `frameRect` ile alan merkezini hesapla; scroll container'ın gerçek `clientWidth/clientHeight` merkezini bul. `desiredLeft/Top = scrollLeft/Top + (fieldCenter - viewportCenter)`. Çevresel padding yokken clamp'le kesinlikle tamamlandı sayma; legal scroll limiti yetiyor mu ölç.
3. **Yetersiz scroll alanı:** Yalnız focus esnasında gerekli **scroll spacer/padding** ihtiyacını hesapla; en uç alanlarda viewport/2 dış hareket alanı sağlayabilsin. `surface` frame konumu değişirse **aynı paint öncesi görsel kompanse** yaparak anlık sıçrama önle; sonra yeni frame'in gerçek `getBoundingClientRect` değerleriyle hedefi **tekrar hesapla**. Bunu bir kez ölç+ayarla+ölç planıyla yap; sürekli ResizeObserver tetikleme/RAF loop yok. Boşluk PDF içeriğine veya overlay frame içine girmez; fit ve scroll extents birbirine dolanmaz.
4. **Programatik XY scroll:** Var olan hareketi yeni seçimde kes. Bir **tek** native smooth scroll veya tek request-id tabanlı RAF hareketi. Hedefe ulaştığında (animasyon + font/layout yerleşimi sonrası) seçili alan merkezi ile panel merkezi farkını test et: normal koşullarda **|dx| ≤ 8 CSS px, |dy| ≤ 8 CSS px**; statik reduced-motion testinde **≤ 2px** ideal. Sınırlar sırf clamp yüzünden engelliyse eksik scroll mesafesi giderilmeli; sessizce “yakınlaştır ve kurtar” yasak.
5. **Zoom invariant:** %50/%100/%255/%278/%400 odak senaryolarında *önce ve sonra* zoom level, fitMode ve PDF page raster zoom (yalnız sayfa değişmediği sürece) birebir aynı. Odak seçmek `setZoomLevel` veya render çağrısı yapamaz. Sidebar scroll ve browser/window scroll aynı kalır.
6. **Sayfa değişimi/pending intent:** Ör. 2. sayfaya ait form alanı seçilirse mevcut `handlePageChange(targetPage,false)` yolu korunur, güncel PDF token+geometry ready olduğunda yalnız **en son** focus id için merkez yapılır. Aynı inputu yeniden tıklayıp geri merkezleme kullanıcı isteği olarak ele alınır; her `onChange`/autosave'de yeni focus yaratılmaz. Sekme odaklaması ve mouse click eşit davranır.
7. **Öncelik ve cleanup:** Manuel mousewheel, touchpan, scrollbar drag veya pinch => programatik hareket iptal; kullanıcı hakim. Fit/zoom => focus scroll iptal ve kendi anchor'ı uygulanır; yeni field intent varsa sonunda en yeni zoomda merkezleme. Escape, clear, modal unmount, document change, stale render, page navigation => pending intent/extra spacers/id'leri güvenli temizle. Mobil inline-sheet açıkken ekranda gerçekten görünür PDF bölümünün merkezi doğru hedeflensin; sheet reveal/dirty protection çalışmaya devam etsin.
8. **Regresyon koruması:** Inline overlay mevcut doğru PDF alanında. Gereksiz full re-render/PDF generation yok. Animasyon bittiğinde mavi/turuncu kutu kaymıyor. Dokunmatik input otomatik scroll/virtual keyboard açıldığında `layoutFreezeRef` kuralları çiğnenmez.

**Olmazsa olmaz Playwright senaryoları:**

| Senaryo | Eylem | Kabul |
|---|---|---|
| **A — görsel 1** | `%255`, zaten görünür `İmza Alanı Unvanı`na tıkla | Yine kayar; alan merkezi sağ panel merkezinde (±8px), **zoom %255 değişmez** |
| **B — görsel 2** | `%278`, alt sayfadaki `İmza Alanı Unvanı`nı seç | Y ekseninde aşağı kayar, X gerekiyorsa düzelir; alan ortada, %278 aynı |
| **C — görsel 3** | `%400`, `Yapı Adresi` ve `İmza Alanı Unvanı` sırayla seç | İki eksende pan; tüm kutu sığmak zorunda değil ama **kutunun merkezi ortada**, %400 aynı |
| **D — sınır** | Sayfanın sol üst ve sağ alt ucundaki geçerli alanları seç | **Geçici ekstra scroll alanıyla** merkezlenir; zoom değişmez |
| **E — küçük sayfa** | `%50` veya `%100`, PDF viewport içinde daha küçük, dipte bir alan seç | Boş sayfa çevresi eklenebilir; alan yine viewport merkezi olur |
| **F — arka arkaya** | 4 alanı hızla seç, son seçim `Adres` | Son alan merkezde; önceki pending RAF/scroll geri döndüremez |
| **G — yeniden seçim** | Alan seç, elle scroll et, aynı inputa yeniden bilinçli tıkla | Merkeze yeniden döner; inputta harf yazmak **scroll etmez** |
| **H — farklı sayfa** | İkinci sayfa alanına odaklan; render geciksin | Doğru sayfa açılır, render ready olduktan sonra merkezleme; eski PDF'ye sıçrama yok |
| **I — manuel kesme** | Smooth hareket esnasında kullanıcı scroll/pan yapar | Kullanıcının hareketi kazanır, programatik scroll yeniden başlatılmaz |
| **J — modal / mobil** | Mobil form ve sheet, tema, browser resize / modal aç-kapat | Klavye/alt sheet alanı kapanmaz, yanlış merkez hesaplanmaz, iç scroll bağımsız |
| **K — reduced-motion** | `prefers-reduced-motion:reduce`, `%400` alan seç | Anında XY merkez, yanlış animasyon yok, zoom aynı |

**Geometrik test yöntemi:** Gerçek `data-testid="belge-studio-preview-canvas"` scrollport merkezini, `data-testid="belge-field-focus-highlight"` veya normalize `FieldFocusRect` ile belirlenen gerçek *seçili field merkezi*ni kullan. `getBoundingClientRect()` ile `dx,dy` farkını ölç. Seçici ve gerçek alan ID'si kaynakta doğrulanmadan uydurma. Sadece `scrollTop` değişti diye PASS deme; merkez farkını ve **zoom invariant**'ı assert et. Overlay gerçek form alanı sınırında kalmalı.

**Hata/geri dönüş:** Padding eklenince doküman anlık yerinden oynuyorsa çözümü tamamlanmış sayma; frame-anchoring'i onar. Düşük zoomdaki alanı merkezlemek imkânsız görünüyorsa alanı büyütme/zoom out yapma; yalnız kaydırma çevresini düzelt. PDF hit test bozulduysa minimal merkezleme modunu kapatıp eski güvenli reveal'a geri dön; ilgili kabul kriteri geçmeden ilerleme. **ASAMA_04 öncesi dur.**

---

## ASAMA_04 — Responsive / performans / final test / tek yayına alma

**Amaç:** Dört aşamanın tamamını, özellikle yeni XY-merkezleme sözleşmesini *gerçek kullanıcı akışında* doğrula; kaliteyi düşürmeden tek kontrollü production release yap.

**Giriş:** ASAMA_01–03 kanıtlı ve tamam; eksik/hatalı varsa önce ilgili aşamanın kapsamında düzelt, genel aşama tamamlandı diyerek atlama.

**Uygulama sırası:**

1. **Responsive QA:** 320, 390, 430, 768, 1024, 1280, 1366, 1440, 1920px + 1366×768 laptop yüksekliği. Masaüstünde SVG ikon/alt etiket, 1024'te çakışmama, mobil header+drawer, üst/alt bar korunur; open/close modal, light/dark, reduced-motion.
2. **Beş stüdyo:** `santiye-sefi-taahhutnamesi`, `santiye-sefi-sozlesmesi`, `santiye-sefi-istifa-dilekcesi`, `insaat-ruhsati-dilekcesi`, `beton-dokum-tutanagi`. Her birinde header, fit, alan odak, form verisi ve PDF etkileşimleri doğrulanır. Bir sayfada alan yoksa özel durum doğru ele alınır.
3. **Acil/yük senaryoları:** %50→400, %400→fit, fit↔width-fit seri, alan A→B→A hızlı, yüksek DPR, farklı sayfaya atlama, yavaş PDF render, onaylanmamış input/sheet, autosave, typed textarea, undo/reset/clear, print/download, readonly share viewer etkilenmemesi. Console error, uncaught rejection, request failure, hydration error ve yatay overflow kaydı. PDF veri kaybı = mutlak başarısızlık.
4. **Test komutları (yerelde varlığı teyit edilerek):** `npx tsc --noEmit --incremental false`; değiştirilen dosyalar için ESLint; `npm run check:belgeler-pdf`; testlerde ilgili `tests/belgeler/belge-header-v3.test.ts`, `belge-toolbar-footer-v3.test.ts` ve yeni center unit testleri; Playwright'ın ilgili `belgeler-field-focus-regressions.spec.ts`, `belgeler-field-focus.spec.ts`, `belgeler-unified-header-*`, `belgeler-mobile-drawer.spec.ts`, `belgeler-inline-edit-mobile.spec.ts`, `belgeler-pdf-focus-mode.spec.ts`, yeni focus-centering spec. Son kalite kapısı **`npm run build`**. Paket yönetimi/Playwright config mevcut repo standardından seçilecek; çalışmayan hayalî komut yazılmayacak.
5. **Metrik ve karşılaştırma:** `Sığdır`/width-fit 240ms civarı, final render'da zıplama yok; merkezleme normal motion 250–360ms hedef, reduced motion instant; odak sonrası ölçülen merkez farkı **≤8px** (reduced-motion ≤2px hedef); PDF zoom değişmez; frame/overlay sahne eşleşir. Gözle video + en az bir matematiksel DOM geometry assertion birlikte sunulsun. Gecikme daha yüksek cihazda hareketsiz kalma/bulanık bırakma olmasın; 60fps hedef, donanım doğrulanmadan kesin başarı iddiası yok.
6. **Diff temizliği:** `git status --short`, `git diff --check`, `git diff --stat`, scripts/test cleanup; başka görevdeki yerel dosyaları sıfırlama/ekleme. `docs/BELGELER_SISTEMI.md` yalnız yeni kalıcı odak mimarisi için kısa kayıt gerekliyse güncelle. Diğer modüllere gereksiz refactor yok.
7. **Yayın kapısı:** Gerekli testler ve görüntülü kabul geçerse yerel IDE çalışma standardına uygun **tek anlamlı atomik commit + `main` push**. `main`'de başka değişiklikler varsa güvenli entegrasyon; **force push, reset --hard, ilgisiz staged dosyaları commit yok**. Vercel Production otomatik deploy sonucu `Ready` olmalı. CANLI `/belgeler/santiye-sefi-taahhutnamesi` ve ikinci stüdyo üzerinde header/fit/merkezleme smoke; `Ready` sonrası gereksiz tekrar deploy/HTTP bekleme döngüsü oluşturma. Build sistemi / Vercel'e özel mevcut istisnalar varsa `AGENTS.md`/`.agents/rules/vercel-kurallari.md` öncelikli.
8. **Final state:** Başarı kanıtları, commit SHA / deploy sonucu, kalan bilinçli sınırlar kaydedilir. Zorunlu test veya merkezleme kabulü geçmediyse `TAMAMLANDI` **yazılamaz**, yayın da yapılmaz.

**Final kabul listesi:**

- [ ] Üst bar ikonları ideal SVG boyunda, **ikon üstte + etiket altta**; zoom merkezi, mobil derli toplu.
- [ ] `Sığdır`/`Genişliğe Sığdır` akıcı, ani raster/scroll zıplaması yok, PDF netliği korunuyor.
- [ ] **Alan zaten görünürken de seçildiğinde ortaya gelir** (önceki görsel 1 hatası giderildi).
- [ ] `%255`, `%278`, `%400` örneklerinin her birinde sağ panel merkezine **XY kaydırma**; zoom yüzdesi seçim öncesi/sonrası **aynı**.
- [ ] PDF'nin ilk/son satırı ve sol/sağ uç alanı dahil scroll aralığı yetmediğinde güvenli boş çevre ile gerçek merkez mümkün.
- [ ] En son seçilen alan kazanır; eski render/scroll niyeti geri sıçratmaz; manuel pan öncelikli.
- [ ] Mavi/turuncu PDF highlight, hotspot, inline düzenleme, mobil sheet ve paylaşımlar bozulmadı.
- [ ] 5 belge stüdyosu, iki tema, reduced motion, mobil, laptop, çok sayfa ve yavaş PDF koşulları geçti.
- [ ] TypeScript, lint, ilgili testler ve final build geçer; bir kontrollü release ve canlı smoke kanıtı var.

**Aşama sonu:** `execution_status: TAMAMLANDI`, `active_stage: null`, `next_stage: null`. Bundan sonra salt `devam` mesajı yeni iş başlatamaz.

---

## 6. Kalıcı state ve `devam` protokolü (zorunlu)

1. Mevcut proje/GSD plan klasörüyle çakışmadan, önerilen görev yolu: `.planning/belgeler-header-smooth-focus-v2/PLAN.md` ve `.planning/belgeler-header-smooth-focus-v2/IMPLEMENTATION_STATE.md` (**yeni**, ancak mevcut aynı göreve ait dosyalar varsa yerinde revize et). Kullanıcı MD dosyasını yerel projeye veriyorsa oradan referans al. Git içinde daha önce durum dosyası tutuluyorsa çifte state üretme.
2. Durum şeması:

```yaml
plan_id: BELGE-HEADER-SMOOTH-FIT-FOCUS-CENTER-20261025
plan_revision: 2
planning_status: PLAN_HAZIR
execution_status: BASLAMADI # BASLAMADI / DEVAM_EDIYOR / ENGELLI / TAMAMLANDI
active_stage: null
next_stage: ASAMA_01
completed_stages: []
evidence: []
blockers: []
updated_at: "2026-10-25T00:00:00+03:00" # örnektir; GERÇEK zaman yaz
```

3. Önceki v1 uygulaması yerelde başlamışsa mevcut tamamlanan aşama/commit/diff/test kanıtlarına bakıp **yalnız gerçekten doğrulanmış işleri** yeni 4 aşamalı plana eşleştir. Örneğin v1 ASAMA_01 görsel üst bar bittiyse V2 ASAMA_01'i yeniden uygulamak yerine doğrula; focus merkezleme **yeni V2 ASAMA_03** olduğundan otomatik tamamlanmış sayma. Eski state tarihçesini silme; revizyon bilgisi tut.
4. Planı okumak **uygulamaya başla komutu değil**. Kullanıcı `başla` veya `devam` dediğinde **en fazla tek tamamlanmamış aşamayı** uygula. Başlamış yarım aşama varsa onu bitir. Başarı kriterini kontrol et, kısa rapor ve state yaz, **dur**. Sonraki aşamaya otomatik geçme.
5. Aşama içindeki doğal küçük hataları kullanıcıdan soru istemeden çöz; gereksiz izin/teyit alma. **Gerçek blocker** (kod erişimi yok, çalışma ağacı güvenli değil, zorunlu test geçmiyor) varsa `ENGELLI` kaydı ve hangi güvenli alternatifi denediğini bildir; bağımlı aşamaya atlama.
6. Planın tüm aşamaları tamamlanmışken yalnız `devam`: **“Plan tamamlandı; uygulanacak başka aşama yok.”** Kod/test/commit/deploy **yapma**. Yeni görev ancak kullanıcının açık yeni isteği ile açılır.
7. Aşama raporu **kısa**: `ASAMA_0N — yapılan iş; test; engel; sonraki aşama`. Uzun komut çıktısı ve her aşamada tekrar tüm plan yok.
8. `git reset --hard`, force push, kullanıcı dosyalarını izinsiz silme, her aşamada deploy, gereksiz paket güncelleme yok. Testte browser `finally` cleanup ve timeout; PowerShell'de çıplak `curl` yok; repo `AGENTS.md` esastır.

---

## 7. Gemini'ye gönderilecek **tek başlangıç promptu**

> Sana verdiğim **`BELGELER_UST_BAR_AKICI_ZOOM_AKILLI_ALAN_ORTALAMA_NIHAI_V2.md`** dosyasını eksiksiz oku ve **Gemini 3.8 Flash (Medium)** ile Windows yerel mühendislik projemde uygula. Önce `PROJECT.md`, `AGENTS.md`, `GEMINI.md`, ilgili `.agents/rules` ve var olan ilerleme kaydını oku. Mevcut kod/yerel değişikliklerimi koru; eski 4 aşamalı plan uygulanmaya başladıysa mevcut ilerlemeyi kanıtla ve V2'ye taşı, tekrar etme. Planın kritik yeni özelliği şudur: **Sol formda bir alanı seçtiğimde PDF üzerindeki o alan, zaten ekranda görünüyorsa bile, sağ PDF panelinin hem yatay hem dikey tam ortasına kaydırılarak getirilecek; %50–%400 dâhil mevcut zoom kesinlikle değişmeyecek; PDF kenarında scroll aralığı yoksa geçici güvenli boşlukla gerçek merkez mümkün olacak.** Bunları asla yalnız highlight veya `scrollIntoView` düzeyinde geçiştirme. Üst bar ve akıcı sığdırma istekleri de aynen geçerli. **Şimdi yalnız ilk tamamlanmamış aşamayı uygula**, ilgili testlerini bitir, ilerleme dosyasını güncelle, çok kısa ne yaptığını raporla ve **dur**. Sonraki aşama için yalnız ben `devam` dediğimde ilerle. Dördüncü aşamadaki final release gate'inden önce push/deploy yapma. Bana rutin soru sorma; gerçek ve çözülemeyen güvenlik/teknik engeli belirt.

---

**Teslim notu:** Bu belge **uygulama talimatıdır**. Kullanıcı yeni üç ekran görüntüsünü ve gerekiyorsa PDFgear referansını da Gemini'ye verir; ancak bu plan tek başına istenen davranışı matematiksel ve test edilebilir biçimde tarif eder.
