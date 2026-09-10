# 23 — Astra denetimi ve Gemini düzeltme döngüsü

[Dizin](README.md) · [48 gereksinim](24_GEREKSINIM_KATALOGU.md) · [Kanıt düzeni](20_KAYIT_VE_KANIT_SISTEMI.md) · [Devir](uygulama/DENETIM_DEVRI.md)

Çalışma döngüsü: **Astra karar verir → Gemini uygular ve kaydeder → Astra bütün gereksinimleri denetler → Astra FIX/karar revizyonu yazar → Gemini yalnız bu düzeltmeleri uygular → Astra tekrar doğrular.** Bu belge gelecekteki inceleme yöntemidir; şu anda uygulama veya bağımsız motor denetimi yapılmış değildir.

## Kullanıcının Astra'ya verebileceği kısa talimat

> Gemini DWG Motor V2 uygulamasını tamamladığını söylüyor. dwg_V2/00_BAGLAYICI_UYGULAMA_KARARLARI.md, 20_KAYIT_VE_KANIT_SISTEMI.md, 23_ASTRA_DENETIM_VE_DUZELTME_DONGUSU.md ve uygulama/DENETIM_DEVRI.md ile başla. Yalnız raporları okuma: gerçek diff, kaynak, worker/asset, test, UI ve veri akışını incele. 24 numaralı katalogdaki 48 gereksinimi tek tek eşle ve kanıtla. Gemini'nin PASS beyanı bağımsız kabul değildir. Eksikleri AUD/FIX kimlikleriyle yaz; Gemini'ye teknoloji seçtirmeden somut düzeltme planı hazırla. Modern/kaliteli arayüzü gerçek ekranlarda ayrıca denetle. Mevcut motor ve üretim verileri korunacak.

## A0 — Teslimi tanı, değişikliklerin kimliğini sabitle

Repo talimatlarını, geçerli EXEC revizyonunu, en son SNAP ve tüm açık CR/FIX kayıtlarını oku. Güncel HEAD/status, untracked dosyalar, package/lock, compiler/worker/WASM/font ve build kimliklerini kanıtla karşılaştır. İnceleme başladığında bir AUD kimliği aç. Gemini aynı anda kod değiştiriyorsa inceleme kapsamına sabit snapshot bağla; hareketli hedefi geçmiş testle kabul etme.

Eksik dosyayı veya raporu model belleğiyle tamamlamaya çalışma. Snapshot yoksa önce gerçek ağacı kaydet, geçmiş iddiaların hangi koda ait olduğunun bilinmediğini belirt. Kullanıcının başka işlerini restore/delete etme. Dört legacy hash'in eşliği yararlı ama ortak route/cache/dependency üzerinden davranış bozulmuş olabileceği için tek başına yeterli değil.

## A1 — Her gereksinime ayrı kaynak ve kanıt kontrolü

R01'den R48'e sırayla git. Her satırda beklenen davranış, gerçek dosya/sembol, testin neyi assert ettiği, RUN/ART/SNAP, kanıtın güncelliği ve sonuç bulunur. Dosya adında “v2” olması veya kod yorumunda gereksinimin yazması uygulama kanıtı değildir.

Raporlanan test kodunu da incele: assertion var mı, doğru route'a mı bakıyor, hata catch edilip yutuluyor mu, fixture eski motoru mu çalıştırıyor, mock source/scene dönüyor mu, skip koşulu hep true mu, retry test hatasını gizliyor mu, expected baseline aynı V2 çıktısıyla mı güncellenmiş? Toplam PASS sayısına göre kabul verme. Bir R birden fazla koşul içeriyorsa her birinin durumunu yaz.

## A2 — Uçtan uca gerçek dosya akışı

Yerel izole ortamda kullanıcı menüsünden gerçek DWG ve gerçek DXF aç. Akışı izle: yetki/revision → gerçek compiler job veya hazır türev → manifest/chunk → browser validation → V2 renderer → görünür doğru pafta. Aktif engine kimliğini ve source hash'ini doğrula. İndirilen thumbnail/legacy canvas'ı V2 sanma. Hazır türev cache'i kapatılmış çalıştırmada gerçek decoder invocation olmalı.

Liste/grid/telefon/public menüleri; seçili A iken B menüsü; normal route; query allowlist; back/refresh; aynı revision yeni lease; yeni revision eski job; V2'dan legacy'ye manuel geçiş. Bunlar birbirinden ayrı kontrol edilir. Büyük raw dosya Vercel body üzerinden gidiyorsa mimari ihlalidir.

## A3 — Mesleki çizim doğruluğu

Blok/OCS/units/bulge/Float64, Türkçe SHX/MTEXT, dimension override, hatch delik/ada, linetype/lineweight, draw order/wipeout, model/layout/twisted viewport/frozen layer ve XREF incele. En az bir yeni bağımsız fixture veya holdout ROI ile uygulamanın kendi testlerine aşırı uyarlanmadığını sına.

Geometri testi analitik beklenen değer kullanır. Metin, font hash ve ankrajıyla; pafta, bağımsız reference-app ayarlarıyla; görsel, genel resim ve kritik crop'la birlikte ele alınır. Büyük boş arka planlı SSIM kayıp donatı yazısını gizleyebilir. Kritik değer yanlışsa genel benzerlik yüksek olsa da bulgu açıktır. AutoCAD/reference yoksa bunu varmış gibi telafi etme; ilgili kabul NOT_RUN olur.

## A4 — Hız, bellek ve stabilite

Ham tekrar verisini yeniden hesapla. Cache koşullarını, hazırlık süresinin hariç tutulup tutulmadığını, CPU/cihaz/kalite eşliğini kontrol et. “2 saniye” içindeki route/auth/fetch/module/decoder sınırlarını gör. Median/IQR ve örneklem boyutu; p95/p99 iddiasının dayanağı; transferSize ile Content-Length ayrımı; ölçülen ile tahminî bellek ayrımı bulunmalı.

Temsilî cold ve warm/server-prepared yolları yeniden çalıştır. %20 hedefi tutmayan dosya sınıfını silme. UI daha hızlı görünürken bütün text/hatch kaybolduysa hız başarısı kabul edilmez. 20/100 aç-kapat, worker/context sayısı ve RAM plato; iptal; background/rotation; context loss; stale sonuç; compiler ölümünü sınama kayıtları doğrulanır. Yerel emülasyon fiziksel telefonun yerini tutmaz.

## A5 — Arayüzü gerçekten aç ve gör

21/22'yi tasarım hakemi olarak kullan. UI01–UI20 ve zorunlu viewport/tema setinde ekranlara bak. Gemini'nin eski screenshot'ını tek kanıt alma; güncel SNAP için temsilî ekranları tekrar üret. Loading, degraded, error, empty, public, mobile sheet ve keyboard durumlarını özellikle aç.

Modernlik ve kalite değerlendirmesi somut yazılır: örneğin “390 px'de Katmanlar sheet'inin kapatma düğmesi klavye altında kalıyor”; “açık temada durum metni ölçülen kontrast eşiğini karşılamıyor”; “topbar iki satıra çıkıp çizim alanını gereksiz daraltıyor”; “kaynak yazıları yanlış fontla render edilmiş”. “Daha lüks olsun” tek başına uygulanabilir FIX değildir; etkilenen UI, token/yerleşim ve hedef ekran belirtilir.

Arayüzün doğru çalışması ve estetik kalitesi ayrı sonuç alır. Kullanıcıya çalışmayan ölçüm düğmesi, uydurma performans rozeti, fake progress, demo katman listesi veya her state'te aynı SVG sunulmuşsa açık bulgudur. Tema değişiminin canonical/kamera/parse state'ini bozmadığını da kontrol et.

## A6 — Erişim, işletim ve mevcut sistem

Tenant/public/expired token, tahmin edilebilir chunk ID, bağımlılık path/SSRF, zip/recursive block/length sınırları, dosya ve cache gizliliği, job lease/fencing/retry/cancel testleri incelenir. Üretim verisi üzerinde yıkıcı deneme yapılmaz. Yerel DB/storage fixture'ı kullanılır.

Dependency/runtime asset hash eşliği ve gerçek font varlığı; Linux compiler/build; private Blob/cache header'ları; health/log/redaction; kill switch/rollback ve orphan cleanup sözleşmesi kontrol edilir. Production host yoksa local code'a bakarak canlı işletim PASS yazılmaz. Legacy dosya hash'leri yanında normal menü/route ve ilgili eski release akışı tekrar doğrulanır.

## A7 — Sonuç ve düzeltme planı

Her R için ACCEPTED, FINDING_OPEN veya RECHECK_REQUIRED/NOT_REVIEWED kaydı ver. Eksik çalışma sonucu NOT_RUN diye görünür; otomatik fail/PASS uydurulmaz. Değerlendirme üç ayrı satırdır: yerel uygulama kabulü, gerçek cihaz/profil kabulü, production kabulü. Bütün maddeler çözülmeden “komple plan doğru yapılmış” denmez.

| Öncelik | Örnek | Etki |
|---|---|---|
| P0 | Yetkisiz özel çizim erişimi, üretim verisi kaybı | Kullanım/release durur |
| P1 | Yanlış kritik ölçü/metin/geometri, dosya açamama, legacy bozulması, temel mobil akışın çalışmaması | Ürün kabulü engellenir |
| P2 | Eksik zorunlu senaryo, ölçülemeyen hedef, önemli UI kusuru, kanıt boşluğu | İlgili R kapanmaz |
| P3 | Dar kapsamlı görünüş/metin/temizlik kusuru | Yine atanmış FIX ile takip edilir; Gemini kendisi kabul istisnası vermez |

Öncelik ile kapsam ayrı: P3 diye gereksinim otomatik silinmez. Kabul istisnası gerekiyorsa kullanıcı/Astra açık kapsam revizyonu yapar. Gemini uygulanabilir olmayan eşiği kendi kararıyla düşüremez.

## FIX kaydının zorunlu içeriği

FIX-NNN / AUD-NNN, R/G/UI/D kimliği, severity, gözlenen sorun, tekrarlama adımları, source/line/sembol ve snapshot, beklenen davranış, ham kanıt; **tek seçilmiş düzeltme yolu**, değişecek dosya/sınır, dokunulmayacak alan, bağımlı FIX'ler, çalışacak test ve kabul ölçüsü. Belirsiz “refactor et / optimize et / modernleştir” talimatı verilmez.

Mimari değişecekse önce Astra EXEC revizyonu yazar; Gemini'ye “A/B'den iyi olanı seç” demez. Düzeltme yalnız mevcut sözleşmedeki bug ise eski karar korunur. Aynı kök nedenden çok R etkileniyorsa tek FIX birden çok R'yi kapsayabilir; R izleri kaybedilmez.

## Gemini'ye düzeltme turu talimatı

> Yalnız uygulama/DENETIM_TURLARI.md içindeki son Astra turunda atanmış açık FIX kayıtlarını, belirtilen bağımlılık sırasıyla uygula. Mimari/teknoloji seçme, kapsam büyütme, ilgisiz refactor yapma. Her FIX için önce hatayı güncel snapshot'ta tekrarla; sonra belirtilen düzeltmeyi yap ve fix testiyle etkilediği regresyonları çalıştır. İlk başarısız kanıtı koru, yeni RUN/SNAP kaydet. FIX'i “IMPLEMENTER_VERIFIED / Astra yeniden kontrolü bekliyor” yap; kendi başına CLOSED/ACCEPTED yazma. Yeni engel varsa CR aç ve bağımsız atanmış FIX'lerle ilerle. Sonunda güncel devir ve eksik listesini teslim et; production push/deploy yapma.

## Yeniden kontrol ve bitiş

Astra yeni SNAP'ta FIX'in kendi reproducer'ını, etkilenen R'leri ve temel end-to-end/legacy/tema smoke'unu yeniden çalıştırır. Geometry/text/scene şeması değiştiyse ilgili holdout/fidelity/perf alanları; host/lease/cache değiştiyse yarış/erişim; UI token/layout değiştiyse iki tema ve dar ekran yeniden kontrol edilir. Etkilenmeyen pahalı testleri neden olmadan tekrar etmek gerekmez.

Bir FIX'in “kod değişti” durumu kapanış değildir. Yeni sonuç karşılandıysa Astra ACCEPTED yazar; karşılanmadıysa aynı FIX'i yeniden açar ve yeni RUN ile devam eder. Önceki AUD/FIX sonucu silinmez. Bütün zorunlu R'ler kabul edildiğinde ve açık risk/operasyon durumu doğru anlatıldığında denetim turu kapanır. Production deployment ayrıca gerçek ortam kanıtı gerektirir; yerel kabul otomatik production izni değildir.

## EXEC-2 denetim eki

[26](26_PLAN_DENETIMI_VE_EXEC2.md) önceki plan bulgularını oku. [Alt kabul kaydındaki](uygulama/ALT_KABUL_DURUMLARI.md) 78 N/V/C/F satırını ana R ile birlikte doğrula; eski EXEC-1 kanıtını yeni Three/D3/metadata/lifecycle için geçerli kabul etme. Kaynak paket sürümü ve kullanılan import yolu, worker/renderer ABI, G04-B kanıtı, D3 window cleanup ve shader draw order özellikle incelenir. Düzeltme FIX kimliği etkilenen alt kabul ID'lerini de taşır.

## U2 denetim sınırı

Lisans envanteri veya ayrı lisans raporu eksik diye bütün teknik kabul reddedilmez. R39 teknik kimlik/asset kabulüdür. Notice/kaynak sunumu gibi gerçek dağıtım koşulları 00 D22/U2'ye göre ayrı paketleme kaydıdır; somut sorun yalnız ilgili artifact'a bağlanır. İlgisiz doğruluk, UI ve hız işleri devam eder.
