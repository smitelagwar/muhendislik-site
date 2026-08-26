import {
  firePhase5References,
  phase5Lines,
  PHASE5_UPDATED_AT,
  type DepremPhase5Override,
} from "./deprem-phase5-shared";

export const DEPREM_PHASE5_FIRE_CLASSIFICATION: DepremPhase5Override = {
  slug: "byy-bina-kullanim-siniflari-tehlike-kategorileri",
  description: "Binaların Yangından Korunması Hakkında Yönetmelik Madde 8'deki bina kullanım sınıfı ile Madde 19'daki düşük, orta ve yüksek yangın tehlike sınıfını birbirinden ayırır; karışık kullanımlı binalarda koruma seviyesinin, söndürme sistemi ve kompartıman kararlarının nasıl etkilendiğini proje kontrol akışına dönüştürür.",
  seoTitle: "Bina Kullanım Sınıfı ve Yangın Tehlike Sınıfı | BYKHY Madde 8 ve 19",
  seoDescription: "BYKHY Madde 8 kullanım sınıfları, Madde 18 karışık kullanım, Madde 19 düşük-orta-yüksek tehlike sınıfları ve yangın projesine etkileri için mühendislik rehberi.",
  updatedAt: PHASE5_UPDATED_AT,
  readTime: "13 dk",
  sections: [
    {
      id: "iki-farkli-siniflandirma",
      title: "Kullanım sınıfı ile yangın tehlike sınıfı aynı bilgi değildir",
      content: phase5Lines(
        "Yangın projesinde ilk kritik hata, **bina kullanım sınıfı** ile **yangın tehlike sınıfını** tek bir etiket gibi kullanmaktır. BYKHY **Madde 8** binayı kullanım özelliğine göre sınıflandırırken, **Madde 19** bina veya bölümündeki yangın yükü, yanabilirlik ve faaliyetin niteliğine göre söndürme sistemi ve kompartıman tasarımında kullanılacak tehlike sınıfını belirler.",
        "",
        "Bu ayrım doğrudan proje sonucunu değiştirir. Örneğin aynı 'endüstriyel yapı' kullanım sınıfı içinde farklı üretim veya depolama bölgeleri farklı yangın tehlikesi gösterebilir. Tersine yalnız 'orta tehlike' demek de binanın kaçış, kullanım ve özel düzenleme hükümlerini belirlemek için yeterli değildir.",
        "",
        "Proje notunda iki alanı ayrı yazın: **Kullanım sınıfı = ... / Tehlike sınıfı = ...**."
      ),
      subsections: [],
    },
    {
      id: "madde-8-kullanim-siniflari",
      title: "Madde 8 bina kullanımını on ana sınıfta ele alır",
      content: phase5Lines(
        "BYKHY **Madde 8** kapsamındaki kullanım sınıfları aşağıdaki ana gruplardır. Sınıf seçimi yalnız bina adından değil, gerçekten yürütülen kullanımdan yapılmalıdır.",
        "",
        "| Kullanım sınıfı | Projede ilk kontrol |",
        "|---|---|",
        "| Konutlar | Bağımsız bölüm ve konut kullanımı |",
        "| Konaklama amaçlı binalar | Geçici konaklama / yataklı kullanım |",
        "| Kurumsal binalar | Eğitim, sağlık ve benzeri kurumsal kullanım |",
        "| Büro binaları | Ofis ve çalışma alanları |",
        "| Ticaret amaçlı binalar | Satış ve ticari kullanım |",
        "| Endüstriyel yapılar | Üretim ve proses niteliği |",
        "| Toplanma amaçlı binalar | İnsan yoğunluğu ve toplanma işlevi |",
        "| Depolama amaçlı tesisler | Depolanan malzeme ve düzen |",
        "| Yüksek tehlikeli yerler | Parlayıcı/patlayıcı veya özel tehlike |",
        "| Karışık kullanım amaçlı binalar | Birden fazla kullanımın ilişkisi |",
        "",
        "Kullanım sınıfında tereddüt doğması hâlinde Yönetmelik, Bakanlığın değerlendirme ve kararını esas alır. Bu nedenle sınırda kalan kullanımlarda varsayımla sınıf üretmek yerine resmî görüş ve proje kabulünü dosyada izlenebilir tutun."
      ),
      subsections: [],
    },
    {
      id: "karisik-kullanim-madde-18",
      title: "Karışık kullanımda bölümlerin ayrılması koruma seviyesini değiştirir",
      content: phase5Lines(
        "BYKHY **Madde 18**, bir binada birden fazla kullanım sınıfı bulunması hâlinde bölümlerin birbirinden uygun yangın bölmesi ile ayrılıp ayrılamadığını kritik kabul eder. Bölümler ayrı korunamıyor veya iç içe kullanım nedeniyle ayrı tedbir uygulanamıyorsa **daha yüksek koruma tedbiri gerektiren sınıfın** kuralları bütün bina için belirleyici olabilir.",
        "",
        "Bu nedenle zemin katta ticaret, üst katlarda konut bulunan bir yapıda yalnız 'konut' veya yalnız 'ticaret' etiketiyle bütün yangın kararlarını üretmeyin. Mimari planda kullanım sınırını, kompartıman duvarlarını, kapıları, şaftları ve ortak kaçış yolunu birlikte okuyun.",
        "",
        "Yanlış sınıflandırma; kaçış düzeni, yangın dayanımı, algılama, söndürme ve duman kontrolü gibi birbirine bağlı sistemlerde zincirleme eksik tasarıma dönüşebilir."
      ),
      subsections: [],
    },
    {
      id: "madde-19-tehlike-sinifi",
      title: "Madde 19 tehlikeyi düşük, orta ve yüksek olarak sınıflandırır",
      content: phase5Lines(
        "BYKHY **Madde 19** kapsamında tehlike sınıfı, binanın özellikleri ile yürütülen işlem ve faaliyetin niteliğine göre belirlenir. Birden fazla bölüm farklı tehlike sınıfındaysa özellikle **su ve pompa kapasitesi** en yüksek tehlike sınıfına göre ele alınır.",
        "",
        "| Tehlike sınıfı | Yönetmelik yaklaşımı | Tasarıma etkisi |",
        "|---|---|---|",
        "| Düşük tehlike | Düşük yangın yükü ve yanabilirlik; en az **30 dakika** yangın dayanımı ve tek kompartıman için **126 m²** sınırı tanımın parçasıdır | Ek-1/A alanları ve sulu sistem girdileri kontrol edilir |",
        "| Orta tehlike | Orta derecede yangın yükü ve yanabilirliğe sahip yanıcı malzemeler | Ek-1/B alt grubu ve proses/depolama niteliği belirlenir |",
        "| Yüksek tehlike | Yüksek yangın yükü/yanabilirlik ve hızlı yangın büyümesi | Ek-1/C, su kaynağı ve özel koruma ihtiyacı kritikleşir |",
        "",
        "Ek-1/A, Ek-1/B ve Ek-1/C tabloları gerçek kullanım alanı ile birlikte okunmalıdır. 'İşyeri az tehlikeli sınıfta' gibi İSG mevzuatına ait bir sınıflandırmayı BYKHY yangın tehlike sınıfının yerine kullanmayın."
      ),
      subsections: [],
    },
    {
      id: "proje-etkisi",
      title: "Sınıflandırmayı yangın projesinin giriş verisi olarak kilitleyin",
      content: phase5Lines(
        "Kullanım ve tehlike sınıfları yalnız rapor başlığı değildir. Bunlardan sonra kaçış kapasitesi ve mesafeleri, kompartımanlar, yapı elemanı yangın dayanımları, otomatik algılama, yağmurlama, yangın dolabı/hidrant, duman kontrolü ve su kaynağı gibi kararlar kontrol edilir.",
        "",
        "Pratik proje akışı şu sırada tutulabilir:",
        "",
        "1. Her mahallin gerçek kullanımını ve kullanıcı profilini belirleyin.",
        "2. **Madde 8–18** üzerinden bina/kısım kullanım sınıfını ve karışık kullanım durumunu çözün.",
        "3. **Madde 19 + Ek-1/A/B/C** üzerinden tehlike sınıfını belirleyin.",
        "4. Mimari, mekanik ve elektrik yangın projelerinde aynı sınıflandırmanın kullanıldığını doğrulayın.",
        "5. Kullanım değişikliği veya revizyonda sınıflandırmayı ve ona bağlı bütün sistemleri yeniden kontrol edin."
      ),
      subsections: [],
    },
    {
      id: "sorumluluk-ve-yanlis-uygulama",
      title: "Teknik sorumluluk yalnız sınıfı yazmak değil, bütün projelerde aynı kararı sürdürmektir",
      content: phase5Lines(
        "Mimari proje kullanım sınırını, mekanik proje söndürme ve duman kontrolünü, elektrik proje algılama/uyarıyı, taşıyıcı proje ise gerekli yangın dayanım performansını etkiler. Sınıfın bir projede değiştirilip diğerlerinde eski bırakılması görünmeyen bir koordinasyon hatasıdır.",
        "",
        "Özellikle ruhsat sonrası kullanım değişikliğinde 'mekân aynı, yalnız kiracı değişti' yaklaşımı güvenli değildir. Depolanan malzeme, kişi yoğunluğu veya faaliyet değiştiğinde tehlike ve kullanım sınıfı da değişebilir. Sonuç; yetersiz kaçış, yetersiz su/pompa kapasitesi veya eksik kompartıman gibi can güvenliği kusurlarına dönüşebilir.",
        "",
        "Nihai projede sınıflandırmanın dayanağını, varsa resmî görüşü ve hangi proje revizyonunda değiştiğini kayıt altına alın."
      ),
      subsections: [],
    },
    {
      id: "muhendislik-kontrol-listesi",
      title: "Mühendislik kontrol listesi",
      content: phase5Lines(
        "- [ ] **Madde 8** kullanım sınıfını gerçek kullanıma göre belirledim.",
        "- [ ] Karışık kullanım varsa **Madde 18** kapsamında bölme ve yüksek koruma seviyesi kararını kontrol ettim.",
        "- [ ] **Madde 19** tehlike sınıfını kullanım sınıfından ayrı kaydettim.",
        "- [ ] Düşük/orta/yüksek tehlike için **Ek-1/A, Ek-1/B, Ek-1/C** kullanım alanlarını doğruladım.",
        "- [ ] Farklı tehlike bölgelerinde su ve pompa kapasitesinin en yüksek tehlike sınıfıyla ilişkisini kontrol ettim.",
        "- [ ] Mimari, mekanik, elektrik ve taşıyıcı projelerde sınıflandırmaların aynı olduğunu doğruladım.",
        "- [ ] Kullanım değişikliği veya revizyon varsa bağlı yangın güvenliği sistemlerini yeniden değerlendirdim."
      ),
      subsections: [],
    },
  ],
  references: firePhase5References("Madde 8–19 ve Ek-1"),
  keywords: ["BYKHY", "bina kullanım sınıfı", "yangın tehlike sınıfı", "Madde 8", "Madde 19", "Ek-1", "karışık kullanım"],
  tags: ["yangın", "BYKHY", "kullanım sınıfı", "tehlike sınıfı", "proje koordinasyonu"],
};

export const DEPREM_PHASE5_FIRE_RESISTANCE: DepremPhase5Override = {
  slug: "tasiyici-sistemlerin-yangina-dayanim-suresi-r30-r60-r90-r120",
  description: "BYKHY'nin temel yangın güvenliği yaklaşımı ile Ek-3/B ve Ek-3/C tablolarını birlikte okuyarak taşıyıcı sistemde R30, R60, R90 ve R120 ifadelerinin ne anlama geldiğini; kullanım sınıfı, bodrum derinliği, bina yüksekliği ve yağmurlama sistemi kararının gerekli süreyi nasıl değiştirdiğini açıklar.",
  seoTitle: "Taşıyıcı Sistem Yangın Dayanımı R30–R120 | BYKHY Ek-3/B ve Ek-3/C",
  seoDescription: "R, E, I performansları; BYKHY Ek-3/B ve Ek-3/C yangın dayanım süreleri, bina yüksekliği, bodrum ve sprinkler etkisi için taşıyıcı sistem kontrol rehberi.",
  updatedAt: PHASE5_UPDATED_AT,
  readTime: "14 dk",
  sections: [
    {
      id: "dayanim-suresi-ne-anlatir",
      title: "R30–R120 bir malzeme etiketi değil, elemandan istenen yangın performans süresidir",
      content: phase5Lines(
        "BYKHY **Madde 20**, yangın hâlinde binanın yük taşıma kapasitesinin belirli bir süre korunmasını temel güvenlik hedeflerinden biri olarak tanımlar. Taşıyıcı sistem için kullanılan **R** sembolü yük taşıma kapasitesinin yangın etkisi altında korunmasını ifade eder; ayırıcı elemanlarda **E** bütünlük ve **I** yalıtım performansları da devreye girer.",
        "",
        "Bu nedenle 'betonarme bina zaten R120' veya 'çelik kolon R60'tır' biçimindeki genel kabuller doğru değildir. Önce projede gerekli performans süresi belirlenir; daha sonra kesit, pas payı/örtü, koruyucu kaplama, yangına maruz kalan yüzeyler ve doğrulanmış ürün/hesap çözümü bu performansı sağlayacak şekilde seçilir.",
        "",
        "**R30 / R60 / R90 / R120**, sırasıyla 30, 60, 90 ve 120 dakikalık gerekli yangın dayanımı seviyelerini ifade eden proje hedefleridir."
      ),
      subsections: [],
    },
    {
      id: "ek3b-eleman-performansi",
      title: "Ek-3/B hangi yapı elemanında hangi performans türünün aranacağını gösterir",
      content: phase5Lines(
        "BYKHY **Ek-3/B**, taşıyıcı çerçeve, kiriş ve kolonlarda **R** performansını Ek-3/C'deki süreye bağlar. Döşeme, kompartıman duvarı, korunumlu şaft ve yangın merdiveni gibi elemanlarda ise yük taşıma, bütünlük ve yalıtım fonksiyonlarına göre **R / REI / EI / E** kombinasyonları kullanılır.",
        "",
        "Örnek olarak kompartıman döşemelerinde gerekli performans Ek-3/C ile ilişkilidir; bodrum ile zemin kat arasındaki döşemede **REI 90 veya Ek-3/C'deki daha büyük değer** belirleyici olabilir. Korunumlu yangın merdiveni yuvasını binanın geri kalanından ayıran duvar için de yönetmelikte ayrı yüksek dayanım gereksinimleri bulunur.",
        "",
        "Sonuç olarak yalnız kolon-kiriş dayanımını kontrol edip yangın güvenlik holü, şaft, döşeme ve kompartıman sınırlarının sürekliliğini ihmal etmek bütüncül yangın dayanımı sağlamaz."
      ),
      subsections: [],
    },
    {
      id: "ek3c-sure-secimi",
      title: "Ek-3/C süreyi kullanım, bodrum derinliği, bina yüksekliği ve yağmurlama durumuyla seçtirir",
      content: phase5Lines(
        "Gerekli dayanım süresi tek bir bina yüksekliği tablosundan okunmaz. **Ek-3/C** bina kullanım sınıfını; bodrum katlarda bodrum derinliğini, giriş/üst katlarda ise bina yüksekliğini ve birçok kullanım için yağmurlama sistemi bulunup bulunmamasını birlikte değerlendirir.",
        "",
        "Apartman satırı, mekanizmayı görmek için iyi bir örnektir:",
        "",
        "| Apartman için konum / yükseklik | Ek-3/C süre örneği |",
        "|---|---:|",
        "| Bodrum derinliği > 10 m | **90 dk** |",
        "| Bodrum derinliği < 10 m | **60 dk** |",
        "| Bina yüksekliği < 5 m | **30 dk** |",
        "| Bina yüksekliği < 21,50 m | **60 dk** |",
        "| Bina yüksekliği < 30,50 m | **90 dk** |",
        "| Bina yüksekliği > 30,50 m | **120 dk** |",
        "",
        "Bu tablo yalnız apartman satırına ait örnektir. Konaklama, kurumsal, büro, ticaret, endüstri, toplanma ve depolama kullanımlarında aynı değerleri kopyalamayın; ilgili Ek-3/C satırını ayrı okuyun."
      ),
      subsections: [],
    },
    {
      id: "sprinkler-ve-izin-verilmez",
      title: "Yağmurlama sistemi bazı kullanım sınıflarında yalnız söndürme değil, yapılaşma koşulunun da parçasıdır",
      content: phase5Lines(
        "Ek-3/C'de bazı konut dışı kullanım sınıflarında **30,50 m'den fazla** bina yüksekliği için yağmurlama sistemi olmayan satırda **'İzin verilmez'** hükmü yer alırken, yağmurlama sistemli durumda **120 dakika** dayanım seviyesi öngörülür. Bu ilişki, sprinkleri yalnız mekanik tesisat eki olarak görmenin neden yanlış olduğunu gösterir.",
        "",
        "Tablo dipnotları da kararın parçasıdır. Örneğin 30 dakikalık bazı değerler binaları ayıran yangın kompartıman duvarında en az 60 dakikaya yükselir; 120 dakikalık bazı yüksek bina koşullarında taşıyıcı sistemin parçası olmayan elemanlara ilişkin dipnot farklılaşabilir.",
        "",
        "Proje kontrolünde hücre değerini dipnotsuz kopyalamayın; satır, sütun ve dipnot birlikte kayıt altına alınmalıdır."
      ),
      subsections: [],
    },
    {
      id: "tasiyici-sistem-proje-etkisi",
      title: "Gerekli R süresini taşıyıcı sistem detayına çevirmek ayrı mühendislik adımıdır",
      content: phase5Lines(
        "Ek-3/C'den gerekli süreyi seçmek kontrolün başlangıcıdır. Sonraki adım, taşıyıcı sistemin gerçek elemanlarının bu performansı sağlayabildiğini kanıtlamaktır.",
        "",
        "Betonarme elemanda kesit boyutu, donatı konumu ve beton örtüsü; çelik elemanda çıplak kesitin hızlı sıcaklık artışı ve gerekiyorsa yangın koruyucu kaplama; kompozit sistemde ise birlikte çalışan bileşenlerin yangın durumundaki davranışı proje özelinde değerlendirilir. Kullanılan yöntem, standart, ürün performans belgesi veya hesap yaklaşımı proje dosyasında izlenebilir olmalıdır.",
        "",
        "Yangın dayanımı için mimari kaplama ile taşıyıcı koruma çözümünü birbirine karıştırmayın. Dekoratif bir kaplama, doğrulanmış bir yangın koruma sisteminin yerine otomatik olarak geçmez."
      ),
      subsections: [],
    },
    {
      id: "sorumluluk-ve-sureklilik",
      title: "Yangın dayanımının zayıf halkası çoğu zaman süre değil süreklilik hatasıdır",
      content: phase5Lines(
        "Taşıyıcı kolon R90 hedefini sağlarken ona bağlanan döşeme, kompartıman sınırı, şaft geçişi veya yangın kapısı daha düşük ya da süreksiz performans gösterirse yangın ve duman beklenen sınırı aşabilir. Bu nedenle yangın dayanımı pafta pafta değil **yangın kompartımanı ve yük yolu** boyunca kontrol edilmelidir.",
        "",
        "Mimari detay, mekanik/elektrik penetrasyonları ve taşıyıcı eleman koruması aynı yangın senaryosunda koordine edilmelidir. Sahada koruyucu kaplamanın kesilmesi, tesisat geçişinin açık bırakılması veya ürün kalınlığının projeden farklı uygulanması tasarımda seçilen R/E/I performansını geçersiz kılabilir.",
        "",
        "Uygulama ve kabul kayıtlarında ürün/çözüm, konum, kalınlık veya detay referansını fotoğraf ve pafta koduyla izlenebilir tutun."
      ),
      subsections: [],
    },
    {
      id: "muhendislik-kontrol-listesi",
      title: "Mühendislik kontrol listesi",
      content: phase5Lines(
        "- [ ] Bina kullanım sınıfını ve ilgili **Ek-3/C** satırını doğruladım.",
        "- [ ] Bodrum için bodrum derinliğini, üst katlar için bina yüksekliğini doğru sütundan okudum.",
        "- [ ] Yağmurlama sistemi durumunun Ek-3/C satırını değiştirip değiştirmediğini kontrol ettim.",
        "- [ ] Hücre değeriyle birlikte bütün dipnotları okudum.",
        "- [ ] Taşıyıcı sistem için **R**, ayırıcı elemanlar için gerekli **E/I** performanslarını ayırdım.",
        "- [ ] Seçilen **R30/R60/R90/R120** seviyesinin gerçek kesit/koruma çözümüyle sağlandığını doğruladım.",
        "- [ ] Şaft, döşeme, kompartıman ve penetrasyonlarda yangın dayanımı sürekliliğini kontrol ettim.",
        "- [ ] Sahadaki koruyucu sistem ve detayların proje/ürün belgesiyle eşleştiğini kayıt altına aldım."
      ),
      subsections: [],
    },
  ],
  references: firePhase5References("Madde 20, Ek-3/B ve Ek-3/C"),
  keywords: ["R30", "R60", "R90", "R120", "yangın dayanımı", "Ek-3/B", "Ek-3/C", "taşıyıcı sistem"],
  tags: ["yangın", "yangın dayanımı", "taşıyıcı sistem", "BYKHY", "R performansı"],
};

export const DEPREM_PHASE5_FIRE_SPRINKLER: DepremPhase5Override = {
  slug: "sprinkler-sistemi-zorunluluk-sinirlari",
  description: "BYKHY Madde 96'daki otomatik yağmurlama sistemi zorunluluklarını bina yüksekliği, kullanım, otopark alanı, yatak/oda sayısı ve tehlikeli madde alanı üzerinden açıklar; yeni bina ile mevcut bina hükümlerinin karıştırılmasını önler ve su kaynağı, tehlike sınıfı ile proje koordinasyonunu birlikte ele alır.",
  seoTitle: "Sprinkler Sistemi Ne Zaman Zorunlu? | BYKHY Madde 96",
  seoDescription: "BYKHY Madde 96 sprinkler zorunluluk eşikleri: 30,50 m, 51,50 m, 600 m² otopark, yataklı tesis, 2000 m² ticaret ve 1000 m² parlayıcı alan kontrolleri.",
  updatedAt: PHASE5_UPDATED_AT,
  readTime: "15 dk",
  sections: [
    {
      id: "madde96-amac-ve-sistem",
      title: "Madde 96 yağmurlama sistemini erken müdahale ve yangın kontrol sistemi olarak tanımlar",
      content: phase5Lines(
        "BYKHY **Madde 96**, otomatik yağmurlama sisteminin amacını yangına erken tepki vermek, yangını kontrol altına almak ve belirli bir tasarım alanına gerekli suyu boşaltmak olarak tanımlar. Sistem yalnız sprinkler başlığından ibaret değildir; borulama, bağlantılar, askılar, kontrol vanaları, alarm/akış elemanları, su pompaları ve gerektiğinde acil güç kaynağı birlikte çalışan bir sistemdir.",
        "",
        "Yönetmelik, yağmurlama sistemi elemanları için **TS EN 12259** uygunluğunu; sistem tasarımı için de **TS EN 12845** yaklaşımını referanslar. Bu nedenle 'sprinkler var' ifadesi proje kabulü değildir: kapsama alanı, hidrolik tasarım, su kaynağı ve alarm işlevleri birlikte doğrulanmalıdır."
      ),
      subsections: [],
    },
    {
      id: "zorunluluk-esikleri",
      title: "Yeni bina için Madde 96 zorunluluk eşiklerini tek tabloda kontrol edin",
      content: phase5Lines(
        "Bakanlığın BYKHY uygulama kılavuzunda Madde 96 için öne çıkan zorunluluk koşulları aşağıdaki şekilde okunur:",
        "",
        "| Yapı / kullanım | Otomatik yağmurlama için temel eşik |",
        "|---|---|",
        "| Konut dışındaki binalar | Yapı yüksekliği **30,50 m'den fazla** |",
        "| Konutlar | Yapı yüksekliği **51,50 m'yi geçen** |",
        "| Kapalı otoparklar | Toplam alan **600 m²'den büyük** veya **10'dan fazla aracın asansörle alındığı** otopark |",
        "| Çok katlı otel/yurt/pansiyon/misafirhane | Yatılan oda sayısı **100'ü** veya yatak sayısı **200'ü** geçen |",
        "| Bütün yataklı tesisler | Yapı yüksekliği **21,50 m'den fazla** |",
        "| Katlı mağaza / alışveriş / ticaret / eğlence yerleri | Toplam alan **2000 m²'nin üzerinde** |",
        "| Kolay alevlenici/parlayıcı madde üretilen veya bulundurulan yapı | Toplam alan **1000 m²'den fazla** |",
        "",
        "Bu tablo hızlı ön kontroldür. Özel kullanım bölümleri, yüksek tehlikeli yerler ve Yönetmeliğin diğer maddelerindeki ilave hükümler ayrıca kontrol edilmelidir."
      ),
      subsections: [],
    },
    {
      id: "otopark-toplam-alan",
      title: "Kapalı otoparkta 600 m² kontrolünü tek tek bölümler yerine ruhsata esas toplam alanla okuyun",
      content: phase5Lines(
        "Bakanlık kılavuzu **Madde 60** açıklamasında, aynı parsel ve aynı yapı ruhsatı kapsamındaki kapalı otopark alanlarının toplamını örnek üzerinden açıklar. Ayrı giriş-çıkışlı iki otoparkın her biri 600 m²'nin altında olsa bile ruhsata esas toplam otopark alanı **600 m²'yi geçiyorsa** yağmurlama, yangın dolabı ve itfaiye su alma ağızları gerekliliği doğabilir.",
        "",
        "Bu nedenle mimari projedeki tek bir otopark odasını ölçüp karar vermek yerine ruhsata esas bütün otopark alanlarını, katları ve bağlantıları birlikte kontrol edin.",
        "",
        "Otopark için duman tahliyesi ayrı bir kontroldür; sprinkler eşiği ile mekanik duman tahliye eşiğini aynı sayı sanmayın."
      ),
      subsections: [],
    },
    {
      id: "istisnalar-ve-su-ile-reaksiyon",
      title: "Her hacme sprinkler başlığı koymak da doğru tasarım değildir",
      content: phase5Lines(
        "Madde 96, yanıcı malzeme içermeyen bazı ıslak hacimler, uygun yangına dirençli elemanlarla ayrılmış yangın merdiveni yuvaları, asansör kuyuları veya başka otomatik söndürme sistemiyle korunan bazı mahaller için yağmurlama yapılmamasına izin verebilir.",
        "",
        "Buna karşılık su ile genişleyen veya reaksiyona girerek yangını büyütebilecek maddelerin bulunduğu mahallerde standart sulu yağmurlama yaklaşımı kullanılmaz. Böyle bir bölüm, bina genelinde sprinkler bulunuyor diye otomatik biçimde aynı sistemle korunmamalıdır.",
        "",
        "Mahallin malzeme envanteri ve proses riski mekanik yangın projesinin gerçek girdisidir."
      ),
      subsections: [],
    },
    {
      id: "tehlike-sinifi-su-kaynagi",
      title: "Sprinkler zorunluluğu ile hidrolik kapasite hesabını birbirinden ayırın",
      content: phase5Lines(
        "Madde 96 önce sistemin gerekli olup olmadığını söyler; gerekli sistemin kapasitesi ise tehlike sınıfı, tasarım yoğunluğu, çalışma alanı ve su kaynağı gibi girdilerle çözülür. BYKHY **Madde 19** tehlike sınıflandırması bu noktada doğrudan devreye girer.",
        "",
        "Bakanlık kılavuzunun **Madde 92** açıklamasında su deposu tasarımında düşük tehlike için **30 dakika**, orta tehlike için **60 dakika**, yüksek tehlike için **90 dakika** süre esaslarının kullanıldığı belirtilir. Bunlar tek başına depo hacmi değildir; tasarım debisi ve birlikte çalışan diğer sulu sistemler ayrıca hesaba katılır.",
        "",
        "Sprinkler zorunlu çıktıktan sonra pompa ve depo kapasitesini yalnız bina alanına göre tahmin etmek yerine hidrolik tasarım zincirini tamamlayın."
      ),
      subsections: [],
    },
    {
      id: "yeni-ve-mevcut-bina-ayrimi",
      title: "Madde 96 ile mevcut bina hükümlerini birbirine kopyalamayın",
      content: phase5Lines(
        "BYKHY'de yeni bina tasarımında kullanılan **Madde 96** ile mevcut binalara ilişkin geçiş ve özel hükümler aynı eşik tablosu değildir. Mevcut bina değerlendirmesinde ilgili **mevcut bina maddeleri** ve yapının hukuki/proje tarihi ayrıca okunmalıdır.",
        "",
        "Bu ayrım özellikle eski otel, iş merkezi, otopark veya büro yapılarında önemlidir. Yeni bina eşiğini doğrudan mevcut yapıya uygulamak kadar, 'bina eski olduğu için sprinkler gerekmez' sonucu çıkarmak da hatalıdır.",
        "",
        "Proje/uygunluk raporunda **yeni bina mı, mevcut bina mı** değerlendirmesi yapıldığını ve hangi maddeye göre karar verildiğini açık yazın. 1 Temmuz 2025 tarihli değişiklik mevcut binalardaki bazı malzeme eksikliklerinin tamamlanmasına ilişkin geçici süre düzenlemesi getirmiştir; bu düzenleme teknik sistem gerekliliklerinin genel olarak kaldırıldığı anlamına gelmez."
      ),
      subsections: [],
    },
    {
      id: "proje-sorumlulugu",
      title: "Sprinkler kararı mimari, mekanik, elektrik ve statik projeyi birlikte etkiler",
      content: phase5Lines(
        "Sprinkler kararı mekanik proje ile sınırlı değildir. Pompa ve depo için hacim/yük ihtiyacı, şaft ve boru güzergâhları, asma tavan koordinasyonu, yangın zonları, alarm-akış anahtarı bağlantıları, enerji sürekliliği ve boru askılarının taşıyıcı sisteme bağlanması diğer disiplinleri etkiler.",
        "",
        "Yanlış veya geç verilen sprinkler kararı; yetersiz yangın deposu, mimari hacim kaybı, tesisat çakışmaları, başlıkların kapatılması, korunmayan kör bölgeler veya yangın dayanımı/kompartıman kararlarının yeniden tasarlanması gibi sonuçlar doğurabilir.",
        "",
        "Ruhsat öncesinde zorunluluk kararı ve sistem ana prensibi kilitlenmeli; uygulamada başlık, boru, vana, pompa, depo ve alarm zinciri proje ile saha arasında izlenebilir tutulmalıdır."
      ),
      subsections: [],
    },
    {
      id: "muhendislik-kontrol-listesi",
      title: "Mühendislik kontrol listesi",
      content: phase5Lines(
        "- [ ] Değerlendirmenin yeni bina **Madde 96** mı yoksa mevcut bina hükümleri kapsamında mı olduğunu belirledim.",
        "- [ ] Konut dışı **30,50 m** ve konut **51,50 m** yapı yüksekliği eşiklerini kontrol ettim.",
        "- [ ] Kapalı otoparkta ruhsata esas toplam **600 m²** alan ve araç asansörü koşulunu kontrol ettim.",
        "- [ ] Konaklama/yataklı tesiste oda, yatak ve **21,50 m** yüksekliği ayrı ayrı değerlendirdim.",
        "- [ ] Ticaret/eğlence için **2000 m²**, kolay alevlenici/parlayıcı kullanım için **1000 m²** eşiğini kontrol ettim.",
        "- [ ] Tehlike sınıfını **Madde 19 + Ek-1** ile belirledim.",
        "- [ ] **TS EN 12259** sistem bileşenleri ve **TS EN 12845** tasarım yaklaşımını proje şartnamesiyle eşleştirdim.",
        "- [ ] Su kaynağı, pompa, depo, alarm ve enerji sürekliliğini birlikte kontrol ettim.",
        "- [ ] Mimari, elektrik ve taşıyıcı sistemle sprinkler güzergâh/askı/şaft koordinasyonunu tamamladım."
      ),
      subsections: [],
    },
  ],
  references: firePhase5References("Madde 19, Madde 60, Madde 92 ve Madde 96"),
  keywords: ["sprinkler", "yağmurlama sistemi", "Madde 96", "30,50 m", "51,50 m", "600 m²", "TS EN 12845", "TS EN 12259"],
  tags: ["yangın", "sprinkler", "yağmurlama", "BYKHY", "sulu söndürme"],
};

export const DEPREM_PHASE5_BATCH_1_ARTICLES = [
  DEPREM_PHASE5_FIRE_CLASSIFICATION,
  DEPREM_PHASE5_FIRE_RESISTANCE,
  DEPREM_PHASE5_FIRE_SPRINKLER,
] as const;
