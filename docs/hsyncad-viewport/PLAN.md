# hsynCAD — Uygulama Gibi Tam Pencere Deneyimi ve Kaydırma Kilidi

**Plan ID:** `HSYNCAD_IMMERSIVE_VIEWPORT_2026_10_26`  
**Revizyon:** 1.0 · **Araştırma tarihi:** 26.10.2026 · **Saat dilimi:** Europe/Istanbul  
**Plan durumu:** `PLAN_HAZIR` · **Uygulama durumu:** `BASLAMADI`  
**Uygulayıcı:** ChatGPT, **bu sohbet üzerinden**; erişilebilir GitHub/Vercel/tarayıcı bağlantıları ve çalıştırma ortamı kullanılarak, her aşamada ayrı kullanıcı komutuyla.  
**Proje:** `smitelagwar/muhendislik-site` — `https://muhendislik-site.vercel.app/kategori/araclar/hsyncad`  
**Araştırmada doğrulanan `main` HEAD:** `b60c61b03d49b3c4c1d65d38346f308ed57b7b3a` *(uygulama başlangıcında yeniden kontrol edilecek).*  
**Önemli:** Bu belge yalnızca plandır. Hazırlanması sırasında kod değiştirilmemiş, GitHub'a yazılmamış, Preview/Production deployment başlatılmamıştır.

---

## 1. Ürün hedefi

Mevcut hsynCAD sayfası **tarayıcı sekmesinin kullanılabilir viewport'unu baştan sona** kaplayan bağımsız bir CAD uygulaması gibi davranmalıdır. Siteye ait en üstteki genel navigasyon/arama/tema bandı, global footer, dış kart kenarı, geniş sayfa marjinleri ve sayfa kaydırma çubuğu **yalnızca hsynCAD rotasında** kaldırılacak. hsynCAD logosunun solundaki mevcut **Araçlara dön** geri tuşu korunacak.

Beklenen masaüstü görünümünün şeması:

```text
┌──────────────────────────────  TARAYICI VIEWPORT  ───────────────────────────────┐
│ ←  hsynCAD · ÖN İZLEME          Proje adı                  JSON kaydet · Model aç │
├─────────────────────────────────────────────────────────────────────────────────┤
│ Giriş  Görünüm  Katlar  Proje                                   Kayıt durumu     │
├─────────────────────────────────────────────────────────────────────────────────┤
│ AKS · KOLON · KİRİŞ · PERDE · DÖŞEME · ilgili çizim araçları / ribbon             │
├─────────────────────────────────────────────────────────────────────────────────┤
│ Aktif kat · Yakalama · Dik çizim · Izgara                                          │
├───┬───────────────────────────────┬───────────────────────────┬───────────────────┤
│   │                               │                           │ METRAJ/ÖZELLİKLER │
│ A │       2B ÇİZİM                │          3B SAHNE         │                   │
│ R │       pan / zoom              │          orbit / zoom      │ yalnız bu panel  │
│ A │                               │                           │ gerekirse kayar   │
│ Ç │                               │                           │                   │
├───┴───────────────────────────────┴───────────────────────────┴───────────────────┤
│ Komut girişi                                                                    │
│ İşlem mesajı                                                                    │
│ Durum / koordinat / birim / zoom                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

**"Tam ekran" tanımı:** Tarayıcının sekme, adres çubuğu ve işletim sistemi görev çubuğunu zorla saklamak **değil**; sayfanın tarayıcıya ayrılan görünür alanının tamamını kullanmak. F11 veya Fullscreen API mecburiyeti olmayacak.

**Mutlak davranış:** Sayfanın **kendisi** aşağı/yukarı hareket etmemeli; ancak çizim yüzeyindeki pan/zoom, 3B orbit/zoom, ribbon'ın gerektiğinde yatay kayması ve metraj/özellikler panelinin **kendi içindeki** kaydırma çalışmalı. Kaydırma kilidi, kontrolleri erişilemez hale getirmek anlamına gelmez.

### Kapsam dışında

- CAD geometrisi, aks/kolon/kiriş/perde/döşeme hesapları, metraj algoritması ve veri şemasını değiştirmek.
- hsynCAD'i yeni bir 3B motora geçirmek, paket yükseltmek, çizim matematiğini yeniden yazmak.
- Ana siteyi, başka hesaplama araçlarını veya Belgeler/Dökümantasyon sayfalarını tam ekran yapmak.
- Kiosk modu, otomatik F11, tarayıcı adres çubuğuna müdahale, kalıcı global kaydırma engeli.

## 2. Mevcut durum: doğrulanan gerçekler ve sınırlamalar

### Doğrulandı — GitHub bağlantısından kaynak kodu okunarak

1. `src/app/layout.tsx` bütün sayfaları `SiteShell` içinde oluşturuyor; hsynCAD'e özel bağımsız layout tanımlı değil.
2. `src/components/site-shell.tsx` içinde `usePathname()` var. `/b/` rotası için hâlihazırda genel gezinmeyi dışarıda bırakan özel dal mevcut; **aynı ilke hsynCAD'in tam yoluyla, ayrı bir dal** olarak uygulanabilir.
3. `src/app/kategori/araclar/hsyncad/page.tsx`, `HsynCadWorkbench` ve SEO/JSON-LD çıktısı üretiyor. Bu metadata ve structured data kaldırılmayacak.
4. `src/components/hsyncad/workbench.tsx` içinde uygulamanın kendi başlık/geri düğmesi, ribbon, 2B çizim, 3B sahne, metraj/özellik paneli, komut ve durum barı zaten mevcut.
5. `src/components/hsyncad/workbench.module.css` başlangıç `.root` stili şu an `margin: 18px auto 36px`, `width: calc(100% - 32px)`, `max-width: 1880px`, `border-radius: 12px` kullanıyor. Bu kart görünümü viewport'un kullanılmasını engelliyor.
6. `.hcad-body` halen `height: clamp(540px, 65vh, 800px)` ile çalışıyor. `max-width: 1000px` altında `height: auto` ve alt alta dizilim, `max-width: 700px` altında 2B ve 3B için sabit yükseklikler (`440px`, `350px`) var. Bunlar tam pencere ve scroll kilidiyle doğrudan çelişiyor.
7. Metraj/özellik içeriğinde `.hcad-inspector-content { overflow-y: auto; min-height: 0 }` bulunuyor. Bu davranış korunabilir.
8. `tests/hsyncad/workbench.spec.ts` içinde işlevsel 2B/3B, JSON, veri kalıcılığı, tema ve mobil dokunmatik testleri var. **Mevcut mobil test dikey olarak istiflenmiş 2B/3B sahneleri bekliyor; hedef tasarıma göre bu beklenti bilinçli biçimde yeniden yazılmalı.**
9. `playwright.hsyncad.config.ts` ayrı test konfigürasyonu; varsayılan yerel test URL'si `http://127.0.0.1:3127`.
10. `AGENTS.md`, `.agents/rules/vercel-kurallari.md` ve `vercel.json` gereksiz deploy'u yasaklıyor. `main` Production'a bağlı; `internal-*` ve `chatgpt-*` dallarında otomatik Vercel deployment devre dışı.
11. `package.json` içindeki build `npm run build` → `next build --webpack`; `prebuild` CAD worker/upstream asset/pdfjs kontrollerini içeriyor. Bu sözleşmeye dokunulmayacak.
12. Vercel bağlantısında `muhendislik-site` projesi GitHub `smitelagwar/muhendislik-site` ile eşleşiyor. Erişim, **okuma** için doğrulandı; ilgili yazma/dağıtım yetenekleri işlem anında ayrıca sınanacak.

### Görselden doğrulandı

- Kullanıcının 26 Ekim 2026 ekranında genel site navbarı hsynCAD'in üstünde, CAD yüzeyi ortalanmış bir kart halinde; sağda dikey sayfa scrollbarı var. 2B/3B çalışma yüzeyi daha büyük olabilecekken çevrede boş alan harcanıyor.

### Henüz doğrulanmayanlar / Aşama 01'de araştırılacaklar

- O andaki güncel `main`, GitHub branch korumaları ve başka eşzamanlı geliştirmeler.
- ChatGPT oturumunda yerel Playwright/Node testlerini fiilen çalıştırabilecek bir çalışma ortamı olup olmadığı; yoksa tarayıcı + Vercel Preview ile hangi kabul testlerinin kanıtlanabildiği.
- Mobil Safari/iOS gerçek cihaz davranışı; otomatik simülasyon onun tam eşdeğeri değildir.
- Başka bileşenlerin global overlay/`body` overflow stillerinin CAD rotasındaki etkileşimi.

## 3. Seçilen çözüm ve mimari ilkeler

### 3.1 Yalnız CAD rotasında uygulama kabuğu

`SiteShell` içinde **tam yol eşitliği** kullan:

```tsx
const immersiveCad = pathname === "/kategori/araclar/hsyncad";
```

CAD durumunda normal site `<Navbar />`, genel `<Footer />`, siteden gelen sayfa min-height/üst boşluğu render edilmesin. Onların yerine semantik `<main id="main-content">` altında viewport dolduran uygulama yüzeyi gösterilsin. Mevcut erişilebilirlik gereksinimleri ve gerekli `GlobalOverlays`/bildirim mekanizmaları denetlensin; sadece ilgili işlevi bozmayacak şekilde tutulup konumlandırılsın. `SoftwareApplicationJsonLd`, tema, toast ve CAD içindeki geri düğmesi korunmalı. Yalnız CSS ile navbarı görünmez yapıp DOM'da odaklanabilir bırakmak çözüm değil.

**Neden bu çözüm?** Site geneli için root layout'u değiştirmeden, refresh/geri-ileri gezinmesinde de tutarlı çalışan, tek rotaya özgü render dalı. `pathname.startsWith('/kategori/araclar')` gibi diğer araçlara taşan koşullar kullanılmayacak.

### 3.2 Scroll-lock hiyerarşisi

Önerilen ana düzen:

```css
/* örnek mimari; gerçek selector'lar mevcut module ve route markup'ına uyarlanır */
.cadViewport {
  block-size: 100vh;  /* temel fallback */
  block-size: 100dvh; /* destekleyen tarayıcılarda görünür alan */
  min-block-size: 0;
  overflow: hidden;
}

.root {
  display: flex;
  flex-direction: column;
  inline-size: 100%;
  max-inline-size: none;
  block-size: 100%;
  min-block-size: 0;
  margin: 0;
  border-radius: 0;
  box-shadow: none;
  overflow: hidden;
}

.root :global(.hcad-body) {
  flex: 1 1 auto;
  block-size: auto;      /* eski clamp/auto yüksekliklerini geçersiz kıl */
  min-block-size: 0;
  overflow: hidden;
}

.root :global(.hcad-views),
.root :global(.hcad-plan-wrap),
.root :global(.hcad-inspector) {
  min-inline-size: 0;
  min-block-size: 0;
}
.root :global(.hcad-inspector-content) {
  overflow-y: auto;
  overscroll-behavior: contain;
}
```

Uygulamada inline CSS/`!important` yığını üretme; eski 1000/700 px medya sorgularındaki karşıt yükseklikleri bilinçli kaldır/dönüştür. Body'ye küresel `overflow:hidden` koymak yerine önce CAD'e özel kabuk ile gerçek `scrollHeight` ölçümünü çöz. Küresel body kilidi zorunlu kalırsa **yalnız CAD rotası açıkken** güvenli mount/unmount temizliğiyle uygulanmalı; route değişince ve bileşen unmount olunca eski değer aynen geri yüklenmeli. Şarta bağlı `wheel.preventDefault()` ve `touchmove.preventDefault()` ile CAD kamera etkileşimlerini körlemesine kapatma.

### 3.3 Başlıklar ve alan dağıtımı

- hsynCAD başlık, sekmeler, ribbon ve çalışma üst barı kendi doğal yüksekliğini alsın.
- **2B/3B/metraj içeren ana gövde**, bunlardan ve alt komut/mesaj/durum satırlarından **geriye kalan yüksekliği** doldursun; body için 65vh/clamp/sabit 540px kullanma.
- Masaüstünde 2B + 3B aynı anda ve yaklaşık dengeli iki kolon; sağ inspector sabit fakat makul responsive genişlikte. Sıfır içerikte dahi çizim sahnesi yükseklik almalı.
- `Aks` seçenekleri açıldığında ribbon'a/sahneye alan yetmediği için sayfa uzamasın; varsa seçenekler dikey alanı kontrollü alsın veya erişilebilir, iç kaydırmalı panel/çekmeceye dönüşsün. Aynı kural uzun uyarılar, çok kat ve çok eleman için geçerli.
- Uzun yatay ribbon kayan bölge olacaksa yalnız **ribbon içinde** kayabilsin; global sayfayı taşırmasın.
- Alttaki komut, mesaj, durum satırı kesilmeden görülmeli. Mevcut `.hcad-bottom-help` düşük yükseklikte bir ek satır harcıyorsa bunu durum çubuğuyla kompakt şekilde birleştir veya ikincil yardıma taşı; **geri alma, örnek açma gibi işlemleri yok etme**.
- Light/dark tutarlılığı korunmalı; çizim yüzeyleri yeniden boyutlandığında 2B SVG koordinat dönüşümleri ve 3B canvas/aspect/camera bozulmamalı. Sadece gerekli `ResizeObserver` / mevcut resize mekanizması kullanılmalı; sürekli `requestAnimationFrame` ölçüm döngüsü yaratılmamalı.

### 3.4 Tablet ve telefon için ayrı, kaydırmasız kullanım

Mevcut **alt alta 2B + 3B + metraj** mobil tasarımı kaldırılacak. 320–1000px uygun eşik ve fiziksel yükseklik koşullarında **tek çalışma alanı + mod anahtarı** kullanılacak:

- `2B` / `3B` görünüm geçişi: bir anda bir sahne görünür, ikisi de modal/çekmece mantığıyla erişilebilir. Geçişte model/kamera veya seçili eleman kaybolmamalı; görünür sahne doğru boyuta yeniden ölçülmeli.
- `Metraj / Özellikler` içeriği mobilde yer tutmayan erişilebilir drawer/bottom sheet veya ikincil panel şeklinde açılır; açıldığında **drawer'ın içi** kayabilir. İçerik kapandığında viewport alanı sahneye geri döner.
- Ribbon ve araçların uzunluğu, ayrı sekme/kompakt araç menüsü/yatay iç kaydırma ile yönetilir. 320×568 gibi kısa ekranda 2B çizim alanı tamamen yok olmaz; temel araçlara ve geri düğmesine ulaşılır.
- Mobil sanal klavye açılınca koordinat/komut girdisi görünür kalır; `visualViewport` gerektiği kadar kullanılır. Fokus yer değiştirdiğinde sayfa değil uygun iç bölge hareket eder. iOS safe-area `env(safe-area-inset-*)` ve yatay ekran unutulmaz.
- 2B tek parmak dokunma/iki parmak pinch-pan, 3B sürükleme, scroll-zoom, mouse ve klavye kısayolları korunur. Inspector açıkken yanlışlıkla model üzerinde çizim tetiklenmez.
- Hareket azaltma tercihi ve `aria` etiket/fokus yönetimi uygulanır; erişilebilir kontroller CSS ile görünmez olsalar bile Tab sırasına sızmaz (`inert`/uygun koşullu render).

> **Not:** Tablet/küçük laptopta iki sahnenin yatay birlikte sığması mümkünse aynı anda görünüm tercih edilir; yalnız px eşiklerine değil **kullanılabilir yüksekliğe** de bakılır. Mobilde tüm panel içeriğini tek viewport'a zorla sıkıştırma; uygulama kabuğu sabit, iç yüzeyler kontrollü scrollable olacaktır.

### 3.5 Geri gezinme ve veri güvenliği

- hsynCAD sol ok `Link href="/kategori/araclar"` korunur. Direkt deep linkten giriş, geri butonu, router Back/Forward, refresh ve tema değişimi çalışmalı.
- Otomatik localStorage kayıt/JSON içe-dışa aktarma, `Undo/Redo`, seçme/taşıma/pan, snap/ortho, katlar, metraj doğruluğu değişmemeli.
- Geometri/metraj modeli verilerini viewport tercihi için farklı şemaya taşımaya gerek yoktur. Kullanıcı verisini silen reset/clear işlemi yoktur.

## 4. Aşama özeti

| Aşama | Çıktı | Uzak deploy |
|---|---|---|
| `ASAMA_01` | Güncel kod/test/erişim baz çizgisi, çalışma branch'i, durum kaydı | **Yok** |
| `ASAMA_02` | CAD'e özel SiteShell; navbar/footer kaldırma, viewport kabuğu | **Yok** |
| `ASAMA_03` | Masaüstü gerçek kalan-yükseklik yerleşimi, scroll lock ve resize | **Yok** |
| `ASAMA_04` | Tablet/mobil viewport UX ve iç panel gezinmesi | **Yok** |
| `ASAMA_05` | Regresyon testleri, tarayıcı matrisi, mümkünse **tek kontrollü Preview** + 3 dk doğrulama penceresi | **0 veya 1 Preview** |
| `ASAMA_06` | Final düzeltme, release gate, tek atomik `main` PR merge, **1 Production** + 3 dk doğrulama penceresi | **En fazla 1 Production** |

**Deploy bütçesi:** Hedef 0–1 Preview, en fazla 1 Production. Ek deployment sadece ayrı ve açık kullanıcı talebiyle. Korunan `internal-*` branch'inden otomatik Preview bekleme: `vercel.json` bu dalları devre dışı bırakıyor; Preview gerçekten gerekiyorsa erişilebilir Vercel `create_deployment` Git source yolunun bu durumu destekleyip desteklemediği doğrulanacak. **Preview'a zorlamak için `vercel.json`'ı değiştirme.**

---

## 5. Ayrıntılı uygulama aşamaları

### ASAMA_01 — Korunaklı başlangıç ve gerçek baseline

**Amaç:** Kodun güncel sürümünü koruyarak güvenli uygulama zemini oluşturmak.

**Giriş:** Bu plan; GitHub/Vercel okuma bağlantıları; kullanıcıdan ilk `başla` veya `devam`.

**Kapsam ve sıra:**

1. `PROJECT.md` → `AGENTS.md` → `.agents/rules/vercel-kurallari.md` ve `.agents/rules/test-ve-otomasyon-standardi.md` → görevle ilgili yaşayan docs belgeleri sırasıyla okunur. CAD/DXF koruma kuralı **dokümantasyon viewer motoruyla ilgiliyse** kapsam açısından değerlendirilir; bu işte motoru değiştirmeye kalkışılmaz.
2. `main` HEAD SHA, aktif deployment SHA, root `SiteShell`, CAD workbench, CSS, 2B/3B sahne boyutlandırma ve mevcut testler yeniden alınır. Kullanıcının sonradan yaptığı commit ve diğer çalışma dalları ezilmez.
3. Uygun bağlantı izni varsa `internal-hsyncad-viewport` veya çakışmayan bir `internal-*` çalışma branch'i açılır. Ara uzaktan checkpoint'lerde `[skip ci]` veya `[skip vercel]`; doğrudan `main`'e yazılmaz.
4. Mevcut test ortamı/araç imkânları belirlenir. Yerel çalışma ağacı mevcut değilse varmış gibi `npm run ...` çalıştırılmış raporlanmaz; GitHub CI, tarayıcı otomasyonu, Vercel Preview ve mümkünse geçici izolasyonlu test workspace seçenekleri somut olarak değerlendirilir.
5. Uygulama başlatıldığında bu planı `docs/hsyncad-viewport/PLAN.md`, ilerlemeyi `docs/hsyncad-viewport/IMPLEMENTATION_STATE.md` olarak *çalışma branch'inde* tut (mevcut aynı adlı dosya varsa ezmeden incele); durum şu şemada tutulur:

```yaml
plan_id: HSYNCAD_IMMERSIVE_VIEWPORT_2026_10_26
plan_revision: 1
planning_status: PLAN_HAZIR
execution_status: DEVAM_EDIYOR
active_stage: ASAMA_01
next_stage: ASAMA_02
completed_stages: []
evidence: []
blockers: []
updated_at: 2026-10-26T00:00:00+03:00  # örnek; gerçek zamanla değiştirilir
```

**Doğrulama:** Main SHA, branch/ref, değişiklik diff'i, repo talimatları, izin sınırları, mevcut CAD testlerinin senaryoları ve o anki Production URL raporlanır. **Başarı ölçütü:** Doğru hedef ve korunan branch kanıtlandı; yazma varsa yalnız plan/durum tek checkpoint; CAD işlevi değiştirilmedi.

**Hata / geri dönüş:** Branch izni yoksa main'e yazmaya kaçma. Eksik yetkiyi `ENGELLI` olarak bildir; güvenli alternatifi sun. Başka ajanların değişikliklerini force-reset etme.

**Durma noktası:** `ASAMA_01` kanıtlarıyla kısa özet, **sonraki aşamaya kendiliğinden geçme**.

### ASAMA_02 — Genel site çubuğunu yalnız hsynCAD'den çıkar

**Giriş:** `ASAMA_01` tamam; branch güncel.

**Dosyalar:** `src/components/site-shell.tsx`, gerekirse `src/app/kategori/araclar/hsyncad/page.tsx`, CAD route için sınırlı stil; testler.

**Uygulama sırası:**

1. `pathname === "/kategori/araclar/hsyncad"` dalında normal `<Navbar />` ve `<Footer />` kaldır; `<main id="main-content">` ve ilgili gerekli overlays/Toaster erişilebilir kalsın. Mevcut `/b/` dalı ve normal sayfalar aynı davranışı sürdürsün.
2. CAD ana sayfa kapsayıcısını tarayıcının görünür alanına bağla; `html/body`'ye kalıcı global sınıf ekleme. `100vh` fallback + `100dvh`, `min-height:0`, scoped `overflow:hidden` kullan.
3. CAD logo solundaki ok, başlık, model dosyası düğmeleri ve JSON-LD kaldığı doğrulansın.
4. Aynı route üzerinden refresh ve başka sayfaya SPA geçişte SiteShell doğru farklı dala dönsün. Odak atlama bağlantısı işlevini korumak için gerekirse CAD dalında da gizli erişilebilir link kullan.

**Doğrulama ve kabul:** CAD'de global navbar/footer yok, kendi hsynCAD başlığı var. `/kategori/araclar` ve `/kategori/araclar/donati-hesabi` gibi diğer rotalarda normal navbar/footer var. Sayfa değiştirme tema/overlay/geri yolu bozulmamış. Sonuç uygun test veya gerçek tarayıcı gözlemiyle kanıtlı.

**Hata / geri dönüş:** Yanlış rota etkilenirse yalnız CAD'e özel branch koşulu geri alınır, diğer düzenler korunur.

**Durma noktası:** Tek kapsamlı `internal-*` checkpoint; kısa sonuç; bekle.

### ASAMA_03 — Masaüstü %100 çalışma alanı, esnek yükseklik ve scroll kilidi

**Giriş:** `ASAMA_02` tamam.

**Dosyalar:** `src/components/hsyncad/workbench.module.css`, gerekliyse `workbench.tsx`, 2B/3B ilgili mevcut resize bileşenleri.

**Uygulama sırası:**

1. `.root` dış `margin`, `max-width`, kenar yuvarlama, gölge ve sabit dış boşlukları kaldır. Ekrana yapışık, kesintisiz uygulama hissi ver; mevcut renk paletini değiştirip tasarımı bozma.
2. `.root` dikey flex column, `height:100%`, ana `.hcad-body` kalan boşluğu alan `flex:1; min-height:0` düzenine geçer. `.hcad-body height:clamp(...)`, tablet `height:auto` ve mobil sabit sahne yükseklikleriyle çatışmalar bilinçli düzenlenir.
3. `2B`, `3B`, inspector `min-width:0/min-height:0`; yatay/vertical overflow yalnız ilgili panelde. 3B canvas ebeveyn boyutuna göre doğru yeniden ölçülmeli; ölçüm değişiminden sonra render kapanmamalı/kamera sıfırlanmamalı.
4. Üst araçlar ve alttaki 3 durum satırı viewport içinde görünür tutulur. Kısa ekranlarda yalnız sekonder yardım metni kısaltılabilir; komut ve asıl CAD kontrolleri kaybolamaz. Aks ayarı gibi koşullu açılan modüllerin yüksekliği kontrol edilir.
5. `document.scrollingElement.scrollHeight <= document.scrollingElement.clientHeight + 1` eşitsizliği CAD sayfasında test edilir. Mouse wheel, trackpad ve PageDown uygulamayı aşağı taşıyamaz; **çizim üzerindeki wheel CAD zoom'unu sürdürür**, inspector üzerinde wheel inspector içini kaydırır. Wheel kilidinin zoom olaylarını yakalamadığı kontrol edilir.

**Ölçüm matrisi:** Desktop 1920×1080, 1640×900, 1366×768, 1280×720 ve 1024×768; tarayıcı zoom %80/%100/%125 (uygunsa %150); light/dark. Kısa yükseklik için 1366×600 ayrıca dene. Browser viewport yüksekliği toolbar harici görünür CSS pikseldir.

**Kabul:** Sayfa scroll pozisyonu her etkileşimden sonra 0 (tolerans ≤1 px); 2B ve 3B panelin görünür alanı pozitif ve etkileşimli; sağ panel ve alt barlar erişilebilir; yatay document overflow yok; çizim zoom/pan ve 3B orbit etkilenmemiş.

**Hata / geri dönüş:** Bir tarayıcıda `dvh` davranışı bozulursa sadece CAD kapsayıcısında fallback/visualViewport iyileştirilir; global `html * {overflow:hidden}` benzeri müdahale yok. Kapsam dışı dosyalar değiştirilmez.

**Durma noktası:** Ölçümler/test kanıtı ve bir checkpoint; bekle.

### ASAMA_04 — Dar ekranlarda CAD programı gibi panel geçişi

**Giriş:** `ASAMA_03` tamam.

**Dosyalar:** `workbench.tsx`, `workbench.module.css`, gerekiyorsa `scene3d.tsx`/`plan2d.tsx` boyut tepki katmanı; mevcut testler.

**Uygulama sırası:**

1. 1000 px altındaki eski `2B üstte, 3B altta, inspector onun altında` davranışını sona erdir. Dar viewport'ta `2B | 3B` çalışma alanı anahtarı sun; viewport yüksekliği ve genişliğine bağlı uygun mod seçimi olsun.
2. Sağ inspector, mobilde açılıp kapanan erişilebilir `Metraj/Özellikler` drawer/sheet olur. İçinde tablar, eleman listesi, değerler ve alan düzenlemeleri kaydırılabilir. Fonksiyonları kaldırma.
3. Açılır panel odağı yönetilir, `Escape` kapatır, kapatırken odak tetikleyiciye döner. Drawer kapalıyken gizli odaklanabilir eleman bırakılmaz; açıldığında yanlışlıkla sahneye işlem gitmez.
4. Ribbon/kat bilgisi/koordinat girişi kompakt, erişilebilir düzenlenir. 320 px genişlikte taşan araçlar yerel yatay kaydırma veya menüyle erişilebilir; ana document'ı yatay/dikey taşırma.
5. Küçük yükseklik ve klavye: `visualViewport`, safe-area, ekran döndürme, 2B pinch ve 3B dokunmatik davranışlarını test et. Gerekirse tek izleme bölmesinin yüksekliği klavyeye göre güncellenir.
6. 2B/3B geçişinde model aynı kalır. Hidden 3B canvas'ın `0×0` kalması veya stale buffer varsa görünür olduğunda mevcut WebGL/resize sözleşmesine uygun tek seferlik ölçüm tetikle. Yeni renderer kurma.

**Ölçüm matrisi:** 320×568, 360×740, 390×844, 430×932, 768×1024, 1024×768 ve 844×390 yatay. Mobil tema çift yönlü. Sahne seçme, çizim/undo, metraj görüntüleme, JSON indir/aç ve geri dönüş senaryoları.

**Kabul:** Mobil sayfa kaymıyor; 2B ve 3B erişilebilir ve çizime elverişli; drawer içi gerektiğinde kayabiliyor; koordinat/komut girişi klavyeyle yapılabiliyor; yatay scrollbar document üzerinde yok. Mevcut mobil Playwright testi, **eski dikey istiflenme beklentisi** yerine yeni panel geçişi sözleşmesini doğruluyor.

**Hata / geri dönüş:** Ana fonksiyonu erişilemez kılan kontrol gizlemesi, hesap/state değiştirmesi veya mobilde boş canvas engeldir. Yalnız ilgili mobil düzen revize edilir.

**Durma noktası:** Yeni mobil kontroller için kanıt/checkpoint; bekle.

### ASAMA_05 — Gerçek regresyon ve kontrollü Preview

**Giriş:** `ASAMA_04` tamam, değişiklikler korumalı branch'te.

**Dosyalar:** `tests/hsyncad/workbench.spec.ts`, gerektiğinde `tests/hsyncad/viewport.spec.ts` *(yeni, gerçekten ihtiyaç varsa)* ve `playwright.hsyncad.config.ts` *(gerekirse; 3127 mevcut varsayılan korunur)*.

**Test sırası:**

1. Önce çalışma ortamındaki gerçek komutlar doğrulanır. Yerel workspace varsa mevcut scriptlerle sırasıyla **hedefli eslint**, `npx tsc --noEmit --incremental false`, `npm run build` ve `npx playwright test --config=playwright.hsyncad.config.ts` çalıştırılır; ilgili timeout/cleanup standardına uyulur. Bunlardan biri çalıştırılamıyorsa **çalıştı diye raporlanmaz**.
2. Basit statik test yerine gerçek tarayıcı viewport testi ekle. `document.scrollingElement` boyutları, `window.scrollY`, wheel, PageDown, trackpad emülasyonu, drawer iç scroll, 2B zoom, 3B orbit, ribbon iç scroll ve rota dışına çıkış kontrollü assertions ile kapsanır.
3. hsynCAD'in mevcut işlevsel CAD testleri korunur: 4×4 m demo, toplam 8,089 m³ net beton hacmi ve 83,80 m² kalıp alanı, geometri, snap, taşıma, Undo/Redo, JSON roundtrip, localStorage, iki tema, WebGL, file import, mobil dokunma. Mevcut testteki `scrollIntoViewIfNeeded()` gibi çağrıların yeni tasarımla gereksiz hale gelmesi test seçimlerini doğrulamak için gözden geçirilir; işlevi devre dışı bırakmak için test silinmez.
4. CSS/JS tarayıcı konsol hatası, hydration hata/uyarısı, import/persistence hatası, 404 network asset ve 3B canvas context kaybı kontrol edilir. Farklı boyutlarda ekran görüntüleri karşılaştırılır.
5. Başka sayfaya geç, geri dön, SPA route/refresh yap; CAD dışındaki Navbar/Footer ve normal scroll geri gelmiş olmalı. Doğrudan CAD URL'sini açma da test edilir.
6. **Preview gerçekten gerekliyse ve Vercel bağlantısı destekliyorsa**, Vercel `create_deployment` ile `internal-*` branch'in **kesin commit SHA'sından** tek kontrollü `target: preview` isteği gönder; branch'in auto-deploy engelini kaldırma. Önce API'nin hangi Git source/izin kombinasyonunu desteklediğini doğrula. Aynı SHA'ya tekrar tekrar Preview başlatma.

**3 dakikalık Preview kuralı (kullanıcının isteği):**

- Deploy isteğinin kabul edildiği saati `t0` olarak kaydet. **En erken `t0+180 saniye` noktasında** nihai Preview durumu değerlendirilir.
- Bu aralıkta **boş yere deployment ekranını bekleyip bloklanma**: test sonuçlarını topla, ekran boyutu karşılaştırmalarını ve release checklist'ini hazırla, CSS diff/erişilebilirlik/geri dönüş kontrollerini tamamla. Araç imkânı varsa non-blocking kısa durum okumaları yapılabilir; yeni deploy başlatılmaz.
- 180 saniye dolmadan `READY` görünse bile kod hâlâ aynı SHA için doğrulanmalı. 180 saniye dolduğunda `READY` yoksa **başarılı demeden** makul aralıkla durum/log kontrolüne devam et; hata varsa deployment zorlama döngüsüne girme.
- ChatGPT oturumu arasında **arka planda çalışmanın sürdüğü varsayılmaz**. Bir sonraki kullanıcı mesajında gerçek deployment zamanı/ID üzerinden kaldığı yerden durum okunur; 180 saniye doldu diye hiçbir şeyin otomatik test edildiği iddia edilmez.

**Kabul:** Çalıştırılmış testler PASS kanıtlı; çalıştırılamayan kalite kapıları açıkça belirtilmiş; Preview kullanıldıysa `READY`, aynı SHA, görsel ve işlevsel kabul. Gerekli kabul testini çalıştıracak hiçbir ortam yoksa Production'a **kanıtsız** ilerleme değil `ENGELLI` durumu.

**Hata / geri dönüş:** Sadece başarısız testi ve ilgili kodu düzelt; deploy kotasını tüketme. Vercel Preview yolunun mevcut branch koruması yüzünden desteklenmediği anlaşıldıysa bunu raporla; yayın için zorunlu kod/test gate'i yine sağla. 

**Durma noktası:** Test matrisi özeti, Preview ID/URL (varsa), başlangıç SHA'sı, doğrulama ve gerekli hata kanıtı; bekle.

### ASAMA_06 — Final kabul, tek Production, 3 dakikalık gözlem

**Giriş:** `ASAMA_05` zorunlu gate'leri başarılı; bekleyen kullanıcı/başka ajan değişikliği kontrol edilmiş; branch diff'i temiz ve konuya odaklı.

**Kapsam:** Yalnız final düzeltmeler, `docs/hsyncad-viewport` durum belgesi ve güvenli release.

**Sıra:**

1. İşlev değişikliği içermeyen son kod okuması: global navbar/footer başka route'ta bozulmadı mı, CAD kısayolları/model/metraj aynı mı, preview/test SHA sabit mi? Son değişiklik test kanıtını etkiliyorsa ilgili test yeniden çalıştırılır.
2. `internal-*` dalındaki değişiklikler tek anlamlı final diff olarak hazırlanır. `main` HEAD güncel mi? Araya yeni commit girdiyse güvenli birleştirme, çakışma kontrolü ve etkilenen testlerin yeniden doğrulaması yapılır. Force push / hard reset yok.
3. Repo kuralına uyarak **PR üzerinden** `main`'e tek kontrollü **squash merge** yapılır (PR hakkı ve testler uygunsa); ara ve deneysel commitler main'e taşınmaz. `main`'e doğrudan dosya dosya yazılmaz.
4. `main` merge'in tetiklediği **tek Production deployment** izlenir; ayrı manuel Production deployment başlatılıp çift build oluşturulmaz. Deployment'ın `main` merge SHA'sına ait olduğu doğrulanır.
5. **Production 3 dk kuralı:** Tetikleme `t0` saatini ve deployment ID'yi kaydet; `t0+180 saniye` öncesi beklerken **başka bağımsız yararlı iş** yap: PR kapanış/diff doğrulaması, yayın kontrol listesi, mobil/masaüstü test sonuçları, regresyon özeti, fallback planı. `READY` çıktısı veya bitişi uydurma; 180 saniye dolunca durum/log kontrolü, beklenenden uzun sürerse nedenini bildir ve deployment tamamlanana kadar başarı ilan etme. Esas süre 180 saniyelik **minimum gözlem aralığı**, "mutlaka 3 dakikada deploy olur" iddiası değil.
6. Production `READY` sonrası **gerçek canlı URL'de** hsynCAD'in tüm pencereye yayıldığı, navbar/footer'ın yalnız bu rotada olmadığı, page scroll'un kilitli olduğu, 2B/3B, metraj, kayıt ve geri dönüşün çalıştığı gözlenir. Basit bir diğer site sayfasında header/footer/normal scroll geri geldiği doğrulanır. Derleme `READY` ama UI kabul başarısızsa `TAMAMLANDI` yazma.
7. Release sonucunu `docs/hsyncad-viewport/IMPLEMENTATION_STATE.md` içinde `execution_status: TAMAMLANDI`, `next_stage: null`, `active_stage: null`, kanıt URL/SHA ve test sonuçlarıyla finalize et. **Durum kaydı için ayrı bir yeni Production deployment tetikleme.** Final durum bilgisini mümkünse release commit'ine dahil et; yayın-sonrası gözlem verisini üretim deploy'u tetiklemeyen ayrı sohbet raporunda veya uygun deploy'suz belgede tut. Gerçek test sonucu ve planlanan testleri ayrı göster.

**Kabul:** Canlı uygulama aşağı/yukarı kaymayan tam pencere CAD; iç paneller kullanılabilir; 2B/3B çizim ve hesap doğru; diğer rotalar etkilenmemiş; Production READY ve canlı smoke PASS. **En fazla bir Production**.

**Hata / geri dönüş:** Üretim kalite sorunu varsa önce üretim riskini değerlendir; mevcut iyi deployment'a platformun desteklediği kontrollü rollback/promote seçeneğiyle dönmeyi değerlendir; yeni bir yığın commit/deploy oluşturma. Rollback kararı/yetkisi yoksa engeli açık bildir. Geçersiz kanıtla `TAMAMLANDI` işaretleme.

**Durma noktası:** Son kısa rapor: URL, SHA, test sayıları/sonuçları, deploy ID/durumu ve kalan sorunlar (varsa). Bütün kabul sağlanınca bitir.

---

## 6. Özellikle yakalanması gereken hatalar

| Risk | Açık kabul testi |
|---|---|
| Site geneline `overflow:hidden` sızması | CAD'den araçlar/ana sayfaya dönünce normal sayfa kaydırılabiliyor |
| Mobilde görünmez 3B canvas | 2B→3B→2B geçişinde sahne görünüyor, dokunma/orbit çalışıyor |
| 1000 px altında eski `height:auto` | 768×1024 ve 390×844'te document scrollbarı yok |
| Ribbon/Aks seçenekleri açıldığında taşma | Her sekme/araç değişiminde root scrollHeight viewport'a eşit |
| Alt komut/durum barının kırpılması | 1366×600 ve mobil yatayda komut, mesaj ve temel durum erişilebilir |
| Inspector scroll yok | Çok sayıda eleman/uyarı varken **yalnız inspector** kayıyor |
| Wheel kilidi 2B zoom'u durdurur | Canvas wheel ile `data-camera.scale` değişiyor; `window.scrollY` değişmiyor |
| Üçüncü taraf overlay erişilemez | Açılan dialog ve toast doğru z-index/fokus/scroll ile çalışıyor |
| Refresh/localStorage veri kaybı | Demo + yeni kolon + reload sonrası model aynı; JSON roundtrip geçiyor |
| Zoom/resize sonrası koordinat kayması | Aynı dünya noktasına tıklama ve snap doğruluğu korunuyor |
| Yanlış route kontrolü | `/kategori/araclar` ve diğer araçlarda navbar/footer görünüyor |
| Browser %125 zoom'da controls taşar | Ekran/katman düzeni kontrol edilebilir, gizli asıl fonksiyon yok |
| Sayfa kilidi ekran okuyucu ve klavyeyi bozar | Tab ile tüm görünür işlemlere erişim, `Escape` drawer kapanışı, fokus geri dönüş |
| Hatalı deploy SHA | Vercel deployment commit'i final PR merge SHA'sıyla eşleşiyor |

**Performans ölçütü:** Bu iş sırf yerleşim için gereksiz çizim/3B render döngüsü eklememeli. Görünüm değiştirme/resize'da kullanıcı fark eder düzeyde gecikme, tekrar mount kaynaklı model sıfırlanması, artan event listener veya sürekli ResizeObserver döngüsü olmamalı. FPS için kanıtsız "60 FPS garantili" iddiasında bulunma; mümkünse öncesi/sonrası ölç.

## 7. Sohbet üzerinden uygulama ve kesin durma protokolü

Bu plan, genel talimatın **bu görev için kullanıcı tarafından açıkça değiştirilmiş uygulayıcı rolünü** esas alır: işlemleri masaüstü Gemini/Codex değil, **ChatGPT bu sohbette** yürütecek. Kullanılan GitHub/Vercel bağlantıları gerçekten yetki veriyorsa yazılacak; test ortamı erişilebilir değilse başarı uydurulmayacak.

1. Şu an istenen şey **plan dosyasıdır**; bu teslimle `ASAMA_01` başlamaz.
2. Sonraki **`başla` veya `devam`** mesajı, kullanıcının ChatGPT'yi uygulayıcı olarak seçtiği bu işte `ASAMA_01`'i başlatır. Bundan sonraki her **`devam`**, **en fazla bir** tamamlanmamış aşamayı başlatır/sürdürür.
3. Her aşamada: mevcut planı/durum kaydını oku → tek aşamayı uygula → doğrula → durumu kaydet → **kısa rapor ver → dur**. Aynı mesajda sonraki aşamaya geçme. Bir aşama tamamlanmadıysa sonraki `devam` o aşamayı sürdürür.
4. Sohbetler arasında arka planda kod yazdığını, test/Preview takip ettiğini veya işin kendiliğinden tamamlandığını ileri sürme. Sadece ilgili çağrılarla gerçekleştirilen işlemleri raporla.
5. `ENGELLI` halinde gerçek engeli ve mümkün olan güvenli yolu bildir; yasaklı branch/deploy kuralını dolanma.
6. Tamamlandıysa sonraki düz `devam` için: **"Plan tamamlandı; uygulanacak başka aşama yok."** Kod, branch veya deployment değiştirme.
7. Kullanıcının yeni bir kapsam isteği gelirse plan revizyonu ve etkilenmiş testler ayrıca değerlendirilir.
8. Her aşama raporu **çok kısa**: `Aşama / yapılan değişiklik / test kanıtı / engel / sonraki aşama`. Tüm planı kullanıcıya yeniden yazma.

## 8. Kaynak ve doğrulanabilir referanslar

- Canlı rota: https://muhendislik-site.vercel.app/kategori/araclar/hsyncad
- GitHub repo: https://github.com/smitelagwar/muhendislik-site
- İncelenen HEAD (`main`, 26.10.2026): https://github.com/smitelagwar/muhendislik-site/commit/b60c61b03d49b3c4c1d65d38346f308ed57b7b3a
- Root shell: https://github.com/smitelagwar/muhendislik-site/blob/main/src/components/site-shell.tsx
- CAD sayfası: https://github.com/smitelagwar/muhendislik-site/blob/main/src/app/kategori/araclar/hsyncad/page.tsx
- CAD iş yüzeyi: https://github.com/smitelagwar/muhendislik-site/blob/main/src/components/hsyncad/workbench.tsx
- CAD CSS: https://github.com/smitelagwar/muhendislik-site/blob/main/src/components/hsyncad/workbench.module.css
- CAD e2e testleri: https://github.com/smitelagwar/muhendislik-site/blob/main/tests/hsyncad/workbench.spec.ts
- Playwright config: https://github.com/smitelagwar/muhendislik-site/blob/main/playwright.hsyncad.config.ts
- Repo kuralları: https://github.com/smitelagwar/muhendislik-site/blob/main/AGENTS.md
- Vercel koruması: https://github.com/smitelagwar/muhendislik-site/blob/main/vercel.json
- Kullanıcının temel plan protokolü (erişim doğrulandı): https://drive.google.com/file/d/1NTyZ9w46wfozM-HH7HQ6rHzE-7HTqhDy/view
- Tasarım kanıtı: sohbet içinde 26.10.2026'da verilen hsynCAD masaüstü ekran görüntüsü.

## 9. İlk uygulama mesajı

> **Başla.** `HSYNCAD_IMMERSIVE_VIEWPORT_2026_10_26` planını **ChatGPT olarak bu sohbetten** uygula. Önce repo talimatlarını, güncel `main` ve varsa ilerleme kaydını kontrol et. Yalnız `ASAMA_01`'i gerçekleştir, izinleri ve test ortamını doğrula, gerekli çalışma branch'ini/durumunu güvenli şekilde oluştur, kanıtları kaydet, çok kısa rapor ver ve dur. Kullanıcının yeni **devam** mesajı olmadan `ASAMA_02`'ye geçme. Plan `TAMAMLANDI` durumundaysa hiçbir işlem yapma.

---

**Son karar:** Dış sayfa scroll'u tamamen kilitli; çizim/3B etkileşimi serbest; uzun detaylar yalnız kendi panelinde kayıyor. Değişiklik yalnız hsynCAD. Fazlar arasında gereksiz deploy yok. Kontrol edilmiş tek Production release ve deployment başlangıcından itibaren **en az 180 saniyelik, başka doğrulamalarla değerlendirilen izleme penceresi** var.