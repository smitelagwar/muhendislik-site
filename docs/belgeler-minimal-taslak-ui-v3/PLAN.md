# BELGELER — Minimal Otomatik Taslak + Birleşik Üst/Alt Bar | NİHAİ V3

> **Plan kimliği:** `BELGELER_AUTO_DRAFT_UNIFIED_UI_V3`  
> **Revizyon:** 2 (önceki `BELGELER_MINIMAL_AUTO_DRAFT_V2` planının yerine geçer; ikisi birlikte uygulanmaz)  
> **Araştırma:** 24 Ekim 2026 · Europe/Istanbul  
> **Kapsam:** `/belgeler` altındaki beş düzenlenebilir PDF stüdyosu  
> **Repo:** https://github.com/smitelagwar/muhendislik-site  
> **İncelenen remote:** `main`, HEAD `04048e50fd02e50c1c9ea783acec2d7383f516b4`  
> **Uygulayıcı:** Windows yerel proje klasöründe **Gemini 3.8 Flash** (`gemini-3.8-flash`, ayar sunuluyorsa `high`)  
> **Teslim:** Araştırma ve uygulama planı; sohbet sırasında kod, test, commit veya deploy yapılmadı.  
> **Yayın:** Bütün testlerden sonra tek anlamlı `main` push ve otomatik Vercel Production doğrulaması.

## 0. Yetki, kapsam ve karar hiyerarşisi

Bu dosya masaüstü ajanına verilecek **tek ve kendi içinde yeterli uygulama belgesidir**. Önceki V2 planı uygulanmaz. Eğer ajan V2 üzerinde değişiklik yapmaya zaten başladıysa dosyaları veya tamamlanan kanıtları silmeden V3 ile uzlaştırır; tamamlanmış işleri körlemesine tekrar yapmaz. `PROJECT.md`, `AGENTS.md`, `GEMINI.md`, `.agents/rules/belgeler-kurallari.md`, `.agents/rules/test-ve-otomasyon-standardi.md`, ilgili alt dizin kuralları ve yerel kod incelenir. Güncel yerel uygulama, uzaktan incelenen committen farklı olabilir; **yerel değişiklikleri reset/pull/checkout ile ezme**. Kullanıcı bu planda **planlama** istemiştir; burada doğrudan repo yazımı yapılmadı. Uygulayıcı ilk `başla`/`devam` ile `ASAMA_01`'i yürütür.

**Kapsam dışı:** Yeni sunucu/veri tabanı, bulut senkronizasyonu, kimlik doğrulama, PDF oluşturma/şablon motorunun değiştirilmesi, salt-okunur `/b/[token]` paylaşım görüntüleyicisinin yeniden tasarımı, PDF metin tipografisinin değiştirilmesi, ilgisiz navigasyon veya genel site header refactor'ü. Rastgele/örnek veri doldurma için mevcut ayrı koruma davranışı **aynen korunur**; kullanıcı yalnız **Sıfırla** ve **Temizle** onaylarının kaldırılmasını istemiştir.

## 1. Kesinleşmiş kullanıcı deneyimi sözleşmesi

1. İlk değişiklikle taslak kaydı **otomatik ve izin sorulmadan** devreye girer; her son değişiklikten **2.000 ms sonra** tarayıcının aynı cihazdaki kalıcı depolamasına yazılır. Kullanıcı yazmaya devam ederse sayaç yeniden başlar. Başka sunucuya form içeriği gönderilmez.
2. Kullanıcıya **taslak aç/kapat, duraklat, yalnız sekme/cihaz, taslağı sil** menüleri gösterilmez. Geçerli taslak sayfa yeniden açılınca sorulmadan yüklenir. Geçerli bir kullanıcı düzenlemesi ilk yüklemede ezilmez.
3. Üst barda tek minimal durum: başarılı **gerçek depolama yazısından sonra** `✓ Kaydedildi`. Yazım sürerken düşük vurgulu durum (`Kaydediliyor…` veya sabit ikon), başarısızsa `Kaydedilemedi`. Sessiz başlangıçta sahte `Kaydedildi` yok. Gereksiz yeşil puls, sürekli animasyon, toast veya yeni araç satırı yok.
4. **Sıfırla** = belge şablonundaki varsayılan/örnek değerleri geri getirir; **Temizle** = kullanıcı alanlarını boşaltır. İkisi de **doğrudan, `confirm`/modal olmadan** uygulanır. Önceki gecikmiş kayıt geri gelmez; yeni durum aynı işlemde gecikmesiz saklanır; mevcut **Geri al** bozulmaz.
5. Üst barda **“Canlı Önizleme Hazır” yazısı ve ona ait yeşil, sürekli nabız atan başarı rozeti tamamen kalkar**. PDF'yi üretme/hata/yükleme akışını engelleme; gerekliyse “Derleniyor…” sadece gerçek işlem sırasında gösterilebilir. Ekran okuyucu için gerçek hazır/hata bilgisi korunur, ancak tekrar eden anons yapılmaz.
6. **Light/dark tema anahtarı üst barın görsel olarak EN SAĞINDA** ve mobilde de doğrudan erişilebilir olur. Üst barda sağındaki hiçbir görünür kontrol bulunmaz. Modal kapanış `X` varsa **tema anahtarının solunda** kalır. Mobilde tema için ayrıca alt menü kopyası bulunmaz.
7. **PDF zoom grubu** (`−`, `%`, `+`) bulunduğu **üst araç şeridinin geometrik yatay ortasına** yerleşir; soldaki sayfa navigasyonu ve sağdaki diğer araçların genişliği bu merkezi kaydırmaz. `Sığdır` = **PDF'yi sığdır**, form ayarı değildir; PDF'yi yeni sekmede aç, sayfa gezintisi, PDF odak modu korunur. 320 px darlıkta yardımcı araçlar başka menüye alınabilir, ancak eksi/artı erişimini veya grup merkezini feda etme.
8. **Form Görünümü** (form ölçeği/kompakt mod/sığdırma ayarları) **üst araç şeridinden kalkar, en alttaki işlem barına geçer; “Boş form indir” düğmesinin tam SOLUNDA** durur. Masaüstünde etiketli iki yan yana düğme; mobilde 44×44 px ikon düğmeleri yan yana ve görünür. Popover alt bardan **yukarı açılır**. `Form Görünümü` ile mobildeki önemli **`Formu Düzenle` / `PDF Önizle` geçiş düğmesi ASLA karıştırılmaz veya kaldırılmaz**.
9. Beş belge stüdyosunun tamamı bu kurallara uyar. Mobil form/PDF panel geçişi, footer güvenli alanı (`safe-area`), odak modu, paylaşım, yazdırma, ana PDF indirme ve PDF üzerindeki alan düzenleme bozulmaz.

### Görsel yerleşim sözleşmesi (şematik, piksel tasarımı değil)

**Geniş ekran / stüdyo üstü**

```text
[Belge başlığı…] [✓ Kaydedildi] [gerekliyse X] [THEME]  ← üst barda theme son eleman

PDF araç satırı: [Sayfa 1/2] … [−  %100  +] … [Sığdır] [Yeni sekme] [Odak]
                                    ↑ araç satırının TAM merkezi

En alt bar: [Sıfırla] [Temizle] [Geri al]   [Form Görünümü] [Boş form indir] [Yazdır] [Paylaş] [PDF İndir]
                                              ↑ hemen solunda ↑
```

**320–430 px mobil** (tek satıra öncelik, ek yatay sayfa taşması yok)

```text
ÜST: [Belge…] [✓ Kaydedildi] [gerekliyse X] [Tema]
PDF ARAÇ: [gerektiğinde sayfa] … [− % +] … [diğerleri]
ALT: [⋯] [Form görünümü ⚙] [Boş form ▣] [Formu Düzenle / Önizle] [PDF İndir]
                    ↑ 44 px ↑      ↑ 44 px ↑
```

- Mobilde yer kazanmak için **yalnız alt bardaki Form Görünümü ve Boş form indir etiketleri ikona dönüşebilir**; erişilebilir adları ve tooltipleri tam kalır. `Paylaş`, `Yazdır`, `Sıfırla`, `Temizle`, `Geri al` gibi ikincil işlemler mevcut `⋯` menüsünden de erişilebilir kalabilir. Her işlem **bir kez** anlamlı ve çalışır durumda sunulmalı.
- 320 px'te paylaşımın ayrı hızlı ikonunu kaldırıp menüde tutmak kabul edilir; **Form Görünümü + Boş form ikonlarının bitişik sırası, PDF İndir ve Formu Düzenle / Önizle önceliği korunur**.
- Varsayılan tek satır yerleşimi yetmiyorsa metinler daha kısa/ikon-only yapılır ve CSS grid/flex öncelikleri düzeltilir; **ana kontrolleri ikinci satıra zorlayan global genişlik kuralı veya yatay kaydırma konmaz**. 200% tarayıcı zoom/çok küçük yükseklik gibi ekstrem durumlarda scroll güvenliği ayrıca test edilir.

## 2. V2'ye yönelik eleştirel inceleme — V3 neden farklı?

| V2 riski / açık | Gözlenen teknik gerçek | V3'ün zorunlu düzeltmesi |
|---|---|---|
| Yalnız “2 sn debounce” ayarı değiştirmek | Mevcut hook izin, `paused`, `observed`, conflict, flush ve `generation` kapılarına bağımlı | Kapalı/izinli legacy modlardan bağımsız **tek net durum makinesi**; form snapshot değişirse timer; effect state'i gereksiz timer kurmaz |
| `Kaydedildi` sahte pozitif olabilir | `isSaving` yalnız `lifecycleState === "saving"`; incelenen hook'ta bu state'e geçiş garantili görünmüyor | `dirty → saving → saved` açık; **setItem + read-back/validasyon** başarılıysa saved; hata durumunda asla saved |
| Reset/clear eski timeout ile yarışır | Beş stüdyo `markFormMutated` ve `setFormData` çağırıyor | **Tek ortak `replaceAndPersist` işlemi**; en yeni ref + generation invalidation; yeni snapshot derhal yazılır; undo aynen kalır |
| Eski session/device taslaklarını sadece `savedAt` ile seçmek | Ayrı depolarda revision karşılaştırılabilir olmayabilir; saat farklılıkları/schemalarda çakışma var | **Önce geçerli device**; session taşıması ancak device yoksa ve veri doğrulanırsa; iki farklı kayıt asla otomatik birbirinin üzerine yazılmaz; kurtarma nüshası korunur |
| Kullanıcıya yine çok fazla durum anlatmak | V2 `Değişiklik var`, `Otomatik kayıt` metinlerini de önerebiliyordu | İlk durumda alan boş/nötr; kayıt sırasında minimal, başarıda sadece **`✓ Kaydedildi`**; anonslar gürültüsüz |
| Mobil bottom bar yeni düğmeleri taşıyamayabilir | Güncel footer mobilde `⋯`, paylaşım, tab değiştirme ve PDF indir içeriyor; Boş form indir menüde | Mobil **Form Görünümü + Boş form** yan yana ikona alınır; paylaşım hızlı ikonu gerekiyorsa menüye taşınır; 320/390 ve klavye açık test yapılır |
| Zoom “ortada” yalnız CSS'e bakılarak sanılabilir | `.belge-preview-controls` grid iken ortalıyor; bazı çok sayfalı mobil durumlarda flex'e dönüyor, desktop dar container'da iki satır kullanıyor | Zoom yalnız `− % +`; `Sığdır` ve yeni sekme gruptan ayrılır; **gerçek bounding rectangle merkez ölçümü** şartı; dar durumda öncelik/fallback |
| Tema daha sağa almak sanıldığı kadar basit değil | Tema bugün PDF toolbar içinde LG-only; mobil `⋯` menüsünde de var | Tema **ortak bir header kontrolü** olur; beş stüdyoda en sağda; eski kopyalar kalkar; SSR/hydration `next-themes` durumu korunur |
| Form görünümü taşırken form/PDF zoom karışabilir | PDF toolbar `Sığdır` ile `BelgeStudioFormViewMenu` içindeki `Formu tam sığdır` başka iş yapıyor | **İki bağımsız state ve action** korunur; footer menüsü yukarı açılır; mobil tab geçişi korunur |
| Kapsama sonradan UI eklemek test planını eksik bırakır | Mevcut V2 testleri eski onayları bekliyor; toolbar/footer yerleşim testleri ayrı | Stages ayrılır; UI, davranış ve responsive matrisi ayrı kabul/kanıt; testleri silerek yeşile çevirmek yasak |

## 3. İncelenen kaynaklar, doğrulanan dosyalar ve sınırlamalar

### Doğrulandı — GitHub `main` (24.10.2026)

- Proje: `PROJECT.md`, `AGENTS.md`, `.agents/rules/belgeler-kurallari.md`, `.agents/rules/test-ve-otomasyon-standardi.md`, `package.json`, `package-lock.json`.
- **Taslak motoru:** `src/hooks/use-belge-auto-draft.ts`; `src/lib/belge-draft-storage.ts`; `src/lib/belge-ux-config.ts` (**mevcut debounce 800 ms**, cihaz/sekme v1 anahtarları); `src/components/belge-studio-draft-controls.tsx`.
- **Üst/alt bar:** `src/components/belge-studio-preview-toolbar.tsx`; `src/components/belge-studio-actions.tsx`; `src/components/belge-studio-form-view-menu.tsx`; `src/lib/belge-studio-layout.ts`; `src/app/globals.css`. Şu an üst PDF araç satırı `.belge-preview-controls` içinde; responsive durumlarda farklı dizilim var. Yerelde daha yeni bir **unified header** uygulanmış olabilir; onu temel al.
- **Beş tüketici:** `src/components/taahhutname-studio.tsx`, `beton-dokum-studio.tsx`, `sozlesme-studio.tsx`, `istifa-studio.tsx`, `insaat-ruhsati-studio.tsx`. Beşinde de `Canlı Önizleme Hazır` badge'i, taslak durumu, reset ve clear handler'ları mevcut.
- **Testler:** `tests/belgeler/belge-auto-draft-d02.test.ts`, `belge-draft-controls-d03.test.ts`, `belge-draft-storage.test.ts`; `tests/site-audit/belgeler-auto-draft-*.spec.ts`, `belgeler-draft-final-regressions.spec.ts`, `belgeler-form-view.spec.ts`, `belgeler-mobile-studio.spec.ts`, ilgili PDF field/inline edit testleri.
- `src/components/belge-studio-actions.tsx`: masaüstünde “Boş form indir” footer'da, **Form Görünümü footer'da henüz yok**; mobilde hem Boş form hem Form Görünümü şu an `⋯` içindedir. Yeni mobil tasarım bu nedenle sadece CSS taşıması değil, işlemlerin footer'a **bilinçli erişim değişikliğidir**.

### Varsayımlar

- Taslak yalnız **aynı origin/tarayıcının `localStorage` alanında**, belge kimliğine göre kalıcıdır; başka cihazlar arasında paylaşılmayacaktır. Tarayıcı depolaması silinirse kayıp olabilir. Hassas kişisel bilgiler loglara, URL'ye, analitik olaylara, hata raporlarına veya server'a aktarılmayacaktır.
- “Zoom ortada” ile, zoomun hangi **görünür üst araç satırında** bulunuyorsa *o satırın dış kutusunun geometrik merkezi* kastediliyor. Yerel güncellemeyle zoom ana birleşik üst bara taşındıysa **mevcut birleşik bar** esas alınır; eski remote yerleşime zorla geri dönülmez. Bunun nasıl ölçüleceği aşağıda kesinleştirilmiştir.

### Yerelde doğrulanacak

- `git status --short`, `git rev-parse HEAD`, `git branch --show-current`, yerelde aktif tamamlanmış/yarım kalmış diğer üst-bar veya taslak planları; eski durum dosyaları; `GEMINI.md` ve ilgili yerel ajan talimatları.
- PDF toolbar'ın son yerel konumu, header/footer sınıfları, modal tam ekran davranışı, 5 stüdyo için aynı responsive DOM yolu, mevcut `Form Görünümü` ve `Boş form indir` test seçicileri; kullanıcı tarafından devam eden yerel işlere çakışma.
- `npm run check:belgeler-pdf`, mevcut test scriptleri ve `npm run build`'in yerel çalıştırılabilirliği. Hata kanıtı olmadan başarılı sayılmaz.

### Dış teknik kaynaklar (güncel, resmi)

- Gemini 3.8 Flash, `gemini-3.8-flash`; `low/medium/high` düşünme ayarları: https://ai.google.dev/gemini-api/docs/models/gemini-3.8-flash ; https://ai.google.dev/gemini-api/docs/whats-new-gemini-3.8
- `visibilitychange`/mobil arka plana geçiş: https://developer.mozilla.org/en-US/docs/Web/API/Document/visibilitychange_event
- `storage` olayının diğer sekmelere yayınlanması ve aynı sekmede tetiklenmemesi: https://developer.mozilla.org/en-US/docs/Web/API/Window/storage_event
- `localStorage` cihaz/sekme ayrımı: https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API

**Model sonucu:** Gemini 3.8 Flash resmî model kartında çok adımlı kod işlerine uygun sunuluyor; buna rağmen multi-file değişiklikte kontrol olmadan hatasızlık varsayılmıyor. Her aşama küçük kabul kapılarıyla ayrıldı. `high` mümkünse seçilir, değilse kullanıcı seçtiği model sessizce değiştirilmez.

## 4. Taslak kayıt mimarisinin kesin teknik sözleşmesi

### 4.1 Veri modeli ve durumlar

- Mevcut `BelgeDraftEnvelope` doğrulaması, veri alan sözleşmesi `DOCUMENT_EDITABLE_FIELDS`, sürüm/size limitleri, belge ID ayrımı ve mümkünse `getKeyForMode("device", documentId)` v1 key korunur; yeni, çakışan taslak motoru veya her belge için beş ayrı hook kurulmaz.
- UI için yeterli dar durumlar: `booting`, `idle`, `dirty`, `saving`, `saved`, `save-error`, `conflict`. Eski `consent-pending`, `restore-decision`, `isPaused` durumları artık ana akışın kapısı olamaz. Feature flag sistem içi kill switch olarak kalabilir, kullanıcı toggle'ı olmaz.
- `draftApi` içindeki kullanılmayan eski metotları tüketiciler temizlendikten sonra **tip güvenli şekilde** kaldır; aynı anda tüm public API'yi büyük bir refactor ile kırma.
- `localStorage` yazma ancak JSON zarfı doğrulanıp depoya yazıldığında ve kontrol okuması eşleştiğinde `saved` geçebilir. `savedAt` başarılı commitin zamanıdır. Depolama kapalı, quota, SecurityError, invalid draft durumunda `save-error` ve kullanıcının girişleri formda korunur; gösterge başarı simgesi göstermez.
- UI her tuş vuruşunda bileşenin tümünü yeniden mount etmez. Taslak değişimi PDF yeniden derlemesini ikinci kez tetiklemez; sadece gerçek form verisi PDF'yi günceller.

### 4.2 Debounce, lifecycle ve önceki veri yarışları

```text
formData mutation (gerçek kullanıcı/inline değişikliği)
  → latestValuesRef = yeni veri
  → serializedSnapshot ile son kaydedilenden farklı mı?
     HAYIR → yeni setItem/timer yok
     EVET → eski pending timer'ı cancel + generation++ + dirty
             → 2000 ms sonra güncel ref'i oku
             → eski generation veya farklı remote revision ise yazma / conflict koru
             → write + verify → saved (aksi halde save-error)

Sıfırla / Temizle / Geri al sonrası özel durum:
  → replaceAndPersist(nextValues, reason)
  → pending timer/generation'ı iptal et
  → latestValuesRef = nextValues (setFormData'dan ÖNCE; stale ref kalmasın)
  → undo snapshot'ı doğru yönet
  → setFormData(nextValues)
  → hemen senkron doğrulanmış depolama yazımı (normal 2000 ms debounce bekleme)
  → geç gelen eski React effect/timeout/lock sonucu varsa revision/generation ile geçersiz
```

- `markFormMutated` ile `useEffect(formData)` kendi kendine ikinci kez timer kurarak sonsuz kayıt döngüsü yaratmamalı. Asıl tetikleyici **gerçek snapshot farkı** ve `dirty` olmalı; sadece `lifecycleState`/`view` değişimi timer yenilememeli.
- Aynı metni art arda yazma, odağı değiştirme, PDF zoom, form compact mod, tema, akordeon durumları taslak yazımını tetiklemez.
- `pagehide`/`visibilitychange(hidden)`/SPA unmount sırasında **best-effort** son senkron kayıt gerçekleştirilir; bu, kullanıcı sayfadan ayrılırken 2 saniyeyi beklememek için istisnadır. Normal focus/blur olayında erken flush yapılmaz. iOS uygulama değişimi ve sekmeyi kapatma her zaman garanti edilemez; “asla veri kaybı olmaz” iddiası kurma.
- **Önemli:** Gecikmesiz destructive işlem için sadece async `navigator.locks` kuyruğuna güvenerek `Kaydedildi` demek yok; çağrı event handler içinde doğru snapshot'ı senkron persist edebildiğini ispatla veya açıkça kaydetme tamamlanmasını bekleyen durumu göster. Kullanıcı reset/clear sonrası anında reload yaparsa eski taslak geri gelmemeli. Bu koşul tasarım kapısıdır.
- `setFormData` işlevinin yalnız `useEffect` sonrasında snapshot'a dönüşmesini bekleme; aynı event içinde ref doğru değerle güncellenmeli. Strict Mode mount/cleanup/yeniden mount ve ilk boot sırasında kullanıcı yazma koşulları test edilmeli.

### 4.3 İlk yükleme, eski taslak ve migrasyon

1. İlk load'da öncelik **geçerli cihaz taslağı**; yoksa geçerli legacy `sessionStorage` taslağını kontrollü, içerik korunarak `device`'a taşı. Onay anahtarındaki `dismissed` vb. kararlar **artık kayıt kapısı değil**. Birden fazla farklı kaydı revizyon sayısı/tarih üzerinden sessizce birleştirme.
2. Geçerli cihaz + farklı session taslağı aynı anda varsa **cihaz taslağını olduğu gibi koru**, session kayıtlarını topluca silme; gerekirse kurtarma nüshası için ayrı belgeye özgü güvenli key kullan ve kullanıcıya yalnız istisnai, engellemeyen küçük bilgi ver. Birden fazla kullanılabilir kayıtla belirsizlik varsa **eski veriyi sessizce ezme**; kullanıcı eylemi gerektiren durum yalnız bu olağanüstü çakışma için sınırlı olabilir, normal izin/onay menüsü geri gelmez.
3. Bozuk/gelecek şema/invalid JSON/savedAt anormalliği: ham veriyi değiştirme; başka biçimde sessiz overwrite yapılmasın. Görünür hata ve ileride kurtarma için yeterli bilgi korunur. `localStorage.clear()` **kesinlikle kullanılmaz**.
4. İlk `formData` default state'inden depoya kayıt ancak bootstrap tamamlanıp geçerli taslak geri yüklendikten sonra mümkün; React StrictMode/ilk tuşlama yarışında kullanıcı son yazısı kaybolmaz.
5. Taslaklar belge ID'leri arasında asla sızmaz. Farklı tarayıcı profillerinde otomatik eşitleme iddia edilmez.

### 4.4 Birden çok sekme

- `storage` event + varsa `BroadcastChannel` yalnız **kendi belge ID'si** için dinlenir; kendi sekmesinde storage event beklenmez. Mevcut Web Locks mantığı korunur/iyileştirilir; destek olmayan tarayıcıda write öncesi compare + revision guard yapılır. Tam atomiklik garantisi olmayan fallback belgelendirilir.
- Başka sekme **aynı belgeyi** güncellediğinde mevcut sekme temizse yeni veriyi alabilir; mevcut sekme **dirty** ise sessiz overwrite yapılmaz: kullanıcının yerel değişikliği kurtarma snapshot'ında korunur, `Çakışma` / `Kaydedilemedi` gibi küçük durum ve isteğe bağlı çözüm sunulur. **Diyalog/confirm açılmaz.**
- Eski bir sekme `Temizle` veya `Sıfırla` sonrasında `visibilitychange`/unmount yapıp önceden tuttuğu değerlerle daha yeni taslağı ezemez. Başka sekme yeni veriyi yazdığı takdirde UI ve storage revizyonu uyuşmadan `saved` olamaz.
- Şema kurtarma anahtarı sınırsız büyümesin; kullanıcı verisi açıkça korunarak ve sınırlandırılmış bir stratejiyle yönetilsin. Rastgele taslak silerek quota çözme yok.

### 4.5 UX durum göstergesi

| Koşul | Görünür | ARIA ve işleyiş |
|---|---|---|
| Taslak boot ediliyor, hiç kayıt yok | Yüksekliği/başlığı itmeyen boş/nötr alan | “Taslak hazırlanıyor” gerekirse yalnız ekran okuyucu |
| Form değişti ve 2 sn sayaç çalışıyor | Sade nötr ikon veya `Kaydediliyor…` | Gürültülü sürekli anons yok |
| Yazma gerçekten başarıyla doğrulandı | `✓ Kaydedildi` | Debounce sonrasında tek `role=status` anonsu, yazılan veriyi okumaz |
| Depolama reddetti/doldu | `! Kaydedilemedi` | Kısa açıklama + gerekiyorsa küçük `Tekrar dene` eylemi; dropdown yok |
| Çift sekme revizyon çakıştı | `! Çakışma` | İstisnai ve engellemeyen kurtarma/çözüm; varsayılan izin akışı yok |

Aynı başarı yazısını 2 saniyede bir yeniden duyurup ekran okuyucuyu rahatsız etme. Hareket/transition `prefers-reduced-motion` ile uyumlu. Kullanıcıya taslakların **yalnız bu tarayıcıda** olduğu, tooltip veya erişilebilir kısa açıklama aracılığıyla belirtilir; formun T.C./adres verisi toast, analytics, URL, session log veya hata raporuna asla eklenmez.

## 5. Birleşik header / toolbar / footer mimarisi

### 5.1 Mevcut sorumluluk dağılımı

- `*-studio.tsx`: mevcut belge başlığı ve taslak göstergesi; beşinde de `Canlı Önizleme Hazır` görünür. Değişiklikler burada tekrarlanmamalı; uygun ortak header alt bileşeni çıkarılabilir, ama **tam layout refactor'ü yapılmaz**.
- `belge-studio-preview-toolbar.tsx`: PDF sayfa, zoom, sığdır, yeni sekme, PDF odak; mevcut LG form görünümü ve tema buradan kaldırılır.
- `belge-studio-actions.tsx`: footer masaüstü eylemler ve mobil `⋯`; form görünümü ile boş form indirme birbirine bitişik taşınır; mobil `Formu Düzenle`/`PDF Önizle` korunur.
- `belge-studio-form-view-menu.tsx`: asıl Form Görünümü seçenekleri tek kaynak olarak kalır; `side="top"`, `align` ve collision boundary gerekirse parametreleştirilir. Menüdeki **`Varsayılana dön`** yalnız form görünümünü sıfırlar, **belge alanlarının `Sıfırla` işlevine dönüşmez**.
- `src/app/globals.css` ve `src/lib/belge-studio-layout.ts`: mevcut container query ve layout contract'a **hedefli** değişiklik; global navbar/PDF viewer'a sızan CSS yazma.

### 5.2 Header düzeni

- En solda başlık/kısa ad; merkezde yer kaplayan/uzun tanıtıcı alt başlığı mobilde gizle, masaüstünde yalnız yer varsa göster. Durum göstergesi başlığı taşırmamalı; `min-w-0`, `truncate`, kısıtlı genişlik, sabit ikonlar kullan.
- Sağ blokta sırayla durum / gerçekten derleniyorsa kısa süreç göstergesi / varsa modal X / **en sonda TEMA SWITCH**. CSS `order` ile yanlış semantik klavye dizisi üretme; DOM sırası da görsel sırayla uyumlu olsun.
- Tema `useTheme` ile değişir; SSR hydration sonrası doğru `aria-checked`/ikona geçer; tek reusable `BelgeStudioThemeToggle` veya benzeri, **üst header'da 5/5**. Eski toolbar `belge-theme-toggle` ve mobil `⋯` içindeki ikincil tema eylemi kaldırılır. Test ID taşınıyorsa testleri yeni tek kaynağa güncelle.
- Mobil header 320px, 390px, 430px, modal ve normal sayfada en az 44px tıklama alanı, yüksek kontrast, focus ring, safe-area; tema en sağdaki son odaklanabilir eleman. Modalde kapatma X'i temanın solunda fakat eşit erişilebilir.
- `Canlı Önizleme Hazır` rozet DOM'dan, CSS'inden ve koşullu render'ından kalkar; gereksiz pulse da kalkar. PDF `syncStatus`/ready hata sinyali kaldırılmaz, gerçek `updating` geçici durum korunabilir. Ekran okuyucu etiketleri gerçek PDF durumunu açıklamaya devam eder.

### 5.3 Zoom geometrik merkezi — kritik, tahmine değil ölçüme dayalı

- Orta grup **yalnız** uzaklaştır (`−`), mevcut yüzde (`%100`) ve yakınlaştır (`+`). `Sığdır` ve yeni sekme gibi yardımcı eylemleri grup DIŞINA, sağ araç bölmesine taşı. Sayfa navigasyonu sola; PDF odak ve diğer eylemler sağa; tema header en sağında ayrı.
- Gösterilen/çalışan araç satırının `getBoundingClientRect()` yatay merkezi ile `.belge-preview-zoom` merkezinin farkı, yeterli genişlikte ve responsive **normal görünümde en fazla ±2 CSS px** olsun. Zoomun merkezi PDF sayfasının görünür içeriğinden, sol formun varlığından veya sağ kontrol sayısından keyfî etkilenmesin: üst şerit nerede render ediliyorsa o şerit referanstır.
- Öncelik **CSS Grid: `minmax(0,1fr) max-content minmax(0,1fr)`** veya eşdeğer gerçek simetrik track; gerektiğinde mutlak merkezli group + sol/sağ için ayrılmış collision-safe alan. **Salt `justify-between`, sabit margin-left, dummy spacer, görsel gözüyle merkezleme kabul değil.**
- Dar/multipage durumlarında mevcut `.belge-preview-controls[data-multipage]` flex yerleşimi merkezi bozuyorsa uyumlu responsive yeniden düzenle. 320px'te sayfa numarasını daha kompakt yap, `Sığdır`/Yeni sekme/odak gibi ikincilleri `⋯` içine al; **zoom − ve + hedeflerini kaldırma**; yüzde metni mümkünse göster. Aşırı alan sıkışmasında kullanıcıya görünen ikinci satır oluşması **son çare**; kalıcı yüksek toolbar getirme.
- PDF zoom yalnız canlı PDF görüntüsünü etkiler; sayfa genelini, formu, header'ı büyütmez. Form Görünümü menüsündeki zoom form alanları içindir. `fit` de ayrı: PDF sığdır / formu sığdır.
- İleri/geri sayfa, klavye kısayolları, mevcut max/min zoom sınırları ve disable davranışı çalışır.

### 5.4 En alt bar — Form Görünümü hemen Boş form indir'in solunda

**Masaüstü (LG ve üzeri, uygun genişlik):** Alt barın eylem grubuna `BelgeStudioFormViewMenu` düğmesini ekle ve sıra **`[Form Görünümü] [Boş form indir] [Yazdır] [Paylaş] [PDF İndir]`** olsun. Sol reset/clear/undo ayrımı korunsun. Menü yukarı doğru açılır ve viewport clipping yapmaz. Arada ikon/separator/başka düğme **yok**.

**Mobil/tablet (`<1024 px`):** En alt barın doğrudan görülen tek satırında `⋯`, **`[Form Görünümü simgesi] [Boş form indir simgesi]`**, mevcut önemli `Formu Düzenle / PDF Önizle` geçişi ve PDF indir bulunur. İki komşu simge **44×44 px** minimum tap hedefi ve sırasıyla `aria-label="Form görünüm seçenekleri"`, `aria-label="Boş form indir"` taşır; ikon-only olsa da tooltip/erişilebilir ad tamdır. Boş form indirme sırasında çift tıklama engeli ve loading korunur. `⋯` paneli ilgili ikincil işlemleri taşır, ama form görünümü için menü içinde ikinci, şaşırtıcı paralel kontrol tutulmaz.

- Mobil `Form Görünümü` kontrolü açtığında popover **yukarı** açılır; `side="top"`, collision flip/shift, en fazla viewport-safe yükseklik, içerik gerektiğinde dikey kaydırılabilir; cihaz alt home indicator'ın arkasına düşmez. Alt bar popover'ı tüm ekranı kapatan yeni drawer hâline getirme.
- Mobil `Formu Düzenle` düğmesinin mevcut hafif ışıklı görünürlüğü ve PDF → Form geçişi korunur. `Form Görünümü` ikonunun tıklanması tab değiştirmez ve PDF'deki zoom'u değiştirmez; yalnız form ölçeği/kompakt/sığdır ayarını değiştirir.
- Form ayarları mobilde gizli form paneline uygulanıyorsa, o panel yeniden açıldığında ayar hâlâ etkilidir; `onFit` ölçümü yanlış/0 genişlikte yapılmamalıdır. Gizli form panelinden ölçüm almak gerekiyorsa kullanıcı paneli gösterdiğinde yeniden ölç veya ölçümü geçerli layout'tan yap; `Formu Düzenle` fokus kaybetmesin.
- Mobil alt bar tek satır, 320/360/375/390/430/768/1023px boyunca **yatay taşma sıfır**, 44px minimum hitbox; çok dar ekran için öncelik `⋯`, iki ikon, tab toggle, PDF indir. Mevcut ayrı hızlı **Paylaş** ikonu gerekiyorsa kaldırılıp `⋯` içinde kalır; paylaşım fonksiyonu hiçbir şekilde silinmez.
- Masaüstü/footer `flex-wrap` yüzünden Form Görünümü ile Boş form farklı satırlara düşemez; gerekiyorsa iki kontrol `inline-flex`/no-wrap alt grubuna alınır. PDF indir en güçlü CTA kalır; yatay scrollbar eklenmez.

## 6. Aşama özeti

| Aşama | Teslim edilecek somut sonuç | Ara yayın |
|---|---|---|
| `ASAMA_01` | Yerel baseline ve kod/çatışma/gerçek üst bar konumu teyidi, plan/durum kaydı | Yok |
| `ASAMA_02` | Onaysız 2000 ms otomatik taslak + güvenli restore/legacy/çoklu sekme ve hata sistemi | Yok |
| `ASAMA_03` | 5/5 stüdyoda onaysız Sıfırla/Temizle + gecikmesiz persist + undo | Yok |
| `ASAMA_04` | 5/5 sade header: `Kaydedildi`, hazır rozeti yok, tema en sağda | Yok |
| `ASAMA_05` | Tam ortalanmış zoom; Form Görünümü footer'da Boş form indir'in hemen solunda, responsive/mobil | Yok |
| `ASAMA_06` | Tüm data/UI/integration testleri, mobil/web/tema/klavye ve hata düzeltme | Yok |
| `ASAMA_07` | Son review/build, tek release, Production smoke, `TAMAMLANDI` | **Tek final** |

## 7. Ayrıntılı uygulama aşamaları

### ASAMA_01 — Yerel gerçekliği doğrula ve baseline oluştur

**Giriş:** Yerel Windows proje klasörü erişilebilir; varsa eski V2 durum dosyası önce okunur.  
**Kapsam:** Repo talimatları, mevcut beş stüdyo, hook/storage/UI/footer/toolbar/testler, plan/durum dosyaları.  
**Sıra:**
1. `PROJECT.md → AGENTS.md → GEMINI.md → .agents/rules/belgeler-kurallari.md → .agents/rules/test-ve-otomasyon-standardi.md`; görevle ilgili alt dizin kuralları ve gerekiyorsa `.agents/rules/vercel-kurallari.md` oku.
2. `git status --short`, `git rev-parse HEAD`, `git branch --show-current` ve aktif devam eden yerel çalışmaların farklılıklarını kaydet; hiçbir kullanıcı dosyasını silme, overwrite etme, otomatik pull yapma.
3. Canlı ekran/yerel kod üzerinden şu an zoomun gerçekten hangi üst satırda olduğunu, tema anahtarının yerini, footer'daki Form Görünümü/Boş form kontrolünü, modal/normal ekran farkını, beş dokümanı doğrula. Yeni yerel unified header implementasyonu varsa onu geriye çevirme; bu belgedeki **geometrik/konumsal** sonuçları o yerleşimde uygula.
4. Eski taslağın normal restore, onay, pending timer, sıfırla, temizle, mobil form toggle ve PDF zoom davranışının kısa baseline'ını sadece sentetik veriyle incele. Güncel test komutlarını `package.json`'dan kontrol et.
5. Yeni kalıcı plan: `docs/belgeler-minimal-taslak-ui-v3/PLAN.md` (bu metnin birebir kopyası); yanında `IMPLEMENTATION_STATE.md`. Başka görevin planına/durumuna dokunma.

**Doğrulama/kabul:** Gerçek HEAD, kirli dosyalar, mevcut üst/alt bar sahibi, 5 stüdyodaki hook'lar ve çalışır test komutları belgelenmiş.  
**Hata/geri dönüş:** Erişim yoksa engeli yaz; mevcut çalışmaları sıfırlama. Kaynak değişmişse yalnız etkilenen bölümün uygulamasını uyarlayıp V3 sözleşmesini koru.  
**Dur:** Çok kısa rapor + durum güncellemesi; `devam` bekle.

### ASAMA_02 — Taslak motorunu onaysız ve güvenli hâle getir

**Giriş:** `ASAMA_01` tamam.  
**Dosyalar:** `src/lib/belge-ux-config.ts`, `src/hooks/use-belge-auto-draft.ts`, yalnız gerekiyorsa `src/lib/belge-draft-storage.ts`, dar hook/storage testleri.  
**Sıra:**
1. `AUTOSAVE_DEBOUNCE_MS = 2000`. Yeni state machine'e geç; kayıt iznini kapalı bırakan `consent` koşullarını normal kayıttan çıkar. Eski `dismissed` tercihi, kayıt davranışını engellemesin.
2. `latestValuesRef`, snapshot farkı, timer generation, unmount flush ve storage read-back bütünlüğünü kur. `dirty → saving → saved` geçişlerini gerçek yazmaya bağla; effect dependencies yalnız `view` değiştiği için timer yeniden kurulmasın.
3. Geçerli cihaz taslağını sorusuz hydrate et. Yalnız cihaz taslağı yoksa legacy session snapshot'ını doğrulayıp zarar vermeden taşı. İki farklı taslağı tarihe göre kaybettirerek seçme; kurtarma veri akışını tanımla.
4. Çift sekmede storage/BroadcastChannel/WebLock ve fallback çakışma korumasını sağla; dirty forma dışarıdan overwrite yapma. Bozuk storage/quota hallerini doğru kullanıcı sinyaline çevir.
5. Destructive işlemler için paylaşılacak `replaceAndPersist(nextValues, reason)` veya eşdeğer **tek hook API'sı** tanımla; asıl UI bağlantısı bir sonraki aşamada. `pagehide`/`visibilitychange`/SPA dönüş senaryosu için best-effort flush koru.

**Doğrulama:** Var olan depolama/hook testleri + hedefli yeni senaryolar: 1999ms'de yazı yok, 2000ms'de tek doğru yazı; kesintisiz yazma; yeniden mount/StrictMode; eski dismissed; hata; çakışma; otomatik restore; farklı belge izolasyonu.  
**Kabul:** Hiç izin prompt'u gerekmiyor, `saved` gerçek yazmayı gösteriyor, geçerli eski taslaklar kaybolmuyor, eski timeout sonradan yazamıyor.  
**Hata/geri dönüş:** Uydurma migration, toplu `localStorage.clear()` veya şemayı kıran refactor yok; yalnız motoru düzelt.  
**Dur:** Durum dosyası + kısa rapor; bekle.

### ASAMA_03 — Sıfırla/Temizle onaysız, anında ve geri alınabilir

**Giriş:** `ASAMA_02` tamam.  
**Dosyalar:** 5 `src/components/*-studio.tsx` + ilgili form/undo testleri.  
**Sıra:**
1. Beş stüdyodaki **yalnız global `Sıfırla` ve `Temizle`** `window.confirm` bloklarını kaldır. Diğer `window.confirm`/uyarıları isteğe aykırı biçimde kaldırma.
2. Bu iki handler'ı ortak güvenli `replaceAndPersist` ile bağla. Reset -> belgenin **kendi** PDF default verisi; clear -> yalnız `DOCUMENT_EDITABLE_FIELDS` alanları boşalır, form-only/PDF-only sözleşmeleri ve gerekli veri türleri bozulmaz.
3. Önceki snapshot'ı `undoData`'da tut; Geri al -> doğru eski formu geri getirir ve yeni durumu yeniden taslağa kaydeder. Art arda reset/clear/undo bekleyen timer'ı veya eski state'i geri getiremez.
4. Mobil menüden ve masaüstü alt bardan yapılan reset/clear davranışı aynı olmalı. Inline PDF alanı/sol form senkronu kaybolmamalı.

**Doğrulama:** Her 5 belge için confirm yakalayan test spy 0 çağrı; reset/clear sonrası form/PDF doğru; 2 sn dolmadan reset ve anında reload; clear ve anında reload; reset→undo; clear→undo; hızlı ardışık reset/clear ve çoklu sekme çatışması.  
**Kabul:** Görünür onay yok ve eski bilgiler yeniden açılışta geri gelmiyor; Geri al çalışıyor; korunan diğer işlemler aynı.  
**Hata/geri dönüş:** Her belge için farklı varsayılanın yanlış kullanımı varsa doğru veri profilinde düzelt, PDF motoruna dokunma.  
**Dur:** Kısa rapor ve durum; bekle.

### ASAMA_04 — Sade başlık ve tek tema anahtarı

**Giriş:** `ASAMA_03` tamam.  
**Dosyalar:** `src/components/belge-studio-draft-controls.tsx`, 5 stüdyo header'ı, `src/components/belge-studio-preview-toolbar.tsx`, `src/components/belge-studio-actions.tsx`; gerekirse küçük ortak `BelgeStudioThemeToggle`.  
**Sıra:**
1. Taslak izin/geri yükleme normal banner'ları ve `Taslak (Cihaz)` menüsünü kaldır; yalnız minimal `✓ Kaydedildi`, hata/çakışma durumunu kullan. Eksik olursa `retry` yalnız hata halinde ve erişilebilir.
2. Beş header'dan **tüm** `Canlı Önizleme Hazır` yazısı/yeşil pulse rozetini çıkar; `syncStatus=updating` için erişilebilir yükleme bilgisi korunabilir. PDF hazır olma state'ini gerçek motor içerisinde yok etme.
3. Tema switchini toolbar'dan ve mobil `⋯` menüsünden alarak **beş header'ın sağ sonuna** koy. Tek ortak toggle/SSR-safe `next-themes` akışı kullan; `dark/light` anında uygulanır.
4. Modal `X` tema switchinin **solunda**; title ve taslak minimal durum header'da taşmadan yan yana veya güvenli kısalarak görünür. Klavye focus sırası DOM ile aynı; 44px hit target.
5. Akordeon/form alanı/PDF tab/studio modal/normal page layout'unu gereksiz yeniden tasarlama.

**Doğrulama:** `Canlı Önizleme Hazır` görünür DOM'da yok; normal taslak popover yok; tüm stüdyolarda tek tema kontrolü header'ın en sağında; light/dark ve modal kapanışı çalışıyor; 320/390/1366/1920 px ekran görüntüleri/testleri.  
**Kabul:** 5/5 aynı minimal header; tema switchi ekranın en sağdaki header kontrolü, yatay taşma sıfır.  
**Hata/geri dönüş:** Başlık dar kalırsa başlığı sıkıştır/gizli alt başlık; **Kaydedildi** veya tema kontrolünü yok etme.  
**Dur:** Kısa rapor, durum; bekle.

### ASAMA_05 — Zoom tam merkez, Form Görünümü footer'a

**Giriş:** `ASAMA_04` tamam.  
**Dosyalar:** `belge-studio-preview-toolbar.tsx`, `belge-studio-actions.tsx`, `belge-studio-form-view-menu.tsx`, `belge-studio-layout.ts`, `src/app/globals.css`, gerekirse ilgili 5 tüketicinin prop aktarımı.  
**Sıra:**
1. `− % +` zoom grubunu yalnız PDF zoom eylemlerinden oluştur; `Sığdır` ve yeni sekme gibi diğer kontrolleri kendi sağ araç grubuna taşı. Mevcut page nav sol, pdfFocus korunan sağ kontrol olsun. Tema/form görünümü **artık preview toolbar'da olmamalı**.
2. Üst araç satırını gerçekten merkezleyen 3 kolonlu/responsive yerleşimi kur; mevcut `.belge-preview-controls[data-multipage]` mobil flex ve desktop dar `@container` düzenlerinin merkezi bozduğu kolları düzelt. Overflow olursa ikincil eylemleri mevcut More menüsüne al; zoom merkezden kaçmasın.
3. `BelgeStudioFormViewMenu` ana popover'ını footer'dan `side="top"` açılabilir kıl; `formView` prop'unu `BelgeStudioActions` üzerinden 5 tüketicide doğrula. PDF zoom state'i ve form görünüm state'i ayrı kalsın.
4. Masaüstü eylem sırası **Form Görünümü → Boş form indir → Yazdır → Paylaş → PDF İndir**. Bu ilk iki düğme aynı satırda yan yana, araya başka düğme girmiyor.
5. Mobil alt bar **`⋯ | Form görünümü ikonu | Boş form indir ikonu | Formu Düzenle/PDF Önizle | PDF İndir`**. İki ikon görünür ve 44px; eski nested Form Görünümü alt menü tekrar edilmez; gerekirse hızlı paylaşım ikonu kaldırılır ama `⋯` içindeki paylaşım saklanır. Düğmelerde `type="button"`, doğru aria-label, disabled ve double-click koruması.
6. 320/360/375/390/430/768/1023/1024/1366/1920, dar laptop, çok sayfalı belge, light/dark, 125/150% browser zoom, 844×390 landscape, iOS safe-area/Android klavye açık davranışını denetle.

**Doğrulama:** Zoom gerçek DOM geometrisi: `Math.abs(zoom.centerX - toolbar.centerX) <= 2` CSS px; özellikle çok sayfalı mobilde. Form Görünümü doğrudan footer'da, Boş form indir'in hemen solunda, aynı satırda. Form sığdır PDF sığdır'ı değiştirmiyor. Popover yukarı açılıyor, viewport dışına çıkmıyor; Formu Düzenle/PDF Önizle hâlâ çalışıyor.  
**Kabul:** 5/5 stüdyo, mobil/masaüstü, modal/normal görünümde doğru sıra, tam merkez ve kullanıcıya görünür, taşmayan controls.  
**Hata/geri dönüş:** 320 px'te yanlış genişlik varsa önce yazıyı ikona indir/sıkıştır ve ikincil quick share'i menüye taşı; kontrolü saklama veya yatay scroll ekleme.  
**Dur:** Kısa rapor, durum; bekle.

### ASAMA_06 — Entegrasyon, adversarial senaryolar ve görsel kalite kapısı

**Giriş:** `ASAMA_05` tamam.  
**Dosyalar:** Mevcut `tests/belgeler/*draft*`, `tests/site-audit/belgeler-auto-draft-*`, `belgeler-draft-final-regressions`, `belgeler-form-view`, `belgeler-mobile-studio`, ilgili toolbar/zoom/inline testleri; yalnız gerektiğinde dar yeni test.  
**Sıra:**
1. Eski `taslak kapalı/onay gerekir`, `sıfırlama confirm iptalinde işlem yapmaz`, `tema yalnız PDF toolbar`, `Form Görünümü üst toolbar'da` beklentilerini **yeni ürün sözleşmesine göre yeniden yaz**. Testleri kapatmak/silmek/skip etmek yok; gerçek davranışı assertion ile ölç.
2. Kaydetme zaman testi: 0/1000/1999/2000/2500ms; hızlı yazma; aynı değer; Türkçe karakter; uzun adres; PDF inline sheet; navigation; anında reload; `pagehide`, `visibilitychange`, Strict Mode ve çift sekme; invalid JSON/quota/blocked storage; her belge ID izolasyonu. `✓ Kaydedildi` false positive testi zorunlu.
3. Reset/clear öncesi pending timer, geri al, başka sekmenin eski draftı, paylaşılan PDF view URL, form/PDF zoom ayrımı, yeni sekme/yazdır/indir/paylaş işlevlerinin bozulmadığını doğrula.
4. UI matrisi: **320, 360, 375, 390, 430, 768, 1023, 1024, 1366, 1920 px**; en az 320/390/768/1024/1366/1920 için dark+light ve seçilmiş beş belge; ayrıca modal/normal, iki sayfalı, landscape, klavye açık, PDF odak modu, 125/150% tarayıcı zoom. 44px hit target, safe-area, yatay scroll yok, footer görünür, header tema son sırada, zoom merkez ölçümü, form popup yukarı ve collision-safe.
5. Accessibility: klavye tab/shift-tab, Enter/Space, Escape ile popover kapanması ve odağın trigger'a dönmesi; `role=status` spam yok; ikona `aria-label`; `prefers-reduced-motion`; tema kontrastı; 320'de odak halkası kırpılmıyor.
6. Reflow ve performans: zoom sırasında PDF harici tüm layout büyümüyor; yazı yazarken gereksiz re-render/compile/timer kalmıyor; scroll konumu bozulmuyor; React hydration warning, console error, failed request yok. Ekran görüntülerini *kanıt* için seçerek al, devasa rapor üretme.
7. Önce hedefli `npx tsx --test ...` veya repo scripti (yerelde gerçekten mevcutsa); ardından kapsamla ilgili lint, `npx tsc --noEmit --incremental false` (repo doğru tsconfig'ini kullan), `npm run check:belgeler-pdf` ve son `npm run build`. Playwright mevcut `playwright.site.config.ts` projesiyle seçili ilgili testleri çalıştır. **Her test ortamı/test sonucu kanıtlı; exit code tek başına yeterli değil.**
8. `.agents/rules/test-ve-otomasyon-standardi.md` uyarınca tahminî selector yok, `finally` ile browser/process cleanup, makul timeout; kullanıcının çalıştırdığı başka süreçleri sonlandırma. Hata görünürse bu aşamada düzelt ve yalnız ilgili regresyonları yeniden çalıştır.

**Doğrulama/kabul:** Veri kaybı yok; 5/5 belge; tek tema switch, eski badge yok, footer doğru, ölçülmüş zoom, reflow/overflow 0, ilgili test/typecheck/build temiz. “Çalıştırılmadı” hiçbir zaman “geçti” olarak yazılmaz.  
**Hata/geri dönüş:** Çözülemeyen zorunlu kabul `ENGELLI` olarak kaydedilir; publish'e geçilmez; sahte screenshot/sonuç üretme.  
**Dur:** Kısa test özeti + mevcut blocker; bekle.

### ASAMA_07 — Final kontrol, tek Production release, canlı smoke

**Giriş:** `ASAMA_06` bütün zorunlu kapıları geçti; temiz doğrulama kanıtı var.  
**Sıra:**
1. `git diff`, `git status` ve durum kaydında kapsam dışı değişiklik/boş test bypass/kalıcı debug log olmadığını kontrol et. Gerekli son kod düzeltmelerinden sonra etkilenmiş testleri yeniden doğrula. `docs/BELGELER_SISTEMI.md` içindeki yaşayan taslak ve UI anlatımı gerekiyorsa kısa güncelle.
2. Yerel geliştirme için `AGENTS.md` ve repo release politikasına göre yalnız **doğrulanmış iş dosyalarını** kapsayan **tek anlamlı atomik checkpoint commit → `main` push**; kullanıcıya ait ilgisiz kirli dosyalar staging'e alınmaz. Geliştirme aşamalarında ayrı push/Preview/CI kuyrukları oluşturma.
3. Vercel'in bu release için **Production Ready** sonucunu gerçekten gözlemle; gereksiz tekrar deploy, noop commit, sonsuz bekleme komutu yok. README veya mesaj üzerinden “yayına çıktı” varsayımı yapma.
4. Canlı adreste **sentetik, kişisel bilgi içermeyen test verisiyle** en az iki belge stüdyosu ve 320/390 + 1366px kontrolü: yaz → 2sn kaydet → reload; reset/clear no prompt ve reload; zoom merkez; tema üst sağ; `Canlı Önizleme Hazır` yok; Footer `Form Görünümü | Boş form indir`; PDF indir/önizle/form tab doğru. Kullanıcının var olan tarayıcı profilindeki gerçek taslaklara dokunmadan ayrı test context'i kullan.
5. **Durum/release sırası:** Son commit öncesi durum dosyasına `ASAMA_07: DEVAM_EDIYOR` ve yerel test kanıtını yaz, bunu ilk ve tek release checkpoint'ine kat. Production smoke gerçekten geçtikten **sonra yerel durum dosyasını** `execution_status: TAMAMLANDI`, `active_stage: null`, `next_stage: null`, release SHA ve gözlemlenmiş Production URL olacak şekilde tamamla; bu son yerel durum değişikliği için **ikinci bir push/deploy oluşturma**. Yeni oturumda kullanıcı yerel state dosyasını kullanır. Hata varsa `ENGELLI`; sahte tamamlandı yok.

**Kabul:** Bütün özellikler hem yerelde hem Production'da görünür çalışıyor, release tekil ve kanıtlı.  
**Hata/geri dönüş:** Vercel build/smoke hatasında sebebi ayır ve güvenli çözümü seç; tekrarlı push yapma. Gerekirse önceki doğrulanmış sürüme dönüş repo politikasına göre, veri kaybı yaratmadan.  
**Dur:** “Tamamlandı — ne değişti — test — yayın” tek kısa rapor; `devam` gelirse **yeni iş yapma**.

## 8. Nihai kabul matrisi (kırmızı çizgiler)

| Kimlik | Başarı ölçütü |
|---|---|
| T-01 | Yazarken kullanıcıdan taslak izni/geri yükleme sorulmuyor; tüm beş stüdyo varsayılan otomatik açık |
| T-02 | Son tuştan 1999 ms önce normal kayıt yok; 2000 ms sonra son doğru snapshot depoda; art arda tuşta timer reset |
| T-03 | Kaydedildi yalnız doğrulanmış yazmada; quota/blocked/invalid/çakışma durumunda başarı yalanı yok |
| T-04 | İlk reload geçerli taslağı sessiz restore; ilk hydration/yazı ve React StrictMode yarışında son değer korunuyor |
| T-05 | Sıfırla/Temizle global onay popup'ı sıfır; form/PDF + geri al tutarlı; hemen reload boş/default sonucu koruyor |
| T-06 | Eski geçerli taslaklar/migrasyon bozulmuyor; farklı 5 belge ve iki sekme arasında sessiz overwrite yok |
| U-01 | `Canlı Önizleme Hazır` yazısı ve yeşil puls badge yok; gerçek PDF loading/error bilgi akışı bozulmadı |
| U-02 | Üst barda minimalist `✓ Kaydedildi`; normal draft dropdown yok; mobil header sıkışmıyor |
| U-03 | Tema switchi üst barın **en sağ son kontrolü**, hem mobil hem desktop; modal X solunda |
| U-04 | Zoom (`− % +`) grubu, bulunduğu araç satırının ölçülmüş merkezinde **±2 CSS px**; tek/çok sayfalı ve responsive |
| U-05 | Footer'da **Form Görünümü**, **Boş form indir** ile bitişik ve doğrudan **solunda**; masaüstünde etiket, mobilde iki 44px ikon |
| U-06 | Mobil `Formu Düzenle / PDF Önizle` geçiş düğmesi/görünürlüğü korunuyor; PDF İndir ana CTA; diğer işlemler erişilebilir |
| U-07 | Form Görünümü yukarı açılıyor, menü viewport dışına çıkmıyor; form fit ≠ PDF fit; klavye/ARIA/tema temiz |
| U-08 | 320–1920px matrisi; dark/light; modal/normal; landscape/keyboard/safe-area; yatay scroll ve footer taşması yok |
| R-01 | Testler gerçekten çalıştırıldı; eski beklentiler düzgün güncellendi; hedefli TS/lint/PDF/build ve Playwright kanıtlı |
| R-02 | Ara deploy yok, tek kontrollü final release, canlı smoke başarılı; durum `TAMAMLANDI` |

## 9. Süreklilik, ilerleme ve “devam” protokolü

Ajan ilk aşamada şu dosyaları **mevcut başka işin dosyasına dokunmadan** yerelde oluştursun:

- `docs/belgeler-minimal-taslak-ui-v3/PLAN.md` — bu planın tam metni.
- `docs/belgeler-minimal-taslak-ui-v3/IMPLEMENTATION_STATE.md` — geçerli ilerleme ve kabul kanıtı.

İlk durum içeriği:

```yaml
plan_id: BELGELER_AUTO_DRAFT_UNIFIED_UI_V3
plan_revision: 2
planning_status: PLAN_HAZIR
execution_status: BASLAMADI
active_stage: null
next_stage: ASAMA_01
completed_stages: []
evidence: []
blockers: []
updated_at: "2026-10-24T17:50:00+03:00"
```

**Talimat:** Planı yüklemek otomatik kodlama demek değil. İlk `başla` veya `devam` yalnız ilk tamamlanmamış aşamayı başlatır. Her sonraki `devam` en fazla **bir** aşamayı yürütür; yarım aşama varsa onu bitirir. Gereksiz her adımda onay isteme; aşama içindeki kontrolleri tamamla ve dur. Aşama bitince değişen dosyalar + çalıştırılan test/kanıt + kısa rapor + bir sonraki aşama yazılır, kullanıcıdan yeni mesaj beklenir. Başarısız zorunlu test `ENGELLI` olur, bağımlı aşamaya geçilmez. Yeni oturumda plan/durum okunur, tamamlanan işler tekrar yapılmaz. Yerel dosyalar ve diğer ajan çalışmaları korunur.

**Kesin bitiş:** `execution_status: TAMAMLANDI` iken yalnız “devam” mesajı gelirse **“Plan tamamlandı; uygulanacak başka aşama yok.”** denir; herhangi bir kod, test, build, commit, push, deploy, temizlik veya yeni aşama icat edilmez. Yeni özellik veya özel kontrol ancak kullanıcının açık yeni isteği ile yürütülür.

## 10. Gemini'ye verilecek ilk mesaj

> `BELGELER_MINIMAL_TASLAK_V3_UST_ALT_BAR_NIHAI_PLAN.md` dosyasını yerel mühendislik sitemde uygulayacaksın. Önce planı ve repo kurallarını oku; güncel yerel kod ile planın kaynak aldığı `main` SHA'sını karşılaştır; kullanıcı değişikliklerini koru. Bu **nihai V3 planı, eski V2 planının yerine geçer**. İlk `ASAMA_01`'i uygula, gerekli kontrolleri yap, `IMPLEMENTATION_STATE.md`'yi güncelle, sadece kısa sonuç bildir ve dur. Sonraki aşamaya yalnızca benim yeni “devam” mesajımla geç. Her seferinde **en fazla bir aşama** tamamla. Tüm aşamalar bitince veya durum `TAMAMLANDI` iken “devam” gelirse yeni iş yapma. Tema en sağda, zoom geometrik merkezde, Form Görünümü alt barda Boş form indir'in hemen solunda ve 320px mobilde de görünür olacak; bu koşullardan ödün verme.

---

**Son gözden geçirme:** Bu revizyon eski planın tüm veri güvenliği beklentilerini, mobilde önemli Formu Düzenle düğmesini ve tek final deployment tercihlerini korur; dört yeni UI talebini **beş stüdyoda** kapsar. En büyük üç regresyon tehlikesi, eski timer'ın reset verisini geri getirmesi, alt barın 320px'te taşması ve mobil multipage zoomun gerçekte merkezlenmemesidir; her biri testle ölçülmeden plan tamam sayılmaz.
