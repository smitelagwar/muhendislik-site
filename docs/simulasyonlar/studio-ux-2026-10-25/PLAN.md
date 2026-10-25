# 3B Simülasyonlar — TradingView Esinli Mühendislik Stüdyosu, Kamera Hassasiyeti ve Kaydırmasız Çalışma Alanı

> **Plan kodu:** `SIM-STUDIO-UX-2026-10-25`  
> **Revizyon:** `1.0 / nihai`  
> **Hazırlık tarihi:** 25.10.2026 (Europe/Istanbul)  
> **Hedef uygulayıcı (kullanıcının ifadesi):** `Gemini 3.8 High` — hedef uygulamada tam model kimliği ve `high` düşünme ayarı yerelde doğrulanacak; sessizce başka modele geçilmeyecek. Google'ın belgelerinde `Gemini 3.8 Flash` modeli ve `high` düşünme seviyesi doğrulanmaktadır.  
> **Ortam:** Kullanıcının Windows makinesindeki yerel `smitelagwar/muhendislik-site` çalışma kopyası.  
> **Planlayıcı:** ChatGPT; **uygulayıcı:** masaüstündeki Gemini ajanı.  
> **GitHub inceleme referansı:** `main@6bdda9a3028200e61027b98aefffcb9cf57b47ca` (25 Ekim 2026, 17:22:20 UTC). Bu, yerel working tree'nin aynı olduğu anlamına **gelmez**.  
> **Başlangıç durumu:** Plan hazır; uygulama **başlatılmadı**. Bu plan, daha önce bitirilmiş `SIM-STUDIO-2026-10-25` planına eklenen **yeni bir iş**tir; eski ilerleme kaydını yeniden açma ya da üstüne yazma.

## 0. Kullanıcının gerçek talebi ve değişmez hedef

Kullanıcı iki ekran görüntüsü verdi: (1) mühendislik sitesindeki kiriş donatısı 3B simülasyonu; (2) TradingView çalışma alanı. Site görüntüsünde çok geniş bir sahne yer almasına rağmen 3B modelin etkileşim açısından kontrolü sert/hassas, sahnede görünür nesneler bazen küçük veya kadraj dışı hissediliyor; teknik çizim ve öğrenme kontrolleri aşağı akarak kullanıcının sürekli sayfayı kaydırmasını gerektiriyor. TradingView'den alınacak fikir **görsel klonlamak değil**, tek ekrandan sürekli çalışmayı sağlayan araç düzenidir.

**Bu planın başarı tanımı:**

1. Fareyle döndürme, yakınlaştırma ve kaydırma **ölçülü, öngörülebilir, daha az hassas** olur; büyük ve küçük sahnelerde benzer kontrol hissi korunur.
2. 3B sahne temel odak haline gelir; normal masaüstü kullanımında 2B çizim, kesit, katman, öğretim, parça seçimi ve ayarlar için **ana sayfayı aşağı kaydırmak gerekmez**. Gereken kaydırma, ilgili yan panel veya alt çekmecenin **kendi içinde** gerçekleşir.
3. TradingView benzeri **üst araç şeridi + geniş merkez sahne + isteğe bağlı sağ denetçi + açılır alt teknik panel** sunulur. Kullanıcı hangi aracı açarsa açsın WebGL sahnesi yeniden yaratılmaz.
4. Altı mevcut model (`kolon-detayi`, `kiris-detayi`, `kolon-kiris-birlesimi`, `tekil-temel`, `perde-detayi`, `radye-temel`), tüm eğitim verileri, 2B/3B bağlantısı, model seçimleri, URL paylaşımı ve tema eşliği korunur.
5. Tablet, küçük dizüstü, telefon, yatay telefon, klavye ve dokunmatik kullanıcıları için öngörülebilir davranış; az hareket isteyenler için `prefers-reduced-motion` desteği bulunur.

**Kapsam dışı:** Betonarme hesap formülü/geometri/etriye/sarılma/veri kurallarını değiştirme; CAD/DWG motoruna dokunma; yeni 3B renderer yazma; paket sürümü yükseltme; kullanıcı verisini sunucuya taşıma; TradingView logosu/tasarım varlığını kopyalama; yeni abonelik/hesap özelliği. İsteğe bağlı özellikler (ölçüm aracı, gelişmiş kamera profili paneli, orientasyon küpü, çizim kaydetme) bu sürüme eklenmeyecek.

## 1. Araştırma durumu: kanıtı varsayımdan ayır

### Doğrulandı (GitHub `main`, 25.10.2026)

- `src/app/kategori/araclar/simulasyonlar/[slug]/page.tsx` dış kabı `tool-page-shell py-3 pb-20 md:py-5 md:pb-12` ve `max-w-[2400px]` kullanıyor. Normal akıştaki üst-alt padding, gerçek tam yükseklikli editör için tekrar ele alınmalı; **global sayfa düzenine müdahale edilmemeli**.
- `src/components/simulations/simulation-workspace.tsx` üstte ayrı, yüksekliği değişebilen başlık/önayar bölümü; altta sahne ile `LearningControlsPanel` bileşenini aynı sol sütunda art arda gösteriyor. `xl` üzerinde sağ denetçi 320–380px yan sütun; daha küçük ekranlarda aşağı taşınıyor. Bu, gereksiz dikey kaydırmanın doğrudan nedenlerinden biri.
- `src/components/simulations/simulation-viewer.tsx` 3B için `clamp(...)` tabanlı yükseklik ve 2B için sahnenin altına eklenen ikinci bölüm kullanıyor. Sekmeler `2B + 3B`, `3B Sahne`, `2B Çizim`.
- `src/lib/simulations/state/view-reducer.ts`: varsayılan `viewTab: "split"` (2B + 3B); uygulamayı açar açmaz uzun çalışma sayfasına sebep oluyor.
- `src/lib/simulations/engine/three-column-viewer.ts`: `OrbitControls` içinde `enableDamping=false`, `screenSpacePanning=true`, `minDistance=0.25`, `maxDistance=18`; `rotateSpeed`, `zoomSpeed`, `panSpeed` belirtilmediğinden kütüphanenin kendi varsayılanlarına kalıyor. Yakınlaştırma düğmeleri `0.84 / 1.18` katsayılarını kullanıyor. `fitToModel` ve 8 köşe FOV sığdırma zaten mevcut: **sıfırdan yeniden yazılmayacak**.
- Mevcut motor tıklama/drag ayrımı için 5px hareket eşiği kullanıyor; `pointerdown`/`pointerup` üzerinden raycast yapıyor. Sahne seçim etkileşimi, camera drag ve touch arasındaki ayrım korunmalı/sertleştirilmeli.
- Tek WebGL canvas, sahne korunarak mod değiştirme, context-lost kurtarma, istek üzerine RAF çizimi, `ResizeObserver`, odak/tam ekran ve sahne durumu için `data-testid` kontrolleri hazır.
- `tests/site-audit/simulations-studio-layout.spec.ts` halihazırda 1920×1080, 1366×768, 390×844 gibi durumlarda genişlik, tek canvas ve yatay taşmayı kontrol ediyor; **fakat ekrana sığma, sayfasız dolaşma ve hassasiyet beklentisini henüz test etmiyor**.
- Var olan proje scriptleri: `npm run check:simulations:model`, `npm run check:simulations:ui`, `npm run check:simulations`, `npm run build`, `npx tsc -p tsconfig.next.json --noEmit --incremental false`.
- `docs/simulasyonlar/3B_STUDIO_ARCHITECTURE.md` ve `3B_STUDIO_IMPLEMENTATION_STATE.md`, **eski** 10 aşamalı planın `TAMAMLANDI` durumunu belgelemektedir. Bunların geçmişi silinmeyecek.

### Varsayım / yerelde doğrulanacak

- Kullanıcının görselindeki modelin aşırı küçük/garip görünmesi **yalnızca kamera hassasiyetinden kaynaklanıyor denemez**. Ekran görüntüsünde beton gizli; kamera açısı/mesafesi, aktif katman, model bounds ve geometrinin görünürlüğü canlı yerel testle ayrılmalı.
- `main` commit'i yerel değişikliklerle birebir aynı olmayabilir; kullanıcı ekran görüntüsünün özel Vercel önizlemesi `main` ile aynı sürüm olmayabilir. Uygulayıcı önce `git status`, HEAD ve ilgili dosyaların diff'ini karşılaştıracak; yerel değişiklikleri silmeyecek.
- Global sitenin header, mobil alt bar ve tarayıcı adres çubuğu gerçek kullanılabilir viewport'u etkileyebilir. Sabit `100vh-80px` varsayımı yapılmayacak; gerçek ekran sınırları ölçülecek.
- Hedef etiket `Gemini 3.8 High` kullanıcı tercihidir; modelin gerçek sağlayıcı kimliği/Flash varyantı ve `high` ayarı Gemini arayüzünden doğrulanacak, fakat bu isim belirsiz diye uygulama başka modele devredilmeyecek.

### Kaynaklar

- Kod: https://github.com/smitelagwar/muhendislik-site/tree/main/src/components/simulations
- Motor: https://github.com/smitelagwar/muhendislik-site/blob/main/src/lib/simulations/engine/three-column-viewer.ts
- Test: https://github.com/smitelagwar/muhendislik-site/blob/main/tests/site-audit/simulations-studio-layout.spec.ts
- Mevcut mimari: https://github.com/smitelagwar/muhendislik-site/blob/main/docs/simulasyonlar/3B_STUDIO_ARCHITECTURE.md
- Three.js OrbitControls: https://threejs.org/docs/pages/OrbitControls
- Google model/düşünme ayarı: https://ai.google.dev/gemini-api/docs/latest-model
- Kullanıcının planlama protokolü: Drive'daki `CHATGPT_ASAMALI_PLANLAMA_TALIMATI.md`; bu plan içinde de uygulayıcıya gerekli durma protokolü açıklanmıştır.

## 2. Nihai tasarım kararı

### 2.1 Ekranın yeni bilgi mimarisi

```text
┌───────────────────────────────────────────────────────────────────────┐
│ Sitenin mevcut global navigasyonu (değişmeden kalır)                │
├───────────────────────────────────────────────────────────────────────┤
│ Tek satırlık Stüdyo Üst Çubuğu                                     │
│ ‹ Simülasyonlar  | Kiriş Detayı | 3B / 2B+3B / 2B | Görünüm | ...   │
├──────┬─────────────────────────────────────────────┬──────────────────┤
│ Dar  │                                             │ Sağ denetçi      │
│ araç │               GERÇEK 3B SAHNE              │ Parçalar/Katman  │
│ rayı │                                             │ /Öğretim/Özet   │
│      │       boşluk yerine merkezlenmiş model      │ iç kaydırma     │
│      │                                             │ 320–360px       │
│      │                                             │ gizlenebilir     │
├──────┴─────────────────────────────────────────────┴──────────────────┤
│ Alt Dock: [2B Teknik Çizim] [Kesit] [Öğrenme] [Detaylar]            │
│ Kapalıyken yalnız kısa sekme çubuğu; açılınca KENDİ İÇİNDE scroll   │
└───────────────────────────────────────────────────────────────────────┘
```

- TradingView'den alınan ilkeler: **grafik/sahne her zaman merkezde**, araçlar sabit konumda, ayrıntılar kullanıcı çağırınca açılıyor, aktif seçim korunuyor, panel içerikleri kendi içinde kaydırılıyor, sayfanın tamamı sürekli aşağı akmıyor.
- Marka kopyalama yok: sitenin kendi açık/koyu tema token'ları, tipografisi, ikonları ve renk semantiği kullanılacak. Parlak mor/amber aksanlar ölçülü; mühendislik nesnesinin kendisi her zaman ön planda.
- Desktop `>=1280px`: sağ denetçi dock içinde sabit, 320–360px genişlikte, gizlenebilir; sahne kalan alanı doldurur. `1024–1279px`: sağ denetçi **canvas altına düşmez**, sahnenin yanında yer işgal etmeyen erişilebilir overlay drawer olur. `<1024px`: alt sheet/yan drawer, kapatılabilir; telefonun ekranını kalıcı olarak örtmez.
- Alt dock **varsayılan kapalı** (yüksekliği yaklaşık 40–48px), 2B/3B birlikte seçilirse 2B alt dock içinde açılır veya yeterli ekran genişliğinde bölünmüş görünüm yapılır. `split` modunun anlamı bozulmaz: iki içerik aynı anda görünür; yalnız artık sayfada aşağı kaydırılan blok olarak değil, çalışma alanı panelinde görünür.
- `3d` ilk açılışın varsayılan görünümü olsun (**önerilen tercih**); `2d` ve `split` URL'den/önceki açık kullanıcı etkileşiminden gelirse aynen geri kurulsun. Mevcut URL codec/testlerde varsayılan `split` varsayımı varsa güvenli migration ve regresyon testiyle güncelle. Gizli URL versiyon kırılması yaratma.
- Üst çubukta birincil işlemler: mod (`3B`, `2B+3B`, `2B`), kamera yönü, `Sığdır`, `Beton`, `Kesit`, `Sağ Panel`, `Alt Panel`; ikincil işlemler popover/`Diğer` altında (`Sıfırla`, paylaşım, açıklama). Sahnenin üstünde yalnız minimal durum çipi ve isteğe bağlı lejant; uzun yönergeler denetçi/yardım bölümüne taşınır.
- Kiriş/kolon önayarları ve parametreleri, başlıkla birlikte ekran yüksekliği tüketmemeli: üst çubukta kompakt önayar seçici ve `Parametreler` açılır paneli. Alan, hata/validation bildirimleri erişilebilir kalmalı.
- Başlığın ve paylaşmanın tamamen kaybolması yasak: dar görünümde kısalt, menüye taşı, tooltip/aria-label ver.

### 2.2 Kamera hissi: *hızları düşür, kontrollere güveni artır*

Şu başlangıç değerleri **tasarım varsayılanı**, gerçek testte küçük ayarlamaya açık hedeflerdir:

| Kamera parametresi | Mevcut | Öneri | Neden |
|---|---:|---:|---|
| `rotateSpeed` | Kütüphane varsayılanı `1` | `0.55` | Döndürme yaklaşık %45 yavaşlar; küçük mouse hareketi dramatik dönüş yapmaz |
| `zoomSpeed` | Varsayılan `1` | `0.65` | Fare tekerleği daha hassas kademelenir |
| `panSpeed` | Varsayılan `1` | `0.65` | Sağ sürükle daha yumuşak olur |
| Yakınlaş butonu | `0.84×` mesafe | `0.90×` | Bir tıkta ölçülü yaklaşma |
| Uzaklaş butonu | `1.18×` mesafe | `1.10×` | Bir tıkta ölçülü uzaklaşma |
| `minDistance`, `maxDistance` | `0.25`, `18` m | Varsayılan korunur; yalnız kanıt varsa sahne ölçeğine göre uyarlanır | Nesne içine girme veya kaybolmayı önlemek; farklı model boyutlarına kör sabit dayatmamak |
| `enableDamping` | `false` | İlk teslimde `false` kalabilir | Boş sahnede RAF bütçesini ve 'sürüklemeyi bıraktım hâlâ dönüyor' hissini bozma |

- **Önemli:** `enableDamping=true` ancak kontrollü requestAnimationFrame `controls.update()` devam döngüsü ve `3 saniye idle iken 0 ekstra render` regresyonu birlikte başarıyla sağlanırsa seçilebilir. Varsayılan çözüm, yalnız hızları azaltarak stabil yapıyı korumaktır. İki ayrı wheel controller aynı anda kurulmayacak.
- Sol fare = döndür, sağ fare = kaydır, tekerlek = yalnız canvas üzerinde zoom. Tek tık = parça seç. En az 5–8px anlamlı drag eşiği korunur ve `pointercancel`, canvas dışına bırakma, double-click, touch davranışı incelenir.
- Canvas dışındaki wheel girişini OrbitControls yakalamaz; sağ denetçi üzerinde tekerlek **denetçiyi kaydırır**; alt dock üzerinde tekerlek **dock içeriğini kaydırır**. Global `window/document` düzeyinde wheel `preventDefault` **yasak**.
- Tek tek hızları düşürmek yerine kontrol inversiyonu/ekseni bozma, pointer hareketini birden fazla katmanla tekrar çarpma veya kütüphane fork'u **yok**.
- Kullanıcı kamera yönünü değiştirse de `Sığdır` görünür etkin geometriyi anlamlı merkezde tutar. Beton gizli/katmanlar filtrelenmiş/kesit açık/patlatılmış durumda: görünür nesnelerin bounding box'ına göre ölçülü hedef; öncelikle mevcut fit fonksiyonunu **genişlet**, yeniden yazma. Hiç görünür nesne yoksa son güvenli kadraj ve net kullanıcı mesajı korunur.
- Başlangıçta screenshot'taki gibi yalnız ızgara ve birkaç renkli çizgi görünmesi senaryosu ayrıca araştırılmalı: model bounds, clipping plane, `layerVisibility`, `cameraDistance`, `near/far`, kamera target, hidden layer ve geometri sayısını karşılaştır. **Sorunun kanıtı olmadan model verisini yeniden hesaplama.**

### 2.3 Kaydırmasız stüdyo — hangi bölge scroll alır?

**Desktop (`>=1024`, yeterli yükseklik):** stüdyo çalışma alanı bir ekran yüksekliğine sığar; merkez canvas'ın kendi scroll container'ı **yoktur**. Ana browser belgesine yüksek içerik eklenmez. Denetçi ve alt dock scroll alanları ayrıdır. `wheel` üzerine mouse konumuna göre davranış sözleşmesi nettir.

**Dar/kısa ekranlarda:** kapalı paneller ve kısa üst bar öncelikli; sistem içerikleri kesmez. Gerekliyse yalnız seçilen sheet scroll eder. Tarayıcının adres barı açılıp kapanırken `dvh`/`visualViewport` uyarlanır. Klavye açılınca input ulaşılabilir kalır; kısa viewport için emniyetli yedek düzen kullanılabilir (kontrollü sayfa kaydırma, *sessiz içerik kaybından iyidir*).

**Yerleşim tekniği:** `100dvh`/`min-height:0`/`grid-template-rows: auto minmax(0,1fr) auto`/iç `overflow-y:auto`/`overscroll-behavior:contain` kullan. Site header'ı ile stüdyo arasındaki gerçek kullanılabilir yüksekliği ölç; uydurulmuş sabit `100vh - 76px` ile tüm tarayıcıları eşitleme. `body { overflow:hidden }` ve `html` genel kuralı **kullanma**; yalnız bu route'un kendi çalışma alanını sınırla. Stüdyo üst kısmının ekran üst koordinatını ve görünür viewport yüksekliğini (`ResizeObserver`, gerekirse `window.visualViewport`) ölçerek yüksekliği sınırlı ve temiz biçimde türet; resize olaylarını throttled yönet. Tarayıcı geri/ileri, mobil alt navigasyon, ekran klavyesi, focus restore ve site footer ile çatışmayı test et.

### 2.4 Sözleşme ve risk sınırları

- **Tek canvas:** her alt panel aç/kapa veya tab değişiminde `canvas` sayısı 1; `SimulationThreeController` tekrar yaratılmıyor. Canvas host'un boyutu değişince `ResizeObserver` sadece renderer/camera aspect güncelliyor; model/veri başlangıç durumuna dönmüyor.
- **Tek state kaynağı:** `view-reducer` içinde katman, seçili parça, kamera preset, kesit, patlatma ve öğretim state'i aynen merkezde kalır. Dock/inspector açık-kapalı gibi yalnız UI durumu `SimulationWorkspace` yerel state'i olabilir. Aynı şeyi iki ayrı store'a yazma.
- **Parçalar:** `PartInfoPanel`, `LayerPanel`, `LearningControlsPanel` içerikleri fiziksel olarak taşınır/refactor edilir; işlevi/validasyonu duplike edilmez. 2B seçilen parça 3B ve sağ bilgiyle eşleşir.
- **Görünürlük:** yalnız `display:none` ile büyük canvas'a 0x0 boyut verip sonra eski aspect'le geri getirme; 2B moddan dönüşte bir frame sonrasında aspect/fit kontrolü; kullanıcı kamerayı bilinçli değiştirmişse zıplatma yok.
- **Klavye:** input/slider üzerinde iken kamera kısayolu çalışmaz. ESC en üst açık katmanı kapatır; tam ekran/odak/denetçi geçmişi ve klavye odağı doğru geri gelir.
- **Tema:** Dark Industrial ve light eşliği; çizgiler, hover ve seçili parça erişilebilir kontrasta sahip; sahnenin içine gelen küçük yazılar düşük çözünürlükte taşmaz.

## 3. Aşama özeti

| Kimlik | Amaç | Somut çıktı |
|---|---|---|
| `ASAMA_01` | Gerçek çalışma ağacı, mevcut davranış, baseline | Ölçüm/test referansı ve etkili dosya listesi |
| `ASAMA_02` | Kamera hassasiyetini azalt ve kadraj güvenliği | Ölçülü orbit/zoom/pan + model görünürlüğü kontrolü |
| `ASAMA_03` | Tek viewport'a sığan stüdyo iskeleti | Route-scoped tam yükseklikli grid; ana sayfada scroll ihtiyacı yok |
| `ASAMA_04` | TradingView tarzı kompakt araçlar | Üst toolbar/mini ray ve korunmuş komutlar |
| `ASAMA_05` | Bağımsız sağ panel + öğretim alanı | İç scroll'lu denetçi; alt akıştan çıkarılmış öğrenme |
| `ASAMA_06` | 2B/3B ve alt dock yeniden yerleşimi | Aynı ekranda erişilebilir 2B, kesit, öğrenme; tek canvas |
| `ASAMA_07` | Mobil/tablet, tam ekran, klavye ve ayar kalıcılığı | Dokunma + kısa ekran + focus/escape güvenliği |
| `ASAMA_08` | Regresyon ve performans kabulü | 6 sahne + viewport + hareket testleri; gerekli düzeltmeler |
| `ASAMA_09` | Yaşayan doküman, final kalite ve tek yayın | Yerel PASS kanıtı, tek anlamlı release, production smoke |

## 4. Ayrıntılı uygulama aşamaları

### ASAMA_01 — Kanıt, yerel baseline, güvenli değişiklik sınırı

**Giriş:** Plan dosyası okunmuş; erişim mevcut; önceki planın `TAMAMLANDI` kaydı yeni plan için başarı sayılmıyor.

**Kapsam:** `PROJECT.md`, `AGENTS.md`, `GEMINI.md`, `.agents/rules/test-ve-otomasyon-standardi.md`, ilgili yaşayan simülasyon belgeleri, `src/components/simulations/**`, `src/lib/simulations/**`, ilgili route ve testler. Planın etkilediği `package.json` scriptleri ve lokal çalışan sunucu. **Repo içi gereksiz geniş tarama yok.**

**İş sırası:**
1. `git status --short`, `git branch --show-current`, `git rev-parse HEAD` ve ilgili diff'leri oku. Kullanıcı değişikliklerine dokunma; planın dayandığı `6bdda9a` ile uyuşmayan kritik bölüm varsa yalnız o bölümün yolunu revize et.
2. Repo sırasına göre yönergeleri oku; test altyapısını ve mevcut simülasyon stüdyosu state sözleşmesini öğren.
3. Yerelde `kiris-detayi` ve ardından bir dikey (`kolon-detayi`) ile geniş yatay (`radye-temel`) sahne aç. Mouse 50/100px sürükleme; 1, 3 ve 10 tekerlek kademe; 2 zoom buton tıklaması; sağ tıkla pan, kısa tıkla part pick testlerini **değişiklikten önce** ölç. Gerekli ekran kaydı/görselleri görev altında tutulabilir; kişisel verileri kaydetme.
4. 1920×1080 / 1366×768 / 1024×768 / 390×844 / 844×390 için `document.scrollingElement.scrollHeight-clientHeight`, `canvas.boundingRect`, global header üst/alt koordinatları, right panel/dock erişilebilirliği ve console hatası ölç.
5. Beton gizli ekran görüntüsündeki durumu yeniden oluştur. Büyüklük sorunu geometry/near-far/clipping/layer mı, kullanıcıya ait kadraj mı? Kanıtı not et. `data-testid` ve diagnostics hazırken bunları kullan; tahmini DOM seçicisi üretme.
6. Bu görevin durum kaydını **yeni** yol altında oluştur: `docs/simulasyonlar/studio-ux-2026-10-25/IMPLEMENTATION_STATE.md`; eski `3B_STUDIO_IMPLEMENTATION_STATE.md` değişmez. Gerekliyse yeni görev `PLAN.md` lokal kopyası aynı dizine konabilir; planın kendisi kullanıcı tarafından sağlanır.

**Doğrulama:** Başlangıç ekran görüntüleri ve ölçümler, komut/yol bilgisi, baseline 6 sahne yüklenmesi; mevcut test başarısı veya mevcut hata açıkça ayrılmış olsun.

**Kabul:** Etkilenen gerçek dosyalar, ölçülmüş davranış, önceki değişiklikler ve riskli farklar belli; baseline sahnelerden hiçbirini test etmeden 'iyi' diye işaretleme.

**Hata/geri dönüş:** Baseline testi bozuksa önce problemi izole edip kanıtla; kullanıcı dosyalarını resetleme. Sırf test hatası için tüm altyapıyı değiştirme.

**Durma:** `ASAMA_01` sonucu ve sıradaki `ASAMA_02` kısa raporunu ver; **dur**.

### ASAMA_02 — Duyarlılığı azalt, nesneyi ekranda tut

**Giriş:** `ASAMA_01` kamera ve görünürlük baseline'ı hazır.

**Kapsam:** Başlıca `src/lib/simulations/engine/three-column-viewer.ts`, gerekiyorsa küçük ve sınırlı `simulation-viewer.tsx` kontrol değişikliği; veri modeline dokunma.

**İş sırası:**
1. `OrbitControls` için ilk değerleri uygula: `rotateSpeed=0.55`, `zoomSpeed=0.65`, `panSpeed=0.65`. Var olan doğru mouse eşlemelerini koru. Aynı mousewheel olayına ikinci custom zoom zinciri ekleme.
2. `zoomByStep` yakın/uzak çarpanlarını `0.90 / 1.10` yap. Min/max clamp ve negative/NaN korumasını koru. Sınırlar modele göre uygunsuzsa, ancak baseline ölçümü üzerine ve tüm altı model testleriyle düzelt.
3. Seçme jesti ve orbit'i ayır: pointer capture/cancel ve canvas dışına çıkma vakalarını test et; 5px eşik yeterli değilse fiziksel pixel/device türüne göre 5–8px arası kullan. Mouse ile kamerayı hareket ettirirken `onPartPicked` yanlışlıkla çalışmamalı.
4. `fitToModel` için altı modelde görünür bounding box ve `near/far`, aspect, preset, exploded geometry, hidden concrete, kesit ve farklı layer maskesini kontrol et. İspat edilen hataya yönelik en küçük düzeltmeyi yap; model kaybolduğunda `Sığdır` kullanıcıyı güvenli kadraja döndürsün.
5. Kullanıcı özel bir açıdayken `Sığdır`ın açıyı koruması; `Sıfırla`nın mevcut state'i geri getirmesi; hazır `Ön/Sağ/Üst/İzometrik` görünüşleri ayrı çalışmaya devam etmeli. Animasyon/damping eklemeden de akıcılık yeterliyse **eski on-demand RAF yaklaşımını koru**.
6. Sahnede tekerlek zoomu global belgeyi kaydırmaz; canvas dışındaki kaydırmayı engelleyen global event yok. Touch pinch ve iki parmak pan doğru tepki verir.

**Doğrulama:** Aynı başlangıç mesafesinde 100px sürükleme için yeni `orbitAzimuthRad` değişimi eskiye göre gözle görülür biçimde küçük; 1 tekerlek bir modelin tamamını ekrandan çıkarmıyor; ardışık ± butonlarında camera distance mantıklı; `fit` her altı sahnede görünür. Özellikle `kiris-detayi` + `radye-temel` + `kolon-detayi` kontrolü.

**Kabul:** Hızlar düşmüş, drag yanlış seçim yapmıyor, geometri görünür, preset/fit/reset bozulmamış; idle çizim metriğinde regresyon yok.

**Hata/geri dönüş:** Görünürlük sorunu hızdan ayrıysa ayrı küçük bugfix olarak kanıtla; karmaşık kamera refactor'u yapma. Damping render sayısını patlatırsa damping'i kaldır.

**Durma:** Sonuç, öncesi/sonrası kamera ölçümü ve sıradaki aşamayı yaz; **dur**.

### ASAMA_03 — Sayfa akışı değil, bir ekranlık stüdyo

**Giriş:** Kamera işlevsel. Dış shell/header boyutu baseline'da ölçülmüş.

**Kapsam:** `src/app/kategori/araclar/simulasyonlar/[slug]/page.tsx`, `simulation-workspace.tsx`, gerekirse yalnız bu route'u hedefleyen stil/modül; global nav ve başka araç sayfalarına dokunma.

**İş sırası:**
1. Stüdyo root yüksekliği, gerçek görünür viewport'tan ve root'un ekran üzerindeki üst konumundan türesin. Normal desktop ekranda `header + araç çubuğu + merkez canvas + kapalı dock` tek viewport içine sığsın. `padding-bottom` gibi eski tool-page emniyet boşlukları bu route için koşullu/yerel değişsin; mobil global alt bar ile çakışma yaratmasın.
2. Root'a `min-height:0`, `min-width:0`, `overflow:hidden` **yalnız editör kabında**; row içeriğe `minmax(0,1fr)` ver. Sağ denetçi ve alt dock ayrı bağımsız scroller; browser page/body CSS değişmesin. Dosyanın önceden render edilmiş içeriği taşınmasın.
3. Sağ panel kapanınca merkez sahne kalan alanı otomatik alsın; `ResizeObserver` ile canvas aspect doğru güncellensin ve WebGL context tekrar oluşturulmasın. Sahne üst/alt bilgi rozeti canvas alanını gereksiz kaplamasın.
4. Küçük ekran yüksekliğinde (özellikle 1366×768 ve yatay telefon), başlık satırları maksimum 1–2 satırla sınırlı; ters yönde çok sayıda satıra wrap etmek yerine `Diğer` menüsü. Kısacık ekranda canvas aşırı küçükse çekmeceyi kapat ve destekli safe fallback sun.
5. Global header sabitse onun altında görün; global footer'ın bu tek ekranlık studio'da boş alan üretmesini engelle (yalnız route düzeyinde). Scrollbar'ı saklamakla problemi gizleme; gerçek `scrollHeight` ölçümünü küçült.

**Doğrulama:** 1920×1080 ve 1366×768'de kullanıcı tek ekran içinde sahneyi ve ana toolbar'ı görüyor, `scrollY` gerekmeden panel açabiliyor; devtools ölçümü yatay taşma sıfır; tarayıcı zoom %125 ve %150'de etkileşim korunuyor.

**Kabul:** Masaüstünde normal akış kaydırması olmadan ana görevler erişilebilir; 3B sahne açık halde geniş ve yüksek; diğer site sayfalarının scroll'u değişmemiş.

**Hata/geri dönüş:** Küçük ekran yüksekliklerinde içerik kesiliyorsa `overflow:hidden`ı kör uygulama; viewport-bazlı emniyet fallback tanımla ve tekrar test et.

**Durma:** Ölçümleri ve sıradaki aşamayı yaz; **dur**.

### ASAMA_04 — TradingView mantığında kompakt toolbar ve araç rayı

**Giriş:** Tek viewport iskeleti hazır.

**Kapsam:** `simulation-workspace.tsx` ve `simulation-viewer.tsx` toolbar düzeni; gereksiz bir UI framework ekleme.

**İş sırası:**
1. Mevcut iki ayrı yüksek toolbar'ı tekrarsız, tek sıra ağırlıklı stüdyo toolbar'a dönüştür. Başlık/önayar/görünüm ayrı satırlarda sürekli yer kaplamasın. `aria-label`, mevcut `data-testid` ve beklenen handler'lar korunur.
2. Sahnenin hemen yanında 44–52px civarında kompakt bir araç rayı (desktop) oluştur; işler: `Sığdır`, görünüm/preset, seçili parçaya odaklan, katman/yardım panelini aç, gerektiğinde kesiti göster. Aktif/hover/focus ayrımı net; öğeleri çoğaltıp iki ayrı state ile yönetme.
3. Araçların bir kısmını top bar/`Diğer` menüye taşı: `Paylaş`, `Sıfırla`, `Hakkında`. Kritik `Sığdır`, `2B/3B`, `Beton`, `Kesit` tek dokunuşla erişilir; saklanmış menüye gömülmez.
4. Beton gizli, kesit aktif, patlatma yüzdesi gibi durumları canvas üzerinde küçük çiplerle göster. Uzun öğretim yönergesini sahnenin üstüne yapıştırma; ihtiyaç halinde yardım paneli/tooltip. Tam ekran ve odak modunun ayrı anlamı var, kullanıcıya kafa karıştıracak çift isim/ikon bırakma.
5. Güvenli hover/focus/toast, light/dark, reduced-motion, %150 browser zoom ve yüksek kontrast kontrolü.

**Doğrulama:** Top toolbar en yaygın desktop genişliğinde tek satır; 1024 ve altı yatay taşmadan açılır menüye dönüşür; tüm eski buton handler'ları çalışır; her eylem sonrası model/canvas aynı kalır.

**Kabul:** Kontrol kaybı yok; görünüm sade; kullanıcının ana sahneden gözünü ayırması gerekmiyor.

**Hata/geri dönüş:** Bir buton menüye taşınınca erişilemiyorsa veya eski test seçicileri kaybolursa koruyucu markup/uyumluluk adaptörüyle düzelt; testi silme.

**Durma:** Kısa rapor ve sıradaki aşama; **dur**.

### ASAMA_05 — Sağ denetçi ve öğrenme kontrollerini sabitle

**Giriş:** Toolbar çalışıyor; kök viewport yüksekliği doğru.

**Kapsam:** `simulation-workspace.tsx`, `part-info.tsx`, `layer-panel.tsx`, `learning-controls.tsx` kompozisyonu; model hesaplama motoruna dokunma.

**İş sırası:**
1. Sağ denetçiyi görünür sahneyle aynı editör satırında tut. `Parçalar`, `Katmanlar`, `Öğretim`, `Özet & Kaynak` sekmeleri üzerinden mevcut bileşenleri kullan. Etiketleri bağlama göre sadeleştir; uzun açıklamalar sadece panel içinde scroll eder.
2. `LearningControlsPanel`'i sahnenin **altındaki sürekli büyük blok** olmaktan çıkar. İlişkili kısa komutlar (`Önceki`, `Oynat/Duraklat`, `Sonraki`, patlatma sürgüsü) dock/öğretim panelinden erişilsin. Aynı öğretim bileşeninden iki kopya/senkron olmayan state yaratma; mümkünse tek instance ve sabit mantıksal konum.
3. Katman aç/kapa, yalnız etriye, yalnız boyuna, parça listesinde seçim, seçili parçaya odaklan, kaynak açıklamaları ve yanlış bilgi vermeme uyarıları korunur. Uzun teknik varsayım açıklaması erişilebilir ama ana sahneyi kaplamaz.
4. Inspector açıkken kendi `overflow-y:auto`; üstte sekme barı sabit kalabilir, içerik kayar. Scroll-bar ve `overscroll-behavior:contain` yalnız bu alan için. Kapanış/yeniden açılışta seçili sekme ve parça seçimi korunur.
5. Inspector kapalıyken canvas genişliğini anında doldurur; tekrar açınca canvas **yeniden yaratılmaz**, bilinçli kamera açısı korunur.

**Doğrulama:** 1920 ve 1366 ekranlarda katmanlar arasında geçiş, öğretim 1→son adım, patlatma 0→100→0, parça seçimi ve detay erişimi; canvas sayısı hâlâ 1, URL paylaşımı hâlâ doğru.

**Kabul:** Öğretim için ana sayfayı aşağı kaydırma ihtiyacı yok; parça listesi ve teknik metinler tümüyle ulaşılabilir.

**Hata/geri dönüş:** Aşağıdan taşınan bileşen event zincirini bozarsa eski callback'leri koruyarak yalnız kompozisyonu düzelt; öğrenme reducer'ı yeniden yazma.

**Durma:** Rapor ve sonraki aşama; **dur**.

### ASAMA_06 — Alt teknik dock: 2B, kesit ve destek alanları

**Giriş:** Merkez sahne ve sağ denetçi aynı viewport'ta.

**Kapsam:** `simulation-viewer.tsx`, `drawing-2d.tsx` kullanımı, `simulation-workspace.tsx`, `view-reducer.ts`, `state/url-state.ts` gerekirse; 2B çizim motorunu değiştirme.

**İş sırası:**
1. Alt dock, sekme çubuğu kapalı halde 40–48px; açıldığında yüksekliğini kullanıcı sürükleyerek değiştirebilir (minimum/maximum viewport'a göre, ör. 22–42dvh). Resize handle klavyeyle de kullanılabilir; `aria-valuenow` vb. uygun. Zorunlu değilse karmaşık bir paket kullanma.
2. `2B Teknik Çizim`, `Kesit`, `Öğretim` gibi gerçek ihtiyaç sekmeleri. Aynı işlevi sağ denetçide tekrarlar hale getirme: **sağ panel açıklama/seçim**, **alt dock görsel/teknik çizim ve yoğun zaman çizelgesi** prensibi.
3. `3B Sahne` modu: 2B dock kapalı, sahne tam alan. `2B + 3B`: 3B sahne açık, 2B **aynı viewport'taki** dock/bölünmüş panelde görünür; `2B Çizim`: 2B ana alana geçer, 3B context korunur ve geri dönüşte canvas yeniden oluşturulmaz. URL codec ve reducer testleri yeni varsayılan `3d` dahil çalışır.
4. Dock açılınca 3B yükseklik elastik küçülsün; kritik minimumu koruyamayan küçük ekranlarda alt sheet overlay çözümüne geçsin. Alt dock scroll içeride olur, sahne sayfanın altında kaybolmaz.
5. `Drawing2DPreview` tek kaynak/bileşen olarak kalır; 2B–3B canlı katman, kesit ve seçili parça senkronizasyonu korunur. Kesit sürgüsü teknik çizimle çapraz state tutarsızlığı yaratmaz.
6. 2B/3B mod geçişlerinden önce ve sonra kamera aspect, `ResizeObserver`, `hidden` stratejisi ve seçilen part odak testleri. 0×0 canvas render ve kayıp WebGL context olmamalı.

**Doğrulama:** `kiris-detayi` 2B+3B kesit animasyonu; `radye-temel` yoğun çizim; kolon sahnesinde selectedPart; kamera orbit → 2B → 3B dönüşü aynı pozisyonda. Dock 3 kez aç/kapa canvasCount=1.

**Kabul:** Kullanıcının 'sürekli aşağı inmek' sorunu teknik çizim ve öğrenme dahil ortadan kalkmış; modal yüzünden sahne tamamen kapanmıyor.

**Hata/geri dönüş:** Dock/drawing yeniden mount zorunluysa yalnız 2B drawing yeniden oluşturulabilir, ama 3B motorun yeniden kurulması yasak; karmaşık resizable drag riskliyse sağlam kademeli yükseklik seçimiyle çöz.

**Durma:** Kısa rapor; **dur**.

### ASAMA_07 — Mobil, tablet, klavye, odak ve tam ekran

**Giriş:** Desktop layout ve dock sağlam.

**Kapsam:** Bu görev kapsamında UI ve küçük event handling; global navigasyon değişmez.

**İş sırası:**
1. 1024–1279 arası sağ paneli sahnenin altına koymak yerine overlay drawer. 768–1023 tablet, 320/390/430 telefon ve yatay 844×390 için modal/sheet konumunu safe-area ile ayarla.
2. Telefon ilk açılışında ana 3B sahneyi görünür tut; dock varsayılan kapalı, denetçi kullanıcı eylemiyle açılır. Açık sheet maksimum makul ekran payı kaplar, içinde kaydırılır, kapatmak tek dokunuştur. Alt mobil site navigasyonuyla üst üste binmez.
3. Dokunma: bir parmak orbit, iki parmak dolly/pan; sheet'e dokunma/yukarı kaydırma 3B kamerayı oynatmaz. Mobil `touch-action` yalnız uygun container'da, global/body seviyesinde yasak. Pointer cancel ve gesture sonu yanlış parça seçimi engellenir.
4. ESC kapatma önceliği: açık alt panel → açık denetçi/drawer → odak modu → native fullscreen; UI semantiğine göre net ve tek sonuç. Yerel seçim/sürgü değişiklikleri kaybolmasın. Fullscreen desteklenmeyen iOS benzeri ortamlarda odak modu güvenli fallback; tam ekrandan çıkınca sayfa scroll/focus kilidi kalmasın.
5. Erişilebilir komutlar: `F`=Sığdır, `1/2/3`=3B/Split/2B, `?`=Kısayollar (yalnız aktif odaklı stüdyo içinde, input ve contentEditable değilken). Kısayollar çakışıyorsa zorunlu ekleme yerine toolbar/tooltip çöz. Buton odak sırası mantıklı, tüm dokunma hedefleri en az 44×44 px.
6. `prefers-reduced-motion` altında kaydırma/çekmece animasyonu azalt, otomatik öğretim oynatımı ilgili mevcut tercihle uyumlu olsun; görünüm/URL paylaşımı değişmemeli.

**Doğrulama:** 320×568, 390×844, 430×932, 768×1024, 1024×768, 844×390; light/dark; mobil klavye açma/kapatma; sheet scroll, orientation change; klavye ESC/Tab. Yatay taşma 0px ve kontrol erişimi tam.

**Kabul:** Ekran yüksekliği kısa olduğunda bile kullanıcı hiçbir bilgiye erişimini kaybetmiyor; sahne yanlış gesture ile dönmüyor; mobil alt bar bozulmuyor.

**Hata/geri dönüş:** Çok kısa ekranlarda kontrollü yedek kaydırmaya izin ver; bilginin kliplenmesini 'kaydırmasız' görünüm diye kabul etme.

**Durma:** Rapor; **dur**.

### ASAMA_08 — Altı sahne, etkileşim, performans ve adversarial kontrol

**Giriş:** `ASAMA_02`–`ASAMA_07` kodu yerelde hazır.

**Kapsam:** Var olan testleri güncelle; `tests/site-audit/simulations-studio-layout.spec.ts` ve gerektiğinde aynı klasörde tek odaklı yeni `simulations-studio-interactions.spec.ts`, `tests/simulations/**`. Gereksiz bağımlılık yok.

**İş sırası:**
1. Kontrol seçicilerini kaynak dosyalardan gerçek `data-testid` ile al. Eski davranışları koruyan testleri **silerek geçirme**; yeni layout nedeniyle beklenen konumu güncelle ve sebebini not et.
2. Model matrisi: altı slug'da sahne yüklenmesi, WebGL canvas=1, `Sığdır`, beton/katman/öğretim, 2B/3B/split, kesit, paylaşım/deep-link, reset. Özellikle ilk açılışta model görünürlüğü: yalnız `drawCalls>0` yeterli değil; görünür viewport'ta doğrulanabilir model bbox veya temel screenshot karşılaştırması. Render edilen çizgi-grid'i model diye kabul etme.
3. Kamera matrisi: 100px mouse drag azimuth/polar farkı belirlenen kabul aralığında (başlangıç baseline'ından daha az); wheel 3 adım, zoom tuşları, sağ drag pan, click-to-pick, pointercancel, pinch. En az iki farklı viewport boyutunda test et. Orbit eşiği toleransını cihaz/DPR'a göre ölçülebilir tanımla; sihirli çok sıkı piksel eşiği test kırılganlığı üretmesin.
4. Scroll matrisi: normal desktop ilk açılış, denetçi uzun metin, alt dock uzun 2B, aç/kapa, odak/fullscreen sonrası `page.scrollY`, inspector.scrollTop, dock.scrollTop ve kontrollerin boundingBox'ları. Sağ panel scroll edilirken sahnenin açısı değişmemeli; canvas wheel'inde zoom olurken sayfa kaymamalı.
5. Viewport matrisi: `320×568`, `390×844`, `430×932`, `768×1024`, `844×390`, `1024×768`, `1366×768`, `1920×1080`, `2560×1440`; %125 ve %150 zoom en az desktop'ta; light/dark ve `reduced-motion`.
6. Performans: panel/sekme/resize sırasında renderer/canvas örneği sayısı korunur; model sahnesi yeniden yüklenmez; dinlenmede ~3 saniye sonra yeni draw frame üretilmez. WebGL context loss fallback eskisi gibi çalışır. Memory leak için panel aç/kapa 20–30 tekrar, event listener temizliği ve frame sayısı karşılaştırması. Ağ isteği/React hydration hatası olmasın.
7. Önce hızlı kontroller, sonra geniş kapı: ilgili `eslint` kapsamı, `npx tsc -p tsconfig.next.json --noEmit --incremental false`, `npm run check:simulations:model`, hedefli Playwright; en son `npm run check:simulations`. `npm run build` final aşamada. Test scriptlerinin timeout/try-finally/browser.close kuralları `.agents/rules/test-ve-otomasyon-standardi.md` ile uyumlu.
8. Kırılan kabul ölçütlerini **aynı aşama içinde** düzelt, kanıtı yenile. Başarısız testi skip/delete etme; test edilmedi yazan yeri PASS sayma.

**Doğrulama:** Komut çıktıları, kısa test matrisi PASS/FAIL ve sahnelerin kritik ekran görüntüleri. Testleri gerçek DOM/testid üzerinden deterministik yap; her aşamada tüm ağır süiti tekrar çalıştırma.

**Kabul:** Zorunlu senaryolar PASS; yatay overflow yok; desktop ana kullanım için sayfa scroll zorunlu değil; sahne hissi düşük hassasiyetli ve stabil; performans kötüleşmemiş; a11y kritik hata yok.

**Hata/geri dönüş:** Bir test setup nedeniyle bozuksa setup'ı düzelt; asılı kalan kendi başlattığı browser/process'i kapat. Genel kalite kapısı engelli ise nedenini ayır ve final release'e ilerleme.

**Durma:** Test özeti; **dur**.

### ASAMA_09 — Mimari belge, tek kontrollü release ve final doğrulama

**Giriş:** `ASAMA_08` bütün zorunlu kabulleri geçti; başka kullanıcı işlerinin yerel değişiklikleri gözden geçirildi; repo yayın kuralları tekrar kontrol edildi.

**Kapsam:** `PROJECT.md` simülasyon paragrafı ve uygun yaşayan mimari dosyası, bu görevin `IMPLEMENTATION_STATE.md`, ilgili test kaynakları; yalnız gerekli yayın dosyaları.

**İş sırası:**
1. Yeni layout/kamera/input/scroll sözleşmesini `docs/simulasyonlar/3B_STUDIO_ARCHITECTURE.md` içine **ek revizyon** olarak geçir; önceki baseline/plan kanıtını silme. Yeni görevin kendi durum kaydını güncelle.
2. `git diff --check`, ilgili lint, `npx tsc -p tsconfig.next.json --noEmit --incremental false`, `npm run check:simulations:model`, ilgili Playwright/mobil matris, `npm run build` (var olan `prebuild` bağımlılıkları dahil) komutlarını yerelde doğrula. Build/test sonuçlarını gerçekten gözlemle, tahmin etme.
3. Yayın kapsamı bu proje standardına göre **final tek checkpoint**: kullanıcı ayrıca yasaklamadıysa tam doğrulanan yerel değişiklikleri anlamlı **tek commit** ile `main`'e push et; bu bir Vercel Production deploy tetikleyebilir. Önce `git status`, branch ve uncommitted başka kullanıcı işlerini ayır; force-push/otomatik reset yok. Ara aşamalarda repo push/deploy **yapma**. O anda repo kuralları özel build/Vercel Linux Preview veya artifact promote gerektiriyorsa sadece bu özel koşulu uygula.
4. Gerekli production deploy `READY` olduğunda **bir kez** temel smoke kontrolü: altı slug HTTP/route, 3B canvas, panel/dock, mobil ekran, konsol kritik hata, temel kamera/katman çalışması. Aynı sonuç için tekrar deploy üretme.
5. Uygulama durumunu `TAMAMLANDI`, `active_stage: null`, `next_stage: null` yap; test kanıtı ve tek release commit bilgisini ekle. Başarısız deploy/test varsa `ENGELLI` de; tamamlandı yazma.

**Doğrulama:** Yerel test/build başarılı ve (yayın yapıldıysa) gerçek production smoke doğrulaması. Doküman/plan state güncel.

**Kabul:** Kullanıcı bir ekranlık rahat mühendislik stüdyosunu canlı kullanabiliyor; yapılan değişikliklerin geri dönüşü tek commit üzerinden izlenebilir.

**Hata/geri dönüş:** Production'da kritik hata varsa ölçüp aynı görev kapsamında hedefli düzeltme planı oluştur; kör retry/noop push yok. Gerekirse repo release/golden kurallarına göre kontrollü revert; ilgisiz çalışma alanını sıfırlama.

**Durma:** Final kısa özet; yeni istek gelmeden ek iş yapma.

## 5. Kesin UX kabul kontrol listesi

- [ ] 1366×768 ekran: 3B sahne, mod değiştirici ve birincil kamera araçları **aşağı kaydırmadan** erişilebilir.
- [ ] 1920×1080 ekran: model sahnenin anlamlı kısmında merkezde, çevresi boş alanla kaybolmuyor; right panel ayrı scroll alıyor.
- [ ] 1024px tablet: right panel canvas altına kilometrelerce eklenen blok değil, kapatılabilir drawer.
- [ ] Mobil 390×844: sahne ilk açılışta görülebilir, alt sheet kullanıcı istediğinde açılır, mobil site nav erişilebilir.
- [ ] Yatay 844×390 ve 320×568: içerik kesilmiyor; zorunluysa kontrollü fallback kullanılıyor.
- [ ] Kiriş, kolon, birleşim, tekil temel, perde, radye: tümünde kamera fit ve katman/picking beklendiği gibi.
- [ ] 100px fare sürükleme eskiye göre daha kontrollü; tekerlek/zoom düğmesi bir seferde modelin içine fırlatmıyor.
- [ ] Sağ panelde fare tekerleği 3B'yi döndürmüyor veya zoomlamıyor; panelin kendi içeriği kayıyor.
- [ ] Alt 2B paneli açılınca browser sayfası aşağı kaymıyor; 3B kamera resetlenmiyor.
- [ ] `3d / split / 2d` geçişleri bir tane WebGL canvas'la gerçekleşiyor; paylaşım linki eski state'i bozmuyor.
- [ ] Kesit, patlatma, öğretim oynatımı, parça seçimi, beton görünürlüğü çalışıyor; teknik eğitim uyarıları duruyor.
- [ ] Light/dark, klavye, reduced motion, browser zoom ve dokunmatik erişilebilir.
- [ ] `npm run check:simulations:model`, ilgili Playwright/UI, typecheck ve production build PASS; hata gizleme/test silme yok.

## 6. Plan yürütme ve kalıcı durum sözleşmesi

**Planı okumak uygulamayı başlatmaz.** Kullanıcı `Başla` veya ilk `devam` yazdığında, uygulayıcı `ASAMA_01`'i başlatır. **Bir `devam` en fazla bir aşamayı bitirir.** Aşama başındaki gerekli kontrol, değişiklik, doğrulama ve düzeltmeler o aşamanın parçasıdır; küçük işler için tekrar izin istenmez. Her aşama sonunda durum kaydedilir, kısa rapor verilir, beklenir. Sonraki aşamaya aynı turda geçilmez.

`docs/simulasyonlar/studio-ux-2026-10-25/IMPLEMENTATION_STATE.md` başlangıç iskeleti:

```yaml
plan_id: SIM-STUDIO-UX-2026-10-25
plan_revision: 1
planning_status: PLAN_HAZIR
execution_status: BASLAMADI
active_stage: null
next_stage: ASAMA_01
completed_stages: []
evidence: []
blockers: []
updated_at: 2026-10-25T20:43:00+03:00
```

Her aşamada `execution_status` (`BASLAMADI`, `DEVAM_EDIYOR`, `ENGELLI`, `TAMAMLANDI`), aktif/sıradaki aşama, testin gerçekten çalıştığı HEAD/working-tree durumu ve kabul kanıtları güncellenir. Kanıt yoksa tamamlandı yazma. Engel varsa bağımlı aşamaya geçme. Yeni oturumda plan + state açılır; eski tamamlanmış aşamalar kendiliğinden tekrar edilmez. Planın bütünü `TAMAMLANDI` ise yalnız `devam` mesajı geldiğinde **"Plan tamamlandı; uygulanacak başka aşama yok."** diyerek dur; commit, test, deploy, cleanup veya ekstra özellik oluşturma. Kullanıcının açık yeni talebi yeni iş kapsamı oluşturur; eski işi sessizce yeniden açma.

### Kullanıcının Gemini ajanına göndereceği **ilk tek mesaj**

> `SIMULASYON_TRADINGVIEW_TARZI_STUDYO_KAMERA_UX_NIHAI_PLAN.md` dosyasını Windows'taki yerel `muhendislik-site` projemde uygula. Hedefim: TradingView'deki gibi sabit ve büyük 3B çalışma alanı, sağda bağımsız kaydırılan denetçi, altta açılır 2B/öğretim paneli, varsayılanlara göre azaltılmış kamera döndürme/zoom/pan hassasiyeti. Mevcut altı model, hesap/geometri verileri, URL, 2B/3B ve tek canvas sistemi kesinlikle bozulmayacak. Önce `PROJECT.md`, `AGENTS.md`, `GEMINI.md`, ilgili repo kuralları, mevcut 3B mimari ve bu planı oku; HEAD/yerel değişikliklerle karşılaştır. Yalnız `ASAMA_01`'i uygula, testlerini çalıştır, yeni görev durum kaydını yaz, kısa rapor ver ve dur. Her sonraki `devam` mesajımda yalnız bir aşama uygula. Ara aşamalarda GitHub push veya Vercel deploy başlatma; planın son yayın aşamasında repo kurallarına uy. Bana rutin uygulama soruları sorma; somut engel varsa bildir. Plan `TAMAMLANDI` olduğunda hiçbir ek işlem yapma.

---

**Planın yaklaşımı:** Önce kamera ve görünürlük, sonra çalışma alanı iskeleti, sonra kontrollere erişim ve paneller, en son test ve tek release. Yalnızca kullanıcı isteğini karşılamak için gereken iş yapılır; daha fazla özellik uğruna mevcut, çalışan simülasyon sistemi riske atılmaz.
