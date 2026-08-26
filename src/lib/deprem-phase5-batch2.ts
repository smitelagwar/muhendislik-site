import {
  firePhase5References,
  phase5Lines,
  PHASE5_UPDATED_AT,
  type DepremPhase5Override,
} from "./deprem-phase5-shared";

export const DEPREM_PHASE5_FIRE_SMOKE_CONTROL: DepremPhase5Override = {
  slug: "duman-tahliyesi-mekanik-ve-dogal-sistemler",
  description: "BYKHY Madde 85-89 kapsamında duman kontrolünün tahliyeden ibaret olmadığını; doğal ve mekanik duman tahliyesi, HVAC entegrasyonu, yangın damperleri, kaçış merdiveni basınçlandırması, acil enerji ve kabul/bakım zincirini birlikte açıklar.",
  seoTitle: "Duman Tahliyesi ve Basınçlandırma | BYKHY Madde 85-89",
  seoDescription: "Doğal ve mekanik duman tahliyesi, HVAC duman kontrolü, yangın damperi, 30,50 m ve 51,50 m basınçlandırma eşikleri, 50 Pa kontrolü ve proje koordinasyonu.",
  updatedAt: PHASE5_UPDATED_AT,
  readTime: "15 dk",
  sections: [
    {
      id: "duman-risk-mekanizmasi",
      title: "Duman kontrolünün amacı yalnız dumanı dışarı atmak değil, tahliye için yaşanabilir bir yol oluşturmaktır",
      content: phase5Lines(
        "Yangında can güvenliğini tehdit eden yalnız alev değildir. Duman görüş mesafesini azaltır, zehirli ve boğucu gazları taşır, yön bulmayı zorlaştırır ve korunması gereken kaçış yollarına yayıldığında tahliyeyi kullanılamaz hâle getirebilir. Bu nedenle **duman kontrolü**, yangın bölgesindeki duman hareketini yönetirken kaçış merdiveni ve güvenlik hollerini kullanılabilir tutmayı hedefleyen bir sistem problemidir.",
        "",
        "BYKHY **Madde 85**, basınçlandırma, havalandırma ve duman tahliye tesisatının insanlara zarar vermeyecek, paniği azaltacak ve güvenli boşaltmayı sağlayacak ortamı oluşturacak biçimde tasarlanmasını ister. Sistem seçimi kullanım sınıfı, tehlike sınıfı, kullanıcıların hareket kabiliyeti ve diğer yangın koruma sistemleriyle birlikte yapılır.",
        "",
        "Bu yüzden 'fan debisi var' veya 'çatı kapağı var' tek başına kabul kriteri değildir; yangın senaryosunda dumanın **nereden alınacağı, nereye taşınacağı ve hangi kaçış bölgesinin korunacağı** birlikte çözülmelidir."
      ),
      subsections: [],
    },
    {
      id: "dogal-mekanik-madde86",
      title: "Madde 86 doğal ve mekanik duman kontrolünü iki farklı çözüm ailesi olarak tanımlar",
      content: phase5Lines(
        "BYKHY **Madde 86** doğal duman tahliyesi yapılabilen yerlerde duman çekiş bacaları, duman kesicileri ve duman bölmelerini; mekanik çözümde ise özel düzenlenmiş iklimlendirme sistemi veya ayrı mekanik havalandırma/duman kontrol sistemlerini öngörür.",
        "",
        "| Çözüm | Temel çalışma | Projede kritik kontrol |",
        "|---|---|---|",
        "| Doğal tahliye | Isıl yükselme ve doğal çekiş ile dumanın tahliye ağzına yönlenmesi | Duman haznesi/bölmesi, tahliye ağzının yeri, açılma mekanizması |",
        "| Mekanik tahliye | Fan ve kanal ağı ile kontrollü egzoz | Debi, kanal güzergâhı, fan/enerji sürekliliği, damper senaryosu |",
        "| Basınçlandırma | Korunan hacme kontrollü temiz hava vererek duman girişini sınırlama | Basınç farkı, kapı açılabilirliği, kaçak alanları, otomasyon |",
        "",
        "Duman tahliye ağızları sürekli açık olabilir veya yangın sırasında otomatik ya da elle kolayca açılabilir. Fakat mekanizma hangi tip olursa olsun **bakımla işler durumda tutulması** gerekir. Tasarım çözümü ile işletme kabiliyeti birbirinden ayrı düşünülemez."
      ),
      subsections: [],
    },
    {
      id: "hvac-madde87",
      title: "Madde 87 normal HVAC sisteminin yangın anında nasıl davranacağını ayrıca çözdürür",
      content: phase5Lines(
        "Mevcut iklimlendirme ve havalandırma sistemi yangın hâlinde duman kontrol sistemi olarak kullanılabilir; ancak bu durumda BYKHY'nin mekanik duman kontrol sistemi için aradığı şartları da sağlaması gerekir. Normal işletmede doğru çalışan bir klima santrali, yangın senaryosunda kendiliğinden güvenli kabul edilmez.",
        "",
        "Mekanik duman tahliye kanallarının malzemesi, askıları ve yangın dayanımı; kaçış merdiveni ve yangın güvenlik holü geçişleri; kompartıman sınırındaki **yangın damperleri** ve fanların yangın otomasyonundaki çalışma/durma komutları proje senaryosunun parçasıdır.",
        "",
        "Bir hava santrali birden fazla yangın kompartımanına hizmet veriyorsa kompartıman geçişlerinde üfleme ve emiş kanallarında yangın damperi gerekliliği özellikle kontrol edilmelidir. Kanalın kompartıman sınırını deldiği noktada yalnız kanalın kendisi değil, çevresindeki yangın durdurucu detay da süreklilik sağlamalıdır."
      ),
      subsections: [],
    },
    {
      id: "basinclandirma-madde89",
      title: "Madde 89 kaçış merdiveni basınçlandırmasını bina ve merdiven yüksekliğiyle ilişkilendirir",
      content: phase5Lines(
        "Dumanı yangın bölgesinden çekmek kadar, korunmuş kaçış merdivenine girişini sınırlamak da önemlidir. BYKHY **Madde 89** bazı yapılarda kaçış merdiveni basınçlandırmasını zorunlu kılar.",
        "",
        "| Kontrol | Yönetmelik eşiği / hedefi |",
        "|---|---:|",
        "| Konut dışı binalarda merdiven kovası yüksekliği | **30,50 m'den fazla** ise basınçlandırma |",
        "| Bodrum kat sayısı | **4'ten fazla** ise bodruma hizmet veren kaçış merdiveni basınçlandırılır |",
        "| Konut yapı yüksekliği | **51,50 m'den yüksek** ise kaçış merdiveni basınçlandırılır |",
        "| Bütün kapılar kapalı iken merdiven-kullanım alanı basınç farkı | en az **50 Pa** |",
        "",
        "Basınçlandırma yalnız yüksek basınç üretmek değildir. Kapıların açılabilmesi, açık kapı senaryosu, kaçak alanları, üfleme noktaları ve aşırı basınç kontrolü birlikte çözülür. Yangın anında acil durum asansörü kuyusunun korunmasına ilişkin basınçlandırma gereği de ayrıca değerlendirilir."
      ),
      subsections: [],
    },
    {
      id: "enerji-otomasyon-kabul",
      title: "Duman kontrolü acil enerji, yangın algılama otomasyonu ve kabul testleriyle birlikte çalışmalıdır",
      content: phase5Lines(
        "Duman tahliye ve basınçlandırma sisteminin yangın anında çalışması için fanın bulunması yeterli değildir. BYKHY **Madde 85** kapsamında duman tahliye ve basınçlandırma fanı besleme kablolarının yangına en az **60 dakika** dayanıklı olması ve jeneratörden beslenmesi öngörülür.",
        "",
        "Basınçlandırma sisteminin yangın algılama ve uyarı sistemi tarafından otomatik çalıştırılması gerekir. Fan, damper, yangın alarm paneli, jeneratör ve varsa bina yönetim sistemi arasındaki cause-effect senaryosu proje üzerinde yazılı ve sahada test edilebilir olmalıdır.",
        "",
        "Kabul testi; yalnız fanı elle açıp kapatmak değil, gerçek yangın senaryosu sırasındaki damper konumlarını, basınç farklarını, kapı açılabilirliğini, alarm geri bildirimlerini ve acil enerji aktarımını doğrulamalıdır."
      ),
      subsections: [],
    },
    {
      id: "proje-etkisi-ve-sorumluluk",
      title: "Teknik sorumluluk mimari hacim, mekanik sistem, elektrik besleme ve yangın senaryosunu tek zincirde doğrulamaktır",
      content: phase5Lines(
        "Duman kontrolü mimari, mekanik ve elektrik projelerinin kesiştiği bir konudur. Duman bölmesi yüksekliği, şaft alanı, kanal kesiti, fan odası, dış hava emişi, egzoz çıkışı, damperler, jeneratör beslemesi ve yangın paneli senaryosu farklı paftalarda kalabilir; fakat yangın anında tek sistem gibi çalışırlar.",
        "",
        "**Teknik sorumluluk**, seçilen doğal veya mekanik çözümün hesap girdilerini, kompartıman sınırlarını, acil enerji ve otomasyon senaryosunu projede koordine etmek; uygulamada kanal/damper/fan/algılama bileşenlerinin bu senaryoya uygun kurulduğunu ve kabul testinde çalıştığını doğrulamaktır.",
        "",
        "Yanlış damper yönü, jeneratöre bağlanmamış fan, duman emişine çok yakın temiz hava girişi veya kapıyı açılamaz hâle getiren basınç; ayrı ayrı küçük uygulama hataları gibi görünse de tahliye yolunu işlevsiz bırakabilir."
      ),
      subsections: [],
    },
    {
      id: "muhendislik-kontrol-listesi",
      title: "Mühendislik kontrol listesi",
      content: phase5Lines(
        "- [ ] **Madde 85-89** kapsamındaki duman kontrol yöntemini ve yangın senaryosunu belirledim.",
        "- [ ] Doğal tahliye, mekanik tahliye ve basınçlandırma kararlarını kullanım/tehlike sınıfıyla ilişkilendirdim.",
        "- [ ] HVAC kanallarında kompartıman geçişi ve **yangın damperi** sürekliliğini kontrol ettim.",
        "- [ ] Merdiven yüksekliği **30,50 m**, konut yüksekliği **51,50 m** ve bodrum kat sayısı eşiklerini kontrol ettim.",
        "- [ ] Basınçlandırmada kapalı kapı **50 Pa** hedefini ve kapı açılabilirliğini birlikte kontrol ettim.",
        "- [ ] Fan beslemesinde **60 dakika** yangın dayanımı ve jeneratör bağlantısını doğruladım.",
        "- [ ] Yangın algılama sistemi ile fan/damper otomasyonunu cause-effect senaryosunda test ettim.",
        "- [ ] Kabul testi, periyodik kontrol ve bakım kayıtlarının sürdürülebilirliğini doğruladım."
      ),
      subsections: [],
    },
  ],
  references: firePhase5References("Madde 85-89 — duman kontrolü, havalandırma ve basınçlandırma"),
  keywords: ["duman tahliyesi", "Madde 85", "Madde 86", "Madde 87", "Madde 89", "basınçlandırma", "50 Pa", "yangın damperi"],
  tags: ["yangın", "duman kontrolü", "havalandırma", "basınçlandırma", "BYKHY"],
};

export const DEPREM_PHASE5_FIRE_ESCAPE_STAIRS: DepremPhase5Override = {
  slug: "kacis-merdiveni-tasarim-kriterleri",
  description: "BYKHY Madde 38-47 kapsamında kaçış merdivenini tek bir merdiven geometrisi değil, kullanıcı yükünden güvenli dış alana kadar kesintisiz kaçış sistemi olarak ele alır; sayı, konum, dayanım, sahanlık, havalandırma ve bodrum sürekliliği kontrollerini açıklar.",
  seoTitle: "Kaçış Merdiveni Tasarım Kriterleri | BYKHY Madde 38-47",
  seoDescription: "Kaçış merdiveni sayı, konum, 120/90 dakika yangın dayanımı, çıkış sayısı, 10/15 m dışa ulaşım, 210 cm baş yüksekliği ve bodrum kontrolleri.",
  updatedAt: PHASE5_UPDATED_AT,
  readTime: "16 dk",
  sections: [
    {
      id: "kacis-sistemi-mekanizmasi",
      title: "Kaçış merdiveni bir merdiven detayı değil, güvenli alana kadar devam eden kaçış yolunun parçasıdır",
      content: phase5Lines(
        "BYKHY **Madde 38**, kaçış merdivenini yangın ve diğer acil hâllerde kullanılan kaçış yolları bütününün bir parçası olarak tanımlar. Bu nedenle yalnız merdiven kolu genişliğini kontrol edip ona ulaşan koridoru, kapıyı, sahanlığı veya zemin kattaki dışarı çıkışı ihmal etmek güvenli tahliye sağlamaz.",
        "",
        "Kaçış merdiveninin duvar, tavan ve tabanında yanıcı malzeme kullanılmaması; merdivenin yangına en az **120 dakika** dayanıklı duvar ve en az **90 dakika** dayanıklı duman sızdırmaz kapı ile diğer bölümlerden ayrılması gerekir.",
        "",
        "Risk mekanizması nettir: duman veya alev merdiven yuvasına girerse geometrik olarak doğru bir merdiven tahliye işlevini kaybeder. Bu nedenle pasif yangın dayanımı, kapı, havalandırma ve boş tutulma koşulları aynı sistemin parçalarıdır."
      ),
      subsections: [],
    },
    {
      id: "cikis-sayisi-madde39",
      title: "Madde 39 çıkış sayısını kullanıcı yükü ve mekân tehlikesiyle ilişkilendirir",
      content: phase5Lines(
        "Genel kural, aksi belirtilmedikçe yapılarda en az **2 çıkış** bulunması ve çıkışların korunmuş olmasıdır. Kullanıcı yükü ve yüksek tehlike durumu çıkış sayısını artırabilir.",
        "",
        "| Durum | Asgari çıkış yaklaşımı |",
        "|---|---:|",
        "| Yüksek tehlikeli mekân | **25 kişi** aşıldığında en az 2 çıkış |",
        "| Diğer mekânlar | **50 kişi** aşıldığında en az 2 çıkış |",
        "| Kullanıcı sayısı > 500 | en az **3 çıkış** |",
        "| Kullanıcı sayısı > 1000 | en az **4 çıkış** |",
        "",
        "İki çıkışın yalnız sayısal olarak bulunması yeterli değildir; birbirinin alternatifi olacak şekilde ayrık konumlanması gerekir. Tek yangın olayının iki çıkışı birden etkisiz bırakabileceği yan yana çözümler kaçış yedekliliğini ortadan kaldırır."
      ),
      subsections: [],
    },
    {
      id: "konum-sureklilik-madde40",
      title: "Madde 40 en uzak kaçış mesafesi, kullanıcı yükü ve merdiven sürekliliğini birlikte ele alır",
      content: phase5Lines(
        "Kaçış merdivenlerinin yeri, binadaki insanların güvenli şekilde bina dışına çıkmasını kolaylaştıracak biçimde seçilir. Başladıkları kottan çıkış kotuna kadar **süreklilik** göstermeleri gerekir; genel merdivenden geçilerek sonradan bir kaçış merdivenine ulaşan kırık rota yaklaşımı güvenli kabul edilmez.",
        "",
        "Yer seçimi yapılırken en uzak kaçış mesafesi ve kullanıcı yükü birlikte değerlendirilir. Mimari revizyonla koridor uzadığında veya kapı yeri değiştiğinde 'merdiven yeri değişmedi' diye kaçış hesabı sabit bırakılamaz.",
        "",
        "Kaçış merdivenine giriş ile kat sahanlığının aynı kotta olması ve güzergâhın yangın anında okunabilir olması saha kontrolünün parçasıdır."
      ),
      subsections: [],
    },
    {
      id: "geometri-madde41",
      title: "Madde 41 merdiven geometrisini tahliye akışı ve güvenli dış alana boşalma ile bağlar",
      content: phase5Lines(
        "Kaçış merdivenlerinin kapasite ve sayı bakımından en az yarısının doğrudan bina dışına açılması esastır. Merdiven bir hol, koridor veya lobiye iniyorsa ve bir kattan fazla kata hizmet veriyorsa, merdivenin indiği nokta ile dış açık alan arasındaki uzaklık normalde **10 m'yi**, yağmurlama sistemi olan yapılarda **15 m'yi** aşamaz.",
        "",
        "Kaçış merdivenlerinde her döşeme düzeyinde **17 basamaktan çok olmayan** ve **4 basamaktan az olmayan** aralıklarla sahanlık düzenlenir. Baş kurtarma yüksekliği basamak üzerinden en az **210 cm** olmalıdır; basamak yüksekliği **175 mm'den çok**, basamak genişliği **250 mm'den az** olamaz.",
        "",
        "Bu değerler mimari paftada tek tek sağlanırken net kaçış genişliği kapı kanadı, korkuluk, tesisat veya sonradan eklenen elemanlarla sahada daraltılmamalıdır."
      ),
      subsections: [],
    },
    {
      id: "havalandirma-bodrum-45-46",
      title: "Madde 45-46 korunmuş merdivenin havalandırmasını ve bodrum kat yönlendirmesini ayrıca çözdürür",
      content: phase5Lines(
        "Bütün korunmuş kaçış merdivenlerinin doğal yolla veya Altıncı Kısım gereklerine uygun mekanik yolla **havalandırılması veya basınçlandırılması** gerekir. Kaçış merdiveni ile kullanım alanı aynı aydınlık veya baca boşluğunu paylaşamaz.",
        "",
        "Bodruma hizmet veren merdiven de kaçış merdiveninin bütün şartlarını sağlamalıdır. Normal kat merdiveni bodruma devam ediyor ve bodrumlar dâhil **4 kattan çok kata** hizmet veriyorsa, konutlara ait özel durumlar dışında bodrum kat girişinde yangın güvenlik holü gereği doğar.",
        "",
        "Acil durumda üst katlardan kaçan kullanıcıların yanlışlıkla bodruma devam etmesini önlemek için zemin seviyesinde kapı/fiziki engel veya açık yönlendirme yapılması gerekir. Bu küçük görünen detay, tahliye akışının yanlış yöne çevrilmesini önler."
      ),
      subsections: [],
    },
    {
      id: "proje-etkisi-sorumluluk",
      title: "Teknik sorumluluk kullanıcı yükünden dış açık alana kadar net ve kesintisiz kaçış rotasını doğrulamaktır",
      content: phase5Lines(
        "Kaçış merdiveni hesabı mimari proje ile sınırlı değildir. Yangın kapısı, basınçlandırma kanalı, acil aydınlatma/yönlendirme, sahanlıkta açılan tesisat kapakları ve zemin kattaki dış çıkış kapasitesi aynı kaçış rotasını etkiler.",
        "",
        "**Teknik sorumluluk**, kullanıcı yükü ve kaçış mesafesinden başlayan hesabın merdiven sayısı, konumu, yangın dayanımı, net geometri, havalandırma ve dış güvenli alana boşalma ile tutarlı olduğunu projede ve sahada doğrulamaktır.",
        "",
        "Depo olarak kullanılan merdiven sahanlığı, kilitlenen kapı, sonradan daraltılan koridor veya zemin katta dışarı çıkmak yerine başka bir riskli hacme yönelen rota; hesapta doğru görünen tahliyeyi fiilen çalışmaz hâle getirir."
      ),
      subsections: [],
    },
    {
      id: "muhendislik-kontrol-listesi",
      title: "Mühendislik kontrol listesi",
      content: phase5Lines(
        "- [ ] Kullanıcı yükü ve tehlike durumundan gerekli çıkış sayısını belirledim.",
        "- [ ] Kaçış merdivenlerinin alternatif konum ve sürekliliğini **Madde 38-40** kapsamında kontrol ettim.",
        "- [ ] Merdiven yuvasında **120 dakika** duvar ve **90 dakika** duman sızdırmaz kapı gereğini doğruladım.",
        "- [ ] Dış açık alana ulaşımda **10 m / 15 m** koşulunu kontrol ettim.",
        "- [ ] Sahanlık, **210 cm** baş yüksekliği, **175 mm** rıht ve **250 mm** basamak kontrollerini yaptım.",
        "- [ ] Korunmuş merdivenin havalandırma/basınçlandırma çözümünü doğruladım.",
        "- [ ] Bodrum merdiveni, yangın güvenlik holü ve zemin kat yanlış yönlenme önlemini kontrol ettim.",
        "- [ ] Sahada kaçış yolunun boş, kilitsiz ve net genişliğini korur durumda olduğunu doğruladım."
      ),
      subsections: [],
    },
  ],
  references: firePhase5References("Madde 38-47 — kaçış merdivenleri ve kaçış yolu kapıları"),
  keywords: ["kaçış merdiveni", "Madde 38", "Madde 39", "Madde 41", "120 dakika", "90 dakika", "210 cm", "bodrum kaçışı"],
  tags: ["yangın", "kaçış merdiveni", "tahliye", "BYKHY", "mimari proje"],
};

export const DEPREM_PHASE5_FIRE_DOOR_PENETRATIONS: DepremPhase5Override = {
  slug: "yangin-kapisi-dosleme-duvar-gecis-detaylari",
  description: "BYKHY Madde 25 ve 47 üzerinden yangın kapısı, yangın duvarı, döşeme/şaft ve tesisat penetrasyonlarının yangın-duman sürekliliğini açıklar; kapı dayanımı, kendiliğinden kapanma, duman sızdırmazlık ve firestop saha kabulünü birlikte ele alır.",
  seoTitle: "Yangın Kapısı, Duvar ve Tesisat Geçiş Detayları | BYKHY Madde 25 ve 47",
  seoDescription: "80×200 cm kaçış kapısı, 60/90 dakika merdiven kapıları, 90 dakika yangın duvarı, şaft kapakları ve tesisat penetrasyonlarında yangın-duman sürekliliği.",
  updatedAt: PHASE5_UPDATED_AT,
  readTime: "14 dk",
  sections: [
    {
      id: "pasif-koruma-mekanizmasi",
      title: "Yangın bölmesi ancak duvar, kapı ve bütün penetrasyonlar birlikte süreklilik sağlarsa çalışır",
      content: phase5Lines(
        "Yangın duvarını yüksek dayanımlı yapmak, içinden geçen kapı, kablo tavası, boru veya havalandırma kanalı korunmamışsa yeterli değildir. Yangın ve duman en zayıf açıklıktan komşu kompartımana geçer. Bu nedenle pasif yangın korumasında temel kavram **süreklilik**tir.",
        "",
        "BYKHY **Madde 25** yangın duvarlarının dayanımını, açıklıkları ve tesisat geçişlerini; **Madde 47** ise kaçış yolu kapılarının net ölçü, açılma ve yangın/duman performansını düzenler.",
        "",
        "Proje kontrolünde duvar lejandı, kapı listesi ve MEP penetrasyon paftaları birbirinden bağımsız incelenmemelidir."
      ),
      subsections: [],
    },
    {
      id: "yangin-duvari-madde25",
      title: "Madde 25 yangın duvarında açıklığı istisna, sürekliliği esas kabul eder",
      content: phase5Lines(
        "Bitişik nizam yapıları ayıran yangın duvarları yangına en az **90 dakika** dayanıklı projelendirilir. Yangın duvarında delik ve boşluktan kaçınmak esastır.",
        "",
        "Kaçınılmaz kapı veya sabit ışık penceresi gibi açıklıkların en az yangın duvarı direncinin **yarı süresi** kadar yangına dayanıklı olması; kapıların kendiliğinden kapanması ve duman sızdırmaz olması gerekir.",
        "",
        "Su, elektrik, ısıtma, havalandırma ve benzeri tesisat yangın duvarını geçiyorsa tesisat çevresinde açıklık bırakılmadan, en az duvarın yangın dayanım süresi kadar **yangın ve duman geçişine karşı yalıtım** sağlanmalıdır."
      ),
      subsections: [],
    },
    {
      id: "kacis-kapisi-madde47",
      title: "Madde 47 kaçış kapısında net geçiş, açılabilirlik ve yönü birlikte şart koşar",
      content: phase5Lines(
        "Kaçış yolu kapısının temiz genişliği en az **80 cm**, yüksekliği en az **200 cm** olmalıdır. Eşik bulunmaması gerekir; dönel kapı ve turnikeler çıkış kapısı olarak kullanılamaz.",
        "",
        "Kullanıcı yükü **50 kişiyi aşan** mekânlarda çıkış kapısının kaçış yönüne açılması gerekir. Kaçış yolu kapılarının el ile açılabilmesi ve kilitli tutulmaması esastır.",
        "",
        "| Kapı | Yangın/duman performansı |",
        "|---|---|",
        "| Kaçış merdiveni / yangın güvenlik holü kapısı, 4 kattan az kata hizmet | duman sızdırmaz + en az **60 dakika** |",
        "| Bodrum katlara veya 4 kattan fazla kata hizmet | duman sızdırmaz + en az **90 dakika** |",
        "",
        "Bu kapılarda kendiliğinden kapatma düzeneği bulunmalı ve gerektiğinde itfaiyecilerin/görevlilerin dışarıdan içeri girebilmesine imkân verilmelidir."
      ),
      subsections: [],
    },
    {
      id: "saft-ve-gecisler",
      title: "Şaft kapağı ve tesisat geçişi yangın kompartımanındaki görünmeyen zayıf halkalardır",
      content: phase5Lines(
        "Yüksek binalarda çöp, haberleşme, evrak ve teknik donanım gibi düşey tesisat şaft ve baca duvarlarının yangına en az **120 dakika**, kapaklarının en az **90 dakika** dayanıklı ve duman sızdırmaz olması gerekir.",
        "",
        "Kablo tavası, plastik/metal boru, kanal ve birleşik penetrasyonlar farklı davranır. Bu nedenle sahada tek tip köpük veya harçla bütün delikleri doldurmak mühendislik çözümü değildir; seçilen yangın durdurucu sistemin geçiş tipi, duvar/döşeme yapısı, açıklık geometrisi ve gerekli dayanım süresiyle uyumlu olması gerekir.",
        "",
        "Asma tavan üstü ve şaft içindeki penetrasyonlar kapandıktan sonra görünmez hâle geldiği için kapanmadan önce fotoğraf, ürün ve konum kaydı alınması kabul sürecini güçlendirir."
      ),
      subsections: [],
    },
    {
      id: "kapi-urun-saha-kabulu",
      title: "Kapı etiketi tek başına yeterli değildir; kasa-kanat-donatım-duvar birleşimi sistem olarak kontrol edilir",
      content: phase5Lines(
        "Yangın kapısının performansı kanatla sınırlı değildir. Kasa bağlantısı, çevre dolgu/yalıtım, fitiller, kapatıcı, kilit/panik donanımı, cam varsa cam sistemi ve kapının bağlandığı duvar birlikte çalışır.",
        "",
        "Sahada kapının açık tutulması, kapatıcı kolunun sökülmesi, kama kullanılması, kablo geçirmek için kasa/duvar birleşiminin delinmesi veya fitilin çıkarılması test edilmiş performansı ortadan kaldırabilir.",
        "",
        "Kabulde kapının kendiliğinden tam kapanması, duman sızdırmazlık elemanlarının sürekliliği, net açıklık ve kaçış yönünde açılabilirlik fonksiyonel olarak denenmelidir."
      ),
      subsections: [],
    },
    {
      id: "proje-etkisi-sorumluluk",
      title: "Teknik sorumluluk pasif yangın sınırını bütün disiplin geçişleri boyunca kesintisiz korumaktır",
      content: phase5Lines(
        "Yangın duvarı ve döşeme mimari/statik projede, yangın kapısı mimari kapı listesinde, tesisat delikleri ise mekanik ve elektrik projelerinde görünür. Bunların koordinasyonsuz ilerlemesi sahada yüzlerce kontrolsüz açıklık üretebilir.",
        "",
        "**Teknik sorumluluk**, her kompartıman sınırının gerekli dayanımını belirlemek; kapı ve penetrasyon çözümünü aynı performans hedefiyle eşleştirmek; saha uygulamasının ürün sistemine ve paftaya uygunluğunu kapanmadan önce doğrulamaktır.",
        "",
        "Yanlış kapı sınıfı, kilitli kaçış kapısı veya yangın durdurucu uygulanmamış tek bir şaft geçişi, yangın ve dumanın korunan hacme erken yayılmasına yol açarak diğer aktif sistemlerin sağladığı zamanı azaltabilir."
      ),
      subsections: [],
    },
    {
      id: "muhendislik-kontrol-listesi",
      title: "Mühendislik kontrol listesi",
      content: phase5Lines(
        "- [ ] Yangın duvarı ve kompartıman sınırlarının gerekli dayanım sürelerini paftada işaretledim.",
        "- [ ] **Madde 25** kapsamında yangın duvarındaki bütün kapı ve tesisat açıklıklarını envanterledim.",
        "- [ ] Kaçış kapısında net **80 cm × 200 cm**, eşiksizlik ve açılma yönünü kontrol ettim.",
        "- [ ] Merdiven/güvenlik holü kapısında **60/90 dakika** dayanım ve duman sızdırmazlığı doğruladım.",
        "- [ ] Yüksek bina şaft duvarı **120 dakika**, kapağı **90 dakika** kontrolünü yaptım.",
        "- [ ] Penetrasyon firestop çözümünü geçiş tipi ve gerekli dayanım süresiyle eşleştirdim.",
        "- [ ] Kapı kapatıcı, fitil, kasa çevresi ve kilitsiz açılma fonksiyonunu sahada test ettim.",
        "- [ ] Gizlenecek penetrasyonları kapanmadan önce fotoğraf ve ürün kaydıyla teslim aldım."
      ),
      subsections: [],
    },
  ],
  references: firePhase5References("Madde 25 ve Madde 47 — yangın duvarı, kapılar ve penetrasyonlar"),
  keywords: ["yangın kapısı", "Madde 25", "Madde 47", "80 cm", "200 cm", "60 dakika", "90 dakika", "firestop"],
  tags: ["yangın", "yangın kapısı", "pasif yangın", "firestop", "BYKHY"],
};

export const DEPREM_PHASE5_FIRE_DETECTION: DepremPhase5Override = {
  slug: "yangin-algilama-ve-ihbar-sistemi-gereksinimleri",
  description: "BYKHY Madde 74-76 ve Ek-7 kapsamında yangın algılama ve uyarı sisteminin TS EN 54 tabanlı tasarımını; buton, otomatik algılama, zonlama, söndürme sistemi entegrasyonu, alarm senaryosu ve güncel Ek-7 iptal notlarını birlikte açıklar.",
  seoTitle: "Yangın Algılama ve İhbar Sistemi Gereksinimleri | BYKHY Madde 74-76 ve Ek-7",
  seoDescription: "TS EN 54, yangın butonu 60 m ve 110-130 cm, otomatik algılama Ek-7, TS EN 54-14, sprinkler akış anahtarı ve yangın alarm cause-effect kontrolleri.",
  updatedAt: PHASE5_UPDATED_AT,
  readTime: "16 dk",
  sections: [
    {
      id: "komple-sistem-madde74",
      title: "Madde 74 yangın alarmını dedektörlerden ibaret değil, sürekli denetlenen komple sistem olarak tanımlar",
      content: phase5Lines(
        "BYKHY **Madde 74** yangın uyarı sistemini algılama, alarm verme, kontrol ve haberleşme fonksiyonlarını içeren komple bir sistem olarak tanımlar. Sistem ve bileşenlerin **TS EN 54** uygunluğu tasarım, tesis ve işletme zincirinin temelidir.",
        "",
        "Kablolar ve uzak izleme/denetim hatları kopukluk, kısa devre ve toprak kaçağı gibi arızalara karşı sürekli denetim altında tutulmalıdır. Sistem devre dışı kalırsa yeniden çalışır hâle gelene kadar korumasız bölgelerde ilave güvenlik tedbirleri alınması gerekir.",
        "",
        "Risk mekanizması bu nedenle iki yönlüdür: yangını geç algılamak kadar, arızalı sistemi çalışıyor sanmak da tehlikelidir. Panelde arıza izleme ve işletme prosedürü tasarımın parçasıdır."
      ),
      subsections: [],
    },
    {
      id: "buton-madde75",
      title: "Madde 75 el ile yangın uyarısında erişim mesafesi ve montaj kotunu açıkça tanımlar",
      content: phase5Lines(
        "Yangın algılama ve uyarı sistemi el ile, otomatik algılama ile veya bir söndürme sisteminden gelen sinyalle devreye girebilir. El ile uyarı için yangın butonları kaçış yollarında ve kolay erişilebilir yerlerde düzenlenir.",
        "",
        "| Buton kontrolü | Kriter |",
        "|---|---:|",
        "| Bir kattaki herhangi bir noktadan butona yatay erişim | en çok **60 m** |",
        "| Buton montaj yüksekliği | yerden en az **110 cm**, en fazla **130 cm** |",
        "| 2-4 katlı konut dışı bina | kat alanı **400 m²'den fazla** ise buton zorunluluğu |",
        "| Konut dışı bina | kat sayısı **4'ten fazla** ise buton zorunluluğu |",
        "| Yüksek bina | konut dâhil buton zorunluluğu |",
        "",
        "Engelli veya yaşlı kullanıcıların bulunduğu yerlerde 60 m erişim mesafesinin azaltılması gerekebilir. Butonun mobilya, kapı kanadı veya dekoratif panel arkasında kalmaması saha kabulünde kontrol edilmelidir."
      ),
      subsections: [],
    },
    {
      id: "otomatik-algilama-ek7",
      title: "Otomatik algılama kararı Ek-7'nin güncel konsolide hâlinden verilmelidir",
      content: phase5Lines(
        "BYKHY **Madde 75**, yapı yüksekliği veya toplam kapalı alanı **Ek-7** değerlerini aşan binalarda otomatik yangın algılama cihazlarını zorunlu kılar. Ancak Ek-7'nin bazı kullanım satırları Danıştay kararıyla iptal edildiğinden eski eğitim dokümanındaki tam tabloyu güncel hüküm gibi kopyalamak hatalıdır.",
        "",
        "Güncel konsolide metinde açıkça görülen aktif satırlara örnek olarak konutlarda yapı yüksekliği **51,50 m'den fazla**; konaklama amaçlı binalarda **6,50 m'den fazla** veya toplam kapalı alan **1000 m²'den fazla**; büro binalarında **30,50 m'den fazla** veya **5000 m²'den fazla**; depolarda **6,50 m / 5000 m²**; yüksek tehlikeli yerlerde **6,50 m / 1000 m²** eşikleri bulunur.",
        "",
        "Kurum, ticaret, endüstriyel ve toplanma kullanımları gibi iptal işareti bulunan satırlarda proje tarihinde güncel konsolide mevzuat ve varsa yeni düzenleme/idarî görüş ayrıca kontrol edilmelidir. Bu makale iptal edilmiş satırlara eski sayısal zorunluluk atamaz."
      ),
      subsections: [],
    },
    {
      id: "dedektor-secimi-ts-en54-14",
      title: "Dedektör tipi mahallin yangın karakterine göre seçilir; her yere duman dedektörü koymak doğru değildir",
      content: phase5Lines(
        "Algılama sistemi gerekli olduğu hâlde duman algılayıcısının uygun veya yeterli olmadığı mahalde sabit sıcaklık, sıcaklık artış, alev veya başka uygun tip algılayıcı kullanılabilir. Sensör seçimi tavan yüksekliği, beklenen yangın ürünü, toz/buhar, hava akımları ve yanlış alarm riskiyle birlikte değerlendirilmelidir.",
        "",
        "Ek-7 kapsamında algılayıcı yerleşimleri **TS EN 54-14** esaslarıyla koordine edilir. Bütün algılama cihazlarının periyodik test ve bakım için erişilebilir olması gerekir.",
        "",
        "Asma tavan veya yükseltilmiş döşeme boşluğuna cihaz koyma kararı yalnız 'gizli boşluk var' diye verilmez; boşluğun yangın yükü, erişilebilirliği ve Yönetmelikteki istisna koşulları birlikte değerlendirilir."
      ),
      subsections: [],
    },
    {
      id: "sistem-entegrasyonu-ve-alarm",
      title: "Algılama sistemi sprinkler, söndürme, duman kontrolü ve alarm senaryosunun merkezinde yer alır",
      content: phase5Lines(
        "Otomatik yağmurlama sistemi bulunan yerde sprinkler başlığı açıldığında **su akış anahtarının** yangın alarm sistemine giriş olarak bağlanması ve sistemin bu olayı otomatik algılaması gerekir. Gazlı veya diğer sabit söndürme sistemlerinin devreye girdiği bilgisi de alarm sistemine aktarılır.",
        "",
        "BYKHY **Madde 76** alarmın kontrol paneli/tekrarlayıcı paneller, bina kullanıcıları, acil durum ekipleri ve gerektiğinde itfaiye haberleşmesi üzerinden sesli, ışıklı veya veri iletişimi ile yayılmasını düzenler.",
        "",
        "Bu nedenle yangın alarm cause-effect matrisi; duman kontrol fanları, damperler, asansörler, kapılar, söndürme sistemleri ve diğer kontrollü ekipmanların hangi alarmda ne yapacağını tanımlamalıdır."
      ),
      subsections: [],
    },
    {
      id: "proje-etkisi-sorumluluk",
      title: "Teknik sorumluluk cihaz saymak değil, algılama-alarm-kontrol zincirinin yangın senaryosunu çalıştırdığını doğrulamaktır",
      content: phase5Lines(
        "Elektrik projesindeki dedektör noktaları mimari bölmeler, mekanik menfezler, sprinkler zonları ve yangın kompartımanları değiştiğinde yeniden kontrol edilmelidir. Tavandaki sonradan eklenen kiriş, dekoratif panel veya hava üfleme elemanı algılama performansını değiştirebilir.",
        "",
        "**Teknik sorumluluk**, zorunluluğu güncel Ek-7 üzerinden belirlemek, cihaz tipini ve yerleşimini doğru standarda göre seçmek, zon/cause-effect senaryosunu diğer yangın sistemleriyle koordine etmek ve kabul testinde her alarm giriş-çıkışının beklenen sonucu verdiğini doğrulamaktır.",
        "",
        "Yanlış zon etiketi, devre dışı bırakılmış dedektör, alarm paneline bağlanmamış sprinkler akış anahtarı veya yanlış çalışan fan komutu; yangının erken tespit edilmesine rağmen tahliye ve müdahale zincirini geciktirebilir."
      ),
      subsections: [],
    },
    {
      id: "muhendislik-kontrol-listesi",
      title: "Mühendislik kontrol listesi",
      content: phase5Lines(
        "- [ ] Sistem tasarımını **Madde 74-76**, **TS EN 54** ve gerektiğinde **TS EN 54-14** ile eşleştirdim.",
        "- [ ] Yangın butonlarında **60 m** erişim ve **110-130 cm** montaj kotunu kontrol ettim.",
        "- [ ] Otomatik algılama zorunluluğunu eski tablo yerine güncel konsolide **Ek-7** üzerinden doğruladım.",
        "- [ ] Danıştay kararıyla iptal işareti bulunan Ek-7 satırlarını eski değerlerle zorunluluk olarak kullanmadım.",
        "- [ ] Mahale uygun duman/sıcaklık/alev dedektör tipini ve bakım erişimini kontrol ettim.",
        "- [ ] Sprinkler **su akış anahtarı** ve sabit söndürme sistemlerinin alarm paneli entegrasyonunu doğruladım.",
        "- [ ] Alarm verme ve cause-effect matrisini duman kontrolü, asansör ve diğer sistemlerle test ettim.",
        "- [ ] Devre dışı sistem için işletme güvenliği ve periyodik test/bakım prosedürünü kontrol ettim."
      ),
      subsections: [],
    },
  ],
  references: firePhase5References("Madde 74-76 ve Ek-7 — yangın algılama, uyarı ve alarm"),
  keywords: ["yangın algılama", "Madde 74", "Madde 75", "Ek-7", "TS EN 54", "TS EN 54-14", "60 m", "110 cm", "130 cm"],
  tags: ["yangın", "algılama", "alarm", "TS EN 54", "BYKHY"],
};

export const DEPREM_PHASE5_BATCH_2_ARTICLES = [
  DEPREM_PHASE5_FIRE_SMOKE_CONTROL,
  DEPREM_PHASE5_FIRE_ESCAPE_STAIRS,
  DEPREM_PHASE5_FIRE_DOOR_PENETRATIONS,
  DEPREM_PHASE5_FIRE_DETECTION,
] as const;
