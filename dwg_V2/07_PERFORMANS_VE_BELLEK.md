# 07 — Hız, bellek ve önbellek tasarımı

> **Araştırma katmanı:** Bu belgedeki alternatifler ve öneriler Gemini için seçim yetkisi değildir. Kullanıcının son talimatıyla [00 — EXEC-2](00_BAGLAYICI_UYGULAMA_KARARLARI.md) ve [19 — sabit uygulama sırası](19_GEMINI_ADIM_ADIM_UYGULAMA.md) geçerlidir. Çelişen seçim/scope ifadeleri tarihsel araştırma olarak kalır; Gemini uygulamaz.

[Dizin](README.md) · [Mimari](05_SISTEM_MIMARISI.md) · [Cihazlar](08_CIHAZLAR_VE_ETKILESIM.md) · [Ölçüm yöntemi](11_DOGRULAMA_PROGRAMI.md)

Buradaki rakamlar başlangıç deney bütçeleridir, uygulanmış performans sonucu veya her dosya için vaat değildir. Cihaz/corpus baseline'ı geldikten sonra güncellenebilir.

## Önce hangi süreyi iyileştiriyoruz?

| Metrik | Önerilen tanım |
|---|---|
| T-intent | Üç nokta menüsünde V2 seçiminin yapıldığı an |
| T-first-visible | Thumbnail dışındaki ilk gerçek geometri frame'i |
| T-first-useful | Referans ROI'nin ana geometri ve gerekli etiketleri görünür; pan/zoom kullanılabilir |
| T-full-ready | İlan edilen layout/profile için gerekli geometri/font/clip tamam; kalite sonucu mevcut |
| T-tools-ready | Katman, arama, snap/ölçüm gibi ilan edilen araçlar hazır |
| T-cached-reopen | Aynı source revision için tanımlanmış cache durumunda yeni açılış |
| Frame p95/p99 | Sabit gezinme senaryosundaki frame süresi dağılımı |
| Input latency | Pointer girdisinden görünen kamera/araç yanıtına süre |
| Peak memory | JS, WASM, CPU buffers, GPU ve geçici verilerin ölçülen/tahmin edilen tepe maliyeti |

T-first-useful ilk rastgele çizgi demek değildir. Bir küçük köşe çizildi diye bütün kat planı kullanışlı hale gelmez. T-full-ready de yalnız `canvas` oluşması veya parser Promise'inin çözülmesi değildir. Progressive renderer tam olmayan alanları kalite kaydıyla belirtir.

## Kazanç hipotezleri ve ters etkileri

| Hipotez | Kazanç yolu | Olası ters etki | Eleme deneyi |
|---|---|---|---|
| Tek parse + hazır sahne | Tekrar CPU/GC işini azaltma | Daha büyük disk/network | Cold ve warm ayrı; source/scene boyutu |
| Packed çıktı | Structured clone/JS object sayısını azaltma | Encode/decode ekstra CPU | Decoder sınırında süre ve peak RAM |
| Block instancing | Aynı geometriyi kopyalamama | Style/order varyant patlaması | Aynı/görünüşü farklı instance corpus'u |
| Görünür bölge culling | Ekran dışını çizmemek | İndeks maliyeti ve yanlış bounds | Full-scene kıyası + gezinme coverage |
| Küçük CPU iş dilimleri | UI yanıtını artırma | Daha düşük toplam throughput | Input p95 ve full-ready birlikte |
| Worker/WASM | UI blokajını ve allocation'ı azaltma | Startup/heap/transfer maliyeti | TS adayına eş içerikle A/B |
| Server türevi | Telefonun parse yükünü kaldırma | Kuyruk, ağ ve işletim | Yeni/önceden hazırlanmış dosya |
| LOD | GPU yükünü azaltma | İnce içerik kaybı | Dinlenmede full fidelity ve ROI kontrol |

## Ekran hareketi sırasında iş

Öneri: input olayları kamera hedefini günceller, RAF bir frame'de en son durumu tüketir. Kamera değişimi kaynak fetch/parse veya bütün text layout'unu tetiklemez. Görünürlük sorgusu, hazır buffer seçimi ve küçük uniform güncellemesi yeterli olan yol hedeflenir.

Kamera durağansa sürekli RAF çalıştırmak yerine dirty-frame yaklaşımı denenebilir. Yeni chunk/font geldiğinde veya kalite refinement'ı bitince yeniden çizilir. Mobil cihazda pil ve ısınma test edilir. Bütün nesneleri her frame yeniden sıralama, entity başına draw call ve büyük readPixels/getParameter sorguları sıcak yolda bulunmamalı. GPU işi azaltma ilkeleri için [WebGL uygulama rehberi](https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices).

### Draw order ile batching dengesi

Batch anahtarı kabaca layout/viewport/clip scope/order run/primitive/style olabilir. Bütün aynı renkleri tek batch'e toplamak örtüşmeyi bozabilir. Opak ve sırası bağımsız içerik daha serbest birleştirilir; wipeout ve transparan içerik order barrier olur. “Az draw call” ölçümü ile “doğru pafta” sonucu birlikte izlenir.

### İndeks ve bölümlendirme

Salt-okunur geometry için statik packed indeks iyi adaydır; blok tanımı yerel indeksi ve instance world bounds indeksi ayrı olabilir. Çok uzun çizgi, büyük hatch veya bütün paftayı kapsayan image her küçük tile'a kopyalanırsa bellek artar. Büyük kapsayıcı nesneler için ayrı bucket veya hiyerarşik node denenebilir.

Chunk hedefi ilk deneyde örneğin **128–512 KiB encoded** aralığında incelenebilir; gerçek decoded boyut ve GPU maliyeti daha belirleyicidir. Her küçük entity ayrı HTTP isteği yapmaz. İlk görünüm, seçili pafta, görünür çevre ve düşük öncelikli offscreen sırası değerlendirilebilir. Bölge sınırlarında linetype fazı, stroke join, hatch origin ve clip çizgileri kesilmez.

## Bellek hesabı

Peak bellek yalnız dosya boyutu değildir:

```text
input bytes + decompressed/native model + JS/IR data
+ scratch/tessellation + pending messages + GPU uploads
+ GPU resident data + glyph/image atlases + cache staging
```

Örnek olarak bir milyon LINE için dört Float64 uç koordinatı yalnızca 32 MB; iki uçlu Float32 XY pozisyonları 16 MB eder. Buna style/index/object/instance/spatial/text/WASM/GPU payları dahil değildir. Kalın çizgiler quad'a açılırsa vertex/index maliyeti artar. Bu hesap çizim benchmark'ı değil, veri düzeni karşılaştırmasıdır.

Önerilen ilk **V2'ye ait** resident buffer bütçeleri: telefonda 96–160 MiB, tablette 160–256 MiB, masaüstünde 256–512 MiB deney aralığı. Bunlar browser'ın güvenli RAM limitleri değildir; bazı cihazlarda daha aşağı gerekebilir. WASM heap ve browser/GPU'nin görünmeyen bellek payı ayrıca eklenir. Üretim eşiği gerçek cihazlara göre belirlenir.

Kritik ilke: allocation başarısız olduktan sonra toparlanmaya güvenmek yerine decoded uzunluk, chunk kredi sayısı, glyph atlas, görüntü megapikseli ve geometri iş bütçesi önceden sınırlandırılır. Dosya MB eşiği tek başına seçim modeli olmaz. Hacim kadar block expansion, text sayısı ve hatch complexity önemlidir.

## Üç ayrı cache

| Cache | Ne tutar? | Ne hızlandırır? | Sınır |
|---|---|---|---|
| Oturum RAM | Sıcak sahne/parça/glyph | Aynı SPA oturumunda dönüş | Sekme kapanınca kaybolur |
| Tarayıcı disk | Manifest ve prepared chunk | Aynı cihazda yeniden açılış | Quota, eviction, private mode |
| Server türev | Kaynak sürümünün hazırlanmış sahnesi | Başka cihazın ilk açılışı | Compute/storage/egress ve erişim |

HTTP asset cache'i bunlara ek olarak worker/WASM/font indirmesini azaltır; parse state'ini korumaz. OPFS ve IndexedDB A/B ile seçilebilir. Tarayıcı persistent storage talebi kabul edilse bile sonsuz alan veya bütün koşullarda kalıcılık sözü verilmez. [Storage kotaları](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria).

Cache anahtarı source revision/hash + dependency/font hash + decoder/scene schema + geometri toleransı içerir. Renderer shader sürümü geometriyi değiştirmiyorsa gereksiz bütün recompile yapmamak için render cache version ayrı tutulabilir. Source units yorumlama veya font mapping değişimi geometri/text cache'ini etkiler.

Kaynak kimliği hazırsa önce hash hesaplamak için 55 MB indirilmez; yetkili manifest lookup revision üzerinden yapılır. Hash daha önce upload sırasında veya güvenilen source metadata akışında hesaplanabilir. Cache miss, corrupt entry veya quota hatası terminal dosya hatası olmaz; kontrollü sil/yükle veya cache'siz çalışma denenebilir. Sonsuz yeniden üretim döngüsüne girilmez.

## Progressive kalite ve çalışma bütçesi

Ana thread işi için başlangıç deneyi frame başına yaklaşık 2–4 ms upload/commit; worker'da iptal/ilerleme için 5–15 ms civarı cooperative checkpoint olabilir. Bunlar öneri: daha küçük parçalara bölmek mesaj/yield maliyetini artırır. Bloklayan native çağrıya checkpoint ekleyemiyorsak timeout sonrası worker sonlandırılır.

Etkileşim sırasında DPR/LOD geçici azaltılabilir, ancak kritik yazılar kalıcı kaybolmaz ve durağan görüntü doğrulanan kaliteye döner. Sadeleştirme yalnız render türevinde yapılır. Kullanıcı “yüksek kalite” seçtiğinde sınırsız allocation değil, desteklenen kalite profilinde daha yavaş tamamlama beklenir.

## Başlangıç performans hedefleri

| Senaryo | Önerilen hedef; baseline sonrası ayarlanır |
|---|---|
| Küçük/orta, tüm girdileri sıcak çizim | First useful yaklaşık 1–2 sn |
| Hazır scene, iyi ağ, seçili pafta | İlk kullanışlı ROI yaklaşık 1–2 sn |
| Masaüstü pan/zoom | Hedef 60 Hz; frame p95 ≤ 20 ms, p99 ayrıca rapor |
| Orta seviye telefon, ağır çizim | Hedef ≥30 Hz; frame p95 ≤ 33 ms |
| Girdi yanıtı | p95 ≤ 100 ms başlangıç hedefi |
| Kullanıcı iptali UI karşılığı | Yaklaşık ≤200 ms; backend cleanup ayrı takip |

R004 gibi büyük, cold parse gereken çizime bütün cihazlarda 1 sn vaadi verilmiyor. İyileşme adayı için aynı fidelity'de full-ready/peak memory/etkileşim regresyonları da raporlanır. Önerilen ilerleme eşiği: hedef yavaş sınıfta median en az %25–30 iyileşme veya belirgin stabilite/bellek kazanımı; bunun karşılığında başka sınıfta ciddi kötüleşme varsa neden ve tradeoff kaydı. Bu yüzdeler ürün tercihi olup ölçüm değildir.
