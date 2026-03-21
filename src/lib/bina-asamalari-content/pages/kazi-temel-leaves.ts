import { BRANCH_SOURCE_LEDGER, SOURCE_LEDGER } from "../source-ledger";
import type { BinaGuideEquipment, BinaGuidePageSpec, BinaGuideTool } from "../types";

const KAZI_LEAF_SOURCES = [...BRANCH_SOURCE_LEDGER["kazi-temel"]];

const IKSA_TOOLS: BinaGuideTool[] = [
  { category: "Analiz", name: "PLAXIS / benzeri geoteknik modelleme", purpose: "Kazı kademesi, ankraj seviyesi ve deplasman duyarlılığını karşılaştırmak." },
  { category: "Ölçüm", name: "Total station ve oturma takibi", purpose: "İksa başlığı, yol ve komşu yapı hareketlerini günlük okumalarla izlemek." },
  { category: "Kayıt", name: "Delgi ve enjeksiyon saha formları", purpose: "Her imalat elemanının derinlik, hacim ve test sonuçlarını tek logda toplamak." },
  { category: "Kontrol", name: "Excel / Python ön kontrol şablonları", purpose: "Kazık hacmi, ankraj yük seviyesi ve kademe bazlı üretim planını teyit etmek." },
];

const TEMEL_TOOLS: BinaGuideTool[] = [
  { category: "Analiz", name: "SAFE / İdecad / ETABS temel modülleri", purpose: "Radye davranışı, zemin basıncı dağılımı ve zımbalama kontrollerini karşılaştırmak." },
  { category: "Detay", name: "AutoCAD / Revit temel paftaları", purpose: "Aks, rezervasyon, perde-radye birleşimi ve su yalıtımı detaylarını sahaya net indirmek." },
  { category: "Planlama", name: "Beton lojistik çizelgesi", purpose: "Döküm saatleri, pompa kapasitesi, numune planı ve kür zincirini eşzamanlı yönetmek." },
  { category: "Kontrol", name: "Excel metraj ve donatı listeleri", purpose: "Grobeton, donatı yoğunluğu, bindirme boyu ve beton sevkiyatını önceden doğrulamak." },
];

const IKSA_EQUIPMENT: BinaGuideEquipment[] = [
  { group: "İmalat", name: "Fore kazık / ankraj sondaj makinesi", purpose: "Delgi doğruluğunu ve tasarım derinliğini sahada üretmek.", phase: "İksa imalatı" },
  { group: "İmalat", name: "Tremi borusu ve betonlama aksesuarları", purpose: "Kazık betonunu kesintisiz ve segregasyonsuz yerleştirmek.", phase: "Kazık betonlaması" },
  { group: "İmalat", name: "Ankraj krikosu ve manometre seti", purpose: "Ankraj yükleme ve kilitleme aşamalarında gerçek çekme kuvvetini okumak.", phase: "Ankraj germe" },
  { group: "İzleme", name: "İnklinometre / çatlak mastarı / prizma", purpose: "Kazı çevresindeki deformasyon ve komşu yapı hareketlerini izlemek.", phase: "Kazı süresince" },
  { group: "Destek", name: "Dalgıç pompa ve drenaj hattı", purpose: "Kazı tabanında su birikmesini engelleyerek imalat kalitesini korumak.", phase: "Kazı ve iksa" },
];

const TEMEL_EQUIPMENT: BinaGuideEquipment[] = [
  { group: "Ölçüm", name: "Lazer nivo ve total station", purpose: "Grobeton kotu, radye üst kotu ve ankraj akslarını doğrulamak.", phase: "Temel öncesi ve döküm" },
  { group: "Donatı", name: "Pas payı takozu, sehpa ve spacer", purpose: "Alt-üst donatının projedeki örtü betonu ve katman mesafesinde kalmasını sağlamak.", phase: "Donatı montajı" },
  { group: "Beton", name: "Beton pompası, vibratör ve numune seti", purpose: "Yerleştirme, sıkıştırma ve kabul deneylerini aynı zincirde yürütmek.", phase: "Betonlama" },
  { group: "Yalıtım", name: "Bitümlü membran, astar ve koruma levhası", purpose: "Temel dış yüzeylerini suya karşı sürekli bir kabuk haline getirmek.", phase: "Su yalıtımı" },
  { group: "Kür", name: "Kür örtüsü ve su püskürtme ekipmanı", purpose: "Erken yaş betonunda nem kaybını sınırlayıp yüzey çatlaklarını azaltmak.", phase: "Beton sonrası" },
];

export const kaziTemelLeafSpecs: BinaGuidePageSpec[] = [
  {
    slugPath: "kazi-temel/iksa-sistemi/fore-kazik",
    kind: "topic",
    quote: "Fore kazık, kazı çevresinde yalnızca düşey bir eleman değil; kazının ne kadar sakin ve kontrollü ilerleyeceğini belirleyen rijitlik omurgasıdır.",
    tip: "Fore kazıkta en kritik kalite kırılması, delgi tamamlandıktan sonra değil; dip temizliği, kafes merkezleme ve tremi sürekliliği bozulduğunda ortaya çıkar.",
    intro: [
      "Fore kazık, şehir içi derin kazılarda komşu yapı ve yol etkisini yönetmek için en sık başvurulan iksa elemanlarından biridir. Yüksek rijitliği sayesinde yatay deplasmanları sınırlar; aynı zamanda kuşak kirişi, ankraj ve iç desteklerle birlikte çalışarak kazı çevresinde kontrollü bir taşıyıcı halka oluşturur.",
      "Ancak fore kazığı iyi yapan yalnızca çap ve boy seçimi değildir. Çalışma platformunun yeterliliği, delginin düşeyliği, dipte kalan gevşek malzeme, donatı kafesinin merkezde kalması ve betonun tremi ile kesintisiz verilmesi doğrudan nihai performansı etkiler. Bu nedenle fore kazık, kağıt üzerinde geoteknik hesap; sahada ise kayıt disiplini isteyen bir imalattır.",
    ],
    theory: [
      "Fore kazıkta davranışın temelini rijitlik ve gömülme derinliği oluşturur. Kazı derinliği arttıkça yalnız kazık çapını büyütmek yeterli olmaz; kazığın alt gömülmesi, aralıkları, kuşak kirişi rijitliği ve varsa ankraj seviyeleri birlikte çalışır. Tasarım ofisinde aynı deplasmanı veren iki alternatif kesit, sahada çok farklı imalat riskleri üretebilir.",
      "İmalat kalitesi açısından kritik konu, kazık gövdesinin teorik silindir gibi oluşmamasıdır. Delgi sırasında zemin gevşemesi, yeraltı suyu, muhafaza borusu kullanımı ve betonun yer değiştirme etkisi gerçek hacmi değiştirir. Bu nedenle teorik hacim ile sahaya gelen beton miktarını karşılaştırmak kalite kontrol için çok güçlü bir saha göstergesidir.",
      "Fore kazık başlığı ve kuşak kirişi de sistemin ayrılmaz parçasıdır. Kazıklar tek tek güçlü olsa bile üstte aynı aksa oturmayan, kazık başı temizliği iyi yapılmamış veya donatı ankrajı zayıf bir başlık kirişi sistem davranışını zayıflatır. İksa performansı, eleman bazında değil zincir bazında okunmalıdır.",
    ],
    ruleTable: [
      {
        parameter: "Kazık-zemin-yapı etkileşimi",
        limitOrRequirement: "Kazık rijitliği, gömülme boyu ve komşu etki birlikte değerlendirilmelidir.",
        reference: "TBDY 2018, 4.10.4 ve 16.10 yaklaşımı",
        note: "Kazık tek başına değil, başlık kirişi ve kazı kademesiyle birlikte çalışır.",
      },
      {
        parameter: "İmalat toleransı ve kalite kontrol",
        limitOrRequirement: "Delgi, donatı yerleşimi ve betonlama için sürekli kayıt tutulmalıdır.",
        reference: "TS EN 1536",
        note: "Kazık logu tutulmayan imalat sonradan güvenle yorumlanamaz.",
      },
      {
        parameter: "Beton ve donatı kabulü",
        limitOrRequirement: "Beton sınıfı, kıvam ve donatı örtüsü proje ile uyumlu olmalıdır.",
        reference: "TS 500 + TS EN 206",
        note: "Kazık kalitesi yalnız taşıma gücü değil dayanıklılık açısından da izlenmelidir.",
      },
    ],
    designOrApplicationSteps: [
      "Çalışma platformunu sondaj makinesinin güvenli çalışacağı taşıma gücü ve düzlükte hazırla.",
      "Her kazık için delgi derinliği, zemin geçişleri, muhafaza borusu ihtiyacı ve su durumunu loga işle.",
      "Dip temizliğini doğrula; donatı kafesini spacer ile merkezde kalacak şekilde indir.",
      "Tremi borusunu beton seviyesi içinde tutarak kesintisiz betonlama yap ve sevkiyat zincirini koparma.",
      "Kazık başı traşlaması ve kuşak kirişi bağlantısını, kazık betonunun kalıcı kısmı ortaya çıkmadan kapatma.",
    ],
    criticalChecks: [
      "Çalışma platformunda oturma veya makine devrilme riski var mı?",
      "Delgi logu ile projedeki tasarım derinliği tutarlı mı?",
      "Dip temizliği yapılmadan betonlamaya geçildi mi?",
      "Teorik beton hacmi ile gelen beton hacmi arasında açıklanamayan fark var mı?",
      "Kazık başı kesimi sonrası donatı ankraj boyu ve aks doğruluğu korunuyor mu?",
    ],
    numericalExample: {
      title: "Fore kazık beton hacmi için hızlı saha kontrolü",
      inputs: [
        { label: "Kazık çapı", value: "80 cm", note: "Dairesel kesit" },
        { label: "Tasarım boyu", value: "18,0 m", note: "Kazı altı gömülme dahil" },
        { label: "Teorik hacim", value: "9,05 m³", note: "V = pi x 0,40² x 18,0" },
        { label: "Sipariş katsayısı", value: "%10 ilave", note: "Overbreak ve başlık payı için" },
      ],
      assumptions: [
        "Kazıkta yeraltı suyu etkisi nedeniyle sınırlı çap büyümesi beklenmektedir.",
        "Kazık başı daha sonra traşlanacaktır.",
        "Beton sevkiyatı tek pompa ve kesintisiz hat ile yapılacaktır.",
      ],
      steps: [
        {
          title: "Teorik hacmi üretim hacmine çevir",
          formula: "9,05 x 1,10 = 9,96 m³",
          result: "Sipariş ve saha kabulü için yaklaşık 10,0 m³ beton beklenir.",
          note: "Bu değer çok altında kalıyorsa dip daralması veya eksik dolum şüphesi doğar; çok üstünde kalıyorsa aşırı çap büyümesi araştırılır.",
        },
        {
          title: "Sevkiyat kaydını kalite kontrol olarak kullan",
          result: "İrsaliye toplamı ile kazık logu karşılaştırılarak her kazık için gerçek tüketim izlenir.",
          note: "Saha ekibi yalnız beton döktüğünü değil, teorik tasarımı doğruladığını bilmelidir.",
        },
      ],
      checks: [
        "Teorik ve gerçek hacim karşılaştırması her kazık için dosyalanmalıdır.",
        "Tremi ucu beton seviyesi üstüne çıkmamalıdır.",
        "Kazık başı traşı kalitesiz beton tabakası tamamen alınmadan tamamlanmamalıdır.",
      ],
      engineeringComment: "Fore kazıkta beton hacmi kaydı, çoğu zaman görünmeyen imalat kalitesinin görünen tek saha göstergesidir.",
    },
    tools: IKSA_TOOLS,
    equipmentAndMaterials: IKSA_EQUIPMENT,
    mistakes: [
      { wrong: "Çalışma platformunu geçici tesviye ile bırakıp makine kararlılığını şansa bırakmak.", correct: "Platformu yük, su ve erişim açısından ayrı bir imalat kalemi gibi hazırlamak." },
      { wrong: "Dip temizliğini saha hissiyatına göre yeterli kabul etmek.", correct: "Beton öncesi dip kontrolünü kayıt altına almak ve gerekiyorsa tekrar temizlemek." },
      { wrong: "Tremi borusunu beton içinde tutmadan kesik döküm yapmak.", correct: "Kesintisiz sevkiyat planlayıp tremi seviyesini sürekli izlemek." },
      { wrong: "Donatı kafesini merkezleyici olmadan indirmek.", correct: "Spacer ve bağlantı elemanları ile örtü betonu güvenceye almak." },
      { wrong: "Kazık başı traşı sonrası kuşak kirişi aksını yeniden ölçmemek.", correct: "Başlık kirişinden önce kazık merkezlerini ve kotları tekrar doğrulamak." },
    ],
    designVsField: [
      "Tasarımda fore kazık, tek çizgi ve tek çap olarak görünür; sahada ise zemin tabakası, su, platform ve lojistik aynı çizgiyi her gün yeniden sınar.",
      "Bu yüzden fore kazık performansı sadece hesap çıktısıyla değil, delgi logu, beton irsaliyesi ve başlık kirişi teslimi ile birlikte okunmalıdır.",
    ],
    conclusion: [
      "Fore kazık, doğru tasarlanıp doğru kaydedildiğinde şehir içi kazılarda güvenilir bir rijitlik omurgası sağlar. Zayıf kayıt, yetersiz dip temizliği veya kopuk beton lojistiği ise en pahalı hataları görünmeyen yerde üretir.",
    ],
    sources: KAZI_LEAF_SOURCES,
    keywords: ["fore kazık", "iksa kazığı", "tremi beton", "kazık logu", "derin kazı rijitliği"],
  },
  {
    slugPath: "kazi-temel/iksa-sistemi/ankrajli-iksa",
    kind: "topic",
    quote: "Ankrajlı iksa, perdeyi geriye bağlayarak sadece kazıyı değil, kazının zamana bağlı davranışını da yönetir.",
    tip: "Ankrajlı sistemlerde sorun çoğu zaman ilk yüklemede değil; serbest boy, kök enjeksiyonu ve kilitleme kayıpları doğru okunmadığında başlar.",
    intro: [
      "Ankrajlı iksa, kazı perdesinin arkasındaki zemini aktif biçimde çalıştırarak perde deplasmanını sınırlayan ve derin şehir içi kazılarda çok kullanılan bir destekleme yöntemidir. Özellikle komşu bina, yol veya altyapı etkisinin yüksek olduğu parsellerde kazı duvarını tek başına rijitleştirmek yetmediğinde ankraj sistemi devreye girer.",
      "Bu yöntemin başarısı, sadece ankraj kapasitesinin yeterli olmasına değil; serbest boy ve kök boyunun zemine uygun ayrılmasına, doğru enjeksiyon rejimine ve yüklemenin prosedüre bağlı yapılmasına dayanır. Ankrajlı iksa, hesapla başlayan ancak test yüklemesi ve deplasman takibiyle yaşayan bir sistemdir.",
    ],
    theory: [
      "Ankrajlı sistemde perde, geriye doğru çekilen tendonlar sayesinde zemine karşı pasif bir engel olmaktan çıkar ve aktif olarak desteklenir. Bu da daha küçük yatay deplasmanlar, daha kontrollü kazı kademeleri ve özellikle komşu temeller açısından daha güvenli bir davranış sağlar.",
      "Ancak ankrajın sahadaki gerçek davranışı, çizimde görülen tek çizgi kadar basit değildir. Serbest boyun gerçekten serbest çalışması, kök boyunun uygun zeminde kalması, enjeksiyonun boşluk bırakmaması ve germe sonrası kilitleme kayıplarının izlenmesi gerekir. Aksi halde kağıt üzerindeki yük değeri sahada duvara aynı etkiyi bırakmaz.",
      "Bu nedenle ankrajlı iksa tasarımı, perdenin hesabı ile sınırlı tutulamaz. Delgi sırasında çıkan zemin, komşu parsel sınırı, altyapı hatları, ankrajın girdiği açı ve germe sırası birlikte yönetilmelidir. İyi bir ankraj sistemi, iyi bir imalat sekansı olmadan kurulamaz.",
    ],
    ruleTable: [
      {
        parameter: "Ankraj serbest ve kök boyu",
        limitOrRequirement: "Yük transferi yapılacak kök boyu uygun zeminde, serbest boy ise engellenmeden çözülmelidir.",
        reference: "TS EN 1537",
        note: "Yanlış boy ayrımı ankraj kapasitesini kağıt üstünde bırakır.",
      },
      {
        parameter: "Germe ve kabul yüklemesi",
        limitOrRequirement: "Her ankraj için çalışma yükü, test yükü ve kilitleme seviyesi kayıt altına alınmalıdır.",
        reference: "TS EN 1537",
        note: "Manometre değeri kaydedilmeden yapılan germe, denetlenebilir kabul üretmez.",
      },
      {
        parameter: "Kazı kademe ilişkisi",
        limitOrRequirement: "Her ankraj seviyesi, ilgili kazı kademesi ve perde deplasmanı ile birlikte değerlendirilmelidir.",
        reference: "Geoteknik tasarım ve saha izleme disiplini",
        note: "Ankraj, kazı hızını sınırsız artıran değil kontrollü ilerleten bir elemandır.",
      },
    ],
    designOrApplicationSteps: [
      "Komşu yapı, parsel sınırı ve altyapı hatlarını ankraj doğrultusu ile çakıştırarak delgi güvenliğini önceden teyit et.",
      "Her sıra için serbest boy, kök boyu ve hedef kilitleme yükünü kazı kademesiyle birlikte tanımla.",
      "Delgi sonrası tendon yerleşimi ve enjeksiyon hacmini loga işle; priz süresi tamamlanmadan germe yapma.",
      "Krikolama sırasında çalışma yükü, test yükü ve kilitleme kaybını ayrı ayrı oku.",
      "Ankraj gerildikten sonra perde hareketi, kazı ilerleyişi ve komşu yapı okumalarını aynı raporda birleştir.",
    ],
    criticalChecks: [
      "Ankraj doğrultusunda komşu temel, yol altyapısı veya yasal sınır ihlali var mı?",
      "Serbest boy yanlışlıkla zeminle aderans kuruyor mu?",
      "Enjeksiyon hacmi ve basıncı tasarım beklentisiyle uyumlu mu?",
      "Test yükü ve kilitleme değerleri saha formlarına işlendi mi?",
      "Germe sonrası perde deplasmanı beklenen aralıkta mı seyrediyor?",
    ],
    numericalExample: {
      title: "Ankraj test yükü ve kilitleme seviyesinin hızlı yorumu",
      inputs: [
        { label: "Çalışma yükü", value: "350 kN", note: "Proje hedefi" },
        { label: "Test katsayısı", value: "1,25", note: "Örnek kabul yaklaşımı" },
        { label: "Test yükü", value: "437,5 kN", note: "350 x 1,25" },
        { label: "Kilitleme seviyesi", value: "350 kN", note: "Çalışma yüküne dönüş" },
      ],
      assumptions: [
        "Ankraj kök boyu uygun tabakada oluşmuştur.",
        "Enjeksiyon ve priz süresi teknik şartnameye uygun tamamlanmıştır.",
        "Germe işlemi kalibre kriko ve manometre ile yapılmaktadır.",
      ],
      steps: [
        {
          title: "Test yükünü belirle",
          formula: "350 x 1,25 = 437,5 kN",
          result: "Saha kabulünde ankraj önce yaklaşık 438 kN seviyesine kadar test edilir.",
          note: "Amaç, ankrajın sadece tutulduğunu değil hedef yükü güvenle taşıdığını görmekten ibarettir.",
        },
        {
          title: "Kilitleme kaydını oluştur",
          result: "Test sonrası ankraj çalışma yükü seviyesinde kilitlenir ve kayıp miktarı not edilir.",
          note: "Germe kaybı izlenmiyorsa ankrajlı sistemin gerçek davranışı okunamaz.",
        },
      ],
      checks: [
        "Çalışma ve test yükü birbirine karıştırılmamalıdır.",
        "Germe formu olmadan ankraj kabulü tamamlanmamalıdır.",
        "Yüklemeden sonraki perde hareketi mutlaka deplasman verisiyle birlikte yorumlanmalıdır.",
      ],
      engineeringComment: "Ankrajlı iksada güven, krikoda görülen en yüksek rakamdan değil; o rakamın kayıt altına alınıp duvar davranışına yansıtılmasından gelir.",
    },
    tools: IKSA_TOOLS,
    equipmentAndMaterials: IKSA_EQUIPMENT,
    mistakes: [
      { wrong: "Ankraj doğrultusunu yeraltı hatlarıyla çakışma kontrolü yapmadan sahada çözmek.", correct: "Delgi eksenlerini altyapı ve komşu parsel verisiyle önceden doğrulamak." },
      { wrong: "Enjeksiyon prizini beklemeden takvim baskısıyla germe yapmak.", correct: "Germe için teknik bekleme süresini ve saha dayanımını tamamlamak." },
      { wrong: "Sadece kriko basıncını okuyup test yükünü dosyalamamak.", correct: "Çalışma, test ve kilitleme değerlerini ayrı ayrı kayıt altına almak." },
      { wrong: "Kilitleme kaybını önemsiz kabul etmek.", correct: "Her ankraj için kayıp seviyesini takip edip sistem davranışını buna göre yorumlamak." },
      { wrong: "Ankraj sonrası perde okumalarını ihmal etmek.", correct: "Germe etkisini deformasyon verisiyle birlikte değerlendirmek." },
    ],
    designVsField: [
      "Tasarım ofisinde ankraj çizgisi, perdeyi dengeleyen ideal bir kuvvet gibi görünür; sahada ise her ankraj delgisi, her enjeksiyon ve her kriko okuması bu ideal kuvvetin ne kadarının gerçekten elde edildiğini belirler.",
      "Bu yüzden ankrajlı iksa, yalnız taşıyıcı sistem hesabı değil; test yüklemesi ve izleme verisiyle tamamlanan bir saha mühendisliği konusudur.",
    ],
    conclusion: [
      "Ankrajlı iksa, doğru boylandırma ve iyi kayıt disiplini ile derin kazılarda çok kontrollü davranış sağlar. Enjeksiyon, germe ve izleme zinciri bozulduğunda ise sistemin en güçlü tarafı olan aktif destek etkisi hızla zayıflar.",
    ],
    sources: [...KAZI_LEAF_SOURCES, SOURCE_LEDGER.tsEn1537],
    keywords: ["ankrajlı iksa", "zemin ankrajı", "test yükü", "kilitleme yükü", "deplasman takibi"],
  },
  {
    slugPath: "kazi-temel/iksa-sistemi/palplans",
    kind: "topic",
    quote: "Palplanş, özellikle su ve gevşek zemin etkisinin baskın olduğu kazılarda hızla çevreleme sağlayan ama titreşim ve detay disiplinine çok duyarlı bir iksa çözümüdür.",
    tip: "Palplanşta hızlı imalat avantajı, sürme öncesi titreşim etkisi ve başlık doğrultusu düşünülmezse sahada kolayca maliyet cezasına dönüşür.",
    intro: [
      "Palplanş sistemleri, birbirine kilitlenen çelik profiller sayesinde kazı çevresinde hızlı bir perde oluşturan ve özellikle su etkisinin yüksek olduğu alanlarda tercih edilen iksa çözümleridir. Liman yapıları, dere kenarları, sığ ancak suya duyarlı kazılar veya geçici çevrelemeler bu sistemin doğal kullanım alanlarıdır.",
      "Sistemin cazibesi hızdır; ancak bu hız her zeminde aynı başarıyı üretmez. Çakma veya vibrasyonla sürülen elemanların komşu yapılara etkisi, kilitlerin gerçekten kapanması, dip gömülmesinin yeterliliği ve başlık hizasının korunması palplanşta temel kalite konularıdır. Yanlış seçilmiş bir palplanş sistemi, hız kazandırmak yerine kazıyı geri döndürür.",
    ],
    theory: [
      "Palplanş perdede taşıyıcı davranış, tek bir kesitten çok profillerin kilitli bütünlüğünden gelir. Her profil kendi başına ince bir eleman gibi görünse de gerçek rijitlik, kilitlerin birlikte çalışması ve yeterli gömülme derinliğiyle oluşur. Bu nedenle profil seçimi kadar sürme kalitesi ve sapma kontrolü de önemlidir.",
      "Yeraltı suyu bulunan sahalarda palplanş önemli avantaj sağlar; ancak çoğu projede tam su kesici davranış otomatik kabul edilmemelidir. Kilit detayları, taban altı geçişler ve olası boşluklar nedeniyle su sızıntısı yine de oluşabilir. Bu yüzden drenaj ve pompa planı, palplanş olsa bile iptal edilmez.",
      "Titreşim etkisi, palplanşın en çok ihmal edilen tasarım-saha arayüzüdür. Çakma veya vibrasyonlu sürme yöntemi seçildiğinde komşu yapı, hassas ekipman veya altyapı hatları üzerindeki etki mutlaka değerlendirilmelidir. Gerektiğinde pres-in gibi daha sakin yöntemler düşünülmelidir.",
    ],
    ruleTable: [
      {
        parameter: "Gömülme derinliği",
        limitOrRequirement: "Kazı derinliği kadar alt gömülme ve taban stabilitesi birlikte değerlendirilmelidir.",
        reference: "Geoteknik perde tasarım yaklaşımı",
        note: "Yetersiz gömülme, palplanşı sadece görsel perdeye dönüştürür.",
      },
      {
        parameter: "Sürme doğruluğu",
        limitOrRequirement: "Başlangıç ekseni, düşeylik ve kilit sürekliliği montaj boyunca izlenmelidir.",
        reference: "Saha montaj ve ölçüm disiplini",
        note: "İlk profilde oluşan sapma, ilerleyen panellerde büyüyerek devam eder.",
      },
      {
        parameter: "Su ve titreşim yönetimi",
        limitOrRequirement: "Palplanş sistemi drenaj ve komşu yapı izleme planıyla birlikte ele alınmalıdır.",
        reference: "Kazı güvenliği saha planı",
        note: "Palplanş kullanmak suyu ve titreşimi otomatik olarak çözdüğü anlamına gelmez.",
      },
    ],
    designOrApplicationSteps: [
      "Zemin tipi, su seviyesi ve komşu hassasiyetine göre palplanş profilini ve sürme yöntemini seç.",
      "Başlangıç panelini kılavuz çerçeve ile düşey ve aksında kur; sonraki panelleri buna göre ilerlet.",
      "Her panelde kilit birleşimini ve başlık kotunu sahada ölçerek zincir hatasını büyütme.",
      "Sürme sırasında titreşim, gürültü ve komşu yapı hareketlerini belirlenen eşiklere göre izle.",
      "Palplanş tamamlandıktan sonra iç destek, ankraj veya kuşak kirişi ile birlikte sistem davranışını doğrula.",
    ],
    criticalChecks: [
      "Seçilen sürme yöntemi komşu yapılar için kabul edilebilir mi?",
      "Palplanş kilitleri gerçekten kapanıyor mu, açıklık kalıyor mu?",
      "Başlık kotu ve düşeylikte zincirleme sapma oluştu mu?",
      "Palplanş tamamlandığı halde su girişi için ek drenaj ihtiyacı devam ediyor mu?",
      "Kesilecek başlık yüksekliği kuşak kirişi ve geçici başlık planına göre doğrulandı mı?",
    ],
    numericalExample: {
      title: "Palplanş boyu için hızlı ön yorum",
      inputs: [
        { label: "Kazı derinliği", value: "7,0 m", note: "Geçici kazı" },
        { label: "Ön görülen alt gömülme", value: "3,0 m", note: "Taban stabilitesi için örnek değer" },
        { label: "Kesim ve başlık payı", value: "0,5 m", note: "Montaj-tesviye toleransı" },
        { label: "Toplam panel boyu", value: "10,5 m", note: "7,0 + 3,0 + 0,5" },
      ],
      assumptions: [
        "Kesin gömülme derinliği geoteknik hesapla ayrıca doğrulanacaktır.",
        "Yeraltı suyu etkisi nedeniyle palplanşın su kesici değil su azaltıcı davranacağı kabul edilmektedir.",
        "Panel boyu seçiminde piyasadaki tedarik modülleri de dikkate alınacaktır.",
      ],
      steps: [
        {
          title: "İlk boyu belirle",
          formula: "7,0 + 3,0 + 0,5 = 10,5 m",
          result: "Sahaya sipariş verilecek panel boyu yaklaşık 10,5 m mertebesinde düşünülür.",
          note: "Bu bir tasarım sonucu değil, lojistik ve montaj hazırlığı için ilk kontrol değeridir.",
        },
        {
          title: "Sürme yöntemiyle birlikte yorumla",
          result: "Boy uzadıkça titreşim ve sürme direnci etkileri daha belirgin hale gelir.",
          note: "Bu nedenle profil seçimi, sürme ekipmanı ve komşu yapı hassasiyeti aynı masada değerlendirilmelidir.",
        },
      ],
      checks: [
        "Gömülme boyu yalnız tedarik boyuna göre azaltılmamalıdır.",
        "Panel boyu seçimi sürme ekipman kapasitesiyle birlikte okunmalıdır.",
        "Palplanş perdesi tamamlandıktan sonra başlık doğrultusu yeniden ölçülmelidir.",
      ],
      engineeringComment: "Palplanşta doğru boy seçimi, profil siparişi vermekten önce sürme davranışını okumayı gerektirir.",
    },
    tools: IKSA_TOOLS,
    equipmentAndMaterials: IKSA_EQUIPMENT,
    mistakes: [
      { wrong: "Palplanş profilini sadece stokta var diye seçmek.", correct: "Zemin, su ve komşu yapı hassasiyetine göre kesit ve sürme yöntemini birlikte belirlemek." },
      { wrong: "Kılavuz çerçeve kurmadan ilk panelleri sahada göz kararı sürmek.", correct: "Başlangıç eksenini ölçüyle kurup zincir hatasını baştan engellemek." },
      { wrong: "Palplanş varsa su kontrolü gerekmez sanmak.", correct: "Drenaj ve pompa planını yine aktif tutmak." },
      { wrong: "Titreşim etkisini sadece gürültü şikayeti olarak görmek.", correct: "Komşu yapı ve altyapı davranışını ölçüyle takip etmek." },
      { wrong: "Panel başlıklarını kuşak kirişi detayı netleşmeden kesmek.", correct: "Başlık kotunu sistem tamamı ile birlikte doğruladıktan sonra kesmek." },
    ],
    designVsField: [
      "Projede palplanş, seri dizilmiş birkaç düşey profilden ibaret görünür; sahada ise her panelin sürülme sesi, titreşim etkisi ve kilit doğruluğu sistemin gerçek kalitesini belirler.",
      "Bu nedenle palplanş başarısı yalnız montaj hızıyla değil, sürme kaynaklı risklerin ne kadar ölçülü yönetildiğiyle değerlendirilmelidir.",
    ],
    conclusion: [
      "Palplanş, doğru sahada ve doğru yöntemle kullanıldığında su etkili kazılarda çok hızlı çevreleme sağlar. Yanlış yöntem, yetersiz gömülme veya ölçüsüz titreşim yönetimi ise bu avantajı hızla tersine çevirir.",
    ],
    sources: KAZI_LEAF_SOURCES,
    keywords: ["palplanş", "çelik iksa", "su etkili kazı", "titreşimli sürme", "geçici perde"],
  },
  {
    slugPath: "kazi-temel/temel-turleri/radye-temel",
    kind: "topic",
    quote: "Radye temel, yükü zemine yaymanın ötesinde, diferansiyel oturmayı ve temel davranışını tek plak içinde disipline eden bir sistemdir.",
    tip: "Radye temel kararı, 'kolon altlarını tek tek çözmek zor' olduğu için değil; zemin basıncı, oturma ve üst yapı aksları birlikte daha güvenli davrandığı için verilir.",
    intro: [
      "Radye temel, yapının oturduğu alanın büyük kısmını veya tamamını tek bir plak olarak çalıştıran ve yükleri zemine daha yaygın bir biçimde aktaran temel çözümüdür. Zemin heterojenliği, kolon yüklerinin birbirinden çok farklı olması, bodrum perdeleri ile birlikte rijit bir kutu davranışı istenmesi veya diferansiyel oturma riskinin öne çıkması durumlarında radye çoğu projede öne çıkar.",
      "Ancak radye temel sadece kalın bir beton tabakası değildir. Kolon altı zımbalama, perde-radye birleşimi, dilatasyon ve döküm planı, rezervasyonların önceden çözülmesi ve su yalıtımıyla birlikte düşünülmesi gerekir. İyi bir radye temel, statik hesap ile saha akışının aynı dili konuştuğu projelerde başarılı olur.",
    ],
    theory: [
      "Radye temelde temel mantık, kolon ve perde yüklerinin zemine tekil pikler yerine daha dengeli yüzey basıncı olarak aktarılmasıdır. Bu davranış özellikle farklı kolon yüklerinin bulunduğu, bodrum perdelerinin sisteme katıldığı ve zeminin tekdüze olmadığı durumlarda avantaj sağlar. Ancak ortalama zemin basıncı düşük çıktı diye tasarımın bittiği düşünülmemelidir; yerel zımbalama ve moment talepleri yine kritik kalır.",
      "Plak rijitliği, kalınlık, alt-üst donatı oranı, kolon başlıkları ve gerekirse mantar veya drop panel gibi çözümler radye davranışını şekillendirir. Tasarımın başarısı yalnız global basınç dağılımında değil, kolon çevresindeki yerel gerilme yoğunlaşmalarında sınanır. Bu nedenle radye temel hem geoteknik hem betonarme okumayı birlikte gerektirir.",
      "Sahada ise en büyük konu donatı yoğunluğu ve rezervasyon yönetimidir. Asansör kuyusu, altyapı geçişleri, perde filizleri, waterstop detayları ve uzun süreli betonlama lojistiği birlikte ele alınmazsa radye, kağıt üstünde en bütüncül çözüm iken sahada en karmaşık düğüme dönüşebilir.",
    ],
    ruleTable: [
      {
        parameter: "Temel sisteminin seçimi",
        limitOrRequirement: "Taşıma gücü, oturma ve deprem etkileri birlikte değerlendirilmelidir.",
        reference: "TBDY 2018 temel yaklaşımı + TS 500, Madde 13",
        note: "Radye seçiminde yalnız ilk maliyet değil davranış kalitesi esastır.",
      },
      {
        parameter: "Betonarme detaylandırma",
        limitOrRequirement: "Zımbalama, kesme ve moment bölgeleri için donatı sürekliliği sağlanmalıdır.",
        reference: "TS 500",
        note: "Kolon çevresi donatısı sahada eksiltilmeye en açık bölgedir.",
      },
      {
        parameter: "Malzeme dayanımı ve uygulama",
        limitOrRequirement: "Beton sınıfı, pas payı ve yerleştirme kalitesi deprem performansını da etkiler.",
        reference: "TBDY 2018, 7.2.1 + TS EN 13670",
        note: "Radye temel, depremde üst yapının güvenli başlangıç düzlemidir.",
      },
    ],
    designOrApplicationSteps: [
      "Zemin raporundaki oturma ve taşıma verilerini kolon ve perde yük dağılımı ile birlikte oku.",
      "Radye kalınlığı, kolon altı yerel çözümler ve perdelerle birleşim detaylarını analitik modelle doğrula.",
      "Asansör kuyusu, drenaj çukuru, rezervasyon ve tesisat geçişlerini donatı paftasına beton öncesi işle.",
      "Döküm şeridi, pompa konumu, iş derzi ve kür planını beton hacmine göre önceden sabitle.",
      "Beton sonrası yapılacak üstyapı imalatlarını düşünerek radye üst kotu, ankrajları ve filizleri son kez ölç.",
    ],
    criticalChecks: [
      "Ortalama zemin basıncı uygun görünürken kolon çevresi zımbalama talebi gözden kaçtı mı?",
      "Perde ve kolon filizleri radye donatısını kapatacak şekilde önceden çözüldü mü?",
      "Rezervasyonlar sahada sonradan kesim gerektirmeyecek kadar net mi?",
      "Radye döküm şeridi ve iş derzi kararı donatı yoğunluğu ile uyumlu mu?",
      "Üst kot ve aks ölçüleri beton sonrası tekrar alınacak şekilde planlandı mı?",
    ],
    numericalExample: {
      title: "Radye temelde ortalama zemin basıncının hızlı kontrolü",
      inputs: [
        { label: "Toplam düşey yük", value: "24.000 kN", note: "Üst yapı servis yüklerinin örnek toplamı" },
        { label: "Radye alanı", value: "600 m²", note: "30 m x 20 m plak" },
        { label: "Ortalama zemin basıncı", value: "40 kPa", note: "24.000 / 600" },
        { label: "Zemin için ön kabul", value: "180 kPa", note: "Rapor verisi ile ayrıca teyit edilir" },
      ],
      assumptions: [
        "Bu hesap yalnız ilk uygunluk kontrolüdür; zımbalama ve diferansiyel oturma ayrıca değerlendirilecektir.",
        "Yükler bina oturumuna yaklaşık homojen dağılmış kabul edilmiştir.",
        "Bodrum perdeleri radye rijitliğine katkı vermektedir.",
      ],
      steps: [
        {
          title: "Ortalama basıncı hesapla",
          formula: "24.000 / 600 = 40 kPa",
          result: "İlk bakışta ortalama zemin basıncı zemin kabul değerinin oldukça altındadır.",
          note: "Bu sonuç radye kararını destekler ama tek başına yeterli değildir.",
        },
        {
          title: "Yerel etkileri hatırla",
          result: "Kolon çevresi zımbalama, perde dip momentleri ve rezervasyon boşlukları ayrıca kontrol edilmelidir.",
          note: "Radye temelde asıl sürprizler çoğu zaman ortalama basınçta değil yerel düğümlerde çıkar.",
        },
      ],
      checks: [
        "Ortalama basınç uygun diye radye kalınlığı küçültülmemelidir.",
        "Zemin raporundaki oturma yorumu mutlaka birlikte okunmalıdır.",
        "Kolon altı detayları donatı paftasında açıkça gösterilmelidir.",
      ],
      engineeringComment: "Radye temel hesabında sakin görünen ortalama basınç, yerel düğümlerdeki mühendislik ihtiyacını gizlememelidir.",
    },
    tools: TEMEL_TOOLS,
    equipmentAndMaterials: TEMEL_EQUIPMENT,
    mistakes: [
      { wrong: "Radye temeli yalnız yükü yaydığı için otomatik güvenli kabul etmek.", correct: "Zımbalama, diferansiyel oturma ve donatı yoğunluğunu ayrıca değerlendirmek." },
      { wrong: "Rezervasyon ve kuyu boşluklarını beton öncesi dondurmamak.", correct: "Tüm boşlukları donatı ve kalıp paftasına önceden işlemek." },
      { wrong: "Perde ve kolon filizlerini sahada yorumla bırakmak.", correct: "Birleşim bölgelerini büyük ölçek detaylarla çözmek." },
      { wrong: "Döküm şeridini beton hacmine göre planlamadan tek sefer hedeflemek.", correct: "Pompa kapasitesi, vardiya süresi ve iş derzi planını birlikte kurmak." },
      { wrong: "Radye üst kotunu beton sonrası tekrar ölçmemek.", correct: "Üstyapı öncesi aks ve kot doğrulamasını zorunlu kabul etmek." },
    ],
    designVsField: [
      "Tasarım modelinde radye, elastik zemine oturan bir plak gibi görünür; sahada ise donatı yoğunluğu, rezervasyonlar, pompa erişimi ve su yalıtımı aynı plak içinde yarışır.",
      "Bu nedenle radye temelin gerçek başarısı, analiz çıktısının sahada okunabilir ve uygulanabilir detaylara dönüşmesidir.",
    ],
    conclusion: [
      "Radye temel, doğru projede çok güçlü bir davranış avantajı sunar; fakat bu avantaj ancak yerel detaylar ve döküm lojistiği disiplinle çözüldüğünde sahaya gerçekten taşınır.",
    ],
    sources: [...KAZI_LEAF_SOURCES, SOURCE_LEDGER.tsEn13670],
    keywords: ["radye temel", "zımbalama kontrolü", "zemin basıncı", "temel plağı", "diferansiyel oturma"],
  },
  {
    slugPath: "kazi-temel/temel-turleri/grobeton",
    kind: "topic",
    quote: "Grobeton taşıyıcı değildir; ama taşıyıcı temelin temiz, düzgün ve ölçülü zeminde başlamasını sağlayan en kritik hazırlık katmanıdır.",
    tip: "Grobetonu aşırı kazıyı gizleyen kalın bir dolgu gibi kullanmak, temel kalitesini daha başlamadan geometri hatasına çevirmektir.",
    intro: [
      "Grobeton, temel kazısı tamamlandıktan sonra asıl taşıyıcı beton ve donatıdan önce dökülen, düşük dayanımlı ama yüksek saha değeri olan hazırlık katmanıdır. Temel donatısına temiz bir çalışma yüzeyi sağlar, kazı tabanındaki gevşek malzemenin taşıyıcı betona karışmasını önler ve aks-kot uygulamasını okunabilir hale getirir.",
      "İnşaat sahasında grobeton bazen önemsiz görülür; oysa bu katmandaki kot bozukluğu, yüzey kirliliği veya su birikmesi daha sonra tüm temel geometrisini etkiler. Grobeton iyi yapıldığında sonraki ekiplerin işini kolaylaştırır; kötü yapıldığında donatı, yalıtım ve temel betonunun tamamı zorlaşır.",
    ],
    theory: [
      "Grobetonun temel işlevi taşıma gücü artırmak değil, zemin ile taşıyıcı temel arasında kontrollü bir ara yüz oluşturmaktır. Bu ara yüz; temizlik, düzgünlük, aks işaretleme ve su yönetimi açısından kritiktir. Özellikle yağışlı veya su çıkan kazılarda grobeton, şantiye disiplinini sahada görünür hale getiren ilk beton katmanıdır.",
      "Kalınlığın keyfi artırılması doğru çözüm değildir. Aşırı kazı varsa önce mühendislik onaylı tesviye ve zemin düzeltme yapılmalı, grobeton ise hedef kalınlıkta ve homojen biçimde uygulanmalıdır. Grobetonun işi geometriyi gizlemek değil, geometriyi sabitlemektir.",
      "Grobeton sonrası su yalıtımı, pas payı takozları ve temel donatısı daha güvenli yerleşir. Bu nedenle grobeton, sonraki katmanlar için yalnız zemin hazırlığı değil, kalite zincirinin başlangıç referansıdır.",
    ],
    ruleTable: [
      {
        parameter: "Taban hazırlığı",
        limitOrRequirement: "Grobeton öncesi gevşek zemin, çamur ve su uzaklaştırılmış olmalıdır.",
        reference: "Saha kabul disiplini",
        note: "Kirli taban üstüne dökülen grobeton, sonraki imalatları güvenle taşımaz.",
      },
      {
        parameter: "Kalınlık ve kot",
        limitOrRequirement: "Grobeton kalınlığı projedeki hedefe göre homojen uygulanmalıdır.",
        reference: "Temel uygulama paftası + TS EN 13670 yaklaşımı",
        note: "Kalınlığın farklılaşması, temel alt kotunu ve donatı seviyesini bozar.",
      },
      {
        parameter: "Beton kalitesi",
        limitOrRequirement: "Düşük dayanımlı olsa bile sürekli ve düzgün yerleştirme sağlanmalıdır.",
        reference: "TS EN 206",
        note: "Grobeton kalitesi, üstte kurulacak imalat zincirinin işlenebilirliğini etkiler.",
      },
    ],
    designOrApplicationSteps: [
      "Kazı tabanını son kez ölç, aşırı veya eksik kazı bölgelerini mühendis onayıyla düzelt.",
      "Çamur, gevşek malzeme ve su birikmesini tamamen temizleyerek tabanı grobeton kabulüne hazırla.",
      "Grobeton kalınlığını aplikasyon ve nivo ile kontrol ederek yüzeyi aynı referans düzlemine getir.",
      "Yüzey priz aldıktan sonra aksları, perde sınırlarını ve kritik rezervasyonları yeniden işaretle.",
      "Grobeton üzerine geçilecek yalıtım ve donatı imalatı için hasarsız teslim yüzeyi oluştur.",
    ],
    criticalChecks: [
      "Aşırı kazı alanları grobetonla gizlenmeye çalışılıyor mu?",
      "Grobeton öncesi tabanda serbest su veya çamur kaldı mı?",
      "Yüzey kotu donatı ve yalıtım detaylarına uygun mu?",
      "Grobeton üstü kırılmadan aks işaretleme yapılabildi mi?",
      "Sonraki ekiplerin yüzeyi bozmasını önleyecek koruma planı var mı?",
    ],
    numericalExample: {
      title: "Grobeton metrajı ve sipariş miktarının hızlı hesabı",
      inputs: [
        { label: "Temel altı alan", value: "480 m²", note: "Bodrum oturum alanı" },
        { label: "Grobeton kalınlığı", value: "10 cm", note: "0,10 m" },
        { label: "Teorik hacim", value: "48,0 m³", note: "480 x 0,10" },
        { label: "Sipariş payı", value: "%3", note: "Yüzey kaybı ve tolerans için" },
      ],
      assumptions: [
        "Taban kotu grobeton öncesi düzeltilmiştir.",
        "Yüzey tek parça veya iki yakın parti halinde dökülecektir.",
        "Grobeton kalınlığı proje kararıdır ve tesviye amacıyla büyütülmeyecektir.",
      ],
      steps: [
        {
          title: "Teorik hacmi hesapla",
          formula: "480 x 0,10 = 48,0 m³",
          result: "Grobeton için temel teorik hacim 48,0 m³ çıkar.",
          note: "Bu ilk metraj, taban geometrisi değişmediyse güvenilir bir başlangıç değeridir.",
        },
        {
          title: "Sipariş hacmini belirle",
          formula: "48,0 x 1,03 = 49,44 m³",
          result: "Sahaya yaklaşık 49,5-50,0 m³ sipariş planlamak rasyoneldir.",
          note: "Sipariş farkı, aşırı kazıyı kapatmak için değil saha toleransını yönetmek içindir.",
        },
      ],
      checks: [
        "Metraj artışı aşırı kazı kaynaklıysa teknik ekip önce sebebi çözmelidir.",
        "Grobeton kalınlığı yüzey boyunca ölçüyle doğrulanmalıdır.",
        "Üst yüzey, su yalıtımı ve donatı için temiz bırakılmalıdır.",
      ],
      engineeringComment: "Grobetonda küçük görünen birkaç santimetre fark, radye veya temel donatısında onlarca santimetrelik saha sorununa dönüşebilir.",
    },
    tools: TEMEL_TOOLS,
    equipmentAndMaterials: TEMEL_EQUIPMENT,
    mistakes: [
      { wrong: "Aşırı kazıyı açıklamadan grobeton kalınlığını artırmak.", correct: "Önce zemin düzeltmesini teknik olarak onaylayıp sonra hedef kalınlığa dönmek." },
      { wrong: "Çamurlu ve sulu tabana grobeton dökmek.", correct: "Tabanı tamamen temiz ve kontrollü hale getirerek döküme başlamak." },
      { wrong: "Grobeton üstünü mastarsız ve dalgalı bırakmak.", correct: "Kot ve yüzey düzgünlüğünü ölçüyle tamamlamak." },
      { wrong: "Aks işaretlerini grobeton sonrası yeniden kurmamak.", correct: "Yüzey priz aldıktan sonra aplikasyonu tekrar netleştirmek." },
      { wrong: "Grobeton tamamlanınca koruma yapmadan üstünde ağır trafik oluşturmak.", correct: "Bir sonraki ekip geçişini kontrollü hale getirmek." },
    ],
    designVsField: [
      "Projede birkaç santimetrelik hazırlık katmanı gibi görünen grobeton, sahada temel geometrisinin gerçekten başlayıp başlamadığını gösteren ilk somut kontroldür.",
      "Bu yüzden grobetonun başarısı dayanımından çok, yüzey kalitesi ve kot disiplininde ölçülmelidir.",
    ],
    conclusion: [
      "Grobeton küçük bir imalat gibi görünse de temel kalitesinin sessiz başlangıcıdır. Temiz ve düzgün bir grobeton yüzeyi olmadan sonraki temel katmanlarının verimli ilerlemesi beklenmemelidir.",
    ],
    sources: [...KAZI_LEAF_SOURCES, SOURCE_LEDGER.tsEn206, SOURCE_LEDGER.tsEn13670],
    keywords: ["grobeton", "temel altı hazırlık", "kazı tabanı", "kot kontrolü", "temel öncesi beton"],
  },
  {
    slugPath: "kazi-temel/temel-turleri/temel-donati",
    kind: "topic",
    quote: "Temel donatısı, üst yapıdan gelen kuvvetlerin zemine güvenli aktarımını sağlayan gizli yol ağıdır; okunaklı kurulmazsa iyi beton bile performansını tam gösteremez.",
    tip: "Temel donatısındaki en pahalı hata çoğu zaman yanlış demir kesmek değil; paftada çözülen yük yolunu sahada karıştırıp okunamaz bir demir yığınına dönüştürmektir.",
    intro: [
      "Temel donatısı; radye, tekil veya sürekli temel tipinden bağımsız olarak moment, kesme, zımbalama ve çatlak kontrolünü sağlayan ana betonarme bileşendir. Üstyapının yükleri sahada en önce temel donatısında somutlaşır; bu nedenle burada yapılan hata çoğu zaman beton döküldükten sonra geri alınamaz.",
      "Sahada temel donatısını zorlaştıran konu yalnız metraj büyüklüğü değildir. Filiz yoğunluğu, pas payı takozlarının yetersizliği, alt-üst donatı katmanlarının karışması, bindirme boylarının yanlış yerde yapılması ve rezervasyonlar arasındaki sıkışıklık en sık kalite kırılmalarını üretir. Temel donatısı, paftadaki niyeti sahada okunabilir kılma işidir.",
    ],
    theory: [
      "Temel donatısı iki ana sorunu aynı anda çözer: taşıma ve dayanıklılık. Taşıma açısından eğilme, kesme ve zımbalama bölgelerinde yeterli çelik alanı sağlanmalıdır. Dayanıklılık açısından ise örtü betonu, pas payı ve yerleşim düzeni betonun donatıyı gerçekten sarabilmesine imkan vermelidir. Kağıt üzerinde yeterli görünen bir alan, sahada beton yerleşemiyorsa işlevini kaybeder.",
      "Donatı sürekliliği, özellikle perde-radye birleşimlerinde ve kolon altlarında kritik hale gelir. Bu düğümlerde bindirme, filiz ve ilave donatıların çakışması çok yoğundur. Dolayısıyla sahada yalnız demir saymak yetmez; hangi çeliğin hangi yük yoluna hizmet ettiği okunabilmelidir.",
      "Temel donatısında iyi uygulama, çizimi birebir taklit etmekten fazlasıdır. Donatı sehpası, yürüyüş yolu, pompa hortumu güzergahı, vibratör erişimi ve betonun hangi boşluktan geçeceği düşünülmeden yapılan sık demir yerleşimi projeyi değil riski büyütür.",
    ],
    ruleTable: [
      {
        parameter: "Pas payı ve örtü betonu",
        limitOrRequirement: "Çevre koşulu ve temel tipi için yeterli beton örtüsü sağlanmalıdır.",
        reference: "TS 500, pas payı hükümleri",
        note: "Takozsuz veya ezilmiş donatı, sahada pas payını hızla kaybettirir.",
      },
      {
        parameter: "Bindirme ve ankraj boyu",
        limitOrRequirement: "Donatı ekleri moment ve yoğunluk bölgeleri dikkate alınarak yerleştirilmelidir.",
        reference: "TS 500",
        note: "Eklerin aynı kesitte yığılması zayıf düğüm oluşturur.",
      },
      {
        parameter: "Beton yerleşebilirliği",
        limitOrRequirement: "Donatı aralıkları, vibrasyon ve beton akışını engellemeyecek şekilde okunmalıdır.",
        reference: "TS EN 13670 + saha uygulama disiplini",
        note: "İyi proje, betonun geçemediği kafes kurmaz.",
      },
    ],
    designOrApplicationSteps: [
      "Shop drawing ve büküm listesini aks, kot ve rezervasyonlarla birlikte sahaya indir.",
      "Alt donatı katmanını pas payı takozları ve sehpa sistemi üzerinde proje aralığında kur.",
      "Perde ve kolon filizlerini alt-üst donatı ile çakışmayacak sırada yerleştir.",
      "Bindirme boylarını kritik moment bölgelerinde yığmadan dağıt; foto ve ölçü kaydı al.",
      "Beton öncesi yürüyüş yollarını belirleyip donatının ezilmesini ve pas payı kaybını önle.",
    ],
    criticalChecks: [
      "Alt ve üst donatı katmanları karışmadan okunabiliyor mu?",
      "Pas payı takozları yeterli adet ve dayanımda mı?",
      "Bindirme bölgeleri aynı kesitte yığılmış durumda mı?",
      "Rezervasyon, su yalıtımı ve filiz bölgelerinde beton geçişi mümkün mü?",
      "Beton öncesi donatı üzerinde kontrol ve foto-kayıt tamamlandı mı?",
    ],
    numericalExample: {
      title: "Radye panelinde alt donatı adet hesabının hızlı yorumu",
      inputs: [
        { label: "Panel boyutu", value: "8,0 m x 6,0 m", note: "Tek bir radye paneli" },
        { label: "Donatı aralığı", value: "Ø14 / 15 cm", note: "Her iki doğrultuda alt donatı" },
        { label: "6,0 m yönünde adet", value: "41 çubuk", note: "(6,0 / 0,15) + 1" },
        { label: "8,0 m yönünde adet", value: "54 çubuk", note: "(8,0 / 0,15) + 1 ≈ 54" },
      ],
      assumptions: [
        "Hesap ilk saha kontrolü içindir; bindirme ve fire ayrıca eklenir.",
        "Kenar payları ve örtü betonuna göre net uzunluk ayrıca düzenlenecektir.",
        "Panel içinde büyük rezervasyon bulunmadığı kabul edilmiştir.",
      ],
      steps: [
        {
          title: "Çubuk adetlerini hesapla",
          formula: "(L / s) + 1",
          result: "Panel içinde iki doğrultuda yaklaşık 95 adet ana alt donatı çubuğu beklenir.",
          note: "Bu sayım, sahaya gelen demirin paftayla kabaca uyumunu hızlıca görmek için çok kullanışlıdır.",
        },
        {
          title: "Yoğunluğu beton yerleşebilirliğiyle birlikte yorumla",
          result: "Filiz ve ilave donatı bölgeleri bu temel düzenin üstüne bineceği için yürüyüş ve beton akışı ayrıca çözülmelidir.",
          note: "Yalnız adet doğru diye saha yerleşimi otomatik doğru kabul edilmemelidir.",
        },
      ],
      checks: [
        "Adet hesabı shop drawing ile çelişiyorsa kesim listesi yeniden kontrol edilmelidir.",
        "Bindirme ve filiz yoğunluğu panelin yerel bölgelerinde ayrıca okunmalıdır.",
        "Pas payı ve sehpa detayı metraj kadar önemlidir.",
      ],
      engineeringComment: "Temel donatısında sayı kontrolü, yalnız metraj doğrulaması değil; sahadaki okunabilirliğin ilk hızlı testidir.",
    },
    tools: TEMEL_TOOLS,
    equipmentAndMaterials: TEMEL_EQUIPMENT,
    mistakes: [
      { wrong: "Shop drawing olmadan yalnız statik paftadan sahada demir dizmeye çalışmak.", correct: "Büküm listesi ve yerleşim planını saha diliyle netleştirmek." },
      { wrong: "Pas payı takozlarını yetersiz bırakmak veya kırılan takozları değiştirmemek.", correct: "Örtü betonunu şansa bırakmadan taşıyıcı takoz sistemi kurmak." },
      { wrong: "Bindirme boylarını aynı kesitte toplamak.", correct: "Ekleri kritik bölgelerden uzaklaştırıp dağıtılmış yerleşim yapmak." },
      { wrong: "Filiz, rezervasyon ve donatı çakışmalarını beton günü çözmek.", correct: "Çakışma kontrolünü beton öncesi bitirmek." },
      { wrong: "Beton pompası ve işçi trafiği için yürüyüş yolu bırakmamak.", correct: "Donatıyı koruyacak geçiş planını önceden kurmak." },
    ],
    designVsField: [
      "Paftada çizgiler net ve aralıklıdır; sahada ise aynı düğümde filiz, ilave donatı, sehpa ve su yalıtımı birleşir. Bu yüzden temel donatısı iyi okunmazsa çizimde doğru olan çözüm sahada karmaşaya dönüşebilir.",
      "İyi temel donatısı, demirin çok olmasından değil; yük yolunu bozmayacak ve betonu engellemeyecek şekilde yerleştirilmesinden anlaşılır.",
    ],
    conclusion: [
      "Temel donatısı, üst yapı güvenliğinin zemindeki ilk somut karşılığıdır. Düzenli, okunabilir ve kayıtlı kurulmuş bir donatı sistemi temel betonunun gerçek performansını ortaya çıkarır.",
    ],
    sources: [...KAZI_LEAF_SOURCES, SOURCE_LEDGER.tsEn13670],
    keywords: ["temel donatısı", "pas payı", "bindirme boyu", "radye donatısı", "beton yerleşebilirliği"],
  },
  {
    slugPath: "kazi-temel/temel-turleri/temel-betonlama",
    kind: "topic",
    quote: "Temel betonlama, yalnız beton dökmek değil; saat, sıcaklık, lojistik ve kür zincirini aynı anda yönetmektir.",
    tip: "Temel betonunda en sık hata karışımın laboratuvar kalitesine güvenip, sahadaki sevkiyat ritmi ve kür disiplinini ikinci plana atmaktır.",
    intro: [
      "Temel betonlama, bütün alt hazırlıkların sınandığı andır. Donatı, kalıp, rezervasyon ve yalıtım detayları beton geldikten sonra artık geri alınamaz hale gelir. Bu nedenle temel betonuna başlamadan önce saha lojistiği, beton sınıfı, numune planı, pompa konumu ve kür organizasyonu tek bir operasyon planına bağlanmalıdır.",
      "Özellikle radye veya büyük hacimli sürekli temel dökümlerinde beton kalitesini belirleyen yalnız karışım reçetesi değildir. İrsaliye ritmi, pompa erişimi, vibratör sayısı, iş derzi kararı, hava sıcaklığı ve döküm sonrası ilk saatlerdeki yüzey koruması en az malzeme kadar önemlidir. İyi temel betonu, saha organizasyonunun görünür olduğu betondur.",
    ],
    theory: [
      "Temel betonunda ana mühendislik konusu, taze betonun yerleşebilirliğini yapısal süreklilikle birleştirmektir. Temel elemanları çoğu zaman yoğun donatı, geniş alan ve görece zor erişim barındırır. Bu nedenle betonun döküm sırası, hortum erişimi ve vibrasyon planı önceden kurulmazsa segregasyon, boşluk veya soğuk derz riski artar.",
      "Büyük hacimli dökümlerde termal davranış da önemlidir. Hidratasyon ısısı, yüzey ve iç kısım arasında sıcaklık farkı oluşturarak erken yaş çatlaklarına neden olabilir. Şantiyede her proje için gelişmiş termal model gerekmez; ancak döküm saati, kür örtüsü, güneş ve rüzgar etkisi ile beton sıcaklığının izlenmesi temel kalite kültürünün parçası olmalıdır.",
      "Kür, temel betonlamanın sonradan eklenen değil döküm anında başlayan kısmıdır. Beton dökülür dökülmez yüzey kaybı, güneş ve rüzgar etkisi yönetilmezse en iyi yerleştirme bile beklenen dayanım ve dayanıklılığı vermez. Bu nedenle betonlama ve kür iki ayrı iş değil, aynı işin iki ardışık yarısıdır.",
    ],
    ruleTable: [
      {
        parameter: "Beton kabulü",
        limitOrRequirement: "Beton sınıfı, kıvam, sıcaklık ve sevk süresi irsaliye ve deneylerle doğrulanmalıdır.",
        reference: "TS EN 206",
        note: "Sahaya gelen her transmikser otomatik kabul edilmiş sayılmaz.",
      },
      {
        parameter: "Yerleştirme ve sıkıştırma",
        limitOrRequirement: "Döküm sırası ve vibrasyon planı donatı yoğunluğuna uygun kurulmalıdır.",
        reference: "TS EN 13670",
        note: "Beton yerleşimi planlanmayan dökümde kalite büyük ölçüde şansa kalır.",
      },
      {
        parameter: "Kür ve erken yaş koruması",
        limitOrRequirement: "Beton dökümünü izleyen ilk saatlerde nem ve sıcaklık kaybı sınırlandırılmalıdır.",
        reference: "TS EN 13670 + saha kalite planı",
        note: "Temel betonunun ömrü çoğu zaman ilk günlerde belirlenir.",
      },
    ],
    designOrApplicationSteps: [
      "Beton hacmi, pompa kapasitesi, transmikser çevrim süresi ve vardiya planını döküm öncesi birlikte kur.",
      "İlk gelen araçtan itibaren slump, sıcaklık ve numune alma zincirini aynı ekip tarafından yönet.",
      "Döküm sırasını geniş alanlarda şeritler halinde planlayarak soğuk derz riskini azalt.",
      "Vibratör erişimi zor düğüm bölgelerinde ilave personel ve yedek ekipman bulundur.",
      "Beton yüzeyi kapanır kapanmaz kür örtüsü, su püskürtme veya uygun koruma yöntemini devreye al.",
    ],
    criticalChecks: [
      "Sevkiyat aralıkları pompanın sürekli çalışmasına izin veriyor mu?",
      "Yoğun donatı bölgelerinde vibratör gerçekten her noktaya erişebiliyor mu?",
      "Numune alma ve irsaliye takibi aynı kayıt setinde tutuluyor mu?",
      "İş derzi oluşma riski görülen alanlarda teknik karar önceden verildi mi?",
      "Beton sonrası ilk saatler için kür malzemesi sahada hazır mı?",
    ],
    numericalExample: {
      title: "Radye döküm süresi için basit lojistik hesabı",
      inputs: [
        { label: "Radye alanı", value: "650 m²", note: "Tek parça döküm" },
        { label: "Radye kalınlığı", value: "45 cm", note: "0,45 m" },
        { label: "Toplam beton hacmi", value: "292,5 m³", note: "650 x 0,45" },
        { label: "Etkili pompa kapasitesi", value: "32 m³/saat", note: "Sahadaki gerçekçi hız" },
      ],
      assumptions: [
        "Beton sevkiyatı kesintisiz sürdürülecektir.",
        "Pompa konumu tüm alanı erişebilir kabul edilmiştir.",
        "Numune alma ve küçük beklemeler etkili kapasiteye dahil edilmiştir.",
      ],
      steps: [
        {
          title: "Toplam süreyi hesapla",
          formula: "292,5 / 32 = 9,14 saat",
          result: "Tek pompa ile döküm yaklaşık 9 saatten uzun sürecektir.",
          note: "Bu süre, sıcak hava ve iş derzi riski açısından ayrı değerlendirilmelidir.",
        },
        {
          title: "Lojistik kararını ver",
          result: "Gerekirse ikinci pompa, gece dökümü veya etaplama seçeneği teknik kurulda kararlaştırılmalıdır.",
          note: "Karışım kalitesi iyi olsa bile lojistik yavaşsa temel betonu risk altına girer.",
        },
      ],
      checks: [
        "Döküm süresi vardiya ve hava koşulu ile birlikte değerlendirilmelidir.",
        "Etkili pompa kapasitesi kağıt üzerindeki maksimum kapasite ile karıştırılmamalıdır.",
        "Kür organizasyonu uzun dökümlerde daha başlamadan hazır olmalıdır.",
      ],
      engineeringComment: "Temel betonunda kalite çoğu zaman laboratuvarda değil, transmikser ritmi ile kür örtüsü arasındaki koordinasyonda kaybedilir.",
    },
    tools: TEMEL_TOOLS,
    equipmentAndMaterials: TEMEL_EQUIPMENT,
    mistakes: [
      { wrong: "Beton sevkiyat planını santral ile döküm sabahı netleştirmeye çalışmak.", correct: "Hacim ve çevrim süresine göre lojistiği önceden kilitlemek." },
      { wrong: "Kıvamı sahada su ilavesiyle ayarlamak.", correct: "İrsaliye ve deney sonucu uygun olmayan aracı teknik prosedüre göre değerlendirmek." },
      { wrong: "Yoğun donatı bölgelerinde vibrasyon yetersizliğini fark etmeyip döküme devam etmek.", correct: "Zor düğümlerde ilave ekipman ve personel planlamak." },
      { wrong: "İş derzi riskini döküm sırasında spontane kararla bırakmak.", correct: "Olası derz yerini ve detayını önceden tanımlamak." },
      { wrong: "Beton priz almadan önce kür hazırlığını başlatmamak.", correct: "Kür malzemesini ve görev dağılımını döküm öncesi hazır etmek." },
    ],
    designVsField: [
      "Statik projede temel betonlama tek bir kalınlık ve beton sınıfı olarak görünür; sahada ise döküm süresi, hortum erişimi, sıcaklık ve kür kalitesi aynı kesitin gerçek performansını belirler.",
      "Bu yüzden temel betonlamayı malzeme kararı değil, operasyon kararı olarak görmek gerekir.",
    ],
    conclusion: [
      "Temel betonlama, hazırlığı zayıfsa telafisi en zor imalatlardan biridir. İyi lojistik, iyi yerleştirme ve kesintisiz kür zinciri kurulduğunda ise temel sistemi tasarımdaki performansa çok daha yakın davranır.",
    ],
    sources: [...KAZI_LEAF_SOURCES, SOURCE_LEDGER.tsEn206, SOURCE_LEDGER.tsEn13670],
    keywords: ["temel betonlama", "radye dökümü", "beton lojistiği", "kür", "iş derzi kontrolü"],
  },
  {
    slugPath: "kazi-temel/temel-turleri/temel-su-yalitimi",
    kind: "topic",
    quote: "Temel su yalıtımı, toprak altında görünmeyen ama yapının en uzun vadeli konfor ve dayanıklılık kararlarından birini taşıyan kabuktur.",
    tip: "Su yalıtımında en pahalı hata membranı uygulamak değil; sürekliliği bozacak köşe, soğuk derz ve tesisat geçişlerini detaysız bırakmaktır.",
    intro: [
      "Temel su yalıtımı, bodrumlu ve toprakla temas eden yapılarda su, nem ve kimyasal etkilerin taşıyıcı sisteme ulaşmasını sınırlayan koruma sistemidir. Temel altı bohçalama, perde dışı membran, su tutucu bantlar, koruma levhası ve drenaj katmanları bu paketin farklı parçalarıdır. Paket eksik kurulduğunda su kendine en zayıf detayı bulur.",
      "Şantiyede temel su yalıtımının önemi çoğu zaman dolgu tamamlandıktan sonra anlaşılır; çünkü hataların büyük kısmı artık görünmez haldedir. Bu nedenle yalıtım işinin başarısı yalnız ürün seçimine değil; yüzey hazırlığına, detay çözümüne, foto-kayıta ve dolgu öncesi korumaya dayanır. Görünmeyen işlerde kayıt kültürü, ürün kadar önemlidir.",
    ],
    theory: [
      "Toprak altındaki su etkisi iki temel biçimde görülür: sürekli nem ve hidrostatik basınç. Sürekli nem durumunda bile beton içindeki mikro boşluklardan hareket eden su zamanla kapiler nem, korozyon ve iç yüzey problemleri oluşturabilir. Basınçlı suda ise sorun yalnız sızıntı değil, membran ek yerleri ve birleşimlerde sistemin zorlanmasıdır.",
      "Temel su yalıtımında süreklilik ana kavramdır. Radye altı membran, perde dönüşü, soğuk derz waterstop'u, boru geçişleri ve koruma levhaları tek sistem gibi çalışmalıdır. Bir detay koparsa sistemin en pahalı ürünü bile başarısız görünür. Bu nedenle detay çözümü ürün seçiminden önce gelir.",
      "Sahada yalıtımın en büyük düşmanı acele dolgu ve kirli yüzeydir. Nemli, tozlu veya pürüzlü zemin üstüne uygulanan membran gerektiği gibi aderans kurmaz; koruma levhası konmadan yapılan dolgu ise uygulamayı mekanik olarak zedeler. Temel su yalıtımı uygulaması, dolgu öncesi son teknik denetim gibi düşünülmelidir.",
    ],
    ruleTable: [
      {
        parameter: "Yüzey hazırlığı",
        limitOrRequirement: "Uygulama yüzeyi temiz, kuruya yakın, düzgün ve keskin çıkıntılardan arındırılmış olmalıdır.",
        reference: "TS EN 13969 + sistem uygulama şartnamesi",
        note: "Kirli ve pürüzlü yüzeyde yalıtımın sürekliliği daha ilk anda zayıflar.",
      },
      {
        parameter: "Detay sürekliliği",
        limitOrRequirement: "Köşe dönüşleri, soğuk derzler, tesisat geçişleri ve perde-radye birleşimleri tek paket olarak çözülmelidir.",
        reference: "Yapı denetim kabul disiplini + sistem detayı",
        note: "Düz yüzeyde iyi görünen bir uygulama detay düğümlerinde kaybedilebilir.",
      },
      {
        parameter: "Koruma ve dolgu",
        limitOrRequirement: "Yalıtım tamamlandıktan sonra koruma katmanı kurulmadan dolguya geçilmemelidir.",
        reference: "Saha kalite planı",
        note: "Mekanik hasar gören membran, dolgu sonrası tespiti en zor kusurlardan biridir.",
      },
    ],
    designOrApplicationSteps: [
      "Su etkisi seviyesini zemin raporu ve saha gözlemiyle belirleyip uygun yalıtım sistemini seç.",
      "Grobeton veya perde yüzeyini temiz, yuvarlatılmış köşeli ve detay uygulamasına uygun hale getir.",
      "Boru geçişi, soğuk derz, perde-radye birleşimi ve dilatasyon noktalarını ana detaylarla birlikte uygula.",
      "Yalıtım sürekliliğini foto-kayıt ve mümkün olan yerlerde saha testi ile doğrula.",
      "Koruma levhası ve drenaj katmanı tamamlanmadan geri dolguya izin verme.",
    ],
    criticalChecks: [
      "Yalıtım yüzeyinde toz, gevşek parça veya nem fazlalığı var mı?",
      "Perde-radye dönüşlerinde keskin kırılma veya eksik pah bırakıldı mı?",
      "Tesisat geçişleri ve su tutucu bantlar detayına uygun kapatıldı mı?",
      "Koruma levhası olmadan dolgu yapma baskısı oluşuyor mu?",
      "Dolgu öncesi tüm görünmeyen yüzeyler foto ve kontrol formu ile kayıt altına alındı mı?",
    ],
    numericalExample: {
      title: "Su basıncının detaya neden önem verdiğini gösteren hızlı örnek",
      inputs: [
        { label: "Yeraltı su seviyesi farkı", value: "2,5 m", note: "Radye alt kotuna göre" },
        { label: "Su birim hacim ağırlığı", value: "9,81 kN/m³", note: "Yaklaşık değer" },
        { label: "Hidrostatik basınç", value: "24,5 kPa", note: "9,81 x 2,5" },
        { label: "Kritik detay", value: "Perde-radye birleşimi", note: "En zayıf düğüm örneği" },
      ],
      assumptions: [
        "Su seviyesi dönemsel olarak korunmaktadır.",
        "Yalıtım sistemi basınçlı suya uygun olarak seçilmiştir.",
        "Detay çözümü ana membran sistemi ile uyumludur.",
      ],
      steps: [
        {
          title: "Basıncı hesapla",
          formula: "9,81 x 2,5 = 24,5 kPa",
          result: "Temel kabuğu yaklaşık 24,5 kPa su basıncı etkisine maruz kalabilir.",
          note: "Bu değer küçük görünse de sürekliliği bozulmuş bir ek yerinde ciddi sızıntı riski üretir.",
        },
        {
          title: "Detay önemini yorumla",
          result: "Ana yüzey kadar köşe, boru geçişi ve soğuk derz detayları da aynı özenle çözülmelidir.",
          note: "Su, geniş yüzeyden çok zayıf detaydan içeri girmeye eğilimlidir.",
        },
      ],
      checks: [
        "Su seviyesi bilgisi yalnız raporda kalmamalı, sahada da izlenmelidir.",
        "Basınçlı su ihtimali varsa detaylar standart kuru bodrum mantığıyla geçilmemelidir.",
        "Koruma katmanı yapılmadan sistem tamamlandı sayılmamalıdır.",
      ],
      engineeringComment: "Temel su yalıtımında ürün kalitesi kadar, suyun ilk bulacağı zayıf detayın önceden düşünülüp düşünülmediği belirleyicidir.",
    },
    tools: TEMEL_TOOLS,
    equipmentAndMaterials: TEMEL_EQUIPMENT,
    mistakes: [
      { wrong: "Kirli ve pürüzlü yüzey üzerine membran uygulamak.", correct: "Yüzeyi uygulama şartına getirip sonra yalıtıma başlamak." },
      { wrong: "Perde-radye köşelerini keskin bırakmak.", correct: "Pah veya uygun detay ile membran dönüşünü güvenli hale getirmek." },
      { wrong: "Boru geçişlerini ustanın sahadaki çözümüne bırakmak.", correct: "Geçiş detayını sistem bileşeniyle birlikte önceden tanımlamak." },
      { wrong: "Koruma levhası olmadan dolguya başlamak.", correct: "Yalıtımı mekanik hasardan koruyacak katmanı önce kurmak." },
      { wrong: "Görünmeyen detayları foto-kayıtsız kapatmak.", correct: "Dolgu öncesi tüm kritik düğümleri dosyalamak." },
    ],
    designVsField: [
      "Projede su yalıtımı tek bir tarama veya katman gibi görünür; sahada ise her köşe, her boru çıkışı ve her dolgu kovası bu katmanın gerçekten süreklilik taşıyıp taşımadığını sınar.",
      "Bu yüzden temel su yalıtımı, ürün seçimi kadar görünmeyen detayların kayıt kültürüyle uygulanması işidir.",
    ],
    conclusion: [
      "Temel su yalıtımı iyi yapıldığında yapının yıllar süren konfor ve dayanıklılık performansını korur. Detaysız, kayıtsız veya korumasız bırakıldığında ise sorun çoğu zaman yapı kullanıma açıldıktan sonra görünür hale gelir.",
    ],
    sources: [...KAZI_LEAF_SOURCES, SOURCE_LEDGER.tsEn13969, SOURCE_LEDGER.yapiDenetim],
    keywords: ["temel su yalıtımı", "bohçalama", "perde-radye detayı", "hidrostatik basınç", "koruma levhası"],
  },
];
