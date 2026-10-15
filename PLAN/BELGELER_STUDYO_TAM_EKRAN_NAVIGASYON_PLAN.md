# İnşa Blog — Belgeler PDF Stüdyoları: Gereksiz Üst Navigasyonu Kaldırma ve Tam Ekran Arayüz

**Plan kimliği:** `INSA-BELGELER-FULLSCREEN-UX-20261016`\
**Revizyon:** 3 (yerel doğrulama düzeltmesi ve kullanıcı onaylı tam-repo lint kapsamı)
**Planlama durumu:** `PLAN_HAZIR` — **Uygulama durumu:** `DEVAM_EDIYOR`
**Araştırma tarihi:** 16 Ekim 2026 (Türkiye saati; kaynaklar bu plan hazırlanırken okundu)\
**Repo:** `https://github.com/smitelagwar/muhendislik-site`\
**Kaynak branch / commit:** `main` / `6d1c6d02ec66035f782a3788fcec8b1777be562a` (planlama anında GitHub API ile okunan HEAD; yerel çalışma ağacının aynı olduğu varsayılmaz).\
**Kullanıcı tarafından istenen uygulama modeli/ayar etiketi:** **`gpt 6 luna extra high`** (aynen korunur, aşağıdaki kimlik notuna bak).\
**Hedef ortam:** Windows, mühendislik sitesinin yerel proje klasörü, dosya/terminal/Node/Playwright erişimi olan masaüstü ajanı.\
**Planlayıcının rolü:** araştırma ve karar verme. **Masaüstü ajanının rolü:** yerelde kod değişikliği, test, gerektiğinde tek kontrollü yayın.\
**Hedef release yolu:** Yerelde tam kabulden sonra, mevcut `AGENTS.md`/`.agents/rules/vercel-kurallari.md` hükümleri ve kullanıcının proje için belirttiği akış uyarınca tek anlamlı atomik `main` push ve Vercel Production doğrulaması; **ara aşamalarda push/deploy yok**.

---

## 1. Talebin kesin kapsamı

Verilen ekran görüntüsünde **İnşa Blog logosu + tema anahtarı + hamburger menü** içeren geniş global üst çubuk, belge stüdyolarında kullanılabilir alanı gereksiz tüketiyor. Kullanıcının ek talebi: **yalnız telefonda değil, masaüstünde web sitesinin belge düzenleme arayüzünde de bu üst site çubuğu bulunmayacak.** Bu, sitenin bütün sayfalarından ana navigasyonun kaldırılması anlamına **gelmiyor**.

### Etkilenecek beş **müstakil belge düzenleme rotası**

1. `/belgeler/beton-dokum-tutanagi`
2. `/belgeler/insaat-ruhsati-dilekcesi`
3. `/belgeler/santiye-sefi-istifa-dilekcesi`
4. `/belgeler/santiye-sefi-sozlesmesi`
5. `/belgeler/santiye-sefi-taahhutnamesi`

`/belgeler` **liste/katalog ekranı** ve sitenin diğer tüm rotaları normal global navbar'ı korur. Yerel kaynak doğrulamasında katalogda hızlı önizleme modalı için bir entrypoint bulunmadı: `BelgelerHub` yalnızca bağımsız stüdyo rotalarına link veriyor, beş route da `isModal={false}` kullanıyor ve `isModal={true}` çağrı noktası yok. Bu görev modal eklemeyecek; varsa bileşen varyantını şimdilik değiştirmeyecek. Modal davranışı ancak uygulama öncesi yeni bir gerçek çağrı noktası bulunursa kapsam olarak yeniden değerlendirilir.

### Korunacak işlevler

- Form alanları, varsayılanlara sıfırlama, tümünü temizleme, alan bazlı sıfırlama ve mevcut validasyon.
- Canlı PDF içeriği ve PDF çıktısı, sayfa gezinmesi (çok sayfalı sözleşme dâhil), zoom, sığdırma, yeni sekmede açma, indirme, yazdırma.
- PDF.js/pfd-lib [sic: kaynakta gerçek ad `pdf-lib`] yaşam döngüsü, yalnız form değişince üretim; yalnız zoom/sekme/resize olayında yeniden çizim.
- Mobil form/önizleme iki sekmesi, durum mesajı, erişilebilir isimler, klavye kullanımı, iOS/Android sanal klavye ve `safe-area` davranışı.
- Sitenin dark-industrial görsel kimliği, amber vurgu, light/dark uyumu, Türkçe metinler.

### Kapsam dışı

PDF motorunu değiştirmek, şablon dosyalarını/form alanlarını yeniden düzenlemek, Dokümantasyon/CAD görüntüleyicisini değiştirmek, global navbar tasarımını bütün site için silmek, yeni paket veya yeni test altyapısı kurmak, gereksiz refactor, proje dışı veri incelemek.

---

## 2. Doğrulanmış başlangıç bulguları

Aşağıdakiler planlama sırasında gerçek GitHub kaynaklarından okundu:

| Doğrulanan yer | Bulgusu ve plana etkisi |
|---|---|
| `PROJECT.md` ve `AGENTS.md` | Next.js 16 / React 19 / TypeScript / Tailwind 4; dark-industrial tema; yerel geliştirme → hedefli testler → tek final `main` push; üretim Vercel'e bağlı. |
| `.agents/rules/belgeler-kurallari.md` | Beş stüdyo form/PDF ayırımı; masaüstünde dış kaydırmasız viewport; mobil sekmeli panel; zoomda PDF yeniden derlenmemesi. |
| `.agents/rules/test-ve-otomasyon-standardi.md` | Playwright/browser testleri asılı bırakılmamalı; gerçek selector, timeout, `finally` içinde temizlik. |
| `.agents/rules/vercel-kurallari.md` | Ara deploy yok; final yerel kontroller ve tek Production release; özel build sözleşmesini koru. |
| `.agents/rules/yasayan-dokumantasyon-bakimi.md` | Ürün davranışı kalıcı olarak değişiyorsa `docs/BELGELER_SISTEMI.md` ilgili bölümünü güncelle. |
| `src/app/layout.tsx` | `Navbar` global layout içinde; `#main-content` global kabuğun parçası. |
| `src/components/navbar.tsx` | Navbar zaten `/dokumantasyon/dosya/` rotalarında gizleniyor; **beş `/belgeler/...` rotasında gizlenmiyor**. `NavbarRouteTracker` render dizisinde bulunduğundan navbar gizleme kararında yan etkileri korunmalı. |
| `src/components/navbar-chrome.tsx` | Görünen üst kabuk `header[data-site-header]`; sticky, bağımsız yükseklik tüketiyor. |
| `src/app/globals.css` | `body:has([data-studio-locked="true"])` üzerinden viewport kilidi var. Şu an belge stüdyosunun navbar'ını sadece **kısa yatay mobil** modda gizleyen medya kuralı mevcut; her ekranda gizlenmesi için yeterli değil. |
| `src/hooks/use-belge-studio-mobile-viewport.ts` | `visualViewport` yüksekliğini `--belge-studio-visual-height` değişkenine yazıyor; odaklanan alanı ve alt aksiyon barını dikkate alıyor. |
| `src/lib/belge-studio-layout.ts` | Beş stüdyo form, mobil sekme ve alt bar ortak sınıflarını kullanıyor. |
| `src/components/{sozlesme,beton-dokum,istifa,taahhutname,insaat-ruhsati}-studio.tsx` | Ortak tasarıma rağmen beş ayrı component; `isModal` varyantı ve `activeTabMobile`, form, preview toolbar, mobil footer mevcut. Güncel beş route `isModal={false}` kullanıyor; repoda `isModal={true}` çağrı noktası yok. |
| `src/app/belgeler/santiye-sefi-sozlesmesi/page.tsx` ve diğer stüdyo sayfaları | Stüdyo önünde yüksekliği olan ayrı `Tüm Belgelere Dön` satırı var; ana navbar kaldırılırken bunun daha kısa **bağlamsal stüdyo başlığına** dönüşmesi uygun. |
| `src/components/bottom-nav.tsx`, `src/components/global-overlays.tsx` | Global alt nav ve overlay bileşenleri rotaya duyarlı. Stüdyo içinde gereksiz ikinci navigasyon eklenmemeli. |
| `tests/site-audit/belgeler-mobile-studio.spec.ts` | Halihazırda beş rota, 320/360/390/414/768 ve yatay ekran, 1024/1366/1920, form, PDF ve indirme regresyonları için kapsam var. **Mevcut bir test stüdyo içinde hamburgeri görünür bekliyor**: yeni tasarımla birlikte bu beklenti bilinçli güncellenmeli. |
| `playwright.site.config.ts`, `package.json`, `package-lock.json` | Playwright test altyapısı ve npm scriptleri mevcut; ek test çatısı gerekmiyor. |

**Kullanıcı kanıtı:** Paylaşılan ekran görüntüleri; mobilde global başlık + sayfa içi geri satırı + sekmeler + çok satırlı PDF toolbar nedeniyle görünür PDF alanı dar. Görsel tek başına canlı tarayıcı davranışı veya fiziksel telefon başarısını ispat etmez.

**Yerelde doğrulanacak:** Yerel branch/commit, dirty files, proje kökündeki ek ajan talimatları, paketlerin kurulu olup olmadığı, fiziksel cihaz/browser viewport ayrıntıları, var olan işlerle çatışmalar, gerçek build ve test sonucu. Kaynaklar uzaktan **okundu**; bu planda **hiçbir dosya düzenlenmedi ve test çalıştırılmadı**.

---

## 3. Hedef model ve araştırma notu

İstek etiketi **`gpt 6 luna extra high`** olarak saklandı. OpenAI'nin 16 Ekim 2026'da erişilen resmî GPT-6 yardım sayfasına göre **GPT-6'da Extra High düşünme seviyesi GPT-6 Sol** ile ilişkilendiriliyor; **“GPT-6 Luna Extra High”** birleşimi bu kaynakta doğrulanamadı. Kullanıcının masaüstü ürününde gördüğü özel arayüz etiketi, ChatGPT model ailesi ve API model kimliği birbirine eşit kabul edilmez. Masadaki ajan kullanıcının seçimini **sessizce değiştirmesin**; açılışta mevcut model ve effort etiketini bildirsin; belirtilen seçim görünmüyorsa **uygulamaya geçmeden tek kısa soru sorsun**. Bu belirsizlik UI çözümünü yeniden tasarlamayı gerektirmez. Model adına dayanarak uydurma benchmark puanı veya yetenek sınırı yazılmadı. Uygulama talimatları güçlü, çok dosyalı kod ve Playwright iş akışına uygun; ama test kanıtı zorunlu.

Resmî kaynak: https://help.openai.com/en/articles/20001354-gpt-6-and-other-models-in-chatgpt

---

## 4. Seçilen tasarım kararı (önceden belirlenmiş çözüm)

### 4.1 Global navbar yerine rotaya özgü **Document Studio Chrome**

- **Tek mimari karar:** Beş müstakil belge stüdyosu rotasında global `Navbar` **DOM'a hiç eklenmeyecek**; yalnız CSS ile görünmez kılma varsayılan çözüm değil. Navbar'ın Dokümantasyon rotalarındaki mevcut davranışı korunacak.
- Navbar'ı gizleme kararı, `src/components/navbar.tsx` içindeki `usePathname()` bazlı mevcut rota desenine genişletilmeli; **`/belgeler` katalog rotasına uygulanmamalı**. Yanlışlıkla ilerideki bilinmeyen alt rotaları etkilememek için **beş kesin rota** tek bir hafif, SSR/client uyumlu rota tanımlayıcıda tutulmalı (ör. **yeni** `src/lib/belge-studio-routes.ts`, yalnız rota/name eşlemesi; ağır belge veri paketi çekme).
- `NavbarRouteTracker` gibi navbar'dan bağımsız yönlendirme yan etkileri yol değişiminde korunmalı; ihtiyaç varsa konumu navbar gizleme koşulundan bağımsızlaştırılmalı. `GlobalOverlays` ve katalog üzerindeki navbar hiçbir biçimde devre dışı bırakılmayacak.
- Yeni ağır genel site header'ı inşa edilmeyecek. Stüdyo sayfalarında mevcut geri satırı **tek, ince, bağlamsal** üst çubuğa çevrilecek: 44–48 px hedef, sol **geri ok / Belgelere dön**, yanında tek satır `Belge adı` (taşarsa `ellipsis`). Çubuk içinde logo, tema switch'i, hamburger, dekoratif gradient çizgi **olmayacak**. Mevcut sayfa başlığı/SEO metadatası korunacak; anlamlı tek `h1` verilebilir.
- Beş sayfadaki tekrar için **yeni**, basit `src/components/belge-studio-page-shell.tsx` veya eşdeğeri önerilir. Server-friendly shell ve Link kullanılmalı; iç PDF stüdyolarındaki mevcut client state değiştirilmemeli. Yerel kaynakta katalog modalı entrypoint'i yok; bu görev yeni modal oluşturmayacak.
- `src/app/layout.tsx` altında global düzenin `main` yüksekliği, CSS `:has` viewport kilidi ve `safe-area` ilişkisi korunacak. Stüdyo açılışında global header'dan kalan **boş/şeffaf 60–80 px spacer** kalmamalı.

### 4.2 Mobil görünüm (öncelikli)

Şematik yerleşim — kesin piksel mockup değil, davranış sözleşmesi:

```text
┌────────────────────────────────────┐
│ ←  Şantiye Şefi Hizmet Sözleşmesi  │  44–48px kompakt stüdyo başlığı
├────────────────────────────────────┤
│ [ Form Alanları 11/14 ] [ PDF ]    │  bir satır sekme
├────────────────────────────────────┤
│ [ ‹ ]  1 / 2  [ › ]   [ Sığdır ]   │  PDF sekmesi: satır 1
│ [ − ]     %100      [ + ] [ ↗ ]   │  PDF sekmesi: satır 2
├────────────────────────────────────┤
│                                    │
│        CANLI PDF ÇALIŞMA ALANI     │  kalan dinamik yükseklik
│        (iç kaydırma / zoom)        │
│                                    │
├────────────────────────────────────┤
│ [Formu Düzenle]     [PDF İndir]    │  safe-area uyumlu sabit alt alan
└────────────────────────────────────┘
```

- `Form` sekmesinde preview toolbar hiç yer kaplamaz; iç scroll yalnız düzenlenebilir alanlarda olur. `PDF` sekmesinde form alanları görünmez, PDF mümkün olan genişlik/yüksekliğe sığar.
- PDF araçlarındaki **tekrarlı 'Canlı Belge Önizlemesi' başlığını mobilde kaldır/gizle** (anlamı `aria-label`, tab ve `role="toolbar"` üzerinden yaşar); 320 px'de **en çok iki kompakt satıra** yerleştir. Mevcut işlevleri azaltma: önceki/sonraki sayfa, sayfa göstergesi, fit, zoom −/+, %, yeni sekme. Küçük ekranda kelimeler yerine simge kullanılabilir ancak `aria-label` ve `title` şart. Bir sayfalı belgede ileri/geri düğmeleri mevcut disabled davranışını korur.
- Mobil dokunma hedefleri asgari **44 × 44 CSS px**; form metin girişleri **en az 16 px** font; 320 px'de yatay taşma yok. Tablet (<1024) sekmeli davranışı korur; cihaz yönü değişse de kaydırma kilidi ya da aksiyon çakışması oluşmaz.
- `BELGE_STUDIO_MOBILE_ACTIONS_CLASS`, `useBelgeStudioMobileViewport` ve `--belge-studio-visual-height` korunarak klavye yükseldiğinde alt aksiyonların odaklı input'u kapatmaması sağlanır. `env(safe-area-inset-*)` kullanılır. Aksiyon barı PDF üzerine çıkmaz; PDF paneli kalan yüksekliği alır.
- Mobil **müstakil** stüdyoda gereksiz dış boşluk, kalın border, dev shadow/radius azaltılır. Mevcut `isModal` component dalları varsa aynen bırakılır; yerel katalogda bu dalları kullanan bir çağrı noktası doğrulanmadı.

### 4.3 Masaüstü web görünümü

- **Aynı global navbar kaldırma masaüstünde de geçerli**; logo/tema/hamburger alanı belge düzenleme ekranında hiç yok.
- Kompakt stüdyo başlığı en üste gelir. Altında **solda form (mevcut ~410–450 px sınırına saygı), sağda geniş PDF önizleme**, iki bağımsız dikey scroll davranışı kalır. PDF kontrolleri masaüstünde düzgün tek üst araç satırı veya genişliğe duyarlı sade düzen gösterir.
- Sayfa kendi kendine aşağı kaymaz (outer scrollbar yok), yalnız form ve büyütülmüş PDF paneli içinde scroll olabilir. Masaüstü başlığının kaldırılması PDF alanını fiilen büyütmelidir.
- Dark-industrial görünüm ve açık tema; erişilebilir odak halkası, yeterli kontrast, tek satırlı belge adı, butonların disabled/loading halleri korunur.

### 4.4 Teknik değişiklik sınırları ve riskler

- **PDF üretim/worker katmanına dokunma:** `src/lib/pdf-engine.ts`, `src/lib/pdfjs-client.ts`, PDF vendor klasörü, PDF şablonları sabit kalmalı. Yalnız layout/toolbar davranışı kaynaklı net bir hata kanıtlanırsa sınırlı düzeltme gerekçelendirilir.
- Sadece `Navbar`'ı `display:none` yapmak height/scroll kalıntısı veya ilk yüklemede flash üretebilir; route-aware rendering ve gerçek bounding-box testi tercih edilir.
- `body:has([data-studio-locked])` stilleri zaten viewport sözleşmesini işletiyor; ikinci bir paralel viewport ölçüm sistemi yazılmamalı. Değişiklikten sonra eski **landscape-only header gizleme kuralı** gereksizse kaldır veya güvenli şekilde sadeleştir; Dokümantasyon'un ayrı kurallarına dokunma.
- Mevcut `tests/site-audit/belgeler-mobile-studio.spec.ts` içindeki **stüdyoda hamburger bulunmalıdır** varsayımı yeni gereksinimle çelişiyor. Yeni beklenti stüdyoda **site header yok**, `/belgeler` üzerinde **site header ve hamburger var** biçiminde olmalı. Testi geçsin diye gereksiz UI geri getirme.
- Mevcut repo içinde `isModal=true` çağrısı bulunmadığından katalog modalı için çalışma zamanı regresyonu yoktur. `isModal` prop/dalları bu UX işi sırasında değiştirilmez; yeni bir gerçek çağrı noktası bulunursa ayrıca incelenir.

---

## 5. Aşama özeti

| Aşama | Somut çıktı | Ön koşul |
|---|---|---|
| `ASAMA_01` | Yerel sürüm/baseline ve kalıcı durum kaydı | Plan dosyası masaüstüne aktarılmış |
| `ASAMA_02` | Beş stüdyo rotasında **mobil + masaüstü** global navbar yok; kompakt geri/başlık çubuğu var | `ASAMA_01` kabulü |
| `ASAMA_03` | Beş stüdyoda mobil PDF kontrol alanı ve form/PDF çalışma hacmi optimize | `ASAMA_02` kabulü |
| `ASAMA_04` | Responsive, klavye, nav, PDF ve erişilebilirlik regresyonları doğrulanmış | `ASAMA_03` kabulü |
| `ASAMA_05` | Nihai yerel kalite + tek kontrollü `main` push / Production smoke + `TAMAMLANDI` | `ASAMA_04` kabulü |

> **Kritik:** Her `devam` yalnız **tek** tamamlanmamış aşamayı uygular. Devam eden aşama bitmeden sonraki aşamaya geçilmez. Her aşama sonunda **durum dosyasını güncelle ve dur**. Aşağıdaki tüm aşamalar şimdiden tanımlıdır; sıradaki aşamaları her seferinde yeniden planlama.

---

## 6. Ayrıntılı uygulama aşamaları

### `ASAMA_01` — Yerel kaynak ve mevcut davranışı doğrulama

**Amaç:** Planın dayandığı GitHub HEAD ile yerel çalışma ağacının farklarını, önceki işleri ve gerçek CSS/DOM ölçülerini kanıtla; kaynak varsayımlarını kontrol et.

**Giriş koşulları:** Yerel proje erişimi ve bu dosya. Kullanıcının seçtiği model/effort etiketi kontrol edilmiş olmalı; erişilemiyorsa kısa açıklama ve kullanıcı kararı olmadan model değiştirme.

**Kapsam/dosyalar:** **Oku:** `PROJECT.md`, `AGENTS.md`, `.agents/rules/belgeler-kurallari.md`, `.agents/rules/test-ve-otomasyon-standardi.md`, `.agents/rules/vercel-kurallari.md`, `.agents/rules/yasayan-dokumantasyon-bakimi.md`, varsa alt dizin `AGENTS.md`; git, `src/app/belgeler/`, navbar, layout, studio componentleri, `src/app/globals.css`, viewport hook, testler, `package.json` ve lock dosyası. **Yeni yerel durum kaydı:** `PLAN/BELGELER_STUDYO_TAM_EKRAN_NAVIGASYON_STATE.md` (başka işin var olan dosyasının üstüne yazma). Planı repo içine **yeni** `PLAN/BELGELER_STUDYO_TAM_EKRAN_NAVIGASYON_PLAN.md` adıyla kopyalayabilirsin; zaten varsa içerik/durumunu kontrol et, overwrite etme.

**İş sırası:**
1. `git status --short --branch`, `git rev-parse HEAD`, `git branch --show-current` ile çalışma dalı ve dirty dosyaları kaydet; commit uyuşmazsa farkların yalnız bu UI görevini etkileyen bölümünü değerlendir. **`reset`, zorunlu `checkout`, otomatik `pull` yok.** Kullanıcı değişikliklerini ezme.
2. Yerel `PROJECT.md`/kuralları sırayla oku, özel nested kurallar ve yerel Next.js 16 dokümantasyonu (`node_modules/next/dist/docs/` erişilebilirse) üzerinden patternleri doğrula. `npm` ve test bağımlılıklarını yalnız mevcut halleriyle doğrula; gereksiz `npm ci` çalıştırma.
3. Local sunucuyu mevcut script ile yalnız gerekirse başlat. 390×844, 320×720, 844×390, 1366×768 ve 1024×768 için tek bir stüdyoda; ardından diğer dört rotada header görünürlüğünü, stüdyo `boundingClientRect()`, toolbar satır sayısını, scroll/alt bar konumunu ve theme'i kaydet. `/belgeler` navbar'ını ve hızlı modal için gerçek source/DOM entrypoint bulunup bulunmadığını ayrıca doğrula. İlk aşamada ekran görüntülerini tek bir tanımlı `test-results` alt klasöründe veya Playwright artifact olarak tut; repoya gereksiz büyük medya ekleme.
4. Mevcut `tests/site-audit/belgeler-mobile-studio.spec.ts` içindeki route/mobil/desktop ve hamburger testlerinin hangileri yeni beklentide değişeceğini işaretle. Mevcut testleri çalıştırmak gerekiyorsa yalnız hedefli smoke ile baseline al, başarısızlığı mevcut sorun diye raporla.
5. Durum dosyasını örnek şemayla oluştur; sadece gerçekten çalıştırılan doğrulamaları `evidence` içine ekle.

**Doğrulama:** Yerel HEAD, çalışma ağacı, beş rota, etkili style selector ve gerçek navbar yüksekliği raporda bulunmalı. `npm` scriptleri kullanılmadan önce `package.json` ile doğrulanmalı. Görünüm yerelde açılabiliyorsa video/screenshot veya DOM ölçümleriyle baseline oluşturulmalı.

**Kabul:** Kod değişimi yapılmadan, açık risk/çatışma listesi ve test edilebilir baseline var. Önemli yerel farklılık varsa **yalnız etkilenen plan kısmı revize edilir**; kritik çatışma çözülemiyorsa `ENGELLI` ve dur.

**Hata/geri dönüş:** Eksik bağımlılık/credential durumunu açık raporla; keyfi global kurulum veya uzaktan push yok. Mevcut değişikliklere dokunma.

**Durma noktası:** `ASAMA_01` kanıtını ve `next_stage: ASAMA_02` bilgisini kaydet; kısa raporla **bekle**.

### `ASAMA_02` — Global site header'ını **her iki arayüzden** kaldırmak

**Amaç:** Hem mobil hem desktop **beş standalone** stüdyo rotasında İnşa Blog global header'ı DOM'da bulunmasın; yeri ince bağlamsal başlıkla değerlendirilsin.

**Giriş koşulları:** `ASAMA_01` tamam, çakışan yerel işler değerlendirilmiş.

**Kapsam:** `src/components/navbar.tsx`, gerekirse `src/components/navbar-route-tracker.tsx`, **yeni** `src/lib/belge-studio-routes.ts`, **yeni** `src/components/belge-studio-page-shell.tsx`, mevcut beş `src/app/belgeler/<slug>/page.tsx`, gerekiyorsa yalnız ilgili `src/app/globals.css` seçicileri. Stüdyo içi PDF render logic ve mevcut `isModal` varyantları değiştirilmez.

**İş sırası:**
1. Beş bilinen rotanın kesin eşlemesini tek hafif helper'da tanımla; `/belgeler` ve ilgisiz yollar false olmalı. Tekrarlanan rota adı, görünen başlık gibi metadata gerekiyorsa aynı kaynaktan sağla; ağır veri paketi yükleme.
2. Navbar'ın mevcut Dokümantasyon dosya rotası gizleme desenini bozmadan standalone belge kontrolünü ekle. `NavbarRouteTracker` ve route lifecycle yan etkilerini gizlenen DOM'dan bağımsız doğru konumda tut; sitede başka navbar duplikasyonu yaratma.
3. Beş `page.tsx` dosyasındaki geri satırlarını ortak 44–48 px ince başlık bileşeniyle değiştir: geri butonu minimum 44 px, doğru `/belgeler` linki, tek satırlık Türkçe belge adı, ellipsis, ekran okuyucu etiketi/odak görünürlüğü. Eski geri satırı **ikinci kez bırakma**. İç stüdyonun `isModal={false}` sözleşmesi korunur.
4. Global sayfa kabuğunu ve mevcut `data-studio-locked` ile ilgili CSS'i header'sız hesapla: viewport başından gerçek stüdyo başlığı başlasın; gizlenmiş navbar'ın boş spacer'ı kalmasın. Yalnız landscape header gizleyen eski kuralı yeni tasarımla uyumlu şekilde sadeleştir. Genel sitenin navbar'ını CSS ile kazara etkileme.
5. 320/390/768/1024/1366/1920 genişliklerde stüdyo ve katalog görünümü ile dark/light görünümü hızlı gözden geçir; 1024 breakpoint'teki masaüstü bölmeli yapıyı koru.

**Doğrulama:** En az bir rota üzerinde 390×844 ve 1366×768; ardından tüm beş rotada `[data-site-header]` yok ve `/belgeler` kataloğunda `[data-site-header]` var. Global footer/alt nav/breadcrumb boşluğu oluşmadı. `getBoundingClientRect()` başlık konumuyla ekran üstünde siyah boş bant olmadığını doğrula. Geri tıklamasında `/belgeler` doğru dönüyor ve nav geri geliyor. TypeScript/lint için değiştirilmiş dosyalarda mevcut komutları çalıştır.

**Kabul:** Beş rotanın hem mobil hem desktop'unda eski **logo/tema/hamburger** satırı **yok**; diğer sayfalarda navigasyon var; tek kompakt başlık var; geri dönüş çalışıyor; dirty değişiklikler korunmuş.

**Hata/geri dönüş:** Header kaybolsa da boşluk kalıyorsa geçici keyfi `margin-top:-...` ile kapatma; flex/viewport sahibi öğeyi bulup sınırlı düzelt. Kaybolan global tracker etkisi varsa tracker'ı koruyarak düzenle. Sorun giderilemezse aşamayı `ENGELLI` işaretle.

**Durma noktası:** Görünür ekran/DOM ölçülerini ve değiştirilen dosyaları raporla, `next_stage: ASAMA_03`; **bekle**.

### `ASAMA_03` — Mobil kompakt çalışma alanı ve masaüstü stüdyo cilası

**Amaç:** Sadece header kaldırılmış değil, **daha çok belge alanı gösteren, düzenli ve profesyonel** form/PDF arayüzü.

**Giriş koşulları:** `ASAMA_02` kabul edilmiş; yeni kompakt shell aktif.

**Kapsam:** Ortak `src/lib/belge-studio-layout.ts`; beş mevcut `src/components/*-studio.tsx`; gerekli en dar `src/app/globals.css` stüdyo kuralları; gerekirse viewport hook yalnız somut ölçüm hatasında. **PDF engine ve veri sözleşmeleri kapsam dışı.**

**İş sırası:**
1. Beş stüdyo dosyasındaki gerçek UI benzerliklerini incele. Ortak sınıfları tek yerden uygula; toolbar markup'ını tamamen beş kez refactor etmek zorunda kalmadıkça yeni büyük mimari kurma. İhtiyaç olursa küçük, stateless `BelgeStudioPreviewToolbar` bileşenine ortaklaşma; buna geçmek PDF state API'sini bozacaksa mevcut JSX'lere tutarlı sınıf/ARIA düzeni uygula.
2. Mobil form/önizleme tab barını tek satır, okunaklı, aktif durum kontrastı yüksek hale getir; örnekteki sayacı (`11/14`) ve PDF hazır/bekliyor durumunu koru. Tekrarlı başlık/etiketlerden boş alan kazan. Form panelinde bölümler, sıfırlama ve validasyon bozulmasın.
3. PDF sekmesindeki kontrol barını **320 px dâhil en çok iki 44 px satır** olarak tasarla: sayfa gezinme + fit ve zoom + yeni sekmede açma. Mobilde statik “Canlı Belge Önizlemesi” başlığını görsel olarak kaldır, toolbar'ın `aria-label`'ı kalsın. Dar alan nedeniyle işlev kaybı olmasın; % gösterimi ve icon butonları erişilebilir olsun.
4. Önizleme canvas'ının kullanılabilir genişlik/yüksekliğini artır; `min-h-0`, `flex: 1`, `overflow-auto`, `ResizeObserver`/mevcut fit ve zoom davranışları korunmalı. Dış sayfayı kaydıran farklı yükseklik hack'i ekleme. 100% fit hâlinde sayfanın tümünü göster; 125–250% zoomda panel içi pan/scroll korunmalı, yeni PDF derleme tetiklenmemeli.
5. Müstakil mobil stüdyo dış border/radius/padding'i sadeleştir; desktop'ta ölçülü panel çizgileri, öngörülebilir toolbar, sol form (~410–450 px) ve kalan sağ PDF alanını koru. Modal varyantlarını ancak yeni bir aktif çağrı noktası bulunursa bu kapsamda ele al.
6. Mobil alt aksiyon barını `safe-area` ve klavye/`visualViewport` sözleşmesiyle koru; `PDF İndir` ve `Formu Düzenle`/`Canlı PDF Önizle` daima çalışır. Aydınlık/karanlık temada kontrast, odak göstergesi, 200% font ve yatay ekranları kontrol et.

**Doğrulama:** 320×720, 360×800, 390×844, 414×896, 768×1024, 844×390, 1024×768, 1366×768, 1920×1080 ile görsel/DOM testleri. Formdan önizlemeye art arda 5 geçişte canvas var ve içerik güncel. Sözleşmede `1/2→2/2`, diğer belgelerde mevcut sayfa sayısı doğru; zoom ve download kontrolü. PDF toolbar en çok iki satır, tıklama alanları 44×44, mobil yatay overflow ≤2px. Klavye açılınca odaklı input alt bar arkasında kalmıyor. Modal regresyon testi ancak aktif bir `isModal=true` çağrı noktası bulunursa eklenir.

**Kabul:** Kullanılabilir stüdyo alanı baseline'a göre artıyor (**önce/sonra ölçümü**); gereksiz global header ve yinelenen preview etiketi yok; hem mobil hem masaüstü işlev kaybı yok. Ölçümde kazanım görülmüyorsa düzenleme tamam kabul edilmez.

**Hata/geri dönüş:** Canvas çizimi bozuluyorsa motoru yeniden yazma; `ResizeObserver` tetikleme, görünürlük, `min-h-0`, container sizing ve tab switch ilişkisini incele. Test ederek gerekirse yalnız toolbar tasarımını geri al. Hata kalırsa `ENGELLI`.

**Durma noktası:** Önce/sonra ekran alanı ölçümü + 5 rota özeti kaydet, `next_stage: ASAMA_04`; **bekle**.

### `ASAMA_04` — Otomatik ve gerçek kullanıcı regresyonları

**Amaç:** Görünüşün yanı sıra eski önemli işlevlerin ve yeni header davranışının kanıtlanması.

**Giriş koşulları:** `ASAMA_03` kabul.

**Kapsam:** Öncelikle mevcut `tests/site-audit/belgeler-mobile-studio.spec.ts`; gerekiyorsa aynı klasöre küçük yeni spec; mevcut `playwright.site.config.ts`; yalnız değişen testlerin seçicileri. Yeni test framework'ü ve bağımlılık gereksiz.

**İş sırası:**
1. Eski `route geri/ileri, mobil menü...` testini böl veya davranışa uyumla: **stüdyo içinde hamburger yok**, `/belgeler` üzerinde hamburger çalışıyor, katalogdan stüdyoya giriş ve geri ile header/scroll lock doğru değişiyor. `Ctrl+K` mevcut davranışa göre korunmalı; kapatınca body overflow artığı olmamalı. Beklentiyi sırf geçsin diye kaldırma, yeni doğru beklentiyle değiştir.
2. Tüm beş route için header yokluğu, kompakt başlık varlığı, `/belgeler` header geri gelişi, geri/ileri ve scroll-lock davranışı için Playwright assertion'ı ekle. Aktif modal çağrı noktası olmadığından modal assertion'ı ekleme.
3. 320/360/390/414/768, 844×390, 1024/1366/1920 matrisi ve 200% font için gerçek `boundingBox`, `scrollWidth`, canvas boyutu ve iki satır toolbar sınırını doğrula. Selector'ları mevcut DOM'dan oku, mümkünse mevcut `data-testid`'leri kullan. Test görsel screenshot'larını inceleyerek kontrolü destekle; her pikseli kırılgan screenshot gate'e çevirmek zorunda değilsin.
4. PDF üretim/zoom/fit/iki sayfa/indirme/yazdırma (yazdırma mock'lanması gerekiyorsa kullanıcı eylemini doğrulama), form editing/reset, 12 hızlı değişiklik, görünür canlı güncelleme ve bellek temizliği/route lifecycle testlerini koru. Son girişe klavye açıldığında erişim korunur.
5. Mevcut Playwright config ve tek işçili akışa göre ilgili hedefleri çalıştır. **Önerilen komutlar (yerel script/config ile doğrula):**

   ```powershell
   npx playwright test --config=playwright.site.config.ts tests/site-audit/belgeler-mobile-studio.spec.ts --project=chromium-mobile-390
   npx playwright test --config=playwright.site.config.ts tests/site-audit/belgeler-mobile-studio.spec.ts --project=chromium-desktop-1366
   npx playwright test --config=playwright.site.config.ts tests/site-audit/responsive-overflow.spec.ts tests/site-audit/touch-targets.spec.ts tests/site-audit/theme-consistency.spec.ts --project=chromium-mobile-390
   ```

   Test içindeki proje skip'lerini ve özel `webkit` tarayıcı başlatma akışını **gerçekte çalıştırılan** test sayısıyla kontrol et. Browser binary yoksa önce mevcut proje standartlarını izle; hayalî WebKit PASS yazma. Testlerin varsayılan 45s timeout/tek worker standardını ve `finally` cleanup'ını koru; test başlattıysan yalnız kendi süreçlerini kapat.
6. Hedefli TypeScript ve ESLint'i çalıştır; hata çıktısı ile exit code'u birlikte değerlendir. `console/pageerror`, React hydration, failed request ve hatalı network cevaplarını mümkün olduğunda testte gözle. Sadece test koştu diye görsel kaliteyi ispatlanmış sayma; screenshot gözden geçir.

**Kabul:** Güncellenmiş beklentiyle tüm seçili stüdyo testleri yeşil; görsel kontrollere ait ekran örnekleri incelendi; navbar sadece ilgili rotalarda yok; **tüm beş belge** PDF/form/indirme işlevleri korunmuş; no horizontal overflow, no scroll-lock leak. Fiziksel iPhone/Android yapılmadıysa **ayrıca belirtilir**, emülasyonla aynı sayılmaz.

**Hata/geri dönüş:** Bir test kırılırsa önce eski beklenti mi gerçek regresyon mu ayrıştır. Eski beklenti yeni sözleşmeye karşıysa testi doğru davranışa güncelle; gerçek regresyonda kapsamlı bir redesign başlatma, `ASAMA_02/03` kodundan ilgili küçük hatayı düzelt ve hedefli testi tekrarla. Doğrulanmamış PASS yok.

**Durma noktası:** Kanıt listesi/durum kaydı güncel, `next_stage: ASAMA_05`; **bekle**.

### `ASAMA_05` — Final kalite, yaşayan belge ve tek kontrollü yayın

**Amaç:** Uygulamanın final kabulleri doğrulandıktan sonra yerel projeyi tek checkpoint ile yayınlamak.

**Giriş koşulları:** `ASAMA_04` başarılı; kullanıcı erişimi/repo talimatları GitHub push'a izin veriyor; çalışma ağacı ve başka işler doğru ayrılmış.

**Kapsam:** Gerçek değişen UI/test dosyaları; önemli kalıcı davranış güncellemesi için `docs/BELGELER_SISTEMI.md` ilgili bölüm; plan/durum dosyası; git/Vercel kontrolleri. Kullanıcının ASAMA_05 sırasında açıkça verdiği “Kapsamı genişlet ve lint’i düzelt” yönlendirmesiyle tam depo ESLint hataları da aynı doğrulanmış checkpoint'e eklendi; bu kapsamda CAD/PDF/test yardımcılarındaki lint ve tip borcu, lint kuralları gevşetilmeden giderilir. PDF işleyişini veya bu UI göreviyle ilgisiz ürün davranışlarını değiştirmek kapsam dışı kalır.

**İş sırası:**
1. Beş rotayı ve katalog navbar'ını finalde gerçek prod build üzerinde yerelde test et. Önce hedefli lint/typecheck, ardından tam `npm run build` (`prebuild` ve `next build --webpack` zincirini değiştirme). Projeye uygun diğer gerekli navigation/site-audit kontrolünü yalnız riskine göre ekle. Örnek kalite sırası:

   ```powershell
   npx tsc --noEmit --incremental false -p tsconfig.next.json
   npm run lint
   npm run build
   npm run check:navigation
   ```

   Global tam TypeScript kontrolü `npx tsc --noEmit --incremental false` script/test kodları için ayrıca gerekiyorsa uygula. Hızlı testlerin ASAMA_04 kanıtı değişen commit için hâlâ geçerliyse körü körüne tekrarlama; build sonrası kritik smoke'u tekrar et.
2. `docs/BELGELER_SISTEMI.md` için kısa bir “Standalone belge stüdyosu: navbar gizli / kompakt başlık / mobil toolbar” notu ekle; katalogdaki `StudioPreview` modal anlatımı güncel kaynakla uyuşmadığından ilgili eski varsayımı da düzelt.
3. `git diff --check`, değişiklik kapsamı/secret ve bağımlılık kontrolü; `git status` ile kullanıcıya ait değişiklikleri commit dışı bırak. Yeni paket olmadan bitmesi bekleniyor. Mevcut branch politikası ve korunacak başka işler açısından çalışma ağacının release'e uygun olduğunu kontrol et.
4. Yerel test/build kanıtı başarılıysa ve kullanıcı ayrıca yeni bir yasak koymadıysa `AGENTS.md` yerel yayın akışına göre **tek atomik, anlamlı commit** hazırla; doğrulanmış işi `main`'e **bir defa pushla**. Başarısız kontrolde veya branch çakışmasında push yapma, `ENGELLI` raporla. Sadece plan yapma işlemi bu push'u **şimdi** yetkilendirmez; bu izin, kullanıcının yerel ajanla **ASAMA_05 uygulama** komutunu verdiği zamana ait site çalışma sözleşmesi doğrulanarak kullanılır.
5. Otomatik Vercel Production deploy sonucunu ilgili commit/hash için kontrol et (`READY` veya sağlayıcının doğrulanmış başarı durumu); site erişimi üzerinden beş rotada kısa header/geri/PDF yükleme smoke yap. Preview kotası harcama; başka Vercel deploy/retry döngüsü başlatma. Vercel erişimi yoksa kesin yayın başarısı iddia etme ve `ENGELLI` tut; yerel tamamlanma kanıtını ayrıca raporla.
6. Final tüm zorunlu kanıtlarla geçerse `IMPLEMENTATION_STATE` dosyasında `execution_status: TAMAMLANDI`, `active_stage: null`, `next_stage: null` yap; kanıt ve final commit/deploy URL'sini not et.

**Doğrulama:** Targeted TS/lint, gerçek build, responsive Playwright smoke, Git diff, tek commit/commit hash, production deploy sonucu ve beş rota smoke. Belge listesi ve sitenin normal navbar'ı yayın sonrası korunuyor. `main` ve deploy eşleşmesi tutarlı.

**Kabul:** Hem mobil hem masaüstü stüdyo header'ı **yok**; beş belge düzenleme/önizleme/indirme çalışıyor; katalog ve diğer sayfalarda navigasyon yerinde; final kontrollerde bloklayıcı hata yok; tek prod release doğrulandı. Kabul edilmeden **`TAMAMLANDI` yazma**.

**Hata/geri dönüş:** Build veya deploy başarısızsa sebepsiz yeniden push/redeploy yapılmaz; log/commit incelenir, gerçekten gereken küçük düzeltme ve yeniden test uygulanır. Başka değişiklikler varsa tek atomik commit öncesi ayrıştır. Gerekiyorsa kullanıcıya hedefli blocker bildir, `ENGELLI` olarak dur.

**Durma noktası:** Kısa final sonuç + commit/production kanıtı, `TAMAMLANDI`; **kesin dur**.

### Revizyon 3 kapsam kaydı

16 Ekim 2026'da kullanıcı, tam lint engelini çözmek için kapsamın genişletilmesini açıkça istedi. Revizyon 2'nin önceki UI ve release kanıtları korundu; repository-wide lint temizliği ASAMA_05'in ek kalite işi oldu. TypeScript lint kuralları devre dışı bırakılmadı veya gevşetilmedi.

---

## 7. Kalıcı ilerleme sözleşmesi

**Masaüstüne verildiğinde önerilen yeni dosyalar (planlama aşamasında repo içinde oluşturulmadı):**

- `PLAN/BELGELER_STUDYO_TAM_EKRAN_NAVIGASYON_PLAN.md` — bu planın kopyası.
- `PLAN/BELGELER_STUDYO_TAM_EKRAN_NAVIGASYON_STATE.md` — tek kalıcı ilerleme ve kanıt kaydı; mevcut dosyaların üstüne yazma.

**İlk `STATE.md` içeriği** (gerçek çalışma başladığında yerel zaman diliminde `updated_at` doldur):

```yaml
plan_id: INSA-BELGELER-FULLSCREEN-UX-20261016
plan_revision: 1
planning_status: PLAN_HAZIR
execution_status: BASLAMADI
active_stage: null
next_stage: ASAMA_01
completed_stages: []
evidence: []
blockers: []
updated_at: null
```

Aşamaya girerken `execution_status: DEVAM_EDIYOR`, `active_stage` güncel aşama olur. Kabul gerçekleşince `completed_stages` listesine aşama eklenir, kısa `evidence` kaydı yapılır: **aşama + kontrol/komut + PASS/FAIL/NOT_RUN + üzerinde test edilen HEAD veya dirty tree durumu + varsa rapor yolu/tarih**. Başarısız aşama `ENGELLI`; plan bitince `TAMAMLANDI`, `active_stage: null`, `next_stage: null`. Başarılı olmayan kontrole PASS yazma. Yeni oturumda önce bu dosya ve mevcut plan okunur; kanıt olmadan tamamlanma varsayılmaz. Açık yeni istekle kapsam değişirse `plan_revision` artırılır ve önceki kanıtlar korunur. Her aşama için ayrı onlarca Markdown raporu gereksiz; durum dosyası temel kayıt olsun.

### Kesin `devam`/durma protokolü

1. **Planlayıcı sohbeti:** “Plan yap” yalnız araştırma/planlama talebidir; uygulamayı başlatmaz. Plan tam teslim edildikten sonra yalnız “devam” denirse yeni aşama üretme veya uygulama yapma: **“Plan hazır; planlama kapsamında yapılacak ek iş yok.”** de ve dur.
2. **Masaüstü uygulayıcı:** Planı okumak uygulama değildir. Kullanıcı **“Başla”** veya ilk **“devam”** dediğinde ilk tamamlanmamış aşamaya gir; ilk komut hem planı hem yerel durumu okuyarak başlar. Açıkça “başla” verilmişse tekrar onay bekleme.
3. Her “devam” **en fazla bir aşama** yapar. Yarıda kalan aşama varsa **onu tamamla**; aynı mesajda sonraki aşamayı açma. Aşama kapsamındaki normal hata düzeltmelerini/testleri küçük onay döngülerine bölme. Gerçek engel varsa bildir, bağımlı aşamaya geçme.
4. Aşama sonu: durumu diske kaydet, yalnız **tamamlanan aşama / somut değişiklikler / gerçek doğrulama / engel / sıradaki aşama** biçiminde kısa rapor ver ve **dur**. Beklemek için arka plan döngüsü, otomasyon, ayrı deploy başlatma.
5. Tamamlanmış aşamayı sırf “devam” dendi diye tekrar açma. Sonradan yeni kod eski kanıtı geçersiz kılıyorsa gereken yeniden doğrulamayı gerekçelendir; ama önceki kanıtı gizleme.
6. Bütün aşamalar ve release gate başarılıysa durum **`TAMAMLANDI`**. Bu durumda yalnız **“devam”** mesajına **“Plan tamamlandı; uygulanacak başka aşama yok.”** cevabı ver ve **hiçbir işlem yapma**: kod/test/build/commit/push/deploy/cleanup/refactor/audit veya yeni aşama yok. Açık yeni geliştirme talebi gelmedikçe planı genişletme.
7. **“Kontrol et”** gibi yeni bir talep gelirse yalnız belirtilen kontrolü yap; bunu otomatik geliştirme/release iznine çevirmeden yanıtla.

---

## 8. Nihai kabul matrisi

- [ ] Beş müstakil rotanın **mobil ve masaüstü** görünümünde `[data-site-header]` mevcut değil; logo/tema/hamburger çubuğundan **boş alan kalmadı**.
- [ ] `/belgeler` kataloğu ve diğer tüm normal sayfalarda global navbar var; kaynakta şu an katalog hızlı modalı yok ve yeni modal eklenmiyor.
- [ ] Beş rotada tek kompakt geri/başlık alanı var; geri ile doğru sayfaya dönülüyor.
- [ ] 320/360/390/414/768/844-landscape/1024/1366/1920 viewportlarında yatay taşma ≤2px ve studio dış kaydırma yok.
- [ ] Mobil PDF toolbar **en çok iki satır**; kontrol erişim adları, sayfa sayacı, fit, zoom, yeni sekme korunuyor; en küçük dokunma alanı 44×44.
- [ ] Form sekmesi iç scroll, bütün son alanlar, uyarılar, reset/clear, klavye görünürlüğü ve safe-area normal.
- [ ] Mobil alt iki eylem görünür, belge alanını kapatmıyor; form/preview ardışık geçişlerde doğru.
- [ ] 2 sayfalı sözleşme doğru sayfa değiştiriyor; zoom PDF motorunu form yeniden derleme yoluna sokmuyor; çıktı/görsel ve indirme doğru.
- [ ] Karanlık/açık tema, 200% font, tab/odak/ekran okuyucu isimleri korunuyor.
- [ ] Final gerçek browser testleri, typecheck/lint/build ve varsa zorunlu ek gate kanıtlı PASS.
- [ ] Tek doğrulanmış `main` release; production smoke başarıyla raporlandı; tek final deploy dışında ara deploy yapılmadı.

---

## 9. Temel kaynaklar

- Repo: https://github.com/smitelagwar/muhendislik-site
- `PROJECT.md`: https://github.com/smitelagwar/muhendislik-site/blob/main/PROJECT.md
- `AGENTS.md`: https://github.com/smitelagwar/muhendislik-site/blob/main/AGENTS.md
- Belgeler kuralı: https://github.com/smitelagwar/muhendislik-site/blob/main/.agents/rules/belgeler-kurallari.md
- Test kuralı: https://github.com/smitelagwar/muhendislik-site/blob/main/.agents/rules/test-ve-otomasyon-standardi.md
- Yayın kuralı: https://github.com/smitelagwar/muhendislik-site/blob/main/.agents/rules/vercel-kurallari.md
- Navbar: https://github.com/smitelagwar/muhendislik-site/blob/main/src/components/navbar.tsx
- Global CSS: https://github.com/smitelagwar/muhendislik-site/blob/main/src/app/globals.css
- Viewport hook: https://github.com/smitelagwar/muhendislik-site/blob/main/src/hooks/use-belge-studio-mobile-viewport.ts
- Layout sınıfları: https://github.com/smitelagwar/muhendislik-site/blob/main/src/lib/belge-studio-layout.ts
- Mobil belge testleri: https://github.com/smitelagwar/muhendislik-site/blob/main/tests/site-audit/belgeler-mobile-studio.spec.ts
- Resmî model bilgisi: https://help.openai.com/en/articles/20001354-gpt-6-and-other-models-in-chatgpt
- Playwright assertions: https://playwright.dev/docs/test-assertions
- Kalıcı aşamalı planlama protokolü (planlama sırasında erişilmiş): https://drive.google.com/file/d/1NTyZ9w46wfozM-HH7HQ6rHzE-7HTqhDy/view

## 10. Masaüstü ajanına ilk uygulama mesajı — doğrudan kopyala

> **Başla.** Bu Markdown planını yerel `muhendislik-site` projesinde uygula. İsteğim **beş belge düzenleme stüdyosunda hem mobilde hem masaüstü web'de global İnşa Blog üst navigasyonunun kaldırılması ve güzel, kompakt bir çalışma alanı sağlanmasıdır**; normal site/katalog navbar'ı korunacak. Önce planı, `PROJECT.md`, `AGENTS.md`, ilgili `.agents/rules` kurallarını ve varsa mevcut ilerleme dosyasını oku. Kullanıcı model etiketi `gpt 6 luna extra high`; kullandığın uygulamadaki gerçek seçimi raporla, sessizce farklı modele geçme. Yerel çalışma ağacını plan HEAD'iyle karşılaştır, yalnız ilk tamamlanmamış `ASAMA_01` aşamasını uygula ve test/kanıtlarını kaydet. Her aşama sonunda dur. Sonraki aşamaya yalnız yeni **“devam”** mesajımla geç. `execution_status: TAMAMLANDI` ise hiçbir kod, test, build veya deployment işlemi yapma.
