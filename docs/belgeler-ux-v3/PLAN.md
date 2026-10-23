# BELGELER — AKILLI BÖLÜMLER + GÜVENİLİR OTOMATİK TASLAK + PDF ODAK MODU

> **Birleştirilmiş nihai uygulama planı (V3)** · 23 Ekim 2026 · Europe/Istanbul
> **Plan ID:** `BELGELER_UX_SECTION_DRAFT_FOCUS_2026_10_V3` · **Plan revizyonu:** `3`
> **Uygulayıcı:** Windows üzerinde yerel mühendislik projesiyle çalışan **Gemini 3.8 Flash**; arayüz destekliyorsa `high` thinking önerilir, mevcut ayarı habersiz değiştirme.
> **Hedef repo:** <https://github.com/smitelagwar/muhendislik-site> · **Canlı:** <https://muhendislik-site.vercel.app/belgeler>
> **Planlama sırasında kontrol edilen uzak `main` HEAD:** `9cf0a95e819e1b545791c8ac7184a051758d1835` (22.10.2026 21:34 UTC). Yerel HEAD/çalışma ağacı **henüz görülmedi**.
> **Önerilen ayrı görev dizini:** `docs/belgeler-ux-v3/PLAN.md` ve `docs/belgeler-ux-v3/IMPLEMENTATION_STATE.md`
> **Durum:** `PLAN_HAZIR`; **hiçbir aşama uygulanmış, test edilmiş veya yayınlanmış değildir.**
> **Yayın politikası:** Tüm zorunlu yerel kabul testlerinden sonra **tek kontrollü `main` push → Vercel Production**, ardından mümkün olan tek canlı smoke doğrulaması. Ara aşamada push/Preview/Production yapılmaz.

---

## 1. Kaynaklar, karşılaştırma ve nihai teknik karar

Bu doküman şu iki **ayrı** planın somut fikirlerini birleştirir:

1. ChatGPT'nin `BELGELER_UC_OZELLIK_NIHAI_PLAN_V2.md` taslağı (11 aşamalı, taslak güvenliği ve çoklu sekme koruması ayrı kabul kapısı).
2. Claude'nin `BELGELER_FORM_UX_AKORDEON_TASLAK_ODAK_PLANI.md` taslağı (10 aşamalı; kalıcı bölüm tercihleri, rozet, iki saklama modu, görünür global taslak şeridi, kompakt focus modu ve ayrıntılı hata matrisi).

**Alınan güçlü kararlar:** ChatGPT V2'den storage/restore ve iki sekme riskini erken izole eden akış; Claude'den `dolu/toplam` rozeti, minimal animasyonsuz akordeon, bölüm tercihlerini ayrı anahtarda tutma, **bu cihazda / yalnız bu sekmede** seçimi, kullanıcıya görünür taslak durumu, `hidden`-CSS ve `0px` fit ölçümü testleri, 30 günlük taslak *yaş göstergesi*, kontrollü feature flag ve rollback stratejisi.

**Düzeltilen / reddedilenler:**

| Tartışmalı yaklaşım | Nihai karar ve nedeni |
|---|---|
| Claude: 30 gün geçen taslağı okurken otomatik sil | **Silme yok.** `30 günü aşkın` uyarısı ve açık geri yükle/sil kararı var; yazılan belgeyi sessiz silmek veri kaybı yaratabilir. Yaş, belgenin hukuki geçerliliği anlamına gelmez. |
| Claude: sıfırla/temizle sonrası `saf` olduğundan yeni durumu kaydetme | **Yanlış kullanıcı semantiği.** İlk render'daki örnek/default otomatik kaydedilmez; fakat *bilinçli kullanıcı reset/clear/undo* aktif kaydın yeni sürümüne dönüştürülür (korumalı onaydan sonra). Yoksa eski taslak reload'da hortlar. |
| Claude: PDF alanına tıklamak zorunlu olarak sol formu açar | Mevcut `useBelgeFieldFocus` öncelikle **form → PDF** eşlemesini yapıyor. Reverse PDF → form navigasyonu var olduğu kanıtlanmadan icat edilmez. Mevcut bir navigasyon mevcutsa `reveal` ile uyumlu kılınır; yeni kapsam değil. |
| Claude: tüm bölümleri kapa | Ana kontroller: **Tümünü aç** ve **Diğerlerini kapat** (aktif/son seçili bölüm kalır). Bölüm başlığından tek tek kapatılabilir; yanlışlıkla bütün alanların görünmez olması önlenir. |
| ChatGPT V2: bölüm tercihleri her reload'da sıfırlanır | Claude'nin önerisi alınır: **yalnız manuel kapalı bölüm ID listesi** belge bazında saklanır; kişisel form verileriyle karışmaz. İlk kullanımda hepsi açık. Saklama yoksa bile akordeon çalışır. |
| ChatGPT V2: yalnız `localStorage` | İki kullanıcı seçeneği: **bu cihazda** (`localStorage`) veya **yalnız bu sekmede** (`sessionStorage`). Geri yükleme ilgili mod/depodan yapılır. Modlar arasında sessiz taşıma veya silme olmaz. |
| Claude: tüm taslakları sil, tüm izinleri temizle varsayılan menüde | V1'de belgeye özel **Taslağı sil** esastır; toplu temizlik ancak açık etkili ikinci onay ve doğrulanmış UI gerekçesi varsa, kapsamı büyütmeden. |
| Claude: 64 KiB zorunlu sınır, 200ms longtask üstü koşulsuz FAIL | Limit güvenlik amaçlı **konfigüre edilen 64 KiB varsayılan** olabilir; UTF-8 baytı ölç, aşarsa uyar ve *kesme yapma*. Performans eşiklerini baselinedan türet; 200ms üstü tek CI ölçümünü tek başına hata ilan etme. |
| ChatGPT V2: Escape ile odak modundan çıkış | **Claude tercihi:** Focus mode ayrı Escape dinleyicisi eklemez; var olan Escape vurguyu/popup'ı yönetmeye devam eder. Açık `Formu göster` kontrolüyle çıkılır. Bu, iki UI katmanının tek Escape ile kapanmasını engeller. |

**Model doğrulaması:** Google'ın resmî model sayfası `gemini-3.8-flash` sabit kimliğini; `low`, `medium`, `high` düşünme seviyelerini doğrular. Bu görevde `high` tavsiye; modelin hatasızlığı varsayılmaz. <https://ai.google.dev/gemini-api/docs/models/gemini-3.8-flash> ve <https://ai.google.dev/gemini-api/docs/thinking>.

### İncelenen repo gerçeği (23.10.2026)

- Next.js 16.4.2, React 19.2.3, Tailwind 4, `pdfjs-dist` 6.3.289; `npm run build` → `next build --webpack`, `prebuild` zinciri korunmalı.
- Beş stüdyo: `src/components/beton-dokum-studio.tsx`, `insaat-ruhsati-studio.tsx`, `istifa-studio.tsx`, `sozlesme-studio.tsx`, `taahhutname-studio.tsx`.
- **56 düzenlenebilir alan** (`DOCUMENT_EDITABLE_FIELDS`); istifa PDF'sinde formda olmayan üç sabit etiket var.
- `useBelgeStudioFormView` ve `src/lib/belge-studio-form-view.ts` mevcut `localStorage` form görünüm tercihini tutuyor; **anahtarını değiştirme**.
- `useBelgeFieldFocus` form kapsayıcısında `onFocusCapture`, `onBlurCapture`, `onKeyDownCapture` kullanıyor. Yeni handler'lar bu olayları ezemez.
- `BelgeStudioPdfPreview` PDF zoom/pinch/pan, mobil inline edit ve alan vurgusunu barındırıyor; mümkünse dokunma, sadece gerekli opsiyonel toolbar bağını ekle.
- `src/lib/belge-studio-layout.ts`: `lg` üstünde sol form + PDF iki panel; `lg` altı form/PDF sekmeleri. Sol form zaten kendi scroll ve ölçek sistemine sahip.
- Beton'da dört, Ruhsat'ta üç, Sözleşme'de dört görsel grup bulunuyor. İstifa/Taahhütname'nin JSX grup sınırları farklı; **gerçek DOM'dan** netleştirilecek.
- `handleResetToPdfDefaults`, `handleClearAll`, `handleUndo` beş stüdyoda var; Ruhsat'ta ayrıca `handleRandomize`. Sözleşme ve Taahhütname'de koşullu imza alanı eşzamanlama kuralı var.
- Önceki `docs/belgeler-alan-odak/IMPLEMENTATION_STATE.md` `TAMAMLANDI` diyor; **dokunulmaz**.
- `playwright.site.config.ts` `.next` varsa otomatik olarak production sunucuya yönelebiliyor. Dev E2E'de `$env:PLAYWRIGHT_PRODUCTION_SERVER='0'` açıkça kullanılmalı.

**Doğrulanmamış:** yerel çalışma ağacının durumu, fiziksel mobil Safari, yeni özelliklerin performansı/testleri, gerçek kullanıcı depolamasının içeriği. `ASAMA_00` bunları kaynak gerçekliğiyle sınırlar; kullanıcının özel form verilerini keşif için okumaz.

---

## 2. Ürün davranışının değişmez sözleşmesi

### 2.1 Akıllı bölümler (beş belge)

**Varsayılan:** İlk ziyaret **tüm bölümler açık**. Her belge için ayrı `closedSectionIds` tercihi varsa, yalnız tarayıcıda ve `useEffect` sonrasında yüklenir; SSR/hydration tutarlılığı bozulmaz. `belgeler:ux:sections:v1:${documentId}` anahtarında sadece `version` ve **kapalı bölüm kimlikleri** tutulur. Geçersiz/eskimiş ID'ler ayıklanır; storage kapalıysa hepsi açık çalışır. Form verileri bu tercihe hiç yazılmaz.

**Başlık:** `<h3>` içinde gerçek `<button type="button">`; `aria-expanded`, `aria-controls`, benzersiz `id`, en az 44 CSS px tıklama yüksekliği, görünür keyboard ring, sağda `n / toplam dolu` göstergesi ve dönen `chevron`. Sayaç `trim()` sonrası dolu string alanlarını sayar; **dolu**, **geçerli/eksiksiz** anlamına gelmez (örnek varsayılanlar da dolu sayılabilir). Açıklama/tooltip veya ekran okuyucu etiketi bu ayrımı saklamaz. Animasyon yok (yalnız ikon yönü değişir).

**Gövde:** React ağacında **mount kalır**, ancak kapalı olduğunda hesaplanan CSS `display:none` veya uygun `hidden` davranışı gerçekten sağlanır; klavye/ekran okuyucu gizli alana erişmez. `className="flex"` veya Tailwind `hidden` çakışması E2E'de test edilir. Her editable alan **tam bir** grupta olmalı; doğru grup bilgisi güncel `DOCUMENT_EDITABLE_FIELDS` ve gerçek JSX'den çıkarılır. Sahte grup veya alan ekleme.

**Eylemler:** Bölümler bağımsız açılır/kapanır. Üstte kompakt **“Tümünü aç”** ve **“Diğerlerini kapat”** (aktif/son dokunulan bölüm açık; hiç seçim yoksa ilk bölüm). Kapatılacak bölüm içindeki girişte klavye odağı varsa **önce** güvenli görünen bölüm başlığına aktar; mevcut alan vurgusu yanıltıcı kalmamalı. Otomatik kapatma **yok**. Gerçek bir form alanına programatik odak verilmek isteniyorsa önce `reveal(fieldKey)` ile bölüm açılır; DOM görünür olduktan sonra odak/kaydırma yapılır. **PDF alanına dokunuldu diye ters navigasyon varmış gibi davranma.**

**Korunacaklar:** `formData`, input id/labels, `touchedFields`, conditional imza sync, PDF alan vurgusu, formView `contentWrapperProps`, manual/fit/compact, scroll/caret, RTL olmayan Türkçe metin, mobile form sekmesi, layout warnings. Bölüm aç/kapat **PDF üretmez** ve **taslak yazdırmaz**.

### 2.2 Otomatik taslak: mahremiyet ve veri kaybı kuralları

**İzin başlangıçta kapalı.** İlk *gerçek kullanıcı düzenlemesi* sonrasında küçük, engelleyici olmayan izin şeridi göster: `Bu cihazda otomatik kaydedilsin mi?` / **`Bu cihazda kaydet`**, **`Yalnız bu sekmede`**, **`Kaydetme`**. Kullanıcı “Kaydetme” dediğinde sürekli tekrar eden banner olmasın; taslak menüsünden sonradan etkinleştirebilsin. İzin verilmeden kişisel form alanları kalıcı/oturumluk depoya yazılmaz. Kullanıcı formu kullanmak ve PDF indirmek için izin vermek zorunda değil.

- **Cihaz modu:** izin tercihi (PII değil) uygun yeni `localStorage` anahtarında; taslak `localStorage` içinde **belge türü başına bir adet**. Bu cihazda aynı origin ve tarayıcı profilindeki diğer kullanıcılar erişebilir; **şifreli** değil. Başka cihazda senkron olmaz.
- **Sekme modu:** tercih ve taslak `sessionStorage` içinde; aynı tarayıcı sekmesi reload'unda bulunabilir, sekme/oturum kapanınca devamlılık **tarayıcı davranışına bağlıdır**. "Her durumda anında yok olur" garantisi verme. Oturum tipi sekmeler arasında otomatik senkronize edilmez; yeni açılan sekmede depolama klonlanabilir (ör. `window.open` davranışı), **oturum izolasyonu güvenlik sınırı gibi pazarlanmaz**.
- **Kaydetme / recovery modları birbirinden bağımsız**: `disabled`, `consent-pending`, `booting`, `restore-decision`, `enabled-idle`, `saving`, `saved`, `save-error`, `conflict`; ayrıca `storageMode=device|session|none`. Aynı anda iki farklı durum UI'da çelişkili metin üretmeyecek şekilde reducer/enum tasarla.
- **Şema:** `{schemaVersion:1, documentId, fieldSchemaFingerprint, savedAt, writerId, revision, values}`. `values`, yalnız `DOCUMENT_EDITABLE_FIELDS[documentId]` üzerinden **tam string snapshot**. İstifa'nın PDF-only `adres_etiket`, `tc_etiket`, `iletisim_etiket` değerleri restore dışı; mevcut PDF default'tan alınır. `__proto__`/`constructor`/`prototype`, unknown field, yanlış belge/tip/şema, corrupt JSON, oversize ve quota saldırılarına karşı allowlist + own-property ile güvenli parse. Kullanıcının değerlerini hiçbir console/analytics/URL parametresine yazma.
- **Sınır:** V1'de 64 KiB `UTF-8` JSON boyutu varsayılan; gerçek mevcut alan uzunlukları ASAMA_00'da karşılaştırılıp gerekçeyle artırılabilir. Aşılırsa **kaydetmeyi durdur, açık mesaj ve kullanıcıya düzenlemeye devam etme imkânı**; sessiz kırpma/silme yok. PDF generator girdilerini sınır adına değiştirme.
- **30 gün:** Taslağın `savedAt` üzerinden **eski olabileceği** gösterilir. **Otomatik silme, expiry yüzünden sessiz restore engelleme veya yeni formun otomatik overwrite edilmesi yok.** `Eski taslağı geri yükle / sil / şimdi değil` kullanıcı kararıdır. Yaş, belge geçerliliği ölçütü değildir.
- **Örnek/default veri:** İlk mount/SSR hydration, PDF render veya görüntü modu değişimi **tek başına** taslak oluşturmaz. Gerçek kullanıcı değişikliğinden sonra kaydetme uygun olur; kullanıcı değerleri *tekrar boş/default* yapmış olsa bile (özellikle onaylı Reset/Clear) **yeni snapshot kaydedilir**. Böylece eski kayıt yanlışlıkla geri gelmez.
- **Hydration yarışı:** `useEffect` ile izin/taslak okunmadan asla yazma. Okuma sırasında yapılan gerçek kullanıcı düzenlemesi korunur. Mevcut `initialData` hiçbir zaman gizlice taslakla değiştirilmez. Restore **tek atomik `setFormData`**; alan alan `onChange` çalıştırma. İmza sync manuel override'larının tam snapshot'ı korunur.
- **Restore kararı:** Kayıtlı taslak varsa `Taslağı yükle` / `Bu formla devam et` (saved draft üzerine yazacaksa **ikinci açık onay**) / `Taslağı sil` (açık onay) / `Şimdilik kapat` (eski kayıt korunur, **autosave askıda**). Kaydedilmiş taslakla current form eşitse sessiz adopt edilebilir; sürüm/fingerprint uyuşmazlığında **otomatik birleştirme yok**; kullanıcıya durum ve uyumlu alanların güvenli içe alınması ancak açık seçenek varsa sunulur, aksi hâlde bloke ve eski kayıt saklı.
- **Kaydetme:** `formData` tek kaynak; *gerçek kullanıcı mutasyonu* ve izin sonrası 800ms trailing debounce; değer önceki son başarılı snapshot ile birebir aynıysa gereksiz yazma yok. `setItem` sonrasında `getItem` ile doğrula; “Kaydedildi” ancak başarıyla yazılıp doğrulanınca (yerel storage'ın cihaz kapanmasında kalacağı garantisi yine yok). Kullanılan mod dışındaki storage'a veri yazma.
- **Sayfadan ayrılma:** `pagehide`/`visibilitychange:hidden`, gerekiyorsa unmount ile **best-effort** flush; browser crash/kapatma garantisi vaat etme. En son güncel form snapshot'ı ref ile okunur; bu sırada kullanıcı başka draft kararı bekliyorsa veya `conflict` varsa **asla flush etme**. Silme/izin kapama/devretme/restore'da pending timeout temizlenir, generation counter ile eski callback etkisiz kılınır.
- **Reset/Clear/Undo/Randomize:** Form silme/sıfırlama onayını kullanıcı gerçekten düzenlemiş/saklanmış bilgi risk altındaysa iste; onay reddedilirse form, `undoData` ve kayıt aynı kalır. Onaylanan Reset/Clear **aktif, izinli taslağın yeni sürümü olarak kaydedilir** (boş/default kayıt da geçerli). `Geri al` eski formu geri getirir ve tekrar kaydeder; `Rastgele` örnekler bilinçli kullanıcı eylemiyse kayda girebilir ama öncesi veri kaybı açıkça işaretlenir. Form içi alan sıfırlama ve PDF inline `onCommit` de gerçek mutasyonsa autosave'le uyumludur. **`Taslağı sil`** bunun tersine, depodaki kaydı siler ve o anki formu otomatik yeniden kaydetmeye zorlamaz; yeni kayda başlamak için yeni kullanıcı mutasyonu veya açık `Şu anki formu kaydet` eylemi gerekir.
- **Undo:** Restore/clear sonrası geçersiz `undoData` referansını koruma. Tek adımlık Undo semantiğini sürdür: restore öncesindeki anlık form değerini uygun bir adım için sakla *veya* eski Undo'yu temizleyip kullanıcıya açık bildir; hiçbir zaman başka taslağın/eskimiş state'in fark edilmeden geri gelmesine izin verme.
- **İki sekme:** Cihaz modunda aynı belge için **tek etkin writer** stratejisi. `storage` event + `revision/writerId` tekrar kontrolü; varsa `BroadcastChannel` sahiplik mesajı; destekleniyorsa `navigator.locks` ile read-check-write bölümünü seri hale getir. Yoksa **garanti edilmeyen atomiklik** açıkça belirtilir; çakışma riski belirdiğinde `conflict` + yazmayı durdur + kullanıcıdan seçim iste. Pending timer ile silinmiş kayıt dirilmemeli. B sekmesi aktifken A'nın `pagehide` flush'ı B'yi silemez. **Session mode** sekmeler arası tek-writer vaadi taşımaz.
- **Menü / erişilebilirlik:** Taslak durumu, onay ve geri yükleme kararları **sol form gizliyken de** ulaşılabilir olmalı (ortak stüdyo üst şeridi / mevcut responsive eylem menüsü); PDF'nin üzerine yığılı dev modal/büyük sabit banner yapma. `aria-live` yalnız anlamlı durum değişimlerinde. Metinlerde `şifreli`, `tam güvenli`, `buluta kaydedildi` ifadeleri yok. Ayarlar: `Otomatik kaydı kapat` (eski taslağı **saklar**), `Bu belgenin taslağını sil` (ayrı onay), `Kaydı aç`, `Tekrar dene`. **Eski taslağı saklamak ile silmek farklı eylem**.

### 2.3 PDF odak modu

- Yalnız `lg` eşik ve üzerindeki iki panelli masaüstü yerleşiminde düğme: **`PDF'ye odaklan`** ↔ **`Formu göster`**. Form paneli DOM/React'ta mount kalır, fakat CSS ile görünmez olur; PDF paneli kalan genişliği alır. `Fullscreen API`, yeni PDF viewer veya ayrı sekme **yok**.
- `isPdfFocusMode` sadece sunum state'idir: `formData`, `touchedFields`, form scroll/caret, accordion tercihi, autosave, PDF sayfa, zoom ve inline edit korunur. Layout değişimi mevcut ResizeObserver/canvas redraw üretebilir; **form değişmediği sürece yeni PDF bytes/generator çalışmaz**. `formView` kapalı panelde 0 genişlik ölçerse eski geçerli fit state korunur; panel dönünce ölçülür.
- Düğme `aria-pressed`, açıklayıcı `aria-label`, `title` ve klavye odağı; 1024–1100 px toolbar taşma testini geçer. Formda odaklı eleman gizlenecekse önce bu görünür düğmeye odak taşı; çıkışta kayıtlı eski input **hâlâ açık/görünür ve geçerliyse** odağı geri yükle, değilse düğmede tut. Odak modu kapanınca scroll konumunu koru; otomatik kaydırmanın yanlış yan etkilerini test et.
- **Escape odak modunu kapatmaz.** Var olan Escape ile field focus / inline edit / menü davranışı korunur. Kullanıcı görünür `Formu göster` düğmesini kullanır; böylece tek Escape ile birden fazla katman kapanmaz.
- `<1024px` mobil/tablet mevcut `Formu Düzenle` ↔ `PDF Önizle` akışı devam; ikinci odak düğmesi yok. 1280→900→1280 resize sırasında otomatik kullanıcı kilitlenmesi olmasın: breakpoint altına geçince etkili mod kapatılır, tekrar büyüdüğünde **kendiliğinden odak moduna dönme** (kullanıcı tekrar seçer). `isModal` varyantı bozulmaz.
- Üç özelliğin stateleri **ayrı**: accordion id listesi sunum tercihi, focus geçici sunum state'i, draft yalnız editable form değerleri. PDF veya kullanıcı verisi katmanlarına karıştırılmaz.

### 2.4 Ortak güvenlik ve regresyon sınırları

**Asla değiştirme:** `src/lib/pdf-engine.ts`, `src/lib/belgeler-pdf-layout.ts`, `src/lib/belgeler-pdf-profiles.ts`, `src/lib/belge-studio-inline-field-map.ts`, `src/components/belge-studio-inline-edit-layer.tsx`, `src/hooks/use-belge-studio-document.ts`, `public/belgeler/*.pdf`, `src/lib/dokumantasyon/**`, CAD/DWG/DXF motoru, `docs/belgeler-alan-odak/IMPLEMENTATION_STATE.md`, mevcut formView storage anahtarı. Eğer gerçekten tek satırlık adaptör zorunluysa durumu belgeli sebep/test ile yönet, motoru yeniden tasarlama. Paket ekleme/upgrade yok; PDF yazı font/format şablonu aynı kalır. İndirilen/yazdırılan PDF, UI durumunu içermez.

**Test bazları:** `npm run check:belgeler-pdf`; `npm run check:belgeler-inline-mobile`; `npx tsc -p tsconfig.next.json --noEmit --incremental false` ve final `npx tsc --noEmit --incremental false`; `npx eslint <gerçekte değişen dosyalar>`; `npm run build`; `playwright.site.config.ts` altında mevcut `belgeler-field-focus`, `belgeler-form-view`, `belgeler-inline-edit`, `belgeler-inline-edit-mobile`, `belgeler-mobile-studio`, `belgeler-functional-audit` spec'leri (dosya adlarını ASAMA_00'da varlık denetimiyle doğrula). Test komutunda `.next` üretim build tuzağından kaçın; spec selector'larını kaynak koddan oku, uydurma test ID yazma. Gerçek tarayıcı + mobil emülasyon fiziksel cihaz testi değildir.

---

## 3. Mimari: çekirdek modüller ve bağlama sınırları

**Yeni dosyalar (aday; ASAMA_00 gerçek mevcut yapıyı doğrular):**

| Dosya | Sorumluluk |
|---|---|
| `src/lib/belge-ux-config.ts` | Üç bağımsız build-time feature flag (`ACCORDION`, `DRAFT`, `FOCUS_MODE`); otomatik recovery sırasında veri silme değil, yalnız feature aç/kapa. Sabitler: storage key'leri, debounce 800ms, UTF-8 boyut limiti, 30 günlük yaş eşiği. |
| `src/lib/belge-draft-storage.ts` | Pure + dependency-injected storage codec/validator (`StorageLike`), namespaced key, schema/version/fingerprint, read-back verification, revised ownership check. Import sırasında browser global'i yok. |
| `src/hooks/use-belge-auto-draft.ts` | Consent/mode, restore kararı, dirty snapshot, debounce, flush, cleanup, cross-tab conflict, lifecycle state reducer. |
| `src/components/belge-studio-draft-controls.tsx` | Kompakt izin banner, saved state, recovery dialog, conflict seçenekleri ve menü. Panel dışında erişim. |
| `src/lib/belge-studio-sections.ts` | 5 doküman için kararlı `sectionId ↔ editable fieldKey` map; tam/tek kapsama doğrulaması. |
| `src/lib/belge-section-preferences.ts` | Kişisel değer içermeyen kapalı-bölüm listesi safe read/write/validation; ayrı localStorage namespace. |
| `src/hooks/use-belge-studio-sections.ts` | `openSection`, `toggle`, `openAll`, `closeOthers`, `reveal`; SSR-safe prefs hydration ve focus guards. |
| `src/components/belge-studio-section.tsx` | Mount korunmuş gizli gövde, erişilebilir `button`, `aria-*`, `dolu/toplam` counter. |
| `src/hooks/use-belge-studio-pdf-focus.ts` | Desktop breakpoint, temporary focus state, keyboard focus/scroll restoration. |
| `tests/belgeler/belge-draft-storage.test.ts` | Saf schema, recovery, TTL yaş uyarısı, storage errors ve conflict unit testleri. |
| `tests/belgeler/belge-studio-sections.test.ts` | 56 alanın her birinin tek section'a map olduğu ve prefs edge cases. |
| `tests/site-audit/belgeler-studio-ux.spec.ts` | Pilot ve tüm stüdyolar için Playwright entegre UX testleri. |

**Değişen dosyalar:** beş `src/components/*-studio.tsx` (dar bağlama), `src/components/belge-studio-preview-toolbar.tsx` (opsiyonel focus düğmesi), `src/components/belge-studio-actions.tsx` (taslak erişimi gerekiyorsa), `src/lib/belge-studio-layout.ts` (yalnız ortak responsive class), `src/components/belge-studio-pdf-preview.tsx` (yalnız toolbar prop aktarımı zorunluysa küçük patch), `src/app/globals.css` (yalnız `.belge-*` scoped CSS gerekiyorsa), `docs/BELGELER_SISTEMI.md` (son aşamada mimari kayıt).

**Tek doğruluk kaynağı:** `formData`. `useBelgeAutoDraft` formData'yı **izler/kaydeder**, sıfırdan ikinci edit state'i tutmaz. `handleFieldChange` + `inline edit onCommit` aynı atomik form state'ine gider. `formFocusContainerProps` korunur: yeni `onFocusCapture`/`onBlurCapture`/`onKeyDownCapture` gerekiyorsa açık sırayla compose edilir, spread ile ezilmez. Component'ler geniş monolitler hâline getirilmez. Mümkünse form, PDF ve footer arasında küçük optional props ile bağlantı kur.

---

## 4. Uygulama protokolü — Gemini Flash için KESİN

1. **Bir “devam” = en fazla bir aşama** (`ASAMA_00`–`ASAMA_10`). İlk açık `başla` da sadece ilk aşamayı başlatır. Aşama başarısızsa gerekli minimum fix/yeniden test o aşamada yapılır; **sonraki aşamaya geçme**.
2. Her aşama başında `PLAN.md`, `IMPLEMENTATION_STATE.md`, `git status --short --branch` ve ilgili kaynak dosyaları oku. **Aşama bazında yeniden tüm repo araştırması yapma.** Kanıtlı tamamlanan aşamalar tekrar uygulanmaz.
3. `PROJECT.md`, `AGENTS.md`, `GEMINI.md`, `.agents/rules/belgeler-kurallari.md`, `.agents/rules/test-ve-otomasyon-standardi.md`, `.agents/rules/vercel-kurallari.md`, `.agents/rules/yasayan-dokumantasyon-bakimi.md`, `.agents/rules/ecc-kurallari.md`, `docs/BELGELER_SISTEMI.md` ilk aşamada sırasıyla okunur. ECC `AKTİF` ve yerelde kuruluysa gereken ilgili skill'ler; Next 16'da `node_modules/next/dist/docs` uygun kılavuzu. Repo kuralları kullanıcı talebiyle birlikte uygulanır.
4. Dar patch. İlgisiz formatlama/refactor/branch-reset/stash/checkout/rebase/force-push **yok**. Uzak `main`'i deneme tahtası yapma. Kendi deneme süreçlerini kapat; başka kullanıcının süreçlerini öldürme.
5. Yeni npm paketi/yükseltmesi, yeni backend, kayıtlı kişisel veriyle test, PDF motor revizyonu yok. Testleri passing yapmak için assertion silme/timeout büyütme yok. Sahte veri kullan.
6. `Playwright` selector'ları gerçek JSX'den çıkar. `PLAYWRIGHT_PRODUCTION_SERVER=0` iken dev test; build sonrası `=1` ile production smoke. Windows PowerShell'de yalın `curl`/`&&` yerine kurallara uygun komut. `finally` cleanup ve makul timeout.
7. Her aşamada gerçek yürütülen komut/senaryo `PASS|FAIL|BEKLIYOR` olarak durum kaydına, test edilen HEAD + dirty tree bilgisiyle yazılır. Çalıştırılmayan test **PASS değil**. Tamamlanan aşama sonunda en çok 8–12 satır Türkçe rapor ver ve **dur**.
8. `ENGELLI`: kritik kabul hatasında sonraki aşama yok; kanıt, risk ve somut blocker raporla. Kullanıcı başka bir şey istemedikçe yeni özellik icat etme. Plan sona erince `TAMAMLANDI` ve sonraki salt `devam` için yalnız `Plan tamamlandı; uygulanacak başka aşama yok.` de; test, commit, deploy tekrarı **yok**.
9. Aşamalı durum kaydı başka eski `docs/*/IMPLEMENTATION_STATE.md` dosyasına yazılmaz. Bu V3 dizini varsa kimlik/doğrulama yap, **önceki görevle çakışırsa overwrite etme**. Gerekli kısa keşif ve test notlarını aynı klasörde tut; her aşama için ayrı uzun rapor üretme.
10. **Release öncesi `main` push yok.** Yerel IDE modeli: testler geçince tek anlamlı atomic checkpoint commit → `main` push → Vercel otomatik Production. Repo politika ve erişimini kontrol et. Arada [skip ci] commitler/Preview zinciri başlatma.

### Durum şablonu (ASAMA_00'da oluştur)

```yaml
plan_id: BELGELER_UX_SECTION_DRAFT_FOCUS_2026_10_V3
plan_revision: 3
planning_status: PLAN_HAZIR
execution_status: BASLAMADI  # BASLAMADI | DEVAM_EDIYOR | ENGELLI | YEREL_KABUL_GECTI | YAYIN_DOGRULANAMADI | TAMAMLANDI
active_stage: null
next_stage: ASAMA_00
completed_stages: []
evidence: []
blockers: []
base_remote_head: 9cf0a95e819e1b545791c8ac7184a051758d1835
base_local_head: null
tested_worktree: null
release_commit: null
deployment_url: null
verified_at: null
updated_at: null
```

Kanıt formatı: `{stage, command_or_case, result: PASS|FAIL|BEKLIYOR, tested_head_or_worktree, summary, path?}`. Durum kaydı post-deploy güncellenirse bunun için ikinci `main` commit/push **yapma**. Yerel kayıtta final kanıt durur, remote sürümde önceki pending-release metadata varsa bu ayrım kullanıcıya dürüstçe açıklanır.

---

## 5. Aşama çizelgesi

| Aşama | Somut sonuç | Kod? | Release? |
|---|---|---|---|
| `ASAMA_00` | Keşif, 56 alan/bölüm haritası, mevcut test baseline, ilerleme dosyası | Hayır | Hayır |
| `ASAMA_01` | Saf taslak codec/storage + iki mod + birim test | Evet | Hayır |
| `ASAMA_02` | Beton'da izin, kaydet, kurtar, saklama hatası pilotu | Evet | Hayır |
| `ASAMA_03` | **Ayrı veri kaybı kapısı:** 2 sekme, timer, silme, sayfa ayrılışı, iki storage modu | Evet | Hayır |
| `ASAMA_04` | Taslak 5 stüdyo, imza sync/undo/randomize/inline edit | Evet | Hayır |
| `ASAMA_05` | Akordeon + tercih/sayaç Beton pilotu | Evet | Hayır |
| `ASAMA_06` | 5 stüdyo, 56 alan tek bölüm, erişilebilirlik | Evet | Hayır |
| `ASAMA_07` | PDF odak modu 5 stüdyo, toolbar ve responsive | Evet | Hayır |
| `ASAMA_08` | Üçlü kombinasyon, mobil, klavye, stres, görsel ve performans | Küçük fix | Hayır |
| `ASAMA_09` | Production öncesi tam regresyon, build, veri güvenliği, yaşayan doküman | Küçük fix | Hayır |
| `ASAMA_10` | Tek commit/main push, Vercel Production ve canlı smoke | Release | **1** |

### ASAMA_00 — Yerel keşif ve baseline (uygulama dosyası değişmez)

**Giriş:** Plan yerelde, erişilebilir repo. **Kapsam:** `PROJECT.md`, `AGENTS.md`, `GEMINI.md`, göreve özel kurallar, ilgili test/package/konfigürasyon; **kod değişikliği yok**.

**İş sırası:**
1. Zorunlu okuma; `git status --short --branch`, `git rev-parse HEAD`; `package.json`, lockfile, `vercel.json`, `.next`, `.agents`/ECC durumu. Yerel değişikliklere dokunma; önceki kullanıcı işini durdurma.
2. Gerçek 5 stüdyo ve 56 editable field için `fieldKey → input ID → JSX grubu → sectionId → görünür başlık` küçük matrisini `docs/belgeler-ux-v3/KESIF_NOTLARI.md` içine çıkar. PDF-only etiketleri ayrıca işaretle. Önerilen pilot **Beton**; önceki test altyapısı zengin.
3. Mevcut storage key'lerini **yalnız kaynak koddan** incele; kullanıcının gerçek browser verilerini içerik için tarama. `initialData`, reset/clear/undo/randomize/inline commit davranışı; alan vurgusunun *gerçek* yönünü (form→PDF vs PDF→form), mobil sekme, toolbar, breakpoint'i not et.
4. Test baseline (gerçek sonuç): `npm run check:belgeler-pdf`, `npx tsc -p tsconfig.next.json --noEmit --incremental false`, koşul uygunsa hedefli `belgeler-field-focus` ve `belgeler-form-view` Chromium 1366. `.next` tuzağı için dev Playwright ortamında `$env:PLAYWRIGHT_PRODUCTION_SERVER='0'`.
5. Planı yalnız bu göreve ait yeni klasörde sakla, `IMPLEMENTATION_STATE.md` oluştur, test kanıtlarını kaydet. Mevcut `docs/belgeler-ux-2026` veya `docs/belgeler-alan-odak` dosyalarının üzerine yazma.

**Kabul:** working tree, test baseline, gerçek editable/section map, key namespace, pilot net; `git diff` kaynak dosyada sıfır bu-aşama değişikliği. **Hata:** kaynak kontrat uyuşmazlığı varsa kanıtla, sadece etkilenen karar/notu düzelt. **Dur:** ASAMA_01'i bekle.

### ASAMA_01 — Saf, iki modlu taslak/storage çekirdeği

**Giriş:** ASAMA_00 PASS. **Dosyalar:** yeni `src/lib/belge-ux-config.ts`, `src/lib/belge-draft-storage.ts` ve `tests/belgeler/belge-draft-storage.test.ts` (kapsama göre küçük ayrıştırmalar mümkündür). UI yok.

**İş sırası:**
1. `StorageLike` dependency injection; `parseDraft`, `createEnvelope`, `validateEditableSnapshot`, `loadDraft`, `saveDraft`, `deleteDraft`, `getKeyForMode`, `compareWriterRevision`, `draftAgeStatus`, `utf8ByteLength`. İçe aktarımda `window`/`document` yok; strict SSR güvenliği. PII içermeyen consent key farklı (device `localStorage`, session `sessionStorage`).
2. İki modda **ayrı namespace**; `DOCUMENT_EDITABLE_FIELDS[documentId]` birebir exact key ve string tipi. İstifa yalnız-PDF sabit etiketler saklanmaz. Version, fingerprint, belge, revision, writer, savedAt strict doğrulama. `Object.create(null)` / own-key doğrulama ile prototype kirliliği engelle.
3. 64KiB varsayılan UTF8 sınırını ölç; 30gün yaş durumunu **yalnız uyarı** olarak döndür. `getItem/setItem/removeItem` permission/quota/unsupported error sonuçları; başarılı setItem sonrasında read-back eşitliği, false success yok. CAS iddiası yok.
4. Şu saf testler: Türkçe/emoji/uzun alan, temiz alan/boş string, 56 editable full map, wrong-document, bad JSON, unknown/proto key, kısmi ve fazla alanlar, invalid type, fingerprint mismatches, oversize 64KiB±1 bayt, 30 gün±1ms age, storage throw/read-back mismatch, revision/writer conflict, session-vs-device key ayrılığı. Gerçek kişi bilgisi kullanma.

**Komutlar:** `npx tsx --test tests/belgeler/belge-draft-storage.test.ts`; `npx eslint` değişen dosyalar; `npx tsc -p tsconfig.next.json --noEmit --incremental false`.

**Kabul:** bütün unit testler gerçek PASS; hiçbir stüdyo/PDF davranışı değişmemiş. **Hata:** parser/storage testleri geçmeden hook aşamasına geçme. **Dur:** ASAMA_02.

### ASAMA_02 — Beton taslak pilot: izin, kayıt, recovery, durum UI

**Giriş:** ASAMA_01 PASS. **Dosyalar:** yeni `src/hooks/use-belge-auto-draft.ts`, `src/components/belge-studio-draft-controls.tsx`, `src/components/beton-dokum-studio.tsx`, gerekiyorsa küçük `belge-studio-actions.tsx` entegrasyonu, ilgili yeni Playwright testi.

**İş sırası:**
1. Mevcut form `formData` tek state kaynağı. Consent `disabled→consent-pending→enabled` akışı; ilk gerçek kullanıcı editinde şerit; `Kaydetme` seçeneği tekrar tekrar rahatsız etmez. Mounted defaults/`initialData` hiçbir koşulda tek başına kaydedilmez; hydration sırasında kullanıcı yazarsa o değer korunur.
2. İzin + kayıtlı taslak varsa restore kararı: `Taslağı yükle`, `Bu formla devam et` (overwrite ikinci onay), `Taslağı sil` (onay), `Şimdilik kapat` (autosave pause). Bozuk/uyumsuz eski kayıt **silinmez**, güvenli hata gösterilir. Tek atomik `setFormData`; eski bir `undoData`'yı yanlış tutma.
3. 800 ms trailing debounce, compare-before-write, success yalnız read-back doğrulaması; gösterge ve alanla ilgili gerçek `data-testid`; kullanıcı metnini URL/log/telemetry'ye sokma. `pagehide/visibilitychange:hidden` best-effort; timer/generation guard; storage error'da form/PDF kesintisiz.
4. **Taslak UI panel dışından erişilir:** küçük ortak şerit veya mevcut ortak action alanı; sol panel kapalıyken ve mobil `PDF Önizle` sekmesindeyken restore/conflict/consent kararları kaybolmaz. UI yüksekliği küçüktür, PDF canvas'ını uygunsuz zıplatmaz.
5. Reset/Clear üzerine yeni snapshot yazma kuralını kullanıcı risk onayıyla uygula; Undo yeni state'i tekrar kaydeder. `Taslağı sil` sonrası eski bekleyen save yeniden taslak yaratmaz.
6. E2E Beton: izin yokken PII storage **0**; ilk editle izin sorusu, device/session seçimleri doğru store; 800ms 5 ardışık input → son snapshot için **1 kayıt**; reload → restore → PDF; `Şimdilik kapat` eski draft koruma; bozuk/kota storage hata; form reset iptal/geri al, PDF indir; `initialData` ile restore conflict.

**Komutlar:** hedefli Playwright Chromium 1366 (`PLAYWRIGHT_PRODUCTION_SERVER=0`), storage unit, `npm run check:belgeler-pdf`, TS/lint.

**Kabul:** Beton'da reset/undo/recovery doğru, storage izni ve hatası görünür, PDF motor bozulmamış, other 4 stüdyo etkilenmemiş. **Hata:** veri silinmesi/yeniden oluşturulması varsa ASAMA_03'e geçme. **Dur:** ASAMA_03.

### ASAMA_03 — VERİ KAYBI KAPISI: çoklu sekme ve lifecycle yarışları

**Giriş:** ASAMA_02 PASS. **Dosyalar:** mevcut yeni storage/hook/unit/E2E; diğer dört stüdyo **henüz bağlanmaz**.

**İş sırası:**
1. **Cihaz modunda** aynı belge A ve B sekmesinde açık: tek aktif autosave sahibi mantığını doğrula. `BroadcastChannel` varsa mesaj, `storage` event, `save-before-write` revision/writer reread; destek varsa `navigator.locks` ile kısa read-compare-write (her ortamda var varsayma). Yoksa ihtiyatlı uyarı ve yazma duraklatma; **atomik çoklu sekme garantisi verme**.
2. `conflict` geldiğinde timer/flush durur, bu sekmenin henüz kaydedilmemiş form değerleri **yerinde kalır**. `Diğerini yükle` (yerel edit silinecekse ayrıca onay) vs `Bu sekmedekiyle devam et` (açık takeover ve yeniden revision kontrolü). İki sekme aynı anda takeover isterse güvenli fail-closed.
3. Kayıt silme/izin kapatma/mod değiştirme sırasında *pending debounce*, eski `setTimeout`, `pagehide` flush, `visibilitychange` flush, `StrictMode` remount, `pageshow` bfcache durumları veri diriltme/overwrite yapamaz. Timer cleanup + guard ve ilgili concurrency senaryolarını test et.
4. **Session mode** yalnız sekme depolama davranışını ayrı test et; yeni sekmeye izolasyon vaadi yazma. `sessionStorage` klonlama olasılığını güvenlik iddiasıyla karıştırma.
5. Depo read-only/quota, paralel `storage` event ve geç gelen PDF `onCommit` deneyimi. Kötü senaryoda **autosave pause + kullanıcıya uyarı**, form doldurma ve PDF indirme çalışmaya devam eder.

**Test:** iki Playwright sayfasıyla tam A→B→A conflict, izin iptali, silme sonrası dirilme, devam eden input, bfcache simülasyonu (desteklenen kapsam), 800ms fake clock, error branches. Unit + ilgili lint/typecheck.

**Kabul:** desteklenen senaryolarda **sessiz overwrite/silinmiş draft dirilmesi yok**; tespit edilemeyen gerçek eşzamanlı yarışa mutlak iddia yok; E2E kanıtları raporlu. **Hata:** güvenlik açıkken diğer stüdyolara rollout **ENGELLI**. **Dur:** ASAMA_04.

### ASAMA_04 — Taslak sistemini kalan 4 stüdyoya yay

**Giriş:** ASAMA_03 PASS. **Dosyalar:** 4 `*-studio.tsx`, küçük ortak adapter/draft control, hedef E2E.

**İş sırası:**
1. Beton pilotundaki **aynı** hook ve veri sözleşmesini bağla, her stüdyoya yeni storage algoritması kopyalama.
2. `Sözleşme` imza eşzamanlama: restore **tam tek snapshot**, otomatik onChange zinciri yok; manuel override bozulmaz. `Taahhütname` `unvan/unvan_imza` aynı. `İstifa` PDF-only statik alanlarını restore etme; `Ruhsat` `Randomize` ve bütün Reset/Clear/Undo/per-field reset/inline edit commit'i gerçek kullanıcı mutasyonu olarak işle.
3. 5 stüdyo için user choice → yaz → 800ms → reload → açık restore → input/PDF → download; A belgesinin taslağı B'ye geçmez. Device/session modlarının saklama yeri ve izin durumu doğru; mobil PDF sekmesinde taslak erişimi.
4. Her stüdyoda `formData` tek kaynak, PDF creator/snapshot hook'a ekstra yazma efekti eklenmez. Geçersiz taslakta belgeye girmeyi engelleme.

**Test:** 5 stüdyo E2E, `npm run check:belgeler-pdf`, targeted regressions, TS/lint.

**Kabul:** 5/5 geçiyor; önceki alan vurgusu, hazır PDF indirme, Undo ve koşullu sync bozulmadı. **Hata:** mapping bozuksa yalnız ilgili adaptörü düzelt; hook fork etme. **Dur:** ASAMA_05.

### ASAMA_05 — Akordeon pilot: Beton bölümleri + tercih + dolu sayacı

**Giriş:** beş stüdyo taslak PASS. **Dosyalar:** yeni `src/lib/belge-studio-sections.ts`, `src/lib/belge-section-preferences.ts`, `src/hooks/use-belge-studio-sections.ts`, `src/components/belge-studio-section.tsx`, `tests/belgeler/belge-studio-sections.test.ts`, Beton.

**İş sırası:**
1. Gerçek JSX üzerinden Beton **4 bölümünü** haritala, gerçek `DOCUMENT_EDITABLE_FIELDS` ile 10/10 alan tek bölüm kuralı. İsimler/ikonlar/eski form alan sırası değişmez.
2. Accessible `h3/button` header, `aria-expanded/controls`, açık/kapalı body mounted, fakat `display:none` ve tabindex/hide gerçek. `n/toplam dolu` sayaç, **validasyon değil**. Animasyon yok.
3. `toggle/openAll/closeOthers/reveal`, aktif grup garantisi. `useBelgeFieldFocus` event'lerini ezme; `getFieldId`/formView/scroll ref bütünlüğü. Aktif input kapatılırsa önce başlığa odak taşı; eski PDF vurgusunu yanlış yerde bırakma.
4. Kapalı ID listesi ayrı localStorage preference; ilk ziyaret her grup açık, reload'da kullanıcı kapattıklarını hatırla. Geçersiz listede fallback all-open. Preference kaydı **taslak verisini tetiklemez**.
5. `hidden` CSS computed style testi ve manuel `%`/`Fit`/`Compact` form zoom ile `ResizeObserver` döngüsü testleri; 320/390 mobile scroll + keyboard. Kapalı section yazı kesmesi veya input reseti yapmamalı.

**Test:** bölüm unit + Beton E2E (keyboard, tab order, values, prefs, zoom), field-focus pilot regression, TS/lint.

**Kabul:** 4 bölüm sağlam; 10/10 exact mapping, form state/PDF/download aynı, storage davranışı ayrı. **Hata:** önce panel gizleme CSS/focus sorununu çöz. **Dur:** ASAMA_06.

### ASAMA_06 — Akordeon diğer 4 stüdyo, 56/56 alan

**Giriş:** Beton pilot PASS. **Dosyalar:** diğer dört stüdyo ve section map, testler.

**İş sırası:**
1. Ruhsat üç, Sözleşme dört görsel grubu gerçek JSX'e göre sar. İstifa/Taahhütname `span` başlıklarını anlamlı ve erişilebilir `h3/button` hâline getir; kullanıcı metinleri/ikonları ve alan sırası korunur.
2. **56/56 editable** key tam olarak 1 section'a ait. Bu sayımda İstifa PDF-only label'ları yok; çifte bağlanmış/yetim key test FAIL. Stüdyolara özgü kapalı-id tercihleri ayrı.
3. Programatik `reveal(fieldKey)` varsa önce bölüm açıp sonra güvenli scroll/focus. PDF→form navigasyonu yerelde kanıtlanmamışsa bu aşamada yeni davranış üretme. Sözleşme ikinci PDF sayfasındaki alanlar formda erişilebilir kalmalı.
4. `onFocusCapture`/`onBlurCapture`/Escape ve inline-edit callback'leri; form tab/caret, scroll, mobile PDF/form dönüşü; manual/fit/compact; 320/360/390/768/1024/1366/1920; light/dark.

**Test:** section 56-map unit; beşli Playwright keyboard+visual; `npm run check:belgeler-pdf`; TS/lint.

**Kabul:** 56/56, ARIA ve odağın gizli inputta kalmaması PASS; taslak ve PDF regresyon yok. **Hata:** yalnız yanlış grubun mapping/DOM'unu düzelt. **Dur:** ASAMA_07.

### ASAMA_07 — PDF odak modu, desktop toolbar ve state koruma

**Giriş:** akordeon beş stüdyoda PASS. **Dosyalar:** yeni `use-belge-studio-pdf-focus.ts`, toolbar ve gerekirse ortak layout sınıfları; beş stüdyo minimal optional prop, testler.

**İş sırası:**
1. Gerçek `lg` breakpoint'e uyumlu desktop detect, ilk SSR'de layout mismatch yok. `<1024px` mobilde toggle görünmez ve eski PDF/Form sekme geçişi çalışır. 1280→900→1280'de focus etkisi **sıfırlanır**; kullanıcının onayı olmadan tekrar gizlenmez.
2. Kök panel split üstünden sol scroll kabına CSS görünmezlik (React unmount **yok**); PDF `flex-1 min-w-0 w-full`. Toolbar içinde tek toggle `PDF'ye odaklan`↔`Formu göster`, `aria-pressed`, gerçek `data-testid`. 1024px'de taşarsa mevcut `more` yapısıyla daralt; kontrolleri silme.
3. Odaklı girdiyi gizlemeden önce görünen toggle'a odak; çıkınca eski input yalnız hâlâ mounted+visible/open ve uygun belgeyse restore. ScrollTop, `touchedFields`, section state, zoomLevel/currentPage/inline selected state ve draft state korunur. **Escape için yeni listener ekleme**.
4. Form fit hidden panel 0-size ölçümünü son geçerli ölçeğe düşmeden yönetir; görünürleşince ölçümü yeniler. PDF resize redraw normal; **yeni `formData` / PDF byte generation YOK**; canvas render tokene/alan vurgusuna yanlış koordinat vermesin.
5. Taslak consent/recovery/conflict kontrolü panel dışında görünür; mobil, isModal ve 2 sayfalı Sözleşme korunur.

**Test:** desktop 1024/1280/1366/1920/2560; mobile 320/390/768; manuel zoom %50,%150,%200, Fit, Sözleşme page 2; 10 hızlı toggle; aria/keyboard; PDF generator/createObjectURL odak toggle'da **0 ek çalışma**, canvas redraw'a izin; undo, save, print/download, inline edit; textarea caret/scroll geri dönüşü.

**Kabul:** UI düzgün, odak/scroll/zoom ve PDF field highlight korunuyor; eski renderer değiştirilmedi. **Hata:** toolbar ve layout dar patch; PDF engine refactor yok. **Dur:** ASAMA_08.

### ASAMA_08 — Entegre senaryolar, erişilebilirlik, mobil ve stres

**Giriş:** üç özellik ayrı ayrı PASS. **Dosyalar:** ortak yeni Playwright UX spec'i, gerekirse ufak bugfix'ler.

**Zorunlu senaryolar:**
1. İzin ver → Beton Şantiye Yeri'ne uzun Türkçe adres yaz → 800ms kayıt → bir bölümü kapat/aç → PDF odak aç/kap → reload → açık restore → hem input hem PDF doğrula.
2. Form **örnek/default** ile mount: taslak oluşmaz; `Temizle` onayından sonra boş yeni snapshot kaydolur; reload'da eski dolu draft *hortlamaz*. Undo uygulanırsa önceki snapshot tekrar kaydolur.
3. Cihaz/sekmelik iki mod, tercih değişimi; `Kaydetme` gizlilik; bozuk kayıt, quota, tırnaklı/emoji/çok uzun metin, 64KiB sınır; karar beklerken form değişince draft korunur.
4. İki sekmede conflict, `pagehide`, `visibilitychange`, eski timer ve `Taslağı sil` birbiriyle yarışır; kullanıcıya gösterilmeden değer uçmaz.
5. Sözleşme imza alanı manuel override, Taahhütname ünvan/imza, Ruhsat Randomize, İstifa etiketleri, 56 alan focus highlight, Sözleşme sayfa2, inline PDF edit ve mobil sheet.
6. Klavye-only: accordion header Space/Enter, Tab/Shift+Tab, `aria-expanded`, drawer/dialog odak, Escape mevcut davranışı, 44px touch, forced-colors, reduced-motion, light/dark, ekran okuyucu durum duyurusu.
7. 320/360/390/430/768/1024/1366/1920; mobile klavye/safe-area/alt footer; odak modu yok ama draft restore menüsü erişilebilir; yatay scroll/overflow yok. Fiziksel cihaz testi yapılmadıysa `BEKLIYOR`.
8. 30 kez grup/toggle/caret/zoom; sık yazma PDF üretimini yalnız form değişikliğine bağlar; accordion/focus toggles gereksiz PDF blob üretmez. Debounce tek son snapshot'a birleşir. Ölçülen longtask sonuçları baseline ile karşılaştırılır; uydurma perf başarısı yazılmaz.

**Test:** `$env:PLAYWRIGHT_PRODUCTION_SERVER='0'`; hedef `tests/site-audit/belgeler-studio-ux.spec.ts`, mevcut `belgeler-field-focus`, `belgeler-form-view`, `belgeler-inline-edit-mobile` uygun projelerde; gereken birim/TS/lint. Test varlığını kaynakta doğrula. Ekran görüntüleri *kanıt* dosyasıdır, kullanıcı gerçek kişisel verisi içermez.

**Kabul:** tam kombinasyon matrisi PASS; kritik gizlilik/veri kaybı yok; browser console uncaught error yok. **Hata:** yalnız minimal regression fix; sonra ilgili senaryoyu yeniden test et. **Dur:** ASAMA_09.

### ASAMA_09 — Tam yerel kabul, production build ve mimari kayıt

**Giriş:** ASAMA_08 PASS. **Hedef:** **yayın öncesi son zorunlu kapı**.

**Komut/sıra:**
1. `npx tsc --noEmit --incremental false`; `npx tsc -p tsconfig.next.json --noEmit --incremental false`; ilgili `npx eslint` listesi; `npm run check:belgeler-pdf`; `npm run check:belgeler-inline-mobile`; hedefli belgeler alan vurgusu/form görünümü/PDF edit ve yeni UX Playwright E2E. Gereksiz site-wide büyük testleri sırf görüntü için koşturma.
2. `npm run build` (mevcut `prebuild`, `next build --webpack` aynen). Build sonrası production-server Playwright için `$env:PLAYWRIGHT_PRODUCTION_SERVER='1'`; **build test ettiğin değişik HEAD'e ait** olmalı, eski `.next` build'i değil.
3. CSS hidden + focus/scroll, PDF currentPage/zoom, long text, privacy no console/network/URL leaks, device/session persistence, conflict, schema, read-back, reset/undo. PDF çıktısında değerler ve layout baseline ile semantik eşdeğer; byte düzeyi nondeterministik üretim varsa yanlış eşitlik testi kurma.
4. Ekran görüntüsü + fail trace (sahte verilerle). `docs/BELGELER_SISTEMI.md` yaşayan belgesine üç özellik, storage schema/keys, kişisel veri uyarısı, stage/test komutları, yeni belge eklerken section+allowlist nasıl bağlanır; gerekiyorsa küçük `PROJECT.md` notu.
5. `git diff --check`, `git diff --stat`, `git status --short`; alakasız kullanıcı dosyalarını ayır ama silme/stash etme. Debug script, gerçek PII, video, log, tarayıcı yerel storage dump'ı commit'e girmeyecek. Feature flag true ama acil ayrı geri alma yordamı belirtilmiş.

**Kabul:** ilgili tüm zorunlu kontroller gerçek PASS; canlıya çıkmak için veri kaybı, PDF/regression/build engeli sıfır. `execution_status: YEREL_KABUL_GECTI`, `next_stage: ASAMA_10`. **Hata:** fail varsa ASAMA_10'a geçme, smallest patch + relevant retest. **Dur:** ASAMA_10 için `devam` bekle.

### ASAMA_10 — Tek kontrollü Production release ve canlı smoke

**Giriş:** ASAMA_09 PASS + yerel agent'da gerçek erişim/bağlantı, repo `AGENTS.md` kurallarının doğrulanması. Kullanıcının sonraki `devam` mesajı bu final release aşamasının uygulanmasıdır.

**İş sırası:**
1. `git status`, `git branch --show-current`, `git fetch` (mevcut değişiklikleri bozma), local+remote `main` ilerleme durumu. Ayrışmışsa otomatik merge/rebase/force push yok: `ENGELLI`. Bu görevin dosyalarını **tek tek** stage et; `git add .` yok. Kullanıcıya ait başka işleri commit etme.
2. Tek anlamlı atomic commit: `feat(belgeler): akilli bolumler, izinli taslak ve pdf odak modu`; doğrulanmış yerel `main` üzerinden **tek `git push origin main`**. Repo izinlerine ve mevcut Vercel bağlantısına bak; gereksiz Preview oluşturma.
3. Vercel bu SHA için Production `Ready` olduğunu **kanıtla**. Araç yoksa `TAMAMLANDI` yazma; `YAYIN_DOGRULANAMADI` kaydıyla sonucu dürüstçe açıkla. Windows PowerShell çıplak `curl` alias kullanılmaz; gereksiz tekrar inspect/redeploy zinciri yok.
4. Canlıda **yalnız sahte veriyle** en az Beton + iki sayfa Sözleşme + bir mobil `Form/PDF` senaryosu: accordion preference, izinli cihaz/sekme autosave, reload recovery, PDF odak aç/geri al, PDF indirme, hata/console. **Yerel browser depolamasında oluşturulan sahte test kayıtlarını temizle**; gerçek kullanıcı datasına dokunma. Canlı test ekstra deploy üretmez.
5. `IMPLEMENTATION_STATE.md`: `TAMAMLANDI`, son HEAD, release SHA, deploy URL, tested_at ve smoke kanıtı. Post-deploy yalnız bu dosyayı commit etmek için yeni push **yok**. Kapanış raporu kısa; sonraki salt `devam` hiçbir işlemi tekrar başlatmaz.

**Kabul:** ilgili SHA için Production Ready **ve** canlı smoke PASS; `TAMAMLANDI`. **Hata:** `Ready`/smoke FAIL → `ENGELLI` veya `YAYIN_DOGRULANAMADI`, log+evidence, kontrolsüz ikinci deploy yok; ciddi regresyonda mevcut repo politikasıyla revert/feature flag ve kullanıcı bilgilendirmesi.

---

## 6. Nihai test kabul matrisi (özlü, ölçülebilir)

| Alan | PASS şartı |
|---|---|
| 5 belge, 56 alan | Hiçbir alan kayıp/çifte bölümde değil; istifa sabit etiketleri hiç overwrite edilmiyor. |
| Accordion | İlk ziyaret açık, manuel kapatılan tercih reload'da korunur, `display:none` gerçek, Tab gizli input'a girmez, `aria-expanded/controls` doğru. |
| Dolu sayaçları | `trim` ile string doluluğu, örnek text dolu sayılsa da `tamamlandı` iddiası yok; collapsed section bilgisi okunaklı. |
| Form zoom | Manual/Fit/Compact ve section hide/show/caret/scroll; hidden ölçüm 0 sorunu yok. |
| Consent | İzin öncesi hiçbir kullanıcı form verisi `localStorage`/`sessionStorage`'a yazılmıyor; form/PDF indirme hep kullanılabilir. |
| Device/session | Device taslak local, session taslak session, key izolasyonu; sessiz mod transferi/silme yok. |
| Debounce | 5 hızlı kullanıcı değişikliği → 800ms duraksamadan sonra tek son snapshot; format/uyumluluk doğru. |
| Restore | Explicit seçim, `Şimdilik kapat` yazma durdurur, bozuk sürüm kayıt korunur, `initialData` yok olmaz, Undo anlamsız eski state'e gitmez. |
| Reset/Clear | Kullanıcı onaylı reset/clear boş/default snapshot'ı yazar; eski draft dirilmez; Undo tekrar yazılabilir. |
| Quota + 64KiB | Kaydetme başarısız görünür, içerik kesilmez ve form çalışır; yanlış `Kaydedildi` olmaz. |
| İki sekme | Cihaz modunda sahiplik/conflict; otomatik sessiz overwrite yok; pending timer ve pagehide silinen kaydı geri yaratamaz. |
| 30 gün | Eski taslak uyarısı; kullanıcının onayı olmadan sırf eski diye silinmez. |
| PDF odak | 1024+ sol panel gizlenir, PDF genişler; form unmount olmaz; currentPage/zoom/scroll/section/draft korunur. |
| Esc ve keyboard | Yeni focus mode Esc listener yok; mevcut PDF inline edit/alan vurgu Escape davranışları bozulmaz. |
| PDF motor ve çıktı | Acordion/focus tek başına PDF blob/generator çalıştırmaz; gerçek edit dışı PDF byte/layout değişmez; inline edit/sayfa2/vurgu/download/print regresyonu PASS. |
| Mobil ve tema | 320–768 mevcut panel sekmeleri bozulmaz, consent/restore erişilir, 44px min dokunma, dark/light ve reduced-motion. |
| Production | Bir yerel release commit/main push, kanıtlı Vercel Ready, sahte verili canlı smoke; ekstra deploy yok. |

### Kritik risk önceliklendirmesi

1. **PII/veri kaybı** → en yüksek; test FAIL ise dağıtma/deploy etme.
2. **Depo çakışması / bekleyen timer** → ayrı ASAMA_03.
3. **PDF mevcut üretim/alan vurgusu/inline edit** → tüm aşamalarda ilgili kısa regression, finalde geniş.
4. **Form fit ve hidden DOM** → computed-style, ResizeObserver ve caret testleri.
5. **Çok dar masaüstü toolbar / mobil sanal klavye** → 1024, 320px sınırları.
6. **Uzun metin ve perf** → baseline karşılaştırması; testlerin kendisi performansı anlamsız değiştirmemeli.

**Geri dönüş:** feature flag'i güvenle devreden çıkarma ayrı bir **testli** release gerektirir; mevcut kullanıcı taslaklarını flag kapatırken **silme**. Gerekli ve onaylı tam geri dönüş `git revert <release_commit>` + test + release (force push/reset yok). Riskli otomatik kayıt kapatılırken form/PDF kullanımı devam etmeli. Yeni storage anahtarları eski sürümlerce okunmayabilir; silindiğini varsayma.

---

## 7. Gemini 3.8 Flash için **tek başlangıç prompt'u**

> Bu dosya `BELGELER_AKILLI_BOLUMLER_TASLAK_ODAK_MODU_BIRLESIK_NIHAI_V3.md` nihai uygulama planıdır. Projem `smitelagwar/muhendislik-site`, ortamım Windows yerel proje klasörü. Önce dosyanın tamamını, ardından `PROJECT.md`, `AGENTS.md`, `GEMINI.md`, görevle ilgili `.agents/rules` ve `docs/BELGELER_SISTEMI.md` dosyalarını oku. Mevcut çalışma ağacımı, önceki görevlerin plan/durum dosyalarını ve yerel değişikliklerimi koru. **Şu an yalnız ASAMA_00'ı uygula:** repo/branch/HEAD durumunu, gerçek bölüm ve 56 alan eşlemesini, mevcut storage-key/aksiyon kontratını ve başlangıç testlerini doğrula. Bu planı kendi görev dizini `docs/belgeler-ux-v3/PLAN.md` olarak kopyala; `IMPLEMENTATION_STATE.md` ve kısa keşif/test kanıtlarını oluştur. **Üretim koduna dokunma, ASAMA_01'e geçme, commit/push/Vercel deploy yapma.** Test koşmadıysan PASS yazma. Aşama tamamlanınca en çok 8–12 satır sonuç verip dur. Sonraki her `devam` yalnız sıradaki tamamlanmamış aşamayı çalıştırsın. `TAMAMLANDI` sonrasında salt `devam` hiçbir işlem başlatmasın.
