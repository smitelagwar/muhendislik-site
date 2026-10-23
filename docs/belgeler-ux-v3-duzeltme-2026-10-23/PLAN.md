# BELGELER UX V3 — KAYNAK VE TARAYICI DENETİMİ / DÜZELTME PLANI

Tarih: 23 Ekim 2026, Europe/Istanbul  
Plan ID: `BELGELER_UX_V3_CORRECTIONS_2026_10_23_R1`  
Durum: `PLAN_HAZIR` — düzeltmeler henüz uygulanmadı.  
Hedef: `C:\Users\hsyn\Desktop\muhendis-mimar-portali`  
İncelenen HEAD: `323b064960bbdc9cbab0b4fbc55f74ca7f6fdf47`, branch `main`.  
Referans: `BELGELER_AKILLI_BOLUMLER_TASLAK_ODAK_MODU_BIRLESIK_NIHAI_V3.md` / `docs/belgeler-ux-v3/PLAN.md`.

## 1. Denetim sonucu ve kapsam

**Uygulama tamamlanmış görünse de kabul sözleşmesini karşılamıyor. Özellikle taslak mahremiyeti ve veri kaybı korumasında yayın engeli sayılması gereken hatalar var.** Temel form, PDF odak modu ve bölüm haritalaması çalışıyor; bütün sistemi yeniden yazmak gerekmiyor. Aşağıdaki hataları ortak taslak katmanında ve ilgili küçük UI adaptörlerinde düzelt.

Bu plan yeni bir özellik tasarımı değildir. Orijinal V3 planının ihlal edilen sözleşmelerini tamamlar. Eski `ASAMA_00`–`ASAMA_10` aşamalarını baştan uygulama. Bu dosyadaki `D00`–`D06` düzeltme aşamalarını uygula.

Bu incelemede üretim kaynakları değiştirilmedi; commit/push/deploy yapılmadı. Yerel sahte profillerde test yapıldı. Mevcut kullanıcı tarayıcısının gerçek depolaması okunmadı. Önceki görevlerin durum dosyaları değiştirilmedi.

### Gerçek doğrulamalar

| Kontrol | Bu denetimde sonuç |
|---|---|
| Yeni storage + sections mevcut birim testleri | **23/23 PASS** |
| Mevcut auto-draft pilot + concurrency + PDF focus E2E, Chromium 1366, dev | **16/16 PASS**, 53.8 sn |
| `tsc -p tsconfig.next.json --noEmit --incremental false` | **PASS** |
| Genel `tsc --noEmit --incremental false` | **FAIL**, exit 2; eski CAD/ECC/doküman örnekleri ve bazı test dosyaları dahil |
| Bağımsız tarayıcı hata araştırması | R01–R18; aşağıdaki somut ihlaller yeniden üretildi. R17 scroll kontrolü PASS. R11 geçici duraklatmanın reload davranışını gösterir; kalıcı kapatma özelliğinin yerine geçmez. |
| Saf storage / preference adversarial kontrolleri | S01–S05, **5 sözleşme ihlali** |
| Yeni production build / güncel canlı site / fiziksel telefon | Bu incelemede **çalıştırılmadı**, PASS iddiası yok |

**Önemli:** Mevcut testlerin yeşil olması aşağıdaki hataları geçersiz kılmıyor. Hata senaryoları gerçek UI → hook → browser storage akışından üretildi.

Test ortamında `package.json` ve `package-lock.json` Next **16.4.2**, kurulu `node_modules/next/package.json` **16.3.6**. React/ReactDOM **19.2.3**, PDF.js **6.3.289** eşleşiyor. Bu turdaki runtime kanıtları kurulu 16.3.6 içindir; kilit dosyasına uygun temiz ortam kabulü henüz yok. Depolama algoritmasındaki doğrudan kaynak hataları bu sürüm farkından bağımsızdır.

### Kanıt konumu

`docs/belgeler-ux-v3-denetim-2026-10-23/`:

- `reproduce.mjs`: izole Chromium profilleriyle tekrar üretici; `UX_AUDIT_URL` varsayılanı `http://127.0.0.1:3016`. 240 sn emniyet süresi, 8 sn locator timeout ve browser cleanup var. Üretime karşı çalıştırma.
- `results.json`: ilk gözlem turu. R02/R03 ilk denemeleri gerekli ikinci edit/bekleyen edit olmadan PASS; R12 ilk turda harness readback hatası. Bunları nihai ürün başarısı sayma.
- `confirmed-targeted-results.json`: R02/R03/R12 düzeltilmiş senaryolarının gerçek ikinci tur çıktıları; üçü de FAIL.
- `results-targeted.json`: R15–R18 turu; R15, R16, R18 FAIL; R17 PASS.
- `results-final.json`: Yukarıdaki gerçek çıktıların case ID üzerinden son geçerli gözlemle birleştirilmiş özeti; ayrı bir test koşusu değildir.
- `storage-probes.ts`, `storage-results.json`: doğrudan üretim helper'larıyla S01–S05 kanıtları.
- `accordion-all-closed.png`: bütün bölümlerin kapanması.
- `full-typecheck.log`: genel TypeScript çıktısı; `.gitignore` nedeniyle yerel kalabilir.

Sonraki tekrarlar `results-R02-R03-R12.json` gibi ayrı isimlere yazılır. Tanı scripti mevcut bilinen yanlışları gözlemlemek için hazırlanmıştır; **nihai kabul testleri yerine kullanılamaz**. Düzeltme sırasında davranış sözleşmesini doğrulayan Playwright/unit regresyonlarına dönüştür. Beklenen ürün davranışına aykırılıkta exit 1 normaldir; bunu başarılı ürün testi diye raporlama.

## 2. Somut bulgular ve kapatma koşulları

Öncelikler: **P1** veri kaybı/mahremiyet/temel işlev veya kabul kapısı; **P2** diğer işlev, erişilebilirlik ve dayanıklılık eksikleri. Satır numaraları bu HEAD'deki başlangıç konumlarıdır; değişiklikten önce yeniden doğrula.

### F01 — P1: Sekme modundaki veri habersiz cihaz deposuna geçiyor

**Kaynak:** `src/hooks/use-belge-auto-draft.ts:141–226`, özellikle `handleStorage` içindeki `setStorageMode("device")` (185); BroadcastChannel dinleyicileri de aktif moda bakmıyor.

**Kanıt R02:** A sekmesinde Beton → “Yalnız bu sekmede” → kayıt. Aynı origin'deki B sekmesinde Ruhsat → “Bu cihazda kaydet”. A'da yeni düzenleme yapınca A'nın özel sekmelik verisi `localStorage` cihaz taslağına yazılıyor; rozet “Taslak (Cihaz)” oluyor. A'nın mod değiştirme onayı yok.

**Düzelt:** Mod ve izin bağımsız açık kullanıcı kararıdır. Device consent/storage/BroadcastChannel olayları session veya kapalı modu otomatik açamaz/değiştiremez. `enabled`, aktif mod, documentId, storageArea ve mesaj tipi doğrulanmalı. Başka sekmenin global cihaz tercihi bu sekmede seçilmiş session tercihini ezemez. Device↔session geçişi hedef depoda mevcut kayıt varsa açık recovery kararıyla gerçekleşir; sessiz taşıma/silme yok.

**Kabul:** A session + B device; A disabled + B device; farklı belgeler; hem `storage` hem BroadcastChannel; kilit/kanal desteği olmayan ortam. Session verisi yalnız session deposunda, eski device kaydı değişmeden kalmalı. İzin kapama/silme olayları kişisel veriyi başka moda aktarmamalı.

### F02 — P1: Bozuk, uyumsuz veya okunamayan kayıt yokmuş gibi davranılıyor

**Kaynak:** `use-belge-auto-draft.ts:269–293,332–348`; `loadRes.ok === false` ve `inStore.ok === false` için koruyucu dal yok.

**Kanıt R01:** Depoda bozuk JSON + device izni; sayfayı açıp yaz → eski ham kayıt uyarısız yeni taslakla değişiyor. **R12:** `getItem` mevcut taslak için hata veriyor, `setItem` çalışıyor → eski kayıt yine değişiyor; sonradan gösterilen read-back hatası veri kaybını önlemiyor.

**Düzelt:** `missing`, `valid`, `invalid/incompatible`, `unreadable` ayrı sonuçlar. Son ikisinde autosave/flush/takeover normal yoldan kapalı; eski ham kayda dokunma ve güvenli recovery mesajı göster. Boş string/whitespace kayıt da bilinçli tanımlanmalı, yanlışlıkla “yok” kabul edilmemeli. “Yükleyemediğim veriyi üzerine yazabilirim” yaklaşımı yasak. Kullanıcının açık kaydı değiştirme/silme kararı ayrı doğrulanmalı.

**Kabul:** Bad JSON, fingerprint/schema/document uyumsuzluğu, kısmi/fazla alan, oversize, read exception; edit/800ms/pagehide/visibility/unmount sonrasında eski bytes aynı, hata görünür, form/PDF çalışır. Başarısız okuma hiçbir setItem'a yol açmamalı.

### F03 — P1: Başka sekmenin sildiği taslak pending edit ile diriliyor

**Kaynak:** `use-belge-auto-draft.ts:165–175,200–205,401–424,541–570`. Uzak silme `isDeletedRef=true` yapıyor; fakat normal debounce bunu kontrol etmiyor ve dirty state temizlenmiyor. Yerel `deleteDraftAction` ile aynı koruma uygulanmıyor.

**Kanıt R03:** A'da kayıt ve henüz debounce olmamış yeni edit → B'de taslağı sil → A yeni bir kullanıcı eylemi yapmadan silinen kayıt yeniden oluşuyor. Önceki test yalnız silmeyi yapan tek sekmenin pagehide'ını deniyor.

**Düzelt:** Silme/revocation/ownership değişiminde generation token artır, timer iptal et, o ana kadarki pending save'i tüket/engelle. Yeni açık kullanıcı editine veya “Şu anki formu kaydet” eylemine kadar yeniden kayıt yok. Aktif form değerlerini silme. Silinen kayıt için geçmiş “Kaydedildi” görünümünü sürdürme. Tombstone/ownership stratejisi mevcut veri zarfıyla birlikte açıkça tanımlansın; session modunu etkilemesin.

**Kabul:** İki sekme, silme öncesinde dirty edit, delete→pagehide/visibility/unmount ve eski callback; iki iletişim kanalı birlikte/ayrı; silme başarısızsa yanlış silindi yayını yok. Yeni gerçek edit sonrası kayıt açık kurala göre yeniden başlayabilir.

### F04 — P1: Restore sonrası sahte çakışma; takeover doğrulamasız

**Kaynak:** `use-belge-auto-draft.ts:332–348,516–533,579–615`; `belge-draft-storage.ts:598` `compareWriterRevision`.

**Kanıt R04:** Tek sekmede kaydet → reload → “Taslağı Yükle” → düzenle. Başka sekme yokken “Başka bir sekmede ... güncellendi” çıkıyor ve yeni edit kaydolmuyor. Eski writer her farklı writer'ı koşulsuz çatışma sayıyor; restore gözlenen sürümü/sahipliği doğru kurmuyor.

**Kaynakla doğrulanan ek eksik:** `performSave(..., true)` tüm ön kontrolü atlıyor. Takeover mevcut store'u yeniden karşılaştırmadan yazıyor. `navigator.locks` kullanılmıyor; BroadcastChannel yalnız kayıt sonrası bildirim, sahiplik protokolü değil. Gerçek eşzamanlı yarış bu denetimde deterministik olarak koşturulmadı; güvence varmış gibi yazılamaz.

**Düzelt:** Kullanıcının kabul ettiği draft identity/revision ile aktif writer sahipliğini ayır. Restore/adopt/ignore sonrası başlangıç sürümü doğru kurulmalı. Read→compare→write desteklenen ortamda aynı belge/mod kilidiyle korunmalı. Takeover da kullanıcının gördüğü sürümle en güncel kaydı tekrar karşılaştırmalı; arada değiştiyse fail-closed yeni karar. Session restore başka-sekme protokolüne girmemeli. Destek olmayan ortamda ihtiyatlı conflict/pause, mutlak atomiklik iddiası yok. Silme de aynı sahiplik stratejisiyle uyumlu olsun.

**Kabul:** Tek sekme reload sonrası normal edit; remote snapshot kabulünden sonraki edit; iki eşzamanlı writer/takeover; geciken eski mesaj; silme-kayıt yarışı; monoton revizyon ve stale callback. Tek sekmede sahte conflict yok, gerçek yenilik açık onaysız ezilemiyor.

### F05 — P1: Recovery ve remote yükleme öncesi kayıp onayı eksik

**Kaynak:** `belge-studio-draft-controls.tsx:114,122,172,180`; `use-belge-auto-draft.ts:535,579`.

**Kanıt R13/R18:** Session taslağı var → formu değiştir → “Bu Formla Devam Et” → ikinci onay olmadan eski kayıt değişiyor. Önce ignore sonra edit de aynı. **R14:** Yerel kaydedilmemiş edit varken “Diğer Sekmedekini Yükle” tıklandığında onay olmadan yerel edit gidiyor.

**Düzelt:** Eski taslağın üzerine devam için açık ikinci onay; remote yüklemede mevcut dirty değerler kaybolacaksa açık onay. İptalde form/undo/pending draft/depodaki bytes aynı. Kabul edilen karar sürümü kaydet, timer/generation güncelle, en güncel kayıtla tekrar doğrula. “Şimdilik kapat” pending recovery bilgisini yok etmesin; sonradan geri yükleme/karar menüsünden ulaşılabilsin. Salt “devam ettir” unresolved recovery'yi atlayamasın.

**Kabul:** Device/session, dirty/temiz form, onay/iptal, arada başka sekme değişikliği, dismiss→reopen→restore. Undo eski başka taslağa yanlışlıkla dönmez; uygulanabilir son işlem semantiği test edilir.

### F06 — P1: Sıfırla / Temizle / Rastgele için korumalı onay yok

**Kaynak:** Beş stüdyonun `handleResetToPdfDefaults`, `handleClearAll`; Ruhsat `handleRandomize`. Örnek `beton-dokum-studio.tsx:150–174`; ortak actions doğrudan callback çağırıyor.

**Kanıt R05:** Kullanıcının kayıtlı gerçek düzenlemesi varken “Temizle” → hiç onay gelmeden form ve kayıt boşalıyor. Mevcut test olası onayı `if (visible)` ile atlayarak bunu kabul ediyor.

**Düzelt:** Kayıp riski varsa eylem öncesi uygun onay. İlk örnek/default ve risk olmayan no-op için gereksiz onay üretme. İptalde touched/field focus dahil hiçbir işlem başlamasın. Onay sonrası tek atomik form değişikliği ve aktif izinli taslağa yeni boş/default snapshot; Undo tekrar kaydetsin. Ruhsat Rastgele ve inline/per-field reset eylemlerinin mutasyon semantiğini koru.

**Kabul:** Beş stüdyoda onay/iptal/Undo; cihaz/session; pending timer ve kayıtlı taslak; “Taslağı sil” ile “Formu temizle” farklı davranmalı.

### F07 — P1: İç sayfa geçişinde son değişiklik kayboluyor

**Kaynak:** `use-belge-auto-draft.ts:425–431,460–464`: unmount timer'ı iptal ediyor; cleanup yalnız listener kaldırıyor. SPA route geçişi pagehide üretmiyor.

**Kanıt R16:** İzinli kayıt → son input düzenlemesi → 102 ms sonra gerçek Next Link “Belgelere dön” → debounce iptal; depoda önceki değer kalıyor.

**Düzelt:** Client-side navigation/modal kapanışı dahil unmount için uygun best-effort latest snapshot flush tasarla. Consent/recovery/conflict/deleted/disabled guards her yolda aynı olsun. StrictMode effect cleanup'ını gerçek ayrılma sayıp yanlış yazma; stale closure/ref ve generation yarışlarını çöz. Web Locks kullanılan asenkron yolda sayfa kapanışını garanti ediyormuş gibi sunma; sahiplik doğrulanamıyorsa başka veriyi ezme.

**Kabul:** 800 ms dolmadan Link ile ayrıl, modal kapat, route değiştir; yazılabilir durumda son edit saklanır. Karar/çatışma/izin kapalı/silinmiş durumda hiçbir flush yok. Crash/fiziksel tarayıcı kapanması için mutlak güvence yok.

### F08 — P1: Kota/erişim/silme hatası doğru duruma yansımıyor

**Kaynak:** `belge-draft-storage.ts:39` storage alma sırasında write probe; `deleteDraft:562–593`; hook `performSave` storage null ise sessiz dönüş; `deleteDraftAction` sonuca bakmıyor.

**Kanıt R09:** setItem kota hatası → kullanıcı kaydı açıyor, hata şeridi yok, hiçbir kayıt yok. **R10:** removeItem reddediliyor → eski kayıt duruyor, hata yok. **S05:** Silme sonrası doğrulama okuması başarısızken helper `ok:true` döndürüyor.

**Düzelt:** Okunabilir depoya ulaşmayı yazma probe'una bağlama; dolu depodaki eski taslak okunabilir olmalı. Consent yazma sonucu dahil başarısızlıklar typed sonuçla UI'ya ulaşsın. Silme doğrulanmadan başarı/broadcast/state reset yok. Doğrulanamayan silme “doğrulanamadı” olarak gösterilsin. Başarı yalnız gerçek read-back ile. Retry, sonradan kapatılmış izin/çözümlenmemiş recovery korumalarını aşamasın.

**Kabul:** get/set/remove ayrı ayrı throw; read-back mismatch; quota doluyken restore; başarılı retry; delete failure sonrası reload; UI yalan saved/deleted göstermiyor, form/PDF kullanılabilir.

### F09 — P1: Kayıt ayarları eksik; kalıcı kapatma yerine geçici pause var

**Kaynak:** `BelgeStudioDraftStatusBadge:228` none modunda null; menü yalnız pause/delete. `togglePause:621` yalnız React state.

**Kanıt R06:** “Kaydetme” sonrası taslak menüsü yok, kullanıcı sonradan kaydı açamıyor. **R11:** Pause sonrası reload'da izin hâlâ device; menü yeniden “Duraklat” gösteriyor. Geçici pause'un böyle çalışması tek başına hata değildir; **planın istediği ayrı “Otomatik kaydı kapat / Kaydı aç” işlemi hiç uygulanmamış.** R07 ayrıca pause aktifken rozetin “saved” dalını önce seçip duraklatmayı gizlediğini gösteriyor.

**Düzelt:** Her modda erişilebilir ayarlar: Kaydı aç (mode seçimi), kalıcı otomatik kaydı kapat (eski kayıt korunur), ayrı onaylı Taslağı sil, Retry; geçici pause tutulursa açıkça ayrı. Reload sonrası kapatma tercihi sürsün, cihaz ve sekme tercihlerinin önceliği tanımlansın. Kaydı kapatmak mevcut kayıtları otomatik silmez. Durum öncelikleri açık ve birbirini dışlayan tek lifecycle sözleşmesinden gelsin. Kayıt beklerken eski saved damgasıyla yanıltma; anlamlı durumlar erişilebilir duyurulsun.

**Kabul:** Decline→enable; device↔session mevcut hedef taslağıyla; off→reload→edit yazmama; off→re-enable açık recovery; paused/saved/conflict/error göstergeleri çelişmiyor.

### F10 — P2: Taslak ayarları form gizlenince ve normal mobil sayfada kayboluyor

**Kaynak:** Beş stüdyoda badge yalnız `isModal` başlığı ve `hidden lg:flex` sol form başlığında. Örnek Beton 282,339. Ortak `BelgeStudioActions` taslak API'si almıyor.

**Kanıt R07:** PDF odak modunda ve 390 px mobilde badge görünür değil. Consent/recovery şeritleri panel dışındadır ve bu kısmı koru; eksik olan normal durum/ayar erişimi.

**Düzelt:** Ortak üst alan veya responsive action menüsünde kalıcı erişim. Masaüstü form gizliyken, mobil form/PDF sekmelerinde, isModal varyantında kullanılabilsin. İki bağımsız state/menü yaratma. Escape/outside click/keyboard focus yönetimi mevcut erişilebilir menü bileşenleriyle uyumlu olsun.

**Kabul:** 320/390/768/1024/1366 px, her lifecycle, klavye ile aç/kapat/restore/off/delete. İç menünün overflow-hidden ata tarafından kırpılmadığını gerçek bounding box ve screenshot ile doğrula.

### F11 — P1: PDF hatasında odak modundan çıkılamıyor

**Kaynak:** `belge-studio-pdf-preview.tsx:1514` toolbar `disabled={!snapshot || generationPending || visibleError}`; `belge-studio-preview-toolbar.tsx:238` aynı disabled “Formu Göster”e uygulanıyor.

**Kanıt R15:** PDF odak modunu aç → sonraki üretimde test kontrollü hata → form gizli ve Formu Göster disabled. Bir sunum eylemi PDF motor başarısına bağlı kalmış.

**Düzelt:** En az odak modundan çıkış her zaman kullanılabilir; tercihen saf layout toggle PDF readiness'den bağımsız. Yeni Escape handler ekleme, mevcut açık düğmeyle çıkış korunmalı. PDF motoruna dokunma.

**Kabul:** Üretim pending/error, preview render error, retry sırasında form geri açılır; form verileri/caret/page/zoom korunur. Mevcut altı focus testi de geçer. R17'de 181→181 scroll korunmuştur; kanıtlı bu davranışı bozma. Hızlı toggle/resize/unmount gecikmiş focus callback'leri ve iki instance için ek test çalıştır; sorun görülürse scoped ref ve iptal edilebilir callback ile dar düzelt.

### F12 — P2: Akordeon ana kontrolü yanlış davranıyor

**Kaynak:** `belge-studio-section.tsx:112,136`; `use-belge-studio-sections.ts:121`. `closeOthers` var ama UI kullanmıyor; aktif/son bölüm seçimi tutulmuyor.

**Kanıt R08:** “Tümünü Kapat” sonrası **0 açık bölüm**. Orijinal sözleşme “Tümünü aç” + “Diğerlerini kapat”; aktif/son bölüm kalmalı, yoksa ilk bölüm.

**Düzelt:** Ana eylemleri plana uygun kur. Aktif/son dokunulan grubu izle; tek tek kapatma serbest. Gizlenecek girdinin odağını **önce** görünen ilgili başlığa taşı. State updater içinde storage/focus yan etkileri yapma; StrictMode'da updater tekrar çalışabilir.

**Kabul:** Hiç seçim yok→ilk bölüm; farklı alan/grup seçimi→o grup kalır; klavye; kapalı gövde computed display:none; form/PDF/taslak değerleri aynı, ek PDF üretimi yok.

### F13 — P2: Bölüm tercih şeması, doğrulaması ve reveal semantiği eksik

**Kaynak:** `belge-section-preferences.ts:27–37,59`: sürümsüz dizi, herhangi string ID kabul. `use-belge-studio-sections.ts:147–158`: otomatik reveal de manuel preference'a yazılıyor. Stüdyolar reveal'i ancak focus event geldikten sonra çağırıyor.

**Kanıt S04:** `not-a-real-section` geçerli preference kümesine alınıyor; `allOpen=false` iken bütün gerçek bölümler açık olabiliyor. Mevcut reveal testi gerçek gizli inputa `.focus()` yapmak yerine sahte `FocusEvent('focusin')` yolluyor; bu gerçek programatik erişimi kanıtlamaz.

**Düzelt:** `{version:1, closedSectionIds:[...]}` ve belgeye ait ID allowlist. Yayınlanmış eski dizi biçimini güvenli okuyup normalize et; kullanıcı preference'ını topluca silme. Manuel kapalı tercihi ile geçici reveal'i ayır. `reveal(fieldKey)` önce açsın; commit sonrası gerekiyorsa focus/scroll yapılsın. Var olmayan PDF→form navigasyonu icat etme; ürünün gerçekten kullandığı programatik yol yoksa helper davranışını doğru test et ve ters navigasyon varmış gibi belgeleme.

**Kabul:** Yanlış version/ID/duplicate/type, eski dizi migration, belge değişimi; otomatik reveal kullanıcının manuel tercihini sessizce kalıcı değiştirmiyor; 56 alan tek bölüm. Ruhsat başlıklarında mevcut 1,2,2,3 numaralandırmasını da tutarlı hale getir; alan sırası değişmesin.

### F14 — P2: 44 px hedef ve erişilebilirlik sözleşmesi sağlanmıyor

**Kaynak:** `belge-studio-section.tsx:53,64,71`; draft controls küçük `py-1/py-0.5` düğmeleri ve bağımsız menü; test `belgeler-studio-ux.spec.ts:273`.

**Kanıt R08:** Dört akordeon başlığının her biri **31.5 CSS px**, plan en az 44 diyor. Mevcut test başlık yerine PDF toolbar düğmesini ölçüyor, eşiği **40** kabul ediyor; rapor 44 px PASS diyor.

**Düzelt:** Başlık/draft karar hedefleri gerçek responsive ölçüde 44 px; dar ekranda wrap ve açık focus ring. Sayaç açıklaması doluluğun geçerlilik olmadığını belirtmeli. Planın animasyonsuz bölüm sözleşmesine uy; dönen ikonun transition'ını kaldır veya planın açık kabulüyle yönet, reduced-motion ihlal edilmesin. Menü düğmesinde expanded/controls, kapanış ve odak geri dönüşü doğru. Bölüm ID'leri instance içinde benzersiz; global document selector yerine mümkünse yerel ref.

**Kabul:** 320–1024 sınırları, normal/compact/form scale, Tab/Shift+Tab/Space/Enter/Escape, hidden input erişimi, light/dark/forced-colors/reduced-motion. Eşik küçültüp PASS elde etme; fiziksel klavye/telefon çalışmadıysa ayrı BEKLIYOR.

### F15 — P2: Okuma boyut sınırı ve zarf metadata doğrulaması eksik

**Kaynak:** `belge-draft-storage.ts:311–421,520–550`.

**Kanıt:** S01 **70.471 bayt** kayıt load ediliyor; 64 KiB kontrolü yalnız save'de. S02 prototype'tan miras alınmış metadata zarfı kabul ediliyor; S03 top-level `__proto__` anahtarı reddedilmiyor. **S03 tek başına sömürülebilir prototype pollution kanıtı değildir**; dar güvenli parser sözleşmesi eksikliğidir.

**Düzelt:** Ham metnin UTF-8 sınırını JSON.parse öncesi ölç; oversize kaydı silme. Zarf own-property/prototype/izinli metadata anahtarlarını da values kadar güvenli doğrula. create/parse metadata kuralları tutarlı (finite timestamp, geçerli monoton safe revision). Kullanıcı saatindeki kayma kaydı sessiz ezme sebebi olmasın. Motor girdilerini sınır uğruna kırpma.

**Kabul:** Gerçek **65535/65536/65537 UTF-8 bayt** Türkçe/emoji fixture; both read/write, top-level yasak/inherited alanlar, NaN/Infinity/unsafe revision. Eski ham kayıt invalid olsa da korunur.

### F16 — P2: Feature flag geri alma mekanizması çalışmıyor

**Kaynak:** `belge-ux-config.ts:21` ACCORDION/DRAFT/FOCUS_MODE; ACCORDION ve FOCUS_MODE başka üretim kodunda okunmuyor. DRAFT yalnız hook boot/save kontrolünde; mutation ve mesaj dinleyicileri enabled=false guard taşımıyor.

**Düzelt:** Bayraklar gerçek davranışa bağlansın. Hooks sırası bozulmasın. Accordion off→mevcut açık form; focus off→form erişilebilir; draft off→listener/timer/consent UI/yazma yok, mevcut kayıt **silinmez**. Statik build flag ise runtime rollback diye tanıtma. Bu görevde kalıcı kapatma ile ürün feature flag'i farklıdır.

**Kabul:** Üç flag bağımsız kapalı ve birlikte kapalı; depoda eski kayıt varken edit/reload/remote event; sıfır draft yazma/silme; form/PDF normal. Flag'i prod'da değiştirip test etmek yok.

### F17 — P1: Testler zorunlu senaryoları atlayıp fazla geniş PASS veriyor

**Kaynak örnekleri:** `belgeler-studio-ux.spec.ts:66,93,113,120,152,231,273,343`; `belgeler-accordion-pilot.spec.ts:184`; `belge-draft-storage.test.ts:309`.

- PDF içeriği yerine yalnız `href /^blob:/`; gerçek restore edilen metin PDF'de doğrulanmıyor.
- Onay/restore/Undo kontrolleri `if visible/enabled` ile atlanabiliyor; Undo sonrası beklenen değere assert yok.
- Bozuk kayıt testinde yalnız ekranın açılması, eski raw kaydın korunması yok.
- Session testi yalnız bağımsız boş sekme; F01'deki aynı anda aktif device/session yok.
- Silme testi pending edit olan diğer sekmeyi kapsamıyor.
- 44px testinde yanlış eleman ve 40 eşik; reveal testi sentetik focusin.
- 64KiB testinde gerçek 64KiB sınırı yerine küçük örneğe göre `maxBytes` değiştirilmiş.
- “Sıfır PDF üretimi” yalnız ilk/son blobUrl eşitliğiyle açıklanıyor; aradaki generation çağrıları doğrudan sayılmıyor.
- Özel alan testi başlığı Taahhütname/Ruhsat içerdiği halde entegre senaryonun gövdesi yalnız Sözleşme'yi inceliyor. Ayrı rollout testleri bazı noktaları doğruluyor; tüm birleşik matris PASS denemez.

**Düzelt/Kabul:** R/S kanıtlarını ürünün beklenen davranışını doğrulayan gerçek regresyonlara dönüştür. Başarıyı göstermek için assertion gevşetme. Fake clock ile 5 edit→800ms→1 son yazım sayımı; independent generated PDF okuma; gerçek UI onay/iptal; pageerror/console/hydration/başarısız HTTP denetimi; iki farklı mode tabı; quota/corrupt/delete/takeover; eski alan vurgusu ve mobil inline edit matrisini koru. Araç gözlemcisinin gerçekten çağrı gördüğünü önce pozitif kontrolle ispatla. Frozen ESM namespace'e mutasyon yapma.

### F18 — P2: Mimari ve tamamlanma kayıtları kaynakla uyuşmuyor

**Kaynak:** `docs/BELGELER_SISTEMI.md` bölüm 12; eski UX durum kaydı.

Kaynakta olmayan onay/dirilme güvencesi PASS gibi anlatılıyor. Yeni belge tarifinde `DOCUMENT_SECTION_MAP` deniyor, gerçek export `BELGE_STUDIO_SECTIONS`. Tarif draft controls'u “form içine” koymayı söylüyor, gerekli erişim panel dışı. Bölüm 11'de İstifa PDF-only adları `sayi_deger/ekler_deger/hitap_ek_deger` yazılmış; gerçek kontrat `adres_etiket/tc_etiket/iletisim_etiket`. Başlangıç model/sürüm iddialarını uygulama kanıtı sayma.

**Düzelt:** Eski görev durum dosyalarını yeniden yazma. Yeni correction durumunda eski TAMAMLANDI'nın bu denetimden geçmediğini açıkça kaydet. Yaşayan mimariyi gerçek API, storage key, karar tablosu, flag kapsamı ve doğrulanmış testlerle düzelt. Genel “tsc temiz / tam matris PASS / atomik garantili” iddiaları yalnız gerçek kanıtla. Device modu aynı tarayıcı profilinde erişilebilir, şifreli değil; session devamlılığı browser davranışına bağlı. Bunları kısa kullanıcı açıklamasıyla doğru anlat.

### F19 — P1 kabul kapısı: Test edilen bağımlılık manifest/lock ile aynı değil

**Kanıt:** next declared=16.4.2, locked=16.4.2, installed=16.3.6. Runtime başlığı da 16.3.6.

**Düzelt:** D00'da bağımlılık gerçekliğini yeniden kaydet. Başka kullanıcının çalışan süreçlerini bozma; gerekirse ayrı temiz doğrulama dizininde kilit dosyasına uygun `npm ci` kullan. Bu bir paket upgrade talebi değildir; manifest/lock sürümlerini rastgele değiştirme. Kurulum erişim hatası varsa ENGELLI/BEKLIYOR, sahte PASS yok. Gerekli Next yerel kılavuzu doğru kurulu sürümden okunmalı.

**Kabul:** Next/React/PDF.js üçlü manifest-lock-installed eşleşmesi, aynı workspace kaynaklarıyla fresh build+test; build ID/source digest kayıtlı. Mevcut eski `.next` üretim kabul kanıtı olamaz.

### F20 — P2 kabul kapısı: Genel TypeScript FAIL ve yayın kanıtı sınırları

Genel tsc bu denetimde exit 2. Kapsam dışı CAD/ECC/arşiv örneği hataları var. Ayrıca `tests/belgeler/form-view.test.ts:92` içindeki `FormViewPersistedState as Record<string, unknown>` TS2352 veriyor; satır incelenen release değişikliklerinde bulunuyor. Kaynak-only tsc bu testleri kontrol etmiyor. `inline-edit-field-map.test.ts:362` ve eski `belgeler-stage05-fix.spec.ts:53` de logda; tarih/scope ayrı değerlendirilmeli.

**Düzelt:** Önce baseline ve görevin yeni hatalarını ayır. Düzeltme kapsamının kaynak/test TS hatalarını düzelt; testleri tsconfig'den çıkararak veya `any/ts-ignore` ile susturarak geçme. Alakasız motorları bu işte yeniden düzenleme. Kapsam dışı baseline ayrı FAIL kaydı olarak kalabilir; tüm repo typecheck PASS denemez. Orijinal planın koşulsuz genel PASS yayın koşulundan sapılacaksa bunun için ayrıca açık kapsam kararı gerekir; bu correction plan yerelde biter ve bu kararı kendiliğinden yayın yetkisine çeviremez.

Eski durum dosyasındaki deployment Ready/canlı smoke iddiası bu turda tekrar doğrulanmadı. İncelenen sürüm yerel HEAD'dir. Önceki release commitinde eski field-focus/form-view düzeltmeleri de var; geri alma gerekirse bütün commit'i körlemesine revert etmek o düzeltmeleri de kaybettirebilir. Burada otomatik revert/reset/deploy yok.

## 3. Uygulama mimarisi ve koruma sınırı

1. **Tek form state:** Mevcut `formData` doğruluk kaynağı; tüm beş stüdyo aynı hook/codec/karar modelini kullanır. PDF inline draft ile otomatik saklama taslağını karıştırma.
2. **Açık state machine:** Özellik enabled, consent, aktif storageMode, recovery kararı, observed draft identity, writer sahipliği, dirty generation ve kayıt sonucu çelişmesin. Birçok bağımsız setter'ın yarışmasına dayanma. Tek typed reducer/transition katmanı uygundur; dosyaları anlaşılır sorumluluklara ayır, yeni genel framework/backend ekleme.
3. **Tek kayıt geçidi:** Debounce, retry, explicit save, takeover, visibility/pagehide/unmount aynı yazma uygunluğu denetiminden geçer. Mode fallback ile izni yeniden açma yok. Recovery/read error/conflict/removed durumunda yazma yok. İzin/sürüm/kimlik yazmadan hemen önce kontrol edilir.
4. **Silme doğrulanır:** Başarısız silmede local UI ve diğer sekmeler “silindi” sanmaz. Form değerleri taslak silme ile kaybolmaz. Yeni mutation'ın sayacı eski pending yazımdan ayrılır.
5. **Restore atomik:** Onaylı snapshot tek setFormData; PDF-only label'lar mevcut default'tan korunur. Sözleşme/Taahhütname imza override'ları bozulmaz. Undo/touched semantiğini açıkça test et.
6. **Sunum ayrı:** Accordion/focus/preference tıklamaları draft edit değildir; taslak write veya PDF bytes üretmez. Gerekli canvas resize redraw'a izin ver.
7. **Korunacak dosyalar:** PDF engine/layout/profile/template/font/inline geometry/generation hook, CAD/DWG/DXF, geçmiş durum kayıtları ve form-view storage anahtarı. Hata bu modüllerde değilse dokunma. Form fit, 56 alan rehberi ve mobile sheet mevcut düzeltmelerini koru.
8. Yeni paket/backend/şifreleme/senkronizasyon özelliği yok; kişisel veriyi log/analytics/network/URL'ye yazma. Sadece sahte fixture'lar kullan. `localStorage.clear()` ancak testin kendi boş browser context'inde; gerçek kullanıcı deposunda asla.
9. Tüm yazma/focus yan etkileri React updater dışında; callback'ler unmount/document/mode değişiminde iptal edilebilir. Birden fazla stüdyo varsa aynı document/global selector başka instance'ı değiştirmesin.

## 4. Düzeltme aşamaları

**Aşamalı protokol:** İlk başlangıç yalnız D00. Her `devam` yalnız sıradaki tamamlanmamış aşama. Bir aşama başarısızsa o aşamada kal; önce düzelt, ilgili testleri tekrar çalıştır. Sonraki aşamaya aynı mesajda geçme. D06 sonunda dur; TAMAMLANDI sonrası salt `devam` hiçbir yeni iş başlatmaz.

**Bu düzeltme planında commit/push/deploy aşaması YOK.** Eski V3 planının ASAMA_10 yayın yetkisini bu yeni işe taşımayın. Önce yerel düzeltme ve bağımsız yeniden denetim; yayın ayrıca kullanıcının açık talebiyle, repo politikası ve test edilmiş değişikliklere göre değerlendirilir.

### D00 — Başlangıç, kanıt ve gerçek test ortamı

- PROJECT→AGENTS→GEMINI→ilgili rules (Belgeler/test/dokümantasyon/ECC; Gemini ise ECC zorunluluğu)→yaşayan mimari→bu plan/kanıt.
- HEAD/branch/status, orijinal plan, scope, mevcut dirty dosyaları ve kaynak digest kaydı. Kullanıcı dosyası silme/reset/stash yok. Başka görev state'i değiştirme.
- Yeni klasör: `docs/belgeler-ux-v3-duzeltme-2026-10-23/PLAN.md`, `IMPLEMENTATION_STATE.md`. Bu dosyayı PLAN olarak kopyala; kimliği eşleşen mevcut correction varsa kaldığı yerden devam et.
- F19 bağımlılık farkını çöz/doğrula. Orijinal source'ları değiştirmeden kilide uygun test ortamını kur; gerekiyorsa yerel kurulum işlemini açıkça kaydet.
- Mevcut 23 unit, 16 ilgili E2E, source-only ve full tsc baseline. Seçilmiş R01/R02/R03/R04/R15/R16 hatalarını hedef sürümde doğrula; eski test PASS ile bug FAIL ayrı kaydedilir.
- **Üretim kodu değişikliği yok.** Çıktı: doğrulanmış baseline, hatalar ve D01. Genel baseline FAIL saklanır; D00'ın görevi doğru tespit, genel deponun temiz olduğunu ilan etmek değil.

### D01 — Storage, hata koruması ve consent/mode ayrımı

- F01/F02/F08/F15'in codec/okuma/izin/sonuç temeli. Tek state sözleşmesi ve ortak yazma eligibility geçidi kur.
- Parse/load limitleri, valid/missing/invalid/unreadable farkı, tam typed sonuçlar, gerçek fail-closed.
- Device/session tercihlerinin event izolasyonu; no-permission değişimi, mode switch recovery.
- Unit + gerçek tarayıcı R01/R02/R09/R10/R12 ve S01/S02/S03/S05 karşılıkları.
- Kabul: hiçbir habersiz mode geçişi/okunamayan eski veri üzerine yazma/hata gizleme kalmamalı. D02'ye kadar atomik sahiplik tamamlandı iddiası yok.

### D02 — Writer, silme, lifecycle ve recovery veri kaybı kapısı

- F03/F04/F05/F07: observed revision/adopt, lock destekli read-check-write, açık takeover, generation/tombstone, onaylı recovery/Undo, SPA/unmount flush.
- İki sekme+iki mod; simultaneous save/takeover/delete; pending timers, hide/unmount/bfcache uygun simülasyon; kanal/kilit yokluğu.
- R03/R04/R13/R14/R16/R18 regressions, 800ms fake clock, disable→pagehide, delete fail→no broadcast.
- Kabul: yeni edit yokken silinen taslak dirilemiyor; reload sonrası tek sekme çalışıyor; başarısız/onaysız overwrite yok. Bu kapı FAIL ise kalan rollout veya yayın kabulü yok.

### D03 — Beş stüdyo onayları ve her görünümde taslak ayarları

- F06/F09/F10/F14'ün taslak UI kısmı. Kalıcı off/on/mod seçimi/retry/ayrı delete, recovery yeniden açma, pause durum doğruluğu.
- Ortak stüdyo üst/alt eylem alanı; normal mobil, focus hidden form ve isModal erişimi. Accessible menu/dialog davranışı.
- Beş stüdyoda reset/clear/undo/Ruhsat randomize/inline commit, manuel imza override'ları, başlangıç default ve initialData koruması.
- R05/R06/R07/R11 işlev gereksinimleri; 320 px ve 1024 sınırı; onay iptalinde form/undo/storage aynı.

### D04 — Akordeon sözleşmesi, tercihler ve ölçülen erişilebilirlik

- F12/F13/F14 bölüm kısmı: openAll/closeOthers, aktif grup, safe pre-hide focus, 44px, açıklayıcı dolu sayacı, no-animation, instance ID.
- Eski preference dizisi güvenli migration; allowlist/version; temporary reveal manuel tercihi ezmez.
- Gerçek programatik focus yolu ve 56/56 exact mapping; fields gizliyken Tab erişimi yok; normal/fit/compact/zoom geçişlerinde values aynı.
- R08/S04 ve gerçek render ölçümleri; UI tıklaması ek autosave/generation tetiklemiyor.

### D05 — PDF odak hata kurtarma ve gerçek feature flag'ler

- F11/F16: Formu Göster PDF error/loading'de çalışsın; bağımsız flag'ler gerçek güvenli fallback'e bağlansın.
- İki sayfa, %50/%150/%200 PDF zoom, form fit ve 0-size, hızlı toggle/resize/unmount, caret/scroll, Escape mevcut davranışı, toolbar 1024–1100.
- R15 ve R17, mevcut PDF focus+field-focus+mobile inline regresyonları. Engine refactor yok. Eski taslaklar flag kapalıyken silinmiyor.

### D06 — Bağımsız kabul ve doğru kayıt

- F17/F18/F20: weak assertion'ları düzelt; yeni testleri kapsam ve kaynak gerçekliğine göre tamamla. Source/test scoped typecheck gerçek PASS; genel tsc baseline+delta dürüstçe raporlu.
- Hedefli ESLint; `npm run check:belgeler-pdf`; `npm run check:belgeler-inline-mobile`; yeni draft/accordion/focus UX ve eski field-focus/form-view/inline desktop gereken projelerde.
- Kilit dosyasına uygun **fresh `npm run build`**. Build ID+HEAD+dirty kaynak digest kaydı. Production server açıkça `PLAYWRIGHT_PRODUCTION_SERVER=1`; eski .next/reused ilgisiz sunucu yok. Final kritik veri kaybı senaryoları üretim derlemesinde de geçsin. Dev testte `=0`.
- 5 belge tüm editable veriler için save→reload→restore→gerçek PDF content ve indirilen PDF semantik karşılaştırması; çok sayfa/sabit PDF-only etiketler; üretim çağrı ölçümü.
- Browser uncaught/hydration/error network denetimi, full state matrix screenshot/trace sahte veriyle, cleanup. Fiziksel cihaz/yazıcı ve Linux native-browser-zoom testi Windows'ta çalıştırılmadıysa BEKLIYOR; PDF iç zoom ile karıştırma.
- Yaşayan mimariyi güncelle; eski durum kayıtlarına dokunma. `git diff --check`, final diff scope ve kaynak/test değişiklikleri incelensin. Audit yardımcılarının otomatik release'e sızmaması için planlı artifact kapsamını açık yaz.
- Tüm F01–F20 için kapandı / kapsam dışı baseline / açık ve kanıt listesi. Ürün açığı kalırsa `ENGELLI`; sadece kalan unrelated baseline için “sıfır repo hatası” deme.
- `execution_status: TAMAMLANDI` yalnız **bu yerel correction kapsamının** zorunlu ürün kabulü bittiyse; `release_status: YAYINLANMADI`, `repository_typecheck: FAIL_BASELINE` gibi gerçek sınırlamalar ayrı. Bu, orijinal ASAMA_10 canlı release tamamlandı demek değildir.
- Kullanıcıya kısa kapanış ve yeniden denetim için dosya listesi. **Commit/push/deploy yapma; dur.**

## 5. Durum dosyası şablonu

```yaml
plan_id: BELGELER_UX_V3_CORRECTIONS_2026_10_23_R1
planning_status: PLAN_HAZIR
execution_status: BASLAMADI
scope: YEREL_DUZELTME_VE_KABUL
active_stage: null
next_stage: D00
completed_stages: []
base_head: 323b064960bbdc9cbab0b4fbc55f74ca7f6fdf47
tested_worktree_digest: null
runtime_versions: {}
findings: {} # F01..F20: ACIK | KAPANDI | BASELINE_KAPSAM_DISI; kanıt zorunlu
evidence: [] # stage, case/command, result, exit, elapsed, head/digest, artifact
blockers: []
baseline_failures: []
repository_typecheck: BEKLIYOR
production_build_id: null
release_status: YAYINLANMADI
release_authorized: false
updated_at: null
```

Birimi geçip UI'da fail olan madde kapatılmaz. Mock bir algoritma yazıp yalnız o mock'u sınamak ürün kanıtı değildir. `PASS` koşulunu uygulamaya uydurma; uygulamayı yukarıdaki sözleşmeye uydur. Gerçek blocker varsa en küçük kapsamıyla kanıtla, başarısız aşamayı tamamlandı işaretleme.
