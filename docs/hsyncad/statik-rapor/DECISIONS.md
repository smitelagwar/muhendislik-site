# Uygulama kararları

- 5 Kasım 2026, kullanıcı son talimatı: **Her aşama sonunda dur ve `devam` komutunu bekle.** Bu talimat ana planın otomatik aşama geçişi maddelerinden önceliklidir. Aşama içi rutin uygulama/testler tamamlanır; sonraki aşama kendiliğinden başlamaz.
- Ana plan yeniden yazılmadı; yirmi aşama aynı sırayla TASKS.json'a aktarıldı. P00 bitişi ürünün veya nihai mühendislik hedefinin bittiği anlamına gelmez.
- İlk teslim bağımsız betonarme bina analizi + gerçek metraj + kapak/içindekiler dahil tek PDF. İskele sonraki kapsam. Etüt PDF yüklemesi zorunlu olmayacak; kullanıcı analiz parametreleri ve kaynakları projede saklanacak.
- REA geliştirme/doğrulama aracıdır; ürün çalışma bağımlılığı olamaz. Yerel REA reposu, somut kimlikli Evidence ve unknown kaydı Aşama 01/04 kabul gereğidir; yalnız beceri/repo okuma kabul sayılmaz.
- Hiçbir model/reset/stash/clean uygulanmadı. Başlangıç dosyaları dış kanıt kökünde yedeklendi. Özgün IDE/PDF/DWG dosyaları salt okunur girdidir; değişiklik denemeleri ayrı kopyalarda yapılır. ACL veya salt okunur dosya bayrağı değiştirilmez.
- Commit/push/deploy yapılmaz. Yeni bağımlılık kurulmadı. Vercel yapılandırması değişmedi; internal-* deploymentEnabled=false kuralı mevcut dosyada doğrulandı, remote deployment testi yapılmadı.
- Timeout bütçesi küçük/domain testinde 120/300 saniye, typecheck 180 saniye, build gerektiğinde 900 saniye. İlk REA analizi ölçülmüş ayrı bütçe gerektirir. Başarısız işi aynı koşulla sınırsız tekrarlama.
- Runner kullanımı: `node scripts/hsyncad/run-owned-command.mjs <mutlak-job.json>`. JSON: executable, args, cwd, timeoutMs, outputDir. Yollar mutlak; outputDir mevcut olmamalı, üst klasör mevcut olmalı. Çıktı stdout.log/stderr.log/result.json. Timeout 124, açık SIGINT/SIGTERM iptal işleyicisi 130; diğer komut kodları korunur. Ortam değişkenlerinin içeriği loglanmaz. Zorla üst süreç kapatılması düzgün iptal yerine geçmez.
- Runner iptal testi açık SIGINT olay işleyicisini sınar; gerçek terminal/IDE zorla kapatma kabulü değildir. Girdi komutu daemon başlatıp erken çıkmamalı; uzun işler runner altında ön planda kalır.

- Aşama01 kabulü `partial/not_passed`: araştırma çıktıları hazır olsa da kaynak ve native mühendislik kapıları açıktır. Ana planın bağımsız işlere devam hükmü uyarınca sonraki `devam` komutu P02 integrity temizliğini başlatabilir; P01 borçları ve nihai kabul şartları devredilir, geçmiş sayılmaz.
- Kaynak araştırması alt işleri REA becerisinin bağımsız soruları paralel çalışanlara ayırma yönergesiyle korpus / normatif kaynak / runtime hazırlığı olarak yürütüldü. Ürün runtime'ına yeni bağımlılık eklenmedi.
- Gelecek solver benchmark'larından önce sayısal tolerans sözleşmesi VERIFICATION_TOLERANCES.json'da sabitlendi; basılı kaynak yuvarlama aralığı ile gerçek ham hesap eşdeğerliği ayrıdır.

- P02 güvenilirlik için geçici kapsam daralmasını seçti: eski 19 sahte bölüm yerine dürüst taslak inceleme; gerçek donatı/TOC/kurum raporu P15–19 tamamlanana kadar kabul edilmez. Test kabulleri gerçek davranışa göre göç ettirildi; eski içerikler/hashler dış kanıtta korunur.
- Nullable miktar/API değişikliği P02 içinde bütün ilgili tüketicilere taşındı. Kullanıcının beyan kütlesi gerçek kesim listesi değildir. Eski cached takeoff/overallPass nihai kabul kanıtı olamaz.
- Mevcut X indirgenmiş modal dalı Y/RZ katılımını hesaplamıyor; sahte0,1/0,05 kaldırıldı, null döner. Eski sayısal katılım alanları da yeni raporda gösterilmez. Gerçek 3B modal yöntem P07'de ayrıca doğrulanacak.
- P02 tamamlandıktan sonra durulur; P03 yalnız sonraki devam komutuyla. P01 kabulü partial kalır, sonraki veri modeli çalışması P01 kaynağından bağımsız ilerleyebilir; normatif/native borçlar devredilir.

- P03 çizim şemasını değiştirmeden ayrı structural v1 paketi kullanır; legacy payload arşivlenir, dosyaya geri yazılmaz. Bilinmeyen rol/özellik/yük/ayar doldurulmaz. Girilen sınıf beyanı normatif malzeme özelliklerine kanıtsız çevrilmez.
- P03 saklama/giriş kabulüdür. Sürümlü projede eski motorun yeni zemin/bağlantı/çözüm tercihlerini yok sayarak çalışması engellendi. Çoklu Eşlenik Winkler kapalı; diğer tercihler de doğrulanmış solver'a bağlanmış sayılmaz. Gerçek hesap aşamalarına kadar önceki sonucun geçerliliği verilmez.
- P03 sonunda durulur; P04 yalnız sonraki kullanıcı devam komutuyla. Etüt PDF zorunlu değil; P01 kaynak/native açık kapıları aynen korunur.

- P04 araştırma/kapsam çıktıları sonuçlandırıldı, kabul partial/not_passed. G/Q raw gözlemleri ve geometri adayları mevcut import/solver alanlarına semantiği doğrulanmadan bağlanmadı. RTTI adayları field-layout kanıtı sayılmaz. Native açıklar bağımsız kullanıcı girdili P05 işini durdurmaz; geçilmeyen kapılar gerçek projelerin nihai kabulüne taşınır. Her zamanki gibi sonraki aşama kullanıcı devam komutunu bekler.

- P05 açık kullanıcı girdili üniform yük/prizma profili ve ön kontrol/JSON sınırıyla tamamlandı; desteklenmeyen fizik engellenir. Aynı fiziksel yükün sahibi tektir; G içindeki öz ağırlık yeniden eklenmez. Raw native gözlemi hiçbir koşulla kullanıcı girdisi sayılmaz. Şerit reaksiyonları bağımsız statik oracle, gerçek bina solver sonucu değildir. Sonraki aşama yine devam komutunu bekler.

- P06 statik backend kendi TypeScript sparse assembly/ölçekli LDLT'sidir; yeni runtime bağımlılığı/WASM yok. Açık girişli prizmatik çubuk, düz dikdörtgen kabuk ve seçili radye Winkler teması32test ve karma bina ölçeğiyle kabul edildi. Doğal sıralama/bütçe kısıtı ve Linux koşulmaması kayıtlıdır. P07 için sparse faktör üzerinde ters iterasyon/Lanczos seçimi, henüz özdeğer kabulü değildir.
- Native/genel kabuk/mevzuat boşlukları korunur. P06 sonunda durulur; P07 yalnız devam komutuyla. Yeni statik altyapı UI veya nihai rapora bağlanmış sayılmaz; başarısız/unsupported hesap onay üretemez.

- P07; yeniden kullanılan sparse LDLT üzerinde deterministik blok ters alt uzay/Rayleigh–Ritz seçildi. Dense Jacobi yalnız küçük projeksiyon probleminde kullanılır;binaya büyütülmez. Massless DOF'a epsilon kütle yok,özperiyot kırpma yok.>=97%kapsam,>%3kalan mod için ihtiyatlı sertifikadır;3/6/9mod hedefi kullanılmaz.
- CQC maksimumları eşzamanlı kuvvet takımı değildir;ham mod/çapraz kovaryans ve yük/rijitlik/revizyon kimliği korunur. Koşullu vektör kestirimi tasarım etkileşimi onayı vermez. Rigid diyafram/dışmerkezlik/üst-alt setleri açık kararla kullanılır;P08 bölgesel tasarım aktarımı kanıtsız otomatikleştirilmez.
- P07 sayısal profil tamamlandı;P01/P04 ve gerçek bina/mevzuat kabulü açık. P08 yalnız kullanıcı devam komutuyla başlar;commit/push/deploy yok.

## P08 kararları

- Sistem/R kararı gerçek modal kabuk kesit paylarına bağlıdır; güncel katsayıyla tekrar çözüm zorunlu, döngü/bütçe başarısızdır. Daha düşük kullanıcı R'si tekrarlı azaltılmaz; D için ayrı kayıt vardır.
- Rijit bodrumda iki kütle periyot çözümü ve mod ailesi karşılığı gerekir; başka bir yerel modun baskınlığı otomatik uygunluk üretmez. Alt kütle ayrı çözülür; üst β/βII alt elemanlara yayılmaz. Bölgesel bileşen sınırlarından eşzamanlı N-M-V-T türetilmez.
- Belirsiz A2/A3/B3 varsayılan bilinmiyor ve görünür gerekçe ister; kabuk beyanı/referans metni hesap kanıtı değildir. Geometrik bulgu elle silinmez, yöntem istisnası diğer kontrolleri kaldırmaz. Yeni alanlar sürümlü proje yan paketinin ek alanıdır; eski kayıt bilinmiyor olarak açılır.
- P08 açık girdi profili tamam, native/mevzuat/eleman/nihai PDF kabulü false. UI yeni motoru başlatmaz;P17 bağlantısı ayrıca gerekir. P09 ancak sonraki devam komutuyla;yerel teslim,commit/push/deploy yok.

## P09 kararları

- Yeni kiriş hesabı mevcut calculator/fem-solver'ı değiştirmez. İmzalı fiziksel kuvvet durumu ile istatistiksel modal maksimum ayrıdır;revizyon/rijitlik/analiz snapshot değişiminde eski talep kabul edilmez.
- Katalog yalnız sonlu yerleşimler üretir;denge üst sınırı sadece yetersiz aday eler,bütün kalanlar gerçek kapasite/detay/servisten geçer. Eksik servis girdisi katalog bütçesine dönüşmeden durur. Başarısız mevcut donatı kendiliğinden yeniden tasarlanmış sayılmaz.
- Bütün otomatik boyuna çubuklar tam boy süreklidir;doğrulanmamış bindirme/kesim noktası yok. Etriye yerleşimi gerçek,imalat kesim boyu/metrajı henüz null. Dolaylı mesnetin kapasite beyanı askı yerleşimi yerine geçmez.
- P09 açık deterministik uniform kiriş temel profili tamam;genel/native/normatif bina kabulü değil. Bant/bağ kirişi P12/P11'e,kolon-birleşim P10'a,UI/PDF/imalat sonraki aşamalara bağlı. P10 yalnız sonraki devam komutuyla.

## P10 kararları

Radyal iki eksenli kapasite yalnız merkez simetrili gerçek kesit/barlarla otomatik çözülür; poligon basıncı doğrudan kesilir, daire analitiktir. İkinci mertebe yaklaşık TS500 profili, tek kez uygulanan ihtiyatlı bileşen sınırlarıdır; genel P-Delta denmez. Güçlü kolon gerçek N'lerde kolon alt/kiriş üst kapasite zarflarıyla; panel kesmesi yararlı kolon çıkarımı olmadan üst sınırla kontrol edilir. Kuşatma ve bj fiziksel geometriye bağlıdır. Bindirme/sonlandırma, farklı kat donatısı, daire/poligon kesmesi ve özel joint verisi tamam değilse açık kapı korunur; eksik üyeye varsayılan kapasite verilmez.

## P11 kararları — 6 Kasım 2026

- Fiziksel hücre/bar ve imzalı gerçek kesit kuvvetleri kullanılır; CQC maksimumları eşzamanlı N-M-V takımı yapılmaz. Bilinmeyen değer sıfır değildir.
- Ω önce mod içindeki işaretli aktarım ve moment kollarından hesaplanır; sınıf/R değişimi gerçek P08 çözümü ve tüm bağımlı tasarımları geçersiz kılar. Yeni kuvvet paketi olmadan rebuild_required kalır.
- Köşe frame-shell dönme bağlantısı otomatik rijit uç sayılmaz. Ortak kabuk yüzü profili doğrulandı. Yüksek Ω modal eksenel/etkileşim ayrıca açık kalır.
- P08 eşdeğer alan formülünde parantezin tamamının karesi düzeltildi; eski hata tarihsel başarıyla korunmadı.
- L/T/U kesit kapasitesi, özel uç detayı veya bodrum paneli onayı değildir. engineeringAcceptance bütün sonuçlarda false kalır. Kapsam P11_WALL_DESIGN.md; P12 yalnız yeni devam komutuyla.

## P12–P14 bütünleşik kayıt — 7 Kasım 2026

Üç ayrı gpt-6-luna/high ajanı ve tek koordinatör; ortak dosyalara eşzamanlı yazma verilmedi. P12 zımbalama bağımlılığı ancak bağımsız doğrulamadan sonra P13e açıldı. İşaret, gerçek yük katsayısı, fiziksel geometri ve eksik/stale kapıları korunur; kaynak sonucu uydurulmaz. Tam plan kabulü açık bırakılır. 7Kasım yeni kullanıcı yönlendirmesi kalan tüm işi Hybrid Agent OSye taşır; eski commit yasağı aşılmaz.
