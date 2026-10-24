# BELGELER — TEK ÜST BAR (UNIFIED HEADER) | NİHAİ BİRLEŞİK UYGULAMA PLANI V3

> **Plan ID:** `belgeler-unified-header-2026-10-24`  
> **Revizyon:** `3.0 — NİHAİ` · **Tarih:** `24.10.2026` · **Saat dilimi:** `Europe/Istanbul`  
> **Durum:** `PLAN_HAZIR / UYGULAMA_BASLAMADI`  
> **Uygulayıcı:** Kullanıcının Windows ortamındaki yerel ajanı; istenen model **Gemini 3.8 Flash** (`gemini-3.8-flash`, uygulama destekliyorsa thinking `high`).  
> **Proje:** `https://github.com/smitelagwar/muhendislik-site` · `https://muhendislik-site.vercel.app/`  
> **Kapsam:** `/belgeler/*` altındaki **beş** belge doldurma/PDF stüdyosu; sayfa ve ilgili modal görünümleri.  
> **Yayın:** Yerel testler tamamlanana kadar **deploy yok**. Final kabulden sonra proje kurallarıyla **tek kontrollü production release**; ara aşamalarda ayrı commit/push/deploy yok.  
> **ÖNEMLİ:** Bu belge, V1/V2 planının ve kullanıcıdan gelen iki planın **yerine geçer**. Eşzamanlı başka ajanın aynı dosyaları değiştirmesine izin verme. Planı okumak, kendi kendine uygulamak demek değildir.

---

## 0. Yönetici kararı: hedeflenen sonuç

Mevcut masaüstü ekranında üç bağımsız üst alan var:

1. `Belgelere dön` + tekrarlı belge başlığı (sayfa kabuğu),
2. Belge ikonu/başlık/alt başlık + `Taslak (Kapalı)` + `Canlı Önizleme Hazır` (stüdyo içi),
3. PDF yakınlaştırma ve görüntüleme araçları (PDF paneli üstü).

**Hedef:** Bunları **bir adet kalıcı, tek satırlık, profesyonel üst çalışma barında** birleştir. PDF ve form pencereleri kalan alanı gerçekten kullansın. Aksiyonlar kaybolmasın. Masaüstü web deneyimi ilk hedef; mobilin bozulması sürümü bloklar.

### Hedef görsel düzen

```text
MASAÜSTÜ (yeterli genişlikte tek satır)
┌──────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ ‹ Belgeler │ [ikon] Şantiye Şefi Taahhütnamesi │ [−] [%100] [+] [Sığdır] [↗] │ [Taslak] [✓ Hazır] │ [Odak] [Form %100] [☾] │
└──────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
┌─────────────────────┬────────────────────────────────────────────────────────────────────────────────────────┐
│ SOL FORM            │ CANLI PDF / DÜZENLEME ÖNİZLEMESİ                                                    │
│                     │ (ikinci PDF toolbar satırı YOK)                                                         │
└─────────────────────┴────────────────────────────────────────────────────────────────────────────────────────┘
          MEVCUT ALT İŞLEM ÇUBUĞU AYNEN KORUNUR

DAR MOBİL, örnek (tek satır; yalnız kritik öğeler)
┌─────────────────────────────────────────────────────────┐
│ [‹] [Belge adı…]                      [Taslak] [⋯]       │
└─────────────────────────────────────────────────────────┘
           FORM / PDF sekmesi + mevcut alt butonlar korunur

[⋯] görünüm menüsü: PDF − / +, % zoom bilgisi, Sığdır, Yeni sekme,
       sayfa gezinmesi (çok sayfalıysa), tema, kullanılabilir form görünüm ayarları.
       PDF'ye Odaklan yalnız gerçekten desteklendiği masaüstünde etkin olur.
```

**Başlık kararı:** Sayfa modunda bir adet semantik `<h1>` ve bir adet görünür belge adı; modalde başlık uygun `<h2>`/dialog `aria-labelledby` olarak korunur. Alt başlık büyük masaüstünde belge adının altında aynı **barın içinde** olabilir; dar masaüstünde/metin büyümesinde gizlenir, mobilde gizlidir. **Tek bar**, tek satır toolbar demektir; belge adı bloğunun içinde iki metin satırı masaüstünde kabul edilir.

**Gerçekçi alan hedefi:** `~110–130 px` kazanç iddiası **kanıtlanmış bir ölçüm değildir**. PDF ve form kazancı farklı olabilir; mevcut shell/nav ve PDF toolbar'ın kapladığı gerçek CSS yüksekliklerinden ölç. Normal durumlarda **PDF çalışma yüksekliğinde net ≥48 CSS px**, **formda net pozitif kazanç** hedefle; testle ölçemediğin büyüklüğü raporda gerçek gibi yazma. Kritik uyarı banner'ları ayrıca değerlendirilir.

---

## 1. Kaynak incelemesi: doğrulanan gerçekler ve yerel sınır

### 1.1 Doğrulandı (24.10.2026, uzak `main`)

- İncelenen GitHub `main` commit: **`04048e50fd02e50c1c9ea783acec2d7383f516b4`**, commit zamanı `2026-10-23T15:15:55Z`. Bu, kullanıcı bilgisayarındaki **yerel değişiklikleri içerdiği anlamına gelmez**.
- `src/components/belge-studio-page-shell.tsx`: sayfanın ayrı desktop nav'ını ve `h1` başlığını gösteriyor.
- Beş stüdyoda (`taahhutname-studio.tsx`, `sozlesme-studio.tsx`, `istifa-studio.tsx`, `insaat-ruhsati-studio.tsx`, `beton-dokum-studio.tsx`) ikinci başlık, taslak rozeti ve önizleme durumu bulunuyor.
- `src/components/belge-studio-pdf-preview.tsx`: **`zoomLevel`, `currentPage`, `pageCount`, `handleToolbarZoom`, `handleFit` ve canvas yaşam döngüsünün sahibi**. `BelgeStudioPreviewToolbar` bu bileşenin içinde render ediliyor. Mevcut `handleFit` zoom'u **%100'e döndürüyor**; ayrı, kalıcı bir `fitMode` state'i doğrulanmış değil.
- `src/components/belge-studio-preview-toolbar.tsx`: zoom, sığdır, yeni sekme, sayfa gezinme, `PDF'ye Odaklan`, `Form %100`, tema; yeni sekme `target="_blank"` bağlantısı ve uygun `rel` ile açılıyor.
- `src/components/belge-studio-draft-controls.tsx`: taslak rozeti **etkileşimli** ve kendi açılır paneli var. İzin/geri yükleme/çakışma/hata uyarıları **koşullu** ayrı banner olarak gösteriliyor.
- `src/components/belge-studio-actions.tsx`: alttaki masaüstü işlemleri ve mobil `Formu Düzenle / PDF İndir / Diğer belge işlemleri` akışı var; mobil menüde form görünümü ve tema için mevcut erişim noktaları bulunuyor.
- `src/hooks/use-belge-studio-pdf-focus.ts`: odak modu **`min-width:1024px`**; mobilde çağrılırsa etkisiz olabilir. Formu odaktan sonra açarken scroll/focus restore ediyor.
- `src/hooks/use-belge-studio-mobile-viewport.ts`: sanal klavye/`visualViewport` yüksekliği ve odaklanan alan görünürlüğü için mevcut koruma var.
- `src/app/layout.tsx`: `viewportFit: "cover"` **zaten var**. Tekrar değiştirme.
- `src/app/globals.css`: eski `.belge-preview-controls` grid'i, dar panelde **iki satıra geçen `@container (max-width:780px)` kuralı**, `.belge-preview-panel { container-type:inline-size; }`, `[data-testid="belge-studio-preview-toolbar"] .preview-tool-button` ve mobil çok sayfalı kurallar mevcut. **Salt Portal eklemek bu CSS'i temizlemez.**
- `src/lib/belge-studio-layout.ts`: `flex-1 min-h-0 overflow-hidden` ve belge paneli sözleşmesini içeriyor. `src/lib/belge-studio-zoom.ts`: zoom sınırları **%50–%400**, adım **%25**.
- `src/components/belge-studio-section.tsx`: `BelgeStudioSectionMasterControls` (`Diğerlerini Kapat / Tümünü Aç`) **sol form scroll alanı içinde**; global PDF toolbar'ın parçası değil.
- `src/components/belge-studio-form-view-menu.tsx`: **form ölçeği** (`Form %100`) ayrı, **PDF zoom** ayrı; işlevleri karıştırma.
- `PROJECT.md`, `AGENTS.md`, `GEMINI.md`, `.agents/rules/belgeler-kurallari.md`, `.agents/rules/test-ve-otomasyon-standardi.md`, `.agents/rules/vercel-kurallari.md`, `docs/BELGELER_SISTEMI.md` incelendi. Yerel akışta ara deploy yerine finalde tek anlamlı checkpoint + `main` push tercih edilir.

### 1.2 Kaynak sınırları ve yerelde doğrulanacaklar

1. Planın dayandığı commit ile **mevcut yerel `HEAD`, branch, `git status --short`, staged/unstaged dosyalar** karşılaştırılacak. Özellikle kullanıcı hâlihazırda Gemini/Claude ile kod yazdırıyorsa **çakışan işi durdur, kimseyi otomatik resetleme/pull yapma**.
2. Beş stüdyonun son yerel sürümleri, sayfa/modal kullanımları, aktif feature flag'ler, toolbar selector'ları ve yaşayan testler yeniden okunacak.
3. UI gerçek `localhost` ölçüleri, browser zoom, `PDF üzerinde düzenle`, `Formu Düzenle` ve hazır/yükleniyor/hata durumu görülmeden yeni kodun başarılı olduğu iddia edilmeyecek.
4. `viewport-fit: cover` mevcut olduğundan bu plan kapsamında yeniden ekleme gerekmez. Tam ekran yüksekliği için mevcut `visualViewport` + CSS akışı korunacak; `100dvh` ancak ölçülen yerel sorun ve repo sözleşmesiyle uyumlu küçük düzeltmede gündeme gelir.
5. GitHub `main`'de olması, Vercel Production'ın aynı commit'te olduğu anlamına gelmez. Yayın yalnız final aşamada doğrulanacak.

### 1.3 Hedef model, uygulama maliyeti ve kaynaklar

Google resmî dokümanına göre **Gemini 3.8 Flash** model kodu `gemini-3.8-flash`, desteklenen düşünme düzeyleri `low`/`medium`/`high`; varsayılan `medium`. Kullanıcının seçtiği **Gemini 3.8 Flash** korunacak; yerel arayüzde erişilebiliyorsa `high` seçilebilir, alternatif modele sessiz geçilmez. Çok dosyalı güvenli refactor ve test yüzünden **küçük, kapılı aşamalar** kullan.

- Resmî model kartı: https://ai.google.dev/gemini-api/docs/models/gemini-3.8-flash
- React Portal ve event bubbling: https://react.dev/reference/react-dom/createPortal
- CSS viewport ölçü birimleri: https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/length
- Repo bağlamı: https://github.com/smitelagwar/muhendislik-site/blob/main/PROJECT.md
- Repo ajan kuralları: https://github.com/smitelagwar/muhendislik-site/blob/main/AGENTS.md
- Belgeler mimari dokümanı: https://github.com/smitelagwar/muhendislik-site/blob/main/docs/BELGELER_SISTEMI.md

---

## 2. Üç planın hakem kararı: KABUL / DÜZELT / RED

| Kaynak ve karar | Hakem değerlendirmesi | Nihai uygulama kuralı |
|---|---|---|
| **Benim V1** — tek ortak header ve taşınan toolbar | **KABUL** | Beş ayrı toolbar kopyası yapma; ortak bileşen kullan. |
| **Benim V2** — Portal + CSS/menü/focus korumaları | **KABUL** | Preview state'i aynı kalsın; Portal hedefi stabil; taşma CSS'i yeniden kurulacak. |
| **Benim V2** — sabit kazanım eşiği | **DÜZELT** | Form ve PDF yüksekliğini ayrı ölç; gerçekleşmeyen kazanç raporlanamaz. |
| **Claude mobil M1–M14** — bloklayıcı testler | **KABUL, TEKNİK İSTİSNALARLA** | Tüm kurallar aşamaya/teste bağlandı; değişen maddelerin sebebi aşağıda açık. |
| **Claude M13** — zoom state'i mutlaka yukarı taşınır | **DÜZELT** | **Tek state zorunlu; yukarı taşıma zorunlu değil.** Portal ile gerçek preview state'i korunursa daha az risklidir. |
| **Claude M13** — kalıcı fit mode/observer ile auto-refit | **DÜZELT** | Mevcut `handleFit()` %100 yapar; olmayan `fitMode` icat etme. Resize sonrası mevcut %100/manuel zoom geometri davranışını koru. |
| **Claude M1** — her koşulda en çok 56px | **DÜZELT** | Normal font ve normal zoomda ≤56 mobil / ≤64 masaüstü; sistem yazısı büyürse **erişilebilirlik** katı yükseklikten üstündür, yine çok satırlı toolbar yok. |
| **Claude M2** — 44px hedef ve 8px aralık | **KABUL** | Doğrudan görünen dokunmatik kontroller 44×44; yer yetmezse overflow menüsü. |
| **Claude M5** — taslak/preview durumunu ikona kısalt | **KABUL** | Fakat hata, taslak izni, kaydetme çatışması gibi aktif uyarılar görünür ve ekran okuyucu tarafından okunur. |
| **Claude M8** — tüm `vh` kodunu `dvh` yap | **DÜZELT** | Mevcut `visualViewport` koruması korunacak; kapsam dışı genel viewport refactor'ı yapılmayacak. |
| **Claude** — her aşama ayrı commit | **RED** | Proje yerel çalışma kuralı: her aşama yerel durum kaydı, finalde tek atomik commit ve en fazla bir production deploy. |
| **Gemini** — 3 bölmeli profesyonel tek satır | **KABUL** | Sol gezinme/kimlik, orta PDF görünüm, sağ durum/ayar. Daralmada ölçülü overflow. |
| **Gemini** — tüm zoom state'ini `PageShell`'e yükselt | **RED (varsayılan yöntem)** | PDF state/canvas'da gereksiz büyük refactor, render ve senkronizasyon riski. Yalnız kanıtlı Portal engelinde tek-controller alternatifi. |
| **Gemini** — `h-8` / `w-8` buton | **RED** | 32px dokunma alanı yetersiz; görünür hedef min. 44px. |
| **Gemini** — `h-[calc(100vh-3.5rem)]` | **RED** | Mevcut üst/alt çubuk, safe-area ve sanal klavye yüksekliği ile çakışabilir; flex/`min-h-0` koru. |
| **Gemini** — üst bar `backdrop-blur` | **RED** | Gerekli değil; düşük maliyetli opak arka plan, iki tema. |
| **Gemini** — “Diğerlerini Kapat” ilk accordion içine | **KOŞULLU** | Bu kontrolü **global üst bara taşıma**. Kullanılabilirlik için ilk section içine rastgele nested button yerleştirme; ancak kanıtlı gereksiz satır varsa aynı semantiği koruyan **ayrı** kompakt satır içi işlem olarak düzenle. |
| **Gemini** — ~110–130px kazanç | **KABUL EDİLMEYEN TAHMİN** | Ayrı form/PDF DOM ölçümünde gerçek net kazanım raporla. |
| **Gemini** — yalnız desktop breakpoint/tooltip | **DÜZELT** | Tooltip tek açıklama olamaz; mobil, browser zoom, text scaling, landscape ve erişilebilir overflow menüsü dahil. |
| **Claude** — hiç deploy yapma ama sonunda Production | **NETLEŞTİR** | Çalışma sırasında deploy **0**; final kalite kapısından sonra **1 Production** (repo release kuralına bağlı). |

**Koruma dokümanı çatışma ilkesi:** M1–M14 test kapsamı **tamamı korunur**, fakat mevcut repo gerçekliğiyle çelişen *uygulama yöntemi* (örn. `fitMode` varsayımı, her aşama commit) birebir dayatılmaz; hedef davranışı karşılayan daha güvenli çözüm uygulanır.

---

## 3. Değişmeyecek işlevsel sözleşme ve öğe taşıma tablosu

| Öğe | Şu an | Finalde | Uygulama notu |
|---|---|---|---|
| `Belgelere dön` | `BelgeStudioPageShell` nav | Sol bölge | Normal sayfada; modalde `Kapat`, yanlış navigate yok. |
| Belge adı | Dış `h1` + iç görünür başlık | **Tek** başlık | Sayfada tek `h1`; modale semantik uyum. |
| Belge ikonu | İç header | Sol bölge | Görsel, dekoratifse `aria-hidden`. |
| Alt başlık | İç header | Sol bölge, yalnız yeterli web alanında | Mobil ve dar desktop'ta gizlenir; `title` tek bilgi kaynağı değildir. |
| Taslak (Kapalı / Cihaz / Sekme / Hata) | İç header | Sağ bölge, dar ekranda kompakt buton | Tek badge + tek popover; `draftApi` aynı. |
| Canlı PDF `Hazır / Hazırlanıyor / Hata` | İç header | Sağ bölge durumu | Küçük ekranlarda açıklama menüde veya canlı semantik durum; hata gizlenmez. |
| PDF yakınlaştır `− %n +` | Preview toolbar | Orta bölge, darsa görünüm menüsü | Tek `zoomLevel`; mevcut `onZoomChange`. |
| Sığdır | Preview toolbar | Orta / menü | Mevcut `handleFit` ile aynı sonuç, yeni fit-mode yok. |
| Yeni sekmede PDF | Preview toolbar | Orta / menü | Kullanıcı tıklamasıyla gerçek `<a target="_blank" rel="noopener noreferrer">`; `blobUrl` hazırlık kontrolü. |
| Sayfa önce/sonra | Preview toolbar, çok sayfalı PDF'de | Orta / menü | Sayfa 1/N ve sınırlar korunur. |
| PDF'ye Odaklan / Formu Göster | Desktop preview toolbar | Sağ bölge, desktop | `<1024px` etkisiz/no-op buton gösterme; mobil form/PDF geçişi kendi mekanizmasında. |
| Form %100 / form görünümü | Desktop toolbar + mobil alt menü | Sağ bölge / dar ekranda menü | **PDF zoom değil**, mevcut form kontrol API'siyle. Mobil alt menü erişimi kaldırılmaz. |
| Tema | Desktop toolbar + mobil alt menü | Sağ bölge / dar ekranda menü | `next-themes` mevcut global kapsam aynı; duruma göre ikon. |
| Aç/kapat akordeon komutu | Sol form başında | Sol form içinde | İsteğe bağlı **satır optimizasyonu**; form davranışı korunur. |
| Alt işlemler | `BelgeStudioActions` footer | **Yerinde** | Sıfırla/Temizle/Geri al/Boş form/Yazdır/Paylaş/PDF İndir değişmez. |
| PDF üzerinde düzenle | PDF üzerindeki yüzen buton | **Yerinde** | Pointer/touch/sheet koduna dokunulmaz. |
| Taslak izin/restore/çatışma/hata banner'ları | Gerektikçe bar altında | **Gerektikçe bar altında** | Kalıcı tekrar satır sayılmaz; kritik eylemleri gizleme. |

### 3.1 Masaüstü responsive öncelik (CSS viewport; fiziksel piksel değil)

| CSS viewport | Direkt bar öğeleri | Menüdeki öğeler / gizlenen metin |
|---|---|---|
| **≥1920px** | Geri + ikon/başlık/alt başlık, zoom, fit, yeni sekme, taslak, PDF durumu, odak, form görünümü, tema; çok sayfa nav | Gereksiz menü yok; başlık/kontrol arasında ayrım. |
| **1440–1919px** | Geri, ad, zoom, fit, taslak, hazırlık durumu, odak, form görünümü, tema; kapasite varsa yeni sekme ve page nav | Önce alt başlık kapanır; daha düşük öncelikli metinler ikona döner. |
| **1024–1439px** | Geri (ikon + sığarsa metin), kısaltılmış başlık, PDF zoom veya doğrudan zoom grubu, taslak, gerektiğinde durum, overflow | Form görünümü, yeni sekme, tema, bazı ikincil komutlar overflow; odak mümkünse direkt, değilse overflow. |
| **640–1023px** | Geri, başlık, taslak, overflow; sığarsa zoom ikonu | Mobil içerik sekmeli olduğu için yalnız o sekmede geçerli görünüm eylemleri; PDF'ye Odaklan yok. |
| **320–639px** | Geri **44px**, min. erişilebilir başlık alanı (yaklaşık ≥90px), kompakt taslak **44px**, overflow **44px** | Zoom `− / +`, yüzde, fit, yeni sekme, multi-page, tema ve form ayarları menüde; PDF hazır/hata ayrı erişilebilir durum. |

**Kritik:** Bu tablo **aşırı şişme göstermeyen deterministik bir başlangıç politikasıdır**; 1024–1439 aralığındaki hangi öğenin direkt görünür olduğu gerçek sığma testine göre **aynı politikada** netleştirilecek. Eşikler mevcut içerik `lg=1024px` ile tutarlı olmalı. **Aynı CSS breakpoint'te masaüstü toolbar ile mobil form layout'u birbirine ters düşemez.** Tarayıcı %150 zoom ile 1366 fiziksel genişlik → yaklaşık 911 CSS px olduğunda **mobil/tek panel moduna geçmek mevcut beklenen davranış olabilir**; bunu zorla desktop'a çevirmeye çalışma.

### 3.2 Hata, durum, etkileşim davranışı

- Hazır olma kontrolü **görsel senkronizasyon metni**; PDF üretimi hazır, önizleme henüz render ediliyorsa doğru durumu göster. Önceki revision'dan gelen gecikmiş callback'lerle yanlış `Hazır` gösterme.
- Taslak menüsü, kullanıcının cihaz/sekme tercihi, duraklat, sil, geri yükleme ve çakışma akışları **aynen** çalışır. `Taslak (Kapalı)` gerçek butondur; pasif LED'e dönüştürülmez.
- Portal eklendiğinde **DOM'da bir** PDF toolbar (`data-testid` korunur), **bir** taslak popover sahibi, **bir** üst header ve **bir** görünür belge adı vardır. Farklı responsive menü görünümlerinin aynı callback'i kullanması, **ayrı state oluşturmak** anlamına gelmez.
- Overflow `⋯` menüsünde iç içe bağımsız dropdown root'ları **olmaz**. Form görünümünün alt ayarları gerekiyorsa aynı menü içinde uyumlu submenu **veya** menü kapandıktan sonra açılan ayrı kontrollü menü kullan. Taslak popover'ı genel overflow menüsüne gömerek focus/click-away mekanizmasını bozma; mümkünse **ayrı 44px üst bar butonu** olarak tut.
- CSS `display:none` altındaki kontrol odak/tab sırasında erişilebilir sayılmaz. Genişlik geçişinde menü kapanıp tetikleyiciye odak dönsün; `aria-label` Türkçe olsun; hata bilgi metnini yalnız renk veya hover taşımasın.
- Modal içinde `Escape`, önce açık menüyü kapatır; modalin `onClose`/sheet davranışı yalnız mevcut sözleşmeyle tetiklenir. `Tab`, `Shift+Tab`, `Enter`, `Space` kontrolleri çalışır.

---

## 4. Seçilen teknik mimari (uygulayıcıya net talimat)

### 4.1 Önerilen **tek sahipli Portal** çözümü

**Tercih:** `BelgeStudioPdfPreview` **PDF ve zoom/sayfa/canvas state sahibi kalır**. Sadece `BelgeStudioPreviewToolbar`'ın DOM konumu, her stüdyonun üst barındaki **stabil ref slotuna** `createPortal` ile taşınır.

**Neden:** PDF zoom state'ini önce beş farklı `*Studio`'ya ve sonra `BelgeStudioPageShell`'e yükseltmek mevcut canvas/resize/annotation/selection akışını gereksizce genişletir. Portal, tek action/state'i korurken ikinci kalıcı satırı ortadan kaldırır.

**Tipli sözleşme taslağı (uygularken gerçek tiplere uyarla):**

```tsx
// src/components/belge-studio-unified-header.tsx (YENİ, ortak)
// Props: title, subtitle, icon, isModal, onClose, draftApi, syncStatus,
// onRegisterToolbarSlot / toolbarSlotRef; normal sayfada geri link,
// modalde uygun kapatma; h1/h2 semantiği. Slot tek DOM elementidir.

const [toolbarTarget, setToolbarTarget] = useState<HTMLDivElement | null>(null);

<BelgeStudioUnifiedHeader
  title={documentTitle}
  subtitle={documentSubtitle}
  isModal={isModal}
  onClose={onClose}
  draftApi={draft}
  syncStatus={syncStatus}
  toolbarSlotRef={setToolbarTarget}
/>

// src/components/belge-studio-pdf-preview.tsx — VAR OLAN dosya
// BelgeStudioPdfPreviewProps'a ek: toolbarTarget?: HTMLElement | null
const toolbar = <BelgeStudioPreviewToolbar {...existingToolbarProps} />;
return (
  <section aria-label="PDF canlı önizlemesi" className="...">
    {toolbarTarget ? createPortal(toolbar, toolbarTarget) : null}
    {/* mevcut canvas, overlay, inline editing, yükleme durumu aynen */}
  </section>
);
```

**Bu kod birebir yapıştırılacak uygulama değil, taşıma sözleşmesidir.** JSX kapanışları ve bütün gerçek props tipleri yerelde doğrulanır. Ayrıca stüdyonun ilk render'ında hedef slotun oluştuğu durum kontrol edilir.

**Bilinçli korumalar:**

1. Portal hedefi **studio instance'ına özel bir `ref`**; global `document.querySelector` veya çakışan sabit `id` yok. İki stüdyo/modal birlikte varsa hedefler karışmaz.
2. Portal hedefi, `theme`, zoom, tab, status ve responsive değişiminde **aynı DOM node** olarak kalmalı; aksi halde Portal çocuğu yeniden yaratır. `key`'le zorla remount yapma.
3. PDF preview `<section>` ve canvasi **asla sırf toolbar taşındı diye unmount etme**. `zoomLevel`, `pageCount`, `currentPage`, `renderedToken`, worker lifetime, form odak ve selection/scroll korunur.
4. SSR'da henüz target yoksa **ikinci eski toolbar'ı fallback olarak gösterme**; bu hem iki satır flaşı hem de çift gerçek aksiyon yaratır. Slot kısa süre boş kalabilir; varsa okunabilir ekran okuyucu metni durumu belirtir. Hydration hatası olmamalı.
5. `createPortal` **React ağacına göre event bubbling** yapar. `onKeyDown`, `onPointer...` gibi preview parent handler'ları buton etkileşimini yanlış yorumlamamalı; gerçek `event.currentTarget.contains(event.target)` ve klavye odak davranışı test edilir. `stopPropagation`'ı körlemesine her elemana ekleme.
6. Mobil `activeTabMobile === 'form'` iken preview DOM'u CSS ile görünmez olabilse bile, Portal üst bar butonları **gerçekten erişilebilir** olmalı; ancak PDF eylemini kullanıcıya görünmeyen önizleme üzerinde sanki etkiliymiş gibi sunma. Menüde gerekli açıklama veya mevcut PDF Önizle geçişi korunur. Mobil viewport odak mekanizması güncellenir ama motor değiştirilmez.
7. Popover/DropdownMenu'ler üst header/`overflow:hidden` nedeniyle kırpılırsa **yalnız menu katmanını** uygun portal/collision boundary'ye al; taslak kaydetme state'ini değiştirme. Ekran kenarı, safe-area ve `z-index` test edilir.
8. Başlık ve belge durumu ayrı Studio bileşenlerinde 5 kez JSX olarak kopyalanmaz; ortak `BelgeStudioUnifiedHeader`'a konfigürasyon geçilir. Mevcut belge başlığı veri sözleşmesini tek yerde doğrula.

**İkinci seçenek (sadece kanıtlı Portal engelinde):** `useBelgePreviewControls` benzeri dar controller/hook + stabil API; **tek state sahibi**, memoized event handler'lar, rendering/worker ownership preview'de kalır. Sadece Portal'ın bileşen yaşam döngüsü/DOM güvenliği veya portal içinde erişilebilirlik kabulü sağlanamadığı kanıtlanırsa seç. Bu kararı `IMPLEMENTATION_STATE.md`'de hangi testin neden başarısız olduğu ile gerekçelendir; temelsiz Context/Zustand kütüphanesi ekleme.

### 4.2 CSS ve yükseklik sözleşmesi

- `BelgeStudioPageShell`'in dış nav satırı kaldırılır; artık `h1` stüdyo ortak header'ın normal sayfa görünümündedir; modal semantiği ayrıdır. Shell'in `h-full min-h-0`, safe-area ve `flex-1 overflow-hidden` sözleşmesi korunur.
- Stüdyo mevcut iç header'ı **aynı satırda ortak bar ile yer değiştirir**. Normal/hata banner'ları stüdyonun mantığında kalır. PDF panelinde `BelgeStudioPreviewToolbar`'ın **eski normal akış satırı, margin'i ve boş rezerv yüksekliği kalmaz**.
- `src/app/globals.css`'te eski `.belge-preview-controls` için **3 sütun grid / `@container` 2 satır kırılımı** yeni header'da kullanılmaz. Yeni `.belge-unified-header`, `.belge-unified-tools` gibi açık sınıflarla `flex-nowrap`, `min-w-0`, `overflow` kontrollü CSS oluştur; yalnız görevle ilgili eski CSS'i temizle. `preview-tool-button` görünüm/hover/focus/disabled kurallarını yeni scope'ta koru; PDF canvas'a ait `container-type`/raster limitlerini körlemesine kaldırma.
- Üst bar mobilde **tek satır**; normal fontta `≤56 CSS px`, masaüstünde `≤64 CSS px` hedef. `min-h-*` yeterli; tüm öğeler taşarsa metni/tıklama alanını küçültme, menüye al. Yazı ölçeği arttığında (130%/200% veya browser zoom) ergonomi/erişilebilirlik **katı yükseklik sınırından önce gelir**.
- `flex: 1; min-height:0` ve iç `overflow-auto` ile gerçek kullanılabilir alanı kazan. **YASAK:** `h-[calc(100vh-3.5rem)]`, `overflow-x:auto` toolbar, genel `100vh` → `100dvh` dönüşümü, `user-scalable=no`, `maximum-scale=1`, form/PDF üzerine pozisyonlanan ikinci sabit toolbar.
- `env(safe-area-inset-top/left/right)` kapsayıcıda zaten olabilir: **çift padding ekleme**. Çentikli/yatay modda gerçek içerik konumunu ölçerek gerekiyorsa tek katmanda düzelt. `viewportFit:"cover"` zaten var.
- Üst bar `position: sticky` veya `fixed` olmak zorunda değil: shell'in kaymayan ilk çocuğu/normal layout akışında kalır, form/PDF panelleri ayrı kayar. `backdrop-blur` şart değil, mümkünse kullanma.
- `.belge-preview-panel` ve `.belge-preview-surface` ölçülerini, `devicePixelRatio`/PDF.js raster sınırlarını değiştirme. Yalnız render container yeni boyutu alır; zaten var olan `ResizeObserver` çalışır. **Manuel zoom değeri korunur**; `Sığdır` (`handleFit`) eski davranışı sürdürür. Yeni kalıcı `fitMode` state'i icat edilmez.

### 4.3 “Diğerlerini Kapat” için kapsam kararı

**Öncelik:** İçerik formunun üstündeki `BelgeStudioSectionMasterControls` **global üst bara ait değil**. Bu komutu yeni barın içine koyma, form akordiyon sisteminin mantığını baştan yazma.

**Koşullu mikro iyileştirme (Aşama 05):** Ölçüm bu kontrole ayrılan satırın formda gerçekten gereksiz alan harcadığını kanıtlarsa, **ayrı erişilebilir buton** olarak ilk bölüm başlığıyla görsel olarak aynı yatay hizada sunulabilir; fakat accordion trigger'ın **içine başka `<button>` yerleştirmek yasak**. `Tümünü Aç` ve `Diğerlerini Kapat` iki davranışı, orijinal `sectionsApi` ve `data-testid="belge-sections-toggle-all"` korunsun. Bu taşımayı yapmak ekstra risk yaratıyorsa **olduğu yerde bırak**; ana görev için kabul engeli oluşturmaz.

---

## 5. Aşama özet tablosu

| Aşama | Tek doğrulanabilir çıktı | Kod/komut | Bitişte dur |
|---|---|---|---|
| **ASAMA_01** | Yerel gerçeklik + baseline + çakışma koruması | Read-only keşif/ekran ölçümü | Evet |
| **ASAMA_02** | Beş stüdyo için ortak semantik tek header | Header bileşeni ve sayfa kabuğu | Evet |
| **ASAMA_03** | PDF toolbar üst bara Portal ile taşınmış; tek state | Preview + toolbar + CSS | Evet |
| **ASAMA_04** | Masaüstü/dar/mobil görünüm ve menü | Responsive CSS + overflow actions | Evet |
| **ASAMA_05** | Alt davranış / popover / modal / form korumaları | Odak, taslak, akordeon mikro düzen | Evet |
| **ASAMA_06** | Gerçek regresyon, kalite ve alan kazanımı kanıtı | Testler + Playwright + build | Evet |
| **ASAMA_07** | Kontrollü final release + canlı doğrulama | Tek commit/push/deploy ve smoke | Son |

### ASAMA_01 — Yerel keşif, korunacak temel ve metrik baz çizgisi

**Giriş:** Kullanıcı açıkça `Başla`/`devam` demiş, hedef yerel proje erişilebilir; eşzamanlı kod yazan ajanın aynı kapsamı değiştirmediği doğrulanmış.

**Uygulama sırası:**

1. Yerel `PROJECT.md` → `AGENTS.md` → `GEMINI.md` → ilgili `.agents/rules/*.md` → `docs/BELGELER_SISTEMI.md` oku. `GEMINI.md` içindeki ECC aktifse görevle ilgili dosya/kuralları uygula; CAD motor korumasını bozma.
2. `git status --short`, `git branch --show-current`, `git rev-parse HEAD`; remote commit `04048e5...` ve yerel farkları **yalnız oku**, reset/pull yok. Mevcut değişiklikleri kullanıcıya ait kabul et. Önceki plan çalıştırıldıysa mevcut göreve ait değişikliği tespit edip tekrardan kodlama yapma.
3. Beş studio, `PageShell`, `PdfPreview`, `PreviewToolbar`, draft badge, actions footer, sections master, mobile viewport hook, `globals.css` ve mevcut E2E test seçicilerini doğrula.
4. Gerçek `localhost` ve mevcut tarayıcı ortamında **en az** 1920×1080, 1366×768, 390×844, 320×568 ekranları açık/koyu tema ile görüntüle. PDF hazır ve taslak kapalı durumda `outer nav`, `studio header`, `preview toolbar`, `form clientHeight`, `PDF canvas clientHeight`, `horizontalOverflow` ölç. Ekran görüntülerini `docs/belgeler-unified-header/evidence/` altında **gerçek kişisel veri olmadan** tut; mümkünse sentetik örnekler kullan.
5. İki sayfalı sözleşmede sayfa gezinmesini, mobil form/PDF alt geçişini, %25 zoom ve Sığdır sonucunu, draft menüsünün popup'ını temel doğrulama olarak belgeye geçir. Mevcut baseline bug'larını yeni geliştirme hatalarıyla karıştırma.
6. **Yeni dosyalar** (varsa mevcut benzer yerel plan klasörüyle çakışmayacak): `docs/belgeler-unified-header/PLAN.md` (bu nihai metin) ve `docs/belgeler-unified-header/IMPLEMENTATION_STATE.md`; ayrı günlük rapor dosyası yığını yapma. Konfigürasyon/senaryo notları yalnız ilgili state kaydında olsun.

**Doğrulama:** Gerçek viewport DOM ölçümleri, screenshot, repo farkı ve çalışma ortamı kanıtı. Her birinin yanında `ölçüldü / doğrulanamadı` yaz.

**Kabul:** Kod yazmaya yetecek yerel farklılıklar ve mevcut testler biliniyor; çakışan ajan varsa güvenli durma/aktarılma kararı verilmiş. **Hata/geri dönüş:** Erişimi olmayan aracı varmış gibi kullanma; çakışma varsa `ENGELLI` raporla ve kod yazma. **Dur:** Aşamayı kaydet ve tek `devam` bekle.

### ASAMA_02 — Ortak Header iskeleti + semantik başlık

**Giriş:** ASAMA_01 başarılı, yerel dosyalar stable.

**Kapsam:** **Yeni:** `src/components/belge-studio-unified-header.tsx` (adı mevcut bir dosyayla çakışıyorsa yeniden kullan). **Mevcut:** `belge-studio-page-shell.tsx` ve ilgili beş `*studio.tsx`.

**Uygulama sırası:**

1. Ortak header API'sini oluştur: `title`, `subtitle`, `icon`, `isModal`, `onClose`, `draftApi`, `syncStatus`, stabil `toolbarSlotRef`, `className` gerekiyorsa. Beş stüdyo yalnız belgeye özgü değerleri geçirir; header JSX'i beş kez kopyalanmaz.
2. `BelgeStudioPageShell` içindeki bağımsız görünür nav kaldır. Geri dönüş bağlantısı normal stüdyo ortak header'ına aktar. Sayfada tek semantik `h1` ve tek görünür başlık; modalde yanlış `h1` ve yanlış `/belgeler` navigasyonu üretme. Uygun dialog başlığı/close erişimi kalır.
3. Taslak `BelgeStudioDraftStatusBadge` ve live preview `syncStatus` header'a gerçek `draftApi`, `syncStatus` üzerinden aktarılır; fake/bekleyen kontrol kopyası yok. `BelgeStudioDraftControls` **kritik banner** mevcut akışta header'ın hemen altında kalır.
4. Header'ın PDF slotunu hazırla: target `ref` **bileşen mount ömründe sabit**; önceki toolbar hareketi **bu aşamada yok**. Eski toolbar işlevsel olarak yerinde kalabilir; sonrasında kaldırılacak. Başlıklar çiftleşme testi bu aşamada geçer.
5. Yalnız semantik/başlık değişiminden etkilenen test seçicilerini güncelle; route metadata bozulmaz.

**Doğrulama:** Tüm 5 belge açılıyor, tek başlık ve doğru `h1`/modal semantiği var; form ve PDF çalışıyor, taslak durumu doğru. **Kabul:** Ortak header belgeye bağımlı değil; portal slotu hazır. **Hata/geri dönüş:** 5 dosyayı bağımsız JSX ile çatallama; sıkıntılı route'u önce düzelt. **Dur:** Kaydet, bekle.

### ASAMA_03 — PDF toolbar'ın taşınması ve CSS ikinci satır temizliği

**Giriş:** ASAMA_02 başarılı; stabil slot var.

**Kapsam:** `src/components/belge-studio-pdf-preview.tsx`, `src/components/belge-studio-preview-toolbar.tsx`, `src/app/globals.css`, `src/lib/belge-studio-layout.ts` ve beş stüdyonun slot prop bağlantısı.

**Uygulama sırası:**

1. Preview-owned tek `BelgeStudioPreviewToolbar`'ı `createPortal(toolbar, toolbarTarget)` ile render et. Mevcut `zoomLevel`, sayfa ve `handleFit` **yerlerinde kalır**. `toolbarTarget` parametresi preview'a stüdyo header slotundan aktarılır. **Aynı DOM'da ikinci toolbar oluşturma.**
2. PDF panelinde toolbar'a ayrılmış eski normal akış satırını ve `mb-*` boşluğunu kaldır; canvas alanı doğrudan paneli doldurur. Scroll/pinch/selection/canvas elementleri aynı tree/key/owner ile korunur.
3. `.belge-preview-controls` eski grid ve `@container max-width:780px` **iki satıra geçiş** davranışını yeni header için devre dışı bırak/ayır; yeni header `nowrap` + CSS slotlar + overflow ile çalışsın. CSS taşımada `data-testid`/`.preview-tool-button` focus stilleri korunur.
4. Aynı toolbar'da zoom/fit, sayfa, yeni sekme, tema, PDF odak ve form görünümü işlevlerini koru. `PDF'ye Odaklan` üst header'daki yeni DOM pozisyonunda `useBelgeStudioPdfFocus` içinde scroll/focus restore aramasıyla uyumlu mu doğrula; kırılıyorsa **yalnız o bulma noktasını** ref/selector ile düzelt.
5. SSR hydration, StrictMode cleanup, active mobile form tab, popup/escape, canvas remount olmadan 3 kez zoom/fit ve restore testlerini yap. Portaldan kaynaklı ciddi olay/focus engeli varsa önce minimal çöz, sonra bölüm 4.1'deki kanıtlı tek-controller alternatifini değerlendir.

**Doğrulama:** `[data-testid="belge-studio-preview-toolbar"]` DOM'da **1** kez; header slotunda; preview alanında ikinci toolbar/boş satır yok; zoom ve page state korunur; gereksiz PDF document tekrar yüklemesi yok. **Kabul:** Orijinal işlev ve state tek sahipli. **Hata:** Form veya PDF motoruna dokunma; dar kapsamlı rollback/düzeltme yap. **Dur:** Kaydet, bekle.

### ASAMA_04 — Responsive web ve mobil overflow menüsü

**Giriş:** ASAMA_03 başarılı, fonksiyonlar yerinde.

**Kapsam:** ortak header/preview toolbar CSS, varsa küçük **yeni** `belge-studio-toolbar-overflow.tsx` (benzer varsa yeniden kullan). Genel navigasyon ve alt footer davranışı kapsam dışı.

**Uygulama sırası:**

1. Bölüm 3.1'deki desktop/orta/mobil öncelik politikasını uygula. Üç bölge tek satır ve `min-w-0`; alt başlık ilk kapanan metin. PDF zoom + taslak + geri bağlantısı öncelikli; diğer ikon/menü görünürlükleri deterministic CSS ile.
2. Tek `⋯` üst bar overflow menüsünü uygula; **var olan footer "Diğer belge işlemleri" menüsünü silme**. Üst bar overflow'u yalnız **görünüm + navigasyon** işleridir, belge yıkıcı aksiyonları burada gereksiz çoğaltma. İç içe taslak popup veya bağımsız Radix dropdown root'u koyma.
3. **Mobilde** PDF zoom `−/+`, yüzde bilgisi, fit, yeni sekme ve sayfa geçişi gerektiğinde overflow'da aynı callback'lerle bulunur. `Form %100` için mevcut formView handler'ları kullanılır; alt menüdeki form seçeneği çalışmaya devam eder. `PDF'ye Odaklan` butonu mobilde **no-op olarak gösterilmez** (desktop-only hook); mobil tab geçişi ayrı korunur.
4. Normalde mobil tek satır ≤56, desktop ≤64 CSS px; butonlar en az 44×44, mümkünse yan yana ≥8px ayırıcı boşluk. Yer yoksa ikincil eylemi menüye taşı. Sistem %130/%200 font ve browser zoomda kritik bilgi erişilebilir kalsın; gerektiğinde yükseklik esneklik payı var ama ikinci kontrol satırı yok.
5. Mobil `safe-area`, landscape, overlay clipping, body horizontal scroll ve Radix portal menü anchor/focus durumunu kontrol et. 320px'de metin başlığının gerçek okunabilir minimumunu koru.
6. Form sekmesi görünürken PDF toolbar portalında hidden parent, click ve klavye erişimi test et. Tema `next-themes` ile mevcut kapsamda çalışır; sistem teması/SSR ilk render uyumu bozulmaz.

**Doğrulama:** `320,360,390,412,640,768,911,1024,1093,1280,1366,1440,1536,1920,2560` CSS px'te yatay scroll yok; menü kırpılmıyor; mobil tab, landscape, touch, tema çalışıyor; çok sayfalı navigasyon menüde erişilir. **Kabul:** M1–M7 ve M11–M12/M14 ilgili kısımları sağlanır. **Hata:** Butonları 32px'e indirme veya tool'ları saklayıp geri getirmeme; overflow'a taşı. **Dur:** Kaydet, bekle.

### ASAMA_05 — Kullanım dayanıklılığı, erişilebilir menüler ve opsiyonel form mikro düzen

**Giriş:** ASAMA_04 başarılı.

**Kapsam:** Header popover erişimi, `use-belge-studio-pdf-focus.ts`, varsa draft popup yerleşimi, `use-belge-studio-mobile-viewport.ts` ile **yalnız gerekirse** entegrasyon, isteğe bağlı SectionMasterControls küçük düzeni.

**Uygulama sırası:**

1. Taslak popup'ının `Escape`, dış tıklama, `aria-expanded`, trigger'a geri fokus, tıklamayla taslağı aç/kapa, depolama tipi/son kaydı, pencere kenarı ve `overflow-hidden` ile kırpılma durumunu kontrol et. Gerekirse **popup pozisyonunu** düzelt; draft storage/consent mantığına dokunma.
2. Koşullu taslak banner'larının `izin`, `restore`, `conflict`, `save-error` durumlarında kaybolmadığını doğrula. `aria-live` duyuruları sadece gerçek değişimlerde okunur; sürekli `Hazır` spamı olmasın.
3. Modal aç/kapat, üst bar odak ve `Escape` sırası; React Portal event bubbling kaynaklı zoom klavye çakışması; preview form alanı focus restore ve scrollTop, `PDF'ye Odaklan` toggles.
4. Mobil sanal klavye açılınca üst bar/alt footer/inline edit sheet çakışmaz; `visualViewport` hesapları mevcut hook'ta korunur. Gerekirse yalnız scroll-padding düzelt.
5. **İsteğe bağlı** `Diğerlerini Kapat/Tümünü Aç` kontrolü ilk bölüm yakınında, nested interactive öğe yaratmadan, daha az dikey alanla sunulabilir; ancak bu mikro düzen hiçbir testi bozuyorsa ertelenir. Bu adım ana plan için bloklayıcı değil.
6. `prefers-reduced-motion`, açık/koyu tema kontrastı, `title`/`aria-label`, hover bağımsız kullanım ve `Tab/Enter/Space/Escape` testlerini geçir.

**Doğrulama:** İç içe menü hatası yok, mobil PDF inline edit ve form navigation aynı, modal Escape doğru, draft geri yükleme veriyi kaybetmiyor. **Kabul:** M4–M5, M8–M10, M13–M14; ilgili negatif senaryolar yeşil. **Hata:** Popup pozisyonu sorunu için storage hook'u değiştirme; `ENGELLI` kanıtı sakla. **Dur:** Kaydet, bekle.

### ASAMA_06 — Eksiksiz test matrisi + gerçek ölçüm ve build

**Giriş:** ASAMA_05'te işlevsel kabul var.

**Kapsam:** Var olan `tests/belgeler/`, `tests/site-audit/`, `playwright.site.config.ts`; gerekirse **YENİ** `tests/site-audit/belgeler-unified-header.spec.ts`, durum raporu.

**Test sırası:**

1. **Statik:** Değişen dosyalara hedefli ESLint; `npx tsc --noEmit --incremental false` (repo `tsconfig` kurallarıyla); gerekli hedefli TypeScript/React lint. CI olmayan bir derleyiciyi varmış gibi gösterme.
2. **Belgeler işlevi:** `npm run check:belgeler-pdf`; mevcut doküman/draft/share/inline testlerinin ilgili grubu. `npm run check:belgeler-inline-mobile` mevcut senaryo için uygun (Playwright kurulmuşsa). Kod seçicilerinden yeni test `data-testid`'leri teyit et.
3. **Beş route:** `santiye-sefi-taahhutnamesi`, `santiye-sefi-sozlesmesi`, `santiye-sefi-istifa-dilekcesi`, `insaat-ruhsati-dilekcesi`, `beton-dokum-tutanagi` — her birinde görünür tek başlık, header, pdf zoom, ready, taslak ve alt footer. İki sayfalı sözleşmede sayfa 1/2–2/2, sınırda prev/next disabled, zoom/page eşzamanı.
4. **Responsive matrisi:** Mobil `320×568,360×640,390×844,412×915`, landscape `844×390`, tablet `768×1024`, laptop `1280×720,1366×768`, desktop `1920×1080,2560×1440`; Chrome %100/%125/%150 zoom + mümkünse %200 metin/büyütme; CSS viewport'un gerçek değeri raporlanır. Chromium mobile + WebKit/mobile emülasyonu + **mümkünse gerçek Android/iPhone**. Emülasyon gerçek cihaz diye yazılmaz.
5. **Etkileşim:** PDF `50,75,100,125,400%`, pan/pinch/fit, PDF yeni sekme URL/erişim, tema, form görünüm, odak toggles, taslak disabled/saved/saving/error/restore/conflict, menü dış tıklama ve Escape, mobil `Formu Düzenle`, PDF üstünde alan düzenleme, uzun başlık, modal.
6. **PDF kalite:** Yeni bar sonrası sağ kenarda clipping, bulanıklık (DPR=1 ve 2), A4 sayfanın merkezlenmesi, PDF canvas `scrollWidth/clientWidth` dengesi, önizleme render iş akışı, `pdfjs worker` remount/lifecycle. Mevcut çalışan `ResizeObserver` tekrar ölçüyor mu ve elle zoom % korunuyor mu test et. Mobil kritik pinch/pan kodunu değiştirmeden regresyonu yakala.
7. **Ölçümler:** Aynı belge ve eşit viewport/zoom/tema/taslak banner şartlarında önce/sonra `outer nav`, `studio header`, `preview toolbar`, `unified header`, `form.clientHeight`, `pdfViewport.clientHeight`, `documentElement.scrollWidth` ve `window.innerWidth`. Görsel kanıtları **kişisel veri olmadan** kaydet; PDF ve form kazancını ayrı hesapla:

```text
PDF_gain_CSSpx  = PDF_viewport_after.clientHeight - PDF_viewport_before.clientHeight
Form_gain_CSSpx = form_scroll_after.clientHeight - form_scroll_before.clientHeight
Old_chrome      = outer_nav_height + inner_header_height + pdf_toolbar_height + relevant_gaps
New_chrome      = unified_header_height + remaining_relevant_gaps
Nominal_gain    = Old_chrome - New_chrome   // gerçek PDF/Form kazancının yerine geçmez
```

8. **Son kalite kapısı:** Hedefli testler ve lint geçerse **tek kez** `npm run build`; testler başarısızsa düzelt ve yalnız etkilenen kontrolleri yeniden çalıştır, ardından final kapı. Ayrıca kullanıcı değiştirmediyse production build script/`prebuild` ilişkisini koru.

**Final kabul koşulları:**

- [ ] Tek görünür ortak üst bar, tek semantik sayfa `h1`, ikinci kalıcı PDF toolbar satırı yok.
- [ ] Tek zoom state sahibi, beş route + modalde (varsa) işlev kaybı yok.
- [ ] Başlık, durum, zoom, fit, yeni sekme, form ayarı, odak, tema; görünür veya menüde bulunur.
- [ ] Mobil `320px` dahil yatay taşma yok; üst bar bir satır; en az 44px etkileşim alanları.
- [ ] Çok sayfalı navigasyon, taslak kritik banner'ları, `Formu Düzenle` ve inline edit korunur.
- [ ] PDF sağ kenar clipping/bulanıklık yok; renderer state reset, istenmeyen yeniden üretim yok.
- [ ] PDF yükseklik kazanımı **normal desktop senaryoda ≥48 CSS px** (veya teknik gerekçeli ölçümle açıklanmış ve kullanıcı istediği kompaktlığı koruyan eşdeğer sonuç); form kazanımı pozitif. Ölçüm yapılamadıysa başarı iddiası yok.
- [ ] Typecheck, hedefli lint/test ve production build başarılı; gerçekten koşulan komut/çıktı not edilmiş.

**Hata/geri dönüş:** Zorunlu kabul başarısızsa `ASAMA_06` **tamamlandı** işaretlenmez; hata ilgili kapsamda düzeltilir. Başarısız komutu değişiklik olmadan döngüye sokma. **Dur:** Final deploy aşamasından önce kaydet, bekle.

### ASAMA_07 — Son kontrollü release ve Production kabulü

**Giriş:** ASAMA_06 bütün zorunlu kabul testleri yeşil; çalışma ağacı ve yayın koruma kuralları okunmuş; başka ajan aktif aynı dosyalara yazmıyor. Kullanıcı yalnız `devam` diyerek buraya sırayla gelmiş, yayın bu planda açık kapsam olarak tanımlı.

**İş:**

1. Son diff'i incele; yalnız bu işin değişiklikleri, varsa yaşayan `docs/BELGELER_SISTEMI.md`'de gerekli küçük güncelleme ve `IMPLEMENTATION_STATE.md`. Başka işlerin staged dosyalarını/yeni sırlarını commit'e ekleme.
2. Yerel standart: **tek anlamlı atomik commit** ve gerekli kontrollerden sonra **`main` push**, Vercel otomatik **tek production deploy**. Ara aşamalarda 7 ayrı commit, gereksiz Preview ve çift Production **yok**. `AGENTS.md` yerel/remote ayrımına uy; eğer sadece GitHub API ile uzaktan yazılıyorsa `internal-*` / `chatgpt-*` + skip CI koruması ayrıca geçerli (bu plandaki varsayılan çalışma yerel IDE'dir).
3. Vercel'de doğru SHA'nın **Ready** olduğu gerçek araçla doğrulanır; aynı deployment bekleme komutları tekrarlanmaz. Sonra site üzerinden tek sayfalı ve çok sayfalı belge için **gerçek canlı** kısa smoke: header tek satır, PDF zoom, fit, sayfa, tema, draft, belge menüsü, mobil footer. Sadece canlı testin sonucu ile `Production çalışıyor` denir.
4. Sürümde işlev kaybı varsa önce kanıtla, `ENGELLI` yaz, repo politikası kapsamında güvenli restore/rollback yolunu değerlendir; gizli ikinci deploy tetikleme. Bütün kanıt yeşilse `execution_status: TAMAMLANDI`, `active_stage: null`, `next_stage: null`.

**Kabul:** Tek başarılı production yayımlanmış, SHA eşleşmiş, masaüstü ve mobil canlı smoke geçmiş. **Dur:** Tamamlandı; yeni `devam` hiçbir işlem yapmaz.

---

## 6. Mobil koruma eşleme tablosu — M1–M14 (bloklayıcı)

| Kural | Uygulandığı aşama | Gerçek kontrol / kabul |
|---|---|---|
| **M1 Tek satır/yükseklik** | 02,04,06 | Mobil normal metinde ≤56px, desktop ≤64px; `flex-wrap:none`, 320px'te ikinci satır yok; büyük yazıda erişilebilirlik istisnası raporlanır. |
| **M2 ≥44px dokunma hedefi** | 04,06 | Her görünür buton ve menü satırına `getBoundingClientRect` ile ≥44×44 kontrol; sığmayan komut menüde, 8px hedef aralık. |
| **M3 ⋯ menü, yatay toolbar scroll yok** | 04,06 | `scrollWidth <= innerWidth`; overflow menüye giren PDF komutları erişilebilir; menü ekran dışına kaçmıyor. |
| **M4 Hover'a bağımlılık yok** | 04,05,06 | Android touch/keyboard: ikon Türkçe `aria-label`, `title` tek anlatım değil; hover'sız eylem. |
| **M5 Taslak/hazır/hata durumları** | 02,05,06 | Kompakt ikon + metin/semantik açıklama; ready/saving/error/consent/restore/conflict ayrı sınanır; yalnız renk yok. |
| **M6 Tek başlık + alt başlık** | 02,04,06 | Tek sayfa h1, tek görünür belge adı; min-w-0/truncate, mobil subtitle yok, belgeye göre dinamik başlık. |
| **M7 Safe-area** | 01,04,06 | `viewportFit:'cover'` zaten var; çentik/yatayda üst bar örtülmüyor, double-padding yok, zoom devre dışı bırakılmıyor. |
| **M8 viewport/dvh ve çakışma** | 01,04,05,06 | Mevcut `visualViewport` doğru; adres çubuğu/klavye açılıp kapanırken üst/alt/inline buton çakışmıyor; gereksiz genel CSS dönüşümü yok. |
| **M9 Sticky yerine layout** | 02,04,06 | Bar scroll edilen form/PDF'nin dışında normal flex akışında; iOS scroll ile kaybolmuyor, ağır blur yok. |
| **M10 Sanal klavye** | 05,06 | Android/iOS keyboard simülasyonu/gerçek cihaz; odaklanan input görülebilir, `scroll-padding`/existing hook; footer zıplamıyor. |
| **M11 Yön ve 320px** | 04,06 | 320×568, 844×390; tek satır, menü sığıyor, yatay body overflow yok, PDF kullanılabilir. |
| **M12 Breakpoint / SSR tutarlılığı** | 02,04,06 | `lg=1024px` shell/paneller ile uyum; CSS-first görünürlük; 911 CSS px (browser %150) doğru mobil düzen; hydration error yok. |
| **M13 Tek zoom/jest/resize** | 03,04,05,06 | Preview-owned tek zoom, pinch/pan aynı, manual zoom kalıcı, `handleFit` eski %100 semantiği; yeni fitMode şartı yok, ResizeObserver regresyonu yok. |
| **M14 PDF kalite/yeni sekme** | 03,04,06 | DPR=1/2 sağ kenar kırpılması/bulanıklık yok; mobil `<a target>` aynı çalışır; popup blocker gibi eski bağımsız bug varsa raporlanır. |

**Kural çerçevesi:** Mobil koruma dokümanı mobilde bozulmayı **yayın bloklayıcı** kabul eder. Bazı teknik öneriler (`fitMode` var sayımı, `vh` dönüşümü, her aşama commit) mevcut repo ile çeliştiğinden **aynı kullanıcı deneyimi kriteri daha güvenli teknikle** sağlanır; keyfî atlama yok.

---

## 7. Aşama ilerleme, hata ve kesin `devam` protokolü

**Planın dosya yeri önerisi:** `docs/belgeler-unified-header/PLAN.md` (bu belge) ve `docs/belgeler-unified-header/IMPLEMENTATION_STATE.md`. Mevcut proje içinde aynı plan varsa üstüne ezme, revizyonu açık güncelle. Kanıt ekran görüntülerini ayrı rapor dosyalarına boğmadan klasörde sakla.

```yaml
plan_id: belgeler-unified-header-2026-10-24
plan_revision: 3
planning_status: PLAN_HAZIR
execution_status: BASLAMADI
active_stage: null
next_stage: ASAMA_01
completed_stages: []
evidence: []
blockers: []
updated_at: null   # aşama ilerlerken Europe/Istanbul zaman damgası
```

**Uygulayıcı için bağlayıcı işleyiş:**

1. **Yalnız plan dosyasını okumak uygulamayı başlatmaz.** Kullanıcı `Başla` veya ilk `devam` deyince ilk tamamlanmamış aşamayı uygula.
2. Her yeni `devam` **en fazla bir aşama**. Eksik aşama varsa devam ettir; bir sonraki aşamaya aynı mesajda geçme. Kullanıcıdan her küçük düzeltme için izin isteme.
3. Her aşama sonunda durum dosyasında kanıtı şu biçimde tut: `stage`, `tested_local_head_or_dirty_state`, `command_or_scenario`, `result`, `evidence_path`, `blocker`. `PASSED` yalnız gerçekten yapılmış teste yazılır. Kullanıcıya **çok kısa** raporla: aşama, değişiklik, test, engel, sıradaki.
4. Başarısız zorunlu kabulde `execution_status: ENGELLI` veya aynı aşamada `DEVAM_EDIYOR`; bağımlı aşama başlatma. Aynı başarısız komutu değiştirmeden tekrar tekrar koşturma.
5. Kullanıcının mevcut dosyalarını `git reset --hard`, otomatik pull, force push veya kapsam dışı temizlikle silme. Test/dev sunucusundan **yalnız kendi başlattığın** süreçleri kapat.
6. Testler repo `test-ve-otomasyon-standardi.md` kapsamında sınırlı timeout ile çalışır; Playwright yeni standalone scriptse `try/finally` ile tarayıcıyı kapat. Gerçek test selector'larını koddan bul; uydurma.
7. Ara aşamalarda yeni remote branch/commit/push/Production açma. **İlk release final aşamadadır**. Yayın koşulları yoksa `ENGELLI`, başarı iddiası yok.
8. `execution_status: TAMAMLANDI` iken yalnız `devam` gelirse: **“Plan tamamlandı; uygulanacak başka aşama yok.”** de; kod, test, commit, push, deploy, audit, yeni geliştirme yapma.
9. Tamamlanma sonrası yeni iş ancak kullanıcının **açık kapsam değişikliği talebi** ile yeni revizyon olur; başka ajanın önceki planını baştan uygulamaya koyma.

---

## 8. Kapsam sınırları / yasak işlemler

- **PDF motorunu değiştirme:** `src/lib/pdf-engine.ts`, `src/lib/pdfjs-client.ts`, PDF.js worker, AcroForm/flatten kodu, PDF font/geometry, dokümantasyon viewer engine, CAD/DXF/DWG motoru ve protected golden kodlar bu UI işinin kapsamında değil.
- **İşlevsel algoritma ve veri değiştirme:** PDF şablonları, form alanları, hukuki metin, taslak storage/consent stratejisi, paylaşım token/expiry/cap, download filename/AcroForm kapsamı ve print mekanizması korunur.
- **Görsel kopya üretme:** Eski toolbar'ı `display:none` ile DOM'da tutup yenisini ayrıca render etmek, iki zoom state'i, iki ayrı tema state'i, beş stüdyoya 5 benzer header, gereksiz bağımlılık yükleme yasak.
- **Erişilebilirlik ihlali:** `user-scalable=no`, `maximum-scale=1`, 32px dokunma hedefi, hover-only bilgi, 320px'de yatay kayan toolbar, üst bardaki error banner'ını saklama yasak.
- **İlgisiz geliştirme yok:** Paylaşım sistemini, belge listesini, PDF motor performansını veya mobil alt butonlarını yeniden tasarlama. Yeni bir bug görürsen bu görevle ilgili olanı düzelt, alakasız olanı kısa risk notu olarak raporla.

---

## 9. Gemini 3.8 Flash için **tek başlangıç promptu**

> `BELGELER_TEK_UST_BAR_V3_NIHAI_BIRLESIK_PLAN.md` bu görev için **tek yürürlükteki nihai plandır**. V1, V2, Claude mobil koruma ve Gemini kısa planı ayrıca yürütme; bunlar bu dosyada incelenip birleştirilmiştir. Windows'taki yerel `muhendislik-site` projesinde önce `PROJECT.md`, `AGENTS.md`, `GEMINI.md`, ilgili `.agents/rules/*.md`, yaşayan Belgeler dokümanı ve bu planı oku. Çalışma ağacında başka ajan değişiklikleri varsa koru; reset/pull/force push yapma. **Şimdi yalnız `ASAMA_01`'i uygula**: mevcut kod ve yerel sürümü doğrula, desktop/mobil baz ölçümleri çıkar, ilerleme dosyasına gerçek kanıt kaydet. Sonucu dört-beş cümlede raporla ve **dur**. Ben `devam` yazdığımda yalnız sıradaki tamamlanmamış tek aşamayı uygula. Son aşama gelmeden commit/push/deploy yapma. Plan `TAMAMLANDI` durumundaysa yeni iş yapma.`

---

**Son hakem notu:** Başarı yalnız üstte tüm ikonları görmek değildir. **Tek satır, tek state, gerçek alan kazanımı, semantik düzgünlük, 320px'te kullanılabilirlik, sorunsuz PDF canvas ve denetlenmiş tek yayın** birlikte zorunludur.
