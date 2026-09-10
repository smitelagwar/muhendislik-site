# 11 — Corpus, doğruluk, benchmark ve kabul programı

> **Araştırma katmanı:** Bu belgedeki alternatifler ve öneriler Gemini için seçim yetkisi değildir. Kullanıcının son talimatıyla [00 — EXEC-2](00_BAGLAYICI_UYGULAMA_KARARLARI.md) ve [19 — sabit uygulama sırası](19_GEMINI_ADIM_ADIM_UYGULAMA.md) geçerlidir. Çelişen seçim/scope ifadeleri tarihsel araştırma olarak kalır; Gemini uygulamaz.

[Dizin](README.md) · [Doğruluk atlası](06_DOGRULUK_ATLASI.md) · [İş paketleri](13_IS_PAKETLERI.md) · [Deney raporu](sablonlar/DENEY_RAPORU.md)

Bu programın testleri henüz yürütülmedi. Yerel dosya hash/başlık/kayıt envanteri gerçekten üretildi; motor doğruluğu ve hız sonuçları hâlâ ölçülecek. Hedef, uygulayıcının bu iki durumu karıştırmadan ilerleyebilmesi.

## Dört ayrı doğrulama katmanı

1. **Format:** Doğru dosya sürümü, byte kodlaması, section/handle/owner ilişkileri ve nesne alanları okunuyor mu?
2. **Semantik ve geometri:** Kaynak anlamı, transform, units, metin, dimension ve görünür instance doğru mu?
3. **Görsel:** Aynı camera/layout/font/display ayarında referans görünüşe uyuyor mu?
4. **Ürün:** Yetkili dosya menüsünden açılış, etkileşim, retry/iptal, cihaz ve teardown gerçekten çalışıyor mu?

Build/typecheck yalnız entegrasyon doğrulamasıdır. Canvas varlığı görsel doğruluk; entity count>0 tam içerik; HTTP 200 başarılı parse; worker Promise resolve ise stabil açılış kanıtı değildir.

## Corpus oluşturma

### Başlangıç gerçek dosyalar

[Yerel corpus JSON'u](arastirma/yerel-corpus.json) dört dosyanın SHA-256 kimliğini verir. R001–R003 AC1032 DWG, R004 büyük AC1021 DXF. Bunlar ilk ölçüm grubudur; bütün mimari/statik iş yükünü temsil ettiği varsayılmaz. Dosyaları test için yeniden adlandırmak formatını değiştirmez.

Gerçek DWG decode testi yalnız uzantıya bakmaz; kaynak magic, revision, byte hash ve decoder invocation kanıtı kaydedilir. Historical baseline'daki “cached-derivative.dwg” adıyla kullanılan küçük DXF fixture, cache routing testi olabilir; güncel DWG parser başarısı olarak sayılmaz.

### Özellik fixture'ları

Mevcut [DXF fixture alanı](../tests/fixtures/dxf) ve [CAD fixture alanı](../tests/fixtures/cad-preview-v2) yeniden değerlendirilebilir. Örnekler: block transforms, OCS, bulge signs, wide polyline, Türkçe metin, rotated MTEXT, layouts, layer states ve bilinen ölçü geometrisi. Fixture'ın önceki testte bulunması V2'de geçtiği anlamına gelmez.

Eksik örnekler için öneri: binary DXF, çoklu XREF + XCLIP, SHX exact font, nested non-uniform block, iki viewport'ta farklı frozen layer, stacked dimension tolerance, MTEXT columns, wipeout order, OLE tablo ve dynamic/proxy saved state. Sentetik fixture deterministic seed/parametrelerle üretilebilir. DWG eşleri lisanslı referans araçla kaydedilerek dış uyumluluk kontrol edilir.

### Gerçek corpus genişlemesi

Öneri: önce 12–20 temsilî çizim; pilot öncesi 50–100 farklı çizim. Architectural/statik, üretici uygulama, format yılı, text/hatch/block ağırlığı, koordinat ölçeği, pafta/XREF ve dosya boyutu katmanları dengelenebilir. Bunlar hedef örneklem sayıları; elde var sayılmaz.

Corpus'u eğitim/optimizasyon ve holdout olarak ayırmak mimariye özel aşırı uyarlamayı azaltır. Hatalı örnek minimize edildikten sonra regression setine alınır; holdout'a da yeni gerçek örnek eklenir. Gerçek özel dosyalar public GitHub fixture'a çevrilmez; paylaşım hakkı olmayan çizim için anonim sentetik eş üretilebilir.

### Manifest alanları

```text
fixtureId, sha256, formatFamily, producer/version if known
sourceKind(real/synthetic/malformed), privacy/license, byteSize
fonts + hashes, xrefs + hashes, underlays, units evidence
layouts, chosen view, feature tags, known limitations
referenceApp/version/settings, reference image + numeric oracle
expected coverage, critical ROIs, test tier, holdout flag
```

Entity sayıları source/definition/expanded instance/render primitive olarak ayrı tutulur. R004 lexical sayımı yalnız ilk ikisi için başlangıç ipucudur; tam semantik sayım henüz yok.

## Bağımsız doğruluk oracle'ı

Referans önerisi: lisanslı AutoCAD veya dosyayı üreten uygulamada aynı dosyayı aç; eksik font/XREF olmadığını doğrula; model/layout, camera, visible layer, background, lineweight/plot stili ve viewport boyutunu kaydet. Her paftada genel görünüş + kritik detay ROI'leri saklanabilir. Autodesk/ODA/ezdxf karşılaştırmaları ek sinyal sağlar; hiçbiri konfigürasyonsuz mutlak piksel hakemi değildir.

V2'nin kendi parser'ıyla üretilen JSON'u yine V2'nin çıktısıyla karşılaştırmak bağımsız oracle olmaz. Saf geometri için analitik beklenen değerler; CAD semantics için başka okuyucu ve kaynak uygulama; görsel için sabit referans ayarları birlikte kullanılır. Uyuşmazlıkta çoğunluk oylaması yerine kaynağın gerçek anlamı araştırılır.

Font hash'i yanlışsa pixel diff sonucu doğru yorumlanamaz. Anti-alias farkı ile kayıp metni ayırmak için glyph/etiket bounding box, edge-distance, OCR yalnız yardımcı kontrol, crop ve sayısal ankraj birlikte kullanılabilir. SSIM tek başına büyük boş arka plan yüzünden yanıltıcı olabilir.

## Önerilen kabul sınıfları

| Sonuç | Anlam |
|---|---|
| PASS | İlan edilen profil ve tüm kritik kontroller geçti |
| DEGRADED | Kullanılabilir ama bilinen içerik/kalite sınırlaması var |
| FAIL | Kritik geometri/anlam, güvenilirlik veya erişim hatası |
| UNSUPPORTED | Bu profil motorun ilan edilen kapsamı dışında |
| NOT RUN | Deney çalışmadı veya kanıt yok |

DEGRADED/UNSUPPORTED dosyalar başarı yüzdesinin paydasından sessizce çıkarılmaz. Hem hedef corpus'un tümü hem ilan edilen profil alt kümesi ayrı raporlanır. Kritik ölçü/donatı yazısı yanlışsa genel pixel score yüksek olsa da FAIL olabilir.

### Sayısal ve semantik kontroller

- Line endpoint ve circle radius için tanımlı kaynak-birim toleransı.
- Bulge sign/full arc/non-uniform block altında analitik nokta denetimi.
- Çok büyük world origin + çok küçük detay fixture'ı.
- OCS ±Z/eğik normal, iç içe block, attrib owner ve instance yolunun eşliği.
- Açık/gizli/frozen/locked layer ile viewport overrides'ın beklenen görünürlüğü.
- Metin içeriği, Unicode/codepage sonucu, ankraj/advance, dimension override.
- Hassas mesafe/alan varsa canonical koordinattan sonuç; türetilmiş ekran mesh'inden değil.

Kaynak birime ve geometry scale'e göre tolerans raporda sayısal verilir. “Yaklaşık eşit” belirsiz bırakılmaz. Başlangıç örneği olarak lokal test geometrisinde `1e-8` mutlak veya `1e-10` göreli çizim-birimi toleransı düşünülebilir; aşırı koordinatlar ve gerçek CAD yuvarlamalarıyla kalibre edilir. Ekran tessellation hedefi örneğin 0,25–0,5 CSS px olabilir; ölçüm toleransı bununla eşitlenmez.

### Metamorphic testler

Aynı çizimi büyük bir vektörle taşımak, bilinen açıyla döndürmek veya eşdeğer block içine almak ölçü/topolojiyi beklenen biçimde korumalı. Tek parça ile farklı chunk sınırları aynı viewport görünüşünü vermeli. Cache'ten açılan ve yeniden derlenen scene aynı kalite/provenance'a sahip olmalı. Layer toggle sadece hedef visibility'yi değiştirmeli; mevcut geometrinin koordinatları mutasyona uğramamalı.

## Benchmark deney tasarımı

### Ölçüm başlangıcı

Sayaç dosya açma niyetinde başlar. Route/auth/network/module init/decoder/normalizer/compile/transfer/GPU/first-useful/full-ready alt span'ları aynı session ID ile korele edilir. Main ve worker `performance.now()` değerleri farklı time origin'den gelebilir; normalize edilmeden çıkarılmaz. Server süreleri client saatinden ham çıkarılmaz; server kendi duration'ını raporlar.

### Dört cache durumu

1. **Cold:** Yeni context, kaynak/asset/scene cache koşulları sıfırlanmış veya açıkça tarif edilmiş.
2. **Warm HTTP:** Yeni sayfa, sıcak network asset cache; JS/WASM instance soğuk.
3. **Warm SPA:** Aynı sayfa/oturum; kaynak veya scene RAM cache sıcak.
4. **Cross-device prepared:** Server türevi hazır, ikinci cihaz ilk kez açıyor; yerel cache soğuk.

OS/CDN cache tamamen temizlenemiyorsa “tam cold” denmez. Network shaping actual bandwidth/latency ile belirtilir. Source ve scene cache durumları birbirinden ayrılır.

### Eşitlik koşulları

Eski motor ve V2 aynı source revision/font/XREF/layout/display içeriğini gösterir. Eski motorun gerçek seçtiği yol (`cached-dxf`, direct DWG, fallback) kaydedilir. Birinde hazır türev, diğerinde cold decode karşılaştırması ürün senaryosu olabilir; parser hız farkı diye sunulmaz. Biri daha az metin/hatch çiziyorsa performans tablosunda fidelity farkı görünür.

İlk eleme için dosya başına 10 dönüşümlü A/B tekrar makul. Sonuç kararı için 30+ tekrar median/IQR incelemesini güçlendirir; p95/p99 kuyruk iddiası küçük örneklemle güvenilir değildir. Önemli sınıflarda örneğin 50–100+ tekrar, bootstrap aralığı ve yeterli örnek uyarısı düşünülebilir. Sıra randomize edilir; ısınma/termal durum ve background uygulamalar kaydedilir. Outlier'lar sebepsiz silinmez.

### Ağ ve bellek ölçümü

`Content-Length` HEAD yanıtında gövde indirilmiş anlamına gelmez. DevTools/CDP veya desteklenen Resource Timing `transferSize/encodedBodySize/decodedBodySize` alanları, method/cache/source sınıfıyla birlikte kullanılır. Cross-origin timing kısıtları varsa alan `unavailable` kalır, sıfır sayılmaz.

JS heap, WASM heap, uygulamanın buffer hesabı ve browser process memory ayrı raporlanır. GPU belleğinin tüm tarayıcılarda taşınabilir kesin ölçümü yok; buffer/texture tahmini “ölçülen GPU RAM” etiketi almaz. Gerçek iOS tab reload/OOM davranışı başlı başına kanıttır. Heap snapshot/forced GC yalnız diagnostic olabilir; normal kullanıcı benchmark'ına karıştırılmaz.

## Stabilite ve hata enjeksiyonu matrisi

| Senaryo | Gözlenebilir sonuç |
|---|---|
| A açılırken B, B açılırken C | Yalnız C görünür; eski session state yazamaz |
| Parse sırasında iptal | UI terminal cancelled; retry/fallback kendiliğinden başlamaz |
| Worker error/messageerror/timeout | Sınıflı hata; sonsuz loading yok |
| WebGL context loss/restoration | Kontrollü toparlanma veya belirgin terminal sonuç |
| 20 → 100 aç/kapat | Bounded resident kaynak; worker/context/listener sayısı büyümez |
| Network kopması/expired lease | Yetkili renewal veya sınıflı erişim hatası |
| Quota dolu/corrupt cache | Cache'siz yol veya bir kontrollü yeniden üretim |
| Eksik font/XREF/proxy | Dosyanın kalite kaydı ve etkilenen kapsam görünür |
| Malformed length/recursive block | Kaynak sınırında sonlanma; süreç kapanır |
| Public token süresi doldu | Orijinal ve türev erişimi kapanır |
| Source revision hazırlıkta değişti | Eski job yeni sürümün türevi olamaz |
| Sunucu işçi ölümü | Lease sonrası bounded retry; tek ready output |

Bellek testinde cache'in bilinçli sıcak kalması ile leak ayrılır. İlk birkaç açılıştan sonra kararlı plato ve dispose sonrası kaynak sayısı incelenir; GC'nin hemen RAM'i OS'ye iade etmesi şart koşulmaz.

Crash-free hedef örneği pilot için ≥%99,5 olabilir, ama kanıt için örneklem gerekir. Sıfır hatalı yaklaşık 600 bağımsız denemede “rule of three” üst failure tahmini yaklaşık %0,5'tir; aynı dosyayı aynı koşulda 600 kez açmak bütün kullanıcı evrenini temsil etmez. İstatistik hedefi ürün profilini ve gözlem aralığını taşır.

## Mevcut sistemin korunması

V2 seçilmemişken mevcut route, core hash, fallback ve navigation davranışları kontrol edilir. Entegrasyon aşamasında mevcut `check:cad-preview-v2`, `check:cad-real-user-release` ve ilgili Drive testleri kapsamına göre seçilebilir; çalıştırmadan fixture izolasyonu/config okunur. Yeni `check:cad-v2:*` isimleri şu anda yoktur; ileride eklenirse komut tanımı ayrıca kaydedilir.

Testler kullanıcının `.data/dok_db.json` ve gerçek upload storage'ını değiştirmez. İzole `DOK_LOCAL_DATA_DIR` ve test fixture ortamı kullanılır. Test scripti `finally` cleanup, bounded navigation/selector/outer timeout ve hata halinde nonzero exit taşır; [repo test standardı](../.agents/rules/test-ve-otomasyon-standardi.md) uygulanır. Log FAIL iken exit 0 dönen kapı PASS sayılmaz.

## İlk tam kabul raporunun içeriği

Commit/dependency/asset kimlikleri; dosya ve font/XREF hash'leri; browser/cihaz/OS; cache/network koşulu; tüm tekrarların ham verisi; median/tail/dağılım; kritik ROI ve sayısal oracle sonuçları; active engine path; unsupported/degraded listesi; memory ölçüm yöntemi; kapanış kaynak sayısı; regresyon ve bilinen sınırlar.

Üç ayrı karar üretilebilir: **teknik prototip başarılı**, **sınırlı kullanıcı pilotuna uygun**, **ilan edilen profil için ürün seçeneği olarak hazır**. Birinin geçmesi diğerlerini otomatik tamamlamaz.
