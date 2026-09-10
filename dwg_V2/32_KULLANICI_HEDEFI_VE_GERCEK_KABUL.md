# 32 — Kullanıcının CAD görünüşü ve gerçek kullanım kabulü

[Dizin](README.md) · [Kararlar](00_BAGLAYICI_UYGULAMA_KARARLARI.md) · [Doğrulama](11_DOGRULAMA_PROGRAMI.md) · [Durum](uygulama/DURUM.md)

**EXEC-2 / U1 kullanıcı netleştirmesi · 06.09.2026.** Kullanıcı inşaat mühendisi olarak 2D mimari, statik ve plan dosyalarını web sitesinde AutoCAD'de açıyormuş gibi rahatça incelemek istiyor. AutoCAD, GstarCAD ve ZWCAD'deki klasik CAD görünüşü hedef. Bu belge Gemini için bağlayıcı ürün/kabul ekidir; teknoloji seçme yetkisi vermez.

## Çizimin görünüşü

Kaynak çizim estetik amaçla yeniden yorumlanmayacak. Katman/nesne renkleri, çizgi tipleri ve fazları, kalınlıklar, polyline genişliği, block/attribute yerleşimi, Türkçe yazı/font/MTEXT, ölçü yazıları ve okları, hatch/desen/adalar, draw order, wipeout, XREF, pafta ve viewport bağlamı kaynak görünüşe göre korunacak. Hız veya modernlik için bunların atılması, sadeleştirilmesi veya başka fontla sessiz değiştirilmesi kabul değil.

Modern ve lüks tasarım, çizimin çevresindeki araçlar/paneller/durum anlatımı için geçerlidir. CAD çizimini marka renkleriyle yeniden boyamak, kaynak yazılarını UI fontuyla değiştirmek veya kaynağa ait çizgi kalınlığını dekoratif tercihle değiştirmek yok. Tek renk/zemin/lineweight kullanıcı görünüm ayarları 30'daki açık komutlar olarak kalır; ilk açılış kaynak görünüşündedir.

“AutoCAD gibi” hedefi kaynak DWG düzenleme, komut satırı, 3D veya yeni ölçüm aracı kapsamını kendiliğinden açmaz. Bu turda kaynak ölçülerinin doğru görüntülenmesi ve güvenilir 2D inceleme esastır.

## Referans profil ve karşılaştırma

Ana karşılaştırma hedefi **AutoCAD'deki eşlenmiş 2D görünüş**. GstarCAD/ZWCAD kaynak uygulama veya ek karşılaştırma kaynağı olarak kayıtlanabilir. Kullanıcı bu programları hedef olarak belirtti; bilgisayarında hangisinin kurulu/lisanslı olduğu ve sürümü henüz doğrulanmadı. Uygulayıcı kuruluymuş gibi RUN oluşturmaz. Üç programda da her dosyanın açılması zorunluluğu çıkarılmaz; tek sabit ana referans ve kaynak uygulama kanıtları ayrı tutulur.

G01'de her fixture için REF profili kaydedilecek:

- Source dosyası/revision/SHA-256, model veya pafta, viewport ve görünür katmanlar.
- Gerçek referans program/sürüm; kullanılan font/SHX, XREF ve diğer bağımlılıkların kimlikleri; eksik içerik uyarıları.
- Çizim zemini, kaynak renk modu, lineweight görünümü, linetype/annotation ölçekleri ve varsa CTB/STB ile plot-style gösterim durumu.
- Kamera/çizim kapsamı, viewport CSS/pixel boyutu, ekran ölçeklendirmesi; genel görünüş ve aynı dünya bölgelerindeki detay görüntüleri.

Referans görsel düzeni Astra denetimine kaydedilir. Gemini test geçsin diye referans ayarını/golden'ı değiştiremez, farklı program sonuçlarından işine gelen parçaları birleştiremez. Erişilemeyen ana referans için görsel kabul NOT_RUN kalır; sayısal test ve bağımsız geliştirme sürer. Kaynak programlar uyuşmazsa source/ayar/font farkı ayrı kusur kaydıdır; çoğunluk oylaması veya “yaklaşık benziyor” kararı yok.

**29'daki ekran lineweight sunum kuralı varsayılan profildir, AutoCAD eşliğinin kanıtı değildir.** Aynı referans görünümünde kalınlık/desen/yazı veya pafta stili farklıysa ilgili kabul maddesi açık kalır. CTB/STB veya seçilmiş okuyucunun taşımadığı bir stil davranışı gerekiyorsa Gemini bunu yok saymaz; gerçek dosya/REF/ROI ile CR açar. Astra gerekli algoritma/sözleşme revizyonunu verir. Bu hedef için mevcut okuyucunun yeterli olacağı peşinen kabul edilmez.

Kritik ROI'ler: aks kesişimi, donatı/ölçü yazısı, ince paralel çizgiler, kesikli çizgi devamı, yoğun hatch, block içi attribute ve farklı ölçekli pafta viewport'u. Semantik kayıp sıfır olmalı; raster anti-alias farkları, önceki sayısal/geometrik toleranslarla birlikte ayrı değerlendirilir. Bütün cihazlar ve programlar için byte/piksel eşliği vaat edilmez.

## Kullanıcının gerçek test cihazları

| Cihaz | Erişim / kabul durumu |
|---|---|
| Kullanıcının bilgisayarı | Kullanıcı kontrol edecek; CPU/GPU/RAM, OS, browser ve ekran ölçeği test sırasında kaydedilecek; henüz performans sonucu yok |
| Poco X6 Pro | Kullanıcı gerçek telefonda kontrol edecek; OS/browser sürümü, ekran yönü ve ağ test sırasında kaydedilecek; henüz runtime PASS yok |
| iPhone/iPad ve diğer tabletler | Erişim doğrulanmadı; geniş cihaz hedefi korunur, ilgili kabul NOT_RUN kalır |

İlk kullanıcı kabul turu bilgisayar + Poco X6 Pro'dur. Her ikisinde aynı source revision için ilk hazırlama, hazır sahne açma, ikinci cihazda açma, yakın detay inceleme, pan/±/fit, layer/layout, arka plana alıp geri gelme ve art arda aç/kapat denenir. Telefonda tek/iki parmak geçişi, portre/yatay, sheet/klavye ve mobil ağdan yeniden yükleme ayrıca kaydedilir. Wi-Fi/mobil ağ ve cache durumu sonuçların yanında bulunur.

Gemini izole test komutlarını ve kısa kullanıcı test fişini hazırlayacak; kullanıcı gördüğü kusuru dosya/pafta/bölge/eylem ile bildirecek. Kullanıcının “baktım iyi” notu değerli manuel kabul kanıtıdır ama otomatik test, tüm fixture'lar veya diğer cihazların PASS sonucu yerine geçmez. Poco'da başarı iPhone/tablet başarısı olarak raporlanmaz.

## Sunucu bütçesi ve sıradaki iş

Kullanıcı henüz bütçe düşünmedi. Bu, sıfır bütçe veya ücretli hizmet satın alma onayı değildir. Mevcut ayrı hazırlama hizmeti kararı korunur; Gemini sağlayıcı seçmez veya ücretli kaynak açmaz.

Yerel G02/G11/G15 kanıtlarında dosya başına decode/compile süresi, peak RSS, türev boyutu, hazır açılış transferi ve cache tekrar kullanımı ölçülür. Maliyet değerlendirmesinde ayrıca beklenen aylık yeni dosya/açılış ve eşzamanlı hazırlama yükü ayrı varsayım olarak belirtilir. Bu verilerden sonra Astra güncel hizmet fiyatlarıyla üretim bütçesini somutlaştırır. 8 GiB yerel container sınırı satın alınmış veya kesin gerekli production sunucu boyutu değildir.

Bütçe bilinmiyor diye doğruluk hedefi düşürülmez veya sunucusuz/browser decoder yoluna geçilmez. Yerel geliştirme ilerler; canlı hizmet maliyeti/hedefi netleşmeden “her yerden production hazır” kabulü verilmez.

## İz ve kapanış

Bu ek D01/D06/D15/D21/D24; R05–R15/R29–R35/R39/R44/R47 ve G01/G07–G09/G12/G15–G17'yi açıklığa kavuşturur. Yeni ana paket veya gereksinim sayısı yaratmaz. G/R ve 78 alt kabul satırı aynı kimliklerle sürer. Sonuç henüz **hedef netleşti; uygulama ve gerçek kabul başlamadı** durumundadır.

## U3 — Son kullanıcı cevapları: tek dosyayla açılış

**06.09.2026.** Kullanıcı ilk hedefi AutoCAD görüntüleme kalitesine ulaşmak olarak teyit etti. Mesafe/alan araçları ilk hedefin önüne alınmaz. Çevrimdışı özellik bu turda açıkça istenmiyor. Dosyalar genellikle 30 MB altında, en fazla 70 MB; kullanıcı yalnız DWG/DXF dosyasını verecek. Ek klasör, font, resim veya XREF dosyası teslim etmeyecek. Bu bölüm önceki çok dosyalı proje eşleme/bağımlılık isteme taslaklarına üstün gelir.

### Sabit kullanıcı akışı

Mevcut dosya yükleme/liste akışı korunur. Kullanıcı tek dosyadan V2 açılışını seçer; klasör seçme, ZIP/eTransmit hazırlama, font yükleme veya eksik bağımlılık tamamlama sihirbazı eklenmez. Mevcut normal tıklama legacy'de kalır, V2 dosyanın üç noktasındaki ayrı seçenektir. “Dosyaya tıklayıp açmak” hedefi bu basit akışı belirtir; iki motor kararını kendiliğinden değiştirmez.

### Kaynakları motorun çözmesi

1. Dosyanın gerçekten içerdiği geometri, bağlı bloklar/bound XREF verisi ve gömülü görüntü/temsil kullanılır. Sadece dış dosya adının kayıtlı olması içeriğinin de gömülü olduğu anlamına gelmez.
2. Yazı tipleri compiler'ın sürümlü platform font kataloğundan otomatik çözülür. Kullanıcının bilgisayarındaki font kurulumu veya CAD destek klasörü çalışma önkoşulu değildir. Kaynak font tanımı/adı ve kullanılan gerçek font hash'i ayrı tutulur.
3. Harici XREF/image/underlay veya özel font içeriği bulunmuyorsa otomatik internet/disk/komşu dosya araması yapılmaz. Kullanıcıya ek dosya sorulmadan eldeki içerik açılır; bulunmayan referans diagnostic'te görünür. Aynı tenant içindeki benzer isimli dosya da kendiliğinden bağlanmaz.
4. Desteklenen gömülü/bound verinin çözülememesi, “tek dosya verdi” gerekçesiyle normal eksik içerik sayılamaz; decoder/compiler kusuru olarak araştırılır. Thumbnail, tam geometri veya bağlı içerik yerine kullanılamaz.

G07 için somut kaynak gözlemi: mevcut src/lib/dokumantasyon/cad-font-manifest.json içindeki Arial eşlemeleri txt.shx/romans.shx/simplex.shx gibi adları, IBM Plex Serif eşlemeleri Times adlarını da kapsıyor ve kayıtlar exact:true taşıyor. **V2 bu exact etiketini kopyalamayacak.** Bu gözlem legacy'yi değiştirme talimatı değildir. Yeni V2 font kataloğu gerçek font dosyası ve font metadata'sına göre exact/substitute/missing ayrımını hesaplar. Legacy manifest yalnız mevcut asset konumlarının araştırma girdisidir.

U3'ün sabit okunabilirlik fallback'i: exact font çözülemezse mevcut public/fonts/Arial-Regular.ttf, açık bold isteğinde Arial-Bold.ttf üzerinden outline üret; source metin/anchor/rotation/height korunur, farklı metrik/font kullanımı **substitute + degraded** olarak bildirilir. Kaynakta kesin glyph placement varsa korunur; olmayan metrik uydurulmaz. Desteklenmeyen glyph görünür missing-glyph işareti ve diagnostic verir. Fontlar V2 compiler paketinde ayrı sürüm/hash ile kullanılır; legacy dosyaları/sync scripti değiştirilmez. Fallback render edebilmek, AutoCAD görünüş eşliğini sağlamış olmak değildir.

UI'da tek, sakin bilgi: “Bazı içerikler farklı veya eksik gösteriliyor.” Ayrıntılarda etkilenen yazı tipi/bağlı dosya adı ve neden. “Dosya yüklemeden devam edemezsiniz” kapısı yok; doğru çözülen pafta/geometri gezilebilir. Bulunmayan dış çizimin nesneleri veya özel semboller AI ile tamamlanmaz.

### Test ve kaynak bütçesi

G15 kullanım sınıfları 0–30 MB ve >30–70 MB olarak ayrı raporlanır (raporda MB=1.000.000 byte, gerçek byte boyutu da yazılır). Ayrıca 70 MiB sınır çevresi Windows MB gösterimi farkına karşı tolerans testi; 100 MiB teknik input tavanı sınır/ret testidir. 100 MiB tamponu 70 MB üzeri ürün performans taahhüdü değildir. Dosyayı anlamsız byte ekleyerek büyütmek gerçek yoğun çizim testi sayılmaz. İlk dört fixture bu sınıfların tamamını kanıtlamıyor; eksik büyük gerçek dosya sınıfı NOT_RUN kalır.

Çizim boyutu decoded/GPU boyutu değildir; mevcut bütçeler ölçülecek, 70 MB dosya otomatik her belleğe sığar varsayılmayacak. Genel kullanım sınıfı ile 70 MB üst sınıfında ilk hazırlama/hazır sahne açma/zoom sonrası final kalite bilgisayar ve Poco X6 Pro'da ayrı ölçülür.

Bağımlılık kabulü iki ayrı fixture ile yapılır: tek başına yeterli dosyada tam görünüş; dış referansı gerçekten olmayan tek dosyada kesintisiz açılış + doğru degraded bildirimi. Referans CAD karşılaştırması için ek dosyalara erişen başka bir ortam kullanıldıysa bu fark kayda yazılır; V2'nin eksik dış byte'ı varmış gibi üretmesi beklenmez. Kullanıcıya ek dosya istemek kabul şartı değildir.

Online-only kabulünde ağ kesilmesi açık durum verir; önceden RAM'e alınan çizimin görünen bölümü kalabilir ama offline indirme, Service Worker/IndexedDB proje saklama veya çevrimdışı ürün sözü eklenmez. R/G/N/V/C/F kimlikleri korunur, ilgili alt koşullar bu tek dosya profiliyle uygulanır.
