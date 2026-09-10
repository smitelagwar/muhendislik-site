# Mevcut CAD motorunu hızlandırma önerisi

Tarih: 5 Eylül 2026

Durum: Teknik inceleme ve deney planı. Uygulanmış değişiklik veya doğrulanmış hız kazancı değildir.

İncelenen yerel HEAD: `042b04a` (`main`). İnceleme başında çalışma ağacı temizdi. Tarihsel golden `909c59cb9dcac8e722b3bda4c66fd9d8a25755c8` korunur.

## Karar

MLightCAD, native DXF okuyucu ve LibreDWG üzerinde devam ederek açılış hattını iyileştirmek, bu aşamada başka bir CAD motoruna geçmekten daha güçlü bir deney yönüdür. Mevcut geometri, metin ve ölçüm davranışına yapılan yatırımı korur. Yeni ücretli SDK veya dönüşüm servisi gerektirmeyen bir tasarımdır; mevcut bağımlılıkların lisans yükümlülükleri devam eder.

Üç hedef ayrı ölçülmelidir:

1. İlk kez açılan dosyanın tamamen hazırlanması.
2. Kullanıcının ilk anlamlı çizimi görmesi ve pan/zoom sırasında yanıt alması.
3. Aynı oturumda bir dosyanın yeniden açılması.

Bir yükleme ekranını erken kapatmak toplam işi azaltmaz. Daha sık çizim yapmak da toplam süreyi artırabilir. Başarı, bu üç metriğin birlikte değerlendirilmesidir.

## Kaynak kodda doğrulanan bulgular

| Bulgu | Kanıt | Sonuç |
|---|---|---|
| Kaynak indirmesi ilk motor kurulumundan sonra başlıyor. | `cad-upstream-viewer.tsx`: `await CadUpstreamAdapter.create()` ardından `await createdAdapter.open()`; kaynak fetch'i adapter `open()` içinde. | `open()` içindeki paralellik ilk import/kurulum/worker erişim kontrolü beklemesini kapsamıyor. |
| Native DXF okuyucu ara büyük JSON modelini zaten atlıyor. | `@mlightcad/data-model/lib/dxf/AcDbNativeDxfConverter.js`: DXF çiftlerinden doğrudan CAD veritabanı, `useWorker: false`, cooperative yield. | Genel bir JSON tabanlı parser'a geçmek ilave kopyalama ve veritabanını yeniden kurma maliyeti getirebilir. |
| Font tanısı için DXF ikinci kez tam metne ve satır dizisine çevriliyor. | `adapter.ts`: `extractDxfOrDwgFonts()`, `TextDecoder`, `replace`, `split`. | Büyük dosyada ana iş parçacığı ve geçici bellek maliyeti var. |
| DWG parser worker'ı her `parse()` çağrısında oluşturulup sonuçtan sonra kapatılıyor. | `@mlightcad/libredwg-converter/lib/AcDbLibreDwgConverter.js`: `acdbCreateWorkerApi()` → `execute()` → `destroy()`. | Dosya değişimlerinde worker ve WASM instance hazırlığı yeniden oluşabilir. HTTP önbelleği worker yaşam süresini korumaz. |
| DWG giriş baytları zaten transfer listesi ile gönderiliyor. | `@mlightcad/data-model/lib/converter/worker/AcDbWorkerManager.js`: `worker.postMessage(message, [input])`. | Buraya yeniden “zero-copy ekleme” başlığı altında kazanım yazılmamalı. |
| Worker sonucu normal `postMessage(response)` ile geri geliyor. | `@mlightcad/data-model/lib/converter/worker/AcDbBaseWorker.js`. | Büyük model sonucunun structured clone maliyeti ayrı ölçülmeli; mevcut nesne grafiğine yalnız transfer listesi eklemek çözüm değildir. |
| DWG çözümlemesinden sonra tablolar, bloklar ve entity'ler CAD veritabanına dönüştürülüyor. | `AcDbDatabaseConverter.js` ve `AcDbLibreDwgConverter.js`. | “DWG zaten worker'da” olması bütün açılışın worker'da olduğunu göstermez. |
| Progressive geometri işleme bütçesi 300 ms; ara çizim aralığı 1000 ms. | Yüklenen `cad-simple-viewer/dist/cad-simple-viewer.js` ve `lib/view/AcTrView2d.js`. | Akıcılık ile toplam throughput arasında bilinçli bir denge var. Bunlar her dosyada kesin yaşanan gecikmeler değil, zamanlama ayarlarıdır. |
| Snap ve metin indeksleri erteleniyor fakat oluşturulmaları senkron. | `adapter.ts`: `ensureSnapReady()`, `ensureTextSearchReady()`, `scheduleAuxiliaryIndexes()`. | `async` veya `requestIdleCallback`, iş başladıktan sonra uzun bir döngünün UI'yi kilitlemesini önlemez. |
| RAM cache ham dosya baytlarını tutuyor. | `cad-runtime/session-cache.ts`. | Yeniden parse, CAD veritabanı kurma ve render maliyetleri kalıyor. Tek dosya sınırı 20 MiB, toplam 40 MiB. |
| Hazır durumu tam açılış hattından sonra işaretleniyor. | Adapter `openDocument()` ve `waitUntilIdle()`; host `markCadPerfReady()`. | İlk anlamlı görüntü ile tam geometri/metin hazırlığı ayrı olaylar olarak ölçülmüyor. |

## Bu incelemede yapılan ölçüm

Mevcut `extractDxfOrDwgFonts()` fonksiyonu kaynak dosyadan alınarak TypeScript derleyicisiyle JavaScript'e çevrildi. Davranışı değiştirilmeden repodaki en büyük gerçek DXF üzerinde beş kez çalıştırıldı. Test girdi dosyasını veya motor kodunu değiştirmedi.

- Dosya: 55.259.742 bayt, yaklaşık 55,3 MB / 52,7 MiB.
- Ortam: Yerel Windows, Node.js `v24.15.0`.
- Süreler: `654,59 / 570,89 / 518,94 / 512,23 / 575,95 ms`.
- Ortanca: **570,89 ms**.
- Fonksiyon sonucu: 19 farklı font/stil isteği.

Bu bir CPU mikro ölçümüdür. Ağ, tarayıcı, CAD parser, font geometrisi, render veya toplam açılış ölçümü değildir. Mobil süre tahmini veya uygulanmış optimizasyon kazanımı olarak kullanılamaz. Aynı işin parse sırasında toplanması bu ek geçişi kaldırabilir; toplam kazanç ayrıca ölçülmelidir.

## Öncelikli deneyler

### 1. Kaynak hazırlığını ve motor kurulumunu birlikte başlat

**Katman:** UPSTREAM HOST / ADAPTER.

Dosya kimliği ve erişim URL'si kesinleşince kaynak fetch/cache işi ile viewer kodu/kurulum işini aynı açılış oturumuna bağla. Var olan WebGL teardown sırasını koru; kaynak indirmesi önceki canvas'ın kapanmasını beklemek zorunda olmasın.

Tek bir kaynak sahibi olsun. Host ve adapter aynı dosyayı iki kez indirmesin. İptal, worker hatası ve dosya değişimi iki hazırlık işini de sonlandırsın; eski oturum sonucu yeni dosyaya bağlanmasın.

Başarılı cache hit ile doğrudan DWG yolu ayrı ele alınmalı. DXF türevi seçilecek diye orijinal DWG'yi her durumda spekülatif indirmek gereksiz ağ/bellek tüketir.

**Beklenen etki:** İlk açılışta birbirine bağımlı olmayan beklemeleri örtüştürür. Parser hızını değiştirmez.

### 2. DXF'yi tek anlamlandırma geçişine yaklaştır

**Katman:** ADAPTER / FIDELITY / NATIVE DXF READER.

İlk küçük aday: Font taramasında tam dosya için `replace().split()` üretmeden satır çiftlerini dolaş. Türkçe kodlama, STYLE kayıtları ve kullanılan stiller açısından mevcut sonuçlarla karşılaştır.

Sonraki aday: Aynı font/stil bilgisini native okuyucunun mevcut geçişinde veya tamamlanan veritabanından çıkar. Yalnız tanısal veriyi ilk render kritik yolundan çıkar; gerekli gerçek font hazırlığını kaldırma. Kodlama tespiti, transcode ve font tanısı ortak bir kaynak hazırlık sonucunu kullansın.

DXF parser'ı bütünüyle başka worker'a taşımayı ilk değişiklik yapma: Mevcut native okuyucu doğrudan sınıf örnekleri ve ilişkiler kuruyor. Worker'dan bütün canlı veritabanını kopyalamak veya ana iş parçacığında tekrar kurmak, kazanımı silebilir.

**Beklenen etki:** İlk ve tekrar DXF açılışında daha az geçici metin/satır nesnesi ve daha az CPU işi.

### 3. İşleme bütçesi ile çizim sıklığını ayrı yönet

**Katman:** VIEW / RENDER SCHEDULING / AUXILIARY INDEXES.

Native DXF parse ve geometri dönüşümünde var olan cooperative yield mekanizmalarını ölçerek ayarla. Her entity sayısı aynı iş miktarı değildir: 1000 çizgi ile 1000 MTEXT/HATCH farklıdır. Süre bütçesi esas alınmalı.

Kullanıcı pan/zoom yaptığında kısa çalışma dilimleri; boşta daha büyük işleme dilimleri denensin. Her yield sonrası tüm sahneyi yeniden çizmek zorunlu olmasın. Tek ağır entity bütçeyi aşıyorsa yalnız dış döngüyü bölmek yetmez; o entity'nin iç işi ayrıca ele alınmalı.

Snap ve metin indeksleri için gerçek artımlı üretim veya sade veri kullanan worker işi kur. Ölçüm aracı gerekli indeks hazır olmadan yanlış bir yakalama sonucu üretmesin. İptal/dosya değişimi kontrolü iş parçaları arasında da çalışsın.

İlk anlamlı render, tam sahne, snap ve arama hazır olaylarını ayır. Geometri görünürken “ayrıntılar hazırlanıyor” gösterilebilir; eksik çizim tam sonuç olarak sunulmaz. Fit'in kullanıcı gezinirken kamerayı tekrar çekmesi ve boş-success koruması ayrıca test edilir.

**Beklenen etki:** Daha erken görünür çizim ve daha iyi etkileşim yanıtı. Toplam açılışın da hızlanacağı peşinen varsayılmaz.

### 4. Tek, sınırlandırılmış DWG worker/WASM oturumu

**Katman:** DWG CONVERTER / WORKER LIFECYCLE.

Her dosyadan sonra parser worker'ını kapatmak yerine CAD oturumu boyunca tek worker'ı yeniden kullanmayı dene. İşler seri kuyrukta çalışsın; çok sayıda paralel WASM instance açılmasın.

Her dosyanın native kaynakları başarı/hata durumunda `finally` ile serbest bırakılsın. Eşzamanlı bir native parse mesajla iptal edilemiyorsa worker terminate edilip yeniden oluşturulsun. Uzun boşta kalma veya belirlenen bellek bütçesi aşımı da worker'ı yenilesin; WASM heap büyümesinin otomatik küçüleceği varsayılmasın.

Bu oturum WebGL manager/canvas saklama ile birleştirilmesin. Parser yaşam süresi ve ekran yaşam süresi ayrı sorumluluklar olsun.

**Beklenen etki:** Özellikle art arda farklı DWG açılışları. İlk DWG'deki gerçek parse maliyetini kaldırmaz.

### 5. Ham bayt cache'inden çözümleme sonucu cache'ine kontrollü geçiş

**Katman:** CONVERTER / SESSION CACHE.

Önce DWG parser'ın zaten ürettiği sade ara modelin yeniden kullanımını dene. Yeniden açılışta LibreDWG parse aşaması atlanabilir; MLightCAD veritabanı kurma ve render maliyeti devam eder.

Anahtar: kullanıcı/erişim kapsamı + dosya sürümü veya içerik özeti + parser ve normalizasyon sürümü. Kaynak sürümü kesin olmayan girdide hit verme. Model tüketici tarafından değiştiriliyorsa paylaşılan referans kullandırma; kopyalama maliyetini toplam süreye dahil et.

Bütçeyi sıkıştırılmış DWG dosya boyutundan çıkarma: açılmış model çok daha büyük olabilir. Ham bayt, model ve GPU cache'lerini aynı anda sınırsız tutma. İlk adayda küçük, RAM ile sınırlı model cache'i yeterli; kalıcı IndexedDB cache'i mevcut test sözleşmesini ayrıca değiştirir.

**Beklenen etki:** Aynı dosyanın yeniden açılması. Büyük ilk açılışı hızlandırmak için tek başına çözüm değildir.

### 6. Ağır geometri için paketlenmiş sonuç ve tekrar kullanım

**Katman:** WORKER PROTOCOL / THREE RENDERER. Daha yüksek riskli, sonraki deney.

Profilleme MTEXT/HATCH/BLOCK geometrisini baskın gösterirse pahalı saf hesapları hedefle: metin geometrisi, tarama üçgenleştirmesi, aynı blok tanımının yeniden kullanımı. Her entity'yi ayrı mesajla göndermek yerine yeterince büyük gruplar halinde sonuç üret.

Worker çıktısını aktarılabilir typed array'lerle paketlemek büyük nesne grafiği kopyasını azaltabilir. Bunun için gerçek veri formatı ve sahiplik protokolü gerekir; mevcut JSON benzeri nesneye yalnız transfer listesi eklenemez. DWG girdi baytları zaten transfer ediliyor.

Cache anahtarları font içeriği/sürümü, metin biçimi, tolerans ve blok davranışını kapsamalı. ByLayer/ByBlock, ATTRIB, döndürme, aynalama, çizgi tipi ve kaynak renkleri korunmalı. Ekrana çizilecek koordinatları paketlemek ölçüm kaynağının hassasiyetini azaltmamalı; büyük dünya koordinatlarını koşulsuz Float32'ye indirme.

Mevcut MTEXT worker modu ayrı bir A/B adayı olarak ölçülmeli. Eski raporların soğuk/sıcak sonuçları ve açıklamaları tutarlı değil; varsayılanı açmak için yeni ölçüm gerekir.

**Beklenen etki:** Geometrisi ağır çizimler ve tekrar eden blok/metinler. Her çizimde yararlı olacağı veya küçük dosyalarda daha hızlı olacağı garanti değildir.

## Uygulama sırası ve karar kapıları

1. Ölçüm kapsamını düzelt; güncel HEAD üzerinde soğuk açılış ve gerçek SPA tekrar açılışını ayrı kaydet.
2. Kaynak/kurulum paralelliği ile ek DXF tarama maliyetini ayrı adaylar olarak karşılaştır.
3. Zaman bütçesi, ara render ve indeks üretimi değişikliklerini toplam süre + etkileşim gecikmesiyle değerlendir.
4. DWG worker oturumu ve parse-model cache'ini ayrı deneyler halinde ölç.
5. Geometri worker/paket formatına yalnız önceki ölçümler gerektiriyorsa geç.

Her aday için kaynakta kalıcı, sürümü belli patch veya küçük fork kullanılmalı. `node_modules` içinde elle bırakılmış ve temiz kurulumda kaybolan düzenlemeler release sayılmaz. Yeni motor yolu başlangıçta ayrı feature flag altında kalır; mevcut fallback zinciri ve golden restore kimliği korunur. Remote write'lar `AGENTS.md` politikasına göre toplu yapılır.

## Ölçüm düzeltmeleri ve kabul yaklaşımı

Mevcut `initCadPerfSession()` viewer startup içinde başlıyor; dosya tıklaması, route yüklemesi, orchestrator fast-cache çözümlemesi ve önceki teardown beklemesi toplamın dışında kalabilir. Uçtan uca sayaç dosya açma niyetinden başlamalı; alt fazlar kendi oturum kimliğini taşımalı.

`cad-perf-baseline.spec.ts` ağ metriği response `Content-Length` değerlerini topluyor. HEAD yanıtının bildirdiği dosya boyutu, o istekte gövdenin indirildiğini göstermez. Endpoint sınıflandırması da gerçek kaynak dışındaki istekleri içerebilir. Gerçek transfer baytları, istek yöntemi, cache durumu ve yalnız ilgili kaynak ayrı ölçülmeli.

İlk eleme için her dosyada en az 10 dönüşümlü A/B çalışma; p95 hakkında karar vermek için daha fazla tekrar (örneğin 30+) ve dağılım raporu kullanılmalı. Bunlar uygulanmış testler değil, önerilen deney tasarımıdır.

Matris: küçük DXF, 55,3 MB gerçek DXF, büyük gerçek DWG, MTEXT/HATCH/BLOCK ağırlıklı çizimler; soğuk bağlam, sıcak HTTP cache ile yeni sayfa ve RAM'in korunduğu SPA yeniden açılışı. Masaüstü ve mobil emülasyon ayrı; gerçek telefon doğrulaması ayrıca kaydedilir.

Kaydedilecekler: açma niyeti → ilk anlamlı görüntü, tam geometri/font hazırlığı, ölçüm/arama hazırlığı, parse/worker dönüşü/veritabanı/render alt fazları, toplam CPU, uzun işler, etkileşim gecikmesi, transfer, bellek ve 20 dosya aç/kapat döngüsünde kaynak birikimi.

Hız kazancı; Türkçe metin/font, dimension, hatch, linetype, lineweight, blok/attrib/OCS, layer/fit, mesafe/alan, hata/iptal/fallback doğrulamalarıyla birlikte kabul edilir. Canvas oluşması, tek ekran görüntüsü veya build başarısı geometri doğruluğunun kanıtı değildir. Desteklenmeyen içerik sessizce atılarak hız kazanılmaz.

## Dış teknik referanslar

- MLightCAD progressive seçenekleri: https://cad-viewer.readthedocs.io/en/v1.6.0/interfaces/_mlightcad_cad-simple-viewer.AcApOpenDatabaseOptions.html
- MLightCAD kaynak deposu: https://github.com/mlightcad/cad-viewer
- Worker aktarılabilir nesneler: https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Transferable_objects
- Structured clone sınırları: https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm

Kurulu sürümün yerel kaynak kodu bu incelemedeki uygulama bulgularının asıl dayanağıdır. Güncel web belgelerinin daha yeni API'leri mevcut sürümde var kabul edilmemiştir.
