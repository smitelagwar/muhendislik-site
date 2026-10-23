# BELGELER — Form ↔ PDF alan odağı: denetim ve düzeltme planı

> Plan kimliği: `BELGELER_FORM_PDF_FOCUS_FIX_V1`  
> Tarih: 23 Ekim 2026, Europe/Istanbul  
> Durum: `PLAN_HAZIR`; aşağıdaki düzeltmeler henüz uygulanmadı.  
> Uygulayıcı: Kullanıcının seçtiği Gemini modeli, Windows / Antigravity.  
> Repo: `C:\Users\hsyn\Desktop\muhendis-mimar-portali`  
> İncelenen Antigravity konuşması: `003985bb-733c-4bbb-95f0-47b1cb9f2421`  
> İncelenen HEAD: `9cf0a95e819e1b545791c8ac7184a051758d1835`  
> Özelliğin gerçek commit'i: `59c1f54f50d2b090f5090b159b6aa9396655c55d`  
> Asıl gereksinim: `C:\Users\hsyn\Downloads\BELGELER_FORM_PDF_ODAK_VURGUSU_NIHAI_PLAN.md`.

## 1. Denetim kararı

Temel uygulama çalışıyor. Beş stüdyoya ortak hook bağlanmış, 56 alan allowlist ile eşlenmiş, gerçek PDF.js widget geometrisi kullanılmış ve pasif DOM katmanı PDF üretiminden ayrılmış. Normal alan seçimi, normal çok sayfalı geçiş ve basit mobil önizleme akışı mevcut testlerden geçiyor.

Ancak **sorunsuz tamamlanmış kabul edilemez**. Aşağıdaki 10 bulgu grubunda kullanıcıya görünen hatalar, hata sonrası toparlanma eksikleri, etkisiz testler ve yanlış dokümantasyon var. Yeni özellik/motor yazmak gerekmiyor; mevcut mimaride dar düzeltmeler yeterli.

Bu denetimde üretim kodu değiştirilmedi, commit/push/deploy yapılmadı. Denetim çıktıları Downloads altında tutuldu. Mevcut kirli dosyalar korundu.

### Doğrudan tekrar çalıştırılan kontroller

| Kontrol | Sonuç | Sınırı |
| --- | --- | --- |
| `npm run check:belgeler-pdf` | PASS — 134 test / 24 suite; altı sayfanın görsel koruması PASS | Mevcut pozitif/sentetik testleri doğrular; aşağıdaki eksik senaryoları kapsamıyor. |
| `npx tsc -p tsconfig.next.json --noEmit --incremental false` | PASS | Güncel çalışma ağacına karşı çalıştı. |
| `PLAYWRIGHT_PRODUCTION_SERVER=1` ile odak spec'i, `chromium-desktop-1366` | PASS — 18/18, 38,4 sn | Mevcut `.next` production artifact'ına karşı; bu denetimde yeni build yapılmadı. Artifact `BUILD_ID` dosyasının zamanı 23.10.2026 00:23:16 idi. |
| İlave masaüstü / mobil senaryolar | FAIL — aşağıdaki somut bulgular | Yerel production sunucusu port 3005 üzerinde. |
| Canlı sitede mobil `Esc` ve manuel sayfa → yeni form odağı | FAIL — ikisi de canlıda tekrarlandı | Yeni deploy oluşturulmadı. |
| Annotation sayacı ölçümü | FAIL — sayaç kurulumu etkisiz | `annotations: 0`, `extensible: false`, `installed: false`. |
| Aynı sayfada yinelenen widget için saf fonksiyon deneyi | FAIL — ilk dikdörtgen korunuyor | Gerçek mevcut şablonlarda duplicate bulunduğu iddiası değildir; planın bozuk/çakışan annotation sözleşmesi ihlalidir. |

Önceki Antigravity kayıtlarında 36/36 final odak testi ve canlı smoke çıktısı gerçekten bulunuyor. Sorun, bu testlerin bazı kabul koşullarını ölçmemesi veya yanlış ölçmesi. Önceden geçen testleri yok sayma; eksiklerini tamamla.

### Denetim kanıtları

Kanıt dizini: `C:\Users\hsyn\Downloads\belgeler-odak-denetim-2026-10-23`.

- `combined-results.json`: yerel davranışlar, hata enjeksiyonu ve sayaç ölçümü.
- `live-audit-results.json`: canlı sitede tekrar edilen iki mobil hata.
- `desktop-toolbar-to-print.png`, `same-field-after-toolbar-and-inline.png`: masaüstü odak hataları.
- `mobile-escape-during-flash.png`, `mobile-new-focus-after-manual-page.png`: mobil hatalar.
- `live-mobile-escape-during-flash.png`, `live-mobile-new-focus-after-manual-page.png`: canlı karşılıkları.
- `probe-results.json`, `mobile-delayed-render.png`: geciktirilmiş çizim ve etkisiz sayaç.
- `audit-runtime.mjs`, `audit-probes.mjs`, `audit-same-field.mjs`, `audit-live.mjs`: denetim yardımcıları. Repo kökünde çalıştırıldıklarında oradaki Playwright paketini kullanırlar. Kalıcı regresyon testlerinin yerine geçmezler; hazır yerel sunucu gerekir. `audit-live.mjs` canlı siteyi açar; yerel düzeltme aşamalarında çalıştırılması gerekmez.

## 2. Bulgular ve gerekli düzeltmeler

Öncelik: Bulgular P2 düzeyinde davranış/doğrulama kusurlarıdır. Güvenlik açığı veya veri kaybı saptandığı iddia edilmiyor. B01–B06 ürün davranışını; B07–B10 kabul kanıtlarının güvenilirliğini ilgilendirir. Hepsi bu düzeltme planında ele alınmalıdır.

### B01 — Korunan toolbar odağı stüdyo dışındaki geçişleri izlemiyor; aynı alan yeniden seçilince rehber de açılmayabiliyor

**Kaynak:** [hook](C:/Users/hsyn/Desktop/muhendis-mimar-portali/src/hooks/use-belge-field-focus.ts:106), [reducer](C:/Users/hsyn/Desktop/muhendis-mimar-portali/src/lib/belge-field-focus.ts:175), [edit bastırma](C:/Users/hsyn/Desktop/muhendis-mimar-portali/src/components/belge-studio-pdf-preview.tsx:1358).

**Tekrar üretme A:** Masaüstü Beton → `Şantiye Yeri` → PDF toolbar `Yakınlaştır` düğmesine odak → alttaki `Yazdır` düğmesine odak → 300 ms bekle. Eski `yer` çerçevesi kalıyor. Beklenen: ilgisiz odağa geçişte temizlenmesi.

**Tekrar üretme B:** `Şantiye Yeri` → toolbar'a odak → `PDF Üzerinde Düzenle` aç/kapat → yeniden **aynı** `Şantiye Yeri` alanına odak. Aktif DOM elemanı `beton-dokum-yer` olduğu hâlde highlight sayısı `0`. Başka alan seçildiğinde geri geliyor.

**Neden:** Hook yalnız form kabının blur olayını izliyor. Toolbar'a geçişte erken `return` ile seçim korunuyor; toolbar'dan sonraki çıkış artık form blur'u üretmiyor. Reducer da aynı `fieldKey` için gerçek yeni odak olayını eski seçimle aynı sayıyor; bastırma kimliği aşılamıyor.

**Düzeltme:** Gerçek form odağı, korunmuş bağlamsal seçim ve son mobil hedef kavramlarını ayır. Toolbar'dan sonraki odak/pointer çıkışını stüdyo kapsamında izle; yalnız aynı belgenin izinli PDF zoom/fit/pan/sayfa araçları istisna olsun. Genel `[role="toolbar"]` seçicisiyle ilgisiz araçları otomatik izinli sayma. Gerçek blur → tekrar focus, aynı anahtarda da yeni `focusEventId` üretsin; yazma/React render aynı kimliği korusun. Gerekli portal ve null `relatedTarget` durumlarını mevcut erişilebilirlik akışını bozmadan yönet.

**Kabul:** A'da vurgu kalkar; B'de aynı alana gerçek yeniden odak rehberi getirir. Toolbar içi gezinme ve normal zoom/fit seçimi korur. Tab/Shift+Tab titremez; form caret'i ve scroll'u korunur; listener cleanup vardır.

### B02 — Mobil manuel sayfa tercihi sonraki yeni form seçimlerini de kalıcı olarak engelliyor

**Kaynak:** [manuel sayfa kaydı](C:/Users/hsyn/Desktop/muhendis-mimar-portali/src/components/belge-studio-pdf-preview.tsx:1020), [mobil engelleme](C:/Users/hsyn/Desktop/muhendis-mimar-portali/src/components/belge-studio-pdf-preview.tsx:1249).

**Tekrar üretme:** Mobil Sözleşme → PDF'de elle sayfa 2 → `Formu Düzenle` → sayfa 1'e ait `#sozlesme-il` alanını seç → `Canlı PDF Önizle`. PDF `2 / 2` kalıyor; highlight yok. **Yerelde ve canlı sitede doğrulandı.**

**Neden:** `userManualPageChoiceRef` yalnız sayfa numarası saklıyor ve yeni form odağında geçersizleşmiyor.

**Düzeltme:** Manuel gezinme tercihini geçerli seçim/olay kimliğine bağla veya yeni gerçek form odağında sıfırla. Aynı seçim devam ederken kullanıcının elle sayfa/pan tercihini koru; yeni alan seçildiğinde yeni hedefi uygula. Sadece ref'i tamamen kaldırıp eski mobil gezinme regresyonunu geri getirme.

**Kabul:** Yukarıdaki akışta sayfa 1 ve `il` çerçevesi açılır. Ters yönde sayfa 1 → yeni sayfa 2 alanı da çalışır. Kullanıcı aynı seçim sırasında elle başka sayfaya gidince geri zorlanmaz. Sonraki PDF revision'ı manuel seçimi bozmaz.

### B03 — Mobil geçici vurgu `Esc` ile hemen temizlenmiyor

**Kaynak:** [mobil aktif anahtar](C:/Users/hsyn/Desktop/muhendis-mimar-portali/src/components/belge-studio-pdf-preview.tsx:1114), [timer/pending durumları](C:/Users/hsyn/Desktop/muhendis-mimar-portali/src/components/belge-studio-pdf-preview.tsx:1215).

**Tekrar üretme:** Mobil Beton → formda `yer` → önizleme → vurgu görünürken `Esc` → 200 ms bekle. `yer` vurgusu hâlâ var. **Yerelde ve canlıda doğrulandı.**

**Neden:** `clearSelection` hook state'ini temizliyor; önizlemenin ayrı `mobileHighlightKey` ve pending/timer durumları temizlenmiyor. Mobil anahtar bunlardan yeniden türetiliyor.

**Düzeltme:** Seçim iptalini preview'ye açık ve tek anlamlı bir sözleşmeyle ilet. İptalde aktif mobil anahtar, timer, pending flash ve pending reveal geçersizleşsin. Yalnız `fieldKey === null` kontrolü kullanma: normal form→preview blur'u ile gerçek iptal farklıdır. Yeni bir iptal kimliği veya eşdeğer açık durum geçişi kullanılabilir.

**Kabul:** `Esc`, genel `Temizle`, genel `Sıfırla`, belge değişimi ve unmount; görünür veya bekleyen vurguyu iptal eder. Gecikmiş render iptal edilmiş vurguyu/scroll'u geri getirmez. Normal mobil geçişte son alan yine gösterilir. Klavye olayını gereksiz yere yutup mevcut edit davranışını bozma.

### B04 — Mobil 2,5 saniye, hedef çizim gerçekten görünür ve hazır olmadan tüketilebiliyor

**Kaynak:** [render callback'inde flash](C:/Users/hsyn/Desktop/muhendis-mimar-portali/src/components/belge-studio-pdf-preview.tsx:443), [effect içinde ayrı başlangıç](C:/Users/hsyn/Desktop/muhendis-mimar-portali/src/components/belge-studio-pdf-preview.tsx:1269).

**Kanıt:** Bir sonraki PDF render completion'ı 3,5 saniye geciktirildi. Yeni metin girilip hemen önizlemeye geçildi. Kayıtta çizim `t≈1267–4829 ms` sürerken vurgu `t≈3504 ms`'de kaldırıldı; yeni çizim tamamlandığında vurgu yoktu. İlk mount ve generation/render durumlarının birbirinden bağımsız akması süreyi erken başlatabiliyor.

**Düzeltme:** Mobil flash için tek bir başlangıç yolu olsun. Görünür preview, doğru hedef sayfa/doküman, geçerli geometri, başarılı görünür canvas çizimi ve güvenli generation/render durumu doğrulandıktan sonra 2500 ms başlat. Geometri aynı olduğundan eski canvas'ı tutmak bilinçli seçiliyorsa hangi görünür canvas'ın geçerli kabul edildiğini açık sözleşmeyle tanımla; hazırlık ekranı arkasındaki süreyi başarı sayma. Timer bitince aktif `fieldKey` fallback'i geçici vurguyu kalıcılaştırmasın.

**Kabul:** İlk yükleme, yeni revision, farklı hedef sayfa ve gecikmiş annotation/render için hedef ilk kez güvenle gösterildikten sonra yaklaşık 2500 ms görünür kalır. Test yalnız `4500 ms içinde gizlendi` demesin; en azından 2 saniye dolmadan kaybolmadığını ve 2,5 saniye civarında söndüğünü ölçsün. Forma dönüş/iptal/yeni odak eski işi geçersizleştirsin.

### B05 — Başarısız/eksik geometri kalıcı başarı gibi cache'leniyor; async geçerlilik koruması eksik

**Kaynak:** [geometri cache ve single-flight](C:/Users/hsyn/Desktop/muhendis-mimar-portali/src/components/belge-studio-pdf-preview.tsx:181), [çıkarımın hata politikası](C:/Users/hsyn/Desktop/muhendis-mimar-portali/src/lib/belge-field-focus.ts:272).

**Tekrar üretme:** İlk `getAnnotations` çağrısını bir kez hata verecek şekilde enjekte et. PDF görüntüleniyor. Alanı seç, metni değiştirip yeni başarılı PDF revision'ı üret. Vurgu hâlâ yok; sayaç `calls:1, failures:1`. Boş `{}` cache truthy olduğu için tekrar çıkarım yapılmıyor.

**Ek kaynak bulgusu:** `extractGeometry().then(...)` sonucunda mounted/template/generation kontrolü yok. Cache kimliği yalnız belge ID'sini içeriyor; diagnostic'ler tüketilmiyor. Belge/şablon değişimi ve gecikmiş eski işlem için planın istediği koruma açıkça uygulanmamış.

**Düzeltme:** Geometri sonucunda tam/eksik/geçici başarısız durumu ayırt et. Sağlam sayfaların alanlarını koruyabilirsin; başarısız sayfanın eksikliği kalıcı başarı olmasın. Yeni uygun PDF/retry olayında **sınırlı**, örneğin bir ek deneme yap; her tuşta annotation tarayan veya sonsuz retry yapan çözüm kurma. Async sonuçlarını oturum/belge/kanıtlanmış şablon kimliğine göre doğrula; eski sonuç yeni cache'i ve state'i yazamasın. Tamamen kullanılamayan PDF'yi sessizce başarılı boş geometri sayma.

Şablon cache sözleşmesini kanıtla: beş belgede farklı içerikle **üretilmiş PDF'lerin** widget geometrisinin sabit kaldığını test et. Geometriyi etkileyen şablon/profil sürümü, sayfa sayısı, boyut veya rotation değişirse invalidation tanımlı olsun. Her veri revision'ını ayrı cache anahtarı yapıp performans hedefini bozma. Bilinen sağlam geometri korunurken odak değişimleri yine PDF üretmemeli.

**Kabul:** Tek geçici hatadan sonra başarılı çıkarımla rehber toparlanır; preview/indirme çalışmaya devam eder. Yüksek hızda veri değişimi, unmount ve belge değişiminde stale sonuç uygulanmaz. Kısmi sayfa hatası, boş sonuç, retry sınırı ve aynı şablonda annotation çağrı sayısı testlidir.

### B06 — Aynı sayfada yinelenen widget anahtarı gerçekten reddedilmiyor

**Kaynak:** [extractor](C:/Users/hsyn/Desktop/muhendis-mimar-portali/src/lib/belge-field-focus.ts:304), [ortak mapper'ın duplicate davranışı](C:/Users/hsyn/Desktop/muhendis-mimar-portali/src/lib/belge-studio-inline-field-map.ts:270), [mevcut test](C:/Users/hsyn/Desktop/muhendis-mimar-portali/tests/belgeler/field-focus.test.ts:183).

**Kanıt:** Tek sayfada iki ayrı `yer` widget'ı verildi. Sonuç hem `DUPLICATE_FIELD` diagnostic'i hem ilk `yer` rect'ini içeriyor. Dolayısıyla belirsiz ilk konum yine vurgulanabilir. Mevcut duplicate testi yalnız iki farklı sayfaya birer widget koyuyor; aynı sayfayı sınamıyor.

**Düzeltme:** Form rehberi extractor'ı aynı sayfadaki duplicate diagnostic'lerini de belirsizlik olarak ele alıp ilgili anahtarın **bütün** konumlarını reddetsin; gerekirse raw listeden dar kontrol yap. Inline edit'in mevcut mapper davranışını topluca değiştirmek zorunlu değil. Sayfalar arası duplicate reddi korunsun.

**Kabul:** Aynı sayfa / farklı sayfa duplicate durumlarında ilgili anahtar `rects` içinde yok; diagnostic var; diğer geçerli alanlar çalışıyor. Kenardan taşan normalize rect'lerde `left + width <= 1` ve `top + height <= 1` sözleşmesini de açıkça test et: mevcut yüzde 2 tolerans + ayrı clamp, sınırı aşan kutu döndürebiliyor. Geçersiz kutuyu reddet veya gerçekten kesişim dikdörtgeni üret; yanlış tam kutuyu kullanma.

### B07 — Annotation performans testi ölçüm yapmadan geçiyor

**Kaynak:** [test instrumentation](C:/Users/hsyn/Desktop/muhendis-mimar-portali/tests/site-audit/belgeler-field-focus.spec.ts:183), [ESM yükleyici](C:/Users/hsyn/Desktop/muhendis-mimar-portali/src/lib/pdfjs-client.ts:14).

**Kanıt:** Test `window.pdfjsLib`'e atanan ESM module namespace üzerinde `__instrumented` ve `getDocument` yazmaya çalışıyor. Tarayıcı probu: `Object.isExtensible(val) === false`, `val.getDocument === wrapper` sonucu `false`, gerçek highlight çalışırken annotation sayacı `0`. Test başlangıç annotation sayısının pozitif olmasını doğrulamıyor; `0 === 0` ile PASS oluyor.

**Düzeltme:** Salt okunur ESM namespace'i mutate etme. Teste özgü, gerçek kullanılan PDFDocument/PDFPage çağrılarını gözleyen bir facade/Proxy veya desteklenen başka bir interception kullan. Getter olan `task.promise`'ı doğrudan yeniden atama; promise/destroy/cancel sözleşmesini koru. Üretime kalıcı sayaç eklemek gerekmiyor.

**Kabul:** İlk sağlam çıkarımda sayaç `>0`; aynı belge/sayfada yalnız odak değişince artmıyor; aynı şablonda veri revision'ında gereksiz artmıyor. B05'in kontrollü recovery senaryosunda beklenen sınırlı artış ayrı doğrulanıyor. Ölçüm kurulamıyorsa test FAIL. `createObjectURL` ve `drawImage` ölçümleri korunur; farklı sayfaya geçişte beklenen çizim sıfır sanılmaz.

### B08 — 56 alan ve kritik kabul iddiaları test kapsamından daha geniş

**Kaynak:** [Beton hiza testi](C:/Users/hsyn/Desktop/muhendis-mimar-portali/tests/site-audit/belgeler-field-focus.spec.ts:29), [56 alan döngüsü](C:/Users/hsyn/Desktop/muhendis-mimar-portali/tests/site-audit/belgeler-field-focus.spec.ts:509), [gesture testi](C:/Users/hsyn/Desktop/muhendis-mimar-portali/tests/site-audit/belgeler-field-focus.spec.ts:139).

- Beton'daki koordinatlar elle yazılmış yaklaşık sabitler; final DOM konum testi `2.5 px` tolerans kullanıyor. Asıl sözleşme `<=2 CSS px`. Genişlik/yükseklik için gerçek CSS px doğrulaması eksik.
- 56 alan döngüsü yalnız görünürlük, tek eleman ve `data-field-key` kontrol ediyor. Diğer dört belgenin gerçek PDF widget'ı, sayfası ve DOM hizası için bağımsız tam oracle yok.
- Ctrl+wheel testi 400 ms sonraki son duruma bakıyor; geçici transform sırasında yanlış kutu görünmediğini ölçmüyor. `%50`, `%200`, üst destekli zoom, gerçek pinch, yüksek DPR kanıtı eksik.
- Yeni spec'te fail ettiren `pageerror`/console error/hydration/önemli request gözlemi yok. Yavaş/eksik annotation, iptal edilmiş pending işler ve yukarıdaki ardışık kullanıcı akışları yok.
- `forced-colors`, light/dark ve yoğun alan okunurluğu mevcut yeni testte doğrulanmıyor. Görünüm boyutu değiştirmek tek başına dokunmatik veya fiziksel cihaz testi sayılmaz.

**Düzeltme:** B01–B07 için kalıcı regresyonlar ekle. Beş belge/56 alanın beklenen konumunu aynı üretilmiş PDF'nin bağımsız PDF.js annotation ölçümünden türet; highlight style'ını kendisine oracle yapma. Her alan için doğru sayfa, tek kutu, `left/top/width/height` hatası **<=2 CSS px** olsun. Mevcut toleransı daha da büyütme; görülen farkın kaynağını ölç.

**Kabul:** Bölüm 5'teki matris gerçekten çalıştırılmıştır. Test sayısı tek başına kalite kanıtı değildir. Aynı sayfadaki yalnız odak işlemlerinin sıfır PDF/çizim hedefi ile çok sayfalı hedefe geçişin doğal çizim maliyeti ayrı ölçülür. Beklenen hata enjeksiyonları dışındaki runtime hataları testi düşürür.

### B09 — Canlı smoke script'i başarısız koşulda bile başarı yazabilir; hata cleanup'ı güvenilir değil

**Kaynak:** [smoke script](C:/Users/hsyn/Desktop/muhendis-mimar-portali/scripts/verify-field-focus-live-smoke.mjs:103).

**Kaynakla doğrulanan kusurlar:**

1. `isHidden === false` olduğunda yalnız `HAYIR ❌` yazılıyor; sonra koşulsuz `TÜM SENARYOLAR BAŞARILI` basılıyor, süreç başarısız sayılmıyor.
2. Şantiye Yeri/Tarih geçişlerinde doğru field/page attribute'u yerine çoğunlukla herhangi bir highlight görünmesi kontrol ediliyor.
3. `catch` içinde `process.exit(1)` çağrısı `finally` içindeki browser kapatılmadan süreci bitiriyor. Bu, repo test otomasyon standardına aykırı.

Önceki kayıt gerçekten `EVET` diyor; geçmişte bu yanlış dalın çalıştığı iddia edilmiyor. Kusur, gelecekteki gerçek hatayı kabul kapısının reddetmemesidir.

**Düzeltme:** Sonuçları gerçek assertion'lara çevir; yanlış field/page ve mobil zamanlama da başarısız olsun. HTTP status ve önemli runtime hatalarını doğrula. Catch'te exit code belirle, finally'de browser/context kapat, sonra süreci sonlandır. Bağımsız script için üst süre sınırı/cleanup kullan. Mümkünse aynı script yerel base URL ile de sınanabilsin; her smoke denemesi için canlı siteye gitmek gerekmesin.

**Kabul:** Yerel kontrollü yanlış alan, görünmeye devam eden flash ve PDF render hatası script'te nonzero exit üretir; bütün senaryolar geçmeden başarı satırı yazılmaz; açık browser/process kalmaz. Canlı doğrulama gerektiğinde mevcut deploy üzerinde tek kısa kontrol yeterlidir.

### B10 — Durum kaydındaki commit SHA yanlış; yaşayan dokümanda var olmayan prop ve fazla geniş garanti var

**Kaynak:** [durum kaydı](C:/Users/hsyn/Desktop/muhendis-mimar-portali/docs/belgeler-alan-odak/IMPLEMENTATION_STATE.md:22), [yaşayan doküman](C:/Users/hsyn/Desktop/muhendis-mimar-portali/docs/BELGELER_SISTEMI.md:323), [gerçek preview props](C:/Users/hsyn/Desktop/muhendis-mimar-portali/src/components/belge-studio-pdf-preview.tsx:55).

- `tested_commit` ve birkaç release kaydı `59c1f545465cf45055b89cfd313be7b9318b76c8` yazıyor. Bu Git objesi bulunamıyor. Gerçek SHA **`59c1f54f50d2b090f5090b159b6aa9396655c55d`**. Kısa prefix'in aynı olması yeterli değil.
- Yeni şablon örneği `onClearFieldFocus={clearFieldFocus}` prop'u aktarmayı söylüyor; bu prop gerçek `BelgeStudioPdfPreviewProps` içinde yok.
- “Hiçbir odak değişimi canvas render tetiklemez” çok geniş: farklı sayfadaki alana odaklanma doğal olarak yeni sayfa çiziyor. Aynı sayfadaki rehber güncellemesi ile sayfa geçişi ayrılmalı.
- `<=2 px`, bütün desteklenen zoom aralığı, 0 ms yanlış sayfa ve tam geometri güvenceleri ölçülen kanıttan daha kesin yazılmış. Eski PASS'ler tarihsel kayıt olarak korunmalı; bu yeni denetimdeki açıklar ayrıca görünür olmalı.

**Düzeltme:** Metadata'yı gerçek `git show` / `git cat-file -t` çıktılarıyla düzelt; hangi metadatanın düzeltildiğine kısa not düş. Eski testlerin çalıştığı dirty worktree bilgisini daha sonra oluşan commit'e uydurarak yeniden yazma. Yeni düzeltmenin kendi durum dosyası olsun. Yaşayan API örneğini gerçekten uygulanacak iptal sözleşmesine uydur; B03 çözümünde yeni prop eklenirse ancak o zaman gerçek adıyla belgeye geçir. İddiaları gerçek test kapsamına göre yaz.

**Kabul:** Bütün kayıtlı commit objeleri mevcut; güncel örnek TypeScript API ile uyumlu; ölçülmemiş fiziksel cihaz/baskı/gesture sonucu PASS gösterilmiyor. Tarihsel tamamlanma kaydı bugünkü düzeltme durumunu gizlemiyor.

## 3. Kapsam ve çalışma kuralları

1. Bu plan **yerel düzeltme ve yeniden doğrulama** içindir. Commit/push/deploy aşaması içermez. Kullanıcı düzeltmeler bitince Codex'e tekrar denetletecektir. Yeni Vercel build'i üretmek bu işin kabul koşulu değildir.
2. `PROJECT.md` → `AGENTS.md` → `GEMINI.md` → ilgili `.agents/rules` sırasını uygula. Özellikle Belgeler, test/otomasyon ve yaşayan dokümantasyon kurallarını oku. Kod yazmadan önce varsa kurulu Next.js yerel kılavuzlarını ilgili API için oku; bulunmuyorsa durumu kaydet, API varsayma.
3. Kullanıcının mevcut `use-belge-studio-form-view.ts`, `belge-studio-form-view.ts`, `form-view.test.ts`, `belgeler-form-view.spec.ts` değişiklikleri ve önceden oluşmuş untracked dosyalar bu görevin malı değildir. Silme, stash/reset yapma, kendiliğinden commit'e katma. Aynı dosyaya zorunlu dokunuş varsa önce mevcut diff'i kaydet ve dar kapsamla çalış.
4. Mevcut `docs/belgeler-alan-odak/PLAN.md` üzerine bu planı yazma. Yeni dizin önerisi: `docs/belgeler-alan-odak-duzeltme-2026-10-23/`, içinde `PLAN.md` ve tek `IMPLEMENTATION_STATE.md`. Dizin zaten varsa mevcut içeriği incele; çakışmayı ezme.
5. Esas değişiklikler hook, focus helper, preview lifecycle, ilgili testler, smoke script ve iki yaşayan durum/doküman düzeltmesiyle sınırlı olsun. PDF engine/font/şablon, hesap araçları, CAD ve Dokümantasyon modüllerinde refactor yok. Yeni bağımlılık gerekmiyor.
6. Bu belge içindeki kod önerileri uygulama seçenekleridir; çalışan kaynak API'sini kontrol ederek uygula. Aynı sorunu iki paralel state makinesiyle çözme. Yeni state/event tipi gerekiyorsa net tek sahiplik kur.
7. Hata veren assertion'ı kaldırma, toleransı genişletme, tüm testleri skip etme. Eski ilgisiz fail varsa başlangıç çizgisiyle ayır; bu görevin davranışını etkileyen fail'i kapatmadan aşama geçme.
8. Bağımsız test script'lerinde kısa selector timeout, genel süre sınırı, try/finally cleanup ve doğru exit code zorunlu. Yalnız bu görevin açtığı sunucu/tarayıcıları kapat. PowerShell'de çıplak `curl` kullanma.

## 4. Aşamalı uygulama

### D00 — Güncel başlangıç çizgisi ve kırmızı senaryolar

**Üretim kodunu değiştirme.** Talimatları ve bugünkü git durumunu oku. Yeni plan/durum dizinini oluştur. Bu denetimden sonra kullanıcı veya başka ajan kodu değiştirmiş olabilir; HEAD/diff'i yeniden kontrol et. Bugün zaten çözülmüş bulguyu gereksiz yeniden yazma.

İlgili mevcut testleri ve B01–B07 senaryolarını güncel kaynakta doğrula; mümkünse yeni kalıcı testleri bu aşamada ekleyip kırmızı başlangıcı göster. Hataları düzeltilmiş gibi PASS yazma. Mevcut `.next` artifact'ını güncel kaynakla aynı varsayma; geliştirmede dev sunucusu, finalde yeni production build kullan.

**Çıkış:** Gerçek başlangıç HEAD'i, dirty dosyalar, açık/çözülmüş bulgu listesi, hangi testin neden kırmızı olduğu durum kaydında. **Dur.**

### D01 — Form odağı ve bağlamsal seçim yaşam döngüsü

B01'i düzelt. Aynı alana gerçek geri dönüş yeni olay; normal yazma aynı olay olsun. Form dışı/toolbar sonrası focus değişimi takip edilsin. Allowlist yalnız mevcut stüdyo/önizleme araçlarını kapsasın. Hook ve reducer'ın sorumlulukları açık olsun.

**Çıkış:** İki B01 regresyonu, normal Tab/Shift+Tab/toolbar/zoom, Esc ve listener cleanup yeşil. Odak değişimi aynı sayfada PDF bytes veya canvas çizimi üretmiyor. Hedefli lint ve typecheck PASS. **Dur.**

### D02 — Mobil seçim, iptal, bekleyen işler ve görünür süre

B02, B03 ve B04'ü birlikte çöz; bunlar aynı geçici seçim yaşam döngüsünü paylaşıyor. Mobil durumun tek sahibi ve tek timer başlangıç yolu olsun. Manuel gezinme yeni seçimle geçersizleşsin; iptal pending işleri de düşürsün. Pending reveal/flash kayıtları belge/selection olay kimliğini taşısın ve uygulanmadan önce güncelliği doğrulansın.

**Çıkış:** Mobil sayfa 1↔2 + manuel tercih + yeni alan; aynı alana tekrar focus; Esc/clear/reset; form→preview→form; yavaş render/annotation; iptal sonrası geç completion; yeni seçimle yarışan eski completion testleri yeşil. 2,5 saniye gerçekten görünür dönemden ölçülüyor. Caret/klavye ve dirty edit sheet bozulmuyor. **Dur.**

### D03 — Sağlam geometri çıkarımı, cache recovery ve belirsiz widget reddi

B05 ve B06'yı düzelt. Cache başarı/eksiklik/hata ayrımı, sınırlı retry ve stale async guard ekle. Aynı sayfa duplicate için ilk rect'i de çıkar. Normalize sınır sözleşmesini koru. Farklı form verilerinden üretilen PDF'lerde sabit geometri varsayımını testle kanıtla.

**Çıkış:** 56 gerçek alan korunuyor; tek geçici hatadan sonra recovery var; stale/unmount/şablon değişimi yanlış kutu üretmiyor; aynı sayfa ve çapraz sayfa duplicate reddediliyor; güvenli cache yolunda her tuşta annotation okunmuyor. PDF kontrat/visual paket PASS. **Dur.**

### D04 — Ölçen kabul testleri ve doğru smoke başarısızlığı

B07, B08 ve B09'u düzelt. Gerçek çalışan annotation instrumentation ve pozitif başlangıç assertion'ı kur. 56 alan için bağımsız üretilmiş-PDF oracle'ı, tam rect/pixel kontrolü ve geçici gesture gözlemi ekle. Runtime hata gözlemlerini bağla; kontrollü fault injection beklentilerini ayrı tut.

Smoke script'ini yerel fixture/sunucuda yanlış koşulla çalıştırarak nonzero çıktığını doğrula. Sırf script düzeltildi diye production'a yeni deploy yapma. Yardımcıların timeout ve cleanup davranışını da kontrol et.

**Çıkış:** Bölüm 5 matrisi için kalıcı testler var. Gerçek yanlış field/page, süresiz flash ve ölçüm kurulum hatası ilgili testi düşürüyor. Eski normal senaryolar korunuyor. **Dur.**

### D05 — Yeni production build üzerinde son yerel doğrulama ve doğru dokümantasyon

B10'u düzelt; gerçek komut ve SHA'ları kaydet. `docs/BELGELER_SISTEMI.md` API, cache/retry, mobil iptal ve test komutlarını gerçek çözüme göre güncelle. Eski durum dosyasına kanıt düzeltmesi ve yeni denetim/düzeltme kaydına bağlantı ekle; geçmiş test zamanlarını veya source kimliklerini uydurma.

Önerilen kontrol sırası:

1. Değişen somut TS/TSX/test dosyalarında ESLint.
2. `npm run check:belgeler-pdf`.
3. `npx tsc -p tsconfig.next.json --noEmit --incremental false`.
4. `npm run build`.
5. Başka görevden kalmış server'ı yeniden kullanmadan, yeni artifact ile production sunucusu aç; test edilen port/process/build kimliğini kaydet. `reuseExistingServer` eski sunucuyu gizlice kullanmasın; gerekirse ayrı test portu seç.
6. Yeni odak paketi 1366 ve 1920 masaüstü; mobil özel senaryolar uygun touch context/projelerde. İlgili mevcut inline desktop/mobile, mobile-studio, native-zoom ve form-view regresyonlarını uygun projelerle çalıştır. Her spec'i bütün projelere körlemesine uygulama; masaüstü form testlerini gizli mobil forma zorlamama.
7. PDF download/blank/print byte sözleşmesi, yeni runtime hataları, Bölüm 5 matrisi ve yoğun alan görselleri. Fiziksel telefon/yazıcı yoksa `BEKLIYOR`; otomasyon PASS'i fiziksel kanıt yapma.
8. `git diff --check`, son `git status`, kapsam listesi; geçici test dosyalarını temizle. Kullanıcının baştaki değişiklikleri korunduğunu doğrula. Açılan süreçleri kapat.

**Çıkış:** B01–B10 için ayrı kanıt, tüm gerekli yerel testler PASS, yeni artifact üzerinde kabul, açık ürün kusuru yok. Durum `TAMAMLANDI` olur ve kullanıcıya yerel düzeltme özeti verilir. **Commit/push/deploy yapma. Dur; kullanıcı Codex ile tekrar denetleyecek.**

## 5. Nihai kabul matrisi

| Alan | Zorunlu kanıt |
| --- | --- |
| Temel eşleme | Beş belgede 56/56; doğru PDF widget/sayfa; tek highlight; PDF-only alanlar hariç. |
| Hiza | Her alanın left/top/width/height ölçümü; bağımsız üretilmiş PDF oracle'ı; hata <=2 CSS px. |
| Odak | Click, Tab, Shift+Tab, aynı alana gerçek geri dönüş; toolbar içi ve toolbar→ilgisiz odak; Esc/reset/clear. |
| Çok sayfa | 1→2→1; hızlı ardışık alanlar; sayfa tamamlanmadan iptal; yanlış canvas üstünde kutu yok. |
| Manuel tercih | Aynı seçimde manuel sayfa/pan korunur; yeni gerçek form seçimi yeni hedefi uygular. |
| Mobil flash | Formdan isteyerek preview; önce görünür/geçerli canvas; yaklaşık 2500 ms; erken tükenmez; kalıcılaşmaz; tekrar/iptal/race temiz. |
| Mobil boyut | 320×720, 360×800, 390×844, 430×932, 768×1024; uygun mobil/touch context; yatay taşma yok. |
| Zoom | 50/100/150/200 ve destekli üst kritik oran; fit; Ctrl/Cmd+wheel; touch pinch; yüksek DPR. Son konum yanında gesture sırasında görünür kutunun doğruluğu/gizlenmesi. |
| Performans | Ölçüm gerçekten kurulu ve ilk annotation sayısı >0; aynı sayfada odak sıfır üretim/çizim; sağlam cache'te tuş başına annotation taraması yok; recovery sınırlı. |
| Recovery | Tek transient annotation hatası, kısmi sayfa hatası, bozuk/missing widget, duplicate, stale sonuç, unmount ve belge/şablon değişimi. |
| Inline edit | ON'da rehber yok; OFF sonrası yeni gerçek odakla gelir; aynı alan da çalışır; dirty sheet/popover/uygula/vazgeç/navigation korunur. |
| Erişilebilirlik/görsel | aria-hidden, pointer-events none, yeni tab durağı yok; reduced-motion, forced-colors, light/dark; yoğun Taahhütname/Sözleşme satırları 100/200 zoom görselleri. |
| Çıktı | Dolu/boş/indirilen/yazdırılan PDF sözleşmesi korunur; DOM konturu PDF'ye yazılmaz. |
| Test doğruluğu | Beklenmeyen pageerror/console/hydration/önemli request hatası FAIL; olumsuz smoke koşulu nonzero; cleanup ve timeout var. |
| İzlenebilirlik | Gerçek SHA + test edilen dirty diff/artifact; ölçülmeyen koşul BEKLIYOR; güncel API dokümanı. |

## 6. Durum kaydı ve DEVAM protokolü

Yeni durum dosyasının asgari şeması:

```yaml
plan_id: BELGELER_FORM_PDF_FOCUS_FIX_V1
execution_status: BASLAMADI # BASLAMADI | DEVAM_EDIYOR | ENGELLI | TAMAMLANDI
active_stage: null
next_stage: D00
completed_stages: []
baseline_head: null
tested_head: null
tested_worktree_description: null
build_id: null
findings:
  B01: ACIK
  B02: ACIK
  B03: ACIK
  B04: ACIK
  B05: ACIK
  B06: ACIK
  B07: ACIK
  B08: ACIK
  B09: ACIK
  B10: ACIK
evidence: [] # bulgu, senaryo/komut, PASS/FAIL/BEKLIYOR, kaynak/artifact, kanıt yolu
blockers: []
updated_at: null
```

İlk başlatma yalnız D00'ı, sonraki her `devam` en fazla bir tamamlanmamış aşamayı uygular. Aşamanın düzeltme/test döngüsü aynı aşamaya dahildir; test geçmeden sonraki aşamaya gitme. Kullanıcı açıkça tüm aşamaları tek seferde isterse bu tercihi uygula; bağımlılık ve kabul kapılarını koru.

Başarıyla bitince `active_stage:null`, `next_stage:null`; bulgular kanıtla `COZULDU`. Yeni görev çıkarmak için kozmetik değişiklik uydurma. **TAMAMLANDI sonrası salt `devam` gelirse yalnız “Düzeltme planı tamamlandı; uygulanacak başka aşama yok.” de. Test/dosya/commit/deploy işlemi başlatma.**

### Gemini'ye ilk mesaj

> `C:\Users\hsyn\Downloads\BELGELER_FORM_PDF_ODAK_VURGUSU_DUZELTME_PLANI_2026-10-23.md` dosyasındaki denetim ve düzeltme planını uygula. Bu yeni görev yerel düzeltme/doğrulama içindir; commit, push ve deploy yapma. Önce repo talimatlarını, bugünkü HEAD/diff'i ve eski odak uygulamasını incele; başka görevlerin kirli dosyalarını koru. Planı ayrı, çakışmasız görev dizinine kaydet. Şimdi yalnız D00'ı uygula, gerçek kırmızı/yeşil başlangıcı ve durum kaydını oluştur, sonra dur. Sonraki her `devam` bir aşama ilerletsin. Hata veren testi gevşetme; B01–B10 için somut kanıt üret. D05 gerçekten geçince dur; kullanıcı sonucu Codex'e tekrar denetletecek. Tamamlandıktan sonra salt `devam` yeni iş başlatmasın.

